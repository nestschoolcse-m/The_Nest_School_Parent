import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { dataDb } from "@/lib/firebase";

export interface AttendanceLog {
  id: string;
  usn: string;
  type: "ENTRY" | "EXIT" | "SPORTS";
  timestamp: Date;
}

export function useAttendance(usn: string | null, limitCount: number = 50) {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!usn) {
      setLoading(false);
      return;
    }

    const logsRef = collection(dataDb, "attendance_logs");
    const q = query(
      logsRef,
      where("usn", "==", usn),
      orderBy("timestamp", "desc"),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const attendanceLogs: AttendanceLog[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          attendanceLogs.push({
            id: doc.id,
            usn: data.usn || data.USN, // Handle case difference
            type: data.type || data.Type,
            timestamp: data.timestamp?.toDate() || data.createdAt?.toDate() || new Date(),
          });
        });
        setLogs(attendanceLogs);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching attendance:", err);
        setError("Failed to load attendance data");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [usn, limitCount]);

  // Get the latest attendance status
  const latestStatus = logs.length > 0 ? logs[0] : null;

  return { logs, latestStatus, loading, error };
}
