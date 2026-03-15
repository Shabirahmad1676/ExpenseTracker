import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo } from "react";
import { ActivityIndicator, Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { Colors, typography } from "../../constants/theme";
import { usePriceHistory } from "../../hooks/usePriceHistory";

const { width } = Dimensions.get("window");

const PriceHistoryModal = ({ visible, onClose, product }) => {
    const { history, loading } = usePriceHistory(product?.id || null);

    const chartData = useMemo(() => {
        if (!history || history.length === 0) return [];
        return history.map(point => ({
            value: point.price,
            label: point.timestamp?.toDate ? new Date(point.timestamp.toDate()).toLocaleDateString([], { month: 'short', day: 'numeric' }) : "",
            dataPointText: `PKR ${point.price.toLocaleString()}`
        }));
    }, [history]);

    const stats = useMemo(() => {
        if (!history || history.length === 0) return null;
        const prices = history.map(h => h.price);
        return {
            min: Math.min(...prices),
            max: Math.max(...prices),
            avg: Math.floor(prices.reduce((a, b) => a + b, 0) / prices.length),
            current: product?.price || prices[prices.length - 1]
        };
    }, [history, product]);

    const recommendation = useMemo(() => {
        if (!stats) return null;
        if (stats.current <= stats.min) return { text: "Best time to buy! Currently at its lowest.", color: "#4ade80", icon: "checkmark-circle" };
        if (stats.current >= stats.max) return { text: "Price is high. Wait for a drop if possible.", color: "#f87171", icon: "time" };
        return { text: "Stable price. Good for regular purchase.", color: Colors.primary, icon: "information-circle" };
    }, [stats]);

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.title} numberOfLines={1}>{product?.name}</Text>
                            <Text style={styles.subtitle}>Price Intelligence</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={20} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={styles.loadingBox}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                        </View>
                    ) : history.length < 2 ? (
                        <View style={styles.emptyBox}>
                            <Ionicons name="analytics-outline" size={50} color={Colors.progressTrack} />
                            <Text style={styles.emptyText}>Not enough data yet. We just started tracking this item's price.</Text>
                        </View>
                    ) : (
                        <View style={styles.content}>
                            <View style={styles.chartBox}>
                                <LineChart
                                    data={chartData}
                                    width={width - 80}
                                    height={180}
                                    noOfSections={4}
                                    spacing={40}
                                    color={Colors.primary}
                                    thickness={3}
                                    startFillColor={Colors.primary}
                                    endFillColor="rgba(255,255,255,0.1)"
                                    startOpacity={0.4}
                                    endOpacity={0.1}
                                    initialSpacing={10}
                                    yAxisColor={Colors.progressTrack}
                                    xAxisColor={Colors.progressTrack}
                                    yAxisTextStyle={{ color: Colors.textSecondary, fontSize: 10 }}
                                    xAxisLength={width - 100}
                                    pointerConfig={{
                                        pointerStripHeight: 160,
                                        pointerStripColor: 'lightgray',
                                        pointerStripWidth: 2,
                                        pointerColor: Colors.primary,
                                        radius: 6,
                                        pointerLabelComponent: items => {
                                            return (
                                                <View style={styles.pointerLabel}>
                                                    <Text style={styles.pointerValue}>{items[0].value.toLocaleString()}</Text>
                                                </View>
                                            );
                                        },
                                    }}
                                />
                            </View>

                            <View style={styles.statsGrid}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statLabel}>LOW</Text>
                                    <Text style={[styles.statValue, { color: '#4ade80' }]}>PKR {stats?.min.toLocaleString()}</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statLabel}>HIGH</Text>
                                    <Text style={[styles.statValue, { color: '#f87171' }]}>PKR {stats?.max.toLocaleString()}</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statLabel}>AVERAGE</Text>
                                    <Text style={styles.statValue}>PKR {stats?.avg.toLocaleString()}</Text>
                                </View>
                            </View>

                            {recommendation && (
                                <View style={[styles.recommendation, { backgroundColor: recommendation.color + '15', borderColor: recommendation.color + '30' }]}>
                                    <Ionicons name={recommendation.icon} size={20} color={recommendation.color} />
                                    <Text style={[styles.recommendationText, { color: recommendation.color }]}>{recommendation.text}</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

export default PriceHistoryModal;

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: 'flex-end' },
    container: { backgroundColor: "white", borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingBottom: 40, maxHeight: '80%' },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 25, borderBottomWidth: 1, borderBottomColor: Colors.surface },
    title: { ...typography.body, fontWeight: "700", fontSize: 18 },
    subtitle: { ...typography.caption, fontSize: 12, color: Colors.primary, fontWeight: '700', textTransform: 'uppercase' },
    closeBtn: { padding: 8, backgroundColor: Colors.surface, borderRadius: 20 },
    content: { padding: 20 },
    loadingBox: { height: 300, justifyContent: 'center', alignItems: 'center' },
    emptyBox: { height: 300, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { ...typography.caption, textAlign: 'center', marginTop: 15 },
    chartBox: { marginTop: 10, marginBottom: 30, alignItems: 'center' },
    statsGrid: { flexDirection: 'row', gap: 15, marginBottom: 25 },
    statItem: { flex: 1, backgroundColor: Colors.surface, padding: 12, borderRadius: 15, alignItems: 'center' },
    statLabel: { fontSize: 9, fontWeight: '800', color: Colors.textSecondary, marginBottom: 4 },
    statValue: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
    recommendation: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 18, borderWidth: 1, gap: 10 },
    recommendationText: { fontSize: 13, fontWeight: '600', flex: 1 },
    pointerLabel: { backgroundColor: Colors.cardDark, padding: 6, borderRadius: 8 },
    pointerValue: { color: 'white', fontWeight: '700', fontSize: 12 }
});
