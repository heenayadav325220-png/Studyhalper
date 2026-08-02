import { useState, useRef, useEffect, memo } from 'react';
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
  FileCode2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getStudyAnswer } from '../services/geminiService';
import type { Subject } from '../types';

interface AiTutorAppProps {
  user: {
    uid: string;
    name: string;
    xp: number;
    level: number;
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
}

const SUBJECT_LIST: Subject[] = ['Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology', 'English'];

const QUICK_PROMPTS = [
  { icon: Calculator, label: "Solve Equation", prompt: "Solve step-by-step: 2x² + 5x - 3 = 0" },
  { icon: Compass, label: "Explain Concept", prompt: "Explain Newton's Laws of Motion with real-world everyday analogies." },
  { icon: BrainCircuit, label: "Photosynthesis", prompt: "Explain the Light and Dark reactions in Photosynthesis in simple bullet points." },
  { icon: FileCode2, label: "English Essay", prompt: "Help me write an outline for an argumentative essay on AI in Education." }
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
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved tutor chat", e);
      }
    }
    return [];
  });

  const [inputQuery, setInputQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject>('Science');
  const [tutorMode, setTutorMode] = useState<'homework' | 'explain' | 'step' | 'quiz'>('homework');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (customText?: string | unknown) => {
    const queryText = typeof customText === 'string' ? customText : inputQuery;
    if (!queryText || typeof queryText !== 'string' || !queryText.trim() || isLoading) return;

    const cleanQuery = queryText.trim();
    const userMsgId = 'msg_' + Date.now();
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: cleanQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subject: selectedSubject,
      mode: tutorMode
    };

    setMessages((prev) => [...prev, userMsg]);
    if (typeof customText !== 'string') setInputQuery('');
    setIsLoading(true);

    try {
      // Formulate prompt context based on subject and mode
      let promptContext = `[Subject: ${selectedSubject} | Mode: ${tutorMode}] ${cleanQuery}`;
      if (tutorMode === 'step') {
        promptContext = `Provide a strict step-by-step mathematical or scientific solution with explanation for each step: ${cleanQuery}`;
      } else if (tutorMode === 'explain') {
        promptContext = `Explain the following concept clearly using intuitive analogies, bullet points, and key takeaways suitable for a student: ${cleanQuery}`;
      } else if (tutorMode === 'quiz') {
        promptContext = `Generate a 3-question mini practice quiz with answer key and explanations for: ${cleanQuery}`;
      }

      const answer = await getStudyAnswer(promptContext);

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
          messages.map((msg) => (
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
                  <p className="text-xs text-white whitespace-pre-wrap leading-relaxed font-medium">
                    {msg.text}
                  </p>
                ) : (
                  <div className="markdown-body text-xs text-slate-200 leading-relaxed space-y-2">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                )}

                {/* AI ACTION TOOLBAR */}
                {msg.sender === 'ai' && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
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

                    <span className="text-[9px] text-slate-500 font-semibold">Ascend AI</span>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-1 shadow-xs">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
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
      <footer className="bg-slate-900 border-t border-slate-800 p-3 sm:p-4 shrink-0">
        <div className="max-w-3xl mx-auto space-y-2">
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

            <textarea
              rows={1}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={isListening ? "Listening to your voice..." : `Ask AI Tutor about ${selectedSubject}... (Press Enter)`}
              className="flex-1 bg-transparent border-0 px-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none max-h-24 py-2"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputQuery.trim() || isLoading}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center shrink-0"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
            <span>Subject: <strong className="text-slate-300">{selectedSubject}</strong></span>
            <span>Shift + Enter for new line</span>
          </div>
        </div>
      </footer>
    </div>
  );
});

export default AiTutorApp;
