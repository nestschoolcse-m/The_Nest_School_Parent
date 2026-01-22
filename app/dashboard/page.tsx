"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    AlertCircle,
    ArrowDownCircle,
    ArrowUpCircle,
    Bike,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Info,
    LogOut,
    Settings,
    User
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAttendance, AttendanceLog } from "@/hooks/useAttendance";
import { useWorkingDays } from "@/hooks/useWorkingDays";
import { AttendanceItem } from "@/components/AttendanceItem";
import { getStudentClass, getClassTimings, getAttendanceStatus } from "@/lib/studentUtils";

export default function DashboardPage() {
    const { user, logout, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const { logs, loading: logsLoading, error } = useAttendance(user?.usn || null, 1000);
    const { workingDays, loading: workingDaysLoading } = useWorkingDays(120);

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
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
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
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                            <User size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Parent Portal</p>
                            <h1 className="text-lg font-bold text-gray-900">{user.usn}</h1>
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
                            className="p-2 text-red-400 hover:text-red-900 transition-colors"
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
                        {/* Header */}
                        <div>
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Activity Log</p>
                            <h2 className="text-3xl font-extrabold text-gray-900">Attendance Dashboard</h2>
                        </div>

                        {/* Percentage Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="rounded-3xl bg-gray-900 p-6 text-white shadow-xl overflow-hidden relative">
                                <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-white/5 to-transparent"></div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">Monthly Attendance</p>
                                <p className="text-4xl font-black">{monthlyPercentage}%</p>
                                <div className="mt-4 flex items-center justify-between">
                                    <p className="text-[10px] text-white/40">{monthlyPresentDays} / {monthlyWorkingDays} days present</p>
                                    <div className="h-1 flex-1 mx-4 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${monthlyPercentage}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-3xl bg-blue-700 p-6 text-white shadow-xl overflow-hidden relative">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">Term Attendance</p>
                                <p className="text-4xl font-black">{termPercentage}%</p>
                                <div className="mt-4 flex items-center justify-between">
                                    <p className="text-[10px] text-white/40">{termPresentDays} / {termWorkingDays} total days</p>
                                    <div className="h-1 flex-1 mx-4 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-white/50 rounded-full" style={{ width: `${termPercentage}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <ArrowDownCircle size={16} className="text-green-600" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Entries</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{logs.filter(l => l.type === "ENTRY").length}</p>
                            </div>
                            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <ArrowUpCircle size={16} className="text-red-600" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Exits</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{logs.filter(l => l.type === "EXIT").length}</p>
                            </div>
                            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <Bike size={16} className="text-blue-600" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Sports</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{logs.filter(l => l.type === "SPORTS").length}</p>
                            </div>
                        </div>

                        {/* Calendar */}
                        <div className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between bg-gray-50/50 px-6 py-4 border-b border-gray-100">
                                <h3 className="font-bold text-gray-900">
                                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                                        className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button
                                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                                        className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-7 gap-2 mb-4">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                        <div key={day} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">{day}</div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-2">
                                    {Array.from({ length: firstDayOfMonth(currentMonth) }).map((_, i) => (
                                        <div key={`empty-${i}`} className="h-14 lg:h-16"></div>
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
                                                className={`group relative h-14 lg:h-16 rounded-2xl flex flex-col items-center justify-center transition-all ${isSelected ? 'bg-gray-900 text-white scale-105 shadow-lg' : 'hover:bg-gray-50'
                                                    } ${isToday && !isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                                            >
                                                <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>{day}</span>
                                                {mark && (
                                                    <div className={`mt-1.5 h-1.5 w-1.5 rounded-full ${mark.dotColor === 'green' ? 'bg-green-500' :
                                                            mark.dotColor === 'yellow' ? 'bg-yellow-500' :
                                                                mark.dotColor === 'blue' ? 'bg-blue-500' : 'bg-gray-300'
                                                        }`}></div>
                                                )}
                                                {isSelected && mark && (
                                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[8px] font-bold text-black border border-gray-100 shadow-sm">
                                                        {mark.label[0]}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="flex items-center justify-around border-t border-gray-100 bg-gray-50/30 py-4 px-6">
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
                            <h3 className="text-xl font-bold text-gray-900">Activity Details</h3>
                            <div className="rounded-full bg-gray-100 px-3 py-1 text-[10px] font-bold text-gray-600">
                                {new Date(selectedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {logsLoading ? (
                                <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-gray-200">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-transparent"></div>
                                </div>
                            ) : selectedDayLogs.length > 0 ? (
                                selectedDayLogs.map((log) => (
                                    <AttendanceItem key={log.id} log={log} />
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 p-10 text-center">
                                    {(() => {
                                        const isWorkingDay = workingDays.has(selectedDate);
                                        const isFuture = new Date(selectedDate) > today;

                                        if (isFuture) {
                                            return (
                                                <>
                                                    <CalendarIcon className="mb-4 h-10 w-10 text-gray-300" />
                                                    <p className="font-bold text-gray-900">Upcoming Date</p>
                                                    <p className="mt-1 text-xs text-gray-400">No records available for future dates</p>
                                                </>
                                            );
                                        }

                                        if (isWorkingDay) {
                                            return (
                                                <>
                                                    <div className="mb-4 rounded-full bg-blue-50 p-4">
                                                        <User className="h-8 w-8 text-blue-500" />
                                                    </div>
                                                    <p className="font-bold text-blue-600 uppercase tracking-widest text-xs">On Leave</p>
                                                    <p className="mt-2 text-sm font-medium text-gray-500">School was open but no entry was recorded for the ward</p>
                                                </>
                                            );
                                        } else {
                                            return (
                                                <>
                                                    <div className="mb-4 rounded-full bg-slate-100 p-4">
                                                        <Bike className="h-8 w-8 text-slate-500" />
                                                    </div>
                                                    <p className="font-bold text-slate-600 uppercase tracking-widest text-xs">School Holiday</p>
                                                    <p className="mt-2 text-sm font-medium text-gray-500">No activity recorded for any student on this day</p>
                                                </>
                                            );
                                        }
                                    })()}
                                </div>
                            )}
                        </div>

                        {/* Student Info Card */}
                        <div className="rounded-3xl bg-white border border-gray-100 p-6 shadow-sm">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
                                    <Info size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Student Info</p>
                                    <p className="font-bold text-gray-900">{classLabel}</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <InfoRow label="Term Start" value="June 2025" />
                                <InfoRow label="School Timings" value={`${getClassTimings(studentInfo.type).entry.hours}:${getClassTimings(studentInfo.type).entry.minutes.toString().padStart(2, '0')} AM - ${getClassTimings(studentInfo.type).exit.hours}:${getClassTimings(studentInfo.type).exit.minutes.toString().padStart(2, '0')} PM`} />
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
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
        </div>
    );
}

function InfoRow({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
            <span className="text-xs font-bold text-gray-700">{value}</span>
        </div>
    );
}
