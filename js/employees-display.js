import { database } from "./firebase.js";
import { ref, onValue, get } from
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

/* =========================
   DOM ELEMENTS
========================= */
const tableBody = document.querySelector(".employee-table tbody");
const empNameInput = document.getElementById("empName");
const balanceStartInput = document.getElementById("balanceStart");
const monthSelect = document.getElementById("monthSelect");
const yearInput = document.getElementById("yearInput");
const yearSelect = document.getElementById("yearSelect");

/* =========================
   DEFAULT YEAR
========================= */
const currentYear = new Date().getFullYear();
yearInput.value = currentYear;

/* =========================
   FISCAL MONTHS (June → June)
========================= */
const fiscalMonths = [
  "June","July","August","September","October","November","December",
  "January","February","March","April","May","June"
];

/* =========================
   POPULATE YEAR DROPDOWN
========================= */
function populateYearDropdown() {
  yearSelect.innerHTML = "";
  for (let y = currentYear; y >= 2000; y--) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  }
  yearSelect.value = currentYear;
}
populateYearDropdown();

/* =========================
   POPULATE MONTH DROPDOWN
========================= */
function populateFiscalMonths() {
  const baseYear = Number(yearInput.value);
  monthSelect.innerHTML = "";

  fiscalMonths.forEach((month, index) => {
    const yearLabel = index >= 7 ? baseYear + 1 : baseYear;
    const option = document.createElement("option");
    option.value = `${month}|${yearLabel}`;
    option.textContent = `${month} (${yearLabel})`;
    monthSelect.appendChild(option);
  });
}

/* =========================
   EMPLOYEES TABLE (REALTIME)
========================= */
function listenEmployeesTable() {
  const baseYear = Number(yearSelect.value);
  const employeesRef = ref(database, "employees/CTO");

  onValue(employeesRef, (snapshot) => {
    tableBody.innerHTML = "";
    if (!snapshot.exists()) return;

    let index = 1;

    snapshot.forEach(empSnap => {
      const empName = empSnap.key;
      const emp = empSnap.val();

      let row = `
        <tr>
          <td>${index++}</td>
          <td class="emp-name clickable" data-name="${empName}">${empName}</td>
      `;

      fiscalMonths.forEach((month, i) => {
        const yearKey = i >= 7 ? baseYear + 1 : baseYear;
        const monthData = emp.Years?.[yearKey]?.[month] || {};

        let earned = 0;
        let utilized = 0;
        let balanceEnd = "-";

        if (monthData.Earned) {
          Object.values(monthData.Earned)
            .forEach(e => earned += Number(e.Hours || 0));
        }

        if (monthData.Utilized) {
          Object.values(monthData.Utilized)
            .forEach(u => utilized += Number(u.Hours || 0));
        }

        if (monthData.BalanceEnd !== undefined) {
          balanceEnd = Number(monthData.BalanceEnd).toFixed(2);
        }

        row += `
          <td>${utilized.toFixed(2)}</td>
          <td>${earned.toFixed(2)}</td>
          <td>${balanceEnd}</td>
        `;
      });

      row += `
          <td>${emp.BalanceEnd !== undefined
            ? Number(emp.BalanceEnd).toFixed(2)
            : "0.00"}</td>
        </tr>
      `;

      tableBody.insertAdjacentHTML("beforeend", row);
    });
  });
}

/* =========================
   YEAR FILTER CHANGE
========================= */
yearSelect.addEventListener("change", () => {
  listenEmployeesTable();
});

/* =========================
   SEARCH FILTER
========================= */
function setupEmployeeSearch() {
  const searchInput = document.getElementById("report-search");
  searchInput.addEventListener("input", () => {
    const filter = searchInput.value.toLowerCase();
    document.querySelectorAll(".employee-table tbody tr").forEach(row => {
      row.style.display =
        row.children[1].textContent.toLowerCase().includes(filter)
          ? ""
          : "none";
    });
  });
}

