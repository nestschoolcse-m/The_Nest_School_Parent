  /**
   * OneSignal Server-Side Utilities
   * Handles secure server-side operations for OneSignal Web Push
   * REST API key is stored server-side only and never exposed to client
   */

  import { doc, getDoc, collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
  import { dataDb } from "./firebase";

  // Types for OneSignal operations
  export interface OneSignalNotificationPayload {
    headings: { [key: string]: string };
    contents: { [key: string]: string };
    data?: Record<string, any>;
    big_picture?: string;
    large_icon?: string;
    include_external_user_ids?: string[];
    filters?: Array<{
      field: string;
      value: string | string[];
    }>;
  }

  export interface OneSignalTagData {
    usn: string;
    parentId?: string;
    [key: string]: any;
  }

  /**
   * Send notification via OneSignal REST API
   * This runs on the server and never exposes the API key to the client
   */
  export async function sendOneSignalNotification(
    payload: OneSignalNotificationPayload,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const apiKey = process.env.ONESIGNAL_REST_API_KEY;
      const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

      if (!apiKey) {
        console.error(
          "[OneSignal] REST API key not configured. Set ONESIGNAL_REST_API_KEY in .env.local",
        );
        return {
          success: false,
          error: "OneSignal API key not configured",
        };
      }

      const trimmedKey = apiKey.trim();


      if (!appId) {
        console.error("[OneSignal] App ID not configured");
        return {
          success: false,
          error: "OneSignal App ID not configured",
        };
      }



      const body = {
        app_id: appId,
        ...payload,
      };

      const response = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Authorization: `Basic ${trimmedKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[OneSignal] API error response:", errorText);
        try {
          const errorData = JSON.parse(errorText);
          return {
            success: false,
            error: errorData.errors?.join(", ") || "OneSignal API error",
          };
        } catch (e) {
          return {
            success: false,
            error: `OneSignal API error: ${response.status} ${errorText}`,
          };
        }
      }

      const data = await response.json();


      if (data.id) {

      } else {
        console.warn("[OneSignal] Notification accepted but no ID returned. Recipients:", data.recipients);
      }

      return {
        success: true,
        messageId: data.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[OneSignal] Unexpected error:", errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Tag a user in OneSignal with metadata
   * This allows segmenting notifications by user properties
   */
  export async function tagOneSignalUser(
    externalUserId: string,
    tags: OneSignalTagData,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const apiKey = process.env.ONESIGNAL_REST_API_KEY;
      const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

      if (!apiKey || !appId) {
        console.warn("[OneSignal] API configuration missing for tagging user");
        return { success: false, error: "OneSignal not configured" };
      }



      const response = await fetch(
        `https://onesignal.com/api/v1/apps/${appId}/users/${externalUserId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Authorization: `Basic ${apiKey}`,
          },
          body: JSON.stringify({
            properties: {
              tags: tags,
            },
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[OneSignal] User tagging error:", errorData);
        return {
          success: false,
          error: errorData.errors?.join(", ") || "Failed to tag user",
        };
      }


      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[OneSignal] Error tagging user:", errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Format notification content with attendance data
   * Fetches student name from dataDb students collection
   */
  export async function formatAttendanceNotification(
    usn: string,
    eventType: "ENTRY" | "EXIT" | "SPORTS",
    timestamp: Date,
  ): Promise<OneSignalNotificationPayload> {
    // Fetch student name from dataDb
    let studentName = "Student"; // Default fallback
    try {

      const studentRef = doc(dataDb, "students", usn);
      const studentSnap = await getDoc(studentRef);
      
      if (studentSnap.exists()) {
        const studentData = studentSnap.data();
        studentName = studentData.name || studentData.wardName || "Student";

      } else {
        console.warn("[OneSignal] Student not found in dataDb for USN:", usn);
      }
    } catch (error) {
      console.error("[OneSignal] Error fetching student data:", error);
    }

    const timeStr = formatTime(timestamp);
    let action = "";
    if (eventType === "ENTRY") {
      action = "Entered";
    } else if (eventType === "EXIT") {
      action = "Exited";
    } else if (eventType === "SPORTS") {
      // Determine if this is an exit for sports or entry back from sports
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const sportsQuery = query(
          collection(dataDb, "attendance_logs"),
          where("usn", "==", usn),
          where("type", "==", "SPORTS"),
          where("timestamp", ">=", Timestamp.fromDate(today)),
          orderBy("timestamp", "asc")
        );
        
        const sportsSnap = await getDocs(sportsQuery);
        const count = sportsSnap.size;
        
        // If count is even (2, 4...), it's an entry back from sports
        // If count is odd (1, 3...), it's an exit for sports
        if (count % 2 === 0) {
          action = "Entered back to campus from sports";
        } else {
          action = "Exited SPORTS";
        }

      } catch (error) {
        console.error("[OneSignal] Error querying sports logs:", error);
        action = "Exited SPORTS"; // Default fallback
      }
    }

    return {
      headings: {
        en: "The NEST School",
      },
      contents: {
        en: eventType === "SPORTS"
          ? `Your ward ${studentName} (${usn}) has ${action} at ${timeStr}.`
          : `Your ward ${studentName} (${usn}) has ${action} the campus at ${timeStr}.`,
      },
      data: {
        usn,
        eventType,
        timestamp: timestamp.toISOString(),
      },
    };
  }

  /**
   * Helper: Format timestamp for notification display
   */
  function formatTime(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    };
    return date.toLocaleString("en-IN", options);
  }
