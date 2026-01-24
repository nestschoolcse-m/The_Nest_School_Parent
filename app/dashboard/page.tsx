"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowDownCircle,
    ArrowUpCircle,
    Bike,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Settings,
    User
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAttendance, AttendanceLog } from "@/hooks/useAttendance";
import { useWorkingDays } from "@/hooks/useWorkingDays";
import { useStudent } from "@/hooks/useStudent";
import { AttendanceItem } from "@/components/AttendanceItem";
import { getStudentClass, getClassTimings, getAttendanceStatus } from "@/lib/studentUtils";
function formatTo12Hour(hours: number, minutes: number) {
    const period = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  
    return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`;
  }
  

export default function DashboardPage() {
    const { user, logout, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const { logs, loading: logsLoading, error } = useAttendance(user?.usn || null, 1000);
    const { workingDays, loading: workingDaysLoading } = useWorkingDays(120);
    const { student, loading: studentLoading } = useStudent(user?.usn || null);

    const [currentMonth, setCurrentMonth] = useState(new Date());

    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    // Calendar Logic
    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const TERM_START_DATE = new Date(2025, 5, 1);
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const markedDates = useMemo(() => {
        const marked: Record<string, { dotColor: string; label: string }> = {};
        const wardEntryDates = new Set<string>();

        logs.forEach((log) => {
            const dateStr = formatDate(new Date(log.timestamp));
            if (log.type === "ENTRY") {
                wardEntryDates.add(dateStr);
            }
        });

        const iter = new Date(TERM_START_DATE.getTime());
        const end = new Date(today.getTime());
        let maxDays = 500;
        while (iter <= end && maxDays-- > 0) {
            const dateStr = formatDate(iter);
            const isWorkingDay = workingDays.has(dateStr);
            const hasWardEntry = wardEntryDates.has(dateStr);

            if (hasWardEntry) {
                const recordsForDay = logs.filter(l => formatDate(new Date(l.timestamp)) === dateStr);
                const entry = recordsForDay.find(l => l.type === "ENTRY");
                const exit = recordsForDay.find(l => l.type === "EXIT");

                if (entry && exit) {
                    const studentInfo = getStudentClass(user?.usn || "");
                    const timings = getClassTimings(studentInfo.type);
                    const status = getAttendanceStatus("EXIT", exit.timestamp, timings, 15);
                    const isHalfDay = status.status === "EARLY";
                    marked[dateStr] = { dotColor: isHalfDay ? "yellow" : "green", label: isHalfDay ? "Half Day" : "Present" };
                } else {
                    marked[dateStr] = { dotColor: "green", label: "Present" };
                }
            } else if (isWorkingDay) {
                marked[dateStr] = { dotColor: "blue", label: "Leave" };
            } else if (dateStr !== formatDate(today)) {
                marked[dateStr] = { dotColor: "gray", label: "Holiday" };
            }
            iter.setDate(iter.getDate() + 1);
        }
        return marked;
    }, [logs, workingDays, user?.usn]);

    const selectedDayLogs = useMemo(() => {
        return logs
            .filter(log => formatDate(new Date(log.timestamp)) === selectedDate)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }, [logs, selectedDate]);

    const getWorkingDaysCount = (start: Date, end: Date) => {
        let count = 0;
        let cur = new Date(start.getTime());
        while (cur <= end) {
            if (workingDays.has(formatDate(cur))) count++;
            cur.setDate(cur.getDate() + 1);
        }
        return count;
    };

    const getPresentDays = (attendanceLogs: AttendanceLog[], start: Date, end: Date) => {
        const presentDates = new Set();
        attendanceLogs.forEach((log) => {
            if (log.type === "ENTRY" && log.timestamp >= start && log.timestamp <= end) {
                presentDates.add(log.timestamp.toDateString());
            }
        });
        return presentDates.size;
    };

    const monthlyWorkingDays = getWorkingDaysCount(startOfMonth, today);
    const monthlyPresentDays = getPresentDays(logs, startOfMonth, today);
    const monthlyPercentage = monthlyWorkingDays > 0 ? Math.round((monthlyPresentDays / monthlyWorkingDays) * 100) : 0;

    const termWorkingDays = getWorkingDaysCount(TERM_START_DATE, today);
    const termPresentDays = getPresentDays(logs, TERM_START_DATE, today);
    const termPercentage = termWorkingDays > 0 ? Math.round((termPresentDays / termWorkingDays) * 100) : 0;

    if (authLoading || !user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"></div>
            </div>
        );
    }

    const studentInfo = getStudentClass(user.usn);
    const classLabel = studentInfo.type === "STD_1_10" ? `Class ${studentInfo.standard}` : studentInfo.type.replace("_", " ");

    return (
        <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
            {/* Top Navbar */}
            <nav className="sticky top-0 z-10 border-b border-gray-100 bg-white px-6 py-4">
                <div className="mx-auto flex max-w-5xl items-center justify-between">
                <img src="/logo.png" alt="The Nest School Logo" className="w-30 h-20" />
                    <div className="flex items-center gap-5">
                        
                        
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-center text-blue-900">The Nest School Parent Portal</h1>
                        
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push("/settings")}
                            className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                        >
                            <Settings size={24} />
                        </button>
                        <button
                            onClick={logout}
                            className="p-2 text-red-400 hover:text-red-600 transition-colors"
                        >
                            <LogOut size={24} />
                        </button>
                    </div>
                </div>
            </nav>

            <main className="mx-auto max-w-5xl px-6 py-8">
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Left Column: Stats & Calendar */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Welcome Header */}
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Welcome back,</p>
                            <h2 className="text-3xl font-bold text-gray-900">
                                {studentLoading ? "..." : student?.fatherName || student?.motherName || "Parent"}
                            </h2>
                        </div>

                        {/* Student Details Card */}
                        {student && (
                            <div className="rounded-2xl border border-gray-200 bg-white p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Your ward's details:</h2>
                                <div className="flex items-start gap-4 mb-6">
                                    
                                    
                                    <div className="flex-1">
                                        <h3 className="text-xl  font-bold text-gray-900">{student.name}</h3>
                                        <p className="text-xs pt-2 text-gray-500"> USN: {student.usn}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <DetailRow label="Date of Birth" value={student.dob || "—"} />
                                        <DetailRow label="Grade" value={student.grade || "—"} />
                                    </div>
                                    <div className="space-y-3">
                                        <DetailRow label="Father" value={student.fatherName || "—"} subValue={student.fatherMobile?.toString() || ""} />
                                        <DetailRow label="Mother" value={student.motherName || "—"} subValue={student.motherMobile?.toString() || ""} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Percentage Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="rounded-2xl border border-gray-200 bg-white p-6">
                                <p className="text-xs text-gray-500 mb-2">Monthly Attendance</p>
                                <p className="text-4xl font-bold text-gray-900">{monthlyPercentage}%</p>
                                <div className="mt-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs text-gray-400">{monthlyPresentDays} of {monthlyWorkingDays} days</p>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-gray-900 rounded-full" style={{ width: `${monthlyPercentage}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-gray-200 bg-white p-6">
                                <p className="text-xs text-gray-500 mb-2">Term Attendance</p>
                                <p className="text-4xl font-bold text-gray-900">{termPercentage}%</p>
                                <div className="mt-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs text-gray-400">{termPresentDays} of {termWorkingDays} days</p>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-gray-900 rounded-full" style={{ width: `${termPercentage}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="rounded-2xl border border-gray-200 bg-white p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <ArrowDownCircle size={16} className="text-gray-400" />
                                    <span className="text-xs text-green-500">Entries</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{logs.filter(l => l.type === "ENTRY").length}</p>
                            </div>
                            <div className="rounded-2xl border border-gray-200 bg-white p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <ArrowUpCircle size={16} className="text-gray-400" />
                                    <span className="text-xs text-red-500">Exits</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{logs.filter(l => l.type === "EXIT").length}</p>
                            </div>
                            <div className="rounded-2xl border border-gray-200 bg-white p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Bike size={16} className="text-gray-400" />
                                    <span className="text-xs text-blue-500">Sports</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{logs.filter(l => l.type === "SPORTS").length}</p>
                            </div>
                        </div>

                        {/* Calendar */}
                        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                <h3 className="font-semibold text-gray-900">
                                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </h3>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <ChevronLeft size={18} className="text-gray-600" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <ChevronRight size={18} className="text-gray-600" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-7 gap-2 mb-4">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                        <div key={day} className="text-center text-xs text-gray-400">{day}</div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-2">
                                    {Array.from({ length: firstDayOfMonth(currentMonth) }).map((_, i) => (
                                        <div key={`empty-${i}`} className="h-12 lg:h-14"></div>
                                    ))}
                                    {Array.from({ length: daysInMonth(currentMonth) }).map((_, i) => {
                                        const day = i + 1;
                                        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                                        const dateStr = formatDate(date);
                                        const isSelected = selectedDate === dateStr;
                                        const isToday = formatDate(new Date()) === dateStr;
                                        const mark = markedDates[dateStr];

                                        return (
                                            <button
                                                key={day}
                                                onClick={() => setSelectedDate(dateStr)}
                                                className={`relative h-12 lg:h-14 rounded-lg flex flex-col items-center justify-center transition-colors ${isSelected ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'
                                                    } ${isToday && !isSelected ? 'ring-1 ring-gray-900' : ''}`}
                                            >
                                                <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-900'}`}>{day}</span>
                                                {mark && (
                                                    <div className={`mt-1 h-1.5 w-1.5 rounded-full ${mark.dotColor === 'green' ? 'bg-green-500' :
                                                            mark.dotColor === 'yellow' ? 'bg-yellow-500' :
                                                                mark.dotColor === 'blue' ? 'bg-blue-500' : 'bg-gray-300'
                                                        }`}></div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="flex items-center justify-center gap-6 border-t border-gray-100 py-4 px-6">
                                <LegendItem color="bg-green-500" label="Present" />
                                <LegendItem color="bg-yellow-500" label="Half Day" />
                                <LegendItem color="bg-blue-500" label="Leave" />
                                <LegendItem color="bg-gray-300" label="Holiday" />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Activity Details */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Activity Details</h3>
                            <span className="text-sm text-gray-500">
                                {new Date(selectedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        </div>

                        <div className="space-y-3">
                            {logsLoading ? (
                                <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-gray-200">
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                                </div>
                            ) : selectedDayLogs.length > 0 ? (
                                selectedDayLogs.map((log) => (
                                    <AttendanceItem key={log.id} log={log} />
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 p-8 text-center">
                                    {(() => {
                                        const isWorkingDay = workingDays.has(selectedDate);
                                        const isFuture = new Date(selectedDate) > today;

                                        if (isFuture) {
                                            return (
                                                <>
                                                    <CalendarIcon className="mb-3 h-8 w-8 text-gray-300" />
                                                    <p className="font-medium text-gray-900">Upcoming Date</p>
                                                    <p className="mt-1 text-sm text-gray-400">No records for future dates</p>
                                                </>
                                            );
                                        }

                                        if (isWorkingDay) {
                                            return (
                                                <>
                                                    <User className="mb-3 h-8 w-8 text-gray-400" />
                                                    <p className="font-medium text-gray-900">On Leave</p>
                                                    <p className="mt-1 text-sm text-gray-400">No entry recorded for this day</p>
                                                </>
                                            );
                                        } else {
                                            return (
                                                <>
                                                    <Bike className="mb-3 h-8 w-8 text-gray-300" />
                                                    <p className="font-medium text-gray-900">Holiday</p>
                                                    <p className="mt-1 text-sm text-gray-400">School was closed</p>
                                                </>
                                            );
                                        }
                                    })()}
                                </div>
                            )}
                        </div>

                        {/* School Timings Card */}
                        <div className="rounded-xl border border-gray-200 bg-white p-5">
                            <p className="text-xs text-gray-400 mb-3">School Schedule</p>
                            <div className="space-y-2">
                               
                            <InfoRow
  label="Timings"
  value={`${formatTo12Hour(
    getClassTimings(studentInfo.type).entry.hours,
    getClassTimings(studentInfo.type).entry.minutes
  )} - ${formatTo12Hour(
    getClassTimings(studentInfo.type).exit.hours,
    getClassTimings(studentInfo.type).exit.minutes
  )}`}
/>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function LegendItem({ color, label }: { color: string; label: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${color}`} />
            <span className="text-xs text-gray-500">{label}</span>
        </div>
    );
}

function InfoRow({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <span className="text-xs text-gray-500">{label}</span>
            <span className="text-sm font-medium text-gray-900">{value}</span>
        </div>
    );
}

function DetailRow({ label, value, subValue }: { label: string; value: string; subValue?: string }) {
    return (
        <div>
            <p className="text-xs text-gray-400 mb-0.5">{label}</p>
            <p className="text-sm font-medium text-gray-900">{value}</p>
            {subValue && <p className="text-xs text-gray-500">{subValue}</p>}
        </div>
    );
}
