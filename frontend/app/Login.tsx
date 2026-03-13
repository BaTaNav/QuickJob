import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';

type Props = {
  title?: string;
};

export default function Login({ title = 'Login' }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();

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
      await login(email, password);
      // Navigation is handled by AuthContext
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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/')}
        >
          <Text style={styles.backButtonText}>← Back to Main</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{title}</Text>
        
        <Text style={styles.subtitle}>
          Don't have an account?{' '}
          <Text
            style={styles.link}
            onPress={() => router.push('/Student/Signup')}
          >
            Sign up as student
          </Text>
          {' '}or{' '}
          <Text
            style={styles.link}
            onPress={() => router.push('/Client/Signup')}
          >
            as client
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
          autoComplete="off"
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
          autoComplete="off"
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
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    padding: 4,
  },
  backButtonText: {
    color: '#176B51',
    fontSize: 15,
    fontWeight: '600',
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
