import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '../../components/molecules/Header';
import { ErrorDisplay } from '../../components/molecules/ErrorDisplay';
import { PaymentButton } from '../../components/atoms/PaymentButton';
import { getContractorByName, getContractorPayments } from '../../lib/supabase';
import { createPaymentSession } from '../../lib/api';
import { ReceiptDownloadButton } from '../../lib/generateReceipt';
import type { Contractor, Payment } from '../../types/database';
import toast from 'react-hot-toast';

export const ContractorPage = () => {
  const { name } = useParams<{ name: string }>();
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!name) return;

      try {
        const contractorData = await getContractorByName(name);
        setContractor(contractorData);

        if (contractorData) {
          const paymentsData = await getContractorPayments(contractorData.id);
          setPayments(paymentsData);
        }
        setError(null);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error as Error);
        toast.error('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [name]);

  const getCurrentMonthYear = () => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    };
  };

  const getUnpaidMonths = () => {
    const { year, month } = getCurrentMonthYear();

    // 過去12ヶ月分の期間を生成
    const periods: { year: number; month: number }[] = [];
    let currentYear = year;
    let currentMonth = month;

    // 現在から過去12ヶ月分のチェック期間を生成
    for (let i = 0; i < 12; i++) {
      periods.push({ year: currentYear, month: currentMonth });
      currentMonth--;
      if (currentMonth === 0) {
        currentYear--;
        currentMonth = 12;
      }
    }

    // 各期間について支払い済みかどうかをチェック
    const unpaidMonths = periods.filter(period => {
      return !payments.some(payment =>
        payment.year === period.year && payment.month === period.month
      );
    });

    // 年月の文字列形式に変換して、古い順にソート
    return unpaidMonths
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      })
      .map(period => `${period.year}年${period.month}月`);
  };

  const handlePayment = async () => {
    if (!contractor) return;

    setIsProcessing(true);
    const monthlyPrice = Number(import.meta.env.VITE_MONTHLY_PRICE) || 3500;
    const amount = monthlyPrice * selectedMonths;

    try {
      const result = await createPaymentSession(
        contractor.id,
        selectedMonths,
        amount
      );

      if (result.success) {
        // 支払い履歴を再取得
        const updatedPayments = await getContractorPayments(contractor.id);
        setPayments(updatedPayments);
        toast.success('支払いが完了しました');
      } else {
        throw new Error('支払い処理に失敗しました');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('支払い処理に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="契約者ページ" />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">読み込み中...</div>
        </main>
      </div>
    );
  }

  if (!contractor) {
    return (
      <div className="min-h-screen">
        <Header title="契約者ページ" />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-red-600">契約者が見つかりません</div>
        </main>
      </div>
    );
  }

  const unpaidMonths = getUnpaidMonths();
  const monthlyPrice = Number(import.meta.env.VITE_MONTHLY_PRICE) || 3500;

  return (
    <div className="min-h-screen">
      <Header title={`${contractor.name}さんの支払いページ`} />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {error && <ErrorDisplay error={error} />}

        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
          <div className="border-b border-gray-200 pb-4 mb-4">
            <h2 className="text-lg font-semibold">駐車場情報</h2>
            <p className="mt-2 text-sm text-gray-600">
              駐車場番号: {contractor.parking_number}
            </p>
          </div>

          {unpaidMonths.length > 0 ? (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-red-600 mb-4">未払い月</h2>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {unpaidMonths.map((month) => (
                  <li key={month}>{month}</li>
                ))}
              </ul>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  支払い月数を選択
                </label>
                <div className="flex items-center gap-4">
                  <select
                    value={selectedMonths}
                    onChange={(e) => setSelectedMonths(Number(e.target.value))}
                    className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    disabled={isProcessing}
                  >
                    {[...Array(Math.min(unpaidMonths.length, 12))].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}ヶ月分
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-600">
                    合計: ¥{(monthlyPrice * selectedMonths).toLocaleString()}
                  </span>
                </div>

                <PaymentButton
                  onClick={handlePayment}
                  isProcessing={isProcessing}
                />
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <p className="text-sm text-gray-500">未払いの月はありません。</p>
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold mb-4">支払い履歴</h2>
            {payments.length === 0 ? (
              <p className="text-sm text-gray-500">支払い履歴がありません</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {payments.map((payment) => (
                  <li key={payment.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">
                        {payment.year}年{payment.month}月分
                      </p>
                      <p className="text-sm text-gray-500">
                        支払日: {new Date(payment.paid_at).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm">
                        ¥{payment.amount.toLocaleString()}
                      </span>
                      <ReceiptDownloadButton
                        payment={payment}
                        contractor={contractor}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
