import React, { useState } from "react";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/theme";

const CustomInput = ({
  value,
  onChangeText,
  placeholder,
  style,
  icon,
  secureTextEntry = false,
  ...rest
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {icon && <Ionicons name={icon} size={20} color={Colors.textSecondary} style={styles.leftIcon} />}

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textSecondary}
        secureTextEntry={secureTextEntry && !isPasswordVisible}
        {...rest}
      />

      {secureTextEntry && (
        <TouchableOpacity
          onPress={() => setIsPasswordVisible((prev) => !prev)}
          style={styles.rightIcon}
        >
          <Ionicons
            name={isPasswordVisible ? "eye-off" : "eye"}
            size={20}
            color={Colors.textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default CustomInput;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E3F5",
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 4,
    gap: 10,
    backgroundColor: "white",
  },
  leftIcon: {
    marginRight: 5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: 12,
  },
  rightIcon: {
    marginLeft: 8,
  },
});
