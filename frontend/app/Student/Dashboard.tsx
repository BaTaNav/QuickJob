import { StyleSheet, TouchableOpacity, ScrollView, Pressable, Text, View, ActivityIndicator, Platform, TextInput, Alert } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import * as React from "react";
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { RefreshCw, Calendar, Clock, Briefcase, Star } from 'lucide-react-native';
import { jobsAPI, studentAPI, getStudentId } from '../../services/api';
import { Job, JOB_CATEGORIES, groupJobsByDay, formatJobAddress, haversineDistance } from '../../utils/helpers';
import { brand } from '../../constants/Colors';
import JobCard from '../../components/JobCard';
import DaySection from '../../components/DaySection';
import TabBar from '../../components/TabBar';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';
import Footer from '../../components/Footer';

const isWeb = Platform.OS === 'web';

export default function StudentDashboard() {
  const params = useLocalSearchParams();
  const initialTab = (params.tab as 'today' | 'upcoming' | 'available' | 'pending' | 'archive') || 'available';

  const [tab, setTab] = React.useState<'today' | 'upcoming' | 'available' | 'pending' | 'archive'>(initialTab);
  const [availableJobs, setAvailableJobs] = React.useState<Job[]>([]);
  const [pendingApplications, setPendingApplications] = React.useState<any[]>([]);
  const [upcomingApplications, setUpcomingApplications] = React.useState<any[]>([]);
  const [archiveApplications, setArchiveApplications] = React.useState<any[]>([]);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showFilters, setShowFilters] = React.useState(false);
  const [filterRange, setFilterRange] = React.useState(20);
  const [filterCategory, setFilterCategory] = React.useState<number | 'All'>('All');
  const [filterDate, setFilterDate] = React.useState('Any');
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [userLocation, setUserLocation] = React.useState<{ latitude: number; longitude: number } | null>(null);
  const [showAllJobs, setShowAllJobs] = React.useState(false);
  const [verificationStatus, setVerificationStatus] = React.useState<string | null>(null);
  const router = useRouter();

  // Category options for filter
  const categoryOptions = React.useMemo(() => {
    const opts: Array<{ id: number | null; name: string }> = [{ id: null, name: 'All' }];
    JOB_CATEGORIES.forEach((c) => opts.push({ id: c.id, name: c.name_en }));
    return opts;
  }, []);

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
      // Fetch verification status
      try {
        const profile = await studentAPI.getProfile(Number(sid));
        setVerificationStatus(profile?.verification_status || 'pending');
      } catch (e) {
        console.warn('Could not fetch verification status:', e);
      }

      const data = await studentAPI.getApplications(Number(sid));
      const pending = data.filter((app: any) => app.status === 'pending');
      const allAccepted = data.filter((app: any) => app.status === 'accepted');
      const upcoming = allAccepted.filter((app: any) => app.jobs?.status !== 'completed');
      const archive = allAccepted.filter((app: any) => app.jobs?.status === 'completed');

      setPendingApplications(pending || []);
      setUpcomingApplications(upcoming || []);
      setArchiveApplications(archive || []);
    } catch (err) {
      console.log('Error fetching pending jobs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (params.tab) {
      setTab(params.tab as any);
    }
  }, [params.tab]);

  useFocusEffect(
    React.useCallback(() => {
      if (params.tab) {
        setTab(params.tab as any);
      }
      fetchAvailable();
      fetchPending();
    }, [params.tab, fetchAvailable, fetchPending])
  );

  React.useEffect(() => {
    fetchAvailable();
    fetchPending();
  }, [fetchAvailable, fetchPending]);

  // Geolocation
  React.useEffect(() => {
    const getLocation = () => {
      try {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          const onSuccess = (pos: any) => {
            try {
              const { latitude, longitude } = pos.coords ?? {};
              setUserLocation({ latitude, longitude });
            } catch (err) {
              console.warn('Failed to set userLocation:', err);
            }
          };

          const onError = (err: any) => {
            console.warn('Geolocation unavailable:', err?.message ?? err);
            setUserLocation(null);
          };

          navigator.geolocation.getCurrentPosition(onSuccess, onError, { enableHighAccuracy: false, timeout: 5000 });
        }
      } catch (e) {
        console.warn('Geolocation check failed:', e);
      }
    };
    getLocation();
  }, []);

  const handleRefresh = () => {
    fetchAvailable();
    fetchPending();
  };

  // Filter jobs
  const filteredJobs = React.useMemo(() => {
    let filtered = availableJobs;

    // Exclude already applied jobs
    const appliedJobIds = new Set(pendingApplications.map(app => app.job_id));
    filtered = filtered.filter(job => !appliedJobIds.has(job.id));

    // Category filter
    if (filterCategory !== 'All') {
      filtered = filtered.filter(job => job?.category?.id === filterCategory);
    }

    // Date filter
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
        return new Date(job.start_time) <= weekFromNow;
      });
    } else if (filterDate === 'Specific' && selectedDate) {
      filtered = filtered.filter(job => {
        if (!job.start_time) return false;
        return new Date(job.start_time).toDateString() === new Date(selectedDate).toDateString();
      });
    }

    // Distance filter
    if (showAllJobs) return filtered;

    const rangeKm = Number(filterRange) || 0;
    if (userLocation && rangeKm > 0) {
      filtered = filtered.filter(job => {
        const lat = job.latitude != null ? Number(job.latitude) : null;
        const lon = job.longitude != null ? Number(job.longitude) : null;
        if (lat == null || lon == null) return false;

        const dist = haversineDistance(userLocation.latitude, userLocation.longitude, lat, lon);
        (job as any)._distance_km = Math.round(dist * 10) / 10;
        return dist <= rangeKm;
      });
    }

    return filtered;
  }, [availableJobs, pendingApplications, filterCategory, filterDate, selectedDate, userLocation, filterRange, showAllJobs]);

  // Mock jobs for each tab
  const mockJobs: Record<'today' | 'upcoming' | 'available' | 'pending' | 'archive', any[]> = {
    today: [],
    upcoming: upcomingApplications.map((a: any) => a.jobs || a.job || a),
    available: availableJobs,
    pending: pendingApplications.map((a: any) => a.jobs || a.job || a),
    archive: archiveApplications.map((a: any) => a.jobs || a.job || a),
  };

  const jobs = mockJobs[tab] ?? [];
  const displayJobs = tab === 'available' ? filteredJobs : jobs;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: brand.background }} edges={['top']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.container, !isWeb && styles.containerMobile]}>
        {/* HEADER */}
        <View style={[styles.headerRow, !isWeb && styles.headerRowMobile]}>
          <View>
            <Text style={styles.pageTitle}>Student Dashboard</Text>
            <Text style={styles.pageSubtitle}>Find jobs and start earning</Text>
          </View>
          <Pressable onPress={fetchAvailable} style={styles.refreshBtn}>
            <RefreshCw size={20} color={brand.textSecondary} />
          </Pressable>
        </View>

        {/* VERIFICATION STATUS BANNER */}
        {verificationStatus && verificationStatus !== 'verified' && (
          <View style={[styles.banner, verificationStatus === 'rejected' ? { backgroundColor: '#FEE2E2', borderColor: '#FECACA' } : {}]}>
            <Text style={[styles.bannerTitle, verificationStatus === 'rejected' ? { color: '#DC2626' } : {}]}>
              {verificationStatus === 'rejected' ? 'Profile rejected' : 'Verification pending'}
            </Text>
            <Text style={styles.bannerText}>
              {verificationStatus === 'rejected'
                ? 'Your profile has been rejected. Please contact support for more information.'
                : 'Your profile is being reviewed by an admin. Once verified, you can apply to jobs.'}
            </Text>
          </View>
        )}

        {/* TABS */}
        <TabBar
          tabs={[
            { key: 'today', label: 'Today', count: mockJobs.today.length },
            { key: 'upcoming', label: 'Upcoming', count: mockJobs.upcoming.length },
            { key: 'available', label: 'Available', count: filteredJobs.length },
            { key: 'pending', label: 'Pending', count: pendingApplications.length },
            { key: 'archive', label: 'Archive', count: mockJobs.archive.length },
          ]}
          activeTab={tab}
          onTabChange={(tabKey) => setTab(tabKey as any)}
        />

        {/* FILTER TOGGLE BUTTONS */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <Pressable onPress={() => setShowFilters(s => !s)} style={styles.filterToggleBtn}>
            <Text style={styles.filterToggleText}>{showFilters ? 'Hide filters' : 'Filters'}</Text>
          </Pressable>
          <Pressable onPress={() => setShowAllJobs(v => !v)} style={[styles.filterToggleBtn, { backgroundColor: showAllJobs ? brand.primary : undefined }]}>
            <Text style={[styles.filterToggleText, showAllJobs ? { color: '#fff' } : {}]}>
              {showAllJobs ? 'Showing all' : 'Show all'}
            </Text>
          </Pressable>
        </View>

        {/* FILTER PANEL */}
        {showFilters && (
          <View style={[styles.filterRow, !isWeb && styles.filterRowMobile]}>
            {/* Category Filter */}
            <View style={[styles.filterGroup, !isWeb && styles.filterGroupMobile]}>
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
                    <Text style={(opt.id === null && filterCategory === 'All') || (opt.id !== null && filterCategory === opt.id) ? styles.filterBtnTextActive : styles.filterBtnText}>
                      {opt.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Radius Filter */}
            <View style={[styles.filterGroup, !isWeb && styles.filterGroupMobile]}>
              <Text style={styles.filterLabel}>Radius (km)</Text>
              <TextInput
                style={styles.dateInput}
                keyboardType="numeric"
                value={String(filterRange)}
                onChangeText={(t) => setFilterRange(Number(t) || 0)}
              />
            </View>

            {/* Date Filter */}
            <View style={[styles.filterGroup, !isWeb && styles.filterGroupMobile]}>
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
                <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {Platform.OS === 'web' ? (
                    <input
                      type="date"
                      value={selectedDate || ''}
                      onChange={(e: any) => setSelectedDate(e.target.value)}
                      style={{ padding: 8, borderRadius: 8, border: '1px solid #E2E8F0', flex: 1, minWidth: 150 }}
                    />
                  ) : (
                    <TextInput
                      placeholder="YYYY-MM-DD"
                      value={selectedDate || ''}
                      onChangeText={setSelectedDate}
                      style={[styles.dateInput, { flex: 1 }]}
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

        {/* LOADING STATE */}
        {loading && <LoadingState message="Jobs ophalen..." />}

        {/* ERROR STATE */}
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

        {/* JOB LIST */}
        {!loading && !error && jobs.length > 0 ? (
          <View style={styles.jobsContainer}>
            {tab === 'pending' && (
              <View style={styles.jobsList}>
                {pendingApplications.map((app: any) => (
                  <Pressable
                    key={app.id}
                    onPress={() => router.push(`/Student/Applied/${app.id}` as never)}
                  >
                    <JobCard
                      job={app.jobs || app}
                      statusBadge={{ label: 'Pending Review', color: brand.warning }}
                    />
                  </Pressable>
                ))}
              </View>
            )}

            {tab === 'upcoming' && (
              <View style={styles.jobsList}>
                {upcomingApplications.map((app: any) => {
                  const jobData = app.jobs || app;
                  const jobId = jobData?.id || app.job_id;
                  return (
                    <Pressable
                      key={app.id}
                      onPress={() => router.push(`/Student/ActiveJob/${jobId}` as never)}
                    >
                      <JobCard
                        job={jobData}
                        statusBadge={{ label: 'Upcoming', color: brand.success }}
                      />
                    </Pressable>
                  );
                })}
              </View>
            )}

            {tab === 'available' && (
              <View style={styles.jobsList}>
                {Object.entries(groupJobsByDay(filteredJobs)).map(([day, dayJobs]) => (
                  <DaySection key={day} date={day} count={dayJobs.length}>
                    {dayJobs.map((job: Job) => (
                      <Pressable
                        key={job.id}
                        onPress={() => router.push(`/Student/Job/${job.id}` as never)}
                      >
                        <JobCard job={job} />
                      </Pressable>
                    ))}
                  </DaySection>
                ))}
              </View>
            )}

            {tab === 'archive' && (
              <View style={styles.jobsList}>
                {archiveApplications.map((app: any) => (
                  <Pressable
                    key={app.id}
                    onPress={() => router.push(`/Student/Applied/${app.id}` as never)}
                  >
                    <JobCard
                      job={app.jobs || app}
                      statusBadge={{ label: 'Completed', color: brand.textSecondary }}
                    />
                    {app.review && (
                      <View style={styles.reviewContainer}>
                        <View style={styles.reviewHeader}>
                          <Text style={styles.reviewTitle}>Jouw review:</Text>
                          <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={16}
                                color={star <= app.review.rating ? brand.warning : '#D1D5DB'}
                                fill={star <= app.review.rating ? brand.warning : 'transparent'}
                              />
                            ))}
                          </View>
                        </View>
                        {app.review.comment && (
                          <Text style={styles.reviewComment}>{app.review.comment}</Text>
                        )}
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ) : (
          <EmptyState
            title={
              tab === 'today' ? 'No jobs for today' :
              tab === 'upcoming' ? 'No upcoming jobs' :
              tab === 'available' ? ((filterRange !== 20 || filterCategory !== 'All' || filterDate !== 'Any') ? 'No available jobs match your filters' : 'No available jobs') :
              tab === 'pending' ? 'No pending applications' :
              'No previous jobs'
            }
            subtitle={
              tab === 'today' ? 'You have no scheduled jobs for today.' :
              tab === 'upcoming' ? 'You have no upcoming jobs scheduled.' :
              tab === 'available' ? ((filterRange !== 20 || filterCategory !== 'All' || filterDate !== 'Any') ? 'Try broadening your filters to find more jobs.' : 'Available jobs will appear here.') :
              tab === 'pending' ? 'Applications that are awaiting response will show up here.' :
              'Your past jobs will be archived here.'
            }
          />
        )}

        {/* FOOTER */}
        <Footer />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 30,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  containerMobile: {
    padding: 16,
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
    color: brand.text,
  },
  pageSubtitle: {
    fontSize: 16,
    color: brand.textHelper,
    marginTop: 4,
  },
  refreshBtn: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: brand.border,
  },

  /* FILTER STYLES */
  filterToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: brand.filterBg,
    borderRadius: 8,
  },
  filterToggleText: {
    color: brand.text,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    backgroundColor: brand.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: brand.border,
  },
  filterRowMobile: {
    flexDirection: 'column',
    gap: 16,
  },
  filterGroup: {
    flex: 1,
  },
  filterGroupMobile: {
    flex: 1,
    width: '100%',
  },
  filterLabel: {
    color: brand.textSecondary,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  filterPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: brand.filterBg,
    marginRight: 8,
    marginBottom: 4,
  },
  filterBtnActive: {
    backgroundColor: brand.primary,
  },
  filterBtnText: {
    color: brand.text,
    fontWeight: '600',
  },
  filterBtnTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  dateInput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: brand.border,
    minWidth: 130,
  },
  clearDateBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: brand.filterBg,
    borderRadius: 8,
  },
  clearDateText: {
    color: brand.text,
    fontWeight: '600',
  },

  /* BANNER */
  banner: {
    backgroundColor: brand.warningBg,
    borderLeftWidth: 4,
    borderLeftColor: brand.warning,
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
    backgroundColor: brand.warning,
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
    color: brand.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: brand.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
  },

  /* JOBS LIST */
  jobsContainer: {
    marginBottom: 40,
  },
  jobsList: {
    gap: 12,
    marginTop: 8,
  },

  /* REVIEW DISPLAY */
  reviewContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: brand.surfaceAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: brand.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: brand.text,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  reviewComment: {
    fontSize: 13,
    color: brand.textSecondary,
    lineHeight: 18,
  },
});
