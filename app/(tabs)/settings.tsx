import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />

      {/* Header */}
      <View className="px-6 pt-4 pb-4">
        <Text className="text-gray-900 text-2xl font-bold">Settings</Text>
      </View>

      <View className="flex-1 px-4">
        {/* Account Section */}
        <View className="bg-white rounded-2xl overflow-hidden shadow-sm mb-4">
          <View className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <Text className="text-gray-500 font-medium text-sm uppercase">
              Account
            </Text>
          </View>
          <View className="px-4 py-4 flex-row items-center">
            <View className="w-14 h-14 bg-primary-100 rounded-full items-center justify-center mr-4">
              <Ionicons name="person" size={28} color="#2563eb" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-semibold text-lg">
                {user?.usn}
              </Text>
              <Text className="text-gray-500">Parent Account</Text>
            </View>
          </View>
        </View>

        {/* Options Section */}
        <View className="bg-white rounded-2xl overflow-hidden shadow-sm mb-4">
          <View className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <Text className="text-gray-500 font-medium text-sm uppercase">
              Options
            </Text>
          </View>
          <SettingsRow
            icon="notifications-outline"
            label="Notifications"
            value="Enabled"
          />
          <SettingsRow
            icon="information-circle-outline"
            label="App Version"
            value="1.0.0"
            isLast
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-white rounded-2xl px-4 py-4 flex-row items-center shadow-sm"
          activeOpacity={0.7}
        >
          <View className="w-10 h-10 bg-red-100 rounded-xl items-center justify-center mr-3">
            <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          </View>
          <Text className="text-red-500 font-semibold text-base flex-1">
            Logout
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View className="px-6 py-4">
        <Text className="text-gray-400 text-center text-sm">
          NEST ERP Parent App
        </Text>
        <Text className="text-gray-300 text-center text-xs mt-1">
          © 2026 All rights reserved
        </Text>
      </View>
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
      className={`px-4 py-3 flex-row items-center ${
        !isLast ? "border-b border-gray-100" : ""
      }`}
    >
      <View className="w-10 h-10 bg-gray-100 rounded-xl items-center justify-center mr-3">
        <Ionicons name={icon} size={20} color="#6b7280" />
      </View>
      <Text className="text-gray-900 flex-1">{label}</Text>
      {value && <Text className="text-gray-400">{value}</Text>}
    </View>
  );
}
