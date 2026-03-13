import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { brand } from '../constants/Colors';

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = 'Laden...' }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={brand.primary} size="large" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 90, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E4E6EB', borderRadius: 12, padding: 20, width: '100%' },
  text: { marginTop: 12, fontSize: 14, color: brand.textSecondary },
});
