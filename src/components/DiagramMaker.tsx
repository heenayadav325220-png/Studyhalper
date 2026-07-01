import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Paintbrush, 
  Download, 
  Trash2, 
  Save, 
  BookOpen, 
  Sparkles, 
  Eye, 
  EyeOff, 
  LayoutGrid, 
  RefreshCw, 
  FileText,
  Loader2,
  Check,
  ChevronRight,
  Clock,
  PlusCircle,
  FileImage,
  Layers,
  Sparkle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { saveUserDiagram, getUserDiagrams, deleteUserDiagram } from '../services/firebaseDb';
import { AppLanguage, translate } from '../services/translations';
import { User as UserType } from '../types';

interface Props {
  user?: UserType | null;
  language: AppLanguage;
  isTagMode: boolean;
  backgroundDiagram?: {
    status: 'idle' | 'generating' | 'success' | 'error';
    prompt: string;
    title: string;
    subject: string;
    style: string;
    practiceMode: boolean;
    imageUrl: string | null;
    explanation: string;
    step: string;
    error: string | null;
  };
  setBackgroundDiagram?: React.Dispatch<React.SetStateAction<any>>;
  onGenerateDiagram?: (prompt: string, title: string, subject: string, style: string, practiceMode: boolean) => Promise<void>;
}

interface SavedDiagram {
  id: string;
  title: string;
  prompt: string;
  imageUrl: string;
  explanation: string;
  subject: string;
  created_at: string;
}

const PRESETS = [
  { title: "Water Cycle Diagram", prompt: "A detailed scientific diagram of the Water Cycle showing Evaporation, Condensation, Precipitation, and Runoff.", subject: "Geography" },
  { title: "Plant Cell Structure", prompt: "A neat textbook plant cell diagram detailing Cell Wall, Cell Membrane, Nucleus, Chloroplasts, and Vacuole.", subject: "Biology" },
  { title: "Carbon Cycle Diagram", prompt: "An educational biogeochemical carbon cycle cycle flowchart illustrating photosynthesis, respiration, decomposition, and combustion.", subject: "Science" },
  { title: "Ohm's Law Circuit", prompt: "A physics schematic circuit diagram for Ohm's Law experiment containing an ammeter, voltmeter, resistor, battery, and switch.", subject: "Physics" },
  { title: "Structure of an Atom", prompt: "A Bohr model atom structure diagram of Carbon-12 depicting electrons, protons, neutrons, and nucleus shell paths.", subject: "Chemistry" }
];

const STYLES = [
  { id: "textbook", name: "Textbook Illustration", promptSuffix: "Clear, colored, clean textbook illustration style with professional academic labels." },
  { id: "blueprint", name: "Modern Blueprint", promptSuffix: "Clean white lines and blue grid blueprint schematic style, neat architectural labels." },
  { id: "chalkboard", name: "Chalkboard Sketch", promptSuffix: "Hand-drawn chalk sketch style on a dusty green classroom blackboard background." },
  { id: "pencil", name: "Pencil Drawing", promptSuffix: "Detailed black and white graphite pencil sketch drawing style, neat hand-written annotations." },
  { id: "infographic", name: "Colorful Infographic", promptSuffix: "Minimalist, high-contrast, modern colorful infographic vectors with bold typography pointers." }
];

