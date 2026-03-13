import { StyleSheet, TouchableOpacity, ScrollView, Text, View, ActivityIndicator, Alert, Image } from "react-native";
import * as React from "react";
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Clock, CheckCircle, XCircle, AlertCircle, Star } from 'lucide-react-native';
import { studentAPI, getStudentId } from '../../../services/api';

export default function ApplicationDetail() {
  const params = useLocalSearchParams();
  const applicationId = params.id as string;
  const router = useRouter();
  
  const [application, setApplication] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [cancelling, setCancelling] = React.useState(false);

  React.useEffect(() => {
    loadApplication();
  }, [applicationId]);

  const loadApplication = async () => {
    try {
      setLoading(true);
      setError('');
      const sid = await getStudentId();
      if (!sid) {
        setError('Student ID not found');
        return;
      }
      const applications = await studentAPI.getApplications(Number(sid));
      const app = applications.find((a: any) => a.id === Number(applicationId));
      if (app) {
        setApplication(app);
      } else {
        setError('Application not found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load application';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelApplication = async () => {
    try {
      setCancelling(true);
      
      // Cancel the application first
      const sid = await getStudentId();
      if (!sid || !application) {
        throw new Error('Missing student ID or application data');
      }
      
      console.log('Cancelling application:', { studentId: sid, applicationId: application.id });
      await studentAPI.cancelApplication(Number(sid), application.id);
      console.log('Cancel succeeded, navigating...');
      
      // Navigate back to available tab so job reappears in the list
      router.replace('/Student/Dashboard?tab=available');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel application';
      console.error('Cancel failed:', errorMessage);
      alert(errorMessage);
    } finally {
      setCancelling(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} color="#F59E0B" />;
      case 'accepted':
        return <CheckCircle size={16} color="#10B981" />;
      case 'rejected':
        return <XCircle size={16} color="#EF4444" />;
      default:
        return <AlertCircle size={16} color="#6B7280" />;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#176B51" />
        <Text style={styles.loadingText}>Loading application...</Text>
      </View>
    );
  }

  if (error || !application) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>⚠️ {error || 'Application not found'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const job = application.jobs;

  return (
    
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Status Badge */}
      <View style={styles.statusBadge}>
        {getStatusIcon(application.status)}
        <Text style={styles.statusText}>
          {application.status === 'pending' && 'Pending Review'}
          {application.status === 'accepted' && 'Accepted'}
          {application.status === 'rejected' && 'Rejected'}
        </Text>
      </View>
      

      {/* Job Title */}
      <Text style={styles.jobTitle}>{job?.title || 'Job'}</Text>
                    {job?.image_url && (
                <Image
                  source={{ uri: job.image_url }}
                  style={styles.jobImage}
                  resizeMode="cover"
                />
              )}

      {/* Job Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Description</Text>
          <Text style={styles.detailValue}>{job?.description || 'No description'}</Text>
        </View>
        

        {job?.area_text && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>{job.area_text}</Text>
          </View>
        )}

        {job?.start_time && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Start Date</Text>
            <Text style={styles.detailValue}>
              {new Date(job.start_time).toLocaleDateString('nl-BE', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </Text>
          </View>
        )}

        {job?.fixed_price && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Budget</Text>
            <Text style={styles.detailValue}>€{job.fixed_price}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Applied On</Text>
          <Text style={styles.detailValue}>
            {new Date(application.applied_at).toLocaleDateString('nl-BE', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </Text>
        </View>
      </View>

      {/* Display Review if available */}
      {application.review && (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Jouw Review</Text>
          <View style={styles.reviewContainer}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewLabel}>Rating:</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={20}
                    color={star <= application.review.rating ? '#F59E0B' : '#D1D5DB'}
                    fill={star <= application.review.rating ? '#F59E0B' : 'transparent'}
                  />
                ))}
              </View>
            </View>
            {application.review.comment && (
              <View style={styles.reviewCommentContainer}>
                <Text style={styles.reviewLabel}>Comment:</Text>
                <Text style={styles.reviewComment}>{application.review.comment}</Text>
              </View>
            )}
            <Text style={styles.reviewDate}>
              Reviewed on {new Date(application.review.created_at).toLocaleDateString('nl-BE', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </Text>
          </View>
        </View>
      )}

      {/* Actions */}
      {application.status === 'pending' && (
        <TouchableOpacity 
          style={styles.cancelBtn} 
          onPress={handleCancelApplication}
          disabled={cancelling}
        >
          {cancelling ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.cancelBtnText}>Cancel Application</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Back Button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>Go Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#92400E',
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  detailsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    color: '#1F2937',
    marginTop: 4,
    lineHeight: 22,
  },
  reviewSection: {
    marginBottom: 20,
  },
  reviewSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  reviewContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  reviewCommentContainer: {
    marginBottom: 12,
  },
  reviewComment: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginTop: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  cancelBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  backBtn: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  backBtnText: {
    color: '#1F2937',
    fontWeight: '600',
    fontSize: 16,
  },

    jobImage: {
    width: '20%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
  },
});
