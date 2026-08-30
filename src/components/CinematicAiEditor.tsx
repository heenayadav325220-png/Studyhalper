import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Terminal,
  Mic,
  Volume2,
  VolumeX,
  Sparkles,
  Send,
  X,
  ArrowUpRight,
  Code2,
  RotateCcw,
  Check
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { UiCustomization, UserProfile } from '../types';
import { playUiSound } from '../services/soundEffects';

interface CinematicAiEditorProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  appLanguage: 'en' | 'hi';
  currentTab: string;
  customization: UiCustomization;
  onUpdateCustomization: (updated: UiCustomization) => void;
  onSaveToNotebook?: (title: string, content: string, tags?: string[]) => Promise<void>;
  onNavigateTab?: (tab: any, toolId?: string) => void;
  onAddXp?: (amount: number) => void;
}

interface EditorMessage {
  id: string;
  sender: 'user' | 'editor';
  text: string;
  speechText?: string;
  timestamp: string;
  actionsExecuted?: Array<{
    type: string;
    details: string;
    icon?: string;
  }>;
}

export const CinematicAiEditor: React.FC<CinematicAiEditorProps> = ({
  isOpen,
  onClose,
  user,
  appLanguage,
  currentTab,
  customization,
  onUpdateCustomization,
  onSaveToNotebook,
  onNavigateTab,
  onAddXp
}) => {
  const [messages, setMessages] = useState<EditorMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'editor',
      text: appLanguage === 'hi' 
        ? `### ⚡ **CORE AI APP EDITOR & COPILOT सक्रिय है**\nमैं आपका अल्टीमेट सिनेमैटिक AI एडिटर हूँ। आप मुझे **बोलकर** या **लिखकर** कोई भी निर्देश दें — मैं पूरे ऐप का डिज़ाइन बदल सकता हूँ, नोट्स बनाकर ऑटोमैटिक सेव कर सकता हूँ, टूल्स खोल सकता हूँ या कुछ भी नया बना सकता हूँ!\n\n**त्वरित कमांड आज़माएं:**\n- *"लीडरबोर्ड का कलर ब्लैक कर दो"*\n- *"Photosynthesis के रिवीजन नोट्स बनाकर नोटबुक में सेव कर दो"*\n- *"App का थीम Midnight AMOLED और साउंड Cyber Synth कर दो"*\n- *"Whiteboard ओपन करो"*`
        : `### ⚡ **CORE CINEMATIC AI APP EDITOR & COPILOT ONLINE**\nI am your master AI app editor. Give me any instruction by **speaking** or **typing** — I can redesign the app live (e.g. make the leaderboard black), create and auto-save notes to your notebook, navigate between tools, customize themes, and execute commands instantly.\n\n**Try quick instructions:**\n- *"Make the leaderboard color pitch black"*\n- *"Generate notes on Newton's Laws and save them to my notebook"*\n- *"Change app theme to Midnight AMOLED with high neon glow"*\n- *"Open the interactive Whiteboard"*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionsExecuted: [
        { type: 'INITIALIZE', details: 'Cinematic HUD Engine Ready', icon: '⚡' }
      ]
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voicePlaybackEnabled, setVoicePlaybackEnabled] = useState(true);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [isSpeakingNow, setIsSpeakingNow] = useState(false);

  const [showCssInspector, setShowCssInspector] = useState(false);
  const [liveCssDraft, setLiveCssDraft] = useState(customization.customCss || '');

  // Keep liveCssDraft synced
  useEffect(() => {
    setLiveCssDraft(customization.customCss || '');
  }, [customization.customCss]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Voice Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = false;
      recognizer.interimResults = false;
      recognizer.lang = appLanguage === 'hi' ? 'hi-IN' : 'en-US';

      recognizer.onstart = () => {
        setIsListening(true);
      };

      recognizer.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputPrompt(transcript);
          // Auto execute if high confidence voice command
          executeCommand(transcript);
        }
      };

      recognizer.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognizer.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognizer;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [appLanguage]);

  // Voice TTS Engine
  const speakText = (text: string) => {
    if (!voicePlaybackEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*#`_~[\]()]/g, ' ').replace(/\s+/g, ' ').trim();
      if (!clean) return;

      const utterance = new SpeechSynthesisUtterance(clean.slice(0, 300));
      utterance.rate = speechRate;
      utterance.pitch = 1.0;
      utterance.lang = appLanguage === 'hi' ? 'hi-IN' : 'en-US';

      utterance.onstart = () => setIsSpeakingNow(true);
      utterance.onend = () => setIsSpeakingNow(false);
      utterance.onerror = () => setIsSpeakingNow(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS speak error:", e);
      setIsSpeakingNow(false);
    }
  };

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser. Please type your instruction.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Could not start recognition:", err);
      }
    }
  };

  // Main Command Execution
  const executeCommand = async (customText?: string) => {
    const promptToRun = (customText || inputPrompt).trim();
    if (!promptToRun || isLoading) return;

    playUiSound(customization.audioFeedback);
    setInputPrompt('');

    const userMsg: EditorMessage = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: promptToRun,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai-editor-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: promptToRun,
          history: messages.slice(-4).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text
          })),
          currentCustomization: customization,
          currentTab,
          language: appLanguage
        })
      });

      const data = await res.json();
      const actionsExecuted: Array<{ type: string; details: string; icon?: string }> = [];

      // Process actions returned by AI
      let hasUiCustomization = false;
      if (Array.isArray(data.actions)) {
        for (const act of data.actions) {
          if (act.type === 'UPDATE_UI_CUSTOMIZATION' && act.payload) {
            hasUiCustomization = true;
            let customCss = act.payload.customCss;
            
            // If customCss styles #main-app-container background, ensure #app-wallpaper-layer is also covered
            if (customCss && customCss.includes('#main-app-container') && !customCss.includes('#app-wallpaper-layer')) {
              const bgMatch = customCss.match(/#main-app-container\s*\{[^}]*background[^;:]*:\s*([^;]+);?[^}]*\}/i);
              if (bgMatch && bgMatch[1]) {
                customCss += `\n#app-wallpaper-layer { background: ${bgMatch[1]} !important; background-image: none !important; opacity: 1 !important; }\n#app-vignette-layer { opacity: 0.3 !important; }`;
              }
            }

            const updated = { ...customization, ...act.payload, customCss };
            onUpdateCustomization(updated);

            // Direct live style tag injection for zero-latency preview
            if (customCss !== undefined) {
              const liveStyleEl = document.getElementById('ai-editor-live-styles');
              if (liveStyleEl) {
                liveStyleEl.innerHTML = customCss;
              }
            }
            
            const detailLabels = Object.entries(act.payload)
              .filter(([k]) => k !== 'customCss')
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ');
            actionsExecuted.push({
              type: 'UI_CUSTOMIZED',
              details: customCss ? `Live CSS Injected (${detailLabels || 'Background & Styles Applied'})` : `Live Redesign Applied (${detailLabels})`,
              icon: '🎨'
            });
          }

          if (act.type === 'CREATE_NOTE' && act.payload) {
            const { title, content, tags } = act.payload;
            if (onSaveToNotebook) {
              await onSaveToNotebook(title || 'AI Editor Notes', content || '', tags || ['AI Editor']);
            }
            actionsExecuted.push({
              type: 'NOTE_SAVED',
              details: `Auto-saved note: "${title || 'Study Notes'}" in Notebook`,
              icon: '📝'
            });
          }

          if (act.type === 'NAVIGATE_TAB' && act.payload?.tab) {
            if (onNavigateTab) {
              onNavigateTab(act.payload.tab, act.payload.toolId);
            }
            actionsExecuted.push({
              type: 'NAVIGATED',
              details: `Navigated to ${act.payload.tab.toUpperCase()}`,
              icon: '🚀'
            });
          }

          if (act.type === 'AWARD_XP' && act.payload?.amount) {
            if (onAddXp) {
              onAddXp(act.payload.amount);
            }
            actionsExecuted.push({
              type: 'XP_AWARDED',
              details: `+${act.payload.amount} Bonus XP Awarded`,
              icon: '⚡'
            });
          }
        }
      }

      // CLIENT-SIDE FALLBACK: If AI returned CSS in text or if user asked for background change but no UI action was formed
      if (!hasUiCustomization) {
        const fullReply = (data.markdownReply || '') + ' ' + (data.speechReply || '');
        const promptLower = promptToRun.toLowerCase();
        
        let clientCss = '';
        const cssMatch = fullReply.match(/```css\s*([\s\S]*?)\s*```/);
        if (cssMatch && cssMatch[1]) {
          clientCss = cssMatch[1].trim();
        } else if (fullReply.includes('#main-app-container') || fullReply.includes('#toolkit-banner-section') || fullReply.includes('#app-wallpaper-layer')) {
          const blockMatch = fullReply.match(/(#[a-zA-Z0-9_-]+\s*\{[\s\S]*?\})/);
          if (blockMatch && blockMatch[1]) {
            clientCss = blockMatch[1].trim();
          }
        }

        // If user prompt was about changing background/wallpaper
        if (promptLower.includes('background') || promptLower.includes('बैकग्राउंड') || promptLower.includes('wallpaper') || promptLower.includes('वॉलपेपर') || promptLower.includes('bg')) {
          if (!clientCss) {
            clientCss = `
#app-wallpaper-layer {
  background: radial-gradient(circle at 50% 20%, #1e1b4b 0%, #0c1222 55%, #030712 100%) !important;
  background-image: none !important;
  opacity: 1 !important;
}
#app-vignette-layer {
  opacity: 0.3 !important;
}
#main-app-container {
  background: #030712 !important;
}`;
          }
        }

        if (clientCss) {
          if (clientCss.includes('#main-app-container') && !clientCss.includes('#app-wallpaper-layer')) {
            clientCss += `\n#app-wallpaper-layer { background: radial-gradient(circle at 50% 20%, #1e1b4b 0%, #0c1222 55%, #030712 100%) !important; background-image: none !important; opacity: 1 !important; }\n#app-vignette-layer { opacity: 0.3 !important; }`;
          }

          const previousCss = customization.customCss || '';
          const merged = (previousCss + '\n' + clientCss).trim();
          const updated = { ...customization, customCss: merged };
          onUpdateCustomization(updated);

          const liveStyleEl = document.getElementById('ai-editor-live-styles');
          if (liveStyleEl) {
            liveStyleEl.innerHTML = merged;
          }

          actionsExecuted.push({
            type: 'UI_CUSTOMIZED',
            details: 'Live CSS & Background Injected into DOM',
            icon: '🌌'
          });
        }
      }

      const botMsg: EditorMessage = {
        id: 'bot_' + Date.now(),
        sender: 'editor',
        text: data.markdownReply || data.speechReply || 'Command executed.',
        speechText: data.speechReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionsExecuted
      };

      setMessages((prev) => [...prev, botMsg]);

      // Speak response if voice playback active
      if (data.speechReply && voicePlaybackEnabled) {
        speakText(data.speechReply);
      }
    } catch (err: any) {
      console.warn("Editor execution failed:", err);
      const fallbackMsg: EditorMessage = {
        id: 'err_' + Date.now(),
        sender: 'editor',
        text: appLanguage === 'hi'
          ? "⚠️ निर्देश संसाधित करने में समस्या हुई। कृपया पुनः प्रयास करें।"
          : "⚠️ Could not process instruction. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    { label: '⚪ White Toolkit', prompt: appLanguage === 'hi' ? 'Advanced toolkit ka colour white karde' : 'Make the advanced study toolkit color pure white' },
    { label: '🖤 Black Leaderboard', prompt: appLanguage === 'hi' ? 'लीडरबोर्ड का कलर ब्लैक कर दो' : 'Make the leaderboard color obsidian black' },
    { label: '🌟 Gold Toolkit', prompt: appLanguage === 'hi' ? 'Toolkit ka colour royal gold kardo' : 'Make the study toolkit color royal imperial gold' },
    { label: '📝 Save Physics Notes', prompt: appLanguage === 'hi' ? 'Thermodynamics के डिटेल्ड नोट्स बनाकर सेव कर दो' : 'Generate thermodynamics revision notes and save to notebook' },
    { label: '🌌 Midnight AMOLED', prompt: appLanguage === 'hi' ? 'App का थीम Midnight AMOLED और नियॉन हाई कर दो' : 'Change app theme to Midnight AMOLED with high neon' },
    { label: '🎨 Open Whiteboard', prompt: appLanguage === 'hi' ? 'Whiteboard ओपन करो' : 'Open the interactive whiteboard' },
    { label: '🔄 Reset Styles', prompt: appLanguage === 'hi' ? 'सभी कस्टम स्टाइल रीसेट कर दो' : 'Reset all custom styles and dynamic CSS to default' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      {/* CINEMATIC HUD CONTAINER */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-4xl h-[92vh] max-h-[880px] bg-[#070b14] border-2 border-cyan-500/60 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.35)] flex flex-col overflow-hidden relative"
      >
        {/* CINEMATIC SCANLINE & GRID OVERLAY */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-cyan-500/5 via-transparent to-purple-500/10" />

        {/* 1. TOP CINEMATIC HUD HEADER */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#0a101f]/95 border-b border-cyan-500/30 flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <div className="w-full h-full bg-[#070b14] rounded-[14px] flex items-center justify-center text-cyan-300">
                <Terminal className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-mono font-black text-sm sm:text-base text-white tracking-wider flex items-center gap-1.5">
                  <span>AI APP EDITOR</span>
                  <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 rounded-full font-sans font-extrabold uppercase">
                    COPILOT
                  </span>
                </h3>
                {isSpeakingNow && (
                  <div className="flex items-center space-x-0.5">
                    <span className="w-1 h-3 bg-cyan-400 animate-pulse rounded-full" />
                    <span className="w-1 h-4 bg-pink-400 animate-pulse rounded-full delay-75" />
                    <span className="w-1 h-2 bg-emerald-400 animate-pulse rounded-full delay-150" />
                  </div>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-cyan-200/60 font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>Voice & Text Live Command System • Natural Language App Control</span>
              </p>
            </div>
          </div>

          {/* Quick HUD Controls */}
          <div className="flex items-center space-x-2">
            {/* Live CSS Inspector Toggle */}
            <button
              onClick={() => setShowCssInspector(!showCssInspector)}
              className={`px-2.5 py-1.5 rounded-xl border transition cursor-pointer flex items-center gap-1.5 text-xs font-mono font-bold ${
                showCssInspector || customization.customCss
                  ? 'bg-indigo-500/20 border-indigo-400/50 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.3)]'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Inspect Live Injected CSS Overrides"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">LIVE CSS</span>
              {customization.customCss && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
            </button>

            {/* TTS Toggle */}
            <button
              onClick={() => setVoicePlaybackEnabled(!voicePlaybackEnabled)}
              className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-1 text-xs font-bold ${
                voicePlaybackEnabled
                  ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
              title="Toggle Audio Voice Playback"
            >
              {voicePlaybackEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Speed selection */}
            {voicePlaybackEnabled && (
              <button
                onClick={() => setSpeechRate((r) => (r === 1.0 ? 1.2 : r === 1.2 ? 0.9 : 1.0))}
                className="px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-[11px] font-mono text-cyan-300 font-bold hover:border-cyan-500 transition cursor-pointer"
                title="Voice Speed"
              >
                {speechRate}x
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 hover:border-red-400 text-slate-300 hover:text-red-400 flex items-center justify-center transition cursor-pointer"
              title="Exit Editor"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* LIVE CSS INSPECTOR PANEL */}
        {showCssInspector && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 sm:px-6 py-3 bg-[#050811] border-b border-indigo-500/40 text-xs font-mono z-20"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-indigo-300 font-bold">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span>ACTIVE LIVE CSS INJECTION RULES</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const updated = { ...customization, customCss: '' };
                    onUpdateCustomization(updated);
                    const liveStyleEl = document.getElementById('ai-editor-live-styles');
                    if (liveStyleEl) liveStyleEl.innerHTML = '';
                    setLiveCssDraft('');
                  }}
                  className="px-2 py-1 rounded bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-900 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>CLEAR CSS</span>
                </button>
                <button
                  onClick={() => {
                    const updated = { ...customization, customCss: liveCssDraft };
                    onUpdateCustomization(updated);
                    const liveStyleEl = document.getElementById('ai-editor-live-styles');
                    if (liveStyleEl) liveStyleEl.innerHTML = liveCssDraft;
                  }}
                  className="px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                >
                  <Check className="w-3 h-3" />
                  <span>APPLY EDITS</span>
                </button>
              </div>
            </div>
            <textarea
              value={liveCssDraft}
              onChange={(e) => setLiveCssDraft(e.target.value)}
              placeholder="/* No custom CSS injected yet. Instruct AI Copilot to redesign anything (e.g. 'advanced toolkit white kar do')! */"
              rows={4}
              className="w-full bg-[#02040a] border border-indigo-900/60 rounded-xl p-2.5 text-[11px] font-mono text-cyan-200 focus:outline-none focus:border-cyan-400 resize-y"
            />
          </motion.div>
        )}

        {/* 2. CHAT & COMMAND HISTORY LOG */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 font-sans relative z-10 scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-transparent">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center space-x-2 mb-1 px-1">
                <span className="text-[10px] font-mono font-bold text-cyan-400/80 uppercase">
                  {msg.sender === 'user' ? `👤 ${user.name || 'Student'}` : '🤖 CORE AI EDITOR'}
                </span>
                <span className="text-[9px] font-mono text-slate-500">{msg.timestamp}</span>
              </div>

              <div
                className={`max-w-[92%] sm:max-w-[82%] p-4 rounded-2xl shadow-lg border relative ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-cyan-950 to-indigo-950 border-cyan-500/50 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : 'bg-[#0b1326] border-indigo-500/40 text-slate-100 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                }`}
              >
                <div className="prose prose-invert prose-sm max-w-none text-xs sm:text-sm leading-relaxed">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>

                {/* ACTION EXECUTION BADGES */}
                {msg.actionsExecuted && msg.actionsExecuted.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-cyan-400 font-extrabold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        <span>ACTIONS EXECUTED LIVE:</span>
                      </span>
                      <button
                        onClick={onClose}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] font-mono flex items-center gap-1 shadow-[0_0_12px_rgba(16,185,129,0.4)] cursor-pointer transition active:scale-95"
                      >
                        <span>👁️</span>
                        <span>{appLanguage === 'hi' ? 'ऐप देखें (View App)' : 'View Live App'}</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.actionsExecuted.map((act, i) => (
                        <div
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-400/40 text-[10.5px] font-mono text-cyan-200 flex items-center gap-1.5 shadow-xs"
                        >
                          <span>{act.icon || '⚡'}</span>
                          <span className="font-semibold">{act.details}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* LOADING STATE */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-3 p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl w-fit"
            >
              <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono text-cyan-300 animate-pulse">
                {appLanguage === 'hi' ? 'निर्देश निष्पादित किया जा रहा है...' : 'Analyzing & executing command across app...'}
              </span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 3. QUICK SUGGESTION CHIPS */}
        <div className="px-4 py-2 bg-[#060a14] border-t border-cyan-900/40 flex items-center space-x-2 overflow-x-auto scrollbar-none relative z-10">
          <span className="text-[9.5px] font-mono text-cyan-400 font-bold uppercase shrink-0">
            {appLanguage === 'hi' ? 'त्वरित प्रॉम्प्ट:' : 'PROMPTS:'}
          </span>
          {samplePrompts.map((item, idx) => (
            <button
              key={idx}
              onClick={() => executeCommand(item.prompt)}
              className="px-3 py-1 bg-cyan-950/60 hover:bg-cyan-900/90 border border-cyan-700/50 hover:border-cyan-400 rounded-full text-[11px] font-mono text-cyan-200 hover:text-white whitespace-nowrap transition cursor-pointer shrink-0 shadow-xs flex items-center gap-1"
            >
              <span>{item.label}</span>
              <ArrowUpRight className="w-3 h-3 text-cyan-400" />
            </button>
          ))}
        </div>

        {/* 4. BOTTOM INPUT & VOICE COMMAND BAR */}
        <div className="p-3 sm:p-4 bg-[#090f1d] border-t border-cyan-500/30 relative z-10">
          {isListening && (
            <div className="mb-2 p-2 bg-pink-950/80 border border-pink-500/50 rounded-xl flex items-center justify-between animate-pulse">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-400 animate-ping" />
                <span className="text-xs font-mono font-bold text-pink-200">
                  {appLanguage === 'hi' ? 'सुन रहा हूँ... बोलिए...' : 'Listening to your voice instruction...'}
                </span>
              </div>
              <button
                onClick={toggleMic}
                className="text-[10px] font-mono font-bold bg-pink-500 text-white px-2 py-0.5 rounded-md cursor-pointer"
              >
                STOP
              </button>
            </div>
          )}

          <div className="flex items-center space-x-2">
            {/* Glowing Voice Mic Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleMic}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition cursor-pointer shrink-0 shadow-md ${
                isListening
                  ? 'bg-pink-600 text-white shadow-[0_0_20px_rgba(236,72,153,0.8)] border-2 border-pink-300 animate-bounce'
                  : 'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
              }`}
              title="Speak instruction via voice"
            >
              {isListening ? <Mic className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </motion.button>

            {/* Input field */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    executeCommand();
                  }
                }}
                placeholder={
                  appLanguage === 'hi'
                    ? 'आदेश दें (उदा. "लीडरबोर्ड को ब्लैक करो", "नोट्स बनाओ")...'
                    : 'Command anything (e.g. "make leaderboard black", "generate physics notes")...'
                }
                className="w-full bg-[#060b17] border border-cyan-500/40 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-mono shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
              />
            </div>

            {/* Send Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => executeCommand()}
              disabled={!inputPrompt.trim() || isLoading}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition cursor-pointer shrink-0 ${
                inputPrompt.trim() && !isLoading
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] border border-cyan-300/40'
                  : 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
              title="Execute Command"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
