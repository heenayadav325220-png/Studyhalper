export type Subject = 'Mathematics' | 'Science' | 'Biology' | 'Physics' | 'Chemistry' | 'English';

export interface User {
  id: string | number;
  name: string;
  school: string;
  className: string;
  points: number;
  level: number;
  avatar?: string;
  badges: Badge[];
  weeklyGoal?: number;
  completedThisWeek?: number;
  pet?: {
    name: string;
    happiness: number;
    fullness: number;
    accessory: string;
    petCount: number;
  };
}

export interface Badge {
  id: string | number;
  badge_name: string;
  icon: string;
  date_earned: string;
}

export interface LeaderboardEntry {
  name: string;
  points: number;
  level: number;
}

export interface Note {
  id: string | number;
  title: string;
  content: string;
  subject: Subject;
  updated_at: string;
}

export interface ScheduleItem {
  id: string | number;
  task: string;
  time: string;
  day: string;
  completed: boolean;
}

export interface Progress {
  id: string | number;
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

export interface Group {
  id: string | number;
  name: string;
  description: string;
  created_by: string | number;
  created_at: string;
  member_count?: number;
}

export interface GroupMessage {
  id: string | number;
  group_id: string | number;
  user_id: string | number;
  user_name: string;
  text: string;
  image?: string;
  created_at: string;
}

export interface GroupNote {
  id: string | number;
  group_id: string | number;
  title: string;
  content: string;
  updated_by: string | number;
  updated_by_name: string;
  updated_at: string;
}

export interface Flashcard {
  id: string | number;
  userId?: string | number;
  front: string;
  back: string;
  subject: Subject;
  noteId?: string | number;
  interval: number;
  repetition: number;
  easeFactor: number;
  nextReviewDate: string;
  created_at: string;
}

