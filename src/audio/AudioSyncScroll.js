// AudioSyncScroll.js
// Responsible for audio-text sync scrolling

let sortedActiveItemsWithTimestamps = [];
let currentlyHighlightedSpanId = null;
let animationFrameId = null; 
let lastFrameTime = 0; 
let tempAnchor = null; // Temporary anchor { timestamp, offsetTop }
let userInteracting = false;
let interactionTimeout = null;

/**
 * Function to clear the current highlight style.
 */
function clearCurrentHighlight() {
    if (currentlyHighlightedSpanId) {
        const prevElement = document.getElementById(currentlyHighlightedSpanId);
        if (prevElement) {
            prevElement.classList.remove('audio-synced-highlight');
        }
        currentlyHighlightedSpanId = null;
    }
}

/**
 * Function to animation loop for smooth sliding.
 */
function animationLoop(currentTime) {
    if (userInteracting || audioPairingProblem()) {
        animationFrameId = null;
        return;
    }
    const localAudioPlayer = window.audioPlayer;
    const inputPanel = document.getElementById('inputpanel');

    if (!localAudioPlayer || localAudioPlayer.paused || !inputPanel) {
        animationFrameId = null;
        return;
    }

    const smoothingFactor = 0.05;
    
    // scrolling logic
    const currentTimeMs = Math.floor(localAudioPlayer.currentTime * 1000);
    
    // Calculate prevItem and nextItem
    let prevItem = null, nextItem = null;
    for (const item of sortedActiveItemsWithTimestamps) {
        if (item.timestamp <= currentTimeMs) {
            prevItem = item;
        } else {
            nextItem = item;
            break;
        }
    }

    // Set prevAnchor and nextAnchor
    let prevAnchor;
    if (prevItem) {
        const element = document.getElementById(prevItem.spanId);
        prevAnchor = { ...prevItem, offsetTop: element ? element.offsetTop : 0, isVirtual: false };
    } else {
        prevAnchor = { timestamp: 0, offsetTop: 0, isVirtual: true };
    }
    let nextAnchor;
    if (nextItem) {
        const element = document.getElementById(nextItem.spanId);
        nextAnchor = { ...nextItem, offsetTop: element ? element.offsetTop : 0, isVirtual: false };
    } else {
        const maxScrollTop = inputPanel.scrollHeight - inputPanel.clientHeight;
        nextAnchor = { timestamp: localAudioPlayer.duration * 1000, offsetTop: maxScrollTop > 0 ? maxScrollTop : 0, isVirtual: true };
    }

    // tempAnchor only works before expireTimestamp
    if (tempAnchor) {
        if (currentTimeMs >= tempAnchor.expireTimestamp) {
            tempAnchor = null;
            animationFrameId = requestAnimationFrame(animationLoop);
            return;
        } else if (currentTimeMs < tempAnchor.expireTimestamp) {
            prevAnchor = { timestamp: tempAnchor.timestamp, offsetTop: tempAnchor.offsetTop, isVirtual: false, isTemp: true };
        }
    }

    // Calculate scrollTop
    let targetScrollTop;
    const DWELL_TIME_MS = 750; // Dwell at each timestamp
    const timeSincePrev = currentTimeMs - prevAnchor.timestamp;
    const segmentDuration = nextAnchor.timestamp - prevAnchor.timestamp;
    let sweetSpotOffset = inputPanel.clientHeight * 0.6;
    if ((prevAnchor.isVirtual && nextAnchor.isVirtual) || prevAnchor.isTemp) {
        sweetSpotOffset = 0;
    }

    let isDwelling = timeSincePrev <= DWELL_TIME_MS;

    if (isDwelling) {
        targetScrollTop = prevAnchor.offsetTop - sweetSpotOffset;
    } else {
        // Calculate the interpolated position between anchors
        let travelStartTime;
        if (prevAnchor.isVirtual || segmentDuration <= DWELL_TIME_MS) {
            travelStartTime = prevAnchor.timestamp;
        } else {
            travelStartTime = prevAnchor.timestamp + DWELL_TIME_MS;
        }
        
        const travelDuration = nextAnchor.timestamp - travelStartTime;
        const timeIntoTravel = currentTimeMs - travelStartTime;
        
        let progress;
        if (travelDuration > 0) {
            progress = Math.max(0, Math.min(1, timeIntoTravel / travelDuration));
        } else {
            progress = 1;
        }

        const segmentStartScrollTop = prevAnchor.offsetTop - sweetSpotOffset;
        const segmentEndScrollTop = nextAnchor.offsetTop - sweetSpotOffset;
        const segmentScrollDistance = segmentEndScrollTop - segmentStartScrollTop;

        targetScrollTop = segmentStartScrollTop + (progress * segmentScrollDistance);
    }

    targetScrollTop = Math.max(0, targetScrollTop);

    const error = targetScrollTop - inputPanel.scrollTop;
    let scrollIncrement = error * smoothingFactor;
    
    if (Math.abs(scrollIncrement) > 0.5) {
        inputPanel.scrollTop += scrollIncrement;
    }

    lastFrameTime = currentTime;
    animationFrameId = requestAnimationFrame(animationLoop);
}

/**
 * Function to start the animation loop.
 */
function startAnimationLoop() {
    if (!animationFrameId && window.audioPlayer && !window.audioPlayer.paused && !audioPairingProblem()) {
        lastFrameTime = performance.now();
        animationFrameId = requestAnimationFrame(animationLoop);
    }
}

/**
 * Function to update the sorted active items for scroll.
 */
