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

// Local storage management for robust offline/serverless fallback rooms
const STORAGE_KEY = 'ascend_active_quiz_rooms';

function getLocalRooms(): Record<string, { room: QuizRoom; participants: QuizParticipant[] }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveLocalRooms(rooms: Record<string, { room: QuizRoom; participants: QuizParticipant[] }>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
  } catch (e) {}
}

function getLocalFallbackQuestions(subject: string, topic: string, count: number) {
  const list = [
    {
      questionText: `What is the primary foundational concept in ${subject} regarding ${topic}?`,
      options: ["Core Conservation Law", "Universal Constant Scaling", "Dynamic Equilibrium", "Linear Superposition"],
      correctOptionIndex: 0,
      explanation: "Core conservation law forms the fundamental foundation."
    },
    {
      questionText: `Which analytical method is most frequently applied to solve problems in ${topic}?`,
      options: ["Approximation analysis", "Differential formulation", "Empirical curve fitting", "Numerical iteration"],
      correctOptionIndex: 1,
      explanation: "Differential formulation provides precise analytical solutions."
    },
    {
      questionText: `In advanced studies of ${subject}, how is ${topic} typically classified?`,
      options: ["Deterministic system", "Stochastic process", "Invariant metric", "Boundary condition"],
      correctOptionIndex: 0,
      explanation: "It is classified as a deterministic system under standard conditions."
    },
    {
      questionText: `What is the expected outcome when applying the governing principles of ${topic}?`,
      options: ["Conserved energy states", "Maximized entropy flow", "Zero potential gradient", "Symmetric phase alignment"],
      correctOptionIndex: 0,
      explanation: "Governing principles maintain conserved energy states."
    },
    {
      questionText: `Which factor most significantly influences the behavior of ${topic} in practice?`,
      options: ["Environmental boundary constraints", "Random thermal noise", "Initial state perturbations", "Observer frame velocity"],
      correctOptionIndex: 0,
      explanation: "Environmental boundary constraints dictate practical behavior."
    }
  ];
  return list.slice(0, Math.max(3, Math.min(count, list.length)));
}

// 1. Create Quiz Room
export async function createQuizRoomApi(params: {
  subject: string;
  topic: string;
  difficulty: string;
  questionCount: number;
  language: string;
}): Promise<QuizRoom> {
  let room: QuizRoom | null = null;
  const userId = 'user_' + Math.random().toString(36).substring(2, 10);
  const userName = 'Host Student';

  try {
    const res = await safeFetch("/api/quiz-battle/create", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.room) {
        room = data.room;
      }
    }
  } catch (e) {
    console.warn("API create room failed, falling back to local storage:", e);
  }

  if (!room) {
    const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
    const roomId = 'room_' + Date.now();
    const questions = getLocalFallbackQuestions(params.subject, params.topic, params.questionCount);

    room = {
      id: roomId,
      roomCode,
      hostId: userId,
      hostName: userName,
      subject: params.subject,
      topic: params.topic || params.subject,
      difficulty: params.difficulty || 'Medium',
      questionCount: questions.length,
      status: 'WAITING',
      currentQuestionIndex: 0,
      questions,
      createdAt: new Date().toISOString()
    };

    const participant: QuizParticipant = {
      id: userId,
      userId,
      displayName: userName,
      photoUrl: '',
      score: 0,
      correctCount: 0,
      incorrectCount: 0,
      ready: true,
      joinedAt: new Date().toISOString()
    };

    const rooms = getLocalRooms();
    rooms[roomId] = { room, participants: [participant] };
    rooms[roomCode] = { room, participants: [participant] };
    saveLocalRooms(rooms);
  } else {
    const rooms = getLocalRooms();
    const participant: QuizParticipant = {
      id: userId,
      userId,
      displayName: userName,
      photoUrl: '',
      score: 0,
      correctCount: 0,
      incorrectCount: 0,
      ready: true,
      joinedAt: new Date().toISOString()
    };
    rooms[room.id] = { room, participants: [participant] };
    rooms[room.roomCode] = { room, participants: [participant] };
    saveLocalRooms(rooms);
  }

  return room;
}

// 2. Join Quiz Room
export async function joinQuizRoomApi(roomCode: string): Promise<{ room: QuizRoom; participant: QuizParticipant }> {
  const cleanCode = String(roomCode).trim();

  try {
    const res = await safeFetch("/api/quiz-battle/join", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode: cleanCode })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.room && data.participant) {
        const rooms = getLocalRooms();
        const existing = rooms[data.room.id]?.participants || [data.participant];
        rooms[data.room.id] = { room: data.room, participants: existing };
        rooms[data.room.roomCode] = { room: data.room, participants: existing };
        saveLocalRooms(rooms);
        return { room: data.room, participant: data.participant };
      }
    }
  } catch (e) {
    console.warn("API join room failed, falling back to local storage:", e);
  }

  const rooms = getLocalRooms();
  const entry = rooms[cleanCode];
  if (!entry) {
    throw new Error("Room not found with this code.");
  }

  if (entry.room.status !== 'WAITING') {
    throw new Error("Match has already started or finished.");
  }

  const userId = 'user_' + Math.random().toString(36).substring(2, 10);
  const participant: QuizParticipant = {
    id: userId,
    userId,
    displayName: 'Student ' + Math.floor(Math.random() * 90 + 10),
    photoUrl: '',
    score: 0,
    correctCount: 0,
    incorrectCount: 0,
    ready: true,
    joinedAt: new Date().toISOString()
  };

  entry.participants.push(participant);
  saveLocalRooms(rooms);

  return { room: entry.room, participant };
}

