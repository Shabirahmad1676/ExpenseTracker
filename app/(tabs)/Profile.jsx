import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/theme";
import { useAuth } from "../../contexts/authContext";

// Modals
import EditProfileModal from "../(modals)/EditProfileModal";
import SettingsModal from "../(modals)/SettingsModal";
import PrivacyPolicyModal from "../(modals)/PrivacyPolicyModal";
import LogoutConfirmModal from "../(modals)/LogoutConfirmModal";

const Profile = () => {
  const { user } = useAuth();
  const [activeModal, setActiveModal] = useState(null); // can be: "edit", "settings", "privacy", "logout"

  const accountOptions = [
    {
      title: "Edit Profile",
      icon: "person",
      bgColor: colors.blue,
      modal: "edit",
    },
    {
      title: "Settings",
      icon: "settings",
      bgColor: colors.green,
      modal: "settings",
    },
    {
      title: "Privacy Policy",
      icon: "lock-closed",
      bgColor: colors.purple,
      modal: "privacy",
    },
    {
      title: "Logout",
      icon: "log-out",
      bgColor: colors.red,
      modal: "logout",
    },
  ];

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.option}
      onPress={() => setActiveModal(item.modal)}
    >
      <View style={[styles.iconWrapper, { backgroundColor: item.bgColor }]}>
        <Ionicons name={item.icon} size={20} color="#fff" />
      </View>
      <Text style={styles.optionText}>{item.title}</Text>
      <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* User info */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          {user?.image ? (
            <Image source={{ uri: user.image }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={50} color="#ccc" />
          )}
        </View>
        <Text style={styles.username}>{user?.username || "Guest User"}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Account Options */}
      <FlatList
        data={accountOptions}
        renderItem={renderItem}
        keyExtractor={(item) => item.title}
      />

      {/* Modals */}
      <EditProfileModal
        visible={activeModal === "edit"}
        onClose={() => setActiveModal(null)}
      />
      <SettingsModal
        visible={activeModal === "settings"}
        onClose={() => setActiveModal(null)}
      />
      <PrivacyPolicyModal
        visible={activeModal === "privacy"}
        onClose={() => setActiveModal(null)}
      />
      <LogoutConfirmModal
        visible={activeModal === "logout"}
        onCancel={() => setActiveModal(null)}
        onConfirm={() => {
          setActiveModal(null);
          // call logout here
          logout()
        }}
      />
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral900, padding: 20 },
  header: { alignItems: "center", marginBottom: 30 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.neutral700,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  username: { color: colors.text, fontSize: 18, fontWeight: "700" },
  email: { color: colors.textLight, fontSize: 14 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral700,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  optionText: { flex: 1, fontSize: 16, color: colors.text },
});
