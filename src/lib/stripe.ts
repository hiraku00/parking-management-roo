import { loadStripe } from '@stripe/stripe-js';

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

if (!stripePublicKey) {
  throw new Error('Missing Stripe public key');
}

let stripePromise: Promise<any> | null = null;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublicKey);
  }
  return stripePromise;
};

interface CheckoutError {
  message: string;
  details?: any;
}

export const createCheckoutSession = async (contractorId: string, months: number, amount: number) => {
  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/stripe-checkout`;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!import.meta.env.VITE_SUPABASE_FUNCTIONS_URL) {
      throw new Error('VITE_SUPABASE_FUNCTIONS_URL is not set');
    }

    console.log('Creating checkout session...', {
      url: apiUrl,
      contractorId,
      months,
      amount,
      publicKey: stripePublicKey.substring(0, 8),
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        contractorId,
        amount,
        months,
      }),
    });

    let data;
    const text = await response.text();
    console.log('Raw response:', text);

    try {
      data = JSON.parse(text);
      console.log('Parsed response:', data);
    } catch (e) {
      console.error('Failed to parse response:', e);
      throw new Error(`サーバーからの応答を解析できませんでした: ${text}`);
    }

    if (!response.ok) {
      console.error('Server error:', data);
      throw new Error(data.error || 'サーバーでエラーが発生しました');
    }

    if (!data.sessionId) {
      console.error('Missing session ID:', data);
      throw new Error('セッションIDが見つかりません');
    }

    const stripe = await getStripe();
    if (!stripe) {
      throw new Error('Stripeの初期化に失敗しました');
    }

    console.log('Redirecting to Stripe checkout...', {
      sessionId: data.sessionId.substring(0, 8),
    });

    const { error } = await stripe.redirectToCheckout({
      sessionId: data.sessionId,
    });

    if (error) {
      console.error('Stripe redirect error:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Payment error:', error);
    if (error instanceof Error) {
      throw error;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      throw new Error((error as CheckoutError).message);
    } else {
      throw new Error('支払い処理の初期化に失敗しました');
    }
  }
};
