import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserProfile,
  ChatMessage
} from './types';
import { Language, t } from './services/translations';
import {
  authenticateAnonymously,
  getUserProfile,
  saveUserProfile,
  subscribeToChats,
  sendChatMessage
} from './services/firebaseDb';

// Import sub-components
import { PetCompanionWidget } from './components/PetCompanionWidget';
import { TutorChatPanel } from './components/TutorChatPanel';
import { WhiteboardPanel } from './components/WhiteboardPanel';
import { MockExamPanel } from './components/MockExamPanel';
import { StudyDocsPanel } from './components/StudyDocsPanel';

// Icons
import {
  Sparkles,
  Flame,
  Globe,
  MessageSquare,
  Palette,
  BrainCircuit,
  FileText,
  User,
  Trophy,
  Activity
} from 'lucide-react';

export default function App() {
  // Authentication & Profile States
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [appLanguage, setAppLanguage] = useState<Language>('en');

  // Interactive tab state
  const [activeTab, setActiveTab] = useState<'home' | 'tutor' | 'whiteboard' | 'exam' | 'docs'>('home');

  // Room Collaboration state
  const roomId = 'global-study-room';
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');

  // Handle Authentication on Mount
  useEffect(() => {
    authenticateAnonymously(async (firebaseUser) => {
      setUser(firebaseUser);

      // Fetch or Initialize student profile
      const userProfile = await getUserProfile(firebaseUser.uid);
      if (userProfile) {
        setProfile(userProfile);
        setAppLanguage(userProfile.language);
      } else {
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || `Student #${Math.floor(Math.random() * 9000) + 1000}`,
          xp: 150,
          level: 1,
          streak: 3, // starting study streak
          petLevel: 1,
          petXp: 10,
          petName: 'Budo the Owl',
          language: 'en',
          lastActive: new Date().toISOString()
        };
        await saveUserProfile(newProfile);
        setProfile(newProfile);
      }
    });
  }, []);

  // Subscribe to real-time chats if in Study Room
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToChats(roomId, (messages) => {
      setChatMessages(messages);
    });
    return () => unsubscribe();
  }, [user, roomId]);

  const handleUpdateProfile = async (updated: Partial<UserProfile>) => {
    if (!profile) return;
    const newProfile = { ...profile, ...updated };
    setProfile(newProfile);
    await saveUserProfile(newProfile);
  };

  const handleEarnXp = (amount: number) => {
    if (!profile) return;
    const newXp = profile.xp + amount;
    const levelUpNeeded = profile.level * 500;
    let nextLevel = profile.level;
    let finalXp = newXp;

    if (finalXp >= levelUpNeeded) {
      finalXp -= levelUpNeeded;
      nextLevel += 1;
    }

    handleUpdateProfile({
      xp: finalXp,
      level: nextLevel
    });
  };

  const handleLanguageToggle = () => {
    const nextLang: Language = appLanguage === 'en' ? 'hi' : 'en';
    setAppLanguage(nextLang);
    if (profile) {
      handleUpdateProfile({ language: nextLang });
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !profile) return;

    const msg: Omit<ChatMessage, 'id'> = {
      roomId,
      senderId: profile.uid,
      senderName: profile.name,
      text: chatInput,
      timestamp: new Date().toISOString()
    };

    try {
      await sendChatMessage(roomId, msg);
      setChatInput('');
      handleEarnXp(5); // earn small XP for collaborative messaging
    } catch (err) {
      console.error(err);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-mono text-sm text-slate-400 animate-pulse">
            Connecting to ASCEND STUDY networks...
          </p>
        </div>
      </div>
    );
  }

  // Calculate dynamic XP requirements
  const nextLevelXp = profile.level * 500;
  const xpPercentage = Math.min(100, (profile.xp / nextLevelXp) * 100);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-indigo-600/30">
      {/* Premium Top Navigation header */}
      <header className="bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-50 px-4 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/20"
          >
            A
          </motion.div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-indigo-400 font-semibold block leading-none">
              {t('appSub', appLanguage)}
            </span>
            <h1 className="text-xl font-black text-slate-100 tracking-tight">
              {t('appName', appLanguage)}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Language Toggle button */}
          <button
            onClick={handleLanguageToggle}
            className="flex items-center gap-1.5 text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/50 hover:border-slate-600 px-3 py-1.5 rounded-full transition active:scale-95"
          >
            <Globe className="w-4 h-4 text-indigo-400" />
            {t('languageToggle', appLanguage)}
          </button>

          {/* Student Status Badge */}
          <div className="hidden md:flex items-center gap-2.5 bg-slate-950 border border-slate-800 rounded-full pl-3 pr-4 py-1">
            <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <span className="block text-[11px] font-bold text-slate-200 line-clamp-1 leading-tight">{profile.name}</span>
              <span className="block text-[9px] text-indigo-400 font-mono">UID: {profile.uid.slice(0, 6)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidepanel: Gamification stats, Daily tasks, virtual pet */}
        <div className="lg:col-span-1 space-y-6">
          {/* Student Profile Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold font-mono px-2.5 py-1 rounded-md">
                Lvl {profile.level} Student
              </div>
              <div className="flex items-center gap-1 text-amber-500 text-xs font-mono font-medium">
                <Flame className="w-4 h-4 fill-amber-500" />
                {profile.streak} Day Streak
              </div>
            </div>

            {/* XP progress */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
                <span>XP Progress</span>
                <span>{profile.xp} / {nextLevelXp}</span>
              </div>
              <div className="h-2.5 bg-slate-800 rounded-full p-0.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPercentage}%` }}
                  className="h-full bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                />
              </div>
            </div>
          </div>

          {/* Virtual Companion Owl */}
          <PetCompanionWidget
            profile={profile}
            lang={appLanguage}
            onUpdateProfile={handleUpdateProfile}
          />

          {/* Daily Quests / Streak lists */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
              <Trophy className="w-4.5 h-4.5 text-amber-400" />
              {t('dailyQuests', appLanguage)}
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40">
                <input type="checkbox" className="rounded bg-slate-800 border-slate-700 text-indigo-500 w-4 h-4" />
                <span>{t('quest1', appLanguage)}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40">
                <input type="checkbox" className="rounded bg-slate-800 border-slate-700 text-indigo-500 w-4 h-4" />
                <span>{t('quest2', appLanguage)}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40">
                <input type="checkbox" className="rounded bg-slate-800 border-slate-700 text-indigo-500 w-4 h-4" />
                <span>{t('quest3', appLanguage)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Interactive workspace with tabs */}
        <div className="lg:col-span-3 space-y-6">
          {/* Navigation tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'home'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Activity className="w-4 h-4" />
              {t('home', appLanguage)}
            </button>

            <button
              onClick={() => setActiveTab('tutor')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'tutor'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              AI Tutor Chat
            </button>

            <button
              onClick={() => setActiveTab('whiteboard')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'whiteboard'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Palette className="w-4 h-4" />
              {t('whiteboard', appLanguage)}
            </button>

            <button
              onClick={() => setActiveTab('exam')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'exam'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <BrainCircuit className="w-4 h-4" />
              {t('mockExam', appLanguage)}
            </button>

            <button
              onClick={() => setActiveTab('docs')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'docs'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              {t('studyDocs', appLanguage)}
            </button>
          </div>

          {/* Dynamic Tab Workspace View */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'home' && (
                <div className="space-y-6">
                  {/* Greeting banner */}
                  <div className="bg-gradient-to-r from-indigo-900 to-violet-950 border border-indigo-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 text-[150px] opacity-10">
                      🦉
                    </div>
                    <div className="space-y-2 relative">
                      <span className="text-xs font-bold font-mono text-indigo-300 uppercase tracking-widest flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        {t('welcomeBack', appLanguage)}
                      </span>
                      <h2 className="text-2xl font-black text-slate-100 tracking-tight">
                        {appLanguage === 'en'
                          ? "Unlock peak learning with ASCEND STUDY."
                          : "असेंड स्टडी के साथ सीखने के शिखर पर पहुंचें।"}
                      </h2>
                      <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                        {appLanguage === 'en'
                          ? "Ask our AI Tutor complex homework questions, generate instant mock exams to evaluate your progress, summarize transcripts with ease, and study in real-time with your companion Budo!"
                          : "हमारे एआई ट्यूटर से जटिल गृहकार्य प्रश्न पूछें, अपनी प्रगति का मूल्यांकन करने के लिए तत्काल मॉक परीक्षाएँ उत्पन्न करें, और अपने पालतू जानवर बुडो के साथ अध्ययन करें!"}
                      </p>
                    </div>
                  </div>

                  {/* Group study collaborative Room chat */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-[400px]">
                      <h3 className="font-semibold text-slate-100 text-sm mb-3 flex items-center gap-2">
                        <MessageSquare className="w-4.5 h-4.5 text-indigo-400" />
                        Real-time Study Group Chat
                      </h3>

                      {/* Chat scroll box */}
                      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
                        {chatMessages.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500">
                            No messages in this study room yet. Start study talk!
                          </div>
                        ) : (
                          chatMessages.map((msg) => (
                            <div key={msg.id} className="text-xs space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/40">
                              <div className="flex items-center justify-between font-mono">
                                <span className="font-bold text-indigo-400">{msg.senderName}</span>
                                <span className="text-[9px] text-slate-500">
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-slate-300 leading-relaxed font-sans">{msg.text}</p>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Send form */}
                      <form onSubmit={handleSendChat} className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Type collaborative tip..."
                          className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600"
                        />
                        <button
                          type="submit"
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 rounded-xl text-xs transition duration-150 active:scale-95"
                        >
                          Send
                        </button>
                      </form>
                    </div>

                    <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                      <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
                        <Trophy className="w-4.5 h-4.5 text-indigo-400" />
                        Study Lobby Info
                      </h3>
                      <div className="text-xs text-slate-400 space-y-3 leading-relaxed">
                        <p>
                          Join other students studying Newton's laws or historical facts in real-time.
                        </p>
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 font-mono text-[10px] space-y-1 text-slate-500">
                          <div>STUDENTS IN LOBBY: 12</div>
                          <div>TOTAL EXAMS COMPLETED: 154</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tutor' && (
                <TutorChatPanel lang={appLanguage} onEarnXp={handleEarnXp} />
              )}

              {activeTab === 'whiteboard' && (
                <WhiteboardPanel
                  lang={appLanguage}
                  roomId={roomId}
                  userId={profile.uid}
                  onEarnXp={handleEarnXp}
                />
              )}

              {activeTab === 'exam' && (
                <MockExamPanel
                  lang={appLanguage}
                  userId={profile.uid}
                  onEarnXp={handleEarnXp}
                />
              )}

              {activeTab === 'docs' && (
                <StudyDocsPanel
                  lang={appLanguage}
                  userId={profile.uid}
                  onEarnXp={handleEarnXp}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
