import { Ionicons } from "@expo/vector-icons";
import { addDoc, collection, doc, increment, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import SavingsGoal from "../../components/SavingsGoal";
import { firestore } from "../../config/firebase";
import { colors } from "../../constants/theme";
import { useAuth } from "../../contexts/authContext";

const GoalsScreen = () => {
    const { user } = useAuth();
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [allocationModal, setAllocationModal] = useState({ visible: false, goal: null, amount: "" });

    // Fetch goals
    useEffect(() => {
        if (!user?.uid) return;

        const goalsRef = collection(firestore, "savings_goals");
        const q = query(goalsRef, where("uid", "==", user.uid));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setGoals(data);
            setLoading(false);
        });

        return unsubscribe;
    }, [user?.uid]);

    const handleAllocate = async () => {
        const amount = parseFloat(allocationModal.amount);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert("Error", "Please enter a valid amount");
            return;
        }

        const goal = allocationModal.goal;
        const currentSaved = goal.savedAmount || 0;
        const target = goal.targetAmount || 0;
        const remaining = target - currentSaved;

        if (amount > remaining) {
            Alert.alert(
                "Limit Reached", 
                `You only need PKR ${remaining.toLocaleString()} to complete this goal. Would you like to add exactly that amount?`,
                [
                    { text: "Cancel", style: "cancel" },
                    { 
                        text: "Add PKR " + remaining.toLocaleString(), 
                        onPress: () => finalizeAllocation(remaining, goal) 
                    }
                ]
            );
            return;
        }

        await finalizeAllocation(amount, goal);
    };

    const finalizeAllocation = async (amount, goal) => {
        try {
            const goalRef = doc(firestore, "savings_goals", goal.id);
            const newSavedAmount = (goal.savedAmount || 0) + amount;
            const isCompleted = newSavedAmount >= goal.targetAmount;

            await updateDoc(goalRef, {
                savedAmount: increment(amount),
                status: isCompleted ? 'completed' : goal.status
            });

            // Log as a transaction to deduct from balance
            await addDoc(collection(firestore, "transactions"), {
                uid: user.uid,
                title: `Saving for ${goal.title}`,
                amount: amount,
                type: "expense", // Deduct from main balance
                category: "savings",
                createdAt: new Date().toISOString(),
                walletId: "system-savings" // Simplified for now
            });

            Alert.alert(
                isCompleted ? "Goal Completed! 🎯" : "Success", 
                isCompleted 
                    ? `Congratulations! You've reached your target for ${goal.title}.` 
                    : `PKR ${amount.toLocaleString()} allocated to ${goal.title}`
            );
            setAllocationModal({ visible: false, goal: null, amount: "" });
        } catch (error) {
            console.error("Allocation Error:", error);
            Alert.alert("Error", "Failed to allocate funds.");
        }
    };

    const getPacing = (goal) => {
        if (!goal.createdAt || !goal.targetDate) return { label: "Planning", color: colors.neutral500 };
        
        const start = new Date(goal.createdAt);
        const end = new Date(goal.targetDate);
        const totalDuration = end - start;
        
        if (totalDuration <= 0) return { label: "Overdue", color: colors.orange || "#FFA500" };
        
        const elapsed = new Date() - start;
        const expectedProgress = Math.min(100, (elapsed / totalDuration) * 100);
        const saved = goal.savedAmount || 0;
        const target = goal.targetAmount || 1;
        const actualProgress = (saved / target) * 100;

        if (actualProgress >= expectedProgress) return { label: "On Track", color: colors.green };
        return { label: "Needs Attention", color: colors.orange || "#FFA500" };
    };

    const renderItem = ({ item }) => {
        const saved = item.savedAmount || 0;
        const target = item.targetAmount || 1;
        const progress = Math.min(100, (saved / target) * 100);
        const pacing = getPacing(item);

        // Check if the goal was marked completed by your backend
        const isCompleted = item.status === 'completed';

        return (
            <View style={[styles.goalCard, isCompleted && { borderColor: colors.green }]}>
                <View style={styles.goalHeader}>
                    <Image source={{ uri: item.imageUrl || "https://placehold.co/400" }} style={styles.goalImage} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.goalTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.categoryBadge}>{item.category?.toUpperCase()}</Text>
                    </View>

                    {/* CONDITIONAL BADGE: Show 'Goal Met!' if completed, otherwise show normal pacing */}
                    <View style={[styles.pacingBadge, { backgroundColor: isCompleted ? colors.green + '20' : pacing.color + '20' }]}>
                        <Text style={[styles.pacingText, { color: isCompleted ? colors.green : pacing.color }]}>
                            {isCompleted ? "Goal Met! 🎉" : pacing.label}
                        </Text>
                    </View>
                </View>

                <View style={styles.progressContainer}>
                    <View style={styles.progressLabelRow}>
                        <Text style={styles.progressText}>PKR {saved.toLocaleString()} / {target.toLocaleString()}</Text>
                        <Text style={[styles.percentText, isCompleted && { color: colors.green }]}>{progress.toFixed(0)}%</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: isCompleted ? colors.green : colors.primary }]} />
                    </View>
                </View>

                {/* CONDITIONAL BUTTON: Hide 'Add Funds' if they already finished it */}
                {!isCompleted ? (
                    <TouchableOpacity
                        style={styles.allocateBtn}
                        onPress={() => setAllocationModal({ visible: true, goal: item, amount: "" })}
                    >
                        <Ionicons name="add" size={16} color="black" />
                        <Text style={styles.allocateBtnText}>Add Funds</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={[styles.allocateBtn, { backgroundColor: colors.neutral700 }]}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.green} />
                        <Text style={[styles.allocateBtnText, { color: 'white' }]}>Purchased / Target Hit</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Sinking Funds</Text>
                <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addGoalBtn}>
                    <Ionicons name="add" size={24} color="black" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={goals}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="flag-outline" size={60} color={colors.neutral700} />
                            <Text style={styles.emptyText}>No goals set yet.</Text>
                            <TouchableOpacity style={styles.startBtn} onPress={() => setShowAddModal(true)}>
                                <Text style={styles.startBtnText}>Set Your First Goal</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}

            {/* Add Goal Modal */}
            <Modal visible={showAddModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setShowAddModal(false)}>
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>
                        <SavingsGoal onClose={() => setShowAddModal(false)} />
                    </View>
                </View>
            </Modal>

            {/* Allocation Modal */}
            <Modal visible={allocationModal.visible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.allocationContent}>
                        <Text style={styles.allocTitle}>Add to {allocationModal.goal?.title}</Text>
                        <TextInput
                            style={styles.allocInput}
                            placeholder="Enter amount..."
                            placeholderTextColor={colors.neutral500}
                            keyboardType="numeric"
                            autoFocus
                            value={allocationModal.amount}
                            onChangeText={(text) => setAllocationModal({ ...allocationModal, amount: text })}
                        />
                        <View style={styles.allocActions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setAllocationModal({ visible: false, goal: null, amount: "" })}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmBtn} onPress={handleAllocate}>
                                <Text style={styles.confirmBtnText}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default GoalsScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.neutral900, paddingHorizontal: 20, paddingTop: 60 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    headerTitle: { fontSize: 28, fontWeight: "bold", color: "black" },
    addGoalBtn: { backgroundColor: colors.primary, width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
    listContent: { paddingBottom: 100 },
    goalCard: { backgroundColor: colors.neutral800, borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.neutral700 },
    goalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
    goalImage: { width: 50, height: 50, borderRadius: 12, backgroundColor: "#333" },
    goalTitle: { color: "white", fontSize: 16, fontWeight: "bold" },
    categoryBadge: { color: colors.neutral500, fontSize: 10, marginTop: 2, fontWeight: "600" },
    pacingBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    pacingText: { fontSize: 10, fontWeight: "bold" },
    progressContainer: { marginBottom: 16 },
    progressLabelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    progressText: { color: colors.neutral400, fontSize: 12 },
    percentText: { color: colors.primary, fontWeight: "bold", fontSize: 12 },
    progressBarBg: { height: 8, backgroundColor: colors.neutral900, borderRadius: 4, overflow: "hidden" },
    progressBarFill: { height: "100%", backgroundColor: colors.primary },
    allocateBtn: { flexDirection: "row", backgroundColor: colors.primary, paddingVertical: 10, borderRadius: 12, justifyContent: "center", alignItems: "center", gap: 6 },
    allocateBtnText: { fontWeight: "bold", fontSize: 14, color: "black" },
    emptyState: { alignItems: "center", marginTop: 100 },
    emptyText: { color: colors.neutral600, marginTop: 16, fontSize: 16 },
    startBtn: { marginTop: 20, backgroundColor: colors.neutral800, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, borderWidth: 1, borderColor: colors.neutral700 },
    startBtnText: { color: colors.primary, fontWeight: "bold" },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", padding: 20 },
    modalContent: { position: "relative" },
    closeBtn: { position: "absolute", top: -40, right: 0, zIndex: 10 },
    allocationContent: { backgroundColor: colors.neutral800, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.neutral700 },
    allocTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    allocInput: { backgroundColor: colors.neutral900, color: 'white', padding: 15, borderRadius: 16, fontSize: 18, marginBottom: 24, borderWidth: 1, borderColor: colors.neutral700 },
    allocActions: { flexDirection: 'row', gap: 12 },
    cancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center' },
    cancelBtnText: { color: colors.neutral400, fontWeight: 'bold' },
    confirmBtn: { flex: 2, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
    confirmBtnText: { color: 'black', fontWeight: 'bold' }
});
