import * as React from 'react';
import { StyleSheet, ScrollView, Pressable, ActivityIndicator, Image } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { jobsAPI, studentAPI, getStudentId } from '../../../services/api';

export default function JobDetail() {
  const params = useLocalSearchParams();
  const idParam = params.id as string | undefined;
  const router = useRouter();

  const [job, setJob] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [applying, setApplying] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      if (!idParam) {
        setError('No job id provided');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError('');
        const data = await jobsAPI.getJob(Number(idParam));
        setJob(data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load job');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [idParam]);

  const handleApply = async () => {
    if (!studentId || !idParam) {
      Alert.alert('Error', 'Je moet ingelogd zijn om te solliciteren');
      return;
    }
    try {
      setApplying(true);
      await studentAPI.applyForJob(Number(studentId), Number(idParam));
      setApplicationStatus('pending');
      Alert.alert('Succes!', 'Je sollicitatie is verstuurd. Je vindt deze terug bij Pending.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Kon niet solliciteren');
    } finally {
      setApplying(false);
    }
  };

  const handleCancel = async () => {
    if (!studentId || !applicationId) return;

    Alert.alert(
      'Sollicitatie annuleren',
      'Weet je zeker dat je je sollicitatie wilt annuleren?',
      [
        { text: 'Nee', style: 'cancel' },
        {
          text: 'Ja, annuleer',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              await studentAPI.cancelApplication(Number(studentId), applicationId);
              setApplicationStatus('cancelled');
              Alert.alert('Geannuleerd', 'Je sollicitatie is geannuleerd.');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Kon niet annuleren');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#176B51" />
        <Text style={styles.emptySubtitle}>Job laden...</Text>
      </View>
    );
  }

  if (error || !job) {
    return (
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Job not found</Text>
        <Text style={styles.emptySubtitle}>{error || `No job matches id ${String(idParam)}`}</Text>
        <Pressable onPress={() => router.push('/Student/Dashboard')}>
          <Text style={{ color: '#176B51', marginTop: 12 }}>Back to dashboard</Text>
        </Pressable>
      </View>
    );
  }

  return (

    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.category}>{job.category?.name_nl || job.category?.name_en || 'Categorie'}</Text>
      <Text style={styles.pageTitle}>{job.title}</Text>
      <Text style={styles.jobMeta}>
        {job.start_time ? new Date(job.start_time).toLocaleString('nl-BE') : 'Starttijd TBA'}
        {job.area_text ? ` • ${job.area_text}` : ''}
      </Text>

      {job?.image_url && (
        <Image
          source={{ uri: job.image_url }}
          style={styles.jobImage}
          resizeMode="cover"
        />
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.sectionText}>{job.description || 'Geen beschrijving'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Address</Text>
        <Text style={styles.sectionText}>{job.area_text || 'Niet opgegeven'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Budget</Text>
        <Text style={styles.sectionText}>
          {job.hourly_or_fixed === 'fixed' && job.fixed_price ? `Vaste prijs: €${job.fixed_price}` : 'Uurloon'}
        </Text>
      </View>

      {/* Apply Button - only show if job is open and not yet applied */}
      {job.status === 'open' && !applicationStatus && (
        <Pressable
          style={[styles.applyBtn, applying && styles.applyBtnDisabled]}
          onPress={handleApply}
      {job.status === 'open' ? (
        <Pressable
          style={[styles.applyBtn, applying && { opacity: 0.7 }]}
          onPress={async () => {
            if (!job || applying) return;
            setApplying(true);
            // optimistic update: mark as pending so client sees an applicant immediately
            const previousStatus = job.status;
            setJob((j: any) => ({ ...j, status: 'pending' }));
            try {
              // Prefer the student API endpoint which expects student id + job id
              try {
                const sid = await getStudentId();
                if (!sid) {
                  throw new Error('No student id found; please log in');
                }

                // Prefer student API, but keep a fallback. Capture server response.
                let applyResult: any = null;
                try {
                  applyResult = await studentAPI.applyForJob(Number(sid), job.id);
                } catch (innerErr) {
                  console.warn('[Apply] studentAPI failed, trying fallback:', innerErr);
                  const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
                  const res = await fetch(`${API_BASE}/jobs/${job.id}/apply`, { method: 'POST' });
                  try {
                    applyResult = await res.json();
                  } catch (_e) {
                    applyResult = null;
                  }
                }

                console.log('[Apply] server response:', applyResult);

                // Navigate to Dashboard pending tab
                router.push('/Student/Dashboard?tab=pending');
              } catch (innerErr) {
                // Fallback: try jobs endpoint if backend exposes one
                console.warn('[Apply] primary apply attempt failed:', innerErr);
                const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
                try {
                  const res = await fetch(`${API_BASE}/jobs/${job.id}/apply`, { method: 'POST' });
                  try { const json = await res.json(); console.log('[Apply] fallback response:', json); } catch(_){}
                  
                  // Navigate to Dashboard pending tab
                  router.push('/Student/Dashboard?tab=pending');
                } catch (fallbackErr) {
                  console.error('[Apply] fallback also failed:', fallbackErr);
                  throw fallbackErr;
                }
              }
              // keep status as 'pending' — client's flow will accept/deny later
            } catch (err: any) {
              console.error('Apply failed', err);
              // revert optimistic update on error
              setJob((j: any) => ({ ...j, status: previousStatus }));
              setError(err?.message || 'Failed to apply');
              alert('Apply failed. Please try again.');
            } finally {
              setApplying(false);
            }
          }}
          disabled={applying}
        >
          <Text style={styles.applyBtnText}>{applying ? 'Applying…' : 'Apply for this job'}</Text>
        </Pressable>
      ) : job.status === 'pending' ? (
        <View style={{ marginTop: 16 }}>
          <Text style={{ color: '#7A7F85' }}>Application pending</Text>
        </View>
      ) : null}
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

  jobImage: {
    width: '20%',
    height: 300,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#e1e1e1', // Grijze achtergrond terwijl laden
  },


});
