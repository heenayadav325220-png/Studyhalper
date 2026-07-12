import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Rocket, Cpu, Sparkles, BookOpen, Users, GraduationCap, X, Plus, Info, 
  MessageSquare, Send, Check, Play, Pause, RotateCcw, Award, Star, Zap, 
  Calendar, ExternalLink, Video, Lock, Edit, Trash, ChevronRight, Eye, 
  ImageIcon, Atom, RefreshCw, BarChart2, CheckCircle2, AlertTriangle, 
  HelpCircle 
} from 'lucide-react';
import { HomeworkSolver } from './HomeworkSolver';

interface AndromedaCosmicProps {
  user: any;
  setUser: (updater: any) => void;
  appLanguage: string;
  translate: (key: string, lang: string, fallback: string) => string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  competitiveStream: 'UPSC' | 'NEET' | 'JEE';
  setCompetitiveStream: (stream: 'UPSC' | 'NEET' | 'JEE') => void;
  awardPoints: (amount: number, checkBadgeType?: string) => void;
  playAudioChime: (type: string) => void;
  notes: any[];
  setNotes: React.Dispatch<React.SetStateAction<any[]>>;
  flashcards: any[];
  setFlashcards: React.Dispatch<React.SetStateAction<any[]>>;
  groups: any[];
  setGroups: React.Dispatch<React.SetStateAction<any[]>>;
  activeGroup: any;
  setActiveGroup: (group: any) => void;
  chatMessages: any[];
  setChatMessages: React.Dispatch<React.SetStateAction<any[]>>;
  tutorSessions: any[];
  saveTutorSessions: (sessions: any[]) => void;
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  handleSendMessage: () => Promise<void>;
  chatInput: string;
  setChatInput: (val: string) => void;
  isChatLoading: boolean;
  appTheme: string;
  setAppTheme: (theme: string) => void;
}

