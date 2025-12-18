import * as React from 'react';
import { StyleSheet, Pressable, View as RNView, Switch, Image, TextInput, Alert, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { authAPI, getClientId } from '@/services/api';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API URL - use localhost for web, IP address for mobile
const API_BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:3000' 
  : 'http://10.2.88.141:3000';

export default function ClientProfile() {
  const [panel, setPanel] = React.useState<'info' | 'settings'>('info');
  const router = useRouter();
  const [clientProfile, setClientProfile] = React.useState<any>(null);

  // Local settings state (demo only)
  const [darkMode, setDarkMode] = React.useState(false);
  const [language, setLanguage] = React.useState<'EN' | 'NL' | 'FR'>('EN');
  const [notifications, setNotifications] = React.useState(true);
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [addressLine, setAddressLine] = React.useState('');
  const [postalCode, setPostalCode] = React.useState('');
  const [city, setCity] = React.useState('');
  const [region, setRegion] = React.useState('');
  const [firstJobNeedsApproval, setFirstJobNeedsApproval] = React.useState(false);

  async function handleLogout() {
    const { authAPI } = await import('@/services/api');
    await authAPI.logout();
    router.replace('/');
  }

  // Load profile
  React.useEffect(() => {
    async function loadProfile() {
      try {
        let userJson: string | null = null;
        let userId: number | null = null;
        
        if (Platform.OS === 'web') {
          userJson = localStorage.getItem('user');
          if (userJson) {
            const user = JSON.parse(userJson);
            userId = user.id;
          }
        } else {
          // Mobile - use AsyncStorage
          userJson = await AsyncStorage.getItem('user');
          if (userJson) {
            const user = JSON.parse(userJson);
            userId = user.id;
          } else {
            // Fallback to clientId
            const clientId = await getClientId();
            if (clientId) userId = parseInt(clientId);
          }
        }
        
        if (!userId) return;

        const res = await fetch(`${API_BASE_URL}/clients/${userId}`);
        if (!res.ok) throw new Error('Failed to fetch profile');

        const data = await res.json();
        
        // Add cache-busting timestamp to avatar URL
        if (data.client?.avatar_url) {
          data.client.avatar_url = `${data.client.avatar_url}?t=${Date.now()}`;
        }
        
        setClientProfile(data.client);

        // Pre-fill settings form
        setEmail(data.client.email || '');
        setPhone(data.client.phone || '');
        setLanguage(data.client.preferred_language?.toUpperCase() || 'NL');
        setAddressLine(data.client.address_line || '');
        setPostalCode(data.client.postal_code || '');
        setCity(data.client.city || '');
        setRegion(data.client.region || '');
        setFirstJobNeedsApproval(!!data.client.first_job_needs_approval);

      } catch (err) {
        console.error('Error loading client profile:', err);
      }
    }
    loadProfile();
  }, []);

  // Avatar upload functie
  const uploadAvatar = async () => {
    if (!clientProfile?.id) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      const localUri = result.assets[0].uri;

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
        const filename = localUri.split('/').pop() || 'avatar.jpg';
        formData.append('avatar', {
          uri: localUri,
          name: filename,
          type: 'image/jpeg',
        } as any);
      }

      try {
        const uploadResponse = await fetch(
          `http://localhost:3000/clients/${clientProfile.id}/avatar`,
          {
            method: 'POST',
            body: formData,
          }
        );

        const data = await uploadResponse.json();
        if (data.avatar_url) {
          // Add cache-busting timestamp
          const avatarWithTimestamp = `${data.avatar_url}?t=${Date.now()}`;
          setClientProfile((prev: any) => ({ ...prev, avatar_url: avatarWithTimestamp }));
        }
      } catch (err) {
        console.error('Error uploading avatar:', err);
        Alert.alert('Error', 'Failed to upload avatar');
      }
    }
  };

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
          address_line: addressLine,
          postal_code: postalCode,
          city,
          region,
          first_job_needs_approval: firstJobNeedsApproval,
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
    } catch (err) {
      console.error('Update profile error:', err);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  return (
    <View style={styles.container}>
      <RNView style={styles.layoutRow}>
        <View style={styles.leftCard}>
          <RNView style={styles.leftTopRow}>
            <Pressable onPress={uploadAvatar}>
              <Image 
                source={clientProfile?.avatar_url 
                  ? { uri: clientProfile.avatar_url } 
                  : require('../../assets/images/blank-profile-picture.png')} 
                style={styles.avatarSmall} 
              />
            </Pressable>
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
              {/* Avatar groot in info panel */}
              <RNView style={styles.profileHeader}>
                <RNView>
                  <Text style={styles.label}>Email</Text>
                  <Text style={styles.value}>{clientProfile?.email}</Text>
                </RNView>
                <Pressable onPress={uploadAvatar}>
                  <Image 
                    source={clientProfile?.avatar_url 
                      ? { uri: clientProfile.avatar_url } 
                      : require('../../assets/images/blank-profile-picture.png')} 
                    style={styles.avatarLarge} 
                  />
                </Pressable>
              </RNView>

              <Text style={styles.label}>Phone</Text>
              <Text style={styles.value}>{clientProfile?.phone || 'N/A'}</Text>

              <Text style={styles.label}>Address</Text>
              <Text style={styles.value}>{clientProfile?.address_line || 'N/A'}</Text>

              <Text style={styles.label}>Postal Code</Text>
              <Text style={styles.value}>{clientProfile?.postal_code || 'N/A'}</Text>

              <Text style={styles.label}>City</Text>
              <Text style={styles.value}>{clientProfile?.city || 'N/A'}</Text>

              <Text style={styles.label}>Region</Text>
              <Text style={styles.value}>{clientProfile?.region || 'N/A'}</Text>

              <Text style={styles.label}>First Job Needs Approval</Text>
              <Text style={styles.value}>{clientProfile?.first_job_needs_approval ? 'Yes' : 'No'}</Text>
            </RNView>
          ) : (
            <RNView style={styles.rightContent}>
              <Text style={styles.sectionTitle}>Settings</Text>

              <Text style={styles.label}>Email</Text>
              <TextInput value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" keyboardType="email-address" />

              <Text style={styles.label}>Phone</Text>
              <TextInput value={phone} onChangeText={setPhone} style={styles.input} keyboardType="phone-pad" />

              <Text style={styles.label}>Address</Text>
              <TextInput value={addressLine} onChangeText={setAddressLine} style={styles.input} />

              <Text style={styles.label}>Postal Code</Text>
              <TextInput value={postalCode} onChangeText={setPostalCode} style={styles.input} />

              <Text style={styles.label}>City</Text>
              <TextInput value={city} onChangeText={setCity} style={styles.input} />

              <Text style={styles.label}>Region</Text>
              <TextInput value={region} onChangeText={setRegion} style={styles.input} />

              <Text style={styles.label}>First Job Needs Approval</Text>
              <Switch value={firstJobNeedsApproval} onValueChange={setFirstJobNeedsApproval} />

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
  avatarLarge: { width: 120, height: 120, borderRadius: 60 },
  leftTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 0 },
  leftIdentity: { marginLeft: 8 },
  leftName: { fontWeight: '700', fontSize: 16 },
  leftEmail: { color: '#7A7F85', marginTop: 4 },
  rightCard: { flex: 1, borderWidth: 1, borderColor: '#E4E6EB', borderRadius: 12, padding: 12, backgroundColor: '#fff', minHeight: 560 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#E4E6EB', borderRadius: 8, padding: 8, marginTop: 4 },
  editBtn: { marginTop: 16, backgroundColor: '#176B51', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  editBtnText: { color: '#fff', fontWeight: '700' },
});
