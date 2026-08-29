import { useState, useRef, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  Check, 
  RefreshCw, 
  Link as LinkIcon,
  Trash2,
  User,
  Smile,
  ImageIcon
} from 'lucide-react';
import UserAvatar from './UserAvatar';

export interface AvatarSelectionData {
  avatar: string;
  avatarType: 'personal' | 'cloud' | 'emoji' | 'initials';
  avatarBg?: string;
}

interface AvatarSelectorModalProps {
  isOpen: boolean;
  currentAvatar?: string;
  currentAvatarType?: 'personal' | 'cloud' | 'emoji' | 'initials';
  currentAvatarBg?: string;
  userName?: string;
  equippedAccessory?: string | null;
  onSave: (data: AvatarSelectionData) => void;
  onClose: () => void;
}

// CURATED VECTOR AVATARS (Clean, Crisp SVGs from DiceBear)
const VECTOR_PRESETS = [
  // Students & Scholars (Adventurer)
  { id: 'adv-1', name: 'Scholar Alex', category: 'students', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Alex&backgroundColor=b6e3f4,c0aede,d1d4f9' },
  { id: 'adv-2', name: 'Scholar Maya', category: 'students', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Maya&backgroundColor=ffd5dc,ffdfbf,d1d4f9' },
  { id: 'adv-3', name: 'Scholar Liam', category: 'students', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Liam&backgroundColor=c0aede,b6e3f4,ffdfbf' },
  { id: 'adv-4', name: 'Scholar Zara', category: 'students', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Zara&backgroundColor=ffd5dc,d1d4f9,b6e3f4' },
  { id: 'adv-5', name: 'Scholar Noah', category: 'students', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Noah&backgroundColor=b6e3f4,ffd5dc,c0aede' },
  { id: 'adv-6', name: 'Scholar Anya', category: 'students', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Anya&backgroundColor=d1d4f9,b6e3f4,ffd5dc' },

  // Minimalist (Notionists)
  { id: 'notion-1', name: 'Minimalist Blue', category: 'minimal', url: 'https://api.dicebear.com/9.x/notionists/svg?seed=Jordan&backgroundColor=e0e7ff' },
  { id: 'notion-2', name: 'Minimalist Amber', category: 'minimal', url: 'https://api.dicebear.com/9.x/notionists/svg?seed=Taylor&backgroundColor=fef3c7' },
  { id: 'notion-3', name: 'Minimalist Emerald', category: 'minimal', url: 'https://api.dicebear.com/9.x/notionists/svg?seed=Sam&backgroundColor=dcfce7' },
  { id: 'notion-4', name: 'Minimalist Rose', category: 'minimal', url: 'https://api.dicebear.com/9.x/notionists/svg?seed=Morgan&backgroundColor=fce7f3' },
  { id: 'notion-5', name: 'Minimalist Violet', category: 'minimal', url: 'https://api.dicebear.com/9.x/notionists/svg?seed=Casey&backgroundColor=ede9fe' },
  { id: 'notion-6', name: 'Minimalist Sky', category: 'minimal', url: 'https://api.dicebear.com/9.x/notionists/svg?seed=Riley&backgroundColor=e0f2fe' },

  // Anime / Lorelei
  { id: 'anime-1', name: 'Anime Kenji', category: 'anime', url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Kenji&backgroundColor=b6e3f4,c0aede' },
  { id: 'anime-2', name: 'Anime Hana', category: 'anime', url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Hana&backgroundColor=ffd5dc,d1d4f9' },
  { id: 'anime-3', name: 'Anime Ren', category: 'anime', url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Ren&backgroundColor=c0aede,ffdfbf' },
  { id: 'anime-4', name: 'Anime Yuki', category: 'anime', url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Yuki&backgroundColor=ffdfbf,ffd5dc' },

  // Cyber Bots
  { id: 'bot-1', name: 'Cyber Bot 1', category: 'bots', url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Nexus&backgroundColor=b6e3f4,c0aede' },
  { id: 'bot-2', name: 'Cyber Bot 2', category: 'bots', url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Orbit&backgroundColor=ffd5dc,d1d4f9' },
  { id: 'bot-3', name: 'Cyber Bot 3', category: 'bots', url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Quantum&backgroundColor=d1d4f9,b6e3f4' },
  { id: 'bot-4', name: 'Cyber Bot 4', category: 'bots', url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Vector&backgroundColor=c0aede,ffd5dc' },
];

const EMOJI_PRESETS = [
  { emoji: '🧑‍🎓', label: 'Student' },
  { emoji: '👩‍🎓', label: 'Scholar' },
  { emoji: '👨‍💻', label: 'Coder' },
  { emoji: '👩‍🔬', label: 'Scientist' },
  { emoji: '🧙‍♂️', label: 'Wizard' },
  { emoji: '🚀', label: 'Rocket' },
  { emoji: '🧠', label: 'Brain' },
  { emoji: '⚡', label: 'Electric' },
  { emoji: '🌟', label: 'Star' },
  { emoji: '🎯', label: 'Focus' },
  { emoji: '🦊', label: 'Fox' },
  { emoji: '🦉', label: 'Owl' },
  { emoji: '🐯', label: 'Tiger' },
  { emoji: '🦁', label: 'Lion' },
  { emoji: '🐼', label: 'Panda' },
  { emoji: '🦄', label: 'Unicorn' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '📚', label: 'Books' },
  { emoji: '🏆', label: 'Trophy' },
  { emoji: '💎', label: 'Diamond' },
];

const GRADIENT_THEMES = [
  { id: 'indigo', name: 'Indigo', class: 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600' },
  { id: 'emerald', name: 'Emerald', class: 'bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-600' },
  { id: 'amber', name: 'Amber', class: 'bg-gradient-to-tr from-rose-500 via-amber-500 to-orange-500' },
  { id: 'purple', name: 'Purple', class: 'bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-pink-500' },
  { id: 'cyan', name: 'Cyan', class: 'bg-gradient-to-tr from-cyan-600 via-blue-500 to-indigo-600' },
  { id: 'slate', name: 'Slate', class: 'bg-gradient-to-tr from-slate-800 via-slate-700 to-slate-900' },
];

export default function AvatarSelectorModal({
  isOpen,
  currentAvatar = '🧑‍🎓',
  currentAvatarType = 'emoji',
  currentAvatarBg = 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600',
  userName = 'Student',
  equippedAccessory = null,
  onSave,
  onClose
}: AvatarSelectorModalProps) {
  const [activeTab, setActiveTab] = useState<'vectors' | 'upload' | 'emojis' | 'monogram'>('vectors');
  const [vectorFilter, setVectorFilter] = useState<'all' | 'students' | 'minimal' | 'anime' | 'bots'>('all');
  
  // Selected state
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatar);
  const [selectedType, setSelectedType] = useState<'personal' | 'cloud' | 'emoji' | 'initials'>(currentAvatarType || 'emoji');
  const [selectedBg, setSelectedBg] = useState<string>(currentAvatarBg || GRADIENT_THEMES[0].class);

  // Custom Image URL state
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedAvatar(currentAvatar || '🧑‍🎓');
      setSelectedType(currentAvatarType || 'emoji');
      setSelectedBg(currentAvatarBg || GRADIENT_THEMES[0].class);
      setCustomUrlInput('');
      setUrlError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle local file upload with compression
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (.png, .jpg, .webp)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 320;
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        canvas.width = maxDim;
        canvas.height = maxDim;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, maxDim, maxDim);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setSelectedAvatar(compressedDataUrl);
          setSelectedType('personal');
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = () => {
    if (!customUrlInput.trim()) return;
    if (!customUrlInput.startsWith('http://') && !customUrlInput.startsWith('https://')) {
      setUrlError('URL must start with http:// or https://');
      return;
    }
    setUrlError('');
    setSelectedAvatar(customUrlInput.trim());
    setSelectedType('personal');
  };

  const handleRandomizeVector = () => {
    setIsGenerating(true);
    const styles = ['adventurer', 'notionists', 'lorelei', 'bottts', 'fun-emoji', 'micah'];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    const randomSeed = Math.random().toString(36).substring(2, 9);
    const generatedUrl = `https://api.dicebear.com/9.x/${randomStyle}/svg?seed=${randomSeed}&backgroundColor=b6e3f4,ffd5dc,c0aede,d1d4f9`;
    
    setTimeout(() => {
      setSelectedAvatar(generatedUrl);
      setSelectedType('cloud');
      setIsGenerating(false);
    }, 200);
  };

  const handleSave = () => {
    onSave({
      avatar: selectedAvatar,
      avatarType: selectedType,
      avatarBg: selectedBg
    });
    onClose();
  };

  const filteredVectors = vectorFilter === 'all' 
    ? VECTOR_PRESETS 
    : VECTOR_PRESETS.filter(v => v.category === vectorFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200/90 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* CLEAN MINIMAL HEADER */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Choose Avatar
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Personalize how you appear in study rooms & leaderboards
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* LIVE PREVIEW & RING ACCENT ROW */}
        <div className="px-5 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <UserAvatar
              avatar={selectedAvatar}
              name={userName}
              avatarType={selectedType}
              avatarBg={selectedBg}
              size="lg"
              accessory={equippedAccessory}
              showBadge={true}
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-slate-900">{userName}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 uppercase tracking-wide">
                  {selectedType === 'cloud' && 'Vector'}
                  {selectedType === 'personal' && 'Custom'}
                  {selectedType === 'emoji' && 'Emoji'}
                  {selectedType === 'initials' && 'Monogram'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Live avatar preview
              </p>
            </div>
          </div>

          {/* ACCENT RING THEME */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Ring Accent
            </span>
            <div className="flex items-center space-x-1.5">
              {GRADIENT_THEMES.map((theme) => {
                const isSelected = selectedBg === theme.class;
                return (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedBg(theme.class)}
                    title={theme.name}
                    className={`w-5 h-5 rounded-full ${theme.class} transition cursor-pointer ${
                      isSelected ? 'ring-2 ring-slate-900 ring-offset-2 scale-110' : 'opacity-60 hover:opacity-100 hover:scale-105'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* SEGMENTED CONTROL TABS */}
        <div className="px-5 pt-3">
          <div className="bg-slate-100/90 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setActiveTab('vectors')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                activeTab === 'vectors'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Vectors</span>
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              <span>Photo</span>
            </button>

            <button
              onClick={() => setActiveTab('emojis')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                activeTab === 'emojis'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smile className="w-3.5 h-3.5 text-amber-600" />
              <span>Emojis</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('monogram');
                setSelectedType('initials');
                setSelectedAvatar('');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                activeTab === 'monogram'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5 text-slate-600" />
              <span>Monogram</span>
            </button>
          </div>
        </div>

        {/* TAB CONTENTS (SCROLLABLE) */}
        <div className="p-5 overflow-y-auto max-h-[340px] flex-1">
          
          {/* TAB 1: VECTORS */}
          {activeTab === 'vectors' && (
            <div className="space-y-3.5">
              {/* FILTER PILLS & RANDOMIZE */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-1 overflow-x-auto pb-1">
                  {(['all', 'students', 'minimal', 'anime', 'bots'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setVectorFilter(filter)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition cursor-pointer ${
                        vectorFilter === filter
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleRandomizeVector}
                  disabled={isGenerating}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition flex items-center space-x-1 shrink-0 cursor-pointer active:scale-95"
                >
                  <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>Randomize 🎲</span>
                </button>
              </div>

              {/* CLEAN AVATAR GRID (No text truncation noise) */}
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                {filteredVectors.map((item) => {
                  const isSelected = selectedAvatar === item.url && selectedType === 'cloud';
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedAvatar(item.url);
                        setSelectedType('cloud');
                      }}
                      title={item.name}
                      className={`aspect-square rounded-xl bg-slate-50 border p-1.5 transition flex items-center justify-center relative cursor-pointer group ${
                        isSelected
                          ? 'border-indigo-600 ring-2 ring-indigo-600 ring-offset-1 bg-indigo-50/40 shadow-xs'
                          : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-100/70'
                      }`}
                    >
                      <img
                        src={item.url}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD PHOTO */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* UPLOAD DROPBOX */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition group"
              >
                <div className="w-11 h-11 rounded-full bg-white border border-slate-200 group-hover:border-indigo-300 shadow-2xs flex items-center justify-center text-slate-600 group-hover:text-indigo-600 transition mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">
                  Click to browse image
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  PNG, JPG or WebP (max 5MB)
                </p>
              </div>

              {/* URL IMPORT */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Or paste image URL</span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => {
                      setCustomUrlInput(e.target.value);
                      setUrlError('');
                    }}
                    placeholder="https://example.com/photo.jpg"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                  />
                  <button
                    onClick={handleApplyCustomUrl}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {urlError && <p className="text-[11px] text-rose-500">{urlError}</p>}
              </div>

              {selectedType === 'personal' && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 text-xs text-slate-700">
                  <span className="flex items-center space-x-1.5 font-medium">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Custom image selected</span>
                  </span>
                  <button
                    onClick={() => {
                      setSelectedAvatar('🧑‍🎓');
                      setSelectedType('emoji');
                      setCustomUrlInput('');
                    }}
                    className="text-rose-600 hover:text-rose-700 text-[11px] font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EMOJIS */}
          {activeTab === 'emojis' && (
            <div className="grid grid-cols-5 gap-2.5">
              {EMOJI_PRESETS.map((item) => {
                const isSelected = selectedAvatar === item.emoji && selectedType === 'emoji';
                return (
                  <button
                    key={item.emoji}
                    onClick={() => {
                      setSelectedAvatar(item.emoji);
                      setSelectedType('emoji');
                    }}
                    title={item.label}
                    className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition cursor-pointer relative ${
                      isSelected
                        ? 'bg-amber-50 border-2 border-amber-500 shadow-xs scale-105'
                        : 'bg-slate-50 border border-slate-200/80 hover:bg-slate-100 hover:scale-105'
                    }`}
                  >
                    <span>{item.emoji}</span>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-xs text-[8px]">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB 4: MONOGRAM */}
          {activeTab === 'monogram' && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col items-center text-center space-y-3">
              <div className={`w-16 h-16 rounded-2xl ${selectedBg} text-white font-bold text-xl flex items-center justify-center shadow-sm`}>
                {userName ? userName.slice(0, 2).toUpperCase() : 'ST'}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">
                  Dynamic Monogram Avatar
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Generates clean two-letter initials based on your name. Choose your preferred accent color above.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* CLEAN FOOTER */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 flex items-center space-x-1.5"
          >
            <span>Save Avatar</span>
          </button>
        </div>

      </div>
    </div>
  );
}
