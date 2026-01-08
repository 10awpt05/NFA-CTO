// Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// 🔥 Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBMG_7Hb1XIznmr4hshESMrOy90iX2OhEk",
  authDomain: "nfa-cto-ecaa1.firebaseapp.com",
  projectId: "nfa-cto-ecaa1",
  storageBucket: "nfa-cto-ecaa1.firebasestorage.app",
  messagingSenderId: "416408532196",
  appId: "1:416408532196:web:05ddc2196430ddd6a8e8f1",
  measurementId: "G-1QL51VG63C",

  // ⚡ IMPORTANT for Realtime Database
  databaseURL: "https://nfa-cto-ecaa1-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ EXPORT BOTH
export const auth = getAuth(app);
export const database = getDatabase(app);
