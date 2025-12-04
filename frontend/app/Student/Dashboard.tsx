import { StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Text, View } from "@/components/Themed";
import React from "react";

export default function StudentDashboard() {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>

      {/* HEADER */}
      <Text style={styles.pageTitle}>Student Dashboard</Text>
      <Text style={styles.pageSubtitle}>Find jobs and start earning</Text>

      {/* DOCUMENT BANNER */}
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Document verification required</Text>
        <Text style={styles.bannerText}>
          You need to upload and verify your documents before you can apply for jobs.
          Please upload your student card, ID card, bank card, and profile photo.
        </Text>

        <TouchableOpacity style={styles.bannerBtn}>
          <Text style={styles.bannerBtnText}>Upload documents</Text>
        </TouchableOpacity>
      </View>

      {/* STATS ROW */}
      <View style={styles.statsRow}>
        <StatCard label="Applications" number={0} icon="💼" />
        <StatCard label="Accepted" number={0} icon="✔️" />
        <StatCard label="Pending" number={0} icon="⏳" />
      </View>

      {/* NAV TABS */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, styles.tabActive]}>
          <Text style={styles.tabActiveText}>Available (0)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>My Applications (0)</Text>
        </TouchableOpacity>
      </View>

      {/* EMPTY STATE */}
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>📄</Text>
        <Text style={styles.emptyTitle}>No available jobs</Text>
        <Text style={styles.emptySubtitle}>
          Jobs that match your profile will appear here.
        </Text>
      </View>

    </ScrollView>
  );
}

/* COMPONENTS */
function StatCard({ number, label, icon }: any) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statNumber}>{number}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 80,
  },

  /* HEADER */
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: 10,
  },
  pageSubtitle: {
    fontSize: 15,
    color: "#6C757D",
    marginBottom: 20,
  },

  /* DOCUMENT VERIFICATION BANNER */
  banner: {
    backgroundColor: "#FFF7E6",
    borderLeftWidth: 4,
    borderLeftColor: "#FFB01F",
    padding: 16,
    borderRadius: 10,
    marginBottom: 25,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  bannerText: {
    fontSize: 14,
    color: "#6C757D",
    marginBottom: 14,
  },
  bannerBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#FFB01F",
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
    borderRadius: 8,
  },
  bannerBtnText: {
    color: "#D48806",
    fontWeight: "600",
  },

  /* STATS */
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  statCard: {
    backgroundColor: "#fff",
    width: "30%",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E4E6EB",
  },
  statIcon: { fontSize: 20, marginBottom: 6 },
  statNumber: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 13, color: "#6C757D", marginTop: 4 },

  /* TABS */
  tabs: {
    flexDirection: "row",
    marginBottom: 20,
    marginTop: 10,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#F1F3F5",
    borderRadius: 8,
    marginRight: 10,
  },
  tabActive: {
    backgroundColor: "#176B51",
  },
  tabText: { color: "#6C757D", fontWeight: "500" },
  tabActiveText: { color: "#fff", fontWeight: "600" },

  /* EMPTY STATE */
  emptyState: {
    paddingVertical: 80,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6C757D",
    textAlign: "center",
    maxWidth: 250,
  },
});
