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
  Alert,
  TextInput,
  Image,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { adminAPI } from "@/services/api";

const isMobile = Platform.OS !== "web";

export default function DashboardAdmin() {
  const router = useRouter();
  const { logout } = useAuth();

  const [activeTab, setActiveTab] = useState<"pending" | "verified">("pending");
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [verifiedStudents, setVerifiedStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewImage, setViewImage] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") {
      document.title = "QuickJob | Admin Dashboard";
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [pending, verified] = await Promise.all([
        adminAPI.getPendingStudents(),
        adminAPI.getVerifiedStudents(),
      ]);
      setPendingStudents(pending || []);
      setVerifiedStudents(verified || []);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVerify = async (id: number, status: "verified" | "rejected") => {
    const action = status === "verified" ? "approve" : "reject";
    const doIt = async () => {
      try {
        setActionLoadingId(id);
        await adminAPI.verifyStudent(id, status);
        // Optimistic update
        setPendingStudents((prev) => prev.filter((s) => s.id !== id));
        if (status === "verified") {
          // Move to verified list
          const student = pendingStudents.find((s) => s.id === id);
          if (student) {
            setVerifiedStudents((prev) => [
              { ...student, verification_status: "verified" },
              ...prev,
            ]);
          }
        }
      } catch (error) {
        console.error("Verification error:", error);
        if (Platform.OS !== "web") Alert.alert("Error", "Action failed");
      } finally {
        setActionLoadingId(null);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Are you sure you want to ${action} this student?`)) {
        doIt();
      }
    } else {
      Alert.alert(
        `${action.charAt(0).toUpperCase() + action.slice(1)} Student?`,
        `Are you sure you want to ${action} this student?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Confirm", onPress: doIt },
        ]
      );
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const filteredVerified = verifiedStudents.filter(
    (s) =>
      (s.first_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.last_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitial = (student: any) =>
    (student.first_name?.[0] || student.email?.[0] || "S").toUpperCase();

  const getFullName = (student: any) => {
    const first = student.first_name || "";
    const last = student.last_name || "";
    return (first + " " + last).trim() || student.email || "Unknown";
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── HEADER ──────────────────────────────────────────── */}
      <View style={[styles.header, isMobile && styles.headerMobile]}>
        <View style={styles.headerLeft}>
          <Text style={styles.logo}>QuickJob</Text>
          {!isMobile && <Text style={styles.headerTitle}>Admin</Text>}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, isMobile && styles.contentMobile]}>
          {/* ── STATS ───────────────────────────────────────── */}
          <Text style={styles.pageTitle}>Dashboard</Text>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { borderLeftColor: "#F59E0B" }]}>
              <Text style={[styles.statNumber, { color: "#F59E0B" }]}>
                {pendingStudents.length}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: "#176B51" }]}>
              <Text style={[styles.statNumber, { color: "#176B51" }]}>
                {verifiedStudents.length}
              </Text>
              <Text style={styles.statLabel}>Verified</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: "#3B82F6" }]}>
              <Text style={[styles.statNumber, { color: "#3B82F6" }]}>
                {pendingStudents.length + verifiedStudents.length}
              </Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>

          {/* ── TABS ────────────────────────────────────────── */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "pending" && styles.tabActive]}
              onPress={() => setActiveTab("pending")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "pending" && styles.tabTextActive,
                ]}
              >
                Pending ({pendingStudents.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "verified" && styles.tabActive]}
              onPress={() => setActiveTab("verified")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "verified" && styles.tabTextActive,
                ]}
              >
                Verified ({verifiedStudents.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── LOADING ─────────────────────────────────────── */}
          {loading ? (
            <ActivityIndicator
              size="large"
              color="#176B51"
              style={{ marginVertical: 60 }}
            />
          ) : (
            <>
              {/* ── PENDING TAB ─────────────────────────────── */}
              {activeTab === "pending" && (
                <>
                  {pendingStudents.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyIcon}>✓</Text>
                      <Text style={styles.emptyTitle}>All caught up!</Text>
                      <Text style={styles.emptyText}>
                        No students waiting for verification.
                      </Text>
                    </View>
                  ) : (
                    pendingStudents.map((student) => (
                      <View key={student.id} style={styles.card}>
                        <View style={styles.cardHeader}>
                          {student.avatar_url ? (
                            <TouchableOpacity onPress={() => setViewImage(student.avatar_url)}>
                              <Image source={{ uri: student.avatar_url }} style={styles.avatarImage} />
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.avatar}>
                              <Text style={styles.avatarText}>
                                {getInitial(student)}
                              </Text>
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={styles.studentName}>
                              {getFullName(student)}
                            </Text>
                            <Text style={styles.studentEmail}>
                              {student.email || "No email"}
                            </Text>
                          </View>
                          <View style={styles.pendingBadge}>
                            <Text style={styles.pendingBadgeText}>Pending</Text>
                          </View>
                        </View>

                        {/* Details */}
                        <View style={styles.detailGrid}>
                          <DetailItem label="Phone" value={student.phone || "—"} />
                          <DetailItem label="School" value={student.school_name || "—"} />
                          <DetailItem label="Field" value={student.field_of_study || "—"} />
                          <DetailItem label="Year" value={student.academic_year || "—"} />
                          <DetailItem label="DOB" value={student.date_of_birth || "—"} />
                          <DetailItem label="IBAN" value={student.iban || "—"} />
                          <DetailItem
                            label="Registered"
                            value={student.created_at ? new Date(student.created_at).toLocaleDateString() : "—"}
                          />
                        </View>

                        {/* Student Card Images */}
                        {(student.student_card_front || student.student_card_back) && (
                          <View style={styles.docsSection}>
                            <Text style={styles.docsSectionTitle}>Student Card</Text>
                            <View style={styles.docsRow}>
                              {student.student_card_front && (
                                <TouchableOpacity onPress={() => setViewImage(student.student_card_front)}>
                                  <Image source={{ uri: student.student_card_front }} style={styles.docThumb} />
                                  <Text style={styles.docLabel}>Front</Text>
                                </TouchableOpacity>
                              )}
                              {student.student_card_back && (
                                <TouchableOpacity onPress={() => setViewImage(student.student_card_back)}>
                                  <Image source={{ uri: student.student_card_back }} style={styles.docThumb} />
                                  <Text style={styles.docLabel}>Back</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        )}

                        {/* Actions */}
                        <View style={styles.actionRow}>
                          <TouchableOpacity
                            style={styles.rejectBtn}
                            onPress={() => handleVerify(student.id, "rejected")}
                            disabled={actionLoadingId === student.id}
                          >
                            {actionLoadingId === student.id ? (
                              <ActivityIndicator size="small" color="#DC2626" />
                            ) : (
                              <Text style={styles.rejectBtnText}>Reject</Text>
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.approveBtn}
                            onPress={() => handleVerify(student.id, "verified")}
                            disabled={actionLoadingId === student.id}
                          >
                            {actionLoadingId === student.id ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Text style={styles.approveBtnText}>Approve</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </>
              )}

              {/* ── VERIFIED TAB ────────────────────────────── */}
              {activeTab === "verified" && (
                <>
                  {/* Search */}
                  <View style={styles.searchContainer}>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search students..."
                      placeholderTextColor="#9CA3AF"
                      value={searchTerm}
                      onChangeText={setSearchTerm}
                    />
                  </View>

                  {filteredVerified.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyTitle}>No students found</Text>
                      <Text style={styles.emptyText}>
                        {searchTerm
                          ? "Try a different search term."
                          : "No verified students yet."}
                      </Text>
                    </View>
                  ) : (
                    filteredVerified.map((student) => (
                      <View key={student.id} style={styles.cardSmall}>
                        <View style={styles.cardHeader}>
                          <View style={[styles.avatar, { backgroundColor: "#D1FAE5" }]}>
                            <Text style={[styles.avatarText, { color: "#065F46" }]}>
                              {getInitial(student)}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.studentName}>
                              {getFullName(student)}
                            </Text>
                            <Text style={styles.studentEmail}>
                              {student.email || "No email"}
                            </Text>
                          </View>
                          <View style={styles.verifiedBadge}>
                            <Text style={styles.verifiedBadgeText}>
                              Verified
                            </Text>
                          </View>
                        </View>

                        <View style={styles.detailRow}>
                          {student.school_name && (
                            <Text style={styles.detailChip}>
                              {student.school_name}
                            </Text>
                          )}
                          {student.field_of_study && (
                            <Text style={styles.detailChip}>
                              {student.field_of_study}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))
                  )}
                </>
              )}
            </>
          )}

          {/* Refresh button */}
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchData}>
            <Text style={styles.refreshBtnText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Image Viewer Modal */}
      <Modal visible={!!viewImage} transparent animationType="fade" onRequestClose={() => setViewImage(null)}>
        <TouchableOpacity
          style={styles.imageModalOverlay}
          activeOpacity={1}
          onPress={() => setViewImage(null)}
        >
          <View style={styles.imageModalContent}>
            {viewImage && (
              <Image source={{ uri: viewImage }} style={styles.imageModalImage} resizeMode="contain" />
            )}
            <TouchableOpacity style={styles.imageModalClose} onPress={() => setViewImage(null)}>
              <Text style={styles.imageModalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ── Helper Component ─────────────────────────────────────────
function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  scrollContent: {
    paddingBottom: 60,
  },

  // Header
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingTop: isMobile ? 52 : 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E1E7EB",
  },
  headerMobile: {
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    fontSize: 22,
    fontWeight: "800",
    color: "#176B51",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5D6B73",
    marginLeft: 4,
  },
  logoutBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E1E7EB",
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#DC2626",
  },

  // Content
  content: {
    padding: 24,
    maxWidth: 800,
    width: "100%",
    alignSelf: "center",
  },
  contentMobile: {
    padding: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#041316",
    marginBottom: 20,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  statCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5D6B73",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Tabs
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E1E7EB",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#176B51",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5D6B73",
  },
  tabTextActive: {
    color: "#fff",
  },

  // Cards
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E1E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardSmall: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E1E7EB",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#176B51",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  studentName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#041316",
  },
  studentEmail: {
    fontSize: 13,
    color: "#5D6B73",
    marginTop: 1,
  },

  // Badges
  pendingBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#92400E",
  },
  verifiedBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  verifiedBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#065F46",
  },

  // Details
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  detailItem: {
    minWidth: "45%",
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    color: "#041316",
    fontWeight: "500",
    marginTop: 1,
  },
  detailRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  detailChip: {
    fontSize: 12,
    color: "#5D6B73",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },

  // Actions
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#DC2626",
  },
  rejectBtnText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 14,
  },
  approveBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#176B51",
  },
  approveBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E1E7EB",
    borderStyle: "dashed",
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
    color: "#176B51",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#041316",
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: "#5D6B73",
  },

  // Search
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E1E7EB",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#041316",
  },

  // Avatar image (profile photo)
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },

  // Documents section
  docsSection: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  docsSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  docsRow: {
    flexDirection: "row",
    gap: 16,
  },
  docThumb: {
    width: 100,
    height: 70,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E1E7EB",
  },
  docLabel: {
    fontSize: 11,
    color: "#5D6B73",
    textAlign: "center",
    marginTop: 4,
    fontWeight: "600",
  },

  // Image viewer modal
  imageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalContent: {
    width: "90%",
    maxWidth: 600,
    alignItems: "center",
  },
  imageModalImage: {
    width: "100%",
    height: 400,
    borderRadius: 12,
  },
  imageModalClose: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 32,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  imageModalCloseText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#041316",
  },

  // Refresh
  refreshBtn: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#176B51",
    alignItems: "center",
  },
  refreshBtnText: {
    color: "#176B51",
    fontWeight: "600",
    fontSize: 15,
  },
});
