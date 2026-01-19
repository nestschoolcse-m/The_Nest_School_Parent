import { Redirect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user.isFirstLogin) {
    return <Redirect href="/(auth)/change-password" />;
  }

  return <Redirect href="/(tabs)" />;
}
