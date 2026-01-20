import React from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useAttendance, AttendanceLog } from "@/hooks/useAttendance";
import { AttendanceItem } from "@/components/AttendanceItem";

export default function AttendanceScreen() {
  const { user } = useAuth();
  const { logs, loading, error } = useAttendance(user?.usn || null, 1000);
  const [refreshing, setRefreshing] = React.useState(false);

  // Constants for calculation
  const TERM_START_DATE = new Date(2025, 5, 1); // June 1st, 2025
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Helper to count working days (Mon-Fri)
  const getWorkingDays = (start: Date, end: Date) => {
    let count = 0;
    let cur = new Date(start.getTime());
    while (cur <= end) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  };

  // Calculate unique days with entries
  const getPresentDays = (attendanceLogs: AttendanceLog[], start: Date, end: Date) => {
    const presentDates = new Set();
    attendanceLogs.forEach((log) => {
      if (log.type === "ENTRY" && log.timestamp >= start && log.timestamp <= end) {
        presentDates.add(log.timestamp.toDateString());
      }
    });
    return presentDates.size;
  };

  const monthlyWorkingDays = getWorkingDays(startOfMonth, today);
  const monthlyPresentDays = getPresentDays(logs, startOfMonth, today);
  const monthlyPercentage = monthlyWorkingDays > 0 
    ? Math.round((monthlyPresentDays / monthlyWorkingDays) * 100) 
    : 0;

  const termWorkingDays = getWorkingDays(TERM_START_DATE, today);
  const termPresentDays = getPresentDays(logs, TERM_START_DATE, today);
  const termPercentage = termWorkingDays > 0 
    ? Math.round((termPresentDays / termWorkingDays) * 100) 
    : 0;

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Data will auto-refresh due to real-time listeners
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const renderItem = ({ item }: { item: AttendanceLog }) => (
    <AttendanceItem log={item} />
  );

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center py-20 px-8">
      <View className="w-20 h-20 bg-brand-50 rounded-full items-center justify-center mb-6 border border-brand-100/50">
        <Ionicons name="calendar-outline" size={32} color="#94a3b8" />
      </View>
      <Text className="text-brand-900 font-bold text-lg text-center">No records found</Text>
      <Text className="text-brand-400 text-sm text-center mt-2">
        Attendance history will appear here once the student's activity is recorded.
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View className="px-6 pt-6 pb-4">
        <Text className="text-brand-400 text-xs font-bold uppercase tracking-[2px] mb-1">Activity Log</Text>
        <Text className="text-brand-900 text-3xl font-bold tracking-tight">Attendance</Text>
        <Text className="text-brand-400 text-xs font-medium mt-1">
          Tracking records for USN: {user?.usn}
        </Text>
      </View>

      {/* Percentage Row - New Professional Section */}
      <View className="px-4 mb-6">
        <View className="bg-brand-900 rounded-3xl p-6 flex-row items-center justify-between shadow-sm">
          <View className="flex-1">
            <Text className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-1">Monthly Attendance</Text>
            <Text className="text-white text-3xl font-bold tracking-tight">{monthlyPercentage}%</Text>
            <Text className="text-white/40 text-[10px] mt-1">{monthlyPresentDays} / {monthlyWorkingDays} days present</Text>
          </View>
          <View className="w-px h-10 bg-white/10 mx-6" />
          <View className="flex-1">
            <Text className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-1">Term Attendance</Text>
            <Text className="text-white text-3xl font-bold tracking-tight">{termPercentage}%</Text>
            <Text className="text-white/40 text-[10px] mt-1">{termPresentDays} / {termWorkingDays} total days</Text>
          </View>
        </View>
      </View>

      {/* Stats Row - Professional & Discrete */}
      <View className="flex-row px-4 mb-6">
        <StatCard
          icon="arrow-down-circle-outline"
          label="Entries"
          value={logs.filter((l) => l.type === "ENTRY").length}
          accent="#166534"
        />
        <StatCard
          icon="arrow-up-circle-outline"
          label="Exits"
          value={logs.filter((l) => l.type === "EXIT").length}
          accent="#991b1b"
        />
        <StatCard
          icon="fitness-outline"
          label="Sports"
          value={logs.filter((l) => l.type === "SPORTS").length}
          accent="#0f172a"
        />
      </View>

      {error ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-16 h-16 bg-red-50 rounded-full items-center justify-center mb-4">
            <Ionicons name="alert-circle-outline" size={32} color="#991b1b" />
          </View>
          <Text className="text-brand-900 font-bold text-lg text-center">{error}</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          ListEmptyComponent={!loading ? renderEmpty : null}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#0f172a"]}
              tintColor="#0f172a"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  accent: string;
}

function StatCard({ icon, label, value, accent }: StatCardProps) {
  return (
    <View className="flex-1 bg-brand-50/50 rounded-2xl p-4 mx-1 border border-brand-100">
      <View className="flex-row items-center mb-2">
        <Ionicons name={icon} size={14} color={accent} />
        <Text className="text-brand-400 text-[10px] font-bold uppercase tracking-wider ml-1.5">{label}</Text>
      </View>
      <Text className="text-brand-900 font-bold text-xl tracking-tight">{value}</Text>
    </View>
  );
}
