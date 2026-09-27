import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc
} from 'firebase/firestore';

export interface MistakeItem {
  id: string;
  question: string;
  options: string[];
  answer: number; // correct option index
  explanation: string;
  subject: string;
  topic: string;
  userAnswer: number;
  timestamp: string;
}

export interface RevisionItem {
  id: string;
  subject: string;
  topic: string;
  priority: 'High' | 'Medium' | 'Low';
  lastStudied: string;
  nextDue: string;
  intervalDays: number; // 1, 3, 7, 14, etc. for spaced repetition
  status: 'pending' | 'completed';
}

export interface LearningState {
  completedTopics: string[];
  weakTopics: string[];
  classGoal?: string;
}

const LOCAL_MISTAKES_KEY = 'ascend_mistake_book';
const LOCAL_REVISION_KEY = 'ascend_spaced_revision';
const LOCAL_COMPLETED_KEY = 'ascend_completed_topics';
const LOCAL_WEAK_KEY = 'ascend_weak_topics';

// Helper to get local data safely
const getLocal = <T>(key: string, fallback: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    return fallback;
  }
};

// Helper to set local data safely
const setLocal = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
};

export class PersonalLearningService {
  // --- MISTAKE BOOK ACTIONS ---
  
  static async addMistake(
    userId: string,
    mistake: Omit<MistakeItem, 'id' | 'timestamp'>
  ): Promise<MistakeItem> {
    const id = `mistake_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newItem: MistakeItem = {
      ...mistake,
      id,
      timestamp: new Date().toISOString()
    };

    // 1. Save locally
    const current = getLocal<MistakeItem[]>(LOCAL_MISTAKES_KEY, []);
    // Prevent duplicate questions
    if (!current.some(m => m.question === mistake.question)) {
      current.push(newItem);
      setLocal(LOCAL_MISTAKES_KEY, current);
    }

    // 2. Sync to firestore if authenticated
    if (userId && userId !== 'user_local_student') {
      try {
        const docRef = doc(db, 'users', userId, 'mistakes', id);
        await setDoc(docRef, newItem);
      } catch (e) {
        console.warn('Failed to sync mistake to Firestore', e);
      }
    }

    // 3. Mark topic as "weak" automatically if they made mistakes on it
    await this.markTopicAsWeak(userId, mistake.subject, mistake.topic);

    return newItem;
  }

  static async getMistakes(userId: string): Promise<MistakeItem[]> {
    // Return local immediately for instant UI
    const localItems = getLocal<MistakeItem[]>(LOCAL_MISTAKES_KEY, []);

    if (userId && userId !== 'user_local_student') {
      try {
        const colRef = collection(db, 'users', userId, 'mistakes');
        const q = await getDocs(colRef);
        const fbItems: MistakeItem[] = [];
        q.forEach(docSnap => {
          fbItems.push(docSnap.data() as MistakeItem);
        });
        if (fbItems.length > 0) {
          // Merge and preserve duplicates
          const merged = [...localItems];
          fbItems.forEach(fb => {
            if (!merged.some(m => m.id === fb.id || m.question === fb.question)) {
              merged.push(fb);
            }
          });
          setLocal(LOCAL_MISTAKES_KEY, merged);
          return merged;
        }
      } catch (e) {
        console.warn('Failed to fetch mistakes from Firestore', e);
      }
    }

    return localItems;
  }

  static async removeMistake(userId: string, mistakeId: string): Promise<void> {
    const current = getLocal<MistakeItem[]>(LOCAL_MISTAKES_KEY, []);
    const filtered = current.filter(m => m.id !== mistakeId);
    setLocal(LOCAL_MISTAKES_KEY, filtered);

    if (userId && userId !== 'user_local_student') {
      try {
        const docRef = doc(db, 'users', userId, 'mistakes', mistakeId);
        await deleteDoc(docRef);
      } catch (e) {
        console.warn('Failed to delete mistake from Firestore', e);
      }
    }
  }

  // --- SPACED REVISION ACTIONS ---

  static async addRevisionTopic(
    userId: string,
    subject: string,
    topic: string,
    priority: 'High' | 'Medium' | 'Low' = 'Medium'
  ): Promise<RevisionItem> {
    const id = `rev_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date();
    
    // Set next due date: High priority is 1 day, Medium is 3 days, Low is 7 days
    const intervalDays = priority === 'High' ? 1 : priority === 'Medium' ? 3 : 7;
    const nextDue = new Date();
    nextDue.setDate(now.getDate() + intervalDays);

    const newItem: RevisionItem = {
      id,
      subject,
      topic,
      priority,
      lastStudied: now.toISOString(),
      nextDue: nextDue.toISOString(),
      intervalDays,
      status: 'pending'
    };

    const current = getLocal<RevisionItem[]>(LOCAL_REVISION_KEY, []);
    // Prevent duplicates on the same topic
    const existingIdx = current.findIndex(r => r.subject === subject && r.topic === topic);
    if (existingIdx >= 0) {
      current[existingIdx] = newItem;
    } else {
      current.push(newItem);
    }
    setLocal(LOCAL_REVISION_KEY, current);

    if (userId && userId !== 'user_local_student') {
      try {
        const docRef = doc(db, 'users', userId, 'spaced_revisions', id);
        await setDoc(docRef, newItem);
      } catch (e) {
        console.warn('Failed to sync revision topic to Firestore', e);
      }
    }

    return newItem;
  }

