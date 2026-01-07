import { router } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import * as Linking from 'expo-linking';

const API_BASE_URL = Platform.OS === 'web' ? 'http://localhost:3000' : 'http://10.2.88.146:3000';

const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Adapted handler for React Native TextInput
  const handleChange = (name: string, value: string) => {
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    if (error) setError('');
  };

  const handleSignup = async () => {
    try {
      setError('');

      if (!formData.email || !formData.password) {
        setError('Email and password are required');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/clients/register-client`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: 'client'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Client registration successful:', data);
        Alert.alert('Registration successful', 'You can now sign in', [
          { text: 'OK', onPress: () => router.replace('/Login') }
        ]);
      } else {
        const errText = await response.text();
        console.error('Signup failed:', errText);
        setError(errText || 'Registration failed');
      }

    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Handler for navigation links (since React Native doesn't use HTML <a> tags)
  const handleLinkPress = (url: string) => {
    if (url.startsWith('/')) {
        router.push(url as any);
    } else {
        Linking.openURL(url);
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.containerContent} 
      style={styles.container} 
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>QuickJob</Text>
      </View>
      
      <View style={styles.formCard}>
        <Text style={styles.cardTitle}>
          Create client account
        </Text>
        
        <View style={styles.signInTextContainer}>
          <Text style={styles.signInText}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => handleLinkPress('/Login')}>
            <Text style={styles.signInLink}>Sign in</Text>
          </TouchableOpacity>
        </View>

        {/* Form area (using View instead of form) */}
        <View>
          {/* Full Name Input */}
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.inputStyle}
            placeholder='Full Name'
            value={formData.fullName}
            onChangeText={(value) => handleChange('fullName', value)}
            accessibilityLabel="Full Name"
            editable={!loading}
          />

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.inputStyle}
            placeholder='Email'
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(value) => handleChange('email', value)}
            accessibilityLabel="Email"
            editable={!loading}
          />

          {/* Password */}
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.inputStyle}
            placeholder='Password'
            secureTextEntry={true}
            value={formData.password}
            onChangeText={(value) => handleChange('password', value)}
            accessibilityLabel="Password"
            editable={!loading}
          />

          <Text style={styles.passwordHint}>
            Must be at least 6 characters
          </Text>

          {/* Confirm Password */}
          <Text style={styles.label}>Confirm password</Text>
          <TextInput
            style={styles.inputStyle}
            placeholder='Confirm Password'
            secureTextEntry={true}
            value={formData.confirmPassword}
            onChangeText={(value) => handleChange('confirmPassword', value)}
            accessibilityLabel="Confirm password"
            editable={!loading}
          />

          {/* Submit Button for internal registration */}
          <TouchableOpacity 
            style={[styles.buttonStyle, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            activeOpacity={0.8}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Signing up...' : 'Create client account'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.ctaContainer}>
          <Text style={styles.ctaText}>
            Start as a student instead?
          </Text>
          <TouchableOpacity
            style={styles.clientButtonStyle}
            onPress={() => router.push('/Student/Signup')}
            activeOpacity={0.8}
          >
            <Text style={styles.clientButtonText}>Create student account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.forgotPasswordContainer}>
          <TouchableOpacity onPress={() => handleLinkPress('/forgot-password')}>
            <Text style={styles.forgotPasswordLink}>Forgot password?</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};


export default Signup;

// React Native Stylesheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  containerContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48, // 3rem
    paddingHorizontal: 32, // 2rem
  },
  headerContainer: {
    marginBottom: 40, // 2.5rem
    marginTop: 32, // 2rem
  },
  headerTitle: {
    fontSize: 36, // 2.25rem
    fontWeight: '800',
    color: '#176B51',
    letterSpacing: -0.5,
  },
  formCard: {
    width: '100%',
    maxWidth: 520,
    padding: 48, // 3rem
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
      },
      android: {
        elevation: 10,
      },
    }),
    borderWidth: 1,
    borderColor: 'rgba(225, 231, 235, 0.6)',
  },
  cardTitle: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    color: '#041316',
    letterSpacing: -0.25,
  },
  signInTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  signInText: {
    textAlign: 'center',
    color: '#5D6B73',
    fontSize: 15,
  },
  signInLink: {
    color: '#176B51',
    fontWeight: '600',
    textDecorationLine: 'underline',
    fontSize: 15,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#041316',
    fontSize: 14,
  },
  inputStyle: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#E1E7EB',
    borderRadius: 10,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
    color: '#000',
  },
  passwordHint: {
    fontSize: 13, // 0.8125rem
    color: '#5D6B73',
    marginTop: -16, // Approx -1rem
    marginBottom: 20, // Approx 1.25rem
    lineHeight: 18,
  },
  buttonStyle: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#176B51',
    borderRadius: 10,
    marginTop: 8,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#176B51', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, },
      android: { elevation: 4, },
    }),
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  ctaContainer: {
    marginTop: 32,
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: '#E1E7EB',
  },
  ctaText: {
    marginBottom: 16,
    color: '#041316',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  clientButtonStyle: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderColor: '#176B51',
    borderWidth: 2,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientButtonText: {
    color: '#176B51',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  forgotPasswordLink: {
    color: '#5D6B73',
    fontSize: 15,
    textDecorationLine: 'none',
  }
});
