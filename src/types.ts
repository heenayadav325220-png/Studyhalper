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
  avatar?: string;
  avatarType?: 'personal' | 'cloud' | 'emoji' | 'initials';
  avatarBg?: string;
  xp: number;
  level: number;
  streak: number;
  petLevel: number;
  petXp: number;
  petName: string;
  language: 'en' | 'hi' | 'hinglish' | 'marathi' | 'tamil' | 'bengali';
  lastActive: string;
  schoolName?: string;
  className?: string;
  targetGoal?: string;
  isOnboarded?: boolean;
  authProvider?: 'google' | 'password' | 'guest' | 'anonymous';
  photoURL?: string;
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

export type AppThemeLook = 'cyber_glass' | 'wooden_parchment' | 'midnight_amoled' | 'aurora_synthwave';
export type LightingEffect = 'rainbow_spin' | 'aurora_pulse' | 'golden_radiance' | 'minimal_glow';
export type FontFamilyStyle = 'sans' | 'serif' | 'mono' | 'rounded';
export type AiTutorCardStyle = 'cyber_neon' | 'retro_arcade' | 'parchment_desk' | 'bento_minimal';
export type StatBoxesLayout = '3_col_compact' | 'horizontal_bar' | 'hexagon_badges' | 'card_grid';
export type DashboardLayoutPreset = 'tutor_first' | 'toolkit_hero' | 'quiz_first' | 'compact_grid';
export type CardBorderRadius = 'curved' | 'pill' | 'sharp' | 'hexagon';
export type NeonIntensity = 'high' | 'medium' | 'soft' | 'off';
export type WallpaperAmbiance = 
  | 'science_chalkboard' 
  | 'cosmic_nebula' 
  | 'cyber_matrix' 
  | 'deep_obsidian' 
  | 'earth_forest' 
  | 'deep_ocean' 
  | 'retro_arcade' 
  | 'solar_system'
  | 'celestial_zen';
export type AudioFeedback = 'cyber_synth' | 'tactile_click' | 'zen_water' | 'silent';
export type LeaderboardTheme = 'default' | 'black' | 'cyber_neon' | 'gold_luxury' | 'emerald_matrix' | 'crimson_dark';

export interface UiCustomization {
  appThemeLook: AppThemeLook;
  lightingEffect: LightingEffect;
  fontFamilyStyle: FontFamilyStyle;
  aiTutorCardStyle: AiTutorCardStyle;
  statBoxesLayout: StatBoxesLayout;
  dashboardLayoutPreset: DashboardLayoutPreset;
  neonIntensity: NeonIntensity;
  cardBorderRadius: CardBorderRadius;
  wallpaperAmbiance: WallpaperAmbiance;
  audioFeedback: AudioFeedback;
  leaderboardTheme?: LeaderboardTheme;
  accentColor?: string;
  customCss?: string;
  customThemeName?: string;
}