function updateSortedActiveItemsForScroll() {
    clearCurrentHighlight();
    sortedActiveItemsWithTimestamps = [];
    if (!audioPairingProblem() && window.markItems && window.markItems.items) {
        window.markItems.items.forEach(item => {
            if (item.isActivated() && item.playbackTimestamps && item.playbackTimestamps.length > 0) {
                const timestamp = item.playbackTimestamps[item.playbackTimestamps.length - 1];
                if (typeof timestamp === 'number' && !isNaN(timestamp)) {
                    sortedActiveItemsWithTimestamps.push({
                        timestamp: timestamp,
                        spanId: item.getSpanId(),
                    });
                }
            }
        });
        sortedActiveItemsWithTimestamps.sort((a, b) => a.timestamp - b.timestamp);
    }
    const event = new Event('timeupdate');
    window.audioPlayer.dispatchEvent(event);
}

/**
 * Function to initialize the audio-text sync scrolling.
 */
function initializeAudioSyncScrolling() {
    const localAudioPlayer = window.audioPlayer;
    const inputPanel = document.getElementById('inputpanel'); 

    if (!localAudioPlayer || !inputPanel) {
        return;
    }

    // Event listeners for user interactions
    inputPanel.addEventListener('mousedown', function(e) {
        if (e.button !== 0) return;
        const rect = inputPanel.getBoundingClientRect();
        const verticalScrollbarWidth = inputPanel.offsetWidth - inputPanel.clientWidth;
        const horizontalScrollbarHeight = inputPanel.offsetHeight - inputPanel.clientHeight;
        const clickX = e.clientX;
        const clickY = e.clientY;
        const isClickOnVerticalScrollbar = (
            verticalScrollbarWidth > 0 &&
            clickX >= rect.right - verticalScrollbarWidth &&
            clickX <= rect.right &&
            clickY >= rect.top &&
            clickY <= rect.bottom - horizontalScrollbarHeight
        );
        const isClickOnHorizontalScrollbar = (
            horizontalScrollbarHeight > 0 &&
            clickY >= rect.bottom - horizontalScrollbarHeight &&
            clickY <= rect.bottom &&
            clickX >= rect.left &&
            clickX <= rect.right - verticalScrollbarWidth
        );
        if (isClickOnVerticalScrollbar || isClickOnHorizontalScrollbar) {
            // When dragging the scrollbar with the mouse, set tempAnchor after mouseup
            pauseAutoScroll();
            const onMouseUp = () => {
                setTempAnchor();
                resumeAutoScroll();
                document.removeEventListener('mouseup', onMouseUp);
            };
            document.addEventListener('mouseup', onMouseUp);
        }
    });
    
    // For wheel and keyboard, delay setting tempAnchor to capture the final stop position
    let wheelTimeout = null;
    inputPanel.addEventListener('wheel', function(e) {
        pauseAutoScroll();
        if (wheelTimeout) clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
            setTempAnchor();
            resumeAutoScroll();
        }, 300);
    });

    let keyTimeout = null;
    inputPanel.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            pauseAutoScroll();
            if (keyTimeout) clearTimeout(keyTimeout);
            keyTimeout = setTimeout(() => {
                setTempAnchor();
                resumeAutoScroll();
            }, 1200);
        }
    });

    // Set the highlight target
    localAudioPlayer.addEventListener('timeupdate', function() {
        if (localAudioPlayer.seeking) return;
        
        if (sortedActiveItemsWithTimestamps.length === 0) {
            clearCurrentHighlight();
            return;
        }

        const currentTimeMs = Math.floor(localAudioPlayer.currentTime * 1000);
        let currentTargetItem = null;
        for (let i = sortedActiveItemsWithTimestamps.length - 1; i >= 0; i--) {
            if (sortedActiveItemsWithTimestamps[i].timestamp <= currentTimeMs) {
                currentTargetItem = sortedActiveItemsWithTimestamps[i];
                break;
            }
        }
        
        let newHighlightId;
        if (currentTargetItem) {
            newHighlightId = currentTargetItem.spanId;
        } else {
            newHighlightId = null;
        }
        if (currentlyHighlightedSpanId !== newHighlightId) {
            clearCurrentHighlight();
            if (newHighlightId) {
                const elementToHighlight = document.getElementById(newHighlightId);
                if (elementToHighlight) {
                    elementToHighlight.classList.add('audio-synced-highlight');
                    currentlyHighlightedSpanId = newHighlightId;
                }
            }
        }
    });

    // Audio control
    localAudioPlayer.addEventListener('play', startAnimationLoop);
    localAudioPlayer.addEventListener('seeking', function() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    });
    localAudioPlayer.addEventListener('pause', function() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    });
    localAudioPlayer.addEventListener('ended', function() {
        clearCurrentHighlight();
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    });

    window.updateSortedActiveItemsForScroll = updateSortedActiveItemsForScroll;
}

/**
 * Function to set the temporary anchor.
 */
function setTempAnchor() {
    if (!window.audioPlayer) return;
    const inputPanel = document.getElementById('inputpanel');
    const currentTimeMs = Math.floor(window.audioPlayer.currentTime * 1000);

    // Find the next anchor
    let nextAnchorTimestamp = null;
    if (sortedActiveItemsWithTimestamps) {
        for (const item of sortedActiveItemsWithTimestamps) {
            if (item.timestamp > currentTimeMs) {
                nextAnchorTimestamp = item.timestamp;
                break;
            }
        }
    }
    // If there is no next anchor, set to the end of the audio
    if (nextAnchorTimestamp === null && window.audioPlayer.duration) {
        nextAnchorTimestamp = window.audioPlayer.duration * 1000;
    }

    tempAnchor = {
        timestamp: currentTimeMs,
        offsetTop: inputPanel.scrollTop,
        expireTimestamp: nextAnchorTimestamp
    };
}

function pauseAutoScroll() {
    userInteracting = true;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

function resumeAutoScroll() {
    userInteracting = false;
    startAnimationLoop();
}
