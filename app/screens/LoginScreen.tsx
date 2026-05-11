// mobile/app/screens/LoginScreen.tsx

import React, { useState, useEffect, useRef } from "react";
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
  Animated,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loginUser } from "../lib/authService";

// ─── Floating label input ─────────────────────────────────────────
function FloatingInput({
  label,
  value,
  onChangeText,
  keyboardType,
  secureEntry,
  editable = true,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: any;
  secureEntry?: boolean;
  editable?: boolean;
  error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  const handleFocus = () => {
    setFocused(true);
    Animated.timing(labelAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
  };

  const handleBlur = () => {
    setFocused(false);
    if (!value) {
      Animated.timing(labelAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
    }
  };

  const labelTop    = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [14, -8] });
  const labelSize   = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 11] });
  const labelColor  = error ? "#D32F2F" : focused ? "#004E00" : "#808080";
  const borderColor = error ? "#D32F2F" : focused ? "#004E00" : "rgba(8,6,71,0.35)";

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
          autoCapitalize="none"
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
  wrapper: { marginBottom: 20 },
  box: {
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 12,
    borderWidth: 1.5,
    height: 64,
    paddingHorizontal: 14,
    justifyContent: "center",
    position: "relative",
  },
  floatLabel: {
    marginTop: 4,
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

// ─── Main Screen ──────────────────────────────────────────────────
export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword]       = useState("");
  const [loading, setLoading]         = useState(false);
  const [errors, setErrors]           = useState<{ phone?: string; password?: string }>({});
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string }>();

  useEffect(() => {
    if (params.phone) setPhoneNumber(params.phone);
  }, [params.phone]);

  const validate = () => {
    const e: typeof errors = {};
    if (!phoneNumber.trim())        e.phone    = "Phone number is required";
    else if (phoneNumber.length < 10) e.phone  = "Enter a valid phone number";
    if (!password.trim())           e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data, error } = await loginUser(phoneNumber.trim(), password);
      if (error) {
        setErrors({ phone: " ", password: error });
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
      source={require("../../assets/images/login-bg.png")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>LOG IN NOW</Text>
            <Text style={styles.subtitle}>
              Please log in to your account to continue using the app
            </Text>

            <View style={styles.form}>
              <FloatingInput
                label="Phone Number"
                value={phoneNumber}
                onChangeText={(t) => { setPhoneNumber(t); setErrors((e) => ({ ...e, phone: undefined })); }}
                keyboardType="phone-pad"
                editable={!loading}
                error={errors.phone}
              />
              <FloatingInput
                label="Password"
                value={password}
                onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined })); }}
                secureEntry
                editable={!loading}
                error={errors.password}
              />

              <TouchableOpacity style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <Text style={styles.loginButtonText}>LOG IN</Text>}
            </TouchableOpacity>

            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/screens/SignupScreen")} disabled={loading}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.socialBtn} onPress={() => Alert.alert("Info", "Facebook login coming soon!")}>
                <Image source={require("../../assets/images/fb-icon.png")} style={styles.socialIcon} resizeMode="contain" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn} onPress={() => Alert.alert("Info", "Google login coming soon!")}>
                <Image source={require("../../assets/images/gmail-icon.png")} style={styles.socialIcon} resizeMode="contain" />
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
  content: {
    flexGrow: 1,
    paddingHorizontal: 8,
    paddingTop: 260,
    paddingBottom: 40,
    justifyContent: "center",
  },

  title: {
    fontSize: 26, fontFamily: "Poppins-Bold", color: "#1a3a0d",
    marginBottom: 6, textAlign: "center",
  },
  subtitle: {
    fontSize: 12, fontFamily: "Poppins-Regular", color: "#4a4a4a",
    marginBottom: 28, textAlign: "center", lineHeight: 20,
  },

  form: { marginBottom: 4 },

  forgotBtn: { alignSelf: "flex-end", marginTop: -10, marginBottom: 24 },
  forgotText: { fontSize: 12, fontFamily: "Poppins-Medium", color: "#004E00" },

  loginButton: {
    backgroundColor: "#004E00",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
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
  loginButtonText: { color: "#FFFFFF", fontSize: 15, fontFamily: "Poppins-SemiBold", letterSpacing: 1 },

  signUpContainer: { flexDirection: "row", justifyContent: "center", marginBottom: 20 },
  signUpText: { color: "#808080", fontSize: 13, fontFamily: "Poppins-Regular" },
  signUpLink: { color: "#004E00", fontSize: 13, fontFamily: "Poppins-SemiBold" },

  dividerRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(0,0,0,0.12)" },
  orText: { fontSize: 12, fontFamily: "Poppins-Regular", color: "#808080" },

  socialContainer: { flexDirection: "row", justifyContent: "center", gap: 16 },
  socialBtn: {
    width: 54, height: 54, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderWidth: 1.5, borderColor: "rgba(8,6,71,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  socialIcon: { width: 30, height: 30 },
});