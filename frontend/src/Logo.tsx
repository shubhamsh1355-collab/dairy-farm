import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "./theme";

export function Logo({ size = 44 }: { size?: number }) {
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 4,
        },
      ]}
      testID="ksheer-dhara-logo"
    >
      <MaterialCommunityIcons name="cow" size={size * 0.62} color={colors.onBrandPrimary} />
      <View style={[styles.drop, { right: size * 0.12, bottom: size * 0.12 }]}>
        <MaterialCommunityIcons name="water" size={size * 0.28} color={colors.brandPrimary} />
      </View>
    </View>
  );
}

export function LogoWithName({ size = 44 }: { size?: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Logo size={size} />
      <View>
        <Text style={styles.brandTitle}>Ksheer Dhara</Text>
        <Text style={styles.brandTag}>Farm Inventory & Analytics</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  drop: {
    position: "absolute",
    width: 18,
    height: 18,
    backgroundColor: colors.onBrandPrimary,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.onSurface,
    letterSpacing: 0.2,
  },
  brandTag: {
    fontSize: 11,
    color: colors.muted,
  },
});
