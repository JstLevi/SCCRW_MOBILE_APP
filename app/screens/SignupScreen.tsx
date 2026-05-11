// mobile/app/screens/SignupScreen.tsx
// Mirrors web: src/screens/SignupScreen.jsx
// Background image + glassmorphism card (plain semi-transparent View, matches LoginScreen)

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { registerUser } from "../lib/authService";

// ─── Form input ───────────────────────────────────────────────────
function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureEntry,
  editable = true,
  autoCapitalize = "none",
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: any;
  secureEntry?: boolean;
  editable?: boolean;
  autoCapitalize?: "none" | "words" | "sentences" | "characters";
  hint?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={iS.group}>
      <Text style={iS.label}>{label}</Text>
      <View style={[iS.wrap, focused && iS.wrapFocused]}>
        <TextInput
          style={iS.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#808080"
          keyboardType={keyboardType}
          secureTextEntry={secureEntry && !showPassword}
          autoCapitalize={autoCapitalize}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={secureEntry ? "new-password" : "off"}
        />
        {secureEntry && (
          <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={iS.eye}>
            <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#6b7c61" />
          </TouchableOpacity>
        )}
      </View>
      {hint ? <Text style={iS.hint}>{hint}</Text> : null}
    </View>
  );
}

const iS = StyleSheet.create({
  group: { marginBottom: 14 },
  label: {
    fontSize: 11,
    fontFamily: "Poppins-SemiBold",
    color: "#004E00",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1.5,
    borderColor: "rgba(0,78,0,0.25)",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  wrapFocused: { borderColor: "#004E00", backgroundColor: "rgba(255,255,255,0.75)" },
  input: { flex: 1, height: 46, fontSize: 14, fontFamily: "Poppins-Regular", color: "#1a3a0d" },
  eye: { padding: 4 },
  hint: {
    fontSize: 11,
    fontFamily: "Poppins-Regular",
    color: "#004E00",
    fontStyle: "italic",
    marginTop: 5,
    paddingLeft: 4,
  },
});

// ─── Section label ────────────────────────────────────────────────
function SectionLabel({ children }: { children: string }) {
  return (
    <View style={secS.row}>
      <Text style={secS.text}>{children}</Text>
      <View style={secS.line} />
    </View>
  );
}
const secS = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 18,
    marginBottom: 10,
  },
  text: {
    fontSize: 11,
    fontFamily: "Poppins-Bold",
    color: "#004E00",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  line: { flex: 1, height: 1, backgroundColor: "rgba(0,78,0,0.2)" },
});

