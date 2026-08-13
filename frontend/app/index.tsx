import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { hasSession, getRole } from "@/src/api";
import { colors } from "@/src/theme";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const authed = await hasSession();
      if (!authed) {
        router.replace("/auth");
      } else {
        const role = await getRole();
        router.replace(role === "delivery_boy" ? "/delivery" : "/(tabs)");
      }
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
