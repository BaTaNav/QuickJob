import * as React from 'react';
import { StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Image } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { jobsAPI, studentAPI, getStudentId } from '@/services/api';

export default function JobDetail() {
  const params = useLocalSearchParams();
  const idParam = params.id as string | undefined;
  const router = useRouter();

  const [job, setJob] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [studentId, setStudentId] = React.useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = React.useState<string | null>(null);
  const [applicationId, setApplicationId] = React.useState<number | null>(null);
  const [applying, setApplying] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);

  // Load student ID on mount
  React.useEffect(() => {
    const loadStudentId = async () => {
      const id = await getStudentId();
      setStudentId(id);
    };
    loadStudentId();
  }, []);

  // Check if student has already applied
  React.useEffect(() => {
    const checkApplication = async () => {
      if (!studentId || !idParam) return;
      try {
        const applications = await studentAPI.getApplications(Number(studentId));
        const existing = applications.find((app: any) => app.job_id === Number(idParam));
        if (existing) {
          setApplicationStatus(existing.status);
          setApplicationId(existing.id);
        }
      } catch (err) {
        console.log('No existing application');
      }
    };
    checkApplication();
  }, [studentId, idParam]);

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
          disabled={applying}
        >
          <Text style={styles.applyBtnText}>
            {applying ? 'Bezig met solliciteren...' : 'Solliciteren'}
          </Text>
        </Pressable>
      )}

      {/* Pending status - can cancel */}
      {applicationStatus === 'pending' && (
        <View style={styles.statusContainer}>
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>⏳ Sollicitatie in afwachting</Text>
          </View>
          <Pressable
            style={[styles.cancelBtn, cancelling && styles.cancelBtnDisabled]}
            onPress={handleCancel}
            disabled={cancelling}
          >
            <Text style={styles.cancelBtnText}>
              {cancelling ? 'Annuleren...' : 'Sollicitatie annuleren'}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Accepted status - cannot cancel */}
      {applicationStatus === 'accepted' && (
        <View style={styles.statusContainer}>
          <View style={styles.acceptedBadge}>
            <Text style={styles.acceptedText}>✅ Geaccepteerd! Je bent aangenomen voor deze job.</Text>
          </View>
          <Text style={styles.noCancel}>Je kunt een geaccepteerde job niet meer annuleren.</Text>
        </View>
      )}

      {/* Cancelled status */}
      {applicationStatus === 'cancelled' && (
        <View style={styles.statusContainer}>
          <View style={styles.cancelledBadge}>
            <Text style={styles.cancelledText}>❌ Sollicitatie geannuleerd</Text>
          </View>
        </View>
      )}

      {/* Back to dashboard */}
      <Pressable style={styles.backBtn} onPress={() => router.push('/Student/Dashboard')}>
        <Text style={styles.backBtnText}>← Terug naar dashboard</Text>
      </Pressable>
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
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  statusContainer: {
    marginTop: 24,
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  pendingText: {
    color: '#92400E',
    fontWeight: '600',
  },
  acceptedBadge: {
    backgroundColor: '#D1FAE5',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  acceptedText: {
    color: '#065F46',
    fontWeight: '600',
  },
  cancelledBadge: {
    backgroundColor: '#FEE2E2',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelledText: {
    color: '#991B1B',
    fontWeight: '600',
  },
  cancelBtn: {
    marginTop: 12,
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  cancelBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  noCancel: {
    marginTop: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  backBtn: {
    marginTop: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backBtnText: {
    color: '#176B51',
    fontWeight: '600',
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
