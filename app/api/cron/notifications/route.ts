import { NextRequest, NextResponse } from "next/server";
import {
    collection,
    query,
    where,
    getDocs,
    Timestamp,
    orderBy,
    limit
} from "firebase/firestore";
import { dataDb } from "@/lib/firebase";
import { sendOneSignalNotification, formatAttendanceNotification } from "@/lib/oneSignalServer";

/**
 * Vercel Cron Job: Attendance Bridge
 * 
 * Runs periodically to catch scans that were written directly to Firestore
 * and pushes them to OneSignal. This is the BEST alternative to Firebase Functions.
 */
export async function GET(request: NextRequest) {
    // Security check for cron (optional but recommended)
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { return new Response('Unauthorized', { status: 401 }); }

    console.log("[Cron] Running Attendance Bridge...");

    try {
        // 1. Look for logs created in the last 2 minutes
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        const timeBoundary = Timestamp.fromDate(twoMinutesAgo);

        const q = query(
            collection(dataDb, "attendance_logs"),
            where("timestamp", ">=", timeBoundary),
            orderBy("timestamp", "desc"),
            limit(20)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log("[Cron] No new logs found in the last 2 minutes.");
            return NextResponse.json({ processed: 0 });
        }

        const results = [];

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const usn = (data.usn || data.USN || "").toUpperCase();

            if (!usn) continue;

            // 2. Push to OneSignal
            const notification = formatAttendanceNotification(
                data.wardName || "Student",
                usn,
                data.type || data.Type || "ENTRY",
                data.timestamp.toDate()
            );

            // Target by External User ID (USN)
            notification.include_external_user_ids = [usn];

            const pushResult = await sendOneSignalNotification(notification);
            results.push({ usn, success: pushResult.success });
        }

        return NextResponse.json({
            processed: results.length,
            details: results
        });

    } catch (error: any) {
        console.error("[Cron] Bridge Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
