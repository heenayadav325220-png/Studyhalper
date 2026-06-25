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
  User as FirebaseUser
} from "firebase/auth";
import { 
  getFirestore, 
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
  writeBatch
} from "firebase/firestore";

// Public Firebase config credentials from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyDabGlcgDJHqvvPGGuecGnogqHztNvS-Kc",
  authDomain: "planar-surfer-plkqp.firebaseapp.com",
  projectId: "planar-surfer-plkqp",
  storageBucket: "planar-surfer-plkqp.firebasestorage.app",
  messagingSenderId: "45675025134",
  appId: "1:45675025134:web:56f8bbbc7780f37dff19ff"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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
  writeBatch
};
export type { FirebaseUser };
