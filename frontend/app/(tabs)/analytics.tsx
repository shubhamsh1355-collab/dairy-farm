import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BarChart } from "react-native-gifted-charts";
import { api } from "@/src/api";
import { colors, spacing, radius, shadow } from "@/src/theme";

type Tab = "milk" | "products";

export default function Analytics() {
  const [tab, setTab] = useState<Tab>("milk");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.analytics());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const active = tab === "milk" ? data?.milk : data?.products;
  const series = (data?.series || []).slice(-14).map((s: any) => ({
    value: tab === "milk" ? s.milk : s.products,
    label: s.date.slice(8),
    frontColor: tab === "milk" ? colors.brandPrimary : colors.brandSecondary,
  }));

  const width = Dimensions.get("window").width - spacing.xl * 2;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <View>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.sub}>{data?.month || "This month"}</Text>
        </View>
      </SafeAreaView>

      <View style={styles.segment}>
        <SegBtn testID="seg-milk" label="Milk" active={tab === "milk"} onPress={() => setTab("milk")} />
        <SegBtn testID="seg-products" label="Dairy Products" active={tab === "products"} onPress={() => setTab("products")} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 140, gap: spacing.lg }}>
        {loading ? (
          <ActivityIndicator color={colors.brandPrimary} />
        ) : (
          <>
            <View style={styles.bigCard}>
              <Text style={styles.bigLabel}>Total Revenue</Text>
              <Text style={styles.bigValue} testID={`revenue-${tab}`}>
                ₹{(active?.revenue ?? 0).toLocaleString("en-IN")}
              </Text>
              <View style={styles.divider} />
              <Text style={styles.bigLabel}>Net Profit (est.)</Text>
              <Text style={[styles.bigValue, { color: colors.success }]} testID={`profit-${tab}`}>
                ₹{(active?.profit ?? 0).toLocaleString("en-IN")}
              </Text>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Daily {tab === "milk" ? "milk" : "product"} sales</Text>
              {series.length ? (
                <BarChart
                  data={series}
                  width={width - spacing.xl}
                  height={180}
                  barWidth={16}
                  spacing={10}
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

            {tab === "milk" ? (
              <View style={styles.card}>
                <Row icon="cup-water" label="Produced" value={`${data?.milk?.produced_ltr ?? 0} L`} />
                <Row icon="truck-delivery" label="Delivered" value={`${data?.milk?.delivered_ltr ?? 0} L`} />
                <Row icon="factory" label="Used for products" value={`${data?.milk?.used_for_products_ltr ?? 0} L`} />
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.chartTitle}>Product breakdown</Text>
                {(data?.products?.breakdown || []).length === 0 && <Text style={styles.empty}>No sales this month</Text>}
                {(data?.products?.breakdown || []).map((b: any) => (
                  <Row key={b.name} icon="cheese" label={`${b.name} · ${b.qty}`} value={`₹${b.revenue.toLocaleString("en-IN")}`} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SegBtn({ testID, label, active, onPress }: any) {
  return (
    <Pressable testID={testID} onPress={onPress} style={[styles.segBtn, active && styles.segBtnActive]}>
      <Text style={[styles.segText, active && styles.segTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Row({ icon, label, value }: any) {
  return (
    <View style={styles.row}>
      <MaterialCommunityIcons name={icon} size={18} color={colors.brandPrimary} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md, backgroundColor: colors.surface },
  title: { fontSize: 24, fontWeight: "700", color: colors.onSurface },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  segment: { flexDirection: "row", marginHorizontal: spacing.xl, backgroundColor: colors.surfaceTertiary, padding: 4, borderRadius: 999 },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: "center" },
  segBtnActive: { backgroundColor: colors.surfaceSecondary, ...shadow.card },
  segText: { color: colors.muted, fontWeight: "600", fontSize: 13 },
  segTextActive: { color: colors.brandPrimary },
  bigCard: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.xl, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  bigLabel: { fontSize: 12, color: colors.muted, letterSpacing: 0.4 },
  bigValue: { fontSize: 32, fontWeight: "700", color: colors.onSurface, marginTop: 4 },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.md },
  chartCard: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  chartTitle: { fontSize: 14, fontWeight: "600", color: colors.onSurface, marginBottom: spacing.md },
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 4 },
  rowLabel: { flex: 1, color: colors.onSurface, fontSize: 14 },
  rowValue: { fontWeight: "700", color: colors.onSurface, fontSize: 14 },
  empty: { color: colors.muted, textAlign: "center", padding: spacing.lg },
});
