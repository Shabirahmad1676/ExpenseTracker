import { StyleSheet, Text, View } from 'react-native';
import { Colors, typography } from '../constants/theme';
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
    },
    sectionTitle: {
        ...typography.subHeader,
        fontSize: 18,
    },
    cardsContainer: {
        gap: 15,
    }
});
