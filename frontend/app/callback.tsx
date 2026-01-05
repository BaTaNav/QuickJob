import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Platform, ActivityIndicator } from 'react-native';

export default function Callback() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') {
      document.title = "QuickJob | Processing";
    }

    const timer = setTimeout(() => {
        router.replace('/Student/Dashboard');
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFB' }}>
      <View style={{ alignItems: 'center', padding: 20 }}>
        <Text style={{ color: '#176B51', marginBottom: 12, fontWeight: '700' }}>Processing login...</Text>
        <ActivityIndicator size="large" color="#176B51" />
      </View>
    </View>
  );
}