import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  variant?: 'header' | 'compact' | 'pill' | 'lunar';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', variant = 'header' }) => {
  const { toggleTheme, isDark } = useTheme();

  if (variant === 'lunar') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`w-8 h-8 rounded-full bg-[#2a2420] hover:bg-[#38312b] border border-[#483e36] text-purple-300 flex items-center justify-center cursor-pointer transition shadow-xs active:scale-95 shrink-0 ${className}`}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
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
            ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700/60'
            : 'bg-slate-100 hover:bg-slate-200 text-indigo-600 border border-slate-200'
        } ${className}`}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDark ? (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-200 text-[11px]">Light Mode</span>
          </>
        ) : (
          <>
            <Moon className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-slate-700 text-[11px]">Dark Mode</span>
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
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle light and dark mode theme"
    >
      {isDark ? (
        <Sun className="w-3.5 h-3.5 text-amber-400 animate-in spin-in-180 duration-200" />
      ) : (
        <Moon className="w-3.5 h-3.5 text-indigo-600 animate-in spin-in-180 duration-200" />
      )}
    </button>
  );
};

export default ThemeToggle;
