import { StyleSheet, TouchableOpacity, ScrollView, Pressable, Text, View,  Image, ActivityIndicator, Platform, TextInput, Alert, Linking } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import * as React from "react";
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { RefreshCw, Instagram, Linkedin, Facebook, Twitter, Clock, MapPin, Briefcase, CreditCard } from 'lucide-react-native';
import { jobsAPI, studentAPI, getStudentId, paymentAPI } from '../../services/api';

// Platform detection
const isWeb = Platform.OS === 'web';

// Job type definition
interface Job {
  id: number;
  title: string;
  description?: string;
  hourly_rate?: number;
  fixed_price?: number;
  duration?: number;
  area_text?: string;
  location?: string;
  start_time?: string;
  image_url?: string;
  latitude?: number;
  longitude?: number;
  hourly_or_fixed?: 'hourly' | 'fixed';
  category?: {
    id?: number;
    name_en?: string;
    name_nl?: string;
  };
  street?: string;
  house_number?: string;
  postal_code?: string;
  city?: string;
}

function JobImage({ uri }: { uri?: string }) {
  const [errored, setErrored] = React.useState(false);
  // Do not render a placeholder when image is missing — render nothing instead
  if (!uri || errored) return null;

  return (
    <Image
      source={{ uri }}
      style={styles.jobImage}
      resizeMode="cover"
      onError={() => setErrored(true)}
    />
  );
}

