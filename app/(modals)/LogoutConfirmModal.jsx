import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/theme";
import { useAuth } from "../../contexts/authContext";
import CustomButton from "../../components/CustomButton";

const LogoutConfirmModal = ({ visible, onCancel, onConfirm }) => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      onConfirm();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="log-out-outline" size={48} color={colors.red} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Logout</Text>
          
          {/* Message */}
          <Text style={styles.message}>
            Are you sure you want to logout? You'll need to sign in again to access your data.
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <CustomButton
              title="Cancel"
              variant="outline"
              onPress={onCancel}
              style={styles.cancelButton}
            />
            <CustomButton
              title="Logout"
              onPress={handleLogout}
              style={styles.logoutButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default LogoutConfirmModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: colors.neutral800,
    borderRadius: 20,
    padding: 24,
    width: "85%",
    maxWidth: 350,
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.neutral700,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.neutral600,
  },
  logoutButton: {
    flex: 1,
    backgroundColor: colors.red,
  },
});
