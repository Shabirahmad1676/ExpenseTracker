import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, typography } from '../constants/theme';

export default function InvestmentCard({ surplus = 5000 }) {
    // MOCK RATES
    const RATES = {
        GOLD_1G: 22000,
        SILVER_1G: 300,
        USD: 280
    };

    const getRecommendation = () => {
        if (surplus > RATES.GOLD_1G) return { type: 'Gold', icon: 'server', text: 'Buy 1g Gold', sub: 'Safe Haven' };
        if (surplus > RATES.USD * 10) return { type: 'USD', icon: 'cash', text: 'Buy $10 USD', sub: 'Currency Hedge' };
        return { type: 'Silver', icon: 'prism', text: 'Buy Silver', sub: 'Starting Small' };
    };

    const rec = getRecommendation();

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Ionicons name="trending-up" size={18} color={Colors.primary} />
                <Text style={styles.title}>AI Investment Advisor</Text>
            </View>
            <Text style={styles.surplus}>You have PKR {surplus.toLocaleString()} surplus!</Text>

            <View style={styles.recRow}>
                <View style={styles.iconBox}>
                    <Ionicons name={rec.icon} size={22} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.recTitle}>{rec.text}</Text>
                    <Text style={styles.recSub}>{rec.sub}</Text>
                </View>
                <TouchableOpacity style={styles.actionBtn}>
                    <Text style={styles.btnText}>View</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 20,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
    title: { color: Colors.primary, fontWeight: '700', fontSize: 16 },
    surplus: { ...typography.caption, marginBottom: 15 },
    recRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: 12,
        borderRadius: 16,
        gap: 12
    },
    iconBox: {
        width: 44, height: 44,
        backgroundColor: Colors.primary,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    recTitle: { ...typography.body, fontWeight: '700' },
    recSub: { ...typography.caption, fontSize: 11 },
    actionBtn: {
        backgroundColor: 'white',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 10,
        elevation: 1
    },
    btnText: { color: Colors.primary, fontSize: 12, fontWeight: '700' }
});
