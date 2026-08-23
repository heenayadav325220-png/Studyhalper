import { useState, useEffect, useRef } from 'react';
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
  CheckCircle2, 
  Loader2,
  Play,
  Pause,
  RotateCcw,
  BookOpen,
  Check,
  Calendar,
  ChevronRight,
  BrainCircuit,
  Award,
  LayoutGrid,
  Mail,
  X,
  Image as ImageIcon
} from 'lucide-react';
import InteractiveToolkit from './components/InteractiveToolkit';
import AiTutorApp from './components/AiTutorApp';
import ImageGenerator from './components/ImageGenerator';
import OnboardingModal from './components/OnboardingModal';
import { TRANSLATIONS, Language } from './services/translations';
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
import { generateQuiz } from './services/geminiService';
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

  const handleSaveProfile = (data: { name: string; email?: string; schoolName: string; className: string; targetGoal: string }) => {
    const updated: UserProfile = {
      ...userProfile,
      name: data.name,
      email: data.email || '',
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
            const saved = localStorage.getItem('ascend_user_profile') || localStorage.getItem(`user_profile_${userProfile.uid}`);
            if (saved) localSaved = JSON.parse(saved);
          } catch (e) {}

          const isDoneLocal = localStorage.getItem(`ascend_onboarded_${userProfile.uid}`) === 'true' || localStorage.getItem('ascend_onboarded') === 'true';

          const name = localSaved.name !== undefined ? localSaved.name : (prev.name || profile.name || '');
          const email = localSaved.email !== undefined ? localSaved.email : (prev.email || profile.email || '');
          const schoolName = localSaved.schoolName !== undefined ? localSaved.schoolName : (prev.schoolName || profile.schoolName || '');
          const className = localSaved.className !== undefined ? localSaved.className : (prev.className || profile.className || '');
          const targetGoal = localSaved.targetGoal !== undefined ? localSaved.targetGoal : (prev.targetGoal || profile.targetGoal || '');
          const onboardedState = isDoneLocal || localSaved.isOnboarded || prev.isOnboarded || profile.isOnboarded || false;

          return {
            ...profile,
            ...prev,
            ...localSaved,
            name,
            email,
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
  const [_mockExams, setMockExams] = useState<MockExam[]>([]);
  const [examSubject, setExamSubject] = useState<Subject>('Science');
  const [examTopic, setExamTopic] = useState<string>('Laws of Motion');
  const [isGeneratingExam, setIsGeneratingExam] = useState(false);
  const [activeExam, setActiveExam] = useState<MockExam | null>(null);
  const [userExamAnswers, setUserExamAnswers] = useState<Record<number, number>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToMockExams(userProfile.uid, (exams) => {
      setMockExams(exams);
    });
    return () => unsubscribe();
  }, [userProfile.uid]);

  const handleGenerateExam = async () => {
    if (!examTopic.trim()) return;
    setIsGeneratingExam(true);
    setExamSubmitted(false);
    setUserExamAnswers({});

    try {
      const questions = await generateQuiz(examSubject);
      const newExam: MockExam = {
        id: 'exam_' + Date.now(),
        userId: userProfile.uid,
        subject: examSubject,
        topic: examTopic,
        questionsJson: JSON.stringify(questions),
        submittedAnswersJson: '{}',
        score: 0,
        completed: false,
        feedback: '',
        timestamp: new Date().toISOString()
      };

      await saveMockExam(newExam);
      setActiveExam(newExam);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingExam(false);
    }
  };

  const handleSubmitExam = async () => {
    if (!activeExam) return;
    try {
      const questions = JSON.parse(activeExam.questionsJson);
      let correct = 0;
      questions.forEach((q: any, idx: number) => {
        if (userExamAnswers[idx] === q.answer) {
          correct++;
        }
      });

      const updatedExam: MockExam = {
        ...activeExam,
        submittedAnswersJson: JSON.stringify(userExamAnswers),
        score: correct,
        completed: true,
        feedback: `Great effort! You answered ${correct} out of ${questions.length} questions correctly.`
      };

      await saveMockExam(updatedExam);
      setActiveExam(updatedExam);
      setExamSubmitted(true);
      addXp(correct * 20);
    } catch (err) {
      console.error(err);
    }
  };

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
    <div className="bg-[#f8fafc] text-slate-800 min-h-screen font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* COMPACT TOP HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs font-black text-lg">
            🎓
          </div>
          <div>
            <h1 className="text-xs font-black tracking-tight text-slate-900">
              ASCEND STUDY
            </h1>
            <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider truncate max-w-[150px] sm:max-w-[220px]">
              {userProfile.name ? `${userProfile.name}'s Companion` : 'Student Companion'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* LANGUAGE TOGGLE */}
          <button 
            onClick={toggleLanguage}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition"
          >
            <Globe className="w-3 h-3 text-indigo-600" />
            <span>{t('languageToggle')}</span>
          </button>

          {/* ADVANCED TOOLKIT TRIGGER */}
          <button
            onClick={() => openToolkitWithTool()}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 text-[11px] font-bold shadow-xs transition"
          >
            <Sparkles className="w-3 h-3" />
            <span>19+ Tools</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA - WITH pb-24 TO AVOID BOTTOM NAV OVERLAP */}
      <main className="flex-1 p-3 sm:p-4 md:p-5 max-w-xl mx-auto w-full space-y-4 pb-24">
        {/* DASHBOARD TAB */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            
            {/* 1. TOP USER CARD (REALTIME GREETING + STUDENT INFO) */}
            <div className="bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/20 rounded-2xl p-4 sm:p-5 border border-indigo-100 shadow-xs space-y-3 relative overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center space-x-2 flex-wrap gap-1">
                    <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider bg-indigo-100/90 px-2.5 py-0.5 rounded-full inline-flex items-center space-x-1 border border-indigo-200/80 shrink-0 whitespace-nowrap shadow-2xs">
                      <span>{realtimeGreeting || getDynamicGreeting()}</span>
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center flex-wrap gap-2 pt-0.5">
                    <span>{userProfile.name ? `Hello, ${userProfile.name}!` : 'Welcome Student!'}</span>
                    <span className="animate-bounce inline-block text-xl shrink-0">🚀</span>
                  </h2>

                  {/* USER SET INFORMATION BADGES */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {userProfile.className ? (
                      <span className="px-2.5 py-1 bg-indigo-600 text-white text-[11px] font-bold rounded-xl shadow-2xs flex items-center space-x-1">
                        <span>📚 Class:</span>
                        <span className="font-extrabold">{userProfile.className}</span>
                      </span>
                    ) : null}

                    {userProfile.schoolName ? (
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-800 text-[11px] font-bold rounded-xl border border-slate-200/80 shadow-2xs flex items-center space-x-1">
                        <span>🏫 School:</span>
                        <span className="font-semibold">{userProfile.schoolName}</span>
                      </span>
                    ) : null}

                    {userProfile.targetGoal ? (
                      <span className="px-2.5 py-1 bg-amber-500/15 text-amber-800 border border-amber-500/30 text-[11px] font-bold rounded-xl shadow-2xs flex items-center space-x-1">
                        <span>🎯 Goal:</span>
                        <span className="font-extrabold">{userProfile.targetGoal}</span>
                      </span>
                    ) : null}

                    {userProfile.email && (
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[11px] font-bold rounded-xl shadow-2xs flex items-center space-x-1">
                        <Mail className="w-3 h-3 text-indigo-600" />
                        <span>{userProfile.email}</span>
                      </span>
                    )}

                    {(!userProfile.className && !userProfile.schoolName && !userProfile.targetGoal) && (
                      <button
                        onClick={() => {
                          setIsEditingProfile(true);
                          setShowOnboardingModal(true);
                        }}
                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-xl border border-indigo-200 transition flex items-center space-x-1 cursor-pointer"
                      >
                        <span>✏️ Click here to set your Class, School & Goal</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* AVATAR BOX & EDIT PROFILE */}
                <div className="flex flex-col items-end space-y-2 shrink-0">
                  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 p-0.5 shadow-md">
                    <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-2xl shadow-inner">
                      🧑‍🎓
                    </div>
                    {equippedAccessory && (
                      <span className="absolute -top-2 -right-2 text-base">{equippedAccessory}</span>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-[9px] font-bold text-slate-900 shadow-xs border border-white">
                      ⭐
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      setIsEditingProfile(true);
                      setShowOnboardingModal(true);
                    }}
                    className="text-[11px] font-extrabold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200 shadow-2xs transition flex items-center space-x-1 cursor-pointer active:scale-95"
                  >
                    <span>Edit Profile ✏️</span>
                  </button>
                </div>
              </div>

              {/* LEVEL & XP PROGRESS BAR */}
              <div className="pt-2 border-t border-indigo-100/60 flex items-center justify-between text-[11px] font-bold text-slate-600">
                <span className="text-indigo-600 font-extrabold">Level {userProfile.level}</span>
                <span>{userProfile.xp % 100}/100 XP</span>
                <button 
                  onClick={() => addXp(10)}
                  className="text-[10px] text-indigo-600 hover:underline flex items-center space-x-1 cursor-pointer font-bold"
                >
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  <span>Earn XP</span>
                </button>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500"
                  style={{ width: `${userProfile.xp % 100}%` }}
                />
              </div>
            </div>

            {/* 2. ACADEMY PLAYGROUND */}
            <div className="space-y-2.5">
              <h3 className="font-extrabold text-slate-900 text-xs tracking-wide uppercase flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>ACADEMY PLAYGROUND 🚀</span>
              </h3>

              <div className="grid grid-cols-2 gap-2.5">
                {/* CARD 1: AI TUTOR QUICK LINK - OPENS DEDICATED FULL AI APP INTERFACE */}
                <button
                  onClick={() => setActiveTab('aiTutor')}
                  className="p-3.5 rounded-2xl bg-indigo-600 text-white text-left shadow-xs hover:bg-indigo-700 transition flex flex-col justify-between h-32 group"
                >
                  <div className="flex justify-between items-start">
                    <BrainCircuit className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span className="text-[8px] font-bold uppercase bg-white/20 px-1.5 py-0.5 rounded-md">STANDALONE APP</span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm">AI Tutor ⚡</h4>
                    <p className="text-[10px] text-indigo-100 leading-tight mt-0.5">Full AI Assistant • Step-by-step solver</p>
                  </div>
                </button>

                {/* CARD 2: QUIZ */}
                <button
                  onClick={() => setActiveTab('mockExam')}
                  className="p-3.5 rounded-2xl bg-emerald-500 text-white text-left shadow-xs hover:bg-emerald-600 transition flex flex-col justify-between h-32"
                >
                  <div className="flex justify-between items-start">
                    <GraduationCap className="w-6 h-6" />
                    <span className="text-[8px] font-bold uppercase bg-white/20 px-1.5 py-0.5 rounded-md">QUIZ</span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm">Quiz 🏆</h4>
                    <p className="text-[10px] text-emerald-100 leading-tight mt-0.5">Test subject skills, earn XP</p>
                  </div>
                </button>

                {/* CARD 3: NOTEBOOK */}
                <button
                  onClick={() => setActiveTab('studyDocs')}
                  className="p-3.5 rounded-2xl bg-amber-500 text-white text-left shadow-xs hover:bg-amber-600 transition flex flex-col justify-between h-32"
                >
                  <div className="flex justify-between items-start">
                    <BookOpen className="w-6 h-6" />
                    <span className="text-[8px] font-bold uppercase bg-white/20 px-1.5 py-0.5 rounded-md">NOTEBOOK</span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm">Notebook 📝</h4>
                    <p className="text-[10px] text-amber-100 leading-tight mt-0.5">Formula sheets & key facts</p>
                  </div>
                </button>

                {/* CARD 4: PLANNER */}
                <button
                  onClick={() => openToolkitWithTool('planner')}
                  className="p-3.5 rounded-2xl bg-purple-600 text-white text-left shadow-xs hover:bg-purple-700 transition flex flex-col justify-between h-32"
                >
                  <div className="flex justify-between items-start">
                    <Calendar className="w-6 h-6" />
                    <span className="text-[8px] font-bold uppercase bg-white/20 px-1.5 py-0.5 rounded-md">PLANNER</span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm">Planner 📅</h4>
                    <p className="text-[10px] text-purple-100 leading-tight mt-0.5">Class timings & assignments</p>
                  </div>
                </button>
              </div>

              {/* ADVANCED STUDY TOOLKIT BANNER */}
              <button
                onClick={() => openToolkitWithTool()}
                className="w-full p-4 rounded-2xl bg-slate-900 text-white text-left shadow-md hover:bg-slate-800 transition flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-wider">
                      19+ ADVANCED TOOLS
                    </div>
                    <h4 className="font-extrabold text-sm text-white">Advanced Study Toolkit ⚡</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                      Scientific Calculator, Mind Maps, Mock Tests, Sounds & OCR
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition" />
              </button>
            </div>

            {/* 4. 5-DAY STUDY STREAK */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-xs tracking-wide uppercase flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>5-DAY STUDY STREAK</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Complete goals to keep momentum high</p>
                </div>

                <div className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-[10px] font-bold flex items-center space-x-1">
                  <Flame className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                  <span>Streak: {userProfile.streak}/5 Days</span>
                </div>
              </div>

              {/* DAY PILLS */}
              <div className="grid grid-cols-5 gap-1.5">
                {['DAY 1\nMon', 'DAY 2\nTue', 'DAY 3\nWed', 'DAY 4\nThu', 'DAY 5\nFri'].map((dayStr, idx) => {
                  const [d, w] = dayStr.split('\n');
                  const isDone = streakCompletedDays[idx];
                  return (
                    <div 
                      key={idx}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        isDone || idx === 0
                          ? 'bg-indigo-50/60 border-indigo-300 text-indigo-900'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="text-[9px] font-bold text-slate-500">{d}</div>
                      <div className="font-bold text-[11px]">{w}</div>
                      <div className="mt-1 flex justify-center">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isDone ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                          🎯
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* GOAL BOX */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                      DAY 1 GOAL
                    </span>
                    <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                      +20 XP
                    </span>
                  </div>
                  <p className="font-bold text-slate-800 text-xs mt-1">
                    Ask AI Tutor a homework question
                  </p>
                </div>

                <button
                  onClick={handleCompleteDayGoal}
                  className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition shadow-xs ${
                    day1GoalCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  }`}
                >
                  {day1GoalCompleted ? 'Done ✓' : 'Complete ✓'}
                </button>
              </div>
            </div>

            {/* 5. DAILY STUDY QUESTS */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-xs tracking-wide uppercase flex items-center space-x-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>DAILY STUDY QUESTS</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Finish missions, gain bonus XP</p>
                </div>
                <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">
                  🔥 Streak: 5 Days
                </span>
              </div>

              <div className="space-y-1.5">
                {quests.map((q) => (
                  <div key={q.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <button 
                        onClick={() => handleCompleteQuest(q.id)}
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition ${q.completed ? 'bg-emerald-500 text-white' : 'border-2 border-slate-300'}`}
                      >
                        {q.completed && <Check className="w-3 h-3" />}
                      </button>
                      <span className={`text-xs font-bold ${q.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {q.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      +{q.xp} XP
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. FOCUS SESSION & TIMER */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex-1 min-w-[120px]">
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value as Subject)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                  {[5, 25, 50].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setDurationMinutes(mins)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        durationMinutes === mins
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              {/* TIMER DISPLAY */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
                <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block">
                  FOCUS TIMER
                </span>
                <div className="text-4xl font-black tracking-tight text-indigo-600 font-mono">
                  {formatTimerTime(timerSeconds)}
                </div>

                <div className="flex justify-center items-center space-x-2 pt-1">
                  <button
                    onClick={toggleTimer}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 text-xs"
                  >
                    {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isTimerRunning ? 'Pause Session' : 'Start Session'}</span>
                  </button>
                  <button
                    onClick={resetTimer}
                    className="p-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl transition"
                    title="Reset Timer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* 7. ACADEMIC BADGES */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-xs tracking-wide uppercase flex items-center space-x-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-500" />
                  <span>ACADEMIC BADGES</span>
                </h3>
                <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                  1 EARNED
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-2xl text-center flex flex-col items-center justify-center space-y-1 w-24 shrink-0">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xl shadow-inner">
                    🚀
                  </div>
                  <span className="font-bold text-[11px] text-slate-800">Quick Start</span>
                  <span className="text-[8px] text-slate-400 font-medium">01/07/2026</span>
                </div>

                <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center flex flex-col items-center justify-center space-y-1 w-24 shrink-0">
                  <span className="text-xs font-bold text-indigo-400">+ more</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">STUDY ON</span>
                </div>
              </div>
            </div>

            {/* 8. STUDY LEADERBOARD */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
              {(() => {
                const leaderboardUsers = [
                  { id: 'bob', name: 'Bob Verma', icon: '🦊', xp: 340, level: 'LEVEL 4 • RANK CLASSMATE', isUser: false },
                  { id: 'alice', name: 'Alice Sharma', icon: '🦄', xp: 280, level: 'LEVEL 3 • RANK CLASSMATE', isUser: false },
                  { id: 'sarah', name: 'Sarah Patel', icon: '🦉', xp: 195, level: 'LEVEL 2 • RANK CLASSMATE', isUser: false },
                  { id: 'rohan', name: 'Rohan Das', icon: '🐼', xp: 145, level: 'LEVEL 2 • RANK CLASSMATE', isUser: false },
                  { id: 'me', name: `${userProfile.name || 'Student'} (You)`, icon: '⭐', xp: userProfile.xp, level: `LEVEL ${userProfile.level} • RANK CLASSMATE`, isUser: true }
                ].sort((a, b) => b.xp - a.xp);

                const currentRank = leaderboardUsers.findIndex((u) => u.isUser) + 1;

                return (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-slate-900 text-xs tracking-wide uppercase flex items-center space-x-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>STUDY LEADERBOARD</span>
                      </h3>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100/80">
                        CLASS RANK #{currentRank}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {leaderboardUsers.map((item, index) => {
                        const rankNum = index + 1;
                        const medalIcon = rankNum === 1 ? '🥇' : rankNum === 2 ? '🥈' : rankNum === 3 ? '🥉' : `${rankNum}`;
                        return (
                          <div 
                            key={item.id}
                            className={`p-2.5 rounded-xl flex items-center justify-between border transition ${
                              item.isUser
                                ? 'bg-indigo-50/80 border-indigo-300 shadow-xs ring-1 ring-indigo-200'
                                : 'bg-slate-50/60 border-slate-100 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              <span className="w-5 text-center font-bold text-xs text-slate-600">{medalIcon}</span>
                              <div>
                                <h4 className="font-bold text-xs text-slate-900 flex items-center space-x-1">
                                  <span>{item.name}</span>
                                  <span>{item.icon}</span>
                                </h4>
                                <p className="text-[8px] font-bold text-slate-400">{item.level}</p>
                              </div>
                            </div>
                            <span className="font-extrabold text-xs text-indigo-600">{item.xp} XP</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* 9. ONLINE CLASSMATES */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2.5">
              <h3 className="font-extrabold text-slate-900 text-xs tracking-wide uppercase">
                STUDY CLASSMATES
              </h3>

              <div className="space-y-1.5">
                {classmates.map((peer) => (
                  <div key={peer.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-lg relative shadow-xs">
                        {peer.avatar}
                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${peer.online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{peer.name}</h4>
                        <p className="text-[9px] text-slate-500">
                          Focus: <span className="font-bold text-indigo-600">{peer.focus}</span>
                        </p>
                      </div>
                    </div>

                    {peer.online ? (
                      <button
                        onClick={() => handleWaveBack(peer.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition shadow-xs ${
                          peer.waved
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                        }`}
                      >
                        {peer.waved ? 'Waved! 👋' : '👋 Wave back'}
                      </button>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                        Offline
                      </span>
                    )}
                  </div>
                ))}
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
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-xl shadow-inner font-bold text-white shrink-0">
                  🎓
                </div>
                <div>
                  <div className="flex items-center space-x-1.5 justify-center sm:justify-start">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-800">
                      Your Profile
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

              <button
                onClick={() => {
                  setIsEditingProfile(true);
                  setShowOnboardingModal(true);
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5 shrink-0 active:scale-95 cursor-pointer"
              >
                <span>Edit Profile ✏️</span>
              </button>
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

        {/* AI MOCK EXAMS TAB */}
        {activeTab === 'mockExam' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
            {!activeExam ? (
              <div className="max-w-xl mx-auto space-y-3">
                <div className="text-center space-y-1">
                  <GraduationCap className="w-10 h-10 text-indigo-600 mx-auto" />
                  <h3 className="text-xl font-black text-slate-900">{t('generateExam')}</h3>
                  <p className="text-xs text-slate-500">AI will generate custom multiple-choice questions for your chosen topic.</p>
                </div>

                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">{t('subject')}</label>
                    <select
                      value={examSubject}
                      onChange={(e) => setExamSubject(e.target.value as Subject)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                    >
                      {SUBJECTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">{t('topic')}</label>
                    <input
                      type="text"
                      value={examTopic}
                      onChange={(e) => setExamTopic(e.target.value)}
                      placeholder="e.g. Newton's Laws of Motion, Cell Biology"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                  </div>

                  <button
                    onClick={handleGenerateExam}
                    disabled={isGeneratingExam}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center space-x-2"
                  >
                    {isGeneratingExam ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t('generating')}</span>
                      </>
                    ) : (
                      <span>{t('startExam')}</span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{activeExam.subject}</span>
                    <h3 className="text-base font-bold text-slate-900">{activeExam.topic}</h3>
                  </div>
                  <button
                    onClick={() => setActiveExam(null)}
                    className="text-xs text-slate-500 hover:text-slate-900"
                  >
                    Close Exam
                  </button>
                </div>

                {!examSubmitted ? (
                  <div className="space-y-4">
                    {JSON.parse(activeExam.questionsJson || '[]').map((q: any, idx: number) => (
                      <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                        <h4 className="font-bold text-slate-900 text-xs">
                          {idx + 1}. {q.question}
                        </h4>
                        <div className="grid gap-1.5">
                          {q.options.map((opt: string, optIdx: number) => (
                            <button
                              key={optIdx}
                              onClick={() => setUserExamAnswers((prev) => ({ ...prev, [idx]: optIdx }))}
                              className={`p-2.5 text-left rounded-xl border text-xs font-medium transition ${
                                userExamAnswers[idx] === optIdx
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={handleSubmitExam}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                    >
                      Submit Exam & View Grade
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                    <h3 className="text-xl font-bold text-slate-900">Exam Completed!</h3>
                    <p className="text-slate-600 text-xs">{activeExam.feedback}</p>
                    <button
                      onClick={() => setActiveExam(null)}
                      className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs"
                    >
                      Take Another Exam
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
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

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <button
                onClick={() => {
                  toggleLanguage();
                }}
                className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                <span>Lang: {appLanguage.toUpperCase()}</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* COMPACT & SLIM BOTTOM STICKY NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-1 flex items-center justify-around shadow-xs h-12">
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
              className={`relative flex flex-col items-center justify-center py-0.5 px-3 rounded-lg transition-all ${
                isActive
                  ? 'text-indigo-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4 h-4 transition-transform ${isActive ? 'scale-110 text-indigo-600' : 'text-slate-500'}`} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-3.5 px-1.5 py-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[7.5px] font-black rounded-full leading-none shadow-xs border border-white z-10 tracking-tight">
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
          className={`relative flex flex-col items-center justify-center py-0.5 px-3 rounded-lg transition-all ${
            showMoreMenu || ['whiteboard', 'mockExam', 'studyDocs', 'petCompanion', 'imageGen'].includes(activeTab)
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
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
          schoolName: userProfile.schoolName || '',
          className: userProfile.className || '',
          targetGoal: userProfile.targetGoal || ''
        }}
        onSave={handleSaveProfile}
        onClose={() => setShowOnboardingModal(false)}
        isEditing={isEditingProfile}
      />
    </div>
  );
}
