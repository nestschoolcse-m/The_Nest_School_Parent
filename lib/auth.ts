import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { dataDb, auth, googleProvider } from "./firebase";
import { signInWithPopup, signOut } from "firebase/auth";

export interface AuthUser {
  usn: string;
  isFirstLogin: boolean;
  email?: string;
  uid?: string;
}

// Storage helper for web (optional fallback/caching)
const webStorage = {
  getItem: (key: string) => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key);
    }
  },
};

const STORAGE_KEY = "auth_user_cache";

// Check if student exists in data database
export async function checkStudentExists(usn: string): Promise<boolean> {
  try {
    const studentRef = doc(dataDb, "students", usn);
    const studentSnap = await getDoc(studentRef);
    return studentSnap.exists();
  } catch (error: any) {
    console.error("[Auth] Error checking student in dataDb:", error.code, error.message);
    return false;
  }
}

// Get linked USN for a given Firebase Auth UID
export async function getLinkedUsn(uid: string): Promise<string | null> {
  try {
    const userRef = doc(dataDb, "parentUsers", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data()?.usn || null;
    }
    return null;
  } catch (error: any) {
    console.error("[Auth] Error fetching linked USN:", error.code, error.message);
    return null;
  }
}

// Link a USN to a specific Firebase Auth UID
export async function linkUsnToAccount(uid: string, email: string, usn: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify USN exists first
    const studentExists = await checkStudentExists(usn);
    if (!studentExists) {
      return { success: false, error: "Invalid USN. Student not found." };
    }

    // Save mapping to parentUsers collection
    const userRef = doc(dataDb, "parentUsers", uid);
    await setDoc(userRef, {
      email,
      usn,
      linkedAt: serverTimestamp(),
    });
    
    // Also ensure parentCredentials doc exists so FCM tokens can be saved
    const credRef = doc(dataDb, "parentCredentials", usn);
    await setDoc(credRef, {
      email,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return { success: true };
  } catch (error: any) {
    console.error("[Auth] Error linking USN:", error.code, error.message);
    return { success: false, error: "Failed to link student USN." };
  }
}

// Sign in with Google
export async function signInWithGoogle(): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { success: true, user: result.user };
  } catch (error: any) {
    console.error("[Auth] Google Sign-in error:", error.code, error.message);
    return { success: false, error: error.message };
  }
}

// Logout
export async function logout(): Promise<void> {
  try {
    await signOut(auth);
    webStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("[Auth] Logout error:", error);
  }
}

// Update FCM token
export async function updateFcmToken(
  usn: string,
  token: string
): Promise<void> {
  try {
    const credRef = doc(dataDb, "parentCredentials", usn);
    await setDoc(credRef, {
      fcmToken: token,
      updatedAt: serverTimestamp(),
    }, { merge: true }); // using setDoc with merge in case the doc doesn't exist
  } catch (error) {
    console.error("Failed to update FCM token:", error);
  }
}

// Cache helpers
export function cacheAuthUser(user: AuthUser) {
  webStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function getCachedAuthUser(): AuthUser | null {
  try {
    const stored = webStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    return null;
  }
  return null;
}
