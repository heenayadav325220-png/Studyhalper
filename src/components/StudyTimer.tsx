import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Subject } from '../types';
import { AppLanguage, translate } from '../services/translations';

interface StudyTimerProps {
  isTagMode: boolean;
  language: AppLanguage;
  onSessionComplete?: (subject: Subject, durationMinutes: number) => void;
}

const SUBJECTS: Subject[] = ['Mathematics', 'Science', 'Biology', 'Physics', 'Chemistry', 'English'];

const SUBJECT_KEYS: Record<Subject, string> = {
  'Mathematics': 'subject_math',
  'Science': 'subject_science',
  'Biology': 'subject_biology',
  'Physics': 'subject_physics',
  'Chemistry': 'subject_chemistry',
  'English': 'subject_english'
};

export function StudyTimer({ isTagMode, language, onSessionComplete }: StudyTimerProps) {
  const [selectedSubject, setSelectedSubject] = useState<Subject>('Mathematics');
  const [seconds, setSeconds] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [originalDuration, setOriginalDuration] = useState(25 * 60);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((s) => s - 1);
      }, 1000);
    } else if (isActive && seconds === 0) {
      setIsActive(false);
      const minutesCompleted = Math.round(originalDuration / 60);
      if (onSessionComplete) {
        onSessionComplete(selectedSubject, minutesCompleted);
      }
      const msg = translate('timer_completion_msg', language, "Fantastic work! You've completed a {min}-minute focus session on {sub}! Your study session is logged to your learning history.")
        .replace('{min}', minutesCompleted.toString())
        .replace('{sub}', translate(SUBJECT_KEYS[selectedSubject], language, selectedSubject));
      alert(`🎉 ${msg}`);
      setSeconds(25 * 60);
    } else if (!isActive && seconds !== 0) {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, seconds, originalDuration, selectedSubject, onSessionComplete, language]);

  const toggle = () => setIsActive(!isActive);
  const reset = () => {
    setSeconds(25 * 60);
    setOriginalDuration(25 * 60);
    setIsActive(false);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = time % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSetTimer = (mins: number) => {
    setSeconds(mins * 60);
    setOriginalDuration(mins * 60);
    setIsActive(false);
  };

  return (
    <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${isTagMode ? 'bg-slate-950 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'bg-indigo-50 border-indigo-100'}`}>
      <div className="flex justify-between items-center border-b pb-2 border-indigo-100/30">
        <h3 className={`text-xs font-extrabold uppercase tracking-tight ${isTagMode ? 'text-cyan-400' : 'text-indigo-900'}`}>
          {translate('focus_timer', language, 'Focus Timer')}
        </h3>
        <span className={`text-2xl font-mono font-bold ${isTagMode ? 'text-cyan-300' : 'text-indigo-700'}`}>{formatTime(seconds)}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[8px] uppercase font-black text-slate-400 tracking-wider mb-1">
            {translate('study_subject', language, 'Study Subject')}
          </label>
          <select 
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value as Subject)}
            disabled={isActive}
            className={`w-full p-2 text-[11px] font-bold border rounded-xl outline-none transition ${isTagMode ? 'bg-slate-900 border-cyan-800 text-cyan-300' : 'bg-white border-indigo-200 text-slate-700'}`}
          >
            {SUBJECTS.map(subj => (
              <option key={subj} value={subj}>{translate(SUBJECT_KEYS[subj], language, subj)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[8px] uppercase font-black text-slate-400 tracking-wider mb-1">
            {translate('duration_presets', language, 'Duration Presets')}
          </label>
          <div className="flex gap-1">
            {[5, 25, 50].map(mins => (
              <button
                key={mins}
                type="button"
                disabled={isActive}
                onClick={() => handleSetTimer(mins)}
                className={`flex-1 py-1 text-[10px] font-bold border rounded-xl outline-none transition ${
                  originalDuration === mins * 60
                    ? (isTagMode ? 'bg-cyan-900 border-cyan-400 text-cyan-300' : 'bg-indigo-600 border-indigo-600 text-white')
                    : (isTagMode ? 'bg-slate-900 border-cyan-950 text-cyan-700 hover:bg-slate-800' : 'bg-white border-indigo-100 text-indigo-700 hover:bg-indigo-50')
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={toggle} className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex justify-center items-center gap-2 transition ${isTagMode ? 'bg-cyan-600 text-white hover:bg-cyan-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
          {isActive ? <Pause size={14} /> : <Play size={14} />}
          {isActive ? translate('pause_btn', language, 'Pause') : translate('start_session', language, 'Start Session')}
        </button>
        <button onClick={reset} className={`p-2.5 rounded-xl transition ${isTagMode ? 'bg-cyan-900 text-cyan-300 hover:bg-cyan-800' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}>
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}
