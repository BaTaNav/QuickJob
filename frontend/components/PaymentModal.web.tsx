import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { loadStripe, StripeCardElement } from '@stripe/stripe-js';
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

  // Debug logging
  useEffect(() => {
    console.log('Stripe initialized:', !!stripe);
    console.log('Elements initialized:', !!elements);
    console.log('Client secret:', clientSecret);
    console.log('Stripe publishable key:', STRIPE_PUBLISHABLE_KEY);
  }, [stripe, elements, clientSecret]);

  const handlePayment = async () => {
    if (!stripe || !elements || !clientSecret) {
      console.log('Missing:', { stripe: !!stripe, elements: !!elements, clientSecret: !!clientSecret });
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

      console.log('Attempting payment with client secret:', clientSecret);

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

      console.log('Payment result:', result);

      if (result.error) {
        console.error('Payment error:', result.error);
        setError(result.error.message || 'Payment failed');
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error('Payment exception:', err);
      setError(err.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal visible={true} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Betaling</Text>
          <Text style={styles.subtitle}>{jobTitle}</Text>
          <Text style={styles.amount}>€{(amount / 100).toFixed(2)}</Text>

          <View style={styles.cardContainer}>
            <CardElement
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
          </View>

          <TextInput
            style={styles.postalInput}
            placeholder="Postcode (bijv. 1000)"
            value={postalCode}
            onChangeText={setPostalCode}
            editable={!processing}
            placeholderTextColor="#94A3B8"
          />

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={processing}
            >
              <Text style={styles.cancelButtonText}>Annuleren</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.payButton, processing && styles.disabledButton]}
              onPress={handlePayment}
              disabled={processing || !stripe}
            >
              {processing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.payButtonText}>Betalen</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 16,
  },
  amount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#176B51',
    marginBottom: 24,
  },
  cardContainer: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    marginBottom: 16,
    minHeight: 60,
  },
  postalInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#1E293B',
    backgroundColor: '#FFF',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 16,
  },
  payButton: {
    backgroundColor: '#176B51',
  },
  payButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

// Wrap the content with Elements provider
export default function PaymentModal(props: PaymentModalProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentModalContent {...props} />
    </Elements>
  );
}
