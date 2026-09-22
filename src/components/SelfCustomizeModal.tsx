import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  Palette, 
  Type, 
  Sun, 
  Moon,
  Bot, 
  Layout, 
  Sliders, 
  RotateCcw, 
  X, 
  Boxes,
  Square,
  Sparkles,
  Volume2,
  Image as ImageIcon,
  Compass,
  Layers,
  Award
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import type { 
  UiCustomization, 
  AppThemeLook, 
  LightingEffect, 
  FontFamilyStyle, 
  AiTutorCardStyle, 
  StatBoxesLayout, 
  DashboardLayoutPreset,
  CardBorderRadius,
  NeonIntensity,
  WallpaperAmbiance,
  AudioFeedback
} from '../types';
import { playUiSound } from '../services/soundEffects';

export const DEFAULT_UI_CUSTOMIZATION: UiCustomization = {
  appThemeLook: 'cyber_glass',
  lightingEffect: 'rainbow_spin',
  fontFamilyStyle: 'sans',
  aiTutorCardStyle: 'cyber_neon',
  statBoxesLayout: '3_col_compact',
  dashboardLayoutPreset: 'tutor_first',
  neonIntensity: 'high',
  cardBorderRadius: 'curved',
  wallpaperAmbiance: 'science_chalkboard',
  audioFeedback: 'cyber_synth',
  leaderboardTheme: 'default'
};

interface SelfCustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  customization: UiCustomization;
  onUpdate: (updated: UiCustomization) => void;
  language?: string;
}

type TabKey = 
  | 'tutor' 
  | 'theme' 
  | 'lighting' 
  | 'font' 
  | 'stats' 
  | 'radius' 
  | 'intensity' 
  | 'wallpaper' 
  | 'sound' 
  | 'layout';

