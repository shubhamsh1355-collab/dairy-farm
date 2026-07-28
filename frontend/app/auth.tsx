import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { api, saveSession } from "@/src/api";
import { colors, spacing, radius, images } from "@/src/theme";
import { Logo } from "@/src/Logo";

type Step = "mobile" | "otp" | "register";

export default function AuthScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [farmName, setFarmName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fullMobile = mobile.startsWith("+") ? mobile : `+91${mobile.replace(/^0+/, "")}`;

  async function handleSendOtp() {
    setError("");
    if (mobile.replace(/\D/g, "").length < 10) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    try {
      const res = await api.sendOtp(fullMobile);
      setDevOtp(res.otp);
      setStep("otp");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setError("");
    if (otp.length !== 6) {
      setError("Enter 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await api.verifyOtp({ mobile: fullMobile, code: otp });
      if (res.needs_registration) {
        setStep("register");
        return;
      }
      if (res.token && res.farm) {
        await saveSession(res.token, res.farm);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    setError("");
    if (!farmName.trim() || !ownerName.trim()) {
      setError("Farm name and owner name are required");
      return;
    }
    setLoading(true);
    try {
      const res = await api.verifyOtp({
        mobile: fullMobile,
        code: otp,
        farm_name: farmName,
        owner_name: ownerName,
      });
      if (res.token && res.farm) {
        await saveSession(res.token, res.farm);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <Image source={{ uri: images.hero_farm }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
        <LinearGradient
          colors={["rgba(28,27,26,0.2)", "rgba(28,27,26,0.85)"]}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView edges={["top"]} style={styles.heroInner}>
          <Logo size={56} />
          <Text style={styles.heroTitle}>Ksheer Dhara</Text>
          <Text style={styles.heroSub}>Manage your dairy farm effortlessly</Text>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.sheet}
      >
        <ScrollView
          contentContainerStyle={styles.sheetInner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === "mobile" && (
            <>
              <Text style={styles.title}>Sign in</Text>
              <Text style={styles.sub}>We'll send a 6-digit OTP to your mobile</Text>
              <View style={styles.inputRow}>
                <View style={styles.countryPill}>
                  <Text style={styles.countryText}>+91</Text>
                </View>
                <TextInput
                  testID="mobile-input"
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="phone-pad"
                  placeholder="10-digit mobile"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  maxLength={10}
                />
              </View>
              {!!error && <Text style={styles.err}>{error}</Text>}
              <Pressable testID="send-otp-button" style={styles.cta} onPress={handleSendOtp} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={colors.onBrandPrimary} />
                ) : (
                  <Text style={styles.ctaText}>Send OTP</Text>
                )}
              </Pressable>
            </>
          )}

          {step === "otp" && (
            <>
              <Text style={styles.title}>Enter OTP</Text>
              <Text style={styles.sub}>Sent to {fullMobile}</Text>
              {!!devOtp && (
                <View style={styles.otpHint} testID="dev-otp-hint">
                  <MaterialCommunityIcons name="information-outline" size={16} color={colors.info} />
                  <Text style={styles.otpHintText}>Prototype OTP: {devOtp}</Text>
                </View>
              )}
              <TextInput
                testID="otp-input"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                placeholder="6-digit code"
                placeholderTextColor={colors.muted}
                style={[styles.input, styles.otpInput]}
                maxLength={6}
              />
              {!!error && <Text style={styles.err}>{error}</Text>}
              <Pressable testID="verify-otp-button" style={styles.cta} onPress={handleVerify} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={colors.onBrandPrimary} />
                ) : (
                  <Text style={styles.ctaText}>Verify</Text>
                )}
              </Pressable>
              <Pressable onPress={() => setStep("mobile")} style={styles.link}>
                <Text style={styles.linkText}>Change number</Text>
              </Pressable>
            </>
          )}

          {step === "register" && (
            <>
              <Text style={styles.title}>Register your farm</Text>
              <Text style={styles.sub}>Tell us a bit about your dairy farm</Text>
              <Text style={styles.label}>Farm name</Text>
              <TextInput
                testID="farm-name-input"
                value={farmName}
                onChangeText={setFarmName}
                placeholder="e.g. Gokul Dairy Farm"
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
              <Text style={styles.label}>Owner name</Text>
              <TextInput
                testID="owner-name-input"
                value={ownerName}
                onChangeText={setOwnerName}
                placeholder="Your name"
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
              {!!error && <Text style={styles.err}>{error}</Text>}
              <Pressable testID="register-farm-button" style={styles.cta} onPress={handleRegister} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={colors.onBrandPrimary} />
                ) : (
                  <Text style={styles.ctaText}>Create farm</Text>
                )}
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  hero: { height: "45%", overflow: "hidden" },
  heroInner: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: "700",
    color: colors.onSurfaceInverse,
    letterSpacing: 0.5,
  },
  heroSub: { color: "rgba(250,249,246,0.85)", fontSize: 14 },
  sheet: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
  },
  sheetInner: { padding: spacing.xl, gap: spacing.md },
  title: { fontSize: 24, fontWeight: "700", color: colors.onSurface },
  sub: { fontSize: 14, color: colors.muted, marginBottom: spacing.md },
  label: { fontSize: 12, color: colors.onSurfaceTertiary, marginTop: spacing.sm },
  inputRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  countryPill: {
    height: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTertiary,
    justifyContent: "center",
  },
  countryText: { fontSize: 16, color: colors.onSurface, fontWeight: "600" },
  input: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    color: colors.onSurface,
  },
  otpInput: { textAlign: "center", letterSpacing: 8, fontSize: 20 },
  cta: {
    marginTop: spacing.md,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { color: colors.onBrandPrimary, fontSize: 16, fontWeight: "600" },
  err: { color: colors.error, fontSize: 13 },
  link: { alignItems: "center", padding: spacing.sm },
  linkText: { color: colors.brandPrimary, fontSize: 14, fontWeight: "500" },
  otpHint: {
    flexDirection: "row",
    gap: spacing.xs,
    alignItems: "center",
    backgroundColor: "#EAF3F8",
    padding: spacing.md,
    borderRadius: radius.md,
  },
  otpHintText: { color: colors.info, fontSize: 13, fontWeight: "500" },
});
