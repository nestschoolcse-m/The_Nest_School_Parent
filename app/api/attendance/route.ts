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
  type: "ENTRY" | "EXIT";
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

  if (!type || !["ENTRY", "EXIT"].includes(type)) {
    return { valid: false, error: "Invalid 'type'. Must be 'ENTRY' or 'EXIT'" };
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

    // Step 1: Write to Firestore attendance_logs collection
    console.log("[API] Writing to Firestore:", eventData.usn);
    try {
      const docRef = await addDoc(collection(dataDb, "attendance_logs"), {
        usn: eventData.usn,
        wardName: eventData.wardName,
        type: eventData.type,
        timestamp: Timestamp.fromDate(eventTime),
        parentId: eventData.parentId || null,
        createdAt: serverTimestamp(),
      });
      console.log("[API] Firestore document created:", docRef.id);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("[API] Firestore write error:", errorMessage);
      return NextResponse.json(
        { error: "Failed to save attendance record" },
        { status: 500 },
      );
    }

    // Step 2: Send OneSignal notification
    console.log("[API] Preparing OneSignal notification for", eventData.usn);

    const notificationPayload = formatAttendanceNotification(
      eventData.wardName,
      eventData.usn,
      eventData.type,
      eventTime,
    );

    // Send to parent (tagged by USN)
    // In production, you would query Firestore to find the parent's OneSignal ID
    // For now, we use the USN as the external user ID for OneSignal
    notificationPayload.include_external_user_ids = [eventData.usn];

    const notificationResult =
      await sendOneSignalNotification(notificationPayload);

    if (!notificationResult.success) {
      console.error(
        "[API] OneSignal notification failed:",
        notificationResult.error,
      );
      // Don't fail the entire request if notification fails
      // The Firestore record is already saved
      return NextResponse.json(
        {
          success: true,
          message: "Attendance recorded but notification delivery failed",
          firestoreId: "recorded",
          notificationError: notificationResult.error,
        },
        { status: 202 },
      );
    }

    console.log("[API] Success - Attendance logged and notification sent");
    return NextResponse.json(
      {
        success: true,
        message: "Attendance recorded and notification sent",
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
