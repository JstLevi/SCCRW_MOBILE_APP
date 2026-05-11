// mobile/app/(tabs)/logs.tsx
// Mirrors web: src/screens/LogsScreen.jsx
// CHANGED: event_type logic → matches web getType(action) pattern
// ADDED: device_name display, same emoji/color mapping as web

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getActivities, deleteActivity, getDetections, ActivityLog, Detection } from "../lib/deviceService";

const FILTERS = ["All", "Today", "Yesterday", "Alerts"];

// ── Mirrors web getEventColor(type) ──────────────────────────────
function getEventColor(type: string) {
  switch (type) {
    case "offline":  return "#D32F2F";
    case "online":   return "#004E00";
    case "bird":     return "#FFA000";
    case "battery":  return "#FF6B00";
    case "motion":   return "#1976D2";
    default:         return "#004E00";
  }
}

// ── Mirrors web getEmoji(action) ──────────────────────────────────
function getEmoji(action: string = "") {
  const a = action.toLowerCase();
  if (a.includes("bird") || a.includes("detect"))           return "🐦";
  if (a.includes("offline") || a.includes("disconnect"))    return "📵";
  if (a.includes("online") || a.includes("connect"))        return "✅";
  if (a.includes("battery"))                                 return "🪫";
  if (a.includes("motion"))                                  return "▶️";
  if (a.includes("update"))                                  return "☁️";
  if (a.includes("snapshot") || a.includes("camera"))       return "📸";
  // Fall back to event_type if no action string
  return "📋";
}

// ── Mirrors web getType(action) ───────────────────────────────────
function getType(action: string = "", event_type?: string) {
  const a = action.toLowerCase();
  if (a.includes("offline") || a.includes("disconnect"))  return "offline";
  if (a.includes("online") || a.includes("connect"))     return "online";
  if (a.includes("bird") || a.includes("detect"))        return "bird";
  if (a.includes("battery"))                              return "battery";
  if (a.includes("motion"))                              return "motion";
  // Fall back to event_type from API
  return event_type || "system";
}

// ── Log row (mirrors web LogEntry component) ──────────────────────
function LogRow({ log, onDelete }: { log: ActivityLog; onDelete: (id: number) => void }) {
  // Web uses log.action for emoji/type; mobile API returns event_type + description
  // Bridge: use description as the "action" string for emoji detection, fall back to event_type
  const actionStr = log.description || log.event_type || "";
  const type  = getType(actionStr, log.event_type);
  const color = getEventColor(type);
  const emoji = getEmoji(actionStr);
  const time  = log.created_at
    ? new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <View style={styles.logRow}>
      <View style={[styles.logIconSquare, { backgroundColor: color + "22" }]}>
        <Text style={{ fontSize: 18 }}>{emoji}</Text>
      </View>
      <View style={styles.logContent}>
        <View style={styles.logHeader}>
          {/* Mirrors web: Device #log.device OR device_name */}
          <Text style={styles.logDevice}>{log.device_name ?? `Device #${log.device}`}</Text>
          <Text style={styles.logTime}>{time}</Text>
        </View>
        {/* Mirrors web: log.action — description + event_type */}
        <Text style={styles.logEvent}>
          {log.event_type}{log.description ? ` — ${log.description}` : ""}
        </Text>
      </View>
      <TouchableOpacity onPress={() => onDelete(log.id)} style={{ padding: 4 }}>
        <Ionicons name="close" size={16} color="#D32F2F" />
      </TouchableOpacity>
    </View>
  );
}

