import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase project with students and attendance data
const dataFirebaseConfig = {
  apiKey: "AIzaSyB1f5KQac31IPY-CWJ4IN-lb3ElRtRwuME",
  authDomain: "nest-school-barcode-ims.firebaseapp.com",
  projectId: "nest-school-barcode-ims",
  storageBucket: "nest-school-barcode-ims.firebasestorage.app",
  messagingSenderId: "663780876768",
  appId: "1:663780876768:web:1e574fa6ecddd1b96acb85",
};

// Firebase project for parent app (credentials, FCM)
const appFirebaseConfig = {
  apiKey: "AIzaSyCnTTRtlgk0yN_PjkCpCXBEjXymzfBuPGk",
  authDomain: "nest-erp-app.firebaseapp.com",
  projectId: "nest-erp-app",
  storageBucket: "nest-erp-app.firebasestorage.app",
  messagingSenderId: "1044796306871",
  appId: "1:1044796306871:web:b0de9878e805c78af02432",
};

// Initialize Firebase apps
const dataApp =
  getApps().find((app) => app.name === "data") ||
  initializeApp(dataFirebaseConfig, "data");

const mainApp =
  getApps().find((app) => app.name === "[DEFAULT]") ||
  initializeApp(appFirebaseConfig);

// Firestore instances
export const dataDb = getFirestore(dataApp); // For students & attendance
export const appDb = getFirestore(mainApp); // For parent credentials & FCM tokens

export { dataApp, mainApp };
