import { database } from "./firebase.js";
import { ref, set, get, update, push } 
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// employee.js

const modal = document.getElementById("employeeModal");

// Open modal
document.getElementById("addCtoBtn").onclick = () => { modal.style.display = "flex"; };

// Close modal
function closeModal() {
  modal.style.display = "none";
}

// Add a new Earned date input (MM/DD + AM/PM/Full + delete button)
function addEarnedDate() {
  const earnedDatesDiv = document.getElementById("earnedDates");
  const div = document.createElement("div");
  div.className = "entry";
  div.style.display = "flex";
  div.style.alignItems = "center";
  div.style.gap = "6px";
  div.innerHTML = `
    <input class="date-md" type="text" placeholder="MM/DD">
    
    <button class="delete-btn" type="button"><i class="fa-solid fa-trash"></i> </button>
  `;
  earnedDatesDiv.appendChild(div);

  // Delete button
  div.querySelector(".delete-btn").addEventListener("click", () => {
    div.remove();
    updateEarnedHours();
    calculateBalanceEnd();
  });

  // Optional: recalc if you implement auto-earned hours
//   div.querySelector("select").addEventListener("change", updateEarnedHours);
}

// Add a new Utilized date input (MM/DD + AM/PM/Full + delete button)
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

  // Delete button
  div.querySelector(".delete-btn").addEventListener("click", () => {
    div.remove();
    updateUtilizedHours();
    calculateBalanceEnd();
  });
}

// Update total Utilized hours automatically
function updateUtilizedHours() {
  const utilizedEntries = document.querySelectorAll("#utilizedDates .entry select");
  let total = 0;
  utilizedEntries.forEach(select => {
    const val = select.value;
    if (val === "Full") total += 8;
    else if (val === "AM" || val === "PM") total += 4;
    else total += 0;
  });
  document.getElementById("utilizedHours").value = total;
  calculateBalanceEnd();
}

// Optional: auto-calc earned hours if you want similar logic
function updateEarnedHours() {
  // Implement if needed
  calculateBalanceEnd();
}

// Auto-calculate Balance End
function calculateBalanceEnd() {
  const balanceStart = Number(document.getElementById("balanceStart").value) || 0;
  const earnedHours = Number(document.getElementById("earnedHours").value) || 0;
  const utilizedHours = Number(document.getElementById("utilizedHours").value) || 0;

  let balanceEnd = balanceStart + earnedHours - utilizedHours;
  balanceEnd = Number(balanceEnd.toFixed(3)); // limit to 3 decimal digits

  document.getElementById("balanceEnd").value = balanceEnd;
}


// Event listeners for auto calculation
document.getElementById("balanceStart").addEventListener("input", calculateBalanceEnd);
document.getElementById("earnedHours").addEventListener("input", calculateBalanceEnd);
document.getElementById("utilizedHours").addEventListener("input", calculateBalanceEnd);

// Save Employee record (Firebase logic)
async function saveEmployee() {
  const name = document.getElementById("empName").value.trim();
  const balanceStart = Number(document.getElementById("balanceStart").value) || 0;
  const month = document.getElementById("monthSelect").value;
  const year = document.getElementById("yearSelect").value; // ✅ YEAR
  const earnedHours = Number(document.getElementById("earnedHours").value) || 0;
  const utilizedHours = Number(document.getElementById("utilizedHours").value) || 0;

  let balanceEnd = balanceStart + earnedHours - utilizedHours;
  balanceEnd = Number(balanceEnd.toFixed(3));

  if (!name) {
    alert("Employee name required");
    return;
  }

  // Earned dates
  const earnedDates = [...document.querySelectorAll("#earnedDates .entry")]
    .map(e => ({
      Date: e.querySelector("input")?.value || "",
      Hours: earnedHours
    }))
    .filter(e => e.Date);

  // Utilized dates
  const utilizedDates = [...document.querySelectorAll("#utilizedDates .entry")]
    .map(e => {
      const select = e.querySelector("select");
      let hrs = 0;
      if (select?.value === "Full") hrs = 8;
      else if (select?.value === "AM" || select?.value === "PM") hrs = 4;

      return {
        Date: e.querySelector("input")?.value || "",
        Hours: hrs
      };
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

    // ✅ Ensure year object exists
    if (!existingYears[year]) {
      existingYears[year] = {};
    }

    // ✅ Save under YEAR → MONTH
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



// Reset form
function resetForm(newBalanceEnd, currentMonth) {
  // Set balanceStart to previous balanceEnd
  document.getElementById("balanceStart").value = newBalanceEnd;

  // Clear hours and dates
  document.getElementById("earnedHours").value = "";
  document.getElementById("utilizedHours").value = "";
  document.getElementById("balanceEnd").value = "";
  document.getElementById("earnedDates").innerHTML = "";
  document.getElementById("utilizedDates").innerHTML = "";

  // Move month to the next one
  const monthSelect = document.getElementById("monthSelect");
  const months = Array.from(monthSelect.options).map(opt => opt.value);
  const currentIndex = months.indexOf(currentMonth);
  const nextIndex = (currentIndex + 1) % months.length; // loops back to January
  monthSelect.value = months[nextIndex];
}
//--------YEAR Drop down------
const yearSelect = document.getElementById("yearSelect");

function populateYearDropdown() {
  const currentYear = new Date().getFullYear();
  for (let year = 2000; year <= currentYear; year++) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  }

  // Optional: set current year as selected
  yearSelect.value = currentYear;
}

populateYearDropdown();



// Expose functions to window for inline HTML calls
window.addEarnedDate = addEarnedDate;
window.addUtilizedDate = addUtilizedDate;
window.saveEmployee = saveEmployee;
window.closeModal = closeModal;

// -------------------------------
// CHANGE PASSWORD FUNCTIONALITY (Firebase Auth)
// -------------------------------
const auth = getAuth();

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
document.querySelectorAll(".toggle-password").forEach(icon => {
    icon.addEventListener("click", () => {
        const input = icon.previousElementSibling;
        if (input.type === "password") {
            input.type = "text";
            icon.classList.replace("fa-eye", "fa-eye-slash");
        } else {
            input.type = "password";
            icon.classList.replace("fa-eye-slash", "fa-eye");
        }
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

    // Custom confirmation modal
    const confirmed = confirm("Are you sure you want to change your password?");
    if (!confirmed) return;

    try {
        const user = auth.currentUser;
        if (!user) throw new Error("No user is currently signed in.");

        // Re-authenticate
        const credential = EmailAuthProvider.credential(user.email, currentPass);
        await reauthenticateWithCredential(user, credential);

        // Update password
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