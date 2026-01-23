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
          // Register for push notifications (includes OneSignal login/tagging)
          await registerForPushNotifications(storedUser.usn);
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

  const login = async (usn: string, password: string) => {
    const result = await validateLogin(usn.toUpperCase(), password);
    if (result.success) {
      const usnUpperCase = usn.toUpperCase();
      setUser({ usn: usnUpperCase, isFirstLogin: result.isFirstLogin! });

      // Non-blocking setup - handled entirely by the unified helper
      registerForPushNotifications(usnUpperCase);
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
