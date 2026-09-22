import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  variant?: 'header' | 'compact' | 'pill' | 'lunar' | 'settings' | 'compact-switch';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '', 
  variant = 'header',
  showLabel = true 
}) => {
  const { toggleTheme, isDark } = useTheme();

  if (variant === 'settings') {
    return (
      <div 
        onClick={toggleTheme}
        className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none ${
          isDark
            ? 'bg-slate-900/90 hover:bg-slate-850 border-indigo-500/40 shadow-[0_4px_20px_rgba(99,102,241,0.2)]'
            : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
        } ${className}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-start sm:items-center space-x-3 min-w-0">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 ${
              isDark 
                ? 'bg-indigo-600/30 text-amber-400 border border-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.4)]' 
                : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
            }`}>
              {isDark ? <Moon className="w-5 h-5 text-amber-400 animate-in spin-in-12 duration-200" /> : <Sun className="w-5 h-5 text-amber-500" />}
            </div>
            
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className={`text-xs sm:text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Late-Night Dark Mode
                </span>
                <span className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full border tracking-wide shrink-0 ${
                  isDark
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}>
                  {isDark ? 'ON (Eye Comfort)' : 'OFF (Daylight)'}
                </span>
              </div>
              <p className={`text-[11px] leading-tight mt-0.5 ${isDark ? 'text-slate-300/80' : 'text-slate-500'}`}>
                Reduces blue light & eye strain during late-night study sessions • Auto-saved to localStorage
              </p>
            </div>
          </div>

          {/* Interactive Sliding Toggle Switch */}
          <button
            type="button"
            aria-label="Toggle dark mode"
            aria-checked={isDark}
            role="switch"
            onClick={(e) => {
              e.stopPropagation();
              toggleTheme();
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isDark ? 'bg-indigo-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                isDark ? 'translate-x-5' : 'translate-x-0'
              }`}
            >
              {isDark ? (
                <Moon className="w-3 h-3 text-indigo-700" />
              ) : (
                <Sun className="w-3 h-3 text-amber-500" />
              )}
            </span>
          </button>
        </div>
      </div>
    );
  }

  if (variant === 'compact-switch') {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label="Toggle dark mode"
        onClick={toggleTheme}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          isDark ? 'bg-indigo-600' : 'bg-slate-300'
        } ${className}`}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode (Reduces Eye Strain)'}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
            isDark ? 'translate-x-5' : 'translate-x-0'
          }`}
        >
          {isDark ? (
            <Moon className="w-3 h-3 text-indigo-700" />
          ) : (
            <Sun className="w-3 h-3 text-amber-500" />
          )}
        </span>
      </button>
    );
  }

  if (variant === 'lunar') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`w-8 h-8 rounded-full bg-[#2a2420] hover:bg-[#38312b] border border-[#483e36] text-purple-300 flex items-center justify-center cursor-pointer transition shadow-xs active:scale-95 shrink-0 ${className}`}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode (Late-Night Eye Care)'}
      >
        <span className="text-sm select-none">🌙</span>
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          isDark
            ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700/60 shadow-xs'
            : 'bg-slate-100 hover:bg-slate-200 text-indigo-600 border border-slate-200 shadow-xs'
        } ${className}`}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode (Late-Night Eye Care)'}
      >
        {isDark ? (
          <>
            <Moon className="w-3.5 h-3.5 text-amber-400 animate-in spin-in-12 duration-200" />
            {showLabel && <span className="text-slate-200 text-[11px]">Dark Mode</span>}
          </>
        ) : (
          <>
            <Sun className="w-3.5 h-3.5 text-indigo-600 animate-in spin-in-12 duration-200" />
            {showLabel && <span className="text-slate-700 text-[11px]">Light Mode</span>}
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-1.5 rounded-full transition-all cursor-pointer border active:scale-95 shrink-0 flex items-center justify-center ${
        isDark
          ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700 shadow-xs'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 shadow-xs'
      } ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode (Late-Night Eye Care)'}
      aria-label="Toggle light and dark mode theme"
    >
      {isDark ? (
        <Moon className="w-3.5 h-3.5 text-amber-400 animate-in spin-in-180 duration-200" />
      ) : (
        <Sun className="w-3.5 h-3.5 text-indigo-600 animate-in spin-in-180 duration-200" />
      )}
    </button>
  );
};

export default ThemeToggle;
