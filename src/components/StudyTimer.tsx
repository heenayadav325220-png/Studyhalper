import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

export function StudyTimer({ isTagMode }: { isTagMode: boolean }) {
  const [seconds, setSeconds] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((s) => s - 1);
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, seconds]);

  const toggle = () => setIsActive(!isActive);
  const reset = () => {
    setSeconds(25 * 60);
    setIsActive(false);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = time % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${isTagMode ? 'bg-slate-950 border-cyan-500/50' : 'bg-indigo-50 border-indigo-100'}`}>
      <div className="flex justify-between items-center">
        <h3 className={`text-lg font-bold ${isTagMode ? 'text-cyan-400' : 'text-indigo-900'}`}>Focus Timer</h3>
        <span className={`text-3xl font-mono font-bold ${isTagMode ? 'text-cyan-300' : 'text-indigo-700'}`}>{formatTime(seconds)}</span>
      </div>
      <div className="flex gap-2">
        <button onClick={toggle} className={`flex-1 py-3 rounded-xl font-semibold flex justify-center items-center gap-2 ${isTagMode ? 'bg-cyan-600 text-white hover:bg-cyan-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
          {isActive ? <Pause size={20} /> : <Play size={20} />}
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button onClick={reset} className={`p-3 rounded-xl ${isTagMode ? 'bg-cyan-900 text-cyan-300 hover:bg-cyan-800' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}>
          <RotateCcw size={20} />
        </button>
      </div>
    </div>
  );
}
