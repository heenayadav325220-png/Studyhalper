import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  createQuizRoomApi, 
  joinQuizRoomApi, 
  startQuizMatchApi, 
  submitQuizAnswerApi, 
  subscribeToQuizRoom, 
  subscribeToParticipants,
  QuizRoom,
  QuizParticipant
} from '../services/multiplayerService';
import { useAuth } from '../context/AuthContext';
import { Trophy, Users, Play, Copy, Check, ArrowLeft, Clock, Award, Sparkles } from 'lucide-react';

interface MultiplayerBattleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddXp?: (xp: number) => void;
}

export const MultiplayerBattleModal: React.FC<MultiplayerBattleModalProps> = ({ isOpen, onClose, onAddXp }) => {
  const { currentUser } = useAuth();
  const [view, setView] = useState<'menu' | 'create' | 'join' | 'lobby' | 'battle' | 'results'>('menu');
  const [subject, setSubject] = useState('Physics');
  const [topic, setTopic] = useState('Mechanics & Kinematics');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  
  const [activeRoom, setActiveRoom] = useState<QuizRoom | null>(null);
  const [participants, setParticipants] = useState<QuizParticipant[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<{ isCorrect: boolean; correctOption: number; pointsEarned: number } | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [copiedCode, setCopiedCode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Subscribe to room updates when in lobby or battle
  useEffect(() => {
    if (!activeRoom?.id) return;
    const unsubRoom = subscribeToQuizRoom(activeRoom.id, (room) => {
      if (room) {
        setActiveRoom(room);
        setCurrentQuestionIndex(room.currentQuestionIndex || 0);
        if (room.status === 'LIVE' && view === 'lobby') {
          setView('battle');
          setSelectedOption(null);
          setAnswerResult(null);
          setTimeLeft(15);
        } else if (room.status === 'COMPLETED' && view === 'battle') {
          setView('results');
          if (onAddXp) onAddXp(100);
        }
      }
    });

    const unsubParts = subscribeToParticipants(activeRoom.id, (parts) => {
      setParticipants(parts);
    });

    return () => {
      unsubRoom();
      unsubParts();
    };
  }, [activeRoom?.id, view]);

  // Question timer countdown
  useEffect(() => {
    if (view !== 'battle' || !activeRoom || activeRoom.status !== 'LIVE' || answerResult !== null) return;
    if (timeLeft <= 0) {
      if (selectedOption === null) {
        handleAnswerSubmit(-1); // Time out
      }
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [view, activeRoom?.status, timeLeft, answerResult, selectedOption]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const room = await createQuizRoomApi({ subject, topic, difficulty, questionCount, language: 'English' });
      setActiveRoom(room);
      setView('lobby');
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create room.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const { room } = await joinQuizRoomApi(roomCodeInput.trim());
      setActiveRoom(room);
      setView('lobby');
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to join room.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartMatch = async () => {
    if (!activeRoom) return;
    try {
      await startQuizMatchApi(activeRoom.id);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to start match.");
    }
  };

  const handleAnswerSubmit = async (optIdx: number) => {
    if (!activeRoom || selectedOption !== null) return;
    setSelectedOption(optIdx);
    const responseTimeMs = (15 - timeLeft) * 1000;
    try {
      const res = await submitQuizAnswerApi({
        roomId: activeRoom.id,
        questionIndex: currentQuestionIndex,
        selectedOption: optIdx,
        responseTimeMs
      });
      setAnswerResult({
        isCorrect: res.isCorrect,
        correctOption: res.correctOption,
        pointsEarned: res.pointsEarned
      });

      // Auto advance after 2.5s
      setTimeout(() => {
        if (currentQuestionIndex + 1 < (activeRoom.questions?.length || 0)) {
          setSelectedOption(null);
          setAnswerResult(null);
          setTimeLeft(15);
        } else {
          setView('results');
        }
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit answer.");
    }
  };

  const copyRoomCode = () => {
    if (!activeRoom?.roomCode) return;
    navigator.clipboard.writeText(activeRoom.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (!isOpen) return null;

  const currentQuestion = activeRoom?.questions?.[currentQuestionIndex];
  const isHost = activeRoom?.hostId === currentUser?.uid;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
            <div className="flex items-center space-x-3">
              {view !== 'menu' && view !== 'results' && (
                <button 
                  onClick={() => setView('menu')}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div className="flex items-center space-x-2">
                <Trophy className="w-6 h-6 text-indigo-400" />
                <h2 className="text-lg font-bold text-white tracking-wide">Multiplayer Quiz Battle Arena</h2>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white font-semibold px-3 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition text-sm"
            >
              Close
            </button>
          </div>

          {/* Body content */}
          <div className="p-6 overflow-y-auto flex-1">
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {errorMsg}
              </div>
            )}

            {/* 1. MENU VIEW */}
            {view === 'menu' && (
              <div className="space-y-6 text-center py-6">
                <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/30">
                  <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white mb-2">Real-Time Multiplayer Match</h3>
                  <p className="text-slate-400 text-sm max-w-md mx-auto">
                    Challenge real students worldwide, answer AI-generated questions synchronously, and climb the live scoreboard!
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto pt-4">
                  <button
                    onClick={() => setView('create')}
                    className="p-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition flex flex-col items-center justify-center space-y-2 border border-indigo-400/30"
                  >
                    <Play className="w-6 h-6" />
                    <span>Create Quiz Room</span>
                    <span className="text-xs text-indigo-200 font-normal">Host & invite friends</span>
                  </button>

                  <button
                    onClick={() => setView('join')}
                    className="p-5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition flex flex-col items-center justify-center space-y-2"
                  >
                    <Users className="w-6 h-6 text-indigo-400" />
                    <span>Join with Code</span>
                    <span className="text-xs text-slate-400 font-normal">Enter 6-digit room code</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. CREATE ROOM VIEW */}
            {view === 'create' && (
              <form onSubmit={handleCreateRoom} className="space-y-4 max-w-md mx-auto">
                <h3 className="text-xl font-bold text-white mb-4">Configure Battle Room</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Subject</label>
                  <select 
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Biology">Biology</option>
                    <option value="Computer Science">Computer Science</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Topic / Chapter</label>
                  <input 
                    type="text" 
                    value={topic} 
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Electromagnetism or Calculus"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Difficulty</label>
                    <select 
                      value={difficulty} 
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard (JEE/NEET)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Questions</label>
                    <select 
                      value={questionCount} 
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value={5}>5 Questions</option>
                      <option value={10}>10 Questions</option>
                      <option value={15}>15 Questions</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
                >
                  {loading ? <Sparkles className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                  <span>{loading ? 'Generating AI Questions...' : 'Create & Open Lobby'}</span>
                </button>
              </form>
            )}

            {/* 3. JOIN ROOM VIEW */}
            {view === 'join' && (
              <form onSubmit={handleJoinRoom} className="space-y-4 max-w-md mx-auto text-center py-6">
                <h3 className="text-xl font-bold text-white mb-2">Enter Room Code</h3>
                <p className="text-slate-400 text-sm mb-6">Ask your friend for their 6-digit multiplayer room code.</p>
                <input 
                  type="text" 
                  value={roomCodeInput} 
                  onChange={(e) => setRoomCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="e.g. 482910"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-center text-3xl font-black tracking-widest text-indigo-300 focus:outline-none focus:border-indigo-500"
                  required
                />
                <button
                  type="submit"
                  disabled={loading || roomCodeInput.length < 6}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
                >
                  {loading ? <Sparkles className="w-5 h-5 animate-spin" /> : <Users className="w-5 h-5" />}
                  <span>{loading ? 'Joining Room...' : 'Join Battle Room'}</span>
                </button>
              </form>
            )}

            {/* 4. WAITING LOBBY */}
            {view === 'lobby' && activeRoom && (
              <div className="space-y-6">
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Room Code</span>
                    <div className="text-3xl font-black text-indigo-400 tracking-wider mt-0.5">{activeRoom.roomCode}</div>
                  </div>
                  <button
                    onClick={copyRoomCode}
                    className="px-4 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-xl text-indigo-300 font-semibold text-sm flex items-center space-x-2 transition"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Connected Participants ({participants.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {participants.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-sm">
                            {p.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-white font-semibold text-sm">{p.displayName}</div>
                            <div className="text-xs text-slate-400">{p.userId === activeRoom.hostId ? '👑 Host' : 'Ready'}</div>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full">Ready</span>
                      </div>
                    ))}
                  </div>
                </div>

                {isHost ? (
                  <button
                    onClick={handleStartMatch}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
                  >
                    <Play className="w-5 h-5" />
                    <span>Start Quiz Battle Now</span>
                  </button>
                ) : (
                  <div className="text-center py-4 text-slate-400 text-sm animate-pulse">
                    Waiting for host to start the match...
                  </div>
                )}
              </div>
            )}

            {/* 5. LIVE BATTLE ARENA */}
            {view === 'battle' && activeRoom && currentQuestion && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Question {currentQuestionIndex + 1} of {activeRoom.questions.length}
                  </div>
                  <div className="flex items-center space-x-2 px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 rounded-full text-indigo-300 text-sm font-bold">
                    <Clock className="w-4 h-4" />
                    <span>{timeLeft}s</span>
                  </div>
                </div>

                {/* Question Card */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-6 leading-relaxed">
                    {currentQuestion.questionText || currentQuestion.question}
                  </h3>

                  <div className="grid grid-cols-1 gap-3">
                    {(currentQuestion.options || []).map((opt: string, idx: number) => {
                      let btnStyle = "bg-slate-800/80 border-slate-700 hover:bg-slate-700/80 text-white";
                      if (selectedOption !== null) {
                        if (idx === answerResult?.correctOption) {
                          btnStyle = "bg-emerald-600/30 border-emerald-500 text-emerald-200";
                        } else if (idx === selectedOption) {
                          btnStyle = "bg-red-600/30 border-red-500 text-red-200";
                        } else {
                          btnStyle = "bg-slate-800/40 border-slate-800 text-slate-500 opacity-60";
                        }
                      }
                      return (
                        <button
                          key={idx}
                          disabled={selectedOption !== null}
                          onClick={() => handleAnswerSubmit(idx)}
                          className={`w-full p-4 rounded-xl border text-left font-medium transition flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          <span className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                            {['A', 'B', 'C', 'D'][idx]}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {answerResult && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-4 p-4 rounded-xl border text-sm font-semibold flex items-center justify-between ${
                        answerResult.isCorrect ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-red-500/20 border-red-500/30 text-red-300'
                      }`}
                    >
                      <span>{answerResult.isCorrect ? `Correct! +${answerResult.pointsEarned} pts` : 'Incorrect!'}</span>
                      <span className="text-xs opacity-80">{currentQuestion.explanation}</span>
                    </motion.div>
                  )}
                </div>

                {/* Live Leaderboard mini widget */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Live Scoreboard</h4>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {participants.map((p, idx) => (
                      <div key={p.id} className="flex items-center justify-between px-3 py-2 bg-slate-800/40 rounded-lg text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-indigo-400">#{idx + 1}</span>
                          <span className="text-white font-medium">{p.displayName}</span>
                        </div>
                        <span className="font-bold text-indigo-300">{p.score} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 6. RESULTS SCREEN */}
            {view === 'results' && (
              <div className="space-y-6 text-center py-6">
                <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto border border-amber-500/40">
                  <Award className="w-10 h-10 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white mb-1">Match Completed!</h3>
                  <p className="text-slate-400 text-sm">Here are the final standings for this battle.</p>
                </div>

                <div className="space-y-2 max-w-md mx-auto">
                  {participants.map((p, idx) => (
                    <div 
                      key={p.id} 
                      className={`flex items-center justify-between p-4 rounded-xl border ${
                        idx === 0 ? 'bg-amber-500/10 border-amber-500/40 text-amber-200' : 'bg-slate-800/60 border-slate-700/60 text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="w-6 font-black text-lg text-indigo-400">#{idx + 1}</span>
                        <div className="font-bold text-left">{p.displayName}</div>
                      </div>
                      <div className="text-right font-bold text-indigo-300">{p.score} pts</div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setActiveRoom(null);
                    setView('menu');
                  }}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition"
                >
                  Back to Multiplayer Menu
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
