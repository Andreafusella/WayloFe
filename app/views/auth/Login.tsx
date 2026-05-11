import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/AuthContext';
import { Redirect, useRouter } from 'expo-router';
import type { AuthCredential } from 'firebase/auth';
import { Alert, Keyboard, Modal, Platform, Pressable, TextInput, TouchableWithoutFeedback, useColorScheme, useWindowDimensions, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { useEffect, useMemo, useState } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withRepeat, Easing } from 'react-native-reanimated';
import { ThemedIcon } from '@/components/ThemedIcon';
import BouncyPressable from '@/components/BouncyPressable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/theme';
import { isValidEmail } from '@/utils/validation';
import {
    firebaseAuthErrorMessage,
    linkProviderWithEmailPassword,
    loginWithApple,
    loginWithEmail,
    loginWithGoogle,
    ProviderAccountExistsError,
} from '@/service/AuthService';
import ThemedTextInput from '@/components/ThemedTextInput';
import { hapticNotification } from '@/utils/haptics';

const Login = () => {
    const insets = useSafeAreaInsets();
    const { width: windowWidth } = useWindowDimensions();
    const scheme = useColorScheme() ?? 'light';

    const { authStatus } = useAuth();
    const router = useRouter();

    const [showPassword, setShowPassword] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

    const loadingColor = useThemeColor({ light: '#000000', dark: '#FFFFFF' }, 'text');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [pendingLink, setPendingLink] = useState<{ email: string; pendingCredential: AuthCredential } | null>(null);
    const [linkPassword, setLinkPassword] = useState('');
    const [linkingBusy, setLinkingBusy] = useState(false);

    const translateX = useSharedValue(-windowWidth + 70);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    useEffect(() => {

        translateX.value = -220;

        translateX.value = withRepeat(
            withTiming(windowWidth, {
                duration: 7500,
                easing: Easing.linear,
            }),
            -1,
            false
        );
    }, [windowWidth]);

    const palette = useMemo(
        () =>
            scheme === 'light'
                ? {
                    pageBg: Colors.light.background,
                    border: '#E5E5EA',
                    borderStrong: '#D1D1D6',
                    muted: '#6B7280',
                    inputBg: '#FAFAFA',
                    dividerLine: '#E5E5EA',
                }
                : {
                    pageBg: Colors.dark.background,
                    border: '#38383A',
                    borderStrong: '#48484A',
                    muted: '#8E8E93',
                    inputBg: '#1C1C1E',
                    dividerLine: '#38383A',
                },
        [scheme],
    );

    const handleLogin = async () => {
        if (!email || !password || email.trim() === '' || password.trim() === '' || !isValidEmail(email)) {
            Alert.alert('Errore', 'Inserisci un\'email e una password valida.');
            return;
        }

        setIsLoading(true);
        try {
            await loginWithEmail(email, password);
        } catch (error: unknown) {
            Alert.alert(
                'Accesso non riuscito',
                firebaseAuthErrorMessage(typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: string }).code : undefined),
            );
        } finally {
            setIsLoading(false);
        }
        hapticNotification('success');
    }

    // login con Apple
    const handleAppleLogin = async () => {
        if (Platform.OS !== 'ios') {
            Alert.alert('Apple', 'Accedi con Apple è disponibile solo su iOS.');
            return;
        }

        setIsLoading(true);
        setSocialLoading('apple');
        try {
            await loginWithApple();
        } catch (error: unknown) {
            if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'ERR_REQUEST_CANCELED') {
                return;
            }
            if (ProviderAccountExistsError.is(error)) {
                setPendingLink({ email: error.linkedEmail, pendingCredential: error.pendingCredential });
                return;
            }
            const message =
                typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message?: unknown }).message === 'string'
                    ? (error as { message: string }).message
                    : "Impossibile completare l'accesso con Apple.";
            Alert.alert('Errore Apple', message);
        } finally {
            setIsLoading(false);
            setSocialLoading(null);
        }
    }

    // login con Google
    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setSocialLoading('google');
        try {
            await loginWithGoogle();
        } catch (error: unknown) {
            if (
                typeof error === 'object' &&
                error !== null &&
                'code' in error &&
                typeof (error as { code?: string }).code === 'string' &&
                (error as { code?: string }).code === 'SIGN_IN_CANCELLED'
            ) {
                return;
            }
            if (ProviderAccountExistsError.is(error)) {
                setPendingLink({ email: error.linkedEmail, pendingCredential: error.pendingCredential });
                return;
            }
            Alert.alert(
                'Errore Google',
                firebaseAuthErrorMessage(
                    typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: string }).code : undefined,
                ),
            );
        } finally {
            setIsLoading(false);
            setSocialLoading(null);
        }
    };

    const handleCompleteAccountLink = async () => {
        if (!pendingLink || linkPassword.trim() === '') {
            Alert.alert('Password mancante', 'Inserisci la password del tuo account email per collegarlo.');
            return;
        }
        setLinkingBusy(true);
        try {
            await linkProviderWithEmailPassword(pendingLink.email, linkPassword.trim(), pendingLink.pendingCredential);
            setPendingLink(null);
            setLinkPassword('');
        } catch (error: unknown) {
            Alert.alert(
                'Collegamento fallito',
                firebaseAuthErrorMessage(
                    typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: string }).code : undefined,
                ),
            );
        } finally {
            setLinkingBusy(false);
        }
    };

    if (authStatus !== 'unauthenticated') {
        return <Redirect href="/" />;
    }

    const inputPadV = Platform.OS === 'ios' ? 14 : 10;

    return (
        <View style={{ flex: 1, backgroundColor: palette.pageBg }}>
            <View style={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 32) }} >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <View style={{ width: '100%', maxWidth: 400, alignSelf: 'center' }} collapsable={false}>
                        <ThemedText type="title" style={{ marginBottom: 8, fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -0.5, textAlign: 'center' }}>
                            Accedi
                        </ThemedText>
                        <View style={{ marginBottom: 18 }}>
                            <ThemedText style={{ fontSize: 13, fontWeight: '600', marginBottom: 8, letterSpacing: 0.2 }} lightColor={palette.muted} darkColor={palette.muted}>
                                E-mail
                            </ThemedText>
                            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: inputPadV, gap: 10, backgroundColor: palette.inputBg, borderColor: palette.border }}>
                                <ThemedIcon name="mail-outline" size={20} lightColor={palette.muted} darkColor={palette.muted} />
                                <ThemedTextInput hitSlop={8} value={email} onChangeText={setEmail} style={{ flex: 1, fontSize: 16, paddingVertical: 0, color: scheme === 'light' ? '#111' : '#FFF' }} placeholder="nome@email.com" placeholderTextColor={palette.muted} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textContentType="emailAddress" />
                            </View>
                        </View>

                        <View style={{ marginBottom: 18 }}>
                            <ThemedText style={{ fontSize: 13, fontWeight: '600', marginBottom: 8, letterSpacing: 0.2 }} lightColor={palette.muted} darkColor={palette.muted}>
                                Password
                            </ThemedText>
                            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: inputPadV, gap: 10, backgroundColor: palette.inputBg, borderColor: palette.border }}>
                                <ThemedIcon name="lock-closed-outline" size={20} lightColor={palette.muted} darkColor={palette.muted} />
                                <ThemedTextInput hitSlop={8} value={password} onChangeText={setPassword} style={{ flex: 1, fontSize: 16, paddingVertical: 0, color: scheme === 'light' ? '#111' : '#FFF' }} placeholder="••••••••" placeholderTextColor={palette.muted} secureTextEntry={!showPassword} textContentType="password" />
                                <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={12} accessibilityRole="button" accessibilityLabel={showPassword ? 'Nascondi password' : 'Mostra password'}>
                                    <ThemedIcon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} lightColor={palette.muted} darkColor={palette.muted} />
                                </Pressable>
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4, marginBottom: 24 }}>
                            <Pressable>
                                <ThemedText style={{ fontSize: 14, fontWeight: '700' }} lightColor={scheme === 'light' ? '#111' : '#FFF'} darkColor={scheme === 'light' ? '#111' : '#FFF'}>
                                    Password dimenticata?
                                </ThemedText>
                            </Pressable>
                        </View>

                        <BouncyPressable isLoading={isLoading} disabled={isLoading} onPress={handleLogin} style={{ borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: scheme === 'light' ? '#111111' : '#FFFFFF' }}>
                            <ThemedText style={{ fontSize: 16, fontWeight: '700' }} lightColor={scheme === 'light' ? '#FFFFFF' : '#111111'} darkColor={scheme === 'light' ? '#FFFFFF' : '#111111'}>
                                Accedi
                            </ThemedText>
                        </BouncyPressable>

                        <View style={{ marginTop: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 4 }}>
                            <ThemedText style={{ fontSize: 14 }} >
                                Non hai un account?
                            </ThemedText>
                            <BouncyPressable haptic="medium" onPress={() => router.replace('/views/auth/Register')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <ThemedText style={{ fontSize: 14, fontWeight: '700' }} lightColor={scheme === 'light' ? '#279CF5' : '#5EB8FF'} darkColor={scheme === 'light' ? '#279CF5' : '#5EB8FF'}>
                                    Registrati
                                </ThemedText>
                            </BouncyPressable>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 28, gap: 14 }}>
                            <View style={{ flex: 1, height: 1, backgroundColor: palette.dividerLine }} />
                            <ThemedText style={{ fontSize: 13, fontWeight: '600' }} lightColor={palette.muted} darkColor={palette.muted}>
                                Oppure
                            </ThemedText>
                            <View style={{ flex: 1, height: 1, backgroundColor: palette.dividerLine }} />
                        </View>

                        <View style={{ gap: 12 }}>
                            <BouncyPressable
                                disabled={isLoading}
                                onPress={handleGoogleLogin}
                                isLoading={isLoading && socialLoading === 'google'}
                                loadingColor={loadingColor}
                                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, borderWidth: 1, borderRadius: 14, paddingVertical: 14, backgroundColor: palette.pageBg, borderColor: palette.border }}
                            >
                                <ThemedIcon family="ionicons" name="logo-google" size={22} lightColor="#EA4335" darkColor="#EA4335" />
                                <ThemedText style={{ fontSize: 15, fontWeight: '600' }} lightColor={scheme === 'light' ? '#111' : '#FFF'} darkColor={scheme === 'light' ? '#111' : '#FFF'}>
                                    Continua con Google
                                </ThemedText>
                            </BouncyPressable>
                            {Platform.OS === 'ios' && (
                                <BouncyPressable
                                    disabled={isLoading}
                                    onPress={handleAppleLogin}
                                    isLoading={isLoading && socialLoading === 'apple'}
                                    loadingColor={loadingColor}
                                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, borderWidth: 1, borderRadius: 14, paddingVertical: 14, backgroundColor: palette.pageBg, borderColor: palette.border }}
                                >
                                    <ThemedIcon name="logo-apple" size={22} lightColor={scheme === 'light' ? '#111' : '#FFF'} darkColor={scheme === 'light' ? '#111' : '#FFF'} />
                                    <ThemedText style={{ fontSize: 15, fontWeight: '600' }} lightColor={scheme === 'light' ? '#111' : '#FFF'} darkColor={scheme === 'light' ? '#111' : '#FFF'}>
                                        Continua con Apple
                                    </ThemedText>
                                </BouncyPressable>
                            )}
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </View>
            {/* <Animated.View pointerEvents="none" style={[animatedStyle, { position: 'absolute', bottom: Platform.OS === 'ios' ? 0 : insets.bottom, left: 0, right: 0, height: 220, zIndex: 99 }]} >
                <LottieView source={require('@/assets/animation/walkPerson.json')} autoPlay loop style={{ flex: 1 }} resizeMode="contain" />
            </Animated.View> */}

            <Modal
                transparent
                visible={pendingLink !== null}
                animationType="fade"
                onRequestClose={() => {
                    if (!linkingBusy) {
                        setPendingLink(null);
                        setLinkPassword('');
                    }
                }}
            >
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Chiudi"
                    style={{ flex: 1, backgroundColor: '#00000099', justifyContent: 'center', paddingHorizontal: 24 }}
                    onPress={() => {
                        if (!linkingBusy) {
                            setPendingLink(null);
                            setLinkPassword('');
                        }
                    }}
                >
                    <TouchableWithoutFeedback>
                        <View
                            style={{
                                alignSelf: 'center',
                                width: '100%',
                                maxWidth: 380,
                                backgroundColor: palette.pageBg,
                                borderRadius: 16,
                                padding: 20,
                                gap: 12,
                                borderWidth: 1,
                                borderColor: palette.border,
                            }}
                        >
                        <ThemedText style={{ fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
                            Account già registrato
                        </ThemedText>
                        <ThemedText style={{ fontSize: 14, lineHeight: 20, color: palette.muted }} lightColor={palette.muted} darkColor={palette.muted}>
                            Esiste un account Waylo associato alla stessa email. Inserisci la password dell&apos;account email/password per collegarlo a questo accesso OAuth.
                        </ThemedText>
                        {pendingLink?.email ? (
                            <ThemedText style={{ fontSize: 14, fontWeight: '600', textAlign: 'center' }}>{pendingLink.email}</ThemedText>
                        ) : null}
                        <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: inputPadV, gap: 10, backgroundColor: palette.inputBg, borderColor: palette.border }}>
                            <ThemedIcon name="lock-closed-outline" size={20} lightColor={palette.muted} darkColor={palette.muted} />
                            <TextInput
                                value={linkPassword}
                                onChangeText={setLinkPassword}
                                editable={!linkingBusy}
                                style={{ flex: 1, fontSize: 16, paddingVertical: 0, color: scheme === 'light' ? '#111' : '#FFF' }}
                                placeholder="Password account esistente"
                                placeholderTextColor={palette.muted}
                                secureTextEntry
                                textContentType="password"
                            />
                        </View>
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Annulla collegamento account"
                                disabled={linkingBusy}
                                onPress={() => {
                                    setPendingLink(null);
                                    setLinkPassword('');
                                }}
                                style={{ flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: palette.border }}
                            >
                                <ThemedText style={{ fontWeight: '600' }} lightColor={scheme === 'light' ? '#111' : '#FFF'} darkColor={scheme === 'light' ? '#111' : '#FFF'}>
                                    Annulla
                                </ThemedText>
                            </Pressable>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Conferma e collega account"
                                disabled={linkingBusy}
                                onPress={() => void handleCompleteAccountLink()}
                                style={{
                                    flex: 1,
                                    borderRadius: 12,
                                    paddingVertical: 14,
                                    alignItems: 'center',
                                    backgroundColor: scheme === 'light' ? '#111111' : '#FFFFFF',
                                }}
                            >
                                <ThemedText style={{ fontWeight: '700' }} lightColor={scheme === 'light' ? '#FFFFFF' : '#111111'} darkColor={scheme === 'light' ? '#FFFFFF' : '#111111'}>
                                    Collega
                                </ThemedText>
                            </Pressable>
                        </View>
                        </View>
                    </TouchableWithoutFeedback>
                </Pressable>
            </Modal>
        </View>
    );
};

export default Login;