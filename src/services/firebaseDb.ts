import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  where, 
  orderBy 
} from './firebase';
import type { UserProfile, RoomChatMessage, WhiteboardElement, MockExam, StudyDocument } from '../types';

// Fallback Helper: Is user offline or Firestore uninitialized?
const isOffline = () => !navigator.onLine;

// --- USER PROFILE ---
export function subscribeUserProfile(userId: string, callback: (profile: UserProfile | null) => void) {
  if (!db) {
    callback(null);
    return () => {};
  }
  try {
    const userRef = doc(db, "users", userId);
    return onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as UserProfile);
      } else {
        callback(null);
      }
    }, (error) => {
      console.warn("UserProfile snapshot error, falling back:", error);
      callback(null);
    });
  } catch (err) {
    console.warn("Failed to subscribe user profile:", err);
    callback(null);
    return () => {};
  }
}

export async function updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
  // Always persist to localStorage for seamless fallback
  try {
    const local = localStorage.getItem(`user_profile_${userId}`);
    const parsed = local ? JSON.parse(local) : {};
    const updated = { ...parsed, ...profile, lastActive: new Date().toISOString() };
    localStorage.setItem(`user_profile_${userId}`, JSON.stringify(updated));
  } catch (e) {
    console.warn("Failed to write user profile to localStorage:", e);
  }

  if (!db || isOffline()) {
    return;
  }
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, { ...profile, lastActive: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn("Firestore updateUserProfile warning:", err);
  }
}

// --- STUDY ROOM CHATS ---
export function subscribeToChats(roomId: string, callback: (messages: RoomChatMessage[]) => void) {
  if (!db) {
    callback([]);
    return () => {};
  }
  try {
    const chatsRef = collection(db, `rooms/${roomId}/chats`);
    const q = query(chatsRef, orderBy("timestamp", "asc"));
    return onSnapshot(q, (snapshot) => {
      const messages: RoomChatMessage[] = [];
      snapshot.forEach((d) => {
        messages.push({ id: d.id, ...d.data() } as RoomChatMessage);
      });
      callback(messages);
    }, (error) => {
      console.warn("Chats snapshot error:", error);
      callback([]);
    });
  } catch (err) {
    console.warn("Failed to subscribe to chats:", err);
    callback([]);
    return () => {};
  }
}

export async function sendGroupMessage(roomId: string, text: string, senderId: string, senderName: string): Promise<void> {
  const msgId = doc(collection(db || {}, "temp")).id;
  const newMessage: RoomChatMessage = {
    id: msgId,
    roomId,
    senderId,
    senderName,
    text,
    timestamp: new Date().toISOString()
  };

  if (!db || isOffline()) {
    const key = `local_chats_${roomId}`;
    const local = JSON.parse(localStorage.getItem(key) || "[]");
    local.push(newMessage);
    localStorage.setItem(key, JSON.stringify(local));
    return;
  }

  try {
    const chatsRef = collection(db, `rooms/${roomId}/chats`);
    await setDoc(doc(chatsRef, msgId), newMessage);
  } catch (err) {
    console.error("Error sending group message:", err);
  }
}

// --- REAL-TIME CANVAS WHITEBOARD ---
export function subscribeToWhiteboard(roomId: string, callback: (elements: WhiteboardElement[]) => void) {
  if (!db) {
    callback([]);
    return () => {};
  }
  try {
    const wbRef = collection(db, `rooms/${roomId}/whiteboard`);
    const q = query(wbRef, orderBy("timestamp", "asc"));
    return onSnapshot(q, (snapshot) => {
      const elements: WhiteboardElement[] = [];
      snapshot.forEach((d) => {
        elements.push({ id: d.id, ...d.data() } as WhiteboardElement);
      });
      callback(elements);
    }, (error) => {
      console.warn("Whiteboard snapshot error:", error);
      callback([]);
    });
  } catch (err) {
    console.warn("Failed to subscribe to whiteboard:", err);
    callback([]);
    return () => {};
  }
}

export async function addWhiteboardElement(roomId: string, element: Omit<WhiteboardElement, 'id' | 'timestamp'>): Promise<void> {
  const elemId = doc(collection(db || {}, "temp")).id;
  const newElement: WhiteboardElement = {
    id: elemId,
    ...element,
    timestamp: new Date().toISOString()
  };

  if (!db || isOffline()) {
    const key = `local_wb_${roomId}`;
    const local = JSON.parse(localStorage.getItem(key) || "[]");
    local.push(newElement);
    localStorage.setItem(key, JSON.stringify(local));
    return;
  }

  try {
    const wbRef = doc(db, `rooms/${roomId}/whiteboard`, elemId);
    await setDoc(wbRef, newElement);
  } catch (err) {
    console.error("Error adding whiteboard element:", err);
  }
}

export async function deleteWhiteboardElement(roomId: string, elementId: string): Promise<void> {
  if (!db || isOffline()) {
    const key = `local_wb_${roomId}`;
    const local = JSON.parse(localStorage.getItem(key) || "[]") as WhiteboardElement[];
    const filtered = local.filter(e => e.id !== elementId);
    localStorage.setItem(key, JSON.stringify(filtered));
    return;
  }
  try {
    const wbRef = doc(db, `rooms/${roomId}/whiteboard`, elementId);
    await deleteDoc(wbRef);
  } catch (err) {
    console.error("Error deleting whiteboard element:", err);
  }
}

