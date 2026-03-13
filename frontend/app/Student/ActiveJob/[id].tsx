import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { jobsAPI } from '@/services/api';
import SignatureCanvas from '@/components/SignatureCanvas';

// ── Types ────────────────────────────────────────────────────
type Phase = 'loading' | 'waiting' | 'ready' | 'working' | 'signing' | 'completed' | 'error';

interface JobData {
  id: number;
  title: string;
  description?: string;
  street?: string;
  house_number?: string;
  postal_code?: string;
  city?: string;
  start_time: string;
  status: string;
  hourly_or_fixed: string;
  hourly_rate?: number;
  fixed_price?: number;
  category?: { name_nl?: string; name_en?: string };
}

interface ApplicationData {
  id: number;
  status: string;
  actual_start_time?: string | null;
  actual_end_time?: string | null;
  client_signature?: string | null;
}

// ── Helpers ──────────────────────────────────────────────────
function formatTimer(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return 'Now';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

function formatAddress(job: JobData): string {
  const parts = [job.street, job.house_number].filter(Boolean).join(' ');
  const cityParts = [job.postal_code, job.city].filter(Boolean).join(' ');
  return [parts, cityParts].filter(Boolean).join(', ') || 'No address';
}

function formatDate(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleDateString('nl-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatBudget(job: JobData): string {
  if (job.hourly_or_fixed === 'hourly' && job.hourly_rate) {
    return `€${job.hourly_rate}/h`;
  }
  if (job.fixed_price) {
    return `€${job.fixed_price} fixed`;
  }
  return 'TBD';
}

// ── Component ────────────────────────────────────────────────
export default function ActiveJobPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [phase, setPhase] = useState<Phase>('loading');
  const [job, setJob] = useState<JobData | null>(null);
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timeUntilStart, setTimeUntilStart] = useState(0);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [completionDuration, setCompletionDuration] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const jobId = parseInt(id || '0', 10);
  const studentId = user?.id;

  // ── Load work session ──────────────────────────────────────
  const loadSession = useCallback(async () => {
    if (!jobId || !studentId) return;
    try {
      const data = await jobsAPI.getWorkSession(jobId, studentId);
      setJob(data.job);
      setApplication(data.application);

      // Determine phase
      if (data.application.actual_end_time) {
        // Already completed
        const startMs = new Date(data.application.actual_start_time!).getTime();
        const endMs = new Date(data.application.actual_end_time).getTime();
        setCompletionDuration(Math.round((endMs - startMs) / 1000));
        setPhase('completed');
      } else if (data.application.actual_start_time) {
        // In progress — resume timer
        const startMs = new Date(data.application.actual_start_time).getTime();
        const nowMs = Date.now();
        setElapsedSeconds(Math.floor((nowMs - startMs) / 1000));
        setPhase('working');
      } else {
        // Not started yet — check countdown
        const startTime = new Date(data.job.start_time).getTime();
        const nowMs = Date.now();
        const secsUntil = Math.floor((startTime - nowMs) / 1000);
        setTimeUntilStart(secsUntil);
        setPhase(secsUntil <= 1800 ? 'ready' : 'waiting');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load job');
      setPhase('error');
    }
  }, [jobId, studentId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // ── Countdown interval (for waiting phase) ─────────────────
  useEffect(() => {
    if (phase === 'waiting' || phase === 'ready') {
      countdownRef.current = setInterval(() => {
        setTimeUntilStart((prev) => {
          const next = prev - 1;
          if (next <= 1800 && phase === 'waiting') {
            setPhase('ready');
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [phase]);

  // ── Timer interval (for working phase) ─────────────────────
  useEffect(() => {
    if (phase === 'working') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // ── Start work ─────────────────────────────────────────────
  const handleStart = async () => {
    if (!jobId || !studentId) return;
    try {
      setActionLoading(true);
      const result = await jobsAPI.startWork(jobId, studentId);
      setApplication((prev) =>
        prev ? { ...prev, actual_start_time: result.application.actual_start_time } : prev
      );
      setElapsedSeconds(0);
      setPhase('working');
    } catch (err: any) {
      const msg = err.message || 'Failed to start work';
      if (Platform.OS === 'web') {
        setError(msg);
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // ── Stop work (confirmation) ───────────────────────────────
  const handleStop = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Are you sure you want to stop working? The client will need to sign to confirm.'
      );
      if (confirmed) setShowSignature(true);
    } else {
      Alert.alert(
        'Stop Work?',
        'Are you sure you want to stop working? The client will need to sign to confirm.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Stop Work', style: 'destructive', onPress: () => setShowSignature(true) },
        ]
      );
    }
  };

  // ── Submit signature ───────────────────────────────────────
  const handleSignatureSave = async (signature: string) => {
    if (!jobId || !studentId) return;
    try {
      setActionLoading(true);
      setShowSignature(false);
      const result = await jobsAPI.stopWork(jobId, studentId, signature);
      setCompletionDuration(result.application.work_duration_minutes * 60);
      setApplication((prev) =>
        prev
          ? {
              ...prev,
              actual_end_time: result.application.actual_end_time,
              status: 'completed',
            }
          : prev
      );
      setPhase('completed');
    } catch (err: any) {
      const msg = err.message || 'Failed to complete job';
      if (Platform.OS === 'web') {
        setError(msg);
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // ── Render helpers ─────────────────────────────────────────
  const renderStatusBadge = () => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      waiting: { bg: '#FEF3C7', text: '#92400E', label: 'Scheduled' },
      ready: { bg: '#D1FAE5', text: '#065F46', label: 'Ready to Start' },
      working: { bg: '#DBEAFE', text: '#1E40AF', label: 'In Progress' },
      completed: { bg: '#D1FAE5', text: '#065F46', label: 'Completed' },
    };
    const c = config[phase] || config.waiting;
    return (
      <View style={[styles.badge, { backgroundColor: c.bg }]}>
        <Text style={[styles.badgeText, { color: c.text }]}>{c.label}</Text>
      </View>
    );
  };

  // ── Loading state ──────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ title: 'Active Job', headerShown: true }} />
        <ActivityIndicator size="large" color="#176B51" />
        <Text style={styles.loadingText}>Loading job...</Text>
      </View>
    );
  }

  // ── Error state ────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ title: 'Active Job', headerShown: true }} />
        <Text style={styles.errorIcon}>!</Text>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadSession}>
          <Text style={styles.retryBtnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <Stack.Screen options={{ title: job?.title || 'Active Job', headerShown: true }} />

      {/* Error banner */}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      ) : null}

      {/* Job Header */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.jobTitle}>{job?.title}</Text>
          {renderStatusBadge()}
        </View>

        {job?.category && (
          <Text style={styles.category}>
            {job.category.name_nl || job.category.name_en}
          </Text>
        )}

        {/* Job Details */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Address</Text>
            <Text style={styles.detailValue}>{formatAddress(job!)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Scheduled</Text>
            <Text style={styles.detailValue}>{formatDate(job!.start_time)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Budget</Text>
            <Text style={styles.detailValue}>{formatBudget(job!)}</Text>
          </View>
        </View>

        {job?.description ? (
          <View style={styles.descriptionSection}>
            <Text style={styles.detailLabel}>Description</Text>
            <Text style={styles.description}>{job.description}</Text>
          </View>
        ) : null}
      </View>

      {/* ── WAITING / READY phase ──────────────────────────── */}
      {(phase === 'waiting' || phase === 'ready') && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {timeUntilStart > 0 ? 'Time Until Start' : 'Job Time Has Arrived'}
          </Text>

          <View style={styles.countdownContainer}>
            <Text style={styles.countdownText}>
              {timeUntilStart > 0 ? formatCountdown(timeUntilStart) : 'Now!'}
            </Text>
            {timeUntilStart > 1800 && (
              <Text style={styles.countdownHint}>
                Start button unlocks 30 min before scheduled time
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.startBtn,
              phase !== 'ready' && styles.btnDisabled,
            ]}
            onPress={handleStart}
            disabled={phase !== 'ready' || actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.startBtnText}>
                {phase === 'ready' ? 'Start Work' : 'Not Yet'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ── WORKING phase ──────────────────────────────────── */}
      {phase === 'working' && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Work Timer</Text>

          <View style={styles.timerContainer}>
            <View style={styles.timerDot} />
            <Text style={styles.timerText}>{formatTimer(elapsedSeconds)}</Text>
          </View>
          <Text style={styles.timerHint}>Timer is running...</Text>

          <TouchableOpacity
            style={styles.stopBtn}
            onPress={handleStop}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.stopBtnText}>Stop Work</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ── COMPLETED phase ────────────────────────────────── */}
      {phase === 'completed' && (
        <View style={styles.card}>
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Job Completed!</Text>
          <Text style={styles.successSubtitle}>
            Great work! The job has been marked as completed.
          </Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>{formatTimer(completionDuration)}</Text>
          </View>

          {application?.actual_start_time && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Started</Text>
              <Text style={styles.summaryValue}>
                {new Date(application.actual_start_time).toLocaleTimeString('nl-BE', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          )}

          {application?.actual_end_time && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Ended</Text>
              <Text style={styles.summaryValue}>
                {new Date(application.actual_end_time).toLocaleTimeString('nl-BE', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.replace('/Student/Dashboard')}
          >
            <Text style={styles.backBtnText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Signature Modal ────────────────────────────────── */}
      <SignatureCanvas
        visible={showSignature}
        onSave={handleSignatureSave}
        onCancel={() => setShowSignature(false)}
        title="Client Signature"
      />
    </ScrollView>
  );
}

// ── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#5D6B73',
    fontSize: 15,
  },

  // Error
  errorIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    textAlign: 'center',
    lineHeight: 56,
    fontSize: 28,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 16,
    overflow: 'hidden',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#041316',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#5D6B73',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: '#176B51',
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
  },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E1E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#041316',
    flex: 1,
    marginRight: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  category: {
    fontSize: 14,
    color: '#176B51',
    fontWeight: '600',
    marginBottom: 16,
  },

  // Details
  detailsGrid: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 13,
    color: '#5D6B73',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#041316',
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  descriptionSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#041316',
    marginBottom: 16,
    textAlign: 'center',
  },

  // Countdown
  countdownContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  countdownText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#176B51',
  },
  countdownHint: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },

  // Buttons
  startBtn: {
    backgroundColor: '#176B51',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#176B51',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  btnDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },

  // Timer
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  timerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    marginRight: 12,
  },
  timerText: {
    fontSize: 52,
    fontWeight: '800',
    color: '#041316',
    fontVariant: ['tabular-nums'],
  },
  timerHint: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 24,
  },

  stopBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  stopBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  // Completed
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  successEmoji: {
    fontSize: 32,
    color: '#065F46',
    fontWeight: '700',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#041316',
    textAlign: 'center',
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#5D6B73',
    textAlign: 'center',
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#5D6B73',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#041316',
  },
  backBtn: {
    backgroundColor: '#176B51',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
