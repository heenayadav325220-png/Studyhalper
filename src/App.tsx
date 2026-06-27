import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { 
  Home, 
  MessageSquare, 
  BookOpen, 
  Calendar, 
  User, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle,
  ChevronRight,
  BrainCircuit,
  GraduationCap,
  Send,
  Loader2,
  Mic,
  Camera,
  Award,
  Trophy,
  Star,
  MoreVertical,
  X,
  Users,
  ArrowLeft,
  Percent,
  Atom,
  Heart,
  Zap,
  FlaskConical,
  Sparkles,
  Clock,
  Maximize2,
  Volume2,
  VolumeX,
  Music,
  Video,
  Search,
  HelpCircle,
  Check,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getStudyAnswer, generateQuiz, generateStudyDiagram, generateFlashcards, isAiQuotaExceeded } from './services/geminiService';
import { LANGUAGES, translate } from './services/translations';
import { ProgressChart } from './components/ProgressChart';
import { StudyTimer } from './components/StudyTimer';
import { HomeworkSolver } from './components/HomeworkSolver';
import InteractiveToolkit from './components/InteractiveToolkit';
import type { AppLanguage } from './services/translations';
import type { Note, ScheduleItem, Progress, ChatMessage, Subject, User as UserType, Group, GroupMessage, GroupNote, Flashcard, GroupQuestion, GroupSession } from './types';
import { 
  auth, 
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  collection,
  doc,
  getDocs,
  query,
  limit
} from './services/firebase';
import { 
  getUserProfile, 
  saveUserProfile, 
  getLeaderboard, 
  getNotes, 
  saveNote, 
  deleteNote, 
  getSchedule, 
  saveScheduleItem, 
  deleteScheduleItem, 
  getProgress, 
  saveProgressEntry, 
  getGroups, 
  createGroup, 
  joinGroup, 
  isUserInGroup,
  subscribeToGroupMessages, 
  sendGroupMessage, 
  subscribeToGroupNotes, 
  saveGroupNote,
  getFlashcards,
  saveFlashcard,
  deleteFlashcard,
  subscribeToGroupQuestions,
  saveGroupQuestion,
  answerGroupQuestion,
  subscribeToGroupSessions,
  saveGroupSession,
  rsvpGroupSession
} from './services/firebaseDb';


const SUBJECTS: Subject[] = ['Mathematics', 'Science', 'Biology', 'Physics', 'Chemistry', 'English'];

const getTimeGreeting = (lang: AppLanguage) => {
  const hr = new Date().getHours();
  if (hr < 5) return { label: translate('greet_night', lang, "Good Night"), icon: "🌙" };
  if (hr < 12) return { label: translate('greet_morning', lang, "Good Morning"), icon: "☀️" };
  if (hr < 16) return { label: translate('greet_afternoon', lang, "Good Afternoon"), icon: "🌤️" };
  if (hr < 21) return { label: translate('greet_evening', lang, "Good Evening"), icon: "🌇" };
  return { label: translate('greet_night', lang, "Good Night"), icon: "🌙" };
};

// Sub-helper to process **bold text**
const parseBoldWords = (text: string) => {
  const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <strong key={i} className="font-extrabold text-slate-900 bg-slate-100 px-1 py-0.5 rounded-md border border-slate-200/55">
          {part}
        </strong>
      );
    }
    return part;
  });
};

const renderChatMessage = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-2 font-sans text-xs md:text-sm leading-relaxed text-slate-800">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        
        // Match Markdown Headers e.g. ### Header or ## Header
        if (trimmed.startsWith('#')) {
          const depth = trimmed.match(/^#+/)?.[0].length || 1;
          const headingText = trimmed.replace(/^#+\s*/, '');
          const isHindi = /[\u0900-\u097F]/.test(headingText);
          const headerAccent = isHindi 
            ? "border-orange-200 bg-orange-50/50 text-orange-850" 
            : "border-indigo-150 bg-indigo-50/50 text-indigo-900";
          
          return (
            <h4 
              key={idx} 
              className={`font-black tracking-tight rounded-2xl px-3 py-1.5 border text-xs md:text-sm mt-4 mb-2 flex items-center gap-1.5 ${headerAccent}`}
            >
              <span>{isHindi ? "✨" : "💡"}</span>
              <span>{headingText}</span>
            </h4>
          );
        }
        
        // Bullet points starting with * or -
        if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
          const content = trimmed.replace(/^[\*\-]\s*/, '');
          return (
            <div key={idx} className="flex items-start space-x-2 pl-2 my-1">
              <span className="text-indigo-500 shrink-0 select-none text-[10px] pt-1.5">●</span>
              <span className="text-slate-700 font-medium">{parseBoldWords(content)}</span>
            </div>
          );
        }
        
        // Ordered items starting with dynamic digits e.g. 1. or 2.
        if (/^\d+\.\s/.test(trimmed)) {
          const content = trimmed.replace(/^\d+\.\s*/, '');
          const match = trimmed.match(/^(\d+)\.\s*/);
          const num = match ? match[1] : "•";
          return (
            <div key={idx} className="flex items-start space-x-2 pl-1.5 my-1.5">
              <span className="bg-indigo-50 text-indigo-600 rounded-lg w-5 h-5 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 border border-indigo-150/40 shadow-2xs">
                {num}
              </span>
              <span className="text-slate-700 font-medium pt-0.5">{parseBoldWords(content)}</span>
            </div>
          );
        }
        
        // Empty space separation
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }
        
        // Normal paragraph line
        return (
          <p key={idx} className="text-slate-705 leading-relaxed font-medium">
            {parseBoldWords(line)}
          </p>
        );
      })}
    </div>
  );
};

const SUBJECT_DETAILS: Record<Subject, { icon: any, color: string, bg: string, border: string, text: string, textHi: string }> = {
  'Mathematics': { 
    icon: Percent, 
    color: 'from-blue-500 to-indigo-600', 
    bg: 'bg-blue-50/60', 
    border: 'border-blue-100/50', 
    text: 'Mathematics',
    textHi: 'गणित (Maths)'
  },
  'Science': { 
    icon: Atom, 
    color: 'from-emerald-500 to-teal-600', 
    bg: 'bg-emerald-50/60', 
    border: 'border-emerald-100/50', 
    text: 'Science',
    textHi: 'विज्ञान (Science)'
  },
  'Biology': { 
    icon: Heart, 
    color: 'from-pink-500 to-rose-600', 
    bg: 'bg-pink-50/60', 
    border: 'border-pink-100/50', 
    text: 'Biology',
    textHi: 'जीव विज्ञान (Biology)'
  },
  'Physics': { 
    icon: Zap, 
    color: 'from-purple-500 to-violet-600', 
    bg: 'bg-purple-50/60', 
    border: 'border-purple-100/50', 
    text: 'Physics',
    textHi: 'भौतिकी (Physics)'
  },
  'Chemistry': { 
    icon: FlaskConical, 
    color: 'from-amber-500 to-orange-600', 
    bg: 'bg-amber-50/60', 
    border: 'border-amber-100/50', 
    text: 'Chemistry',
    textHi: 'रसायन शास्त्र (Chemistry)'
  },
  'English': { 
    icon: BookOpen, 
    color: 'from-sky-500 to-indigo-500', 
    bg: 'bg-sky-50/60', 
    border: 'border-sky-100/50', 
    text: 'English',
    textHi: 'अंग्रेजी (English)'
  }
};

const KEYS = {
  USER: 'studybuddy_user',
  NOTES: 'studybuddy_notes',
  SCHEDULE: 'studybuddy_schedule',
  PROGRESS: 'studybuddy_progress',
  GROUPS: 'studybuddy_groups',
  GROUP_MESSAGES: 'studybuddy_group_messages',
  GROUP_NOTES: 'studybuddy_group_notes',
  CHAT_HISTORY: 'studybuddy_chat_history',
};

const DEFAULT_USER = null;

const DEFAULT_NOTES: Note[] = [
  { id: 1, title: 'Derivative Basics', content: 'd/dx(sin x) = cos x\nd/dx(cos x) = -sin x', subject: 'Mathematics', updated_at: new Date().toISOString() },
  { id: 2, title: "Newton's Laws", content: 'F = ma. Action & Reaction are equal and opposite.', subject: 'Physics', updated_at: new Date().toISOString() }
];

const DEFAULT_SCHEDULE: ScheduleItem[] = [
  { id: 1, task: 'Math Review', time: '14:00', day: 'Monday', completed: false },
  { id: 2, task: 'Chemistry Revision', time: '10:00', day: 'Wednesday', completed: true }
];

const DEFAULT_PROGRESS: Progress[] = [
  { id: 1, subject: 'Mathematics', score: 4, total: 5, date: new Date().toISOString() }
];

const DEFAULT_GROUPS: Group[] = [
  { id: 1, name: 'Science Squad', description: 'Collaborative biology & chemistry studies', created_by: 2, created_at: new Date().toISOString(), member_count: 3 },
  { id: 2, name: 'Calc Warriors', description: 'Solving calculus step-by-step', created_by: 3, created_at: new Date().toISOString(), member_count: 2 }
];

const PEER_PRESENCE = [
  { id: 101, name: 'Alice Johnson', subject: 'Biology', online: true, avatar: '🦄', waveResponse: "Hey {name}! Let's conquer Biology today! 🔬" },
  { id: 102, name: 'Bob Smith', subject: 'Mathematics', online: true, avatar: '🦊', waveResponse: "Nice to see you {name}! Check out my new math note! ✏️" },
  { id: 103, name: 'Sarah Connor', subject: 'Physics', online: false, avatar: '🦉', waveResponse: "Just reading about Einstein! See you in group class later!" }
];

const getChatPlaceholder = (lang: AppLanguage) => {
  const placeholders: Record<AppLanguage, string> = {
    English: 'Ask a homework question or request a diagram...',
    Hindi: 'कोई होमवर्क प्रश्न पूछें या चित्र बनाने को कहें...',
    Hinglish: 'Apna homework Sawaal likhein ya diagram mangein...',
    Marathi: 'गृहपाठाचा प्रश्न विचारा किंवा आकृती मागा...',
    Tamil: 'கேள்வி கேட்கவும் அல்லது வரைபடம் கேட்கவும்...',
    Bengali: 'প্রশ্ন জিজ্ঞাসা করো বা ছবি আঁকতে বলো...',
    Spanish: 'Haz una pregunta o pide un diagrama...',
    French: 'Posez une question ou demandez un schéma...',
    German: 'Stelle eine Frage oder bitte um ein Diagramm...'
  };
  return placeholders[lang] || 'Ask a homework question...';
};

const getSolvingText = (lang: AppLanguage) => {
  const txt: Record<AppLanguage, string> = {
    English: 'Gemini is solving...',
    Hindi: 'जेमिनी शिक्षक हल कर रहे हैं...',
    Hinglish: 'Gemini solution dhoondh raha hai...',
    Marathi: 'जेमिनी सोडवत आहे...',
    Tamil: 'ஜெமिनी பதிலளிக்கிறது...',
    Bengali: 'জেমিনি সমাধান করছে...',
    Spanish: 'Gemini está respondiendo...',
    French: 'Gemini est en train de résoudre...',
    German: 'Gemini löst...'
  };
  return txt[lang] || 'Gemini is solving...';
};

const getFullscreenLabel = (lang: AppLanguage) => {
  const lbls: Record<AppLanguage, string> = {
    English: 'Fullscreen 📺',
    Hindi: 'पूरे स्क्रीन पर देखें 📺',
    Hinglish: 'Full Screen 📺',
    Marathi: 'पूर्ण स्क्रीनवर पहा 📺',
    Tamil: 'முழுத் திரை 📺',
    Bengali: 'ফুল স্ক্রিন 📺',
    Spanish: 'Pantalla completa 📺',
    French: 'Plein écran 📺',
    German: 'Vollbild 📺'
  };
  return lbls[lang] || 'Fullscreen';
};

const getListeningLabel = (lang: AppLanguage) => {
  const labels: Record<AppLanguage, string> = {
    English: 'Listening...',
    Hindi: 'सुन रहा हूँ...',
    Hinglish: 'Listening...',
    Marathi: 'ऐकत आहे...',
    Tamil: 'கேட்கிறது...',
    Bengali: 'শুনছি...',
    Spanish: 'Escuchando...',
    French: 'Écoute...',
    German: 'Zuhören...'
  };
  return labels[lang] || 'Listening...';
};

const getClearChatsLabel = (lang: AppLanguage) => {
  const translations: Record<AppLanguage, string> = {
    English: 'Clear Chats 🧹',
    Hindi: 'चैट साफ करें 🧹',
    Hinglish: 'Clear Chats 🧹',
    Marathi: 'चॅट साफ करा 🧹',
    Tamil: 'அழி 🧹',
    Bengali: 'মুছে ফেলো 🧹',
    Spanish: 'Limpiar chats 🧹',
    French: 'Effacer chats 🧹',
    German: 'Chats leeren 🧹'
  };
  return translations[lang] || 'Clear Chats';
};

const getChatIntroDesc = (lang: AppLanguage) => {
  const intro: Record<AppLanguage, string> = {
    English: 'Solve Homework, explain science, draft diagrams inside direct threads!',
    Hindi: 'होमवर्क के उत्तर पाएँ, विज्ञान को चित्र सहित समझें और शानदार आलेख बनाएँ!',
    Hinglish: 'Homework solve karein, drawings ke sath science samjhein aur diagrams banayein!',
    Marathi: 'गृहपाठ सोडवा, चित्रांसह विज्ञान समजावून घ्या आणि आकृत्या काढा!',
    Tamil: 'வீட்டுப்பாடம் செய்ய, அறிவியல் விளக்கங்கள் மற்றும் வரைபடங்களைப் பெறலாம்!',
    Bengali: 'হোমওয়ার্ক সমাধান ও ছবি এঁকে সাহায্য করে!',
    Spanish: 'Resuelve tareas y genera diagramas educativos!',
    French: 'Résout vos exercices et crée des illustrations !',
    German: 'Löst Aufgaben und erstellt Zeichnungen !'
  };
  return intro[lang] || 'Solve Homework...';
};

const parseBoldWordsInChalk = (text: string) => {
  const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <strong key={i} className="font-black text-yellow-250 bg-slate-900 border border-slate-700 px-1 py-0.5 rounded-md">
          {part}
        </strong>
      );
    }
    return part;
  });
};

const renderChatMessageInChalk = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-4 font-mono text-sm md:text-base leading-relaxed text-slate-100">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('#')) {
          const headingText = trimmed.replace(/^#+\s*/, '');
          return (
            <h4 
              key={idx} 
              className="font-black tracking-tight text-teal-300 border-b-2 border-dashed border-slate-700 pb-2 text-base md:text-lg mt-6 mb-3 flex items-center gap-1.5"
            >
              <span>🌟</span>
              <span>{headingText}</span>
            </h4>
          );
        }
        
        if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
          const content = trimmed.replace(/^[\*\-]\s*/, '');
          return (
            <div key={idx} className="flex items-start space-x-2.5 pl-2 my-1.5">
              <span className="text-yellow-400 shrink-0 select-none text-[12px] pt-1.5">★</span>
              <span className="text-slate-200 font-bold">{parseBoldWordsInChalk(content)}</span>
            </div>
          );
        }
        
        if (/^\d+\.\s/.test(trimmed)) {
          const content = trimmed.replace(/^\d+\.\s*/, '');
          const match = trimmed.match(/^(\d+)\.\s*/);
          const num = match ? match[1] : "•";
          return (
            <div key={idx} className="flex items-start space-x-2.5 pl-1.5 my-2">
              <span className="bg-slate-800 text-yellow-300 rounded-lg w-6 h-6 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 border border-slate-700 shadow-2xs">
                {num}
              </span>
              <span className="text-slate-200 font-bold pt-0.5">{parseBoldWordsInChalk(content)}</span>
            </div>
          );
        }
        
        if (!trimmed) {
          return <div key={idx} className="h-2.5" />;
        }
        
        return (
          <p key={idx} className="text-slate-250 leading-relaxed font-bold">
            {parseBoldWordsInChalk(line)}
          </p>
        );
      })}
    </div>
  );
};

interface StreakDayType {
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

const DEFAULT_STREAK_DAYS: StreakDayType[] = [
  { id: 1, name: 'Day 1', nameHi: 'दिन 1', label: 'Mon', labelHi: 'सोम', goal: 'Ask AI Tutor a homework question', goalHi: 'एआई टीचर से एक सवाल पूछें 🤖', completed: false, xpAwarded: 20 },
  { id: 2, name: 'Day 2', nameHi: 'दिन 2', label: 'Tue', labelHi: 'मंगल', goal: 'Feed or Pet your virtual study companion Chimpu', goalHi: 'अपने स्टडी पार्टनर चिम्पू को खाना खिलाएं या सहलाएं 🎋', completed: false, xpAwarded: 20 },
  { id: 3, name: 'Day 3', nameHi: 'दिन 3', label: 'Wed', labelHi: 'बुध', goal: 'Earn 3+ score in any Practice Quiz', goalHi: 'क्विज़ में ३ या उससे ज़्यादा अंक लाएं 🏆', completed: false, xpAwarded: 20 },
  { id: 4, name: 'Day 4', nameHi: 'दिन 4', label: 'Thu', labelHi: 'गुरु', goal: 'Create a new study note in your Notebook', goalHi: 'अपने नोटबुक में एक नया स्टडी नोट बनाएं 📝', completed: false, xpAwarded: 20 },
  { id: 5, name: 'Day 5', nameHi: 'दिन 5', label: 'Fri', labelHi: 'शुक्र', goal: 'Complete a study planner task', goalHi: 'स्टडी प्लानर में कोई काम पूरा करें 📅', completed: false, xpAwarded: 20 }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); 
  const [notebookTab, setNotebookTab] = useState<'notes' | 'planner' | 'flashcards'>('notes');
  const [waveToast, setWaveToast] = useState<{ name: string; response: string; points: number } | null>(null);

