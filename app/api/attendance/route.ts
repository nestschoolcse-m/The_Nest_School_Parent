/**
 * POST /api/attendance
 *
 * Endpoint for processing attendance events (ENTRY/EXIT)
 * 1. Writes event to Firestore
 * 2. Sends OneSignal notification to parent
 *
 * Request body:
 * {
 *   "usn": "USN123",
 *   "wardName": "John Doe",
 *   "type": "ENTRY" | "EXIT",
 *   "timestamp": "2024-01-22T10:30:00Z",
 *   "parentId": "parent@example.com" (optional, for segmentation)
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { dataDb } from "@/lib/firebase";
import {
  sendOneSignalNotification,
  formatAttendanceNotification,
  tagOneSignalUser,
} from "@/lib/oneSignalServer";

// Input validation types
interface AttendanceEventRequest {
  usn: string;
  wardName: string;
  type: "ENTRY" | "EXIT" | "SPORTS";
  timestamp?: string;
  parentId?: string;
}

/**
 * Validate and sanitize attendance event payload
 */
function validateRequest(body: any): {
  valid: boolean;
  data?: AttendanceEventRequest;
  error?: string;
} {
  if (!body) {
    return { valid: false, error: "Request body is empty" };
  }

  const { usn, wardName, type, timestamp, parentId } = body;

  // Validate required fields
  if (!usn || typeof usn !== "string" || usn.trim().length === 0) {
    return { valid: false, error: "Missing or invalid 'usn'" };
  }

  if (
    !wardName ||
    typeof wardName !== "string" ||
    wardName.trim().length === 0
  ) {
    return { valid: false, error: "Missing or invalid 'wardName'" };
  }

  if (!type || !["ENTRY", "EXIT", "SPORTS"].includes(type)) {
    return { valid: false, error: "Invalid 'type'. Must be 'ENTRY', 'EXIT' or 'SPORTS'" };
  }

  // Validate optional timestamp
  let eventTime = new Date();
  if (timestamp) {
    const parsedTime = new Date(timestamp);
    if (isNaN(parsedTime.getTime())) {
      return { valid: false, error: "Invalid timestamp format" };
    }
    eventTime = parsedTime;
  }

  return {
    valid: true,
    data: {
      usn: usn.trim().toUpperCase(),
      wardName: wardName.trim(),
      type,
      timestamp: eventTime.toISOString(),
      parentId: parentId ? String(parentId).trim() : undefined,
    },
  };
}

/**
 * Main handler for attendance events
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    console.log("[API] Attendance request received:", {
      usn: body.usn,
      type: body.type,
      timestamp: body.timestamp,
    });

    // Validate request
    const validation = validateRequest(body);
    if (!validation.valid) {
      console.warn("[API] Validation failed:", validation.error);
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const eventData = validation.data!;
    const eventTime = new Date(eventData.timestamp!);
    const usn = eventData.usn.toUpperCase();

    // Step 1: Write to Firestore attendance_logs collection
    console.log(`[API] Processing ${eventData.type} for USN: ${usn}`);

    let firestoreId = "";
    try {
      const docRef = await addDoc(collection(dataDb, "attendance_logs"), {
        usn: usn,
        wardName: eventData.wardName,
        type: eventData.type,
        timestamp: Timestamp.fromDate(eventTime),
        parentId: eventData.parentId || null,
        createdAt: serverTimestamp(),
      });
      firestoreId = docRef.id;
      console.log(`[API] Success: Firestore document created (${firestoreId})`);
    } catch (error) {
      console.error("[API] Firestore Error:", error);
      return NextResponse.json(
        { error: "Database write failed" },
        { status: 500 },
      );
    }

    // Step 2: Send OneSignal notification
    console.log(`[API] Dispatching OneSignal notification to external_id: ${usn}`);

    const notificationPayload = await formatAttendanceNotification(
      usn,
      eventData.type,
      eventTime,
    );

    // Target the parent by USN (External User ID)
    notificationPayload.include_external_user_ids = [usn];

    const notificationResult = await sendOneSignalNotification(notificationPayload);

    if (!notificationResult.success) {
      console.warn(`[API] Notification failed for ${usn}:`, notificationResult.error);
      return NextResponse.json(
        {
          success: true,
          message: "Attendance logged, but notification failed",
          firestoreId,
          notificationError: notificationResult.error,
        },
        { status: 202 },
      );
    }

    console.log(`[API] Complete: Attendance logged and notification sent for ${usn}`);
    return NextResponse.json(
      {
        success: true,
        message: "Attendance recorded and notification sent",
        firestoreId,
        messageId: notificationResult.messageId,
      },
      { status: 200 },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[API] Unexpected error:", errorMessage);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Error handler for unsupported methods
 */
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    { message: "Method POST required" },
    { status: 405 },
  );
}
