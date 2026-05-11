// mobile/app/screens/SignupScreen.tsx

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { registerUser } from "../lib/authService";

// ─── Floating label input (same as Login) ────────────────────────
function FloatingInput({
  label,
  value,
  onChangeText,
  keyboardType,
  secureEntry,
  editable = true,
  error,
  autoCapitalize = "none",
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: any;
  secureEntry?: boolean;
  editable?: boolean;
  error?: string;
  autoCapitalize?: "none" | "words" | "sentences" | "characters";
}) {
  const [focused, setFocused]         = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  const handleFocus = () => {
    setFocused(true);
    Animated.timing(labelAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
  };
  const handleBlur = () => {
    setFocused(false);
    if (!value) Animated.timing(labelAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
  };

  const labelTop   = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [14, -8] });
  const labelSize  = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 11] });
  const labelColor = error ? "#D32F2F" : focused ? "#004E00" : "#808080";
  const borderColor= error ? "#D32F2F" : focused ? "#004E00" : "rgba(8,6,71,0.35)";

  return (
    <View style={inputStyles.wrapper}>
      <View style={[inputStyles.box, { borderColor }]}>
        <Animated.Text style={[inputStyles.floatLabel, { top: labelTop, fontSize: labelSize, color: labelColor }]}>
          {label}
        </Animated.Text>
        <TextInput
          style={inputStyles.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          keyboardType={keyboardType}
          secureTextEntry={secureEntry && !showPassword}
          autoCapitalize={autoCapitalize}
          editable={editable}
        />
        {secureEntry && (
          <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={inputStyles.eyeBtn}>
            <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={18} color="#808080" />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={inputStyles.errorText}>{error}</Text> : null}
    </View>
  );
}

const inputStyles = StyleSheet.create({
  wrapper: { marginBottom: 18 },
  box: {
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 12,
    borderWidth: 1.5,
    height: 54,
    paddingHorizontal: 14,
    justifyContent: "center",
    position: "relative",
  },
  floatLabel: {
    position: "absolute",
    left: 14,
    backgroundColor: "transparent",
    fontFamily: "Poppins-Medium",
    zIndex: 1,
  },
  input: {
    fontSize: 15,
    fontFamily: "Poppins-Regular",
    color: "#1a3a0d",
    paddingTop: 10,
    paddingRight: 36,
  },
  eyeBtn: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  errorText: {
    fontSize: 11,
    fontFamily: "Poppins-Regular",
    color: "#D32F2F",
    marginTop: 4,
    marginLeft: 4,
  },
});

// ─── Password strength bar ────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const getStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6)  score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strength = getStrength();
  const label  = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"][strength] ?? "";
  const color  = ["", "#D32F2F", "#FF8C00", "#FFA000", "#4a9a2e", "#004E00"][strength] ?? "#ccc";
  const bars   = 5;

  if (!password) return null;

  return (
    <View style={strengthStyles.container}>
      <View style={strengthStyles.bars}>
        {Array.from({ length: bars }).map((_, i) => (
          <View
            key={i}
            style={[strengthStyles.bar, { backgroundColor: i < strength ? color : "rgba(0,0,0,0.1)" }]}
          />
        ))}
      </View>
      <Text style={[strengthStyles.label, { color }]}>{label}</Text>
    </View>
  );
}

const strengthStyles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: -10, marginBottom: 14 },
  bars: { flexDirection: "row", gap: 4, flex: 1 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  label: { fontSize: 11, fontFamily: "Poppins-Medium", minWidth: 70, textAlign: "right" },
});

// ─── Section label ────────────────────────────────────────────────
function SectionLabel({ children }: { children: string }) {
  return (
    <View style={sectionStyles.row}>
      <View style={sectionStyles.line} />
      <Text style={sectionStyles.text}>{children}</Text>
      <View style={sectionStyles.line} />
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16, marginTop: 4 },
  line: { flex: 1, height: 1, backgroundColor: "rgba(0,78,0,0.2)" },
  text: { fontSize: 11, fontFamily: "Poppins-SemiBold", color: "#004E00", letterSpacing: 0.5 },
});

