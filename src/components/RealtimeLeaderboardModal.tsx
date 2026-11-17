import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
import { syncLeaderboardEntry } from '../services/firebaseDb';
import { safeFetch } from '../services/geminiService';
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

    // Ensure current user is synced to leaderboard when opening modal
    if (currentUser && !auth.currentUser?.isAnonymous) {
      syncLeaderboardEntry(currentUser).catch(() => {});
    }

    // Fetch authoritative leaderboard from backend API immediately
    safeFetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        if (!isMounted || !data.success || !Array.isArray(data.entries)) return;
        const rawList: PublicLeaderboardEntry[] = data.entries.map((d: any) => docToLeaderboardEntry(d.uid, d));
        let rankedList: PublicLeaderboardEntry[];
        if (activeTab === 'xp') {
          rankedList = rawList.sort((a, b) => b.xp - a.xp).slice(0, 10);
        } else {
          const { today, yesterday } = getLocalDateStrings();
          rankedList = filterAndRankStreakEntries(rawList, today, yesterday, 10);
        }
        if (rankedList.length > 0) {
          setEntries(rankedList);
          setLoading(false);
          setError(null);
        }
      })
      .catch(() => {});

    if (!db) {
      setLoading(false);
      return;
    }

    let authTimeout: ReturnType<typeof setTimeout> | null = null;

    const startListener = () => {
      if (!isMounted) return;

      if (!auth.currentUser) {
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

            if (rawList.length > 0) {
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
            }

            const myUid = auth.currentUser?.uid;
            const isRegistered = Boolean(auth.currentUser && !auth.currentUser.isAnonymous);
            const optedIn = currentUser?.showOnLeaderboard !== false;
            const inTopTen = Boolean(myUid && entries.some((item) => item.uid === myUid));

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
          }
        );
      } catch (err) {
        if (!isMounted) return;
        console.warn('Failed to subscribe to leaderboard:', err);
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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-y-auto text-slate-100 font-sans"
        >
        {/* Top Header Bar */}
        <div className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30 font-black text-2xl shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>{isHi ? 'लाइव छात्र लीडरबोर्ड' : 'Live Real-Time Leaderboard'}</span>
              </h2>
              <p className="text-xs sm:text-sm text-amber-300/80 font-medium">
                {activeTab === 'xp'
                  ? isHi ? 'शीर्ष 10 छात्र (रियल-टाइम XP)' : 'Top performers ranked by XP co-existing in real-time'
                  : isHi ? 'शीर्ष 10 छात्र (सक्रिय दैनिक स्ट्रीक)' : 'Top active daily study streaks'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-sm transition cursor-pointer border border-slate-700 shadow-md"
          >
            <X className="w-5 h-5" />
            <span>{isHi ? 'बंद करें / वापस' : 'Close Leaderboard'}</span>
          </button>
        </div>

        {/* Main Content Container */}
        <div className="max-w-3xl w-full mx-auto p-4 sm:p-8 space-y-6 flex-1">
          {/* Segmented Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 max-w-md mx-auto w-full shadow-xl">
            <button
              type="button"
              onClick={() => setActiveTab('xp')}
              className={`py-3 px-4 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'xp'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>{isHi ? 'शीर्ष XP लीडरबोर्ड' : 'Top XP Rankings'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('streak')}
              className={`py-3 px-4 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'streak'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>{isHi ? 'शीर्ष स्ट्रीक' : 'Top Streak'}</span>
            </button>
          </div>

          {/* Content Body */}
          <div className="space-y-3 pb-12">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-amber-500/20" />
                <p className="text-sm text-slate-300 font-bold">
                  {isHi ? 'रियल-टाइम लीडरबोर्ड लोड हो रहा है...' : 'Syncing live leaderboard from cloud...'}
                </p>
              </div>
            ) : error ? (
              <div className="py-16 px-4 text-center space-y-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-bold text-white">
                    {isHi ? 'लीडरबोर्ड लोड नहीं हो सका' : "Couldn't load leaderboard"}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-400">
                    {isHi
                      ? 'कृपया अपना इंटरनेट कनेक्शन जांचें या लॉग इन होकर पुनः प्रयास करें।'
                      : 'Check your connection or sign in, then try again.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition cursor-pointer shadow-lg shadow-indigo-600/30"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{isHi ? 'पुनः प्रयास करें' : 'Retry'}</span>
                </button>
              </div>
            ) : entries.length === 0 ? (
              <div className="py-20 px-4 text-center space-y-3 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                  {activeTab === 'xp' ? <Trophy className="w-7 h-7" /> : <Flame className="w-7 h-7" />}
                </div>
                <p className="text-lg font-black text-white">
                  {isHi ? 'लीडरबोर्ड पर सबसे पहले बनें!' : 'Be the first on the leaderboard'}
                </p>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">
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
              <div className="space-y-3">
                {entries.map((u, idx) => {
                  const isMe = Boolean(myUid && u.uid === myUid);
                  const rank = idx + 1;
                  const crownColor =
                    rank === 1
                      ? 'text-amber-400 bg-amber-400/20 border-amber-500/40 shadow-lg shadow-amber-500/20'
                      : rank === 2
                      ? 'text-slate-300 bg-slate-300/20 border-slate-400/40'
                      : rank === 3
                      ? 'text-amber-600 bg-amber-600/20 border-amber-600/40'
                      : 'text-slate-400 bg-slate-900 border-slate-800';

                  return (
                    <motion.div
                      key={u.uid}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`p-4 sm:p-5 rounded-2xl border flex items-center justify-between transition ${
                        isMe
                          ? 'bg-indigo-950/70 border-indigo-500/70 shadow-xl ring-2 ring-indigo-500/30'
                          : 'bg-slate-900/80 border-slate-800 hover:bg-slate-900 shadow-md'
                      }`}
                    >
                      <div className="flex items-center space-x-4 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black text-sm shrink-0 ${crownColor}`}
                        >
                          {rank === 1 ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shrink-0 overflow-hidden shadow-inner">
                          {renderAvatar(u)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2 truncate">
                            <span className="truncate">{u.name}</span>
                            {isMe && (
                              <span className="px-2 py-0.5 rounded-md bg-indigo-600/30 text-indigo-300 font-mono text-[10px] border border-indigo-500/40 shrink-0">
                                {isHi ? 'आप' : 'You'}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                            <span className="font-semibold">Level {u.level}</span>
                            {activeTab === 'xp' && u.streak > 0 && (
                              <span className="flex items-center gap-1 text-amber-400 font-bold">
                                <Flame className="w-3.5 h-3.5" /> {u.streak}d streak
                              </span>
                            )}
                            {activeTab === 'streak' && (
                              <span className="flex items-center gap-1 text-indigo-300 font-semibold">
                                <Zap className="w-3.5 h-3.5" /> {u.xp.toLocaleString()} XP
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-4">
                        {activeTab === 'xp' ? (
                          <div className="text-sm sm:text-base font-black text-amber-400 flex items-center justify-end gap-1.5">
                            <Zap className="w-4 h-4" />
                            <span>{u.xp.toLocaleString()} XP</span>
                          </div>
                        ) : (
                          <div className="text-sm sm:text-base font-black text-amber-400 flex items-center justify-end gap-1.5">
                            <Flame className="w-4 h-4" />
                            <span>
                              {u.streak} {isHi ? 'दिन' : u.streak === 1 ? 'Day' : 'Days'}
                            </span>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 font-mono mt-1">
                          {isHi ? `रैंक #${rank}` : `Rank #${rank}`}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Current user's own row when outside Top 10 */}
                {selfEntry && (
                  <div className="pt-4 space-y-2">
                    <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-slate-400 px-2">
                      <div className="flex-1 h-px bg-slate-800" />
                      <span>{isHi ? 'आपकी स्थिति (टॉप 10 से बाहर)' : 'Your Standing (Outside Top 10)'}</span>
                      <div className="flex-1 h-px bg-slate-800" />
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl border bg-indigo-950/70 border-indigo-500/70 shadow-xl ring-2 ring-indigo-500/30 flex items-center justify-between">
                      <div className="flex items-center space-x-4 min-w-0">
                        <div className="w-10 h-10 rounded-xl border border-indigo-500/50 bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-black text-xs shrink-0">
                          #11+
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shrink-0 overflow-hidden shadow-inner">
                          {renderAvatar(selfEntry)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2 truncate">
                            <span className="truncate">{selfEntry.name}</span>
                            <span className="px-2 py-0.5 rounded-md bg-indigo-600/30 text-indigo-300 font-mono text-[10px] border border-indigo-500/40 shrink-0">
                              {isHi ? 'आप' : 'You'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                            <span className="font-semibold">Level {selfEntry.level}</span>
                            {selfEntry.streak > 0 && (
                              <span className="flex items-center gap-1 text-amber-400 font-bold">
                                <Flame className="w-3.5 h-3.5" /> {selfEntry.streak}d streak
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-4">
                        {activeTab === 'xp' ? (
                          <div className="text-sm sm:text-base font-black text-amber-400 flex items-center justify-end gap-1.5">
                            <Zap className="w-4 h-4" />
                            <span>{selfEntry.xp.toLocaleString()} XP</span>
                          </div>
                        ) : (
                          <div className="text-sm sm:text-base font-black text-amber-400 flex items-center justify-end gap-1.5">
                            <Flame className="w-4 h-4" />
                            <span>
                              {selfEntry.streak} {isHi ? 'दिन' : selfEntry.streak === 1 ? 'Day' : 'Days'}
                            </span>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 font-mono mt-1">
                          {isHi ? 'आपका स्कोर' : 'Your Rank'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-900 border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-400 mt-auto">
          {isHi
            ? 'यह लीडरबोर्ड केवल उन पंजीकृत छात्रों की लाइव रैंकिंग दिखाता है जिन्होंने दृश्यता चालू रखी है।'
            : 'Live Top rankings of opted-in registered accounts synced in real-time via Cloud & Firestore.'}
        </div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};
