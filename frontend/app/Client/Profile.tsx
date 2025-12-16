import * as React from 'react';
import { StyleSheet, Pressable, View as RNView, Switch, Image, TextInput, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';

export default function ClientProfile() {
  const [panel, setPanel] = React.useState<'info' | 'settings'>('info');
  const router = useRouter();
  const [clientProfile, setClientProfile] = React.useState<any>(null);

  // Settings form state
  const [darkMode, setDarkMode] = React.useState(false);
  const [language, setLanguage] = React.useState<'EN' | 'NL' | 'FR'>('EN');
  const [notifications, setNotifications] = React.useState(true);
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');

  function handleLogout() {
    localStorage.removeItem('user');
    router.replace('/Client/DashboardClient');
  }

  // Load profile
  React.useEffect(() => {
    async function loadProfile() {
      try {
        const userJson = localStorage.getItem('user');
        if (!userJson) return;

        const user = JSON.parse(userJson);
        const userId = user.id;

        const res = await fetch(`http://localhost:3000/clients/${userId}`);
        if (!res.ok) throw new Error('Failed to fetch profile');

        const data = await res.json();
        setClientProfile(data.client);

        // Pre-fill settings form
        setEmail(data.client.email || '');
        setPhone(data.client.phone || '');
        setLanguage(data.client.preferred_language?.toUpperCase() || 'NL');
      } catch (err) {
        console.error('Error loading client profile:', err);
      }
    }
    loadProfile();
  }, []);

  // Save settings
  const handleSaveSettings = async () => {
    if (!clientProfile) return;
    const userId = clientProfile.id;

    try {
      const res = await fetch(`http://localhost:3000/clients/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          phone,
          preferred_language: language.toLowerCase(),
          // darkMode and notifications can be stored separately if needed
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Failed to update profile');
      }

      const updated = await res.json();
      setClientProfile(updated.client);
      localStorage.setItem('user', JSON.stringify(updated.client));
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err: any) {
      console.error('Update profile error:', err);
      Alert.alert('Error', err.message || 'Failed to update profile');
    }
  };

  return (
    <View style={styles.container}>
      <RNView style={styles.layoutRow}>
        <View style={styles.leftCard}>
          <RNView style={styles.leftTopRow}>
            <Image source={require('../../assets/images/blank-profile-picture.png')} style={styles.avatarSmall} />
            <RNView style={styles.leftIdentity}>
              <Text style={styles.leftName}>{clientProfile?.email || 'Client Name'}</Text>
              <Text style={styles.leftEmail}>{clientProfile?.email || 'client@example.com'}</Text>
            </RNView>
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

        <View style={styles.rightCard}>
          {panel === 'info' ? (
            <RNView style={styles.rightContent}>
              <RNView>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{clientProfile?.email}</Text>

                <Text style={styles.label}>Phone</Text>
                <Text style={styles.value}>{clientProfile?.phone || 'N/A'}</Text>

                <Text style={styles.label}>Preferred Language</Text>
                <Text style={styles.value}>{clientProfile?.preferred_language?.toUpperCase() || 'NL'}</Text>
              </RNView>
            </RNView>
          ) : (
            <RNView style={styles.rightContent}>
              <Text style={styles.sectionTitle}>Settings</Text>

              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={styles.label}>Phone</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                style={styles.input}
                keyboardType="phone-pad"
              />

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

              <Pressable style={styles.editBtn} onPress={handleSaveSettings}>
                <Text style={styles.editBtnText}>Save Settings</Text>
              </Pressable>
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
  controlBtn: { paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, backgroundColor: '#F4F6F7', marginBottom: 8, alignItems: 'flex-start', width: '100%' },
  controlsContainer: { alignItems: 'center' },
  controlBtnActive: { backgroundColor: '#176B51' },
  controlBtnText: { color: '#333', fontWeight: '600' },
  controlBtnTextActive: { color: '#fff', fontWeight: '600' },
  label: { color: '#7A7F85', marginTop: 12, fontWeight: '600' },
  value: { fontSize: 16, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  langRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  langBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#F4F6F7' },
  langBtnActive: { backgroundColor: '#176B51' },
  langBtnText: { color: '#333', fontWeight: '600' },
  langBtnTextActive: { color: '#fff', fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  rightContent: { flex: 1, justifyContent: 'flex-start' },
  avatarSmall: { width: 100, height: 100, borderRadius: 50 },
  leftTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 0 },
  leftIdentity: { marginLeft: 8 },
  leftName: { fontWeight: '700', fontSize: 16 },
  leftEmail: { color: '#7A7F85', marginTop: 4 },
  rightCard: { flex: 1, borderWidth: 1, borderColor: '#E4E6EB', borderRadius: 12, padding: 12, backgroundColor: '#fff', minHeight: 560 },
  input: { borderWidth: 1, borderColor: '#E4E6EB', borderRadius: 8, padding: 8, marginTop: 4 },
  editBtn: { marginTop: 16, backgroundColor: '#176B51', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  editBtnText: { color: '#fff', fontWeight: '700' },
});
