import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

import { auth } from "@/config/firebaseConfig";

// const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
export const BACKEND_URL = "http://192.168.1.2:8080/api/v1";

const axiosInstance = axios.create({
    baseURL: BACKEND_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

/** Token Firebase per Bearer (JWT). */
export async function getBearerToken(forceRefresh = false): Promise<string | null> {
    const u = auth.currentUser;
    if (!u) return null;
    return u.getIdToken(forceRefresh);
}

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

/** Chiamate autenticate: header Bearer + retry una volta dopo refresh token su 401. */
export const authenticatedApi = axios.create({
    baseURL: BACKEND_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

authenticatedApi.interceptors.request.use(async (config) => {
    const token = await getBearerToken(false);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        delete config.headers.Authorization;
    }
    return config;
});

authenticatedApi.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as RetryableRequest | undefined;
        if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;
        const u = auth.currentUser;
        if (u) await u.getIdToken(true);

        const token = await getBearerToken(false);
        if (token) originalRequest.headers.Authorization = `Bearer ${token}`;

        return authenticatedApi(originalRequest);
    },
);

/** Istanzanza manuale (es. registrazione con token fresco subito dopo createUser). Preferisci authenticatedApi dopo il login. */
export const createAuthInstance = (token?: string) => {
    const authInstance = axios.create({
        baseURL: BACKEND_URL,
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (token) {
        authInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
        delete authInstance.defaults.headers.common["Authorization"];
    }

    return authInstance;
};

export default axiosInstance;
