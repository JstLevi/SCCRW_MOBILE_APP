// mobile/app/screens/LoginScreen.tsx
// Mirrors web: src/screens/LoginScreen.jsx
// Background image + glassmorphism card via BlurView (expo-blur)

import React, { useState, useEffect } from "react";
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
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loginUser } from "../lib/authService";

// ─── Form input (mirrors web .form-group / .form-input) ──────────
function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureEntry,
  editable = true,
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: any;
  secureEntry?: boolean;
  editable?: boolean;
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
          autoCapitalize="none"
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
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
  wrapFocused: {
    borderColor: "#004E00",
    backgroundColor: "rgba(255,255,255,0.75)",
  },
  input: {
    flex: 1,
    height: 46,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#1a3a0d",
  },
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

// ─── Main Screen ──────────────────────────────────────────────────
export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string }>();

  useEffect(() => {
    if (params.phone) setUsername(params.phone);
  }, [params.phone]);

  const handleLogin = async () => {
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const { data, error: loginError } = await loginUser(username.trim(), password);
      if (loginError) {
        setError(loginError);
      } else {
        router.replace("../(tabs)/Home");
      }
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

          
              {/* Inner overlay for extra tint control */}
              <View style={s.cardOverlay}>

                {/* Logo row (mirrors web .auth-logo) */}
                <View style={s.logoRow}>
                  <Image
                    source={require("../../assets/images/main-logo.png")}
                    style={s.logoImg}
                    resizeMode="contain"
                  />
                  <Text style={s.logoText}>
                    Scare<Text style={s.logoAccent}>Crow</Text>
                  </Text>
                </View>

            
                <FormInput
                  label="PHONE NUMBER"
                  value={username}
                  onChangeText={setUsername}
                  placeholder="(eg., 09067541234)"
                  keyboardType="phone-pad"
                  editable={!loading}
                />

                <FormInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  secureEntry
                  editable={!loading}
                />

                {/* Forgot (mirrors web .forgot-row) */}
                <TouchableOpacity style={s.forgotRow}>
                  <Text style={s.forgotText}>Forgot password?</Text>
                </TouchableOpacity>

                {/* Error (mirrors web .error-box) */}
                {!!error && (
                  <View style={s.errorBox}>
                    <Text style={s.errorText}>{error}</Text>
                  </View>
                )}

                {/* Submit (mirrors web .btn-primary) */}
                <TouchableOpacity
                  style={[s.btnPrimary, loading && s.btnDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={s.btnPrimaryText}>LOG IN</Text>
                  }
                </TouchableOpacity>

                {/* Footer (mirrors web .auth-footer-link) */}
                <View style={s.footerRow}>
                  <Text style={s.footerText}>Don't have an account? </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/screens/SignupScreen")}
                    disabled={loading}
                  >
                    <Text style={s.footerLink}>Sign Up</Text>
                  </TouchableOpacity>
                </View>

                {/* Social (mirrors web .social-section) */}
                <View style={s.socialSection}>
                  <View style={s.dividerRow}>
                    <View style={s.divLine} />
                    <Text style={s.divText}>or continue with</Text>
                    <View style={s.divLine} />
                  </View>
                  <View style={s.socialBtns}>
                    <TouchableOpacity
                      style={s.socialBtn}
                      onPress={() => Alert.alert("Info", "Facebook login coming soon!")}
                    >
                      <Image
                        source={require("../../assets/images/fb-icon.png")}
                        style={s.socialIcon}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.socialBtn}
                      onPress={() => Alert.alert("Info", "Google login coming soon!")}
                    >
                      <Image
                        source={require("../../assets/images/gmail-icon.png")}
                        style={s.socialIcon}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  </View>
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

  cardOverlay: {
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

  // Logo — matches web .auth-logo
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 28,
  },
  logoImg: { width: 82, height: 82, borderRadius: 12 },
  logoText: { fontSize: 30, fontFamily: "Poppins-Bold", color: "#1a3a0d" },
  logoAccent: { color: "#004E00" },


  // Forgot — matches web .forgot-row
  forgotRow: { alignSelf: "flex-end", marginTop: -4, marginBottom: 12 },
  forgotText: { fontSize: 12, fontFamily: "Poppins-Medium", color: "#004E00" },

  // Error — matches web .error-box
  errorBox: {
    backgroundColor: "rgba(211,47,47,0.1)",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  errorText: { fontSize: 12, fontFamily: "Poppins-Regular", color: "#c62828" },

  // Button — matches web .btn-primary
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
  btnPrimaryText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Poppins-Bold",
    letterSpacing: 0.5,
  },

  // Footer — matches web .auth-footer-link
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  footerText: { fontSize: 13, fontFamily: "Poppins-Regular", color: "#555" },
  footerLink: {
    fontSize: 13,
    fontFamily: "Poppins-SemiBold",
    color: "#004E00",
    textDecorationLine: "underline",
  },

  // Social — matches web .social-section
  socialSection: { marginTop: 20 },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 6,
  },
  divLine: { flex: 1, height: 1, backgroundColor: "rgba(0,78,0,0.15)" },
  divText: { fontSize: 12, fontFamily: "Poppins-Regular", color: "#808080" },
  socialBtns: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
  },
  socialBtn: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderWidth: 1.5,
    borderColor: "rgba(0,78,0,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  socialIcon: { width: 28, height: 28 },
});