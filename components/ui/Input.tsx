import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  icon,
  isPassword = false,
  className = "",
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className={`mb-4 ${className}`}>
      <Text className="text-gray-700 font-medium mb-2 text-base">{label}</Text>
      <View
        className={`flex-row items-center bg-gray-100 rounded-xl px-4 border-2 ${
          error ? "border-red-400" : "border-transparent"
        }`}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color="#6b7280"
            style={{ marginRight: 10 }}
          />
        )}
        <TextInput
          className="flex-1 py-4 text-base text-gray-900"
          placeholderTextColor="#9ca3af"
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize={isPassword ? "none" : "characters"}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={22}
              color="#6b7280"
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text className="text-red-500 text-sm mt-1 ml-1">{error}</Text>
      )}
    </View>
  );
}
