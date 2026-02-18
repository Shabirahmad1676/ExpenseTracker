import { addDoc, collection } from 'firebase/firestore';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, firestore } from '../config/firebase';
import { colors } from '../constants/theme';
import { parseProductDetails } from '../services/aiService';

export default function SavingsGoal({ onClose }) {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [scrapedData, setScrapedData] = useState(null);

    const fetchProductDetails = async () => {
        if (!url) return;
        setLoading(true);

        try {
            // 1. Fetch HTML (Simple fetch, might need proxy for some sites)
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36'
                }
            });
            const html = await response.text();

            // 2. Parse with Groq AI
            const data = await parseProductDetails(html);

            if (data && data.name) {
                setScrapedData({
                    name: data.name,
                    price: Number(data.price) || 0,
                    image: data.image || "https://placehold.co/400"
                });
            } else {
                Alert.alert("Error", "Could not extract product details. Try another link.");
            }
        } catch (error) {
            console.error("Scrape Error:", error);
            Alert.alert("Error", "Failed to load URL.");
        } finally {
            setLoading(false);
        }
    };

    const saveGoal = async () => {
        try {
            await addDoc(collection(firestore, "savings_goals"), {
                uid: auth.currentUser.uid,
                ...scrapedData,
                targetAmount: scrapedData.price,
                savedAmount: 0,
                createdAt: new Date()
            });
            Alert.alert("Success", "Savings Goal Added!");
            onClose();
        } catch (error) {
            Alert.alert("Error", "Could not save goal");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>New Savings Goal</Text>
            <Text style={styles.subtitle}>Paste a link, we'll auto-track the price.</Text>

            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    placeholder="Paste Product URL..."
                    placeholderTextColor={colors.neutral400}
                    value={url}
                    onChangeText={setUrl}
                />
                <TouchableOpacity style={styles.goButton} onPress={fetchProductDetails} disabled={loading}>
                    {loading ? <ActivityIndicator color="black" /> : <Text style={styles.btnText}>AI Scan</Text>}
                </TouchableOpacity>
            </View>

            {scrapedData && (
                <View style={styles.preview}>
                    <Image source={{ uri: scrapedData.image }} style={styles.image} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.pName}>{scrapedData.name}</Text>
                        <Text style={styles.pPrice}>Target: PKR {scrapedData.price.toLocaleString()}</Text>
                        <TouchableOpacity style={styles.saveButton} onPress={saveGoal}>
                            <Text style={styles.saveText}>Start Saving</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.neutral800,
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.neutral700
    },
    title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    subtitle: { color: colors.neutral400, fontSize: 12, marginBottom: 15 },
    inputRow: { flexDirection: 'row', gap: 10 },
    input: {
        flex: 1,
        backgroundColor: colors.neutral900,
        color: 'white',
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.neutral700
    },
    goButton: {
        backgroundColor: colors.primary,
        justifyContent: 'center',
        paddingHorizontal: 15,
        borderRadius: 10
    },
    btnText: { fontWeight: 'bold' },
    preview: {
        flexDirection: 'row',
        marginTop: 15,
        gap: 15,
        backgroundColor: colors.neutral900,
        padding: 10,
        borderRadius: 15
    },
    image: { width: 60, height: 60, borderRadius: 10, backgroundColor: '#333' },
    pName: { color: 'white', fontWeight: 'bold' },
    pPrice: { color: colors.primary, fontSize: 12, marginVertical: 4 },
    saveButton: { backgroundColor: colors.primary, padding: 5, borderRadius: 8, alignItems: 'center' },
    saveText: { fontSize: 10, fontWeight: 'bold' }
});
