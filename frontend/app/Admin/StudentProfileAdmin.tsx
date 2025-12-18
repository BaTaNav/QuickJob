import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, StatusBar } from "react-native";
import { Handshake, LogOut } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function AdminStudentProfile() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("verification");

    // Force Browser Tab Title on Web
    useEffect(() => {
      if (Platform.OS === 'web') {
        document.title = "QuickJob | StudentProfile-Admin";
      }
    }, []);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Top Navigation Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Handshake size={28} color="#176B51" strokeWidth={2.5} />
          <Text style={styles.headerTitle}>QuickJob</Text>
          
          <TouchableOpacity 
            onPress={() => router.push("/Admin/DashboardAdmin")}
            style={styles.navTab}
          >
            <Text style={[styles.navTabText, activeTab === "home" && styles.activeNavTabText]}>
              Home
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => router.push("/Admin/VerificationAdmin")}
            style={styles.navTab}
          >
            <Text style={[styles.navTabText, activeTab === "verification" && styles.activeNavTabText]}>
              Studenten verificatie
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push("/Admin/IncidentsAdmin")}
            style={styles.navTab}
          >
            <Text style={[styles.navTabText, activeTab === "incidents" && styles.activeNavTabText]}>
              Incidenten
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => router.push("/Login")}>
          <Text style={styles.logoutText}>Log out</Text>
          <LogOut size={18} color="#1a2e4c" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileTopRow}>
              {/* Avatar */}
              <View style={styles.avatarContainer}>
                <View style={styles.avatarPlaceholder}>
                   {/* Empty cyan circle as per design */}
                </View>
              </View>

              {/* Info Columns */}
              <View style={styles.infoGrid}>
                <View style={styles.infoColumn}>
                  <DetailItem label="Naam student" value="" />
                  <DetailItem label="email student" value="" />
                  <DetailItem label="gemeente student" value="" />
                  <DetailItem label="registratie datum" value="" />
                </View>
                <View style={styles.infoColumn}>
                  <DetailItem label="gsm nummer" value="" />
                  <DetailItem label="universiteit/hogeschool" value="" />
                </View>
              </View>
            </View>

            {/* Documents Table */}
            <View style={styles.docsContainer}>
              <View style={styles.docsHeader}>
                <Text style={styles.docsTitle}>Documenten</Text>
              </View>
              <View style={styles.docsBody}>
                <DocRow label="Studentenkaart:" value="geupload" />
                <DocRow label="Identiteitskaart:" value="geupload" />
                <DocRow label="Verificatie datum" value="datum van verificatie" />
              </View>
            </View>

            {/* Separator Line */}
            <View style={styles.divider} />

            {/* Footer Stats & Action */}
            <View style={styles.cardFooter}>
              <View style={styles.statsContainer}>
                <Text style={styles.statLabel}>jobs voltooid: <Text style={styles.statValue}></Text></Text>
                <Text style={styles.statLabel}>Rating: <Text style={styles.statValue}></Text></Text>
              </View>
              <TouchableOpacity style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>verwijderen</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Completed Jobs Section */}
          <Text style={styles.sectionTitle}>Voltooide jobs</Text>
          
          <JobCard 
            title="Poetsen" 
            tag="Poetsen" 
            desc="Algemene schoonmaak van ons huis. Stofzuigen, dweilen, badkamer en keuken reinigen."
            location="Beersel"
            date="30/11/2025"
            time="14:00 (3u)"
            price="€12.5/u"
            tagColor="#81E6D9"
          />

          <JobCard 
            title="Tuin opruimen" 
            tag="Tuinwerk" 
            desc="Bladeren harken, onkruid wieden en heggen bijknippen."
            location="Brussel"
            date="04/12/2025"
            time="11:00 (2u)"
            price="€14/u"
            tagColor="#81E6D9"
          />

        </View>
      </ScrollView>
    </View>
  );
}

function DetailItem({ label, value }: { label: string, value: string }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function DocRow({ label, value }: { label: string, value: string }) {
  return (
    <View style={styles.docRow}>
      <Text style={styles.docLabel}>{label}</Text>
      <Text style={styles.docValue}>{value}</Text>
    </View>
  );
}

function JobCard({ title, tag, desc, location, date, time, price, tagColor }: any) {
  return (
    <View style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle}>{title}</Text>
        <View style={[styles.tagBadge, { backgroundColor: tagColor }]}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      </View>
      
      <Text style={styles.jobDesc}>{desc}</Text>
      
      <View style={styles.jobMetaGrid}>
        <View style={styles.metaCol}>
          <Text style={styles.metaText}>{location}</Text>
          <Text style={styles.metaText}>{time}</Text>
        </View>
        <View style={styles.metaCol}>
          <Text style={styles.metaText}>{date}</Text>
          <Text style={styles.metaText}>{price}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  
  // Header
  header: {
    backgroundColor: "#ffffffff",
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === 'android' ? 48 : 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a2e4c",
    marginRight: 24,
  },
  navTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  navTabText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "400",
  },
  activeNavTabText: {
    fontWeight: "700",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    color: "#000",
  },

  container: {
    padding: 24,
    paddingTop: 32,
  },

  // Profile Card
  profileCard: {
    backgroundColor: "#D9D9D9", // Light Grey Card
    padding: 24,
    marginBottom: 40,
  },
  profileTopRow: {
    flexDirection: "row",
    marginBottom: 24,
  },
  avatarContainer: {
    marginRight: 24,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#81E6D9", // Cyan
  },
  infoGrid: {
    flex: 1,
    flexDirection: "row",
  },
  infoColumn: {
    flex: 1,
    gap: 12,
  },
  detailItem: {},
  detailLabel: {
    fontSize: 13,
    color: "#000",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    color: "#000",
    height: 16, 
  },

  // Docs Table
  docsContainer: {
    marginTop: 8,
    maxWidth: 400,
  },
  docsHeader: {
    backgroundColor: "#525252",
    padding: 8,
    paddingHorizontal: 12,
  },
  docsTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  docsBody: {
    backgroundColor: "#636363",
    padding: 12,
  },
  docRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  docLabel: {
    color: "#fff",
    fontSize: 13,
  },
  docValue: {
    color: "#fff",
    fontSize: 13,
  },

  divider: {
    height: 1,
    backgroundColor: "#737373",
    marginTop: 24,
    marginBottom: 16,
  },
  
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 32,
  },
  statLabel: {
    fontSize: 14,
    color: "#000",
  },
  statValue: {
    fontWeight: "600",
  },
  deleteBtn: {
    backgroundColor: "#DC2626", // Red
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 2,
  },
  deleteBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },

  // Jobs Section
  sectionTitle: {
    fontSize: 20,
    fontWeight: "400",
    color: "#000",
    marginBottom: 16,
  },
  jobCard: {
    backgroundColor: "#D9D9D9",
    padding: 20,
    marginBottom: 16,
    borderRadius: 0,
  },
  jobHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 13,
    color: "#000",
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 2,
  },
  tagText: {
    fontSize: 12,
    color: "#000",
    fontWeight: "500",
  },
  jobDesc: {
    fontSize: 13,
    color: "#000",
    marginBottom: 20,
    lineHeight: 18,
    maxWidth: "90%",
  },
  jobMetaGrid: {
    flexDirection: "row",
    gap: 60,
  },
  metaCol: {
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#000",
  },
});