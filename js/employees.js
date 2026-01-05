
import { database } from "./firebase.js";
import { ref, set, get, update, push } 
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
  
import {
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";


// =======================
// Employee Modal Logic
// =======================
const modal = document.getElementById("employeeModal");



// Open modal
document.getElementById("addCtoBtn").onclick = () => { modal.style.display = "flex"; };

// Close modal
function closeModal() {
  modal.style.display = "none";
}

// Add a new Earned date input
function addEarnedDate() {
  const earnedDatesDiv = document.getElementById("earnedDates");
  const div = document.createElement("div");
  div.className = "entry";
  div.style.display = "flex";
  div.style.alignItems = "center";
  div.style.gap = "6px";
  div.innerHTML = `
    <input class="date-md" type="text" placeholder="MM/DD">
    <button class="delete-btn" type="button"><i class="fa-solid fa-trash"></i></button>
  `;
  earnedDatesDiv.appendChild(div);

  div.querySelector(".delete-btn").addEventListener("click", () => {
    div.remove();
    updateEarnedHours();
    calculateBalanceEnd();
  });
}

// Add a new Utilized date input
function addUtilizedDate() {
  const utilizedDatesDiv = document.getElementById("utilizedDates");
  const div = document.createElement("div");
  div.className = "entry";
  div.style.display = "flex";
  div.style.alignItems = "center";
  div.style.gap = "6px";
  div.innerHTML = `
    <input class="date-md" type="text" placeholder="MM/DD">
    <select class="time-option">
        <option value="-">-</option>
        <option value="Full">Full</option>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
    </select>
    <button class="delete-btn" type="button"><i class="fa-solid fa-trash"></i></button>
  `;
  utilizedDatesDiv.appendChild(div);

  const select = div.querySelector("select");
  select.addEventListener("change", updateUtilizedHours);

  div.querySelector(".delete-btn").addEventListener("click", () => {
    div.remove();
    updateUtilizedHours();
    calculateBalanceEnd();
  });
}

// Update Utilized hours automatically
function updateUtilizedHours() {
  const utilizedEntries = document.querySelectorAll("#utilizedDates .entry select");
  let total = 0;
  utilizedEntries.forEach(select => {
    const val = select.value;
    if (val === "Full") total += 8;
    else if (val === "AM" || val === "PM") total += 4;
  });
  document.getElementById("utilizedHours").value = total;
  calculateBalanceEnd();
}

// Optional: update Earned hours if needed
function updateEarnedHours() {
  calculateBalanceEnd();
}

// Auto-calculate Balance End
function calculateBalanceEnd() {
  const balanceStart = Number(document.getElementById("balanceStart").value) || 0;
  const earnedHours = Number(document.getElementById("earnedHours").value) || 0;
  const utilizedHours = Number(document.getElementById("utilizedHours").value) || 0;

  let balanceEnd = balanceStart + earnedHours - utilizedHours;
  balanceEnd = Number(balanceEnd.toFixed(3));
  document.getElementById("balanceEnd").value = balanceEnd;
}

// Event listeners for auto calculation
document.getElementById("balanceStart").addEventListener("input", calculateBalanceEnd);
document.getElementById("earnedHours").addEventListener("input", calculateBalanceEnd);
document.getElementById("utilizedHours").addEventListener("input", calculateBalanceEnd);

// Save Employee record to Firebase
async function saveEmployee() {
  const name = document.getElementById("empName").value.trim();
  const balanceStart = Number(document.getElementById("balanceStart").value) || 0;
  const month = document.getElementById("monthSelect").value;
  const year = document.getElementById("yearSelect").value;
  const earnedHours = Number(document.getElementById("earnedHours").value) || 0;
  const utilizedHours = Number(document.getElementById("utilizedHours").value) || 0;
  let balanceEnd = balanceStart + earnedHours - utilizedHours;
  balanceEnd = Number(balanceEnd.toFixed(3));

  if (!name) { alert("Employee name required"); return; }

  const earnedDates = [...document.querySelectorAll("#earnedDates .entry")]
    .map(e => ({ Date: e.querySelector("input")?.value || "", Hours: earnedHours }))
    .filter(e => e.Date);

  const utilizedDates = [...document.querySelectorAll("#utilizedDates .entry")]
    .map(e => {
      const select = e.querySelector("select");
      let hrs = 0;
      if (select?.value === "Full") hrs = 8;
      else if (select?.value === "AM" || select?.value === "PM") hrs = 4;
      return { Date: e.querySelector("input")?.value || "", Hours: hrs };
    })
    .filter(e => e.Date);

  try {
    const employeeRef = ref(database, `employees/CTO/${name}`);
    const snapshot = await get(employeeRef);

    let existingYears = {};
    let existingBalanceStart = balanceStart;

    if (snapshot.exists()) {
      const data = snapshot.val();
      existingYears = data.Years || {};
      existingBalanceStart = data.BalanceStart ?? balanceStart;
    }

    if (!existingYears[year]) existingYears[year] = {};
    existingYears[year][month] = {
      Earned: earnedDates,
      Utilized: utilizedDates,
      BalanceEnd: balanceEnd
    };

    await update(employeeRef, {
      BalanceStart: existingBalanceStart,
      BalanceEnd: balanceEnd,
      Years: existingYears
    });

    alert("Employee record saved successfully!");
    resetForm(balanceEnd, month);
  } catch (error) {
    console.error("Firebase save error:", error);
    alert("Failed to save to Firebase");
  }
}

// Reset form after saving
function resetForm(newBalanceEnd, currentMonth) {
  document.getElementById("balanceStart").value = newBalanceEnd;
  document.getElementById("earnedHours").value = "";
  document.getElementById("utilizedHours").value = "";
  document.getElementById("balanceEnd").value = "";
  document.getElementById("earnedDates").innerHTML = "";
  document.getElementById("utilizedDates").innerHTML = "";

  const monthSelect = document.getElementById("monthSelect");
  const months = Array.from(monthSelect.options).map(opt => opt.value);
  const currentIndex = months.indexOf(currentMonth);
  const nextIndex = (currentIndex + 1) % months.length;
  monthSelect.value = months[nextIndex];
}

// Populate Year dropdown
const yearSelect = document.getElementById("yearSelect");
function populateYearDropdown() {
  const currentYear = new Date().getFullYear();
  for (let year = 2000; year <= currentYear; year++) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  }
  yearSelect.value = currentYear;
} 
populateYearDropdown();

