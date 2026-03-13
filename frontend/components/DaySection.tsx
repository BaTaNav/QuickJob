import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { brand } from '../constants/Colors';
import { Job } from '../utils/helpers';

interface DaySectionProps {
  date: string;
  count: number;
  children: React.ReactNode;
}

export default function DaySection({ date, count, children }: DaySectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Calendar size={18} color={brand.primary} />
        <Text style={styles.title}>{date}</Text>
        <Text style={styles.count}>({count})</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 32, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: brand.border },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: brand.primary },
  title: { fontSize: 16, fontWeight: '600', color: brand.text, marginLeft: 8, flex: 1 },
  count: { fontSize: 14, fontWeight: '500', color: brand.textSecondary },
});
