import axios from "axios";

// const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const BACKEND_URL = "http://192.168.1.2:8080/api/v1";

const axiosInstance = axios.create({
    baseURL: BACKEND_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

export const createAuthInstance = (token: string) => {
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
