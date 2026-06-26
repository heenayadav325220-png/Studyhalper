import { 
  db, 
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
  limit 
} from "./firebase";
import type { User, Note, ScheduleItem, Progress, Group, GroupMessage, GroupNote, Flashcard } from "../types";

/**
 * Validates connection to Firestore as required by firebase-integration skill.
 */
export async function testFirestoreConnection() {
  try {
    const testDoc = doc(db, 'test', 'connection');
    await getDoc(testDoc);
    console.log("Firestore connection verified successfully!");
  } catch (error) {
    console.error("Firestore connection test failed:", error);
  }
}

// ---------------- USER PROFILE ----------------

export async function saveUserProfile(user: User): Promise<void> {
  if (!user.id) return;
  const userRef = doc(db, "users", String(user.id));
  await setDoc(userRef, {
    uid: String(user.id),
    name: user.name,
    school: user.school,
    className: user.className,
    points: user.points,
    level: user.level,
    avatar: user.avatar || "🐼",
    badges: user.badges || [],
    pet: user.pet || {
      name: 'Chimpu 🐼',
      happiness: 85,
      fullness: 80,
      accessory: 'none',
      petCount: 0
    }
  }, { merge: true });
}

export async function getUserProfile(userId: string | number): Promise<User | null> {
  try {
    const userRef = doc(db, "users", String(userId));
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        id: userId,
        name: data.name,
        school: data.school,
        className: data.className,
        points: data.points || 0,
        level: data.level || 1,
        avatar: data.avatar || "🐼",
        badges: data.badges || [],
        pet: data.pet || undefined
      };
    }
  } catch (err) {
    console.warn("Offline or failed to fetch user profile from Firestore:", err);
  }
  return null;
}

export async function getLeaderboard(): Promise<{ name: string; points: number; level: number }[]> {
  try {
    const q = query(collection(db, "users"), orderBy("points", "desc"), limit(10));
    const snap = await getDocs(q);
    const results: { name: string; points: number; level: number }[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      results.push({
        name: d.name || "Anonymous Student",
        points: d.points || 0,
        level: d.level || 1
      });
    });
    return results;
  } catch (err) {
    console.error("Failed to load leaderboard:", err);
    return [];
  }
}

// ---------------- PERSONAL NOTES ----------------

export async function getNotes(userId: string | number): Promise<Note[]> {
  try {
    const colRef = collection(db, "users", String(userId), "notes");
    const q = query(colRef, orderBy("updated_at", "desc"));
    const snap = await getDocs(q);
    const results: Note[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      results.push({
        id: docSnap.id,
        title: d.title || "",
        content: d.content || "",
        subject: d.subject || "Mathematics",
        updated_at: d.updated_at || new Date().toISOString()
      });
    });
    return results;
  } catch (err) {
    console.error("Error getting notes:", err);
    return [];
  }
}

export async function saveNote(userId: string | number, note: Partial<Note> & { id?: string | number }): Promise<string> {
  const colRef = collection(db, "users", String(userId), "notes");
  const payload = {
    title: note.title || "Untitled Note",
    content: note.content || "",
    subject: note.subject || "Mathematics",
    updated_at: new Date().toISOString()
  };

  if (note.id) {
    const docRef = doc(db, "users", String(userId), "notes", String(note.id));
    await setDoc(docRef, payload, { merge: true });
    return String(note.id);
  } else {
    const docRef = await addDoc(colRef, payload);
    return docRef.id;
  }
}

export async function deleteNote(userId: string | number, noteId: string | number): Promise<void> {
  const docRef = doc(db, "users", String(userId), "notes", String(noteId));
  await deleteDoc(docRef);
}

// ---------------- STUDY SCHEDULE ----------------

export async function getSchedule(userId: string | number): Promise<ScheduleItem[]> {
  try {
    const colRef = collection(db, "users", String(userId), "schedule");
    const snap = await getDocs(colRef);
    const results: ScheduleItem[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      results.push({
        id: docSnap.id,
        task: d.task || "",
        time: d.time || "",
        day: d.day || "Monday",
        completed: d.completed || false,
        category: d.category || "Homework"
      });
    });
    return results;
  } catch (err) {
    console.error("Error getting schedule:", err);
    return [];
  }
}

export async function saveScheduleItem(userId: string | number, item: Partial<ScheduleItem> & { id?: string | number }): Promise<string> {
  const colRef = collection(db, "users", String(userId), "schedule");
  const payload = {
    task: item.task || "",
    time: item.time || "",
    day: item.day || "Monday",
    completed: item.completed ?? false,
    category: item.category || "Homework"
  };

  if (item.id) {
    const docRef = doc(db, "users", String(userId), "schedule", String(item.id));
    await setDoc(docRef, payload, { merge: true });
    return String(item.id);
  } else {
    const docRef = await addDoc(colRef, payload);
    return docRef.id;
  }
}

export async function deleteScheduleItem(userId: string | number, itemId: string | number): Promise<void> {
  const docRef = doc(db, "users", String(userId), "schedule", String(itemId));
  await deleteDoc(docRef);
}

