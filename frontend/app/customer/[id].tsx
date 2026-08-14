import { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, ScrollView, Linking, Modal, TextInput } from "react-native";
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
  const [selectedCalDate, setSelectedCalDate] = useState<string | null>(null);
  const [editSkipCow, setEditSkipCow] = useState("");
  const [editSkipBuf, setEditSkipBuf] = useState("");
  const [addingSkip, setAddingSkip] = useState(false);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCowReq, setEditCowReq] = useState("");
  const [editBufReq, setEditBufReq] = useState("");

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

  const handleEditOpen = () => {
    if (!bill?.contact) return;
    setEditName(bill.contact.name || "");
    setEditMobile(bill.contact.mobile || "");
    setEditAddress(bill.contact.address || "");
    setEditCowReq(String(bill.contact.cow_req_ltr || 0));
    setEditBufReq(String(bill.contact.buffalo_req_ltr || 0));
    setIsEditing(true);
  };

  const handleEditSave = async () => {
    try {
      await api.updateContact(id as string, {
        name: editName,
        mobile: editMobile,
        address: editAddress,
        cow_req_ltr: parseFloat(editCowReq) || 0,
        buffalo_req_ltr: parseFloat(editBufReq) || 0,
      });
      setIsEditing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Customer updated successfully");
      loadBill();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update customer");
    }
  };

  const skipsMap: any = {};
  if (bill?.skips) {
    bill.skips.forEach((s: any) => {
      if (!skipsMap[s.date]) skipsMap[s.date] = { cow: 0, buffalo: 0 };
      if (s.milk_type === "cow") skipsMap[s.date].cow += s.qty_skipped;
      if (s.milk_type === "buffalo") skipsMap[s.date].buffalo += s.qty_skipped;
    });
  }

  const deliveriesMap: any = {};
  if (bill?.deliveries) {
    bill.deliveries.forEach((d: any) => {
      deliveriesMap[d.date] = d.status;
    });
  }

  const currentMonthDate = dayjs(bill?.month || new Date());
  const daysInMonth = currentMonthDate.daysInMonth();
  const startDay = currentMonthDate.startOf('month').day();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: startDay }, (_, i) => i);

  const handleDeleteContact = () => {
    Alert.alert(
      "Delete Customer",
      "Are you sure you want to delete this customer? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await api.deleteContact(id as string);
              router.back();
            } catch (e: any) {
              Alert.alert("Error", e.message || "Failed to delete customer");
            }
          }
        }
      ]
    );
  };

  const handleDatePress = (dateStr: string) => {
    setSelectedCalDate(dateStr);
    const skip = skipsMap[dateStr];
    setEditSkipCow(String(skip?.cow || 0));
    setEditSkipBuf(String(skip?.buffalo || 0));
  };

  const handleSaveSkip = async () => {
    if (!selectedCalDate) return;
    setAddingSkip(true);
    try {
      // Regardless of requirement, if Admin enters a value, we should upsert it.
      await api.addSkip(id as string, selectedCalDate, parseFloat(editSkipCow) || 0, "cow");
      await api.addSkip(id as string, selectedCalDate, parseFloat(editSkipBuf) || 0, "buffalo");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Skip updated successfully");
      loadBill();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update skip");
    } finally {
      setAddingSkip(false);
    }
  };

  const handleWhatsApp = () => {
    if (!bill?.contact?.mobile) return;
    
    const upiId = bill.farm_upi_id || "your-upi-id@bank";
    const upiLink = `upi://pay?pa=${upiId}&pn=Gokul%20Dairy%20Farm&am=${bill.total_amount}&cu=INR`;

    const msg = `*Gokul Dairy Farm* 🐄
----------------------------------
*Hello ${bill.contact.name},*
Here is your milk delivery bill for *${dayjs(bill.month).format("MMMM YYYY")}*.

🧾 *BILL SUMMARY*
• Delivered (Cow): ${bill.delivered_cow} L
• Delivered (Buffalo): ${bill.delivered_buffalo} L
• Extra Products: ₹${bill.product_amount}
----------------------------------
💰 *Total Amount Due: ₹${bill.total_amount}*

🔗 *Tap the link below to pay directly via any UPI App (GPay, PhonePe, Paytm):*
${upiLink}

_(If the link is not clickable, please copy our UPI ID: *${upiId}*)_

Thank you for choosing Gokul Dairy Farm! 🥛`;

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
          {contact.created_at && (
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Joined {dayjs(contact.created_at).format("DD MMM YYYY")}</Text>
          )}
        </View>
        <Pressable style={styles.waBtn} onPress={handleDeleteContact}>
          <MaterialCommunityIcons name="trash-can-outline" size={24} color={colors.error} />
        </Pressable>
        <Pressable style={styles.waBtn} onPress={handleEditOpen}>
          <MaterialCommunityIcons name="pencil" size={24} color={colors.brandPrimary} />
        </Pressable>
        <Pressable style={styles.waBtn} onPress={handleWhatsApp}>
          <MaterialCommunityIcons name="whatsapp" size={24} color="#25D366" />
        </Pressable>
      </View>

      <Modal visible={isEditing} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
          <View style={[styles.header, { marginTop: spacing.md }]}>
            <Text style={[styles.title, { flex: 1 }]}>Edit Customer</Text>
            <Pressable onPress={() => setIsEditing(false)}>
              <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}>
            <View>
              <Text style={styles.label}>Name</Text>
              <TextInput style={styles.input} value={editName} onChangeText={setEditName} />
            </View>
            <View>
              <Text style={styles.label}>Mobile</Text>
              <TextInput style={styles.input} value={editMobile} onChangeText={setEditMobile} keyboardType="phone-pad" maxLength={10} />
            </View>
            <View>
              <Text style={styles.label}>Address / Location</Text>
              <TextInput style={styles.input} value={editAddress} onChangeText={setEditAddress} />
            </View>
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Cow Req (L)</Text>
                <TextInput style={styles.input} value={editCowReq} onChangeText={setEditCowReq} keyboardType="decimal-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Buf Req (L)</Text>
                <TextInput style={styles.input} value={editBufReq} onChangeText={setEditBufReq} keyboardType="decimal-pad" />
              </View>
            </View>
            <Pressable style={[styles.primaryBtn, { marginTop: spacing.lg }]} onPress={handleEditSave}>
              <Text style={styles.primaryBtnText}>Save Changes</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>

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
          <Text style={styles.sectionTitle}>Delivery Calendar</Text>
          <Text style={styles.skipSub}>Green = Delivered, Orange = Partial Skip, Red = Full Skip</Text>
          
          <View style={styles.calRow}>
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <Text key={i} style={styles.calHeader}>{d}</Text>
            ))}
          </View>
          <View style={styles.calGrid}>
            {blanks.map(b => <View key={`blank-${b}`} style={styles.calCell} />)}
            {daysArray.map(d => {
              const dateStr = `${currentMonthDate.format("YYYY-MM")}-${String(d).padStart(2, "0")}`;
              const skip = skipsMap[dateStr];
              const deliveryStatus = deliveriesMap[dateStr];
              
              let dotColor = "transparent"; // Default is no dot unless explicitly marked
              
              if (deliveryStatus === "delivered") {
                  dotColor = colors.success;
              } else if (deliveryStatus === "partial" || deliveryStatus === "skipped_cow" || deliveryStatus === "skipped_buffalo") {
                  dotColor = "#F59E0B";
              } else if (deliveryStatus === "skipped") {
                  dotColor = colors.error;
              } else if (skip) {
                  // Fallback for skips manually added by admin without a delivery record
                  const cowReq = bill?.contact?.cow_req_ltr || 0;
                  const bufReq = bill?.contact?.buffalo_req_ltr || 0;
                  const totalReq = cowReq + bufReq;
                  const totalSkipped = (skip.cow || 0) + (skip.buffalo || 0);
                  
                  if (totalSkipped >= totalReq && totalReq > 0) {
                    dotColor = colors.error;
                  } else if (totalSkipped > 0) {
                    dotColor = "#F59E0B";
                  }
              }

              const isSelected = selectedCalDate === dateStr;

              return (
                <Pressable 
                  key={d} 
                  style={[styles.calCell, isSelected && styles.calCellSelected]} 
                  onPress={() => handleDatePress(dateStr)}
                >
                  <Text style={[styles.calDayText, isSelected && { color: colors.brandPrimary, fontWeight: "700" }]}>{d}</Text>
                  <View style={[styles.calDot, { backgroundColor: dotColor }]} />
                </Pressable>
              );
            })}
          </View>

          {selectedCalDate && (
            <View style={styles.calDetailsBox}>
              <Text style={styles.calDetailsTitle}>{dayjs(selectedCalDate).format("DD MMM YYYY")}</Text>
              
              <View style={{ flexDirection: "row", gap: spacing.md, marginBottom: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Cow Skipped (L)</Text>
                  <TextInput 
                    style={styles.input} 
                    value={editSkipCow} 
                    onChangeText={setEditSkipCow} 
                    keyboardType="decimal-pad" 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Buf Skipped (L)</Text>
                  <TextInput 
                    style={styles.input} 
                    value={editSkipBuf} 
                    onChangeText={setEditSkipBuf} 
                    keyboardType="decimal-pad" 
                  />
                </View>
              </View>
              <Text style={{fontSize: 12, color: colors.muted, marginBottom: spacing.md}}>Set to 0 to remove skip and mark as fully delivered.</Text>
              
              <Pressable style={styles.primaryBtn} onPress={handleSaveSkip} disabled={addingSkip}>
                {addingSkip ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={styles.primaryBtnText}>Save Skip for {dayjs(selectedCalDate).format("DD MMM")}</Text>}
              </Pressable>
            </View>
          )}
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
  qrSub: { fontSize: 13, color: colors.muted, marginBottom: spacing.md },
  qrWrapper: { backgroundColor: "#fff", padding: spacing.md, borderRadius: radius.md },
  
  label: { fontSize: 14, fontWeight: "600", color: colors.onSurface, marginBottom: 4 },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    color: colors.onSurface,
  },
  
  calRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: spacing.sm },
  calHeader: { width: 36, textAlign: "center", fontSize: 13, fontWeight: "600", color: colors.muted },
  calGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start", rowGap: spacing.sm },
  calCell: { width: `${100 / 7}%`, height: 44, alignItems: "center", justifyContent: "center", borderRadius: radius.sm },
  calCellSelected: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.brandPrimary },
  calDayText: { fontSize: 15, color: colors.onSurface, marginBottom: 2 },
  calDot: { width: 6, height: 6, borderRadius: 3 },
  
  calDetailsBox: { marginTop: spacing.xl, padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  calDetailsTitle: { fontSize: 16, fontWeight: "600", color: colors.onSurface, marginBottom: spacing.md },
  
  segmentedControl: { flexDirection: "row", backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, padding: 4, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  segment: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: radius.sm },
  segmentActive: { backgroundColor: colors.surface, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  segmentText: { fontSize: 14, fontWeight: "600", color: colors.muted },
  segmentTextActive: { color: colors.brandPrimary },
});
