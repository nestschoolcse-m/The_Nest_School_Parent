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
    bg: "bg-entry/10",
    text: "text-entry",
  },
  exit: {
    bg: "bg-exit/10",
    text: "text-exit",
  },
  sports: {
    bg: "bg-brand-100",
    text: "text-brand-900",
  },
  default: {
    bg: "bg-brand-50",
    text: "text-brand-400",
  },
};

export function Badge({ text, variant = "default", className = "" }: BadgeProps) {
  const styles = variantStyles[variant];

  return (
    <View className={`px-2 py-0.5 rounded-md ${styles.bg} ${className}`}>
      <Text className={`text-[10px] font-bold uppercase tracking-wider ${styles.text}`}>{text}</Text>
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
