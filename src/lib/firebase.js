import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCKIYh8xKYVK-PIl71U_frttVCbmyfonT8",
  authDomain: "ai-engineer-100.firebaseapp.com",
  projectId: "ai-engineer-100",
  storageBucket: "ai-engineer-100.firebasestorage.app",
  messagingSenderId: "110528842576",
  appId: "1:110528842576:web:aefe0306a05094f7647a55",
  measurementId: "G-WG6KF12ETE"
};

// Initialize Firebase (prevent re-initialization in SSR)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signOut, doc, setDoc, getDoc };