// ─── Main Screen ──────────────────────────────────────────────────
export default function SignUpScreen() {
  const [name, setName]               = useState("");
  const [contactNumber, setContact]   = useState("");
  const [province, setProvince]       = useState("");
  const [municipality, setMuni]       = useState("");
  const [barangay, setBarangay]       = useState("");
  const [password, setPassword]       = useState("");
  const [loading, setLoading]         = useState(false);
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const router = useRouter();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim())            e.name     = "Name is required";
    if (!contactNumber.trim())   e.contact  = "Contact number is required";
    else if (contactNumber.length < 10) e.contact = "Enter at least 10 digits";
    if (!province.trim())        e.province = "Province is required";
    if (!password.trim())        e.password = "Password is required";
    else if (password.length < 6) e.password = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data, error } = await registerUser({
        username: contactNumber.trim(),
        password,
        full_name: name.trim(),
        contact_number: contactNumber.trim(),
        province: province.trim(),
        municipality: municipality.trim(),
        barangay: barangay.trim(),
      });

      if (error) {
        setErrors({ general: error });
        return;
      }

      Alert.alert("Success", "Account created successfully!", [
        {
          text: "Log In Now",
          onPress: () => router.replace({ pathname: "/screens/LoginScreen", params: { phone: contactNumber.trim() } }),
        },
      ]);
    } catch {
      Alert.alert("Error", "Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearError = (key: string) => setErrors((e) => { const c = { ...e }; delete c[key]; return c; });

  return (
    <ImageBackground
      source={require("../../assets/images/signup-bg.png")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>SIGN UP</Text>
            <Text style={styles.subtitle}>Fill in your details to get started</Text>

            {errors.general && (
              <View style={styles.generalError}>
                <Ionicons name="alert-circle-outline" size={16} color="#D32F2F" />
                <Text style={styles.generalErrorText}>{errors.general}</Text>
              </View>
            )}

            {/* Personal Info */}
            <SectionLabel>PERSONAL INFO</SectionLabel>

            <FloatingInput
              label="Full Name"
              value={name}
              onChangeText={(t) => { setName(t); clearError("name"); }}
              autoCapitalize="words"
              editable={!loading}
              error={errors.name}
            />
            <FloatingInput
              label="Contact Number"
              value={contactNumber}
              onChangeText={(t) => { setContact(t); clearError("contact"); }}
              keyboardType="phone-pad"
              editable={!loading}
              error={errors.contact}
            />

            {/* Address */}
            <SectionLabel>ADDRESS</SectionLabel>

            <FloatingInput
              label="Province"
              value={province}
              onChangeText={(t) => { setProvince(t); clearError("province"); }}
              autoCapitalize="words"
              editable={!loading}
              error={errors.province}
            />
            <FloatingInput
              label="Municipality / City (optional)"
              value={municipality}
              onChangeText={setMuni}
              autoCapitalize="words"
              editable={!loading}
            />
            <FloatingInput
              label="Barangay (optional)"
              value={barangay}
              onChangeText={setBarangay}
              autoCapitalize="words"
              editable={!loading}
            />

            {/* Security */}
            <SectionLabel>SECURITY</SectionLabel>

            <FloatingInput
              label="Create Password"
              value={password}
              onChangeText={(t) => { setPassword(t); clearError("password"); }}
              secureEntry
              editable={!loading}
              error={errors.password}
            />
            <PasswordStrength password={password} />

            {/* Submit */}
            <TouchableOpacity
              style={[styles.signUpButton, loading && styles.btnDisabled]}
              onPress={handleSignUp}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <Text style={styles.signUpButtonText}>CREATE ACCOUNT</Text>}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace("/screens/LoginScreen")} disabled={loading}>
                <Text style={styles.loginLink}>Log In</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: "100%", height: "100%" },
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1, paddingHorizontal: 28,
    paddingTop: 260, paddingBottom: 50,
  },

  title: {
    fontSize: 26, fontFamily: "Poppins-Bold", color: "#1a3a0d",
    textAlign: "center", marginBottom: 6,
  },
  subtitle: {
    fontSize: 12, fontFamily: "Poppins-Regular", color: "#4a4a4a",
    textAlign: "center", marginBottom: 28, lineHeight: 20,
  },

  generalError: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(211,47,47,0.08)",
    borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: "#D32F2F",
    marginBottom: 16,
  },
  generalErrorText: { fontSize: 13, fontFamily: "Poppins-Regular", color: "#D32F2F", flex: 1 },

  signUpButton: {
    backgroundColor: "#004E00",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: "#080647",
    shadowColor: "#004E00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  btnDisabled: { opacity: 0.65 },
  signUpButtonText: { color: "#FFFFFF", fontSize: 15, fontFamily: "Poppins-SemiBold", letterSpacing: 1 },

  loginContainer: { flexDirection: "row", justifyContent: "center" },
  loginText: { color: "#808080", fontSize: 13, fontFamily: "Poppins-Regular" },
  loginLink: { color: "#004E00", fontSize: 13, fontFamily: "Poppins-SemiBold" },
});