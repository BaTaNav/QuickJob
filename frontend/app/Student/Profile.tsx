import * as React from 'react';
import { StyleSheet, Pressable, View as RNView, Switch, Image, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { studentAPI, authAPI, getStudentId } from '@/services/api';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/ThemeContext';


export default function StudentProfile() {
  const { darkMode, toggleDarkMode } = useTheme();
  const [panel, setPanel] = React.useState<'info' | 'settings'>('info');
  const [profile, setProfile] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [formData, setFormData] = React.useState<any>({});
  const router = useRouter();

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
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.replace('/'); // Go to home page instead of login
  }

  const startEdit = () => {
    setFormData({
      phone: profile?.phone || '',
      school_name: profile?.school_name || '',
      field_of_study: profile?.field_of_study || '',
      academic_year: profile?.academic_year || '',
      radius_km: profile?.radius_km || '',
    });
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const handleChange = (key: string, value: string | number) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const submitProfileUpdate = async () => {
    try {
      const studentId = await getStudentId();
      const updated = await studentAPI.updateProfile(parseInt(studentId!), formData);
      setProfile(updated.data || updated);
      setEditing(false);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
    }
  };

  const uploadAvatar = async () => {
    const studentId = await getStudentId();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      const localUri = result.assets[0].uri;
      
      // Determine proper file extension
      const getExtensionFromUri = (uri: string): string => {
        // Try to get extension from URI
        const uriParts = uri.split('.');
        const lastPart = uriParts[uriParts.length - 1].toLowerCase();
        
        // Check if it's a valid image extension
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(lastPart.split('?')[0])) {
          return lastPart.split('?')[0];
        }
        // Default to jpg for web blob/data URIs
        return 'jpg';
      };

      const ext = getExtensionFromUri(localUri);
      const filename = `avatar.${ext}`;

      const formData = new FormData();

      // Check if running in web browser or native
      if (typeof window !== 'undefined' && (localUri.startsWith('data:') || localUri.startsWith('blob:'))) {
        // Web: convert data/blob URI to blob
        const response = await fetch(localUri);
        const blob = await response.blob();
        
        // Use the correct extension based on blob type
        const blobExt = blob.type.split('/')[1] || 'jpg';
        const properFilename = `avatar.${blobExt === 'jpeg' ? 'jpg' : blobExt}`;
        
        formData.append('avatar', blob, properFilename);
      } else {
        // React Native: use the object format
        formData.append('avatar', {
          uri: localUri,
          name: filename,
          type: 'image/jpeg',
        } as any);
      }

      const uploadResponse = await fetch(
        `http://localhost:3000/students/${studentId}/avatar`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await uploadResponse.json();
      if (data.avatar_url) {
        setProfile((prev: any) => ({ ...prev, avatar_url: data.avatar_url }));
      }
    }
  };

  const [language, setLanguage] = React.useState<'EN' | 'NL' | 'FR'>('EN');
  const [notifications, setNotifications] = React.useState(true);

  const themedStyles = React.useMemo(() => ({
    container: { ...styles.container, backgroundColor: darkMode ? '#0f172a' : '#fff' },
    leftCard: { ...styles.leftCard, backgroundColor: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#E4E6EB' },
    rightCard: { ...styles.rightCard, backgroundColor: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#E4E6EB' },
    controlBtn: { ...styles.controlBtn, backgroundColor: darkMode ? '#334155' : '#F4F6F7' },
    controlBtnText: { ...styles.controlBtnText, color: darkMode ? '#e2e8f0' : '#333' },
    input: { ...styles.input, backgroundColor: darkMode ? '#334155' : '#fff', borderColor: darkMode ? '#475569' : '#E4E6EB', color: darkMode ? '#e2e8f0' : '#000' },
    label: { ...styles.label, color: darkMode ? '#94a3b8' : '#7A7F85' },
    value: { ...styles.value, color: darkMode ? '#e2e8f0' : '#000' },
    sectionTitle: { ...styles.sectionTitle, color: darkMode ? '#f1f5f9' : '#000' },
    leftName: { ...styles.leftName, color: darkMode ? '#f1f5f9' : '#000' },
    leftEmail: { ...styles.leftEmail, color: darkMode ? '#94a3b8' : '#7A7F85' },
  }), [darkMode]);

  return (
    <RNView style={themedStyles.container}>
      <RNView style={styles.layoutRow}>
        <RNView style={themedStyles.leftCard}>
          <Pressable onPress={() => router.push('/Student/Dashboard')} style={{ marginBottom: 12 }}>
            <Text style={{ color: '#176B51', fontWeight: '600', fontSize: 12 }}>← Dashboard</Text>
          </Pressable>
          <RNView style={styles.leftTopRow}>
            {loading ? (
              <ActivityIndicator size="small" color="#176B51" />
            ) : (
              <>
                <Image
                  source={profile?.avatar_url ? { uri: profile.avatar_url } : require('../../assets/images/blank-profile-picture.png')}
                  style={styles.avatarSmall}
                />
                <RNView style={styles.leftIdentity}>
                  <Text style={themedStyles.leftName}>{profile?.school_name || 'Student'}</Text>
                  <Text style={themedStyles.leftEmail}>{profile?.email || 'student@example.com'}</Text>
                </RNView>
              </>
            )}
          </RNView>

          <RNView style={styles.controlsContainer}>
            <Pressable
              style={[themedStyles.controlBtn, panel === 'info' && styles.controlBtnActive]}
              onPress={() => setPanel('info')}
            >
              <Text style={panel === 'info' ? styles.controlBtnTextActive : themedStyles.controlBtnText}>My Profile</Text>
            </Pressable>
            <Pressable
              style={[themedStyles.controlBtn, panel === 'settings' && styles.controlBtnActive]}
              onPress={() => setPanel('settings')}
            >
              <Text style={panel === 'settings' ? styles.controlBtnTextActive : themedStyles.controlBtnText}>Settings</Text>
            </Pressable>
          </RNView>

          <RNView>
            <Pressable style={[styles.editBtn, { backgroundColor: '#B00020' }]} onPress={handleLogout}>
              <Text style={styles.editBtnText}>Log out</Text>
            </Pressable>
          </RNView>
        </RNView>

        <RNView style={themedStyles.rightCard}>
          {panel === 'info' ? (
            <ScrollView contentContainerStyle={styles.rightContent}>
              {loading ? (
                <RNView style={{ padding: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#176B51" />
                </RNView>
              ) : error ? (
                <RNView style={{ padding: 40, alignItems: 'center' }}>
                  <Text style={themedStyles.label}>Error loading profile</Text>
                  <Text style={themedStyles.value}>{error}</Text>
                  <Pressable style={styles.editBtn} onPress={fetchProfile}>
                    <Text style={styles.editBtnText}>Retry</Text>
                  </Pressable>
                </RNView>
              ) : (
                <RNView>
                  <RNView style={styles.profileHeader}>
                    <RNView>
                      <Text style={themedStyles.label}>School</Text>
                      {editing ? (
                        <TextInput
                          style={themedStyles.input}
                          value={formData.school_name}
                          onChangeText={(val) => handleChange('school_name', val)}
                          placeholderTextColor={darkMode ? '#64748b' : '#999'}
                        />
                      ) : (
                        <Text style={themedStyles.value}>{profile?.school_name || 'Not set'}</Text>
                      )}
                    </RNView>

                    <Pressable onPress={uploadAvatar}>
                      <Image
                        source={profile?.avatar_url ? { uri: profile.avatar_url } : require('../../assets/images/blank-profile-picture.png')}
                        style={styles.avatarLarge}
                      />
                    </Pressable>
                  </RNView>


                  <Text style={themedStyles.label}>Field of Study</Text>
                  {editing ? (
                    <TextInput
                      style={themedStyles.input}
                      value={formData.field_of_study}
                      onChangeText={(val) => handleChange('field_of_study', val)}
                      placeholderTextColor={darkMode ? '#64748b' : '#999'}
                    />
                  ) : (
                    <Text style={themedStyles.value}>{profile?.field_of_study || 'Not set'}</Text>
                  )}

                  <Text style={themedStyles.label}>Academic Year</Text>
                  {editing ? (
                    <TextInput
                      style={themedStyles.input}
                      value={formData.academic_year}
                      onChangeText={(val) => handleChange('academic_year', val)}
                      placeholderTextColor={darkMode ? '#64748b' : '#999'}
                    />
                  ) : (
                    <Text style={themedStyles.value}>{profile?.academic_year || 'Not set'}</Text>
                  )}

                  <Text style={themedStyles.label}>Phone</Text>
                  {editing ? (
                    <TextInput
                      style={themedStyles.input}
                      value={formData.phone}
                      onChangeText={(val) => handleChange('phone', val)}
                      keyboardType="phone-pad"
                      placeholderTextColor={darkMode ? '#64748b' : '#999'}
                    />
                  ) : (
                    <Text style={themedStyles.value}>{profile?.phone || 'Not set'}</Text>
                  )}

                  <Text style={themedStyles.label}>Search Radius</Text>
                  {editing ? (
                    <TextInput
                      style={themedStyles.input}
                      value={String(formData.radius_km)}
                      onChangeText={(val) => handleChange('radius_km', Number(val))}
                      keyboardType="numeric"
                      placeholderTextColor={darkMode ? '#64748b' : '#999'}
                    />
                  ) : (
                    <Text style={themedStyles.value}>{profile?.radius_km ? `${profile.radius_km} km` : 'Not set'}</Text>
                  )}

                  <Text style={themedStyles.label}>Verification Status</Text>
                  <Text style={themedStyles.value}>
                    {profile?.verification_status === 'verified' ? '✅ Verified' : '⏳ Pending verification'}
                  </Text>

                  <RNView style={styles.rightFooter}>
                    {editing ? (
                      <RNView>
                        <Pressable style={styles.editBtn} onPress={submitProfileUpdate}>
                          <Text style={styles.editBtnText}>Save changes</Text>
                        </Pressable>
                        <Pressable style={[styles.editBtn, { backgroundColor: '#B00020' }]} onPress={cancelEdit}>
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
              )}
            </ScrollView>
          ) : (
            <RNView style={styles.rightContent}>
              <RNView>
                <Text style={themedStyles.sectionTitle}>Settings</Text>

                <Text style={themedStyles.label}>Language</Text>
                <RNView style={styles.langRow}>
                  {(['EN', 'NL', 'FR'] as const).map((lang) => (
                    <Pressable
                      key={lang}
                      style={[darkMode ? styles.langBtnDark : styles.langBtn, language === lang && styles.langBtnActive]}
                      onPress={() => setLanguage(lang)}
                    >
                      <Text style={language === lang ? styles.langBtnTextActive : (darkMode ? styles.langBtnTextDark : styles.langBtnText)}>{lang}</Text>
                    </Pressable>
                  ))}
                </RNView>

                <Text style={themedStyles.label}>Dark mode</Text>
                <RNView style={styles.switchRow}>
                  <Switch value={darkMode} onValueChange={toggleDarkMode} />
                  <Text style={themedStyles.value}>{darkMode ? 'On' : 'Off'}</Text>
                </RNView>

                <Text style={themedStyles.label}>Notifications</Text>
                <RNView style={styles.switchRow}>
                  <Switch value={notifications} onValueChange={setNotifications} />
                  <Text style={themedStyles.value}>{notifications ? 'On' : 'Off'}</Text>
                </RNView>
              </RNView>
              <RNView style={styles.rightFooter} />
            </RNView>
          )}
        </RNView>
      </RNView>
    </RNView>
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
  rightContent: { flexGrow: 1, justifyContent: 'space-between' },
  rightFooter: { marginTop: 12 },
  avatarSmall: { width: 100, height: 100, borderRadius: 50, marginBottom: 0 },
  avatarLarge: { width: 120, height: 120, borderRadius: 60 },
  leftTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 0 },
  leftIdentity: { marginLeft: 8 },
  leftName: { fontWeight: '700', fontSize: 16 },
  leftEmail: { color: '#7A7F85', marginTop: 4 },
  rightCard: { flex: 1, borderWidth: 1, borderColor: '#E4E6EB', borderRadius: 12, padding: 12, backgroundColor: '#fff', minHeight: 560 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#E4E6EB', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginTop: 4, fontSize: 16 },

  // Dark mode styles
  langBtnDark: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#334155' },
  langBtnTextDark: { color: '#e2e8f0', fontWeight: '600' },
});
