import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Platform, ActivityIndicator } from 'react-native';

export default function Callback() {
  const router = useRouter();

  useEffect(() => {
    // Set Browser Title
    if (Platform.OS === 'web') {
      document.title = "QuickJob | Processing";
    }

    // SIMULATION: Since Auth0 is removed, we simulate a successful 
    // login redirect to the Student Dashboard after 1.5 seconds.
    const timer = setTimeout(() => {
        router.replace('/Student/Dashboard');
    }, 1500);

    return () => clearTimeout(timer);
  }, []);}