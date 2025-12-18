import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, StatusBar, ActivityIndicator } from "react-native";
import { useRouter } from 'expo-router';
import { RefreshCw, Plus, ArrowDown, Handshake, User, Instagram, Linkedin, Facebook, Twitter, MapPin, Clock, Briefcase } from "lucide-react-native";
import { jobsAPI, getClientId } from "@/services/api";
import { useTheme } from '@/contexts/ThemeContext';

export default function DashboardClient() {
  const { darkMode } = useTheme();
  const [activeTab, setActiveTab] = useState("Open");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch jobs from backend
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const clientId = await getClientId();
      if (!clientId) {
        setError("Geen client sessie gevonden");
        return;
      }
      const data = await jobsAPI.getClientJobs(clientId);
      setJobs(data || []);
    } catch (err: any) {
      setError(err?.message || "Kon jobs niet laden");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Filter jobs by status
  const openJobs = jobs.filter(j => j.status === 'open');
  const plannedJobs = jobs.filter(j => j.status === 'planned' || j.status === 'assigned');
  const completedJobs = jobs.filter(j => j.status === 'completed');
  const todayJobs = jobs.filter(j => {
    if (!j.start_time) return false;
    const jobDate = new Date(j.start_time).toDateString();
    return jobDate === new Date().toDateString() && j.status !== 'completed';
  });

  const getFilteredJobs = () => {
    switch (activeTab) {
      case "Open": return openJobs;
      case "Today": return todayJobs;
      case "Planned": return plannedJobs;
      case "Completed": return completedJobs;
      default: return openJobs;
    }
  };

  const filteredJobs = getFilteredJobs();

  const stats = [
    { label: "Open jobs", value: openJobs.length },
    { label: "Planned", value: plannedJobs.length },
    { label: "Completed", value: completedJobs.length },
    { label: "Today", value: todayJobs.length },
  ];

  const tabs = ["Open", "Today", "Planned", "Completed"];

    // Force Browser Tab Title on Web
    useEffect(() => {
      if (Platform.OS === 'web') {
        document.title = "QuickJob | Dashboard-Client";
      }
    }, []);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  // Render a single job card
  const renderJobCard = (job: any) => (
    <View key={job.id} style={[styles.jobCard, darkMode && styles.jobCardDark]}>
      <View style={styles.jobHeader}>
        <Text style={[styles.jobTitle, darkMode && styles.jobTitleDark]}>{job.title}</Text>
        <View style={[styles.statusBadge, job.status === 'open' ? styles.statusOpen : styles.statusOther]}>
          <Text style={styles.statusText}>{job.status}</Text>
        </View>
      </View>
      {job.category && (
        <View style={styles.jobMeta}>
          <Briefcase size={14} color={darkMode ? "#94a3b8" : "#64748B"} />
          <Text style={[styles.jobMetaText, darkMode && styles.jobMetaTextDark]}>{job.category.name_nl || job.category.name_en}</Text>
        </View>
      )}
      {job.area_text && (
        <View style={styles.jobMeta}>
          <MapPin size={14} color={darkMode ? "#94a3b8" : "#64748B"} />
          <Text style={[styles.jobMetaText, darkMode && styles.jobMetaTextDark]}>{job.area_text}</Text>
        </View>
      )}
      {job.start_time && (
        <View style={styles.jobMeta}>
          <Clock size={14} color={darkMode ? "#94a3b8" : "#64748B"} />
          <Text style={[styles.jobMetaText, darkMode && styles.jobMetaTextDark]}>{formatDate(job.start_time)}</Text>
        </View>
      )}
      <View style={[styles.jobFooter, darkMode && styles.jobFooterDark]}>
        <Text style={styles.jobPrice}>
          {job.hourly_or_fixed === 'fixed' 
            ? `€${job.fixed_price || 0}` 
            : `€${job.hourly_rate || 0}/uur`}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, darkMode && styles.screenDark]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} backgroundColor={darkMode ? "#1e293b" : "#fff"} />
      
      {/* Header */}
      <View style={[styles.header, darkMode && styles.headerDark]}>
        <View style={styles.headerLeft}>
          <Handshake size={28} color="#176B51" strokeWidth={2.5} />
          <Text style={[styles.headerTitle, darkMode && styles.headerTitleDark]}>QuickJob</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={[styles.iconButton, darkMode && styles.iconButtonDark]} onPress={() => {
            fetchJobs();
          }}>
            <RefreshCw size={20} color={darkMode ? "#94a3b8" : "#64748B"} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.iconButton, darkMode && styles.iconButtonDark]} onPress={() => router.push('/Client/Profile' as never)}>
            <User size={20} color={darkMode ? "#e2e8f0" : "#1B1B1B"} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.contentContainer, darkMode && styles.contentContainerDark]}>
          
          {/* Stats Overview */}
          <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>Overview</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={[styles.statCard, darkMode && styles.statCardDark]}>
                <Text style={styles.statNumber}>{stat.value}</Text>
                <Text style={[styles.statLabel, darkMode && styles.statLabelDark]}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Primary Action */}
          <TouchableOpacity
            style={styles.createJobBtn}
            onPress={() => router.push('/Client/PostJob' as never)}
          >
            <Plus size={24} color="#FFF" />
            <Text style={styles.createJobText}>Create job</Text>
          </TouchableOpacity>

          {/* Tabs */}
          <View style={[styles.tabContainer, darkMode && styles.tabContainerDark]}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tabBtn, activeTab === tab && styles.activeTabBtn]}
              >
                <Text style={activeTab === tab ? styles.activeTabText : (darkMode ? styles.inactiveTabTextDark : styles.inactiveTabText)}>
                  {tab} ({tab === "Open" ? openJobs.length : tab === "Today" ? todayJobs.length : tab === "Planned" ? plannedJobs.length : completedJobs.length})
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Loading State */}
          {loading && (
            <View style={[styles.loadingWrapper, darkMode && styles.loadingWrapperDark]}>
              <ActivityIndicator size="large" color="#176B51" />
              <Text style={[styles.loadingText, darkMode && styles.loadingTextDark]}>Jobs laden...</Text>
            </View>
          )}

          {/* Error State */}
          {!loading && error && (
            <View style={[styles.emptyWrapper, darkMode && styles.emptyWrapperDark]}>
              <Text style={[styles.emptyTitle, darkMode && styles.emptyTitleDark]}>⚠️ {error}</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={fetchJobs}>
                <Text style={styles.emptyButtonText}>Opnieuw proberen</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Job List */}
          {!loading && !error && filteredJobs.length > 0 && (
            <View style={styles.jobsContainer}>
              {filteredJobs.map(renderJobCard)}
            </View>
          )}

          {/* Empty State */}
          {!loading && !error && filteredJobs.length === 0 && (
            <View style={[styles.emptyWrapper, darkMode && styles.emptyWrapperDark]}>
              <View style={[styles.emptyIcon, darkMode && styles.emptyIconDark]}>
                <ArrowDown size={24} color="#176B51" />
              </View>
              <Text style={[styles.emptyTitle, darkMode && styles.emptyTitleDark]}>Geen {activeTab.toLowerCase()} jobs</Text>
              <Text style={[styles.emptySubtitle, darkMode && styles.emptySubtitleDark]}>
                Plaats je eerste job om te beginnen
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/Client/PostJob' as never)}>
                <Text style={styles.emptyButtonText}>+ Job plaatsen</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* FOOTER */}
          <View style={[styles.footer, darkMode && styles.footerDark]}>
            <View style={styles.footerSection}>
              <Text style={styles.footerTitle}>QuickJob</Text>
              <Text style={[styles.footerDescription, darkMode && styles.footerDescriptionDark]}>
                Connecting students with flexible job opportunities across Belgium.
              </Text>
            </View>

            <View style={styles.footerLinks}>
              <View style={styles.footerColumn}>
                <Text style={[styles.footerColumnTitle, darkMode && styles.footerColumnTitleDark]}>Company</Text>
                <TouchableOpacity>
                  <Text style={[styles.footerLink, darkMode && styles.footerLinkDark]}>About Us</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text style={[styles.footerLink, darkMode && styles.footerLinkDark]}>Contact</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text style={[styles.footerLink, darkMode && styles.footerLinkDark]}>Careers</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.footerColumn}>
                <Text style={[styles.footerColumnTitle, darkMode && styles.footerColumnTitleDark]}>Support</Text>
                <TouchableOpacity>
                  <Text style={[styles.footerLink, darkMode && styles.footerLinkDark]}>Help Center</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text style={[styles.footerLink, darkMode && styles.footerLinkDark]}>Safety</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text style={[styles.footerLink, darkMode && styles.footerLinkDark]}>FAQ</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.footerColumn}>
                <Text style={[styles.footerColumnTitle, darkMode && styles.footerColumnTitleDark]}>Legal</Text>
                <TouchableOpacity>
                  <Text style={[styles.footerLink, darkMode && styles.footerLinkDark]}>Privacy Policy</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text style={[styles.footerLink, darkMode && styles.footerLinkDark]}>Terms of Service</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text style={[styles.footerLink, darkMode && styles.footerLinkDark]}>Cookie Policy</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.footerSocial}>
              <Text style={[styles.footerSocialTitle, darkMode && styles.footerSocialTitleDark]}>Follow Us</Text>
              <View style={styles.socialIcons}>
                <TouchableOpacity style={[styles.socialIcon, darkMode && styles.socialIconDark]} onPress={() => console.log('Instagram')}>
                  <Instagram size={20} color="#E4405F" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.socialIcon, darkMode && styles.socialIconDark]} onPress={() => console.log('LinkedIn')}>
                  <Linkedin size={20} color="#0A66C2" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.socialIcon, darkMode && styles.socialIconDark]} onPress={() => console.log('Facebook')}>
                  <Facebook size={20} color="#1877F2" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.socialIcon, darkMode && styles.socialIconDark]} onPress={() => console.log('Twitter')}>
                  <Twitter size={20} color="#1DA1F2" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.footerContact}>
              <Text style={[styles.footerContactText, darkMode && styles.footerContactTextDark]}>📧 support@quickjob.be</Text>
              <Text style={[styles.footerContactText, darkMode && styles.footerContactTextDark]}>📞 +32 2 123 45 67</Text>
            </View>

            <View style={[styles.footerBottom, darkMode && styles.footerBottomDark]}>
              <Text style={[styles.footerCopyright, darkMode && styles.footerCopyrightDark]}>
                © 2025 QuickJob. All rights reserved.
              </Text>
              <Text style={[styles.footerVersion, darkMode && styles.footerVersionDark]}>v1.0.0</Text>
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

  // Job Cards
  jobsContainer: {
    gap: 12,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a2e4c",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusOpen: {
    backgroundColor: "#DCFCE7",
  },
  statusOther: {
    backgroundColor: "#F1F5F9",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#166534",
    textTransform: "uppercase",
  },
  jobMetaText: {
    fontSize: 13,
    color: "#64748B",
  },
  jobFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  jobPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#176B51",
  },
  loadingWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
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

  // Dark mode styles
  screenDark: {
    backgroundColor: "#0f172a",
  },
  headerDark: {
    backgroundColor: "#1e293b",
    borderBottomColor: "#334155",
  },
  headerTitleDark: {
    color: "#f1f5f9",
  },
  iconButtonDark: {
    backgroundColor: "#334155",
  },
  contentContainerDark: {
    backgroundColor: "#0f172a",
  },
  sectionTitleDark: {
    color: "#f1f5f9",
  },
  statCardDark: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
  },
  statLabelDark: {
    color: "#94a3b8",
  },
  tabContainerDark: {
    backgroundColor: "#1e293b",
    borderColor: "#334155",
  },
  inactiveTabTextDark: {
    color: "#94a3b8",
  },
  loadingWrapperDark: {
    backgroundColor: "#1e293b",
  },
  loadingTextDark: {
    color: "#94a3b8",
  },
  emptyWrapperDark: {
    backgroundColor: "#1e293b",
    borderColor: "#334155",
  },
  emptyIconDark: {
    backgroundColor: "#1e4a3d",
  },
  emptyTitleDark: {
    color: "#f1f5f9",
  },
  emptySubtitleDark: {
    color: "#94a3b8",
  },
  jobCardDark: {
    backgroundColor: "#1e293b",
    borderColor: "#334155",
  },
  jobTitleDark: {
    color: "#f1f5f9",
  },
  jobMetaTextDark: {
    color: "#94a3b8",
  },
  jobFooterDark: {
    borderTopColor: "#334155",
  },
  footerDark: {
    backgroundColor: "#1e293b",
    borderTopColor: "#334155",
  },
  footerDescriptionDark: {
    color: "#94a3b8",
  },
  footerColumnTitleDark: {
    color: "#f1f5f9",
  },
  footerLinkDark: {
    color: "#94a3b8",
  },
  footerSocialTitleDark: {
    color: "#f1f5f9",
  },
  socialIconDark: {
    backgroundColor: "#334155",
    borderColor: "#475569",
  },
  footerContactTextDark: {
    color: "#94a3b8",
  },
  footerBottomDark: {
    borderTopColor: "#334155",
  },
  footerCopyrightDark: {
    color: "#64748b",
  },
  footerVersionDark: {
    color: "#64748b",
  },
});