// ------------------- EXPORT EMPLOYEE DATA -------------------
if (!window.docx) console.error("docx not loaded");
if (!window.jsPDF) console.error("jsPDF not loaded");
if (!window.XLSX) console.error("XLSX not loaded");

// Button + dropdown
const exportBtn = document.getElementById("exportEmpBtn");
const exportType = document.getElementById("exportType");

exportBtn.addEventListener("click", () => {
    const type = exportType.value;
    if(type === "pdf") exportEmpToPDF();
    else if(type === "excel") exportEmpToExcel();
    else if(type === "word") exportEmpToWord();
});

// ------------------- WORD -------------------
async function exportEmpToWord() {
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } = docx;

    const empNameText = document.getElementById("empModalName").textContent || "Employee";
    const balanceStart = document.getElementById("empBalanceStart").textContent || "";
    const balanceAsOf = document.getElementById("empBalanceDate").textContent || "";
    const empTableBody = document.getElementById("empDetailsTableBody").children;

    const doc = new Document();

    // Employee info
    doc.addSection({
        children:[
            new Paragraph({children:[new TextRun({text: empNameText, bold:true, size:28})]}),
            new Paragraph({children:[new TextRun({text: "Position:", bold:true})]}),
            new Paragraph({children:[new TextRun({text: `${balanceStart} Balance as of ${balanceAsOf}`, bold:true, color:"DC2626"})]})
        ]
    });

    // ------------------- Table -------------------
    const tableRows = [];

    // Header row
    tableRows.push(new TableRow({
        children: [
            new TableCell({children:[new Paragraph({children:[new TextRun({text:"Notes", bold:true})], alignment: AlignmentType.CENTER})], shading:{fill:"DC2626"}}),
            new TableCell({children:[new Paragraph({children:[new TextRun({text:"Month", bold:true})], alignment: AlignmentType.CENTER})], shading:{fill:"DC2626"}}),
            new TableCell({children:[new Paragraph({children:[new TextRun({text:"Earned (Hrs)", bold:true})], alignment: AlignmentType.CENTER})], shading:{fill:"DC2626"}}),
            new TableCell({children:[new Paragraph({children:[new TextRun({text:"Earned Date", bold:true})], alignment: AlignmentType.CENTER})], shading:{fill:"DC2626"}}),
            new TableCell({children:[new Paragraph({children:[new TextRun({text:"Utilized (Hrs)", bold:true})], alignment: AlignmentType.CENTER})], shading:{fill:"DC2626"}}),
            new TableCell({children:[new Paragraph({children:[new TextRun({text:"Utilized Date", bold:true})], alignment: AlignmentType.CENTER})], shading:{fill:"DC2626"}}),
            new TableCell({children:[new Paragraph({children:[new TextRun({text:"Balance End", bold:true})], alignment: AlignmentType.CENTER})], shading:{fill:"DC2626"}}),
        ]
    }));

    // Table body
    Array.from(empTableBody).forEach((tr,rowIndex)=>{
        const cells = Array.from(tr.children).map((td,colIndex)=>{
            let paraProps = {
                children:[new TextRun({text: td.textContent || ""})],
                alignment: AlignmentType.CENTER
            };

            // Balance End column red
            if(colIndex === 6){
                paraProps.children = [new TextRun({text: td.textContent || "", bold:true, color:"DC2626"})];
            }

            // Optional: first column left-aligned
            if(colIndex === 1) paraProps.alignment = AlignmentType.LEFT;

            const shading = rowIndex % 2 === 0 ? {fill:"F9FAFB"} : undefined;

            return new TableCell({
                children:[new Paragraph(paraProps)],
                shading
            });
        });

        tableRows.push(new TableRow({children: cells}));
    });

    const table = new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top:{style: BorderStyle.SINGLE},
            bottom:{style: BorderStyle.SINGLE},
            left:{style: BorderStyle.SINGLE},
            right:{style: BorderStyle.SINGLE},
            insideH:{style: BorderStyle.SINGLE},
            insideV:{style: BorderStyle.SINGLE},
        }
    });

    doc.addSection({children:[table]});

    const blob = await Packer.toBlob(doc);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${empNameText}_CTO_Report.docx`;
    link.click();
}

// ------------------- PDF -------------------
function exportEmpToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'pt', 'a4');

    const empNameText = document.getElementById("empModalName").textContent || "Employee";
    const balanceStart = document.getElementById("empBalanceStart").textContent || "";
    const balanceAsOf = document.getElementById("empBalanceDate").textContent || "";
    const empTableBody = document.getElementById("empDetailsTableBody").children;

    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.text(empNameText, 40, 40);
    doc.setFontSize(12);
    doc.setFont(undefined, "normal");
    doc.setTextColor(220,38,38);
    doc.text(`${balanceStart} Balance as of ${balanceAsOf}`, 40, 80);
    doc.setTextColor(0,0,0);

    const head = [
        [
            { content: "Notes", styles:{halign:'center', fillColor:[220,38,38], textColor:[255,255,255], fontStyle:'bold'}},
            { content: "Month", styles:{halign:'center', fillColor:[220,38,38], textColor:[255,255,255], fontStyle:'bold'}},
            { content: "Earned (Hrs)", styles:{halign:'center', fillColor:[220,38,38], textColor:[255,255,255], fontStyle:'bold'}},
            { content: "Earned Date", styles:{halign:'center', fillColor:[220,38,38], textColor:[255,255,255], fontStyle:'bold'}},
            { content: "Utilized (Hrs)", styles:{halign:'center', fillColor:[220,38,38], textColor:[255,255,255], fontStyle:'bold'}},
            { content: "Utilized Date", styles:{halign:'center', fillColor:[220,38,38], textColor:[255,255,255], fontStyle:'bold'}},
            { content: "Balance End", styles:{halign:'center', fillColor:[220,38,38], textColor:[255,255,255], fontStyle:'bold'}}
        ]
    ];

    const body = Array.from(empTableBody).map(tr => Array.from(tr.children).map(td => td.textContent));

    doc.autoTable({
        startY: 120,
        head: head,
        body: body,
        theme:'grid',
        styles:{fontSize:12, halign:'center', valign:'middle'},
        alternateRowStyles:{fillColor:[245,245,245]},
        didParseCell: function(data){
            if(data.column.index === 6 && data.row.index >= 0){
                data.cell.styles.textColor = [220,38,38];
                data.cell.styles.fontStyle = 'bold';
            }
        },
        margin:{left:40,right:40}
    });

    doc.save(`${empNameText}_CTO_Report.pdf`);
}

// ------------------- EXCEL -------------------
function exportEmpToExcel() {
    const empNameText = document.getElementById("empModalName").textContent || "Employee";
    const balanceStart = document.getElementById("empBalanceStart").textContent || "";
    const balanceAsOf = document.getElementById("empBalanceDate").textContent || "";
    const empTableBody = document.getElementById("empDetailsTableBody").children;

    const ws_data = [];

    ws_data.push([empNameText,"","","","","",""]);
    ws_data.push(["Position","","","","","",""]);
    ws_data.push([]);
    ws_data.push([`As of ${balanceAsOf}`,"","","","","",""]);
    ws_data.push([`${balanceStart} Balance`,"","","","","",""]);

    ws_data.push(["Notes","Month","Earned","","Utilized","","Balance End"]);
    ws_data.push(["","","HRS","DATE","HRS","DATE",""]);

    Array.from(empTableBody).forEach(tr => ws_data.push(Array.from(tr.children).map(td => td.textContent)));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    ws["!merges"] = [
        {s:{r:6,c:2}, e:{r:6,c:3}}, // Earned
        {s:{r:6,c:4}, e:{r:6,c:5}}, // Utilized
    ];

    const borderAll = { top:{style:"thin",color:{rgb:"000000"}}, bottom:{style:"thin",color:{rgb:"000000"}}, left:{style:"thin",color:{rgb:"000000"}}, right:{style:"thin",color:{rgb:"000000"}} };

    for(let R=0; R<ws_data.length; R++){
        for(let C=0; C<ws_data[0].length; C++){
            const cell = XLSX.utils.encode_cell({r:R,c:C});
            if(!ws[cell]) continue;
            ws[cell].s = ws[cell].s || {};
            ws[cell].s.border = borderAll;
            ws[cell].s.alignment = {horizontal:"center", vertical:"center"};
            if(R===6) ws[cell].s.fill={fgColor:{rgb:"DC2626"}}, ws[cell].s.font={bold:true,color:{rgb:"FFFFFF"}};
            if(R===7) ws[cell].s.fill={fgColor:{rgb:"F3F4F6"}}, ws[cell].s.font={bold:true,color:{rgb:"000000"}};
            if(C===6 && R>7) ws[cell].s.font={bold:true,color:{rgb:"DC2626"}};
            if(R>7 && (R-8)%2===0) ws[cell].s.fill={fgColor:{rgb:"F9FAFB"}};
        }
    }

    XLSX.utils.book_append_sheet(wb, ws, "CTO Details");
    XLSX.writeFile(wb, `${empNameText}_CTO_Report.xlsx`);
}
