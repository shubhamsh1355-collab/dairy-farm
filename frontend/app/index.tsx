import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { hasSession } from "@/src/api";
import { colors } from "@/src/theme";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const authed = await hasSession();
      router.replace(authed ? "/(tabs)" : "/auth");
    })();
  }, [router]);

  return (
    <View style={styles.c} testID="splash-loading">
      <ActivityIndicator color={colors.brandPrimary} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
});