export default function SelfCustomizeModal({
  isOpen,
  onClose,
  customization,
  onUpdate,
  language = 'en'
}: SelfCustomizeModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('tutor');
  const [tempConfig, setTempConfig] = useState<UiCustomization>(customization);

  if (!isOpen) return null;

  const handleSelect = <K extends keyof UiCustomization>(key: K, value: UiCustomization[K]) => {
    const next = { ...tempConfig, [key]: value };
    setTempConfig(next);
    onUpdate(next);
    
    // Play audio feedback
    if (key === 'audioFeedback') {
      playUiSound(value as AudioFeedback);
    } else {
      playUiSound(tempConfig.audioFeedback);
    }
  };

  const handleReset = () => {
    setTempConfig(DEFAULT_UI_CUSTOMIZATION);
    onUpdate(DEFAULT_UI_CUSTOMIZATION);
    playUiSound(DEFAULT_UI_CUSTOMIZATION.audioFeedback);
  };

  // 1. AI TUTOR CARD UI (4 MODES)
  const aiTutorOptions: Array<{
    id: AiTutorCardStyle;
    title: string;
    badge: string;
    icon: string;
    desc: string;
    previewBg: string;
    previewBorder: string;
  }> = [
    {
      id: 'cyber_neon',
      title: 'Cyber Neon Glow',
      badge: 'CYBERPUNK',
      icon: '⚡',
      desc: 'Electric cyan and deep azure glow with radar particle matrix and high-tech badge.',
      previewBg: 'bg-gradient-to-br from-slate-950 via-[#071d2c] to-[#042436]',
      previewBorder: 'border-cyan-400'
    },
    {
      id: 'retro_arcade',
      title: 'Retro Pixel CRT Terminal',
      badge: '8-BIT RETRO',
      icon: '👾',
      desc: 'Monospaced green CRT phosphor scanlines with 8-bit vintage arcade atmosphere.',
      previewBg: 'bg-gradient-to-br from-slate-950 via-[#052210] to-[#021808]',
      previewBorder: 'border-emerald-500 font-mono'
    },
    {
      id: 'parchment_desk',
      title: 'Royal Scholar Antique Desk',
      badge: 'ROYAL WOOD',
      icon: '📜',
      desc: 'Polished walnut woodwork frame with warm ivory parchment and golden accents.',
      previewBg: 'bg-gradient-to-br from-[#2b1e15] via-[#3a281c] to-[#1f150e]',
      previewBorder: 'border-amber-500'
    },
    {
      id: 'bento_minimal',
      title: 'Minimalist Bento Glass',
      badge: 'CLEAN BENTO',
      icon: '💎',
      desc: 'Ultra-clean frosted crystalline glass with subtle white borders and modern typography.',
      previewBg: 'bg-gradient-to-br from-white/10 via-white/5 to-white/10',
      previewBorder: 'border-white/30'
    }
  ];

  // 2. MASTER APP THEME LOOK (4 MODES)
  const themeOptions: Array<{
    id: AppThemeLook;
    title: string;
    tag: string;
    colors: string[];
    desc: string;
  }> = [
    {
      id: 'cyber_glass',
      title: 'Cyber Glassmorphism',
      tag: 'MODERN GLASS',
      colors: ['#00f0ff', '#a855f7', '#0f172a'],
      desc: 'Translucent glass cards with 24px backdrop blur, indigo ambient tones, and cyan highlights.'
    },
    {
      id: 'wooden_parchment',
      title: 'Antique Walnut & Parchment',
      tag: 'CLASSIC ROYAL',
      colors: ['#3a281c', '#f6efe1', '#d4af37'],
      desc: 'Prestigious royal academic library theme with warm amber wood, ivory paper, and gold trim.'
    },
    {
      id: 'midnight_amoled',
      title: 'Midnight Obsidian AMOLED',
      tag: 'BATTERY SAVER',
      colors: ['#000000', '#1e293b', '#6366f1'],
      desc: 'Deep 100% OLED black canvas engineered for maximum battery efficiency and eye comfort.'
    },
    {
      id: 'aurora_synthwave',
      title: 'Aurora Synthwave Neon',
      tag: 'VIBRANT NEON',
      colors: ['#f43f5e', '#8b5cf6', '#06b6d4'],
      desc: 'Energetic 80s neon aesthetic with vivid magenta, electric violet, and glowing highlights.'
    }
  ];

  // 3. LIGHTING EFFECT / ROTATING PERIMETER STRIP (4 MODES)
  const lightingOptions: Array<{
    id: LightingEffect;
    title: string;
    icon: string;
    previewCss: string;
    desc: string;
  }> = [
    {
      id: 'rainbow_spin',
      title: '10-Color Spectrum Rotating Strip',
      icon: '🌈',
      previewCss: 'conic-gradient(from 0deg, #00f0ff, #a855f7, #f43f5e, #ff6b00, #10b981, #00f0ff)',
      desc: 'Crisp 360° rotating neon ribbon travelling smoothly around the exact card boundary with 10 rainbow colors.'
    },
    {
      id: 'aurora_pulse',
      title: 'Emerald Aurora Rotating Ribbon',
      icon: '🟢',
      previewCss: 'conic-gradient(from 0deg, #10b981, #06b6d4, #3b82f6, #10b981)',
      desc: 'Soothing cyber-mint, cyan, and deep azure neon strip circulating around the card perimeter.'
    },
    {
      id: 'golden_radiance',
      title: 'Royal Gold Rotating Border',
      icon: '👑',
      previewCss: 'conic-gradient(from 0deg, #f59e0b, #fbbf24, #d97706, #f59e0b)',
      desc: 'Imperial gold and warm amber continuous neon ribbon flowing cleanly along card borders.'
    },
    {
      id: 'minimal_glow',
      title: 'Pure White Frost Laser Line',
      icon: '❄️',
      previewCss: 'conic-gradient(from 0deg, #ffffff, #64748b, #ffffff)',
      desc: 'Clean, subtle white laser line tracing around the card edge with zero background glare.'
    }
  ];

  // 4. TYPOGRAPHY & FONTS (4 MODES)
  const fontOptions: Array<{
    id: FontFamilyStyle;
    title: string;
    sample: string;
    fontClass: string;
    desc: string;
  }> = [
    {
      id: 'sans',
      title: 'Modern Pro Sans',
      sample: 'Aa Bb Gg 123 🚀',
      fontClass: 'font-sans font-bold',
      desc: 'Clean, contemporary sans-serif engineered for ultra-crisp digital clarity.'
    },
    {
      id: 'serif',
      title: 'Oxford Academic Serif',
      sample: 'Aa Bb Gg 123 📜',
      fontClass: 'font-serif font-black tracking-wide',
      desc: 'Classic literary serif with academic prestige, ideal for long-form study.'
    },
    {
      id: 'mono',
      title: 'Cyber Developer Mono',
      sample: '0101_EXEC::OK',
      fontClass: 'font-mono font-bold tracking-tight',
      desc: 'High-tech terminal monospace typography creating an authentic hacker vibe.'
    },
    {
      id: 'rounded',
      title: 'Friendly Rounded Display',
      sample: 'Aa Bb Gg 123 ✨',
      fontClass: 'font-sans tracking-wide font-extrabold',
      desc: 'Soft curved characters with an approachable, energetic, and welcoming feel.'
    }
  ];

  // 5. STATS BOXES / HUD LAYOUT (4 MODES)
  const statOptions: Array<{
    id: StatBoxesLayout;
    title: string;
    badge: string;
    desc: string;
  }> = [
    {
      id: '3_col_compact',
      title: '3-Column Glass Color Tiles',
      badge: 'DEFAULT',
      desc: 'Dedicated Amber (Streak), Emerald (Level), and Violet (XP) compact frosted glass boxes.'
    },
    {
      id: 'horizontal_bar',
      title: 'Unified Gaming HUD Power Bar',
      badge: 'GAMER',
      desc: 'All stats seamlessly merged into a single futuristic horizontal HUD power gauge.'
    },
    {
      id: 'hexagon_badges',
      title: 'Hexagon Combat Badges',
      badge: 'CYBER',
      desc: 'Sci-Fi 3D holographic hexagonal shield badges with metallic embossed borders.'
    },
    {
      id: 'card_grid',
      title: 'Glass Floating Capsules',
      badge: 'MINIMAL',
      desc: 'Translucent floating capsule pills with subtle micro-particle glow reflections.'
    }
  ];

  // 6. CARD CORNER & BORDER GEOMETRY (4 MODES)
  const cornerOptions: Array<{
    id: CardBorderRadius;
    title: string;
    badge: string;
    previewClass: string;
    desc: string;
  }> = [
    {
      id: 'curved',
      title: 'Smooth Curved (26px)',
      badge: 'MODERN',
      previewClass: 'rounded-2xl',
      desc: 'Modern balanced rounded corners with smooth optical curvature and soft glass edges.'
    },
    {
      id: 'pill',
      title: 'Ultra Rounded Pill (36px)',
      badge: 'SOFT',
      previewClass: 'rounded-3xl',
      desc: 'Extra deep organic curves providing a smooth, welcoming, and friendly aesthetic.'
    },
    {
      id: 'sharp',
      title: 'Cyber Neo-Sharp (6px)',
      badge: 'PRECISION',
      previewClass: 'rounded-md',
      desc: 'Ultra-crisp chamfered tech corners engineered for maximum informational density.'
    },
    {
      id: 'hexagon',
      title: 'Dual-Bevel Tech Frame',
      badge: 'SCI-FI',
      previewClass: 'rounded-xl border-dashed',
      desc: 'Futuristic technical double-border with tactical cutouts and neon corner indicators.'
    }
  ];

  // 7. NEON LIGHTING INTENSITY (4 MODES)
  const intensityOptions: Array<{
    id: NeonIntensity;
    title: string;
    badge: string;
    glowStyle: string;
    desc: string;
  }> = [
    {
      id: 'high',
      title: 'Bold Neon Ribbon (3.5px)',
      badge: 'BOLD',
      glowStyle: 'border-2 border-amber-400',
      desc: '3.5px vivid rotating neon ribbon around the exact card boundary with full brightness.'
    },
    {
      id: 'medium',
      title: 'Balanced Strip (2.5px)',
      badge: 'STANDARD',
      glowStyle: 'border-[1.5px] border-amber-400/80',
      desc: '2.5px balanced rotating neon border with clear perimeter definition.'
    },
    {
      id: 'soft',
      title: 'Slim Laser Edge (1.5px)',
      badge: 'SLIM',
      glowStyle: 'border border-amber-400/50',
      desc: '1.5px ultra-fine rotating laser strip for minimalist aesthetics.'
    },
    {
      id: 'off',
      title: 'Stealth Matte (0px)',
      badge: 'STATIC',
      glowStyle: 'border border-amber-900/40',
      desc: 'Disables rotating neon ribbon for a static classic card border.'
    }
  ];

  // 8. LIVE WALLPAPER & AMBIANCE (8 RICH MODES) WITH 100+ REALTIME MOVING LIVING OBJECTS (0% LAG)
  const wallpaperOptions: Array<{
    id: WallpaperAmbiance;
    title: string;
    badge: string;
    icon: string;
    desc: string;
  }> = [
    {
      id: 'science_chalkboard',
      title: 'Science Lab & Living Scholars',
      badge: '100+ LIVE OBJECTS',
      icon: '📐',
      desc: 'Waving science professors holding chalk, jumping on Eureka, spinning Rutherford atoms with electrons, bubbling flasks, pencil rockets, and physics formulas.'
    },
    {
      id: 'cosmic_nebula',
      title: 'Cosmic Nebula & Living Astronauts',
      badge: 'SUPERNOVA & STARS',
      icon: '🌌',
      desc: 'Spacewalking astronauts waving hands & jetpack-boosting, fire-tail rockets, satellites with blinking beacons, live supernovas, and 4-point diffraction stars.'
    },
    {
      id: 'solar_system',
      title: 'Solar System & Planetary Orbits',
      badge: 'ORBITAL PHYSICS',
      icon: '🪐',
      desc: 'Blazing sun with rotating solar corona, Earth with orbiting Moon, Saturn with golden rings, Mars, Jupiter with Great Red Spot, and Kepler orbital satellites.'
    },
    {
      id: 'earth_forest',
      title: 'Earth Nature & Living Wildlife',
      badge: 'NATURE FLORA & FAUNA',
      icon: '🍃',
      desc: 'Soaring flying birds, colorful swimming Koi fish, fluttering butterflies, falling autumn maple leaves, floating dandelion seeds, and glowing fireflies.'
    },
    {
      id: 'deep_ocean',
      title: 'Deep Ocean & Living Marine Life',
      badge: 'AQUATIC BIOSPHERE',
      icon: '🐬',
      desc: 'Swimming scuba divers, playful dolphins, majestic sea turtles, manta rays, glowing sea anemones, and rising oceanic bubble streams.'
    },
    {
      id: 'cyber_matrix',
      title: 'Cyber Matrix & Living Cyborgs',
      badge: 'NEON CYBERPUNK',
      icon: '💻',
      desc: 'Cyborgs walking and waving on neon grids, scanning quad-drones with laser cones, 3D rotating quantum CPU cubes, and falling digital matrix rain.'
    },
    {
      id: 'retro_arcade',
      title: '8-Bit Retro Arcade Universe',
      badge: 'PIXEL NOSTALGIA',
      icon: '👾',
      desc: 'Pixelated retro 8-bit heroes jumping & running, flying UFO space invaders, bouncing power-up coins, spinning 8-bit stars, and arcade popups.'
    },
    {
      id: 'deep_obsidian',
      title: 'Celestial Zen & Levitating Monks',
      badge: 'MEDITATIVE TRANQUILITY',
      icon: '🖤',
      desc: 'Levitating Zen monks in lotus posture with breathing cycles and golden halos, bioluminescent jellyfish, flapping origami cranes, and floating celestial embers.'
    }
  ];

  // 9. SOUND & AUDIO FEEDBACK (4 MODES)
  const soundOptions: Array<{
    id: AudioFeedback;
    title: string;
    badge: string;
    icon: string;
    desc: string;
  }> = [
    {
      id: 'cyber_synth',
      title: 'Cyber Synth Haptic',
      badge: 'SCI-FI',
      icon: '⚡',
      desc: 'Crisp dual-oscillator electronic sweep sound generated on every button press.'
    },
    {
      id: 'tactile_click',
      title: 'Mechanical Tactile Click',
      badge: 'KEYBOARD',
      icon: '⌨️',
      desc: 'Satisfying mechanical keyboard switch click for positive tactile confirmation.'
    },
    {
      id: 'zen_water',
      title: 'Zen Harmonic Water Bell',
      badge: 'RELAX',
      icon: '💧',
      desc: 'Calming high-frequency water droplet and meditative harmonic chime.'
    },
    {
      id: 'silent',
      title: 'Muted Silent Mode',
      badge: 'NO SOUND',
      icon: '🔇',
      desc: 'Completely disables audio feedback for quiet, silent library environments.'
    }
  ];

  // 10. DASHBOARD LAYOUT PRESETS (4 MODES)
  const layoutOptions: Array<{
    id: DashboardLayoutPreset;
    title: string;
    badge: string;
    desc: string;
  }> = [
    {
      id: 'tutor_first',
      title: 'AI Tutor Focus (Balanced)',
      badge: 'POPULAR',
      desc: 'Positions the AI Tutor and Image Studio hero cards right at the top of the playground.'
    },
    {
      id: 'toolkit_hero',
      title: 'Study Toolkit Hero Mode',
      badge: 'TOOLS',
      desc: 'Elevates the 18+ Advanced Interactive Toolkit banner directly under the profile card.'
    },
    {
      id: 'quiz_first',
      title: 'Quiz & Practice Fast-Track',
      badge: 'EXAM PREP',
      desc: 'Prioritizes Mock Quizzes and Practice Papers at the very top of the launcher grid.'
    },
    {
      id: 'compact_grid',
      title: 'Full Compact Grid Dock',
      badge: 'HIGH DENSITY',
      desc: 'Aligns all academy tools in a streamlined, high-density 4-column quick launcher dock.'
    }
  ];

  const categoryList: Array<{
    id: TabKey;
    label: string;
    sublabel: string;
    icon: typeof Bot;
    activeValue: string;
  }> = [
    { 
      id: 'tutor', 
      label: 'AI Tutor Box', 
      sublabel: '4 Card Styles', 
      icon: Bot, 
      activeValue: aiTutorOptions.find(o => o.id === tempConfig.aiTutorCardStyle)?.badge || 'ACTIVE' 
    },
    { 
      id: 'theme', 
      label: 'App Theme', 
      sublabel: 'Color Palette', 
      icon: Palette, 
      activeValue: themeOptions.find(o => o.id === tempConfig.appThemeLook)?.tag || 'THEME' 
    },
    { 
      id: 'lighting', 
      label: 'Neon Aura Strip', 
      sublabel: '360° Light Loop', 
      icon: Sun, 
      activeValue: lightingOptions.find(o => o.id === tempConfig.lightingEffect)?.title.split(' ')[0] || 'AURA' 
    },
    { 
      id: 'font', 
      label: 'Fonts & Text', 
      sublabel: 'Typography Hierarchy', 
      icon: Type, 
      activeValue: fontOptions.find(o => o.id === tempConfig.fontFamilyStyle)?.title.split(' ')[0] || 'FONT' 
    },
    { 
      id: 'stats', 
      label: 'Stats & HUD', 
      sublabel: 'Level & Streak Layout', 
      icon: Boxes, 
      activeValue: statOptions.find(o => o.id === tempConfig.statBoxesLayout)?.badge || 'HUD' 
    },
    { 
      id: 'radius', 
      label: 'Card Corners', 
      sublabel: 'Border Geometry', 
      icon: Square, 
      activeValue: cornerOptions.find(o => o.id === tempConfig.cardBorderRadius)?.badge || 'CORNERS' 
    },
    { 
      id: 'intensity', 
      label: 'Glow Intensity', 
      sublabel: 'Border Thickness', 
      icon: Sparkles, 
      activeValue: intensityOptions.find(o => o.id === tempConfig.neonIntensity)?.badge || 'INTENSITY' 
    },
    { 
      id: 'wallpaper', 
      label: 'Live Wallpaper', 
      sublabel: 'Ambient Backdrops', 
      icon: ImageIcon, 
      activeValue: wallpaperOptions.find(o => o.id === tempConfig.wallpaperAmbiance)?.badge || 'WALLPAPER' 
    },
    { 
      id: 'sound', 
      label: 'Sound & Haptics', 
      sublabel: 'Audio Feedback', 
      icon: Volume2, 
      activeValue: soundOptions.find(o => o.id === tempConfig.audioFeedback)?.badge || 'AUDIO' 
    },
    { 
      id: 'layout', 
      label: 'Widget Flow', 
      sublabel: 'Dashboard Hierarchy', 
      icon: Layout, 
      activeValue: layoutOptions.find(o => o.id === tempConfig.dashboardLayoutPreset)?.badge || 'FLOW' 
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col w-screen h-screen bg-[#140c07] text-[#fbf6ee] overflow-hidden select-none">
      
      {/* MATTE WOODGRAIN TEXTURE OVERLAY */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-25 mix-blend-overlay"
        style={{
          backgroundImage: `radial-gradient(ellipse at 50% 0%, rgba(217, 119, 6, 0.15), transparent 70%),
            repeating-linear-gradient(45deg, rgba(74, 44, 23, 0.1) 0px, rgba(74, 44, 23, 0.1) 2px, transparent 2px, transparent 6px)`
        }}
      />

      {/* 1. TOP HEADER - MATTE WALNUT & ANTIQUE GOLD BAR */}
      <header className="relative z-20 shrink-0 h-16 sm:h-20 px-4 sm:px-6 bg-gradient-to-r from-[#24170e] via-[#2f1f13] to-[#1c120a] border-b-2 border-amber-700/60 shadow-[0_4px_25px_rgba(0,0,0,0.6)] flex items-center justify-between">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 border-2 border-amber-400/70 shadow-[0_0_15px_rgba(245,158,11,0.35)] flex items-center justify-center text-amber-100 shrink-0">
            <Sliders className="w-5 h-5 sm:w-6 sm:h-6 text-amber-200" />
          </div>

          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="font-serif font-black text-sm sm:text-xl text-amber-100 tracking-tight flex items-center gap-1.5">
                <span>Self Customize Studio</span>
                <span className="text-amber-400 text-sm">🪵</span>
              </h1>
              <span className="hidden sm:inline px-2.5 py-0.5 rounded-full bg-amber-950/90 text-amber-300 border border-amber-600/50 text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-inner font-sans">
                Full-Page Studio
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-amber-200/70 font-medium truncate max-w-xs sm:max-w-md hidden sm:block">
              {language === 'hi' ? 'अपनी पसंद का थीम, फॉन्ट, लाइटिंग, आवाज़ और डैशबोर्ड लेआउट कस्टमाइज़ करें' : 'Personalize UI themes, tutor styles, neon perimeter aura, typography & sound haptics.'}
            </p>
          </div>
        </div>

        {/* Actions on Top Right */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Global Dark Mode Switch for Late-Night Study */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-[#2b1b11] border border-amber-700/50 shadow-inner">
            <Moon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] font-bold text-amber-200 hidden sm:inline">Dark Mode</span>
            <ThemeToggle variant="compact-switch" />
          </div>

          <button
            onClick={handleReset}
            className="hidden md:flex px-3 sm:px-4 py-2 rounded-xl text-xs font-bold text-amber-300/80 hover:text-amber-100 bg-[#2b1b11] hover:bg-[#3d2719] border border-amber-700/50 transition cursor-pointer items-center space-x-1.5 shadow-sm"
            title="Reset to default settings"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={() => {
              playUiSound(tempConfig.audioFeedback);
              onClose();
            }}
            className="hidden md:flex px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-black text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 border border-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.45)] transition cursor-pointer items-center space-x-2 active:scale-95 font-sans"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Save & Close</span>
          </button>

          <button
            onClick={() => {
              playUiSound(tempConfig.audioFeedback);
              onClose();
            }}
            className="p-2 sm:p-2.5 rounded-xl bg-[#2b1b11] hover:bg-[#3d2719] text-amber-300/80 hover:text-amber-100 border border-amber-700/50 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. MAIN FULL-PAGE WORKSPACE (SIDEBAR + CONTENT CANVAS) */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* LEFT VERTICAL NAVIGATION SIDEBAR (WOODEN MATTE FINISH) */}
        <aside className="w-full md:w-72 lg:w-80 shrink-0 bg-[#1e140d]/95 border-b md:border-b-0 md:border-r-2 border-amber-800/50 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto p-2 sm:p-3.5 space-x-1.5 md:space-x-0 md:space-y-1.5 scrollbar-thin scrollbar-thumb-amber-800/40">
          
          <div className="hidden md:flex items-center justify-between px-3 py-2 text-[10.5px] font-black uppercase tracking-widest text-amber-400/80 border-b border-amber-800/40 mb-1">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>CUSTOMIZATION SECTIONS</span>
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-700/50 text-[9px] text-amber-300 font-mono">
              10 MODES
            </span>
          </div>

          {/* LATE-NIGHT EYE PROTECTION / GLOBAL DARK MODE TOGGLE */}
          <div className="hidden md:block mb-2 p-2.5 rounded-xl bg-[#281a10]/80 border border-amber-700/50 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-amber-950/80 border border-amber-600/40 flex items-center justify-center text-amber-400">
                  <Moon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-amber-100 block">Dark Mode</span>
                  <span className="text-[9.5px] text-amber-300/70 block">Late-Night Eye Care</span>
                </div>
              </div>
              <ThemeToggle variant="compact-switch" />
            </div>
          </div>

          {categoryList.map(item => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  playUiSound(tempConfig.audioFeedback);
                  setActiveTab(item.id);
                }}
                className={`relative px-3 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-left transition-all duration-200 cursor-pointer flex items-center justify-between shrink-0 md:w-full group ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-700/80 via-amber-800/90 to-[#382315] text-amber-100 border-2 border-amber-400/80 shadow-[0_4px_18px_rgba(217,119,6,0.25)] font-bold'
                    : 'bg-[#281a10]/60 hover:bg-[#342317] text-amber-200/70 hover:text-amber-100 border border-amber-900/40'
                }`}
              >
                <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                    isSelected 
                      ? 'bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.6)]' 
                      : 'bg-[#3b2719] text-amber-300 border border-amber-700/40'
                  }`}>
                    <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold truncate">
                      {item.label}
                    </div>
                    <div className="text-[10px] text-amber-300/60 font-medium truncate hidden sm:block">
                      {item.sublabel}
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex items-center space-x-1.5 ml-2">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border tracking-wider shrink-0 ${
                    isSelected 
                      ? 'bg-amber-950 text-amber-300 border-amber-400/60' 
                      : 'bg-[#1e130b] text-amber-400/70 border-amber-900/50'
                  }`}>
                    {item.activeValue}
                  </span>
                </div>
              </button>
            );
          })}
        </aside>

        {/* RIGHT MAIN WORKSPACE (FULL-WIDTH EXPANDED CARDS WITH MATTE WOOD GRAIN) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#180f08]/95 space-y-6">
          
          {/* SECTION HEADER BANNER */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#2c1d12] via-[#3a2618] to-[#25180f] border-2 border-amber-700/50 shadow-[0_0_20px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider">
                  CURRENT SECTION
                </span>
                <span className="text-xs text-amber-300/80 font-mono">
                  4 Configurable Styles
                </span>
              </div>
              <h2 className="font-serif font-black text-lg sm:text-2xl text-amber-100 mt-1">
                {categoryList.find(c => c.id === activeTab)?.label}
              </h2>
              <p className="text-xs sm:text-sm text-amber-200/70 mt-0.5">
                Select any option below for instant live visual transformation across the academy.
              </p>
            </div>

            <div className="px-3.5 py-1.5 rounded-xl bg-[#1d1209] border border-amber-600/40 text-amber-300 text-xs font-bold flex items-center space-x-2 shadow-inner">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Active: <strong>{categoryList.find(c => c.id === activeTab)?.activeValue}</strong></span>
            </div>
          </div>

          {/* DYNAMIC CONTENT AREA BASED ON SELECTED SIDEBAR TAB */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >

              {/* 1. AI TUTOR CARD UI (4 MODES) */}
              {activeTab === 'tutor' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
                  {aiTutorOptions.map(opt => {
                    const isCurrent = tempConfig.aiTutorCardStyle === opt.id;
                    return (
                      <motion.div
                        key={opt.id}
                        whileHover={{ y: -3, scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleSelect('aiTutorCardStyle', opt.id)}
                        className={`p-5 rounded-2xl sm:rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[190px] ${opt.previewBg} ${
                          isCurrent
                            ? 'border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.45)] ring-2 ring-amber-400/50'
                            : 'border-amber-900/40 hover:border-amber-600/70 opacity-85 hover:opacity-100'
                        }`}
                      >
                        {isCurrent && (
                          <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center space-x-1 shadow-md">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>ACTIVE 👑</span>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center space-x-2.5">
                            <span className="text-3xl">{opt.icon}</span>
                            <span className="text-[10px] font-black tracking-wider px-2.5 py-0.5 rounded-md bg-amber-950/80 text-amber-200 border border-amber-600/40 uppercase font-mono">
                              {opt.badge}
                            </span>
                          </div>

                          <h3 className="font-serif font-black text-base sm:text-lg text-amber-100 mt-3">
                            {opt.title}
                          </h3>
                          <p className="text-xs text-amber-200/80 mt-1.5 leading-relaxed">
                            {opt.desc}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-amber-900/40 flex items-center justify-between text-[11px] text-amber-400 font-bold">
                          <span>Preview Style</span>
                          <span className="underline">Click to Apply</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* 2. MASTER APP THEME LOOK (4 MODES) */}
              {activeTab === 'theme' && (
                <div className="space-y-4">
                  {/* Late-Night Dark Mode Toggle Card */}
                  <ThemeToggle variant="settings" className="border-2 border-amber-600/50 bg-[#25170f] shadow-[0_4px_24px_rgba(245,158,11,0.15)]" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
                    {themeOptions.map(thm => {
                    const isCurrent = tempConfig.appThemeLook === thm.id;
                    return (
                      <motion.div
                        key={thm.id}
                        whileHover={{ y: -3, scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleSelect('appThemeLook', thm.id)}
                        className={`p-5 rounded-2xl sm:rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden bg-[#24170e] flex flex-col justify-between min-h-[190px] ${
                          isCurrent
                            ? 'border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.45)] ring-2 ring-amber-400/50'
                            : 'border-amber-900/50 hover:border-amber-600/70 opacity-85 hover:opacity-100'
                        }`}
                      >
                        {isCurrent && (
                          <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center space-x-1 shadow-md">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>ACTIVE 👑</span>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center space-x-2">
                            <div className="flex -space-x-2">
                              {thm.colors.map((c, i) => (
                                <div
                                  key={i}
                                  className="w-6 h-6 rounded-full border-2 border-[#24170e] shadow-sm"
                                  style={{ backgroundColor: c }}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-amber-950/80 text-amber-200 border border-amber-600/40">
                              {thm.tag}
                            </span>
                          </div>

                          <h3 className="font-serif font-black text-base sm:text-lg text-amber-100 mt-3">
                            {thm.title}
                          </h3>
                          <p className="text-xs text-amber-200/80 mt-1.5 leading-relaxed">
                            {thm.desc}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-amber-900/40 flex items-center justify-between text-[11px] text-amber-400 font-bold">
                          <span>Theme Palette</span>
                          <span className="underline">Click to Apply</span>
                        </div>
                      </motion.div>
                    );
                  })}
                  </div>
                </div>
              )}

              {/* 3. LIGHTING EFFECT / 360 PERIMETER STRIP (4 MODES) */}
              {activeTab === 'lighting' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
                  {lightingOptions.map(light => {
                    const isCurrent = tempConfig.lightingEffect === light.id;
                    return (
                      <motion.div
                        key={light.id}
                        whileHover={{ y: -3, scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleSelect('lightingEffect', light.id)}
                        className={`p-5 rounded-2xl sm:rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden bg-[#24170e] flex flex-col justify-between min-h-[190px] ${
                          isCurrent
                            ? 'border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.45)] ring-2 ring-amber-400/50'
                            : 'border-amber-900/50 hover:border-amber-600/70 opacity-85 hover:opacity-100'
                        }`}
                      >
                        {isCurrent && (
                          <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center space-x-1 shadow-md">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>ACTIVE 👑</span>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-10 h-10 rounded-xl border-2 border-amber-400/60 shadow-md flex items-center justify-center text-xl shrink-0"
                              style={{ background: light.previewCss }}
                            >
                              {light.icon}
                            </div>
                            <div>
                              <h3 className="font-serif font-black text-base sm:text-lg text-amber-100">
                                {light.title}
                              </h3>
                              <span className="text-[10px] font-black uppercase text-amber-400">
                                360° Continuous Strip
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-amber-200/80 mt-3 leading-relaxed">
                            {light.desc}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-amber-900/40 flex items-center justify-between text-[11px] text-amber-400 font-bold">
                          <span>Perimeter Ribbon</span>
                          <span className="underline">Click to Apply</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* 4. TYPOGRAPHY & FONTS (4 MODES) */}
              {activeTab === 'font' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
                  {fontOptions.map(fnt => {
                    const isCurrent = tempConfig.fontFamilyStyle === fnt.id;
                    return (
                      <motion.div
                        key={fnt.id}
                        whileHover={{ y: -3, scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleSelect('fontFamilyStyle', fnt.id)}
                        className={`p-5 rounded-2xl sm:rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden bg-[#24170e] flex flex-col justify-between min-h-[190px] ${
                          isCurrent
                            ? 'border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.45)] ring-2 ring-amber-400/50'
                            : 'border-amber-900/50 hover:border-amber-600/70 opacity-85 hover:opacity-100'
                        }`}
                      >
                        {isCurrent && (
                          <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center space-x-1 shadow-md">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>ACTIVE 👑</span>
                          </div>
                        )}

                        <div>
                          <div className="p-3 rounded-xl bg-[#1a1009] border border-amber-800/40 text-amber-300 text-lg sm:text-xl font-black">
                            <span className={fnt.fontClass}>{fnt.sample}</span>
                          </div>

                          <h3 className="font-serif font-black text-base sm:text-lg text-amber-100 mt-3">
                            {fnt.title}
                          </h3>
                          <p className="text-xs text-amber-200/80 mt-1.5 leading-relaxed">
                            {fnt.desc}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-amber-900/40 flex items-center justify-between text-[11px] text-amber-400 font-bold">
                          <span>Typography Font</span>
                          <span className="underline">Click to Apply</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* 5. STATS BOXES / HUD LAYOUT (4 MODES) */}
              {activeTab === 'stats' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
                  {statOptions.map(st => {
                    const isCurrent = tempConfig.statBoxesLayout === st.id;
                    return (
                      <motion.div
                        key={st.id}
                        whileHover={{ y: -3, scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleSelect('statBoxesLayout', st.id)}
                        className={`p-5 rounded-2xl sm:rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden bg-[#24170e] flex flex-col justify-between min-h-[190px] ${
                          isCurrent
                            ? 'border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.45)] ring-2 ring-amber-400/50'
                            : 'border-amber-900/50 hover:border-amber-600/70 opacity-85 hover:opacity-100'
                        }`}
                      >
                        {isCurrent && (
                          <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center space-x-1 shadow-md">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>ACTIVE 👑</span>
                          </div>
                        )}

                        <div>
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-amber-950/80 text-amber-200 border border-amber-600/40 font-mono">
                            {st.badge}
                          </span>

                          <h3 className="font-serif font-black text-base sm:text-lg text-amber-100 mt-3">
                            {st.title}
                          </h3>
                          <p className="text-xs text-amber-200/80 mt-1.5 leading-relaxed">
                            {st.desc}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-amber-900/40 flex items-center justify-between text-[11px] text-amber-400 font-bold">
                          <span>HUD Geometry</span>
                          <span className="underline">Click to Apply</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* 6. CARD CORNER GEOMETRY (4 MODES) */}
              {activeTab === 'radius' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
                  {cornerOptions.map(cr => {
                    const isCurrent = tempConfig.cardBorderRadius === cr.id;
                    return (
                      <motion.div
                        key={cr.id}
                        whileHover={{ y: -3, scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleSelect('cardBorderRadius', cr.id)}
                        className={`p-5 rounded-2xl sm:rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden bg-[#24170e] flex flex-col justify-between min-h-[190px] ${
                          isCurrent
                            ? 'border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.45)] ring-2 ring-amber-400/50'
                            : 'border-amber-900/50 hover:border-amber-600/70 opacity-85 hover:opacity-100'
                        }`}
                      >
                        {isCurrent && (
                          <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center space-x-1 shadow-md">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>ACTIVE 👑</span>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center space-x-3">
                            <div className={`w-12 h-10 bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center ${cr.previewClass}`}>
                              <Layers className="w-4 h-4 text-amber-300" />
                            </div>
                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-amber-950/80 text-amber-200 border border-amber-600/40">
                              {cr.badge}
                            </span>
                          </div>

                          <h3 className="font-serif font-black text-base sm:text-lg text-amber-100 mt-3">
                            {cr.title}
                          </h3>
                          <p className="text-xs text-amber-200/80 mt-1.5 leading-relaxed">
                            {cr.desc}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-amber-900/40 flex items-center justify-between text-[11px] text-amber-400 font-bold">
                          <span>Corner Profile</span>
                          <span className="underline">Click to Apply</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* 7. GLOW INTENSITY & STRIP THICKNESS (4 MODES) */}
              {activeTab === 'intensity' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
                  {intensityOptions.map(nt => {
                    const isCurrent = tempConfig.neonIntensity === nt.id;
                    return (
                      <motion.div
                        key={nt.id}
                        whileHover={{ y: -3, scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleSelect('neonIntensity', nt.id)}
                        className={`p-5 rounded-2xl sm:rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden bg-[#24170e] flex flex-col justify-between min-h-[190px] ${
                          isCurrent
                            ? 'border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.45)] ring-2 ring-amber-400/50'
                            : 'border-amber-900/50 hover:border-amber-600/70 opacity-85 hover:opacity-100'
                        }`}
                      >
                        {isCurrent && (
                          <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center space-x-1 shadow-md">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>ACTIVE 👑</span>
                          </div>
                        )}

                        <div>
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-amber-950/80 text-amber-200 border border-amber-600/40">
                            {nt.badge}
                          </span>

                          <h3 className="font-serif font-black text-base sm:text-lg text-amber-100 mt-3">
                            {nt.title}
                          </h3>
                          <p className="text-xs text-amber-200/80 mt-1.5 leading-relaxed">
                            {nt.desc}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-amber-900/40 flex items-center justify-between text-[11px] text-amber-400 font-bold">
                          <span>Strip Width</span>
                          <span className="underline">Click to Apply</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* 8. LIVE WALLPAPER & AMBIANCE (4 MODES) */}
              {activeTab === 'wallpaper' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
                  {wallpaperOptions.map(wp => {
                    const isCurrent = tempConfig.wallpaperAmbiance === wp.id;
                    return (
                      <motion.div
                        key={wp.id}
                        whileHover={{ y: -3, scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleSelect('wallpaperAmbiance', wp.id)}
                        className={`p-5 rounded-2xl sm:rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden bg-[#24170e] flex flex-col justify-between min-h-[190px] ${
                          isCurrent
                            ? 'border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.45)] ring-2 ring-amber-400/50'
                            : 'border-amber-900/50 hover:border-amber-600/70 opacity-85 hover:opacity-100'
                        }`}
                      >
                        {isCurrent && (
                          <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center space-x-1 shadow-md">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>ACTIVE 👑</span>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center space-x-2.5">
                            <span className="text-3xl">{wp.icon}</span>
                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-amber-950/80 text-amber-200 border border-amber-600/40">
                              {wp.badge}
                            </span>
                          </div>

                          <h3 className="font-serif font-black text-base sm:text-lg text-amber-100 mt-3">
                            {wp.title}
                          </h3>
                          <p className="text-xs text-amber-200/80 mt-1.5 leading-relaxed">
                            {wp.desc}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-amber-900/40 flex items-center justify-between text-[11px] text-amber-400 font-bold">
                          <span>Wallpaper Theme</span>
                          <span className="underline">Click to Apply</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* 9. SOUND FX & HAPTIC AUDIO (4 MODES) */}
              {activeTab === 'sound' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
                  {soundOptions.map(snd => {
                    const isCurrent = tempConfig.audioFeedback === snd.id;
                    return (
                      <motion.div
                        key={snd.id}
                        whileHover={{ y: -3, scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleSelect('audioFeedback', snd.id)}
                        className={`p-5 rounded-2xl sm:rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden bg-[#24170e] flex flex-col justify-between min-h-[190px] ${
                          isCurrent
                            ? 'border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.45)] ring-2 ring-amber-400/50'
                            : 'border-amber-900/50 hover:border-amber-600/70 opacity-85 hover:opacity-100'
                        }`}
                      >
                        {isCurrent && (
                          <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center space-x-1 shadow-md">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>ACTIVE 👑</span>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center space-x-2.5">
                            <span className="text-3xl">{snd.icon}</span>
                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-amber-950/80 text-amber-200 border border-amber-600/40">
                              {snd.badge}
                            </span>
                          </div>

                          <h3 className="font-serif font-black text-base sm:text-lg text-amber-100 mt-3">
                            {snd.title}
                          </h3>
                          <p className="text-xs text-amber-200/80 mt-1.5 leading-relaxed">
                            {snd.desc}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-amber-900/40 flex items-center justify-between text-[11px] text-amber-400 font-bold">
                          <span>Audio Haptic</span>
                          <span className="underline">Click to Play & Apply</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* 10. DASHBOARD LAYOUT FLOW (4 MODES) */}
              {activeTab === 'layout' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
                  {layoutOptions.map(lay => {
                    const isCurrent = tempConfig.dashboardLayoutPreset === lay.id;
                    return (
                      <motion.div
                        key={lay.id}
                        whileHover={{ y: -3, scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleSelect('dashboardLayoutPreset', lay.id)}
                        className={`p-5 rounded-2xl sm:rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden bg-[#24170e] flex flex-col justify-between min-h-[190px] ${
                          isCurrent
                            ? 'border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.45)] ring-2 ring-amber-400/50'
                            : 'border-amber-900/50 hover:border-amber-600/70 opacity-85 hover:opacity-100'
                        }`}
                      >
                        {isCurrent && (
                          <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center space-x-1 shadow-md">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>ACTIVE 👑</span>
                          </div>
                        )}

                        <div>
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-amber-950/80 text-amber-200 border border-amber-600/40">
                            {lay.badge}
                          </span>

                          <h3 className="font-serif font-black text-base sm:text-lg text-amber-100 mt-3">
                            {lay.title}
                          </h3>
                          <p className="text-xs text-amber-200/80 mt-1.5 leading-relaxed">
                            {lay.desc}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-amber-900/40 flex items-center justify-between text-[11px] text-amber-400 font-bold">
                          <span>Dashboard Priority</span>
                          <span className="underline">Click to Apply</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

            </motion.div>
          </AnimatePresence>

        </main>
      </div>

      {/* MOBILE STICKY ACTIONS BAR */}
      <div className="relative z-20 shrink-0 md:hidden px-4 py-3 bg-[#1e140d] border-t-2 border-amber-800/60 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] flex items-center justify-between gap-3">
        <button
          onClick={handleReset}
          className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-amber-300 bg-[#2b1b11] hover:bg-[#3d2719] border border-amber-700/50 flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 animate-pulse"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>

        <button
          onClick={() => {
            playUiSound(tempConfig.audioFeedback);
            onClose();
          }}
          className="flex-[1.5] py-3 px-4 rounded-xl text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 border border-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.35)] flex items-center justify-center space-x-2 cursor-pointer active:scale-95 font-sans"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Save & Close</span>
        </button>
      </div>

    </div>
  );
}
