import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import React from 'react'
import { Colors, spacingX, spacingY, typography, radius } from '../../constants/theme'
import { useRouter } from 'expo-router'
import CustomInput from '../../components/CustomInput'
import CustomButton from '../../components/CustomButton'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/authContext'

const Register = () => {
  const router = useRouter()
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const { signup } = useAuth();

  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert("Registration", "All fields are required");
      return;
    }

    const response = await signup(email, password, username)
    if (!response.success) {
      Alert.alert("Sign Up Error", response.msg)
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={22} color={Colors.primary} />
      </TouchableOpacity>

      <View style={{ marginTop: 20 }}>
        <Text style={styles.heading}>Let's get</Text>
        <Text style={styles.heading}>Started</Text>
        <Text style={styles.subheading}>Create your account now to track all your expenses.</Text>
      </View>

      <View style={styles.form}>
        <CustomInput
          value={username}
          onChangeText={setUsername}
          placeholder="Full name"
          icon="person"
          autoCapitalize="words"
        />
        <CustomInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          icon="mail"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <CustomInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          icon="lock-closed"
          secureTextEntry
          autoCapitalize="none"
        />
      </View>

      <CustomButton 
        title="Create account" 
        onPress={handleRegister} 
        style={styles.primaryButton} 
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <TouchableOpacity onPress={() => router.navigate('/(auth)/Login')}>
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default Register

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingHorizontal: spacingX._25,
    paddingTop: spacingY._50,
  },
  backButton: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 12,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: 'center',
    marginBottom: spacingY._15,
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  heading: {
    ...typography.header,
    fontSize: 32,
    lineHeight: 40,
  },
  subheading: {
    ...typography.bodySecondary,
    fontSize: 15,
    marginTop: 10,
    marginBottom: spacingY._35,
  },
  form: {
    gap: spacingY._20,
    marginBottom: spacingY._30,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 56,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacingY._30,
  },
  footerText: {
    ...typography.bodySecondary,
  },
  loginText: {
    marginLeft: 6,
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 14,
  },
})