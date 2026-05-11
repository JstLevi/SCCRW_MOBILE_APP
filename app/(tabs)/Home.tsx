// mobile/app/(tabs)/Home.tsx
// Mirrors web: src/screens/HomeScreen.jsx
// Features: device overview, bird detections, manage/edit/delete modals, recent activity

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getDevices, createDevice, updateDevice, deleteDevice, getDetections, Device, Detection } from "../lib/deviceService";

// ─── Scarecrow icon (same as live.tsx) ───────────────────────────
function ScarecrowIcon({ size = 36 }: { size?: number }) {
  const s = size / 60;
  return (
    <View style={{ width: size, height: size * 1.1, alignItems: "center" }}>
      <View style={{ width: 44 * s, height: 5 * s, backgroundColor: "#2d6e10", borderRadius: 3, marginTop: 2 * s }} />
      <View style={{ width: 6 * s, height: 8 * s, backgroundColor: "#1a4a08", borderRadius: 2 }} />
      <View style={{ width: 18 * s, height: 22 * s, backgroundColor: "#2d6e10", borderRadius: 4, alignItems: "center", justifyContent: "center" }}>
        <View style={{ flexDirection: "row", gap: 5 * s }}>
          <View style={{ width: 4 * s, height: 4 * s, backgroundColor: "#c8f078", borderRadius: 2 }} />
          <View style={{ width: 4 * s, height: 4 * s, backgroundColor: "#c8f078", borderRadius: 2 }} />
        </View>
      </View>
      <View style={{ width: 52 * s, height: 5 * s, backgroundColor: "#2d6e10", borderRadius: 3, marginTop: -14 * s }} />
      <View style={{ flexDirection: "row", gap: 6 * s, marginTop: 1 * s }}>
        <View style={{ width: 6 * s, height: 14 * s, backgroundColor: "#2d6e10", borderRadius: 2 }} />
        <View style={{ width: 6 * s, height: 14 * s, backgroundColor: "#2d6e10", borderRadius: 2 }} />
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states — mirrors web's showManageModal / showAddDeviceModal / showEditModal
  const [manageVisible, setManageVisible] = useState(false);
  const [addVisible, setAddVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [deviceToEdit, setDeviceToEdit] = useState<Device | null>(null);
  const [editForm, setEditForm] = useState({ name: "", location: "" });
  const [addForm, setAddForm] = useState({ name: "", location: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    setError(null);
    const [devResult, detResult] = await Promise.all([getDevices(), getDetections()]);
    if (devResult.error) setError(devResult.error);
    else setDevices(devResult.data ?? []);
    if (!detResult.error) setDetections(detResult.data ?? []);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  // ── Add device (mirrors web handleSubmitDevice) ───────────────
  const handleAddDevice = async () => {
    if (!addForm.name.trim() || !addForm.location.trim()) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    setSubmitting(true);
    const result = await createDevice({ name: addForm.name.trim(), location: addForm.location.trim() });
    setSubmitting(false);
    if (result.error) {
      Alert.alert("Error", `Failed to add device: ${result.error}`);
    } else {
      Alert.alert("Success", "Device added successfully!");
      setAddForm({ name: "", location: "" });
      setAddVisible(false);
      await fetchAll();
    }
  };

  // ── Edit device (mirrors web handleUpdateDevice) ──────────────
  const handleEditDevice = async () => {
    if (!deviceToEdit) return;
    if (!editForm.name.trim() || !editForm.location.trim()) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    setSubmitting(true);
    const result = await updateDevice(deviceToEdit.id, { name: editForm.name.trim(), location: editForm.location.trim() });
    setSubmitting(false);
    if (result.error) {
      Alert.alert("Error", `Failed to update device: ${result.error}`);
    } else {
      Alert.alert("Success", `Device "${deviceToEdit.name}" updated successfully!`);
      setEditVisible(false);
      setDeviceToEdit(null);
      await fetchAll();
    }
  };

  // ── Delete device (mirrors web handleDeleteClick) ─────────────
  const handleDeleteDevice = (device: Device) => {
    Alert.alert(
      "Delete Device",
      `Are you sure you want to delete "${device.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result = await deleteDevice(device.id);
            if (result.error) {
              Alert.alert("Error", `Failed to delete device: ${result.error}`);
            } else {
              Alert.alert("Success", `Device "${device.name}" deleted successfully!`);
              await fetchAll();
            }
          },
        },
      ]
    );
  };

  // ── Derived stats (mirrors web HomeScreen logic) ──────────────
  const firstDevice = devices[0];
  const today = new Date().toDateString();
  const todayDetections = detections.filter(
    (d) => d.detected_at && new Date(d.detected_at).toDateString() === today
  );

  // Species count
  const speciesCount: Record<string, number> = {};
  detections.forEach((d) => {
    const s = d.bird_species || "Unknown";
    speciesCount[s] = (speciesCount[s] || 0) + 1;
  });
  const speciesEntries = Object.entries(speciesCount).slice(0, 4);

  // Recent logs (last 5 detections, sorted)
  const recentLogs = [...detections]
    .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime())
    .slice(0, 5);

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
          {/* ── Header ── */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Home</Text>
              <Text style={styles.headerSubtitle}>Welcome back, Farm Owner</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => setAddVisible(true)}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          )}

          {/* ── Connection Card (mirrors web info-card) ── */}
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Ionicons name="wifi" size={20} color="#004E00" />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.cardLabel}>Connected to</Text>
                <Text style={styles.cardValue}>
                  {loading ? "…" : firstDevice ? firstDevice.name : "No devices"}
                </Text>
              </View>
            </View>
            <View style={styles.dividerVert} />
            <View style={styles.cardRow}>
              <Ionicons name="location-outline" size={18} color="#004E00" />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.cardLabel}>Total Devices</Text>
                <Text style={styles.cardValueLg}>{loading ? "…" : devices.length}</Text>
              </View>
            </View>
          </View>

          {/* ── Device Overview (mirrors web section-card) ── */}
          {loading && <Text style={styles.loadingText}>Loading…</Text>}

          {!loading && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Device Overview</Text>
                <TouchableOpacity onPress={() => setManageVisible(true)}>
                  <Text style={styles.sectionLink}>Manage ›</Text>
                </TouchableOpacity>
              </View>

              {devices.length === 0 && (
                <Text style={styles.emptyText}>No devices registered yet.</Text>
              )}

              {devices.map((device) => {
                const isActive = device.status === "active" || device.status === "online";
                return (
                  <View key={device.id} style={styles.deviceRow}>
                    <View style={styles.deviceIconWrap}>
                      <ScarecrowIcon size={32} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.deviceName}>{device.name}</Text>
                      <View style={styles.statusContainer}>
                        <View style={[styles.statusDot, { backgroundColor: isActive ? "#4a9a2e" : "#D32F2F" }]} />
                        <Text style={[styles.deviceStatus, { color: isActive ? "#4a9a2e" : "#D32F2F" }]}>
                          {isActive ? "Active" : "Inactive"}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#004E00" />
                  </View>
                );
              })}

              {/* ── Bird Detection Banner ── */}
              <View style={styles.birdBanner}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 18 }}>🐦</Text>
                  <Text style={styles.birdBannerText}>
                    <Text style={styles.birdCount}>{todayDetections.length} Birds</Text> Today
                  </Text>
                </View>
                <Text style={styles.birdBannerText}>
                  <Text style={styles.birdCount}>{detections.length}</Text> Total
                </Text>
              </View>

              {/* ── Species Grid ── */}
              {speciesEntries.length > 0 && (
                <View style={styles.speciesGrid}>
                  {speciesEntries.map(([species, count]) => (
                    <View key={species} style={styles.speciesCard}>
                      <Text style={{ fontSize: 22 }}>🐦</Text>
                      <View style={{ marginLeft: 8 }}>
                        <Text style={styles.speciesCount}>{count} {species}</Text>
                        <Text style={styles.speciesSub}>Detected</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ── Recent Activity Log (mirrors web HomeScreen recentLogs) ── */}
          {!loading && recentLogs.length > 0 && (
            <View style={[styles.section, { marginBottom: 100 }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Activity Log</Text>
                <TouchableOpacity>
                  <Text style={styles.sectionLink}>View All ›</Text>
                </TouchableOpacity>
              </View>

              {recentLogs.map((log, i) => {
                const time = log.detected_at
                  ? new Date(log.detected_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "—";
                const date = log.detected_at ? new Date(log.detected_at).toLocaleDateString() : "";
                return (
                  <View key={i} style={styles.logRow}>
                    <View style={styles.logIconCircle}>
                      <Text style={{ fontSize: 16 }}>🐦</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <Text style={styles.logTime}>{time}</Text>
                        <Text style={styles.logLabel}>{log.bird_species || "Bird"} Detected</Text>
                      </View>
                      <Text style={styles.logAgo}>{date}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#004E00" />
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* ════ ADD DEVICE MODAL (mirrors web showAddDeviceModal) ════ */}
      <Modal visible={addVisible} transparent animationType="fade" onRequestClose={() => setAddVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Device</Text>
              <TouchableOpacity onPress={() => setAddVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>Device Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., North Field Scarecrow"
              value={addForm.name}
              onChangeText={(t) => setAddForm((f) => ({ ...f, name: t }))}
            />
            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., North Field"
              value={addForm.location}
              onChangeText={(t) => setAddForm((f) => ({ ...f, location: t }))}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setAddVisible(false)}>
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={handleAddDevice} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnPrimaryText}>Add Device</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ════ MANAGE DEVICES MODAL (mirrors web showManageModal) ════ */}
      <Modal visible={manageVisible} transparent animationType="fade" onRequestClose={() => setManageVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "80%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage Devices</Text>
              <TouchableOpacity onPress={() => setManageVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {devices.length === 0 && (
                <Text style={styles.emptyText}>No devices available.</Text>
              )}
              {devices.map((device) => (
                <View key={device.id} style={styles.manageDeviceItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.manageDeviceName}>{device.name}</Text>
                    <Text style={styles.manageDeviceLocation}>{device.location}</Text>
                    <Text style={[styles.manageDeviceStatus, { color: device.status === "active" ? "#4a9a2e" : "#808080" }]}>
                      {device.status === "active" ? "🟢 Active" : "⚫ Inactive"}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "#2196F3" }]}
                      onPress={() => {
                        setManageVisible(false);
                        setDeviceToEdit(device);
                        setEditForm({ name: device.name, location: device.location });
                        setEditVisible(true);
                      }}
                    >
                      <Text style={styles.actionBtnText}>EDIT</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "#D32F2F" }]}
                      onPress={() => {
                        setManageVisible(false);
                        handleDeleteDevice(device);
                      }}
                    >
                      <Text style={styles.actionBtnText}>DELETE</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ════ EDIT DEVICE MODAL (mirrors web showEditModal) ════ */}
      <Modal visible={editVisible} transparent animationType="fade" onRequestClose={() => setEditVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Device</Text>
              <TouchableOpacity onPress={() => setEditVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>Device Name</Text>
            <TextInput
              style={styles.input}
              value={editForm.name}
              onChangeText={(t) => setEditForm((f) => ({ ...f, name: t }))}
            />
            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={styles.input}
              value={editForm.location}
              onChangeText={(t) => setEditForm((f) => ({ ...f, location: t }))}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setEditVisible(false)}>
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={handleEditDevice} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnPrimaryText}>Update Device</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, width: "100%", height: "100%" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(200,230,160,0.18)" },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 24, fontFamily: "Poppins-Bold", color: "#1a3a0d" },
  headerSubtitle: { fontSize: 12, fontFamily: "Poppins-Regular", color: "#808080", marginTop: 2 },
  addBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#004E00", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#080647" },

  errorBanner: { marginBottom: 10, backgroundColor: "rgba(211,47,47,0.1)", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: "#D32F2F" },
  errorText: { fontSize: 12, fontFamily: "Poppins-Regular", color: "#D32F2F" },
  loadingText: { fontSize: 13, fontFamily: "Poppins-Regular", color: "#808080", textAlign: "center", paddingVertical: 8 },
  emptyText: { fontSize: 13, fontFamily: "Poppins-Regular", color: "#808080", textAlign: "center", paddingVertical: 8 },

  // Info card (mirrors web info-card)
  card: {
    flexDirection: "row", backgroundColor: "rgba(249, 255, 161, .8)", borderRadius: 14,
    padding: 14, marginBottom: 14, borderWidth: 1.5, borderColor: "rgba(249, 255, 161, 1)",
    alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  cardRow: { flex: 1, flexDirection: "row", alignItems: "center" },
  dividerVert: { width: 1.5, height: 36, backgroundColor: "rgba(200,232,144,0.6)" },
  cardLabel: { fontSize: 10, fontFamily: "Poppins-Regular", color: "#808080" },
  cardValue: { fontSize: 13, fontFamily: "Poppins-SemiBold", color: "#1a3a0d" },
  cardValueLg: { fontSize: 18, fontFamily: "Poppins-Bold", color: "#004E00" },

  // Section card (mirrors web section-card)
  section: {
    backgroundColor: "rgba(249, 255, 161, 0.8)", borderRadius: 14, padding: 14, marginBottom: 14,
    borderWidth: 1.5, borderColor: "#c8e890", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontFamily: "Poppins-SemiBold", color: "#1a3a0d" },
  sectionLink: { fontSize: 12, fontFamily: "Poppins-Medium", color: "#004E00" },

  // Device row (mirrors web device-row)
  deviceRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: "rgba(200,232,144,0.3)",
    borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: "#b8dc88",
  },
  deviceIconWrap: { width: 46, height: 46, borderRadius: 12, backgroundColor: "rgba(200,232,144,0.5)", alignItems: "center", justifyContent: "center" },
  deviceName: { fontSize: 13, fontFamily: "Poppins-SemiBold", color: "#1a3a0d" },
  statusContainer: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  deviceStatus: { fontSize: 11, fontFamily: "Poppins-Regular" },

  // Bird banner (mirrors web bird-banner)
  birdBanner: {
    backgroundColor: "rgba(180, 220, 100, 0.35)", borderRadius: 12, padding: 12,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginTop: 10, marginBottom: 12, borderWidth: 1, borderColor: "#b8dc88",
  },
  birdBannerText: { fontSize: 13, fontFamily: "Poppins-Regular", color: "#1a3a0d" },
  birdCount: { fontFamily: "Poppins-Bold", color: "#004E00" },

  // Species grid (mirrors web species-grid)
  speciesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  speciesCard: {
    flex: 1, minWidth: "45%", flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(200,232,144,0.3)", borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: "#b8dc88",
  },
  speciesCount: { fontSize: 12, fontFamily: "Poppins-SemiBold", color: "#1a3a0d" },
  speciesSub: { fontSize: 9, fontFamily: "Poppins-Regular", color: "#808080" },

  // Log rows (mirrors web log-row)
  logRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: "rgba(200,232,144,0.3)",
    borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#b8dc88",
  },
  logIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(180,220,100,0.4)", alignItems: "center", justifyContent: "center" },
  logTime: { fontSize: 11, fontFamily: "Poppins-Regular", color: "#808080" },
  logLabel: { fontSize: 13, fontFamily: "Poppins-SemiBold", color: "#1a3a0d" },
  logAgo: { fontSize: 10, fontFamily: "Poppins-Regular", color: "#808080", marginTop: 2 },

  // ── Modal styles (mirrors web modal-overlay / modal-content) ──
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { backgroundColor: "#fff", borderRadius: 16, padding: 24, width: "100%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: "Poppins-Bold", color: "#004E00" },
  inputLabel: { fontSize: 12, fontFamily: "Poppins-SemiBold", color: "#333", marginBottom: 6, marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, fontFamily: "Poppins-Regular", fontSize: 14, color: "#1a3a0d", marginBottom: 14 },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 8 },
  btnPrimary: { backgroundColor: "#004E00", borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18, minWidth: 80, alignItems: "center" },
  btnPrimaryText: { color: "#fff", fontFamily: "Poppins-SemiBold", fontSize: 14 },
  btnSecondary: { backgroundColor: "#f0f0f0", borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18 },
  btnSecondaryText: { fontFamily: "Poppins-Medium", fontSize: 14, color: "#333" },

  // Manage modal device item (mirrors web manage-device-item)
  manageDeviceItem: {
    flexDirection: "row", alignItems: "center", padding: 14,
    borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 10,
    backgroundColor: "#f9f9f9", marginBottom: 12,
  },
  manageDeviceName: { fontSize: 15, fontFamily: "Poppins-SemiBold", color: "#004E00", marginBottom: 2 },
  manageDeviceLocation: { fontSize: 12, fontFamily: "Poppins-Regular", color: "#666", marginBottom: 4 },
  manageDeviceStatus: { fontSize: 12, fontFamily: "Poppins-Regular" },
  actionBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  actionBtnText: { color: "#fff", fontFamily: "Poppins-SemiBold", fontSize: 12 },
});