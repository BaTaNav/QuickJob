import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, StatusBar } from "react-native";
import { Handshake, LogOut, LayoutDashboard, ShieldCheck, AlertCircle } from "lucide-react-native";
import { useRouter } from "expo-router";

// Check if mobile (not web)
const isMobile = Platform.OS !== 'web';

export default function DashboardAdmin() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("Open");

    const stats = [
        { label: "Verificaties", value: 0 },
        { label: "Incidenten", value: 0 },
    ];

    const tabs = ["Verificaties", "Incidenten"];

    // Force Browser Tab Title on Web
    useEffect(() => {
        if (Platform.OS === 'web') {
            document.title = "QuickJob | Dashboard-Admin";
        }
    }, []);

    // Helper functions for navigation - reduces duplication
    const navigateToHome = () => setActiveTab("home");
    const navigateToVerification = () => router.push("/Admin/VerificationAdmin" as any);
    const navigateToIncidents = () => router.push("/Admin/IncidentsAdmin" as any);
    const handleLogout = () => router.push("/Login" as any);

    return (
        <View style={styles.screen}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* HEADER */}
            <View style={[styles.header, isMobile && styles.headerMobile]}>
                
                {/* Logo & Title */}
                <View style={styles.headerLeft}>
                    <Handshake size={28} color="#176B51" strokeWidth={2.5} />
                    {!isMobile && <Text style={styles.headerTitle}>QuickJob Admin</Text>}
                </View>

                {/* Navigation - Condensed on Mobile */}
                <View style={[styles.navContainer, isMobile && styles.navContainerMobile]}>
                    <TouchableOpacity
                        onPress={navigateToHome}
                        style={[styles.navTab, activeTab === "home" && styles.activeNavTab]}
                    >
                        {isMobile ? <LayoutDashboard size={20} color={activeTab === "home" ? "#176B51" : "#64748B"} /> : null}
                        <Text style={[styles.navTabText, activeTab === "home" && styles.activeNavTabText]}>Home</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={navigateToVerification}
                        style={[styles.navTab, activeTab === "verification" && styles.activeNavTab]}
                    >
                         {isMobile ? <ShieldCheck size={20} color={activeTab === "verification" ? "#176B51" : "#64748B"} /> : null}
                        <Text style={[styles.navTabText, activeTab === "verification" && styles.activeNavTabText]}>
                            {isMobile ? "Verificatie" : "Studenten verificatie"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={navigateToIncidents}
                        style={[styles.navTab, activeTab === "incidents" && styles.activeNavTab]}
                    >
                        {isMobile ? <AlertCircle size={20} color={activeTab === "incidents" ? "#176B51" : "#64748B"} /> : null}
                        <Text style={[styles.navTabText, activeTab === "incidents" && styles.activeNavTabText]}>Incidenten</Text>
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    {!isMobile && <Text style={styles.logoutText}>Log out</Text>}
                    <LogOut size={isMobile ? 24 : 18} color={isMobile ? "#ef4444" : "#1a2e4c"} />
                </TouchableOpacity>
            </View>


            {/* CONTENT */}
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={[styles.contentContainer, isMobile && styles.contentContainerMobile]}>

                    {/* Stats Overview */}
                    <Text style={styles.sectionTitle}>Overview</Text>
                    <View style={[styles.statsGrid, isMobile && styles.statsGridMobile]}>
                        {stats.map((stat, index) => (
                            <View key={index} style={styles.statCard}>
                                <Text style={styles.statNumber}>{stat.value}</Text>
                                <Text style={styles.statLabel}>{stat.label}</Text>
                            </View>
                        ))}
                    </View>


                    {/* Info Tabs within Home */}
                    <View style={styles.tabContainer}>
                        {tabs.map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                onPress={() => setActiveTab(tab)}
                                style={[styles.tabBtn, activeTab === tab && styles.activeTabBtn]}
                            >
                                <Text style={activeTab === tab ? styles.activeTabText : styles.inactiveTabText}>
                                    {tab}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Empty State / Content Placeholder */}
                    <View style={styles.emptyWrapper}>
                        <Text style={{color: '#9CA3AF'}}>Selecteer een categorie hierboven</Text>
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
        paddingBottom: 40,
    },

    // Header Styles
    header: {
        backgroundColor: "#fff",
        paddingHorizontal: 24,
        paddingBottom: 16,
        paddingTop: isMobile ? 48 : 20, // More top padding for status bar on mobile
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: "#EFF0F6",
    },
    headerMobile: {
        flexDirection: 'column',
        gap: 16,
        paddingHorizontal: 16,
        alignItems: 'stretch',
    },
    
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        justifyContent: isMobile ? 'center' : 'flex-start',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#1a2e4c",
    },

    // Navigation Container
    navContainer: {
        flexDirection: 'row',
        gap: 20,
        alignItems: 'center',
    },
    navContainerMobile: {
        gap: 4,
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        padding: 4,
        borderRadius: 12,
    },

    navTab: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 8,
    },
    activeNavTab: {
        backgroundColor: isMobile ? '#fff' : 'transparent',
    },
    
    navTabText: {
        fontSize: 15,
        color: "#64748B",
        fontWeight: "500",
        display: isMobile ? 'none' : 'flex', // Hide text on very small screens if desired, or keep as is
    },
    activeNavTabText: {
        color: "#176B51",
        fontWeight: "700",
    },

    // Logout
    logoutBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        position: isMobile ? 'absolute' : 'relative',
        top: isMobile ? 50 : 0,
        right: isMobile ? 20 : 0,
    },
    logoutText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1a2e4c",
    },

    // Content Styles
    contentContainer: {
        padding: 24,
        maxWidth: 1200,
        width: '100%',
        alignSelf: 'center',
    },
    contentContainerMobile: {
        padding: 16,
    },
    
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1a2e4c",
        marginBottom: 16,
    },

    // Stats Grid
    statsGrid: {
        flexDirection: "row",
        gap: 20,
        marginBottom: 32,
    },
    statsGridMobile: {
        flexDirection: "column",
        gap: 12,
    },
    
    statCard: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        minHeight: 100,
    },
    statNumber: {
        fontSize: 32,
        fontWeight: "700",
        color: "#176B51",
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: "#64748B",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },

    // Tab Container (Lower Level)
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
        paddingVertical: 12,
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
        fontSize: 14,
    },
    inactiveTabText: {
        color: "#64748B",
        fontWeight: "500",
        fontSize: 14,
    },

    // Empty State
    emptyWrapper: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
        backgroundColor: "#fff",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderStyle: "dashed",
    },
});