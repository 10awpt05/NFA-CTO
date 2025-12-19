import { database } from "./firebase.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// DOM Elements
const totalEmpEl = document.querySelector(".cards-grid .card:nth-child(1) h3");
const earnedHrsEl = document.querySelector(".cards-grid .card:nth-child(2) h3");
const utilizedHrsEl = document.querySelector(".cards-grid .card:nth-child(3) h3");
const balanceEndEl = document.querySelector(".cards-grid .card:nth-child(4) h3");

// Chart canvas
const utilizedChartCtx = document.getElementById("utilizedChart").getContext("2d");
const earnedChartCtx = document.getElementById("earnedChart").getContext("2d");

// Create gradient fills
const gradientUtilized = utilizedChartCtx.createLinearGradient(0, 0, 0, 300);
gradientUtilized.addColorStop(0, 'rgba(255,99,132,0.4)');
gradientUtilized.addColorStop(1, 'rgba(255,99,132,0)');

const gradientEarned = earnedChartCtx.createLinearGradient(0, 0, 0, 300);
gradientEarned.addColorStop(0, 'rgba(54,162,235,0.4)');
gradientEarned.addColorStop(1, 'rgba(54,162,235,0)');

// Utilized Hours Chart
let utilizedChart = new Chart(utilizedChartCtx, {
    type: 'line',
    data: { labels: [], datasets: [{ 
        data: [], 
        backgroundColor: gradientUtilized,
        borderColor: 'rgba(255,99,132,1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#fff',
        pointRadius: 5,
        pointHoverRadius: 7
    }] },
    options: {
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
        scales: {
            x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } },
            y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } }
        }
    }
});

// Earned Hours Chart
let earnedChart = new Chart(earnedChartCtx, {
    type: 'line',
    data: { labels: [], datasets: [{ 
        data: [], 
        backgroundColor: gradientEarned,
        borderColor: 'rgba(54,162,235,1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#fff',
        pointRadius: 5,
        pointHoverRadius: 7
    }] },
    options: {
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
        scales: {
            x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } },
            y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } }
        }
    }
});

// Realtime listener
function listenDashboard() {
    const employeesRef = ref(database, "employees/CTO");

    onValue(employeesRef, snapshot => {
        if (!snapshot.exists()) return;

        let totalEmployees = 0, totalEarned = 0, totalUtilized = 0, totalBalanceEnd = 0;
        const labels = [], earnedData = [], utilizedData = [];

        snapshot.forEach(empSnap => {
            totalEmployees++;
            const emp = empSnap.val();
            let empEarned = 0, empUtilized = 0;

            Object.values(emp.Months || {}).forEach(month => {
                if (month.Earned) Object.values(month.Earned).forEach(e => empEarned += Number(e.Hours || 0));
                if (month.Utilized) Object.values(month.Utilized).forEach(u => empUtilized += Number(u.Hours || 0));
            });

            totalEarned += empEarned;
            totalUtilized += empUtilized;
            totalBalanceEnd += Number(emp.BalanceEnd || 0);

            labels.push(empSnap.key);
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
