/**
 * Firebase Cloud Functions for NEST ERP Parent App
 *
 * This function triggers when a new attendance log is created in Firestore
 * and sends a push notification to the parent's device.
 *
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Install Firebase CLI: npm install -g firebase-tools
 * 2. Login: firebase login
 * 3. Initialize: firebase init functions (select nest-erp-app project)
 * 4. Copy this file to functions/src/index.ts
 * 5. Deploy: firebase deploy --only functions
 *
 * NOTE: Requires Firebase Blaze (pay-as-you-go) plan
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin with both projects
const dataApp = admin.initializeApp(
  {
    projectId: "nest-school-barcode-ims",
  },
  "data"
);

const mainApp = admin.initializeApp(
  {
    projectId: "nest-erp-app",
  },
  "main"
);

const dataDb = admin.firestore(dataApp);
const mainDb = admin.firestore(mainApp);

// Format timestamp for notification
function formatTimestamp(date: Date): string {
  return date.toLocaleString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Get notification title based on type
function getNotificationTitle(studentName: string, type: string): string {
  switch (type.toUpperCase()) {
    case "ENTRY":
      return `🏫 ${studentName} - Arrived at School`;
    case "EXIT":
      return `🚪 ${studentName} - Left School`;
    case "SPORTS":
      return `⚽ ${studentName} - Sports Activity`;
    default:
      return `${studentName} - ${type}`;
  }
}

// Trigger on attendance creation in data project
export const sendAttendanceNotification = functions
  .region("asia-south1") // Mumbai region for India
  .firestore.document("attendance/{docId}")
  .onCreate(async (snapshot, context) => {
    try {
      const data = snapshot.data();
      const usn = data.usn as string;
      const type = data.type as string;
      const timestamp = data.timestamp?.toDate() || new Date();

      console.log(`New attendance log: ${usn} - ${type}`);

      // Get student info from data project
      const studentDoc = await dataDb.collection("students").doc(usn).get();

      if (!studentDoc.exists) {
        console.log(`Student not found: ${usn}`);
        return null;
      }

      const studentData = studentDoc.data()!;
      const studentName = studentData.name as string;

      // Get parent FCM token from main project
      const credDoc = await mainDb
        .collection("parentCredentials")
        .doc(usn)
        .get();

      if (!credDoc.exists) {
        console.log(`Parent credentials not found: ${usn}`);
        return null;
      }

      const credData = credDoc.data()!;
      const fcmToken = credData.fcmToken as string;

      if (!fcmToken) {
        console.log(`No FCM token for: ${usn}`);
        return null;
      }

      // Build notification
      const title = getNotificationTitle(studentName, type);
      const body = `Recorded at ${formatTimestamp(timestamp)}`;

      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title,
          body,
        },
        data: {
          usn,
          type,
          timestamp: timestamp.toISOString(),
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
        android: {
          priority: "high",
          notification: {
            channelId: "attendance",
            priority: "high",
            icon: "notification_icon",
            color: type === "ENTRY" ? "#22c55e" : type === "EXIT" ? "#ef4444" : "#8b5cf6",
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title,
                body,
              },
              badge: 1,
              sound: "default",
            },
          },
        },
      };

      // Send notification
      const response = await admin.messaging().send(message);
      console.log(`Notification sent successfully: ${response}`);

      return response;
    } catch (error) {
      console.error("Error sending notification:", error);
      return null;
    }
  });

// Optional: Clean up old FCM tokens that are no longer valid
export const cleanupInvalidTokens = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async (context) => {
    // Implementation for cleaning up invalid tokens
    console.log("Token cleanup job running");
    return null;
  });
