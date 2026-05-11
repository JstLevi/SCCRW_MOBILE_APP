// mobile/app/(tabs)/settings.tsx
// Mirrors web: src/screens/SettingsScreen.jsx
// ADDED: user info card at the top (same as web)

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ImageBackground,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { logoutUser } from "../lib/authService";
import { getStoredUser } from "../lib/api";

interface StoredUser {
  id: number;
  username: string;
  full_name?: string;
}

export default function SettingsScreen() {
  const [loading, setLoading] = React.useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    getStoredUser().then(setUser);
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await logoutUser();
              router.replace("/screens/LoginScreen");
            } catch {
              Alert.alert("Error", "Something went wrong. Please try again.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Mirrors web settingsItems array
  const settingsItems = [
    { icon: "person-outline" as const,          label: "Account" },
    { icon: "notifications-outline" as const,   label: "Notifications" },
    { icon: "lock-closed-outline" as const,     label: "Privacy" },
    { icon: "help-circle-outline" as const,     label: "Help & Support" },
  ];

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.username?.[0]?.toUpperCase() ?? "U";

  return (
    <ImageBackground
      source={require("../../assets/images/tabs-bg.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Settings</Text>
          </View>

          {/* ── User Info Card (mirrors web info-card block in SettingsScreen) ── */}
          {user && (
            <View style={styles.userCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.userName}>{user.full_name || user.username}</Text>
                <Text style={styles.userRole}>Farm Owner</Text>
              </View>
            </View>
          )}

          {/* ── Settings Options (mirrors web settingsItems) ── */}
          <View style={styles.section}>
            {settingsItems.map((item, i) => (
              <View key={i}>
                <TouchableOpacity style={styles.settingRow}>
                  <View style={styles.settingIconWrap}>
                    <Ionicons name={item.icon} size={18} color="#004E00" />
                  </View>
                  <Text style={styles.settingText}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#808080" />
                </TouchableOpacity>
                {i < settingsItems.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>

          {/* ── Log Out Button (mirrors web action-btn outline) ── */}
          <TouchableOpacity
            style={[styles.logoutButton, loading && styles.logoutButtonDisabled]}
            onPress={handleLogout}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#1a3a0d" size="small" />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={22} color="#1a3a0d" style={{ marginRight: 8 }} />
                <Text style={styles.logoutText}>Log Out</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: "100%", height: "100%" },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  header: {
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  headerTitle: { fontSize: 22, fontFamily: "Poppins-Bold", color: "#1a3a0d" },

  // User Info Card (mirrors web info-card in SettingsScreen)
  userCard: {
    flexDirection: "row", alignItems: "center",
    margin: 16, padding: 16,
    backgroundColor: "rgba(249, 255, 161, 0.8)",
    borderRadius: 14, borderWidth: 1.5, borderColor: "rgba(249, 255, 161, 1)",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  avatarCircle: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: "#004E00", alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "rgba(200,232,144,0.4)",
  },
  avatarText: { color: "#c8e890", fontFamily: "Poppins-Bold", fontSize: 18 },
  userName: { fontSize: 15, fontFamily: "Poppins-SemiBold", color: "#1a3a0d" },
  userRole: { fontSize: 11, fontFamily: "Poppins-Regular", color: "#808080" },

  // Settings section (mirrors web section-card)
  section: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: "rgba(249, 255, 161, 0.8)",
    borderRadius: 14, borderWidth: 1.5, borderColor: "#c8e890", overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  settingRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16 },
  settingIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(0,78,0,0.1)", alignItems: "center", justifyContent: "center" },
  settingText: { flex: 1, marginLeft: 12, fontSize: 14, fontFamily: "Poppins-Medium", color: "#1a3a0d" },
  divider: { height: 1, backgroundColor: "rgba(200,232,144,0.6)", marginHorizontal: 16 },

  // Logout button (mirrors web action-btn outline)
  logoutButton: {
    flexDirection: "row", marginHorizontal: 16,
    backgroundColor: "rgba(249, 255, 161, 0.8)",
    borderRadius: 14, paddingVertical: 14, alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "#004E00",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  logoutButtonDisabled: { opacity: 0.7 },
  logoutText: { color: "#1a3a0d", fontSize: 16, fontFamily: "Poppins-SemiBold", letterSpacing: 0.5 },
});