import { authenticatedApi, createAuthInstance, getBearerToken } from "@/config/axiosInstance";
import { auth } from "@/config/firebaseConfig";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useMutation, useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from 'expo-crypto';
import { router } from "expo-router";
import {
    createUserWithEmailAndPassword,
    deleteUser,
    GoogleAuthProvider,
    linkWithCredential,
    OAuthProvider,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithCredential,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    UserCredential,
    type AuthCredential,
} from "firebase/auth";
import { Platform } from "react-native";

GoogleSignin.configure({
    webClientId: '77126962059-b7er67ie3svi06qevdde8kih3f4heqb3.apps.googleusercontent.com',
});

/** Profilo salvato sul BE (JWT identifica firebaseId). Allineamento campi BE: id, name, lastname, username, birthDate, firebaseid */
export interface IUserInfo {
    id: number;
    name: string;
    lastName: string;
    username: string;
    birthDate: string;
    firebaseId: string;
}

export interface IRegisterRequest {
    name: string;
    lastName: string;
    username: string;
    birthDate: string;
}

export interface IFullRegisterParams extends IRegisterRequest {
    email: string;
    password: string;
}

export async function fetchAccountProfile(): Promise<IUserInfo | null> {
    try {
        const response = await authenticatedApi.get<IUserInfo>('/account/me');
        return response.data;
    } catch (e) {
        if (isAxiosError(e)) {
            const status = e.response?.status;
            // 403 Forbidden dal BE (spring-security): utente Firebase non ancora "registrato" per il BE
            if (status === 404 || status === 403) {
                return null;
            }
        }
        throw e;
    }
}

export class ProviderAccountExistsError extends Error {
    readonly code = 'auth/account-exists-with-different-credential';
    constructor(
        readonly linkedEmail: string,
        readonly pendingCredential: AuthCredential,
    ) {
        super('Esiste già un account con questa email registrato con un altro metodo di accesso.');
        this.name = 'ProviderAccountExistsError';
    }

    static is(e: unknown): e is ProviderAccountExistsError {
        return e instanceof ProviderAccountExistsError;
    }
}

function throwAccountExistsIfAny(
    err: unknown,
    pendingCredential: AuthCredential,
    fallbackEmail?: string | null,
): never {
    if (typeof err === 'object' && err !== null && 'code' in err &&
        (err as { code?: string }).code === 'auth/account-exists-with-different-credential') {
        const meta = typeof err === 'object' && 'customData' in err
            ? (err as { customData?: { email?: string } }).customData
            : undefined;
        const email = meta?.email?.trim() || fallbackEmail?.trim();
        if (email) {
            throw new ProviderAccountExistsError(email, pendingCredential);
        }
    }
    throw err;
}

export const getToken = async (): Promise<string | null> => getBearerToken(false);

const register = async (request: IRegisterRequest) => {
    const response = await authenticatedApi.post('/account/register', request);
    await refreshIdTokenAfterBackendRegistration();
    return response.data;
};

export const useGetUserInfo = (options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ['user-info'],
        queryFn: fetchAccountProfile,
        enabled: options?.enabled === false ? false : !!auth.currentUser?.emailVerified,
        retry: false,
        staleTime: 0,
    });
};

export const sendVerification = async (user = auth.currentUser): Promise<void> => {
    if (user) {
        await sendEmailVerification(user);
    } else {
        throw new Error("Nessun utente loggato per inviare la verifica.");
    }
};

export const refreshIdTokenAfterBackendRegistration = async (): Promise<void> => {
    const u = auth.currentUser;
    if (u) await u.getIdToken(true);
};

/** Collega un provider OAuth a un utente già registrato con email/password (stesso account Firebase). */
export async function linkProviderWithEmailPassword(
    email: string,
    password: string,
    pendingCredential: AuthCredential,
): Promise<UserCredential> {
    const trimmedEmail = email.trim();
    const userCred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
    await linkWithCredential(userCred.user, pendingCredential);
    return userCred;
}

export const registerFullUser = async (params: IFullRegisterParams): Promise<void> => {
    const { email, password, name, lastName, username, birthDate } = params;
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await sendVerification(cred.user);
    try {
        await authenticatedApi.post<IRegisterRequest>('/account/register', {
            name,
            lastName,
            username,
            birthDate,
        });
    } catch (e) {
        try {
            await deleteUser(cred.user);
        } catch {
            try {
                await signOut(auth);
            } catch {
                /* noop */
            }
        }
        throw e;
    }
    await refreshIdTokenAfterBackendRegistration();
};

