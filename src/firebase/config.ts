import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDDwsTLTA2XFItgX5N3ekfHxoFqfu2-0Cw",
  authDomain: "kakao-7d504.firebaseapp.com",
  projectId: "kakao-7d504",
  storageBucket: "kakao-7d504.firebasestorage.app",
  messagingSenderId: "536157326241",
  appId: "1:536157326241:web:991918278759c3d43119e0",
  measurementId: "G-QXRL6KZTQT"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
