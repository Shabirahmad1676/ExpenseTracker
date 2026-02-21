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
import { colors } from '../../constants/theme';
import { getChatResponse } from '../../services/aiService';

const QUICK_ACTIONS = [
    { id: '1', text: 'Analyze spending', icon: 'pie-chart' },
    { id: '2', text: 'Budgeting tips', icon: 'bulb' },
    { id: '3', text: 'Recent expenses', icon: 'receipt' },
];

export default function Assistant() {
    const [messages, setMessages] = useState([
        {
            id: 'welcome',
            text: "Hello! I'm Montra AI. I have access to your transaction history and can help you analyze your spending or plan your budget. How can I help you today?",
            sender: 'ai',
            timestamp: new Date(),
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [financialData, setFinancialData] = useState({ balance: 0, recentTransactions: [] });

    const flatListRef = useRef(null);

    // --- FETCH FINANCIAL CONTEXT ---
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        // Note: Removed orderBy and limit to get FULL balance (like Market.jsx)
        // and to avoid "Missing Index" errors in Firestore.
        const q = query(
            collection(firestore, "transactions"),
            where("uid", "==", user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let totalIncome = 0;
            let totalExpense = 0;
            const allTransactions = [];

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const tx = {
                    id: doc.id,
                    title: data.title,
                    amount: data.amount,
                    type: data.type,
                    category: data.category,
                    date: data.date
                };
                allTransactions.push(tx);

                if (data.type === 'income') totalIncome += Number(data.amount);
                else totalExpense += Number(data.amount);
            });

            // Sort in memory to get the most recent ones for the AI context
            const sortedRecent = [...allTransactions]
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 10)
                .map(({ id, ...rest }) => rest); // Clean ID for AI context

            setFinancialData({
                balance: totalIncome - totalExpense,
                recentTransactions: sortedRecent
            });
        });

        return unsubscribe;
    }, []);

    const sendMessage = async (text) => {
        if (!text.trim() || loading) return;

        const userMsg = {
            id: Date.now().toString(),
            text: text.trim(),
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setLoading(true);
        Keyboard.dismiss();

        // Scroll to bottom
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        // Prepare context
        const chatHistory = messages.map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
        }));

        const response = await getChatResponse(chatHistory, financialData);

        const aiMsg = {
            id: (Date.now() + 1).toString(),
            text: response,
            sender: 'ai',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, aiMsg]);
        setLoading(false);

        // Scroll to bottom again
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const renderMessage = ({ item }) => (
        <Animated.View
            entering={FadeInUp.duration(400)}
            layout={Layout.springify()}
            style={[
                styles.messageBubble,
                item.sender === 'user' ? styles.userBubble : styles.aiBubble
            ]}
        >
            <Text style={[
                styles.messageText,
                item.sender === 'user' ? styles.userText : styles.aiText
            ]}>
                {item.text}
            </Text>
        </Animated.View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Montra AI</Text>
                    <View style={styles.statusRow}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>Always active for your finances</Text>
                    </View>
                </View>
                <View style={styles.headerIcon}>
                    <Ionicons name="sparkles" size={20} color={colors.primary} />
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            // keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.chatList}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={
                        loading && (
                            <View style={styles.aiBubble}>
                                <ActivityIndicator size="small" color={colors.primary} />
                            </View>
                        )
                    }
                />

                {messages.length === 1 && (
                    <View style={styles.quickActions}>
                        {QUICK_ACTIONS.map(action => (
                            <TouchableOpacity
                                key={action.id}
                                style={styles.actionChip}
                                onPress={() => sendMessage(action.text)}
                            >
                                <Ionicons name={action.icon} size={16} color={colors.primary} />
                                <Text style={styles.actionText}>{action.text}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Ask me something..."
                        placeholderTextColor={colors.neutral500}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                        onPress={() => sendMessage(inputText)}
                        disabled={!inputText.trim() || loading}
                    >
                        <Ionicons
                            name="send"
                            size={20}
                            color={inputText.trim() ? colors.neutral900 : colors.neutral600}
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        // paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral900,
    },
    headerTitle: {
        color: colors.white,
        fontSize: 24,
        fontWeight: '900',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary,
        marginRight: 6,
    },
    statusText: {
        color: colors.neutral500,
        fontSize: 12,
        fontWeight: '600',
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.neutral900,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.neutral800,
    },
    chatList: {
        padding: 20,
        paddingBottom: 40,
    },
    messageBubble: {
        maxWidth: '85%',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: colors.primary,
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        alignSelf: 'flex-start',
        backgroundColor: colors.neutral900,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: colors.neutral800,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    userText: {
        color: colors.neutral900,
        fontWeight: '600',
    },
    aiText: {
        color: colors.white,
    },
    quickActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        marginBottom: 15,
        gap: 10,
    },
    actionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.neutral900,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.neutral800,
        gap: 6,
    },
    actionText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: '600',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#0A0A0A',
        borderTopWidth: 1,
        borderTopColor: colors.neutral900,
    },
    input: {
        flex: 1,
        backgroundColor: colors.neutral900,
        borderRadius: 15,
        paddingHorizontal: 15,
        paddingVertical: 10,
        paddingTop: 10, // For multiline
        color: colors.white,
        fontSize: 15,
        maxHeight: 100,
    },
    sendButton: {
        width: 45,
        height: 45,
        borderRadius: 15,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
    },
    sendButtonDisabled: {
        backgroundColor: colors.neutral800,
    },
});
