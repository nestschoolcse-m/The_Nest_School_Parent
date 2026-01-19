import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ChangePasswordScreen() {
  const { changePassword, user } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChangePassword = async () => {
    if (!newPassword) {
      setError("Please enter a new password");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword === "parent@123") {
      setError("Please choose a different password");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await changePassword(newPassword);

      if (result.success) {
        router.replace("/(tabs)");
      } else {
        setError(result.error || "Failed to change password");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 justify-center">
            {/* Header */}
            <View className="items-center mb-8">
              <View className="w-20 h-20 bg-yellow-500 rounded-full items-center justify-center mb-4">
                <Ionicons name="key" size={40} color="white" />
              </View>
              <Text className="text-2xl font-bold text-gray-900">
                Change Password
              </Text>
              <Text className="text-gray-500 text-center mt-2 px-4">
                Please set a new password for your account. You're logged in as{" "}
                <Text className="font-semibold">{user?.usn}</Text>
              </Text>
            </View>

            {/* Form */}
            <View className="bg-white rounded-3xl p-6 shadow-lg">
              {error ? (
                <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 flex-row items-center">
                  <Ionicons name="alert-circle" size={20} color="#ef4444" />
                  <Text className="text-red-600 ml-2 flex-1">{error}</Text>
                </View>
              ) : null}

              <Input
                label="New Password"
                placeholder="Enter new password"
                value={newPassword}
                onChangeText={setNewPassword}
                icon="lock-closed-outline"
                isPassword
              />

              <Input
                label="Confirm Password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                icon="lock-closed-outline"
                isPassword
              />

              <Button
                title="Update Password"
                onPress={handleChangePassword}
                loading={loading}
                className="mt-4"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
