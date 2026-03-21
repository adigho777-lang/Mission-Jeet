import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyArB2FOD3UgvotLVoVCr1Bz7Os4TbPZD8Y",
  authDomain: "mission-jeet-8f2f5.firebaseapp.com",
  projectId: "mission-jeet-8f2f5",
  storageBucket: "mission-jeet-8f2f5.firebasestorage.app",
  messagingSenderId: "1002047948820",
  appId: "1:1002047948820:web:5b6d1597f230299791ff01",
  measurementId: "G-0G8VHFEK21",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db       = getFirestore(app);
export const auth     = getAuth(app);
export const provider = new GoogleAuthProvider();