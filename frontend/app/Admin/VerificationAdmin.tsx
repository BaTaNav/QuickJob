import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, StatusBar, TextInput, ActivityIndicator, Alert } from "react-native";
import { Handshake, Search, LogOut, Check, X, ShieldAlert } from "lucide-react-native";
import { useRouter } from "expo-router";
import { adminAPI } from "@/services/api"; 

const isMobile = Platform.OS !== 'web';

export default function AdminVerificationPage() {
    const router = useRouter();
    const [pendingStudents, setPendingStudents] = useState<any[]>([]);
    const [verifiedStudents, setVerifiedStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
      if (Platform.OS === 'web') {
        document.title = "QuickJob | Verification-Admin";
      }
    }, []);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [pending, verified] = await Promise.all([
                adminAPI.getPendingStudents(),
                adminAPI.getVerifiedStudents()
            ]);
            setPendingStudents(pending);
            setVerifiedStudents(verified);
        } catch (error) {
            console.error("Error fetching verification data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleVerify = async (id: number, status: 'verified' | 'rejected') => {
        try {
            await adminAPI.verifyStudent(id, status);
            // Update local state direct voor snelle UI feedback
            setPendingStudents(prev => prev.filter(s => s.id !== id));
            fetchData(); // Refresh lists to be sure
            if (Platform.OS !== 'web') Alert.alert("Succes", `Student ${status === 'verified' ? 'goedgekeurd' : 'geweigerd'}`);
        } catch (error) {
            console.error("Verification error:", error);
            if (Platform.OS !== 'web') Alert.alert("Error", "Actie mislukt");
        }
    };

    const filteredVerified = verifiedStudents.filter(s => 
        (s.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (s.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* HEADER */}
      <View style={[styles.header, isMobile && styles.headerMobile]}>
            <View style={styles.headerLeft}>
                <Handshake size={28} color="#176B51" strokeWidth={2.5} />
                {!isMobile && <Text style={styles.headerTitle}>QuickJob Admin</Text>}
            </View>
            <View style={[styles.navContainer, isMobile && styles.navContainerMobile]}>
                <TouchableOpacity onPress={() => router.push("/Admin/DashboardAdmin")} style={styles.navTab}>
                    <Text style={styles.navTabText}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push("/Admin/VerificationAdmin")} style={[styles.navTab, styles.activeNavTab]}>
                    <Text style={[styles.navTabText, styles.activeNavTabText]}>Verificatie</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push("/Admin/IncidentsAdmin")} style={styles.navTab}>
                    <Text style={styles.navTabText}>Incidenten</Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={() => router.push("/Login")}>
               {!isMobile && <Text style={styles.logoutText}>Log out</Text>}
               <LogOut size={isMobile ? 24 : 18} color={isMobile ? "#ef4444" : "#1a2e4c"} />
             </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.contentContainer, isMobile && styles.contentContainerMobile]}>

          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
             <Text style={styles.pageTitle}>Student Verificatie</Text>
             <TouchableOpacity onPress={fetchData} style={{padding: 8, backgroundColor: '#fff', borderRadius: 8}}>
                 <Text style={{color: '#176B51', fontWeight: '600'}}>Refresh</Text>
             </TouchableOpacity>
          </View>
          

          {/* SECTION: TO VERIFY */}
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16}}>
            <ShieldAlert size={20} color="#F59E0B" />
            <Text style={styles.sectionHeader}>Te Verifiëren ({pendingStudents.length})</Text>
          </View>

          {loading ? (
              <ActivityIndicator size="large" color="#176B51" style={{marginVertical: 40}} />
          ) : pendingStudents.length === 0 ? (
              <View style={styles.emptyState}>
                  <Text style={{color: '#64748B'}}>Geen openstaande verificaties 🎉</Text>
              </View>
          ) : (
              pendingStudents.map((student) => (
                <View key={student.id} style={styles.card}>
                    <View style={[styles.cardTop, isMobile && {flexDirection: 'column', alignItems: 'flex-start'}]}>
                    {/* Avatar Placeholder */}
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarPlaceholder}>
                             <Text style={{color: '#fff', fontSize: 18, fontWeight: '700'}}>
                                 {(student.first_name?.[0] || 'S').toUpperCase()}
                             </Text>
                        </View>
                    </View>

                    {/* Details Grid */}
                    <View style={styles.detailsGrid}>
                        <View style={styles.detailColumn}>
                        <DetailRow label="Naam" value={`${student.first_name || ''} ${student.last_name || ''}`} />
                        <DetailRow label="Email" value={student.email || 'N/A'} />
                        <DetailRow label="Gemeente" value={`${student.postal_code || ''} ${student.city || ''}`} />
                        </View>
                        <View style={styles.detailColumn}>
                        <DetailRow label="GSM" value={student.phone || 'N/A'} />
                        <DetailRow label="School" value={student.school_name || 'N/A'} />
                        <DetailRow label="Sinds" value={student.created_at ? new Date(student.created_at).toLocaleDateString() : 'N/A'} />
                        </View>
                    </View>
                    </View>  

                    {/* Simpele Documenten Check (Mockup voor nu) */}
                    <View style={styles.docsContainer}>
                        <View style={styles.docsHeader}>
                             <Text style={styles.docsHeaderText}>Status</Text>
                        </View>
                        <View style={styles.docsBody}>
                            <DocRow label="Registratie voltooid:" status="✅ Ja" />
                            <DocRow label="Verificatie nodig:" status="⚠️ Pending" />
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleVerify(student.id, 'verified')}>
                            <Check size={18} color="#fff" />
                            <Text style={styles.btnText}>Goedkeuren</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleVerify(student.id, 'rejected')}>
                            <X size={18} color="#fff" />
                            <Text style={styles.btnText}>Weigeren</Text>
                        </TouchableOpacity>
                    </View>
                </View>
              ))
          )}

          {/* SECTION: VERIFIED STUDENTS */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>Geverifieerde Studenten</Text>
            <View style={styles.searchBar}>
              <Search size={16} color="#64748B" />
              <TextInput
                placeholder="Zoek student..."
                style={styles.searchInput}
                placeholderTextColor="#94A3B8"
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            </View>
          </View>

          {filteredVerified.map((student) => (
             <TouchableOpacity 
                key={student.id}
                onPress={() => router.push({ pathname: "/Admin/StudentProfileAdmin", params: { id: student.id } })}
                activeOpacity={0.7}
             >
                <View style={styles.card}>
                <View style={[styles.cardTop, { marginBottom: 0 }]}>
                    <View style={styles.detailsGrid}>
                    <View style={styles.detailColumn}>
                        <DetailRow label="Naam" value={`${student.first_name || ''} ${student.last_name || ''}`} />
                        <DetailRow label="Email" value={student.email || 'N/A'} />
                    </View>
                    <View style={styles.detailColumn}>
                        <DetailRow label="School" value={student.school_name || 'N/A'} />
                        <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
                            <Check size={14} color="green" />
                            <Text style={{color: 'green', fontWeight: '600', marginLeft: 4, fontSize: 13}}>VERIFIED</Text>
                        </View>
                    </View>
                    </View>
                </View>
                </View>
            </TouchableOpacity>
          ))}
          
          {filteredVerified.length === 0 && !loading && (
               <Text style={{textAlign: 'center', color: '#9CA3AF', marginTop: 20}}>Geen studenten gevonden.</Text>
          )}

        </View>
      </ScrollView>
    </View>
  );
}

