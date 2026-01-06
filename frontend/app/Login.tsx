import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Platform, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveStudentId, saveClientId, saveAuthToken } from '@/services/api';

// API URL - use localhost for web, IP address for mobile
const API_BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:3000' 
  : 'http://10.2.88.141:3000';

type Props = {
  title?: string;
};

export default function Login({ title = 'Login' }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      const msg = 'Please fill in all fields';
      if (Platform.OS === 'web') {
        setError(msg);
      } else {
        Alert.alert('Error', msg);
      }
      return;
    }

    try {
      setError('');
      setLoading(true);

      // Login via backend
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Login successful:', data);
        
        // Save user data using platform-appropriate storage
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(data.user));
          if (data.token) {
            localStorage.setItem('token', data.token);
          }
        } else {
          // Mobile - use AsyncStorage
          await AsyncStorage.setItem('user', JSON.stringify(data.user));
          if (data.token) {
            await AsyncStorage.setItem('token', data.token);
          }
        }
        
        // Save role-specific ID for API calls (works on both platforms)
        if (data.user?.role === 'student') {
          await saveStudentId(data.user.id.toString());
        } else if (data.user?.role === 'client') {
          await saveClientId(data.user.id.toString());
        }
        
        if (data.token) {
          await saveAuthToken(data.token);
        }
        
        // Redirect based on role
        if (data.user?.role === 'student') {
          router.replace('/Student/Dashboard');
        } else if (data.user?.role === 'client') {
          router.replace('/Client/DashboardClient');
        } else if (data.user?.role === 'admin') {
          router.replace('/Admin/DashboardAdmin');
        } else {
          router.replace('/');
        }
      } else {
        const errorText = await response.text();
        const msg = errorText || 'Login failed. Please check your credentials.';
        if (Platform.OS === 'web') {
          setError(msg);
        } else {
          Alert.alert('Login Failed', msg);
        }
      }
      
    } catch (err: any) {
      console.error('Login error:', err);
      const msg = err.message || 'Login failed. Please try again.';
      if (Platform.OS === 'web') {
        setError(msg);
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        
        <Text style={styles.subtitle}>
          Don't have an account?{' '}
          <Text 
            style={styles.link} 
            onPress={() => router.push('/Student/Signup')}
          >
            Sign up
          </Text>
        </Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!loading}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          editable={!loading}
        />

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.forgotPassword}
          onPress={() => router.push('/Resetpassword')}
        >
          <Text style={styles.forgotPasswordText}>Forgot password?</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F8FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    minHeight: '100%',
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(225, 231, 235, 0.6)',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#041316',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#5D6B73',
    fontSize: 15,
  },
  link: {
    color: '#176B51',
    fontWeight: '600',
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
    fontWeight: '500',
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#041316',
    fontSize: 14,
  },
  input: {
    width: '100%',
    padding: 14,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#E1E7EB',
    borderRadius: 10,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
    color: '#041316',
  },
  button: {
    width: '100%',
    padding: 16,
    backgroundColor: '#176B51',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#176B51',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 24,
  },
  forgotPasswordText: {
    color: '#5D6B73',
    fontSize: 15,
  },
});
