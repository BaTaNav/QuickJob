import { StyleSheet, TouchableOpacity, ScrollView, Pressable, Text, View, Platform, TextInput } from "react-native";
import * as React from "react";
import { useRouter } from 'expo-router';
// Using an icon library commonly used in React Native
import { RefreshCw, Instagram, Linkedin, Facebook, Twitter } from 'lucide-react-native'; 

export default function StudentDashboard() {
  const [tab, setTab] = React.useState<'today' | 'upcoming' | 'available' | 'pending' | 'archive'>('today');
  // Placeholder jobs per tab for building pages. Replace with API data later.
  const router = useRouter();

   // MOCK DATA (Should be replaced with a real data fetch using a hook or Redux/Context)
  const mockJobs: Record<string, Array<any>> = {
    today: [
      { id: 't1', status: 'today', category: 'Delivery', title: 'Grocery pickup', description: 'Pick up groceries and deliver to client.', time: '2025-12-10 10:00', hours: '2', address: 'Rue Example 12, Leuven', location: 'Leuven', pay: '€12/hr', distanceKm: 4 },
    ],
    upcoming: [
      { id: 'u1', status: 'upcoming', category: 'Pet care', title: 'Dog walking', description: 'Walk the dog for 30 minutes.', time: '2025-12-11 14:00', hours: '0.5', address: 'Chaussée de Namur 5, Brussels', location: 'Brussels', pay: '€10/hr', distanceKm: 22 },
    ],
    available: [
      { id: 'a1', status: 'available', category: 'Promotion', title: 'Flyer distribution', description: 'Distribute flyers in the neighbourhood.', time: 'Flexible', hours: '3', address: 'Leuven Centrum', location: 'Leuven', pay: '€9/hr', distanceKm: 5 },
      { id: 'a2', status: 'available', category: 'Gardening', title: 'Lawn mowing', description: 'Mow the lawn for a client.', time: 'Flexible', hours: '2', address: 'Parkstraat 10, Antwerp', location: 'Antwerp', pay: '€11/hr', distanceKm: 48 },
    ],
    pending: [
      { id: 'p1', status: 'pending', category: 'Home help', title: 'Cleaning help', description: 'Help with light cleaning.', time: 'Pending - 08/12', hours: '4', address: 'Avenue Louise 45, Brussels', location: 'Brussels', pay: '€13/hr', distanceKm: 18 },
    ],
    archive: [
      { id: 'ar1', status: 'archive', category: 'Moving', title: 'Moved boxes', description: 'Helped move boxes last week.', time: '2025-12-03', hours: '5', address: 'Rue du Parc 2, Wavre', location: 'Wavre', pay: '€20', distanceKm: 36 },
    ],
  };

  // Dynamically select the jobs based on the active tab state
  const jobs = mockJobs[tab] ?? [];

  // --- Filter state (range km, category, date) ---
  const [filterRange, setFilterRange] = React.useState<number>(20);
  const [filterCategory, setFilterCategory] = React.useState<string>('All');
  const [filterDate, setFilterDate] = React.useState<string>('Any');
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [showFilters, setShowFilters] = React.useState<boolean>(Platform.OS === 'web');

  // Native date picker integration (dynamically required so web build doesn't fail if package not installed)
  const [showDatePickerNative, setShowDatePickerNative] = React.useState(false);
  const [DateTimePickerComponent, setDateTimePickerComponent] = React.useState<any | null>(null);

  React.useEffect(() => {
    if (Platform.OS !== 'web') {
      try {
        // Use runtime require to avoid bundler errors when package is not installed
        // The module name is 'react-native-datetimepicker/datetimepicker'
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

  // Helper: parse date (YYYY-MM-DD) from job.time if present
  const parseJobDate = (time?: string) => {
    if (!time) return null;
    const m = time.match(/(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : null;
  };

  // Derived filtered jobs according to selected filters
  const filteredJobs = (jobs || []).filter((job: any) => {
    // Range filter (if job has distanceKm)
    if (typeof job.distanceKm === 'number' && job.distanceKm > filterRange) return false;

    // Category
    if (filterCategory !== 'All' && job.category !== filterCategory) return false;

    // Date options
    const jobDate = parseJobDate(job.time);
    if (filterDate === 'Today') {
      const today = new Date().toISOString().slice(0,10);
      if (!jobDate || jobDate !== today) return false;
    } else if (filterDate === 'This week') {
      if (!jobDate) return false;
      const now = new Date();
      const start = new Date(now.setHours(0,0,0,0));
      const d = new Date(jobDate);
      const diffDays = Math.floor((d.getTime() - start.getTime()) / (1000*60*60*24));
      if (diffDays < 0 || diffDays > 7) return false;
    } else if (filterDate === 'Specific') {
      if (!selectedDate) return false;
      if (!jobDate || jobDate !== selectedDate) return false;
    }

    return true;
  });

  // Function to handle refresh action
  const handleRefresh = () => {
    // In a real native app, this would trigger a data fetching action,
    // possibly setting a loading state.
    console.log("Refreshing data for dashboard...");
    // Example: fetchJobs();
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
            <Text style={tab === 'available' ? styles.tabActiveText : styles.tabText}>Available ({mockJobs.available.length})</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tab, tab === 'pending' && styles.tabActive]} onPress={() => setTab('pending')}>
            <Text style={tab === 'pending' ? styles.tabActiveText : styles.tabText}>Pending ({mockJobs.pending.length})</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tab, tab === 'archive' && styles.tabActive]} onPress={() => setTab('archive')}>
            <Text style={tab === 'archive' ? styles.tabActiveText : styles.tabText}>Archive ({mockJobs.archive.length})</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* FILTERS */}
      <View style={styles.tabFilterRow}>
        <View />
        <View style={styles.filterToggleContainer}>
          <TouchableOpacity style={styles.filterToggleBtn} onPress={() => setShowFilters(!showFilters)}>
            <Text style={styles.filterToggleText}>{showFilters ? 'Hide filters' : 'Show filters'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showFilters && (
        <View style={styles.filterRow}>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Range</Text>
            <View style={styles.filterPills}>
              {[5,10,20,50].map((r)=> (
                <TouchableOpacity key={r} onPress={() => setFilterRange(r)} style={[styles.filterBtn, filterRange === r && styles.filterBtnActive]}>
                  <Text style={filterRange === r ? styles.filterBtnTextActive : styles.filterBtnText}>{r} km</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Category</Text>
            <View style={styles.filterPills}>
              {['All','Delivery','Pet care','Promotion','Gardening','Home help','Moving'].map((c)=> (
                <TouchableOpacity key={c} onPress={() => setFilterCategory(c)} style={[styles.filterBtn, filterCategory === c && styles.filterBtnActive]}>
                  <Text style={filterCategory === c ? styles.filterBtnTextActive : styles.filterBtnText}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Date</Text>
            <View style={styles.filterPills}>
              {['Any','Today','This week','Specific'].map((d)=> (
                <TouchableOpacity key={d} onPress={() => { setFilterDate(d); if (d !== 'Specific') setSelectedDate(null); }} style={[styles.filterBtn, filterDate === d && styles.filterBtnActive]}>
                  <Text style={filterDate === d ? styles.filterBtnTextActive : styles.filterBtnText}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {filterDate === 'Specific' && (
              <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {Platform.OS === 'web' ? (
                  // @ts-ignore web input
                  <input type="date" value={selectedDate || ''} onChange={(e: any) => setSelectedDate(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #E2E8F0' }} />
                ) : DateTimePickerComponent ? (
                  <>
                    <TouchableOpacity onPress={() => setShowDatePickerNative(true)} style={styles.datePickerBtn}>
                      <Text style={styles.datePickerText}>{selectedDate || 'Pick a date'}</Text>
                    </TouchableOpacity>
                    {showDatePickerNative && (
                      // @ts-ignore render native picker component
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

      {/* JOB LIST or EMPTY STATE */}
      {filteredJobs.length > 0 ? (
        <View style={styles.jobsContainer}>
          <View style={styles.jobsList}>
            {filteredJobs.map((job: any) => (
              <Pressable 
                key={job.id} 
                style={styles.jobCard} 
                onPress={() => router.push(`/Student/Job/${job.id}` as never)} 
              >
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.jobDescription}>{job.description}</Text>
                <Text style={styles.jobMeta}>
                  {job.time} • {job.location} • {job.pay}
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

          {tab === 'available' && (
            <>
              <Text style={styles.emptyTitle}>{(filterRange !== 20 || filterCategory !== 'All' || filterDate !== 'Any') ? 'No available jobs match your filters' : 'No available jobs'}</Text>
              <Text style={styles.emptySubtitle}>{(filterRange !== 20 || filterCategory !== 'All' || filterDate !== 'Any') ? 'Try broadening your filters to find more jobs.' : 'Available jobs will appear here.'}</Text>
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