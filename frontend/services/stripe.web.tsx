import React from "react";

export const StripeProvider: React.FC<React.PropsWithChildren<{ publishableKey?: string }>> = ({
  children,
}) => {
  return <React.Fragment>{children}</React.Fragment>;
};

// Minimal stub so web doesn't crash.
// (Real web payments should use @stripe/stripe-js or Stripe Checkout.)
export const useStripe = () => ({
  initPaymentSheet: async (params?: any) => ({
    error: { message: "Betalen is niet beschikbaar op web. Gebruik de mobiele app." },
  }),
  presentPaymentSheet: async (params?: any) => ({
    error: { message: "Betalen is niet beschikbaar op web. Gebruik de mobiele app." },
  }),
});