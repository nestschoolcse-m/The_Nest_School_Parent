import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { updateFcmToken } from "./auth";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Register for push notifications
export async function registerForPushNotifications(
  usn: string
): Promise<string | null> {
  let token: string | null = null;

  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not granted
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Push notification permission not granted");
    return null;
  }

  // Get Expo push token
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.error("EAS Project ID not found in app.json. Please run 'eas project:init' or set it manually.");
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    token = tokenData.data;

    // Save token to Firestore
    await updateFcmToken(usn, token);
  } catch (error) {
    console.error("Failed to get push token:", error);
  }

  // Android-specific channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("attendance", {
      name: "Attendance Notifications",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2563eb",
    });
  }

  return token;
}

// Add notification listeners
export function addNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (
    response: Notifications.NotificationResponse
  ) => void
) {
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log("Notification received:", notification);
      onNotificationReceived?.(notification);
    }
  );

  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification response:", response);
      onNotificationResponse?.(response);
    });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

// Format timestamp for display
export function formatAttendanceTime(timestamp: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  return timestamp.toLocaleString("en-IN", options);
}
