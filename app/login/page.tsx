"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CreditCard, LogIn, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Image from "next/image";

export default function LoginPage() {
    const { loginWithGoogle, linkStudent, user, firebaseUser } = useAuth();
    const router = useRouter();
    
    const [usn, setUsn] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [needsUsnLink, setNeedsUsnLink] = useState(false);

    // Auto redirect if already logged in properly
    useEffect(() => {
        if (user && user.usn) {
            router.replace("/dashboard");
        }
    }, [user, router]);

    const handleGoogleLogin = async () => {
        setError("");
        setLoading(true);

        try {
            const result = await loginWithGoogle();

            if (result.success) {
                if (result.needsUsnLink) {
                    setNeedsUsnLink(true);
                } else {
                    router.replace("/dashboard");
                }
            } else {
                setError(result.error || "Google Sign-In failed");
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleLinkStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!usn.trim()) {
            setError("Please enter the Student USN");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const result = await linkStudent(usn.trim());
            if (result.success) {
                router.replace("/dashboard");
            } else {
                setError(result.error || "Failed to link student");
            }
        } catch (err) {
            setError("An unexpected error occurred while linking");
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
                            sizes="(max-width: 768px) 100vw, 220px"
                            style={{ objectFit: 'contain' }}
                            priority
                        />
                    </div>
                    <div className="mt-6 h-px w-12 bg-gray-100" />
                    <p className="mt-6 text-center text-xs font-bold uppercase tracking-[3px] text-gray-400">
                        Parent Portal
                    </p>
                </div>

                <div className="bg-white">
                    {!needsUsnLink ? (
                        <>
                            <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
                                Welcome Back
                            </h2>
                            <p className="mt-2 text-center text-sm text-gray-500 mb-8">
                                Sign in with your registered Google account
                            </p>

                            <div className="space-y-4">
                                {error && (
                                    <div className="flex items-center rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-red-800">
                                        <AlertCircle className="h-5 w-5 shrink-0" />
                                        <p className="ml-3 text-xs font-semibold">{error}</p>
                                    </div>
                                )}

                                <Button
                                    onClick={handleGoogleLogin}
                                    loading={loading}
                                    className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                >
                                    <LogIn className="w-5 h-5" />
                                    <span>Sign in with Google</span>
                                </Button>
                            </div>

                            <div className="mt-10 flex flex-col items-center">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
                                    Authentication Secured via Google
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
                                Link Student
                            </h2>
                            <p className="mt-2 text-center text-sm text-gray-500 mb-8">
                                This seems to be your first time logging in. Please link your child&apos;s USN to continue.
                            </p>

                            <form onSubmit={handleLinkStudent} className="space-y-4">
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

                                <Button
                                    type="submit"
                                    loading={loading}
                                    className="mt-6 w-full"
                                >
                                    Link & Continue
                                </Button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