// Helper Components
function DetailRow({ label, value }: { label: string, value: string }) {
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function DocRow({ label, status }: { label: string, status: string }) {
  return (
    <View style={styles.docRow}>
      <Text style={styles.docLabel}>{label}</Text>
      <Text style={styles.docStatus}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  emptyState: {
      padding: 30,
      backgroundColor: '#fff', 
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderStyle: 'dashed',
      marginBottom: 30
  },

  // Header
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#EFF0F6",
    paddingTop: Platform.OS === 'android' ? 48 : 16,
  },
  headerMobile: {
      flexDirection: 'column',
      gap: 16,
      alignItems: 'stretch',
      paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    justifyContent: isMobile ? 'center' : 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a2e4c",
  },
  navContainer: {
      flexDirection: 'row',
      gap: 8,
      backgroundColor: '#F1F5F9',
      padding: 4,
      borderRadius: 8,
      alignSelf: isMobile ? 'stretch' : 'auto',
  },
  navContainerMobile: {
      justifyContent: 'space-between',
  },
  navTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeNavTab: {
      backgroundColor: '#fff',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
  },
  navTabText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
    textAlign: 'center',
  },
  activeNavTabText: {
    color: "#176B51",
    fontWeight: "700",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    position: isMobile ? 'absolute' : 'relative',
    top: isMobile ? 20 : 0,
    right: isMobile ? 16 : 0,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a2e4c",
  },

  // Content
  contentContainer: {
    padding: 24,
    maxWidth: 1000,
    width: '100%',
    alignSelf: 'center',
  },
  contentContainerMobile: {
      padding: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: "#1a2e4c",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 32,
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a2e4c",
  },

  // Cards
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 24,
  },
  avatarContainer: {
    flexShrink: 0,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    backgroundColor: "#176B51",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  detailsGrid: {
    flex: 1,
    flexDirection: "row",
    gap: 32,
    flexWrap: 'wrap',
  },
  detailColumn: {
    flex: 1,
    minWidth: 200,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    color: "#1a2e4c",
    fontWeight: "500",
  },

  // Docs
  docsContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  docsHeader: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 8,
  },
  docsHeaderText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a2e4c",
  },
  docsBody: {
    gap: 8,
  },
  docRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  docLabel: {
    fontSize: 14,
    color: "#64748B",
  },
  docStatus: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },

  // Actions
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: 'row',
    gap: 8,
  },
  approveBtn: {
    backgroundColor: "#176B51",
  },
  rejectBtn: {
    backgroundColor: "#DC2626",
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  
  // Search
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 250,
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
    color: "#1a2e4c",
    outlineStyle: 'none',
  } as any,
});