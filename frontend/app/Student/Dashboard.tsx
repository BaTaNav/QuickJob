import { StyleSheet, TouchableOpacity, ScrollView, Pressable, Text, View, ActivityIndicator } from "react-native";
import * as React from "react";
import { useRouter } from 'expo-router';
import { RefreshCw, Instagram, Linkedin, Facebook, Twitter } from 'lucide-react-native';
import { jobsAPI } from '../../services/api';

export default function StudentDashboard() {
  const [tab, setTab] = React.useState<'today' | 'upcoming' | 'available' | 'pending' | 'archive'>('available');
  const [availableJobs, setAvailableJobs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const router = useRouter();

  const mockJobs: Record<string, Array<any>> = {
    today: [],
    upcoming: [],
    available: availableJobs,
    pending: [],
    archive: [],
  };

  const jobs = mockJobs[tab] ?? [];

  const fetchAvailable = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await jobsAPI.getAvailableJobs('open', 50);
      setAvailableJobs(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAvailable();
  }, [fetchAvailable]);

  const handleRefresh = () => {
    fetchAvailable();
  };


  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Student Dashboard</Text>
          <Text style={styles.pageSubtitle}>Find jobs and start earning</Text>
        </View>

        <Pressable
          onPress={handleRefresh} // Use the simplified native refresh handler
          style={styles.headerRefresh}
        >
          <RefreshCw size={18} color="#64748B" />
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
            <Text style={tab === 'available' ? styles.tabActiveText : styles.tabText}>Available ({availableJobs.length})</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tab, tab === 'pending' && styles.tabActive]} onPress={() => setTab('pending')}>
            <Text style={tab === 'pending' ? styles.tabActiveText : styles.tabText}>Pending ({mockJobs.pending.length})</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tab, tab === 'archive' && styles.tabActive]} onPress={() => setTab('archive')}>
            <Text style={tab === 'archive' ? styles.tabActiveText : styles.tabText}>Archive ({mockJobs.archive.length})</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

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
            {jobs.map((job: any) => (
              <Pressable 
                key={job.id} 
                style={styles.jobCard} 
                // Navigation correct for expo-router
                onPress={() => router.push(`/Student/Job/${job.id}` as never)} 
              >
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.jobDescription}>{job.description || 'Geen beschrijving'}</Text>
                <Text style={styles.jobMeta}>
                  {job.start_time ? new Date(job.start_time).toLocaleString('nl-BE') : 'Starttijd TBA'}
                  {job.area_text ? ` • ${job.area_text}` : ''}
                  {job.hourly_or_fixed === 'fixed' && job.fixed_price ? ` • €${job.fixed_price}` : ''}
                  {job.hourly_or_fixed === 'hourly' ? ' • Uurloon' : ''}
                </Text>
              </Pressable>
            ))}
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
              <Text style={styles.emptyTitle}>No available jobs</Text>
              <Text style={styles.emptySubtitle}>Available jobs will appear here (filters coming later).</Text>
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

/* STYLES */
const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: "#fff",
  },

  /* HEADER */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: "700",
    marginTop: 10,
    color: "#1B1B1B",
  },
  pageSubtitle: {
    fontSize: 16,
    color: "#7A7F85",
    marginBottom: 0,
  },
  headerRefresh: { 
    padding: 6, 
    borderRadius: 999, 
    backgroundColor: '#F7F9FC',
    // Added shadow for visual depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 2, 
  },

  /* DOCUMENT VERIFICATION BANNER */
  banner: {
    backgroundColor: "#FFF4D9",
    borderLeftWidth: 4,
    borderLeftColor: "#FFB01F",
    padding: 18,
    borderRadius: 12,
    marginBottom: 28,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
    color: "#664D0E",
  },
  bannerText: {
    fontSize: 14,
    color: "#7C7C7C",
    marginBottom: 16,
    lineHeight: 20,
  },
  bannerBtn: {
    backgroundColor: "#FFB01F",
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
    borderRadius: 8,
  },
  bannerBtnText: {
    color: "#fff",
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
  tabText: { color: "#7A7F85", fontWeight: "500" },
  tabActiveText: { color: "#fff", fontWeight: "600" },

  /* JOB LIST */
  jobsContainer: {
    borderWidth: 1,
    borderColor: '#E4E6EB',
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 12,
  },
  jobsList: {
    gap: 12,
    marginTop: 8,
  },
  jobCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F2',
  },
  jobTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  jobDescription: { fontSize: 14, color: '#4A4A4A', marginBottom: 6 },
  jobMeta: { color: '#7A7F85', fontSize: 13 },


  /* EMPTY STATE */
  loadingState: {
    paddingVertical: 90,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E4E6EB",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 18,
  },
  emptyState: {
    paddingVertical: 90,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E4E6EB",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 18,
  },
  emptyIcon: {
    fontSize: 42,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 6,
    color: "#1B1B1B",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#7A7F85",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 260,
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
  socialIconText: {
    fontSize: 20,
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