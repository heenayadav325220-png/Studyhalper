import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Flame, X, Zap } from 'lucide-react';
import { db, collection, query, orderBy, limit, onSnapshot } from '../services/firebase';
import type { UserProfile } from '../types';

interface RealtimeLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  appLanguage?: string;
}

interface LeaderboardUser {
  uid: string;
  name: string;
  xp: number;
  level: number;
  streak: number;
  avatar?: string;
  className?: string;
}

export const RealtimeLeaderboardModal: React.FC<RealtimeLeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  appLanguage = 'en'
}) => {
  const isHi = appLanguage === 'hi';
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);

    if (!db) {
      setLeaderboardUsers([
        {
          uid: currentUser.uid || 'current',
          name: currentUser.name || 'Student',
          xp: currentUser.xp || 100,
          level: currentUser.level || 1,
          streak: currentUser.streak || 0,
          avatar: currentUser.avatar || '🧑‍🎓',
          className: currentUser.className || ''
        }
      ]);
      setLoading(false);
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('xp', 'desc'), limit(25));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: LeaderboardUser[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            uid: docSnap.id,
            name: data.name || data.displayName || 'Student',
            xp: Number(data.xp) || 0,
            level: Number(data.level) || 1,
            streak: Number(data.streak) || 0,
            avatar: data.avatar || data.photoURL || '🧑‍🎓',
            className: data.className || ''
          });
        });

        if (!list.some(u => u.uid === currentUser.uid)) {
          list.push({
            uid: currentUser.uid || 'current',
            name: currentUser.name || 'Student',
            xp: currentUser.xp || 100,
            level: currentUser.level || 1,
            streak: currentUser.streak || 0,
            avatar: currentUser.avatar || '🧑‍🎓',
            className: currentUser.className || ''
          });
          list.sort((a, b) => b.xp - a.xp);
        }

        setLeaderboardUsers(list);
        setLoading(false);
      }, (err) => {
        console.warn("Leaderboard snapshot error:", err);
        setLeaderboardUsers([
          {
            uid: currentUser.uid || 'current',
            name: currentUser.name || 'Student',
            xp: currentUser.xp || 100,
            level: currentUser.level || 1,
            streak: currentUser.streak || 0,
            avatar: currentUser.avatar || '🧑‍🎓',
            className: currentUser.className || ''
          }
        ]);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Failed to subscribe to leaderboard:", e);
      setLeaderboardUsers([
        {
          uid: currentUser.uid || 'current',
          name: currentUser.name || 'Student',
          xp: currentUser.xp || 100,
          level: currentUser.level || 1,
          streak: currentUser.streak || 0,
          avatar: currentUser.avatar || '🧑‍🎓',
          className: currentUser.className || ''
        }
      ]);
      setLoading(false);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto text-slate-100 relative"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-amber-600/30 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-lg font-black text-xl">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-1.5">
                <span>{isHi ? 'लाइव छात्र लीडरबोर्ड' : 'Live Real-Time Leaderboard'}</span>
              </h3>
              <p className="text-xs text-amber-200/80">
                {isHi ? 'रियल-टाइम XP और स्कोर रैंकिंग' : 'Top performers ranked by actual XP in real-time'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-3 max-h-[65vh] overflow-y-auto no-scrollbar">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400 font-medium">
                {isHi ? 'रियल-टाइम लीडरबोर्ड लोड हो रहा है...' : 'Syncing live leaderboard from Firestore...'}
              </p>
            </div>
          ) : leaderboardUsers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              {isHi ? 'कोई उपयोगकर्ता नहीं मिला।' : 'No registered users found.'}
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboardUsers.map((u, idx) => {
                const isMe = u.uid === currentUser.uid;
                const rank = idx + 1;
                const crownColor = rank === 1 ? 'text-amber-400 bg-amber-400/20 border-amber-500/40' : rank === 2 ? 'text-slate-300 bg-slate-300/20 border-slate-400/40' : rank === 3 ? 'text-amber-600 bg-amber-600/20 border-amber-600/40' : 'text-slate-400 bg-slate-800 border-slate-700';

                return (
                  <motion.div
                    key={u.uid}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition ${
                      isMe 
                        ? 'bg-indigo-950/60 border-indigo-500/60 shadow-lg ring-1 ring-indigo-500/30' 
                        : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center font-black text-xs shrink-0 ${crownColor}`}>
                        {rank === 1 ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center text-base shrink-0 overflow-hidden">
                        {u.avatar?.startsWith('http') ? (
                          <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{u.avatar || '🧑‍🎓'}</span>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {isMe && (
                            <span className="px-1.5 py-0.5 rounded-md bg-indigo-600/30 text-indigo-300 font-mono text-[9px] border border-indigo-500/30">
                              {isHi ? 'आप' : 'You'}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>Level {u.level}</span>
                          {u.streak > 0 && (
                            <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                              <Flame className="w-3 h-3" /> {u.streak}d
                            </span>
                          )}
                          {u.className && <span className="opacity-75">{u.className}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-black text-amber-400 flex items-center justify-end gap-1">
                        <Zap className="w-3.5 h-3.5" />
                        <span>{u.xp.toLocaleString()} XP</span>
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                        Score Rank #{rank}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-400">
            {isHi ? 'सभी स्कोर और XP रियल-टाइम में सिंक होते हैं।' : 'All scores & XP sync live across registered student accounts.'}
          </p>
        </div>
      </motion.div>
    </div>
  );
};
