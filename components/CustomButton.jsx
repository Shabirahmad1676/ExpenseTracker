import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Colors } from "../constants/theme";

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
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  solid: {
    backgroundColor: Colors.primary,
  },
  outline: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: "transparent",
  },
  text: {
    fontWeight: "700",
    fontSize: 16,
  },
  solidText: {
    color: "#fff",
  },
  outlineText: {
    color: Colors.primary,
  },
});
