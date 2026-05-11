import { createAuthInstance } from "@/config/axiosInstance";
import { auth } from "@/config/firebaseConfig";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    UserCredential,
    sendEmailVerification,
    reload,
    GoogleAuthProvider,
    OAuthProvider,
    signInWithCredential,
} from "firebase/auth";
import * as Crypto from 'expo-crypto';
import * as AppleAuthentication from "expo-apple-authentication";
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
    webClientId: '77126962059-b7er67ie3svi06qevdde8kih3f4heqb3.apps.googleusercontent.com',
});

export interface IUserInfo {
    id: string;
    name: string;
    lastName: string;
    username: string;
    birthDate: string;
    accountType: string;
}

export interface IRegisterRequest {
    name: string;
    lastName: string;
    username: string;
    birthDate: string;
}

export const getToken = async (): Promise<string | null> => {
    const user = auth.currentUser;
    if (user) {
        return await user.getIdToken();
    }
    return null;
};

// login con email e password
export const loginWithEmail = async (email: string, pass: string): Promise<UserCredential> => {
    return await signInWithEmailAndPassword(auth, email, pass);
};

// registrazione con email e password
export const signupWithEmail = async (email: string, pass: string): Promise<UserCredential> => {
    return await createUserWithEmailAndPassword(auth, email, pass);
};

// logout
export const logout = async () => {
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
        default:
            return 'Si è verificato un errore. Riprova.';
    }
}
export const checkUsername = async (username: string) => {
    const token = await getToken();
    const authInstance = createAuthInstance(token ?? undefined);
    const response = await authInstance.post('/users/check-username', { username });
    return response.data;
}

export const useCheckUsername = (username: string) => {
    return useQuery({
        queryKey: ['check-username', username],
        queryFn: () => checkUsername(username),
    });
}
