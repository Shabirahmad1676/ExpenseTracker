import { View, Text, StatusBar } from 'react-native'
import React from 'react'
import { Stack } from "expo-router"
import { SafeAreaProvider } from 'react-native-safe-area-context'
import SafeScreen from "../components/SafeScreen"

const _layout = () => {
  return (
    <SafeAreaProvider>
      <SafeScreen>
        <Stack screenOptions={{ headerShown: false }}></Stack>
      </SafeScreen>
      <StatusBar style="light" />
    </SafeAreaProvider>
  )
}

export default _layout