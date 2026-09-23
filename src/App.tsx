import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  MessageSquare, 
  PenTool, 
  GraduationCap, 
  FileText, 
  Heart, 
  Flame, 
  Globe, 
  Send, 
  Plus, 
  Trash2, 
  Play,
  Pause,
  RotateCcw,
  BookOpen,
  Check,
  Calendar,
  ChevronRight,
  BrainCircuit,
  LayoutGrid,
  List,
  ChevronDown,
  Mail,
  X,
  Image as ImageIcon,
  LogIn,
  Edit3,
  User as UserIcon,
  Settings2,
  Terminal,
  Mic,
  Search,
  Notebook
} from 'lucide-react';
import InteractiveToolkit from './components/InteractiveToolkit';
import AiTutorApp from './components/AiTutorApp';
import ImageGenerator from './components/ImageGenerator';
import OnboardingModal from './components/OnboardingModal';
import AuthModal from './components/AuthModal';
import SelfCustomizeModal, { DEFAULT_UI_CUSTOMIZATION } from './components/SelfCustomizeModal';
import { PdfBookScanner } from './components/PdfBookScanner';
import { VoiceTutorModal } from './components/VoiceTutorModal';

import IntegrationsHub from './components/IntegrationsHub';
import { RealtimeMovingUniverse } from './components/RealtimeMovingUniverse';
import { TRANSLATIONS, Language } from './services/translations';
import { playUiSound } from './services/soundEffects';
import { 
  auth, 
  onAuthStateChanged,
  FirebaseUser 
} from './services/firebase';
import { 
  subscribeUserProfile, 
  updateUserProfile, 
  subscribeToChats, 
  sendGroupMessage, 
  subscribeToWhiteboard, 
  addWhiteboardElement, 
  clearWhiteboardRoom, 
  subscribeToMockExams, 
  saveMockExam, 
  subscribeToStudyDocuments, 
  saveStudyDocument, 
  deleteStudyDocument 
} from './services/firebaseDb';
import UserAvatar from './components/UserAvatar';
import AvatarSelectorModal, { AvatarSelectionData } from './components/AvatarSelectorModal';
import ThemeToggle from './components/ThemeToggle';
import QuizSection from './components/QuizSection';
import PWAInstallBanner from './components/PWAInstallBanner';
import { BadgeCelebrationModal } from './components/BadgeCelebrationModal';
import Toast, { showToast } from './components/Toast';
import type { 
  UserProfile, 
  RoomChatMessage, 
  WhiteboardElement, 
  MockExam, 
  StudyDocument, 
  Subject,
  UiCustomization 
} from './types';

const SUBJECTS: Subject[] = ['Mathematics', 'Science', 'Biology', 'Physics', 'Chemistry', 'English'];

export interface BadgeDefinition {
  id: string;
  name: string;
  nameHindi: string;
  icon: string;
  desc: string;
  descHindi: string;
  target: number;
  getActual: (profile: UserProfile, docsCount: number, examsCount: number, pomoCount: number) => number;
  displayUnit: string;
}

export const BADGES_CONFIG: BadgeDefinition[] = [
  {
    id: 'quick_starter',
    name: 'Quick Starter',
    nameHindi: 'त्वरित शुरुआत',
    icon: '🚀',
    desc: 'Reach 150+ XP in your study journey.',
    descHindi: 'पढ़ाई की यात्रा में 150+ XP हासिल करें।',
    target: 150,
    getActual: (profile, _d, _e, _p) => profile.xp || 0,
    displayUnit: 'XP'
  },
  {
    id: 'consistent_scholar',
    name: 'Consistent Scholar',
    nameHindi: 'सदाबहार छात्र',
    icon: '🔥',
    desc: 'Maintain a study streak of 5+ days.',
    descHindi: '5 या अधिक दिनों की पढ़ाई की निरंतरता बनाए रखें।',
    target: 5,
    getActual: (profile, _d, _e, _p) => profile.streak || 0,
    displayUnit: 'Days'
  },
  {
    id: 'quiz_champion',
    name: 'Quiz Champion',
    nameHindi: 'क्विज चैंपियन',
    icon: '🧠',
    desc: 'Complete 2+ Practice Quizzes or Mock Exams.',
    descHindi: '2 या अधिक अभ्यास क्विज या मॉक परीक्षाएं पूरी करें।',
    target: 2,
    getActual: (_p, _d, examsCount, _pm) => examsCount,
    displayUnit: 'Quizzes'
  },
  {
    id: 'avid_researcher',
    name: 'Avid Researcher',
    nameHindi: 'उत्सुक शोधकर्ता',
    icon: '📚',
    desc: 'Create 3+ study notes or documents.',
    descHindi: '3 या अधिक स्टडी नोट्स या दस्तावेज़ बनाएं।',
    target: 3,
    getActual: (_p, docsCount, _e, _pm) => docsCount,
    displayUnit: 'Notes'
  },
  {
    id: 'focus_warrior',
    name: 'Focus Warrior',
    nameHindi: 'एकाग्रता योद्धा',
    icon: '⏱️',
    desc: 'Complete at least 1 Focus Session.',
    descHindi: 'कम से कम 1 एकाग्रता (Pomodoro) सत्र पूरा करें।',
    target: 1,
    getActual: (_p, _d, _e, pomoCount) => pomoCount,
    displayUnit: 'Session'
  },
  {
    id: 'legendary_companion',
    name: 'Legendary Companion',
    nameHindi: 'महान साथी',
    icon: '🦁',
    desc: 'Raise your study pet to Level 3 or higher.',
    descHindi: 'अपने स्टडी पेट को लेवल 3 या उससे ऊपर ले जाएं।',
    target: 3,
    getActual: (profile, _d, _e, _p) => profile.petLevel || 1,
    displayUnit: 'Lvl'
  }
];

const DEFAULT_USER: UserProfile = {
  uid: 'user_local_student',
  name: '',
  email: '',
  avatar: '🧑‍🎓',
  avatarType: 'emoji',
  avatarBg: 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600',
  xp: 100,
  level: 1,
  streak: 5,
  petLevel: 1,
  petXp: 80,
  petName: 'Chimpu',
  language: 'en',
  lastActive: new Date().toISOString(),
  schoolName: '',
  className: '',
  targetGoal: '',
  isOnboarded: false
};

