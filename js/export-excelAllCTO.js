import { database } from './firebase.js';
import { ref, get } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("exportAllEmpExcelBtn")?.addEventListener("click", exportAllEmployeesExcel);
});

async function exportAllEmployeesExcel() {
  const baseYear = Number(document.getElementById("yearSelect").value);
  const employeesSnap = await get(ref(database, "employees/CTO"));
  if (!employeesSnap.exists()) return alert("No employee records found!");

  const months = ["June","July","August","September","October","November","December","January","February","March","April","May"];
  const data = [];

  // Title and Subtitle
  data.push([`CTO Reports of all Employees`]);
  data.push([`Year ${baseYear}-${baseYear + 1}`]);
  data.push([]); // empty row before headers

  // Main header row
  const header1 = ["#", "Employee Name"];
  months.forEach(m => header1.push(m, "", "", "", "")); // 5 sub-columns per month
  header1.push("Total Balance End");
  data.push(header1);

  // Sub-header row
  const header2 = ["", ""];
  months.forEach(_ => {
    header2.push("Utilized","Utilized Dates","Earned","Earned Dates","Balance");
  });
  header2.push(""); // for total balance column
  data.push(header2);

  // Employee data
  let index = 1;
  employeesSnap.forEach(empSnap => {
    const emp = empSnap.val();
    const row = [index++, empSnap.key];

    months.forEach(m => {
      const monthData = emp.Years?.[baseYear]?.[m] || {};
      
      // Utilized
      let utilized = 0, utilizedDates = [];
      if(monthData.Utilized){
        Object.values(monthData.Utilized).forEach(u => {
          utilized += Number(u.Hours || 0);
          utilizedDates.push(u.Date);
        });
      }

      // Earned
      let earned = 0, earnedDates = [];
      if(monthData.Earned){
        Object.values(monthData.Earned).forEach(e => {
          earned += Number(e.Hours || 0);
          earnedDates.push(e.Date);
        });
      }

      const balance = monthData.BalanceEnd !== undefined ? Number(monthData.BalanceEnd).toFixed(2) : "-";

      row.push(
        utilized ? utilized.toFixed(2) : "-",
        utilizedDates.length ? utilizedDates.join(", ") : "-",
        earned ? earned.toFixed(2) : "-",
        earnedDates.length ? earnedDates.join(", ") : "-",
        balance
      );
    });

    row.push(emp.BalanceEnd !== undefined ? Number(emp.BalanceEnd).toFixed(2) : "0.00");
    data.push(row);
  });

  // Create workbook and sheet
  const ws = XLSX.utils.aoa_to_sheet(data);

  const range = XLSX.utils.decode_range(ws['!ref']);

  // Style title and subtitle
  ["A1", "A2"].forEach(cell => {
    if (!ws[cell]) return;
    ws[cell].s = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: "center" }
    };
  });

  // Merge title and subtitle across columns
  ws["!merges"] = [
    { s: { r:0, c:0 }, e: { r:0, c:range.e.c } }, // title
    { s: { r:1, c:0 }, e: { r:1, c:range.e.c } }  // subtitle
  ];

  // Style headers
  for(let C = 0; C <= range.e.c; ++C){
    // Main header row (row 4)
    const mainHeaderCell = XLSX.utils.encode_cell({r:3, c:C});
    if(ws[mainHeaderCell]){
      ws[mainHeaderCell].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F81BD" } },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    // Sub-header row (row 5)
    const subHeaderCell = XLSX.utils.encode_cell({r:4, c:C});
    if(ws[subHeaderCell]){
      ws[subHeaderCell].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "D9E1F2" } },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }
  }

  // Column widths: # smaller, Employee Name wider
  const colWidths = data[0].map((_, i) => {
    if (i === 0) return { wch: 5 };   // "#" column
    if (i === 1) return { wch: 25 };  // "Employee Name" column
    return { wch: 15 };                // other columns
  });
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "All Employees CTO");
  XLSX.writeFile(wb, `All_Employees_CTO_${baseYear}-${baseYear+1}.xlsx`);
}
