import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // comes with Expo

const CustomInput = ({
  value,
  onChangeText,
  placeholder,
  style,
  icon, // optional left icon (string name from Ionicons)
  secureTextEntry = false,
  ...rest
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {/* Left Icon */}
      {icon && <Ionicons name={icon} size={20} color="#888" style={styles.leftIcon} />}

      {/* Input Field */}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#888"
        secureTextEntry={secureTextEntry && !isPasswordVisible}
        {...rest}
      />

      {/* Password Toggle (only if it's password) */}
      {secureTextEntry && (
        <TouchableOpacity
          onPress={() => setIsPasswordVisible((prev) => !prev)}
          style={styles.rightIcon}
        >
          <Ionicons
            name={isPasswordVisible ? "eye-off" : "eye"}
            size={20}
            color="#888"
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
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical:8,
    gap:8,
    backgroundColor: "#222", // good for dark theme
  },
  leftIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#fff",
    paddingVertical: 10,
  },
  rightIcon: {
    marginLeft: 8,
  },
});
