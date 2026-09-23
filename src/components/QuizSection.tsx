import { useState, useEffect, useCallback } from 'react';
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
  X
} from 'lucide-react';
import { generateQuiz } from '../services/geminiService';
import { showToast } from './Toast';
import { parseError, logError } from '../utils/errorHandler';
import type { Subject, MockExam, UserProfile } from '../types';

interface QuizSectionProps {
  user: UserProfile;
  onAddXp?: (amount: number) => void;
  onSaveMockExam?: (exam: MockExam) => Promise<void>;
  savedExams?: MockExam[];
  onClose?: () => void;
  language?: string;
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

export default function QuizSection({
  user,
  onAddXp,
  onSaveMockExam,
  savedExams = [],
  onClose,
  language = 'en'
}: QuizSectionProps) {
  // Navigation & Step State
  const [viewState, setViewState] = useState<'setup' | 'loading' | 'active' | 'results' | 'history'>('setup');

  // Setup Config
  const [selectedSubject, setSelectedSubject] = useState<Subject>('Mathematics');
  const [customTopic, setCustomTopic] = useState('Trigonometry & Formulas');
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

  // Fallback Generation or Gemini API
  const handleStartQuiz = async () => {
    const topicToUse = customTopic.trim() || 'Core Concepts';
    setViewState('loading');
    setErrorMsg('');

    try {
      const generated = await generateQuiz(
        selectedSubject,
        {
          name: user.name || 'Student',
          school: user.schoolName || '',
          className: `${user.className || 'Class 12'} - Topic: ${topicToUse}`,
          country: 'India'
        },
        language === 'hi' ? 'Hindi' : 'English',
        difficulty
      );

      if (Array.isArray(generated) && generated.length > 0) {
        setQuestions(generated);
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
      const isHindi = language === 'hi' || language === 'Hindi';
      const msg = isHindi ? parsed.messageHindi : parsed.message;
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

  // Finish Quiz & Calculate Final Score
  const handleFinishQuiz = useCallback(async () => {
    const elapsedSeconds = Math.round((Date.now() - quizStartTime) / 1000);
    setTotalTimeTakenSec(elapsedSeconds);

    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.answer) {
        correctCount++;
      }
    });

    // Calculate XP: 15 XP per correct answer + bonus for streaks + accuracy
    const accuracy = Math.round((correctCount / questions.length) * 100);
    let earnedXp = correctCount * 15;
    if (accuracy >= 80) earnedXp += 25;
    if (maxStreak >= 3) earnedXp += 20;

    if (onAddXp) {
      onAddXp(earnedXp);
    }

    // Save Mock Exam
    if (onSaveMockExam) {
      const mockExamRecord: MockExam = {
        id: `exam_${Date.now()}`,
        userId: user.uid,
        subject: selectedSubject,
        topic: customTopic || 'General Quiz',
        questionsJson: JSON.stringify(questions),
        submittedAnswersJson: JSON.stringify(userAnswers),
        score: correctCount,
        completed: true,
        feedback: `Completed with ${accuracy}% accuracy (${correctCount}/${questions.length}) in ${elapsedSeconds}s.`,
        timestamp: new Date().toISOString()
      };
      await onSaveMockExam(mockExamRecord);
    }

    setViewState('results');
  }, [quizStartTime, questions, userAnswers, maxStreak, onAddXp, onSaveMockExam, user.uid, selectedSubject, customTopic]);

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
        handleFinishQuiz();
      }
    }
  };

  // Next Question Button
  const handleNextQuestion = () => {
    setIsOptionLocked(false);
    if (currentIndex + 1 < questions.length) {
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

            {/* SUBJECT PICKER CARDS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <span>1. Choose Subject</span>
                </h3>
                <span className="text-[11px] font-semibold text-slate-400">
                  {SUBJECT_CONFIGS.length} Subjects Available
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
                  <span>2. Select or Enter Topic</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Pick a suggested syllabus topic or type any specific chapter / formula.
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
                  placeholder="e.g. Organic Isomerism, Photosynthesis Light Reaction, Limits & Continuity..."
                  className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium text-slate-900 transition"
                />
              </div>
            </div>

            {/* DIFFICULTY & GAMEPLAY RULES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* DIFFICULTY SELECTOR */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3 shadow-xs">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>3. Difficulty Level</span>
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
                        {diff === 'Easy' && '🌱 Easy'}
                        {diff === 'Medium' && '⚖️ Medium'}
                        {diff === 'Hard' && '🔥 Hard'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TIMED MODE & INSTANT REVIEWS */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3 shadow-xs">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                  <Timer className="w-4 h-4 text-cyan-600" />
                  <span>4. Quiz Mode</span>
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
                    <span>30s Timed Round</span>
                  </button>

                  <button
                    onClick={() => setIsTimed(false)}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      !isTimed
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>🧘 Relaxed Study</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-600">Instant Answer Analysis</span>
                  <button
                    type="button"
                    onClick={() => setInstantFeedback(!instantFeedback)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition ${
                      instantFeedback
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {instantFeedback ? '✓ Enabled' : 'Off'}
                  </button>
                </div>
              </div>
            </div>

            {/* ACTION CTA BAR */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Earn up to <strong>+75 XP</strong> with streak bonuses!</span>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                {savedExams.length > 0 && (
                  <button
                    onClick={() => setViewState('history')}
                    className="px-4 py-3 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <History className="w-4 h-4 text-slate-500" />
                    <span>Past Results ({savedExams.length})</span>
                  </button>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStartQuiz}
                  className="flex-1 sm:flex-initial px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Launch Practice Quiz</span>
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
                AI Tutor is formulating multiple choice questions for <strong>"{customTopic}"</strong> at {difficulty} difficulty...
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

              {/* FOOTER ACTION (NEXT QUESTION) */}
              {isOptionLocked && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end pt-2"
                >
                  <button
                    onClick={handleNextQuestion}
                    className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition flex items-center space-x-2 cursor-pointer active:scale-95"
                  >
                    <span>
                      {currentIndex + 1 < questions.length ? 'Next Question' : 'View Final Score'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: CELEBRATORY SCORECARD & ANALYTICS */}
        {/* ========================================================================= */}
        {viewState === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            {/* SCORE HERO CARD */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-indigo-900/40 shadow-xl text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-lg mx-auto space-y-4">
                {/* TROPHY & BADGE */}
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 12 }}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-amber-500/20"
                >
                  🏆
                </motion.div>

                <div>
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {scorePercentage >= 90
                        ? 'S-Rank Mastery 🌟'
                        : scorePercentage >= 75
                        ? 'A-Rank Scholar 🚀'
                        : scorePercentage >= 50
                        ? 'B-Rank Good Effort 🎯'
                        : 'Growth Tier 🌱'}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    Quiz Completed!
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    You answered <strong>{correctAnswersCount}</strong> out of <strong>{questions.length}</strong> questions correctly ({scorePercentage}% accuracy).
                  </p>
                </div>

                {/* STATS MATRIX */}
                <div className="grid grid-cols-3 gap-2.5 pt-2">
                  <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">XP Earned</div>
                    <div className="text-base sm:text-lg font-black text-amber-400">
                      +{correctAnswersCount * 15 + (scorePercentage >= 80 ? 25 : 0)} XP
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Max Streak</div>
                    <div className="text-base sm:text-lg font-black text-emerald-400">
                      {maxStreak} 🔥
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Time Taken</div>
                    <div className="text-base sm:text-lg font-black text-cyan-400">
                      {totalTimeTakenSec}s ⏱️
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* QUESTION BY QUESTION BREAKDOWN */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <BookMarked className="w-4 h-4 text-indigo-600" />
                  <span>Question-by-Question Review</span>
                </h3>
                <span className="text-xs text-slate-500 font-semibold">
                  {correctAnswersCount}/{questions.length} Correct
                </span>
              </div>

              <div className="space-y-3">
                {questions.map((q, idx) => {
                  const userAnsIdx = userAnswers[idx];
                  const isCorrect = userAnsIdx === q.answer;
                  const isExpanded = expandedExplanation === idx;

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border transition ${
                        isCorrect
                          ? 'border-emerald-200 bg-emerald-50/30'
                          : 'border-rose-200 bg-rose-50/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                              {q.question}
                            </h4>
                            <div className="mt-1.5 space-y-0.5 text-xs">
                              <div className="text-slate-600">
                                <strong>Your Answer:</strong>{' '}
                                <span className={isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                                  {userAnsIdx !== undefined && userAnsIdx >= 0 ? q.options[userAnsIdx] : 'Timed Out / Missed'}
                                </span>
                              </div>
                              {!isCorrect && (
                                <div className="text-slate-600">
                                  <strong>Correct Answer:</strong>{' '}
                                  <span className="text-emerald-700 font-bold">{q.options[q.answer]}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {q.explanation && (
                          <button
                            onClick={() => setExpandedExplanation(isExpanded ? null : idx)}
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center space-x-1 shrink-0 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Hide Note' : 'Explain'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>

                      {/* EXPANDED EXPLANATION */}
                      {isExpanded && q.explanation && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 pt-3 border-t border-slate-200/60 text-xs text-slate-700 leading-relaxed bg-white/60 p-3 rounded-xl"
                        >
                          <strong>Concept Note:</strong> {q.explanation}
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                onClick={() => setViewState('setup')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Setup</span>
              </button>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  onClick={handleStartQuiz}
                  className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retake Topic</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

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
