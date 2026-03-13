import React, { useState } from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { Clock, MapPin, Briefcase } from 'lucide-react-native';
import { brand } from '../constants/Colors';
import { Job, formatJobAddress, formatPrice } from '../utils/helpers';

// JobImage sub-component with error fallback
function JobImage({ uri }: { uri?: string }) {
  const [errored, setErrored] = useState(false);
  if (!uri || errored) return null;
  return (
    <Image source={{ uri }} style={styles.image} resizeMode="cover" onError={() => setErrored(true)} />
  );
}

interface JobCardProps {
  job: Job;
  onPress?: () => void;
  statusBadge?: { label: string; color: string };
  children?: React.ReactNode; // For custom action buttons
}

export default function JobCard({ job, onPress, statusBadge, children }: JobCardProps) {
  const address = formatJobAddress(job);
  const price = formatPrice(job);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          {statusBadge && (
            <View style={[styles.badgeRow]}>
              <Clock size={16} color={statusBadge.color} />
              <Text style={[styles.badgeText, { color: statusBadge.color }]}>{statusBadge.label}</Text>
            </View>
          )}
          <Text style={styles.title}>{job.title}</Text>
        </View>
        <JobImage uri={job.image_url} />
      </View>

      {job.description ? <Text style={styles.description} numberOfLines={2}>{job.description}</Text> : null}

      <View style={styles.details}>
        {job.category?.name_en && (
          <View style={styles.detailRow}>
            <Briefcase size={14} color={brand.textSecondary} />
            <Text style={styles.detailText}>{job.category.name_nl || job.category.name_en}</Text>
          </View>
        )}
        {address ? (
          <View style={styles.detailRow}>
            <MapPin size={14} color={brand.textSecondary} />
            <Text style={styles.detailText}>{address}</Text>
          </View>
        ) : null}
        {job.start_time && (
          <View style={styles.detailRow}>
            <Clock size={14} color={brand.textSecondary} />
            <Text style={styles.detailText}>
              {new Date(job.start_time).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}
      </View>

      {(price || children) && (
        <View style={styles.footer}>
          {price ? <Text style={styles.price}>{price}</Text> : <View />}
          {children}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', padding: 12, marginBottom: 12, borderRadius: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  image: { width: 40, height: 40, borderRadius: 8, marginLeft: 8 },
  title: { fontSize: 16, fontWeight: '700', color: brand.text, marginBottom: 4 },
  description: { fontSize: 14, color: '#4A4A4A', marginBottom: 8 },
  details: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 13, color: brand.textSecondary },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  price: { fontSize: 15, fontWeight: '700', color: brand.primary },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  badgeText: { fontSize: 12, fontWeight: '600' },
});
