import * as React from 'react';
import { StyleSheet, Pressable, View as RNView, Switch, Image } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';

export default function ClientProfile() {
  const [panel, setPanel] = React.useState<'info' | 'settings'>('info');
  const router = useRouter();

  function handleLogout() {
    // Simple navigation for now; replace with real logout logic when available
    router.replace('/Login');
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
          <RNView style={styles.leftTopRow}>
            <Image source={require('../../assets/images/blank-profile-picture.png')} style={styles.avatarSmall} />
            <RNView style={styles.leftIdentity}>
              <Text style={styles.leftName}>Client Name</Text>
              <Text style={styles.leftEmail}>Client@example.com</Text>
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

        {/* Right content card: shows profile info or settings depending on selection */}
        <View style={styles.rightCard}>
          {panel === 'info' ? (
            <RNView style={styles.rightContent}>
              <RNView>
                <RNView style={styles.profileHeader}>
                  <RNView>
                    <Text style={styles.label}>Contact name</Text>
                    <Text style={styles.value}>Client Name</Text>
                  </RNView>

                  <Image source={require('../../assets/images/blank-profile-picture.png')} style={styles.avatarLarge} />
                </RNView>

                <Text style={styles.label}>About</Text>
                <Text style={styles.value}>I’m looking for help with garden work (mowing, weeding and hedge trimming) for a few hours each week.</Text>

                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>client@example.com</Text>

                <Text style={styles.label}>Phone</Text>
                <Text style={styles.value}>+32 123 45 678</Text>

                <Text style={styles.label}>Address</Text>
                <Text style={styles.value}>123 Garden Lane, Leuven</Text>

                <Text style={styles.label}>Preferred jobs</Text>
                <Text style={styles.value}>Lawn mowing, weeding, hedge trimming</Text>

                <Text style={styles.label}>Availability</Text>
                <Text style={styles.value}>Weekends and weekday evenings</Text>
              </RNView>

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
