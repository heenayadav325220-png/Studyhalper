import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  onSuccess?: () => void;
  initialMode?: 'signin' | 'signup' | 'forgot';
}

export const Login: React.FC<LoginProps> = ({ onSuccess, initialMode = 'signin' }) => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword } = useAuth();
  
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (mode === 'forgot') {
      setLoading(true);
      try {
        await resetPassword(cleanEmail);
        setSuccess('Password reset link sent! Check your inbox.');
      } catch (err: any) {
        setError(err.message || 'Failed to send reset link.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(cleanEmail, password);
        setSuccess('Welcome back! Signed in successfully.');
      } else {
        await signUpWithEmail(cleanEmail, password, name.trim() || 'Student');
        setSuccess('Account created successfully! +250 XP earned.');
      }
      if (onSuccess) {
        setTimeout(onSuccess, 600);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setIsUnauthorizedDomain(false);
    setCopiedDomain(false);
    setSuccess(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      setSuccess('Signed in with Google successfully!');
      if (onSuccess) {
        setTimeout(onSuccess, 600);
      }
    } catch (err: any) {
      if (!err.message?.includes('closed-by-user')) {
        const errStr = `${err?.code || ''} ${err?.message || ''}`.toLowerCase();
        if (errStr.includes('unauthorized-domain')) {
          setIsUnauthorizedDomain(true);
        }
        setError(err.message || 'Google Sign-In failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 mb-4 flex items-center justify-center">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <BookOpen className="w-7 h-7 text-indigo-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
          {mode === 'signin' && 'Welcome Back'}
          {mode === 'signup' && 'Create Study Account'}
          {mode === 'forgot' && 'Reset Password'}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {mode === 'signin' && 'Sign in to access your synchronized notes & exams'}
          {mode === 'signup' && 'Join thousands of students and boost your study streaks'}
          {mode === 'forgot' && 'Enter your email to receive recovery instructions'}
        </p>
      </div>

      {/* Google Sign-In Button */}
      {mode !== 'forgot' && (
        <div className="space-y-4 mb-6">
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-3 py-3 px-4 bg-slate-950/80 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-xl font-medium text-slate-200 transition-all duration-150 disabled:opacity-60 cursor-pointer shadow-sm hover:shadow-indigo-500/10"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            <span className="text-sm">Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-xs uppercase tracking-wider text-slate-500 font-semibold absolute">
              or continue with email
            </span>
          </div>
        </div>
      )}

      {/* Notifications */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-2 text-rose-300 text-xs"
          >
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span className="leading-relaxed">{error}</span>
            </div>

            {isUnauthorizedDomain && (
              <div className="mt-2 pt-2 border-t border-rose-500/20 space-y-2 text-[11px] text-slate-300">
                <div className="flex items-center justify-between font-semibold text-amber-300">
                  <span>Firebase Authorized Domain:</span>
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
                    {copiedDomain ? 'Copied ✓' : 'Copy Domain'}
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-300">Steps to authorize in Firebase Console:</p>
                  <ol className="list-decimal list-inside space-y-0.5 pl-1 text-slate-300">
                    <li>Open Firebase Console (coreai-a7cf4)</li>
                    <li>Go to Authentication → Settings → Authorized domains</li>
                    <li>Click "Add domain" and paste the domain above</li>
                  </ol>
                </div>

                <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 flex items-center space-x-1.5">
                  <span className="text-sm">✨</span>
                  <span>Email & Password sign-up and login works 100% right now without any domain setup!</span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start space-x-2 text-emerald-300 text-xs"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span className="leading-relaxed">{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rohit Yadav"
                className="w-full bg-slate-950/70 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden transition"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              className="w-full bg-slate-950/70 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden transition"
            />
          </div>
        </div>

        {mode !== 'forgot' && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Password
              </label>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/70 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-60 cursor-pointer text-sm"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>
                {mode === 'signin' && 'Sign In'}
                {mode === 'signup' && 'Create Account'}
                {mode === 'forgot' && 'Send Reset Link'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Toggle View Footer */}
      <div className="mt-6 text-center text-xs text-slate-400">
        {mode === 'signin' && (
          <p>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setSuccess(null);
              }}
              className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
            >
              Sign up free
            </button>
          </p>
        )}
        {mode === 'signup' && (
          <p>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setSuccess(null);
              }}
              className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
            >
              Sign in
            </button>
          </p>
        )}
        {mode === 'forgot' && (
          <p>
            Remember your password?{' '}
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setSuccess(null);
              }}
              className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
            >
              Back to Sign In
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
