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
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import {
  validateEmail, validatePassword, validatePhone,
  validateIBAN, validateDateOfBirth, formatIBAN, formatPhone,
} from '@/utils/validation';
import { uploadImage } from '@/services/uploadService';

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    school_name: '',
    field_of_study: '',
    academic_year: '',
    date_of_birth: '',
    iban: '',
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [studentCardFront, setStudentCardFront] = useState<string | null>(null);
  const [studentCardBack, setStudentCardBack] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { registerStudent } = useAuth();

  useEffect(() => {
    if (Platform.OS === 'web') {
      document.title = "QuickJob | Student Signup";
    }
  }, []);

  const handleChange = (name: string, value: string) => {
    // Auto-format IBAN and phone
    let formatted = value;
    if (name === 'iban') formatted = formatIBAN(value);
    if (name === 'phone') formatted = formatPhone(value);

    setFormData((prevData) => ({ ...prevData, [name]: formatted }));
    if (error) setError('');
    // Clear field-specific error when typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => { const n = {...prev}; delete n[name]; return n; });
    }
  };

  const handleSignup = async () => {
    try {
      setError('');
      setFieldErrors({});
      const errors: Record<string, string> = {};

      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        errors.firstName = 'First name and last name are required';
      }

      const emailErr = validateEmail(formData.email);
      if (emailErr) errors.email = emailErr;

      const passErr = validatePassword(formData.password);
      if (passErr) errors.password = passErr;

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }

      const phoneErr = validatePhone(formData.phone);
      if (phoneErr) errors.phone = phoneErr;

      const dobErr = validateDateOfBirth(formData.date_of_birth);
      if (dobErr) errors.date_of_birth = dobErr;

      if (!formData.school_name.trim()) {
        errors.school_name = 'School name is required';
      }

      const ibanErr = validateIBAN(formData.iban);
      if (ibanErr) errors.iban = ibanErr;

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        // Show first error as main error
        setError(Object.values(errors)[0]);
        return;
      }

      setLoading(true);

      // Upload images to Supabase Storage first (if selected)
      let profileImageUrl: string | undefined;
      let studentCardFrontUrl: string | undefined;
      let studentCardBackUrl: string | undefined;

      try {
        if (profileImage) {
          profileImageUrl = await uploadImage(profileImage, 'student-avatars');
        }
        if (studentCardFront) {
          studentCardFrontUrl = await uploadImage(studentCardFront, 'student-cards');
        }
        if (studentCardBack) {
          studentCardBackUrl = await uploadImage(studentCardBack, 'student-cards');
        }
      } catch (uploadErr: any) {
        setError('Image upload failed: ' + (uploadErr?.message || 'Please try again'));
        setLoading(false);
        return;
      }

      await registerStudent({
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        school_name: formData.school_name,
        field_of_study: formData.field_of_study || undefined,
        academic_year: formData.academic_year || undefined,
        date_of_birth: formData.date_of_birth,
        iban: formData.iban,
        profile_image: profileImageUrl,
        student_card_front: studentCardFrontUrl,
        student_card_back: studentCardBackUrl,
      });
      // Navigation handled by AuthContext (auto-login after register)

    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkPress = (url: string) => {
    if (url.startsWith('/')) {
      router.push(url as any);
    }
  };

  const pickImage = async (setter: (uri: string | null) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setter(result.assets[0].uri);
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.containerContent} 
      style={styles.container} 
      keyboardShouldPersistTaps="handled"
    >

      <View style={styles.formCard}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/')}
        >
          <Text style={styles.backButtonText}>← Back to Main</Text>
        </TouchableOpacity>

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
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.inputStyle}
            placeholder='First Name'
            value={formData.firstName}
            onChangeText={(value) => handleChange('firstName', value)}
            accessibilityLabel="First Name"
            editable={!loading}
          />

          <Text style={styles.label}>Last Name *</Text>
          <TextInput
            style={styles.inputStyle}
            placeholder='Last Name'
            value={formData.lastName}
            onChangeText={(value) => handleChange('lastName', value)}
            accessibilityLabel="Last Name"
            editable={!loading}
          />

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

          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.inputStyle}
            placeholder='+32 ...'
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={(value) => handleChange('phone', value)}
            accessibilityLabel="Phone"
            editable={!loading}
          />

          <Text style={styles.label}>Date of Birth *</Text>
          <TextInput
            style={styles.inputStyle}
            placeholder='DD/MM/YYYY'
            value={formData.date_of_birth}
            onChangeText={(value) => handleChange('date_of_birth', value)}
            accessibilityLabel="Date of Birth"
            editable={!loading}
          />

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

          <Text style={styles.label}>School Name *</Text>
          <TextInput
            style={styles.inputStyle}
            placeholder='e.g., KU Leuven'
            value={formData.school_name}
            onChangeText={(value) => handleChange('school_name', value)}
            accessibilityLabel="School Name"
            editable={!loading}
          />

          <Text style={styles.label}>Field of Study</Text>
          <TextInput
            style={styles.inputStyle}
            placeholder='e.g., Computer Science'
            value={formData.field_of_study}
            onChangeText={(value) => handleChange('field_of_study', value)}
            accessibilityLabel="Field of Study"
            editable={!loading}
          />

          <Text style={styles.label}>Academic Year</Text>
          <TextInput
            style={styles.inputStyle}
            placeholder='e.g., 2024-2025'
            value={formData.academic_year}
            onChangeText={(value) => handleChange('academic_year', value)}
            accessibilityLabel="Academic Year"
            editable={!loading}
          />

          <Text style={styles.label}>IBAN (Bank Account) *</Text>
          <TextInput
            style={[styles.inputStyle, fieldErrors.iban && styles.inputError]}
            placeholder='BE68 5390 0754 7034'
            autoCapitalize="characters"
            value={formData.iban}
            onChangeText={(value) => handleChange('iban', value)}
            accessibilityLabel="IBAN"
            editable={!loading}
            maxLength={19}
          />
          {fieldErrors.iban && <Text style={styles.fieldError}>{fieldErrors.iban}</Text>}

          {/* Profile Picture */}
          <Text style={styles.label}>Profile Picture</Text>
          <Text style={styles.imageHint}>This photo will be visible to the admin for verification</Text>
          <TouchableOpacity style={styles.imagePickerBtn} onPress={() => pickImage(setProfileImage)} disabled={loading}>
            <Text style={styles.imagePickerText}>{profileImage ? '✅ Photo selected' : '📷 Choose photo'}</Text>
          </TouchableOpacity>
          {profileImage && <Image source={{ uri: profileImage }} style={styles.previewImage} />}

          {/* Student Card Front */}
          <Text style={styles.label}>Student Card (Front) *</Text>
          <Text style={styles.imageHint}>Upload the front of your student card</Text>
          <TouchableOpacity style={styles.imagePickerBtn} onPress={() => pickImage(setStudentCardFront)} disabled={loading}>
            <Text style={styles.imagePickerText}>{studentCardFront ? '✅ Front uploaded' : '📷 Upload front'}</Text>
          </TouchableOpacity>
          {studentCardFront && <Image source={{ uri: studentCardFront }} style={styles.previewImage} />}

          {/* Student Card Back */}
          <Text style={styles.label}>Student Card (Back) *</Text>
          <Text style={styles.imageHint}>Upload the back of your student card</Text>
          <TouchableOpacity style={styles.imagePickerBtn} onPress={() => pickImage(setStudentCardBack)} disabled={loading}>
            <Text style={styles.imagePickerText}>{studentCardBack ? '✅ Back uploaded' : '📷 Upload back'}</Text>
          </TouchableOpacity>
          {studentCardBack && <Image source={{ uri: studentCardBack }} style={styles.previewImage} />}

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity 
            style={[styles.buttonStyle, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create a student profile</Text>
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
  imageHint: {
    fontSize: 13,
    color: '#5D6B73',
    marginBottom: 8,
    lineHeight: 18,
  },
  imagePickerBtn: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E1E7EB',
    borderRadius: 10,
    borderStyle: 'dashed',
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
  },
  imagePickerText: {
    fontSize: 15,
    color: '#176B51',
    fontWeight: '500',
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
    marginBottom: 20,
    alignSelf: 'center',
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
  inputError: {
    borderColor: '#DC2626',
  },
  fieldError: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '500',
    marginTop: -16,
    marginBottom: 16,
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
