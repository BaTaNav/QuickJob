import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Star, CheckCircle } from 'lucide-react-native';
import { jobsAPI, getClientId } from '@/services/api';

export default function ReviewPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const jobId = params.jobId as string;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState<any>(null);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [checkingReview, setCheckingReview] = useState(true);

  useEffect(() => {
    loadJobDetails();
  }, []);

  const loadJobDetails = async () => {
    try {
      setCheckingReview(true);
      const jobData = await jobsAPI.getJob(Number(jobId));
      setJob(jobData);
      
      // Get the accepted applicant's student_id
      if (jobData.accepted_applicant?.student_id) {
        setStudentId(jobData.accepted_applicant.student_id);
      }

      // Check if client already reviewed this job
      const clientId = await getClientId();
      if (clientId && jobData.accepted_applicant?.student_id) {
        try {
          const response = await fetch(
            `http://localhost:3000/students/reviews/job/${jobId}`,
            { method: 'GET', headers: { 'Content-Type': 'application/json' } }
          );
          const data = await response.json();
          
          // Find if current client has already reviewed
          const clientReview = data.reviews?.find((r: any) => r.client_id === Number(clientId));
          if (clientReview) {
            setExistingReview(clientReview);
          }
        } catch (err) {
          console.log('Could not check existing reviews');
        }
      }
    } catch (err: any) {
      console.error('Error loading job:', err);
      Alert.alert('Error', 'Kon job details niet laden');
    } finally {
      setCheckingReview(false);
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert('Fout', 'Selecteer een rating');
      return;
    }

    if (!comment.trim()) {
      Alert.alert('Fout', 'Schrijf een review');
      return;
    }

    try {
      setLoading(true);
      const clientId = await getClientId();

      const payload = {
        job_id: Number(jobId),
        rating,
        comment: comment.trim(),
        client_id: Number(clientId),
      };

      console.log('Submitting review:', payload);

      const response = await fetch('http://localhost:3000/students/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      console.log('Review submitted successfully:', data);

      // Update UI to show review was submitted
      setExistingReview(data.review);
      
      Alert.alert('Succes', 'Review verzonden!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      console.error('Error submitting review:', err);
      Alert.alert('Error', err.message || 'Kon review niet verzenden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1B1B1B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {existingReview ? 'Jouw Review' : 'Review Schrijven'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {checkingReview && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#176B51" />
          </View>
        )}

        {!checkingReview && existingReview && (
          <>
            {job && (
              <View style={styles.jobInfo}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.jobSubtitle}>
                  {job.accepted_applicant?.email || 'Student'}
                </Text>
              </View>
            )}

            {/* Already Reviewed Message */}
            <View style={styles.alreadyReviewedContainer}>
              <CheckCircle size={48} color="#10B981" />
              <Text style={styles.alreadyReviewedTitle}>Je hebt deze job al beoordeeld!</Text>
              
              {/* Show existing review */}
              <View style={styles.reviewDisplay}>
                <View style={styles.ratingDisplay}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={24}
                      color={star <= existingReview.rating ? '#F59E0B' : '#D1D5DB'}
                      fill={star <= existingReview.rating ? '#F59E0B' : 'transparent'}
                    />
                  ))}
                </View>
                <Text style={styles.reviewComment}>{existingReview.comment}</Text>
                <Text style={styles.reviewDate}>
                  Beoordeeld op: {new Date(existingReview.created_at).toLocaleDateString('nl-BE')}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.backButtonFull}
                onPress={() => router.back()}
              >
                <Text style={styles.backButtonText}>← Terug</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {!checkingReview && !existingReview && (
          <>
            {job && (
              <View style={styles.jobInfo}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.jobSubtitle}>
                  {job.accepted_applicant?.email || 'Student'}
                </Text>
              </View>
            )}

            {/* Rating Stars */}
            <View style={styles.section}>
              <Text style={styles.label}>Rating</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    style={styles.starButton}
                  >
                    <Star
                      size={40}
                      color={star <= rating ? '#F59E0B' : '#D1D5DB'}
                      fill={star <= rating ? '#F59E0B' : 'transparent'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Comment */}
            <View style={styles.section}>
              <Text style={styles.label}>Jouw review</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={6}
                placeholder="Hoe was je ervaring met deze student? Deel je feedback..."
                value={comment}
                onChangeText={setComment}
                textAlignVertical="top"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmitReview}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Verstuur Review</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  jobInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B1B1B',
    marginBottom: 4,
  },
  jobSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B1B',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  starButton: {
    padding: 4,
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1B1B1B',
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  submitButton: {
    backgroundColor: '#176B51',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  // Already reviewed styles
  alreadyReviewedContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  alreadyReviewedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B1B1B',
    marginTop: 16,
    marginBottom: 24,
  },
  reviewDisplay: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  ratingDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  reviewComment: {
    fontSize: 15,
    color: '#1B1B1B',
    marginBottom: 12,
    lineHeight: 22,
  },
  reviewDate: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
  },
  backButtonFull: {
    backgroundColor: '#176B51',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
