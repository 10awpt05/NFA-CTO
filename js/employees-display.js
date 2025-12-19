import { database } from "./firebase.js";
import { ref, onValue, get } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const tableBody = document.querySelector(".employee-table tbody");
const empNameInput = document.getElementById("empName");
const balanceStartInput = document.getElementById("balanceStart");
const monthSelect = document.getElementById("monthSelect");

const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

// 🔄 Auto-refresh employees table
function listenEmployeesTable() {
  const employeesRef = ref(database, "employees/CTO");

  onValue(employeesRef, (snapshot) => {
    tableBody.innerHTML = "";
    if (!snapshot.exists()) return;

    let index = 1;
    snapshot.forEach(empSnap => {
      const empName = empSnap.key;
      const emp = empSnap.val();

      let row = `<tr>
        <td>${index++}</td>
        <td class="emp-name clickable" data-name="${empName}">${empName}</td>`;

      months.forEach(month => {
        let earned = 0, utilized = 0, balanceEnd = "-";
        const monthData = emp.Months?.[month];
        if (monthData?.Earned) Object.values(monthData.Earned).forEach(e => earned += Number(e.Hours || 0));
        if (monthData?.Utilized) Object.values(monthData.Utilized).forEach(u => utilized += Number(u.Hours || 0));
        if (monthData?.BalanceEnd !== undefined) balanceEnd = Number(monthData.BalanceEnd).toFixed(2);

        row += `<td>${utilized.toFixed(2)}</td><td>${earned.toFixed(2)}</td><td>${balanceEnd}</td>`;
      });

      row += `<td>${emp.BalanceEnd !== undefined ? Number(emp.BalanceEnd).toFixed(2) : "-"}</td></tr>`;
      tableBody.innerHTML += row;
    });
  });
}

// 🔍 Search employee by name
function setupEmployeeSearch() {
  const searchInput = document.getElementById("report-search");
  searchInput.addEventListener("input", () => {
    const filter = searchInput.value.toLowerCase();
    const rows = document.querySelectorAll(".employee-table tbody tr");
    rows.forEach(row => {
      const nameCell = row.children[1];
      row.style.display = nameCell.textContent.toLowerCase().includes(filter) ? "" : "none";
    });
  });
}

// Click handler for names
document.addEventListener("click", async (e) => {
  const cell = e.target.closest(".emp-name");
  if (!cell) return;
  const empName = cell.dataset.name;
  openEmployeeModal(empName);
});

// Modal open function
async function openEmployeeModal(empName) {
  const modal = document.getElementById("empDetailsModal");
  const nameEl = document.getElementById("empModalName");
  const balanceEl = document.getElementById("empTotalBalance");
  const asOfEl = document.getElementById("empBalanceDate");
  const balanceStartEl = document.getElementById("empBalanceStart");
  const tbody = document.getElementById("empDetailsTableBody");

  nameEl.textContent = empName;
  tbody.innerHTML = "";

  const snap = await get(ref(database, `employees/CTO/${empName}`));
  if (!snap.exists()) return;
  const data = snap.val();

  balanceEl.textContent = (Number(data.BalanceEnd) || 0).toFixed(2);
  asOfEl.textContent = "Latest Month";
  balanceStartEl.textContent = (Number(data.BalanceStart) || 0).toFixed(2);

  Object.entries(data.Months || {}).forEach(([month, m]) => {
    const earnedHrs = ((m.Earned || []).reduce((t, e) => t + Number(e.Hours || 0), 0)).toFixed(2);
    const earnedDates = (m.Earned || []).map(e => e.Date).join(",");
    const utilizedHrs = ((m.Utilized || []).reduce((t, u) => t + Number(u.Hours || 0), 0)).toFixed(2);
    const utilizedDates = (m.Utilized || []).map(u => u.Date).join(",");
    const balanceEnd = m.BalanceEnd !== undefined ? Number(m.BalanceEnd).toFixed(2) : "";

    tbody.innerHTML += `<tr>
      <td>${month}</td>
      <td>${earnedHrs}</td>
      <td>${earnedDates}</td>
      <td>${utilizedHrs}</td>
      <td>${utilizedDates}</td>
      <td style="color:red">${balanceEnd}</td>
    </tr>`;
  });

  modal.style.display = "flex";
}

