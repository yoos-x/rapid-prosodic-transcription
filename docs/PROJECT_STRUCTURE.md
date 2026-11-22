# Project Structure: Rapid Prosodic Transcription

```
RapidProsodicTranscription/
├── src/                        # Source code directory
│   ├── main.js                # Main program entry point
│   ├── core/                  # Core functionality modules
│   │   ├── MarkItems.js      # Core annotation item management
│   │   ├── AnnotationDisplay.js # Annotation display and rendering
│   │   └── LogManager.js     # Logging utility
│   │
│   ├── audio/                 # Audio-related functionality
│   │   ├── AudioControl.js   # Audio playback controls
│   │   └── AudioSyncScroll.js # Audio and transcript sync logic
│   │
│   ├── ui/                    # User interface modules
│   │   ├── UIInteraction.js  # UI controls and interactions
│   │   └── DragDropAudio.js  # Drag-and-drop functionality
│   │
│   └── export/               # Export functionality
│       └── ExportManager.js  # Data export management
│
├── public/                    # Public assets directory
│   ├── css/                  # Stylesheets
│   │   └── webtranscribe.css # Main stylesheet
│   │
│   └── icons/               # Icon assets
│       ├── webtranscribe_128.png # Main application logo
│       └── upload-icon.png  # Upload icon
│
├── docs/                    # Documentation
│   └── PROJECT_STRUCTURE.md # This file
│
├── index.html              # Main HTML entry point
│
└── __MACOSX/              # System folder (can be ignored)
```

## File/Directory Descriptions

### Source Code (`src/`)
- **main.js**: Main program entry point that handles initialization of all components and global variables.
- **core/**: Contains core functionality modules
  - **MarkItems.js**: Manages annotation items, including creation, modification, and deletion
  - **AnnotationDisplay.js**: Handles the display and rendering of annotation data
  - **LogManager.js**: Provides logging functionality for user actions and system events
- **audio/**: Contains audio-related functionality
  - **AudioControl.js**: Manages audio playback and keyboard controls
  - **AudioSyncScroll.js**: Synchronizes audio playback with transcript scrolling
- **ui/**: Contains user interface modules
  - **UIInteraction.js**: Manages UI controls like font size, help icons, and loading overlay
  - **DragDropAudio.js**: Handles drag-and-drop functionality for audio files
- **export/**: Contains export functionality
  - **ExportManager.js**: Manages exporting annotations to various formats (JSON, PDF)

### Public Assets (`public/`)
- **css/**: Contains stylesheets
  - **webtranscribe.css**: Main stylesheet for the application
- **icons/**: Contains all icon assets
  - **webtranscribe_128.png**: Main application logo
  - **upload-icon.png**: Icon for drag-and-drop upload functionality

### HTML
- **index.html**: Main HTML entry point for the application

### Documentation (`docs/`)
- **PROJECT_STRUCTURE.md**: This documentation file

## Dependencies
- jspdf: For PDF export functionality
- jspdf-autotable: For creating tables in PDF exports

## Browser Compatibility
- Modern browsers with HTML5 support
- JavaScript ES6+ support required
- Audio API support required for playback functionality

## Running the Application
To run the application:
1. Use a local web server (e.g., VS Code Live Server, Python's http.server, or Node's http-server)
2. Open `index.html` through the web server
3. Do not open the HTML file directly due to relative path dependencies 