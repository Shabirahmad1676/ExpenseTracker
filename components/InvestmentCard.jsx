import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/theme';

export default function InvestmentCard({ surplus = 5000 }) {
    // MOCK RATES (This would come from Firestore 'market_rates' updated by n8n)
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
                <Ionicons name="trending-up" size={20} color={colors.primary} />
                <Text style={styles.title}>AI Investment Advisor</Text>
            </View>
            <Text style={styles.surplus}>You have PKR {surplus.toLocaleString()} surplus!</Text>

            <View style={styles.recBox}>
                <View style={styles.iconBox}>
                    <Ionicons name={rec.icon} size={24} color="black" />
                </View>
                <View>
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
        backgroundColor: colors.neutral800,
        padding: 15,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.neutral700
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
    title: { color: colors.primary, fontWeight: 'bold', fontSize: 16 },
    surplus: { color: colors.neutral400, fontSize: 12, marginBottom: 15 },
    recBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.neutral800,
        padding: 10,
        borderRadius: 15,
        gap: 15
    },
    iconBox: {
        width: 40, height: 40,
        backgroundColor: colors.primary,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },
    recTitle: { color: 'white', fontWeight: 'bold' },
    recSub: { color: colors.neutral400, fontSize: 10 },
    actionBtn: {
        marginLeft: 'auto',
        backgroundColor: colors.neutral700,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8
    },
    btnText: { color: 'white', fontSize: 12 }
});
