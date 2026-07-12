import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// ==========================================
// 🚀 ENTERPRISE CONFIGURATION
// ==========================================
export const APP_CONFIG = {
  // If you change the appName here, all content names of the website will update dynamically!
  appName: 'AssetFlow', 
};

// Real live Firebase configuration provided by the user
export const firebaseConfig = {
  apiKey: "AIzaSyCu615mXclQVBX0Mp0Fd6bqt65uRr8QXSs",
  authDomain: "odoo-odoo-26.firebaseapp.com",
  projectId: "odoo-odoo-26",
  storageBucket: "odoo-odoo-26.firebasestorage.app",
  messagingSenderId: "540464051868",
  appId: "1:540464051868:web:ec123cc011b00bed1b1f59",
  measurementId: "G-W76L6MS4XC"
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
let authInstance: any = null;

if (isFirebaseConfigured()) {
  try {
    appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    dbInstance = getFirestore(appInstance);
    authInstance = getAuth(appInstance);
    console.log("🔥 Connected to Firebase Firestore and Auth successfully!");
  } catch (error) {
    console.error("⚠️ Error initializing Firebase. Falling back to local reactive storage:", error);
  }
} else {
  console.log("ℹ_ Using reactive local storage. Replace placeholders in src/app/firebase.ts with your Firebase keys to connect to Firestore.");
}

export const db = dbInstance;
export const app = appInstance;
export const auth = authInstance;

