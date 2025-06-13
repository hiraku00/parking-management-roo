import { supabase } from './supabase';
import type { Payment } from '../types/database';

interface CreatePaymentParams {
  contractorId: string;
  year: number;
  month: number;
  amount: number;
}

// 将来的にはStripe Checkoutセッションの作成とWebhook処理を実装
export const createPaymentSession = async (
  contractorId: string,
  months: number,
  amount: number
): Promise<{ success: boolean }> => {
  try {
    // 現在の支払い状況を取得
    const { data: existingPayments } = await supabase
      .from('payments')
      .select('year, month')
      .eq('contractor_id', contractorId)
      .order('year', { ascending: true })
      .order('month', { ascending: true });

    // 支払い対象月を特定（未払いの古い月から）
    const { unpaidMonths } = getUnpaidMonths(existingPayments || []);
    const monthsToProcess = unpaidMonths.slice(0, months);

    if (monthsToProcess.length === 0) {
      throw new Error('支払い対象の月が見つかりません');
    }

    const monthlyAmount = amount / months;

    // 支払いデータを作成
    const paymentPromises = monthsToProcess.map(({ year, month }) =>
      createPayment({
        contractorId,
        year,
        month,
        amount: monthlyAmount,
      })
    );

    await Promise.all(paymentPromises);
    return { success: true };
  } catch (error) {
    console.error('Payment session creation failed:', error);
    return { success: false };
  }
};

// 支払いデータの作成（Stripe Webhook処理時に使用）
export const createPayment = async ({
  contractorId,
  year,
  month,
  amount,
}: CreatePaymentParams): Promise<Payment> => {
  // 既存の支払いをチェック
  const { data: existing } = await supabase
    .from('payments')
    .select('id')
    .eq('contractor_id', contractorId)
    .eq('year', year)
    .eq('month', month)
    .single();

  if (existing) {
    throw new Error(`支払い済みの月です: ${year}年${month}月`);
  }

  const { data, error } = await supabase
    .from('payments')
    .insert({
      contractor_id: contractorId,
      year,
      month,
      amount,
      paid_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// 未払い月を取得するユーティリティ関数
const getUnpaidMonths = (existingPayments: { year: number; month: number }[]) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // 過去12ヶ月分の期間を生成
  const periods: { year: number; month: number }[] = [];
  let year = currentYear;
  let month = currentMonth;

  for (let i = 0; i < 12; i++) {
    periods.push({ year, month });
    month--;
    if (month === 0) {
      year--;
      month = 12;
    }
  }

  // 支払い済みの月を除外
  const unpaidMonths = periods.filter(period =>
    !existingPayments.some(payment =>
      payment.year === period.year && payment.month === period.month
    )
  );

  // 古い順にソート
  const sortedUnpaidMonths = unpaidMonths.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  return {
    unpaidMonths: sortedUnpaidMonths,
    count: sortedUnpaidMonths.length,
  };
};
