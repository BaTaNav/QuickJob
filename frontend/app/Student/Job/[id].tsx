import * as React from 'react';
import { StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { jobsAPI } from '../../../services/api';

export default function JobDetail() {
  const params = useLocalSearchParams();
  const idParam = params.id as string | undefined;
  const router = useRouter();

  const [job, setJob] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

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
      if (Platform.OS === 'web') {
        window.alert('Je moet ingelogd zijn om te solliciteren');
      } else {
        Alert.alert('Error', 'Je moet ingelogd zijn om te solliciteren');
      }
      return;
    }
    try {
      setApplying(true);
      await studentAPI.applyForJob(Number(studentId), Number(idParam));
      setApplicationStatus('pending');
      if (Platform.OS === 'web') {
        window.alert('Succes! Je sollicitatie is verstuurd. Je vindt deze terug bij Pending.');
        router.replace('/Student/Dashboard?tab=pending');
      } else {
        Alert.alert('Succes!', 'Je sollicitatie is verstuurd. Je vindt deze terug bij Pending.', [
          { text: 'OK', onPress: () => router.replace('/Student/Dashboard?tab=pending') }
        ]);
      }
    } catch (err: any) {
      if (Platform.OS === 'web') {
        window.alert(err?.message || 'Kon niet solliciteren');
      } else {
        Alert.alert('Error', err?.message || 'Kon niet solliciteren');
      }
    } finally {
      setApplying(false);
    }
  };

  const handleCancel = async () => {
    if (!studentId || !applicationId) return;
    
    const doCancel = async () => {
      try {
        setCancelling(true);
        await studentAPI.cancelApplication(Number(studentId), applicationId);
        setApplicationStatus('withdrawn');
        if (Platform.OS === 'web') {
          window.alert('Je sollicitatie is geannuleerd.');
          router.push('/Student/Dashboard');
        } else {
          Alert.alert('Geannuleerd', 'Je sollicitatie is geannuleerd.', [
            { text: 'OK', onPress: () => router.push('/Student/Dashboard') }
          ]);
        }
      } catch (err: any) {
        if (Platform.OS === 'web') {
          window.alert(err?.message || 'Kon niet annuleren');
        } else {
          Alert.alert('Error', err?.message || 'Kon niet annuleren');
        }
      } finally {
        setCancelling(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Weet je zeker dat je je sollicitatie wilt annuleren?')) {
        doCancel();
      }
    } else {
      Alert.alert(
        'Sollicitatie annuleren',
        'Weet je zeker dat je je sollicitatie wilt annuleren?',
        [
          { text: 'Nee', style: 'cancel' },
          {
            text: 'Ja, annuleer',
            style: 'destructive',
            onPress: doCancel,
          },
        ]
      );
    }
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
          {job.hourly_or_fixed === 'fixed' && job.fixed_price ? `Vaste prijs: €${job.fixed_price}` : 'Uurloon' }
        </Text>
      </View>

      {job.status === 'open' && (
        <Pressable style={styles.applyBtn} onPress={() => { /* TODO: apply flow */ }}>
          <Text style={styles.applyBtnText}>Apply for this job</Text>
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

      {/* Withdrawn status */}
      {applicationStatus === 'withdrawn' && (
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
