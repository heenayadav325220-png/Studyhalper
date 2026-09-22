import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  Upload,
  BookOpen,
  Sparkles,
  CheckCircle,
  Volume2,
  VolumeX,
  BookmarkPlus,
  RefreshCw,
  Award,
  Zap,
  FileCheck,
  X
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { UserProfile } from '../types';
import { playTutorSpeech } from '../services/voiceSettings';

interface PdfBookScannerProps {
  user?: UserProfile;
  appLanguage: string;
  onSaveToNotebook?: (title: string, content: string, tags?: string[]) => Promise<void>;
  onAddXp?: (amount: number) => void;
  onClose?: () => void;
}

interface ChapterAnalysisResult {
  chapterTitle: string;
  subject: string;
  executiveSummary: string;
  keyTakeaways: string[];
  keyFormulas: {
    name: string;
    formula: string;
    explanation: string;
  }[];
  quizQuestions: {
    questionText: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string;
  }[];
}

const SAMPLE_CHAPTERS = [
  {
    title: 'Physics: Laws of Motion & Friction',
    subject: 'Physics',
    icon: '⚡',
    text: `Newton's First Law: An object remains at rest or in uniform motion unless acted upon by an external net force. This is the law of inertia.
Newton's Second Law: The rate of change of momentum is directly proportional to the applied force. Formula: F = ma (Force = mass × acceleration), where unit is Newton (N) = kg·m/s².
Newton's Third Law: For every action, there is an equal and opposite reaction (F_AB = -F_BA). Forces always occur in pairs.
Frictional Force: Opposes relative motion between two contact surfaces. Static Friction: f_s ≤ μ_s × N. Kinetic Friction: f_k = μ_k × N (where μ is coefficient of friction and N is normal force).
Impulse: J = F × Δt = Δp (Change in momentum). Conservation of Linear Momentum states total momentum remains constant in isolated system.`
  },
  {
    title: 'Biology: Cell Cycle & Mitosis',
    subject: 'Biology',
    icon: '🧬',
    text: `Cell Cycle consists of Interphase (G1, S, G2 phases) and M Phase (Mitosis and Cytokinesis).
Interphase occupies ~95% of cycle duration. G1 Phase: Cell growth and organelle duplication. S Phase: DNA replication (DNA content doubles from 2C to 4C, chromosome number remains 2n). G2 Phase: Protein synthesis and preparation for division.
Mitosis (Equational Division) stages:
1. Prophase: Chromatin condenses into distinct chromosomes, nuclear envelope disintegrates, centrosomes move to opposite poles.
2. Metaphase: Chromosomes align along equatorial Metaphase Plate; spindle fibers attach to kinetochores.
3. Anaphase: Sister chromatids split at centromere and migrate to opposite poles.
4. Telophase: Nuclear envelopes re-form, nucleolus reappears, chromosomes decondense.
Cytokinesis: Division of cytoplasm resulting in two identical diploid daughter cells.`
  },
  {
    title: 'Chemistry: Chemical Bonding & Octet Rule',
    subject: 'Chemistry',
    icon: '🧪',
    text: `Chemical Bonding: Attractive force holding constituents (atoms, ions, molecules) together.
Octet Rule: Atoms combine by gaining, losing, or sharing electrons to achieve noble gas configuration (8 valence electrons).
Ionic Bond: Complete transfer of electrons from electropositive metal to electronegative non-metal (e.g., NaCl). High melting point and electrical conductivity in molten/aqueous state.
Covalent Bond: Mutual sharing of electron pairs (e.g., H2O, CH4). Can be single, double, or triple bonds.
Dipole Moment: μ = q × d (measured in Debye). Polar vs Non-polar molecules.
VSEPR Theory: Predicts molecular geometry based on electron pair repulsion around central atom (Linear, Trigonal Planar, Tetrahedral, Bent).
Hydrogen Bonding: Strong intermolecular dipole attraction when H is bonded to highly electronegative elements (F, O, N).`
  }
];

