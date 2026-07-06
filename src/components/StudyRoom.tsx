import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Paintbrush, Square, Circle as CircleIcon, Type, StickyNote, Eraser, 
  Trash2, Play, Pause, RotateCcw, MessageSquare, FileText, Users, 
  Send, Clock, Sparkles, Check, ChevronRight, ChevronLeft, CheckCircle2, RefreshCw
} from 'lucide-react';
import { 
  subscribeToWhiteboard, 
  addWhiteboardElement, 
  deleteWhiteboardElement, 
  clearWhiteboard, 
  subscribeToSharedNotes, 
  updateSharedNotes, 
  subscribeToSharedTimer, 
  updateSharedTimer,
  sendGroupMessage,
  subscribeToGroupMessages
} from '../services/firebaseDb';
import { GroupSession, GroupMessage, Subject } from '../types';

interface StudyRoomProps {
  session: GroupSession;
  groupId: string | number;
  user: { id: string | number; name: string; avatar?: string };
  appLanguage: string;
  onClose: () => void;
}

export default function StudyRoom({ session, groupId, user, appLanguage, onClose }: StudyRoomProps) {
  const isHindi = appLanguage === 'Hindi';

  // Navigation tabs: whiteboard, notes, chat
  const [activeTab, setActiveTab] = useState<'whiteboard' | 'notes' | 'chat'>('whiteboard');

  // Whiteboard states
  const [boardElements, setBoardElements] = useState<any[]>([]);
  const [activeTool, setActiveTool] = useState<'pen' | 'rect' | 'circle' | 'text' | 'sticky' | 'eraser'>('pen');
  const [selectedColor, setSelectedColor] = useState<string>('#4f46e5'); // Default: indigo
  const [textInput, setTextInput] = useState<string>('');
  const [textPlacement, setTextPlacement] = useState<{ x: number; y: number } | null>(null);
  const [stickyPlacement, setStickyPlacement] = useState<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
  const [shapeStart, setShapeStart] = useState<{ x: number; y: number } | null>(null);
  const [tempShape, setTempShape] = useState<any | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Shared Notes states
  const [sharedNotes, setSharedNotes] = useState<{ content: string; updatedAt: string; updatedBy: string }>({
    content: '',
    updatedAt: '',
    updatedBy: ''
  });
  const [localNoteText, setLocalNoteText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Shared Pomodoro states
  const [timerState, setTimerState] = useState<{ status: 'idle' | 'running' | 'paused'; timeLeft: number; duration: number }>({
    status: 'idle',
    timeLeft: 1500,
    duration: 1500
  });

  // Chat states
  const [chatMessages, setChatMessages] = useState<GroupMessage[]>([]);
  const [messageText, setMessageText] = useState<string>('');
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Attendees (simulated based on RSVPs and presence)
  const [activeAttendees, setActiveAttendees] = useState<any[]>([]);

  // Sound effects toggles (mocked for focus state)
  const [studyMusic, setStudyMusic] = useState<boolean>(false);
  const [currentTrackIdx, setCurrentTrackIdx] = useState<number>(0);
  const [focusVolume, setFocusVolume] = useState<number>(0.15);
  const [audioStream, setAudioStream] = useState<any | null>(null);

  // 1. Subscribe to whiteboard elements
  useEffect(() => {
    const unsub = subscribeToWhiteboard(groupId, session.id, (elements) => {
      setBoardElements(elements);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [groupId, session.id]);

  // 2. Subscribe to collaborative notes
  useEffect(() => {
    const unsub = subscribeToSharedNotes(groupId, session.id, (data) => {
      if (data) {
        setSharedNotes(data);
        // Only override local text when not actively typing to avoid cursor jumps
        if (!isTyping) {
          setLocalNoteText(data.content);
        }
      }
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [groupId, session.id, isTyping]);

  // 3. Subscribe to shared timer
  useEffect(() => {
    const unsub = subscribeToSharedTimer(groupId, session.id, (data) => {
      if (data) {
        setTimerState({
          status: data.status,
          timeLeft: data.timeLeft,
          duration: data.duration
        });
      }
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [groupId, session.id]);

  // Local timer counting tick (only one master/participant runs ticks to keep UI snappy)
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (timerState.status === 'running') {
      intervalId = setInterval(() => {
        setTimerState(prev => {
          if (prev.timeLeft <= 1) {
            clearInterval(intervalId!);
            // Finished! Reset timer state to idle
            const finalState = { status: 'idle' as const, timeLeft: prev.duration, duration: prev.duration };
            updateSharedTimer(groupId, session.id, finalState);
            // Play a notification sound or alert
            try {
              const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav");
              audio.volume = 0.3;
              audio.play();
            } catch (e) {
              console.log("Audio play blocked by browser.");
            }
            return finalState;
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [timerState.status, groupId, session.id]);

  // 4. Subscribe to group / session message stream
  useEffect(() => {
    const unsub = subscribeToGroupMessages(groupId, (messages) => {
      setChatMessages(messages);
      // Auto-scroll
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [groupId]);

  // Generate active study buddies from RSVP and mock some simulated students joined in real time
  useEffect(() => {
    const baseline = (session.rsvps || []).map((rsvp: any) => ({
      id: rsvp.user_id,
      name: rsvp.user_name,
      avatar: rsvp.user_id === String(user.id) ? (user.avatar || '🎓') : '🎒',
      isMe: rsvp.user_id === String(user.id),
      status: 'Joined'
    }));

    if (!baseline.some(b => b.isMe)) {
      baseline.push({
        id: String(user.id),
        name: user.name,
        avatar: user.avatar || '🎓',
        isMe: true,
        status: 'Joined'
      });
    }

    // Add 1-2 study partners automatically to make the multi-user study room feel lively
    const extraBuddies = [
      { id: 'buddy_1', name: 'Aarav Sharma', avatar: '🦁', isMe: false, status: 'Studying' },
      { id: 'buddy_2', name: 'Riya Patel', avatar: '🦊', isMe: false, status: 'In Board' }
    ];
    setActiveAttendees([...baseline, ...extraBuddies]);
  }, [session.rsvps, user, session.id]);

  // Helper to map mouse coordinates to SVG layout
  const getCoordinates = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    // Translate client mouse coordinates relative to the 800x500 viewBox coordinates
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 800);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 500);
    return { x, y };
  };

  // Handle whiteboard mouse actions
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const { x, y } = getCoordinates(e);

    if (activeTool === 'eraser') {
      // Find elements near coordinates and delete
      const clickedElement = boardElements.find((el) => {
        if (el.x !== null && el.y !== null) {
          const dx = el.x - x;
          const dy = el.y - y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          return dist < 40; // Proximity threshold
        }
        if (el.points && el.points.length > 0) {
          return el.points.some((p: any) => {
            const dx = p.x - x;
            const dy = p.y - y;
            return Math.sqrt(dx*dx + dy*dy) < 15;
          });
        }
        return false;
      });
      if (clickedElement) {
        deleteWhiteboardElement(groupId, session.id, clickedElement.id);
      }
      return;
    }

    if (activeTool === 'text') {
      setTextPlacement({ x, y });
      setStickyPlacement(null);
      setTextInput('');
      return;
    }

    if (activeTool === 'sticky') {
      setStickyPlacement({ x, y });
      setTextPlacement(null);
      setTextInput('');
      return;
    }

    setIsDrawing(true);
    if (activeTool === 'pen') {
      setCurrentStroke([{ x, y }]);
    } else {
      setShapeStart({ x, y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);

    if (activeTool === 'pen') {
      const nextStroke = [...currentStroke, { x, y }];
      setCurrentStroke(nextStroke);
      setTempShape({
        type: 'pen',
        points: nextStroke,
        color: selectedColor
      });
    } else if (shapeStart) {
      const width = Math.abs(x - shapeStart.x);
      const height = Math.abs(y - shapeStart.y);
      const minX = Math.min(x, shapeStart.x);
      const minY = Math.min(y, shapeStart.y);

      if (activeTool === 'rect') {
        setTempShape({
          type: 'rect',
          x: minX,
          y: minY,
          width,
          height,
          color: selectedColor
        });
      } else if (activeTool === 'circle') {
        const radius = Math.round(Math.sqrt(width * width + height * height) / 2);
        setTempShape({
          type: 'circle',
          x: Math.round((shapeStart.x + x) / 2),
          y: Math.round((shapeStart.y + y) / 2),
          width: radius, // Using width as radius
          color: selectedColor
        });
      }
    }
  };

  const handleMouseUp = async (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (activeTool === 'pen' && currentStroke.length > 1) {
      await addWhiteboardElement(groupId, session.id, {
        type: 'pen',
        points: currentStroke,
        color: selectedColor,
        creatorId: user.id,
        creatorName: user.name
      });
    } else if (tempShape) {
      await addWhiteboardElement(groupId, session.id, {
        ...tempShape,
        creatorId: user.id,
        creatorName: user.name
      });
    }

    setCurrentStroke([]);
    setShapeStart(null);
    setTempShape(null);
  };

  // Submit text or sticky notes to whiteboard
  const handlePlaceTextOrSticky = async () => {
    if (!textInput.trim()) return;

    if (textPlacement) {
      await addWhiteboardElement(groupId, session.id, {
        type: 'text',
        x: textPlacement.x,
        y: textPlacement.y,
        text: textInput.trim(),
        color: selectedColor,
        creatorId: user.id,
        creatorName: user.name
      });
      setTextPlacement(null);
    } else if (stickyPlacement) {
      await addWhiteboardElement(groupId, session.id, {
        type: 'sticky',
        x: stickyPlacement.x - 60, // Center sticky notes
        y: stickyPlacement.y - 60,
        width: 120,
        height: 120,
        text: textInput.trim(),
        color: selectedColor,
        creatorId: user.id,
        creatorName: user.name
      });
      setStickyPlacement(null);
    }
    setTextInput('');
  };

  // Clear whiteboard element
  const handleClearAllElements = async () => {
    if (boardElements.length === 0) return;
    const confirmClear = window.confirm(
      isHindi 
        ? "क्या आप सचमुच पूरे स्टडी बोर्ड को साफ़ करना चाहते हैं?" 
        : "Are you sure you want to clear the entire study board?"
    );
    if (confirmClear) {
      await clearWhiteboard(groupId, session.id, boardElements.map(el => el.id));
    }
  };

  // Collaborative Notepad logic: updates with debounce
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalNoteText(val);
    setIsTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(async () => {
      setIsTyping(false);
      await updateSharedNotes(groupId, session.id, val, user.name);
    }, 1000); // 1-second debounce saves traffic and prevents overlapping state locks
  };

  // Pomodoro shared remote controls
  const handleTimerAction = async (action: 'start' | 'pause' | 'reset') => {
    if (action === 'start') {
      await updateSharedTimer(groupId, session.id, {
        status: 'running',
        timeLeft: timerState.timeLeft,
        duration: timerState.duration
      });
    } else if (action === 'pause') {
      await updateSharedTimer(groupId, session.id, {
        status: 'paused',
        timeLeft: timerState.timeLeft,
        duration: timerState.duration
      });
    } else if (action === 'reset') {
      await updateSharedTimer(groupId, session.id, {
        status: 'idle',
        timeLeft: timerState.duration,
        duration: timerState.duration
      });
    }
  };

  const handleTimerDurationChange = async (minutes: number) => {
    const seconds = minutes * 60;
    await updateSharedTimer(groupId, session.id, {
      status: 'idle',
      timeLeft: seconds,
      duration: seconds
    });
  };

  // Chat message sending
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    // Direct room message sending
    const formattedText = `[Room Session Chat: ${session.title}] ${messageText.trim()}`;
    await sendGroupMessage(groupId, user.id, user.name, formattedText, null);
    setMessageText('');
  };

  // Time format helper
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/95 backdrop-blur-md animate-fade-in text-slate-100">
      
      {/* Immersive Room Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-xs animate-pulse">
            <Sparkles className="w-5 height-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/10">
                {isHindi ? "लाइव स्टडी रूम" : "Live Study Room"}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {session.duration} mins
              </span>
            </div>
            <h1 className="text-base font-extrabold text-slate-100 mt-0.5">{session.title}</h1>
            <p className="text-[11px] text-slate-400 font-semibold">{isHindi ? "विषय:" : "Topic:"} {session.topic || (isHindi ? "सामान्य पढ़ाई" : "General Study")}</p>
          </div>
        </div>

        {/* Central Sync Status & Timer Bar */}
        <div className="hidden md:flex items-center gap-4 bg-slate-950/60 px-5 py-2.5 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${timerState.status === 'running' ? 'bg-emerald-500 animate-ping' : 'bg-amber-400'}`}></span>
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              {isHindi ? "साझा पोमोडोरो" : "SHARED POMODORO"}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-lg font-black text-indigo-300 tracking-wider">
            {formatTime(timerState.timeLeft)}
          </div>

          {/* Core Controls */}
          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
            {timerState.status !== 'running' ? (
              <button 
                onClick={() => handleTimerAction('start')} 
                className="p-1 text-slate-400 hover:text-emerald-400 transition hover:bg-slate-800/80 rounded-lg cursor-pointer"
                title="Start Pomodoro"
              >
                <Play className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={() => handleTimerAction('pause')} 
                className="p-1 text-slate-400 hover:text-amber-400 transition hover:bg-slate-800/80 rounded-lg cursor-pointer"
                title="Pause"
              >
                <Pause className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={() => handleTimerAction('reset')} 
              className="p-1 text-slate-400 hover:text-rose-400 transition hover:bg-slate-800/80 rounded-lg cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Quick preset */}
          <div className="flex items-center gap-1 text-[10px] font-bold border-l border-slate-800 pl-3">
            <button onClick={() => handleTimerDurationChange(15)} className="px-1.5 py-0.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white">15m</button>
            <button onClick={() => handleTimerDurationChange(25)} className="px-1.5 py-0.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white">25m</button>
            <button onClick={() => handleTimerDurationChange(50)} className="px-1.5 py-0.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white">50m</button>
          </div>
        </div>

        {/* Right Exit Button */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose} 
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-850 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 rounded-xl text-xs font-black tracking-wide border border-slate-800 hover:border-rose-900/30 active:scale-95 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>{isHindi ? "कमरा छोड़ें" : "Exit Room"}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Side Active Attendees / Navigation Rail */}
        <section className="w-20 md:w-64 border-r border-slate-850 bg-slate-900/35 flex flex-col overflow-y-auto">
          {/* Active Members Header */}
          <div className="p-4 border-b border-slate-850 hidden md:block">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>{isHindi ? "सक्रिय सहपाठी" : "Active Students"}</span>
              <span className="ml-auto bg-indigo-500/20 text-indigo-300 text-[10px] px-1.5 py-0.2 rounded-full">
                {activeAttendees.length}
              </span>
            </h3>
          </div>

          {/* Member avatars */}
          <div className="flex-1 p-2 md:p-3 space-y-2">
            {activeAttendees.map((att) => (
              <div 
                key={att.id} 
                className={`flex items-center gap-3 p-2 rounded-xl transition cursor-default ${att.isMe ? 'bg-indigo-950/20 border border-indigo-900/30' : 'hover:bg-slate-850/35'}`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-base shadow-xs select-none">
                    {att.avatar || '🎓'}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
                </div>
                <div className="hidden md:block min-w-0 flex-1">
                  <p className="text-xs font-extrabold truncate text-slate-200">
                    {att.name} {att.isMe && <span className="text-[9px] text-indigo-400 font-bold">(You)</span>}
                  </p>
                  <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                    {att.status}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Ambient Sound Generator for Focus */}
          <div className="p-3 border-t border-slate-850 space-y-2.5 hidden md:block bg-slate-950/20">
            <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-500">{isHindi ? "एकाग्रता ध्वनियाँ" : "Focus Ambience Deck"}</h4>
            
            {(() => {
              const focusTracks = [
                { id: 'lofi_1', name: isHindi ? 'लो-फाई चिल्स 🎧' : 'Lofi Chills 🎧', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
                { id: 'lofi_2', name: isHindi ? 'कॉस्मिक मेलोडी 🌌' : 'Cosmic Melody 🌌', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
                { id: 'lofi_3', name: isHindi ? 'अन्वेषण संगीत 🧭' : 'Explorer Beats 🧭', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
                { id: 'lofi_4', name: isHindi ? 'ध्यान राग 🧘' : 'Zen Meditation 🧘', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' }
              ];
              return (
                <div className="space-y-2 p-2.5 rounded-xl bg-slate-900 border border-slate-850 shadow-inner">
                  {/* Track Selector Row */}
                  <div className="flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const prevIdx = (currentTrackIdx - 1 + focusTracks.length) % focusTracks.length;
                        setCurrentTrackIdx(prevIdx);
                        try {
                          const id = 'lofi-audio-player';
                          const el = document.getElementById(id) as HTMLAudioElement;
                          if (el) {
                            el.src = focusTracks[prevIdx].url;
                            if (studyMusic) {
                              el.play().catch(e => console.log(e));
                            }
                          }
                        } catch (err) {}
                      }}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer transition"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    
                    <span className="text-[10px] font-extrabold text-indigo-300 text-center flex-1 truncate">
                      {focusTracks[currentTrackIdx].name}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        const nextIdx = (currentTrackIdx + 1) % focusTracks.length;
                        setCurrentTrackIdx(nextIdx);
                        try {
                          const id = 'lofi-audio-player';
                          const el = document.getElementById(id) as HTMLAudioElement;
                          if (el) {
                            el.src = focusTracks[nextIdx].url;
                            if (studyMusic) {
                              el.play().catch(e => console.log(e));
                            }
                          }
                        } catch (err) {}
                      }}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer transition"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Controls and Volume Sliders */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
                    <button 
                      onClick={() => {
                        const nextPlayState = !studyMusic;
                        setStudyMusic(nextPlayState);
                        try {
                          const id = 'lofi-audio-player';
                          let el = document.getElementById(id) as HTMLAudioElement;
                          if (!el) {
                            el = document.createElement('audio');
                            el.id = id;
                            el.src = focusTracks[currentTrackIdx].url;
                            el.loop = true;
                            el.volume = focusVolume;
                            document.body.appendChild(el);
                          }
                          if (nextPlayState) {
                            el.volume = focusVolume;
                            el.play().catch(e => console.log(e));
                          } else {
                            el.pause();
                          }
                        } catch (e) {}
                      }} 
                      className={`p-1.5 rounded-lg transition shrink-0 cursor-pointer ${studyMusic ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                      title={studyMusic ? (isHindi ? "रोकें" : "Pause") : (isHindi ? "चलाएं" : "Play")}
                    >
                      {studyMusic ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    </button>

                    {/* Volume slider */}
                    <div className="flex-1 flex items-center gap-1">
                      <span className="text-[10px] text-slate-500">🔈</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={focusVolume}
                        onChange={(e) => {
                          const vol = parseFloat(e.target.value);
                          setFocusVolume(vol);
                          try {
                            const id = 'lofi-audio-player';
                            const el = document.getElementById(id) as HTMLAudioElement;
                            if (el) {
                              el.volume = vol;
                            }
                          } catch (err) {}
                        }}
                        className="w-full accent-indigo-500 h-1 rounded-full cursor-pointer bg-slate-800"
                      />
                      <span className="text-[9px] font-mono text-slate-400 w-6 text-right">
                        {Math.round(focusVolume * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </section>

        {/* Center Canvas or Workspace area */}
        <section className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
          
          {/* Tool tab select bar */}
          <div className="flex items-center px-4 py-2 border-b border-slate-850 bg-slate-900/40 relative z-10">
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800/80">
              <button 
                onClick={() => setActiveTab('whiteboard')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${activeTab === 'whiteboard' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Paintbrush className="w-3.5 h-3.5" />
                <span>{isHindi ? "स्टडी व्हाइटबोर्ड" : "Interactive Board"}</span>
              </button>
              <button 
                onClick={() => setActiveTab('notes')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${activeTab === 'notes' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{isHindi ? "साझा नोट्स पैड" : "Shared Notes"}</span>
              </button>
              <button 
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{isHindi ? "लाइव चैट" : "Live Room Chat"}</span>
              </button>
            </div>

            <div className="ml-auto text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
              <span>{isHindi ? "रीयल-टाइम सिंक चालू है" : "Real-time sync active"}</span>
            </div>
          </div>

          {/* Area 1: SVG Whiteboard */}
          {activeTab === 'whiteboard' && (
            <div className="flex-1 flex flex-col min-h-0 relative">
              
              {/* Floating Drawing Tool Belt */}
              <div className="absolute top-4 left-4 z-20 flex flex-row items-center gap-1.5 bg-slate-900/90 border border-slate-850 p-2 rounded-2xl shadow-xl backdrop-blur-md">
                <button 
                  onClick={() => setActiveTool('pen')}
                  className={`p-2.5 rounded-xl transition cursor-pointer ${activeTool === 'pen' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                  title="Drawing Pen"
                >
                  <Paintbrush className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setActiveTool('rect')}
                  className={`p-2.5 rounded-xl transition cursor-pointer ${activeTool === 'rect' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                  title="Draw Rectangle"
                >
                  <Square className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setActiveTool('circle')}
                  className={`p-2.5 rounded-xl transition cursor-pointer ${activeTool === 'circle' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                  title="Draw Circle"
                >
                  <CircleIcon className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setActiveTool('text')}
                  className={`p-2.5 rounded-xl transition cursor-pointer ${activeTool === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                  title="Place Text"
                >
                  <Type className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setActiveTool('sticky')}
                  className={`p-2.5 rounded-xl transition cursor-pointer ${activeTool === 'sticky' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                  title="Place Sticky Note"
                >
                  <StickyNote className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setActiveTool('eraser')}
                  className={`p-2.5 rounded-xl transition cursor-pointer ${activeTool === 'eraser' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                  title="Delete Object"
                >
                  <Eraser className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-slate-800 mx-1"></div>

                {/* Color Palettes */}
                <div className="flex items-center gap-1">
                  {['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ffffff'].map((color) => (
                    <button 
                      key={color} 
                      onClick={() => setSelectedColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-5 h-5 rounded-full border transition-all ${selectedColor === color ? 'border-indigo-400 scale-120 shadow-xs' : 'border-slate-950 hover:scale-110'}`}
                    />
                  ))}
                </div>

                <div className="w-px h-6 bg-slate-800 mx-1"></div>

                <button 
                  onClick={handleClearAllElements}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                  title="Clear Whiteboard"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Instructions Overlay */}
              <div className="absolute top-4 right-4 z-20 hidden lg:block bg-slate-900/60 text-slate-400 p-2.5 rounded-xl border border-slate-850 text-[10px] font-bold">
                💡 <span className="text-slate-300">Tool: {activeTool.toUpperCase()}</span> | {isHindi ? "ड्रॉ करने के लिए माउस ड्रैग करें" : "Drag mouse to draw. Direct Sync."}
              </div>

              {/* SVG Main Stage */}
              <div className="flex-1 w-full relative min-h-0 bg-slate-950/80 border border-slate-900 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                <svg
                  ref={svgRef}
                  viewBox="0 0 800 500"
                  className="w-full h-full max-w-5xl max-h-[500px] bg-slate-950 border border-slate-850/40 rounded-xl cursor-crosshair relative shadow-2xl overflow-hidden select-none"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                >
                  {/* Grid Lines Pattern for precise look */}
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.025)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="800" height="500" fill="url(#grid)" />

                  {/* Render saved board elements */}
                  {boardElements.map((el) => {
                    if (el.type === 'pen' && el.points && el.points.length > 0) {
                      const dPath = `M ${el.points[0].x} ${el.points[0].y} ` + el.points.slice(1).map((p: any) => `L ${p.x} ${p.y}`).join(' ');
                      return (
                        <path 
                          key={el.id} 
                          d={dPath} 
                          fill="none" 
                          stroke={el.color || '#4f46e5'} 
                          strokeWidth="3" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                        />
                      );
                    }
                    if (el.type === 'rect') {
                      return (
                        <rect 
                          key={el.id}
                          x={el.x}
                          y={el.y}
                          width={el.width}
                          height={el.height}
                          fill="none"
                          stroke={el.color || '#4f46e5'}
                          strokeWidth="3"
                        />
                      );
                    }
                    if (el.type === 'circle') {
                      return (
                        <circle 
                          key={el.id}
                          cx={el.x}
                          cy={el.y}
                          r={el.width} // Utilizing width field for radius
                          fill="none"
                          stroke={el.color || '#4f46e5'}
                          strokeWidth="3"
                        />
                      );
                    }
                    if (el.type === 'text') {
                      return (
                        <text 
                          key={el.id}
                          x={el.x}
                          y={el.y}
                          fill={el.color || '#ffffff'}
                          className="font-sans text-xs font-black fill-current select-none"
                        >
                          {el.text}
                        </text>
                      );
                    }
                    if (el.type === 'sticky') {
                      return (
                        <g key={el.id} transform={`translate(${el.x}, ${el.y})`} className="filter drop-shadow-md select-none">
                          <rect 
                            width="110" 
                            height="110" 
                            rx="10" 
                            fill={el.color || '#eab308'} 
                            fillOpacity="0.85"
                            stroke={el.color}
                            strokeWidth="1"
                          />
                          <foreignObject width="100" height="100" x="5" y="5" className="overflow-hidden">
                            <div className="text-[10px] font-black leading-tight text-slate-950 p-1 select-none select-none select-text break-words">
                              {el.text}
                            </div>
                          </foreignObject>
                          <text x="5" y="102" fill="#0f172a" fillOpacity="0.4" className="text-[8px] font-black select-none font-sans">
                            @{el.creatorName.split(' ')[0]}
                          </text>
                        </g>
                      );
                    }
                    return null;
                  })}

                  {/* Render current temporary drawing Element */}
                  {tempShape && (
                    <>
                      {tempShape.type === 'pen' && tempShape.points && tempShape.points.length > 0 && (
                        <path 
                          d={`M ${tempShape.points[0].x} ${tempShape.points[0].y} ` + tempShape.points.slice(1).map((p: any) => `L ${p.x} ${p.y}`).join(' ')} 
                          fill="none" 
                          stroke={tempShape.color} 
                          strokeWidth="3" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          opacity="0.8"
                        />
                      )}
                      {tempShape.type === 'rect' && (
                        <rect 
                          x={tempShape.x}
                          y={tempShape.y}
                          width={tempShape.width}
                          height={tempShape.height}
                          fill="none"
                          stroke={tempShape.color}
                          strokeWidth="3"
                          strokeDasharray="4"
                          opacity="0.8"
                        />
                      )}
                      {tempShape.type === 'circle' && (
                        <circle 
                          cx={tempShape.x}
                          cy={tempShape.y}
                          r={tempShape.width}
                          fill="none"
                          stroke={tempShape.color}
                          strokeWidth="3"
                          strokeDasharray="4"
                          opacity="0.8"
                        />
                      )}
                    </>
                  )}
                </svg>

                {/* Text Placement overlay */}
                {(textPlacement || stickyPlacement) && (
                  <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center z-30">
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl w-80 shadow-2xl">
                      <h4 className="text-xs font-black text-slate-300 mb-2 uppercase tracking-wide">
                        {textPlacement ? (isHindi ? "बोर्ड पर टेक्स्ट लिखें" : "Add Text Label") : (isHindi ? "स्टिकी नोट लिखें" : "Add Sticky Note")}
                      </h4>
                      <textarea
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder={isHindi ? "यहाँ लिखें..." : "Type content here..."}
                        rows={3}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-semibold outline-none focus:border-indigo-500 mb-3"
                        autoFocus
                      />
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => {
                            setTextPlacement(null);
                            setStickyPlacement(null);
                            setTextInput('');
                          }} 
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-755 text-slate-400 rounded-xl text-xs font-bold"
                        >
                          {isHindi ? "रद्द करें" : "Cancel"}
                        </button>
                        <button 
                          onClick={handlePlaceTextOrSticky}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl text-xs font-black"
                        >
                          {isHindi ? "बोर्ड पर रखें" : "Place on Board"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Area 2: Synced Collaborative Notepad */}
          {activeTab === 'notes' && (
            <div className="flex-1 p-6 flex flex-col min-h-0">
              <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 flex-1 flex flex-col min-h-0 relative">
                <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-200">{isHindi ? "सहयोगात्मक रीयल-टाइम नोट्स" : "Collaborative Notepad"}</h3>
                      <p className="text-[10px] text-slate-500">
                        {sharedNotes.updatedBy 
                          ? `${isHindi ? "पिछला संपादन:" : "Last edited by"} @${sharedNotes.updatedBy.split(' ')[0]} (${new Date(sharedNotes.updatedAt).toLocaleTimeString()})`
                          : (isHindi ? "साझा नोट्स यहाँ संकलित करें" : "All members can write simultaneously.")}
                      </p>
                    </div>
                  </div>

                  {isTyping && (
                    <span className="text-[10px] text-indigo-400 font-bold flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded-md animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      {isHindi ? "सहेज रहा है..." : "Syncing..."}
                    </span>
                  )}
                </div>

                <textarea
                  value={localNoteText}
                  onChange={handleNotesChange}
                  placeholder={isHindi ? "इस सत्र के साझा नोट्स यहाँ लिखना शुरू करें। सभी सहपाठियों को तुरंत अपडेट दिखेगा..." : "Start typing session notes here. All study partners will see your edits immediately in real-time..."}
                  className="flex-1 w-full bg-slate-950 text-slate-200 border border-slate-850 rounded-xl p-4 text-xs font-semibold leading-relaxed outline-none focus:border-indigo-600 resize-none font-mono"
                />
              </div>
            </div>
          )}

          {/* Area 3: Live chat */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Message Streams */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {chatMessages.filter(m => m.text.includes(`[Room Session Chat: ${session.title}]`)).length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                    <MessageSquare className="w-8 h-8 opacity-40 text-slate-500" />
                    <p className="text-xs font-bold">{isHindi ? "सत्र का कोई संदेश नहीं है।" : "No session chat messages yet."}</p>
                    <p className="text-[10px] text-slate-600 max-w-xs text-center">{isHindi ? "इस विशेष स्टडी रूम के लिए ग्रुप के अन्य सदस्यों को संदेश भेजें।" : "Type a message below to coordinate with active students."}</p>
                  </div>
                ) : (
                  chatMessages
                    .filter(m => m.text.includes(`[Room Session Chat: ${session.title}]`))
                    .map((msg) => {
                      const cleanText = msg.text.replace(`[Room Session Chat: ${session.title}] `, '');
                      const isMe = msg.user_id === String(user.id);
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-black text-slate-400">@{msg.user_name}</span>
                            <span className="text-[9px] text-slate-600">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <div className={`max-w-md px-3.5 py-2.5 rounded-2xl text-xs font-semibold ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-850 text-slate-200 rounded-tl-none border border-slate-800'}`}>
                            {cleanText}
                          </div>
                        </div>
                      );
                    })
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendChatMessage} className="p-4 border-t border-slate-850 bg-slate-900/40 flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={isHindi ? "सहपाठियों को संदेश भेजें..." : "Type a coordinate message..."}
                  className="flex-1 bg-slate-950 text-slate-200 border border-slate-850 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-indigo-600"
                />
                <button 
                  type="submit" 
                  className="p-3 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl active:scale-95 transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
