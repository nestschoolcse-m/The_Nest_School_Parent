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
  const { logs, loading, error } = useAttendance(user?.usn || null, 100);
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Data will auto-refresh due to real-time listeners
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const renderItem = ({ item }: { item: AttendanceLog }) => (
    <AttendanceItem log={item} />
  );

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
      <Text className="text-gray-400 text-lg mt-4">No attendance records</Text>
      <Text className="text-gray-400 text-sm mt-1">
        Records will appear here when available
      </Text>
    </View>
  );

  // Group logs by date
  const groupedLogs = React.useMemo(() => {
    const groups: { [key: string]: AttendanceLog[] } = {};
    logs.forEach((log) => {
      const dateKey = log.timestamp.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(log);
    });
    return groups;
  }, [logs]);

  const sections = Object.entries(groupedLogs);

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />

      {/* Header */}
      <View className="px-6 pt-4 pb-4">
        <Text className="text-gray-900 text-2xl font-bold">Attendance</Text>
        <Text className="text-gray-500 mt-1">
          {user?.usn} • {logs.length} records
        </Text>
      </View>

      {/* Stats Row */}
      <View className="flex-row px-4 mb-4">
        <StatCard
          icon="log-in"
          label="Entries"
          value={logs.filter((l) => l.type === "ENTRY").length}
          color="#22c55e"
        />
        <StatCard
          icon="log-out"
          label="Exits"
          value={logs.filter((l) => l.type === "EXIT").length}
          color="#ef4444"
        />
        <StatCard
          icon="fitness"
          label="Sports"
          value={logs.filter((l) => l.type === "SPORTS").length}
          color="#8b5cf6"
        />
      </View>

      {error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text className="text-red-500 text-center mt-4">{error}</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          ListEmptyComponent={!loading ? renderEmpty : null}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2563eb"]}
              tintColor="#2563eb"
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
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-3 mx-1 shadow-sm">
      <View className="flex-row items-center">
        <Ionicons name={icon} size={18} color={color} />
        <Text className="text-gray-500 text-sm ml-1">{label}</Text>
      </View>
      <Text className="text-gray-900 font-bold text-xl mt-1">{value}</Text>
    </View>
  );
}
