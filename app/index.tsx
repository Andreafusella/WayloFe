import { Redirect } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { hasPreciseLocationAccess } from '@/utils/position';
import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, Text, View } from 'react-native';

export default function Index() {
  const { authStatus, refreshProfile } = useAuth();
  const [locationOk, setLocationOk] = useState<boolean | null>(null);

  const needsLocationGate = authStatus === 'authenticated';

  useEffect(() => {
    if (!needsLocationGate) {
      setLocationOk(null);
      return;
    }

    let cancelled = false;
    void hasPreciseLocationAccess().then((ok) => {
      if (!cancelled) setLocationOk(ok);
    });

    return () => {
      cancelled = true;
    };
  }, [needsLocationGate]);

  useEffect(() => {
    if (!needsLocationGate) {
      return undefined;
    }

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void hasPreciseLocationAccess().then(setLocationOk);
      }
    });
    return () => sub.remove();
  }, [needsLocationGate]);

  if (authStatus === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (authStatus === 'backend_error') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, gap: 16 }}>
        <Text style={{ textAlign: 'center', fontSize: 16 }}>
          Non abbiamo potuto caricare il tuo profilo. Verifica la connessione al server e riprova.
        </Text>
        <Pressable
          onPress={() => void refreshProfile()}
          style={{ paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, backgroundColor: '#111' }}
          accessibilityRole="button"
          accessibilityLabel="Riprova a caricare il profilo"
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Riprova</Text>
        </Pressable>
      </View>
    );
  }

  if (authStatus === 'unauthenticated') {
    return <Redirect href="/views/auth/Login" />;
  }

  if (authStatus === 'needs_verification') {
    return <Redirect href="/views/auth/VerifyEmail" />;
  }

  if (authStatus === 'needs_profile') {
    return <Redirect href="/views/auth/Register" />;
  }

  if (locationOk === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!locationOk) {
    return <Redirect href="/views/position/PositionRequest" />;
  }

  return <Redirect href="/(tabs)" />;
}
