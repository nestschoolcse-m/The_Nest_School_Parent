import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  className = "",
}: ButtonProps) {
  const baseStyles = "py-4 px-6 rounded-xl flex-row justify-center items-center";

  const variantStyles = {
    primary: "bg-primary-600 active:bg-primary-700",
    secondary: "bg-gray-200 active:bg-gray-300",
    outline: "bg-transparent border-2 border-primary-600",
  };

  const textStyles = {
    primary: "text-white font-semibold text-lg",
    secondary: "text-gray-800 font-semibold text-lg",
    outline: "text-primary-600 font-semibold text-lg",
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={`${baseStyles} ${variantStyles[variant]} ${
        isDisabled ? "opacity-50" : ""
      } ${className}`}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#ffffff" : "#2563eb"}
          size="small"
        />
      ) : (
        <Text className={textStyles[variant]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
