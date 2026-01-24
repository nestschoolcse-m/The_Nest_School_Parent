"use client";

import OneSignal from "react-onesignal";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  Timestamp
} from "firebase/firestore";
import { dataDb } from "./firebase";

let isInitialized = false;
let unsubscribeAttendance: (() => void) | null = null;

const DEFAULT_APP_ID = "13657fb4-80b6-43d6-8f74-0a8bf3d4729d";

/**
 * Initialize OneSignal and start real-time Firestore listener.
 * OneSignal only allows one Site URL per app in the dashboard; it must exactly
 * match the page origin (e.g. https://your-app.vercel.app for production).
 * Set NEXT_PUBLIC_ONESIGNAL_SITE_URL to your production URL on Vercel so we
 * skip init on mismatched origins and avoid "Can only be used on: ..." errors.
 */
export async function registerForPushNotifications(usn: string): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const allowedOrigin = process.env.NEXT_PUBLIC_ONESIGNAL_SITE_URL;
  if (allowedOrigin && window.location.origin !== allowedOrigin) {
    // OneSignal app's Site URL doesn't match this origin; skip to avoid SDK errors.
    return null;
  }

  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || DEFAULT_APP_ID;

  try {
    const usnUpperCase = usn.toUpperCase();

    // 1. Initialize OneSignal
    if (!isInitialized) {
      console.log("[Notifications] Setup for USN:", usnUpperCase);
      await OneSignal.init({
        appId,
        allowLocalhostAsSecureOrigin: true,
      });
      isInitialized = true;
    }

    // 2. Identification
    await OneSignal.login(usnUpperCase);
    await OneSignal.User.addTag("usn", usnUpperCase);
    await OneSignal.Notifications.requestPermission();

    // 3. Start Firestore Listener
    startAttendanceListener(usnUpperCase);

    const subId = OneSignal.User?.PushSubscription?.id;
    return (typeof subId === "string" ? subId : null) || "active";
  } catch (error) {
    console.error("[Notifications] Setup error:", error);
    return null;
  }
}

/**
 * Monitors Firestore for new logs specifically for this student
 * Supports both 'usn' and 'USN' field names
 */
function startAttendanceListener(usn: string) {
  if (unsubscribeAttendance) unsubscribeAttendance();

  console.log(`[Notifications] Starting Live Sync for ${usn}...`);

  // Use a simpler query first to avoid index requirements
  const q = query(
    collection(dataDb, "attendance_logs"),
    where("usn", "==", usn.toUpperCase()),
    limit(5)
  );

  unsubscribeAttendance = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      // We check for ALL types because we want to catch records even if they arrive fast
      if (change.type === "added" || change.type === "modified") {
        const data = change.doc.data();

        // Safety check for field casing
        const recordUsn = (data.usn || data.USN || "").toString().toUpperCase();
        if (recordUsn !== usn) return;

        const logTime = data.timestamp as Timestamp;
        const now = Date.now();

        // Notify only if the log is very recent (last 30 seconds)
        if (logTime && (now - logTime.toMillis() < 30000)) {
          console.log("[Notifications] NEW LOG DETECTED:", data);
          showLocalNotification(data);
        }
      }
    });
  }, (err) => {
    console.warn("[Notifications] Firestore Listener Error (likely missing index):", err);
    // Fallback: If index is missing, we try an even simpler query
    fallbackListener(usn);
  });
}

function fallbackListener(usn: string) {
  const q = query(collection(dataDb, "attendance_logs"), limit(1));
  unsubscribeAttendance = onSnapshot(q, (snapshot) => {
    // Simple fallback to detect if we can even reach the collection
    console.log("[Notifications] Fallback sync connected");
  });
}

function showLocalNotification(data: any) {
  const type = data.type || data.Type || "Activity";
  const name = data.wardName || "Student";
  const title = "NEST School - Gate Update";
  const body = `${name} has ${type.toLowerCase() === "entry" ? "entered" : "exited"} the campus.`;

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/logo.png",
      tag: `att-${data.usn}-${Date.now()}`
    });
  }
}

export function addNotificationListeners(onReceived?: (event: any) => void) {
  return () => {
    if (unsubscribeAttendance) {
      unsubscribeAttendance();
      unsubscribeAttendance = null;
    }
  };
}