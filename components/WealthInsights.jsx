import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';
import InvestmentCard from './InvestmentCard';
import SavingsGoal from './SavingsGoal';

export default function WealthInsights({ surplus }) {
    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.sectionTitle}>Grow Your Wealth 🚀</Text>
            </View>

            <View style={styles.cardsContainer}>
                {/* Investment Advisor */}
                <InvestmentCard surplus={surplus} />

                {/* Savings Goal */}
                <SavingsGoal onClose={() => { }} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 25,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 0,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.white,
        letterSpacing: 0.5,
    },
    cardsContainer: {
        gap: 15,
    }
});
