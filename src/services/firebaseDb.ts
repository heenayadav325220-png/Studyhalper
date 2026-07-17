import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  addDoc,
  query,
  orderBy,
  deleteDoc,
  getDocs,
  where
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { UserProfile, ChatMessage, WhiteboardElement, MockExam, StudyDocument } from '../types';

// Load values directly from firebase-applet-config.json
const firebaseConfig = {
  projectId: "planar-surfer-plkqp",
  appId: "1:45675025134:web:56f8bbbc7780f37dff19ff",
  apiKey: "AIzaSyDabGlcgDJHqvvPGGuecGnogqHztNvS-Kc",
  authDomain: "planar-surfer-plkqp.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-remixstudybuddya-041806f4-3ae7-4c23-ad72-bf4baedde267",
  storageBucket: "planar-surfer-plkqp.firebasestorage.app",
  messagingSenderId: "45675025134",
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Helper to handle Auth
export async function authenticateAnonymously(onUserReady: (user: User) => void) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      onUserReady(user);
    } else {
      try {
        const credential = await signInAnonymously(auth);
        if (credential.user) {
          onUserReady(credential.user);
        }
      } catch (err) {
        console.error("Firebase auth error:", err);
      }
    }
  });
}

// User Profile Service
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(db, 'users', uid);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as UserProfile;
  }
  return null;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const docRef = doc(db, 'users', profile.uid);
  await setDoc(docRef, profile, { merge: true });
}

// real-time synchronization of chats
export function subscribeToChats(roomId: string, callback: (messages: ChatMessage[]) => void) {
  const collRef = collection(db, 'rooms', roomId, 'chats');
  const q = query(collRef, orderBy('timestamp', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const chats: ChatMessage[] = [];
    snapshot.forEach((d) => {
      chats.push({ id: d.id, ...d.data() } as ChatMessage);
    });
    callback(chats);
  }, (err) => {
    console.error("Chats subscription error:", err);
  });
}

export async function sendChatMessage(roomId: string, message: Omit<ChatMessage, 'id'>) {
  const collRef = collection(db, 'rooms', roomId, 'chats');
  await addDoc(collRef, message);
}

// real-time synchronization of whiteboard elements
export function subscribeToWhiteboard(roomId: string, callback: (elements: WhiteboardElement[]) => void) {
  const collRef = collection(db, 'rooms', roomId, 'whiteboard');
  const q = query(collRef, orderBy('timestamp', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const elements: WhiteboardElement[] = [];
    snapshot.forEach((d) => {
      elements.push({ id: d.id, ...d.data() } as WhiteboardElement);
    });
    callback(elements);
  }, (err) => {
    console.error("Whiteboard subscription error:", err);
  });
}

export async function addWhiteboardElement(roomId: string, element: Omit<WhiteboardElement, 'id'>) {
  const collRef = collection(db, 'rooms', roomId, 'whiteboard');
  const docRef = await addDoc(collRef, element);
  return docRef.id;
}

export async function clearWhiteboardRoom(roomId: string) {
  const collRef = collection(db, 'rooms', roomId, 'whiteboard');
  const snapshot = await getDocs(collRef);
  const batchPromises = snapshot.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(batchPromises);
}

// real-time synchronization/listing of mock exams
export function subscribeToExams(userId: string, callback: (exams: MockExam[]) => void) {
  const collRef = collection(db, 'exams');
  const q = query(collRef, where('userId', '==', userId), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const exams: MockExam[] = [];
    snapshot.forEach((d) => {
      exams.push({ id: d.id, ...d.data() } as MockExam);
    });
    callback(exams);
  }, (err) => {
    console.error("Exams subscription error:", err);
  });
}

export async function saveMockExam(exam: MockExam) {
  const docRef = doc(db, 'exams', exam.id);
  await setDoc(docRef, exam);
}

// real-time synchronization/listing of study documents
export function subscribeToDocuments(userId: string, callback: (docs: StudyDocument[]) => void) {
  const collRef = collection(db, 'documents');
  const q = query(collRef, orderBy('timestamp', 'desc')); // Subscribe to all so we support "shared" too
  return onSnapshot(q, (snapshot) => {
    const docs: StudyDocument[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as StudyDocument;
      if (data.ownerId === userId || data.isShared) {
        docs.push({ ...data, id: d.id });
      }
    });
    callback(docs);
  }, (err) => {
    console.error("Documents subscription error:", err);
  });
}

export async function saveStudyDocument(docItem: StudyDocument) {
  const docRef = doc(db, 'documents', docItem.id);
  await setDoc(docRef, docItem);
}
