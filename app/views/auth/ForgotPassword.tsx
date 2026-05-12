import BouncyPressable from '@/components/BouncyPressable';
import { ThemedIcon } from '@/components/ThemedIcon';
import { ThemedText } from '@/components/ThemedText';
import ThemedTextInput from '@/components/ThemedTextInput';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { firebaseAuthErrorMessage, sendPasswordResetForEmail } from '@/service/AuthService';
import { isValidEmail } from '@/utils/validation';
import { Redirect, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Keyboard, Platform, Pressable, ScrollView, TouchableWithoutFeedback, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ForgotPassword = () => {
    const insets = useSafeAreaInsets();
    const scheme = useColorScheme() ?? 'light';
    const router = useRouter();
    const { authStatus } = useAuth();

    const [email, setEmail] = useState('');
    const [busy, setBusy] = useState(false);

    const palette = useMemo(
        () =>
            scheme === 'light'
                ? {
                      pageBg: Colors.light.background,
                      border: '#E5E5EA',
                      muted: '#6B7280',
                      inputBg: '#FAFAFA',
                  }
                : {
                      pageBg: Colors.dark.background,
                      border: '#38383A',
                      muted: '#8E8E93',
                      inputBg: '#1C1C1E',
                  },
        [scheme],
    );

    if (authStatus !== 'unauthenticated') {
        return <Redirect href="/" />;
    }

    const inputPadV = Platform.OS === 'ios' ? 14 : 10;

    const submit = async () => {
        if (!email.trim() || !isValidEmail(email)) {
            Alert.alert('Email non valida', 'Inserisci un indirizzo email corretto.');
            return;
        }
        setBusy(true);
        try {
            await sendPasswordResetForEmail(email);
            Alert.alert(
                'Controlla la posta',
                'Se esiste un account con questa email e accesso tramite password, ti abbiamo inviato un link per impostarne una nuova. Controlla anche lo spam.',
                [{ text: 'OK', onPress: () => router.replace('/views/auth/Login') }],
            );
        } catch (error: unknown) {
            Alert.alert(
                'Invio non riuscito',
                firebaseAuthErrorMessage(
                    typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: string }).code : undefined,
                ),
            );
        } finally {
            setBusy(false);
        }
    };

    const goBack = () => {
        if (router.canGoBack()) router.back();
        else router.replace('/views/auth/Login');
    };

    return (
        <View style={{ flex: 1, backgroundColor: palette.pageBg }}>
            <ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingTop: insets.top + 20,
                    paddingHorizontal: 24,
                    paddingBottom: Math.max(insets.bottom, 32),
                }}
                keyboardShouldPersistTaps="handled"
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <View style={{ width: '100%', maxWidth: 400, alignSelf: 'center' }} collapsable={false}>
                        <Pressable
                            onPress={goBack}
                            hitSlop={12}
                            accessibilityRole="button"
                            accessibilityLabel="Indietro"
                            style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 }}
                        >
                            <ThemedIcon name="chevron-back" size={22} lightColor={scheme === 'light' ? '#111' : '#FFF'} darkColor={scheme === 'light' ? '#111' : '#FFF'} />
                            <ThemedText style={{ fontSize: 15, fontWeight: '600' }}>Login</ThemedText>
                        </Pressable>

                        <ThemedText type="title" style={{ marginBottom: 8, fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.5 }}>
                            Password dimenticata
                        </ThemedText>
                        <ThemedText style={{ fontSize: 14, lineHeight: 20, marginBottom: 22 }} lightColor={palette.muted} darkColor={palette.muted}>
                            Inserisci l&apos;email del tuo account: Firebase ti invierà un link sicuro per scegliere una nuova password.
                        </ThemedText>

                        <View style={{ marginBottom: 22 }}>
                            <ThemedText style={{ fontSize: 13, fontWeight: '600', marginBottom: 8, letterSpacing: 0.2 }} lightColor={palette.muted} darkColor={palette.muted}>
                                E-mail
                            </ThemedText>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderRadius: 14,
                                    paddingHorizontal: 14,
                                    paddingVertical: inputPadV,
                                    gap: 10,
                                    backgroundColor: palette.inputBg,
                                    borderColor: palette.border,
                                }}
                            >
                                <ThemedIcon name="mail-outline" size={20} lightColor={palette.muted} darkColor={palette.muted} />
                                <ThemedTextInput
                                    value={email}
                                    onChangeText={setEmail}
                                    style={{ flex: 1, fontSize: 16, paddingVertical: 0, color: scheme === 'light' ? '#111' : '#FFF' }}
                                    placeholder="nome@email.com"
                                    placeholderTextColor={palette.muted}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    textContentType="emailAddress"
                                    autoComplete="email"
                                    editable={!busy}
                                />
                            </View>
                        </View>

                        <BouncyPressable
                            disabled={busy}
                            isLoading={busy}
                            onPress={() => void submit()}
                            style={{
                                borderRadius: 14,
                                paddingVertical: 16,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: scheme === 'light' ? '#111111' : '#FFFFFF',
                            }}
                        >
                            <ThemedText style={{ fontSize: 16, fontWeight: '700' }} lightColor={scheme === 'light' ? '#FFFFFF' : '#111111'} darkColor={scheme === 'light' ? '#FFFFFF' : '#111111'}>
                                Invia link di recupero
                            </ThemedText>
                        </BouncyPressable>
                    </View>
                </TouchableWithoutFeedback>
            </ScrollView>
        </View>
    );
};

export default ForgotPassword;