/* =========================
   ROW CLICK → MODAL
========================= */
document.addEventListener("click", (e) => {
  const cell = e.target.closest(".emp-name");
  if (cell) openEmployeeModal(cell.dataset.name);
});

/* =========================
   EMPLOYEE DETAILS MODAL
========================= */
async function openEmployeeModal(empName) {
  const modal = document.getElementById("empDetailsModal");
  const tbody = document.getElementById("empDetailsTableBody");
  const baseYear = Number(yearSelect.value);

  tbody.innerHTML = "";
  document.getElementById("empModalName").textContent = empName;

  const snap = await get(ref(database, `employees/CTO/${empName}`));
  if (!snap.exists()) return;

  const data = snap.val();

  document.getElementById("empTotalBalance").textContent =
    Number(data.BalanceEnd || 0).toFixed(2);

  document.getElementById("empBalanceStart").textContent =
    Number(data.BalanceStart || 0).toFixed(2);

  document.getElementById("empBalanceDate").textContent =
    `Fiscal Year ${baseYear} – ${baseYear + 1}`;

  fiscalMonths.forEach((month, i) => {
    const yearKey = i >= 7 ? baseYear + 1 : baseYear;
    const m = data.Years?.[yearKey]?.[month];
    if (!m) return;

    const earnedArr = Object.values(m.Earned || {});
    const utilizedArr = Object.values(m.Utilized || {});

    tbody.insertAdjacentHTML("beforeend", `
      <tr>
        <td>${month} ${yearKey}</td>
        <td>${earnedArr.reduce((t,e)=>t+Number(e.Hours||0),0).toFixed(2)}</td>
        <td>${earnedArr.map(e=>e.Date).join(", ")}</td>
        <td>${utilizedArr.reduce((t,u)=>t+Number(u.Hours||0),0).toFixed(2)}</td>
        <td>${utilizedArr.map(u=>u.Date).join(", ")}</td>
        <td style="color:red">${m.BalanceEnd ?? ""}</td>
      </tr>
    `);
  });

  modal.style.display = "flex";
}

/* =========================
   MODAL CLOSE
========================= */
window.closeEmpModal = () =>
  document.getElementById("empDetailsModal").style.display = "none";

/* =========================
   AUTOCOMPLETE (EMP NAME)
========================= */
const suggestionBox = document.createElement("div");
suggestionBox.id = "emp-suggestions";
suggestionBox.style.cssText = `
  position:absolute;
  display:none;
  background:#fff;
  border:1px solid #ddd;
  border-radius:8px;
  max-height:200px;
  overflow-y:auto;
  z-index:2000;
  box-shadow:0 8px 20px rgba(0,0,0,.12);
`;
empNameInput.closest(".modal-card").appendChild(suggestionBox);

empNameInput.addEventListener("input", async () => {
  const q = empNameInput.value.toLowerCase();
  if (!q) return suggestionBox.style.display = "none";

  const snap = await get(ref(database, "employees/CTO"));
  if (!snap.exists()) return;

  suggestionBox.innerHTML = "";
  snap.forEach(s => {
    if (s.key.toLowerCase().includes(q)) {
      const d = document.createElement("div");
      d.textContent = s.key;
      d.style.padding = "8px";
      d.style.cursor = "pointer";
      d.onclick = () => {
        empNameInput.value = s.key;
        suggestionBox.style.display = "none";
      };
      suggestionBox.appendChild(d);
    }
  });

  suggestionBox.style.display = "block";
});

function updateTableHeaderYear() {
  const baseYear = Number(yearSelect.value);
  const headers = document.querySelectorAll(".month-header");

  headers.forEach((th, index) => {
    const yearLabel = index >= 7 ? baseYear + 1 : baseYear;
    th.textContent = `${fiscalMonths[index]} ${yearLabel}`;
  });
}
yearSelect.addEventListener("change", () => {
  updateTableHeaderYear();
  listenEmployeesTable();
});


/* =========================
   INIT
========================= */
populateFiscalMonths();
listenEmployeesTable();
setupEmployeeSearch();
updateTableHeaderYear();
