import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, ActivityIndicator, Image, Dimensions, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/src/api";
import { colors, spacing, radius, shadow, images } from "@/src/theme";

const { width } = Dimensions.get("window");

export default function InviteRegistration() {
  const { token } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [valid, setValid] = useState(false);
  const [used, setUsed] = useState(false);
  const [error, setError] = useState("");
  const [locError, setLocError] = useState("");
  
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [cowReq, setCowReq] = useState("");
  const [bufReq, setBufReq] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<any>(null);
  const [locLoading, setLocLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.checkInvite(token as string);
        if (res.used) {
          setUsed(true);
        } else {
          setValid(true);
        }
      } catch (e: any) {
        setError(e.message || "Invalid invite link");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  async function handleGetLocation() {
    setLocLoading(true);
    setLocError("");
    setError("");
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocError('Location Access Denied. Please open your device Settings or Browser Permissions, enable GPS/Location, and try again.');
        setLocLoading(false);
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch (e: any) {
      setLocError("Could not fetch location. Please ensure your device GPS is turned ON and try again.");
    } finally {
      setLocLoading(false);
    }
  }

  async function handleSubmit() {
    setError("");
    if (!name.trim() || !mobile.trim()) {
      setError("Name and mobile are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.registerCustomer({
        invite_token: token as string,
        name,
        mobile,
        cow_req_ltr: parseFloat(cowReq) || 0,
        buffalo_req_ltr: parseFloat(bufReq) || 0,
        address,
        lat: location?.lat,
        lng: location?.lng,
      });
      if (res.already_registered) {
        setUsed(true);
      } else {
        setUsed(true);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </View>
    );
  }

  if (used) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="check-decagram" size={80} color={colors.success} />
        <Text style={styles.title}>Welcome to the Family!</Text>
        <Text style={styles.sub}>You have successfully joined Gokul Dairy Farm's delivery network.</Text>
      </View>
    );
  }

  if (!valid) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="alert-circle" size={64} color={colors.error} />
        <Text style={styles.title}>Invalid Link</Text>
        <Text style={styles.sub}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <View style={styles.heroContainer}>
          <Image source={{ uri: images.hero_farm }} style={styles.heroImage} />
          <View style={styles.heroOverlay}>
            <Text style={styles.farmName}>Gokul Dairy Farm</Text>
            <Text style={styles.heroSub}>Freshness Delivered Daily</Text>
          </View>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Complete Registration</Text>
          <Text style={styles.formSub}>Join us to receive farm-fresh milk at your doorstep every morning.</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="account-outline" size={20} color={colors.muted} style={styles.inputIcon} />
              <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="e.g. John Doe" placeholderTextColor={colors.muted} />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="phone-outline" size={20} color={colors.muted} style={styles.inputIcon} />
              <TextInput value={mobile} onChangeText={setMobile} style={styles.input} keyboardType="phone-pad" placeholder="10-digit mobile" maxLength={10} placeholderTextColor={colors.muted} />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
            <View style={[styles.inputGroup, { flex: 1, marginTop: 0 }]}>
              <Text style={styles.label}>Cow Milk (Liters)</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.emojiIcon}>🐄</Text>
                <TextInput value={cowReq} onChangeText={setCowReq} style={styles.input} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.muted} />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginTop: 0 }]}>
              <Text style={styles.label}>Buffalo Milk (Liters)</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.emojiIcon}>🐃</Text>
                <TextInput value={bufReq} onChangeText={setBufReq} style={styles.input} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.muted} />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address / House Number</Text>
            <View style={[styles.inputWrapper, { height: 80, alignItems: 'flex-start', paddingTop: spacing.sm }]}>
              <MaterialCommunityIcons name="home-outline" size={20} color={colors.muted} style={styles.inputIcon} />
              <TextInput value={address} onChangeText={setAddress} style={[styles.input, { height: 60 }]} placeholder="e.g. 101, MG Road" multiline placeholderTextColor={colors.muted} />
            </View>
          </View>

          <View style={styles.locBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <MaterialCommunityIcons name="map-marker-radius" size={20} color={colors.onSurface} style={{ marginRight: 8 }} />
              <Text style={styles.locTitle}>Exact Location</Text>
            </View>
            <Text style={styles.locSub}>Share your GPS location so our delivery partner can route exactly to your house.</Text>
            
            {!!locError && (
              <View style={styles.locErrorBox}>
                <MaterialCommunityIcons name="alert" size={16} color={colors.error} style={{ marginTop: 2, marginRight: 6 }} />
                <Text style={styles.locErrorText}>{locError}</Text>
              </View>
            )}

            <Pressable 
              style={[styles.locBtn, location ? styles.locBtnSuccess : null]} 
              onPress={handleGetLocation} 
              disabled={locLoading || !!location}
            >
              {locLoading ? <ActivityIndicator color={colors.onBrandPrimary} /> : (
                <>
                  <MaterialCommunityIcons 
                    name={location ? "check-circle" : "crosshairs-gps"} 
                    size={20} 
                    color={location ? colors.success : colors.onBrandPrimary} 
                  />
                  <Text style={[styles.locBtnText, location ? { color: colors.success } : null]}>
                    {location ? "Location Captured ✓" : "Share My Location"}
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          {!!error && <Text style={styles.err}>{error}</Text>}

        </View>
      </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.cta} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Complete Registration</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl, backgroundColor: colors.surface },
  heroContainer: { width: "100%", height: 260, position: "relative" },
  heroImage: { width: "100%", height: "100%", resizeMode: "cover" },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(6, 95, 70, 0.6)", justifyContent: "center", alignItems: "center", paddingHorizontal: spacing.xl },
  farmName: { fontSize: 32, fontWeight: "800", color: "#fff", textAlign: "center", textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  heroSub: { fontSize: 16, color: "#fff", marginTop: spacing.sm, fontWeight: "500", opacity: 0.9 },
  
  formContainer: { flex: 1, backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24, padding: spacing.xl, ...shadow.card },
  formTitle: { fontSize: 22, fontWeight: "700", color: colors.onSurface },
  formSub: { fontSize: 14, color: colors.muted, marginTop: spacing.xs, marginBottom: spacing.xl, lineHeight: 20 },
  
  inputGroup: { marginTop: spacing.lg },
  label: { fontSize: 13, fontWeight: "600", color: colors.onSurface, marginBottom: spacing.xs },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.sm },
  inputIcon: { marginRight: spacing.xs },
  emojiIcon: { fontSize: 18, marginRight: spacing.xs },
  input: { flex: 1, height: 48, fontSize: 15, color: colors.onSurface },
  
  locBox: { marginTop: spacing.xl, padding: spacing.lg, backgroundColor: colors.surfaceTertiary, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  locTitle: { fontSize: 15, fontWeight: "700", color: colors.onSurface },
  locSub: { fontSize: 13, color: colors.muted, marginBottom: spacing.md, lineHeight: 18 },
  locBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, backgroundColor: colors.brandPrimary, borderRadius: radius.md, ...shadow.card },
  locBtnSuccess: { backgroundColor: colors.surfaceSecondary, borderColor: colors.success, borderWidth: 1 },
  locBtnText: { color: colors.onBrandPrimary, fontSize: 15, fontWeight: "700" },
  locErrorBox: { flexDirection: "row", backgroundColor: colors.error + "15", padding: spacing.sm, borderRadius: radius.sm, marginBottom: spacing.md },
  locErrorText: { color: colors.error, fontSize: 13, flex: 1, fontWeight: "500", lineHeight: 18 },
  
  footer: { backgroundColor: colors.surface, padding: spacing.xl, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  cta: { height: 56, borderRadius: radius.pill, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center", ...shadow.card },
  ctaText: { color: colors.onBrandPrimary, fontSize: 16, fontWeight: "700" },
  
  title: { fontSize: 24, fontWeight: "700", color: colors.onSurface, marginTop: spacing.md },
  sub: { fontSize: 15, color: colors.muted, textAlign: "center", marginTop: 8, paddingHorizontal: spacing.xl, lineHeight: 22 },
  err: { color: colors.error, fontSize: 13, marginTop: spacing.lg, textAlign: "center", fontWeight: "500" },
});
