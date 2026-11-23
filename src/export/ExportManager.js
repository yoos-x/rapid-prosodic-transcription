// ExportManager.js
// Responsible for exporting JSON and PDF

/**
 * Function to download JSON file
 */
function downloadJSON() {
    const audioFileName = requirePairedAudio();
    if (!audioFileName) return;
    const audio = loadedAudioFile;
    const exportMarkItems = markItems;
    const rawTranscript = window.rawTranscript;

    showLoading();
    setTimeout(() => {
        try {
            if (audio !== loadedAudioFile || exportMarkItems !== markItems || audioPairingProblem()) {
                alert('Die Audiodatei oder die Annotationen haben sich geändert. Bitte starten Sie den Export erneut.');
                return;
            }
            const exportData = {
                log: log,
                transcript: markItems.getText(),
                transcript_json: markItems.getValues(),
                rawTranscript: rawTranscript,
                audiofilename: audioFileName || 'Unbekannt'
            };

            // Create a Blob from the JSON data
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const jsonname = audioFileName.replace(/\.[^/.]+$/, '') || 'Unbekannt';
            const timestamp = new Date().toISOString().slice(2,16).replace(/[-T:]/g, '');

            // Create a temporary link to trigger download
            const a = document.createElement('a');
            a.href = url;
            a.download = `${jsonname}_annotation_${timestamp}.json`;
            a.click();

            // Release the object URL
            URL.revokeObjectURL(url);
        } finally {
            hideLoading();
        }
    }, 10);
}

/**
 * Function to download PDF file
 */
