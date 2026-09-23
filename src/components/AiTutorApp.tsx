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
  MoreHorizontal,
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
  ChevronDown,
  ChevronUp,
  Type,
  FolderOpen
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeHighlighter = SyntaxHighlighter as any;
import { getStudyAnswer } from '../services/geminiService';
import { createGoogleDoc, authorizeGoogleService, getSavedToken, removeToken, fetchDriveFiles, fetchFileContent } from '../services/googleWorkspace';
import { exportConversationToPdf } from '../utils/pdfExport';
import { showToast } from './Toast';
import { parseError, logError } from '../utils/errorHandler';
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
import { playTutorSpeech } from '../services/voiceSettings';
import { CustomVoiceModal } from './CustomVoiceModal';

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
  attachedWorkspaceFiles?: Array<{ id: string; name: string; content: string; type: "drive" | "classroom" | "sheets" }>;
  onRemoveAttachedWorkspaceFile?: (id: string) => void;
  globalAppLanguage?: string;
  onLanguageChange?: (lang: any) => void;
  isBottomNavVisible?: boolean;
  onShowBottomNav?: () => void;
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

const getStoredValue = (key: string, fallback = ''): string => {
  if (typeof window === 'undefined') return fallback;
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

const setStoredValue = (key: string, value: string | null) => {
  if (typeof window === 'undefined') return;
  try {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Ignore storage failures gracefully in restricted browser contexts.
  }
};

const getAppLanguage = (language: string): 'en' | 'hi' => {
  const normalized = language.toLowerCase();
  return normalized === 'hindi' || normalized === 'hinglish' || normalized === 'hi' ? 'hi' : 'en';
};

const safeClipboardWrite = async (value: string) => {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return false;
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
};

function preprocessLaTeX(content: string): string {
  if (!content) return '';
  return content
    .replace(/\\\[([\s\S]*?)\\\]/g, (_match, math) => `\n$$\n${math.trim()}\n$$\n`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_match, math) => `$${math.trim()}$`);
}

function parseMarkdownBlocks(text: string): string[] {
  if (!text) return [];
  const normalized = text.trim();
  const rawBlocks = normalized.split(/\n\s*\n+/);
  const blocks: string[] = [];

  for (const block of rawBlocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    blocks.push(trimmed);
  }

  return blocks.length > 0 ? blocks : [text];
}

