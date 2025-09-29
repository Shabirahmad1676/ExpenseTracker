import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/theme";
import { useAuth } from "../../contexts/authContext";
import { firestore } from "../../config/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import AddWalletModal from "../(modals)/AddWalletModal";

const Wallet = () => {
  const { user } = useAuth();
  const [wallets, setWallets] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    // This does two key things:
    // Listens in real-time to all wallets where uid == user.uid.
  // Whenever wallets change (add, update, delete), onSnapshot re-runs and updates your local wallets state.

    const walletsRef = collection(firestore, "wallets");
    const q = query(walletsRef, where("uid", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setWallets(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [user?.uid]);

  const calculateTotalBalance = () => {
    // For now, showing mock data. In real app, sum all wallet balances
    return wallets.length * 500; // Mock $500 per wallet
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      {/* <View style={styles.headerSection}>
        <Text style={styles.welcomeText}>Good day!</Text>
        <Text style={styles.userName}>{user?.displayName || 'User'}</Text>
      </View> */}

      {/* Total Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceAmount}>${calculateTotalBalance().toLocaleString()}</Text>
        <View style={styles.balanceIcon}>
          <Ionicons name="wallet" size={24} color={colors.green} />
        </View>
      </View>

      {/* Wallets Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Wallets</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={20} color={colors.neutral900} />
        </TouchableOpacity>
      </View>

      {/* Wallets List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your wallets...</Text>
        </View>
      ) : wallets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="wallet-outline" size={50} color={colors.textLight} />
          </View>
          <Text style={styles.emptyTitle}>No wallets yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your first wallet to start tracking expenses
          </Text>
          <TouchableOpacity 
            style={styles.emptyActionButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={20} color={colors.text} />
            <Text style={styles.emptyActionText}>Add Wallet</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.walletsGrid}>
          {wallets.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.walletCard }
              activeOpacity={0.8}
            >
              <View style={styles.walletCardHeader}>
                <View style={styles.walletIconContainer}>
                  {item.walletImage ? (
                    <Image source={{ uri: item.walletImage }} style={styles.walletIcon} />
                  ) : (
                    <Ionicons name="wallet" size={24} color={colors.text} />
                  )}
                </View>
                <TouchableOpacity style={styles.optionsButton}>
                  <Ionicons name="ellipsis-horizontal" size={16} color={colors.textLight} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.walletCardName}>{item.walletName}</Text>
              <Text style={styles.walletCardBalance}>$500.00</Text>
              
              <View style={styles.walletCardFooter}>
                <Text style={styles.walletCardDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={{ height: 100 }} />

      <AddWalletModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)}
        onWalletAdded={() => {
          setModalVisible(false);
        }}
      />
    </ScrollView>
  );
};

export default Wallet;

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2; // Two cards per row with margins

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral900,
  },
  
  // Header Section
  headerSection: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.textLight,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    color: colors.text,
    fontWeight: '700',
    marginTop: 4,
  },
  
  // Balance Card
  balanceCard: {
    backgroundColor: colors.neutral800,
    marginHorizontal: 20,
    marginBottom: 30,
    marginTop:16,
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '500',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 28,
    color: colors.text,
    fontWeight: '700',
  },
  balanceIcon: {
    backgroundColor: colors.green + '20',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    color: colors.text,
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: colors.green,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  
  // Loading State
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    backgroundColor: colors.neutral800,
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  emptyActionButton: {
    backgroundColor: colors.green,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  emptyActionText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Wallets Grid
  walletsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 16,
  },
  
  // Wallet Card
  walletCard: {
    backgroundColor: colors.neutral800,
    borderRadius: 16,
    padding: 16,
    width: cardWidth,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  walletCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,

    justifyContent: 'center',
    alignItems: 'center',
  },
  walletIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  optionsButton: {
    padding: 4,
  },
  walletCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  walletCardBalance: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.green,
    marginBottom: 8,
  },
  walletCardFooter: {
    marginTop: 'auto',
  },
  walletCardDate: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '500',
  },
});
