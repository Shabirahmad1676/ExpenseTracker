import { View, Text, StatusBar } from 'react-native'
import React from 'react'
import { Stack, Slot } from "expo-router"
import { SafeAreaProvider } from 'react-native-safe-area-context'
import SafeScreen from "../components/SafeScreen"
import { AuthProvider } from '../contexts/authContext'

const _layout = () => {
  return (
    <SafeAreaProvider>
      <SafeScreen>
        <AuthProvider>
          <Slot />
        </AuthProvider>
      </SafeScreen>
      <StatusBar style="light" />
    </SafeAreaProvider>
  )
}

export default _layout