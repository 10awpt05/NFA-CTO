import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const employeeRef = ref(db, "employees/CTO/EmployeesName");

get(employeeRef).then(snapshot => {
    if (snapshot.exists()) {
        const data = snapshot.val();
        const tbody = document.querySelector("table tbody");
        tbody.innerHTML = ""; // clear existing rows

        for (const month in data.Months) {
            const earned = data.Months[month].Earned;
            const utilized = data.Months[month].Utilized;

            const row = document.createElement("tr");
            row.innerHTML = `
                <td data-label="MONTH">${month}</td>
                <td data-label="Earned HRS">${earned?.Hours || ''}</td>
                <td data-label="Earned DATE">${earned?.Date || ''}</td>
                <td data-label="Utilized HRS">${utilized?.Hours || ''}</td>
                <td data-label="Utilized DATE">${utilized?.Date || ''}</td>
                <td data-label="Balance End">${data.BalanceEnd || ''}</td>
            `;
            tbody.appendChild(row);
        }

        // update employee name and balance
        document.querySelector(".report-card .name .card-value").textContent = "EmployeesName"; // replace with actual employee name
        document.querySelector(".report-card .balance .card-value").textContent = data.BalanceStart || '';
    } else {
        console.log("No data available");
    }
}).catch(error => {
    console.error(error);
});