// -------------------------------
// IMPORTS
// -------------------------------
import { database } from "./firebase.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { getAuth, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// -------------------------------
// DOM ELEMENTS
// -------------------------------
const totalEmpEl = document.querySelector(".cards-grid .card:nth-child(1) h3");
const earnedHrsEl = document.querySelector(".cards-grid .card:nth-child(2) h3");
const utilizedHrsEl = document.querySelector(".cards-grid .card:nth-child(3) h3");
const balanceEndEl = document.querySelector(".cards-grid .card:nth-child(4) h3");

const utilizedChartCtx = document.getElementById("utilizedChart").getContext("2d");
const earnedChartCtx = document.getElementById("earnedChart").getContext("2d");

const changePassBtn = document.getElementById("changePassBtn");
const changePassModal = document.getElementById("changePassModal");
const cancelChangePass = document.getElementById("cancelChangePass");
const changePassForm = document.getElementById("changePassForm");

const yearSelect = document.getElementById("yearSelect");

// -------------------------------
// CHARTS
// -------------------------------
const gradientUtilized = utilizedChartCtx.createLinearGradient(0, 0, 0, 300);
gradientUtilized.addColorStop(0, 'rgba(255,99,132,0.4)');
gradientUtilized.addColorStop(1, 'rgba(255,99,132,0)');

const gradientEarned = earnedChartCtx.createLinearGradient(0, 0, 0, 300);
gradientEarned.addColorStop(0, 'rgba(54,162,235,0.4)');
gradientEarned.addColorStop(1, 'rgba(54,162,235,0)');

let utilizedChart = new Chart(utilizedChartCtx, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [
            {
                label: "Earned Hours",
                data: [],
                backgroundColor: 'rgba(54,162,235,0.7)'
            },
            {
                label: "Utilized Hours",
                data: [],
                backgroundColor: 'rgba(255,99,132,0.7)'
            }
        ]
    },
    options: {
        responsive: true,
        plugins: {
            legend: { display: true },
            tooltip: {
                callbacks: {
                    label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} hrs`
                }
            }
        },
        scales: {
            x: {
                ticks: { color: '#fff' },
                grid: { color: 'rgba(255,255,255,0.1)' }
            },
            y: {
                ticks: { color: '#fff' },
                grid: { color: 'rgba(255,255,255,0.1)' }
            }
        }
    }
});


let earnedChart = new Chart(earnedChartCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: "Earned Hours",
                data: [],
                borderColor: 'rgba(54,162,235,1)',
                backgroundColor: 'rgba(54,162,235,0.3)',
                fill: true,
                tension: 0.4
            },
            {
                label: "Utilized Hours",
                data: [],
                borderColor: 'rgba(255,99,132,1)',
                backgroundColor: 'rgba(255,99,132,0.3)',
                fill: true,
                tension: 0.4
            }
        ]
    },
    options: {
        responsive: true,
        plugins: {
            legend: { display: true },
            tooltip: {
                callbacks: {
                    title: (items) => `Month: ${items[0].label}`,
                    label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} hrs`
                }
            }
        },
        scales: {
            x: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' } },
            y: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' } }
        }
    }
});

