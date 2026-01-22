"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CreditCard, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Image from "next/image";

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [usn, setUsn] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!usn.trim()) {
            setError("Please enter your USN");
            return;
        }
        if (!password) {
            setError("Please enter your password");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const result = await login(usn.trim(), password);

            if (result.success) {
                if (result.isFirstLogin) {
                    router.replace("/change-password");
                } else {
                    router.replace("/dashboard");
                }
            } else {
                setError(result.error || "Login failed");
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-12">
                {/* Logo Section */}
                <div className="flex flex-col items-center">
                    <div className="relative h-20 w-[220px]">
                        <Image
                            src="/logo.png"
                            alt="The Nest School Logo"
                            fill
                            style={{ objectFit: 'contain' }}
                            priority
                        />
                    </div>
                    <div className="mt-6 h-px w-12 bg-gray-100" />
                    <p className="mt-6 text-center text-xs font-bold uppercase tracking-[3px] text-gray-400">
                        Parent Portal
                    </p>
                </div>

                {/* Login Form */}
                <div className="bg-white">
                    <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
                        Welcome Back
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-500 mb-8">
                        Please enter your credentials to continue
                    </p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="flex items-center rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-red-800">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <p className="ml-3 text-xs font-semibold">{error}</p>
                            </div>
                        )}

                        <Input
                            label="Student USN"
                            placeholder="Enter USN (e.g., NG823004_L01)"
                            value={usn}
                            onChangeText={(text) => setUsn(text.toUpperCase())}
                            icon={CreditCard}
                            required
                        />

                        <Input
                            label="Password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            icon={Lock}
                            isPassword
                            required
                        />

                        <Button
                            type="submit"
                            loading={loading}
                            className="mt-6"
                        >
                            Sign In
                        </Button>
                    </form>

                    <div className="mt-10 flex flex-col items-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
                            Authentication Secured
                        </p>
                        <p className="mt-1 text-[10px] text-gray-400">
                            Default: parent@123
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
