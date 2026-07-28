import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { api, loadFarm } from "@/src/api";
import { colors, spacing, radius, shadow, images } from "@/src/theme";

export default function Home() {
  const router = useRouter();
  const [farm, setFarm] = useState<any>(null);
  const [todayLog, setTodayLog] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [f, m] = await Promise.all([loadFarm(), api.todayMilk()]);
      setFarm(f);
      setTodayLog(m.log);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning,</Text>
          <Text style={styles.farmName}>{farm?.farm_name || "Loading..."}</Text>
        </View>
        <Pressable
          testID="profile-btn"
          style={styles.profileBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/profile");
          }}
        >
          <MaterialCommunityIcons name="account" size={24} color={colors.onSurface} />
        </Pressable>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {loading && !todayLog ? (
          <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: spacing.xl }} />
        ) : (
          <>
            <View style={styles.heroWrap}>
              <Image source={{ uri: images.hero_farm }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
              <LinearGradient
                colors={["rgba(28,27,26,0.1)", "rgba(28,27,26,0.7)"]}
                style={StyleSheet.absoluteFillObject}
              />
              <BlurView intensity={20} tint="dark" style={styles.heroGlass}>
                <Text style={styles.heroTitle}>Today's Overview</Text>
                <View style={styles.heroGrid}>
                  <HeroMetric label="Produced" value={`${todayLog?.produced_ltr ?? 0} L`} />
                  <HeroMetric label="Delivered" value={`${todayLog?.delivered_ltr ?? 0} L`} />
                  <HeroMetric label="Used" value={`${todayLog?.used_for_products_ltr ?? 0} L`} />
                  <HeroMetric label="Remaining" value={`${todayLog?.remaining_ltr ?? 0} L`} highlight />
                </View>
              </BlurView>
            </View>

            <View style={styles.actionsSection}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md, paddingHorizontal: spacing.xl }}>
                <QuickAction
                  icon="cup-water"
                  label="Log Milk"
                  color={colors.brandPrimary}
                  onPress={() => router.push("/log-milk")}
                />
                <QuickAction
                  icon="cart"
                  label="Sell Products"
                  color={colors.brandSecondary}
                  onPress={() => router.push("/(tabs)/products")}
                />
                <QuickAction
                  icon="whatsapp"
                  label="Broadcast"
                  color={colors.success}
                  onPress={() => router.push("/(tabs)/broadcast")}
                />
              </ScrollView>
            </View>
          </>
        )}
      </ScrollView>

      <Pressable
        testID="fab-log-milk"
        style={styles.fab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/log-milk");
        }}
      >
        <MaterialCommunityIcons name="plus" size={24} color={colors.onBrandPrimary} />
        <Text style={styles.fabText}>Log Milk</Text>
      </Pressable>
    </View>
  );
}

function HeroMetric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, highlight && { color: colors.success }]}>{value}</Text>
    </View>
  );
}

function QuickAction({ icon, label, color, onPress }: any) {
  return (
    <Pressable style={styles.actionCard} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: color + "20" }]}>
        <MaterialCommunityIcons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: { fontSize: 13, color: colors.muted },
  farmName: { fontSize: 22, fontWeight: "700", color: colors.onSurface },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  heroWrap: {
    margin: spacing.xl,
    borderRadius: radius.lg,
    overflow: "hidden",
    height: 220,
    ...shadow.card,
  },
  heroGlass: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: "center",
  },
  heroTitle: { fontSize: 16, fontWeight: "600", color: colors.onSurfaceInverse, marginBottom: spacing.md },
  heroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  metricCard: {
    width: "47%",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  metricLabel: { fontSize: 11, color: "rgba(255,255,255,0.7)" },
  metricValue: { fontSize: 18, fontWeight: "700", color: colors.onSurfaceInverse, marginTop: 2 },
  actionsSection: { paddingVertical: spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.onSurface, paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  actionCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
    width: 110,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  actionLabel: { fontSize: 13, fontWeight: "600", color: colors.onSurface },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: colors.brandPrimary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    height: 56,
    borderRadius: 28,
    gap: 8,
    ...shadow.card,
  },
  fabText: { color: colors.onBrandPrimary, fontSize: 16, fontWeight: "600" },
});
