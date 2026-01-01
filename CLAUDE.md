# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Container Environment

Claude Code runs inside a container. The /workspace/ directory is the git repository root, mounted from the host. Git operations (commit, push, pull, branch management) are performed by the user on the container host, not by Claude. Do not execute git commands; file changes made in /workspace/ will be visible to the host user for version control.

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
├── index.html               # Entry point
├── css/camden-wander.css    # Styles
├── js/
│   ├── camden-wander.js     # HLS player, track lists, audio analysis
│   └── webgl-background.js  # Three.js animated background
└── hls/
    ├── production/         # Produced tracks
    │   └── {track}/master.m3u8
    ├── mixes/              # DJ mixes
    │   └── {mix}/master.m3u8
    └── live-performances/  # Live performance recordings
        └── {performance}/master.m3u8
```

**Key Flow:** `index.html` loads HLS.js and Three.js from CDN. `webgl-background.js` renders descending artwork frames with bass-synced rotation. `camden-wander.js` builds track lists and handles HLS playback with Web Audio API analysis for the animation.

## Transcoding Workflow

Audio files are transcoded to HLS format using a containerized ffmpeg workflow.

```
transcode/
├── Dockerfile              # Alpine + ffmpeg container
├── launch-transcode.sh     # Container orchestration (--force-rebuild to recreate)
├── generate-hls.sh         # Transcoding script (runs inside container)
└── staged/
    ├── production/         # Drop production track WAVs here
    ├── live-performances/  # Drop live recording WAVs here
    └── mixes/              # Drop DJ mix WAVs here
```

### Usage

```bash
# Place source files in appropriate staged subdirectory, then:
./transcode/launch-transcode.sh

# Force rebuild container if needed
./transcode/launch-transcode.sh --force-rebuild
```

Run from anywhere within the git repo.

### Track Naming Convention

Source files should use **kebab-case** naming (lowercase words separated by hyphens):

```
creeping-insolence.wav      -> "Creeping Insolence"
rude-introduction.wav       -> "Rude Introduction"
my-new-track.wav            -> "My New Track"
```

The folder name becomes the track identifier and is transformed to Title Case for display in the UI.

### Output

Each file is transcoded to 3 bitrate tiers (64k, 128k, 192k AAC) with adaptive bitrate master playlist:

```
site-root/hls/{category}/{track-name}/
├── master.m3u8      # Adaptive bitrate playlist
├── 64k/stream.m3u8  # Low bandwidth
├── 128k/stream.m3u8 # Medium bandwidth
└── 192k/stream.m3u8 # High bandwidth
```

HLS content is organized by category:

```
site-root/hls/
  production/           # Produced tracks
    {track}/
      master.m3u8
      64k/ 128k/ 192k/
  live-performances/    # Live recordings
    {performance}/
      master.m3u8
      64k/ 128k/ 192k/
  mixes/                # DJ mixes
    {mix}/
      master.m3u8
      64k/ 128k/ 192k/
```

### Adding New Tracks

1. Name source file in kebab-case: `my-track-name.wav`
2. Place in appropriate `transcode/staged/{category}/` subdirectory
3. Run `./transcode/launch-transcode.sh`
4. Add folder name to corresponding array in `site-root/js/camden-wander.js`:
   - `producedTracks` for production/
   - `livePerformances` for live-performances/
   - `djMixes` for mixes/

## Metadata Embedding

Containerized metadata embedding tools for site media. Each tool targets a specific media type with appropriate metadata standards.

```
md-embed/
├── image_metadata/                 # Image EXIF/IPTC/XMP embedding
│   ├── Dockerfile                  # Alpine + exiftool + jq
│   ├── launch-image-metadata-container.sh
│   └── embed-image-metadata.sh
└── hls_metadata/                   # HLS timed ID3 metadata
    ├── Dockerfile                  # Bento4 build (gcc:13 base)
    └── launch-hls-metadata-container.sh
```

### Image Metadata

Embeds EXIF/IPTC/XMP metadata into artwork images using exiftool.

**Usage:**
```bash
./md-embed/image_metadata/launch-image-metadata-container.sh

# Force rebuild if needed
./md-embed/image_metadata/launch-image-metadata-container.sh --force-rebuild
```

**Manifest:** `site-root/img/images.json`
```json
{
  "artist": "Artist Name",
  "current_name": "Legal Name (optional)",
  "images": [
    {
      "file": "image.jpg",
      "title": "Title",
      "date": "YYYY-MM-DD",
      "medium": "Medium (optional)",
      "description": "Description (optional)"
    }
  ]
}
```

Supported date formats: YYYY-MM-DD, YYYY-MM, YYYY

Tags artwork with:
- EXIF: DateTimeOriginal, ImageDescription
- IPTC: By-line, ObjectName, DateCreated
- XMP: Creator, Title, Date, Rights, Medium

### HLS Metadata

Injects timed ID3 metadata into HLS MPEG-TS segments using Bento4. Used for DJ mix track attribution where artist/title/Discogs links are embedded at specific timestamps within segments containing copyrighted material.

**Usage:**
```bash
# Create required directories
mkdir -p md-embed/hls_metadata/metadata
mkdir -p md-embed/hls_metadata/segments

