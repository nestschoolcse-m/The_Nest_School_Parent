import React from "react";
import { View, Text } from "react-native";

type BadgeVariant = "entry" | "exit" | "sports" | "default";

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  entry: {
    bg: "bg-entry-light",
    text: "text-entry-dark",
  },
  exit: {
    bg: "bg-exit-light",
    text: "text-exit-dark",
  },
  sports: {
    bg: "bg-sports-light",
    text: "text-sports-dark",
  },
  default: {
    bg: "bg-gray-200",
    text: "text-gray-700",
  },
};

export function Badge({ text, variant = "default", className = "" }: BadgeProps) {
  const styles = variantStyles[variant];

  return (
    <View className={`px-3 py-1 rounded-full ${styles.bg} ${className}`}>
      <Text className={`text-sm font-semibold ${styles.text}`}>{text}</Text>
    </View>
  );
}

// Helper to get variant from attendance type
export function getAttendanceVariant(
  type: string
): "entry" | "exit" | "sports" {
  switch (type.toUpperCase()) {
    case "ENTRY":
      return "entry";
    case "EXIT":
      return "exit";
    case "SPORTS":
      return "sports";
    default:
      return "entry";
  }
}
