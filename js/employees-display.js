import { database } from "./firebase.js";
import { ref, onValue, get, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";


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
// yearInput.value = currentYear;

/* =========================
   FISCAL MONTHS (June → June)
========================= */
const fiscalMonths = [
  "June","July","August","September","October","November","December",
  "January","February","March","April","May"
];

/* =========================
   POPULATE YEAR DROPDOWN
========================= */


/* =========================
   POPULATE MONTH DROPDOWN
========================= */
function populateFiscalMonths() {
  monthSelect.innerHTML = "";
  fiscalMonths.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    monthSelect.appendChild(opt);
  });
}

// function populateFiscalYears() {
//   yearInput.innerHTML = "";

//   const startYear = 2025;
//   const today = new Date();

//   // Determine current fiscal year
//   const currentFiscalStart =
//     today.getMonth() >= 5   // June = month 5
//       ? today.getFullYear()
//       : today.getFullYear() - 1;

//   for (let y = startYear; y <= currentFiscalStart; y++) {
//     const fy = `${y}-${y + 1}`;
//     const opt = document.createElement("option");
//     opt.value = fy;
//     opt.textContent = fy;
//     yearInput.appendChild(opt);
//   }

//   // Default = current fiscal year
//   yearInput.value = `${currentFiscalStart}-${currentFiscalStart + 1}`;
// }



// function getFiscalYearKey(month, baseYear) {
//   // Fiscal year: June → May
//   // Months Jan–May belong to previous year; June–Dec belong to current year
//   const secondHalf = ["January","February","March","April","May"];

//   if (secondHalf.includes(month)) {
//     // Jan–May → belongs to previous June-start fiscal year
//     return `${baseYear - 1}-${baseYear}`;
//   } else {
//     // June–Dec → belongs to current June-start fiscal year
//     return `${baseYear}-${baseYear + 1}`;
//   }
// }


/* =========================
   EMPLOYEES TABLE (REALTIME)
========================= */
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
          <td class="emp-name clickable" data-name="${empName}">${empName}</td>
      `;

      fiscalMonths.forEach(month => {
        const fiscalYear = yearSelect.value;
        const monthData = emp.Years?.[fiscalYear]?.[month] || {};

        let earned = 0;
        let utilized = 0;
        let balanceEnd = "-";

        if (monthData.Earned) Object.values(monthData.Earned).forEach(e => earned += Number(e.Hours || 0));
        if (monthData.Utilized) Object.values(monthData.Utilized).forEach(u => utilized += Number(u.Hours || 0));
        if (monthData.BalanceEnd !== undefined) balanceEnd = Number(monthData.BalanceEnd).toFixed(3);

        row += `<td>${utilized.toFixed(3)}</td>
                <td>${earned.toFixed(3)}</td>
                <td>${balanceEnd}</td>`;
      });

      row += `<td>${emp.BalanceEnd !== undefined ? Number(emp.BalanceEnd).toFixed(3) : "0.000"}</td></tr>`;
      tableBody.insertAdjacentHTML("beforeend", row);
    });
  });
}



/* =========================
   YEAR FILTER CHANGE
========================= */
yearSelect.addEventListener("change", () => {
  tableBody.innerHTML = "";
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
  currentEmpName = empName;
  const modal = document.getElementById("empDetailsModal");
  const tbody = document.getElementById("empDetailsTableBody");

  const fiscalYear = yearSelect.value;
  yearInput.value = fiscalYear; // sync modal dropdown




  // Reset buttons
  const editBtn = document.getElementById("editEmpBtn");
  const saveBtn = document.getElementById("saveEmpBtn");
  const cancelBtn = document.getElementById("cancelEmpBtn");

  editBtn.style.display = "inline-block";
  saveBtn.style.display = "none";
  cancelBtn.style.display = "none";

  tbody.innerHTML = "";
  document.getElementById("empModalName").textContent = empName;

  const snap = await get(ref(database, `employees/CTO/${empName}`));
  if (!snap.exists()) return;
  const data = snap.val();

  document.getElementById("empTotalBalance").textContent =
    Number(data.BalanceEnd || 0).toFixed(3);

  document.getElementById("empBalanceStart").textContent =
    Number(data.BalanceStart || 0).toFixed(3);

  document.getElementById("empBalanceDate").textContent =
    `Fiscal Year ${fiscalYear}`;

  fiscalMonths.forEach(month => {
    const m = data.Years?.[fiscalYear]?.[month];
    if (!m) return;

    const earnedArr = Object.values(m.Earned || {});
    const utilizedArr = Object.values(m.Utilized || {});
    const note = m.Note || "";

    tbody.insertAdjacentHTML("beforeend", `
      <tr>
        <td>${note}</td>
        <td>${month}</td>
        <td>${earnedArr.reduce((t,e)=>t+Number(e.Hours||0),0).toFixed(3)}</td>
        <td>${earnedArr.map(e=>e.Date).join(", ")}</td>
        <td>${utilizedArr.reduce((t,u)=>t+Number(u.Hours||0),0).toFixed(3)}</td>
        <td>${utilizedArr.map(u=>u.Date).join(", ")}</td>
        <td style="color:red">
          ${m.BalanceEnd !== undefined ? Number(m.BalanceEnd).toFixed(3) : ""}
        </td>
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
// Store current employee being edited
let currentEmpName = null;
// function enableEdit() {
//   const editBtn = document.getElementById("editEmpBtn");
//   const saveBtn = document.getElementById("saveEmpBtn");
//   const cancelBtn = document.getElementById("cancelEmpBtn");

