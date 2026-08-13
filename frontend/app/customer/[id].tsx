import { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, ScrollView, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import dayjs from "dayjs";
import * as Haptics from "expo-haptics";

import { api } from "@/src/api";
import { colors, spacing, radius } from "@/src/theme";

export default function CustomerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());
  const [skipMilkType, setSkipMilkType] = useState<"cow" | "buffalo">("cow");
  const [addingSkip, setAddingSkip] = useState(false);

  const loadBill = useCallback(async () => {
    setLoading(true);
    try {
      const currentMonth = dayjs().format("YYYY-MM");
      const data = await api.generateBill(id as string, currentMonth);
      setBill(data);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to load bill");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadBill();
    }, [loadBill])
  );

  const handleAddSkip = async () => {
    const req = skipMilkType === "cow" ? bill?.contact?.cow_req_ltr : bill?.contact?.buffalo_req_ltr;
    if (!req) {
      Alert.alert("Error", `Contact has no ${skipMilkType} requirement set.`);
      return;
    }
    setAddingSkip(true);
    try {
      const dateStr = dayjs(date).format("YYYY-MM-DD");
      await api.addSkip(id as string, dateStr, req, skipMilkType);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Skip recorded");
      loadBill();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to record skip");
    } finally {
      setAddingSkip(false);
    }
  };

  const handleWhatsApp = () => {
    if (!bill?.contact?.mobile) return;
    const msg = `Hello ${bill.contact.name}, your bill for ${dayjs().format("MMMM YYYY")} is ₹${bill.total_amount}. Expected: ${bill.expected_ltr}L, Skipped: ${bill.total_skipped_ltr}L, Delivered: ${bill.delivered_ltr}L.`;
    Linking.openURL(`https://wa.me/91${bill.contact.mobile}?text=${encodeURIComponent(msg)}`);
  };

  if (loading && !bill) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface, justifyContent: "center" }}>
        <ActivityIndicator color={colors.brandPrimary} />
      </SafeAreaView>
    );
  }

  if (!bill) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: colors.muted }}>Could not load customer details.</Text>
      </SafeAreaView>
    );
  }

  const { contact, total_amount, expected_ltr, total_skipped_ltr, delivered_ltr, farm_upi_id } = bill;
  const upiUrl = farm_upi_id ? `upi://pay?pa=${farm_upi_id}&pn=Farm&am=${total_amount}&cu=INR` : null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{contact.name}</Text>
          <Text style={styles.sub}>{contact.mobile}</Text>
        </View>
        <Pressable style={styles.waBtn} onPress={handleWhatsApp}>
          <MaterialCommunityIcons name="whatsapp" size={24} color="#25D366" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl }}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Bill for {dayjs().format("MMMM YYYY")}</Text>
          
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Expected Milk:</Text>
            <Text style={styles.billValue}>{expected_ltr} L</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Skipped Milk:</Text>
            <Text style={styles.billValue}>{total_skipped_ltr} L</Text>
          </View>
          
          <View style={styles.divider} />
          
          {bill.delivered_cow > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivered (Cow):</Text>
              <Text style={styles.billValue}>{bill.delivered_cow} L</Text>
            </View>
          )}
          {bill.delivered_buffalo > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivered (Buffalo):</Text>
              <Text style={styles.billValue}>{bill.delivered_buffalo} L</Text>
            </View>
          )}
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Total Delivered:</Text>
            <Text style={styles.billValue}>{delivered_ltr} L</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.billRow}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalValue}>₹{total_amount}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mark Skip</Text>
          <Text style={styles.skipSub}>Record a missed delivery for this customer.</Text>
          
          <View style={styles.segmentedControl}>
            <Pressable 
              style={[styles.segment, skipMilkType === "cow" && styles.segmentActive]} 
              onPress={() => { setSkipMilkType("cow"); Haptics.selectionAsync(); }}>
              <Text style={[styles.segmentText, skipMilkType === "cow" && styles.segmentTextActive]}>🐄 Cow Milk</Text>
            </Pressable>
            <Pressable 
              style={[styles.segment, skipMilkType === "buffalo" && styles.segmentActive]} 
              onPress={() => { setSkipMilkType("buffalo"); Haptics.selectionAsync(); }}>
              <Text style={[styles.segmentText, skipMilkType === "buffalo" && styles.segmentTextActive]}>🐃 Buffalo Milk</Text>
            </Pressable>
          </View>

          <View style={styles.dateSelector}>
            <Pressable onPress={() => setDate(dayjs(date).subtract(1, 'day').toDate())} style={styles.dateBtn}>
              <MaterialCommunityIcons name="chevron-left" size={24} color={colors.onSurface} />
            </Pressable>
            <Text style={styles.dateText}>{dayjs(date).format('DD MMM YYYY')}</Text>
            <Pressable onPress={() => setDate(dayjs(date).add(1, 'day').toDate())} style={styles.dateBtn}>
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.onSurface} />
            </Pressable>
          </View>
          
          <Pressable style={styles.primaryBtn} onPress={handleAddSkip} disabled={addingSkip}>
            {addingSkip ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={styles.primaryBtnText}>Mark Skip</Text>}
          </Pressable>
        </View>

        {upiUrl && (
          <View style={styles.qrCard}>
            <Text style={styles.sectionTitle}>Payment QR</Text>
            <Text style={styles.qrSub}>Scan to pay via UPI</Text>
            <View style={styles.qrWrapper}>
              <QRCode value={upiUrl} size={150} />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.surface,
  },
  backBtn: { padding: spacing.xs, marginLeft: -spacing.xs },
  waBtn: { padding: spacing.xs, marginRight: -spacing.xs },
  title: { fontSize: 20, fontWeight: "700", color: colors.onSurface },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: colors.onSurface, marginBottom: spacing.md },
  
  billRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm },
  billLabel: { fontSize: 15, color: colors.muted },
  billValue: { fontSize: 15, color: colors.onSurface, fontWeight: "500" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  totalLabel: { fontSize: 16, fontWeight: "600", color: colors.onSurface },
  totalValue: { fontSize: 18, fontWeight: "700", color: colors.brandPrimary },

  skipSub: { fontSize: 13, color: colors.muted, marginBottom: spacing.md },
  dateSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  dateBtn: { padding: spacing.xs },
  dateText: { fontSize: 15, fontWeight: "500", color: colors.onSurface },

  primaryBtn: {
    height: 48,
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: colors.onBrandPrimary, fontSize: 15, fontWeight: "600" },

  qrCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  qrSub: { fontSize: 13, color: colors.muted, marginBottom: spacing.xl },
  qrWrapper: { padding: spacing.md, backgroundColor: "#FFF", borderRadius: radius.md },
  segmentedControl: { flexDirection: "row", backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, padding: 4, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  segment: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: radius.sm },
  segmentActive: { backgroundColor: colors.surface, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  segmentText: { fontSize: 14, fontWeight: "600", color: colors.muted },
  segmentTextActive: { color: colors.brandPrimary },
});
