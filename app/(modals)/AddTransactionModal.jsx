import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, Alert } from "react-native";
import { firestore, auth } from "../../config/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const AddTransactionModal = ({ visible, onClose }) => {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense"); // default

  const handleAddTransaction = async () => {
    if (!title.trim() || !amount) {
      Alert.alert("Error", "Please fill all fields!");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "Not logged in!");
        return;
      }

      await addDoc(collection(firestore, "transactions"), {
        uid: user.uid,
        title: title.trim(),
        amount: parseFloat(amount),
        type,
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", "Transaction added!");
      setTitle("");
      setAmount("");
      setType("expense");
      onClose();
    } catch (err) {
      console.error("Add Transaction Error:", err);
      Alert.alert("Error", "Failed to add transaction");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
        <View style={{ margin: 20, padding: 20, borderRadius: 15, backgroundColor: "#fff" }}>
          <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 10 }}>Add Transaction</Text>

          <TextInput
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            style={{ borderWidth: 1, marginBottom: 10, padding: 10, borderRadius: 8 }}
          />
          <TextInput
            placeholder="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            style={{ borderWidth: 1, marginBottom: 10, padding: 10, borderRadius: 8 }}
          />

          <View style={{ flexDirection: "row", justifyContent: "space-around", marginVertical: 10 }}>
            <TouchableOpacity
              onPress={() => setType("income")}
              style={{
                padding: 10,
                backgroundColor: type === "income" ? "green" : "#eee",
                borderRadius: 8,
              }}
            >
              <Text style={{ color: type === "income" ? "#fff" : "#000" }}>Income</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setType("expense")}
              style={{
                padding: 10,
                backgroundColor: type === "expense" ? "red" : "#eee",
                borderRadius: 8,
              }}
            >
              <Text style={{ color: type === "expense" ? "#fff" : "#000" }}>Expense</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleAddTransaction}
            style={{ backgroundColor: "#4a90e2", padding: 15, borderRadius: 8, marginTop: 10 }}
          >
            <Text style={{ textAlign: "center", color: "#fff", fontWeight: "600" }}>Add</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={{ marginTop: 15 }}>
            <Text style={{ textAlign: "center", color: "blue" }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default AddTransactionModal;
