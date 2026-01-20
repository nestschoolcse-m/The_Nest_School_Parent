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
    <View className={`mb-5 ${className}`}>
      <Text className="text-brand-700 font-semibold mb-1.5 text-sm tracking-tight">{label}</Text>
      <View
        className={`flex-row items-center bg-white rounded-2xl px-4 border ${
          error ? "border-red-500" : "border-brand-200"
        }`}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color="#94a3b8"
            style={{ marginRight: 12 }}
          />
        )}
        <TextInput
          className="flex-1 py-4 text-base text-brand-900 font-medium"
          placeholderTextColor="#cbd5e1"
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize={isPassword ? "none" : "characters"}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} activeOpacity={0.6}>
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-outline"}
              size={20}
              color="#94a3b8"
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text className="text-red-600 text-xs mt-1.5 ml-1 font-medium">{error}</Text>
      )}
    </View>
  );
}
