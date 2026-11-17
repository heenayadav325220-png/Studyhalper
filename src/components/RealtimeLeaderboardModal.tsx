import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Trophy, Flame, X, Zap, RefreshCw, AlertCircle } from 'lucide-react';
import {
  auth,
  db,
  collection,
  doc,
  getDoc,
  query,
  orderBy,
  limit,
  onSnapshot
} from '../services/firebase';
import {
  filterAndRankStreakEntries,
  getLocalDateStrings,
  sanitizeLeaderboardAvatar
} from '../utils/leaderboardUtils';
import type { PublicLeaderboardEntry } from '../types';

export { filterAndRankStreakEntries };

interface RealtimeLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  appLanguage?: string;
}

type LeaderboardTab = 'xp' | 'streak';

function docToLeaderboardEntry(id: string, data: any): PublicLeaderboardEntry {
  return {
    uid: typeof data?.uid === 'string' && data.uid ? data.uid : id,
    name: typeof data?.name === 'string' && data.name.trim() ? data.name.trim() : 'Student',
    xp: Math.max(0, Number(data?.xp) || 0),
    streak: Math.max(0, Number(data?.streak) || 0),
    level: Math.max(1, Number(data?.level) || 1),
    avatar: sanitizeLeaderboardAvatar(data?.avatar),
    lastStreakDate: typeof data?.lastStreakDate === 'string' ? data.lastStreakDate : '',
    showOnLeaderboard: data?.showOnLeaderboard !== false,
    updatedAt: data?.updatedAt
  };
}