export const PdfBookScanner: React.FC<PdfBookScannerProps> = ({
  user: _user,
  appLanguage,
  onSaveToNotebook,
  onAddXp,
  onClose
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'pdf' | 'image' | 'text' | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'formulas' | 'quiz'>('summary');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<ChapterAnalysisResult | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isCopiedFormula, setIsCopiedFormula] = useState<string | null>(null);

  // Quiz Interactive State
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qIndex: number]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Read File and extract base64
  const handleFileSelection = (file: File) => {
    setSelectedFile(file);
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isImg = file.type.startsWith('image/');
    
    setFileType(isPdf ? 'pdf' : isImg ? 'image' : 'text');

    const reader = new FileReader();
    if (isPdf || isImg) {
      reader.readAsDataURL(file);
      reader.onload = () => {
        setFileBase64(reader.result as string);
      };
    } else {
      reader.readAsText(file);
      reader.onload = () => {
        setPastedText(reader.result as string);
        setFileBase64(null);
      };
    }
  };

  // Perform AI Chapter Analysis
  const handleScanAndAnalyze = async (customText?: string, customTitle?: string) => {
    const textToAnalyze = customText || pastedText;
    if (!fileBase64 && !textToAnalyze.trim()) {
      alert(appLanguage === 'hi' ? 'कृपया कोई PDF, फोटो या चैप्टर टेक्स्ट दर्ज करें!' : 'Please upload a PDF, image, or enter chapter text!');
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);

    try {
      const payload: any = {
        fileName: selectedFile ? selectedFile.name : (customTitle || 'Uploaded Chapter Material'),
        language: appLanguage
      };

      if (fileType === 'pdf' && fileBase64) {
        payload.pdfBase64 = fileBase64;
      } else if (fileType === 'image' && fileBase64) {
        payload.imageBase64 = fileBase64;
      }
      
      if (textToAnalyze.trim()) {
        payload.textContent = textToAnalyze.trim();
      }

      const res = await fetch('/api/pdf-scan-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to analyze document');
      }

      const data: ChapterAnalysisResult = await res.json();
      setAnalysisResult(data);
      if (onAddXp) onAddXp(30);
    } catch (err: any) {
      console.error('Scan analysis failed:', err);
      alert(appLanguage === 'hi' ? 'विश्लेषण में समस्या आई, कृपया पुनः प्रयास करें।' : 'Failed to scan and summarize. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load Preset Sample
  const handleLoadSample = (sample: typeof SAMPLE_CHAPTERS[0]) => {
    setPastedText(sample.text);
    setSelectedFile(null);
    setFileBase64(null);
    setFileType('text');
    handleScanAndAnalyze(sample.text, sample.title);
  };

  // Text-To-Speech Audio Narration
  const handleToggleAudio = () => {
    if (!analysisResult) return;

    if (isPlayingAudio) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
      return;
    }

    const cleanSpeech = `${analysisResult.chapterTitle}. ${analysisResult.executiveSummary}`;
    setIsPlayingAudio(true);

    playTutorSpeech(
      cleanSpeech,
      {},
      () => setIsPlayingAudio(true),
      () => setIsPlayingAudio(false),
      () => setIsPlayingAudio(false)
    );
  };

  // Quiz Handling
  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  const handleGradeQuiz = () => {
    if (!analysisResult) return;
    let score = 0;
    analysisResult.quizQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctOptionIndex) {
        score += 1;
      }
    });
    setQuizScore(score);
    setQuizSubmitted(true);
    if (onAddXp) {
      const earned = score * 10 + 10;
      onAddXp(earned);
    }
  };

  // Save to Notebook
  const handleSaveDoc = async () => {
    if (!analysisResult || !onSaveToNotebook) return;
    const docTitle = `📑 ${analysisResult.chapterTitle || 'Chapter Summary'}`;
    const docContent = `# ${analysisResult.chapterTitle}
**Subject**: ${analysisResult.subject}
**Date**: ${new Date().toLocaleDateString()}

${analysisResult.executiveSummary}

## 📌 Key Formulas & Theorems:
${analysisResult.keyFormulas.map(f => `### ${f.name}\n- **Formula**: \`${f.formula}\`\n- **Explanation**: ${f.explanation}`).join('\n\n')}

## 🧠 Key Takeaways:
${analysisResult.keyTakeaways.map(t => `- ${t}`).join('\n')}
`;
    await onSaveToNotebook(docTitle, docContent, [analysisResult.subject, 'PDF Scanner', 'Summary']);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Copy Formula
  const handleCopyFormula = (formulaText: string, name: string) => {
    navigator.clipboard.writeText(formulaText);
    setIsCopiedFormula(name);
    setTimeout(() => setIsCopiedFormula(null), 2000);
  };

  return (
    <div className="space-y-4 text-slate-100 animate-in fade-in duration-300">
      {/* HEADER BANNER */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#0d1633] via-[#111f4d] to-[#1c0f3d] border-2 border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.25)] relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg border border-indigo-400/40 shrink-0">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 uppercase">
                  {appLanguage === 'hi' ? 'पीडीएफ / बुक स्कैनर' : 'PDF & Book Scanner'}
                </span>
                <span className="text-xs text-amber-400 font-bold">+30 XP</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5 flex items-center gap-1.5">
                <span>{appLanguage === 'hi' ? 'चैप्टर सारांश व ऑटोमैटिक क्विज़' : 'Instant Chapter Summary & Quiz'}</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* UPLOAD & INPUT AREA */}
      {!analysisResult && (
        <div className="space-y-3">
          {/* DRAG & DROP / FILE SELECTION CARD */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileSelection(e.dataTransfer.files[0]);
              }
            }}
            className="border-2 border-dashed border-indigo-400/50 hover:border-indigo-400 bg-slate-900/80 hover:bg-indigo-950/40 rounded-3xl p-6 text-center cursor-pointer transition-all duration-200 group shadow-md"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,image/*,.txt"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelection(e.target.files[0]);
                }
              }}
            />

            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/30 group-hover:scale-105 flex items-center justify-center transition-all mb-3 border border-indigo-400/30 shadow-xs">
              <Upload className="w-7 h-7" />
            </div>

            {selectedFile ? (
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 rounded-full text-emerald-300 text-xs font-bold">
                  <FileCheck className="w-4 h-4" />
                  <span>{selectedFile.name}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Document'}
                </p>
              </div>
            ) : (
              <div>
                <h4 className="text-sm sm:text-base font-extrabold text-white">
                  {appLanguage === 'hi'
                    ? 'यहाँ अपनी चैप्टर PDF या बुक फोटो ड्रैग करें या चुनें'
                    : 'Upload Chapter PDF or Textbook Photo'}
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {appLanguage === 'hi'
                    ? 'PDF, PNG, JPG या टेक्स्ट फाइल अपलोड करें। AI तुरंत सारांश, फॉर्मूला व क्विज़ तैयार करेगा।'
                    : 'Supports PDF chapters, high-res book photos & notes. Instant AI summary & MCQs.'}
                </p>
              </div>
            )}
          </div>

          {/* OR PASTE TEXT DIRECTLY */}
          <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                {appLanguage === 'hi' ? 'या चैप्टर का टेक्स्ट सीधे पेस्ट करें' : 'Or Paste Chapter Notes / Content Directly'}
              </span>
              {pastedText && (
                <button
                  onClick={() => setPastedText('')}
                  className="text-pink-400 hover:text-pink-300 text-[10px]"
                >
                  {appLanguage === 'hi' ? 'साफ़ करें' : 'Clear'}
                </button>
              )}
            </div>
            <textarea
              rows={3}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder={
                appLanguage === 'hi'
                  ? 'यहाँ नोट्स, थ्योरी या चैप्टर का भाग पेस्ट करें...'
                  : 'Paste your textbook chapter paragraphs or theory notes here...'
              }
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none"
            />
          </div>

          {/* QUICK DEMO PRESETS */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {appLanguage === 'hi' ? '⚡ 1-क्लिक टेस्ट चैप्टर:' : '⚡ 1-Click Test Chapters:'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {SAMPLE_CHAPTERS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleLoadSample(sample)}
                  className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-indigo-950/70 border border-slate-800 hover:border-indigo-500/50 text-left transition cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{sample.icon}</span>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-slate-200 group-hover:text-white truncate">
                        {sample.title}
                      </div>
                      <div className="text-[9px] text-slate-400">{sample.subject}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* SCAN ACTION BUTTON */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading || (!fileBase64 && !pastedText.trim())}
            onClick={() => handleScanAndAnalyze()}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{appLanguage === 'hi' ? 'चैप्टर स्कैन व विश्लेषण हो रहा है...' : 'Analyzing Chapter Content & Generating Quiz...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{appLanguage === 'hi' ? 'स्कैन करें व क्विज़ बनाएँ (+30 XP)' : 'Scan, Summarize & Generate Quiz (+30 XP)'}</span>
              </>
            )}
          </motion.button>
        </div>
      )}

      {/* ANALYSIS RESULT INTERFACE */}
      {analysisResult && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* TOP SUMMARY HEADER & ACTIONS */}
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-indigo-500/40 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full text-[10px] font-extrabold uppercase">
                  {analysisResult.subject || 'General'}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {appLanguage === 'hi' ? 'सफलतापूर्वक विश्लेषित' : 'Analysis Complete'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-1">
                {analysisResult.chapterTitle}
              </h3>
            </div>

            {/* ACTION BUTTONS (AUDIO, SAVE, RESET) */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {/* AUDIO READOUT */}
              <button
                onClick={handleToggleAudio}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  isPlayingAudio
                    ? 'bg-rose-600 border-rose-400 text-white animate-pulse'
                    : 'bg-indigo-600/30 hover:bg-indigo-600/50 border-indigo-400/40 text-indigo-200'
                }`}
                title="Listen to summary"
              >
                {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>{isPlayingAudio ? (appLanguage === 'hi' ? 'रोकें' : 'Stop') : (appLanguage === 'hi' ? 'सुनें' : 'Listen')}</span>
              </button>

              {/* SAVE TO NOTEBOOK */}
              {onSaveToNotebook && (
                <button
                  onClick={handleSaveDoc}
                  disabled={saveSuccess}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    saveSuccess
                      ? 'bg-emerald-600 border-emerald-400 text-white'
                      : 'bg-white/10 hover:bg-white/20 border-white/20 text-slate-200'
                  }`}
                >
                  <BookmarkPlus className="w-4 h-4" />
                  <span>{saveSuccess ? (appLanguage === 'hi' ? 'सेव हो गया!' : 'Saved!') : (appLanguage === 'hi' ? 'नोटबुक में सेव' : 'Save Note')}</span>
                </button>
              )}

              {/* NEW SCAN */}
              <button
                onClick={() => {
                  setAnalysisResult(null);
                  setSelectedFile(null);
                  setFileBase64(null);
                  setPastedText('');
                  window.speechSynthesis.cancel();
                  setIsPlayingAudio(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{appLanguage === 'hi' ? 'नया स्कैन' : 'New Scan'}</span>
              </button>
            </div>
          </div>

          {/* SUB-TABS: SUMMARY, FORMULAS, QUIZ */}
          <div className="flex rounded-2xl bg-slate-900/90 border border-slate-800 p-1">
            {[
              { id: 'summary', label: appLanguage === 'hi' ? '📖 सारांश व कॉन्सेप्ट' : '📖 Executive Summary', badge: 'Key Notes' },
              { id: 'formulas', label: appLanguage === 'hi' ? '📐 मुख्य सूत्र व नियम' : '📐 Formula Vault', count: analysisResult.keyFormulas?.length || 0 },
              { id: 'quiz', label: appLanguage === 'hi' ? '🎯 चैप्टर क्विज़' : '🎯 Chapter Quiz', count: analysisResult.quizQuestions?.length || 5, highlight: true }
            ].map((tab) => {
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`flex-1 py-2 px-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* VIEW 1: EXECUTIVE SUMMARY */}
          {activeSubTab === 'summary' && (
            <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 text-slate-200">
              <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed">
                <ReactMarkdown>{analysisResult.executiveSummary}</ReactMarkdown>
              </div>

              {/* KEY TAKEAWAYS BULLET CARDS */}
              {analysisResult.keyTakeaways && analysisResult.keyTakeaways.length > 0 && (
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>{appLanguage === 'hi' ? 'मुख्य निष्कर्ष (High-Yield Takeaways)' : 'High-Yield Takeaways'}</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {analysisResult.keyTakeaways.map((takeaway, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{takeaway}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: FORMULA & EQUATION VAULT */}
          {activeSubTab === 'formulas' && (
            <div className="space-y-3">
              {analysisResult.keyFormulas && analysisResult.keyFormulas.length > 0 ? (
                analysisResult.keyFormulas.map((f, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 transition space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-300 uppercase tracking-wide flex items-center gap-1.5">
                        <span>📐</span>
                        <span>{f.name}</span>
                      </span>
                      <button
                        onClick={() => handleCopyFormula(f.formula, f.name)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        {isCopiedFormula === f.name ? '✓ Copied!' : 'Copy Formula'}
                      </button>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl font-mono text-xs sm:text-sm text-emerald-300 font-bold overflow-x-auto">
                      {f.formula}
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">{f.explanation}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs">
                  {appLanguage === 'hi' ? 'इस चैप्टर में कोई विशिष्ट फॉर्मूला नहीं मिला।' : 'No explicit formulas found in this chapter.'}
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: CHAPTER QUIZ */}
          {activeSubTab === 'quiz' && (
            <div className="space-y-4">
              {/* QUIZ SCORE BAR (IF SUBMITTED) */}
              {quizSubmitted && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border-2 border-emerald-500/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-emerald-300 uppercase">
                        {appLanguage === 'hi' ? 'क्विज़ पूरा हुआ!' : 'Quiz Completed!'}
                      </div>
                      <div className="text-base font-extrabold text-white">
                        {appLanguage === 'hi' ? 'आपका स्कोर:' : 'Your Score:'} {quizScore} / {analysisResult.quizQuestions.length} ({Math.round((quizScore / analysisResult.quizQuestions.length) * 100)}%)
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-400/40 rounded-full text-xs font-black">
                      +{quizScore * 10 + 10} XP Earned!
                    </span>
                  </div>
                </div>
              )}

              {/* QUESTIONS LIST */}
              {analysisResult.quizQuestions.map((q, qIdx) => {
                const selectedOpt = selectedAnswers[qIdx];

                return (
                  <div
                    key={qIdx}
                    className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-black text-white leading-snug">
                        Q{qIdx + 1}. {q.questionText}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => {
                        const isThisSelected = selectedOpt === optIdx;
                        const isThisCorrect = q.correctOptionIndex === optIdx;

                        let btnClasses = 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-indigo-500/50';

                        if (quizSubmitted) {
                          if (isThisCorrect) {
                            btnClasses = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold';
                          } else if (isThisSelected && !isThisCorrect) {
                            btnClasses = 'bg-rose-950/80 border-rose-500 text-rose-200 line-through';
                          }
                        } else if (isThisSelected) {
                          btnClasses = 'bg-indigo-950 border-indigo-400 text-white font-bold shadow-xs';
                        }

                        return (
                          <button
                            key={optIdx}
                            disabled={quizSubmitted}
                            onClick={() => handleSelectOption(qIdx, optIdx)}
                            className={`p-2.5 rounded-xl border text-xs text-left transition cursor-pointer flex items-center justify-between ${btnClasses}`}
                          >
                            <span>{opt}</span>
                            {quizSubmitted && isThisCorrect && (
                              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* EXPLANATION BOX */}
                    {quizSubmitted && (
                      <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] text-slate-300 space-y-0.5">
                        <span className="font-bold text-amber-300">💡 Explanation:</span>
                        <p>{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* GRADE BUTTON */}
              {!quizSubmitted && (
                <button
                  onClick={handleGradeQuiz}
                  disabled={Object.keys(selectedAnswers).length < analysisResult.quizQuestions.length}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition cursor-pointer flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {Object.keys(selectedAnswers).length < analysisResult.quizQuestions.length
                      ? `${appLanguage === 'hi' ? 'सभी प्रश्नों का उत्तर दें' : 'Answer all questions'} (${Object.keys(selectedAnswers).length}/${analysisResult.quizQuestions.length})`
                      : (appLanguage === 'hi' ? 'उत्तर जमा करें व परिणाम देखें (+XP)' : 'Submit Quiz & Check Score (+XP)')}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
