import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Instagram, Linkedin, Facebook, Twitter } from 'lucide-react-native';
import { brand } from '../constants/Colors';

export default function Footer() {
  return (
    <View style={styles.footer}>
      <View style={styles.section}>
        <Text style={styles.title}>QuickJob</Text>
        <Text style={styles.description}>Connecting students with flexible job opportunities across Belgium.</Text>
      </View>

      <View style={styles.links}>
        <View style={styles.column}>
          <Text style={styles.columnTitle}>Company</Text>
          <TouchableOpacity><Text style={styles.link}>About Us</Text></TouchableOpacity>
          <TouchableOpacity><Text style={styles.link}>Contact</Text></TouchableOpacity>
          <TouchableOpacity><Text style={styles.link}>Careers</Text></TouchableOpacity>
        </View>
        <View style={styles.column}>
          <Text style={styles.columnTitle}>Support</Text>
          <TouchableOpacity><Text style={styles.link}>Help Center</Text></TouchableOpacity>
          <TouchableOpacity><Text style={styles.link}>Safety</Text></TouchableOpacity>
          <TouchableOpacity><Text style={styles.link}>FAQ</Text></TouchableOpacity>
        </View>
        <View style={styles.column}>
          <Text style={styles.columnTitle}>Legal</Text>
          <TouchableOpacity><Text style={styles.link}>Privacy Policy</Text></TouchableOpacity>
          <TouchableOpacity><Text style={styles.link}>Terms of Service</Text></TouchableOpacity>
          <TouchableOpacity><Text style={styles.link}>Cookie Policy</Text></TouchableOpacity>
        </View>
      </View>

      <View style={styles.social}>
        <Text style={styles.columnTitle}>Follow Us</Text>
        <View style={styles.socialIcons}>
          <TouchableOpacity style={styles.socialIcon}><Instagram size={20} color="#E4405F" /></TouchableOpacity>
          <TouchableOpacity style={styles.socialIcon}><Linkedin size={20} color="#0A66C2" /></TouchableOpacity>
          <TouchableOpacity style={styles.socialIcon}><Facebook size={20} color="#1877F2" /></TouchableOpacity>
          <TouchableOpacity style={styles.socialIcon}><Twitter size={20} color="#1DA1F2" /></TouchableOpacity>
        </View>
      </View>

      <View style={styles.contact}>
        <Text style={styles.contactText}>support@quickjob.be</Text>
        <Text style={styles.contactText}>+32 2 123 45 67</Text>
      </View>

      <View style={styles.bottom}>
        <Text style={styles.copyright}>© 2025 QuickJob. All rights reserved.</Text>
        <Text style={styles.version}>v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { marginTop: 60, paddingTop: 40, borderTopWidth: 1, borderTopColor: brand.border },
  section: { marginBottom: 40 },
  title: { fontSize: 20, fontWeight: '700', color: brand.text, marginBottom: 12 },
  description: { fontSize: 14, color: brand.textSecondary, lineHeight: 20, maxWidth: 300 },
  links: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 32 },
  column: { flex: 1, minWidth: 150 },
  columnTitle: { fontSize: 14, fontWeight: '700', color: brand.text, marginBottom: 12 },
  link: { fontSize: 13, color: brand.textSecondary, marginBottom: 8 },
  social: { marginBottom: 40 },
  socialIcons: { flexDirection: 'row', gap: 12 },
  socialIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#F4F6F7', alignItems: 'center', justifyContent: 'center' },
  contact: { marginBottom: 24 },
  contactText: { fontSize: 13, color: brand.textSecondary, marginBottom: 8 },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTopWidth: 1, borderTopColor: brand.border },
  copyright: { fontSize: 12, color: brand.textMuted },
  version: { fontSize: 12, color: brand.textMuted },
});
