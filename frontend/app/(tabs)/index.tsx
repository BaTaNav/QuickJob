import { StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Text, View } from "@/components/Themed";
import React, { useState } from "react";
import { useRouter } from "expo-router";




export default function TabOneScreen() {
  const [role, setRole] = useState<"client" | "student">("client");
  const router = useRouter();

 

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
      {/* REGION BADGE */}
      <View style={styles.regionBadge}>
        <View style={styles.regionDot} />
        <Text style={styles.regionText}>Vlaams-Brabant & Brussels</Text>
      </View>

      {/* HERO TITLE */}
      <Text style={styles.title}>
        Find students{"\n"}for your tasks
      </Text>

      <Text style={styles.subtitle}>
        Verified students help you with daily tasks in Flemish Brabant and Brussels.
      </Text>

      {/* CTA BUTTONS */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Post a job</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push("/Signup")}>
          <Text style={styles.secondaryBtnText}>Become a student helper</Text>
        </TouchableOpacity>
      </View>

      {/* FEATURES */}
      <View style={styles.featuresRow}>
        <Feature icon="✔" text="Verified students" />
        <Feature icon="€" text="Secure payments" />
        <Feature icon="⚡" text="Quick matching" />
      </View>

      {/* TOGGLE */}
      <View style={styles.toggleWrap}>
        <TouchableOpacity
          style={[styles.toggleBtn, role === "client" && styles.toggleActive]}
          onPress={() => setRole("client")}
        >
          <Text style={role === "client" ? styles.toggleActiveText : styles.toggleText}>
            Client
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, role === "student" && styles.toggleActive]}
          onPress={() => setRole("student")}
        >
          <Text style={role === "student" ? styles.toggleActiveText : styles.toggleText}>
            Student
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
    </ScrollView>
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
    padding: 24,
    paddingBottom: 80,
  },

  regionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#C0F1D6",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: "flex-start",
    marginTop: 16,
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
    fontWeight: "500",
    fontSize: 13,
  },

  authButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
    marginBottom: 32,
    gap: 12,
  },
  authBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: "#176B51",
  },
  authBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  signUpBtn: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#176B51",
  },
  signUpBtnText: {
    color: "#176B51",
  },

  title: {
    marginTop: 24,
    fontSize: 34,
    fontWeight: "800",
  },

  subtitle: {
    marginTop: 12,
    fontSize: 15,
    color: "#5D6B73",
    maxWidth: 310,
  },

  actions: {
    marginTop: 24,
    flexDirection: "column",
    gap: 12,
  },

  primaryBtn: {
    backgroundColor: "#176B51",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  secondaryBtn: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CED6DB",
  },
  secondaryBtnText: {
    color: "#041316",
    fontWeight: "500",
    fontSize: 15,
  },

  featuresRow: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureIcon: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderColor: "#E1E7EB",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    color: "#5D6B73",
    fontSize: 13,
  },

  toggleWrap: {
    marginTop: 40,
    backgroundColor: "#EDF1F2",
    borderRadius: 999,
    padding: 4,
    flexDirection: "row",
  },

  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },
  toggleText: {
    color: "#5D6B73",
    fontSize: 15,
  },
  toggleActive: {
    backgroundColor: "#fff",
    elevation: 2,
  },
  toggleActiveText: {
    color: "#041316",
    fontWeight: "600",
    fontSize: 15,
  },

  stepsWrap: {
    marginTop: 28,
    gap: 18,
  },

  stepCard: {
    backgroundColor: "#F7FBF9",
    padding: 20,
    borderRadius: 18,
    elevation: 1,
  },
  stepNum: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: "#176B51",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  stepText: {
    color: "#5D6B73",
    fontSize: 14,
  },
});