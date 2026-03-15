import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, typography } from "../../constants/theme";
import { useAuth } from "../../contexts/authContext";

// Modals
import EditProfileModal from "../(modals)/EditProfileModal";
import SettingsModal from "../(modals)/SettingsModal";
import PrivacyPolicyModal from "../(modals)/PrivacyPolicyModal";
import LogoutConfirmModal from "../(modals)/LogoutConfirmModal";

const Profile = () => {
  const { user } = useAuth();
  const [activeModal, setActiveModal] = useState(null);

  const accountOptions = [
    {
      title: "Edit Profile",
      icon: "person-outline",
      color: Colors.primary,
      modal: "edit",
    },
    {
      title: "Settings",
      icon: "settings-outline",
      color: "#10B981",
      modal: "settings",
    },
    {
      title: "Privacy Policy",
      icon: "lock-closed-outline",
      color: "#F59E0B",
      modal: "privacy",
    },
    {
      title: "Logout",
      icon: "log-out-outline",
      color: Colors.danger,
      modal: "logout",
    },
  ];

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.option}
      onPress={() => setActiveModal(item.modal)}
    >
      <View style={[styles.iconWrapper, { backgroundColor: Colors.surface }]}>
        <Ionicons name={item.icon} size={22} color={item.color} />
      </View>
      <Text style={styles.optionText}>{item.title}</Text>
      <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User info */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              {user?.image ? (
                <Image source={{ uri: user.image }} style={styles.avatarImage} />
              ) : (
                <View style={styles.placeholderAvatar}>
                  <Ionicons name="person" size={40} color={Colors.textSecondary} />
                </View>
              )}
            </View>
            <View>
              <Text style={styles.username}>{user?.username || "Guest User"}</Text>
              <Text style={styles.email}>{user?.email || "not logged in"}</Text>
            </View>
          </View>
        </View>

        {/* Account Options */}
        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          {accountOptions.map((item) => (
            <View key={item.title}>
              {renderItem({ item })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Modals */}
      <EditProfileModal visible={activeModal === "edit"} onClose={() => setActiveModal(null)} />
      <SettingsModal visible={activeModal === "settings"} onClose={() => setActiveModal(null)} />
      <PrivacyPolicyModal visible={activeModal === "privacy"} onClose={() => setActiveModal(null)} />
      <LogoutConfirmModal
        visible={activeModal === "logout"}
        onCancel={() => setActiveModal(null)}
        onConfirm={() => {
          setActiveModal(null);
          // logout()
        }}
      />
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface, paddingHorizontal: 20, paddingTop: 60 },
  header: { marginBottom: 30 },
  headerTitle: {
    ...typography.header,
    marginBottom: 20,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 20,
    gap: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: "hidden",
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 70,
    height: 70,
  },
  username: { ...typography.subHeader, fontSize: 18 },
  email: { ...typography.caption, fontSize: 14 },
  optionsContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 10,
    marginBottom: 30,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: "600",
    marginLeft: 15,
    marginTop: 15,
    marginBottom: 5,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  optionText: { flex: 1, fontSize: 16, color: Colors.textPrimary, fontWeight: "500" },
});
