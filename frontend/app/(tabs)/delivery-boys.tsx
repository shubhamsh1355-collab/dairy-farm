import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "@/src/api";
import { colors, spacing, radius, shadow } from "@/src/theme";

export default function DeliveryBoysScreen() {
  const [boys, setBoys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.deliveryBoys();
      setBoys(res.delivery_boys || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleAdd() {
    if (!name || !mobile || !pin) {
      alert("All fields are required");
      return;
    }
    setSaving(true);
    try {
      await api.addDeliveryBoy({ name, mobile, pin });
      setShowAdd(false);
      setName(""); setMobile(""); setPin("");
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Delete this delivery partner?")) {
      try {
        await api.deleteDeliveryBoy(id);
        load();
      } catch (e: any) {
        alert(e.message);
      }
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Delivery Partners</Text>
          <Text style={styles.sub}>Manage your delivery team</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <ActivityIndicator color={colors.brandPrimary} />
        ) : boys.length === 0 ? (
          <Text style={styles.empty}>No delivery partners found.</Text>
        ) : (
          boys.map((boy) => (
            <View key={boy.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <MaterialCommunityIcons name="moped" size={24} color={colors.brandPrimary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{boy.name}</Text>
                  <Text style={styles.cardMobile}>{boy.mobile}</Text>
                </View>
                <Pressable onPress={() => handleDelete(boy.id)} style={styles.delBtn}>
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.error} />
                </Pressable>
              </View>
              <View style={styles.pinBox}>
                <MaterialCommunityIcons name="key-variant" size={14} color={colors.muted} />
                <Text style={styles.pinText}>Login PIN: {boy.pin}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showAdd} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Delivery Partner</Text>
            
            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Ramesh" />

            <Text style={styles.label}>Mobile Number</Text>
            <TextInput style={styles.input} value={mobile} onChangeText={setMobile} keyboardType="phone-pad" placeholder="10-digit mobile" />

            <Text style={styles.label}>4-Digit Login PIN</Text>
            <TextInput style={styles.input} value={pin} onChangeText={setPin} keyboardType="number-pad" placeholder="1234" maxLength={4} />

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={handleAdd} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Partner</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 28, fontWeight: "700", color: colors.onSurface },
  sub: { fontSize: 14, color: colors.muted, marginTop: 4 },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brandPrimary,
    justifyContent: "center",
    alignItems: "center",
    ...shadow.md,
  },
  scroll: { padding: spacing.xl, paddingBottom: 100 },
  empty: { textAlign: "center", color: colors.muted, marginTop: spacing.xl },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brandPrimary + "15", justifyContent: "center", alignItems: "center" },
  cardName: { fontSize: 16, fontWeight: "700", color: colors.onSurface },
  cardMobile: { fontSize: 13, color: colors.muted, marginTop: 2 },
  delBtn: { padding: 8 },
  pinBox: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.md, backgroundColor: colors.surfaceTertiary, padding: spacing.sm, borderRadius: radius.sm, alignSelf: "flex-start" },
  pinText: { fontSize: 12, fontWeight: "600", color: colors.muted },

  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: spacing.xl },
  modalContent: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: spacing.lg },
  label: { fontSize: 13, color: colors.onSurfaceTertiary, marginBottom: 4, marginTop: spacing.sm },
  input: { height: 48, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md },
  modalActions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xl },
  cancelBtn: { flex: 1, height: 48, justifyContent: "center", alignItems: "center" },
  cancelText: { color: colors.muted, fontWeight: "600", fontSize: 15 },
  saveBtn: { flex: 1, height: 48, backgroundColor: colors.brandPrimary, borderRadius: radius.md, justifyContent: "center", alignItems: "center" },
  saveText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
