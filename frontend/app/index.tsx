import { StyleSheet, TouchableOpacity, ScrollView, Platform, StatusBar } from "react-native";
import { Text, View } from "react-native";
import React, { useState, useEffect } from "react"; 
import { useRouter, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context"; // <--- 1. Importeer dit

export default function TabOneScreen() {
  const [role, setRole] = useState<"client" | "student">("client");
  const router = useRouter();

  // Force Browser Tab Title on Web AND Force Home on Android
  useEffect(() => {
    if (Platform.OS === 'web') {
      document.title = "QuickJob";
    }
    
    // TIJDELIJKE FIX: Forceer navigatie naar home op Android bij opstarten
    if (Platform.OS === 'android') {
       // Kleine vertraging om zeker te zijn dat router klaar is
       setTimeout(() => {
         if (router.canGoBack()) {
            router.dismissAll(); // Verwijder alle backgeschiedenis
         }
       }, 100); // 100ms vertraging
    }
  }, []);

  return (
    // 2. Wrap alles in SafeAreaView met edges=['top']
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }} edges={['top']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        
        {/* Sets Native Navigation Header Title (Mobile) */}
        <Stack.Screen options={{ title: "QuickJob", headerShown: false }} />
        
        {/* HEADER WITH AUTH BUTTONS */}
        <View style={styles.header}>
          <Text style={styles.logo}>QuickJob</Text>
          <View style={styles.authButtons}>
            <TouchableOpacity style={styles.loginBtn} onPress={() => router.push("/Login")}>
              <Text style={styles.loginBtnText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.signUpBtn} onPress={() => router.push("/Student/Signup")}>
              <Text style={styles.signUpBtnText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* HERO SECTION */}
        <View style={styles.heroSection}>
          <View style={styles.regionBadge}>
            <View style={styles.regionDot} />
            <Text style={styles.regionText}>Vlaams-Brabant & Brussels</Text>
          </View>

          <Text style={styles.title}>
            Find students{"\n"}for your tasks
          </Text>

          <Text style={styles.subtitle}>
            Verified students help you with daily tasks in Flemish Brabant and Brussels.
          </Text>

          {/* CTA BUTTONS */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/Client/Signup")}>
              <Text style={styles.primaryBtnText}>Post a job</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push("/Student/Signup")}>
              <Text style={styles.secondaryBtnText}>Become a student helper</Text>
            </TouchableOpacity>
          </View>

          {/* FEATURES */}
          <View style={styles.featuresRow}>
            <Feature icon="✔" text="Verified students" />
            <Feature icon="€" text="Secure payments" />
            <Feature icon="⚡" text="Quick matching" />
          </View>
        </View>

        {/* HOW IT WORKS SECTION */}
        <View style={styles.howItWorksSection}>
          <Text style={styles.sectionTitle}>How it works</Text>
          
          {/* TOGGLE */}
          <View style={styles.toggleWrap}>
            <TouchableOpacity
              style={[styles.toggleBtn, role === "client" && styles.toggleActive]}
              onPress={() => setRole("client")}
            >
              <Text style={role === "client" ? styles.toggleActiveText : styles.toggleText}>
                For Clients
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, role === "student" && styles.toggleActive]}
              onPress={() => setRole("student")}
            >
              <Text style={role === "student" ? styles.toggleActiveText : styles.toggleText}>
                For Students
              </Text>
            </TouchableOpacity>
          </View>

          {/* STEPS */}
          <View style={styles.stepsWrap}>
            {role === "client" ? (
              <>
                <Step num={1} title="Post your job" text="Describe what you need and when." />
                <Step num={2} title="Choose a student" text="Review profiles and pick someone." />
                <Step num={3} title="Get it done" text="Student arrives and completes the job." />
              </>
            ) : (
              <>
                <Step num={1} title="Create your profile" text="Sign up and upload your documents." />
                <Step num={2} title="Apply to jobs" text="Choose nearby tasks that fit you." />
                <Step num={3} title="Get paid" text="Complete jobs and receive payout." />
              </>
            )}
          </View>
        </View>

        {/* FOOTER CTA */}
        <View style={styles.footerCta}>
          <Text style={styles.footerTitle}>Ready to get started?</Text>
          <Text style={styles.footerSubtitle}>Join thousands of clients and students already using QuickJob</Text>
          <TouchableOpacity style={styles.footerBtn} onPress={() => router.push("/Student/Signup")}>
            <Text style={styles.footerBtnText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
    
  );
}

