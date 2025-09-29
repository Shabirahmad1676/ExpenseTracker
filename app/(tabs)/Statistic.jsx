import { View, Text, StyleSheet } from "react-native";
import React from "react";
import { colors } from "../../constants/theme";

export default function StatisticScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Statistics</Text>
      <Text style={styles.subtitle}>View charts and spending insights</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.neutral900 },
  title: { fontSize: 24, fontWeight: "700", color: colors.green },
  subtitle: { fontSize: 14, color: colors.textLight, marginTop: 8 },
});
