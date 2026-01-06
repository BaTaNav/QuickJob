import * as React from 'react';
import { StyleSheet, Pressable, View as RNView, Switch, Image, ActivityIndicator, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { studentAPI, authAPI, getStudentId } from '@/services/api';

const API_BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:3000' 
  : 'http://10.2.88.69:3000';

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

  // Local settings state (demo only)
  const [darkMode, setDarkMode] = React.useState(false);
  const [language, setLanguage] = React.useState<'EN' | 'NL' | 'FR'>('EN');
  const [notifications, setNotifications] = React.useState(true);

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
                <Image 
                  source={require('../../assets/images/blank-profile-picture.png')} 
                  style={styles.avatarSmall} 
                />
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
                      <Text style={styles.value}>
                        {profile?.school_name || 'Not set'}
                      </Text>
                    </RNView>

                    <Image 
                      source={require('../../assets/images/blank-profile-picture.png')} 
                      style={styles.avatarLarge} 
                    />
                  </RNView>

                  <Text style={styles.label}>Field of Study</Text>
                  <Text style={styles.value}>{profile?.field_of_study || 'Not set'}</Text>

                  <Text style={styles.label}>Academic Year</Text>
                  <Text style={styles.value}>{profile?.academic_year || 'Not set'}</Text>

                  <Text style={styles.label}>Email</Text>
                  <Text style={styles.value}>{profile?.email || 'Not set'}</Text>

                  <Text style={styles.label}>Phone</Text>
                  <Text style={styles.value}>{profile?.phone || 'Not set'}</Text>

                  <Text style={styles.label}>Search Radius</Text>
                  <Text style={styles.value}>{profile?.radius_km ? `${profile.radius_km} km` : 'Not set'}</Text>

                  <Text style={styles.label}>Verification Status</Text>
                  <Text style={styles.value}>{profile?.verification_status === 'verified' ? '✅ Verified' : '⏳ Pending verification'}</Text>
                </RNView>
              )}

              <RNView style={styles.rightFooter}>
                <Pressable style={styles.editBtn} onPress={() => { /* TODO: edit profile */ }}>
                  <Text style={styles.editBtnText}>Edit profile</Text>
                </Pressable>
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
});
