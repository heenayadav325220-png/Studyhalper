import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  Volume2,
  Sparkles,
  RefreshCw,
  X,
  BookmarkPlus,
  Bookmark,
  Send,
  RotateCcw,
  Check,
  Sliders,
  Copy,
  SlidersHorizontal,
  Lightbulb,
  HelpCircle,
  Languages,
  Table
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { UserProfile } from '../types';
import { playTutorSpeech } from '../services/voiceSettings';
import { CustomVoiceModal } from './CustomVoiceModal';

interface VoiceTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  appLanguage: string;
  onAddXp?: (amount: number) => void;
  onSaveToNotebook?: (title: string, content: string, tags?: string[]) => Promise<void>;
}

interface VoiceMessage {
  id: string;
  sender: 'student' | 'tutor';
  text: string;
  speechText?: string;
  timestamp: string;
}

const VOICE_PROMPT_SUGGESTIONS = [
  {
    en: "Explain Newton's Third Law with a real-life example",
    hi: "न्यूटन का तीसरा नियम उदाहरण सहित समझाइए",
    subject: "Physics",
    icon: "⚡"
  },
  {
    en: "What is photosynthesis and write its chemical equation?",
    hi: "प्रकाश संश्लेषण क्या है और इसका समीकरण बताइए?",
    subject: "Biology",
    icon: "🌿"
  },
  {
    en: "How to use the Quadratic Formula to find roots?",
    hi: "द्विघात समीकरण (Quadratic Formula) के मूल कैसे निकालें?",
    subject: "Maths",
    icon: "📐"
  },
  {
    en: "Why is water a universal solvent and polar molecule?",
    hi: "पानी को सार्वभौमिक विलायक क्यों कहा जाता है?",
    subject: "Chemistry",
    icon: "🧪"
  }
];

