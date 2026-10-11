import { useState, useEffect, memo } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Moon, X, Music } from 'lucide-react';
import { audioEngine, STUDY_TRACKS, Track } from '../services/audioEngine';

interface MusicPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  appLanguage: string;
}

export const MusicPlayerModal = memo(function MusicPlayerModal({
  isOpen,
  onClose,
  appLanguage
}: MusicPlayerModalProps) {
  const [, setTick] = useState(0);
  const isPlaying = audioEngine.getIsPlaying();
  const currentTrack: Track = audioEngine.getTrack();
  const volume = audioEngine.getVolume();

  useEffect(() => {
    const unsubscribe = audioEngine.subscribe(() => {
      setTick(t => t + 1);
    });
    const interval = setInterval(() => {
      if (audioEngine.getIsPlaying()) {
        setTick(t => t + 1);
      }
    }, 250); // 4 times per second throttled update
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  if (!isOpen) return null;

  const progress = audioEngine.getProgress();

  return (
    <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl p-5 shadow-xl text-slate-100 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                {appLanguage === 'hi' ? 'स्टडी म्यूज़िक प्लेयर' : 'Study Music Player'}
              </h3>
              <p className="text-[10px] text-slate-400">
                {appLanguage === 'hi' ? 'फोकस और शांति के लिए गाने' : 'Focus beats & study songs'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Track Info */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-3xl shadow-inner">
            {currentTrack.coverEmoji}
          </div>
          <div>
            <h4 className="text-sm font-black text-white truncate">{currentTrack.title}</h4>
            <p className="text-[11px] text-indigo-300 truncate">{currentTrack.subtitle}</p>
          </div>

          {/* Progress bar */}
          <div className="space-y-1 pt-2">
            <input
              type="range"
              min={0}
              max={progress.duration || 100}
              value={progress.currentTime}
              onChange={(e) => audioEngine.seek(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>{Math.floor(progress.currentTime / 60)}:{Math.floor(progress.currentTime % 60).toString().padStart(2, '0')}</span>
              <span>{currentTrack.duration}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-4 py-1">
          <button
            type="button"
            onClick={() => audioEngine.prevTrack()}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
            title="Previous Track"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => audioEngine.togglePlay()}
            className="p-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition cursor-pointer active:scale-95"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>
          <button
            type="button"
            onClick={() => audioEngine.nextTrack()}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
            title="Next Track"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Volume & Sleep Timer */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
          <div className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <Volume2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => audioEngine.setVolume(Number(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <select
              onChange={(e) => audioEngine.setSleepTimer(Number(e.target.value))}
              className="bg-transparent text-slate-300 text-[11px] font-bold focus:outline-none cursor-pointer w-full"
              defaultValue={0}
            >
              <option value={0} className="bg-slate-900">Sleep Timer: Off</option>
              <option value={15} className="bg-slate-900">15 mins</option>
              <option value={30} className="bg-slate-900">30 mins</option>
              <option value={60} className="bg-slate-900">60 mins</option>
            </select>
          </div>
        </div>

        {/* Playlist */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
            {appLanguage === 'hi' ? 'प्लेलिस्ट (3 गाने)' : 'Study Playlist (3 Tracks)'}
          </label>
          <div className="space-y-1 max-h-40 overflow-y-auto no-scrollbar">
            {STUDY_TRACKS.map((track, idx) => {
              const isCurrent = track.id === currentTrack.id;
              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => audioEngine.playTrack(idx)}
                  className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                    isCurrent
                      ? 'bg-indigo-600/20 border border-indigo-500/50 text-indigo-200 font-bold'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="text-sm">{track.coverEmoji}</span>
                    <div className="truncate">
                      <div className="truncate font-semibold">{track.title}</div>
                      <div className="text-[9px] text-slate-400 truncate">{track.subtitle}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0 pl-2">{track.duration}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});
