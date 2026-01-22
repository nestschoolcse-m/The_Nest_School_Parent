import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { useAuth } from "@/contexts/AuthContext";
import { useAttendance, AttendanceLog } from "@/hooks/useAttendance";
import { useWorkingDays } from "@/hooks/useWorkingDays";
import { AttendanceItem } from "@/components/AttendanceItem";
import { getStudentClass, getClassTimings, getAttendanceStatus } from "@/lib/studentUtils";

export default function AttendanceScreen() {
  const { user } = useAuth();
  const { logs, loading, error } = useAttendance(user?.usn || null, 1000);
  const { workingDays, loading: workingDaysLoading } = useWorkingDays(120); // Last 4 months
  const [refreshing, setRefreshing] = React.useState(false);

  // Helper to format date as YYYY-MM-DD
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(formatDate(today));

  // Constants for calculation
  const TERM_START_DATE = new Date(2025, 5, 1); // June 1st, 2025
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const markedDates = useMemo(() => {
    const marked: any = {};
    const wardEntryDates = new Set<string>();

    // 1. Map ward's logs
    logs.forEach((log) => {
      const dateStr = formatDate(new Date(log.timestamp));
      if (log.type === "ENTRY") {
        wardEntryDates.add(dateStr);
      }
    });

    // 2. Determine status for all days from start of term to today
    const iter = new Date(TERM_START_DATE.getTime());
    const end = new Date(today.getTime());
    
    // Safety break for very long terms
    let maxDays = 500; 
    while (iter <= end && maxDays-- > 0) {
      const dateStr = formatDate(iter);
      const isWorkingDay = workingDays.has(dateStr);
      const hasWardEntry = wardEntryDates.has(dateStr);

      if (hasWardEntry) {
        // Student was present
        const recordsForDay = logs.filter(l => formatDate(new Date(l.timestamp)) === dateStr);
        const entry = recordsForDay.find(l => l.type === "ENTRY");
        const exit = recordsForDay.find(l => l.type === "EXIT");

        if (entry && exit) {
          const studentInfo = getStudentClass(user?.usn || "");
          const timings = getClassTimings(studentInfo.type);
          const status = getAttendanceStatus("EXIT", exit.timestamp, timings, 15);
          const isHalfDay = status.status === "EARLY";
          
          marked[dateStr] = {
            marked: true,
            dotColor: isHalfDay ? "#eab308" : "#22c55e", // yellow / green
          };
        } else {
          // Present but maybe no exit recorded yet
          marked[dateStr] = {
            marked: true,
            dotColor: "#22c55e",
          };
        }
      } else if (isWorkingDay) {
        // School was open, but ward didn't have an entry -> LEAVE
        marked[dateStr] = {
          marked: true,
          dotColor: "#3b82f6", // blue-500
        };
      } else {
        // No entries from any students -> HOLIDAY
        // We only mark holidays for past days and skip today if no one arrived yet
        if (dateStr !== formatDate(today)) {
          marked[dateStr] = {
            marked: true,
            dotColor: "#94a3b8", // slate-400
          };
        }
      }
      iter.setDate(iter.getDate() + 1);
    }

    // Highlight selected date
    marked[selectedDate] = {
      ...(marked[selectedDate] || {}),
      selected: true,
      selectedColor: "#0f172a",
    };

    return marked;
  }, [logs, workingDays, selectedDate, user?.usn]);

  const selectedDayLogs = useMemo(() => {
    return logs
      .filter(log => formatDate(new Date(log.timestamp)) === selectedDate)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [logs, selectedDate]);

  // Helper to count working days (days where school was actually open)
  const getWorkingDaysCount = (start: Date, end: Date) => {
    let count = 0;
    let cur = new Date(start.getTime());
    while (cur <= end) {
      if (workingDays.has(formatDate(cur))) count++;
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

  const monthlyWorkingDays = getWorkingDaysCount(startOfMonth, today);
  const monthlyPresentDays = getPresentDays(logs, startOfMonth, today);
  const monthlyPercentage = monthlyWorkingDays > 0 
    ? Math.round((monthlyPresentDays / monthlyWorkingDays) * 100) 
    : 0;

  const termWorkingDays = getWorkingDaysCount(TERM_START_DATE, today);
  const termPresentDays = getPresentDays(logs, TERM_START_DATE, today);
  const termPercentage = termWorkingDays > 0 
    ? Math.round((termPresentDays / termWorkingDays) * 100) 
    : 0;

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Data will auto-refresh due to real-time listeners
    setTimeout(() => setRefreshing(false), 1000);
  }, []);


  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View className="px-6 pt-6 pb-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-brand-400 text-xs font-bold uppercase tracking-[2px] mb-1">Activity Log</Text>
            <Text className="text-brand-900 text-3xl font-bold tracking-tight">Attendance</Text>
          </View>
          {user?.usn && (
            <View className="bg-brand-900 px-3 py-1.5 rounded-2xl">
              <Text className="text-white text-[10px] font-bold uppercase tracking-wider text-center">
                {(() => {
                  const student = getStudentClass(user.usn);
                  if (student.type === "STD_1_10") return `Class ${student.standard}`;
                  return student.type.replace("_", " ");
                })()}
              </Text>
            </View>
          )}
        </View>
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
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#0f172a"]}
              tintColor="#0f172a"
            />
          }
        >
          {/* Calendar Section */}
          <View className="px-4 mb-6">
            <View className="bg-white rounded-3xl overflow-hidden border border-brand-100 shadow-sm">
              <Calendar
                theme={{
                  backgroundColor: '#ffffff',
                  calendarBackground: '#ffffff',
                  textSectionTitleColor: '#94a3b8',
                  selectedDayBackgroundColor: '#0f172a',
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: '#2563eb',
                  dayTextColor: '#1e293b',
                  textDisabledColor: '#cbd5e1',
                  dotColor: '#22c55e',
                  selectedDotColor: '#ffffff',
                  arrowColor: '#0f172a',
                  monthTextColor: '#0f172a',
                  indicatorColor: '#0f172a',
                  textDayFontWeight: '600',
                  textMonthFontWeight: 'bold',
                  textDayHeaderFontWeight: 'bold',
                  textDayFontSize: 14,
                  textMonthFontSize: 16,
                  textDayHeaderFontSize: 12,
                }}
                markedDates={markedDates}
                onDayPress={(day: { dateString: string; }) => setSelectedDate(day.dateString)}
                enableSwipeMonths={true}
              />
              {/* Calendar Legend */}
              <View className="flex-row items-center justify-around py-3 border-t border-brand-100 bg-brand-50/30">
                <LegendItem color="#22c55e" label="Present" />
                <LegendItem color="#eab308" label="Half Day" />
                <LegendItem color="#3b82f6" label="Leave" />
                <LegendItem color="#94a3b8" label="Holiday" />
              </View>
            </View>
          </View>

          {/* Selected Day Activity */}
          <View className="px-6 mb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-brand-900 text-lg font-bold">Activity Details</Text>
              <View className="bg-brand-50 px-3 py-1 rounded-full border border-brand-100">
                <Text className="text-brand-600 text-[10px] font-bold">
                  {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
            </View>

            {selectedDayLogs.length > 0 ? (
              selectedDayLogs.map((log) => (
                <AttendanceItem key={log.id} log={log} />
              ))
            ) : (
              <View className="bg-brand-50/50 rounded-2xl p-8 items-center justify-center border border-dashed border-brand-100">
                {(() => {
                  const isWorkingDay = workingDays.has(selectedDate);
                  const isFuture = new Date(selectedDate) > today;
                  
                  if (isFuture) {
                    return (
                      <>
                        <Ionicons name="calendar-outline" size={24} color="#94a3b8" />
                        <Text className="text-brand-400 text-xs font-medium mt-2">Upcoming Date</Text>
                      </>
                    );
                  }
                  
                  if (isWorkingDay) {
                    return (
                      <>
                        <View className="bg-blue-50 p-3 rounded-full mb-2">
                          <Ionicons name="person-remove-outline" size={24} color="#3b82f6" />
                        </View>
                        <Text className="text-blue-600 font-bold text-sm">On Leave</Text>
                        <Text className="text-brand-400 text-[10px] mt-1 text-center px-4">School was open but no entry was recorded for the ward</Text>
                      </>
                    );
                  } else {
                    return (
                      <>
                        <View className="bg-slate-100 p-3 rounded-full mb-2">
                          <Ionicons name="ice-cream-outline" size={24} color="#64748b" />
                        </View>
                        <Text className="text-slate-600 font-bold text-sm">School Holiday</Text>
                        <Text className="text-brand-400 text-[10px] mt-1 text-center px-4">No activity recorded for any student on this day</Text>
                      </>
                    );
                  }
                })()}
              </View>
            )}
          </View>
        </ScrollView>
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

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center">
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text className="text-brand-400 text-[10px] font-bold ml-1.5">{label}</Text>
    </View>
  );
}
