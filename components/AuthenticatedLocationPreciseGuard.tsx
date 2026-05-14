import { useAuth } from '@/context/AuthContext';
import { hasPreciseLocationAccess, routeNeedsPreciseLocation } from '@/utils/position';
import { usePathname, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/** Ricontrolla all'avvio e ogni volta che l'app torna in foreground dopo login. */
export function AuthenticatedLocationPreciseGuard() {
  const { authStatus, isReady } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const enforce = useCallback(async () => {
    if (!routeNeedsPreciseLocation(pathnameRef.current)) return;
    const ok = await hasPreciseLocationAccess();
    if (!ok) {
      router.replace('/views/position/PositionRequest');
    }
  }, [router]);

  useEffect(() => {
    if (!isReady || authStatus !== 'authenticated') return;
    void enforce();
  }, [isReady, authStatus, pathname, enforce]);

  useEffect(() => {
    if (!isReady || authStatus !== 'authenticated') return undefined;

    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      void enforce();
    });
    return () => sub.remove();
  }, [isReady, authStatus, enforce]);

  return null;
}
