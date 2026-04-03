import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import type { AppSettings, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  settings: AppSettings | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEFAULT_SETTINGS: AppSettings = {
  userA: {
    email: '',
    kakaoName: '정일형',
    displayName: '정일형',
  },
  userB: {
    email: '',
    kakaoName: '고은서',
    displayName: '고은서',
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = async (): Promise<AppSettings> => {
    const ref = doc(db, 'settings', 'users');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as AppSettings;
    }
    // 최초 실행 시 기본 설정 저장
    await setDoc(ref, DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  };

  const determineRole = (email: string, appSettings: AppSettings): UserRole => {
    if (email === appSettings.userA.email) return 'A';
    if (email === appSettings.userB.email) return 'B';
    return null;
  };

  const refreshSettings = async () => {
    const appSettings = await loadSettings();
    setSettings(appSettings);
    if (user?.email) {
      setRole(determineRole(user.email, appSettings));
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser?.email) {
        const appSettings = await loadSettings();
        setSettings(appSettings);
        // 이메일이 settings에 없으면 처음 로그인한 것으로 간주하여 역할 결정
        let r = determineRole(firebaseUser.email, appSettings);
        // settings에 email이 아직 없는 경우: userA.email이 비어있으면 첫 번째 유저
        if (r === null) {
          if (!appSettings.userA.email) {
            const updated = { ...appSettings, userA: { ...appSettings.userA, email: firebaseUser.email } };
            await setDoc(doc(db, 'settings', 'users'), updated);
            setSettings(updated);
            r = 'A';
          } else if (!appSettings.userB.email) {
            const updated = { ...appSettings, userB: { ...appSettings.userB, email: firebaseUser.email } };
            await setDoc(doc(db, 'settings', 'users'), updated);
            setSettings(updated);
            r = 'B';
          }
        }
        setRole(r);
      } else {
        setRole(null);
        setSettings(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, role, settings, loading, login, logout, refreshSettings }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
