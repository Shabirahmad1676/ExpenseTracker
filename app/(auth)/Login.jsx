import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native'
import React from 'react'
import { colors, spacingX, spacingY } from '../../constants/theme'
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
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </TouchableOpacity>

      {/* Headings */}
      <Text style={styles.heading}>Welcome Back 👋</Text>
      <Text style={styles.subheading}>Login to track your expenses easily.</Text>

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
        title={!loading ? "Logging in..." : "Login"} 
        onPress={handleLogin} 
        style={styles.primaryButton} 
        disabled={loading}
        loading={loading} // 👈 if your CustomButton supports it
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
    backgroundColor: colors.neutral900,
    paddingHorizontal: spacingX._25,
    paddingTop: spacingY._40,
  },
  backButton: {
    backgroundColor: colors.neutral700,
    padding: 8,
    borderRadius: 10,
    width: 40,
    alignItems: "center",
    marginBottom: spacingY._15,
  },
  heading: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "700",
    marginBottom: spacingY._10,
  },
  subheading: {
    color: colors.textLight,
    fontSize: 15,
    marginBottom: spacingY._25,
  },
  form: {
    gap: spacingY._15,
    marginBottom: spacingY._20,
  },
  errorText: {
    color: "red",
    fontSize: 13,
    marginTop: 4,
  },
  forgotPassword: {
    color: colors.green,
    fontSize: 14,
    fontWeight: "500",
    marginTop: 6,
    textAlign: "right",
  },
  primaryButton: {
    marginTop: spacingY._20,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacingY._30,
  },
  footerText: {
    color: colors.textLight,
    fontSize: 14,
  },
  signUpText: {
    marginLeft: 6,
    color: colors.green,
    fontWeight: "600",
    fontSize: 14,
  },
})
