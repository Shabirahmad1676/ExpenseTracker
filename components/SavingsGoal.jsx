import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';
import { auth, firestore } from '../config/firebase';
import { colors } from '../constants/theme';
import { parseProductDetails } from '../services/aiService';

const CATEGORIES = [
    { label: 'Mobile', value: 'mobiles' },
    { label: 'Washing Machine', value: 'washing-machines' },
    { label: 'Air Conditioner', value: 'air-conditioners' },
    { label: 'Tablet', value: 'tablets' },
];

export default function SavingsGoal({ onClose }) {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [scrapedData, setScrapedData] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('mobiles');
    const [monthsToSave, setMonthsToSave] = useState('3');

    const fetchProductDetails = async () => {
        if (!url) return;
        setLoading(true);

        try {
            // 1. Try to find the product in our local 'market_products' collection first
            // This is much more reliable than client-side scraping
            const marketRef = collection(firestore, "market_products");
            const q = query(marketRef, where("productUrl", "==", url));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const productData = querySnapshot.docs[0].data();
                setScrapedData({
                    name: productData.name,
                    price: productData.price,
                    image: productData.imageUrl || "https://placehold.co/400"
                });
                return;
            }

            // 2. Fallback: Try a direct fetch (might fail due to CORS/IP blocks)
            console.log("Product not in DB, attempting direct fetch...");
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36'
                }
            });
            const html = await response.text();
            const data = await parseProductDetails(html);

            if (data && data.name) {
                setScrapedData({
                    name: data.name,
                    price: Number(data.price) || 0,
                    image: data.image || "https://placehold.co/400"
                });
            } else {
                Alert.alert(
                    "Scan Failed", 
                    "Could not find this product in our database or via scan. Would you like to enter it manually?",
                    [
                        { text: "Cancel", style: "cancel" },
                        { text: "Manual Entry", onPress: () => setScrapedData({ name: "New Goal", price: 0, image: "https://placehold.co/400" }) }
                    ]
                );
            }
        } catch (error) {
            console.error("Scrape Error:", error);
            // On error, offer manual entry
            Alert.alert(
                "Network Error", 
                "PriceOye blocked the direct scan, but you can still set this goal manually.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Manual Entry", onPress: () => setScrapedData({ name: "My Goal", price: 1000, image: "https://placehold.co/400" }) }
                ]
            );
        } finally {
            setLoading(false);
        }
    };

    const saveGoal = async () => {
        try {
            const targetDate = new Date();
            targetDate.setMonth(targetDate.getMonth() + parseInt(monthsToSave));

            await addDoc(collection(firestore, "savings_goals"), {
                uid: auth.currentUser.uid,
                title: scrapedData.name,
                targetAmount: scrapedData.price,
                savedAmount: 0,
                marketPrice: scrapedData.price,
                category: selectedCategory,
                imageUrl: scrapedData.image,
                createdAt: new Date().toISOString(),
                targetDate: targetDate.toISOString(),
                status: 'active'
            });
            Alert.alert("Success", "Savings Goal Added!");
            onClose();
        } catch (error) {
            console.error("Save Goal Error:", error);
            Alert.alert("Error", "Could not save goal");
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={styles.title}>New Sinking Fund</Text>
            <Text style={styles.subtitle}>Track prices & save toward your goal.</Text>

            <Text style={styles.label}>Product Category</Text>
            <View style={styles.categoryRow}>
                {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                        key={cat.value}
                        style={[styles.catButton, selectedCategory === cat.value && styles.catButtonActive]}
                        onPress={() => setSelectedCategory(cat.value)}
                    >
                        <Text style={[styles.catText, selectedCategory === cat.value && styles.catTextActive]}>{cat.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>Timeframe (Months)</Text>
            <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={monthsToSave}
                onChangeText={setMonthsToSave}
                placeholder="How many months?"
                placeholderTextColor={colors.neutral400}
            />

            <Text style={styles.label}>Product Link</Text>
            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    placeholder="Paste PriceOye URL..."
                    placeholderTextColor={colors.neutral400}
                    value={url}
                    onChangeText={setUrl}
                />
                <TouchableOpacity style={styles.goButton} onPress={fetchProductDetails} disabled={loading}>
                    {loading ? <ActivityIndicator color="black" /> : <Text style={styles.btnText}>Scan</Text>}
                </TouchableOpacity>
            </View>

            {scrapedData && (
                <View style={styles.preview}>
                    <Image source={{ uri: scrapedData.image }} style={styles.image} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.pName} numberOfLines={2}>{scrapedData.name}</Text>
                        <Text style={styles.pPrice}>Target: PKR {scrapedData.price.toLocaleString()}</Text>
                        <View style={styles.progressBg}>
                            <View style={[styles.progressFill, { width: '0%' }]} />
                        </View>
                        <TouchableOpacity style={styles.saveButton} onPress={saveGoal}>
                            <Text style={styles.saveText}>Create Goal</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.neutral800,
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.neutral700,
        maxHeight: '90%'
    },
    title: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    subtitle: { color: colors.neutral400, fontSize: 13, marginBottom: 20 },
    label: { color: colors.neutral300, fontSize: 12, marginBottom: 8, marginTop: 15, fontWeight: '600' },
    categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    catButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: colors.neutral900,
        borderWidth: 1,
        borderColor: colors.neutral700
    },
    catButtonActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary
    },
    catText: { color: colors.neutral400, fontSize: 11 },
    catTextActive: { color: 'black', fontWeight: 'bold' },
    inputRow: { flexDirection: 'row', gap: 10 },
    input: {
        flex: 1,
        backgroundColor: colors.neutral900,
        color: 'white',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.neutral700
    },
    goButton: {
        backgroundColor: colors.primary,
        justifyContent: 'center',
        paddingHorizontal: 20,
        borderRadius: 12
    },
    btnText: { fontWeight: 'bold' },
    preview: {
        flexDirection: 'row',
        marginTop: 20,
        gap: 15,
        backgroundColor: colors.neutral900,
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: colors.neutral700
    },
    image: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#333' },
    pName: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    pPrice: { color: colors.primary, fontSize: 13, marginVertical: 6, fontWeight: '600' },
    progressBg: {
        height: 6,
        backgroundColor: colors.neutral800,
        borderRadius: 3,
        marginBottom: 12,
        overflow: 'hidden'
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.primary
    },
    saveButton: { backgroundColor: colors.primary, padding: 10, borderRadius: 10, alignItems: 'center' },
    saveText: { fontSize: 12, fontWeight: 'bold', color: 'black' }
});
