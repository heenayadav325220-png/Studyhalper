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
  X
} from 'lucide-react';
import { generateAiImage } from '../services/geminiService';

interface ImageGeneratorProps {
  onSaveToNotebook?: (title: string, imageUrl: string) => void;
  onAddXp?: (amount: number) => void;
}

interface GeneratedImageItem {
  id: string;
  prompt: string;
  imageUrl: string;
  size: '1K' | '2K' | '4K';
  aspectRatio: string;
  timestamp: string;
}

const PRESET_PROMPTS = [
  "Photorealistic labeled diagram of human heart anatomy with blood flow arrows",
  "3D artistic rendering of the solar system with planetary orbits and sun glow",
  "Clean geometric diagram explaining Pythagoras Theorem and triangle vector math",
  "Detailed molecular model of DNA double helix with base pair chemical bonds",
  "Chalkboard style physics illustration of Newton's laws of motion with force vectors"
];

export default function ImageGenerator({ onSaveToNotebook, onAddXp }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('2K');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<GeneratedImageItem | null>(null);
  const [gallery, setGallery] = useState<GeneratedImageItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const handleGenerate = async (customPrompt?: string) => {
    const finalPrompt = (customPrompt || prompt).trim();
    if (!finalPrompt || isGenerating) return;

    setIsGenerating(true);
    try {
      const result = await generateAiImage(finalPrompt, imageSize, aspectRatio);
      const newItem: GeneratedImageItem = {
        id: 'img_' + Date.now(),
        prompt: finalPrompt,
        imageUrl: result.imageUrl,
        size: imageSize,
        aspectRatio: result.aspectRatio,
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

  const handleCopyLink = (item: GeneratedImageItem) => {
    navigator.clipboard.writeText(item.imageUrl);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveDoc = (item: GeneratedImageItem) => {
    if (onSaveToNotebook) {
      onSaveToNotebook(
        `AI Visual: ${item.prompt.slice(0, 30)}...`,
        `![${item.prompt}](${item.imageUrl})\n\n**Generated Image Prompt:** ${item.prompt}\n**Model:** gemini-3.1-flash-image | **Resolution:** ${item.size} | **Aspect Ratio:** ${item.aspectRatio}`
      );
      setSavedId(item.id);
      setTimeout(() => setSavedId(null), 2000);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
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
                <h2 className="text-base font-black tracking-tight text-white uppercase">AI Image Generator</h2>
                <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[9px] font-mono font-bold rounded-full">
                  gemini-3.1-flash-image
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Generate high-resolution educational diagrams, charts & study visual aids
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* INPUT FORM & CONTROLS */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* PROMPT TEXTAREA */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center justify-between">
            <span>Image Prompt / Concept Description</span>
            <span className="text-[10px] text-indigo-600 font-semibold">+25 XP per image</span>
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the study diagram or visual concept you want to generate (e.g. Labeled structure of a plant cell, 3D geometric proof of Pythagoras theorem...)"
            rows={3}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition resize-none"
          />
        </div>

        {/* QUICK SUGGESTION CHIPS */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Academic Quick Prompts:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_PROMPTS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(preset)}
                className="text-[10.5px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-2.5 py-1 rounded-xl transition border border-slate-200/80 truncate max-w-xs text-left"
              >
                💡 {preset}
              </button>
            ))}
          </div>
        </div>

        {/* RESOLUTION & ASPECT RATIO CONTROLS */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* IMAGE SIZE / RESOLUTION AFFORDANCE (1K, 2K, 4K) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span>Resolution Quality:</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              {(['1K', '2K', '4K'] as const).map((sz) => (
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
                  <span className="text-[8px] opacity-80 font-normal">
                    {sz === '1K' ? '1024px' : sz === '2K' ? '2048px' : '4096px'}
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
            <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              {[
                { label: '1:1', desc: 'Square' },
                { label: '16:9', desc: 'Banner' },
                { label: '4:3', desc: 'Doc' },
                { label: '9:16', desc: 'Mobile' }
              ].map((ar) => (
                <button
                  key={ar.label}
                  type="button"
                  onClick={() => setAspectRatio(ar.label)}
                  className={`py-1.5 rounded-xl text-[10px] font-bold transition ${
                    aspectRatio === ar.label
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <div>{ar.label}</div>
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
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2 active:scale-[0.99]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Generating with gemini-3.1-flash-image ({imageSize})...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Generate High-Quality Image ({imageSize})</span>
            </>
          )}
        </button>
      </div>

      {/* CURRENT GENERATED RESULT DISPLAY */}
      {currentImage && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 text-white space-y-4 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-full">
                  Generated Successfully ✓
                </span>
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono rounded-full">
                  {currentImage.size} ({currentImage.aspectRatio})
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-1 italic">
                "{currentImage.prompt}"
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFullscreenImage(currentImage.imageUrl)}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
              title="View Full Screen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* IMAGE CONTAINER */}
          <div className="relative group bg-slate-950 rounded-2xl overflow-hidden border border-slate-800/80 shadow-inner flex items-center justify-center min-h-[280px]">
            <img
              src={currentImage.imageUrl}
              alt={currentImage.prompt}
              referrerPolicy="no-referrer"
              className="w-full h-auto max-h-[480px] object-contain rounded-2xl transition group-hover:scale-[1.01]"
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <div className="flex items-center space-x-2">
              <a
                href={currentImage.imageUrl}
                download={`study_image_${currentImage.id}.png`}
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
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl transition flex items-center space-x-1.5 border border-slate-700"
              >
                {copiedId === currentImage.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === currentImage.id ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>

            {onSaveToNotebook && (
              <button
                type="button"
                onClick={() => handleSaveDoc(currentImage)}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition flex items-center space-x-1.5 shadow-md"
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
              <span>Session Image Gallery ({gallery.length})</span>
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
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white bg-slate-800/80 rounded-xl transition"
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
