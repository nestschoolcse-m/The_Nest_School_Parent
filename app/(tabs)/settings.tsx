import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out of the portal?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View className="px-6 pt-6 pb-6">
        <Text className="text-brand-400 text-xs font-bold uppercase tracking-[2px] mb-1">Preferences</Text>
        <Text className="text-brand-900 text-3xl font-bold tracking-tight">Settings</Text>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-6">
          {/* Account Section */}
          <View className="bg-white rounded-3xl border border-brand-100 overflow-hidden mb-6">
            <View className="px-5 py-3 bg-brand-50/50 border-b border-brand-100">
              <Text className="text-brand-400 font-bold text-[10px] uppercase tracking-wider">
                Parent Account
              </Text>
            </View>
            <View className="px-5 py-5 flex-row items-center">
              <View className="w-14 h-14 bg-brand-900 rounded-2xl items-center justify-center mr-4 shadow-sm">
                <Ionicons name="person" size={28} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-brand-900 font-bold text-xl tracking-tight">
                  {user?.usn}
                </Text>
                <Text className="text-brand-400 text-xs font-medium">Secured Portal Access</Text>
              </View>
            </View>
          </View>

          {/* Options Section */}
          <View className="bg-white rounded-3xl border border-brand-100 overflow-hidden mb-6">
            <View className="px-5 py-3 bg-brand-50/50 border-b border-brand-100">
              <Text className="text-brand-400 font-bold text-[10px] uppercase tracking-wider">
                Application
              </Text>
            </View>
            <SettingsRow
              icon="notifications-outline"
              label="Push Notifications"
              value="Active"
            />
            <SettingsRow
              icon="shield-checkmark-outline"
              label="Security Status"
              value="Protected"
            />
            <SettingsRow
              icon="information-circle-outline"
              label="Version"
              value="1.0.0"
              isLast
            />
          </View>

          {/* Actions */}
          <View className="gap-3">
            <TouchableOpacity
              onPress={async () => {
                try {
                  const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
                  const { dataDb } = await import("@/lib/firebase");
                  
                  await addDoc(collection(dataDb, "attendance_logs"), {
                    usn: user?.usn,
                    type: "ENTRY",
                    timestamp: serverTimestamp(),
                  });
                  
                  Alert.alert(
                    "Debug Trigger",
                    "A test activity log was successfully dispatched. Notification arriving shortly."
                  );
                } catch (err) {
                  console.error(err);
                  Alert.alert("Error", "Authentication or network error.");
                }
              }}
              className="bg-brand-50/50 rounded-2xl px-5 py-4 flex-row items-center border border-brand-100"
              activeOpacity={0.7}
            >
              <View className="w-10 h-10 bg-white rounded-xl items-center justify-center mr-4 border border-brand-100">
                <Ionicons name="flash-outline" size={20} color="#0f172a" />
              </View>
              <Text className="text-brand-900 font-bold text-base flex-1">
                Test System Notification
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogout}
              className="bg-white rounded-2xl px-5 py-4 flex-row items-center border border-red-50"
              activeOpacity={0.7}
            >
              <View className="w-10 h-10 bg-red-50 rounded-xl items-center justify-center mr-4">
                <Ionicons name="log-out-outline" size={20} color="#991b1b" />
              </View>
              <Text className="text-red-800 font-bold text-base flex-1">
                Sign Out
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#fee2e2" />
            </TouchableOpacity>

            {/* Developers Section - Minimalist Redesign */}
            <View className="mt-12 mb-8 px-2">
              <View className="mb-6 items-center">
                <Text className="text-brand-400 text-[10px] font-bold uppercase tracking-[3px] text-center">
                  Developed By:
                </Text>
                <Text className="text-brand-400 text-[10px] font-bold uppercase tracking-[3px] text-center">
                  CSE-III (2023-2027)
                </Text>
              </View>

              <View className="items-center gap-y-3">
                <TeamMember name="Lakshwin Krishna Reddy M" role="Lead Architect & Backend Engineer" />
                <TeamMember name="Dev Vikram Joshi" role="Cloud Architect" />
                <TeamMember name="Bharathwaj K" role="Frontend Engineer" />
                <TeamMember name="Pradosh Gopalakrishnan" role="Backend Engineer & Pentester" />
              </View>
            </View>
          </View>

          {/* Footer */}
          <View className="py-8">
            <Text className="text-brand-300 text-center text-[10px] font-bold uppercase tracking-widest">
              NEST ERP SECURITY FRAMEWORK
            </Text>
            <Text className="text-brand-200 text-center text-[9px] mt-1 tracking-tighter">
              PROPRIETARY SYSTEM • © 2026 THE NEST SCHOOL
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  isLast?: boolean;
}

function SettingsRow({ icon, label, value, isLast = false }: SettingsRowProps) {
  return (
    <View
      className={`px-5 py-4 flex-row items-center ${
        !isLast ? "border-b border-brand-50" : ""
      }`}
    >
      <View className="w-10 h-10 bg-brand-50/50 rounded-xl items-center justify-center mr-4">
        <Ionicons name={icon} size={18} color="#475569" />
      </View>
      <Text className="text-brand-900 font-semibold text-base flex-1 tracking-tight">{label}</Text>
      {value && <Text className="text-brand-400 font-bold text-xs uppercase tracking-tighter">{value}</Text>}
    </View>
  );
}

function TeamMember({ name, role }: { name: string; role: string }) {
  return (
    <View className="items-center">
      <Text className="text-brand-900 font-bold text-[15px] tracking-tight">{name}</Text>
      <Text className="text-brand-400 text-[10px] uppercase font-bold tracking-[2px] mt-1">{role}</Text>
    </View>
  );
}
