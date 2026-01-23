"use client";

import React from "react";
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

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const router = useRouter();

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
                            <p className="text-xl font-bold text-gray-900 tracking-tight">{user?.usn}</p>
                            <p className="text-xs font-medium text-gray-400">Secured Portal Access</p>
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
                <div className="space-y-4">
                    <button
                        onClick={async () => {
                            try {
                                const response = await fetch("/api/attendance", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                        usn: user?.usn,
                                        wardName: "Test Student",
                                        type: "ENTRY",
                                        timestamp: new Date().toISOString(),
                                    }),
                                });

                                const data = await response.json();

                                if (response.ok || response.status === 202) {
                                  alert("A test activity log was successfully dispatched. Notification arriving shortly.");
                                } else {
                                  throw new Error(data.error || "API error");
                                }
                            } catch (err: any) {
                                console.error(err);
                                alert(`Notification error: ${err.message}`);
                            }
                        }}
                        className="w-full flex items-center p-5 rounded-3xl border border-gray-100 bg-gray-50/50 hover:bg-gray-100 transition-colors group"
                    >
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-white border border-gray-100 flex items-center justify-center mr-4">
                            <Flashlight size={20} className="text-gray-900" />
                        </div>
                        <span className="flex-1 text-left font-bold text-gray-900">Test System Notification</span>
                        <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-900 transition-colors" />
                    </button>

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

                {/* Debug Section */}
                <div className="mb-8 rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                    <div className="bg-gray-50/50 px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">System Diagnostics</p>
                        <button 
                            onClick={async () => {
                                if (confirm("This will clear all OneSignal data. Continue?")) {
                                    if (window.OneSignal) {
                                      await window.OneSignal.User.PushSubscription.optOut();
                                      localStorage.removeItem('onesignal-push-id');
                                      window.location.reload();
                                    }
                                }
                            }}
                            className="text-[9px] font-bold text-red-500 uppercase hover:underline ml-2"
                        >
                            Hard Reset
                        </button>
                        <button 
                            onClick={() => window.location.reload()}
                            className="text-[9px] font-bold text-blue-500 uppercase hover:underline"
                        >
                            Refresh SDK
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-500">Subscription Status</span>
                            <span id="onesignal-status" className="text-xs font-bold text-gray-400">Loading...</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-500">External ID</span>
                            <span id="onesignal-ext-id" className="text-xs font-bold text-gray-400">Not set</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-sm font-medium text-gray-500">Push Token</span>
                            <p id="onesignal-push-id" className="text-[10px] font-mono text-gray-300 break-all bg-gray-50 p-2 rounded-lg">None</p>
                        </div>
                    </div>
                </div>

                <script dangerouslySetInnerHTML={{ __html: `
                    setInterval(() => {
                        if (window.OneSignal && window.OneSignal.User) {
                            const status = document.getElementById('onesignal-status');
                            const extId = document.getElementById('onesignal-ext-id');
                            const pushId = document.getElementById('onesignal-push-id');
                            
                            if (status) status.innerText = window.OneSignal.User.PushSubscription?.optedIn ? 'ACTIVE' : 'INACTIVE';
                            if (extId) extId.innerText = window.OneSignal.User.externalId || 'Not set';
                            if (pushId) pushId.innerText = window.OneSignal.User.PushSubscription?.id || 'None';
                            
                            if (status && window.OneSignal.User.PushSubscription?.optedIn) {
                                status.classList.remove('text-gray-400', 'text-red-500');
                                status.classList.add('text-green-500');
                            } else if (status) {
                                status.classList.add('text-red-500');
                            }
                        }
                    }, 2000);
                `}} />

                {/* Developers Section */}
                <div className="mt-16 text-center space-y-8">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-[3px] text-gray-400">Developed By:</p>
                        <p className="text-[10px] font-bold uppercase tracking-[3px] text-gray-400">CSE-III (2023-2027)</p>
                    </div>

                    <div className="space-y-4">
                        <TeamMember name="Lakshwin Krishna Reddy M" role="Lead Architect & Backend Engineer" />
                        <TeamMember name="Dev Vikram Joshi" role="Cloud Architect" />
                        <TeamMember name="Bharathwaj K" role="Frontend Engineer" />
                        <TeamMember name="Pradosh Gopalakrishnan" role="Backend Engineer & Pentester" />
                    </div>

                    {/* Footer */}
                    <div className="pt-8">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300">NEST ERP SECURITY FRAMEWORK</p>
                        <p className="text-[9px] font-medium text-gray-200 mt-1 uppercase tracking-tighter">PROPRIETARY SYSTEM • © 2026 THE NEST SCHOOL</p>
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
            <p className="text-[15px] font-bold text-gray-900 tracking-tight">{name}</p>
            <p className="text-[10px] font-bold uppercase tracking-[2px] text-gray-400 mt-0.5">{role}</p>
        </div>
    );
}
