import { StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Text, View } from "@/components/Themed";
import * as React from "react";

export default function StudentDashboard() {
  const [tab, setTab] = React.useState<'today' | 'upcoming' | 'available' | 'pending' | 'archive'>('today');

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

     

      {/* NAV TABS */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'today' && styles.tabActive]} onPress={() => setTab('today')}>
          <Text style={tab === 'today' ? styles.tabActiveText : styles.tabText}>Today (0)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tab, tab === 'upcoming' && styles.tabActive]} onPress={() => setTab('upcoming')}>
          <Text style={tab === 'upcoming' ? styles.tabActiveText : styles.tabText}>Upcoming (0)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tab, tab === 'available' && styles.tabActive]} onPress={() => setTab('available')}>
          <Text style={tab === 'available' ? styles.tabActiveText : styles.tabText}>Available (0)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tab, tab === 'pending' && styles.tabActive]} onPress={() => setTab('pending')}>
          <Text style={tab === 'pending' ? styles.tabActiveText : styles.tabText}>Pending (0)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tab, tab === 'archive' && styles.tabActive]} onPress={() => setTab('archive')}>
          <Text style={tab === 'archive' ? styles.tabActiveText : styles.tabText}>Archive (0)</Text>
        </TouchableOpacity>
      </View>

      {/* EMPTY STATE */}
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>📄</Text>
        {tab === 'today' && (
          <>
            <Text style={styles.emptyTitle}>No jobs for today</Text>
            <Text style={styles.emptySubtitle}>You have no scheduled jobs for today.</Text>
          </>
        )}

        {tab === 'upcoming' && (
          <>
            <Text style={styles.emptyTitle}>No upcoming jobs</Text>
            <Text style={styles.emptySubtitle}>You have no upcoming jobs scheduled.</Text>
          </>
        )}

        {tab === 'available' && (
          <>
            <Text style={styles.emptyTitle}>No available jobs</Text>
            <Text style={styles.emptySubtitle}>Available jobs will appear here (filters coming later).</Text>
          </>
        )}

        {tab === 'pending' && (
          <>
            <Text style={styles.emptyTitle}>No pending applications</Text>
            <Text style={styles.emptySubtitle}>Applications that are awaiting response will show up here.</Text>
          </>
        )}

        {tab === 'archive' && (
          <>
            <Text style={styles.emptyTitle}>No previous jobs</Text>
            <Text style={styles.emptySubtitle}>Your past jobs will be archived here.</Text>
          </>
        )}
      </View>

    </ScrollView>
  );
}



/* STYLES */
const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 80,
    backgroundColor: "#fff",
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
    borderWidth: 1,
    borderColor: "#E4E6EB",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 18,
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
