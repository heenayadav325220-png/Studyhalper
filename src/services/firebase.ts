import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
  User as FirebaseUser
} from "firebase/auth";
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  arrayUnion,
  increment,
  writeBatch,
  serverTimestamp
} from "firebase/firestore";

import defaultFirebaseConfig from "../../firebase-applet-config.json";

// Read configuration from environment variables (for Vercel/Production) with fallback to default JSON
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultFirebaseConfig.appId,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || (defaultFirebaseConfig as any).databaseURL,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || (defaultFirebaseConfig as any).firestoreDatabaseId || "(default)"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

let db: any;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  }, firebaseConfig.firestoreDatabaseId);
} catch (e) {
  console.warn("Could not initialize Firestore with persistent local cache, falling back to standard getFirestore:", e);
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  let errorString = '';
  try {
    errorString = JSON.stringify(errInfo);
  } catch (e) {
    errorString = `Firestore Error (${operationType} at ${path}): ${errInfo.error}`;
  }
  console.error('Firestore Error: ', errorString);
  throw new Error(errorString);
}

/**
 * Maps Firebase Auth error codes to user-friendly messages in English and Hindi
 */
export function getFriendlyAuthErrorMessage(errorCodeOrMessage: string, lang: string = 'en'): string {
  const code = (errorCodeOrMessage || '').toLowerCase();
  const isHindiMode = lang === 'hi' || lang === 'hinglish' || lang === 'marathi' || lang === 'tamil' || lang === 'bengali';
  
  if (code.includes('operation-not-allowed')) {
    return isHindiMode
      ? 'ईमेल/पासवर्ड प्रमाणीकरण सक्रिय हो रहा है...'
      : 'Email/Password sign-in method is being configured. Using secure local session sync.';
  }
  if (code.includes('user-not-found') || code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('invalid-login-credentials')) {
    return isHindiMode 
      ? 'गलत ईमेल या पासवर्ड। कृपया पुनः जांचें।' 
      : 'Invalid email or password. Please verify your credentials.';
  }
  if (code.includes('email-already-in-use')) {
    return isHindiMode 
      ? 'यह ईमेल पहले से पंजीकृत है। कृपया लॉग इन करें।' 
      : 'This email is already registered. Please sign in instead.';
  }
  if (code.includes('weak-password')) {
    return isHindiMode 
      ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' 
      : 'Password is too weak. Please use at least 6 characters.';
  }
  if (code.includes('invalid-email')) {
    return lang === 'hi' 
      ? 'अमान्य ईमेल पता। कृपया सही ईमेल दर्ज करें।' 
      : 'Please enter a valid email address.';
  }
  if (code.includes('unauthorized-domain')) {
    return lang === 'hi' 
      ? 'Google Login ke liye domain authorized hona zaroori hai. Tab tak aap Email & Password se bina kisi restriction ke 100% login kar sakte hain!' 
      : 'Google Sign-In requires an authorized domain. You can use Email & Password sign-in which works 100% on any domain without restrictions!';
  }
  if (code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request')) {
    return lang === 'hi' 
      ? 'गूगल साइन-इन विंडो बंद कर दी गई थी।' 
      : 'Google Sign-In popup was closed before completing.';
  }
  if (code.includes('popup-blocked')) {
    return lang === 'hi' 
      ? 'ब्राउज़र ने पॉपअप ब्लॉक कर दिया। कृपया पॉपअप की अनुमति दें।' 
      : 'Popup was blocked by your browser. Please allow popups for this site.';
  }
  if (code.includes('network-request-failed')) {
    return lang === 'hi' 
      ? 'इंटरनेट कनेक्शन में समस्या है। कृपया नेटवर्क जांचें।' 
      : 'Network error. Please check your internet connection.';
  }
  if (code.includes('too-many-requests')) {
    return lang === 'hi' 
      ? 'बहुत सारे असफल प्रयास। कृपया थोड़ी देर बाद पुनः प्रयास करें।' 
      : 'Access temporarily blocked due to many failed attempts. Please try again in a few moments.';
  }
  return errorCodeOrMessage || (lang === 'hi' ? 'प्रमाणीकरण विफल रहा।' : 'Authentication failed.');
}

/**
 * Helper to prevent async network operations from hanging indefinitely
 */
export function withTimeout<T>(promise: Promise<T>, ms: number = 3500, fallbackMessage: string = 'Operation timed out'): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(fallbackMessage)), ms))
  ]);
}

/**
 * Sign in with Google Popup (with safe generous timeout for human interaction)
 */
export async function signInWithGoogle(timeoutMs: number = 90000): Promise<FirebaseUser> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const popupPromise = signInWithPopup(auth, provider).then(res => res.user);
  return withTimeout(popupPromise, timeoutMs, 'Google sign-in timed out or popup was restricted.');
}

/**
 * Send password reset email
 */
export async function sendUserPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export { 
  app, 
  auth, 
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  arrayUnion,
  increment,
  writeBatch,
  serverTimestamp
};
export type { FirebaseUser };
