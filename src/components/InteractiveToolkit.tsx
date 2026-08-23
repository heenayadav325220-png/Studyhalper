import { useState, useEffect, useRef, memo } from 'react';

// Safe JSON stringify helper to catch circular structures
function safeJsonStringify(obj: any): string {
  if (typeof obj === 'string') return obj;
  try {
    const cache = new Set();
    return JSON.stringify(obj, (_key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) return '[Circular]';
        cache.add(value);
      }
      return value;
    }, 2);
  } catch (e) {
    return String(obj || '');
  }
}
import {
  ArrowLeft,
  Menu,
  Sparkles,
  Cpu,
  Search,
  Settings,
  RotateCcw,
  Volume2,
  Play,
  ChevronRight,
  ChevronLeft,
  X,
  ListTodo,
  Headphones,
  Cloud,
  Palette,
  Mic,
  Upload,
  Trash2,
  Check,
  Circle,
  Users,
  Plus,
  BookOpen,
  Activity
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

import {
  generateNotes,
  summarizeNotes,
  explainTopic,
  generateMindmap,
  generateQuestionPaper,
  performOcr,
  summarizePdf,
  incrementToolkitUsage,
  getToolkitUsage,
  getStudyAnswer,
  generateQuiz,
  isAiQuotaExceeded
} from '../services/geminiService';

interface InteractiveToolkitProps {
  onClose: () => void;
  appLanguage: string;
  firebaseUser: any;
  user: any;
  notes: any[];
  onAddNote: (note: { title: string; content: string; subject: string }) => Promise<void>;
  onAddProgress?: (score: number, total: number, subject: string) => Promise<void>;
  onOpenDiagramMaker?: (prompt: string, title: string, subject: string) => void;
  initialTool?: string;
}

const InteractiveToolkit = memo(function InteractiveToolkit({
  onClose,
  appLanguage,
  firebaseUser: _firebaseUser,
  user,
  notes,
  onAddNote,
  onAddProgress,
  onOpenDiagramMaker,
  initialTool
}: InteractiveToolkitProps) {
  const [j, ut] = useState("study"); // activeTab: "study" | "vocab_calc" | "productivity" | "focus" | "utilities"
  const [ve, L] = useState(false); // isSidebarOpen (mobile)
  const [u, dt] = useState(false); // isSidebarCollapsed (desktop)
  const [p, xt] = useState(initialTool || "notes"); // activeTool: "notes" | "summarize" | "explain" | "mindmap" | "qpaper" | "ocr" | "pdf"

  useEffect(() => {
    if (initialTool) {
      xt(initialTool);
      // Map tool to tab
      if (["notes", "summarize", "explain", "mindmap", "qpaper", "ocr", "pdf"].includes(initialTool)) {
        ut("study");
      } else if (["vocab", "calc", "formula"].includes(initialTool)) {
        ut("vocab_calc");
      } else if (["goals", "spaced", "exams"].includes(initialTool)) {
        ut("productivity");
      } else if (["soundscapes", "timer"].includes(initialTool)) {
        ut("focus");
      } else if (["buddies", "translate", "math", "tts", "dictation"].includes(initialTool)) {
        ut("utilities");
      }
    }
  }, [initialTool]);
  const [E, ge] = useState(""); // topicInput
  const [f, Nt] = useState("Science"); // subjectInput
  const [I, bt] = useState("10"); // gradeInput
  const [ke, ft] = useState("Simple"); // explanationStyle: "Simple" | "Analogies" | "5-year-old" | "Step-by-step"
  const [G, Te] = useState(false); // aiLoading
  const [ht, je] = useState(false); // aiThrottle
  const [vt, Ee] = useState(false); // quizThrottle
  const [a, H] = useState<any>(null); // aiResult
  const [W, Ie] = useState("visual"); // mindmapViewType: "visual" | "tree"
  const [gt, ye] = useState<Record<string, boolean>>({}); // mindmapExpandedNodes
  const [h, $] = useState<any>(null); // mindmapExplainNode
  const [De, Ve] = useState(false); // mindmapExplainLoading

  useEffect(() => {
    if (p === "mindmap" && a && a.children) {
      const initialExpanded: Record<string, boolean> = {};
      a.children.forEach((_: any, i: number) => {
        initialExpanded[`child-${i}`] = true;
      });
      ye(initialExpanded);
      $(null);
    }
  }, [a, p]);

  const we = async (nodeName: string | unknown) => {
    if (!nodeName || typeof nodeName !== 'string') return;
    Ve(true);
    $({ nodeName, explanation: "" });
    try {
      const promptText = `Explain the concept or subtopic "${nodeName}" in the context of our study topic "${E}" for class/grade ${I} level. Give a 2-sentence simple, clear explanation in ${appLanguage}.`;
      const response = await getStudyAnswer(promptText, undefined, undefined, appLanguage);
      $({ nodeName, explanation: response });
    } catch (err) {
      console.error(err);
      $({
        nodeName,
        explanation: appLanguage === "Hindi"
          ? "स्पष्टीकरण लोड करने में असमर्थ। कृपया पुनः प्रयास करें।"
          : "Unable to load explanation. Please try again."
      });
    } finally {
      Ve(false);
    }
  };

  const kt = async (title: string | unknown, contentText: string | unknown) => {
    const cleanTitle = typeof title === 'string' ? title : "Study Note";
    const cleanContent = typeof contentText === 'string' ? contentText : String(contentText || "");
    if (!cleanContent) return;
    try {
      await onAddNote({
        title: cleanTitle,
        content: `### ${cleanTitle}\n\n${cleanContent}\n\n*Generated from Mindmap of topic: **${E}**.*`,
        subject: f
      });
      alert(
        appLanguage === "Hindi"
          ? `✅ "${title}" को आपके नोटबुक में सफलतापूर्वक जोड़ दिया गया है!`
          : `✅ "${title}" has been successfully added to your Notebook!`
      );
    } catch (i) {
      console.error(i);
      alert(appLanguage === "Hindi" ? "नोट सहेजने में विफल।" : "Failed to save note.");
    }
  };

  const [Se, Tt] = useState(""); // pdfTextInput
  const [Y, jt] = useState<string | null>(null); // ocrImagePreview
  const [Et, It] = useState(isAiQuotaExceeded); // isQuotaExceeded
  const [c, yt] = useState(() => getToolkitUsage()); // toolkitUsage

  useEffect(() => {
    const handleQuotaChange = (s: any) => {
      It(s.detail?.exceeded ?? false);
    };
    window.addEventListener("ai-quota-state-changed", handleQuotaChange);
    return () => {
      window.removeEventListener("ai-quota-state-changed", handleQuotaChange);
    };
  }, []);

  useEffect(() => {
    const handleUsageChange = (s: any) => {
      if (s.detail) yt(s.detail);
    };
    window.addEventListener("toolkit-usage-updated", handleUsageChange);
    return () => {
      window.removeEventListener("toolkit-usage-updated", handleUsageChange);
    };
  }, []);

  const [quizSubject, setQuizSubject] = useState("Science"); // quizSubject
  const [Ce, Vt] = useState("10"); // quizGrade
  const [A, K] = useState(false); // quizRunning
  const [v, wt] = useState<any[]>([]); // quizQuestions
  const [Z, $e] = useState(false); // quizGenerating
  const [ee, Ae] = useState<number[]>([]); // quizAnswers
  const [St, te] = useState(false); // quizSubmitted
  const [U, Me] = useState(0); // quizTimeLeft
  const [Ct, _Ss] = useState(300); // quizTimeTotal
  const b = useRef<any>(null); // quizTimerRef

  const [y, $t] = useState(""); // vocabWordInput
  const [ze, Re] = useState(false); // vocabLoading
  const [d, Pe] = useState<any>(null); // vocabResult
  const [g, Fe] = useState<any[]>(() => JSON.parse(localStorage.getItem("studybuddy_vocab_list") || "[]")); // vocabSavedDeck
  const [Oe, M] = useState("0"); // calcDisplay
  const [_e, At] = useState(""); // formulaSearch

  const Mt = [
    {
      title: "Quadratic Formula",
      subject: "Mathematics",
      expr: "x = (-b ± √(b² - 4ac)) / 2a",
      desc: "Finds the roots of a quadratic equation ax² + bx + c = 0."
    },
    {
      title: "Area of Circle",
      subject: "Mathematics",
      expr: "A = πr²",
      desc: "Calculates total area enclosed by a circle of radius r."
    },
    {
      title: "Newton's Second Law",
      subject: "Physics",
      expr: "F = ma",
      desc: "Force equals mass multiplied by acceleration."
    },
    {
      title: "Einstein's Energy-Mass Equivalence",
      subject: "Physics",
      expr: "E = mc²",
      desc: "Relates mass (m) and energy (E) using the constant speed of light (c)."
    },
    {
      title: "Ideal Gas Law",
      subject: "Chemistry",
      expr: "PV = nRT",
      desc: "Relates pressure, volume, gas amount, temperature, and gas constant."
    },
    {
      title: "Pythagorean Theorem",
      subject: "Mathematics",
      expr: "a² + b² = c²",
      desc: "In a right-angled triangle, hypotenuse squared is the sum of other two sides squared."
    }
  ];

  const [D, q] = useState<any[]>(() =>
    JSON.parse(
      localStorage.getItem("studybuddy_daily_goals") ||
        '[{"id":"1","text":"Solve 5 algebra issues","completed":false},{"id":"2","text":"Revise Science summary","completed":false}]'
    )
  ); // dailyGoals
  const [se, Le] = useState(""); // newGoalText
  const [z, ie] = useState<any[]>(() => JSON.parse(localStorage.getItem("studybuddy_exams_list") || "[]")); // examsList
  const [R, le] = useState({ subject: "Mathematics", date: "", title: "" }); // newExam

  const [Ge, He] = useState([
    {
      id: "rain",
      name: "Gentle Rain",
      icon: "🌧️",
      audioUrl: "https://assets.mixkit.co/active_storage/sfx/2533/2533-84.wav",
      playing: false,
      volume: 50
    },
    {
      id: "forest",
      name: "Forest Birds",
      icon: "🌲",
      audioUrl: "https://assets.mixkit.co/active_storage/sfx/1113/1113-84.wav",
      playing: false,
      volume: 50
    },
    {
      id: "lofi",
      name: "Lofi Chords",
      icon: "🎸",
      audioUrl: "https://assets.mixkit.co/active_storage/sfx/123/123.wav",
      playing: false,
      volume: 50
    },
    {
      id: "cafe",
      name: "Coffee Shop",
      icon: "☕",
      audioUrl: "https://assets.mixkit.co/active_storage/sfx/1441/1441-84.wav",
      playing: false,
      volume: 50
    }
  ]);

  const x = useRef<Record<string, HTMLAudioElement>>({}); // soundscapeAudioInstances
  const [m, zt] = useState(false); // focusModeActive
  const [B, Ue] = useState(1500); // focusTimerTime (seconds, default 25 min = 1500)
  const [P, ae] = useState(false); // focusTimerRunning
  const [Rt, Pt] = useState(""); // focusTimerScratchpad
  const N = useRef<any>(null); // focusTimerRef

  const [V, qe] = useState<any[]>(() =>
    JSON.parse(
      localStorage.getItem("studybuddy_friends") ||
        `[
          {"id":"f1","name":"Aanya Sharma","online":true,"xp":1250,"chat":[]},
          {"id":"f2","name":"Vivaan Patel","online":false,"xp":980,"chat":[]},
          {"id":"f3","name":"Ishita Roy","online":true,"xp":1500,"chat":[]}
        ]`
    )
  ); // buddyList
  const [w, Ft] = useState<string | null>(null); // activeBuddyChatId
  const [oe, Be] = useState(""); // directMessageInput
  const [F, ne] = useState<any[]>(() => JSON.parse(localStorage.getItem("studybuddy_revision_spaced") || "[]")); // spacedRevisionList
  const [re, ce] = useState(false); // ttsPlaying
  const [Ot, J] = useState(false); // speechRecognitionRunning
  const pe = useRef<any>(null); // speechRecognitionInstance

  useEffect(() => {
    localStorage.setItem("studybuddy_vocab_list", JSON.stringify(g));
  }, [g]);

  useEffect(() => {
    localStorage.setItem("studybuddy_daily_goals", JSON.stringify(D));
  }, [D]);

  useEffect(() => {
    localStorage.setItem("studybuddy_exams_list", JSON.stringify(z));
  }, [z]);

  useEffect(() => {
    localStorage.setItem("studybuddy_friends", JSON.stringify(V));
  }, [V]);

  useEffect(() => {
    localStorage.setItem("studybuddy_revision_spaced", JSON.stringify(F));
  }, [F]);

  useEffect(() => {
    return () => {
      Object.values(x.current).forEach((t) => {
        if (t && typeof t.pause === "function") t.pause();
      });
      if (b.current) clearInterval(b.current);
      if (N.current) clearInterval(N.current);
    };
  }, []);

  const Je = (t: string, s: number) => {
    He((i) =>
      i.map((o) => {
        if (o.id === t) {
          if (x.current[t]) {
            x.current[t].volume = s / 100;
          }
          return { ...o, volume: s };
        }
        return o;
      })
    );
  };

  const Qe = (t: string) => {
    He((s) =>
      s.map((i) => {
        if (i.id === t) {
          const o = !i.playing;
          if (o) {
            if (!x.current[t]) {
              const n = new Audio(i.audioUrl);
              n.loop = true;
              x.current[t] = n;
            }
            x.current[t].volume = i.volume / 100;
            x.current[t].play().catch((n) => console.log("Audio play error", n));
          } else {
            if (x.current[t]) x.current[t].pause();
          }
          return { ...i, playing: o };
        }
        return i;
      })
    );
  };

  useEffect(() => {
    if (A && U > 0) {
      b.current = setInterval(() => {
        Me((t) => {
          if (t <= 1) {
            clearInterval(b.current);
            Ye();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (b.current) clearInterval(b.current);
    };
  }, [A, U]);

  useEffect(() => {
    if (P && B > 0) {
      N.current = setInterval(() => {
        Ue((t) => {
          if (t <= 1) {
            ae(false);
            if (N.current) clearInterval(N.current);
            alert("⏰ Great job! You completed your distraction-free study session!");
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (!P && N.current) clearInterval(N.current);
    }
    return () => {
      if (N.current) clearInterval(N.current);
    };
  }, [P, B]);

  const _t = () => {
    const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechClass) {
      alert("Speech recognition is not supported in this browser. Please try Chrome/Edge.");
      return;
    }
    if (!pe.current) {
      const s = new SpeechClass();
      s.continuous = false;
      s.lang = appLanguage === "Hindi" ? "hi-IN" : "en-US";
      s.onresult = async (i: any) => {
        const o = i.results[0][0].transcript;
        ge(o);
        J(false);
        We(o);
      };
      s.onerror = () => J(false);
      s.onend = () => J(false);
      pe.current = s;
    }
    J(true);
    pe.current.start();
  };

  const Q = (t: string | unknown) => {
    if (!window.speechSynthesis) {
      alert("TTS not supported in this browser.");
      return;
    }
    if (re) {
      window.speechSynthesis.cancel();
      ce(false);
      return;
    }
    const rawStr = typeof t === 'string' ? t : String(t || '');
    if (!rawStr) return;
    const cleanText = rawStr.replace(/[#*`_-]/g, "").substring(0, 500);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => ce(false);
    ce(true);
    window.speechSynthesis.speak(utterance);
  };

  const We = async (t?: string | unknown) => {
    if (ht || G) {
      alert("Please wait 3 seconds between requests to protect the server!");
      return;
    }
    const s = typeof t === 'string' ? t : E;
    if (!s && p !== "pdf" && p !== "ocr") {
      alert("Please specify a topic or text first!");
      return;
    }
    if (c.count >= c.limit) {
      alert(
        appLanguage === "Hindi"
          ? "⚠️ आपके एडवांस्ड टूलकिट की दैनिक सीमा (50 मैसेजेस) समाप्त हो गई है। कृपया कल पुनः प्रयास करें या अन्य सामान्य असीमित (unlimited) सुविधाओं का उपयोग करें।"
          : "⚠️ Your daily Advanced Toolkit limit of 50 messages has been reached. Please try again tomorrow or enjoy our other unlimited app features!"
      );
      return;
    }
    je(true);
    setTimeout(() => {
      je(false);
    }, 3000);
    Te(true);
    H(null);
    try {
      let result = null;
      if (p === "notes") result = await generateNotes(s, f, I);
      else if (p === "summarize") result = await summarizeNotes(s);
      else if (p === "explain") result = await explainTopic(s, f, I, ke);
      else if (p === "mindmap") result = await generateMindmap(s);
      else if (p === "qpaper") result = await generateQuestionPaper(s, f, I);
      else if (p === "ocr") result = await performOcr(Y || "");
      else if (p === "pdf") result = await summarizePdf(Se);

      if (result) {
        H(result);
        incrementToolkitUsage();
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("studybuddy-trigger-ad"));
        }, 1500);
      } else {
        alert("Failed to reach Gemini API model. Running internal offline generator.");
        H({
          title: "Offline Concept Overview",
          content: `### ${s}\n\nHere is an automated overview of **${s}** for standard Class ${I} syllabus studies. Please check connection to use real-time AI reasoning.`
        });
      }
    } catch (err) {
      console.error(err);
      alert("AI Service is temporarily busy. Try again.");
    } finally {
      Te(false);
    }
  };

  const Lt = async () => {
    if (vt || Z) {
      alert("Please wait 3 seconds between requests to protect the server!");
      return;
    }
    if (c.count >= c.limit) {
      alert(
        appLanguage === "Hindi"
          ? "⚠️ आपके एडवांस्ड टूलकिट की दैनिक सीमा (50 मैसेजेस) समाप्त हो गई है। कृपया कल पुनः प्रयास करें या अन्य सामान्य असीमित (unlimited) सुविधाओं का उपयोग करें।"
          : "⚠️ Your daily Advanced Toolkit limit of 50 messages has been reached. Please try again tomorrow or enjoy our other unlimited app features!"
      );
      return;
    }
    Ee(true);
    setTimeout(() => {
      Ee(false);
    }, 3000);
    $e(true);
    K(false);
    te(false);
    try {
      const res = await generateQuiz(quizSubject, {
        name: user?.name || "Student",
        school: user?.school || "School",
        className: Ce
      }, appLanguage, "Hard");

      if (res && res.length > 0) {
        wt(res);
        Ae(new Array(res.length).fill(-1));
        Me(Ct);
        K(true);
        incrementToolkitUsage();
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("studybuddy-trigger-ad"));
        }, 1500);
      } else {
        alert("Could not generate mock questions. Using fallback exam database.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      $e(false);
    }
  };

  const Ye = async () => {
    K(false);
    te(true);
    if (b.current) clearInterval(b.current);
    let correctCount = 0;
    v.forEach((qItem: any, idx: number) => {
      if (ee[idx] === qItem.answer) correctCount++;
    });
    const xpPoints = correctCount * 30;
    if (onAddProgress) {
      await onAddProgress(correctCount, v.length, quizSubject);
    }
    alert(
      `📝 Test Completed! Score: ${correctCount}/${v.length}. You earned +${xpPoints} XP points for your study progress!`
    );
  };

  const Gt = async () => {
    if (y) {
      if (c.count >= c.limit) {
        alert(
          appLanguage === "Hindi"
            ? "⚠️ आपके एडवांस्ड टूलकिट की दैनिक सीमा (50 मैसेजेस) समाप्त हो गई है। कृपया कल पुनः प्रयास करें या अन्य सामान्य असीमित (unlimited) सुविधाओं का उपयोग करें।"
            : "⚠️ Your daily Advanced Toolkit limit of 50 messages has been reached. Please try again tomorrow or enjoy our other unlimited app features!"
        );
        return;
      }
      Re(true);
      try {
        const queryText = `Define the word: "${y}". Provide: Part of Speech, precise academic definition, 2 synonyms, and 1 example sentence. Format your response ONLY as valid JSON in this structure: {"word": "${y}", "partOfSpeech": "...", "definition": "...", "synonyms": ["...", "..."], "example": "..."}`;
        const resText = await getStudyAnswer(queryText, undefined, undefined, "English");
        if (resText) {
          let trimmed = resText.trim();
          if (trimmed.startsWith("```json")) {
            trimmed = trimmed.substring(7);
          } else if (trimmed.startsWith("```")) {
            trimmed = trimmed.substring(3);
          }
          if (trimmed.endsWith("```")) {
            trimmed = trimmed.substring(0, trimmed.length - 3);
          }
          const parsed = JSON.parse(trimmed.trim());
          Pe(parsed);
          incrementToolkitUsage();
        }
      } catch (err) {
        console.error(err);
        Pe({
          word: y,
          partOfSpeech: "noun",
          definition: "A useful study word looked up for active learning.",
          synonyms: ["knowledge", "term"],
          example: `We registered ${y} inside our core Vocabulary Builder deck.`
        });
      } finally {
        Re(false);
      }
    }
  };

  const Ht = () => {
    if (d) {
      if (g.some((t: any) => t.word.toLowerCase() === d.word.toLowerCase())) {
        return;
      }
      Fe((t) => [...t, d]);
      alert("Saved word successfully!");
    }
  };

  const Ut = (t: string) => {
    if (t === "C") M("0");
    else if (t === "DEL") M((s) => (s.length > 1 ? s.slice(0, -1) : "0"));
    else if (t === "=") {
      try {
        let expression = Oe.replace(/sin\(/g, "Math.sin(")
          .replace(/cos\(/g, "Math.cos(")
          .replace(/tan\(/g, "Math.tan(")
          .replace(/log\(/g, "Math.log10(")
          .replace(/ln\(/g, "Math.log(")
          .replace(/pi/g, "Math.PI")
          .replace(/e/g, "Math.E")
          .replace(/\^/g, "**");
        const calculated = new Function(`return ${expression}`)();
        M(Number(calculated).toFixed(4).replace(/\.?0+$/, ""));
      } catch {
        M("Error");
      }
    } else {
      M((s) => (s === "0" || s === "Error" ? t : s + t));
    }
  };

  const qt = () => {
    if (se.trim()) {
      q((t) => [...t, { id: Date.now().toString(), text: se, completed: false }]);
      Le("");
    }
  };

  const Bt = (id: string) => {
    q((s) =>
      s.map((i) => {
        if (i.id === id) {
          const updated = !i.completed;
          if (updated) {
            alert("🎯 Goal completed! +15 XP points logged!");
          }
          return { ...i, completed: updated };
        }
        return i;
      })
    );
  };

  const Jt = () => {
    if (R.title && R.date) {
      ie((t) => [...t, { id: Date.now().toString(), ...R }]);
      le({ subject: "Mathematics", date: "", title: "" });
    }
  };

  const Qt = (id: string) => {
    ie((s) => s.filter((i) => i.id !== id));
  };

  const Wt = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} days left` : days === 0 ? "Today!" : "Passed";
  };

  const Yt = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(
        JSON.stringify({
          goals: D,
          exams: z,
          vocabList: g,
          revisionNotes: F,
          friendsList: V
        })
      );
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `studybuddy_cloud_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const Xt = (t: any) => {
    const reader = new FileReader();
    if (t.target.files && t.target.files[0]) {
      reader.readAsText(t.target.files[0], "UTF-8");
      reader.onload = (i: any) => {
        try {
          const parsed = JSON.parse(i.target?.result);
          if (parsed.goals) q(parsed.goals);
          if (parsed.exams) ie(parsed.exams);
          if (parsed.vocabList) Fe(parsed.vocabList);
          if (parsed.revisionNotes) ne(parsed.revisionNotes);
          if (parsed.friendsList) qe(parsed.friendsList);
          alert("🎉 Core backup restored successfully!");
        } catch {
          alert("Invalid backup file structure.");
        }
      };
    }
  };

  const Kt = () => {
    if (oe.trim() && w) {
      qe((t) =>
        t.map((s) => {
          if (s.id === w) {
            const chatLog = [...s.chat, `Me: ${oe}`, "Buddy: That sounds like a solid study plan! Keep pushing!"];
            return { ...s, chat: chatLog };
          }
          return s;
        })
      );
      Be("");
    }
  };

  const Zt = async () => {
    if (!a) return;
    const saveTitle = a.title || E || "AI Note Card";
    let saveContent = a.content || a.summary || a.explanation || "";
    if (typeof a === "object" && a.summary) saveContent = a.summary;
    if (typeof a === "object" && a.explanation) saveContent = a.explanation;

    await onAddNote({
      title: saveTitle,
      content: saveContent,
      subject: f
    });
    alert("📝 Study Note successfully saved in your notebook library!");
  };

  const es = (noteId: number, noteTitle: string) => {
    const intervals = [1, 7, 30];
    const item = F.find((O) => O.noteId === noteId);
    let nextStage = 0;
    if (item) {
      nextStage = Math.min(item.stage + 1, intervals.length - 1);
    }
    const daysToAdd = intervals[nextStage];
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysToAdd);

    ne((O) => {
      const exists = O.some((me) => me.noteId === noteId);
      if (exists) {
        return O.map((me) =>
          me.noteId === noteId
            ? { ...me, stage: nextStage, nextDate: targetDate.toISOString().split("T")[0] }
            : me
        );
      } else {
        return [
          ...O,
          { noteId, title: noteTitle, nextDate: targetDate.toISOString().split("T")[0], stage: nextStage }
        ];
      }
    });

    alert(`📅 Revision logged! Spaced review set for ${daysToAdd} day(s) from now.`);
  };

  const ts = (t: any) => {
    const file = t.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        jt(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col w-screen h-screen overflow-hidden transition-colors duration-300 ${
        m ? "bg-slate-950 text-cyan-300" : "bg-slate-50 text-slate-800"
      }`}
      id="toolkit_page"
    >
      <header
        className={`px-4 py-3 border-b flex justify-between items-center shrink-0 shadow-sm z-10 transition-colors duration-200 ${
          m ? "bg-slate-900 border-slate-800 text-cyan-400" : "bg-white border-slate-100 text-slate-800"
        }`}
      >
        <div className="flex items-center gap-1.5">
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-all duration-200 active:scale-95 flex items-center justify-center mr-1 ${
              m ? "hover:bg-slate-800 text-cyan-400 hover:text-cyan-300" : "hover:bg-slate-100 text-slate-500 hover:text-slate-800"
            }`}
            title="Back to Home"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={() => L(true)}
            className={`p-2 rounded-full transition-all duration-200 active:scale-95 flex items-center justify-center md:hidden mr-1 ${
              m ? "hover:bg-slate-800 text-cyan-400 hover:text-cyan-300" : "hover:bg-slate-100 text-slate-500 hover:text-slate-800"
            }`}
            title="Open Navigation"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className={`w-5 h-5 ${m ? "text-cyan-400" : "text-indigo-600"} animate-pulse`} />
            <div>
              <h1 className={`font-black text-sm sm:text-base tracking-tight leading-none ${m ? "text-cyan-300" : "text-slate-800"}`}>
                Advanced Study Toolkit
              </h1>
              <p className={`text-[9px] font-bold mt-0.5 leading-none hidden sm:block ${m ? "text-slate-500" : "text-slate-400"}`}>
                Comprehensive AI tools, practice engines & focus dashboard
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div
            className={`hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border select-none text-[10px] font-black uppercase tracking-wider ${
              m ? "bg-cyan-950/40 border-cyan-500/20 text-cyan-400" : "bg-amber-50 border-amber-200 text-amber-800"
            }`}
          >
            <Cpu size={12} className={c.count >= c.limit * 0.8 ? "animate-pulse" : ""} />
            <span>
              {appLanguage === "Hindi"
                ? `प्रयुक्त: Toolkit: ${c.count}/${c.limit} Used`
                : `Toolkit: ${c.count}/${c.limit} Used`}
            </span>
          </div>
          <button
            onClick={() => zt(!m)}
            className={`text-[10px] font-black uppercase px-2.5 py-1.5 sm:px-3 rounded-xl border transition-all duration-200 flex items-center gap-1.5 ${
              m ? "bg-cyan-950 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900" : "bg-indigo-50 border-indigo-100 hover:bg-indigo-100 text-indigo-700"
            }`}
          >
            <span>{m ? "Exit Focus" : "Focus Mode 🧘"}</span>
          </button>
          <button
            className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center ${
              m ? "hover:bg-slate-800 text-cyan-500 hover:text-cyan-300" : "hover:bg-slate-100 text-slate-500 hover:text-slate-800"
            }`}
            title="Search Toolkit"
          >
            <Search size={16} />
          </button>
          <button
            className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center ${
              m ? "hover:bg-slate-800 text-cyan-500 hover:text-cyan-300" : "hover:bg-slate-100 text-slate-500 hover:text-slate-800"
            }`}
            title="Toolkit Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {m ? (
        <div className="flex-1 bg-slate-950 text-cyan-300 p-6 flex flex-col md:flex-row gap-6 overflow-y-auto">
          <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6 border-r border-slate-900 pr-0 md:pr-6">
            <span className="text-sm tracking-widest font-black uppercase text-cyan-500">Focusing On Your Future</span>
            <div className="text-6xl font-mono font-black text-cyan-400 shadow-cyan-950/50 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">
              {Math.floor(B / 60)
                .toString()
                .padStart(2, "0")}
              :{(B % 60).toString().padStart(2, "0")}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => ae(!P)}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-wider"
              >
                {P ? "Pause" : "Start Session"}
              </button>
              <button
                onClick={() => {
                  Ue(1500);
                  ae(false);
                }}
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
              {Ge.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-300 font-bold">
                    {t.icon} {t.name}
                  </span>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={t.volume}
                      onChange={(s) => Je(t.id, parseInt(s.target.value))}
                      className="w-16 accent-cyan-500"
                    />
                    <button
                      onClick={() => Qe(t.id)}
                      className={`p-1.5 rounded-lg text-[10px] ${t.playing ? "bg-cyan-600 text-slate-950" : "bg-slate-850 text-cyan-500"}`}
                    >
                      {t.playing ? <Volume2 size={10} /> : <Play size={10} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex-1 bg-slate-900 border border-slate-800/80 p-4 rounded-3xl flex flex-col">
              <span className="text-[10px] font-black text-cyan-500 uppercase mb-2">Scratchpad</span>
              <textarea
                value={Rt}
                onChange={(t) => Pt(t.target.value)}
                placeholder="Jot down formulas or quick calculation steps..."
                className="flex-1 bg-slate-950/50 border border-slate-800 rounded-2xl p-2.5 text-xs text-cyan-300 outline-none resize-none font-mono"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden relative">
          {ve && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden" onClick={() => L(false)} />
          )}
          <aside
            className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-slate-200/80 p-4 flex flex-col gap-2 transition-all duration-300 ease-in-out md:static md:translate-x-0 shrink-0 ${
              ve ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            } ${u ? "md:w-16 md:px-2 md:py-4" : "md:w-56 md:px-4 md:py-4"}`}
          >
            <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
              <span
                className={`text-[9px] uppercase font-black text-slate-400 tracking-wider transition-opacity duration-300 ${
                  u ? "md:opacity-0 md:w-0" : "opacity-100"
                }`}
              >
                Sections
              </span>
              <button
                onClick={() => dt(!u)}
                className="hidden md:flex p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 transition"
                title={u ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {u ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
              </button>
              <button
                onClick={() => L(false)}
                className="flex md:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-rose-600 transition"
                title="Close Navigation"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              {[
                { id: "study", label: "AI Study Center", icon: <Sparkles size={15} /> },
                { id: "vocab_calc", label: "Practice Tools", icon: <Activity size={15} /> },
                { id: "productivity", label: "Planner & Goals", icon: <ListTodo size={15} /> },
                { id: "focus", label: "Social & Sounds", icon: <Headphones size={15} /> },
                { id: "utilities", label: "File Backup", icon: <Cloud size={15} /> }
              ].map((t) => {
                const isCurrent = j === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      ut(t.id);
                      L(false);
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl transition-all duration-200 flex items-center gap-3 font-extrabold text-xs group relative ${
                      isCurrent ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    } ${u ? "md:justify-center md:px-0" : ""}`}
                    title={t.label}
                  >
                    <span className={isCurrent ? "text-white" : "text-indigo-600 group-hover:text-indigo-700"}>{t.icon}</span>
                    <span className={`transition-all duration-300 ${u ? "md:hidden" : "block"}`}>{t.label}</span>
                    {u && (
                      <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[9px] font-black rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 hidden md:block shadow-md">
                        {t.label}
                      </div>
                    )}
                  </button>
                );
              })}

              <button
                onClick={() => {
                  onClose();
                  if (onOpenDiagramMaker) onOpenDiagramMaker("Process Flow of Water Cycle", "Water Cycle", "Science");
                }}
                className={`w-full py-2.5 px-3 rounded-xl transition-all duration-200 flex items-center gap-3 font-black text-xs group relative border border-dashed text-indigo-600 border-indigo-200 hover:bg-indigo-50/50 mt-2 ${
                  u ? "md:justify-center md:px-0" : ""
                }`}
                title="Open Diagram Lab"
              >
                <span className="text-indigo-600">
                  <Palette size={15} />
                </span>
                <span className={`transition-all duration-300 ${u ? "md:hidden" : "block"}`}>Open Diagram Lab 🎨</span>
                {u && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[9px] font-black rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 hidden md:block shadow-md">
                    Diagram Lab
                  </div>
                )}
              </button>
            </div>

            {!u && (
              <div className="mt-auto p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-2 select-none">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Cpu className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                    <span className="font-extrabold text-[9px] text-slate-700 uppercase tracking-wider">
                      {appLanguage === "Hindi" ? "टूलकिट उपयोग" : "Toolkit Usage"}
                    </span>
                  </div>
                  <span
                    className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                      c.count >= c.limit ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {c.count >= c.limit ? (appLanguage === "Hindi" ? "सीमा पूर्ण 🛑" : "Full 🛑") : appLanguage === "Hindi" ? "सक्रिय ✅" : "Active ✅"}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="w-full bg-slate-100 border border-slate-200/40 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        c.count >= c.limit ? "bg-rose-500" : c.count >= c.limit * 0.8 ? "bg-amber-500 animate-pulse" : "bg-indigo-600"
                      }`}
                      style={{ width: `${Math.min(100, (c.count / c.limit) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[8px] font-extrabold text-slate-500">
                    <span>{appLanguage === "Hindi" ? "दैनिक सीमा (50)" : "Daily Limit (50)"}</span>
                    <span>{c.count} / {c.limit}</span>
                  </div>
                </div>
              </div>
            )}
          </aside>

          <main className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
            {j === "study" && (
              <div className="space-y-4">
                <div className="flex gap-1.5 flex-wrap bg-slate-100 p-1 rounded-2xl">
                  {["notes", "summarize", "explain", "mindmap", "qpaper", "ocr", "pdf"].map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        xt(t);
                        H(null);
                      }}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-xl transition ${
                        p === t ? "bg-white text-indigo-600 shadow" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
                    <h3 className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider">AI Parameters</h3>
                    {p !== "ocr" && p !== "pdf" && (
                      <div>
                        <label className="block text-[8px] uppercase font-black text-slate-400 tracking-wider mb-1">
                          Topic / Term
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={E}
                            onChange={(t) => ge(t.target.value)}
                            placeholder="e.g. Gravity, Organic Chemistry"
                            className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none"
                          />
                          <button
                            onClick={_t}
                            className={`absolute right-2 top-2.5 p-0.5 rounded-lg text-slate-400 hover:text-indigo-600 ${
                              Ot ? "animate-pulse text-red-500" : ""
                            }`}
                          >
                            <Mic size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    {p !== "summarize" && p !== "mindmap" && p !== "ocr" && p !== "pdf" && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8px] uppercase font-black text-slate-400 tracking-wider mb-1">
                            Subject
                          </label>
                          <select
                            value={f}
                            onChange={(t) => Nt(t.target.value)}
                            className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-white outline-none"
                          >
                            {["Mathematics", "Science", "Biology", "Physics", "Chemistry", "English"].map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[8px] uppercase font-black text-slate-400 tracking-wider mb-1">
                            Grade Level
                          </label>
                          <select
                            value={I}
                            onChange={(t) => bt(t.target.value)}
                            className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-white outline-none"
                          >
                            {["8", "9", "10", "11", "12"].map((t) => (
                              <option key={t} value={t}>
                                Class {t}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {p === "explain" && (
                      <div>
                        <label className="block text-[8px] uppercase font-black text-slate-400 tracking-wider mb-1">
                          Explanation Style
                        </label>
                        <select
                          value={ke}
                          onChange={(t) => ft(t.target.value)}
                          className="w-full p-2 text-xs border border-slate-200 bg-white rounded-xl outline-none"
                        >
                          <option value="Simple">Simple Student English</option>
                          <option value="Analogies">Vivid Analogy & Metaphor</option>
                          <option value="5-year-old">Like I am 5 Years Old</option>
                          <option value="Step-by-step">Meticulous Step-by-Step</option>
                        </select>
                      </div>
                    )}

                    {p === "ocr" && (
                      <div className="space-y-2">
                        <label className="block text-[8px] uppercase font-black text-slate-400 tracking-wider mb-1">
                          Upload Homework / Textbook Image
                        </label>
                        <div className="border border-dashed border-slate-200 rounded-2xl p-4 text-center hover:bg-slate-50 transition relative">
                          <input type="file" accept="image/*" onChange={ts} className="absolute inset-0 opacity-0 cursor-pointer" />
                          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
                          <span className="text-[10px] text-slate-500 font-bold block">Click to select image file</span>
                        </div>
                        {Y && <img src={Y} alt="OCR Upload Preview" className="mt-2 w-full h-24 object-cover rounded-xl border" />}
                      </div>
                    )}

                    {p === "pdf" && (
                      <div>
                        <label className="block text-[8px] uppercase font-black text-slate-400 tracking-wider mb-1">
                          Paste Document / Note Content
                        </label>
                        <textarea
                          value={Se}
                          onChange={(t) => Tt(t.target.value)}
                          placeholder="Paste your long notes, PDF texts, or study guides here..."
                          className="w-full h-32 p-2 text-xs border border-slate-200 rounded-xl outline-none resize-none font-mono"
                        />
                      </div>
                    )}

                    <button
                      onClick={() => We()}
                      disabled={G}
                      className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wide flex justify-center items-center gap-1.5 shadow"
                    >
                      {G ? "Gemini Reasoning..." : "Run AI Tool ⚡"}
                    </button>
                  </div>

                  <div className="col-span-2 bg-slate-50/20 rounded-3xl border border-slate-100 p-4 min-h-[300px] flex flex-col justify-between">
                    {G ? (
                      <div className="flex-1 flex flex-col items-center justify-center space-y-2">
                        <span className="animate-spin text-2xl">⏳</span>
                        <span className="text-xs font-bold text-slate-500 animate-pulse">Running Gemini analysis models...</span>
                      </div>
                    ) : a ? (
                      <div className="space-y-4 flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-center border-b pb-2">
                          <h4 className="font-extrabold text-xs text-indigo-900">{a.title || "Gemini Extraction Result"}</h4>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => Q(a.content || a.summary || a.explanation || a.paperText || "")}
                              className={`text-[10px] font-bold px-2 py-1 rounded-lg border flex items-center gap-1 ${
                                re ? "bg-indigo-600 text-white" : "bg-white"
                              }`}
                            >
                              <Volume2 size={12} /> {re ? "Mute" : "Listen"}
                            </button>
                            <button
                              onClick={Zt}
                              className="text-[10px] bg-white text-slate-700 font-bold px-2 py-1 rounded-lg border hover:bg-slate-50 transition"
                            >
                              Save Note 📝
                            </button>
                            {onOpenDiagramMaker && (
                              <button
                                onClick={() => {
                                  const diagramTitle = a.title || E || "Custom Concept";
                                  const diagramPrompt = `A detailed, high-contrast textbook-grade study diagram of ${diagramTitle} with academic labeling pointers.`;
                                  onOpenDiagramMaker(diagramPrompt, diagramTitle, f);
                                }}
                                className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-black px-2 py-1 rounded-lg transition flex items-center gap-1.5"
                              >
                                <Palette size={11} />
                                <span>Diagram Lab 🎨</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {Et && (
                          <div className="p-2.5 bg-amber-50 border border-amber-200/60 rounded-xl text-[10px] text-amber-800 leading-normal select-none font-sans">
                            ⚠️ <strong>Offline Fallback Mode</strong>: Gemini daily API quota exceeded. Running internal high-quality study generator. Configure a custom key in settings for unlimited live AI.
                          </div>
                        )}

                        <div className="flex-1 overflow-y-auto max-h-[350px] text-xs leading-relaxed text-slate-700 whitespace-pre-line font-medium p-1">
                          {p === "mindmap" ? (
                            <div className="space-y-4 font-sans">
                              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                                <div className="flex items-center space-x-1.5">
                                  <span className="text-sm">🌳</span>
                                  <span className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider">
                                    {appLanguage === "Hindi" ? "माइंड मैप विज़ुअलाइज़र" : "Mind Map Visualizer"}
                                  </span>
                                </div>
                                <div className="flex bg-slate-100 p-0.5 rounded-xl text-[9px] font-bold">
                                  <button
                                    onClick={() => Ie("visual")}
                                    className={`px-2.5 py-1 rounded-lg transition-all ${
                                      W === "visual" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                                    }`}
                                  >
                                    🎨 {appLanguage === "Hindi" ? "विज़ुअल मैप" : "Visual Map"}
                                  </button>
                                  <button
                                    onClick={() => Ie("tree")}
                                    className={`px-2.5 py-1 rounded-lg transition-all ${
                                      W === "tree" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                                    }`}
                                  >
                                    🌳 {appLanguage === "Hindi" ? "ट्री व्यू" : "Tree View"}
                                  </button>
                                </div>
                              </div>

                              {W === "visual" ? (
                                <div className="space-y-4">
                                  <div className="flex justify-center my-2">
                                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-xs px-5 py-3 rounded-2xl shadow-md border-2 border-indigo-200 text-center relative max-w-xs transform hover:scale-105 transition duration-300">
                                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-yellow-400 text-[8px] font-black uppercase text-indigo-950 px-2 py-0.5 rounded-full shadow-sm tracking-wider whitespace-nowrap">
                                        {appLanguage === "Hindi" ? "मुख्य विषय" : "Main Topic"}
                                      </div>
                                      <span className="block mt-0.5 tracking-wide">{a.name}</span>
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    {a.children?.map((t: any, s: number) => {
                                      const isExpanded = !!gt[`child-${s}`];
                                      const hasSubChildren = t.children && t.children.length > 0;
                                      return (
                                        <div key={s} className="bg-white rounded-2xl border border-indigo-50 shadow-xs overflow-hidden transition-all duration-300">
                                          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50/20 to-slate-50/35 border-b border-indigo-50/40">
                                            <div className="flex items-center space-x-2 flex-1 min-w-0 pr-1">
                                              <span className="flex items-center justify-center w-5 h-5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg shrink-0">
                                                {s + 1}
                                              </span>
                                              <span className="font-extrabold text-xs text-slate-800 leading-tight truncate">
                                                {t.name}
                                              </span>
                                            </div>
                                            <div className="flex items-center space-x-1.5 shrink-0">
                                              {hasSubChildren && (
                                                <button
                                                  onClick={() =>
                                                    ye((n) => ({
                                                      ...n,
                                                      [`child-${s}`]: !isExpanded
                                                    }))
                                                  }
                                                  className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition-all text-[9px] font-bold flex items-center gap-0.5"
                                                  title={isExpanded ? "Collapse" : "Expand"}
                                                >
                                                  <span className="uppercase text-[8px]">
                                                    {isExpanded
                                                      ? appLanguage === "Hindi"
                                                        ? "छिपाएं"
                                                        : "Hide"
                                                      : `${appLanguage === "Hindi" ? "देखें" : "Show"} (${t.children.length})`}
                                                  </span>
                                                  <ChevronRight
                                                    size={11}
                                                    className={`transform transition-transform ${isExpanded ? "rotate-90" : ""}`}
                                                  />
                                                </button>
                                              )}
                                              <button
                                                onClick={() => we(t.name)}
                                                className="px-2 py-0.5 text-indigo-600 hover:bg-indigo-50 border border-indigo-100 bg-indigo-50/20 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all"
                                              >
                                                💡 {appLanguage === "Hindi" ? "समझें" : "Explain"}
                                              </button>
                                              <button
                                                onClick={() => Q(t.name)}
                                                className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition-all"
                                                title="Speak text"
                                              >
                                                <Volume2 size={12} />
                                              </button>
                                            </div>
                                          </div>

                                          {isExpanded && hasSubChildren && (
                                            <div className="p-2.5 bg-slate-50/40 space-y-2 border-t border-slate-100/40">
                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {t.children.map((subNode: any, subIdx: number) => (
                                                  <div
                                                    key={subIdx}
                                                    className="bg-white border border-slate-150 p-2 rounded-xl shadow-2xs hover:border-indigo-100 transition-all flex items-center justify-between"
                                                  >
                                                    <div className="flex items-center space-x-1.5 flex-1 min-w-0 pr-1.5">
                                                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 animate-pulse" />
                                                      <span className="text-[10px] font-bold text-slate-700 truncate leading-tight">
                                                        {subNode.name}
                                                      </span>
                                                    </div>
                                                    <div className="flex items-center space-x-1 shrink-0">
                                                      <button
                                                        onClick={() => we(subNode.name)}
                                                        className="px-1.5 py-0.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-slate-500 rounded-lg text-[7px] font-black uppercase transition-all"
                                                        title="Explain this detail"
                                                      >
                                                        AI
                                                      </button>
                                                      <button
                                                        onClick={() => Q(subNode.name)}
                                                        className="p-0.5 text-slate-300 hover:text-indigo-600 transition-all"
                                                      >
                                                        <Volume2 size={10} />
                                                      </button>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3 font-mono text-[10px] bg-indigo-950 text-indigo-200 p-4 rounded-2xl shadow-inner">
                                  <span className="font-black text-xs text-white">🌳 Mind Map Tree Structure</span>
                                  <div className="space-y-1">
                                    <strong>{a.name}</strong>
                                    {a.children?.map((t: any, s: number) => (
                                      <div key={s} className="pl-4 border-l border-indigo-700/50 mt-1">
                                        <span>├── {t.name}</span>
                                        {t.children?.map((subNode: any, subIdx: number) => (
                                          <div key={subIdx} className="pl-6 text-indigo-400">
                                            ├── {subNode.name}
                                          </div>
                                        ))}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {h && (
                                <div className="mt-4 p-4 bg-gradient-to-br from-indigo-950 to-indigo-900 text-white rounded-3xl shadow-xl space-y-3 border border-indigo-800 animate-fadeIn relative overflow-hidden">
                                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
                                  <div className="flex justify-between items-center pb-2 border-b border-indigo-800/60">
                                    <div className="flex items-center space-x-1.5">
                                      <Sparkles className="w-4 h-4 text-yellow-300 stroke-[2] animate-bounce" />
                                      <span className="text-[9px] font-black uppercase tracking-wider text-indigo-300">
                                        {appLanguage === "Hindi" ? "एआई ट्यूटर स्पष्टीकरण" : "AI Tutor Explanation"}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => $(null)}
                                      className="text-indigo-400 hover:text-white p-1 rounded-lg transition-all"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>

                                  <div className="space-y-2">
                                    <h4 className="text-xs font-black text-white flex items-center gap-1.5">💡 {h.nodeName}</h4>
                                    {De ? (
                                      <div className="flex items-center space-x-2 py-3 text-indigo-300 text-[11px] font-bold">
                                        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
                                        <span>{appLanguage === "Hindi" ? "एआई ट्यूटर विचार कर रहा है..." : "AI Tutor is thinking..."}</span>
                                      </div>
                                    ) : (
                                      <p className="text-[11px] leading-relaxed text-indigo-100 font-medium">{h.explanation}</p>
                                    )}
                                  </div>

                                  {!De && h.explanation && (
                                    <div className="flex justify-between items-center pt-2 border-t border-indigo-800/40">
                                      <button
                                        onClick={() => Q(h.explanation)}
                                        className="px-3 py-1.5 bg-indigo-800 hover:bg-indigo-700 text-indigo-200 hover:text-white rounded-xl text-[10px] font-extrabold uppercase flex items-center gap-1.5 transition-all"
                                      >
                                        <Volume2 size={12} /> {appLanguage === "Hindi" ? "सुनें" : "Listen"}
                                      </button>
                                      <button
                                        onClick={() => kt(h.nodeName, h.explanation)}
                                        className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-indigo-950 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-yellow-500/10 active:scale-95"
                                      >
                                        <Plus size={12} strokeWidth={2.5} /> {appLanguage === "Hindi" ? "नोटबुक" : "Add to Note"}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="markdown-body text-xs font-sans leading-relaxed overflow-x-auto">
                              <ReactMarkdown 
                                remarkPlugins={[remarkMath]} 
                                rehypePlugins={[rehypeKatex]}
                                components={{
                                  code({ node, className, children, ...props }: any) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    const codeString = String(children).replace(/\n$/, '');
                                    const isMultiLine = String(children).includes('\n') || !!match;

                                    if (isMultiLine) {
                                      const lang = match ? match[1] : 'code';
                                      return (
                                        <div className="relative my-2.5 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 text-left">
                                          <div className="bg-slate-900/90 px-3 py-1.5 flex items-center justify-between text-[10px] text-slate-400 font-mono border-b border-slate-800">
                                            <span className="uppercase font-bold text-indigo-400">{lang}</span>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(codeString);
                                              }}
                                              className="hover:text-slate-100 transition font-sans text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded-md text-slate-300"
                                            >
                                              Copy Code
                                            </button>
                                          </div>
                                          <SyntaxHighlighter
                                            style={oneDark}
                                            language={lang === 'code' ? 'text' : lang}
                                            PreTag="div"
                                            customStyle={{ margin: 0, padding: '0.75rem', fontSize: '0.75rem', background: '#090d16' }}
                                            {...props}
                                          >
                                            {codeString}
                                          </SyntaxHighlighter>
                                        </div>
                                      );
                                    }

                                    return (
                                      <code className="bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded text-[11px] font-mono border border-slate-200 dark:border-slate-700/50" {...props}>
                                        {children}
                                      </code>
                                    );
                                  }
                                }}
                              >
                                {(() => {
                                  const raw = a.content || a.summary || a.explanation || a.paperText || a.text || safeJsonStringify(a);
                                  return typeof raw === 'string'
                                    ? raw.replace(/\\\[([\s\S]*?)\\\]/g, (_m, math) => `\n$$\n${math.trim()}\n$$\n`).replace(/\\\(([\s\S]*?)\\\)/g, (_m, math) => `$${math.trim()}$`)
                                    : String(raw || '');
                                })()}
                              </ReactMarkdown>
                            </div>
                          )}

                          {a.keyTerms && a.keyTerms.length > 0 && (
                            <div className="mt-4 space-y-2 border-t pt-3">
                              <span className="font-extrabold text-[11px] text-slate-800 block">📌 Key Term Cards Generated</span>
                              <div className="grid grid-cols-2 gap-2">
                                {a.keyTerms.map((t: any, s: number) => (
                                  <div key={s} className="p-2.5 bg-amber-50 border border-amber-100 rounded-xl">
                                    <strong className="text-amber-800 font-black block text-[10px]">{t.term}</strong>
                                    <p className="text-[9px] text-amber-700 mt-0.5 leading-tight">{t.definition}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-1 p-4">
                        <Cpu className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                        <span className="text-xs font-extrabold text-slate-600 block">Awaiting AI Task Execution</span>
                        <p className="text-[9px] text-slate-400 max-w-xs">
                          Run any parameters above to query Gemini models on physics, math, science, or biology details.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {j === "vocab_calc" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <BookOpen size={14} className="text-indigo-600" /> AI Vocabulary Builder
                        </h3>
                        <span className="text-[9px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg font-black uppercase">
                          {g.length} WORDS
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={y}
                          onChange={(t) => $t(t.target.value)}
                          placeholder="Type vocabulary word..."
                          className="flex-1 p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none"
                        />
                        <button
                          onClick={Gt}
                          disabled={ze}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                        >
                          {ze ? "Looking..." : "Search"}
                        </button>
                      </div>

                      {d && (
                        <div className="p-3 bg-white border border-indigo-100 rounded-2xl space-y-2 relative shadow-sm">
                          <div className="flex justify-between items-center">
                            <strong className="text-xs font-black text-indigo-900 uppercase tracking-tight">{d.word}</strong>
                            <span className="text-[9px] font-bold text-slate-400 italic">({d.partOfSpeech})</span>
                          </div>
                          <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
                            <strong>Def:</strong> {d.definition}
                          </p>
                          <p className="text-[10px] text-slate-500 italic leading-none">
                            <strong>Ex:</strong> "{d.example}"
                          </p>
                          <div className="flex justify-between items-center pt-1.5 border-t">
                            <span className="text-[9px] font-bold text-slate-400">
                              Synonyms: {d.synonyms?.join(", ")}
                            </span>
                            <button
                              onClick={Ht}
                              className="text-[9px] font-black text-emerald-600 border border-emerald-200 bg-emerald-50 px-2 py-1 rounded-lg hover:bg-emerald-100"
                            >
                              + Save to Deck
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {g.length > 0 && (
                      <div className="mt-4 border-t pt-3 space-y-2">
                        <span className="text-[9px] font-black uppercase text-slate-400 block">My Saved Deck</span>
                        <div className="flex gap-1.5 flex-wrap max-h-[100px] overflow-y-auto">
                          {g.map((t, s) => (
                            <span key={s} className="text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-1 rounded-lg">
                              {t.word}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 space-y-3">
                    <h3 className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Cpu size={14} className="text-cyan-600" /> Scientific Calculator
                    </h3>
                    <div className="bg-slate-900 p-3 rounded-2xl text-right text-white font-mono font-black text-lg select-none min-h-[48px] shadow-inner">
                      {Oe}
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
                      {[
                        "sin(", "cos(", "tan(", "DEL",
                        "log(", "ln(", "pi", "C",
                        "(", ")", "^", "/",
                        "7", "8", "9", "*",
                        "4", "5", "6", "-",
                        "1", "2", "3", "+",
                        "0", ".", "e", "="
                      ].map((t) => (
                        <button
                          key={t}
                          onClick={() => Ut(t)}
                          className={`py-2 rounded-lg font-black transition cursor-pointer ${
                            t === "="
                              ? "bg-cyan-600 text-white hover:bg-cyan-700 col-span-2"
                              : ["C", "DEL"].includes(t)
                              ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                              : "bg-white border border-slate-100 hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider">
                      📐 Math & Physics Formula Library
                    </h3>
                    <div className="relative w-48">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={_e}
                        onChange={(t) => At(t.target.value)}
                        placeholder="Search formula..."
                        className="w-full pl-8 pr-2 py-1.5 border border-slate-200 bg-white rounded-xl text-[10px] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {Mt.filter((t) => t.title.toLowerCase().includes(_e.toLowerCase())).map((t, s) => (
                      <div key={s} className="bg-white p-3 rounded-2xl border border-slate-100 space-y-1.5 shadow-xs hover:border-indigo-300 transition">
                        <span className="text-[8px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {t.subject}
                        </span>
                        <strong className="text-[10px] font-black text-slate-800 block">{t.title}</strong>
                        <div className="bg-slate-50 p-2 rounded-lg font-mono text-[10px] font-black text-indigo-900 border text-center">
                          {t.expr}
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold leading-tight mt-1">{t.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {j === "productivity" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <h3 className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider">🎯 Daily Study Goals</h3>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={se}
                          onChange={(t) => Le(t.target.value)}
                          placeholder="Add study target (e.g. solve trigonometry quiz)..."
                          className="flex-1 p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none"
                        />
                        <button onClick={qt} className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
                          +
                        </button>
                      </div>

                      <div className="space-y-2">
                        {D.map((t) => (
                          <div key={t.id} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-100 shadow-xs">
                            <button onClick={() => Bt(t.id)} className="flex items-center gap-2 text-left">
                              {t.completed ? (
                                <Check size={14} className="text-indigo-600" />
                              ) : (
                                <Circle size={14} className="text-slate-400" />
                              )}
                              <span className={`text-[11px] font-bold ${t.completed ? "line-through text-slate-400" : "text-slate-700"}`}>
                                {t.text}
                              </span>
                            </button>
                            <button
                              onClick={() => q((s) => s.filter((i) => i.id !== t.id))}
                              className="text-slate-300 hover:text-rose-600 p-0.5"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-100/50 p-3 rounded-2xl flex items-center justify-between">
                      <span className="text-[10px] text-indigo-900 font-bold">
                        Completion: {D.filter((t) => t.completed).length} / {D.length}
                      </span>
                      <span className="text-[9px] font-black uppercase text-indigo-700 bg-white border border-indigo-100 px-2 py-0.5 rounded-lg">
                        +15 XP local reward per goal
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 space-y-4">
                    <h3 className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider">⏳ Exam Countdown Timers</h3>
                    <div className="grid grid-cols-3 gap-1.5 items-end">
                      <div className="col-span-2">
                        <label className="block text-[8px] uppercase font-black text-slate-400 mb-1">Exam Title</label>
                        <input
                          type="text"
                          value={R.title}
                          onChange={(t) => le((s) => ({ ...s, title: t.target.value }))}
                          placeholder="e.g. Science Finals"
                          className="w-full p-2 border border-slate-200 bg-white rounded-xl text-[10px] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] uppercase font-black text-slate-400 mb-1">Date</label>
                        <input
                          type="date"
                          value={R.date}
                          onChange={(t) => le((s) => ({ ...s, date: t.target.value }))}
                          className="w-full p-2 border border-slate-200 bg-white rounded-xl text-[10px] outline-none"
                        />
                      </div>
                    </div>
                    <button onClick={Jt} className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase">
                      Add Exam Date
                    </button>

                    <div className="space-y-2 max-h-[120px] overflow-y-auto">
                      {z.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic">No exams added yet.</p>
                      ) : (
                        z.map((t) => (
                          <div key={t.id} className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-100 shadow-xs">
                            <div>
                              <span className="text-[8px] font-black uppercase bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded mr-1.5">
                                {t.subject}
                              </span>
                              <strong className="text-[10px] font-black text-slate-800">{t.title}</strong>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-black text-indigo-600">{Wt(t.date)}</span>
                              <button onClick={() => Qt(t.id)} className="text-slate-300 hover:text-rose-600 p-0.5">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 space-y-3">
                  <h3 className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider">📅 Spaced Revision Planner</h3>
                  <p className="text-[9px] text-slate-400 font-bold leading-none mb-2">
                    Active recall intervals automatically logged on note creation.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {notes.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic">No notes logged in your Notebook tab yet.</p>
                    ) : (
                      notes.map((t) => {
                        const spacer = F.find((i) => i.noteId === t.id);
                        return (
                          <div key={t.id} className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center justify-between shadow-xs">
                            <div>
                              <span className="text-[8px] font-black uppercase bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded mr-2">
                                {t.subject}
                              </span>
                              <strong className="text-[10px] font-black text-slate-800">{t.title}</strong>
                              <span className="block text-[8px] text-slate-400 mt-1">
                                Stage: {spacer ? spacer.stage + 1 : "Not Scheduled"} | Next review: {spacer ? spacer.nextDate : "Pending study"}
                              </span>
                            </div>
                            <button
                              onClick={() => es(t.id, t.title)}
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

            {j === "focus" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 flex flex-col justify-between">
                    <div className="space-y-3">
                      <h3 className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Users size={14} className="text-indigo-600" /> Buddy Study Circles
                      </h3>
                      <div className="space-y-2">
                        {V.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => Ft(t.id)}
                            className={`w-full p-2.5 bg-white rounded-2xl border flex items-center justify-between hover:border-indigo-200 transition text-left ${
                              w === t.id ? "border-indigo-600" : "border-slate-100"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🧑‍🎓</span>
                              <div>
                                <strong className="text-[11px] font-black text-slate-800 block">{t.name}</strong>
                                <span className="text-[8px] text-slate-400 font-bold">
                                  Level {Math.floor(t.xp / 100) + 1} | {t.xp} XP
                                </span>
                              </div>
                            </div>
                            <span
                              className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg ${
                                t.online ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              {t.online ? "ONLINE" : "OFFLINE"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {w && (
                      <div className="mt-4 border-t pt-3 space-y-2">
                        <span className="text-[9px] font-black uppercase text-slate-400 block">
                          Direct message with {V.find((t) => t.id === w)?.name}
                        </span>
                        <div className="bg-white p-2.5 rounded-2xl border max-h-[80px] overflow-y-auto space-y-1 text-[9px] font-medium leading-none text-slate-600 font-sans">
                          {V.find((t) => t.id === w)?.chat.map((t: string, s: number) => (
                            <div key={s} className={`p-1 rounded ${t.startsWith("Me") ? "bg-indigo-50/60" : "bg-slate-50"}`}>
                              {t}
                            </div>
                          )) || <span className="italic text-slate-400">Start a chat...</span>}
                        </div>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={oe}
                            onChange={(t) => Be(t.target.value)}
                            placeholder="Send materials..."
                            className="flex-1 p-2 border border-slate-200 rounded-xl text-[10px] bg-white outline-none"
                          />
                          <button onClick={Kt} className="px-3 bg-indigo-600 text-white rounded-xl text-[10px] font-bold">
                            Send
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 space-y-4">
                    <h3 className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Volume2 size={14} className="text-indigo-600" /> Focus Soundscapes & White Noise
                    </h3>
                    {Ge.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-2xl shadow-xs">
                        <span className="text-xs text-slate-700 font-extrabold">
                          {t.icon} {t.name}
                        </span>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={t.volume}
                            onChange={(s) => Je(t.id, parseInt(s.target.value))}
                            className="w-20 accent-indigo-600 cursor-pointer"
                          />
                          <button
                            onClick={() => Qe(t.id)}
                            className={`p-2 rounded-xl text-[10px] ${t.playing ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-600"}`}
                          >
                            {t.playing ? "PAUSE" : "PLAY"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider">
                      📝 AI Mock Test System
                    </h3>
                    {A && (
                      <span className="text-[10px] font-mono bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-xl font-black">
                        Time Left: {Math.floor(U / 60)}:{(U % 60).toString().padStart(2, "0")}
                      </span>
                    )}
                  </div>

                  {!A && !St ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                      <div>
                        <label className="block text-[8px] uppercase font-black text-slate-400 mb-1">Subject</label>
                        <select
                          value={quizSubject}
                          onChange={(t) => setQuizSubject(t.target.value)}
                          className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none"
                        >
                          {["Mathematics", "Science", "Biology", "Physics", "Chemistry", "English"].map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[8px] uppercase font-black text-slate-400 mb-1">Grade</label>
                        <select
                          value={Ce}
                          onChange={(t) => Vt(t.target.value)}
                          className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none"
                        >
                          {["8", "9", "10", "11", "12"].map((t) => (
                            <option key={t} value={t}>
                              Class {t}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={Lt}
                        disabled={Z}
                        className="py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wide cursor-pointer"
                      >
                        {Z ? "Generating questions..." : "Generate Hard Exam Test"}
                      </button>
                    </div>
                  ) : A ? (
                    <div className="space-y-4">
                      {v.map((qItem: any, idx: number) => (
                        <div key={idx} className="p-3 bg-white border rounded-2xl space-y-2 shadow-xs">
                          <span className="text-[9px] font-black uppercase text-indigo-600">Question {idx + 1}</span>
                          <p className="text-xs font-bold text-slate-800">{qItem.question}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {qItem.options.map((optionText: string, oIdx: number) => (
                              <button
                                key={oIdx}
                                onClick={() =>
                                  Ae((n) =>
                                    n.map((curr, cIdx) => (cIdx === idx ? oIdx : curr))
                                  )
                                }
                                className={`p-2 rounded-xl text-left font-semibold border transition ${
                                  ee[idx] === oIdx
                                    ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                                    : "bg-slate-50 border-slate-100 hover:bg-slate-100"
                                }`}
                              >
                                {optionText}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={Ye}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase"
                      >
                        Submit Test & Log Score
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-white border rounded-2xl text-center space-y-3">
                      <strong className="text-xs font-black text-indigo-900 uppercase">Grade report successfully processed!</strong>
                      <div className="flex justify-center gap-6 text-xs text-slate-600">
                        <span>Total Questions: {v.length}</span>
                        <span>Score: {v.filter((t: any, s: number) => ee[s] === t.answer).length} / {v.length}</span>
                      </div>
                      <button
                        onClick={() => te(false)}
                        className="px-6 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold uppercase"
                      >
                        Start New Test
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {j === "utilities" && (
              <div className="space-y-4">
                <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 space-y-4 text-center">
                  <span className="text-3xl">📂</span>
                  <h3 className="font-extrabold text-[12px] text-slate-800 uppercase tracking-wider">
                    Cloud Backup & Restore Manager
                  </h3>
                  <p className="text-[10px] text-slate-500 max-w-md mx-auto leading-relaxed">
                    Download complete client application databases - notes, schedule timers, goals, achievements, and buddy lists in an encrypted local backup file, or upload past configuration files to retrieve previous configurations.
                  </p>
                  <div className="flex gap-4 justify-center pt-2">
                    <button
                      onClick={Yt}
                      className="px-6 py-2.5 bg-indigo-600 text-white font-black text-xs uppercase rounded-xl shadow hover:bg-indigo-700 transition flex items-center gap-2"
                    >
                      <Cloud size={14} /> Export Backup File
                    </button>
                    <div className="relative">
                      <button className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-black text-xs uppercase rounded-xl hover:bg-slate-50 transition flex items-center gap-2">
                        <Upload size={14} /> Import Backup File
                      </button>
                      <input
                        type="file"
                        accept=".json"
                        onChange={Xt}
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
});

export default InteractiveToolkit;
