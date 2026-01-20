import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Student } from "@/hooks/useStudent";
import { AttendanceLog } from "@/hooks/useAttendance";
import { Badge, getAttendanceVariant } from "./ui/Badge";
import { formatAttendanceTime } from "@/lib/notifications";

interface StudentCardProps {
  student: Student;
  latestStatus?: AttendanceLog | null;
}

export function StudentCard({ student, latestStatus }: StudentCardProps) {
  return (
    <View className="bg-white rounded-3xl border border-brand-100 overflow-hidden mx-4 mt-6">
      {/* Header - Clean & Minimal */}
      <View className="px-6 py-8 border-b border-brand-50">
        <View className="flex-row items-center">
          <View className="w-16 h-16 rounded-2xl bg-brand-50 items-center justify-center mr-5 border border-brand-100">
            <Ionicons name="person" size={32} color="#0f172a" />
          </View>
          <View className="flex-1">
            <Text className="text-brand-950 text-2xl font-bold tracking-tight">{student.name}</Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-brand-500 text-sm font-medium uppercase tracking-wider">USN: {student.usn}</Text>
              <View className="mx-2 w-1 h-1 rounded-full bg-brand-200" />
              <Text className="text-brand-500 text-sm font-medium uppercase tracking-wider">Grade {student.grade}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Latest Status - Professional Info Block */}
      {latestStatus && (
        <View className="px-6 py-4 bg-brand-50/30 border-b border-brand-50">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-white items-center justify-center mr-3 border border-brand-100/50">
                <Ionicons
                  name={
                    latestStatus.type === "ENTRY"
                      ? "arrow-down-circle"
                      : latestStatus.type === "EXIT"
                      ? "arrow-up-circle"
                      : "fitness-outline"
                  }
                  size={20}
                  color={
                    latestStatus.type === "ENTRY"
                      ? "#166534"
                      : latestStatus.type === "EXIT"
                      ? "#991b1b"
                      : "#0f172a"
                  }
                />
              </View>
              <View>
                <Text className="text-brand-400 text-[10px] font-bold uppercase tracking-[1px]">Latest Activity</Text>
                <Text className="text-brand-900 font-bold text-sm">
                  {latestStatus.type}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-brand-500 text-xs font-medium">
                {formatAttendanceTime(latestStatus.timestamp)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Student Details - Structured Layout */}
      <View className="px-6 py-4 bg-white">
        <InfoRow
          icon="calendar-outline"
          label="Date of Birth"
          value={student.dob}
        />
        <InfoRow
          icon="person-outline"
          label="Father's Name"
          value={student.fatherName}
        />
        <InfoRow
          icon="person-outline"
          label="Mother's Name"
          value={student.motherName}
          isLast
        />
        <InfoRow
          icon="call-outline"
          label="Father's Contact Number"
          value={student.fatherMobile.toString()}
        />
        <InfoRow
          icon="call-outline"
          label="Mother's Contact Number"
          value={student.motherMobile.toString()}
          isLast
        />
        
      </View>
    </View>
  );
}

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  isLast?: boolean;
}

function InfoRow({ icon, label, value, isLast = false }: InfoRowProps) {
  return (
    <View
      className={`flex-row items-center py-4 ${
        !isLast ? "border-b border-brand-50" : ""
      }`}
    >
      <View className="w-10 h-10 rounded-xl bg-brand-50/50 items-center justify-center mr-4 border border-brand-50">
        <Ionicons name={icon} size={18} color="#475569" />
      </View>
      <View className="flex-1">
        <Text className="text-brand-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">{label}</Text>
        <Text className="text-brand-900 font-semibold text-base">{value}</Text>
      </View>
    </View>
  );
}
