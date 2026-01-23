"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  AuthUser,
  getStoredUser,
  validateLogin,
  changePassword as changePasswordFn,
  logout as logoutFn,
} from "@/lib/auth";
import {
  registerForPushNotifications,
  addNotificationListeners,
} from "@/lib/notifications";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (
    usn: string,
    password: string,
  ) => Promise<{ success: boolean; isFirstLogin?: boolean; error?: string }>;
  changePassword: (
    newPassword: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored user on app start
  useEffect(() => {
    async function loadUser() {
      try {
        const storedUser = await getStoredUser();
        if (storedUser) {
          setUser(storedUser);
          // Register for push notifications
          await registerForPushNotifications(storedUser.usn);
          // Ensure user is tagged in OneSignal on refresh
          await tagUserInOneSignal(storedUser.usn);
        }
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  // Listen for foreground notifications
  useEffect(() => {
    if (user) {
      console.log("[Auth] Adding notification listeners for", user.usn);
      const unsubscribe = addNotificationListeners((notification) => {
        console.log("Notification received in foreground:", notification);
      });
      return () => unsubscribe();
    }
  }, [user]);

  /**
   * Tag user in OneSignal on login
   * This allows for targeted notifications
   */
  const tagUserInOneSignal = (usn: string) => {
    if (typeof window === "undefined") return;

    try {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal: any) => {
        try {
          console.log("[Auth] Tagging user in OneSignal:", usn);
          await OneSignal.login(usn);
          if (OneSignal.User) {
            await OneSignal.User.addTag("usn", usn);
          }
          console.log("[Auth] User tagged successfully in OneSignal");
        } catch (err) {
          console.error("[Auth] OneSignal tagging error:", err);
        }
      });
    } catch (e) {
      console.warn("[Auth] OneSignal tagging deferred push failed", e);
    }
  };

  const login = async (usn: string, password: string) => {
    const result = await validateLogin(usn.toUpperCase(), password);
    if (result.success) {
      const usnUpperCase = usn.toUpperCase();
      setUser({ usn: usnUpperCase, isFirstLogin: result.isFirstLogin! });

      // Non-blocking setup
      registerForPushNotifications(usnUpperCase);
      tagUserInOneSignal(usnUpperCase);
    }
    return result;
  };

  const changePassword = async (newPassword: string) => {
    if (!user) {
      return { success: false, error: "Not logged in" };
    }
    const result = await changePasswordFn(user.usn, newPassword);
    if (result.success) {
      setUser({ ...user, isFirstLogin: false });
    }
    return result;
  };

  const logout = async () => {
    await logoutFn();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, changePassword, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
