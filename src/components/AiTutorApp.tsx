import { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  RefreshCw,
  FileDown,
  Images,
  MoreVertical,
  SlidersHorizontal,
  Sparkles,
  Sliders,
  FlaskConical,
  GraduationCap,
  TrendingUp,
  Lightbulb,
  ClipboardList,
  Table,
  Languages,
  Zap,
  HelpCircle,
  Download
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { getStudyAnswer } from '../services/geminiService';
import { exportConversationToPdf } from '../utils/pdfExport';
import { 
  AcademicSuggestion, 
  generateContextualSuggestions, 
  getAiTutorSuggestions 
} from '../services/suggestionEngine';
import {
  ImageFilterType,
  HOMEWORK_IMAGE_FILTERS,
  applyFilterToCanvas
} from '../utils/imageEnhancement';
import type { Subject } from '../types';

interface AiTutorAppProps {
  user: {
    uid: string;
    name: string;
    xp: number;
    level: number;
    avatar?: string;
    schoolName?: string;
    className?: string;
    targetGoal?: string;
  };
  onBack: () => void;
  onAddNote?: (note: { title: string; content: string; subject: string }) => Promise<void>;
  onAddXp?: (amount: number) => void;
  onOpenEditor?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  subject?: string;
  mode?: string;
  image?: string;
  images?: string[];
}

const SUBJECT_LIST: Subject[] = ['Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology', 'English'];

interface SubjectTheme {
  border: string;
  glow: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  botBg: string;
  accentText: string;
  accentBg: string;
  pulseColor: string;
  chipBorder: string;
  chipBg: string;
  chipText: string;
}

const SUBJECT_THEMES: Record<string, SubjectTheme> = {
  Mathematics: {
    border: 'border-blue-500/50 hover:border-blue-400/70',
    glow: 'shadow-blue-950/40 shadow-lg',
    badgeBg: 'bg-blue-950/80',
    badgeText: 'text-blue-300',
    badgeBorder: 'border-blue-500/40',
    botBg: 'bg-blue-600',
    accentText: 'text-blue-400',
    accentBg: 'bg-blue-950/60',
    pulseColor: 'bg-blue-400',
    chipBorder: 'border-blue-700/50',
    chipBg: 'bg-blue-950/60 hover:bg-blue-900/80',
    chipText: 'text-blue-300',
  },
  Science: {
    border: 'border-emerald-500/50 hover:border-emerald-400/70',
    glow: 'shadow-emerald-950/40 shadow-lg',
    badgeBg: 'bg-emerald-950/80',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/40',
    botBg: 'bg-emerald-600',
    accentText: 'text-emerald-400',
    accentBg: 'bg-emerald-950/60',
    pulseColor: 'bg-emerald-400',
    chipBorder: 'border-emerald-700/50',
    chipBg: 'bg-emerald-950/60 hover:bg-emerald-900/80',
    chipText: 'text-emerald-300',
  },
  Physics: {
    border: 'border-purple-500/50 hover:border-purple-400/70',
    glow: 'shadow-purple-950/40 shadow-lg',
    badgeBg: 'bg-purple-950/80',
    badgeText: 'text-purple-300',
    badgeBorder: 'border-purple-500/40',
    botBg: 'bg-purple-600',
    accentText: 'text-purple-400',
    accentBg: 'bg-purple-950/60',
    pulseColor: 'bg-purple-400',
    chipBorder: 'border-purple-700/50',
    chipBg: 'bg-purple-950/60 hover:bg-purple-900/80',
    chipText: 'text-purple-300',
  },
  Chemistry: {
    border: 'border-amber-500/50 hover:border-amber-400/70',
    glow: 'shadow-amber-950/40 shadow-lg',
    badgeBg: 'bg-amber-950/80',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-500/40',
    botBg: 'bg-amber-600',
    accentText: 'text-amber-400',
    accentBg: 'bg-amber-950/60',
    pulseColor: 'bg-amber-400',
    chipBorder: 'border-amber-700/50',
    chipBg: 'bg-amber-950/60 hover:bg-amber-900/80',
    chipText: 'text-amber-300',
  },
  Biology: {
    border: 'border-teal-500/50 hover:border-teal-400/70',
    glow: 'shadow-teal-950/40 shadow-lg',
    badgeBg: 'bg-teal-950/80',
    badgeText: 'text-teal-300',
    badgeBorder: 'border-teal-500/40',
    botBg: 'bg-teal-600',
    accentText: 'text-teal-400',
    accentBg: 'bg-teal-950/60',
    pulseColor: 'bg-teal-400',
    chipBorder: 'border-teal-700/50',
    chipBg: 'bg-teal-950/60 hover:bg-teal-900/80',
    chipText: 'text-teal-300',
  },
  English: {
    border: 'border-rose-500/50 hover:border-rose-400/70',
    glow: 'shadow-rose-950/40 shadow-lg',
    badgeBg: 'bg-rose-950/80',
    badgeText: 'text-rose-300',
    badgeBorder: 'border-rose-500/40',
    botBg: 'bg-rose-600',
    accentText: 'text-rose-400',
    accentBg: 'bg-rose-950/60',
    pulseColor: 'bg-rose-400',
    chipBorder: 'border-rose-700/50',
    chipBg: 'bg-rose-950/60 hover:bg-rose-900/80',
    chipText: 'text-rose-300',
  },
};

function getSubjectTheme(subject?: string): SubjectTheme {
  if (subject && SUBJECT_THEMES[subject]) {
    return SUBJECT_THEMES[subject];
  }
  // Default Indigo / Slate theme
  return {
    border: 'border-indigo-500/50 hover:border-indigo-400/70',
    glow: 'shadow-indigo-950/40 shadow-lg',
    badgeBg: 'bg-indigo-950/80',
    badgeText: 'text-indigo-300',
    badgeBorder: 'border-indigo-500/40',
    botBg: 'bg-indigo-600',
    accentText: 'text-indigo-400',
    accentBg: 'bg-indigo-950/60',
    pulseColor: 'bg-indigo-400',
    chipBorder: 'border-indigo-700/50',
    chipBg: 'bg-indigo-950/60 hover:bg-indigo-900/80',
    chipText: 'text-indigo-300',
  };
}

export interface TutorModeConfig {
  id: 'homework' | 'explain' | 'step' | 'quiz';
  label: string;
  shortLabel: string;
  icon: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  glow: string;
  description: string;
}

export const TUTOR_MODE_CONFIG: Record<'homework' | 'explain' | 'step' | 'quiz', TutorModeConfig> = {
  homework: {
    id: 'homework',
    label: 'Homework Solver',
    shortLabel: 'Homework',
    icon: '⚡',
    badgeBg: 'bg-amber-500/15 hover:bg-amber-500/25',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-500/35',
    glow: 'bg-amber-400',
    description: 'Instant solutions with full steps and formulas'
  },
  step: {
    id: 'step',
    label: 'Step-by-Step Math',
    shortLabel: 'Step Math',
    icon: '📐',
    badgeBg: 'bg-cyan-500/15 hover:bg-cyan-500/25',
    badgeText: 'text-cyan-300',
    badgeBorder: 'border-cyan-500/35',
    glow: 'bg-cyan-400',
    description: 'Pedagogical breakdown with intermediate derivations'
  },
  explain: {
    id: 'explain',
    label: 'Concept Explainer',
    shortLabel: 'Explainer',
    icon: '💡',
    badgeBg: 'bg-emerald-500/15 hover:bg-emerald-500/25',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/35',
    glow: 'bg-emerald-400',
    description: 'Intuitive analogies and real-world examples'
  },
  quiz: {
    id: 'quiz',
    label: 'Practice Quiz',
    shortLabel: 'Quiz Mode',
    icon: '📝',
    badgeBg: 'bg-purple-500/15 hover:bg-purple-500/25',
    badgeText: 'text-purple-300',
    badgeBorder: 'border-purple-500/35',
    glow: 'bg-purple-400',
    description: 'Self-assessment questions to test comprehension'
  }
};

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
 * Helper to split markdown text into logical blocks (paragraphs, code blocks, math equations, lists)
 */
function parseMarkdownBlocks(text: string): string[] {
  if (!text) return [];
  const normalized = text.trim();
  
  // Split on double newlines or standalone math blocks while preserving delimiters
  const rawBlocks = normalized.split(/\n\s*\n+/);
  const blocks: string[] = [];
  
  for (const block of rawBlocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    
    // If a block contains distinct math formulas $$...$$, preserve them
    blocks.push(trimmed);
  }
  
  return blocks.length > 0 ? blocks : [text];
}

/**
 * StaggeredRevealMarkdown renders AI response with a smooth staggered reveal animation,
 * revealing blocks of content (paragraphs, formulas, code snippets) one by one for optimal readability.
 */
const StaggeredRevealMarkdown = memo(function StaggeredRevealMarkdown({
  text,
  isLatest,
}: {
  text: string;
  isLatest?: boolean;
}) {
  const blocks = parseMarkdownBlocks(text);
  const [visibleCount, setVisibleCount] = useState(() => (isLatest ? 1 : blocks.length));
  const isAllRevealed = visibleCount >= blocks.length;

  useEffect(() => {
    if (!isLatest) {
      setVisibleCount(blocks.length);
      return;
    }

    setVisibleCount(1);
    const interval = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= blocks.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 280); // Stagger interval of 280ms per logical paragraph/formula block

    return () => clearInterval(interval);
  }, [text, isLatest, blocks.length]);

  return (
    <div
      className="markdown-body text-xs sm:text-sm text-slate-900 font-normal leading-relaxed space-y-2.5 overflow-x-auto relative group cursor-pointer select-text"
      onClick={() => {
        if (!isAllRevealed) {
          setVisibleCount(blocks.length);
        }
      }}
      title={!isAllRevealed ? "Click to reveal full answer immediately" : undefined}
    >
      {blocks.slice(0, visibleCount).map((block, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 6, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="space-y-1.5"
        >
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              p({ children }) {
                return <p className="mb-2 last:mb-0 leading-relaxed text-slate-900">{children}</p>;
              },
              strong({ children }) {
                return <strong className="font-bold text-slate-900">{children}</strong>;
              },
              code({ node, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                const codeString = String(children).replace(/\n$/, '');
                const isMultiLine = String(children).includes('\n') || !!match;

                if (isMultiLine) {
                  const lang = match ? match[1] : 'code';
                  return (
                    <div className="relative my-2 rounded-xl overflow-hidden border border-slate-300 bg-slate-900 text-left">
                      <div className="bg-slate-800 px-3 py-1.5 flex items-center justify-between text-[10px] text-slate-300 font-mono border-b border-slate-700">
                        <span className="uppercase font-bold text-cyan-400">{lang}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(codeString);
                          }}
                          className="hover:text-white transition font-sans text-[10px] bg-slate-700 hover:bg-slate-600 px-2 py-0.5 rounded-md text-slate-200"
                        >
                          Copy Code
                        </button>
                      </div>
                      <SyntaxHighlighter
                        style={oneDark}
                        language={lang === 'code' ? 'text' : lang}
                        PreTag="div"
                        customStyle={{ margin: 0, padding: '0.75rem', fontSize: '0.75rem', background: '#0f172a' }}
                        {...props}
                      >
                        {codeString}
                      </SyntaxHighlighter>
                    </div>
                  );
                }

                return (
                  <code className="bg-blue-100/80 text-blue-950 px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold border border-blue-200" {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {preprocessLaTeX(block)}
          </ReactMarkdown>
        </motion.div>
      ))}

      {!isAllRevealed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center space-x-1.5 text-[10px] text-blue-600 font-bold pt-1"
        >
          <span className="inline-block w-1.5 h-3 bg-blue-600 animate-pulse rounded-xs" />
          <span>Generating explanation...</span>
          <span className="text-slate-500 font-normal ml-2">(Click anywhere to reveal all)</span>
        </motion.div>
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
  onAddXp,
  onOpenEditor
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

  const [inputQuery, setInputQuery] = useState(() => {
    try {
      return localStorage.getItem(`ai_tutor_input_draft_${user.uid}`) || '';
    } catch {
      return '';
    }
  });
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

  // PDF Export State
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfExportSuccess, setPdfExportSuccess] = useState(false);

  // Mobile More Options (Three-Dots) Menu State
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Suggestion Engine State (3 dynamic academic follow-up questions or study actions)
  const [suggestions, setSuggestions] = useState<AcademicSuggestion[]>(() => {
    return generateContextualSuggestions({
      messages,
      subject: selectedSubject,
      studentContext: {
        name: user.name,
        className: user.className,
        school: user.schoolName,
        targetGoal: user.targetGoal
      },
      tutorMode
    });
  });
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  // Camera & Multiple Image Attachment State
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [flashAnimation, setFlashAnimation] = useState(false);
  const [cameraFilter, setCameraFilter] = useState<ImageFilterType>('none');
  const [filterPreviewImageIndex, setFilterPreviewImageIndex] = useState<number | null>(null);

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

  const handleCapturePhoto = (keepOpen: boolean = false) => {
    if (!videoRef.current) return;
    const dataUrl = applyFilterToCanvas(videoRef.current, cameraFilter);
    if (dataUrl) {
      setSelectedImages((prev) => [...prev, dataUrl]);
      
      // Trigger camera flash visual feedback
      setFlashAnimation(true);
      setTimeout(() => setFlashAnimation(false), 200);

      if (!keepOpen) {
        setShowCameraModal(false);
      }
    }
  };

  const handleApplyFilterToCaptured = (index: number, filterType: ImageFilterType) => {
    const targetImgSrc = selectedImages[index];
    if (!targetImgSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const processed = applyFilterToCanvas(img, filterType);
      if (processed) {
        setSelectedImages((prev) => prev.map((item, i) => i === index ? processed : item));
      }
    };
    img.src = targetImgSrc;
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setSelectedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const rawData = event.target!.result as string;
          // If a filter is actively selected (other than 'none'), apply it to the uploaded image for convenience
          if (cameraFilter !== 'none') {
            const img = new Image();
            img.onload = () => {
              const processed = applyFilterToCanvas(img, cameraFilter);
              setSelectedImages((prev) => [...prev, processed || rawData]);
            };
            img.src = rawData;
          } else {
            setSelectedImages((prev) => [...prev, rawData]);
          }
        }
      };
      reader.readAsDataURL(file);
    });

    setShowCameraModal(false);
    // Reset file input so same file can be re-selected if needed
    e.target.value = '';
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

  // Save input draft to localStorage
  useEffect(() => {
    try {
      const draftKey = `ai_tutor_input_draft_${user.uid}`;
      if (inputQuery.trim()) {
        localStorage.setItem(draftKey, inputQuery);
      } else {
        localStorage.removeItem(draftKey);
      }
    } catch (e) {
      console.error("Error writing input draft to storage", e);
    }
  }, [inputQuery, user.uid]);

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

  // Contextual Suggestion Engine: Dynamically generate 3 academic follow-ups or study actions
  useEffect(() => {
    let isCancelled = false;

    // 1. Instant zero-latency heuristic computation
    const immediateSuggestions = generateContextualSuggestions({
      messages,
      subject: selectedSubject,
      studentContext: {
        name: user.name,
        className: user.className,
        school: user.schoolName,
        targetGoal: user.targetGoal
      },
      tutorMode
    });
    setSuggestions(immediateSuggestions);

    // 2. Async enhancement via backend AI model if active conversation
    if (messages.length > 1) {
      setIsGeneratingSuggestions(true);
      getAiTutorSuggestions({
        messages,
        subject: selectedSubject,
        studentContext: {
          name: user.name,
          className: user.className,
          school: user.schoolName,
          targetGoal: user.targetGoal
        },
        tutorMode
      })
        .then((aiSuggestions) => {
          if (!isCancelled && aiSuggestions && aiSuggestions.length === 3) {
            setSuggestions(aiSuggestions);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!isCancelled) setIsGeneratingSuggestions(false);
        });
    }

    return () => {
      isCancelled = true;
    };
  }, [messages.length, selectedSubject, tutorMode, user.name, user.className, user.schoolName, user.targetGoal]);

  const handleRefreshSuggestions = async () => {
    setIsGeneratingSuggestions(true);
    try {
      const refreshed = await getAiTutorSuggestions({
        messages,
        subject: selectedSubject,
        studentContext: {
          name: user.name,
          className: user.className,
          school: user.schoolName,
          targetGoal: user.targetGoal
        },
        tutorMode
      });
      if (refreshed && refreshed.length === 3) {
        setSuggestions(refreshed);
      }
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const handleSendMessage = async (customText?: string | unknown) => {
    const imagesToSend = [...selectedImages];
    const queryText = typeof customText === 'string' ? customText : inputQuery;
    const cleanQuery = typeof queryText === 'string' ? queryText.trim() : '';
    const effectiveQuery = cleanQuery || (imagesToSend.length > 0 ? `Please solve and explain the homework problem(s) shown in the ${imagesToSend.length > 1 ? `${imagesToSend.length} attached pages` : 'attached image'} step-by-step with full LaTeX formatting and intermediate calculations.` : "");

    if (!effectiveQuery || isLoading) return;

    const userMsgId = 'msg_' + Date.now();
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: effectiveQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subject: selectedSubject,
      mode: tutorMode,
      images: imagesToSend.length > 0 ? imagesToSend : undefined,
      image: imagesToSend.length > 0 ? imagesToSend[0] : undefined
    };

    setMessages((prev) => [...prev, userMsg]);
    if (typeof customText !== 'string') {
      setInputQuery('');
      try {
        localStorage.removeItem(`ai_tutor_input_draft_${user.uid}`);
      } catch (e) {}
    }
    setSelectedImages([]);
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

      const answer = await getStudyAnswer(promptContext, imagesToSend.length > 0 ? imagesToSend : undefined);

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

  const handleExportPdf = async () => {
    if (messages.length === 0 || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      await exportConversationToPdf({
        messages,
        user,
        subject: selectedSubject,
        tutorMode: tutorMode === 'homework' 
          ? 'Homework Solver' 
          : tutorMode === 'step' 
          ? 'Step-by-Step Math' 
          : tutorMode === 'explain' 
          ? 'Concept Explainer' 
          : 'Practice Quiz'
      });
      setPdfExportSuccess(true);
      if (onAddXp) onAddXp(15);
      setTimeout(() => setPdfExportSuccess(false), 3500);
    } catch (error) {
      console.error("PDF Export error:", error);
      alert("Failed to export PDF study guide. Please ensure there are conversation messages.");
    } finally {
      setIsExportingPdf(false);
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
    <div className="fixed inset-0 z-50 bg-[#f8fafc] text-slate-900 flex flex-col font-sans overflow-hidden">
      {/* APP TOP HEADER - MATCHING EXACT DESIGN IN IMAGE */}
      <header className="bg-white border-b border-slate-200/80 px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between shrink-0 shadow-xs z-10">
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <button
            onClick={onBack}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center space-x-1 border border-slate-200 group cursor-pointer"
            title="Back to Ascend Study"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-slate-700" />
            <span className="text-xs font-bold text-slate-700 hidden sm:inline">Back</span>
          </button>

          <div className="flex items-center space-x-2.5">
            {/* LOGO ICON BOX (Navy square with teal A) */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0f172a] shadow-xs flex items-center justify-center text-cyan-400 font-black text-lg tracking-wider shrink-0 select-none border border-slate-800">
              A
            </div>

            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h1 className="text-xs sm:text-sm font-black tracking-tight text-slate-900 uppercase">
                  ASCEND AI TUTOR
                </h1>
                <span className="text-slate-400 font-bold text-xs">v2.5</span>
                
                {/* ONLINE STATUS BADGE */}
                <div className="bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center space-x-1 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Online</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-medium flex items-center space-x-1 mt-0.5">
                <span>Powered by Gemini AI</span>
              </p>
            </div>
          </div>
        </div>

        {/* HEADER RIGHT PROFILE PILLS & CONTROLS */}
        <div className="flex items-center space-x-2">
          {/* PROFILE CONTEXT PILLS (3 PASTEL CAPSULES MATCHING IMAGE) */}
          <div className="hidden md:flex items-center space-x-1.5">
            <div className="bg-[#e0f2fe] border border-[#bae6fd] text-slate-800 text-xs font-semibold px-3 py-1 rounded-full flex items-center space-x-1.5 shadow-2xs">
              <UserIcon className="w-3.5 h-3.5 text-sky-700" />
              <span className="truncate max-w-[110px]">{user.name || 'full Yadav'}</span>
            </div>

            <div className="bg-[#cffafe] border border-[#a5f3fc] text-slate-800 text-xs font-semibold px-3 py-1 rounded-full flex items-center space-x-1.5 shadow-2xs">
              <GraduationCap className="w-3.5 h-3.5 text-cyan-700" />
              <span className="truncate max-w-[130px]">{user.className || 'Class 11th (PCB)'}</span>
            </div>

            <div className="bg-[#ccfbf1] border border-[#99f6e4] text-slate-800 text-xs font-semibold px-3 py-1 rounded-full flex items-center space-x-1.5 shadow-2xs">
              <UserIcon className="w-3.5 h-3.5 text-teal-700" />
              <span className="truncate max-w-[100px]">{user.schoolName || 'chhabra'}</span>
            </div>
          </div>

          {/* CLEAR CHAT BUTTON */}
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
              title="Clear Conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* THREE-DOTS MENU BUTTON */}
          <button
            type="button"
            onClick={() => setShowMoreMenu(true)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition flex items-center justify-center relative shadow-2xs cursor-pointer active:scale-95"
            title="Tools, Modes, Subject & Settings"
          >
            <MoreVertical className="w-4 h-4 text-slate-700" />
          </button>
        </div>
      </header>

      {/* TOAST SUCCESS BANNER FOR PDF EXPORT */}
      {pdfExportSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md z-20"
        >
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-white" />
            <span>Formatted PDF study guide successfully downloaded! Saved for offline study.</span>
          </div>
          <span className="bg-emerald-800 text-emerald-100 text-[10px] px-2 py-0.5 rounded-full font-mono">
            +15 XP Earned
          </span>
        </motion.div>
      )}

      {/* TOP PASTEL COLORFUL ACTION RIBBON (MATCHING EXACT 8 ITEMS IN IMAGE) */}
      <div className="bg-white border-b border-slate-200/80 px-3 sm:px-5 py-2 flex items-center space-x-2 overflow-x-auto no-scrollbar shrink-0 shadow-2xs">
        {/* 1. Subject Selector / Pill: Mint Green */}
        <div className="relative shrink-0">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value as Subject)}
            className="appearance-none bg-[#dcfce7] hover:bg-[#bbf7d0] border border-[#86efac] text-[#15803d] font-bold text-xs pl-8 pr-4 py-1.5 rounded-xl cursor-pointer shadow-2xs transition focus:outline-none"
          >
            {SUBJECT_LIST.map((sub) => (
              <option key={sub} value={sub} className="text-slate-900 bg-white">{sub}</option>
            ))}
          </select>
          <FlaskConical className="w-3.5 h-3.5 text-[#15803d] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* 2. Export PDF: Coral Red */}
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={messages.length === 0 || isExportingPdf}
          className="bg-[#fee2e2] hover:bg-[#fecaca] disabled:opacity-50 border border-[#fca5a5] text-[#b91c1c] font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-2xs transition cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
        >
          {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
          <span>Export PDF</span>
        </button>

        {/* 3. Homework Solver: Peach / Orange */}
        <button
          type="button"
          onClick={() => setTutorMode('homework')}
          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-2xs transition cursor-pointer shrink-0 whitespace-nowrap active:scale-95 ${
            tutorMode === 'homework'
              ? 'bg-[#ffedd5] border-2 border-[#ea580c] text-[#9a3412]'
              : 'bg-[#ffedd5] hover:bg-[#fed7aa] border border-[#fdba74] text-[#c2410c]'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Homework Solver</span>
        </button>

        {/* 4. Step-by-Step Math: Lemon Yellow */}
        <button
          type="button"
          onClick={() => setTutorMode('step')}
          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-2xs transition cursor-pointer shrink-0 whitespace-nowrap active:scale-95 ${
            tutorMode === 'step'
              ? 'bg-[#fef9c3] border-2 border-[#ca8a04] text-[#854d0e]'
              : 'bg-[#fef9c3] hover:bg-[#fef08a] border border-[#fde047] text-[#a16207]'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Step-by-Step Math</span>
        </button>

        {/* 5. Concept Explainer: Sky Blue */}
        <button
          type="button"
          onClick={() => setTutorMode('explain')}
          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-2xs transition cursor-pointer shrink-0 whitespace-nowrap active:scale-95 ${
            tutorMode === 'explain'
              ? 'bg-[#e0f2fe] border-2 border-[#0284c7] text-[#075985]'
              : 'bg-[#e0f2fe] hover:bg-[#bae6fd] border border-[#7dd3fc] text-[#0369a1]'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Concept Explainer</span>
        </button>

        {/* 6. Practice Quiz: Pink / Rose */}
        <button
          type="button"
          onClick={() => setTutorMode('quiz')}
          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-2xs transition cursor-pointer shrink-0 whitespace-nowrap active:scale-95 ${
            tutorMode === 'quiz'
              ? 'bg-[#fce7f3] border-2 border-[#db2777] text-[#9d174d]'
              : 'bg-[#fce7f3] hover:bg-[#fbcfe8] border border-[#f472b6] text-[#be185d]'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          <span>Practice Quiz</span>
        </button>

        {/* 7. JEE Main / Exams: Lavender / Purple */}
        <button
          type="button"
          onClick={() => handleSendMessage(`Give me key high-yield exam insights, formula tricks, and JEE Main / Board questions for ${selectedSubject}.`)}
          className="bg-[#ede9fe] hover:bg-[#ddd6fe] border border-[#c4b5fd] text-[#6d28d9] font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-2xs transition cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>JEE Main / Exams</span>
        </button>

        {/* 8. Download PDF: Cyan / Aqua */}
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={messages.length === 0 || isExportingPdf}
          className="bg-[#cffafe] hover:bg-[#a5f3fc] disabled:opacity-50 border border-[#67e8f9] text-[#0e7490] font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-2xs transition cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download PDF</span>
        </button>
      </div>

      {/* CHAT MESSAGES BODY */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 max-w-4xl mx-auto w-full">
        {messages.length === 0 ? (
          /* EMPTY STATE HERO */
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="h-full flex flex-col items-center justify-center text-center space-y-5 py-8 px-4"
          >
            <motion.div 
              initial={{ scale: 0.8, rotate: -6 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="relative"
            >
              <div className="w-18 h-18 rounded-3xl bg-[#0f172a] flex items-center justify-center text-cyan-400 font-black text-2xl shadow-md border border-slate-800">
                A
              </div>
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-emerald-500 text-[10px] font-black text-white uppercase tracking-wider shadow-xs">
                ONLINE
              </span>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="space-y-1.5 max-w-md"
            >
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Welcome to Ascend AI Tutor, {user.name}! 🚀
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Ask any question in Science, Math, Physics, Chemistry, Biology, or English.
              </p>
            </motion.div>

            {/* QUICK STARTER PROMPTS */}
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.35 }}
              className="w-full max-w-lg space-y-2 text-left pt-2"
            >
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block text-center">
                POPULAR STUDY QUESTIONS:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {QUICK_PROMPTS.map((qp, idx) => {
                  const Icon = qp.icon;
                  return (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSendMessage(qp.prompt)}
                      className="p-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-2xl transition text-left group flex items-start space-x-2.5 shadow-2xs cursor-pointer"
                    >
                      <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-900 group-hover:text-blue-700 block">
                          {qp.label}
                        </span>
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                          {qp.prompt}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        ) : (
          /* MESSAGES LIST */
          messages.map((msg, idx) => {
            const isLatest = idx === messages.length - 1;

            if (msg.sender === 'user') {
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start justify-end space-x-2.5"
                >
                  <div className="flex flex-col items-end max-w-[85%] sm:max-w-[75%] space-y-1">
                    <span className="text-[11px] text-slate-400 font-medium pr-1">
                      {msg.timestamp}
                    </span>
                    <div className="bg-[#e9f5be] border border-[#d9f99d] text-slate-900 rounded-2xl rounded-tr-xs p-3.5 shadow-2xs space-y-2">
                      {msg.images && msg.images.length > 0 ? (
                        <div className={`grid gap-2 ${msg.images.length === 1 ? 'grid-cols-1 max-w-xs' : 'grid-cols-2 max-w-sm'}`}>
                          {msg.images.map((img, i) => (
                            <img key={i} src={img} alt={`Attached ${i + 1}`} className="w-full max-h-48 object-contain rounded-xl border border-slate-300" />
                          ))}
                        </div>
                      ) : msg.image ? (
                        <img src={msg.image} alt="Attached homework" className="w-full max-h-56 object-contain rounded-xl border border-slate-300" />
                      ) : null}
                      <p className="text-xs sm:text-sm text-slate-900 whitespace-pre-wrap leading-relaxed font-medium">
                        {msg.text}
                      </p>
                    </div>
                  </div>

                  {/* USER PROFILE AVATAR */}
                  <div className="w-8 h-8 rounded-full border border-slate-300 shadow-2xs overflow-hidden bg-slate-200 flex items-center justify-center shrink-0 mt-4">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                </motion.div>
              );
            }

            // AI TUTOR MESSAGE
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start space-x-2.5 justify-start"
              >
                {/* BOT AVATAR CIRCLE */}
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-600 shadow-2xs shrink-0 mt-4">
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>

                <div className="flex flex-col items-start max-w-[90%] sm:max-w-[82%] space-y-1.5 w-full">
                  <div className="flex items-center space-x-2 pl-1 text-xs">
                    <span className="font-bold text-slate-900">Al_Tutor</span>
                    <span className="text-slate-400 font-medium">{msg.timestamp}</span>
                  </div>

                  {/* AI RESPONSE BUBBLE */}
                  <div className="bg-[#e0f2fe] border border-[#bae6fd] text-slate-900 rounded-2xl rounded-tl-xs p-4 shadow-2xs space-y-3 w-full">
                    <StaggeredRevealMarkdown text={msg.text} isLatest={isLatest} />

                    {/* VIBRANT ACTION PILL ROW (EXACTLY MATCHING IMAGE 2) */}
                    <div className="pt-2 border-t border-sky-200/80 flex flex-wrap items-center gap-1.5">
                      {/* Copy */}
                      <button
                        type="button"
                        onClick={() => handleCopyText(msg.id, msg.text)}
                        className="bg-[#86efac]/60 hover:bg-[#86efac] border border-[#4ade80] text-[#166534] text-xs font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition shadow-2xs cursor-pointer active:scale-95"
                      >
                        {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-[#166534]" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      {/* Listen */}
                      <button
                        type="button"
                        onClick={() => handleSpeakText(msg.text)}
                        className="bg-[#fca5a5]/60 hover:bg-[#fca5a5] border border-[#f87171] text-[#991b1b] text-xs font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition shadow-2xs cursor-pointer active:scale-95"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Listen</span>
                      </button>

                      {/* Save Note */}
                      {onAddNote && (
                        <button
                          type="button"
                          onClick={() => handleSaveToNotebook(msg)}
                          className="bg-[#fed7aa] hover:bg-[#fdba74] border border-[#fb923c] text-[#9a3412] text-xs font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition shadow-2xs cursor-pointer active:scale-95"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>{savedNoteId === msg.id ? 'Saved! ✓' : 'Save Note'}</span>
                        </button>
                      )}

                      {/* Static badge: Ascend AI Tutor v2.5 */}
                      <span className="bg-[#fef08a] border border-[#facc15] text-[#854d0e] text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs select-none">
                        Ascend AI Tutor v2.5
                      </span>

                      {/* Explain Simpler */}
                      <button
                        type="button"
                        onClick={() => handleSendMessage("Can you explain this concept in simpler terms with a super easy everyday analogy?")}
                        className="bg-[#bae6fd] hover:bg-[#7dd3fc] border border-[#38bdf8] text-[#075985] text-xs font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition shadow-2xs cursor-pointer active:scale-95"
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>Explain Simpler</span>
                      </button>

                      {/* Practice Question */}
                      <button
                        type="button"
                        onClick={() => handleSendMessage("Give me 1 practice question based on this topic so I can test my understanding.")}
                        className="bg-[#fbcfe8] hover:bg-[#f472b6] border border-[#f472b6] text-[#9d174d] text-xs font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition shadow-2xs cursor-pointer active:scale-95"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Practice Question</span>
                      </button>

                      {/* JEE Main / Hinglish */}
                      <button
                        type="button"
                        onClick={() => handleSendMessage("Please explain this in easy Hinglish with important key points for JEE Main / Board exams.")}
                        className="bg-[#ddd6fe] hover:bg-[#c4b5fd] border border-[#a78bfa] text-[#5b21b6] text-xs font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition shadow-2xs cursor-pointer active:scale-95"
                      >
                        <Languages className="w-3.5 h-3.5" />
                        <span>JEE Main / Hinglish</span>
                      </button>

                      {/* Summary Table */}
                      <button
                        type="button"
                        onClick={() => handleSendMessage("Summarize the key concepts, formulas, and takeaways in a clean structured table.")}
                        className="bg-[#a5f3fc] hover:bg-[#67e8f9] border border-[#22d3ee] text-[#155e75] text-xs font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition shadow-2xs cursor-pointer active:scale-95"
                      >
                        <Table className="w-3.5 h-3.5" />
                        <span>Summary Table</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}

        {/* LOADING INDICATOR */}
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start space-x-2.5"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-600 shadow-2xs shrink-0 mt-2">
              <Bot className="w-4 h-4 text-blue-600 animate-spin" />
            </div>
            <div className="bg-[#e0f2fe] border border-[#bae6fd] rounded-2xl rounded-tl-xs p-3.5 shadow-2xs space-y-1.5 max-w-sm">
              <div className="flex items-center space-x-2 text-blue-700 text-xs font-bold">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Ascend AI Tutor is thinking...</span>
              </div>
              <div className="space-y-1 pt-1">
                <div className="h-2 bg-blue-200/80 rounded-full w-3/4 animate-pulse" />
                <div className="h-2 bg-blue-200/60 rounded-full w-1/2 animate-pulse" />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* BOTTOM INPUT DOCK */}
      <footer className="bg-white border-t border-slate-200/80 p-2.5 sm:p-4 shrink-0 relative shadow-2xs">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* SAVED FORMULAS SLIDE-UP PANEL */}
          <AnimatePresence>
            {showSavedFormulasPanel && (
              <motion.div 
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute bottom-full mb-2 left-3 right-3 sm:left-auto sm:right-4 sm:w-96 bg-white border border-amber-300 rounded-2xl p-3 shadow-xl z-30 space-y-2.5"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-bold text-slate-900">Saved Formulas</span>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-amber-200">
                      {savedFormulas.length}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => setShowAddFormulaForm(!showAddFormulaForm)}
                      className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 rounded-lg text-[10px] font-semibold transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Custom</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSavedFormulasPanel(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              {/* ADD FORMULA FORM */}
              {showAddFormulaForm && (
                <form onSubmit={handleAddFormula} className="bg-slate-50 border border-amber-200 p-2.5 rounded-xl space-y-2">
                  <input
                    type="text"
                    placeholder="Formula Name (e.g. Newton's 2nd Law)"
                    value={newFormulaName}
                    onChange={(e) => setNewFormulaName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    placeholder="LaTeX Code (e.g. F = ma or \int x^2 dx)"
                    value={newFormulaLatex}
                    onChange={(e) => setNewFormulaLatex(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-amber-700 font-mono placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
                  />

                  {/* PREVIEW */}
                  {newFormulaLatex.trim() && (
                    <div className="p-1.5 bg-white border border-slate-200 rounded-lg text-center overflow-x-auto text-xs text-slate-900">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {`$${newFormulaLatex.trim()}$`}
                      </ReactMarkdown>
                    </div>
                  )}

                  <div className="flex items-center justify-end space-x-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddFormulaForm(false)}
                      className="px-2 py-1 text-[10px] text-slate-500 hover:text-slate-700 rounded-md font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newFormulaLatex.trim()}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold text-[10px] rounded-lg transition cursor-pointer"
                    >
                      Save Formula
                    </button>
                  </div>
                </form>
              )}

              {/* FORMULAS LIST */}
              <div className="space-y-1.5 max-h-52 overflow-y-auto no-scrollbar pr-0.5">
                {savedFormulas.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs font-medium">
                    No saved formulas yet. Click "+ Add Custom" or save math snippets!
                  </div>
                ) : (
                  savedFormulas.map((f) => (
                    <div
                      key={f.id}
                      className="group bg-slate-50 hover:bg-slate-100 border border-slate-200 p-2 rounded-xl transition flex items-center justify-between space-x-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-slate-500 truncate">{f.name}</div>
                        <div className="text-xs text-slate-900 overflow-x-auto py-0.5 no-scrollbar font-mono">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {`$${f.latex}$`}
                          </ReactMarkdown>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleInsertFormula(f.latex)}
                          className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-[10px] font-bold transition cursor-pointer"
                          title="Insert into chat input"
                        >
                          Insert
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyFormula(f.id, f.latex)}
                          className="p-1 bg-white hover:bg-slate-200 text-slate-600 rounded-lg transition border border-slate-200 cursor-pointer"
                          title="Copy LaTeX"
                        >
                          {copiedFormulaId === f.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteFormula(f.id)}
                          className="p-1 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition border border-slate-200 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

          {/* MATH & LATEX SYMBOLS POPUP PALETTE */}
          <AnimatePresence>
            {showMathPalette && (
              <motion.div 
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute bottom-full mb-2 left-3 right-3 sm:left-auto sm:right-4 sm:w-96 bg-white border border-slate-200 rounded-2xl p-3 shadow-xl z-30 space-y-2.5"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                    <Variable className="w-3.5 h-3.5 text-blue-600" />
                    <span>Math & LaTeX Symbols</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowMathPalette(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
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
                      className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                        activeMathCategory === cat
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900'
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
                      className="p-2 bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold transition flex items-center justify-center shadow-2xs active:scale-95 cursor-pointer"
                      title={sym.value}
                    >
                      {sym.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ATTACHED IMAGES PREVIEW CAROUSEL / STRIP */}
          <AnimatePresence>
            {selectedImages.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="bg-blue-50 border border-blue-200 p-2.5 rounded-2xl text-xs text-blue-900 shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 font-bold text-slate-900 text-[11px]">
                    <Images className="w-3.5 h-3.5 text-blue-600" />
                    <span>{selectedImages.length} {selectedImages.length === 1 ? 'Page Attached' : 'Pages Attached'}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setShowCameraModal(true)}
                      className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-2 py-0.5 rounded-md flex items-center space-x-1 transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Page</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedImages([])}
                      className="text-[10px] text-slate-500 hover:text-rose-600 px-1.5 py-0.5 rounded-md hover:bg-white transition cursor-pointer"
                    >
                      Clear all
                    </button>
                  </div>
                </div>

                {/* THUMBNAIL STRIP */}
                <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
                  {selectedImages.map((img, idx) => (
                    <motion.div 
                      key={idx} 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="relative group shrink-0"
                    >
                      <img
                        src={img}
                        alt={`Page ${idx + 1}`}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-300 shadow-2xs bg-white"
                      />
                      <span className="absolute bottom-1 left-1 px-1 py-0.2 bg-slate-900/80 backdrop-blur-xs text-[8px] font-black text-white rounded">
                        P{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow-md transition cursor-pointer"
                        title="Remove page"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* QUICK DYNAMIC ACADEMIC SUGGESTIONS */}
          {suggestions.length > 0 && (
            <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-0.5 text-[11px]">
              <button
                type="button"
                onClick={handleRefreshSuggestions}
                disabled={isGeneratingSuggestions}
                className="flex items-center space-x-1 shrink-0 text-slate-500 hover:text-blue-600 px-1.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition"
                title="Refresh suggested study prompts"
              >
                <Sparkles className={`w-3 h-3 text-blue-600 ${isGeneratingSuggestions ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Suggestions</span>
              </button>
              {suggestions.map((sugg, idx) => (
                <button
                  key={sugg.id || idx}
                  type="button"
                  onClick={() => handleSendMessage(sugg.prompt)}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-full font-medium whitespace-nowrap transition flex items-center space-x-1 shrink-0 cursor-pointer text-[10px] sm:text-[11px] shadow-2xs"
                  title={sugg.prompt}
                >
                  <span>{sugg.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* MAIN CHAT INPUT BAR */}
          <div className="relative flex items-center bg-[#f8fafc] border border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 rounded-2xl p-1.5 transition shadow-2xs">
            <button
              type="button"
              onClick={handleVoiceInputToggle}
              className={`p-2 sm:p-2.5 rounded-xl transition cursor-pointer ${
                isListening 
                  ? 'bg-rose-600 text-white animate-bounce' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
              }`}
              title={isListening ? "Listening... Click to stop" : "Voice Input"}
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* CAMERA INTEGRATION BUTTON */}
            <button
              type="button"
              onClick={() => setShowCameraModal(true)}
              className={`p-2 sm:p-2.5 rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer ${
                selectedImages.length > 0 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
              title="Snap or Upload Homework Assignment Pages"
            >
              <div className="relative">
                <Camera className="w-4 h-4" />
                {selectedImages.length > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-white text-emerald-700 text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-xs">
                    {selectedImages.length}
                  </span>
                )}
              </div>
            </button>

            {/* DESKTOP MATH SYMBOLS BUTTON */}
            <button
              type="button"
              onClick={() => {
                setShowMathPalette(!showMathPalette);
                if (showSavedFormulasPanel) setShowSavedFormulasPanel(false);
              }}
              className={`hidden sm:flex p-2 rounded-xl transition font-mono text-[11px] font-black items-center justify-center shrink-0 cursor-pointer ${
                showMathPalette 
                  ? 'bg-blue-600 text-white' 
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
              title="Insert Math Symbols & LaTeX"
            >
              <span>f(x)</span>
            </button>

            {/* DESKTOP FORMULAS BUTTON */}
            <button
              type="button"
              onClick={() => {
                setShowSavedFormulasPanel(!showSavedFormulasPanel);
                if (showMathPalette) setShowMathPalette(false);
              }}
              className={`hidden sm:flex p-2 rounded-xl transition text-[11px] font-bold items-center space-x-1 shrink-0 cursor-pointer ${
                showSavedFormulasPanel 
                  ? 'bg-amber-500 text-white font-extrabold shadow-xs' 
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
              title="Saved Formulas & Equations"
            >
              <Bookmark className="w-3.5 h-3.5 fill-current" />
              <span className="text-[10px]">Formulas</span>
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
                  : selectedImages.length > 0 
                  ? `${selectedImages.length} page(s) attached! Press Send...` 
                  : `Ask AI Tutor about ${selectedSubject}...`
              }
              className="flex-1 bg-transparent border-0 px-2.5 sm:px-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none max-h-24 py-2 font-medium"
            />

            {inputQuery.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setInputQuery('');
                  try {
                    localStorage.removeItem(`ai_tutor_input_draft_${user.uid}`);
                  } catch (e) {}
                  textareaRef.current?.focus();
                }}
                className="p-2 sm:p-2.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-xl transition flex items-center justify-center shrink-0 mr-1 cursor-pointer"
                title="Clear Input"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={(!inputQuery.trim() && selectedImages.length === 0) || isLoading}
              className="p-2.5 sm:p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center shrink-0 cursor-pointer active:scale-95"
              title="Send Message"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-medium">
            <div className="flex items-center space-x-2">
              <span>Subject: <strong className="text-slate-700">{selectedSubject}</strong></span>
              {inputQuery.trim().length > 0 && (
                <span className="text-[9px] text-emerald-700 font-semibold flex items-center space-x-1 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Draft saved</span>
                </span>
              )}
            </div>
            <span className="hidden sm:inline">Shift + Enter for new line • Enter to send</span>
          </div>
        </div>

      {/* HIDDEN FILE INPUT FOR CAMERA/IMAGE FALLBACK - SUPPORTS MULTIPLE */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        multiple
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* THREE-DOTS (MORE OPTIONS & TOOLS) MODAL / BOTTOM SHEET */}
      <AnimatePresence>
        {showMoreMenu && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowMoreMenu(false)}
          >
            <motion.div 
              initial={{ y: "100%", opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full sm:max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              {/* SHEET HEADER */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-white tracking-wide uppercase">AI Tutor Tools & Settings</h3>
                    <p className="text-[10px] text-slate-400">Switch mode, subject, or open math tools</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMoreMenu(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* SUBJECT SELECTION */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Select Subject
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {SUBJECT_LIST.map((sub) => {
                    const theme = getSubjectTheme(sub);
                    const isSelected = selectedSubject === sub;
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => {
                          setSelectedSubject(sub);
                        }}
                        className={`p-2 rounded-xl text-xs font-bold transition flex items-center justify-center border text-center ${
                          isSelected
                            ? `${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder} shadow-sm ring-1 ring-indigo-400/30`
                            : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
                        }`}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TUTOR MODE SELECTION */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Tutor Mode
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'homework', label: '⚡ Homework Solver', desc: 'Step-by-step complete solutions' },
                    { id: 'step', label: '📐 Step Math', desc: 'Detailed mathematical breakdown' },
                    { id: 'explain', label: '💡 Explainer', desc: 'Concepts with easy analogies' },
                    { id: 'quiz', label: '📝 Practice Quiz', desc: 'Custom 3-question testing quiz' },
                    { id: 'editor', label: '⚡ Editor (Cinematic HUD)', desc: 'Voice/text app controller & notes creator' }
                  ].map((m) => {
                    const isSelected = tutorMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          if (m.id === 'editor') {
                            setShowMoreMenu(false);
                            if (onOpenEditor) onOpenEditor();
                          } else {
                            setTutorMode(m.id as any);
                          }
                        }}
                        className={`p-2.5 rounded-2xl text-left border transition ${
                          m.id === 'editor'
                            ? 'col-span-2 bg-gradient-to-r from-cyan-950 to-indigo-950 border-cyan-500/60 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:border-cyan-400'
                            : isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="text-xs font-bold flex items-center justify-between">
                          <span>{m.label}</span>
                          {m.id === 'editor' && (
                            <span className="text-[8px] bg-cyan-400 text-slate-950 font-black px-1.5 py-0.5 rounded-full uppercase">
                              NEW
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">{m.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* MATH & SCIENCE TOOLS */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Math & Formula Tools
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      setShowMathPalette(true);
                      setShowSavedFormulasPanel(false);
                    }}
                    className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-2xl transition text-left flex items-center space-x-2.5"
                  >
                    <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
                      <Variable className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">LaTeX Palette</span>
                      <span className="text-[9px] text-slate-400">Insert math symbols</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      setShowSavedFormulasPanel(true);
                      setShowMathPalette(false);
                    }}
                    className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-2xl transition text-left flex items-center space-x-2.5"
                  >
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                      <Bookmark className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Saved Formulas</span>
                      <span className="text-[9px] text-slate-400">Quick formula book</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* CHAT ACTIONS */}
              <div className="space-y-2 pt-1 border-t border-slate-800">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Actions
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      handleExportPdf();
                    }}
                    disabled={messages.length === 0 || isExportingPdf}
                    className="flex-1 p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2"
                  >
                    {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                    <span>Export Study PDF</span>
                  </button>

                  {messages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMoreMenu(false);
                        handleClearChat();
                      }}
                      className="p-2.5 bg-slate-800 hover:bg-rose-950/80 text-rose-400 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              {/* STUDENT CONTEXT CARD */}
              <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-2xl text-[11px] text-slate-300 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">👤 {user.name}</span>
                  {user.className && <span className="text-indigo-400 font-mono text-[10px]">{user.className}</span>}
                </div>
                {user.schoolName && <div className="text-slate-400 text-[10px] truncate">🏫 {user.schoolName}</div>}
                {user.targetGoal && <div className="text-amber-300 text-[10px]">🎯 Goal: {user.targetGoal}</div>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CAMERA CAPTURE MODAL OVERLAY - WITH MULTI-PAGE SEQUENCE SUPPORT */}
      <AnimatePresence>
        {showCameraModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col space-y-3 p-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white tracking-wide uppercase">
                      Capture Homework Pages {selectedImages.length > 0 && `(${selectedImages.length} captured)`}
                    </h3>
                    <p className="text-[10px] text-slate-400">Position page in the frame. Snap multiple pages in sequence!</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCameraModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* IMAGE ENHANCEMENT FILTERS MENU */}
              <div className="space-y-1.5 bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-300">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Readability Filters</span>
                  </div>
                  <span className="text-[9px] font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                    {HOMEWORK_IMAGE_FILTERS.find(f => f.id === cameraFilter)?.label || 'Normal'}
                  </span>
                </div>

                {/* FILTER PRESETS HORIZONTAL SCROLLER */}
                <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {HOMEWORK_IMAGE_FILTERS.map((f) => {
                    const isSelected = cameraFilter === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setCameraFilter(f.id)}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center space-x-1.5 shrink-0 border cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm shadow-indigo-600/30'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-xs">{f.emoji}</span>
                        <span className="whitespace-nowrap">{f.shortLabel}</span>
                        {f.badge && (
                          <span className={`text-[8px] uppercase tracking-wider px-1 py-0.2 rounded font-black ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-300'
                          }`}>
                            {f.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* CURRENT FILTER DESCRIPTION HINT */}
                <div className="text-[10px] text-slate-400 flex items-center space-x-1 pt-0.5">
                  <span className="text-indigo-400 font-semibold shrink-0">Preview:</span>
                  <span className="truncate">
                    {HOMEWORK_IMAGE_FILTERS.find(f => f.id === cameraFilter)?.description}
                  </span>
                </div>
              </div>

              {/* LIVE CAMERA VIEWPORT */}
              <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-4/3 flex items-center justify-center border border-slate-800 shadow-inner">
                {/* FLASH ANIMATION EFFECT */}
                {flashAnimation && (
                  <div className="absolute inset-0 bg-white/70 z-20 pointer-events-none animate-out fade-out duration-200" />
                )}

                {cameraError ? (
                  <div className="text-center p-6 space-y-3">
                    <div className="p-3 bg-rose-500/10 text-rose-400 rounded-full w-fit mx-auto border border-rose-500/20">
                      <Camera className="w-8 h-8" />
                    </div>
                    <p className="text-xs text-rose-300 font-medium max-w-xs mx-auto">{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 mx-auto shadow-md cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Choose Images from Device</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        filter: HOMEWORK_IMAGE_FILTERS.find(f => f.id === cameraFilter)?.cssFilter || 'none'
                      }}
                      className="w-full h-full object-cover transition-[filter] duration-200"
                    />

                    {/* TOP QUICK FILTER BADGE & CYCLER */}
                    <div className="absolute top-3 right-3 z-10">
                      <button
                        type="button"
                        onClick={() => {
                          const filterIds: ImageFilterType[] = ['none', 'document', 'grayscale', 'contrast', 'brighten'];
                          const currentIdx = filterIds.indexOf(cameraFilter);
                          const nextIdx = (currentIdx + 1) % filterIds.length;
                          setCameraFilter(filterIds[nextIdx]);
                        }}
                        className="bg-slate-950/80 hover:bg-slate-900 text-slate-200 text-[10px] font-bold px-2.5 py-1 rounded-full border border-indigo-500/30 backdrop-blur-md flex items-center space-x-1 shadow-md transition cursor-pointer"
                        title="Tap to cycle readability filters"
                      >
                        <span>{HOMEWORK_IMAGE_FILTERS.find(f => f.id === cameraFilter)?.emoji}</span>
                        <span>{HOMEWORK_IMAGE_FILTERS.find(f => f.id === cameraFilter)?.shortLabel}</span>
                        <RefreshCw className="w-2.5 h-2.5 text-indigo-400 ml-0.5" />
                      </button>
                    </div>

                    {/* VIEWPORT SCANNING GUIDELINE */}
                    <div className="absolute inset-5 border-2 border-dashed border-indigo-400/60 rounded-2xl pointer-events-none flex flex-col items-center justify-between p-3">
                      <span className="bg-slate-950/80 text-indigo-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-indigo-500/30 backdrop-blur-xs">
                        Page {selectedImages.length + 1}
                      </span>
                      <span className="text-[10px] text-slate-300 bg-slate-950/80 px-2.5 py-1 rounded-full border border-slate-700/60 backdrop-blur-xs">
                        {cameraFilter !== 'none' ? `Filter: ${HOMEWORK_IMAGE_FILTERS.find(f => f.id === cameraFilter)?.label}` : 'Align text & equations in frame'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* SEQUENCE THUMBNAILS & PER-PAGE FILTER SELECTOR IN MODAL */}
              {selectedImages.length > 0 && (
                <div className="space-y-1.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                    <span className="font-bold">Captured Pages ({selectedImages.length}):</span>
                    <span className="text-[9px] text-indigo-300">Tap page to apply filter</span>
                  </div>
                  <div className="flex items-center space-x-2 overflow-x-auto py-0.5">
                    {selectedImages.map((img, idx) => (
                      <div key={idx} className="relative shrink-0 group">
                        <button
                          type="button"
                          onClick={() => setFilterPreviewImageIndex(filterPreviewImageIndex === idx ? null : idx)}
                          className="focus:outline-none cursor-pointer"
                        >
                          <img 
                            src={img} 
                            alt={`Page ${idx + 1}`} 
                            className={`w-12 h-12 rounded-lg object-cover border transition ${
                              filterPreviewImageIndex === idx 
                                ? 'border-indigo-400 ring-2 ring-indigo-500/50 scale-105' 
                                : 'border-indigo-500/40 hover:border-indigo-400'
                            }`} 
                          />
                        </button>
                        <span className="absolute bottom-0.5 left-0.5 bg-slate-950/90 text-white text-[8px] font-bold px-1 rounded pointer-events-none">
                          P{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (filterPreviewImageIndex === idx) setFilterPreviewImageIndex(null);
                            handleRemoveImage(idx);
                          }}
                          className="absolute -top-1 -right-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-0.5 shadow transition cursor-pointer"
                          title="Remove image"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* QUICK FILTER CHANGER FOR SELECTED THUMBNAIL */}
                  {filterPreviewImageIndex !== null && selectedImages[filterPreviewImageIndex] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-1.5 border-t border-slate-800 flex items-center space-x-1.5 overflow-x-auto no-scrollbar"
                    >
                      <span className="text-[9px] text-slate-400 font-bold shrink-0">Enhance P{filterPreviewImageIndex + 1}:</span>
                      {HOMEWORK_IMAGE_FILTERS.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => handleApplyFilterToCaptured(filterPreviewImageIndex!, f.id)}
                          className="px-2 py-0.5 bg-slate-900 hover:bg-indigo-900/60 text-slate-300 hover:text-indigo-200 border border-slate-800 hover:border-indigo-500/50 rounded-lg text-[9px] font-semibold whitespace-nowrap transition cursor-pointer"
                        >
                          {f.emoji} {f.shortLabel}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              )}

              {/* CAMERA ACTION CONTROLS */}
              <div className="flex items-center justify-between pt-1 gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 border border-slate-700/60 shrink-0 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span>Upload</span>
                </button>

                {!cameraError && (
                  <div className="flex items-center space-x-2 flex-1 justify-end">
                    <button
                      type="button"
                      onClick={() => setCameraFacing(prev => prev === 'environment' ? 'user' : 'environment')}
                      className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700/60 cursor-pointer"
                      title="Flip Camera"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>

                    {/* SNAP & ADD NEXT PAGE (KEEP CAMERA OPEN) */}
                    <button
                      type="button"
                      onClick={() => handleCapturePhoto(true)}
                      className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border border-indigo-500/40 active:scale-95 cursor-pointer"
                      title="Capture this page with active filter and snap next page"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Snap & Add Next</span>
                    </button>

                    {/* SNAP & FINISH */}
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedImages.length > 0) {
                          setShowCameraModal(false);
                        } else {
                          handleCapturePhoto(false);
                        }
                      }}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition flex items-center space-x-1.5 shadow-lg shadow-indigo-600/30 active:scale-95 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>{selectedImages.length > 0 ? `Done (${selectedImages.length})` : 'Capture'}</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  </div>
);
});

export default AiTutorApp;
