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
    <View className="bg-white rounded-3xl shadow-lg overflow-hidden mx-4 mt-4">
      {/* Header with gradient */}
      <View className="bg-primary-600 px-6 py-6">
        <View className="flex-row items-center">
          {/* Avatar placeholder */}
          <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center mr-4">
            <Ionicons name="person" size={40} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">{student.name}</Text>
            <Text className="text-white/80 text-lg mt-1">USN: {student.usn}</Text>
            <View className="flex-row items-center mt-2">
              <View className="bg-white/20 px-3 py-1 rounded-full">
                <Text className="text-white font-semibold">
                  Grade {student.grade}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Latest Status */}
      {latestStatus && (
        <View className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons
                name={
                  latestStatus.type === "ENTRY"
                    ? "log-in"
                    : latestStatus.type === "EXIT"
                    ? "log-out"
                    : "fitness"
                }
                size={24}
                color={
                  latestStatus.type === "ENTRY"
                    ? "#22c55e"
                    : latestStatus.type === "EXIT"
                    ? "#ef4444"
                    : "#8b5cf6"
                }
              />
              <Text className="text-gray-600 ml-2">Latest Status</Text>
            </View>
            <Badge
              text={latestStatus.type}
              variant={getAttendanceVariant(latestStatus.type)}
            />
          </View>
          <Text className="text-gray-500 text-sm mt-1">
            {formatAttendanceTime(latestStatus.timestamp)}
          </Text>
        </View>
      )}

      {/* Student Details */}
      <View className="px-6 py-4">
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
          icon="call-outline"
          label="Father's Mobile"
          value={student.fatherMobile.toString()}
        />
        <InfoRow
          icon="person-outline"
          label="Mother's Name"
          value={student.motherName}
        />
        <InfoRow
          icon="call-outline"
          label="Mother's Mobile"
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
      className={`flex-row items-center py-3 ${
        !isLast ? "border-b border-gray-100" : ""
      }`}
    >
      <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center mr-3">
        <Ionicons name={icon} size={20} color="#2563eb" />
      </View>
      <View className="flex-1">
        <Text className="text-gray-500 text-sm">{label}</Text>
        <Text className="text-gray-900 font-medium text-base">{value}</Text>
      </View>
    </View>
  );
}