// ---------------- PRACTICE PROGRESS ----------------

export async function getProgress(userId: string | number): Promise<Progress[]> {
  try {
    const colRef = collection(db, "users", String(userId), "progress");
    const q = query(colRef, orderBy("date", "desc"));
    const snap = await getDocs(q);
    const results: Progress[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      results.push({
        id: docSnap.id,
        subject: d.subject || "Mathematics",
        score: d.score || 0,
        total: d.total || 5,
        date: d.date || new Date().toISOString()
      });
    });
    return results;
  } catch (err) {
    console.error("Error getting progress:", err);
    return [];
  }
}

export async function saveProgressEntry(userId: string | number, entry: Omit<Progress, "id">): Promise<string> {
  const colRef = collection(db, "users", String(userId), "progress");
  const docRef = await addDoc(colRef, {
    subject: entry.subject,
    score: entry.score,
    total: entry.total,
    date: entry.date || new Date().toISOString()
  });
  return docRef.id;
}

// ---------------- COOPERATIVE STUDY GROUPS ----------------

export async function getGroups(): Promise<Group[]> {
  try {
    const colRef = collection(db, "groups");
    const q = query(colRef, orderBy("created_at", "desc"));
    const snap = await getDocs(q);
    const results: Group[] = [];
    for (const docSnap of snap.docs) {
      const d = docSnap.data();
      // Fetch member count real-time or from subcollection size
      const membersSnap = await getDocs(collection(db, "groups", docSnap.id, "members"));
      results.push({
        id: docSnap.id,
        name: d.name || "Untitled Group",
        description: d.description || "",
        created_by: d.created_by || "",
        created_at: d.created_at || new Date().toISOString(),
        member_count: membersSnap.size
      });
    }
    return results;
  } catch (err) {
    console.error("Error getting groups:", err);
    return [];
  }
}

export async function createGroup(name: string, description: string, userId: string | number, userName: string): Promise<string> {
  const colRef = collection(db, "groups");
  const docRef = await addDoc(colRef, {
    name,
    description,
    created_by: String(userId),
    created_at: new Date().toISOString()
  });

  // Add the creator as the admin member in the group
  const memberRef = doc(db, "groups", docRef.id, "members", String(userId));
  await setDoc(memberRef, {
    uid: String(userId),
    name: userName,
    role: "admin",
    joined_at: new Date().toISOString()
  });

  return docRef.id;
}

export async function joinGroup(groupId: string | number, userId: string | number, userName: string): Promise<void> {
  const memberRef = doc(db, "groups", String(groupId), "members", String(userId));
  await setDoc(memberRef, {
    uid: String(userId),
    name: userName,
    role: "member",
    joined_at: new Date().toISOString()
  });
}

export async function isUserInGroup(groupId: string | number, userId: string | number): Promise<boolean> {
  const memberRef = doc(db, "groups", String(groupId), "members", String(userId));
  const snap = await getDoc(memberRef);
  return snap.exists();
}

export function subscribeToGroupMessages(groupId: string | number, callback: (msgs: GroupMessage[]) => void) {
  if (String(groupId).startsWith("local_")) {
    const loadLocal = () => {
      const localMsgs = JSON.parse(localStorage.getItem(`studybuddy_group_messages_${groupId}`) || "[]");
      callback(localMsgs);
    };
    loadLocal();
    // Watch local storage for messages changes in local mode
    const handler = (e: StorageEvent) => {
      if (e.key === `studybuddy_group_messages_${groupId}`) {
        loadLocal();
      }
    };
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("storage", handler);
    };
  }
  const colRef = collection(db, "groups", String(groupId), "messages");
  const q = query(colRef, orderBy("created_at", "asc"));
  return onSnapshot(q, (snap) => {
    const results: GroupMessage[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      results.push({
        id: docSnap.id,
        group_id: groupId,
        user_id: d.user_id || "",
        user_name: d.user_name || "Student",
        text: d.text || "",
        image: d.image || undefined,
        created_at: d.created_at || new Date().toISOString()
      });
    });
    callback(results);
  });
}

export async function sendGroupMessage(
  groupId: string | number, 
  userId: string | number, 
  userName: string, 
  text: string, 
  image?: string | null
): Promise<void> {
  if (String(groupId).startsWith("local_")) {
    const localMsgs = JSON.parse(localStorage.getItem(`studybuddy_group_messages_${groupId}`) || "[]");
    const newMsg: GroupMessage = {
      id: "local_msg_" + Date.now(),
      group_id: groupId,
      user_id: String(userId),
      user_name: userName,
      text: text,
      image: image || undefined,
      created_at: new Date().toISOString()
    };
    localMsgs.push(newMsg);
    localStorage.setItem(`studybuddy_group_messages_${groupId}`, JSON.stringify(localMsgs));
    // Trigger storage event manually for current tab
    window.dispatchEvent(new StorageEvent("storage", { key: `studybuddy_group_messages_${groupId}` }));
    return;
  }
  const colRef = collection(db, "groups", String(groupId), "messages");
  await addDoc(colRef, {
    user_id: String(userId),
    user_name: userName,
    text: text,
    image: image || null,
    created_at: new Date().toISOString()
  });
}

