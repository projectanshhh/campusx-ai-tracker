import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCFYjmxBexwbuFdP6_c91vzGdW1oZPQ4eI",
  authDomain: "hiii-e949e.firebaseapp.com",
  projectId: "hiii-e949e",
  storageBucket: "hiii-e949e.firebasestorage.app",
  messagingSenderId: "864501183837",
  appId: "1:864501183837:web:8b2b61f6c2ae189097a4b4",
  measurementId: "G-3XHSMW0P4V"
};

// Initialize Firebase (prevent re-initialization in SSR)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signOut, doc, setDoc, getDoc };
