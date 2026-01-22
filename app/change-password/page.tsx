"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Lock, Shield, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ChangePasswordPage() {
    const { changePassword, user } = useAuth();
    const router = useRouter();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword) {
            setError("Please enter a new password");
            return;
        }
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (newPassword === "parent@123") {
            setError("Please choose a different password");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const result = await changePassword(newPassword);

            if (result.success) {
                router.replace("/dashboard");
            } else {
                setError(result.error || "Failed to change password");
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-12">
            <div className="w-full max-w-md space-y-10">
                {/* Security Header */}
                <div className="flex flex-col items-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 border border-gray-100 shadow-sm mb-6">
                        <ShieldCheck size={32} className="text-gray-900" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Update Security
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 px-6">
                        Please set a secure password for account <span className="font-bold text-gray-900">{user?.usn}</span> to continue.
                    </p>
                </div>

                {/* Form Container */}
                <div className="bg-white">
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        {error && (
                            <div className="flex items-center rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-red-800">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <p className="ml-3 text-xs font-semibold">{error}</p>
                            </div>
                        )}

                        <Input
                            label="New Password"
                            placeholder="6+ characters required"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            icon={Lock}
                            isPassword
                            required
                        />

                        <Input
                            label="Confirm Security Code"
                            placeholder="Repeat new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            icon={Shield}
                            isPassword
                            required
                        />

                        <Button
                            type="submit"
                            loading={loading}
                            className="mt-6"
                        >
                            Update Credentials
                        </Button>

                        <div className="mt-8 flex justify-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
                                Encryption Active
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
