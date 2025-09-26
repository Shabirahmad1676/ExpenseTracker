import { View, Text, Image, StyleSheet } from 'react-native'
import React, { useEffect } from 'react'
import {colors} from '../constants/theme';
import {useRouter} from "expo-router"

const index = () => {
  const router = useRouter();

  useEffect(()=>{
    setTimeout(() => {
      router.push('/(auth)/Welcome')
    }, 2000);
  },[])

  return (
    <View style={styles.container}>
    <Image source={require('../assets/images/splashImage.png')} />
    </View>
  )
}

export default index


const styles = StyleSheet.create({
  container : {
    flex:1,
    alignItems:'center',
    justifyContent:'center',
    backgroundColor:colors.neutral900
  }
})