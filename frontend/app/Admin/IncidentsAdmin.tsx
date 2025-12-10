import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, StatusBar, TextInput } from "react-native";
import { Handshake, LogOut } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function AdminIncidentsPage() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Top Navigation Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Handshake size={28} color="#176B51" strokeWidth={2.5} />
          <Text style={styles.headerTitle}>QuickJob</Text>
          <TouchableOpacity style={styles.navLink} onPress={() => router.push("/")}>
            <Text style={styles.navLinkText}>Home</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => router.push("/Login")}>
          <Text style={styles.logoutText}>Log out</Text>
          <LogOut size={18} color="#1a2e4c" />
        </TouchableOpacity>
      </View>

      {/* Sub Header / Tabs */}
      <View style={styles.subHeader}>
        <View style={styles.subHeaderContent}>
          <TouchableOpacity 
            onPress={() => router.push("/Admin/VerificationAdmin")}
            style={styles.subTab}
          >
            <Text style={styles.subTabText}>
              Studenten verificatie
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.subTab, styles.activeSubTab]}
          >
            <Text style={[styles.subTabText, styles.activeSubTabText]}>
              Incidenten
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          
          <Text style={styles.pageTitle}>Incident Management</Text>
          
          {/* Incident Card */}
          <View style={styles.incidentCard}>
            
            {/* Row 1: Client Name */}
            <Text style={styles.incidentLabel}>naam client</Text>

            {/* Row 2: Tags & Student Name */}
            <View style={styles.tagsStudentRow}>
                <View style={styles.tagsWrapper}>
                    <Text style={styles.tagTextPlain}>Poetsen</Text>
                    <View style={styles.tagHighlight}>
                        <Text style={styles.tagTextHighlight}>Poetsen</Text>
                    </View>
                </View>
                <Text style={styles.incidentLabel}>Student naam</Text>
            </View>

            {/* Description Text */}
            <Text style={styles.incidentDesc}>
                Algemene schoonmaak van ons huis. Stofzuigen, dweilen, badkamer en keuken reinigen.
            </Text>

            {/* Info Grid */}
            <View style={styles.infoGrid}>
                <View style={styles.infoCol}>
                    <Text style={styles.infoText}>Anderlecht</Text>
                    <Text style={styles.infoText}>14:00 (3u)</Text>
                </View>
                <View style={styles.infoCol}>
                    <Text style={styles.infoText}>30/11/2025</Text>
                    <Text style={styles.infoText}>€12.5/u</Text>
                </View>
            </View>

            {/* Incident Input */}
            <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Beschrijving incident</Text>
                <TextInput 
                    style={styles.textArea} 
                    multiline 
                    numberOfLines={4}
                    placeholder=""
                    textAlignVertical="top"
                />
            </View>

          </View>

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
    backgroundColor: "#E5E7EB",
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

  // --- INCIDENT STYLES ---
  incidentCard: {
    backgroundColor: "#E5E7EB",
    padding: 24,
    marginBottom: 20,
  },
  incidentLabel: {
    fontSize: 13,
    color: "#1F2937",
    fontWeight: "500",
    marginBottom: 6,
  },
  tagsStudentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 60,
  },
  tagsWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tagTextPlain: {
    fontSize: 13,
    color: "#374151",
  },
  tagHighlight: {
    backgroundColor: "#81E6D9",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 2,
  },
  tagTextHighlight: {
    fontSize: 13,
    color: "#134E4A",
    fontWeight: "500",
  },
  incidentDesc: {
    fontSize: 14,
    color: "#1F2937",
    marginBottom: 24,
    lineHeight: 20,
    maxWidth: "90%",
  },
  infoGrid: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 60,
  },
  infoCol: {
    gap: 12,
  },
  infoText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "400",
  },
  inputSection: {
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: "#fff",
    height: 80,
    borderRadius: 0,
    padding: 12,
    fontSize: 14,
    color: "#000",
  },
});