  static async getRevisionTopics(userId: string): Promise<RevisionItem[]> {
    const localItems = getLocal<RevisionItem[]>(LOCAL_REVISION_KEY, []);

    if (userId && userId !== 'user_local_student') {
      try {
        const colRef = collection(db, 'users', userId, 'spaced_revisions');
        const q = await getDocs(colRef);
        const fbItems: RevisionItem[] = [];
        q.forEach(docSnap => {
          fbItems.push(docSnap.data() as RevisionItem);
        });
        if (fbItems.length > 0) {
          const merged = [...localItems];
          fbItems.forEach(fb => {
            if (!merged.some(m => m.id === fb.id || (m.subject === fb.subject && m.topic === fb.topic))) {
              merged.push(fb);
            }
          });
          setLocal(LOCAL_REVISION_KEY, merged);
          return merged;
        }
      } catch (e) {
        console.warn('Failed to fetch revisions from Firestore', e);
      }
    }

    return localItems;
  }

  static async completeRevision(userId: string, id: string): Promise<void> {
    const current = getLocal<RevisionItem[]>(LOCAL_REVISION_KEY, []);
    const idx = current.findIndex(r => r.id === id);
    if (idx >= 0) {
      const item = current[idx];
      const now = new Date();
      
      // Double the interval for spacing
      const newInterval = item.intervalDays * 2;
      const nextDue = new Date();
      nextDue.setDate(now.getDate() + newInterval);

      item.lastStudied = now.toISOString();
      item.nextDue = nextDue.toISOString();
      item.intervalDays = newInterval;
      item.status = 'completed';

      current[idx] = item;
      setLocal(LOCAL_REVISION_KEY, current);

      if (userId && userId !== 'user_local_student') {
        try {
          const docRef = doc(db, 'users', userId, 'spaced_revisions', id);
          await setDoc(docRef, item);
        } catch (e) {
          console.warn('Failed to update revision on Firestore', e);
        }
      }

      // Also mark as completed topic
      await this.markTopicAsCompleted(userId, item.subject, item.topic);
    }
  }

  // --- TOPIC STATUS TRACKERS ---

  static async markTopicAsCompleted(userId: string, subject: string, topic: string): Promise<void> {
    const key = `${subject}:${topic}`;
    const completed = getLocal<string[]>(LOCAL_COMPLETED_KEY, []);
    if (!completed.includes(key)) {
      completed.push(key);
      setLocal(LOCAL_COMPLETED_KEY, completed);
    }
    
    // Remove from weak topics if present
    const weak = getLocal<string[]>(LOCAL_WEAK_KEY, []);
    const filteredWeak = weak.filter(w => w !== key);
    setLocal(LOCAL_WEAK_KEY, filteredWeak);

    if (userId && userId !== 'user_local_student') {
      try {
        const docRef = doc(db, 'users', userId, 'learning_state', 'status');
        await setDoc(docRef, { completedTopics: completed, weakTopics: filteredWeak }, { merge: true });
      } catch (e) {}
    }
  }

  static async markTopicAsWeak(userId: string, subject: string, topic: string): Promise<void> {
    const key = `${subject}:${topic}`;
    const weak = getLocal<string[]>(LOCAL_WEAK_KEY, []);
    if (!weak.includes(key)) {
      weak.push(key);
      setLocal(LOCAL_WEAK_KEY, weak);
    }

    // Remove from completed topics if present (it needs rework!)
    const completed = getLocal<string[]>(LOCAL_COMPLETED_KEY, []);
    const filteredComp = completed.filter(c => c !== key);
    setLocal(LOCAL_COMPLETED_KEY, filteredComp);

    if (userId && userId !== 'user_local_student') {
      try {
        const docRef = doc(db, 'users', userId, 'learning_state', 'status');
        await setDoc(docRef, { completedTopics: filteredComp, weakTopics: weak }, { merge: true });
      } catch (e) {}
    }
  }

  static getTopicStats(): { completed: string[]; weak: string[] } {
    const completed = getLocal<string[]>(LOCAL_COMPLETED_KEY, [
      'Mathematics:Trigonometry & Formulas',
      'Science:Newton\'s Laws of Motion'
    ]);
    const weak = getLocal<string[]>(LOCAL_WEAK_KEY, [
      'Mathematics:Quadratic Equations',
      'Physics:Thermodynamics'
    ]);
    return { completed, weak };
  }

  static async compileStudentMemory(userId: string): Promise<any> {
    const { completed, weak } = this.getTopicStats();
    const mistakes = await this.getMistakes(userId);
    const revisions = await this.getRevisionTopics(userId);
    
    const recentMistakes = mistakes.slice(-5).map(m => `[${m.subject}] ${m.topic}: "${m.question}"`);
    const spacedRevisions = revisions.filter(r => r.status === 'pending').map(r => `${r.subject} - ${r.topic} (${r.priority} Priority)`);
    const preferredStyle = localStorage.getItem(`sb_preferred_style_${userId}`) || 'Adaptive (Intuitive analogies first, then formal definitions)';
    
    return {
      completedTopics: completed,
      weakTopics: weak,
      recentMistakes,
      spacedRevisions,
      preferredStyle
    };
  }

  static setPreferredStyle(userId: string, style: string): void {
    localStorage.setItem(`sb_preferred_style_${userId}`, style);
  }

  static getPreferredStyle(userId: string): string {
    return localStorage.getItem(`sb_preferred_style_${userId}`) || 'Adaptive (Intuitive analogies first, then formal definitions)';
  }
}
