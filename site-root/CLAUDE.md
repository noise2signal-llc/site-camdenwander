# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static HTML5 portfolio site for artist Camden Wander, featuring HLS (HTTP Live Streaming) audio/video playback. No build tools, bundlers, or package managers - pure vanilla JavaScript with HLS.js loaded from CDN.

## Development Server

```bash
# Start HTTP server (from site-root directory)
cd /workspace/site-root
python3 -m http.server 8080

# Or use the container (requires Podman)
./launch-dev-container.sh
```

Access at: http://localhost:8080

## Architecture

```
site-root/
├── index.html              # Entry point - loads HLS.js and camden-wander.js
├── css/camden-wander.css   # Styles
├── js/camden-wander.js     # HLS player, track lists, controls
└── hls/
    ├── production/         # Produced tracks
    │   └── {track}/master.m3u8
    ├── mixes/              # DJ mixes
    │   └── {mix}/master.m3u8
    └── live-performances/  # Live performance recordings
        └── {performance}/master.m3u8
```

**Key Flow:** `index.html` loads HLS.js from CDN, then `camden-wander.js` builds the track lists from arrays and initializes the HLS player with play/pause controls and seekable timeline.

## External Dependencies

- HLS.js (CDN): `//cdn.jsdelivr.net/npm/hls.js` - adaptive bitrate streaming library

## No Build/Test/Lint

This is a static site with no build step, test framework, or linter configured. Changes to HTML/CSS/JS are immediately visible when the server is running.
