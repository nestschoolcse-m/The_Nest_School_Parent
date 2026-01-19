import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { dataDb } from "@/lib/firebase";

export interface Student {
  usn: string;
  name: string;
  grade: string;
  dob: string;
  fatherName: string;
  fatherMobile: number;
  motherName: string;
  motherMobile: number;
  createdAt: Date;
}

export function useStudent(usn: string | null) {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!usn) {
      setLoading(false);
      return;
    }

    const studentRef = doc(dataDb, "students", usn);

    const unsubscribe = onSnapshot(
      studentRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setStudent({
            usn: snapshot.id,
            name: data.name,
            grade: data.grade,
            dob: data.dob,
            fatherName: data.fatherName,
            fatherMobile: data.fatherMobile,
            motherName: data.motherName,
            motherMobile: data.motherMobile,
            createdAt: data.createdAt?.toDate() || new Date(),
          });
          setError(null);
        } else {
          setError("Student not found");
          setStudent(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching student:", err);
        setError("Failed to load student data");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [usn]);

  return { student, loading, error };
}