  // Retro Audio effects
  const playAudioChime = (type: 'coin' | 'levelUp' | 'success' | 'draw' | 'quest') => {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      if (type === 'coin') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
        osc2.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.4);
        osc2.stop(ctx.currentTime + 0.4);
      } else if (type === 'levelUp') {
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.06);
          gain.gain.setValueAtTime(0.08, ctx.currentTime + index * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + index * 0.06 + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + index * 0.06);
          osc.stop(ctx.currentTime + index * 0.06 + 0.25);
        });
      } else if (type === 'quest' || type === 'success') {
        const freqs = [329.63, 392.00, 523.25];
        freqs.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(freq * 2, ctx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.05, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.35);
        });
      } else if (type === 'draw') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  // Firebase and Authentication States
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'phone' | 'guest'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [leaderboard, setLeaderboard] = useState<{ name: string; points: number; level: number }[]>([]);
  const [buddies, setBuddies] = useState<any[]>([]);

  // Virtual study pet state
  const [pet, setPet] = useState<{
    name: string;
    happiness: number;
    fullness: number;
    accessory: string;
    petCount: number;
  }>({
    name: 'Chimpu 🐼',
    happiness: 85,
    fullness: 80,
    accessory: 'none',
    petCount: 0
  });

  // Daily quests state
  const [quests, setQuests] = useState<{
    id: string;
    text: string;
    textHi: string;
    xp: number;
    completed: boolean;
  }[]>([
    { id: 'ask_ai', text: 'Ask AI Tutor a homework question', textHi: 'एआई टीचर से एक सवाल पूछें 🤖', xp: 15, completed: false },
    { id: 'quiz_hero', text: 'Earn 3+ score in any Practice Quiz', textHi: 'क्विज़ में 3 या उससे ज़्यादा अंक लाएं 🏆', xp: 25, completed: false },
    { id: 'pet_care', text: 'Feed or Pet your virtual study companion', textHi: 'अपने स्टडी पार्टनर चिम्पू को खाना खिलाएं या सहलाएं 🎋', xp: 10, completed: false },
  ]);

  const [streakDays, setStreakDays] = useState<StreakDayType[]>(DEFAULT_STREAK_DAYS);

  const [selectedDayId, setSelectedDayId] = useState<number>(1);

  const [brushColor, setBrushColor] = useState('#1e293b');
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [speakingText, setSpeakingText] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Registration local state fields
  const [regName, setRegName] = useState('');
  const [regSchool, setRegSchool] = useState('');
  const [regClass, setRegClass] = useState('6');
  const [regAvatar, setRegAvatar] = useState('🐼');
  const [isTagMode, setIsTagMode] = useState(false);

  // Core local states
  const [user, setUser] = useState<UserType | null>(null);

  // Sync registration form states with loaded user profile details
  useEffect(() => {
    if (user) {
      setRegName(user.name || '');
      setRegSchool(user.school || '');
      setRegClass(user.className || '6');
      setRegAvatar(user.avatar || '🐼');
    }
  }, [user]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

  // Flashcards UI session and generator states
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [flashcardProgressStage, setFlashcardProgressStage] = useState<string>('');
  const [flashcardProgressPercent, setFlashcardProgressPercent] = useState<number>(0);
  const [isFlashcardSessionActive, setIsFlashcardSessionActive] = useState(false);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState(false);
  const [sessionFlashcards, setSessionFlashcards] = useState<Flashcard[]>([]);
  const [selectedSubjectForFlashcard, setSelectedSubjectForFlashcard] = useState<Subject>('Science');
  const [selectedNoteIdForFlashcard, setSelectedNoteIdForFlashcard] = useState<string | number | 'none'>('none');
  const [flashcardCountToGenerate, setFlashcardCountToGenerate] = useState(5);

  // Chat & interactive history states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [fullScreenMessage, setFullScreenMessage] = useState<ChatMessage | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Group views helper states
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [groupTab, setGroupTab] = useState<'chat' | 'notes' | 'questions' | 'sessions'>('chat');
  const [groupChatInput, setGroupChatInput] = useState('');
  const [groupMessages, setGroupMessages] = useState<Record<string | number, GroupMessage[]>>({});
  const [groupNotes, setGroupNotes] = useState<Record<string | number, GroupNote[]>>({});
  const [groupQuestions, setGroupQuestions] = useState<Record<string | number, GroupQuestion[]>>({});
  const [groupSessions, setGroupSessions] = useState<Record<string | number, GroupSession[]>>({});
  const [joinedGroupIds, setJoinedGroupIds] = useState<(string | number)[]>([]);

  // Filtering states for groups list
  const [groupFilterSubject, setGroupFilterSubject] = useState<string>('All');
  const [groupSearchCourse, setGroupSearchCourse] = useState<string>('');

  // Modal helpers
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isToolkitOpen, setIsToolkitOpen] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '', subject: 'Mathematics' as Subject });
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [newSchedule, setNewSchedule] = useState<{ task: string; time: string; day: string; category: 'Exam' | 'Homework' | 'Project' | 'Other' }>({ task: '', time: '', day: 'Monday', category: 'Homework' });
  const [badgeToast, setBadgeToast] = useState<{ badge_name: string; icon: string } | null>(null);
  
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', subject: 'Mathematics' as Subject, course: '' });
  
  const [isAddingGroupNote, setIsAddingGroupNote] = useState(false);
  const [newGroupNote, setNewGroupNote] = useState({ title: '', content: '' });

  const [isAddingGroupQuestion, setIsAddingGroupQuestion] = useState(false);
  const [newGroupQuestion, setNewGroupQuestion] = useState({ title: '', content: '' });

  const [isAddingGroupSession, setIsAddingGroupSession] = useState(false);
  const [newGroupSession, setNewGroupSession] = useState({
    title: '',
    topic: '',
    date: '',
    time: '',
    duration: 45,
    meeting_platform: 'Google Meet',
    meeting_link: ''
  });
  const [newAnswerInputs, setNewAnswerInputs] = useState<Record<string, string>>({});

  // Quiz helper states
  const [quizSubject, setQuizSubject] = useState<Subject | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizLanguage, setQuizLanguage] = useState<AppLanguage>('English');
  const [quizDifficulty, setQuizDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [appLanguage, setAppLanguage] = useState<AppLanguage>(() => {
    return (localStorage.getItem('studybuddy_appLanguage') as AppLanguage) || 'English';
  });
  const [quotaExceeded, setQuotaExceeded] = useState(isAiQuotaExceeded);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showXpGuide, setShowXpGuide] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleQuotaChange = (e: any) => {
      setQuotaExceeded(e.detail?.exceeded ?? false);
    };
    window.addEventListener('ai-quota-state-changed', handleQuotaChange);
    return () => {
      window.removeEventListener('ai-quota-state-changed', handleQuotaChange);
    };
  }, []);

  // Real Firebase and Authentication state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setAuthChecking(true);
      if (fUser) {
        setFirebaseUser(fUser);
        try {
          const dbProfile = await getUserProfile(fUser.uid);
          if (dbProfile) {
            const loadedUser: UserType = {
              id: fUser.uid,
              name: dbProfile.name,
              school: dbProfile.school,
              className: dbProfile.className,
              points: dbProfile.points || 100,
              level: dbProfile.level || 1,
              avatar: dbProfile.avatar || '🐼',
              badges: dbProfile.badges || [],
              pet: (dbProfile.pet as any) || {
                name: 'Chimpu 🐼',
                happiness: 85,
                fullness: 80,
                accessory: 'none',
                petCount: 0
              }
            };
            setUser(loadedUser);
            if (dbProfile.pet) {
              setPet(dbProfile.pet as any);
            }
            if ((dbProfile as any).quests && (dbProfile as any).quests.length > 0) {
              setQuests((dbProfile as any).quests);
            }
            if ((dbProfile as any).streakDays && (dbProfile as any).streakDays.length > 0) {
              setStreakDays((dbProfile as any).streakDays);
            }
            localStorage.setItem('studybuddy_local_profile', JSON.stringify(loadedUser));
          } else {
            // New user signed in (e.g. Google Sign-In) but doesn't have a profile yet in Firestore
            const localProfileStr = localStorage.getItem('studybuddy_local_profile');
            if (localProfileStr) {
              try {
                const parsed = JSON.parse(localProfileStr);
                const uploadedUser: UserType = {
                  ...parsed,
                  id: fUser.uid
                };
                await saveUserProfile(uploadedUser);
                setUser(uploadedUser);
                localStorage.setItem('studybuddy_local_profile', JSON.stringify(uploadedUser));
              } catch (e) {
                setUser(null);
              }
            } else {
              setUser(null);
            }
          }
        } catch (err) {
          console.error("Error reading student profile on auth change:", err);
          setUser(null);
        }
      } else {
        setFirebaseUser(null);
        const localProfileStr = localStorage.getItem('studybuddy_local_profile');
        if (localProfileStr) {
          try {
            const parsed = JSON.parse(localProfileStr);
            setUser(parsed);
            if (parsed.pet) {
              setPet(parsed.pet as any);
            }
            if (parsed.quests) {
              setQuests(parsed.quests);
            }
            if (parsed.streakDays) {
              setStreakDays(parsed.streakDays);
            }
          } catch (e) {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  // Synchronize quests, streakDays, and pet to Firestore on state change
  useEffect(() => {
    if (!firebaseUser || !user) return;
    
    const timeoutId = setTimeout(() => {
      const updatedUser = {
        ...user,
        quests,
        streakDays,
        pet
      };
      saveUserProfile(updatedUser as any).catch(err => console.error("Error autosaving quests/streak/pet:", err));
    }, 1000); // Debounce to prevent rapid writes

    return () => clearTimeout(timeoutId);
  }, [quests, streakDays, pet, firebaseUser, user?.id]);

  // Reusable function to sync student data from Firestore or LocalStorage
  const syncStudentData = async () => {
    if (!user) return;
    try {
      if (firebaseUser) {
        const userNotes = await getNotes(firebaseUser.uid);
        setNotes(userNotes);

        const userSchedule = await getSchedule(firebaseUser.uid);
        setSchedule(userSchedule);

        const userProgress = await getProgress(firebaseUser.uid);
        setProgress(userProgress);

        const allGroups = await getGroups();
        setGroups(allGroups);

        try {
          const memberships = await Promise.all(
            allGroups.map(async (g) => {
              const isMember = await isUserInGroup(g.id, firebaseUser.uid);
              return isMember ? g.id : null;
            })
          );
          setJoinedGroupIds(memberships.filter(id => id !== null) as (string | number)[]);
        } catch (mErr) {
          console.error("Error verifying group memberships:", mErr);
        }

        const board = await getLeaderboard();
        setLeaderboard(board);

        const userFlashcards = await getFlashcards(firebaseUser.uid);
        setFlashcards(userFlashcards);
      } else {
        // Guest local fallback
        const localNotes = JSON.parse(localStorage.getItem('studybuddy_guest_notes') || '[]');
        setNotes(localNotes);

        const localSchedule = JSON.parse(localStorage.getItem('studybuddy_guest_schedule') || '[]');
        setSchedule(localSchedule);

        const localProgress = JSON.parse(localStorage.getItem('studybuddy_guest_progress') || '[]');
        setProgress(localProgress);

        const localGroups = JSON.parse(localStorage.getItem('studybuddy_guest_groups') || '[]');
        setGroups(localGroups);

        const localJoined = JSON.parse(localStorage.getItem('studybuddy_guest_joined_groups') || '[]');
        setJoinedGroupIds(localJoined);

        const localFlashcards = JSON.parse(localStorage.getItem('studybuddy_guest_flashcards') || '[]');
        setFlashcards(localFlashcards);
      }

      // Populate peer list dynamically from Firestore
      const peerBuddies: any[] = [];
      if (firebaseUser) {
        try {
          const otherUsersSnap = await getDocs(query(collection(db, "users"), limit(10)));
          otherUsersSnap.forEach((docSnap) => {
            if (docSnap.id !== firebaseUser.uid) {
              const data = docSnap.data();
              peerBuddies.push({
                id: docSnap.id,
                name: data.name || "Study Companion",
                subject: data.className ? `Class ${data.className} student` : "General Study",
                online: Math.random() > 0.3,
                avatar: data.avatar || "🦊",
                waveResponse: `Hey ${user.name}! Let's study and complete our daily challenges together! 🚀`
              });
            }
          });
        } catch (err) {
          console.error("Error loading peer presence:", err);
        }
      }

      if (peerBuddies.length === 0) {
        peerBuddies.push(
          { id: 'b1', name: 'Alice Sharma', subject: 'Mathematics', online: true, avatar: '🦄', waveResponse: `Hey ${user.name}! Mathematics is fun, let's solve some sums! ✏️` },
          { id: 'b2', name: 'Bob Verma', subject: 'Science', online: true, avatar: '🦊', waveResponse: `Hey ${user.name}! Ready to review biology chapter 3 today? 🔬` },
          { id: 'b3', name: 'Sarah Patel', subject: 'English', online: false, avatar: '🦉', waveResponse: `Just read a story book! Catch you later!` }
        );
      }
      setBuddies(peerBuddies);

    } catch (err) {
      console.error("Error syncing student database:", err);
    }
  };

  // Sync personal database items from Firestore
  useEffect(() => {
    syncStudentData();
  }, [firebaseUser, user]);

  // Real-time cooperative study groups sub-listeners
  useEffect(() => {
    if (!activeGroup) return;

    let unsubMessages = () => {};
    let unsubNotes = () => {};
    let unsubQuestions = () => {};
    let unsubSessions = () => {};

    if (firebaseUser) {
      // Firebase real-time listeners
      unsubMessages = subscribeToGroupMessages(activeGroup.id, (msgs) => {
        setGroupMessages(prev => ({ ...prev, [activeGroup.id]: msgs }));
      });

      unsubNotes = subscribeToGroupNotes(activeGroup.id, (notes) => {
        setGroupNotes(prev => ({ ...prev, [activeGroup.id]: notes }));
      });

      unsubQuestions = subscribeToGroupQuestions(activeGroup.id, (questions) => {
        setGroupQuestions(prev => ({ ...prev, [activeGroup.id]: questions }));
      });

      unsubSessions = subscribeToGroupSessions(activeGroup.id, (sessions) => {
        setGroupSessions(prev => ({ ...prev, [activeGroup.id]: sessions }));
      });
    } else {
      // Load group messages from local storage
      const localMsgs = JSON.parse(localStorage.getItem(`studybuddy_group_messages_${activeGroup.id}`) || '[]');
      // If it's empty, add some cute mock greetings from our online buddies to make it interactive!
      if (localMsgs.length === 0) {
        const defaultGreetings: GroupMessage[] = [
          {
            id: 'gmsg_init_1',
            group_id: activeGroup.id,
            user_id: 'b1',
            user_name: 'Alice Sharma',
            text: `Welcome to ${activeGroup.name}! Let's prepare our notes here! 📚`,
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: 'gmsg_init_2',
            group_id: activeGroup.id,
            user_id: 'b2',
            user_name: 'Bob Verma',
            text: `Awesome, I'm ready for the study session! 🚀 Let's ask Gemini AI if we need help.`,
            created_at: new Date(Date.now() - 1800000).toISOString()
          }
        ];
        localStorage.setItem(`studybuddy_group_messages_${activeGroup.id}`, JSON.stringify(defaultGreetings));
        setGroupMessages(prev => ({ ...prev, [activeGroup.id]: defaultGreetings }));
      } else {
        setGroupMessages(prev => ({ ...prev, [activeGroup.id]: localMsgs }));
      }

      // Load group notes from local storage
      const localNotes = JSON.parse(localStorage.getItem(`studybuddy_group_notes_${activeGroup.id}`) || '[]');
      setGroupNotes(prev => ({ ...prev, [activeGroup.id]: localNotes }));

      // Load group questions & sessions from local storage with real-time reactive event listeners
      unsubQuestions = subscribeToGroupQuestions(activeGroup.id, (questions) => {
        setGroupQuestions(prev => ({ ...prev, [activeGroup.id]: questions }));
      });

      unsubSessions = subscribeToGroupSessions(activeGroup.id, (sessions) => {
        setGroupSessions(prev => ({ ...prev, [activeGroup.id]: sessions }));
      });
    }

    return () => {
      unsubMessages();
      unsubNotes();
      unsubQuestions();
      unsubSessions();
    };
  }, [activeGroup, firebaseUser]);

  // Update local user profile when state updates
  useEffect(() => {
    if (user) {
      localStorage.setItem('studybuddy_local_profile', JSON.stringify({
        ...user,
        pet: pet as any
      }));
    }
  }, [user, pet]);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler as EventListener);
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, []);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        setDeferredPrompt(null);
      });
    }
  };

  const handleRegister = async (e: any) => {
    if (e) e.preventDefault();
    if (!regName.trim() || !regSchool.trim() || !regClass.trim()) {
      alert("कृपया अपनी सारी जानकारी भरें!\nPlease fill out all dynamic information fields!");
      return;
    }

    try {
      setAuthLoading(true);
      const userId = firebaseUser ? firebaseUser.uid : 'student_' + Date.now();
      const newUser: UserType = {
        id: userId,
        name: regName.trim(),
        school: regSchool.trim(),
        className: regClass,
        points: 100,
        level: 1,
        avatar: regAvatar,
        badges: [{ id: Date.now(), badge_name: 'Quick Start', icon: '🚀', date_earned: new Date().toLocaleDateString() }],
        pet: {
          name: 'Chimpu 🐼',
          happiness: 85,
          fullness: 80,
          accessory: 'none',
          petCount: 0
        },
        quests: quests,
        streakDays: streakDays
      };

      localStorage.setItem('studybuddy_local_profile', JSON.stringify(newUser));
      setUser(newUser);
      
      if (firebaseUser) {
        await saveUserProfile(newUser);
      }
      
      setShowProfileSetup(false);
    } catch (err) {
      console.error("Error saving registered profile:", err);
      alert("Failed to save profile. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Points tracking for chimes
  const prevPointsRef = useRef<number>(user?.points || 0);
  const prevLevelRef = useRef<number>(user?.level || 1);
  const questsRef = useRef(quests);
  const streakDaysRef = useRef(streakDays);
  const petRef = useRef(pet);

  useEffect(() => {
    questsRef.current = quests;
  }, [quests]);

  useEffect(() => {
    streakDaysRef.current = streakDays;
  }, [streakDays]);

  useEffect(() => {
    petRef.current = pet;
  }, [pet]);
  useEffect(() => {
    if (!user) return;
    const prevPoints = prevPointsRef.current;
    const prevLevel = prevLevelRef.current;
    
    if (user.points > prevPoints) {
      if (user.level > prevLevel) {
        playAudioChime('levelUp');
      } else {
        playAudioChime('coin');
      }
    }
    prevPointsRef.current = user.points;
    prevLevelRef.current = user.level;
  }, [user?.points, user?.level]);

  // Support quest tracking updates
  const completeStreakDay = (dayId: number) => {
    setStreakDays(prev => {
      const updated = prev.map(d => {
        if (d.id === dayId && !d.completed) {
          setTimeout(() => {
            awardPoints(d.xpAwarded);
            playAudioChime('success');
          }, 50);
          return { ...d, completed: true };
        }
        return d;
      });
      return updated;
    });
  };

  const claimStreakReward = () => {
    awardPoints(50);
    playAudioChime('levelUp');
    setStreakDays(DEFAULT_STREAK_DAYS);
    setSelectedDayId(1);
    alert(appLanguage === 'Hindi'
      ? "शानदार! आपने ५-दिवसीय सुपर बोनस (+५0 XP) का दावा किया है! 🎉"
      : "Awesome! You have claimed the 5-Day Super Streak Bonus (+50 XP)! 🎉");
  };

  const completeQuest = (questId: string) => {
    setQuests(prev => prev.map(q => {
      if (q.id === questId && !q.completed) {
        setTimeout(() => awardPoints(q.xp), 50);
        setTimeout(() => playAudioChime('quest'), 150);
        
        // Auto-complete corresponding streak days
        if (questId === 'ask_ai') {
          completeStreakDay(1);
        } else if (questId === 'pet_care') {
          completeStreakDay(2);
        } else if (questId === 'quiz_hero') {
          completeStreakDay(3);
        }
        
        return { ...q, completed: true };
      }
      return q;
    }));
  };

  const handlePetFeed = () => {
    if (!user) return;
    if (user.points < 15) {
      alert("Oops! You need at least 15 XP points to feed Bamboo 🎋 to Chimpu!");
      return;
    }
    awardPoints(-15);
    setPet(prev => ({ 
      ...prev, 
      fullness: Math.min(100, prev.fullness + 25), 
      happiness: Math.min(100, prev.happiness + 10) 
    }));
    playAudioChime('success');
    completeQuest('pet_care');
  };

  const handleBuyAccessory = (item: { id: string, label: string, cost: number }) => {
    if (!user) return;
    if (user.points < item.cost) {
      alert(`Oops! You need ${item.cost} points, but you have ${item.cost} points. Complete more activities or study quizzes to earn points!`);
      return;
    }
    awardPoints(-item.cost);
    setPet(prev => ({ ...prev, accessory: item.id, happiness: Math.min(100, prev.happiness + 15) }));
    playAudioChime('success');
  };

  const handlePetCompanionClick = () => {
    setPet(prev => ({ 
      ...prev, 
      happiness: Math.min(100, prev.happiness + 5),
      petCount: prev.petCount + 1
    }));
    playAudioChime('draw');
    completeQuest('pet_care');
  };

  // Points & Badge System
  const awardPoints = (amount: number, checkBadgeType?: string) => {
    setUser(prev => {
      if (!prev) return null;
      const newPoints = (prev.points || 0) + amount;
      const newLevel = Math.floor(newPoints / 100) + 1;
      const updatedBadges = [...(prev.badges || [])];

      let newlyEarnedBadge: any = null;

      if (checkBadgeType === 'quiz' && !updatedBadges.some(b => b.badge_name === 'Quiz Master')) {
        newlyEarnedBadge = { id: Date.now(), badge_name: 'Quiz Master', icon: '🏆', date_earned: new Date().toLocaleDateString() };
        updatedBadges.push(newlyEarnedBadge);
      }
      if (checkBadgeType === 'note' && !updatedBadges.some(b => b.badge_name === 'Note Taker')) {
        newlyEarnedBadge = { id: Date.now() + 1, badge_name: 'Note Taker', icon: '📝', date_earned: new Date().toLocaleDateString() };
        updatedBadges.push(newlyEarnedBadge);
      }
      if ((checkBadgeType === 'math_whiz' || checkBadgeType === 'master_mathematician') && !updatedBadges.some(b => b.badge_name === 'Master Mathematician')) {
        newlyEarnedBadge = { id: Date.now() + 2, badge_name: 'Master Mathematician', icon: '📐', date_earned: new Date().toLocaleDateString() };
        updatedBadges.push(newlyEarnedBadge);
      }
      if ((checkBadgeType === 'science_master' || checkBadgeType === 'science_whiz') && !updatedBadges.some(b => b.badge_name === 'Science Whiz')) {
        newlyEarnedBadge = { id: Date.now() + 3, badge_name: 'Science Whiz', icon: '🔬', date_earned: new Date().toLocaleDateString() };
        updatedBadges.push(newlyEarnedBadge);
      }
      if (checkBadgeType === 'study_session' && !updatedBadges.some(b => b.badge_name === 'Study Scholar')) {
        newlyEarnedBadge = { id: Date.now() + 4, badge_name: 'Study Scholar', icon: '🎓', date_earned: new Date().toLocaleDateString() };
        updatedBadges.push(newlyEarnedBadge);
      }
      if (checkBadgeType === 'topic_master' && !updatedBadges.some(b => b.badge_name === 'Topic Master')) {
        newlyEarnedBadge = { id: Date.now() + 5, badge_name: 'Topic Master', icon: '⭐', date_earned: new Date().toLocaleDateString() };
        updatedBadges.push(newlyEarnedBadge);
      }
      if (checkBadgeType === 'task_completed' && !updatedBadges.some(b => b.badge_name === 'Task Master')) {
        newlyEarnedBadge = { id: Date.now() + 6, badge_name: 'Task Master', icon: '✅', date_earned: new Date().toLocaleDateString() };
        updatedBadges.push(newlyEarnedBadge);
      }

      if (newlyEarnedBadge) {
        setTimeout(() => {
          setBadgeToast({ badge_name: newlyEarnedBadge.badge_name, icon: newlyEarnedBadge.icon });
          setTimeout(() => {
            setBadgeToast(null);
          }, 5000);
        }, 50);
      }

      const updatedUser = { 
        ...prev, 
        points: newPoints, 
        level: newLevel, 
        badges: updatedBadges,
        quests: questsRef.current,
        streakDays: streakDaysRef.current,
        pet: petRef.current
      };
      if (firebaseUser) {
        localStorage.setItem('cached_study_user_' + firebaseUser.uid, JSON.stringify(updatedUser));
        saveUserProfile(updatedUser as any).catch(err => console.error("Failed to update user profile in Firestore:", err));
      }
      return updatedUser;
    });
  };

  // Generate leaderboard displaying real users from Firestore
  const getLeaderboardList = () => {
    const defaultCompetitors = [
      { name: "Bob Verma 🦊", points: 340, level: 4 },
      { name: "Alice Sharma 🦄", points: 280, level: 3 },
      { name: "Sarah Patel 🦉", points: 195, level: 2 },
      { name: "Rohan Das 🐼", points: 145, level: 2 },
    ];

    // Combine current user if logged in
    const activeUserEntry = user ? { name: `${user.name} (You) ⭐️`, points: user.points || 0, level: user.level || 1 } : null;

    let combined = [...leaderboard];
    if (combined.length <= 1) {
      // Use fallback if there's no other users in db yet
      combined = [...combined, ...defaultCompetitors];
    }

    if (activeUserEntry) {
      // Filter out any duplicate of the current user's name without the (You) suffix
      combined = combined.filter(c => c.name !== user.name && !c.name.includes('(You)'));
      combined.push(activeUserEntry);
    }

    // Filter duplicates by clean name
    const seen = new Set<string>();
    const unique: typeof combined = [];
    for (const item of combined) {
      const cleanName = item.name.replace(' (You) ⭐️', '').trim();
      if (!seen.has(cleanName)) {
        seen.add(cleanName);
        unique.push(item);
      }
    }

    // Sort descending by points
    return unique.sort((a, b) => b.points - a.points).slice(0, 5);
  };

  // Interactive Buddy Waving System (Bringing People Up)
  const handleWaveToPeer = (peer: typeof PEER_PRESENCE[0]) => {
    const personalizedResponse = peer.waveResponse.replace('{name}', user?.name || 'friend');
    setWaveToast({ name: peer.name, response: personalizedResponse, points: 5 });
    awardPoints(5);
    setTimeout(() => {
      setWaveToast(null);
    }, 4500);
  };

  // AI Assistant trigger
  const handleSendMessage = async () => {
    if (!chatInput.trim() && !selectedImage) return;

    const userMsg: ChatMessage = { role: 'user', text: chatInput, image: selectedImage || undefined };
    setChatMessages(prev => [...prev, userMsg]);
    
    const inputCopy = chatInput;
    const imageCopy = selectedImage;
    setChatInput('');
    setSelectedImage(null);
    setIsChatLoading(true);

    try {
      const studentContext = user ? { name: user.name, school: user.school, className: user.className } : undefined;
      const answer = await getStudyAnswer(inputCopy || "Discuss this homework task", imageCopy || undefined, studentContext, appLanguage);
      let aiImage: string | undefined = undefined;

      if (inputCopy.toLowerCase().includes('diagram') || inputCopy.toLowerCase().includes('visualize')) {
        const diagram = await generateStudyDiagram(inputCopy);
        if (diagram) aiImage = diagram;
      }

      const newModelMsg: ChatMessage = { role: 'model', text: answer, image: aiImage };
      setChatMessages(prev => [...prev, newModelMsg]);
      setFullScreenMessage(newModelMsg);
      awardPoints(10);
      completeQuest('ask_ai');
    } catch (e) {
      console.error(e);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Voice handler
  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setChatInput(prev => prev + ' ' + text);
    };
    recognition.start();
  };

  // Image Helper
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSpeakMessage = (text: string) => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      if (speakingText === text) {
        setSpeakingText(null);
        return;
      }
    }

    setSpeakingText(text);

    // Remove markdown characters so the voice reader sounds professional and seamless
    let cleanText = text
      .replace(/[\*#_`\-]/g, ' ')
      .replace(/\[.*?\]\(.*?\)/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);

    if (appLanguage === 'Hindi' || appLanguage === 'Hinglish') {
      utterance.lang = 'hi-IN';
    } else if (appLanguage === 'Spanish') {
      utterance.lang = 'es-ES';
    } else if (appLanguage === 'French') {
      utterance.lang = 'fr-FR';
    } else if (appLanguage === 'German') {
      utterance.lang = 'de-DE';
    } else if (appLanguage === 'Tamil') {
      utterance.lang = 'ta-IN';
    } else if (appLanguage === 'Bengali') {
      utterance.lang = 'bn-IN';
    } else if (appLanguage === 'Marathi') {
      utterance.lang = 'mr-IN';
    } else {
      utterance.lang = 'en-US';
    }

    utterance.onend = () => {
      setSpeakingText(null);
    };

    utterance.onerror = () => {
      setSpeakingText(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
    playAudioChime('draw');
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
    setIsDrawing(true);
    playAudioChime('draw');
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSendDoodleToAI = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL("image/png");
    setSelectedImage(dataUrl);
    setChatInput(appLanguage === 'Hindi' || appLanguage === 'Hinglish'
      ? 'कृपया मेरी यह ड्राइंग/रफ कॉपी देखकर आसान शब्दों में समझाएं!' 
      : 'Look at my drawing/work here and explain if it is correct or guide me!');
    playAudioChime('success');
  };

  // Action methods
  const handleAddNote = async () => {
    if (!newNote.title.trim()) return;
    try {
      let generatedId: string | number = 'local_' + Date.now();
      if (firebaseUser) {
        console.log("[SAVE REQUEST] Saving Sticky Note to Firestore...", { userId: firebaseUser.uid, title: newNote.title, subject: newNote.subject });
        generatedId = await saveNote(firebaseUser.uid, {
          title: newNote.title,
          content: newNote.content,
          subject: newNote.subject
        });
        console.log("[SAVE SUCCESS] Sticky Note saved with ID:", generatedId);
      } else {
        console.log("[SAVE REQUEST] Saving Sticky Note to LocalStorage (Guest Mode)...", { title: newNote.title });
        const localNotes = JSON.parse(localStorage.getItem('studybuddy_guest_notes') || '[]');
        const newLocalNote = {
          id: generatedId,
          title: newNote.title,
          content: newNote.content,
          subject: newNote.subject,
          updated_at: new Date().toISOString()
        };
        localNotes.unshift(newLocalNote);
        localStorage.setItem('studybuddy_guest_notes', JSON.stringify(localNotes));
        console.log("[SAVE SUCCESS] Sticky Note saved to LocalStorage with ID:", generatedId);
      }

      const noteItem: Note = { 
        id: generatedId, 
        title: newNote.title, 
        content: newNote.content, 
        subject: newNote.subject, 
        updated_at: new Date().toISOString() 
      };
      setNotes(prev => [noteItem, ...prev]);
      setIsAddingNote(false);
      setNewNote({ title: '', content: '', subject: 'Mathematics' });
      awardPoints(15, 'note');
      completeStreakDay(4); // Complete Day 4: study note creation

      // Reload data after successful save to ensure absolute consistency
      await syncStudentData();
    } catch (err) {
      console.error("[SAVE ERROR] Failed to add note:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      alert(`Error: Failed to save Sticky Note.\nDetails: ${errMsg}`);
    }
  };

  const handleDeleteNote = async (id: string | number) => {
    try {
      if (firebaseUser) {
        await deleteNote(firebaseUser.uid, id);
      } else {
        const localNotes = JSON.parse(localStorage.getItem('studybuddy_guest_notes') || '[]');
        const filtered = localNotes.filter((n: any) => n.id !== id);
        localStorage.setItem('studybuddy_guest_notes', JSON.stringify(filtered));
      }
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  const handleToggleSchedule = async (item: ScheduleItem) => {
    try {
      const updatedCompleted = !item.completed;
      if (firebaseUser) {
        await saveScheduleItem(firebaseUser.uid, {
          id: item.id,
          completed: updatedCompleted
        });
      } else {
        const localSched = JSON.parse(localStorage.getItem('studybuddy_guest_schedule') || '[]');
        const updated = localSched.map((s: any) => {
          if (s.id === item.id) {
            return { ...s, completed: updatedCompleted };
          }
          return s;
        });
        localStorage.setItem('studybuddy_guest_schedule', JSON.stringify(updated));
      }

      setSchedule(prev => prev.map(s => {
        if (s.id === item.id) {
          if (updatedCompleted) {
            awardPoints(10, 'task_completed');
            completeStreakDay(5); // Complete Day 5: complete planner task
          }
          return { ...s, completed: updatedCompleted };
        }
        return s;
      }));
    } catch (err) {
      console.error("Failed to toggle schedule item completed:", err);
    }
  };

  const handleAddSchedule = async () => {
    if (!newSchedule.task.trim()) return;
    try {
      let generatedId: string | number = 'local_' + Date.now();
      if (firebaseUser) {
        console.log("[SAVE REQUEST] Saving Daily Planner task to Firestore...", { userId: firebaseUser.uid, task: newSchedule.task, category: newSchedule.category });
        generatedId = await saveScheduleItem(firebaseUser.uid, {
          task: newSchedule.task,
          time: newSchedule.time || '12:00',
          day: newSchedule.day,
          completed: false,
          category: newSchedule.category
        });
        console.log("[SAVE SUCCESS] Daily Planner task saved with ID:", generatedId);
      } else {
        console.log("[SAVE REQUEST] Saving Daily Planner task to LocalStorage (Guest Mode)...", { task: newSchedule.task });
        const localSched = JSON.parse(localStorage.getItem('studybuddy_guest_schedule') || '[]');
        const newLocalSchedItem = {
          id: generatedId,
          task: newSchedule.task,
          time: newSchedule.time || '12:00',
          day: newSchedule.day,
          completed: false,
          category: newSchedule.category
        };
        localSched.push(newLocalSchedItem);
        localStorage.setItem('studybuddy_guest_schedule', JSON.stringify(localSched));
        console.log("[SAVE SUCCESS] Daily Planner task saved to LocalStorage with ID:", generatedId);
      }

      const item: ScheduleItem = { 
        id: generatedId, 
        task: newSchedule.task, 
        time: newSchedule.time || '12:00', 
        day: newSchedule.day, 
        completed: false,
        category: newSchedule.category
      };
      setSchedule(prev => [...prev, item]);
      setIsAddingSchedule(false);
      setNewSchedule({ task: '', time: '', day: 'Monday', category: 'Homework' });
      awardPoints(5);

      // Reload data after successful save to ensure absolute consistency
      await syncStudentData();
    } catch (err) {
      console.error("[SAVE ERROR] Failed to add schedule item:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      alert(`Error: Failed to save Daily Planner task.\nDetails: ${errMsg}`);
    }
  };

  const handleDeleteSchedule = async (id: string | number) => {
    try {
      if (firebaseUser) {
        await deleteScheduleItem(firebaseUser.uid, id);
      } else {
        const localSched = JSON.parse(localStorage.getItem('studybuddy_guest_schedule') || '[]');
        const filtered = localSched.filter((s: any) => s.id !== id);
        localStorage.setItem('studybuddy_guest_schedule', JSON.stringify(filtered));
      }
      setSchedule(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error("Failed to delete schedule item:", err);
    }
  };

  // Quiz launcher
  const startQuiz = async (subject: Subject, lang: AppLanguage = appLanguage, difficulty: 'Easy' | 'Medium' | 'Hard' = quizDifficulty) => {
    setQuizSubject(subject);
    setQuizLanguage(lang);
    setQuizDifficulty(difficulty);
    setIsQuizLoading(true);
    setQuizQuestions([]);
    setCurrentQuizIndex(0);
    setQuizScore(0);
    setQuizFinished(false);

    try {
      const studentContext = user ? { name: user.name, school: user.school, className: user.className } : undefined;
      const res = await generateQuiz(subject, studentContext, lang, difficulty);
      setQuizQuestions(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsQuizLoading(false);
    }
  };

  const handleQuizAnswer = async (selectedIdx: number) => {
    const isCorrect = selectedIdx === quizQuestions[currentQuizIndex].answer;
    const gain = isCorrect ? 1 : 0;
    const nextScore = quizScore + gain;

    if (currentQuizIndex + 1 < quizQuestions.length) {
      setQuizScore(nextScore);
      setCurrentQuizIndex(prev => prev + 1);
    } else {
      setQuizScore(nextScore);
      setQuizFinished(true);
      const quizRes: Progress = { id: Date.now(), subject: quizSubject!, score: nextScore, total: quizQuestions.length, date: new Date().toISOString() };
      setProgress(prev => [quizRes, ...prev]);
      
      // Save quiz results to cloud Firestore or guest localStorage
      if (firebaseUser) {
        try {
          await saveProgressEntry(firebaseUser.uid, {
            subject: quizSubject!,
            score: nextScore,
            total: quizQuestions.length,
            date: new Date().toISOString()
          });
        } catch (err) {
          console.error("Failed to save progress entry:", err);
        }
      } else {
        const localProgress = JSON.parse(localStorage.getItem('studybuddy_guest_progress') || '[]');
        localProgress.unshift(quizRes);
        localStorage.setItem('studybuddy_guest_progress', JSON.stringify(localProgress));
      }
      
      awardPoints(nextScore * 10, 'quiz');
      if (nextScore >= 3) {
        completeQuest('quiz_hero');
        if (quizSubject === 'Mathematics') {
          awardPoints(0, 'math_whiz');
        } else if (['Science', 'Physics', 'Biology', 'Chemistry'].includes(quizSubject || '')) {
          awardPoints(0, 'science_master');
        }
      }
      if (quizQuestions.length > 0 && nextScore === quizQuestions.length) {
        awardPoints(0, 'topic_master');
      }
    }
  };

  const handleStudySessionComplete = async (subject: Subject, durationMinutes: number) => {
    const entry = {
      subject,
      score: durationMinutes,
      total: durationMinutes,
      date: new Date().toISOString()
    };

    try {
      if (firebaseUser) {
        const id = await saveProgressEntry(firebaseUser.uid, entry);
        setProgress(prev => [{ id, ...entry }, ...prev]);
      } else {
        const localProgress = JSON.parse(localStorage.getItem('studybuddy_guest_progress') || '[]');
        const newLocal = [{ id: 'guest_' + Date.now(), ...entry }, ...localProgress];
        localStorage.setItem('studybuddy_guest_progress', JSON.stringify(newLocal));
        setProgress(newLocal);
      }

      awardPoints(durationMinutes * 2, 'study_session');
    } catch (err) {
      console.error("Error saving completed study session:", err);
    }
  };

  // Group controls
  const handleCreateGroup = async () => {
    if (!newGroup.name.trim() || !user) return;
    try {
      let generatedId: string | number = 'local_group_' + Date.now();
      if (firebaseUser) {
        console.log("[SAVE REQUEST] Creating Study Group in Firestore...", { userId: firebaseUser.uid, name: newGroup.name, subject: newGroup.subject });
        generatedId = await createGroup(
          newGroup.name,
          newGroup.description,
          firebaseUser.uid,
          user.name,
          newGroup.subject,
          newGroup.course
        );
        console.log("[SAVE SUCCESS] Study Group created with ID:", generatedId);
      } else {
        console.log("[SAVE REQUEST] Creating Study Group in LocalStorage (Guest Mode)...", { name: newGroup.name });
        const localGroups = JSON.parse(localStorage.getItem('studybuddy_guest_groups') || '[]');
        const newLocalGroup = {
          id: generatedId,
          name: newGroup.name,
          description: newGroup.description,
          created_by: user.id,
          created_at: new Date().toISOString(),
          member_count: 1,
          subject: newGroup.subject || 'Mathematics',
          course: newGroup.course || ''
        };
        localGroups.unshift(newLocalGroup);
        localStorage.setItem('studybuddy_guest_groups', JSON.stringify(localGroups));

        // Auto join for local storage
        const localJoined = JSON.parse(localStorage.getItem('studybuddy_guest_joined_groups') || '[]');
        if (!localJoined.includes(generatedId)) {
          localJoined.push(generatedId);
          localStorage.setItem('studybuddy_guest_joined_groups', JSON.stringify(localJoined));
        }
        console.log("[SAVE SUCCESS] Study Group created in LocalStorage with ID:", generatedId);
      }

      const grp: Group = { 
        id: generatedId, 
        name: newGroup.name, 
        description: newGroup.description, 
        created_by: firebaseUser ? firebaseUser.uid : user.id, 
        created_at: new Date().toISOString(), 
        member_count: 1,
        subject: newGroup.subject || 'Mathematics',
        course: newGroup.course || ''
      };
      setGroups(prev => [grp, ...prev]);
      setJoinedGroupIds(prev => [...prev, generatedId]);
      setGroupMessages(prev => ({ ...prev, [grp.id]: [] }));
      setGroupNotes(prev => ({ ...prev, [grp.id]: [] }));
      setGroupQuestions(prev => ({ ...prev, [grp.id]: [] }));
      setGroupSessions(prev => ({ ...prev, [grp.id]: [] }));
      setIsAddingGroup(false);
      setNewGroup({ name: '', description: '', subject: 'Mathematics' as Subject, course: '' });
      awardPoints(15); // Added extra points for starting a collaborative learning circle!

      // Reload data after successful save to ensure absolute consistency
      await syncStudentData();
    } catch (err) {
      console.error("[SAVE ERROR] Failed to create study group:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      alert(`Error: Failed to create Study Group.\nDetails: ${errMsg}`);
    }
  };

  const handleJoinGroup = async (groupId: string | number) => {
    if (!user) return;
    try {
      if (firebaseUser) {
        await joinGroup(groupId, firebaseUser.uid, user.name);
      } else {
        const localJoined = JSON.parse(localStorage.getItem('studybuddy_guest_joined_groups') || '[]');
        if (!localJoined.includes(groupId)) {
          localJoined.push(groupId);
          localStorage.setItem('studybuddy_guest_joined_groups', JSON.stringify(localJoined));
        }
      }
      setJoinedGroupIds(prev => [...prev, groupId]);
      awardPoints(10); // Encouraging peer-to-peer connection!
      playAudioChime('coin');
    } catch (err) {
      console.error("Failed to join study group:", err);
    }
  };

  const handleCreateGroupQuestion = async () => {
    if (!activeGroup || !newGroupQuestion.title.trim() || !user) return;
    try {
      await saveGroupQuestion(
        activeGroup.id,
        {
          title: newGroupQuestion.title.trim(),
          content: newGroupQuestion.content.trim(),
        },
        firebaseUser ? firebaseUser.uid : user.id,
        user.name
      );

      setIsAddingGroupQuestion(false);
      setNewGroupQuestion({ title: '', content: '' });
      awardPoints(10); // Reward active academic questions!
      playAudioChime('success');
    } catch (err) {
      console.error("Failed to create group question:", err);
    }
  };

  const handleAnswerQuestion = async (questionId: string | number) => {
    const text = newAnswerInputs[String(questionId)];
    if (!text || !text.trim() || !activeGroup || !user) return;
    try {
      await answerGroupQuestion(
        activeGroup.id,
        questionId,
        text.trim(),
        firebaseUser ? firebaseUser.uid : user.id,
        user.name
      );

      setNewAnswerInputs(prev => ({ ...prev, [String(questionId)]: '' }));
      awardPoints(15); // Heavily award academic assistance!
      playAudioChime('coin');
    } catch (err) {
      console.error("Failed to post answer:", err);
    }
  };

  const handleCreateGroupSession = async () => {
    if (!activeGroup || !newGroupSession.title.trim() || !newGroupSession.date || !newGroupSession.time || !user) return;
    try {
      await saveGroupSession(
        activeGroup.id,
        {
          title: newGroupSession.title.trim(),
          topic: newGroupSession.topic.trim(),
          date: newGroupSession.date,
          time: newGroupSession.time,
          duration: Number(newGroupSession.duration),
          meeting_platform: newGroupSession.meeting_platform,
          meeting_link: newGroupSession.meeting_link.trim()
        },
        firebaseUser ? firebaseUser.uid : user.id,
        user.name
      );

      setIsAddingGroupSession(false);
      setNewGroupSession({
        title: '',
        topic: '',
        date: '',
        time: '',
        duration: 45,
        meeting_platform: 'Google Meet',
        meeting_link: ''
      });
      awardPoints(15); // Reward scheduling collaborative events!
      playAudioChime('success');
    } catch (err) {
      console.error("Failed to schedule group session:", err);
    }
  };

  const handleRsvpSession = async (sessionId: string | number, status: 'yes' | 'no' | 'maybe') => {
    if (!activeGroup || !user) return;
    try {
      await rsvpGroupSession(
        activeGroup.id,
        sessionId,
        firebaseUser ? firebaseUser.uid : user.id,
        user.name,
        status
      );
      awardPoints(5); // Active RSVP points!
      playAudioChime('success');
    } catch (err) {
      console.error("Failed to RSVP to study session:", err);
    }
  };

  const handleSendGroupMessage = async () => {
    if (!groupChatInput.trim() || !activeGroup || !user) return;
    try {
      const authorId = user.id;
      const newMsg: GroupMessage = {
        id: 'gmsg_' + Date.now(),
        group_id: activeGroup.id,
        user_id: authorId,
        user_name: user.name,
        text: groupChatInput.trim(),
        created_at: new Date().toISOString()
      };

      const localMsgs = JSON.parse(localStorage.getItem(`studybuddy_group_messages_${activeGroup.id}`) || '[]');
      localMsgs.push(newMsg);
      localStorage.setItem(`studybuddy_group_messages_${activeGroup.id}`, JSON.stringify(localMsgs));
      setGroupMessages(prev => ({ ...prev, [activeGroup.id]: localMsgs }));
      setGroupChatInput('');

      // Play chime
      playAudioChime('success');

      // AI or buddy response simulation for extra cute engagement!
      setTimeout(() => {
        const responses = [
          "Wow, that's a great point! 🎯 Let's note it down.",
          "Perfect! I am studying the same chapter right now.",
          "Got it! Let's solve a practice quiz on this topic soon. 🏆",
          "Excellent! Thanks for sharing this tip! ✨"
        ];
        const randomBuddy = Math.random() > 0.5 
          ? { id: 'b1', name: 'Alice Sharma' } 
          : { id: 'b2', name: 'Bob Verma' };
        const randomText = responses[Math.floor(Math.random() * responses.length)];
        
        const buddyMsg: GroupMessage = {
          id: 'gmsg_' + Date.now() + '_reply',
          group_id: activeGroup.id,
          user_id: randomBuddy.id,
          user_name: randomBuddy.name,
          text: randomText,
          created_at: new Date().toISOString()
        };

        const currentMsgs = JSON.parse(localStorage.getItem(`studybuddy_group_messages_${activeGroup.id}`) || '[]');
        currentMsgs.push(buddyMsg);
        localStorage.setItem(`studybuddy_group_messages_${activeGroup.id}`, JSON.stringify(currentMsgs));
        setGroupMessages(prev => ({ ...prev, [activeGroup.id]: currentMsgs }));
        playAudioChime('coin');
      }, 1500);

    } catch (err) {
      console.error("Failed to send group message:", err);
    }
  };

  const handleCreateGroupNote = async () => {
    if (!newGroupNote.title.trim() || !activeGroup || !user) return;
    try {
      const authorId = user.id;
      const nNote: GroupNote = { 
        id: 'gnote_' + Date.now(), 
        group_id: activeGroup.id, 
        title: newGroupNote.title.trim(), 
        content: newGroupNote.content.trim(), 
        updated_by: String(authorId), 
        updated_by_name: user.name, 
        updated_at: new Date().toISOString() 
      };

      const localNotes = JSON.parse(localStorage.getItem(`studybuddy_group_notes_${activeGroup.id}`) || '[]');
      localNotes.unshift(nNote);
      localStorage.setItem(`studybuddy_group_notes_${activeGroup.id}`, JSON.stringify(localNotes));
      setGroupNotes(prev => ({ ...prev, [activeGroup.id]: localNotes }));

      setIsAddingGroupNote(false);
      setNewGroupNote({ title: '', content: '' });
      awardPoints(10);
      playAudioChime('success');
    } catch (err) {
      console.error("Failed to create group note:", err);
    }
  };

  // ---------------- FLASHCARDS CORE ACTIONS ----------------

  const handleGenerateFlashcards = async () => {
    setIsGeneratingFlashcards(true);
    setFlashcardProgressStage('Initializing generator...');
    setFlashcardProgressPercent(5);

    const progressInterval = setInterval(() => {
      setFlashcardProgressPercent(prev => {
        if (prev < 25) {
          setFlashcardProgressStage('Connecting to Gemini AI...');
          return prev + 5;
        } else if (prev < 55) {
          setFlashcardProgressStage('Analyzing note contents & topics...');
          return prev + 4;
        } else if (prev < 80) {
          setFlashcardProgressStage('Synthesizing question-answer flashcard pairs...');
          return prev + 3;
        } else if (prev < 95) {
          setFlashcardProgressStage('Structuring valid JSON payload...');
          return prev + 1;
        }
        return prev;
      });
    }, 250);

    try {
      let noteTitle: string | undefined = undefined;
      let noteContent: string | undefined = undefined;

      if (selectedNoteIdForFlashcard !== 'none') {
        const found = notes.find(n => String(n.id) === String(selectedNoteIdForFlashcard));
        if (found) {
          noteTitle = found.title;
          noteContent = found.content;
        }
      }

      const generated = await generateFlashcards(
        selectedSubjectForFlashcard,
        noteTitle,
        noteContent,
        flashcardCountToGenerate
      );

      setFlashcardProgressPercent(90);
      setFlashcardProgressStage('Saving flashcard deck...');

      const newCards: Flashcard[] = generated.map((c, i) => ({
        id: 'fc_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substr(2, 5),
        front: c.front,
        back: c.back,
        subject: selectedSubjectForFlashcard,
        noteId: selectedNoteIdForFlashcard !== 'none' ? selectedNoteIdForFlashcard : undefined,
        interval: 1,
        repetition: 0,
        easeFactor: 2.5,
        nextReviewDate: new Date().toISOString(),
        created_at: new Date().toISOString()
      }));

      if (firebaseUser) {
        for (const card of newCards) {
          const dbId = await saveFlashcard(firebaseUser.uid, card);
          card.id = dbId;
        }
      } else {
        const local = JSON.parse(localStorage.getItem('studybuddy_guest_flashcards') || '[]');
        const updated = [...newCards, ...local];
        localStorage.setItem('studybuddy_guest_flashcards', JSON.stringify(updated));
      }

      setFlashcards(prev => [...newCards, ...prev]);
      setFlashcardProgressPercent(100);
      setFlashcardProgressStage('Flashcards created!');
      playAudioChime('success');
      awardPoints(25, 'note');
      setSelectedNoteIdForFlashcard('none');
    } catch (err) {
      console.error("Failed to generate AI flashcards:", err);
      setFlashcardProgressStage('Generation failed');
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsGeneratingFlashcards(false);
        setFlashcardProgressPercent(0);
        setFlashcardProgressStage('');
      }, 500);
    }
  };

  const handleDeleteFlashcard = async (id: string | number) => {
    try {
      if (firebaseUser) {
        await deleteFlashcard(firebaseUser.uid, id);
      } else {
        const local = JSON.parse(localStorage.getItem('studybuddy_guest_flashcards') || '[]');
        const filtered = local.filter((c: any) => c.id !== id);
        localStorage.setItem('studybuddy_guest_flashcards', JSON.stringify(filtered));
      }
      setFlashcards(prev => prev.filter(c => c.id !== id));
      playAudioChime('coin');
    } catch (err) {
      console.error("Failed to delete flashcard:", err);
    }
  };

  const handleStartStudySession = (reviewOnly = false) => {
    const now = new Date();
    const targetCards = reviewOnly 
      ? flashcards.filter(c => new Date(c.nextReviewDate) <= now)
      : flashcards;

    if (targetCards.length === 0) return;
    
    // Shuffle cards for better active recall
    const shuffled = [...targetCards].sort(() => Math.random() - 0.5);
    setSessionFlashcards(shuffled);
    setCurrentFlashcardIndex(0);
    setIsFlashcardFlipped(false);
    setIsFlashcardSessionActive(true);
    playAudioChime('coin');
  };

  const handleSpacedRepetitionResponse = async (card: Flashcard, quality: 'again' | 'good' | 'easy') => {
    let nextRepetition = card.repetition;
    let nextEaseFactor = card.easeFactor;
    let nextInterval = card.interval;

    if (quality === 'again') {
      nextRepetition = 0;
      nextInterval = 1;
      nextEaseFactor = Math.max(1.3, card.easeFactor - 0.2);
    } else if (quality === 'good') {
      nextRepetition = card.repetition + 1;
      if (nextRepetition === 1) {
        nextInterval = 1;
      } else if (nextRepetition === 2) {
        nextInterval = 4;
      } else {
        nextInterval = Math.round(card.interval * card.easeFactor);
      }
    } else if (quality === 'easy') {
      nextRepetition = card.repetition + 1;
      if (nextRepetition === 1) {
        nextInterval = 3;
      } else if (nextRepetition === 2) {
        nextInterval = 7;
      } else {
        nextInterval = Math.round(card.interval * card.easeFactor * 1.5);
      }
      nextEaseFactor = Math.min(3.0, card.easeFactor + 0.15);
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + nextInterval);
    const nextReviewDate = nextDate.toISOString();

    const updatedCard: Flashcard = {
      ...card,
      repetition: nextRepetition,
      easeFactor: nextEaseFactor,
      interval: nextInterval,
      nextReviewDate
    };

    try {
      if (firebaseUser) {
        await saveFlashcard(firebaseUser.uid, updatedCard);
      } else {
        const local = JSON.parse(localStorage.getItem('studybuddy_guest_flashcards') || '[]');
        const updated = local.map((c: any) => c.id === card.id ? updatedCard : c);
        localStorage.setItem('studybuddy_guest_flashcards', JSON.stringify(updated));
      }

      setFlashcards(prev => prev.map(c => c.id === card.id ? updatedCard : c));
      awardPoints(5);
      playAudioChime('success');

      // Proceed to next card or wrap up
      if (currentFlashcardIndex < sessionFlashcards.length - 1) {
        setIsFlashcardFlipped(false);
        setCurrentFlashcardIndex(prev => prev + 1);
      } else {
        // Complete session
        setIsFlashcardSessionActive(false);
        playAudioChime('levelUp');
        awardPoints(25, 'study_session');
      }
    } catch (err) {
      console.error("Failed to save flashcard review:", err);
    }
  };

  const handleEmailSignIn = async (e: any) => {
    e.preventDefault();
    if (!authEmail || !authPassword) return;
    try {
      setAuthLoading(true);
      await signInWithEmailAndPassword(auth, authEmail, authPassword);
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/operation-not-allowed' || err?.message?.includes('operation-not-allowed')) {
        alert("This sign-in provider (Email/Password) is not enabled in your Firebase project yet.\n\n👉 Recommended: Use 'Sign In with Google' which is fully pre-configured and works instantly!\n\nAlternatively, you can enable the Email/Password provider in the Firebase Console -> Authentication -> Sign-in method.");
      } else {
        alert(err.message || "Failed to sign in. Please check details.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailSignUp = async (e: any) => {
    e.preventDefault();
    if (!authEmail || !authPassword) return;
    try {
      setAuthLoading(true);
      await createUserWithEmailAndPassword(auth, authEmail, authPassword);
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/operation-not-allowed' || err?.message?.includes('operation-not-allowed')) {
        alert("Creating email accounts is not enabled in your Firebase project yet.\n\n👉 Recommended: Use 'Sign In with Google' which is fully pre-configured and works instantly!\n\nAlternatively, you can enable the Email/Password provider in the Firebase Console -> Authentication -> Sign-in method.");
      } else {
        alert(err.message || "Failed to register. Please try another email.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setAuthLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Google sign-in cancelled or failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSendOtp = () => {
    if (!authPhone) {
      alert("Please write your phone number first!");
      return;
    }
    setOtpSent(true);
    alert("Simulation: OTP Sent to " + authPhone + "! Please enter code 123456 to verify!");
  };

  const handleVerifyOtp = async (e: any) => {
    e.preventDefault();
    if (authOtp !== '123456' && authOtp !== '1234') {
      alert("Invalid code! Please use code 123456 to verify simulation.");
      return;
    }
    try {
      setAuthLoading(true);
      // Log in anonymously to simulate phone auth securely
      await signInAnonymously(auth);
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/operation-not-allowed' || err?.message?.includes('operation-not-allowed')) {
        alert("Anonymous / Phone simulation authentication is not enabled in your Firebase project yet.\n\n👉 Recommended: Use 'Sign In with Google' which is fully pre-configured and works instantly!\n\nAlternatively, you can enable the Anonymous provider in your Firebase Console -> Authentication -> Sign-in method.");
      } else {
        alert("Failed to verify code.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setAuthLoading(true);
      await signInAnonymously(auth);
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/operation-not-allowed' || err?.message?.includes('operation-not-allowed')) {
        alert("Guest (Anonymous) login is not enabled in your Firebase project yet.\n\n👉 Recommended: Use 'Sign In with Google' which is fully pre-configured and works instantly!\n\nAlternatively, you can enable the Anonymous provider in your Firebase Console -> Authentication -> Sign-in method.");
      } else {
        alert("Guest login failed.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className={`w-full h-full min-h-screen ${isTagMode ? 'bg-black' : 'bg-slate-900'} font-sans ${isTagMode ? 'text-cyan-400' : 'text-slate-800'} flex justify-center items-center overflow-hidden py-0 md:py-6 relative`} id="applet_canvas">
      
      {/* Background Ambience */}
      <div className={`absolute top-0 left-0 w-full h-full ${isTagMode ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-black to-black' : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950'} pointer-events-none z-0`} />

      {/* Audio element for study beats */}
      <audio id="study-audio" loop preload="none">
        <source src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" type="audio/mpeg" />
      </audio>

      {/* Dynamic Student Onboarding Gatekeeper check */}
      {authChecking ? (
        <div className="w-full max-w-md h-screen md:h-[90vh] bg-slate-50 md:rounded-3xl shadow-2xl flex flex-col justify-center items-center p-6 relative z-20 border border-slate-800/10">
          <div className="text-center space-y-4">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Checking authorization...</p>
          </div>
        </div>
      ) : !user ? (
        <div className="w-full max-w-md h-screen md:h-[90vh] bg-slate-50 md:rounded-3xl shadow-2xl flex flex-col overflow-y-auto p-6 relative z-20 border border-slate-800/10 scrollbar-hide">
          {/* Floating Settings & Language Control (Profile Setup) */}
          <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTagMode(!isTagMode)}
              className={`p-2 rounded-full transition outline-none cursor-pointer ${isTagMode ? 'bg-cyan-950 text-cyan-400' : 'bg-white text-slate-500 hover:bg-slate-100'}`}
              id="tag_mode_toggle_profile"
            >
              <Zap className="w-4 h-4" />
            </button>
          </div>

          <div className="my-auto space-y-6 py-4">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-200">
                <GraduationCap className="w-9 h-9 text-white animate-pulse" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-4 font-display">Student Profile</h2>
              <p className="text-[10px] text-indigo-600 font-extrabold tracking-widest uppercase font-mono bg-indigo-50 px-3 py-1 rounded-full inline-block">Create Your Student Identity</p>
            </div>

            <form onSubmit={handleRegister} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 border-b border-slate-100 pb-3 flex items-center font-display">
                <User className="w-4 h-4 mr-1.5 text-indigo-500" /> {translate('onboarding_details_header', appLanguage, 'Student Details')}
              </h3>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {translate('onboarding_name_label', appLanguage, 'Student Name *')}
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="अपना नाम लिखें (e.g. Rohan Yadav)"
                  className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                  id="reg_name_input"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {translate('onboarding_school_label', appLanguage, 'School Name *')}
                </label>
                <input
                  type="text"
                  required
                  value={regSchool}
                  onChange={(e) => setRegSchool(e.target.value)}
                  placeholder={translate('onboarding_school_placeholder', appLanguage, 'Write school name (e.g. Model School)')}
                  className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                  id="reg_school_input"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {translate('onboarding_class_label', appLanguage, 'Student Class *')}
                </label>
                <select
                  required
                  value={regClass}
                  onChange={(e) => setRegClass(e.target.value)}
                  className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                  id="reg_class_select"
                >
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map((c) => (
                    <option key={c} value={c}>{`${translate('class_num', appLanguage, 'Class')} ${c}`}</option>
                  ))}
                </select>
              </div>

              {/* Study Avatar Selector Option */}
              <div className="space-y-2 pt-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block text-center">
                  {translate('onboarding_avatar_label', appLanguage, 'Choose Your Avatar ✨')}
                </label>
                <div className="flex justify-center items-center gap-3 py-1">
                  {[
                    { char: '🐼', label: 'Panda' },
                    { char: '🦁', label: 'Lion' },
                    { char: '🦉', label: 'Owl' },
                    { char: '🦊', label: 'Fox' },
                    { char: '🦄', label: 'Unicorn' },
                  ].map((av) => (
                    <button
                      key={av.char}
                      type="button"
                      onClick={() => setRegAvatar(av.char)}
                      className={`w-11 h-11 text-2xl rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                        regAvatar === av.char
                          ? 'bg-gradient-to-tr from-indigo-500 to-violet-600 scale-110 shadow-lg shadow-indigo-100 text-white border-2 border-white ring-2 ring-indigo-500'
                          : 'bg-slate-50 hover:bg-slate-100 border border-slate-200/60'
                      }`}
                      title={av.label}
                    >
                      {av.char}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-2xl text-xs font-black tracking-wider uppercase shadow-md shadow-indigo-100 transition active:scale-95 duration-100 mt-2 cursor-pointer font-display disabled:opacity-50"
                id="btn_submit_registration"
              >
                {authLoading ? 'Saving Profile...' : translate('onboarding_submit_btn', appLanguage, "Let's Study! 🚀")}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Main App Container (Absolutely locked viewport) */
        <div className="w-full max-w-md h-screen md:h-[90vh] bg-slate-50 md:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative z-10 border border-slate-800/25">
          
          {/* Floating Settings & Language Control (Main App) */}
          <div className="absolute top-4 left-4 z-50">
            <button
              type="button"
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="p-1 rounded-full hover:bg-slate-100 transition outline-none cursor-pointer text-slate-500"
              id="main_lang_btn"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showLanguageDropdown && (
              <div className="absolute left-0 top-9 w-40 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 flex flex-col divide-y divide-slate-100 max-h-56 overflow-y-auto animate-in fade-in slide-in-from-top-2" id="main_lang_dropdown">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setAppLanguage(lang.code);
                      localStorage.setItem('studybuddy_appLanguage', lang.code);
                      setShowLanguageDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-[10px] font-black flex items-center space-x-2 cursor-pointer hover:bg-slate-50 ${
                      appLanguage === lang.code ? 'text-indigo-600 bg-indigo-50/40 font-black' : 'text-slate-650'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span className="truncate">{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Wave Animation Interactive Toast Message */}
          <AnimatePresence>
            {waveToast && (
              <motion.div 
                initial={{ y: -60, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -60, opacity: 0, scale: 0.95 }}
                className="absolute top-3 left-3 right-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl p-4 shadow-xl z-50 flex items-start space-x-3 border border-indigo-400"
                id="wave_toast"
              >
                <div className="text-2xl pt-1">👋</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-200">Wave Received!</p>
                  <p className="text-sm font-semibold">{waveToast.name} waved back!</p>
                  <p className="text-xs text-indigo-100 italic mt-0.5">"{waveToast.response}"</p>
                </div>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 text-white">+{waveToast.points} XP</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Badge Unlocked Notification Toast */}
          <AnimatePresence>
            {badgeToast && (
              <motion.div 
                initial={{ y: -100, opacity: 0, scale: 0.85 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -100, opacity: 0, scale: 0.85 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 140, 
                  damping: 14, 
                  mass: 0.8 
                }}
                className="absolute top-4 left-4 right-4 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white rounded-3xl p-4 shadow-2xl z-50 flex items-center space-x-4 border border-amber-300 overflow-hidden"
                id="badge_toast"
              >
                {/* Gloss/Shine Sweep Animation */}
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "200%" }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: "linear", repeatDelay: 1 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
                />

                {/* Animated Badge Icon with Bounce/Rotation */}
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 240, damping: 15, delay: 0.15 }}
                  className="w-12 h-12 bg-white/25 rounded-full flex items-center justify-center text-3xl shadow-inner shrink-0 relative z-10"
                >
                  {badgeToast.icon}
                </motion.div>

                {/* Sliding/Fading Text Container */}
                <motion.div 
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25, duration: 0.35, ease: "easeOut" }}
                  className="flex-1 min-w-0 relative z-10"
                >
                  <p className="text-[10px] uppercase font-black tracking-widest text-amber-100 animate-pulse">Achievement Unlocked! 🎖️</p>
                  <p className="text-sm font-black text-white truncate">{badgeToast.badge_name}</p>
                  <p className="text-xs text-amber-50/95 font-medium">You earned a new academic badge!</p>
                </motion.div>

                {/* Animated XP Pill */}
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 280, damping: 12, delay: 0.35 }}
                  className="text-right shrink-0 relative z-10"
                >
                  <span className="bg-white text-amber-600 px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                    ✨ +50 XP
                  </span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        {/* Dynamic Nav View Render */}
        <main className="flex-1 w-full overflow-hidden flex flex-col relative" id="main_pane">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="flex-1 w-full flex flex-col overflow-hidden"
              id={`tab_${activeTab}`}
            >
              
              {/* HOME SCREEN */}
              {activeTab === 'home' && (
                <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
                  
                  {/* Dashboard Welcome Header */}
                  <header className="flex flex-col space-y-3.5 bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-slate-50/10 p-5 rounded-3xl border border-indigo-100/45 shadow-sm" id="welcome_header">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-black text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            {getTimeGreeting(appLanguage).label}
                          </span>
                          <span className="text-sm select-none">{getTimeGreeting(appLanguage).icon}</span>
                        </div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1.5 flex items-center leading-tight" id="user_id_display">
                          Hello, {user?.name}! <span className="text-indigo-500 ml-1">🚀</span>
                        </h1>
                        <p className="text-xs text-slate-500 font-bold mt-2 flex flex-wrap items-center gap-1.5" id="student_meta_badge">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-white border border-slate-100 text-slate-705 shadow-2xs font-mono text-[9px]">
                            🏫 {user?.school || "School Not Set"}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-indigo-600 text-white font-mono text-[9px] font-black">
                            📚 {translate('class_num', appLanguage, 'Class')} {user?.className || "Set class"}
                          </span>
                        </p>
                      </div>
                      <div className="flex flex-col items-center shrink-0 space-y-1.5">
                        <div className="w-13 h-13 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center border-2 border-white shadow-md relative group select-none">
                          {user?.avatar ? (
                            <span className="text-3xl">{user?.avatar}</span>
                          ) : (
                            <span className="text-xs font-black text-white tracking-wider">
                              {(user?.name || 'ST').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                          )}
                          <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-[10px] font-black text-amber-950 border border-white shadow-sm">
                            ⭐
                          </span>
                        </div>
                        <button 
                          onClick={() => setShowProfileModal(true)}
                          className="text-[9px] text-slate-400 hover:text-indigo-600 font-extrabold hover:underline select-none transition"
                          id="btn_switch_profile"
                        >
                          Switch Profile / Login 🌐
                        </button>
                        {deferredPrompt && (
                          <button
                            type="button"
                            onClick={handleInstall}
                            className="text-[9px] text-indigo-600 font-extrabold hover:underline select-none transition ml-2"
                          >
                             Install App
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1.5 pt-3 border-t border-indigo-100/30">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md flex items-center space-x-1">
                          <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400 animate-spin" />
                          <span>LEVEL {user?.level || 1}</span>
                        </span>
                        <div className="flex items-center space-x-1">
                          <span className="text-slate-500 font-black">{(user?.points || 0) % 100}/100 XP</span>
                          <button
                            onClick={() => setShowXpGuide(!showXpGuide)}
                            className="text-[9px] text-indigo-500 hover:text-indigo-700 font-extrabold flex items-center space-x-0.5 select-none transition border border-indigo-100 px-1 rounded hover:bg-indigo-50"
                          >
                            <span>ℹ️</span>
                            <span>{showXpGuide ? 'Hide Guide' : 'Earn XP'}</span>
                          </button>
                        </div>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 p-0.5">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full transition-all duration-500 relative animate-pulse" 
                          style={{ width: `${(user?.points || 0) % 100}%` }} 
                        />
                      </div>

                      {/* XP Guide Panel */}
                      {showXpGuide && (
                        <div className="bg-slate-50/70 border border-slate-100 p-2.5 rounded-2xl space-y-1.5 text-[9px] text-slate-600 animate-fadeIn mt-1">
                          <p className="font-extrabold text-indigo-900 uppercase tracking-wide border-b border-slate-100 pb-1">📚 Point System & XP Breakdown</p>
                          <div className="grid grid-cols-2 gap-1.5 font-bold">
                            <div className="flex items-center space-x-1">
                              <span>📝</span>
                              <span>Create Notes: <strong className="text-emerald-600">+15 XP</strong></span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span>✅</span>
                              <span>Complete Tasks: <strong className="text-emerald-600">+10 XP</strong></span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span>🎓</span>
                              <span>Study Timer: <strong className="text-emerald-600">+2 XP / min</strong></span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span>🏆</span>
                              <span>Quizzes: <strong className="text-emerald-600">+10 XP / correct</strong></span>
                            </div>
                            <div className="flex items-center space-x-1 col-span-2 border-t border-dashed border-slate-200/60 pt-1">
                              <span>👋</span>
                              <span>Interact & Wave to Peers: <strong className="text-indigo-600">+5 XP</strong></span>
                            </div>
                          </div>
                          <p className="text-[8px] text-slate-400 italic">Level up every 100 XP to feed and unlock accessories for your pet Panda! 🐼</p>
                        </div>
                      )}
                    </div>
                  </header>

                  {/* 5-DAY STUDY STREAK CALENDAR CARD */}
                  <section className="bg-white p-5 rounded-3xl border border-slate-150/70 shadow-xs space-y-4" id="study_streak_calendar_card">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-base">📅</span>
                        <div>
                          <h2 className="text-xs font-extrabold text-slate-800 tracking-tight flex items-center uppercase font-sans">
                            {appLanguage === 'Hindi' ? '५-दिवसीय अध्ययन स्ट्रीक' : '5-Day Study Streak'}
                          </h2>
                          <p className="text-[9px] text-slate-400 font-bold leading-none mt-0.5">
                            {appLanguage === 'Hindi' ? 'दैनिक लक्ष्य पूरा करें और स्ट्रीक बनाए रखें' : 'Complete goals to keep your momentum high'}
                          </p>
                        </div>
                      </div>
                      <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-xl text-[10px] font-black border border-emerald-100 flex items-center space-x-1 animate-pulse">
                        <span>🔥</span>
                        <span>
                          {appLanguage === 'Hindi' ? `स्ट्रीक: ${streakDays.filter(d => d.completed).length} दिन` : `Streak: ${streakDays.filter(d => d.completed).length}/5 Days`}
                        </span>
                      </span>
                    </div>

                    {/* Horizontal 5-Day Strip */}
                    <div className="grid grid-cols-5 gap-2">
                      {streakDays.map((day) => {
                        const isSelected = selectedDayId === day.id;
                        return (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => setSelectedDayId(day.id)}
                            className={`flex flex-col items-center p-2.5 rounded-2xl border transition-all duration-300 relative cursor-pointer outline-none ${
                              day.completed
                                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 hover:bg-emerald-100/70'
                                : isSelected
                                ? 'bg-indigo-50/60 border-indigo-300 text-indigo-900 shadow-xs ring-2 ring-indigo-500/10'
                                : 'bg-slate-50/50 border-slate-100/70 text-slate-600 hover:bg-slate-100/50'
                            }`}
                          >
                            {/* Day Title */}
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                              {appLanguage === 'Hindi' ? day.nameHi : day.name}
                            </span>
                            
                            {/* Weekday Label */}
                            <span className="text-[11px] font-black mt-0.5">
                              {appLanguage === 'Hindi' ? day.labelHi : day.label}
                            </span>

                            {/* Status Indicator */}
                            <div className="mt-2 flex items-center justify-center">
                              {day.completed ? (
                                <span className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs">
                                  ✓
                                </span>
                              ) : (
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border ${
                                  isSelected ? 'border-indigo-400 bg-white text-indigo-600 animate-pulse' : 'border-slate-200 bg-slate-100/80 text-slate-400'
                                }`}>
                                  🎯
                                </span>
                              )}
                            </div>

                            {/* Active Selector Indicator dot */}
                            {isSelected && (
                              <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Day Goal Detail Panel */}
                    {(() => {
                      const activeDay = streakDays.find(d => d.id === selectedDayId);
                      if (!activeDay) return null;
                      const isAllCompleted = streakDays.every(d => d.completed);

                      if (isAllCompleted) {
                        return (
                          <div className="bg-gradient-to-r from-amber-500/10 to-violet-500/10 border border-amber-200 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 animate-bounce">
                            <span className="text-2xl">🏆</span>
                            <div>
                              <h3 className="text-xs font-black text-amber-800">
                                {appLanguage === 'Hindi' ? 'सभी ५ लक्ष्य पूरे हुए!' : 'All 5 Days Completed!'}
                              </h3>
                              <p className="text-[9px] text-slate-500 font-bold">
                                {appLanguage === 'Hindi' ? 'सुपर स्ट्रीक बोनस का दावा करें' : 'Claim your super streak bonus reward now!'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={claimStreakReward}
                              className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-[10px] font-black shadow-md border border-amber-400 transform active:scale-95 transition cursor-pointer"
                            >
                              {appLanguage === 'Hindi' ? 'बोनस XP का दावा करें (+50 XP) 🎁' : 'Claim +50 XP Reward 🎁'}
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex flex-col space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                {appLanguage === 'Hindi' ? `${activeDay.nameHi} लक्ष्य` : `${activeDay.name} Goal`}
                              </span>
                              <h4 className="text-[11px] font-extrabold text-slate-800 mt-1 leading-tight font-sans">
                                {appLanguage === 'Hindi' ? activeDay.goalHi : activeDay.goal}
                              </h4>
                            </div>
                            <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">
                              +{activeDay.xpAwarded} XP
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                            <span className="text-[9px] text-slate-400 font-semibold">
                              {activeDay.completed 
                                ? (appLanguage === 'Hindi' ? '✓ लक्ष्य पूरा हो गया है!' : '✓ Goal Completed!')
                                : (appLanguage === 'Hindi' ? 'लक्ष्य पूरा करके XP जीतें' : 'Do the activity or check in manually')}
                            </span>
                            
                            {!activeDay.completed ? (
                              <button
                                type="button"
                                onClick={() => completeStreakDay(activeDay.id)}
                                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black shadow-2xs transform active:scale-95 transition cursor-pointer"
                              >
                                {appLanguage === 'Hindi' ? 'पूरा हुआ चिह्नित करें ✓' : 'Mark Completed ✓'}
                              </button>
                            ) : (
                              <span className="text-[10px] font-extrabold text-emerald-600 flex items-center space-x-1">
                                <span>🎉</span>
                                <span>{appLanguage === 'Hindi' ? 'कमाल कर दिया!' : 'Completed!'}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </section>

                  {/* DAILY CHALLENGES & STREAK CARD */}
                  <section className="bg-white p-5 rounded-3xl border border-slate-150/70 shadow-xs space-y-4" id="daily_quests_card">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-base">🔥</span>
                        <div>
                          <h2 className="text-xs font-extrabold text-slate-800 tracking-tight flex items-center uppercase">
                            {appLanguage === 'Hindi' ? 'दैनिक लक्ष्य' : 'Daily Study Quests'}
                          </h2>
                          <p className="text-[9px] text-slate-400 font-bold leading-none mt-0.5">Finish missions, gain bonus XP</p>
                        </div>
                      </div>
                      <span className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-xl text-[10px] font-black border border-amber-100 flex items-center space-x-1">
                        <span>🔥</span>
                        <span>Streak: 5 Days</span>
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {quests.map(q => (
                        <div 
                          key={q.id} 
                          className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 ${
                            q.completed 
                              ? 'bg-emerald-50/50 border-emerald-100 opacity-80' 
                              : 'bg-slate-50/50 border-slate-100/70 hover:bg-slate-100/40'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-black shadow-2xs ${
                              q.completed ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {q.completed ? '✓' : '•'}
                            </span>
                            <span className={`text-[11px] font-black leading-tight ${q.completed ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                              {appLanguage === 'Hindi' ? q.textHi : q.text}
                            </span>
                          </div>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                            q.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-50 text-indigo-650'
                          }`}>
                            +{q.xp} XP
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <ProgressChart progress={progress} isTagMode={isTagMode} />

                  <HomeworkSolver user={user} language={appLanguage} isTagMode={isTagMode} />

                  {/* VIRTUAL STUDY COMPANION - CHIMPU'S ISLAND */}
                  <section className="bg-gradient-to-br from-emerald-500/10 via-emerald-50/5 to-white p-5 rounded-3xl border border-emerald-100/60 shadow-sm space-y-4" id="study_pet_sanctuary">
                    <div className="flex justify-between items-center text-xs">
                      <h2 className="font-extrabold text-slate-800 tracking-tight uppercase flex items-center text-slate-500">
                        🏝️ {appLanguage === 'Hindi' ? 'पालतू साथी' : "Chimpu's Sanctuary"}
                      </h2>
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Virtual Friend</span>
                    </div>

                    <div className="bg-gradient-to-br from-teal-400/15 via-emerald-100/30 to-blue-50/40 p-4 rounded-2xl border border-emerald-100/60 shadow-2xs relative overflow-hidden flex flex-col items-center justify-center space-y-3 min-h-36">
                      
                      {/* Pet Overlay Hat/Sunglasses Styling */}
                      <div className="relative flex items-center justify-center select-none cursor-pointer group py-2" onClick={handlePetCompanionClick}>
                        {/* accessory badge rendering */}
                        {pet.accessory === 'wizard_hat' && (
                          <span className="absolute -top-3 text-2xl drop-shadow-md transform rotate-12 transition group-hover:scale-110 animate-bounce">🎩</span>
                        )}
                        {pet.accessory === 'royal_crown' && (
                          <span className="absolute -top-4 text-2xl drop-shadow-md transform -rotate-6 transition group-hover:scale-110 animate-pulse">👑</span>
                        )}
                        {pet.accessory === 'backpack' && (
                          <span className="absolute -bottom-1 -left-2 text-xl drop-shadow-xs transition group-hover:-translate-x-1">🎒</span>
                        )}
                        
                        {/* The Cute Panda companion itself */}
                        <motion.div 
                          animate={{ 
                            scale: [1, 1.05, 1],
                            y: [0, -4, 0]
                          }}
                          transition={{ 
                            repeat: Infinity, 
                            duration: 2.2, 
                            ease: "easeInOut" 
                          }}
                          className="text-5xl transition-transform active:scale-95 duration-100 filter drop-shadow-xs relative"
                        >
                          🐼
                          
                          {pet.accessory === 'star_sunglasses' && (
                            <span className="absolute inset-0 top-1 text-2xl flex items-center justify-center leading-none transform translate-y-0.5">🕶️</span>
                          )}
                        </motion.div>
                        
                        {/* Sparkles element */}
                        <span className="absolute -top-1 -right-3 text-lg animate-pulse">✨</span>
                      </div>

                      {/* Pet State text balloon */}
                      <div className="bg-white px-3.5 py-1.5 rounded-2xl border border-emerald-100 shadow-2xs text-[11px] font-black text-slate-705 max-w-[220px] text-center leading-snug">
                        {pet.fullness < 40 ? (
                          <span>🎋 {appLanguage === 'Hindi' ? 'मुझे भूख लगी है! कृपया बैम्बू खिलाएं' : "I am starving, feed me tasty Bamboo!"}</span>
                        ) : pet.happiness < 50 ? (
                          <span>🥺 {appLanguage === 'Hindi' ? 'मुझे सहलाएं! खेलने का मन है' : "I feel lonely, tap me to play games!"}</span>
                        ) : (
                          <span>🥰 {appLanguage === 'Hindi' ? `चलो मिलकर पढ़ाई करें, ${user?.name}!` : `Let's study together, ${user?.name}!`}</span>
                        )}
                      </div>

                      {/* Health Stat Indicators */}
                      <div className="w-full grid grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[8px] font-bold text-teal-700">
                            <span>❤️ {appLanguage === 'Hindi' ? 'खुशी' : 'Happiness'}</span>
                            <span>{pet.happiness}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-teal-100/40 rounded-full overflow-hidden p-0.5 border border-teal-200/20">
                            <div className="h-full bg-teal-500 rounded-full transition-all duration-300" style={{ width: `${pet.happiness}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[8px] font-bold text-amber-700">
                            <span>🎋 {appLanguage === 'Hindi' ? 'एनर्जी' : 'Energy'}</span>
                            <span>{pet.fullness}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-amber-150/40 rounded-full overflow-hidden p-0.5 border border-amber-200/20">
                            <div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${pet.fullness}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Feed & Dress Up Shops */}
                    <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100/80">
                      <div className="flex justify-between items-center">
                        <button
                          onClick={handlePetFeed}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[10px] font-black rounded-xl border border-emerald-500 shadow-2xs cursor-pointer flex items-center space-x-1.5"
                        >
                          <span>🎋</span>
                          <span>{appLanguage === 'Hindi' ? 'बैम्बू खिलाएं (-15 XP)' : 'Feed Bamboo (-15 XP)'}</span>
                        </button>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{appLanguage === 'Hindi' ? 'ड्रेसिंग रूम' : 'Dressing Area'}</span>
                      </div>

                      <div className="flex justify-between gap-1.5 overflow-x-auto py-1 scrollbar-hide">
                        {[
                          { id: 'wizard_hat', char: '🎩', label: 'Wizard Hat', cost: 100 },
                          { id: 'star_sunglasses', char: '🕶️', label: 'Shades', cost: 120 },
                          { id: 'royal_crown', char: '👑', label: 'Crown', cost: 180 },
                          { id: 'backpack', char: '🎒', label: 'Backpack', cost: 80 }
                        ].map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleBuyAccessory(item)}
                            className={`px-2.5 py-1.5 rounded-xl border flex flex-col items-center justify-center shrink-0 min-w-[70px] cursor-pointer transition ${
                              pet.accessory === item.id
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-black'
                                : 'bg-white hover:bg-slate-100 border-slate-100 hover:border-slate-200 text-slate-800'
                            }`}
                            title={`Buy ${item.label} for ${item.cost} XP`}
                          >
                            <span className="text-lg">{item.char}</span>
                            <span className="text-[8px] font-black mt-0.5">{item.cost} XP</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* Active Buddies Online Row (Bring People Up!) */}
                  <section className="space-y-3" id="social_feed">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-extrabold text-slate-800 tracking-tight flex items-center uppercase text-slate-500">
                        <Users className="w-4 h-4 text-indigo-500 mr-1.5" />
                        {translate('buddies_title', appLanguage, 'Online Study Buddies')} 👥
                      </h2>
                      <span className="text-[9px] font-black text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded-full uppercase tracking-wider">Social Feed</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                      {PEER_PRESENCE.map(peer => (
                        <div key={peer.id} className="bg-white p-3 rounded-2xl border border-slate-100/80 flex justify-between items-center shadow-xs hover:border-slate-250 transition duration-150">
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className="relative">
                              <div className="w-10 h-10 bg-gradient-to-br from-slate-50 to-indigo-50/50 rounded-2xl flex items-center justify-center font-black border border-indigo-100/50 shadow-2xs select-none">
                                <span className="text-2xl">{peer.avatar || '👤'}</span>
                              </div>
                              <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5 items-center justify-center">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${peer.online ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${peer.online ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-xs font-black text-slate-900 leading-none mb-1">{peer.name}</h3>
                              <p className="text-[10px] text-slate-400 font-bold truncate">Study Focus: <span className="text-indigo-600 font-black">{peer.subject}</span></p>
                            </div>
                          </div>
                          {peer.online ? (
                            <button 
                              onClick={() => handleWaveToPeer(peer)}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 active:scale-95 transition-all text-indigo-600 font-black rounded-xl text-[10px] flex items-center space-x-1 border border-indigo-100 shadow-2xs cursor-pointer"
                              id={`wave_btn_${peer.id}`}
                            >
                              <span className="animate-bounce">👋</span>
                              <span>Wave back</span>
                            </button>
                          ) : (
                            <span className="text-[9px] bg-slate-100 text-slate-400 font-bold px-2 py-1 rounded-lg">Offline</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* High Quality Bento Grid Panel */}
                  <section className="space-y-3" id="quick_bento_panels">
                    <h2 className="text-xs font-extrabold text-slate-500 tracking-tight uppercase flex items-center">
                      <Sparkles className="w-4 h-4 text-indigo-500 mr-1.5" />
                      {translate('playground_title', appLanguage, 'Academy Playground')} 🚀
                    </h2>
                    <div className="grid grid-cols-2 gap-3 pb-1">
                      
                      {/* AI Tutor */}
                      <button 
                        onClick={() => setActiveTab('chat')}
                        className="p-4 bg-gradient-to-b from-indigo-600 to-indigo-700 text-white rounded-3xl text-left shadow-lg shadow-indigo-100/50 hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all active:scale-95 flex flex-col justify-between h-32 relative overflow-hidden group"
                      >
                        <div className="absolute top-2 right-2 bg-indigo-500/50 text-[8px] font-black uppercase text-white px-2 py-0.5 rounded-full tracking-wider">
                          {translate('live_assistant', appLanguage, 'Live Assistant')}
                        </div>
                        <BrainCircuit className="w-7 h-7 stroke-[2.5] text-indigo-200 group-hover:scale-110 transition-transform" />
                        <div>
                          <h3 className="font-extrabold text-xs">{translate('ai_tutor', appLanguage, 'AI Tutor')} ⚡</h3>
                          <p className="text-[9px] text-indigo-100/90 font-bold mt-1 leading-snug">{translate('tutor_desc', appLanguage, 'Answers homework & designs custom drawings')}</p>
                        </div>
                      </button>

                      {/* Practice Quiz */}
                      <button 
                        onClick={() => setActiveTab('quiz')}
                        className="p-4 bg-gradient-to-b from-emerald-500 to-emerald-600 text-white rounded-3xl text-left shadow-lg shadow-emerald-100/50 hover:shadow-emerald-200 hover:-translate-y-0.5 transition-all active:scale-95 flex flex-col justify-between h-32 relative overflow-hidden group"
                      >
                        <div className="absolute top-2 right-2 bg-emerald-400/50 text-[8px] font-black uppercase text-white px-2 py-0.5 rounded-full tracking-wider">
                          {translate('quiz', appLanguage, 'Quiz')}
                        </div>
                        <GraduationCap className="w-7 h-7 stroke-[2.5] text-emerald-100 group-hover:scale-110 transition-transform" />
                        <div>
                          <h3 className="font-extrabold text-xs">{translate('quiz', appLanguage, 'Quiz')} 🏆</h3>
                          <p className="text-[9px] text-emerald-50/90 font-bold mt-1 leading-snug">{translate('practice_desc', appLanguage, 'Test subject skills, earn dynamic XP medals')}</p>
                        </div>
                      </button>

                      {/* Study Notes */}
                      <button 
                        onClick={() => setActiveTab('notebook')}
                        className="p-4 bg-gradient-to-b from-amber-500 to-amber-600 text-white rounded-3xl text-left shadow-lg shadow-amber-100/55 hover:shadow-amber-200 hover:-translate-y-0.5 transition-all active:scale-95 flex flex-col justify-between h-28 relative overflow-hidden group"
                      >
                        <div className="absolute top-2 right-2 bg-amber-400/50 text-[8px] font-black uppercase text-white px-2 py-0.5 rounded-full tracking-wider">
                          {notes.length} {translate('notebook', appLanguage, 'Notebook').toLowerCase()}
                        </div>
                        <BookOpen className="w-6 h-6 stroke-[2.5] text-amber-100 group-hover:scale-110 transition-transform" />
                        <div>
                          <h3 className="font-extrabold text-xs">{translate('notebook', appLanguage, 'Notebook')} 📝</h3>
                          <p className="text-[9px] text-amber-50/90 font-bold mt-0.5 leading-none">{translate('notebook_desc', appLanguage, 'Formula sheets & key facts')}</p>
                        </div>
                      </button>

                      {/* Dailies & Planner */}
                      <button 
                        onClick={() => { setActiveTab('notebook'); setNotebookTab('planner'); }}
                        className="p-4 bg-gradient-to-b from-purple-500 to-purple-600 text-white rounded-3xl text-left shadow-lg shadow-purple-100/55 hover:shadow-purple-200 hover:-translate-y-0.5 transition-all active:scale-95 flex flex-col justify-between h-28 relative overflow-hidden group"
                      >
                        <div className="absolute top-2 right-2 bg-purple-400/50 text-[8px] font-black uppercase text-white px-2 py-0.5 rounded-full tracking-wider">
                          {schedule.filter(s => !s.completed).length} pending
                        </div>
                        <Calendar className="w-6 h-6 stroke-[2.5] text-purple-100 group-hover:scale-110 transition-transform" />
                        <div>
                          <h3 className="font-extrabold text-xs">{translate('dailies_planner', appLanguage, 'Planner')} 📅</h3>
                          <p className="text-[9px] text-purple-50/90 font-bold mt-0.5 leading-none">{translate('planner_desc', appLanguage, 'Class timings & assignments')}</p>
                        </div>
                      </button>
                      
                      {/* Advanced AI Study Toolkit Banner */}
                      <button 
                        onClick={() => setIsToolkitOpen(true)}
                        className="col-span-2 p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl text-left shadow-lg border border-indigo-500/20 hover:shadow-indigo-500/10 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-between overflow-hidden relative group cursor-pointer"
                        id="btn_advanced_toolkit"
                      >
                        <div className="absolute top-0 right-0 bg-indigo-600 text-[8px] font-black uppercase text-white px-3 py-1 rounded-bl-2xl tracking-wider">
                          19+ Advanced Tools
                        </div>
                        <div className="flex items-center gap-3.5 z-10">
                          <div className="p-3 bg-indigo-600/30 rounded-2xl border border-indigo-400/20 group-hover:scale-110 transition-transform">
                            <Sparkles className="w-6 h-6 stroke-[2.5] text-indigo-300" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-xs flex items-center gap-1.5 text-indigo-100">
                              Advanced Study Toolkit ⚡
                            </h3>
                            <p className="text-[9px] text-slate-300 font-bold mt-1 max-w-md leading-normal">
                              Open Scientific Calculator, AI Mind Maps, Mock Tests, Ambient Sounds, OCR homework helper, document readers & file backups.
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-indigo-300 shrink-0 group-hover:translate-x-1 transition-transform" />
                      </button>

                    </div>
                  </section>
                  
                  <StudyTimer isTagMode={isTagMode} onSessionComplete={handleStudySessionComplete} />

                  {/* Badges and Progress Statistics from Profile */}
                  <section className="bg-white p-4.5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                      <h2 className="text-xs font-extrabold text-slate-800 tracking-tight flex items-center uppercase text-slate-500">
                        <Award className="w-4 h-4 text-emerald-500 mr-2 animate-bounce" />
                        {translate('badges_title', appLanguage, 'Academic Badges')} 🎖️
                      </h2>
                      <span className="text-[9px] font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg font-black uppercase tracking-wider">
                        {(user?.badges || []).length} EARNED
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 pb-0.5">
                      {(user?.badges || []).map((b) => {
                        // Dynamic design palette based on badge title
                        let badgeColors = "from-amber-100 via-yellow-50 to-orange-50 text-amber-600 border-amber-200";
                        if (b.badge_name === 'Note Taker') {
                          badgeColors = "from-pink-100 via-rose-50 to-red-50 text-pink-600 border-pink-200";
                        } else if (b.badge_name === 'Quiz Master') {
                          badgeColors = "from-purple-100 via-indigo-50 to-violet-50 text-purple-600 border-purple-200";
                        } else if (b.badge_name === 'Math Whiz' || b.badge_name === 'Master Mathematician') {
                          badgeColors = "from-blue-100 via-cyan-50 to-teal-50 text-blue-600 border-blue-200";
                        } else if (b.badge_name === 'Science Master' || b.badge_name === 'Science Whiz') {
                          badgeColors = "from-emerald-100 via-teal-50 to-green-50 text-emerald-600 border-emerald-200";
                        } else if (b.badge_name === 'Study Scholar') {
                          badgeColors = "from-indigo-100 via-sky-50 to-violet-50 text-indigo-600 border-indigo-200";
                        } else if (b.badge_name === 'Topic Master') {
                          badgeColors = "from-amber-100 via-yellow-100 to-orange-100 text-amber-700 border-amber-300";
                        } else if (b.badge_name === 'Task Master') {
                          badgeColors = "from-teal-100 via-emerald-50 to-green-50 text-teal-600 border-teal-200";
                        }
                        return (
                          <div key={b.id} className="flex flex-col items-center text-center group cursor-pointer">
                            <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${badgeColors} border flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all duration-350 relative`}>
                              <span>{b.icon}</span>
                              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white text-[7px] border border-slate-100 rounded-full flex items-center justify-center font-bold">✨</span>
                            </div>
                            <span className="text-[9px] text-slate-800 font-extrabold mt-2 leading-none line-clamp-1">{b.badge_name}</span>
                            <span className="text-[7px] text-slate-400 font-semibold mt-0.5 leading-none">{b.date_earned}</span>
                          </div>
                        );
                      })}
                      <div className="flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 h-16 cursor-not-allowed">
                        <span className="text-[10px] font-black leading-none">+ more</span>
                        <span className="text-[7px] font-bold text-slate-400 mt-1 uppercase text-center leading-none">study on</span>
                      </div>
                    </div>
                  </section>

                  {/* Leaderboard - Friendly Competition */}
                  <section className="bg-white p-4.5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                      <h2 className="text-xs font-extrabold text-slate-800 tracking-tight flex items-center uppercase text-slate-500">
                        <Trophy className="w-4 h-4 text-amber-500 mr-2 animate-bounce" />
                        {translate('leaderboard_title', appLanguage, 'Study Leaderboard')} 🏆
                      </h2>
                      <span className="text-[9px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg font-black uppercase tracking-wider">
                        Class Rank #{getLeaderboardList().findIndex(c => c.name.includes('(You)')) !== -1 ? getLeaderboardList().findIndex(c => c.name.includes('(You)')) + 1 : '-'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {getLeaderboardList().length === 0 ? (
                        <div className="text-center py-6 space-y-2">
                          <span className="text-2xl">🏆</span>
                          <p className="text-xs font-bold text-slate-500">No students on the leaderboard yet</p>
                          <p className="text-[10px] text-slate-400 max-w-[240px] mx-auto">Complete subject quizzes and practice sessions to earn XP and claim the #1 spot!</p>
                        </div>
                      ) : (
                        getLeaderboardList().map((player, idx) => {
                          const isSelf = player.name.includes('(You)');
                          const rankMedals = ['🥇', '🥈', '🥉'];
                          return (
                            <div 
                              key={idx} 
                              className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all duration-200 ${
                                isSelf 
                                  ? 'bg-indigo-50/75 border-indigo-200 shadow-2xs scale-[1.01]' 
                                  : 'bg-slate-50/50 border-slate-100'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <span className="w-6 text-center text-xs font-black text-slate-400">
                                  {idx < 3 ? rankMedals[idx] : `${idx + 1}`}
                                </span>
                                <div>
                                  <p className={`text-xs font-black ${isSelf ? 'text-indigo-900' : 'text-slate-800'}`}>
                                    {player.name}
                                  </p>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase">
                                    Level {player.level} • Rank Classmate
                                  </p>
                                </div>
                              </div>
                              <span className={`text-[11px] font-mono font-black ${isSelf ? 'text-indigo-600' : 'text-slate-650'}`}>
                                {player.points} XP
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </section>

                  {/* About Ascend Study & Creator (Rohit Yadav & Core AI) Card */}
                  <section className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-5 rounded-3xl border border-indigo-950/50 shadow-md space-y-4" id="about_app_creator_card">
                    <div className="flex items-center space-x-2 pb-2.5 border-b border-indigo-900/40">
                      <span className="text-base select-none">🚀</span>
                      <div>
                        <h2 className="text-xs font-black tracking-wider uppercase text-indigo-200 font-sans">
                          {appLanguage === 'Hindi' ? 'Ascend Study के बारे में' : 'About Ascend Study'}
                        </h2>
                        <p className="text-[9px] font-bold text-slate-400">
                          {appLanguage === 'Hindi' ? 'आधिकारिक निर्माता और प्लेटफॉर्म विवरण' : 'Official Creator & Platform Details'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                        {appLanguage === 'Hindi' 
                          ? 'Ascend Study एक ऑल-इन-वन शैक्षिक मंच है जिसे इंटरैक्टिव नोट्स, दैनिक अध्ययन कार्यक्रम, अध्ययन प्रगति विश्लेषण, सहयोगी अध्ययन समूहों और एक उन्नत एआई स्टडी बडी के माध्यम से सीखने को बेहतर बनाने के लिए डिज़ाइन किया गया है।'
                          : 'Ascend Study is an all-in-one educational platform designed to elevate learning through interactive notes, daily study schedules, study progress analytics, collaborative study groups, and an advanced AI Study Buddy.'
                        }
                      </p>

                      <div className="bg-indigo-900/30 border border-indigo-500/10 p-3.5 rounded-2xl space-y-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-xl shadow-xs select-none">
                            👨‍💻
                          </div>
                          <div>
                            <h3 className="text-xs font-black text-white">Rohit Yadav</h3>
                            <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">
                              {appLanguage === 'Hindi' ? 'लीड डेवलपर और निर्माता' : 'Lead Developer & Creator'}
                            </p>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal font-medium">
                          {appLanguage === 'Hindi'
                            ? 'इस अत्याधुनिक शैक्षिक एप्लिकेशन को पूरी तरह से रोहित यादव (एक प्रतिभाशाली 14 वर्षीय छात्र और कोडर) द्वारा उनके संगठन Core AI की टीम के साथ मिलकर डिज़ाइन और विकसित किया गया था।'
                            : 'This state-of-the-art educational application was designed and engineered entirely by Rohit Yadav, a brilliant 14-year-old student and coder, alongside his team at Core AI.'
                          }
                        </p>
                      </div>

                      <div className="flex justify-between items-center text-[10px] pt-1.5 text-slate-400 font-bold border-t border-indigo-900/30">
                        <span className="text-[9px] text-indigo-300 tracking-wider font-mono">
                          {appLanguage === 'Hindi' ? 'Core AI द्वारा निर्मित' : 'Created by Core AI'}
                        </span>
                        <a 
                          href="https://www.instagram.com/rohit.Yadav.1.4" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl transition shadow-xs text-[9px] flex items-center space-x-1"
                        >
                          <span>📸</span>
                          <span>@rohit.Yadav.1.4</span>
                        </a>
                      </div>
                    </div>
                  </section>

                  {/* Subject Mastery Performance */}
                  <section className="space-y-3 pb-8">
                    <h2 className="text-xs font-extrabold text-slate-500 tracking-tight uppercase flex items-center">
                      <GraduationCap className="w-4 h-4 text-violet-500 mr-1.5" />
                      {translate('progress_title', appLanguage, 'Learning Progress')} 📊
                    </h2>
                    <div className="grid grid-cols-1 gap-2.5">
                      {progress.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold self-center text-xs">
                              {item.subject.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-800">{item.subject}</p>
                              <p className="text-[10px] text-slate-400 font-semibold">Verified: {new Date(item.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100">
                              {item.score}/{item.total} Score
                            </span>
                          </div>
                        </div>
                      ))}
                      {progress.length === 0 && (
                        <p className="text-center text-xs text-slate-400 py-4 italic">No quizzes taken yet. Complete a quiz to see metrics here!</p>
                      )}
                    </div>
                  </section>
                </div>
              )}

              {/* AI CHAT SCREEN (STUCK VIEWPORT CONSTRAINED) */}
              {activeTab === 'chat' && (
                <div className="flex-1 flex flex-col overflow-hidden h-full">
                  
                  {/* Chat header */}
                  <header className="p-4 border-b border-slate-100 shrink-0 flex items-center bg-white justify-between">
                    <div className="flex items-center space-x-2">
                      <BrainCircuit className="w-5 h-5 text-indigo-600" />
                      <div>
                        <h2 className="font-bold text-slate-800 text-sm">AI Study Helper</h2>
                        {quotaExceeded ? (
                          <span className="text-[10px] text-amber-500 font-semibold flex items-center">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1 animate-ping" /> Offline Fallback Active (Quota Exceeded)
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-500 font-semibold animate-pulse flex items-center">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1" /> Gemini 3.5 Flash Connected
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button 
                        onClick={() => setShowScratchpad(!showScratchpad)}
                        className={`text-[10px] font-black px-2.5 py-1.5 rounded-xl border flex items-center space-x-1 cursor-pointer transition shadow-2xs ${
                          showScratchpad 
                            ? 'bg-amber-100 border-amber-300 text-amber-800 font-black' 
                            : 'bg-amber-50/50 border-amber-150 text-amber-700 hover:bg-amber-50'
                        }`}
                      >
                        <span>🎨</span>
                        <span>{appLanguage === 'Hindi' ? 'रफ कॉपी' : 'Scratchpad'}</span>
                      </button>
                      <button onClick={() => setChatMessages([])} className="text-slate-400 hover:text-red-500 text-[10px] font-bold px-2 py-1.5 bg-slate-50 border border-slate-100 rounded-xl">Clear Chats</button>
                    </div>
                  </header>

                  {/* Doodle board container */}
                  {showScratchpad && (
                    <div className="bg-amber-50/70 border-b border-amber-150 p-3.5 space-y-2 select-none" id="doodle_scratchpad">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs">🎨</span>
                          <h3 className="text-[11px] font-black text-amber-900 tracking-tight">Interactive Doodle Board / रफ़ कॉपी</h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          {/* Brush colors selector */}
                          {['#1e293b', '#dc2626', '#16a34a', '#2563eb'].map(c => (
                            <button
                              key={c}
                              onClick={() => setBrushColor(c)}
                              className={`w-4.5 h-4.5 rounded-full border transition ${brushColor === c ? 'ring-2 ring-amber-500 scale-110' : 'opacity-70'}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                          <button
                            onClick={clearCanvas}
                            className="px-2.5 py-1 bg-white text-slate-650 hover:bg-slate-105 border border-slate-250 rounded-xl text-[10px] font-extrabold cursor-pointer transition active:scale-95"
                          >
                            Clear
                          </button>
                          <button
                            onClick={handleSendDoodleToAI}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black shadow-xs flex items-center space-x-1 cursor-pointer transition active:scale-95"
                          >
                            <span>Share with Tutor</span>
                            <span>⚡</span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="border border-amber-250 bg-white rounded-2xl overflow-hidden shadow-inner">
                        <canvas
                          ref={canvasRef}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawingTouch}
                          onTouchMove={drawTouch}
                          onTouchEnd={stopDrawing}
                          className="w-full h-32 touch-none cursor-crosshair bg-white"
                        />
                      </div>
                      <p className="text-[8px] md:text-[9px] text-amber-800 font-extrabold leading-none italic select-none">* Draw geometry shapes, write formulas, or sketch math issues, then click "Share with Tutor" to ask a question!</p>
                    </div>
                  )}

                  {/* Chat messages queue */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50" id="chat_scroll">
                    {quotaExceeded && (
                      <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/85 rounded-2xl flex items-start gap-2.5 shadow-2xs select-none">
                        <span className="text-base shrink-0">⚠️</span>
                        <div className="text-[10px] text-amber-950 leading-normal">
                          <p className="font-extrabold uppercase tracking-widest text-amber-800">Free Daily AI Quota Exceeded</p>
                          <p className="mt-0.5 text-slate-600 font-medium">This Cloud environment has reached its free limit of 20 live AI calls for today. Ascend Study has automatically switched to our high-quality **Offline Fallback System** so you can continue learning seamlessly! To enable live, unlimited AI responses, upgrade your billing plan or configure a custom Gemini API Key in the Settings {"->"} Secrets menu.</p>
                        </div>
                      </div>
                    )}
                    {chatMessages.length === 0 && (
                      <div className="text-center py-10 max-w-[240px] mx-auto">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <BrainCircuit className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm">{translate('ai_tutor', appLanguage, 'AI Tutor')}</h3>
                        <p className="text-slate-400 text-xs mt-1 leading-relaxed">{getChatIntroDesc(appLanguage)}</p>
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-1.5`} id={`chat_item_${i}`}>
                        <div 
                          onClick={() => setFullScreenMessage(msg)}
                          className={`max-w-[85%] rounded-3xl p-3.5 shadow-sm text-sm cursor-pointer hover:scale-[1.01] hover:shadow-md active:scale-98 transition duration-200 select-none ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-850 rounded-tl-none border border-slate-150/70'}`}
                        >
                          {msg.image && (
                            <img src={msg.image} alt="Uploaded problem" className="w-full rounded-2xl mb-2 max-h-40 object-cover" />
                          )}
                          <div className="leading-relaxed text-xs md:text-sm whitespace-pre-wrap select-text">
                            {renderChatMessage(msg.text)}
                          </div>
                          
                          {/* Interactive blackboard visual expand link */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100/30 flex justify-between items-center text-[10px] opacity-80" style={{ pointerEvents: 'none' }}>
                            <span className={`text-[8px] font-extrabold uppercase tracking-widest ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                              {msg.role === 'user' ? '👤 Student' : '🤖 AI Partner'}
                            </span>
                            <span className={`font-black px-2 py-0.5 rounded-lg flex items-center space-x-1 shadow-2xs ${msg.role === 'user' ? 'bg-indigo-700/80 text-indigo-100' : 'bg-indigo-50 text-indigo-650'}`}>
                              <span>{getFullscreenLabel(appLanguage)}</span>
                              <Maximize2 className="w-2.5 h-2.5 ml-0.5" />
                            </span>
                          </div>
                        </div>
                        {msg.role === 'model' && (
                          <div className="flex justify-start pl-1.5 pb-2">
                            <button
                              onClick={() => handleSpeakMessage(msg.text)}
                              className={`px-2.5 py-1 text-[9px] font-black rounded-xl border flex items-center space-x-1 cursor-pointer transition shadow-2xs ${
                                speakingText === msg.text 
                                  ? 'bg-rose-50 border-rose-250 text-rose-600 animate-pulse font-black'
                                  : 'bg-white border-slate-100 hover:border-slate-200 text-slate-500 hover:text-indigo-600'
                              }`}
                            >
                              {speakingText === msg.text ? (
                                <>
                                  <span className="text-[10px]">⏹️</span>
                                  <span>Stop Reading</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-[10px]">🔊</span>
                                  <span>{appLanguage === 'Hindi' ? 'सुनें (Read Out)' : 'Read Out'}</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="flex justify-start animate-pulse">
                        <div className="bg-white border border-slate-100 px-4 py-2.5 rounded-3xl rounded-tl-none flex items-center space-x-2 shadow-sm text-xs text-slate-500">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                          <span className="font-bold text-slate-600">{getSolvingText(appLanguage)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Absolute pinned and locked bottom entry area */}
                  <div className="p-3 border-t border-slate-100 bg-white shrink-0 space-y-2">
                    {selectedImage && (
                      <div className="relative inline-block" id="image_preview">
                        <img src={selectedImage} alt="Problem sketch" className="w-16 h-16 rounded-xl object-cover border border-indigo-500" />
                        <button onClick={() => setSelectedImage(null)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow cursor-pointer">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center px-3 py-1 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400 relative overflow-hidden">
                        {isListening && (
                          <div className="absolute inset-0 bg-red-100/90 flex items-center px-3 space-x-2 z-10 transition">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping mr-1" />
                            <span className="text-xs font-black text-red-700 animate-pulse">{getListeningLabel(appLanguage)}</span>
                          </div>
                        )}
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder={getChatPlaceholder(appLanguage)}
                          className="flex-1 p-2 bg-transparent focus:outline-none text-xs text-slate-800"
                        />
                        <button onClick={handleVoiceInput} className="text-slate-400 hover:text-red-500 p-1 cursor-pointer">
                          <Mic className="w-4 h-4" />
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="text-slate-400 hover:text-indigo-600 p-1 cursor-pointer">
                          <Camera className="w-4 h-4" />
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                      </div>
                      <button 
                        onClick={handleSendMessage}
                        disabled={isChatLoading}
                        className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl disabled:opacity-50 transition active:scale-95 cursor-pointer"
                        id="send_btn"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* GROUPS SCREEN & TEAMS */}
              {activeTab === 'groups' && (
                <div className="flex-1 flex flex-col overflow-hidden h-full">
                  {!activeGroup ? (
                    <div className="flex-1 flex flex-col overflow-hidden p-5">
                      <header className="flex justify-between items-center shrink-0 mb-4">
                        <div>
                          <h2 className="text-lg font-bold text-slate-800">Study Groups</h2>
                          <p className="text-xs text-slate-400">Join classmates & study courses together</p>
                        </div>
                        <button onClick={() => setIsAddingGroup(true)} className="p-2 bg-indigo-600 text-white rounded-full shadow-md active:scale-95 transition">
                          <Plus className="w-5 h-5" />
                        </button>
                      </header>

                      {/* Filter Controls */}
                      <div className="bg-white p-3.5 rounded-3xl border border-slate-100 shadow-xs mb-4 space-y-3 shrink-0">
                        {/* Course search */}
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                          <input 
                            type="text" 
                            placeholder="Search by specific course (e.g., AP Chemistry, Math)..." 
                            value={groupSearchCourse}
                            onChange={(e) => setGroupSearchCourse(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-150 rounded-2xl text-xs outline-none focus:border-indigo-400 font-semibold"
                          />
                        </div>

                        {/* Subject Filter Chips */}
                        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-hide">
                          {['All', 'Mathematics', 'Science', 'History', 'Literature', 'Computer Science', 'Languages'].map((sub) => (
                            <button
                              key={sub}
                              onClick={() => setGroupFilterSubject(sub)}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap border cursor-pointer transition ${
                                groupFilterSubject === sub 
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                                  : 'bg-slate-50 text-slate-600 border-slate-150 hover:bg-slate-100'
                              }`}
                            >
                              {sub}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Scrollable list of cooperative study groups */}
                      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-hide">
                        {groups.filter(g => {
                          const matchesSubject = !groupFilterSubject || groupFilterSubject === 'All' || g.subject === groupFilterSubject;
                          const matchesCourse = !groupSearchCourse || 
                            (g.course || '').toLowerCase().includes(groupSearchCourse.toLowerCase()) || 
                            g.name.toLowerCase().includes(groupSearchCourse.toLowerCase());
                          return matchesSubject && matchesCourse;
                        }).map(group => {
                          const isJoined = joinedGroupIds.includes(group.id);
                          return (
                            <div key={group.id} className="bg-white p-4.5 rounded-3xl border border-slate-150 shadow-sm flex items-stretch justify-between hover:shadow-md transition duration-200">
                              <div className="flex-1 flex flex-col justify-between min-w-0 pr-3">
                                <div>
                                  <div className="flex items-center space-x-2 flex-wrap mb-1.5">
                                    <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
                                      {group.subject}
                                    </span>
                                    {group.course && (
                                      <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                        {group.course}
                                      </span>
                                    )}
                                  </div>
                                  <h3 className="font-bold text-slate-800 text-sm leading-tight truncate">{group.name}</h3>
                                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{group.description}</p>
                                </div>
                                <div className="flex items-center space-x-1 mt-4">
                                  <Users className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="text-[10px] text-slate-500 font-bold">
                                    {group.member_count || 1} study mates
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col justify-end">
                                {isJoined ? (
                                  <button 
                                    onClick={() => setActiveGroup(group)}
                                    className="px-4.5 py-2 bg-indigo-600 text-white rounded-2xl text-xs font-black hover:bg-indigo-700 transition active:scale-95 shadow-xs"
                                  >
                                    Enter
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handleJoinGroup(group.id)}
                                    className="px-4.5 py-2 border border-indigo-600 text-indigo-600 rounded-2xl text-xs font-black hover:bg-indigo-50 transition active:scale-95"
                                  >
                                    Join Group
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {groups.filter(g => {
                          const matchesSubject = !groupFilterSubject || groupFilterSubject === 'All' || g.subject === groupFilterSubject;
                          const matchesCourse = !groupSearchCourse || 
                            (g.course || '').toLowerCase().includes(groupSearchCourse.toLowerCase()) || 
                            g.name.toLowerCase().includes(groupSearchCourse.toLowerCase());
                          return matchesSubject && matchesCourse;
                        }).length === 0 && (
                          <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 p-6">
                            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <h4 className="font-bold text-slate-700 text-xs">No matching groups yet</h4>
                            <p className="text-slate-400 text-[11px] mt-1 mb-4">Be the visionary student to create the first group for this course!</p>
                            <button onClick={() => setIsAddingGroup(true)} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-2xl shadow-sm active:scale-95 transition">
                              Create Group
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col overflow-hidden h-full">
                      
                      {/* Active group inside header */}
                      <header className="p-4 border-b border-slate-100 flex flex-col bg-white shrink-0">
                        <div className="flex items-center space-x-3 mb-3">
                          <button onClick={() => setActiveGroup(null)} className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 cursor-pointer">
                            <ArrowLeft className="w-4 h-4" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-800 text-sm leading-none truncate">{activeGroup.name}</h3>
                            <div className="flex items-center space-x-2 mt-1.5">
                              <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
                                {activeGroup.subject}
                              </span>
                              {activeGroup.course && (
                                <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                                  {activeGroup.course}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Sub-tab Selectors */}
                        <div className="flex space-x-5 border-t border-slate-50 pt-2 pb-0">
                          <button onClick={() => setGroupTab('chat')} className={`text-[11px] font-extrabold pb-2 transition border-b-2 leading-none cursor-pointer ${groupTab === 'chat' ? 'text-indigo-600 border-indigo-600 font-black' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>Chat</button>
                          <button onClick={() => setGroupTab('notes')} className={`text-[11px] font-extrabold pb-2 transition border-b-2 leading-none cursor-pointer ${groupTab === 'notes' ? 'text-indigo-600 border-indigo-600 font-black' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>Notes</button>
                          <button onClick={() => setGroupTab('questions')} className={`text-[11px] font-extrabold pb-2 transition border-b-2 leading-none cursor-pointer ${groupTab === 'questions' ? 'text-indigo-600 border-indigo-600 font-black' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>Q&A Board</button>
                          <button onClick={() => setGroupTab('sessions')} className={`text-[11px] font-extrabold pb-2 transition border-b-2 leading-none cursor-pointer ${groupTab === 'sessions' ? 'text-indigo-600 border-indigo-600 font-black' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>Sessions</button>
                        </div>
                      </header>

                      {/* Inner Group View Tabs */}
                      <div className="flex-1 overflow-y-auto p-4 bg-slate-50" id="group_tab_pane">
                        {groupTab === 'chat' && (
                          <div className="space-y-3.5">
                            {(groupMessages[activeGroup.id] || []).length === 0 ? (
                              <div className="text-center py-12">
                                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <h4 className="text-xs font-bold text-slate-700">Class chat is quiet</h4>
                                <p className="text-[10px] text-slate-400 mt-1">Start the conversation by typing a greeting!</p>
                              </div>
                            ) : (
                              (groupMessages[activeGroup.id] || []).map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.user_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                                  <div className="max-w-[85%]">
                                    <p className="text-[9px] text-slate-400 font-bold mb-1 px-1">{msg.user_name}</p>
                                    <div className={`p-3 rounded-2xl ${msg.user_id === user?.id ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none shadow-xs'}`}>
                                      <p className="text-xs leading-relaxed">{msg.text}</p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        {groupTab === 'notes' && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Class Lecture Library</h4>
                              <button onClick={() => setIsAddingGroupNote(true)} className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-bold flex items-center transition cursor-pointer">
                                <Plus className="w-3 h-3 mr-1" /> New Note
                              </button>
                            </div>
                            {(groupNotes[activeGroup.id] || []).map(note => (
                              <div key={note.id} className="bg-white p-4 rounded-3xl border border-slate-150 shadow-xs relative">
                                <h4 className="font-bold text-slate-800 text-xs mb-1">{note.title}</h4>
                                <p className="text-xs text-slate-550 whitespace-pre-wrap">{note.content}</p>
                                <div className="flex justify-between items-center border-t border-slate-100 pt-2.5 mt-3.5 text-[9px] text-slate-400">
                                  <span>Contributor: <strong className="text-slate-600">{note.updated_by_name}</strong></span>
                                  <span>{new Date(note.updated_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            ))}
                            {(groupNotes[activeGroup.id] || []).length === 0 && (
                              <div className="text-center py-12">
                                <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <h4 className="text-xs font-bold text-slate-700">No shared notes yet</h4>
                                <p className="text-[10px] text-slate-400 mt-1 mb-3">Share your study notes or summaries with your team.</p>
                                <button onClick={() => setIsAddingGroupNote(true)} className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold active:scale-95 transition">
                                  Add First Note
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {groupTab === 'questions' && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Academic Q&A Board</h4>
                              <button onClick={() => setIsAddingGroupQuestion(true)} className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-bold flex items-center transition cursor-pointer">
                                <HelpCircle className="w-3 h-3 mr-1" /> Ask Question
                              </button>
                            </div>

                            {/* List Questions */}
                            {((groupQuestions[activeGroup.id]) || []).map(q => (
                              <div key={q.id} className="bg-white p-4 rounded-3xl border border-slate-150 shadow-xs space-y-3">
                                <div>
                                  <h4 className="font-bold text-slate-850 text-xs">{q.title}</h4>
                                  {q.content && <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap">{q.content}</p>}
                                  <div className="flex justify-between items-center text-[9px] text-slate-400 mt-2 pb-2.5 border-b border-slate-50">
                                    <span>Asked by <strong className="text-indigo-600">{q.asked_by_name}</strong></span>
                                    <span>{new Date(q.created_at).toLocaleDateString()}</span>
                                  </div>
                                </div>

                                {/* Answers Section */}
                                <div className="space-y-2">
                                  <h5 className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-1">Answers ({q.answers?.length || 0})</h5>
                                  {(q.answers || []).map((ans, aIdx) => (
                                    <div key={aIdx} className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100 text-xs">
                                      <div className="flex justify-between text-[9px] font-bold text-indigo-650 mb-0.5">
                                        <span>{ans.user_name}</span>
                                        <span className="text-slate-400 font-normal">{new Date(ans.created_at).toLocaleDateString()}</span>
                                      </div>
                                      <p className="text-slate-700 font-medium">{ans.text}</p>
                                    </div>
                                  ))}
                                </div>

                                {/* Answer input field */}
                                <div className="pt-1.5 flex items-center space-x-2">
                                  <input 
                                    type="text"
                                    placeholder="Know the answer? Share it..."
                                    value={newAnswerInputs[String(q.id)] || ''}
                                    onChange={(e) => {
                                      const text = e.target.value;
                                      setNewAnswerInputs(prev => ({ ...prev, [String(q.id)]: text }));
                                    }}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAnswerQuestion(q.id)}
                                    className="flex-1 p-2 bg-slate-50 border border-slate-150 rounded-xl text-xs outline-none focus:border-indigo-350"
                                  />
                                  <button 
                                    onClick={() => handleAnswerQuestion(q.id)}
                                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black cursor-pointer transition active:scale-95"
                                  >
                                    Answer
                                  </button>
                                </div>
                              </div>
                            ))}

                            {((groupQuestions[activeGroup.id]) || []).length === 0 && (
                              <div className="text-center py-12">
                                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <h4 className="text-xs font-bold text-slate-700">No questions posted yet</h4>
                                <p className="text-[10px] text-slate-400 mt-1 mb-3">Stuck on a formula or problem? Ask your peers for help.</p>
                                <button onClick={() => setIsAddingGroupQuestion(true)} className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold active:scale-95 transition">
                                  Ask a Question
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {groupTab === 'sessions' && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Virtual Classrooms & Schedules</h4>
                              <button onClick={() => setIsAddingGroupSession(true)} className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-bold flex items-center transition cursor-pointer">
                                <Calendar className="w-3.5 h-3.5 mr-1" /> Schedule Session
                              </button>
                            </div>

                            {/* List Scheduled Sessions */}
                            {((groupSessions[activeGroup.id]) || []).map(session => (
                              <div key={session.id} className="bg-white p-4 rounded-3xl border border-slate-150 shadow-xs space-y-3 hover:border-indigo-100 transition duration-150">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-100">
                                      {session.meeting_platform}
                                    </span>
                                    <h4 className="font-bold text-slate-850 text-xs mt-1.5">{session.title}</h4>
                                    {session.topic && <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Topic: {session.topic}</p>}
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-700">{new Date(session.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                    <p className="text-[10px] font-extrabold text-indigo-600">{session.time}</p>
                                    <p className="text-[8px] font-bold text-slate-400">{session.duration} mins</p>
                                  </div>
                                </div>

                                {/* Attendee RSVP Renders */}
                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2.5">
                                  <div className="flex justify-between items-center text-[9px] uppercase font-black tracking-widest text-slate-400">
                                    <span>Attendees RSVP ({session.attendees?.filter(a => a.status === 'yes').length || 0})</span>
                                    <span className="text-indigo-600 lowercase font-extrabold">scheduled by {session.created_by_name}</span>
                                  </div>

                                  {/* List RSVP names */}
                                  <div className="flex flex-wrap gap-1">
                                    {(session.attendees || []).map((att, aIdx) => (
                                      <span key={aIdx} className={`text-[8px] font-black px-1.5 py-0.5 rounded-md flex items-center space-x-0.5 ${
                                        att.status === 'yes' ? 'bg-green-100 text-green-700 border border-green-200' :
                                        att.status === 'maybe' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                        'bg-slate-200 text-slate-600'
                                      }`}>
                                        <span>👤 {att.user_name}</span>
                                        <span>({att.status})</span>
                                      </span>
                                    ))}
                                    {(session.attendees || []).length === 0 && (
                                      <p className="text-[9px] text-slate-400 italic">No RSVPs yet. Secure your spot!</p>
                                    )}
                                  </div>

                                  {/* User RSVP Choices */}
                                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-1">
                                    <span className="text-[9px] text-slate-500 font-extrabold uppercase">Update Your RSVP:</span>
                                    <div className="flex items-center space-x-1.5">
                                      <button 
                                        onClick={() => handleRsvpSession(session.id, 'yes')}
                                        className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-[9px] font-bold rounded-lg cursor-pointer transition active:scale-90"
                                      >
                                        Going
                                      </button>
                                      <button 
                                        onClick={() => handleRsvpSession(session.id, 'maybe')}
                                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-bold rounded-lg cursor-pointer transition active:scale-90"
                                      >
                                        Maybe
                                      </button>
                                      <button 
                                        onClick={() => handleRsvpSession(session.id, 'no')}
                                        className="px-2.5 py-1 bg-slate-400 hover:bg-slate-500 text-white text-[9px] font-bold rounded-lg cursor-pointer transition active:scale-90"
                                      >
                                        Declined
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Join Meeting platform button */}
                                {session.meeting_link && (
                                  <a 
                                    href={session.meeting_link} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    referrerPolicy="no-referrer"
                                    className="w-full inline-flex items-center justify-center space-x-1.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-2xl shadow-xs transition active:scale-95"
                                  >
                                    <Video className="w-3.5 h-3.5" />
                                    <span>Join Session / Meet Room</span>
                                    <ExternalLink className="w-3 h-3 ml-0.5" />
                                  </a>
                                )}
                              </div>
                            ))}

                            {((groupSessions[activeGroup.id]) || []).length === 0 && (
                              <div className="text-center py-12">
                                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <h4 className="text-xs font-bold text-slate-700">No sessions scheduled</h4>
                                <p className="text-[10px] text-slate-400 mt-1 mb-3">Schedule a group virtual meeting or a group study challenge!</p>
                                <button onClick={() => setIsAddingGroupSession(true)} className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold active:scale-95 transition">
                                  Schedule Session
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Group Bottom Chat Controls */}
                      {groupTab === 'chat' && (
                        <div className="p-3 border-t border-slate-100 bg-white flex items-center space-x-2 shrink-0">
                          <input 
                            type="text" 
                            value={groupChatInput}
                            onChange={(e) => setGroupChatInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendGroupMessage()}
                            placeholder="Message study mates..."
                            className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-850 outline-none"
                          />
                          <button onClick={handleSendGroupMessage} className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow active:scale-95">
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* CONSOLIDATED STUDY NOTEBOOK TAB (NOTES, PLANNER, AND AI FLASHCARDS TOGETHER) */}
              {activeTab === 'notebook' && (
                <div className="flex-1 flex flex-col overflow-hidden p-5">
                  <header className="flex justify-between items-center shrink-0 mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">Study Notebook</h2>
                      <p className="text-xs text-slate-400">Class notes, study agenda, & spaced repetition</p>
                    </div>
                    {notebookTab === 'notes' && (
                      <button onClick={() => setIsAddingNote(true)} className="p-2 bg-indigo-600 text-white rounded-full shadow">
                        <Plus className="w-5 h-5" />
                      </button>
                    )}
                    {notebookTab === 'planner' && (
                      <button onClick={() => setIsAddingSchedule(true)} className="p-2 bg-indigo-600 text-white rounded-full shadow">
                        <Plus className="w-5 h-5" />
                      </button>
                    )}
                  </header>

                  {/* Sub-tab Switcher Header Controls */}
                  <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1.5 rounded-2xl mb-4 shrink-0">
                    <button 
                      onClick={() => {
                        setNotebookTab('notes');
                        setIsFlashcardSessionActive(false);
                      }} 
                      className={`py-2 text-[10px] sm:text-xs font-black rounded-xl transition ${notebookTab === 'notes' ? 'bg-white text-indigo-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Sticky Notes
                    </button>
                    <button 
                      onClick={() => {
                        setNotebookTab('planner');
                        setIsFlashcardSessionActive(false);
                      }} 
                      className={`py-2 text-[10px] sm:text-xs font-black rounded-xl transition ${notebookTab === 'planner' ? 'bg-white text-indigo-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Dailies
                    </button>
                    <button 
                      onClick={() => setNotebookTab('flashcards')} 
                      className={`py-2 text-[10px] sm:text-xs font-black rounded-xl transition ${notebookTab === 'flashcards' ? 'bg-white text-indigo-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      AI Flashcards
                    </button>
                  </div>

                  {/* Scrollable workspace core */}
                  <div className="flex-1 overflow-y-auto scrollbar-hide pr-1" id="notebook_content">
                    {notebookTab === 'notes' && (
                      <div className="space-y-4 pt-1 pb-4">
                        {notes.map((note, idx) => {
                          const palettes = [
                            { bg: 'bg-amber-100/80', border: 'border-amber-200/50', labelBg: 'bg-amber-200/60', text: 'text-amber-900', labelText: 'text-amber-800', shadow: 'shadow-amber-100/40', rotate: '-rotate-1' },
                            { bg: 'bg-sky-100/85', border: 'border-sky-200/50', labelBg: 'bg-sky-200/60', text: 'text-sky-900', labelText: 'text-sky-800', shadow: 'shadow-sky-100/40', rotate: 'rotate-1' },
                            { bg: 'bg-rose-100/80', border: 'border-rose-200/50', labelBg: 'bg-rose-200/60', text: 'text-rose-900', labelText: 'text-rose-800', shadow: 'shadow-rose-100/40', rotate: '-rotate-2' },
                            { bg: 'bg-emerald-100/85', border: 'border-emerald-200/50', labelBg: 'bg-emerald-200/60', text: 'text-emerald-950', labelText: 'text-emerald-800', shadow: 'shadow-emerald-100/40', rotate: 'rotate-2' },
                            { bg: 'bg-purple-100/80', border: 'border-purple-200/50', labelBg: 'bg-purple-200/60', text: 'text-purple-900', labelText: 'text-purple-800', shadow: 'shadow-purple-100/40', rotate: '-rotate-1' }
                          ];
                          const design = palettes[idx % palettes.length];
                          return (
                            <div 
                              key={note.id} 
                              className={`${design.bg} ${design.rotate} p-5 rounded-3xl border ${design.border} ${design.shadow} relative group hover:-translate-y-1 hover:rotate-0 transition-all duration-200 shadow-md`}
                            >
                              <div className="flex justify-between items-start">
                                <span className={`text-[9px] font-black tracking-wider uppercase px-2.5 py-1 ${design.labelBg} ${design.labelText} rounded-full`}>
                                  📌 {note.subject}
                                </span>
                                <button 
                                  onClick={() => handleDeleteNote(note.id)} 
                                  className="text-slate-400 hover:text-red-650 transition-colors p-1 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <h3 className={`font-black ${design.text} text-sm mt-3.5 tracking-tight`}>{note.title}</h3>
                              <p className={`text-xs ${design.text} opacity-90 mt-1 line-clamp-4 leading-relaxed whitespace-pre-wrap font-medium`}>{note.content}</p>
                            </div>
                          );
                        })}
                        {notes.length === 0 && <p className="text-center text-xs text-slate-400 py-10 italic">Create some study notes!</p>}
                      </div>
                    )}

                    {notebookTab === 'planner' && (
                      <div className="space-y-3">
                        {schedule.map(item => (
                          <div key={item.id} className="p-3.5 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                            <div className="flex items-center space-x-3.5">
                              <button onClick={() => handleToggleSchedule(item)}>
                                {item.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-slate-300" />}
                              </button>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className={`text-xs font-bold ${item.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>{item.task}</p>
                                  {item.category && (
                                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-mono font-extrabold uppercase border shadow-2xs shrink-0 select-none ${
                                      item.category === 'Exam' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                                      item.category === 'Project' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                      item.category === 'Other' ? 'bg-slate-50 border-slate-200 text-slate-700' :
                                      'bg-indigo-50 border-indigo-200 text-indigo-700'
                                    }`}>
                                      {item.category}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">{item.day} • {item.time}</p>
                              </div>
                            </div>
                            <button onClick={() => handleDeleteSchedule(item.id)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        ))}
                        {schedule.length === 0 && <p className="text-center text-xs text-slate-400 py-10 italic">Schedule assignments today.</p>}
                      </div>
                    )}

                    {notebookTab === 'flashcards' && (
                      <div>
                        {isFlashcardSessionActive ? (
                          /* ACTIVE FLASHCARD STUDY SESSION */
                          <div className="space-y-4 pt-1 pb-4">
                            <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                              <button 
                                onClick={() => setIsFlashcardSessionActive(false)} 
                                className="flex items-center space-x-1.5 text-slate-500 hover:text-slate-800 text-[10px] font-black uppercase tracking-wider"
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>Exit</span>
                              </button>
                              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-xl">
                                Card {currentFlashcardIndex + 1} of {sessionFlashcards.length}
                              </span>
                            </div>

                            {/* Session Progress Bar */}
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-indigo-600 h-full transition-all duration-300" 
                                style={{ width: `${Math.round(((currentFlashcardIndex) / sessionFlashcards.length) * 100)}%` }}
                              ></div>
                            </div>

                            {/* Flipping Container */}
                            <div 
                              onClick={() => setIsFlashcardFlipped(!isFlashcardFlipped)} 
                              className={`relative w-full h-56 cursor-pointer transition-all duration-500 [transform-style:preserve-3d] ${isFlashcardFlipped ? '[transform:rotateY(180deg)]' : ''} mb-6`}
                            >
                              {/* Front Side */}
                              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-50/70 to-indigo-100/60 rounded-3xl border border-indigo-200/50 shadow-md flex flex-col justify-between p-6 [backface-visibility:hidden]">
                                <div className="flex justify-between items-center">
                                  <span className="text-[9px] uppercase tracking-wider font-black px-2.5 py-1 bg-indigo-200/50 text-indigo-800 rounded-full">
                                    📌 {sessionFlashcards[currentFlashcardIndex].subject}
                                  </span>
                                  <span className="text-[9px] font-mono text-indigo-600 font-bold uppercase tracking-wider">Front Side</span>
                                </div>
                                <div className="flex-1 flex items-center justify-center text-center py-2">
                                  <p className="text-sm font-extrabold text-slate-800 leading-relaxed font-sans px-2">
                                    {sessionFlashcards[currentFlashcardIndex].front}
                                  </p>
                                </div>
                                <div className="text-center text-[9px] text-indigo-500 font-bold animate-pulse uppercase tracking-wider">
                                  Tap card to flip & see answer
                                </div>
                              </div>

                              {/* Back Side */}
                              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-emerald-50/70 to-emerald-100/60 rounded-3xl border border-emerald-200/50 shadow-md flex flex-col justify-between p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                                <div className="flex justify-between items-center">
                                  <span className="text-[9px] uppercase tracking-wider font-black px-2.5 py-1 bg-emerald-200/50 text-emerald-800 rounded-full">
                                    📌 {sessionFlashcards[currentFlashcardIndex].subject}
                                  </span>
                                  <span className="text-[9px] font-mono text-emerald-600 font-bold uppercase tracking-wider">Back Side</span>
                                </div>
                                <div className="flex-1 flex items-center justify-center text-center overflow-y-auto py-2">
                                  <p className="text-xs font-semibold text-slate-700 leading-relaxed font-sans px-2 whitespace-pre-wrap">
                                    {sessionFlashcards[currentFlashcardIndex].back}
                                  </p>
                                </div>
                                <div className="text-center text-[9px] text-emerald-600 font-bold uppercase tracking-wider">
                                  Tap to flip back to front
                                </div>
                              </div>
                            </div>

                            {/* Answer Rating Panels */}
                            {!isFlashcardFlipped ? (
                              <button 
                                onClick={() => setIsFlashcardFlipped(true)}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-150 transition cursor-pointer"
                              >
                                Reveal Answer
                              </button>
                            ) : (
                              <div className="space-y-3 pt-1">
                                <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Rate how well you recalled this:</p>
                                <div className="grid grid-cols-3 gap-2">
                                  <button 
                                    onClick={() => handleSpacedRepetitionResponse(sessionFlashcards[currentFlashcardIndex], 'again')}
                                    className="flex flex-col items-center justify-center p-3 bg-red-50 hover:bg-red-100/80 active:scale-95 border border-red-100 text-red-700 rounded-2xl text-[10px] font-black transition cursor-pointer"
                                  >
                                    <span className="text-lg">🔴</span>
                                    <span className="mt-1 font-extrabold text-[10px]">Again</span>
                                    <span className="text-[8px] font-medium text-red-500 mt-0.5">Soon</span>
                                  </button>
                                  <button 
                                    onClick={() => handleSpacedRepetitionResponse(sessionFlashcards[currentFlashcardIndex], 'good')}
                                    className="flex flex-col items-center justify-center p-3 bg-amber-50 hover:bg-amber-100/80 active:scale-95 border border-amber-100 text-amber-700 rounded-2xl text-[10px] font-black transition cursor-pointer"
                                  >
                                    <span className="text-lg">🟡</span>
                                    <span className="mt-1 font-extrabold text-[10px]">Good</span>
                                    <span className="text-[8px] font-medium text-amber-500 mt-0.5">Spaced Rec</span>
                                  </button>
                                  <button 
                                    onClick={() => handleSpacedRepetitionResponse(sessionFlashcards[currentFlashcardIndex], 'easy')}
                                    className="flex flex-col items-center justify-center p-3 bg-emerald-50 hover:bg-emerald-100/80 active:scale-95 border border-emerald-100 text-emerald-700 rounded-2xl text-[10px] font-black transition cursor-pointer"
                                  >
                                    <span className="text-lg">🟢</span>
                                    <span className="mt-1 font-extrabold text-[10px]">Easy</span>
                                    <span className="text-[8px] font-medium text-emerald-500 mt-0.5">Mastered</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* MAIN DASHBOARD DECK VIEW */
                          <div className="space-y-5 pt-1 pb-4">
                            {/* Statistics Bento row */}
                            <div className="grid grid-cols-2 gap-3 shrink-0">
                              <div className="p-4 bg-gradient-to-br from-indigo-50/50 to-indigo-100/30 border border-indigo-100/60 rounded-3xl">
                                <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">Total Cards</span>
                                <h4 className="text-xl font-black text-slate-800 mt-0.5">{flashcards.length}</h4>
                              </div>
                              <div className="p-4 bg-gradient-to-br from-rose-50/50 to-rose-100/30 border border-rose-100/60 rounded-3xl">
                                <span className="text-[9px] uppercase font-black text-rose-500 tracking-wider">Due For Review</span>
                                <h4 className="text-xl font-black text-slate-800 mt-0.5">
                                  {flashcards.filter(c => new Date(c.nextReviewDate) <= new Date()).length}
                                </h4>
                              </div>
                            </div>

                            {/* Study buttons */}
                            {flashcards.length > 0 && (
                              <div className="grid grid-cols-1 gap-2 shrink-0">
                                {flashcards.filter(c => new Date(c.nextReviewDate) <= new Date()).length > 0 && (
                                  <button 
                                    onClick={() => handleStartStudySession(true)}
                                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-2xl text-xs font-black shadow-md shadow-indigo-150 flex items-center justify-center space-x-2 transition cursor-pointer"
                                  >
                                    <Sparkles className="w-4 h-4" />
                                    <span>Review Due Cards ({flashcards.filter(c => new Date(c.nextReviewDate) <= new Date()).length})</span>
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleStartStudySession(false)}
                                  className="w-full py-3 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white rounded-2xl text-xs font-black shadow flex items-center justify-center space-x-2 transition cursor-pointer"
                                >
                                  <span>Study All Cards ({flashcards.length})</span>
                                </button>
                              </div>
                            )}

                            {/* AI generator block */}
                            <div className="p-5 bg-gradient-to-r from-slate-50 to-indigo-50/30 border border-slate-150 rounded-3xl shrink-0">
                              <div className="flex items-center space-x-2 mb-3">
                                <Sparkles className="w-4 h-4 text-indigo-500" />
                                <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">AI Flashcard Generator</h3>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <label className="block text-[8px] uppercase font-black text-slate-400 tracking-wider mb-1">Target Subject</label>
                                  <select 
                                    value={selectedSubjectForFlashcard}
                                    onChange={(e) => setSelectedSubjectForFlashcard(e.target.value as Subject)}
                                    className="w-full p-2.5 bg-white text-xs font-bold text-slate-700 border border-slate-200/80 rounded-xl outline-none"
                                  >
                                    {SUBJECTS.map(subj => (
                                      <option key={subj} value={subj}>{subj}</option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[8px] uppercase font-black text-slate-400 tracking-wider mb-1">Source Note (Optional)</label>
                                  <select 
                                    value={selectedNoteIdForFlashcard}
                                    onChange={(e) => setSelectedNoteIdForFlashcard(e.target.value)}
                                    className="w-full p-2.5 bg-white text-xs font-bold text-slate-700 border border-slate-200/80 rounded-xl outline-none"
                                  >
                                    <option value="none">✨ General Subject Concepts</option>
                                    {notes.map(note => (
                                      <option key={note.id} value={note.id}>📝 {note.title} ({note.subject})</option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[8px] uppercase font-black text-slate-400 tracking-wider mb-1.5">Deck size to generate</label>
                                  <div className="grid grid-cols-3 gap-1.5">
                                    {[3, 5, 10].map(size => (
                                      <button
                                        key={size}
                                        type="button"
                                        onClick={() => setFlashcardCountToGenerate(size)}
                                        className={`py-1.5 text-xs font-black rounded-xl border transition cursor-pointer ${flashcardCountToGenerate === size ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-white text-slate-600 border-slate-200/70'}`}
                                      >
                                        {size} Cards
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={handleGenerateFlashcards}
                                  disabled={isGeneratingFlashcards}
                                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-95 disabled:opacity-50 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2 transition cursor-pointer mt-1"
                                >
                                  {isGeneratingFlashcards ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      <span>Gemini creating deck...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-4 h-4" />
                                      <span>Create Flashcards with Gemini</span>
                                    </>
                                  )}
                                </button>

                                {isGeneratingFlashcards && (
                                  <div className="mt-3 p-3 bg-slate-50 border border-slate-200/50 rounded-2xl space-y-2">
                                    <div className="flex justify-between items-center text-[9px] font-black tracking-wide text-slate-500">
                                      <span className="truncate max-w-[80%] text-slate-600">
                                        {flashcardProgressStage || 'Generating cards...'}
                                      </span>
                                      <span className="text-indigo-600 shrink-0 font-black">
                                        {flashcardProgressPercent}%
                                      </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
                                        style={{ width: `${flashcardProgressPercent}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Deck details / scroll list */}
                            <div>
                              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Your Deck ({flashcards.length})</h3>
                              {flashcards.length === 0 ? (
                                <div className="p-8 border border-dashed border-slate-200 rounded-3xl text-center">
                                  <p className="text-xs text-slate-400 italic">No flashcards in your deck yet.</p>
                                  <p className="text-[10px] text-indigo-500 font-bold mt-1 uppercase tracking-wider">Select a note or subject above to let Gemini build some cards!</p>
                                </div>
                              ) : (
                                <div className="space-y-3 pb-8">
                                  {flashcards.map(card => {
                                    const isDue = new Date(card.nextReviewDate) <= new Date();
                                    return (
                                      <div key={card.id} className="p-4 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col justify-between space-y-3">
                                        <div className="flex justify-between items-start">
                                          <span className="text-[9px] uppercase tracking-wider font-black px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                                            {card.subject}
                                          </span>
                                          <div className="flex items-center space-x-2">
                                            {isDue ? (
                                              <span className="text-[9px] uppercase font-black px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-md">
                                                🔴 Due
                                              </span>
                                            ) : (
                                              <span className="text-[9px] uppercase font-black px-2 py-0.5 bg-slate-50 text-slate-400 border border-slate-100 rounded-md">
                                                {Math.max(1, Math.round((new Date(card.nextReviewDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))}d
                                              </span>
                                            )}
                                            <button 
                                              onClick={() => handleDeleteFlashcard(card.id)}
                                              className="text-slate-350 hover:text-red-500 p-0.5 cursor-pointer"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </div>
                                        <div>
                                          <p className="text-xs font-extrabold text-slate-800 leading-normal">{card.front}</p>
                                          <p className="text-[11px] font-medium text-slate-400 mt-1.5 whitespace-pre-wrap leading-relaxed border-t border-slate-50 pt-2">{card.back}</p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PRACTICE & SUBJECT QUIZZES */}
              {activeTab === 'quiz' && (
                <div className="flex-1 flex flex-col overflow-hidden p-5">
                  <header className="mb-4 shrink-0 flex justify-between items-center bg-white/40 p-3 rounded-2xl border border-slate-100">
                    <div>
                      <h2 className="text-base font-black text-slate-900 tracking-tight">Practice Academy</h2>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Dynamically Generated via Gemini AI</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg font-black uppercase">
                      CLASS {user?.className || "6"}
                    </span>
                  </header>

                  <div className="flex-1 overflow-y-auto scrollbar-hide" id="quiz_feed">
                    {!quizSubject ? (
                      <>
                        {/* Difficulty Selector */}
                        <div className="mb-4 bg-white/70 backdrop-blur-xs p-3.5 rounded-3xl border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                          <div className="text-center sm:text-left">
                            <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight flex items-center justify-center sm:justify-start gap-1">
                              <span>🎯</span>
                              <span>Select Quiz Difficulty</span>
                            </p>
                            <p className="text-[9px] text-slate-400 font-bold leading-normal mt-0.5">Gemini will adjust question depth and distractors dynamically</p>
                          </div>
                          <div className="flex gap-1.5 w-full sm:w-auto">
                            {(['Easy', 'Medium', 'Hard'] as const).map((level) => {
                              const active = quizDifficulty === level;
                              const colors = {
                                Easy: active 
                                  ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-200 border-emerald-600' 
                                  : 'hover:bg-emerald-50 text-emerald-700 border-emerald-100 bg-emerald-50/20',
                                Medium: active 
                                  ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-200 border-indigo-600' 
                                  : 'hover:bg-indigo-50 text-indigo-700 border-indigo-100 bg-indigo-50/20',
                                Hard: active 
                                  ? 'bg-rose-600 text-white shadow-xs shadow-rose-200 border-rose-600' 
                                  : 'hover:bg-rose-50 text-rose-700 border-rose-100 bg-rose-50/20',
                              };
                              return (
                                <button
                                  key={level}
                                  type="button"
                                  onClick={() => setQuizDifficulty(level)}
                                  className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border cursor-pointer transition duration-150 active:scale-95 flex items-center justify-center gap-1 ${colors[level]}`}
                                  id={`diff_selector_${level.toLowerCase()}`}
                                >
                                  <span>
                                    {level === 'Easy' && '🌱'}
                                    {level === 'Medium' && '📚'}
                                    {level === 'Hard' && '🔥'}
                                  </span>
                                  <span>{level}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3.5 pb-2">
                          {SUBJECTS.map(sub => {
                            const details = SUBJECT_DETAILS[sub];
                            const IconComponent = details.icon;
                            return (
                              <div
                                key={sub}
                                className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between h-52 hover:shadow-md transition-all duration-250 hover:border-slate-200"
                              >
                                <div className="flex items-start justify-between">
                                  <div className={`p-2 rounded-2xl bg-gradient-to-tr ${details.color} text-white shadow-xs`}>
                                    <IconComponent className="w-5 h-5 stroke-[2.5]" />
                                  </div>
                                  <span className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md border border-slate-100">
                                    {sub}
                                  </span>
                                </div>
                                <div className="mt-2">
                                  <h3 className="font-extrabold text-slate-900 text-xs tracking-tight leading-tight">{details.text}</h3>
                                  <p className="text-[10px] font-bold text-slate-400 mt-0.5 leading-none">{details.textHi}</p>
                                </div>
                                <div className="space-y-1 mt-1.5 pt-2 border-t border-slate-50">
                                  <button
                                    onClick={() => startQuiz(sub, appLanguage)}
                                    className="w-full py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-95 transition rounded-xl text-[9px] font-black text-white flex items-center justify-center space-x-1 shadow-sm cursor-pointer"
                                    id={`quiz_selected_${sub.toLowerCase()}`}
                                  >
                                    <span>{LANGUAGES.find(l => l.code === appLanguage)?.flag || '✨'}</span>
                                    <span>{translate('start_quiz', appLanguage, 'Start quiz')} ({LANGUAGES.find(l => l.code === appLanguage)?.label.split(' ')[0]})</span>
                                  </button>
                                  {appLanguage !== 'English' && (
                                    <button
                                      onClick={() => startQuiz(sub, 'English')}
                                      className="w-full py-1 bg-slate-50 hover:bg-slate-100 active:scale-95 transition rounded-xl text-[9px] font-bold text-slate-650 flex items-center justify-center space-x-1 border border-slate-200/50 cursor-pointer"
                                      id={`quiz_en_alt_${sub.toLowerCase()}`}
                                    >
                                      <span>🇬🇧</span>
                                      <span>English Practice</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="bg-white p-5 rounded-3xl border border-slate-150/80 shadow-md space-y-4">
                        {isQuizLoading ? (
                          <div className="py-12 text-center space-y-3">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                            <p className="text-xs text-slate-700 font-extrabold">Formulating your {quizSubject} ({quizDifficulty}) {quizLanguage === 'Hindi' ? 'हिंदी' : 'English'} challenge...</p>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase animate-pulse">Wait a moment while Gemini writes questions</p>
                          </div>
                        ) : quizFinished ? (
                          <div className="text-center py-6 space-y-5">
                            <span className="text-4xl">🎓</span>
                            <div>
                              <h3 className="text-base font-black text-slate-900">{translate('quiz_completed_title', appLanguage, 'Quiz Completed!')}</h3>
                              <p className="text-xs text-slate-600 font-bold mt-1">Excellent Effort on {quizDifficulty}! You scored {quizScore} / {quizQuestions.length}</p>
                              <p className="text-indigo-600 font-black text-xs mt-2.5 flex items-center justify-center space-x-1">
                                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                                <span>+{quizScore * 10} XP Reward Added to Profile!</span>
                              </p>
                            </div>
                            <button onClick={() => setQuizSubject(null)} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black tracking-wider uppercase shadow-md shadow-indigo-150 cursor-pointer">{translate('back_to_topics', appLanguage, 'Back to Topics')}</button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center text-[9px] uppercase font-bold text-slate-400">
                              <span className="inline-flex items-center space-x-1.5">
                                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                <span>{quizSubject} ({quizLanguage}) Practice • <span className="text-indigo-600 font-extrabold">{quizDifficulty}</span></span>
                              </span>
                              <span>{currentQuizIndex + 1} / {quizQuestions.length}</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${((currentQuizIndex + 1) / quizQuestions.length) * 100}%` }} />
                            </div>
                            <h3 className="font-extrabold text-slate-900 text-xs md:text-sm leading-relaxed">{quizQuestions[currentQuizIndex]?.question}</h3>
                            <div className="space-y-2.5 pt-2">
                              {quizQuestions[currentQuizIndex]?.options.map((option: string, opIdx: number) => (
                                <button
                                  key={opIdx}
                                  onClick={() => handleQuizAnswer(opIdx)}
                                  className="w-full p-4 bg-slate-50/70 hover:bg-indigo-50/40 rounded-2xl border border-slate-200/80 hover:border-indigo-400 text-slate-800 text-xs font-bold text-left transition duration-150 flex items-center justify-between cursor-pointer"
                                >
                                  <span>{option}</span>
                                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </main>

        {/* Dynamic Mobile Standard App Bottom Tab Bar (ALIGNED PINNED NO CLIP) */}
        <nav className="bg-white border-t border-slate-150 py-2.5 px-2 shrink-0 flex justify-around items-center z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]" id="tab_bar">
          <button 
            onClick={() => { setActiveTab('home'); setActiveGroup(null); }}
            className={`flex flex-col items-center justify-center w-16 py-1 rounded-2xl transition-all duration-200 ${activeTab === 'home' ? 'text-indigo-600 bg-indigo-50/70 font-black scale-105' : 'text-slate-400 hover:text-slate-650'}`}
            title={translate('home', appLanguage, 'Home')}
            id="tab_btn_home"
          >
            <Home className="w-5 h-5" />
            <span className="text-[9px] font-extrabold mt-0.5 tracking-tight">{translate('home', appLanguage, 'Home')}</span>
          </button>
          
          <button 
            onClick={() => { setActiveTab('chat'); setActiveGroup(null); }}
            className={`flex flex-col items-center justify-center w-16 py-1 rounded-2xl transition-all duration-200 ${activeTab === 'chat' ? 'text-indigo-600 bg-indigo-50/70 font-black scale-105' : 'text-slate-400 hover:text-slate-650'}`}
            title={translate('ai_tutor', appLanguage, 'AI Tutor')}
            id="tab_btn_chat"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[9px] font-extrabold mt-0.5 tracking-tight">{translate('ai_tutor', appLanguage, 'AI Tutor')}</span>
          </button>

          <button 
            onClick={() => { setActiveTab('groups'); setActiveGroup(null); }}
            className={`flex flex-col items-center justify-center w-16 py-1 rounded-2xl transition-all duration-200 ${activeTab === 'groups' ? 'text-indigo-600 bg-indigo-50/70 font-black scale-105' : 'text-slate-400 hover:text-slate-650'}`}
            title={translate('groups', appLanguage, 'Groups')}
            id="tab_btn_groups"
          >
            <Users className="w-5 h-5" />
            <span className="text-[9px] font-extrabold mt-0.5 tracking-tight">{translate('groups', appLanguage, 'Groups')}</span>
          </button>

          <button 
            onClick={() => { setActiveTab('notebook'); setActiveGroup(null); }}
            className={`flex flex-col items-center justify-center w-16 py-1 rounded-2xl transition-all duration-200 ${activeTab === 'notebook' ? 'text-indigo-600 bg-indigo-50/70 font-black scale-105' : 'text-slate-400 hover:text-slate-650'}`}
            title={translate('notebook', appLanguage, 'Notebook')}
            id="tab_btn_notebook"
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[9px] font-extrabold mt-0.5 tracking-tight">{translate('notebook', appLanguage, 'Notebook')}</span>
          </button>

          <button 
            onClick={() => { setActiveTab('quiz'); setActiveGroup(null); }}
            className={`flex flex-col items-center justify-center w-16 py-1 rounded-2xl transition-all duration-200 ${activeTab === 'quiz' ? 'text-indigo-600 bg-indigo-50/70 font-black scale-105' : 'text-slate-400 hover:text-slate-650'}`}
            title={translate('quiz', appLanguage, 'Quiz')}
            id="tab_btn_quiz"
          >
            <GraduationCap className="w-5 h-5" />
            <span className="text-[9px] font-extrabold mt-0.5 tracking-tight">{translate('quiz', appLanguage, 'Quiz')}</span>
          </button>
        </nav>

        {/* MODAL SYSTEM (LIGHTWEIGHT CONTEXT DIALOG BACKDROPS) */}
        <AnimatePresence>
          {isToolkitOpen && (
            <InteractiveToolkit 
              onClose={() => setIsToolkitOpen(false)}
              appLanguage={appLanguage}
              firebaseUser={firebaseUser}
              user={user}
              notes={notes}
              onAddNote={async (noteData) => {
                try {
                  let generatedId: string | number = 'local_' + Date.now();
                  if (firebaseUser) {
                    generatedId = await saveNote(firebaseUser.uid, {
                      title: noteData.title,
                      content: noteData.content,
                      subject: noteData.subject
                    });
                  } else {
                    const localNotes = JSON.parse(localStorage.getItem('studybuddy_guest_notes') || '[]');
                    const newLocalNote = {
                      id: generatedId,
                      title: noteData.title,
                      content: noteData.content,
                      subject: noteData.subject,
                      updated_at: new Date().toISOString()
                    };
                    localNotes.unshift(newLocalNote);
                    localStorage.setItem('studybuddy_guest_notes', JSON.stringify(localNotes));
                  }
                  const noteItem: Note = { 
                    id: generatedId, 
                    title: noteData.title, 
                    content: noteData.content, 
                    subject: noteData.subject, 
                    updated_at: new Date().toISOString() 
                  };
                  setNotes(prev => [noteItem, ...prev]);
                  awardPoints(15, 'note');
                } catch (err) {
                  console.error("Failed to add AI note:", err);
                }
              }}
              onAddProgress={async (score, total, subject) => {
                const entry = {
                  subject,
                  score,
                  total,
                  date: new Date().toISOString()
                };
                try {
                  if (firebaseUser) {
                    const id = await saveProgressEntry(firebaseUser.uid, entry);
                    setProgress(prev => [{ id, ...entry }, ...prev]);
                  } else {
                    const localProgress = JSON.parse(localStorage.getItem('studybuddy_guest_progress') || '[]');
                    const newLocal = [{ id: 'guest_' + Date.now(), ...entry }, ...localProgress];
                    localStorage.setItem('studybuddy_guest_progress', JSON.stringify(newLocal));
                    setProgress(newLocal);
                  }
                  awardPoints(score * 30, 'quiz');
                } catch (err) {
                  console.error("Failed to save mock test progress:", err);
                }
              }}
            />
          )}

          {isAddingNote && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end justify-center" id="new_note_modal">
              <motion.div initial={{ y: "15%" }} animate={{ y: 0 }} exit={{ y: "15%" }} className="bg-white w-full rounded-t-3xl p-5 space-y-4 shadow-xl border-t border-slate-200">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-800 text-sm">Add Sticky Note</h3>
                  <button onClick={() => setIsAddingNote(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">Cancel</button>
                </div>
                <input type="text" placeholder="Note Title" value={newNote.title} onChange={(e) => setNewNote({...newNote, title: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold outline-none" />
                <select value={newNote.subject} onChange={(e) => setNewNote({...newNote, subject: e.target.value as Subject})} className="w-full p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold outline-none text-slate-700">
                  {SUBJECTS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
                <textarea placeholder="Write subject content here..." value={newNote.content} onChange={(e) => setNewNote({...newNote, content: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs h-28 resize-none outline-none text-slate-700" />
                <button onClick={handleAddNote} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold active:scale-95 transition">Save Note</button>
              </motion.div>
            </motion.div>
          )}

          {isAddingSchedule && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end justify-center" id="new_planner_modal">
              <motion.div initial={{ y: "15%" }} animate={{ y: 0 }} exit={{ y: "15%" }} className="bg-white w-full rounded-t-3xl p-5 space-y-4 shadow-xl border-t border-slate-200">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-800 text-sm">Add Assignment Task</h3>
                  <button onClick={() => setIsAddingSchedule(false)} className="text-slate-400 hover:text-slate-600 text-xs font-semibold">Cancel</button>
                </div>
                <input type="text" placeholder="Task description..." value={newSchedule.task} onChange={(e) => setNewSchedule({...newSchedule, task: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold outline-none" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="time" value={newSchedule.time} onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})} className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold outline-none" />
                  <select value={newSchedule.day} onChange={(e) => setNewSchedule({...newSchedule, day: e.target.value})} className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold outline-none text-slate-700">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider">Category</label>
                  <select value={newSchedule.category} onChange={(e) => setNewSchedule({...newSchedule, category: e.target.value as any})} className="w-full p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold outline-none text-slate-700">
                    <option value="Homework">Homework 📝</option>
                    <option value="Exam">Exam 🎓</option>
                    <option value="Project">Project 🧪</option>
                    <option value="Other">Other 📌</option>
                  </select>
                </div>
                <button onClick={handleAddSchedule} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold active:scale-95 transition">Add Session</button>
              </motion.div>
            </motion.div>
          )}

          {isAddingGroup && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end justify-center" id="new_group_modal">
              <motion.div initial={{ y: "15%" }} animate={{ y: 0 }} exit={{ y: "15%" }} className="bg-white w-full rounded-t-3xl p-5 space-y-4 shadow-xl border-t border-slate-200 max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-800 text-sm">Create New Study Group</h3>
                  <button onClick={() => setIsAddingGroup(false)} className="text-slate-400 text-xs font-semibold">Cancel</button>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Group Name</label>
                  <input type="text" placeholder="e.g. Calculus BC Study Circle" value={newGroup.name} onChange={(e) => setNewGroup({...newGroup, name: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject Focus</label>
                    <select 
                      value={newGroup.subject} 
                      onChange={(e) => setNewGroup({...newGroup, subject: e.target.value as Subject})} 
                      className="w-full p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold outline-none text-slate-700"
                    >
                      <option value="Mathematics">Mathematics 📐</option>
                      <option value="Science">Science 🧪</option>
                      <option value="Literature">Literature 📖</option>
                      <option value="History">History ⏳</option>
                      <option value="Computer Science">Computer Science 💻</option>
                      <option value="Languages">Languages 🗣️</option>
                      <option value="Art">Art 🎨</option>
                      <option value="Geography">Geography 🗺️</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Specific Course / Class</label>
                    <input type="text" placeholder="e.g. AP Math Section B" value={newGroup.course} onChange={(e) => setNewGroup({...newGroup, course: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold outline-none text-slate-700" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                  <textarea placeholder="Tell peers what you are studying together..." value={newGroup.description} onChange={(e) => setNewGroup({...newGroup, description: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs h-20 resize-none outline-none text-slate-700" />
                </div>

                <button onClick={handleCreateGroup} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold active:scale-95 transition shadow-md">Create Group</button>
              </motion.div>
            </motion.div>
          )}

          {isAddingGroupNote && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end justify-center" id="new_team_note_modal">
              <motion.div initial={{ y: "15%" }} animate={{ y: 0 }} exit={{ y: "15%" }} className="bg-white w-full rounded-t-3xl p-5 space-y-4 shadow-xl border-t border-slate-200">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-800 text-sm">Share Lecture Note</h3>
                  <button onClick={() => setIsAddingGroupNote(false)} className="text-slate-400 text-xs font-semibold">Cancel</button>
                </div>
                <input type="text" placeholder="Topic Title" value={newGroupNote.title} onChange={(e) => setNewGroupNote({...newGroupNote, title: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold outline-none" />
                <textarea placeholder="Write note content..." value={newGroupNote.content} onChange={(e) => setNewGroupNote({...newGroupNote, content: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs h-24 resize-none outline-none text-slate-700" />
                <button onClick={handleCreateGroupNote} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold active:scale-95 transition">Share with Team</button>
              </motion.div>
            </motion.div>
          )}

          {isAddingGroupQuestion && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end justify-center" id="new_group_question_modal">
              <motion.div initial={{ y: "15%" }} animate={{ y: 0 }} exit={{ y: "15%" }} className="bg-white w-full rounded-t-3xl p-5 space-y-4 shadow-xl border-t border-slate-200">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-800 text-sm">Ask Group a Question</h3>
                  <button onClick={() => setIsAddingGroupQuestion(false)} className="text-slate-400 text-xs font-semibold">Cancel</button>
                </div>
                <input type="text" placeholder="What is your question about?" value={newGroupQuestion.title} onChange={(e) => setNewGroupQuestion({...newGroupQuestion, title: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold outline-none" />
                <textarea placeholder="Provide more details or copy-paste a problem..." value={newGroupQuestion.content} onChange={(e) => setNewGroupQuestion({...newGroupQuestion, content: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs h-24 resize-none outline-none text-slate-700" />
                <button onClick={handleCreateGroupQuestion} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold active:scale-95 transition">Ask Peers</button>
              </motion.div>
            </motion.div>
          )}

          {isAddingGroupSession && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end justify-center" id="new_group_session_modal">
              <motion.div initial={{ y: "15%" }} animate={{ y: 0 }} exit={{ y: "15%" }} className="bg-white w-full rounded-t-3xl p-5 space-y-4 shadow-xl border-t border-slate-200 max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-800 text-sm">Schedule Live Study Session</h3>
                  <button onClick={() => setIsAddingGroupSession(false)} className="text-slate-400 text-xs font-semibold">Cancel</button>
                </div>
                <input type="text" placeholder="Session Title (e.g., Physics Prep)" value={newGroupSession.title} onChange={(e) => setNewGroupSession({...newGroupSession, title: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold outline-none text-slate-700" />
                <input type="text" placeholder="Topic of discussion" value={newGroupSession.topic} onChange={(e) => setNewGroupSession({...newGroupSession, topic: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold outline-none text-slate-700" />
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Date</label>
                    <input type="date" value={newGroupSession.date} onChange={(e) => setNewGroupSession({...newGroupSession, date: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold outline-none text-slate-750" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Time</label>
                    <input type="time" value={newGroupSession.time} onChange={(e) => setNewGroupSession({...newGroupSession, time: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold outline-none text-slate-755" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Duration (mins)</label>
                    <select value={newGroupSession.duration} onChange={(e) => setNewGroupSession({...newGroupSession, duration: Number(e.target.value)})} className="w-full p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold outline-none text-slate-700">
                      <option value="30">30 Mins</option>
                      <option value="45">45 Mins</option>
                      <option value="60">1 Hour</option>
                      <option value="90">1.5 Hours</option>
                      <option value="120">2 Hours</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Meeting Platform</label>
                    <select value={newGroupSession.meeting_platform} onChange={(e) => setNewGroupSession({...newGroupSession, meeting_platform: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold outline-none text-slate-700">
                      <option value="Google Meet">Google Meet 📹</option>
                      <option value="Zoom">Zoom 🎥</option>
                      <option value="Microsoft Teams">MS Teams 👔</option>
                      <option value="Jitsi Meet">Jitsi Meet 🌐</option>
                      <option value="Discord">Discord 🎮</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Meeting Link (Optional)</label>
                  <input type="url" placeholder="https://meet.google.com/..." value={newGroupSession.meeting_link} onChange={(e) => setNewGroupSession({...newGroupSession, meeting_link: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs outline-none text-slate-700" />
                </div>

                <button onClick={handleCreateGroupSession} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold active:scale-95 transition shadow-md">Schedule Session</button>
              </motion.div>
            </motion.div>
          )}

          {/* FULL SCREEN MAGICAL BLACKBOARD MODAL OVERLAY */}
          {fullScreenMessage && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col p-3 md:p-5" 
              id="full_blackboard_container"
            >
              {/* Wooden chalk frame around the blackboard */}
              <div 
                className="flex-1 bg-teal-950 rounded-3xl border-8 border-amber-900 shadow-2xl p-4 md:p-6 flex flex-col relative overflow-hidden" 
                style={{ backgroundImage: "radial-gradient(ellipse at center, #142a27 0%, #081312 100%)" }}
              >
                {/* Board Heading */}
                <div className="flex justify-between items-center border-b border-dashed border-teal-600/30 pb-3 shrink-0">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <h2 className="text-white text-xs md:text-sm font-black tracking-widest uppercase ml-1 font-mono">
                      {translate('blackboard_title', appLanguage, ' ✨ जादुई शिक्षा बोर्ड ✨')}
                    </h2>
                  </div>
                  
                  {/* Language Switcher moved here */}
                  <div className="relative flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFullScreenMessage(null)}
                      className="p-1 rounded-full hover:bg-slate-700 transition outline-none cursor-pointer text-slate-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                      className="p-1 rounded-full hover:bg-slate-700 transition outline-none cursor-pointer text-slate-300"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {showLanguageDropdown && (
                      <div className="absolute left-0 top-full mt-2 w-32 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 flex flex-col divide-y divide-slate-100 max-h-40 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                        {LANGUAGES.map((lang) => (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => {
                              setAppLanguage(lang.code);
                              localStorage.setItem('studybuddy_appLanguage', lang.code);
                              setShowLanguageDropdown(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-[9px] font-black flex items-center space-x-2 cursor-pointer hover:bg-slate-50 ${
                              appLanguage === lang.code ? 'text-indigo-600 bg-indigo-50/40 font-black' : 'text-slate-650'
                            }`}
                          >
                            <span>{lang.flag}</span>
                            <span className="truncate">{lang.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Chalk board contents scroll view */}
                <div className="flex-1 overflow-y-auto my-4 pr-1 scrollbar-hide text-white space-y-4 select-text">
                  {fullScreenMessage.image && (
                    <div className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden border border-white/20 shadow-md">
                      <img src={fullScreenMessage.image} alt="study drawing" className="w-full max-h-48 object-cover" />
                    </div>
                  )}
                  <div className="text-slate-100 font-mono leading-relaxed p-1">
                    {renderChatMessageInChalk(fullScreenMessage.text)}
                  </div>
                </div>

                {/* Lower chalk shelf holding eraser and board controls */}
                <div className="mt-auto pt-3 border-t border-dashed border-teal-600/30 flex flex-wrap gap-2 items-center justify-between shrink-0">
                  {/* Animating Study Buddy Pet Greeting */}
                  <div className="flex items-center space-x-2 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-700/50 max-w-[190px]">
                    <span className="text-2xl animate-bounce">🐼</span>
                    <div className="leading-tight">
                      <p className="text-[8px] text-amber-400 font-black tracking-widest font-mono">STUDY PET</p>
                      <p className="text-[10px] text-slate-300 font-bold truncate">Keep it up, {user?.name || "learner"}!</p>
                    </div>
                  </div>

                  {/* Operational Blackboard chalk style buttons */}
                  <div className="flex items-center justify-end gap-2 flex-wrap w-full">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Speak Description (Tts) */}
                      {speakingText === fullScreenMessage.text ? (
                        <button 
                          onClick={() => handleSpeakMessage(fullScreenMessage.text)}
                          className="px-3 py-2 bg-red-655 hover:bg-red-750 text-white rounded-xl text-[10px] font-black flex items-center space-x-1 shadow border border-red-500 transition transform active:scale-95 cursor-pointer"
                        >
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>{translate('tts_stop', appLanguage, 'Stop 🤫')}</span>
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleSpeakMessage(fullScreenMessage.text)}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black flex items-center space-x-1 shadow border border-emerald-500 transition transform active:scale-95 cursor-pointer animate-pulse"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>{translate('tts_speak', appLanguage, 'Speak 🔊')}</span>
                        </button>
                      )}

                      {/* Copy to Notebook (notesCopy) */}
                      {fullScreenMessage.role === 'model' && (
                        <button 
                          onClick={() => {
                            const noteItem: Note = { 
                              id: Date.now(), 
                              title: `AI Note - ${new Date().toLocaleDateString()}`, 
                              content: fullScreenMessage.text, 
                              subject: 'Science', 
                              updated_at: new Date().toISOString() 
                            };
                            setNotes(prev => [noteItem, ...prev]);
                            awardPoints(15, 'note');
                            alert(appLanguage === 'Hindi' 
                              ? "सफलतापूर्वक नोटबुक में सहेज लिया गया है! 📝" 
                              : "Successfully saved to your Notebook! 📝");
                          }}
                          className="px-3 py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-[10px] font-black flex items-center space-x-1 shadow border border-indigo-550 transition transform active:scale-95 cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{translate('save_to_notebook', appLanguage, 'Notebook 📝')}</span>
                        </button>
                      )}

                      {/* Done Studying Return Back button */}
                      <button 
                        onClick={() => {
                          if (speakingText === fullScreenMessage.text) {
                            handleSpeakMessage(fullScreenMessage.text);
                          }
                          setFullScreenMessage(null);
                        }}
                        className="px-4.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-[10px] transition transform active:scale-95 border border-amber-300 shadow cursor-pointer"
                      >
                        {translate('close_blackboard', appLanguage, 'Close 🌟')}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* PROFILE & LOGIN MODAL OVERLAY */}
          {showProfileModal && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end justify-center" 
              id="profile_login_modal"
            >
              <motion.div 
                initial={{ y: "15%" }} 
                animate={{ y: 0 }} 
                exit={{ y: "15%" }} 
                className="bg-white w-full rounded-t-3xl p-5 space-y-4 shadow-xl border-t border-slate-200 overflow-y-auto max-h-[85vh] scrollbar-hide text-left"
              >
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-bold text-slate-800 text-xs">Account & Profile Settings</h3>
                  </div>
                  <button 
                    onClick={() => setShowProfileModal(false)} 
                    className="text-slate-400 text-xs font-semibold p-1 bg-slate-100 rounded-full hover:bg-slate-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Profile Overview Card */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-200 text-2xl shadow-sm">
                    {user?.avatar || "🐼"}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-slate-850 text-xs">{user?.name || "Guest Student"}</h4>
                    <p className="text-[10px] text-slate-500 font-bold">{user?.school || "No School Selected"}</p>
                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md inline-block mt-1">
                      Class {user?.className || "10"} • {user?.points || 100} XP
                    </span>
                  </div>
                  <span className="text-[8px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100">
                    Offline Saved 💾
                  </span>
                </div>

                {/* Edit Profile Form */}
                <div className="space-y-3 pt-1 border-t border-slate-100 mt-2">
                  <h4 className="font-extrabold text-slate-700 text-[10px] uppercase tracking-wider">Update Your Profile Details</h4>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Student Name</label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="अपना नाम लिखें"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">School Name</label>
                    <input
                      type="text"
                      value={regSchool}
                      onChange={(e) => setRegSchool(e.target.value)}
                      placeholder="Write school name"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Student Class</label>
                    <select
                      value={regClass}
                      onChange={(e) => setRegClass(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-100 outline-none"
                    >
                      {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map((c) => (
                        <option key={c} value={c}>{`Class ${c}`}</option>
                      ))}
                    </select>
                  </div>

                  {/* Avatar Selector */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase block">Choose Your Avatar</label>
                    <div className="flex gap-2 justify-start">
                      {['🐼', '🦁', '🦉', '🦊', '🦄'].map((av) => (
                        <button
                          key={av}
                          type="button"
                          onClick={() => setRegAvatar(av)}
                          className={`w-9 h-9 text-lg rounded-xl flex items-center justify-center border transition cursor-pointer ${
                            regAvatar === av ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-slate-50 border-slate-250'
                          }`}
                        >
                          {av}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => {
                        if (regName.trim() && regSchool.trim()) {
                          const updated = {
                            ...user,
                            name: regName.trim(),
                            school: regSchool.trim(),
                            className: regClass,
                            avatar: regAvatar
                          };
                          setUser(updated as any);
                          localStorage.setItem('studybuddy_local_profile', JSON.stringify(updated));
                          setShowProfileModal(false);
                          alert("Profile updated successfully! 🚀");
                        } else {
                          alert("Please fill your Name and School details!");
                        }
                      }}
                      className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition text-center shadow-md shadow-indigo-100 cursor-pointer"
                    >
                      Save Changes 💾
                    </button>

                    <button
                      onClick={() => {
                        if (confirm("Do you really want to reset your local student profile and create a new one?\nYour notes, daily schedule, and other data will remain safe!")) {
                          localStorage.removeItem('studybuddy_local_profile');
                          setUser(null);
                          setRegName('');
                          setRegSchool('');
                          setRegClass('6');
                          setRegAvatar('🐼');
                          setShowProfileModal(false);
                          setActiveTab('home');
                        }
                      }}
                      className="py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-150 rounded-xl text-xs font-black transition text-center cursor-pointer"
                    >
                      Reset Account 🧹
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      )}

    </div>
  );
}
