import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Handshake, LogOut, AlertTriangle, RefreshCw } from "lucide-react-native";
import { useRouter } from "expo-router";
import { adminAPI } from "@/services/api";

const isMobile = Platform.OS !== "web";

type IncidentStatus = "open" | "in_review" | "resolved" | "dismissed";
type IncidentSeverity = "low" | "medium" | "high";

type Incident = {
  id: number;
  summary: string;
  description?: string | null;
  status: IncidentStatus;
  severity?: IncidentSeverity | null;
  created_at?: string | null;
  updated_at?: string | null;
  job_id?: number | null;
  application_id?: number | null;
  student_id?: number | null;
  client_id?: number | null;
  admin_notes?: string | null;
  job?: { id: number; title?: string | null; area_text?: string | null; start_time?: string | null; status?: string | null } | null;
  student?: { id: number; email?: string | null; phone?: string | null; role?: string | null } | null;
  client?: { id: number; email?: string | null; phone?: string | null; role?: string | null } | null;
  application?: { id: number; status?: string | null; job_id?: number | null; student_id?: number | null } | null;
};

const STATUS_OPTIONS: { key: "all" | IncidentStatus; label: string }[] = [
  { key: "all", label: "Alle" },
  { key: "open", label: "Open" },
  { key: "in_review", label: "In review" },
  { key: "resolved", label: "Opgelost" },
  { key: "dismissed", label: "Geseponeerd" },
];

const SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  low: "Laag",
  medium: "Midden",
  high: "Hoog",
};

const severityColors: Record<IncidentSeverity, { bg: string; text: string }> = {
  low: { bg: "#E0F2FE", text: "#075985" },
  medium: { bg: "#FEF9C3", text: "#92400E" },
  high: { bg: "#FFE4E6", text: "#9F1239" },
};

const statusPillStyle = (status: IncidentStatus) => ({
  backgroundColor:
    status === "resolved"
      ? "#DCFCE7"
      : status === "dismissed"
      ? "#F1F5F9"
      : status === "in_review"
      ? "#FEF3C7"
      : "#FFE4E6",
});

function formatDate(iso?: string | null) {
  if (!iso) return "Onbekend";
  try {
    return new Date(iso).toLocaleString();
  } catch (err) {
    return iso;
  }
}

