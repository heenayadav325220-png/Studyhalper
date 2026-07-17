import React, { useState, useRef, useEffect } from 'react';
import { Language, t } from '../services/translations';
import { Send, Sparkles, BookOpen, User, HelpCircle } from 'lucide-react';
import Markdown from 'react-markdown';

interface TutorChatPanelProps {
  lang: Language;
  onEarnXp: (amount: number) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const PRESETS = [
  { en: "Explain Quantum Physics simply", hi: "क्वांटम भौतिकी को सरल रूप में समझाएं" },
  { en: "Solve the equation: x^2 - 5x + 6 = 0", hi: "समीकरण हल करें: x^2 - 5x + 6 = 0" },
  { en: "What is the capital of India and its history?", hi: "भारत की राजधानी क्या है और इसका इतिहास?" }
];

export const TutorChatPanel: React.FC<TutorChatPanelProps> = ({ lang, onEarnXp }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: lang === 'en'
        ? "Hello! I am **ASCEND TUTOR**, your dedicated academic guide. Ask me any question, paste math equations, or request custom study roadmaps!"
        : "नमस्ते! मैं **असेंड ट्यूटर** हूँ, आपका समर्पित शैक्षणिक गाइड। मुझसे कोई भी प्रश्न पूछें, गणित के समीकरण पेस्ट करें, या कस्टम अध्ययन रोडमैप का अनुरोध करें!"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const newMessages = [...messages, { role: 'user' as const, content: textToSend }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/tutor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, language: lang })
      });

      if (!res.ok) {
        throw new Error('Tutor is currently offline. Please ensure GEMINI_API_KEY is configured.');
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
      onEarnXp(15); // Earn 15 XP per question asked
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ **Error:** ${err.message || 'Something went wrong.'}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[550px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
            🎓
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">ASCEND AI Tutor</h3>
            <p className="text-[10px] text-emerald-400 font-mono">● {lang === 'en' ? 'Online' : 'ऑनलाइन'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs px-2.5 py-1 rounded-full font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          gemini-3.5-flash
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, index) => (
          <div
            key={index}
            className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white ${m.role === 'user' ? 'bg-violet-600' : 'bg-indigo-600'}`}>
              {m.role === 'user' ? <User className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
            </div>
            <div className={`rounded-2xl p-4 text-sm ${m.role === 'user' ? 'bg-violet-600/20 border border-violet-500/20 text-slate-100' : 'bg-slate-950 border border-slate-800 text-slate-200'}`}>
              <div className="markdown-body">
                <Markdown>{m.content}</Markdown>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 max-w-[80%]">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center gap-2 text-sm text-slate-400">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Presets */}
      {messages.length === 1 && (
        <div className="px-4 py-2 flex flex-wrap gap-2 bg-slate-950/40">
          {PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(lang === 'en' ? p.en : p.hi)}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-indigo-400 px-3 py-1.5 rounded-lg transition duration-150 flex items-center gap-1.5 active:scale-95 text-left"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
              {lang === 'en' ? p.en : p.hi}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('typeMessagePlaceholder', lang)}
            className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition duration-150 flex items-center gap-2 active:scale-95"
          >
            <Send className="w-4 h-4" />
            {t('sendMessage', lang)}
          </button>
        </form>
      </div>
    </div>
  );
};