// Modal close
function closeEmpModal() { document.getElementById("empDetailsModal").style.display = "none"; }
window.closeEmpModal = closeEmpModal;

// ========================
// Employee Name Autocomplete
// ========================

// Create suggestion box
let suggestionBox = document.getElementById("emp-suggestions");
if (!suggestionBox) {
  suggestionBox = document.createElement("div");
  suggestionBox.id = "emp-suggestions";
  suggestionBox.style.position = "absolute";
  suggestionBox.style.display = "none";
  suggestionBox.style.zIndex = "1000";
  suggestionBox.style.backgroundColor = "#fff";
  suggestionBox.style.border = "1px solid #ccc";
  suggestionBox.style.borderRadius = "6px";
  suggestionBox.style.maxHeight = "200px";
  suggestionBox.style.overflowY = "auto";
  suggestionBox.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";

  // Append to modal or body
  empNameInput.closest(".modal-card").appendChild(suggestionBox);
}

function positionSuggestionBox() {
  const rect = empNameInput.getBoundingClientRect();
  const modalRect = empNameInput.closest(".modal-card").getBoundingClientRect();

  

  suggestionBox.style.top = (rect.bottom - modalRect.top) + "px"; // distance from top of modal-card
  suggestionBox.style.left = (rect.left - modalRect.left) + "px";  // distance from left of modal-card
  suggestionBox.style.width = rect.width + "px";                   // match input width
}

// Call this whenever you show the box
empNameInput.addEventListener("input", () => {
  positionSuggestionBox();
});


// Render suggestions
let selectedIndex = -1;
let currentSuggestions = [];

function renderSuggestions(suggestions) {
  suggestionBox.innerHTML = "";
  currentSuggestions = suggestions;
  selectedIndex = -1;

  suggestions.forEach((emp, i) => {
    const div = document.createElement("div");
    div.textContent = emp.name;
    div.style.padding = "5px";
    div.style.cursor = "pointer";
    div.dataset.index = i;

    div.addEventListener("click", () => selectSuggestion(i));
    suggestionBox.appendChild(div);
  });

  suggestionBox.style.display = suggestions.length ? "block" : "none";
}

function selectSuggestion(index) {
  const emp = currentSuggestions[index];
  if (!emp) return;

  empNameInput.value = emp.name;
  balanceStartInput.value = emp.data.BalanceEnd ?? 0;

  const monthsKeys = Object.keys(emp.data.Months || {});
  if (monthsKeys.length) {
    monthSelect.value = monthsKeys[monthsKeys.length - 1];
  }

  suggestionBox.style.display = "none";
}

// Input listener
empNameInput.addEventListener("input", async () => {
  const queryText = empNameInput.value.toLowerCase();
  if (!queryText) {
    suggestionBox.style.display = "none";
    return;
  }

  const snapshot = await get(ref(database, "employees/CTO"));
  if (!snapshot.exists()) return;

  const suggestions = [];
  snapshot.forEach(empSnap => {
    const empName = empSnap.key;
    if (empName.toLowerCase().includes(queryText)) {
      suggestions.push({ name: empName, data: empSnap.val() });
    }
  });

  renderSuggestions(suggestions);
});

// Keyboard navigation
empNameInput.addEventListener("keydown", (e) => {
  if (!currentSuggestions.length) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    selectedIndex = (selectedIndex + 1) % currentSuggestions.length;
    highlightSuggestion();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    selectedIndex = (selectedIndex - 1 + currentSuggestions.length) % currentSuggestions.length;
    highlightSuggestion();
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (selectedIndex >= 0) selectSuggestion(selectedIndex);
  }
});

function highlightSuggestion() {
  Array.from(suggestionBox.children).forEach((div, i) => {
    div.style.backgroundColor = i === selectedIndex ? "#f0f0f0" : "#fff";
  });
}

// Hide suggestions when clicking outside
document.addEventListener("click", (e) => {
  if (!empNameInput.contains(e.target) && !suggestionBox.contains(e.target)) {
    suggestionBox.style.display = "none";
  }
});

// ========================
// Initialize
// ========================
listenEmployeesTable();
setupEmployeeSearch();
