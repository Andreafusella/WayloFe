import { Alert, Platform } from 'react-native';
import {
  check,
  checkLocationAccuracy,
  openSettings,
  request,
  PERMISSIONS,
  RESULTS,
} from 'react-native-permissions';

const primaryLocationPermission =
  Platform.OS === 'ios' ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

function errorMessage(e: unknown): string {
  if (e instanceof Error) return `${e.message} ${e}`;
  return String(e);
}

/**
 * Su iOS 14+: richiede accuratezza precisa (non solo "vicino alla posizione").
 * Su iOS < 14 native rifiuta: in quel caso la precisione alta non è un toggle sistema.
 *
 * IMPORTANTE: non usare più `Platform.Version < 14` per saltare il check — se Version non è leggibile si ottiene 0
 * e prima si concedeva sempre l'ingresso anche con posizione solo approssimativa.
 */
async function iosHasFullAccuracyOrLegacyOk(): Promise<boolean> {
  try {
    const accuracy = await checkLocationAccuracy();
    return accuracy === 'full';
  } catch (e) {
    const msg = errorMessage(e);
    // Reject RNPermissions su iPadOS/iOS < 14 dove non esiste accuracyAuthorization ridotta/aumentata
    if (/only available on ios 14/i.test(msg)) {
      return true;
    }
    return false;
  }
}

async function iosEnsureFullAccuracy(): Promise<boolean> {
  try {
    const accuracy = await checkLocationAccuracy();
    if (accuracy === 'full') return true;

    if (accuracy === 'reduced') {
      // Non usiamo requestLocationAccuracy: su iOS è un dialog nativo con solo
      // «Non consentire / Consenti una volta» e ripresenta l'app ogni avvio.
      // Portiamo l'utente alle Impostazioni per attivare «Posizione precisa» in modo permanente.
      Alert.alert(
        'Attiva la posizione precisa',
        'Impostazioni → Waylo → Posizione → attiva «Posizione precisa» (precise location). Serve per usare la mappa correttamente.',
        [
          { text: 'Più tardi', style: 'cancel' },
          { text: 'Apri Impostazioni', onPress: () => void openSettings() },
        ],
      );
      return false;
    }

    return false;
  } catch (e) {
    const msg = errorMessage(e);
    if (/only available on ios 14/i.test(msg)) {
      return true;
    }
    return false;
  }
}

/** True se posizione quando-in-uso concessa + precisione alta (Android: fine GPS; iOS: full accuracy). */
export async function hasPreciseLocationAccess(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return true;
  }

  const status = await check(primaryLocationPermission);
  if (status !== RESULTS.GRANTED) return false;

  if (Platform.OS === 'android') {
    return true;
  }

  if (Platform.OS === 'ios') {
    return iosHasFullAccuracyOrLegacyOk();
  }

  return true;
}

/**
 * Chiede permesso quando-in-uso; su iOS se l'accuratezza è solo approssimativa
 * mostra un alert per aprire le Impostazioni (niente dialog nativo «una volta»).
 * @returns true solo se alla fine hai accesso alla posizione precisa (esposta).
 */
export async function ensurePreciseLocation(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return true;
  }

  let status = await check(primaryLocationPermission);
  if (status !== RESULTS.GRANTED) {
    status = await request(primaryLocationPermission);
  }

  if (status === RESULTS.BLOCKED) {
    Alert.alert(
      'Posizione necessaria',
      "L'accesso alla posizione è bloccato. Abilitalo nelle Impostazioni per continuare.",
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Apri Impostazioni', onPress: () => void openSettings() },
      ],
    );
    return false;
  }

  if (status !== RESULTS.GRANTED) return false;

  if (Platform.OS === 'android') {
    return true;
  }

  if (Platform.OS === 'ios') {
    return iosEnsureFullAccuracy();
  }

  return true;
}

export const handleLocationPermission = ensurePreciseLocation;

/** Route protette dopo login che richiedono posizione precisa (no schermata richiesta né auth). */
export function routeNeedsPreciseLocation(pathname: string | undefined): boolean {
  if (!pathname) return false;
  if (pathname.includes('/views/auth/')) return false;
  if (pathname.includes('/views/position/')) return false;
  return pathname.includes('(tabs)') || pathname === '/' || pathname.endsWith('/index');
}
