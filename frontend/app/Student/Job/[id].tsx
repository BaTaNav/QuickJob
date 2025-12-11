import * as React from 'react';
import { StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function JobDetail() {
  const params = useLocalSearchParams();
  const id = params.id as string | undefined;

  // Minimal inline dataset mirroring Dashboard placeholders so detail can render while API is not ready.
  const mockJobs: Array<any> = [
    { id: 't1', status: 'today', category: 'Delivery', title: 'Grocery pickup', description: 'Pick up groceries and deliver to client.', time: '2025-12-10 10:00', hours: '2', address: 'Rue Example 12, Leuven', pay: '€12/hr' },
    { id: 'u1', status: 'upcoming', category: 'Pet care', title: 'Dog walking', description: 'Walk the dog for 30 minutes.', time: '2025-12-11 14:00', hours: '0.5', address: 'Chaussée de Namur 5, Brussels', pay: '€10/hr' },
    { id: 'a1', status: 'available', category: 'Promotion', title: 'Flyer distribution', description: 'Distribute flyers in the neighbourhood.', time: 'Flexible', hours: '3', address: 'Leuven Centrum', pay: '€9/hr' },
    { id: 'a2', status: 'available', category: 'Gardening', title: 'Lawn mowing', description: 'Mow the lawn for a client.', time: 'Flexible', hours: '2', address: 'Parkstraat 10, Antwerp', pay: '€11/hr' },
    { id: 'p1', status: 'pending', category: 'Home help', title: 'Cleaning help', description: 'Help with light cleaning.', time: 'Pending - 08/12', hours: '4', address: 'Avenue Louise 45, Brussels', pay: '€13/hr' },
    { id: 'ar1', status: 'archive', category: 'Moving', title: 'Moved boxes', description: 'Helped move boxes last week.', time: '2025-12-03', hours: '5', address: 'Rue du Parc 2, Wavre', pay: '€20' },
  ];

  const job = mockJobs.find((j) => j.id === id) ?? null;

  const router = useRouter();

  if (!job) {
    return (
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Job not found</Text>
        <Text style={styles.emptySubtitle}>No job matches id {String(id)}</Text>
        <Pressable onPress={() => router.push('/Student/Dashboard')}>
          <Text style={{ color: '#176B51', marginTop: 12 }}>Back to dashboard</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.category}>{job.category}</Text>
      <Text style={styles.pageTitle}>{job.title}</Text>
      <Text style={styles.jobMeta}>{job.time} • {job.hours} hrs</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.sectionText}>{job.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Address</Text>
        <Text style={styles.sectionText}>{job.address}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pay</Text>
        <Text style={styles.sectionText}>{job.pay}</Text>
      </View>

      {job.status === 'available' && (
        <Pressable style={styles.applyBtn} onPress={() => { /* TODO: apply flow */ }}>
          <Text style={styles.applyBtnText}>Apply for this job</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    paddingBottom: 60,
  },
  headerRow: {
    marginBottom: 8,
  },
  back: {
    color: '#176B51',
    fontWeight: '600',
    marginBottom: 8,
  },
  category: {
    color: '#176B51',
    fontWeight: '700',
    marginBottom: 6,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  jobMeta: {
    color: '#7A7F85',
    marginBottom: 16,
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 6,
  },
  sectionText: {
    color: '#4A4A4A',
    lineHeight: 20,
  },
  applyBtn: {
    marginTop: 24,
    backgroundColor: '#176B51',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#7A7F85',
    marginTop: 8,
  },
});
