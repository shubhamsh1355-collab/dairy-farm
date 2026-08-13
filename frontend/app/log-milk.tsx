import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { api } from "@/src/api";
import { colors, spacing, radius } from "@/src/theme";

export default function LogMilk() {
  const router = useRouter();
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  
  const [milkType, setMilkType] = useState<"cow" | "buffalo">("cow");
  
  // State for cow
  const [cowProduced, setCowProduced] = useState("");
  const [cowDelivered, setCowDelivered] = useState("");
  const [cowUsed, setCowUsed] = useState("");
  const [cowPrice, setCowPrice] = useState("60");
  const [cowNotes, setCowNotes] = useState("");
  
  // State for buffalo
  const [bufProduced, setBufProduced] = useState("");
  const [bufDelivered, setBufDelivered] = useState("");
  const [bufUsed, setBufUsed] = useState("");
  const [bufPrice, setBufPrice] = useState("70");
  const [bufNotes, setBufNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [expectedData, setExpectedData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const r = await api.todayMilk().catch(() => null);
      if (r?.expected) {
        setExpectedData(r.expected);
      }
      if (r?.logs) {
        const cowLog = r.logs.find((l: any) => l.milk_type === "cow");
        const bufLog = r.logs.find((l: any) => l.milk_type === "buffalo");
        if (cowLog) {
          setCowProduced(String(cowLog.produced_ltr));
          setCowDelivered(String(cowLog.delivered_ltr));
          setCowUsed(String(cowLog.used_for_products_ltr));
          setCowPrice(String(cowLog.price_per_ltr));
          setCowNotes(cowLog.notes || "");
        }
        if (bufLog) {
          setBufProduced(String(bufLog.produced_ltr));
          setBufDelivered(String(bufLog.delivered_ltr));
          setBufUsed(String(bufLog.used_for_products_ltr));
          setBufPrice(String(bufLog.price_per_ltr));
          setBufNotes(bufLog.notes || "");
        }
      }
    })();
  }, []);

  const isCow = milkType === "cow";
  
  const p = Number(isCow ? cowProduced : bufProduced) || 0;
  const d = Number(isCow ? cowDelivered : bufDelivered) || 0;
  const u = Number(isCow ? cowUsed : bufUsed) || 0;
  const price = isCow ? cowPrice : bufPrice;
  const remaining = p - d - u;

  const save = async () => {
    setErr("");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { setErr("Date must be in YYYY-MM-DD format"); return; }
    if (p <= 0) { setErr(`Produced quantity required for ${milkType}`); return; }
    if (d + u > p) { setErr("Delivered + used cannot exceed produced"); return; }
    setLoading(true);
    try {
      await api.logMilk({
        date, 
        milk_type: milkType,
        produced_ltr: p, 
        delivered_ltr: d, 
        used_for_products_ltr: u,
        price_per_ltr: Number(price) || 0, 
        notes: isCow ? cowNotes : bufNotes,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <Pressable onPress={() => router.back()} testID="back-btn"><MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} /></Pressable>
        <Text style={styles.title}>Log milk</Text>
        <View style={{ width: 24 }} />
      </SafeAreaView>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }} keyboardShouldPersistTaps="handled">
          
          <View style={styles.segmentedControl}>
            <Pressable 
              style={[styles.segment, isCow && styles.segmentActive]} 
              onPress={() => { setMilkType("cow"); Haptics.selectionAsync(); }}>
              <Text style={[styles.segmentText, isCow && styles.segmentTextActive]}>🐄 Cow Milk</Text>
            </Pressable>
            <Pressable 
              style={[styles.segment, !isCow && styles.segmentActive]} 
              onPress={() => { setMilkType("buffalo"); Haptics.selectionAsync(); }}>
              <Text style={[styles.segmentText, !isCow && styles.segmentTextActive]}>🐃 Buffalo Milk</Text>
            </Pressable>
          </View>

          <View>
            <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
            <View style={styles.inputWrap}>
              <MaterialCommunityIcons name="calendar" size={18} color={colors.muted} />
              <TextInput testID="input-date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.muted} style={styles.inputFlex} />
            </View>
          </View>

          {expectedData && (
            <View style={styles.expectedCard}>
              <MaterialCommunityIcons name="information" size={16} color={colors.brandPrimary} />
              <Text style={styles.expectedText}>
                Total Expected Delivery (Both Types): {expectedData.expected_delivered}L
              </Text>
            </View>
          )}

          <Field testID="input-produced" icon="cup-water" label="Produced (Litres)" value={isCow ? cowProduced : bufProduced} onChange={isCow ? setCowProduced : setBufProduced} />
          <Field testID="input-delivered" icon="truck-delivery" label="Delivered (Litres)" value={isCow ? cowDelivered : bufDelivered} onChange={isCow ? setCowDelivered : setBufDelivered} />
          <Field testID="input-used" icon="factory" label="Used for dairy products (Litres)" value={isCow ? cowUsed : bufUsed} onChange={isCow ? setCowUsed : setBufUsed} />
          <Field testID="input-price" icon="currency-inr" label="Price per litre (₹)" value={isCow ? cowPrice : bufPrice} onChange={isCow ? setCowPrice : setBufPrice} />

          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>Remaining at end of day</Text>
            <Text style={[styles.summaryValue, remaining < 0 && { color: colors.error }]} testID="remaining-value">{remaining.toFixed(1)} L</Text>
            <View style={styles.divider} />
            <Text style={styles.summaryLabel}>Estimated revenue</Text>
            <Text style={styles.summaryValue}>₹{(d * (Number(price) || 0)).toLocaleString("en-IN")}</Text>
          </View>

          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput testID="input-notes" value={isCow ? cowNotes : bufNotes} onChangeText={isCow ? setCowNotes : setBufNotes} placeholder="Any notes..." placeholderTextColor={colors.muted} multiline style={[styles.input, { minHeight: 70, textAlignVertical: "top", paddingTop: spacing.md }]} />

          {!!err && <Text style={styles.err}>{err}</Text>}

          <Pressable testID="save-milk-log" style={styles.cta} onPress={save} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={styles.ctaText}>Save {milkType} log</Text>}
          </Pressable>
          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({ testID, icon, label, value, onChange }: any) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.muted} />
        <TextInput testID={testID} value={value} onChangeText={onChange} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.muted} style={styles.inputFlex} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.xl, paddingBottom: spacing.md },
  title: { fontSize: 18, fontWeight: "700", color: colors.onSurface },
  label: { fontSize: 12, color: colors.muted, marginBottom: 6, marginTop: spacing.xs },
  inputWrap: { flexDirection: "row", alignItems: "center", height: 52, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.lg, gap: spacing.sm },
  input: { borderRadius: radius.md, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, padding: spacing.md, fontSize: 15, color: colors.onSurface },
  inputFlex: { flex: 1, fontSize: 16, color: colors.onSurface },
  summary: { backgroundColor: colors.brandTertiary, padding: spacing.lg, borderRadius: radius.md, marginTop: spacing.sm },
  summaryLabel: { fontSize: 12, color: colors.onBrandTertiary },
  summaryValue: { fontSize: 22, fontWeight: "700", color: colors.onBrandTertiary, marginTop: 2 },
  divider: { height: 1, backgroundColor: "rgba(25,61,39,0.15)", marginVertical: spacing.md },
  cta: { marginTop: spacing.md, height: 52, borderRadius: radius.md, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center" },
  ctaText: { color: colors.onBrandPrimary, fontSize: 16, fontWeight: "600" },
  err: { color: colors.error, fontSize: 13 },
  expectedCard: { flexDirection: "row", backgroundColor: "rgba(39, 92, 59, 0.1)", padding: spacing.md, borderRadius: radius.md, gap: spacing.sm, alignItems: "flex-start" },
  expectedText: { color: colors.brandPrimary, fontSize: 13, lineHeight: 20 },
  segmentedControl: { flexDirection: "row", backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, padding: 4, marginBottom: spacing.sm },
  segment: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: radius.sm },
  segmentActive: { backgroundColor: colors.surface, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  segmentText: { fontSize: 14, fontWeight: "600", color: colors.muted },
  segmentTextActive: { color: colors.brandPrimary },
});
