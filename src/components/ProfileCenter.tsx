import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, 
  Sparkles, 
  Clock, 
  RefreshCw, 
  LogOut, 
  Trash2, 
  ShieldCheck, 
  Settings as SettingsIcon, 
  Check, 
  AlertTriangle, 
  Search, 
  X, 
  ChevronRight, 
  Sliders, 
  Globe, 
  Volume2, 
  Moon, 
  HelpCircle, 
  FileText, 
  ExternalLink, 
  Mail, 
  Bot, 
  BookOpen, 
  Award, 
  CheckCircle2, 
  Info,
  Lock,
  MessageSquare,
  BarChart3,
  Edit3,
  GraduationCap
} from 'lucide-react';
import { auth, signOut, updateProfile } from '../services/firebase';
import { updateUserProfile } from '../services/firebaseDb';
import { safeFetch, AI_LIMITS, currentQuotaUsage, refreshQuotaUsageFromServer } from '../services/geminiService';
import { playUiSound } from '../services/soundEffects';
import { triggerHaptic } from '../services/soundEffects';
import { Language } from '../services/translations';
import UserAvatar from './UserAvatar';
import ThemeToggle from './ThemeToggle';
import type { UserProfile, UiCustomization, AudioFeedback } from '../types';

interface UsageDetailItem {
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
}

interface UsageApiResponse {
  limits: Record<string, number>;
  usage: Record<string, number>;
  details: Record<string, UsageDetailItem>;
  date: string;
  resetTime: string;
}

interface ProfileCenterProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onOpenAvatarModal: () => void;
  onOpenAuthModal: () => void;
  onOpenCustomizeModal: () => void;
  appLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  customization: UiCustomization;
  onUpdateCustomization: (updated: UiCustomization) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const FEATURE_META: Record<string, { label: string; description: string; icon: any; color: string; bg: string }> = {
  aiTutor: {
    label: 'AI Tutor',
    description: 'Interactive conversational explanations & step-by-step solutions',
    icon: Bot,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20'
  },
  notes: {
    label: 'AI Notes & Summary',
    description: 'Automated study notes, high-yield bullet summaries & cheat sheets',
    icon: BookOpen,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20'
  },
  quiz: {
    label: 'Quiz Generator',
    description: 'Custom timed multiple-choice practice quizzes with explanations',
    icon: Award,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20'
  },
  mockExam: {
    label: 'Mock Exam Generator',
    description: 'Full-length rigorous simulated test papers with deep score rubrics',
    icon: GraduationCap,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20'
  },
  questionPaper: {
    label: 'Question Paper Generator',
    description: 'Board & competitive exam format structured question banks',
    icon: FileText,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20'
  },
  ocr: {
    label: 'OCR / Image Explainer',
    description: 'Handwritten notes, textbook diagram, and problem photo analysis',
    icon: Sparkles,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20'
  },
  mindmap: {
    label: 'Mindmap Generator',
    description: 'Visual hierarchical concept webs and structural study diagrams',
    icon: BarChart3,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10 border-pink-500/20'
  },
  explainTopic: {
    label: 'Explain Topic',
    description: 'Deep-dive Socratic conceptual breakdowns with analogies',
    icon: MessageSquare,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20'
  },
  aiEditor: {
    label: 'AI Editor',
    description: 'Document proofreading, thesis enhancement & smart formatting',
    icon: Edit3,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10 border-teal-500/20'
  },
  other: {
    label: 'Other AI Features',
    description: 'General AI tools, text cleanups & study utilities',
    icon: Sparkles,
    color: 'text-slate-400',
    bg: 'bg-slate-500/10 border-slate-500/20'
  }
};

