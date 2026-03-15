import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native'
import React from 'react'
import { Colors, spacingX, spacingY, typography } from '../../constants/theme'
import { useRouter } from 'expo-router'
import CustomInput from '../../components/CustomInput'
import CustomButton from '../../components/CustomButton'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/authContext'

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const { login, loading, setLoading } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("All fields are required");
      return;
    }
    setError("");
    
    setLoading(true);
    const response = await login(email, password);
    setLoading(false);

    if (!response.success) {
      setError(response.msg);
    } else {
      setEmail("");
      setPassword("");
      router.replace("/(tabs)"); // 👈 go to home/dashboard
    }
  };

  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={22} color={Colors.primary} />
      </TouchableOpacity>

      {/* Headings */}
      <View style={{ marginTop: 20 }}>
        <Text style={styles.heading}>Welcome Back 👋</Text>
        <Text style={styles.subheading}>Login to track your expenses easily.</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
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

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity>
          <Text style={styles.forgotPassword}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      {/* Login Button */}
      <CustomButton 
        title={loading ? "Logging in..." : "Login"} 
        onPress={handleLogin} 
        style={styles.primaryButton} 
        disabled={loading}
        loading={loading}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Don’t have an account?</Text>
        <TouchableOpacity onPress={() => router.navigate('/(auth)/Register')}>
          <Text style={styles.signUpText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default Login

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
    fontSize: 28,
    marginBottom: spacingY._10,
  },
  subheading: {
    ...typography.bodySecondary,
    fontSize: 15,
    marginBottom: spacingY._35,
  },
  form: {
    gap: spacingY._20,
    marginBottom: spacingY._20,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    marginTop: 4,
  },
  forgotPassword: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "right",
  },
  primaryButton: {
    marginTop: spacingY._30,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 56,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacingY._40,
  },
  footerText: {
    ...typography.bodySecondary,
  },
  signUpText: {
    marginLeft: 6,
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 14,
  },
})
