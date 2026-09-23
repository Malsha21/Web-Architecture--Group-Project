



import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDI5ReTbUqAOIPRPi3YH-xsJekyDQygohY",
  authDomain: "web-architecture-group-project.firebaseapp.com",
  projectId: "web-architecture-group-project",
  storageBucket: "web-architecture-group-project.firebasestorage.app",
  messagingSenderId: "657802896955",
  appId: "1:657802896955:web:ebc9e70daa235ee7325e1e",
  measurementId: "G-MD7LBL7VE7"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);