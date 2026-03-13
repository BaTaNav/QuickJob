import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { brand } from '../constants/Colors';

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export default function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 6 }}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => onTabChange(tab.key)}
          >
            <Text style={activeTab === tab.key ? styles.tabActiveText : styles.tabText}>
              {tab.label}{tab.count !== undefined ? ` (${tab.count})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', marginBottom: 22, marginTop: 10, justifyContent: 'center', backgroundColor: '#E9ECEF', paddingHorizontal: 6, paddingVertical: 6, borderRadius: 12, overflow: 'hidden' },
  tab: { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: 'transparent', borderRadius: 8, marginRight: 8 },
  tabActive: { backgroundColor: brand.primary },
  tabText: { fontSize: 14, fontWeight: '500', color: brand.textSecondary },
  tabActiveText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
