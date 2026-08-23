import { useState } from 'react';
import { 
  ImageIcon, 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  Loader2, 
  Maximize2, 
  BookOpen, 
  Zap, 
  Sliders,
  X,
  Wand2,
  RefreshCw,
  Eye,
  Layers,
  Palette,
  Atom,
  Binary,
  Compass,
  Feather
} from 'lucide-react';
import { generateAiImage, enhanceImagePrompt } from '../services/geminiService';

interface ImageGeneratorProps {
  onSaveToNotebook?: (title: string, imageUrl: string) => void;
  onAddXp?: (amount: number) => void;
}

interface GeneratedImageItem {
  id: string;
  prompt: string;
  imageUrl: string;
  size: '512px' | '1K' | '2K' | '4K';
  aspectRatio: string;
  style: string;
  modelUsed?: string;
  timestamp: string;
}

const STYLES = [
  { id: 'academic_diagram', name: 'Academic Diagram', icon: Atom, desc: 'Vector diagram with clear labels' },
  { id: 'photorealistic', name: 'Photorealistic 8K', icon: Eye, desc: 'Ultra-detailed camera photography' },
  { id: '3d_render', name: '3D Render', icon: Layers, desc: 'Isometric octane 3D model' },
  { id: 'chalkboard', name: 'Chalkboard Sketch', icon: Binary, desc: 'Hand-drawn blackboard notes' },
  { id: 'cinematic', name: 'Cinematic', icon: Sparkles, desc: 'Dramatic studio lighting & depth' },
  { id: 'anime', name: 'Studio Anime', icon: Palette, desc: 'Ghibli inspired digital art' },
  { id: 'vintage_lithograph', name: 'Vintage Litho', icon: Feather, desc: 'Classic encyclopedia engraving' },
  { id: 'none', name: 'Natural / Raw', icon: Compass, desc: 'Exact user text prompt' }
];

const CATEGORY_PROMPTS = [
  {
    category: "🔬 Science & Biology",
    prompts: [
      "Photorealistic labeled diagram of human heart anatomy with blood flow arrows",
      "Detailed 3D molecular model of DNA double helix showing base pairs and hydrogen bonds",
      "High resolution cross-section of a plant cell with labeled chloroplasts and nucleus",
      "Microscopic view of red and white blood cells flowing through a capillary"
    ]
  },
  {
    category: "📐 Physics & Math",
    prompts: [
      "Clean geometric 3D proof of Pythagoras Theorem with colored coordinate squares",
      "Chalkboard style physics illustration of Newton's laws of motion with force vectors",
      "Electromagnetic wave propagation diagram with oscillating electric and magnetic fields",
      "Solar system orbital mechanics with gravitational planetary orbits and sun corona"
    ]
  },
  {
    category: "🌍 History & Geography",
    prompts: [
      "Detailed ancient Roman Colosseum architectural cross-section with arches",
      "Vintage topographic relief map of the Himalayan mountain range and river systems",
      "Atmospheric layers diagram showing Troposphere to Exosphere with weather phenomena",
      "Water cycle visual diagram showing evaporation, condensation, and precipitation"
    ]
  },
  {
    category: "💻 Computer & Tech",
    prompts: [
      "Isometric 3D diagram of CPU architecture with ALU, registers and cache bus lines",
      "Neural network deep learning nodes interconnected with glowing synaptic data links",
      "Cybersecurity firewall architecture protecting cloud servers from data packets"
    ]
  }
];