export const RealtimeLeaderboardModal: React.FC<RealtimeLeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  appLanguage = 'en'
}) => {
  const isHi = appLanguage === 'hi';
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('xp');
  const [entries, setEntries] = useState<PublicLeaderboardEntry[]>([]);
  const [selfEntry, setSelfEntry] = useState<PublicLeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  const handleRetry = useCallback(() => {
    setRetryNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    let unsubscribeSnapshot: (() => void) | null = null;
    let unsubscribeAuth: (() => void) | null = null;

    setLoading(true);
    setError(null);
    setEntries([]);
    setSelfEntry(null);

    if (!db) {
      setLoading(false);
      setError(isHi ? 'लीडरबोर्ड लोड नहीं हो सका' : "Couldn't load leaderboard");
      return;
    }

    let authTimeout: ReturnType<typeof setTimeout> | null = null;

    const startListener = () => {
      if (!isMounted) return;

      if (!auth.currentUser) {
        setLoading(false);
        setError(isHi ? 'लीडरबोर्ड लोड नहीं हो सका' : "Couldn't load leaderboard");
        return;
      }

      try {
        const leaderboardRef = collection(db, 'leaderboard');
        const q =
          activeTab === 'xp'
            ? query(leaderboardRef, orderBy('xp', 'desc'), limit(10))
            : query(leaderboardRef, orderBy('streak', 'desc'), limit(50));

        unsubscribeSnapshot = onSnapshot(
          q,
          async (snapshot) => {
            if (!isMounted) return;

            const rawList: PublicLeaderboardEntry[] = [];
            snapshot.forEach((docSnap) => {
              const entry = docToLeaderboardEntry(docSnap.id, docSnap.data());
              if (entry.showOnLeaderboard !== false) {
                rawList.push(entry);
              }
            });

            let rankedList: PublicLeaderboardEntry[];
            if (activeTab === 'xp') {
              rankedList = rawList.slice(0, 10);
            } else {
              const { today, yesterday } = getLocalDateStrings();
              rankedList = filterAndRankStreakEntries(rawList, today, yesterday, 10);
            }

            setEntries(rankedList);
            setError(null);
            setLoading(false);

            const myUid = auth.currentUser?.uid;
            const isRegistered = Boolean(auth.currentUser && !auth.currentUser.isAnonymous);
            const optedIn = currentUser?.showOnLeaderboard !== false;
            const inTopTen = Boolean(myUid && rankedList.some((item) => item.uid === myUid));

            if (myUid && isRegistered && optedIn && !inTopTen) {
              try {
                const selfSnap = await getDoc(doc(db, 'leaderboard', myUid));
                if (!isMounted) return;
                if (selfSnap.exists()) {
                  const parsedSelf = docToLeaderboardEntry(selfSnap.id, selfSnap.data());
                  setSelfEntry(parsedSelf.showOnLeaderboard !== false ? parsedSelf : null);
                } else {
                  setSelfEntry(null);
                }
              } catch {
                if (isMounted) setSelfEntry(null);
              }
            } else {
              setSelfEntry(null);
            }
          },
          (err) => {
            if (!isMounted) return;
            console.warn('Leaderboard snapshot error:', err);
            setEntries([]);
            setSelfEntry(null);
            setLoading(false);
            setError(isHi ? 'लीडरबोर्ड लोड नहीं हो सका' : "Couldn't load leaderboard");
          }
        );
      } catch (err) {
        if (!isMounted) return;
        console.warn('Failed to subscribe to leaderboard:', err);
        setEntries([]);
        setSelfEntry(null);
        setLoading(false);
        setError(isHi ? 'लीडरबोर्ड लोड नहीं हो सका' : "Couldn't load leaderboard");
      }
    };

    if (auth.currentUser) {
      startListener();
    } else {
      authTimeout = setTimeout(() => {
        if (isMounted && !unsubscribeSnapshot) {
          startListener();
        }
      }, 1500);

      unsubscribeAuth = auth.onAuthStateChanged((user) => {
        if (user && isMounted && !unsubscribeSnapshot) {
          if (authTimeout) clearTimeout(authTimeout);
          startListener();
        }
      });
    }

    return () => {
      isMounted = false;
      if (authTimeout) clearTimeout(authTimeout);
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, [isOpen, activeTab, retryNonce, currentUser?.showOnLeaderboard, isHi]);

  if (!isOpen) return null;

  const myUid = auth.currentUser?.uid || currentUser?.uid;

  const renderAvatar = (entry: PublicLeaderboardEntry) => {
    if (entry.avatar?.startsWith('https://')) {
      return (
        <img
          src={entry.avatar}
          alt={entry.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      );
    }
    return <span>{entry.avatar || '🧑‍🎓'}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto text-slate-100 relative"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-amber-600/30 via-slate-900 to-slate-900 border-b border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-lg font-black text-xl">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-1.5">
                  <span>{isHi ? 'लाइव छात्र लीडरबोर्ड' : 'Live Real-Time Leaderboard'}</span>
                </h3>
                <p className="text-xs text-amber-200/80">
                  {activeTab === 'xp'
                    ? isHi
                      ? 'शीर्ष 10 छात्र (रियल-टाइम XP)'
                      : 'Top 10 performers ranked by XP in real-time'
                    : isHi
                    ? 'शीर्ष 10 छात्र (सक्रिय दैनिक स्ट्रीक)'
                    : 'Top 10 active daily study streaks'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label={isHi ? 'बंद करें' : 'Close leaderboard'}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Segmented Tabs: Top XP | Top Streak */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('xp')}
              className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === 'xp'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isHi ? 'शीर्ष XP' : 'Top XP'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('streak')}
              className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === 'streak'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{isHi ? 'शीर्ष स्ट्रीक' : 'Top Streak'}</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-3 max-h-[60vh] overflow-y-auto no-scrollbar">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-medium">
                {isHi ? 'रियल-टाइम लीडरबोर्ड लोड हो रहा है...' : 'Syncing live leaderboard...'}
              </p>
            </div>
          ) : error ? (
            <div className="py-10 px-4 text-center space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">
                  {isHi ? 'लीडरबोर्ड लोड नहीं हो सका' : "Couldn't load leaderboard"}
                </p>
                <p className="text-xs text-slate-400">
                  {isHi
                    ? 'कृपया अपना इंटरनेट कनेक्शन जांचें या लॉग इन होकर पुनः प्रयास करें।'
                    : 'Check your connection or sign in, then try again.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isHi ? 'पुनः प्रयास करें' : 'Retry'}</span>
              </button>
            </div>
          ) : entries.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-2">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                {activeTab === 'xp' ? <Trophy className="w-5 h-5" /> : <Flame className="w-5 h-5" />}
              </div>
              <p className="text-sm font-bold text-white">
                {isHi ? 'लीडरबोर्ड पर सबसे पहले बनें!' : 'Be the first on the leaderboard'}
              </p>
              <p className="text-xs text-slate-400">
                {activeTab === 'xp'
                  ? isHi
                    ? 'अध्ययन शुरू करें और XP अर्जित कर शीर्ष रैंक हासिल करें।'
                    : 'Start studying and earning XP with a registered account to claim #1.'
                  : isHi
                  ? 'आज 10 मिनट का अध्ययन पूरा करके अपनी दैनिक स्ट्रीक शुरू करें।'
                  : 'Complete a daily study streak today to appear on the Streak board.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((u, idx) => {
                const isMe = Boolean(myUid && u.uid === myUid);
                const rank = idx + 1;
                const crownColor =
                  rank === 1
                    ? 'text-amber-400 bg-amber-400/20 border-amber-500/40'
                    : rank === 2
                    ? 'text-slate-300 bg-slate-300/20 border-slate-400/40'
                    : rank === 3
                    ? 'text-amber-600 bg-amber-600/20 border-amber-600/40'
                    : 'text-slate-400 bg-slate-800 border-slate-700';

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
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl border flex items-center justify-center font-black text-xs shrink-0 ${crownColor}`}
                      >
                        {rank === 1 ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center text-base shrink-0 overflow-hidden">
                        {renderAvatar(u)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-white flex items-center gap-1.5 truncate">
                          <span className="truncate">{u.name}</span>
                          {isMe && (
                            <span className="px-1.5 py-0.5 rounded-md bg-indigo-600/30 text-indigo-300 font-mono text-[9px] border border-indigo-500/30 shrink-0">
                              {isHi ? 'आप' : 'You'}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>Level {u.level}</span>
                          {activeTab === 'xp' && u.streak > 0 && (
                            <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                              <Flame className="w-3 h-3" /> {u.streak}d
                            </span>
                          )}
                          {activeTab === 'streak' && (
                            <span className="flex items-center gap-0.5 text-indigo-300 font-semibold">
                              <Zap className="w-3 h-3" /> {u.xp.toLocaleString()} XP
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      {activeTab === 'xp' ? (
                        <div className="text-xs font-black text-amber-400 flex items-center justify-end gap-1">
                          <Zap className="w-3.5 h-3.5" />
                          <span>{u.xp.toLocaleString()} XP</span>
                        </div>
                      ) : (
                        <div className="text-xs font-black text-amber-400 flex items-center justify-end gap-1">
                          <Flame className="w-3.5 h-3.5" />
                          <span>
                            {u.streak} {isHi ? 'दिन' : u.streak === 1 ? 'Day' : 'Days'}
                          </span>
                        </div>
                      )}
                      <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                        {isHi ? `रैंक #${rank}` : `Rank #${rank}`}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Current user's own row when outside Top 10 */}
              {selfEntry && (
                <div className="pt-2 space-y-1.5">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                    <div className="flex-1 h-px bg-slate-800" />
                    <span>{isHi ? 'आपकी स्थिति (टॉप 10 से बाहर)' : 'Your Rank (Outside Top 10)'}</span>
                    <div className="flex-1 h-px bg-slate-800" />
                  </div>

                  <div className="p-3.5 rounded-2xl border bg-indigo-950/60 border-indigo-500/60 shadow-lg ring-1 ring-indigo-500/30 flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl border border-indigo-500/40 bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-black text-[10px] shrink-0">
                        #11+
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center text-base shrink-0 overflow-hidden">
                        {renderAvatar(selfEntry)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-white flex items-center gap-1.5 truncate">
                          <span className="truncate">{selfEntry.name}</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-indigo-600/30 text-indigo-300 font-mono text-[9px] border border-indigo-500/30 shrink-0">
                            {isHi ? 'आप' : 'You'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>Level {selfEntry.level}</span>
                          {selfEntry.streak > 0 && (
                            <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                              <Flame className="w-3 h-3" /> {selfEntry.streak}d
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      {activeTab === 'xp' ? (
                        <div className="text-xs font-black text-amber-400 flex items-center justify-end gap-1">
                          <Zap className="w-3.5 h-3.5" />
                          <span>{selfEntry.xp.toLocaleString()} XP</span>
                        </div>
                      ) : (
                        <div className="text-xs font-black text-amber-400 flex items-center justify-end gap-1">
                          <Flame className="w-3.5 h-3.5" />
                          <span>
                            {selfEntry.streak} {isHi ? 'दिन' : selfEntry.streak === 1 ? 'Day' : 'Days'}
                          </span>
                        </div>
                      )}
                      <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                        {isHi ? 'आपका स्कोर' : 'Outside Top 10'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-400">
            {isHi
              ? 'यह लीडरबोर्ड केवल उन पंजीकृत छात्रों की लाइव रैंकिंग दिखाता है जिन्होंने दृश्यता चालू रखी है।'
              : 'Live Top 10 rankings of opted-in registered accounts synced via Firestore.'}
          </p>
        </div>
      </motion.div>
    </div>
  );
};
