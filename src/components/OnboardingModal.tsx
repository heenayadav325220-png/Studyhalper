import { useState, useEffect } from 'react';
import { Sparkles, GraduationCap, School, BookOpen, Target, UserCheck, Mail, X } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  initialData?: {
    name?: string;
    email?: string;
    schoolName?: string;
    className?: string;
    targetGoal?: string;
  };
  onSave: (data: {
    name: string;
    email?: string;
    schoolName: string;
    className: string;
    targetGoal: string;
  }) => void;
  onClose?: () => void;
  isEditing?: boolean;
}

export default function OnboardingModal({
  isOpen,
  initialData,
  onSave,
  onClose,
  isEditing = false
}: OnboardingModalProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [schoolName, setSchoolName] = useState(initialData?.schoolName || '');
  const [className, setClassName] = useState(initialData?.className || 'Class 12th (Science/PCM)');
  const [targetGoal, setTargetGoal] = useState(initialData?.targetGoal || 'JEE Main / Board Exams');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setEmail(initialData.email || '');
      setSchoolName(initialData.schoolName || '');
      setClassName(initialData.className || 'Class 12th (Science/PCM)');
      setTargetGoal(initialData.targetGoal || 'JEE Main / Board Exams');
      setError('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name to proceed.');
      return;
    }
    setError('');
    onSave({
      name: name.trim(),
      email: email.trim(),
      schoolName: schoolName.trim(),
      className: className.trim() || 'Class 12th (Science/PCM)',
      targetGoal: targetGoal.trim()
    });
  };

  const CLASS_OPTIONS = [
    'Class 6th',
    'Class 7th',
    'Class 8th',
    'Class 9th',
    'Class 10th',
    'Class 11th (Science/PCM)',
    'Class 11th (PCB)',
    'Class 11th (Commerce/Arts)',
    'Class 12th (Science/PCM)',
    'Class 12th (PCB)',
    'Class 12th (Commerce/Arts)',
    'Undergraduate / B.Tech',
    'Competitive Exam Aspirant'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* HEADER BORDER & BADGE */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-6 text-white relative">
          {onClose && (
            <button
              onClick={onClose}
              type="button"
              className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-indigo-100 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{isEditing ? 'Edit Profile Information' : 'Welcome to Ascend Study Buddy'}</span>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white">
            {isEditing ? 'Update Student Details ✏️' : 'Setup Student Profile 🎓'}
          </h2>
          <p className="text-xs text-indigo-100/90 mt-1 leading-relaxed">
            {isEditing
              ? 'Change your details below. Your AI Tutor and study dashboard will adapt immediately!'
              : 'Tell us about your school, class & goals so AI Tutor can customize lessons for you!'}
          </p>
        </div>

        {/* FORM BODY */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl animate-shake">
              ⚠️ {error}
            </div>
          )}

          {/* STUDENT NAME */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <span>Student Full Name <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-900 transition"
            />
          </div>

          {/* EMAIL ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <Mail className="w-4 h-4 text-indigo-600" />
              <span>Gmail / Contact ID</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student@gmail.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-900 transition"
            />
          </div>

          {/* SCHOOL / COLLEGE NAME */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <School className="w-4 h-4 text-indigo-600" />
              <span>School / College Name</span>
            </label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="e.g. Delhi Public School / St. Xavier's"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-900 transition"
            />
          </div>

          {/* CLASS / GRADE */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>Class / Grade / Stream</span>
            </label>
            <select
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-900 transition"
            >
              {CLASS_OPTIONS.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* TARGET GOAL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <Target className="w-4 h-4 text-indigo-600" />
              <span>Target Goal / Exam Focus</span>
            </label>
            <input
              type="text"
              value={targetGoal}
              onChange={(e) => setTargetGoal(e.target.value)}
              placeholder="e.g. CBSE Board 95%+, JEE Main, NEET, Final Exams"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-900 transition"
            />
          </div>

          {/* ACTION BUTTON */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 group cursor-pointer"
            >
              <span>{isEditing ? 'Save Changes 💾' : 'Start Learning with AI Tutor 🚀'}</span>
              <BookOpen className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
