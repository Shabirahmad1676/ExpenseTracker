import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { colors, spacingX, spacingY, radius } from '../../constants/theme'
import { useRouter } from 'expo-router'
import CustomInput from '../../components/CustomInput'
import CustomButton from '../../components/CustomButton'
import { Ionicons } from '@expo/vector-icons'

const Register = () => {
  const router = useRouter()
  return (
    <View style={styles.container}>
      
        <Ionicons onPress={() => router.back()} name={"arrow-back"} size={30} style={styles.buttonSecondaryText} />
     
      <Text style={styles.heading}>Hey</Text>
      <Text style={styles.heading}>Welcome Back</Text>
      <Text style={styles.subheading}>Login now to track all your expenses.</Text>

      <View style={styles.form}>
        <CustomInput placeholder="Full name" icon="person" autoCapitalize="words" />
        <CustomInput placeholder="Email" icon="mail" keyboardType="email-address" autoCapitalize="none" />
        <CustomInput placeholder="Password" icon="lock-closed" secureTextEntry autoCapitalize="none" />
      </View>

      <Text style={styles.footer}>Already have an account?LogIn</Text>

      <CustomButton title="Create account" onPress={() => {}} style={styles.primaryButton} />

     
    </View>
  )
}

export default Register

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral900,
    paddingHorizontal: spacingX._25,
    paddingTop: spacingY._40
  },
  heading: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '700',
    marginBottom: spacingY._10
  },
  subheading: {
    color: colors.textLight,
    fontSize: 14,
    marginBottom: spacingY._25
  },
  form: {
    gap: spacingY._15
  },
  primaryButton: {
    marginTop: spacingY._25
  },
  buttonSecondaryText: {
    color: colors.text,
    fontWeight: '600',
    backgroundColor:colors.neutral600,
    width:46,
    marginBottom:12,
    borderRadius:20,
    padding:6
  },
  footer: {
    color:colors.green,
    textAlign:'right',
    marginTop:12,
  }
})