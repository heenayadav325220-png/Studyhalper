import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
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

export interface LearningProgressItem {
  subject: string;
  topic: string;
  attempts: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  lastStudied: string;
  mastery: number;
  updatedAt: string;
}

// --- ERROR HANDLING SPECS ---
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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, userId?: string) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: userId || null,
    },
    operationType,
    path
  };
  console.error('Firestore Error in Learning Pipeline:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- USER-SPECIFIC LOCAL STORAGE KEY GENERATORS ---
const getLocalMistakesKey = (userId: string) => `ascend_mistake_book_${userId || 'local'}`;
const getLocalRevisionKey = (userId: string) => `ascend_spaced_revision_${userId || 'local'}`;
const getLocalCompletedKey = (userId: string) => `ascend_completed_topics_${userId || 'local'}`;
const getLocalWeakKey = (userId: string) => `ascend_weak_topics_${userId || 'local'}`;
const getLocalProgressKey = (userId: string) => `ascend_learning_progress_${userId || 'local'}`;

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

    // 1. Save locally (user-specific key)
    const localKey = getLocalMistakesKey(userId);
    const current = getLocal<MistakeItem[]>(localKey, []);
    
    // Prevent duplicate questions
    if (!current.some(m => m.question === mistake.question)) {
      current.push(newItem);
      setLocal(localKey, current);
    }

    // 2. Sync to firestore if authenticated
    if (userId && userId !== 'user_local_student') {
      try {
        const docRef = doc(db, 'users', userId, 'mistakes', id);
        await setDoc(docRef, newItem);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${userId}/mistakes/${id}`, userId);
      }
    }

    // 3. Mark topic as "weak" automatically if they made mistakes on it
    await this.markTopicAsWeak(userId, mistake.subject, mistake.topic);

    return newItem;
  }

  static async getMistakes(userId: string): Promise<MistakeItem[]> {
    const localKey = getLocalMistakesKey(userId);
    const localItems = getLocal<MistakeItem[]>(localKey, []);

    if (userId && userId !== 'user_local_student') {
      try {
        const colRef = collection(db, 'users', userId, 'mistakes');
        const q = await getDocs(colRef);
        const fbItems: MistakeItem[] = [];
        q.forEach(docSnap => {
          fbItems.push(docSnap.data() as MistakeItem);
        });

        // Sync local-only items that were created offline
        const unsynced = localItems.filter(local => !fbItems.some(fb => fb.id === local.id || fb.question === local.question));
        if (unsynced.length > 0) {
          for (const item of unsynced) {
            try {
              const docRef = doc(db, 'users', userId, 'mistakes', item.id);
              await setDoc(docRef, item);
              fbItems.push(item);
            } catch (err) {
              console.warn("Unsynced mistake uploads failed transiently:", err);
            }
          }
        }

        // Overwrite local cache with authoritative firestore-synchronized set
        fbItems.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setLocal(localKey, fbItems);
        return fbItems;
      } catch (e) {
        console.warn('Failed to fetch mistakes from Firestore, using cache:', e);
      }
    }

    return localItems;
  }

  static async removeMistake(userId: string, mistakeId: string): Promise<void> {
    const localKey = getLocalMistakesKey(userId);
    const current = getLocal<MistakeItem[]>(localKey, []);
    const filtered = current.filter(m => m.id !== mistakeId);
    setLocal(localKey, filtered);

    if (userId && userId !== 'user_local_student') {
      try {
        const docRef = doc(db, 'users', userId, 'mistakes', mistakeId);
        await deleteDoc(docRef);
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `users/${userId}/mistakes/${mistakeId}`, userId);
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

    const localKey = getLocalRevisionKey(userId);
    const current = getLocal<RevisionItem[]>(localKey, []);
    
    // Prevent duplicates on the same topic: update interval/due instead
    const existingIdx = current.findIndex(r => r.subject === subject && r.topic === topic);
    if (existingIdx >= 0) {
      current[existingIdx] = newItem;
    } else {
      current.push(newItem);
    }
    setLocal(localKey, current);

    if (userId && userId !== 'user_local_student') {
      try {
        const docRef = doc(db, 'users', userId, 'spaced_revisions', id);
        await setDoc(docRef, newItem);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${userId}/spaced_revisions/${id}`, userId);
      }
    }

    return newItem;
  }

  static async getRevisionTopics(userId: string): Promise<RevisionItem[]> {
    const localKey = getLocalRevisionKey(userId);
    const localItems = getLocal<RevisionItem[]>(localKey, []);

    if (userId && userId !== 'user_local_student') {
      try {
        const colRef = collection(db, 'users', userId, 'spaced_revisions');
        const q = await getDocs(colRef);
        const fbItems: RevisionItem[] = [];
        q.forEach(docSnap => {
          fbItems.push(docSnap.data() as RevisionItem);
        });

        // Sync local-only unsynced revisions
        const unsynced = localItems.filter(local => !fbItems.some(fb => fb.id === local.id || (fb.subject === local.subject && fb.topic === local.topic)));
        if (unsynced.length > 0) {
          for (const item of unsynced) {
            try {
              const docRef = doc(db, 'users', userId, 'spaced_revisions', item.id);
              await setDoc(docRef, item);
              fbItems.push(item);
            } catch (err) {
              console.warn("Unsynced revision uploads failed transiently:", err);
            }
          }
        }

        fbItems.sort((a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime());
        setLocal(localKey, fbItems);
        return fbItems;
      } catch (e) {
        console.warn('Failed to fetch revisions from Firestore, using cache:', e);
      }
    }

    return localItems;
  }

  static async completeRevision(userId: string, id: string): Promise<void> {
    const localKey = getLocalRevisionKey(userId);
    const current = getLocal<RevisionItem[]>(localKey, []);
    const idx = current.findIndex(r => r.id === id);
    if (idx >= 0) {
      const item = current[idx];
      const now = new Date();
      
      // Double the interval for spaced learning retention
      const newInterval = item.intervalDays * 2;
      const nextDue = new Date();
      nextDue.setDate(now.getDate() + newInterval);

      item.lastStudied = now.toISOString();
      item.nextDue = nextDue.toISOString();
      item.intervalDays = newInterval;
      item.status = 'completed';

      current[idx] = item;
      setLocal(localKey, current);

      if (userId && userId !== 'user_local_student') {
        try {
          const docRef = doc(db, 'users', userId, 'spaced_revisions', id);
          await setDoc(docRef, item);
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `users/${userId}/spaced_revisions/${id}`, userId);
        }
      }

      // Also mark as completed topic
      await this.markTopicAsCompleted(userId, item.subject, item.topic);
    }
  }

  // --- TOPIC STATUS TRACKERS ---

  static async markTopicAsCompleted(userId: string, subject: string, topic: string): Promise<void> {
    const key = `${subject}:${topic}`;
    const compKey = getLocalCompletedKey(userId);
    const weakKey = getLocalWeakKey(userId);

    const completed = getLocal<string[]>(compKey, []);
    if (!completed.includes(key)) {
      completed.push(key);
      setLocal(compKey, completed);
    }
    
    // Remove from weak topics if present
    const weak = getLocal<string[]>(weakKey, []);
    const filteredWeak = weak.filter(w => w !== key);
    setLocal(weakKey, filteredWeak);

    if (userId && userId !== 'user_local_student') {
      try {
        const docRef = doc(db, 'users', userId, 'learning_state', 'status');
        await setDoc(docRef, { completedTopics: completed, weakTopics: filteredWeak }, { merge: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${userId}/learning_state/status`, userId);
      }
    }
  }

  static async markTopicAsWeak(userId: string, subject: string, topic: string): Promise<void> {
    const key = `${subject}:${topic}`;
    const compKey = getLocalCompletedKey(userId);
    const weakKey = getLocalWeakKey(userId);

    const weak = getLocal<string[]>(weakKey, []);
    if (!weak.includes(key)) {
      weak.push(key);
      setLocal(weakKey, weak);
    }

    // Remove from completed topics if present
    const completed = getLocal<string[]>(compKey, []);
    const filteredComp = completed.filter(c => c !== key);
    setLocal(compKey, filteredComp);

    if (userId && userId !== 'user_local_student') {
      try {
        const docRef = doc(db, 'users', userId, 'learning_state', 'status');
        await setDoc(docRef, { completedTopics: filteredComp, weakTopics: weak }, { merge: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${userId}/learning_state/status`, userId);
      }
    }
  }

  static async getTopicStats(userId: string): Promise<{ completed: string[]; weak: string[] }> {
    const compKey = getLocalCompletedKey(userId);
    const weakKey = getLocalWeakKey(userId);

    // Initial load from user-specific local cache
    let completed = getLocal<string[]>(compKey, []);
    let weak = getLocal<string[]>(weakKey, []);

    if (userId && userId !== 'user_local_student') {
      try {
        const docRef = doc(db, 'users', userId, 'learning_state', 'status');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          completed = data.completedTopics || [];
          weak = data.weakTopics || [];
          
          setLocal(compKey, completed);
          setLocal(weakKey, weak);
        }
      } catch (e) {
        console.warn('Failed to load topic stats from Firestore:', e);
      }
    }

    return { completed, weak };
  }

  // --- CENTRALIZED QUIZ & EXAM RESULT HANDLER ---
  static async recordQuizResult(
    userId: string,
    result: {
      subject: string;
      topic: string;
      totalQuestions: number;
      correctAnswers: number;
      wrongAnswers: number;
      accuracy: number;
      wrongQuestionsList?: Omit<MistakeItem, 'id' | 'timestamp'>[];
    }
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    const isLocal = !userId || userId === 'user_local_student';

    // 1. Process Mistakes for wrong answers
    if (result.wrongQuestionsList && result.wrongQuestionsList.length > 0) {
      for (const wrongQ of result.wrongQuestionsList) {
        await this.addMistake(userId, {
          question: wrongQ.question,
          options: wrongQ.options,
          answer: wrongQ.answer,
          explanation: wrongQ.explanation || 'Review core explanations for this topic.',
          subject: result.subject,
          topic: result.topic,
          userAnswer: wrongQ.userAnswer
        });
      }
    }

    // 2. Track completed vs weak topics based on results
    if (result.accuracy >= 80) {
      await this.markTopicAsCompleted(userId, result.subject, result.topic);
    } else if (result.accuracy < 70 && result.wrongAnswers > 0) {
      await this.markTopicAsWeak(userId, result.subject, result.topic);
      // Auto-schedule revision task on failure
      await this.addRevisionTopic(userId, result.subject, result.topic, result.accuracy < 40 ? 'High' : 'Medium');
    }

    // 3. Update persistent progress metrics
    const progressId = `${result.subject.toLowerCase()}_${result.topic.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}`;
    const progressData: LearningProgressItem = {
      subject: result.subject,
      topic: result.topic,
      attempts: 1,
      correct: result.correctAnswers,
      incorrect: result.wrongAnswers,
      accuracy: result.accuracy,
      lastStudied: timestamp,
      mastery: result.accuracy,
      updatedAt: timestamp
    };

    const progressKey = getLocalProgressKey(userId);
    const progressMap = getLocal<Record<string, LearningProgressItem>>(progressKey, {});
    const existingP = progressMap[progressId];
    if (existingP) {
      progressData.attempts = (existingP.attempts || 0) + 1;
      const totalCorrect = (existingP.correct || 0) + result.correctAnswers;
      const totalIncorrect = (existingP.incorrect || 0) + result.wrongAnswers;
      const totalCount = totalCorrect + totalIncorrect;
      progressData.accuracy = totalCount > 0 ? Math.round((totalCorrect / totalCount) * 100) : 0;
      progressData.mastery = progressData.accuracy;
    }
    progressMap[progressId] = progressData;
    setLocal(progressKey, progressMap);

    // Sync progress to Firestore
    if (!isLocal) {
      try {
        const docRef = doc(db, 'users', userId, 'learning_progress', progressId);
        await setDoc(docRef, progressData, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${userId}/learning_progress/${progressId}`, userId);
      }
    }
  }

  // --- AI TUTOR COMPACT STUDENT MEMORY ---
  static async compileStudentMemory(userId: string): Promise<any> {
    const { completed, weak } = await this.getTopicStats(userId);
    const mistakes = await this.getMistakes(userId);
    const revisions = await this.getRevisionTopics(userId);
    
    const recentMistakes = mistakes.slice(-5).map(m => `[${m.subject}] ${m.topic}: "${m.question}"`);
    const spacedRevisions = revisions.filter(r => r.status === 'pending').map(r => `${r.subject} - ${r.topic} (${r.priority} Priority)`);
    const preferredStyle = this.getPreferredStyle(userId);
    
    return {
      completedTopics: completed.slice(0, 10), // keep compact for AI tokens
      weakTopics: weak.slice(0, 10),
      recentMistakes,
      spacedRevisions,
      preferredStyle
    };
  }

  static setPreferredStyle(userId: string, style: string): void {
    localStorage.setItem(`sb_preferred_style_${userId || 'local'}`, style);
  }

  static getPreferredStyle(userId: string): string {
    return localStorage.getItem(`sb_preferred_style_${userId || 'local'}`) || 'Adaptive (Intuitive analogies first, then formal definitions)';
  }
}
