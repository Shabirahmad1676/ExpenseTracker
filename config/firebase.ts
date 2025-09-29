// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBWExIPNQhmC2vXJoQ9e9wd_Q7LGCWc6Gs",
  authDomain: "ensetracker-5d277.firebaseapp.com",
  projectId: "ensetracker-5d277",
  storageBucket: "ensetracker-5d277.firebasestorage.app",
  messagingSenderId: "174929488803",
  appId: "1:174929488803:web:6b5295a1e09b70d6a74816",
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// ✅ Auth with persistence for React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore
export const firestore = getFirestore(app);

//storage
export const storage = getStorage(app);