import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const ANDROID_MIN_API = 29;

// Stili di impatto per impactAsync
export type HapticImpactStyle =
    | 'light'
    | 'normal'
    | 'medium'
    | 'heavy'
    | 'rigid'
    | 'soft';

// Tipi di notifica per notificationAsync
export type HapticNotificationType = 'success' | 'warning' | 'error';

// Indica se l'haptic feedback è supportato sul dispositivo corrente
function shouldUseHaptics(): boolean {
    if (Platform.OS === 'ios') {
        return true;
    }
    if (Platform.OS === 'android') {
        const apiLevel = Platform.Version as number;
        return apiLevel >= ANDROID_MIN_API;
    }
    return false;
}

function mapImpactStyle(style: HapticImpactStyle): Haptics.ImpactFeedbackStyle {
    switch (style) {
        case 'light':
            return Haptics.ImpactFeedbackStyle.Light;
        case 'normal':
        case 'medium':
            return Haptics.ImpactFeedbackStyle.Medium;
        case 'heavy':
            return Haptics.ImpactFeedbackStyle.Heavy;
        case 'rigid':
            return Haptics.ImpactFeedbackStyle.Rigid;
        case 'soft':
            return Haptics.ImpactFeedbackStyle.Soft;
        default:
            return Haptics.ImpactFeedbackStyle.Medium;
    }
}

function mapNotificationType(
    type: HapticNotificationType
): Haptics.NotificationFeedbackType {
    switch (type) {
        case 'success':
            return Haptics.NotificationFeedbackType.Success;
        case 'warning':
            return Haptics.NotificationFeedbackType.Warning;
        case 'error':
            return Haptics.NotificationFeedbackType.Error;
        default:
            return Haptics.NotificationFeedbackType.Success;
    }
}


// Vibrazione semplice 'light' | 'normal' | 'medium' | 'heavy' | 'rigid' | 'soft'
export async function hapticImpact(
    style: HapticImpactStyle = 'medium'
): Promise<void> {
    if (!shouldUseHaptics()) return;
    try {
        await Haptics.impactAsync(mapImpactStyle(style));
    } catch {
    }
}

// Vibrazione di notifica (es. successo, errore, warning). 'success' | 'warning' | 'error'
export async function hapticNotification(
    type: HapticNotificationType = 'success'
): Promise<void> {
    if (!shouldUseHaptics()) return;
    try {
        await Haptics.notificationAsync(mapNotificationType(type));
    } catch {
    }
}