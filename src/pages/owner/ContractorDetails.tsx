import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '../../components/molecules/Header';
import { ErrorDisplay } from '../../components/molecules/ErrorDisplay';
import { ArrowIcon } from '../../components/atoms/ArrowIcon';
import { getContractorPayments, supabase } from '../../lib/supabase';
import { ReceiptDownloadButton } from '../../lib/generateReceipt';
import type { Contractor, Payment } from '../../types/database';
import toast from 'react-hot-toast';

export const ContractorDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const { data: contractorData, error: contractorError } = await supabase
          .from('contractors')
          .select('*')
          .eq('id', id)
          .single();

        if (contractorError) throw contractorError;
        setContractor(contractorData);

        const paymentsData = await getContractorPayments(id);
        setPayments(paymentsData);
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
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="契約者詳細" />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">読み込み中...</div>
        </main>
      </div>
    );
  }

  if (!contractor) {
    return (
      <div className="min-h-screen">
        <Header title="契約者詳細" />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-red-600">契約者が見つかりません</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title={`${contractor.name}さんの詳細`} />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {error && <ErrorDisplay error={error} />}

        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
          <div className="border-b border-gray-200 pb-4 mb-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">基本情報</h2>
              <Link
                to="/owner"
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                一覧に戻る
                <ArrowIcon />
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">契約者名</p>
                <p className="text-sm font-medium">{contractor.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">駐車場番号</p>
                <p className="text-sm font-medium">{contractor.parking_number}</p>
              </div>
            </div>
          </div>

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
      </main>
    </div>
  );
};
