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
  console.log("Saving token...");
  console.log("Current UID:", user?.uid);
  console.log("Token:", token);

  if (!user) {
    console.log("User is null");
    return;
  }

  if (!token) {
    console.log("Token is null");
    return;
  }

  try {
    const userRef = doc(db, "users", user.uid);

    await setDoc(
      userRef,
      {
        fcmToken: token,
        fcmUpdatedAt: serverTimestamp(),
        platform: Platform.OS,
      },
      { merge: true }
    );

    console.log("Firestore updated successfully");

    const verify = await getDoc(userRef);
    console.log("Saved token:", verify.data()?.fcmToken);

  } catch (e) {
    console.error("Firestore write failed:", e);
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
