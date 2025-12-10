import * as React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Link } from 'expo-router';

export default function StudentProfile() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your profile</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>Student Name</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>student@example.com</Text>

        <Text style={styles.label}>Phone</Text>
        <Text style={styles.value}>+32 123 45 678</Text>

        <Pressable style={styles.editBtn} onPress={() => { /* TODO: edit profile */ }}>
          <Text style={styles.editBtnText}>Edit profile</Text>
        </Pressable>
      </View>

      <Link href="/Student/Dashboard">Back to dashboard</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E4E6EB', borderRadius: 12, padding: 16 },
  label: { color: '#7A7F85', marginTop: 12, fontWeight: '600' },
  value: { fontSize: 16, marginTop: 4 },
  editBtn: { marginTop: 16, backgroundColor: '#176B51', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  editBtnText: { color: '#fff', fontWeight: '700' },
});