export function DiagramMaker({ 
  user, 
  language, 
  isTagMode,
  backgroundDiagram,
  setBackgroundDiagram,
  onGenerateDiagram
}: Props) {
  // Navigation: 'create' | 'canvas' | 'history'
  const [subTab, setSubTab] = useState<'create' | 'canvas' | 'history'>('create');

  // local backup state if global background parent state is missing
  const [localPrompt, setLocalPrompt] = useState('');
  const [localTitle, setLocalTitle] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('textbook');
  const [selectedSubject, setSelectedSubject] = useState('Science');
  const [practiceMode, setPracticeMode] = useState(false);

  // Active diagram display state
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [explanation, setExplanation] = useState('');
  const [activeDiagramTitle, setActiveDiagramTitle] = useState('');
  const [activeSubject, setActiveSubject] = useState('Science');
  const [activeDiagramId, setActiveDiagramId] = useState<string | null>(null);

  // Saved list of diagrams
  const [savedDiagrams, setSavedDiagrams] = useState<SavedDiagram[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);

  // Use either global state or local state for generation state representation
  const isGenerating = backgroundDiagram ? backgroundDiagram.status === 'generating' : false;
  const currentStep = backgroundDiagram ? backgroundDiagram.step : '';
  const currentError = backgroundDiagram ? backgroundDiagram.error : null;

  // Sync saved diagrams
  useEffect(() => {
    if (user?.id) {
      loadSavedDiagrams();
    }
  }, [user?.id]);

  // Handle successful generation transition
  useEffect(() => {
    if (backgroundDiagram && backgroundDiagram.status === 'success' && backgroundDiagram.imageUrl) {
      setImageUrl(backgroundDiagram.imageUrl);
      setExplanation(backgroundDiagram.explanation);
      setActiveDiagramTitle(backgroundDiagram.title);
      setActiveSubject(backgroundDiagram.subject);
      setSubTab('canvas');
      // Load saved list to show new diagram
      loadSavedDiagrams();
    }
  }, [backgroundDiagram?.status, backgroundDiagram?.imageUrl]);

  const loadSavedDiagrams = async () => {
    if (!user?.id) return;
    setFetchLoading(true);
    try {
      const diagrams = await getUserDiagrams(user.id);
      setSavedDiagrams(diagrams);
    } catch (err) {
      console.warn("Failed to load saved diagrams:", err);
    } finally {
      setFetchLoading(false);
    }
  };

  const handlePresetClick = (preset: typeof PRESETS[0]) => {
    setLocalPrompt(preset.prompt);
    setLocalTitle(preset.title);
    setSelectedSubject(preset.subject);
  };

  const handleStartGeneration = async () => {
    if (!localPrompt.trim()) return;

    if (onGenerateDiagram) {
      // Use parent's background generation pipeline
      await onGenerateDiagram(
        localPrompt,
        localTitle || localPrompt.substring(0, 30),
        selectedSubject,
        selectedStyle,
        practiceMode
      );
    } else {
      alert("Background generation pipeline not initialized. Check your network configuration.");
    }
  };

  const handleSaveToProfile = async () => {
    if (!user?.id || !imageUrl) return;
    try {
      const diagramData = {
        title: activeDiagramTitle || localTitle || "Study Diagram",
        prompt: backgroundDiagram?.prompt || localPrompt,
        imageUrl: imageUrl,
        explanation: explanation,
        subject: activeSubject,
      };
      const savedId = await saveUserDiagram(user.id, diagramData);
      setActiveDiagramId(savedId);
      setSaveSuccess(true);
      loadSavedDiagrams();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving diagram:", err);
    }
  };

  const handleDelete = async (diagramId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id) return;
    if (confirm("Are you sure you want to delete this study diagram from your vault?")) {
      try {
        await deleteUserDiagram(user.id, diagramId);
        if (activeDiagramId === diagramId) {
          setActiveDiagramId(null);
          setImageUrl(null);
          setExplanation('');
        }
        loadSavedDiagrams();
      } catch (err) {
        console.error("Error deleting diagram:", err);
      }
    }
  };

  const svgToPng = (svgUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 600;
          canvas.height = 450;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, 600, 450);
            ctx.drawImage(img, 0, 0, 600, 450);
            resolve(canvas.toDataURL("image/png"));
          } else {
            resolve(svgUrl);
          }
        } catch (e) {
          console.warn("Canvas conversion error", e);
          resolve(svgUrl);
        }
      };
      img.onerror = (e) => reject(e);
      img.src = svgUrl;
    });
  };

  const handleDownloadImage = () => {
    if (!imageUrl) return;
    const isSvg = imageUrl.startsWith("data:image/svg+xml");
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${(activeDiagramTitle || 'diagram').replace(/\s+/g, '_').toLowerCase()}.${isSvg ? 'svg' : 'png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
    if (!imageUrl) return;
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Header Banner background
      doc.setFillColor(79, 70, 229); // Indigo 600
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.text("ASCEND STUDY • DIAGRAM LAB", 15, 20);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Subject: ${activeSubject} | Student: ${user?.name || "Self-Study"}`, 15, 28);
      doc.text(`Generated with Diagram AI`, 15, 33);

      // Title on A4
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(activeDiagramTitle || "Study Diagram", 15, 52);

      // Convert SVG to PNG if necessary for jsPDF embedding
      let finalImgUrl = imageUrl;
      if (imageUrl.startsWith("data:image/svg+xml")) {
        try {
          finalImgUrl = await svgToPng(imageUrl);
        } catch (svgErr) {
          console.error("Failed to convert SVG to PNG for PDF export:", svgErr);
        }
      }

      // Add diagram picture
      try {
        doc.addImage(finalImgUrl, 'PNG', 15, 60, 180, 100);
      } catch (e) {
        doc.setFontSize(10);
        doc.setTextColor(239, 68, 68);
        doc.text("[Diagram Image Render Placeholder]", 15, 80);
      }

      // Notes Header
      doc.setTextColor(30, 41, 59);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.text("Academic Study Notes", 15, 172);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105); // Slate-600
      
      const cleanText = explanation
        .replace(/###/g, '')
        .replace(/\*\*/g, '')
        .replace(/📌/g, '•')
        .replace(/✏️/g, '•')
        .replace(/❓/g, '?')
        .trim();

      const splitText = doc.splitTextToSize(cleanText, 180);
      doc.text(splitText, 15, 180);

      doc.save(`${(activeDiagramTitle || 'diagram').replace(/\s+/g, '_').toLowerCase()}_study_guide.pdf`);
    } catch (pdfErr) {
      console.error("PDF Export error:", pdfErr);
      alert("Failed to compile PDF. You can still download the image directly!");
    }
  };

  const handleSelectSaved = (diag: SavedDiagram) => {
    setImageUrl(diag.imageUrl);
    setExplanation(diag.explanation);
    setActiveDiagramTitle(diag.title);
    setLocalPrompt(diag.prompt);
    setActiveSubject(diag.subject);
    setActiveDiagramId(diag.id);
    setSubTab('canvas');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50" id="diagram_lab_workspace">
      {/* Primary Standalone Header Sub-Tabs */}
      <div className="bg-white border-b border-slate-150 py-3.5 px-4 shrink-0 flex flex-col space-y-3 shadow-xs">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Paintbrush className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-950 tracking-tight leading-none flex items-center gap-1.5">
                <span>Diagram Lab</span>
                <span className="bg-indigo-100 text-indigo-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md animate-pulse">Standalone</span>
              </h2>
              <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide mt-0.5">Illustrate & study textbook-grade labeled graphics</p>
            </div>
          </div>
          <span className="text-[9px] font-mono font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg uppercase">
            Gemini Pro
          </span>
        </div>

        {/* Dashboard Sub-Tabs switcher */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setSubTab('create')}
            className={`py-2 text-[10px] uppercase font-black rounded-lg transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer ${subTab === 'create' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create</span>
          </button>
          
          <button 
            onClick={() => {
              if (!imageUrl) {
                alert("Please generate or select a diagram from the Vault first.");
                return;
              }
              setSubTab('canvas');
            }}
            className={`py-2 text-[10px] uppercase font-black rounded-lg transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer ${subTab === 'canvas' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'} ${!imageUrl ? 'opacity-40' : ''}`}
          >
            <FileImage className="w-3.5 h-3.5" />
            <span>Active Canvas</span>
          </button>
          
          <button 
            onClick={() => {
              loadSavedDiagrams();
              setSubTab('history');
            }}
            className={`py-2 text-[10px] uppercase font-black rounded-lg transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer ${subTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Vault ({savedDiagrams.length})</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body Section */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
        
        {/* TAB 1: CREATE VIEW */}
        {subTab === 'create' && (
          <div className="space-y-4 max-w-md mx-auto animate-fadeIn pb-8">
            
            {/* Generating Loading State card */}
            {isGenerating && (
              <div className="bg-indigo-600 text-white p-5 rounded-3xl shadow-lg space-y-4 relative overflow-hidden border border-indigo-500 animate-pulse">
                {/* background graphic sparkles */}
                <div className="absolute top-2 right-2 opacity-15">
                  <Sparkle className="w-16 h-16 animate-spin" style={{ animationDuration: '8s' }} />
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-white/10 rounded-2xl shrink-0">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-black uppercase tracking-wider text-indigo-150">Active Background Rendering</h3>
                    <p className="text-sm font-extrabold truncate mt-0.5">{localTitle || "Drafting Custom Blueprint"}</p>
                    <p className="text-[10px] text-white/80 mt-1 font-bold italic">"{currentStep || 'Initializing design coordinate maps...'}"</p>
                  </div>
                </div>
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all duration-300 w-2/3" />
                </div>
                <p className="text-[9px] text-indigo-200 leading-normal font-semibold">You can safely browse other tabs or log out. The illustration will keep compiling in the server background and save automatically to your diagrams Vault!</p>
              </div>
            )}

            {/* Main Form Fields wrapper */}
            {!isGenerating && (
              <div className={`p-4 rounded-3xl border shadow-xs space-y-4 bg-white border-slate-150/70`}>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Paintbrush className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Illustrate Blueprint Setup</span>
                </h3>

                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Diagram Header Title</label>
                  <input 
                    type="text"
                    value={localTitle}
                    onChange={(e) => setLocalTitle(e.target.value)}
                    placeholder="e.g., Structure of Human Eye"
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 focus:ring-2 focus:ring-indigo-300 bg-slate-50/50 text-slate-800 outline-none transition"
                  />
                </div>

                {/* Describe Field */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">What structure should it describe?</label>
                  <textarea
                    value={localPrompt}
                    onChange={(e) => setLocalPrompt(e.target.value)}
                    placeholder="Provide a topic (e.g. chloroplast biology, earth volcanic vents, resistor circuit layouts) and Gemini will compile a textbook vector image."
                    className="w-full p-3 rounded-xl text-xs border border-slate-200 focus:ring-2 focus:ring-indigo-300 bg-slate-50/50 text-slate-800 outline-none transition"
                    rows={3}
                  />
                </div>

                {/* Subject & Style Grid */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Category</label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl text-xs border border-slate-200 bg-slate-50/50 text-slate-800 outline-none cursor-pointer"
                    >
                      <option value="Science">Science</option>
                      <option value="Biology">Biology</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Geography">Geography</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="History">History</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Visual Style</label>
                    <select
                      value={selectedStyle}
                      onChange={(e) => setSelectedStyle(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl text-xs border border-slate-200 bg-slate-50/50 text-slate-800 outline-none cursor-pointer"
                    >
                      {STYLES.map(st => (
                        <option key={st.id} value={st.id}>{st.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Exam practice mode toggle */}
                <div className="flex items-center justify-between p-2.5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/40">
                  <div className="pr-2">
                    <p className="text-[10px] font-black text-slate-800 flex items-center gap-1 leading-none">
                      <span>✏️</span>
                      <span>Exam Practice Mode</span>
                    </p>
                    <p className="text-[8px] text-slate-400 font-bold mt-0.5 leading-tight">Produce numbered circles pointing to parts instead of direct labels for self-testing</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPracticeMode(!practiceMode)}
                    className={`p-1 rounded-full w-9 shrink-0 transition duration-150 relative flex items-center cursor-pointer ${practiceMode ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'}`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-white shadow-sm inline-block" />
                  </button>
                </div>

                <button
                  onClick={handleStartGeneration}
                  disabled={isGenerating || !localPrompt.trim()}
                  className="w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Compile Study Diagram</span>
                </button>
              </div>
            )}

            {/* Classroom Presets */}
            <div className="p-4 rounded-3xl bg-white border border-slate-150/70 space-y-3">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <span>💡</span>
                <span>Recommended Classroom Topics</span>
              </h4>
              <div className="flex flex-col space-y-1.5">
                {PRESETS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handlePresetClick(p)}
                    className="p-2.5 bg-slate-50 hover:bg-indigo-50/40 border border-slate-100 rounded-2xl text-[10px] font-extrabold text-slate-700 hover:text-indigo-950 text-left transition active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    <span className="text-xs bg-white p-1 rounded-lg border border-slate-100">
                      {p.subject === 'Biology' && '🧬'}
                      {p.subject === 'Geography' && '🌍'}
                      {p.subject === 'Physics' && '⚡'}
                      {p.subject === 'Chemistry' && '🧪'}
                      {p.subject === 'Science' && '🔬'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-[10px] truncate leading-none text-slate-800">{p.title}</p>
                      <p className="text-[8px] text-slate-400 font-bold truncate mt-0.5">{p.prompt}</p>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVE CANVAS (ACTUAL SIZE TEXTBOOK DIAGRAM VIEW) */}
        {subTab === 'canvas' && imageUrl && (
          <div className="space-y-4 max-w-lg mx-auto animate-fadeIn pb-12">
            
            {/* Image display in ACTUAL SIZE */}
            <div className="bg-white border border-slate-150 rounded-3xl shadow-sm overflow-hidden flex flex-col">
              
              {/* Controls bar above Canvas */}
              <div className="bg-slate-50 px-3 py-2 border-b border-slate-150 flex justify-between items-center text-xs shrink-0 select-none">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-extrabold text-[10px] text-slate-800 truncate max-w-[150px]">{activeDiagramTitle}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleSaveToProfile}
                    className={`p-1 px-2 rounded-lg border transition text-[8px] font-black uppercase flex items-center gap-1 cursor-pointer ${saveSuccess ? 'bg-emerald-50 border-emerald-300 text-emerald-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                  >
                    {saveSuccess ? <Check className="w-2.5 h-2.5" /> : <Save className="w-2.5 h-2.5" />}
                    <span>{saveSuccess ? "Saved" : "Save Vault"}</span>
                  </button>
                  <button
                    onClick={handleDownloadImage}
                    className="p-1 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-[8px] font-black uppercase flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-2.5 h-2.5" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="p-1 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-[8px] font-black uppercase flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-2.5 h-2.5" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>

              {/* The Actual Canvas (No forced squish, complete illustration displayed) */}
              <div className="p-4 bg-slate-900 flex flex-col items-center justify-center relative min-h-[300px]">
                <img 
                  src={imageUrl} 
                  alt={activeDiagramTitle || "Study Diagram"} 
                  className="w-full h-auto object-contain select-none max-w-full rounded-xl shadow-lg"
                  referrerPolicy="no-referrer"
                />
                
                {/* Standalone Watermark at the bottom of the diagram */}
                <div className="w-full text-center mt-3 border-t border-white/10 pt-2 shrink-0 select-none">
                  <p className="text-[7.5px] font-black tracking-widest text-slate-500 uppercase leading-none">
                    🛡️ ASCEND STUDY • Textbook-Grade AI Diagram Lab
                  </p>
                </div>

                {practiceMode && (
                  <div className="absolute top-2 left-2 bg-indigo-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded shadow flex items-center gap-1">
                    <EyeOff className="w-2.5 h-2.5" />
                    <span>Practice Mode (Unlabeled)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Study Note Explanation Panel */}
            {explanation && (
              <div className="p-4 rounded-3xl bg-white border border-slate-150/70 space-y-3.5 shadow-sm">
                <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Academic Study Guide & Review</span>
                </h4>
                <div className="text-xs text-slate-700 leading-relaxed space-y-4 whitespace-pre-wrap font-medium">
                  {explanation}
                </div>
                
                {/* Subtle Study Watermark at bottom */}
                <p className="text-[8px] text-center text-slate-350 uppercase font-black tracking-widest pt-4 border-t border-slate-50 select-none">
                  compiled study notes • copyright ascend study
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DIAGRAMS VAULT / HISTORY */}
        {subTab === 'history' && (
          <div className="space-y-4 max-w-md mx-auto animate-fadeIn pb-12">
            
            {/* Total Count Header */}
            <div className="bg-white border border-slate-150 rounded-2xl p-4 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800">Total Created Diagrams</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Academic Library Size</p>
                </div>
              </div>
              <span className="text-lg font-black text-indigo-600 bg-indigo-50 px-3.5 py-1 rounded-xl">
                {savedDiagrams.length}
              </span>
            </div>

            {/* Vault listings */}
            {fetchLoading ? (
              <div className="py-12 text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Syncing cloud diagram index...</p>
              </div>
            ) : savedDiagrams.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-slate-150 rounded-3xl bg-white space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 text-xl mx-auto shadow-inner">🎨</div>
                <div className="max-w-xs mx-auto space-y-1 px-4">
                  <p className="text-xs font-black text-slate-700">No Diagrams Saved Yet</p>
                  <p className="text-[9px] text-slate-400 font-bold leading-normal">Generate your first premium study illustration and hit "Save Vault" to begin constructing your private academic portfolio.</p>
                </div>
                <button
                  onClick={() => setSubTab('create')}
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow hover:bg-indigo-700 transition"
                >
                  Create Diagram
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {savedDiagrams.map((diag) => (
                  <div
                    key={diag.id}
                    onClick={() => handleSelectSaved(diag)}
                    className="group bg-white border border-slate-150/70 rounded-3xl p-3 flex gap-3 cursor-pointer hover:shadow-md hover:border-indigo-400 transition duration-150"
                  >
                    {/* Thumbnail representation */}
                    <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center relative shrink-0">
                      <img 
                        src={diag.imageUrl} 
                        alt={diag.title} 
                        className="object-cover w-full h-full transition group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-1 left-1 text-[7px] font-black uppercase bg-indigo-600 text-white px-1 py-0.5 rounded leading-none">
                        {diag.subject}
                      </span>
                    </div>

                    {/* Metadata details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <h4 className="text-[11px] font-extrabold text-slate-900 group-hover:text-indigo-600 truncate leading-snug">
                          {diag.title}
                        </h4>
                        <p className="text-[8px] text-slate-450 font-bold truncate mt-0.5">
                          Prompt: {diag.prompt}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-slate-50 pt-1.5 mt-1.5 shrink-0 select-none">
                        <div className="flex items-center space-x-1 text-slate-400">
                          <Clock className="w-2.5 h-2.5" />
                          <span className="text-[7.5px] font-bold">
                            {new Date(diag.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} at {new Date(diag.created_at).toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => handleDelete(diag.id, e)}
                            className="p-1 text-slate-350 hover:text-rose-605 hover:bg-rose-50 rounded transition shrink-0"
                            title="Delete Diagram"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
