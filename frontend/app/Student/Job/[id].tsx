import * as React from 'react';
import { StyleSheet, ScrollView, Pressable, ActivityIndicator, Image, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { jobsAPI, studentAPI, getStudentId } from '../../../services/api';

export default function JobDetail() {
  const params = useLocalSearchParams();
  const idParam = params.id as string | undefined;
  const router = useRouter();

  // Job Data State
  const [job, setJob] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  // User/Application State
  const [studentId, setStudentId] = React.useState<number | null>(null);
  const [applicationStatus, setApplicationStatus] = React.useState<string | null>(null); // 'pending', 'accepted', etc.
  const [applicationId, setApplicationId] = React.useState<number | null>(null);
  
  // Action Loading States
  const [applying, setApplying] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);

  React.useEffect(() => {
    const loadData = async () => {
      if (!idParam) {
        setError('No job id provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        // 1. Fetch Job Details
        const jobData = await jobsAPI.getJob(Number(idParam));
        setJob(jobData);

        // 2. Fetch Current Student ID
        const sid = await getStudentId();
        if (sid) {
          setStudentId(Number(sid));
          // Optional: You could check here if the student already applied to this job
          // const status = await studentAPI.checkApplicationStatus(sid, idParam);
          // setApplicationStatus(status);
        }

      } catch (err: any) {
        setError(err?.message || 'Failed to load job');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [idParam]);

  const handleApply = async () => {
    if (!studentId || !idParam) {
      Alert.alert('Error', 'Je moet ingelogd zijn om te solliciteren');
      return;
    }
    try {
      setApplying(true);
      await studentAPI.applyForJob(Number(studentId), Number(idParam));
      
      setApplicationStatus('pending'); // Update UI locally
      Alert.alert('Succes!', 'Je sollicitatie is verstuurd. Je vindt deze terug bij Pending.');
      router.push('/Student/Dashboard'); // Optional: redirect back
    } catch (err: any) {
      console.error(err);
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
        <ActivityIndicator color="#176B51" size="large" />
        <Text style={styles.emptySubtitle}>Job laden...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'red' }}>{error}</Text>
        <Pressable onPress={() => router.push('/Student/Dashboard')}>
          <Text style={styles.backLink}>Back to dashboard</Text>
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
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.category}>{job.category?.name_nl || job.category?.name_en || 'Categorie'}</Text>
      <Text style={styles.pageTitle}>{job.title}</Text>
      
      <Text style={styles.jobMeta}>
        {job.start_time ? new Date(job.start_time).toLocaleString('nl-BE') : 'Starttijd TBA'}
        {(() => {
          const parts: string[] = [];
          if (job.street) {
            let s = job.street;
            if (job.house_number) s += ` ${job.house_number}`;
            parts.push(s);
          }
          if (job.postal_code) parts.push(job.postal_code);
          if (job.city) parts.push(job.city);
          const addr = parts.length > 0 ? parts.join(' ') : '';
          return addr ? ` • ${addr}` : '';
        })()}
      </Text>

      {/* Image Display */}
      {job?.image_url && (
        <Image
          source={{ uri: job.image_url }}
          style={styles.jobImage}
          resizeMode="cover"
        />
      )}

      <View style={styles.section}>
        <Text style={styles.sectionText}>{job.description || 'Geen beschrijving'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Address</Text>
        <Text style={styles.sectionText}>{(() => {
          const parts: string[] = [];
          if (job.street) {
            let s = job.street;
            if (job.house_number) s += ` ${job.house_number}`;
            parts.push(s);
          }
          if (job.postal_code) parts.push(job.postal_code);
          if (job.city) parts.push(job.city);
          if (parts.length > 0) return parts.join(' ');
          return 'Niet opgegeven';
        })()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Budget</Text>
        <Text style={styles.sectionText}>
          {job.hourly_or_fixed === 'fixed' && job.fixed_price 
            ? `Vaste prijs: €${job.fixed_price}` 
            : `Uurloon: €${job.hourly_rate || 'N/A'}`}
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.footer}>
        {/* If user has NOT applied yet */}
        {!applicationStatus && job.status === 'open' && (
          <Pressable
            style={[styles.applyBtn, applying && styles.applyBtnDisabled]}
            onPress={handleApply}
            disabled={applying}
          >
            {applying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.applyBtnText}>Solliciteren</Text>
            )}
          </Pressable>
        )}

        {/* If user HAS applied */}
        {applicationStatus === 'pending' && (
          <View style={styles.statusContainer}>
            <Text style={styles.pendingText}>Je hebt gesolliciteerd (Pending)</Text>
            <Pressable onPress={handleCancel} disabled={cancelling}>
               <Text style={styles.cancelLink}>{cancelling ? 'Bezig...' : 'Annuleren'}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    padding: 20,
    backgroundColor: '#fff',
    paddingBottom: 60,
  },
  category: {
    color: '#176B51',
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
    color: '#000',
  },
  jobMeta: {
    color: '#7A7F85',
    marginBottom: 20,
    fontSize: 14,
  },
  jobImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#333',
  },
  sectionText: {
    color: '#4A4A4A',
    lineHeight: 22,
    fontSize: 15,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  applyBtn: {
    width: '100%',
    backgroundColor: '#176B51',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyBtnDisabled: {
    opacity: 0.7,
    backgroundColor: '#9ca3af',
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  emptySubtitle: {
    color: '#7A7F85',
    marginTop: 8,
    fontSize: 16,
  },
  backLink: {
    color: '#176B51', 
    marginTop: 12,
    fontWeight: '600',
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  pendingText: {
    color: '#F59E0B', // Amber color for pending
    fontWeight: '600',
    marginBottom: 10,
  },
  cancelLink: {
    color: '#EF4444', // Red for cancel
    textDecorationLine: 'underline',
  }
});
