import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (snap.exists()) {
          const data = snap.data();
          setUser(firebaseUser);
          setProfile({ ...data, uid: firebaseUser.uid });
        } else {
          setUser(null);
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function logout() {
    await signOut(auth);
    if (Platform.OS === 'web') {
      window.location.replace('/');
      return;
    }
    setUser(null);
    setProfile(null);
  }

  async function refreshProfile() {
    if (!user) return;
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) setProfile({ ...snap.data(), uid: user.uid });
  }

  const saveFcmToken = useCallback(async (token) => {
  try {
    if (!user || !token) return;

    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);

    // Skip update if the token is already the same
    if (snap.exists()) {
      const currentToken = snap.data().fcmToken;
      if (currentToken === token) {
        console.log("FCM token is already up to date.");
        return;
      }
    }

    await setDoc(
      userRef,
      {
        fcmToken: token,
        fcmUpdatedAt: serverTimestamp(),
        platform: Platform.OS,
      },
      { merge: true }
    );

    console.log("FCM token saved successfully.");
  } catch (error) {
    console.error("Failed to save FCM token:", error);
  }
}, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, refreshProfile, saveFcmToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
