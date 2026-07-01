import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Paintbrush, 
  Download, 
  Trash2, 
  Save, 
  FileDown, 
  BookOpen, 
  Sparkles, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  LayoutGrid, 
  ArrowRight, 
  RefreshCw, 
  FileText,
  Loader2,
  Check
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { saveUserDiagram, getUserDiagrams, deleteUserDiagram } from '../services/firebaseDb';
import { generateStudyDiagram, getStudyAnswer } from '../services/geminiService';
import { AppLanguage, translate } from '../services/translations';
import { User as UserType } from '../types';

interface Props {
  user?: UserType;
  language: AppLanguage;
  isTagMode: boolean;
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
  { title: "Structure of human heart", prompt: "An academic labeled diagram of the human heart, showing Left/Right Ventricles, Atria, Aorta, and Vena Cava.", subject: "Biology" },
  { title: "Carbon Cycle Diagram", prompt: "An educational biogeochemical carbon cycle cycle flowchart illustrating photosynthesis, respiration, decomposition, and combustion.", subject: "Science" },
  { title: "Ohm's Law Circuit Diagram", prompt: "A physics schematic circuit diagram for Ohm's Law experiment containing an ammeter, voltmeter, resistor, battery, and switch.", subject: "Physics" },
  { title: "Structure of an Atom", prompt: "A Bohr model atom structure diagram of Carbon-12 depicting electrons, protons, neutrons, and nucleus shell paths.", subject: "Chemistry" }
];

const STYLES = [
  { id: "textbook", name: "Textbook Illustration", promptSuffix: "Clear, colored, clean textbook illustration style with professional academic labels." },
  { id: "blueprint", name: "Modern Blueprint", promptSuffix: "Clean white lines and blue grid blueprint schematic style, neat architectural labels." },
  { id: "chalkboard", name: "Chalkboard Sketch", promptSuffix: "Hand-drawn chalk sketch style on a dusty green classroom blackboard background." },
  { id: "pencil", name: "Pencil Drawing", promptSuffix: "Detailed black and white graphite pencil sketch drawing style, neat hand-written annotations." },
  { id: "infographic", name: "Colorful Infographic", promptSuffix: "Minimalist, high-contrast, modern colorful infographic vectors with bold typography pointers." }
];

