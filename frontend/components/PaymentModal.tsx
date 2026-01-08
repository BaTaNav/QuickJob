// Placeholder voor native - gebruikt native payment sheet
import React from 'react';
import { View } from 'react-native';

interface PaymentModalProps {
  onClose: () => void;
  clientSecret: string | null;
  amount: number;
  jobTitle: string;
  onSuccess: () => void;
}

export default function PaymentModal({ onClose, clientSecret, amount, jobTitle, onSuccess }: PaymentModalProps) {
  return <View />;
}