//   editBtn.addEventListener("click", () => {
//     const tbody = document.getElementById("empDetailsTableBody");

//     tbody.querySelectorAll("tr").forEach(row => {
//       row.querySelectorAll("td").forEach((cell, i) => {
//         const val = cell.textContent;

//         if (i === 0) {
//           // Notes column
//           cell.innerHTML = `<input type="text" value="${val}" style="width:100%; box-sizing:border-box;">`;
//         } else if (i === 1) {
//           // Month column, skip editing
//           return;
//         } else {
//           // Other columns
//           cell.innerHTML = `<input type="text" value="${val}" style="width:80px; box-sizing:border-box;">`;
//         }
//       });
//     });

//     editBtn.style.display = "none";
//     saveBtn.style.display = "inline-block";
//     cancelBtn.style.display = "inline-block";
//   });

//   saveBtn.addEventListener("click", saveEmployeeEdits);

//   cancelBtn.addEventListener("click", () => {
//     // Reset modal to default state without saving
//     openEmployeeModal(currentEmpName);
//   });
// }

async function saveEmployee() {
  const empName = empNameInput.value.trim();
  if (!empName) return alert("Employee name is required");

  const fiscalYear = yearSelect.value;
  const month = monthSelect.value;

  const balanceStart = Number(balanceStartInput.value || 0);
  const balanceEnd = Number(document.getElementById("balanceEnd").value || 0);
  const earnedHours = Number(document.getElementById("earnedHours").value || 0);
  const utilizedHours = Number(document.getElementById("utilizedHours").value || 0);

  const updates = {
    BalanceStart: balanceStart,
    BalanceEnd: balanceEnd,
    [`Years/${fiscalYear}/${month}`]: {
      Earned: earnedHours ? { Auto: { Hours: earnedHours } } : {},
      Utilized: utilizedHours ? { Auto: { Hours: utilizedHours } } : {},
      BalanceEnd: balanceEnd
    }
  };

  await update(ref(database, `employees/CTO/${empName}`), updates);

  alert(`Saved under Fiscal Year ${fiscalYear}`);
  closeModal();
}



