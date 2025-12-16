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
  }, []);}