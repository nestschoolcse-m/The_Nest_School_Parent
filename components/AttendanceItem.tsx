import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AttendanceLog } from "@/hooks/useAttendance";
import { Badge, getAttendanceVariant } from "./ui/Badge";
import { formatAttendanceTime } from "@/lib/notifications";

interface AttendanceItemProps {
  log: AttendanceLog;
}

export function AttendanceItem({ log }: AttendanceItemProps) {
  const iconName =
    log.type === "ENTRY"
      ? "log-in"
      : log.type === "EXIT"
      ? "log-out"
      : "fitness";

  const iconColor =
    log.type === "ENTRY"
      ? "#22c55e"
      : log.type === "EXIT"
      ? "#ef4444"
      : "#8b5cf6";

  const bgColor =
    log.type === "ENTRY"
      ? "bg-entry-light"
      : log.type === "EXIT"
      ? "bg-exit-light"
      : "bg-sports-light";

  return (
    <View className="bg-white rounded-2xl px-4 py-4 mb-3 flex-row items-center shadow-sm">
      {/* Icon */}
      <View
        className={`w-12 h-12 rounded-xl ${bgColor} items-center justify-center mr-4`}
      >
        <Ionicons name={iconName} size={24} color={iconColor} />
      </View>

      {/* Details */}
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Badge text={log.type} variant={getAttendanceVariant(log.type)} />
          <Text className="text-gray-400 text-sm">
            {log.timestamp.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </Text>
        </View>
        <Text className="text-gray-600 mt-1">
          {log.timestamp.toLocaleTimeString("en-IN", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}
        </Text>
      </View>
    </View>
  );
}
