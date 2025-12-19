// Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// 🔥 Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAChx-UrRuabv5eDBnMTLp_s0dlcwEslTs",
  authDomain: "nfa-cto.firebaseapp.com",
  projectId: "nfa-cto",
  storageBucket: "nfa-cto.appspot.com",
  messagingSenderId: "867965447400",
  appId: "1:867965447400:web:21666960d1d1ddaf27ed5d",
  measurementId: "G-L09MBBB5BZ",

  // ⚡ IMPORTANT for Realtime Database
  databaseURL: "https://nfa-cto-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ EXPORT BOTH
export const auth = getAuth(app);
export const database = getDatabase(app);
