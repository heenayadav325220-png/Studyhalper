import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Sparkles, Award, Star, Check } from 'lucide-react';
import { playSuccessChime, triggerHaptic } from '../services/soundEffects';

interface StreakCelebrationModalProps {
  isOpen: boolean;
  streakCount: number;
  userName: string;
  language: string;
  onClose: () => void;
}

export function StreakCelebrationModal({
  isOpen,
  streakCount,
  userName,
  language,
  onClose
}: StreakCelebrationModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [displayedStreak, setDisplayedStreak] = useState(Math.max(1, streakCount - 1));

  // Sound and haptics on mount
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;

    if (isOpen) {
      playSuccessChime();
      triggerHaptic('success');
      setDisplayedStreak(Math.max(1, streakCount - 1));

      // Simulate a small tick-up delay for the counter elevation
      timer = setTimeout(() => {
        setDisplayedStreak(streakCount);
        triggerHaptic('medium');
      }, 800);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, streakCount]);

  // High-performance 60fps particle canvas effect
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Resize handler
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle class simulating flame embers and gold confetti
    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      life: number;
      decay: number;
      gravity: number;
      drag: number;
      wobble: number;
      wobbleSpeed: number;

      constructor() {
        // Start from center of screen
        this.x = width / 2;
        this.y = height / 2 - 40;
        
        // Circular random initial velocity
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 4;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed - 3; // skewed upward
        
        this.size = Math.random() * 6 + 3;
        this.alpha = 1;
        this.life = 1.0;
        this.decay = Math.random() * 0.015 + 0.01;
        this.gravity = 0.15; // pull downward like gravity
        this.drag = 0.98; // air resistance
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = Math.random() * 0.1 + 0.05;

        // Gold, Orange, Red color variations
        const colors = [
          '#fbbf24', // amber
          '#f59e0b', // gold
          '#ea580c', // deep orange
          '#ef4444', // red
          '#10b981', // emerald sparkler
          '#6366f1'  // indigo trace
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.vx *= this.drag;
        this.vy *= this.drag;
        this.vy += this.gravity;
        
        this.x += this.vx + Math.sin(this.wobble) * 0.8;
        this.y += this.vy;
        
        this.wobble += this.wobbleSpeed;
        this.life -= this.decay;
        this.alpha = Math.max(0, this.life);
      }

      draw(c: CanvasRenderingContext2D) {
        c.save();
        c.globalAlpha = this.alpha;
        c.shadowBlur = 15;
        c.shadowColor = this.color;
        c.fillStyle = this.color;
        c.beginPath();
        c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }

    const particles: Particle[] = [];
    
    // Spawn initial burst
    for (let i = 0; i < 120; i++) {
      particles.push(new Particle());
    }

    // Main 60fps render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Slower continuous ember stream while open
      if (particles.length < 150 && Math.random() < 0.4) {
        particles.push(new Particle());
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);
        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  if (!isOpen) return null;

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
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* 60fps Particle Canvas layer */}
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none z-10"
        />

        {/* Modal card */}
        <motion.div
          initial={{ scale: 0.9, y: 35, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 35, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-md bg-gradient-to-b from-[#1b1108] via-[#0f0a05] to-[#080503] rounded-3xl p-6 border-2 border-amber-500/50 shadow-[0_0_55px_rgba(245,158,11,0.35)] text-center text-amber-100 overflow-hidden z-20"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center">
            
            {/* Flame Ignition Sequence (3D Animated Pulsing Badge) */}
            <div className="relative mb-5 flex items-center justify-center">
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 18, ease: 'linear' }}
                className="absolute w-28 h-28 border-2 border-dashed border-amber-500/20 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                className="w-20 h-28 rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 border border-amber-300/40 flex flex-col items-center justify-center shadow-[0_0_35px_rgba(245,158,11,0.65)] relative overflow-hidden"
              >
                {/* Internal Flame Icon */}
                <Flame className="w-12 h-12 fill-white text-white filter drop-shadow-[0_2px_8px_rgba(234,88,12,0.8)]" />
                
                {/* Numerical glow tick up */}
                <motion.span 
                  key={displayedStreak}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-black text-2xl text-white font-mono leading-none mt-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                >
                  {displayedStreak}
                </motion.span>
              </motion.div>
              
              {/* Star Badges */}
              <div className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 p-1.5 rounded-full border border-amber-200 shadow-lg animate-bounce">
                <Sparkles className="w-4 h-4 fill-current stroke-[2]" />
              </div>
            </div>

            {/* Sparkles Ribbon */}
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] sm:text-xs font-black text-amber-300 uppercase tracking-widest mb-3 select-none">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>{isHindi ? "दैनिक अध्ययन लक्ष्य पूर्ण!" : "DAILY STUDY TARGET ACHIEVED!"}</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            </div>

            {/* Congratulations Header */}
            <h2 className="font-extrabold text-xl sm:text-2xl text-white tracking-tight leading-tight select-none">
              {isHindi ? `शानदार काम, ${userName}! 🏆` : `Incredible Job, ${userName}! 🏆`}
            </h2>

            {/* Explanatory subtitle */}
            <p className="text-xs sm:text-sm text-amber-200/80 font-medium max-w-sm mt-2 px-1 leading-relaxed">
              {isHindi 
                ? `आपने आज के 10 मिनट अध्ययन समय सीमा को पूरा करके अपनी पढ़ाई का सिलसिला कायम रखा है!`
                : `You've locked in 10 minutes of active, high-yield learning today! Your study streak has ascended.`}
            </p>

            {/* Streak metrics summary card */}
            <div className="w-full bg-[#170e05] rounded-2xl p-4 border border-amber-900/30 text-left space-y-2.5 mt-5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-300/70 font-semibold">{isHindi ? "वर्तमान सिलसिला (Current Streak):" : "Current Active Streak:"}</span>
                <span className="text-amber-300 font-black text-base flex items-center gap-1.5">
                  <Flame className="w-4 h-4 fill-amber-400 text-amber-400 animate-pulse" />
                  <span>{streakCount} {isHindi ? "दिन" : "Days"}</span>
                </span>
              </div>
              <p className="text-[11px] text-amber-100/60 leading-normal font-sans border-b border-amber-900/20 pb-2">
                {isHindi 
                  ? "पढ़ाई का सिलसिला जारी रखने से आपकी समझ और परीक्षा स्कोर में अभूतपूर्व सुधार होता है।"
                  : "Maintaining a daily rhythm solidifies deep-concept memory and accelerates exam retention."}
              </p>
              
              <div className="flex items-center justify-between text-xs pt-0.5">
                <span className="text-emerald-400/80 font-semibold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isHindi ? "सिलसिला बोनस इनाम:" : "Streak Continuation Reward:"}</span>
                </span>
                <span className="text-emerald-300 font-extrabold text-sm flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-current text-emerald-400" />
                  <span>+15 XP Reward</span>
                </span>
              </div>
            </div>

            {/* Claim/Awesome Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className="w-full mt-6 py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 border border-amber-200 shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-95 font-sans"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isHindi ? "सिलसिला जारी रखें!" : "Awesome! Keep it Up"}</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
