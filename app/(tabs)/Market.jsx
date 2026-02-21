import { Ionicons } from "@expo/vector-icons";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { memo, useEffect, useMemo, useState } from "react";
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
import { auth, firestore } from "../../config/firebase";
import { colors } from "../../constants/theme";
import { useDebounce } from "../../hooks/useDebounce";
import { useProductDiscovery } from "../../hooks/useProductDiscovery";

const CATEGORIES = ["All", "Mobile", "Laptop", "Audio"];

// ✅ PERFORMANCE: Memoized Product Card
const ProductCard = memo(({ item, index, onBuy }) => (
    <Animated.View
        entering={FadeInDown.delay(Math.min(index * 50, 500)).duration(400)}
        style={styles.card}
    >
        <Image
            source={{ uri: item.imageUrl || item.image }}
            style={styles.image}
            resizeMode="contain"
        />
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
                <TouchableOpacity
                    style={styles.buyButton}
                    onPress={() => onBuy(item)}
                >
                    <Ionicons name="cart-outline" size={18} color={colors.neutral900} />
                </TouchableOpacity>
            </View>
        </View>
    </Animated.View>
));

export default function Market() {
    // Smart Filters State
    const [budget, setBudget] = useState("0");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [showWealthModal, setShowWealthModal] = useState(false);

    // ✅ PERFORMANCE: Debounce budget input to prevent rapid Firestore queries
    const debouncedBudget = useDebounce(budget, 500);
    const numericBudget = useMemo(() => parseInt(debouncedBudget) || 0, [debouncedBudget]);

    // Hook for Product Discovery
    const { affordablePhones, loading, error } = useProductDiscovery(numericBudget, selectedCategory);

    // --- REAL BALANCE FETCHING ---
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(collection(firestore, "transactions"), where("uid", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            let totalIncome = 0;
            let totalExpense = 0;

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.type === 'income') totalIncome += Number(data.amount);
                else totalExpense += Number(data.amount);
            });

            const totalBalance = totalIncome - totalExpense;
            setBudget(totalBalance.toString());
        });

        return unsubscribe;
    }, []);

    const handleSearchOutside = useCallback(() => {
        const queryStr = `site:priceoye.pk ${searchQuery} ${selectedCategory !== 'All' ? selectedCategory : ''} under ${budget}`;
        const url = `https://www.google.com/search?q=${encodeURIComponent(queryStr)}`;
        Linking.openURL(url);
    }, [searchQuery, selectedCategory, budget]);

    const handleBuy = useCallback((item) => {
        if (item.productUrl) {
            Linking.openURL(item.productUrl).catch(err =>
                Alert.alert("Error", "Could not open link: " + err)
            );
        } else {
            const queryStr = `${item.name} price in pakistan buy online`;
            const url = `https://www.google.com/search?q=${encodeURIComponent(queryStr)}`;
            Linking.openURL(url);
        }
    }, []);

    const filteredProducts = useMemo(() => {
        if (!affordablePhones) return [];
        return affordablePhones.filter((item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [affordablePhones, searchQuery]);

    const renderItem = useCallback(({ item, index }) => (
        <ProductCard item={item} index={index} onBuy={handleBuy} />
    ), [handleBuy]);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}

                // ✅ PERFORMANCE: Optimized FlatList configurations
                initialNumToRender={6}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}

                ListHeaderComponent={
                    <View style={styles.headerSection}>
                        <View style={styles.topRow}>
                            <View>
                                <Text style={styles.headerTitle}>Discovery</Text>
                                <Text style={styles.headerSubtitle}>Find what fits your pocket</Text>
                            </View>
                            {/* <TouchableOpacity
                                onPress={() => setShowWealthModal(true)}
                                style={styles.wealthIcon}
                            >
                                <Ionicons name="sparkles" size={24} color={colors.primary} />
                            </TouchableOpacity> */}
                        </View>

                        <View style={styles.budgetCard}>
                            <View style={styles.budgetInfo}>
                                <Text style={styles.budgetLabel}>Your Shopping Power</Text>
                                <View style={styles.budgetRow}>
                                    <Text style={styles.budgetCurrency}>PKR</Text>
                                    <TextInput
                                        style={styles.budgetInput}
                                        value={budget}
                                        onChangeText={setBudget}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        placeholderTextColor={colors.neutral500}
                                    />
                                </View>
                            </View>
                            <View style={styles.budgetVisual}>
                                <View style={styles.progressTrack}>
                                    <View style={[styles.progressFill, { width: '100%' }]} />
                                </View>
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
                                        style={[
                                            styles.categoryChip,
                                            selectedCategory === item && styles.categoryChipActive
                                        ]}
                                        onPress={() => setSelectedCategory(item)}
                                    >
                                        <Text style={[
                                            styles.categoryChipText,
                                            selectedCategory === item && styles.categoryChipTextActive
                                        ]}>
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>

                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color={colors.neutral400} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search products..."
                                placeholderTextColor={colors.neutral400}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>

                        {loading && (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={styles.loadingText}>Scouring the market...</Text>
                            </View>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    !loading && (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconCircle}>
                                <Ionicons name="basket-outline" size={48} color={colors.neutral600} />
                            </View>
                            <Text style={styles.emptyTitle}>No budget-friendly finds</Text>
                            <Text style={styles.emptyDesc}>Try increasing your budget or changing filters</Text>
                            <TouchableOpacity style={styles.googleButton} onPress={handleSearchOutside}>
                                <Ionicons name="logo-google" size={20} color={colors.white} />
                                <Text style={styles.googleButtonText}>Search Outside Market</Text>
                            </TouchableOpacity>
                        </View>
                    )
                }
                ListFooterComponent={
                    !loading && filteredProducts.length > 0 && (
                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.refreshBadge}>
                                <Ionicons name="sync" size={14} color={colors.neutral500} />
                                <Text style={styles.refreshText}>Prices updated by AI bot</Text>
                            </TouchableOpacity>
                        </View>
                    )
                }
            />
            <WealthModal
                visible={showWealthModal}
                onClose={() => setShowWealthModal(false)}
                surplus={numericBudget}
            />
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0A0A0A",
    },
    headerSection: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: "900",
        color: colors.white,
        letterSpacing: -1,
    },
    headerSubtitle: {
        fontSize: 14,
        color: colors.neutral500,
        marginTop: -2,
    },
    wealthIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.neutral900,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.neutral800,
    },
    budgetCard: {
        backgroundColor: colors.neutral900,
        borderRadius: 24,
        padding: 20,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: colors.neutral800,
    },
    budgetLabel: {
        color: colors.neutral500,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    budgetRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    budgetCurrency: {
        color: colors.primary,
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 6,
        marginRight: 8,
    },
    budgetInput: {
        color: colors.white,
        fontSize: 38,
        fontWeight: '900',
        padding: 0,
        height: 45,
    },
    budgetVisual: {
        marginTop: 15,
    },
    progressTrack: {
        height: 6,
        backgroundColor: colors.neutral800,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.primary,
    },
    categoryScroll: {
        marginBottom: 20,
    },
    categoryChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: colors.neutral900,
        borderRadius: 15,
        marginRight: 10,
        borderWidth: 1,
        borderColor: colors.neutral800,
    },
    categoryChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    categoryChipText: {
        color: colors.neutral400,
        fontWeight: '600',
    },
    categoryChipTextActive: {
        color: colors.neutral900,
        fontWeight: '800',
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.neutral900,
        borderRadius: 18,
        paddingHorizontal: 15,
        marginBottom: 25,
        height: 54,
        borderWidth: 1,
        borderColor: colors.neutral800,
    },
    searchInput: {
        flex: 1,
        color: colors.white,
        fontSize: 16,
        marginLeft: 10,
    },
    listContent: {
        paddingBottom: 100,
    },
    card: {
        backgroundColor: colors.neutral900,
        borderRadius: 28,
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 16,
        flexDirection: "row",
        height: 160,
        borderWidth: 1,
        borderColor: colors.neutral800,
    },
    image: {
        width: 100,
        height: "100%",
        borderRadius: 18,
        backgroundColor: '#1A1A1A',
    },
    cardContent: {
        flex: 1,
        paddingLeft: 16,
        justifyContent: "space-between",
    },
    categoryBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 6,
    },
    categoryText: {
        color: colors.primary,
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    productName: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.white,
        lineHeight: 22,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    priceLabel: {
        color: colors.neutral500,
        fontSize: 10,
        fontWeight: '600',
        marginBottom: 2,
    },
    productPrice: {
        fontSize: 18,
        fontWeight: "900",
        color: colors.white,
    },
    buyButton: {
        backgroundColor: colors.primary,
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        color: colors.neutral500,
        marginTop: 15,
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 60,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.neutral900,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        color: colors.white,
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 8,
    },
    emptyDesc: {
        color: colors.neutral500,
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 25,
    },
    googleButton: {
        flexDirection: 'row',
        backgroundColor: colors.neutral800,
        paddingHorizontal: 25,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: "center",
        gap: 10,
    },
    googleButtonText: {
        color: colors.white,
        fontWeight: "700",
        fontSize: 15,
    },
    footer: {
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 30,
    },
    refreshBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.neutral900,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    refreshText: {
        color: colors.neutral500,
        fontSize: 11,
        fontWeight: '600',
    }
});
