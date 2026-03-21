'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, increment } from 'firebase/firestore';
import { auth, db } from './firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(undefined);
  const [profile, setProfile] = useState(null);
  const studyStart = useRef(null);

  // Mark user online/offline + track study time
  async function setOnline(uid, online) {
    try {
      await setDoc(doc(db, 'users', uid), {
        online, lastActive: Date.now(),
      }, { merge: true });
    } catch {}
  }

  async function flushStudyTime(uid) {
    if (!studyStart.current) return;
    const secs = Math.floor((Date.now() - studyStart.current) / 1000);
    studyStart.current = null;
    if (secs < 5) return;
    try {
      await setDoc(doc(db, 'users', uid), { studyTime: increment(secs) }, { merge: true });
    } catch {}
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          setProfile(snap.exists() ? snap.data() : null);
        } catch { setProfile(null); }

        setOnline(firebaseUser.uid, true);
        studyStart.current = Date.now();

        // Flush on tab close / hide
        const handleUnload = () => {
          flushStudyTime(firebaseUser.uid);
          setOnline(firebaseUser.uid, false);
        };
        const handleVisibility = () => {
          if (document.visibilityState === 'hidden') {
            flushStudyTime(firebaseUser.uid);
          } else {
            studyStart.current = Date.now();
          }
        };

        window.addEventListener('beforeunload', handleUnload);
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
          window.removeEventListener('beforeunload', handleUnload);
          document.removeEventListener('visibilitychange', handleVisibility);
        };
      } else {
        setUser(null);
        setProfile(null);
      }
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, setProfile, loading: user === undefined }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
