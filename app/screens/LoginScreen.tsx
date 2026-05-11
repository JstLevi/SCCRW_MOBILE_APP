// mobile/app/screens/LoginScreen.tsx
// CHANGED: supabase.auth.signInWithPassword → loginUser() from lib/authService

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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { loginUser } from "../lib/authService"; // ← was: supabase

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string }>();

  useEffect(() => {
    if (params.phone) setPhoneNumber(params.phone);
  }, [params.phone]);

  const handleLogin = async () => {
    if (!phoneNumber.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (phoneNumber.length < 10) {
      Alert.alert("Error", "Please enter a valid phone number");
      return;
    }

    setLoading(true);
    try {
      // Django uses the raw phone number as username (same as web)
      const { data, error } = await loginUser(phoneNumber.trim(), password);

      if (error) {
        Alert.alert("Login Failed", error);
      } else {
        router.replace("../(tabs)/Home");
      }
    } catch {
      Alert.alert("Error", "Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => router.push("/screens/SignupScreen");

  const handleSocialLogin = (provider: string) =>
    Alert.alert("Info", `${provider} login coming soon!`);

  return (
    <ImageBackground
      source={require("../../assets/images/login-bg.png")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>LOG IN NOW</Text>
          <Text style={styles.subtitle}>
            Please log-in your account to continue using our app
          </Text>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="#808080"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#808080"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>LOG IN</Text>
            )}
          </TouchableOpacity>

          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have account? </Text>
            <TouchableOpacity onPress={handleSignUp} disabled={loading}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.orContinueText}>or continue with</Text>

          <View style={styles.socialContainer}>
            <TouchableOpacity onPress={() => handleSocialLogin("Facebook")} disabled={loading}>
              <Image
                source={require("../../assets/images/fb-icon.png")}
                style={styles.socialIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleSocialLogin("Google")} disabled={loading}>
              <Image
                source={require("../../assets/images/gmail-icon.png")}
                style={styles.socialIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: "100%", height: "100%" },
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
  title: {
    fontSize: 25, fontFamily: "Poppins-Bold", color: "#1a3a0d",
    marginTop: 280, marginBottom: 5, textAlign: "center",
  },
  subtitle: {
    fontSize: 11, fontFamily: "Poppins-Regular", color: "#000000",
    marginTop: -10, marginBottom: 10, textAlign: "center",
    paddingHorizontal: 20, lineHeight: 20,
  },
  inputContainer: { marginBottom: 16 },
  inputWrapper: {
    backgroundColor: "rgba(255, 255, 255, 0.15)", borderRadius: 10,
    marginBottom: 12, borderWidth: 1.5, width: "95%", alignSelf: "center",
    height: 50, borderColor: "#080647",
  },
  input: {
    paddingHorizontal: 15, paddingVertical: 13,
    fontSize: 15, fontFamily: "Poppins-Regular", color: "#000000",
  },
  loginButton: {
    backgroundColor: "#004E00", borderRadius: 18, paddingVertical: 6,
    alignItems: "center", marginTop: -10, marginBottom: 20,
    width: "40%", height: 40, alignSelf: "center",
    borderWidth: 1.5, borderColor: "#080647", justifyContent: "center",
  },
  loginButtonDisabled: { opacity: 0.7 },
  loginButtonText: { color: "#FFFFFF", fontSize: 16, fontFamily: "Poppins-SemiBold", letterSpacing: 0.5 },
  signUpContainer: { flexDirection: "row", justifyContent: "center", marginBottom: 12 },
  signUpText: { color: "#808080", fontSize: 13, fontFamily: "Poppins-Regular" },
  signUpLink: { color: "#004E00", fontSize: 13, fontFamily: "Poppins-SemiBold" },
  orContinueText: { color: "#808080", fontSize: 13, fontFamily: "Poppins-Regular", textAlign: "center", marginBottom: 8 },
  socialContainer: { flexDirection: "row", justifyContent: "center", gap: 10 },
  socialIcon: { width: 60, height: 60 },
});