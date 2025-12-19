import { auth, database } from "./firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

document.addEventListener("DOMContentLoaded", () => {
  const addUserBtn = document.getElementById("addUserBtn");
  const modal = document.getElementById("addUserModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const saveUserBtn = document.getElementById("saveUserBtn");

  const nameInput = document.getElementById("newUserName");
  const emailInput = document.getElementById("newEmail");
  const passwordInput = document.getElementById("newUserPassword");
  const cPasswordInput = document.getElementById("newUserCPassword");
  const roleSelect = document.getElementById("newUserRole");

  // Open modal
  addUserBtn.addEventListener("click", () => modal.classList.remove("hidden"));

  // Close modal
  closeModalBtn.addEventListener("click", () => clearAndCloseModal());

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === modal) clearAndCloseModal();
  });

  // Save user to Firebase
  saveUserBtn.addEventListener("click", async () => {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const cPassword = cPasswordInput.value;
    const role = roleSelect.value;

    // Validate
    if (!name || !email || !password || !cPassword) {
      alert("Please fill all fields!");
      return;
    }
    if (password !== cPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      // 1️⃣ Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 2️⃣ Save user info in Realtime Database
      await set(ref(database, `users/${uid}`), {
        name,
        email,
        role
      });

      alert("User created successfully!");
      clearAndCloseModal();
      
    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
    }
  });

  function clearAndCloseModal() {
    modal.classList.add("hidden");
    nameInput.value = "";
    emailInput.value = "";
    passwordInput.value = "";
    cPasswordInput.value = "";
    roleSelect.value = "user";
  }
});
