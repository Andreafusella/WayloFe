import BouncyPressable from '@/components/BouncyPressable';
import ThemedDatePicker from '@/components/ThemedDatePicker';
import { ThemedIcon } from '@/components/ThemedIcon';
import { ThemedText } from '@/components/ThemedText';
import ThemedTextInput from '@/components/ThemedTextInput';
import { auth } from '@/config/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import {
    firebaseAuthErrorMessage,
    registerFullUser,
    registerProfileAfterSocial,
} from '@/service/AuthService';
import { isValidEmail } from '@/utils/validation';
import { isAxiosError } from 'axios';
import { Redirect, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, TouchableWithoutFeedback, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function isValidIsoDate(s: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s.trim())) return false;
    const d = new Date(`${s.trim()}T12:00:00`);
    return !Number.isNaN(d.getTime());
}

function axiosBackendHint(error: unknown): string | null {
    if (isAxiosError(error) && error.response?.status !== undefined) {
        return `Errore server (${error.response.status}).`;
    }
    return null;
}

const Register = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { authStatus, user, refreshProfile } = useAuth();
    const { width, height } = useWindowDimensions();

    const pageBg = useThemeColor({}, 'background');
    const primaryText = useThemeColor({}, 'text');
    const muted = useThemeColor({ light: '#6B7280', dark: '#8E8E93' }, 'icon');
    const border = useThemeColor({ light: '#E5E5EA', dark: '#38383A' }, 'icon');
    const inputBg = useThemeColor({ light: '#FAFAFA', dark: '#1C1C1E' }, 'background');
    const ctaBg = useThemeColor({ light: '#111111', dark: '#FFFFFF' }, 'text');
    const ctaFg = useThemeColor({ light: '#FFFFFF', dark: '#111111' }, 'text');

    const isSocialSignup = useMemo(
        () =>
            !!user?.providerData?.some((p) => p.providerId === 'google.com' || p.providerId === 'apple.com'),
        [user],
    );

    /** Riferimenti stabili: `react-native-ui-datepicker` usa `minDate`/`maxDate` nelle deps di un `useEffect`. */
    const birthMinDate = useMemo(() => new Date(1900, 0, 1), []);
    const birthMaxDate = useMemo(() => new Date(), []);

    const totalSteps = isSocialSignup ? 3 : 4;

    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [name, setName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!user) return;

        const fromProfile = user.displayName?.trim();
        if (!fromProfile) return;

        const segments = fromProfile.split(/\s+/).filter(Boolean);
        if (segments.length === 0) return;

        if (segments.length === 1 && !name.trim()) setName(segments[0]);

        if (segments.length >= 2 && (!name.trim() || !lastName.trim())) {
            setName(segments[0]);
            setLastName(segments.slice(1).join(' '));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- evita di sovrascrivere mentre l&apos;utente digita
    }, [user?.uid]);

    if (authStatus !== 'needs_profile' && authStatus !== 'unauthenticated') {
        return <Redirect href="/" />;
    }

    const inputPadV = Platform.OS === 'ios' ? 14 : 10;

    const labelStyle = { fontSize: 13, fontWeight: '600' as const, marginBottom: 8, letterSpacing: 0.2, color: muted };
    const fieldRowStyle = { flexDirection: 'row' as const, alignItems: 'center' as const, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: inputPadV, gap: 10, backgroundColor: inputBg, borderColor: border };
    const inputStyle = { flex: 1, fontSize: 16, paddingVertical: 0, color: primaryText };
    const ctaStyle = { borderRadius: 14, paddingVertical: 16, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: ctaBg };
    const btnLabelStyle = { fontSize: 16, fontWeight: '700' as const, color: ctaFg };

    const goBack = async () => {
        if (step === 0) {
            if (isSocialSignup && user) {
                await signOut(auth);
            }
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/views/auth/Login');
            }
        } else {
            setStep((s) => s - 1);
        }
    };

    const validateCurrentStep = (): boolean => {
        if (step === 0 && (!name.trim() || !lastName.trim())) {
            Alert.alert('Campi mancanti', 'Inserisci nome e cognome.');
            return false;
        }
        if (step === 1 && !username.trim()) {
            Alert.alert('Campo mancante', 'Inserisci uno username.');
            return false;
        }
        if (step === 2 && !isValidIsoDate(birthDate.trim())) {
            Alert.alert('Data non valida', 'Seleziona una data di nascita valida.');
            return false;
        }
        return true;
    };

    const handleFinalizeSocial = async () => {
        setIsSubmitting(true);
        try {
            await registerProfileAfterSocial({
                name: name.trim(),
                lastName: lastName.trim(),
                username: username.trim(),
                birthDate: birthDate.trim(),
            });
            await refreshProfile();
        } catch (error: unknown) {
            const fbCode =
                typeof error === 'object' && error !== null && 'code' in error
                    ? (error as { code?: string }).code
                    : undefined;
            const hint = axiosBackendHint(error);
            Alert.alert('Registrazione', hint ?? firebaseAuthErrorMessage(fbCode));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateEmailAccount = async () => {
        if (
            email.trim().length === 0 ||
            password.trim().length === 0 ||
            confirmPassword !== password ||
            password.length < 6 ||
            !isValidEmail(email)
        ) {
            Alert.alert('Controlla i dati', 'Email non valida o password troppo corta.');
            return;
        }

        setIsSubmitting(true);
        try {
            await registerFullUser({
                email: email.trim(),
                password,
                name: name.trim(),
                lastName: lastName.trim(),
                username: username.trim(),
                birthDate: birthDate.trim(),
            });
        } catch (error: unknown) {
            const fbCode =
                typeof error === 'object' && error !== null && 'code' in error
                    ? (error as { code?: string }).code
                    : undefined;
            const hint = axiosBackendHint(error);
            Alert.alert(
                'Registrazione non riuscita',
                hint ?? firebaseAuthErrorMessage(fbCode),
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNext = () => {
        if (!validateCurrentStep()) return;
        if (step === 2 && isSocialSignup) void handleFinalizeSocial();
        else if (step < totalSteps - 1) setStep((s) => s + 1);
    };

    const lastEmailStepIndex = totalSteps - 1;

    return (
        <View style={{ flex: 1, backgroundColor: pageBg }}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{
                            flexGrow: 1,
                            minHeight: height,
                            paddingHorizontal: 24,
                            paddingTop: insets.top + 20,
                            paddingBottom: insets.bottom + 24,
                        }}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={{ width: '100%', maxWidth: 400, alignSelf: 'center' }} collapsable={false}>
                            <View style={{}}>
                                <Pressable onPress={() => void goBack()} style={{ alignSelf: 'flex-start', marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 6 }} hitSlop={12}>
                                    <ThemedIcon name="chevron-back" size={22} lightColor={primaryText} darkColor={primaryText} />
                                    <ThemedText style={{ fontSize: 15, fontWeight: '600', color: primaryText }} lightColor={primaryText} darkColor={primaryText}>
                                        {step === 0 ? 'Torna al login' : 'Indietro'}
                                    </ThemedText>
                                </Pressable>

                                <ThemedText type="title" style={{ marginBottom: 30, fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -0.5, textAlign: 'center', color: primaryText }} lightColor={primaryText} darkColor={primaryText}>
                                    Registrazione
                                </ThemedText>
                            </View>

                            {step === 0 && (
                                <View>
                                    <View style={{ marginBottom: 18 }}>
                                        <ThemedText style={labelStyle} lightColor={muted} darkColor={muted}>Nome</ThemedText>
                                        <View style={fieldRowStyle}>
                                            <ThemedIcon name="person-outline" size={20} lightColor={muted} darkColor={muted} />
                                            <ThemedTextInput hitSlop={8} value={name} onChangeText={setName} style={inputStyle} placeholder="Nome" placeholderTextColor={muted} autoCapitalize="words" textContentType="givenName" />
                                        </View>
                                    </View>
                                    <View style={{ marginBottom: 18 }}>
                                        <ThemedText style={labelStyle} lightColor={muted} darkColor={muted}>Cognome</ThemedText>
                                        <View style={fieldRowStyle}>
                                            <ThemedIcon name="person-outline" size={20} lightColor={muted} darkColor={muted} />
                                            <ThemedTextInput hitSlop={8} value={lastName} onChangeText={setLastName} style={inputStyle} placeholder="Cognome" placeholderTextColor={muted} autoCapitalize="words" textContentType="familyName" />
                                        </View>
                                    </View>
                                    <BouncyPressable disabled={name.trim() === '' || lastName.trim() === ''} onPress={handleNext} style={ctaStyle}>
                                        <ThemedText style={btnLabelStyle} lightColor={ctaFg} darkColor={ctaFg}>Avanti</ThemedText>
                                    </BouncyPressable>
                                </View>
                            )}
                            {step === 1 && (
                                <>
                                    <View style={{ marginBottom: 18 }}>
                                        <ThemedText style={labelStyle} lightColor={muted} darkColor={muted}>Username</ThemedText>
                                        <View style={fieldRowStyle}>
                                            <ThemedIcon name="at-outline" size={20} lightColor={muted} darkColor={muted} />
                                            <ThemedTextInput hitSlop={8} value={username} onChangeText={setUsername} style={inputStyle} placeholder="username" placeholderTextColor={muted} autoCapitalize="none" autoCorrect={false} textContentType="username" />
                                        </View>
                                    </View>
                                    <BouncyPressable disabled={username.trim() === ''} onPress={handleNext} style={ctaStyle}>
                                        <ThemedText style={btnLabelStyle} lightColor={ctaFg} darkColor={ctaFg}>Avanti</ThemedText>
                                    </BouncyPressable>
                                </>
                            )}

                            {step === 2 && (
                                <>
                                    <View style={{ marginBottom: 18 }}>
                                        <ThemedText style={labelStyle} lightColor={muted} darkColor={muted}>Data di nascita</ThemedText>
                                        <ThemedDatePicker selectionMode="single" value={birthDate || undefined} onChange={(iso) => setBirthDate(iso)} minDate={birthMinDate} maxDate={birthMaxDate} />
                                    </View>
                                    <BouncyPressable disabled={!isValidIsoDate(birthDate.trim()) || isSubmitting} isLoading={isSocialSignup && isSubmitting} loadingColor={ctaFg} onPress={handleNext} style={ctaStyle}>
                                        <ThemedText style={btnLabelStyle} lightColor={ctaFg} darkColor={ctaFg}>
                                            {isSocialSignup ? (isSubmitting ? 'Completamento...' : 'Completa registrazione') : 'Avanti'}
                                        </ThemedText>
                                    </BouncyPressable>
                                </>
                            )}

                            {step === lastEmailStepIndex && !isSocialSignup && (
                                <>
                                    <View style={{ marginBottom: 18 }}>
                                        <ThemedText style={labelStyle} lightColor={muted} darkColor={muted}>E-mail</ThemedText>
                                        <View style={fieldRowStyle}>
                                            <ThemedIcon name="mail-outline" size={20} lightColor={muted} darkColor={muted} />
                                            <ThemedTextInput hitSlop={8} value={email} onChangeText={setEmail} style={inputStyle} placeholder="nome@email.com" placeholderTextColor={muted} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textContentType="emailAddress" />
                                        </View>
                                    </View>
                                    <View style={{ marginBottom: 18 }}>
                                        <ThemedText style={labelStyle} lightColor={muted} darkColor={muted}>Password</ThemedText>
                                        <View style={fieldRowStyle}>
                                            <ThemedIcon name="lock-closed-outline" size={20} lightColor={muted} darkColor={muted} />
                                            <ThemedTextInput hitSlop={8} value={password} onChangeText={setPassword} style={inputStyle} placeholder="••••••••" placeholderTextColor={muted} secureTextEntry={!showPassword} textContentType="newPassword" />
                                            <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={12} accessibilityRole="button" accessibilityLabel={showPassword ? 'Nascondi password' : 'Mostra password'}>
                                                <ThemedIcon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} lightColor={muted} darkColor={muted} />
                                            </Pressable>
                                        </View>
                                    </View>
                                    <View style={{ marginBottom: 24 }}>
                                        <ThemedText style={labelStyle} lightColor={muted} darkColor={muted}>Conferma password</ThemedText>
                                        <View style={fieldRowStyle}>
                                            <ThemedIcon name="lock-closed-outline" size={20} lightColor={muted} darkColor={muted} />
                                            <ThemedTextInput hitSlop={8} value={confirmPassword} onChangeText={setConfirmPassword} style={inputStyle} placeholder="••••••••" placeholderTextColor={muted} secureTextEntry={!showPassword} textContentType="newPassword" />
                                        </View>
                                    </View>
                                    <BouncyPressable
                                        disabled={email.trim() === '' || password.trim() === '' || confirmPassword.trim() !== password.trim() || password.length < 6 || isSubmitting}
                                        isLoading={isSubmitting}
                                        loadingColor={ctaFg}
                                        onPress={() => void handleCreateEmailAccount()}
                                        style={ctaStyle}
                                    >
                                        <ThemedText style={btnLabelStyle} lightColor={ctaFg} darkColor={ctaFg}>Crea account</ThemedText>
                                    </BouncyPressable>
                                </>
                            )}
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </View>
    );
};

export default Register;
