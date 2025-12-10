import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';

type PostJobModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit?: (jobData: JobFormData) => void;
};

type JobFormData = {
  category: string;
  title: string;
  description: string;
  date: string;
  time: string;
  hours: string;
  address: string;
  city: string;
  compensation: string;
};

export default function PostJobModal({ visible, onClose, onSubmit }: PostJobModalProps) {
  const [formData, setFormData] = useState<JobFormData>({
    category: '',
    title: '',
    description: '',
    date: '',
    time: '',
    hours: '',
    address: '',
    city: '',
    compensation: '',
  });

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(formData);
    }
    // Reset form
    setFormData({
      category: '',
      title: '',
      description: '',
      date: '',
      time: '',
      hours: '',
      address: '',
      city: '',
      compensation: '',
    });
    onClose();
  };

  const handleCancel = () => {
    // Reset form on cancel
    setFormData({
      category: '',
      title: '',
      description: '',
      date: '',
      time: '',
      hours: '',
      address: '',
      city: '',
      compensation: '',
    });
    onClose();
  }
    return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Post a new job</Text>
            <View style={styles.backButton} />
          </View>

          {/* Form Content */}
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formContainer}>
              {/* Category */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Categorie</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Value"
                  value={formData.category}
                  onChangeText={(text) => setFormData({ ...formData, category: text })}
                />
              </View>

              {/* Title */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Titel</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Value"
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                />
              </View>

              {/* Description */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Beschrijving</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Value"
                  multiline
                  numberOfLines={4}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  maxLength={500}
                />
                <Text style={styles.charCount}>{formData.description.length}/500 characters</Text>
              </View>

              {/* Date and Time */}
              <View style={styles.rowGroup}>
                <View style={styles.halfField}>
                  <Text style={styles.label}>Date</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Value"
                    value={formData.date}
                    onChangeText={(text) => setFormData({ ...formData, date: text })}
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.label}>Time</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Value"
                    value={formData.time}
                    onChangeText={(text) => setFormData({ ...formData, time: text })}
                  />
                </View>
              </View>

              {/* Hours */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Aantal uren werk</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Value"
                  value={formData.hours}
                  onChangeText={(text) => setFormData({ ...formData, hours: text })}
                  keyboardType="numeric"
                />
              </View>

              {/* Address */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Adress</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Value"
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                />
              </View>

              {/* City */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Stad</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Value"
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                />
              </View>

              {/* Compensation */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Verloning</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Value"
                  value={formData.compensation}
                  onChangeText={(text) => setFormData({ ...formData, compensation: text })}
                  keyboardType="numeric"
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                  <Text style={styles.cancelButtonText}>Annuleer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                  <Text style={styles.submitButtonText}>Post job</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 650,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#041316',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#041316',
  },
  scrollContent: {
    flex: 1,
  },
  formContainer: {
    padding: 24,
    backgroundColor: '#F8FAFB',
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#041316',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E7EB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#041316',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#5D6B73',
    marginTop: 4,
  },
  rowGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  halfField: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E1E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D6B73',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#176B51',
    alignItems: 'center',
    shadowColor: '#176B51',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});


