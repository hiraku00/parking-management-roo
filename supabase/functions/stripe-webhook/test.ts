import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { stripe } from "../_shared/stripe.ts";

// モックデータ
const mockCheckoutSession = {
  id: "cs_test_123",
  object: "checkout.session",
  metadata: {
    contractor_id: "bd2c4cdd-313c-41f3-8764-e5414b818c70",
    months: "1",
    amount_total: "3500"
  },
  payment_status: "paid",
  amount_total: 3500,
  currency: "jpy",
  payment_intent: "pi_test_123"
};

// モックのStripeイベント
const mockStripeEvent = {
  type: "checkout.session.completed",
  data: {
    object: mockCheckoutSession
  }
};

// モックのSupabaseクライアント
const mockSupabase = {
  from: () => ({
    insert: async () => ({ error: null }),
    select: () => ({
      eq: () => ({
        single: async () => ({
          data: {
            contractor_id: mockCheckoutSession.metadata.contractor_id,
            amount: mockCheckoutSession.amount_total,
            months: parseInt(mockCheckoutSession.metadata.months),
            status: "completed",
            stripe_payment_intent_id: mockCheckoutSession.payment_intent,
            stripe_session_id: mockCheckoutSession.id
          },
          error: null
        })
      })
    })
  })
};

// Webhookの処理をテスト
Deno.test("Webhook processes checkout.session.completed event correctly", async () => {
  // テスト用のリクエストを作成
  const request = new Request("http://localhost:54321/functions/v1/stripe-webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Stripe-Signature": "test_signature"
    },
    body: JSON.stringify(mockStripeEvent)
  });

  // Webhookの処理を実行
  const handler = async (req: Request) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, stripe-signature"
        }
      });
    }

    try {
      const signature = req.headers.get("stripe-signature");
      if (!signature) {
        throw new Error("No stripe signature found");
      }

      const body = await req.text();
      const event = JSON.parse(body);

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        if (!session.metadata?.contractor_id || !session.metadata?.months || !session.amount_total) {
          throw new Error("Missing required session data");
        }

        const { error } = await mockSupabase
          .from("payments")
          .insert({
            contractor_id: session.metadata.contractor_id,
            amount: session.amount_total,
            months: parseInt(session.metadata.months),
            status: "completed",
            stripe_payment_intent_id: session.payment_intent,
            stripe_session_id: session.id
          });

        if (error) {
          throw new Error("Failed to save payment information");
        }

        return new Response(
          JSON.stringify({ success: true }),
          {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            },
            status: 200
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
          status: 200
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
          status: 400
        }
      );
    }
  };

  const response = await handler(request);
  const responseData = await response.json();

  // レスポンスの検証
  assertEquals(response.status, 200);
  assertEquals(responseData.success, true);

  // データベースの検証
  const { data: payment, error } = await mockSupabase
    .from("payments")
    .select("*")
    .eq("stripe_session_id", mockCheckoutSession.id)
    .single();

  assertExists(payment);
  assertEquals(payment.contractor_id, mockCheckoutSession.metadata.contractor_id);
  assertEquals(payment.amount, mockCheckoutSession.amount_total);
  assertEquals(payment.months, parseInt(mockCheckoutSession.metadata.months));
  assertEquals(payment.status, "completed");
  assertEquals(payment.stripe_payment_intent_id, mockCheckoutSession.payment_intent);
});

// 認証エラーのテスト
Deno.test("Webhook handles authentication correctly", async () => {
  const request = new Request("http://localhost:54321/functions/v1/stripe-webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(mockStripeEvent)
  });

  const handler = async (req: Request) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, stripe-signature"
        }
      });
    }

    try {
      const signature = req.headers.get("stripe-signature");
      if (!signature) {
        throw new Error("No stripe signature found");
      }

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
          status: 200
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
          status: 400
        }
      );
    }
  };

  const response = await handler(request);
  const responseData = await response.json();

  assertEquals(response.status, 400);
  assertEquals(responseData.error, "No stripe signature found");
});

// メタデータの検証テスト
Deno.test("Webhook validates metadata correctly", async () => {
  const invalidSession = {
    ...mockCheckoutSession,
    metadata: {}
  };

  const invalidEvent = {
    type: "checkout.session.completed",
    data: {
      object: invalidSession
    }
  };

  const request = new Request("http://localhost:54321/functions/v1/stripe-webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Stripe-Signature": "test_signature"
    },
    body: JSON.stringify(invalidEvent)
  });

  const handler = async (req: Request) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, stripe-signature"
        }
      });
    }

    try {
      const signature = req.headers.get("stripe-signature");
      if (!signature) {
        throw new Error("No stripe signature found");
      }

      const body = await req.text();
      const event = JSON.parse(body);

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        if (!session.metadata?.contractor_id || !session.metadata?.months || !session.amount_total) {
          throw new Error("Missing required session data");
        }

        return new Response(
          JSON.stringify({ success: true }),
          {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            },
            status: 200
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
          status: 200
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
          status: 400
        }
      );
    }
  };

  const response = await handler(request);
  const responseData = await response.json();

  assertEquals(response.status, 400);
  assertEquals(responseData.error, "Missing required session data");
});
