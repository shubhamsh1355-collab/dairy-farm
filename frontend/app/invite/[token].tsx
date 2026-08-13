import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/src/api";
import { colors, spacing, radius, shadow } from "@/src/theme";

export default function InviteRegistration() {
  const { token } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [valid, setValid] = useState(false);
  const [used, setUsed] = useState(false);
  const [error, setError] = useState("");
  
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
    setError("");
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        setLocLoading(false);
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch (e: any) {
      setError("Could not fetch location. Please ensure GPS is enabled.");
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
        invite_token: token,
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
        setUsed(true); // show success state
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
        <ActivityIndicator color={colors.brandPrimary} />
      </View>
    );
  }

  if (used) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="check-circle" size={64} color={colors.success} />
        <Text style={styles.title}>You are registered!</Text>
        <Text style={styles.sub}>You have successfully joined the farm's delivery network.</Text>
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
      <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
        <Text style={styles.title}>Welcome!</Text>
        <Text style={styles.sub}>Please register your details for milk delivery.</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="John Doe" />
        
        <Text style={styles.label}>Mobile Number</Text>
        <TextInput value={mobile} onChangeText={setMobile} style={styles.input} keyboardType="phone-pad" placeholder="10-digit mobile" />

        <Text style={styles.label}>Daily Cow Milk (Liters)</Text>
        <TextInput value={cowReq} onChangeText={setCowReq} style={styles.input} keyboardType="decimal-pad" placeholder="0" />

        <Text style={styles.label}>Daily Buffalo Milk (Liters)</Text>
        <TextInput value={bufReq} onChangeText={setBufReq} style={styles.input} keyboardType="decimal-pad" placeholder="0" />

        <Text style={styles.label}>Address / House Number</Text>
        <TextInput value={address} onChangeText={setAddress} style={styles.input} placeholder="e.g. 101, MG Road" />

        <View style={styles.locBox}>
          <Text style={styles.label}>Exact Location</Text>
          <Text style={styles.locSub}>Share your GPS location so the delivery partner can route exactly to your house.</Text>
          <Pressable style={styles.locBtn} onPress={handleGetLocation} disabled={locLoading}>
            {locLoading ? <ActivityIndicator color={colors.brandPrimary} /> : (
              <>
                <MaterialCommunityIcons name="crosshairs-gps" size={20} color={colors.brandPrimary} />
                <Text style={styles.locBtnText}>{location ? "Location Captured ✓" : "Share My Location"}</Text>
              </>
            )}
          </Pressable>
        </View>

        {!!error && <Text style={styles.err}>{error}</Text>}

        <Pressable style={styles.cta} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Complete Registration</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl, backgroundColor: colors.surface },
  title: { fontSize: 24, fontWeight: "700", color: colors.onSurface, marginTop: spacing.md },
  sub: { fontSize: 14, color: colors.muted, textAlign: "center", marginTop: 8, marginBottom: spacing.xl },
  label: { fontSize: 12, color: colors.onSurfaceTertiary, marginTop: spacing.md, marginBottom: 4 },
  input: { height: 48, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md },
  locBox: { marginTop: spacing.lg, padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  locSub: { fontSize: 12, color: colors.muted, marginBottom: spacing.md },
  locBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 44, backgroundColor: colors.surfaceTertiary, borderRadius: radius.md },
  locBtnText: { color: colors.brandPrimary, fontWeight: "600" },
  cta: { marginTop: spacing.xl, height: 52, borderRadius: radius.md, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center" },
  ctaText: { color: colors.onBrandPrimary, fontSize: 16, fontWeight: "600" },
  err: { color: colors.error, fontSize: 13, marginTop: spacing.sm },
});
