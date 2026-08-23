import { useState, useRef, useEffect, memo } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Send, 
  Trash2, 
  Volume2, 
  Copy, 
  Check, 
  BrainCircuit, 
  Loader2, 
  Mic, 
  BookOpen, 
  Bot, 
  User as UserIcon,
  Calculator,
  Compass,
  FileCode2,
  X,
  Variable,
  Bookmark,
  Plus,
  Camera,
  Upload,
  RefreshCw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { getStudyAnswer } from '../services/geminiService';
import type { Subject } from '../types';

interface AiTutorAppProps {
  user: {
    uid: string;
    name: string;
    xp: number;
    level: number;
    schoolName?: string;
    className?: string;
    targetGoal?: string;
  };
  onBack: () => void;
  onAddNote?: (note: { title: string; content: string; subject: string }) => Promise<void>;
  onAddXp?: (amount: number) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  subject?: string;
  mode?: string;
  image?: string;
}

const SUBJECT_LIST: Subject[] = ['Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology', 'English'];

const QUICK_PROMPTS = [
  { icon: Calculator, label: "Solve Equation", prompt: "Solve step-by-step: 2x² + 5x - 3 = 0" },
  { icon: Compass, label: "Explain Concept", prompt: "Explain Newton's Laws of Motion with real-world everyday analogies." },
  { icon: BrainCircuit, label: "Photosynthesis", prompt: "Explain the Light and Dark reactions in Photosynthesis in simple bullet points." },
  { icon: FileCode2, label: "English Essay", prompt: "Help me write an outline for an argumentative essay on AI in Education." }
];

/**
 * Normalizes LaTeX delimiter syntax commonly output by AI models
 * e.g., converts \(...\) to $...$ and \[...\] to $$...$$
 */
function preprocessLaTeX(content: string): string {
  if (!content) return '';
  return content
    .replace(/\\\[([\s\S]*?)\\\]/g, (_match, math) => `\n$$\n${math.trim()}\n$$\n`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_match, math) => `$${math.trim()}$`);
}

/**
 * TypewriterMarkdown renders AI Markdown response progressively with smooth typing animation
 */
