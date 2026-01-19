import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { appDb, dataDb } from "./firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "auth_user";
const DEFAULT_PASSWORD = "parent@123";

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
    const studentRef = doc(dataDb, "students", usn);
    const studentSnap = await getDoc(studentRef);
    return studentSnap.exists();
  } catch (error) {
    console.error("Error checking student:", error);
    return false;
  }
}

// Create default credentials for a student if not exists
export async function ensureCredentialsExist(usn: string): Promise<void> {
  const credRef = doc(appDb, "parentCredentials", usn);
  const credSnap = await getDoc(credRef);

  if (!credSnap.exists()) {
    await setDoc(credRef, {
      password: hashPassword(DEFAULT_PASSWORD),
      isFirstLogin: true,
      fcmToken: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

// Validate login credentials
export async function validateLogin(
  usn: string,
  password: string
): Promise<{ success: boolean; isFirstLogin?: boolean; error?: string }> {
  try {
    // Check if student exists
    const studentExists = await checkStudentExists(usn);
    if (!studentExists) {
      return { success: false, error: "Invalid USN. Student not found." };
    }

    // Ensure credentials exist (auto-create with default password)
    await ensureCredentialsExist(usn);

    // Get credentials
    const credRef = doc(appDb, "parentCredentials", usn);
    const credSnap = await getDoc(credRef);
    const credData = credSnap.data();

    if (!credData) {
      return { success: false, error: "Credentials not found." };
    }

    // Check password
    const hashedInput = hashPassword(password);
    if (credData.password !== hashedInput) {
      return { success: false, error: "Incorrect password." };
    }

    // Save to local storage
    const authUser: AuthUser = {
      usn,
      isFirstLogin: credData.isFirstLogin,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));

    return { success: true, isFirstLogin: credData.isFirstLogin };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "Login failed. Please try again." };
  }
}

// Change password
export async function changePassword(
  usn: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const credRef = doc(appDb, "parentCredentials", usn);
    await updateDoc(credRef, {
      password: hashPassword(newPassword),
      isFirstLogin: false,
      updatedAt: serverTimestamp(),
    });

    // Update local storage
    const authUser: AuthUser = { usn, isFirstLogin: false };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));

    return { success: true };
  } catch (error) {
    console.error("Password change error:", error);
    return { success: false, error: "Failed to change password." };
  }
}

// Get stored user
export async function getStoredUser(): Promise<AuthUser | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
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
  await AsyncStorage.removeItem(STORAGE_KEY);
}

// Update FCM token
export async function updateFcmToken(
  usn: string,
  token: string
): Promise<void> {
  try {
    const credRef = doc(appDb, "parentCredentials", usn);
    await updateDoc(credRef, {
      fcmToken: token,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to update FCM token:", error);
  }
}
