import * as React from 'react';
import { StyleSheet, Pressable, View as RNView, Switch, Image, ActivityIndicator, Platform, ScrollView, Alert, TextInput } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { studentAPI, authAPI, getStudentId } from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:3000' 
  : 'http://192.168.129.7:3000';

const isWeb = Platform.OS === 'web';
import * as ImagePicker from 'expo-image-picker';

export default function StudentProfile() {
  const [panel, setPanel] = React.useState<'info' | 'settings'>('info');
  const [profile, setProfile] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  // Fetch profile data
  React.useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const storedStudentId = await getStudentId();
      const id = storedStudentId ? parseInt(storedStudentId) : 3;

      const data = await studentAPI.getProfile(id);
      if (data?.avatar_url) data.avatar_url = `${data.avatar_url}?t=${Date.now()}`;
      setProfile(data);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  async function handleLogout() {
    await authAPI.logout();
    router.replace('/');
  }

  // Upload avatar helper (both web and native)
  const uploadAvatar = async () => {
    try {
      const storedStudentId = await getStudentId();
      const studentId = storedStudentId ? parseInt(storedStudentId) : 3;

      // Ask permission on native
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Please allow access to your photos to upload an avatar.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled) return;

      const localUri = result.assets[0].uri;
      const formData = new FormData();

      if (typeof window !== 'undefined' && (localUri.startsWith('data:') || localUri.startsWith('blob:'))) {
        const response = await fetch(localUri);
        const blob = await response.blob();
        const blobExt = blob.type.split('/')[1] || 'jpg';
        const properFilename = `avatar.${blobExt === 'jpeg' ? 'jpg' : blobExt}`;
        formData.append('avatar', blob, properFilename);
      } else {
        const filename = localUri.split('/').pop() || 'avatar.jpg';
        formData.append('avatar', { uri: localUri, name: filename, type: 'image/jpeg' } as any);
      }

      console.log('Uploading avatar to:', `${API_BASE_URL}/students/${studentId}/avatar`);
      const data = await studentAPI.uploadAvatar(studentId, formData);
      if (data?.avatar_url) {
        // Add cache-busting
        setProfile((prev: any) => ({ ...prev, avatar_url: `${data.avatar_url}?t=${Date.now()}` }));
      }
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      Alert.alert('Upload failed', err.message || 'Could not upload avatar');
    }
  };

  // Start editing and prefill form values
  const startEdit = () => {
    setPhoneVal(profile?.phone || '');
    setSchoolVal(profile?.school_name || '');
    setFieldVal(profile?.field_of_study || '');
    setYearVal(profile?.academic_year || '');
    setRadiusVal(profile?.radius_km);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const saveProfile = async () => {
    try {
      const storedStudentId = await getStudentId();
      const studentId = storedStudentId ? parseInt(storedStudentId) : 3;

      const payload: any = {
        phone: phoneVal,
        school_name: schoolVal,
        field_of_study: fieldVal,
        academic_year: yearVal,
        radius_km: radiusVal,
      };

      await studentAPI.updateProfile(studentId, payload);
      await fetchProfile();
      setEditing(false);
      Alert.alert('Success', 'Profile updated');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      Alert.alert('Error', err.message || 'Failed to save profile');
    }
  };

  // Local settings state
  const [darkMode, setDarkMode] = React.useState(false);
  const [language, setLanguage] = React.useState<'EN' | 'NL' | 'FR'>('EN');
  const [notifications, setNotifications] = React.useState(true);

  // Edit state and form fields for student profile
  const [editing, setEditing] = React.useState(false);
  const [phoneVal, setPhoneVal] = React.useState('');
  const [schoolVal, setSchoolVal] = React.useState('');
  const [fieldVal, setFieldVal] = React.useState('');
  const [yearVal, setYearVal] = React.useState('');
  const [radiusVal, setRadiusVal] = React.useState<number | undefined>(undefined);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFB' }} edges={['top']}>
      <ScrollView contentContainerStyle={isWeb ? styles.containerWeb : styles.containerMobile}>

        {/* Top Header / Nav (Mobile only) */}
        {!isWeb && (
          <View style={styles.mobileHeader}>
            <Pressable onPress={() => router.push('/Student/Dashboard')} style={{ padding: 8 }}>
              <Text style={{ color: '#176B51', fontWeight: '600', fontSize: 14 }}>← Dashboard</Text>
            </Pressable>
            <Text style={styles.mobileTitle}>Profil</Text>
            <View style={{ width: 60 }} />
          </View>
        )}

        <RNView style={isWeb ? styles.layoutRowWeb : styles.layoutColumnMobile}>
          {/* LEFT COLUMN (WEB) / TOP CARD (MOBILE) */}
          <View style={isWeb ? styles.leftCardWeb : styles.headerCardMobile}>
            {isWeb && (
              <Pressable onPress={() => router.push('/Student/Dashboard')} style={{ marginBottom: 16 }}>
                <Text style={{ color: '#176B51', fontWeight: '600', fontSize: 13 }}>← Dashboard</Text>
              </Pressable>
            )}

            <RNView style={isWeb ? styles.leftTopRow : styles.headerRowMobile}>
              {loading ? (
                <ActivityIndicator size="small" color="#176B51" />
              ) : (
                <>
                  <Pressable onPress={uploadAvatar}>
                    <Image
                      source={profile?.avatar_url ? { uri: profile.avatar_url } : require('../../assets/images/blank-profile-picture.png')}
                      style={isWeb ? styles.avatarSmall : styles.avatarMedium}
                    />
                  </Pressable>
                  <RNView style={isWeb ? styles.leftIdentity : styles.headerIdentityMobile}>
                    <Text style={styles.leftName}>
                      {profile?.email || 'Student'}
                    </Text>
                    <Text style={styles.leftEmail}>{profile?.email || 'student@example.com'}</Text>
                  </RNView>
                </>
              )}
            </RNView>

            {/* Navigation / Tabs */}
            <RNView style={isWeb ? styles.controlsContainer : styles.tabsMobile}>
              <Pressable
                style={[
                  isWeb ? styles.controlBtn : styles.tabBtnMobile,
                  panel === 'info' && (isWeb ? styles.controlBtnActive : styles.tabBtnActiveMobile)
                ]}
                onPress={() => setPanel('info')}
              >
                <Text style={panel === 'info' ? styles.controlBtnTextActive : styles.controlBtnText}>My Profile</Text>
              </Pressable>

              <Pressable
                style={[
                  isWeb ? styles.controlBtn : styles.tabBtnMobile,
                  panel === 'settings' && (isWeb ? styles.controlBtnActive : styles.tabBtnActiveMobile)
                ]}
                onPress={() => setPanel('settings')}
              >
                <Text style={panel === 'settings' ? styles.controlBtnTextActive : styles.controlBtnText}>Settings</Text>
              </Pressable>
            </RNView>

            {isWeb && (
              <RNView style={{ marginTop: 'auto' }}>
                <Pressable style={[styles.editBtn, { backgroundColor: '#B00020' }]} onPress={handleLogout}>
                  <Text style={styles.editBtnText}>Log out</Text>
                </Pressable>
              </RNView>
            )}
          </View>

          {/* RIGHT COLUMN (WEB) / CONTENT (MOBILE) */}
          <View style={isWeb ? styles.rightCardWeb : styles.contentCardMobile}>
            {panel === 'info' ? (
              <RNView style={styles.rightContent}>
                {/* LOADING / ERROR Handler */}
                {loading && isWeb ? (
                  <RNView style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator size="large" color="#176B51" /></RNView>
                ) : error ? (
                  <RNView style={{ padding: 40 }}>
                    <Text style={{ color: 'red' }}>{error}</Text>
                    <Pressable onPress={fetchProfile} style={{ marginTop: 10 }}><Text style={{ color: '#176B51' }}>Retry</Text></Pressable>
                  </RNView>
                ) : (
                  <RNView>
                    {isWeb && (
                      <RNView style={styles.profileHeader}>
                        <RNView>
                          <Text style={styles.label}>School</Text>
                          <Text style={styles.value}>{profile?.school_name || 'Not set'}</Text>
                        </RNView>
                        <Pressable onPress={uploadAvatar}>
                          <Image source={profile?.avatar_url ? { uri: profile.avatar_url } : require('../../assets/images/blank-profile-picture.png')} style={styles.avatarLarge} />
                        </Pressable>
                      </RNView>
                    )}

                    {!isWeb && (
                      <RNView style={{ marginBottom: 16 }}>
                        <Text style={styles.label}>School</Text>
                        {editing ? (
                          <TextInput
                            style={[styles.value, { borderBottomWidth: 1, borderColor: '#ccc', paddingVertical: 4 }]}
                            value={schoolVal}
                            onChangeText={setSchoolVal}
                            placeholder="Enter school"
                          />
                        ) : (
                          <Text style={styles.value}>{profile?.school_name || 'Not set'}</Text>
                        )}
                      </RNView>
                    )}

                    <Text style={styles.label}>Field of Study</Text>
                    {editing ? (
                      <TextInput
                        style={[styles.value, { borderBottomWidth: 1, borderColor: '#ccc', paddingVertical: 4 }]}
                        value={fieldVal}
                        onChangeText={setFieldVal}
                        placeholder="Enter field of study"
                      />
                    ) : (
                      <Text style={styles.value}>{profile?.field_of_study || 'Not set'}</Text>
                    )}

                    <Text style={styles.label}>Academic Year</Text>
                    {editing ? (
                      <TextInput
                        style={[styles.value, { borderBottomWidth: 1, borderColor: '#ccc', paddingVertical: 4 }]}
                        value={yearVal}
                        onChangeText={setYearVal}
                        placeholder="Enter year (e.g. 2025)"
                        keyboardType="numeric"
                      />
                    ) : (
                      <Text style={styles.value}>{profile?.academic_year || 'Not set'}</Text>
                    )}

                    <Text style={styles.label}>Email</Text>
                    {/* Emails usually aren't editable here, so we keep this as Text */}
                    <Text style={[styles.value, { opacity: editing ? 0.5 : 1 }]}>{profile?.email || 'Not set'}</Text>

                    <Text style={styles.label}>Phone</Text>
                    {editing ? (
                      <TextInput
                        style={[styles.value, { borderBottomWidth: 1, borderColor: '#ccc', paddingVertical: 4 }]}
                        value={phoneVal}
                        onChangeText={setPhoneVal}
                        placeholder="Enter phone number"
                        keyboardType="phone-pad"
                      />
                    ) : (
                      <Text style={styles.value}>{profile?.phone || 'Not set'}</Text>
                    )}

                    <Text style={styles.label}>Search Radius</Text>
                    {editing ? (
                      <TextInput
                        style={[styles.value, { borderBottomWidth: 1, borderColor: '#ccc', paddingVertical: 4 }]}
                        value={radiusVal ? String(radiusVal) : ''}
                        onChangeText={(text) => setRadiusVal(Number(text))}
                        placeholder="Enter radius (km)"
                        keyboardType="numeric"
                      />
                    ) : (
                      <Text style={styles.value}>{profile?.radius_km ? `${profile.radius_km} km` : 'Not set'}</Text>
                    )}

                    <Text style={styles.label}>Verification Status</Text>
                    <Text style={styles.value}>{profile?.verification_status === 'verified' ? '✅ Verified' : '⏳ Pending verification'}</Text>
                  </RNView>
                )}

                <RNView style={styles.rightFooter}>
                  {editing ? (
                    // STATE 1: If editing is TRUE, show "Save"
                    <Pressable style={[styles.editBtn, { backgroundColor: '#007AFF' }]} onPress={saveProfile}>
                      <Text style={[styles.editBtnText, { color: 'white' }]}>Save</Text>
                    </Pressable>
                  ) : (
                    // STATE 2: If editing is FALSE, show "Edit profile"
                    <Pressable style={styles.editBtn} onPress={startEdit}>
                      <Text style={styles.editBtnText}>Edit profile</Text>
                    </Pressable>
                  )}

                  {!isWeb && (
                    <Pressable style={[styles.editBtn, { backgroundColor: '#FFEBEB', marginTop: 12 }]} onPress={handleLogout}>
                      <Text style={{ color: '#D32F2F', fontWeight: '700' }}>Log out</Text>
                    </Pressable>
                  )}
                </RNView>
              </RNView>
            ) : (
              <RNView style={styles.rightContent}>
                <RNView>
                  <Text style={styles.sectionTitle}>Settings</Text>

                  <Text style={styles.label}>Language</Text>
                  <RNView style={styles.langRow}>
                    {(['EN', 'NL', 'FR'] as const).map((lang) => (
                      <Pressable
                        key={lang}
                        style={[styles.langBtn, language === lang && styles.langBtnActive]}
                        onPress={() => setLanguage(lang)}
                      >
                        <Text style={language === lang ? styles.langBtnTextActive : styles.langBtnText}>{lang}</Text>
                      </Pressable>
                    ))}
                  </RNView>

                  <Text style={styles.label}>Dark mode</Text>
                  <RNView style={styles.switchRow}>
                    <Switch value={darkMode} onValueChange={setDarkMode} />
                    <Text style={styles.value}>{darkMode ? 'On' : 'Off'}</Text>
                  </RNView>

                  <Text style={styles.label}>Notifications</Text>
                  <RNView style={styles.switchRow}>
                    <Switch value={notifications} onValueChange={setNotifications} />
                    <Text style={styles.value}>{notifications ? 'On' : 'Off'}</Text>
                  </RNView>
                </RNView>

                {!isWeb && (
                  <RNView style={{ marginTop: 30 }}>
                    <Pressable style={[styles.editBtn, { backgroundColor: '#FFEBEB' }]} onPress={handleLogout}>
                      <Text style={{ color: '#D32F2F', fontWeight: '700' }}>Log out</Text>
                    </Pressable>
                  </RNView>
                )}
              </RNView>
            )}
          </View>
        </RNView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // --- CONTAINER & LAYOUT ---
  containerWeb: { padding: 28, paddingBottom: 60, maxWidth: 1200, alignSelf: 'center', width: '100%' },
  containerMobile: { padding: 16, paddingBottom: 40 },

  layoutRowWeb: { flexDirection: 'row', gap: 24, alignItems: 'flex-start' },
  layoutColumnMobile: { flexDirection: 'column', gap: 16 },

  // --- MOBILE HEADER ---
  mobileHeader: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  mobileTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B1B1B',
  },

  // --- LEFT CARD (WEB) / TOP CARD (MOBILE) ---
  leftCardWeb: {
    width: 300,
    borderWidth: 1,
    borderColor: '#E4E6EB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#fff',
    height: 580,
    flexShrink: 0
  },
  headerCardMobile: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  leftTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  headerRowMobile: { flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 20 },

  avatarSmall: { width: 50, height: 50, borderRadius: 25 },
  avatarMedium: { width: 80, height: 80, borderRadius: 40 },

  leftIdentity: { marginLeft: 0 },
  headerIdentityMobile: { alignItems: 'center' },

  leftName: { fontWeight: '700', fontSize: 16, color: '#1B1B1B' },
  leftEmail: { color: '#7A7F85', marginTop: 2, fontSize: 13 },

  // --- CONTROLS / TABS ---
  controlsContainer: { width: '100%', marginBottom: 20 },

  tabsMobile: { flexDirection: 'row', backgroundColor: '#F4F6F7', borderRadius: 99, padding: 4, width: '100%' },

  controlBtn: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, backgroundColor: 'transparent', marginBottom: 4, width: '100%' },
  controlBtnActive: { backgroundColor: '#176B51' },

  tabBtnMobile: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 99 },
  tabBtnActiveMobile: { backgroundColor: '#fff', shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },

  controlBtnText: { color: '#64748B', fontWeight: '600', fontSize: 15 },
  controlBtnTextActive: { color: '#fff', fontWeight: '600', fontSize: 15 },

  // --- RIGHT CARD (WEB) / CONTENT CARD (MOBILE) ---
  rightCardWeb: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E4E6EB',
    borderRadius: 12,
    padding: 24,
    backgroundColor: '#fff',
    minHeight: 580
  },
  contentCardMobile: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  rightContent: { flex: 1, justifyContent: 'space-between' },
  profileHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 },
  avatarLarge: { width: 100, height: 100, borderRadius: 12 },

  // --- COMMON ELEMENTS ---
  label: { color: '#64748B', marginTop: 16, fontWeight: '600', fontSize: 13, textTransform: 'uppercase' },
  value: { fontSize: 16, marginTop: 4, color: '#1B1B1B', fontWeight: '500' },

  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16, color: '#1B1B1B' },

  editBtn: { marginTop: 24, backgroundColor: '#176B51', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  editBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  langRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  langBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#F4F6F7' },
  langBtnActive: { backgroundColor: '#176B51' },
  langBtnText: { color: '#64748B', fontWeight: '600' },
  langBtnTextActive: { color: '#fff', fontWeight: '600' },

  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },

  rightFooter: { marginTop: 24 },
});
