import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/theme";
import CustomButton from "../../components/CustomButton";

const PrivacyPolicyModal = ({ visible, onClose }) => {
  const privacyContent = `
PRIVACY POLICY

Last updated: ${new Date().toLocaleDateString()}

1. INFORMATION WE COLLECT

We collect information you provide directly to us, such as when you create an account, add expenses, or contact us for support.

Personal Information:
- Email address
- Username
- Expense data
- Device information

2. HOW WE USE YOUR INFORMATION

We use the information we collect to:
- Provide and maintain our services
- Process transactions
- Send you technical notices and support messages
- Improve our app and user experience

3. DATA STORAGE AND SECURITY

Your data is stored securely using Firebase services with industry-standard encryption. We implement appropriate security measures to protect your personal information.

4. DATA SHARING

We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.

5. YOUR RIGHTS

You have the right to:
- Access your personal data
- Correct inaccurate data
- Delete your account and data
- Export your data

6. CONTACT US

If you have any questions about this Privacy Policy, please contact us at:
Email: support@expensetracker.com

7. CHANGES TO THIS POLICY

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy in the app.
`;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Privacy Policy</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.privacyText}>{privacyContent}</Text>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <CustomButton
              title="I Understand"
              onPress={onClose}
              style={styles.acceptButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PrivacyPolicyModal;

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
    padding: 20,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  closeButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    marginBottom: 20,
  },
  privacyText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textLight,
  },
  footer: {
    marginTop: 10,
  },
  acceptButton: {
    backgroundColor: colors.green,
  },
});