// -------------------------------
// DASHBOARD DATA
// -------------------------------
function listenDashboard(fiscalYear) {
    const employeesRef = ref(database, "employees/CTO");

    onValue(employeesRef, snapshot => {
        if (!snapshot.exists()) return;

        let totalEmployees = 0;
        let totalEarned = 0;
        let totalUtilized = 0;
        let totalBalanceEnd = 0;

        const employeeLabels = [];
        const employeeEarnedData = [];
        const employeeUtilizedData = [];

        const fiscalMonths = [
            "June", "July", "August", "September", "October", "November",
            "December", "January", "February", "March", "April", "May"
        ];

        const monthIndexMap = {
            June: 0, July: 1, August: 2, September: 3, October: 4, November: 5,
            December: 6, January: 7, February: 8, March: 9, April: 10, May: 11
        };


        const earnedByMonth = Array(12).fill(0);
        const utilizedByMonth = Array(12).fill(0);


        snapshot.forEach(empSnap => {
            totalEmployees++;

            const emp = empSnap.val();
            const empName = empSnap.key;
            const yearData = emp.Years?.[fiscalYear];

            let empEarned = 0;
            let empUtilized = 0;

            if (yearData) {
                Object.entries(yearData).forEach(([monthName, monthData]) => {
                const monthIndex = monthIndexMap[monthName];
                if (monthIndex === undefined) return;

                // ---- EARNED ----
                if (Array.isArray(monthData.Earned)) {
                    monthData.Earned.forEach(e => {
                        const hrs = Number(e.Hours || 0);
                        empEarned += hrs;
                        earnedByMonth[monthIndex] += hrs;
                        totalEarned += hrs;
                    });
                }

                // ---- UTILIZED ----
                if (Array.isArray(monthData.Utilized)) {
                    monthData.Utilized.forEach(u => {
                        const hrs = Number(u.Hours || 0);
                        empUtilized += hrs;
                        utilizedByMonth[monthIndex] += hrs;
                        totalUtilized += hrs;
                    });
                }
            });

            }

            totalBalanceEnd += Number(emp.BalanceEnd || 0);

            // ---- PER EMPLOYEE DATA ----
            employeeLabels.push(empName);
            employeeEarnedData.push(empEarned);
            employeeUtilizedData.push(empUtilized);
        });

        // ---- UPDATE CARDS ----
        totalEmpEl.textContent = totalEmployees;
        earnedHrsEl.textContent = totalEarned.toFixed(3);
        utilizedHrsEl.textContent = totalUtilized.toFixed(3);
        balanceEndEl.textContent = totalBalanceEnd.toFixed(3);

        // ---- LEFT CHART (EMPLOYEE: EARNED + UTILIZED) ----
        utilizedChart.data.labels = employeeLabels;
        utilizedChart.data.datasets[0].data = employeeEarnedData;
        utilizedChart.data.datasets[1].data = employeeUtilizedData;
        utilizedChart.update();

        // ---- RIGHT CHART (MONTH: EARNED + UTILIZED) ----
        const monthLabels = fiscalMonths;

        earnedChart.data.labels = monthLabels;
        earnedChart.data.datasets[0].data = earnedByMonth;
        earnedChart.data.datasets[1].data = utilizedByMonth;
        earnedChart.update();
    });
}




async function populateYearDropdownFromRecords() {
    const employeesRef = ref(database, "employees/CTO");

    onValue(employeesRef, snapshot => {
        if (!snapshot.exists()) return;

        const yearsSet = new Set();

        snapshot.forEach(empSnap => {
            const emp = empSnap.val();
            if (emp.Years) {
                Object.keys(emp.Years).forEach(y => {
                    if (y && y.includes("-")) {
                        yearsSet.add(y); // only valid fiscal years
                    }
                });
            }
        });

        // Clear existing options
        yearSelect.innerHTML = "";

        // Sort properly: 2025-2026 < 2026-2027
        const sortedYears = Array.from(yearsSet).sort((a, b) => {
            const aStart = Number(a.split("-")[0]);
            const bStart = Number(b.split("-")[0]);
            return bStart - aStart; // descending
        });

        sortedYears.forEach(y => {
            const option = document.createElement("option");
            option.value = y;
            option.textContent = y;
            yearSelect.appendChild(option);
        });

        // Auto select latest year
        if (sortedYears.length > 0) {
            yearSelect.value = sortedYears[0];
            listenDashboard(sortedYears[0]);
        }
    });
}


// Listen for year change
yearSelect.addEventListener("change", () => {
    const selectedFY = yearSelect.value;
    listenDashboard(selectedFY);
});


// -------------------------------
// CHANGE PASSWORD FUNCTIONALITY (Firebase Auth)
// -------------------------------
const auth = getAuth();

changePassBtn.addEventListener("click", () => changePassModal.classList.remove("hidden"));
cancelChangePass.addEventListener("click", () => {
    changePassModal.classList.add("hidden");
    changePassForm.reset();
});

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
        alert("Failed to change password: " + error.message);
    }
});

// -------------------------------
// INITIALIZE
// -------------------------------
populateYearDropdownFromRecords();
