import * as React from 'react';
import { StyleSheet, Pressable, View as RNView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';

export default function StudentProfile() {
  const [panel, setPanel] = React.useState<'info' | 'settings'>('info');
  const router = useRouter();

  function handleLogout() {
    // Simple navigation for now; replace with real logout logic when available
    router.replace('/');
  }

  return (
    <View style={styles.container}>
      <RNView style={styles.layoutRow}>
        {/* Left control card */}
        <View style={styles.leftCard}>
          <Text style={styles.leftTitle}>Profile</Text>

          <Pressable
            style={[styles.controlBtn, panel === 'info' && styles.controlBtnActive]}
            onPress={() => setPanel('info')}
          >
            <Text style={panel === 'info' ? styles.controlBtnTextActive : styles.controlBtnText}>View Profile</Text>
          </Pressable>

          <Pressable
            style={[styles.controlBtn, panel === 'settings' && styles.controlBtnActive]}
            onPress={() => setPanel('settings')}
          >
            <Text style={panel === 'settings' ? styles.controlBtnTextActive : styles.controlBtnText}>Settings</Text>
          </Pressable>

        </View>

        {/* Right content card: shows profile info or settings depending on selection */}
        <View style={styles.rightCard}>
          {panel === 'info' ? (
            <>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.value}>Student Name</Text>

              <Text style={styles.label}>Bio</Text>
              <Text style={styles.value}>I am a dedicated student looking to help with various tasks and gain experience.</Text>

              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>student@example.com</Text>

              <Text style={styles.label}>Phone</Text>
              <Text style={styles.value}>+32 123 45 678</Text>

              <Text style={styles.label}>School Name</Text>
              <Text style={styles.value}>Example School</Text>

              <Text style={styles.label}>Field of Study</Text>
              <Text style={styles.value}>Computer Science</Text>

              <Pressable style={styles.editBtn} onPress={() => { /* TODO: edit profile */ }}>
                <Text style={styles.editBtnText}>Edit profile</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Settings</Text>

              <Text style={styles.label}>Notifications</Text>
              <Text style={styles.value}>Email, SMS</Text>

              <Text style={styles.label}>Visibility</Text>
              <Text style={styles.value}>Public</Text>

              <Pressable style={[styles.editBtn, { backgroundColor: '#B00020' }]} onPress={handleLogout}>
                <Text style={styles.editBtnText}>Log out</Text>
              </Pressable>
            </>
          )}
        </View>
      </RNView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', paddingBottom: 60 },
  layoutRow: { flexDirection: 'row', gap: 12 },
  leftCard: { width: 140, borderWidth: 1, borderColor: '#E4E6EB', borderRadius: 12, padding: 12, backgroundColor: '#fff' },
  leftTitle: { fontWeight: '700', marginBottom: 12 },
  controlBtn: { paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, backgroundColor: '#F4F6F7', marginBottom: 8, alignItems: 'center' },
  controlBtnActive: { backgroundColor: '#176B51' },
  controlBtnText: { color: '#333', fontWeight: '600' },
  controlBtnTextActive: { color: '#fff', fontWeight: '600' },
  rightCard: { flex: 1, borderWidth: 1, borderColor: '#E4E6EB', borderRadius: 12, padding: 16, backgroundColor: '#fff' },
  label: { color: '#7A7F85', marginTop: 12, fontWeight: '600' },
  value: { fontSize: 16, marginTop: 4 },
  editBtn: { marginTop: 16, backgroundColor: '#176B51', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  editBtnText: { color: '#fff', fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
});
