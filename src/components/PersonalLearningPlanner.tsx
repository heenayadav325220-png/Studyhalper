import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  BrainCircuit, 
  CheckCircle2, 
  AlertCircle, 
  Award, 
  Trash2, 
  Play, 
  Check, 
  Plus, 
  Search, 
  ArrowRight, 
  ChevronRight,
  Clock
} from 'lucide-react';
import { PersonalLearningService, MistakeItem, RevisionItem } from '../services/personalLearningService';
import { showToast } from './Toast';

interface PersonalLearningPlannerProps {
  user: {
    uid: string;
    name: string;
    className?: string;
    schoolName?: string;
    targetGoal?: string;
  };
  appLanguage: string;
  onNavigateToTab: (tab: any, initialTool?: string, customTopic?: string, selectedSubject?: any, prefilledPrompt?: string) => void;
  savedExams?: any[];
}

export default function PersonalLearningPlanner({
  user,
  appLanguage,
  onNavigateToTab,
  savedExams = []
}: PersonalLearningPlannerProps) {
  const [activeSection, setActiveSection] = useState<'planner' | 'mistakes' | 'spaced' | 'insights'>('planner');
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [revisions, setRevisions] = useState<RevisionItem[]>([]);
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);
  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom manual revision state
  const [showAddRevision, setShowAddRevision] = useState(false);
  const [newRevSubject, setNewRevSubject] = useState<'Mathematics' | 'Science' | 'Biology' | 'Physics' | 'Chemistry' | 'English'>('Mathematics');
  const [newRevTopic, setNewRevTopic] = useState('');
  const [newRevPriority, setNewRevPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  const isHindi = appLanguage === 'hi' || appLanguage === 'Hindi';

  // Load stats & lists
  const loadLearningData = async () => {
    try {
      const mistList = await PersonalLearningService.getMistakes(user.uid);
      const revList = await PersonalLearningService.getRevisionTopics(user.uid);
      const stats = await PersonalLearningService.getTopicStats(user.uid);
      
      setMistakes(mistList);
      setRevisions(revList);
      setCompletedTopics(stats.completed);
      setWeakTopics(stats.weak);
    } catch (e) {
      console.error('Error loading personal learning data', e);
    }
  };

  useEffect(() => {
    loadLearningData();
  }, [user.uid, savedExams]);

  // Translate helpers
  const t = (en: string, hi: string) => (isHindi ? hi : en);

  // Spaced repetitions and mistakes stats
  const pendingRevisionsCount = revisions.filter(r => {
    const due = new Date(r.nextDue);
    return due <= new Date();
  }).length;

  const totalMistakesCount = mistakes.length;

  // Next Actions Recommendation Logic
  const getRecommendation = () => {
    // 1. Spaced Repetition Check
    const overdueRev = revisions.find(r => {
      const due = new Date(r.nextDue);
      return due <= new Date();
    });

    if (overdueRev) {
      return {
        type: 'spaced_revision',
        title: t('🔁 Spaced Revision Overdue', '🔁 अंतराल दोहराव लंबित है'),
        desc: t(
          `It is time to review "${overdueRev.topic}" (${overdueRev.subject}) to secure it in long-term memory.`,
          `लंबे समय तक याद रखने के लिए "${overdueRev.topic}" (${overdueRev.subject}) को दोहराने का सही समय है।`
        ),
        actionLabel: t('Revise Now', 'अभी दोहराएं'),
        icon: Clock,
        color: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
        onClick: () => {
          onNavigateToTab(
            'aiTutor',
            undefined,
            overdueRev.topic,
            overdueRev.subject,
            `Please provide a quick spaced revision overview of ${overdueRev.topic} inside the ${overdueRev.subject} curriculum. Detail the core concepts, main equations, and 1 practice exercise.`
          );
        }
      };
    }

    // 2. Unresolved mistakes check
    if (mistakes.length > 0) {
      const randomMistake = mistakes[Math.floor(Math.random() * mistakes.length)];
      return {
        type: 'mistake_fix',
        title: t('❌ Fix Past Mistake', '❌ पुरानी गलती सुधारें'),
        desc: t(
          `You previously missed a question on "${randomMistake.topic}" (${randomMistake.subject}). Let's fix this concept with AI Tutor.`,
          `आपने पहले "${randomMistake.topic}" (${randomMistake.subject}) पर एक प्रश्न गलत किया था। चलिए इसे ट्यूटर के साथ ठीक करते हैं।`
        ),
        actionLabel: t('Fix Now with AI', 'अभी ठीक करें'),
        icon: AlertCircle,
        color: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
        onClick: () => {
          const optionsText = randomMistake.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join(', ');
          const prompt = `I got this question wrong previously in my practice test. Please explain the underlying core concepts step-by-step, explain why the correct answer is option index ${randomMistake.answer + 1}, and help me clear my misconceptions.
Question: "${randomMistake.question}"
Options: [${optionsText}]`;
          onNavigateToTab('aiTutor', undefined, randomMistake.topic, randomMistake.subject, prompt);
        }
      };
    }

    // 3. Subject-based general learning suggestion
    return {
      type: 'new_concept',
      title: t('🎯 Build New Mastery', '🎯 नई अवधारणा सीखें'),
      desc: t(
        `Start an interactive lesson on Physics (Newton's Laws) or Chemistry to boost your XP and pet companion level.`,
        `अपने XP और पालतू साथी के स्तर को बढ़ाने के लिए भौतिकी या रसायन विज्ञान पर एक पाठ शुरू करें।`
      ),
      actionLabel: t('Ask AI Tutor', 'एआई ट्यूटर से पूछें'),
      icon: Sparkles,
      color: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300',
      onClick: () => {
        onNavigateToTab('aiTutor');
      }
    };
  };

  const recommendation = getRecommendation();

  // Handle manual revision creation
  const handleCreateRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRevTopic.trim()) {
      showToast(t('Please enter a topic name', 'कृपया विषय का नाम दर्ज करें'), 'error');
      return;
    }
    await PersonalLearningService.addRevisionTopic(user.uid, newRevSubject, newRevTopic.trim(), newRevPriority);
    showToast(t('Revision topic scheduled successfully!', 'दोहराव विषय सफलतापूर्वक निर्धारित किया गया!'), 'success');
    setNewRevTopic('');
    setShowAddRevision(false);
    loadLearningData();
  };

  const handleResolveMistake = async (id: string) => {
    await PersonalLearningService.removeMistake(user.uid, id);
    showToast(t('Mistake resolved & cleared!', 'गलती को हल कर साफ़ कर दिया गया!'), 'success');
    loadLearningData();
  };

  const handleSpacedCheck = async (id: string) => {
    await PersonalLearningService.completeRevision(user.uid, id);
    showToast(t('Topic reviewed! Spaced interval doubled.', 'विषय दोहराया गया! एआई अंतराल बढ़ा दिया गया।'), 'success');
    loadLearningData();
  };

  // Filter mistakes based on search
  const filteredMistakes = mistakes.filter(m => 
    m.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#0b101d] border border-slate-800/80 rounded-[24px] p-4.5 sm:p-5 shadow-xl relative overflow-hidden space-y-4">
      {/* Decorative subtle ambient lights */}

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="space-y-1">
          <h3 className="font-extrabold text-xs sm:text-sm text-slate-100 tracking-wider uppercase flex items-center space-x-2">
            <BrainCircuit className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>{t('PERSONAL AI LEARNING SYSTEM', 'व्यक्तिगत एआई शिक्षण प्रणाली')}</span>
          </h3>
          <p className="text-[10px] sm:text-xs text-slate-400 font-medium leading-tight">
            {t('Dynamically monitors your progress and recommends next optimal study goals.', 'आपकी प्रगति की निगरानी करता है और अगले अध्ययन लक्ष्यों की सिफारिश करता है।')}
          </p>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex flex-wrap items-center bg-slate-950/60 border border-slate-800/80 p-0.5 rounded-xl shrink-0">
          {[
            { id: 'planner', label: t('Planner', 'नियोजक') },
            { id: 'mistakes', label: t(`Mistakes (${totalMistakesCount})`, `गलतियां (${totalMistakesCount})`) },
            { id: 'spaced', label: t(`Revision (${pendingRevisionsCount})`, `दोहराव (${pendingRevisionsCount})`) },
            { id: 'insights', label: t('Insights', 'विश्लेषण') }
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id as any)}
              className={`px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold transition cursor-pointer ${
                activeSection === sec.id
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-800/60 pt-3 relative z-10">
        <AnimatePresence mode="wait">
          {/* 1. PLANNER & DYNAMIC RECOMMENDATIONS */}
          {activeSection === 'planner' && (
            <motion.div
              key="planner"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              {/* CURRENT CRITICAL NEXT ACTION */}
              <div className={`p-4 rounded-xl border ${recommendation.color} relative overflow-hidden transition-colors duration-300`}>
                <div className="flex items-start space-x-3.5 relative z-10">
                  <div className="p-2 bg-slate-950/50 rounded-lg shrink-0 border border-slate-800">
                    <recommendation.icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[8px] font-black uppercase bg-slate-950/80 text-white px-2 py-0.5 rounded-full border border-slate-800 tracking-wider">
                        {t('RECOMMENDED NEXT ACTION', 'अनुशंसित अगला कदम')}
                      </span>
                      <span className="text-[8px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 animate-pulse">
                        +25 XP BONUS
                      </span>
                    </div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-white">
                      {recommendation.title}
                    </h4>
                    <p className="text-[10px] sm:text-xs text-slate-300 leading-relaxed max-w-2xl">
                      {recommendation.desc}
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={recommendation.onClick}
                      className="px-3.5 py-1.5 bg-slate-900 border border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-white font-bold text-[11px] rounded-lg shadow-sm flex items-center space-x-1.5 cursor-pointer mt-2"
                    >
                      <span>{recommendation.actionLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* CORE STUDY LOOP GRAPH */}
              <div className="bg-[#070b16]/90 border border-slate-800/80 rounded-xl p-3.5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-300">
                    {t('YOUR CONTINUOUS LEARNING LOOP', 'आपका सतत शिक्षण चक्र')}
                  </h4>
                  <span className="text-[9px] font-semibold text-indigo-400">
                    {t('Step-by-Step active retention', 'कदम-दर-कदम सक्रिय प्रतिधारण')}
                  </span>
                </div>
                
                {/* Loop flowchart visual */}
                <div className="grid grid-cols-5 gap-1.5 text-center text-[10px]">
                  {[
                    { step: '1. Learn', hi: '1. सीखें', color: 'bg-blue-500/10 border-blue-500/30 text-blue-300', icon: '📚', tab: 'aiTutor' },
                    { step: '2. Practice', hi: '2. अभ्यास', color: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300', icon: '📝', tab: 'mockExam' },
                    { step: '3. Mistakes', hi: '3. गलतियां', color: 'bg-rose-500/10 border-rose-500/30 text-rose-300', icon: '❌', tab: 'mistakes' },
                    { step: '4. Fix Concept', hi: '4. स्पष्टीकरण', color: 'bg-amber-500/10 border-amber-500/30 text-amber-300', icon: '💡', tab: 'aiTutor' },
                    { step: '5. Revise', hi: '5. दोहराव', color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300', icon: '🔁', tab: 'spaced' }
                  ].map((node, i) => (
                    <div 
                      key={i}
                      onClick={() => {
                        if (node.tab === 'mistakes' || node.tab === 'spaced') {
                          setActiveSection(node.tab as any);
                        } else {
                          onNavigateToTab(node.tab as any);
                        }
                      }}
                      className={`p-2 rounded-lg border flex flex-col items-center justify-center space-y-1 cursor-pointer transition hover:scale-105 ${node.color}`}
                    >
                      <span className="text-sm">{node.icon}</span>
                      <span className="font-extrabold text-[9px] sm:text-[10px] leading-tight truncate max-w-full">
                        {t(node.step, node.hi)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. AUTOMATIC MISTAKE BOOK */}
          {activeSection === 'mistakes' && (
            <motion.div
              key="mistakes"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#060a13] p-3 rounded-xl border border-slate-800">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-xs text-slate-100 flex items-center space-x-1.5">
                    <span>📚 {t('Adaptive Mistake Book', 'गलतियों की पुस्तिका')}</span>
                    <span className="bg-rose-500/20 text-rose-400 text-[8px] font-black tracking-widest px-2 py-0.5 rounded-full border border-rose-500/30 uppercase">
                      {t('AUTO CAPTURE', 'ऑटो कैप्चर')}
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {t('Quizzes auto-save wrong answers. Revise them anytime with AI explaining why they failed.', 'क्विज़ गलत उत्तरों को ऑटो-सेव करते हैं। एआई स्पष्टीकरण के साथ कभी भी दोहराएं।')}
                  </p>
                </div>

                {/* Search mistakes */}
                <div className="relative shrink-0 w-full sm:w-48">
                  <Search className="absolute left-2.5 top-2.5 w-3 h-3 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('Search mistakes...', 'गलतियां खोजें...')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 pl-8 pr-2.5 text-[10px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Mistakes List */}
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
                {filteredMistakes.map((m) => {
                  const optText = m.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join(', ');
                  return (
                    <div key={m.id} className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex flex-col justify-between gap-2.5">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 font-bold text-[8.5px] rounded-full uppercase tracking-wider shrink-0">
                            {m.subject} • {m.topic}
                          </span>
                          <button
                            onClick={() => handleResolveMistake(m.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 rounded-md transition"
                            title={t('Resolve & Remove', 'हल करें और हटाएँ')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] font-bold text-slate-200 leading-snug">
                          {m.question}
                        </p>
                        <p className="text-[9.5px] text-slate-400">
                          <strong className="text-emerald-400 font-bold">{t('Correct Answer:', 'सही उत्तर:')}</strong> {m.options[m.answer]}
                        </p>
                        <p className="text-[9.5px] text-slate-400">
                          <strong className="text-rose-400 font-bold">{t('Your Answer:', 'आपका उत्तर:')}</strong> {m.userAnswer >= 0 ? m.options[m.userAnswer] : t('Timeout', 'समय समाप्त')}
                        </p>
                      </div>

                      {/* Callbacks to navigate tab */}
                      <div className="flex items-center space-x-2 border-t border-slate-900 pt-2 shrink-0">
                        <button
                          onClick={() => {
                            const prompt = `Please carefully analyze why my previous answer was incorrect and explain the underlying topic "${m.topic}".
Question: "${m.question}"
Options: [${optText}]
The correct answer is Option index ${m.answer + 1} (${m.options[m.answer]}).
My wrong answer was Option index ${m.userAnswer + 1} (${m.userAnswer >= 0 ? m.options[m.userAnswer] : 'Timeout'}).
Explain:
1. Under what concept categories this falls.
2. Step-by-step derivation.
3. Common mistake patterns that lead to this wrong answer.`;
                            onNavigateToTab('aiTutor', undefined, m.topic, m.subject, prompt);
                          }}
                          className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-300 font-bold text-[10px] rounded-md transition cursor-pointer"
                        >
                          💡 {t('AI Explainer', 'एआई स्पष्टीकरण')}
                        </button>
                        <button
                          onClick={() => {
                            onNavigateToTab('mockExam', undefined, m.topic, m.subject);
                          }}
                          className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-300 font-bold text-[10px] rounded-md transition cursor-pointer"
                        >
                          📝 {t('Practice Topic', 'विषय का अभ्यास करें')}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredMistakes.length === 0 && (
                  <div className="text-center py-10 text-slate-500 text-xs italic">
                    {t('No unresolved mistakes! Keep practicing to secure your learning.', 'कोई अनसुलझी गलती नहीं! अभ्यास जारी रखें।')}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* 3. SPACED REVISION Repetition Scheduler */}
          {activeSection === 'spaced' && (
            <motion.div
              key="spaced"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between gap-3 bg-[#060a13] p-3 rounded-xl border border-slate-800">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-xs text-slate-100 flex items-center space-x-1.5">
                    <span>🔁 {t('Spaced Repetition Scheduler', 'स्मार्ट अंतराल दोहराव')}</span>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[8px] font-black tracking-widest px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase animate-pulse">
                      {t('ACTIVE PLAN', 'सक्रिय योजना')}
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {t('Topics are scheduled dynamically based on performance and cognitive forgetting curve.', 'संज्ञानात्मक विस्मरण वक्र के आधार पर विषय स्वतः निर्धारित होते हैं।')}
                  </p>
                </div>

                <button
                  onClick={() => setShowAddRevision(!showAddRevision)}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition flex items-center space-x-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('Schedule Topic', 'विषय जोड़ें')}</span>
                </button>
              </div>

              {/* Quick Revision Creation Modal/Panel inline */}
              {showAddRevision && (
                <form onSubmit={handleCreateRevision} className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subject</label>
                      <select
                        value={newRevSubject}
                        onChange={(e) => setNewRevSubject(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded p-1"
                      >
                        {['Mathematics', 'Science', 'Biology', 'Physics', 'Chemistry', 'English'].map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Priority</label>
                      <select
                        value={newRevPriority}
                        onChange={(e) => setNewRevPriority(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded p-1"
                      >
                        <option value="High">High (Every 24 hrs)</option>
                        <option value="Medium">Medium (Every 3 days)</option>
                        <option value="Low">Low (Every week)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Topic Name</label>
                    <input
                      type="text"
                      value={newRevTopic}
                      onChange={(e) => setNewRevTopic(e.target.value)}
                      placeholder="e.g. Calculus Integration Limits"
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded p-1 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex items-center justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddRevision(false)}
                      className="px-2 py-1 text-slate-400 hover:text-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded"
                    >
                      Schedule
                    </button>
                  </div>
                </form>
              )}

              {/* Revision List */}
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin">
                {revisions.map((r) => {
                  const due = new Date(r.nextDue);
                  const isOverdue = due <= new Date();
                  return (
                    <div key={r.id} className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between gap-3">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-0.5">
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide">
                            {r.subject}
                          </span>
                          <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-md ${
                            r.priority === 'High' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                            r.priority === 'Medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}>
                            {r.priority}
                          </span>
                          {isOverdue ? (
                            <span className="text-[8px] font-black text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                              OVERDUE
                            </span>
                          ) : (
                            <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                              ACTIVE (Due {due.toLocaleDateString()})
                            </span>
                          )}
                        </div>
                        <h5 className="font-extrabold text-[11px] sm:text-xs text-slate-200 truncate">
                          {r.topic}
                        </h5>
                        <p className="text-[9px] text-slate-500 font-medium">
                          Interval: {r.intervalDays} days • Last studied: {new Date(r.lastStudied).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Review triggers */}
                      <div className="flex items-center space-x-1.5 shrink-0 ml-1">
                        <button
                          onClick={() => handleSpacedCheck(r.id)}
                          className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-lg transition"
                          title={t('Mark reviewed today', 'आज की समीक्षा पूर्ण की')}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            onNavigateToTab(
                              'aiTutor',
                              undefined,
                              r.topic,
                              r.subject,
                              `I need a quick dynamic spaced revision review of "${r.topic}" in "${r.subject}" to retain mastery. Detail: 1) Essential formulas, 2) Critical concept breakdown, 3) Standard exam questions.`
                            );
                          }}
                          className="px-2.5 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-200 font-black text-[10px] rounded-lg transition flex items-center space-x-1 cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-indigo-200" />
                          <span>AI Revise</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {revisions.length === 0 && (
                  <div className="text-center py-10 text-slate-500 text-xs italic">
                    {t('No revision scheduled. Click "Schedule Topic" to set up your spacing curve!', 'कोई दोहराव विषय निर्धारित नहीं है। शुरू करने के लिए "विषय जोड़ें" पर क्लिक करें!')}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* 4. COGNITIVE INSIGHTS & DIAGNOSTICS */}
          {activeSection === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-[#060a13] border border-slate-800 rounded-xl space-y-1">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    🏆 {t('Mastered Topics', 'महारत हासिल विषय')}
                  </div>
                  <div className="text-xl font-black text-emerald-300">
                    {completedTopics.length || 2} <span className="text-xs font-medium text-slate-500">topics</span>
                  </div>
                </div>

                <div className="p-3 bg-[#060a13] border border-slate-800 rounded-xl space-y-1">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    ⚠️ {t('Weak Focus Topics', 'कमजोर पकड़ विषय')}
                  </div>
                  <div className="text-xl font-black text-rose-300">
                    {weakTopics.length || 2} <span className="text-xs font-medium text-slate-500">topics</span>
                  </div>
                </div>
              </div>

              {/* Lists of Weak and Mastered topics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Weak topics lists */}
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                  <h5 className="font-extrabold text-[10px] text-rose-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                    <span>{t('IMMEDIATE REVIEW FOCUS', 'त्वरित सुधार विषय')}</span>
                  </h5>
                  <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1">
                    {weakTopics.map((topicKey, i) => {
                      const [sub, top] = topicKey.split(':');
                      return (
                        <div 
                          key={i} 
                          onClick={() => {
                            onNavigateToTab('aiTutor', undefined, top, sub as any);
                          }}
                          className="p-1.5 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/30 text-rose-200 rounded transition cursor-pointer flex items-center justify-between"
                        >
                          <span className="font-bold truncate">{top}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        </div>
                      );
                    })}
                    {weakTopics.length === 0 && (
                      <p className="text-[10px] text-slate-500 italic py-1">{t('No focus weaknesses recorded!', 'कोई कमजोरी रिकॉर्ड नहीं की गई!')}</p>
                    )}
                  </div>
                </div>

                {/* Mastered topics lists */}
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                  <h5 className="font-extrabold text-[10px] text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t('MASTERED & SECURE', 'महारत सुरक्षित विषय')}</span>
                  </h5>
                  <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1">
                    {completedTopics.map((topicKey, i) => {
                      const [sub, top] = topicKey.split(':');
                      return (
                        <div 
                          key={i} 
                          onClick={() => {
                            onNavigateToTab('mockExam', undefined, top, sub as any);
                          }}
                          className="p-1.5 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/30 text-emerald-200 rounded transition cursor-pointer flex items-center justify-between"
                        >
                          <span className="font-bold truncate">{top}</span>
                          <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        </div>
                      );
                    })}
                    {completedTopics.length === 0 && (
                      <p className="text-[10px] text-slate-500 italic py-1">{t('No mastered concepts recorded yet.', 'अभी कोई महारत हासिल अवधारणा रिकॉर्ड नहीं की गई है।')}</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
