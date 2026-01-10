import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useElements, useStripe } from '@stripe/react-stripe-js';

interface PaymentModalProps {
  onClose: () => void;
  clientSecret: string | null;
  amount: number;
  jobTitle: string;
  onSuccess: () => void;
}

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51SnKnBD3r0NQD7o9ndTkrFfUSHT9Jp5m9IrIaGBZaS51qYjt368MzWfPfUnMYUkBcVGDFYH6wsZWca2zyg8piYoN00Ua1cqjXE';
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

function PaymentModalContent({ onClose, clientSecret, amount, jobTitle, onSuccess }: PaymentModalProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [postalCode, setPostalCode] = useState('');
  const postalInputRef = React.useRef<HTMLInputElement>(null);

  const handleCardChange = (event: any) => {
    // Als het card element compleet is (inclusief CVC), focus naar postcode
    if (event.complete) {
      postalInputRef.current?.focus();
    }
  };

  const handlePayment = async () => {
    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setError('Card element not found');
        setProcessing(false);
        return;
      }

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            address: {
              postal_code: postalCode,
            },
          },
        },
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed');
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '24px',
          width: '100%',
          maxWidth: '500px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1E293B', marginBottom: '8px', marginTop: 0 }}>
          Betaling
        </h2>
        <p style={{ fontSize: '16px', color: '#64748B', marginBottom: '16px', marginTop: 0 }}>
          {jobTitle}
        </p>
        <p style={{ fontSize: '32px', fontWeight: '700', color: '#176B51', marginBottom: '24px', marginTop: 0 }}>
          €{(amount / 100).toFixed(2)}
        </p>

        <div style={{
          padding: '16px',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          marginBottom: '16px',
          minHeight: '60px',
        }}>
          <CardElement
            onChange={handleCardChange}
            options={{
              hidePostalCode: true,
              style: {
                base: {
                  fontSize: '16px',
                  color: '#1E293B',
                  '::placeholder': {
                    color: '#94A3B8',
                  },
                },
                invalid: {
                  color: '#EF4444',
                },
              },
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <input
            ref={postalInputRef}
            type="text"
            placeholder="Postcode (bijv. 1000)"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            disabled={processing}
            autoComplete="postal-code"
            style={{
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '16px',
              color: '#1E293B',
              backgroundColor: '#FFF',
              width: '100%',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s, outline 0.2s',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#176B51';
              e.currentTarget.style.outline = '2px solid #176B5120';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.outline = 'none';
            }}
          />
        </div>

        {error && (
          <div style={{
            backgroundColor: '#FEE2E2',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
          }}>
            <p style={{ color: '#DC2626', fontSize: '14px', margin: 0 }}>{error}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            disabled={processing}
            style={{
              flex: 1,
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#F1F5F9',
              color: '#475569',
              fontWeight: '600',
              fontSize: '16px',
              cursor: processing ? 'not-allowed' : 'pointer',
              minHeight: '48px',
              opacity: processing ? 0.5 : 1,
            }}
          >
            Annuleren
          </button>

          <button
            onClick={handlePayment}
            disabled={processing || !stripe}
            style={{
              flex: 1,
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#176B51',
              color: '#fff',
              fontWeight: '700',
              fontSize: '16px',
              cursor: (processing || !stripe) ? 'not-allowed' : 'pointer',
              minHeight: '48px',
              opacity: (processing || !stripe) ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {processing ? (
              <span style={{ 
                border: '2px solid #fff', 
                borderTopColor: 'transparent',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                animation: 'spin 0.6s linear infinite',
              }} />
            ) : (
              'Betalen'
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function PaymentModal(props: PaymentModalProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentModalContent {...props} />
    </Elements>
  );
}
