import { auth, database } from './firebase.js';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
  ref,
  get,
  child
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

/* =====================================================
   AUTH GUARD
   Redirects user if not logged in or unauthorized
===================================================== */
document.addEventListener("DOMContentLoaded", () => {

  const currentPage = window.location.pathname.split("/").pop();

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // Not logged in → redirect to login
      if (currentPage !== "index.html") window.location.replace("index.html");
      return;
    }

    // If logged in, check role
    const snapshot = await get(child(ref(database), `users/${user.uid}`));
    if (!snapshot.exists()) {
      await signOut(auth);
      window.location.replace("index.html");
      return;
    }

    const userData = snapshot.val();

    // Prevent normal users from visiting admin pages
    if (userData.role !== "admin" && currentPage.includes("admin")) {
      await signOut(auth);
      alert("Access denied. Users cannot access admin pages.");
      window.location.replace("index.html");
      return;
    }

    // Prevent admins from visiting user pages
    if (userData.role === "admin" && currentPage === "dashboard.html") {
      await signOut(auth);
      alert("Admins must log in via admin portal.");
      window.location.replace("index.html");
      return;
    }
  });

  /* ================= ADMIN LOGIN ================= */
  const adminBtn = document.getElementById("adminLoginBtn");
  if (adminBtn) {
    adminBtn.addEventListener("click", async () => {
      const email = document.getElementById("adminEmail")?.value.trim();
      const password = document.getElementById("adminPassword")?.value.trim();

      if (!email || !password) return alert("Please enter email and password.");

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        const snapshot = await get(child(ref(database), `users/${uid}`));
        if (!snapshot.exists() || snapshot.val().role !== "admin") {
          await signOut(auth);
          return alert("Access denied. Admins only.");
        }

        window.location.href = "admin-dashboard.html";
      } catch (err) {
        alert(err.message);
      }
    });
  }

  /* ================= USER LOGIN ================= */
  const userLoginBtn = document.getElementById("userLoginBtn");
  if (userLoginBtn) {
    userLoginBtn.addEventListener("click", async () => {
      const email = document.getElementById("userEmail")?.value.trim();
      const password = document.getElementById("userPassword")?.value;

      if (!email || !password) return alert("Please enter email and password!");

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        const snapshot = await get(child(ref(database), `users/${uid}`));
        if (!snapshot.exists()) {
          await signOut(auth);
          return alert("No user record found!");
        }

        const userData = snapshot.val();

        // Force sign out if admin tried to login in user page
        if (userData.role === "admin") {
          await signOut(auth);
          return alert("Admins must log in via admin portal.");
        }

        showPopup("Success", `Welcome ${userData.name}!`, () => {
          window.location.href = "dashboard.html";
        });
      } catch (err) {
        showPopup("Login Failed", err.message);
      }
    });
  }

  /* ================= LOGOUT MODAL ================= */
  const logoutBtn = document.getElementById("logoutBtn");
  const modal = document.getElementById("logoutModal");
  const cancelBtn = document.getElementById("cancelLogout");
  const confirmBtn = document.getElementById("confirmLogout");

  if (logoutBtn && modal && cancelBtn && confirmBtn) {
    logoutBtn.addEventListener("click", () => modal.classList.remove("hidden"));
    cancelBtn.addEventListener("click", () => modal.classList.add("hidden"));
    confirmBtn.addEventListener("click", async () => {
      modal.classList.add("hidden");
      await logout();
    });
  }
});

/* =====================================================
   POPUP FUNCTION (SAFE)
===================================================== */
function showPopup(title, message, callback = null) {
  const popup = document.getElementById("popup");
  const popupTitle = document.getElementById("popupTitle");
  const popupMessage = document.getElementById("popupMessage");
  const popupBtn = document.getElementById("popupBtn");

  if (!popup || !popupTitle || !popupMessage || !popupBtn) {
    alert(message);
    if (callback) callback();
    return;
  }

  popupTitle.textContent = title;
  popupMessage.textContent = message;
  popup.classList.remove("hidden");

  popupBtn.onclick = () => {
    popup.classList.add("hidden");
    if (callback) callback();
  };
}

/* =====================================================
   LOGOUT FUNCTION
===================================================== */
async function logout() {
  try {
    await signOut(auth);
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace("index.html"); // redirect to login page
  } catch (err) {
    alert("Logout failed. Please try again.");
    console.error(err);
  }
}
