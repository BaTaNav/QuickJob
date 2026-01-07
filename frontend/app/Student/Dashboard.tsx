import { StyleSheet, TouchableOpacity, ScrollView, Pressable, Text, View,Image, ActivityIndicator, Platform, TextInput, Alert } from "react-native";
import * as React from "react";
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { RefreshCw, Instagram, Linkedin, Facebook, Twitter, Clock } from 'lucide-react-native';
import { jobsAPI, studentAPI, getStudentId } from '../../services/api';

export default function StudentDashboard() {
  const params = useLocalSearchParams();
  const initialTab = (params.tab as 'today' | 'upcoming' | 'available' | 'pending' | 'archive') || 'available';
  
  const [tab, setTab] = React.useState<'today' | 'upcoming' | 'available' | 'pending' | 'archive'>(initialTab);
  const [availableJobs, setAvailableJobs] = React.useState<any[]>([]);
  const [pendingApplications, setPendingApplications] = React.useState<any[]>([]);
  const [dashboardData, setDashboardData] = React.useState<any>({ today: [], upcoming: [], pending: [], archive: [] });

  // Keep the original default categories, but augment with categories discovered from jobs
  const DEFAULT_CATEGORIES = ['Hospitality', 'Retail', 'Office', 'Event', 'Other', 'Gardening', 'Pet care'];
  const categoryOptions = React.useMemo(() => {
    const map = new Map<string, { id: number | null; name: string }>();

    
    map.set('All', { id: null, name: 'All' });

    // start with defaults (no id)
    DEFAULT_CATEGORIES.forEach((name) => map.set(name, { id: null, name }));

    // merge discovered categories from jobs; prefer attaching id when available
    availableJobs.forEach((job) => {
      const cat = job?.category;
      const name = cat?.name_en || 'Other';
      const id = cat?.id ?? null;
      const existing = map.get(name);
      if (existing) {
        // if existing has no id and we discovered an id, update it
        if (!existing.id && id) map.set(name, { id, name });
      } else {
        map.set(name, { id, name });
      }
    });

    return Array.from(map.values());
  }, [availableJobs]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showFilters, setShowFilters] = React.useState(false);
  const [filterRange, setFilterRange] = React.useState(20);
  const [filterCategory, setFilterCategory] = React.useState('All');
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
      setError('');
      const sid = await getStudentId();
      if (!sid) {
        setPendingApplications([]);
        return;
      }
      const data = await studentAPI.getApplications(Number(sid));
      // Filter only pending applications
      const pending = data.filter((app: any) => app.status === 'pending');
      setPendingApplications(pending || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load applications';
      setError(errorMessage);
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
      filtered = filtered.filter(job => job.category === filterCategory);
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

  const mockJobs: Record<string, Array<any>> = {
    today: [],
    upcoming: [],
    available: availableJobs,
    pending: pendingApplications,
    archive: [],
  };

  const jobs = mockJobs[tab] ?? [];
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
          
          <Pressable onPress={fetchAvailable} style={styles.refreshBtn}>
             <RefreshCw size={20} color="#64748B" />
          </Pressable>
        </View>

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

        {/* CONTENT */}
        {loading ? (
          <ActivityIndicator size="large" color="#176B51" style={{ marginTop: 40 }} />
        ) : (
          <View style={[styles.jobsGrid, !isWeb && styles.jobsListMobile]}>
            {filteredJobs.length === 0 ? (
              <Text style={styles.emptyText}>No jobs found in this category.</Text>
            ) : (
              filteredJobs.map((job: Job) => (
                <TouchableOpacity 
                  key={job.id} 
                  style={[
                    styles.jobCard,
                    /* Web override voor width */
                    isWeb ? { width: '48%' } : styles.jobCardMobile
                  ]}
                  onPress={() => router.push(`/Student/Job/${job.id}`)}
                >
                  <View style={styles.jobHeader}>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <View style={styles.priceBadge}>
                      <Text style={styles.priceText}>€{job.hourly_rate || job.fixed_price}</Text>
                    </View>
                  </View>

                  <View style={styles.jobDetails}>
                    <View style={styles.detailRow}>
                      <MapPin size={14} color="#64748B" />
                      <Text style={styles.detailText}>{job.area_text || job.location || 'Unknown location'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                       <Clock size={14} color="#64748B" />
                       <Text style={styles.detailText}>
                         {job.duration ? `${job.duration} hrs` : 'Flexible'}
                       </Text>
                    </View>
                    {job.category && (
                      <View style={styles.detailRow}>
                        <Briefcase size={14} color="#64748B" />
                        <Text style={styles.detailText}>
                          {job.category.name_nl || job.category.name_en || 'General'}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.jobDesc} numberOfLines={2}>
                    {job.description}
                  </Text>
                  
                  <View style={styles.cardFooter}>
                    <Text style={styles.postedTime}>
                         {job.start_time ? new Date(job.start_time).toLocaleDateString() : 'Flexible date'}
                    </Text>
                    <Text style={styles.viewLink}>View Details →</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={[styles.filterGroup, { maxWidth: 220 }]}>
            <Text style={styles.filterLabel}>Distance (km)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {Platform.OS === 'web' ? (
                <input
                  type="number"
                  min={0}
                  value={String(filterRange)}
                  onChange={(e: any) => setFilterRange(Number(e.target.value || 0))}
                  style={{ padding: 8, borderRadius: 8, border: '1px solid #E2E8F0', width: 100 }}
                  disabled={showAllJobs}
                />
              ) : (
                <TextInput
                  keyboardType="numeric"
                  value={String(filterRange)}
                  onChangeText={(t) => setFilterRange(Number(t || 0))}
                  style={[styles.dateInput, { minWidth: 100 }]}
                  editable={!showAllJobs}
                />
              )}

              <TouchableOpacity style={[styles.filterBtn, showAllJobs && styles.filterBtnActive]} onPress={() => setShowAllJobs(!showAllJobs)}>
                <Text style={showAllJobs ? styles.filterBtnTextActive : styles.filterBtnText}>{showAllJobs ? 'Show all jobs' : 'Filter by distance'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>{showAllJobs ? 'Showing all jobs (distance filter off).' : 'Uses your location (best-effort).'}</Text>
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
                  {/* Add Image Here */}
  {job.image_url && (
    <Image 
      source={{ uri: job.image_url }} 
      style={styles.jobImage}
    />
  )}
                <Text style={styles.jobTitle}>{job.title}</Text>
                  <Text style={styles.jobDescription}>{job.description || 'Geen beschrijving'}</Text>
                  <Text style={styles.jobMeta}>
                    {job.start_time ? new Date(job.start_time).toLocaleString('nl-BE') : 'Starttijd TBA'}
                    {formatJobAddress(job) ? ` • ${formatJobAddress(job)}` : ''}
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
  tabText: { color: "#7A7F85", fontWeight: "500" },
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
},
  
  jobCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F2',
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


  /* EMPTY STATE */
  loadingState: {
    paddingVertical: 90,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E4E6EB",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  jobTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    flex: 1,
    marginRight: 10,
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
});