export type StudentClass = "PREKG" | "LKG" | "UKG" | "STD_1_10" | "UNKNOWN";

export interface SchoolTimings {
  entry: { hours: number; minutes: number };
  exit: { hours: number; minutes: number };
  label: string;
}

export function getStudentClass(usn: string): { type: StudentClass; standard?: number } {
  if (!usn) return { type: "UNKNOWN" };
  
  const upperUsn = usn.toUpperCase();
  
  if (upperUsn.startsWith("NP")) return { type: "PREKG" };
  if (upperUsn.startsWith("NL")) return { type: "LKG" };
  if (upperUsn.startsWith("NU")) return { type: "UKG" };
  
  if (upperUsn.startsWith("NG")) {
    // Check for NG10 vs NG1-9
    const match = upperUsn.match(/^NG(\d+)/);
    if (match) {
      return { type: "STD_1_10", standard: parseInt(match[1], 10) };
    }
  }
  
  return { type: "UNKNOWN" };
}

export function getClassTimings(studentClass: StudentClass): SchoolTimings {
  switch (studentClass) {
    case "PREKG":
      return { entry: { hours: 9, minutes: 0 }, exit: { hours: 12, minutes: 0 }, label: "Pre-KG" };
    case "LKG":
      return { entry: { hours: 8, minutes: 15 }, exit: { hours: 12, minutes: 30 }, label: "LKG" };
    case "UKG":
      return { entry: { hours: 8, minutes: 15 }, exit: { hours: 13, minutes: 0 }, label: "UKG" };
    case "STD_1_10":
      return { entry: { hours: 8, minutes: 15 }, exit: { hours: 14, minutes: 45 }, label: "Std 1-10" };
    default:
      return { entry: { hours: 8, minutes: 15 }, exit: { hours: 14, minutes: 45 }, label: "Default" };
  }
}

export function getAttendanceStatus(
  type: "ENTRY" | "EXIT" | "SPORTS",
  timestamp: Date,
  timings: SchoolTimings,
  biasMinutes: number = 15
): { status: "ON_TIME" | "LATE" | "EARLY" | "NONE"; label: string; color: string } {
  if (type === "SPORTS") return { status: "NONE", label: "", color: "" };

  const timeInMinutes = timestamp.getHours() * 60 + timestamp.getMinutes();
  
  if (type === "ENTRY") {
    const expectedMinutes = timings.entry.hours * 60 + timings.entry.minutes;
    const isLate = timeInMinutes > expectedMinutes + biasMinutes;
    return {
      status: isLate ? "LATE" : "ON_TIME",
      label: isLate ? "Late Entry" : "On Time",
      color: isLate ? "#ef4444" : "#22c55e",
    };
  }

  if (type === "EXIT") {
    const expectedMinutes = timings.exit.hours * 60 + timings.exit.minutes;
    const isEarly = timeInMinutes < expectedMinutes - biasMinutes;
    const isLate = timeInMinutes > expectedMinutes + biasMinutes;
    
    if (isEarly) {
      return {
        status: "EARLY",
        label: "Half Day",
        color: "#f59e0b",
      };
    }
    
    if (isLate) {
      return {
        status: "LATE",
        label: "Late Exit",
        color: "#ef4444",
      };
    }

    return {
      status: "ON_TIME",
      label: "On Time",
      color: "#22c55e",
    };
  }

  return { status: "NONE", label: "", color: "" };
}
