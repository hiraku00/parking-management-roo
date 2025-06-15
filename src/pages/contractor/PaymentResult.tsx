import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../../components/molecules/Header';
import { getContractorByName } from '../../lib/supabase';
import type { Contractor } from '../../types/database';
import toast from 'react-hot-toast';

export const PaymentResult = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContractor = async () => {
      if (!name) return;

      try {
        const data = await getContractorByName(name);
        setContractor(data);

        if (data) {
          toast.success('支払いが完了しました');
          // 3秒後に元のページに戻る
          setTimeout(() => {
            navigate(`/contractor/${name}`);
          }, 3000);
        }
      } catch (error) {
        console.error('Error fetching contractor:', error);
        toast.error('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchContractor();
  }, [name, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="支払い結果" />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">読み込み中...</div>
        </main>
      </div>
    );
  }

  if (!contractor) {
    return (
      <div className="min-h-screen">
        <Header title="支払い結果" />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-red-600">契約者が見つかりません</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="支払い完了" />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-green-600 mb-4">
              支払いが完了しました
            </h2>
            <p className="text-gray-600 mb-4">
              {contractor.name}さんの支払い処理が正常に完了しました。
              まもなく契約者ページに戻ります。
            </p>
            <button
              onClick={() => navigate(`/contractor/${name}`)}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              契約者ページに戻る
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
