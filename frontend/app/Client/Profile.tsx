import * as React from 'react';
import { StyleSheet, Pressable, View as RNView, Switch, Image, TextInput, Alert, Platform, ScrollView, RefreshControl, } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { authAPI, getClientId } from '@/services/api';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = Platform.OS === 'web'
  ? 'http://localhost:3000'
  : 'http://10.2.88.163:3000';

const isWeb = Platform.OS === 'web';

export default function ClientProfile() {
  const [panel, setPanel] = React.useState<'info' | 'settings'>('info');
  const router = useRouter();
  const [clientProfile, setClientProfile] = React.useState<any>(null);

  // Local settings state
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
  const [refreshing, setRefreshing] = React.useState(false);

  // 1. Define the fetching logic outside useEffect so it can be reused
  const fetchProfile = React.useCallback(async () => {
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
  }, []);

  // 2. Load on Mount
  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // 3. Handle Pull-to-Refresh
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [fetchProfile]);

  // Avatar upload functie
  const uploadAvatar = async () => {
    if (!clientProfile?.id) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      const localUri = asset.uri;
      const formData = new FormData();

      if (Platform.OS === 'web') {
        // --- WEB LOGICA ---
        const response = await fetch(localUri);
        const blob = await response.blob();

        const blobExt = blob.type.split('/')[1] || 'jpg';
        const properFilename = `avatar.${blobExt === 'jpeg' ? 'jpg' : blobExt}`;

        formData.append('avatar', blob, properFilename);
      } else {
        // --- MOBILE LOGICA ---
        // Bepaal extensie en mime type op basis van de URI of asset data
        const filename = localUri.split('/').pop() || 'avatar.jpg';

        // Simpele mime-type gok op basis van extensie
        let type = 'image/jpeg';
        if (filename.endsWith('.png')) type = 'image/png';
        else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) type = 'image/jpeg';


        formData.append('avatar', {
          uri: localUri,
          name: filename,
          type: type,
        } as any);
      }

      console.log('Uploading avatar to:', `${API_BASE_URL}/clients/${clientProfile.id}/avatar`);

      // Gebruik fetch ZONDER 'Content-Type' header voor FormData (browser/native doet dit zelf)
      const uploadResponse = await fetch(
        `${API_BASE_URL}/clients/${clientProfile.id}/avatar`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
            // GEEN Content-Type hier zetten! Dat breekt de boundary.
          },
        }
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload failed with status:', uploadResponse.status, errorText);
        throw new Error(`Server returned ${uploadResponse.status}: ${errorText}`);
      }

      const data = await uploadResponse.json();
      console.log('Upload success:', data);

      if (data.avatar_url) {
        // Add cache-busting timestamp
        const avatarWithTimestamp = `${data.avatar_url}?t=${Date.now()}`;
        setClientProfile((prev: any) => ({ ...prev, avatar_url: avatarWithTimestamp }));
        Alert.alert('Succes', 'Profielfoto bijgewerkt!');
      } else {
        Alert.alert('Info', 'Upload leek gelukt, maar geen URL ontvangen.');
      }

    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      Alert.alert('Error', `Upload mislukt: ${err.message}`);
    }
  };

  const handleSaveSettings = async () => {
    if (!clientProfile) return;
    const userId = clientProfile.id;

    try {
      const res = await fetch(`${API_BASE_URL}/clients/${userId}`, {
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
      // Merge user (client) + profile fields so the UI immediately reflects updates
      const mergedClient = { ...(updated.client || {}), ...(updated.profile || {}) };
      setClientProfile(mergedClient);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err) {
      console.error('Update profile error:', err);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
      <ScrollView contentContainerStyle={isWeb ? styles.containerWeb : styles.containerMobile}>

        {/* LAYOUT LOGICA */}
        <RNView style={isWeb ? styles.layoutRowWeb : styles.layoutColumnMobile}>

          {/* LINKER KOLOM (Web) / BOVENKANT (Mobile) */}
          <View style={isWeb ? styles.leftCardWeb : styles.headerCardMobile}>
            <Pressable onPress={() => router.push('/Client/DashboardClient')} style={{ padding: 8 }}>
              <Text style={{ color: '#176B51', fontWeight: '600', fontSize: 14 }}>← Dashboard</Text>
            </Pressable>
            <RNView style={isWeb ? styles.leftTopRow : styles.headerRowMobile}>

              <Pressable onPress={uploadAvatar}>
                <Image
                  source={clientProfile?.avatar_url
                    ? { uri: clientProfile.avatar_url }
                    : require('../../assets/images/blank-profile-picture.png')}
                  style={isWeb ? styles.avatarSmall : styles.avatarMedium}
                />
              </Pressable>
              <RNView style={isWeb ? styles.leftIdentity : styles.headerIdentityMobile}>
                <Text style={styles.leftName}>{clientProfile?.email || 'Client Name'}</Text>
                <Text style={styles.leftEmail}>{clientProfile?.email || 'client@example.com'}</Text>
              </RNView>
            </RNView>

            {/* Navigatie Knoppen (Tabs op mobile) */}
            <RNView style={isWeb ? styles.controlsContainer : styles.tabsMobile}>
              <Pressable
                style={[
                  isWeb ? styles.controlBtn : styles.tabBtnMobile,
                  panel === 'info' && (isWeb ? styles.controlBtnActive : styles.tabBtnActiveMobile)
                ]}
                onPress={() => setPanel('info')}
              >
                <Text style={panel === 'info' ? styles.controlBtnTextActive : styles.controlBtnText}>Profile</Text>
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
              <RNView>
                <Pressable style={[styles.editBtn, { backgroundColor: '#B00020' }]} onPress={handleLogout}>
                  <Text style={styles.editBtnText}>Log out</Text>
                </Pressable>
              </RNView>
            )}
          </View>

          {/* RECHTER KOLOM (Web) / ONDERKANT (Mobile) */}
          <View style={isWeb ? styles.rightCardWeb : styles.contentCardMobile}>
            {panel === 'info' ? (
              <RNView style={styles.rightContent}>
                {isWeb && (
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
                )}

                <Text style={styles.label}>Phone</Text>
                <Text style={styles.value}>{clientProfile?.phone || 'N/A'}</Text>

                <Text style={styles.label}>Address</Text>
                <Text style={styles.value}>{clientProfile?.address_line || 'N/A'}</Text>

                <RNView style={{ flexDirection: 'row', gap: 20 }}>
                  <RNView>
                    <Text style={styles.label}>Postal Code</Text>
                    <Text style={styles.value}>{clientProfile?.postal_code || 'N/A'}</Text>
                  </RNView>
                  <RNView>
                    <Text style={styles.label}>City</Text>
                    <Text style={styles.value}>{clientProfile?.city || 'N/A'}</Text>
                  </RNView>
                </RNView>

                <Text style={styles.label}>Region</Text>
                <Text style={styles.value}>{clientProfile?.region || 'N/A'}</Text>

                <Text style={styles.label}>First Job Needs Approval</Text>
                <Text style={styles.value}>{clientProfile?.first_job_needs_approval ? 'Yes' : 'No'}</Text>

                {!isWeb && (
                  <Pressable style={[styles.editBtn, { backgroundColor: '#B00020', marginTop: 32 }]} onPress={handleLogout}>
                    <Text style={styles.editBtnText}>Log out</Text>
                  </Pressable>
                )}
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

                <RNView style={{ flexDirection: 'row', gap: 10 }}>
                  <RNView style={{ flex: 1 }}>
                    <Text style={styles.label}>Postal Code</Text>
                    <TextInput value={postalCode} onChangeText={setPostalCode} style={styles.input} />
                  </RNView>
                  <RNView style={{ flex: 1 }}>
                    <Text style={styles.label}>City</Text>
                    <TextInput value={city} onChangeText={setCity} style={styles.input} />
                  </RNView>
                </RNView>

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

                <Pressable
                  style={styles.editBtn}
                  onPress={async () => {
                    await handleSaveSettings(); // Save data
                    await onRefresh();          // Refresh data
                    // Navigate to the Profile tab. 
                    // CHANGE THIS PATH if your profile tab is at a different route (e.g., '/Student/Profile')
                    router.replace('/Client/Profile');
                  }}
                >
                  <Text style={styles.editBtnText}>Save Settings</Text>
                </Pressable>
              </RNView>
            )}
          </View>
        </RNView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Web Containers
  containerWeb: { padding: 28, backgroundColor: '#fff', paddingBottom: 60, minHeight: '100%' },
  layoutRowWeb: { flexDirection: 'row', gap: 24, justifyContent: 'center' },
  leftCardWeb: { width: 300, borderWidth: 1, borderColor: '#E4E6EB', borderRadius: 12, padding: 14, backgroundColor: '#fff', height: 560, justifyContent: 'space-between', flexShrink: 0 },
  rightCardWeb: { width: 600, borderWidth: 1, borderColor: '#E4E6EB', borderRadius: 12, padding: 24, backgroundColor: '#fff', minHeight: 560 },

  // Mobile Containers
  containerMobile: { padding: 16, backgroundColor: '#F8F9FA' },
  layoutColumnMobile: { flexDirection: 'column', gap: 16 },
  headerCardMobile: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 0, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  contentCardMobile: { backgroundColor: '#fff', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  headerRowMobile: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  headerIdentityMobile: { marginLeft: 16 },
  tabsMobile: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tabBtnMobile: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActiveMobile: { borderBottomColor: '#176B51' },

  // Generieke stijlen
  leftTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 0 },
  controlsContainer: { alignItems: 'center' },
  controlBtn: { paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, backgroundColor: '#F4F6F7', marginBottom: 8, alignItems: 'flex-start', width: '100%' },
  controlBtnActive: { backgroundColor: '#176B51' },
  controlBtnText: { color: '#333', fontWeight: '600' },
  controlBtnTextActive: { color: isWeb ? '#fff' : '#176B51', fontWeight: '600' }, // Mobile text color fix

  label: { color: '#7A7F85', marginTop: 12, fontWeight: '600', fontSize: 13 },
  value: { fontSize: 16, marginTop: 4, color: '#1B1B1B' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },

  langRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  langBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#F4F6F7' },
  langBtnActive: { backgroundColor: '#176B51' },
  langBtnText: { color: '#333', fontWeight: '600' },
  langBtnTextActive: { color: '#fff', fontWeight: '600' },

  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  rightContent: { flex: 1, justifyContent: 'flex-start' },

  // Avatars
  avatarSmall: { width: 60, height: 60, borderRadius: 30 },
  avatarMedium: { width: 70, height: 70, borderRadius: 35 },
  avatarLarge: { width: 120, height: 120, borderRadius: 60 },

  leftIdentity: { marginLeft: 8 },
  leftName: { fontWeight: '700', fontSize: 16 },
  leftEmail: { color: '#7A7F85', marginTop: 4, fontSize: 13 },

  profileHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#E4E6EB', borderRadius: 8, padding: 12, marginTop: 4, backgroundColor: '#FAFAFA' },
  editBtn: { marginTop: 24, backgroundColor: '#176B51', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  editBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
