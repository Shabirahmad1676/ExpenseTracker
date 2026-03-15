import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CustomButton from "../../components/CustomButton";
import { firestore } from "../../config/firebase";
import { Colors, typography } from "../../constants/theme";
import { useAuth } from "../../contexts/authContext";
import SuccessModal from "../../components/SuccessModal";


const { width } = Dimensions.get('window');

const AddWalletModal = ({ visible, onClose, onWalletAdded, editData = null }) => {
  const { user } = useAuth();
  const [walletName, setWalletName] = useState("");
  const [walletImage, setWalletImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedStep, setSelectedStep] = useState(1);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isEdit = !!editData;

  const pickImage = async () => {
    const mediaTypesFallback = (ImagePicker?.MediaType?.Images) ?? (ImagePicker?.MediaTypeOptions?.Images);
    const options = {
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      ...(mediaTypesFallback ? { mediaTypes: mediaTypesFallback } : {}),
    };

    const result = await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled) {
      setWalletImage(result.assets[0].uri);
    }
  };

  const handleSaveWallet = async () => {
    if (!walletName.trim()) {
      Alert.alert("Error", "Wallet name is required!");
      return;
    }

    setLoading(true);
    try {
      let imageUrl = walletImage;

      if (walletImage && walletImage.startsWith("file://")) {
        imageUrl = await uploadImageToCloudinary(walletImage);
      }

      if (isEdit) {
        const walletRef = doc(firestore, "wallets", editData.id);
        await updateDoc(walletRef, {
          walletName: walletName.trim(),
          walletImage: imageUrl,
          updatedAt: new Date().toISOString(),
        });
        setSuccessMsg("Wallet updated successfully!");
        setSuccessVisible(true);
      } else {
        const walletId = Date.now().toString();
        const walletRef = doc(firestore, "wallets", `${user.uid}_${walletId}`);
        await setDoc(walletRef, {
          uid: user.uid,
          userName: user.displayName || "Anonymous",
          walletName: walletName.trim(),
          walletImage: imageUrl,
          createdAt: new Date().toISOString(),
        });
        setSuccessMsg("New wallet has been created!");
        setSuccessVisible(true);
      }

      if (onWalletAdded) onWalletAdded();
      // Notice: we don't call onClose() here yet, we wait for SuccessModal
    } catch (err) {
      console.error("Wallet Error:", err);
      Alert.alert("Error", err.message || "Failed to save wallet");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (visible) {
      if (isEdit) {
        setWalletName(editData.walletName || "");
        setWalletImage(editData.walletImage || null);
        setSelectedStep(2);
      }
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      resetForm();
    }
  }, [visible, editData]);

  const resetForm = () => {
    setWalletName("");
    setWalletImage(null);
    setSelectedStep(1);
    setLoading(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContainer, { opacity: fadeAnim }]}>
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
                <Text style={styles.title}>{isEdit ? "Edit Wallet" : "Create New Wallet"}</Text>
                <View style={styles.placeholder} />
              </View>

              <View style={styles.stepIndicator}>
                <View style={[styles.stepDot, selectedStep >= 1 && styles.stepDotActive]} />
                <View style={styles.stepLine} />
                <View style={[styles.stepDot, selectedStep >= 2 && styles.stepDotActive]} />
              </View>

              <View style={styles.stepContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Wallet Name</Text>
                  <TextInput
                    placeholder="e.g., Main Wallet, Savings"
                    placeholderTextColor={Colors.textSecondary}
                    value={walletName}
                    onChangeText={(text) => {
                      setWalletName(text);
                      if (text.trim().length > 0) setSelectedStep(2);
                    }}
                    style={styles.textInput}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Wallet Icon</Text>
                  <TouchableOpacity onPress={pickImage} style={styles.imagePickerCard}>
                    {walletImage ? (
                      <View style={styles.imageContainer}>
                        <Image source={{ uri: walletImage }} style={styles.selectedImage} />
                        <View style={styles.changeImageBadge}>
                          <Ionicons name="camera" size={14} color="white" />
                        </View>
                      </View>
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Ionicons name="image-outline" size={32} color={Colors.textSecondary} />
                        <Text style={styles.imagePlaceholderText}>Add Icon</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.buttonContainer}>
                <CustomButton
                  title={loading ? "Saving..." : isEdit ? "Save Changes" : "Create Wallet"}
                  onPress={handleSaveWallet}
                  disabled={loading || !walletName.trim()}
                />
                <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
      <SuccessModal 
        visible={successVisible} 
        title={isEdit ? "Wallet Updated" : "Wallet Created"}
        message={successMsg} 
        onClose={() => {
          setSuccessVisible(false);
          resetForm();
          onClose();
        }} 
      />
    </Modal>
  );
};

export default AddWalletModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '75%',
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  scrollView: {
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  closeButton: {
    padding: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  title: {
    ...typography.subHeader,
    fontSize: 18,
  },
  placeholder: { width: 40 },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.progressTrack,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
    width: 20,
  },
  stepLine: {
    width: 30,
    height: 2,
    backgroundColor: Colors.progressTrack,
    marginHorizontal: 8,
  },
  stepContainer: {
    paddingVertical: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  imagePickerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.progressTrack,
    borderStyle: 'dashed',
  },
  imageContainer: {
    position: 'relative',
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  changeImageBadge: {
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 3,
    borderColor: 'white',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    ...typography.caption,
    marginTop: 8,
    fontWeight: '700',
  },
  buttonContainer: {
    marginTop: 20,
    gap: 10,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  cancelButtonText: {
    ...typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
