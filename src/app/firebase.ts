import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// ==========================================
// 🚀 ENTERPRISE CONFIGURATION
// ==========================================
export const APP_CONFIG = {
  // If you change the appName here, all content names of the website will update dynamically!
  appName: 'AssetFlow', 
};

// Replace these placeholders with your actual Firebase Project config
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Check if developer has replaced the placeholder keys
export const isFirebaseConfigured = (): boolean => {
  return (
    firebaseConfig.apiKey !== "YOUR_API_KEY" &&
    firebaseConfig.projectId !== "YOUR_PROJECT_ID" &&
    firebaseConfig.apiKey.trim() !== "" &&
    firebaseConfig.projectId.trim() !== ""
  );
};

// Initialize Firebase app if configured; otherwise, fall back to reactive mockup engine
let dbInstance: any = null;
let appInstance: any = null;

if (isFirebaseConfigured()) {
  try {
    appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    dbInstance = getFirestore(appInstance);
    console.log("🔥 Connected to Firebase Firestore successfully!");
  } catch (error) {
    console.error("⚠️ Error initializing Firebase. Falling back to local reactive storage:", error);
  }
} else {
  console.log("ℹ️ Using reactive local storage. Replace placeholders in src/app/firebase.ts with your Firebase keys to connect to Firestore.");
}

export const db = dbInstance;
export const app = appInstance;