export default function AdminIncidentsPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | IncidentStatus>("open");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    summary: "",
    description: "",
    job_id: "",
    student_id: "",
    client_id: "",
    application_id: "",
    severity: "medium" as IncidentSeverity,
  });

  useEffect(() => {
    if (Platform.OS === "web") {
      document.title = "QuickJob | Incidenten";
    }
  }, []);

  const loadIncidents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminAPI.getIncidents(statusFilter);
      const list = Array.isArray(data) ? data : data?.incidents || [];
      setIncidents(list);
    } catch (err: any) {
      setError(err?.message || "Kon incidenten niet laden");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  const submitIncident = async () => {
    if (!form.summary.trim()) {
      setError("Geef een korte samenvatting van het incident");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        summary: form.summary.trim(),
        description: form.description.trim() || null,
        job_id: form.job_id ? Number(form.job_id) : null,
        application_id: form.application_id ? Number(form.application_id) : null,
        student_id: form.student_id ? Number(form.student_id) : null,
        client_id: form.client_id ? Number(form.client_id) : null,
        severity: form.severity,
        status: "open" as IncidentStatus,
      };

      const created = await adminAPI.createIncident(payload);
      setIncidents((prev) => [created, ...prev]);
      setForm({ summary: "", description: "", job_id: "", student_id: "", client_id: "", application_id: "", severity: "medium" });
    } catch (err: any) {
      setError(err?.message || "Aanmaken mislukt");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: number, nextStatus: IncidentStatus) => {
    setUpdatingId(id);
    setError(null);
    try {
      const updated = await adminAPI.updateIncident(id, { status: nextStatus });
      setIncidents((prev) => prev.map((inc) => (inc.id === id ? updated : inc)));
    } catch (err: any) {
      setError(err?.message || "Status bijwerken mislukt");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredIncidents = useMemo(() => incidents, [incidents]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={[styles.header, isMobile && styles.headerMobile]}>
        <View style={styles.headerLeft}>
          <Handshake size={28} color="#176B51" strokeWidth={2.5} />
          {!isMobile && <Text style={styles.headerTitle}>QuickJob Admin</Text>}
        </View>
        <View style={[styles.navContainer, isMobile && styles.navContainerMobile]}>
          <TouchableOpacity onPress={() => router.push("/Admin/DashboardAdmin")} style={styles.navTab}>
            <Text style={styles.navTabText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/Admin/VerificationAdmin")} style={styles.navTab}>
            <Text style={styles.navTabText}>Verificatie</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navTab, styles.activeNavTab]} onPress={() => router.push("/Admin/IncidentsAdmin")}
          >
            <Text style={[styles.navTabText, styles.activeNavTabText]}>Incidenten</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => router.push("/Login")}>
          {!isMobile && <Text style={styles.logoutText}>Log out</Text>}
          <LogOut size={isMobile ? 24 : 18} color={isMobile ? "#ef4444" : "#1a2e4c"} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.contentContainer, isMobile && styles.contentContainerMobile]}>
          <View style={styles.titleRow}>
            <Text style={styles.pageTitle}>Incident Management</Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={loadIncidents}>
              <RefreshCw size={16} color="#176B51" />
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterRow}>
            {STATUS_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                onPress={() => setStatusFilter(option.key)}
                style={[styles.filterChip, statusFilter === option.key && styles.filterChipActive]}
              >
                <Text style={statusFilter === option.key ? styles.filterChipTextActive : styles.filterChipText}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <AlertTriangle size={18} color="#B91C1C" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Nieuw incident</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Samenvatting *</Text>
              <TextInput
                style={styles.input}
                placeholder="Korte titel"
                value={form.summary}
                onChangeText={(text) => setForm((prev) => ({ ...prev, summary: text }))}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Beschrijving</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={4}
                placeholder="Wat is er gebeurd?"
                value={form.description}
                onChangeText={(text) => setForm((prev) => ({ ...prev, description: text }))}
              />
            </View>
            <View style={styles.inlineInputs}>
              <View style={styles.inlineField}>
                <Text style={styles.label}>Job ID</Text>
                <TextInput
                  style={styles.input}
                  placeholder="bv. 12"
                  keyboardType="numeric"
                  value={form.job_id}
                  onChangeText={(text) => setForm((prev) => ({ ...prev, job_id: text }))}
                />
              </View>
              <View style={styles.inlineField}>
                <Text style={styles.label}>Applicatie ID</Text>
                <TextInput
                  style={styles.input}
                  placeholder="optioneel"
                  keyboardType="numeric"
                  value={form.application_id}
                  onChangeText={(text) => setForm((prev) => ({ ...prev, application_id: text }))}
                />
              </View>
            </View>
            <View style={styles.inlineInputs}>
              <View style={styles.inlineField}>
                <Text style={styles.label}>Student ID</Text>
                <TextInput
                  style={styles.input}
                  placeholder="optioneel"
                  keyboardType="numeric"
                  value={form.student_id}
                  onChangeText={(text) => setForm((prev) => ({ ...prev, student_id: text }))}
                />
              </View>
              <View style={styles.inlineField}>
                <Text style={styles.label}>Client ID</Text>
                <TextInput
                  style={styles.input}
                  placeholder="optioneel"
                  keyboardType="numeric"
                  value={form.client_id}
                  onChangeText={(text) => setForm((prev) => ({ ...prev, client_id: text }))}
                />
              </View>
            </View>
            <View style={styles.inlineInputs}>
              <View style={styles.inlineField}>
                <Text style={styles.label}>Ernst</Text>
                <View style={styles.severityRow}>
                  {(Object.keys(SEVERITY_LABELS) as IncidentSeverity[]).map((sev) => (
                    <TouchableOpacity
                      key={sev}
                      onPress={() => setForm((prev) => ({ ...prev, severity: sev }))}
                      style={[styles.severityChip, form.severity === sev && styles.severityChipActive]}
                    >
                      <Text style={form.severity === sev ? styles.severityChipTextActive : styles.severityChipText}>
                        {SEVERITY_LABELS[sev]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.submitBtn} onPress={submitIncident} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitText}>Opslaan</Text>}
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#176B51" style={{ marginTop: 40 }} />
          ) : filteredIncidents.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Geen incidenten gevonden.</Text>
              <Text style={styles.emptySub}>Maak een nieuw incident aan of pas het filter aan.</Text>
            </View>
          ) : (
            filteredIncidents.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                onChangeStatus={updateStatus}
                updating={updatingId === incident.id}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function IncidentCard({ incident, onChangeStatus, updating }: { incident: Incident; onChangeStatus: (id: number, status: IncidentStatus) => void; updating: boolean }) {
  const severityKey: IncidentSeverity = incident.severity || "medium";
  const severityStyle = severityColors[severityKey];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{incident.summary || "Incident"}</Text>
          <Text style={styles.cardMeta}>Aangemaakt: {formatDate(incident.created_at)}</Text>
        </View>
        <View style={styles.statusPills}>
          <View style={[styles.statusPill, statusPillStyle(incident.status)]}>
            <Text style={styles.statusPillText}>{incident.status.replace("_", " ")}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: severityStyle.bg }]}> 
            <Text style={[styles.statusPillText, { color: severityStyle.text }]}>{SEVERITY_LABELS[severityKey]}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.description}>{incident.description || "Geen beschrijving toegevoegd."}</Text>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Job:</Text>
        <Text style={styles.infoValue}>{incident.job?.title || (incident.job_id ? `#${incident.job_id}` : "-")}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Student:</Text>
        <Text style={styles.infoValue}>{incident.student?.email || (incident.student_id ? `#${incident.student_id}` : "-")}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Client:</Text>
        <Text style={styles.infoValue}>{incident.client?.email || (incident.client_id ? `#${incident.client_id}` : "-")}</Text>
      </View>

      <View style={styles.actionsRow}>
        <Text style={styles.actionsLabel}>Status wijzigen:</Text>
        <View style={styles.actionChips}>
          {STATUS_OPTIONS.filter((s) => s.key !== "all").map((option) => (
            <TouchableOpacity
              key={option.key}
              onPress={() => onChangeStatus(incident.id, option.key as IncidentStatus)}
              style={[styles.actionChip, incident.status === option.key && styles.actionChipActive]}
              disabled={updating}
            >
              {updating && incident.status !== option.key ? (
                <ActivityIndicator size="small" color="#176B51" />
              ) : (
                <Text style={incident.status === option.key ? styles.actionChipTextActive : styles.actionChipText}>
                  {option.label}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F7FA" },
  scrollContent: { paddingBottom: 80 },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#EFF0F6",
    paddingTop: Platform.OS === "android" ? 48 : 16,
  },
  headerMobile: { flexDirection: "column", gap: 12, alignItems: "stretch", paddingHorizontal: 16 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#1a2e4c" },
  navContainer: { flexDirection: "row", gap: 8, backgroundColor: "#F1F5F9", padding: 4, borderRadius: 8 },
  navContainerMobile: { justifyContent: "space-between" },
  navTab: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  activeNavTab: { backgroundColor: "#fff" },
  navTabText: { fontSize: 14, color: "#64748B", fontWeight: "500" },
  activeNavTabText: { color: "#176B51", fontWeight: "700" },
  logoutBtn: { flexDirection: "row", alignItems: "center", gap: 8, position: isMobile ? "absolute" : "relative", top: isMobile ? 20 : 0, right: isMobile ? 16 : 0 },
  logoutText: { fontSize: 14, fontWeight: "600", color: "#1a2e4c" },
  contentContainer: { padding: 24, maxWidth: 1100, width: "100%", alignSelf: "center" },
  contentContainerMobile: { padding: 16 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#1a2e4c" },
  refreshBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#E6F4EE", borderRadius: 8 },
  refreshText: { color: "#176B51", fontWeight: "600" },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: "#E2E8F0" },
  filterChipActive: { backgroundColor: "#176B51" },
  filterChipText: { color: "#334155", fontWeight: "600" },
  filterChipTextActive: { color: "#fff", fontWeight: "700" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEE2E2", borderColor: "#FCA5A5", borderWidth: 1, padding: 12, borderRadius: 10, marginBottom: 16 },
  errorText: { color: "#B91C1C", flex: 1, fontWeight: "600" },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: "#E2E8F0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a", marginBottom: 4 },
  cardMeta: { color: "#64748B", fontSize: 13 },
  statusPills: { flexDirection: "row", gap: 8 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "#E2E8F0" },
  statusPillText: { fontSize: 12, fontWeight: "700", color: "#0f172a", textTransform: "capitalize" },
  description: { marginTop: 12, marginBottom: 12, color: "#1F2937", lineHeight: 20 },
  infoRow: { flexDirection: "row", gap: 8, marginBottom: 6 },
  infoLabel: { color: "#475569", fontWeight: "700", minWidth: 70 },
  infoValue: { color: "#0f172a", flex: 1 },
  actionsRow: { marginTop: 12 },
  actionsLabel: { color: "#475569", marginBottom: 8, fontWeight: "700" },
  actionChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actionChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#F8FAFC" },
  actionChipActive: { backgroundColor: "#176B51", borderColor: "#176B51" },
  actionChipText: { color: "#0f172a", fontWeight: "600" },
  actionChipTextActive: { color: "#fff", fontWeight: "700" },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 13, color: "#475569", marginBottom: 6, fontWeight: "600" },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#0f172a" },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  inlineInputs: { flexDirection: "row", gap: 12 },
  inlineField: { flex: 1 },
  severityRow: { flexDirection: "row", gap: 8 },
  severityChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: "#E2E8F0" },
  severityChipActive: { backgroundColor: "#176B51" },
  severityChipText: { color: "#0f172a", fontWeight: "600" },
  severityChipTextActive: { color: "#fff", fontWeight: "700" },
  submitBtn: { marginTop: 12, backgroundColor: "#176B51", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  emptyState: { backgroundColor: "#fff", borderRadius: 12, padding: 24, alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0" },
  emptyText: { fontWeight: "700", color: "#0f172a", marginBottom: 6 },
  emptySub: { color: "#64748B" },
});

export type { IncidentStatus };