// ─── Password strength ────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 6)            score++;
  if (password.length >= 10)           score++;
  if (/[A-Z]/.test(password))          score++;
  if (/[0-9]/.test(password))          score++;
  if (/[^A-Za-z0-9]/.test(password))  score++;
  const labels = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"];
  const colors = ["", "#D32F2F", "#FF8C00", "#FFA000", "#4a9a2e", "#004E00"];
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: -6, marginBottom: 10 }}>
      <View style={{ flexDirection: "row", gap: 3, flex: 1 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <View
            key={i}
            style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i < score ? colors[score] : "rgba(0,0,0,0.1)" }}
          />
        ))}
      </View>
      <Text style={{ fontSize: 10, fontFamily: "Poppins-Medium", color: colors[score], minWidth: 65, textAlign: "right" }}>
        {labels[score]}
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────
export default function SignUpScreen() {
  const [form, setForm] = useState({
    name: "", contactNumber: "", province: "",
    municipality: "", barangay: "", password: "", confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const router = useRouter();

  const set = (key: keyof typeof form) => (val: string) =>
    setForm(f => ({ ...f, [key]: val }));

  const handleSignUp = async () => {
    setError("");
    const { name, contactNumber, province, password, confirmPassword } = form;

    if (!name || !contactNumber || !province || !password || !confirmPassword) {
      setError("Please fill in all required fields."); return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters."); return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match."); return;
    }
    if (contactNumber.length < 10) {
      setError("Please enter a valid contact number (at least 10 digits)."); return;
    }

    setLoading(true);
    try {
      const { error: regError } = await registerUser({
        username: contactNumber.trim(),
        password,
        full_name: name.trim(),
        contact_number: contactNumber.trim(),
        province: form.province.trim(),
        municipality: form.municipality.trim(),
        barangay: form.barangay.trim(),
      });

      if (regError) { setError(regError); return; }

      Alert.alert("Success", "Account created successfully!", [
        {
          text: "Log In Now",
          onPress: () => router.replace({
            pathname: "/screens/LoginScreen",
            params: { phone: contactNumber.trim() },
          }),
        },
      ]);
    } catch {
      Alert.alert("Error", "Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/images/L_S_bg.png")}
      style={s.bg}
      resizeMode="cover"
    >
      <SafeAreaView style={s.root}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView
            contentContainerStyle={s.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

            {/* ── Glass Card ── */}
            <View style={s.card}>

              {/* Logo */}
              <View style={s.logoRow}>
                <Image
                  source={require("../../assets/images/main-logo.png")}
                  style={s.logoImg}
                  resizeMode="contain"
                />
                <Text style={s.logoText}>Scare<Text style={s.logoAccent}>Crow</Text></Text>
              </View>

              <Text style={s.title}>SIGN UP</Text>
              <Text style={s.subtitle}>Please fill in the details</Text>

              {/* Personal info */}
              <FormInput
                label="Full Name *"
                value={form.name}
                onChangeText={set("name")}
                placeholder="(eg., Juan Dela Cruz)"
                autoCapitalize="words"
                editable={!loading}
              />

              <FormInput
                label="Contact Number *"
                value={form.contactNumber}
                onChangeText={set("contactNumber")}
                placeholder="(e.g., 09123456789)"
                keyboardType="phone-pad"
                editable={!loading}
                hint={form.contactNumber.length > 0 ? `You'll use ${form.contactNumber} to log in` : undefined}
              />

              {/* Address */}
              <SectionLabel>Address</SectionLabel>

              <View style={s.grid}>
                <View style={{ flex: 1 }}>
                  <FormInput
                    label="Province *"
                    value={form.province}
                    onChangeText={set("province")}
                    placeholder="PROVINCE"
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <FormInput
                    label="Municipality / City"
                    value={form.municipality}
                    onChangeText={set("municipality")}
                    placeholder="(Optional)"
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>
              </View>

              <FormInput
                label="Barangay"
                value={form.barangay}
                onChangeText={set("barangay")}
                placeholder="(Optional)"
                autoCapitalize="words"
                editable={!loading}
              />

              {/* Password */}
              <FormInput
                label="Create Password *"
                value={form.password}
                onChangeText={set("password")}
                placeholder="CREATE PASSWORD "
                secureEntry
                editable={!loading}
              />
              <PasswordStrength password={form.password} />

              <FormInput
                label="Confirm Password *"
                value={form.confirmPassword}
                onChangeText={set("confirmPassword")}
                placeholder="CONFIRM PASSWORD"
                secureEntry
                editable={!loading}
                hint={
                  form.confirmPassword && form.password !== form.confirmPassword
                    ? "Passwords do not match"
                    : undefined
                }
              />

              {/* Error */}
              {!!error && (
                <View style={s.errorBox}>
                  <Text style={s.errorText}>⚠ {error}</Text>
                </View>
              )}

              {/* Submit */}
              <TouchableOpacity
                style={[s.btnPrimary, loading && s.btnDisabled]}
                onPress={handleSignUp}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.btnPrimaryText}>SIGN UP</Text>
                }
              </TouchableOpacity>

              {/* Footer */}
              <View style={s.footerRow}>
                <Text style={s.footerText}>Already have an account? </Text>
                <TouchableOpacity
                  onPress={() => router.replace("/screens/LoginScreen")}
                  disabled={loading}
                >
                  <Text style={s.footerLink}>Log In</Text>
                </TouchableOpacity>
              </View>

            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, width: "100%", height: "100%" },

  root: { flex: 1 },

  scroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 32,
  },

  // ── Glass card — matches LoginScreen ──
  card: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    padding: 32,
    maxWidth: 440,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,

  },

  // Logo
  logoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 28 },
  logoImg: { width: 52, height: 52, borderRadius: 12 },
  logoText: { fontSize: 22, fontFamily: "Poppins-Bold", color: "#1a3a0d" },
  logoAccent: { color: "#004E00" },

  // Title / subtitle
  title: { fontSize: 26, fontFamily: "Poppins-Bold", color: "#1a3a0d", marginBottom: 6 },
  subtitle: { fontSize: 13, fontFamily: "Poppins-Regular", color: "#555", marginBottom: 28 },

  // Grid (2 columns)
  grid: { flexDirection: "row", gap: 12 },

  // Error
  errorBox: {
    backgroundColor: "rgba(211,47,47,0.1)",
    borderRadius: 8,
    padding: 10,
    marginTop: 16,
    marginBottom: 4,
  },
  errorText: { fontSize: 12, fontFamily: "Poppins-Regular", color: "#c62828" },

  // Button
  btnPrimary: {
    backgroundColor: "#004E00",
    borderWidth: 1.5,
    borderColor: "#080647",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#004E00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: { color: "#fff", fontSize: 15, fontFamily: "Poppins-Bold", letterSpacing: 0.5 },

  // Footer
  footerRow: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  footerText: { fontSize: 13, fontFamily: "Poppins-Regular", color: "#555" },
  footerLink: {
    fontSize: 13,
    fontFamily: "Poppins-SemiBold",
    color: "#004E00",
    textDecorationLine: "underline",
  },
});