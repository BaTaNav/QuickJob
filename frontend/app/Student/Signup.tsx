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
  Alert 
} from 'react-native';
import * as Linking from 'expo-linking';

const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Set Browser Title for Web
  useEffect(() => {
    if (Platform.OS === 'web') {
      document.title = "QuickJob | Student Signup";
    }
  }, []);

  const handleChange = (name: string, value: string) => {
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSiteSignup = () => {
    // Add your backend registration logic here
    console.log('Registration started with:', formData);
    
    // Example validation
    if (formData.password !== formData.confirmPassword) {
        if (Platform.OS === 'web') {
            alert("Passwords do not match");
        } else {
            Alert.alert("Error", "Passwords do not match");
        }
        return;
    }

    if (Platform.OS === 'web') {
        alert("Registration logic goes here (check console for data)");
    } else {
        Alert.alert("Registration", "Registration logic goes here.");
    }
    
    // Perform POST request to /auth/signup here
  };

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

        <View>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.inputStyle}
            placeholder='Full Name'
            value={formData.fullName}
            onChangeText={(value) => handleChange('fullName', value)}
            accessibilityLabel="Full Name"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.inputStyle}
            placeholder='Email'
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(value) => handleChange('email', value)}
            accessibilityLabel="Email"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.inputStyle}
            placeholder='Password'
            secureTextEntry={true}
            value={formData.password}
            onChangeText={(value) => handleChange('password', value)}
            accessibilityLabel="Password"
          />

          <Text style={styles.passwordHint}>
            Must be at least 8 characters with uppercase and number
          </Text>

          <Text style={styles.label}>Confirm password</Text>
          <TextInput
            style={styles.inputStyle}
            placeholder='Confirm Password'
            secureTextEntry={true}
            value={formData.confirmPassword}
            onChangeText={(value) => handleChange('confirmPassword', value)}
            accessibilityLabel="Confirm password"
          />

          <TouchableOpacity 
            style={styles.buttonStyle}
            onPress={handleSiteSignup}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Sign Up</Text>
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