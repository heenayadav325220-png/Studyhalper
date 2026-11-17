import { 
  db, 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  orderBy 
} from './firebase';
import { safeFetch } from './geminiService';

export interface QuizRoom {
  id: string;
  roomCode: string;
  hostId: string;
  hostName: string;
  subject: string;
  topic: string;
  difficulty: string;
  questionCount: number;
  status: 'WAITING' | 'COUNTDOWN' | 'LIVE' | 'QUESTION_TRANSITION' | 'COMPLETED' | 'CANCELLED';
  currentQuestionIndex: number;
  questions: any[];
  createdAt: string;
}

export interface QuizParticipant {
  id: string;
  userId: string;
  displayName: string;
  photoUrl: string;
  score: number;
  correctCount: number;
  incorrectCount: number;
  ready: boolean;
  joinedAt: string;
}

export interface StudyRoom {
  id: string;
  roomCode: string;
  hostId: string;
  roomName: string;
  subject: string;
  isPomodoroActive: boolean;
  timerSecondsLeft: number;
  timerStatus: 'paused' | 'running';
  participants: string[];
  createdAt: string;
}

// 1. Create Quiz Room via Backend using safeFetch
export async function createQuizRoomApi(params: {
  subject: string;
  topic: string;
  difficulty: string;
  questionCount: number;
  language: string;
}): Promise<QuizRoom> {
  const res = await safeFetch("/api/quiz-battle/create", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || "Failed to create quiz room.");
  }
  return data.room;
}

// 2. Join Quiz Room
export async function joinQuizRoomApi(roomCode: string): Promise<{ room: QuizRoom; participant: QuizParticipant }> {
  const res = await safeFetch("/api/quiz-battle/join", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ roomCode })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || "Failed to join room.");
  }
  return data;
}

// 3. Start Match (Host only)
export async function startQuizMatchApi(roomId: string): Promise<void> {
  const res = await safeFetch("/api/quiz-battle/start", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ roomId })
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to start match.");
  }
}

// 4. Submit Answer
export async function submitQuizAnswerApi(params: {
  roomId: string;
  questionIndex: number;
  selectedOption: number;
  responseTimeMs: number;
}): Promise<{ isCorrect: boolean; correctOption: number; pointsEarned: number; newScore: number }> {
  const res = await safeFetch("/api/quiz-battle/submit-answer", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to submit answer.");
  }
  return data;
}

// 5. Real-time Subscriptions with Polling Fallback
export function subscribeToQuizRoom(roomId: string, callback: (room: QuizRoom | null) => void) {
  let isMounted = true;
  let interval: any = null;
  let unsubFirestore: (() => void) | null = null;

  const pollRoom = async () => {
    try {
      const res = await safeFetch(`/api/quiz-battle/room/${roomId}`);
      if (res.ok) {
        const data = await res.json();
        if (isMounted && data.room) {
          callback(data.room);
        }
      }
    } catch (e) {}
  };

  // Start polling immediately as primary or fallback
  interval = setInterval(pollRoom, 1500);
  pollRoom();

  if (db) {
    try {
      const roomRef = doc(db, "quizRooms", roomId);
      unsubFirestore = onSnapshot(roomRef, (snapshot) => {
        if (!isMounted) return;
        if (snapshot.exists()) {
          callback({ id: snapshot.id, ...snapshot.data() } as QuizRoom);
        }
      }, (_err) => {
        // Fallback handled by polling interval
      });
    } catch (e) {}
  }

  return () => {
    isMounted = false;
    if (interval) clearInterval(interval);
    if (unsubFirestore) unsubFirestore();
  };
}

export function subscribeToParticipants(roomId: string, callback: (participants: QuizParticipant[]) => void) {
  let isMounted = true;
  let interval: any = null;
  let unsubFirestore: (() => void) | null = null;

  const pollParticipants = async () => {
    try {
      const res = await safeFetch(`/api/quiz-battle/room/${roomId}`);
      if (res.ok) {
        const data = await res.json();
        if (isMounted && Array.isArray(data.participants)) {
          const sorted = [...data.participants].sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
          callback(sorted);
        }
      }
    } catch (e) {}
  };

  interval = setInterval(pollParticipants, 1500);
  pollParticipants();

  if (db) {
    try {
      const pRef = collection(db, `quizRooms/${roomId}/participants`);
      const q = query(pRef, orderBy("score", "desc"));
      unsubFirestore = onSnapshot(q, (snapshot) => {
        if (!isMounted) return;
        const list: QuizParticipant[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as QuizParticipant);
        });
        if (list.length > 0) {
          callback(list);
        }
      }, (_err) => {
        // Fallback handled by polling interval
      });
    } catch (e) {}
  }

  return () => {
    isMounted = false;
    if (interval) clearInterval(interval);
    if (unsubFirestore) unsubFirestore();
  };
}