export const VoiceTutorModal: React.FC<VoiceTutorModalProps> = ({
  isOpen,
  onClose,
  user,
  appLanguage,
  onAddXp,
  onSaveToNotebook
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [voiceLang, setVoiceLang] = useState<'hi' | 'en' | 'Hinglish'>(appLanguage === 'hi' ? 'hi' : 'en');
  const [transcript, setTranscript] = useState<string>('');
  const [messages, setMessages] = useState<VoiceMessage[]>([
    {
      id: 'welcome',
      sender: 'tutor',
      text:
        appLanguage === 'hi'
          ? `नमस्ते ${user.name || 'दोस्त'}! मैं आपका पर्सनल वॉयस ट्यूटर हूँ। आप सीधे माइक दबाकर बोलें और मुझसे कोई भी पढ़ाई का सवाल पूछें!`
          : `Hello ${user.name || 'Student'}! I am your AI Voice Tutor. Tap the microphone, ask any study question out loud, and listen to the explanation!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [savedDocId, setSavedDocId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedToolsId, setExpandedToolsId] = useState<string | null>(null);
  const [showCustomVoiceModal, setShowCustomVoiceModal] = useState<boolean>(false);

  const handleCopyText = async (id: string, text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const recognitionRef = useRef<any>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = true;
        recog.lang = voiceLang === 'hi' ? 'hi-IN' : 'en-US';

        recog.onstart = () => {
          setIsListening(true);
        };

        recog.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
        };

        recog.onerror = (event: any) => {
          console.warn('Speech recognition event:', event.error);
          setIsListening(false);
        };

        recog.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recog;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      window.speechSynthesis?.cancel();
    };
  }, [voiceLang]);

  // Scroll to bottom on message
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, transcript, isLoading]);

  // Toggle Microphone
  const toggleListening = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      if (transcript.trim()) {
        handleSubmitSpokenQuestion(transcript.trim());
      }
    } else {
      setTranscript('');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.lang = voiceLang === 'hi' ? 'hi-IN' : 'en-US';
          recognitionRef.current.start();
        } catch (err) {
          console.warn('Could not start recognition:', err);
        }
      } else {
        alert(appLanguage === 'hi' ? 'आपके ब्राउज़र में स्पीच रिकग्निशन समर्थित नहीं है।' : 'Speech recognition not supported in this browser.');
      }
    }
  };

  // Speak AI response with Text-to-Speech using persistent custom voice settings
  const speakText = (text: string) => {
    if (typeof window === 'undefined') return;

    playTutorSpeech(
      text,
      {
        lang: voiceLang === 'hi' ? 'hi-IN' : 'en-US',
        rate: speechRate
      },
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  // Submit Spoken Question
  const handleSubmitSpokenQuestion = async (spokenText: string) => {
    if (!spokenText.trim()) return;

    const userMsg: VoiceMessage = {
      id: 'msg_' + Date.now(),
      sender: 'student',
      text: spokenText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setTranscript('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/voice-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userSpokenText: spokenText.trim(),
          history: messages.map((m) => ({
            role: m.sender === 'student' ? 'user' : 'model',
            text: m.text
          })),
          studentContext: {
            name: user.name,
            className: user.className,
            targetGoal: user.targetGoal
          },
          language: voiceLang
        })
      });

      if (!res.ok) throw new Error('Voice API failed');

      const data = await res.json();
      const tutorMsg: VoiceMessage = {
        id: 'tutor_' + Date.now(),
        sender: 'tutor',
        text: data.responseText,
        speechText: data.speechText || data.responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, tutorMsg]);
      if (onAddXp) onAddXp(15);

      // Auto read out the AI's response in voice
      speakText(data.speechText || data.responseText);
    } catch (err) {
      console.error('Voice Tutor Error:', err);
      const fallbackText =
        voiceLang === 'hi'
          ? 'माफ़ कीजिए, नेटवर्क में समस्या आई। आप दोबारा बोलें, मैं समझाने के लिए तैयार हूँ!'
          : "Sorry, I had trouble processing that audio. Please speak again!";
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          sender: 'tutor',
          text: fallbackText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Save Voice Insight to Notebook
  const handleSaveToNotebook = async (msg: VoiceMessage) => {
    try {
      if (onSaveToNotebook) {
        const title = `🎙️ Voice Tutor: ${msg.text.slice(0, 40)}...`;
        await onSaveToNotebook(title, msg.text, ['Voice Tutor', 'Study Insight']);
      } else {
        const raw = localStorage.getItem('study_notebook_notes') || '[]';
        const parsed = JSON.parse(raw);
        parsed.unshift({
          id: 'note_' + Date.now(),
          title: `🎙️ Voice Tutor: ${msg.text.slice(0, 40)}...`,
          content: msg.text,
          subject: 'Voice Tutor',
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('study_notebook_notes', JSON.stringify(parsed));
      }
      setSavedDocId(msg.id);
      setTimeout(() => setSavedDocId(null), 2500);
    } catch (e) {
      console.error('Error saving voice note:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0b1120] border-2 border-indigo-500/60 rounded-3xl shadow-[0_0_50px_rgba(99,102,241,0.35)] overflow-hidden flex flex-col max-h-[92vh] relative text-slate-100">
        {/* TOP AMBIENT GLOW */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* HEADER BAR */}
        <div className="p-4 border-b border-slate-800/90 bg-slate-950/80 flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md border border-indigo-300/40 shrink-0">
              <Mic className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 uppercase">
                  {appLanguage === 'hi' ? 'लाइव वॉयस ट्यूटर' : 'LIVE VOICE TUTOR'}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                {appLanguage === 'hi' ? 'बोलकर सवाल पूछें' : 'Speak & Listen AI Tutor'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Custom Voice Studio Button */}
            <button
              onClick={() => setShowCustomVoiceModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 transition cursor-pointer"
              title={appLanguage === 'hi' ? 'कस्टम आवाज़, सुर और गति सेट करें' : 'Set Custom Voice & Persona'}
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">{appLanguage === 'hi' ? 'कस्टम आवाज़' : 'Custom Voice'}</span>
            </button>

            {/* Speed toggle */}
            <button
              onClick={() => setSpeechRate((r) => (r === 1.0 ? 1.2 : r === 1.2 ? 0.9 : 1.0))}
              className="text-[10px] font-bold px-2 py-1 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Voice Speed"
            >
              {speechRate}x
            </button>

            {/* Language Pill */}
            <select
              value={voiceLang}
              onChange={(e) => setVoiceLang(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 rounded-xl px-2 py-1 focus:outline-none cursor-pointer"
            >
              <option value="en">English 🇬🇧</option>
              <option value="hi">हिंदी 🇮🇳</option>
              <option value="Hinglish">Hinglish 🗣️</option>
            </select>

            {/* Close Button */}
            <button
              onClick={() => {
                stopSpeaking();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* INTERACTIVE VOICE VISUALIZER & MIC STATUS */}
        <div className="p-4 bg-gradient-to-b from-slate-950/90 to-[#0d1633] border-b border-slate-800/80 flex flex-col items-center justify-center space-y-3 relative overflow-hidden">
          {/* DYNAMIC SOUND WAVE OSCILLOSCOPE */}
          <div className="flex items-center justify-center gap-1.5 h-10 w-full max-w-xs">
            {[40, 75, 95, 60, 85, 100, 70, 90, 50, 80, 60, 40].map((h, i) => (
              <motion.div
                key={i}
                animate={
                  isListening
                    ? {
                        height: [`${h * 0.2}%`, `${h}%`, `${h * 0.4}%`],
                        backgroundColor: ['#6366f1', '#a855f7', '#ec4899', '#6366f1']
                      }
                    : isSpeaking
                    ? {
                        height: [`${h * 0.3}%`, `${h * 0.9}%`, `${h * 0.3}%`],
                        backgroundColor: ['#10b981', '#06b6d4', '#3b82f6', '#10b981']
                      }
                    : {
                        height: '15%',
                        backgroundColor: '#334155'
                      }
                }
                transition={{
                  repeat: Infinity,
                  duration: 0.8,
                  delay: i * 0.05,
                  ease: 'easeInOut'
                }}
                className="w-1.5 rounded-full"
              />
            ))}
          </div>

          {/* MAIN BIG PULSATING MIC BUTTON */}
          <div className="relative">
            {isListening && (
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-0 rounded-full bg-rose-500/40 blur-md pointer-events-none"
              />
            )}
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={toggleListening}
              className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full flex flex-col items-center justify-center shadow-xl transition-all cursor-pointer border-2 relative z-10 ${
                isListening
                  ? 'bg-gradient-to-tr from-rose-600 to-pink-500 border-rose-300 text-white shadow-[0_0_30px_rgba(244,63,94,0.6)]'
                  : isSpeaking
                  ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 border-emerald-300 text-white shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                  : 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 border-indigo-300/60 text-white shadow-[0_0_25px_rgba(99,102,241,0.5)]'
              }`}
            >
              {isListening ? (
                <Mic className="w-8 h-8 animate-bounce" />
              ) : isSpeaking ? (
                <Volume2 className="w-8 h-8 animate-pulse" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </motion.button>
          </div>

          <div className="text-center">
            <span className="text-xs font-black text-white">
              {isListening
                ? (appLanguage === 'hi' ? '🎤 सुन रहा हूँ... बोलिए' : '🎤 Listening... Speak now')
                : isSpeaking
                ? (appLanguage === 'hi' ? '🔊 वॉयस ट्यूटर बोल रहा है...' : '🔊 Voice Tutor is explaining...')
                : (appLanguage === 'hi' ? 'माइक पर टैप करके बोलें (+15 XP)' : 'Tap Mic to Speak (+15 XP)')}
            </span>
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="block mx-auto text-[10px] text-rose-400 hover:text-rose-300 underline font-bold mt-0.5 cursor-pointer"
              >
                {appLanguage === 'hi' ? 'ऑडियो रोकें' : 'Stop Audio'}
              </button>
            )}
          </div>
        </div>

        {/* CHAT TRANSCRIPT & CONVERSATION HISTORY */}
        <div ref={chatScrollRef} className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 min-h-[160px] max-h-[300px]">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isStudent = msg.sender === 'student';
              return (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, y: 16, scale: 0.94, filter: 'blur(3px)' }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -12, scale: 0.9, filter: 'blur(3px)', transition: { duration: 0.2, ease: 'easeOut' } }}
                  transition={{ type: 'spring', stiffness: 420, damping: 28, mass: 0.8 }}
                  className={`flex flex-col ${isStudent ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div
                    className={`max-w-[88%] p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                      isStudent
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-xs'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-xs'
                    }`}
                  >
                    {!isStudent && (
                      <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5">
                        <span className="text-[10px] font-black text-indigo-300 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>ASCEND Voice Tutor</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => speakText(msg.speechText || msg.text)}
                            className="p-1 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition cursor-pointer"
                            title="Replay Audio"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                          {onSaveToNotebook && (
                            <button
                              onClick={() => handleSaveToNotebook(msg)}
                              className={`p-1 hover:bg-white/10 rounded-md transition cursor-pointer ${
                                savedDocId === msg.id ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
                              }`}
                              title="Save to Notebook"
                            >
                              {savedDocId === msg.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <BookmarkPlus className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="prose prose-invert max-w-none text-xs sm:text-sm">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>

                    {/* Always-visible Action Buttons Suite */}
                    {!isStudent && (
                      <>
                        <div className="border-t border-white/10 pt-2 mt-2 flex items-center justify-between flex-wrap gap-1.5">
                          <div className="flex items-center space-x-1 flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={() => handleCopyText(msg.id, msg.text)}
                              title="Copy text"
                              className="bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-medium px-2 py-1 rounded-lg flex items-center space-x-1 transition cursor-pointer active:scale-95"
                            >
                              {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                              <span className="hidden xs:inline">{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => speakText(msg.speechText || msg.text)}
                              title="Listen"
                              className="bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-medium px-2 py-1 rounded-lg flex items-center space-x-1 transition cursor-pointer active:scale-95"
                            >
                              <Volume2 className="w-3 h-3 text-slate-400" />
                              <span className="hidden xs:inline">Listen</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSaveToNotebook(msg)}
                              title="Save to notebook"
                              className="bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-medium px-2 py-1 rounded-lg flex items-center space-x-1 transition cursor-pointer active:scale-95"
                            >
                              <Bookmark className="w-3 h-3 text-slate-400" />
                              <span className="hidden xs:inline">{savedDocId === msg.id ? 'Saved ✓' : 'Save Note'}</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setExpandedToolsId(expandedToolsId === msg.id ? null : msg.id)}
                            title="Study Tools"
                            className={`text-[11px] font-semibold px-2 py-1 rounded-lg flex items-center space-x-1 transition cursor-pointer active:scale-95 ${
                              expandedToolsId === msg.id
                                ? 'bg-indigo-600 text-white'
                                : 'bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/60'
                            }`}
                          >
                            <SlidersHorizontal className="w-3 h-3" />
                            <span>{expandedToolsId === msg.id ? 'Hide Tools' : 'Study Tools'}</span>
                          </button>
                        </div>

                        {expandedToolsId === msg.id && (
                          <div className="bg-black/40 border border-indigo-500/30 p-2 rounded-xl mt-2 flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSubmitSpokenQuestion(`Can you explain "${msg.text.slice(0, 80)}" in simpler terms with a super easy everyday analogy?`)}
                              className="bg-white/5 hover:bg-indigo-600/30 border border-white/10 hover:border-indigo-400 text-slate-200 text-[10px] font-medium px-2 py-1 rounded-md flex items-center gap-1 transition cursor-pointer"
                            >
                              <Lightbulb className="w-3 h-3 text-amber-400" />
                              <span>Explain Simpler</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSubmitSpokenQuestion(`Give me 1 practice question based on "${msg.text.slice(0, 80)}" to test my understanding.`)}
                              className="bg-white/5 hover:bg-indigo-600/30 border border-white/10 hover:border-indigo-400 text-slate-200 text-[10px] font-medium px-2 py-1 rounded-md flex items-center gap-1 transition cursor-pointer"
                            >
                              <HelpCircle className="w-3 h-3 text-indigo-400" />
                              <span>Practice Question</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSubmitSpokenQuestion(`Please explain "${msg.text.slice(0, 80)}" in easy Hinglish with important exam points.`)}
                              className="bg-white/5 hover:bg-indigo-600/30 border border-white/10 hover:border-indigo-400 text-slate-200 text-[10px] font-medium px-2 py-1 rounded-md flex items-center gap-1 transition cursor-pointer"
                            >
                              <Languages className="w-3 h-3 text-purple-400" />
                              <span>JEE Main / Hinglish</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSubmitSpokenQuestion(`Summarize "${msg.text.slice(0, 80)}" in a clean structured summary.`)}
                              className="bg-white/5 hover:bg-indigo-600/30 border border-white/10 hover:border-indigo-400 text-slate-200 text-[10px] font-medium px-2 py-1 rounded-md flex items-center gap-1 transition cursor-pointer"
                            >
                              <Table className="w-3 h-3 text-teal-400" />
                              <span>Summary</span>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 px-1">{msg.timestamp}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* LIVE TRANSCRIPT BUBBLE WHILE SPEAKING */}
          <AnimatePresence>
            {transcript && isListening && (
              <motion.div 
                key="voice-live-transcript"
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.9, transition: { duration: 0.18 } }}
                className="flex flex-col items-end space-y-1 animate-pulse"
              >
                <div className="max-w-[88%] p-3 rounded-2xl text-xs bg-indigo-900/60 border border-indigo-400 text-indigo-100 rounded-br-xs italic">
                  "{transcript}"
                </div>
                <span className="text-[9px] text-indigo-400">Transcribing live...</span>
              </motion.div>
            )}

            {isLoading && (
              <motion.div 
                key="voice-loading"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="flex items-center space-x-2 text-xs text-indigo-300 p-2"
              >
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                <span>{appLanguage === 'hi' ? 'वॉयस ट्यूटर सोच रहा है...' : 'Voice Tutor is preparing explanation...'}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* QUICK SUGGESTIONS CAROUSEL */}
        <div className="p-2.5 bg-slate-950 border-t border-slate-800 space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
            {appLanguage === 'hi' ? '💡 तुरंत पूछें (Tap to Ask):' : '💡 Tap to Ask Instantly:'}
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {VOICE_PROMPT_SUGGESTIONS.map((sugg, idx) => {
              const text = voiceLang === 'hi' ? sugg.hi : sugg.en;
              return (
                <button
                  key={idx}
                  onClick={() => handleSubmitSpokenQuestion(text)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-950 border border-slate-800 hover:border-indigo-500/50 text-[11px] font-bold text-slate-300 hover:text-white whitespace-nowrap transition cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <span>{sugg.icon}</span>
                  <span>{text}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* BOTTOM TEXT FALLBACK INPUT */}
        <div className="p-3 bg-slate-950/95 border-t border-slate-800/90 flex items-center gap-2">
          <input
            type="text"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && transcript.trim()) {
                handleSubmitSpokenQuestion(transcript.trim());
              }
            }}
            placeholder={
              appLanguage === 'hi'
                ? 'या यहाँ टाइप करके पूछें...'
                : 'Or type your question here...'
            }
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
          <button
            onClick={() => {
              if (transcript.trim()) {
                handleSubmitSpokenQuestion(transcript.trim());
              }
            }}
            disabled={!transcript.trim() || isLoading}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Persistent Custom Voice Modal */}
      <CustomVoiceModal
        isOpen={showCustomVoiceModal}
        onClose={() => setShowCustomVoiceModal(false)}
        appLanguage={appLanguage}
      />
    </div>
  );
};
