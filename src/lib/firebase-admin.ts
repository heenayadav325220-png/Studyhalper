import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json' with { type: "json" };

const resolvedProjectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId;

console.log(`[Firebase-Admin] Initialized with Project ID: ${resolvedProjectId}`);

if (process.env.VITE_FIREBASE_PROJECT_ID && process.env.FIREBASE_PROJECT_ID && process.env.VITE_FIREBASE_PROJECT_ID !== process.env.FIREBASE_PROJECT_ID) {
  console.warn(`[Firebase-Admin] WARNING: VITE_FIREBASE_PROJECT_ID (${process.env.VITE_FIREBASE_PROJECT_ID}) and FIREBASE_PROJECT_ID (${process.env.FIREBASE_PROJECT_ID}) are both set and differ!`);
}

if (!getApps().length) {
  initializeApp({
    projectId: resolvedProjectId,
  });
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();

