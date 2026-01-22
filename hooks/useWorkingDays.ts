"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { dataDb } from "@/lib/firebase";

export function useWorkingDays(daysBack: number = 60) {
  const [workingDays, setWorkingDays] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    startDate.setHours(0, 0, 0, 0);

    const logsRef = collection(dataDb, "attendance_logs");
    // We query for any ENTRY logs to determine if school was open
    const q = query(
      logsRef,
      where("timestamp", ">=", Timestamp.fromDate(startDate)),
      orderBy("timestamp", "desc"),
      limit(5000)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const dates = new Set<string>();
        snapshot.forEach((doc) => {
          const data = doc.data();
          const timestamp = data.timestamp?.toDate() || data.createdAt?.toDate();
          if (timestamp) {
            const dateStr = timestamp.toISOString().split("T")[0];
            dates.add(dateStr);
          }
        });
        setWorkingDays(dates);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching global working days:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [daysBack]);

  return { workingDays, loading };
}
