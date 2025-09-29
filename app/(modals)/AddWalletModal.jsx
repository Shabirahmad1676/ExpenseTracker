import React, { useState, useRef } from "react";
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  Alert, 
  Dimensions, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  StyleSheet,
  Animated,
  LayoutAnimation
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/theme";
import CustomButton from "../../components/CustomButton";
import * as ImagePicker from "expo-image-picker";
import { doc, setDoc } from "firebase/firestore";
import { firestore } from "../../config/firebase";
import { useAuth } from "../../contexts/authContext";
import { uploadImageToCloudinary } from "../../utils/cloudinary";

const AddWalletModal = ({ visible, onClose, onWalletAdded }) => {
  const { user } = useAuth();
  const [walletName, setWalletName] = useState("");
  const [walletImage, setWalletImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedStep, setSelectedStep] = useState(1);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const { width } = Dimensions.get('window');

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

  const handleAddWallet = async () => {
    if (!walletName.trim()) {
      Alert.alert("Error", "Wallet name is required!");
      return;
    }

    setLoading(true);
    try {
      let imageUrl = walletImage;

      //  ✅ If user selected an image from device (file://),
    // first upload to Cloudinary, get back a public URL
      if (walletImage && walletImage.startsWith("file://")) {
        imageUrl = await uploadImageToCloudinary(walletImage);
      }

      // ✅ Generate walletId like 16958209834...
      const walletId = Date.now().toString();
      // ✅ Reference to Firestore document:
    // wallets/{user.uid_walletId}
      const walletRef = doc(firestore, "wallets", `${user.uid}_${walletId}`);


      //set wallet to firestore
      await setDoc(walletRef, {
        uid: user.uid,
        userName: user.displayName || "Anonymous",
        walletName: walletName.trim(),
        walletImage: imageUrl,
        createdAt: new Date().toISOString(),
      });

      Alert.alert("Success", "Wallet added!");
      // Clear form
      setWalletName("");
      setWalletImage(null);
      // Call callback ifprovided
      if (onWalletAdded) {
        onWalletAdded();
      } else {
        onClose();
      }
    } catch (err) {
      console.error("Add Wallet Error:", err);
      Alert.alert("Error", err.message || "Failed to add wallet");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      setSelectedStep(1);
      setWalletName("");
      setWalletImage(null);
    }
  }, [visible]);

  const resetForm = () => {
    setWalletName("");
    setWalletImage(null);
    setSelectedStep(1);
    setLoading(false);
  };

  const handleBack = () => {
    onClose();
    resetForm();
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
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.textLight} />
                </TouchableOpacity>
                <Text style={styles.title}>Create New Wallet</Text>
                <View style={styles.placeholder} />
              </View>

              {/* Progress Steps */}
              <View style={styles.stepIndicator}>
                <View style={[styles.stepDot, selectedStep >= 1 && styles.stepDotActive]} />
                <View style={[styles.stepLine, selectedStep >= 2 && styles.stepLineActive]} />
                <View style={[styles.stepDot, selectedStep >= 2 && styles.stepDotActive]} />
              </View>

              {/* Step 1: Wallet Name */}
              <View style={styles.stepContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Wallet Name</Text>
                  <TextInput
                    placeholder="Enter wallet name (e.g., Main Wallet, Travel)"
                    placeholderTextColor={colors.textLight}
                    value={walletName}
                    onChangeText={(text) => {
                      setWalletName(text);
                      if (text.trim().length > 0) {
                        setSelectedStep(2);
                      }
                    }}
                    style={styles.textInput}
                    autoFocus={true}
                  />
                  <Text style={styles.inputHint}>Choose a memorable name for your wallet</Text>
                </View>

                {/* Step 2: Wallet Icon */}
                {walletName.trim().length > 0 && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Wallet Icon (Optional)</Text>
                    <TouchableOpacity onPress={pickImage} style={styles.imagePickerCard}>
                      {walletImage ? (
                        <View style={styles.imageContainer}>
                          <Image source={{ uri: walletImage }} style={styles.selectedImage} />
                          <TouchableOpacity 
                            style={styles.changeImageButton}
                            onPress={pickImage}
                          >
                            <Ionicons name="camera" size={16} color={colors.text} />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.imagePlaceholder}>
                          <Ionicons name="image-outline" size={40} color={colors.textLight} />
                          <Text style={styles.imagePlaceholderText}>Add Wallet Icon</Text>
                          <Text style={styles.imagePlaceholderSubtext}>Tap to select image</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    <Text style={styles.inputHint}>Add a custom icon to identify your wallet</Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <CustomButton
                  title={loading ? "Creating..." : "Create Wallet"}
                  onPress={handleAddWallet}
                  disabled={loading || !walletName.trim()}
                  style={styles.createButton}
                />
                
                <TouchableOpacity onPress={handleBack} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AddWalletModal;

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.neutral800,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '85%',
    minHeight: '60%',
  },
  scrollView: {
    paddingHorizontal: 20,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral700,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  
  // Step Indicator
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 25,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.neutral700,
  },
  stepDotActive: {
    backgroundColor: colors.green,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.neutral700,
    marginHorizontal: 10,
  },
  stepLineActive: {
    backgroundColor: colors.green,
  },
  
  // Step Container
  stepContainer: {
    paddingVertical: 10,
  },
  
  // Input Groups
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.neutral700,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: 'transparent',
    fontWeight: '500',
  },
  inputHint: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 6,
    lineHeight: 18,
  },
  
  // Image Picker
  imagePickerCard: {
    backgroundColor: colors.neutral700,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    borderStyle: 'dashed',
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  changeImageButton: {
    backgroundColor: colors.green,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: -5,
    right: -5,
  },
  imagePlaceholder: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  imagePlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
  },
  imagePlaceholderSubtext: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 2,
  },
  
  // Buttons
  buttonContainer: {
    paddingTop: 20,
  },
  createButton: {
    marginBottom: 15,
    height: 50,
    borderRadius: 25,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.textLight,
    fontWeight: '500',
  },
});
