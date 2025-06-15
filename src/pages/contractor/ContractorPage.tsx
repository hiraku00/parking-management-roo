import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Container, Title, Card, Text, Group, Button, Table, NumberInput, Stack, Divider } from '@mantine/core';
import { supabase } from '../../lib/supabase';
import { createCheckoutSession } from '../../lib/stripe';
import type { Database } from '../../types/database';

type Contractor = Database['public']['Tables']['contractors']['Row'];
type Payment = Database['public']['Tables']['payments']['Row'];

const ContractorPage = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState(1);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const monthlyPrice = parseInt(import.meta.env.VITE_MONTHLY_PRICE || '3500');

  useEffect(() => {
    const fetchContractorAndPayments = async () => {
      try {
        if (!name) throw new Error('契約者名が指定されていません');

        // URLエンコードされた名前をデコード
        const decodedName = decodeURIComponent(name);
        console.log('Fetching contractor:', { encoded: name, decoded: decodedName });

        // 契約者情報の取得
        const { data: contractorData, error: contractorError } = await supabase
          .from('contractors')
          .select('*')
          .eq('name', decodedName)
          .single();

        if (contractorError) {
          console.error('Contractor fetch error:', contractorError);
          throw contractorError;
        }
        if (!contractorData) throw new Error('契約者が見つかりません');

        setContractor(contractorData);

        // 支払い履歴の取得
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select()
          .eq('contractor_id', contractorData.id)
          .order('year', { ascending: false })
          .order('month', { ascending: false });

        if (paymentsError) {
          console.error('Payments fetch error:', paymentsError);
          throw paymentsError;
        }
        setPayments(paymentsData || []);

      } catch (err) {
        console.error('Error in fetchContractorAndPayments:', err);
        setError(err instanceof Error ? err.message : '読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchContractorAndPayments();
  }, [name]);

  const handlePayment = async () => {
    if (!contractor) return;

    try {
      setPaymentLoading(true);
      console.log('Starting payment process:', {
        contractorId: contractor.id,
        months,
        amount: monthlyPrice * months,
      });

      await createCheckoutSession(contractor.id, months, monthlyPrice * months);
    } catch (error) {
      console.error('Payment error:', error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('支払い処理の初期化に失敗しました');
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!contractor) {
    return <div>契約者が見つかりません</div>;
  }

  return (
    <Container size="md">
      <Group justify="space-between" mb="lg">
        <Title order={2}>契約者情報</Title>
        <Button variant="subtle" onClick={() => navigate('/')}>
          一覧に戻る
        </Button>
      </Group>

      <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
        <Group justify="space-between" mb="xs">
          <Text fw={500}>名前</Text>
          <Text>{contractor.name}</Text>
        </Group>
        <Group justify="space-between" mb="xs">
          <Text fw={500}>駐車場番号</Text>
          <Text>{contractor.parking_number}</Text>
        </Group>
        <Group justify="space-between">
          <Text fw={500}>連絡先</Text>
          <Text>{contractor.phone}</Text>
        </Group>
      </Card>

      <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
        <Stack>
          <Title order={3} size="h4">支払い</Title>
          <NumberInput
            label="支払い月数"
            description={`1ヶ月あたり ${monthlyPrice.toLocaleString()}円`}
            value={months}
            onChange={(value) => setMonths(Number(value))}
            min={1}
            max={12}
          />
          <Divider my="sm" />
          <Group justify="space-between">
            <Text size="lg">合計金額</Text>
            <Text size="lg" fw={700}>¥{(monthlyPrice * months).toLocaleString()}</Text>
          </Group>
          <Button
            fullWidth
            onClick={handlePayment}
            loading={paymentLoading}
          >
            支払い手続きへ
          </Button>
        </Stack>
      </Card>

      <Title order={3} size="h4" mb="md">
        支払い履歴
      </Title>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>年月</Table.Th>
            <Table.Th>支払日</Table.Th>
            <Table.Th>金額</Table.Th>
            <Table.Th>ステータス</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {payments.map((payment) => (
            <Table.Tr key={payment.id}>
              <Table.Td>
                {payment.year}年{payment.month}月
              </Table.Td>
              <Table.Td>
                {new Date(payment.paid_at).toLocaleDateString()}
              </Table.Td>
              <Table.Td>¥{payment.amount.toLocaleString()}</Table.Td>
              <Table.Td>{payment.status}</Table.Td>
            </Table.Tr>
          ))}
          {payments.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={4} style={{ textAlign: 'center' }}>
                支払い履歴がありません
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Container>
  );
};

export default ContractorPage;
