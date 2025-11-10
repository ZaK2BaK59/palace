import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDs1sYDT1BaPvjXblW5L252bjaMhM85bdY",
  authDomain: "the-palace-c5503.firebaseapp.com",
  projectId: "the-palace-c5503",
  storageBucket: "the-palace-c5503.firebasestorage.app",
  messagingSenderId: "326629969707",
  appId: "1:326629969707:web:6af9b4e833557f28a53f6e",
  measurementId: "G-4R62LJJBV5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);