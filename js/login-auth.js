import { auth, database } from './firebase.js';

import {
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
  ref,
  get,
  query,
  orderByChild,
  equalTo,
  child
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

/* =====================================================
   ADMIN LOGIN → Firebase Auth + role check in /users
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const adminBtn = document.getElementById("adminLoginBtn");
  const adminEmail = document.getElementById("adminEmail");
  const adminPassword = document.getElementById("adminPassword");

  if (adminBtn) {
    adminBtn.addEventListener("click", async () => {
      const email = adminEmail.value.trim();
      const password = adminPassword.value.trim();

      if (!email || !password) {
        alert("Please enter email and password.");
        return;
      }

      try {
        // 🔐 Firebase Auth login
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // 🔍 Check role in Realtime Database
        const snapshot = await get(child(ref(database), `users/${uid}`));

        if (!snapshot.exists() || snapshot.val().role !== "admin") {
          await signOut(auth);
          alert("Access denied. Admins only.");
          return;
        }

        // ✅ SUCCESS
        alert("Admin logged in!");
        window.location.href = "admin-dashboard.html";

      } catch (error) {
        alert(error.message);
      }
    });
  }
});

/* =====================================================
   USER LOGIN → Firebase Auth + role check in /users
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const userLoginBtn = document.getElementById("userLoginBtn");
  const emailInput = document.getElementById("userEmail");
  const passwordInput = document.getElementById("userPassword");

  if (userLoginBtn) {
    userLoginBtn.addEventListener("click", async () => {
      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!email || !password) {
        alert("Please enter email and password!");
        return;
      }

      try {
        // 1️⃣ Sign in using Firebase Authentication
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // 2️⃣ Get user info from Realtime Database
        const snapshot = await get(child(ref(database), `users/${uid}`));

        if (!snapshot.exists()) {
          alert("No user record found in database!");
          return;
        }

        const userData = snapshot.val();

        if (userData.role === "admin") {
          alert("Admins must log in via admin portal.");
          return;
        }

        // ✅ SUCCESS
        showPopup("Success", `Welcome ${userData.name}!`, () => {
          window.location.href = "dashboard.html";
        });

      } catch (error) {
        showPopup("Login Failed", error.message);
      }
    });
  }
});

/* =====================================================
   Popup function
===================================================== */
function showPopup(title, message, callback = null) {
  const popup = document.getElementById("popup");
  const popupTitle = document.getElementById("popupTitle");
  const popupMessage = document.getElementById("popupMessage");
  const popupBtn = document.getElementById("popupBtn");

  popupTitle.textContent = title;
  popupMessage.textContent = message;
  popup.classList.remove("hidden");

  popupBtn.onclick = () => {
    popup.classList.add("hidden");
    if (callback) callback();
  };
}
