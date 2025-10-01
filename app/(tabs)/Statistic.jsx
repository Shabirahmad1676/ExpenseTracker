import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from "react-native";
import { PieChart, LineChart, BarChart } from "react-native-gifted-charts";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/authContext";
import { firestore } from "../../config/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { colors, spacingX, spacingY, radius } from "../../constants/theme";

const { width } = Dimensions.get('window');

const Statistic = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch transactions for current user
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(firestore, "transactions"),
      where("uid", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTransactions(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [user?.uid]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading statistics...</Text>
      </View>
    );
  }

  // ✅ Prepare data
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // Check if there's any data
  const hasData = transactions.length > 0;

  // Pie chart (income vs expense)
  const pieData = [
    { value: totalIncome, color: colors.green, text: "Income" },
    { value: totalExpense, color: colors.rose, text: "Expense" },
  ];

  // Bar chart (comparison)
  const barData = [
    { value: totalIncome, label: "Income", frontColor: colors.green },
    { value: totalExpense, label: "Expense", frontColor: colors.rose },
  ];

  // Line chart (trend by month)
  const monthlyTrend = {};
  transactions.forEach((t) => {
    const month = new Date(t.createdAt).toLocaleString("default", { month: "short" });
    monthlyTrend[month] = (monthlyTrend[month] || 0) + (t.type === "income" ? t.amount : -t.amount);
  });
  const lineData = Object.keys(monthlyTrend).map((m) => ({
    value: monthlyTrend[m],
    label: m,
  }));

  if (!hasData) {
    return (
      <View style={styles.center}>
        <Ionicons name="analytics-outline" size={80} color={colors.neutral400} />
        <Text style={styles.emptyTitle}>No Data Available</Text>
        <Text style={styles.emptySubtitle}>Start adding transactions to see your statistics</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Statistics</Text>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, styles.balanceCard]}>
          <View style={styles.cardHeader}>
            <Ionicons name="wallet-outline" size={20} color={colors.white} />
            <Text style={styles.cardTitle}>Balance</Text>
          </View>
          <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.incomeCard]}>
            <View style={styles.cardHeader}>
              <Ionicons name="arrow-up-circle-outline" size={16} color={colors.green} />
              <Text style={styles.cardTitleSmall}>Income</Text>
            </View>
            <Text style={styles.amountText}>${totalIncome.toFixed(2)}</Text>
          </View>

          <View style={[styles.summaryCard, styles.expenseCard]}>
            <View style={styles.cardHeader}>
              <Ionicons name="arrow-down-circle-outline" size={16} color={colors.rose} />
              <Text style={styles.cardTitleSmall}>Expense</Text>
            </View>
            <Text style={styles.amountText}>${totalExpense.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Pie Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Income vs Expense</Text>
        <View style={styles.pieChartContainer}>
          {/* <PieChart
            data={pieData}
            radius={80}
            innerRadius={40}
            centerLabelComponent={() => (
              <View style={styles.centerLabel}>
                <Text style={styles.centerLabelText}>Total</Text>
                <Text style={styles.centerLabelAmount}>${(totalIncome + totalExpense).toFixed(2)}</Text>
              </View>
            )}
          /> */}
        </View>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colors.green }]} />
            <Text style={styles.legendText}>Income</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colors.rose }]} />
            <Text style={styles.legendText}>Expense</Text>
          </View>
        </View>
      </View>

      {/* Bar Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Comparison</Text>
        <View style={styles.barChartContainer}>
          <BarChart
            data={barData}
            maxValue={Math.max(totalIncome, totalExpense) * 1.2}
            barWidth={40}
            spacing={60}
            initialSpacing={20}
            backgroundColor={colors.white}
            yAxisTextStyle={{ color: colors.neutral600 }}
            xAxisLabelTextStyle={{ color: colors.neutral600 }}
            onPress={(item) => console.log('Bar pressed:', item.label)}
          />
        </View>
      </View>

      {/* Line Chart */}
      {/* {lineData.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Monthly Trend</Text>
          <View style={styles.lineChartContainer}>
            <LineChart
              data={lineData}
              width={width - 60}
              height={200}
              color={colors.primary}
              thickness={3}
              dataPointsColor={colors.primary}
              dataPointsRadius={6}
              yAxisTextStyle={{ color: colors.neutral600 }}
              xAxisLabelTextStyle={{ color: colors.neutral600 }}
              curved
            />
          </View>
        </View>
      )} */}
    </ScrollView>
  );
};

export default Statistic;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacingX._20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.neutral900,
    marginBottom: spacingY._25,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.neutral800,
    marginBottom: spacingY._15,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: spacingX._20,
  },
  loadingText: {
    marginTop: spacingY._15,
    fontSize: 16,
    color: colors.neutral600,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.neutral700,
    marginTop: spacingY._20,
    marginBottom: spacingY._10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.neutral500,
    textAlign: "center",
    lineHeight: 22,
  },
  // Summary Cards
  summaryContainer: {
    marginBottom: spacingY._30,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: radius._15,
    padding: spacingX._20,
    shadowColor: colors.neutral900,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  balanceCard: {
    backgroundColor: colors.primary,
    marginBottom: spacingY._15,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacingX._10,
  },
  incomeCard: {
    flex: 1,
    backgroundColor: colors.neutral50,
    borderLeftWidth: 4,
    borderLeftColor: colors.green,
  },
  expenseCard: {
    flex: 1,
    backgroundColor: colors.neutral50,
    borderLeftWidth: 4,
    borderLeftColor: colors.rose,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacingY._10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
    marginLeft: spacingX._8,
  },
  cardTitleSmall: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.neutral700,
    marginLeft: spacingX._6,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.white,
  },
  amountText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.neutral800,
  },
  // Charts
  chartContainer: {
    backgroundColor: colors.white,
    borderRadius: radius._15,
    padding: spacingX._20,
    marginBottom: spacingY._20,
    shadowColor: colors.neutral900,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pieChartContainer: {
    alignItems: "center",
    marginVertical: spacingY._20,
  },
  centerLabel: {
    alignItems: "center",
  },
  centerLabelText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.neutral600,
  },
  centerLabelAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.neutral800,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacingX._30,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacingX._8,
  },
  legendText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.neutral700,
  },
  barChartContainer: {
    alignItems: "center",
    marginVertical: spacingY._10,
  },
  lineChartContainer: {
    alignItems: "center",
    marginVertical: spacingY._10,
  },
});
