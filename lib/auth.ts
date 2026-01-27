import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { dataDb } from "./firebase";

const STORAGE_KEY = "auth_user";
const DEFAULT_PASSWORD = "parent@123";

// Storage helper for web
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

export interface AuthUser {
  usn: string;
  isFirstLogin: boolean;
}

// Simple hash function (for demo - use bcrypt in production)
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

// Check if student exists in data database
export async function checkStudentExists(usn: string): Promise<boolean> {
  try {
    console.log("[Auth] Checking student existence in dataDb for USN:", usn);
    const studentRef = doc(dataDb, "students", usn);
    const studentSnap = await getDoc(studentRef);
    const exists = studentSnap.exists();
    console.log("[Auth] Student exists in dataDb:", exists);
    return exists;
  } catch (error: any) {
    console.error("[Auth] Error checking student in dataDb:", error.code, error.message);
    return false;
  }
}

// Create default credentials for a student if not exists
export async function ensureCredentialsExist(usn: string): Promise<void> {
  try {
    console.log("[Auth] Ensuring credentials exist in dataDb for USN:", usn);
    const credRef = doc(dataDb, "parentCredentials", usn);
    const credSnap = await getDoc(credRef);

    if (!credSnap.exists()) {
      console.log("[Auth] Credentials not found in dataDb, creating default...");
      await setDoc(credRef, {
        password: hashPassword(DEFAULT_PASSWORD),
        isFirstLogin: true,
        fcmToken: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log("[Auth] Default credentials created successfully.");
    } else {
      console.log("[Auth] Credentials already exist in dataDb.");
    }
  } catch (error: any) {
    console.error("[Auth] Error in ensureCredentialsExist:", error.code, error.message);
    throw error; // Re-throw to catch in validateLogin
  }
}

// Validate login credentials
export async function validateLogin(
  usn: string,
  password: string
): Promise<{ success: boolean; isFirstLogin?: boolean; error?: string }> {
  try {
    console.log("[Auth] Starting login validation for USN:", usn);
    // Check if student exists
    const studentExists = await checkStudentExists(usn);
    if (!studentExists) {
      console.log("[Auth] Login failed: Student not found in dataDb.");
      return { success: false, error: "Invalid USN. Student not found." };
    }

    // Ensure credentials exist (auto-create with default password)
    await ensureCredentialsExist(usn);

    // Get credentials
    const credRef = doc(dataDb, "parentCredentials", usn);
    const credSnap = await getDoc(credRef);
    const credData = credSnap.data();

    if (!credData) {
      console.log("[Auth] Login failed: Credentials missing after check.");
      return { success: false, error: "Credentials not found." };
    }

    // Check password
    const hashedInput = hashPassword(password);
    if (credData.password !== hashedInput) {
      console.log("[Auth] Login failed: Incorrect password.");
      return { success: false, error: "Incorrect password." };
    }

    // Save to local storage
    const authUser: AuthUser = {
      usn,
      isFirstLogin: credData.isFirstLogin,
    };
    webStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));

    console.log("[Auth] Login successful!");
    return { success: true, isFirstLogin: credData.isFirstLogin };
  } catch (error: any) {
    console.error("[Auth] Critical login error:", error.code, error.message);
    return {
      success: false,
      error: error.code === 'permission-denied'
        ? "Access Denied. Check your Firestore Rules."
        : `Login failed: ${error.message}`
    };
  }
}

// Change password
export async function changePassword(
  usn: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const credRef = doc(dataDb, "parentCredentials", usn);
    await updateDoc(credRef, {
      password: hashPassword(newPassword),
      isFirstLogin: false,
      updatedAt: serverTimestamp(),
    });

    // Update local storage
    const authUser: AuthUser = { usn, isFirstLogin: false };
    webStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));

    return { success: true };
  } catch (error) {
    console.error("Password change error:", error);
    return { success: false, error: "Failed to change password." };
  }
}

// Get stored user
export async function getStoredUser(): Promise<AuthUser | null> {
  try {
    const stored = webStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Logout
export async function logout(): Promise<void> {
  webStorage.removeItem(STORAGE_KEY);
}

// Update FCM token
export async function updateFcmToken(
  usn: string,
  token: string
): Promise<void> {
  try {
    const credRef = doc(dataDb, "parentCredentials", usn);
    await updateDoc(credRef, {
      fcmToken: token,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to update FCM token:", error);
  }
}
