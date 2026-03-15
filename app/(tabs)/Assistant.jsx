import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, firestore } from '../../config/firebase';
import { Colors, typography } from '../../constants/theme';
import { getChatResponse } from '../../services/aiService';

const QUICK_ACTIONS = [
    { id: '1', text: 'Analyze spending', icon: 'pie-chart-outline' },
    { id: '2', text: 'Budgeting tips', icon: 'bulb-outline' },
    { id: '3', text: 'Recent expenses', icon: 'receipt-outline' },
];

export default function Assistant() {
    const [messages, setMessages] = useState([
        {
            id: 'welcome',
            text: "Hello! I'm Montra AI. I can help you analyze your spending or plan your budget. How can I help you today?",
            sender: 'ai',
            timestamp: new Date(),
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [financialData, setFinancialData] = useState({ balance: 0, recentTransactions: [], goals: [] });
    const flatListRef = useRef(null);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const unsubscribeTx = onSnapshot(query(collection(firestore, "transactions"), where("uid", "==", user.uid)), (snapshot) => {
            let totalIncome = 0;
            let totalExpense = 0;
            const allTransactions = snapshot.docs.map(doc => {
                const data = doc.data();
                if (data.type === 'income') totalIncome += Number(data.amount);
                else totalExpense += Number(data.amount);
                return data;
            });

            setFinancialData(prev => ({
                ...prev,
                balance: totalIncome - totalExpense,
                recentTransactions: allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10)
            }));
        });

        const unsubscribeGoals = onSnapshot(query(collection(firestore, "savings_goals"), where("uid", "==", user.uid), where("status", "==", "active")), (snapshot) => {
            setFinancialData(prev => ({ ...prev, goals: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) }));
        });

        return () => { unsubscribeTx(); unsubscribeGoals(); };
    }, []);

    const sendMessage = async (text) => {
        if (!text.trim() || loading) return;
        const userMsg = { id: Date.now().toString(), text: text.trim(), sender: 'user', timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setLoading(true);
        Keyboard.dismiss();
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        const response = await getChatResponse(messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })), financialData);
        setMessages(prev => [...prev, { id: Date.now().toString(), text: response, sender: 'ai', timestamp: new Date() }]);
        setLoading(false);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const renderMessage = ({ item }) => (
        <Animated.View
            entering={FadeInUp.duration(400)}
            layout={Layout.springify()}
            style={[styles.messageBubble, item.sender === 'user' ? styles.userBubble : styles.aiBubble]}
        >
            <Text style={[styles.messageText, { color: item.sender === 'user' ? 'white' : Colors.textPrimary }]}>{item.text}</Text>
        </Animated.View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View>
                  <Text style={styles.headerTitle}>Montra AI</Text>
                  <View style={styles.statusRow}>
                      <View style={styles.statusDot} />
                      <Text style={styles.statusText}>Active Intelligence</Text>
                  </View>
                </View>
                <View style={styles.headerIcon}>
                    <Ionicons name="sparkles" size={24} color={Colors.primary} />
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.chatList}
                    ListHeaderComponent={() => (
                      financialData.goals.length > 0 && (
                        <View style={styles.goalContainer}>
                            <Text style={styles.goalSectionTitle}>Your Saving Goals 🎯</Text>
                            {financialData.goals.map(goal => {
                                const progress = Math.min(financialData.balance / (goal.targetAmount || 1), 1);
                                return (
                                    <View key={goal.id} style={styles.goalCard}>
                                        <Text style={styles.goalName}>{goal.title}</Text>
                                        <View style={styles.progressBarBg}>
                                            <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                                        </View>
                                        <Text style={styles.progressText}>{Math.round(progress * 100)}% saved</Text>
                                    </View>
                                );
                            })}
                        </View>
                      )
                    )}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={loading && <View style={styles.aiBubble}><ActivityIndicator size="small" color={Colors.primary} /></View>}
                />

                {messages.length === 1 && (
                    <View style={styles.quickActions}>
                        {QUICK_ACTIONS.map(action => (
                            <TouchableOpacity key={action.id} style={styles.actionChip} onPress={() => sendMessage(action.text)}>
                                <Ionicons name={action.icon} size={16} color={Colors.primary} />
                                <Text style={styles.actionText}>{action.text}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Ask me something..."
                        placeholderTextColor={Colors.textSecondary}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                        onPress={() => sendMessage(inputText)}
                        disabled={!inputText.trim() || loading}
                    >
                        <Ionicons name="send" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E3F5',
    },
    headerTitle: { ...typography.header, fontSize: 22 },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 6 },
    statusText: { ...typography.caption, fontWeight: '600' },
    headerIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chatList: { padding: 20 },
    messageBubble: { maxWidth: '85%', padding: 16, borderRadius: 20, marginBottom: 12 },
    userBubble: { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
    aiBubble: { alignSelf: 'flex-start', backgroundColor: 'white', borderBottomLeftRadius: 4, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
    messageText: { fontSize: 15, lineHeight: 22 },
    quickActions: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, marginBottom: 15, gap: 10 },
    actionChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, elevation: 1, gap: 8 },
    actionText: { ...typography.caption, fontWeight: '700', color: Colors.textPrimary },
    inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#E5E3F5' },
    input: { flex: 1, backgroundColor: Colors.surface, borderRadius: 15, paddingHorizontal: 15, paddingVertical: 12, color: Colors.textPrimary, fontSize: 15, maxHeight: 100 },
    sendButton: { width: 48, height: 48, borderRadius: 15, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
    sendButtonDisabled: { backgroundColor: Colors.progressTrack },
    goalContainer: { marginBottom: 25, backgroundColor: 'white', padding: 20, borderRadius: 20, elevation: 2 },
    goalSectionTitle: { ...typography.caption, fontWeight: '700', textTransform: 'uppercase', marginBottom: 15 },
    goalCard: { marginBottom: 15 },
    goalName: { ...typography.body, fontWeight: '700', marginBottom: 8 },
    progressBarBg: { height: 8, backgroundColor: Colors.progressTrack, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
    progressBarFill: { height: '100%', backgroundColor: Colors.progressFill, borderRadius: 4 },
    progressText: { color: Colors.primary, fontSize: 12, fontWeight: '800', textAlign: 'right' },
});
