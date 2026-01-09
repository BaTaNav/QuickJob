import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, StatusBar, ActivityIndicator, Image, Modal, Alert, Linking } from "react-native";
import { useRouter } from 'expo-router';
import { RefreshCw, Plus, ArrowDown, Handshake, User, Users, Instagram, Linkedin, Facebook, Twitter, MapPin, Clock, Briefcase, X, CreditCard } from "lucide-react-native";
import { jobsAPI, getClientId, paymentAPI } from "@/services/api";
import { StripeProvider, useStripe } from '@/services/stripe';
import PaymentModal from '@/components/PaymentModal';

// Stripe publishable key (vervang met je ECHTE test key!)
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51SnKnBD3r0NQD7o9ndTkrFfUSHT9Jp5m9IrIaGBZaS51qYjt368MzWfPfUnMYUkBcVGDFYH6wsZWca2zyg8piYoN00Ua1cqjXE';

function DashboardClientContent() {
  const [activeTab, setActiveTab] = useState("Open");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingJobId, setPayingJobId] = useState<number | null>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentJob, setPaymentJob] = useState<any>(null);
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

  // Fetch applicants for a job
  const fetchApplicants = useCallback(async (jobId: number) => {
    try {
      setLoadingApplicants(true);
      const data = await jobsAPI.getJobApplicants(jobId);
      setApplicants(data.applicants || []);
      setShowApplicantsModal(true);
    } catch (err: any) {
      console.error('Error fetching applicants:', err);
      alert(err?.message || 'Failed to load applicants');
    } finally {
      setLoadingApplicants(false);
    }
  }, []);

  // Handle application status update
  const handleUpdateApplication = useCallback(async (jobId: number, applicationId: number, status: 'accepted' | 'rejected') => {
    try {
      await jobsAPI.updateApplicationStatus(jobId, applicationId, status);
      // Refresh applicants list
      await fetchApplicants(jobId);
      // Refresh jobs list to update counts
      await fetchJobs();
    } catch (err: any) {
      console.error('Error updating application:', err);
      alert(err?.message || 'Failed to update application');
    }
  }, [fetchApplicants, fetchJobs]);

  // Filter jobs by status
  const openJobs = jobs.filter(j => j.status === 'open');
  // Treat jobs that already have an accepted applicant as planned in the UI
  // (some historical accepts may have left job.status as 'pending')
  const plannedJobs = jobs.filter(j => j.status === 'planned' || j.status === 'assigned' || (j.accepted_applicants && j.accepted_applicants > 0) || !!j.accepted_applicant);
  // Include expired jobs in Completed view so clients can see which jobs expired
  const completedJobs = jobs.filter(j => j.status === 'completed' || j.status === 'expired');
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
        setPayingJobId(null);
        return;
      }

      // Find the accepted student for this completed job
      let studentId = null;
      try {
        const applicantsData = await jobsAPI.getJobApplicants(job.id);
        const acceptedApplicant = applicantsData.applicants?.find(
          (app: any) => app.status === 'accepted'
        );
        studentId = acceptedApplicant?.student?.id;
      } catch (err) {
        console.error('Failed to get accepted student:', err);
      }

      if (!studentId) {
        Alert.alert('Error', 'Geen geaccepteerde student gevonden voor deze job. Accepteer eerst een applicant.');
        setPayingJobId(null);
        return;
      }

      // Create payment intent
      const { client_secret } = await paymentAPI.createPaymentIntent({
        student_id: studentId,
        job_id: job.id,
        client_id: parseInt(clientId),
        amount,
        currency: 'eur',
        description: `Betaling voor ${job.title}`,
      });

      // On web, show payment modal instead of payment sheet
      if (Platform.OS === 'web') {
        setPaymentClientSecret(client_secret);
        setPaymentAmount(amount);
        setPaymentJob(job);
        setShowPaymentModal(true);
        setPayingJobId(null);
        return;
      }

      // On mobile, use payment sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'QuickJob',
        paymentIntentClientSecret: client_secret,
        defaultBillingDetails: {
          name: 'Client',
        },
      });

      if (initError) {
        Alert.alert('Error', initError.message);
        setPayingJobId(null);
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
  const renderJobCard = (job: any) => {
    const isExpired = job.status === 'expired';
    const statusLabel = isExpired ? 'Expired' : (job.status || '').toString();
    const statusStyle = job.status === 'open' ? styles.statusOpen : (isExpired ? styles.statusExpired : styles.statusOther);

    return (
    <View key={job.id} style={styles.jobCard}>
      <View style={styles.jobHeader}>
        {job.image_url && (
  <Image 
    source={{ uri: job.image_url }} 
    style={styles.jobImage} 
    resizeMode="cover"
  />
)}
        <Text style={styles.jobTitle}>{job.title}</Text>
        <View style={[styles.statusBadge, statusStyle]}>
          <Text style={[styles.statusText, isExpired ? styles.statusTextExpired : null]}>{statusLabel}</Text>
        </View>
      </View>
      {job.category && (
        <View style={styles.jobMeta}>
          <Briefcase size={14} color="#64748B" />
          <Text style={styles.jobMetaText}>{job.category.name_nl || job.category.name_en}</Text>
        </View>
      )}
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
        if (addr) {
          return (
            <View style={styles.jobMeta}>
              <MapPin size={14} color="#64748B" />
              <Text style={styles.jobMetaText}>{addr}</Text>
            </View>
          );
        }
        return null;
      })()}
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

      {(job.applicant_count > 0 || job.pending_applicants > 0 || job.accepted_applicants > 0) && (
        <TouchableOpacity 
          style={styles.viewApplicantsBtn}
          onPress={() => {
            setSelectedJob(job);
            fetchApplicants(job.id);
          }}
        >
          <Users size={16} color="#176B51" />
          <Text style={styles.viewApplicantsText}>
            {job.applicant_count || 0} applicant{job.applicant_count !== 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
  };

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

          {/* Applicants Modal */}
          <Modal
            visible={showApplicantsModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowApplicantsModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    Applicants {selectedJob ? `- ${selectedJob.title}` : ''}
                  </Text>
                  <TouchableOpacity onPress={() => setShowApplicantsModal(false)}>
                    <X size={24} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {loadingApplicants && (
                  <View style={styles.modalLoading}>
                    <ActivityIndicator size="large" color="#176B51" />
                    <Text style={styles.loadingText}>Loading applicants...</Text>
                  </View>
                )}

                {!loadingApplicants && applicants.length === 0 && (
                  <View style={styles.emptyApplicants}>
                    <Users size={48} color="#CBD5E1" />
                    <Text style={styles.emptyApplicantsText}>No applicants yet</Text>
                  </View>
                )}

                {!loadingApplicants && applicants.length > 0 && (
                  <ScrollView style={styles.applicantsList}>
                    {applicants.map((applicant) => (
                      <View key={applicant.application_id} style={styles.applicantCard}>
                        <View style={styles.applicantHeader}>
                          {applicant.student?.avatar_url ? (
                            <Image 
                              source={{ uri: applicant.student.avatar_url }} 
                              style={styles.applicantAvatar}
                            />
                          ) : (
                            <View style={styles.applicantAvatarPlaceholder}>
                              <User size={24} color="#64748B" />
                            </View>
                          )}
                          <View style={styles.applicantInfo}>
                            <Text style={styles.applicantEmail}>{applicant.student?.email}</Text>
                            {applicant.student?.school_name && (
                              <Text style={styles.applicantDetail}>🎓 {applicant.student.school_name}</Text>
                            )}
                            {applicant.student?.field_of_study && (
                              <Text style={styles.applicantDetail}>📚 {applicant.student.field_of_study}</Text>
                            )}
                            {applicant.student?.academic_year && (
                              <Text style={styles.applicantDetail}>📅 {applicant.student.academic_year}</Text>
                            )}
                            {applicant.student?.phone && (
                              <Text style={styles.applicantDetail}>📞 {applicant.student.phone}</Text>
                            )}
                          </View>
                        </View>

                        <View style={styles.applicantStatus}>
                          <View style={[
                            styles.statusBadge,
                            applicant.status === 'pending' ? styles.statusPending : 
                            applicant.status === 'accepted' ? styles.statusAccepted : 
                            styles.statusRejected
                          ]}>
                            <Text style={styles.statusText}>{applicant.status}</Text>
                          </View>
                          <Text style={styles.appliedDate}>
                            Applied: {new Date(applicant.applied_at).toLocaleDateString('nl-BE')}
                          </Text>
                        </View>

                        {applicant.status === 'pending' && selectedJob && (
                          <View style={styles.applicantActions}>
                            <TouchableOpacity 
                              style={styles.acceptBtn}
                              onPress={() => handleUpdateApplication(selectedJob.id, applicant.application_id, 'accepted')}
                            >
                              <Text style={styles.acceptBtnText}>Accept</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.rejectBtn}
                              onPress={() => handleUpdateApplication(selectedJob.id, applicant.application_id, 'rejected')}
                            >
                              <Text style={styles.rejectBtnText}>Reject</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>
          </Modal>

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

      {/* Payment Modal (Web only) */}
      {Platform.OS === 'web' && showPaymentModal && (
        <PaymentModal
          onClose={() => setShowPaymentModal(false)}
          clientSecret={paymentClientSecret}
          amount={paymentAmount}
          jobTitle={paymentJob?.title || ''}
          onSuccess={() => {
            Alert.alert('Succes', 'Betaling succesvol! 🎉');
            fetchJobs();
            setShowPaymentModal(false);
          }}
        />
      )}
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
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6EEF0',
    marginBottom: 12,
  },
  jobMeta: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 6,
    gap: 8 
  },
  jobAction: { backgroundColor: '#176B51', paddingHorizontal: 12, paddingVertical: 8 },
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
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#176B51',
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
  jobImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 8,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#176B51",
  },
  viewApplicantsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  viewApplicantsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#176B51',
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
  footerCopyright: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  footerVersion: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a2e4c',
    flex: 1,
  },
  modalLoading: {
    padding: 40,
    alignItems: 'center',
  },
  emptyApplicants: {
    padding: 60,
    alignItems: 'center',
  },
  emptyApplicantsText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  applicantsList: {
    padding: 16,
  },
  applicantCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  applicantHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  applicantAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  applicantAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  applicantInfo: {
    flex: 1,
  },
  applicantEmail: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a2e4c',
    marginBottom: 4,
  },
  applicantDetail: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  applicantStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusAccepted: {
    backgroundColor: '#DCFCE7',
  },
  statusRejected: {
    backgroundColor: '#FEE2E2',
  },
  // Expired status styling
  statusExpired: {
    backgroundColor: '#FEE2E2',
  },
  statusTextExpired: {
    color: '#B91C1C',
  },
  appliedDate: {
    fontSize: 12,
    color: '#64748B',
  },
  applicantActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: '#176B51',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  rejectBtnText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 14,
  },
});

// Wrap with StripeProvider
export default function DashboardClient() {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <DashboardClientContent />
    </StripeProvider>
  );
}