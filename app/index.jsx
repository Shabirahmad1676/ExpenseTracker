import { View, Text, Image, StyleSheet } from 'react-native'
import React, { useEffect } from 'react'
import { Colors } from '../constants/theme';
import { useRouter } from "expo-router"

const index = () => {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(tabs)')
    }, 2000);
    return () => clearTimeout(timer);
  }, [])

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/splashImage.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  )
}

export default index


const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary
  },
  logo: {
    width: 200,
    height: 200,
  }
})