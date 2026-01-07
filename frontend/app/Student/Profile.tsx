import * as React from 'react';
import { StyleSheet, Pressable, View as RNView, Switch, Image, ActivityIndicator, TextInput, Alert, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { studentAPI, authAPI, getStudentId } from '@/services/api';
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
      const id = storedStudentId ? parseInt(storedStudentId) : 3; // Default to 3 (test student in database)
      
      const data = await studentAPI.getProfile(id);
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
    router.replace('/'); // Go to home page instead of login
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

      const uploadResponse = await fetch(`http://localhost:3000/students/${studentId}/avatar`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const txt = await uploadResponse.text();
        throw new Error(txt || 'Upload failed');
      }

      const data = await uploadResponse.json();
      if (data.avatar_url) {
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

  // Local settings state (demo only)
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
    <View style={styles.container}>
      <RNView style={styles.layoutRow}>
        {/* Left control card */}
        <View style={styles.leftCard}>
          <Pressable onPress={() => router.push('/Student/Dashboard')} style={{ marginBottom: 12 }}>
            <Text style={{ color: '#176B51', fontWeight: '600', fontSize: 12 }}>← Dashboard</Text>
          </Pressable>
          <RNView style={styles.leftTopRow}>
            {loading ? (
              <ActivityIndicator size="small" color="#176B51" />
            ) : (
              <>
                <Pressable onPress={uploadAvatar}>
                  <Image 
                    source={profile?.avatar_url ? { uri: profile.avatar_url } : require('../../assets/images/blank-profile-picture.png')} 
                    style={styles.avatarSmall} 
                  />
                </Pressable>
                <RNView style={styles.leftIdentity}>
                  <Text style={styles.leftName}>
                    {profile?.school_name || 'Student'}
                  </Text>
                  <Text style={styles.leftEmail}>{profile?.email || 'student@example.com'}</Text>
                </RNView>
              </>
            )}
          </RNView>

          <RNView style={styles.controlsContainer}>
            <Pressable
              style={[styles.controlBtn, panel === 'info' && styles.controlBtnActive]}
              onPress={() => setPanel('info')}
            >
              <Text style={panel === 'info' ? styles.controlBtnTextActive : styles.controlBtnText}>My Profile</Text>
            </Pressable>

            <Pressable
              style={[styles.controlBtn, panel === 'settings' && styles.controlBtnActive]}
              onPress={() => setPanel('settings')}
            >
              <Text style={panel === 'settings' ? styles.controlBtnTextActive : styles.controlBtnText}>Settings</Text>
            </Pressable>
          </RNView>

          <RNView>
            <Pressable style={[styles.editBtn, { backgroundColor: '#B00020' }]} onPress={handleLogout}>
              <Text style={styles.editBtnText}>Log out</Text>
            </Pressable>
          </RNView>
        </View>

        {/* Right content card: shows profile info or settings depending on selection */}
        <View style={styles.rightCard}>
          {panel === 'info' ? (
            <RNView style={styles.rightContent}>
              {loading ? (
                <RNView style={{ padding: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#176B51" />
                </RNView>
              ) : error ? (
                <RNView style={{ padding: 40, alignItems: 'center' }}>
                  <Text style={styles.label}>Error loading profile</Text>
                  <Text style={styles.value}>{error}</Text>
                  <Pressable style={styles.editBtn} onPress={fetchProfile}>
                    <Text style={styles.editBtnText}>Retry</Text>
                  </Pressable>
                </RNView>
              ) : (
                <RNView>
                  <RNView style={styles.profileHeader}>
                    <RNView>
                      <Text style={styles.label}>School</Text>
                      {editing ? (
                        <TextInput value={schoolVal} onChangeText={setSchoolVal} style={styles.input} />
                      ) : (
                        <Text style={styles.value}>{profile?.school_name || 'Not set'}</Text>
                      )}
                    </RNView>

                    <Pressable onPress={uploadAvatar}>
                      <Image 
                        source={profile?.avatar_url ? { uri: profile.avatar_url } : require('../../assets/images/blank-profile-picture.png')} 
                        style={styles.avatarLarge} 
                      />
                    </Pressable>
                  </RNView>

                  <Text style={styles.label}>Field of Study</Text>
                  {editing ? (
                    <TextInput value={fieldVal} onChangeText={setFieldVal} style={styles.input} />
                  ) : (
                    <Text style={styles.value}>{profile?.field_of_study || 'Not set'}</Text>
                  )}

                  <Text style={styles.label}>Academic Year</Text>
                  {editing ? (
                    <TextInput value={yearVal} onChangeText={setYearVal} style={styles.input} />
                  ) : (
                    <Text style={styles.value}>{profile?.academic_year || 'Not set'}</Text>
                  )}

                  <Text style={styles.label}>Email</Text>
                  <Text style={styles.value}>{profile?.email || 'Not set'}</Text>

                  <Text style={styles.label}>Phone</Text>
                  {editing ? (
                    <TextInput value={phoneVal} onChangeText={setPhoneVal} style={styles.input} />
                  ) : (
                    <Text style={styles.value}>{profile?.phone || 'Not set'}</Text>
                  )}

                  <Text style={styles.label}>Search Radius</Text>
                  {editing ? (
                    <TextInput value={radiusVal !== undefined ? String(radiusVal) : ''} onChangeText={t => setRadiusVal(t ? parseFloat(t) : undefined)} style={styles.input} keyboardType="numeric" />
                  ) : (
                    <Text style={styles.value}>{profile?.radius_km ? `${profile.radius_km} km` : 'Not set'}</Text>
                  )}

                  <Text style={styles.label}>Verification Status</Text>
                  <Text style={styles.value}>{profile?.verification_status === 'verified' ? '✅ Verified' : '⏳ Pending verification'}</Text>
                </RNView>
              )}

              <RNView style={styles.rightFooter}>
                {editing ? (
                  <RNView style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable style={[styles.editBtn, { backgroundColor: '#176B51' }]} onPress={saveProfile}>
                      <Text style={styles.editBtnText}>Save</Text>
                    </Pressable>
                    <Pressable style={[styles.editBtn, { backgroundColor: '#B0B0B0' }]} onPress={cancelEdit}>
                      <Text style={styles.editBtnText}>Cancel</Text>
                    </Pressable>
                  </RNView>
                ) : (
                  <Pressable style={styles.editBtn} onPress={startEdit}>
                    <Text style={styles.editBtnText}>Edit profile</Text>
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

              <RNView style={styles.rightFooter} />
            </RNView>
          )}
        </View>
      </RNView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 28, backgroundColor: '#fff', paddingBottom: 60 },
  layoutRow: { flexDirection: 'row', gap: 24 },
  leftCard: { width: 300, borderWidth: 1, borderColor: '#E4E6EB', borderRadius: 12, padding: 14, backgroundColor: '#fff', height: 560, justifyContent: 'space-between', flexShrink: 0 },
  leftTitle: { fontWeight: '700', marginBottom: 12 },
  controlBtn: { paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, backgroundColor: '#F4F6F7', marginBottom: 8, alignItems: 'flex-start', width: '100%' },
  controlsContainer: { alignItems: 'center' },
  controlBtnActive: { backgroundColor: '#176B51' },
  controlBtnText: { color: '#333', fontWeight: '600' },
  controlBtnTextActive: { color: '#fff', fontWeight: '600' },
  
  label: { color: '#7A7F85', marginTop: 12, fontWeight: '600' },
  value: { fontSize: 16, marginTop: 4 },
  editBtn: { marginTop: 16, backgroundColor: '#176B51', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  editBtnText: { color: '#fff', fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  langRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  langBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#F4F6F7' },
  langBtnActive: { backgroundColor: '#176B51' },
  langBtnText: { color: '#333', fontWeight: '600' },
  langBtnTextActive: { color: '#fff', fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  rightContent: { flex: 1, justifyContent: 'space-between' },
  rightFooter: { marginTop: 12 },
  avatarSmall: { width: 100, height: 100, borderRadius: 50, marginBottom: 0 },
  avatarLarge: { width: 120, height: 120, borderRadius: 60 },
  leftTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 0 },
  leftIdentity: { marginLeft: 8 },
  leftName: { fontWeight: '700', fontSize: 16 },
  leftEmail: { color: '#7A7F85', marginTop: 4 },
  rightCard: { flex: 1, borderWidth: 1, borderColor: '#E4E6EB', borderRadius: 12, padding: 12, backgroundColor: '#fff', minHeight: 560 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#E4E6EB', padding: 8, borderRadius: 8, marginTop: 6 },
});
