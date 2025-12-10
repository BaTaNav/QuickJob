import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, StatusBar, TextInput, Image } from "react-native";
import { Handshake, Search, LogOut, Home, User } from "lucide-react-native";

export default function AdminVerificationPage() {
  const [activeTab, setActiveTab] = useState("verification"); // 'verification' or 'incidents'

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Top Navigation Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Handshake size={28} color="#176B51" strokeWidth={2.5} />
          <Text style={styles.headerTitle}>QuickJob</Text>
<TouchableOpacity 
            onPress={() => setActiveTab("verification")}
            style={[styles.subTab, activeTab === "verification" && styles.activeSubTab]}
          >
            <Text style={[styles.subTabText, activeTab === "verification" && styles.activeSubTabText]}>
              Studenten verificatie
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setActiveTab("incidents")}
            style={[styles.subTab, activeTab === "incidents" && styles.activeSubTab]}
          >
            <Text style={[styles.subTabText, activeTab === "incidents" && styles.activeSubTabText]}>
              Incidenten
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Log out</Text>
          <LogOut size={18} color="#1a2e4c" />
        </TouchableOpacity>
      </View>

    

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          
          <Text style={styles.pageTitle}>Student Verificatie</Text>

          {/* SECTION: TO VERIFY */}
          <Text style={styles.sectionHeader}>Te Verifiëren</Text>
          
          <View style={styles.card}>
            <View style={styles.cardTop}>
              {/* Avatar Placeholder */}
              <View style={styles.avatarContainer}>
                <View style={styles.avatarPlaceholder}>
                    <User size={32} color="#fff" />
                </View>
              </View>

              {/* Details Grid */}
              <View style={styles.detailsGrid}>
                <View style={styles.detailColumn}>
                    <DetailRow label="Naam student" value="dummy data" />
                    <DetailRow label="Email student" value="dummy data" />
                    <DetailRow label="Gemeente" value="dummy data" />
                    <DetailRow label="Datum" value="dummy data" />
                </View>
                <View style={styles.detailColumn}>
                    <DetailRow label="GSM nummer" value="+dummy data" />
                    <DetailRow label="Universiteit" value="dummy data" />
                </View>
              </View>
            </View>

            {/* Documents Box */}
            <View style={styles.docsContainer}>
                <View style={styles.docsHeader}>
                    <Text style={styles.docsHeaderText}>Documenten</Text>
                </View>
                <View style={styles.docsBody}>
                    <DocRow label="Studentenkaart:" status="geupload" />
                    <DocRow label="Identiteitskaart:" status="geupload" />
                    <DocRow label="Verificatiegesprek:" status="te plannen" />
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]}>
                    <Text style={styles.btnText}>Goedkeuren en verifiëren</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]}>
                    <Text style={styles.btnText}>Weigeren</Text>
                </TouchableOpacity>
            </View>
          </View>


          {/* SECTION: VERIFIED STUDENTS */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>Geverifeerde Studenten</Text>
            <View style={styles.searchBar}>
                <Search size={16} color="#64748B" />
                <TextInput 
                    placeholder="zoekbalk" 
                    style={styles.searchInput}
                    placeholderTextColor="#94A3B8"
                />
            </View>
          </View>

          <TouchableOpacity>
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.detailsGrid}>
                <View style={styles.detailColumn}>
                    <DetailRow label="Naam student" value="[dummy data]" />
                    <DetailRow label="Email student" value="[dummy data]" />
                    <DetailRow label="Gemeente" value="[dummy data]" />
                </View>
                <View style={styles.detailColumn}>
                    <DetailRow label="GSM nummer" value="[dummy data]" />
                    <DetailRow label="Universiteit" value="[dummy data]" />
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardFooter}>
                <View style={styles.statsRow}>
                    <Text style={styles.statText}>jobs voltooid: <Text style={styles.statValue}>dummy data</Text></Text>
                    <Text style={styles.statText}>Rating: <Text style={styles.statValue}>dummy data</Text></Text>
                </View>
                <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]}>
                    <Text style={styles.btnText}>Verwijderen</Text>
                </TouchableOpacity>
            </View>
          </View>
          </TouchableOpacity>

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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a2e4c",
    marginRight: 24,
  },
  navLink: {
    paddingHorizontal: 8,
  },
  navLinkText: {
    fontSize: 16,
    color: "#1a2e4c",
    fontWeight: "500",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a2e4c",
  },

  // Sub Header
  subHeader: {
    backgroundColor: "#E5E7EB", // Greyish background as per design
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  subHeaderContent: {
    flexDirection: "row",
    gap: 32,
  },
  subTab: {},
  activeSubTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    paddingBottom: 2,
  },
  subTabText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  activeSubTabText: {
    color: "#000",
    fontWeight: "700",
  },

  // Content
  contentContainer: {
    padding: 24,
  },
  pageTitle: {
    fontSize: 18,
    color: "#374151",
    marginBottom: 24,
    marginTop: 8,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 32,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a2e4c",
    marginBottom: 16,
  },

  // Cards
  card: {
    backgroundColor: "#D1D5DB", // Specific grey background from image
    borderRadius: 8,
    padding: 24,
    marginBottom: 8,
  },
  cardTop: {
    flexDirection: "row",
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 20,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#81E6D9", // Cyan color from image
    alignItems: "center",
    justifyContent: "center",
  },
  detailsGrid: {
    flex: 1,
    flexDirection: "row",
  },
  detailColumn: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: "#4B5563",
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
  },

  // Docs Table
  docsContainer: {
    marginBottom: 24,
    borderRadius: 4,
    overflow: "hidden",
  },
  docsHeader: {
    backgroundColor: "#4B5563", // Dark header
    padding: 8,
    paddingHorizontal: 12,
  },
  docsHeaderText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  docsBody: {
    backgroundColor: "#6B7280", // Slightly lighter dark background
    padding: 12,
  },
  docRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  docLabel: {
    color: "#E5E7EB",
    fontSize: 13,
  },
  docStatus: {
    color: "#F3F4F6",
    fontSize: 13,
  },

  // Actions
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  approveBtn: {
    backgroundColor: "#3DA33D", // Green from image
    flex: 2,
  },
  rejectBtn: {
    backgroundColor: "#DC2626", // Red
    flex: 1,
  },
  deleteBtn: {
    backgroundColor: "#DC2626",
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  // Search
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    paddingHorizontal: 10,
    height: 36,
    width: 150,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: "#000",
    paddingVertical: 0,
  },

  // Verified Card specific
  divider: {
    height: 1,
    backgroundColor: "#9CA3AF",
    marginVertical: 16,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 24,
  },
  statText: {
    fontSize: 14,
    color: "#374151",
  },
  statValue: {
    fontWeight: "600",
    color: "#111827",
  },
});