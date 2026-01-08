import React from "react";

// Fallback voor TypeScript resolutie.
// Metro/Expo kiest runtime stripe.web.ts of stripe.native.ts
export const StripeProvider: React.FC<
  React.PropsWithChildren<{ publishableKey?: string }>
> = ({ children }) => {
  return <React.Fragment>{children}</React.Fragment>;
};

export const useStripe = () => ({
  initPaymentSheet: async (params?: any) => ({
    error: {
      message: "Betalen is niet beschikbaar op web. Gebruik de mobiele app.",
    },
  }),
  presentPaymentSheet: async (params?: any) => ({
    error: {
      message: "Betalen is niet beschikbaar op web. Gebruik de mobiele app.",
    },
  }),
});