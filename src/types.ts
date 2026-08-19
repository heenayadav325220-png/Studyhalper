export type Subject = 'Mathematics' | 'Science' | 'Biology' | 'Physics' | 'Chemistry' | 'English';

export interface Note {
  id: number;
  title: string;
  content: string;
  subject: Subject;
  updated_at: string;
}

export interface ScheduleItem {
  id: number;
  task: string;
  time: string;
  day: string;
  completed: boolean;
}

export interface Progress {
  id: number;
  subject: Subject;
  score: number;
  total: number;
  date: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: string;
}

export interface User {
  id: number;
  name: string;
  points: number;
  level: number;
  badges: {
    id: number;
    badge_name: string;
    icon: string;
    date_earned: string;
  }[];
}

export interface LeaderboardEntry {
  name: string;
  points: number;
  level: number;
}

export interface Group {
  id: number;
  name: string;
  description: string;
  created_by: number;
  created_at: string;
  member_count: number;
}

export interface GroupMessage {
  id: number;
  group_id: number;
  user_id: number;
  user_name: string;
  text: string;
  created_at: string;
}

export interface GroupNote {
  id: number;
  group_id: number;
  title: string;
  content: string;
  updated_by: number;
  updated_by_name: string;
  updated_at: string;
}

// Durable Gamified and Sync Types matching firebase-blueprint.json
export interface UserProfile {
  uid: string;
  name: string;
  email?: string;
  xp: number;
  level: number;
  streak: number;
  petLevel: number;
  petXp: number;
  petName: string;
  language: 'en' | 'hi';
  lastActive: string;
  schoolName?: string;
  className?: string;
  targetGoal?: string;
  isOnboarded?: boolean;
}

export interface RoomChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface WhiteboardElement {
  id: string;
  roomId: string;
  type: string; // 'path' | 'rect' | 'circle' | 'text'
  color: string;
  thickness: number;
  points: string; // JSON string of coordinates: Array<{x: number, y: number}>
  text?: string;
  senderId: string;
  timestamp: string;
}

export interface MockExam {
  id: string;
  userId: string;
  subject: string;
  topic: string;
  questionsJson: string; // JSON string of ExamQuestion[]
  submittedAnswersJson: string; // JSON string of Record<number, number> (questionIdx -> optionIdx)
  score: number;
  completed: boolean;
  feedback: string;
  timestamp: string;
}

export interface ExamQuestion {
  question: string;
  options: string[];
  answer: number;
}

export interface StudyDocument {
  id: string;
  ownerId: string;
  title: string;
  content: string;
  summary: string;
  tagsJson: string; // JSON string of string[]
  isShared: boolean;
  timestamp: string;
}
