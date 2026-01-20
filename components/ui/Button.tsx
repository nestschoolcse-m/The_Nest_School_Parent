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
  const baseStyles = "py-4 px-6 rounded-2xl flex-row justify-center items-center";

  const variantStyles = {
    primary: "bg-brand-900 active:bg-brand-950",
    secondary: "bg-brand-100 active:bg-brand-200",
    outline: "bg-transparent border border-brand-200 active:bg-brand-50",
  };

  const textStyles = {
    primary: "text-white font-bold text-base tracking-tight",
    secondary: "text-brand-900 font-semibold text-base",
    outline: "text-brand-900 font-semibold text-base",
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={`${baseStyles} ${variantStyles[variant]} ${
        isDisabled ? "opacity-40" : ""
      } ${className}`}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#ffffff" : "#0f172a"}
          size="small"
        />
      ) : (
        <Text className={textStyles[variant]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
