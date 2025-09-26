import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { colors } from "../constants/theme";



const CustomButton = ({ title, onPress, style, textStyle, variant = "solid" }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.base,
        variant === "solid" ? styles.solid : styles.outline,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          variant === "outline" ? styles.outlineText : styles.solidText,
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default CustomButton;

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  solid: {
    backgroundColor: colors.primary, // replace with your colors.primary
  },
  outline: {
    borderWidth: 1,
    borderColor: "#888",
    backgroundColor: "transparent",
  },
  text: {
    fontWeight: "600",
  },
  solidText: {
    color: "#000",
  },
  outlineText: {
    color: "#fff",
  },
});
