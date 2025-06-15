import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { stripe } from '../_shared/stripe.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // CORSヘッダーを設定
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, stripe-signature, Authorization',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('No stripe signature found');
    }

    const body = await req.text();
    console.log('Webhook received:', {
      timestamp: new Date().toISOString(),
      signature: signature.substring(0, 8),
      bodyLength: body.length,
    });

    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('Webhook secret is not configured');
    }

    // 非同期でイベントを検証
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    console.log('Processing webhook event:', {
      timestamp: new Date().toISOString(),
      id: event.id,
      type: event.type,
    });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Checkout session completed:', {
          timestamp: new Date().toISOString(),
          id: session.id,
          metadata: session.metadata,
          amount_total: session.amount_total,
          payment_intent: session.payment_intent,
        });

        if (!session.metadata?.contractor_id || !session.metadata?.months || !session.amount_total) {
          console.error('Invalid session data:', {
            contractor_id: session.metadata?.contractor_id,
            months: session.metadata?.months,
            amount_total: session.amount_total,
          });
          throw new Error('Missing required session data');
        }

        const contractorId = session.metadata.contractor_id;
        const months = parseInt(session.metadata.months);
        const amountPerMonth = Math.floor(session.amount_total / months);

        const records = [];
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        // 過去12ヶ月分の期間を生成（古い順）
        const periods: { year: number; month: number }[] = [];
        for (let i = 12; i > 0; i--) {
          let year = currentYear;
          let month = currentMonth - i;

          // 月が0以下の場合は前年に調整
          if (month <= 0) {
            year--;
            month += 12;
          }

          periods.push({ year, month });
        }

        // 既存の支払いを取得
        const { data: existingPayments } = await supabaseClient
          .from('payments')
          .select('year, month')
          .eq('contractor_id', contractorId);

        // 未払いの月を特定（古い順）
        const unpaidPeriods = periods.filter(period =>
          !existingPayments?.some(payment =>
            payment.year === period.year && payment.month === period.month
          )
        );

        // 指定された月数分だけ処理
        for (let i = 0; i < Math.min(months, unpaidPeriods.length); i++) {
          const period = unpaidPeriods[i];
          records.push({
            contractor_id: contractorId,
            amount: amountPerMonth,
            year: period.year,
            month: period.month,
            paid_at: now.toISOString(),
            stripe_payment_intent_id: session.payment_intent,
            stripe_session_id: session.id
          });
        }

        if (records.length === 0) {
          console.log('No new payment records to create:', {
            timestamp: new Date().toISOString(),
            contractorId,
            months,
          });
          break;
        }

        console.log('Creating payment records:', {
          timestamp: new Date().toISOString(),
          contractorId,
          months,
          amountPerMonth,
          recordCount: records.length,
          firstRecord: records[0],
          lastRecord: records[records.length - 1],
        });

        // バッチで支払い記録を保存
        const { error: paymentError } = await supabaseClient
          .from('payments')
          .insert(records);

        if (paymentError) {
          console.error('Payment insert error:', {
            timestamp: new Date().toISOString(),
            error: paymentError,
            records: records,
          });
          throw new Error('Failed to save payment information');
        }

        console.log('Payment records created successfully:', {
          timestamp: new Date().toISOString(),
          count: records.length,
        });
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
      }),
      { headers, status: 200 }
    );
  } catch (error) {
    console.error('Webhook error:', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
      } : error,
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      { headers, status: 400 }
    );
  }
}, { auth: { enabled: false } });
