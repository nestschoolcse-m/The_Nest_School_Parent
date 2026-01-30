import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { env } from "process";
// Firebase project with students, attendance data, and parent credentials
const dataFirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NECT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGE_SENDER_ID,
  appId:  process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase app
const dataApp =
  getApps().find((app) => app.name === "[DEFAULT]") ||
  initializeApp(dataFirebaseConfig);

// Firestore instance - used for students, attendance, and parentCredentials
export const dataDb = getFirestore(dataApp);

export { dataApp };
