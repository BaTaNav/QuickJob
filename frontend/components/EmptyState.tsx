import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { brand } from '../constants/Colors';

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon = '📄', title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 60, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  subtitle: { fontSize: 14, color: brand.textSecondary, textAlign: 'center', maxWidth: 300 },
  button: { marginTop: 16, backgroundColor: brand.warning, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