function downloadPDF() {
    const audioFileName = requirePairedAudio();
    if (!audioFileName) return;
    const audio = loadedAudioFile;
    const exportMarkItems = markItems;
    const rawTranscript = window.rawTranscript;
    const jsonFileName = window.jsonFileName;
    const textFileName = window.textFileName;

    showLoading();
    setTimeout(() => {
        try {
            if (audio !== loadedAudioFile || exportMarkItems !== markItems || audioPairingProblem()) {
                alert('Die Audiodatei oder die Annotationen haben sich geändert. Bitte starten Sie den Export erneut.');
                return;
            }
            const doc = new jspdf.jsPDF({ unit: 'pt', format: 'a4' });
            
            // Define consistent page margins
            const margins = {
                top: 60,
                bottom: 60,
                left: 40,
                right: 40
            };
            const pageHeight = doc.internal.pageSize.getHeight();
            const pageWidth = doc.internal.pageSize.getWidth();
            const usableWidth = pageWidth - margins.left - margins.right;
            // Prepare metadata for the PDF
            const audioFileNameDisplay = audioFileName || 'Unbekannte Audiodatei';
            const textFileNameDisplay = jsonFileName || textFileName || 'Unbekannte Textdatei';
            const exportDate = new Date().toLocaleString('de-DE');
            
            // Main title
            doc.setFont('times', 'bold');
            doc.setFontSize(16);
            doc.text('Annotationsbericht', pageWidth / 2, margins.top, { align: 'center' });
            // Document Metadata
            doc.setFont('times', 'normal');
            doc.setFontSize(10);
            let currentY = margins.top + 30; // Start Y position below the title
            doc.text(`Audiodatei: ${audioFileNameDisplay}`, margins.left, currentY);
            currentY += 15;
            doc.text(`Textdatei: ${textFileNameDisplay}`, margins.left, currentY);
            currentY += 15;
            doc.text(`Bericht erstellt am: ${exportDate}`, margins.left, currentY);
            currentY += 30;

            // Transcript section with page break handling
            doc.setFont('times', 'bold');
            doc.text('Transkript:', margins.left, currentY);
            currentY += 20;
            doc.setFont('times', 'normal');
            
            // Split transcript into lines that fit the page
            const textTranscript = rawTranscript || 'Kein Transkript vorhanden.';
            const textLines = doc.splitTextToSize(textTranscript, usableWidth);
            
            // Loop through lines and add pages manually if needed
            for (const line of textLines) {
                // Check if the next line exceeds the bottom margin
                if (currentY > pageHeight - margins.bottom) {
                    doc.addPage();
                    currentY = margins.top; // Reset Y to the top of the new page
                }
                doc.text(line, margins.left, currentY);
                currentY += 12;
            }

            // Add some space before the next section
            currentY += 24;
            
            // Check if there's enough space for the table header, otherwise start on a new page
            if (currentY > pageHeight - margins.bottom - 50) {
                doc.addPage();
                currentY = margins.top;
            }

            // Annotations Table
            doc.setFont('times', 'bold');
            doc.text('Annotationsdetails:', margins.left, currentY);
            currentY += 20;

            const tableColumn = ['Inhalt', 'Typ', 'Bearbeitungszeit', 'Audioposition'];
            const tableRows = [];
            const annotations = markItems.getValues().filter(item => item.activated === 'ACTIVATED');
            const allItems = markItems.items;
            // Build table rows from annotation data
            annotations.forEach(item => {
                let displayLabel = item.label;
                // Clean up ITM label
                if (item.type === 'ITM' && /^<ITM\s+[^>]+>$/.test(displayLabel)) {
                    displayLabel = displayLabel.replace(/^<ITM\s+/, '').replace(/>$/, '');
                }
                // For BND, show neighboring words
                if (item.type === 'BND') {
                    const wordA = allItems[item.idx - 1]?.getLabel() || '';
                    const wordB = allItems[item.idx + 1]?.getLabel() || '';
                    displayLabel = `${wordA.replace(/<ITM\s+/, '').replace(/>$/, '')} | ${wordB.replace(/<ITM\s+/, '').replace(/>$/, '')}`;
                }
                tableRows.push([
                    displayLabel,
                    item.type,
                    formatTime(item.timestamps.editTime[0]) || 'n/a',
                    formatTime(item.timestamps.playbackTime[0]) || 'n/a'
                ]);
            });

            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: currentY,
                theme: 'grid',
                margin: { left: margins.left, right: margins.right },
                styles: { font: 'times', fontSize: 10, textColor: [0, 0, 0] },
                headStyles: { font: 'times', fontSize: 10, fontStyle: 'bold', fillColor: [220, 220, 220], textColor: [0, 0, 0] },
            });

            // Explanations after the table
            let finalY = doc.lastAutoTable.finalY + 24;
            doc.setFontSize(7);
            doc.setTextColor(128, 128, 128);
            const explanations = [
                '- \'Inhalt\': Das markierte Wort oder bei Grenzen (\'|\') die benachbarten Wörter.',
                '- \'ITM\': Ein einzelnes Wort oder Textelement, das auf seine Hervorhebung hin bewertet wird.',
                '- \'BND\': Eine prosodische Grenze (\'|\') zwischen Textelementen im Sprachfluss.',
                '- \'Bearbeitungszeit\': Zeit von der Initialisierung des Elements bis zur Markierung.',
                '- \'Audioposition\': Zeitpunkt im Audio bei der Markierung.',
            ];
            for (const explanation of explanations) {
                if (finalY > pageHeight - margins.bottom) {
                    doc.addPage();
                    finalY = margins.top;
                }
                doc.text(explanation, margins.left, finalY);
                finalY += 10;
            }

            // Add page numbers
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                doc.text(
                    'Seite ' + i + ' von ' + pageCount,
                    pageWidth / 2,
                    pageHeight - margins.bottom / 2,
                    { align: 'center' }
                );
            }

            //Filename
            const filename = audioFileName.replace(/\.[^/.]+$/, '');
            const timestamp = new Date().toISOString().slice(2,16).replace(/[-T:]/g, '');
            const pdfName = `${filename}_annotation_${timestamp}.pdf`;

            doc.save(pdfName);
        } finally {
            hideLoading();
        }
    }, 50);
} 