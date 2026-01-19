import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useStudent } from "@/hooks/useStudent";
import { useAttendance } from "@/hooks/useAttendance";
import { StudentCard } from "@/components/StudentCard";
import {
  addNotificationListeners,
  registerForPushNotifications,
} from "@/lib/notifications";

export default function HomeScreen() {
  const { user } = useAuth();
  const { student, loading: studentLoading, error: studentError } = useStudent(
    user?.usn || null
  );
  const { latestStatus, loading: attendanceLoading } = useAttendance(
    user?.usn || null,
    1
  );
  const [refreshing, setRefreshing] = React.useState(false);

  // Setup notification listeners
  useEffect(() => {
    if (user?.usn) {
      const unsubscribe = addNotificationListeners(
        (notification) => {
          console.log("Received notification:", notification);
        },
        (response) => {
          console.log("Notification tapped:", response);
        }
      );

      // Register for push notifications
      registerForPushNotifications(user.usn);

      return () => unsubscribe();
    }
  }, [user?.usn]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Data will auto-refresh due to real-time listeners
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const isLoading = studentLoading || attendanceLoading;

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />

      {/* Header */}
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-gray-500 text-base">Welcome back,</Text>
            <Text className="text-gray-900 text-2xl font-bold">Parent</Text>
          </View>
          <View className="w-12 h-12 bg-primary-100 rounded-full items-center justify-center">
            <Ionicons name="notifications-outline" size={24} color="#2563eb" />
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2563eb"]}
            tintColor="#2563eb"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading && !student ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-gray-500">Loading student data...</Text>
          </View>
        ) : studentError ? (
          <View className="flex-1 items-center justify-center py-20 px-6">
            <Ionicons name="alert-circle" size={48} color="#ef4444" />
            <Text className="text-red-500 text-center mt-4">{studentError}</Text>
          </View>
        ) : student ? (
          <>
            <StudentCard student={student} latestStatus={latestStatus} />

            {/* Quick Actions */}
            <View className="px-4 mt-6 mb-6">
              <Text className="text-gray-900 text-lg font-semibold mb-3 px-2">
                Quick Info
              </Text>
              <View className="flex-row gap-3">
                <QuickCard
                  icon="school"
                  label="Grade"
                  value={student.grade}
                  color="#2563eb"
                />
                <QuickCard
                  icon="finger-print"
                  label="USN"
                  value={student.usn}
                  color="#8b5cf6"
                />
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

interface QuickCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}

function QuickCard({ icon, label, value, color }: QuickCardProps) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mb-2"
        style={{ backgroundColor: color + "20" }}
      >
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text className="text-gray-500 text-sm">{label}</Text>
      <Text className="text-gray-900 font-semibold text-lg">{value}</Text>
    </View>
  );
}
