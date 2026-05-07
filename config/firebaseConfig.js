import { initializeApp } from "firebase/app";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCBGwJ9szgs_oGBot9xmMSzFtQgJ4ad9Oc",
  authDomain: "waylo-a46d5.firebaseapp.com",
  projectId: "waylo-a46d5",
  storageBucket: "waylo-a46d5.firebasestorage.app",
  messagingSenderId: "259972367503",
  appId: "1:259972367503:web:f7cc8cfac4b398e1239cfa"
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

export { auth };