// Expose functions to window
window.addEarnedDate = addEarnedDate;
window.addUtilizedDate = addUtilizedDate;
window.saveEmployee = saveEmployee;
// window.closeModal = closeModal;


// --------------------EmpName Suggestion Logic--------------------
// =======================
// Employee Name Autocomplete
// =======================
const empNameInput = document.getElementById("empName");

// Create suggestions container
const suggestionsContainer = document.createElement("div");
suggestionsContainer.id = "emp-suggestions";
suggestionsContainer.style.position = "absolute";
suggestionsContainer.style.background = "#fff";
suggestionsContainer.style.border = "1px solid #ddd";
suggestionsContainer.style.borderRadius = "6px";
suggestionsContainer.style.maxHeight = "200px";
suggestionsContainer.style.overflowY = "auto";
suggestionsContainer.style.zIndex = 9999;
suggestionsContainer.style.display = "none";
empNameInput.parentElement.appendChild(suggestionsContainer);

// Fetch all employee names once
let employeeNames = [];
async function fetchEmployeeNames() {
  const snapshot = await get(ref(database, "employees/CTO"));
  if (snapshot.exists()) {
    employeeNames = Object.keys(snapshot.val());
  }
}
fetchEmployeeNames();

// Filter and show suggestions on input
empNameInput.addEventListener("input", () => {
  const value = empNameInput.value.toLowerCase();
  suggestionsContainer.innerHTML = "";
  if (!value) {
    suggestionsContainer.style.display = "none";
    return;
  }

  const filtered = employeeNames.filter(name => name.toLowerCase().includes(value));
  filtered.forEach(name => {
    const div = document.createElement("div");
    div.textContent = name;
    div.style.padding = "6px 10px";
    div.style.cursor = "pointer";

    div.addEventListener("click", async () => {
      empNameInput.value = name;
      suggestionsContainer.style.display = "none";

      // Get selected month and year
      const selectedMonth = monthSelect.value; // e.g., "January"
      const baseYear = Number(yearSelect.value);
      const selectedYear = ["January","February","March","April","May"].includes(selectedMonth)
        ? baseYear + 1
        : baseYear;

      // Load employee data from Firebase
      const snapshot = await get(ref(database, `employees/CTO/${name}`));
      if (!snapshot.exists()) return;
      const data = snapshot.val();

      // Reset modal inputs
      document.getElementById("balanceStart").value = data.BalanceStart || 0;
      document.getElementById("earnedHours").value = "";
      document.getElementById("utilizedHours").value = "";
      document.getElementById("balanceEnd").value = "";
      document.getElementById("earnedDates").innerHTML = "";
      document.getElementById("utilizedDates").innerHTML = "";

      // Load data for selected month/year
      const monthData = data.Years?.[selectedYear]?.[selectedMonth];
      if (monthData?.Earned) {
        monthData.Earned.forEach(e => {
          addEarnedDate();
          document.querySelector("#earnedDates .entry:last-child input").value = e.Date;
        });
        document.getElementById("earnedHours").value =
          monthData.Earned.reduce((t, e) => t + Number(e.Hours || 0), 0);
      }

      if (monthData?.Utilized) {
        monthData.Utilized.forEach(u => {
          addUtilizedDate();
          const lastEntry = document.querySelector("#utilizedDates .entry:last-child");
          lastEntry.querySelector("input").value = u.Date;
          lastEntry.querySelector("select").value = u.Hours === 8 ? "Full" : u.Hours === 4 ? "AM" : "-";
        });
        document.getElementById("utilizedHours").value =
          monthData.Utilized.reduce((t, u) => t + Number(u.Hours || 0), 0);
      }

      calculateBalanceEnd();
    });

    suggestionsContainer.appendChild(div);
  });

  suggestionsContainer.style.display = filtered.length ? "block" : "none";
});

