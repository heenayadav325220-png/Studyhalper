export type Subject = 'Mathematics' | 'Science' | 'Biology' | 'Physics' | 'Chemistry' | 'English';

export interface Quest {
  id: string;
  text: string;
  textHi: string;
  xp: number;
  completed: boolean;
}

export interface StreakDay {
  id: number;
  name: string;
  nameHi: string;
  label: string;
  labelHi: string;
  goal: string;
  goalHi: string;
  completed: boolean;
  xpAwarded: number;
}

export interface User {
  id: string | number;
  name: string;
  school: string;
  className: string;
  points: number;
  level: number;
  avatar?: string;
  country?: string; // e.g. 'United States' | 'Russia' | 'India' | 'China' | 'United Kingdom' | 'Global'
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
  quests?: Quest[];
  streakDays?: StreakDay[];
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
  interval?: number;
  repetition?: number;
  easeFactor?: number;
  nextReviewDate?: string;
  lastReviewedDate?: string;
}

export interface ScheduleItem {
  id: string | number;
  task: string;
  time: string;
  day: string;
  completed: boolean;
  category?: 'Exam' | 'Homework' | 'Project' | 'Other';
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
  subject?: string;
  course?: string;
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

export interface GroupQuestionAnswer {
  id: string | number;
  user_id: string | number;
  user_name: string;
  text: string;
  created_at: string;
}

export interface GroupQuestion {
  id: string | number;
  group_id: string | number;
  title: string;
  content: string;
  asked_by: string | number;
  asked_by_name: string;
  created_at: string;
  answers?: GroupQuestionAnswer[];
}

export interface GroupSessionAttendee {
  user_id: string | number;
  user_name: string;
  status: 'yes' | 'no' | 'maybe';
}

export interface GroupSession {
  id: string | number;
  group_id: string | number;
  title: string;
  topic: string;
  date: string;
  time: string;
  duration: number; // in minutes
  meeting_platform: string; // Zoom, Google Meet, Microsoft Teams, Jitsi, etc.
  meeting_link?: string;
  created_by: string | number;
  created_by_name: string;
  created_at: string;
  rsvps?: GroupSessionAttendee[];
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

