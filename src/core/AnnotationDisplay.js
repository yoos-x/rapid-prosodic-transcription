// AnnotationDisplay.js
// Responsible for displaying and rendering annotation data

/**
 * Function to display and render annotation data.
 */
function showAnnotation(data) {
    showLoading();
    setTimeout(() => {
        try {
            // Hide placeholder and show panels
            document.getElementById('initial-placeholder').style.display = 'none';
            document.getElementById('inputpanel').style.display = 'block';
            document.getElementById('commandpanel').style.display = 'block';
            document.getElementById('audioplayer').style.display = '';
            document.getElementById('fontsizecontrol').style.display = 'block';
            document.getElementById('inputpanel').innerHTML = '';

            // Set font size
            const localInputPanel = document.getElementById('inputpanel');
            if (localInputPanel) { 
                localInputPanel.style.fontSize = currentFontSize + 'px';
            }

            // Initialize markItems for annotation rendering
            markItems = new MarkItems();

            // Render items from transcript_json with annotation
            if (data.transcript_json && Array.isArray(data.transcript_json)) {
                markItems.items = [];
                for (let i = 0; i < data.transcript_json.length; i++) {
                    const savedItem = data.transcript_json[i];
                    const item = new Item();
                    item.init(savedItem.idx, savedItem.type, savedItem.label);
                    if (savedItem.activated === "ACTIVATED"){
                        item.activate();
                    }
                    if (savedItem.timestamps) {
                        item.timestamps = savedItem.timestamps.editTime || [];
                        item.playbackTimestamps = savedItem.timestamps.playbackTime || [];
                    }
                    markItems.items.push(item);
                }
                markItems.generateElement(document.getElementById("inputpanel"));
                
            // Render items with plain text
            } else if (data.transcript && typeof data.transcript === "string") {
                let text = "";
                if (data.transcript.substr(0,2) == '[{') {
                    const segmentlist = JSON.parse(data.transcript);
                    for (let i = 0; i < segmentlist.length; i++) {
                        text += segmentlist[i].text + " ";
                    }
                } else {
                    text = data.transcript || "";
                }
                text = text.trim();
                markItems.init("BOTH", text)
                markItems.generateElement(document.getElementById("inputpanel"));
            } else {
                addToLog("error", "showAnnotation: No valid transcript_json or transcript found.");
            }

            // Update scroll and keyboard event
            setAnnotationAudioFileName(data.audiofilename);
            document.onkeydown = interpretKey;
        } finally {
            hideLoading();
        }
    }, 10);
} 