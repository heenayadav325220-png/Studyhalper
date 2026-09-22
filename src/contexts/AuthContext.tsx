import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  db,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithGoogle as firebaseSignInWithGoogle,
  sendUserPasswordReset,
  updateProfile as firebaseUpdateProfile,
  getFriendlyAuthErrorMessage,
  withTimeout,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from '../services/firebase';
import type { FirebaseUser } from '../services/firebase';
import type { UserProfile } from '../types';

export interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  setAuthError: (err: string | null) => void;
  signInWithEmail: (email: string, password: string) => Promise<FirebaseUser>;
  signUpWithEmail: (email: string, password: string, name: string, extra?: Partial<UserProfile>) => Promise<FirebaseUser>;
  signInWithGoogle: () => Promise<FirebaseUser>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfileData: (data: Partial<UserProfile>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_PROFILE: UserProfile = {
  uid: '',
  name: 'Student',
  email: '',
  avatar: '🧑‍🎓',
  avatarType: 'emoji',
  avatarBg: 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600',
  xp: 100,
  level: 1,
  streak: 1,
  petLevel: 1,
  petXp: 0,
  petName: 'Nova',
  language: 'en',
  lastActive: new Date().toISOString(),
  isOnboarded: false,
  authProvider: 'password'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('ascend_user_profile');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sync profile with Firestore & LocalStorage
  const fetchOrInitUserProfile = async (user: FirebaseUser): Promise<UserProfile> => {
    const userDocRef = doc(db, 'users', user.uid);
    let profile: UserProfile = {
      ...DEFAULT_PROFILE,
      uid: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'Student',
      email: user.email || '',
      photoURL: user.photoURL || undefined,
      avatar: user.photoURL || '🧑‍🎓',
      avatarType: user.photoURL ? 'personal' : 'emoji',
      authProvider: user.providerData?.[0]?.providerId?.includes('google') ? 'google' : 'password',
      lastActive: new Date().toISOString()
    };

    try {
      const snap = await withTimeout(getDoc(userDocRef), 2000, 'getDoc timeout');
      if (snap.exists()) {
        const data = snap.data() as Partial<UserProfile>;
        profile = {
          ...profile,
          ...data,
          uid: user.uid, // Ensure uid strictly matches
          name: data.name || profile.name,
          xp: typeof data.xp === 'number' ? data.xp : 100,
          streak: typeof data.streak === 'number' ? data.streak : 1,
          level: typeof data.level === 'number' ? data.level : 1,
          lastActive: new Date().toISOString()
        };

        // Non-blocking update lastActive timestamp in Firestore (throttled to once every 15 minutes)
        const lastActiveTime = data.lastActive ? new Date(data.lastActive).getTime() : 0;
        if (Date.now() - lastActiveTime > 15 * 60 * 1000) {
          updateDoc(userDocRef, {
            lastActive: new Date().toISOString()
          }).catch(() => {});
        }
      } else {
        // Create initial user document complying with firestore.rules (isValidUser)
        setDoc(userDocRef, {
          uid: profile.uid,
          name: profile.name,
          email: profile.email || '',
          xp: profile.xp,
          level: profile.level,
          streak: profile.streak,
          petLevel: profile.petLevel,
          petXp: profile.petXp,
          petName: profile.petName,
          language: profile.language,
          lastActive: profile.lastActive,
          isOnboarded: profile.isOnboarded || false,
          authProvider: profile.authProvider,
          createdAt: serverTimestamp()
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('Firestore profile fetch warning (using local fallback):', err);
    }

    // Persist to localStorage
    try {
      localStorage.setItem('ascend_user_profile', JSON.stringify(profile));
      localStorage.setItem(`user_profile_${user.uid}`, JSON.stringify(profile));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    setUserProfile(profile);
    return profile;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user && !user.isAnonymous) {
        try {
          await fetchOrInitUserProfile(user);
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string): Promise<FirebaseUser> => {
    setLoading(true);
    setAuthError(null);
    try {
      const cred = await withTimeout(
        signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password),
        2500,
        'Auth request timed out'
      );
      await fetchOrInitUserProfile(cred.user);
      return cred.user;
    } catch (err: any) {
      const msg = getFriendlyAuthErrorMessage(err?.code || err?.message || '');
      setAuthError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string, 
    password: string, 
    name: string,
    extra?: Partial<UserProfile>
  ): Promise<FirebaseUser> => {
    setLoading(true);
    setAuthError(null);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim() || 'Student';
      const cred = await withTimeout(
        createUserWithEmailAndPassword(auth, cleanEmail, password),
        2500,
        'Signup request timed out'
      );
      
      // Update Firebase Auth user display name
      try {
        await firebaseUpdateProfile(cred.user, { displayName: cleanName });
      } catch (e) {
        console.warn('Could not set displayName:', e);
      }

      // Create profile in Firestore
      const userDocRef = doc(db, 'users', cred.user.uid);
      const newProfile: UserProfile = {
        ...DEFAULT_PROFILE,
        ...extra,
        uid: cred.user.uid,
        name: cleanName,
        email: cleanEmail,
        xp: 250, // Welcome signup bonus
        streak: 1,
        level: 1,
        isOnboarded: true,
        authProvider: 'password',
        lastActive: new Date().toISOString()
      };

      setDoc(userDocRef, {
        uid: newProfile.uid,
        name: newProfile.name,
        email: newProfile.email,
        xp: newProfile.xp,
        level: newProfile.level,
        streak: newProfile.streak,
        petLevel: newProfile.petLevel,
        petXp: newProfile.petXp,
        petName: newProfile.petName,
        language: newProfile.language,
        lastActive: newProfile.lastActive,
        isOnboarded: true,
        className: newProfile.className || '',
        targetGoal: newProfile.targetGoal || '',
        authProvider: 'password',
        createdAt: serverTimestamp()
      }).catch(err => console.warn('Initial Firestore write warning:', err));

      setUserProfile(newProfile);
      localStorage.setItem('ascend_user_profile', JSON.stringify(newProfile));
      localStorage.setItem(`user_profile_${cred.user.uid}`, JSON.stringify(newProfile));
      localStorage.setItem('ascend_onboarded', 'true');

      return cred.user;
    } catch (err: any) {
      const msg = getFriendlyAuthErrorMessage(err?.code || err?.message || '');
      setAuthError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<FirebaseUser> => {
    setLoading(true);
    setAuthError(null);
    try {
      const user = await firebaseSignInWithGoogle(90000);
      await fetchOrInitUserProfile(user);
      return user;
    } catch (err: any) {
      const msg = getFriendlyAuthErrorMessage(err?.code || err?.message || '');
      setAuthError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      localStorage.removeItem('ascend_user_profile');
    } catch (err: any) {
      const msg = getFriendlyAuthErrorMessage(err?.code || err?.message || '');
      setAuthError(msg);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    setLoading(true);
    setAuthError(null);
    try {
      await sendUserPasswordReset(email.trim().toLowerCase());
    } catch (err: any) {
      const msg = getFriendlyAuthErrorMessage(err?.code || err?.message || '');
      setAuthError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfileData = async (data: Partial<UserProfile>): Promise<void> => {
    if (!currentUser && !userProfile) return;
    const uid = currentUser?.uid || userProfile?.uid;
    if (!uid) return;

    const updated = {
      ...(userProfile || DEFAULT_PROFILE),
      ...data,
      uid,
      lastActive: new Date().toISOString()
    };

    setUserProfile(updated);
    localStorage.setItem('ascend_user_profile', JSON.stringify(updated));
    localStorage.setItem(`user_profile_${uid}`, JSON.stringify(updated));

    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', uid);
        await updateDoc(userDocRef, {
          ...data,
          lastActive: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Could not sync profile update to Firestore:', err);
      }
    }
  };

  const refreshUserProfile = async (): Promise<void> => {
    if (currentUser) {
      await fetchOrInitUserProfile(currentUser);
    }
  };

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    authError,
    setAuthError,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    logout,
    resetPassword,
    updateUserProfileData,
    refreshUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
