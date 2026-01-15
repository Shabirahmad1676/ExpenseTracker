import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../constants/theme';


const SafeScreen = ({ children }) => {
  const inset = useSafeAreaInsets()
  return (
    <View style={[styles.container, { paddingTop: inset.top, paddingBottom: inset.bottom }]}>
      {children}
    </View>
  )
}

export default SafeScreen


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral900
  }
})