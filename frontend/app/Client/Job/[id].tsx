import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  ActivityIndicator,
  Image,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Briefcase,
  DollarSign,
  Users,
  User,
  Check,
  XCircle,
  Phone,
  Mail,
  GraduationCap,
  Shield,
  Calendar,
  FileText,
  Trash2,
} from "lucide-react-native";
import { jobsAPI, getClientId } from "@/services/api";

export default function ClientJobDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const jobId = typeof id === "string" ? parseInt(id, 10) : null;

  const [job, setJob] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Force Browser Tab Title on Web
  useEffect(() => {
    if (Platform.OS === "web") {
      document.title = "QuickJob | Job Details";
    }
  }, []);

  // Fetch job details
  const fetchJob = useCallback(async () => {
    if (!jobId) return;
    try {
      const data = await jobsAPI.getJob(jobId);
      setJob(data);
    } catch (err: any) {
      setError(err?.message || "Kon job niet laden");
    }
  }, [jobId]);

  // Fetch applicants
  const fetchApplicants = useCallback(async () => {
    if (!jobId) return;
    try {
      setLoadingApplicants(true);
      const data = await jobsAPI.getJobApplicants(jobId);
      setApplicants(data.applicants || []);
    } catch (err: any) {
      console.error("Error fetching applicants:", err);
    } finally {
      setLoadingApplicants(false);
    }
  }, [jobId]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchJob();
      await fetchApplicants();
      setLoading(false);
    };
    loadData();
  }, [fetchJob, fetchApplicants]);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJob();
    await fetchApplicants();
    setRefreshing(false);
  };

  // Accept or reject an applicant
  const handleApplicantAction = async (
    applicationId: number,
    status: "accepted" | "rejected"
  ) => {
    if (!jobId) return;

    try {
      await jobsAPI.updateApplicantStatus(jobId, applicationId, status);
      // Refresh data
      await fetchJob();
      await fetchApplicants();

      const message =
        status === "accepted" ? "Student geaccepteerd!" : "Student afgewezen";
      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert("Succes", message);
      }
    } catch (err: any) {
      if (Platform.OS === "web") {
        window.alert(err?.message || "Actie mislukt");
      } else {
        Alert.alert("Fout", err?.message || "Actie mislukt");
      }
    }
  };

  // Delete job handler
  const handleDeleteJob = async () => {
    if (!jobId) return;

    const doDelete = async () => {
      try {
        setDeleting(true);
        const clientId = await getClientId();
        await jobsAPI.deleteJob(jobId, clientId || undefined);
        
        if (Platform.OS === "web") {
          window.alert("Job verwijderd!");
          router.replace("/Client/DashboardClient");
        } else {
          Alert.alert("Succes", "Job verwijderd!", [
            { text: "OK", onPress: () => router.replace("/Client/DashboardClient") }
          ]);
        }
      } catch (err: any) {
        if (Platform.OS === "web") {
          window.alert(err?.message || "Kon job niet verwijderen");
        } else {
          Alert.alert("Fout", err?.message || "Kon job niet verwijderen");
        }
      } finally {
        setDeleting(false);
      }
    };

    // Confirm deletion
    if (Platform.OS === "web") {
      if (window.confirm("Weet je zeker dat je deze job wilt verwijderen? Dit kan niet ongedaan worden gemaakt.")) {
        doDelete();
      }
    } else {
      Alert.alert(
        "Job verwijderen",
        "Weet je zeker dat je deze job wilt verwijderen? Dit kan niet ongedaan worden gemaakt.",
        [
          { text: "Annuleren", style: "cancel" },
          { text: "Verwijderen", style: "destructive", onPress: doDelete }
        ]
      );
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("nl-BE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format short date
  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("nl-BE", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#176B51" />
        <Text style={styles.loadingText}>Laden...</Text>
      </View>
    );
  }

  if (error || !job) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || "Job niet gevonden"}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Terug</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pendingApplicants = applicants.filter((a) => a.status === "pending");
  const acceptedApplicants = applicants.filter((a) => a.status === "accepted");
  const rejectedApplicants = applicants.filter((a) => a.status === "rejected");

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBack}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Job Info Card */}
        <View style={styles.jobCard}>
          <View style={styles.jobHeader}>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <View
              style={[
                styles.statusBadge,
                job.status === "open"
                  ? styles.statusOpen
                  : job.status === "pending"
                  ? styles.statusPending
                  : styles.statusOther,
              ]}
            >
              <Text style={styles.statusText}>{job.status}</Text>
            </View>
          </View>

          {/* Category */}
          {job.category && (
            <View style={styles.infoRow}>
              <Briefcase size={18} color="#64748B" />
              <Text style={styles.infoText}>
                {job.category.name_nl || job.category.name_en}
              </Text>
            </View>
          )}

          {/* Location */}
          {job.area_text && (
            <View style={styles.infoRow}>
              <MapPin size={18} color="#64748B" />
              <Text style={styles.infoText}>{job.area_text}</Text>
            </View>
          )}

          {/* Date/Time */}
          {job.start_time && (
            <View style={styles.infoRow}>
              <Calendar size={18} color="#64748B" />
              <Text style={styles.infoText}>{formatDate(job.start_time)}</Text>
            </View>
          )}

          {/* Price */}
          <View style={styles.infoRow}>
            <DollarSign size={18} color="#176B51" />
            <Text style={[styles.infoText, styles.priceText]}>
              {job.hourly_or_fixed === "fixed"
                ? `€${job.fixed_price || 0} (vast bedrag)`
                : `€${job.hourly_rate || 0}/uur`}
            </Text>
          </View>

          {/* Description */}
          {job.description && (
            <View style={styles.descriptionSection}>
              <View style={styles.descriptionHeader}>
                <FileText size={18} color="#64748B" />
                <Text style={styles.descriptionTitle}>Beschrijving</Text>
              </View>
              <Text style={styles.descriptionText}>{job.description}</Text>
            </View>
          )}

          {/* Delete Button */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteJob}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Trash2 size={18} color="#fff" />
                <Text style={styles.deleteButtonText}>Job verwijderen</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Applicants Section */}
        <View style={styles.applicantsSection}>
          <View style={styles.sectionHeader}>
            <Users size={20} color="#176B51" />
            <Text style={styles.sectionTitle}>
              Sollicitanten ({applicants.length})
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={[styles.statBadge, styles.statPending]}>
              <Text style={styles.statNumber}>{pendingApplicants.length}</Text>
              <Text style={styles.statLabel}>Wachtend</Text>
            </View>
            <View style={[styles.statBadge, styles.statAccepted]}>
              <Text style={styles.statNumber}>{acceptedApplicants.length}</Text>
              <Text style={styles.statLabel}>Geaccepteerd</Text>
            </View>
            <View style={[styles.statBadge, styles.statRejected]}>
              <Text style={styles.statNumber}>{rejectedApplicants.length}</Text>
              <Text style={styles.statLabel}>Afgewezen</Text>
            </View>
          </View>

          {loadingApplicants && (
            <View style={styles.applicantsLoading}>
              <ActivityIndicator size="small" color="#176B51" />
              <Text style={styles.applicantsLoadingText}>
                Sollicitanten laden...
              </Text>
            </View>
          )}

          {/* Pending Applicants */}
          {pendingApplicants.length > 0 && (
            <View style={styles.applicantGroup}>
              <Text style={styles.groupTitle}>⏳ Wachtend op reactie</Text>
              {pendingApplicants.map((applicant) => (
                <View key={applicant.application_id} style={styles.applicantCard}>
                  {/* Avatar */}
                  <View style={styles.applicantAvatar}>
                    {applicant.student?.avatar_url ? (
                      <Image
                        source={{ uri: applicant.student.avatar_url }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <User size={24} color="#64748B" />
                      </View>
                    )}
                    {applicant.student?.verification_status === "verified" && (
                      <View style={styles.verifiedBadge}>
                        <Shield size={10} color="#fff" />
                      </View>
                    )}
                  </View>

                  {/* Info */}
                  <View style={styles.applicantInfo}>
                    <Text style={styles.applicantEmail}>
                      {applicant.student?.email || "Geen email"}
                    </Text>

                    {applicant.student?.school_name && (
                      <View style={styles.applicantMeta}>
                        <GraduationCap size={12} color="#64748B" />
                        <Text style={styles.applicantMetaText}>
                          {applicant.student.school_name}
                        </Text>
                      </View>
                    )}

                    {applicant.student?.field_of_study && (
                      <Text style={styles.applicantStudy}>
                        {applicant.student.field_of_study}
                        {applicant.student.academic_year
                          ? ` (${applicant.student.academic_year})`
                          : ""}
                      </Text>
                    )}

                    {applicant.student?.phone && (
                      <View style={styles.applicantMeta}>
                        <Phone size={12} color="#64748B" />
                        <Text style={styles.applicantMetaText}>
                          {applicant.student.phone}
                        </Text>
                      </View>
                    )}

                    <Text style={styles.applicantDate}>
                      Solliciteerde: {formatShortDate(applicant.applied_at)}
                    </Text>
                  </View>

                  {/* Actions */}
                  <View style={styles.applicantActions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.acceptBtn]}
                      onPress={() =>
                        handleApplicantAction(
                          applicant.application_id,
                          "accepted"
                        )
                      }
                    >
                      <Check size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.rejectBtn]}
                      onPress={() =>
                        handleApplicantAction(
                          applicant.application_id,
                          "rejected"
                        )
                      }
                    >
                      <XCircle size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Accepted Applicants */}
          {acceptedApplicants.length > 0 && (
            <View style={styles.applicantGroup}>
              <Text style={styles.groupTitle}>✅ Geaccepteerd</Text>
              {acceptedApplicants.map((applicant) => (
                <View
                  key={applicant.application_id}
                  style={[styles.applicantCard, styles.acceptedCard]}
                >
                  <View style={styles.applicantAvatar}>
                    {applicant.student?.avatar_url ? (
                      <Image
                        source={{ uri: applicant.student.avatar_url }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <User size={24} color="#64748B" />
                      </View>
                    )}
                  </View>

                  <View style={styles.applicantInfo}>
                    <Text style={styles.applicantEmail}>
                      {applicant.student?.email || "Geen email"}
                    </Text>
                    {applicant.student?.phone && (
                      <View style={styles.applicantMeta}>
                        <Phone size={12} color="#64748B" />
                        <Text style={styles.applicantMetaText}>
                          {applicant.student.phone}
                        </Text>
                      </View>
                    )}
                    {applicant.student?.school_name && (
                      <Text style={styles.applicantStudy}>
                        {applicant.student.school_name}
                      </Text>
                    )}
                  </View>

                  <View style={styles.acceptedTag}>
                    <Check size={14} color="#10B981" />
                    <Text style={styles.acceptedTagText}>Geaccepteerd</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Rejected Applicants */}
          {rejectedApplicants.length > 0 && (
            <View style={styles.applicantGroup}>
              <Text style={styles.groupTitle}>❌ Afgewezen</Text>
              {rejectedApplicants.map((applicant) => (
                <View
                  key={applicant.application_id}
                  style={[styles.applicantCard, styles.rejectedCard]}
                >
                  <View style={styles.applicantAvatar}>
                    {applicant.student?.avatar_url ? (
                      <Image
                        source={{ uri: applicant.student.avatar_url }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <User size={24} color="#64748B" />
                      </View>
                    )}
                  </View>

                  <View style={styles.applicantInfo}>
                    <Text style={[styles.applicantEmail, { color: "#9CA3AF" }]}>
                      {applicant.student?.email || "Geen email"}
                    </Text>
                  </View>

                  <View style={styles.rejectedTag}>
                    <Text style={styles.rejectedTagText}>Afgewezen</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Empty State */}
          {!loadingApplicants && applicants.length === 0 && (
            <View style={styles.emptyState}>
              <Users size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Nog geen sollicitanten</Text>
              <Text style={styles.emptySubtitle}>
                Wacht tot studenten solliciteren op deze job
              </Text>
            </View>
          )}
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
    paddingBottom: 40,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 16,
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    padding: 20,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#176B51",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
  },

  // Header
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#EFF0F6",
    paddingTop: Platform.OS === "android" ? 48 : 56,
  },
  headerBack: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },

  // Job Card
  jobCard: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOpen: {
    backgroundColor: "#D1FAE5",
  },
  statusPending: {
    backgroundColor: "#FEF3C7",
  },
  statusOther: {
    backgroundColor: "#E5E7EB",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    textTransform: "capitalize",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: "#4B5563",
    flex: 1,
  },
  priceText: {
    fontWeight: "700",
    color: "#176B51",
    fontSize: 16,
  },
  descriptionSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  descriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  descriptionText: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 22,
  },

  // Delete Button
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
    gap: 8,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  // Applicants Section
  applicantsSection: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statBadge: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  statPending: {
    backgroundColor: "#FEF3C7",
  },
  statAccepted: {
    backgroundColor: "#D1FAE5",
  },
  statRejected: {
    backgroundColor: "#FEE2E2",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  statLabel: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },

  // Applicants Loading
  applicantsLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 20,
  },
  applicantsLoadingText: {
    color: "#64748B",
  },

  // Applicant Groups
  applicantGroup: {
    marginBottom: 20,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },

  // Applicant Card
  applicantCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  acceptedCard: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  rejectedCard: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    opacity: 0.7,
  },
  applicantAvatar: {
    position: "relative",
    marginRight: 12,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#10B981",
    borderRadius: 8,
    padding: 2,
    borderWidth: 2,
    borderColor: "#fff",
  },
  applicantInfo: {
    flex: 1,
  },
  applicantEmail: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  applicantMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  applicantMetaText: {
    fontSize: 12,
    color: "#64748B",
  },
  applicantStudy: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 2,
  },
  applicantDate: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
  },

  // Actions
  applicantActions: {
    flexDirection: "column",
    gap: 6,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  acceptBtn: {
    backgroundColor: "#10B981",
  },
  rejectBtn: {
    backgroundColor: "#EF4444",
  },

  // Status Tags
  acceptedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  acceptedTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#10B981",
  },
  rejectedTag: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rejectedTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#EF4444",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
  },
});
