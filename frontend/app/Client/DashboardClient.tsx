import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, StatusBar, ActivityIndicator, Modal, Alert } from "react-native";
import { useRouter } from 'expo-router';
import { RefreshCw, Plus, Handshake, User, Users, Trash, Calendar } from "lucide-react-native";
import { jobsAPI, getClientId } from "@/services/api";
import { Job, groupJobsByDay, formatJobAddress, formatPrice } from '../../utils/helpers';
import { brand } from '../../constants/Colors';
import JobCard from '../../components/JobCard';
import DaySection from '../../components/DaySection';
import TabBar from '../../components/TabBar';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';
import Footer from '../../components/Footer';

function DashboardClientContent() {
  const [activeTab, setActiveTab] = useState("Open");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
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
      await fetchApplicants(jobId);
      await fetchJobs();
    } catch (err: any) {
      console.error('Error updating application:', err);
      alert(err?.message || 'Failed to update application');
    }
  }, [fetchApplicants, fetchJobs]);

  // Filter jobs by status
  const openJobs = jobs.filter(j => j.status === 'open');
  const plannedJobs = jobs.filter(j => (j.status === 'planned' || j.status === 'assigned' || (j.accepted_applicants && j.accepted_applicants > 0) || !!j.accepted_applicant) && j.status !== 'completed');
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
  const tabItems = [
    { key: 'Open', label: 'Open', count: openJobs.length },
    { key: 'Today', label: 'Today', count: todayJobs.length },
    { key: 'Planned', label: 'Planned', count: plannedJobs.length },
    { key: 'Completed', label: 'Completed', count: completedJobs.length },
  ];

  useEffect(() => {
    if (Platform.OS === 'web') {
      document.title = "QuickJob | Dashboard-Client";
    }
  }, []);

  // Handle marking job as completed
  const handleMarkAsCompleted = async (job: any) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Weet je zeker dat job "${job.title}" voltooid is?`);
      if (confirmed) {
        performCompletion(job);
      }
      return;
    }

    Alert.alert(
      'Job Voltooien',
      'Weet je zeker dat het werk klaar is?',
      [
        { text: 'Annuleren', style: 'cancel' },
        { text: 'Ja, Voltooien', onPress: () => performCompletion(job) }
      ]
    );
  };

  // Handle deleting a job
  const handleDeleteJob = async (job: any) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Weet je zeker dat je job "${job.title}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`)) {
        performDelete(job);
      }
      return;
    }

    Alert.alert(
      'Job Verwijderen',
      `Weet je zeker dat je "${job.title}" wilt verwijderen?`,
      [
        { text: 'Annuleren', style: 'cancel' },
        { text: 'Verwijderen', style: 'destructive', onPress: () => performDelete(job) }
      ]
    );
  };

  const performDelete = async (job: any) => {
    try {
      const clientId = await getClientId();
      if (!clientId) {
        const msg = "Geen client sessie gevonden.";
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Fout', msg);
        return;
      }
      await jobsAPI.deleteJob(job.id, parseInt(clientId));
      const successMsg = "Job succesvol verwijderd.";
      Platform.OS === 'web' ? window.alert(successMsg) : Alert.alert('Succes', successMsg);
      fetchJobs();
    } catch (err: any) {
      console.error("Delete error:", err);
      const errorMsg = "Kon job niet verwijderen: " + err.message;
      Platform.OS === 'web' ? window.alert(errorMsg) : Alert.alert('Fout', errorMsg);
    }
  };

  const performCompletion = async (job: any) => {
    try {
      const clientId = await getClientId();
      if (!clientId) {
        const msg = 'Je bent niet ingelogd (Geen Client ID).';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Fout', msg);
        return;
      }
      await jobsAPI.updateJobStatus(job.id, 'completed', parseInt(clientId));
      const successMsg = "Job is voltooid! Hij staat nu bij 'Completed'.";
      Platform.OS === 'web' ? window.alert(successMsg) : Alert.alert("Succes", successMsg);
      await fetchJobs();
    } catch (error: any) {
      console.error('Update failed:', error);
      const errorMsg = "Kon status niet updaten: " + error.message;
      Platform.OS === 'web' ? window.alert(errorMsg) : Alert.alert("Fout", errorMsg);
    }
  };

  // Render action buttons for a job card
  const renderJobActions = (job: any) => {
    return (
      <View style={styles.actionButtonsRow}>
        {/* DELETE button for open jobs */}
        {job.status === 'open' && (
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteJob(job)}>
            <Trash size={18} color="#EF4444" />
          </TouchableOpacity>
        )}

        {/* Mark as Completed for Today tab */}
        {activeTab === 'Today' && job.status !== 'completed' && (
          <TouchableOpacity style={styles.completeButton} onPress={() => handleMarkAsCompleted(job)}>
            <Text style={styles.completeButtonText}>✓ Voltooid</Text>
          </TouchableOpacity>
        )}

        {/* Mark as Completed for planned jobs */}
        {(job.status === 'planned' || job.status === 'assigned' || (job.accepted_applicants && job.accepted_applicants > 0) || !!job.accepted_applicant) && job.status !== 'completed' && (
          <TouchableOpacity style={styles.completeButton} onPress={() => handleMarkAsCompleted(job)}>
            <Text style={styles.completeButtonText}>✓ Voltooid</Text>
          </TouchableOpacity>
        )}

        {/* Review button for completed jobs */}
        {job.status === 'completed' && (
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={() => router.push(`/Client/Review?jobId=${job.id}` as never)}
            >
              <Text style={styles.reviewButtonText}>✍️ Review</Text>
            </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render job card with custom actions and applicants button
  const renderJobWithApplicants = (job: any) => {
    return (
      <View key={job.id} style={styles.jobCardWrapper}>
        <JobCard job={job} children={renderJobActions(job)} />
        {(job.applicant_count > 0 || job.pending_applicants > 0 || job.accepted_applicants > 0) && (
          <TouchableOpacity
            style={styles.viewApplicantsBtn}
            onPress={() => {
              setSelectedJob(job);
              fetchApplicants(job.id);
            }}
          >
            <Users size={16} color={brand.primary} />
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
          <Handshake size={28} color={brand.primary} strokeWidth={2.5} />
          <Text style={styles.headerTitle}>QuickJob</Text>
        </View>
        <View style={styles.headerRight}>
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

          {/* Create Job Button */}
          <TouchableOpacity
            style={styles.createJobBtn}
            onPress={() => router.push('/Client/PostJob' as never)}
          >
            <Plus size={24} color="#FFF" />
            <Text style={styles.createJobText}>Create job</Text>
          </TouchableOpacity>

          {/* Tabs */}
          <TabBar
            tabs={tabItems}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Loading State */}
          {loading && <LoadingState message="Jobs laden..." />}

          {/* Error State */}
          {!loading && error && (
            <EmptyState
              icon="⚠️"
              title={error}
              onAction={fetchJobs}
              actionLabel="Opnieuw proberen"
            />
          )}

          {/* Job List */}
          {!loading && !error && filteredJobs.length > 0 && (() => {
            const groupedJobs = groupJobsByDay(filteredJobs);
            return (
              <View>
                {Object.entries(groupedJobs).map(([day, dayJobs]) => (
                  <DaySection key={day} date={day} count={dayJobs.length}>
                    {dayJobs.map(job => renderJobWithApplicants(job))}
                  </DaySection>
                ))}
              </View>
            );
          })()}

          {/* Empty State */}
          {!loading && !error && filteredJobs.length === 0 && (
            <EmptyState
              icon="⬇️"
              title={`Geen ${activeTab.toLowerCase()} jobs`}
              subtitle="Plaats je eerste job om te beginnen"
              onAction={() => router.push('/Client/PostJob' as never)}
              actionLabel="+ Job plaatsen"
            />
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
                    <Text style={styles.modalCloseBtn}>✕</Text>
                  </TouchableOpacity>
                </View>

                {loadingApplicants && <LoadingState message="Loading applicants..." />}

                {!loadingApplicants && applicants.length === 0 && (
                  <EmptyState icon="👥" title="No applicants yet" />
                )}

                {!loadingApplicants && applicants.length > 0 && (
                  <ScrollView style={styles.applicantsList}>
                    {applicants.map((applicant) => (
                      <View key={applicant.application_id} style={styles.applicantCard}>
                        <View style={styles.applicantHeader}>
                          <View style={styles.applicantAvatarPlaceholder}>
                            <User size={24} color="#64748B" />
                          </View>
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

          {/* Footer */}
          <Footer />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F7FA" },
  scrollContent: { paddingBottom: 10 },

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
  headerRight: { flexDirection: "row", gap: 8 },
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
  statNumber: { fontSize: 24, fontWeight: "700", color: brand.primary, marginBottom: 4 },
  statLabel: { fontSize: 12, fontWeight: "500", color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5 },

  createJobBtn: {
    width: "100%",
    backgroundColor: brand.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 32,
    shadowColor: brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  createJobText: { color: "#fff", fontWeight: "700", fontSize: 16, marginLeft: 8 },

  // Job card wrapper and actions
  jobCardWrapper: { marginBottom: 12 },
  actionButtonsRow: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' },
  deleteButton: { padding: 8, backgroundColor: '#FEF2F2', borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  completeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, gap: 6 },
  completeButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  payButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: brand.primary, borderRadius: 6 },
  payButtonDisabled: { opacity: 0.6 },
  payButtonText: { fontSize: 13, fontWeight: "600", color: "#fff" },
  reviewButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F59E0B', borderRadius: 6 },
  reviewButtonText: { fontSize: 13, fontWeight: "600", color: "#fff" },

  viewApplicantsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    marginTop: -4,
    marginLeft: 12,
  },
  viewApplicantsText: { fontSize: 13, fontWeight: '600', color: brand.primary },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', paddingBottom: Platform.OS === 'ios' ? 34 : 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a2e4c', flex: 1 },
  modalCloseBtn: { fontSize: 24, color: '#64748B' },
  applicantsList: { padding: 16 },
  applicantCard: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  applicantHeader: { flexDirection: 'row', marginBottom: 12 },
  applicantAvatarPlaceholder: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  applicantInfo: { flex: 1 },
  applicantEmail: { fontSize: 15, fontWeight: '600', color: '#1a2e4c', marginBottom: 4 },
  applicantDetail: { fontSize: 13, color: '#64748B', marginBottom: 2 },
  applicantStatus: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusAccepted: { backgroundColor: '#DCFCE7' },
  statusRejected: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 11, fontWeight: "600", color: "#166534", textTransform: "uppercase" },
  appliedDate: { fontSize: 12, color: '#64748B' },
  applicantActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  acceptBtn: { flex: 1, backgroundColor: brand.primary, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  acceptBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  rejectBtn: { flex: 1, backgroundColor: '#F3F4F6', paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  rejectBtnText: { color: '#64748B', fontWeight: '600', fontSize: 14 },
});

export default function DashboardClient() {
  return (
      <DashboardClientContent />
  );
}