# Place metadata JSON in metadata/
# Place source HLS segments in segments/

# Launch container (builds on first run)
./md-embed/hls_metadata/launch-hls-metadata-container.sh

# Force rebuild if needed
./md-embed/hls_metadata/launch-hls-metadata-container.sh --force-rebuild
```

Container mounts:
- /work/metadata (read-only) - Metadata JSON files
- /work/segments (read-only) - Source HLS segments
- /work/output (read-write) - Output directory

Override directories via environment variables: METADATA_DIR, SEGMENTS_DIR, OUTPUT_DIR

**Bento4 Tools** (available in container at /usr/local/bin/):
- mp42hls - Convert MP4 to HLS with timed metadata
- mp4info - Display MP4/segment information
- mp4dump - Dump container structure

**Metadata JSON Format:**
```json
{
  "version": 1,
  "metadata": [
    {
      "time": 0.0,
      "duration": 330.0,
      "data": {
        "type": "id3",
        "frames": [
          {"id": "TIT2", "value": "Track Title"},
          {"id": "TPE1", "value": "Artist Name"},
          {"id": "TXXX", "description": "DISCOGS_URL", "value": "https://www.discogs.com/release/12345"}
        ]
      }
    },
    {
      "time": 330.0,
      "duration": 45.0,
      "data": {
        "type": "id3",
        "frames": [
          {"id": "TIT2", "value": "Track A / Track B"},
          {"id": "TPE1", "value": "Artist A / Artist B"},
          {"id": "TXXX", "description": "BLEND", "value": "true"}
        ]
      }
    }
  ]
}
```

Fields:
- time: Start time in seconds
- duration: Metadata validity in seconds
- TIT2: Track title (ID3 standard)
- TPE1: Artist (ID3 standard)
- TXXX: Custom frame (description + value)

**ID3 Frame Reference:**

| Frame | Description |
|-------|-------------|
| TIT2  | Title       |
| TPE1  | Artist      |
| TALB  | Album       |
| TDRC  | Year        |
| TCON  | Genre       |
| TXXX  | Custom text |

**Client-Side Playback:**

hls.js exposes ID3 metadata via FRAG_PARSING_METADATA event:

```javascript
hls.on(Hls.Events.FRAG_PARSING_METADATA, (event, data) => {
  data.samples.forEach(sample => {
    sample.data.forEach(frame => {
      if (frame.key === 'TIT2') console.log('Title:', frame.info);
      if (frame.key === 'TPE1') console.log('Artist:', frame.info);
      if (frame.key === 'TXXX') {
        console.log(frame.description + ':', frame.info);
      }
    });
  });
});
```

**License:** Bento4 is GPL v2. Container is for private development use only (not distributed).

### Adding New Metadata Tools

Future metadata embedding mechanisms should follow this pattern:
1. Create subdirectory: `md-embed/{media_type}_metadata/`
2. Include: `Dockerfile`, launcher script, processing script
3. Document usage in this file

## Publishing

Deploys site-root to Linode Object Storage via s3cmd.

```
publish/
├── Dockerfile                  # Debian + s3cmd, developer user
├── bucket-policy.json          # Public read policy for bucket
├── deploy.sh                   # s3cmd sync with exclusions
└── launch-deploy-container.sh  # Mounts ~/.s3cfg
```

```bash
./publish/launch-deploy-container.sh
```

## External Dependencies

- HLS.js (CDN): `//cdn.jsdelivr.net/npm/hls.js` - adaptive bitrate streaming
- Three.js (CDN): `//cdn.jsdelivr.net/npm/three@0.160.0` - WebGL 3D graphics
- Google Fonts: Orbitron (titles), Rubik (body text)

## Color Scheme

- **Teal** `#008080` - Primary text, borders
- **Purple** `#9400D3` - Accent shadows, active states
- **Gold** `#FFD700` / `#CC9900` - Hover states, timeline
- **Dark background** `#0F0D08`
- **Copper frames** `#B87333` - WebGL picture frames

## WebGL Animation

- Descending artwork with copper beveled frames
- Wide spotlight illumination from camera position
- Bass-synced Y-axis rotation (bins 4-6), 1 rotation/sec default
- Rule of thirds: rotate in top/bottom thirds, pause facing camera in middle

## No Build/Test/Lint

This is a static site with no build step, test framework, or linter configured. Changes to HTML/CSS/JS are immediately visible when the server is running.

## Code Style

- Minimal comments; code should be self-documenting
- Comment only for intent or readable explanation of abstract operations (regex, jq filters)
- Shell scripts output tool stdout only; no echo instrumentation unless tool provides no output (e.g., sed)
