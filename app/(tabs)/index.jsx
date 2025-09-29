import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, query, where, onSnapshot, doc, orderBy, limit } from "firebase/firestore";
import { firestore, auth } from "../../config/firebase"; // adjust path
import AddTransactionModal from "../(modals)/AddTransactionModal";


const HomeScreen = () => {
  const [userName, setUserName] = useState("");
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [selectedTx, setSelectedTx] = useState(null);

  // 🔹 Fetch user profile
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser?.uid) return;

    const userDocRef = doc(firestore, "users", currentUser.uid);
    const unsub = onSnapshot(userDocRef, (snap) => {
      const data = snap.data() || {};
      setUserName(data.name || data.displayName || currentUser.displayName || "User");
    });

    return unsub;
  }, []);

  // 🔹 Fetch transactions in real-time
  useEffect(() => {
    if (!auth.currentUser?.uid) return;

    const txRef = collection(firestore, "transactions");
    const q = query(
      txRef,
      where("uid", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txData = snapshot.docs.map((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date());
        return {
          id: doc.id,
          ...data,
          createdAt,
        };
      });
      setTransactions(txData);

      // calculate balance
      let totalIncome = 0;
      let totalExpense = 0;
      txData.forEach((t) => {
        if (t.type === "income") totalIncome += t.amount;
        else totalExpense += t.amount;
      });

      setIncome(totalIncome);
      setExpense(totalExpense);
      setBalance(totalIncome - totalExpense);
    });

    return unsubscribe;
  }, []);

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#fff" }}>
      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: "600" }}>Hello, {userName}</Text>
        <TouchableOpacity>
          <Ionicons name="search" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Balance Box */}
      <View style={{ backgroundColor: "#f1f1f1", padding: 20, borderRadius: 15, marginBottom: 20 }}>
        <Text style={{ fontSize: 16, color: "#888" }}>Total Balance</Text>
        <Text style={{ fontSize: 28, fontWeight: "700", marginVertical: 10 }}>
          ${balance.toFixed(2)}
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="arrow-up-circle" size={20} color="green" style={{ marginRight: 5 }} />
            <Text>Income: ${income.toFixed(2)}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="arrow-down-circle" size={20} color="red" style={{ marginRight: 5 }} />
            <Text>Expense: ${expense.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Recent Transactions */}
      <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 10 }}>Recent Transactions</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              padding: 15,
              backgroundColor: "#fafafa",
              borderRadius: 10,
              marginBottom: 10,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
            onPress={() => setSelectedTx(item)}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "600" }}>{item.title}</Text>
              <Text style={{ color: "#777", marginTop: 2 }}>{item.createdAt ? item.createdAt.toLocaleString() : ""}</Text>
            </View>
            <Text style={{ color: item.type === "income" ? "green" : "red", fontWeight: "600" }}>
              {item.type === "income" ? "+" : "-"}${Number(item.amount).toFixed(2)}
            </Text>
          </TouchableOpacity>
        )}
      />
 {/* Floating Add Button */}
 <TouchableOpacity
      style={{
        position: "absolute",
        bottom: 30,
        right: 30,
        backgroundColor: "#4a90e2",
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
      }}
      onPress={() => setShowAddModal(true)}
    >
      <Text style={{ fontSize: 30, color: "#fff" }}>+</Text>
    </TouchableOpacity>

    <AddTransactionModal visible={showAddModal} onClose={() => setShowAddModal(false)} />
    </View>
  );
};

export default HomeScreen;
