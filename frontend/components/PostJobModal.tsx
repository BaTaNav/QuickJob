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
  };}
