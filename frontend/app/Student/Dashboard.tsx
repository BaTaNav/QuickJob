import { StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Text, View } from "@/components/Themed";
import * as React from "react";

export default function StudentDashboard() {
  const [tab, setTab] = React.useState<'available' | 'applications'>('available');

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
      {/* HEADER */}
      <Text style={styles.pageTitle}>Student Dashboard</Text>
      <Text style={styles.pageSubtitle}>Find jobs and start earning</Text>

      {/* DOCUMENT BANNER (hidden by default while testing) */}
      {false && (
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
      )}

      {/* STATS ROW */}
      <View style={styles.statsRow}>
        <StatCard label="Applications" number={0} icon="💼" />
        <StatCard label="Accepted" number={0} icon="✔️" />
        <StatCard label="Pending" number={0} icon="⏳" />
      </View>

      {/* NAV TABS */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'available' && styles.tabActive]}
          onPress={() => setTab('available')}
        >
          <Text style={tab === 'available' ? styles.tabActiveText : styles.tabText}>Available (0)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, tab === 'applications' && styles.tabActive]}
          onPress={() => setTab('applications')}
        >
          <Text style={tab === 'applications' ? styles.tabActiveText : styles.tabText}>My Applications (0)</Text>
        </TouchableOpacity>
      </View>

      {/* EMPTY STATE */}
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>📄</Text>
        {tab === 'available' ? (
          <>
            <Text style={styles.emptyTitle}>No available jobs</Text>
            <Text style={styles.emptySubtitle}>Jobs that match your profile will appear here.</Text>
          </>
        ) : (
          <>
            <Text style={styles.emptyTitle}>No applications yet</Text>
            <Text style={styles.emptySubtitle}>
              You haven't applied to any jobs yet. Your applications will show up here.
            </Text>
          </>
        )}
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
    backgroundColor: "#FAFAFA",
  },

  /* HEADER */
  pageTitle: {
    fontSize: 30,
    fontWeight: "700",
    marginTop: 10,
    color: "#1B1B1B",
  },
  pageSubtitle: {
    fontSize: 16,
    color: "#7A7F85",
    marginBottom: 25,
  },

  /* DOCUMENT VERIFICATION BANNER */
  banner: {
    backgroundColor: "#FFF4D9",
    borderLeftWidth: 4,
    borderLeftColor: "#FFB01F",
    padding: 18,
    borderRadius: 12,
    marginBottom: 28,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
    color: "#664D0E",
  },
  bannerText: {
    fontSize: 14,
    color: "#7C7C7C",
    marginBottom: 16,
    lineHeight: 20,
  },
  bannerBtn: {
    backgroundColor: "#FFB01F",
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
    borderRadius: 8,
  },
  bannerBtnText: {
    color: "#fff",
    fontWeight: "600",
  },

  /* STATS */
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  statCard: {
    backgroundColor: "#fff",
    width: "30%",
    padding: 20,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statNumber: { fontSize: 20, fontWeight: "700", marginBottom: 2 },
  statLabel: { fontSize: 13, color: "#7A7F85" },

  /* TABS */
  tabs: {
    flexDirection: "row",
    marginBottom: 22,
    marginTop: 10,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: "#E9ECEF",
    borderRadius: 10,
    marginRight: 12,
  },
  tabActive: {
    backgroundColor: "#176B51",
  },
  tabText: { color: "#7A7F85", fontWeight: "500" },
  tabActiveText: { color: "#fff", fontWeight: "600" },

  /* EMPTY STATE */
  emptyState: {
    paddingVertical: 90,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 42,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 6,
    color: "#1B1B1B",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#7A7F85",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 260,
  },
});
