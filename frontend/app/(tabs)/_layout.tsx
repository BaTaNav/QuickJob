import React from 'react';
import { SafeAreaView, Alert } from 'react-native';
import Login from '../../components/Login';

export default function TabOneScreen() {
  const handleLogin = (email: string, password: string) => {
    Alert.alert('Login Info', `Email: ${email}\nPassword: ${password}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
      <Login onSubmit={handleLogin} title="Student Login" />
    </SafeAreaView>
  );
}
