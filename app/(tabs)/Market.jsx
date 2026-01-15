import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    Image,
    StyleSheet,
    ActivityIndicator,
    Linking,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/theme";
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, onSnapshot } from "firebase/firestore";
import { firestore, auth } from "../../config/firebase";
import { SafeAreaView } from "react-native-safe-area-context";

// --- RESET: Updated with Real Links ---
// --- RESET: Updated with More Laptops ---
const MOCK_PRODUCTS = [
    {
        name: "Itel Super S26 Ultra",
        price: 44999,
        category: "Mobile",
        image: "https://images.priceoye.pk/itel-super-s26-ultra-pakistan-priceoye-jg2my-500x500.webp",
        productUrl: "https://priceoye.pk/mobiles/itel/itel-super-s26-ultra"
    },
    {
        name: "Tecno Spark Go 1",
        price: 39999,
        category: "Mobile",
        image: "https://images.priceoye.pk/tecno-spark-go-1-pakistan-priceoye-ljx8q-500x500.webp",
        productUrl: "https://priceoye.pk/mobiles/tecno/tecno-spark-go-1"
    },
    {
        name: "Lenovo ThinkPad E14 Gen 4 Ryzen 5 DOS",
        price: 48000,
        category: "Laptop",
        image: "https://images.priceoye.pk/lenovo-thinkpad-e14-gen-4-ryzen-5-dos-pakistan-priceoye-p76fx-500x500.webp",
        productUrl: "https://priceoye.pk/laptops/lenovo/lenovo-thinkpad-e14-gen-4-ryzen-5-dos"
    },
    {
        name: "HP EliteBook 840 G3 (Refurb)",
        price: 52000,
        category: "Laptop",
        image: "https://images.priceoye.pk/hp-elitebook-pakistan-priceoye-rk3yt-500x500.webp",
        productUrl: "https://priceoye.pk/laptops/hp/hp-elitebook"
    },
    {
        name: "Redmi Buds 4 Active",
        price: 4500,
        category: "Audio",
        image: "https://images.priceoye.pk/redmi-buds-4-active-pakistan-priceoye-0laiv-500x500.webp",
        productUrl: "https://priceoye.pk/wireless-earbuds/xiaomi/redmi-buds-4-active"
    }
];

const CATEGORIES = ["All", "Mobile", "Laptop", "Audio"];

