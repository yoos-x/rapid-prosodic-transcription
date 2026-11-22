// Global variable definitions
const rewindTime = 1.0;
let log = [];
let currentFontSize = 16;

// Initialization function
function initialize() {
    // Get audio player element
    const audioPlayer = document.getElementById('audioplayer');
    window.audioPlayer = audioPlayer;
    
    // Initialize mark items
    markItems = new MarkItems();
    
    // Initialize audio sync scrolling
    initializeAudioSyncScrolling();
}

// Execute initialization after DOM content is loaded
document.addEventListener('DOMContentLoaded', initialize); 