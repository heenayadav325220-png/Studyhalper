import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  LogOut, 
  ShieldCheck, 
  GraduationCap, 
  Target,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { 
  auth,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithGoogle, 
  sendUserPasswordReset,
  updateProfile,
  getFriendlyAuthErrorMessage,
  withTimeout
} from '../services/firebase';
import { updateUserProfile } from '../services/firebaseDb';
import type { UserProfile } from '../types';
import type { Language } from '../services/translations';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  appLanguage: Language;
  onAuthSuccess?: (profile: UserProfile) => void;
}

type AuthTab = 'signin' | 'signup' | 'forgot' | 'profile';

const CLASSES = [
  'Class 6-8 (Middle School)',
  'Class 9 (High School)',
  'Class 10 (Board Exam Prep)',
  'Class 11 (Senior Secondary)',
  'Class 12 (Board & Entrance)',
  'College / University',
  'Competitive Exams (JEE/NEET/UPSC)'
];

const TARGET_GOALS = [
  'Score 95%+ in Board Exams',
  'Crack Competitive Entrance',
  'Master STEM & Coding',
  'Improve Daily Study Habits',
  'Top My Class & Boost GPA'
];

export default function AuthModal({
  isOpen,
  onClose,
  userProfile,
  setUserProfile,
  appLanguage,
  onAuthSuccess
}: AuthModalProps) {
  const isHi = appLanguage === 'hi';
  const isLoggedIn = !!(
    (auth.currentUser && !auth.currentUser.isAnonymous) ||
    (userProfile?.email && userProfile.email.trim().length > 0 && userProfile.authProvider && userProfile.authProvider !== 'guest')
  );

  // Tab State
  const [currentTab, setCurrentTab] = useState<AuthTab>(isLoggedIn ? 'profile' : 'signin');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedClass, setSelectedClass] = useState(CLASSES[2]);
  const [selectedGoal, setSelectedGoal] = useState(TARGET_GOALS[0]);
  const [showPassword, setShowPassword] = useState(false);
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync tab state when modal opens
  useEffect(() => {
    if (isOpen) {
      const loggedInNow = !!(
        (auth.currentUser && !auth.currentUser.isAnonymous) ||
        (userProfile?.email && userProfile.email.trim().length > 0 && userProfile.authProvider && userProfile.authProvider !== 'guest')
      );
      setCurrentTab(loggedInNow ? 'profile' : 'signin');
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, userProfile.email, userProfile.authProvider]);

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setError(null);
    setIsUnauthorizedDomain(false);
    setCopiedDomain(false);
    setSuccessMessage(null);
  };

  const handleTabChange = (tab: AuthTab) => {
    setError(null);
    setIsUnauthorizedDomain(false);
    setCopiedDomain(false);
    setSuccessMessage(null);
    setCurrentTab(tab);
  };

  // 1. SIGN IN (LOGIN)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError(isHi ? 'कृपया ईमेल और पासवर्ड दर्ज करें।' : 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let uid = '';
      let displayName = userProfile.name || cleanEmail.split('@')[0];

      // Strict 5.0s network timeout so user is not blocked forever
      const userCredential = await withTimeout(
        signInWithEmailAndPassword(auth, cleanEmail, password),
        5000,
        'Network auth timeout'
      );
      const user = userCredential.user;
      uid = user.uid;
      if (user.displayName) displayName = user.displayName;

      const updatedProfile: UserProfile = {
        ...userProfile,
        uid: uid,
        email: cleanEmail,
        name: displayName,
        authProvider: 'password',
        isOnboarded: true,
        lastActive: new Date().toISOString()
      };

      setUserProfile(updatedProfile);
      localStorage.setItem('ascend_user_profile', JSON.stringify(updatedProfile));
      localStorage.setItem(`user_profile_${updatedProfile.uid}`, JSON.stringify(updatedProfile));
      localStorage.setItem(`ascend_onboarded_${updatedProfile.uid}`, 'true');
      localStorage.setItem('ascend_onboarded', 'true');

      // Non-blocking background Firestore sync (never hangs UI)
      updateUserProfile(updatedProfile.uid, updatedProfile).catch(dbErr => {
        console.warn('Firestore sync note:', dbErr);
      });

      setSuccessMessage(isHi ? 'सफलतापूर्वक लॉग इन किया गया! 🎉' : 'Logged in successfully! Welcome back 🎉');
      if (onAuthSuccess) onAuthSuccess(updatedProfile);

      setTimeout(() => {
        onClose();
        resetForm();
      }, 700);
    } catch (err: any) {
      console.warn('Sign In Handled:', err?.message || err);
      const friendly = getFriendlyAuthErrorMessage(err?.code || err?.message || '', appLanguage);
      setError(friendly);
    } finally {
      setLoading(false);
    }
  };

  // 2. CREATE NEW ACCOUNT (SIGN UP)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    if (!cleanEmail || !password || !cleanName) {
      setError(isHi ? 'कृपया सभी आवश्यक फ़ील्ड भरें।' : 'Please complete all required fields.');
      return;
    }

    if (password.length < 6) {
      setError(isHi ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Fast 5.0s network timeout
      const userCredential = await withTimeout(
        createUserWithEmailAndPassword(auth, cleanEmail, password),
        5000,
        'Signup network timeout'
      );
      const user = userCredential.user;
      const uid = user.uid;

      // Update Firebase Auth Display Name
      try {
        await updateProfile(user, { displayName: cleanName });
      } catch (profileErr) {
        console.warn('Could not set displayName in Auth:', profileErr);
      }

      const updatedProfile: UserProfile = {
        ...userProfile,
        uid: uid,
        email: cleanEmail,
        name: cleanName,
        className: selectedClass,
        targetGoal: selectedGoal,
        authProvider: 'password',
        isOnboarded: true,
        xp: (userProfile.xp || 100) + 150, // Bonus signup XP
        level: userProfile.level || 1,
        lastActive: new Date().toISOString()
      };

      setUserProfile(updatedProfile);
      localStorage.setItem('ascend_user_profile', JSON.stringify(updatedProfile));
      localStorage.setItem(`user_profile_${updatedProfile.uid}`, JSON.stringify(updatedProfile));
      localStorage.setItem(`ascend_onboarded_${updatedProfile.uid}`, 'true');
      localStorage.setItem('ascend_onboarded', 'true');

      // Non-blocking background Firestore sync
      updateUserProfile(updatedProfile.uid, updatedProfile).catch(dbErr => {
        console.warn('Firestore sync note:', dbErr);
      });

      setSuccessMessage(isHi ? 'खाता सफलतापूर्वक बनाया गया! +150 XP बोनस मिला 🚀' : 'Account created successfully! +150 XP bonus earned 🚀');
      if (onAuthSuccess) onAuthSuccess(updatedProfile);

      setTimeout(() => {
        onClose();
        resetForm();
      }, 800);
    } catch (err: any) {
      console.warn('Sign Up Handled:', err?.message || err);
      const friendly = getFriendlyAuthErrorMessage(err?.code || err?.message || '', appLanguage);
      setError(friendly);
    } finally {
      setLoading(false);
    }
  };

  // 3. CONTINUE WITH GOOGLE (FAST, GUARANTEED 1-CLICK AUTH)
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Generous timeout for Google popup so user can choose account safely
      const user = await signInWithGoogle(90000);
      const displayName = user.displayName || user.email?.split('@')[0] || 'Student';
      const photoURL = user.photoURL || undefined;

      const updatedProfile: UserProfile = {
        ...userProfile,
        uid: user.uid,
        email: user.email || '',
        name: displayName,
        photoURL: photoURL,
        avatar: photoURL || userProfile.avatar || '🧑‍🎓',
        avatarType: photoURL ? 'personal' : userProfile.avatarType,
        authProvider: 'google',
        isOnboarded: true,
        xp: (userProfile.xp || 100) + 100, // Google sign-in XP bonus
        lastActive: new Date().toISOString()
      };

      setUserProfile(updatedProfile);
      localStorage.setItem('ascend_user_profile', JSON.stringify(updatedProfile));
      localStorage.setItem(`user_profile_${user.uid}`, JSON.stringify(updatedProfile));
      localStorage.setItem(`ascend_onboarded_${user.uid}`, 'true');
      localStorage.setItem('ascend_onboarded', 'true');

      // Non-blocking Firestore sync
      updateUserProfile(user.uid, updatedProfile).catch(dbErr => {
        console.warn('Firestore sync note:', dbErr);
      });

      setSuccessMessage(isHi ? `स्वागत है, ${displayName}! गूगल के साथ प्रमाणित हुआ 🎉` : `Welcome, ${displayName}! Signed in with Google 🎉`);
      if (onAuthSuccess) onAuthSuccess(updatedProfile);

      setTimeout(() => {
        onClose();
        resetForm();
      }, 700);
    } catch (err: any) {
      console.warn('Google Sign-In Handled:', err?.code || err?.message || err);
      const errStr = `${err?.code || ''} ${err?.message || ''}`.toLowerCase();
      if (errStr.includes('unauthorized-domain')) {
        setIsUnauthorizedDomain(true);
      }
      const friendly = getFriendlyAuthErrorMessage(err?.code || err?.message || '', appLanguage);
      setError(friendly);
    } finally {
      setLoading(false);
    }
  };

  // 4. FORGOT PASSWORD
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError(isHi ? 'कृपया पासवर्ड रीसेट के लिए अपना ईमेल दर्ज करें।' : 'Please enter your email to receive the password reset link.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await sendUserPasswordReset(cleanEmail);
      setSuccessMessage(isHi ? 'पासवर्ड रीसेट लिंक आपके ईमेल पर भेज दिया गया है।' : 'Password reset link sent to your email. Please check your inbox.');
    } catch (err: any) {
      console.warn('Password Reset Handled:', err?.message || err);
      const friendly = getFriendlyAuthErrorMessage(err?.code || err?.message || '', appLanguage);
      setError(friendly);
    } finally {
      setLoading(false);
    }
  };

  // 5. SIGN OUT
  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      
      const guestProfile: UserProfile = {
        ...userProfile,
        uid: `guest_${Date.now().toString(36)}`,
        name: 'Guest Student',
        email: '',
        authProvider: 'guest',
        isOnboarded: false
      };

      setUserProfile(guestProfile);
      localStorage.setItem('ascend_user_profile', JSON.stringify(guestProfile));
      localStorage.removeItem('ascend_onboarded');
      setSuccessMessage(isHi ? 'सफलतापूर्वक लॉग आउट किया गया।' : 'Signed out successfully.');

      setTimeout(() => {
        setCurrentTab('signin');
        onClose();
      }, 800);
    } catch (err: any) {
      console.error('Sign Out Error:', err);
      setError(err?.message || 'Error signing out.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-auto text-slate-100 relative"
      >
        {/* Top Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-indigo-900/60 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg font-black text-xl">
              🎓
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-1.5">
                <span>{isHi ? 'छात्र खाता व प्रमाणीकरण' : 'Student Authentication'}</span>
              </h3>
              <p className="text-xs text-indigo-200/80">
                {isHi ? 'रिमिक्स स्टडी बडी में आपका स्वागत है' : 'Ascend Study — Sync your progress & XP'}
              </p>
            </div>
          </div>
          {isLoggedIn && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tab Navigation (If not currently signed in) */}
        {!isLoggedIn && currentTab !== 'forgot' && (
          <div className="flex border-b border-slate-800 bg-slate-950/40 p-1.5">
            <button
              onClick={() => handleTabChange('signin')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                currentTab === 'signin'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isHi ? 'साइन इन / लॉग इन' : 'Sign In (Log In)'}
            </button>
            <button
              onClick={() => handleTabChange('signup')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                currentTab === 'signup'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isHi ? 'नया खाता बनाएं' : 'Create Account'}
            </button>
          </div>
        )}

        <div className="p-5 sm:p-6 space-y-4">
          {/* Status Notifications */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-200 text-xs space-y-2.5"
              >
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>

                {isUnauthorizedDomain && (
                  <div className="mt-2 pt-2.5 border-t border-rose-800/40 space-y-2 text-[11px] text-slate-300">
                    <div className="flex items-center justify-between font-semibold text-amber-300">
                      <span>{isHi ? 'Firebase में यह डोमेन जोड़ें:' : 'Add Domain in Firebase Console:'}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">coreai-a7cf4</span>
                    </div>

                    <div className="flex items-center space-x-2 bg-slate-950 border border-slate-700/60 p-2 rounded-lg">
                      <code className="text-[11px] text-cyan-300 select-all font-mono break-all flex-1">
                        {typeof window !== 'undefined' ? window.location.hostname : 'run.app domain'}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            navigator.clipboard.writeText(window.location.hostname);
                            setCopiedDomain(true);
                            setTimeout(() => setCopiedDomain(false), 2500);
                          }
                        }}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-semibold shrink-0 transition cursor-pointer"
                      >
                        {copiedDomain ? (isHi ? 'कॉपी हुआ ✓' : 'Copied ✓') : (isHi ? 'डोमेन कॉपी करें' : 'Copy Domain')}
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-400 space-y-1">
                      <p className="font-semibold text-slate-300">{isHi ? 'त्वरित 3 स्टेप्स (30 सेकंड):' : '3 Quick Steps (30 seconds):'}</p>
                      <ol className="list-decimal list-inside space-y-0.5 pl-1 text-slate-300">
                        <li>{isHi ? 'Firebase Console खोलें (प्रोजेक्ट: coreai-a7cf4)' : 'Open Firebase Console (Project: coreai-a7cf4)'}</li>
                        <li>{isHi ? 'Authentication > Settings > Authorized domains खोलें' : 'Navigate to Authentication → Settings → Authorized domains'}</li>
                        <li>{isHi ? '"Add domain" पर क्लिक करके यह डोमेन पेस्ट करें' : 'Click "Add domain" and paste this domain'}</li>
                      </ol>
                    </div>

                    <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 flex items-center space-x-1.5">
                      <span className="text-sm">✨</span>
                      <span>{isHi ? 'ईमेल और पासवर्ड लॉगिन बिना किसी रुकावट के 100% तुरंत काम कर रहा है!' : 'Email & Password login works 100% without any domain restrictions!'}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-start space-x-2"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* TAB 1: SIGN IN */}
          {currentTab === 'signin' && (
            <div className="space-y-4">
              {/* Continue with Google Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2.5 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isHi ? 'गूगल के साथ जारी रखें' : 'Continue with Google'}</span>
              </button>

              <div className="flex items-center space-x-2 text-slate-500 text-xs">
                <div className="flex-1 h-px bg-slate-800"></div>
                <span className="text-[11px] font-bold uppercase">{isHi ? 'या ईमेल से साइन इन करें' : 'or sign in with email'}</span>
                <div className="flex-1 h-px bg-slate-800"></div>
              </div>

              <form onSubmit={handleSignIn} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{isHi ? 'ईमेल पता' : 'Email Address'}</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    required
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{isHi ? 'पासवर्ड' : 'Password'}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleTabChange('forgot')}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                    >
                      {isHi ? 'पासवर्ड भूल गए?' : 'Forgot Password?'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{isHi ? 'लॉग इन करें' : 'Sign In'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-2 text-center">
                <p className="text-xs text-slate-400">
                  {isHi ? 'नया खाता चाहिए?' : "Don't have an account yet?"}{' '}
                  <button
                    onClick={() => handleTabChange('signup')}
                    className="text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
                  >
                    {isHi ? 'नया खाता बनाएं' : 'Create Free Account'}
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: SIGN UP (CREATE ACCOUNT) */}
          {currentTab === 'signup' && (
            <div className="space-y-4">
              {/* Google signup option */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2.5 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isHi ? 'गूगल से 1-क्लिक में खाता बनाएं' : 'Sign Up with Google (1-Click)'}</span>
              </button>

              <div className="flex items-center space-x-2 text-slate-500 text-xs">
                <div className="flex-1 h-px bg-slate-800"></div>
                <span className="text-[11px] font-bold uppercase">{isHi ? 'या फॉर्म भरें' : 'or enter details'}</span>
                <div className="flex-1 h-px bg-slate-800"></div>
              </div>

              <form onSubmit={handleSignUp} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{isHi ? 'पूरा नाम' : 'Full Name'}</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Rohit Yadav"
                    required
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{isHi ? 'ईमेल पता' : 'Email Address'}</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    required
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{isHi ? 'नया पासवर्ड' : 'Create Password'}</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      minLength={6}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                      <GraduationCap className="w-3 h-3 text-indigo-400" />
                      <span>{isHi ? 'कक्षा / श्रेणी' : 'Class / Grade'}</span>
                    </label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                    >
                      {CLASSES.map((c) => (
                        <option key={c} value={c} className="bg-slate-900 text-white">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                      <Target className="w-3 h-3 text-indigo-400" />
                      <span>{isHi ? 'मुख्य लक्ष्य' : 'Target Goal'}</span>
                    </label>
                    <select
                      value={selectedGoal}
                      onChange={(e) => setSelectedGoal(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                    >
                      {TARGET_GOALS.map((g) => (
                        <option key={g} value={g} className="bg-slate-900 text-white">
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{isHi ? 'खाता बनाएं (+150 XP बोनस)' : 'Create Account (+150 XP)'}</span>
                    </>
                  )}
                </button>
              </form>

              <div className="pt-2 text-center">
                <p className="text-xs text-slate-400">
                  {isHi ? 'पहले से खाता है?' : 'Already have an account?'}{' '}
                  <button
                    onClick={() => handleTabChange('signin')}
                    className="text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
                  >
                    {isHi ? 'साइन इन करें' : 'Sign In here'}
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {currentTab === 'forgot' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-indigo-950/50 border border-indigo-500/30 rounded-2xl text-xs text-indigo-200">
                <p className="font-bold text-white mb-1">{isHi ? 'पासवर्ड रीसेट करें' : 'Reset Your Password'}</p>
                <p className="text-[11px] text-slate-300">
                  {isHi 
                    ? 'अपना पंजीकृत ईमेल दर्ज करें। हम आपको पासवर्ड रीसेट करने का लिंक भेजेंगे।' 
                    : 'Enter your registered email address and we will send you a secure password reset link.'}
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{isHi ? 'ईमेल पता' : 'Email Address'}</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    required
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>{isHi ? 'रीसेट लिंक भेजें' : 'Send Reset Link'}</span>
                  )}
                </button>
              </form>

              <button
                onClick={() => handleTabChange('signin')}
                className="w-full py-2 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
              >
                ← {isHi ? 'साइन इन पर वापस जाएं' : 'Back to Sign In'}
              </button>
            </div>
          )}

          {/* TAB 4: PROFILE / ACCOUNT MANAGER (WHEN LOGGED IN) */}
          {(isLoggedIn || currentTab === 'profile') && (
            <div className="space-y-4">
              <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-4 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-2xl shrink-0">
                    {userProfile.photoURL ? (
                      <img src={userProfile.photoURL} alt="Avatar" className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      userProfile.avatar || '🧑‍🎓'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-extrabold text-white truncate">
                      {userProfile.name || (auth.currentUser?.displayName) || 'Student'}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">
                      {userProfile.email || auth.currentUser?.email || 'No email associated'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>{userProfile.authProvider === 'google' ? 'Google Auth' : 'Verified'}</span>
                      </span>
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">
                        Lvl {userProfile.level} ({userProfile.xp} XP)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/50 text-[11px] text-slate-300">
                  <div>
                    <span className="text-slate-500 block">{isHi ? 'कक्षा:' : 'Class:'}</span>
                    <span className="font-bold text-white truncate block">{userProfile.className || 'Not set'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{isHi ? 'लक्ष्य:' : 'Target:'}</span>
                    <span className="font-bold text-white truncate block">{userProfile.targetGoal || 'Not set'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={loading}
                  className="w-full py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isHi ? 'लॉग आउट करें' : 'Sign Out of Account'}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  {isHi ? 'बंद करें' : 'Done / Close'}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
