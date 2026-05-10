import { auth } from "@/config/firebaseConfig";
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
import * as AppleAuthentication from "expo-apple-authentication";
import { router } from "expo-router";
import { Platform } from "react-native";
import * as Crypto from 'expo-crypto';

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