export default function LogsScreen() {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setError(null);
    const [actResult, detResult] = await Promise.all([getActivities(), getDetections()]);
    if (actResult.error) setError(actResult.error);
    else setLogs(actResult.data ?? []);
    if (!detResult.error) setDetections(detResult.data ?? []);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchLogs().finally(() => setLoading(false));
  }, [fetchLogs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  }, [fetchLogs]);

  const handleDelete = async (id: number) => {
    Alert.alert("Delete", "Delete this log entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteActivity(id);
          setLogs((prev) => prev.filter((l) => l.id !== id));
        },
      },
    ]);
  };

  // ── Filter logic (mirrors web LogsScreen exactly) ─────────────
  const today     = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  const filtered = logs.filter((log) => {
    const logDate = log.created_at ? new Date(log.created_at).toDateString() : "";
    const actionStr = log.description || log.event_type || "";
    if (selectedFilter === "Today")     return logDate === today;
    if (selectedFilter === "Yesterday") return logDate === yesterday;
    if (selectedFilter === "Alerts")    return ["offline", "battery"].includes(getType(actionStr, log.event_type));
    return true;
  });

  const todayLogs     = filtered.filter((l) => l.created_at && new Date(l.created_at).toDateString() === today);
  const yesterdayLogs = filtered.filter((l) => l.created_at && new Date(l.created_at).toDateString() === yesterday);
  const olderLogs     = filtered.filter((l) => {
    if (!l.created_at) return true;
    const d = new Date(l.created_at).toDateString();
    return d !== today && d !== yesterday;
  });

  // ── Stats (mirrors web LogsScreen stats) ──────────────────────
  const totalEvents  = logs.length + (detections?.length ?? 0);
  const alertCount   = logs.filter((l) => {
    const a = l.description || l.event_type || "";
    return ["offline", "battery"].includes(getType(a, l.event_type));
  }).length;
  const offlineCount = logs.filter((l) => {
    const a = l.description || l.event_type || "";
    return getType(a, l.event_type) === "offline";
  }).length;

  return (
    <ImageBackground
      source={require("../../assets/images/tabs-bg.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Activity Logs</Text>
              <Text style={styles.headerSubtitle}>Device history and events</Text>
            </View>
            <TouchableOpacity style={styles.filterBtn} onPress={onRefresh}>
              <Ionicons name="refresh" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* ── Stats Summary (mirrors web stats-row) ── */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{loading ? "…" : totalEvents}</Text>
              <Text style={styles.statLabel}>Total Events</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{loading ? "…" : alertCount}</Text>
              <Text style={styles.statLabel}>Alerts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{loading ? "…" : offlineCount}</Text>
              <Text style={styles.statLabel}>Offline Events</Text>
            </View>
          </View>

          {/* ── Filter Chips (mirrors web filter-chips) ── */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <View style={styles.filterContainer}>
              {FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
                  onPress={() => setSelectedFilter(filter)}
                >
                  <Text style={[styles.filterChipText, selectedFilter === filter && styles.filterChipTextActive]}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          )}

          {loading && <Text style={styles.loadingText}>Loading logs…</Text>}

          {!loading && filtered.length === 0 && (
            <Text style={styles.loadingText}>No logs found.</Text>
          )}

          {/* ── Today ── */}
          {todayLogs.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Today</Text>
              </View>
              {todayLogs.map((log) => (
                <LogRow key={log.id} log={log} onDelete={handleDelete} />
              ))}
            </View>
          )}

          {/* ── Yesterday ── */}
          {yesterdayLogs.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Yesterday</Text>
              </View>
              {yesterdayLogs.map((log) => (
                <LogRow key={log.id} log={log} onDelete={handleDelete} />
              ))}
            </View>
          )}

          {/* ── Older ── */}
          {olderLogs.length > 0 && (
            <View style={[styles.section, { marginBottom: 20 }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Older</Text>
              </View>
              {olderLogs.map((log) => (
                <LogRow key={log.id} log={log} onDelete={handleDelete} />
              ))}
            </View>
          )}

          {/* ── Export Button (mirrors web action-btn) ── */}
          <TouchableOpacity style={[styles.exportButton, { marginBottom: 100 }]}>
            <Ionicons name="download-outline" size={20} color="#fff" />
            <Text style={styles.exportText}>Export Logs</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, width: "100%", height: "100%" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(200,230,160,0.18)" },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20, },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 24, fontFamily: "Poppins-Bold", color: "#1a3a0d" },
  headerSubtitle: { fontSize: 12, fontFamily: "Poppins-Regular", color: "#808080", marginTop: 2 },
  filterBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#004E00", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#080647" },
  statsCard: { flexDirection: "row", backgroundColor: "rgba(249, 255, 161, .8)", borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1.5, borderColor: "rgba(249, 255, 161, 1)", alignItems: "center", justifyContent: "space-around", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  statItem: { alignItems: "center", flex: 1 },
  statNumber: { fontSize: 20, fontFamily: "Poppins-Bold", color: "#004E00" },
  statLabel: { fontSize: 10, fontFamily: "Poppins-Regular", color: "#808080", marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: "rgba(0,78,0,0.2)" },
  filterScroll: { marginBottom: 14 },
  filterContainer: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "rgba(249, 255, 161, 0.5)", borderWidth: 1, borderColor: "#c8e890" },
  filterChipActive: { backgroundColor: "#004E00", borderColor: "#004E00" },
  filterChipText: { fontSize: 13, fontFamily: "Poppins-Medium", color: "#1a3a0d" },
  filterChipTextActive: { color: "#FFFFFF" },
  errorBanner: { marginBottom: 10, backgroundColor: "rgba(211,47,47,0.1)", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: "#D32F2F" },
  errorText: { fontSize: 12, fontFamily: "Poppins-Regular", color: "#D32F2F" },
  loadingText: { fontSize: 13, fontFamily: "Poppins-Regular", color: "#808080", textAlign: "center", paddingVertical: 16 },
  section: { backgroundColor: "rgba(249, 255, 161, 0.8)", borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1.5, borderColor: "#c8e890", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontFamily: "Poppins-SemiBold", color: "#1a3a0d" },
  logRow: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(200,232,144,0.3)", borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#b8dc88" },
  logIconSquare: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  logContent: { flex: 1, marginLeft: 12 },
  logHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  logDevice: { fontSize: 13, fontFamily: "Poppins-SemiBold", color: "#1a3a0d" },
  logTime: { fontSize: 10, fontFamily: "Poppins-Regular", color: "#808080" },
  logEvent: { fontSize: 12, fontFamily: "Poppins-Regular", color: "#4a4a4a" },
  exportButton: { flexDirection: "row", backgroundColor: "#004E00", borderRadius: 14, paddingVertical: 14, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#080647", gap: 8 },
  exportText: { color: "#fff", fontSize: 14, fontFamily: "Poppins-SemiBold" },
});