/* COMPONENTS */
function Feature({ icon, text }: any) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Text>{icon}</Text>
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

function Step({ num, title, text }: any) {
  return (
    <View style={styles.stepCard}>
      <View style={styles.stepNum}>
        <Text style={{ color: "#fff", fontWeight: "600" }}>{num}</Text>
      </View>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
    backgroundColor: "#FFFFFF",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E1E7EB",
  },
  logo: {
    fontSize: 24,
    fontWeight: "800",
    color: "#176B51",
    letterSpacing: -0.5,
  },
  authButtons: {
    flexDirection: "row",
    gap: 12,
  },
  loginBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  loginBtnText: {
    color: "#176B51",
    fontWeight: "600",
    fontSize: 15,
  },
  signUpBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#176B51",
  },
  signUpBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },

  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 80,
    backgroundColor: "#F8FAFB",
    alignItems: "center",
  },

  regionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#C0F1D6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 24,
  },
  regionDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#1CC96B",
    marginRight: 8,
  },
  regionText: {
    color: "#0F4C3A",
    fontWeight: "600",
    fontSize: 13,
  },

  title: {
    fontSize: 42,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 50,
    color: "#041316",
    marginBottom: 16,
  },

  subtitle: {
    fontSize: 16,
    color: "#5D6B73",
    textAlign: "center",
    maxWidth: 400,
    lineHeight: 24,
    marginBottom: 32,
  },

  actions: {
    width: "100%",
    maxWidth: 400,
    flexDirection: "column",
    gap: 14,
    marginBottom: 48,
  },

  primaryBtn: {
    backgroundColor: "#176B51",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#176B51",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
  },

  secondaryBtn: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#176B51",
  },
  secondaryBtnText: {
    color: "#176B51",
    fontWeight: "600",
    fontSize: 17,
  },

  featuresRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
    flexWrap: "wrap",
  },

  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderColor: "#E1E7EB",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureText: {
    color: "#041316",
    fontSize: 14,
    fontWeight: "600",
  },

  howItWorksSection: {
    paddingHorizontal: 24,
    paddingVertical: 80,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    color: "#041316",
    marginBottom: 40,
  },

  toggleWrap: {
    backgroundColor: "#EDF1F2",
    borderRadius: 999,
    padding: 6,
    flexDirection: "row",
    width: "100%",
    maxWidth: 400,
    marginBottom: 40,
  },

  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  toggleText: {
    color: "#5D6B73",
    fontSize: 15,
    fontWeight: "500",
  },
  toggleActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleActiveText: {
    color: "#041316",
    fontWeight: "700",
    fontSize: 15,
  },

  stepsWrap: {
    width: "100%",
    maxWidth: 600,
    gap: 20,
  },

  stepCard: {
    backgroundColor: "#F8FAFB",
    padding: 28,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E1E7EB",
  },
  stepNum: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#176B51",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    color: "#041316",
  },
  stepText: {
    color: "#5D6B73",
    fontSize: 15,
    lineHeight: 22,
  },

  footerCta: {
    paddingHorizontal: 24,
    paddingVertical: 80,
    backgroundColor: "#176B51",
    alignItems: "center",
  },
  footerTitle: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  footerSubtitle: {
    fontSize: 16,
    color: "#C0F1D6",
    textAlign: "center",
    marginBottom: 32,
    maxWidth: 400,
  },
  footerBtn: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  footerBtnText: {
    color: "#176B51",
    fontWeight: "700",
    fontSize: 17,
  },
});