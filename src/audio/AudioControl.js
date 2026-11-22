// AudioControl.js
// Responsible for audio control

/**
 * Function to interpret keyboard events.
 */
function interpretKey(e) {
    'use strict';
    // Ensure event object is available
    if (!e) {
        e = window.event;
    }

    let value = '';
    let playTime = audioPlayer.currentTime;

    if (e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        let rewindTime = 0;
        if (e.shiftKey || e.altKey) {
            if (e.shiftKey) {
                rewindTime = 1.0;
                value = 'short_rewind';
            } else {
                rewindTime = 10.0;
                value = 'long_rewind';
            }
            // SHIFT or ALT + TAB: rewind
            if (playTime > rewindTime) {
                audioPlayer.currentTime = playTime - rewindTime;
            } else {
                audioPlayer.currentTime = 0;
            }
        } else {
            // TAB: toggle playback/pause
            if (audioPlayer.paused) {
                audioPlayer.play();
                value = 'play';
            } else {
                audioPlayer.pause();
                value = 'pause';
            }
        }
        document.getElementById('inputpanel').focus();
    }

    // Log keyboard actions
    addToLog('keypress', value);
} 