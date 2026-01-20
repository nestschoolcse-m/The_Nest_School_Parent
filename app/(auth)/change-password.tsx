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
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-8 justify-center py-12">
            {/* Security Header */}
            <View className="items-center mb-10">
              <View className="w-16 h-16 bg-brand-50 rounded-2xl items-center justify-center mb-6 border border-brand-100/50">
                <Ionicons name="shield-checkmark-outline" size={32} color="#0f172a" />
              </View>
              <Text className="text-brand-900 text-2xl font-bold tracking-tight">
                Update Security
              </Text>
              <Text className="text-brand-400 text-sm text-center mt-2 px-6">
                Please set a secure password for account <Text className="font-bold text-brand-900">{user?.usn}</Text> to continue.
              </Text>
            </View>

            {/* Form Container */}
            <View className="w-full max-w-sm self-center">
              {error ? (
                <View className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-6 flex-row items-center">
                  <Ionicons name="alert-circle-outline" size={20} color="#991b1b" />
                  <Text className="text-red-800 ml-3 text-xs font-semibold flex-1">{error}</Text>
                </View>
              ) : null}

              <Input
                label="New Password"
                placeholder="6+ characters required"
                value={newPassword}
                onChangeText={setNewPassword}
                icon="lock-closed-outline"
                isPassword
              />

              <Input
                label="Confirm Security Code"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                icon="shield-outline"
                isPassword
              />

              <Button
                title="Update Credentials"
                onPress={handleChangePassword}
                loading={loading}
                className="mt-6"
              />
              
              <View className="mt-8 items-center">
                <Text className="text-brand-300 text-[10px] font-bold uppercase tracking-widest">
                  Encryption Active
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
