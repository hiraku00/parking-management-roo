import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { stripe } from '../_shared/stripe.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Received request:', req.method);
    const body = await req.text();
    console.log('Request body:', body);

    const { contractorId, amount, months } = JSON.parse(body);
    console.log('Parsed parameters:', { contractorId, amount, months });

    if (!contractorId || !amount || !months) {
      throw new Error('Missing required parameters');
    }

    // 契約者情報の取得
    const { data: contractor, error: contractorError } = await supabaseClient
      .from('contractors')
      .select('name, parking_number')
      .eq('id', contractorId)
      .single();

    if (contractorError) {
      console.error('Contractor fetch error:', contractorError);
      throw new Error('Contractor not found');
    }

    if (!contractor) {
      throw new Error('Contractor not found');
    }

    console.log('Contractor data:', contractor);

    const frontendUrl = Deno.env.get('FRONTEND_URL');
    if (!frontendUrl) {
      throw new Error('FRONTEND_URL is not set');
    }

    console.log('Using frontend URL:', frontendUrl);

    // URLの構築
    const encodedName = encodeURIComponent(contractor.name);
    const baseSuccessUrl = `${frontendUrl}/contractor/${encodedName}/payment/success`;
    const baseCancelUrl = `${frontendUrl}/contractor/${encodedName}`;

    // クエリパラメータの追加
    const successUrl = `${baseSuccessUrl}?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = baseCancelUrl;

    console.log('Generated URLs:', {
      success: successUrl,
      cancel: cancelUrl,
    });

    // Stripeセッションの作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: `駐車場利用料 ${months}ヶ月分`,
              description: `駐車場番号: ${contractor.parking_number}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        contractor_id: contractorId,
        months: months.toString(),
      },
    });

    console.log('Created Stripe session:', {
      id: session.id,
      urls: {
        success: session.success_url,
        cancel: session.cancel_url,
      },
    });

    // 正常なレスポンスを返す
    return new Response(
      JSON.stringify({
        success: true,
        sessionId: session.id
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Checkout error:', error);
    // エラーレスポンスを返す
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400,
      }
    );
  }
});
