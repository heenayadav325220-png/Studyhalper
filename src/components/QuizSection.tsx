import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  Sparkles, 
  Clock, 
  Flame, 
  XCircle, 
  ArrowRight, 
  ArrowLeft, 
  RotateCcw, 
  Trophy, 
  Zap, 
  Award, 
  Check, 
  ChevronDown, 
  ChevronUp,
  Brain,
  Timer,
  Play,
  Atom,
  Calculator,
  Dna,
  BookMarked,
  History,
  X,
  Target,
  Copy,
  CheckCheck,
  Globe
} from 'lucide-react';
import { generateQuiz, shuffleQuizQuestions } from '../services/geminiService';
import { showToast } from './Toast';
import { parseError, logError } from '../utils/errorHandler';
import { playSuccessChime, triggerHaptic } from '../services/soundEffects';
import type { Subject, MockExam, UserProfile } from '../types';
import { 
  QuizLanguage, 
  QUIZ_LANGUAGES, 
  getQuizText 
} from '../services/quizTranslations';

interface QuizSectionProps {
  user: UserProfile;
  onAddXp?: (amount: number) => void;
  onSaveMockExam?: (exam: MockExam) => Promise<void>;
  savedExams?: MockExam[];
  onClose?: () => void;
  language?: string;
  onLanguageChange?: (lang: any) => void;
}

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
}

const SUBJECT_CONFIGS: Array<{
  id: Subject;
  name: string;
  nameHi: string;
  icon: typeof Calculator;
  color: string;
  bgGradient: string;
  topics: string[];
}> = [
  {
    id: 'Mathematics',
    name: 'Mathematics',
    nameHi: 'गणित',
    icon: Calculator,
    color: 'text-indigo-600',
    bgGradient: 'from-indigo-600 to-blue-600',
    topics: ['Trigonometry & Formulas', 'Calculus & Integration', 'Quadratic Equations', 'Vectors & 3D Geometry', 'Probability & Statistics']
  },
  {
    id: 'Physics',
    name: 'Physics',
    nameHi: 'भौतिकी',
    icon: Atom,
    color: 'text-cyan-600',
    bgGradient: 'from-cyan-600 to-blue-600',
    topics: ["Newton's Laws of Motion", 'Thermodynamics', 'Electromagnetism', 'Optics & Light', 'Modern Physics & Quantum']
  },
  {
    id: 'Chemistry',
    name: 'Chemistry',
    nameHi: 'रसायन विज्ञान',
    icon: Atom,
    color: 'text-amber-600',
    bgGradient: 'from-amber-500 to-orange-600',
    topics: ['Organic Chemical Reactions', 'Periodic Table & Bonding', 'Electrochemistry', 'Coordination Compounds', 'Solutions & Equilibrium']
  },
  {
    id: 'Biology',
    name: 'Biology',
    nameHi: 'जीव विज्ञान',
    icon: Dna,
    color: 'text-emerald-600',
    bgGradient: 'from-emerald-500 to-teal-600',
    topics: ['Cell Structure & Function', 'Genetics & DNA Replication', 'Human Physiology', 'Plant Kingdom & Photosynthesis', 'Biotechnology & Ecology']
  },
  {
    id: 'English',
    name: 'English',
    nameHi: 'अंग्रेजी',
    icon: BookMarked,
    color: 'text-purple-600',
    bgGradient: 'from-purple-600 to-pink-600',
    topics: ['Grammar & Sentence Correction', 'Reading Comprehension', 'Vocabulary & Idioms', 'Active & Passive Voice', 'Literature & Essays']
  },
  {
    id: 'Science',
    name: 'General Science',
    nameHi: 'सामान्य विज्ञान',
    icon: Brain,
    color: 'text-rose-600',
    bgGradient: 'from-rose-500 to-red-600',
    topics: ['Environmental Science', 'Our Universe & Planets', 'Sound & Waves', 'Acid, Bases and Salts', 'Energy Resources']
  }
];

// --- LUXURY CELEBRATION CONFETTI ENGINE (PURE 60FPS CANVAS WITH AUTO-PAUSE) ---
const LuxuryConfettiCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    // Luxury palette: Royal Gold, Amber, Electric Indigo, Neon Cyan, Emerald, Rose Diamond
    const colors = ['#fbbf24', '#f59e0b', '#6366f1', '#06b6d4', '#10b981', '#ec4899', '#ffffff', '#a855f7'];

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rotation: number;
      vRot: number;
      shape: 'rect' | 'circle' | 'star';
      opacity: number;
      decay: number;
    }

    const particles: Particle[] = [];
    const count = Math.min(110, Math.floor(width / 12));

    for (let i = 0; i < count; i++) {
      const speed = Math.random() * 14 + 7;
      particles.push({
        x: width * 0.5 + (Math.random() - 0.5) * 260,
        y: height * 0.35,
        vx: (Math.random() - 0.5) * 18,
        vy: -speed,
        size: Math.random() * 9 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        shape: Math.random() > 0.4 ? 'rect' : Math.random() > 0.5 ? 'star' : 'circle',
        opacity: 1,
        decay: Math.random() * 0.0035 + 0.004
      });
    }

    const startTime = Date.now();

    const drawStar = (cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
      ctx.fill();
    };

    const render = () => {
      // Auto pause after 4.5 seconds to preserve 100% CPU and zero battery drain
      if (Date.now() - startTime > 4500) {
        ctx.clearRect(0, 0, width, height);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.28; // gravity
        p.vx *= 0.985; // air resistance
        p.rotation += p.vRot;
        p.opacity = Math.max(0, p.opacity - p.decay);

        if (p.opacity <= 0) return;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size * 1.6, p.size * 0.7);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawStar(0, 0, 5, p.size, p.size * 0.45);
        }

        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
    />
  );
};

