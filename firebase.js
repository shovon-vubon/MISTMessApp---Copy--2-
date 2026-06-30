import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const firebaseConfig = {
  apiKey:            "AIzaSyAviH_klhIokMmgKuvamHK8e96J29GHpZY",
  authDomain:        "outpassregister-mist.firebaseapp.com",
  projectId:         "outpassregister-mist",
  storageBucket:     "outpassregister-mist.firebasestorage.app",
  messagingSenderId: "249253436325",
  appId:             "1:249253436325:web:ff386d5a5c9c43d9db664c",
  measurementId:     "G-GM73EL6NFL",
};

export const FCM_VAPID_KEY = "BJ65Gkhn33gPmyYMVy5FgzlgnmTVFDbTKnA3kMk1T-K8zTd0lp2_0z1aufTwO1kaptIHkW9eFGQezNbzZlxt3dM";

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = Platform.OS === 'web'
  ? getAuth(app)
  : (() => {
      try {
        return initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
      } catch {
        return getAuth(app);
      }
    })();

const db = getFirestore(app);

// Set to true ONLY for local emulator testing in a browser on your dev machine.
// Must stay false for any build that runs on a device (Capacitor/native), because
// inside a WebView "localhost" is the phone itself — pointing Firebase there makes
// every Auth/Firestore call hang and the app gets stuck on the loading spinner.
const USE_EMULATORS = false;

function isCapacitorNative() {
  return typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.() === true;
}

let _emulatorsConnected = false;
function connectEmulators() {
  if (_emulatorsConnected) return;
  try { connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true }); } catch {}
  try { connectFirestoreEmulator(db, 'localhost', 8088); } catch {}
  _emulatorsConnected = true;
}

if (USE_EMULATORS && Platform.OS === 'web' && !isCapacitorNative()) {
  connectEmulators();
}

export { app, auth, db };
