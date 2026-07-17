import React from 'react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';
import { Language, t } from '../services/translations';
import { Sparkles, Flame } from 'lucide-react';

interface PetCompanionWidgetProps {
  profile: UserProfile;
  lang: Language;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const PetCompanionWidget: React.FC<PetCompanionWidgetProps> = ({
  profile,
  lang,
  onUpdateProfile
}) => {
  const xpNeeded = profile.petLevel * 100;
  const progressPercent = Math.min(100, (profile.petXp / xpNeeded) * 100);

  const handleAction = (xpGain: number, _isFeed: boolean) => {
    let newPetXp = profile.petXp + xpGain;
    let newPetLevel = profile.petLevel;
    let leveledUp = false;

    while (newPetXp >= newPetLevel * 100) {
      newPetXp -= newPetLevel * 100;
      newPetLevel += 1;
      leveledUp = true;
    }

    const updatedProfile: Partial<UserProfile> = {
      petXp: newPetXp,
      petLevel: newPetLevel,
      xp: profile.xp + xpGain, // Gain XP for student too!
      level: profile.level + (leveledUp ? 1 : 0) // Level up student if pet leveled up or as dynamic ratio
    };

    onUpdateProfile(updatedProfile);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-3 opacity-10">
        <Sparkles className="w-24 h-24 text-indigo-400" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg text-indigo-400 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          {t('petCompanion', lang)}
        </h3>
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full text-xs font-mono flex items-center gap-1">
          <Flame className="w-4 h-4" />
          {profile.streak} {t('streak', lang)}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Animated Avatar Box */}
        <div className="relative">
          <motion.div
            animate={{
              y: [0, -8, 0],
              rotate: [0, 2, -2, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 p-1 shadow-lg shadow-indigo-500/20 flex items-center justify-center text-4xl"
          >
            🦉
          </motion.div>
          <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white font-mono text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center border-2 border-slate-900">
            {profile.petLevel}
          </div>
        </div>

        {/* Info & Stats */}
        <div className="flex-1 w-full">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-slate-100 text-lg">
              {profile.petName || 'Budo'}
            </span>
            <span className="text-xs text-slate-400">
              (Lvl {profile.petLevel} Companion)
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-3">
            {lang === 'en'
              ? 'Keep studying to level up your pet companion and boost your personal score!'
              : 'अपने पालतू साथी का स्तर बढ़ाने और अपने व्यक्तिगत स्कोर को बढ़ावा देने के लिए अध्ययन जारी रखें!'}
          </p>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
              <span>Companion XP</span>
              <span>{profile.petXp} / {xpNeeded}</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                className="h-full bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"
              />
            </div>
          </div>

          {/* Quick interactive Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => handleAction(50, true)}
              className="flex-1 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 hover:border-indigo-500/50 text-indigo-300 font-medium py-2 px-3 rounded-xl text-xs transition duration-200 active:scale-95 flex items-center justify-center gap-2"
            >
              🍪 {t('feedPet', lang)}
            </button>
            <button
              onClick={() => handleAction(100, false)}
              className="flex-1 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 hover:border-violet-500/50 text-violet-300 font-medium py-2 px-3 rounded-xl text-xs transition duration-200 active:scale-95 flex items-center justify-center gap-2"
            >
              🏋️‍♂️ {t('trainPet', lang)}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
