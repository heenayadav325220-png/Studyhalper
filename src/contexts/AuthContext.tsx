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
  streak: 0,
  petLevel: 1,
  petXp: 0,
  petName: 'Nova',
  language: 'en',
  lastActive: new Date().toISOString(),
  isOnboarded: false,
  authProvider: 'password',
  lastStreakDate: '',
  unlockedBadges: []
};

// Clean up legacy plaintext password records from localStorage
if (typeof window !== 'undefined') {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('account_')) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    // ignore
  }
}

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
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as Partial<UserProfile>;
        let unlocked = Array.isArray(data.unlockedBadges) ? data.unlockedBadges : [];
        if (unlocked.length === 0) {
          try {
            const saved = localStorage.getItem('ascend_celebrated_badges');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                unlocked = parsed;
                updateDoc(userDocRef, { unlockedBadges: unlocked }).catch(() => {});
              }
            }
          } catch (e) {
            console.warn('Local storage badge migration warning:', e);
          }
        }

        profile = {
          ...profile,
          ...data,
          uid: user.uid,
          name: data.name || profile.name,
          email: user.email || data.email || '',
          xp: typeof data.xp === 'number' ? data.xp : 100,
          streak: typeof data.streak === 'number' ? data.streak : 0,
          level: typeof data.level === 'number' ? data.level : 1,
          lastActive: new Date().toISOString(),
          lastStreakDate: data.lastStreakDate || '',
          unlockedBadges: unlocked
        };

        const lastActiveTime = data.lastActive ? new Date(data.lastActive).getTime() : 0;
        if (Date.now() - lastActiveTime > 15 * 60 * 1000) {
          updateDoc(userDocRef, {
            lastActive: new Date().toISOString()
          }).catch(() => {});
        }
      } else {
        await setDoc(userDocRef, {
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
          lastStreakDate: profile.lastStreakDate || '',
          unlockedBadges: [],
          isOnboarded: profile.isOnboarded || false,
          authProvider: profile.authProvider,
          createdAt: serverTimestamp()
        }, { merge: true });
      }
    } catch (err) {
      console.debug('Firestore profile fetch/init warning (using local fallback):', err);
    }

    try {
      localStorage.setItem('ascend_user_profile', JSON.stringify(profile));
      localStorage.setItem(`user_profile_${user.uid}`, JSON.stringify(profile));
    } catch (e) {
      console.debug('LocalStorage save error:', e);
    }

    setUserProfile(profile);
    return profile;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
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
      const cleanEmail = email.trim().toLowerCase();
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = cred.user;
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
      let user: FirebaseUser;

      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      user = cred.user;

      try {
        await firebaseUpdateProfile(user, { displayName: cleanName });
      } catch (e) {
        console.warn('Could not set displayName:', e);
      }

      const profile = await fetchOrInitUserProfile(user);
      const updatedProfile: UserProfile = {
        ...profile,
        ...extra,
        name: cleanName,
        email: cleanEmail,
        authProvider: 'password',
        isOnboarded: true
      };

      setUserProfile(updatedProfile);
      localStorage.setItem('ascend_user_profile', JSON.stringify(updatedProfile));
      localStorage.setItem(`user_profile_${user.uid}`, JSON.stringify(updatedProfile));
      localStorage.setItem('ascend_onboarded', 'true');

      try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          name: cleanName,
          email: cleanEmail,
          isOnboarded: true,
          authProvider: 'password'
        });
      } catch (e) {
        console.warn('Profile update sync error:', e);
      }

      return user;
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
      const user = await firebaseSignInWithGoogle();
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

    let finalData = { ...data };

    if (finalData.xp !== undefined && userProfile) {
      const currentXp = userProfile.xp || 0;
      const proposedXp = finalData.xp;
      const diffXp = proposedXp - currentXp;
      if (diffXp > 500) {
        finalData.xp = currentXp + 500;
      }
    }

    const updated = {
      ...(userProfile || DEFAULT_PROFILE),
      ...finalData,
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
          ...finalData,
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
