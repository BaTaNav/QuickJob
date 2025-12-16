import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Platform, 
  TouchableOpacity 
} from 'react-native';

const AboutUs = () => {
  // Set Browser Tab Title (Web only)
  useEffect(() => {
    if (Platform.OS === 'web') {
      document.title = "QuickJob | About Us";
    }
  }, []);

  return (
    <ScrollView 
      contentContainerStyle={styles.containerContent} 
      style={styles.container}
    >
      {/* Header / Logo Area */}
      <View style={styles.headerContainer}>
        {/* Reusing the SVG Logo from Login if desired, or just text */}
        <Text style={styles.headerTitle}>QuickJob</Text>
      </View>

      <View style={styles.contentCard}>
        <Text style={styles.cardTitle}>About Us</Text>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Our Mission</Text>
          <Text style={styles.paragraph}>
            At QuickJob, we believe that finding work shouldn't be a full-time job. 
            We bridge the gap between ambitious students looking for experience and 
            clients who need tasks done quickly and efficiently.
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>For Students</Text>
          <Text style={styles.paragraph}>
            Gain valuable work experience, earn money on your own schedule, and build 
            a professional network that will jumpstart your career. We verify every 
            client to ensure your safety and payment security.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>For Clients</Text>
          <Text style={styles.paragraph}>
            Post a job in minutes and get matched with motivated local students. 
            Whether it's gardening, administrative support, or tech help, our 
            community is ready to assist.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/Student/Signup')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Join as Student</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push('/Client/Signup')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Join as Client</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Link */}
        <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/Login')}>
                <Text style={styles.linkText}>Log in</Text>
            </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default AboutUs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
    // On web, we can add the gradient via a parent div or CSS if needed, 
    // but React Native web handles backgroundColor well.
  },
  containerContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  headerContainer: {
    marginBottom: 40,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#176B51',
    letterSpacing: -0.5,
  },
  contentCard: {
    width: '100%',
    maxWidth: 600, // Slightly wider for text readability
    padding: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(225, 231, 235, 0.6)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
      },
      android: {
        elevation: 10,
      },
      web: {
        shadowColor: 'rgba(0, 0, 0, 0.08)',
        shadowOffset: { width: 0, height: 10 },
        shadowRadius: 40,
      }
    }),
  },
  cardTitle: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 32,
    color: '#041316',
    letterSpacing: -0.25,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#176B51',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24, // Better readability
    color: '#5D6B73',
  },
  divider: {
    height: 1,
    backgroundColor: '#E1E7EB',
    marginVertical: 24,
  },
  buttonContainer: {
    marginTop: 16,
    gap: 12, // Works in React Native 0.71+
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: '#176B51',
    borderRadius: 10,
    alignItems: 'center',
    ...Platform.select({
        web: { cursor: 'pointer' }
    })
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#176B51',
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    ...Platform.select({
        web: { cursor: 'pointer' }
    })
  },
  secondaryButtonText: {
    color: '#176B51',
    fontSize: 16,
    fontWeight: '600',
  },
  footerContainer: {
    marginTop: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E1E7EB',
    paddingTop: 24,
  },
  footerText: {
    color: '#5D6B73',
    fontSize: 15,
  },
  linkText: {
    color: '#176B51',
    fontWeight: '600',
    fontSize: 15,
    textDecorationLine: 'none',
  }
});