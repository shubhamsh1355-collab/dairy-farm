import { useCallback, useState } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { api } from "@/src/api";
import { colors, spacing, radius, shadow } from "@/src/theme";

type Contact = { id: string; name: string; mobile: string; daily_requirement_ltr?: number; rate_per_ltr?: number };

export default function Customers() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactMobile, setNewContactMobile] = useState("");
  const [newContactReq, setNewContactReq] = useState("");
  const [newContactRate, setNewContactRate] = useState("");
  const [isAddingContact, setIsAddingContact] = useState(false);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.contacts();
      setContacts(res.contacts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadContacts();
    }, [loadContacts])
  );

  const toggleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === contacts.length) setSelected(new Set());
    else setSelected(new Set(contacts.map(c => c.id)));
  };

  const handleSend = async () => {
    if (!message.trim()) {
      Alert.alert("Error", "Message is required.");
      return;
    }
    if (selected.size === 0) {
      Alert.alert("Error", "Select at least one contact.");
      return;
    }

    setSending(true);
    try {
      await api.sendBroadcast(message, Array.from(selected));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Broadcast sent successfully!");
      setMessage("");
      setSelected(new Set());
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSending(false);
    }
  };

  const handleAddContact = async () => {
    if (!newContactName.trim() || !newContactMobile.trim()) {
      Alert.alert("Error", "Name and mobile are required.");
      return;
    }
    try {
      await api.addContact({
        name: newContactName,
        mobile: newContactMobile,
        daily_requirement_ltr: newContactReq ? parseFloat(newContactReq) : undefined,
        rate_per_ltr: newContactRate ? parseFloat(newContactRate) : undefined,
      });
      setNewContactName("");
      setNewContactMobile("");
      setNewContactReq("");
      setNewContactRate("");
      setIsAddingContact(false);
      loadContacts();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.surface }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <View>
          <Text style={styles.title}>Customers</Text>
          <Text style={styles.sub}>Manage and Broadcast</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => setIsAddingContact(!isAddingContact)}>
          <MaterialCommunityIcons name={isAddingContact ? "close" : "account-plus"} size={20} color={colors.onBrandPrimary} />
          <Text style={styles.addBtnText}>{isAddingContact ? "Cancel" : "Add Contact"}</Text>
        </Pressable>
      </SafeAreaView>

      {isAddingContact && (
        <View style={styles.addContactCard}>
          <TextInput
            placeholder="Name"
            placeholderTextColor={colors.muted}
            value={newContactName}
            onChangeText={setNewContactName}
            style={styles.input}
          />
          <TextInput
            placeholder="Mobile (+91...)"
            placeholderTextColor={colors.muted}
            value={newContactMobile}
            onChangeText={setNewContactMobile}
            keyboardType="phone-pad"
            style={styles.input}
          />
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <TextInput
              placeholder="Daily Req (L)"
              placeholderTextColor={colors.muted}
              value={newContactReq}
              onChangeText={setNewContactReq}
              keyboardType="numeric"
              style={[styles.input, { flex: 1 }]}
            />
            <TextInput
              placeholder="Rate (₹/L)"
              placeholderTextColor={colors.muted}
              value={newContactRate}
              onChangeText={setNewContactRate}
              keyboardType="numeric"
              style={[styles.input, { flex: 1 }]}
            />
          </View>
          <Pressable style={styles.addContactSubmit} onPress={handleAddContact}>
            <Text style={styles.addContactSubmitText}>Save Contact</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.composer}>
        <TextInput
          placeholder="Type your message here..."
          placeholderTextColor={colors.muted}
          value={message}
          onChangeText={setMessage}
          multiline
          style={styles.textArea}
        />
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Recipients ({selected.size}/{contacts.length})</Text>
        <Pressable onPress={toggleAll}>
          <Text style={styles.selectAllText}>{selected.size === contacts.length ? "Deselect All" : "Select All"}</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100, gap: spacing.sm }}
          renderItem={({ item }) => {
            const isSelected = selected.has(item.id);
            return (
              <Pressable 
                style={[styles.contactRow, isSelected && styles.contactRowSelected]} 
                onPress={() => router.push(`/customer/${item.id}`)}
              >
                <Pressable onPress={() => toggleSelect(item.id)} style={{ padding: spacing.xs, marginLeft: -spacing.xs }}>
                  <MaterialCommunityIcons
                    name={isSelected ? "check-circle" : "circle-outline"}
                    size={24}
                    color={isSelected ? colors.brandPrimary : colors.muted}
                  />
                </Pressable>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactName}>{item.name}</Text>
                  <Text style={styles.contactMobile}>{item.mobile}</Text>
                </View>
                {!!item.daily_requirement_ltr && (
                  <View style={styles.reqBadge}>
                    <Text style={styles.reqBadgeText}>{item.daily_requirement_ltr}L daily</Text>
                  </View>
                )}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No contacts found. Add some to start broadcasting.</Text>
            </View>
          }
        />
      )}

      <View style={styles.footer}>
        <Pressable
          style={[styles.sendBtn, (selected.size === 0 || !message.trim()) && { opacity: 0.5 }]}
          onPress={handleSend}
          disabled={selected.size === 0 || !message.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator color={colors.onBrandPrimary} />
          ) : (
            <>
              <MaterialCommunityIcons name="whatsapp" size={20} color={colors.onBrandPrimary} />
              <Text style={styles.sendBtnText}>Send via WhatsApp</Text>
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    backgroundColor: colors.surface,
  },
  title: { fontSize: 24, fontWeight: "700", color: colors.onSurface },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.md,
    height: 36,
    borderRadius: 999,
  },
  addBtnText: { color: colors.onBrandPrimary, fontWeight: "600", fontSize: 13 },
  addContactCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    color: colors.onSurface,
  },
  addContactSubmit: {
    height: 44,
    backgroundColor: colors.brandTertiary,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  addContactSubmitText: { color: colors.brandPrimary, fontWeight: "600", fontSize: 14 },
  composer: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  textArea: {
    height: 120,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: 15,
    color: colors.onSurface,
    textAlignVertical: "top",
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  listTitle: { fontSize: 14, fontWeight: "600", color: colors.onSurface },
  selectAllText: { fontSize: 13, color: colors.brandPrimary, fontWeight: "500" },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  contactRowSelected: {
    borderColor: colors.brandPrimary,
    backgroundColor: "rgba(39, 92, 59, 0.05)",
  },
  contactName: { fontSize: 15, fontWeight: "600", color: colors.onSurface },
  contactMobile: { fontSize: 13, color: colors.muted, marginTop: 2 },
  reqBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reqBadgeText: { fontSize: 12, fontWeight: "600", color: colors.brandPrimary },
  empty: { padding: spacing.xl, alignItems: "center" },
  emptyText: { color: colors.muted, fontSize: 14, textAlign: "center" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sendBtn: {
    flexDirection: "row",
    height: 52,
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  sendBtnText: { color: colors.onBrandPrimary, fontSize: 16, fontWeight: "600" },
});
