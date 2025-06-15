import { Button, Modal, NumberInput, Group, Text } from "@mantine/core";
import { createCheckoutSession } from "../../lib/stripe";
import { useState } from "react";

interface PaymentButtonProps {
  contractorId: string;
}

export const PaymentButton = ({ contractorId }: PaymentButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [opened, setOpened] = useState(false);
  const [months, setMonths] = useState(1);
  const monthlyPrice = parseInt(import.meta.env.VITE_MONTHLY_PRICE || "3500");

  const handlePayment = async () => {
    try {
      console.log("支払い処理を開始:", {
        contractorId,
        months,
        amount: monthlyPrice * months,
      });
      setLoading(true);

      const result = await createCheckoutSession(
        contractorId,
        months,
        monthlyPrice * months
      );
      console.log("支払いセッション作成成功:", result);
    } catch (error) {
      console.error("支払い処理エラー:", error);
      if (error instanceof Error) {
        alert(`支払い処理に失敗しました: ${error.message}`);
      } else {
        alert("支払い処理の初期化に失敗しました");
      }
    } finally {
      setLoading(false);
      setOpened(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpened(true)} color="blue">
        支払い手続きへ
      </Button>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="支払い月数の選択"
      >
        <NumberInput
          label="支払い月数"
          description={`1ヶ月あたり ${monthlyPrice.toLocaleString()}円`}
          value={months}
          onChange={(value) => setMonths(Number(value))}
          min={1}
          max={12}
          mb="md"
        />
        <Group justify="space-between">
          <Text>合計金額</Text>
          <Text fw={500}>¥{(monthlyPrice * months).toLocaleString()}</Text>
        </Group>
        <Button fullWidth mt="xl" onClick={handlePayment} loading={loading}>
          支払い手続きへ進む
        </Button>
      </Modal>
    </>
  );
};

export default PaymentButton;
