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
  const [produced, setProduced] = useState("");
  const [delivered, setDelivered] = useState("");
  const [used, setUsed] = useState("");
  const [price, setPrice] = useState("60");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const r = await api.todayMilk().catch(() => null);
      if (r?.log) {
        setProduced(String(r.log.produced_ltr));
        setDelivered(String(r.log.delivered_ltr));
        setUsed(String(r.log.used_for_products_ltr));
        setPrice(String(r.log.price_per_ltr));
        setNotes(r.log.notes || "");
      }
    })();
  }, []);

  const p = Number(produced) || 0;
  const d = Number(delivered) || 0;
  const u = Number(used) || 0;
  const remaining = p - d - u;

  const save = async () => {
    setErr("");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { setErr("Date must be in YYYY-MM-DD format"); return; }
    if (p <= 0) { setErr("Produced quantity required"); return; }
    if (d + u > p) { setErr("Delivered + used cannot exceed produced"); return; }
    setLoading(true);
    try {
      await api.logMilk({
        date, produced_ltr: p, delivered_ltr: d, used_for_products_ltr: u,
        price_per_ltr: Number(price) || 0, notes,
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
          
          <View>
            <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
            <View style={styles.inputWrap}>
              <MaterialCommunityIcons name="calendar" size={18} color={colors.muted} />
              <TextInput testID="input-date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.muted} style={styles.inputFlex} />
            </View>
          </View>

          <Field testID="input-produced" icon="cup-water" label="Produced (Litres)" value={produced} onChange={setProduced} />
          <Field testID="input-delivered" icon="truck-delivery" label="Delivered (Litres)" value={delivered} onChange={setDelivered} />
          <Field testID="input-used" icon="factory" label="Used for dairy products (Litres)" value={used} onChange={setUsed} />
          <Field testID="input-price" icon="currency-inr" label="Price per litre (₹)" value={price} onChange={setPrice} />

          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>Remaining at end of day</Text>
            <Text style={[styles.summaryValue, remaining < 0 && { color: colors.error }]} testID="remaining-value">{remaining.toFixed(1)} L</Text>
            <View style={styles.divider} />
            <Text style={styles.summaryLabel}>Estimated revenue</Text>
            <Text style={styles.summaryValue}>₹{(d * (Number(price) || 0)).toLocaleString("en-IN")}</Text>
          </View>

          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput testID="input-notes" value={notes} onChangeText={setNotes} placeholder="Any notes..." placeholderTextColor={colors.muted} multiline style={[styles.input, { minHeight: 70, textAlignVertical: "top", paddingTop: spacing.md }]} />

          {!!err && <Text style={styles.err}>{err}</Text>}

          <Pressable testID="save-milk-log" style={styles.cta} onPress={save} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={styles.ctaText}>Save log</Text>}
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
});
