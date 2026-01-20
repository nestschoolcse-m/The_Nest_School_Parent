import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as https from "https";

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

// Helper to send notification via Expo Push API
async function sendExpoNotification(
  token: string,
  title: string,
  body: string,
  data: any
) {
  const message = {
    to: token,
    sound: "default",
    title,
    body,
    data,
    channelId: "attendance",
  };

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "exp.host",
        path: "/--/api/v2/push/send",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
        },
      },
      (res) => {
        let responseBody = "";
        res.on("data", (chunk) => (responseBody += chunk));
        res.on("end", () => resolve(JSON.parse(responseBody)));
      }
    );

    req.on("error", (error) => reject(error));
    req.write(JSON.stringify(message));
    req.end();
  });
}

// Trigger on attendance logs creation in data project
export const sendAttendanceNotification = functions
  .region("asia-south1")
  .firestore.document("attendance_logs/{docId}")
  .onCreate(async (snapshot: any, context: any) => {
    try {
      const data = snapshot.data();
      if (!data) return null;

      const usn = data.usn as string;
      const type = data.type as string;
      const timestamp = data.timestamp?.toDate() || new Date();

      console.log(`New attendance log: ${usn} - ${type}`);

      const studentDoc = await dataDb.collection("students").doc(usn).get();
      if (!studentDoc.exists) {
        console.log(`Student not found: ${usn}`);
        return null;
      }

      const studentName = studentDoc.data()?.name as string;
      const credDoc = await mainDb.collection("parentCredentials").doc(usn).get();

      if (!credDoc.exists) {
        console.log(`Parent credentials not found: ${usn}`);
        return null;
      }

      const fcmToken = credDoc.data()?.fcmToken as string;
      if (!fcmToken) {
        console.log(`No token for student: ${usn}`);
        return null;
      }

      const title = getNotificationTitle(studentName, type);
      const body = `Recorded at ${formatTimestamp(timestamp)}`;
      const payload = {
        usn,
        type,
        timestamp: timestamp.toISOString(),
      };

      if (fcmToken.startsWith("ExponentPushToken")) {
        console.log("Sending via Expo Push API...");
        const response = await sendExpoNotification(fcmToken, title, body, payload);
        console.log("Expo response:", JSON.stringify(response));
        return response;
      }

      // Default to FCM for native tokens
      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: { title, body },
        data: payload,
        android: {
          priority: "high",
          notification: {
            channelId: "attendance",
            icon: "notification_icon",
            color: type === "ENTRY" ? "#22c55e" : type === "EXIT" ? "#ef4444" : "#8b5cf6",
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log(`FCM response: ${response}`);
      return response;
    } catch (error) {
      console.error("Error sending notification:", error);
      return null;
    }
  });

export const cleanupInvalidTokens = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async (context: any) => {
    console.log("Token cleanup job running");
    return null;
  });
