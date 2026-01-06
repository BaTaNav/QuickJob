import * as React from 'react';
import { StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';
import { studentAPI, getStudentId } from '../../../services/api';

export default function AppliedJobDetail() {
  const params = useLocalSearchParams();
  const applicationId = params.id as string | undefined;
  const router = useRouter();

  const [application, setApplication] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const load = async () => {
      if (!applicationId) {
        setError('No application id provided');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError('');
        const sid = await getStudentId();
        if (!sid) {
          setError('Please log in');
          return;
        }
        const data = await studentAPI.getApplications(Number(sid));
        const app = data.find((a: any) => a.id === Number(applicationId));
        
        if (!app) {
          setError('Application not found');
          return;
        }
        
        // Ensure job data is properly structured
        if (!app.jobs) {
          app.jobs = {
            title: 'Job',
            description: '',
            area_text: '',
            start_time: null,
            fixed_price: null,
            hourly_or_fixed: 'hourly',
            category: null
          };
        }
        
        setApplication(app);
      } catch (err: any) {
        setError(err?.message || 'Failed to load application');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [applicationId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#176B51" />
        <Text style={styles.emptySubtitle}>Loading application...</Text>
      </View>
    );
  }

  if (error || !application) {
    return (
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Application not found</Text>
        <Text style={styles.emptySubtitle}>{error || 'Could not load application'}</Text>
        <Pressable onPress={() => router.push('/Student/Dashboard?tab=pending')}>
          <Text style={{ color: '#176B51', marginTop: 12, fontWeight: '600' }}>Back to pending</Text>
        </Pressable>
      </View>
    );
  }

  const job = application.jobs;
  const getStatusInfo = () => {
    const status = application.status || 'pending';
    
    switch (status) {
      case 'pending':
        return {
          icon: <Clock size={24} color="#F59E0B" />,
          label: 'Pending Review',
          color: '#F59E0B',
          bgColor: '#FEF3C7',
        };
      case 'accepted':
        return {
          icon: <CheckCircle size={24} color="#10B981" />,
          label: 'Accepted',
          color: '#10B981',
          bgColor: '#D1FAE5',
        };
      case 'rejected':
        return {
          icon: <XCircle size={24} color="#EF4444" />,
          label: 'Rejected',
          color: '#EF4444',
          bgColor: '#FEE2E2',
        };
      case 'cancelled':
        return {
          icon: <AlertCircle size={24} color="#6B7280" />,
          label: 'Cancelled',
          color: '#6B7280',
          bgColor: '#F3F4F6',
        };
      default:
        return {
          icon: <Clock size={24} color="#176B51" />,
          label: 'Submitted',
          color: '#176B51',
          bgColor: '#F0F9F6',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
        <View style={styles.statusIconContainer}>
          {statusInfo.icon}
        </View>
        <Text style={[styles.statusLabel, { color: statusInfo.color }]}>
          {statusInfo.label}
        </Text>
        <Text style={styles.appliedDate}>
          Applied: {new Date(application.applied_at).toLocaleDateString('nl-BE', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>

      {/* Job Details Section */}
      <View style={styles.jobDetailsSection}>
        <Text style={styles.category}>{job?.category?.name_nl || job?.category?.name_en || 'Category'}</Text>
        <Text style={styles.pageTitle}>{job?.title}</Text>
        {job?.start_time && (
          <Text style={styles.jobMeta}>
            {new Date(job.start_time).toLocaleString('nl-BE')}
            {job?.area_text ? ` • ${job.area_text}` : ''}
          </Text>
        )}
      </View>

      {/* Description */}
      {job?.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.sectionText}>{job?.description}</Text>
        </View>
      )}

      {/* Location */}
      {job?.area_text && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Text style={styles.sectionText}>{job.area_text}</Text>
        </View>
      )}

      {/* Start Date */}
      {job?.start_time && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Start Date & Time</Text>
          <Text style={styles.sectionText}>
            {new Date(job.start_time).toLocaleString('nl-BE', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
      )}

      {/* Budget */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Budget</Text>
        <Text style={styles.sectionText}>
          {job?.hourly_or_fixed === 'fixed' && job?.fixed_price 
            ? `Fixed price: €${job.fixed_price}` 
            : job?.hourly_or_fixed === 'hourly' 
              ? 'Hourly rate'
              : 'Not specified'
          }
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Pressable 
          style={styles.primaryBtn}
          onPress={() => router.push('/Student/Dashboard?tab=pending')}
        >
          <Text style={styles.primaryBtnText}>Back to pending</Text>
        </Pressable>

        {application.status === 'pending' && (
          <Pressable 
            style={styles.secondaryBtn}
            onPress={() => {
              // TODO: Implement cancel application functionality
              alert('Cancel application feature coming soon');
            }}
          >
            <Text style={styles.secondaryBtnText}>Cancel application</Text>
          </Pressable>
        )}
      </View>

      {/* Status Information */}
      {application.status === 'pending' && (
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>What's next?</Text>
          <Text style={styles.infoText}>
            • The client is reviewing your application{'\n'}
            • You'll be notified when they respond{'\n'}
            • Check this page for status updates
          </Text>
        </View>
      )}

      {application.status === 'accepted' && (
        <View style={[styles.infoBox, { backgroundColor: '#D1FAE5', borderLeftColor: '#10B981' }]}>
          <Text style={[styles.infoTitle, { color: '#10B981' }]}>Congratulations!</Text>
          <Text style={styles.infoText}>
            • Your application has been accepted{'\n'}
            • Contact the client to confirm details{'\n'}
            • Prepare for the job start date{'\n'}
            • Complete the work as agreed
          </Text>
        </View>
      )}

      {application.status === 'rejected' && (
        <View style={[styles.infoBox, { backgroundColor: '#FEE2E2', borderLeftColor: '#EF4444' }]}>
          <Text style={[styles.infoTitle, { color: '#EF4444' }]}>Keep going!</Text>
          <Text style={styles.infoText}>
            • Don't be discouraged{'\n'}
            • Check available jobs on the dashboard{'\n'}
            • Update your profile to stand out{'\n'}
            • The right opportunity is waiting!
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  jobDetailsSection: {
    marginBottom: 16,
  },
  category: {
    color: '#176B51',
    fontWeight: '700',
    marginBottom: 6,
    fontSize: 14,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
    color: '#1B1B1B',
  },
  jobMeta: {
    color: '#7A7F85',
    marginBottom: 4,
  },
  appliedDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  category: {
    color: '#176B51',
    fontWeight: '700',
    marginBottom: 6,
    fontSize: 14,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
    color: '#1B1B1B',
  },
  jobMeta: {
    color: '#7A7F85',
    marginBottom: 16,
    fontSize: 14,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 6,
    fontSize: 16,
    color: '#1B1B1B',
  },
  sectionText: {
    color: '#4A4A4A',
    lineHeight: 20,
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: 32,
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: '#176B51',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryBtn: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  secondaryBtnText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 16,
  },
  infoBox: {
    backgroundColor: '#F0F9F6',
    padding: 16,
    borderRadius: 10,
    marginTop: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#176B51',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#176B51',
    marginBottom: 8,
  },
  infoText: {
    color: '#4A4A4A',
    lineHeight: 22,
    fontSize: 14,
  },
  emptySubtitle: {
    color: '#7A7F85',
    marginTop: 8,
    fontSize: 14,
  },
});
