import React, { useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, StatusBar, TextInput, ActivityIndicator } from "react-native";
import { useRouter } from 'expo-router';
import { RefreshCw, Plus, ArrowDown, Handshake, User, Instagram, Linkedin, Facebook, Twitter } from "lucide-react-native";
import { jobsAPI } from '../../services/api';

export default function DashboardClient() {
  const [activeTab, setActiveTab] = useState("Open");

  const stats = [
    { label: "Open jobs", value: 0 },
    { label: "Planned", value: 0 },
    { label: "Completed", value: 0 },
    { label: "Today", value: 0 },
  ];

  const tabs = ["Open", "Today", "Planned", "Completed"];

    // Force Browser Tab Title on Web
    useEffect(() => {
      if (Platform.OS === 'web') {
        document.title = "QuickJob | Dashboard-Client";
      }
    }, []);

    const router = useRouter();

  // --- Filters state (range in km, category and date) ---
  const [filterRange, setFilterRange] = useState<number>(20);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterDate, setFilterDate] = useState<string>('Any');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Native date picker support (dynamic require so web build doesn't fail)
  const [showDatePickerNative, setShowDatePickerNative] = useState(false);
  const [DateTimePickerComponent, setDateTimePickerComponent] = useState<any | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = require('react-native-datetimepicker/datetimepicker');
        setDateTimePickerComponent(mod?.default || mod);
      } catch (err) {
        console.warn('Native DateTimePicker not installed. Run `npm i react-native-datetimepicker/datetimepicker` to enable it.');
      }
    }
  }, []);

  const onNativeDateChange = (_event: any, date?: Date) => {
    setShowDatePickerNative(false);
    if (date) {
      const iso = date.toISOString().slice(0,10);
      setSelectedDate(iso);
      setFilterDate('Specific');
    }
  };
  // Show/hide filters (default visible on web)
  const [showFilters, setShowFilters] = useState<boolean>(Platform.OS === 'web');

  // Jobs from API
  const [jobs, setJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState<boolean>(false);
  const [jobsError, setJobsError] = useState<string | null>(null);

  // Debug: log filters when they change to confirm the UI is wiring
  useEffect(() => {
    console.log('[DashboardClient] filters', { filterRange, filterCategory, filterDate, selectedDate });
  }, [filterRange, filterCategory, filterDate, selectedDate]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchJobs = async (opts?: {status?: string}) => {
    setLoadingJobs(true);
    setJobsError(null);
    try {
      const statusMap: any = { Open: 'open', Planned: 'planned', Completed: 'completed', Today: 'open' };
      const status = (opts?.status) || statusMap[activeTab] || 'open';
      const dateParam = filterDate === 'Specific' && selectedDate ? selectedDate : (filterDate === 'Today' ? new Date().toISOString().slice(0,10) : (filterDate === 'This week' ? undefined : undefined));

      const data = await jobsAPI.getFilteredJobs({ status, range_km: filterRange, category: filterCategory, date: dateParam });
      setJobs(data || []);
    } catch (err: any) {
      console.error('Failed to load jobs', err);
      setJobsError(err?.message || 'Failed to load jobs');
      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    // Debounce filter changes
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchJobs();
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current as any);
    };
  }, [filterRange, filterCategory, filterDate, selectedDate, activeTab]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Handshake size={28} color="#176B51" strokeWidth={2.5} />
          <Text style={styles.headerTitle}>QuickJob</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.iconButton} onPress={() => {
            // Placeholder refresh action
            console.log('Refresh client dashboard');
          }}>
            <RefreshCw size={20} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/Client/Profile' as never)}>
            <User size={20} color="#1B1B1B" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          
          {/* Stats Overview */}
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Text style={styles.statNumber}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Primary Action */}
          <TouchableOpacity style={styles.createJobBtn}>
            <Plus size={24} color="#FFF" />
            <Text style={styles.createJobText}>Create job</Text>
          </TouchableOpacity>

          {/* Tabs */}
          <View style={styles.tabAndFilterRow}>
            <View style={styles.tabContainer}>
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[styles.tabBtn, activeTab === tab && styles.activeTabBtn]}
                >
                  <Text style={activeTab === tab ? styles.activeTabText : styles.inactiveTabText}>
                    {tab} ({activeTab === tab ? jobs.length : 0})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Filter toggle (helpful on small screens / web) */}
            <View style={styles.filterToggleContainer}>
              <TouchableOpacity style={styles.filterToggleBtn} onPress={() => setShowFilters(!showFilters)}>
                <Text style={styles.filterToggleText}>{showFilters ? 'Hide filters' : 'Show filters'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Filters */}
          {showFilters && (
            <View style={styles.filterRow}>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Range</Text>
              <View style={styles.filterPills}>
                {[5,10,20,50].map((r)=> (
                  <TouchableOpacity key={r} onPress={() => { setFilterRange(r); console.log('[DashboardClient] setRange', r); }} style={[styles.filterBtn, filterRange === r && styles.filterBtnActive]}>
                    <Text style={filterRange === r ? styles.filterBtnTextActive : styles.filterBtnText}>{r} km</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Category</Text>
              <View style={styles.filterPills}>
                {['All','Gardening','Tutoring','Delivery','Cleaning'].map((c)=> (
                  <TouchableOpacity key={c} onPress={() => { setFilterCategory(c); console.log('[DashboardClient] setCategory', c); }} style={[styles.filterBtn, filterCategory === c && styles.filterBtnActive]}>
                    <Text style={filterCategory === c ? styles.filterBtnTextActive : styles.filterBtnText}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Date</Text>
              <View style={styles.filterPills}>
                {['Any','Today','This week','Specific'].map((d)=> (
                  <TouchableOpacity key={d} onPress={() => { setFilterDate(d); if (d !== 'Specific') setSelectedDate(null); console.log('[DashboardClient] setDateFilter', d); }} style={[styles.filterBtn, filterDate === d && styles.filterBtnActive]}>
                    <Text style={filterDate === d ? styles.filterBtnTextActive : styles.filterBtnText}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {filterDate === 'Specific' && (
                <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {Platform.OS === 'web' ? (
                    // Use native date input on web
                    // @ts-ignore allow web input
                    <input type="date" value={selectedDate || ''} onChange={(e: any) => setSelectedDate(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #E2E8F0' }} />
                  ) : DateTimePickerComponent ? (
                    <>
                      <TouchableOpacity onPress={() => setShowDatePickerNative(true)} style={styles.datePickerBtn}>
                        <Text style={styles.datePickerText}>{selectedDate || 'Pick a date'}</Text>
                      </TouchableOpacity>
                      {showDatePickerNative && (
                        // @ts-ignore
                        <DateTimePickerComponent value={selectedDate ? new Date(selectedDate) : new Date()} mode="date" display="default" onChange={onNativeDateChange} />
                      )}
                    </>
                  ) : (
                    <TextInput placeholder="YYYY-MM-DD" value={selectedDate || ''} onChangeText={setSelectedDate} style={styles.dateInput} />
                  )}

                  <TouchableOpacity onPress={() => { setSelectedDate(null); setFilterDate('Any'); }} style={styles.clearDateBtn}>
                    <Text style={styles.clearDateText}>Clear</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            </View>
          )}

          {/* Jobs list (sample data used here) */}
          {loadingJobs ? (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#176B51" />
            </View>
          ) : (jobs.length > 0 ? (
            <View style={{ marginBottom: 24 }}>
              {jobs.map((job) => (
                <View key={job.id} style={styles.jobCard}>
                  <View>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <Text style={styles.jobMeta}>{job.category} • {job.distanceKm ?? job.distance_km ?? '-'} km • {job.date}</Text>
                  </View>
                  <TouchableOpacity style={styles.jobAction} onPress={() => console.log('open', job.id)}>
                    <Text style={styles.jobActionText}>View</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyWrapper}>
              <View style={styles.emptyIcon}>
                <ArrowDown size={24} color="#176B51" />
              </View>
              <Text style={styles.emptyTitle}>{jobsError ? 'Failed to load jobs' : 'No jobs matching filters'}</Text>
              <Text style={styles.emptySubtitle}>
                {jobsError ? jobsError : 'Adjust range, category or date to find jobs'}
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/Client/CreateJob' as never)}>
                <Text style={styles.emptyButtonText}>+ Post job</Text>
              </TouchableOpacity>
            </View>
          ))}

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

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  scrollContent: {
    paddingBottom: 10,
  },
  
  // Header
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#EFF0F6",
    paddingTop: Platform.OS === 'android' ? 48 : 56,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a2e4c",
  },
  iconButton: {
    padding: 8,
    backgroundColor: "#F7F9FC",
    borderRadius: 999,
  },

  // Content
  contentContainer: {
    padding: 24,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a2e4c",
    marginBottom: 16,
  },

  // Stats
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1, // Allows cards to scale with width
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    // Shadow equivalent
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#176B51", // QuickJob Green
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Actions
  createJobBtn: {
    width: "100%",
    backgroundColor: "#176B51",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 32,
    shadowColor: "#176B51",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  createJobText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },

  // Tabs
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 4,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#EFF0F6",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTabBtn: {
    backgroundColor: "#176B51",
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  inactiveTabText: {
    color: "#64748B",
    fontWeight: "500",
    fontSize: 12,
  },

  // Filters
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8EEF2',
  },
  tabAndFilterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  filterToggleContainer: { flexShrink: 0 },
  filterToggleBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F4F6F7', borderRadius: 8 },
  filterToggleText: { color: '#1a2e4c', fontWeight: '600' },
  filterGroup: { flex: 1 },
  filterLabel: { color: '#64748B', marginBottom: 8 },
  filterPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#F4F6F7', marginRight: 8 },
  filterBtnActive: { backgroundColor: '#176B51' },
  filterBtnText: { color: '#333', fontWeight: '600' },
  filterBtnTextActive: { color: '#fff', fontWeight: '600' },

  // Jobs
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6EEF0',
    marginBottom: 12,
  },
  jobTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  jobMeta: { fontSize: 13, color: '#64748B', marginTop: 4 },
  jobAction: { backgroundColor: '#176B51', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  jobActionText: { color: '#fff', fontWeight: '700' },

  // Date input
  dateInput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 130,
  },
  clearDateBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  clearDateText: { color: '#1a2e4c', fontWeight: '600' },
  datePickerBtn: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#F4F6F7', borderRadius: 8 },
  datePickerText: { color: '#1a2e4c', fontWeight: '600' },

  // Empty State
  emptyWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
  },
  emptyIcon: {
    width: 48,
    height: 48,
    backgroundColor: "#E8F5E9",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a2e4c",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    maxWidth: 200,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: "#000",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  /* FOOTER */
  footer: {
    marginTop: 60,
    paddingTop: 40,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 20,
  },
  footerSection: {
    marginBottom: 24,
  },
  footerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#176B51",
    marginBottom: 8,
  },
  footerDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  footerColumn: {
    flex: 1,
  },
  footerColumnTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  footerLink: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
  },
  footerSocial: {
    marginBottom: 24,
    alignItems: "center",
  },
  footerSocialTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  socialIcons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  footerContact: {
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },
  footerContactText: {
    fontSize: 13,
    color: "#6B7280",
  },
  footerBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  footerCopyright: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  footerVersion: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
});