// Attach listeners once
function initEmpModalControls() {
  const editBtn = document.getElementById("editEmpBtn");
  const saveBtn = document.getElementById("saveEmpBtn");
  const cancelBtn = document.getElementById("cancelEmpBtn");

  // ---------------- EDIT ----------------
  editBtn.addEventListener("click", () => {
    const tbody = document.getElementById("empDetailsTableBody");

    tbody.querySelectorAll("tr").forEach(row => {
      const cells = row.querySelectorAll("td");
      cells.forEach((cell, i) => {
        const val = cell.textContent;
        if (i === 1 || i === 3 || i === 5) return; // Skip Month and Date columns
        cell.innerHTML = `<input type="text" value="${val}" style="width:100%; box-sizing:border-box;">`;
      });
    });

    editBtn.style.display = "none";
    saveBtn.style.display = "inline-block";
    cancelBtn.style.display = "inline-block";
  });

  // ---------------- SAVE ----------------
  saveBtn.addEventListener("click", async () => {
    if (!currentEmpName) return alert("No employee selected!");

    const tbody = document.getElementById("empDetailsTableBody");
    const rows = Array.from(tbody.querySelectorAll("tr"));
    const empRef = ref(database, `employees/CTO/${currentEmpName}`);
    const snap = await get(empRef);
    if (!snap.exists()) return alert("Employee not found in DB");

    const empData = snap.val();
    const existingYears = empData.Years || {};
    const balanceStart = Number(empData.BalanceStart || 0);
    let lastBalanceEnd = balanceStart;

    // Fiscal year from dropdown
    const fiscalYear = yearInput.value; // ALWAYS use dropdown

    rows.forEach(row => {
      const cells = row.querySelectorAll("td");
      const note = cells[0].querySelector("input")?.value || cells[0].textContent;
      const month = cells[1].textContent;

      const earnedInput = Number(cells[2].querySelector("input")?.value || cells[2].textContent);
      const utilizedInput = Number(cells[4].querySelector("input")?.value || cells[4].textContent);
      const balanceEnd = Number(cells[6].querySelector("input")?.value || cells[6].textContent) || 0;

      if (!existingYears[fiscalYear]) existingYears[fiscalYear] = {};
      const existingMonthData = existingYears[fiscalYear][month] || {};

      let earnedObj = existingMonthData.Earned || {};
      if (earnedInput !== 0) {
        const key = Object.keys(earnedObj)[0] || "0";
        const date = earnedObj[key]?.Date || "";
        earnedObj = { [key]: { Hours: earnedInput, Date: date } };
      }

      let utilizedObj = existingMonthData.Utilized || {};
      if (utilizedInput !== 0) {
        const key = Object.keys(utilizedObj)[0] || "0";
        const date = utilizedObj[key]?.Date || "";
        utilizedObj = { [key]: { Hours: utilizedInput, Date: date } };
      }

      existingYears[fiscalYear][month] = {
        Note: note,
        Earned: earnedObj,
        Utilized: utilizedObj,
        BalanceEnd: balanceEnd
      };

      lastBalanceEnd = balanceEnd;
    });


    // Update Firebase
    await update(empRef, {
      BalanceStart: balanceStart,
      BalanceEnd: lastBalanceEnd,
      Years: existingYears
    });

    alert("Employee edits saved!");
    openEmployeeModal(currentEmpName); // reload modal
  });




  // ---------------- CANCEL ----------------
  cancelBtn.addEventListener("click", () => {
    if (!currentEmpName) return;
    openEmployeeModal(currentEmpName);
  });
}

function populateFiscalYearDropdowns() {
  const startYear = 2025;
  const today = new Date();

  const currentFiscalStart =
    today.getMonth() >= 5 ? today.getFullYear() : today.getFullYear() - 1;

  const fiscalYears = [];
  for (let y = startYear; y <= currentFiscalStart + 1; y++) {
    fiscalYears.push(`${y}-${y + 1}`);
  }

  // Top filter
  yearSelect.innerHTML = "";
  fiscalYears.slice().reverse().forEach(fy => {
    const opt = document.createElement("option");
    opt.value = fy;
    opt.textContent = fy;
    yearSelect.appendChild(opt);
  });

  // Modal dropdown
  yearInput.innerHTML = "";
  fiscalYears.forEach(fy => {
    const opt = document.createElement("option");
    opt.value = fy;
    opt.textContent = fy;
    yearInput.appendChild(opt);
  });

  const currentFY = `${currentFiscalStart}-${currentFiscalStart + 1}`;
  yearSelect.value = currentFY;
  yearInput.value = currentFY;
}



/* =========================
   INIT
========================= */
populateFiscalYearDropdowns();
populateFiscalMonths();
listenEmployeesTable();
setupEmployeeSearch();
initEmpModalControls();