const TypewriterMarkdown = memo(function TypewriterMarkdown({
  text,
  isLatest,
}: {
  text: string;
  isLatest?: boolean;
}) {
  const [displayedText, setDisplayedText] = useState(() => (isLatest ? '' : text));
  const [isDone, setIsDone] = useState(() => !isLatest);

  useEffect(() => {
    if (!isLatest) {
      setDisplayedText(text);
      setIsDone(true);
      return;
    }

    let currentIndex = 0;
    setDisplayedText('');
    setIsDone(false);

    // Dynamic chunk size based on text length for smooth & natural cadence
    const step = Math.max(3, Math.ceil(text.length / 120));
    const timer = setInterval(() => {
      currentIndex += step;
      if (currentIndex >= text.length) {
        setDisplayedText(text);
        setIsDone(true);
        clearInterval(timer);
      } else {
        setDisplayedText(text.slice(0, currentIndex));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [text, isLatest]);

  return (
    <div
      className="markdown-body text-xs text-slate-200 leading-relaxed space-y-2 overflow-x-auto relative group cursor-pointer"
      onClick={() => {
        if (!isDone) {
          setDisplayedText(text);
          setIsDone(true);
        }
      }}
      title={!isDone ? "Click to reveal answer immediately" : undefined}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ node, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            const isMultiLine = String(children).includes('\n') || !!match;

            if (isMultiLine) {
              const lang = match ? match[1] : 'code';
              return (
                <div className="relative my-2.5 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 text-left">
                  <div className="bg-slate-900/90 px-3 py-1.5 flex items-center justify-between text-[10px] text-slate-400 font-mono border-b border-slate-800">
                    <span className="uppercase font-bold text-indigo-400">{lang}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(codeString);
                      }}
                      className="hover:text-slate-100 transition font-sans text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded-md text-slate-300"
                    >
                      Copy Code
                    </button>
                  </div>
                  <SyntaxHighlighter
                    style={oneDark}
                    language={lang === 'code' ? 'text' : lang}
                    PreTag="div"
                    customStyle={{ margin: 0, padding: '0.75rem', fontSize: '0.75rem', background: '#090d16' }}
                    {...props}
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              );
            }

            return (
              <code className="bg-slate-800/90 text-indigo-300 px-1.5 py-0.5 rounded text-[11px] font-mono border border-slate-700/50" {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {preprocessLaTeX(displayedText)}
      </ReactMarkdown>
      {!isDone && (
        <span className="inline-block w-1.5 h-3.5 bg-indigo-400 animate-pulse ml-1 align-middle rounded-xs" />
      )}
    </div>
  );
});

interface SavedFormula {
  id: string;
  name: string;
  latex: string;
}

const DEFAULT_SAVED_FORMULAS: SavedFormula[] = [
  { id: 'f1', name: 'Quadratic Formula', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
  { id: 'f2', name: 'Pythagorean Theorem', latex: 'a^2 + b^2 = c^2' },
  { id: 'f3', name: 'Mass-Energy Equivalence', latex: 'E = mc^2' },
  { id: 'f4', name: 'Euler\'s Identity', latex: 'e^{i\\pi} + 1 = 0' },
  { id: 'f5', name: 'Area of Circle', latex: 'A = \\pi r^2' },
  { id: 'f6', name: 'Kinetic Energy', latex: 'K = \\frac{1}{2}mv^2' },
];

export const AiTutorApp = memo(function AiTutorApp({
  user,
  onBack,
  onAddNote,
  onAddXp
}: AiTutorAppProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(`ai_tutor_chat_${user.uid}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Error parsing saved tutor chat", e);
      }
    }
    const studentName = user.name || 'Student';
    const studentClass = user.className || 'Class';
    const studentSchool = user.schoolName ? ` from ${user.schoolName}` : '';
    const studentGoal = user.targetGoal ? ` (Target: ${user.targetGoal})` : '';

    return [
      {
        id: 'welcome_' + Date.now(),
        sender: 'ai',
        text: `Hello **${studentName}**! 👋 I am your personal AI Study Tutor for **${studentClass}**${studentSchool}${studentGoal}.\n\nHow can I help you today? Ask me any homework question, concept explanation, or step-by-step equation solver!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [inputQuery, setInputQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject>('Science');
  const [tutorMode, setTutorMode] = useState<'homework' | 'explain' | 'step' | 'quiz'>('homework');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [showMathPalette, setShowMathPalette] = useState(false);
  const [activeMathCategory, setActiveMathCategory] = useState<'All' | 'Greek' | 'Algebra' | 'Operators' | 'Calculus'>('All');

  // Saved Formulas State
  const [savedFormulas, setSavedFormulas] = useState<SavedFormula[]>(() => {
    const saved = localStorage.getItem(`saved_formulas_${user.uid}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved formulas", e);
      }
    }
    return DEFAULT_SAVED_FORMULAS;
  });
  const [showSavedFormulasPanel, setShowSavedFormulasPanel] = useState(false);
  const [newFormulaName, setNewFormulaName] = useState('');
  const [newFormulaLatex, setNewFormulaLatex] = useState('');
  const [showAddFormulaForm, setShowAddFormulaForm] = useState(false);
  const [copiedFormulaId, setCopiedFormulaId] = useState<string | null>(null);

  // Camera & Image Attachment State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    setCameraError(null);
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError("Could not access camera. Please check camera permissions or select a photo from your device.");
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (showCameraModal) {
      startCamera(cameraFacing);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [showCameraModal, cameraFacing]);

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      setSelectedImage(dataUrl);
      setShowCameraModal(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSelectedImage(event.target.result as string);
        setShowCameraModal(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const MATH_SYMBOLS = [
    { label: 'α', value: '\\alpha ', category: 'Greek' },
    { label: 'β', value: '\\beta ', category: 'Greek' },
    { label: 'θ', value: '\\theta ', category: 'Greek' },
    { label: 'π', value: '\\pi ', category: 'Greek' },
    { label: 'λ', value: '\\lambda ', category: 'Greek' },
    { label: 'Δ', value: '\\Delta ', category: 'Greek' },
    { label: 'ω', value: '\\omega ', category: 'Greek' },
    { label: 'σ', value: '\\sigma ', category: 'Greek' },
    { label: 'μ', value: '\\mu ', category: 'Greek' },
    { label: 'Ω', value: '\\Omega ', category: 'Greek' },
    { label: '√x', value: '\\sqrt{x}', category: 'Algebra' },
    { label: 'x²', value: 'x^2', category: 'Algebra' },
    { label: 'xⁿ', value: 'x^n', category: 'Algebra' },
    { label: 'xₙ', value: 'x_n', category: 'Algebra' },
    { label: 'a/b', value: '\\frac{a}{b}', category: 'Algebra' },
    { label: '±', value: '\\pm ', category: 'Operators' },
    { label: '×', value: '\\times ', category: 'Operators' },
    { label: '÷', value: '\\div ', category: 'Operators' },
    { label: '≤', value: '\\le ', category: 'Operators' },
    { label: '≥', value: '\\ge ', category: 'Operators' },
    { label: '≠', value: '\\neq ', category: 'Operators' },
    { label: '≈', value: '\\approx ', category: 'Operators' },
    { label: '∞', value: '\\infty ', category: 'Operators' },
    { label: '∫', value: '\\int ', category: 'Calculus' },
    { label: '∑', value: '\\sum ', category: 'Calculus' },
    { label: 'lim', value: '\\lim_{x \\to 0}', category: 'Calculus' },
    { label: '→', value: '\\rightarrow ', category: 'Operators' },
    { label: '∈', value: '\\in ', category: 'Operators' },
    { label: '°', value: '^{\\circ}', category: 'Algebra' },
  ];

  const insertSymbol = (symbolValue: string) => {
    if (!textareaRef.current) {
      setInputQuery((prev) => prev + symbolValue);
      return;
    }
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const val = el.value;
    const nextVal = val.substring(0, start) + symbolValue + val.substring(end);
    setInputQuery(nextVal);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + symbolValue.length, start + symbolValue.length);
    }, 0);
  };

  // Safe JSON stringify helper to avoid circular structures
  const safeJsonStringify = (obj: any): string => {
    try {
      const cache = new Set();
      return JSON.stringify(obj, (_key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (cache.has(value)) return '[Circular]';
          cache.add(value);
        }
        return value;
      });
    } catch (e) {
      return '[]';
    }
  };

  // Save chat to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`ai_tutor_chat_${user.uid}`, safeJsonStringify(messages));
    } catch (e) {
      console.error("Error writing chat history to storage", e);
    }
  }, [messages, user.uid]);

  // Save formulas to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`saved_formulas_${user.uid}`, JSON.stringify(savedFormulas));
    } catch (e) {
      console.error("Error writing saved formulas to storage", e);
    }
  }, [savedFormulas, user.uid]);

  const handleAddFormula = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormulaLatex.trim()) return;
    const newEntry: SavedFormula = {
      id: 'f_' + Date.now(),
      name: newFormulaName.trim() || 'Custom Formula',
      latex: newFormulaLatex.trim()
    };
    setSavedFormulas((prev) => [newEntry, ...prev]);
    setNewFormulaName('');
    setNewFormulaLatex('');
    setShowAddFormulaForm(false);
  };

  const handleDeleteFormula = (id: string) => {
    setSavedFormulas((prev) => prev.filter((f) => f.id !== id));
  };

  const handleCopyFormula = (id: string, latex: string) => {
    navigator.clipboard.writeText(latex);
    setCopiedFormulaId(id);
    setTimeout(() => setCopiedFormulaId(null), 2000);
  };

  const handleInsertFormula = (latex: string) => {
    const formatted = latex.includes('$') ? latex : ` $${latex}$ `;
    insertSymbol(formatted);
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (customText?: string | unknown) => {
    const imageToSend = selectedImage;
    const queryText = typeof customText === 'string' ? customText : inputQuery;
    const cleanQuery = typeof queryText === 'string' ? queryText.trim() : '';
    const effectiveQuery = cleanQuery || (imageToSend ? "Please solve and explain the math problem shown in this handwritten image step-by-step with full LaTeX formatting and intermediate calculations." : "");

    if (!effectiveQuery || isLoading) return;

    const userMsgId = 'msg_' + Date.now();
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: effectiveQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subject: selectedSubject,
      mode: tutorMode,
      image: imageToSend || undefined
    };

    setMessages((prev) => [...prev, userMsg]);
    if (typeof customText !== 'string') setInputQuery('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      // Formulate prompt context based on student details, subject and mode
      const studentInfo = `[Student: ${user.name || 'Student'} | School: ${user.schoolName || 'School'} | Class: ${user.className || 'Class'} | Goal: ${user.targetGoal || 'General'}]`;
      let promptContext = `${studentInfo} [Subject: ${selectedSubject} | Mode: ${tutorMode}] ${effectiveQuery}`;
      if (tutorMode === 'step') {
        promptContext = `${studentInfo} Provide a strict step-by-step solution for ${user.className || 'student level'}: ${effectiveQuery}`;
      } else if (tutorMode === 'explain') {
        promptContext = `${studentInfo} Explain clearly with analogies suitable for ${user.className || 'student level'}: ${effectiveQuery}`;
      } else if (tutorMode === 'quiz') {
        promptContext = `${studentInfo} Generate a 3-question practice quiz suitable for ${user.className || 'student level'}: ${effectiveQuery}`;
      }

      const answer = await getStudyAnswer(promptContext, imageToSend || undefined);

      const aiMsg: ChatMessage = {
        id: 'msg_ai_' + Date.now(),
        sender: 'ai',
        text: answer || 'I could not generate an answer right now. Please try asking again!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        subject: selectedSubject,
        mode: tutorMode
      };

      setMessages((prev) => [...prev, aiMsg]);
      if (onAddXp) onAddXp(15);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: 'msg_err_' + Date.now(),
        sender: 'ai',
        text: '⚠️ An error occurred while communicating with the AI Tutor. Please check your connection and try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Clear all AI Tutor conversation history?")) {
      setMessages([]);
      localStorage.removeItem(`ai_tutor_chat_${user.uid}`);
    }
  };

  const handleCopyText = (id: string, text: string | unknown) => {
    const cleanStr = typeof text === 'string' ? text : String(text || '');
    navigator.clipboard.writeText(cleanStr);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeakText = (text: string | unknown) => {
    const cleanStr = typeof text === 'string' ? text : String(text || '');
    if (!cleanStr) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanStr.replace(/[*#_`]/g, ''));
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech is not supported in this browser.');
    }
  };

  const handleSaveToNotebook = async (msg: ChatMessage) => {
    if (onAddNote) {
      await onAddNote({
        title: `AI Tutor Note - ${msg.subject || selectedSubject}`,
        content: msg.text,
        subject: msg.subject || selectedSubject
      });
      setSavedNoteId(msg.id);
      if (onAddXp) onAddXp(10);
      setTimeout(() => setSavedNoteId(null), 2500);
    }
  };

  const handleVoiceInputToggle = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Try Chrome or Edge!");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputQuery((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* APP TOP HEADER */}
      <header className="bg-slate-900/90 backdrop-blur-lg border-b border-slate-800 px-4 py-3 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center space-x-1.5 border border-slate-700/60 group"
            title="Back to Ascend Study"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-xs font-bold hidden sm:inline">Back</span>
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 p-0.5 shadow-md flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-black tracking-tight text-white flex items-center space-x-1">
                  <span>ASCEND AI TUTOR</span>
                  <span className="text-[9px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-1.5 py-0.2 rounded-md">v2.5</span>
                </h1>
              </div>
              <p className="text-[10px] text-emerald-400 font-medium flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Online • Powered by Gemini AI</span>
              </p>
            </div>
          </div>
        </div>

        {/* HEADER CONTROLS */}
        <div className="flex items-center space-x-2">
          {/* SUBJECT SELECTOR */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value as Subject)}
            className="bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            {SUBJECT_LIST.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>

          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition"
              title="Clear Conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* STUDENT PROFILE CONTEXT BANNER */}
      <div className="bg-slate-900/90 border-b border-indigo-900/40 px-4 py-1.5 flex items-center justify-between text-[11px] text-indigo-200 shrink-0">
        <div className="flex items-center space-x-2 truncate">
          <span className="font-bold text-white flex items-center space-x-1">
            <span>👤</span>
            <span>{user.name || 'Student'}</span>
          </span>
          <span className="text-slate-600">•</span>
          {user.className && (
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono text-[10px]">
              📚 {user.className}
            </span>
          )}
          {user.schoolName && (
            <span className="hidden sm:inline bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full text-[10px] truncate max-w-[160px]">
              🏫 {user.schoolName}
            </span>
          )}
        </div>
        {user.targetGoal && (
          <span className="text-[10px] text-amber-300 font-bold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full shrink-0">
            🎯 {user.targetGoal}
          </span>
        )}
      </div>

      {/* MODE TABS BAR */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-2 flex items-center space-x-2 overflow-x-auto no-scrollbar shrink-0">
        {[
          { id: 'homework', label: '⚡ Homework Solver' },
          { id: 'step', label: '📐 Step-by-Step Math' },
          { id: 'explain', label: '💡 Concept Explainer' },
          { id: 'quiz', label: '📝 Practice Quiz' }
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => setTutorMode(mode.id as any)}
            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
              tutorMode === mode.id
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* CHAT MESSAGES BODY */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-3xl mx-auto w-full">
        {messages.length === 0 ? (
          /* EMPTY STATE HERO */
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-8 px-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 to-indigo-800 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                <BrainCircuit className="w-10 h-10 animate-pulse" />
              </div>
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-emerald-500 text-[10px] font-black text-slate-950 uppercase tracking-wider">
                READY
              </span>
            </div>

            <div className="space-y-2 max-w-md">
              <h2 className="text-xl font-black text-white tracking-tight">
                Welcome to your AI Tutor, {user.name}! 🚀
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                I can solve step-by-step math problems, explain complex scientific concepts, check grammar, or generate custom quizzes.
              </p>
            </div>

            {/* QUICK STARTER PROMPTS */}
            <div className="w-full max-w-lg space-y-2 text-left pt-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block text-center">
                TRY ASKING ONE OF THESE:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {QUICK_PROMPTS.map((qp, idx) => {
                  const Icon = qp.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(qp.prompt)}
                      className="p-3 bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl transition text-left group flex items-start space-x-2.5 shadow-xs"
                    >
                      <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-200 group-hover:text-indigo-300 block">
                          {qp.label}
                        </span>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {qp.prompt}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* MESSAGES LIST */
          messages.map((msg, idx) => {
            const isLatest = idx === messages.length - 1;
            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-md">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 shadow-sm border ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none'
                      : 'bg-slate-900 border-slate-800 text-slate-200 rounded-tl-none space-y-2'
                  }`}
                >
                  {/* MESSAGE METADATA HEADER */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 border-b border-slate-800/60 mb-2">
                    <span className="font-bold text-indigo-400 uppercase tracking-wider">
                      {msg.sender === 'user' ? 'YOU' : 'AI TUTOR'}
                    </span>
                    <div className="flex items-center space-x-2">
                      {msg.subject && (
                        <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[9px] text-slate-300">
                          {msg.subject}
                        </span>
                      )}
                      <span>{msg.timestamp}</span>
                    </div>
                  </div>

                  {/* CONTENT */}
                  {msg.sender === 'user' ? (
                    <div className="space-y-2">
                      {msg.image && (
                        <div className="relative group max-w-xs overflow-hidden rounded-xl border border-white/20 shadow-md bg-slate-950/40">
                          <img
                            src={msg.image}
                            alt="Handwritten math problem"
                            className="w-full max-h-56 object-contain rounded-xl"
                          />
                        </div>
                      )}
                      <p className="text-xs text-white whitespace-pre-wrap leading-relaxed font-medium">
                        {msg.text}
                      </p>
                    </div>
                  ) : (
                    <TypewriterMarkdown text={msg.text} isLatest={isLatest} />
                  )}

                {/* AI ACTION TOOLBAR */}
                {msg.sender === 'ai' && (
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleCopyText(msg.id, msg.text)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition flex items-center space-x-1"
                        >
                          {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span className="text-[10px] font-bold">{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>

                        <button
                          onClick={() => handleSpeakText(msg.text)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition flex items-center space-x-1"
                          title="Read Aloud"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span className="text-[10px] font-bold">Listen</span>
                        </button>

                        {onAddNote && (
                          <button
                            onClick={() => handleSaveToNotebook(msg)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg transition flex items-center space-x-1"
                          >
                            <BookOpen className="w-3 h-3" />
                            <span className="text-[10px] font-bold">
                              {savedNoteId === msg.id ? 'Saved! ✓' : 'Save Note'}
                            </span>
                          </button>
                        )}
                      </div>

                      <span className="text-[9px] text-slate-500 font-semibold">Ascend AI Tutor v2.5</span>
                    </div>

                    {/* QUICK FOLLOW-UP ACTION CHIPS */}
                    <motion.div 
                      className="flex flex-wrap gap-1.5 pt-1"
                      initial="hidden"
                      animate="visible"
                      variants={{
                        visible: { transition: { staggerChildren: 0.05 } }
                      }}
                    >
                      <motion.button
                        variants={{
                          hidden: { opacity: 0, scale: 0.8 },
                          visible: { opacity: 1, scale: 1 }
                        }}
                        onClick={() => handleSendMessage("Can you explain this concept in even simpler terms with a super easy real-world analogy?")}
                        className="px-2 py-0.5 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/50 rounded-lg text-[10px] font-semibold transition flex items-center space-x-1"
                      >
                        <span>💡 Explain Simpler</span>
                      </motion.button>
                      <motion.button
                        variants={{
                          hidden: { opacity: 0, scale: 0.8 },
                          visible: { opacity: 1, scale: 1 }
                        }}
                        onClick={() => handleSendMessage("Give me 1 practice question based on this topic so I can test my understanding.")}
                        className="px-2 py-0.5 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/50 rounded-lg text-[10px] font-semibold transition flex items-center space-x-1"
                      >
                        <span>📝 Practice Question</span>
                      </motion.button>
                      <motion.button
                        variants={{
                          hidden: { opacity: 0, scale: 0.8 },
                          visible: { opacity: 1, scale: 1 }
                        }}
                        onClick={() => handleSendMessage("Explain this exact concept in simple, friendly Hinglish (Hindi + English mix).")}
                        className="px-2 py-0.5 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/50 rounded-lg text-[10px] font-semibold transition flex items-center space-x-1"
                      >
                        <span>🌐 Explain in Hinglish</span>
                      </motion.button>
                      <motion.button
                        variants={{
                          hidden: { opacity: 0, scale: 0.8 },
                          visible: { opacity: 1, scale: 1 }
                        }}
                        onClick={() => handleSendMessage("Summarize the key formulas and core takeaways from this in a clean table.")}
                        className="px-2 py-0.5 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/50 rounded-lg text-[10px] font-semibold transition flex items-center space-x-1"
                      >
                        <span>📌 Summary Table</span>
                      </motion.button>
                    </motion.div>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-1 shadow-xs">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })
      )}

        {/* LOADING INDICATOR */}
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-md">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 shadow-sm space-y-2 max-w-xs">
              <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                <span>AI Tutor is thinking...</span>
              </div>
              <div className="space-y-1.5">
                <div className="h-2 bg-slate-800 rounded-full w-3/4 animate-pulse" />
                <div className="h-2 bg-slate-800 rounded-full w-1/2 animate-pulse" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* BOTTOM INPUT DOCK */}
      <footer className="bg-slate-900 border-t border-slate-800 p-3 sm:p-4 shrink-0 relative">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* SAVED FORMULAS SLIDE-UP PANEL */}
          {showSavedFormulasPanel && (
            <div className="absolute bottom-full mb-2 left-3 right-3 sm:left-auto sm:right-4 sm:w-96 bg-slate-900/95 backdrop-blur-xl border border-amber-500/40 rounded-2xl p-3 shadow-2xl z-30 space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center space-x-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-bold text-slate-100">Saved Formulas</span>
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-amber-500/30">
                    {savedFormulas.length}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setShowAddFormulaForm(!showAddFormulaForm)}
                    className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-semibold transition flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Custom</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSavedFormulasPanel(false)}
                    className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* ADD FORMULA FORM */}
              {showAddFormulaForm && (
                <form onSubmit={handleAddFormula} className="bg-slate-950/80 border border-amber-500/30 p-2.5 rounded-xl space-y-2 animate-in fade-in duration-100">
                  <input
                    type="text"
                    placeholder="Formula Name (e.g. Newton's 2nd Law)"
                    value={newFormulaName}
                    onChange={(e) => setNewFormulaName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    placeholder="LaTeX Code (e.g. F = ma or \int x^2 dx)"
                    value={newFormulaLatex}
                    onChange={(e) => setNewFormulaLatex(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-mono placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />

                  {/* PREVIEW */}
                  {newFormulaLatex.trim() && (
                    <div className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-center overflow-x-auto text-xs text-slate-200">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {`$${newFormulaLatex.trim()}$`}
                      </ReactMarkdown>
                    </div>
                  )}

                  <div className="flex items-center justify-end space-x-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddFormulaForm(false)}
                      className="px-2 py-1 text-[10px] text-slate-400 hover:text-slate-200 rounded-md font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newFormulaLatex.trim()}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-[10px] rounded-lg transition"
                    >
                      Save Formula
                    </button>
                  </div>
                </form>
              )}

              {/* FORMULAS LIST */}
              <div className="space-y-1.5 max-h-52 overflow-y-auto no-scrollbar pr-0.5">
                {savedFormulas.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs font-medium">
                    No saved formulas yet. Click "+ Add Custom" or save math snippets!
                  </div>
                ) : (
                  savedFormulas.map((f) => (
                    <div
                      key={f.id}
                      className="group bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/40 p-2 rounded-xl transition flex items-center justify-between space-x-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-slate-400 truncate">{f.name}</div>
                        <div className="text-xs text-slate-100 overflow-x-auto py-0.5 no-scrollbar font-mono">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {`$${f.latex}$`}
                          </ReactMarkdown>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleInsertFormula(f.latex)}
                          className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 rounded-lg text-[10px] font-bold transition"
                          title="Insert into chat input"
                        >
                          Insert
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyFormula(f.id, f.latex)}
                          className="p-1 bg-slate-900/80 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                          title="Copy LaTeX"
                        >
                          {copiedFormulaId === f.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteFormula(f.id)}
                          className="p-1 bg-slate-900/80 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* MATH & LATEX SYMBOLS POPUP PALETTE */}
          {showMathPalette && (
            <div className="absolute bottom-full mb-2 left-3 right-3 sm:left-auto sm:right-4 sm:w-96 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-3 shadow-2xl z-30 space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                  <Variable className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Math & LaTeX Symbols</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowMathPalette(false)}
                  className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* CATEGORY TABS */}
              <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar text-[10px]">
                {(['All', 'Greek', 'Algebra', 'Operators', 'Calculus'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveMathCategory(cat)}
                    className={`px-2 py-0.5 rounded-md font-semibold transition ${
                      activeMathCategory === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* SYMBOLS GRID */}
              <div className="grid grid-cols-6 gap-1.5 max-h-40 overflow-y-auto no-scrollbar p-0.5">
                {MATH_SYMBOLS.filter(
                  (s) => activeMathCategory === 'All' || s.category === activeMathCategory
                ).map((sym, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => insertSymbol(sym.value)}
                    className="p-2 bg-slate-800/80 hover:bg-indigo-600 hover:text-white text-slate-200 border border-slate-700/60 rounded-xl text-xs font-semibold transition flex items-center justify-center shadow-xs active:scale-95"
                    title={sym.value}
                  >
                    {sym.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ATTACHED IMAGE PREVIEW BADGE */}
          {selectedImage && (
            <div className="flex items-center space-x-2 bg-indigo-950/90 border border-indigo-500/60 p-2 px-3 rounded-2xl text-xs text-indigo-200 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150">
              <img
                src={selectedImage}
                alt="Captured handwritten math problem"
                className="w-10 h-10 rounded-xl object-cover border border-indigo-400/50 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="font-bold text-white text-[11px] flex items-center space-x-1 truncate">
                  <Camera className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Handwritten Math Photo Attached</span>
                </span>
                <span className="text-[10px] text-indigo-300 block truncate">
                  AI Tutor will recognize equations & provide step-by-step solutions
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-indigo-900/80 transition"
                title="Remove attached image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* QUICK SUGGESTION CHIPS ABOVE INPUT */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px]">
            {['Step-by-step', 'Give example', 'Summarize', 'Practice questions'].map((chip) => (
              <button
                key={chip}
                onClick={() => setInputQuery((prev) => prev ? `${prev} (${chip})` : `Please ${chip.toLowerCase()}: `)}
                className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 rounded-full font-medium whitespace-nowrap transition"
              >
                + {chip}
              </button>
            ))}
          </div>

          <div className="relative flex items-center bg-slate-950 border border-slate-800 focus-within:border-indigo-500 rounded-2xl p-1.5 transition shadow-inner">
            <button
              type="button"
              onClick={handleVoiceInputToggle}
              className={`p-2.5 rounded-xl transition ${
                isListening 
                  ? 'bg-rose-600 text-white animate-bounce' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title={isListening ? "Listening... Click to stop" : "Voice Input"}
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* CAMERA INTEGRATION BUTTON */}
            <button
              type="button"
              onClick={() => setShowCameraModal(true)}
              className={`p-2.5 rounded-xl transition flex items-center justify-center shrink-0 ${
                selectedImage 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/50' 
                  : 'text-indigo-400 hover:bg-slate-800 hover:text-indigo-300'
              }`}
              title="Snap or Upload Handwritten Math Problem"
            >
              <Camera className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setShowMathPalette(!showMathPalette);
                if (showSavedFormulasPanel) setShowSavedFormulasPanel(false);
              }}
              className={`p-2 rounded-xl transition font-mono text-[11px] font-black flex items-center justify-center shrink-0 ${
                showMathPalette 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-indigo-400 hover:bg-slate-800 hover:text-indigo-300'
              }`}
              title="Insert Math Symbols & LaTeX"
            >
              <span>f(x)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowSavedFormulasPanel(!showSavedFormulasPanel);
                if (showMathPalette) setShowMathPalette(false);
              }}
              className={`p-2 rounded-xl transition text-[11px] font-bold flex items-center space-x-1 shrink-0 ${
                showSavedFormulasPanel 
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md' 
                  : 'text-amber-400 hover:bg-slate-800 hover:text-amber-300'
              }`}
              title="Saved Formulas & Equations"
            >
              <Bookmark className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline text-[10px]">Formulas</span>
            </button>

            <textarea
              ref={textareaRef}
              rows={1}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                isListening 
                  ? "Listening to your voice..." 
                  : selectedImage 
                  ? "Photo attached! Type additional instructions or press Send to solve..." 
                  : `Ask AI Tutor about ${selectedSubject}... (Press Enter)`
              }
              className="flex-1 bg-transparent border-0 px-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none max-h-24 py-2"
            />

            {inputQuery.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setInputQuery('');
                  textareaRef.current?.focus();
                }}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-xl transition flex items-center justify-center shrink-0 border border-slate-700/60"
                title="Clear Input"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={(!inputQuery.trim() && !selectedImage) || isLoading}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center shrink-0"
              title="Send Message"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
            <span>Subject: <strong className="text-slate-300">{selectedSubject}</strong></span>
            <span>Shift + Enter for new line</span>
          </div>
        </div>

      {/* HIDDEN FILE INPUT FOR CAMERA/IMAGE FALLBACK */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* CAMERA CAPTURE MODAL OVERLAY */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col space-y-3 p-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white tracking-wide uppercase">Snap Math Problem</h3>
                  <p className="text-[10px] text-slate-400">Position handwritten equation or note in the viewport frame</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCameraModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* LIVE CAMERA VIEWPORT */}
            <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-4/3 flex items-center justify-center border border-slate-800 shadow-inner">
              {cameraError ? (
                <div className="text-center p-6 space-y-3">
                  <div className="p-3 bg-rose-500/10 text-rose-400 rounded-full w-fit mx-auto border border-rose-500/20">
                    <Camera className="w-8 h-8" />
                  </div>
                  <p className="text-xs text-rose-300 font-medium max-w-xs mx-auto">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 mx-auto shadow-md"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Choose Image File from Device</span>
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* VIEWPORT SCANNING GUIDELINE */}
                  <div className="absolute inset-8 border-2 border-dashed border-indigo-400/60 rounded-2xl pointer-events-none flex items-center justify-center">
                    <span className="bg-slate-950/80 text-indigo-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-indigo-500/30 backdrop-blur-xs">
                      Center handwritten equation here
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* CAMERA ACTION CONTROLS */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 border border-slate-700/60"
              >
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Upload File</span>
              </button>

              {!cameraError && (
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setCameraFacing(prev => prev === 'environment' ? 'user' : 'environment')}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700/60"
                    title="Flip Camera"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleCapturePhoto}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition flex items-center space-x-2 shadow-lg shadow-indigo-600/30 active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture Photo</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </footer>
  </div>
);
});

export default AiTutorApp;
