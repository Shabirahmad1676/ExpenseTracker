import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/theme";
import CustomButton from "../../components/CustomButton";

const SettingsModal = ({ visible, onClose }) => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [autoSync, setAutoSync] = useState(true);

  const settingsOptions = [
    {
      title: "Push Notifications",
      subtitle: "Receive notifications for expenses",
      icon: "notifications",
      value: notifications,
      onValueChange: setNotifications,
    },
    {
      title: "Dark Mode",
      subtitle: "Use dark theme",
      icon: "moon",
      value: darkMode,
      onValueChange: setDarkMode,
    },
    {
      title: "Biometric Login",
      subtitle: "Use fingerprint or face ID",
      icon: "finger-print",
      value: biometric,
      onValueChange: setBiometric,
    },
    {
      title: "Auto Sync",
      subtitle: "Automatically sync data",
      icon: "sync",
      value: autoSync,
      onValueChange: setAutoSync,
    },
  ];

  const renderSettingItem = (item) => (
    <View key={item.title} style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={styles.iconWrapper}>
          <Ionicons name={item.icon} size={20} color={colors.green} />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
      <Switch
        value={item.value}
        onValueChange={item.onValueChange}
        trackColor={{ false: colors.neutral700, true: colors.green }}
        thumbColor={item.value ? "#fff" : colors.neutral500}
      />
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Settings List */}
          <ScrollView style={styles.settingsList}>
            {settingsOptions.map(renderSettingItem)}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <CustomButton
              title="Save Settings"
              onPress={() => {
                // Save settings logic here
                onClose();
              }}
              style={styles.saveButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default SettingsModal;

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
  settingsList: {
    flex: 1,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral700,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral700,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: colors.textLight,
  },
  footer: {
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: colors.green,
  },
});
