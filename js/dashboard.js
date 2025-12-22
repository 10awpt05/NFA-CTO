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
    type: 'line',
    data: { labels: [], datasets: [{ data: [], backgroundColor: gradientUtilized, borderColor: 'rgba(255,99,132,1)', fill: true, tension: 0.4, pointBackgroundColor: '#fff', pointRadius: 5, pointHoverRadius: 7 }] },
    options: { responsive: true, plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } }, y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } } } }
});

let earnedChart = new Chart(earnedChartCtx, {
    type: 'line',
    data: { labels: [], datasets: [{ data: [], backgroundColor: gradientEarned, borderColor: 'rgba(54,162,235,1)', fill: true, tension: 0.4, pointBackgroundColor: '#fff', pointRadius: 5, pointHoverRadius: 7 }] },
    options: { responsive: true, plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } }, y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } } } }
});

// -------------------------------
// LISTEN DASHBOARD DATA
// -------------------------------
function listenDashboard() {
    const employeesRef = ref(database, "employees/CTO");
    const currentYear = new Date().getFullYear().toString();

    onValue(employeesRef, snapshot => {
        if (!snapshot.exists()) return;

        let totalEmployees = 0, totalEarned = 0, totalUtilized = 0, totalBalanceEnd = 0;
        const labels = [], earnedData = [], utilizedData = [];

        snapshot.forEach(empSnap => {
            totalEmployees++;
            const emp = empSnap.val();
            const yearData = emp.Years?.[currentYear] || {};

            let empEarned = 0, empUtilized = 0;

            // Loop through months
            Object.values(yearData).forEach(month => {
                (month.Earned || []).forEach(e => { empEarned += Number(e.Hours || 0); });
                (month.Utilized || []).forEach(u => { empUtilized += Number(u.Hours || 0); });
            });

            totalEarned += empEarned;
            totalUtilized += empUtilized;
            totalBalanceEnd += Number(emp.BalanceEnd || 0);

            labels.push(empSnap.key); // employee name
            earnedData.push(empEarned.toFixed(2));
            utilizedData.push(empUtilized.toFixed(2));
        });

        // Update stats
        totalEmpEl.textContent = totalEmployees;
        earnedHrsEl.textContent = totalEarned.toFixed(2);
        utilizedHrsEl.textContent = totalUtilized.toFixed(2);
        balanceEndEl.textContent = totalBalanceEnd.toFixed(2);

        // Update charts
        earnedChart.data.labels = labels;
        earnedChart.data.datasets[0].data = earnedData;
        earnedChart.update();

        utilizedChart.data.labels = labels;
        utilizedChart.data.datasets[0].data = utilizedData;
        utilizedChart.update();
    });
}

listenDashboard();

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
