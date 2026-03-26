import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAyDidsQLzn_cVOzI5fvK7ftdRBTg5PIp0",
  authDomain: "elegoo-robot-control.firebaseapp.com",
  projectId: "elegoo-robot-control",
  storageBucket: "elegoo-robot-control.firebasestorage.app",
  messagingSenderId: "751860605987",
  appId: "1:751860605987:web:edb1d45d356862e5eabd96"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;