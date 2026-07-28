import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { clearSession, loadFarm, saveSession, api } from "@/src/api";
import { colors, spacing, radius } from "@/src/theme";
import { Logo } from "@/src/Logo";

export default function Profile() {
  const router = useRouter();
  const [farm, setFarm] = useState<any>(null);
  const [upiId, setUpiId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { 
    loadFarm().then(f => {
      setFarm(f);
      if(f?.upi_id) setUpiId(f.upi_id);
    }); 
  }, []);

  const logout = async () => {
    await clearSession();
    router.replace("/auth");
  };

  const handleSaveUpi = async () => {
    try {
      setSaving(true);
      const res = await api.updateSettings({ upi_id: upiId });
      setFarm(res.farm);
      const token = await (await import("@react-native-async-storage/async-storage")).default.getItem("kd_token");
      if(token) await saveSession(token, res.farm);
      alert("Settings saved!");
    } catch(e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <Pressable onPress={() => router.back()} testID="profile-back"><MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} /></Pressable>
        <Text style={styles.title}>Profile</Text>
        <View style={{ width: 24 }} />
      </SafeAreaView>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
        <View style={styles.card}>
          <Logo size={56} />
          <Text style={styles.farmName} testID="profile-farm-name">{farm?.farm_name || "—"}</Text>
          <Text style={styles.muted}>{farm?.owner_name}</Text>
          <Text style={styles.muted}>{farm?.mobile}</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.section}>Payment Integration</Text>
          <Text style={styles.muted}>Set your UPI ID to automatically generate QR codes for customer bills.</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g. yourname@upi" 
            placeholderTextColor={colors.muted}
            value={upiId}
            onChangeText={setUpiId}
            autoCapitalize="none"
          />
          <Pressable style={styles.btn} onPress={handleSaveUpi} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save Settings</Text>}
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>WhatsApp Broadcast</Text>
          <Text style={styles.muted}>Currently running in simulated mode. Configure Twilio credentials in backend/.env to enable live WhatsApp delivery:</Text>
          <Text style={styles.mono}>TWILIO_ACCOUNT_SID{"\n"}TWILIO_AUTH_TOKEN{"\n"}TWILIO_WHATSAPP_FROM=whatsapp:+14155238886</Text>
        </View>

        <Pressable testID="logout-btn" style={styles.logout} onPress={logout}>
          <MaterialCommunityIcons name="logout" size={18} color={colors.error} />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.xl, paddingBottom: spacing.md },
  title: { fontSize: 18, fontWeight: "700", color: colors.onSurface },
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.xl, borderWidth: 1, borderColor: colors.border, alignItems: "flex-start", gap: spacing.sm },
  farmName: { fontSize: 22, fontWeight: "700", color: colors.onSurface, marginTop: spacing.sm },
  muted: { color: colors.muted, fontSize: 13 },
  section: { fontSize: 14, fontWeight: "700", color: colors.onSurface },
  mono: { fontFamily: "monospace", fontSize: 11, color: colors.onSurfaceTertiary, backgroundColor: colors.surfaceTertiary, padding: spacing.md, borderRadius: radius.sm, alignSelf: "stretch" },
  logout: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, height: 52, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.error },
  logoutText: { color: colors.error, fontWeight: "600" },
  input: { alignSelf: "stretch", height: 48, backgroundColor: colors.surfaceTertiary, borderRadius: radius.md, paddingHorizontal: spacing.md, color: colors.onSurface, marginTop: spacing.sm },
  btn: { alignSelf: "stretch", height: 48, backgroundColor: colors.brandPrimary, borderRadius: radius.md, justifyContent: "center", alignItems: "center", marginTop: spacing.sm },
  btnText: { color: "#fff", fontWeight: "600" }
});
