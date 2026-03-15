import { Ionicons } from "@expo/vector-icons";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AddWalletModal from "../(modals)/AddWalletModal";
import { firestore } from "../../config/firebase";
import { Colors, typography } from "../../constants/theme";
import { useAuth } from "../../contexts/authContext";
import SuccessModal from "../../components/SuccessModal";



const { width } = Dimensions.get('window');
const cardWidth = (width - 55) / 2;

const Wallet = () => {
  const { user } = useAuth();
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");


  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(firestore, "wallets"), where("uid", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWallets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(firestore, "transactions"), where("uid", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [user?.uid]);

  const calculateTotalBalance = () => {
    return transactions.reduce((acc, tx) => acc + (tx.type === "income" ? tx.amount : -tx.amount), 0);
  };

  const calculateWalletBalance = (walletId) => {
    return transactions
      .filter(tx => tx.walletId === walletId)
      .reduce((acc, tx) => acc + (tx.type === "income" ? tx.amount : -tx.amount), 0);
  };

  const handleEditWallet = (item) => {
    setEditData(item);
    setModalVisible(true);
  };

  const handleDeleteWallet = async (walletId) => {
    Alert.alert(
      "Delete Wallet",
      "Warning: This will permanently delete this wallet and ALL its associated transactions. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: async () => {
              try {
                setLoading(true);
                const { writeBatch, getDocs, query, collection, where } = await import("firebase/firestore");
                const batch = writeBatch(firestore);
                
                batch.delete(doc(firestore, "wallets", walletId));
                
                const txQuery = query(
                  collection(firestore, "transactions"), 
                  where("walletId", "==", walletId),
                  where("uid", "==", user.uid)
                );
                const txSnap = await getDocs(txQuery);
                txSnap.forEach((txDoc) => batch.delete(txDoc.ref));

                await batch.commit();
                setLoading(false);
                setSuccessMsg("Wallet and all its transactions have been removed.");
                setSuccessVisible(true);
              } catch (error) {
              console.error("Delete Error:", error);
              Alert.alert("Error", "Failed to delete wallet data");
            }
          }
        }
      ]
    );
  };

  const showActions = (item) => {
    Alert.alert(
      "Wallet Actions",
      "What would you like to do?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Edit", onPress: () => handleEditWallet(item) },
        { text: "Delete", style: "destructive", onPress: () => handleDeleteWallet(item.id) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 100 }}>
        <Text style={styles.headerTitle}>My Wallets</Text>

        {/* Total Balance Card */}
        <View style={styles.balanceCard}>
          <View>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>${calculateTotalBalance().toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.balanceIcon}>
            <Ionicons name="wallet-outline" size={30} color="white" />
          </View>
        </View>

        {/* Wallets Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Accounts</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setEditData(null);
              setModalVisible(true);
            }}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        ) : wallets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={60} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No wallets found</Text>
            <Text style={styles.emptySubtitle}>Start by adding a new wallet to track your finances.</Text>
            <TouchableOpacity style={styles.emptyActionBtn} onPress={() => {
              setEditData(null);
              setModalVisible(true);
            }}>
              <Text style={styles.emptyActionText}>Create Wallet</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {wallets.map((item) => (
              <View key={item.id} style={styles.walletCard}>
                <View style={styles.walletHeader}>
                  <View style={styles.iconBox}>
                    {item.walletImage ? <Image source={{ uri: item.walletImage }} style={styles.icon} /> : <Ionicons name="card-outline" size={24} color={Colors.primary} />}
                  </View>
                  <TouchableOpacity onPress={() => showActions(item)} style={styles.moreButton}>
                    <Ionicons name="ellipsis-vertical" size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.walletName} numberOfLines={1}>{item.walletName}</Text>
                <Text style={styles.walletBalance}>${calculateWalletBalance(item.id).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <AddWalletModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        editData={editData}
      />

      <SuccessModal 
        visible={successVisible} 
        title="Wallet Deleted"
        message={successMsg} 
        onClose={() => setSuccessVisible(false)} 
      />
    </View>
  );
};

export default Wallet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    ...typography.header,
    marginBottom: 25,
  },
  balanceCard: {
    backgroundColor: Colors.cardDark,
    borderRadius: 24,
    padding: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 35,
    elevation: 8,
    shadowColor: Colors.cardDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 5,
  },
  balanceAmount: {
    color: "white",
    fontSize: 30,
    fontWeight: "700",
  },
  balanceIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    ...typography.subHeader,
    fontSize: 18,
  },
  addButton: {
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
  },
  walletCard: {
    width: cardWidth,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    elevation: 2,
    // shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  walletHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  moreButton: {
    padding: 4,
    marginRight: -4,
    marginTop: -4,
  },
  walletName: {
    ...typography.body,
    fontWeight: "600",
    marginBottom: 4,
  },
  walletBalance: {
    ...typography.subHeader,
    color: Colors.primary,
    fontSize: 18,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 40,
    padding: 20,
  },
  emptyTitle: {
    ...typography.subHeader,
    marginTop: 15,
  },
  emptySubtitle: {
    ...typography.caption,
    textAlign: "center",
    marginTop: 5,
    marginBottom: 25,
  },
  emptyActionBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyActionText: {
    color: "white",
    fontWeight: "700",
  },
});