export default function ImageGenerator({ onSaveToNotebook, onAddXp }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string>('academic_diagram');
  const [imageSize, setImageSize] = useState<'512px' | '1K' | '2K' | '4K'>('2K');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [currentImage, setCurrentImage] = useState<GeneratedImageItem | null>(null);
  const [gallery, setGallery] = useState<GeneratedImageItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [selectedCategoryIdx, setSelectedCategoryIdx] = useState(0);

  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const enhanced = await enhanceImagePrompt(prompt.trim(), selectedStyle);
      setPrompt(enhanced);
    } catch (err) {
      console.error("Failed to enhance prompt:", err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async (customPrompt?: string, customSeed?: number) => {
    const finalPrompt = (customPrompt || prompt).trim();
    if (!finalPrompt || isGenerating) return;

    setIsGenerating(true);
    try {
      const result = await generateAiImage(finalPrompt, imageSize, aspectRatio, {
        style: selectedStyle,
        seed: customSeed
      });
      const newItem: GeneratedImageItem = {
        id: 'img_' + Date.now(),
        prompt: finalPrompt,
        imageUrl: result.imageUrl,
        size: imageSize,
        aspectRatio: result.aspectRatio,
        style: selectedStyle,
        modelUsed: result.modelUsed || 'gemini-3.1-flash-image',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setCurrentImage(newItem);
      setGallery(prev => [newItem, ...prev]);
      if (onAddXp) onAddXp(25);
    } catch (err) {
      console.error("Failed to generate image:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReRoll = () => {
    if (!currentImage) return;
    const randomSeed = Math.floor(Math.random() * 9000000) + 1000000;
    handleGenerate(currentImage.prompt, randomSeed);
  };

  const handleCopyLink = (item: GeneratedImageItem) => {
    navigator.clipboard.writeText(item.imageUrl);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveDoc = (item: GeneratedImageItem) => {
    if (onSaveToNotebook) {
      onSaveToNotebook(
        `AI Visual: ${item.prompt.slice(0, 30)}...`,
        `![${item.prompt}](${item.imageUrl})\n\n**Image Concept:** ${item.prompt}\n**Engine:** ${item.modelUsed || 'Real-AI-Engine'} | **Style:** ${item.style} | **Resolution:** ${item.size} | **Aspect Ratio:** ${item.aspectRatio}`
      );
      setSavedId(item.id);
      setTimeout(() => setSavedId(null), 2000);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-12">
      {/* HEADER CARD */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-600/30 border border-indigo-400/40 rounded-2xl text-indigo-300 shadow-inner">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black tracking-tight text-white uppercase">Real AI Image Engine</h2>
                <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[9px] font-mono font-bold rounded-full">
                  MULTI-MODEL HD
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Generate high-resolution educational diagrams, charts & custom visual demands
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* INPUT FORM & CONTROLS */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* PROMPT TEXTAREA & MAGIC ENHANCE */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
              <span>Image Prompt / User Demand</span>
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-indigo-600 font-semibold">+25 XP</span>
              <button
                type="button"
                onClick={handleEnhancePrompt}
                disabled={!prompt.trim() || isEnhancing || isGenerating}
                className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white rounded-xl text-[10px] font-bold transition flex items-center space-x-1 shadow-xs disabled:opacity-50 cursor-pointer"
                title="Use AI to enhance and add rich descriptive detail to your prompt"
              >
                {isEnhancing ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Enhancing...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3 h-3 text-amber-200" />
                    <span>Magic Enhance</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe any image or concept in real detail (e.g. Labeled human heart blood flow, 3D geometric proof of Pythagoras theorem, solar system orbits...)"
            rows={3}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition resize-none"
          />
        </div>

        {/* ARTISTIC / EDUCATIONAL STYLE PRESETS */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 flex items-center space-x-1.5">
            <Palette className="w-3.5 h-3.5 text-indigo-600" />
            <span>Visual Style Preset:</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {STYLES.map((st) => {
              const Icon = st.icon;
              const isSelected = selectedStyle === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSelectedStyle(st.id)}
                  className={`p-2 rounded-xl text-left transition border flex items-start space-x-2 ${
                    isSelected
                      ? 'bg-indigo-50/90 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold truncate">{st.name}</div>
                    <div className="text-[8.5px] text-slate-500 truncate">{st.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* CATEGORY QUICK INSPIRATION PROMPTS */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORY_PROMPTS.map((cat, idx) => (
              <button
                key={cat.category}
                type="button"
                onClick={() => setSelectedCategoryIdx(idx)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold whitespace-nowrap transition ${
                  selectedCategoryIdx === idx
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.category}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_PROMPTS[selectedCategoryIdx].prompts.map((pText, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(pText)}
                className="text-[10.5px] font-medium bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-2.5 py-1 rounded-xl transition border border-slate-200/80 truncate max-w-xs text-left"
              >
                💡 {pText}
              </button>
            ))}
          </div>
        </div>

        {/* RESOLUTION & ASPECT RATIO CONTROLS */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* IMAGE SIZE / RESOLUTION AFFORDANCE */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span>Resolution Quality:</span>
            </label>
            <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              {(['512px', '1K', '2K', '4K'] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setImageSize(sz)}
                  className={`py-1.5 rounded-xl text-xs font-black transition flex flex-col items-center justify-center ${
                    imageSize === sz
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>{sz}</span>
                  <span className="text-[7.5px] opacity-80 font-normal">
                    {sz === '512px' ? 'Fast' : sz === '1K' ? '1024' : sz === '2K' ? '2048' : '4096'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ASPECT RATIO */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
              <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Aspect Ratio:</span>
            </label>
            <div className="grid grid-cols-5 gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              {[
                { label: '1:1', desc: 'Square' },
                { label: '16:9', desc: 'Banner' },
                { label: '4:3', desc: 'Doc' },
                { label: '9:16', desc: 'Story' },
                { label: '3:4', desc: 'Sheet' }
              ].map((ar) => (
                <button
                  key={ar.label}
                  type="button"
                  onClick={() => setAspectRatio(ar.label)}
                  className={`py-1.5 rounded-xl text-[10px] font-bold transition flex flex-col items-center justify-center ${
                    aspectRatio === ar.label
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <div>{ar.label}</div>
                  <span className="text-[7.5px] opacity-75 font-normal">{ar.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* GENERATE SUBMIT BUTTON */}
        <button
          type="button"
          onClick={() => handleGenerate()}
          disabled={!prompt.trim() || isGenerating}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2 active:scale-[0.99] cursor-pointer"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Rendering Real Image ({imageSize} • {selectedStyle})...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Generate Real Image ({imageSize})</span>
            </>
          )}
        </button>
      </div>

      {/* CURRENT GENERATED RESULT DISPLAY */}
      {currentImage && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 text-white space-y-4 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-1">
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-full">
                  Rendered Successfully ✓
                </span>
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono rounded-full">
                  {currentImage.size} ({currentImage.aspectRatio})
                </span>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono rounded-full">
                  {currentImage.modelUsed || 'AI Engine'}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-1.5 italic">
                "{currentImage.prompt}"
              </p>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={handleReRoll}
                disabled={isGenerating}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition flex items-center space-x-1 text-xs"
                title="Generate Variation / Re-Roll"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span className="text-[10px] font-bold">Variant</span>
              </button>
              <button
                type="button"
                onClick={() => setFullscreenImage(currentImage.imageUrl)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
                title="View Full Screen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* IMAGE CONTAINER */}
          <div className="relative group bg-slate-950 rounded-2xl overflow-hidden border border-slate-800/80 shadow-inner flex items-center justify-center min-h-[300px]">
            <img
              src={currentImage.imageUrl}
              alt={currentImage.prompt}
              referrerPolicy="no-referrer"
              className="w-full h-auto max-h-[500px] object-contain rounded-2xl transition group-hover:scale-[1.01]"
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <div className="flex items-center space-x-2">
              <a
                href={currentImage.imageUrl}
                download={`ai_image_${currentImage.id}.png`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1.5 shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download HD</span>
              </a>

              <button
                type="button"
                onClick={() => handleCopyLink(currentImage)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl transition flex items-center space-x-1.5 border border-slate-700 cursor-pointer"
              >
                {copiedId === currentImage.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === currentImage.id ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>

            {onSaveToNotebook && (
              <button
                type="button"
                onClick={() => handleSaveDoc(currentImage)}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition flex items-center space-x-1.5 shadow-md cursor-pointer"
              >
                {savedId === currentImage.id ? <Check className="w-3.5 h-3.5 text-slate-950" /> : <BookOpen className="w-3.5 h-3.5" />}
                <span>{savedId === currentImage.id ? 'Saved to Notebook!' : 'Save to Notebook'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SESSION GALLERY */}
      {gallery.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Session History Gallery ({gallery.length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {gallery.map((item) => (
              <div
                key={item.id}
                onClick={() => setCurrentImage(item)}
                className={`group relative bg-slate-900 rounded-2xl overflow-hidden border cursor-pointer transition p-1 ${
                  currentImage?.id === item.id 
                    ? 'border-indigo-600 ring-2 ring-indigo-500/30' 
                    : 'border-slate-200 hover:border-indigo-400'
                }`}
              >
                <img
                  src={item.imageUrl}
                  alt={item.prompt}
                  referrerPolicy="no-referrer"
                  className="w-full h-28 object-cover rounded-xl"
                />
                <div className="p-1.5">
                  <p className="text-[10px] text-slate-200 font-semibold truncate">{item.prompt}</p>
                  <div className="flex items-center justify-between text-[8px] text-slate-400 mt-0.5">
                    <span className="font-mono bg-slate-800 px-1 py-0.2 rounded text-indigo-300">{item.size}</span>
                    <span>{item.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FULLSCREEN MODAL OVERLAY */}
      {fullscreenImage && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center space-y-3">
            <button
              type="button"
              onClick={() => setFullscreenImage(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white bg-slate-800/80 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={fullscreenImage}
              alt="Full screen generated visual"
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-slate-800"
            />
          </div>
        </div>
      )}
    </div>
  );
}
