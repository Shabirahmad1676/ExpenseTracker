import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import React, { useRef } from 'react'
import { colors, spacingX, spacingY, radius } from '../../constants/theme'
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


  const handleRegister =async () => {
    if (!username || !email || !password) {
      console.log("All fields required");
      return;
    }

     const response =  await signup(email,password,username)
    console.log(response,"register compoent");

    if(!response.success){
      Alert.alert("sign UP",response.msg)
    }
  };

 

  return (
    <View style={styles.container}>
      
        <Ionicons onPress={() => router.back()} name={"arrow-back"} size={30} style={styles.buttonSecondaryText} />
     
      <Text style={styles.heading}>Let's</Text>
      <Text style={styles.heading}>get Started</Text>
      <Text style={styles.subheading}>Create your account now to track all your expenses.</Text>

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

      {/* <Text style={styles.footer}>Already have an account?LogIn</Text> */}



      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'right',gap:10}}>
        <Text style={{ textAlign: "right", color: colors.green, marginTop: 12 }}>
         Don't have an account?
        </Text>
        <TouchableOpacity onPress={()=>router.navigate('/(auth)/Login')}>
          <Text style={{textAlign: "right", color: colors.green, fontWeight:500.,marginTop:12}}>Login</Text>
        </TouchableOpacity>
      </View>


      <CustomButton title="Create account" onPress={handleRegister} style={styles.primaryButton} />

     
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