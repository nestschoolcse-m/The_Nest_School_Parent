import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Image,
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
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View className="px-6 pt-6 pb-4">
        <View className="flex-row items-center justify-between mb-8">
          <Image
            source={require("@/assets/thenestschoollogo.png")}
            style={{ width: 140, height: 48 }}
            resizeMode="contain"
          />
          <View className="w-10 h-10 border border-brand-100 rounded-2xl items-center justify-center">
            <Ionicons name="notifications-outline" size={20} color="#0f172a" />
          </View>
        </View>
        
        <View>
          
          <Text className="text-blue-900 text-2xl font-semibold mb-2">
            Welcome,
          </Text>
          <Text className="text-brand-900 text-2xl font-bold tracking-tight">
            {student?.fatherName ? `Mr. ${student.fatherName}` : "Parent"}
          </Text>W
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0f172a"]}
            tintColor="#0f172a"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading && !student ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-brand-400 font-medium">Loading student data...</Text>
          </View>
        ) : studentError ? (
          <View className="flex-1 items-center justify-center py-20 px-6">
            <View className="w-16 h-16 bg-red-50 rounded-full items-center justify-center mb-4">
              <Ionicons name="alert-circle-outline" size={32} color="#991b1b" />
            </View>
            <Text className="text-brand-900 font-bold text-lg text-center">{studentError}</Text>
            <Text className="text-brand-400 text-center mt-2 px-8">There was an issue fetching the latest information.</Text>
          </View>
        ) : student ? (
          <>
            <StudentCard student={student} latestStatus={latestStatus} />

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
}

function QuickCard({ icon, label, value }: QuickCardProps) {
  return (
    <View className="flex-1 bg-brand-50/50 rounded-3xl p-5 border border-brand-100">
      <View className="w-10 h-10 rounded-xl bg-white items-center justify-center mb-4 shadow-sm">
        <Ionicons name={icon} size={20} color="#0f172a" />
      </View>
      <Text className="text-brand-400 text-[10px] font-bold uppercase tracking-wider mb-1">{label}</Text>
      <Text className="text-brand-900 font-bold text-lg tracking-tight">{value}</Text>
    </View>
  );
}
