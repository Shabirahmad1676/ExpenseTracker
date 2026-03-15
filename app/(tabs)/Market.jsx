import { Ionicons } from "@expo/vector-icons";
import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from "firebase/firestore";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Linking,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import WealthModal from "../(modals)/WealthModal";
import PriceHistoryModal from "../(modals)/PriceHistoryModal";
import { auth, firestore } from "../../config/firebase";
import { Colors, typography } from "../../constants/theme";
import { useDebounce } from "../../hooks/useDebounce";
import { useProductDiscovery } from "../../hooks/useProductDiscovery";

const CATEGORIES = ["All", "Mobile", "Laptop", "Audio"];

const ProductCard = memo(({ item, index, onBuy, onSetGoal, onShowHistory }) => (
    <Animated.View
        entering={FadeInDown.delay(Math.min(index * 50, 500)).duration(400)}
        style={styles.card}
    >
        <TouchableOpacity 
            style={styles.imageContainer}
            onPress={() => onShowHistory(item)}
            activeOpacity={0.7}
        >
          <Image
              source={{ uri: item.imageUrl || item.image }}
              style={styles.image}
              resizeMode="contain"
          />
          <View style={styles.trendBadge}>
              <Ionicons name="trending-down" size={12} color="white" />
          </View>
        </TouchableOpacity>
        <View style={styles.cardContent}>
            <View>
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{item.category || 'Product'}</Text>
                </View>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            </View>
            <View style={styles.priceRow}>
                <View>
                    <Text style={styles.priceLabel}>Current Price</Text>
                    <Text style={styles.productPrice}>PKR {item.price.toLocaleString()}</Text>
                </View>
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={styles.goalButton}
                        onPress={() => onSetGoal(item)}
                    >
                        <Ionicons name="flag-outline" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.buyButton}
                        onPress={() => onBuy(item)}
                    >
                        <Ionicons name="cart-outline" size={18} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </Animated.View>
));

