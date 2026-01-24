"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ChevronRight,
    Flashlight,
    Info,
    LogOut,
    Bell,
    ShieldCheck,
    User
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {useStudent} from "@/hooks/useStudent";

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const { student, loading: studentLoading } = useStudent(user?.usn || null);
    const [diagnostics, setDiagnostics] = useState({
        status: "Loading...",
        externalId: "Not set",
        pushId: "None",
        isOptedIn: false,
    });

    useEffect(() => {
        const interval = setInterval(() => {
            try {
                const os = (window as any)?.OneSignal;
                const u = os?.User;
                const sub = u?.PushSubscription;
                if (os && u != null) {
                    setDiagnostics({
                        status: sub?.optedIn ? "ACTIVE" : "INACTIVE",
                        externalId: (typeof u.externalId === "string" ? u.externalId : null) || "Not set",
                        pushId: (typeof sub?.id === "string" ? sub.id : null) || "None",
                        isOptedIn: !!sub?.optedIn,
                    });
                }
            } catch {
                // OneSignal may be uninitialized or in error state (e.g. wrong Site URL)
            }
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = async () => {
        if (confirm("Are you sure you want to sign out?")) {
            await logout();
            router.replace("/login");
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-6">
                <div className="mx-auto max-w-2xl flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-50 rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} className="text-gray-900" />
                    </button>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[2px] text-gray-400 mb-0.5">Preferences</p>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Settings</h1>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-2xl px-6 py-8 pb-20">
                {/* Account Section */}
                <div className="mb-8 rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                    <div className="bg-gray-50/50 px-5 py-3 border-b border-gray-100">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Parent Account</p>
                    </div>
                    <div className="p-6 flex items-center">
                        <div className="h-14 w-14 rounded-2xl bg-gray-900 flex items-center justify-center text-white mr-4 shadow-sm">
                            <User size={28} />
                        </div>
                        <div className="flex-1">
                            <p className="text-xl font-bold text-gray-900 tracking-tight">{student?.fatherName || student?.motherName}</p>
                            
                        </div>
                    </div>
                </div>

                {/* Options Section */}
                <div className="mb-8 rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                    <div className="bg-gray-50/50 px-5 py-3 border-b border-gray-100">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Application</p>
                    </div>
                    <SettingsRow icon={Bell} label="Push Notifications" value="Active" />
                    <SettingsRow icon={ShieldCheck} label="Security Status" value="Protected" />
                    <SettingsRow icon={Info} label="Version" value="1.0.0" isLast />
                </div>

                {/* Actions */}
                <div className="space-y-4 mb-8">
                   
                  

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center p-5 rounded-3xl border border-red-50 bg-white hover:bg-red-50 transition-colors group"
                    >
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-red-100 flex items-center justify-center mr-4">
                            <LogOut size={20} className="text-red-700" />
                        </div>
                        <span className="flex-1 text-left font-bold text-red-700">Sign Out</span>
                        <ChevronRight size={18} className="text-red-200 group-hover:text-red-700 transition-colors" />
                    </button>
                </div>

                
                

                {/* Developers Section */}
                <div className="mt-16 text-center space-y-8">
                    <div className="space-y-1">
                        <p className="text-sm font-semibold   text-gray-900">Developed By:</p>
                        <p className="text-sm font-semibold   text-gray-900">Meenakshi Sundararajan Engineering College</p>
                        <p className="text-sm font-semibold   text-gray-900">CSE-III (2023-2027)</p>
                    </div>

                    <div className="space-y-4">
                        
                        <TeamMember name="Lakshwin Krishna Reddy M" role="Lead Architect & Backend Engineer" />
                        <TeamMember name="Pradosh Gopalakrishnan" role="Backend Engineer & Pentester" />
                        <TeamMember name="Dev Vikram Joshi" role="Cloud Security Architect" />
                        <TeamMember name="Bharathwaj K" role="Frontend Engineer" />
                        
                    </div>

                    
                </div>
            </div>
        </div>
    );
}

function SettingsRow({ icon: Icon, label, value, isLast = false }: { icon: any, label: string, value?: string, isLast?: boolean }) {
    return (
        <div className={`p-5 flex items-center ${!isLast ? "border-b border-gray-50" : ""}`}>
            <div className="h-10 w-10 shrink-0 rounded-xl bg-gray-50 flex items-center justify-center mr-4">
                <Icon size={18} className="text-gray-500" />
            </div>
            <span className="flex-1 font-bold text-gray-900 tracking-tight">{label}</span>
            {value && <span className="text-xs font-bold uppercase tracking-tighter text-gray-400">{value}</span>}
        </div>
    );
}

function TeamMember({ name, role }: { name: string; role: string }) {
    return (
        <div>
            <p className="text-md font-bold text-gray text-center">{name}</p>
            <p className="text-sm  text-gray-600 text-center">{role}</p>
        </div>
    );  
}
