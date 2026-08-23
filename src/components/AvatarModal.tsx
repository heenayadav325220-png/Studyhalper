import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { saveAvatarBase64 } from '../utils/avatarStorage';

type AvatarModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (avatarSrc: string) => void;
  currentAvatar?: string | null;
};

const PRESET_AVATARS: string[] = [
  'https://api.dicebear.com/6.x/adventurer/png?seed=astral',
  'https://api.dicebear.com/6.x/identicon/png?seed=nebula',
  'https://api.dicebear.com/6.x/gridy/png?seed=aurora',
  'https://api.dicebear.com/6.x/avataaars/png?seed=apollo',
  'https://api.dicebear.com/6.x/jdenticon/png?seed=orion',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?q=80&w=800&auto=format&fit=crop&crop=faces'
];

export default function AvatarModal({ isOpen, onClose, onSelect, currentAvatar }: AvatarModalProps) {
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      setUploadPreview(null);
      setUploadFileName('');
    }
  }, [isOpen]);

  function handlePresetClick(url: string) {
    onSelect(url);
    saveAvatarBase64(url);
    onClose();
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('File read error'));
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFileName(file.name);

    try {
      const base64 = await fileToBase64(file);
      setUploadPreview(base64);
    } catch (err) {
      console.error('Failed to read file', err);
    }
  }

  async function handleSaveUpload() {
    if (!uploadPreview) return;
    saveAvatarBase64(uploadPreview);
    onSelect(uploadPreview);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black"
      />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="relative max-w-2xl w-full bg-slate-900 text-slate-50 rounded-lg shadow-xl p-6 ring-1 ring-slate-800"
      >
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold">Choose Avatar</h3>
          <button
            onClick={onClose}
            className="ml-4 p-2 -mr-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Close avatar modal"
          >
            ✕
          </button>
        </div>

        <div className="mt-4">
          <p className="text-sm text-slate-400">Pick a preset avatar</p>
          <div className="grid grid-cols-4 gap-3 mt-3">
            {PRESET_AVATARS.map((url) => (
              <button
                key={url}
                onClick={() => handlePresetClick(url)}
                className="rounded overflow-hidden bg-slate-800 p-1 hover:scale-105 transition-transform"
                style={{ minWidth: 44, minHeight: 44 }}
                aria-label="Select preset avatar"
              >
                <img src={url} alt="avatar option" className="w-full h-14 object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-sm text-slate-400">Or upload your own photo</p>
          <div className="mt-2 flex items-center gap-3">
            <label
              htmlFor="avatar-upload"
              className="inline-flex items-center justify-center h-11 w-44 rounded bg-slate-800 hover:bg-slate-700 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Choose file
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>

            <div className="flex items-center gap-3">
              {uploadPreview ? (
                <img src={uploadPreview} alt="preview" className="w-14 h-14 rounded object-cover" />
              ) : currentAvatar ? (
                <img src={currentAvatar} alt="current avatar" className="w-14 h-14 rounded object-cover" />
              ) : (
                <div className="w-14 h-14 rounded bg-slate-800" />
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleSaveUpload}
                  disabled={!uploadPreview}
                  className="inline-flex items-center h-11 px-3 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                >
                  Upload & Save
                </button>
                <button
                  onClick={() => { setUploadPreview(null); setUploadFileName(''); }}
                  className="inline-flex items-center h-11 px-3 rounded bg-slate-800 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
          {uploadFileName && <p className="mt-2 text-xs text-slate-400">Selected: {uploadFileName}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="h-11 px-4 rounded bg-slate-800 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400">
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}
