import { useState, useEffect } from 'react';
import { Sparkles, GraduationCap, School, BookOpen, Target, UserCheck, Mail, X, Camera } from 'lucide-react';
import UserAvatar from './UserAvatar';
import AvatarSelectorModal from './AvatarSelectorModal';

interface OnboardingModalProps {
  isOpen: boolean;
  initialData?: {
    name?: string;
    email?: string;
    avatar?: string;
    avatarType?: 'personal' | 'cloud' | 'emoji' | 'initials';
    avatarBg?: string;
    schoolName?: string;
    className?: string;
    targetGoal?: string;
  };
  onSave: (data: {
    name: string;
    email?: string;
    avatar?: string;
    avatarType?: 'personal' | 'cloud' | 'emoji' | 'initials';
    avatarBg?: string;
    schoolName: string;
    className: string;
    targetGoal: string;
  }) => void;
  onClose?: () => void;
  isEditing?: boolean;
  onOpenAuth?: () => void;
}

export default function OnboardingModal({
  isOpen,
  initialData,
  onSave,
  onClose,
  isEditing = false,
  onOpenAuth
}: OnboardingModalProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [avatar, setAvatar] = useState(initialData?.avatar || '🧑‍🎓');
  const [avatarType, setAvatarType] = useState<'personal' | 'cloud' | 'emoji' | 'initials'>(initialData?.avatarType || 'emoji');
  const [avatarBg, setAvatarBg] = useState(initialData?.avatarBg || 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600');
  const [schoolName, setSchoolName] = useState(initialData?.schoolName || '');
  const [className, setClassName] = useState(initialData?.className || 'Class 12th (Science/PCM)');
  const [targetGoal, setTargetGoal] = useState(initialData?.targetGoal || 'JEE Main / Board Exams');
  const [error, setError] = useState('');
  const [showAvatarStudio, setShowAvatarStudio] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setEmail(initialData?.email || '');
      setAvatar(initialData?.avatar || '🧑‍🎓');
      setAvatarType(initialData?.avatarType || 'emoji');
      setAvatarBg(initialData?.avatarBg || 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600');
      setSchoolName(initialData?.schoolName || '');
      setClassName(initialData?.className || 'Class 12th (Science/PCM)');
      setTargetGoal(initialData?.targetGoal || 'JEE Main / Board Exams');
      setError('');
    }
  }, [isOpen]);

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
      avatar,
      avatarType,
      avatarBg,
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
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200/90 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
          
          {/* CLEAN HEADER */}
          <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Profile Settings' : 'Welcome'}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {isEditing ? 'Edit Profile' : 'Student Profile Setup'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEditing
                  ? 'Update your study details, avatar and academic targets.'
                  : 'Customize your profile so AI Tutor can personalize your lessons.'}
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                type="button"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* QUICK SIGN IN SHORTCUT FOR RETURNING STUDENTS */}
          {!isEditing && onOpenAuth && (
            <div className="px-6 py-2.5 bg-indigo-50/80 border-b border-indigo-100 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-indigo-900">
                Already have an account?
              </span>
              <button
                type="button"
                onClick={() => {
                  if (onClose) onClose();
                  onOpenAuth();
                }}
                className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
              >
                Sign In with Email / Google →
              </button>
            </div>
          )}

          {/* FORM BODY */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl">
                {error}
              </div>
            )}

            {/* AVATAR SELECTOR ROW */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <UserAvatar
                  avatar={avatar}
                  name={name || 'Student'}
                  avatarType={avatarType}
                  avatarBg={avatarBg}
                  size="md"
                  showBadge={true}
                  onClick={() => setShowAvatarStudio(true)}
                  isEditable={true}
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Profile Avatar
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Vectors, photo upload, emojis, or monogram
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAvatarStudio(true)}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs transition flex items-center space-x-1 cursor-pointer active:scale-95 shrink-0"
              >
                <Camera className="w-3.5 h-3.5 text-indigo-600" />
                <span>Change</span>
              </button>
            </div>

            {/* STUDENT NAME */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Full Name <span className="text-rose-500">*</span></span>
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
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium text-slate-900 transition"
              />
            </div>

            {/* EMAIL ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. student@gmail.com"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium text-slate-900 transition"
              />
            </div>

            {/* SCHOOL / COLLEGE NAME */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                <School className="w-3.5 h-3.5 text-slate-500" />
                <span>School / College Name</span>
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="e.g. Delhi Public School"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium text-slate-900 transition"
              />
            </div>

            {/* CLASS / GRADE */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                <span>Class / Grade / Stream</span>
              </label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium text-slate-900 transition"
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
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                <Target className="w-3.5 h-3.5 text-slate-500" />
                <span>Target Goal / Exam Focus</span>
              </label>
              <input
                type="text"
                value={targetGoal}
                onChange={(e) => setTargetGoal(e.target.value)}
                placeholder="e.g. CBSE Board 95%+, JEE Main, NEET"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium text-slate-900 transition"
              />
            </div>

            {/* ACTION BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center space-x-2 group cursor-pointer active:scale-98"
              >
                <span>{isEditing ? 'Save Changes' : 'Start Learning'}</span>
                <BookOpen className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* AVATAR STUDIO MODAL */}
      <AvatarSelectorModal
        isOpen={showAvatarStudio}
        currentAvatar={avatar}
        currentAvatarType={avatarType}
        currentAvatarBg={avatarBg}
        userName={name || 'Student'}
        onSave={(data) => {
          setAvatar(data.avatar);
          setAvatarType(data.avatarType);
          if (data.avatarBg) setAvatarBg(data.avatarBg);
        }}
        onClose={() => setShowAvatarStudio(false)}
      />
    </>
  );
}
