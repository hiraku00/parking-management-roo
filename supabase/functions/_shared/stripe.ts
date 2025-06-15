import Stripe from 'https://esm.sh/stripe@13.11.0';

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeSecretKey) {
  throw new Error('Missing Stripe secret key');
}

console.log('Initializing Stripe with secret key prefix:', stripeSecretKey.substring(0, 7));

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

export const handlePaymentSucceeded = async (event: Stripe.Event) => {
  console.log('Handling payment succeeded event:', event.id);

  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  console.log('Payment intent metadata:', paymentIntent.metadata);

  const { contractor_id, months } = paymentIntent.metadata;

  if (!contractor_id || !months) {
    console.error('Missing required metadata:', paymentIntent.metadata);
    throw new Error('Missing required metadata');
  }

  return {
    contractor_id,
    months: parseInt(months),
    amount: paymentIntent.amount,
    payment_intent_id: paymentIntent.id,
    status: paymentIntent.status,
  };
};
