"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  AuthUser,
  signInWithGoogle,
  getLinkedUsn,
  linkUsnToAccount,
  logout as logoutFn,
  cacheAuthUser,
  getCachedAuthUser
} from "@/lib/auth";
import {
  registerForPushNotifications,
  addNotificationListeners,
} from "@/lib/notifications";

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: User | null;
  isLoading: boolean;
  loginWithGoogle: () => Promise<{ success: boolean; needsUsnLink?: boolean; error?: string }>;
  linkStudent: (usn: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Monitor Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);
      
      if (currentUser) {
        // Fetch linked USN from Firestore
        const usn = await getLinkedUsn(currentUser.uid);
        if (usn) {
          const authUser = {
            usn,
            email: currentUser.email || undefined,
            uid: currentUser.uid,
            isFirstLogin: false
          };
          setUser(authUser);
          cacheAuthUser(authUser);
          registerForPushNotifications(usn);
        } else {
          // They are logged in with Google but haven't linked a student USN yet
          setUser(null); // Keep user null so they are forced to link USN in the UI
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen for foreground notifications
  useEffect(() => {
    if (user) {
      const unsubscribe = addNotificationListeners((notification) => {
        // Custom logic for handling notification clicks or showing toasts if needed
      });
      return () => unsubscribe();
    }
  }, [user]);

  const loginWithGoogle = async () => {
    const result = await signInWithGoogle();
    if (result.success && result.user) {
      const usn = await getLinkedUsn(result.user.uid);
      if (usn) {
        const authUser = {
          usn,
          email: result.user.email || undefined,
          uid: result.user.uid,
          isFirstLogin: false
        };
        setUser(authUser);
        cacheAuthUser(authUser);
        registerForPushNotifications(usn);
        return { success: true, needsUsnLink: false };
      } else {
        return { success: true, needsUsnLink: true };
      }
    }
    return { success: false, error: result.error || "Login Failed" };
  };

  const linkStudent = async (usn: string) => {
    if (!firebaseUser) {
      return { success: false, error: "Not logged into Google Auth." };
    }
    if (!firebaseUser.email) {
      return { success: false, error: "Google account has no email." };
    }
    
    // Convert to upper case and trim for consistent DB queries
    const usnUpperCase = usn.trim().toUpperCase();

    const linkResult = await linkUsnToAccount(firebaseUser.uid, firebaseUser.email, usnUpperCase);
    
    if (linkResult.success) {
      const authUser = {
        usn: usnUpperCase,
        email: firebaseUser.email,
        uid: firebaseUser.uid,
        isFirstLogin: false
      };
      setUser(authUser);
      cacheAuthUser(authUser);
      registerForPushNotifications(usnUpperCase);
      return { success: true };
    } else {
      return { success: false, error: linkResult.error };
    }
  };

  const logout = async () => {
    await logoutFn();
    setUser(null);
    setFirebaseUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, firebaseUser, isLoading, loginWithGoogle, linkStudent, logout }}
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
