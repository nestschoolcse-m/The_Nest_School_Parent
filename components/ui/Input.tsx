"use client";

import React, { useState } from "react";
import { Eye, EyeOff, LucideIcon } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  isPassword?: boolean;
  icon?: LucideIcon;
  onChangeText?: (text: string) => void;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, isPassword, icon: Icon, onChangeText, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChangeText) {
        onChangeText(e.target.value);
      }
      if (props.onChange) {
        props.onChange(e);
      }
    };

    return (
      <div className="mb-4 w-full">
        {label && (
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 overflow-hidden text-gray-400">
              <Icon size={20} />
            </div>
          )}
          <input
            ref={ref}
            type={isPassword && !showPassword ? "password" : "text"}
            className={cn(
              "w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3.5 text-sm font-medium transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none",
              Icon && "pl-12",
              isPassword && "pr-12",
              error && "border-red-500 bg-red-50",
              className
            )}
            onChange={handleChange}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
