// mobile/app/(tabs)/live.tsx
// CHANGED: static device list → live from /api/devices/ via Django

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { getDevices, Device } from "../lib/deviceService";

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

function CameraCard({ device }: { device: Device }) {
  const isOnline = device.status === "active" || device.status === "online";
  return (
    <View style={styles.cameraCard}>
      <View style={styles.cameraHeader}>
        <View style={styles.cameraTitleContainer}>
          <MaterialIcons name="camera-alt" size={20} color="#004E00" />
          <Text style={styles.cameraTitle}>{device.name}</Text>
        </View>
        <View style={[styles.statusBadge, isOnline ? styles.onlineBadge : styles.offlineBadge]}>
          <View style={[styles.statusDot, isOnline ? styles.onlineDot : styles.offlineDot]} />
          <Text style={[styles.statusText, isOnline ? styles.onlineText : styles.offlineText]}>
            {isOnline ? "ONLINE" : "OFFLINE"}
          </Text>
        </View>
      </View>

      <View style={styles.cameraPreview}>
        <Ionicons name={isOnline ? "videocam-outline" : "videocam-off-outline"} size={40} color="#808080" />
        <Text style={styles.previewText}>{isOnline ? "Device Active" : "Camera Offline"}</Text>
      </View>

      <View style={styles.cameraFooter}>
        <Ionicons name="location-outline" size={14} color="#808080" />
        <Text style={styles.cameraLocation}>{device.location || "No location set"}</Text>
      </View>

      <TouchableOpacity style={styles.retryButton}>
        <Ionicons name="refresh-outline" size={16} color="#004E00" />
        <Text style={styles.retryText}>{isOnline ? "Refresh" : "Reconnect"}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function LiveScreen() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    setError(null);
    const result = await getDevices();
    if (result.error) setError(result.error);
    else setDevices(result.data ?? []);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchDevices().finally(() => setLoading(false));
  }, [fetchDevices]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDevices();
    setRefreshing(false);
  }, [fetchDevices]);

  const offlineCount = devices.filter((d) => d.status !== "active" && d.status !== "online").length;
  const onlineCount  = devices.filter((d) => d.status === "active" || d.status === "online").length;

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
              <Text style={styles.headerTitle}>Live Feed</Text>
              <Text style={styles.headerSubtitle}>Monitor your scarecrows in real-time</Text>
            </View>
            <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
              <Ionicons name="refresh" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Connection Status Card */}
          <View style={styles.card}>
            <View style={styles.connectionLeft}>
              <MaterialIcons
                name={offlineCount > 0 ? "wifi-off" : "wifi"}
                size={18}
                color={offlineCount > 0 ? "#D32F2F" : "#004E00"}
              />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.connLabel}>Connection Status</Text>
                <Text style={[styles.connValue, offlineCount > 0 ? { color: "#D32F2F" } : {}]}>
                  {loading ? "…" : `${offlineCount} Device${offlineCount !== 1 ? "s" : ""} Offline`}
                </Text>
              </View>
            </View>
            <View style={styles.dividerVert} />
            <View style={styles.connectionRight}>
              <Ionicons name="radio-outline" size={16} color="#004E00" />
              <View style={{ marginLeft: 4 }}>
                <Text style={styles.connLabel}>Online</Text>
                <Text style={styles.connValueLarge}>{loading ? "…" : onlineCount}</Text>
              </View>
            </View>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          )}

          {/* Camera Grid */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Cameras</Text>
              <TouchableOpacity>
                <Text style={styles.sectionLink}>View All &gt;</Text>
              </TouchableOpacity>
            </View>

            {loading && <Text style={styles.loadingText}>Loading devices…</Text>}
            {!loading && devices.length === 0 && <Text style={styles.loadingText}>No devices found.</Text>}
            {!loading && devices.map((d) => <CameraCard key={d.id} device={d} />)}
          </View>

          {/* Device Status Summary */}
          {!loading && devices.length > 0 && (
            <View style={[styles.section, { marginBottom: 100 }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Device Status</Text>
                <TouchableOpacity>
                  <Text style={styles.sectionLink}>Details &gt;</Text>
                </TouchableOpacity>
              </View>

              {devices.map((device, i) => {
                const isOnline = device.status === "active" || device.status === "online";
                return (
                  <View key={device.id}>
                    <View style={styles.deviceRow}>
                      <View style={styles.deviceIconWrap}>
                        <ScarecrowIcon size={36} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.deviceName}>{device.name}</Text>
                        <View style={styles.statusContainer}>
                          <View style={[styles.statusDotSmall, { backgroundColor: isOnline ? "#4a9a2e" : "#D32F2F" }]} />
                          <Text style={[styles.deviceStatusText, { color: isOnline ? "#4a9a2e" : "#D32F2F" }]}>
                            {isOnline ? "Online" : "Offline — No signal"}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {i < devices.length - 1 && <View style={styles.divider} />}
                  </View>
                );
              })}
            </View>
          )}
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
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 24, fontFamily: "Poppins-Bold", color: "#1a3a0d" },
  headerSubtitle: { fontSize: 12, fontFamily: "Poppins-Regular", color: "#808080", marginTop: 2 },
  refreshBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#004E00", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#080647" },
  card: {
    flexDirection: "row", backgroundColor: "rgba(249, 255, 161, .8)", borderRadius: 14,
    padding: 14, marginBottom: 14, borderWidth: 1.5, borderColor: "rgba(249, 255, 161, 1)",
    alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  connectionLeft: { flex: 1, flexDirection: "row", alignItems: "center" },
  connectionRight: { flex: 1, flexDirection: "row", alignItems: "center", paddingLeft: 12 },
  dividerVert: { width: 1.5, height: 36, backgroundColor: "rgba(200,232,144,0.6)" },
  connLabel: { fontSize: 10, fontFamily: "Poppins-Regular", color: "#808080" },
  connValue: { fontSize: 13, fontFamily: "Poppins-SemiBold", color: "#1a3a0d" },
  connValueLarge: { fontSize: 18, fontFamily: "Poppins-Bold", color: "#004E00" },
  errorBanner: { marginBottom: 10, backgroundColor: "rgba(211,47,47,0.1)", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: "#D32F2F" },
  errorText: { fontSize: 12, fontFamily: "Poppins-Regular", color: "#D32F2F" },
  loadingText: { fontSize: 13, fontFamily: "Poppins-Regular", color: "#808080", textAlign: "center", paddingVertical: 8 },
  section: { backgroundColor: "rgba(249, 255, 161, 0.8)", borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1.5, borderColor: "#c8e890", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontFamily: "Poppins-SemiBold", color: "#1a3a0d" },
  sectionLink: { fontSize: 12, fontFamily: "Poppins-Medium", color: "#004E00" },
  cameraCard: { backgroundColor: "rgba(200,232,144,0.3)", borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#b8dc88" },
  cameraHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  cameraTitleContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  cameraTitle: { fontSize: 13, fontFamily: "Poppins-SemiBold", color: "#1a3a0d" },
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  offlineBadge: { backgroundColor: "rgba(211, 47, 47, 0.1)" },
  onlineBadge:  { backgroundColor: "rgba(0, 78, 0, 0.1)" },
  statusDot:    { width: 6, height: 6, borderRadius: 3 },
  offlineDot:   { backgroundColor: "#D32F2F" },
  onlineDot:    { backgroundColor: "#004E00" },
  statusText:   { fontSize: 9, fontFamily: "Poppins-Medium" },
  offlineText:  { color: "#D32F2F" },
  onlineText:   { color: "#004E00" },
  cameraPreview: { height: 150, backgroundColor: "rgba(0,0,0,0.05)", borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 10, borderWidth: 1, borderColor: "#b8dc88", borderStyle: "dashed" },
  previewText: { fontSize: 12, fontFamily: "Poppins-Regular", color: "#808080", marginTop: 8 },
  cameraFooter: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 10 },
  cameraLocation: { fontSize: 11, fontFamily: "Poppins-Regular", color: "#808080" },
  retryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "rgba(0, 78, 0, 0.1)", paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#004E00" },
  retryText: { fontSize: 12, fontFamily: "Poppins-Medium", color: "#004E00" },
  deviceRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  deviceIconWrap: { width: 44, height: 44, borderRadius: 10, backgroundColor: "rgba(200,232,144,0.5)", alignItems: "center", justifyContent: "center" },
  deviceName: { fontSize: 13, fontFamily: "Poppins-SemiBold", color: "#1a3a0d" },
  statusContainer: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  statusDotSmall: { width: 6, height: 6, borderRadius: 3 },
  deviceStatusText: { fontSize: 11, fontFamily: "Poppins-Regular" },
  divider: { height: 1, backgroundColor: "#c8e890", marginVertical: 8 },
});