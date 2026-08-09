import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Dimensions, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BarChart } from "react-native-gifted-charts";

import { api, loadFarm } from "@/src/api";
import { colors, spacing, radius, shadow, images } from "@/src/theme";

export default function Home() {
  const router = useRouter();
  const [farm, setFarm] = useState<any>(null);
  const [todayLog, setTodayLog] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [f, m, a] = await Promise.all([loadFarm(), api.todayMilk(), api.analytics()]);
      setFarm(f);
      setTodayLog(m.log);
      setAnalytics(a);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const series = (analytics?.series || []).slice(-14).map((s: any) => ({
    value: s.milk,
    label: s.date.slice(8),
    frontColor: colors.brandPrimary,
  }));

  // Max width constraint so it doesn't break on desktop
  const windowWidth = Dimensions.get("window").width;
  const chartWidth = Math.min(windowWidth - spacing.xl * 4, 520); // 520 is max width inside the 600px wrapper

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
                colors={["rgba(6, 95, 70, 0.4)", "rgba(17, 24, 39, 0.9)"]}
                style={StyleSheet.absoluteFillObject}
              />
              <BlurView intensity={Platform.OS === 'web' ? 0 : 20} tint="dark" style={styles.heroGlass}>
                <Text style={styles.heroTitle}>Today's Overview</Text>
                <View style={styles.heroGrid}>
                  <HeroMetric label="Produced" value={`${todayLog?.produced_ltr ?? 0} L`} />
                  <HeroMetric label="Delivered" value={`${todayLog?.delivered_ltr ?? 0} L`} />
                  <HeroMetric label="Used" value={`${todayLog?.used_for_products_ltr ?? 0} L`} />
                  <HeroMetric label="Remaining" value={`${todayLog?.remaining_ltr ?? 0} L`} highlight />
                </View>
              </BlurView>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Analytics</Text>
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Daily milk sales (14 days)</Text>
                {series.length ? (
                  <BarChart
                    data={series}
                    width={chartWidth}
                    height={160}
                    barWidth={14}
                    spacing={12}
                    yAxisThickness={0}
                    xAxisThickness={0}
                    yAxisTextStyle={{ color: colors.muted, fontSize: 10 }}
                    xAxisLabelTextStyle={{ color: colors.muted, fontSize: 10 }}
                    noOfSections={4}
                  />
                ) : (
                  <Text style={styles.empty}>No data yet</Text>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionsGrid}>
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
                  onPress={() => router.push("/(tabs)/customers")}
                />
              </View>
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
        <MaterialCommunityIcons name="plus" size={24} color={colors.onBrandSecondary} />
        <Text style={styles.fabText}>Log Milk</Text>
      </Pressable>
    </View>
  );
}

function HeroMetric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={[styles.metricCard, highlight && styles.metricCardHighlight]}>
      <Text style={[styles.metricLabel, highlight && { color: colors.brandTertiary }]}>{label}</Text>
      <Text style={[styles.metricValue, highlight && { color: "#FFFFFF" }]}>{value}</Text>
    </View>
  );
}

function QuickAction({ icon, label, color, onPress }: any) {
  return (
    <Pressable style={styles.actionCard} onPress={onPress}>
      <LinearGradient colors={[color + "10", color + "00"]} style={StyleSheet.absoluteFillObject} />
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
  farmName: { fontSize: 24, fontWeight: "800", color: colors.onSurface, letterSpacing: -0.5 },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  heroWrap: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    borderRadius: radius.lg,
    overflow: "hidden",
    height: 240,
    ...shadow.card,
  },
  heroGlass: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: "center",
    backgroundColor: Platform.OS === 'web' ? 'rgba(0,0,0,0.3)' : 'transparent',
  },
  heroTitle: { fontSize: 18, fontWeight: "700", color: colors.onSurfaceInverse, marginBottom: spacing.md },
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
    borderColor: "rgba(255,255,255,0.15)",
  },
  metricCardHighlight: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  metricLabel: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: "500" },
  metricValue: { fontSize: 22, fontWeight: "800", color: colors.onSurfaceInverse, marginTop: 4 },
  section: { marginBottom: spacing.xxl },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.onSurface, paddingHorizontal: spacing.xl, marginBottom: spacing.md, letterSpacing: -0.5 },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  actionCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flex: 1,
    minWidth: 100,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  actionLabel: { fontSize: 14, fontWeight: "700", color: colors.onSurface, textAlign: "center" },
  chartCard: { 
    marginHorizontal: spacing.xl, 
    backgroundColor: colors.surfaceSecondary, 
    borderRadius: radius.lg, 
    padding: spacing.lg, 
    borderWidth: 1, 
    borderColor: colors.border,
    ...shadow.card,
  },
  chartTitle: { fontSize: 14, fontWeight: "600", color: colors.onSurface, marginBottom: spacing.md },
  empty: { color: colors.muted, textAlign: "center", padding: spacing.lg },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: colors.brandSecondary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    height: 56,
    borderRadius: 28,
    gap: 8,
    ...shadow.card,
    zIndex: 100,
  },
  fabText: { color: colors.onBrandSecondary, fontSize: 16, fontWeight: "700" },
});
