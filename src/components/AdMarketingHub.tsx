import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Video, 
  Copy, 
  Check, 
  Sparkles, 
  Clapperboard, 
  Megaphone 
} from 'lucide-react';
import { showToast } from './Toast';
import { Language } from '../services/translations';

interface AdMarketingHubProps {
  isOpen: boolean;
  onClose: () => void;
  appLanguage: Language;
}

export const AdMarketingHub: React.FC<AdMarketingHubProps> = ({ isOpen, onClose, appLanguage }) => {
  const isHi = appLanguage === 'hi' || appLanguage === 'hinglish';
  const [activeTab, setActiveTab] = useState<'script1' | 'script2' | 'hooks'>('script1');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(isHi ? 'क्लिपबोर्ड पर कॉपी हो गया!' : 'Copied to clipboard!', 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const script1Text = `[0:00 - 0:03] HOOK (Visual: Stressed student staring at a Physics/Math book at 11 PM, head in hands)
Text Overlay (Bold, Animated): "11 PM. Hard Homework. Zero Motivation."

[0:03 - 0:10] PROBLEM
Voiceover: "Raat ke 11 baj gaye hain, kal exam hai, aur yeh tough numerical solve hi nahi ho raha! Google pe search karo toh confusing paragraphs milte hain."

[0:10 - 0:22] SOLUTION (Visual: Opens ASCEND STUDY app, snaps photo of the question)
Voiceover: "Meet Ascend Study! Bas question ki photo kheechi, aur AI Tutor ne step-by-step simple Hinglish mein solution samjha diya. Saath mein instant quiz, mock exams, aur study rooms bhi!"

[0:22 - 0:30] CTA
Voiceover: "Class 9 to 12 ke liye sabse best study companion. Abhi Ascend Study download karo aur top karo!"
Text: "Download Ascend Study Now 🚀"`;

  const script2Text = `[0:00 - 0:03] HOOK (Split screen: Left side mobile gaming, Right side boring textbook)
Text: "What if studying felt like playing your favorite video game?"

[0:03 - 0:10] GAMEPLAY / FEATURES (Visual: Fast transitions showing XP gains, streak flames, leveling up study pet 'Nova')
Voiceover: "Ascend Study turns your board exam prep into an RPG game. Earn XP, maintain daily streaks, and level up your study pet while mastering Science & Math!"

[0:10 - 0:15] CTA
Voiceover: "Level up your grades, not just your game. Ascend Study!"`;

  const viralHooks = [
    "Stuck on difficult homework at 11 PM? Watch this 👇",
    "How I scored 95%+ in Class 12 without expensive tuition coaching 📚",
    "Your phone can actually help you top your board exams (If you use this AI app)",
    "Stop wasting time on boring notes. Try this AI Study App!",
    "POV: You found the ultimate study hack before your final exams 🚀"
  ];

  const hashtags = "#AscendStudy #Class10 #Class12 #BoardExams #StudyTok #AITutor #StudentLife #JEE #NEET #StudyHacks #ExamPrep";

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{isHi ? 'विज्ञापन और मार्केटिंग हब' : 'Ad & Marketing Campaign Hub'}</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/35">
                  YouTube & Instagram Reels
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {isHi ? 'क्लास 9-12 स्टूडेंट्स के लिए वायरल एड स्क्रिप्ट और हुक्स' : 'High-converting ad scripts & reels strategy for Class 9-12 students'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-5 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('script1')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition flex items-center gap-2 border-b-2 ${
              activeTab === 'script1' 
                ? 'bg-indigo-600/15 text-indigo-400 border-indigo-500' 
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>{isHi ? 'रील्स स्क्रिप्ट 1 (लेट नाइट)' : 'Reel Script 1 (Late Night)'}</span>
          </button>
          <button
            onClick={() => setActiveTab('script2')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition flex items-center gap-2 border-b-2 ${
              activeTab === 'script2' 
                ? 'bg-indigo-600/15 text-indigo-400 border-indigo-500' 
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Clapperboard className="w-3.5 h-3.5" />
            <span>{isHi ? 'रील्स स्क्रिप्ट 2 (गेमर)' : 'Reel Script 2 (Gamer)'}</span>
          </button>
          <button
            onClick={() => setActiveTab('hooks')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition flex items-center gap-2 border-b-2 ${
              activeTab === 'hooks' 
                ? 'bg-indigo-600/15 text-indigo-400 border-indigo-500' 
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isHi ? 'वायरल हुक्स & कैप्शन' : 'Viral Hooks & Captions'}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200 text-sm">
          {activeTab === 'script1' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-indigo-950/30 p-4 rounded-xl border border-indigo-500/20">
                <div>
                  <h3 className="text-sm font-bold text-indigo-300">Concept 1: The "Late Night Study Struggle" (30s)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Best for YouTube Shorts & Instagram Reels targeting high schoolers struggling with homework.</p>
                </div>
                <button
                  onClick={() => handleCopy(script1Text, 'script1')}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  {copiedKey === 'script1' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'script1' ? 'Copied!' : 'Copy Script'}</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                {script1Text}
              </pre>
            </div>
          )}

          {activeTab === 'script2' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-violet-950/30 p-4 rounded-xl border border-violet-500/20">
                <div>
                  <h3 className="text-sm font-bold text-violet-300">Concept 2: The "Gamer vs Student" (15s Fast-Paced)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">High-energy short emphasizing gamification (XP, streaks, study pets).</p>
                </div>
                <button
                  onClick={() => handleCopy(script2Text, 'script2')}
                  className="px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-violet-600/20"
                >
                  {copiedKey === 'script2' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'script2' ? 'Copied!' : 'Copy Script'}</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                {script2Text}
              </pre>
            </div>
          )}

          {activeTab === 'hooks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-amber-950/30 p-4 rounded-xl border border-amber-500/20">
                <div>
                  <h3 className="text-sm font-bold text-amber-300">Viral Hook Lines (First 3 Seconds)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Use these text overlays on your video to hook viewers immediately.</p>
                </div>
              </div>

              <div className="space-y-2">
                {viralHooks.map((hook, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                    <span className="text-slate-200">✨ {hook}</span>
                    <button
                      onClick={() => handleCopy(hook, `hook_${idx}`)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] transition flex items-center gap-1"
                    >
                      {copiedKey === `hook_${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === `hook_${idx}` ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-slate-300">Recommended Hashtags:</div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-indigo-400 flex items-center justify-between">
                  <span>{hashtags}</span>
                  <button
                    onClick={() => handleCopy(hashtags, 'hashtags')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] transition flex items-center gap-1 shrink-0 ml-2"
                  >
                    {copiedKey === 'hashtags' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'hashtags' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between text-xs text-slate-400">
          <span>Targeting Class 9 - 12 School Students across India</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
