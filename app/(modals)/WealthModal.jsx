import { Ionicons } from '@expo/vector-icons';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import WealthInsights from '../../components/WealthInsights';
import { colors } from '../../constants/theme';

const WealthModal = ({ visible, onClose, surplus }) => {
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Wealth Dashboard</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.neutral600} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.content}>
                        <WealthInsights surplus={surplus} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: colors.neutral900,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        maxHeight: "90%",
        minHeight: "50%",
        paddingBottom: 20,
        borderWidth: 1,
        borderColor: colors.neutral800
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral800,
        backgroundColor: colors.neutral900,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.white,
    },
    closeButton: {
        padding: 5,
        backgroundColor: colors.neutral800,
        borderRadius: 20,
    },
    content: {
        padding: 20,
    }
});

export default WealthModal;