export default function Market() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Smart Filters State
    const [budget, setBudget] = useState("0"); // Init with 0, will update with real balance
    const [selectedCategory, setSelectedCategory] = useState("All");

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
            console.log("Real Balance Updated:", totalBalance);
            setBudget(totalBalance.toString());
        });

        return unsubscribe;
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(firestore, "market_products"));
            const fetchedProducts = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setProducts(fetchedProducts);
        } catch (error) {
            console.error("Error fetching products: ", error);
            Alert.alert("Error", "Failed to fetch products");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // --- SCRAPER LOGIC using RegEx ---
    const updatePrices = async () => {
        setSeeding(true);
        try {
            const collectionRef = collection(firestore, "market_products");

            // 1. DELETE OLD DATA (Cleanup to show only 5 items)
            const snapshot = await getDocs(collectionRef);
            const deletePromises = snapshot.docs.map(d => deleteDoc(doc(firestore, "market_products", d.id)));
            await Promise.all(deletePromises);
            console.log("Old data cleared.");

            // 2. ADD NEW MOCK DATA (With live prices)
            const updatePromises = MOCK_PRODUCTS.map(async (product) => {
                let currentPrice = product.price;

                if (product.productUrl && product.productUrl.includes('priceoye.pk')) {
                    try {
                        console.log(`Fetching ${product.name}...`);
                        // Fetch the HTML text
                        const response = await fetch(product.productUrl, {
                            headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36' }
                        });
                        const html = await response.text();

                        // --- REGEX PARSER (Native / Safe) ---
                        // 1. Try to find Meta Tag: <meta property="product:price:amount" content="44999"/>
                        const metaRegex = /<meta property="product:price:amount" content="(\d+)"/i;
                        const metaMatch = html.match(metaRegex);

                        // 2. Try to find PriceOye specific class: <div class="summary-price">...</div>
                        const classRegex = /summary-price[^>]*>[\s\S]*?(\d{2,},?\d{3})/;
                        const classMatch = html.match(classRegex);

                        if (metaMatch && metaMatch[1]) {
                            currentPrice = parseInt(metaMatch[1]);
                            console.log(`[Regex] Updated Price (Meta) for ${product.name}: ${currentPrice}`);
                        } else if (classMatch && classMatch[1]) {
                            currentPrice = parseInt(classMatch[1].replace(/,/g, ''));
                            console.log(`[Regex] Updated Price (Class) for ${product.name}: ${currentPrice}`);
                        } else {
                            console.log(`[Regex] No price pattern found for ${product.name}`);
                        }
                    } catch (err) {
                        console.error(`Failed to scrape ${product.name}: ${err}`);
                    }
                }

                // Add/Update to Firestore with timestamp
                return addDoc(collectionRef, {
                    ...product,
                    price: currentPrice,
                    lastUpdated: new Date().toISOString()
                });
            });

            await Promise.all(updatePromises);
            Alert.alert("Success", "Database updated with LIVE prices!");
            fetchProducts();
        } catch (error) {
            console.error("Error updating database: ", error);
            Alert.alert("Error", "Failed to update database");
        } finally {
            setSeeding(false);
        }
    };

    const handleSearchOutside = () => {
        const query = `site:priceoye.pk ${searchQuery} ${selectedCategory !== 'All' ? selectedCategory : ''} under ${budget}`;
        const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        Linking.openURL(url);
    };

    // --- UPDATED: Redirect to Real Website ---
    const handleBuy = (item) => {
        if (item.productUrl) {
            Linking.openURL(item.productUrl).catch(err =>
                Alert.alert("Error", "Could not open link: " + err)
            );
        } else {
            // Fallback for old items without links
            const query = `${item.name} price in pakistan buy online`;
            const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            Linking.openURL(url);
        }
    };

    const filteredProducts = products.filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const budgetLimit = parseInt(budget) || 0;
        const withinBudget = item.price <= budgetLimit;
        const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;

        return matchesSearch && withinBudget && matchesCategory;
    });

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <Image
                source={{ uri: item.image }}
                style={styles.image}
                resizeMode="cover"
            />
            <View style={styles.cardContent}>
                <View>
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{item.category || 'Product'}</Text>
                    </View>
                    <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                </View>
                <View>
                    <Text style={styles.productPrice}>PKR {item.price.toLocaleString()}</Text>
                    <TouchableOpacity
                        style={styles.buyButton}
                        onPress={() => handleBuy(item)}
                    >
                        <Text style={styles.buyButtonText}>Buy</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.headerTitle}>Marketplace</Text>
                    <View style={styles.budgetInputContainer}>
                        <Text style={styles.currencyLabel}>PKR</Text>
                        <TextInput
                            style={styles.budgetInput}
                            value={budget}
                            onChangeText={setBudget}
                            keyboardType="numeric"
                            placeholder="Budget"
                            placeholderTextColor={colors.neutral500}
                        />
                    </View>
                </View>
                <Text style={styles.budgetSubtitle}>Showing items under your budget</Text>
            </View>

            {/* Categories */}
            <View style={styles.categoryContainer}>
                <FlatList
                    horizontal
                    data={CATEGORIES}
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={item => item}
                    contentContainerStyle={{ paddingHorizontal: 20 }}
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
                <Ionicons name="search" size={20} color={colors.neutral400} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search items..."
                    placeholderTextColor={colors.neutral400}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : products.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No products found in database.</Text>
                    <TouchableOpacity style={styles.seedButton} onPress={updatePrices} disabled={seeding}>
                        {seeding ? (
                            <ActivityIndicator color={colors.neutral900} />
                        ) : (
                            <Text style={styles.seedButtonText}>Load Live Data (Scrape)</Text>
                        )}
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filteredProducts}
                    keyExtractor={(item, index) => item.id || index.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}

                    // Show Search Outside button in footer so it's always accessible
                    ListFooterComponent={
                        <View style={{ gap: 10, marginTop: 25 }}>
                            <TouchableOpacity style={styles.fallbackButton} onPress={handleSearchOutside}>
                                <Ionicons name="logo-google" size={20} color={colors.white} style={{ marginRight: 8 }} />
                                <Text style={styles.fallbackButtonText}>Search Outside Market</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.fallbackButton, { backgroundColor: colors.neutral700, borderColor: colors.neutral600 }]}
                                onPress={updatePrices}
                                disabled={seeding}
                            >
                                {seeding ? (
                                    <ActivityIndicator color={colors.white} size="small" />
                                ) : (
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons name="cloud-download" size={18} color={colors.neutral400} style={{ marginRight: 8 }} />
                                        <Text style={[styles.fallbackButtonText, { color: colors.neutral400, fontSize: 14 }]}>Update Live Prices</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    }
                    // Show Search Outside button in middle if search returns nothing
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 20 }}>
                            <Text style={styles.emptyText}>No budget-friendly items found for "{searchQuery}"</Text>
                            <TouchableOpacity style={styles.fallbackButton} onPress={handleSearchOutside}>
                                <Ionicons name="logo-google" size={20} color={colors.neutral900} style={{ marginRight: 8 }} />
                                <Text style={styles.fallbackButtonText}>Search Outside Market</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )
            }
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#121212", // Deeper dark background
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 15,
        paddingTop: 10,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: "800",
        color: colors.white,
        letterSpacing: 0.5,
    },
    budget: {
        fontSize: 16,
        color: colors.primary, // Pop color
        marginTop: 5,
        fontWeight: "600",
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.neutral800,
        marginHorizontal: 20,
        borderRadius: 16,
        paddingHorizontal: 15,
        marginBottom: 25,
        height: 55,
        borderWidth: 1,
        borderColor: colors.neutral700,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        color: colors.white,
        fontSize: 16,
        fontWeight: "500",
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: colors.neutral800,
        // backgroundColor: 'red',
        borderRadius: 20,
        marginBottom: 20,
        overflow: "hidden",
        flexDirection: "row",
        height: 170, // Taller card
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 8,
        borderWidth: 1,
        borderColor: colors.neutral700,
    },
    image: {
        width: 130,
        height: "100%",
        backgroundColor: '#2a2a2a',
    },
    cardContent: {
        // backgroundColor: 'red',
        flex: 1,
        padding: 15,
        paddingBottom: 25,
        justifyContent: "space-between",
    },
    productName: {
        fontSize: 17,
        fontWeight: "700",
        color: colors.white,
        lineHeight: 24,
    },
    productPrice: {
        fontSize: 20,
        fontWeight: "800",
        color: colors.primary,
        marginVertical: 4,
    },
    buyButton: {
        backgroundColor: colors.primary,
        paddingVertical: 6,
        borderRadius: 12,
        alignItems: "center",
        alignSelf: "flex-start",
        paddingHorizontal: 25,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 4,
    },
    buyButtonText: {
        color: colors.neutral900,
        fontWeight: "800",
        fontSize: 14,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    loader: {
        marginTop: 50,
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 60,
    },
    emptyText: {
        color: colors.neutral400,
        fontSize: 18,
        marginBottom: 20,
        textAlign: 'center',
        fontWeight: "500",
    },
    seedButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 25,
        paddingVertical: 14,
        borderRadius: 16,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    seedButtonText: {
        color: colors.neutral900,
        fontWeight: "800",
        fontSize: 16,
    },
    fallbackButton: {
        flexDirection: 'row',
        backgroundColor: colors.neutral800,
        padding: 18,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 25,
        borderWidth: 1,
        borderColor: colors.neutral600,
    },
    fallbackButtonText: {
        color: colors.white,
        fontWeight: "700",
        fontSize: 16,
    },
    // New Styles for Smart Filter UI
    budgetInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.neutral700,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    currencyLabel: {
        color: colors.primary,
        fontWeight: 'bold',
        marginRight: 4,
    },
    budgetInput: {
        color: colors.white,
        fontSize: 16,
        fontWeight: 'bold',
        minWidth: 60,
        textAlign: 'right',
    },
    budgetSubtitle: {
        color: colors.neutral400,
        fontSize: 14,
        marginTop: 4,
        marginBottom: 10,
    },
    categoryContainer: {
        marginBottom: 16,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: colors.neutral800,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: colors.neutral700,
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
        fontWeight: 'bold',
    },
    categoryBadge: {
        backgroundColor: colors.neutral800,
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.neutral700,
    },
    categoryText: {
        color: colors.primary,
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
});