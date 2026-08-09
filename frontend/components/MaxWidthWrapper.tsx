import { View, StyleSheet, Platform } from "react-native";
import { colors } from "../src/theme";

export function MaxWidthWrapper({ children }: { children: React.ReactNode }) {
  if (Platform.OS === "web") {
    return (
      <View style={styles.webRoot}>
        <View style={styles.webContainer}>
          {children}
        </View>
      </View>
    );
  }
  return <View style={styles.mobileRoot}>{children}</View>;
}

const styles = StyleSheet.create({
  webRoot: {
    flex: 1,
    backgroundColor: "#E5E7EB", // Darker subtle background for web wrapper
    alignItems: "center",
  },
  webContainer: {
    flex: 1,
    width: "100%",
    maxWidth: 600, // Keeps it looking like a sleek mobile app on desktop
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 40,
    elevation: 5,
  },
  mobileRoot: {
    flex: 1,
    backgroundColor: colors.surface,
  },
});
