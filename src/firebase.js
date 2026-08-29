import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD6kgiZiPt6As1YzsL5GXIm7fFsoMKEQhM",
  authDomain: "mstafed-2db89.firebaseapp.com",
  projectId: "mstafed-2db89",
  storageBucket: "mstafed-2db89.firebasestorage.app",
  messagingSenderId: "422630802367",
  appId: "1:422630802367:web:e2b3b767042289b076170a",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
