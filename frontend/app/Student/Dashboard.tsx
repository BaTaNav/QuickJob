import { StyleSheet, TouchableOpacity, ScrollView, Pressable, Text, View, ActivityIndicator, Platform } from "react-native";
import * as React from "react";
import { useRouter } from 'expo-router';
import { RefreshCw, MapPin, Clock, Briefcase } from 'lucide-react-native';
import { jobsAPI } from '../../services/api';
import { SafeAreaView } from "react-native-safe-area-context";

// Helper om te checken of we op web zitten
const isWeb = Platform.OS === 'web';

// Type definitie voor een Job (zodat TypeScript niet klaagt)
interface Job {
  id: number;
  title: string;
  description: string;
  hourly_rate?: number;
  fixed_price?: number;
  location: string;
  duration?: string;
  category?: string;
  start_time?: string;
}

export default function StudentDashboard() {
  const [tab, setTab] = React.useState<'today' | 'upcoming' | 'available' | 'pending' | 'archive'>('available');
  const [availableJobs, setAvailableJobs] = React.useState<Job[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [filterCategory] = React.useState('All'); // setFilterCategory weggehaald als hij niet gebruikt wordt
  const router = useRouter();

  const fetchAvailable = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await jobsAPI.getAvailableJobs('open', 50);
      setAvailableJobs(data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAvailable();
  }, [fetchAvailable]);

  const filteredJobs = availableJobs.filter(job => 
    filterCategory === 'All' || job.category === filterCategory
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFB" }} edges={['top']}>
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={[styles.container, !isWeb && styles.containerMobile]}
      >
        {/* HEADER */}
        <View style={[styles.headerRow, !isWeb && styles.headerRowMobile]}>
          <View>
            <Text style={styles.pageTitle}>Student Dashboard</Text>
            <Text style={styles.pageSubtitle}>Find jobs and start earning</Text>
          </View>
          
          <Pressable onPress={fetchAvailable} style={styles.refreshBtn}>
             <RefreshCw size={20} color="#64748B" />
          </Pressable>
        </View>

        {/* TABS (Horizontaal scrollbaar op mobiel) */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
            {['today', 'upcoming', 'available', 'pending', 'archive'].map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setTab(t as any)}
                style={[styles.tabItem, tab === t && styles.tabItemActive]}
              >
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* CONTENT */}
        {loading ? (
          <ActivityIndicator size="large" color="#176B51" style={{ marginTop: 40 }} />
        ) : (
          <View style={[styles.jobsGrid, !isWeb && styles.jobsListMobile]}>
            {filteredJobs.length === 0 ? (
              <Text style={styles.emptyText}>No jobs found in this category.</Text>
            ) : (
              filteredJobs.map((job: Job) => (
                <TouchableOpacity 
                  key={job.id} 
                  style={[
                    styles.jobCard,
                    /* Web override voor width */
                    isWeb ? { width: '48%' } : styles.jobCardMobile
                  ]}
                  onPress={() => router.push(`/Student/Job/${job.id}`)}
                >
                  <View style={styles.jobHeader}>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <View style={styles.priceBadge}>
                      <Text style={styles.priceText}>€{job.hourly_rate || job.fixed_price}</Text>
                    </View>
                  </View>

                  <View style={styles.jobDetails}>
                    <View style={styles.detailRow}>
                      <MapPin size={14} color="#64748B" />
                      <Text style={styles.detailText}>{job.location}</Text>
                    </View>
                    <View style={styles.detailRow}>
                       <Clock size={14} color="#64748B" />
                       <Text style={styles.detailText}>
                         {job.duration ? `${job.duration} hrs` : 'Flexible'}
                       </Text>
                    </View>
                    {job.category && (
                      <View style={styles.detailRow}>
                        <Briefcase size={14} color="#64748B" />
                        <Text style={styles.detailText}>{job.category}</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.jobDesc} numberOfLines={2}>
                    {job.description}
                  </Text>
                  
                  <View style={styles.cardFooter}>
                    <Text style={styles.postedTime}>
                         {job.start_time ? new Date(job.start_time).toLocaleDateString() : 'Flexible date'}
                    </Text>
                    <Text style={styles.viewLink}>View Details →</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 30, // Web padding
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  // Mobiele override
  containerMobile: {
    padding: 16, // Minder padding op mobiel
    maxWidth: '100%',
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerRowMobile: {
    marginBottom: 16,
  },

  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1B1B1B",
  },
  pageSubtitle: {
    fontSize: 16,
    color: "#7A7F85",
    marginTop: 4,
  },
  refreshBtn: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  /* TABS */
  tabContainer: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabScroll: {
    gap: 24,
    paddingBottom: 2, // Ruimte voor border
  },
  tabItem: {
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#176B51',
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#64748B",
  },
  tabTextActive: {
    color: "#176B51",
    fontWeight: "600",
  },

  /* GRID / LIST */
  jobsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  // Mobiel: Gewoon alles onder elkaar
  jobsListMobile: {
    flexDirection: 'column',
    gap: 16,
  },

  emptyText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 20,
    width: '100%',
    textAlign: 'center',
  },

  /* CARD STYLE */
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    // Web: fallback width (wordt overschreven in JSX voor '48%')
    width: '100%', 
    minWidth: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  // Mobiel: Volledige breedte
  jobCardMobile: {
    width: '100%',
    minWidth: 0,
    padding: 16,
  },

  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    flex: 1,
    marginRight: 10,
  },
  priceBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  priceText: {
    color: '#059669',
    fontWeight: "700",
    fontSize: 14,
  },

  jobDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: "#64748B",
  },

  jobDesc: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
    marginBottom: 16,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  postedTime: {
    fontSize: 12,
    color: "#94A3B8",
  },
  viewLink: {
    fontSize: 14,
    color: "#176B51",
    fontWeight: "600",
  },
});