import React, { useEffect, useState } from 'react';
import AvatarModal from './AvatarModal';
import { loadAvatarBase64 } from '../utils/avatarStorage';
import { motion } from 'motion/react';

type ProfileAvatarProps = {
  size?: number; // px
  alt?: string;
  onAvatarChange?: (src: string) => void;
};

export default function ProfileAvatar({ size = 44, alt = 'Profile avatar', onAvatarChange }: ProfileAvatarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);

  const FALLBACK = `https://api.dicebear.com/6.x/identicon/png?seed=student_default`;

  useEffect(() => {
    const saved = loadAvatarBase64();
    setAvatarSrc(saved ?? FALLBACK);
  }, []);

  function handleSelect(newSrc: string) {
    setAvatarSrc(newSrc);
    if (onAvatarChange) onAvatarChange(newSrc);
  }

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className="rounded-full overflow-hidden ring-1 ring-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        style={{ width: size, height: size, minWidth: 44, minHeight: 44 }}
        aria-label="Open avatar selector"
      >
        <img src={avatarSrc ?? FALLBACK} alt={alt} className="w-full h-full object-cover" />
      </motion.button>

      <AvatarModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelect={handleSelect}
        currentAvatar={avatarSrc}
      />
    </>
  );
}