// Hide suggestions when clicking outside
document.addEventListener("click", e => {
  if (!empNameInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
    suggestionsContainer.style.display = "none";
  }
});


// Hide suggestions when clicking outside
document.addEventListener("click", e => {
  if (!empNameInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
    suggestionsContainer.style.display = "none";
  }
});
const empCloseBtn = document.querySelector("#employeeModal .close-btn");
empCloseBtn.addEventListener("click", () => {
  modal.style.display = "none";
});
const empDetailsCloseBtn = document.querySelector("#empDetailsModal .close-btn");
empDetailsCloseBtn.addEventListener("click", () => {
  empDetailsModal.style.display = "none";
});
const empCancelBtn = document.querySelector("#employeeModal .cancel");
empCancelBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

const logoutBtn = document.getElementById("logoutButton");
const logoutModal = document.getElementById("logoutModal");
const cancelLogout = document.getElementById("cancelLogout");
const confirmLogout = document.getElementById("confirmLogout");

// Open logout modal
logoutBtn.addEventListener("click", () => {
  logoutModal.style.display = "flex";
});

// Cancel logout
cancelLogout.addEventListener("click", () => {
  logoutModal.style.display = "none";
});

// Confirm logout
confirmLogout.addEventListener("click", () => {
  window.location.href = "index.html";
});

// Close modal when clicking outside
logoutModal.addEventListener("click", (e) => {
  if (e.target === logoutModal) {
    logoutModal.style.display = "none";
  }
});


//===============================================
// Change Password Logic
//========================================
const auth = getAuth();
const changePassBtn = document.getElementById("cPass");
const changePassModal = document.getElementById("changePassModal");
const cancelChangePass = document.getElementById("cancelChangePass");
const changePassForm = document.getElementById("changePassForm");

// Open modal
changePassBtn.addEventListener("click", () => {
  changePassModal.classList.remove("hidden");
});

// Close modal
cancelChangePass.addEventListener("click", () => {
  changePassModal.classList.add("hidden");
  changePassForm.reset();
});

// Toggle password visibility
changePassModal.querySelectorAll(".cp-toggle").forEach(icon => {
  icon.addEventListener("click", () => {
    const input = icon.previousElementSibling;
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    icon.classList.toggle("fa-eye");
    icon.classList.toggle("fa-eye-slash");
  });
});

// Handle form submit
changePassForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const currentPass = document.getElementById("currentPass").value;
  const newPass = document.getElementById("newPass").value;
  const confirmPass = document.getElementById("confirmPass").value;

  if (newPass !== confirmPass) {
      alert("New password and confirm password do not match!");
      return;
  }

  const confirmed = confirm("Are you sure you want to change your password?");
  if (!confirmed) return;

  try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user is currently signed in.");

      const credential = EmailAuthProvider.credential(user.email, currentPass);
      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, newPass);

      alert("Password successfully updated!");
      changePassModal.classList.add("hidden");
      changePassForm.reset();
  } catch (error) {
      console.error("Error changing password:", error);
      if (error.code === "auth/wrong-password") {
          alert("Current password is incorrect!");
      } else {
          alert("Failed to change password: " + error.message);
      }
  }
});
