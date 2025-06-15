import { useEffect, useState } from 'react';
import { Container, Title, Table, Button, Group, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/database';

type Contractor = Database['public']['Tables']['contractors']['Row'] & {
  latest_payment?: string | null;
  unpaid_months?: number;
};

const Dashboard = () => {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContractors = async () => {
      try {
        // 契約者情報の取得
        const { data: contractorsData, error: contractorsError } = await supabase
          .from('contractors')
          .select('*')
          .order('parking_number');

        if (contractorsError) throw contractorsError;

        // 各契約者の最新の支払い情報を取得
        const contractorsWithPayments = await Promise.all(
          (contractorsData || []).map(async (contractor) => {
            const { data: payments } = await supabase
              .from('payments')
              .select('paid_at, year, month')
              .eq('contractor_id', contractor.id)
              .order('year desc, month desc')
              .limit(1);

            const latestPayment = payments && payments[0];

            // 未払い月数の計算
            let unpaidMonths = 0;
            if (latestPayment) {
              const today = new Date();
              const lastPaidDate = new Date(
                latestPayment.year,
                latestPayment.month - 1
              );
              const monthsDiff =
                (today.getFullYear() - lastPaidDate.getFullYear()) * 12 +
                (today.getMonth() - lastPaidDate.getMonth());
              unpaidMonths = Math.max(0, monthsDiff - 1); // 当月を除く
            }

            return {
              ...contractor,
              latest_payment: latestPayment?.paid_at || null,
              unpaid_months: unpaidMonths,
            };
          })
        );

        setContractors(contractorsWithPayments);
      } catch (err) {
        setError(err instanceof Error ? err.message : '読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchContractors();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const createContractorLink = (name: string) => {
    // URLに使用できない文字をエンコード
    return `/contractor/${encodeURIComponent(name)}`;
  };

  return (
    <Container size="xl">
      <Title order={2} mb="lg">
        契約者一覧
      </Title>

      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>区画番号</Table.Th>
            <Table.Th>契約者名</Table.Th>
            <Table.Th>連絡先</Table.Th>
            <Table.Th>最終支払日</Table.Th>
            <Table.Th>未払い月数</Table.Th>
            <Table.Th></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {contractors.map((contractor) => (
            <Table.Tr key={contractor.id}>
              <Table.Td>{contractor.parking_number}</Table.Td>
              <Table.Td>{contractor.name}</Table.Td>
              <Table.Td>{contractor.phone}</Table.Td>
              <Table.Td>
                {contractor.latest_payment
                  ? new Date(contractor.latest_payment).toLocaleDateString()
                  : '-'}
              </Table.Td>
              <Table.Td>
                <Text c={contractor.unpaid_months ? 'red' : 'inherit'}>
                  {contractor.unpaid_months || 0}ヶ月
                </Text>
              </Table.Td>
              <Table.Td>
                <Group justify="flex-end">
                  <Button
                    component={Link}
                    to={createContractorLink(contractor.name)}
                    size="xs"
                  >
                    詳細
                  </Button>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Container>
  );
};

export default Dashboard;