export default function App() {
  const [appLanguage, setAppLanguage] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<'home' | 'toolkit' | 'groupChat' | 'whiteboard' | 'mockExam' | 'studyDocs' | 'petCompanion' | 'aiTutor' | 'quiz' | 'notebook' | 'planner' | 'imageGen' | 'pdfScanner' | 'googleWorkspace'>('home');
  const [attachedWorkspaceFiles, setAttachedWorkspaceFiles] = useState<Array<{ id: string; name: string; content: string; type: "drive" | "classroom" | "sheets" }>>([]);
  const [initialTool, setInitialTool] = useState<string | undefined>(undefined);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [showVoiceTutorModal, setShowVoiceTutorModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [playgroundViewMode, setPlaygroundViewMode] = useState<'list' | 'grid'>('list');
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  // Bottom navigation auto-hide state for AI Tutor mode (auto-hides in 2s, pull-up arrow restores)
  const [isBottomNavVisible, setIsBottomNavVisible] = useState(true);
  const [isBottomNavInteracting, setIsBottomNavInteracting] = useState(false);
  const bottomNavTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetBottomNavTimer = () => {
    if (bottomNavTimerRef.current) {
      clearTimeout(bottomNavTimerRef.current);
      bottomNavTimerRef.current = null;
    }
    if (activeTab === 'aiTutor' && !isBottomNavInteracting && !showMoreMenu && isBottomNavVisible) {
      bottomNavTimerRef.current = setTimeout(() => {
        setIsBottomNavVisible(false);
      }, 2000); // exactly 2 seconds as requested by user
    }
  };

  const showBottomNav = () => {
    setIsBottomNavVisible(true);
    resetBottomNavTimer();
  };

  useEffect(() => {
    if (activeTab !== 'aiTutor') {
      setIsBottomNavVisible(true);
      if (bottomNavTimerRef.current) {
        clearTimeout(bottomNavTimerRef.current);
        bottomNavTimerRef.current = null;
      }
      return;
    }

    // In AI Tutor mode: auto-hide after 2 seconds if not interacting and not in more menu
    if (isBottomNavVisible && !isBottomNavInteracting && !showMoreMenu) {
      if (bottomNavTimerRef.current) clearTimeout(bottomNavTimerRef.current);
      bottomNavTimerRef.current = setTimeout(() => {
        setIsBottomNavVisible(false);
      }, 2000);
    } else if (bottomNavTimerRef.current) {
      clearTimeout(bottomNavTimerRef.current);
    }

    return () => {
      if (bottomNavTimerRef.current) clearTimeout(bottomNavTimerRef.current);
    };
  }, [activeTab, isBottomNavVisible, isBottomNavInteracting, showMoreMenu]);

  // UI Self-Customization State (User editable UI, Lighting, AI Tutor box, Theme)
  const [uiCustomization, setUiCustomization] = useState<UiCustomization>(() => {
    try {
      const saved = localStorage.getItem('ascend_ui_customization');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_UI_CUSTOMIZATION, ...parsed };
        }
      }
    } catch (e) {
      console.error("Error loading UI customization", e);
    }
    return DEFAULT_UI_CUSTOMIZATION;
  });

  const handleUpdateCustomization = (updated: UiCustomization) => {
    setUiCustomization(updated);
    try {
      localStorage.setItem('ascend_ui_customization', JSON.stringify(updated));
    } catch (e) {
      console.error("Error saving UI customization", e);
    }
  };

  // User & Onboarding State - Sourced from localStorage
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('ascend_user_profile') || 
                    localStorage.getItem('user_profile_data') ||
                    localStorage.getItem('user_profile_user_local_student') ||
                    localStorage.getItem('user_profile_user_rohit_101');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_USER, ...parsed };
        }
      }
    } catch (e) {
      console.error("Error reading saved user profile from localStorage", e);
    }
    return DEFAULT_USER;
  });

  // --- DYNAMIC BADGES CELEBRATION STATE & EVALUATION ENGINE ---
  const [unlockedBadgeCelebration, setUnlockedBadgeCelebration] = useState<any | null>(null);

  const isUserLoggedIn = !!(
    (currentUser && !currentUser.isAnonymous) ||
    (userProfile?.email && userProfile.email.trim().length > 0 && userProfile.authProvider && userProfile.authProvider !== 'guest')
  );

  // Listen to Firebase Auth State changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthInitialized(true);
      if (user && !user.isAnonymous) {
        // Authenticated user detected
        setUserProfile(prev => {
          const updated: UserProfile = {
            ...prev,
            uid: user.uid,
            email: user.email || prev.email || '',
            name: user.displayName || prev.name || (user.email ? user.email.split('@')[0] : 'Student'),
            photoURL: user.photoURL || prev.photoURL,
            avatar: user.photoURL || prev.avatar || '🧑‍🎓',
            avatarType: user.photoURL ? 'personal' : prev.avatarType,
            authProvider: user.providerData?.[0]?.providerId?.includes('google') ? 'google' : 'password'
          };
          localStorage.setItem('ascend_user_profile', JSON.stringify(updated));
          return updated;
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to network status (online/offline)
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      showToast(
        appLanguage === 'hi' ? 'आप वापस ऑनलाइन आ गए हैं! 🎉' : 'You are back online! 🎉',
        'success'
      );
    };
    const handleOffline = () => {
      setIsOffline(true);
      showToast(
        appLanguage === 'hi' ? 'आप ऑफ़लाइन मोड में हैं। प्रगति स्थानीय रूप से सिंक की जाएगी।' : 'You are offline. Progress will sync locally.',
        'info'
      );
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [appLanguage]);

  // Real-time dynamic greeting helper based on current real-time hour (IST / Local timezone)
  const getDynamicGreeting = () => {
    try {
      const now = new Date();
      let hour = now.getHours();

      // Resolve browser/user timezone with fallback to Asia/Kolkata (IST) if running inside UTC/US cloud container
      let userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!userTz || userTz === 'UTC' || userTz.includes('America') || userTz.includes('Etc')) {
        userTz = 'Asia/Kolkata';
      }

      if (userTz) {
        const formatter = new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          hour12: false,
          timeZone: userTz
        });
        const parts = formatter.formatToParts(now);
        const hourPart = parts.find(p => p.type === 'hour');
        if (hourPart) {
          hour = parseInt(hourPart.value, 10);
        }
      }

      if (hour >= 5 && hour < 12) {
        return 'Good Morning';
      } else if (hour >= 12 && hour < 17) {
        return 'Good Afternoon';
      } else if (hour >= 17 && hour < 21) {
        return 'Good Evening';
      } else {
        return 'Good Night';
      }
    } catch (e) {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) return 'Good Morning';
      if (hour >= 12 && hour < 17) return 'Good Afternoon';
      if (hour >= 17 && hour < 21) return 'Good Evening';
      return 'Good Night';
    }
  };

  const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(false);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [realtimeGreeting, setRealtimeGreeting] = useState<string>(getDynamicGreeting);

  // Onboarding Check - Trigger if profile is not onboarded and name is missing
  useEffect(() => {
    const isDone = localStorage.getItem(`ascend_onboarded_${userProfile.uid}`) === 'true' || localStorage.getItem('ascend_onboarded') === 'true';
    if (!isDone && (!userProfile.name || !userProfile.isOnboarded)) {
      setShowOnboardingModal(true);
    }
  }, [userProfile.uid, userProfile.isOnboarded, userProfile.name]);

  // Real-time dynamic greeting interval based on new Date().getHours()
  useEffect(() => {
    const updateTimeGreeting = () => {
      setRealtimeGreeting(getDynamicGreeting());
    };

    updateTimeGreeting();
    const interval = setInterval(updateTimeGreeting, 10000); // Live ticker
    return () => clearInterval(interval);
  }, []);

  const handleSaveAvatar = (data: AvatarSelectionData) => {
    setUserProfile((prev) => {
      const newXp = (prev.xp || 0) + 20;
      const newLevel = Math.floor(newXp / 100) + 1;
      const updated: UserProfile = {
        ...prev,
        avatar: data.avatar,
        avatarType: data.avatarType,
        avatarBg: data.avatarBg || prev.avatarBg,
        xp: newXp,
        level: newLevel
      };
      localStorage.setItem('ascend_user_profile', JSON.stringify(updated));
      localStorage.setItem('user_profile_data', JSON.stringify(updated));
      localStorage.setItem(`user_profile_${prev.uid}`, JSON.stringify(updated));
      updateUserProfile(prev.uid, updated);
      return updated;
    });
    setShowAvatarModal(false);
  };

  const handleSaveProfile = (data: { 
    name: string; 
    email?: string; 
    avatar?: string;
    avatarType?: 'personal' | 'cloud' | 'emoji' | 'initials';
    avatarBg?: string;
    schoolName: string; 
    className: string; 
    targetGoal: string;
  }) => {
    setUserProfile((prev) => {
      const newXp = (prev.xp || 0) + 50;
      const newLevel = Math.floor(newXp / 100) + 1;
      const updated: UserProfile = {
        ...prev,
        name: data.name,
        email: data.email || prev.email || '',
        avatar: data.avatar || prev.avatar || '🧑‍🎓',
        avatarType: data.avatarType || prev.avatarType || 'emoji',
        avatarBg: data.avatarBg || prev.avatarBg || 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600',
        schoolName: data.schoolName,
        className: data.className,
        targetGoal: data.targetGoal,
        isOnboarded: true,
        xp: newXp,
        level: newLevel
      };
      // Persist cleanly to localStorage
      localStorage.setItem('ascend_user_profile', JSON.stringify(updated));
      localStorage.setItem('user_profile_data', JSON.stringify(updated));
      localStorage.setItem(`user_profile_${prev.uid}`, JSON.stringify(updated));
      localStorage.setItem(`ascend_onboarded_${prev.uid}`, 'true');
      localStorage.setItem('ascend_onboarded', 'true');
      updateUserProfile(prev.uid, updated);
      return updated;
    });
    setShowOnboardingModal(false);
    setIsEditingProfile(false);
  };

  // Subscribe to User Profile
  useEffect(() => {
    const unsubscribe = subscribeUserProfile(userProfile.uid, (profile) => {
      if (profile) {
        setUserProfile(prev => {
          let localSaved: Partial<UserProfile> = {};
          try {
            const saved = localStorage.getItem('ascend_user_profile') || 
                          localStorage.getItem('user_profile_data') || 
                          localStorage.getItem(`user_profile_${userProfile.uid}`);
            if (saved) localSaved = JSON.parse(saved);
          } catch (e) {}

          const isDoneLocal = localStorage.getItem(`ascend_onboarded_${userProfile.uid}`) === 'true' || localStorage.getItem('ascend_onboarded') === 'true';

          const name = localSaved.name !== undefined && localSaved.name !== '' ? localSaved.name : (profile.name || prev.name || '');
          const email = localSaved.email !== undefined && localSaved.email !== '' ? localSaved.email : (profile.email || prev.email || '');
          const avatar = localSaved.avatar !== undefined && localSaved.avatar !== '' ? localSaved.avatar : (profile.avatar || prev.avatar || '🧑‍🎓');
          const avatarType = localSaved.avatarType !== undefined ? localSaved.avatarType : (profile.avatarType || prev.avatarType || 'emoji');
          const avatarBg = localSaved.avatarBg !== undefined ? localSaved.avatarBg : (profile.avatarBg || prev.avatarBg || 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600');
          const schoolName = localSaved.schoolName !== undefined ? localSaved.schoolName : (profile.schoolName || prev.schoolName || '');
          const className = localSaved.className !== undefined ? localSaved.className : (profile.className || prev.className || '');
          const targetGoal = localSaved.targetGoal !== undefined ? localSaved.targetGoal : (profile.targetGoal || prev.targetGoal || '');
          const onboardedState = isDoneLocal || localSaved.isOnboarded || profile.isOnboarded || prev.isOnboarded || false;

          return {
            ...DEFAULT_USER,
            ...profile,
            ...prev,
            ...localSaved,
            name,
            email,
            avatar,
            avatarType,
            avatarBg,
            schoolName,
            className,
            targetGoal,
            isOnboarded: onboardedState
          };
        });
        if (profile.language) setAppLanguage(profile.language);
      }
    });
    return () => unsubscribe();
  }, [userProfile.uid]);

  // Language translation helper
  const t = (key: keyof typeof TRANSLATIONS) => {
    return TRANSLATIONS[key]?.[appLanguage] || TRANSLATIONS[key]?.en || key;
  };


  // Helper to add XP and update level / pet level
  const addXp = (amount: number) => {
    setUserProfile((prev) => {
      const newXp = Math.max(0, (prev.xp || 0) + amount);
      const newLevel = Math.floor(newXp / 100) + 1;
      const updated: UserProfile = {
        ...prev,
        xp: newXp,
        level: newLevel
      };
      localStorage.setItem('ascend_user_profile', JSON.stringify(updated));
      localStorage.setItem('user_profile_data', JSON.stringify(updated));
      localStorage.setItem(`user_profile_${prev.uid}`, JSON.stringify(updated));
      updateUserProfile(prev.uid, { xp: newXp, level: newLevel });
      
      // Safe delayed trigger to let state finalize
      setTimeout(() => {
        runBadgeEvaluation(updated);
      }, 150);

      return updated;
    });
  };

  // --- STREAK & GOALS STATE ---
  const [streakCompletedDays, setStreakCompletedDays] = useState<boolean[]>([false, false, false, false, false]);
  const [day1GoalCompleted, setDay1GoalCompleted] = useState(false);

  // --- CHIMPU SANCTUARY (PET) STATE DECLARATION ---
  const [petHappiness, setPetHappiness] = useState(85);
  const [petEnergy, setPetEnergy] = useState(80);

  // --- REAL AUTO-MESSAGING & OS NOTIFICATION SYSTEM ---
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        sendRealNotification('Remix Study Buddy 🔔', 'Awesome! System notifications are now active. Task completions and Chimpu alerts will show up here.');
      }
    }
  };

  const sendRealNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: body,
          icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        });
      } catch (err) {
        console.warn('Native push notification error:', err);
      }
    }
    try {
      playUiSound();
    } catch (e) {}
  };

  // Background Auto-Messaging Check
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      setTimeout(() => {
        requestNotificationPermission();
      }, 5000);
    }

    const notificationInterval = setInterval(() => {
      // Check 1: If Day 1 Goal is not completed
      if (!day1GoalCompleted) {
        sendRealNotification(
          'Tutor Task Reminder! ✍️',
          'Hey! Your daily study task is pending: "Ask AI Tutor a homework question". Finish it to claim +20 XP!'
        );
      }

      // Check 2: If Chimpu (pet) is hungry
      if (petHappiness < 50 || petEnergy < 50) {
        sendRealNotification(
          `${userProfile.petName || 'Chimpu'} is hungry! 🐼`,
          `Chimpu is waiting for you! Happiness is ${petHappiness}% and energy is ${petEnergy}%. Please feed him bamboo.`
        );
      }
    }, 45000); // Trigger a check every 45 seconds for a lively and responsive user experience

    return () => clearInterval(notificationInterval);
  }, [day1GoalCompleted, petHappiness, petEnergy, userProfile.petName]);

  const handleCompleteDayGoal = () => {
    if (!day1GoalCompleted) {
      setDay1GoalCompleted(true);
      setStreakCompletedDays([true, false, false, false, false]);
      addXp(20);
      sendRealNotification('Goal Completed! 🎉', 'Amazing! You finished your Day 1 target and earned +20 XP!');
    }
  };

  const handleToggleDay = (idx: number) => {
    const updated = [...streakCompletedDays];
    const originalState = updated[idx];
    updated[idx] = !originalState;
    setStreakCompletedDays(updated);
    
    const countCompleted = updated.filter(Boolean).length;
    setUserProfile(prev => ({
      ...prev,
      streak: countCompleted
    }));
    
    if (idx === 0) {
      setDay1GoalCompleted(!originalState);
    }
    
    if (!originalState) {
      addXp(15);
      sendRealNotification('Streak Updated! 🔥', `Day ${idx + 1} marked completed! Keep the momentum! +15 XP`);
    } else {
      addXp(-15);
    }
  };

  // --- DAILY QUESTS STATE ---
  const [quests, setQuests] = useState([
    { id: 1, title: 'Ask AI Tutor a homework question', xp: 15, completed: false },
    { id: 2, title: 'Score 7+ in any Practice Quiz', xp: 25, completed: false },
    { id: 3, title: 'Complete 25-min Study Session', xp: 30, completed: false }
  ]);

  const handleCompleteQuest = (id: number) => {
    setQuests(prev => prev.map(q => {
      if (q.id === id && !q.completed) {
        addXp(q.xp);
        sendRealNotification('Quest Completed! 🏆', `Fantastic! You completed: "${q.title}" and claimed +${q.xp} XP!`);
        return { ...q, completed: true };
      }
      return q;
    }));
  };

  // --- FOCUS SESSION TIMER STATE ---
  const [selectedSubject, setSelectedSubject] = useState<Subject>('Mathematics');
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [timerSeconds, setTimerSeconds] = useState<number>(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    setTimerSeconds(durationMinutes * 60);
  }, [durationMinutes]);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      
      // Increment completed sessions count
      const curCount = parseInt(localStorage.getItem('ascend_pomodoro_completed_count') || '0', 10);
      localStorage.setItem('ascend_pomodoro_completed_count', (curCount + 1).toString());
      
      addXp(50);
      alert('Focus Study Session Complete! Great job! +50 XP Earned!');
      
      setTimeout(() => {
        runBadgeEvaluation();
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(durationMinutes * 60);
  };

  const formatTimerTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- PEERS & WAVE STATE ---
  const [classmates, setClassmates] = useState([
    { id: 1, name: 'Alice Johnson', avatar: '🦄', focus: 'Biology', online: true, waved: false },
    { id: 2, name: 'Bob Smith', avatar: '🦊', focus: 'Mathematics', online: true, waved: false },
    { id: 3, name: 'Sarah Connor', avatar: '🦉', focus: 'Physics', online: false, waved: false }
  ]);

  const handleWaveBack = (id: number) => {
    setClassmates(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, waved: true };
      }
      return c;
    }));
    addXp(5);
  };

  // --- CHIMPU SANCTUARY (PET) STATE ---
  const [equippedAccessory, setEquippedAccessory] = useState<string | null>(null);

  const feedBamboo = () => {
    if (userProfile.xp >= 15) {
      addXp(-15);
      setPetHappiness(prev => Math.min(100, prev + 15));
      setPetEnergy(prev => Math.min(100, prev + 10));
      sendRealNotification(`${userProfile.petName || 'Chimpu'} Fed! 🐼🌿`, 'Yum! Chimpu enjoyed the Bamboo. Happiness and Energy increased!');
    } else {
      alert('You need at least 15 XP to buy Bamboo feed!');
    }
  };

  const buyAccessory = (item: { name: string; cost: number; icon: string }) => {
    if (userProfile.xp >= item.cost) {
      addXp(-item.cost);
      setEquippedAccessory(item.icon);
      sendRealNotification('Accessory Equipped! 👒✨', `Nice choice! Equipped ${item.name} for ${userProfile.petName || 'Chimpu'}.`);
    } else {
      alert(`You need ${item.cost} XP to buy ${item.name}!`);
    }
  };

  // --- STUDY ROOMS STATE ---
  const [selectedRoomId, setSelectedRoomId] = useState<string>('room_science');
  const [roomMessages, setRoomMessages] = useState<RoomChatMessage[]>([]);
  const [chatInputText, setChatInputText] = useState('');

  const roomsList = [
    { id: 'room_science', name: 'Science Wizards 🧪', desc: 'Discuss Physics, Chemistry & Biology topics' },
    { id: 'room_math', name: 'Calculus & Algebra Squad 📐', desc: 'Step-by-step problem solving & formulas' },
    { id: 'room_general', name: 'General Study Lounge ☕', desc: 'Casual study sessions & Pomodoro groups' }
  ];

  useEffect(() => {
    if (activeTab !== 'groupChat') return;
    const unsubscribe = subscribeToChats(selectedRoomId, (msgs) => {
      setRoomMessages(msgs);
    });
    return () => unsubscribe();
  }, [selectedRoomId, activeTab]);

  const handleSendRoomMessage = async () => {
    if (!chatInputText.trim()) return;
    const textToSend = chatInputText;
    setChatInputText('');
    await sendGroupMessage(selectedRoomId, textToSend, userProfile.uid, userProfile.name);
    addXp(10);
  };

  // --- WHITEBOARD STATE ---
  const [whiteboardElements, setWhiteboardElements] = useState<WhiteboardElement[]>([]);
  const [drawColor, setDrawColor] = useState<string>('#6366f1');
  const [drawThickness] = useState<number>(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (activeTab !== 'whiteboard') return;
    const unsubscribe = subscribeToWhiteboard('global_board', (elements) => {
      setWhiteboardElements(elements);
    });
    return () => unsubscribe();
  }, [activeTab]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    whiteboardElements.forEach((el) => {
      try {
        const points = JSON.parse(el.points || '[]');
        if (points.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = el.color || '#6366f1';
        ctx.lineWidth = el.thickness || 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
      } catch (err) {
        console.error('Error drawing element:', err);
      }
    });
  }, [whiteboardElements]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawing(true);
    setCurrentPoints([{ x, y }]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentPoints((prev) => [...prev, { x, y }]);

    const ctx = canvas.getContext('2d');
    if (ctx && currentPoints.length > 0) {
      const lastPoint = currentPoints[currentPoints.length - 1];
      ctx.beginPath();
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = drawThickness;
      ctx.lineCap = 'round';
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleMouseUp = async () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPoints.length > 1) {
      const newEl: Omit<WhiteboardElement, 'id'> = {
        roomId: 'global_board',
        type: 'path',
        color: drawColor,
        thickness: drawThickness,
        points: JSON.stringify(currentPoints),
        senderId: userProfile.uid,
        timestamp: new Date().toISOString()
      };
      await addWhiteboardElement('global_board', newEl);
      addXp(5);
    }
    setCurrentPoints([]);
  };

  const handleClearCanvas = async () => {
    await clearWhiteboardRoom('global_board');
  };

  // --- MOCK EXAMS STATE ---
  const [mockExams, setMockExams] = useState<MockExam[]>(() => {
    try {
      const local = localStorage.getItem(`local_exams_${userProfile.uid}`) || localStorage.getItem('local_exams_user_local_student');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!['mockExam', 'quiz', 'toolkit'].includes(activeTab)) return;
    const unsubscribe = subscribeToMockExams(userProfile.uid, (exams) => {
      setMockExams(exams);
    });
    return () => unsubscribe();
  }, [userProfile.uid, activeTab]);

  // --- STUDY DOCS STATE ---
  const [studyDocs, setStudyDocs] = useState<StudyDocument[]>(() => {
    try {
      const local = localStorage.getItem(`local_docs_${userProfile.uid}`) || localStorage.getItem('local_docs_user_local_student');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });

  const runBadgeEvaluation = (profileObj?: UserProfile) => {
    const currentProfile = profileObj || userProfile;
    if (!currentProfile) return;

    const pomoCountStr = localStorage.getItem('ascend_pomodoro_completed_count') || '0';
    const pomoCount = parseInt(pomoCountStr, 10);
    const docsCount = studyDocs.length;
    const examsCount = mockExams.filter(e => e.completed).length;

    let celebrated: string[] = [];
    try {
      const saved = localStorage.getItem('ascend_celebrated_badges');
      if (saved) {
        celebrated = JSON.parse(saved);
      }
    } catch (e) {
      console.error("Error parsing celebrated badges", e);
    }

    for (const badge of BADGES_CONFIG) {
      if (!celebrated.includes(badge.id)) {
        const actual = badge.getActual(currentProfile, docsCount, examsCount, pomoCount);
        if (actual >= badge.target) {
          // Add to celebrated immediately to lock it
          celebrated.push(badge.id);
          localStorage.setItem('ascend_celebrated_badges', JSON.stringify(celebrated));
          
          // Trigger celebration modal popup
          setUnlockedBadgeCelebration(badge);

          // Add award points with a silent booster to avoid re-triggering loop
          setUserProfile((prev) => {
            const finalXp = (prev.xp || 0) + 100;
            const finalLevel = Math.floor(finalXp / 100) + 1;
            const finalProfile: UserProfile = { ...prev, xp: finalXp, level: finalLevel };
            localStorage.setItem('ascend_user_profile', JSON.stringify(finalProfile));
            localStorage.setItem('user_profile_data', JSON.stringify(finalProfile));
            updateUserProfile(prev.uid, { xp: finalXp, level: finalLevel });
            return finalProfile;
          });
          break; // celebrate one badge at a time
        }
      }
    }
  };

  // Automatically evaluate badges after sync settles or state counts change
  useEffect(() => {
    const timer = setTimeout(() => {
      runBadgeEvaluation();
    }, 1200);
    return () => clearTimeout(timer);
  }, [studyDocs.length, mockExams.length, userProfile.petLevel, userProfile.streak]);

  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const [editingDocId, setEditingDocId] = useState<string | null>(null);

  useEffect(() => {
    if (!['studyDocs', 'notebook', 'toolkit'].includes(activeTab)) return;
    const unsubscribe = subscribeToStudyDocuments(userProfile.uid, (docs) => {
      setStudyDocs(docs);
    });
    return () => unsubscribe();
  }, [userProfile.uid, activeTab]);

  const handleSaveDoc = async () => {
    if (!newDocTitle.trim()) return;
    const docId = editingDocId || 'doc_' + Date.now();
    const docData: StudyDocument = {
      id: docId,
      ownerId: userProfile.uid,
      title: newDocTitle,
      content: newDocContent,
      summary: newDocContent.slice(0, 150) + '...',
      tagsJson: JSON.stringify(['StudyNote']),
      isShared: false,
      timestamp: new Date().toISOString()
    };
    await saveStudyDocument(docData);
    setIsAddingDoc(false);
    setEditingDocId(null);
    setNewDocTitle('');
    setNewDocContent('');
    addXp(15);
  };

  const handleDeleteDoc = async (id: string) => {
    await deleteStudyDocument(userProfile.uid, id);
  };

  // Open specific tool in Toolkit
  const openToolkitWithTool = (toolName?: string) => {
    playUiSound(uiCustomization.audioFeedback);
    setInitialTool(toolName);
    setActiveTab('toolkit');
  };

  // Helper for font family class based on user customization
  const getAppFontClass = () => {
    switch (uiCustomization.fontFamilyStyle) {
      case 'serif': return 'font-serif';
      case 'mono': return 'font-mono';
      case 'rounded': return 'font-[Outfit,ui-sans-serif,system-ui,sans-serif] tracking-wide';
      default: return 'font-[Plus_Jakarta_Sans,ui-sans-serif,system-ui,sans-serif]';
    }
  };



  // Helper for card corner radius (4 modes)
  const getCardRadiusClasses = () => {
    switch (uiCustomization.cardBorderRadius) {
      case 'pill':
        return {
          casing: 'rounded-[38px]',
          inner: 'rounded-[36px]',
          tile: 'rounded-3xl',
          badge: 'rounded-2xl'
        };
      case 'sharp':
        return {
          casing: 'rounded-xl',
          inner: 'rounded-lg',
          tile: 'rounded-md',
          badge: 'rounded-md'
        };
      case 'hexagon':
        return {
          casing: 'rounded-2xl border-dashed',
          inner: 'rounded-xl border-dashed',
          tile: 'rounded-xl border-dashed',
          badge: 'rounded-xl'
        };
      case 'curved':
      default:
        return {
          casing: 'rounded-[28px]',
          inner: 'rounded-[26px]',
          tile: 'rounded-2xl sm:rounded-3xl',
          badge: 'rounded-xl'
        };
    }
  };

  const cornerRadius = getCardRadiusClasses();

  return (
    <div id="main-app-container" className={`min-h-screen text-slate-100 ${getAppFontClass()} flex flex-col selection:bg-emerald-500 selection:text-white w-full max-w-full overflow-x-hidden relative bg-[#0d1117]`}>
      {/* DYNAMIC LIVE CUSTOM CSS INJECTED BY AI COPILOT */}
      <style id="ai-editor-live-styles">{uiCustomization.customCss || ''}</style>
      
      {/* FULL-PAGE LIVE WALLPAPER AMBIANCE (4 MODES) WITH DIRECT DOM ID TARGETING */}
      {uiCustomization.wallpaperAmbiance === 'cosmic_nebula' ? (
        <div 
          id="app-wallpaper-layer"
          className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-fixed bg-no-repeat opacity-95 transition-all duration-500"
          style={{ 
            background: 'radial-gradient(ellipse at 50% 0%, #1e1b4b 0%, #030712 60%, #000000 100%)' 
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
        </div>
      ) : uiCustomization.wallpaperAmbiance === 'cyber_matrix' ? (
        <div 
          id="app-wallpaper-layer"
          className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-fixed bg-no-repeat opacity-95 transition-all duration-500"
          style={{ 
            background: 'radial-gradient(ellipse at top, #022c22 0%, #020617 80%)' 
          }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ffcc0a_1px,transparent_1px),linear-gradient(to_bottom,#00ffcc0a_1px,transparent_1px)] [background-size:28px_28px] opacity-70" />
        </div>
      ) : uiCustomization.wallpaperAmbiance === 'deep_obsidian' ? (
        <div id="app-wallpaper-layer" className="fixed inset-0 pointer-events-none z-0 bg-[#030712] transition-all duration-500" />
      ) : (
        /* science_chalkboard (default) */
        <div 
          id="app-wallpaper-layer"
          className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-fixed bg-no-repeat opacity-95 transition-all duration-500"
          style={{ backgroundImage: `url('/science_bg.jpg')` }}
        />
      )}
      {/* AMBIENT CHALKBOARD VIGNETTE OVERLAY */}
      <div id="app-vignette-layer" className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-black/60 via-black/35 to-black/75 backdrop-brightness-95 transition-all duration-500" />

      {/* 100+ REALTIME MOVING LIVING OBJECTS & HUMAN CHARACTERS (SATELLITES, ROCKETS, WAVING ASTRONAUTS, CYBORGS, ATOMS) */}
      <RealtimeMovingUniverse theme={uiCustomization.wallpaperAmbiance} interactive={true} />

      {/* DYNAMIC OFFLINE INDICATOR PILL */}
      {isOffline && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-3.5 py-1.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-extrabold rounded-full shadow-2xl backdrop-blur-md flex items-center space-x-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
          <span>{appLanguage === 'hi' ? 'ऑफ़लाइन मोड (प्रगति स्थानीय रूप से सुरक्षित है)' : 'Offline Mode (Local Sync Mode)'}</span>
        </div>
      )}

      {/* STANDALONE DEDICATED FULL AI TUTOR APP INTERFACE - MOUNTED AT ROOT TO PREVENT TRANSFORM/CONTAINING-BLOCK CLIPPING */}
      {activeTab === 'aiTutor' ? (
        <AiTutorApp
          user={userProfile}
          onBack={() => setActiveTab('home')}
          onAddNote={async (note) => {
            await saveStudyDocument({
              id: 'doc_' + Date.now(),
              ownerId: userProfile.uid,
              title: note.title,
              content: note.content,
              summary: note.content.slice(0, 150) + '...',
              tagsJson: JSON.stringify([note.subject]),
              isShared: false,
              timestamp: new Date().toISOString()
            });
          }}
          onAddXp={addXp}
          attachedWorkspaceFiles={attachedWorkspaceFiles}
          onRemoveAttachedWorkspaceFile={(id) => {
            setAttachedWorkspaceFiles(prev => prev.filter(f => f.id !== id));
          }}
          globalAppLanguage={appLanguage}
          onLanguageChange={(lang: any) => {
            setAppLanguage(lang);
            updateUserProfile(userProfile.uid, { language: lang });
          }}
          isBottomNavVisible={isBottomNavVisible}
          onShowBottomNav={showBottomNav}
        />
      ) : (
      /* MAIN CONTENT AREA - WITH pb-24 TO AVOID BOTTOM NAV OVERLAP */
      <main className={`relative z-10 flex-1 p-3 sm:p-4 md:p-5 mx-auto w-full pb-24 overflow-x-hidden transition-all duration-300 ${activeTab === 'studyDocs' ? 'max-w-7xl' : 'max-w-xl space-y-4'}`}>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="w-full space-y-4"
          >
        {/* DASHBOARD TAB */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            
            {/* 1. TOP USER CARD - REFINED MODERN AMBIENT PROFILE */}
            <div id="top-user-card" className={`relative p-[1.5px] ${cornerRadius.casing || 'rounded-3xl'} bg-gradient-to-b from-indigo-500/30 via-slate-800/40 to-slate-800/20 border border-slate-800/60 shadow-lg transition-all duration-300`}>
              {/* INNER DARK SLATE BACKDROP */}
              <div className="relative overflow-hidden rounded-[23px] bg-slate-950/90 backdrop-blur-xl px-4 pt-3.5 pb-4 sm:px-5 sm:pt-4 sm:pb-5 space-y-3.5">
                {/* Subtle Ambient Glows */}
                <div className="absolute -top-16 -left-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Main Student Profile & Avatar Section - Positioned right at the top with integrated Theme Toggle & Settings */}
                <div className="flex items-start justify-between gap-3 relative z-10">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div>
                      <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight flex items-baseline flex-wrap gap-x-1.5 gap-y-0.5">
                        <span className="text-slate-300 font-extrabold text-base sm:text-lg">
                          {realtimeGreeting || getDynamicGreeting()},
                        </span>
                        <span className="text-white truncate max-w-[170px] xs:max-w-[220px] sm:max-w-xs">
                          {userProfile.name?.trim() ? userProfile.name : 'Guest'}
                        </span>
                        <span className="text-base sm:text-lg shrink-0">✨</span>
                      </h2>
                    </div>

                    {/* Class & School Details Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {/* Class Badge */}
                      <span className="px-2.5 py-0.5 bg-indigo-950/60 text-indigo-300 text-xs font-semibold rounded-full border border-indigo-500/40 flex items-center space-x-1.5 shrink-0 shadow-xs">
                        <GraduationCap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{userProfile.className ? (userProfile.className.startsWith('Class') ? userProfile.className : `Class ${userProfile.className}`) : 'Class 12th (Science/PCM)'}</span>
                      </span>

                      {/* School / College Pill Badge */}
                      <span className="px-2.5 py-0.5 bg-slate-900/80 text-slate-300 text-xs font-medium rounded-full border border-slate-700/70 hover:border-slate-600 flex items-center space-x-1.5 shrink-0 shadow-xs max-w-full">
                        <UserIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="whitespace-nowrap">{userProfile.schoolName || 'School / College Not Set'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Top-Right: Integrated Controls (Theme Toggle & Settings Side-by-Side) alongside Avatar */}
                  <div className="shrink-0 flex items-center space-x-2.5 ml-2">
                    {/* Horizontal Controls Row: Theme Toggle & Settings Side-by-Side */}
                    <div className="flex items-center space-x-1.5">
                      {/* Global Dark Mode Switch */}
                      <div className="flex items-center px-1.5 py-1 rounded-xl bg-slate-900/90 border border-slate-700/60 shadow-xs" title="Late-Night Dark Mode">
                        <ThemeToggle variant="compact-switch" />
                      </div>

                      {/* Self Customize Settings Gear Button */}
                      <motion.button
                        whileHover={{ rotate: 15, scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowCustomizeModal(true)}
                        className="p-2 text-slate-300 hover:text-white bg-slate-900/90 border border-slate-700/60 rounded-xl transition cursor-pointer hover:border-slate-500 flex items-center justify-center shadow-xs"
                        title="Self Customize UI / Settings"
                      >
                        <Settings2 className="w-3.5 h-3.5 text-indigo-300" />
                      </motion.button>
                    </div>

                    {/* Avatar Neatly Aligned with Clean Change Trigger */}
                    <div className="flex flex-col items-center">
                      <div 
                        onClick={() => setShowAvatarModal(true)}
                        className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-slate-900 p-0.5 ring-2 ring-indigo-500/40 hover:ring-indigo-400 shadow-md flex items-center justify-center relative cursor-pointer group active:scale-95 transition-all"
                        title="Change Avatar"
                      >
                        <UserAvatar
                          avatar={userProfile.avatar}
                          name={userProfile.name || 'Student'}
                          avatarType={userProfile.avatarType}
                          avatarBg={userProfile.avatarBg}
                          size="lg"
                          className="w-full h-full flex items-center justify-center rounded-[14px]"
                        />
                        {/* Clean Edit Trigger Button */}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 hover:bg-indigo-500 border-2 border-slate-950 flex items-center justify-center text-white shadow-xs group-hover:scale-110 transition-transform">
                          <Edit3 className="w-2.5 h-2.5 text-white" />
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowAvatarModal(true)}
                        className="text-[10px] font-bold text-slate-400 hover:text-indigo-300 text-center mt-1 cursor-pointer transition-colors"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                </div>

                {/* STAT BOXES - 3-Column Softened, Unified Accent Stat Cards */}
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5 pt-1 relative z-10">
                  {/* BOX 1: STREAK */}
                  <div className="bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-amber-500/40 rounded-xl py-2.5 px-2 text-center relative overflow-hidden transition-all duration-200 shadow-xs">
                    <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center justify-center space-x-1">
                      <span className="text-xs">🔥</span>
                      <span>Streak</span>
                    </div>
                    <div className="text-base sm:text-lg font-black text-white mt-0.5 leading-tight">
                      {userProfile.streak || 5} <span className="text-[10px] font-normal text-slate-400">days</span>
                    </div>
                  </div>

                  {/* BOX 2: LEVEL */}
                  <div className="bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-indigo-500/40 rounded-xl py-2.5 px-2 text-center relative overflow-hidden transition-all duration-200 shadow-xs">
                    <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider flex items-center justify-center space-x-1">
                      <span className="text-xs">📓</span>
                      <span>Level</span>
                    </div>
                    <div className="text-base sm:text-lg font-black text-white mt-0.5 leading-tight">
                      Lvl {userProfile.level || 1}
                    </div>
                  </div>

                  {/* BOX 3: TOTAL XP */}
                  <div className="bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-indigo-500/40 rounded-xl py-2.5 px-2 text-center relative overflow-hidden transition-all duration-200 shadow-xs">
                    <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider flex items-center justify-center space-x-1">
                      <span className="text-xs">⭐</span>
                      <span>Total XP</span>
                    </div>
                    <div className="text-base sm:text-lg font-black text-white mt-0.5 leading-tight">
                      {userProfile.xp || 100} <span className="text-[10px] font-normal text-slate-400">XP</span>
                    </div>
                  </div>
                </div>

                {/* Level & XP Progress Section */}
                <div className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-3 sm:p-3.5 space-y-2.5 relative z-10 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-300 text-[11px] sm:text-xs font-medium">Level {userProfile.level || 1} Progress:</span>
                      <span className="text-white text-[11px] sm:text-xs font-bold">
                        {userProfile.xp ? (userProfile.xp % 100) : 0} <span className="text-slate-500 font-normal">/</span> 100 <span className="text-slate-400 font-normal">XP</span>
                      </span>
                    </div>
                    <button 
                      onClick={() => addXp(10)}
                      className="text-xs text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center space-x-1.5 cursor-pointer font-bold transition px-2.5 py-1 rounded-lg shadow-xs active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>+10 XP Booster</span>
                    </button>
                  </div>
                  {/* Sleek modern progress bar track */}
                  <div className="w-full h-2 bg-slate-950 border border-slate-800/90 rounded-full relative overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(6, userProfile.xp ? (userProfile.xp % 100) : 15)}%` }}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* CLOUD AUTH & SYNC BANNER - SLIMMER & CLEAN */}
            {!isUserLoggedIn && (
              <div className="bg-slate-900/80 border border-indigo-500/30 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-white flex items-center justify-between gap-3 shadow-xs backdrop-blur-md">
                <div className="space-y-0.5 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-bold flex items-center gap-1.5 text-white">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{appLanguage === 'hi' ? 'क्लाउड सिंक और +150 XP बोनस' : 'Sync Progress & Get +150 XP Bonus'}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {appLanguage === 'hi' 
                      ? 'गूगल या ईमेल से साइन इन करें ताकि आपके सभी नोट्स और क्विज़ सुरक्षित रहें।'
                      : 'Sign in with Google or Email to backup your progress across all devices.'}
                  </p>
                </div>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-3 py-1.5 sm:px-3.5 sm:py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition cursor-pointer shrink-0 shadow-xs active:scale-95 flex items-center space-x-1.5 whitespace-nowrap"
                >
                  <LogIn className="w-3.5 h-3.5 text-white" />
                  <span>{appLanguage === 'hi' ? 'साइन इन' : 'Sign In'}</span>
                </button>
              </div>
            )}

            {/* HIGH-POWER QUICK ACTION DUO: VOICE TUTOR & PDF/BOOK SCANNER */}
            <div id="quick-actions-section" className="grid grid-cols-2 gap-3 sm:gap-3.5">
              {/* 1. VOICE TUTOR LAUNCHER (NEON PINK BORDER) */}
              <motion.button
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  playUiSound(uiCustomization.audioFeedback);
                  setShowVoiceTutorModal(true);
                }}
                className="p-3.5 sm:p-4 rounded-2xl border-2 border-pink-500/90 hover:border-pink-400 shadow-[0_0_18px_rgba(236,72,153,0.35)] bg-slate-950/85 hover:bg-slate-950 text-white text-left relative overflow-hidden flex flex-col justify-between group cursor-pointer transition-all duration-200 min-h-[104px] sm:min-h-[114px]"
              >
                {/* Sleek Micro-Pill Badge in Top-Right Corner */}
                <div className="absolute top-2.5 right-2.5 z-10">
                  <span className="text-[7px] font-black tracking-widest uppercase bg-pink-950/90 text-pink-300 px-1.5 py-0.5 rounded-full border border-pink-500/40 shadow-xs">
                    VOICE
                  </span>
                </div>

                <div className="relative z-10 mb-2 sm:mb-2.5">
                  <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-pink-950/80 border border-pink-500/60 flex items-center justify-center text-pink-400 shrink-0 shadow-[0_0_12px_rgba(236,72,153,0.3)]">
                    <Mic className="w-4 h-4 text-pink-400" />
                  </div>
                </div>

                <div className="relative z-10 space-y-0.5">
                  <h4 className="font-bold text-xs sm:text-sm text-white flex items-center gap-1">
                    <span className="truncate">{appLanguage === 'hi' ? 'वॉयस ट्यूटर' : 'Voice Tutor'}</span>
                    <span className="text-pink-400 shrink-0 text-xs sm:text-sm">🎙️</span>
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium leading-tight truncate">
                    {appLanguage === 'hi' ? 'बोलकर तुरंत पूछें व सुनें' : 'Live Voice Q&A Tutor'}
                  </p>
                </div>
              </motion.button>

              {/* 2. PDF & BOOK SCANNER LAUNCHER (NEON PURPLE BORDER) */}
              <motion.button
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  playUiSound(uiCustomization.audioFeedback);
                  setActiveTab('pdfScanner');
                }}
                className="p-3.5 sm:p-4 rounded-2xl border-2 border-purple-500/90 hover:border-purple-400 shadow-[0_0_18px_rgba(168,85,247,0.35)] bg-slate-950/85 hover:bg-slate-950 text-white text-left relative overflow-hidden flex flex-col justify-between group cursor-pointer transition-all duration-200 min-h-[104px] sm:min-h-[114px]"
              >
                {/* Sleek Micro-Pill Badge in Top-Right Corner */}
                <div className="absolute top-2.5 right-2.5 z-10">
                  <span className="text-[7px] font-black tracking-widest uppercase bg-purple-950/90 text-purple-300 px-1.5 py-0.5 rounded-full border border-purple-500/40 shadow-xs">
                    SCANNER
                  </span>
                </div>

                <div className="relative z-10 mb-2 sm:mb-2.5">
                  <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-purple-950/80 border border-purple-500/60 flex items-center justify-center text-purple-400 shrink-0 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
                    <FileText className="w-4 h-4 text-purple-400" />
                  </div>
                </div>

                <div className="relative z-10 space-y-0.5">
                  <h4 className="font-bold text-xs sm:text-sm text-white flex items-center gap-1">
                    <span className="truncate">{appLanguage === 'hi' ? 'PDF स्कैनर' : 'PDF Scanner'}</span>
                    <span className="text-purple-400 shrink-0 text-xs sm:text-sm">📑</span>
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium leading-tight truncate">
                    {appLanguage === 'hi' ? 'किताबें सारांश व क्विज़' : 'Summary, Flashcards & Quiz'}
                  </p>
                </div>
              </motion.button>
            </div>

            {/* 2. ACADEMY PLAYGROUND - WITH LISTED VIEW AS DEFAULT & VIEW SWITCHER */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-slate-200 text-xs tracking-wider uppercase flex items-center space-x-2 shrink-0">
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>ACADEMY PLAYGROUND</span>
                </h3>

                <div className="flex items-center space-x-2 shrink-0">
                  {/* View Mode Switcher: Listed View vs Grid View */}
                  <div className="flex items-center bg-slate-950/60 border border-slate-800/80 p-0.5 rounded-lg">
                    <button
                      onClick={() => {
                        playUiSound(uiCustomization.audioFeedback);
                        setPlaygroundViewMode('list');
                      }}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center space-x-1 transition cursor-pointer ${
                        playgroundViewMode === 'list' 
                          ? 'bg-slate-800 text-white shadow-xs' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Listed View / लिस्ट व्यू"
                    >
                      <List className="w-3 h-3" />
                      <span>{appLanguage === 'hi' ? 'लिस्ट' : 'List'}</span>
                    </button>
                    <button
                      onClick={() => {
                        playUiSound(uiCustomization.audioFeedback);
                        setPlaygroundViewMode('grid');
                      }}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center space-x-1 transition cursor-pointer ${
                        playgroundViewMode === 'grid' 
                          ? 'bg-slate-800 text-white shadow-xs' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Grid View / ग्रिड व्यू"
                    >
                      <LayoutGrid className="w-3 h-3" />
                      <span>{appLanguage === 'hi' ? 'ग्रिड' : 'Grid'}</span>
                    </button>
                  </div>

                  {/* Self Customize Gear Button */}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      playUiSound(uiCustomization.audioFeedback);
                      setShowCustomizeModal(true);
                    }}
                    className="p-1 px-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-[10.5px] font-bold tracking-wider uppercase flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
                    title="Self Customize UI / खुद डिज़ाइन करें"
                  >
                    <Settings2 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden xs:inline">{appLanguage === 'hi' ? 'कस्टमाइज़' : 'Customize'}</span>
                  </motion.button>
                </div>
              </div>

              {/* LISTED VIEW (DEFAULT) */}
              {playgroundViewMode === 'list' ? (
                <div className="space-y-2.5 sm:space-y-3">
                  {/* LIST ITEM 1: AI TUTOR - 4 CONFIGURABLE STYLES IN LIST FORMAT */}
                  {uiCustomization.aiTutorCardStyle === 'retro_arcade' ? (
                    /* Retro Arcade List Item */
                    <motion.button
                      whileHover={{ x: 3, scale: 1.006 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        playUiSound(uiCustomization.audioFeedback);
                        setActiveTab('aiTutor');
                      }}
                      className="w-full p-3 sm:p-3.5 rounded-2xl border-2 border-emerald-400/90 hover:border-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.25)] bg-gradient-to-r from-slate-950 via-[#031d0c] to-[#011408] text-emerald-300 text-left relative overflow-hidden flex items-center justify-between group cursor-pointer transition-all duration-300 font-mono"
                    >
                      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:8px_8px]" />
                      <div className="flex items-center space-x-3 sm:space-x-3.5 relative z-10 min-w-0 flex-1">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-950/90 border border-emerald-500/50 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform shrink-0 shadow-inner">
                          <Terminal className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-black text-sm sm:text-base text-emerald-200 flex items-center gap-1.5 truncate">
                              <span>AI Tutor [v1.0]</span>
                              <span className="text-emerald-400">👾</span>
                            </h4>
                            <span className="text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-wider bg-emerald-950/90 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 shrink-0">
                              8-BIT RETRO
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-[11.5px] text-emerald-400/80 font-medium mt-0.5 truncate">
                            CRT Terminal • 24/7 Step-by-Step Problem Solver
                          </p>
                        </div>
                      </div>
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 group-hover:translate-x-1 transition-all shrink-0 ml-2 shadow-xs">
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                    </motion.button>
                  ) : uiCustomization.aiTutorCardStyle === 'parchment_desk' ? (
                    /* Parchment Scholar List Item */
                    <motion.button
                      whileHover={{ x: 3, scale: 1.006 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        playUiSound(uiCustomization.audioFeedback);
                        setActiveTab('aiTutor');
                      }}
                      className="w-full p-3 sm:p-3.5 rounded-2xl border-2 border-amber-500/90 hover:border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.22)] bg-gradient-to-r from-[#2b1e15] via-[#3a281c] to-[#1f150e] text-amber-100 text-left relative overflow-hidden flex items-center justify-between group cursor-pointer transition-all duration-300 font-serif"
                    >
                      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:12px_12px]" />
                      <div className="flex items-center space-x-3 sm:space-x-3.5 relative z-10 min-w-0 flex-1">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-950/90 border border-amber-500/50 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform shrink-0 shadow-inner">
                          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-black text-sm sm:text-base text-amber-100 flex items-center gap-1.5 truncate">
                              <span>AI Tutor</span>
                              <span className="text-amber-400">📜</span>
                            </h4>
                            <span className="text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-wider bg-amber-950/90 text-amber-200 px-2 py-0.5 rounded-full border border-amber-500/40 shrink-0">
                              ROYAL DESK
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-[11.5px] text-amber-200/80 font-medium mt-0.5 truncate font-sans">
                            Royal Library • Conceptual Guidance & Solutions
                          </p>
                        </div>
                      </div>
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 group-hover:translate-x-1 transition-all shrink-0 ml-2 shadow-xs font-sans">
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                    </motion.button>
                  ) : uiCustomization.aiTutorCardStyle === 'bento_minimal' ? (
                    /* Bento Minimalist List Item */
                    <motion.button
                      whileHover={{ x: 3, scale: 1.006 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        playUiSound(uiCustomization.audioFeedback);
                        setActiveTab('aiTutor');
                      }}
                      className="w-full p-3 sm:p-3.5 rounded-2xl border-2 border-white/40 hover:border-white/70 shadow-[0_0_20px_rgba(255,255,255,0.15)] bg-gradient-to-r from-white/15 via-white/10 to-white/5 backdrop-blur-xl text-white text-left relative overflow-hidden flex items-center justify-between group cursor-pointer transition-all duration-300"
                    >
                      <div className="flex items-center space-x-3 sm:space-x-3.5 relative z-10 min-w-0 flex-1">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/15 border border-white/30 flex items-center justify-center text-white group-hover:scale-110 transition-transform shrink-0 shadow-inner">
                          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-black text-sm sm:text-base text-white flex items-center gap-1.5 truncate">
                              <span>AI Tutor</span>
                              <span className="text-cyan-300">💎</span>
                            </h4>
                            <span className="text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-wider bg-white/15 text-white px-2 py-0.5 rounded-full border border-white/30 shrink-0">
                              CLEAN BENTO
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-[11.5px] text-slate-200 font-medium mt-0.5 truncate">
                            Minimalist Direct Solver • Interactive Learning
                          </p>
                        </div>
                      </div>
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/15 border border-white/30 flex items-center justify-center text-white group-hover:translate-x-1 transition-all shrink-0 ml-2 shadow-xs">
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                    </motion.button>
                  ) : (
                    /* Cyber Neon Default List Item */
                    <motion.button
                      whileHover={{ x: 3, scale: 1.006 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        playUiSound(uiCustomization.audioFeedback);
                        setActiveTab('aiTutor');
                      }}
                      className="w-full p-3 sm:p-3.5 rounded-2xl border-2 border-cyan-400/90 hover:border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.22)] bg-gradient-to-r from-slate-950 via-[#071d2c] to-[#042436] text-white text-left relative overflow-hidden flex items-center justify-between group cursor-pointer transition-all duration-300"
                    >
                      <div className="absolute inset-0 pointer-events-none opacity-40">
                        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="10%" cy="50%" r="1.5" fill="#38bdf8" />
                          <circle cx="50%" cy="20%" r="2" fill="#38bdf8" />
                          <circle cx="80%" cy="80%" r="1.5" fill="#38bdf8" />
                        </svg>
                      </div>
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-xl pointer-events-none group-hover:bg-cyan-500/30 transition-all" />

                      <div className="flex items-center space-x-3 sm:space-x-3.5 relative z-10 min-w-0 flex-1">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform shrink-0 shadow-inner">
                          <BrainCircuit className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-black text-sm sm:text-base text-white flex items-center gap-1.5 truncate">
                              <span>AI Tutor</span>
                              <span className="text-amber-400">⚡</span>
                            </h4>
                            <span className="text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-wider bg-white/10 text-white/90 px-2 py-0.5 rounded-full border border-white/20 backdrop-blur-md shrink-0">
                              STANDALONE APP
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-[11.5px] text-cyan-100/80 font-medium mt-0.5 truncate">
                            Full AI Assistant • Step-by-step solver & 24/7 doubts
                          </p>
                        </div>
                      </div>
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 group-hover:translate-x-1 transition-all shrink-0 ml-2 shadow-xs">
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                    </motion.button>
                  )}

                  {/* LIST ITEM 2: IMAGE GEN */}
                  <motion.button
                    whileHover={{ x: 3, scale: 1.006 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      playUiSound(uiCustomization.audioFeedback);
                      setActiveTab('imageGen');
                    }}
                    className="w-full p-3 sm:p-3.5 rounded-2xl border-2 border-purple-500/90 hover:border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.22)] bg-gradient-to-r from-slate-950 via-[#18092a] to-[#290b47] text-white text-left relative overflow-hidden flex items-center justify-between group cursor-pointer transition-all duration-300"
                  >
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-xl pointer-events-none group-hover:bg-purple-500/30 transition-all" />

                    <div className="flex items-center space-x-3 sm:space-x-3.5 relative z-10 min-w-0 flex-1">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-purple-500/20 border border-purple-400/50 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform shrink-0 shadow-inner">
                        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-black text-sm sm:text-base text-white flex items-center gap-1.5 truncate">
                            <span>Image Gen Studio</span>
                            <span className="text-amber-300">🎨</span>
                          </h4>
                          <span className="text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-wider bg-white/10 text-white/90 px-2 py-0.5 rounded-full border border-white/20 backdrop-blur-md shrink-0">
                            REAL ENGINE
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-[11.5px] text-purple-200/80 font-medium mt-0.5 truncate">
                          Generate real academic diagrams, charts & visual study art
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 group-hover:translate-x-1 transition-all shrink-0 ml-2 shadow-xs">
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </motion.button>

                  {/* LIST ITEM 3: QUIZ & PRACTICE */}
                  <motion.button
                    whileHover={{ x: 3, scale: 1.006 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      playUiSound(uiCustomization.audioFeedback);
                      setActiveTab('mockExam');
                    }}
                    className="w-full p-3 sm:p-3.5 rounded-2xl border-2 border-emerald-400/90 hover:border-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.22)] bg-gradient-to-r from-slate-950 via-[#051f16] to-[#043321] text-white text-left relative overflow-hidden flex items-center justify-between group cursor-pointer transition-all duration-300"
                  >
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/30 transition-all" />

                    <div className="flex items-center space-x-3 sm:space-x-3.5 relative z-10 min-w-0 flex-1">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform shrink-0 shadow-inner">
                        <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-black text-sm sm:text-base text-white flex items-center gap-1.5 truncate">
                            <span>Quiz & Mock Exams</span>
                            <span className="text-amber-400">🏆</span>
                          </h4>
                          <span className="text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-wider bg-white/10 text-white/90 px-2 py-0.5 rounded-full border border-white/20 backdrop-blur-md shrink-0">
                            QUIZ
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-[11.5px] text-emerald-100/80 font-medium mt-0.5 truncate">
                          Test subject skills, solve timed mock tests & earn XP
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 group-hover:translate-x-1 transition-all shrink-0 ml-2 shadow-xs">
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </motion.button>

                  {/* LIST ITEM 4: NOTEBOOK & FORMULAE */}
                  <motion.button
                    whileHover={{ x: 3, scale: 1.006 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      playUiSound(uiCustomization.audioFeedback);
                      setActiveTab('studyDocs');
                    }}
                    className="w-full p-3 sm:p-3.5 rounded-2xl border-2 border-amber-400/90 hover:border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.22)] bg-gradient-to-r from-slate-950 via-[#221504] to-[#3a2003] text-white text-left relative overflow-hidden flex items-center justify-between group cursor-pointer transition-all duration-300"
                  >
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/20 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/30 transition-all" />

                    <div className="flex items-center space-x-3 sm:space-x-3.5 relative z-10 min-w-0 flex-1">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform shrink-0 shadow-inner">
                        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-black text-sm sm:text-base text-white flex items-center gap-1.5 truncate">
                            <span>Notebook & Formula Vault</span>
                            <span className="text-amber-200">📝</span>
                          </h4>
                          <span className="text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-wider bg-white/10 text-white/90 px-2 py-0.5 rounded-full border border-white/20 backdrop-blur-md shrink-0">
                            NOTEBOOK
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-[11.5px] text-amber-100/80 font-medium mt-0.5 truncate">
                          Formula cheat-sheets, chapter summaries & visual notes
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 group-hover:translate-x-1 transition-all shrink-0 ml-2 shadow-xs">
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </motion.button>

                  {/* LIST ITEM 5: GOOGLE WORKSPACE */}
                  <motion.button
                    whileHover={{ x: 3, scale: 1.006 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      playUiSound(uiCustomization.audioFeedback);
                      setActiveTab('googleWorkspace');
                    }}
                    className="w-full p-3 sm:p-3.5 rounded-2xl border-2 border-indigo-500/80 hover:border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.22)] bg-gradient-to-r from-slate-950 via-[#0e162d] to-[#121c3b] text-white text-left relative overflow-hidden flex items-center justify-between group cursor-pointer transition-all duration-300"
                  >
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/30 transition-all" />

                    <div className="flex items-center space-x-3 sm:space-x-3.5 relative z-10 min-w-0 flex-1">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/50 flex items-center justify-center text-indigo-300 group-hover:scale-110 transition-transform shrink-0 shadow-inner">
                        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-300" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-black text-sm sm:text-base text-white flex items-center gap-1.5 truncate">
                            <span>Google Workspace Hub</span>
                            <span className="text-indigo-400">💼</span>
                          </h4>
                          <span className="text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-wider bg-white/10 text-white/90 px-2 py-0.5 rounded-full border border-white/20 backdrop-blur-md shrink-0">
                            WORKSPACE
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-[11.5px] text-indigo-100/80 font-medium mt-0.5 truncate font-sans">
                          Sync with Google Drive, Docs, Classroom, Calendar & Sheets
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 group-hover:translate-x-1 transition-all shrink-0 ml-2 shadow-xs">
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </motion.button>
                </div>
              ) : (
                /* GRID VIEW (ALTERNATIVE VIEW) */
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
                  {/* CARD 1: AI TUTOR - 4 CONFIGURABLE UI STYLES */}
                  {uiCustomization.aiTutorCardStyle === 'retro_arcade' ? (
                    /* Style 2: Retro 8-bit Pixel CRT Arcade Terminal */
                    <motion.button
                      whileHover={{ y: -2, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        playUiSound(uiCustomization.audioFeedback);
                        setActiveTab('aiTutor');
                      }}
                      className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-2 border-emerald-400/90 hover:border-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.35)] bg-gradient-to-br from-slate-950 via-[#031d0c] to-[#011408] text-emerald-300 text-left relative overflow-hidden flex flex-col justify-between h-34 sm:h-38 group cursor-pointer transition-all duration-300 font-mono"
                    >
                      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:8px_8px]" />
                      <div className="flex justify-between items-start relative z-10">
                        <div className="text-emerald-400 group-hover:scale-110 transition-transform">
                          <Terminal className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
                        </div>
                        <span className="text-[7.5px] sm:text-[9px] font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-300 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-emerald-500/40">
                          8-BIT RETRO
                        </span>
                      </div>
                      <div className="relative z-10">
                        <h4 className="font-black text-xs sm:text-base text-emerald-200 flex items-center gap-1 tracking-tight">
                          <span>AI Tutor [v1.0]</span>
                          <span className="text-emerald-400">👾</span>
                        </h4>
                        <p className="text-[9px] sm:text-[11px] text-emerald-400/80 font-medium leading-tight mt-0.5 line-clamp-1">
                          CRT Terminal • 24/7 Solver
                        </p>
                      </div>
                    </motion.button>
                  ) : uiCustomization.aiTutorCardStyle === 'parchment_desk' ? (
                    /* Style 3: Antique Scholar Walnut Wood & Parchment */
                    <motion.button
                      whileHover={{ y: -2, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        playUiSound(uiCustomization.audioFeedback);
                        setActiveTab('aiTutor');
                      }}
                      className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-2 border-amber-500/90 hover:border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] bg-gradient-to-br from-[#2b1e15] via-[#3a281c] to-[#1f150e] text-amber-100 text-left relative overflow-hidden flex flex-col justify-between h-34 sm:h-38 group cursor-pointer transition-all duration-300 font-serif"
                    >
                      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:12px_12px]" />
                      <div className="flex justify-between items-start relative z-10">
                        <div className="text-amber-400 group-hover:scale-110 transition-transform">
                          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
                        </div>
                        <span className="text-[7.5px] sm:text-[9px] font-black uppercase tracking-wider bg-amber-950/80 text-amber-200 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-amber-500/40 font-serif">
                          ROYAL DESK
                        </span>
                      </div>
                      <div className="relative z-10">
                        <h4 className="font-black text-xs sm:text-base text-amber-100 flex items-center gap-1 tracking-tight font-serif">
                          <span>AI Tutor</span>
                          <span className="text-amber-400">📜</span>
                        </h4>
                        <p className="text-[9px] sm:text-[11px] text-amber-200/80 font-medium leading-tight mt-0.5 line-clamp-1">
                          Royal Library • Step Guidance
                        </p>
                      </div>
                    </motion.button>
                  ) : uiCustomization.aiTutorCardStyle === 'bento_minimal' ? (
                    /* Style 4: Bento Minimalist Clean Glass */
                    <motion.button
                      whileHover={{ y: -2, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        playUiSound(uiCustomization.audioFeedback);
                        setActiveTab('aiTutor');
                      }}
                      className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-2 border-white/40 hover:border-white/70 shadow-[0_0_20px_rgba(255,255,255,0.15)] bg-gradient-to-br from-white/15 via-white/5 to-white/10 backdrop-blur-xl text-white text-left relative overflow-hidden flex flex-col justify-between h-34 sm:h-38 group cursor-pointer transition-all duration-300"
                    >
                      <div className="flex justify-between items-start relative z-10">
                        <div className="text-white group-hover:scale-110 transition-transform">
                          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
                        </div>
                        <span className="text-[7.5px] sm:text-[9px] font-black uppercase tracking-wider bg-white/15 text-white px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-white/30">
                          CLEAN BENTO
                        </span>
                      </div>
                      <div className="relative z-10">
                        <h4 className="font-black text-xs sm:text-base text-white flex items-center gap-1 tracking-tight">
                          <span>AI Tutor</span>
                          <span className="text-cyan-300">💎</span>
                        </h4>
                        <p className="text-[9px] sm:text-[11px] text-slate-200 font-medium leading-tight mt-0.5 line-clamp-1">
                          Minimalist Solver • Direct Mode
                        </p>
                      </div>
                    </motion.button>
                  ) : (
                    /* Style 1 (Default): Cyber Neon Glow */
                    <motion.button
                      whileHover={{ y: -2, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        playUiSound(uiCustomization.audioFeedback);
                        setActiveTab('aiTutor');
                      }}
                      className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-2 border-cyan-400/90 hover:border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.22)] bg-gradient-to-br from-slate-950 via-[#071d2c] to-[#042436] text-white text-left relative overflow-hidden flex flex-col justify-between h-34 sm:h-38 group cursor-pointer transition-all duration-300"
                    >
                      {/* Subtle cosmic particles / grid overlay */}
                      <div className="absolute inset-0 pointer-events-none opacity-40">
                        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="20%" cy="30%" r="1.5" fill="#38bdf8" />
                          <circle cx="75%" cy="25%" r="2" fill="#38bdf8" />
                          <circle cx="85%" cy="65%" r="1" fill="#38bdf8" />
                          <circle cx="45%" cy="80%" r="1.5" fill="#38bdf8" />
                          <circle cx="15%" cy="75%" r="1" fill="#38bdf8" />
                          <circle cx="60%" cy="45%" r="2" fill="#38bdf8" />
                        </svg>
                      </div>
                      <div className="absolute -top-12 -right-12 w-28 h-28 bg-cyan-500/20 rounded-full blur-xl pointer-events-none group-hover:bg-cyan-500/30 transition-all" />

                      <div className="flex justify-between items-start relative z-10">
                        <div className="text-cyan-300 group-hover:scale-110 transition-transform">
                          <BrainCircuit className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
                        </div>
                        <span className="text-[7.5px] sm:text-[9px] font-black uppercase tracking-wider bg-white/10 text-white/90 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-white/20 backdrop-blur-md">
                          STANDALONE APP
                        </span>
                      </div>

                      <div className="relative z-10">
                        <h4 className="font-black text-xs sm:text-base text-white flex items-center gap-1 tracking-tight">
                          <span>AI Tutor</span>
                          <span className="text-amber-400">⚡</span>
                        </h4>
                        <p className="text-[9px] sm:text-[11px] text-cyan-100/70 font-medium leading-tight mt-0.5 line-clamp-1 sm:line-clamp-none">
                          Full AI Assistant • Step-by-step solver
                        </p>
                      </div>
                    </motion.button>
                  )}

                  {/* CARD 2: IMAGE GEN - PURPLE NEON GLOW */}
                  <motion.button
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      playUiSound(uiCustomization.audioFeedback);
                      setActiveTab('imageGen');
                    }}
                    className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-2 border-purple-500/90 hover:border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.22)] bg-gradient-to-br from-slate-950 via-[#18092a] to-[#290b47] text-white text-left relative overflow-hidden flex flex-col justify-between h-34 sm:h-38 group cursor-pointer transition-all duration-300"
                  >
                    {/* Glowing purple energy wave SVG */}
                    <div className="absolute inset-0 pointer-events-none opacity-40">
                      <svg className="w-full h-full" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 60 C 50 30, 100 80, 200 40" stroke="#c084fc" strokeWidth="1.5" strokeDasharray="3 3" />
                        <circle cx="65%" cy="35%" r="2" fill="#e879f9" />
                        <circle cx="85%" cy="55%" r="1.5" fill="#c084fc" />
                        <circle cx="20%" cy="40%" r="1" fill="#e879f9" />
                      </svg>
                    </div>
                    <div className="absolute -top-12 -right-12 w-28 h-28 bg-purple-500/20 rounded-full blur-xl pointer-events-none group-hover:bg-purple-500/30 transition-all" />

                    <div className="flex justify-between items-start relative z-10">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform shadow-xs">
                        <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
                      </div>
                      <span className="text-[7.5px] sm:text-[9px] font-black uppercase tracking-wider bg-white/10 text-white/90 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-white/20 backdrop-blur-md">
                        REAL ENGINE
                      </span>
                    </div>

                    <div className="relative z-10">
                      <h4 className="font-black text-xs sm:text-base text-white flex items-center gap-1 tracking-tight">
                        <span>Image Gen</span>
                        <span className="text-amber-300">🎨</span>
                      </h4>
                      <p className="text-[9px] sm:text-[11px] text-purple-200/70 font-medium leading-tight mt-0.5 line-clamp-1 sm:line-clamp-none">
                        Generate real diagrams & visual art
                      </p>
                    </div>
                  </motion.button>

                  {/* CARD 3: QUIZ - EMERALD NEON GLOW */}
                  <motion.button
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      playUiSound(uiCustomization.audioFeedback);
                      setActiveTab('mockExam');
                    }}
                    className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-2 border-emerald-400/90 hover:border-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.22)] bg-gradient-to-br from-slate-950 via-[#051f16] to-[#043321] text-white text-left relative overflow-hidden flex flex-col justify-between h-34 sm:h-38 group cursor-pointer transition-all duration-300"
                  >
                    {/* Subtle sacred geometry / wireframe lines */}
                    <div className="absolute inset-0 pointer-events-none opacity-20 flex items-center justify-center">
                      <svg className="w-40 h-40" viewBox="0 0 100 100" fill="none" stroke="#34d399" strokeWidth="0.75">
                        <polygon points="50 5, 90 25, 90 75, 50 95, 10 75, 10 25" />
                        <polygon points="50 15, 80 30, 80 70, 50 85, 20 70, 20 30" />
                        <circle cx="50" cy="50" r="30" />
                      </svg>
                    </div>
                    <div className="absolute -top-12 -right-12 w-28 h-28 bg-emerald-500/20 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/30 transition-all" />

                    <div className="flex justify-between items-start relative z-10">
                      <div className="text-emerald-300 group-hover:scale-110 transition-transform">
                        <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
                      </div>
                      <span className="text-[7.5px] sm:text-[9px] font-black uppercase tracking-wider bg-white/10 text-white/90 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-white/20 backdrop-blur-md">
                        QUIZ
                      </span>
                    </div>

                    <div className="relative z-10">
                      <h4 className="font-black text-xs sm:text-base text-white flex items-center gap-1 tracking-tight">
                        <span>Quiz</span>
                        <span className="text-amber-400">🏆</span>
                      </h4>
                      <p className="text-[9px] sm:text-[11px] text-emerald-100/70 font-medium leading-tight mt-0.5 line-clamp-1 sm:line-clamp-none">
                        Test subject skills, earn XP
                      </p>
                    </div>
                  </motion.button>

                  {/* CARD 4: NOTEBOOK - AMBER NEON GLOW */}
                  <motion.button
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      playUiSound(uiCustomization.audioFeedback);
                      setActiveTab('studyDocs');
                    }}
                    className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-2 border-amber-400/90 hover:border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.22)] bg-gradient-to-br from-slate-950 via-[#221504] to-[#3a2003] text-white text-left relative overflow-hidden flex flex-col justify-between h-34 sm:h-38 group cursor-pointer transition-all duration-300"
                  >
                    {/* Subtle sacred geometry / star lines */}
                    <div className="absolute inset-0 pointer-events-none opacity-20 flex items-center justify-center">
                      <svg className="w-40 h-40" viewBox="0 0 100 100" fill="none" stroke="#fbbf24" strokeWidth="0.75">
                        <polygon points="50 5, 90 25, 90 75, 50 95, 10 75, 10 25" />
                        <circle cx="50" cy="50" r="38" />
                        <circle cx="50" cy="50" r="22" />
                      </svg>
                    </div>
                    <div className="absolute -top-12 -right-12 w-28 h-28 bg-amber-500/20 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/30 transition-all" />

                    <div className="flex justify-between items-start relative z-10">
                      <div className="text-amber-300 group-hover:scale-110 transition-transform">
                        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
                      </div>
                      <span className="text-[7.5px] sm:text-[9px] font-black uppercase tracking-wider bg-white/10 text-white/90 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-white/20 backdrop-blur-md">
                        NOTEBOOK
                      </span>
                    </div>

                    <div className="relative z-10">
                      <h4 className="font-black text-xs sm:text-base text-white flex items-center gap-1 tracking-tight">
                        <span>Notebook</span>
                        <span className="text-amber-200">📝</span>
                      </h4>
                      <p className="text-[9px] sm:text-[11px] text-amber-100/70 font-medium leading-tight mt-0.5 line-clamp-1 sm:line-clamp-none">
                        Formula sheets & visual notes
                      </p>
                    </div>
                  </motion.button>

                  {/* CARD 5: GOOGLE WORKSPACE - INDIGO NEON GLOW */}
                  <motion.button
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      playUiSound(uiCustomization.audioFeedback);
                      setActiveTab('googleWorkspace');
                    }}
                    className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-2 border-indigo-500/80 hover:border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.22)] bg-gradient-to-br from-slate-950 via-[#0e162d] to-[#121c3b] text-white text-left relative overflow-hidden flex flex-col justify-between h-34 sm:h-38 group cursor-pointer transition-all duration-300 col-span-2 sm:col-span-1"
                  >
                    <div className="absolute inset-0 pointer-events-none opacity-20 flex items-center justify-center">
                      <svg className="w-40 h-40" viewBox="0 0 100 100" fill="none" stroke="#6366f1" strokeWidth="0.75">
                        <polygon points="50 5, 90 25, 90 75, 50 95, 10 75, 10 25" />
                        <line x1="50" y1="5" x2="50" y2="95" />
                        <line x1="10" y1="25" x2="90" y2="75" />
                        <line x1="90" y1="25" x2="10" y2="75" />
                      </svg>
                    </div>
                    <div className="absolute -top-12 -right-12 w-28 h-28 bg-indigo-500/20 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/30 transition-all" />

                    <div className="flex justify-between items-start relative z-10">
                      <div className="text-indigo-300 group-hover:scale-110 transition-transform">
                        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-300" />
                      </div>
                      <span className="text-[7.5px] sm:text-[9px] font-black uppercase tracking-wider bg-white/10 text-white/90 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-white/20 backdrop-blur-md">
                        WORKSPACE
                      </span>
                    </div>

                    <div className="relative z-10">
                      <h4 className="font-black text-xs sm:text-base text-white flex items-center gap-1 tracking-tight">
                        <span>Workspace Hub</span>
                        <span className="text-indigo-400">💼</span>
                      </h4>
                      <p className="text-[9px] sm:text-[11px] text-indigo-100/70 font-medium leading-tight mt-0.5 line-clamp-1 sm:line-clamp-none">
                        Sync Drive, Docs, Calendar
                      </p>
                    </div>
                  </motion.button>
                </div>
              )}
            </div>

              {/* ADVANCED STUDY TOOLKIT BANNER - SOPHISTICATED MATTE DESIGN */}
              <motion.div
                id="toolkit-banner-section"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -1 }}
                className="w-full p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-white relative overflow-hidden group"
              >
                {/* Quiet, deep ambient backdrop lighting */}
                <div className="absolute -right-10 -top-10 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center space-x-3.5">
                    {/* Minimal Sparkle Badge */}
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openToolkitWithTool()}
                      className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-5 h-5 text-indigo-400" />
                    </motion.div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase">
                          18 ➔ ADVANCED TOOLS
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <h4 
                        onClick={() => openToolkitWithTool()}
                        className="font-bold text-sm sm:text-base text-slate-100 mt-1 cursor-pointer hover:text-indigo-400 transition flex items-center gap-1.5"
                      >
                        <span>Advanced Study Toolkit</span>
                        <span className="text-amber-400">⚡</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed max-w-md font-medium">
                        Scientific Calculator, Mind Maps, Mock Tests, Ambient Sounds & OCR Vision
                      </p>
                    </div>
                  </div>

                  {/* Circular Chevron Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openToolkitWithTool()}
                    className="w-9 h-9 rounded-full bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer shrink-0"
                    title="Launch Toolkit"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Quick-Launch Animated Tool Chips */}
                <div className="mt-4 pt-3.5 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none relative z-10">
                  {[
                    { id: 'pdf_scanner', name: '📑 PDF Scan' },
                    { id: 'voice_tutor', name: '🎙️ Voice Tutor' },
                    { id: 'calc', name: '🧮 Sci-Calc' },
                    { id: 'mindmap', name: '🌳 Mind Maps' },
                    { id: 'ocr', name: '📷 Vision OCR' },
                    { id: 'soundscapes', name: '🎧 Lo-Fi Sounds' },
                    { id: 'goals', name: '🎯 Daily Goals' },
                    { id: 'formula', name: '📐 Formula Vault' },
                    { id: 'spaced', name: '🧠 Spaced Recall' },
                    { id: 'exams', name: '⏳ Exam Timers' }
                  ].map((tool) => (
                    <motion.button
                      key={tool.id}
                      whileHover={{ scale: 1.03, y: -0.5 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        if (tool.id === 'pdf_scanner') {
                          playUiSound(uiCustomization.audioFeedback);
                          setActiveTab('pdfScanner');
                        } else if (tool.id === 'voice_tutor') {
                          playUiSound(uiCustomization.audioFeedback);
                          setShowVoiceTutorModal(true);
                        } else {
                          openToolkitWithTool(tool.id);
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/60 text-[10.5px] font-semibold text-slate-300 hover:text-white whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      {tool.name}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

            {/* 4. 5-DAY STUDY STREAK - RESTRAINED ACADEMIC DESIGN */}
            <div id="streak-card-section" className="rounded-2xl p-4 sm:p-5 border border-slate-800/80 bg-slate-900/60 text-white space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-200 text-xs tracking-wider uppercase flex items-center space-x-1.5">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <span>5-DAY STUDY STREAK</span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Complete goals to keep momentum high</p>
                </div>

                {/* Streak Badge Pill */}
                <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs font-bold text-amber-300 flex items-center gap-2">
                  <span className="text-sm">💎</span>
                  <div className="leading-tight text-right sm:text-left">
                    <div className="font-bold text-[11px] sm:text-xs text-amber-100">Streak: {userProfile.streak}/5</div>
                    <div className="text-[9px] font-medium text-amber-400/80 uppercase tracking-wider">Days</div>
                  </div>
                </div>
              </div>

              {/* DAY PILLS (5-DAY CARDS) */}
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
                {[
                  { d: 'DAY 1', w: 'Mon' },
                  { d: 'DAY 2', w: 'Tue' },
                  { d: 'DAY 3', w: 'Wed' },
                  { d: 'DAY 4', w: 'Thu' },
                  { d: 'DAY 5', w: 'Fri' }
                ].map((item, idx) => {
                  const isDone = streakCompletedDays[idx];
                  const isDay1 = idx === 0;
                  const isHighlighted = isDay1 || isDone;
                  return (
                    <motion.button 
                      key={idx}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleToggleDay(idx)}
                      className={`p-2 sm:p-3 rounded-xl text-center flex flex-col items-center justify-between h-20 sm:h-24 transition-all cursor-pointer focus:outline-hidden ${
                        isHighlighted
                          ? 'border border-amber-500/30 bg-amber-500/10 text-amber-100'
                          : 'border border-slate-800/80 bg-slate-950/40 hover:bg-slate-900/40 text-slate-400'
                      }`}
                    >
                      <div className={`text-[8.5px] sm:text-[9.5px] font-bold uppercase tracking-wider ${isHighlighted ? 'text-amber-400' : 'text-slate-500'}`}>
                        {item.d}
                      </div>
                      <div className={`font-bold text-xs sm:text-sm ${isHighlighted ? 'text-slate-100' : 'text-slate-400'}`}>
                        {item.w}
                      </div>
                      <div className="flex justify-center items-center">
                        <span className="text-xs sm:text-sm">{isHighlighted ? '🔥' : '🎯'}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* GOAL BOX */}
              <div className="p-3.5 sm:p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl flex items-center justify-between relative overflow-hidden">
                <div className="pr-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[9px] sm:text-[10px] font-bold bg-slate-900 text-slate-300 border border-slate-800 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                      DAY 1 GOAL
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                      +20 XP
                    </span>
                  </div>
                  <p className="font-bold text-slate-200 text-xs sm:text-sm mt-1.5 max-w-xs leading-snug">
                    Ask AI Tutor a homework question
                  </p>
                </div>

                {/* Task Complete Button with Refined Style */}
                <div className="relative shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCompleteDayGoal}
                    className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-lg font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs border border-emerald-500/20 transition flex flex-col items-center justify-center leading-tight cursor-pointer"
                  >
                    <span>Task</span>
                    <span>Complete!</span>
                  </motion.button>
                </div>
              </div>
            </div>

            {/* 5. DAILY STUDY QUESTS - PREMIUM SLEEK LOOK */}
            <div className="rounded-2xl p-4 sm:p-5 border border-slate-800/80 bg-slate-900/60 text-white space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-200 text-xs tracking-wider uppercase flex items-center space-x-1.5">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span>DAILY STUDY QUESTS</span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Finish missions, gain bonus XP</p>
                </div>
                <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold text-[11px] sm:text-xs rounded-lg flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Streak: 5 Days</span>
                </div>
              </div>

              <div className="space-y-2.5">
                {quests.map((q) => (
                  <motion.div 
                    key={q.id} 
                    whileHover={{ y: -1 }}
                    onClick={() => handleCompleteQuest(q.id)}
                    className="p-3 sm:p-3.5 bg-slate-950/40 hover:bg-slate-900/40 border border-slate-800/60 rounded-xl flex items-center justify-between transition group cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center space-x-3 pr-2">
                      <button 
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition shrink-0 ${
                          q.completed 
                            ? 'bg-emerald-600 text-white' 
                            : 'border border-slate-700 group-hover:border-slate-500'
                        }`}
                      >
                        {q.completed ? <Check className="w-3 h-3 stroke-[3]" /> : null}
                      </button>
                      <span className={`text-xs sm:text-sm font-semibold transition ${q.completed ? 'line-through text-slate-500' : 'text-slate-300 group-hover:text-slate-100'}`}>
                        {q.title}
                      </span>
                    </div>
                    <span className="text-[9.5px] sm:text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 shrink-0">
                      +{q.xp} XP
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* 6. FOCUS SESSION & TIMER - SOPHISTICATED ACADEMIC */}
            <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800/80 space-y-3.5 backdrop-blur-xs">
              {/* Header: Subject Selector & Time Duration Pills */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="relative min-w-[130px] sm:min-w-[160px]">
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value as Subject)}
                    className="w-full appearance-none px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-slate-100 focus:outline-none focus:border-slate-700 shadow-xs pr-8 cursor-pointer"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s} className="bg-slate-900 text-white">{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="flex items-center space-x-1 p-0.5 bg-slate-950 border border-slate-800 rounded-lg">
                  {[5, 25, 50].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setDurationMinutes(mins)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                        durationMinutes === mins
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              {/* TIMER DISPLAY - LOW-PROFILE MODERN INTERFACE */}
              <div className="py-2.5 px-4 bg-slate-950 border border-slate-800 rounded-xl text-center relative overflow-hidden flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">
                  FOCUS TIMER
                </span>
                <div className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-white select-none">
                  {formatTimerTime(timerSeconds)}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleTimer}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/20 text-white font-bold rounded-lg transition flex items-center space-x-1 text-[11px] cursor-pointer active:scale-95"
                  >
                    {isTimerRunning ? <Pause className="w-2.5 h-2.5 fill-white" /> : <Play className="w-2.5 h-2.5 fill-white ml-0.5" />}
                    <span>{isTimerRunning ? 'Pause' : 'Start'}</span>
                  </button>
                  <button
                    onClick={resetTimer}
                    className="w-7 h-7 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg transition border border-slate-800 shadow-xs flex items-center justify-center cursor-pointer active:scale-95"
                    title="Reset Timer"
                  >
                    <RotateCcw className="w-3 h-3 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* 7. ACADEMIC BADGES - COMPACT MATTE PARCHMENT & BRONZE AESTHETIC */}
            {(() => {
              const pomoCount = parseInt(localStorage.getItem('ascend_pomodoro_completed_count') || '0', 10);
              const docsCount = studyDocs.length;
              const examsCount = mockExams.filter(e => e.completed).length;

              // Calculate how many badges are earned
              const earnedCount = BADGES_CONFIG.filter(badge => {
                const actual = badge.getActual(userProfile, docsCount, examsCount, pomoCount);
                return actual >= badge.target;
              }).length;

              return (
                <div className="bg-slate-900/60 rounded-2xl p-4 sm:p-5 border border-slate-800/80 text-white space-y-4 relative overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                    <h3 className="font-semibold text-slate-200 text-xs tracking-wider uppercase flex items-center space-x-1.5">
                      <span className="text-sm">🎖️</span>
                      <span>{appLanguage === 'hi' ? 'शैक्षणिक पदक' : 'ACADEMIC BADGES'}</span>
                    </h3>
                    <span className="text-[9px] font-bold bg-slate-950 text-slate-300 border border-slate-800 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                      {earnedCount} / {BADGES_CONFIG.length} {appLanguage === 'hi' ? 'अर्जित' : 'EARNED'}
                    </span>
                  </div>

                  {/* Horizontal badges scroll container */}
                  <div className="flex items-center space-x-3 overflow-x-auto pb-1 scrollbar-none">
                    {BADGES_CONFIG.map((badge) => {
                      const actual = badge.getActual(userProfile, docsCount, examsCount, pomoCount);
                      const isEarned = actual >= badge.target;
                      const percentage = Math.min(100, Math.round((actual / badge.target) * 100));

                      return (
                        <div
                          key={badge.id}
                          className={`relative flex flex-col items-center justify-between w-24 h-28 shrink-0 rounded-xl p-2.5 text-center transition-all duration-200 group ${
                            isEarned
                              ? "bg-slate-950/60 border border-amber-500/20 hover:border-amber-500/30 text-amber-100"
                              : "bg-slate-950/30 border border-slate-850/80 opacity-75 hover:opacity-100"
                          }`}
                        >
                          {/* Seal Badge Header or Lock icon */}
                          {isEarned ? (
                            <div className="absolute top-1 right-1 bg-amber-500/10 text-amber-400 p-0.5 rounded text-[8px] font-black border border-amber-500/20">
                              ✓
                            </div>
                          ) : (
                            <div className="absolute top-1 right-1 text-slate-500 text-[9px]">
                              🔒
                            </div>
                          )}

                          {/* Badge Icon */}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
                            isEarned 
                              ? "bg-amber-500/10 text-amber-300" 
                              : "bg-slate-800/40 grayscale opacity-40"
                          }`}>
                            {badge.icon}
                          </div>

                          {/* Title & Info */}
                          <div className="w-full">
                            <div className="font-semibold text-[10px] text-slate-200 leading-tight truncate">
                              {appLanguage === 'hi' ? badge.nameHindi : badge.name}
                            </div>
                            
                            {/* Requirement description / Progress bar */}
                            {isEarned ? (
                              <div className="text-[7.5px] font-bold text-amber-400 tracking-wide mt-1 uppercase bg-amber-500/10 px-1 rounded-sm py-0.5 border border-amber-500/10">
                                {appLanguage === 'hi' ? 'अनलॉक' : 'UNLOCKED'}
                              </div>
                            ) : (
                              <div className="space-y-1 mt-1">
                                {/* Micro progress bar */}
                                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-slate-600 rounded-full transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <div className="text-[7.5px] font-medium text-slate-500">
                                  {actual} / {badge.target} {badge.displayUnit}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Floating Requirement Tooltip on hover */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block w-36 bg-slate-950 text-slate-200 text-[8px] font-medium leading-tight p-2 rounded-lg border border-slate-800 shadow-md z-30 pointer-events-none">
                            <p className="font-bold text-slate-100">{appLanguage === 'hi' ? badge.nameHindi : badge.name}</p>
                            <p className="mt-0.5 text-slate-400">{appLanguage === 'hi' ? badge.descHindi : badge.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* 9. ONLINE CLASSMATES - SLEEK STUDY ROOM MEMBERS */}
            <div className="bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-800/80 text-white space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-sm shadow-xs text-slate-300">
                    🧭
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-100 text-xs sm:text-sm tracking-wider uppercase flex items-center space-x-1.5">
                      <span>CELESTIAL CREW</span>
                    </h3>
                    <p className="text-[8.5px] font-mono text-indigo-400 uppercase tracking-wider">
                      STUDY NETWORK SYNC
                    </p>
                  </div>
                </div>

                {/* Active Status Pill */}
                <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span>{classmates.filter(c => c.online).length} IN ORBIT</span>
                </div>
              </div>

              {/* Classmates Pod List */}
              <div className="space-y-2">
                {classmates.map((peer) => (
                  <div 
                    key={peer.id} 
                    className="p-3 bg-slate-950/40 border border-slate-850 hover:border-slate-800 rounded-xl flex items-center justify-between shadow-xs transition group"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      {/* Avatar container */}
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-lg relative shrink-0 text-white">
                        {peer.avatar}
                        <span 
                          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-950 flex items-center justify-center ${
                            peer.online 
                              ? 'bg-emerald-500' 
                              : 'bg-slate-600'
                          }`}
                        >
                          {peer.online && <span className="w-0.5 h-0.5 rounded-full bg-white animate-ping" />}
                        </span>
                      </div>

                      {/* Crew Details */}
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-200 flex items-center space-x-1 truncate">
                          <span>{peer.name}</span>
                        </h4>
                        <p className="text-[9.5px] text-slate-400 flex items-center space-x-1.5 mt-0.5 truncate">
                          <span className="text-indigo-400 font-semibold">FOCUS:</span>
                          <span className="text-slate-300 truncate">{peer.focus}</span>
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="shrink-0 pl-2">
                      {peer.online ? (
                        <button
                          onClick={() => handleWaveBack(peer.id)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer active:scale-95 flex items-center space-x-1.5 ${
                            peer.waved
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold'
                          }`}
                        >
                          <span className="text-xs">{peer.waved ? '📡' : '🛰️'}</span>
                          <span className="tracking-wider">{peer.waved ? 'LINKED' : 'TRANSMIT'}</span>
                        </button>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-500 bg-slate-950 border border-slate-850 px-2.5 py-1 rounded-md">
                          DORMANT
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 10. CHIMPU'S SANCTUARY (VIRTUAL FRIEND) */}
            <div className="bg-slate-900/60 rounded-2xl p-4 sm:p-5 border border-slate-800/80 text-white space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-200 text-xs tracking-wide uppercase flex items-center space-x-1.5">
                  <Heart className="w-3.5 h-3.5 text-emerald-500" />
                  <span>CHIMPU'S SANCTUARY</span>
                </h3>
                <span className="text-[9px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                  VIRTUAL FRIEND
                </span>
              </div>

              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 text-center space-y-3 relative overflow-hidden">
                <div className="w-14 h-14 bg-slate-950 rounded-xl flex items-center justify-center text-3xl mx-auto shadow-xs relative border border-slate-800">
                  🐼
                  {equippedAccessory && (
                    <span className="absolute -top-1.5 -right-1.5 text-lg">{equippedAccessory}</span>
                  )}
                </div>

                <div className="inline-block bg-slate-950 px-3 py-1 rounded-md border border-slate-850 text-xs font-bold text-slate-300">
                  🥰 Let's study together, {userProfile.name || 'Friend'}!
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1 text-left">
                    <div className="flex justify-between text-[9px] font-bold text-slate-400">
                      <span>❤️ Happiness</span>
                      <span>{petHappiness}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-850 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${petHappiness}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <div className="flex justify-between text-[9px] font-bold text-slate-400">
                      <span>⚡ Energy</span>
                      <span>{petEnergy}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-850 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${petEnergy}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={feedBamboo}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>🌿</span>
                <span>Feed Bamboo (-15 XP)</span>
              </button>

              <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                  DRESSING AREA
                </span>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { name: 'Top Hat', cost: 100, icon: '🎩' },
                    { name: 'Sunglasses', cost: 120, icon: '🕶️' },
                    { name: 'Crown', cost: 180, icon: '👑' },
                    { name: 'Backpack', cost: 80, icon: '🎒' }
                  ].map((item) => (
                    <button
                      key={item.name}
                      onClick={() => buyAccessory(item)}
                      className="p-2 bg-slate-950 border border-slate-850 hover:border-slate-700 rounded-lg text-center transition flex flex-col items-center justify-between cursor-pointer"
                    >
                      <span className="text-lg mb-0.5">{item.icon}</span>
                      <span className="text-[9px] font-bold text-slate-400">{item.cost} XP</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* STUDENT PROFILE & QUICK ACTIONS CARD */}
            <div className="bg-slate-900/60 rounded-2xl p-4 text-white border border-slate-800/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left mt-2">
              <div className="flex items-center space-x-3.5">
                <UserAvatar
                  avatar={userProfile.avatar}
                  name={userProfile.name || 'Student'}
                  avatarType={userProfile.avatarType}
                  avatarBg={userProfile.avatarBg}
                  size="lg"
                  accessory={equippedAccessory}
                  showBadge={true}
                  isEditable={true}
                  onClick={() => setShowAvatarModal(true)}
                />
                <div>
                  <div className="flex items-center space-x-1.5 justify-center sm:justify-start">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                      Your Student Profile
                    </span>
                    <span className="text-[9.5px] text-amber-300 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      Lv {userProfile.level}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 mt-1">
                    {userProfile.name || 'Student Learner'}
                  </h4>
                  <p className="text-[11px] text-slate-400 flex items-center justify-center sm:justify-start space-x-1 mt-0.5">
                    {userProfile.email ? (
                      <>
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{userProfile.email}</span>
                      </>
                    ) : (
                      <span>{userProfile.className || 'Class Not Set'} • {userProfile.targetGoal || 'Daily Study'}</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowAvatarModal(true)}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition border border-slate-800 flex items-center space-x-1 shrink-0 active:scale-95 cursor-pointer"
                >
                  <span>Avatar 🎨</span>
                </button>
                <button
                  onClick={() => {
                    setIsEditingProfile(true);
                    setShowOnboardingModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center space-x-1.5 shrink-0 active:scale-95 cursor-pointer"
                >
                  <span>Edit Details ✏️</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TOOLKIT TAB */}
        {activeTab === 'toolkit' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs">
            <InteractiveToolkit
              onClose={() => setActiveTab('home')}
              appLanguage={appLanguage}
              firebaseUser={{ uid: userProfile.uid }}
              user={userProfile}
              notes={studyDocs}
              onAddNote={async (note) => {
                await saveStudyDocument({
                  id: 'doc_' + Date.now(),
                  ownerId: userProfile.uid,
                  title: note.title,
                  content: note.content,
                  summary: note.content.slice(0, 150) + '...',
                  tagsJson: JSON.stringify([note.subject]),
                  isShared: false,
                  timestamp: new Date().toISOString()
                });
                addXp(20);
              }}
              onAddProgress={async (score, total) => {
                addXp(Math.round((score / Math.max(1, total)) * 50));
              }}
              initialTool={initialTool}
            />
          </div>
        )}

        {/* GROUP CHAT / STUDY ROOMS TAB */}
        {activeTab === 'groupChat' && (
          <div className="grid md:grid-cols-3 gap-4 h-[calc(100vh-160px)]">
            <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-3 flex flex-col">
              <h3 className="font-bold text-slate-900 text-xs px-1">Study Rooms</h3>
              <div className="space-y-1.5 flex-1 overflow-y-auto">
                {roomsList.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`w-full p-3 rounded-xl text-left border transition-all ${
                      selectedRoomId === room.id
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <h4 className="font-bold text-xs">{room.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{room.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col h-full">
              <div className="pb-2.5 border-b border-slate-200 mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs text-slate-900">
                    {roomsList.find(r => r.id === selectedRoomId)?.name}
                  </h3>
                  <p className="text-[10px] text-slate-500">Live Realtime Collaboration</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-hide">
                <AnimatePresence initial={false}>
                  {roomMessages.map((msg) => {
                    const isMe = msg.senderId === userProfile.uid;
                    return (
                      <motion.div 
                        key={msg.id}
                        layout
                        initial={{ opacity: 0, y: 16, scale: 0.94, filter: 'blur(3px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -12, scale: 0.9, filter: 'blur(3px)', transition: { duration: 0.2, ease: 'easeOut' } }}
                        transition={{ type: 'spring', stiffness: 420, damping: 28, mass: 0.8 }}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[9px] text-slate-400 px-1 mb-0.5">{msg.senderName}</span>
                        <div className={`p-2.5 rounded-xl max-w-[85%] text-xs shadow-2xs ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-tl-none'
                        }`}>
                          {msg.text}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {roomMessages.length === 0 && (
                  <div className="text-center py-16 text-slate-400 text-xs italic">
                    No messages in this study room yet. Start the conversation!
                  </div>
                )}
              </div>

              <div className="pt-3 mt-2 border-t border-slate-200 flex items-center space-x-2">
                <input
                  type="text"
                  value={chatInputText}
                  onChange={(e) => setChatInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendRoomMessage()}
                  placeholder={t('typeMessagePlaceholder')}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleSendRoomMessage}
                  className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LIVE WHITEBOARD TAB */}
        {activeTab === 'whiteboard' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
                  <PenTool className="w-4 h-4 text-indigo-600" />
                  <span>Live Whiteboard</span>
                </h3>
                <p className="text-[10px] text-slate-500">Draw diagrams and equations in real-time</p>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  {['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#38bdf8', '#000000'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setDrawColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-5 h-5 rounded-full transition-transform ${drawColor === color ? 'scale-125 ring-2 ring-indigo-500' : 'opacity-80'}`}
                    />
                  ))}
                </div>

                <button
                  onClick={handleClearCanvas}
                  className="px-2.5 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-xl text-[10px] font-bold transition"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="relative bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden h-[450px] cursor-crosshair">
              <canvas
                ref={canvasRef}
                width={1000}
                height={450}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="w-full h-full block"
              />
            </div>
          </div>
        )}

        {/* AI MOCK EXAMS & PRACTICE QUIZZES TAB */}
        {(activeTab === 'mockExam' || activeTab === 'quiz') && (
          <QuizSection
            user={userProfile}
            onAddXp={addXp}
            onSaveMockExam={saveMockExam}
            savedExams={mockExams}
            onClose={() => setActiveTab('home')}
            language={appLanguage}
          />
        )}

        {/* STUDY DOCS / NOTEBOOK TAB */}
        {activeTab === 'studyDocs' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="space-y-6 w-full"
          >
            {/* FULL WIDTH HEADER & CONTROLS */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/85 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-sm tracking-wide uppercase flex items-center space-x-2">
                  <Notebook className="w-5 h-5 text-indigo-600 animate-pulse" />
                  <span>Interactive Sticky Notes</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Double click a sticky note to edit or click '+' to stick a new memo.
                </p>
              </div>

              {/* SEARCH & ADD CONTAINER */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Modern search bar */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    value={noteSearchQuery}
                    onChange={(e) => setNoteSearchQuery(e.target.value)}
                    placeholder="Search sticky notes..."
                    className="w-full sm:w-60 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                  {noteSearchQuery && (
                    <button
                      onClick={() => setNoteSearchQuery('')}
                      className="absolute inset-y-0 right-2.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Add note button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setEditingDocId(null);
                    setNewDocTitle('');
                    setNewDocContent('');
                    setIsAddingDoc(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Sticky Note</span>
                </motion.button>
              </div>
            </div>

            {/* UPGRADED GRID FOR LARGE WORKSPACE */}
            <motion.div 
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05
                  }
                }
              }}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 pt-2"
            >
              <AnimatePresence mode="popLayout">
                {studyDocs
                  .filter((doc) => {
                    const q = noteSearchQuery.toLowerCase();
                    return doc.title.toLowerCase().includes(q) || doc.content.toLowerCase().includes(q);
                  })
                  .map((doc, idx) => {
                    const colorPalettes = [
                      { bg: 'bg-[#fffbeb]', border: 'border-amber-200/90', text: 'text-amber-950', secondary: 'text-amber-900/80', tape: 'bg-amber-400/25' },
                      { bg: 'bg-[#f0fdfa]', border: 'border-teal-200/90', text: 'text-teal-950', secondary: 'text-teal-900/80', tape: 'bg-teal-400/25' },
                      { bg: 'bg-[#fdf2f8]', border: 'border-pink-200/90', text: 'text-pink-950', secondary: 'text-pink-900/80', tape: 'bg-pink-400/25' },
                      { bg: 'bg-[#f0f9ff]', border: 'border-sky-200/90', text: 'text-sky-950', secondary: 'text-sky-900/80', tape: 'bg-sky-400/25' },
                      { bg: 'bg-[#faf5ff]', border: 'border-purple-200/90', text: 'text-purple-950', secondary: 'text-purple-900/80', tape: 'bg-purple-400/25' }
                    ];
                    const palette = colorPalettes[idx % colorPalettes.length];
                    const rotations = [-1.5, 1, -0.8, 1.6, -1.2, 1.2];
                    const rotation = rotations[idx % rotations.length];

                    return (
                      <motion.div
                        key={doc.id}
                        variants={{
                          hidden: { opacity: 0, scale: 0.85, rotate: rotation * 1.5, y: 15 },
                          show: { 
                            opacity: 1, 
                            scale: 1, 
                            rotate: rotation, 
                            y: 0,
                            transition: { type: 'spring', stiffness: 260, damping: 22 }
                          }
                        }}
                        exit={{ opacity: 0, scale: 0.82, rotate: 0, y: -10, transition: { duration: 0.2 } }}
                        whileHover={{ 
                          scale: 1.03, 
                          rotate: 0,
                          zIndex: 10,
                          boxShadow: '0 12px 24px -6px rgba(0, 0, 0, 0.08), 0 8px 12px -4px rgba(0, 0, 0, 0.05)'
                        }}
                        onDoubleClick={() => {
                          setEditingDocId(doc.id);
                          setNewDocTitle(doc.title);
                          setNewDocContent(doc.content);
                          setIsAddingDoc(true);
                        }}
                        className={`p-5 rounded-xl border relative flex flex-col justify-between h-[195px] group cursor-pointer shadow-[0_4px_14px_rgba(0,0,0,0.02)] ${palette.bg} ${palette.border}`}
                      >
                        {/* Washi Tape Ribbon Accent */}
                        <div className={`w-14 h-4.5 absolute -top-2 left-1/2 -translate-x-1/2 rounded-xs border border-white/20 shadow-2xs backdrop-blur-[0.5px] rotate-1 ${palette.tape}`} />

                        <div className="space-y-2 overflow-hidden flex-1 flex flex-col">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className={`font-black text-[12px] tracking-tight uppercase line-clamp-1 ${palette.text}`}>
                              {doc.title}
                            </h4>
                            <div className="flex items-center space-x-1 shrink-0 opacity-40 group-hover:opacity-100 transition duration-200">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingDocId(doc.id);
                                  setNewDocTitle(doc.title);
                                  setNewDocContent(doc.content);
                                  setIsAddingDoc(true);
                                }}
                                className="text-slate-600 hover:text-indigo-600 p-1 rounded hover:bg-black/5 transition"
                                title="Edit note"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDoc(doc.id);
                                }}
                                className="text-slate-600 hover:text-rose-600 p-1 rounded hover:bg-black/5 transition"
                                title="Delete note"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          
                          <p className={`text-[11px] leading-relaxed whitespace-pre-wrap line-clamp-5 font-semibold flex-1 ${palette.secondary}`}>
                            {doc.content}
                          </p>
                        </div>

                        <div className={`pt-2 mt-2 border-t border-black/5 text-[9px] font-black flex justify-between items-center ${palette.secondary}`}>
                          <span>📝 DOUBLE CLICK TO EDIT</span>
                          <span>{new Date(doc.timestamp).toLocaleDateString()}</span>
                        </div>
                      </motion.div>
                    );
                  })}
              </AnimatePresence>

              {studyDocs.length === 0 && (
                <div className="col-span-full bg-white/70 backdrop-blur-md border border-slate-200 rounded-2xl py-16 text-center space-y-3.5">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center mx-auto text-xl font-bold">
                    📌
                  </div>
                  <div className="max-w-xs mx-auto">
                    <h4 className="font-bold text-slate-800 text-xs">No Sticky Notes yet</h4>
                    <p className="text-[10.5px] text-slate-400 font-medium mt-1">
                      Stick formulas, revision summaries, and ideas directly to your main notebook workspace!
                    </p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* DEDICATED CENTERED PREMIUM POPUP MODAL */}
            <AnimatePresence>
              {isAddingDoc && (
                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                    className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4.5 relative"
                  >
                    {/* Close button */}
                    <button 
                      onClick={() => {
                        setIsAddingDoc(false);
                        setEditingDocId(null);
                        setNewDocTitle('');
                        setNewDocContent('');
                      }}
                      className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-50 transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold">
                        📌
                      </div>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                        {editingDocId ? 'Edit Sticky Note' : 'Add New Memo'}
                      </h3>
                    </div>

                    <div className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Title or Topic</label>
                        <input
                          type="text"
                          placeholder="Title or Topic..."
                          value={newDocTitle}
                          onChange={(e) => setNewDocTitle(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none transition-all duration-300"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Details / Revision Notes</label>
                        <textarea
                          placeholder="Write details, key equations, or revision ideas..."
                          rows={6}
                          value={newDocContent}
                          onChange={(e) => setNewDocContent(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-xs text-slate-900 font-semibold resize-none focus:outline-none transition-all duration-300"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2.5 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setIsAddingDoc(false);
                          setEditingDocId(null);
                          setNewDocTitle('');
                          setNewDocContent('');
                        }}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveDoc}
                        className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                      >
                        {editingDocId ? 'Save Note' : 'Stick Note'}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* PET COMPANION TAB */}
        {activeTab === 'petCompanion' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm mx-auto text-center space-y-4 shadow-xs">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-2xl bg-emerald-100 border-2 border-emerald-300 p-2 mx-auto shadow-xs flex items-center justify-center text-5xl">
                🐼
                {equippedAccessory && (
                  <span className="absolute -top-3 -right-2 text-3xl">{equippedAccessory}</span>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">{userProfile.petName}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Virtual Study Companion</p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-left">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500">❤️ Happiness</span>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500" style={{ width: `${petHappiness}%` }} />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500">⚡ Energy</span>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${petEnergy}%` }} />
                </div>
              </div>
            </div>

            <button
              onClick={feedBamboo}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5"
            >
              <span>🌿</span>
              <span>Feed Bamboo (-15 XP)</span>
            </button>
          </div>
        )}

        {/* AI IMAGE GENERATOR (gemini-3-pro-image-preview) */}
        {activeTab === 'imageGen' && (
          <ImageGenerator
            onSaveToNotebook={async (title, content) => {
              await saveStudyDocument({
                id: 'doc_' + Date.now(),
                ownerId: userProfile.uid,
                title,
                content,
                summary: content.slice(0, 150) + '...',
                tagsJson: JSON.stringify(['AiImage']),
                isShared: false,
                timestamp: new Date().toISOString()
              });
            }}
            onAddXp={addXp}
          />
        )}

        {/* PDF & BOOK SCANNER: CHAPTER SUMMARIES & AUTOMATIC QUIZ */}
        {activeTab === 'pdfScanner' && (
          <PdfBookScanner
            user={userProfile}
            appLanguage={appLanguage}
            onSaveToNotebook={async (title, content, tags) => {
              await saveStudyDocument({
                id: 'doc_' + Date.now(),
                ownerId: userProfile.uid,
                title,
                content,
                summary: content.slice(0, 150) + '...',
                tagsJson: JSON.stringify(tags || ['PDF Scanner']),
                isShared: false,
                timestamp: new Date().toISOString()
              });
            }}
            onAddXp={addXp}
            onClose={() => setActiveTab('home')}
          />
        )}

        {/* GOOGLE PRODUCTIVITY WORKSPACE INTEGRATIONS HUB */}
        {activeTab === 'googleWorkspace' && (
          <IntegrationsHub
            appLanguage={appLanguage}
            audioFeedbackEnabled={uiCustomization.audioFeedback !== 'silent'}
            attachedFiles={attachedWorkspaceFiles}
            onAttachFile={(file) => {
              setAttachedWorkspaceFiles(prev => {
                if (prev.some(f => f.id === file.id)) return prev;
                return [...prev, file];
              });
            }}
            onRemoveAttachedFile={(id) => {
              setAttachedWorkspaceFiles(prev => prev.filter(f => f.id !== id));
            }}
          />
        )}
        </motion.div>
        </AnimatePresence>
      </main>
      )}

      {/* FLOATING MORE MENU OVERLAY */}
      <AnimatePresence>
        {showMoreMenu && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40"
              onClick={() => setShowMoreMenu(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.92, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 14 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="fixed bottom-14 right-2 sm:right-6 z-50 w-72 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-3.5 space-y-2.5"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                  <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
                  <span>More Features</span>
                </span>
                <button 
                  onClick={() => setShowMoreMenu(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'pdfScanner', label: 'PDF Scanner', icon: FileText, color: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/40' },
                  { id: 'voiceTutor', label: 'Voice Tutor', icon: Mic, color: 'text-pink-400 bg-pink-950/60 border-pink-800/40' },
                  { id: 'imageGen', label: 'Image Gen', icon: ImageIcon, color: 'text-indigo-400 bg-indigo-950/60 border-indigo-800/40' },
                  { id: 'whiteboard', label: 'Whiteboard', icon: PenTool, color: 'text-purple-400 bg-purple-950/60 border-purple-800/40' },
                  { id: 'mockExam', label: 'Mock Exams', icon: GraduationCap, color: 'text-amber-400 bg-amber-950/60 border-amber-800/40' },
                  { id: 'studyDocs', label: 'Notebook', icon: FileText, color: 'text-teal-400 bg-teal-950/60 border-teal-800/40' },
                  { id: 'petCompanion', label: 'Sanctuary', icon: Heart, color: 'text-rose-400 bg-rose-950/60 border-rose-800/40' },
                  { id: 'account', label: currentUser && !currentUser.isAnonymous ? 'My Account' : 'Sign In / Login', icon: LogIn, color: 'text-indigo-400 bg-indigo-950/60 border-indigo-800/40' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isItemActive = activeTab === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (item.id === 'voiceTutor') {
                          setShowVoiceTutorModal(true);
                        } else if (item.id === 'account') {
                          setShowAuthModal(true);
                        } else {
                          setActiveTab(item.id as any);
                        }
                        setShowMoreMenu(false);
                      }}
                      className={`flex items-center space-x-2 p-2 rounded-xl transition text-left border cursor-pointer ${
                        isItemActive
                          ? 'bg-indigo-600/20 border-indigo-500/60 text-indigo-300 font-bold shadow-xs'
                          : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 text-slate-300 font-medium'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg border ${item.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[11px] font-semibold tracking-tight truncate">{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Studio Settings & Eye Comfort Controls */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                {/* Late-Night Dark Mode Toggle Card */}
                <ThemeToggle variant="settings" className="border-slate-800 bg-slate-900/90 text-[11px]" />

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="relative py-1.5 px-2 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700/60 rounded-xl font-bold flex items-center justify-center space-x-1 transition shadow-xs">
                    <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <select
                      value={appLanguage}
                      onChange={(e) => {
                        const selected = e.target.value as Language;
                        setAppLanguage(selected);
                        updateUserProfile(userProfile.uid, { language: selected });
                      }}
                      className="bg-transparent text-slate-200 font-bold text-[11px] focus:outline-none cursor-pointer w-full"
                    >
                      <option value="en" className="bg-slate-900 text-white">English</option>
                      <option value="hi" className="bg-slate-900 text-white">हिंदी (Hindi)</option>
                      <option value="hinglish" className="bg-slate-900 text-white">Hinglish</option>
                      <option value="marathi" className="bg-slate-900 text-white">मराठी (Marathi)</option>
                      <option value="tamil" className="bg-slate-900 text-white">தமிழ் (Tamil)</option>
                      <option value="bengali" className="bg-slate-900 text-white">বাংলা (Bengali)</option>
                    </select>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowMoreMenu(false);
                      setShowCustomizeModal(true);
                    }}
                    className="py-1.5 px-2 rounded-xl bg-purple-950/70 border border-purple-700/50 hover:bg-purple-900/70 text-purple-300 font-bold text-[11px] flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-xs"
                    title="Open Studio Settings & Theme Customizer"
                  >
                    <Settings2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Settings Studio</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* COMPACT & SLIM BOTTOM STICKY NAVIGATION BAR WITH AUTO-HIDE IN AI TUTOR MODE */}
      <motion.nav
        initial={false}
        animate={{
          y: activeTab === 'aiTutor' && !isBottomNavVisible ? 72 : 0,
          opacity: activeTab === 'aiTutor' && !isBottomNavVisible ? 0 : 1
        }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        onMouseEnter={() => {
          if (activeTab === 'aiTutor') setIsBottomNavInteracting(true);
        }}
        onMouseLeave={() => {
          if (activeTab === 'aiTutor') {
            setIsBottomNavInteracting(false);
            resetBottomNavTimer();
          }
        }}
        onTouchStart={() => {
          if (activeTab === 'aiTutor') {
            setIsBottomNavInteracting(true);
            resetBottomNavTimer();
          }
        }}
        onTouchEnd={() => {
          if (activeTab === 'aiTutor') {
            setIsBottomNavInteracting(false);
            resetBottomNavTimer();
          }
        }}
        className={`fixed bottom-0 left-0 right-0 z-50 bg-[#0f141d]/95 backdrop-blur-lg border-t border-slate-800/90 px-4 py-1 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.6)] h-12 transition-colors duration-200 ${
          activeTab === 'aiTutor' && !isBottomNavVisible ? 'pointer-events-none' : 'pointer-events-auto'
        }`}
      >
        {[
          { id: 'home', icon: BookOpen },
          { id: 'aiTutor', icon: BrainCircuit, badge: 'PRO' },
          { id: 'toolkit', icon: Sparkles },
          { id: 'groupChat', icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.90 }}
              onClick={() => {
                playUiSound(uiCustomization.audioFeedback);
                setShowMoreMenu(false);
                if (tab.id === 'toolkit') setInitialTool(undefined);
                setActiveTab(tab.id as any);
                if (tab.id === 'aiTutor') {
                  resetBottomNavTimer();
                }
              }}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer select-none ${
                isActive
                  ? 'text-emerald-400 font-black'
                  : 'text-slate-400 hover:text-white font-medium'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute inset-0 bg-emerald-500/15 border border-emerald-500/30 rounded-xl -z-10 shadow-[0_0_12px_rgba(52,211,153,0.25)]"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <div className="relative inline-flex items-center justify-center">
                <Icon className={`w-4 h-4 transition-transform ${isActive ? 'scale-110 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'text-slate-400'}`} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2 px-1 py-[0.5px] bg-gradient-to-r from-emerald-500 to-indigo-600 text-white text-[7px] font-black rounded-full leading-none shadow-[0_0_6px_rgba(16,185,129,0.5)] border border-emerald-300/40 z-20 tracking-tight pointer-events-none select-none">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[9.5px] tracking-tight mt-0.5">{t(tab.id as any)}</span>
            </motion.button>
          );
        })}

        {/* MORE BUTTON */}
        <motion.button
          whileTap={{ scale: 0.90 }}
          onClick={() => {
            setShowMoreMenu(!showMoreMenu);
            if (activeTab === 'aiTutor') {
              resetBottomNavTimer();
            }
          }}
          className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer select-none ${
            showMoreMenu || ['whiteboard', 'mockExam', 'studyDocs', 'petCompanion', 'imageGen'].includes(activeTab)
              ? 'text-emerald-400 font-black'
              : 'text-slate-400 hover:text-white font-medium'
          }`}
        >
          {(showMoreMenu || ['whiteboard', 'mockExam', 'studyDocs', 'petCompanion', 'imageGen'].includes(activeTab)) && (
            <motion.div
              layoutId="bottomNavIndicator"
              className="absolute inset-0 bg-emerald-500/15 border border-emerald-500/30 rounded-xl -z-10 shadow-[0_0_12px_rgba(52,211,153,0.25)]"
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            />
          )}
          <div className="relative">
            <LayoutGrid className={`w-4 h-4 transition-transform ${showMoreMenu ? 'scale-110 text-emerald-400' : 'text-slate-400'}`} />
            {['whiteboard', 'mockExam', 'studyDocs', 'petCompanion', 'imageGen'].includes(activeTab) && (
              <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-slate-900" />
            )}
          </div>
          <span className="text-[9.5px] tracking-tight mt-0.5">More</span>
        </motion.button>
      </motion.nav>

      {/* ONBOARDING & PROFILE EDIT MODAL */}
      <OnboardingModal
        isOpen={showOnboardingModal}
        initialData={{
          name: userProfile.name || '',
          email: userProfile.email || '',
          avatar: userProfile.avatar || '🧑‍🎓',
          avatarType: userProfile.avatarType || 'emoji',
          avatarBg: userProfile.avatarBg || 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600',
          schoolName: userProfile.schoolName || '',
          className: userProfile.className || '',
          targetGoal: userProfile.targetGoal || ''
        }}
        onSave={handleSaveProfile}
        onClose={() => setShowOnboardingModal(false)}
        isEditing={isEditingProfile}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      {/* AVATAR STUDIO MODAL */}
      <AvatarSelectorModal
        isOpen={showAvatarModal}
        currentAvatar={userProfile.avatar || '🧑‍🎓'}
        currentAvatarType={userProfile.avatarType || 'emoji'}
        currentAvatarBg={userProfile.avatarBg}
        userName={userProfile.name || 'Student'}
        equippedAccessory={equippedAccessory}
        onSave={handleSaveAvatar}
        onClose={() => setShowAvatarModal(false)}
      />

      {/* AUTHENTICATION MODAL (SIGN IN, SIGN UP, GOOGLE, FORGOT PASSWORD) */}
      <AuthModal
        isOpen={showAuthModal || (authInitialized && !isUserLoggedIn)}
        onClose={() => {
          if (isUserLoggedIn) {
            setShowAuthModal(false);
          }
        }}
        userProfile={userProfile}
        setUserProfile={setUserProfile}
        appLanguage={appLanguage}
        onAuthSuccess={(newProfile) => {
          setUserProfile(newProfile);
          if (newProfile && newProfile.email) {
            setShowAuthModal(false);
          }
        }}
      />

      {/* SELF CUSTOMIZE STUDIO MODAL (USER EDITABLE UI, 4-UI PER OBJECT, LIGHTING, THEMES) */}
      <SelfCustomizeModal
        isOpen={showCustomizeModal}
        onClose={() => setShowCustomizeModal(false)}
        customization={uiCustomization}
        onUpdate={handleUpdateCustomization}
        language={appLanguage}
      />

      {/* LIVE VOICE TUTOR MODAL */}
      <VoiceTutorModal
        isOpen={showVoiceTutorModal}
        onClose={() => setShowVoiceTutorModal(false)}
        user={userProfile}
        appLanguage={appLanguage}
        onAddXp={addXp}
        onSaveToNotebook={async (title, content, tags) => {
          await saveStudyDocument({
            id: 'doc_' + Date.now(),
            ownerId: userProfile.uid,
            title,
            content,
            summary: content.slice(0, 150) + '...',
            tagsJson: JSON.stringify(tags || ['Voice Tutor']),
            isShared: false,
            timestamp: new Date().toISOString()
          });
        }}
      />





      {/* BADGE CELEBRATION MODAL OVERLAY */}
      <BadgeCelebrationModal
        badge={unlockedBadgeCelebration}
        userName={userProfile.name || (appLanguage === 'hi' ? 'छात्र' : 'Student')}
        language={appLanguage}
        onClose={() => setUnlockedBadgeCelebration(null)}
      />

      {/* PWA INSTALL & OFFLINE PROMPT BANNER */}
      <PWAInstallBanner />

      {/* GLOBAL TOAST NOTIFICATION CONTAINER */}
      <Toast />
    </div>
  );
}