export function DiagramMaker({ user, language, isTagMode }: Props) {
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('textbook');
  const [selectedSubject, setSelectedSubject] = useState('Science');
  const [practiceMode, setPracticeMode] = useState(false); // true means generate a blank test for labeling
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  
  // Current active diagram results
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [explanation, setExplanation] = useState('');
  const [activeDiagramId, setActiveDiagramId] = useState<string | null>(null);
  
  // Saved list of diagrams from Firestore
  const [savedDiagrams, setSavedDiagrams] = useState<SavedDiagram[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);

  // Load user diagrams from database
  useEffect(() => {
    if (user?.id) {
      loadSavedDiagrams();
    }
  }, [user?.id]);

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
    setPrompt(preset.prompt);
    setTitle(preset.title);
    setSelectedSubject(preset.subject);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setImageUrl(null);
    setExplanation('');
    setActiveDiagramId(null);
    setSaveSuccess(false);

    const stylePrompt = STYLES.find(s => s.id === selectedStyle)?.promptSuffix || '';
    const modePrompt = practiceMode 
      ? "Create a BLANK self-test practice version of this diagram. Use numbered blank circles (e.g., ①, ②, ③) pointing to the parts instead of actual labels, so students can practice labeling them."
      : "Include clear, readable labels pointing to all major parts.";

    const finalImagePrompt = `${prompt}. Style: ${stylePrompt}. Mode: ${modePrompt} Clear educational context, academic style, centered diagram on solid, clean high-contrast neutral background.`;

    try {
      // Step 1: Generate diagram image
      setLoadingStep("Drafting scientific illustration geometry...");
      const diagramImg = await generateStudyDiagram(finalImagePrompt);
      if (!diagramImg) {
        throw new Error("Unable to render diagram.");
      }
      setImageUrl(diagramImg);

      // Step 2: Generate educational study breakdown
      setLoadingStep("Assembling textbook labeling pointers and study guide...");
      const explanationPrompt = `
        Provide a textbook-level educational breakdown of the following study diagram topic: "${title || prompt}" (Subject: ${selectedSubject}).
        
        Format your response beautifully using structured sections:
        
        ### 📌 Key Labeled Parts
        (Create a detailed, bulleted list explaining what each major component is and its specific biological, physical, or geographical function)
        
        ### ✏️ Step-by-Step Drawing Guide (For Exams)
        (Give 4-5 practical, easy-to-follow steps on how a student can draw this diagram on paper during a timed school exam to score full marks)
        
        ### ❓ Core Exam Questions
        (Provide 2 mock exam questions related to this diagram - one short 2-mark question and one comprehensive 5-mark question, along with brief high-scoring answers)
        
        Make sure the language is encouraging and highly educational! Suitable for grade levels.
      `;
      const resultText = await getStudyAnswer(explanationPrompt, undefined, undefined, language);
      setExplanation(resultText);

    } catch (error) {
      console.error("Diagram Maker generation error:", error);
      setExplanation("Unable to compile study guide. Please try modifying your prompt or style.");
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleSaveToProfile = async () => {
    if (!user?.id || !imageUrl) return;
    try {
      const diagramData = {
        title: title || prompt.substring(0, 30) + " Diagram",
        prompt: prompt,
        imageUrl: imageUrl,
        explanation: explanation,
        subject: selectedSubject,
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

  const handleDownloadImage = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${(title || 'diagram').replace(/\s+/g, '_').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (!imageUrl) return;
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Header
      doc.setFillColor(79, 70, 229); // indigo-600
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.text("ASCEND STUDY • DIAGRAM LAB", 15, 20);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Subject: ${selectedSubject} | Student: ${user?.name || "Self-Study"}`, 15, 28);
      doc.text(`Style: ${STYLES.find(s => s.id === selectedStyle)?.name || 'Standard'}`, 15, 33);

      // Title
      doc.setTextColor(30, 41, 59); // slate-800
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(title || prompt, 15, 52);

      // Image
      try {
        doc.addImage(imageUrl, 'PNG', 15, 60, 180, 100);
      } catch (e) {
        doc.setFontSize(10);
        doc.setTextColor(239, 68, 68);
        doc.text("[Diagram Image Render Placeholder]", 15, 80);
      }

      // Explanation Header
      doc.setTextColor(30, 41, 59);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.text("Academic Study Breakdown & Guide", 15, 172);

      // Clean Markdown / Text processing for PDF
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105); // slate-600
      
      const cleanText = explanation
        .replace(/###/g, '')
        .replace(/\*\*/g, '')
        .replace(/📌/g, '•')
        .replace(/✏️/g, '•')
        .replace(/❓/g, '?')
        .trim();

      const splitText = doc.splitTextToSize(cleanText, 180);
      doc.text(splitText, 15, 180);

      doc.save(`${(title || 'diagram').replace(/\s+/g, '_').toLowerCase()}_study_guide.pdf`);
    } catch (pdfErr) {
      console.error("PDF Export error:", pdfErr);
      alert("Failed to compile PDF. You can still download the PNG image directly!");
    }
  };

  const handleSelectSaved = (diag: SavedDiagram) => {
    setImageUrl(diag.imageUrl);
    setExplanation(diag.explanation);
    setTitle(diag.title);
    setPrompt(diag.prompt);
    setSelectedSubject(diag.subject);
    setActiveDiagramId(diag.id);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-5">
      <header className="mb-4 shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white/40 p-3.5 rounded-2xl border border-slate-100 gap-3">
        <div>
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
            <span>🎨</span>
            <span>AI Study Diagram Lab</span>
            <span className="bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md animate-pulse">New</span>
          </h2>
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Generate premium labeled textbooks graphics and exam practice outlines</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg font-black uppercase">
            POWERED BY GEMINI 3.1
          </span>
        </div>
      </header>

      {/* Main Container Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-hidden">
        
        {/* LEFT COLUMN: Input form & presets (Column span: 5) */}
        <div className="lg:col-span-5 flex flex-col overflow-y-auto pr-1 space-y-4 scrollbar-hide">
          
          {/* Creator panel */}
          <div className={`p-5 rounded-3xl border shadow-xs space-y-4 transition-all duration-200 ${isTagMode ? 'bg-slate-950 border-cyan-500/40' : 'bg-white border-slate-100'}`}>
            <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${isTagMode ? 'text-cyan-400' : 'text-slate-700'}`}>
              <Paintbrush className="w-4 h-4" />
              <span>Diagram Blueprint Creator</span>
            </h3>

            {/* Title field */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Diagram Title / Heading</label>
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Structure of Human Eye"
                className={`w-full px-3 py-2 rounded-xl text-xs border focus:ring-2 outline-none transition ${isTagMode ? 'bg-slate-900 border-cyan-800 text-cyan-100 focus:ring-cyan-600' : 'border-slate-200 focus:ring-indigo-300 bg-slate-50/50 text-slate-800'}`}
              />
            </div>

            {/* Prompt text area */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Describe visual components</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What academic concepts or structures should this diagram label and explain?"
                className={`w-full p-3 rounded-xl text-xs border focus:ring-2 outline-none transition ${isTagMode ? 'bg-slate-900 border-cyan-800 text-cyan-100 focus:ring-cyan-600' : 'border-slate-200 focus:ring-indigo-300 bg-slate-50/50 text-slate-800'}`}
                rows={4}
              />
            </div>

            {/* Subject selector */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Subject Category</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className={`w-full px-2 py-2 rounded-xl text-xs border outline-none cursor-pointer ${isTagMode ? 'bg-slate-900 border-cyan-800 text-cyan-100' : 'border-slate-200 bg-slate-50/50 text-slate-800'}`}
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Illustration Style</label>
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  className={`w-full px-2 py-2 rounded-xl text-xs border outline-none cursor-pointer ${isTagMode ? 'bg-slate-900 border-cyan-800 text-cyan-100' : 'border-slate-200 bg-slate-50/50 text-slate-800'}`}
                >
                  {STYLES.map(st => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Practice / self-test mode toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/30">
              <div>
                <p className="text-[11px] font-black text-slate-800 flex items-center gap-1">
                  <span>📝</span>
                  <span>Exam Practice Mode</span>
                </p>
                <p className="text-[9px] text-slate-400 font-bold leading-none mt-0.5">Produce a blank unlabeled version for self-testing</p>
              </div>
              <button
                type="button"
                onClick={() => setPracticeMode(!practiceMode)}
                className={`p-1 rounded-full w-10 transition duration-150 relative flex items-center ${practiceMode ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'}`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-xs inline-block" />
              </button>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider disabled:opacity-50 transition duration-150 active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-md ${isTagMode ? 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white' : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-indigo-100'}`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Study Diagram...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Compile & Illustrate</span>
                </>
              )}
            </button>
          </div>

          {/* Quick preset chips */}
          <div className="p-4 rounded-3xl bg-slate-50/60 border border-slate-100 space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span>💡</span>
              <span>Classroom Popular Topics</span>
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handlePresetClick(p)}
                  className="px-2.5 py-1.5 bg-white border border-slate-150/80 hover:border-indigo-400 rounded-xl text-[10px] font-extrabold text-slate-700 transition active:scale-95 cursor-pointer flex items-center gap-1 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                >
                  <span className="text-[11px]">
                    {p.subject === 'Biology' && '🧬'}
                    {p.subject === 'Geography' && '🌍'}
                    {p.subject === 'Physics' && '⚡'}
                    {p.subject === 'Chemistry' && '🧪'}
                    {p.subject === 'Science' && '🔬'}
                  </span>
                  <span>{p.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Output display / interactive notes & Explanation (Column span: 7) */}
        <div className="lg:col-span-7 flex flex-col overflow-hidden">
          
          {loading ? (
            /* Loading State screen */
            <div className="flex-1 bg-white border border-slate-100 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-5 shadow-xs">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <ImageIcon className="w-6 h-6 text-indigo-600 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="max-w-xs space-y-2">
                <h4 className="text-sm font-black text-slate-800">Drawing Academic Canvas</h4>
                <p className="text-xs text-indigo-600 font-extrabold uppercase tracking-wide animate-pulse">{loadingStep}</p>
                <p className="text-[10px] text-slate-400 font-bold leading-normal pt-1 border-t border-slate-50">Gemini AI is carefully structuring the shapes, colors, and textual coordinates to render textbook-grade diagrams.</p>
              </div>
            </div>
          ) : imageUrl ? (
            /* Active Diagram View Screen */
            <div className="flex-1 flex flex-col overflow-hidden bg-white border border-slate-150/70 rounded-3xl shadow-sm">
              {/* Output Header Controls */}
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-slate-800 max-w-[200px] truncate">{title || "Study Diagram"}</span>
                  <span className="text-[9px] font-black uppercase bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md">{selectedSubject}</span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleSaveToProfile}
                    className={`p-1.5 rounded-lg border transition active:scale-95 flex items-center justify-center gap-1 text-[10px] font-extrabold cursor-pointer ${saveSuccess ? 'bg-emerald-50 border-emerald-300 text-emerald-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    title="Save diagram to profile gallery"
                  >
                    {saveSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Vault</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadImage}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition active:scale-95 flex items-center justify-center gap-1 text-[10px] font-extrabold cursor-pointer"
                    title="Download PNG diagram"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>

                  <button
                    onClick={handleExportPDF}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition active:scale-95 flex items-center justify-center gap-1 text-[10px] font-extrabold cursor-pointer"
                    title="Export study notes & image to PDF"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>

              {/* View Scrollable Canvas */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-hide">
                {/* Diagram render area */}
                <div className="bg-slate-950/5 border border-slate-100 rounded-2xl overflow-hidden flex items-center justify-center max-h-[300px] relative shadow-inner">
                  <img 
                    src={imageUrl} 
                    alt={title || "Generated Diagram"} 
                    className="object-contain max-h-[300px] w-full"
                    referrerPolicy="no-referrer"
                  />
                  {practiceMode && (
                    <div className="absolute top-2 left-2 bg-indigo-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                      <EyeOff className="w-3 h-3" />
                      <span>Practice Self-Test version</span>
                    </div>
                  )}
                </div>

                {/* Educational Explanation Box */}
                {explanation && (
                  <div className="p-4 rounded-2xl bg-indigo-50/30 border border-indigo-100/50 space-y-3">
                    <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      <span>Academic Study Note & Guide</span>
                    </h4>
                    <div className="text-xs text-slate-700 leading-relaxed space-y-4 whitespace-pre-wrap font-medium">
                      {explanation}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Placeholder View when empty */
            <div className="flex-1 bg-white border border-slate-150/70 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-inner min-h-[300px]">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-xl shadow-sm">🎨</div>
              <div className="max-w-xs space-y-1">
                <h4 className="text-xs font-black text-slate-800">Your Canvas is Ready</h4>
                <p className="text-[10px] text-slate-400 font-bold leading-normal">Describe a study topic (e.g. human digestive system, water cycles) or click a classroom preset to illustrate textbook graphics with structured notes instantly.</p>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* BOTTOM GALLERY: Saved Diagrams Vault */}
      <section className="mt-5 shrink-0 bg-white/40 p-4 border border-slate-100 rounded-3xl space-y-3">
        <header className="flex justify-between items-center">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <LayoutGrid className="w-4 h-4 text-indigo-600" />
            <span>My Academic Diagrams Vault ({savedDiagrams.length})</span>
          </h3>
          <button 
            onClick={loadSavedDiagrams}
            disabled={fetchLoading}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${fetchLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </header>

        {fetchLoading ? (
          <div className="py-6 text-center space-y-1">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600 mx-auto" />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Syncing study diagrams vault...</p>
          </div>
        ) : savedDiagrams.length === 0 ? (
          <div className="py-6 text-center border border-dashed border-slate-150 rounded-2xl bg-slate-50/20 text-[10px] text-slate-400 font-bold uppercase">
            Your diagrams vault is empty. Illustrate a new diagram and click "Save Vault" to start collecting!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[140px] overflow-y-auto scrollbar-hide">
            {savedDiagrams.map((diag) => (
              <div
                key={diag.id}
                onClick={() => handleSelectSaved(diag)}
                className={`group border rounded-2xl overflow-hidden cursor-pointer relative bg-white transition hover:shadow-md hover:border-indigo-400 flex flex-col justify-between h-[110px] ${activeDiagramId === diag.id ? 'border-2 border-indigo-600 ring-2 ring-indigo-50/50' : 'border-slate-150/70'}`}
              >
                {/* Small thumbnail */}
                <div className="h-[60px] bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100 relative">
                  <img 
                    src={diag.imageUrl} 
                    alt={diag.title} 
                    className="object-cover w-full h-full transition group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-1 left-1">
                    <span className="text-[7px] font-black uppercase bg-indigo-600 text-white px-1 py-0.5 rounded">{diag.subject}</span>
                  </div>
                </div>

                <div className="p-2 flex flex-col justify-between flex-1">
                  <p className="text-[9px] font-black text-slate-800 truncate leading-tight group-hover:text-indigo-600">{diag.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[7px] text-slate-400 font-bold">{new Date(diag.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                    <button
                      onClick={(e) => handleDelete(diag.id, e)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition active:scale-90 rounded hover:bg-rose-50"
                      title="Delete diagram"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