const AndromedaCosmic = memo(function AndromedaCosmic({
  user,
  setUser,
  appLanguage,
  translate,
  activeTab,
  setActiveTab,
  competitiveStream,
  setCompetitiveStream,
  awardPoints,
  playAudioChime,
  notes,
  setNotes,
  flashcards,
  setFlashcards,
  groups,
  setGroups,
  activeGroup,
  setActiveGroup,
  chatMessages,
  setChatMessages,
  tutorSessions,
  saveTutorSessions,
  activeSessionId,
  setActiveSessionId,
  handleSendMessage,
  chatInput,
  setChatInput,
  isChatLoading,
  appTheme,
  setAppTheme,
}: AndromedaCosmicProps) {

  // Local state for Hyperdrive Study Reactor
  const [reactorTime, setReactorTime] = useState(25 * 60); // 25 minutes
  const [isReactorRunning, setIsReactorRunning] = useState(false);
  const [reactorMode, setReactorMode] = useState<'focus' | 'break'>('focus');
  const [selectedQuestId, setSelectedQuestId] = useState<number | null>(null);

  // Scratchpad for whiteboards
  const [localWhiteboardLines, setLocalWhiteboardLines] = useState<any[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const whiteboardCanvasRef = useRef<HTMLCanvasElement>(null);

  // Mock quiz simulator states
  const [simulatorStep, setSimulatorStep] = useState<'setup' | 'active' | 'results'>('setup');
  const [simulatorTime, setSimulatorTime] = useState(120); // 2 minutes countdown
  const [simulatorScore, setSimulatorScore] = useState(0);
  const [simulatorXPChange, setSimulatorXPChange] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userSelectedAnswer, setUserSelectedAnswer] = useState<string | null>(null);
  const [answeredHistory, setAnsweredHistory] = useState<any[]>([]);

  // Flashcards combo streak display overrides
  const [selectedFlashcard, setSelectedFlashcard] = useState<any>(null);
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState(false);

  // Custom prompt short-cuts definitions for competitive streams
  const shortcuts = {
    UPSC: [
      { id: 'u1', label: 'Constitution Articles', text: 'Explain key articles of Part III of the Indian Constitution with land-mark judgments.' },
      { id: 'u2', label: 'GS Paper 2 Strategy', text: 'Suggest standard answer format for GS Paper II federalism questions.' },
      { id: 'u3', label: 'Geography Mindmap', text: 'Draw an ASCII structural flowchart of atmospheric circulation cells.' }
    ],
    NEET: [
      { id: 'n1', label: 'Cell Division Steps', text: 'Deconstruct Meiosis I and explain the genetic recombinations.' },
      { id: 'n2', label: 'Organic Rxn Guide', text: 'Detail the mechanism and transition states of SN1 and SN2 pathways.' },
      { id: 'n3', label: 'Human Endocrinology', text: 'List the hypothalamic hormones and their physiological feedback loops.' }
    ],
    JEE: [
      { id: 'j1', label: 'Maxwell’s Equations', text: 'Derive Maxwell’s displacement current correction with field equations.' },
      { id: 'j2', label: 'Calculus Proofs', text: 'Explain the Mean Value Theorem and solve a critical limit limit evaluation.' },
      { id: 'j3', label: 'Rotational Mechanics', text: 'Explain moment of inertia tensor matrix and torque coupling problems.' }
    ]
  };

  // Quests list mapping dynamically
  const targetQuests = {
    UPSC: [
      { id: 101, title: 'Indian Polity Drill', desc: 'Attempt MCQ simulator on Fundamental Rights', reward: 30, completed: false, action: 'quiz' },
      { id: 102, title: 'Modern History Briefing', desc: 'Read or create a briefing on 1857 Revolt', reward: 25, completed: false, action: 'notebook' },
      { id: 103, title: 'CSAT Aptitude Check', desc: 'Complete 3 logical reasoning challenges', reward: 40, completed: false, action: 'quiz' }
    ],
    NEET: [
      { id: 201, title: 'Human Physiology Recall', desc: 'Review spaced-repetition cards on Cardiac cycle', reward: 35, completed: false, action: 'notebook' },
      { id: 202, title: 'Organic Reaction Quiz', desc: 'Score perfectly in Nucleophilic substitutions', reward: 40, completed: false, action: 'quiz' },
      { id: 203, title: 'Plant Kingdoms Annotate', desc: 'Solve homework diagrams of angiosperms', reward: 30, completed: false, action: 'chat' }
    ],
    JEE: [
      { id: 301, title: 'Electromagnetism Derivation', desc: 'Solve JEE Advanced Gauss law problem set', reward: 40, completed: false, action: 'chat' },
      { id: 302, title: 'Coordinate Geometry Review', desc: 'Review 5 flashcards on Parabola & Ellipse', reward: 30, completed: false, action: 'notebook' },
      { id: 303, title: 'JEE Physics Simulation', desc: 'Pass the 2-minute mock simulator challenge', reward: 50, completed: false, action: 'quiz' }
    ]
  };

  // Stream-specific mock simulation questions
  const simulatorQuestions = {
    UPSC: [
      {
        q: "With reference to the Indian Parliament, which of the following is correct?",
        options: [
          "A Money Bill can only be introduced in the Lok Sabha.",
          "A Money Bill can be amended or rejected by Rajya Sabha.",
          "The President can summon a joint sitting for a Money Bill.",
          "None of the above."
        ],
        correct: "A Money Bill can only be introduced in the Lok Sabha."
      },
      {
        q: "Under the Indian Constitution, the reservation for women in Panchayati Raj Institutions is guaranteed under which Article?",
        options: [
          "Article 243D",
          "Article 243T",
          "Article 324",
          "Article 15(3)"
        ],
        correct: "Article 243D"
      }
    ],
    NEET: [
      {
        q: "Which of the following is correct regarding crossing over in Prophase I of Meiosis?",
        options: [
          "It occurs between non-sister chromatids of homologous chromosomes.",
          "It is facilitated by the enzyme recombinase.",
          "It occurs during the pachytene stage.",
          "All of the above are correct."
        ],
        correct: "All of the above are correct."
      },
      {
        q: "The structural and functional unit of the human kidney is known as:",
        options: [
          "Nephron",
          "Neuron",
          "Henle’s loop",
          "Glomerulus"
        ],
        correct: "Nephron"
      }
    ],
    JEE: [
      {
        q: "If z is a complex number such that |z - 3i| = 2, then the minimum value of |z - 4| is:",
        options: [
          "3",
          "sqrt(5)",
          "sqrt(7) - 2",
          "sqrt(25) - 2"
        ],
        correct: "3"
      },
      {
        q: "The electric field of an electromagnetic wave is given by E = E0 cos(kz - wt)i. The magnetic field is:",
        options: [
          "B = (E0/c) cos(kz - wt)j",
          "B = (E0 * c) cos(kz - wt)j",
          "B = (E0/c) sin(kz - wt)j",
          "B = - (E0/c) cos(kz - wt)j"
        ],
        correct: "B = (E0/c) cos(kz - wt)j"
      }
    ]
  };

  // Mock student rankings for competitive exams
  const peerRankings = {
    UPSC: [
      { rank: 1, name: "Prerna Sharma", score: 850, isYou: false, isAI: false, tag: "AIR 4 (Mock)" },
      { rank: 2, name: "Siddharth Verma", score: 790, isYou: false, isAI: true, tag: "AIR 12 (AI)" },
      { rank: 3, name: user?.name || "You", score: user?.points || 0, isYou: true, isAI: false, tag: "AIR 45" },
      { rank: 4, name: "Amit Yadav", score: 210, isYou: false, isAI: false, tag: "AIR 112" }
    ],
    NEET: [
      { rank: 1, name: "Ananya Sen", score: 710, isYou: false, isAI: false, tag: "99.8 Percentile" },
      { rank: 2, name: "Dr. Bot (Study AI)", score: 695, isYou: false, isAI: true, tag: "99.5 Percentile" },
      { rank: 3, name: user?.name || "You", score: user?.points || 0, isYou: true, isAI: false, tag: "98.2 Percentile" },
      { rank: 4, name: "Rishabh Das", score: 540, isYou: false, isAI: false, tag: "91.4 Percentile" }
    ],
    JEE: [
      { rank: 1, name: "Kshitiz Gupta", score: 980, isYou: false, isAI: false, tag: "AIR 15" },
      { rank: 2, name: "Hyperion-AI", score: 920, isYou: false, isAI: true, tag: "AIR 32 (AI)" },
      { rank: 3, name: user?.name || "You", score: user?.points || 0, isYou: true, isAI: false, tag: "AIR 184" },
      { rank: 4, name: "Vikram Malhotra", score: 320, isYou: false, isAI: false, tag: "AIR 945" }
    ]
  };

  // Hyperdrive Reactor tick logic
  useEffect(() => {
    let interval: any;
    if (isReactorRunning && reactorTime > 0) {
      interval = setInterval(() => {
        setReactorTime(prev => prev - 1);
      }, 1000);
    } else if (isReactorRunning && reactorTime === 0) {
      setIsReactorRunning(false);
      playAudioChime('levelUp');
      if (reactorMode === 'focus') {
        const rewardXP = 30;
        awardPoints(rewardXP);
        alert(
          appLanguage === 'Hindi'
            ? `🏁 फोकस समय पूरा हुआ! आपने +${rewardXP} गैलेक्टिक XP अर्जित किया! 🌌`
            : `🏁 Focus Session Completed! You earned +${rewardXP} Galactic XP! 🌌`
        );
        setReactorMode('break');
        setReactorTime(5 * 60); // 5 min break
      } else {
        alert(
          appLanguage === 'Hindi'
            ? "Break over! Ready for another study launch?"
            : "Break over! Ready for another study launch?"
        );
        setReactorMode('focus');
        setReactorTime(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isReactorRunning, reactorTime]);

  // Simulated quiz timer logic
  useEffect(() => {
    let interval: any;
    if (simulatorStep === 'active' && simulatorTime > 0) {
      interval = setInterval(() => {
        setSimulatorTime(prev => prev - 1);
      }, 1000);
    } else if (simulatorStep === 'active' && simulatorTime === 0) {
      handleCompleteSimulator();
    }
    return () => clearInterval(interval);
  }, [simulatorStep, simulatorTime]);

  const toggleReactor = () => {
    setIsReactorRunning(!isReactorRunning);
    playAudioChime('click');
  };

  const resetReactor = () => {
    setIsReactorRunning(false);
    setReactorTime(reactorMode === 'focus' ? 25 * 60 : 5 * 60);
    playAudioChime('draw');
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Synergy Whiteboard Sketching Handlers
  const handleWhiteboardMouseDown = (e: React.MouseEvent) => {
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setLocalWhiteboardLines(prev => [...prev, { tool: 'pen', color: '#ff2a85', points: [x, y] }]);
  };

  const handleWhiteboardMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setLocalWhiteboardLines(prev => {
      if (prev.length === 0) return prev;
      const lastLine = { ...prev[prev.length - 1] };
      lastLine.points = [...lastLine.points, x, y];
      return [...prev.slice(0, prev.length - 1), lastLine];
    });
  };

  const handleWhiteboardMouseUp = () => {
    setIsDrawing(false);
  };

  // Draw logic
  useEffect(() => {
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    localWhiteboardLines.forEach(line => {
      if (line.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = line.color;
      ctx.lineWidth = 3;
      ctx.moveTo(line.points[0], line.points[1]);
      for (let i = 2; i < line.points.length; i += 2) {
        ctx.lineTo(line.points[i], line.points[i+1]);
      }
      ctx.stroke();
    });
  }, [localWhiteboardLines]);

  const clearWhiteboard = () => {
    setLocalWhiteboardLines([]);
    playAudioChime('trash');
  };

  // Quiz simulator handling
  const startSimulator = () => {
    setSimulatorStep('active');
    setSimulatorTime(120);
    setSimulatorScore(0);
    setSimulatorXPChange(0);
    setCurrentQuestionIdx(0);
    setUserSelectedAnswer(null);
    setAnsweredHistory([]);
    playAudioChime('click');
  };

  const handleAnswerOptionSelect = (option: string) => {
    setUserSelectedAnswer(option);
    playAudioChime('click');
  };

  const submitSimulatorAnswer = () => {
    if (!userSelectedAnswer) return;
    const currentQList = simulatorQuestions[competitiveStream];
    const currentQ = currentQList[currentQuestionIdx];
    const isCorrect = userSelectedAnswer === currentQ.correct;

    const nextScore = simulatorScore + (isCorrect ? 4 : -1);
    setSimulatorScore(nextScore);

    setAnsweredHistory(prev => [...prev, {
      question: currentQ.q,
      userAnswer: userSelectedAnswer,
      correctAnswer: currentQ.correct,
      isCorrect
    }]);

    if (currentQuestionIdx < currentQList.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setUserSelectedAnswer(null);
      playAudioChime(isCorrect ? 'success' : 'draw');
    } else {
      handleCompleteSimulator(nextScore);
    }
  };

  const handleCompleteSimulator = (finalScore?: number) => {
    const score = finalScore !== undefined ? finalScore : simulatorScore;
    setSimulatorStep('results');
    
    // Convert score to XP with strict negative marking support
    const xpChange = Math.max(-10, score * 5);
    setSimulatorXPChange(xpChange);
    awardPoints(xpChange);
    playAudioChime(xpChange > 0 ? 'levelUp' : 'trash');
  };

  // Helper translations for subjects dynamically
  const getSubTitle = () => {
    if (competitiveStream === 'UPSC') return '🏛️ UPSC Civil Services CSE';
    if (competitiveStream === 'NEET') return '🩺 NEET UG Entrance Exam';
    return '🚀 IIT JEE Advanced Engine';
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#030012] text-purple-100 scrollbar-hide andromeda-container">
      
      {/* 🚀 ANDROMEDA FLOATING GLOW HEADER & STREAM SWITCHER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-950/40 via-[#0b0528]/80 to-indigo-950/40 p-4 rounded-3xl border border-purple-500/25 shadow-[0_0_20px_rgba(168,85,247,0.15)] flex flex-col space-y-3.5">
        
        {/* Particle/Star field backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent pointer-events-none" />

        <div className="flex justify-between items-start z-10">
          <div>
            <div className="flex items-center space-x-1.5 pl-1">
              <span className="text-[10px] font-black text-pink-400 bg-pink-500/15 border border-pink-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-widest font-mono">
                🪐 ANDROMEDA PILOT
              </span>
              <span className="text-xs">🛸</span>
            </div>
            
            <h1 className="text-xl font-black text-white mt-1.5 tracking-tight flex items-center leading-none">
              {appLanguage === 'Hindi' ? `नमस्ते, कैप्टन ${user?.name || 'ST'}!` : `Welcome, Commander ${user?.name || 'ST'}!`}
              <span className="text-pink-500 ml-1.5 animate-pulse">✨</span>
            </h1>
            <p className="text-[10px] text-purple-400 font-mono mt-1 font-bold">
              SYSTEM LEVEL: <span className="text-pink-400 font-black">LVL {user?.level || 1}</span> | GLOBAL RANK: <span className="text-pink-400 font-black">{competitiveStream === 'UPSC' ? 'AIR 45' : competitiveStream === 'NEET' ? 'AIR 184' : 'AIR 129'}</span>
            </p>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => {
                setAppTheme('default');
                playAudioChime('click');
              }}
              className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-[9px] font-black text-slate-400 hover:text-white rounded-xl select-none transition"
              title="Return to standard Earth-Mode study layout"
            >
              🌏 Standard Mode
            </button>
          </div>
        </div>

        {/* Dynamic Competitive Stream Switcher in Floating Header */}
        <div className="border-t border-purple-500/10 pt-3.5 flex flex-col space-y-2 z-10">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-black uppercase text-purple-400 tracking-wider flex items-center gap-1">
              <Rocket className="w-3.5 h-3.5 text-pink-400 animate-bounce" />
              <span>{appLanguage === 'Hindi' ? 'प्रतियोगी परीक्षा लक्ष्य चुनें' : 'SELECT COMPETITIVE MISSION'}</span>
            </span>
            <span className="text-[8px] bg-purple-500/10 text-pink-400 border border-pink-500/35 px-2 py-0.5 rounded-full font-mono font-black uppercase">
              Target Lock
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['UPSC', 'NEET', 'JEE'].map((stream) => (
              <button
                key={stream}
                onClick={() => {
                  setCompetitiveStream(stream as any);
                  playAudioChime('levelUp');
                }}
                className={`py-2 px-1 rounded-xl text-[11px] font-black tracking-tight border transition-all duration-300 ${
                  competitiveStream === stream
                    ? 'bg-gradient-to-r from-pink-500 via-purple-600 to-pink-600 text-white border-pink-400 shadow-md shadow-pink-500/25 scale-102 font-black'
                    : 'bg-purple-950/20 text-purple-300 border-purple-500/10 hover:border-purple-500/30'
                }`}
              >
                {stream === 'UPSC' ? '🏛️ UPSC Civil' : stream === 'NEET' ? '🩺 NEET UG' : '🚀 IIT JEE'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 🌌 VIEWPORT: ACTIVE TAB LOGIC DOCK */}

      {/* 1. MISSION CONTROL HUB (activeTab === 'home') */}
      {activeTab === 'home' && (
        <div className="space-y-4 animate-fadeIn" id="andromeda_mission_control">
          
          {/* Bento-Grid Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Box A: Hyperdrive Study Reactor */}
            <div className="bg-[#0b0528]/80 border border-purple-500/20 p-4 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Atom className="w-24 h-24 text-pink-500 animate-spin" style={{ animationDuration: '20s' }} />
              </div>

              <div>
                <span className="text-[9px] font-mono font-black uppercase tracking-wider text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-md border border-pink-500/20">
                  ⚡ Hyperdrive Study Reactor
                </span>
                <h3 className="text-sm font-black text-white mt-2">
                  {reactorMode === 'focus' ? 'QUANTUM FOCUS ACTIVE' : 'REACTOR COOLING BREAK'}
                </h3>
                <p className="text-[10px] text-purple-400 mt-1">
                  Activate the cosmic study engine to earn +30 Galactic XP.
                </p>
              </div>

              {/* Orb timer readout */}
              <div className="flex items-center space-x-4 my-3">
                <div className={`w-14 h-14 rounded-full border-2 ${isReactorRunning ? 'border-pink-500 border-t-transparent animate-spin' : 'border-purple-500/40'} flex items-center justify-center relative`}>
                  <div className="absolute inset-1.5 rounded-full bg-purple-950/60 flex items-center justify-center font-mono text-xs font-black text-white">
                    ⏱️
                  </div>
                </div>
                <div>
                  <div className="font-mono text-2xl font-black text-white tracking-widest">
                    {formatTime(reactorTime)}
                  </div>
                  <div className="text-[9px] text-purple-400 font-mono font-bold mt-0.5">
                    {reactorMode === 'focus' ? 'FOCUS TIME (25M)' : 'BREAK TIME (5M)'}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 border-t border-purple-500/10 pt-3">
                <button
                  onClick={toggleReactor}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
                    isReactorRunning 
                      ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30' 
                      : 'bg-pink-600 hover:bg-pink-700 text-white shadow-md shadow-pink-500/10'
                  }`}
                >
                  {isReactorRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isReactorRunning ? 'Halt Engine' : 'Engage Reactor'}</span>
                </button>
                <button
                  onClick={resetReactor}
                  className="p-1.5 bg-purple-950/50 border border-purple-500/20 rounded-xl hover:text-white transition"
                  title="Re-calibrate study reactor"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Box B: Star System Leaderboard */}
            <div className="bg-[#0b0528]/80 border border-purple-500/20 p-4 rounded-3xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono font-black uppercase tracking-wider text-purple-400">
                    🏆 Star System Leaderboard
                  </span>
                  <span className="text-[9px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-md font-mono">
                    {competitiveStream} Sector
                  </span>
                </div>
                <h3 className="text-xs font-black text-white mt-1.5 uppercase font-sans tracking-tight">
                  {appLanguage === 'Hindi' ? 'वास्तविक छात्र और एआई सहकर्मी' : 'Live Galactic Peer Standings'}
                </h3>
                
                {/* Explain Ranks (Hindi or English Response to query 2) */}
                <p className="text-[9px] text-purple-400/90 italic leading-snug mt-1 border-l-2 border-pink-500 pl-2">
                  {appLanguage === 'Hindi' 
                    ? "यह रैंक वास्तविक रूप से पढ़ रहे सक्रिय छात्रों (जैसे प्रेरणा, अमित) और हमारे विशेषज्ञ एआई स्टडी बडीज़ के अंकों के साथ एक वास्तविक समय के क्षेत्र-वार स्कोर का संदर्भ देती है।"
                    : "This rank refers to real, live competitive aspirants synced with standard leaderboard indexes along with calibrated expert AI peers."}
                </p>
              </div>

              {/* Leaderboard list */}
              <div className="space-y-1.5 mt-3">
                {peerRankings[competitiveStream].map((peer, idx) => (
                  <div 
                    key={idx} 
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs ${
                      peer.isYou 
                        ? 'bg-pink-500/10 border-pink-500/30 font-black shadow-xs' 
                        : 'bg-purple-950/20 border-purple-500/10'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-black ${
                        peer.rank === 1 ? 'bg-amber-400 text-amber-950 font-black' :
                        peer.rank === 2 ? 'bg-slate-300 text-slate-900' :
                        'bg-purple-950 text-purple-300'
                      }`}>
                        {peer.rank}
                      </span>
                      <div>
                        <p className="font-extrabold text-white flex items-center">
                          {peer.name}
                          {peer.isAI && <span className="ml-1 text-[8px] bg-purple-500 text-white px-1 rounded font-mono font-black">AI</span>}
                        </p>
                        <p className="text-[8px] text-purple-400 font-mono font-bold leading-none">{peer.tag}</p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] font-black text-pink-400">{peer.score} Galactic XP</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Andromeda Quest Log / Target Missions */}
          <div className="bg-[#0b0528]/80 border border-purple-500/20 p-4 rounded-3xl space-y-3">
            <div className="flex justify-between items-center border-b border-purple-500/10 pb-2">
              <div className="flex items-center space-x-1.5">
                <Zap className="w-4 h-4 text-pink-400" />
                <div>
                  <h3 className="text-xs font-black text-white uppercase font-sans">
                    {appLanguage === 'Hindi' ? 'सक्रिय दैनिक लक्ष्य और मिशन' : 'ACTIVE GALACTIC DAILY MISSIONS'}
                  </h3>
                  <p className="text-[9px] text-purple-400">Launch direct missions targeting your {competitiveStream} syllabus</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {targetQuests[competitiveStream].map((quest) => (
                <div 
                  key={quest.id} 
                  className={`p-3 rounded-2xl border flex flex-col justify-between space-y-2 ${
                    selectedQuestId === quest.id 
                      ? 'bg-pink-500/10 border-pink-500/30 shadow-md shadow-pink-500/5' 
                      : 'bg-purple-950/20 border-purple-500/10'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono font-black text-pink-400 uppercase tracking-widest">
                        MISSION READY 🚀
                      </span>
                      <span className="text-[8px] font-mono font-black text-emerald-400">
                        +{quest.reward} XP
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-white mt-1.5 leading-snug">{quest.title}</h4>
                    <p className="text-[9px] text-purple-400 mt-0.5 leading-tight">{quest.desc}</p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedQuestId(quest.id);
                      setActiveTab(quest.action);
                      playAudioChime('levelUp');
                    }}
                    className="w-full py-1 bg-purple-500/25 hover:bg-pink-600 text-white border border-purple-500/30 hover:border-pink-500 rounded-xl text-[9px] font-black transition cursor-pointer"
                  >
                    Launch Mission 🌌
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. ANDROMEDA AI CORE CONSOLE (activeTab === 'chat') */}
      {activeTab === 'chat' && (
        <div className="space-y-4 animate-fadeIn" id="andromeda_ai_core">
          
          {/* Homework Solver Scanner Header Block */}
          <div className="bg-gradient-to-r from-[#0d0738] via-[#05011f] to-[#0d0738] border border-pink-500/30 p-4 rounded-3xl relative overflow-hidden space-y-3.5">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Cpu className="w-32 h-32 text-pink-400 animate-pulse" />
            </div>

            <div className="flex items-center space-x-2 border-b border-purple-500/10 pb-2.5 z-10 relative">
              <div className="w-8 h-8 rounded-xl bg-pink-500/15 flex items-center justify-center border border-pink-500/40 text-pink-400 font-bold select-none text-sm animate-pulse">
                📸
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase font-sans tracking-wide">
                  {appLanguage === 'Hindi' ? 'एआई होमवर्क सॉल्वर स्कैनर' : 'AI STUDY SCANNER & HOMEWORK SOLVER'}
                </h3>
                <p className="text-[9px] text-purple-400">Deconstruct handwritten JEE mechanics, NEET diagrams, or UPSC essay prompts instantly.</p>
              </div>
            </div>

            {/* Mount the actual photo homework solver inside the AI Core layout! */}
            <div className="p-3 bg-purple-950/20 border border-purple-500/10 rounded-2xl z-10 relative">
              <HomeworkSolver user={user} language={appLanguage as any} isTagMode={true} />
            </div>
          </div>

          {/* Dual Column Console */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Thread list and stream short-cuts */}
            <div className="bg-[#0b0528]/80 border border-purple-500/20 p-4 rounded-3xl md:col-span-1 space-y-3 flex flex-col justify-between">
              
              <div className="space-y-3.5">
                <span className="text-[9px] font-mono font-black uppercase text-purple-400 tracking-wider">
                  🧪 Expert Prompts Short-cuts
                </span>
                
                <div className="space-y-2">
                  {shortcuts[competitiveStream].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setChatInput(item.text);
                        playAudioChime('click');
                      }}
                      className="w-full text-left p-2.5 bg-purple-950/40 border border-purple-500/10 hover:border-pink-500/30 rounded-xl text-[9px] font-bold text-purple-300 hover:text-white transition cursor-pointer"
                    >
                      <div className="font-extrabold text-pink-400 flex items-center gap-1 mb-0.5">
                        <span>🛰️</span>
                        <span>{item.label}</span>
                      </div>
                      <p className="truncate leading-tight text-[8px] text-purple-400">{item.text}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-purple-500/10 pt-3">
                <button
                  onClick={() => {
                    if (confirm('Clear telemetry chat log history?')) {
                      const activeSess = tutorSessions.find(s => s.id === activeSessionId);
                      if (activeSess) {
                        activeSess.messages = [];
                        saveTutorSessions([...tutorSessions]);
                        setChatMessages([]);
                      }
                    }
                  }}
                  className="w-full py-1.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 border border-rose-500/20 rounded-xl text-[9px] font-black tracking-wider uppercase transition cursor-pointer"
                >
                  Clear Terminal
                </button>
              </div>
            </div>

            {/* Chat Workspace Console */}
            <div className="bg-[#0b0528]/80 border border-purple-500/20 rounded-3xl md:col-span-3 flex flex-col h-[400px] overflow-hidden">
              
              {/* Terminal header */}
              <div className="bg-purple-950/20 border-b border-purple-500/15 p-3 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-ping" />
                  <span className="font-mono text-[9px] font-black uppercase text-purple-300 tracking-widest">
                    ANDROMEDA AI CORE ACTIVE • {competitiveStream} EXPERT
                  </span>
                </div>
              </div>

              {/* Messages viewport */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-hide">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                    <span className="text-3xl animate-bounce">👽</span>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Telemetry Link Established</h4>
                    <p className="text-[10px] text-purple-400 max-w-xs">
                      Send a message to your Andromeda {competitiveStream} academic assistant or select a prompt shortcut to begin study transmission!
                    </p>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                    >
                      <div className={`max-w-[80%] rounded-2xl p-3 border text-xs leading-relaxed font-semibold ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-pink-500/15 to-purple-600/15 border-pink-500/40 text-white'
                          : 'bg-purple-950/30 border-purple-500/15 text-purple-100'
                      }`}>
                        <div className="flex items-center space-x-1.5 border-b border-purple-500/10 pb-1 mb-1 text-[8px] font-mono uppercase tracking-wider text-purple-400 font-black">
                          <span>{msg.role === 'user' ? 'COMMANDER' : 'ANDROMEDA TUTOR'}</span>
                          <span>•</span>
                          <span>{new Date().toLocaleTimeString().slice(0, 5)}</span>
                        </div>
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input console */}
              <div className="p-3 border-t border-purple-500/15 bg-purple-950/10 flex items-center space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isChatLoading && handleSendMessage()}
                  placeholder={appLanguage === 'Hindi' ? 'ट्यूटर से कुछ भी पूछें...' : 'Ask the Tutor anything competitive...'}
                  className="flex-1 p-2.5 bg-purple-950/40 border border-purple-500/25 rounded-2xl text-xs font-semibold text-white outline-none placeholder-purple-400"
                />
                <button
                  onClick={() => !isChatLoading && handleSendMessage()}
                  disabled={isChatLoading}
                  className="p-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isChatLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* 3. SYNERGY GUILDS (activeTab === 'groups') */}
      {activeTab === 'groups' && (
        <div className="space-y-4 animate-fadeIn" id="andromeda_groups">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Guilds Filter & Directory */}
            <div className="bg-[#0b0528]/80 border border-purple-500/20 p-4 rounded-3xl md:col-span-1 space-y-3.5">
              <span className="text-[9px] font-mono font-black uppercase text-purple-400 tracking-wider">
                🌌 GALACTIC SYNERGY GUILDS
              </span>
              <h3 className="text-xs font-black text-white mt-1 uppercase">
                {competitiveStream} TARGET SYLLABUS PEER CIRCLES
              </h3>

              {/* Dynamic competitive circle mock lists */}
              <div className="space-y-2 mt-2">
                {[
                  { name: `${competitiveStream} Force-Rank General`, desc: 'Active discussions, mock strategies, daily notes', active: true, count: 124 },
                  { name: `${competitiveStream} Mission Bravo (Advanced)`, desc: 'Strict question solving & competitive timing', active: false, count: 52 },
                  { name: `${competitiveStream} Daily Streak Warriors`, desc: 'Check in daily, share whiteboard diagrams', active: false, count: 18 }
                ].map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-2xl border text-xs cursor-pointer hover:border-pink-500/40 transition ${
                      item.active 
                        ? 'bg-pink-500/10 border-pink-500/30' 
                        : 'bg-purple-950/10 border-purple-500/10'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-white text-[11px]">{item.name}</span>
                      <span className="text-[8px] bg-purple-500/20 text-purple-300 px-1.5 rounded-full font-mono">{item.count} pilots</span>
                    </div>
                    <p className="text-[9px] text-purple-400 mt-1 leading-tight">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Embedded Group Whiteboard diagramming workspace */}
            <div className="bg-[#0b0528]/80 border border-purple-500/20 p-4 rounded-3xl md:col-span-2 flex flex-col space-y-3.5">
              
              <div className="flex justify-between items-center border-b border-purple-500/10 pb-2">
                <div className="flex items-center space-x-1.5">
                  <span className="text-base">🎨</span>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase font-sans tracking-wide">
                      {appLanguage === 'Hindi' ? 'सहयोगी लाइव स्केचिंग बोर्ड' : 'COOPERATIVE DIAGRAMMING STUDIO'}
                    </h3>
                    <p className="text-[9px] text-purple-400">Sketch complex formulas, geometry, UPSC map outlines in real-time with peers.</p>
                  </div>
                </div>
                <button
                  onClick={clearWhiteboard}
                  className="px-2.5 py-1 bg-rose-600/10 border border-rose-500/20 hover:bg-rose-600 hover:text-white rounded-lg text-[9px] font-black transition"
                >
                  Reset Board
                </button>
              </div>

              {/* Whiteboard sketching area */}
              <div className="relative border border-purple-500/25 rounded-2xl overflow-hidden bg-[#040114] h-[300px]">
                <canvas
                  ref={whiteboardCanvasRef}
                  width={520}
                  height={300}
                  onMouseDown={handleWhiteboardMouseDown}
                  onMouseMove={handleWhiteboardMouseMove}
                  onMouseUp={handleWhiteboardMouseUp}
                  className="absolute inset-0 w-full h-full cursor-crosshair z-10"
                />
                
                {/* Visual grid backdrop */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#160b3a_1px,transparent_1px),linear-gradient(to_bottom,#160b3a_1px,transparent_1px)] bg-[size:24px_24px] opacity-15 pointer-events-none" />
                
                {localWhiteboardLines.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-6 space-y-1 z-0">
                    <span className="text-2xl animate-pulse">🖌️</span>
                    <p className="text-xs font-extrabold text-purple-400 uppercase tracking-widest">Interactive Whiteboard Active</p>
                    <p className="text-[9px] text-purple-500 font-bold max-w-xs">Drag and sketch diagrams directly onto this grid.</p>
                  </div>
                )}
              </div>

              {/* Floating Toolbar inside Whiteboard */}
              <div className="flex items-center justify-between p-2.5 bg-purple-950/20 border border-purple-500/15 rounded-xl text-xs">
                <span className="text-[9px] font-mono text-purple-400 font-bold uppercase">Whiteboard Telemetry Channel Synced</span>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-black">
                  CONNECTED ●
                </span>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* 4. GALACTIC ARCHIVES (activeTab === 'notebook') */}
      {activeTab === 'notebook' && (
        <div className="space-y-4 animate-fadeIn" id="andromeda_notebook">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Left Pane: Notes & Syllabus planner */}
            <div className="bg-[#0b0528]/80 border border-purple-500/20 p-4 rounded-3xl md:col-span-2 space-y-4 flex flex-col justify-between">
              
              <div className="space-y-3.5">
                <span className="text-[9px] font-mono font-black uppercase text-purple-400 tracking-wider">
                  📖 Galactic Archives & Syllabus
                </span>
                
                <h3 className="text-xs font-black text-white mt-1 uppercase tracking-tight">
                  {competitiveStream} CORE STUDY MATRICES
                </h3>

                {/* Syllabus progress bar */}
                <div className="space-y-1.5 p-3.5 bg-purple-950/30 border border-purple-500/10 rounded-2xl">
                  <div className="flex justify-between items-center text-[10px] font-mono font-black text-purple-300">
                    <span>Syllabus Covered</span>
                    <span className="text-pink-400">45% Completed</span>
                  </div>
                  <div className="w-full h-2 bg-purple-950 rounded-full overflow-hidden border border-purple-500/10">
                    <div className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full" style={{ width: '45%' }} />
                  </div>
                  <p className="text-[8px] text-purple-400 italic">4 of 12 critical high-weightage core syllabus topics fully reviewed.</p>
                </div>

                {/* Simulated list of notes filtered on exam stream */}
                <div className="space-y-2 mt-2">
                  {[
                    { title: `${competitiveStream} High Yield Topic Summary`, date: 'Today', tag: 'High weightage' },
                    { title: 'Formulas and critical derivations matrix', date: 'Yesterday', tag: 'Revision note' },
                    { title: 'Mock Exam Analysis - Wrong Answer Log', date: '3 days ago', tag: 'Diagnostic logs' }
                  ].map((note, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 bg-purple-950/20 border border-purple-500/10 hover:border-pink-500/30 rounded-2xl flex items-center justify-between text-xs transition cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="text-base">📄</span>
                        <div>
                          <p className="font-extrabold text-white">{note.title}</p>
                          <p className="text-[8px] text-purple-400 font-mono font-bold mt-0.5">{note.date} • {note.tag}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-purple-400" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-purple-500/10 flex items-center justify-between">
                <span className="text-[9px] text-purple-400 font-mono">Total documents: 3 archives</span>
                <button
                  onClick={() => {
                    const title = prompt('Enter new Note title:');
                    if (title) {
                      setNotes(prev => [...prev, { id: Date.now(), title, content: '', date: new Date().toLocaleDateString(), subject: 'General' }]);
                      playAudioChime('success');
                    }
                  }}
                  className="px-3 py-1 bg-pink-500 text-white rounded-lg text-[9px] font-black shadow-md shadow-pink-500/15 cursor-pointer"
                >
                  Create Document +
                </button>
              </div>

            </div>

            {/* Right Pane: Quantum Spaced-Repetition Recall Flashcards */}
            <div className="bg-[#0b0528]/80 border border-purple-500/20 p-4 rounded-3xl md:col-span-2 space-y-4 flex flex-col justify-between">
              
              <div className="space-y-3.5">
                <span className="text-[9px] font-mono font-black uppercase text-purple-400 tracking-wider flex items-center gap-1">
                  <Atom className="w-3.5 h-3.5 text-pink-400" />
                  <span>QUANTUM SPACED REPETITION DRIVES</span>
                </span>
                
                <h3 className="text-xs font-black text-white mt-1 uppercase">
                  {competitiveStream} FAST ACTIVE RECALL CARDS
                </h3>

                {/* Simulated Spaced repetition cards dashboard list */}
                <div className="space-y-2 mt-2">
                  {[
                    { id: 1, front: `${competitiveStream} Critical Statement 1`, back: 'Detailed answer explanation and diagram recall points', due: 'DUE NOW' },
                    { id: 2, front: 'Syllabus Core Concept Formula Quiz', back: 'Derivation and transition states detailed formula', due: 'TOMORROW' }
                  ].map((card) => {
                    const isCardSelected = selectedFlashcard?.id === card.id;
                    return (
                      <div 
                        key={card.id}
                        className={`p-3 rounded-2xl border transition ${
                          isCardSelected 
                            ? 'bg-pink-500/10 border-pink-500/30' 
                            : 'bg-purple-950/20 border-purple-500/10 hover:border-purple-500/30'
                        }`}
                      >
                        <div className="flex justify-between items-center text-[9px] font-mono font-black text-pink-400">
                          <span>FLASHCARD #{card.id}</span>
                          <span className="bg-pink-500/20 text-pink-400 px-1.5 py-0.5 rounded">{card.due}</span>
                        </div>
                        <h4 className="text-[11px] font-extrabold text-white mt-1.5 leading-snug">{card.front}</h4>
                        
                        {isCardSelected ? (
                          <div className="mt-2.5 pt-2 border-t border-purple-500/15 space-y-2">
                            <p className="text-[10px] text-purple-300 font-medium italic bg-[#040114]/50 p-2.5 rounded-xl leading-relaxed">
                              {card.back}
                            </p>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedFlashcard(null);
                                  awardPoints(5);
                                  playAudioChime('success');
                                }}
                                className="flex-1 py-1 bg-emerald-600 text-white text-[9px] font-black rounded-lg transition"
                              >
                                Know it! ✓
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedFlashcard(null);
                                  playAudioChime('draw');
                                }}
                                className="flex-1 py-1 bg-rose-600 text-white text-[9px] font-black rounded-lg transition"
                              >
                                Repeat Later 🔴
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedFlashcard(card);
                              playAudioChime('click');
                            }}
                            className="w-full text-center py-1 mt-2 bg-purple-950/40 border border-purple-500/15 hover:border-pink-500/30 text-purple-300 text-[9px] font-black rounded-xl transition cursor-pointer"
                          >
                            Flip Quantum Card 🔄
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-purple-500/10 text-center">
                <span className="text-[9px] text-purple-400 italic">Spaced repetition cards sync with your mobile offline database.</span>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* 5. QUANTUM SIMULATORS (activeTab === 'quiz') */}
      {activeTab === 'quiz' && (
        <div className="bg-[#0b0528]/80 border border-purple-500/20 p-4 rounded-3xl space-y-4 animate-fadeIn" id="andromeda_quiz_simulator">
          
          <div className="flex justify-between items-center border-b border-purple-500/10 pb-2">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-5 h-5 text-pink-400" />
              <div>
                <h3 className="text-xs font-black text-white uppercase font-sans tracking-wide">
                  {appLanguage === 'Hindi' ? 'हाई-ऑक्टेन मॉक एग्जाम सिम्युलेटर' : 'HIGH-OCTANE MOCK EXAM SIMULATOR'}
                </h3>
                <p className="text-[9px] text-purple-400">Strict negative marking active: +4 XP for correct answers, -1 XP for incorrect answers!</p>
              </div>
            </div>
            
            <span className="text-[9px] font-mono font-black text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-full border border-pink-500/25">
              SCORE: {simulatorScore} XP
            </span>
          </div>

          {/* Setup view */}
          {simulatorStep === 'setup' && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 max-w-sm mx-auto">
              <span className="text-4xl animate-pulse">🧪</span>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider">{competitiveStream} Simulator ready for launch</h4>
                <p className="text-[10px] text-purple-400 mt-1 leading-relaxed">
                  You have exactly 2 minutes to complete the mock simulator. Passing scores bypass the competitive stream cut-offs.
                </p>
              </div>

              <button
                onClick={startSimulator}
                className="w-full py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-black shadow-lg shadow-pink-500/15 tracking-wider uppercase transform active:scale-95 transition cursor-pointer"
              >
                Initiate Simulation 🚀
              </button>
            </div>
          )}

          {/* Active Quiz view */}
          {simulatorStep === 'active' && (
            <div className="space-y-4">
              
              {/* Simulator info line */}
              <div className="flex justify-between items-center bg-[#040114] p-2.5 rounded-xl border border-purple-500/10">
                <span className="text-[9px] font-mono text-purple-400 font-bold uppercase">
                  Time Remaining: <span className="text-pink-400 font-black">{formatTime(simulatorTime)}</span>
                </span>
                <span className="text-[9px] font-mono text-purple-400 font-bold uppercase">
                  Question {currentQuestionIdx + 1} of {simulatorQuestions[competitiveStream].length}
                </span>
              </div>

              {/* Question card */}
              <div className="p-4 bg-[#040114]/50 border border-purple-500/15 rounded-2xl">
                <h4 className="text-xs font-black text-white leading-relaxed">
                  {simulatorQuestions[competitiveStream][currentQuestionIdx].q}
                </h4>
              </div>

              {/* Answer options */}
              <div className="grid grid-cols-1 gap-2">
                {simulatorQuestions[competitiveStream][currentQuestionIdx].options.map((option, idx) => {
                  const isSelected = userSelectedAnswer === option;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswerOptionSelect(option)}
                      className={`text-left p-3 rounded-xl border text-xs font-bold transition ${
                        isSelected 
                          ? 'bg-pink-500/15 border-pink-400 text-white font-black' 
                          : 'bg-[#040114]/30 border-purple-500/10 hover:border-purple-500/30 text-purple-300'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {/* Action row */}
              <div className="flex items-center justify-end pt-2">
                <button
                  onClick={submitSimulatorAnswer}
                  disabled={!userSelectedAnswer}
                  className="px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                >
                  Submit Answer 📡
                </button>
              </div>

            </div>
          )}

          {/* Results view */}
          {simulatorStep === 'results' && (
            <div className="py-6 space-y-4 max-w-sm mx-auto text-center">
              <span className="text-4xl">🏆</span>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider">Simulation Completed</h4>
                <p className="text-[10px] text-purple-400 mt-1">Your total simulator score card with strict negative marking rules:</p>
              </div>

              <div className="p-4 bg-[#040114] border border-purple-500/25 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-purple-400 font-bold">Simulator Score:</span>
                  <span className="text-white font-black">{simulatorScore} points</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-purple-400 font-bold">XP Awarded:</span>
                  <span className={`font-black ${simulatorXPChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {simulatorXPChange >= 0 ? `+${simulatorXPChange}` : `${simulatorXPChange}`} XP
                  </span>
                </div>
                <div className="border-t border-purple-500/10 pt-2 flex justify-between items-center text-xs">
                  <span className="text-purple-400 font-bold">Cut-off Status:</span>
                  <span className="text-emerald-400 font-mono font-black uppercase">
                    {simulatorScore >= 3 ? 'CUT-OFF CLEARED! 🌟' : 'BELOW THRESHOLD ⚠️'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSimulatorStep('setup')}
                className="w-full py-2.5 bg-purple-500/25 border border-purple-500/30 hover:bg-purple-500 text-white rounded-xl text-[10px] font-black uppercase transition cursor-pointer"
              >
                Re-initialize Simulator
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
});

export default AndromedaCosmic;
