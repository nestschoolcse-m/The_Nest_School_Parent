
import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { dataDb } from "@/lib/firebase";
import {
  sendOneSignalNotification,
  formatAttendanceNotification,
} from "@/lib/oneSignalServer";

/**
 * POST /api/attendance/notify
 * Trigger OneSignal notification for a specific attendance log
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { attendanceId } = body;

    if (!attendanceId) {
      return NextResponse.json(
        { error: "Missing attendanceId" },
        { status: 400 }
      );
    }



    const logRef = doc(dataDb, "attendance_logs", attendanceId);
    const logSnap = await getDoc(logRef);

    if (!logSnap.exists()) {
      console.warn(`[API] Attendance log not found: ${attendanceId}`);
      return NextResponse.json(
        { error: "Attendance log not found" },
        { status: 404 }
      );
    }

    const logData = logSnap.data();

    if (logData.notified === true) {

      return NextResponse.json(
        { success: true, message: "Already notified" },
        { status: 200 }
      );
    }

    // Extract necessary data
    // Case insensitive fallback for legacy data
    const usn = (logData.usn || logData.USN || "").toString().toUpperCase();
    const type = (logData.type || logData.Type || "ENTRY").toString().toUpperCase();
    const eventType = (type === "ENTRY" || type === "EXIT" || type === "SPORTS") 
      ? type as "ENTRY" | "EXIT" | "SPORTS" 
      : "EXIT";
    const timestamp = logData.timestamp ? logData.timestamp.toDate() : new Date();

    if (!usn) {
      return NextResponse.json(
        { error: "Invalid log data: Missing USN" },
        { status: 400 }
      );
    }

    // Prepare notification payload
    const notificationPayload = await formatAttendanceNotification(
      usn,
      eventType,
      timestamp
    );

    // Target the parent by USN (External User ID)
    notificationPayload.include_external_user_ids = [usn];

    // Send Notification
    const result = await sendOneSignalNotification(notificationPayload);

    if (!result.success) {
      console.error(`[API] Notification failed for ${attendanceId}:`, result.error);
      return NextResponse.json(
        { error: "Notification failed", details: result.error },
        { status: 500 }
      );
    }

    // Update Firestore to mark as notified
    await updateDoc(logRef, { notified: true });



    return NextResponse.json(
      { success: true, messageId: result.messageId },
      { status: 200 }
    );

  } catch (error) {
    console.error("[API] Notify Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
