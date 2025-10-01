import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, Alert, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { firestore, auth } from "../../config/firebase";
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from "firebase/firestore";
import { colors } from "../../constants/theme";

const AddTransactionModal = ({ visible, onClose }) => {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch user's wallets
  useEffect(() => {
    if (!visible) return;
    
    const user = auth.currentUser;
    if (!user?.uid) return;

    const walletsRef = collection(firestore, "wallets");
    const q = query(walletsRef, where("uid", "==", user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const walletData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setWallets(walletData);
      
      // Auto-select first wallet if available
      if (walletData.length > 0 && !selectedWalletId) {
        setSelectedWalletId(walletData[0].id);
      }
    });

    return unsubscribe;
  }, [visible, selectedWalletId]);

  const handleAddTransaction = async () => {
    if (!title.trim() || !amount) {
      Alert.alert("Error", "Please fill all fields!");
      return;
    }

    if (!selectedWalletId) {
      Alert.alert("Error", "Please select a wallet!");
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "Not logged in!");
        return;
      }

      await addDoc(collection(firestore, "transactions"), {
        uid: user.uid,
        walletId: selectedWalletId,
        title: title.trim(),
        amount: parseFloat(amount),
        type,
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", "Transaction added!");
      setTitle("");
      setAmount("");
      setType("expense");
      setSelectedWalletId("");
      onClose();
    } catch (err) {
      console.error("Add Transaction Error:", err);
      Alert.alert("Error", "Failed to add transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
          <View style={{ margin: 20, padding: 20, borderRadius: 15, backgroundColor: "#fff", maxHeight: "80%" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: "600" }}>Add Transaction</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={"#000"} />
              </TouchableOpacity>
            </View>

            {/* Wallet Selection */}
            <View style={{ marginBottom: 15 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8, color: colors.text }}>Select Wallet</Text>
              {wallets.length === 0 ? (
                <View style={{ padding: 15, backgroundColor: colors.neutral100, borderRadius: 8, alignItems: "center" }}>
                  <Ionicons name="wallet-outline" size={24} color={"#000"} />
                  <Text style={{ color: colors.textLight, marginTop: 5 }}>No wallets available</Text>
                  <Text style={{ color: colors.textLight, fontSize: 12, marginTop: 2 }}>Create a wallet first</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  {wallets.map((wallet) => (
                    <TouchableOpacity
                      key={wallet.id}
                      onPress={() => setSelectedWalletId(wallet.id)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 20,
                        marginRight: 10,
                        backgroundColor: selectedWalletId === wallet.id ? colors.green : colors.neutral600,
                        borderWidth: 1,
                        borderColor: selectedWalletId === wallet.id ? colors.green : colors.green,
                      }}
                    >
                      <Text style={{ 
                        color: selectedWalletId === wallet.id ? "#fff" : colors.text,
                        fontWeight: selectedWalletId === wallet.id ? "600" : "500"
                      }}>
                        {wallet.walletName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            <TextInput
              placeholder="Transaction Title"
              value={title}
              onChangeText={setTitle}
              style={{ 
                borderWidth: 1, 
                borderColor: colors.green,
                marginBottom: 15, 
                padding: 12, 
                borderRadius: 8,
                backgroundColor: colors.neutral50
              }}
            />
            
            <TextInput
              placeholder="Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              style={{ 
                borderWidth: 1, 
                borderColor: colors.green,
                marginBottom: 15, 
                padding: 12, 
                borderRadius: 8,
                backgroundColor: colors.neutral50
              }}
            />

            <View style={{ flexDirection: "row", justifyContent: "space-around", marginVertical: 15 }}>
              <TouchableOpacity
                onPress={() => setType("income")}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  backgroundColor: type === "income" ? colors.green : colors.neutral600,
                  borderRadius: 25,
                  flex: 1,
                  marginRight: 10,
                }}
              >
                <Text style={{ 
                  color: type === "income" ? "#fff" : colors.text,
                  textAlign: "center",
                  fontWeight: "600"
                }}>
                  Income
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setType("expense")}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  backgroundColor: type === "expense" ? colors.green : colors.neutral600,
                  borderRadius: 25,
                  flex: 1,
                  marginLeft: 10,
                }}
              >
                <Text style={{ 
                  color: type === "expense" ? "#fff" : colors.text,
                  textAlign: "center",
                  fontWeight: "600"
                }}>
                  Expense
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleAddTransaction}
              disabled={loading || !selectedWalletId}
              style={{ 
                backgroundColor: loading || !selectedWalletId ? colors.green : colors.neutral900, 
                padding: 15, 
                borderRadius: 8, 
                marginTop: 10 
              }}
            >
              <Text style={{ 
                textAlign: "center", 
                color: "#fff", 
                fontWeight: "600",
                fontSize: 16
              }}>
                {loading ? "Adding..." : "Add Transaction"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default AddTransactionModal;
