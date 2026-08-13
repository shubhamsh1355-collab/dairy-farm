import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { api, clearSession } from "@/src/api";
import { colors, spacing, radius, shadow } from "@/src/theme";

export default function DeliveryDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.getDeliveryRoute());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleAction(contactId: string, status: "delivered" | "skipped") {
    try {
      await api.markDelivery(contactId, status);
      await load(); // Reload to reflect changes
    } catch (e) {
      alert("Failed to mark delivery");
    }
  }

  function handleStartRoute() {
    if (!data?.route) return;
    
    // Find un-delivered contacts with GPS coordinates or address
    const uncompleted = data.route.filter((c: any) => 
      !data.deliveries?.some((d: any) => d.contact_id === c.id)
    );
    
    if (uncompleted.length === 0) {
      alert("No deliveries left!");
      return;
    }

    // Google maps waypoints URL format: https://www.google.com/maps/dir/?api=1&destination=Dest&waypoints=WP1|WP2
    const waypoints = uncompleted.map((c: any) => {
      if (c.lat && c.lng) return `${c.lat},${c.lng}`;
      if (c.address) return encodeURIComponent(c.address);
      return "";
    }).filter(Boolean);

    if (waypoints.length === 0) {
      alert("No addresses or GPS locations available for routing.");
      return;
    }

    const destination = waypoints.pop();
    const wpString = waypoints.join("|");
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}${wpString ? `&waypoints=${wpString}` : ""}`;
    
    Linking.openURL(url);
  }

  const totalCow = data?.route?.reduce((sum: number, c: any) => sum + (c.cow_req_ltr || 0), 0) || 0;
  const totalBuf = data?.route?.reduce((sum: number, c: any) => sum + (c.buffalo_req_ltr || 0), 0) || 0;
  
  let deliveredCow = 0;
  let deliveredBuf = 0;
  let skippedCow = 0;
  let skippedBuf = 0;

  (data?.route || []).forEach((c: any) => {
    const delivery = data?.deliveries?.find((d: any) => d.contact_id === c.id);
    if (delivery) {
      if (delivery.status === "delivered") {
        deliveredCow += c.cow_req_ltr || 0;
        deliveredBuf += c.buffalo_req_ltr || 0;
      } else if (delivery.status === "skipped") {
        skippedCow += c.cow_req_ltr || 0;
        skippedBuf += c.buffalo_req_ltr || 0;
      }
    }
  });

  const leftoverCow = totalCow - deliveredCow - skippedCow;
  const leftoverBuf = totalBuf - deliveredBuf - skippedBuf;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>My Route</Text>
        <Pressable onPress={async () => {
          await clearSession();
          router.replace("/auth");
        }} style={styles.logoutBtn}>
          <MaterialCommunityIcons name="logout" size={20} color={colors.error} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading && !data ? (
          <ActivityIndicator color={colors.brandPrimary} />
        ) : (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Live Inventory</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.sumBox}>
                  <Text style={styles.sumVal}>{totalCow}L / {totalBuf}L</Text>
                  <Text style={styles.sumLbl}>Total Assigned</Text>
                </View>
                <View style={styles.sumBox}>
                  <Text style={[styles.sumVal, { color: colors.success }]}>{deliveredCow}L / {deliveredBuf}L</Text>
                  <Text style={styles.sumLbl}>Delivered</Text>
                </View>
                <View style={[styles.sumBox, { backgroundColor: colors.surfaceTertiary }]}>
                  <Text style={[styles.sumVal, { color: colors.brandSecondary }]}>{leftoverCow}L / {leftoverBuf}L</Text>
                  <Text style={styles.sumLbl}>Pending</Text>
                </View>
                <View style={styles.sumBox}>
                  <Text style={[styles.sumVal, { color: colors.error }]}>{skippedCow}L / {skippedBuf}L</Text>
                  <Text style={styles.sumLbl}>Skipped (Return)</Text>
                </View>
              </View>
            </View>

            <Pressable style={styles.mapBtn} onPress={handleStartRoute}>
              <MaterialCommunityIcons name="google-maps" size={20} color="#fff" />
              <Text style={styles.mapBtnText}>Start Map Route</Text>
            </Pressable>

            <Text style={styles.sectionTitle}>Deliveries</Text>
            {data?.route?.length === 0 && <Text style={styles.empty}>No homes assigned to your route.</Text>}
            
            {(data?.route || []).map((contact: any) => {
              const delivery = data?.deliveries?.find((d: any) => d.contact_id === contact.id);
              return <DeliveryCard key={contact.id} contact={contact} delivery={delivery} onAction={handleAction} />;
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DeliveryCard({ contact, delivery, onAction }: any) {
  const isDone = !!delivery;
  const hasBoth = contact.cow_req_ltr > 0 && contact.buffalo_req_ltr > 0;
  const [showPartial, setShowPartial] = useState(false);
  const [skipCow, setSkipCow] = useState(contact.cow_req_ltr > 0 ? String(contact.cow_req_ltr) : "0");
  const [skipBuf, setSkipBuf] = useState(contact.buffalo_req_ltr > 0 ? String(contact.buffalo_req_ltr) : "0");

  return (
    <View style={[styles.contactCard, isDone && styles.contactCardDone]}>
      <View style={styles.contactHeader}>
        <Text style={[styles.contactName, isDone && styles.textDone]}>{contact.name}</Text>
        <Text style={[styles.contactAddress, isDone && styles.textDone]}>{contact.address || contact.mobile}</Text>
      </View>
      <View style={styles.reqRow}>
        <View style={styles.reqPill}>
          <Text style={[styles.reqText, isDone && styles.textDone]}>🐄 {contact.cow_req_ltr || 0} L</Text>
        </View>
        <View style={styles.reqPill}>
          <Text style={[styles.reqText, isDone && styles.textDone]}>🐃 {contact.buffalo_req_ltr || 0} L</Text>
        </View>
      </View>

      {!isDone ? (
        <View style={{ gap: 8, marginTop: 8 }}>
          {showPartial ? (
            <View style={styles.partialBox}>
              <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 8, color: colors.onSurface }}>Record Skipped Amount:</Text>
              {contact.cow_req_ltr > 0 && (
                <View style={styles.partialInputRow}>
                  <Text style={styles.partialLabel}>Cow (L)</Text>
                  <TextInput value={skipCow} onChangeText={setSkipCow} style={styles.partialInput} keyboardType="decimal-pad" selectTextOnFocus />
                </View>
              )}
              {contact.buffalo_req_ltr > 0 && (
                <View style={styles.partialInputRow}>
                  <Text style={styles.partialLabel}>Buffalo (L)</Text>
                  <TextInput value={skipBuf} onChangeText={setSkipBuf} style={styles.partialInput} keyboardType="decimal-pad" selectTextOnFocus />
                </View>
              )}
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                <Pressable style={[styles.actionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]} onPress={() => setShowPartial(false)}>
                  <Text style={[styles.actionText, { color: colors.onSurface }]}>Cancel</Text>
                </Pressable>
                <Pressable style={[styles.actionBtn, { backgroundColor: colors.error }]} onPress={() => onAction(contact.id, "partial", parseFloat(skipCow) || 0, parseFloat(skipBuf) || 0)}>
                  <Text style={[styles.actionText, { color: "#fff" }]}>Confirm Skip</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              {hasBoth && (
                <View style={styles.actionRow}>
                  <Pressable style={[styles.actionBtn, { backgroundColor: colors.error + "20" }]} onPress={() => onAction(contact.id, "skipped_cow")}>
                    <Text style={[styles.actionText, { color: colors.error }]}>Skip Cow</Text>
                  </Pressable>
                  <Pressable style={[styles.actionBtn, { backgroundColor: colors.error + "20" }]} onPress={() => onAction(contact.id, "skipped_buffalo")}>
                    <Text style={[styles.actionText, { color: colors.error }]}>Skip Buffalo</Text>
                  </Pressable>
                </View>
              )}
              <View style={styles.actionRow}>
                <Pressable style={[styles.actionBtn, { backgroundColor: colors.surfaceTertiary, flex: 0.8 }]} onPress={() => setShowPartial(true)}>
                  <Text style={[styles.actionText, { color: colors.onSurface }]}>Partial</Text>
                </Pressable>
                <Pressable style={[styles.actionBtn, { backgroundColor: colors.error + "20", flex: 1.2 }]} onPress={() => onAction(contact.id, "skipped")}>
                  <Text style={[styles.actionText, { color: colors.error }]}>{hasBoth ? "Skip Both" : "Skipped"}</Text>
                </Pressable>
                <Pressable style={[styles.actionBtn, { backgroundColor: colors.brandPrimary, flex: 1.5 }]} onPress={() => onAction(contact.id, "delivered")}>
                  <Text style={[styles.actionText, { color: "#fff" }]}>Delivered</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      ) : (
        <View style={styles.statusBox}>
          <MaterialCommunityIcons 
            name={delivery.status === "delivered" ? "check-circle" : (delivery.status.includes("skipped") || delivery.status === "partial" ? "close-circle" : "alert-circle")} 
            size={16} 
            color={delivery.status === "delivered" ? colors.success : colors.error} 
          />
          <Text style={styles.statusText}>
            {delivery.status === "skipped_cow" ? "Skipped Cow" : 
             delivery.status === "skipped_buffalo" ? "Skipped Buffalo" : 
             delivery.status === "partial" ? "Partial Delivery" :
             `Marked as ${delivery.status}`}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { padding: spacing.xl, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "700", color: colors.onSurface },
  logoutBtn: { padding: 8, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md },
  scroll: { padding: spacing.xl, paddingBottom: 100 },
  
  summaryCard: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  summaryTitle: { fontSize: 16, fontWeight: "600", color: colors.onSurface, marginBottom: spacing.md },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  sumBox: { flex: 1, minWidth: "45%", backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  sumVal: { fontSize: 18, fontWeight: "700", color: colors.onSurface },
  sumLbl: { fontSize: 11, color: colors.muted, marginTop: 4 },

  mapBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.brandPrimary, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.xl, ...shadow.card },
  mapBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  sectionTitle: { fontSize: 18, fontWeight: "600", color: colors.onSurface, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", padding: spacing.lg },

  contactCard: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  contactCardDone: { opacity: 0.6, backgroundColor: colors.surfaceTertiary },
  contactHeader: { marginBottom: spacing.sm },
  contactName: { fontSize: 16, fontWeight: "700", color: colors.onSurface },
  contactAddress: { fontSize: 13, color: colors.muted },
  textDone: { color: colors.muted },
  reqRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  reqPill: { backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99, borderWidth: 1, borderColor: colors.border },
  reqText: { fontSize: 12, fontWeight: "600", color: colors.onSurface },
  
  actionRow: { flexDirection: "row", gap: spacing.md },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  actionText: { fontWeight: "700", fontSize: 14 },
  
  statusBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.surface, padding: spacing.sm, borderRadius: radius.md, alignSelf: "flex-start" },
  statusText: { fontSize: 13, fontWeight: "600", color: colors.muted },

  partialBox: { padding: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  partialInputRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  partialLabel: { fontSize: 14, color: colors.onSurfaceSecondary },
  partialInput: { width: 80, height: 36, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 8, textAlign: "center", backgroundColor: colors.surfaceSecondary },
});
