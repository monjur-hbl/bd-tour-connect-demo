// Firebase Configuration for BD Tour Connect
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBDemoKeyForBDTourConnect2024",
  authDomain: "bd-tour-connect-demo.firebaseapp.com",
  projectId: "bd-tour-connect-demo",
  storageBucket: "bd-tour-connect-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
