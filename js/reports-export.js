document.getElementById('export-btn').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4');

    // Title
    doc.setFontSize(16);
    doc.setTextColor(30, 144, 255);
    doc.text("CTO Report", 40, 40);

    // Employee Info card
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Employee Name: Vicente Burdagol", 40, 60);
    doc.text("Balance: 1.075 HRS", 40, 75);

    // Define table headers (two-level)
    const headers = [
        [
            { content: 'MONTH', rowSpan: 2 },
            { content: 'EARNED', colSpan: 2, styles: { halign: 'center' } },
            { content: 'UTILIZED', colSpan: 2, styles: { halign: 'center' } },
            { content: 'BALANCE END', rowSpan: 2 }
        ],
        [
            { content: 'HRS' },
            { content: 'DATE' },
            { content: 'HRS' },
            { content: 'DATE' }
        ]
    ];

    // Table body
    const table = document.querySelector('table');
    const body = [];
    table.querySelectorAll('tbody tr').forEach(tr => {
        const row = [];
        tr.querySelectorAll('td').forEach(td => {
            row.push(td.innerText || '-'); // replace empty with '-'
        });
        body.push(row);
    });

    doc.autoTable({
        head: headers,
        body: body,
        startY: 90,
        theme: 'grid',
        headStyles: {
            fillColor: [220, 38, 38], // red header
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle'
        },
        alternateRowStyles: { fillColor: [224, 242, 254] }, // light blue
        styles: {
            fontSize: 10,
            textColor: [30, 40, 175],
            cellPadding: 5,
            lineColor: [0, 0, 0],
            lineWidth: 0.5
        },
        columnStyles: {
            0: { halign: 'left' }, // MONTH left align
            5: { halign: 'right' } // Balance right align
        }
    });

    doc.save("leave_report.pdf");
});
