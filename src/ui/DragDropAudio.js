// DragDropAudio.js
// Responsible for handling audio file upload

let annotationAudioFileName = null;
let loadedAudioFile = null;

function audioPairingProblem() {
    const file = loadedAudioFile;
    const player = window.audioPlayer;
    if (!file) {
        return annotationAudioFileName
            ? `Bitte laden Sie die zugehörige Audiodatei „${annotationAudioFileName}“.`
            : 'Bitte laden Sie zuerst eine Audiodatei.';
    }
    if (annotationAudioFileName && file.name !== annotationAudioFileName) {
        return `Für diese Annotationen wird „${annotationAudioFileName}“ benötigt. Ausgewählt ist „${file.name}“.`;
    }
    if (player.error) {
        return `Die Audiodatei „${file.name}“ konnte nicht geladen werden.`;
    }
    if (player.currentSrc !== file.url || player.readyState < HTMLMediaElement.HAVE_METADATA) {
        return `Die Audiodatei „${file.name}“ wird geladen …`;
    }
    return '';
}

function refreshAudioPairing() {
    document.getElementById('audio-pairing-status').textContent =
        loadedAudioFile || annotationAudioFileName ? audioPairingProblem() : '';
    window.updateSortedActiveItemsForScroll();
    startAnimationLoop();
}

function setAnnotationAudioFileName(fileName) {
    annotationAudioFileName = fileName || null;
    refreshAudioPairing();
}

function requirePairedAudio() {
    const problem = audioPairingProblem();
    if (problem) {
        alert(problem);
        return null;
    }
    return loadedAudioFile.name;
}

/**
 * Function to add event listeners after window loads.
 */
window.addEventListener('load', function() {
    const dropzone = document.querySelector('#dropzone');
    dropzone.addEventListener('drop', handleDrop, false);
    dropzone.addEventListener('dragover', handleDragOver, false);
    dropzone.addEventListener('dragenter', handleDragEnter, false);

    const player = window.audioPlayer;
    player.addEventListener('loadedmetadata', refreshAudioPairing);
    player.addEventListener('error', refreshAudioPairing);
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
                const previousAudio = loadedAudioFile;
                loadedAudioFile = { name: file.name, url: URL.createObjectURL(file) };
                window.audioPlayer.src = loadedAudioFile.url;
                if (previousAudio) URL.revokeObjectURL(previousAudio.url);
                document.getElementById("audioname").textContent = "Ausgewählte Audiodatei: " + file.name;
                refreshAudioPairing();

                document.getElementById("audiocontrol").style.display = "block";
                document.getElementById('initial-placeholder').hidden = true;

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
                        if (typeof data.audiofilename !== 'string' || !data.audiofilename.trim()) {
                            alert('Die JSON-Datei enthält keinen Namen der zugehörigen Audiodatei.');
                            return;
                        }
                        window.rawTranscript = data.rawTranscript.trim();
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
