import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase project with students, attendance data, and parent credentials
const dataFirebaseConfig = {
  apiKey: "AIzaSyB1f5KQac31IPY-CWJ4IN-lb3ElRtRwuME",
  authDomain: "nest-school-barcode-ims.firebaseapp.com",
  projectId: "nest-school-barcode-ims",
  storageBucket: "nest-school-barcode-ims.firebasestorage.app",
  messagingSenderId: "663780876768",
  appId: "1:663780876768:web:1e574fa6ecddd1b96acb85",
};

// Initialize Firebase app
const dataApp =
  getApps().find((app) => app.name === "[DEFAULT]") ||
  initializeApp(dataFirebaseConfig);

// Firestore instance - used for students, attendance, and parentCredentials
export const dataDb = getFirestore(dataApp);

export { dataApp };