/** Completamento profilo dopo login sociale (stesso POST del flusso email; firebaseId viene dal token). */
export async function registerProfileAfterSocial(loginData: IRegisterRequest): Promise<void> {
    await authenticatedApi.post<IRegisterRequest>('/account/register', loginData);
    await refreshIdTokenAfterBackendRegistration();
}

export const useRegister = () => {
    return useMutation({
        mutationKey: ['register'],
        mutationFn: register,
    });
};

// login con email e password
export const loginWithEmail = async (email: string, pass: string): Promise<UserCredential> => {
    return await signInWithEmailAndPassword(auth, email.trim(), pass);
};

/** Invio email di reset password (Firebase Authentication). Il completamento avviene dal link nell’email. */
export async function sendPasswordResetForEmail(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email.trim());
}

// registrazione con email e password
export const signupWithEmail = async (email: string, pass: string): Promise<UserCredential> => {
    return await createUserWithEmailAndPassword(auth, email.trim(), pass);
};

const generateNonce = async (length: number) => {
    const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const result = await Crypto.getRandomBytesAsync(length);
    return Array.from(result)
        .map((byte) => charset[byte % charset.length])
        .join('');
};

export const loginWithApple = async (): Promise<UserCredential> => {
    if (Platform.OS !== "ios") throw new Error("Solo iOS");

    const nonce = await generateNonce(32);

    const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce,
    );

    const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
    });

    const idToken = appleCredential.identityToken;
    if (!idToken) throw new Error("Token mancante");

    const oauthProvider = new OAuthProvider("apple.com");
    const credential = oauthProvider.credential({
        idToken,
        rawNonce: nonce,
    });

    try {
        const uc = await signInWithCredential(auth, credential);

        const given = appleCredential.fullName?.givenName ?? '';
        const family = appleCredential.fullName?.familyName ?? '';
        const display = [given, family].filter((s) => s.trim().length > 0).join(' ').trim();

        if (display.length > 0) {
            const currentName = uc.user.displayName ?? '';
            if (currentName.length === 0) {
                await updateProfile(uc.user, { displayName: display });
            }
        }

        return uc;
    } catch (e) {
        const fallbackEmail =
            appleCredential.email?.trim()
            ?? (typeof e === 'object' && e !== null && 'customData' in e
                ? (e as { customData?: { email?: string } }).customData?.email?.trim()
                : undefined);

        throwAccountExistsIfAny(e, credential, fallbackEmail);
    }
};

export const loginWithGoogle = async (): Promise<UserCredential> => {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();

    const { data } = response;
    const idToken = data?.idToken;
    if (!idToken) throw new Error("Google Sign-In failed: No ID Token");

    const credential = GoogleAuthProvider.credential(idToken);
    const fbEmailFallback = data?.user?.email?.trim();

    try {
        return await signInWithCredential(auth, credential);
    } catch (e) {
        throwAccountExistsIfAny(e, credential, fbEmailFallback);
    }
};

export async function logout(): Promise<void> {
    try {
        await GoogleSignin.signOut();
    } catch {
        /* noop */
    }
    await signOut(auth);
    await router.replace("/views/auth/Login");
};

export function firebaseAuthErrorMessage(code: string | undefined): string {
    switch (code) {
        case 'auth/email-already-in-use':
            return 'Questa email è già registrata.';
        case 'auth/invalid-email':
            return 'Indirizzo email non valido.';
        case 'auth/weak-password':
            return 'La password è troppo debole (min. 6 caratteri).';
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
            return 'Email o password non corretti.';
        case 'auth/account-exists-with-different-credential':
            return 'Esiste già un account con questa email usando un altro metodo.';
        case 'auth/credential-already-in-use':
            return 'Questo account è già collegato a un altro utente.';
        case 'auth/too-many-requests':
            return 'Troppi tentativi. Riprova tra qualche minuto.';
        case 'auth/network-request-failed':
            return 'Errore di rete. Controlla la connessione.';
        default:
            return 'Si è verificato un errore. Riprova.';
    }
}

export const checkUsername = async (username: string) => {
    const authInstance = createAuthInstance(undefined);
    const token = await getToken();
    const response = authInstance.post('/users/check-username', { username }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return (await response).data;
};

export const useCheckUsername = (username: string) => {
    return useQuery({
        queryKey: ['check-username', username],
        queryFn: () => checkUsername(username),
        enabled: false,
    });
};
