import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';
import { auth, firestore } from '../config/firebase';
import { Colors, typography } from '../constants/theme';
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
                Alert.alert("Scan Failed", "Could not find this product. Try manual entry.", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Manual Entry", onPress: () => setScrapedData({ name: "New Goal", price: 0, image: "https://placehold.co/400" }) }
                ]);
            }
        } catch (error) {
            Alert.alert("Network Error", "Scan failed. You can still set this goal manually.", [
                { text: "Cancel", style: "cancel" },
                { text: "Manual Entry", onPress: () => setScrapedData({ name: "My Goal", price: 1000, image: "https://placehold.co/400" }) }
            ]);
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
            Alert.alert("Error", "Could not save goal");
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
                placeholderTextColor={Colors.textSecondary}
            />

            <Text style={styles.label}>Product Link</Text>
            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    placeholder="Paste PriceOye URL..."
                    placeholderTextColor={Colors.textSecondary}
                    value={url}
                    onChangeText={setUrl}
                />
                <TouchableOpacity style={styles.goButton} onPress={fetchProductDetails} disabled={loading}>
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.goBtnText}>Scan</Text>}
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
        backgroundColor: 'white',
        borderRadius: 24,
        maxHeight: '90%',
    },
    content: { padding: 24, paddingBottom: 40 },
    title: { ...typography.header, fontSize: 22 },
    subtitle: { ...typography.caption, marginBottom: 20 },
    label: { ...typography.caption, color: Colors.textPrimary, fontWeight: '700', marginTop: 20, marginBottom: 10 },
    categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    catButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: Colors.surface,
    },
    catButtonActive: {
        backgroundColor: Colors.primary,
    },
    catText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
    catTextActive: { color: 'white', fontWeight: '700' },
    inputRow: { flexDirection: 'row', gap: 10 },
    input: {
        flex: 1,
        backgroundColor: Colors.surface,
        color: Colors.textPrimary,
        padding: 14,
        borderRadius: 14,
        fontSize: 14,
        fontWeight: '600',
    },
    goButton: {
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        paddingHorizontal: 20,
        borderRadius: 14,
        elevation: 2,
    },
    goBtnText: { color: 'white', fontWeight: '700' },
    preview: {
        flexDirection: 'row',
        marginTop: 25,
        gap: 15,
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 20,
    },
    image: { width: 80, height: 80, borderRadius: 14, backgroundColor: 'white' },
    pName: { ...typography.body, fontWeight: '700', fontSize: 14 },
    pPrice: { color: Colors.primary, fontSize: 14, marginVertical: 6, fontWeight: '800' },
    progressBg: {
        height: 6,
        backgroundColor: Colors.progressTrack,
        borderRadius: 3,
        marginBottom: 15,
        overflow: 'hidden'
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.progressFill
    },
    saveButton: { backgroundColor: Colors.primary, padding: 12, borderRadius: 12, alignItems: 'center', elevation: 2 },
    saveText: { fontSize: 13, fontWeight: '700', color: 'white' }
});
