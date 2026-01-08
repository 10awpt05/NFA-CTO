document.addEventListener("DOMContentLoaded", () => {

  const certModal = document.getElementById("certModal");
  const certMonth = document.getElementById("certMonth");
  const certTotalHrs = document.getElementById("certTotalHrs");

  // ⚠️ Use event delegation because modal is reused
  document.addEventListener("click", (e) => {

    // ================= OPEN CERT MODAL =================
    if (e.target.id === "generateCertBtn") {

      certModal.style.display = "flex";

      const today = new Date();
      document.getElementById("certDate").valueAsDate = today;
      document.getElementById("certIssued").valueAsDate = today;

      // auto compute once modal opens
      computeTotalHrs();
    }
  });

  // ================= MONTH CHANGE =================
  certMonth.addEventListener("change", computeTotalHrs);

  // ================= COMPUTE TOTAL HRS =================
  function computeTotalHrs() {
    const selectedMonth = certMonth.value;
    let balanceEnd = 0;

    const rows = document.querySelectorAll("#empDetailsTableBody tr");

    rows.forEach(row => {
      const monthCell = row.children[1];      // Month
      const balanceEndCell = row.children[6]; // Balance End

      if (!monthCell || !balanceEndCell) return;

      if (monthCell.innerText.trim() === selectedMonth) {
        balanceEnd = parseFloat(balanceEndCell.innerText) || 0;
      }
    });

    certTotalHrs.value = balanceEnd;
  }

});

function formatCertDate(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).toUpperCase();
}


window.generateCertificatePDF = function () {
  const { jsPDF } = window.jspdf;

  const doc = new jsPDF("landscape", "mm", "a4");

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 15;   // 🔧 more outer space
  const marginY = 20;
  const boxWidth = pageWidth - marginX * 2;
  const boxHeight = 90; // 🔧 slightly taller box

  const startX = marginX;
  const startY = marginY;

  const innerPadding = 12; // 🔧 spacing from border

  const name = document.getElementById("empModalName").innerText;
  const hrs = document.getElementById("certTotalHrs").value;
  const manager = document.getElementById("certManager").value;
  const issued = document.getElementById("certIssued").value || "";
  const valid = document.getElementById("certValid").value || "";
  const certDateValue = document.getElementById("certDate").value;
  const formattedCertDate = formatCertDate(certDateValue);


  // ================= BORDER =================
  doc.setLineWidth(0.8);
  doc.rect(startX, startY, boxWidth, boxHeight);

  // ================= TITLE =================
  doc.setFont("Times", "Bold");
  doc.setFontSize(18);
  doc.text("CERTIFICATE OF CCOS EARNED", pageWidth / 2, startY + innerPadding, { align: "center" });

  // ================= BODY =================
  doc.setFont("Times", "Normal");
  doc.setFontSize(14);

  let y = startY + innerPadding + 15;

  // ================= FIRST LINE =================
  doc.text("This certificate entitles Mr/Ms.", startX + innerPadding, y);

  const nameX = startX + innerPadding + 80;
  const nameWidth = 100;
  doc.line(nameX, y + 1, nameX + nameWidth, y + 1);

  doc.setFont("Times", "Bold");
  doc.text(name, nameX + nameWidth / 2, y, { align: "center" });
  doc.setFont("Times", "Normal");

  doc.text("to", nameX + nameWidth + 5, y);

  // ================= SECOND LINE =================
  y += 13;

  const hrsX = startX + innerPadding;
  const hrsWidth = 45;

  doc.line(hrsX, y + 1, hrsX + hrsWidth, y + 1);
  doc.setFont("Times", "Bold");
  doc.text(`${hrs} HRS.`, hrsX + hrsWidth / 2, y, { align: "center" });
  doc.setFont("Times", "Normal");

  doc.text("as Compensatory Day-off as of", hrsX + hrsWidth + 5, y);

  const dateX = hrsX + hrsWidth + 70;
  const dateWidth = 50;

  doc.line(dateX, y + 1, dateX + dateWidth, y + 1);
  doc.setFont("Times", "Bold");
  doc.text(formattedCertDate, dateX + dateWidth / 2, y, { align: "center" });
  doc.setFont("Times", "Normal");

  // ================= LABELS =================
  y += 7;
  doc.setFontSize(10);
  doc.text("(No. of grand total hrs.)", hrsX, y);
  doc.text("(date covered)", dateX + 12, y);


  // ================= MANAGER SIGNATURE (MOVED DOWN) =================
  const sigY = startY + boxHeight - 30;  // 🔽 pushed down
  const sigX = startX + boxWidth - 105;

  doc.setFontSize(14);
  doc.setFont("Times", "Bold");
  doc.text(manager, sigX + 50, sigY, { align: "center" });

  doc.line(sigX + 10, sigY + 2, sigX + 90, sigY + 2);

  doc.setFont("Times", "Normal");
  doc.text("Acting Branch Manager", sigX + 50, sigY + 10, { align: "center" });

  // ================= FOOTER (MOVED FURTHER DOWN) =================
  let footerY = startY + boxHeight - 20; // 🔽 lower than before

  doc.setFontSize(12);
  doc.text("Date Issued :", startX + innerPadding, footerY);
  doc.line(startX + innerPadding + 35, footerY + 1, startX + innerPadding + 105, footerY + 1);
  if (issued) doc.text(issued, startX + innerPadding + 37, footerY);

  footerY += 8;
  doc.text("Valid Until :", startX + innerPadding, footerY);
  doc.line(startX + innerPadding + 35, footerY + 1, startX + innerPadding + 105, footerY + 1);
  if (valid) doc.text(valid, startX + innerPadding + 37, footerY);

  // ================= SAVE =================
  doc.save(`${name}_CCOS_Certificate.pdf`);
};

window.cancelCertificate = function () {
  const certModal = document.getElementById("certModal");

  // Hide modal
  certModal.style.display = "none";

};
