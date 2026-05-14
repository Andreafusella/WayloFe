import BouncyPressable from '@/components/BouncyPressable';
import { ThemedText } from '@/components/ThemedText';
import { ensurePreciseLocation, hasPreciseLocationAccess } from '@/utils/position';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PositionRequest() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const navigateIfGranted = useCallback(async () => {
    const ok = await hasPreciseLocationAccess();
    if (ok) {
      router.replace('/(tabs)');
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      void navigateIfGranted();
    }, [navigateIfGranted]),
  );

  const onRequest = async () => {
    setBusy(true);
    try {
      const ok = await ensurePreciseLocation();
      if (ok) {
        router.replace('/(tabs)');
      }
    } finally {
      setBusy(false);
    }
  };

  const bottomPad = Platform.OS === 'ios' ? insets.bottom + 24 : Math.max(insets.bottom, 24);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: Math.max(insets.top, 32),
          paddingHorizontal: 28,
          paddingBottom: bottomPad,
          justifyContent: 'center',
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: 16 }}>
          <ThemedText type="title">Posizione precisa richiesta</ThemedText>
          <ThemedText style={{ opacity: 0.85 }}>
            Su iPhone, dopo aver concesso la posizione, attiva anche «Posizione precisa» nelle Impostazioni dell&apos;app Waylo.
            Se è disattivata, al tocco del pulsante comparirà un messaggio con la scorciatoia per aprire Impostazioni (nessun
            secondo popup di sistema solo «una volta»).
          </ThemedText>
          <View style={{ height: 8 }} />
          <BouncyPressable
            style={{
              backgroundColor: '#007AFF',
              paddingVertical: 15,
              borderRadius: 12,
              alignItems: 'center',
              opacity: busy ? 0.7 : 1,
            }}
            onPress={() => void onRequest()}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText type="subtitle" style={{ color: '#fff' }}>
                Consenti posizione precisa
              </ThemedText>
            )}
          </BouncyPressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
