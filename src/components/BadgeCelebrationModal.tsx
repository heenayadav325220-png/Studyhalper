import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Sparkles, Award, Star, Check } from 'lucide-react';

interface BadgeCelebrationModalProps {
  badge: {
    id: string;
    name: string;
    nameHindi: string;
    icon: string;
    desc: string;
    descHindi: string;
    target: number;
    displayUnit: string;
  } | null;
  userName: string;
  language: string;
  onClose: () => void;
}

export function BadgeCelebrationModal({
  badge,
  userName,
  language,
  onClose
}: BadgeCelebrationModalProps) {
  
  // Play custom success sound when badge is loaded
  useEffect(() => {
    if (badge) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Dynamic dual oscillator chime (warm arcade feel)
        const playChime = (delay: number, pitch: number, type: 'sine' | 'triangle') => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          
          osc.type = type;
          osc.frequency.setValueAtTime(pitch, audioCtx.currentTime + delay);
          osc.frequency.exponentialRampToValueAtTime(pitch * 1.5, audioCtx.currentTime + delay + 0.4);
          
          gain.gain.setValueAtTime(0.15, audioCtx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + delay + 0.5);
          
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          
          osc.start(audioCtx.currentTime + delay);
          osc.stop(audioCtx.currentTime + delay + 0.5);
        };

        // Arpeggio sound
        playChime(0, 523.25, 'triangle'); // C5
        playChime(0.1, 659.25, 'sine');   // E5
        playChime(0.2, 783.99, 'triangle'); // G5
        playChime(0.3, 1046.50, 'sine');  // C6
      } catch (err) {
        console.warn("Audio context not supported", err);
      }
    }
  }, [badge]);

  if (!badge) return null;

  const isHindi = language === 'hi';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop glassmorphism */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
        />

        {/* Modal card */}
        <motion.div
          initial={{ scale: 0.9, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 30, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-md bg-gradient-to-b from-[#2d1f14] via-[#1c120a] to-[#120a05] rounded-3xl p-6 border-2 border-amber-500/60 shadow-[0_0_50px_rgba(245,158,11,0.4)] text-center text-amber-100 overflow-hidden"
        >
          {/* Confetti & Glow particle effects */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center">
            
            {/* Animated Glow Crown / Award Seal */}
            <div className="relative mb-5 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
                className="absolute w-24 h-24 border-2 border-dashed border-amber-500/30 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="w-18 h-18 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-300 to-amber-500 border border-amber-200/50 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.5)]"
              >
                <span className="text-4xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] select-none">
                  {badge.icon}
                </span>
              </motion.div>
              
              <div className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 p-1.5 rounded-full border border-amber-200 shadow-md">
                <Trophy className="w-4 h-4 fill-current stroke-[2]" />
              </div>
            </div>

            {/* Sparkles eyebrow */}
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] sm:text-xs font-black text-amber-300 uppercase tracking-widest mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>{isHindi ? "नया बैज अनलॉक हुआ!" : "NEW BADGE UNLOCKED!"}</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            </div>

            {/* Congratulations Headline */}
            <h2 className="font-serif font-black text-xl sm:text-2xl text-white tracking-tight leading-tight">
              {isHindi ? `बधाई हो, ${userName}! 🎉` : `Congratulations, ${userName}! 🎉`}
            </h2>

            {/* Earned Description */}
            <p className="text-xs sm:text-sm text-amber-200/80 font-medium max-w-sm mt-2 px-1 leading-relaxed">
              {isHindi 
                ? `आपने पढ़ाई में असाधारण प्रदर्शन करके "${badge.nameHindi}" का विशिष्ट शैक्षणिक पदक अर्जित किया है!`
                : `You've unlocked the special "${badge.name}" Academic Badge through dedication and outstanding study milestones!`}
            </p>

            {/* Badge specifications pill details */}
            <div className="w-full bg-[#1b1007] rounded-2xl p-4 border border-amber-900/40 text-left space-y-2 mt-5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-300/70 font-semibold">{isHindi ? "बैज का विवरण:" : "Badge Details:"}</span>
                <span className="text-amber-200 font-bold">{isHindi ? badge.nameHindi : badge.name}</span>
              </div>
              <p className="text-[11px] text-amber-100/70 leading-normal font-sans border-b border-amber-900/30 pb-2">
                {isHindi ? badge.descHindi : badge.desc}
              </p>
              
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-emerald-400/80 font-semibold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isHindi ? "अनलॉक इनाम:" : "Unlock Reward:"}</span>
                </span>
                <span className="text-emerald-300 font-extrabold text-sm flex items-center gap-1 animate-bounce">
                  <Star className="w-3.5 h-3.5 fill-current text-emerald-400" />
                  <span>+100 XP Bonus</span>
                </span>
              </div>
            </div>

            {/* Claim Action Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className="w-full mt-6 py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 border border-amber-200 shadow-[0_0_25px_rgba(245,158,11,0.45)] transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-95 font-sans"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isHindi ? "शानदार! इनाम प्राप्त करें" : "Awesome! Claim Reward"}</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
