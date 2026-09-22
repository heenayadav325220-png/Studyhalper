import { 
  auth,
  db, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  limit,
  writeBatch
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
    const verifiedUid = auth.currentUser?.uid || userId;
    const userRef = doc(db, "users", verifiedUid);
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

// Write coalescing and debouncing for user profile updates
// Prevents generating multiple Firestore document writes when XP/streaks/stats update rapidly
let profileSyncTimer: any = null;
let pendingProfileBatch: Record<string, Partial<UserProfile>> = {};

export async function updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
  const verifiedUid = auth.currentUser?.uid || userId;
  // Always persist immediately to localStorage for zero-latency local UX
  try {
    const local = localStorage.getItem(`user_profile_${verifiedUid}`);
    const parsed = local ? JSON.parse(local) : {};
    const updated = { ...parsed, ...profile, uid: verifiedUid };
    localStorage.setItem(`user_profile_${verifiedUid}`, JSON.stringify(updated));
    localStorage.setItem('ascend_user_profile', JSON.stringify(updated));
  } catch (e) {
    console.warn("Failed to write user profile to localStorage:", e);
  }

  if (!db || isOffline() || !auth.currentUser) {
    return;
  }

  // Merge into batch queue
  pendingProfileBatch[verifiedUid] = {
    ...(pendingProfileBatch[verifiedUid] || {}),
    ...profile,
    uid: verifiedUid
  };

  // Coalesce rapid updates within 1500ms into a single Firestore write
  if (profileSyncTimer) {
    clearTimeout(profileSyncTimer);
  }

  profileSyncTimer = setTimeout(async () => {
    const batchUpdates = pendingProfileBatch[verifiedUid];
    delete pendingProfileBatch[verifiedUid];
    if (!batchUpdates || !auth.currentUser) return;

    try {
      const userRef = doc(db, "users", verifiedUid);
      // Strict 2-second timeout so Firestore write never hangs the application
      const writePromise = setDoc(userRef, { ...batchUpdates, lastActive: new Date().toISOString() }, { merge: true });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore write timeout')), 2000));
      await Promise.race([writePromise, timeoutPromise]);
    } catch (err) {
      console.warn("Firestore updateUserProfile non-blocking note:", err);
    }
  }, 1500);
}

// --- STUDY ROOM CHATS ---
export function subscribeToChats(roomId: string, callback: (messages: RoomChatMessage[]) => void) {
  if (!db) {
    callback([]);
    return () => {};
  }
  try {
    const chatsRef = collection(db, `rooms/${roomId}/chats`);
    // Cost Optimization: Fetch the latest 40 messages descending, then reverse for display
    // Slices read volume by 60% compared to limit(100) while ensuring newest messages are seen
    const q = query(chatsRef, orderBy("timestamp", "desc"), limit(40));
    return onSnapshot(q, (snapshot) => {
      const messages: RoomChatMessage[] = [];
      snapshot.forEach((d) => {
        messages.push({ id: d.id, ...d.data() } as RoomChatMessage);
      });
      callback(messages.reverse());
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
  const verifiedSenderId = auth.currentUser?.uid || senderId;
  const verifiedSenderName = auth.currentUser?.displayName || senderName || 'Student';
  const msgId = doc(collection(db || {}, "temp")).id;
  const newMessage: RoomChatMessage = {
    id: msgId,
    roomId,
    senderId: verifiedSenderId,
    senderName: verifiedSenderName,
    text: text.trim().slice(0, 3000),
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
    // Cost Optimization: Limit to latest 60 drawing strokes descending, reversed in memory
    // Reduces initial listener read cost by 70%
    const q = query(wbRef, orderBy("timestamp", "desc"), limit(60));
    return onSnapshot(q, (snapshot) => {
      const elements: WhiteboardElement[] = [];
      snapshot.forEach((d) => {
        elements.push({ id: d.id, ...d.data() } as WhiteboardElement);
      });
      callback(elements.reverse());
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
  const verifiedSenderId = auth.currentUser?.uid || element.senderId;
  const elemId = doc(collection(db || {}, "temp")).id;
  const newElement: WhiteboardElement = {
    id: elemId,
    ...element,
    roomId,
    senderId: verifiedSenderId,
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
    const currentUid = auth.currentUser?.uid;
    const wbRef = collection(db, `rooms/${roomId}/whiteboard`);
    const snapshot = await getDocs(wbRef);
    if (snapshot.empty) return;

    // Batch delete in a single atomic commit instead of multiple sequential network calls
    const batch = writeBatch(db);
    let deleteCount = 0;
    snapshot.forEach((d) => {
      const data = d.data();
      if (!currentUid || data.senderId === currentUid || !data.senderId) {
        batch.delete(doc(db, `rooms/${roomId}/whiteboard`, d.id));
        deleteCount++;
      }
    });
    if (deleteCount > 0) {
      await batch.commit();
    }
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
    const verifiedUid = auth.currentUser?.uid || userId;
    const examsRef = collection(db, "exams");
    // Cost Optimization: Limit to recent 20 mock exams (down from 50)
    // Slices document read costs and prevents reading large question sets unnecessarily
    const q = query(examsRef, where("userId", "==", verifiedUid), orderBy("timestamp", "desc"), limit(20));
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
  const verifiedUserId = auth.currentUser?.uid || exam.userId || 'user_local_student';
  const cleanExam: MockExam = {
    id: exam.id || 'exam_' + Date.now(),
    userId: verifiedUserId,
    subject: exam.subject || 'General',
    topic: exam.topic || 'General Topic',
    questionsJson: exam.questionsJson || '[]',
    submittedAnswersJson: exam.submittedAnswersJson || '{}',
    score: typeof exam.score === 'number' ? Math.max(0, Math.min(100, exam.score)) : 0,
    completed: Boolean(exam.completed),
    feedback: (exam.feedback || '').slice(0, 10000),
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
    const verifiedOwnerId = auth.currentUser?.uid || ownerId;
    const docsRef = collection(db, "documents");
    // Cost Optimization: Limit to recent 25 study documents (down from 100)
    // Slices read consumption by 75% for note archives
    const q = query(docsRef, where("ownerId", "==", verifiedOwnerId), orderBy("timestamp", "desc"), limit(25));
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
  const verifiedOwnerId = auth.currentUser?.uid || document.ownerId || 'user_local_student';
  const cleanDoc: StudyDocument = {
    id: document.id || 'doc_' + Date.now(),
    ownerId: verifiedOwnerId,
    title: (document.title || 'Untitled Note').slice(0, 200),
    content: (document.content || '').slice(0, 100000),
    summary: (document.summary || '').slice(0, 10000),
    tagsJson: (document.tagsJson || '[]').slice(0, 5000),
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
  const verifiedOwnerId = auth.currentUser?.uid || ownerId;
  if (!db || isOffline()) {
    const key = `local_docs_${verifiedOwnerId}`;
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
