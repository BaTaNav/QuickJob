import * as React from 'react';
import { StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
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
    const run = async () => {
      if (!idParam) {
        setError('No job id provided');
        setLoading(false);
        return;
      }
      try {
        const data = await jobsAPI.getJob(Number(idParam));
        setJob(data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load job');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [idParam]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'red' }}>{error}</Text>
        <Pressable onPress={() => router.push('/Student/Dashboard')}>
          <Text style={styles.back}>Back to dashboard</Text>
        </Pressable>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.container}>
        <Text>No job found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Pressable onPress={() => router.push('/Student/Dashboard')}>
        <Text style={styles.back}>Back to dashboard</Text>
      </Pressable>

      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>{job.title || 'Job'}</Text>
        <Text style={styles.jobMeta}>{job.category_name || ''}</Text>
      </View>

      <View style={styles.section}>
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

      {job.status === 'open' ? (
        <Pressable
          style={[styles.applyBtn, applying && { opacity: 0.7 }]}
          onPress={async () => {
            if (!job || applying) return;
            setApplying(true);
            try {
              const sid = await getStudentId();
              if (!sid) {
                throw new Error('No student id found; please log in');
              }
              await studentAPI.applyForJob(Number(sid), job.id);
              router.push('/Student/Dashboard?tab=pending');
            } catch (err: any) {
              setError(err?.message || 'Failed to apply');
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
});
