import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/molecules/Header';
import { ErrorDisplay } from '../../components/molecules/ErrorDisplay';
import { ArrowIcon } from '../../components/atoms/ArrowIcon';
import { getAllContractors, getContractorPayments } from '../../lib/supabase';
import type { Contractor, Payment } from '../../types/database';
import toast from 'react-hot-toast';

interface ContractorWithPayments extends Contractor {
  latestPayment?: Payment;
}

export const OwnerDashboard = () => {
  const [contractors, setContractors] = useState<ContractorWithPayments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const contractorsData = await getAllContractors();
        const contractorsWithPayments = await Promise.all(
          contractorsData.map(async (contractor) => {
            try {
              const payments = await getContractorPayments(contractor.id);
              return {
                ...contractor,
                latestPayment: payments[0],
              };
            } catch (paymentError) {
              console.error(`Error fetching payments for ${contractor.name}:`, paymentError);
              return {
                ...contractor,
                latestPayment: undefined,
              };
            }
          })
        );
        setContractors(contractorsWithPayments);
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
  }, []);

  const getCurrentMonthYear = () => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    };
  };

  const isPaymentOverdue = (payment?: Payment) => {
    if (!payment) return true;
    const { year, month } = getCurrentMonthYear();
    return payment.year < year || (payment.year === year && payment.month < month);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="オーナーダッシュボード" />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">読み込み中...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="オーナーダッシュボード" />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {error && <ErrorDisplay error={error} />}

        {contractors.length === 0 && !error ? (
          <div className="text-center text-gray-500 mt-4">
            契約者が登録されていません
          </div>
        ) : (
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
            <ul role="list" className="divide-y divide-gray-100">
              {contractors.map((contractor) => (
                <li key={contractor.id} className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6">
                  <div className="flex min-w-0 gap-x-4">
                    <div className="min-w-0 flex-auto">
                      <p className="text-sm font-semibold leading-6 text-gray-900">
                        <Link to={`/owner/contractor/${contractor.id}`} className="hover:underline">
                          {contractor.name}
                        </Link>
                      </p>
                      <p className="mt-1 text-xs leading-5 text-gray-500">
                        駐車場番号: {contractor.parking_number}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-x-4">
                    <div className="hidden sm:flex sm:flex-col sm:items-end">
                      <p
                        className={`text-sm leading-6 ${
                          isPaymentOverdue(contractor.latestPayment)
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {isPaymentOverdue(contractor.latestPayment)
                          ? '未払い'
                          : '支払い済み'}
                      </p>
                      {contractor.latestPayment && (
                        <p className="mt-1 text-xs leading-5 text-gray-500">
                          最終支払: {contractor.latestPayment.year}年{contractor.latestPayment.month}月
                        </p>
                      )}
                    </div>
                    <ArrowIcon />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
};
