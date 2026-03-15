import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  ZoomIn
} from 'react-native-reanimated';
import { Colors, typography } from '../constants/theme';

const SuccessModal = ({ visible, title, message, onClose }) => {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1);
      opacity.value = withTiming(1, { duration: 400 });
    } else {
      scale.value = 0.5;
      opacity.value = 0;
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View
          entering={ZoomIn.duration(400)}
          style={styles.modalContainer}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={40} color="#fff" />
          </View>

          <Text style={styles.title}>{title || "Success!"}</Text>
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Got it</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 25,
    alignItems: 'center',
    elevation: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4ade80', // Premium green
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: -10,
  },
  title: {
    ...typography.subHeader,
    fontSize: 22,
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  message: {
    ...typography.caption,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default SuccessModal;
