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
  signInWithRedirect,
  getRedirectResult,
  linkWithCredential,
  EmailAuthProvider,
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

const getEnv = (key: string) => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
      return (import.meta as any).env[key];
    }
  } catch {}
  return process.env[key];
};

// Read configuration from environment variables (for Vercel/Production) with fallback to default JSON
const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY') || defaultFirebaseConfig.apiKey,
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || defaultFirebaseConfig.authDomain,
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || defaultFirebaseConfig.projectId,
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || defaultFirebaseConfig.storageBucket,
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || defaultFirebaseConfig.messagingSenderId,
  appId: getEnv('VITE_FIREBASE_APP_ID') || defaultFirebaseConfig.appId,
  databaseURL: getEnv('VITE_FIREBASE_DATABASE_URL') || (defaultFirebaseConfig as any).databaseURL,
  firestoreDatabaseId: getEnv('VITE_FIREBASE_DATABASE_ID') || (defaultFirebaseConfig as any).firestoreDatabaseId
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

let db: any;
try {
  const dbOptions = {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  };
  db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? initializeFirestore(app, dbOptions, firebaseConfig.firestoreDatabaseId)
    : initializeFirestore(app, dbOptions);
} catch (e) {
  console.warn("Could not initialize Firestore with persistent local cache, falling back to standard getFirestore:", e);
  db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
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
  
  if (code.includes('operation-not-allowed') || code.includes('password_login_disabled')) {
    return isHindiMode
      ? 'यह साइन-इन विधि सक्षम नहीं है। कृपया दूसरी विधि का उपयोग करें।'
      : 'This sign-in method is not enabled. Please contact support or use another method.';
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
    return isHindiMode 
      ? 'अमान्य ईमेल पता। कृपया सही ईमेल दर्ज करें।' 
      : 'Please enter a valid email address.';
  }
  if (code.includes('unauthorized-domain')) {
    return isHindiMode 
      ? 'यह डोमेन प्रमाणीकरण के लिए अधिकृत नहीं है।' 
      : 'This domain is not authorized for authentication in Firebase console.';
  }
  if (code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request')) {
    return isHindiMode 
      ? 'गूगल साइन-इन विंडो बंद कर दी गई थी।' 
      : 'Google Sign-In popup was closed before completing.';
  }
  if (code.includes('popup-blocked')) {
    return isHindiMode 
      ? 'ब्राउज़र ने पॉपअप ब्लॉक कर दिया। कृपया पॉपअप की अनुमति दें।' 
      : 'Popup was blocked by your browser. Please allow popups for this site.';
  }
  if (code.includes('network-request-failed')) {
    return isHindiMode 
      ? 'इंटरनेट कनेक्शन में समस्या है। कृपया नेटवर्क जांचें।' 
      : 'Network error. Please check your internet connection.';
  }
  if (code.includes('too-many-requests')) {
    return isHindiMode 
      ? 'बहुत सारे असफल प्रयास। कृपया थोड़ी देर बाद पुनः प्रयास करें।' 
      : 'Access temporarily blocked due to many failed attempts. Please try again in a few moments.';
  }
  if (code.includes('account-exists-with-different-credential')) {
    return isHindiMode
      ? 'इसी ईमेल पते से एक खाता पहले से मौजूद है।'
      : 'An account already exists with the same email address but different sign-in credentials.';
  }
  if (code.includes('requires-recent-login')) {
    return isHindiMode
      ? 'यह संवेदनशील कार्रवाई है जिसके लिए हालिया लॉगिन की आवश्यकता है।'
      : 'This operation requires recent authentication. Please sign in again and retry.';
  }
  return errorCodeOrMessage || (isHindiMode ? 'प्रमाणीकरण विफल रहा।' : 'Authentication failed.');
}

export function withTimeout<T>(promise: Promise<T>, _ms: number = 60000, _fallbackMessage: string = 'Operation timed out'): Promise<T> {
  return promise;
}

/**
 * Sign in with Google Popup with fallback to redirect
 */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const res = await signInWithPopup(auth, provider);
    return res.user;
  } catch (err: any) {
    const code = (err?.code || '').toLowerCase();
    if (code.includes('popup-blocked') || code.includes('popup-closed-by-user') || code.includes('operation-not-supported-in-this-environment') || code.includes('cancelled-popup-request')) {
      await signInWithRedirect(auth, provider);
      const res = await getRedirectResult(auth);
      if (res?.user) return res.user;
    }
    throw err;
  }
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
  signInWithRedirect,
  getRedirectResult,
  linkWithCredential,
  EmailAuthProvider,
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
