"use client";

import React, { useMemo } from "react";
import { ArrowDownCircle, ArrowUpCircle, Bike, Clock } from "lucide-react";
import { AttendanceLog } from "@/hooks/useAttendance";
import { Badge, getAttendanceVariant } from "./ui/Badge";
import { getStudentClass, getClassTimings, getAttendanceStatus } from "@/lib/studentUtils";

interface AttendanceItemProps {
  log: AttendanceLog;
}

export function AttendanceItem({ log }: AttendanceItemProps) {
  const statusInfo = useMemo(() => {
    const studentClass = getStudentClass(log.usn);
    const timings = getClassTimings(studentClass.type);
    return getAttendanceStatus(log.type, log.timestamp, timings, 15);
  }, [log]);

  const Icon = useMemo(() => {
    switch (log.type) {
      case "ENTRY":
        return ArrowDownCircle;
      case "EXIT":
        return ArrowUpCircle;
      default:
        return Bike;
    }
  }, [log.type]);

  const iconColor = useMemo(() => {
    switch (log.type) {
      case "ENTRY":
        return "text-green-700";
      case "EXIT":
        return "text-red-700";
      default:
        return "text-slate-600";
    }
  }, [log.type]);

  const borderStyle = useMemo(() => {
    switch (log.type) {
      case "ENTRY":
        return "border-l-4 border-l-green-600";
      case "EXIT":
        return "border-l-4 border-l-red-600";
      default:
        return "border-l-4 border-l-slate-400";
    }
  }, [log.type]);

  return (
    <div className={`bg-white border border-gray-100 rounded-2xl px-5 py-4 mb-3 flex items-center shadow-sm transition-hover hover:shadow-md ${borderStyle}`}>
      {/* Icon Area */}
      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mr-4 border border-gray-50 shrink-0">
        <Icon size={24} className={iconColor} />
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-900 font-bold text-base tracking-tight">{log.type}</span>
            {statusInfo.status !== "NONE" && (
              <div
                className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{ backgroundColor: `${statusInfo.color}15`, color: statusInfo.color }}
              >
                {statusInfo.label}
              </div>
            )}
          </div>
          <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
            {log.timestamp.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="flex items-center mt-1 text-gray-500">
          <Clock size={14} className="mr-1.5" />
          <span className="text-sm font-medium">
            {log.timestamp.toLocaleTimeString("en-IN", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