// 3. Start Match (Host only)
export async function startQuizMatchApi(roomId: string): Promise<void> {
  try {
    const res = await safeFetch("/api/quiz-battle/start", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId })
    });
    if (res.ok) {
      const rooms = getLocalRooms();
      if (rooms[roomId]) {
        rooms[roomId].room.status = 'LIVE';
        rooms[roomId].room.currentQuestionIndex = 0;
        saveLocalRooms(rooms);
      }
      return;
    }
  } catch (e) {}

  const rooms = getLocalRooms();
  if (rooms[roomId]) {
    rooms[roomId].room.status = 'LIVE';
    rooms[roomId].room.currentQuestionIndex = 0;
    saveLocalRooms(rooms);
  }
}

// 4. Submit Answer
export async function submitQuizAnswerApi(params: {
  roomId: string;
  questionIndex: number;
  selectedOption: number;
  responseTimeMs: number;
}): Promise<{ isCorrect: boolean; correctOption: number; pointsEarned: number; newScore: number }> {
  try {
    const res = await safeFetch("/api/quiz-battle/submit-answer", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {}

  const rooms = getLocalRooms();
  const entry = rooms[params.roomId];
  const q = entry?.room?.questions?.[params.questionIndex];
  const correctOption = q?.correctOptionIndex ?? 0;
  const isCorrect = params.selectedOption === correctOption;
  const pointsEarned = isCorrect ? Math.max(10, Math.round(100 - (params.responseTimeMs / 15000) * 50)) : 0;

  return { isCorrect, correctOption, pointsEarned, newScore: pointsEarned };
}

// 5. Real-time Subscriptions with Polling & Local Fallback
export function subscribeToQuizRoom(roomId: string, callback: (room: QuizRoom | null) => void) {
  let isMounted = true;
  let interval: any = null;

  const checkRoom = () => {
    if (!isMounted) return;
    const rooms = getLocalRooms();
    const entry = rooms[roomId];
    if (entry && entry.room) {
      callback(entry.room);
    }
  };

  const pollRoom = async () => {
    checkRoom();
    try {
      const res = await safeFetch(`/api/quiz-battle/room/${roomId}`);
      if (res.ok) {
        const data = await res.json();
        if (isMounted && data.room) {
          callback(data.room);
          const rooms = getLocalRooms();
          const existing = rooms[roomId]?.participants || [];
          rooms[roomId] = { room: data.room, participants: existing };
          rooms[data.room.roomCode] = { room: data.room, participants: existing };
          saveLocalRooms(rooms);
        }
      }
    } catch (e) {}
  };

  interval = setInterval(pollRoom, 1000);
  pollRoom();

  let unsubFirestore: (() => void) | null = null;
  if (db) {
    try {
      const roomRef = doc(db, "quizRooms", roomId);
      unsubFirestore = onSnapshot(roomRef, (snapshot) => {
        if (!isMounted) return;
        if (snapshot.exists()) {
          callback({ id: snapshot.id, ...snapshot.data() } as QuizRoom);
        }
      }, () => {});
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

  const checkParticipants = () => {
    if (!isMounted) return;
    const rooms = getLocalRooms();
    const entry = rooms[roomId];
    if (entry && Array.isArray(entry.participants)) {
      const sorted = [...entry.participants].sort((a, b) => (b.score || 0) - (a.score || 0));
      callback(sorted);
    }
  };

  const pollParticipants = async () => {
    checkParticipants();
    try {
      const res = await safeFetch(`/api/quiz-battle/room/${roomId}`);
      if (res.ok) {
        const data = await res.json();
        if (isMounted && Array.isArray(data.participants)) {
          const sorted = [...data.participants].sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
          callback(sorted);
          const rooms = getLocalRooms();
          if (rooms[roomId]) {
            rooms[roomId].participants = data.participants;
            saveLocalRooms(rooms);
          }
        }
      }
    } catch (e) {}
  };

  interval = setInterval(pollParticipants, 1000);
  pollParticipants();

  let unsubFirestore: (() => void) | null = null;
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
      }, () => {});
    } catch (e) {}
  }

  return () => {
    isMounted = false;
    if (interval) clearInterval(interval);
    if (unsubFirestore) unsubFirestore();
  };
}
