// UIInteraction.js
// Combines font size control, help icon interaction, and loading overlay logic

// --- Font Size Control ---
// Responsible for controlling the font size of the input panel

const minFontSize = 10;
const maxFontSize = 30;

const inputPanel = document.getElementById('inputpanel');
const decreaseFontButton = document.getElementById('decrease-font');
const increaseFontButton = document.getElementById('increase-font');

/**
 * Function to update the font size of the input panel
 */
function updateFontSize() {
  if (inputPanel) {
    showLoading();
    setTimeout(function() {
      try {
        inputPanel.style.fontSize = currentFontSize + 'px';
        // If markItems exist, regenerate their elements in the input panel
        if (markItems && markItems.items && markItems.items.length > 0) {
          markItems.generateElement(inputPanel); 
        }
      } finally {
        hideLoading();
      }
    }, 10);
  }
}

if (decreaseFontButton && increaseFontButton && inputPanel) {
  // Decreases the font size by 1px when the decrease button is clicked
  decreaseFontButton.addEventListener('click', function() {
    if (currentFontSize > minFontSize) {
      currentFontSize -= 1;
      updateFontSize();
      addToLog('fontsize_change', 'decrease_to_' + currentFontSize + 'px');
    }
  });

  // Increases the font size by 1px when the increase button is clicked
  increaseFontButton.addEventListener('click', function() {
    if (currentFontSize < maxFontSize) {
      currentFontSize += 1;
      updateFontSize();
      addToLog('fontsize_change', 'increase_to_' + currentFontSize + 'px');
    }
  });
}

// --- Icon Interaction ---
// Handles interactions with help icons

document.addEventListener('DOMContentLoaded', function() {
  /**
   * Function to setup help icon interaction
   */
  function setupHelpInteraction(icon, text) {
    const helpIcon = document.getElementById(icon);
    const tipText = document.getElementById(text);

    if (helpIcon && tipText) {
      // Toggle tooltip visibility on icon click
      helpIcon.addEventListener('click', function() {
        // Toggle tooltip visibility
        if (tipText.style.display === 'none' || tipText.style.display === '') {
          tipText.style.display = 'block';
        } else {
          tipText.style.display = 'none';
        }
      });

      // Hide tooltip if clicking outside
      document.addEventListener('click', function(event) {
        if (!helpIcon.contains(event.target) && !tipText.contains(event.target)) {
          tipText.style.display = 'none';
        }
      });
    }
  }

  setupHelpInteraction('audiohelpicon', 'audiotiptext');
  setupHelpInteraction('texthelpicon', 'texttiptext');
});

// --- Loading Overlay ---
// Shows and hides the loading overlay
function showLoading() {
  document.getElementById('loading-overlay').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loading-overlay').style.display = 'none';
} 