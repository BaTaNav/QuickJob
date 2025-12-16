import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, StatusBar } from "react-native";
import { useRouter } from 'expo-router';
import { RefreshCw, Plus, ArrowDown, Handshake, User, Instagram, Linkedin, Facebook, Twitter } from "lucide-react-native";

export default function DashboardClient() {
  const [activeTab, setActiveTab] = useState("Open");

  const stats = [
    { label: "Open jobs", value: 0 },
    { label: "Planned", value: 0 },
    { label: "Completed", value: 0 },
    { label: "Today", value: 0 },
  ];

  const tabs = ["Open", "Today", "Planned", "Completed"];

    // Force Browser Tab Title on Web
    useEffect(() => {
      if (Platform.OS === 'web') {
        document.title = "QuickJob | Dashboard-Client";
      }
    }, []);

    const router = useRouter();

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
          <TouchableOpacity style={styles.iconButton} onPress={() => {
            // Placeholder refresh action
            console.log('Refresh client dashboard');
          }}>
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
          <TouchableOpacity style={styles.createJobBtn}>
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
                  {tab} (0)
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Empty State */}
          <View style={styles.emptyWrapper}>
            <View style={styles.emptyIcon}>
              <ArrowDown size={24} color="#176B51" />
            </View>
            <Text style={styles.emptyTitle}>No open jobs</Text>
            <Text style={styles.emptySubtitle}>
              Post your first job to get started
            </Text>
            <TouchableOpacity style={styles.emptyButton}>
              <Text style={styles.emptyButtonText}>+ Post job</Text>
            </TouchableOpacity>
          </View>

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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a2e4c",
  },
  iconButton: {
    padding: 8,
    backgroundColor: "#F7F9FC",
    borderRadius: 999,
  },

  // Content
  contentContainer: {
    padding: 24,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a2e4c",
    marginBottom: 16,
  },

  // Stats
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1, // Allows cards to scale with width
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    // Shadow equivalent
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#176B51", // QuickJob Green
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Actions
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
  createJobText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },

  // Tabs
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

  // Empty State
  emptyWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
  },
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