import { StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Text, View } from "@/components/Themed";
import React, { useState } from "react";
import { useRouter } from "expo-router";

export default function TabOneScreen() {
  const [role, setRole] = useState<"client" | "student">("client");
  const router = useRouter();

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>

      <View style={styles.regionBadge}>
        <View style={styles.regionDot} />
        <Text style={styles.regionText}>Vlaams-Brabant & Brussels</Text>
      </View>

      <View style={styles.authButtons}>
        <TouchableOpacity
          style={styles.authBtn}
          onPress={() => router.push("/Login")} 
        >
          <Text style={styles.authBtnText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.authBtn, styles.signUpBtn]}
          onPress={() => router.push("/Signup")} 
        >
          <Text style={[styles.authBtnText, styles.signUpBtnText]}>Sign Up</Text>
        </TouchableOpacity>
      </View>

 
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

        <TouchableOpacity style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>Become a student helper</Text>
        </TouchableOpacity>
      </View>


    </ScrollView>
  );
}

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
    marginTop: 10,
    fontSize: 36,
    fontWeight: "800",
    lineHeight: 40,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 15,
    color: "#5D6B73",
    maxWidth: 310,
    lineHeight: 20,
  },

  actions: {
    marginTop: 32,
    flexDirection: "column",
    gap: 14,
  },
  primaryBtn: {
    backgroundColor: "#176B51",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryBtn: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#176B51",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#176B51",
    fontSize: 16,
    fontWeight: "600",
  },
});
