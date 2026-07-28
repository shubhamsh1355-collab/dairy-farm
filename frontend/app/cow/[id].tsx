import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "@/src/api";
import { colors, radius, shadow, spacing, type } from "@/src/theme";

const STATUSES = ["Healthy", "Sick", "Dry", "Under Treatment"];

export default function CowDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cow, setCow] = useState<any>(null);

  const [isAddEventModalVisible, setIsAddEventModalVisible] = useState(false);
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventNotes, setEventNotes] = useState("");
  const [submittingEvent, setSubmittingEvent] = useState(false);

  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [submittingStatus, setSubmittingStatus] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const cowsRes = await api.cows();
      const currentCow = cowsRes.cows.find((c: any) => c.id === id);
      setCow(currentCow);

      const eventsRes = await api.cowEvents(id as string);
      setEvents(eventsRes.events || []);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async () => {
    if (!eventType || !eventDate) {
      Alert.alert("Validation", "Type and Date are required.");
      return;
    }
    try {
      setSubmittingEvent(true);
      await api.addCowEvent(id as string, { type: eventType, date: eventDate, notes: eventNotes });
      setIsAddEventModalVisible(false);
      setEventType("");
      setEventDate("");
      setEventNotes("");
      fetchData();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSubmittingEvent(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      setSubmittingStatus(true);
      await api.updateCowStatus(id as string, newStatus);
      setIsStatusModalVisible(false);
      fetchData();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSubmittingStatus(false);
    }
  };

  const renderEvent = ({ item }: { item: any }) => (
    <View style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventType}>{item.type}</Text>
        <Text style={styles.eventDate}>{item.date}</Text>
      </View>
      {!!item.notes && <Text style={styles.eventNotes}>{item.notes}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cow Details</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.cowInfoCard}>
              <View style={styles.cowInfoHeader}>
                <View>
                  <Text style={styles.cowTitle}>Tag: {cow?.tag}</Text>
                  {!!cow?.breed && <Text style={styles.cowSubtitle}>Breed: {cow.breed}</Text>}
                </View>
                <TouchableOpacity
                  style={[styles.statusBadge, cow?.status !== "Healthy" ? styles.statusBadgeAlert : styles.statusBadgeHealthy]}
                  onPress={() => setIsStatusModalVisible(true)}
                >
                  <Text style={[styles.statusText, cow?.status !== "Healthy" ? styles.statusTextAlert : styles.statusTextHealthy]}>
                    {cow?.status || "Healthy"}
                  </Text>
                  <MaterialCommunityIcons name="pencil" size={12} color={cow?.status !== "Healthy" ? colors.error : colors.brandPrimary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setIsAddEventModalVisible(true)}
                >
                  <MaterialCommunityIcons name="calendar-plus" size={20} color={colors.brandPrimary} />
                  <Text style={styles.actionButtonText}>Add Event</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setIsStatusModalVisible(true)}
                >
                  <MaterialCommunityIcons name="heart-pulse" size={20} color={colors.brandPrimary} />
                  <Text style={styles.actionButtonText}>Update Status</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No events recorded.</Text>
          }
        />
      )}

      {/* Add Event Modal */}
      <Modal visible={isAddEventModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Event</Text>
              <TouchableOpacity onPress={() => setIsAddEventModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type * (e.g. Vaccination, Insemination)</Text>
              <TextInput
                style={styles.input}
                value={eventType}
                onChangeText={setEventType}
                placeholder="e.g. Vaccination"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date * (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={eventDate}
                onChangeText={setEventDate}
                placeholder="2026-07-28"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                value={eventNotes}
                onChangeText={setEventNotes}
                placeholder="Additional details..."
                placeholderTextColor={colors.muted}
                multiline
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddEvent}
              disabled={submittingEvent}
            >
              {submittingEvent ? (
                <ActivityIndicator color={colors.surfaceSecondary} />
              ) : (
                <Text style={styles.submitButtonText}>Save Event</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Update Status Modal */}
      <Modal visible={isStatusModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlayCenter}>
          <View style={styles.modalContentCenter}>
            <Text style={styles.modalTitleCenter}>Update Status</Text>
            {STATUSES.map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.statusOption, cow?.status === status && styles.statusOptionSelected]}
                onPress={() => handleUpdateStatus(status)}
                disabled={submittingStatus}
              >
                <Text style={[styles.statusOptionText, cow?.status === status && styles.statusOptionTextSelected]}>
                  {status}
                </Text>
                {cow?.status === status && (
                  <MaterialCommunityIcons name="check" size={20} color={colors.brandPrimary} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsStatusModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  backButton: { padding: spacing.xs },
  headerTitle: { fontSize: type.xl, fontWeight: "700", color: colors.onSurface },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: spacing.lg },
  
  cowInfoCard: {
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.lg,
    borderRadius: radius.md,
    marginBottom: spacing.xl,
    ...shadow.card,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  cowInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  cowTitle: { fontSize: type.xl, fontWeight: "700", color: colors.onSurface },
  cowSubtitle: { fontSize: type.base, color: colors.muted, marginTop: spacing.xs },
  
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  statusBadgeHealthy: { backgroundColor: colors.brandTertiary },
  statusBadgeAlert: { backgroundColor: "#FEE2E2" },
  statusText: { fontSize: type.sm, fontWeight: "600" },
  statusTextHealthy: { color: colors.brandPrimary },
  statusTextAlert: { color: colors.error },
  
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
  },
  actionButtonText: {
    color: colors.brandPrimary,
    fontWeight: "600",
    marginLeft: spacing.xs,
  },

  eventCard: {
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.brandPrimary,
    ...shadow.card,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  eventType: { fontSize: type.lg, fontWeight: "600", color: colors.onSurface },
  eventDate: { fontSize: type.sm, color: colors.muted },
  eventNotes: { fontSize: type.base, color: colors.onSurfaceTertiary, marginTop: spacing.xs },
  
  emptyText: {
    textAlign: "center",
    color: colors.muted,
    fontSize: type.base,
    marginTop: spacing.xl,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surfaceSecondary,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  modalTitle: { fontSize: type.xl, fontWeight: "700", color: colors.onSurface },
  inputGroup: { marginBottom: spacing.lg },
  label: {
    fontSize: type.sm,
    fontWeight: "600",
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: type.base,
    color: colors.onSurface,
  },
  submitButton: {
    backgroundColor: colors.brandPrimary,
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  submitButtonText: {
    color: colors.surfaceSecondary,
    fontSize: type.lg,
    fontWeight: "600",
  },

  modalOverlayCenter: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContentCenter: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: "80%",
  },
  modalTitleCenter: {
    fontSize: type.xl,
    fontWeight: "700",
    color: colors.onSurface,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  statusOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  statusOptionSelected: {
    borderColor: colors.brandPrimary,
    backgroundColor: colors.brandTertiary,
  },
  statusOptionText: {
    fontSize: type.base,
    color: colors.onSurface,
    fontWeight: "500",
  },
  statusOptionTextSelected: {
    color: colors.brandPrimary,
    fontWeight: "600",
  },
  cancelButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: type.base,
    fontWeight: "600",
    color: colors.muted,
  },
});