const StaggeredRevealMarkdown = memo(function StaggeredRevealMarkdown({
  text,
  isLatest,
  fontStyle = 'classic',
}: {
  text: string;
  isLatest?: boolean;
  fontStyle?: 'classic' | 'modern';
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
    }, 280);

    return () => clearInterval(interval);
  }, [text, isLatest, blocks.length]);

  const isClassic = fontStyle === 'classic';

  return (
    <div
      className={`markdown-body select-text w-full ${isClassic ? 'tutor-editorial font-serif' : 'tutor-modern font-sans'} text-slate-900 leading-relaxed space-y-2.5 overflow-x-auto relative group cursor-pointer`}
      onClick={() => {
        if (!isAllRevealed) {
          setVisibleCount(blocks.length);
        }
      }}
      title={!isAllRevealed ? 'Click to reveal full answer immediately' : undefined}
    >
      {blocks.slice(0, visibleCount).map((block, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 6, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="space-y-1.5"
        >
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              h1({ children }) {
                return (
                  <h1 className={`font-bold text-slate-950 mt-5 mb-2.5 pb-1.5 border-b border-slate-200/80 tracking-tight ${isClassic ? 'font-serif text-[1.35rem] sm:text-[1.5rem]' : 'font-sans text-xl sm:text-2xl'}`}>
                    {children}
                  </h1>
                );
              },
              h2({ children }) {
                return (
                  <h2 className={`font-bold text-slate-900 mt-4 mb-2 tracking-tight flex items-center gap-2 ${isClassic ? 'font-serif text-[1.18rem] sm:text-[1.28rem]' : 'font-sans text-lg sm:text-xl'}`}>
                    {children}
                  </h2>
                );
              },
              h3({ children }) {
                return (
                  <h3 className={`font-bold text-slate-800 mt-3.5 mb-1.5 tracking-tight ${isClassic ? 'font-serif text-[1.05rem] sm:text-[1.12rem]' : 'font-sans text-base sm:text-lg'}`}>
                    {children}
                  </h3>
                );
              },
              p({ children }) {
                return (
                  <p className={`mb-3 last:mb-0 leading-[1.82] ${isClassic ? 'font-serif text-[15.5px] sm:text-[16.5px] text-slate-900' : 'font-sans text-sm sm:text-[15px] text-slate-800'}`}>
                    {children}
                  </p>
                );
              },
              ul({ children }) {
                return (
                  <ul className={`my-3 space-y-1.5 pl-5 list-disc marker:text-indigo-600 leading-[1.78] ${isClassic ? 'font-serif text-[15px] sm:text-[16px]' : 'font-sans text-sm sm:text-[15px]'}`}>
                    {children}
                  </ul>
                );
              },
              ol({ children }) {
                return (
                  <ol className={`my-3 space-y-1.5 pl-5 list-decimal marker:text-indigo-600 font-semibold leading-[1.78] ${isClassic ? 'font-serif text-[15px] sm:text-[16px]' : 'font-sans text-sm sm:text-[15px]'}`}>
                    {children}
                  </ol>
                );
              },
              li({ children }) {
                return (
                  <li className={`text-slate-800 mb-1 ${isClassic ? 'font-serif' : 'font-sans'}`}>
                    {children}
                  </li>
                );
              },
              blockquote({ children }) {
                return (
                  <blockquote className="my-4 pl-4 py-2.5 border-l-[3.5px] border-indigo-500 bg-indigo-50/40 rounded-r-xl text-slate-700 italic font-serif text-[15px] sm:text-[16px]">
                    {children}
                  </blockquote>
                );
              },
              table({ children }) {
                return (
                  <div className="my-4 overflow-x-auto rounded-xl border border-slate-200/90 shadow-xs">
                    <table className={`w-full text-left text-xs sm:text-sm ${isClassic ? 'font-serif' : 'font-sans'}`}>
                      {children}
                    </table>
                  </div>
                );
              },
              th({ children }) {
                return (
                  <th className="bg-slate-100/90 text-slate-900 font-bold px-3.5 py-2.5 border-b border-slate-200">
                    {children}
                  </th>
                );
              },
              td({ children }) {
                return (
                  <td className="px-3.5 py-2.5 border-b border-slate-100 text-slate-800">
                    {children}
                  </td>
                );
              },
              strong({ children }) {
                return <strong className="font-bold text-slate-950">{children}</strong>;
              },
              code({ node, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                const codeString = String(children).replace(/\n$/, '');
                const isMultiLine = String(children).includes('\n') || !!match;

                if (isMultiLine) {
                  const lang = match ? match[1] : 'code';
                  return (
                    <div className="relative my-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 text-left shadow-md">
                      <div className="bg-slate-900 px-3.5 py-2 flex items-center justify-between text-[11px] text-slate-300 font-mono border-b border-slate-800">
                        <span className="uppercase font-bold text-cyan-400">{lang}</span>
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await safeClipboardWrite(codeString);
                          }}
                          className="hover:text-white transition font-sans text-[11px] bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-md text-slate-200 cursor-pointer"
                        >
                          Copy Code
                        </button>
                      </div>
                      <CodeHighlighter
                        style={oneDark}
                        language={lang === 'code' ? 'text' : lang}
                        PreTag="div"
                        customStyle={{ margin: 0, padding: '1rem', fontSize: '0.8rem', background: '#020617' }}
                        {...props}
                      >
                        {codeString}
                      </CodeHighlighter>
                    </div>
                  );
                }

                return (
                  <code className="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded-md font-mono text-[12px] font-semibold border border-slate-200/80" {...props}>
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
          className="flex items-center space-x-2 text-xs text-indigo-600 font-bold pt-1.5"
        >
          <span className="inline-block w-2 h-3.5 bg-indigo-600 animate-pulse rounded-xs" />
          <span>Generating explanation...</span>
          <span className="text-slate-400 font-normal text-xs ml-2">(Click anywhere to reveal all)</span>
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
  { id: 'f4', name: "Euler's Identity", latex: 'e^{i\\pi} + 1 = 0' },
  { id: 'f5', name: 'Area of Circle', latex: 'A = \\pi r^2' },
  { id: 'f6', name: 'Kinetic Energy', latex: 'K = \\frac{1}{2}mv^2' },
];

export const AiTutorApp = memo(function AiTutorApp({
  user,
  onBack,
  onAddNote,
  onAddXp,
  attachedWorkspaceFiles = [],
  onRemoveAttachedWorkspaceFile,
  globalAppLanguage,
  onLanguageChange,
  isBottomNavVisible = true,
  onShowBottomNav
}: AiTutorAppProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = getStoredValue(`ai_tutor_chat_${user.uid}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing saved tutor chat', e);
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

  const [inputQuery, setInputQuery] = useState(() => getStoredValue(`ai_tutor_input_draft_${user.uid}`));
  const [selectedSubject, setSelectedSubject] = useState<Subject>('Science');
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => getStoredValue(`ai_tutor_language_${user.uid}`, 'Hinglish'));
  const [tutorMode, setTutorMode] = useState<'homework' | 'explain' | 'step' | 'quiz'>('homework');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);
  const [expandedActionsId, setExpandedActionsId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [showMathPalette, setShowMathPalette] = useState(false);
  const [activeMathCategory, setActiveMathCategory] = useState<'All' | 'Greek' | 'Algebra' | 'Operators' | 'Calculus'>('All');
  const [showQuickActionsMenu, setShowQuickActionsMenu] = useState(false);
  const quickActionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (quickActionsMenuRef.current && !quickActionsMenuRef.current.contains(event.target as Node)) {
        setShowQuickActionsMenu(false);
      }
    }
    if (showQuickActionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showQuickActionsMenu]);

  const appLanguage = getAppLanguage(selectedLanguage);

  useEffect(() => {
    if (globalAppLanguage) {
      const mapped: Record<string, string> = {
        'en': 'English',
        'hi': 'Hindi',
        'hinglish': 'Hinglish',
        'marathi': 'Marathi',
        'tamil': 'Tamil',
        'bengali': 'Bengali'
      };
      const matchingVal = mapped[globalAppLanguage];
      if (matchingVal && matchingVal !== selectedLanguage) {
        setSelectedLanguage(matchingVal);
      }
    }
  }, [globalAppLanguage]);

  const [savedFormulas, setSavedFormulas] = useState<SavedFormula[]>(() => {
    const saved = getStoredValue(`saved_formulas_${user.uid}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved formulas', e);
      }
    }
    return DEFAULT_SAVED_FORMULAS;
  });
  const [showSavedFormulasPanel, setShowSavedFormulasPanel] = useState(false);
  const [tutorFontStyle, setTutorFontStyle] = useState<'classic' | 'modern'>(() => {
    try {
      return (localStorage.getItem('ai_tutor_font_style') as 'classic' | 'modern') || 'classic';
    } catch {
      return 'classic';
    }
  });

  const toggleTutorFontStyle = () => {
    const next = tutorFontStyle === 'classic' ? 'modern' : 'classic';
    setTutorFontStyle(next);
    try {
      localStorage.setItem('ai_tutor_font_style', next);
    } catch {}
  };
  const [newFormulaName, setNewFormulaName] = useState('');
  const [newFormulaLatex, setNewFormulaLatex] = useState('');
  const [showAddFormulaForm, setShowAddFormulaForm] = useState(false);
  const [copiedFormulaId, setCopiedFormulaId] = useState<string | null>(null);

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfExportSuccess, setPdfExportSuccess] = useState(false);
  const [isExportingDocId, setIsExportingDocId] = useState<string | null>(null);
  const [docExportSuccessId, setDocExportSuccessId] = useState<string | null>(null);

  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showCustomVoiceModal, setShowCustomVoiceModal] = useState(false);

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

  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [flashAnimation, setFlashAnimation] = useState(false);
  const [shutterAnimation, setShutterAnimation] = useState(false);
  const [cameraFilter, setCameraFilter] = useState<ImageFilterType>('none');
  const [filterPreviewImageIndex, setFilterPreviewImageIndex] = useState<number | null>(null);
  const [lowContrastDetected, setLowContrastDetected] = useState(false);
  const [showContrastToast, setShowContrastToast] = useState(false);

  // New states and refs for multiple attachments & drive picker
  const [localAttachedFiles, setLocalAttachedFiles] = useState<any[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [isLoadingDriveFiles, setIsLoadingDriveFiles] = useState(false);
  const [driveSearchQuery, setDriveSearchQuery] = useState('');
  const [driveError, setDriveError] = useState<string | null>(null);
  const [isAttachingDriveFile, setIsAttachingDriveFile] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const photosInputRef = useRef<HTMLInputElement | null>(null);
  const genericFileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);

  // Click outside listener for attachment menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
        setShowAttachmentMenu(false);
      }
    }
    if (showAttachmentMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAttachmentMenu]);

  // File selection handlers
  const handlePhotosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const rawData = event.target.result as string;
          setSelectedImages((prev) => [...prev, rawData]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
    showToast('Photos imported successfully!', 'success');
  };

  const handleGenericFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const rawData = event.target.result as string;
            setSelectedImages((prev) => [...prev, rawData]);
          }
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const textContent = event.target.result as string;
            setLocalAttachedFiles((prev) => {
              if (prev.some(f => f.name === file.name)) return prev;
              return [...prev, {
                id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                name: file.name,
                content: textContent.slice(0, 80000),
                type: 'file'
              }];
            });
            showToast(`"${file.name}" attached successfully!`, 'success');
          }
        };
        try {
          reader.readAsText(file);
        } catch (err) {
          showToast(`Could not read file: ${file.name}. Only text-based files are supported.`, 'error');
        }
      }
    });
    e.target.value = '';
  };

  const handleOpenDrive = async () => {
    setShowAttachmentMenu(false);
    setIsLoadingDriveFiles(true);
    setDriveError(null);
    setShowDriveModal(true);

    const performFetch = async (accessToken: string) => {
      try {
        const files = await fetchDriveFiles(accessToken);
        setDriveFiles(files);
      } catch (err: any) {
        logError(err, 'DRIVE_FILE_FETCH');
        if (err.message === 'UNAUTHORIZED') {
          removeToken('drive');
          requestAuthorization();
        } else {
          setDriveError(err?.message || 'Failed to fetch Google Drive files.');
        }
      } finally {
        setIsLoadingDriveFiles(false);
      }
    };

    const requestAuthorization = () => {
      authorizeGoogleService(
        "drive",
        async (newToken) => {
          await performFetch(newToken);
        },
        (error) => {
          setDriveError(`Google Drive authorization failed: ${error}`);
          setIsLoadingDriveFiles(false);
          showToast(`Google Drive authorization failed: ${error}`, 'error');
        }
      );
    };

    const token = getSavedToken("drive");
    if (token) {
      await performFetch(token);
    } else {
      requestAuthorization();
    }
  };

  const handleSelectDriveFile = async (file: any) => {
    setIsAttachingDriveFile(true);
    const token = getSavedToken("drive");
    if (!token) {
      showToast("Google Drive session expired. Please connect again.", "error");
      setIsAttachingDriveFile(false);
      return;
    }

    try {
      showToast(`Attaching "${file.name}"...`, "info");
      const content = await fetchFileContent(token, file.id, file.mimeType);
      
      const newAttached = {
        id: file.id,
        name: file.name,
        content: content,
        type: "drive" as const
      };

      setLocalAttachedFiles(prev => {
        if (prev.some(f => f.id === file.id)) return prev;
        return [...prev, newAttached];
      });

      showToast(`"${file.name}" attached successfully!`, "success");
      setShowDriveModal(false);
    } catch (err: any) {
      logError(err, 'DRIVE_FILE_ATTACH');
      showToast(`Failed to attach file: ${err?.message || 'Unknown error'}`, "error");
    } finally {
      setIsAttachingDriveFile(false);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  // Auto-hiding header system (slides up automatically in 2.5s, pull/click arrow down to restore)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isHeaderHoveredOrInteracting, setIsHeaderHoveredOrInteracting] = useState(false);
  const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartYRef = useRef<number>(0);
  const bottomTouchStartYRef = useRef<number>(0);

  const resetAutoHideTimer = () => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
    if (!isHeaderHoveredOrInteracting && isHeaderVisible) {
      autoHideTimerRef.current = setTimeout(() => {
        setIsHeaderVisible(false);
      }, 2500);
    }
  };

  const showHeader = () => {
    setIsHeaderVisible(true);
    resetAutoHideTimer();
  };

  const hideHeader = () => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
    setIsHeaderVisible(false);
  };

  useEffect(() => {
    if (isHeaderVisible && !isHeaderHoveredOrInteracting) {
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = setTimeout(() => {
        setIsHeaderVisible(false);
      }, 2500);
    } else if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
    }
    return () => {
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    };
  }, [isHeaderVisible, isHeaderHoveredOrInteracting]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const updateHeight = () => setViewportHeight(vv.height);
    updateHeight();

    vv.addEventListener('resize', updateHeight);
    vv.addEventListener('scroll', updateHeight);
    return () => {
      vv.removeEventListener('resize', updateHeight);
      vv.removeEventListener('scroll', updateHeight);
    };
  }, []);

  const playShutterSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const oscGain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1600, now);
      osc1.frequency.exponentialRampToValueAtTime(140, now + 0.022);

      oscGain1.gain.setValueAtTime(0.35, now);
      oscGain1.gain.exponentialRampToValueAtTime(0.001, now + 0.022);
      osc1.connect(oscGain1);
      oscGain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.025);

      const bufferSize = Math.floor(ctx.sampleRate * 0.035);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.22));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(1800, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);

      setTimeout(() => {
        try {
          const now2 = ctx.currentTime;
          const osc2 = ctx.createOscillator();
          const oscGain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(1100, now2);
          osc2.frequency.exponentialRampToValueAtTime(180, now2 + 0.028);

          oscGain2.gain.setValueAtTime(0.28, now2);
          oscGain2.gain.exponentialRampToValueAtTime(0.001, now2 + 0.028);
          osc2.connect(oscGain2);
          oscGain2.connect(ctx.destination);
          osc2.start(now2);
          osc2.stop(now2 + 0.03);

          const noise2 = ctx.createBufferSource();
          noise2.buffer = buffer;
          const noiseGain2 = ctx.createGain();
          noiseGain2.gain.setValueAtTime(0.22, now2);
          noiseGain2.gain.exponentialRampToValueAtTime(0.001, now2 + 0.03);

          noise2.connect(noiseFilter);
          noiseFilter.connect(noiseGain2);
          noiseGain2.connect(ctx.destination);
          noise2.start(now2);
        } catch (e) {}
      }, 38);
    } catch (e) {
      // Audio playback fails gracefully if muted or unsupported
    }
  };

  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    setCameraError(null);
    stopCamera();
    try {
      let stream;
      try {
        // Try requested facing mode with high quality ideal resolution
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      } catch (firstErr) {
        console.warn('First camera attempt failed, trying fallback with generic resolution:', firstErr);
        try {
          // Fall back to just the requested facing mode
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: facing
            }
          });
        } catch (secondErr) {
          console.warn('Second camera attempt failed, trying any available video source:', secondErr);
          // Ultimate fallback to any working video camera (important for desktops without dual cameras)
          stream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
        }
      }
      
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      let msg = 'Could not access camera. Please check camera permissions or select a photo from your device.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = appLanguage === 'hi' 
          ? 'कैमरा अनुमति अस्वीकार कर दी गई। कृपया स्कैन करने के लिए अपने ब्राउज़र सेटिंग्स में कैमरा अनुमति सक्षम करें।' 
          : 'Camera permission denied. Please enable camera access in your browser settings to scan homework.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError' || err.message?.includes('device not found') || err.message?.includes('Requested device not found')) {
        msg = appLanguage === 'hi'
          ? 'अनुरोधित कैमरा डिवाइस नहीं मिला। यदि आप कंप्यूटर/लैपटॉप पर हैं, तो फ्रंट वेबकैम पर स्विच करके देखें।'
          : 'Requested camera device not found. If you are on a laptop/desktop, please switch to the front-facing webcam or upload files instead.';
      } else if (err.name === 'OverconstrainedError') {
        msg = appLanguage === 'hi'
          ? 'कैमरा प्रतिबंध संतुष्ट नहीं किया जा सका। कृपया फ्रंट वेबकैम का उपयोग करें।'
          : 'Camera constraints could not be satisfied. Try switching to your front-facing webcam.';
      }
      setCameraError(msg);
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

  useEffect(() => {
    if (!showCameraModal) {
      setLowContrastDetected(false);
      setShowContrastToast(false);
      return;
    }

    let intervalId: any = null;
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 64;
    sampleCanvas.height = 48;
    const ctx = sampleCanvas.getContext('2d', { willReadFrequently: true });

    const checkContrast = () => {
      if (!videoRef.current || videoRef.current.readyState < 2 || !ctx) return;
      try {
        ctx.drawImage(videoRef.current, 0, 0, 64, 48);
        const imgData = ctx.getImageData(0, 0, 64, 48);
        const data = imgData.data;

        let sumLuminance = 0;
        let minLum = 255;
        let maxLum = 0;
        const count = data.length / 4;
        const lumValues: number[] = [];

        for (let i = 0; i < data.length; i += 4) {
          const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          lumValues.push(lum);
          sumLuminance += lum;
          if (lum < minLum) minLum = lum;
          if (lum > maxLum) maxLum = lum;
        }

        const avgLum = sumLuminance / count;
        let variance = 0;
        for (let i = 0; i < count; i++) {
          variance += Math.pow(lumValues[i] - avgLum, 2);
        }
        const stdDev = Math.sqrt(variance / count);

        const isLow = avgLum < 60 || (maxLum - minLum < 55) || stdDev < 22;

        if (isLow) {
          setLowContrastDetected(true);
          setShowContrastToast(true);
        } else {
          setLowContrastDetected(false);
        }
      } catch (e) {
        // Handled gracefully if canvas read is blocked
      }
    };

    intervalId = setInterval(checkContrast, 1800);
    const timeoutId = setTimeout(checkContrast, 1000);

    return () => {
      if (intervalId) clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [showCameraModal]);

  const handleCapturePhoto = (keepOpen: boolean = false) => {
    if (!videoRef.current) return;
    const dataUrl = applyFilterToCanvas(videoRef.current, cameraFilter);
    if (dataUrl) {
      setSelectedImages((prev) => [...prev, dataUrl]);
      playShutterSound();
      setShutterAnimation(true);
      setFlashAnimation(true);

      setTimeout(() => {
        setFlashAnimation(false);
      }, 200);

      setTimeout(() => {
        setShutterAnimation(false);
        if (!keepOpen) {
          setShowCameraModal(false);
        }
      }, 400);
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
          const rawData = event.target.result as string;
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

  useEffect(() => {
    try {
      localStorage.setItem(`ai_tutor_chat_${user.uid}`, safeJsonStringify(messages));
    } catch (e) {
      console.error('Error writing chat history to storage', e);
    }
  }, [messages, user.uid]);

  useEffect(() => {
    try {
      const draftKey = `ai_tutor_input_draft_${user.uid}`;
      if (inputQuery.trim()) {
        localStorage.setItem(draftKey, inputQuery);
      } else {
        localStorage.removeItem(draftKey);
      }
    } catch (e) {
      console.error('Error writing input draft to storage', e);
    }
  }, [inputQuery, user.uid]);

  useEffect(() => {
    try {
      localStorage.setItem(`saved_formulas_${user.uid}`, JSON.stringify(savedFormulas));
    } catch (e) {
      console.error('Error writing saved formulas to storage', e);
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

  const handleCopyFormula = async (id: string, latex: string) => {
    const copied = await safeClipboardWrite(latex);
    if (copied) {
      setCopiedFormulaId(id);
      setTimeout(() => setCopiedFormulaId(null), 2000);
    }
  };

  const handleInsertFormula = (latex: string) => {
    const formatted = latex.includes('$') ? latex : ` $${latex}$ `;
    insertSymbol(formatted);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    let isCancelled = false;

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
    const effectiveQuery = cleanQuery || (imagesToSend.length > 0 ? `Please solve and explain the homework problem(s) shown in the ${imagesToSend.length > 1 ? `${imagesToSend.length} attached pages` : 'attached page'}.` : '');

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
      setStoredValue(`ai_tutor_input_draft_${user.uid}`, null);
    }
    setSelectedImages([]);
    setIsLoading(true);

    try {
      const studentInfo = `[Student: ${user.name || 'Student'} | School: ${user.schoolName || 'School'} | Class: ${user.className || 'Class'} | Goal: ${user.targetGoal || 'General'}]`;
      
      let workspaceContext = "";
      const combinedAttachments = [...(attachedWorkspaceFiles || []), ...(localAttachedFiles || [])];
      if (combinedAttachments.length > 0) {
        workspaceContext = combinedAttachments.map(file => {
          return `[Attached Document: "${file.name}" | Source: ${file.type || 'file'}]\n${file.content}\n`;
        }).join("\n---\n") + "\n[Use the above attached document context to address the prompt below accurately.]\n\n";
      }

      let promptContext = `${workspaceContext}${studentInfo} [Subject: ${selectedSubject} | Mode: ${tutorMode}] ${effectiveQuery}`;
      if (tutorMode === 'step') {
        promptContext = `${workspaceContext}${studentInfo} Provide a strict step-by-step solution for ${user.className || 'student level'}: ${effectiveQuery}`;
      } else if (tutorMode === 'explain') {
        promptContext = `${workspaceContext}${studentInfo} Explain clearly with analogies suitable for ${user.className || 'student level'}: ${effectiveQuery}`;
      } else if (tutorMode === 'quiz') {
        promptContext = `${workspaceContext}${studentInfo} Generate a 3-question practice quiz suitable for ${user.className || 'student level'}: ${effectiveQuery}`;
      }

      const answer = await getStudyAnswer(promptContext, imagesToSend.length > 0 ? imagesToSend : undefined, undefined, selectedLanguage);

      const aiMsg: ChatMessage = {
        id: 'msg_ai_' + Date.now(),
        sender: 'ai',
        text: answer || 'I could not generate an answer right now. Please try asking again!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        subject: selectedSubject,
        mode: tutorMode
      };

      setMessages((prev) => [...prev, aiMsg]);
      
      // Clear local attached files
      setLocalAttachedFiles([]);

      // Clear attached workspace files after successful send
      if (attachedWorkspaceFiles.length > 0 && onRemoveAttachedWorkspaceFile) {
        attachedWorkspaceFiles.forEach(file => {
          onRemoveAttachedWorkspaceFile(file.id);
        });
      }

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
      logError(error, 'PDF_EXPORT');
      showToast('Failed to export PDF study guide. Please ensure there are conversation messages.', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportToGoogleDoc = async (msg: ChatMessage) => {
    if (isExportingDocId) return;
    setIsExportingDocId(msg.id);
    
    const performExport = async (accessToken: string) => {
      try {
        const title = `Ascend AI Tutor Note - ${(msg.subject || selectedSubject).toUpperCase()} (${new Date().toLocaleDateString()})`;
        const docId = await createGoogleDoc(accessToken, title, msg.text);
        setDocExportSuccessId(msg.id);
        if (onAddXp) onAddXp(20);
        
        // Open the document in a new tab if successful so they see their work instantly!
        const openUrl = `https://docs.google.com/document/d/${docId}/edit`;
        window.open(openUrl, '_blank');

        setTimeout(() => setDocExportSuccessId(null), 4000);
      } catch (err: any) {
        logError(err, 'GOOGLE_WORKSPACE_DOC_EXPORT');
        const parsed = parseError(err);
        const isHindi = globalAppLanguage === 'Hindi' || globalAppLanguage === 'hi';
        showToast(`Failed to export to Google Docs: ${isHindi ? parsed.messageHindi : parsed.message}`, 'error');
      } finally {
        setIsExportingDocId(null);
      }
    };

    const token = getSavedToken("docs");
    if (token) {
      await performExport(token);
    } else {
      authorizeGoogleService(
        "docs",
        async (newToken) => {
          await performExport(newToken);
        },
        (error) => {
          setIsExportingDocId(null);
          showToast(`Google Docs connection failed: ${error}. Please authorize Google Workspace services in the Workspace Hub page.`, 'error');
        }
      );
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Clear all AI Tutor conversation history?')) {
      setMessages([]);
      setStoredValue(`ai_tutor_chat_${user.uid}`, null);
    }
  };

  const handleDeleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const handleCopyText = async (id: string, text: string | unknown) => {
    const cleanStr = typeof text === 'string' ? text : String(text || '');
    const copied = await safeClipboardWrite(cleanStr);
    if (copied) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleSpeakText = (text: string | unknown) => {
    const cleanStr = typeof text === 'string' ? text : String(text || '');
    if (!cleanStr) return;
    playTutorSpeech(cleanStr);
  };

  const handleSaveToNotebook = async (msg: ChatMessage) => {
    try {
      if (onAddNote) {
        await onAddNote({
          title: `AI Tutor Note - ${msg.subject || selectedSubject}`,
          content: msg.text,
          subject: msg.subject || selectedSubject
        });
      } else {
        const raw = localStorage.getItem('study_notebook_notes') || '[]';
        const parsed = JSON.parse(raw);
        parsed.unshift({
          id: 'note_' + Date.now(),
          title: `AI Tutor Note - ${msg.subject || selectedSubject}`,
          content: msg.text,
          subject: msg.subject || selectedSubject,
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('study_notebook_notes', JSON.stringify(parsed));
      }
      setSavedNoteId(msg.id);
      if (onAddXp) onAddXp(10);
      setTimeout(() => setSavedNoteId(null), 2500);
    } catch (e) {
      console.error('Error saving note:', e);
    }
  };

  const handleVoiceInputToggle = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Try Chrome or Edge!');
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
    <div
      className="fixed inset-0 z-50 bg-[#f8fafc] text-slate-900 flex flex-col font-sans overflow-hidden transition-[height] duration-150 ease-out"
      style={viewportHeight ? { height: `${viewportHeight}px` } : undefined}
      onTouchStart={(e) => {
        if (!isHeaderVisible && e.touches[0].clientY < 60) {
          touchStartYRef.current = e.touches[0].clientY;
        }
        if (!isBottomNavVisible && e.touches[0].clientY > window.innerHeight - 80) {
          bottomTouchStartYRef.current = e.touches[0].clientY;
        }
      }}
      onTouchMove={(e) => {
        if (!isHeaderVisible && touchStartYRef.current > 0) {
          if (e.touches[0].clientY - touchStartYRef.current > 15) {
            showHeader();
            touchStartYRef.current = 0;
          }
        }
        if (!isBottomNavVisible && bottomTouchStartYRef.current > 0) {
          if (bottomTouchStartYRef.current - e.touches[0].clientY > 15) {
            onShowBottomNav?.();
            bottomTouchStartYRef.current = 0;
          }
        }
      }}
    >
      {/* COLLAPSIBLE TOP DETAIL BAR (SLIDES UP OUT OF VIEW) */}
      <motion.div
        initial={false}
        animate={{
          height: isHeaderVisible ? 'auto' : 0,
          opacity: isHeaderVisible ? 1 : 0
        }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-30 shrink-0 overflow-hidden bg-white"
        onMouseEnter={() => {
          setIsHeaderHoveredOrInteracting(true);
        }}
        onMouseLeave={() => {
          setIsHeaderHoveredOrInteracting(false);
        }}
        onTouchStart={() => {
          setIsHeaderHoveredOrInteracting(true);
          resetAutoHideTimer();
        }}
        onFocusCapture={() => {
          setIsHeaderHoveredOrInteracting(true);
        }}
        onBlurCapture={() => {
          setIsHeaderHoveredOrInteracting(false);
        }}
      >
        <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 px-3 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between shrink-0 shadow-[0_1px_2px_rgba(15,23,42,0.03)] z-10">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={onBack}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center space-x-1 border border-slate-200 group cursor-pointer"
              title="Back to Ascend Study"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-slate-700" />
              <span className="text-xs font-bold text-slate-700 hidden sm:inline">Back</span>
            </button>

            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0f172a] to-[#1e293b] shadow-sm flex items-center justify-center text-cyan-400 font-bold text-base tracking-wider">
                A
              </div>

              <div>
                <div className="flex items-center space-x-2 flex-wrap">
                  <h1 className="text-xs font-bold tracking-tight text-slate-900">
                    ASCEND AI TUTOR
                  </h1>
                  <span className="text-slate-400 font-bold text-[10px]">v2.5</span>
                  <div className="bg-emerald-50 text-emerald-700 border border-emerald-300/60 font-bold text-[9px] px-1.5 py-0.5 rounded-full flex items-center space-x-1 shadow-2xs">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Online</span>
                  </div>
                </div>
                <p className="text-[9px] text-slate-500 font-medium flex items-center space-x-1">
                  <span>Powered by Gemini AI</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="hidden lg:flex items-center space-x-1.5">
              <div className="bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                <UserIcon className="w-3 h-3 text-slate-500" />
                <span className="truncate max-w-[90px]">{user.name || 'full Yadav'}</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                <GraduationCap className="w-3 h-3 text-slate-500" />
                <span className="truncate max-w-[110px]">{user.className || 'Class 11th (PCB)'}</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                <UserIcon className="w-3 h-3 text-slate-500" />
                <span className="truncate max-w-[80px]">{user.schoolName || 'chhabra'}</span>
              </div>
            </div>

            {/* Direct Mic Speech-to-Text Button */}
            <button
              type="button"
              onClick={handleVoiceInputToggle}
              className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs font-bold ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse shadow-md border border-rose-600'
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100 border border-slate-200'
              }`}
              title={isListening ? 'Listening... Click to stop' : 'Microphone Voice Input'}
            >
              <Mic className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isListening ? 'Listening...' : 'Mic'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCustomVoiceModal(true)}
              className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-200/80 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="Configure Tutor Custom Voice"
            >
              <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Voice</span>
            </button>

            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                title="Clear Conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowMoreMenu(true)}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition flex items-center justify-center relative cursor-pointer active:scale-95"
              title="Tools, Modes, Subject & Settings"
            >
              <MoreVertical className="w-3.5 h-3.5 text-slate-700" />
            </button>
          </div>
        </header>
      </motion.div>

      {/* PERSISTENT STUDY TOOLBAR (ALWAYS STAYS AS HEADER, REST SLIDES UP ABOVE) */}
      <div className="bg-white border-b border-slate-200/90 px-3 sm:px-5 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 z-20 relative">
        {/* Back Arrow button to go back directly from persistent header */}
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-slate-600 hover:text-slate-900 transition flex items-center justify-center cursor-pointer shrink-0 active:scale-95"
          title="Back"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>

        <div className="relative shrink-0">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value as Subject)}
            className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs pl-8 pr-4 py-1.5 rounded-lg cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            {SUBJECT_LIST.map((sub) => (
              <option key={sub} value={sub} className="text-slate-900 bg-white">{sub}</option>
            ))}
          </select>
          <FlaskConical className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Minimal Toggle Chevron to easily roll details up/down right next to Science option */}
        <button
          type="button"
          onClick={() => isHeaderVisible ? hideHeader() : showHeader()}
          className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-slate-500 hover:text-slate-800 transition flex items-center justify-center cursor-pointer shrink-0 active:scale-95"
          title={isHeaderVisible ? "Minimize top menu" : "Maximize top menu"}
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isHeaderVisible ? 'rotate-180' : ''}`} />
        </button>

        <div className="relative shrink-0">
          <select
            value={selectedLanguage}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedLanguage(val);
              setStoredValue(`ai_tutor_language_${user.uid}`, val);
              if (onLanguageChange) {
                const reverseMap: Record<string, string> = {
                  'English': 'en',
                  'Hindi': 'hi',
                  'Hinglish': 'hinglish',
                  'Marathi': 'marathi',
                  'Tamil': 'tamil',
                  'Bengali': 'bengali'
                };
                const code = reverseMap[val];
                if (code) onLanguageChange(code);
              }
            }}
            className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs pl-8 pr-4 py-1.5 rounded-lg cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="Hinglish">Hinglish</option>
            <option value="Hindi">हिंदी (Hindi)</option>
            <option value="English">English</option>
            <option value="Marathi">मराठी (Marathi)</option>
            <option value="Tamil">தமிழ் (Tamil)</option>
            <option value="Bengali">বাংলा (Bengali)</option>
          </select>
          <Languages className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="w-px h-5 bg-slate-200 shrink-0" />

        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5 shrink-0">
          {[
            { id: 'homework' as const, label: 'Homework', icon: Zap },
            { id: 'step' as const, label: 'Step-by-Step', icon: TrendingUp },
            { id: 'explain' as const, label: 'Explain', icon: Lightbulb },
            { id: 'quiz' as const, label: 'Quiz', icon: ClipboardList },
          ].map((mode) => {
            const Icon = mode.icon;
            const active = tutorMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setTutorMode(mode.id)}
                className={`px-2.5 py-1.5 rounded-md font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer shrink-0 whitespace-nowrap active:scale-95 ${
                  active
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{mode.label}</span>
              </button>
            );
          })}
        </div>

        <div className="w-px h-5 bg-slate-200 shrink-0" />

        <button
          type="button"
          onClick={() => handleSendMessage(`Give me key high-yield exam insights, formula tricks, and JEE Main / Board questions for ${selectedSubject}.`)}
          className="border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-700 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shrink-0 whitespace-nowrap"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
          <span>Exam Insights</span>
        </button>

        <button
          type="button"
          onClick={handleExportPdf}
          disabled={messages.length === 0 || isExportingPdf}
          className="ml-auto border border-slate-200 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40 text-slate-600 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shrink-0 whitespace-nowrap"
        >
          {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">Export PDF</span>
        </button>
      </div>

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

      <div className="flex-1 overflow-y-auto overscroll-contain scroll-smooth p-3 sm:p-5 space-y-4 max-w-4xl mx-auto w-full">
        {messages.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="h-full flex flex-col items-center justify-center text-center space-y-5 py-8 px-4"
          >
            <motion.div 
              initial={{ scale: 0.8, rotate: -6 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="relative"
            >
              <div className="w-18 h-18 rounded-3xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] flex items-center justify-center text-cyan-400 font-bold text-2xl shadow-lg shadow-slate-900/20 ring-1 ring-slate-900/5">
                A
              </div>
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-emerald-500 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm ring-2 ring-white">
                ONLINE
              </span>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="space-y-1.5 max-w-md"
            >
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Welcome, {user.name} 👋
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ask any question in Science, Math, Physics, Chemistry, Biology, or English.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.35 }}
              className="w-full max-w-lg space-y-2 text-left pt-2"
            >
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block text-center">
                Popular study questions
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {QUICK_PROMPTS.map((qp, idx) => {
                  const Icon = qp.icon;
                  return (
                    <motion.button
                      key={idx}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSendMessage(qp.prompt)}
                      className="p-3 bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-blue-300 rounded-2xl transition-all duration-200 text-left group flex items-start space-x-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
                    >
                      <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-slate-900 group-hover:text-blue-700 block">
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
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => {
              const isLatest = idx === messages.length - 1;

              if (msg.sender === 'user') {
                return (
                  <motion.div
                    key={msg.id}
                    layout
                    initial={{ opacity: 0, y: 18, scale: 0.94, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -16, scale: 0.88, filter: 'blur(4px)', transition: { duration: 0.22, ease: 'easeOut' } }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28, mass: 0.8 }}
                    className="flex items-start justify-end space-x-2.5 group/usermsg w-full"
                  >
                    <div className="flex flex-col items-end max-w-[85%] sm:max-w-[78%] space-y-1">
                      <div className="flex items-center space-x-2 pr-1">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {user.name || 'You'} • {msg.timestamp}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="opacity-0 group-hover/usermsg:opacity-100 transition text-slate-400 hover:text-rose-500 p-0.5 rounded cursor-pointer"
                          title="Remove message"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white rounded-2xl rounded-tr-xs p-3.5 sm:p-4 border border-slate-700/60 shadow-[0_4px_16px_rgba(15,23,42,0.12)] space-y-2.5">
                        {msg.images && msg.images.length > 0 ? (
                          <div className={`grid gap-2 ${msg.images.length === 1 ? 'grid-cols-1 max-w-xs' : 'grid-cols-2 max-w-sm'}`}>
                            {msg.images.map((img, i) => (
                              <img key={i} src={img} alt={`Attached ${i + 1}`} className="w-full max-h-48 object-contain rounded-xl border border-slate-700 bg-slate-800" />
                            ))}
                          </div>
                        ) : msg.image ? (
                          <img src={msg.image} alt="Attached homework" className="w-full max-h-56 object-contain rounded-xl border border-slate-700 bg-slate-800" />
                        ) : null}
                        <p className="text-xs sm:text-[14.5px] text-slate-100 whitespace-pre-wrap leading-relaxed font-normal">
                          {msg.text}
                        </p>
                    </div>
                  </div>

                    <div className="w-8 h-8 rounded-full ring-2 ring-indigo-500/30 shadow-sm overflow-hidden bg-slate-800 flex items-center justify-center shrink-0 mt-4">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10, transition: { duration: 0.18, ease: 'easeOut' } }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  className="flex justify-start w-full group/aimsg my-2"
                >
                  <div className="w-full max-w-[820px] bg-transparent border-0 overflow-visible transition-all">
                    {/* Professional Header Bar */}
                    <div className="bg-transparent border-b border-slate-100 px-0 py-2 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-xs">
                          <GraduationCap className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 tracking-tight">AI Academic Tutor</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            ✓ Verified Solution
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Font Style Toggle: Classic Editorial Serif vs Modern Clean */}
                        <button
                          type="button"
                          onClick={toggleTutorFontStyle}
                          className="inline-flex items-center space-x-1.5 text-[11px] font-medium px-2 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition cursor-pointer active:scale-95 shadow-xs"
                          title="Click to toggle between Classic Editorial Serif and Modern Sans font style"
                        >
                          <Type className="w-3 h-3 text-indigo-600" />
                          <span className={`${tutorFontStyle === 'classic' ? 'font-serif font-bold text-indigo-950' : 'font-sans font-semibold text-slate-700'}`}>
                            {tutorFontStyle === 'classic' ? 'Classic Serif' : 'Modern Sans'}
                          </span>
                        </button>

                        <span className="text-[11px] text-slate-400 font-medium">
                          {msg.timestamp}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="text-slate-400 hover:text-rose-600 transition p-1 rounded-md hover:bg-rose-50 cursor-pointer"
                          title="Remove message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Classic Editorial or Modern Message Body - Khulla no padding or background */}
                    <div className={`py-4 px-0 ${tutorFontStyle === 'classic' ? 'tutor-editorial font-serif' : 'tutor-modern font-sans'}`}>
                      <StaggeredRevealMarkdown text={msg.text} isLatest={isLatest} fontStyle={tutorFontStyle} />
                    </div>

                    {/* Professional Action Suite */}
                    <div className="bg-transparent border-t border-slate-100 px-0 py-2.5 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center space-x-1 flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => handleCopyText(msg.id, msg.text)}
                          title="Copy answer"
                          className="text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/80 text-xs font-medium px-2.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer active:scale-95 shadow-xs"
                        >
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                          <span className="hidden xs:inline">{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSpeakText(msg.text)}
                          title="Listen to answer"
                          className="text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/80 text-xs font-medium px-2.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer active:scale-95 shadow-xs"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                          <span className="hidden xs:inline">Listen</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSaveToNotebook(msg)}
                          title="Save to notebook"
                          className="text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/80 text-xs font-medium px-2.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer active:scale-95 shadow-xs"
                        >
                          <Bookmark className="w-3.5 h-3.5 text-slate-500" />
                          <span className="hidden xs:inline">{savedNoteId === msg.id ? 'Saved ✓' : 'Save Note'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExportToGoogleDoc(msg)}
                          disabled={isExportingDocId === msg.id}
                          className="text-emerald-700 hover:text-emerald-900 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200/80 text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer active:scale-95 shadow-xs disabled:opacity-50"
                          title="Export this tutoring answer to a live Google Document"
                        >
                          {isExportingDocId === msg.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                          ) : docExportSuccessId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                          <span className="hidden sm:inline">{docExportSuccessId === msg.id ? 'Exported!' : isExportingDocId === msg.id ? 'Exporting...' : 'Export to Docs'}</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedActionsId(expandedActionsId === msg.id ? null : msg.id)}
                        title="More study tools"
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer active:scale-95 ${
                          expandedActionsId === msg.id
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'text-indigo-600 hover:bg-indigo-50 border border-indigo-200/60'
                        }`}
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>{expandedActionsId === msg.id ? 'Hide Tools' : 'Study Tools'}</span>
                      </button>
                    </div>

                    {expandedActionsId === msg.id && (
                      <div className="bg-slate-50/50 border-t border-slate-100 px-3.5 py-2.5 sm:px-5 flex flex-wrap items-center gap-1.5 rounded-b-2xl mt-2">
                        <button
                          type="button"
                          onClick={() => handleSendMessage('Can you explain this concept in simpler terms with a super easy everyday analogy?')}
                          className="border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 bg-white text-slate-700 text-xs font-medium px-2.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer active:scale-95 shadow-xs"
                        >
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                          <span>Explain Simpler</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendMessage('Give me 1 practice question based on this topic so I can test my understanding.')}
                          className="border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 bg-white text-slate-700 text-xs font-medium px-2.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer active:scale-95 shadow-xs"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Practice Question</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendMessage('Please explain this in easy Hinglish with important key points for JEE Main / Board exams.')}
                          className="border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 bg-white text-slate-700 text-xs font-medium px-2.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer active:scale-95 shadow-xs"
                        >
                          <Languages className="w-3.5 h-3.5 text-purple-500" />
                          <span>JEE Main / Hinglish</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendMessage('Summarize the key concepts, formulas, and takeaways in a clean structured table.')}
                          className="border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 bg-white text-slate-700 text-xs font-medium px-2.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer active:scale-95 shadow-xs"
                        >
                          <Table className="w-3.5 h-3.5 text-teal-500" />
                          <span>Summary Table</span>
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        <AnimatePresence>
          {isLoading && (
            <motion.div 
              key="tutor-loading-bubble"
              initial={{ opacity: 0, y: 14, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="flex items-start space-x-2.5 my-2"
            >
               <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 ring-2 ring-indigo-100 flex items-center justify-center text-white shadow-sm shrink-0 mt-1">
                <GraduationCap className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div className="bg-transparent border-0 p-0 space-y-2 max-w-xl">
                <div className="flex items-center space-x-2 text-indigo-700 text-xs font-bold tracking-tight">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>AI Academic Tutor is writing structured solution...</span>
                </div>
                <div className="space-y-1.5 pt-1 w-48">
                  <div className="h-1.5 bg-slate-200/80 rounded-full w-4/5 animate-pulse" />
                  <div className="h-1.5 bg-slate-200/80 rounded-full w-3/5 animate-pulse" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      <footer
        className="bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 sm:px-3 py-1 sm:py-1.5 shrink-0 relative shadow-[0_-4px_20px_-4px_rgba(15,23,42,0.08)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          paddingBottom: isBottomNavVisible
            ? 'calc(48px + 8px + env(safe-area-inset-bottom, 0px))'
            : 'calc(6px + env(safe-area-inset-bottom, 0px))'
        }}
      >
        <div className="max-w-4xl mx-auto space-y-1">
          <AnimatePresence>
            {showSavedFormulasPanel && (
              <motion.div 
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
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
                      placeholder="LaTeX Code (e.g. F = ma or \\int x^2 dx)"
                      value={newFormulaLatex}
                      onChange={(e) => setNewFormulaLatex(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-amber-700 font-mono placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
                    />

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

          <AnimatePresence>
            {showMathPalette && (
              <motion.div 
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
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

                <div className="grid grid-cols-6 gap-1.5 max-h-40 overflow-y-auto no-scrollbar p-0.5">
                  {MATH_SYMBOLS.filter(
                    (s) => activeMathCategory === 'All' || s.category === activeMathCategory
                  ).map((sym, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => insertSymbol(sym.value)}
                      className="p-2 bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold transition flex items-center justify-center cursor-pointer"
                      title={sym.value}
                    >
                      {sym.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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

          {attachedWorkspaceFiles && attachedWorkspaceFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-1 px-1">
              {attachedWorkspaceFiles.map((file) => (
                <div 
                  key={file.id} 
                  className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-850 text-indigo-300 border border-slate-750 text-[10px] font-bold shadow-xs select-none"
                >
                  <span>
                    {file.type === "drive" ? "📁" : file.type === "classroom" ? "🎓" : "📊"}
                  </span>
                  <span className="truncate max-w-[120px]">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveAttachedWorkspaceFile?.(file.id)}
                    className="p-0.5 hover:bg-slate-750 rounded-full transition text-slate-400 hover:text-slate-200 cursor-pointer"
                    title="Remove attachment"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {localAttachedFiles && localAttachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-1 px-1">
              {localAttachedFiles.map((file) => (
                <div 
                  key={file.id} 
                  className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-850 text-cyan-300 border border-slate-750 text-[10px] font-bold shadow-xs select-none"
                >
                  <span>
                    {file.type === "drive" ? "📁" : "📄"}
                  </span>
                  <span className="truncate max-w-[120px]">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setLocalAttachedFiles(prev => prev.filter(f => f.id !== file.id))}
                    className="p-0.5 hover:bg-slate-750 rounded-full transition text-slate-400 hover:text-slate-200 cursor-pointer"
                    title="Remove attachment"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative flex items-center bg-white border border-slate-300/80 hover:border-slate-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 rounded-2xl p-1 transition-all duration-200 shadow-sm">
            {/* MIC BUTTON */}
            <button
              type="button"
              onClick={handleVoiceInputToggle}
              className={`p-1.5 sm:p-2 rounded-xl transition cursor-pointer shrink-0 ${
                isListening 
                  ? 'bg-rose-600 text-white animate-bounce' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
              title={isListening ? 'Listening... Click to stop' : 'Voice Input'}
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* THREE-DOTS QUICK ACTIONS MENU (Next to Mic) */}
            <div ref={quickActionsMenuRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowQuickActionsMenu(!showQuickActionsMenu)}
                className={`p-1.5 sm:p-2 rounded-xl transition cursor-pointer flex items-center justify-center ${
                  showQuickActionsMenu 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
                title={appLanguage === 'hi' ? 'त्वरित अध्ययन सुझाव' : 'Quick Actions & Study Prompts'}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showQuickActionsMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-0 mb-2 w-72 sm:w-80 bg-white/98 backdrop-blur-lg border border-slate-200 rounded-2xl p-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.18)] z-50 text-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>{appLanguage === 'hi' ? 'त्वरित सुझाव' : 'Quick Study Actions'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={handleRefreshSuggestions}
                          disabled={isGeneratingSuggestions}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"
                          title="Refresh prompts"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingSuggestions ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowQuickActionsMenu(false)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                          title="Close"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-1 pr-0.5 no-scrollbar">
                      {suggestions.map((sugg, idx) => (
                        <button
                          key={sugg.id || idx}
                          type="button"
                          onClick={() => {
                            handleSendMessage(sugg.prompt);
                            setShowQuickActionsMenu(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/60 hover:border-blue-200 rounded-xl text-xs font-medium transition cursor-pointer flex items-center justify-between group"
                        >
                          <span className="truncate mr-1.5">{sugg.label}</span>
                          <Send className="w-3 h-3 text-slate-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition shrink-0" />
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center space-x-1.5 pt-1 border-t border-slate-100 text-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          setShowMathPalette(!showMathPalette);
                          setShowQuickActionsMenu(false);
                        }}
                        className="flex-1 py-1 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-mono font-bold text-center transition"
                      >
                        f(x) Math Symbols
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSavedFormulasPanel(!showSavedFormulasPanel);
                          setShowQuickActionsMenu(false);
                        }}
                        className="flex-1 py-1 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-center transition flex items-center justify-center space-x-1"
                      >
                        <Bookmark className="w-3 h-3 fill-current" />
                        <span>Formulas</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* PLUS / ATTACHMENT MENU BUTTON */}
            <div ref={attachmentMenuRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                className={`p-1.5 sm:p-2 rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer ${
                  showAttachmentMenu || selectedImages.length > 0 || localAttachedFiles.length > 0
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
                title={appLanguage === 'hi' ? 'अटैचमेंट जोड़ें' : 'Add Attachment'}
              >
                <div className="relative">
                  <Plus className={`w-4 h-4 transition-transform duration-200 ${showAttachmentMenu ? 'rotate-45' : ''}`} />
                  {(selectedImages.length > 0 || localAttachedFiles.length > 0) && (
                    <span className="absolute -top-1.5 -right-2 bg-emerald-500 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-xs">
                      {selectedImages.length + localAttachedFiles.length}
                    </span>
                  )}
                </div>
              </button>

              <AnimatePresence>
                {showAttachmentMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute bottom-full left-0 mb-2 w-56 sm:w-64 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl z-50 text-slate-100 space-y-1"
                  >
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/60 pb-1.5 mb-1 flex items-center justify-between">
                      <span>{appLanguage === 'hi' ? 'अटैचमेंट' : 'Attachments'}</span>
                      <X className="w-3 h-3 cursor-pointer text-slate-500 hover:text-white" onClick={() => setShowAttachmentMenu(false)} />
                    </div>

                    {/* CAMERA OPTION */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowCameraModal(true);
                        setShowAttachmentMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-800 rounded-xl text-xs font-semibold transition flex items-center space-x-2.5 text-slate-200 hover:text-white"
                    >
                      <Camera className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-bold">{appLanguage === 'hi' ? 'कैमरा' : 'Camera'}</div>
                        <div className="text-[9px] text-slate-400 font-normal">{appLanguage === 'hi' ? 'सीधे फोटो खींचें' : 'Take a photo of assignment'}</div>
                      </div>
                    </button>

                    {/* PHOTOS OPTION */}
                    <button
                      type="button"
                      onClick={() => {
                        photosInputRef.current?.click();
                        setShowAttachmentMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-800 rounded-xl text-xs font-semibold transition flex items-center space-x-2.5 text-slate-200 hover:text-white"
                    >
                      <Images className="w-4 h-4 text-blue-400 shrink-0" />
                      <div>
                        <div className="font-bold">{appLanguage === 'hi' ? 'तस्वीरें' : 'Photos'}</div>
                        <div className="text-[9px] text-slate-400 font-normal">{appLanguage === 'hi' ? 'गैलरी से चित्र चुनें' : 'Choose images from library'}</div>
                      </div>
                    </button>

                    {/* FILE UPLOAD OPTION */}
                    <button
                      type="button"
                      onClick={() => {
                        genericFileInputRef.current?.click();
                        setShowAttachmentMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-800 rounded-xl text-xs font-semibold transition flex items-center space-x-2.5 text-slate-200 hover:text-white"
                    >
                      <Upload className="w-4 h-4 text-purple-400 shrink-0" />
                      <div>
                        <div className="font-bold">{appLanguage === 'hi' ? 'फ़ाइल अपलोड' : 'File Upload'}</div>
                        <div className="text-[9px] text-slate-400 font-normal">{appLanguage === 'hi' ? 'दस्तावेज़ या पीडीएफ चुनें' : 'Attach docs, PDFs, or files'}</div>
                      </div>
                    </button>

                    {/* DRIVE OPTION */}
                    <button
                      type="button"
                      onClick={handleOpenDrive}
                      className="w-full text-left px-3 py-2 hover:bg-slate-800 rounded-xl text-xs font-semibold transition flex items-center space-x-2.5 text-slate-200 hover:text-white"
                    >
                      <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <div className="font-bold">{appLanguage === 'hi' ? 'गूगल ड्राइव' : 'Google Drive'}</div>
                        <div className="text-[9px] text-slate-400 font-normal">{appLanguage === 'hi' ? 'गूगल ड्राइव से फाइलें चुनें' : 'Select directly from Cloud'}</div>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* INPUT TEXTAREA */}
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
                  ? 'Listening to your voice...' 
                  : selectedImages.length > 0 
                  ? `${selectedImages.length} page(s) attached! Press Send...` 
                  : `Ask AI Tutor about ${selectedSubject}...`
              }
              className="flex-1 bg-transparent border-0 px-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none max-h-24 py-1.5 font-medium min-h-[34px]"
            />

            {/* CLEAR INPUT BUTTON */}
            {inputQuery.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setInputQuery('');
                  setStoredValue(`ai_tutor_input_draft_${user.uid}`, null);
                  textareaRef.current?.focus();
                }}
                className="p-1 sm:p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg transition flex items-center justify-center shrink-0 mr-1 cursor-pointer"
                title="Clear Input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* RESTORE ARROW INSIDE INPUT BOX (When bottom nav is auto-hidden) */}
            {!isBottomNavVisible && onShowBottomNav && (
              <button
                type="button"
                onClick={onShowBottomNav}
                className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 transition flex items-center justify-center cursor-pointer shrink-0 mr-1"
                title={appLanguage === 'hi' ? 'नेविगेशन बार दिखाएं' : 'Show Navigation Bar'}
              >
                <ChevronUp className="w-3.5 h-3.5 text-emerald-600" />
              </button>
            )}

            {/* SEND BUTTON */}
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={(!inputQuery.trim() && selectedImages.length === 0) || isLoading}
              className="p-2 sm:p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-bold rounded-xl shadow-xs transition-all duration-150 flex items-center justify-center cursor-pointer shrink-0"
              title="Send Message"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          multiple
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />

        <input
          type="file"
          ref={photosInputRef}
          accept="image/*"
          multiple
          onChange={handlePhotosUpload}
          className="hidden"
        />

        <input
          type="file"
          ref={genericFileInputRef}
          accept="image/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          multiple
          onChange={handleGenericFileUpload}
          className="hidden"
        />

        {/* GOOGLE DRIVE PICKER MODAL */}
        <AnimatePresence>
          {showDriveModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
              onClick={() => setShowDriveModal(false)}
            >
              <motion.div 
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[80vh] overflow-hidden text-slate-100"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                      <FolderOpen className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black tracking-wide text-white">
                        {appLanguage === 'hi' ? 'गूगल ड्राइव फ़ाइलें' : 'Google Drive Files'}
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        {appLanguage === 'hi' ? 'अध्ययन के लिए अपने क्लाउड दस्तावेज़ जोड़ें' : 'Choose documents to attach as tutor context'}
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setShowDriveModal(false)}
                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Search Bar */}
                {!driveError && !isLoadingDriveFiles && driveFiles.length > 0 && (
                  <div className="mt-4">
                    <input
                      type="text"
                      placeholder={appLanguage === 'hi' ? 'फ़ाइल खोजें...' : 'Search files...'}
                      value={driveSearchQuery}
                      onChange={(e) => setDriveSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 text-slate-100 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition placeholder:text-slate-500 font-medium"
                    />
                  </div>
                )}

                {/* Modal Content / Files List */}
                <div className="flex-1 overflow-y-auto min-h-[250px] max-h-[400px] mt-4 pr-1 space-y-1.5 no-scrollbar">
                  {isLoadingDriveFiles ? (
                    <div className="h-full flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                      <span className="text-xs font-bold">{appLanguage === 'hi' ? 'ड्राइव फ़ाइलें लोड हो रही हैं...' : 'Loading Drive files...'}</span>
                    </div>
                  ) : driveError ? (
                    <div className="py-8 text-center space-y-3">
                      <p className="text-xs text-rose-400 font-semibold">{driveError}</p>
                      <button
                        type="button"
                        onClick={handleOpenDrive}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                      >
                        {appLanguage === 'hi' ? 'पुनः कनेक्ट करें' : 'Reconnect & Retry'}
                      </button>
                    </div>
                  ) : isAttachingDriveFile ? (
                    <div className="h-full flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                      <span className="text-xs font-bold">{appLanguage === 'hi' ? 'फ़ाइल अटैच की जा रही है...' : 'Downloading and attaching file...'}</span>
                    </div>
                  ) : (
                    <>
                      {(() => {
                        const filtered = driveFiles.filter(f => 
                          f.name.toLowerCase().includes(driveSearchQuery.toLowerCase())
                        );

                        if (filtered.length === 0) {
                          return (
                            <div className="h-full flex flex-col items-center justify-center py-12 text-slate-500">
                              <span className="text-xs font-medium">{appLanguage === 'hi' ? 'कोई फ़ाइल नहीं मिली' : 'No matching files found'}</span>
                            </div>
                          );
                        }

                        return filtered.map((file) => {
                          const isDoc = file.mimeType.includes('document');
                          const isSheet = file.mimeType.includes('spreadsheet');
                          const isPdf = file.mimeType.includes('pdf');
                          const isImg = file.mimeType.includes('image');

                          return (
                            <div
                              key={file.id}
                              onClick={() => handleSelectDriveFile(file)}
                              className="p-3 bg-slate-950/60 hover:bg-slate-850/80 border border-slate-850 hover:border-slate-750 rounded-xl transition cursor-pointer flex items-center justify-between group"
                            >
                              <div className="flex items-center space-x-3 min-w-0">
                                <span className="text-lg shrink-0">
                                  {isDoc ? '📝' : isSheet ? '📊' : isPdf ? '📕' : isImg ? '🖼️' : '📁'}
                                </span>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-white truncate max-w-[280px]">
                                    {file.name}
                                  </h4>
                                  <p className="text-[9px] text-slate-500 font-medium">
                                    {isDoc ? 'Google Doc' : isSheet ? 'Google Sheet' : isPdf ? 'PDF Document' : isImg ? 'Image' : 'File'}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] text-blue-500 font-bold opacity-0 group-hover:opacity-100 transition pr-1">
                                {appLanguage === 'hi' ? 'अटैच करें' : 'Attach'}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="mt-4 pt-3.5 border-t border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowDriveModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    {appLanguage === 'hi' ? 'रद्द करें' : 'Close'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
                initial={{ y: '100%', opacity: 0.5 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="w-full sm:max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar"
                onClick={(e) => e.stopPropagation()}
              >
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

                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Tutor Mode
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'homework', label: '⚡ Homework Solver', desc: 'Step-by-step complete solutions' },
                      { id: 'step', label: '📐 Step Math', desc: 'Detailed mathematical breakdown' },
                      { id: 'explain', label: '💡 Explainer', desc: 'Concepts with easy analogies' },
                      { id: 'quiz', label: '📝 Practice Quiz', desc: 'Custom 3-question testing quiz' }
                    ].map((m) => {
                      const isSelected = tutorMode === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setTutorMode(m.id as any);
                          }}
                          className={`p-2.5 rounded-2xl text-left border transition ${
                            isSelected
                              ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                              : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="text-xs font-bold flex items-center justify-between">
                            <span>{m.label}</span>
                          </div>
                          <div className="text-[9px] text-slate-400 mt-0.5">{m.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

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
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
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

                  <div className="text-[10px] text-slate-400 flex items-center space-x-1 pt-0.5">
                    <span className="text-indigo-400 font-semibold shrink-0">Preview:</span>
                    <span className="truncate">
                      {HOMEWORK_IMAGE_FILTERS.find(f => f.id === cameraFilter)?.description}
                    </span>
                  </div>
                </div>

                <motion.div
                  animate={shutterAnimation ? { scale: [1, 0.98, 1] } : { scale: 1 }}
                  transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
                  className={`relative bg-slate-950 rounded-2xl overflow-hidden aspect-4/3 flex items-center justify-center border border-slate-800 shadow-inner ${shutterAnimation ? 'ring-2 ring-cyan-400/60' : ''}`}
                >
                  <AnimatePresence>
                    {shutterAnimation && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center overflow-hidden"
                      >
                        <motion.div
                          initial={{ y: '-100%' }}
                          animate={{ y: ['-100%', '0%', '0%', '-100%'] }}
                          transition={{ duration: 0.32, times: [0, 0.35, 0.6, 1], ease: 'easeInOut' }}
                          className="absolute top-0 left-0 right-0 h-1/2 bg-slate-950/95 border-b-2 border-cyan-400/60 shadow-2xl backdrop-blur-xs flex items-end justify-center pb-2"
                        >
                          <div className="w-16 h-1 bg-cyan-400/40 rounded-full" />
                        </motion.div>

                        <motion.div
                          initial={{ y: '100%' }}
                          animate={{ y: ['100%', '0%', '0%', '100%'] }}
                          transition={{ duration: 0.32, times: [0, 0.35, 0.6, 1], ease: 'easeInOut' }}
                          className="absolute bottom-0 left-0 right-0 h-1/2 bg-slate-950/95 border-t-2 border-cyan-400/60 shadow-2xl backdrop-blur-xs flex items-start justify-center pt-2"
                        >
                          <div className="w-16 h-1 bg-cyan-400/40 rounded-full" />
                        </motion.div>

                        <motion.div
                          initial={{ scale: 2.2, rotate: 0, opacity: 0.8 }}
                          animate={{
                            scale: [2.2, 0.08, 0.08, 2.2],
                            rotate: [0, 60, 60, 120],
                            opacity: [0.8, 1, 1, 0]
                          }}
                          transition={{ duration: 0.36, times: [0, 0.35, 0.6, 1], ease: [0.22, 1, 0.36, 1] }}
                          className="relative w-56 h-56 rounded-full border-4 border-slate-800 bg-slate-950 shadow-[0_0_60px_rgba(0,0,0,0.95)] flex items-center justify-center"
                        >
                          <div className="absolute inset-2 rounded-full border border-indigo-400/50" />
                          <div className="absolute inset-6 rounded-full border border-cyan-400/40 border-dashed" />
                          <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_15px_#38bdf8]" />
                        </motion.div>

                        <motion.div
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{
                            scale: [0.6, 1.15, 1],
                            opacity: [0, 1, 0]
                          }}
                          transition={{ duration: 0.38, times: [0, 0.45, 1] }}
                          className="absolute flex flex-col items-center justify-center space-y-1.5 z-40"
                        >
                          <div className="w-16 h-16 rounded-full border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.8)]">
                            <div className="w-4 h-4 rounded-full bg-cyan-400 animate-ping opacity-75" />
                          </div>
                          <span className="text-[10px] font-black tracking-widest uppercase text-cyan-200 bg-slate-950/90 px-2.5 py-0.5 rounded-full border border-cyan-400/50 shadow-xl backdrop-blur-md">
                            CAPTURED
                          </span>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {flashAnimation && (
                      <motion.div
                        initial={{ opacity: 1 }}
                        animate={{ opacity: [1, 1, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.26, times: [0, 0.15, 1], ease: 'easeOut' }}
                        className="absolute inset-0 z-50 pointer-events-none bg-white flex items-center justify-center overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#ffffff_0%,_#f8fafc_60%,_#e0f2fe_100%)]" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {cameraError ? (
                    <div className="text-center p-6 space-y-4">
                      <div className="p-3 bg-rose-500/10 text-rose-400 rounded-full w-fit mx-auto border border-rose-500/20">
                        <Camera className="w-8 h-8" />
                      </div>
                      <p className="text-xs text-rose-300 font-medium max-w-xs mx-auto leading-relaxed">{cameraError}</p>
                      
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-sm mx-auto">
                        <button
                          type="button"
                          onClick={() => {
                            const targetFacing = cameraFacing === 'environment' ? 'user' : 'environment';
                            setCameraFacing(targetFacing);
                            startCamera(targetFacing);
                          }}
                          className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 border border-slate-700 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin-slow" />
                          <span>
                            {appLanguage === 'hi' 
                              ? (cameraFacing === 'environment' ? 'फ्रंट कैमरा आजमाएं' : 'बैक कैमरा आजमाएं')
                              : (cameraFacing === 'environment' ? 'Try Front Camera' : 'Try Rear Camera')}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowCameraModal(false);
                            photosInputRef.current?.click();
                          }}
                          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-md cursor-pointer"
                        >
                          <Upload className="w-4 h-4" />
                          <span>{appLanguage === 'hi' ? 'गैलरी से चित्र चुनें' : 'Choose from Device'}</span>
                        </button>
                      </div>
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

                      <div className="absolute top-3 right-3 z-10">
                        <button
                          type="button"
                          onClick={() => {
                            const filterIds: ImageFilterType[] = ['none', 'document', 'grayscale', 'contrast', 'brighten'];
                            const currentIdx = filterIds.indexOf(cameraFilter);
                            const nextIdx = (currentIdx + 1) % filterIds.length;
                            setCameraFilter(filterIds[nextIdx]);
                          }}
                          className="bg-slate-950/80 hover:bg-slate-900 text-slate-200 text-[10px] font-bold px-2.5 py-1 rounded-full border border-indigo-500/30 backdrop-blur-md flex items-center space-x-1.5 cursor-pointer"
                          title="Tap to cycle readability filters"
                        >
                          <span>{HOMEWORK_IMAGE_FILTERS.find(f => f.id === cameraFilter)?.emoji}</span>
                          <span>{HOMEWORK_IMAGE_FILTERS.find(f => f.id === cameraFilter)?.shortLabel}</span>
                          <RefreshCw className="w-2.5 h-2.5 text-indigo-400 ml-0.5" />
                        </button>
                      </div>

                      <div className="absolute inset-5 border-2 border-dashed border-indigo-400/60 rounded-2xl pointer-events-none flex flex-col items-center justify-between p-3">
                        <span className="bg-slate-950/80 text-indigo-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-indigo-500/30 backdrop-blur-xs">
                          Page {selectedImages.length + 1}
                        </span>
                        <span className="text-[10px] text-slate-300 bg-slate-950/80 px-2.5 py-1 rounded-full border border-slate-700/60 backdrop-blur-xs">
                          {cameraFilter !== 'none' ? `Filter: ${HOMEWORK_IMAGE_FILTERS.find(f => f.id === cameraFilter)?.label}` : 'Align text & equations in frame'}
                        </span>
                      </div>

                      <AnimatePresence>
                        {showContrastToast && lowContrastDetected && (
                          <motion.div
                            initial={{ opacity: 0, y: 16, scale: 0.94 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 12, scale: 0.94 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between bg-slate-950/92 text-amber-200 border border-amber-500/50 rounded-xl px-3 py-2 shadow-2xl backdrop-blur-md"
                          >
                            <div className="flex items-center space-x-2 min-w-0">
                              <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg shrink-0 animate-pulse">
                                <Lightbulb className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center space-x-1.5">
                                  <span className="text-[11px] font-bold text-amber-200 truncate">
                                    Low Edge Contrast
                                  </span>
                                  <span className="text-[9px] bg-amber-500/20 text-amber-300 font-semibold px-1.5 py-0.2 rounded-full border border-amber-500/30">
                                    AI Lighting Check
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-300 truncate">
                                  Improve lighting or hold closer for clear document scan
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-1 shrink-0 ml-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setCameraFilter('contrast');
                                  setShowContrastToast(false);
                                }}
                                className="text-[10px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1 rounded-lg transition shadow-xs cursor-pointer flex items-center space-x-1"
                                title="Enhance document contrast"
                              >
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>Boost</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowContrastToast(false)}
                                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                                aria-label="Dismiss lighting warning"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </motion.div>

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

                      <button
                        type="button"
                        onClick={() => handleCapturePhoto(true)}
                        className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border border-indigo-500/40 active:scale-95 cursor-pointer"
                        title="Capture this page with active filter and snap next page"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Snap & Add Next</span>
                      </button>

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

      <CustomVoiceModal
        isOpen={showCustomVoiceModal}
        onClose={() => setShowCustomVoiceModal(false)}
        appLanguage={appLanguage}
      />
    </div>
  );
});

export default AiTutorApp;