export default function Market() {
    const [budget, setBudget] = useState("0");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [showWealthModal, setShowWealthModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    const debouncedBudget = useDebounce(budget, 500);
    const numericBudget = useMemo(() => parseInt(debouncedBudget) || 0, [debouncedBudget]);

    const { affordablePhones, loading, error } = useProductDiscovery(numericBudget, selectedCategory);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(collection(firestore, "transactions"), where("uid", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            let totalIncome = 0;
            let totalExpense = 0;
            snapshot.docs.forEach(doc => {
                if (doc.data().type === 'income') totalIncome += Number(doc.data().amount);
                else totalExpense += Number(doc.data().amount);
            });
            setBudget((totalIncome - totalExpense).toString());
        });
        return unsubscribe;
    }, []);

    const handleSearchOutside = useCallback(() => {
        const queryStr = `site:priceoye.pk ${searchQuery} ${selectedCategory !== 'All' ? selectedCategory : ''} under ${budget}`;
        Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(queryStr)}`);
    }, [searchQuery, selectedCategory, budget]);

    const handleBuy = useCallback((item) => {
        const url = item.productUrl || `https://www.google.com/search?q=${encodeURIComponent(item.name + " price in pakistan buy online")}`;
        Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open link"));
    }, []);

    const handleSetGoal = useCallback(async (item) => {
        const user = auth.currentUser;
        if (!user) { Alert.alert("Login Required", "Please login to set financial goals."); return; }
        try {
            await addDoc(collection(firestore, "savings_goals"), {
                uid: user.uid,
                title: item.name,
                targetAmount: item.price,
                imageUrl: item.imageUrl || item.image || null,
                status: 'active',
                createdAt: serverTimestamp()
            });
            Alert.alert("Goal Set! 🎯", `Added ${item.name} to your savings goals.`);
        } catch (error) { Alert.alert("Error", "Could not save goal"); }
    }, []);

    const handleShowHistory = useCallback((item) => {
        setSelectedProduct(item);
        setShowHistoryModal(true);
    }, []);

    const filteredProducts = useMemo(() => affordablePhones?.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())) || [], [affordablePhones, searchQuery]);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <ProductCard 
                        item={item} 
                        index={index} 
                        onBuy={handleBuy} 
                        onSetGoal={handleSetGoal} 
                        onShowHistory={handleShowHistory}
                    />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View style={styles.headerSection}>
                        <View style={styles.topRow}>
                            <View>
                                <Text style={styles.headerTitle}>Discovery</Text>
                                <Text style={styles.headerSubtitle}>Find what fits your budget</Text>
                            </View>
                        </View>

                        <View style={styles.budgetCard}>
                            <Text style={styles.budgetLabel}>Shopping Power</Text>
                            <View style={styles.budgetRow}>
                                <Text style={styles.budgetCurrency}>PKR</Text>
                                <TextInput
                                    style={styles.budgetInput}
                                    value={budget}
                                    onChangeText={setBudget}
                                    keyboardType="numeric"
                                    placeholder="0"
                                />
                            </View>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: '100%' }]} />
                            </View>
                        </View>

                        <View style={styles.categoryScroll}>
                            <FlatList
                                horizontal
                                data={CATEGORIES}
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={item => item}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[styles.categoryChip, selectedCategory === item && styles.categoryChipActive]}
                                        onPress={() => setSelectedCategory(item)}
                                    >
                                        <Text style={[styles.categoryChipText, selectedCategory === item && styles.categoryChipTextActive]}>{item}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>

                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color={Colors.textSecondary} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search products..."
                                placeholderTextColor={Colors.textSecondary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>

                        {loading && <View style={styles.loadingContainer}><ActivityIndicator size="large" color={Colors.primary} /><Text style={styles.loadingText}>Fetching deals...</Text></View>}
                    </View>
                }
                ListEmptyComponent={!loading && (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="basket-outline" size={60} color={Colors.textSecondary} />
                        <Text style={styles.emptyTitle}>Nothing found yet</Text>
                        <Text style={styles.emptyDesc}>Try adjusting your filters or search outside</Text>
                        <TouchableOpacity style={styles.googleButton} onPress={handleSearchOutside}>
                            <Ionicons name="logo-google" size={20} color="white" />
                            <Text style={styles.googleButtonText}>Search Outside</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
            <WealthModal visible={showWealthModal} onClose={() => setShowWealthModal(false)} surplus={numericBudget} />
            <PriceHistoryModal 
                visible={showHistoryModal} 
                onClose={() => setShowHistoryModal(false)} 
                product={selectedProduct} 
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    headerSection: { paddingHorizontal: 20, paddingTop: 10 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerTitle: { ...typography.header, fontSize: 30 },
    headerSubtitle: { ...typography.caption, marginTop: -2 },
    budgetCard: { backgroundColor: Colors.cardDark, borderRadius: 24, padding: 20, marginBottom: 25, elevation: 5 },
    budgetLabel: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 5 },
    budgetRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 15 },
    budgetCurrency: { color: Colors.accent, fontSize: 18, fontWeight: '800', marginBottom: 6, marginRight: 8 },
    budgetInput: { color: 'white', fontSize: 34, fontWeight: '900', padding: 0 },
    progressBarBg: { height: 6, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: Colors.accent },
    categoryScroll: { marginBottom: 20 },
    categoryChip: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: 'white', borderRadius: 14, marginRight: 10, elevation: 1 },
    categoryChipActive: { backgroundColor: Colors.primary },
    categoryChipText: { color: Colors.textSecondary, fontWeight: '600' },
    categoryChipTextActive: { color: 'white', fontWeight: '800' },
    searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: 'white', borderRadius: 18, paddingHorizontal: 15, marginBottom: 25, height: 56, elevation: 2 },
    searchInput: { flex: 1, color: Colors.textPrimary, fontSize: 16, marginLeft: 10 },
    listContent: { paddingBottom: 100 },
    card: { backgroundColor: "white", borderRadius: 24, marginHorizontal: 20, marginBottom: 16, padding: 12, flexDirection: "row", height: 160, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
    imageContainer: { width: 110, height: "100%", borderRadius: 18, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    trendBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: Colors.primary, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWeight: 2, borderColor: 'white' },
    image: { width: 90, height: 90 },
    cardContent: { flex: 1, paddingLeft: 15, justifyContent: "space-between" },
    categoryBadge: { backgroundColor: Colors.surface, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 5 },
    categoryText: { color: Colors.primary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
    productName: { ...typography.body, fontWeight: "700" },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    priceLabel: { ...typography.caption, marginBottom: 1 },
    productPrice: { fontSize: 18, fontWeight: "900", color: Colors.textPrimary },
    actionRow: { flexDirection: 'row', gap: 10 },
    goalButton: { backgroundColor: Colors.surface, width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    buyButton: { backgroundColor: Colors.primary, width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", elevation: 3 },
    loadingContainer: { alignItems: 'center', paddingVertical: 30 },
    loadingText: { ...typography.caption, marginTop: 10 },
    emptyContainer: { alignItems: 'center', padding: 40 },
    emptyTitle: { ...typography.subHeader, marginTop: 15 },
    emptyDesc: { ...typography.caption, textAlign: 'center', marginTop: 5, marginBottom: 20 },
    googleButton: { flexDirection: 'row', backgroundColor: Colors.textPrimary, paddingHorizontal: 25, paddingVertical: 12, borderRadius: 14, alignItems: "center", gap: 10 },
    googleButtonText: { color: 'white', fontWeight: "700" },
});
