// DragDropAudio.js
// Responsible for handling audio file upload

/**
 * Function to add event listeners after window loads.
 */
window.addEventListener('load', function() {
    const dropzone = document.querySelector('#dropzone');
    dropzone.addEventListener('drop', handleDrop, false);
    dropzone.addEventListener('dragover', handleDragOver, false);
    dropzone.addEventListener('dragenter', handleDragEnter, false);
});

/**
 * Function to prevent default dragover behavior.
 */
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
}

/**
 * Function to prevent default dragenter behavior.
 */
function handleDragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
}

/**
 * Function to handle file drop event.
 */
function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    // Visual feedback for drop
    event.target.style.border = "3px dotted gray";

    if (event.dataTransfer.files) {
        const files = event.dataTransfer.files;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Handle text file upload
            if (file.type.startsWith("text/")) {
                document.getElementById("textname").textContent = "Geladene Textdatei: " + file.name;
                window.textFileName = file.name;
                window.jsonFileName = null;

                const textReader = new FileReader();
                textReader.readAsText(file);
                textReader.onload = (e) => {
                    window.rawTranscript = e.target.result.trim();
                    showAnnotation({ transcript: e.target.result });
                };

            // Handle audio file upload
            } else if (file.type.startsWith("audio/")) {
                document.getElementById("audioname").textContent = "Geladene Audiodatei: " + file.name;
                window.audioFileName = file.name;

                const playerElement = document.querySelector("#audioplayer");
                if ('srcObject' in playerElement) {
                    try {
                        playerElement.srcObject = file;
                    } catch (error) {
                        if (error.name != "TypeError") {
                            throw error;
                        }
                        playerElement.src = URL.createObjectURL(file);
                    }
                } else {
                    playerElement.src = URL.createObjectURL(file);
                }

                document.getElementById("audiocontrol").style.display = "block";
                document.getElementById("initial-placeholder").style.display = "none";

            // Handle JSON file upload
            } else if (file.type === "application/json" || file.name.endsWith(".json")) {
                document.getElementById("textname").textContent = "Geladene JSON-Datei: " + file.name;
                window.jsonFileName = file.name;
                window.textFileName = null;
            
                const jsonReader = new FileReader();
                jsonReader.readAsText(file);
                
                jsonReader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        window.rawTranscript = data.rawTranscript.trim();
                        if (!window.audioFileName) {
                            window.audioFileName = data.audiofilename;
                        }
                        // Display transcript and restore activated tokens
                        showAnnotation(data);
                    } catch (err) {
                        addToLog("error", "JSON load failed: " + err.message);
                    }
                };

            } else {
                addToLog('Unexpected file type: ' + file.type + '. Only text or audio files are allowed.');
            }
        }
    }

    // Remove visual feedback after drop
    event.target.style.border = "";
}
