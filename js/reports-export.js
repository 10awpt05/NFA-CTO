// ================================
// MODULE IMPORTS
// ================================

// ================================
// GLOBAL VARIABLES
// ================================
const fiscalMonths = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Make sure you have a select input with id="yearSelect" in your HTML
const yearSelect = document.getElementById("yearSelect");

// ================================
// EVENT LISTENERS
// ================================

  document.getElementById("exportEmpPdfBtn")?.addEventListener("click", exportEmployeePDF);



// ================================
// EXPORT SINGLE EMPLOYEE PDF
// ================================
function exportEmployeePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("l", "pt", "a4"); // landscape

  const name = document.getElementById("empModalName").textContent;
  const balance = document.getElementById("empTotalBalance").textContent;
  const balanceStart = document.getElementById("empBalanceStart").textContent;
  let period = document.getElementById("empBalanceDate").textContent;

  // Replace "Fiscal Year" with "Year"
  period = period.replace(/Fiscal Year\s*/i, "Year ");

  // Title
  doc.setFontSize(16);
  doc.text("Employee CTO Report", 40, 40);

  doc.setFontSize(11);
  doc.text(`Name: ${name}`, 40, 70);
  doc.text(`Period: ${period}`, 40, 90);
  doc.text(`Balance Start: ${balanceStart}`, 40, 110);
  doc.text(`Balance End: ${balance}`, 40, 130);

  // Table
  doc.autoTable({
    html: "#empDetailsModal .details-table",
    startY: 160,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [33, 150, 243] }
  });

  // Save PDF
  const fileName = `${name.replace(/\s+/g, "_")}_CTO_Report.pdf`;
  doc.save(fileName);
}
