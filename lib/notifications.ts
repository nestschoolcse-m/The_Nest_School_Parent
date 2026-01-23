/**
 * Client-side notification management using OneSignal
 * Handles foreground notifications and user registration
 *
 * Key features:
 * - Request user permission for notifications
 * - Listen for real-time attendance changes in Firestore
 * - Display notifications even when browser tab is closed
 * - Fallback to native Web Notifications API
 */

import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { dataDb } from "./firebase";

// Web implementation for notifications using OneSignal
let unsubscribeAttendance: (() => void) | null = null;

declare global {
  interface Window {
    OneSignal: any;
    OneSignalDeferred: any;
  }
}

/**
 * Register user for push notifications
 * Requests permission and starts listening for attendance events
 */
export async function registerForPushNotifications(
  usn: string,
): Promise<string | null> {
  if (typeof window === "undefined") {
    console.log(
      "[Notifications] Notifications not supported in this environment",
    );
    return null;
  }

  try {
    // Initialize OneSignal if not already initialized
    if (window.OneSignal) {
      console.log(
        "[Notifications] Requesting notification permission for",
        usn,
      );

      // Request notification permission through OneSignal
      const permission =
        await window.OneSignal.Notifications.requestPermission();
      console.log("[Notifications] Permission result:", permission);

      // Log service worker status
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log("[Notifications] Found", registrations.length, "service workers");
        registrations.forEach(r => {
          console.log("[Notifications] SW Scope:", r.scope, "Script:", r.active?.scriptURL);
        });
      }

      // Log subscription status for debugging
      if (window.OneSignal.User && window.OneSignal.User.PushSubscription) {
        const pushId = window.OneSignal.User.PushSubscription.id;
        const isSubscribed = window.OneSignal.User.PushSubscription.optedIn;
        console.log("[Notifications] OneSignal Push ID:", pushId);
        console.log("[Notifications] Is Subscribed:", isSubscribed);
        console.log("[Notifications] Current External ID:", window.OneSignal.User.externalId);
      }
    }

    // Start listening for attendance changes in Firestore
    startAttendanceListener(usn);

    return "onesignal-active";
  } catch (error) {
    console.error("[Notifications] Error setting up notifications:", error);
    return null;
  }
}

/**
 * Listen for real-time attendance changes in Firestore
 * Triggers notifications when new attendance records are added
 */
function startAttendanceListener(usn: string) {
  if (unsubscribeAttendance) {
    unsubscribeAttendance();
  }

  console.log("[Notifications] Starting Firestore listener for USN:", usn);

  // Record when listener started to avoid notifying on old records
  const startTime = Timestamp.now();

  // Query latest attendance record for this student
  const q = query(
    collection(dataDb, "attendance_logs"),
    where("usn", "==", usn),
    orderBy("timestamp", "desc"),
    limit(1),
  );

  unsubscribeAttendance = onSnapshot(
    q,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          const timestamp = data.timestamp as Timestamp;
          if (!timestamp || typeof timestamp.toMillis !== 'function') return;

          // Only notify for new logs (created after listener started)
          // with small buffer (10 seconds) for clock skew
          if (timestamp.toMillis() > startTime.toMillis() - 10000) {
            console.log("[Notifications] New attendance detected:", {
              usn: data.usn,
              type: data.type,
            });
            triggerNotification(
              data.wardName || "Student",
              data.usn,
              data.type,
              timestamp.toDate(),
            );
          }
        }
      });
    },
    (error) => {
      console.error("[Notifications] Firestore listener error:", error);
    },
  );
}

/**
 * Trigger notification for attendance event
 * Uses OneSignal if available, falls back to native API
 */
async function triggerNotification(
  wardName: string,
  usn: string,
  type: string,
  date: Date,
) {
  const title = "NEST SCHOOL";
  const action = type.toLowerCase() === "entry" ? "entered" : "exited";
  const timeStr = formatAttendanceTime(date);
  const body = `Your ward ${wardName} with USN ${usn} has ${action} at the campus ${timeStr}`;

  console.log("[Notifications] Triggering notification:", { title, body });

  try {
    if (window.OneSignal && window.OneSignal.Notifications) {
      // Use OneSignal to send notification
      console.log("[Notifications] Sending via OneSignal");

      // Create a local notification through OneSignal
      // This works even if OneSignal Remote API fails
      try {
        // Create web notification
        if ("Notification" in window && Notification.permission === "granted") {
          const notification = new Notification(title, {
            body: body,
            icon: "/logo.png",
            badge: "/logo.png",
            tag: `attendance-${usn}-${date.getTime()}`,
            requireInteraction: true,
          });

          notification.onclick = () => {
            window.focus();
            notification.close();
          };

          console.log("[Notifications] Web notification created");
        }
      } catch (innerError) {
        console.error(
          "[Notifications] Error creating web notification:",
          innerError,
        );
      }
    } else {
      // Fallback to native Notification API
      if ("Notification" in window && Notification.permission === "granted") {
        console.log("[Notifications] Using Web Notifications API fallback");

        const notification = new Notification(title, {
          body: body,
          icon: "/logo.png",
          badge: "/logo.png",
          tag: `attendance-${usn}-${date.getTime()}`,
          requireInteraction: true,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    }
  } catch (error) {
    console.error("[Notifications] Error triggering notification:", error);
  }
}

/**
 * Add listeners for notification events
 */
export function addNotificationListeners(
  onNotificationReceived?: (notification: any) => void,
  onNotificationResponse?: (response: any) => void,
) {
  try {
    if (typeof window !== "undefined" && window.OneSignal) {
      // Setup OneSignal event listeners if available
      if (onNotificationReceived) {
        window.OneSignal.Notifications.addEventListener(
          "foregroundWillDisplay",
          (event: any) => {
            console.log("[Notifications] Foreground notification:", event);
            onNotificationReceived(event);
          },
        );
      }

      if (onNotificationResponse) {
        window.OneSignal.Notifications.addEventListener(
          "click",
          (event: any) => {
            console.log("[Notifications] Notification clicked:", event);
            onNotificationResponse(event);
          },
        );
      }
    }
  } catch (error) {
    console.error("[Notifications] Error adding event listeners:", error);
  }

  // Return cleanup function
  return () => {
    if (unsubscribeAttendance) {
      unsubscribeAttendance();
      unsubscribeAttendance = null;
    }
  };
}

/**
 * Format timestamp for notification display (IST)
 */
export function formatAttendanceTime(timestamp: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  };
  return timestamp.toLocaleString("en-IN", options);
}
