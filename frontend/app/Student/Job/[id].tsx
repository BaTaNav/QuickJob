import * as React from 'react';
import { StyleSheet, ScrollView, Pressable, ActivityIndicator, Image, Alert, Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { jobsAPI, studentAPI, getStudentId, saveStudentId } from '../../../services/api';

export default function JobDetail() {
  const params = useLocalSearchParams();
  const idParam = params.id as string | undefined;
  const router = useRouter();

  // Job Data State
  const [job, setJob] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [geoLoading, setGeoLoading] = React.useState(false);
  const [coords, setCoords] = React.useState<{ latitude: number; longitude: number } | null>(null);

  // User/Application State
  const [studentId, setStudentId] = React.useState<number | null>(null);
  const [applicationStatus, setApplicationStatus] = React.useState<string | null>(null); // 'pending', 'accepted', etc.
  const [applicationId, setApplicationId] = React.useState<number | null>(null);
  
  // Action Loading States
  const [applying, setApplying] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);

  // Attempt to repair session without logging out: derive studentId from stored user
  const repairStudentSession = React.useCallback(async (): Promise<number | null> => {
    try {
      let userJson: string | null = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        userJson = localStorage.getItem('user');
      } else {
        userJson = await AsyncStorage.getItem('user');
      }
      if (!userJson) {
        console.warn('No stored user found to repair session');
        return null;
      }
      const user = JSON.parse(userJson);
      if (user && user.role === 'student' && user.id) {
        await saveStudentId(String(user.id));
        setStudentId(Number(user.id));
        console.log('Repaired session with studentId from user:', user.id);
        return Number(user.id);
      }
      console.warn('Stored user is not a student or missing id');
      return null;
    } catch (e) {
      console.warn('Failed to repair session:', e);
      return null;
    }
  }, []);

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

        // 1b. Request server-side geocoding from composed address (always use address-based flow)
        try {
          const parts: string[] = [];
          if (jobData.street) {
            let s = jobData.street;
            if (jobData.house_number) s += ` ${jobData.house_number}`;
            parts.push(s);
          }
          if (jobData.postal_code) parts.push(jobData.postal_code);
          if (jobData.city) parts.push(jobData.city);
          const composed = parts.join(' ').trim();
          if (composed.length > 0) {
            setGeoLoading(true);
            try {
              const res = await fetch(`http://localhost:3000/jobs/geocode?address=${encodeURIComponent(composed)}`);
              if (res.ok) {
                const j = await res.json();
                setCoords({ latitude: Number(j.latitude), longitude: Number(j.longitude) });
              }
            } catch (e) {
              console.warn('Geocode request failed:', e);
            } finally {
              setGeoLoading(false);
            }
          }
        } catch (e) {
          console.warn('Geocode compose failed:', e);
        }

        // 2. Fetch Current Student ID
        const sid = await getStudentId();
        console.log('Retrieved studentId from storage:', sid);
        
        if (sid) {
          const sidNum = Number(sid);
          
          // Validate student profile exists (guards against stale IDs)
          try {
            await studentAPI.getProfile(sidNum);
            setStudentId(sidNum);
          } catch (e) {
            console.warn('Stored studentId is invalid, attempting session repair without logout');
            const repairedId = await repairStudentSession();
            if (!repairedId) {
              Alert.alert('Sessiefout', 'Je sessie lijkt ongeldig. Ga naar Profiel en druk op "Login" als nodig.');
            }
          }

          // Check if student has already applied to this job
          try {
            const applications = await studentAPI.getApplications(sidNum);
            const existingApp = applications.find((app: any) => app.job_id === Number(idParam));
            if (existingApp) {
              setApplicationStatus(existingApp.status);
              setApplicationId(existingApp.id);
            }
          } catch (err) {
            console.warn('Could not fetch applications:', err);
          }
        } else {
          console.warn('No student ID found in storage - user may not be logged in');
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
    
    console.log('Applying with studentId:', studentId, 'for jobId:', idParam);
    
    try {
      // Validate profile before attempting apply
      try {
        await studentAPI.getProfile(Number(studentId));
      } catch (e) {
        console.warn('Profile validation failed; trying session repair');
        const repairedId = await repairStudentSession();
        if (!repairedId) {
          Alert.alert('Sessiefout', 'Je sessie lijkt ongeldig. Probeer opnieuw of ga naar Login.');
          return;
        }
      }

      setApplying(true);
      await studentAPI.applyForJob(Number(studentId), Number(idParam));
      
      setApplicationStatus('pending'); // Update UI locally
      Alert.alert('Succes!', 'Je sollicitatie is verstuurd. Je vindt deze terug bij Pending.');
      router.push('/Student/Dashboard'); // Optional: redirect back
    } catch (err: any) {
      console.error('Error applying for job:', err);
      
      let errorMessage = err?.message || 'Kon niet solliciteren';
      
      // Check for specific error cases
      if (err?.message?.includes('foreign key') || err?.message?.includes('not present in table')) {
        console.warn('FK/session error on apply; attempting one-time session repair');
        const beforeId = studentId;
        const repairedId = await repairStudentSession();
        if (repairedId && repairedId !== beforeId) {
          try {
            await studentAPI.applyForJob(Number(repairedId), Number(idParam));
            setApplicationStatus('pending');
            Alert.alert('Succes!', 'Je sollicitatie is verstuurd na sessieherstel.');
            router.push('/Student/Dashboard');
            return; // Done after successful retry
          } catch (retryErr: any) {
            console.error('Retry after repair failed:', retryErr);
            errorMessage = retryErr?.message || 'Kon niet solliciteren (na herstel).';
          }
        } else {
          errorMessage = 'Je account is niet correct ingelogd. Herstel mislukt; probeer opnieuw in te loggen.';
        }
      }
      
      Alert.alert('Error', errorMessage);
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

      {/* Map / Geocoding */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Locatie</Text>
        {geoLoading ? (
          <ActivityIndicator color="#176B51" />
        ) : coords ? (
          Platform.OS === 'web' ? (
            // Web: embed OpenStreetMap iframe
            <View style={{ width: '100%', height: 260 }}>
              <iframe
                title="job-map"
                width="100%"
                height="100%"
                frameBorder={0}
                scrolling="no"
                src={`https://www.openstreetmap.org/export/embed.html?marker=${coords.latitude}%2C${coords.longitude}&layer=mapnik&bbox=${coords.longitude-0.02}%2C${coords.latitude-0.01}%2C${coords.longitude+0.02}%2C${coords.latitude+0.01}`}
                style={{ borderRadius: 8 }}
              />
              <Pressable onPress={() => window.open(`https://www.openstreetmap.org/?mlat=${coords.latitude}&mlon=${coords.longitude}#map=16/${coords.latitude}/${coords.longitude}`, '_blank')}>
                <Text style={{ color: '#176B51', marginTop: 8 }}>Open in OpenStreetMap</Text>
              </Pressable>
            </View>
          ) : (
            // Native: show a simple 'Open in maps' button (avoids native map dependency)
            <View>
              <Text style={styles.sectionText}>Kaart beschikbaar — open in Maps app</Text>
              <Pressable
                style={[styles.applyBtn, { marginTop: 8 }]}
                onPress={() => {
                  const lat = coords.latitude;
                  const lon = coords.longitude;
                  const url = Platform.OS === 'ios'
                    ? `maps:0,0?q=${lat},${lon}`
                    : `geo:${lat},${lon}?q=${lat},${lon}`;
                  Linking.openURL(url).catch(() => {
                    // Fallback to Google Maps web
                    const web = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
                    Linking.openURL(web);
                  });
                }}
              >
                <Text style={[styles.applyBtnText, { color: '#fff' }]}>Open in Maps</Text>
              </Pressable>
            </View>
          )
        ) : (
          <Text style={styles.sectionText}>Locatie niet beschikbaar</Text>
        )}
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
