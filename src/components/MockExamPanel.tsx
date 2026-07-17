import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Language, t } from '../services/translations';
import { Award, BookOpen, BrainCircuit, Check, CheckCircle2, ChevronRight, Play } from 'lucide-react';
import { subscribeToExams, saveMockExam } from '../services/firebaseDb';
import { MockExam, ExamQuestion } from '../types';

interface MockExamPanelProps {
  lang: Language;
  userId: string;
  onEarnXp: (amount: number) => void;
}

export const MockExamPanel: React.FC<MockExamPanelProps> = ({
  lang,
  userId,
  onEarnXp
}) => {
  const [exams, setExams] = useState<MockExam[]>([]);
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);

  // Active Exam state
  const [activeExam, setActiveExam] = useState<ExamQuestion[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [examId, setExamId] = useState('');

  // Finished review state
  const [showResults, setShowResults] = useState<MockExam | null>(null);

  // Subscribe to student's mock exams list from Firebase
  useEffect(() => {
    const unsubscribe = subscribeToExams(userId, (syncedExams) => {
      setExams(syncedExams);
    });
    return () => unsubscribe();
  }, [userId]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !topic.trim() || loading) return;

    setLoading(true);
    setActiveExam(null);
    setShowResults(null);
    setSelectedAnswers([]);
    setCurrentIndex(0);

    try {
      const res = await fetch('/api/generate-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, topic, language: lang })
      });

      if (!res.ok) {
        throw new Error('AI generating service is busy or offline. Please configure GEMINI_API_KEY.');
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setActiveExam(data.questions);
      setExamId(Math.random().toString(36).substring(2, 11));
    } catch (err: any) {
      alert(`Error: ${err.message || 'Failed to generate mock exam.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (optionIdx: number) => {
    const updated = [...selectedAnswers];
    updated[currentIndex] = optionIdx;
    setSelectedAnswers(updated);
  };

  const handleNext = () => {
    if (!activeExam) return;
    if (currentIndex < activeExam.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSubmitExam = async () => {
    if (!activeExam) return;

    // Calculate score
    let correctCount = 0;
    activeExam.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctOptionIndex) {
        correctCount += 1;
      }
    });

    const calculatedScore = Math.round((correctCount / activeExam.length) * 100);

    const detailedFeedback = lang === 'en'
      ? `Great attempt! You scored ${calculatedScore}%. You answered ${correctCount} out of ${activeExam.length} questions correctly. Read the explanations to improve your knowledge.`
      : `शानदार प्रयास! आपने ${calculatedScore}% स्कोर किया। आपने ${activeExam.length} में से ${correctCount} प्रश्नों के सही उत्तर दिए। अपने ज्ञान को बेहतर बनाने के लिए स्पष्टीकरण पढ़ें।`;

    const examRecord: MockExam = {
      id: examId,
      userId,
      subject,
      topic,
      questionsJson: JSON.stringify(activeExam),
      submittedAnswersJson: JSON.stringify(selectedAnswers),
      score: calculatedScore,
      completed: true,
      feedback: detailedFeedback,
      timestamp: new Date().toISOString()
    };

    try {
      await saveMockExam(examRecord);
      setShowResults(examRecord);
      setActiveExam(null);
      onEarnXp(150); // Complete 1 mock exam earn 150 XP!
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generator Form */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit">
          <h3 className="font-semibold text-slate-100 text-sm mb-4 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-indigo-400" />
            {t('generateExam', lang)}
          </h3>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">{t('subject', lang)}</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Physics, History, Biology"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">{t('topic', lang)}</label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Newton's Laws, French Revolution"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-slate-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl text-sm transition duration-150 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('generating', lang)}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  {t('startExam', lang)}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Active Exam and Historic Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Exam Board */}
          {activeExam && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl"
            >
              <div className="flex justify-between items-center mb-6">
                <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs px-3 py-1 rounded-full font-mono font-medium">
                  Question {currentIndex + 1} of {activeExam.length}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Subject: {subject}
                </span>
              </div>

              {/* Question */}
              <h4 className="font-semibold text-slate-100 text-lg mb-6 leading-relaxed">
                {activeExam[currentIndex].questionText}
              </h4>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {activeExam[currentIndex].options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(idx)}
                    className={`w-full p-4 rounded-xl border text-left text-sm transition-all duration-200 active:scale-[0.99] flex items-center justify-between ${
                      selectedAnswers[currentIndex] === idx
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-medium'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span>{option}</span>
                    {selectedAnswers[currentIndex] === idx && (
                      <CheckCircle2 className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {/* Footer navigation */}
              <div className="flex justify-end gap-3">
                {currentIndex < activeExam.length - 1 ? (
                  <button
                    onClick={handleNext}
                    disabled={selectedAnswers[currentIndex] === undefined}
                    className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 font-semibold py-2.5 px-5 rounded-xl text-sm transition flex items-center gap-2 active:scale-95"
                  >
                    {lang === 'en' ? 'Next' : 'अगला'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitExam}
                    disabled={selectedAnswers[currentIndex] === undefined}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition flex items-center gap-2 active:scale-95"
                  >
                    <Award className="w-4 h-4" />
                    {t('submitExam', lang)}
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Detailed Explanations / Results Box */}
          {showResults && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-6 shadow-xl space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Award className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-100 text-lg">Exam Complete!</h4>
                  <p className="text-xs text-slate-400">Review your questions, choices and detailed AI explanations.</p>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-center">
                  <span className="block text-xs text-slate-500 font-mono">SCORE</span>
                  <span className={`text-2xl font-black ${showResults.score >= 60 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {showResults.score}%
                  </span>
                </div>
                <div className="text-center border-l border-slate-800">
                  <span className="block text-xs text-slate-500 font-mono">STATUS</span>
                  <span className={`text-sm font-semibold ${showResults.score >= 60 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {showResults.score >= 60 ? 'Passed ✅' : 'Needs Study 📚'}
                  </span>
                </div>
              </div>

              {/* FeedBack Text */}
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/50 italic">
                "{showResults.feedback}"
              </p>

              {/* Question list Review */}
              <div className="space-y-4">
                {JSON.parse(showResults.questionsJson).map((q: ExamQuestion, idx: number) => {
                  const subAnswers = JSON.parse(showResults.submittedAnswersJson);
                  const isCorrect = subAnswers[idx] === q.correctOptionIndex;

                  return (
                    <div key={idx} className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-xs font-mono text-slate-500 flex-shrink-0">Q{idx + 1}</span>
                        <h5 className="font-medium text-slate-200 text-sm flex-1">{q.questionText}</h5>
                        {isCorrect ? (
                          <span className="text-xs text-emerald-400 font-mono flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            <Check className="w-3.5 h-3.5" /> Correct
                          </span>
                        ) : (
                          <span className="text-xs text-rose-400 font-mono flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            Incorrect
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-6">
                        {q.options.map((opt, optIdx) => {
                          const wasSelected = subAnswers[idx] === optIdx;
                          const isRightOption = q.correctOptionIndex === optIdx;

                          let optionClass = 'bg-slate-900 border-slate-800 text-slate-400';
                          if (wasSelected) optionClass = 'bg-rose-500/10 border-rose-500/30 text-rose-300';
                          if (isRightOption) optionClass = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-medium';

                          return (
                            <div key={optIdx} className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${optionClass}`}>
                              <span>{opt}</span>
                              {isRightOption && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                            </div>
                          );
                        })}
                      </div>

                      <p className="text-xs text-indigo-300 bg-indigo-950/30 border border-indigo-950/50 rounded-lg p-3 pl-6 leading-relaxed">
                        <strong className="block text-indigo-400 mb-1 font-mono">AI TUTOR EXPLANATION:</strong>
                        {q.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Historic Mock Exams taken */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h4 className="font-bold text-slate-200 text-sm mb-4">Exam History ({exams.length})</h4>

            {exams.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs font-mono">
                {t('noExamsYet', lang)}
              </div>
            ) : (
              <div className="space-y-3">
                {exams.map((ex) => (
                  <div
                    key={ex.id}
                    onClick={() => {
                      setShowResults(ex);
                      setActiveExam(null);
                    }}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 hover:border-slate-700 cursor-pointer transition flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-slate-200 text-sm">{ex.subject}</h5>
                        <p className="text-[11px] text-slate-500 font-mono">Topic: {ex.topic}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-sm font-black ${ex.score >= 60 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {ex.score}%
                      </span>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {new Date(ex.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
