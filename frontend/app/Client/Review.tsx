import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Star } from 'lucide-react-native';
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

  useEffect(() => {
    loadJobDetails();
  }, []);

  const loadJobDetails = async () => {
    try {
      const jobData = await jobsAPI.getJob(Number(jobId));
      setJob(jobData);
      
      // Get the accepted applicant's student_id
      if (jobData.accepted_applicant?.student_id) {
        setStudentId(jobData.accepted_applicant.student_id);
      }
    } catch (err: any) {
      console.error('Error loading job:', err);
      Alert.alert('Error', 'Kon job details niet laden');
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      const msg = 'Selecteer een rating';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Fout', msg);
      return;
    }

    if (!comment.trim()) {
      const msg = 'Schrijf een review';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Fout', msg);
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

      // Submit review to backend
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

      // Show success message and navigate back to dashboard
      if (Platform.OS === 'web') {
        window.alert('Review geplaatst! ');
        router.push('/Client/DashboardClient');
      } else {
        Alert.alert('Succes', 'Review geplaatst! ', [
          { text: 'OK', onPress: () => router.push('/Client/DashboardClient') }
        ]);
      }
    } catch (err: any) {
      console.error('Error submitting review:', err);
      const errorMsg = err.message || 'Kon review niet verzenden';
      Platform.OS === 'web' ? window.alert('Error: ' + errorMsg) : Alert.alert('Error', errorMsg);
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
        <Text style={styles.headerTitle}>Review Schrijven</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
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
});
