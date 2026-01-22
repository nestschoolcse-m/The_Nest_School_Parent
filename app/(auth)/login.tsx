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
            {/* Logo Section */}
            <View className="items-center mb-12">
              <Image
                source={require("@/assets/thenestschoollogo.png")}
                style={{ width: 220, height: 80 }}
                resizeMode="contain"
              />
              <View className="h-px w-12 bg-brand-100 mt-6" />
              <Text className="text-brand-400 text-xs font-bold uppercase tracking-[3px] mt-6 text-center">
                Parent Portal
              </Text>
            </View>

            {/* Login Form */}
            <View className="w-full max-w-sm self-center">
              <Text className="text-brand-900 text-2xl font-bold tracking-tight mb-2 text-center">
                Welcome Back
              </Text>
              <Text className="text-brand-500 text-sm text-center mb-8">
                Please enter your credentials to continue
              </Text>

              {error ? (
                <View className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-6 flex-row items-center">
                  <Ionicons name="alert-circle-outline" size={20} color="#991b1b" />
                  <Text className="text-red-800 ml-3 text-xs font-semibold flex-1">{error}</Text>
                </View>
              ) : null}

              <Input
                label="Student USN"
                placeholder="Enter USN (e.g., NG823004_L01)"
                value={usn}
                onChangeText={(text) => setUsn(text.toUpperCase())}
                icon="card-outline"
                autoCapitalize="characters"
              />

              <Input
                label="Password"
                placeholder="Enter password"
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

              <View className="mt-10 items-center">
                <Text className="text-brand-300 text-[10px] font-bold uppercase tracking-widest">
                  Authentication Secured
                </Text>
                <Text className="text-brand-400 text-[10px] mt-1">
                  Default: parent@123
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
