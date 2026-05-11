import BouncyPressable from '@/components/BouncyPressable'
import { ThemedText } from '@/components/ThemedText'
import { auth } from '@/config/firebaseConfig'
import { useAuth } from '@/context/AuthContext'
import { useThemeColor } from '@/hooks/useThemeColor'
import { logout, sendVerification } from '@/service/AuthService'
import { Redirect, router } from 'expo-router'
import { reload } from 'firebase/auth'
import LottieView from 'lottie-react-native'
import { useEffect, useState } from 'react'
import { Alert, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const RESEND_COOLDOWN_SEC = 60

const VerifyEmail = () => {
    const insets = useSafeAreaInsets()

    const { authStatus, syncFirebaseState, refreshProfile } = useAuth()

    const pageBackgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#000000' }, 'background')
    const titleColor = useThemeColor({ light: '#111111', dark: '#FFFFFF' }, 'text')
    const mutedTextColor = useThemeColor({ light: '#6B7280', dark: '#8E8E93' }, 'primaryText')
    const primaryButtonBg = useThemeColor({ light: '#111111', dark: '#FFFFFF' }, 'text')
    const primaryButtonLabel = useThemeColor({ light: '#FFFFFF', dark: '#111111' }, 'background')
    const linkAccentColor = useThemeColor({ light: '#279CF5', dark: '#5EB8FF' }, 'primaryText')
    const resendDisabledColor = mutedTextColor

    const [timer, setTimer] = useState(RESEND_COOLDOWN_SEC)
    const [isChecking, setIsChecking] = useState(false)

    useEffect(() => {
        if (timer <= 0) return undefined
        const t = setTimeout(() => setTimer((s) => Math.max(0, s - 1)), 1000)
        return () => clearTimeout(t)
    }, [timer])

    if (authStatus !== 'needs_verification') {
        return <Redirect href="/" />
    }

    const handleConfirmedEmailPress = async () => {
        const u = auth.currentUser
        if (!u) {
            Alert.alert('Sessione assente', 'Accedi di nuovo per continuare.')
            return
        }
        setIsChecking(true)
        try {
            await reload(u)
            await auth.currentUser?.getIdToken(true) // Forziamo ricaricamento del JWT
            syncFirebaseState() // Sincronizziamo il Context con le ultime modifiche del currentUser in-place
            
            if (!auth.currentUser?.emailVerified) {
                Alert.alert('Non ancora confermato', 'Non risulta ancora una email verificata. Apri il link ricevuto e riprova.')
            } else {
                await refreshProfile() // Aspettiamo che scarichi anche il profilo per sapere se mandare in Register o (tabs)
                router.replace('/') // Router principale prenderà in carico la rotta finale
            }
        } catch {
            Alert.alert('Controllo fallito', 'Non è stato possibile aggiornare lo stato. Riprova tra un attimo.')
        } finally {
            setIsChecking(false)
        }
    }

    const handleResend = async () => {
        if (timer > 0) return
        try {
            await sendVerification()
            setTimer(RESEND_COOLDOWN_SEC)
            Alert.alert('Messaggio inviato', 'Controlla la posta in arrivo (e lo spam).')
        } catch {
            Alert.alert('Invio fallito', 'Impossibile inviare ora un nuovo messaggio.')
        }
    }

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: pageBackgroundColor,
                paddingTop: Math.max(insets.top, 20),
                paddingBottom: Math.max(insets.bottom, 24),
                paddingHorizontal: 24,
            }}
        >
            <View style={{ alignItems: 'center', paddingTop: 8, marginBottom: 28 }}>
                <LottieView source={require('@/assets/animation/mailSend.json')} autoPlay loop style={{ width: 220, height: 220 }} resizeMode="contain" />
            </View>

            <View style={{ flex: 1, width: '100%', maxWidth: 400, alignSelf: 'center' }}>
                <ThemedText type="title" style={{ marginBottom: 14, fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.4, textAlign: 'center', color: titleColor }}>
                    Controlla la tua email
                </ThemedText>

                <ThemedText style={{ marginBottom: 16, fontSize: 16, lineHeight: 24, textAlign: 'center' }} lightColor={mutedTextColor} darkColor={mutedTextColor}>
                    Ti abbiamo inviato un messaggio con un link di conferma. Apri la casella di posta che hai usato in registrazione e{' '}
                    <ThemedText style={{ fontSize: 16, lineHeight: 24, fontWeight: '700' }} lightColor={titleColor} darkColor={titleColor}>
                        tocca il link nell&apos;email
                    </ThemedText>{' '}
                    per continuare e attivare l&apos;account.
                </ThemedText>

                <BouncyPressable
                    onPress={() => void handleConfirmedEmailPress()}
                    disabled={isChecking}
                    isLoading={isChecking}
                    loadingColor={primaryButtonLabel}
                    style={{ borderRadius: 14, paddingVertical: 16, alignItems: 'center', backgroundColor: primaryButtonBg, marginBottom: 12 }}
                >
                    <ThemedText style={{ fontWeight: '600' }} lightColor={primaryButtonLabel} darkColor={primaryButtonLabel}>
                        {isChecking ? "Controllo in corso..." : "Ho confermato l'email"}
                    </ThemedText>
                </BouncyPressable>
                <ThemedText style={{ marginBottom: 28, fontSize: 14, lineHeight: 21, textAlign: 'center' }} lightColor={mutedTextColor} darkColor={mutedTextColor}>
                    Non vedi l&apos;email? Controlla anche la cartella spam o posta indesiderata.
                </ThemedText>

                <Pressable onPress={() => void handleResend()} disabled={timer > 0} style={{ alignSelf: 'center', paddingVertical: 10 }}>
                    <ThemedText style={{ fontSize: 14, fontWeight: '600' }} lightColor={mutedTextColor} darkColor={mutedTextColor}>
                        Non hai ricevuto nulla?{' '}
                        <ThemedText style={{ color: timer > 0 ? resendDisabledColor : linkAccentColor }}>
                            {timer > 0 ? `Attendi ${timer}s` : 'Reinvia'}
                        </ThemedText>
                    </ThemedText>
                </Pressable>

                <Pressable onPress={() => void logout()} hitSlop={12} style={{ alignSelf: 'center', paddingVertical: 10 }}>
                    <ThemedText style={{ fontSize: 15, fontWeight: '600' }} lightColor={linkAccentColor} darkColor={linkAccentColor}>
                        Torna al login
                    </ThemedText>
                </Pressable>
            </View>
        </View>
    )
}

export default VerifyEmail
