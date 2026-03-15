import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import SuccessModal from "../../components/SuccessModal";
import { auth, firestore } from "../../config/firebase";
import { Colors, styles } from "../../constants/theme";
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

  const [successVisible, setSuccessVisible] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

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
      setType("expense");
      // For premium feel, use the success modal here too?
      // For now, categorized alert is fine or just let them save.
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

  useEffect(() => {
    if (!visible) return;
    const user = auth.currentUser;
    if (!user?.uid) return;

    const walletsRef = collection(firestore, "wallets");
    const q = query(walletsRef, where("uid", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const walletData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setWallets(walletData);
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

      let category = "Other";
      let isAnomaly = false;
      let anomalyReason = "";

      if (type === "expense") {
        const { autoCategorizeExpense, detectAnomaly } = await import("../../services/aiService");
        const { getDocs, query, collection, where, limit, orderBy } = await import("firebase/firestore");

        category = await autoCategorizeExpense(title.trim(), parseFloat(amount));

        const historyQuery = query(
          collection(firestore, "transactions"),
          where("uid", "==", user.uid),
          where("category", "==", category),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const historySnap = await getDocs(historyQuery);
        const history = historySnap.docs.map(doc => doc.data());

        const anomalyRes = await detectAnomaly({ title: title.trim(), amount: parseFloat(amount), category }, history);
        if (anomalyRes?.isAnomaly) {
          isAnomaly = true;
          anomalyReason = anomalyRes.reason;
        }
      }

      await addDoc(collection(firestore, "transactions"), {
        uid: user.uid,
        walletId: selectedWalletId,
        title: title.trim(),
        amount: parseFloat(amount),
        type,
        category,
        isAnomaly,
        anomalyReason,
        createdAt: new Date().toISOString(),
      });

      setSuccessMsg(type === "expense" ? `Successfully categorized as ${category}` + (isAnomaly ? `\n\n⚠️ ${anomalyReason}` : "") : "Transaction added successfully!");
      setSuccessVisible(true);

      setTitle("");
      setAmount("");
      setType("expense");
      setSelectedWalletId("");
      setMagicText("");
    } catch (err) {
      console.error("Add Transaction Error:", err);
      Alert.alert("Error", "Failed to add transaction");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessVisible(false);
    onClose();
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 25, borderTopRightRadius: 25, maxHeight: "90%", paddingBottom: 20 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.surface }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.textPrimary }}>New Transaction</Text>
              <TouchableOpacity onPress={onClose} style={{ padding: 5, backgroundColor: Colors.surface, borderRadius: 20 }}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.textSecondary, marginBottom: 10, letterSpacing: 0.5 }}>QUICK ADD</Text>

              <View style={{ flexDirection: 'row', gap: 15, marginBottom: 25 }}>
                <TouchableOpacity
                  onPress={() => pickImage(true)}
                  style={{
                    flex: 1,
                    backgroundColor: '#4ade80' + '15',
                    padding: 15,
                    borderRadius: 15,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#4ade80' + '40',
                    gap: 8
                  }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#4ade80', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="camera-outline" size={22} color="#fff" />
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: '#4ade80' }}>Scan Receipt</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => pickImage(false)}
                  style={{
                    flex: 1,
                    backgroundColor: Colors.primary + '15',
                    padding: 15,
                    borderRadius: 15,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: Colors.primary + '40',
                    gap: 8
                  }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="image-outline" size={22} color="#fff" />
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.primary }}>Upload Image</Text>
                </TouchableOpacity>
              </View>

              {scanning && (
                <View style={{ marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, padding: 10, borderRadius: 10 }}>
                  <ActivityIndicator size="small" color="#4ade80" />
                  <Text style={{ marginLeft: 8, color: Colors.textSecondary, fontSize: 13 }}>Analyzing receipt...</Text>
                </View>
              )}

              <View style={{ marginBottom: 25 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.textSecondary }}>AI Magic Fill ✨</Text>
                  {aiLoading && <ActivityIndicator size="small" color={Colors.primary} />}
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TextInput
                    placeholder="e.g., 'Lunch $15' or 'Taxi 500'"
                    value={magicText}
                    onChangeText={setMagicText}
                    style={{
                      flex: 1,
                      backgroundColor: Colors.surface,
                      padding: 12,
                      borderRadius: 12,
                      fontSize: 15,
                      borderWidth: 1,
                      borderColor: Colors.progressTrack
                    }}
                  />
                  <TouchableOpacity
                    onPress={handleMagicFill}
                    disabled={aiLoading || !magicText.trim()}
                    style={{
                      backgroundColor: Colors.primary,
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

              <View style={{ height: 1, backgroundColor: Colors.progressTrack, marginBottom: 25 }} />

              <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.textSecondary, marginBottom: 15, letterSpacing: 0.5 }}>DETAILS</Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 15 }}>
                {wallets.length === 0 ? (
                  <Text style={{ color: Colors.textSecondary, fontStyle: 'italic', fontSize: 13 }}>No wallets found.</Text>
                ) : (
                  wallets.map((wallet) => (
                    <TouchableOpacity
                      key={wallet.id}
                      onPress={() => setSelectedWalletId(wallet.id)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: selectedWalletId === wallet.id ? Colors.primary : "transparent",
                        borderWidth: 1,
                        borderColor: selectedWalletId === wallet.id ? Colors.primary : Colors.progressTrack,
                      }}
                    >
                      <Text style={{
                        color: selectedWalletId === wallet.id ? "#fff" : Colors.textSecondary,
                        fontWeight: "600",
                        fontSize: 13
                      }}>
                        {wallet.walletName}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>

              <View style={{ marginBottom: 15 }}>
                <Text style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: 5 }}>Amount</Text>
                <TextInput
                  placeholder="0.00"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  style={{
                    fontSize: 24,
                    fontWeight: "700",
                    color: Colors.textPrimary,
                    padding: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: Colors.progressTrack
                  }}
                />
              </View>

              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: 5 }}>Title</Text>
                <TextInput
                  placeholder="What is this for?"
                  value={title}
                  onChangeText={setTitle}
                  style={{
                    fontSize: 16,
                    color: Colors.textPrimary,
                    padding: 10,
                    backgroundColor: Colors.surface,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: Colors.progressTrack
                  }}
                />
              </View>

              <View style={{ flexDirection: "row", backgroundColor: Colors.surface, padding: 4, borderRadius: 12, marginBottom: 25 }}>
                <TouchableOpacity
                  onPress={() => setType("expense")}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    backgroundColor: type === "expense" ? "#fff" : "transparent",
                    borderRadius: 10,
                    elevation: type === "expense" ? 2 : 0,
                  }}
                >
                  <Text style={{ textAlign: "center", fontWeight: "600", color: type === "expense" ? Colors.cardExpense : Colors.textSecondary }}>
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
                    elevation: type === "income" ? 2 : 0,
                  }}
                >
                  <Text style={{ textAlign: "center", fontWeight: "600", color: type === "income" ? Colors.cardSalary : Colors.textSecondary }}>
                    Income
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleAddTransaction}
                disabled={loading || !selectedWalletId}
                style={{
                  backgroundColor: loading || !selectedWalletId ? Colors.progressTrack : Colors.primary,
                  paddingVertical: 16,
                  borderRadius: 15,
                  alignItems: "center",
                  ...styles.shadow
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
      <SuccessModal
        visible={successVisible}
        title="Transaction Added"
        message={successMsg}
        onClose={handleSuccessClose}
      />
    </>
  );
};

export default AddTransactionModal;
