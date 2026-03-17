import { Ionicons } from "@expo/vector-icons";
import { collection, doc, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import AddTransactionModal from "../(modals)/AddTransactionModal";
import { auth, firestore } from "../../config/firebase";
import { Colors, typography } from "../../constants/theme";

const { width } = Dimensions.get("window");

const HomeScreen = () => {
  const [userName, setUserName] = useState("");
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [selectedTx, setSelectedTx] = useState(null);
  const [timeFilter, setTimeFilter] = useState("month"); // 'today', 'week', 'month'
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser?.uid) return;

    const userDocRef = doc(firestore, "users", currentUser.uid);
    const unsub = onSnapshot(userDocRef, (snap) => {
      const data = snap.data() || {};
      setUserName(data.username || data.displayName || currentUser.displayName || "User");
    });

    return unsub;
  }, []);

  useEffect(() => {
    if (!auth.currentUser?.uid) return;
    const q = query(collection(firestore, "wallets"), where("uid", "==", auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWallets(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!auth.currentUser?.uid) return;
    setLoading(true);

    const now = new Date();
    let startDate = new Date();
    if (timeFilter === "today") startDate.setHours(0, 0, 0, 0);
    else if (timeFilter === "week") startDate.setDate(now.getDate() - 7);
    else if (timeFilter === "month") startDate.setDate(now.getDate() - 30);

    const q = query(
      collection(firestore, "transactions"),
      where("uid", "==", auth.currentUser.uid),
      where("createdAt", ">=", startDate.toISOString()),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txData = snapshot.docs.map((doc) => {
        const data = doc.data();
        const wallet = wallets.find(w => w.id === data.walletId);
        return {
          id: doc.id,
          ...data,
          walletName: wallet?.walletName || "Other",
        };
      });
      setTransactions(txData);

      let inc = 0, exp = 0;
      txData.forEach(t => {
        if (t.type === "income") inc += Number(t.amount);
        else exp += Number(t.amount);
      });
      setIncome(inc);
      setExpense(exp);
      setBalance(inc - exp);
      setLoading(false);

      // Update Forecast
      if (txData.length > 5 && timeFilter === 'month') {
        const fetchForecast = async () => {
          const { getSpendForecasting } = await import("../../services/aiService");
          const res = await getSpendForecasting(txData, exp);
          if (res) setForecast(res);
        };
        fetchForecast();
      }
    });

    return unsubscribe;
  }, [auth.currentUser?.uid, timeFilter, wallets]);

  const pieData = useMemo(() => [
    { value: income || 1, color: Colors.cardSalary, text: 'Income' },
    { value: expense || 1, color: Colors.cardExpense, text: 'Expense' },
  ], [income, expense]);

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>
      </View>

      <View style={styles.balanceCard}>
        <View>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
        </View>
        <PieChart
          donut
          radius={40}
          innerRadius={30}
          data={pieData}
          centerLabelComponent={() => <Ionicons name="wallet-outline" size={20} color="white" />}
        />
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: Colors.cardSalary }]}>
          <View style={styles.statIconBox}><Ionicons name="arrow-up" size={20} color="white" /></View>
          <View>
            <Text style={styles.statLabel}>Income</Text>
            <Text style={styles.statAmount}>${income.toLocaleString()}</Text>
          </View>
        </View>
        <View style={[styles.statCard, { backgroundColor: Colors.cardExpense }]}>
          <View style={styles.statIconBox}><Ionicons name="arrow-down" size={20} color="white" /></View>
          <View>
            <Text style={styles.statLabel}>Expenses</Text>
            <Text style={styles.statAmount}>${expense.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {forecast && timeFilter === 'month' && (
        <View style={styles.forecastCard}>
          <View style={styles.forecastHeader}>
            <Ionicons name="trending-up" size={18} color={Colors.primary} />
            <Text style={styles.forecastTitle}>Spend Forecast</Text>
          </View>
          <Text style={styles.forecastAmount}>Projected: PKR{forecast.projectedTotal?.toLocaleString()}</Text>
          <Text style={styles.forecastNarrative}>{forecast.narrative}</Text>
        </View>
      )}

      <View style={styles.filterContainer}>
        {['today', 'week', 'month'].map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setTimeFilter(f)}
            style={[styles.filterBtn, timeFilter === f && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, timeFilter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Transactions</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={() => !loading && (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={50} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No transactions for this period</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.txItem} onPress={() => setSelectedTx(item)}>
            <View style={styles.txIconBox}>
              <Ionicons
                name={item.type === "income" ? "arrow-down-circle" : "arrow-up-circle"}
                size={24}
                color={item.type === "income" ? Colors.cardSalary : Colors.cardExpense}
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', mb: 2 }}>
                <Text style={styles.txTitle}>{item.title}</Text>
                {item.category && item.type === 'expense' && (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{item.category}</Text>
                  </View>
                )}
                {item.isAnomaly && (
                  <View style={[styles.categoryBadge, { backgroundColor: Colors.cardExpense + '20' }]}>
                    <Text style={[styles.categoryText, { color: Colors.cardExpense }]}>⚠️ Unusual</Text>
                  </View>
                )}
              </View>
              <Text style={styles.txWallet}>{item.walletName}</Text>
            </View>
            <Text style={[styles.txAmount, { color: item.type === "income" ? Colors.cardSalary : Colors.cardExpense }]}>
              {item.type === "income" ? "+" : "-"}${Number(item.amount).toFixed(2)}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />
      <AddTransactionModal visible={showAddModal} onClose={() => setShowAddModal(false)} />

      {/* Premium Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  greeting: {
    ...typography.caption,
    fontSize: 14,
  },
  userName: {
    ...typography.header,
    fontSize: 22,
  },
  searchBtn: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  balanceCard: {
    backgroundColor: Colors.cardDark,
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  balanceAmount: {
    color: "white",
    fontSize: 32,
    fontWeight: "700",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 15,
    marginTop: 20,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  statLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "500",
  },
  statAmount: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    ...typography.subHeader,
  },
  seeAll: {
    color: Colors.primary,
    fontWeight: "600",
  },
  txItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 18,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  txIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  txTitle: {
    ...typography.body,
    fontWeight: "600",
  },
  txWallet: {
    ...typography.caption,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: Colors.progressTrack,
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    ...typography.caption,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: 'white',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    ...typography.caption,
    marginTop: 10,
  },
  forecastCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: Colors.progressTrack,
  },
  forecastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  forecastTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: Colors.primary,
  },
  forecastAmount: {
    ...typography.subHeader,
    fontSize: 20,
    marginBottom: 5,
  },
  forecastNarrative: {
    ...typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  categoryBadge: {
    backgroundColor: Colors.progressTrack,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  categoryText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  fab: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    zIndex: 100,
  },
});
