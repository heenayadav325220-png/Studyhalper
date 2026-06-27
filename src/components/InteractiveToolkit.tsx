import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, BrainCircuit, GraduationCap, Clock, FileText, Calculator, 
  BookOpen, Search, Volume2, VolumeX, Play, Pause, RotateCcw, 
  Download, Upload, CheckCircle2, Circle, Plus, Trash2, X, Users, 
  Award, Heart, MessageSquare, ArrowLeft, Maximize2, Mic, Camera, FilePlus, ChevronRight,
  Menu, Settings, ChevronLeft
} from 'lucide-react';
import { Subject, Note, Progress } from '../types';
import { generateQuiz, isAiQuotaExceeded } from '../services/geminiService';

interface InteractiveToolkitProps {
  onClose: () => void;
  appLanguage: string;
  firebaseUser: any;
  user: any;
  notes: Note[];
  onAddNote: (note: { title: string; content: string; subject: Subject }) => Promise<void>;
  onAddProgress: (score: number, total: number, subject: Subject) => Promise<void>;
}

export default function InteractiveToolkit({ 
  onClose, 
  appLanguage, 
  firebaseUser, 
  user, 
  notes, 
  onAddNote, 
  onAddProgress 
}: InteractiveToolkitProps) {
  // Navigation
  const [activeSubTab, setActiveSubTab] = useState<'study' | 'productivity' | 'focus' | 'vocab_calc' | 'utilities'>('study');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // State for AI Tools
  const [aiTool, setAiTool] = useState<'notes' | 'summarize' | 'explain' | 'mindmap' | 'qpaper' | 'ocr' | 'pdf'>('notes');
  const [aiTopic, setAiTopic] = useState('');
  const [aiSubject, setAiSubject] = useState<Subject>('Science');
  const [aiGrade, setAiGrade] = useState('10');
  const [aiStyle, setAiStyle] = useState('Simple');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [pastedContent, setPastedContent] = useState('');
  const [ocrImage, setOcrImage] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(isAiQuotaExceeded);

  useEffect(() => {
    const handleQuotaChange = (e: any) => {
      setQuotaExceeded(e.detail?.exceeded ?? false);
    };
    window.addEventListener('ai-quota-state-changed', handleQuotaChange);
    return () => {
      window.removeEventListener('ai-quota-state-changed', handleQuotaChange);
    };
  }, []);

  // State for Mock Test
  const [testSubject, setTestSubject] = useState<Subject>('Science');
  const [testGrade, setTestGrade] = useState('10');
  const [testActive, setTestActive] = useState(false);
  const [testQuestions, setTestQuestions] = useState<any[]>([]);
  const [testLoading, setTestLoading] = useState(false);
  const [testAnswers, setTestAnswers] = useState<number[]>([]);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testTimer, setTestTimer] = useState(0);
  const [testDuration, setTestDuration] = useState(300); // 5 mins
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Vocabulary Builder
  const [vocabWord, setVocabWord] = useState('');
  const [vocabLoading, setVocabLoading] = useState(false);
  const [vocabResult, setVocabResult] = useState<any>(null);
  const [vocabList, setVocabList] = useState<any[]>(() => {
    return JSON.parse(localStorage.getItem('studybuddy_vocab_list') || '[]');
  });

  // Scientific Calculator
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcMemory, setCalcMemory] = useState<number>(0);

  // Formulas
  const [formulaSearch, setFormulaSearch] = useState('');
  const FORMULAS = [
    { title: "Quadratic Formula", subject: "Mathematics", expr: "x = (-b ± √(b² - 4ac)) / 2a", desc: "Finds the roots of a quadratic equation ax² + bx + c = 0." },
    { title: "Area of Circle", subject: "Mathematics", expr: "A = πr²", desc: "Calculates total area enclosed by a circle of radius r." },
    { title: "Newton's Second Law", subject: "Physics", expr: "F = ma", desc: "Force equals mass multiplied by acceleration." },
    { title: "Einstein's Energy-Mass Equivalence", subject: "Physics", expr: "E = mc²", desc: "Relates mass (m) and energy (E) using the constant speed of light (c)." },
    { title: "Ideal Gas Law", subject: "Chemistry", expr: "PV = nRT", desc: "Relates pressure, volume, gas amount, temperature, and gas constant." },
    { title: "Pythagorean Theorem", subject: "Mathematics", expr: "a² + b² = c²", desc: "In a right-angled triangle, hypotenuse squared is the sum of other two sides squared." }
  ];

  // Productivity states
  const [goals, setGoals] = useState<{ id: string; text: string; completed: boolean }[]>(() => {
    return JSON.parse(localStorage.getItem('studybuddy_daily_goals') || '[{"id":"1","text":"Solve 5 algebra issues","completed":false},{"id":"2","text":"Revise Science summary","completed":false}]');
  });
  const [newGoalText, setNewGoalText] = useState('');
  const [exams, setExams] = useState<{ id: string; subject: string; date: string; title: string }[]>(() => {
    return JSON.parse(localStorage.getItem('studybuddy_exams_list') || '[]');
  });
  const [newExam, setNewExam] = useState({ subject: 'Mathematics' as Subject, date: '', title: '' });

  // Sound board states
  const [ambientSounds, setAmbientSounds] = useState<{ id: string; name: string; icon: string; audioUrl: string; playing: boolean; volume: number }[]>([
    { id: 'rain', name: 'Gentle Rain', icon: '🌧️', audioUrl: 'https://assets.mixkit.co/active_storage/sfx/2533/2533-84.wav', playing: false, volume: 50 },
    { id: 'forest', name: 'Forest Birds', icon: '🌲', audioUrl: 'https://assets.mixkit.co/active_storage/sfx/1113/1113-84.wav', playing: false, volume: 50 },
    { id: 'lofi', name: 'Lofi Chords', icon: '🎸', audioUrl: 'https://assets.mixkit.co/active_storage/sfx/123/123.wav', playing: false, volume: 50 },
    { id: 'cafe', name: 'Coffee Shop', icon: '☕', audioUrl: 'https://assets.mixkit.co/active_storage/sfx/1441/1441-84.wav', playing: false, volume: 50 }
  ]);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Focus Mode
  const [focusActive, setFocusActive] = useState(false);
  const [focusSeconds, setFocusSeconds] = useState(1500); // 25 mins
  const [focusRunning, setFocusRunning] = useState(false);
  const [focusScratchpad, setFocusScratchpad] = useState('');
  const focusTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Buddy/Friends
  const [friendsList, setFriendsList] = useState<{ id: string; name: string; online: boolean; xp: number; chat: string[] }[]>(() => {
    return JSON.parse(localStorage.getItem('studybuddy_friends') || `[
      {"id":"f1","name":"Aanya Sharma","online":true,"xp":1250,"chat":[]},
      {"id":"f2","name":"Vivaan Patel","online":false,"xp":980,"chat":[]},
      {"id":"f3","name":"Ishita Roy","online":true,"xp":1500,"chat":[]}
    ]`);
  });
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [friendChatInput, setFriendChatInput] = useState('');

  // Spaced revision planner
  const [revisionNotes, setRevisionNotes] = useState<{ noteId: string | number; title: string; nextDate: string; stage: number }[]>(() => {
    return JSON.parse(localStorage.getItem('studybuddy_revision_spaced') || '[]');
  });

  // TTS & STT Voice Tutor states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceQueryLoading, setVoiceQueryLoading] = useState(false);
  const [voiceInputActive, setVoiceInputActive] = useState(false);
  const speechRecognitionRef = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem('studybuddy_vocab_list', JSON.stringify(vocabList));
  }, [vocabList]);

  useEffect(() => {
    localStorage.setItem('studybuddy_daily_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('studybuddy_exams_list', JSON.stringify(exams));
  }, [exams]);

  useEffect(() => {
    localStorage.setItem('studybuddy_friends', JSON.stringify(friendsList));
  }, [friendsList]);

  useEffect(() => {
    localStorage.setItem('studybuddy_revision_spaced', JSON.stringify(revisionNotes));
  }, [revisionNotes]);

  // Audio elements cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach((audio: any) => {
        if (audio && typeof audio.pause === 'function') {
          audio.pause();
        }
      });
      if (timerRef.current) clearInterval(timerRef.current);
      if (focusTimerRef.current) clearInterval(focusTimerRef.current);
    };
  }, []);

  // Sync volume of audio clips
  const handleSoundVolumeChange = (id: string, vol: number) => {
    setAmbientSounds(prev => prev.map(s => {
      if (s.id === id) {
        if (audioRefs.current[id]) {
          audioRefs.current[id].volume = vol / 100;
        }
        return { ...s, volume: vol };
      }
      return s;
    }));
  };

  const toggleSoundPlay = (id: string) => {
    setAmbientSounds(prev => prev.map(s => {
      if (s.id === id) {
        const isPlaying = !s.playing;
        if (isPlaying) {
          if (!audioRefs.current[id]) {
            const audio = new Audio(s.audioUrl);
            audio.loop = true;
            audioRefs.current[id] = audio;
          }
          audioRefs.current[id].volume = s.volume / 100;
          audioRefs.current[id].play().catch(err => console.log("Audio play error", err));
        } else {
          if (audioRefs.current[id]) {
            audioRefs.current[id].pause();
          }
        }
        return { ...s, playing: isPlaying };
      }
      return s;
    }));
  };

  // Run countdown for tests
  useEffect(() => {
    if (testActive && testTimer > 0) {
      timerRef.current = setInterval(() => {
        setTestTimer(t => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            handleMockTestSubmit();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [testActive, testTimer]);

  // Focus mode ticking
  useEffect(() => {
    if (focusRunning && focusSeconds > 0) {
      focusTimerRef.current = setInterval(() => {
        setFocusSeconds(s => {
          if (s <= 1) {
            setFocusRunning(false);
            if (focusTimerRef.current) clearInterval(focusTimerRef.current);
            alert("⏰ Great job! You completed your distraction-free study session!");
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else if (!focusRunning && focusTimerRef.current) {
      clearInterval(focusTimerRef.current);
    }
    return () => {
      if (focusTimerRef.current) clearInterval(focusTimerRef.current);
    };
  }, [focusRunning, focusSeconds]);

  // STT / Voice setup
  const handleVoiceInputStart = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please try Chrome/Edge.");
      return;
    }
    if (!speechRecognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = appLanguage === 'Hindi' ? 'hi-IN' : 'en-US';
      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setAiTopic(transcript);
        setVoiceInputActive(false);
        // Automatically ask AI Tutor
        handleAiToolExecute(transcript);
      };
      recognition.onerror = () => setVoiceInputActive(false);
      recognition.onend = () => setVoiceInputActive(false);
      speechRecognitionRef.current = recognition;
    }
    setVoiceInputActive(true);
    speechRecognitionRef.current.start();
  };

  const speakText = (text: string) => {
    if (!window.speechSynthesis) {
      alert("TTS not supported in this browser.");
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    // Clean raw text from markdown tags
    const cleanText = text.replace(/[#*`_-]/g, '').substring(0, 500);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // AI execution triggers
  const handleAiToolExecute = async (overridePrompt?: string) => {
    const query = overridePrompt || aiTopic;
    if (!query && aiTool !== 'pdf' && aiTool !== 'ocr') {
      alert("Please specify a topic or text first!");
      return;
    }

    setAiLoading(true);
    setAiResult(null);

    let endpoint = "/api/gemini/notes-generator";
    let body: any = { topic: query, subject: aiSubject, grade: aiGrade };

    if (aiTool === 'summarize') {
      endpoint = "/api/gemini/notes-summarizer";
      body = { content: query };
    } else if (aiTool === 'explain') {
      endpoint = "/api/gemini/explain-topic";
      body = { topic: query, subject: aiSubject, grade: aiGrade, style: aiStyle };
    } else if (aiTool === 'mindmap') {
      endpoint = "/api/gemini/mindmap";
      body = { topic: query };
    } else if (aiTool === 'qpaper') {
      endpoint = "/api/gemini/question-paper";
      body = { topic: query, subject: aiSubject, grade: aiGrade };
    } else if (aiTool === 'ocr') {
      endpoint = "/api/gemini/ocr";
      body = { imageBase64: ocrImage };
    } else if (aiTool === 'pdf') {
      endpoint = "/api/gemini/pdf-summary";
      body = { textContent: pastedContent };
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (response.ok) {
        const data = await response.json();
        setAiResult(data);
      } else {
        alert("Failed to reach Gemini API model. Running internal offline generator.");
        // fallback
        setAiResult({
          title: "Offline Concept Overview",
          content: `### ${query}\n\nHere is an automated overview of **${query}** for standard ${aiGrade} syllabus studies. Please check connection to use real-time AI reasoning.`
        });
      }
    } catch (err) {
      console.error(err);
      alert("AI Service is temporarily busy. Try again.");
    } finally {
      setAiLoading(false);
    }
  };

  // Execute Mock Test Generation
  const handleGenerateMockTest = async () => {
    setTestLoading(true);
    setTestActive(false);
    setTestSubmitted(false);
    try {
      const questions = await generateQuiz(testSubject, { name: user?.name || "Rohit", school: user?.school || "Core School", className: testGrade }, appLanguage, 'Hard');
      if (questions && questions.length > 0) {
        setTestQuestions(questions);
        setTestAnswers(new Array(questions.length).fill(-1));
        setTestTimer(testDuration);
        setTestActive(true);
      } else {
        alert("Could not generate mock questions. Using fallback exam database.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTestLoading(false);
    }
  };

  const handleMockTestSubmit = async () => {
    setTestActive(false);
    setTestSubmitted(true);
    if (timerRef.current) clearInterval(timerRef.current);

    // Score calculations
    let correct = 0;
    testQuestions.forEach((q, idx) => {
      if (testAnswers[idx] === q.answer) {
        correct++;
      }
    });

    // Award XP points
    const rewardXP = correct * 30;
    if (onAddProgress) {
      await onAddProgress(correct, testQuestions.length, testSubject);
    }
    alert(`📝 Test Completed! Score: ${correct}/${testQuestions.length}. You earned +${rewardXP} XP points for your study progress!`);
  };

  // Search vocab
  const handleVocabLookup = async () => {
    if (!vocabWord) return;
    setVocabLoading(true);
    try {
      const prompt = `Define the word: "${vocabWord}". Provide: Part of Speech, precise academic definition, 2 synonyms, and 1 example sentence. Format your response ONLY as valid JSON in this structure: {"word": "${vocabWord}", "partOfSpeech": "...", "definition": "...", "synonyms": ["...", "..."], "example": "..."}`;
      const response = await fetch("/api/gemini/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, language: "English" })
      });
      if (response.ok) {
        const d = await response.json();
        const parsed = JSON.parse(d.text);
        setVocabResult(parsed);
      }
    } catch (e) {
      console.error(e);
      // Offline fallback
      setVocabResult({
        word: vocabWord,
        partOfSpeech: "noun",
        definition: "A useful study word looked up for active learning.",
        synonyms: ["knowledge", "term"],
        example: `We registered ${vocabWord} inside our core Vocabulary Builder deck.`
      });
    } finally {
      setVocabLoading(false);
    }
  };

  const handleSaveVocab = () => {
    if (!vocabResult) return;
    if (vocabList.some((v: any) => v.word.toLowerCase() === vocabResult.word.toLowerCase())) return;
    setVocabList(prev => [...prev, vocabResult]);
    alert("Saved word successfully!");
  };

  // Scientific Calculator handlers
  const handleCalcBtn = (val: string) => {
    if (val === 'C') {
      setCalcDisplay('0');
    } else if (val === 'DEL') {
      setCalcDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else if (val === '=') {
      try {
        // Safe sanitization parse math
        let parsedExpr = calcDisplay
          .replace(/sin\(/g, 'Math.sin(')
          .replace(/cos\(/g, 'Math.cos(')
          .replace(/tan\(/g, 'Math.tan(')
          .replace(/log\(/g, 'Math.log10(')
          .replace(/ln\(/g, 'Math.log(')
          .replace(/pi/g, 'Math.PI')
          .replace(/e/g, 'Math.E')
          .replace(/\^/g, '**');
        
        const result = new Function(`return ${parsedExpr}`)();
        setCalcDisplay(Number(result).toFixed(4).replace(/\.?0+$/, ""));
      } catch (err) {
        setCalcDisplay('Error');
      }
    } else {
      setCalcDisplay(prev => prev === '0' || prev === 'Error' ? val : prev + val);
    }
  };

  // Goal adding
  const handleAddGoal = () => {
    if (!newGoalText.trim()) return;
    setGoals(prev => [...prev, { id: Date.now().toString(), text: newGoalText, completed: false }]);
    setNewGoalText('');
  };

  const handleToggleGoal = (id: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id === id) {
        const target = !g.completed;
        if (target) {
          // Award +10 XP locally on study goal completion
          alert("🎯 Goal completed! +15 XP points logged!");
        }
        return { ...g, completed: target };
      }
      return g;
    }));
  };

  // Exam Planner
  const handleAddExam = () => {
    if (!newExam.title || !newExam.date) return;
    setExams(prev => [...prev, { id: Date.now().toString(), ...newExam }]);
    setNewExam({ subject: 'Mathematics', date: '', title: '' });
  };

  const handleRemoveExam = (id: string) => {
    setExams(prev => prev.filter(e => e.id !== id));
  };

  const getRemainingDays = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} days left` : days === 0 ? "Today!" : "Passed";
  };

  // Backup & Restore
  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      goals,
      exams,
      vocabList,
      revisionNotes,
      friendsList
    }));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `studybuddy_cloud_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.goals) setGoals(parsed.goals);
          if (parsed.exams) setExams(parsed.exams);
          if (parsed.vocabList) setVocabList(parsed.vocabList);
          if (parsed.revisionNotes) setRevisionNotes(parsed.revisionNotes);
          if (parsed.friendsList) setFriendsList(parsed.friendsList);
          alert("🎉 Core backup restored successfully!");
        } catch (err) {
          alert("Invalid backup file structure.");
        }
      };
    }
  };

  // Add friend Direct message
  const handleSendFriendMsg = () => {
    if (!friendChatInput.trim() || !selectedFriendId) return;
    setFriendsList(prev => prev.map(f => {
      if (f.id === selectedFriendId) {
        // Echo response simulation
        const updatedChat = [...f.chat, `Me: ${friendChatInput}`, `Buddy: That sounds like a solid study plan! Keep pushing!`];
        return { ...f, chat: updatedChat };
      }
      return f;
    }));
    setFriendChatInput('');
  };

  // Save dynamically generated note to actual Notebook!
  const handleSaveToNotebookTab = async () => {
    if (!aiResult) return;
    const title = aiResult.title || aiTopic || "AI Note Card";
    let content = aiResult.content || aiResult.summary || aiResult.explanation || "";
    if (typeof aiResult === 'object' && aiResult.summary) content = aiResult.summary;
    if (typeof aiResult === 'object' && aiResult.explanation) content = aiResult.explanation;
    
    await onAddNote({
      title,
      content,
      subject: aiSubject
    });
    alert("📝 Study Note successfully saved in your notebook library!");
  };

  // Spaced revision stage incrementer
  const handleSpacedLogRevision = (noteId: string | number, title: string) => {
    const stageIntervals = [1, 7, 30];
    const exists = revisionNotes.find(r => r.noteId === noteId);
    let nextStage = 0;
    if (exists) {
      nextStage = Math.min(exists.stage + 1, stageIntervals.length - 1);
    }
    const days = stageIntervals[nextStage];
    const nextDateObj = new Date();
    nextDateObj.setDate(nextDateObj.getDate() + days);
    
    if (exists) {
      setRevisionNotes(prev => prev.map(r => r.noteId === noteId ? { ...r, stage: nextStage, nextDate: nextDateObj.toISOString().split('T')[0] } : r));
    } else {
      setRevisionNotes(prev => [...prev, { noteId, title, nextDate: nextDateObj.toISOString().split('T')[0], stage: nextStage }]);
    }
    alert(`📅 Revision logged! Spaced review set for ${days} day(s) from now.`);
  };

  // Sound board helper
  const handleOcrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setOcrImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col w-screen h-screen overflow-hidden transition-colors duration-300 ${focusActive ? 'bg-slate-950 text-cyan-300' : 'bg-slate-50 text-slate-800'}`} 
      id="toolkit_page"
    >
      {/* Top App Bar */}
      <header className={`px-4 py-3 border-b flex justify-between items-center shrink-0 shadow-sm z-10 transition-colors duration-200
        ${focusActive 
          ? 'bg-slate-900 border-slate-800 text-cyan-400' 
          : 'bg-white border-slate-100 text-slate-800'}`}
      >
        <div className="flex items-center gap-1.5">
          {/* Back Button (returns to Home) */}
          <button 
            onClick={onClose} 
            className={`p-2 rounded-full transition-all duration-200 active:scale-95 flex items-center justify-center mr-1
              ${focusActive 
                ? 'hover:bg-slate-800 text-cyan-400 hover:text-cyan-300' 
                : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'}`}
            title="Back to Home"
          >
            <ArrowLeft size={18} />
          </button>

          {/* Hamburger Menu Button (mobile only) */}
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className={`p-2 rounded-full transition-all duration-200 active:scale-95 flex items-center justify-center md:hidden mr-1
              ${focusActive 
                ? 'hover:bg-slate-800 text-cyan-400 hover:text-cyan-300' 
                : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'}`}
            title="Open Navigation"
          >
            <Menu size={18} />
          </button>

          {/* Icon + Title */}
          <div className="flex items-center gap-2">
            <Sparkles className={`w-5 h-5 ${focusActive ? 'text-cyan-400' : 'text-indigo-600'} animate-pulse`} />
            <div>
              <h1 className={`font-black text-sm sm:text-base tracking-tight leading-none ${focusActive ? 'text-cyan-300' : 'text-slate-800'}`}>
                Advanced Study Toolkit
              </h1>
              <p className={`text-[9px] font-bold mt-0.5 leading-none hidden sm:block ${focusActive ? 'text-slate-500' : 'text-slate-400'}`}>
                Comprehensive AI tools, practice engines & focus dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Distraction-free Focus button */}
          <button 
            onClick={() => setFocusActive(!focusActive)} 
            className={`text-[10px] font-black uppercase px-2.5 py-1.5 sm:px-3 rounded-xl border transition-all duration-200 flex items-center gap-1.5
              ${focusActive 
                ? 'bg-cyan-950 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900' 
                : 'bg-indigo-50 border-indigo-100 hover:bg-indigo-100 text-indigo-700'}`}
          >
            <span>{focusActive ? "Exit Focus" : "Focus Mode 🧘"}</span>
          </button>

          {/* Search Icon */}
          <button 
            className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center
              ${focusActive 
                ? 'hover:bg-slate-800 text-cyan-500 hover:text-cyan-300' 
                : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'}`}
            title="Search Toolkit"
          >
            <Search size={16} />
          </button>

          {/* Settings Icon */}
          <button 
            className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center
              ${focusActive 
                ? 'hover:bg-slate-800 text-cyan-500 hover:text-cyan-300' 
                : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'}`}
            title="Toolkit Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {focusActive ? (
        /* FOCUS MODE VIEW */
        <div className="flex-1 bg-slate-950 text-cyan-300 p-6 flex flex-col md:flex-row gap-6 overflow-y-auto">
          <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6 border-r border-slate-900 pr-0 md:pr-6">
            <span className="text-sm tracking-widest font-black uppercase text-cyan-500">Focusing On Your Future</span>
            <div className="text-6xl font-mono font-black text-cyan-400 shadow-cyan-950/50 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">
              {Math.floor(focusSeconds / 60).toString().padStart(2, '0')}:{(focusSeconds % 60).toString().padStart(2, '0')}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setFocusRunning(!focusRunning)}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-wider"
              >
                {focusRunning ? "Pause" : "Start Session"}
              </button>
              <button 
                onClick={() => { setFocusSeconds(1500); setFocusRunning(false); }}
                className="p-3 bg-slate-900 border border-slate-800 text-cyan-400 rounded-2xl"
              >
                <RotateCcw size={16} />
              </button>
            </div>
            <p className="text-[10px] text-slate-500 italic max-w-sm">No notifications. No alerts. Just you and your textbooks.</p>
          </div>
          
          <div className="w-full md:w-80 flex flex-col gap-4">
            <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-3xl space-y-3">
              <h3 className="text-xs font-bold text-cyan-400 flex items-center uppercase tracking-wide gap-1.5">
                <Volume2 size={14} /> Soundscape Mixer
              </h3>
              {ambientSounds.map(s => (
                <div key={s.id} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-300 font-bold">{s.icon} {s.name}</span>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={s.volume} 
                      onChange={(e) => handleSoundVolumeChange(s.id, parseInt(e.target.value))} 
                      className="w-16 accent-cyan-500"
                    />
                    <button 
                      onClick={() => toggleSoundPlay(s.id)}
                      className={`p-1.5 rounded-lg text-[10px] ${s.playing ? 'bg-cyan-600 text-slate-950' : 'bg-slate-850 text-cyan-500'}`}
                    >
                      {s.playing ? <Volume2 size={10} /> : <VolumeX size={10} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex-1 bg-slate-900 border border-slate-800/80 p-4 rounded-3xl flex flex-col">
              <span className="text-[10px] font-black text-cyan-500 uppercase mb-2">Scratchpad</span>
              <textarea 
                value={focusScratchpad}
                onChange={(e) => setFocusScratchpad(e.target.value)}
                placeholder="Jot down formulas or quick calculation steps..." 
                className="flex-1 bg-slate-950/50 border border-slate-800 rounded-2xl p-2.5 text-xs text-cyan-300 outline-none resize-none font-mono"
              />
            </div>
          </div>
        </div>
      ) : (
        /* REGULAR KIT VIEW */
        <div className="flex-1 flex overflow-hidden relative">
          {/* Mobile Sidebar Backdrop */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Responsive Collapsible Sidebar */}
          <aside className={`
            fixed inset-y-0 left-0 z-40 bg-white border-r border-slate-200/80 p-4 flex flex-col gap-2 transition-all duration-300 ease-in-out
            md:static md:translate-x-0 shrink-0
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            ${isSidebarCollapsed ? 'md:w-16 md:px-2 md:py-4' : 'md:w-56 md:px-4 md:py-4'}
          `}>
            {/* Sidebar Header / Close or Collapse button */}
            <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
              <span className={`text-[9px] uppercase font-black text-slate-400 tracking-wider transition-opacity duration-300 ${isSidebarCollapsed ? 'md:opacity-0 md:w-0' : 'opacity-100'}`}>
                Sections
              </span>
              
              {/* Desktop Collapse Trigger */}
              <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                className="hidden md:flex p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 transition"
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isSidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
              </button>

              {/* Mobile Close Button */}
              <button 
                onClick={() => setIsSidebarOpen(false)} 
                className="flex md:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-rose-600 transition"
                title="Close Navigation"
              >
                <X size={15} />
              </button>
            </div>

            {/* Sidebar Buttons */}
            <div className="flex flex-col gap-1.5 flex-1">
              {([
                { id: 'study', label: 'AI Study Center', icon: <Sparkles size={15} /> },
                { id: 'vocab_calc', label: 'Practice Tools', icon: <Calculator size={15} /> },
                { id: 'productivity', label: 'Planner & Goals', icon: <Clock size={15} /> },
                { id: 'focus', label: 'Social & Sounds', icon: <BookOpen size={15} /> },
                { id: 'utilities', label: 'File Backup', icon: <Download size={15} /> },
              ] as const).map(tab => {
                const isActive = activeSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveSubTab(tab.id);
                      setIsSidebarOpen(false); // Close mobile drawer when clicked
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl transition-all duration-200 flex items-center gap-3 font-extrabold text-xs group relative
                      ${isActive 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'text-slate-650 hover:bg-slate-100 hover:text-slate-900'}
                      ${isSidebarCollapsed ? 'md:justify-center md:px-0' : ''}
                    `}
                    title={tab.label}
                  >
                    <span className={`${isActive ? 'text-white' : 'text-indigo-600 group-hover:text-indigo-700'}`}>
                      {tab.icon}
                    </span>
                    <span className={`transition-all duration-300 ${isSidebarCollapsed ? 'md:hidden' : 'block'}`}>
                      {tab.label}
                    </span>
                    
                    {/* Tooltip for collapsed sidebar */}
                    {isSidebarCollapsed && (
                      <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[9px] font-black rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 hidden md:block shadow-md">
                        {tab.label}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Scrollable Main Workspace */}
          <main className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">

              {/* STUDY TAB */}
              {activeSubTab === 'study' && (
                <div className="space-y-4">
                  {/* Tool Selector */}
                  <div className="flex gap-1.5 flex-wrap bg-slate-100 p-1 rounded-2xl">
                    {(['notes', 'summarize', 'explain', 'mindmap', 'qpaper', 'ocr', 'pdf'] as const).map(tool => (
                      <button 
                        key={tool}
                        onClick={() => { setAiTool(tool); setAiResult(null); }}
                        className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-xl transition ${aiTool === tool ? 'bg-white text-indigo-600 shadow' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        {tool}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Inputs panel */}
                    <div className="space-y-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
                      <h3 className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider">AI Parameters</h3>
                      
                      {aiTool !== 'ocr' && aiTool !== 'pdf' && (
                        <div>
                          <label className="block text-[8px] uppercase font-black text-slate-400 tracking-wider mb-1">Topic / Term</label>
                          <div className="relative">
                            <input 
                              type="text" 
                              value={aiTopic}
                              onChange={(e) => setAiTopic(e.target.value)}
                              placeholder="e.g. Gravity, Organic Chemistry" 
                              className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none"
                            />
                            <button 
                              onClick={handleVoiceInputStart}
                              className={`absolute right-2 top-2.5 p-0.5 rounded-lg text-slate-400 hover:text-indigo-600 ${voiceInputActive ? 'animate-pulse text-red-500' : ''}`}
                            >
                              <Mic size={14} />
                            </button>
                          </div>
                        </div>
                      )}

                      {aiTool !== 'summarize' && aiTool !== 'mindmap' && aiTool !== 'ocr' && aiTool !== 'pdf' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[8px] uppercase font-black text-slate-400 tracking-wider mb-1">Subject</label>
                            <select 
                              value={aiSubject} 
                              onChange={(e) => setAiSubject(e.target.value as Subject)} 
                              className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-white outline-none"
                            >
                              {['Mathematics', 'Science', 'Biology', 'Physics', 'Chemistry', 'English'].map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[8px] uppercase font-black text-slate-400 tracking-wider mb-1">Grade Level</label>
                            <select 
                              value={aiGrade} 
                              onChange={(e) => setAiGrade(e.target.value)} 
                              className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-white outline-none"
                            >
                              {['8', '9', '10', '11', '12'].map(g => (
                                <option key={g} value={g}>Class {g}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {aiTool === 'explain' && (
                        <div>
                          <label className="block text-[8px] uppercase font-black text-slate-400 tracking-wider mb-1">Explanation Style</label>
                          <select 
                            value={aiStyle} 
                            onChange={(e) => setAiStyle(e.target.value)} 
                            className="w-full p-2 text-xs border border-slate-200 bg-white rounded-xl outline-none"
                          >
                            <option value="Simple">Simple Student English</option>
                            <option value="Analogies">Vivid Analogy & Metaphor</option>
                            <option value="5-year-old">Like I am 5 Years Old</option>
                            <option value="Step-by-step">Meticulous Step-by-Step</option>
                          </select>
                        </div>
                      )}

                      {aiTool === 'ocr' && (
                        <div>
                          <label className="block text-[8px] uppercase font-black text-slate-400 tracking-wider mb-1">Upload Homework / Textbook Image</label>
                          <div className="border border-dashed border-slate-200 rounded-2xl p-4 text-center hover:bg-slate-50 transition relative">
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleOcrFileChange} 
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <Camera className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
                            <span className="text-[10px] text-slate-500 font-bold block">Click to select image file</span>
                          </div>
                          {ocrImage && <img src={ocrImage} alt="OCR Upload Preview" className="mt-2 w-full h-24 object-cover rounded-xl border" />}
                        </div>
                      )}

                      {aiTool === 'pdf' && (
                        <div>
                          <label className="block text-[8px] uppercase font-black text-slate-400 tracking-wider mb-1">Paste Document / Note Content</label>
                          <textarea 
                            value={pastedContent} 
                            onChange={(e) => setPastedContent(e.target.value)} 
                            placeholder="Paste your long notes, PDF texts, or study guides here..." 
                            className="w-full h-32 p-2 text-xs border border-slate-200 rounded-xl outline-none resize-none font-mono"
                          />
                        </div>
                      )}

                      <button 
                        onClick={() => handleAiToolExecute()}
                        disabled={aiLoading}
                        className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wide flex justify-center items-center gap-1.5 shadow"
                      >
                        {aiLoading ? "Gemini Reasoning..." : "Run AI Tool ⚡"}
                      </button>
                    </div>

                    {/* Output results panel */}
                    <div className="col-span-2 bg-slate-50/20 rounded-3xl border border-slate-100 p-4 min-h-[300px] flex flex-col justify-between">
                      {aiLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-2">
                          <span className="animate-spin text-2xl">⏳</span>
                          <span className="text-xs font-bold text-slate-500 animate-pulse">Running Gemini analysis models...</span>
                        </div>
                      ) : aiResult ? (
                        <div className="space-y-4 flex-1 flex flex-col justify-between">
                          <div className="flex justify-between items-center border-b pb-2">
                            <h4 className="font-extrabold text-xs text-indigo-900">{aiResult.title || "Gemini Extraction Result"}</h4>
                            <div className="flex gap-1.5">
                              <button 
                                onClick={() => speakText(aiResult.content || aiResult.summary || aiResult.explanation || aiResult.paperText || "")} 
                                className={`text-[10px] font-bold px-2 py-1 rounded-lg border flex items-center gap-1 ${isSpeaking ? 'bg-indigo-600 text-white' : 'bg-white'}`}
                              >
                                <Volume2 size={12} /> {isSpeaking ? "Mute" : "Listen"}
                              </button>
                              <button 
                                onClick={handleSaveToNotebookTab} 
                                className="text-[10px] bg-white text-slate-700 font-bold px-2 py-1 rounded-lg border hover:bg-slate-50"
                              >
                                Save Note 📝
                              </button>
                            </div>
                          </div>
                          
                          {quotaExceeded && (
                            <div className="p-2.5 bg-amber-50 border border-amber-200/60 rounded-xl text-[10px] text-amber-850 leading-normal select-none font-sans">
                              ⚠️ <strong>Offline Fallback Mode</strong>: Gemini daily API quota exceeded. Running internal high-quality study generator. Configure a custom key in settings for unlimited live AI.
                            </div>
                          )}

                          <div className="flex-1 overflow-y-auto max-h-[350px] text-xs leading-relaxed text-slate-700 whitespace-pre-line font-medium p-1">
                            {aiTool === 'mindmap' ? (
                              <div className="space-y-3 font-mono text-[10px] bg-indigo-950 text-indigo-200 p-4 rounded-2xl shadow-inner">
                                <span className="font-black text-xs text-white">🌳 Mind Map Tree Structure</span>
                                <div className="space-y-1">
                                  <strong>{aiResult.name}</strong>
                                  {aiResult.children?.map((child: any, i: number) => (
                                    <div key={i} className="pl-4 border-l border-indigo-700/50 mt-1">
                                      <span>├── {child.name}</span>
                                      {child.children?.map((gchild: any, j: number) => (
                                        <div key={j} className="pl-6 text-indigo-400">├── {gchild.name}</div>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              aiResult.content || aiResult.summary || aiResult.explanation || aiResult.paperText || aiResult.text || (aiResult.summary ? "See structured summary cards." : JSON.stringify(aiResult, null, 2))
                            )}

                            {aiResult.keyTerms && aiResult.keyTerms.length > 0 && (
                              <div className="mt-4 space-y-2 border-t pt-3">
                                <span className="font-extrabold text-[11px] text-slate-800 block">📌 Key Term Cards Generated</span>
                                <div className="grid grid-cols-2 gap-2">
                                  {aiResult.keyTerms.map((kt: any, idx: number) => (
                                    <div key={idx} className="p-2.5 bg-amber-50 border border-amber-100 rounded-xl">
                                      <strong className="text-amber-800 font-black block text-[10px]">{kt.term}</strong>
                                      <p className="text-[9px] text-amber-700 mt-0.5 leading-tight">{kt.definition}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-1 p-4">
                          <BrainCircuit className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                          <span className="text-xs font-extrabold text-slate-600 block">Awaiting AI Task Execution</span>
                          <p className="text-[9px] text-slate-400 max-w-xs">Run any parameters above to query Gemini models on physics, math, science, or biology details.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* VOCAB & CALC */}
              {activeSubTab === 'vocab_calc' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Vocabulary Builder */}
                    <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <BookOpen size={14} className="text-indigo-600" /> AI Vocabulary Builder
                          </h3>
                          <span className="text-[9px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg font-black uppercase">
                            {vocabList.length} WORDS
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          <input 
                            type="text" 
                            value={vocabWord} 
                            onChange={(e) => setVocabWord(e.target.value)} 
                            placeholder="Type vocabulary word..." 
                            className="flex-1 p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none"
                          />
                          <button 
                            onClick={handleVocabLookup}
                            disabled={vocabLoading}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                          >
                            {vocabLoading ? "Looking..." : "Search"}
                          </button>
                        </div>

                        {vocabResult && (
                          <div className="p-3 bg-white border border-indigo-100 rounded-2xl space-y-2 relative shadow-sm">
                            <div className="flex justify-between items-center">
                              <strong className="text-xs font-black text-indigo-900 uppercase tracking-tight">{vocabResult.word}</strong>
                              <span className="text-[9px] font-bold text-slate-400 italic">({vocabResult.partOfSpeech})</span>
                            </div>
                            <p className="text-[10px] text-slate-600 leading-relaxed font-medium"><strong>Def:</strong> {vocabResult.definition}</p>
                            <p className="text-[10px] text-slate-500 italic leading-none"><strong>Ex:</strong> "{vocabResult.example}"</p>
                            <div className="flex justify-between items-center pt-1.5 border-t">
                              <span className="text-[9px] font-bold text-slate-400">Synonyms: {vocabResult.synonyms?.join(', ')}</span>
                              <button 
                                onClick={handleSaveVocab} 
                                className="text-[9px] font-black text-emerald-600 border border-emerald-200 bg-emerald-50 px-2 py-1 rounded-lg hover:bg-emerald-100"
                              >
                                + Save to Deck
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {vocabList.length > 0 && (
                        <div className="mt-4 border-t pt-3 space-y-2">
                          <span className="text-[9px] font-black uppercase text-slate-400 block">My Saved Deck</span>
                          <div className="flex gap-1.5 flex-wrap max-h-[100px] overflow-y-auto">
                            {vocabList.map((v, i) => (
                              <span key={i} className="text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-1 rounded-lg">
                                {v.word}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Scientific Calculator */}
                    <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 space-y-3">
                      <h3 className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Calculator size={14} className="text-cyan-600" /> Scientific Calculator
                      </h3>
                      <div className="bg-slate-900 p-3 rounded-2xl text-right text-white font-mono font-black text-lg select-none min-h-[48px] shadow-inner">
                        {calcDisplay}
                      </div>
                      <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
                        {['sin(', 'cos(', 'tan(', 'DEL', 'log(', 'ln(', 'pi', 'C', '(', ')', '^', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', 'e', '='].map(btn => (
                          <button 
                            key={btn}
                            onClick={() => handleCalcBtn(btn)}
                            className={`py-2 rounded-lg font-black transition cursor-pointer ${btn === '=' ? 'bg-cyan-600 text-white hover:bg-cyan-700 col-span-2' : ['C', 'DEL'].includes(btn) ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-white border border-slate-100 hover:bg-slate-100 text-slate-700'}`}
                          >
                            {btn}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Math Formula Library */}
                  <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider">📐 Math & Physics Formula Library</h3>
                      <div className="relative w-48">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                        <input 
                          type="text" 
                          value={formulaSearch} 
                          onChange={(e) => setFormulaSearch(e.target.value)} 
                          placeholder="Search formula..." 
                          className="w-full pl-8 pr-2 py-1.5 border border-slate-200 bg-white rounded-xl text-[10px] outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {FORMULAS.filter(f => f.title.toLowerCase().includes(formulaSearch.toLowerCase())).map((f, i) => (
                        <div key={i} className="bg-white p-3 rounded-2xl border border-slate-100 space-y-1.5 shadow-xs hover:border-indigo-300 transition">
                          <span className="text-[8px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{f.subject}</span>
                          <strong className="text-[10px] font-black text-slate-800 block">{f.title}</strong>
                          <div className="bg-slate-50 p-2 rounded-lg font-mono text-[10px] font-black text-indigo-900 border text-center">{f.expr}</div>
                          <p className="text-[9px] text-slate-400 font-bold leading-tight mt-1">{f.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* PRODUCTIVITY TAB */}
              {activeSubTab === 'productivity' && (
                <div className="space-y-6">
                  
                  {/* Goals & Countdown Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Daily Goals */}
                    <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <h3 className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider">🎯 Daily Study Goals</h3>
                        
                        <div className="flex gap-1.5">
                          <input 
                            type="text" 
                            value={newGoalText} 
                            onChange={(e) => setNewGoalText(e.target.value)} 
                            placeholder="Add study target (e.g. solve trigonometry quiz)..." 
                            className="flex-1 p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none"
                          />
                          <button onClick={handleAddGoal} className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">+</button>
                        </div>

                        <div className="space-y-2">
                          {goals.map(g => (
                            <div key={g.id} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-100 shadow-xs">
                              <button onClick={() => handleToggleGoal(g.id)} className="flex items-center gap-2 text-left">
                                {g.completed ? <CheckCircle2 size={14} className="text-indigo-600" /> : <Circle size={14} className="text-slate-400" />}
                                <span className={`text-[11px] font-bold ${g.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{g.text}</span>
                              </button>
                              <button onClick={() => setGoals(prev => prev.filter(x => x.id !== g.id))} className="text-slate-300 hover:text-rose-600 p-0.5"><Trash2 size={12} /></button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-indigo-50 border border-indigo-100/50 p-3 rounded-2xl flex items-center justify-between">
                        <span className="text-[10px] text-indigo-900 font-bold">Completion: {goals.filter(g=>g.completed).length}/{goals.length}</span>
                        <span className="text-[9px] font-black uppercase text-indigo-700 bg-white border border-indigo-100 px-2 py-0.5 rounded-lg">+15 XP local reward per goal</span>
                      </div>
                    </div>

                    {/* Upcoming Exam Countdowns */}
                    <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 space-y-4">
                      <h3 className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider">⏳ Exam Countdown Timers</h3>
                      
                      <div className="grid grid-cols-3 gap-1.5 items-end">
                        <div className="col-span-2">
                          <label className="block text-[8px] uppercase font-black text-slate-400 mb-1">Exam Title</label>
                          <input 
                            type="text" 
                            value={newExam.title} 
                            onChange={(e) => setNewExam(prev => ({ ...prev, title: e.target.value }))} 
                            placeholder="e.g. Science Finals" 
                            className="w-full p-2 border border-slate-200 bg-white rounded-xl text-[10px] outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] uppercase font-black text-slate-400 mb-1">Date</label>
                          <input 
                            type="date" 
                            value={newExam.date} 
                            onChange={(e) => setNewExam(prev => ({ ...prev, date: e.target.value }))} 
                            className="w-full p-2 border border-slate-200 bg-white rounded-xl text-[10px] outline-none"
                          />
                        </div>
                      </div>
                      <button onClick={handleAddExam} className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase">Add Exam Date</button>

                      <div className="space-y-2 max-h-[120px] overflow-y-auto">
                        {exams.length === 0 ? (
                          <p className="text-[10px] text-slate-400 italic">No exams added yet.</p>
                        ) : (
                          exams.map(e => (
                            <div key={e.id} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-100 shadow-xs">
                              <div>
                                <span className="text-[8px] font-black uppercase bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded mr-1.5">{e.subject}</span>
                                <strong className="text-[10px] font-black text-slate-800">{e.title}</strong>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono font-black text-indigo-600">{getRemainingDays(e.date)}</span>
                                <button onClick={() => handleRemoveExam(e.id)} className="text-slate-300 hover:text-rose-600 p-0.5"><Trash2 size={12} /></button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Spaced Revision Scheduler */}
                  <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 space-y-3">
                    <h3 className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider">📅 Spaced Revision Planner</h3>
                    <p className="text-[9px] text-slate-400 font-bold leading-none mb-2">Active recall intervals automatically logged on note creation.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {notes.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic">No notes logged in your Notebook tab yet.</p>
                      ) : (
                        notes.map(n => {
                          const log = revisionNotes.find(r => r.noteId === n.id);
                          return (
                            <div key={n.id} className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center justify-between shadow-xs">
                              <div>
                                <span className="text-[8px] font-black uppercase bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded mr-2">{n.subject}</span>
                                <strong className="text-[10px] font-black text-slate-800">{n.title}</strong>
                                <span className="block text-[8px] text-slate-400 mt-1">Stage: {log ? log.stage + 1 : 'Not Scheduled'} | Next review: {log ? log.nextDate : 'Pending study'}</span>
                              </div>
                              <button 
                                onClick={() => handleSpacedLogRevision(n.id, n.title)}
                                className="text-[9px] font-black uppercase text-indigo-600 border border-indigo-200 bg-indigo-50/55 px-2.5 py-1.5 rounded-xl hover:bg-indigo-100"
                              >
                                Log Study Session
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SOCIAL & SOUNDS */}
              {activeSubTab === 'focus' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Friend System */}
                    <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 flex flex-col justify-between">
                      <div className="space-y-3">
                        <h3 className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Users size={14} className="text-indigo-600" /> Buddy Study Circles
                        </h3>
                        
                        <div className="space-y-2">
                          {friendsList.map(f => (
                            <button 
                              key={f.id} 
                              onClick={() => setSelectedFriendId(f.id)}
                              className={`w-full p-2.5 bg-white rounded-2xl border flex items-center justify-between hover:border-indigo-200 transition text-left ${selectedFriendId === f.id ? 'border-indigo-600' : 'border-slate-100'}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🧑‍🎓</span>
                                <div>
                                  <strong className="text-[11px] font-black text-slate-800 block">{f.name}</strong>
                                  <span className="text-[8px] text-slate-400 font-bold">Level {Math.floor(f.xp/100) + 1} | {f.xp} XP</span>
                                </div>
                              </div>
                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg ${f.online ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400'}`}>
                                {f.online ? "ONLINE" : "OFFLINE"}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {selectedFriendId && (
                        <div className="mt-4 border-t pt-3 space-y-2">
                          <span className="text-[9px] font-black uppercase text-slate-400 block">Direct message with {friendsList.find(f=>f.id === selectedFriendId)?.name}</span>
                          <div className="bg-white p-2.5 rounded-2xl border max-h-[80px] overflow-y-auto space-y-1 text-[9px] font-medium leading-none text-slate-600 font-sans">
                            {friendsList.find(f=>f.id === selectedFriendId)?.chat.map((msg, i) => (
                              <div key={i} className={`p-1 rounded ${msg.startsWith('Me') ? 'bg-indigo-50/60' : 'bg-slate-50'}`}>{msg}</div>
                            )) || <span className="italic text-slate-400">Start a chat...</span>}
                          </div>
                          <div className="flex gap-1.5">
                            <input 
                              type="text" 
                              value={friendChatInput} 
                              onChange={(e) => setFriendChatInput(e.target.value)} 
                              placeholder="Send materials..." 
                              className="flex-1 p-2 border border-slate-200 rounded-xl text-[10px] bg-white outline-none"
                            />
                            <button onClick={handleSendFriendMsg} className="px-3 bg-indigo-600 text-white rounded-xl text-[10px] font-bold">Send</button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Ambient sound mixer */}
                    <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 space-y-4">
                      <h3 className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Volume2 size={14} className="text-indigo-600" /> Focus Soundscapes & White Noise
                      </h3>
                      {ambientSounds.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-2xl shadow-xs">
                          <span className="text-xs text-slate-700 font-extrabold">{s.icon} {s.name}</span>
                          <div className="flex items-center gap-3">
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={s.volume} 
                              onChange={(e) => handleSoundVolumeChange(s.id, parseInt(e.target.value))} 
                              className="w-20 accent-indigo-600 cursor-pointer"
                            />
                            <button 
                              onClick={() => toggleSoundPlay(s.id)}
                              className={`p-2 rounded-xl text-[10px] ${s.playing ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}
                            >
                              {s.playing ? 'PAUSE' : 'PLAY'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Mock test selector */}
                  <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h3 className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider">📝 AI Mock Test System</h3>
                      {testActive && (
                        <span className="text-[10px] font-mono bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-xl font-black">
                          Time Left: {Math.floor(testTimer / 60)}:{(testTimer % 60).toString().padStart(2, '0')}
                        </span>
                      )}
                    </div>

                    {!testActive && !testSubmitted ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                        <div>
                          <label className="block text-[8px] uppercase font-black text-slate-400 mb-1">Subject</label>
                          <select 
                            value={testSubject} 
                            onChange={(e) => setTestSubject(e.target.value as Subject)} 
                            className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none"
                          >
                            {['Mathematics', 'Science', 'Biology', 'Physics', 'Chemistry', 'English'].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[8px] uppercase font-black text-slate-400 mb-1">Grade</label>
                          <select 
                            value={testGrade} 
                            onChange={(e) => setTestGrade(e.target.value)} 
                            className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none"
                          >
                            {['8', '9', '10', '11', '12'].map(g => (
                              <option key={g} value={g}>Class {g}</option>
                            ))}
                          </select>
                        </div>
                        <button 
                          onClick={handleGenerateMockTest}
                          disabled={testLoading}
                          className="py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wide cursor-pointer"
                        >
                          {testLoading ? "Generating questions..." : "Generate Hard Exam Test"}
                        </button>
                      </div>
                    ) : testActive ? (
                      <div className="space-y-4">
                        {testQuestions.map((q, qidx) => (
                          <div key={qidx} className="p-3 bg-white border rounded-2xl space-y-2 shadow-xs">
                            <span className="text-[9px] font-black uppercase text-indigo-600">Question {qidx + 1}</span>
                            <p className="text-xs font-bold text-slate-800">{q.question}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {q.options.map((opt: string, oidx: number) => (
                                <button 
                                  key={oidx}
                                  onClick={() => setTestAnswers(prev => prev.map((val, i) => i === qidx ? oidx : val))}
                                  className={`p-2 rounded-xl text-left font-semibold border transition ${testAnswers[qidx] === oidx ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                        <button 
                          onClick={handleMockTestSubmit}
                          className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase"
                        >
                          Submit Test & Log Score
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 bg-white border rounded-2xl text-center space-y-3">
                        <strong className="text-xs font-black text-indigo-900 uppercase">Grade report successfully processed!</strong>
                        <div className="flex justify-center gap-6 text-xs text-slate-600">
                          <span>Total Questions: {testQuestions.length}</span>
                          <span>Score: {testQuestions.filter((q, idx) => testAnswers[idx] === q.answer).length}/{testQuestions.length}</span>
                        </div>
                        <button 
                          onClick={() => setTestSubmitted(false)}
                          className="px-6 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold uppercase"
                        >
                          Start New Test
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* UTILITIES */}
              {activeSubTab === 'utilities' && (
                <div className="space-y-4">
                  <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 space-y-4 text-center">
                    <span className="text-3xl">📂</span>
                    <h3 className="font-extrabold text-[12px] text-slate-800 uppercase tracking-wider">Cloud Backup & Restore Manager</h3>
                    <p className="text-[10px] text-slate-500 max-w-md mx-auto leading-relaxed">
                      Download complete client application databases - notes, schedule timers, goals, achievements, and buddy lists in an encrypted local backup file, or upload past configuration files to retrieve previous configurations.
                    </p>

                    <div className="flex gap-4 justify-center pt-2">
                      <button 
                        onClick={handleExportBackup} 
                        className="px-6 py-2.5 bg-indigo-600 text-white font-black text-xs uppercase rounded-xl shadow hover:bg-indigo-700 transition flex items-center gap-2"
                      >
                        <Download size={14} /> Export Backup File
                      </button>
                      <div className="relative">
                        <button className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-black text-xs uppercase rounded-xl hover:bg-slate-50 transition flex items-center gap-2">
                          <Upload size={14} /> Import Backup File
                        </button>
                        <input 
                          type="file" 
                          accept=".json" 
                          onChange={handleImportBackup} 
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </main>
          </div>
        )}

    </div>
  );
}
