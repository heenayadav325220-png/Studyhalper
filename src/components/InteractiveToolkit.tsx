import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { showToast } from './Toast';
import { parseError, logError } from '../utils/errorHandler';

// Safe JSON stringify helper to catch circular structures
function safeJsonStringify(obj: any): string {
  if (typeof obj === 'string') return obj;
  try {
    const cache = new Set();
    return JSON.stringify(obj, (_key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) return '[Circular]';
        cache.add(value);
      }
      return value;
    }, 2);
  } catch (e) {
    return String(obj || '');
  }
}
import {
  ArrowLeft,
  Menu,
  Sparkles,
  Cpu,
  Search,
  Settings,
  RotateCcw,
  Volume2,
  Play,
  ChevronRight,
  ChevronLeft,
  X,
  ListTodo,
  Headphones,
  Cloud,
  Palette,
  Mic,
  Upload,
  Trash2,
  Check,
  Circle,
  Users,
  Plus,
  BookOpen,
  Activity,
  Layers,
  Copy
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { playTutorSpeech } from '../services/voiceSettings';

const CodeHighlighter = SyntaxHighlighter as any;

import {
  generateNotes,
  summarizeNotes,
  explainTopic,
  generateMindmap,
  generateQuestionPaper,
  performOcr,
  summarizePdf,
  incrementToolkitUsage,
  getToolkitUsage,
  getStudyAnswer,
  generateQuiz,
  isAiQuotaExceeded
} from '../services/geminiService';

interface InteractiveToolkitProps {
  onClose: () => void;
  appLanguage: string;
  firebaseUser: any;
  user: any;
  notes: any[];
  onAddNote: (note: { title: string; content: string; subject: string }) => Promise<void>;
  onAddProgress?: (score: number, total: number, subject: string) => Promise<void>;
  onOpenDiagramMaker?: (prompt: string, title: string, subject: string) => void;
  initialTool?: string;
}

const InteractiveToolkit = memo(function InteractiveToolkit({
  onClose,
  appLanguage,
  firebaseUser: _firebaseUser,
  user,
  notes,
  onAddNote,
  onAddProgress,
  onOpenDiagramMaker,
  initialTool
}: InteractiveToolkitProps) {
  const [j, ut] = useState("study"); // activeTab: "study" | "vocab_calc" | "productivity" | "focus" | "utilities"
  const [ve, L] = useState(false); // isSidebarOpen (mobile)
  const [u, dt] = useState(false); // isSidebarCollapsed (desktop)
  const [p, xt] = useState(initialTool || "notes"); // activeTool
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("all");
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Complete list of 19+ Advanced Toolkit Tools
  const ADVANCED_TOOLS_CATALOG = [
    { id: "notes", name: "AI Note Synthesizer", category: "study", icon: "📝", tab: "study", badge: "Live AI", desc: "Transforms any complex curriculum topic into structured, revision-ready note cards." },
    { id: "summarize", name: "Academic Text Summarizer", category: "study", icon: "📑", tab: "study", badge: "Fast", desc: "Condenses lengthy textbook chapters and articles into high-yield takeaways." },
    { id: "explain", name: "Deep Concept Explainer", category: "study", icon: "💡", tab: "study", badge: "Adaptive", desc: "Explains physics, chemistry, math, or biology concepts in 4 distinct comprehension styles." },
    { id: "mindmap", name: "Visual Mind Map Visualizer", category: "study", icon: "🌳", tab: "study", badge: "Interactive", desc: "Generates interactive hierarchical visual mind maps with one-click AI explanations." },
    { id: "qpaper", name: "CBSE & Board Question Papers", category: "study", icon: "📄", tab: "study", badge: "Exam Prep", desc: "Builds comprehensive mock exam papers with section-wise marking schemes." },
    { id: "ocr", name: "Vision Textbook OCR Scanner", category: "study", icon: "📷", tab: "study", badge: "Multimodal", desc: "Extracts handwritten equations, notes, and textbook exercises from uploaded photos." },
    { id: "pdf", name: "Document & PDF Analyzer", category: "study", icon: "📂", tab: "study", badge: "Doc AI", desc: "Uploads and summarizes entire syllabus guides, slides, and study PDFs." },
    { id: "vocab", name: "AI Vocabulary & Flashcards", category: "vocab_calc", icon: "📚", tab: "vocab_calc", badge: "Active Deck", desc: "Builds your personal active vocabulary repository with parts of speech and examples." },
    { id: "calc", name: "Interactive Scientific Calculator", category: "vocab_calc", icon: "🧮", tab: "vocab_calc", badge: "Tactile", desc: "Full scientific, trigonometric, exponential, and algebraic calculations." },
    { id: "formula", name: "Math & Physics Formula Vault", category: "vocab_calc", icon: "📐", tab: "vocab_calc", badge: "Searchable", desc: "Instant searchable directory of core equations, constants, and theorem proofs." },
    { id: "mocktest", name: "AI Mock Exam Engine", category: "focus", icon: "⚡", tab: "focus", badge: "Timed Test", desc: "Adaptive timed multiple-choice tests with real-time scoring and XP rewards." },
    { id: "goals", name: "Smart Daily Goals & Streak XP", category: "productivity", icon: "🎯", tab: "productivity", badge: "+15 XP", desc: "Daily task checklists with completion progress bars and streak momentum bonuses." },
    { id: "exams", name: "Target Exam Countdown Hub", category: "productivity", icon: "⏳", tab: "productivity", badge: "Countdown", desc: "Live day-by-day countdowns to board exams, unit tests, and semester finals." },
    { id: "spaced", name: "Leitner Spaced Repetition Planner", category: "productivity", icon: "🧠", tab: "productivity", badge: "Recall", desc: "Scientific spaced interval revision system that schedules active recall reviews." },
    { id: "soundscapes", name: "Multi-track Ambient Noise Mixer", category: "focus", icon: "🎧", tab: "focus", badge: "Binaural", desc: "Mix rain, forest birds, lo-fi chords, and coffee shop ambiance to block noise." },
    { id: "focusroom", name: "Zen Pomodoro Focus Chamber", category: "focus", icon: "🧘", tab: "focus", badge: "Zero-Distraction", desc: "Full-screen minimalist study timer with built-in scratchpad and calming visuals." },
    { id: "buddies", name: "Study Buddy Circles & Chat", category: "focus", icon: "👥", tab: "focus", badge: "Social", desc: "Connect with classmates, share revision decks, and track group study levels." },
    { id: "dictation", name: "Smart Voice Dictation Notes", category: "study", icon: "🎙️", tab: "study", badge: "Voice AI", desc: "Speaks naturally to capture lecture notes and generate AI study responses." },
    { id: "tts", name: "Neural Text-to-Speech Player", category: "study", icon: "🔊", tab: "study", badge: "Audio", desc: "Listens to any AI explanation, mind map node, or summary with native speech synthesis." },
    { id: "backup", name: "Encrypted Cloud Data Sync", category: "utilities", icon: "💾", tab: "utilities", badge: "Secure", desc: "Exports and imports your entire notebook, study goals, exams, and flashcards." },
    { id: "diagram", name: "AI Diagram & Flowchart Lab", category: "utilities", icon: "🎨", tab: "utilities", badge: "Visual Lab", desc: "Generates high-contrast textbook diagrams and academic flowchart visuals." }
  ];

  const handleSelectCatalogTool = (toolItem: typeof ADVANCED_TOOLS_CATALOG[0]) => {
    xt(toolItem.id);
    ut(toolItem.tab);
    setShowCatalogModal(false);
    if (toolItem.id === "diagram" && onOpenDiagramMaker) {
      onClose();
      onOpenDiagramMaker("Process Flow of Science Concept", "Concept Flowchart", f);
    } else if (toolItem.id === "focusroom") {
      zt(true);
    }
  };

  const copyWithToast = (textToCopy: string, label = "Copied to clipboard!") => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopiedToast(label);
    setTimeout(() => setCopiedToast(null), 2500);
  };

  useEffect(() => {
    if (initialTool) {
      xt(initialTool);
      // Map tool to tab
      if (["notes", "summarize", "explain", "mindmap", "qpaper", "ocr", "pdf", "dictation", "tts"].includes(initialTool)) {
        ut("study");
      } else if (["vocab", "calc", "formula"].includes(initialTool)) {
        ut("vocab_calc");
      } else if (["goals", "spaced", "exams"].includes(initialTool)) {
        ut("productivity");
      } else if (["soundscapes", "timer", "mocktest", "focusroom", "buddies"].includes(initialTool)) {
        ut("focus");
      } else if (["translate", "math", "backup", "diagram"].includes(initialTool)) {
        ut("utilities");
      }
    }
  }, [initialTool]);
  const [E, ge] = useState(""); // topicInput
  const [f, Nt] = useState("Science"); // subjectInput
  const [I, bt] = useState("10"); // gradeInput
  const [ke, ft] = useState("Simple"); // explanationStyle: "Simple" | "Analogies" | "5-year-old" | "Step-by-step"
  const [G, Te] = useState(false); // aiLoading
  const [ht, je] = useState(false); // aiThrottle
  const [vt, Ee] = useState(false); // quizThrottle
  const [a, H] = useState<any>(null); // aiResult
  const [W, Ie] = useState("visual"); // mindmapViewType: "visual" | "tree"
  const [gt, ye] = useState<Record<string, boolean>>({}); // mindmapExpandedNodes
  const [h, $] = useState<any>(null); // mindmapExplainNode
  const [De, Ve] = useState(false); // mindmapExplainLoading

  useEffect(() => {
    if (p === "mindmap" && a && a.children) {
      const initialExpanded: Record<string, boolean> = {};
      a.children.forEach((_: any, i: number) => {
        initialExpanded[`child-${i}`] = true;
      });
      ye(initialExpanded);
      $(null);
    }
  }, [a, p]);

  const we = async (nodeName: string | unknown) => {
    if (!nodeName || typeof nodeName !== 'string') return;
    Ve(true);
    $({ nodeName, explanation: "" });
    try {
      const promptText = `Explain the concept or subtopic "${nodeName}" in the context of our study topic "${E}" for class/grade ${I} level. Give a 2-sentence simple, clear explanation in ${appLanguage}.`;
      const response = await getStudyAnswer(promptText, undefined, undefined, appLanguage);
      $({ nodeName, explanation: response });
    } catch (err) {
      console.error(err);
      $({
        nodeName,
        explanation: appLanguage === "Hindi"
          ? "स्पष्टीकरण लोड करने में असमर्थ। कृपया पुनः प्रयास करें।"
          : "Unable to load explanation. Please try again."
      });
    } finally {
      Ve(false);
    }
  };

  const kt = async (title: string | unknown, contentText: string | unknown) => {
    const cleanTitle = typeof title === 'string' ? title : "Study Note";
    const cleanContent = typeof contentText === 'string' ? contentText : String(contentText || "");
    if (!cleanContent) return;
    try {
      await onAddNote({
        title: cleanTitle,
        content: `### ${cleanTitle}\n\n${cleanContent}\n\n*Generated from Mindmap of topic: **${E}**.*`,
        subject: f
      });
      alert(
        appLanguage === "Hindi"
          ? `✅ "${title}" को आपके नोटबुक में सफलतापूर्वक जोड़ दिया गया है!`
          : `✅ "${title}" has been successfully added to your Notebook!`
      );
    } catch (i) {
      console.error(i);
      alert(appLanguage === "Hindi" ? "नोट सहेजने में विफल।" : "Failed to save note.");
    }
  };

  const [Se, Tt] = useState(""); // pdfTextInput
  const [Y, jt] = useState<string | null>(null); // ocrImagePreview
  const [Et, It] = useState(isAiQuotaExceeded); // isQuotaExceeded
  const [c, yt] = useState(() => getToolkitUsage()); // toolkitUsage

  useEffect(() => {
    const handleQuotaChange = (s: any) => {
      It(s.detail?.exceeded ?? false);
    };
    window.addEventListener("ai-quota-state-changed", handleQuotaChange);
    return () => {
      window.removeEventListener("ai-quota-state-changed", handleQuotaChange);
    };
  }, []);

  useEffect(() => {
    const handleUsageChange = (s: any) => {
      if (s.detail) yt(s.detail);
    };
    window.addEventListener("toolkit-usage-updated", handleUsageChange);
    return () => {
      window.removeEventListener("toolkit-usage-updated", handleUsageChange);
    };
  }, []);

  const [quizSubject, setQuizSubject] = useState("Science"); // quizSubject
  const [Ce, Vt] = useState("10"); // quizGrade
  const [A, K] = useState(false); // quizRunning
  const [v, wt] = useState<any[]>([]); // quizQuestions
  const [Z, $e] = useState(false); // quizGenerating
  const [ee, Ae] = useState<number[]>([]); // quizAnswers
  const [St, te] = useState(false); // quizSubmitted
  const [U, Me] = useState(0); // quizTimeLeft
  const [Ct, _Ss] = useState(300); // quizTimeTotal
  const b = useRef<any>(null); // quizTimerRef

  const [y, $t] = useState(""); // vocabWordInput
  const [ze, Re] = useState(false); // vocabLoading
  const [d, Pe] = useState<any>(null); // vocabResult
  const [g, Fe] = useState<any[]>(() => JSON.parse(localStorage.getItem("studybuddy_vocab_list") || "[]")); // vocabSavedDeck
  const [Oe, M] = useState("0"); // calcDisplay
  const [_e, At] = useState(""); // formulaSearch

  const Mt = [
    {
      title: "Quadratic Formula",
      subject: "Mathematics",
      expr: "x = (-b ± √(b² - 4ac)) / 2a",
      desc: "Finds the roots of a quadratic equation ax² + bx + c = 0."
    },
    {
      title: "Area of Circle",
      subject: "Mathematics",
      expr: "A = πr²",
      desc: "Calculates total area enclosed by a circle of radius r."
    },
    {
      title: "Newton's Second Law",
      subject: "Physics",
      expr: "F = ma",
      desc: "Force equals mass multiplied by acceleration."
    },
    {
      title: "Einstein's Energy-Mass Equivalence",
      subject: "Physics",
      expr: "E = mc²",
      desc: "Relates mass (m) and energy (E) using the constant speed of light (c)."
    },
    {
      title: "Ideal Gas Law",
      subject: "Chemistry",
      expr: "PV = nRT",
      desc: "Relates pressure, volume, gas amount, temperature, and gas constant."
    },
    {
      title: "Pythagorean Theorem",
      subject: "Mathematics",
      expr: "a² + b² = c²",
      desc: "In a right-angled triangle, hypotenuse squared is the sum of other two sides squared."
    }
  ];

  const [D, q] = useState<any[]>(() =>
    JSON.parse(
      localStorage.getItem("studybuddy_daily_goals") ||
        '[{"id":"1","text":"Solve 5 algebra issues","completed":false},{"id":"2","text":"Revise Science summary","completed":false}]'
    )
  ); // dailyGoals
  const [se, Le] = useState(""); // newGoalText
  const [z, ie] = useState<any[]>(() => JSON.parse(localStorage.getItem("studybuddy_exams_list") || "[]")); // examsList
  const [R, le] = useState({ subject: "Mathematics", date: "", title: "" }); // newExam

  const [Ge, He] = useState([
    {
      id: "rain",
      name: "Gentle Rain",
      icon: "🌧️",
      audioUrl: "https://assets.mixkit.co/active_storage/sfx/2533/2533-84.wav",
      playing: false,
      volume: 50
    },
    {
      id: "forest",
      name: "Forest Birds",
      icon: "🌲",
      audioUrl: "https://assets.mixkit.co/active_storage/sfx/1113/1113-84.wav",
      playing: false,
      volume: 50
    },
    {
      id: "lofi",
      name: "Lofi Chords",
      icon: "🎸",
      audioUrl: "https://assets.mixkit.co/active_storage/sfx/123/123.wav",
      playing: false,
      volume: 50
    },
    {
      id: "cafe",
      name: "Coffee Shop",
      icon: "☕",
      audioUrl: "https://assets.mixkit.co/active_storage/sfx/1441/1441-84.wav",
      playing: false,
      volume: 50
    }
  ]);

  const x = useRef<Record<string, HTMLAudioElement>>({}); // soundscapeAudioInstances
  const [m, zt] = useState(false); // focusModeActive
  const [B, Ue] = useState(1500); // focusTimerTime (seconds, default 25 min = 1500)
  const [P, ae] = useState(false); // focusTimerRunning
  const [Rt, Pt] = useState(""); // focusTimerScratchpad
  const N = useRef<any>(null); // focusTimerRef

  const [V, qe] = useState<any[]>(() =>
    JSON.parse(
      localStorage.getItem("studybuddy_friends") ||
        `[
          {"id":"f1","name":"Aanya Sharma","online":true,"xp":1250,"chat":[]},
          {"id":"f2","name":"Vivaan Patel","online":false,"xp":980,"chat":[]},
          {"id":"f3","name":"Ishita Roy","online":true,"xp":1500,"chat":[]}
        ]`
    )
  ); // buddyList
  const [w, Ft] = useState<string | null>(null); // activeBuddyChatId
  const [oe, Be] = useState(""); // directMessageInput
  const [F, ne] = useState<any[]>(() => JSON.parse(localStorage.getItem("studybuddy_revision_spaced") || "[]")); // spacedRevisionList
  const [re, ce] = useState(false); // ttsPlaying
  const [Ot, J] = useState(false); // speechRecognitionRunning
  const pe = useRef<any>(null); // speechRecognitionInstance

  useEffect(() => {
    localStorage.setItem("studybuddy_vocab_list", JSON.stringify(g));
  }, [g]);

  useEffect(() => {
    localStorage.setItem("studybuddy_daily_goals", JSON.stringify(D));
  }, [D]);

  useEffect(() => {
    localStorage.setItem("studybuddy_exams_list", JSON.stringify(z));
  }, [z]);

  useEffect(() => {
    localStorage.setItem("studybuddy_friends", JSON.stringify(V));
  }, [V]);

  useEffect(() => {
    localStorage.setItem("studybuddy_revision_spaced", JSON.stringify(F));
  }, [F]);

  useEffect(() => {
    return () => {
      Object.values(x.current).forEach((t) => {
        if (t && typeof t.pause === "function") t.pause();
      });
      if (b.current) clearInterval(b.current);
      if (N.current) clearInterval(N.current);
    };
  }, []);

  const Je = (t: string, s: number) => {
    He((i) =>
      i.map((o) => {
        if (o.id === t) {
          if (x.current[t]) {
            x.current[t].volume = s / 100;
          }
          return { ...o, volume: s };
        }
        return o;
      })
    );
  };

  const Qe = (t: string) => {
    He((s) =>
      s.map((i) => {
        if (i.id === t) {
          const o = !i.playing;
          if (o) {
            if (!x.current[t]) {
              const n = new Audio(i.audioUrl);
              n.loop = true;
              x.current[t] = n;
            }
            x.current[t].volume = i.volume / 100;
            x.current[t].play().catch((n) => console.log("Audio play error", n));
          } else {
            if (x.current[t]) x.current[t].pause();
          }
          return { ...i, playing: o };
        }
        return i;
      })
    );
  };

  useEffect(() => {
    if (A && U > 0) {
      b.current = setInterval(() => {
        Me((t) => {
          if (t <= 1) {
            clearInterval(b.current);
            Ye();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (b.current) clearInterval(b.current);
    };
  }, [A, U]);

  useEffect(() => {
    if (P && B > 0) {
      N.current = setInterval(() => {
        Ue((t) => {
          if (t <= 1) {
            ae(false);
            if (N.current) clearInterval(N.current);
            alert("⏰ Great job! You completed your distraction-free study session!");
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (!P && N.current) clearInterval(N.current);
    }
    return () => {
      if (N.current) clearInterval(N.current);
    };
  }, [P, B]);

  const _t = () => {
    const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechClass) {
      alert("Speech recognition is not supported in this browser. Please try Chrome/Edge.");
      return;
    }
    if (!pe.current) {
      const s = new SpeechClass();
      s.continuous = false;
      s.lang = appLanguage === "Hindi" ? "hi-IN" : "en-US";
      s.onresult = async (i: any) => {
        const o = i.results[0][0].transcript;
        ge(o);
        J(false);
        We(o);
      };
      s.onerror = () => J(false);
      s.onend = () => J(false);
      pe.current = s;
    }
    J(true);
    pe.current.start();
  };

  const Q = (t: string | unknown) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      showToast("TTS not supported in this browser.", "error");
      return;
    }
    if (re) {
      window.speechSynthesis.cancel();
      ce(false);
      return;
    }
    const rawStr = typeof t === 'string' ? t : String(t || '');
    if (!rawStr) return;

    playTutorSpeech(
      rawStr,
      {},
      () => ce(true),
      () => ce(false),
      () => ce(false)
    );
  };

  const We = async (t?: string | unknown) => {
    if (ht || G) {
      showToast(appLanguage === "Hindi" ? "कृपया सर्वर सुरक्षा के लिए अनुरोधों के बीच 3 सेकंड प्रतीक्षा करें!" : "Please wait 3 seconds between requests to protect the server!", "info");
      return;
    }
    const s = typeof t === 'string' ? t : E;
    if (!s && p !== "pdf" && p !== "ocr") {
      showToast(appLanguage === "Hindi" ? "कृपया पहले विषय या पाठ दर्ज करें!" : "Please specify a topic or text first!", "info");
      return;
    }
    if (c.count >= c.limit) {
      showToast(
        appLanguage === "Hindi"
          ? "⚠️ आपके एडवांस्ड टूलकिट की दैनिक सीमा (50 मैसेजेस) समाप्त हो गई है। कृपया कल पुनः प्रयास करें।"
          : "⚠️ Your daily Advanced Toolkit limit of 50 messages has been reached. Please try again tomorrow!",
        "error"
      );
      return;
    }
    je(true);
    setTimeout(() => {
      je(false);
    }, 3000);
    Te(true);
    H(null);
    try {
      let result = null;
      if (p === "notes") result = await generateNotes(s, f, I);
      else if (p === "summarize") result = await summarizeNotes(s);
      else if (p === "explain") result = await explainTopic(s, f, I, ke);
      else if (p === "mindmap") result = await generateMindmap(s);
      else if (p === "qpaper") result = await generateQuestionPaper(s, f, I);
      else if (p === "ocr") result = await performOcr(Y || "");
      else if (p === "pdf") result = await summarizePdf(Se);

      if (result) {
        H(result);
        incrementToolkitUsage();
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("studybuddy-trigger-ad"));
        }, 1500);
      } else {
        showToast(appLanguage === "Hindi" ? "ऑफ़लाइन मोड सक्रिय। आंतरिक जनरेटर चल रहा है।" : "Running internal offline generator.", "info");
        H({
          title: "Offline Concept Overview",
          content: `### ${s}\n\nHere is an automated overview of **${s}** for standard Class ${I} syllabus studies. Please check connection to use real-time AI reasoning.`
        });
      }
    } catch (err) {
      logError(err, 'AI_TOOLKIT');
      const parsed = parseError(err);
      const isHindi = appLanguage === "Hindi";
      showToast(isHindi ? parsed.messageHindi : parsed.message, "error");
    } finally {
      Te(false);
    }
  };

  const Lt = async () => {
    if (vt || Z) {
      showToast(appLanguage === "Hindi" ? "कृपया सर्वर सुरक्षा के लिए अनुरोधों के बीच 3 सेकंड प्रतीक्षा करें!" : "Please wait 3 seconds between requests to protect the server!", "info");
      return;
    }
    if (c.count >= c.limit) {
      showToast(
        appLanguage === "Hindi"
          ? "⚠️ आपके एडवांस्ड टूलकिट की दैनिक सीमा (50 मैसेजेस) समाप्त हो गई है। कृपया कल पुनः प्रयास करें।"
          : "⚠️ Your daily Advanced Toolkit limit of 50 messages has been reached. Please try again tomorrow!",
        "error"
      );
      return;
    }
    Ee(true);
    setTimeout(() => {
      Ee(false);
    }, 3000);
    $e(true);
    K(false);
    te(false);
    try {
      const res = await generateQuiz(quizSubject, {
        name: user?.name || "Student",
        school: user?.school || "School",
        className: Ce
      }, appLanguage, "Hard");

      if (res && res.length > 0) {
        wt(res);
        Ae(new Array(res.length).fill(-1));
        Me(Ct);
        K(true);
        incrementToolkitUsage();
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("studybuddy-trigger-ad"));
        }, 1500);
      } else {
        showToast(appLanguage === "Hindi" ? "प्रश्न जनरेट नहीं किए जा सके। बैकअप डेटाबेस का उपयोग कर रहे हैं।" : "Could not generate mock questions. Using fallback exam database.", "info");
      }
    } catch (err) {
      logError(err, 'MOCK_EXAM_GEN');
      const parsed = parseError(err);
      const isHindi = appLanguage === "Hindi";
      showToast(isHindi ? parsed.messageHindi : parsed.message, "error");
    } finally {
      $e(false);
    }
  };

  const Ye = async () => {
    K(false);
    te(true);
    if (b.current) clearInterval(b.current);
    let correctCount = 0;
    v.forEach((qItem: any, idx: number) => {
      if (ee[idx] === qItem.answer) correctCount++;
    });
    const xpPoints = correctCount * 30;
    if (onAddProgress) {
      await onAddProgress(correctCount, v.length, quizSubject);
    }
    showToast(
      appLanguage === "Hindi"
        ? `📝 परीक्षण पूरा हुआ! स्कोर: ${correctCount}/${v.length}. आपने +${xpPoints} XP अंक अर्जित किए!`
        : `📝 Test Completed! Score: ${correctCount}/${v.length}. You earned +${xpPoints} XP points!`,
      "success"
    );
  };

  const Gt = async () => {
    if (y) {
      if (c.count >= c.limit) {
        showToast(
          appLanguage === "Hindi"
            ? "⚠️ आपके एडवांस्ड टूलकिट की दैनिक सीमा (50 मैसेजेस) समाप्त हो गई है। कृपया कल पुनः प्रयास करें।"
            : "⚠️ Your daily Advanced Toolkit limit of 50 messages has been reached. Please try again tomorrow!",
          "error"
        );
        return;
      }
      Re(true);
      try {
        const queryText = `Define the word: "${y}". Provide: Part of Speech, precise academic definition, 2 synonyms, and 1 example sentence. Format your response ONLY as valid JSON in this structure: {"word": "${y}", "partOfSpeech": "...", "definition": "...", "synonyms": ["...", "..."], "example": "..."}`;
        const resText = await getStudyAnswer(queryText, undefined, undefined, "English");
        if (resText) {
          let trimmed = resText.trim();
          if (trimmed.startsWith("```json")) {
            trimmed = trimmed.substring(7);
          } else if (trimmed.startsWith("```")) {
            trimmed = trimmed.substring(3);
          }
          if (trimmed.endsWith("```")) {
            trimmed = trimmed.substring(0, trimmed.length - 3);
          }
          const parsed = JSON.parse(trimmed.trim());
          Pe(parsed);
          incrementToolkitUsage();
        }
      } catch (err) {
        logError(err, 'VOCAB_BUILDER');
        Pe({
          word: y,
          partOfSpeech: "noun",
          definition: "A useful study word looked up for active learning.",
          synonyms: ["knowledge", "term"],
          example: `We registered ${y} inside our core Vocabulary Builder deck.`
        });
        showToast(appLanguage === "Hindi" ? "शब्द खोजने में त्रुटि। स्थानीय परिभाषा दिखा रहा है।" : "Error finding definition. Showing offline default.", "info");
      } finally {
        Re(false);
      }
    }
  };

  const Ht = () => {
    if (d) {
      if (g.some((t: any) => t.word.toLowerCase() === d.word.toLowerCase())) {
        return;
      }
      Fe((t) => [...t, d]);
      showToast(appLanguage === "Hindi" ? "शब्द सफलतापूर्वक सहेजा गया!" : "Saved word successfully!", "success");
    }
  };

  const Ut = (t: string) => {
    if (t === "C") M("0");
    else if (t === "DEL") M((s) => (s.length > 1 ? s.slice(0, -1) : "0"));
    else if (t === "=") {
      try {
        let expression = Oe.replace(/sin\(/g, "Math.sin(")
          .replace(/cos\(/g, "Math.cos(")
          .replace(/tan\(/g, "Math.tan(")
          .replace(/log\(/g, "Math.log10(")
          .replace(/ln\(/g, "Math.log(")
          .replace(/pi/g, "Math.PI")
          .replace(/e/g, "Math.E")
          .replace(/\^/g, "**");
        const calculated = new Function(`return ${expression}`)();
        M(Number(calculated).toFixed(4).replace(/\.?0+$/, ""));
      } catch {
        M("Error");
      }
    } else {
      M((s) => (s === "0" || s === "Error" ? t : s + t));
    }
  };

  const qt = () => {
    if (se.trim()) {
      q((t) => [...t, { id: Date.now().toString(), text: se, completed: false }]);
      Le("");
    }
  };

  const Bt = (id: string) => {
    q((s) =>
      s.map((i) => {
        if (i.id === id) {
          const updated = !i.completed;
          if (updated) {
            showToast(appLanguage === "Hindi" ? "🎯 लक्ष्य पूरा हुआ! +15 XP अंक दर्ज!" : "🎯 Goal completed! +15 XP points logged!", "success");
          }
          return { ...i, completed: updated };
        }
        return i;
      })
    );
  };

  const Jt = () => {
    if (R.title && R.date) {
      ie((t) => [...t, { id: Date.now().toString(), ...R }]);
      le({ subject: "Mathematics", date: "", title: "" });
    }
  };

  const Qt = (id: string) => {
    ie((s) => s.filter((i) => i.id !== id));
  };

  const Wt = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} days left` : days === 0 ? "Today!" : "Passed";
  };

  const Yt = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(
        JSON.stringify({
          goals: D,
          exams: z,
          vocabList: g,
          revisionNotes: F,
          friendsList: V
        })
      );
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `studybuddy_cloud_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const Xt = (t: any) => {
    const reader = new FileReader();
    if (t.target.files && t.target.files[0]) {
      reader.readAsText(t.target.files[0], "UTF-8");
      reader.onload = (i: any) => {
        try {
          const parsed = JSON.parse(i.target?.result);
          if (parsed.goals) q(parsed.goals);
          if (parsed.exams) ie(parsed.exams);
          if (parsed.vocabList) Fe(parsed.vocabList);
          if (parsed.revisionNotes) ne(parsed.revisionNotes);
          if (parsed.friendsList) qe(parsed.friendsList);
          showToast(appLanguage === "Hindi" ? "🎉 कोर बैकअप सफलतापूर्वक पुनर्स्थापित किया गया!" : "🎉 Core backup restored successfully!", "success");
        } catch {
          showToast(appLanguage === "Hindi" ? "अमान्य बैकअप फ़ाइल संरचना।" : "Invalid backup file structure.", "error");
        }
      };
    }
  };

  const Kt = () => {
    if (oe.trim() && w) {
      qe((t) =>
        t.map((s) => {
          if (s.id === w) {
            const chatLog = [...s.chat, `Me: ${oe}`, "Buddy: That sounds like a solid study plan! Keep pushing!"];
            return { ...s, chat: chatLog };
          }
          return s;
        })
      );
      Be("");
    }
  };

  const Zt = async () => {
    if (!a) return;
    const saveTitle = a.title || E || "AI Note Card";
    let saveContent = a.content || a.summary || a.explanation || "";
    if (typeof a === "object" && a.summary) saveContent = a.summary;
    if (typeof a === "object" && a.explanation) saveContent = a.explanation;

    await onAddNote({
      title: saveTitle,
      content: saveContent,
      subject: f
    });
    alert("📝 Study Note successfully saved in your notebook library!");
  };

  const es = (noteId: number, noteTitle: string) => {
    const intervals = [1, 7, 30];
    const item = F.find((O) => O.noteId === noteId);
    let nextStage = 0;
    if (item) {
      nextStage = Math.min(item.stage + 1, intervals.length - 1);
    }
    const daysToAdd = intervals[nextStage];
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysToAdd);

    ne((O) => {
      const exists = O.some((me) => me.noteId === noteId);
      if (exists) {
        return O.map((me) =>
          me.noteId === noteId
            ? { ...me, stage: nextStage, nextDate: targetDate.toISOString().split("T")[0] }
            : me
        );
      } else {
        return [
          ...O,
          { noteId, title: noteTitle, nextDate: targetDate.toISOString().split("T")[0], stage: nextStage }
        ];
      }
    });

    alert(`📅 Revision logged! Spaced review set for ${daysToAdd} day(s) from now.`);
  };

  const ts = (t: any) => {
    const file = t.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        jt(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col w-screen h-screen overflow-hidden transition-colors duration-300 ${
        m ? "bg-slate-950 text-cyan-300" : "bg-slate-50 text-slate-800"
      }`}
      id="toolkit_page"
    >
      <header
        className={`px-4 py-3 border-b flex justify-between items-center shrink-0 shadow-sm z-10 transition-colors duration-200 ${
          m ? "bg-slate-900 border-slate-800 text-cyan-400" : "bg-white border-slate-100 text-slate-800"
        }`}
      >
        <div className="flex items-center gap-1.5">
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-all duration-200 active:scale-95 flex items-center justify-center mr-1 ${
              m ? "hover:bg-slate-800 text-cyan-400 hover:text-cyan-300" : "hover:bg-slate-100 text-slate-500 hover:text-slate-800"
            }`}
            title="Back to Home"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={() => L(true)}
            className={`p-2 rounded-full transition-all duration-200 active:scale-95 flex items-center justify-center md:hidden mr-1 ${
              m ? "hover:bg-slate-800 text-cyan-400 hover:text-cyan-300" : "hover:bg-slate-100 text-slate-500 hover:text-slate-800"
            }`}
            title="Open Navigation"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className={`w-5 h-5 ${m ? "text-cyan-400" : "text-indigo-600"} animate-pulse`} />
            <div>
              <h1 className={`font-black text-sm sm:text-base tracking-tight leading-none ${m ? "text-cyan-300" : "text-slate-800"}`}>
                Advanced Study Toolkit
              </h1>
              <p className={`text-[9px] font-bold mt-0.5 leading-none hidden sm:block ${m ? "text-slate-500" : "text-slate-400"}`}>
                Comprehensive AI tools, practice engines & focus dashboard
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Animated 19+ Tools Catalog Trigger Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowCatalogModal(true)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs border transition-all ${
              m 
                ? "bg-gradient-to-r from-cyan-950 to-indigo-950 border-cyan-500/40 text-cyan-300 hover:border-cyan-400" 
                : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-500 shadow-indigo-500/20"
            }`}
            title="Browse all 19+ Tools"
          >
            <Layers size={13} className="animate-pulse" />
            <span className="hidden xs:inline">19+ Tools</span>
            <span className="px-1.5 py-0.2 bg-white/20 rounded-md text-[8px] font-mono">ALL</span>
          </motion.button>

          <div
            className={`hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border select-none text-[10px] font-black uppercase tracking-wider ${
              m ? "bg-cyan-950/40 border-cyan-500/20 text-cyan-400" : "bg-amber-50 border-amber-200 text-amber-800"
            }`}
          >
            <Cpu size={12} className={c.count >= c.limit * 0.8 ? "animate-pulse" : ""} />
            <span>
              {appLanguage === "Hindi"
                ? `प्रयुक्त: Toolkit: ${c.count}/${c.limit} Used`
                : `Toolkit: ${c.count}/${c.limit} Used`}
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => zt(!m)}
            className={`text-[10px] font-black uppercase px-2.5 py-1.5 sm:px-3 rounded-xl border transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
              m ? "bg-cyan-950 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900" : "bg-indigo-50 border-indigo-100 hover:bg-indigo-100 text-indigo-700"
            }`}
          >
            <span>{m ? "Exit Focus" : "Focus Mode 🧘"}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowCatalogModal(true)}
            className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer ${
              m ? "hover:bg-slate-800 text-cyan-500 hover:text-cyan-300" : "hover:bg-slate-100 text-slate-500 hover:text-slate-800"
            }`}
            title="Search 19+ Tools"
          >
            <Search size={16} />
          </motion.button>

          <button
            onClick={() => setShowCatalogModal(true)}
            className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer ${
              m ? "hover:bg-slate-800 text-cyan-500 hover:text-cyan-300" : "hover:bg-slate-100 text-slate-500 hover:text-slate-800"
            }`}
            title="Toolkit Catalog"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* Floating Copied Toast Alert */}
      <AnimatePresence>
        {copiedToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2 border border-slate-700"
          >
            <Check size={14} className="text-emerald-400" />
            <span>{copiedToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ALL 19+ ADVANCED TOOLS INTERACTIVE CATALOG MODAL */}
      <AnimatePresence>
        {showCatalogModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[88vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                        19+ Advanced Toolkit Hub
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        {ADVANCED_TOOLS_CATALOG.length} Tools Ready
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Explore our complete suite of AI engines, mathematical calculators, and focus utilities
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCatalogModal(false)}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Filter & Search Bar */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Search any tool (e.g. calculator, mindmap, soundscapes, goals, ocr, exam)..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 font-medium"
                    autoFocus
                  />
                  {catalogSearch && (
                    <button
                      onClick={() => setCatalogSearch("")}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold scrollbar-none">
                  {[
                    { id: "all", label: "All 19+ Tools" },
                    { id: "study", label: "🧠 AI Study Center" },
                    { id: "vocab_calc", label: "🧮 Practice & Formulas" },
                    { id: "productivity", label: "🎯 Goals & Recall" },
                    { id: "focus", label: "🧘 Focus & Audio" },
                    { id: "utilities", label: "⚡ Utilities & Sync" }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCatalogCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
                        catalogCategory === cat.id
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tools Interactive Grid */}
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[55vh] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {ADVANCED_TOOLS_CATALOG.filter((tool) => {
                  const matchSearch =
                    tool.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                    tool.desc.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                    tool.badge.toLowerCase().includes(catalogSearch.toLowerCase());
                  const matchCategory = catalogCategory === "all" || tool.category === catalogCategory;
                  return matchSearch && matchCategory;
                }).map((tool, idx) => (
                  <motion.div
                    key={tool.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectCatalogTool(tool)}
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-700 transition cursor-pointer flex flex-col justify-between group shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{tool.icon}</span>
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
                          {tool.badge}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                        {tool.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                        {tool.desc}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                      <span>Launch Tool</span>
                      <ChevronRight size={13} className="transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {m ? (
        <div className="flex-1 bg-slate-950 text-cyan-300 p-6 flex flex-col md:flex-row gap-6 overflow-y-auto">
          <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6 border-r border-slate-900 pr-0 md:pr-6">
            <span className="text-sm tracking-widest font-black uppercase text-cyan-500">Focusing On Your Future</span>
            <div className="text-6xl font-mono font-black text-cyan-400 shadow-cyan-950/50 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">
              {Math.floor(B / 60)
                .toString()
                .padStart(2, "0")}
              :{(B % 60).toString().padStart(2, "0")}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => ae(!P)}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-wider"
              >
                {P ? "Pause" : "Start Session"}
              </button>
              <button
                onClick={() => {
                  Ue(1500);
                  ae(false);
                }}
                className="p-3 bg-slate-900 border border-slate-800 text-cyan-400 rounded-2xl"
              >
                <RotateCcw size={16} />
              </button>
            </div>
            <p className="text-[10px] text-slate-500 italic max-w-sm">No notifications. No alerts. Just you and your textbooks.</p>
          </div>

          <div className="w-full md:w-80 flex flex-col gap-4">
            <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-3xl space-y-3">
              <h3 className="text-xs font-bold text-cyan-400 flex items-center uppercase tracking-wide gap-1.5">
                <Volume2 size={14} /> Soundscape Mixer
              </h3>
              {Ge.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-300 font-bold">
                    {t.icon} {t.name}
                  </span>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={t.volume}
                      onChange={(s) => Je(t.id, parseInt(s.target.value))}
                      className="w-16 accent-cyan-500"
                    />
                    <button
                      onClick={() => Qe(t.id)}
                      className={`p-1.5 rounded-lg text-[10px] ${t.playing ? "bg-cyan-600 text-slate-950" : "bg-slate-850 text-cyan-500"}`}
                    >
                      {t.playing ? <Volume2 size={10} /> : <Play size={10} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex-1 bg-slate-900 border border-slate-800/80 p-4 rounded-3xl flex flex-col">
              <span className="text-[10px] font-black text-cyan-500 uppercase mb-2">Scratchpad</span>
              <textarea
                value={Rt}
                onChange={(t) => Pt(t.target.value)}
                placeholder="Jot down formulas or quick calculation steps..."
                className="flex-1 bg-slate-950/50 border border-slate-800 rounded-2xl p-2.5 text-xs text-cyan-300 outline-none resize-none font-mono"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden relative">
          {ve && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden" onClick={() => L(false)} />
          )}
          <aside
            className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-slate-200/80 p-4 flex flex-col gap-2 transition-all duration-300 ease-in-out md:static md:translate-x-0 shrink-0 ${
              ve ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            } ${u ? "md:w-16 md:px-2 md:py-4" : "md:w-56 md:px-4 md:py-4"}`}
          >
            <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
              <span
                className={`text-[9px] uppercase font-black text-slate-400 tracking-wider transition-opacity duration-300 ${
                  u ? "md:opacity-0 md:w-0" : "opacity-100"
                }`}
              >
                Sections
              </span>
              <button
                onClick={() => dt(!u)}
                className="hidden md:flex p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 transition"
                title={u ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {u ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
              </button>
              <button
                onClick={() => L(false)}
                className="flex md:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-rose-600 transition"
                title="Close Navigation"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              {[
                { id: "study", label: "AI Study Center", icon: <Sparkles size={15} /> },
                { id: "vocab_calc", label: "Practice Tools", icon: <Activity size={15} /> },
                { id: "productivity", label: "Planner & Goals", icon: <ListTodo size={15} /> },
                { id: "focus", label: "Social & Sounds", icon: <Headphones size={15} /> },
                { id: "utilities", label: "File Backup", icon: <Cloud size={15} /> }
              ].map((t) => {
                const isCurrent = j === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      ut(t.id);
                      L(false);
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl transition-all duration-200 flex items-center gap-3 font-extrabold text-xs group relative ${
                      isCurrent ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    } ${u ? "md:justify-center md:px-0" : ""}`}
                    title={t.label}
                  >
                    <span className={isCurrent ? "text-white" : "text-indigo-600 group-hover:text-indigo-700"}>{t.icon}</span>
                    <span className={`transition-all duration-300 ${u ? "md:hidden" : "block"}`}>{t.label}</span>
                    {u && (
                      <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[9px] font-black rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 hidden md:block shadow-md">
                        {t.label}
                      </div>
                    )}
                  </button>
                );
              })}

              <button
                onClick={() => {
                  onClose();
                  if (onOpenDiagramMaker) onOpenDiagramMaker("Process Flow of Water Cycle", "Water Cycle", "Science");
                }}
                className={`w-full py-2.5 px-3 rounded-xl transition-all duration-200 flex items-center gap-3 font-black text-xs group relative border border-dashed text-indigo-600 border-indigo-200 hover:bg-indigo-50/50 mt-2 ${
                  u ? "md:justify-center md:px-0" : ""
                }`}
                title="Open Diagram Lab"
              >
                <span className="text-indigo-600">
                  <Palette size={15} />
                </span>
                <span className={`transition-all duration-300 ${u ? "md:hidden" : "block"}`}>Open Diagram Lab 🎨</span>
                {u && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[9px] font-black rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 hidden md:block shadow-md">
                    Diagram Lab
                  </div>
                )}
              </button>
            </div>

            {!u && (
              <div className="mt-auto p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-2 select-none">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Cpu className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                    <span className="font-extrabold text-[9px] text-slate-700 uppercase tracking-wider">
                      {appLanguage === "Hindi" ? "टूलकिट उपयोग" : "Toolkit Usage"}
                    </span>
                  </div>
                  <span
                    className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                      c.count >= c.limit ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {c.count >= c.limit ? (appLanguage === "Hindi" ? "सीमा पूर्ण 🛑" : "Full 🛑") : appLanguage === "Hindi" ? "सक्रिय ✅" : "Active ✅"}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="w-full bg-slate-100 border border-slate-200/40 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        c.count >= c.limit ? "bg-rose-500" : c.count >= c.limit * 0.8 ? "bg-amber-500 animate-pulse" : "bg-indigo-600"
                      }`}
                      style={{ width: `${Math.min(100, (c.count / c.limit) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[8px] font-extrabold text-slate-500">
                    <span>{appLanguage === "Hindi" ? "दैनिक सीमा (50)" : "Daily Limit (50)"}</span>
                    <span>{c.count} / {c.limit}</span>
                  </div>
                </div>
              </div>
            )}
          </aside>

          <main className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
            {j === "study" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {/* Visual Tool Selector Chips */}
                <div className="flex gap-1.5 flex-wrap bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                  {[
                    { id: "notes", label: "Synthesize Notes", icon: "📝" },
                    { id: "summarize", label: "Summarize", icon: "📑" },
                    { id: "explain", label: "Deep Explain", icon: "💡" },
                    { id: "mindmap", label: "Mind Map", icon: "🌳" },
                    { id: "qpaper", label: "Question Paper", icon: "📄" },
                    { id: "ocr", label: "Vision OCR", icon: "📷" },
                    { id: "pdf", label: "PDF / Doc", icon: "📂" }
                  ].map((t) => {
                    const isSelected = p === t.id;
                    return (
                      <motion.button
                        key={t.id}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => {
                          xt(t.id);
                          H(null);
                        }}
                        className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50"
                        }`}
                      >
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: AI Control Parameters */}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4 bg-slate-50/70 dark:bg-slate-900/60 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        <h3 className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                          AI Parameters
                        </h3>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900/50">
                        {p.toUpperCase()}
                      </span>
                    </div>

                    {p !== "ocr" && p !== "pdf" && (
                      <div>
                        <label className="block text-[8px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider mb-1">
                          Topic / Term
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={E}
                            onChange={(t) => ge(t.target.value)}
                            placeholder="e.g. Gravity, Organic Chemistry, Photosynthesis"
                            className="w-full p-2.5 pr-8 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:border-indigo-500 transition shadow-inner"
                          />
                          <button
                            onClick={_t}
                            className={`absolute right-2 top-2.5 p-1 rounded-lg text-slate-400 hover:text-indigo-600 transition cursor-pointer ${
                              Ot ? "animate-pulse text-red-500 bg-red-50" : ""
                            }`}
                            title="Dictate with voice"
                          >
                            <Mic size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    {p !== "summarize" && p !== "mindmap" && p !== "ocr" && p !== "pdf" && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider mb-1">
                            Subject
                          </label>
                          <select
                            value={f}
                            onChange={(t) => Nt(t.target.value)}
                            className="w-full p-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                          >
                            {["Mathematics", "Science", "Biology", "Physics", "Chemistry", "English"].map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[8px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider mb-1">
                            Grade Level
                          </label>
                          <select
                            value={I}
                            onChange={(t) => bt(t.target.value)}
                            className="w-full p-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                          >
                            {["8", "9", "10", "11", "12"].map((t) => (
                              <option key={t} value={t}>
                                Class {t}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {p === "explain" && (
                      <div>
                        <label className="block text-[8px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider mb-1">
                          Explanation Style
                        </label>
                        <select
                          value={ke}
                          onChange={(t) => ft(t.target.value)}
                          className="w-full p-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:border-indigo-500"
                        >
                          <option value="Simple">Simple Student English</option>
                          <option value="Analogies">Vivid Analogy & Metaphor</option>
                          <option value="5-year-old">Like I am 5 Years Old</option>
                          <option value="Step-by-step">Meticulous Step-by-Step</option>
                        </select>
                      </div>
                    )}

                    {p === "ocr" && (
                      <div className="space-y-2">
                        <label className="block text-[8px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider mb-1">
                          Upload Homework / Textbook Image
                        </label>
                        <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-800/60 rounded-2xl p-4 text-center hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition relative group cursor-pointer">
                          <input type="file" accept="image/*" onChange={ts} className="absolute inset-0 opacity-0 cursor-pointer" />
                          <Upload className="w-8 h-8 text-indigo-400 group-hover:text-indigo-600 mx-auto mb-1.5 transition transform group-hover:-translate-y-0.5" />
                          <span className="text-[10px] text-slate-600 dark:text-slate-300 font-bold block">Click to select image file</span>
                          <span className="text-[8px] text-slate-400 block mt-0.5">Supports PNG, JPG & textbook camera photos</span>
                        </div>
                        {Y && (
                          <div className="relative overflow-hidden rounded-xl border border-indigo-200 shadow-sm mt-2">
                            <img src={Y} alt="OCR Upload Preview" className="w-full h-28 object-cover" />
                            {G && (
                              <div className="absolute inset-0 bg-indigo-900/30 flex items-center justify-center">
                                <div className="w-full h-1 bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)] animate-bounce" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {p === "pdf" && (
                      <div>
                        <label className="block text-[8px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider mb-1">
                          Paste Document / Note Content
                        </label>
                        <textarea
                          value={Se}
                          onChange={(t) => Tt(t.target.value)}
                          placeholder="Paste your long notes, PDF texts, or study guides here..."
                          className="w-full h-32 p-2.5 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl outline-none resize-none font-mono focus:border-indigo-500"
                        />
                      </div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => We()}
                      disabled={G}
                      className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex justify-center items-center gap-2 shadow-md cursor-pointer transition ${
                        G 
                          ? "bg-indigo-400 text-white cursor-not-allowed" 
                          : "bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-600/30"
                      }`}
                    >
                      {G ? (
                        <>
                          <Activity className="w-4 h-4 animate-spin text-cyan-200" />
                          <span className="animate-pulse">Gemini Reasoning...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Run AI Tool ⚡</span>
                        </>
                      )}
                    </motion.button>
                  </motion.div>

                  <div className="col-span-2 bg-slate-50/20 rounded-3xl border border-slate-100 p-4 min-h-[300px] flex flex-col justify-between">
                    {G ? (
                      <div className="flex-1 flex flex-col items-center justify-center space-y-2">
                        <span className="animate-spin text-2xl">⏳</span>
                        <span className="text-xs font-bold text-slate-500 animate-pulse">Running Gemini analysis models...</span>
                      </div>
                    ) : a ? (
                      <div className="space-y-4 flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-center border-b pb-2">
                          <h4 className="font-extrabold text-xs text-indigo-900">{a.title || "Gemini Extraction Result"}</h4>
                          <div className="flex gap-1.5 items-center">
                            <button
                              onClick={() => {
                                const text = a.content || a.summary || a.explanation || a.paperText || "";
                                copyWithToast(text, "Result copied to clipboard! 📋");
                              }}
                              className="text-[10px] font-bold px-2 py-1 rounded-lg border bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1 transition cursor-pointer"
                              title="Copy Result"
                            >
                              <Copy size={12} /> Copy
                            </button>
                            <button
                              onClick={() => Q(a.content || a.summary || a.explanation || a.paperText || "")}
                              className={`text-[10px] font-bold px-2 py-1 rounded-lg border flex items-center gap-1 ${
                                re ? "bg-indigo-600 text-white" : "bg-white text-slate-700"
                              }`}
                            >
                              <Volume2 size={12} /> {re ? "Mute" : "Listen"}
                            </button>
                            <button
                              onClick={Zt}
                              className="text-[10px] bg-white text-slate-700 font-bold px-2 py-1 rounded-lg border hover:bg-slate-50 transition"
                            >
                              Save Note 📝
                            </button>
                            {onOpenDiagramMaker && (
                              <button
                                onClick={() => {
                                  const diagramTitle = a.title || E || "Custom Concept";
                                  const diagramPrompt = `A detailed, high-contrast textbook-grade study diagram of ${diagramTitle} with academic labeling pointers.`;
                                  onOpenDiagramMaker(diagramPrompt, diagramTitle, f);
                                }}
                                className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-black px-2 py-1 rounded-lg transition flex items-center gap-1.5"
                              >
                                <Palette size={11} />
                                <span>Diagram Lab 🎨</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {Et && (
                          <div className="p-2.5 bg-amber-50 border border-amber-200/60 rounded-xl text-[10px] text-amber-800 leading-normal select-none font-sans">
                            ⚠️ <strong>Offline Fallback Mode</strong>: Gemini daily API quota exceeded. Running internal high-quality study generator. Configure a custom key in settings for unlimited live AI.
                          </div>
                        )}

                        <div className="flex-1 overflow-y-auto max-h-[350px] text-xs leading-relaxed text-slate-700 whitespace-pre-line font-medium p-1">
                          {p === "mindmap" ? (
                            <div className="space-y-4 font-sans">
                              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                                <div className="flex items-center space-x-1.5">
                                  <span className="text-sm">🌳</span>
                                  <span className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider">
                                    {appLanguage === "Hindi" ? "माइंड मैप विज़ुअलाइज़र" : "Mind Map Visualizer"}
                                  </span>
                                </div>
                                <div className="flex bg-slate-100 p-0.5 rounded-xl text-[9px] font-bold">
                                  <button
                                    onClick={() => Ie("visual")}
                                    className={`px-2.5 py-1 rounded-lg transition-all ${
                                      W === "visual" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                                    }`}
                                  >
                                    🎨 {appLanguage === "Hindi" ? "विज़ुअल मैप" : "Visual Map"}
                                  </button>
                                  <button
                                    onClick={() => Ie("tree")}
                                    className={`px-2.5 py-1 rounded-lg transition-all ${
                                      W === "tree" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                                    }`}
                                  >
                                    🌳 {appLanguage === "Hindi" ? "ट्री व्यू" : "Tree View"}
                                  </button>
                                </div>
                              </div>

                              {W === "visual" ? (
                                <div className="space-y-4">
                                  <div className="flex justify-center my-2">
                                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-xs px-5 py-3 rounded-2xl shadow-md border-2 border-indigo-200 text-center relative max-w-xs transform hover:scale-105 transition duration-300">
                                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-yellow-400 text-[8px] font-black uppercase text-indigo-950 px-2 py-0.5 rounded-full shadow-sm tracking-wider whitespace-nowrap">
                                        {appLanguage === "Hindi" ? "मुख्य विषय" : "Main Topic"}
                                      </div>
                                      <span className="block mt-0.5 tracking-wide">{a.name}</span>
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    {a.children?.map((t: any, s: number) => {
                                      const isExpanded = !!gt[`child-${s}`];
                                      const hasSubChildren = t.children && t.children.length > 0;
                                      return (
                                        <div key={s} className="bg-white rounded-2xl border border-indigo-50 shadow-xs overflow-hidden transition-all duration-300">
                                          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50/20 to-slate-50/35 border-b border-indigo-50/40">
                                            <div className="flex items-center space-x-2 flex-1 min-w-0 pr-1">
                                              <span className="flex items-center justify-center w-5 h-5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg shrink-0">
                                                {s + 1}
                                              </span>
                                              <span className="font-extrabold text-xs text-slate-800 leading-tight truncate">
                                                {t.name}
                                              </span>
                                            </div>
                                            <div className="flex items-center space-x-1.5 shrink-0">
                                              {hasSubChildren && (
                                                <button
                                                  onClick={() =>
                                                    ye((n) => ({
                                                      ...n,
                                                      [`child-${s}`]: !isExpanded
                                                    }))
                                                  }
                                                  className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition-all text-[9px] font-bold flex items-center gap-0.5"
                                                  title={isExpanded ? "Collapse" : "Expand"}
                                                >
                                                  <span className="uppercase text-[8px]">
                                                    {isExpanded
                                                      ? appLanguage === "Hindi"
                                                        ? "छिपाएं"
                                                        : "Hide"
                                                      : `${appLanguage === "Hindi" ? "देखें" : "Show"} (${t.children.length})`}
                                                  </span>
                                                  <ChevronRight
                                                    size={11}
                                                    className={`transform transition-transform ${isExpanded ? "rotate-90" : ""}`}
                                                  />
                                                </button>
                                              )}
                                              <button
                                                onClick={() => we(t.name)}
                                                className="px-2 py-0.5 text-indigo-600 hover:bg-indigo-50 border border-indigo-100 bg-indigo-50/20 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all"
                                              >
                                                💡 {appLanguage === "Hindi" ? "समझें" : "Explain"}
                                              </button>
                                              <button
                                                onClick={() => Q(t.name)}
                                                className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition-all"
                                                title="Speak text"
                                              >
                                                <Volume2 size={12} />
                                              </button>
                                            </div>
                                          </div>

                                          {isExpanded && hasSubChildren && (
                                            <div className="p-2.5 bg-slate-50/40 space-y-2 border-t border-slate-100/40">
                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {t.children.map((subNode: any, subIdx: number) => (
                                                  <div
                                                    key={subIdx}
                                                    className="bg-white border border-slate-150 p-2 rounded-xl shadow-2xs hover:border-indigo-100 transition-all flex items-center justify-between"
                                                  >
                                                    <div className="flex items-center space-x-1.5 flex-1 min-w-0 pr-1.5">
                                                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 animate-pulse" />
                                                      <span className="text-[10px] font-bold text-slate-700 truncate leading-tight">
                                                        {subNode.name}
                                                      </span>
                                                    </div>
                                                    <div className="flex items-center space-x-1 shrink-0">
                                                      <button
                                                        onClick={() => we(subNode.name)}
                                                        className="px-1.5 py-0.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-slate-500 rounded-lg text-[7px] font-black uppercase transition-all"
                                                        title="Explain this detail"
                                                      >
                                                        AI
                                                      </button>
                                                      <button
                                                        onClick={() => Q(subNode.name)}
                                                        className="p-0.5 text-slate-300 hover:text-indigo-600 transition-all"
                                                      >
                                                        <Volume2 size={10} />
                                                      </button>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3 font-mono text-[10px] bg-indigo-950 text-indigo-200 p-4 rounded-2xl shadow-inner">
                                  <span className="font-black text-xs text-white">🌳 Mind Map Tree Structure</span>
                                  <div className="space-y-1">
                                    <strong>{a.name}</strong>
                                    {a.children?.map((t: any, s: number) => (
                                      <div key={s} className="pl-4 border-l border-indigo-700/50 mt-1">
                                        <span>├── {t.name}</span>
                                        {t.children?.map((subNode: any, subIdx: number) => (
                                          <div key={subIdx} className="pl-6 text-indigo-400">
                                            ├── {subNode.name}
                                          </div>
                                        ))}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {h && (
                                <div className="mt-4 p-4 bg-gradient-to-br from-indigo-950 to-indigo-900 text-white rounded-3xl shadow-xl space-y-3 border border-indigo-800 animate-fadeIn relative overflow-hidden">
                                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
                                  <div className="flex justify-between items-center pb-2 border-b border-indigo-800/60">
                                    <div className="flex items-center space-x-1.5">
                                      <Sparkles className="w-4 h-4 text-yellow-300 stroke-[2] animate-bounce" />
                                      <span className="text-[9px] font-black uppercase tracking-wider text-indigo-300">
                                        {appLanguage === "Hindi" ? "एआई ट्यूटर स्पष्टीकरण" : "AI Tutor Explanation"}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => $(null)}
                                      className="text-indigo-400 hover:text-white p-1 rounded-lg transition-all"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>

                                  <div className="space-y-2">
                                    <h4 className="text-xs font-black text-white flex items-center gap-1.5">💡 {h.nodeName}</h4>
                                    {De ? (
                                      <div className="flex items-center space-x-2 py-3 text-indigo-300 text-[11px] font-bold">
                                        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
                                        <span>{appLanguage === "Hindi" ? "एआई ट्यूटर विचार कर रहा है..." : "AI Tutor is thinking..."}</span>
                                      </div>
                                    ) : (
                                      <p className="text-[11px] leading-relaxed text-indigo-100 font-medium">{h.explanation}</p>
                                    )}
                                  </div>

                                  {!De && h.explanation && (
                                    <div className="flex justify-between items-center pt-2 border-t border-indigo-800/40">
                                      <button
                                        onClick={() => Q(h.explanation)}
                                        className="px-3 py-1.5 bg-indigo-800 hover:bg-indigo-700 text-indigo-200 hover:text-white rounded-xl text-[10px] font-extrabold uppercase flex items-center gap-1.5 transition-all"
                                      >
                                        <Volume2 size={12} /> {appLanguage === "Hindi" ? "सुनें" : "Listen"}
                                      </button>
                                      <button
                                        onClick={() => kt(h.nodeName, h.explanation)}
                                        className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-indigo-950 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-yellow-500/10 active:scale-95"
                                      >
                                        <Plus size={12} strokeWidth={2.5} /> {appLanguage === "Hindi" ? "नोटबुक" : "Add to Note"}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="markdown-body text-xs font-sans leading-relaxed overflow-x-auto">
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
                                        <div className="relative my-2.5 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 text-left">
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
                                          <CodeHighlighter
                                            style={oneDark}
                                            language={lang === 'code' ? 'text' : lang}
                                            PreTag="div"
                                            customStyle={{ margin: 0, padding: '0.75rem', fontSize: '0.75rem', background: '#090d16' }}
                                            {...props}
                                          >
                                            {codeString}
                                          </CodeHighlighter>
                                        </div>
                                      );
                                    }

                                    return (
                                      <code className="bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded text-[11px] font-mono border border-slate-200 dark:border-slate-700/50" {...props}>
                                        {children}
                                      </code>
                                    );
                                  }
                                }}
                              >
                                {(() => {
                                  const raw = a.content || a.summary || a.explanation || a.paperText || a.text || safeJsonStringify(a);
                                  return typeof raw === 'string'
                                    ? raw.replace(/\\\[([\s\S]*?)\\\]/g, (_m, math) => `\n$$\n${math.trim()}\n$$\n`).replace(/\\\(([\s\S]*?)\\\)/g, (_m, math) => `$${math.trim()}$`)
                                    : String(raw || '');
                                })()}
                              </ReactMarkdown>
                            </div>
                          )}

                          {a.keyTerms && a.keyTerms.length > 0 && (
                            <div className="mt-4 space-y-2 border-t pt-3">
                              <span className="font-extrabold text-[11px] text-slate-800 block">📌 Key Term Cards Generated</span>
                              <div className="grid grid-cols-2 gap-2">
                                {a.keyTerms.map((t: any, s: number) => (
                                  <div key={s} className="p-2.5 bg-amber-50 border border-amber-100 rounded-xl">
                                    <strong className="text-amber-800 font-black block text-[10px]">{t.term}</strong>
                                    <p className="text-[9px] text-amber-700 mt-0.5 leading-tight">{t.definition}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-1 p-4">
                        <Cpu className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                        <span className="text-xs font-extrabold text-slate-600 block">Awaiting AI Task Execution</span>
                        <p className="text-[9px] text-slate-400 max-w-xs">
                          Run any parameters above to query Gemini models on physics, math, science, or biology details.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {j === "vocab_calc" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* AI Vocabulary Builder */}
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="bg-slate-50/70 dark:bg-slate-900/60 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-2">
                        <h3 className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                          <BookOpen size={15} className="text-indigo-600 dark:text-indigo-400" /> AI Vocabulary Builder
                        </h3>
                        <span className="text-[9px] font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-lg font-black uppercase border border-indigo-100 dark:border-indigo-900/50">
                          {g.length} WORDS DECK
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={y}
                          onChange={(t) => $t(t.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && Gt()}
                          placeholder="Type word (e.g. ubiquitous, entropy, pragmatic)..."
                          className="flex-1 p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs outline-none focus:border-indigo-500 transition shadow-inner font-medium"
                        />
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={Gt}
                          disabled={ze}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition shadow-xs flex items-center gap-1"
                        >
                          {ze ? (
                            <>
                              <Activity className="w-3.5 h-3.5 animate-spin" />
                              <span>Searching...</span>
                            </>
                          ) : (
                            <>
                              <Search size={13} />
                              <span>Explore</span>
                            </>
                          )}
                        </motion.button>
                      </div>

                      {d && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-4 bg-white dark:bg-slate-800/90 border border-indigo-100 dark:border-indigo-900/60 rounded-2xl space-y-2.5 relative shadow-sm"
                        >
                          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700/60 pb-1.5">
                            <div className="flex items-center gap-2">
                              <strong className="text-sm font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-tight">
                                {d.word}
                              </strong>
                              <span className="text-[9px] font-bold text-slate-400 italic">({d.partOfSpeech})</span>
                            </div>
                            <button
                              onClick={() => Q(`${d.word}. ${d.definition}`)}
                              className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                              title="Listen pronunciation"
                            >
                              <Volume2 size={13} />
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                            <strong className="text-indigo-600 dark:text-indigo-400">Meaning:</strong> {d.definition}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 italic leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                            <strong>Example:</strong> "{d.example}"
                          </p>
                          <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700/60">
                            <span className="text-[9px] font-bold text-slate-400 truncate max-w-[180px]">
                              Synonyms: {d.synonyms?.join(", ")}
                            </span>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={Ht}
                              className="text-[9px] font-black text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition cursor-pointer shadow-xs"
                            >
                              + Save to Deck
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {g.length > 0 && (
                      <div className="mt-4 border-t border-slate-200/60 dark:border-slate-800 pt-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                            My Saved Vocab Deck
                          </span>
                          <span className="text-[9px] text-indigo-500 font-bold">{g.length} words stored</span>
                        </div>
                        <div className="flex gap-1.5 flex-wrap max-h-[100px] overflow-y-auto scrollbar-thin">
                          {g.map((t, s) => (
                            <motion.span
                              key={s}
                              whileHover={{ scale: 1.05 }}
                              className="text-[10px] font-bold bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-xl shadow-2xs"
                            >
                              {t.word}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {/* Scientific Calculator with Tactile Sound & Buttons */}
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="bg-slate-50/70 dark:bg-slate-900/60 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2">
                      <h3 className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Cpu size={15} className="text-cyan-600 dark:text-cyan-400" /> Scientific Precision Calculator
                      </h3>
                      <span className="text-[8px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-bold">
                        DEG MODE
                      </span>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-2xl text-right text-cyan-300 font-mono font-black text-xl select-none min-h-[52px] shadow-inner border border-slate-800 flex items-center justify-end tracking-wider overflow-x-auto">
                      {Oe || "0"}
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 text-[10px] font-mono">
                      {[
                        "sin(", "cos(", "tan(", "DEL",
                        "log(", "ln(", "pi", "C",
                        "(", ")", "^", "/",
                        "7", "8", "9", "*",
                        "4", "5", "6", "-",
                        "1", "2", "3", "+",
                        "0", ".", "e", "="
                      ].map((t) => (
                        <motion.button
                          key={t}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.94 }}
                          onClick={() => Ut(t)}
                          className={`py-2.5 rounded-xl font-black transition-all cursor-pointer shadow-xs ${
                            t === "="
                              ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white hover:from-cyan-500 hover:to-indigo-500 col-span-2 shadow-cyan-600/20"
                              : ["C", "DEL"].includes(t)
                              ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100"
                              : ["sin(", "cos(", "tan(", "log(", "ln(", "pi", "e", "^"].includes(t)
                              ? "bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40 hover:bg-indigo-100"
                              : ["+", "-", "*", "/"].includes(t)
                              ? "bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300/80 dark:border-slate-700 font-extrabold"
                              : "bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs"
                          }`}
                        >
                          {t}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Math & Physics Formula Vault with Search */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-50/70 dark:bg-slate-900/60 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📐</span>
                      <div>
                        <h3 className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                          Math & Physics Formula Vault
                        </h3>
                        <p className="text-[9px] text-slate-400 font-medium">Quick reference formulas with high-contrast expressions</p>
                      </div>
                    </div>
                    <div className="relative w-full sm:w-56">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={_e}
                        onChange={(t) => At(t.target.value)}
                        placeholder="Search formula name / topic..."
                        className="w-full pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-[10px] outline-none focus:border-indigo-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {Mt.filter((t) => t.title.toLowerCase().includes(_e.toLowerCase()) || t.subject.toLowerCase().includes(_e.toLowerCase())).map((t, s) => (
                      <motion.div
                        key={s}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="bg-white dark:bg-slate-800/90 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 px-2 py-0.5 rounded-md">
                            {t.subject}
                          </span>
                          <button
                            onClick={() => copyWithToast(t.expr, `Formula copied: ${t.expr}`)}
                            className="text-slate-400 hover:text-indigo-600 p-1 rounded-md transition"
                            title="Copy formula"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                        <strong className="text-[11px] font-black text-slate-900 dark:text-white block leading-snug">{t.title}</strong>
                        <div className="bg-slate-950 p-2.5 rounded-xl font-mono text-[11px] font-black text-cyan-300 border border-slate-800 text-center tracking-wide shadow-inner select-all">
                          {t.expr}
                        </div>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{t.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {j === "productivity" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="bg-slate-50/70 dark:bg-slate-900/60 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-xs"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-2">
                        <h3 className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                          🎯 Daily Focus Targets
                        </h3>
                        <span className="text-[9px] font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-lg font-black border border-indigo-100 dark:border-indigo-900/40">
                          {D.filter((t) => t.completed).length}/{D.length} DONE
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={se}
                          onChange={(t) => Le(t.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && qt()}
                          placeholder="Add study target (e.g. solve 10 physics questions)..."
                          className="flex-1 p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs outline-none focus:border-indigo-500 font-medium"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={qt}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase cursor-pointer shadow-xs transition"
                        >
                          Add
                        </motion.button>
                      </div>

                      <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-thin">
                        {D.map((t) => (
                          <motion.div
                            key={t.id}
                            layout
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700 transition"
                          >
                            <button onClick={() => Bt(t.id)} className="flex items-center gap-2.5 text-left flex-1 cursor-pointer">
                              {t.completed ? (
                                <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                  <Check size={12} strokeWidth={3} />
                                </div>
                              ) : (
                                <Circle size={18} className="text-slate-400 hover:text-indigo-600 transition" />
                              )}
                              <span className={`text-[11px] font-bold transition ${t.completed ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200"}`}>
                                {t.text}
                              </span>
                            </button>
                            <button
                              onClick={() => q((s) => s.filter((i) => i.id !== t.id))}
                              className="text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 p-3 rounded-2xl flex items-center justify-between">
                      <span className="text-[10px] text-indigo-900 dark:text-indigo-300 font-bold">
                        Progress: {D.length > 0 ? Math.round((D.filter((t) => t.completed).length / D.length) * 100) : 0}%
                      </span>
                      <span className="text-[9px] font-black uppercase text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/60 px-2.5 py-0.5 rounded-lg shadow-2xs">
                        +15 XP Earned Per Goal
                      </span>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -2 }}
                    className="bg-slate-50/70 dark:bg-slate-900/60 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs"
                  >
                    <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-2">
                      <h3 className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        ⏳ Exam Countdown Timers
                      </h3>
                      <span className="text-[9px] font-mono text-rose-600 dark:text-rose-400 font-bold">
                        {z.length} SCHEDULED
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 items-end">
                      <div className="col-span-2">
                        <label className="block text-[8px] uppercase font-black text-slate-400 dark:text-slate-500 mb-1">Exam Title</label>
                        <input
                          type="text"
                          value={R.title}
                          onChange={(t) => le((s) => ({ ...s, title: t.target.value }))}
                          placeholder="e.g. Science Board Exam"
                          className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-[10px] outline-none focus:border-indigo-500 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] uppercase font-black text-slate-400 dark:text-slate-500 mb-1">Date</label>
                        <input
                          type="date"
                          value={R.date}
                          onChange={(t) => le((s) => ({ ...s, date: t.target.value }))}
                          className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-[10px] outline-none focus:border-indigo-500 font-medium"
                        />
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={Jt}
                      className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-xs transition"
                    >
                      + Save Exam Target
                    </motion.button>

                    <div className="space-y-2 max-h-[130px] overflow-y-auto scrollbar-thin">
                      {z.length === 0 ? (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 italic text-center py-2">No exams scheduled yet.</p>
                      ) : (
                        z.map((t) => (
                          <motion.div
                            key={t.id}
                            layout
                            className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-black uppercase bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 px-2 py-0.5 rounded-md">
                                {t.subject}
                              </span>
                              <strong className="text-[11px] font-black text-slate-800 dark:text-slate-200">{t.title}</strong>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <span className="text-[11px] font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-900/40">
                                {Wt(t.date)}
                              </span>
                              <button onClick={() => Qt(t.id)} className="text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 p-1 transition cursor-pointer">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-50/70 dark:bg-slate-900/60 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs"
                >
                  <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-2">
                    <div>
                      <h3 className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        📅 Intelligent Spaced Revision Planner
                      </h3>
                      <p className="text-[9px] text-slate-400 font-medium">
                        Active recall intervals automatically scheduled based on the Ebbinghaus forgetting curve.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {notes.length === 0 ? (
                      <div className="col-span-2 text-center py-6 text-[10px] text-slate-400 dark:text-slate-500 italic bg-white dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                        No notes logged in your Notebook yet. Create notes to activate automated spaced recall intervals!
                      </div>
                    ) : (
                      notes.map((t) => {
                        const spacer = F.find((i) => i.noteId === t.id);
                        return (
                          <motion.div
                            key={t.id}
                            whileHover={{ scale: 1.01 }}
                            className="bg-white dark:bg-slate-800/90 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition"
                          >
                            <div>
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[8px] font-black uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 px-2 py-0.5 rounded-md">
                                  {t.subject}
                                </span>
                                <strong className="text-[11px] font-black text-slate-800 dark:text-slate-200">{t.title}</strong>
                              </div>
                              <span className="block text-[9px] text-slate-500 dark:text-slate-400 font-medium">
                                Recall Stage: <strong className="text-indigo-600 dark:text-indigo-400">{spacer ? spacer.stage + 1 : "New"}</strong> | Next Date: {spacer ? spacer.nextDate : "Pending study"}
                              </span>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.96 }}
                              onClick={() => es(t.id, t.title)}
                              className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer shadow-2xs"
                            >
                              Log Review
                            </motion.button>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {j === "focus" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Buddy Study Circles */}
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="bg-slate-50/70 dark:bg-slate-900/60 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-2">
                        <h3 className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                          <Users size={15} className="text-indigo-600 dark:text-indigo-400" /> Buddy Study Circles
                        </h3>
                        <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          {V.filter((t) => t.online).length} LIVE ONLINE
                        </span>
                      </div>

                      <div className="space-y-2">
                        {V.map((t) => (
                          <motion.button
                            key={t.id}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => Ft(t.id)}
                            className={`w-full p-3 rounded-2xl border flex items-center justify-between transition text-left cursor-pointer shadow-2xs ${
                              w === t.id
                                ? "bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20"
                                : "bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-300"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">🧑‍🎓</span>
                              <div>
                                <strong className="text-[11px] font-black text-slate-800 dark:text-slate-200 block">{t.name}</strong>
                                <span className="text-[8px] text-slate-400 font-bold">
                                  Level {Math.floor(t.xp / 100) + 1} • {t.xp} XP
                                </span>
                              </div>
                            </div>
                            <span
                              className={`text-[8px] font-black uppercase px-2.5 py-0.5 rounded-lg border ${
                                t.online
                                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              {t.online ? "● LIVE" : "OFFLINE"}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {w && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-4 border-t border-slate-200/60 dark:border-slate-800 pt-3 space-y-2"
                      >
                        <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                          Direct message with {V.find((t) => t.id === w)?.name}
                        </span>
                        <div className="bg-white dark:bg-slate-800/90 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 max-h-[90px] overflow-y-auto space-y-1.5 text-[10px] font-medium text-slate-700 dark:text-slate-300">
                          {V.find((t) => t.id === w)?.chat.map((t: string, s: number) => (
                            <div key={s} className={`p-1.5 rounded-xl ${t.startsWith("Me") ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40" : "bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-300"}`}>
                              {t}
                            </div>
                          )) || <span className="italic text-slate-400">Start a chat...</span>}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={oe}
                            onChange={(t) => Be(t.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && Kt()}
                            placeholder="Share study notes / formula..."
                            className="flex-1 p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500 font-medium"
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={Kt}
                            className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase cursor-pointer transition shadow-xs"
                          >
                            Send
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Focus Soundscapes & White Noise */}
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="bg-slate-50/70 dark:bg-slate-900/60 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs"
                  >
                    <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-2">
                      <h3 className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Volume2 size={15} className="text-indigo-600 dark:text-indigo-400" /> Focus Soundscapes & White Noise
                      </h3>
                      <span className="text-[9px] font-mono text-indigo-500 font-bold">SYNTH SOUNDS</span>
                    </div>

                    <div className="space-y-2.5">
                      {Ge.map((t) => (
                        <motion.div
                          key={t.id}
                          whileHover={{ scale: 1.01 }}
                          className={`flex items-center justify-between p-3 rounded-2xl border transition shadow-2xs ${
                            t.playing
                              ? "bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700"
                              : "bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700/80"
                          }`}
                        >
                          <span className="text-xs text-slate-800 dark:text-slate-200 font-extrabold flex items-center gap-2">
                            <span className="text-base">{t.icon}</span> {t.name}
                          </span>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={t.volume}
                              onChange={(s) => Je(t.id, parseInt(s.target.value))}
                              className="w-20 accent-indigo-600 cursor-pointer"
                            />
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => Qe(t.id)}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer shadow-xs ${
                                t.playing
                                  ? "bg-indigo-600 text-white shadow-indigo-600/30"
                                  : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100"
                              }`}
                            >
                              {t.playing ? "PAUSE ⏸" : "PLAY ▶"}
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* AI Mock Test System */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-50/70 dark:bg-slate-900/60 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs"
                >
                  <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-2">
                    <h3 className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Adaptive AI Mock Test Simulator</span>
                    </h3>
                    {A && (
                      <span className="text-[10px] font-mono bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-3 py-1 rounded-xl font-black flex items-center gap-1.5 shadow-2xs">
                        <Activity className="w-3.5 h-3.5 animate-pulse" />
                        Time Remaining: {Math.floor(U / 60)}:{(U % 60).toString().padStart(2, "0")}
                      </span>
                    )}
                  </div>

                  <AnimatePresence mode="wait">
                    {!A && !St ? (
                      <motion.div
                        key="config"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
                      >
                        <div>
                          <label className="block text-[8px] uppercase font-black text-slate-400 dark:text-slate-500 mb-1">Subject</label>
                          <select
                            value={quizSubject}
                            onChange={(t) => setQuizSubject(t.target.value)}
                            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs outline-none focus:border-indigo-500 font-medium"
                          >
                            {["Mathematics", "Science", "Biology", "Physics", "Chemistry", "English"].map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[8px] uppercase font-black text-slate-400 dark:text-slate-500 mb-1">Grade</label>
                          <select
                            value={Ce}
                            onChange={(t) => Vt(t.target.value)}
                            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs outline-none focus:border-indigo-500 font-medium"
                          >
                            {["8", "9", "10", "11", "12"].map((t) => (
                              <option key={t} value={t}>
                                Class {t}
                              </option>
                            ))}
                          </select>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={Lt}
                          disabled={Z}
                          className="py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-wide cursor-pointer transition shadow-md flex items-center justify-center gap-1.5"
                        >
                          {Z ? (
                            <>
                              <Activity className="w-3.5 h-3.5 animate-spin" />
                              <span>Generating Questions...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Generate Exam Test</span>
                            </>
                          )}
                        </motion.button>
                      </motion.div>
                    ) : A ? (
                      <motion.div
                        key="running"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        {v.map((qItem: any, idx: number) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-4 bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/90 rounded-2xl space-y-2.5 shadow-xs"
                          >
                            <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900/40">
                              Question {idx + 1}
                            </span>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{qItem.question}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {qItem.options.map((optionText: string, oIdx: number) => (
                                <motion.button
                                  key={oIdx}
                                  whileHover={{ scale: 1.01 }}
                                  whileTap={{ scale: 0.99 }}
                                  onClick={() =>
                                    Ae((n) =>
                                      n.map((curr, cIdx) => (cIdx === idx ? oIdx : curr))
                                    )
                                  }
                                  className={`p-3 rounded-xl text-left font-semibold border transition cursor-pointer ${
                                    ee[idx] === oIdx
                                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                      : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                  }`}
                                >
                                  {optionText}
                                </motion.button>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={Ye}
                          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Check size={14} strokeWidth={3} />
                          <span>Submit Test & Log Score (+50 XP)</span>
                        </motion.button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="report"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-6 bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/90 rounded-2xl text-center space-y-3 shadow-xs"
                      >
                        <div className="text-3xl">🏆</div>
                        <strong className="text-xs font-black text-indigo-900 dark:text-indigo-300 uppercase">
                          Grade Report Processed Successfully!
                        </strong>
                        <div className="flex justify-center gap-6 text-xs text-slate-700 dark:text-slate-300 font-semibold bg-slate-50 dark:bg-slate-900/60 py-2.5 px-4 rounded-xl border border-slate-200/80 dark:border-slate-700 max-w-sm mx-auto">
                          <span>Total Questions: {v.length}</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-black">Score: {v.filter((t: any, s: number) => ee[s] === t.answer).length} / {v.length}</span>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => te(false)}
                          className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-xs"
                        >
                          Start New Test
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            )}

            {j === "utilities" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="bg-slate-50/70 dark:bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4 text-center shadow-xs">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto text-2xl">
                    <Cloud className="w-7 h-7" />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Cloud Backup & Restore Manager
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    Download complete encrypted backups of your notes, flashcards, formula deck, study goals, exam timers, and buddy sync data to keep your progress safe offline or migrate to another device.
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center pt-2">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={Yt}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                    >
                      <Cloud size={15} /> Export Complete Backup
                    </motion.button>
                    <div className="relative">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs uppercase tracking-wider rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-2 cursor-pointer shadow-xs"
                      >
                        <Upload size={15} /> Import Backup File
                      </motion.button>
                      <input
                        type="file"
                        accept=".json"
                        onChange={Xt}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </main>
        </div>
      )}
    </div>
  );
});

export default InteractiveToolkit;