export function subscribeToGroupNotes(groupId: string | number, callback: (notes: GroupNote[]) => void) {
  if (String(groupId).startsWith("local_")) {
    const loadLocal = () => {
      const localNotes = JSON.parse(localStorage.getItem(`studybuddy_group_notes_${groupId}`) || "[]");
      callback(localNotes);
    };
    loadLocal();
    const handler = (e: StorageEvent) => {
      if (e.key === `studybuddy_group_notes_${groupId}`) {
        loadLocal();
      }
    };
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("storage", handler);
    };
  }
  const colRef = collection(db, "groups", String(groupId), "notes");
  const q = query(colRef, orderBy("updated_at", "desc"));
  return onSnapshot(q, (snap) => {
    const results: GroupNote[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      results.push({
        id: docSnap.id,
        group_id: groupId,
        title: d.title || "",
        content: d.content || "",
        updated_by: d.updated_by || "",
        updated_by_name: d.updated_by_name || "Unknown Student",
        updated_at: d.updated_at || new Date().toISOString()
      });
    });
    callback(results);
  });
}

export async function saveGroupNote(
  groupId: string | number, 
  note: Partial<GroupNote> & { id?: string | number }, 
  userId: string | number, 
  userName: string
): Promise<string> {
  if (String(groupId).startsWith("local_")) {
    const localNotes = JSON.parse(localStorage.getItem(`studybuddy_group_notes_${groupId}`) || "[]");
    const payload: GroupNote = {
      id: note.id ? String(note.id) : "local_gn_" + Date.now(),
      group_id: groupId,
      title: note.title || "Untitled Group Note",
      content: note.content || "",
      updated_by: String(userId),
      updated_by_name: userName,
      updated_at: new Date().toISOString()
    };

    if (note.id) {
      const idx = localNotes.findIndex((n: any) => n.id === String(note.id));
      if (idx !== -1) {
        localNotes[idx] = payload;
      }
    } else {
      localNotes.unshift(payload);
    }
    localStorage.setItem(`studybuddy_group_notes_${groupId}`, JSON.stringify(localNotes));
    window.dispatchEvent(new StorageEvent("storage", { key: `studybuddy_group_notes_${groupId}` }));
    return String(payload.id);
  }
  const colRef = collection(db, "groups", String(groupId), "notes");
  const payload = {
    title: note.title || "Untitled Group Note",
    content: note.content || "",
    updated_by: String(userId),
    updated_by_name: userName,
    updated_at: new Date().toISOString()
  };

  if (note.id) {
    const docRef = doc(db, "groups", String(groupId), "notes", String(note.id));
    await setDoc(docRef, payload, { merge: true });
    return String(note.id);
  } else {
    const docRef = await addDoc(colRef, payload);
    return docRef.id;
  }
}

// ---------------- FLASHCARDS ----------------

export async function getFlashcards(userId: string | number): Promise<Flashcard[]> {
  try {
    const colRef = collection(db, "users", String(userId), "flashcards");
    const snap = await getDocs(colRef);
    const results: Flashcard[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      results.push({
        id: docSnap.id,
        front: d.front || "",
        back: d.back || "",
        subject: d.subject || "Mathematics",
        noteId: d.noteId || "",
        interval: d.interval ?? 1,
        repetition: d.repetition ?? 0,
        easeFactor: d.easeFactor ?? 2.5,
        nextReviewDate: d.nextReviewDate || new Date().toISOString(),
        created_at: d.created_at || new Date().toISOString()
      });
    });
    return results;
  } catch (err) {
    console.error("Error getting flashcards:", err);
    return [];
  }
}

export async function saveFlashcard(
  userId: string | number, 
  card: Partial<Flashcard> & { id?: string | number }
): Promise<string> {
  const colRef = collection(db, "users", String(userId), "flashcards");
  const payload = {
    front: card.front || "",
    back: card.back || "",
    subject: card.subject || "Mathematics",
    noteId: card.noteId || "",
    interval: card.interval ?? 1,
    repetition: card.repetition ?? 0,
    easeFactor: card.easeFactor ?? 2.5,
    nextReviewDate: card.nextReviewDate || new Date().toISOString(),
    created_at: card.created_at || new Date().toISOString()
  };

  if (card.id) {
    const docRef = doc(db, "users", String(userId), "flashcards", String(card.id));
    await setDoc(docRef, payload, { merge: true });
    return String(card.id);
  } else {
    const docRef = await addDoc(colRef, payload);
    return docRef.id;
  }
}

export async function deleteFlashcard(userId: string | number, cardId: string | number): Promise<void> {
  const docRef = doc(db, "users", String(userId), "flashcards", String(cardId));
  await deleteDoc(docRef);
}

