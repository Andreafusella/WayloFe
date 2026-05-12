import { onAuthStateChanged, onIdTokenChanged, type User } from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { auth } from '@/config/firebaseConfig';
import {
  fetchAccountProfile,
  type IUserInfo,
} from '@/service/AuthService';

/** Stato combinato Firebase + GET /account/me (profilo sul BE tramite firebaseId nel JWT). */
export type AuthStatus =
  | 'loading'
  | 'unauthenticated'
  | 'needs_verification'
  | 'needs_profile'
  | 'authenticated'
  | 'backend_error';

interface AuthContextValue {
  user: User | null;
  /** Firebase ha emesso il primo snapshot (persistenza RN valutata). */
  isReady: boolean;
  /** Risultato di /account/me: null dopo fetch con 404, undefined solo durante caricamento iniziale (non espone undefined al consumer). */
  profile: IUserInfo | null;
  isBackendLoading: boolean;
  authStatus: AuthStatus;
  /** Riprova fetch profilo dopo errori di rete o 5xx (non per 404). */
  refreshProfile: () => Promise<void>;
  /** Sincronizza lo stato React con firebase in-place (es. dopo reload) */
  syncFirebaseState: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const [profile, setProfile] = useState<IUserInfo | null>(null);
  const [isBackendLoading, setIsBackendLoading] = useState(false);
  const [backendError, setBackendError] = useState(false);

  const updateFirebaseState = useCallback((u: User | null) => {
    setUser(u);
    setEmailVerified(u?.emailVerified ?? false);
  }, []);

  const syncFirebaseState = useCallback(() => {
    updateFirebaseState(auth.currentUser);
  }, [updateFirebaseState]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      updateFirebaseState(firebaseUser);
      setIsReady(true);
    });
    const unsubToken = onIdTokenChanged(auth, (firebaseUser) => {
      updateFirebaseState(firebaseUser);
    });
    return () => {
      unsubscribe();
      unsubToken();
    };
  }, [updateFirebaseState]);

  const refreshProfile = useCallback(async () => {
    const current = auth.currentUser;
    if (!current?.emailVerified) {
      setProfile(null);
      setBackendError(false);
      setIsBackendLoading(false);
      return;
    }

    setIsBackendLoading(true);
    setBackendError(false);
    try {
      const next = await fetchAccountProfile();
      setProfile(next);
      if (next === null) {
        /* profilo da creare (404) — ok */
      }
    } catch {
      setBackendError(true);
      setProfile(null);
    } finally {
      setIsBackendLoading(false);
    }
  }, []);

  const firebaseUid = user?.uid ?? null;

  useEffect(() => {
    void refreshProfile();
  }, [firebaseUid, emailVerified, refreshProfile]);

  const authStatus = useMemo((): AuthStatus => {
    if (!isReady) {
      return 'loading';
    }
    const u = user;
    if (!u) {
      return 'unauthenticated';
    }
    if (!emailVerified) {
      return 'needs_verification';
    }
    if (isBackendLoading && !profile && !backendError) {
      return 'loading';
    }
    if (backendError) {
      return 'backend_error';
    }
    if (!profile) {
      return 'needs_profile';
    }
    return 'authenticated';
  }, [isReady, user, emailVerified, profile, isBackendLoading, backendError]);

  const value = useMemo(
    () => ({
      user,
      isReady,
      profile,
      isBackendLoading,
      authStatus,
      refreshProfile,
      syncFirebaseState,
    }),
    [user, isReady, profile, isBackendLoading, authStatus, refreshProfile, syncFirebaseState],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve essere usato dentro AuthProvider');
  }
  return context;
}
