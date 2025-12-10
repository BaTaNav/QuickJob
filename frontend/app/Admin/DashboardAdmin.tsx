import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, StatusBar, TextInput, Image } from "react-native";
import { RefreshCw, Plus, ArrowDown, Handshake, Home, Search, LogOut, User } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function DashboardAdmin() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("Open");

    const stats = [
        { label: "Verificaties", value: 0 },
        { label: "Incidenten", value: 0 },
    ];

    const tabs = ["Verificaties", "Incidenten"];

    return (
        <View style={styles.screen}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Top Navigation Bar */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Handshake size={28} color="#176B51" strokeWidth={2.5} />
                    <Text style={styles.headerTitle}>QuickJob</Text>
                    <TouchableOpacity
                        onPress={() => setActiveTab("home")}
                        style={[styles.subTab, activeTab === "home" && styles.activeSubTab]}
                    >
                        <Text style={[styles.subTabText, activeTab === "home" && styles.activeSubTabText]}>
                            Home
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => router.push("/Admin/VerificationAdmin")}
                        style={styles.navTab}
                    >
                        <Text style={[styles.subTabText, activeTab === "verification" && styles.activeSubTabText]}>
                            Studenten verificatie
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push("/Admin/IncidentsAdmin")}
                        style={styles.navTab}
                    >
                        <Text style={[styles.subTabText, activeTab === "incidents" && styles.activeSubTabText]}>
                            Incidenten
                        </Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.logoutBtn}>
                    <Text style={styles.logoutText}>Log out</Text>
                    <LogOut size={18} color="#1a2e4c" />
                </TouchableOpacity>
            </View>



            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.contentContainer}>

                    {/* Stats Overview */}
                    <Text style={styles.sectionTitle}>Overview</Text>
                    <View style={styles.statsGrid}>
                        {stats.map((stat, index) => (
                            <View key={index} style={styles.statCard}>
                                <Text style={styles.statNumber}>{stat.value}</Text>
                                <Text style={styles.statLabel}>{stat.label}</Text>
                            </View>
                        ))}
                    </View>


                    {/* Tabs */}
                    <View style={styles.tabContainer}>
                        {tabs.map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                onPress={() => setActiveTab(tab)}
                                style={[styles.tabBtn, activeTab === tab && styles.activeTabBtn]}
                            >
                                <Text style={activeTab === tab ? styles.activeTabText : styles.inactiveTabText}>
                                    {tab} (0)
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Empty State */}
                    <View style={styles.emptyWrapper}>
                    </View>

                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#F5F7FA",
    },
    scrollContent: {
        paddingBottom: 100,
    },

    logoutBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    logoutText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1a2e4c",
    },

    // Header
    header: {
        backgroundColor: "#fff",
        paddingHorizontal: 24,
        paddingBottom: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: "#EFF0F6",
        paddingTop: Platform.OS === 'android' ? 48 : 56,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#1a2e4c",
    },
    iconButton: {
        padding: 8,
        backgroundColor: "#F7F9FC",
        borderRadius: 999,
    },

    subTab: {},
    activeSubTab: {
        borderBottomWidth: 2,
        borderBottomColor: "#000",
        paddingBottom: 2,
    },
    subTabText: {
        fontSize: 16,
        color: "#6B7280",
        fontWeight: "500",
    },
    activeSubTabText: {
        color: "#000",
        fontWeight: "700",
    },
    navTab: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    navTabText: {
        fontSize: 16,
        color: "#000",
        fontWeight: "400",
    },
    activeNavTabText: {
        fontWeight: "700",
    },

    // Content
    contentContainer: {
        padding: 24,
        paddingBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1a2e4c",
        marginBottom: 16,
    },

    // Stats
    statsGrid: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1, // Allows cards to scale with width
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        // Shadow equivalent
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: "700",
        color: "#176B51", // QuickJob Green
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: "500",
        color: "#64748B",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },

    // Actions
    createJobBtn: {
        width: "100%",
        backgroundColor: "#176B51",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 32,
        shadowColor: "#176B51",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    createJobText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
        marginLeft: 8,
    },

    // Tabs
    tabContainer: {
        flexDirection: "row",
        backgroundColor: "#fff",
        padding: 4,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "#EFF0F6",
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    activeTabBtn: {
        backgroundColor: "#176B51",
    },
    activeTabText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 12,
    },
    inactiveTabText: {
        color: "#64748B",
        fontWeight: "500",
        fontSize: 12,
    },

    // Empty State
    emptyWrapper: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 48,
        backgroundColor: "#fff",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderStyle: "dashed",
    },
    emptyIcon: {
        width: 48,
        height: 48,
        backgroundColor: "#E8F5E9",
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1a2e4c",
        marginBottom: 4,
    },
    emptySubtitle: {
        fontSize: 14,
        color: "#64748B",
        textAlign: "center",
        maxWidth: 200,
        marginBottom: 24,
    },
    emptyButton: {
        backgroundColor: "#000",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    emptyButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 14,
    },
});