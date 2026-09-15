import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: 'AIzaSyBGadJ29HRrmjqJsPbjCPa_56thXwk1cuU',
  authDomain: 'gigme-47333.firebaseapp.com',
  projectId: 'gigme-47333',
  storageBucket: 'gigme-47333.firebasestorage.app',
  messagingSenderId: '69521665492',
  appId: '1:69521665492:web:1f58d4f5a7e2f946f43a41',
  measurementId: 'G-RFYQ9GBJSL',
};

// Khởi tạo Firebase
export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);
