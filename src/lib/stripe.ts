import { loadStripe } from '@stripe/stripe-js';

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

if (!stripePublicKey) {
  throw new Error('Missing Stripe public key');
}

export const stripe = loadStripe(stripePublicKey);

export const createCheckoutSession = async (contractorId: string, months: number) => {
  const monthlyPrice = Number(import.meta.env.VITE_MONTHLY_PRICE) || 3500;
  const amount = monthlyPrice * months;

  const response = await fetch(`${import.meta.env.VITE_API_URL}/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contractorId,
      amount,
      months,
    }),
  });

  if (!response.ok) {
    throw new Error('支払い処理の初期化に失敗しました');
  }

  const session = await response.json();
  return session.id;
};
