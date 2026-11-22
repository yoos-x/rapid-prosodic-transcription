# Rapid Prosodic Transcription

A browser-based tool for manual prosodic annotation, developed as part of my bachelor's thesis at LMU Munich.

## Overview

This application supports Rapid Prosody Transcription (RPT), allowing listeners to mark perceived prominence and prosodic boundaries in a written transcript while listening to the corresponding recording.
The implementation focuses on the annotation interface, audio playback, annotation persistence, and audio-guided scrolling.
It does not perform automatic speech recognition.

## Purpose

Prosody research relies on annotations that describe how listeners perceive the structure of speech. Traditional annotation methods often require specialist training and substantial annotation time.
Rapid Prosody Transcription offers a perception-based approach: listeners, including those without specialist training in phonetics or phonology, mark words they perceive as prominent and locations where they perceive prosodic boundaries, based on their immediate auditory impressions.

## Features

- Drag-and-drop import of audio and text files
- Clickable word and boundary annotations
- Keyboard shortcuts for audio playback and rewinding
- Adjustable transcript font size
- Contextual help and loading indicators
- Recording of annotation timestamps and playback positions
- Audio-guided highlighting and scrolling based on annotation timestamps
- JSON export and annotation re-import
- PDF annotation reports
- Interaction logging

## Technologies

- JavaScript
- HTML and CSS
- Browser FileReader, Blob, and media APIs
- jsPDF and jsPDF-AutoTable

## Requirements

- A modern desktop browser
- A playable audio file and its corresponding text transcript
- An internet connection to load the externally hosted PDF libraries

The interface is currently primarily in German.

## Getting Started

1. Clone or download this repository.
2. Keep the project folders in their existing structure.
3. Open `index.html` in a desktop browser.

The database component is not included in this public repository.
This version provided here runs independently in the browser and upports saving and restoring annotations through local JSON files.

## Annotation Workflow

### 1. Import Audio and Text

Drag an audio file and its corresponding transcript into the upload area.

### 2. Listen and Annotate

- Click a word to toggle its prominence annotation.
- Click a boundary marker (`|`) to toggle a prosodic boundary.
- Click an annotated element again to remove its annotation.

### 3. Control Playback

| Shortcut | Action |
| --- | --- |
| Tab | Play or pause |
| Shift + Tab | Rewind 1 second |
| Alt + Tab | Rewind 10 seconds |

Some shortcuts may conflict with browser or operating-system controls.

Use the font-size buttons to adjust the transcript display.

### 4. Follow the Audio

The tool uses playback timestamps recorded during annotation
as anchors for highlighting and scrolling.

Scrolling combines anchor-based interpolation, dwell time,
and smoothing. Manual scrolling temporarily interrupts automatic
scrolling.

Highlighting follows timestamped annotations; it is not
word-level forced alignment.

### 5. Export Annotations

- **JSON:** Saves annotation states, timestamps, transcript information,
  audio filename, and logs.
- **PDF:** Produces a readable report with the transcript and
  annotation details.

### 6. Reopen Annotations

Import a previously exported JSON file to restore the annotation
states, and load the corresponding audio recording separately.

The JSON file does not contain the audio itself.
