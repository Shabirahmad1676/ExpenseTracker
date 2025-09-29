import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../../constants/theme";
import { useAuth } from "../../contexts/authContext";
import CustomButton from "../../components/CustomButton";
import CustomInput from "../../components/CustomInput";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../config/firebase"
import { uploadImageToCloudinary } from "../../utils/cloudinary"








const EditProfileModal = ({ visible, onClose }) => {
  const { user, setUser } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileImage, setProfileImage] = useState(user?.image || null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "Permission to access camera roll is required!");
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
      console.error("Image picker error:", error);
    }
  };

  //remove image from gallery 
  const removeImage = () => {
    Alert.alert(
      "Remove Profile Picture",
      "Are you sure you want to remove your profile picture?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => setProfileImage(null) },
      ]
    );
  };


  // const handleSave = async () => {
  //   if (!username.trim()) {
  //     Alert.alert("Error", "Username cannot be empty");
  //     return;
  //   }
  
  //   setLoading(true);
  //   try {
  //     let imageUrl = profileImage;
  
  //     // 🔹 If a new image is selected (not already a Firebase URL), upload it
  //     if (profileImage && !profileImage.startsWith("https")) {
  //       const response = await fetch(profileImage);
  //       const blob = await response.blob();
  
  //       const storageRef = ref(storage, `profileImages/${user.uid}.jpg`);
  //       await uploadBytes(storageRef, blob);
  
  //       imageUrl = await getDownloadURL(storageRef);
  //     }
  
  //     // 🔹 Save user data in Firestore
  //     const { doc, setDoc } = await import("firebase/firestore");
  //     const { firestore } = await import("../../config/firebase");
  
  //     const userRef = doc(firestore, "users", user.uid);
  //     await setDoc(
  //       userRef,
  //       {
  //         username: username.trim(),
  //         email: email.trim(),
  //         image: imageUrl || null,
  //         uid: user.uid,
  //       },
  //       { merge: true }
  //     );
  
  //     // 🔹 Update local state
  //     setUser({
  //       ...user,
  //       username: username.trim(),
  //       email: email.trim(),
  //       image: imageUrl,
  //     });
  
  //     Alert.alert("Success", "Profile updated successfully!");
  //     onClose();
  //   } catch (error) {
  //     Alert.alert("Error", "Failed to update profile");
  //     console.error("Update profile error:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  


const handleSave = async () => {
  if (!username.trim()) {
    Alert.alert("Error", "Username cannot be empty");
    return;
  }

  setLoading(true);
  try {
    let imageUrl = profileImage;

    // If new image selected → upload to Cloudinary
    if (profileImage && profileImage.startsWith("file://")) {
      imageUrl = await uploadImageToCloudinary(profileImage);
    }

    // Save to Firestore
    const { doc, setDoc } = await import("firebase/firestore");
    const { firestore } = await import("../../config/firebase");

    const userRef = doc(firestore, "users", user.uid);
    await setDoc(
      userRef,
      {
        username: username.trim(),
        email: email.trim(),
        image: imageUrl,
        uid: user.uid,
      },
      { merge: true }
    );

    // Update local context state
    setUser({
      ...user,
      username: username.trim(),
      email: email.trim(),
      image: imageUrl,
    });

    Alert.alert("Success", "Profile updated successfully!");
    onClose();
  } catch (error) {
    Alert.alert("Error", "Failed to update profile");
    console.error("Update profile error:", error);
  } finally {
    setLoading(false);
  }
};


  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Edit Profile</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Profile Image Section */}
          <View style={styles.imageSection}>
            <Text style={styles.imageLabel}>Profile Picture</Text>
            <View style={styles.imageContainer}>
              {profileImage ? (
               <Image 
               source={user?.image ? { uri: user.image } : require("../../assets/images/defaultAvatar.png")} 
               style={styles.profileImage} 
             />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="person" size={40} color={colors.textLight} />
                </View>
              )}
              
              <View style={styles.imageButtons}>
                <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                  <Ionicons name="camera" size={16} color={colors.text} />
                  <Text style={styles.imageButtonText}>Change</Text>
                </TouchableOpacity>
                
                {profileImage && (
                  <TouchableOpacity style={[styles.imageButton, styles.removeButton]} onPress={removeImage}>
                    <Ionicons name="trash" size={16} color={colors.red} />
                    <Text style={[styles.imageButtonText, { color: colors.red }]}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <CustomInput
              label="Username"
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username"
              icon="person"
            />
            
            <CustomInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              icon="mail"
              keyboardType="email-address"
              editable={false}
              style={{ opacity: 0.6 }}
            />

            <View style={styles.buttonContainer}>
              <CustomButton
                title="Cancel"
                variant="outline"
                onPress={onClose}
                style={styles.cancelButton}
              />
              <CustomButton
                title={loading ? "Saving..." : "Save Changes"}
                onPress={handleSave}
                style={styles.saveButton}
                disabled={loading}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default EditProfileModal;

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
  imageSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  imageLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  imageContainer: {
    alignItems: "center",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.neutral700,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  imageButtons: {
    flexDirection: "row",
    gap: 12,
  },
  imageButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.neutral700,
    borderRadius: 20,
    gap: 4,
  },
  removeButton: {
    backgroundColor: colors.neutral800,
    borderWidth: 1,
    borderColor: colors.red,
  },
  imageButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.text,
  },
  form: {
    gap: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});
