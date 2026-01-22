// Web stub for notifications
export async function registerForPushNotifications(
  usn: string
): Promise<string | null> {
  console.log("Push notifications not supported on web stub");
  return null;
}

export function addNotificationListeners(
  onNotificationReceived?: (notification: any) => void,
  onNotificationResponse?: (response: any) => void
) {
  return () => { };
}

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