// --- ANIMATED NUMBER COUNTER (SMOOTH EASE-OUT INTERPOLATION) ---
const AnimatedScoreCounter: React.FC<{ value: number; duration?: number; suffix?: string; prefix?: string }> = ({
  value,
  duration = 1100,
  suffix = '',
  prefix = ''
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Cubic ease-out curve
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(easeOut * value));

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [value, duration]);

  return <span>{prefix}{displayValue}{suffix}</span>;
};

// --- RADIAL ACCURACY RING WITH SVG GLOW ---
const ScoreRadialRing: React.FC<{ percentage: number; size?: number }> = ({ percentage, size = 150 }) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (Math.max(0, Math.min(100, percentage)) / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg] overflow-visible">
        <defs>
          <linearGradient id="scoreRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="45%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <filter id="ringAmbientGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Dynamic Progress Arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#scoreRingGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: targetOffset }}
          transition={{ duration: 1.35, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          filter="url(#ringAmbientGlow)"
        />
      </svg>

      {/* Center Label Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
        <span className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
          <AnimatedScoreCounter value={percentage} suffix="%" />
        </span>
        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-300 mt-0.5">
          Accuracy
        </span>
      </div>
    </div>
  );
};

export default function QuizSection({
  user,
  onAddXp,
  onSaveMockExam,
  savedExams = [],
  onClose,
  language = 'en',
  onLanguageChange
}: QuizSectionProps) {
  // Navigation & Step State
  const [viewState, setViewState] = useState<'setup' | 'loading' | 'active' | 'results' | 'history'>('setup');

  // Dynamic Quiz-specific Language Selection
  const [quizLanguage, setQuizLanguage] = useState<QuizLanguage>(() => {
    if (language && ['en', 'hi', 'hinglish', 'marathi', 'tamil', 'bengali'].includes(language)) {
      return language as QuizLanguage;
    }
    return 'en';
  });

  // Sync quiz language with app language if app language changes
  useEffect(() => {
    if (language && ['en', 'hi', 'hinglish', 'marathi', 'tamil', 'bengali'].includes(language)) {
      setQuizLanguage(language as QuizLanguage);
    }
  }, [language]);

  const handleQuizLanguageSelect = (lang: QuizLanguage) => {
    setQuizLanguage(lang);
    if (onLanguageChange) {
      onLanguageChange(lang);
    }
  };

  // Setup Config
  const [selectedSubject, setSelectedSubject] = useState<Subject>('Mathematics');
  const [customTopic, setCustomTopic] = useState('Trigonometry & Formulas');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [isTimed, setIsTimed] = useState(true);
  const [timePerQuestion] = useState(30); // 30s per question
  const [instantFeedback, setInstantFeedback] = useState(true);

  // Active Quiz State
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isOptionLocked, setIsOptionLocked] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [quizStartTime, setQuizStartTime] = useState<number>(0);
  const [totalTimeTakenSec, setTotalTimeTakenSec] = useState(0);
  const [expandedExplanation, setExpandedExplanation] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [isReportCopied, setIsReportCopied] = useState(false);

  // Fallback Generation or Gemini API
  const handleStartQuiz = async () => {
    const topicToUse = customTopic.trim() || 'Core Concepts';
    setViewState('loading');
    setErrorMsg('');

    try {
      // Map quizLanguage correctly to the string parameter for generateQuiz
      const map: Record<QuizLanguage, string> = {
        en: 'English',
        hi: 'Hindi',
        hinglish: 'Hinglish',
        marathi: 'Marathi',
        tamil: 'Tamil',
        bengali: 'Bengali'
      };
      const langParam = map[quizLanguage] || 'English';

      const generated = await generateQuiz(
        selectedSubject,
        {
          name: user.name || 'Student',
          school: user.schoolName || '',
          className: `${user.className || 'Class 12'}`,
          country: 'India',
          topic: topicToUse
        },
        langParam,
        difficulty,
        questionCount,
        topicToUse
      );

      if (Array.isArray(generated) && generated.length > 0) {
        // Defensive shuffle: guarantees random options and uniform A/B/C/D answer spread
        const randomized = shuffleQuizQuestions(generated);
        setQuestions(randomized);
        setCurrentIndex(0);
        setUserAnswers({});
        setIsOptionLocked(false);
        setCurrentStreak(0);
        setMaxStreak(0);
        setTimeLeft(timePerQuestion);
        setQuizStartTime(Date.now());
        setViewState('active');
      } else {
        throw new Error('Could not load quiz questions.');
      }
    } catch (err: any) {
      logError(err, 'QUIZ_GEN');
      const parsed = parseError(err);
      const isHi = quizLanguage === 'hi';
      const msg = isHi ? parsed.messageHindi : parsed.message;
      setErrorMsg(msg);
      showToast(msg, 'error');
      setViewState('setup');
    }
  };

  // Timer Tick during active quiz
  useEffect(() => {
    if (viewState !== 'active' || !isTimed || isOptionLocked) return;

    if (timeLeft <= 0) {
      // Time is up for current question
      handleAnswerSelect(-1); // -1 means missed / timed out
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [viewState, isTimed, isOptionLocked, timeLeft]);

  // Finish Quiz & Calculate Final Score (Guaranteed Instant Screen Transition)
  const handleFinishQuiz = useCallback((overrideAnswers?: Record<number, number>) => {
    const finalAnswers = overrideAnswers || userAnswers;
    const elapsedSeconds = Math.max(1, Math.round((Date.now() - (quizStartTime || Date.now())) / 1000));
    setTotalTimeTakenSec(elapsedSeconds);

    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (finalAnswers[idx] === q.answer) {
        correctCount++;
      }
    });

    const totalQuestions = Math.max(1, questions.length);
    const accuracy = Math.round((correctCount / totalQuestions) * 100);
    let earnedXp = correctCount * 15;
    if (accuracy >= 80) earnedXp += 25;
    if (maxStreak >= 3) earnedXp += 20;

    // IMMEDIATE STATE TRANSITION TO GUARANTEE SCREEN SWITCH WITHOUT FREEZING
    setViewState('results');
    setIsOptionLocked(false);

    // Audio & tactile celebration
    try {
      playSuccessChime();
      triggerHaptic('success');
    } catch {}

    // Safe background awards & Firestore persistence (non-blocking)
    try {
      if (onAddXp) {
        onAddXp(earnedXp);
      }
    } catch (e) {
      console.warn('XP addition failed non-blockingly:', e);
    }

    if (onSaveMockExam) {
      const mockExamRecord: MockExam = {
        id: `exam_${Date.now()}`,
        userId: user?.uid || 'user_local_student',
        subject: selectedSubject,
        topic: customTopic || 'General Quiz',
        questionsJson: JSON.stringify(questions),
        submittedAnswersJson: JSON.stringify(finalAnswers),
        score: correctCount,
        completed: true,
        feedback: `Completed with ${accuracy}% accuracy (${correctCount}/${questions.length}) in ${elapsedSeconds}s.`,
        timestamp: new Date().toISOString()
      };
      Promise.resolve(onSaveMockExam(mockExamRecord)).catch((err) => {
        console.warn('Non-blocking mock exam save error:', err);
      });
    }
  }, [quizStartTime, questions, userAnswers, maxStreak, onAddXp, onSaveMockExam, user?.uid, selectedSubject, customTopic]);

  // Option Selection Handler
  const handleAnswerSelect = (optionIdx: number) => {
    if (isOptionLocked) return;

    const currentQ = questions[currentIndex];
    const isCorrect = optionIdx === currentQ.answer;

    const updatedAnswers = { ...userAnswers, [currentIndex]: optionIdx };
    setUserAnswers(updatedAnswers);

    if (isCorrect) {
      const newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);
    } else {
      setCurrentStreak(0);
    }

    if (instantFeedback) {
      setIsOptionLocked(true);
    } else {
      // Direct move to next question if not instant feedback mode
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((prev) => prev + 1);
        setTimeLeft(timePerQuestion);
      } else {
        handleFinishQuiz(updatedAnswers);
      }
    }
  };

  // Next Question Button
  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setIsOptionLocked(false);
      setCurrentIndex((prev) => prev + 1);
      setTimeLeft(timePerQuestion);
    } else {
      handleFinishQuiz();
    }
  };

  // Keyboard navigation for A, B, C, D (or 1, 2, 3, 4) & Enter
  useEffect(() => {
    if (viewState !== 'active') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOptionLocked) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
          handleNextQuestion();
        }
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'a' || key === '1') handleAnswerSelect(0);
      else if (key === 'b' || key === '2') handleAnswerSelect(1);
      else if (key === 'c' || key === '3') handleAnswerSelect(2);
      else if (key === 'd' || key === '4') handleAnswerSelect(3);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewState, isOptionLocked, currentIndex, questions, userAnswers]);

  // Current Subject Metadata
  const currentSubjectObj = SUBJECT_CONFIGS.find((s) => s.id === selectedSubject) || SUBJECT_CONFIGS[0];

  // Performance calculations
  const correctAnswersCount = questions.filter((q, idx) => userAnswers[idx] === q.answer).length;
  const scorePercentage = questions.length > 0 ? Math.round((correctAnswersCount / questions.length) * 100) : 0;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      <AnimatePresence mode="wait">
        
        {/* ========================================================================= */}
        {/* VIEW 1: SETUP SCREEN (PROFESSIONAL ANIMATED DASHBOARD) */}
        {/* ========================================================================= */}
        {viewState === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-6"
          >
            {/* HERO BANNER WITH GRADIENT ACCENT */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-8 border border-indigo-900/40 shadow-xl">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

              {onClose && (
                <button
                  onClick={onClose}
                  className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer z-20"
                  title="Close Quiz Arena"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>AI-Powered Adaptive Mock Exams</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    Study Arena & Practice Quizzes 🏆
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Test your understanding with instant question analysis, timed rounds, streak multipliers, and deep conceptual explanations.
                  </p>
                </div>

                {/* QUICK STATS PILLS */}
                <div className="flex sm:flex-row md:flex-col gap-2.5 shrink-0">
                  <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-400/20 flex items-center justify-center text-amber-400">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Level {user.level}</div>
                      <div className="text-xs font-bold text-white">{user.xp} Total XP</div>
                    </div>
                  </div>

                  <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-400/20 flex items-center justify-center text-emerald-400">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Daily Streak</div>
                      <div className="text-xs font-bold text-emerald-300">{user.streak} Days Active 🔥</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between"
              >
                <span>{errorMsg}</span>
                <button 
                  onClick={() => setErrorMsg('')}
                  className="text-rose-500 hover:text-rose-700 font-bold ml-2 cursor-pointer"
                >
                  Dismiss
                </button>
              </motion.div>
            )}

            {/* EXPLICIT LANGUAGE SELECTION & CONFIRMATION PANEL */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-6 border border-indigo-500/20 shadow-md space-y-4">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                    {getQuizText('langConfirmTitle', quizLanguage)}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-300">
                    {getQuizText('langConfirmSub', quizLanguage)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
                {QUIZ_LANGUAGES.map((item) => {
                  const isSel = quizLanguage === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleQuizLanguageSelect(item.id)}
                      className={`py-2 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2 border cursor-pointer ${
                        isSel
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-md ring-2 ring-indigo-500/40'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
                      }`}
                    >
                      <span className="text-sm">{item.flag}</span>
                      <span>{item.nativeLabel}</span>
                    </button>
                  );
                })}
              </div>

              {/* Confirmation Indicator */}
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center space-x-2 text-[10px] sm:text-xs text-indigo-300 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  <strong>{getQuizText('selectedLangBadge', quizLanguage)}:</strong>{' '}
                  {QUIZ_LANGUAGES.find(q => q.id === quizLanguage)?.label} - {QUIZ_LANGUAGES.find(q => q.id === quizLanguage)?.description}
                </span>
              </div>
            </div>

            {/* SUBJECT PICKER CARDS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <span>{getQuizText('stepSubject', quizLanguage)}</span>
                </h3>
                <span className="text-[11px] font-semibold text-slate-400">
                  {SUBJECT_CONFIGS.length} {getQuizText('subjectsAvailable', quizLanguage)}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {SUBJECT_CONFIGS.map((sub) => {
                  const Icon = sub.icon;
                  const isSelected = selectedSubject === sub.id;

                  return (
                    <motion.button
                      key={sub.id}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedSubject(sub.id);
                        setCustomTopic(sub.topics[0]);
                      }}
                      className={`p-4 rounded-2xl border text-left transition relative cursor-pointer overflow-hidden flex flex-col justify-between h-32 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-600/30'
                          : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]"
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </motion.div>
                        )}
                      </div>

                      <div>
                        <div className="font-extrabold text-xs text-slate-900">
                          {language === 'hi' ? sub.nameHi : sub.name}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {sub.topics.length} Key Topics
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* TOPIC SELECTION & CUSTOM INPUT */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 space-y-4 shadow-xs">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5 mb-1">
                  <BookMarked className="w-4 h-4 text-indigo-600" />
                  <span>{getQuizText('stepTopic', quizLanguage)}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {getQuizText('topicSub', quizLanguage)}
                </p>
              </div>

              {/* QUICK CHIPS */}
              <div className="flex flex-wrap gap-2">
                {currentSubjectObj.topics.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setCustomTopic(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      customTopic === t
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* CUSTOM INPUT */}
              <div className="relative">
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder={getQuizText('topicPlaceholder', quizLanguage)}
                  className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium text-slate-900 transition"
                />
              </div>
            </div>

            {/* 3. NUMBER OF QUESTIONS SELECTOR */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5 mb-1">
                    <Target className="w-4 h-4 text-indigo-600" />
                    <span>{getQuizText('stepQuestions', quizLanguage)} ({questionCount} Selected)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    {getQuizText('questionsSub', quizLanguage)}
                  </p>
                </div>
                <div className="flex items-center space-x-2 bg-indigo-50 border border-indigo-200/80 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                  <span className="text-xs font-extrabold text-indigo-900">{questionCount} {getQuizText('questionOf', quizLanguage)}s</span>
                  <span className="text-[10px] text-indigo-600 font-semibold">• ~{Math.max(1, Math.round((questionCount * 30) / 60))} min</span>
                </div>
              </div>

              {/* PRESET CHIPS (5, 10, 15, 20, 25) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {[
                  { count: 5, label: quizLanguage === 'hi' ? '5 प्रश्न' : '5 Questions', sub: quizLanguage === 'hi' ? 'त्वरित अभ्यास' : 'Quick Blitz', tag: '⚡ 2.5 Min' },
                  { count: 10, label: quizLanguage === 'hi' ? '10 प्रश्न' : '10 Questions', sub: quizLanguage === 'hi' ? 'मानक टेस्ट' : 'Standard Exam', tag: '🎯 5 Min' },
                  { count: 15, label: quizLanguage === 'hi' ? '15 प्रश्न' : '15 Questions', sub: quizLanguage === 'hi' ? 'गहन अभ्यास' : 'Deep Practice', tag: '📚 7.5 Min' },
                  { count: 20, label: quizLanguage === 'hi' ? '20 प्रश्न' : '20 Questions', sub: quizLanguage === 'hi' ? 'पूर्ण परीक्षा' : 'Full Mock Test', tag: '🔥 10 Min' },
                  { count: 25, label: quizLanguage === 'hi' ? '25 प्रश्न' : '25 Questions', sub: quizLanguage === 'hi' ? 'महा योग्यता' : 'Grand Mastery', tag: '🏆 12.5 Min' }
                ].map((item) => {
                  const isSelected = questionCount === item.count;
                  return (
                    <button
                      key={item.count}
                      type="button"
                      onClick={() => setQuestionCount(item.count)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                          : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {item.label}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] text-white" />}
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className={`text-[10px] font-medium ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                          {item.sub}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                        }`}>
                          {item.tag}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* CUSTOM RANGE SLIDER */}
              <div className="flex items-center gap-3 pt-1">
                <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
                  {quizLanguage === 'hi' ? 'कस्टम संख्या:' : 'Custom Count:'}
                </span>
                <input
                  type="range"
                  min="3"
                  max="30"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200 min-w-[3.5rem] text-center">
                  {questionCount} Qs
                </span>
              </div>
            </div>

            {/* DIFFICULTY & GAMEPLAY RULES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* DIFFICULTY SELECTOR */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3 shadow-xs">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>{getQuizText('stepDifficulty', quizLanguage)}</span>
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {(['Easy', 'Medium', 'Hard'] as const).map((diff) => {
                    const isSelected = difficulty === diff;
                    return (
                      <button
                        key={diff}
                        onClick={() => setDifficulty(diff)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition text-center cursor-pointer ${
                          isSelected
                            ? diff === 'Easy'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : diff === 'Medium'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {diff === 'Easy' && `🌱 ${quizLanguage === 'hi' ? 'सरल' : 'Easy'}`}
                        {diff === 'Medium' && `⚖️ ${quizLanguage === 'hi' ? 'मध्यम' : 'Medium'}`}
                        {diff === 'Hard' && `🔥 ${quizLanguage === 'hi' ? 'कठिन' : 'Hard'}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TIMED MODE & INSTANT REVIEWS */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3 shadow-xs">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                  <Timer className="w-4 h-4 text-cyan-600" />
                  <span>{getQuizText('stepMode', quizLanguage)}</span>
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsTimed(true)}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      isTimed
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{getQuizText('timedMode', quizLanguage)}</span>
                  </button>

                  <button
                    onClick={() => setIsTimed(false)}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      !isTimed
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{getQuizText('relaxedMode', quizLanguage)}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-600">{getQuizText('instantFeedbackLabel', quizLanguage)}</span>
                  <button
                    type="button"
                    onClick={() => setInstantFeedback(!instantFeedback)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition ${
                      instantFeedback
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {instantFeedback ? getQuizText('enabled', quizLanguage) : getQuizText('off', quizLanguage)}
                  </button>
                </div>
              </div>
            </div>

            {/* ACTION CTA BAR */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>
                  {quizLanguage === 'hi' ? (
                    <>स्ट्रीक बोनस के साथ कुल <strong>+{questionCount * 15 + 45} XP</strong> तक अर्जित करें!</>
                  ) : (
                    <>Earn up to <strong>+{questionCount * 15 + 45} XP</strong> with streak bonuses!</>
                  )}
                </span>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                {savedExams.length > 0 && (
                  <button
                    onClick={() => setViewState('history')}
                    className="px-4 py-3 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <History className="w-4 h-4 text-slate-500" />
                    <span>{getQuizText('pastResults', quizLanguage)} ({savedExams.length})</span>
                  </button>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStartQuiz}
                  className="flex-1 sm:flex-initial px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{getQuizText('launchQuiz', quizLanguage)} ({questionCount} Qs)</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: LOADING SKELETON WITH ANIMATED RADIAL WAVE */}
        {/* ========================================================================= */}
        {viewState === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="py-20 flex flex-col items-center justify-center text-center space-y-5 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                className="w-20 h-20 rounded-full border-4 border-indigo-100 border-t-indigo-600"
              />
              <div className="absolute inset-0 flex items-center justify-center text-2xl">
                🧠
              </div>
            </div>

            <div className="space-y-1.5 max-w-sm">
              <h3 className="text-base font-extrabold text-slate-900">
                Generating {selectedSubject} Quiz
              </h3>
              <p className="text-xs text-slate-500">
                AI Tutor is formulating {questionCount} multiple choice questions for <strong>"{customTopic}"</strong> at {difficulty} difficulty with randomized answer positions...
              </p>
            </div>

            <div className="flex items-center space-x-2 text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Verifying syllabus accuracy & explanations</span>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: ACTIVE ANIMATED QUIZ ARENA */}
        {/* ========================================================================= */}
        {viewState === 'active' && questions.length > 0 && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-4"
          >
            {/* TOP HEADER CONTROLS */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  {selectedSubject.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      {selectedSubject}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {difficulty} Mode
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                    {customTopic}
                  </h3>
                </div>
              </div>

              {/* TIMER & STREAK BADGES */}
              <div className="flex items-center space-x-3">
                {currentStreak > 1 && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black"
                  >
                    <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-bounce" />
                    <span>{currentStreak} Streak!</span>
                  </motion.div>
                )}

                {isTimed && (
                  <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-mono font-black text-xs border transition-colors ${
                    timeLeft <= 5 
                      ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}>
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>00:{timeLeft.toString().padStart(2, '0')}</span>
                  </div>
                )}

                <button
                  onClick={() => {
                    if (confirm('Exit this quiz session? Progress will not be recorded.')) {
                      setViewState('setup');
                    }
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  title="Exit Quiz"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PROGRESS BAR & STEP INDICATORS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
                <span>Question {currentIndex + 1} of {questions.length}</span>
                <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}% Complete</span>
              </div>

              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* MAIN QUESTION CARD (ANIMATED) */}
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-md"
            >
              {/* QUESTION TITLE */}
              <div className="space-y-2">
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                  <span>Single Choice</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {questions[currentIndex].question}
                </h2>
              </div>

              {/* 4 OPTIONS WITH SMOOTH HOVER & SPRING STATES */}
              <div className="grid grid-cols-1 gap-3">
                {questions[currentIndex].options.map((optText, optIdx) => {
                  const isSelected = userAnswers[currentIndex] === optIdx;
                  const isCorrect = optIdx === questions[currentIndex].answer;
                  const letter = String.fromCharCode(65 + optIdx); // A, B, C, D

                  let buttonStyle = 'border-slate-200/90 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300 text-slate-800';

                  if (isOptionLocked) {
                    if (isCorrect) {
                      buttonStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-xs ring-2 ring-emerald-500/30';
                    } else if (isSelected && !isCorrect) {
                      buttonStyle = 'border-rose-500 bg-rose-50 text-rose-900 shadow-xs ring-2 ring-rose-500/30';
                    } else {
                      buttonStyle = 'border-slate-100 bg-slate-50/30 text-slate-400 opacity-60';
                    }
                  } else if (isSelected) {
                    buttonStyle = 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs ring-2 ring-indigo-600/30';
                  }

                  return (
                    <motion.button
                      key={optIdx}
                      whileHover={!isOptionLocked ? { scale: 1.01, x: 2 } : {}}
                      whileTap={!isOptionLocked ? { scale: 0.99 } : {}}
                      onClick={() => handleAnswerSelect(optIdx)}
                      disabled={isOptionLocked}
                      className={`p-4 rounded-2xl border text-left transition flex items-center justify-between gap-3 cursor-pointer ${buttonStyle}`}
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isOptionLocked
                            ? isCorrect
                              ? 'bg-emerald-600 text-white'
                              : isSelected
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-200 text-slate-500'
                            : isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-700 shadow-2xs'
                        }`}>
                          {letter}
                        </div>
                        <span className="text-xs sm:text-sm font-semibold">
                          {optText}
                        </span>
                      </div>

                      {isOptionLocked && (
                        <div>
                          {isCorrect && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </motion.div>
                          )}
                          {isSelected && !isCorrect && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center"
                            >
                              <XCircle className="w-4 h-4 stroke-[2]" />
                            </motion.div>
                          )}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* INSTANT EXPLANATION ACCORDION */}
              {isOptionLocked && questions[currentIndex].explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-1.5"
                >
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-900">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Conceptual Explanation</span>
                  </div>
                  <p className="text-xs text-indigo-950 leading-relaxed">
                    {questions[currentIndex].explanation}
                  </p>
                </motion.div>
              )}

              {/* FOOTER ACTION (NEXT QUESTION / FINISH) */}
              {isOptionLocked && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end pt-2"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (currentIndex + 1 < questions.length) {
                        handleNextQuestion();
                      } else {
                        handleFinishQuiz();
                      }
                    }}
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-indigo-600/30 transition-all duration-200 flex items-center space-x-2.5 cursor-pointer active:scale-95 border border-indigo-400/40"
                  >
                    <span>
                      {currentIndex + 1 < questions.length
                        ? (language === 'hi' ? 'अगला प्रश्न' : 'Next Question')
                        : (language === 'hi' ? 'अंतिम स्कोर देखें 🏆' : 'View Final Score 🏆')}
                    </span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: WORLD-CLASS LUXURY CELEBRATORY SCORECARD & ANALYTICS */}
        {/* ========================================================================= */}
        {viewState === 'results' && (() => {
          const isHindi = language === 'hi' || language === 'Hindi';
          const totalQ = Math.max(1, questions.length);
          const earnedXp = correctAnswersCount * 15 + (scorePercentage >= 80 ? 25 : 0) + (maxStreak >= 3 ? 20 : 0);
          const avgPace = (totalTimeTakenSec / totalQ).toFixed(1);
          const incorrectCount = Math.max(0, questions.length - correctAnswersCount);

          const badgeInfo = (() => {
            if (scorePercentage >= 90) {
              return {
                rank: 'S-TIER • MASTER SCHOLAR',
                rankHi: 'एस-रैंक • विशेषज्ञ प्रवीणता 👑',
                desc: 'Outstanding precision! You demonstrate deep mastery of core principles and problem-solving intuition.',
                descHi: 'शानदार सटीकता! आपने इस विषय की बुनियादी और जटिल दोनों अवधारणाओं में असाधारण महारत सिद्ध की है।',
                icon: '👑',
                glow: 'rgba(245, 158, 11, 0.25)',
                pill: 'bg-amber-500/20 text-amber-300 border-amber-400/40'
              };
            } else if (scorePercentage >= 75) {
              return {
                rank: 'A-TIER • HIGH PERFORMER',
                rankHi: 'ए-रैंक • उत्कृष्ट प्रदर्शन 🚀',
                desc: 'Excellent conceptual grasp! You solved the majority of challenges with solid reasoning and confidence.',
                descHi: 'बेहतरीन समझ! आपने अधिकांश प्रश्नों को मजबूत तर्क और आत्मविश्वास के साथ हल किया।',
                icon: '🚀',
                glow: 'rgba(99, 102, 241, 0.25)',
                pill: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40'
              };
            } else if (scorePercentage >= 50) {
              return {
                rank: 'B-TIER • SOLID PROFICIENCY',
                rankHi: 'बी-रैंक • उत्तम समझ 🎯',
                desc: 'Strong effort with promising intuition! Review the step-by-step notes below to master missed topics.',
                descHi: 'सराहनीय प्रयास! छूटे हुए प्रश्नों के विश्लेषण को देखकर अपनी पकड़ को और अधिक मजबूत करें।',
                icon: '🎯',
                glow: 'rgba(16, 185, 129, 0.25)',
                pill: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
              };
            } else {
              return {
                rank: 'GROWTH TIER • STEADY PROGRESS',
                rankHi: 'ग्रोथ टियर • निरंतर प्रयास 🌱',
                desc: 'Every challenge is an opportunity to learn. Study the concept notes below and retake for a higher score!',
                descHi: 'हर गलती सीखने का सबसे बड़ा अवसर है। नीचे दिए गए नोट्स को पढ़ें और पुनः प्रयास करें!',
                icon: '🌱',
                glow: 'rgba(6, 182, 212, 0.25)',
                pill: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
              };
            }
          })();

          const filteredQuestions = questions.filter((q, idx) => {
            const isCorrect = userAnswers[idx] === q.answer;
            if (reviewFilter === 'correct') return isCorrect;
            if (reviewFilter === 'incorrect') return !isCorrect;
            return true;
          });

          const handleCopyReport = async () => {
            const reportText = `🏆 ASCEND STUDY - MOCK EXAM RESULT
━━━━━━━━━━━━━━━━━━━━━━━━━━
Subject: ${selectedSubject}
Topic: ${customTopic}
Score: ${correctAnswersCount}/${questions.length} (${scorePercentage}% Accuracy)
Time Taken: ${totalTimeTakenSec}s (~${avgPace}s / question)
Max Streak: ${maxStreak} 🔥
XP Awarded: +${earnedXp} XP
Completed on: ${new Date().toLocaleDateString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━
Ascend Study Buddy • AI-Powered Education`;

            try {
              if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(reportText);
                setIsReportCopied(true);
                showToast(isHindi ? 'परीक्षा परिणाम क्लिपबोर्ड पर कॉपी किया गया! 📋' : 'Exam report copied to clipboard! 📋', 'success');
                setTimeout(() => setIsReportCopied(false), 2500);
              }
            } catch {
              showToast('Could not copy report', 'error');
            }
          };

          return (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -16 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6 relative"
            >
              {/* 60FPS LUXURY CELEBRATION CONFETTI ENGINE */}
              <LuxuryConfettiCanvas />

              {/* 1. LUXURY SCORECARD HERO HEADER */}
              <div 
                className="bg-gradient-to-br from-[#070b16] via-[#0d162d] to-[#0a1024] text-white rounded-3xl p-6 sm:p-9 border border-indigo-500/30 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85)] relative overflow-hidden"
                style={{
                  boxShadow: `0 24px 64px -12px ${badgeInfo.glow}`
                }}
              >
                {/* Dynamic Ambient Laser Lighting */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400 via-purple-400 to-emerald-400 opacity-90" />
                <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
                  {/* Left Column: Radial Circular Gauge */}
                  <div className="flex flex-col items-center shrink-0">
                    <ScoreRadialRing percentage={scorePercentage} size={156} />
                    <div className="mt-2.5 flex items-center space-x-1.5 text-xs font-bold text-slate-300">
                      <span className="text-emerald-400 font-black">{correctAnswersCount} Correct</span>
                      <span>•</span>
                      <span className="text-rose-400 font-semibold">{incorrectCount} Missed</span>
                    </div>
                  </div>

                  {/* Right Column: Title, Rank & Narrative Assessment */}
                  <div className="flex-1 text-center md:text-left space-y-3 max-w-xl">
                    <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                      <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase border shadow-sm ${badgeInfo.pill}`}>
                        <span>{badgeInfo.icon}</span>
                        <span>{isHindi ? badgeInfo.rankHi : badgeInfo.rank}</span>
                      </span>

                      <span className="px-2.5 py-1 rounded-full bg-white/10 text-slate-300 text-[10px] font-bold uppercase tracking-wider border border-white/10">
                        {selectedSubject}
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                      {isHindi ? 'मॉक टेस्ट सफलतापूर्वक पूर्ण!' : 'Examination Completed!'}
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                      {isHindi ? (
                        <>
                          आपने <strong>{questions.length}</strong> में से <strong>{correctAnswersCount}</strong> प्रश्नों के सही उत्तर दिए हैं। {badgeInfo.descHi}
                        </>
                      ) : (
                        <>
                          You achieved <strong>{correctAnswersCount}</strong> out of <strong>{questions.length}</strong> correct answers ({scorePercentage}% accuracy). {badgeInfo.desc}
                        </>
                      )}
                    </p>

                    <div className="pt-1 flex items-center justify-center md:justify-start gap-2.5 flex-wrap">
                      <button
                        type="button"
                        onClick={handleCopyReport}
                        className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer active:scale-95 shadow-sm"
                      >
                        {isReportCopied ? (
                          <>
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-300">{isHindi ? 'कॉपी हो गया' : 'Report Copied!'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-300" />
                            <span>{isHindi ? 'रिपोर्ट कॉपी करें' : 'Copy Score Report'}</span>
                          </>
                        )}
                      </button>

                      <span className="text-[11px] text-slate-400 font-mono">
                        {customTopic} • {difficulty}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. FOUR HIGH-IMPACT PERFORMANCE KPI BENTO CARDS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* CARD 1: OVERALL ACCURACY */}
                <motion.div 
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400">
                      {isHindi ? 'सटीकता' : 'Accuracy'}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <Target className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      <AnimatedScoreCounter value={scorePercentage} suffix="%" />
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      {correctAnswersCount} / {questions.length} {isHindi ? 'प्रश्न सही' : 'Solved Correctly'}
                    </div>
                  </div>
                </motion.div>

                {/* CARD 2: TOTAL XP REWARD */}
                <motion.div 
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400">
                      {isHindi ? 'अर्जित एक्सपी' : 'XP Awarded'}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center font-bold">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-amber-500 tracking-tight">
                      <AnimatedScoreCounter value={earnedXp} prefix="+" suffix=" XP" />
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      {scorePercentage >= 80 ? '+25 Accuracy Bonus' : 'Standard Round'}
                    </div>
                  </div>
                </motion.div>

                {/* CARD 3: TIME & PACE */}
                <motion.div 
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400">
                      {isHindi ? 'समय व गति' : 'Time & Pace'}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                      <Timer className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {totalTimeTakenSec}s
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      ~{avgPace}s {isHindi ? 'प्रति प्रश्न औसत' : 'per question avg'}
                    </div>
                  </div>
                </motion.div>

                {/* CARD 4: STREAK MASTERY */}
                <motion.div 
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400">
                      {isHindi ? 'अधिकतम स्ट्रीक' : 'Max Streak'}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center font-bold">
                      <Flame className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-emerald-600 tracking-tight flex items-center gap-1">
                      <span>{maxStreak}</span>
                      <span className="text-base">🔥</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      {maxStreak >= 3 ? '+20 Streak Multiplier' : (isHindi ? 'एकाग्रता राउंड' : 'Focused Flow')}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* 3. QUESTION-BY-QUESTION REVIEW WITH FILTER TABS */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 space-y-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center space-x-2">
                      <BookMarked className="w-4 h-4 text-indigo-600" />
                      <span>{isHindi ? 'प्रश्नोत्तर विस्तृत समीक्षा' : 'Question-by-Question Review'}</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {isHindi 
                        ? 'सटीक उत्तर और स्पष्टीकरण देखकर अपनी समझ मजबूत करें' 
                        : 'Review step-by-step logic and concept explanations for every question'}
                    </p>
                  </div>

                  {/* Filter Segmented Buttons */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-center border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setReviewFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        reviewFilter === 'all'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {isHindi ? 'सभी' : 'All'} ({questions.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setReviewFilter('correct')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        reviewFilter === 'correct'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {isHindi ? 'सही' : 'Correct'} ({correctAnswersCount})
                    </button>

                    <button
                      type="button"
                      onClick={() => setReviewFilter('incorrect')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        reviewFilter === 'incorrect'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {isHindi ? 'समीक्षा' : 'Review'} ({incorrectCount})
                    </button>
                  </div>
                </div>

                {/* Question List */}
                <div className="space-y-3.5">
                  {filteredQuestions.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs font-medium">
                      {isHindi ? 'इस फ़िल्टर में कोई प्रश्न नहीं मिला।' : 'No questions match the selected filter.'}
                    </div>
                  ) : (
                    filteredQuestions.map((q) => {
                      const originalIdx = questions.indexOf(q);
                      const userAnsIdx = userAnswers[originalIdx];
                      const isCorrect = userAnsIdx === q.answer;
                      const isExpanded = expandedExplanation === originalIdx || !isCorrect;

                      return (
                        <div
                          key={originalIdx}
                          className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
                            isCorrect
                              ? 'border-emerald-200/90 bg-emerald-50/25 hover:bg-emerald-50/40'
                              : 'border-rose-200/90 bg-rose-50/25 hover:bg-rose-50/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                              <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-xs ${
                                isCorrect 
                                  ? 'bg-emerald-600 text-white' 
                                  : 'bg-rose-600 text-white'
                              }`}>
                                {isCorrect ? '✓' : '✗'}
                              </div>

                              <div className="space-y-2 flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    Q{originalIdx + 1}
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full uppercase ${
                                    isCorrect 
                                      ? 'bg-emerald-100 text-emerald-800' 
                                      : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {isCorrect ? (isHindi ? 'सही उत्तर' : 'Correct') : (isHindi ? 'सुधार आवश्यक' : 'Incorrect')}
                                  </span>
                                </div>

                                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                                  {q.question}
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                                  {/* Student's Answer */}
                                  <div className={`p-2.5 rounded-xl border ${
                                    isCorrect 
                                      ? 'bg-emerald-100/50 border-emerald-300/80 text-emerald-950' 
                                      : 'bg-rose-100/50 border-rose-300/80 text-rose-950'
                                  }`}>
                                    <span className="text-[10px] font-black uppercase block tracking-wider opacity-75">
                                      {isHindi ? 'आपका उत्तर:' : 'Your Answer:'}
                                    </span>
                                    <span className="font-bold text-xs mt-0.5 block">
                                      {userAnsIdx !== undefined && userAnsIdx >= 0 
                                        ? `${String.fromCharCode(65 + userAnsIdx)}. ${q.options[userAnsIdx]}` 
                                        : (isHindi ? 'समय समाप्त / अनुत्तरित' : 'Timed Out / Unanswered')}
                                    </span>
                                  </div>

                                  {/* Correct Answer (Shown if student was incorrect) */}
                                  {!isCorrect && (
                                    <div className="p-2.5 rounded-xl bg-emerald-100/50 border border-emerald-300/80 text-emerald-950">
                                      <span className="text-[10px] font-black uppercase block tracking-wider text-emerald-800 opacity-75">
                                        {isHindi ? 'सही उत्तर:' : 'Correct Solution:'}
                                      </span>
                                      <span className="font-bold text-xs mt-0.5 block text-emerald-900">
                                        {String.fromCharCode(65 + q.answer)}. {q.options[q.answer]}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {q.explanation && (
                              <button
                                type="button"
                                onClick={() => setExpandedExplanation(expandedExplanation === originalIdx ? null : originalIdx)}
                                className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center space-x-1 shrink-0 p-1 rounded-lg hover:bg-indigo-50 transition cursor-pointer"
                                title="Toggle explanation"
                              >
                                <span className="hidden sm:inline">{isExpanded ? (isHindi ? 'छिपाएं' : 'Hide') : (isHindi ? 'विस्तार' : 'Explain')}</span>
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            )}
                          </div>

                          {/* Concept Explanation Accordion */}
                          {isExpanded && q.explanation && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-3.5 pt-3.5 border-t border-slate-200/70 text-xs text-slate-800 leading-relaxed bg-white/80 p-3.5 rounded-xl space-y-1 shadow-2xs"
                            >
                              <div className="flex items-center space-x-1.5 font-bold text-indigo-900">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                <span>{isHindi ? 'अवधारणा और कारण:' : 'Concept Rationale:'}</span>
                              </div>
                              <p className="text-slate-700 pl-5">
                                {q.explanation}
                              </p>
                            </motion.div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 4. FOOTER ACTION CONTROLS */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setViewState('setup')}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center justify-center space-x-2 shadow-xs active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{isHindi ? 'मुख्य सेटअप पर लौटें' : 'Return to Setup'}</span>
                </button>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleStartQuiz}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95 border border-indigo-400/30"
                  >
                    <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                    <span>{isHindi ? 'इस विषय का पुनः टेस्ट लें' : 'Retake This Topic'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* ========================================================================= */}
        {/* VIEW 5: PAST QUIZ HISTORY / RESULTS */}
        {/* ========================================================================= */}
        {viewState === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Past Mock Exams & Results
                </h2>
                <p className="text-xs text-slate-500">
                  Review previous test submissions and score progress
                </p>
              </div>

              <button
                onClick={() => setViewState('setup')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer"
              >
                Back to Arena
              </button>
            </div>

            <div className="grid gap-3">
              {savedExams.map((exam) => (
                <div
                  key={exam.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between gap-4"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                      {exam.subject.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {exam.subject}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(exam.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                        {exam.topic}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {exam.feedback}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-extrabold text-indigo-600">
                      Score: {exam.score}
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Completed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
