import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const firebaseConfig = {
  apiKey:            "AIzaSyBftKXVIJY_x72U8y9ImBydpw7kgvJ1Z50",
  authDomain:        "mist-mess-app.firebaseapp.com",
  projectId:         "mist-mess-app",
  storageBucket:     "mist-mess-app.firebasestorage.app",
  messagingSenderId: "631534157963",
  appId:             "1:631534157963:web:8da7f536cd7852ab69948e",
  measurementId:     "G-ZQ331Y20MN",
};

export const FCM_VAPID_KEY = "BElSsmnui-Fq7vvDeBs6fgF3uKmEwKfSe9thgrSgkiKDPfTFSBMGFgoUEOKt_6syiUTIxZGe09FhUPIElZ1rWxk";

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    auth = getAuth(app);
  }
}

const db = getFirestore(app);

let _emulatorsConnected = false;
function connectEmulators() {
  if (_emulatorsConnected) return;
  try { connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true }); } catch {}
  try { connectFirestoreEmulator(db, 'localhost', 8088); } catch {}
  _emulatorsConnected = true;
}

if (__DEV__) {
  connectEmulators();
}

export { app, auth, db };
