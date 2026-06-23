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
