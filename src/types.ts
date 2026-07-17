export interface UserProfile {
  uid: string;
  name: string;
  xp: number;
  level: number;
  streak: number;
  petLevel: number;
  petXp: number;
  petName: string;
  language: 'en' | 'hi';
  lastActive: string;
}

export interface ChatMessage {
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
  type: 'path' | 'rect' | 'circle' | 'text';
  color: string;
  thickness: number;
  points: string; // JSON array of points [{x, y}, ...] or start/end
  text?: string;
  senderId: string;
  timestamp: string;
}

export interface MockExam {
  id: string;
  userId: string;
  subject: string;
  topic: string;
  questionsJson: string; // JSON array of questions
  submittedAnswersJson: string; // JSON array of answers
  score: number;
  completed: boolean;
  feedback: string;
  timestamp: string;
}

export interface StudyDocument {
  id: string;
  ownerId: string;
  title: string;
  content: string;
  summary: string;
  tagsJson: string; // JSON array of tags
  isShared: boolean;
  timestamp: string;
}

export interface ExamQuestion {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}
