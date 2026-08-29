import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
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
  ChevronDown,
  Mail,
  X,
  Image as ImageIcon,
  LogIn,
  UserCheck,
  Edit3,
  User as UserIcon
} from 'lucide-react';
import InteractiveToolkit from './components/InteractiveToolkit';
import AiTutorApp from './components/AiTutorApp';
import ImageGenerator from './components/ImageGenerator';
import OnboardingModal from './components/OnboardingModal';
import AuthModal from './components/AuthModal';
import { TRANSLATIONS, Language } from './services/translations';
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
import type { 
  UserProfile, 
  RoomChatMessage, 
  WhiteboardElement, 
  MockExam, 
  StudyDocument, 
  Subject 
} from './types';

const SUBJECTS: Subject[] = ['Mathematics', 'Science', 'Biology', 'Physics', 'Chemistry', 'English'];

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
  const [activeTab, setActiveTab] = useState<'home' | 'toolkit' | 'groupChat' | 'whiteboard' | 'mockExam' | 'studyDocs' | 'petCompanion' | 'aiTutor' | 'quiz' | 'notebook' | 'planner' | 'imageGen'>('home');
  const [initialTool, setInitialTool] = useState<string | undefined>(undefined);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

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

  // Listen to Firebase Auth State changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
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
        return 'GOOD MORNING 🌅';
      } else if (hour >= 12 && hour < 17) {
        return 'GOOD AFTERNOON ☀️';
      } else if (hour >= 17 && hour < 21) {
        return 'GOOD EVENING 🌆';
      } else {
        return 'GOOD NIGHT 🌙';
      }
    } catch (e) {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) return 'GOOD MORNING 🌅';
      if (hour >= 12 && hour < 17) return 'GOOD AFTERNOON ☀️';
      if (hour >= 17 && hour < 21) return 'GOOD EVENING 🌆';
      return 'GOOD NIGHT 🌙';
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
    const updated: UserProfile = {
      ...userProfile,
      avatar: data.avatar,
      avatarType: data.avatarType,
      avatarBg: data.avatarBg || userProfile.avatarBg
    };
    setUserProfile(updated);
    localStorage.setItem('ascend_user_profile', JSON.stringify(updated));
    localStorage.setItem('user_profile_data', JSON.stringify(updated));
    localStorage.setItem(`user_profile_${userProfile.uid}`, JSON.stringify(updated));
    updateUserProfile(userProfile.uid, updated);
    addXp(20);
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
    const updated: UserProfile = {
      ...userProfile,
      name: data.name,
      email: data.email || '',
      avatar: data.avatar || userProfile.avatar,
      avatarType: data.avatarType || userProfile.avatarType,
      avatarBg: data.avatarBg || userProfile.avatarBg,
      schoolName: data.schoolName,
      className: data.className,
      targetGoal: data.targetGoal,
      isOnboarded: true
    };
    setUserProfile(updated);
    // Persist cleanly to localStorage
    localStorage.setItem('ascend_user_profile', JSON.stringify(updated));
    localStorage.setItem('user_profile_data', JSON.stringify(updated));
    localStorage.setItem(`user_profile_${userProfile.uid}`, JSON.stringify(updated));
    localStorage.setItem(`ascend_onboarded_${userProfile.uid}`, 'true');
    localStorage.setItem('ascend_onboarded', 'true');
    updateUserProfile(userProfile.uid, updated);
    setShowOnboardingModal(false);
    setIsEditingProfile(false);
    addXp(50);
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

  const toggleLanguage = () => {
    const nextLang: Language = appLanguage === 'en' ? 'hi' : 'en';
    setAppLanguage(nextLang);
    updateUserProfile(userProfile.uid, { language: nextLang });
  };

  // Helper to add XP and update level / pet level
  const addXp = (amount: number) => {
    const newXp = Math.max(0, userProfile.xp + amount);
    const newLevel = Math.floor(newXp / 100) + 1;
    const updated = {
      ...userProfile,
      xp: newXp,
      level: newLevel
    };
    setUserProfile(updated);
    updateUserProfile(userProfile.uid, updated);
  };

  // --- STREAK & GOALS STATE ---
  const [streakCompletedDays, setStreakCompletedDays] = useState<boolean[]>([false, false, false, false, false]);
  const [day1GoalCompleted, setDay1GoalCompleted] = useState(false);

  const handleCompleteDayGoal = () => {
    if (!day1GoalCompleted) {
      setDay1GoalCompleted(true);
      setStreakCompletedDays([true, false, false, false, false]);
      addXp(20);
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
      addXp(50);
      alert('Focus Study Session Complete! Great job! +50 XP Earned!');
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
  const [petHappiness, setPetHappiness] = useState(85);
  const [petEnergy, setPetEnergy] = useState(80);
  const [equippedAccessory, setEquippedAccessory] = useState<string | null>(null);

  const feedBamboo = () => {
    if (userProfile.xp >= 15) {
      addXp(-15);
      setPetHappiness(prev => Math.min(100, prev + 15));
      setPetEnergy(prev => Math.min(100, prev + 10));
    } else {
      alert('You need at least 15 XP to buy Bamboo feed!');
    }
  };

  const buyAccessory = (item: { name: string; cost: number; icon: string }) => {
    if (userProfile.xp >= item.cost) {
      addXp(-item.cost);
      setEquippedAccessory(item.icon);
      alert(`Equipped ${item.name} for ${userProfile.petName}!`);
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
    const unsubscribe = subscribeToChats(selectedRoomId, (msgs) => {
      setRoomMessages(msgs);
    });
    return () => unsubscribe();
  }, [selectedRoomId]);

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
    const unsubscribe = subscribeToWhiteboard('global_board', (elements) => {
      setWhiteboardElements(elements);
    });
    return () => unsubscribe();
  }, []);

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
  const [mockExams, setMockExams] = useState<MockExam[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToMockExams(userProfile.uid, (exams) => {
      setMockExams(exams);
    });
    return () => unsubscribe();
  }, [userProfile.uid]);

  // --- STUDY DOCS STATE ---
  const [studyDocs, setStudyDocs] = useState<StudyDocument[]>([]);
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToStudyDocuments(userProfile.uid, (docs) => {
      setStudyDocs(docs);
    });
    return () => unsubscribe();
  }, [userProfile.uid]);

  const handleSaveDoc = async () => {
    if (!newDocTitle.trim()) return;
    const docData: StudyDocument = {
      id: 'doc_' + Date.now(),
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
    setNewDocTitle('');
    setNewDocContent('');
    addXp(15);
  };

  const handleDeleteDoc = async (id: string) => {
    await deleteStudyDocument(userProfile.uid, id);
  };

  // Open specific tool in Toolkit
  const openToolkitWithTool = (toolName?: string) => {
    setInitialTool(toolName);
    setActiveTab('toolkit');
  };

  return (
    <div className="min-h-screen text-slate-100 font-sans flex flex-col selection:bg-emerald-500 selection:text-white w-full max-w-full overflow-x-hidden relative bg-[#0d1117]">
      {/* FULL-PAGE SCIENCE CHALKBOARD BACKGROUND */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-fixed bg-no-repeat opacity-95"
        style={{ backgroundImage: `url('/science_bg.jpg')` }}
      />
      {/* AMBIENT CHALKBOARD VIGNETTE OVERLAY */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-black/60 via-black/35 to-black/75 backdrop-brightness-95" />

      {/* COMPACT TOP HEADER - DARK SLATE & GOLD CHALK STYLING */}
      <header className="sticky top-0 z-40 bg-[#12161f]/90 backdrop-blur-md border-b border-slate-700/60 px-3 sm:px-4 py-2 flex items-center justify-between shadow-lg w-full max-w-full overflow-hidden transition-colors duration-200">
        <div className="flex items-center space-x-2 shrink min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-600 border border-emerald-400/40 flex items-center justify-center text-white shadow-[0_0_12px_rgba(16,185,129,0.4)] font-black text-lg shrink-0">
            🎓
          </div>
          <div className="min-w-0">
            <h1 className="text-xs font-black tracking-wider text-[#dfc285] uppercase truncate drop-shadow-xs flex items-center gap-1.5">
              <span>ASCEND STUDY</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
            </h1>
            <p className="text-[9px] font-extrabold text-[#a39071] uppercase tracking-wider truncate max-w-[130px] sm:max-w-[220px]">
              {userProfile.name ? `${userProfile.name.toUpperCase()}` : 'STUDENT'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          {/* THEME TOGGLE BUTTON - PURPLE MOON */}
          <ThemeToggle variant="lunar" />

          {/* WALLPAPER / PRESET SELECTOR BUTTON */}
          <button
            onClick={() => setShowAvatarModal(true)}
            title="Theme Wallpaper / Preset"
            className="flex items-center space-x-1 p-1 pl-1.5 pr-2 rounded-full bg-[#2a2420] hover:bg-[#38312b] border border-[#483e36] text-[#dfc285] transition cursor-pointer shadow-xs active:scale-95 shrink-0"
          >
            <div className="w-5 h-5 rounded-full overflow-hidden border border-[#5a4e44] bg-sky-300 flex items-center justify-center text-[10px]">
              🌅
            </div>
            <span className="text-[9px] text-[#a39071]">▾</span>
          </button>

          {/* LANGUAGE TOGGLE */}
          <button 
            onClick={toggleLanguage}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#2a2420] hover:bg-[#38312b] border border-[#483e36] text-[#dfc285] text-[11px] font-extrabold transition cursor-pointer shrink-0 shadow-xs"
            title="Toggle Language"
          >
            <span className="text-[11px]">🌐</span>
            <span className="font-bold">{appLanguage.toUpperCase()}</span>
          </button>

          {/* AUTH / ACCOUNT BUTTON */}
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#2a2420] hover:bg-[#38312b] border border-[#483e36] text-[#dfc285] text-[11px] font-extrabold transition cursor-pointer shrink-0 shadow-xs active:scale-95"
            title={currentUser && !currentUser.isAnonymous ? 'Manage Account' : 'Sign In / Register'}
          >
            <UserCheck className="w-3.5 h-3.5 text-[#dfc285]" />
            <span>Me</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA - WITH pb-24 TO AVOID BOTTOM NAV OVERLAP */}
      <main className="relative z-10 flex-1 p-3 sm:p-4 md:p-5 max-w-xl mx-auto w-full space-y-4 pb-24 overflow-x-hidden">
        {/* DASHBOARD TAB */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            
            {/* 1. TOP USER CARD - PARCHMENT & MAHOGANY LUXURY AESTHETIC MATCHING REFERENCE IMAGE */}
            <div className="bg-[#2d221a] p-2 sm:p-2.5 rounded-[30px] border border-[#3e3025] shadow-2xl">
              <div className="bg-gradient-to-b from-[#f6efe1] via-[#ece2ce] to-[#e4d6bf] rounded-[22px] border-2 border-[#d5c2a3] p-4 sm:p-5 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_4px_12px_rgba(0,0,0,0.25)] space-y-3.5 sm:space-y-4 text-[#3d2e1f]">
                {/* Top Row: Greeting Tag, Target Goal & Edit Action */}
                <div className="flex items-center justify-between gap-2 border-b border-[#ddcdb4] pb-3">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-[10.5px] sm:text-[11px] font-extrabold text-[#544026] bg-[#ddcfb6] px-3 py-1 rounded-full inline-flex items-center space-x-1.5 border border-[#c5b497] shadow-xs uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8c6b3e]"></span>
                      <span>{realtimeGreeting || getDynamicGreeting()}</span>
                    </span>
                    <span className="text-[10.5px] sm:text-[11px] font-bold text-[#544026] bg-[#ddcfb6] px-3 py-1 rounded-full border border-[#c5b497] shadow-xs inline-flex items-center space-x-1">
                      <span className="text-[#8c6b3e] font-bold">@</span>
                      <span className="truncate max-w-[130px] sm:max-w-[200px]">{userProfile.targetGoal || 'Jee Exams'}</span>
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setIsEditingProfile(true);
                      setShowOnboardingModal(true);
                    }}
                    className="p-1.5 text-[#544026] hover:text-[#3d2e1f] hover:bg-[#d5c5a7]/60 rounded-lg transition border border-transparent hover:border-[#c5b497] cursor-pointer flex items-center space-x-1 text-xs font-semibold"
                    title="Edit Profile"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                {/* Main Student Profile & Avatar Section */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#947447] drop-shadow-[0_1px_0_rgba(255,255,255,0.9)] tracking-tight flex items-center gap-2">
                        <span className="truncate">{userProfile.name || 'Student'}</span>
                        <span className="text-xl shrink-0">🚀</span>
                      </h2>
                      <p className="text-xs text-[#6b583e] font-bold flex items-center space-x-1.5 mt-0.5">
                        <UserIcon className="w-3.5 h-3.5 text-[#8c6b3e] shrink-0" />
                        <span className="truncate">{userProfile.schoolName || 'School / College Not Set'}</span>
                      </p>
                    </div>

                    {/* Organized Student Info Badges - Dark Charcoal & Metallic Look */}
                    <div className="flex flex-col gap-1.5 pt-0.5">
                      <div className="inline-flex">
                        <span className="px-3 py-1 bg-[#3f3933] text-[#eae2d5] text-xs font-bold rounded-xl border border-[#595249] flex items-center space-x-1.5 shadow-sm">
                          <GraduationCap className="w-3.5 h-3.5 text-[#dfc285] shrink-0" />
                          <span>{userProfile.className ? (userProfile.className.startsWith('Class') ? userProfile.className : `Class ${userProfile.className}`) : 'Class 12th (Science)'}</span>
                        </span>
                      </div>

                      {userProfile.email && (
                        <div className="inline-flex">
                          <span className="px-3 py-1 bg-[#3f3933] text-[#eae2d5] text-xs font-medium rounded-xl border border-[#595249] flex items-center space-x-1.5 shadow-sm truncate max-w-[240px]">
                            <Mail className="w-3.5 h-3.5 text-[#dfc285] shrink-0" />
                            <span className="truncate">{userProfile.email}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Avatar with click action - Navy & Golden Metallic Frame */}
                  <div className="shrink-0 flex flex-col items-center">
                    <div 
                      onClick={() => setShowAvatarModal(true)}
                      className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#1b3452] via-[#162c46] to-[#0d1c2e] border-2 border-[#d6c4a6] shadow-lg flex items-center justify-center relative cursor-pointer group active:scale-95 transition overflow-hidden p-1"
                      title="Change Avatar"
                    >
                      <UserAvatar
                        avatar={userProfile.avatar}
                        name={userProfile.name || 'Student'}
                        avatarType={userProfile.avatarType}
                        avatarBg={userProfile.avatarBg}
                        size="xl"
                        className="w-full h-full flex items-center justify-center"
                      />
                      {/* Golden Coin / Cog Badge */}
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-tr from-[#c99b42] via-[#f5d98b] to-[#b8860b] border-2 border-[#3f3933] flex items-center justify-center text-[10px] shadow-sm font-black text-[#3d2e1f] z-20">
                        ⚙️
                      </div>
                    </div>
                    <span 
                      onClick={() => setShowAvatarModal(true)}
                      className="text-[11px] font-extrabold text-[#6b583e] hover:text-[#3d2e1f] text-center mt-1 cursor-pointer"
                    >
                      Change
                    </span>
                  </div>
                </div>

                {/* 3-Column Skeuomorphic & Metallic Stats Boxes */}
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5 pt-1">
                  {/* BOX 1: STREAK (Metallic Bronze) */}
                  <div className="bg-gradient-to-b from-[#4d3e33] via-[#3a2e26] to-[#2b211a] border-2 border-[#7e644e] rounded-2xl p-2 sm:p-2.5 text-center shadow-md relative overflow-hidden">
                    <div className="text-[10px] sm:text-[11px] text-[#dfc285] font-black uppercase tracking-wider flex items-center justify-center space-x-1 drop-shadow-xs">
                      <span>🔥</span>
                      <span>STREAK</span>
                    </div>
                    <div className="text-base sm:text-lg font-black text-white mt-0.5">
                      {userProfile.streak || 5} <span className="text-xs font-semibold text-[#c5b497]">days</span>
                    </div>
                  </div>

                  {/* BOX 2: LEVEL (Brushed Silver Steel) */}
                  <div className="bg-gradient-to-b from-[#e5e5e5] via-[#cccccc] to-[#a8a8a8] border-2 border-[#828282] rounded-2xl p-2 sm:p-2.5 text-center shadow-md relative overflow-hidden">
                    <div className="text-[10px] sm:text-[11px] text-slate-700 font-black uppercase tracking-wider flex items-center justify-center space-x-1">
                      <span>📓</span>
                      <span>LEVEL</span>
                    </div>
                    <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                      Lvl {userProfile.level || 7}
                    </div>
                  </div>

                  {/* BOX 3: TOTAL XP (Metallic Bronze) */}
                  <div className="bg-gradient-to-b from-[#4d3e33] via-[#3a2e26] to-[#2b211a] border-2 border-[#7e644e] rounded-2xl p-2 sm:p-2.5 text-center shadow-md relative overflow-hidden">
                    <div className="text-[10px] sm:text-[11px] text-[#dfc285] font-black uppercase tracking-wider flex items-center justify-center space-x-1 drop-shadow-xs">
                      <span>⭐</span>
                      <span>TOTAL XP</span>
                    </div>
                    <div className="text-base sm:text-lg font-black text-white mt-0.5">
                      {userProfile.xp || 665} <span className="text-xs font-semibold text-[#c5b497]">XP</span>
                    </div>
                  </div>
                </div>

                {/* Level & XP Progress Section - Deep Navy & Golden Border */}
                <div className="bg-gradient-to-r from-[#0d2238] via-[#102a45] to-[#0d2238] border-2 border-[#b89c68] rounded-2xl p-3 shadow-md space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-sky-200 text-[11px] font-bold">Level {userProfile.level || 7} Progress:</span>
                      <span className="text-white text-[11px] font-black">
                        {userProfile.xp ? (userProfile.xp % 100) : 65} / 100 <span className="text-sky-300 font-normal">XP</span>
                      </span>
                    </div>
                    <button 
                      onClick={() => addXp(10)}
                      className="text-xs text-sky-100 hover:text-white bg-[#18395c] hover:bg-[#204a75] border border-[#3b6d9e] flex items-center space-x-1 cursor-pointer font-bold transition px-2.5 py-1 rounded-xl shadow-xs active:scale-95"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>+10 XP Booster</span>
                    </button>
                  </div>
                  <div className="w-full h-3.5 bg-[#091522] border border-[#2b4c6e] rounded-full relative p-0.5 shadow-inner flex items-center">
                    <div 
                      className="h-full bg-gradient-to-r from-[#1d4ed8] via-[#3b82f6] to-[#d4af37] rounded-full relative transition-all duration-500 flex items-center"
                      style={{ width: `${Math.max(10, userProfile.xp ? (userProfile.xp % 100) : 65)}%` }}
                    >
                      {/* Golden Pip / Slider Knob */}
                      <div className="w-4 h-4 bg-gradient-to-tr from-[#ffd700] to-[#fff8dc] border-2 border-[#8b6914] rounded-full shadow-[0_0_10px_rgba(255,215,0,0.9)] absolute right-0 top-1/2 -translate-y-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CLOUD AUTH & SYNC BANNER (WHEN NOT FULLY AUTHENTICATED) */}
            {(!currentUser || currentUser.isAnonymous) && (
              <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-2xl p-3.5 sm:p-4 text-white flex items-center justify-between gap-3 shadow-md border border-indigo-800/60">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-black flex items-center gap-1.5 text-indigo-200">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>{appLanguage === 'hi' ? 'क्लाउड सिंक और +150 XP बोनस' : 'Sync Progress & Get +150 XP Bonus'}</span>
                  </p>
                  <p className="text-[11px] text-slate-300 line-clamp-1">
                    {appLanguage === 'hi' 
                      ? 'गूगल या ईमेल से साइन इन करें ताकि नोट्स और परीक्षाएं सुरक्षित रहें।'
                      : 'Sign in with Google or Email to backup your study progress across devices.'}
                  </p>
                </div>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-indigo-950 font-black text-xs rounded-xl transition cursor-pointer shrink-0 shadow-xs active:scale-95 flex items-center space-x-1"
                >
                  <LogIn className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{appLanguage === 'hi' ? 'लॉग इन' : 'Sign In'}</span>
                </button>
              </div>
            )}

            {/* 2. ACADEMY PLAYGROUND - MATCHING USER EDIT DESIGN */}
            <div className="space-y-3">
              <h3 className="font-black text-white text-xs tracking-wider uppercase flex items-center space-x-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="bg-gradient-to-r from-white via-cyan-100 to-indigo-200 bg-clip-text text-transparent">ACADEMY PLAYGROUND 🚀</span>
              </h3>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
                {/* CARD 1: AI TUTOR - CYAN NEON GLOW */}
                <motion.button
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('aiTutor')}
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

                {/* CARD 2: IMAGE GEN - PURPLE NEON GLOW */}
                <motion.button
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('imageGen')}
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
                  onClick={() => setActiveTab('mockExam')}
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
                  onClick={() => setActiveTab('studyDocs')}
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
              </div>

              {/* ADVANCED STUDY TOOLKIT BANNER - EXACT MATCH WITH REFERENCE IMAGE */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                className="w-full p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#080d20] via-[#0f1738] to-[#1a0f3d] border-2 border-indigo-500/50 shadow-[0_0_35px_rgba(99,102,241,0.3)] text-white relative overflow-hidden group"
              >
                {/* Ambient cosmic glows */}
                <div className="absolute -right-10 -top-10 w-48 h-48 bg-indigo-500/25 rounded-full blur-3xl group-hover:bg-indigo-500/35 transition-all pointer-events-none" />
                <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

                {/* Subtle digital code / matrix watermark overlay */}
                <div className="absolute right-12 top-2 bottom-2 w-48 opacity-10 pointer-events-none hidden sm:block font-mono text-[8px] text-indigo-300 select-none overflow-hidden">
                  <div>const studyFlow = async () =&gt; &#123;</div>
                  <div>&nbsp;&nbsp;await brain.activate();</div>
                  <div>&nbsp;&nbsp;return &#123; solved: true, xp: +50 &#125;;</div>
                  <div>&#125;</div>
                </div>

                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center space-x-3.5">
                    {/* Glowing Sparkle Badge */}
                    <motion.div
                      whileHover={{ rotate: 12, scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openToolkitWithTool()}
                      className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-500 flex items-center justify-center text-white shrink-0 shadow-[0_0_20px_rgba(99,102,241,0.5)] cursor-pointer border border-indigo-300/40"
                    >
                      <Sparkles className="w-7 h-7 text-white animate-pulse" />
                    </motion.div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 uppercase">
                          18 ➔ ADVANCED TOOLS
                        </span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                      </div>
                      <h4 
                        onClick={() => openToolkitWithTool()}
                        className="font-extrabold text-base sm:text-lg text-white mt-1 cursor-pointer hover:text-indigo-300 transition flex items-center gap-1.5"
                      >
                        <span>Advanced Study Toolkit</span>
                        <span className="text-amber-400">⚡</span>
                      </h4>
                      <p className="text-[11px] text-slate-300/80 mt-0.5 leading-relaxed max-w-md font-medium">
                        Scientific Calculator, Mind Maps, Mock Tests, Ambient Sounds & OCR Vision
                      </p>
                    </div>
                  </div>

                  {/* Circular Chevron Button */}
                  <motion.button
                    whileHover={{ scale: 1.1, x: 2 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => openToolkitWithTool()}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-indigo-600 text-slate-200 hover:text-white transition-all shadow-md border border-white/20 flex items-center justify-center cursor-pointer shrink-0"
                    title="Launch Toolkit"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Quick-Launch Animated Tool Chips */}
                <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none relative z-10">
                  {[
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
                      whileHover={{ scale: 1.05, y: -1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openToolkitWithTool(tool.id)}
                      className="px-3 py-1.5 rounded-2xl bg-slate-900/90 hover:bg-indigo-950/90 border border-slate-700/80 hover:border-indigo-400/60 text-[11px] font-bold text-slate-200 hover:text-white whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      {tool.name}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* 4. 5-DAY STUDY STREAK - MATCHING USER EDIT DESIGN */}
            <div className="rounded-3xl p-4 sm:p-5 border-2 border-indigo-500/70 bg-gradient-to-b from-[#101432] via-[#0b0e26] to-[#070a1e] text-white shadow-[0_0_30px_rgba(99,102,241,0.25)] space-y-3.5 sm:space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-white text-xs sm:text-sm tracking-wide uppercase flex items-center space-x-1.5">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span>5-DAY STUDY STREAK</span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Complete goals to keep momentum high</p>
                </div>

                {/* Streak Badge Pill */}
                <div className="px-3 py-1.5 sm:px-3.5 sm:py-1.5 bg-gradient-to-r from-amber-500/20 via-amber-600/10 to-amber-500/20 border border-amber-400/60 rounded-2xl text-xs font-black text-amber-200 flex items-center gap-2 shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                  <span className="text-sm">💎</span>
                  <div className="leading-tight text-right sm:text-left">
                    <div className="font-black text-[11px] sm:text-xs text-amber-100">Streak: {userProfile.streak}/5</div>
                    <div className="text-[9px] font-bold text-amber-300/80 uppercase tracking-wider">Days</div>
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
                    <div 
                      key={idx}
                      className={`p-2 sm:p-3 rounded-2xl text-center flex flex-col items-center justify-between h-22 sm:h-26 transition-all ${
                        isHighlighted
                          ? 'border-2 border-amber-400 bg-slate-900/90 shadow-[0_0_15px_rgba(251,191,36,0.35)] text-amber-100'
                          : 'border border-slate-800/80 bg-[#0d122b]/80 text-slate-300'
                      }`}
                    >
                      <div className={`text-[8.5px] sm:text-[10px] font-black uppercase tracking-wider ${isHighlighted ? 'text-amber-300' : 'text-slate-500'}`}>
                        {item.d}
                      </div>
                      <div className={`font-black text-xs sm:text-sm ${isHighlighted ? 'text-amber-100' : 'text-slate-200'}`}>
                        {item.w}
                      </div>
                      <div className="flex justify-center items-center">
                        <span className="text-xs sm:text-sm">🎯</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* GOAL BOX */}
              <div className="p-3.5 sm:p-4 bg-[#0c122e]/90 border border-indigo-950/80 rounded-2xl flex items-center justify-between relative overflow-hidden">
                <div className="pr-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[9px] sm:text-[10px] font-black bg-indigo-950 text-indigo-300 border border-indigo-700/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      DAY 1 GOAL
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-600/60 px-2 py-0.5 rounded-full">
                      +20 XP
                    </span>
                  </div>
                  <p className="font-extrabold text-white text-xs sm:text-sm mt-1.5 max-w-xs leading-snug">
                    Ask AI Tutor a homework question
                  </p>
                </div>

                {/* Task Complete Button with Festive Confetti Sprinkles */}
                <div className="relative shrink-0">
                  <div className="absolute -top-2.5 -left-2.5 pointer-events-none text-xs animate-bounce select-none">🎉</div>
                  <div className="absolute -bottom-2 -left-1.5 pointer-events-none text-[10px] select-none text-cyan-400">✦</div>
                  <div className="absolute -top-2 -right-1.5 pointer-events-none text-[10px] select-none text-amber-300">★</div>
                  <div className="absolute -bottom-2.5 -right-2 pointer-events-none text-xs select-none">🎊</div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCompleteDayGoal}
                    className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl font-black text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] transition flex flex-col items-center justify-center leading-tight cursor-pointer"
                  >
                    <span>Task</span>
                    <span>Complete!</span>
                  </motion.button>
                </div>
              </div>
            </div>

            {/* 5. DAILY STUDY QUESTS - MATCHING USER EDIT DESIGN */}
            <div className="rounded-3xl p-4 sm:p-5 border-2 border-slate-800/90 bg-gradient-to-b from-[#0e142e] via-[#090d22] to-[#060919] text-white shadow-[0_0_25px_rgba(30,58,138,0.25)] space-y-3.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-white text-xs sm:text-sm tracking-wide uppercase flex items-center space-x-1.5">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span>DAILY STUDY QUESTS</span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Finish missions, gain bonus XP</p>
                </div>
                <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/40 text-amber-300 font-bold text-[11px] sm:text-xs rounded-full flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                  <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Streak: 5 Days</span>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-2.5">
                {quests.map((q) => (
                  <motion.div 
                    key={q.id} 
                    whileHover={{ y: -1, scale: 1.005 }}
                    onClick={() => handleCompleteQuest(q.id)}
                    className="p-3 sm:p-3.5 bg-[#0c1430]/80 hover:bg-[#101b3d] border border-indigo-950/80 rounded-2xl flex items-center justify-between transition group cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center space-x-3 pr-2">
                      <button 
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition shrink-0 ${
                          q.completed 
                            ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]' 
                            : 'border-2 border-indigo-400/40 group-hover:border-indigo-400'
                        }`}
                      >
                        {q.completed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : null}
                      </button>
                      <span className={`text-xs sm:text-sm font-bold transition ${q.completed ? 'line-through text-slate-500' : 'text-slate-100 group-hover:text-white'}`}>
                        {q.title}
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-black text-emerald-300 bg-emerald-950/90 px-2.5 py-1 rounded-full border border-emerald-500/40 shadow-xs shrink-0">
                      +{q.xp} XP
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* 6. FOCUS SESSION & TIMER - SLIM & COMPACT */}
            <div className="bg-[#100d24]/90 rounded-2xl p-3 border border-purple-800/50 shadow-[0_0_15px_rgba(168,85,247,0.15)] space-y-2 backdrop-blur-sm">
              {/* Header: Subject Selector & Time Duration Pills */}
              <div className="flex items-center justify-between flex-wrap gap-1.5">
                <div className="relative min-w-[130px] sm:min-w-[160px]">
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value as Subject)}
                    className="w-full appearance-none px-2.5 py-1 bg-[#1b153b] border border-purple-800/60 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-purple-400 shadow-xs pr-6 cursor-pointer"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s} className="bg-[#151030] text-white">{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-purple-300 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="flex items-center space-x-1 p-0.5 bg-[#181338] rounded-lg border border-purple-800/40">
                  {[5, 25, 50].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setDurationMinutes(mins)}
                      className={`px-2 py-0.5 rounded-md text-[10.5px] font-black transition cursor-pointer ${
                        durationMinutes === mins
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                          : 'text-purple-200/70 hover:text-white'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              {/* TIMER DISPLAY - COMPACT LOW-PROFILE CONTAINER */}
              <div className="py-2 px-3 bg-[#0a071c] border border-purple-500/30 rounded-xl text-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] relative overflow-hidden flex items-center justify-between">
                <span className="text-[9px] font-extrabold text-purple-300 tracking-[0.15em] uppercase">
                  FOCUS TIMER
                </span>
                <div className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-white select-none drop-shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                  {formatTimerTime(timerSeconds)}
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={toggleTimer}
                    className="px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-400/40 text-white font-extrabold rounded-lg shadow-[0_0_8px_rgba(168,85,247,0.3)] transition flex items-center space-x-1 text-[11px] cursor-pointer active:scale-95"
                  >
                    {isTimerRunning ? <Pause className="w-2.5 h-2.5 fill-white" /> : <Play className="w-2.5 h-2.5 fill-white ml-0.5" />}
                    <span>{isTimerRunning ? 'Pause' : 'Start'}</span>
                  </button>
                  <button
                    onClick={resetTimer}
                    className="w-6 h-6 bg-[#1e1742] hover:bg-[#2a205a] text-purple-200 rounded-lg transition border border-purple-700/50 shadow-xs flex items-center justify-center cursor-pointer active:scale-95"
                    title="Reset Timer"
                  >
                    <RotateCcw className="w-3 h-3 text-purple-300" />
                  </button>
                </div>
              </div>
            </div>

            {/* 7. ACADEMIC BADGES - COMPACT MATTE PARCHMENT & BRONZE AESTHETIC */}
            <div className="bg-[#2d221a] p-1.5 rounded-2xl border border-[#3e3025] shadow-xl">
              <div className="bg-gradient-to-b from-[#f6efe1] via-[#ece2ce] to-[#e4d6bf] rounded-xl border border-[#d5c2a3] p-3 shadow-[inset_0_1px_3px_rgba(255,255,255,0.8),0_2px_8px_rgba(0,0,0,0.2)] space-y-2 relative overflow-hidden text-[#3d2e1f]">
                <div className="flex items-center justify-between border-b border-[#ddcdb4] pb-1.5">
                  <h3 className="font-serif font-black text-[#544026] text-xs tracking-wider uppercase flex items-center space-x-1.5">
                    <span className="text-sm text-[#8c6b3e]">🎖️</span>
                    <span>ACADEMIC BADGES</span>
                  </h3>
                  <span className="text-[9px] font-black bg-[#3f3226] text-[#dfc285] border border-[#5a4837] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                    1 EARNED
                  </span>
                </div>

                <div className="flex items-center space-x-2.5 overflow-x-auto pb-0.5 scrollbar-none">
                  {/* BADGE 1: QUICK START (EARNED - GOLDEN GLOW) */}
                  <div className="bg-gradient-to-b from-[#fffef9] to-[#f5edd9] border border-[#cca25a] shadow-[0_0_10px_rgba(204,162,90,0.35)] rounded-xl p-2 text-center flex flex-col items-center justify-between w-20 h-22 shrink-0 relative overflow-hidden cursor-pointer hover:scale-105 transition-transform">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-b from-[#fef0c7] to-[#fde047]/40 flex items-center justify-center text-base shadow-inner">
                      🚀
                    </div>
                    <div>
                      <div className="font-black text-[10.5px] text-[#2a2016] leading-tight">Quick Start</div>
                      <div className="text-[7.5px] font-bold text-[#8c7b69] mt-0.5">01/07/2028</div>
                    </div>
                  </div>

                  {/* BADGE 2: BRONZE METALLIC EMPTY FRAME */}
                  <div className="border border-[#b08762] bg-[#e4d6bf]/40 rounded-xl w-20 h-22 shrink-0 flex items-center justify-center shadow-xs">
                  </div>

                  {/* BADGE 3: MORE / STUDY ON (DASHED BORDER) */}
                  <div className="border border-dashed border-[#c2b5a3] bg-[#eae2d3]/50 rounded-xl w-20 h-22 shrink-0 flex flex-col items-center justify-center text-center space-y-0.5">
                    <span className="text-[10px] font-black text-[#6e5f4e]">+ more</span>
                    <span className="text-[7px] font-black text-[#9e8f7c] tracking-widest uppercase">STUDY ON</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 8. STUDY LEADERBOARD - WHITE MARBLE & OBSIDIAN METALLIC LOOK */}
            {/* 8. STUDY LEADERBOARD - MATTE WOODEN & PARCHMENT CLASSIC LOOK */}
            <div className="bg-[#2d221a] p-2 sm:p-2.5 rounded-[30px] border border-[#3e3025] shadow-2xl">
              <div className="bg-gradient-to-b from-[#f6efe1] via-[#ece2ce] to-[#e4d6bf] rounded-[22px] border-2 border-[#d5c2a3] p-4 sm:p-5 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_4px_12px_rgba(0,0,0,0.25)] space-y-3.5 sm:space-y-4 text-[#3d2e1f]">
                {(() => {
                  const leaderboardUsers = [
                    { id: 'me', name: `${userProfile.name || 'You'} (You)`, icon: '⭐', xp: userProfile.xp || 655, level: `LEVEL ${userProfile.level || 7} • RANK CLASSMATE`, isUser: true },
                    { id: 'bob', name: 'Bob Verma', icon: '🦊', xp: 340, level: 'LEVEL 4 • RANK CLASSMATE', isUser: false },
                    { id: 'alice', name: 'Alice Sharma', icon: '🦄', xp: 280, level: 'LEVEL 3 • RANK CLASSMATE', isUser: false },
                    { id: 'sarah', name: 'Sarah Patel', icon: '🦉', xp: 195, level: 'LEVEL 2 • RANK CLASSMATE', isUser: false }
                  ].sort((a, b) => b.xp - a.xp);

                  return (
                    <>
                      <div className="flex items-center justify-between border-b border-[#ddcdb4] pb-2.5">
                        <h3 className="font-serif font-black text-[#544026] text-xs sm:text-sm tracking-wider uppercase flex items-center space-x-2">
                          <span className="text-base text-[#8c6b3e]">🎖️</span>
                          <span>STUDY LEADERBOARD</span>
                        </h3>
                        <span className="text-[10px] font-black bg-[#3f3226] text-[#dfc285] border border-[#5a4837] px-3.5 py-1 rounded-full uppercase tracking-wider shadow-xs">
                          CLASS RANK #1
                        </span>
                      </div>

                      <div className="space-y-2">
                        {leaderboardUsers.map((item, index) => {
                          const rankNum = index + 1;
                          
                          if (item.isUser) {
                            // RANK 1 (YOU): RICH DARK WALNUT WITH CARVED BRONZE BORDER
                            return (
                              <div 
                                key={item.id}
                                className="bg-gradient-to-r from-[#2a1f18] via-[#382b22] to-[#241a14] border-2 border-[#8c6b3e] rounded-[20px] p-3 sm:p-3.5 flex items-center justify-between shadow-lg text-white relative overflow-hidden"
                              >
                                <div className="flex items-center space-x-3 min-w-0">
                                  <span className="text-base select-none shrink-0">🎖️</span>
                                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1b3452] to-[#0d1c2e] border border-[#d6c4a6] flex items-center justify-center text-xs overflow-hidden shrink-0 shadow-xs">
                                    <UserAvatar
                                      avatar={userProfile.avatar}
                                      name={userProfile.name || 'Student'}
                                      avatarType={userProfile.avatarType}
                                      avatarBg={userProfile.avatarBg}
                                      size="sm"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="font-serif font-black text-xs sm:text-sm text-white truncate">
                                      {item.name}
                                    </h4>
                                    <p className="text-[8.5px] font-extrabold text-[#dfc285] tracking-wider uppercase truncate">
                                      {item.level}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-3 shrink-0">
                                  {/* Golden Wreath Coin */}
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-b from-[#8f5e38] via-[#bf8758] to-[#6d4220] border-2 border-[#d9a87d] flex items-center justify-center text-white font-serif font-black text-xs shadow-md">
                                    ①
                                  </div>
                                  <span className="font-serif font-black text-base sm:text-lg text-[#f3d393] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                                    {item.xp} XP
                                  </span>
                                </div>
                              </div>
                            );
                          }

                          // RANK 2 & OTHERS: MATTE PARCHMENT / WARM OAK SLATS
                          return (
                            <div 
                              key={item.id}
                              className="bg-gradient-to-r from-[#fdfbf7] via-[#f7f0e4] to-[#f1e6d5] border border-[#d8c9b2] rounded-[20px] p-3 sm:p-3.5 flex items-center justify-between shadow-xs hover:border-[#bfa98b] transition"
                            >
                              <div className="flex items-center space-x-3 min-w-0">
                                <span className="text-base select-none shrink-0">
                                  {rankNum === 2 ? '🥈' : '🥉'}
                                </span>
                                <div className="w-8 h-8 rounded-xl bg-[#3f3933] border border-[#595249] flex items-center justify-center text-sm shrink-0 shadow-2xs text-[#dfc285]">
                                  {item.icon}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-serif font-black text-xs sm:text-sm text-[#2e2319] truncate">
                                    {item.name}
                                  </h4>
                                  <p className="text-[8.5px] font-bold text-[#7d6954] tracking-wider uppercase truncate">
                                    {item.level}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center space-x-3 shrink-0">
                                {/* Silver/Bronze Wreath Coin */}
                                <div className="w-8 h-8 rounded-full bg-gradient-to-b from-[#e5e5e5] via-[#cccccc] to-[#a8a8a8] border-2 border-[#828282] flex items-center justify-center text-slate-800 font-serif font-black text-xs shadow-xs">
                                  {rankNum === 2 ? '②' : '③'}
                                </div>
                                <span className="font-serif font-black text-base sm:text-lg text-[#7d6044] drop-shadow-xs">
                                  {item.xp} XP
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* 9. ONLINE CLASSMATES - FUSION OF CLASSIC ASTRONOMY & FUTURISTIC SPACE SCI-FI TELEMETRY */}
            <div className="bg-gradient-to-b from-[#1b1510] via-[#101524] to-[#0a0f1d] p-2 sm:p-2.5 rounded-[30px] border-2 border-[#8c6b3e]/60 shadow-[0_10px_30px_rgba(0,0,0,0.8)] relative overflow-hidden">
              {/* Subtle Cosmic Constellation & Astrolabe Grid Overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_90%_at_50%_-10%,rgba(223,194,133,0.15),rgba(14,165,233,0.12),rgba(0,0,0,0))] pointer-events-none" />
              
              {/* Corner Brass Celestial Brackets */}
              <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-[#dfc285]/70 pointer-events-none rounded-tl-sm" />
              <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-[#dfc285]/70 pointer-events-none rounded-tr-sm" />
              <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-[#dfc285]/70 pointer-events-none rounded-bl-sm" />
              <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-[#dfc285]/70 pointer-events-none rounded-br-sm" />

              <div className="bg-gradient-to-b from-[#141b2e]/95 via-[#0e1424]/95 to-[#080d19]/95 rounded-[22px] border border-[#2a3756] p-4 sm:p-5 shadow-[inset_0_1px_4px_rgba(223,194,133,0.2),0_8px_25px_rgba(0,0,0,0.7)] space-y-3.5 relative z-10 text-slate-100">
                {/* Traditional Astronomical Header with Sci-Fi Orbital Readout */}
                <div className="flex items-center justify-between border-b border-[#223150] pb-3">
                  <div className="flex items-center space-x-2.5">
                    {/* Brass Astrolabe Compass Emblem */}
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#4a3b2c] via-[#2a2016] to-[#121929] border border-[#dfc285] flex items-center justify-center text-sm shadow-md text-[#dfc285]">
                      🧭
                    </div>
                    <div>
                      <h3 className="font-serif font-black text-[#f3e3c3] text-xs sm:text-sm tracking-wider uppercase flex items-center space-x-1.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                        <span>CELESTIAL CREW</span>
                        <span className="text-[9.5px] text-[#dfc285]/80 font-mono font-bold tracking-widest hidden sm:inline">[ORBIT-04]</span>
                      </h3>
                      <p className="text-[8.5px] font-mono text-sky-300/80 uppercase tracking-widest">
                        ASTRONOMICAL TELEMETRY SYNC
                      </p>
                    </div>
                  </div>

                  {/* Active Radar & Astrolabe Beacon Status Pill */}
                  <div className="flex items-center space-x-1.5 bg-gradient-to-r from-[#1e1710] to-[#0c1a2e] border border-[#8c6b3e] text-[#dfc285] px-3.5 py-1 rounded-full text-[10px] font-black font-mono uppercase tracking-wider shadow-inner">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,1)]"></span>
                    </span>
                    <span>{classmates.filter(c => c.online).length} IN ORBIT</span>
                  </div>
                </div>

                {/* Classmates Astrolabe Pod List */}
                <div className="space-y-2.5">
                  {classmates.map((peer) => (
                    <div 
                      key={peer.id} 
                      className="p-3 bg-gradient-to-r from-[#172036] via-[#10172a] to-[#161c2d] border border-[#2c3d63] hover:border-[#dfc285]/70 rounded-2xl flex items-center justify-between shadow-md transition group"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        {/* Brass Porthole / Cosmonaut Pod Avatar */}
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#241c14] via-[#11192e] to-[#020617] border-2 border-[#b89558] flex items-center justify-center text-lg relative shadow-inner shrink-0 text-white">
                          {peer.avatar}
                          {/* Pulsing Emerald Starlight Beacon */}
                          <span 
                            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#10172a] flex items-center justify-center ${
                              peer.online 
                                ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]' 
                                : 'bg-slate-600'
                            }`}
                          >
                            {peer.online && <span className="w-1 h-1 rounded-full bg-white animate-ping" />}
                          </span>
                        </div>

                        {/* Crew Details, Classic Serif Name & Space Telemetry */}
                        <div className="min-w-0">
                          <h4 className="font-serif font-black text-xs sm:text-sm text-[#f6efe1] flex items-center space-x-1.5 truncate drop-shadow-xs">
                            <span>{peer.name}</span>
                            <span className="text-[9px] text-[#dfc285] font-mono font-bold tracking-tight">✦ POD</span>
                          </h4>
                          <p className="text-[9.5px] font-mono text-slate-300 flex items-center space-x-1.5 mt-0.5 truncate">
                            <span className="text-sky-400 font-bold">FOCUS:</span>
                            <span className="text-slate-100 font-semibold truncate">{peer.focus}</span>
                          </p>
                        </div>
                      </div>

                      {/* Classic-SciFi Wave / Quantum Beacon Button */}
                      <div className="shrink-0 pl-2">
                        {peer.online ? (
                          <button
                            onClick={() => handleWaveBack(peer.id)}
                            className={`px-3.5 py-1.5 rounded-xl text-[10.5px] font-mono font-bold transition shadow-md cursor-pointer active:scale-95 flex items-center space-x-1.5 ${
                              peer.waved
                                ? 'bg-gradient-to-r from-[#064e3b] to-[#065f46] text-emerald-200 border border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                                : 'bg-gradient-to-r from-[#8c6b3e] via-[#4f46e5] to-[#0284c7] hover:from-[#a37d48] hover:to-[#38bdf8] text-[#fff8eb] border border-[#dfc285]/70 shadow-[0_0_12px_rgba(223,194,133,0.35)]'
                            }`}
                          >
                            <span className="text-xs">{peer.waved ? '📡' : '🛰️'}</span>
                            <span className="tracking-wider">{peer.waved ? 'LINKED' : 'TRANSMIT'}</span>
                          </button>
                        ) : (
                          <span className="text-[9px] font-mono font-bold text-slate-500 bg-[#0a0f1c] border border-slate-800 px-2.5 py-1 rounded-xl">
                            DORMANT
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 10. CHIMPU'S SANCTUARY (VIRTUAL FRIEND) */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-xs tracking-wide uppercase flex items-center space-x-1.5">
                  <Heart className="w-3.5 h-3.5 text-emerald-500" />
                  <span>CHIMPU'S SANCTUARY</span>
                </h3>
                <span className="text-[9px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  VIRTUAL FRIEND
                </span>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 text-center space-y-2 relative overflow-hidden">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-4xl mx-auto shadow-xs relative">
                  🐼
                  {equippedAccessory && (
                    <span className="absolute -top-2 -right-2 text-xl">{equippedAccessory}</span>
                  )}
                </div>

                <div className="inline-block bg-white px-3 py-1 rounded-full shadow-xs border border-slate-200 text-xs font-bold text-slate-800">
                  🥰 Let's study together, {userProfile.name || 'Friend'}!
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1 text-left">
                    <div className="flex justify-between text-[9px] font-bold text-slate-500">
                      <span>❤️ Happiness</span>
                      <span>{petHappiness}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500" style={{ width: `${petHappiness}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <div className="flex justify-between text-[9px] font-bold text-slate-500">
                      <span>⚡ Energy</span>
                      <span>{petEnergy}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${petEnergy}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={feedBamboo}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5"
              >
                <span>🌿</span>
                <span>Feed Bamboo (-15 XP)</span>
              </button>

              <div className="space-y-1.5">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  DRESSING AREA
                </span>

                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { name: 'Top Hat', cost: 100, icon: '🎩' },
                    { name: 'Sunglasses', cost: 120, icon: '🕶️' },
                    { name: 'Crown', cost: 180, icon: '👑' },
                    { name: 'Backpack', cost: 80, icon: '🎒' }
                  ].map((item) => (
                    <button
                      key={item.name}
                      onClick={() => buyAccessory(item)}
                      className="p-2 bg-slate-50 border border-slate-200 hover:border-indigo-400 rounded-xl text-center transition flex flex-col items-center justify-between"
                    >
                      <span className="text-xl mb-0.5">{item.icon}</span>
                      <span className="text-[9px] font-bold text-slate-600">{item.cost} XP</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* STUDENT PROFILE & QUICK ACTIONS CARD */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-4 text-white border border-indigo-900/50 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left mt-2">
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
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-800">
                      Your Student Profile
                    </span>
                    <span className="text-[10px] text-amber-400 font-bold bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/60">
                      Lv {userProfile.level}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-white mt-0.5">
                    {userProfile.name || 'Student Learner'}
                  </h4>
                  <p className="text-[11px] text-slate-300 flex items-center justify-center sm:justify-start space-x-1 mt-0.5">
                    {userProfile.email ? (
                      <>
                        <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
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
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition border border-white/20 flex items-center space-x-1 shrink-0 active:scale-95 cursor-pointer"
                >
                  <span>Avatar 🎨</span>
                </button>
                <button
                  onClick={() => {
                    setIsEditingProfile(true);
                    setShowOnboardingModal(true);
                  }}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5 shrink-0 active:scale-95 cursor-pointer"
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
                {roomMessages.map((msg) => {
                  const isMe = msg.senderId === userProfile.uid;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[9px] text-slate-400 px-1 mb-0.5">{msg.senderName}</span>
                      <div className={`p-2.5 rounded-xl max-w-[85%] text-xs ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}

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
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Notebook</span>
                </h3>
                <p className="text-[10px] text-slate-500">Formula sheets, key facts & study notes</p>
              </div>

              <button
                onClick={() => setIsAddingDoc(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Note</span>
              </button>
            </div>

            {isAddingDoc && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <input
                  type="text"
                  placeholder="Note Title..."
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                />
                <textarea
                  placeholder="Write your study notes here..."
                  rows={3}
                  value={newDocContent}
                  onChange={(e) => setNewDocContent(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 resize-none"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setIsAddingDoc(false)}
                    className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveDoc}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-3">
              {studyDocs.map((doc) => (
                <div key={doc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 relative group hover:border-indigo-300 transition">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-900 text-xs">{doc.title}</h4>
                    <button
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600 whitespace-pre-wrap line-clamp-3">{doc.content}</p>
                  <div className="pt-1 text-[9px] text-indigo-600 font-bold">
                    {new Date(doc.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}

              {studyDocs.length === 0 && (
                <div className="col-span-2 text-center py-10 text-slate-400 text-xs italic">
                  No study notes saved yet. Click 'New Note' to start!
                </div>
              )}
            </div>
          </div>
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

        {/* STANDALONE DEDICATED FULL AI TUTOR APP INTERFACE */}
        {activeTab === 'aiTutor' && (
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
          />
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

      </main>

      {/* FLOATING MORE MENU OVERLAY */}
      {showMoreMenu && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 transition-opacity"
            onClick={() => setShowMoreMenu(false)}
          />
          <div className="fixed bottom-14 right-2 sm:right-6 z-50 w-72 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-2xl p-3.5 space-y-2.5 animate-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
                <span>More Features</span>
              </span>
              <button 
                onClick={() => setShowMoreMenu(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'imageGen', label: 'Image Gen', icon: ImageIcon, color: 'text-indigo-600 bg-indigo-50' },
                { id: 'whiteboard', label: 'Whiteboard', icon: PenTool, color: 'text-purple-600 bg-purple-50' },
                { id: 'mockExam', label: 'Mock Exams', icon: GraduationCap, color: 'text-amber-600 bg-amber-50' },
                { id: 'studyDocs', label: 'Notebook', icon: FileText, color: 'text-teal-600 bg-teal-50' },
                { id: 'petCompanion', label: 'Sanctuary', icon: Heart, color: 'text-rose-600 bg-rose-50' },
              ].map((item) => {
                const Icon = item.icon;
                const isItemActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setShowMoreMenu(false);
                    }}
                    className={`flex items-center space-x-2 p-2 rounded-xl transition text-left border ${
                      isItemActive
                        ? 'bg-indigo-50/80 border-indigo-200 text-indigo-700 font-bold shadow-xs'
                        : 'bg-slate-50/60 border-slate-100 hover:bg-slate-100/80 text-slate-700 font-medium'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${item.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-semibold tracking-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
              <button
                onClick={() => {
                  toggleLanguage();
                }}
                className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Lang: {appLanguage.toUpperCase()}</span>
              </button>

              <ThemeToggle variant="pill" className="w-full justify-center" />
            </div>
          </div>
        </>
      )}

      {/* COMPACT & SLIM BOTTOM STICKY NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0f141d]/95 backdrop-blur-lg border-t border-slate-800 px-4 py-1 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.6)] h-12 transition-colors duration-200">
        {[
          { id: 'home', label: 'Home', icon: BookOpen },
          { id: 'aiTutor', label: 'AI Tutor', icon: BrainCircuit, badge: 'PRO' },
          { id: 'toolkit', label: 'Tools', icon: Sparkles },
          { id: 'groupChat', label: 'Rooms', icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setShowMoreMenu(false);
                if (tab.id === 'toolkit') setInitialTool(undefined);
                setActiveTab(tab.id as any);
              }}
              className={`relative flex flex-col items-center justify-center py-0.5 px-3 rounded-lg transition-all cursor-pointer ${
                isActive
                  ? 'text-emerald-400 font-black drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                  : 'text-slate-400 hover:text-white font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4 h-4 transition-transform ${isActive ? 'scale-110 text-emerald-400' : 'text-slate-400'}`} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-3.5 px-1.5 py-0.5 bg-gradient-to-r from-emerald-600 to-indigo-600 text-white text-[7.5px] font-black rounded-full leading-none shadow-[0_0_8px_rgba(16,185,129,0.5)] border border-emerald-400/40 z-10 tracking-tight">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[9.5px] tracking-tight mt-0.5">{tab.label}</span>
            </button>
          );
        })}

        {/* MORE BUTTON */}
        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className={`relative flex flex-col items-center justify-center py-0.5 px-3 rounded-lg transition-all cursor-pointer ${
            showMoreMenu || ['whiteboard', 'mockExam', 'studyDocs', 'petCompanion', 'imageGen'].includes(activeTab)
              ? 'text-emerald-400 font-black drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]'
              : 'text-slate-400 hover:text-white font-medium'
          }`}
        >
          <div className="relative">
            <LayoutGrid className={`w-4 h-4 transition-transform ${showMoreMenu ? 'scale-110 text-indigo-600' : 'text-slate-500'}`} />
            {['whiteboard', 'mockExam', 'studyDocs', 'petCompanion', 'imageGen'].includes(activeTab) && (
              <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white" />
            )}
          </div>
          <span className="text-[9.5px] tracking-tight mt-0.5">More</span>
        </button>
      </nav>

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
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        userProfile={userProfile}
        setUserProfile={setUserProfile}
        appLanguage={appLanguage}
        onAuthSuccess={(newProfile) => {
          setUserProfile(newProfile);
        }}
      />

      {/* PWA INSTALL & OFFLINE PROMPT BANNER */}
      <PWAInstallBanner />
    </div>
  );
}
