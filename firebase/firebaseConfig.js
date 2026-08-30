import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAU8kCUINhiYl35xZisvQZZuA3zi4H2LbE",
  authDomain: "arabic-review.firebaseapp.com",
  projectId: "arabic-review",
  storageBucket: "arabic-review.firebasestorage.app",
  messagingSenderId: "312005217412",
  appId: "1:312005217412:web:9cfa505960655921ea06d1",
  measurementId: "G-R1RFYHBDP7"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
