import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AttendanceLog } from "@/hooks/useAttendance";
import { Badge, getAttendanceVariant } from "./ui/Badge";
import { formatAttendanceTime } from "@/lib/notifications";
import { getStudentClass, getClassTimings, getAttendanceStatus } from "@/lib/studentUtils";

interface AttendanceItemProps {
  log: AttendanceLog;
}

export function AttendanceItem({ log }: AttendanceItemProps) {
  const statusInfo = useMemo(() => {
    const studentClass = getStudentClass(log.usn);
    const timings = getClassTimings(studentClass.type);
    return getAttendanceStatus(log.type, log.timestamp, timings, 15);
  }, [log]);

  const iconName =
    log.type === "ENTRY"
      ? "arrow-down-circle-outline"
      : log.type === "EXIT"
      ? "arrow-up-circle-outline"
      : "fitness-outline";

  const iconColor =
    log.type === "ENTRY"
      ? "#166534"
      : log.type === "EXIT"
      ? "#991b1b"
      : "#475569";

  const borderStyle =
    log.type === "ENTRY"
      ? "border-l-4 border-l-entry"
      : log.type === "EXIT"
      ? "border-l-4 border-l-exit"
      : "border-l-4 border-l-brand-400";

  return (
    <View className={`bg-white border border-brand-100 rounded-2xl px-4 py-4 mb-3 flex-row items-center ${borderStyle}`}>
      {/* Icon Area */}
      <View className="w-10 h-10 rounded-full bg-brand-50 items-center justify-center mr-4 border border-brand-50">
        <Ionicons name={iconName} size={20} color={iconColor} />
      </View>

      {/* Content Area */}
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Text className="text-brand-900 font-bold text-base tracking-tight mr-2">{log.type}</Text>
            {statusInfo.status !== "NONE" && (
              <View 
                className="px-2 py-0.5 rounded-full" 
                style={{ backgroundColor: `${statusInfo.color}15` }}
              >
                <Text 
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: statusInfo.color }}
                >
                  {statusInfo.label}
                </Text>
              </View>
            )}
          </View>
          <Text className="text-brand-400 text-[10px] font-bold uppercase tracking-wider">
            {log.timestamp.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </Text>
        </View>
        <View className="flex-row items-center mt-1">
          <Ionicons name="time-outline" size={12} color="#94a3b8" />
          <Text className="text-brand-500 text-xs font-medium ml-1">
            {log.timestamp.toLocaleTimeString("en-IN", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </Text>
        </View>
      </View>
    </View>
  );
}
