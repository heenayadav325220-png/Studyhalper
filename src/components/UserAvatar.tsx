import { useState, useEffect } from 'react';
import { Camera } from 'lucide-react';

interface UserAvatarProps {
  avatar?: string;
  name?: string;
  avatarType?: 'personal' | 'cloud' | 'emoji' | 'initials';
  avatarBg?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  accessory?: string | null;
  showBadge?: boolean;
  badgeIcon?: string;
  onClick?: () => void;
  isEditable?: boolean;
  alt?: string;
}

const SIZE_MAP = {
  xs: {
    container: 'w-6 h-6 rounded-lg text-xs',
    text: 'text-[10px]',
    accessory: '-top-1 -right-1 text-[9px]',
    badge: '-bottom-0.5 -right-0.5 w-2.5 h-2.5 text-[6px]',
    camera: 'w-2 h-2'
  },
  sm: {
    container: 'w-8 h-8 rounded-xl text-sm',
    text: 'text-xs',
    accessory: '-top-1.5 -right-1.5 text-xs',
    badge: '-bottom-0.5 -right-0.5 w-3 h-3 text-[7px]',
    camera: 'w-2.5 h-2.5'
  },
  md: {
    container: 'w-10 h-10 rounded-xl text-lg',
    text: 'text-sm',
    accessory: '-top-2 -right-2 text-sm',
    badge: '-bottom-1 -right-1 w-3.5 h-3.5 text-[8px]',
    camera: 'w-3 h-3'
  },
  lg: {
    container: 'w-12 h-12 rounded-2xl text-2xl',
    text: 'text-base',
    accessory: '-top-2 -right-2 text-base',
    badge: '-bottom-1 -right-1 w-4 h-4 text-[9px]',
    camera: 'w-3.5 h-3.5'
  },
  xl: {
    container: 'w-16 h-16 rounded-2xl text-3xl',
    text: 'text-xl',
    accessory: '-top-2.5 -right-2.5 text-xl',
    badge: '-bottom-1.5 -right-1.5 w-5 h-5 text-xs',
    camera: 'w-4 h-4'
  },
  '2xl': {
    container: 'w-24 h-24 rounded-3xl text-5xl',
    text: 'text-3xl',
    accessory: '-top-3 -right-3 text-2xl',
    badge: '-bottom-2 -right-2 w-7 h-7 text-sm',
    camera: 'w-5 h-5'
  }
};

export default function UserAvatar({
  avatar,
  name = 'Student',
  avatarBg,
  size = 'md',
  className = '',
  accessory = null,
  showBadge = false,
  badgeIcon = '⭐',
  onClick,
  isEditable = false,
  alt
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;

  useEffect(() => {
    setImageError(false);
  }, [avatar]);

  const isImageAvatar = Boolean(
    avatar &&
    !imageError &&
    (avatar.startsWith('http://') ||
     avatar.startsWith('https://') ||
     avatar.startsWith('data:image/'))
  );

  const getInitials = (n: string) => {
    if (!n) return 'S';
    const parts = n.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  const defaultBackground = avatarBg || 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600';

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex shrink-0 select-none ${onClick ? 'cursor-pointer group' : ''} ${className}`}
    >
      <div
        className={`${sizeConfig.container} ${defaultBackground} p-0.5 shadow-sm transition-transform duration-200 ${
          onClick ? 'hover:scale-105 active:scale-95' : ''
        }`}
      >
        <div className="w-full h-full bg-white rounded-[inherit] overflow-hidden flex items-center justify-center relative shadow-inner">
          {isImageAvatar ? (
            <img
              src={avatar}
              alt={alt || `${name}'s Avatar`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : avatar && !avatar.startsWith('http') && !avatar.startsWith('data:') ? (
            <span className="leading-none flex items-center justify-center">
              {avatar}
            </span>
          ) : (
            <div className={`w-full h-full ${defaultBackground} text-white font-black flex items-center justify-center tracking-tight ${sizeConfig.text}`}>
              {getInitials(name)}
            </div>
          )}

          {/* EDIT HOVER OVERLAY */}
          {isEditable && (
            <div className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
              <Camera className={sizeConfig.camera} />
            </div>
          )}
        </div>
      </div>

      {/* ACCESSORY BADGE (TOP RIGHT) */}
      {accessory && (
        <span className={`absolute ${sizeConfig.accessory} leading-none pointer-events-none drop-shadow-md z-10`}>
          {accessory}
        </span>
      )}

      {/* STATUS / RANK BADGE (BOTTOM RIGHT) */}
      {showBadge && (
        <span
          className={`absolute ${sizeConfig.badge} bg-amber-400 rounded-full flex items-center justify-center font-black text-slate-900 shadow-xs border border-white z-10 pointer-events-none`}
        >
          {badgeIcon}
        </span>
      )}
    </div>
  );
}
