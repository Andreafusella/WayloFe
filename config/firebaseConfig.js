import { initializeApp } from "firebase/app";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDfBManCOxSWC3Xfagbkgb-EXUQe1hGj9I",
  authDomain: "waylo-f3dc2.firebaseapp.com",
  projectId: "waylo-f3dc2",
  storageBucket: "waylo-f3dc2.firebasestorage.app",
  messagingSenderId: "77126962059",
  appId: "1:77126962059:web:1d194512068d314e803d8e",
  measurementId: "G-RMHBKMBL04"
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export { auth };