export async function clearWhiteboardRoom(roomId: string): Promise<void> {
  if (!db || isOffline()) {
    localStorage.setItem(`local_wb_${roomId}`, "[]");
    return;
  }
  try {
    const wbRef = collection(db, `rooms/${roomId}/whiteboard`);
    const snapshot = await getDocs(wbRef);
    snapshot.forEach(async (d) => {
      await deleteDoc(doc(db, `rooms/${roomId}/whiteboard`, d.id));
    });
  } catch (err) {
    console.error("Error clearing whiteboard room:", err);
  }
}

// --- MOCK EXAMS ---
export function subscribeToMockExams(userId: string, callback: (exams: MockExam[]) => void) {
  if (!db) {
    callback([]);
    return () => {};
  }
  try {
    const examsRef = collection(db, "exams");
    const q = query(examsRef, where("userId", "==", userId), orderBy("timestamp", "desc"));
    return onSnapshot(q, (snapshot) => {
      const exams: MockExam[] = [];
      snapshot.forEach((d) => {
        exams.push({ id: d.id, ...d.data() } as MockExam);
      });
      callback(exams);
    }, (error) => {
      console.warn("MockExams snapshot error:", error);
      callback([]);
    });
  } catch (err) {
    console.warn("Failed to subscribe to mock exams:", err);
    callback([]);
    return () => {};
  }
}

export async function saveMockExam(exam: MockExam): Promise<void> {
  const cleanExam: MockExam = {
    id: exam.id || 'exam_' + Date.now(),
    userId: exam.userId || 'user_local_student',
    subject: exam.subject || 'General',
    topic: exam.topic || 'General Topic',
    questionsJson: exam.questionsJson || '[]',
    submittedAnswersJson: exam.submittedAnswersJson || '{}',
    score: typeof exam.score === 'number' ? exam.score : 0,
    completed: Boolean(exam.completed),
    feedback: exam.feedback || '',
    timestamp: exam.timestamp || new Date().toISOString()
  };

  if (!db || isOffline()) {
    const key = `local_exams_${cleanExam.userId}`;
    const local = JSON.parse(localStorage.getItem(key) || "[]") as MockExam[];
    const index = local.findIndex(e => e.id === cleanExam.id);
    if (index >= 0) {
      local[index] = cleanExam;
    } else {
      local.unshift(cleanExam);
    }
    localStorage.setItem(key, JSON.stringify(local));
    return;
  }
  try {
    const examRef = doc(db, "exams", cleanExam.id);
    await setDoc(examRef, cleanExam);
  } catch (err) {
    console.error("Error saving mock exam:", err);
  }
}

// --- STUDY DOCUMENTS ---
export function subscribeToStudyDocuments(ownerId: string, callback: (docs: StudyDocument[]) => void) {
  if (!db || !ownerId) {
    callback([]);
    return () => {};
  }
  try {
    const docsRef = collection(db, "documents");
    const q = query(docsRef, where("ownerId", "==", ownerId), orderBy("timestamp", "desc"));
    return onSnapshot(q, (snapshot) => {
      const documents: StudyDocument[] = [];
      snapshot.forEach((d) => {
        documents.push({ id: d.id, ...d.data() } as StudyDocument);
      });
      callback(documents);
    }, (error) => {
      console.warn("StudyDocuments snapshot error:", error);
      callback([]);
    });
  } catch (err) {
    console.warn("Failed to subscribe to study documents:", err);
    callback([]);
    return () => {};
  }
}

export async function saveStudyDocument(document: StudyDocument): Promise<void> {
  const cleanDoc: StudyDocument = {
    id: document.id || 'doc_' + Date.now(),
    ownerId: document.ownerId || 'user_local_student',
    title: document.title || 'Untitled Note',
    content: document.content || '',
    summary: document.summary || '',
    tagsJson: document.tagsJson || '[]',
    isShared: Boolean(document.isShared),
    timestamp: document.timestamp || new Date().toISOString()
  };

  if (!db || isOffline()) {
    const key = `local_docs_${cleanDoc.ownerId}`;
    const local = JSON.parse(localStorage.getItem(key) || "[]") as StudyDocument[];
    const index = local.findIndex(d => d.id === cleanDoc.id);
    if (index >= 0) {
      local[index] = cleanDoc;
    } else {
      local.unshift(cleanDoc);
    }
    localStorage.setItem(key, JSON.stringify(local));
    return;
  }
  try {
    const docRef = doc(db, "documents", cleanDoc.id);
    await setDoc(docRef, cleanDoc);
  } catch (err) {
    console.error("Error saving study document:", err);
  }
}

export async function deleteStudyDocument(ownerId: string, documentId: string): Promise<void> {
  if (!db || isOffline()) {
    const key = `local_docs_${ownerId}`;
    const local = JSON.parse(localStorage.getItem(key) || "[]") as StudyDocument[];
    const filtered = local.filter(d => d.id !== documentId);
    localStorage.setItem(key, JSON.stringify(filtered));
    return;
  }
  try {
    const docRef = doc(db, "documents", documentId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error("Error deleting study document:", err);
  }
}
