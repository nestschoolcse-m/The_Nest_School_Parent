import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginScreen() {
  const { login } = useAuth();
  const [usn, setUsn] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!usn.trim()) {
      setError("Please enter your USN");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await login(usn.trim(), password);

      if (result.success) {
        if (result.isFirstLogin) {
          router.replace("/(auth)/change-password");
        } else {
          router.replace("/(tabs)");
        }
      } else {
        setError(result.error || "Login failed");
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
            {/* Logo/Header */}
            <View className="items-center mb-10">
              <View className="w-24 h-24 bg-primary-600 rounded-3xl items-center justify-center mb-4 shadow-lg">
                <Ionicons name="school" size={48} color="white" />
              </View>
              <Text className="text-3xl font-bold text-gray-900">
                NEST ERP
              </Text>
              <Text className="text-gray-500 text-lg mt-1">Parent Portal</Text>
            </View>

            {/* Login Form */}
            <View className="bg-white rounded-3xl p-6 shadow-lg">
              <Text className="text-2xl font-bold text-gray-900 mb-6">
                Welcome Back
              </Text>

              {error ? (
                <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 flex-row items-center">
                  <Ionicons name="alert-circle" size={20} color="#ef4444" />
                  <Text className="text-red-600 ml-2 flex-1">{error}</Text>
                </View>
              ) : null}

              <Input
                label="Student USN"
                placeholder="e.g., NG823004"
                value={usn}
                onChangeText={(text) => setUsn(text.toUpperCase())}
                icon="card-outline"
                autoCapitalize="characters"
              />

              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                icon="lock-closed-outline"
                isPassword
              />

              <Button
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                className="mt-4"
              />

              <Text className="text-gray-400 text-center mt-6 text-sm">
                Default password: parent@123
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