export default function ProfileCenter({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
  onOpenAvatarModal,
  onOpenAuthModal,
  onOpenCustomizeModal,
  appLanguage,
  onLanguageChange,
  customization,
  onUpdateCustomization,
  onShowToast
}: ProfileCenterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'usage' | 'preferences' | 'account' | 'help'>('overview');
  const [usageData, setUsageData] = useState<UsageApiResponse | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Profile edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(userProfile.name || '');
  const [editSchool, setEditSchool] = useState(userProfile.schoolName || '');
  const [editClass, setEditClass] = useState(userProfile.className || '');
  const [editTarget, setEditTarget] = useState(userProfile.targetGoal || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Account deletion confirm state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Sound & Haptic settings
  const [soundMode, setSoundMode] = useState<AudioFeedback>(customization.audioFeedback || 'cyber_synth');

  const currentUser = auth.currentUser;
  const isAnonymous = !currentUser || currentUser.isAnonymous;

  // Fetch authoritatively from backend
  const fetchAuthoritativeUsage = async () => {
    setIsLoadingUsage(true);
    try {
      const res = await safeFetch('/api/user/ai-usage');
      if (res.ok) {
        const data: UsageApiResponse = await res.json();
        setUsageData(data);
      } else {
        // Fallback to locally synchronized currentQuotaUsage
        fallbackToLocalSync();
      }
    } catch (e) {
      fallbackToLocalSync();
    } finally {
      setIsLoadingUsage(false);
    }
  };

  const fallbackToLocalSync = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const details: Record<string, UsageDetailItem> = {};
    const keys = Object.keys(FEATURE_META);
    for (const k of keys) {
      const used = (currentQuotaUsage as any)[k] || 0;
      const limit = (AI_LIMITS as any)[k] || AI_LIMITS.default;
      const remaining = Math.max(0, limit - used);
      const percentage = Math.min(100, Math.round((used / limit) * 100));
      details[k] = { used, limit, remaining, percentage };
    }
    setUsageData({
      limits: AI_LIMITS as any,
      usage: currentQuotaUsage as any,
      details,
      date: todayStr,
      resetTime: '00:00 UTC'
    });
  };

  useEffect(() => {
    if (isOpen) {
      fetchAuthoritativeUsage();
      setEditName(userProfile.name || '');
      setEditSchool(userProfile.schoolName || '');
      setEditClass(userProfile.className || '');
      setEditTarget(userProfile.targetGoal || '');
    }
  }, [isOpen, userProfile]);

  // Listen to live quota events
  useEffect(() => {
    const handleQuotaUpdated = () => {
      fetchAuthoritativeUsage();
    };
    window.addEventListener('quota-usage-updated', handleQuotaUpdated);
    return () => window.removeEventListener('quota-usage-updated', handleQuotaUpdated);
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    playUiSound(soundMode);
    await refreshQuotaUsageFromServer();
    await fetchAuthoritativeUsage();
    setIsRefreshing(false);
    if (onShowToast) onShowToast('Usage limits synchronized with server', 'info');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    playUiSound(soundMode);
    try {
      const trimmedName = editName.trim() || 'Student';
      const updates: Partial<UserProfile> = {
        name: trimmedName,
        schoolName: editSchool.trim(),
        className: editClass.trim(),
        targetGoal: editTarget.trim()
      };

      if (currentUser && !currentUser.isAnonymous) {
        try {
          await updateProfile(currentUser, { displayName: trimmedName });
        } catch (authErr) {
          console.warn('Firebase auth profile update non-blocking:', authErr);
        }
      }

      await updateUserProfile(userProfile.uid, updates);
      onUpdateProfile(updates);
      setIsEditingProfile(false);
      if (onShowToast) onShowToast('Profile updated successfully', 'success');
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      if (onShowToast) onShowToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSignOut = async () => {
    playUiSound(soundMode);
    triggerHaptic('medium');
    try {
      await signOut(auth);
      if (onShowToast) onShowToast('Signed out successfully', 'info');
      onClose();
    } catch (e: any) {
      console.error('Sign out error:', e);
      if (onShowToast) onShowToast('Failed to sign out', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== 'delete') {
      if (onShowToast) onShowToast("Please type 'delete' to confirm account deletion", 'error');
      return;
    }
    setIsDeletingAccount(true);
    triggerHaptic('warning');
    try {
      const res = await safeFetch('/api/user/account', {
        method: 'DELETE'
      });
      if (res.ok) {
        if (currentUser) {
          try {
            await currentUser.delete();
          } catch (e) {
            // Already removed or re-auth required
          }
        }
        await signOut(auth);
        if (onShowToast) onShowToast('Account and personal study data deleted successfully', 'success');
        setShowDeleteConfirm(false);
        onClose();
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to delete account from server.');
      }
    } catch (err: any) {
      console.error('Account deletion failed:', err);
      if (onShowToast) onShowToast(err.message || 'Failed to delete account', 'error');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleSoundChange = (val: AudioFeedback) => {
    setSoundMode(val);
    playUiSound(val);
    onUpdateCustomization({ ...customization, audioFeedback: val });
  };

  // Filter features based on search query
  const filteredFeatures = useMemo(() => {
    const list = Object.entries(FEATURE_META).map(([key, meta]) => {
      const detail = usageData?.details?.[key] || {
        used: (currentQuotaUsage as any)[key] || 0,
        limit: (AI_LIMITS as any)[key] || AI_LIMITS.default,
        remaining: Math.max(0, ((AI_LIMITS as any)[key] || AI_LIMITS.default) - ((currentQuotaUsage as any)[key] || 0)),
        percentage: Math.min(100, Math.round((((currentQuotaUsage as any)[key] || 0) / ((AI_LIMITS as any)[key] || AI_LIMITS.default)) * 100))
      };
      return {
        key,
        ...meta,
        ...detail
      };
    });

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(item => 
      item.label.toLowerCase().includes(q) || 
      item.description.toLowerCase().includes(q) ||
      item.key.toLowerCase().includes(q)
    );
  }, [searchQuery, usageData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-slate-950/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="relative w-full max-w-3xl my-auto bg-[#0a101f] border border-slate-800/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* HEADER BAR */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>Profile & Settings Center</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Authoritative
                </span>
              </h2>
              <p className="text-xs text-slate-400">Manage your authenticated student account, AI quotas & app preferences</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition cursor-pointer"
            title="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SEARCH & SUBTABS BAR */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-800/80 bg-slate-950/40 shrink-0 space-y-2.5">
          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search settings, AI limits, preferences, security..."
              className="w-full pl-9.5 pr-8 py-2 text-xs rounded-xl bg-slate-900/80 border border-slate-700/60 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 transition"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Navigation Pill Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs font-semibold">
            {[
              { id: 'overview', label: 'Overview', icon: UserIcon },
              { id: 'usage', label: 'AI Usage & Quotas', icon: Bot },
              { id: 'preferences', label: 'Preferences', icon: Sliders },
              { id: 'account', label: 'Account & Security', icon: ShieldCheck },
              { id: 'help', label: 'Help & About', icon: HelpCircle },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveSubTab(tab.id as any);
                    playUiSound(soundMode);
                  }}
                  className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 whitespace-nowrap transition cursor-pointer border ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-500/20'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SCROLLABLE CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* 1. OVERVIEW / PROFILE SECTION */}
          {(activeSubTab === 'overview' || searchQuery) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Authenticated Profile</span>
                </h3>
                {!isEditingProfile && (
                  <button 
                    onClick={() => {
                      setIsEditingProfile(true);
                      playUiSound(soundMode);
                    }}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile Details</span>
                  </button>
                )}
              </div>

              {/* PROFILE CARD */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-indigo-950/30 border border-slate-800 relative overflow-hidden shadow-lg">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 relative z-10">
                  {/* Avatar with click-to-change */}
                  <div className="relative group shrink-0">
                    <div 
                      onClick={onOpenAvatarModal}
                      className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-slate-950 p-0.5 ring-2 ring-indigo-500/50 hover:ring-indigo-400 shadow-xl flex items-center justify-center cursor-pointer transition overflow-hidden"
                      title="Change Student Avatar"
                    >
                      <UserAvatar
                        avatar={userProfile.avatar}
                        name={userProfile.name || 'Student'}
                        avatarType={userProfile.avatarType}
                        avatarBg={userProfile.avatarBg}
                        size="lg"
                        className="w-full h-full rounded-[14px]"
                      />
                    </div>
                    <button 
                      onClick={onOpenAvatarModal}
                      className="absolute -bottom-1 -right-1 p-1 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white border-2 border-slate-950 shadow-md cursor-pointer transition group-hover:scale-110"
                      title="Change Avatar"
                    >
                      <Sparkles className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Profile Metadata */}
                  <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
                          <span>{userProfile.name?.trim() ? userProfile.name : 'Guest Student'}</span>
                          <span className="text-sm">✨</span>
                        </h4>
                        <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          <span>{currentUser?.email || userProfile.email || 'Anonymous / Guest Session'}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-center sm:justify-end gap-2">
                        {isAnonymous ? (
                          <button
                            onClick={onOpenAuthModal}
                            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition cursor-pointer"
                          >
                            Sign In / Sync Cloud
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Authenticated Account</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* School / Class Badges */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                      <span className="px-2.5 py-1 bg-indigo-950/60 text-indigo-300 text-xs font-semibold rounded-full border border-indigo-500/30 flex items-center gap-1.5 shadow-xs">
                        <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{userProfile.className || 'Class 12th (Science)'}</span>
                      </span>

                      <span className="px-2.5 py-1 bg-slate-800/80 text-slate-300 text-xs font-medium rounded-full border border-slate-700/60 flex items-center gap-1.5 shadow-xs">
                        <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{userProfile.schoolName || 'School Not Configured'}</span>
                      </span>

                      {userProfile.targetGoal && (
                        <span className="px-2.5 py-1 bg-amber-950/40 text-amber-300 text-xs font-medium rounded-full border border-amber-600/30 flex items-center gap-1.5 shadow-xs">
                          <Award className="w-3.5 h-3.5 text-amber-400" />
                          <span>Goal: {userProfile.targetGoal}</span>
                        </span>
                      )}
                    </div>

                    {/* Account Info Stats */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
                      <div className="text-center p-2 rounded-xl bg-slate-950/50 border border-slate-800/60">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Total XP</div>
                        <div className="text-sm font-black text-indigo-400">{userProfile.xp || 0} XP</div>
                      </div>
                      <div className="text-center p-2 rounded-xl bg-slate-950/50 border border-slate-800/60">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Level</div>
                        <div className="text-sm font-black text-emerald-400">Level {userProfile.level || 1}</div>
                      </div>
                      <div className="text-center p-2 rounded-xl bg-slate-950/50 border border-slate-800/60">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Day Streak</div>
                        <div className="text-sm font-black text-amber-400">{userProfile.streak || 1} Days 🔥</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* EDIT PROFILE DRAWER FORM */}
                <AnimatePresence>
                  {isEditingProfile && (
                    <motion.form 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleSaveProfile}
                      className="mt-4 pt-4 border-t border-slate-800/80 space-y-3"
                    >
                      <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Update Personal Student Information</span>
                      </h5>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">Student Full Name</label>
                          <input 
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="e.g. Rohit Yadav"
                            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">Class / Grade</label>
                          <input 
                            type="text"
                            value={editClass}
                            onChange={(e) => setEditClass(e.target.value)}
                            placeholder="e.g. Class 12th / College"
                            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">School / College</label>
                          <input 
                            type="text"
                            value={editSchool}
                            onChange={(e) => setEditSchool(e.target.value)}
                            placeholder="e.g. St. Xavier High School"
                            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">Target Exam / Goal</label>
                          <input 
                            type="text"
                            value={editTarget}
                            onChange={(e) => setEditTarget(e.target.value)}
                            placeholder="e.g. JEE 2026 / Board Exams"
                            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingProfile}
                          className="px-4 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition cursor-pointer shadow-md disabled:opacity-50"
                        >
                          {isSavingProfile ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          <span>Save Changes</span>
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* 2. PROMINENT AI USAGE & FREE LIMITS SECTION */}
          {(activeSubTab === 'overview' || activeSubTab === 'usage' || searchQuery) && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    <span>AI Usage & Free Tier Limits</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Authoritative server quota verified on every request • No localStorage spoofing</p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Resets daily at 00:00 UTC</span>
                  </div>

                  <button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing || isLoadingUsage}
                    className="p-1.5 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                    title="Refresh authoritative server quotas"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
                  </button>
                </div>
              </div>

              {/* GRID OF FEATURE LIMIT CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredFeatures.map((item) => {
                  const Icon = item.icon;
                  const isLimitReached = item.used >= item.limit;
                  const percentColor = isLimitReached 
                    ? 'bg-rose-500' 
                    : item.percentage > 70 
                    ? 'bg-amber-500' 
                    : 'bg-indigo-500';

                  return (
                    <div 
                      key={item.key}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isLimitReached 
                          ? 'bg-rose-950/20 border-rose-800/40' 
                          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center space-x-2 min-w-0">
                          <div className={`p-2 rounded-xl border ${item.bg}`}>
                            <Icon className={`w-4 h-4 ${item.color}`} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white tracking-tight truncate">{item.label}</h4>
                            <p className="text-[10px] text-slate-400 truncate">{item.description}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-black text-white">
                            <span className={isLimitReached ? 'text-rose-400' : 'text-slate-200'}>{item.used}</span>
                            <span className="text-slate-500"> / </span>
                            <span className="text-slate-400">{item.limit}</span>
                          </div>
                          <div className="text-[10px] font-bold text-slate-400">{item.percentage}% used</div>
                        </div>
                      </div>

                      {/* Progress Bar Indicator */}
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/60 relative">
                        <motion.div 
                          className={`h-full rounded-full ${percentColor}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, item.percentage)}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>

                      {/* Remaining / Status Pill */}
                      <div className="flex items-center justify-between text-[10px] pt-2">
                        {isLimitReached ? (
                          <span className="text-rose-400 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>Limit reached — resets tomorrow</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">
                            {item.remaining} remaining today
                          </span>
                        )}
                        <span className="text-slate-400">Server verified</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. DETAILED USAGE SUMMARY TABLE */}
          {(activeSubTab === 'usage' || searchQuery) && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Authoritative Quota Breakdown</span>
              </h4>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3.5">Feature</th>
                      <th className="py-2.5 px-3">Used Today</th>
                      <th className="py-2.5 px-3">Daily Limit</th>
                      <th className="py-2.5 px-3">Remaining</th>
                      <th className="py-2.5 px-3 text-right">Reset Window</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredFeatures.map((f) => (
                      <tr key={f.key} className="hover:bg-slate-900/40 transition">
                        <td className="py-2.5 px-3.5 font-bold text-white flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${f.used >= f.limit ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                          <span>{f.label}</span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-300">{f.used}</td>
                        <td className="py-2.5 px-3 text-slate-400">{f.limit}</td>
                        <td className="py-2.5 px-3 font-bold text-indigo-400">{f.remaining}</td>
                        <td className="py-2.5 px-3 text-right text-slate-400">00:00 UTC</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. APP PREFERENCES SECTION (ONLY REAL IMPLEMENTED PREFERENCES) */}
          {(activeSubTab === 'overview' || activeSubTab === 'preferences' || searchQuery) && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>App Preferences & Experience</span>
              </h3>

              <div className="space-y-2.5">
                {/* Theme & Appearance Row */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <Moon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Appearance & Theme</h4>
                      <p className="text-[11px] text-slate-400">Toggle dark mode / eye comfort theme</p>
                    </div>
                  </div>
                  <ThemeToggle variant="compact-switch" />
                </div>

                {/* Studio UI Customizer Button */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <SettingsIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Studio Layout Customizer</h4>
                      <p className="text-[11px] text-slate-400">Card radius, glowing neon lights, font families & study walls</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onOpenCustomizeModal();
                      playUiSound(soundMode);
                    }}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-purple-950/80 border border-purple-700/60 hover:bg-purple-900 text-purple-300 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Customize</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* App Language Selector Row */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Application Language</h4>
                      <p className="text-[11px] text-slate-400">Multilingual user interface translation</p>
                    </div>
                  </div>
                  <select
                    value={appLanguage}
                    onChange={(e) => {
                      const newLang = e.target.value as Language;
                      onLanguageChange(newLang);
                      playUiSound(soundMode);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिंदी (Hindi)</option>
                    <option value="hinglish">Hinglish</option>
                    <option value="marathi">मराठी (Marathi)</option>
                    <option value="tamil">தமிழ் (Tamil)</option>
                    <option value="bengali">বাংলা (Bengali)</option>
                  </select>
                </div>

                {/* Sound & Haptic Feedback Row */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Audio & Tactile Feedback</h4>
                      <p className="text-[11px] text-slate-400">Synthesizer clicks, UI chimes & haptic vibration</p>
                    </div>
                  </div>
                  <select
                    value={soundMode}
                    onChange={(e) => handleSoundChange(e.target.value as AudioFeedback)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="cyber_synth">Cyber Synth (Default)</option>
                    <option value="soft_bubble">Soft Bubble</option>
                    <option value="mechanical">Mechanical Keyboard</option>
                    <option value="minimal_pop">Minimal Pop</option>
                    <option value="zen_wood">Zen Wood</option>
                    <option value="silent">Mute / Silent</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 5. ACCOUNT & SECURITY SECTION */}
          {(activeSubTab === 'overview' || activeSubTab === 'account' || searchQuery) && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Account, Privacy & Security</span>
              </h3>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div>
                    <h4 className="text-xs font-bold text-white">Active Session Authentication</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isAnonymous ? 'Guest / anonymous temporary session' : `Authenticated as ${currentUser?.email}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isAnonymous ? (
                      <button
                        onClick={onOpenAuthModal}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer"
                      >
                        Sign In / Register
                      </button>
                    ) : (
                      <button
                        onClick={handleSignOut}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-rose-200 transition cursor-pointer flex items-center gap-1.5 border border-slate-700"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Privacy & Cloud Architecture Note */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1">
                  <div className="font-bold text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Security & Anti-Abuse Protection</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    ASCEND Study uses server-side token validation on all Gemini routes. Per-user quota counters are authoritatively incremented and verified on the backend, preventing client-side clock tampering or local storage bypasses.
                  </p>
                </div>

                {/* Destructive Zone: Account Deletion */}
                <div className="pt-2">
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(true);
                        playUiSound(soundMode);
                      }}
                      className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Account & Associated Study Data</span>
                    </button>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/60 space-y-2.5">
                      <div className="flex items-start gap-2 text-rose-300 text-xs">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                        <div>
                          <div className="font-bold">Permanently delete account?</div>
                          <div className="text-[11px] text-rose-400/90">
                            This action is immediate and non-reversible. It permanently purges your profile, study session history, and usage records from the database.
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 block">
                          Type <span className="text-white font-mono">delete</span> to confirm:
                        </label>
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="delete"
                          className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-rose-800/70 text-white focus:outline-none focus:border-rose-500 font-mono"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeleteConfirmText('');
                          }}
                          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={deleteConfirmText.toLowerCase() !== 'delete' || isDeletingAccount}
                          onClick={handleDeleteAccount}
                          className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
                        >
                          {isDeletingAccount ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          <span>Confirm Permanent Deletion</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 6. HELP & ABOUT SECTION */}
          {(activeSubTab === 'overview' || activeSubTab === 'help' || searchQuery) && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>Help, Terms & App Information</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-indigo-400" />
                    <span>About Ascend Study / Remix Study Buddy</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Designed and built as a full-stack educational assistant that empowers students with interactive AI tutoring, group collaboration rooms, mock exams, and persistent game mechanics.
                  </p>
                  <div className="pt-1 text-[11px] text-slate-400">
                    Version: <span className="text-white font-mono font-bold">v2.5.0-production</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-emerald-400" />
                    <span>Support & Creator Information</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Created by Rohit Yadav (<span className="text-indigo-400 font-mono">yadavrohityadav331@gmail.com</span>). For bug reports, questions or suggestions, please contact support.
                  </p>
                  <div className="pt-1">
                    <a 
                      href="/privacy" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 text-[11px]"
                    >
                      <span>Read Privacy Policy & Terms</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER BAR */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800/80 bg-slate-900/50 backdrop-blur-sm shrink-0 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AI Quota Engine Online</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
