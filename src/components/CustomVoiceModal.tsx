import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, 
  Play, 
  Square, 
  Check, 
  Sliders, 
  Radio, 
  Info, 
  X,
  UserCheck,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { 
  CustomVoiceConfig, 
  getCustomVoiceConfig, 
  saveCustomVoiceConfig, 
  getBrowserVoices, 
  playTutorSpeech,
  findBestQualityVoice,
  scoreVoiceQuality,
  DEFAULT_VOICE_CONFIG
} from '../services/voiceSettings';

interface CustomVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  appLanguage: string;
}

interface VoicePreset {
  id: 'friendly' | 'mentor' | 'energetic' | 'calm';
  nameEn: string;
  nameHi: string;
  descEn: string;
  descHi: string;
  icon: string;
  pitch: number;
  rate: number;
}

const VOICE_PRESETS: VoicePreset[] = [
  {
    id: 'friendly',
    nameEn: 'Friendly Study Buddy (Best)',
    nameHi: 'दोस्ताना स्टडी बडी (एक नंबर)',
    descEn: 'Acoustically tuned warm, articulate, and natural cadence',
    descHi: 'एकदम साफ़, मधुर और अपनत्व भरा नेचुरल अंदाज़',
    icon: '🤝',
    pitch: 1.02,
    rate: 0.96
  },
  {
    id: 'mentor',
    nameEn: 'Wise Mentor / Guru',
    nameHi: 'शांत गुरु / सीनियर मेंटॉर',
    descEn: 'Deep, steady, authoritative, and patient cadence',
    descHi: 'गंभीर, स्थिर और धैर्यवान स्पष्ट आवाज',
    icon: '🎓',
    pitch: 0.90,
    rate: 0.94
  },
  {
    id: 'energetic',
    nameEn: 'Energetic Exam Coach',
    nameHi: 'जोशीला एग्ज़ाम कोच',
    descEn: 'Inspiring, upbeat motivation with clear enunciation',
    descHi: 'तेज, प्रेरणादायक और उत्साह से भरपूर स्पष्ट आवाज',
    icon: '⚡',
    pitch: 1.08,
    rate: 1.05
  },
  {
    id: 'calm',
    nameEn: 'Calm Zen Explainer',
    nameHi: 'शांत और सरल गाइड',
    descEn: 'Gentle, soothing rhythm for stress-free revision',
    descHi: 'तनाव-मुक्त पढ़ाई के लिए धीमा और मधुर स्वर',
    icon: '🧘',
    pitch: 0.98,
    rate: 0.88
  }
];

