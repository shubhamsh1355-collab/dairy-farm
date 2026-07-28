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
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "@/src/api";
import { colors, radius, shadow, spacing, type } from "@/src/theme";

export default function HerdScreen() {
  const router = useRouter();
  const [cows, setCows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newBreed, setNewBreed] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCows();
  }, []);

  const fetchCows = async () => {
    try {
      setLoading(true);
      const res = await api.cows();
      setCows(res.cows || []);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCow = async () => {
    if (!newTag) {
      Alert.alert("Validation", "Tag is required.");
      return;
    }
    try {
      setSubmitting(true);
      await api.addCow({ tag: newTag, breed: newBreed, status: "Healthy" });
      setNewTag("");
      setNewBreed("");
      setIsAddModalVisible(false);
      fetchCows();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const sortedCows = [...cows].sort((a, b) => {
    const aSick = a.status !== "Healthy";
    const bSick = b.status !== "Healthy";
    if (aSick && !bSick) return -1;
    if (!aSick && bSick) return 1;
    return 0;
  });

  const renderCow = ({ item }: { item: any }) => {
    const isUnhealthy = item.status !== "Healthy";
    return (
      <TouchableOpacity
        style={[styles.card, isUnhealthy && styles.cardAlert]}
        onPress={() => router.push(`/cow/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, isUnhealthy && styles.textAlert]}>
            Tag: {item.tag}
          </Text>
          <View style={[styles.statusBadge, isUnhealthy ? styles.statusBadgeAlert : styles.statusBadgeHealthy]}>
            <Text style={[styles.statusText, isUnhealthy ? styles.statusTextAlert : styles.statusTextHealthy]}>
              {item.status || "Healthy"}
            </Text>
          </View>
        </View>
        {!!item.breed && (
          <Text style={styles.cardSubtitle}>Breed: {item.breed}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Herd</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsAddModalVisible(true)}
        >
          <MaterialCommunityIcons name="plus" size={20} color={colors.surfaceSecondary} />
          <Text style={styles.addButtonText}>Add Cow</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brandPrimary} />
        </View>
      ) : (
        <FlatList
          data={sortedCows}
          keyExtractor={(item) => item.id}
          renderItem={renderCow}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No cows in your herd yet.</Text>
          }
        />
      )}

      <Modal visible={isAddModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Cow</Text>
              <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tag Number *</Text>
              <TextInput
                style={styles.input}
                value={newTag}
                onChangeText={setNewTag}
                placeholder="e.g. 101"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Breed (Optional)</Text>
              <TextInput
                style={styles.input}
                value={newBreed}
                onChangeText={setNewBreed}
                placeholder="e.g. Holstein"
                placeholderTextColor={colors.muted}
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddCow}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.surfaceSecondary} />
              ) : (
                <Text style={styles.submitButtonText}>Save Cow</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
  headerTitle: { fontSize: type.xl, fontWeight: "700", color: colors.brandPrimary },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  addButtonText: {
    color: colors.surfaceSecondary,
    fontWeight: "600",
    marginLeft: spacing.xs,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: spacing.lg },
  card: {
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.lg,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    ...shadow.card,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  cardAlert: {
    borderColor: colors.error,
    backgroundColor: "#FEF2F2",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  cardTitle: { fontSize: type.lg, fontWeight: "600", color: colors.onSurface },
  textAlert: { color: colors.error },
  cardSubtitle: { fontSize: type.base, color: colors.muted },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  statusBadgeHealthy: { backgroundColor: colors.brandTertiary },
  statusBadgeAlert: { backgroundColor: "#FEE2E2" },
  statusText: { fontSize: type.sm, fontWeight: "600" },
  statusTextHealthy: { color: colors.brandPrimary },
  statusTextAlert: { color: colors.error },
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
});
