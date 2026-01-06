import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, StatusBar, ActivityIndicator, Alert } from "react-native";
import { useRouter } from 'expo-router';
import { RefreshCw, Plus, ArrowDown, Handshake, User, Instagram, Linkedin, Facebook, Twitter, MapPin, Clock, Briefcase, CreditCard } from "lucide-react-native";
import { jobsAPI, getClientId, paymentAPI } from "@/services/api";
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';

// Stripe publishable key (vervang met je ECHTE test key!)
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51Smd6rDqjNmnpUMj83qaNNTmmaiIwFOVCIyEA20VwOpimH1bW1hJuKFs2YloGA7j3XsP9vYP7rCNnqIdXdhxYFnV008lbOqttm';

function DashboardClientContent() {
  const [activeTab, setActiveTab] = useState("Open");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingJobId, setPayingJobId] = useState<number | null>(null);
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

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

  useEffect(() => {
    if (Platform.OS === 'web') {
      document.title = "QuickJob | Dashboard-Client";
    }
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  // Handle payment for completed job
  const handlePayment = async (job: any) => {
    try {
      setPayingJobId(job.id);
      
      const clientId = await getClientId();
      if (!clientId) {
        Alert.alert('Error', 'Geen client sessie gevonden');
        return;
      }

      // Calculate amount in cents
      const amount = job.hourly_or_fixed === 'fixed' 
        ? Math.round((job.fixed_price || 0) * 100)
        : Math.round((job.hourly_rate || 0) * 100 * 8); // Assume 8 hours for hourly

      if (amount < 50) {
        Alert.alert('Error', 'Bedrag moet minimaal €0.50 zijn');
        return;
      }

      // TEMP: For demo we use student_id = 1 
      // TODO: In real app, get from job.accepted_student_id or job_applications table
      const studentId = 1;

      // Create payment intent
      const { client_secret } = await paymentAPI.createPaymentIntent({
        student_id: studentId,
        job_id: job.id,
        client_id: parseInt(clientId),
        amount,
        currency: 'eur',
        description: `Betaling voor ${job.title}`,
      });

      // Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'QuickJob',
        paymentIntentClientSecret: client_secret,
        defaultBillingDetails: {
          name: 'Client',
        },
      });

      if (initError) {
        Alert.alert('Error', initError.message);
        return;
      }

      // Present payment sheet
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        Alert.alert('Betaling geannuleerd', paymentError.message);
      } else {
        Alert.alert('Succes', 'Betaling succesvol! 🎉');
        fetchJobs(); // Refresh jobs
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Betaling mislukt');
    } finally {
      setPayingJobId(null);
    }
  };

  // Render a single job card
  const renderJobCard = (job: any) => (
    <View key={job.id} style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle}>{job.title}</Text>
        <View style={[styles.statusBadge, job.status === 'open' ? styles.statusOpen : styles.statusOther]}>
          <Text style={styles.statusText}>{job.status}</Text>
        </View>
      </View>
      {job.category && (
        <View style={styles.jobMeta}>
          <Briefcase size={14} color="#64748B" />
          <Text style={styles.jobMetaText}>{job.category.name_nl || job.category.name_en}</Text>
        </View>
      )}
      {job.area_text && (
        <View style={styles.jobMeta}>
          <MapPin size={14} color="#64748B" />
          <Text style={styles.jobMetaText}>{job.area_text}</Text>
        </View>
      )}
      {job.start_time && (
        <View style={styles.jobMeta}>
          <Clock size={14} color="#64748B" />
          <Text style={styles.jobMetaText}>{formatDate(job.start_time)}</Text>
        </View>
      )}
      <View style={styles.jobFooter}>
        <Text style={styles.jobPrice}>
          {job.hourly_or_fixed === 'fixed' 
            ? `€${job.fixed_price || 0}` 
            : `€${job.hourly_rate || 0}/uur`}
        </Text>
        
        {/* Show Pay button only for completed jobs */}
        {job.status === 'completed' && (
          <TouchableOpacity 
            style={[styles.payButton, payingJobId === job.id && styles.payButtonDisabled]}
            onPress={() => handlePayment(job)}
            disabled={payingJobId === job.id}
          >
            {payingJobId === job.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <CreditCard size={16} color="#fff" />
                <Text style={styles.payButtonText}>Betalen</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

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
          <TouchableOpacity style={styles.iconButton} onPress={fetchJobs}>
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
          <TouchableOpacity
            style={styles.createJobBtn}
            onPress={() => router.push('/Client/PostJob' as never)}
          >
            <Plus size={24} color="#FFF" />
            <Text style={styles.createJobText}>Create job</Text>
          </TouchableOpacity>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tabBtn, activeTab === tab && styles.activeTabBtn]}
              >
                <Text style={activeTab === tab ? styles.activeTabText : styles.inactiveTabText}>
                  {tab} ({tab === "Open" ? openJobs.length : tab === "Today" ? todayJobs.length : tab === "Planned" ? plannedJobs.length : completedJobs.length})
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Loading State */}
          {loading && (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator size="large" color="#176B51" />
              <Text style={styles.loadingText}>Jobs laden...</Text>
            </View>
          )}

          {/* Error State */}
          {!loading && error && (
            <View style={styles.emptyWrapper}>
              <Text style={styles.emptyTitle}>⚠️ {error}</Text>
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
            <View style={styles.emptyWrapper}>
              <View style={styles.emptyIcon}>
                <ArrowDown size={24} color="#176B51" />
              </View>
              <Text style={styles.emptyTitle}>Geen {activeTab.toLowerCase()} jobs</Text>
              <Text style={styles.emptySubtitle}>
                Plaats je eerste job om te beginnen
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/Client/PostJob' as never)}>
                <Text style={styles.emptyButtonText}>+ Job plaatsen</Text>
              </TouchableOpacity>
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
                <TouchableOpacity><Text style={styles.footerLink}>About Us</Text></TouchableOpacity>
                <TouchableOpacity><Text style={styles.footerLink}>Contact</Text></TouchableOpacity>
                <TouchableOpacity><Text style={styles.footerLink}>Careers</Text></TouchableOpacity>
              </View>

              <View style={styles.footerColumn}>
                <Text style={styles.footerColumnTitle}>Support</Text>
                <TouchableOpacity><Text style={styles.footerLink}>Help Center</Text></TouchableOpacity>
                <TouchableOpacity><Text style={styles.footerLink}>Safety</Text></TouchableOpacity>
                <TouchableOpacity><Text style={styles.footerLink}>FAQ</Text></TouchableOpacity>
              </View>

              <View style={styles.footerColumn}>
                <Text style={styles.footerColumnTitle}>Legal</Text>
                <TouchableOpacity><Text style={styles.footerLink}>Privacy Policy</Text></TouchableOpacity>
                <TouchableOpacity><Text style={styles.footerLink}>Terms of Service</Text></TouchableOpacity>
                <TouchableOpacity><Text style={styles.footerLink}>Cookie Policy</Text></TouchableOpacity>
              </View>
            </View>

            <View style={styles.footerSocial}>
              <Text style={styles.footerSocialTitle}>Follow Us</Text>
              <View style={styles.socialIcons}>
                <TouchableOpacity style={styles.socialIcon}><Instagram size={20} color="#E4405F" /></TouchableOpacity>
                <TouchableOpacity style={styles.socialIcon}><Linkedin size={20} color="#0A66C2" /></TouchableOpacity>
                <TouchableOpacity style={styles.socialIcon}><Facebook size={20} color="#1877F2" /></TouchableOpacity>
                <TouchableOpacity style={styles.socialIcon}><Twitter size={20} color="#1DA1F2" /></TouchableOpacity>
              </View>
            </View>

            <View style={styles.footerContact}>
              <Text style={styles.footerContactText}>📧 support@quickjob.be</Text>
              <Text style={styles.footerContactText}>📞 +32 2 123 45 67</Text>
            </View>

            <View style={styles.footerBottom}>
              <Text style={styles.footerCopyright}>© 2025 QuickJob. All rights reserved.</Text>
              <Text style={styles.footerVersion}>v1.0.0</Text>
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

// Main export: wrap with StripeProvider
export default function DashboardClient() {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <DashboardClientContent />
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F7FA" },
  scrollContent: { paddingBottom: 10 },
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
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#1a2e4c" },
  iconButton: { padding: 8, backgroundColor: "#F7F9FC", borderRadius: 999 },
  contentContainer: { padding: 24, paddingBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1a2e4c", marginBottom: 16 },
  statsGrid: { flexDirection: "row", gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statNumber: { fontSize: 24, fontWeight: "700", color: "#176B51", marginBottom: 4 },
  statLabel: { fontSize: 12, fontWeight: "500", color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5 },
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
  createJobText: { color: "#fff", fontWeight: "700", fontSize: 16, marginLeft: 8 },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 4,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#EFF0F6",
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  activeTabBtn: { backgroundColor: "#176B51" },
  activeTabText: { color: "#fff", fontWeight: "600", fontSize: 12 },
  inactiveTabText: { color: "#64748B", fontWeight: "500", fontSize: 12 },
  jobsContainer: { gap: 12 },
  jobCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  jobHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  jobTitle: { fontSize: 16, fontWeight: "700", color: "#1a2e4c", flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusOpen: { backgroundColor: "#DCFCE7" },
  statusOther: { backgroundColor: "#E0F2FE" },
  statusText: { fontSize: 12, fontWeight: "600", color: "#166534" },
  jobMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  jobMetaText: { fontSize: 14, color: "#64748B" },
  jobFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EFF0F6",
  },
  jobPrice: { fontSize: 18, fontWeight: "700", color: "#176B51" },
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#176B51",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  payButtonDisabled: { opacity: 0.6 },
  payButtonText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  loadingWrapper: { alignItems: "center", justifyContent: "center", paddingVertical: 48 },
  loadingText: { marginTop: 12, fontSize: 14, color: "#64748B" },
  emptyWrapper: { alignItems: "center", justifyContent: "center", paddingVertical: 48 },
  emptyIcon: {
    width: 48,
    height: 48,
    backgroundColor: "#E8F5E9",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#1a2e4c", marginBottom: 4 },
  emptySubtitle: { fontSize: 14, color: "#64748B", textAlign: "center", maxWidth: 200, marginBottom: 24 },
  emptyButton: { backgroundColor: "#000", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  emptyButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
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
  footerSection: { marginBottom: 24 },
  footerTitle: { fontSize: 20, fontWeight: "700", color: "#176B51", marginBottom: 8 },
  footerDescription: { fontSize: 14, color: "#6B7280", lineHeight: 20 },
  footerLinks: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  footerColumn: { flex: 1 },
  footerColumnTitle: { fontSize: 14, fontWeight: "600", color: "#1F2937", marginBottom: 12 },
  footerLink: { fontSize: 13, color: "#6B7280", marginBottom: 8 },
  footerSocial: { marginBottom: 24, alignItems: "center" },
  footerSocialTitle: { fontSize: 14, fontWeight: "600", color: "#1F2937", marginBottom: 12 },
  socialIcons: { flexDirection: "row", justifyContent: "center", gap: 12 },
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
  footerContact: { alignItems: "center", marginBottom: 20, gap: 8 },
  footerContactText: { fontSize: 13, color: "#6B7280" },
  footerBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  footerCopyright: { fontSize: 12, color: "#9CA3AF" },
  footerVersion: { fontSize: 12, color: "#9CA3AF", fontWeight: "500" },
});