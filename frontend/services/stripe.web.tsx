import React, { useState } from "react";
import { loadStripe, Stripe, StripeElements } from "@stripe/stripe-js";
import { Elements, CardElement, useElements, useStripe as useStripeJS } from "@stripe/react-stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

export const StripeProvider: React.FC<React.PropsWithChildren<{ publishableKey?: string }>> = ({
  children,
  publishableKey,
}) => {
  if (publishableKey && !stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }

  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
};

// Web implementation using Stripe Elements
export const useStripe = () => {
  const stripe = useStripeJS();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  return {
    initPaymentSheet: async (params: { paymentIntentClientSecret: string; merchantDisplayName?: string; defaultBillingDetails?: any }) => {
      setClientSecret(params.paymentIntentClientSecret);
      return { error: null };
    },
    
    presentPaymentSheet: async () => {
      if (!stripe || !elements || !clientSecret) {
        return { 
          error: { message: "Stripe not initialized" } 
        };
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        return { 
          error: { message: "Card element not found" } 
        };
      }

      try {
        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
          },
        });

        if (result.error) {
          return { error: { message: result.error.message || "Payment failed" } };
        }

        return { error: null };
      } catch (err: any) {
        return { error: { message: err.message || "Payment failed" } };
      }
    },
  };
};