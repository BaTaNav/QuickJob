import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform 
} from 'react-native';

// Import Linking for external navigation (like the "Sign up" link)
import * as Linking from 'expo-linking'; // Assuming you are using Expo or have Linking installed/configured

type Props = {
  onSubmit?: (email: string, password: string) => void;
  title?: string;
};

export default function Login({ onSubmit, title = 'Login' }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    // In React Native, the form submission is typically a direct call from an onPress handler.
    // No need to call e.preventDefault()
    if (onSubmit) {
      onSubmit(email.trim(), password);
    }
  };

  // The 'document.title' logic is for web browsers and needs to be removed for React Native.
  // We'll keep the useEffect hook as a placeholder if platform-specific logic is ever needed.
  useEffect(() => {
    // Platform-specific title setting is often handled by the native navigation stack.
    // If you need to explicitly set a screen title, it's done via navigation options (e.g., React Navigation).
  }, []);

  // Handler for navigation links (since React Native doesn't use HTML <a> tags)
  const handleLinkPress = (url: string) => {
    // Use the Linking API to open an external URL or handle internal navigation
    Linking.openURL(url);
  };


  return (
    // ScrollView replaces the web 'div' with 'overflowY: auto' and 'height: 100vh'
    <ScrollView 
      contentContainerStyle={styles.containerContent} 
      style={styles.container} 
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>QuickJob</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.cardTitle}>{title}</Text>
        
        <View style={styles.signUpTextContainer}>
          <Text style={styles.signUpText}>
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => handleLinkPress('Student/Signup')}>
            <Text style={styles.signUpLink}>Sign up</Text>
          </TouchableOpacity>
        </View>

        {/* Form area */}
        <View>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.inputStyle}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            accessibilityLabel="Email"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.inputStyle}
            placeholder="Password"
            secureTextEntry={true} // Replaces type="password"
            value={password}
            onChangeText={setPassword}
            accessibilityLabel="Password"
          />

          {/* TouchableOpacity replaces the web button for press feedback */}
          <TouchableOpacity 
            style={styles.buttonStyle} 
            onPress={handleSubmit} // Attach the submission logic here
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.forgotPasswordContainer}>
          <TouchableOpacity onPress={() => handleLinkPress('/Resetpassword')}>
            <Text style={styles.forgotPasswordLink}>
              Forgot password?
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// StyleSheet.create is the standard way to define styles in React Native
const styles = StyleSheet.create({
  container: {
    flex: 1, // Fills the available space
    backgroundColor: '#F8FAFB',
    // Background Image/Gradient is harder in RN, we'll approximate with color
  },
  containerContent: {
    flexGrow: 1, // Allows content to grow within the ScrollView
    justifyContent: 'center', // Centers the card vertically
    alignItems: 'center',
    paddingVertical: 48, // 3rem
    paddingHorizontal: 32, // 2rem
    backgroundColor: '#F8FAFB', 
    // Simplified background gradient:
    // RN usually requires a separate library (like expo-linear-gradient) for proper gradients.
  },
  headerContainer: {
    marginBottom: 40, // 2.5rem
    marginTop: 32, // 2rem
  },
  headerTitle: {
    fontSize: 36, // 2.25rem
    fontWeight: '800',
    color: '#176B51',
    letterSpacing: -0.5, // Approx -0.02em
  },
  formCard: {
    width: '100%',
    maxWidth: 520,
    padding: 48, // 3rem
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    // RN uses elevation for Android shadow and shadow properties for iOS
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
    fontSize: 30, // 1.875rem
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12, // 0.75rem
    color: '#041316',
    letterSpacing: -0.25, // Approx -0.01em
  },
  signUpTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40, // 2.5rem
  },
  signUpText: {
    textAlign: 'center',
    color: '#5D6B73',
    fontSize: 15, // 0.9375rem
  },
  signUpLink: {
    color: '#176B51',
    fontWeight: '600',
    textDecorationLine: 'underline', // Replaces textDecoration: 'none' + borderBottom
    fontSize: 15,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8, // 0.5rem
    color: '#041316',
    fontSize: 14, // 0.875rem
  },
  inputStyle: {
    width: '100%',
    paddingHorizontal: 16, // 1rem
    paddingVertical: 14, // 0.875rem
    marginBottom: 20, // 1.25rem
    borderWidth: 2,
    borderColor: '#E1E7EB',
    borderRadius: 10,
    fontSize: 15, // 0.9375rem
    backgroundColor: '#FFFFFF',
    color: '#000', // Ensure text is visible
  },
  buttonStyle: {
    width: '100%',
    paddingVertical: 16, // 1rem
    paddingHorizontal: 24, // 1.5rem
    backgroundColor: '#176B51',
    borderRadius: 10,
    marginTop: 8, // 0.5rem
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow for button
    ...Platform.select({
      ios: {
        shadowColor: '#176B51',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16, // 1rem
    fontWeight: '600',
  },
  forgotPasswordContainer: {
    marginTop: 32, // 2rem
    alignItems: 'center',
  },
  forgotPasswordLink: {
    color: '#5D6B73',
    textDecorationLine: 'none',
    fontSize: 15, // 0.9375rem
  }
});