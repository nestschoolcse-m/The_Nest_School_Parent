"use client";

import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type BadgeVariant = "entry" | "exit" | "sports" | "default";

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  entry: "bg-green-50 text-green-700 border-green-100",
  exit: "bg-red-50 text-red-700 border-red-100",
  sports: "bg-slate-100 text-slate-800 border-slate-200",
  default: "bg-gray-100 text-gray-600 border-gray-200",
};

export function Badge({ text, variant = "default", className = "" }: BadgeProps) {
  return (
    <div className={cn(
      "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
      variantStyles[variant],
      className
    )}>
      {text}
    </div>
  );
}

export function getAttendanceVariant(
  type: string
): "entry" | "exit" | "sports" {
  switch (type.toUpperCase()) {
    case "ENTRY":
      return "entry";
    case "EXIT":
      return "exit";
    case "SPORTS":
      return "sports";
    default:
      return "entry";
  }
}