export const CustomVoiceModal: React.FC<CustomVoiceModalProps> = ({
  isOpen,
  onClose,
  appLanguage
}) => {
  const [config, setConfig] = useState<CustomVoiceConfig>(getCustomVoiceConfig());
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const active = getCustomVoiceConfig();
      setConfig(active);
      getBrowserVoices().then((voices) => {
        // Sort voices by quality score so the best neural/natural voices appear first
        const isHi = appLanguage === 'hi';
        const sorted = [...voices].sort((a, b) => scoreVoiceQuality(b, isHi) - scoreVoiceQuality(a, isHi));
        setAvailableVoices(sorted);

        // If no voice selected, automatically select the best studio quality voice
        if (!active.voiceURI && sorted.length > 0) {
          const best = findBestQualityVoice(sorted, undefined, isHi ? 'hi' : 'en');
          if (best) {
            const upgradedConfig: CustomVoiceConfig = {
              ...active,
              voiceURI: best.voiceURI,
              voiceName: best.name,
              lang: best.lang,
              pitch: 1.02,
              rate: 0.96
            };
            setConfig(upgradedConfig);
            saveCustomVoiceConfig(upgradedConfig);
          }
        }
      });
    }
  }, [isOpen, appLanguage]);

  if (!isOpen) return null;

  const handlePresetSelect = (preset: VoicePreset) => {
    setConfig((prev) => ({
      ...prev,
      persona: preset.id,
      pitch: preset.pitch,
      rate: preset.rate
    }));
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const uri = e.target.value;
    const selected = availableVoices.find((v) => v.voiceURI === uri);
    if (selected) {
      setConfig((prev) => ({
        ...prev,
        voiceURI: selected.voiceURI,
        voiceName: selected.name,
        lang: selected.lang
      }));
    }
  };

  const handleResetToStudioDefault = () => {
    const isHi = appLanguage === 'hi';
    const best = findBestQualityVoice(availableVoices, undefined, isHi ? 'hi' : 'en');
    const studioDefault: CustomVoiceConfig = {
      ...DEFAULT_VOICE_CONFIG,
      voiceURI: best ? best.voiceURI : '',
      voiceName: best ? best.name : 'Studio Quality AI Voice',
      lang: best ? best.lang : (isHi ? 'hi-IN' : 'en-US'),
      pitch: 1.02,
      rate: 0.96,
      volume: 1.0,
      persona: 'friendly'
    };
    setConfig(studioDefault);
    saveCustomVoiceConfig(studioDefault);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleTestSpeech = () => {
    if (isPlayingTest) {
      window.speechSynthesis?.cancel();
      setIsPlayingTest(false);
      return;
    }

    const testText =
      appLanguage === 'hi'
        ? `नमस्ते! यह आपकी बेहतरीन स्टूडियो ट्यूटर आवाज़ है। अब से हर कॉन्सेप्ट को मैं हमेशा इसी एक नंबर अंदाज़, साफ़ उच्चारण और सही गति में समझाऊँगा!`
        : `Hello! This is your studio-quality AI tutor voice. From now on, every lesson and concept will be explained in this crystal-clear tone and perfect pacing!`;

    setIsPlayingTest(true);
    playTutorSpeech(
      testText,
      config,
      () => setIsPlayingTest(true),
      () => setIsPlayingTest(false),
      () => setIsPlayingTest(false)
    );
  };

  const handleSave = () => {
    saveCustomVoiceConfig(config);
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 800);
  };

  const topVoiceURI = availableVoices[0]?.voiceURI;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/20 text-indigo-400 flex items-center justify-center font-bold shadow-inner">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {appLanguage === 'hi' ? 'स्टूडियो वॉयस ट्यूनर' : 'Tutor Studio Voice'}
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    HD Quality
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {appLanguage === 'hi'
                    ? 'परफेक्ट पिच (1.02x) और सही स्पीड (0.96x) के साथ एक नंबर आवाज़'
                    : 'Acoustically tuned pitch (1.02x) & speed (0.96x) for effortless learning'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 overflow-y-auto">
            {/* Quick Best Default Banner */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-950/60 to-purple-950/40 border border-indigo-500/30 rounded-xl">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="text-xs">
                  <p className="font-semibold text-white">
                    {appLanguage === 'hi' ? 'डिफॉल्ट बेहतरीन आवाज़ सक्रिय' : 'Studio Quality Preset Active'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {appLanguage === 'hi' ? 'पिच: 1.02x • स्पीड: 0.96x (क्लियर उच्चारण)' : 'Pitch: 1.02x • Speed: 0.96x (crystal clear cadence)'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetToStudioDefault}
                title="Reset to recommended studio default"
                className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/40 text-indigo-200 text-xs font-medium rounded-lg transition active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{appLanguage === 'hi' ? 'डिफॉल्ट करें' : 'Reset Default'}</span>
              </button>
            </div>

            {/* Presets */}
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2.5">
                {appLanguage === 'hi' ? '1. आवाज़ का अंदाज़ (Voice Archetype)' : '1. Voice Archetype'}
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {VOICE_PRESETS.map((p) => {
                  const isSelected = config.persona === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePresetSelect(p)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500/40 text-white shadow-sm'
                          : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{p.icon}</span>
                        <span className="text-xs font-bold truncate">
                          {appLanguage === 'hi' ? p.nameHi : p.nameEn}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        {appLanguage === 'hi' ? p.descHi : p.descEn}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Select Browser Voice */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  {appLanguage === 'hi' ? '2. डिवाइस वॉयस चुनें (Voice Engine)' : '2. System Voice Engine'}
                </label>
                <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {availableVoices.length} {appLanguage === 'hi' ? 'आवाज़ें जांची गईं' : 'voices detected'}
                </span>
              </div>
              <select
                value={config.voiceURI}
                onChange={handleVoiceChange}
                className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {availableVoices.length === 0 && (
                  <option value="">{appLanguage === 'hi' ? 'सिस्टम डिफॉल्ट आवाज़' : 'System Default Voice'}</option>
                )}
                {availableVoices.map((v, idx) => {
                  const isTop = v.voiceURI === topVoiceURI;
                  return (
                    <option key={`${v.voiceURI || v.name}_${v.lang}_${idx}`} value={v.voiceURI}>
                      {isTop ? '⭐ [STUDIO BEST] ' : ''}{v.name} ({v.lang})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Pitch & Rate Sliders */}
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 space-y-4">
              {/* Pitch */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    {appLanguage === 'hi' ? 'पिच / सुर (Tone Depth)' : 'Pitch / Tone Depth'}
                  </span>
                  <span className="text-indigo-400 font-mono text-xs">{config.pitch.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.4"
                  step="0.01"
                  value={config.pitch}
                  onChange={(e) => setConfig((prev) => ({ ...prev, pitch: parseFloat(e.target.value) }))}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>{appLanguage === 'hi' ? 'भारी / गंभीर' : 'Deep / Low'}</span>
                  <span className="text-indigo-400 font-medium">{appLanguage === 'hi' ? 'परफेक्ट (1.02x)' : 'Sweet Spot (1.02x)'}</span>
                  <span>{appLanguage === 'hi' ? 'पतली / तीखी' : 'Sharp / High'}</span>
                </div>
              </div>

              {/* Rate / Speed */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-amber-400" />
                    {appLanguage === 'hi' ? 'बोलने की गति (Speech Speed)' : 'Speech Speed (Rate)'}
                  </span>
                  <span className="text-amber-400 font-mono text-xs">{config.rate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.35"
                  step="0.01"
                  value={config.rate}
                  onChange={(e) => setConfig((prev) => ({ ...prev, rate: parseFloat(e.target.value) }))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>{appLanguage === 'hi' ? 'धीमा (0.75x)' : 'Slow (0.75x)'}</span>
                  <span className="text-amber-400 font-medium">{appLanguage === 'hi' ? 'आदर्श (0.96x)' : 'Ideal Study (0.96x)'}</span>
                  <span>{appLanguage === 'hi' ? 'तेज (1.35x)' : 'Fast (1.35x)'}</span>
                </div>
              </div>
            </div>

            {/* Custom Voice Style Prompt */}
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                {appLanguage === 'hi' ? '3. ट्यूटर के बोलने का व्यवहार (Persona Guidance)' : '3. Persona Guidance Prompt'}
              </label>
              <input
                type="text"
                value={config.customInstructions || ''}
                onChange={(e) => setConfig((prev) => ({ ...prev, customInstructions: e.target.value }))}
                placeholder={
                  appLanguage === 'hi'
                    ? 'उदा. हमेशा भाई/दोस्त बोलकर समझाओ, सरल हिंदी और हिंग्लिश में बोलो'
                    : 'e.g. Always explain like a friendly elder brother in easy words'
                }
                className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Info Box about Personal Voice Cloning */}
            <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-xs text-slate-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px] text-slate-400">
                {appLanguage === 'hi' ? (
                  <>
                    <strong className="text-slate-200">स्थायी एक नंबर आवाज़:</strong> यह आवाज़ और स्पीड हमेशा AI Tutor, Live Voice Tutor और सभी टूल्स में अपने आप लागू रहेगी। आपको इसे बार-बार बदलने की ज़रूरत नहीं पड़ेगी!
                  </>
                ) : (
                  <>
                    <strong className="text-slate-200">Persistent Studio Voice:</strong> Saved voice, pitch, and speed will automatically apply across all AI Tutor & Live Voice sessions. No reconfiguration needed!
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/50">
            <button
              type="button"
              onClick={handleTestSpeech}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isPlayingTest
                  ? 'bg-rose-600/20 border-rose-500/40 text-rose-400'
                  : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200'
              }`}
            >
              {isPlayingTest ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  {appLanguage === 'hi' ? 'रोकें' : 'Stop Test'}
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  {appLanguage === 'hi' ? 'आवाज़ टेस्ट करें' : 'Test Voice'}
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                {appLanguage === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
              >
                {savedFeedback ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    {appLanguage === 'hi' ? 'सेव हो गया!' : 'Voice Locked!'}
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    {appLanguage === 'hi' ? 'हमेशा के लिए सेव करें' : 'Save as Default'}
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

