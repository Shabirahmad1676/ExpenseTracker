import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth, firestore } from "../../config/firebase";
import { colors } from "../../constants/theme";
import { parseReceiptWithGroq, parseTransactionWithGroq } from "../../services/aiService";

const AddTransactionModal = ({ visible, onClose }) => {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [magicText, setMagicText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  // ... existing magic fill code ...

  const pickImage = async (useCamera = false) => {
    try {
      let result;
      const options = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      };

      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (permission.status !== 'granted') {
          Alert.alert("Permission denied", "Camera access is needed to scan receipts.");
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets[0].base64) {
        processReceipt(result.assets[0].base64);
      }
    } catch (error) {
      console.error("Image Picker Error:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const processReceipt = async (base64) => {
    setScanning(true);
    const result = await parseReceiptWithGroq(base64);
    setScanning(false);

    if (result) {
      if (result.title) setTitle(result.title);
      if (result.amount) setAmount(result.amount.toString());
      // Date is not yet handled in state, but could be added later
      // Default to expense for receipts
      setType("expense");
      Alert.alert("Receipt Scanned!", "Please review the details before saving.");
    } else {
      Alert.alert("Error", "Could not read receipt. Please try again.");
    }
  };

  const handleMagicFill = async () => {
    if (!magicText.trim()) return;
    setAiLoading(true);
    const result = await parseTransactionWithGroq(magicText);
    setAiLoading(false);

    if (result) {
      if (result.title) setTitle(result.title);
      if (result.amount) setAmount(result.amount.toString());
      if (result.type) setType(result.type.toLowerCase() === 'income' ? 'income' : 'expense');
    } else {
      Alert.alert("Error", "Could not understand the text. Please try again.");
    }
  };

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
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 25, borderTopRightRadius: 25, maxHeight: "90%", paddingBottom: 20 }}>
          {/* Header */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: colors.neutral100 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: colors.neutral800 }}>New Transaction</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 5, backgroundColor: colors.neutral100, borderRadius: 20 }}>
              <Ionicons name="close" size={20} color={colors.neutral600} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>

            {/* AI Section */}
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.neutral400, marginBottom: 10, letterSpacing: 0.5 }}>QUICK ADD</Text>

            <View style={{ flexDirection: 'row', gap: 15, marginBottom: 25 }}>
              {/* Scan Receipt */}
              <TouchableOpacity
                onPress={() => pickImage(true)}
                style={{
                  flex: 1,
                  backgroundColor: colors.green + '15', // 10% opacity green
                  padding: 15,
                  borderRadius: 15,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.green + '40',
                  gap: 8
                }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="camera-outline" size={22} color="#fff" />
                </View>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.green }}>Scan Receipt</Text>
              </TouchableOpacity>

              {/* Upload Gallery */}
              <TouchableOpacity
                onPress={() => pickImage(false)}
                style={{
                  flex: 1,
                  backgroundColor: colors.primary + '15',
                  padding: 15,
                  borderRadius: 15,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.primary + '40',
                  gap: 8
                }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="image-outline" size={22} color={colors.neutral800} />
                </View>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.neutral800 }}>Upload Image</Text>
              </TouchableOpacity>
            </View>

            {scanning && (
              <View style={{ marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.neutral50, padding: 10, borderRadius: 10 }}>
                <ActivityIndicator size="small" color={colors.green} />
                <Text style={{ marginLeft: 8, color: colors.neutral600, fontSize: 13 }}>Analyzing receipt...</Text>
              </View>
            )}

            {/* Magic Fill Input */}
            <View style={{ marginBottom: 25 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.neutral500 }}>AI Magic Fill ✨</Text>
                {aiLoading && <ActivityIndicator size="small" color={colors.green} />}
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput
                  placeholder="e.g., 'Lunch $15' or 'Taxi 500'"
                  value={magicText}
                  onChangeText={setMagicText}
                  style={{
                    flex: 1,
                    backgroundColor: colors.neutral50,
                    padding: 12,
                    borderRadius: 12,
                    fontSize: 15,
                    borderWidth: 1,
                    borderColor: colors.neutral200
                  }}
                />
                <TouchableOpacity
                  onPress={handleMagicFill}
                  disabled={aiLoading || !magicText.trim()}
                  style={{
                    backgroundColor: colors.neutral900,
                    width: 44,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: colors.neutral100, marginBottom: 25 }} />

            {/* Manual Form */}
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.neutral400, marginBottom: 15, letterSpacing: 0.5 }}>DETAILS</Text>

            {/* Wallet Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 15 }}>
              {wallets.length === 0 ? (
                <Text style={{ color: colors.neutral400, fontStyle: 'italic', fontSize: 13 }}>No wallets found.</Text>
              ) : (
                wallets.map((wallet) => (
                  <TouchableOpacity
                    key={wallet.id}
                    onPress={() => setSelectedWalletId(wallet.id)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: selectedWalletId === wallet.id ? colors.green : "transparent",
                      borderWidth: 1,
                      borderColor: selectedWalletId === wallet.id ? colors.green : colors.neutral300,
                    }}
                  >
                    <Text style={{
                      color: selectedWalletId === wallet.id ? "#fff" : colors.neutral600,
                      fontWeight: "600",
                      fontSize: 13
                    }}>
                      {wallet.walletName}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {/* Amount Input */}
            <View style={{ marginBottom: 15 }}>
              <Text style={{ fontSize: 12, color: colors.neutral500, marginBottom: 5 }}>Amount</Text>
              <TextInput
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                style={{
                  fontSize: 24,
                  fontWeight: "700",
                  color: colors.neutral900,
                  padding: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.neutral200
                }}
              />
            </View>

            {/* Title Input */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 12, color: colors.neutral500, marginBottom: 5 }}>Title</Text>
              <TextInput
                placeholder="What is this for?"
                value={title}
                onChangeText={setTitle}
                style={{
                  fontSize: 16,
                  color: colors.neutral900,
                  padding: 10,
                  backgroundColor: colors.neutral50,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.neutral100
                }}
              />
            </View>

            {/* Type Toggle */}
            <View style={{ flexDirection: "row", backgroundColor: colors.neutral100, padding: 4, borderRadius: 12, marginBottom: 25 }}>
              <TouchableOpacity
                onPress={() => setType("expense")}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  backgroundColor: type === "expense" ? "#fff" : "transparent",
                  borderRadius: 10,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: type === "expense" ? 1 : 0 },
                  shadowOpacity: type === "expense" ? 0.1 : 0,
                  shadowRadius: 2,
                }}
              >
                <Text style={{ textAlign: "center", fontWeight: "600", color: type === "expense" ? colors.rose : colors.neutral500 }}>
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setType("income")}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  backgroundColor: type === "income" ? "#fff" : "transparent",
                  borderRadius: 10,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: type === "income" ? 1 : 0 },
                  shadowOpacity: type === "income" ? 0.1 : 0,
                  shadowRadius: 2,
                }}
              >
                <Text style={{ textAlign: "center", fontWeight: "600", color: type === "income" ? colors.green : colors.neutral500 }}>
                  Income
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleAddTransaction}
              disabled={loading || !selectedWalletId}
              style={{
                backgroundColor: loading || !selectedWalletId ? colors.neutral300 : colors.green,
                paddingVertical: 16,
                borderRadius: 15,
                alignItems: "center",
                shadowColor: colors.green,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                {loading ? "Adding..." : "Save Transaction"}
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default AddTransactionModal;
