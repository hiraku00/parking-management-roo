import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, Text, Button, Container } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

const PaymentSuccessPage = () => {
  const { contractorName } = useParams<{ contractorName: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId || !contractorName) {
      console.error("Session ID or contractor name not found");
      navigate("/");
      return;
    }

    const verifyPayment = async () => {
      try {
        setLoading(true);
        // 支払い情報の更新を待機
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // 契約者情報を取得
        const { data: contractor, error: contractorError } = await supabase
          .from("contractors")
          .select("id")
          .eq("name", contractorName)
          .single();

        if (contractorError || !contractor) {
          throw new Error("契約者情報の取得に失敗しました");
        }

        // 最新の支払い情報を取得
        const { data: payments, error: paymentsError } = await supabase
          .from("payments")
          .select("*")
          .eq("contractor_id", contractor.id)
          .order("year", { ascending: false })
          .order("month", { ascending: false })
          .limit(1);

        if (paymentsError) {
          throw new Error("支払い情報の取得に失敗しました");
        }

        if (payments && payments.length > 0) {
          toast.success("支払いが完了しました");
        } else {
          toast.error("支払い情報の更新に失敗しました");
        }

        // 5秒後に契約者ページに自動遷移
        setTimeout(() => {
          navigate(`/contractor/${contractorName}`);
        }, 5000);
      } catch (error) {
        console.error("Payment verification error:", error);
        toast.error("支払いの確認に失敗しました");
        navigate(`/contractor/${contractorName}`);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [contractorName, navigate, searchParams]);

  const handleBackClick = () => {
    if (!contractorName) return;
    navigate(`/contractor/${contractorName}`);
  };

  if (!contractorName) {
    return null;
  }

  return (
    <Container size="sm" style={{ marginTop: "2rem" }}>
      <Card shadow="sm" p="xl" radius="md" withBorder>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <IconCheck
            size={64}
            stroke={1.5}
            style={{ color: "var(--mantine-color-green-6)" }}
          />
          <Text size="xl" fw={500} mt="md">
            {loading ? "支払いを確認中..." : "お支払いが完了しました"}
          </Text>
          <Text size="sm" c="dimmed" mt="sm">
            {loading
              ? "支払い情報を確認しています..."
              : "ご利用ありがとうございます。\n5秒後に自動的に契約者ページに戻ります。"}
          </Text>
        </div>
        <Button
          variant="light"
          color="blue"
          fullWidth
          mt="md"
          onClick={handleBackClick}
          loading={loading}
        >
          契約者ページに戻る
        </Button>
      </Card>
    </Container>
  );
};

export default PaymentSuccessPage;
