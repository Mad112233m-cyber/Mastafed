import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 1) روحي لـ https://console.firebase.google.com
// 2) أنشئي مشروع جديد (مجاني)
// 3) من إعدادات المشروع > عام > "أضف تطبيق ويب"
// 4) انسخي القيم اللي تطلع لك وحطيها هنا مكان كل PASTE_...
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
