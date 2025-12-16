import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';

import * as Linking from 'expo-linking';
import { authAPI } from '../../services/api';

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    school_name: '',
    field_of_study: '',
    academic_year: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  const handleChange = (name: string, value: string) => {
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    if (error) setError(''); // Clear error when user types
  };

  const handleSignup = async () => {
    try {
      setError('');
      
      // Validate inputs
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

      // Register student
      const result = await authAPI.registerStudent({
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        school_name: formData.school_name || undefined,
        field_of_study: formData.field_of_study || undefined,
        academic_year: formData.academic_year || undefined,
      });

      console.log('Registration successful:', result);
      
      // Show success message and redirect to login
      Alert.alert(
        'Registration Successful! ✅',
        `Welcome ${formData.email}!\n\nYour student account has been created. You can now log in with your email and password.`,
        [
          {
            text: 'Go to Login',
            onPress: () => router.replace('/Login'),
          },
        ]
      );
      
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Registration failed. Please try again.');
      Alert.alert('Registration Failed', err.message || 'Please try again.');
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

      <View style={styles.formCard}>
        <Text style={styles.cardTitle}>
          Create student account
        </Text>

        <View style={styles.signInTextContainer}>
          <Text style={styles.signInText}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => handleLinkPress('/Login')}>
            <Text style={styles.signInLink}>Sign in</Text>
          </TouchableOpacity>
        </View>

        {/* Form area */}
        <View>
          {/* Email Input */}
          <Text style={styles.label}>Email *</Text>
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

          {/* Password Input */}
          <Text style={styles.label}>Password *</Text>
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

          {/* Confirm Password Input */}
          <Text style={styles.label}>Confirm password *</Text>
          <TextInput
            style={styles.inputStyle}
            placeholder='Confirm Password'
            secureTextEntry={true}
            value={formData.confirmPassword}
            onChangeText={(value) => handleChange('confirmPassword', value)}
            accessibilityLabel="Confirm password"
            editable={!loading}
          />

          {/* Phone Input */}
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.inputStyle}
            placeholder='Phone number'
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={(value) => handleChange('phone', value)}
            accessibilityLabel="Phone"
            editable={!loading}
          />

          {/* School Name Input */}
          <Text style={styles.label}>School Name</Text>
          <TextInput
            style={styles.inputStyle}
            placeholder='e.g., KU Leuven'
            value={formData.school_name}
            onChangeText={(value) => handleChange('school_name', value)}
            accessibilityLabel="School Name"
            editable={!loading}
          />

          {/* Field of Study Input */}
          <Text style={styles.label}>Field of Study</Text>
          <TextInput
            style={styles.inputStyle}
            placeholder='e.g., Computer Science'
            value={formData.field_of_study}
            onChangeText={(value) => handleChange('field_of_study', value)}
            accessibilityLabel="Field of Study"
            editable={!loading}
          />

          {/* Academic Year Input */}
          <Text style={styles.label}>Academic Year</Text>
          <TextInput
            style={styles.inputStyle}
            placeholder='e.g., 2024-2025'
            value={formData.academic_year}
            onChangeText={(value) => handleChange('academic_year', value)}
            accessibilityLabel="Academic Year"
            editable={!loading}
          />

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.buttonStyle, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Student Account</Text>
            )}
          </TouchableOpacity>
        </View>


        <View style={styles.ctaContainer}>
          <Text style={styles.ctaText}>
            Start as a client instead?
          </Text>
          <TouchableOpacity
            style={styles.clientButtonStyle}
            onPress={() => router.push('/Client/Signup')}
            activeOpacity={0.8}
          >
            <Text style={styles.clientButtonText}>Create client account</Text>
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
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  headerContainer: {
    marginBottom: 40,
    marginTop: 32,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#176B51',
    letterSpacing: -0.5,
  },
  formCard: {
    width: '100%',
    maxWidth: 520,
    padding: 48,
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
    fontSize: 13,
    color: '#5D6B73',
    marginTop: -16,
    marginBottom: 20,
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
  buttonDisabled: {
    opacity: 0.6,
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
  
  // --- Divider Styles ---
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24, // 1.5rem
    position: 'relative',
    height: 18, // To account for text height
  },
  dividerLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: '#E1E7EB',
    left: 0,
    right: 0,
  },
  dividerText: {
    backgroundColor: '#FFFFFF', // To hide the line behind the text
    paddingHorizontal: 16, // 1rem
    color: '#5D6B73',
    fontSize: 14, // 0.875rem
    alignSelf: 'center',
    zIndex: 1,
    fontWeight: '500',
  },
  // --- Auth0 Button Style ---
  auth0ButtonLinkStyle: { // NIEUWE STIJL VOOR DE AUTH0 KNOP
    width: '100%',
    paddingVertical: 16, // 1rem
    paddingHorizontal: 24, // 1.5rem
    backgroundColor: '#FFFFFF',
    borderColor: '#E1E7EB',
    borderWidth: 2,
    borderRadius: 10,
    marginTop: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  auth0ButtonText: {
    color: '#041316',
    fontSize: 16, // 1rem
    fontWeight: '600',
  },
  // --- CTA (Client) Styles ---
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
});