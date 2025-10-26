import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCPaqYH_fW2cfQt7PkH4HlG-EwY-w6UyAg",
  authDomain: "interdex-ai.firebaseapp.com",
  projectId: "interdex-ai",
  storageBucket: "interdex-ai.firebasestorage.app",
  messagingSenderId: "900453718381",
  appId: "1:900453718381:web:252370e5638e42b431e264"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);