export default function StudentDashboard() {
  const params = useLocalSearchParams();
  const initialTab = (params.tab as 'today' | 'upcoming' | 'available' | 'pending' | 'archive') || 'available';

  const [tab, setTab] = React.useState<'today' | 'upcoming' | 'available' | 'pending' | 'archive'>(initialTab);
  const [availableJobs, setAvailableJobs] = React.useState<any[]>([]);
  const [pendingApplications, setPendingApplications] = React.useState<any[]>([]);
  const [dashboardData, setDashboardData] = React.useState<any>({ today: [], upcoming: [], pending: [], archive: [] });

  // Canonical job categories (kept in sync with PostJob.JOB_CATEGORIES)
  const JOB_CATEGORIES = [
    { id: 1, key: 'cleaning', name_nl: 'Schoonmaak', name_fr: 'Nettoyage', name_en: 'Cleaning' },
    { id: 2, key: 'garden', name_nl: 'Tuinwerk', name_fr: 'Jardinage', name_en: 'Gardening' },
    { id: 3, key: 'repair', name_nl: 'Reparatie', name_fr: 'Réparation', name_en: 'Repair' },
    { id: 4, key: 'moving', name_nl: 'Verhuizing', name_fr: 'Déménagement', name_en: 'Moving' },
    { id: 5, key: 'handyman', name_nl: 'Klusjeswerk', name_fr: 'Bricolage', name_en: 'Handyman' },
    { id: 6, key: 'petcare', name_nl: 'Dierenverzorging', name_fr: 'Soins pour animaux', name_en: 'Pet care' },
  ];

  // Only show categories available in PostJob (canonical list). Prepend an 'All' option.
  const categoryOptions = React.useMemo(() => {
    const opts: Array<{ id: number | null; name: string }> = [{ id: null, name: 'All' }];
    JOB_CATEGORIES.forEach((c) => opts.push({ id: c.id, name: c.name_en }));
    return opts;
  }, []);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showFilters, setShowFilters] = React.useState(false);
  const [filterRange, setFilterRange] = React.useState(20);
  const [filterCategory, setFilterCategory] = React.useState<number | 'All'>('All');
  const [filterDate, setFilterDate] = React.useState('Any');
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [userLocation, setUserLocation] = React.useState<{ latitude: number; longitude: number } | null>(null);
  const [showAllJobs, setShowAllJobs] = React.useState(false);
  const [showDatePickerNative, setShowDatePickerNative] = React.useState(false);
  const router = useRouter();

  const fetchAvailable = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const sid = await getStudentId();
      const data = await jobsAPI.getAvailableJobs('open', 50, sid ? Number(sid) : undefined);
      setAvailableJobs(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load jobs';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPending = React.useCallback(async () => {
    try {
      setLoading(true);
      const studentId = await getStudentId();
      if (studentId) {
        const apps = await studentAPI.getApplications(parseInt(studentId, 10));
        // Map applications to Job structure if needed. Assuming apps have a 'job' property.
        // Adjust this mapping based on actual API response structure.
        const jobs = apps.map((app: any) => app.job).filter(Boolean); 
        setPendingApplications(jobs);
      }
    } catch (err) {
       console.log('Error fetching pending jobs:', err);
    } finally {
       setLoading(false);
    }
  }, []);

  // Set tab from params on mount and when params change
  React.useEffect(() => {
    if (params.tab) {
      setTab(params.tab as any);
    }
  }, [params.tab]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Update tab if param exists
      if (params.tab) {
        setTab(params.tab as any);
      }
      // Refresh data
      fetchAvailable();
      fetchPending();
    }, [params.tab, fetchAvailable, fetchPending])
  );

  React.useEffect(() => {
    fetchAvailable();
    fetchPending();
  }, [fetchAvailable, fetchPending]);

  // Try to get user's current location (best-effort). Used only for distance filtering.
  // Guarded so any runtime quirk won't throw a ReferenceError if the setter is unavailable.
  React.useEffect(() => {
    const getLocation = () => {
      try {
        if (typeof navigator !== 'undefined' && navigator.geolocation && typeof navigator.geolocation.getCurrentPosition === 'function') {
          const onSuccess = (pos: any) => {
            try {
              const { latitude, longitude } = pos.coords ?? {};
              if (typeof setUserLocation === 'function') {
                setUserLocation({ latitude, longitude });
              }
            } catch (err) {
              // Defensive: don't let a setter error bubble up
              // (some bundlers/environments might not have the closure as expected)
              // eslint-disable-next-line no-console
              console.warn('Failed to set userLocation:', err);
            }
          };

          const onError = (err: any) => {
            // eslint-disable-next-line no-console
            console.warn('Geolocation unavailable or denied:', err?.message ?? err);
            try {
              if (typeof setUserLocation === 'function') setUserLocation(null);
            } catch (e) {
              // ignore
            }
          };

          navigator.geolocation.getCurrentPosition(onSuccess, onError, { enableHighAccuracy: false, timeout: 5000 });
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Geolocation check failed:', e);
      }
    };
    getLocation();
  }, []);

  const handleRefresh = () => {
    fetchAvailable();
    fetchPending();
  };

  // Filter jobs based on selected filters and exclude already applied jobs
  const filteredJobs = React.useMemo(() => {
    let filtered = availableJobs;

    // Get IDs of jobs the student has already applied to
    const appliedJobIds = new Set(pendingApplications.map(app => app.job_id));

    // Exclude jobs already applied to
    filtered = filtered.filter(job => !appliedJobIds.has(job.id));

    if (filterCategory !== 'All') {
      filtered = filtered.filter(job => {
        const catId = job?.category?.id ?? null;
        return catId === filterCategory;
      });
    }

    if (filterDate === 'Today') {
      const today = new Date().toDateString();
      filtered = filtered.filter(job => {
        if (!job.start_time) return false;
        return new Date(job.start_time).toDateString() === today;
      });
    } else if (filterDate === 'This week') {
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      filtered = filtered.filter(job => {
        if (!job.start_time) return false;
        const jobDate = new Date(job.start_time);
        return jobDate <= weekFromNow;
      });
    } else if (filterDate === 'Specific' && selectedDate) {
      filtered = filtered.filter(job => {
        if (!job.start_time) return false;
        return new Date(job.start_time).toDateString() === new Date(selectedDate).toDateString();
      });
    }

  // Distance filtering: if the 'show all' toggle is ON, skip distance filtering entirely.
  if (showAllJobs) return filtered;

  // Otherwise, if we have user location and a positive range, compute Haversine and filter
    const rangeKm = Number(filterRange) || 0;
    if (userLocation && rangeKm > 0) {
      const toRad = (v: number) => v * Math.PI / 180;
      const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // km
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };

      filtered = filtered.filter(job => {
        const lat = job.latitude != null ? Number(job.latitude) : null;
        const lon = job.longitude != null ? Number(job.longitude) : null;
        if (lat == null || lon == null) {
          // Without coordinates we can't compute distance — exclude these when filtering by range
          return false;
        }
        const dist = haversineKm(userLocation.latitude, userLocation.longitude, lat, lon);
        (job as any)._distance_km = Math.round(dist * 10) / 10;
        return dist <= rangeKm;
      });
    }

    return filtered;
  }, [availableJobs, pendingApplications, filterCategory, filterDate, selectedDate, userLocation, filterRange]);

  const mockJobs: Record<'today' | 'upcoming' | 'available' | 'pending' | 'archive', Array<any>> = {
    today: [],
    upcoming: [],
    available: availableJobs,
    pending: pendingApplications,
    archive: [],
  };

  const jobs = mockJobs[tab] ?? [];
  
  // Bepaal welke lijst getoond moet worden
  const displayJobs = tab === 'available' ? filteredJobs : jobs;
  
  const formatJobAddress = (job: any) => {
    // Prefer structured fields, fall back to area_text
    const parts: string[] = [];
    if (job.street) {
      let s = job.street;
      if (job.house_number) s += ` ${job.house_number}`;
      parts.push(s);
    }
    if (job.postal_code) parts.push(job.postal_code);
    if (job.city) parts.push(job.city);
    if (parts.length > 0) return parts.join(' ');
    // No legacy free-text fallback — rely on structured address
    return '';
  };

  // Handle Stripe account setup
  const handleStripeSetup = async () => {
    try {
      const studentId = await getStudentId();
      if (!studentId) {
        Alert.alert('Error', 'No student ID found');
        return;
      }
      const response = await paymentAPI.connectStudentAccount(parseInt(studentId, 10));
      if (response?.onboarding_url) {
        Linking.openURL(response.onboarding_url);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFB" }} edges={['top']}>
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={[styles.container, !isWeb && styles.containerMobile]}
      >
        {/* HEADER */}
        <View style={[styles.headerRow, !isWeb && styles.headerRowMobile]}>
          <View>
            <Text style={styles.pageTitle}>Student Dashboard</Text>
            <Text style={styles.pageSubtitle}>Find jobs and start earning</Text>
          </View>
          
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable onPress={fetchAvailable} style={styles.refreshBtn}>
              <RefreshCw size={20} color="#64748B" />
            </Pressable>

            <Pressable onPress={() => setShowFilters(s => !s)} style={styles.filterToggleBtn}>
              <Text style={styles.filterToggleText}>{showFilters ? 'Hide filters' : 'Filters'}</Text>
            </Pressable>

            <Pressable onPress={() => setShowAllJobs(v => !v)} style={[styles.filterToggleBtn, { backgroundColor: showAllJobs ? '#176B51' : undefined }]}> 
              <Text style={[styles.filterToggleText, showAllJobs ? { color: '#fff' } : {}]}>{showAllJobs ? 'Showing all' : 'Show all'}</Text>
            </Pressable>
          </View>
        </View>

        {/* Stripe Setup Button */}
        <TouchableOpacity style={styles.stripeBtn} onPress={handleStripeSetup}>
          <CreditCard size={20} color="#fff" />
          <Text style={styles.stripeBtnText}>Setup Stripe Account</Text>
        </TouchableOpacity>

      {/* DOCUMENT BANNER (hidden by default while testing) */}
      {false && ( // Conditional rendering is correct
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Document verification required</Text>
          <Text style={styles.bannerText}>
            You need to upload and verify your documents before you can apply for jobs.
            Please upload your student card, ID card, bank card, and profile photo.
          </Text>

          <TouchableOpacity style={styles.bannerBtn}>
            <Text style={styles.bannerBtnText}>Upload documents</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* NAV TABS */}
      <View style={styles.tabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 6 }}>
          {/* Mapping tabs might be cleaner than repeating, but this structure is fine */}
          <TouchableOpacity style={[styles.tab, tab === 'today' && styles.tabActive]} onPress={() => setTab('today')}>
            <Text style={tab === 'today' ? styles.tabActiveText : styles.tabText}>Today ({mockJobs.today.length})</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tab, tab === 'upcoming' && styles.tabActive]} onPress={() => setTab('upcoming')}>
            <Text style={tab === 'upcoming' ? styles.tabActiveText : styles.tabText}>Upcoming ({mockJobs.upcoming.length})</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tab, tab === 'available' && styles.tabActive]} onPress={() => setTab('available')}>
            <Text style={tab === 'available' ? styles.tabActiveText : styles.tabText}>Available ({filteredJobs.length})</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tab, tab === 'pending' && styles.tabActive]} onPress={() => setTab('pending')}>
            <Text style={tab === 'pending' ? styles.tabActiveText : styles.tabText}>Pending ({pendingApplications.length})</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tab, tab === 'archive' && styles.tabActive]} onPress={() => setTab('archive')}>
            <Text style={tab === 'archive' ? styles.tabActiveText : styles.tabText}>Archive ({mockJobs.archive.length})</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {showFilters && (
        <View style={styles.filterRow}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Category</Text>
            <View style={styles.filterPills}>
              {categoryOptions.map((opt) => (
                <Pressable
                  key={`${opt.id ?? opt.name}`}
                  onPress={() => setFilterCategory(opt.id === null ? 'All' : (opt.id as number))}
                  style={[
                    styles.filterBtn,
                    (opt.id === null && filterCategory === 'All') || (opt.id !== null && filterCategory === opt.id) ? styles.filterBtnActive : undefined,
                  ]}
                >
                  <Text style={(opt.id === null && filterCategory === 'All') || (opt.id !== null && filterCategory === opt.id) ? styles.filterBtnTextActive : styles.filterBtnText}>{opt.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Radius (km)</Text>
            <TextInput
              style={styles.dateInput}
              keyboardType="numeric"
              value={String(filterRange)}
              onChangeText={(t) => setFilterRange(Number(t) || 0)}
            />
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Date</Text>
            <View style={styles.filterPills}>
              {['Any', 'Today', 'This week', 'Specific'].map((d) => (
                <Pressable
                  key={d}
                  onPress={() => setFilterDate(d)}
                  style={[styles.filterBtn, filterDate === d && styles.filterBtnActive]}
                >
                  <Text style={filterDate === d ? styles.filterBtnTextActive : styles.filterBtnText}>{d}</Text>
                </Pressable>
              ))}
            </View>
            {filterDate === 'Specific' && (
              <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {Platform.OS === 'web' ? (
                  <input
                    type="date"
                    value={selectedDate || ''}
                    onChange={(e: any) => setSelectedDate(e.target.value)}
                    style={{ padding: 8, borderRadius: 8, border: '1px solid #E2E8F0' }}
                  />
                ) : (
                  <TextInput
                    placeholder="YYYY-MM-DD"
                    value={selectedDate || ''}
                    onChangeText={setSelectedDate}
                    style={styles.dateInput}
                  />
                )}

                <TouchableOpacity onPress={() => { setSelectedDate(null); setFilterDate('Any'); }} style={styles.clearDateBtn}>
                  <Text style={styles.clearDateText}>Clear</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}

      {/* JOB LIST or EMPTY STATE */}
      {loading && (
        <View style={styles.loadingState}>
          <ActivityIndicator color="#176B51" />
          <Text style={styles.emptySubtitle}>Jobs ophalen...</Text>
        </View>
      )}

      {!loading && error ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={styles.emptyTitle}>Kon jobs niet laden</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity style={styles.bannerBtn} onPress={handleRefresh}>
            <Text style={styles.bannerBtnText}>Opnieuw proberen</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!loading && !error && jobs.length > 0 ? (
        <View style={styles.jobsContainer}>
          <View style={styles.jobsList}>
            {tab === 'pending' ? (
              // Render pending applications
              pendingApplications.map((app: any) => (
                <Pressable
                  key={app.id}
                  style={styles.jobCard}

                  onPress={() => router.push(`/Student/Applied/${app.id}` as never)}

                >
                  <JobImage uri={app.jobs?.image_url} />
                  <View style={styles.pendingHeader}>
                    <Clock size={16} color="#F59E0B" />
                    <Text style={styles.pendingBadge}>Pending Review</Text>
                  </View>



                  <Text style={styles.jobTitle}>{app.jobs?.title || 'Job'}</Text>
                  <Text style={styles.jobDescription}>{app.jobs?.description || 'Geen beschrijving'}</Text>
                  <Text style={styles.jobMeta}>
                    Applied: {new Date(app.applied_at).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {app.jobs?.start_time ? ` • Starts: ${new Date(app.jobs.start_time).toLocaleDateString('nl-BE')}` : ''}
                    {app.jobs?.area_text ? ` • ${app.jobs.area_text}` : ''}
                  </Text>

                </Pressable>

              ))
            ) : (
              // Render available jobs
              filteredJobs.map((job: any) => (
                <Pressable
                  key={job.id}
                  style={styles.jobCard}
                  onPress={() => router.push(`/Student/Job/${job.id}` as never)}
                >
                  <JobImage uri={job.image_url} />
                  <Text style={styles.jobTitle}>{job.title}</Text>
                  <Text style={styles.jobDescription}>{job.description || 'Geen beschrijving'}</Text>
                  <Text style={styles.jobMeta}>
                    {job.start_time ? new Date(job.start_time).toLocaleString('nl-BE') : 'Starttijd TBA'}
                    {job.area_text ? ` • ${job.area_text}` : ''}
                    {job.hourly_or_fixed === 'fixed' && job.fixed_price ? ` • €${job.fixed_price}` : ''}
                    {job.hourly_or_fixed === 'hourly' ? ' • Uurloon' : ''}
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📄</Text>
          {/* Conditional Empty State Messages */}
          {tab === 'today' && (
            <>
              <Text style={styles.emptyTitle}>No jobs for today</Text>
              <Text style={styles.emptySubtitle}>You have no scheduled jobs for today.</Text>
            </>
          )}

          {tab === 'upcoming' && (
            <>
              <Text style={styles.emptyTitle}>No upcoming jobs</Text>
              <Text style={styles.emptySubtitle}>You have no upcoming jobs scheduled.</Text>
            </>
          )}

          {tab === 'available' && !loading && !error && (
            <>
              <Text style={styles.emptyTitle}>{(filterRange !== 20 || filterCategory !== 'All' || filterDate !== 'Any') ? 'No available jobs match your filters' : 'No available jobs'}</Text>
              <Text style={styles.emptySubtitle}>{(filterRange !== 20 || filterCategory !== 'All' || filterDate !== 'Any') ? 'Try broadening your filters to find more jobs.' : 'Available jobs will appear here.'}</Text>
              {/* Helpful hint when no jobs are returned at all */}
              {availableJobs.length === 0 && (
                <Text style={{ marginTop: 10, color: '#9CA3AF', fontSize: 13, textAlign: 'center', maxWidth: 320 }}>
                  If you expect jobs but see none, the backend server might be offline. Start the backend with: node server.js from the `backend` folder.
                </Text>
              )}
            </>
          )}

          {tab === 'pending' && (
            <>
              <Text style={styles.emptyTitle}>No pending applications</Text>
              <Text style={styles.emptySubtitle}>Applications that are awaiting response will show up here.</Text>
            </>
          )}

          {tab === 'archive' && (
            <>
              <Text style={styles.emptyTitle}>No previous jobs</Text>
              <Text style={styles.emptySubtitle}>Your past jobs will be archived here.</Text>
            </>
          )}
        </View>
        )}

      {/* FOOTER */}
      <View style={styles.footer}>
        <View style={styles.footerSection}>
          <Text style={styles.footerTitle}>QuickJob</Text>
          <Text style={styles.footerDescription}>
            Connecting students with flexible job opportunities across Belgium.
          </Text>
        </View>

        <View style={styles.footerLinks}>
          <View style={styles.footerColumn}>
            <Text style={styles.footerColumnTitle}>Company</Text>
            <TouchableOpacity>
              <Text style={styles.footerLink}>About Us</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Contact</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Careers</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerColumn}>
            <Text style={styles.footerColumnTitle}>Support</Text>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Help Center</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Safety</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.footerLink}>FAQ</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerColumn}>
            <Text style={styles.footerColumnTitle}>Legal</Text>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Terms of Service</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Cookie Policy</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footerSocial}>
          <Text style={styles.footerSocialTitle}>Follow Us</Text>
          <View style={styles.socialIcons}>
            <TouchableOpacity style={styles.socialIcon} onPress={() => console.log('Instagram')}>
              <Instagram size={20} color="#E4405F" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon} onPress={() => console.log('LinkedIn')}>
              <Linkedin size={20} color="#0A66C2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon} onPress={() => console.log('Facebook')}>
              <Facebook size={20} color="#1877F2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon} onPress={() => console.log('Twitter')}>
              <Twitter size={20} color="#1DA1F2" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footerContact}>
          <Text style={styles.footerContactText}>📧 support@quickjob.be</Text>
          <Text style={styles.footerContactText}>📞 +32 2 123 45 67</Text>
        </View>

        <View style={styles.footerBottom}>
          <Text style={styles.footerCopyright}>
            © 2025 QuickJob. All rights reserved.
          </Text>
          <Text style={styles.footerVersion}>v1.0.0</Text>
        </View>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    padding: 30, // Web padding
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  // Mobiele override
  containerMobile: {
    padding: 16, // Minder padding op mobiel
    maxWidth: '100%',
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerRowMobile: {
    marginBottom: 16,
  },

  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1B1B1B",
  },
  pageSubtitle: {
    fontSize: 16,
    color: "#7A7F85",
    marginTop: 4,
  },
  refreshBtn: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  /* TABS */
  tabContainer: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabScroll: {
    gap: 24,
    paddingBottom: 2, // Ruimte voor border
  },
  tabItem: {
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#176B51',
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#64748B",
  },
  tabTextActive: {
    color: "#176B51",
    fontWeight: "600",
  },



  /* TABS */
  tabs: {
    flexDirection: "row",
    marginBottom: 22,
    marginTop: 10,
    justifyContent: "center",
    // Changed to alignSelf: 'stretch' and wrapping tabs in ScrollView for better responsiveness
    // removed alignSelf: 'center' to let it fill width, if desired
    backgroundColor: "#E9ECEF",
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden', // Ensures inner items stay within bounds
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'transparent',
    borderRadius: 8,
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: "#176B51",
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  pendingBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  tabActiveText: { color: "#fff", fontWeight: "600" },

  /* CARD STYLE */
  jobCard: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 12,
  },
  jobsList: {
    gap: 12,
    marginTop: 8,
  },
  jobImage: {
    width: '20%',
    height: 300,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginBottom: 10,
    resizeMode: "cover",
  },

  jobTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  jobDescription: { fontSize: 14, color: '#4A4A4A', marginBottom: 6 },
  jobMeta: { color: '#7A7F85', fontSize: 13 },

  /* Filters */
  tabFilterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  filterToggleContainer: { flexShrink: 0 },
  filterToggleBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F4F6F7', borderRadius: 8 },
  filterToggleText: { color: '#1a2e4c', fontWeight: '600' },
  filterRow: { flexDirection: 'row', gap: 12, marginBottom: 16, backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E8EEF2' },
  filterGroup: { flex: 1 },
  filterLabel: { color: '#64748B', marginBottom: 8 },
  filterPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#F4F6F7', marginRight: 8 },
  filterBtnActive: { backgroundColor: '#176B51' },
  filterBtnText: { color: '#333', fontWeight: '600' },
  filterBtnTextActive: { color: '#fff', fontWeight: '600' },
  dateInput: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', minWidth: 130 },
  clearDateBtn: { paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#F3F4F6', borderRadius: 8 },
  clearDateText: { color: '#1a2e4c', fontWeight: '600' },
  datePickerBtn: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#F4F6F7', borderRadius: 8 },
  datePickerText: { color: '#1a2e4c', fontWeight: '600' },
  stripeOnboardingBtn: {
    backgroundColor: '#176B51',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stripeOnboardingText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  stripeOnboardingBtnFull: {
    backgroundColor: '#176B51',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  stripeOnboardingTextFull: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },


  /* EMPTY STATE */
  loadingState: {
    paddingVertical: 90,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E4E6EB",
    borderRadius: 12,
    padding: 20,
    // Web: fallback width (wordt overschreven in JSX voor '48%')
    width: '100%', 
    minWidth: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  // Mobiel: Volledige breedte
  jobCardMobile: {
    width: '100%',
    minWidth: 0,
    padding: 16,
  },

  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  priceBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  priceText: {
    color: '#059669',
    fontWeight: "700",
    fontSize: 14,
  },

  jobDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: "#64748B",
  },

  jobDesc: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
    marginBottom: 16,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  postedTime: {
    fontSize: 12,
    color: "#94A3B8",
  },
  viewLink: {
    fontSize: 14,
    color: "#176B51",
    fontWeight: "600",
  },

  /* STRIPE SETUP BUTTON */
  stripeBtn: {
    backgroundColor: '#176B51',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  stripeBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  /* BANNER */
  banner: {
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 8,
  },
  bannerText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
    marginBottom: 12,
  },
  bannerBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  bannerBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  /* EMPTY STATE */
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 300,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 300,
  },

  /* JOBS GRID & LIST */
  jobsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  jobsListMobile: {
    flexDirection: 'column',
    gap: 0,
  },
  jobsContainer: {
    marginBottom: 40,
  },

  /* FOOTER */
  footer: {
    marginTop: 60,
    paddingTop: 40,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerSection: {
    marginBottom: 40,
  },
  footerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B1B1B',
    marginBottom: 12,
  },
  footerDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    maxWidth: 300,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    flexWrap: 'wrap',
    gap: 32,
  },
  footerColumn: {
    flex: 1,
    minWidth: 150,
  },
  footerColumnTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B1B1B',
    marginBottom: 12,
  },
  footerLink: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  footerSocial: {
    marginBottom: 40,
  },
  footerSocialTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B1B1B',
    marginBottom: 12,
  },
  socialIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F4F6F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerContact: {
    marginBottom: 24,
  },
  footerContactText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  footerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerCopyright: {
    fontSize: 12,
    color: '#94A3B8',
  },
  footerVersion: {
    fontSize: 12,
    color: '#94A3B8',
  },
});

console.log('Component rendered - Stripe button should be visible');