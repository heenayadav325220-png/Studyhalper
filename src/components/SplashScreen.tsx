import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, GraduationCap, Heart, Star, Award, BookOpen } from 'lucide-react';
import { AppLanguage } from '../services/translations';

interface SplashScreenProps {
  language: AppLanguage;
  onComplete: () => void;
  duration?: number; // in milliseconds
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  language,
  onComplete,
  duration = 4000
}) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');

  // Localized dynamic status messages during the loading progression
  const getStatusMessage = (prog: number, lang: AppLanguage) => {
    const isHindi = lang === 'Hindi';
    if (prog < 25) {
      return isHindi 
        ? 'भौतिकी और विज्ञान के बुनियादी सिद्धांतों को लोड किया जा रहा है...' 
        : 'Loading core physics & science databases...';
    } else if (prog < 55) {
      return isHindi 
        ? 'उन्नत एआई ट्यूटर (Gemini API) को सक्रिय किया जा रहा है...' 
        : 'Sychronizing advanced AI Tutor engine...';
    } else if (prog < 80) {
      return isHindi 
        ? 'आपके व्यक्तिगत अध्ययन कक्ष को तैयार किया जा रहा है...' 
        : 'Assembling custom study rooms & whiteboard...';
    } else {
      return isHindi 
        ? 'एसेंड स्टडी अब पूरी तरह तैयार है! मुस्कुराते रहें...' 
        : 'Ascend Study is ready! Keep learning, keep growing...';
    }
  };

  useEffect(() => {
    setStatusText(getStatusMessage(0, language));
  }, [language]);

  useEffect(() => {
    const intervalTime = 40; // update progress every 40ms
    const totalSteps = duration / intervalTime;
    const increment = 100 / totalSteps;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + increment, 100);
        setStatusText(getStatusMessage(next, language));
        if (next >= 100) {
          clearInterval(progressInterval);
        }
        return next;
      });
    }, intervalTime);

    // Auto complete callback after full duration
    const completeTimeout = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(completeTimeout);
    };
  }, [duration, onComplete, language]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 w-full h-full min-h-screen bg-gradient-to-br from-[#09051d] via-[#050409] to-[#020104] text-white flex flex-col justify-between items-center p-6 md:p-12 z-[9999] overflow-hidden select-none"
      id="ascend_splash_screen"
    >
      {/* Background Ambience / Fluid Glowing Orbs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <motion.div 
          animate={{ 
            x: [0, 40, -20, 0],
            y: [0, -30, 20, 0],
            scale: [1, 1.1, 0.9, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -left-20 w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[120px]"
        />
        <motion.div 
          animate={{ 
            x: [0, -30, 40, 0],
            y: [0, 20, -30, 0],
            scale: [1, 0.95, 1.05, 1]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-20 -right-20 w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[140px]"
        />
        <motion.div 
          animate={{ 
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-purple-500/5 blur-[100px]"
        />
      </div>

      {/* Top Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 0.5, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="relative z-10 flex items-center space-x-2 mt-4"
      >
        <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
        <span className="text-[10px] font-black tracking-[0.25em] uppercase text-indigo-200">
          {language === 'Hindi' ? 'एडवांस्ड एआई एजुकेशनल प्लेटफॉर्म' : 'ADVANCED AI EDUCATIONAL PLATFORM'}
        </span>
      </motion.div>

      {/* Central Heartfelt Dedication Content */}
      <div className="relative z-10 max-w-3xl w-full flex flex-col items-center text-center my-auto space-y-8">
        
        {/* Pulsating Glowing Icon Wrapper */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 100, 
            damping: 15,
            delay: 0.3
          }}
          className="relative group cursor-pointer"
        >
          <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-amber-500 via-indigo-600 to-pink-500 opacity-30 blur-xl group-hover:opacity-50 transition duration-1000 animate-pulse"></div>
          <div className="relative w-24 h-24 bg-slate-900/90 border border-white/10 rounded-full flex items-center justify-center shadow-2xl">
            <GraduationCap className="w-12 h-12 text-indigo-400" />
            {/* Tiny floating decorative elements */}
            <motion.div 
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-orange-500 p-1.5 rounded-xl border border-amber-400/30 shadow-lg shadow-orange-500/20"
            >
              <Heart className="w-3.5 h-3.5 text-white fill-white" />
            </motion.div>
          </div>
        </motion.div>

        {/* Heartfelt Dedication Text */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="space-y-3"
          >
            <p className="text-xs md:text-sm font-extrabold text-indigo-400 uppercase tracking-[0.25em] flex items-center justify-center gap-2">
              <Star className="w-3.5 h-3.5 fill-current text-amber-400 animate-spin-slow" />
              <span>{language === 'Hindi' ? 'कृतज्ञता के साथ समर्पित' : 'Dedicated with Gratitude to'}</span>
              <Star className="w-3.5 h-3.5 fill-current text-amber-400 animate-spin-slow" />
            </p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-orange-300 font-display leading-tight drop-shadow-sm filter drop-shadow-[0_2px_10px_rgba(245,158,11,0.25)]">
              Alakh Pandey Sir & The PhysicsWallah Team
            </h2>
          </motion.div>

          {/* Golden Ambient Divider */}
          <motion.div 
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="w-40 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent mx-auto relative"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_8px_#f59e0b]" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.9 }}
            className="text-slate-300 font-sans font-medium text-sm md:text-lg max-w-2xl leading-relaxed mx-auto tracking-wide"
          >
            "Thank you for inspiring millions of students and creators like me to build, learn, and grow. Your dedication to education is the driving force behind projects like <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-cyan-200 font-extrabold">Ascend Study</span>."
          </motion.p>
        </div>
      </div>

      {/* Bottom Loading Progress & Footer */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.8 }}
        className="relative z-10 w-full max-w-sm space-y-4 mb-6 flex flex-col items-center"
      >
        {/* Animated Glow Aura underneath loader */}
        <div className="absolute -bottom-8 w-48 h-12 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />

        {/* Percentage Tracker & Status */}
        <div className="w-full flex justify-between items-center text-[10px] font-extrabold uppercase tracking-[0.15em] text-indigo-300/80 px-1">
          <span className="animate-pulse">{statusText}</span>
          <span className="font-mono text-xs text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-500/20 shadow-inner">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Premium Sleek Micro-Progress Bar */}
        <div className="w-full h-[6px] bg-slate-900/80 rounded-full p-[1px] border border-white/5 shadow-inner overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 rounded-full shadow-[0_0_10px_rgba(129,140,248,0.6)]"
            style={{ width: `${progress}%` }}
            layoutId="splashProgressBar"
          />
        </div>

        {/* Footer Credit */}
        <div className="text-[9px] font-bold text-slate-500 tracking-widest uppercase flex items-center gap-1.5 pt-1">
          <BookOpen className="w-3 h-3 text-indigo-500/70" />
          <span>{language === 'Hindi' ? 'गुणवत्तापूर्ण शिक्षा, सबके लिए' : 'Quality Education For All'}</span>
        </div>
      </motion.div>
    </motion.div>
  );
};
