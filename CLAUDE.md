# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Container Environment

Claude Code runs inside a container. The /workspace/ directory is a host directory mounted into the container. Git operations (commit, push, pull, branch management) are performed by the user on the container host, not by Claude. Do not execute git commands; file changes made in /workspace/ will be visible to the host user for version control.

### Claude Code Container Launcher

A generalized Claude Code container launcher is available at the repository root:

```bash
# Launch Claude Code container (prompts for workspace directory)
./launch-claude-code-container.sh

# Force rebuild if needed
./launch-claude-code-container.sh --force-rebuild
```

The launcher:
- Prompts for a host directory to mount as `/workspace` (supports tab-completion)
- Generates a unique container name based on the workspace path
- Allows multiple container instances for different projects simultaneously
- Container name format: `claude-code-{dirname}-{hash}`

This allows working on multiple projects in separate container sessions.

## Container Standards

**Portfolio Site Containers:**
- **Development Server:** Apache httpd (Alpine-based, serves site-root on port 8080)
- **Deployment:** Debian slim with s3cmd (publishes to Linode Object Storage)

**Claude Code Development:**
- **Claude Code Container:** Generalized development environment (can work on any project)
- **Multiple Instances:** Different projects can have separate container sessions simultaneously

**Out of Scope (moved to `/workspace/scope-creep/`):**
Containerized workflows for transcoding and metadata embedding have been moved to `/workspace/scope-creep/` as they are out of scope for this focused live performance portfolio. Each subdirectory in `/workspace/scope-creep/` contains its own CLAUDE.md with usage examples following project-wide container standards (Podman, uid 1000, minimal base images, launch scripts with `--force-rebuild` support).

## Project Overview

Static HTML5 portfolio site for electronic music artist Camden Wander, featuring live performances of original compositions created with Eurorack modular synthesizers and other hardware instruments. HLS (HTTP Live Streaming) audio playback with no build tools, bundlers, or package managers - pure vanilla JavaScript with HLS.js loaded from CDN.

**Site Purpose:** Demonstrate ability to provide live performances of electronic music with hardware synthesizers as entertainment.

## Development Server

The portfolio site uses an Apache httpd container for local development:

```bash
# Start development server
./site-root/dev-server/launch-server.sh

# Force rebuild container if needed
./site-root/dev-server/launch-server.sh --force-rebuild

# Stop server
podman stop portfolio-site-dev-server

# Remove container
podman rm portfolio-site-dev-server
```

Access at: http://localhost:8080

The server mounts `site-root/` to `/srv/www/html` (read-only) and serves on port 8080.

## Architecture

```
site-root/
├── index.html               # Entry point
├── nope.html                # 404 error page (s3cmd ws-create)
├── tracks.json              # Track metadata (JSON source of truth)
├── css/camden-wander.css    # Styles
├── js/
│   ├── background.js        # 1-bit GIF background with trigonometric color cycling
│   └── camden-wander.js     # HLS player, track lists from JSON, audio analysis, info panels
├── img/                     # Artwork images (1-bit GIF bitmaps)
└── hls/
    ├── {movement}/master.m3u8          # Work in progress tracks (~5min movements)
    └── live-performances/{perf}/master.m3u8  # Live performance recordings
```

**Key Flow:** `index.html` loads HLS.js from CDN and `tracks.json`. `background.js` renders animated 1-bit GIF background. `camden-wander.js` fetches track metadata from JSON, builds interactive track lists with info panels, and handles HLS playback with Web Audio API analysis.

**Data-Driven:** All track metadata is defined in `tracks.json`. The JavaScript dynamically generates track lists, info panels, and handles playback based on this JSON data source.

**Cache Busting:** `index.html` contains `CACHE_VERSION` placeholders in CSS and JS URLs (`?v=CACHE_VERSION`). The deployment script replaces these with Unix timestamps to force browser cache invalidation.

**404 Page:** `nope.html` serves as the 404 error page, configured via `s3cmd ws-create` when setting up the S3 bucket for static website hosting.

## Track Management

### Track Metadata (tracks.json)

All track information is stored in `/workspace/site-root/tracks.json`:

```json
{
  "work_in_progress": [
    {
      "id": "track-name",
      "title": "Track Name",
      "hls_path": "hls/track-name/master.m3u8",
      "info": {
        "date_recorded": "YYYY-MM-DD",
        "duration": "M:SS",
        "style": "genre, tags"
      }
    }
  ],
  "live_performances": [
    {
      "id": "performance-name",
      "title": "Performance Name",
      "hls_path": "hls/live-performances/performance-name/master.m3u8",
      "info": {
        "date_recorded": "YYYY-MM-DD",
        "venue": "Venue Name, City ST",
        "duration": "MM:SS",
        "style": "genre, tags"
      }
    }
  ]
}
```

### Adding New Tracks

1. Transcode audio to HLS format (see `/workspace/scope-creep/hls-audio-transcode/CLAUDE.md`)
2. Place HLS output in `site-root/hls/{track-id}/` or `site-root/hls/live-performances/{track-id}/`
3. Add track metadata to `tracks.json` in the appropriate array
4. JavaScript will automatically load and display the new track

## Publishing

Deploys site-root to Linode Object Storage via s3cmd.

```
publish/
├── Containerfile                  # Debian + ca-certificates + s3cmd, developer user
├── bucket-policy.json          # Public read policy for bucket
├── deploy.sh                   # s3cmd sync with exclusions
└── launch-deploy-container.sh  # Mounts ~/.s3cfg
```

**Deployment:**
```bash
./publish/launch-deploy-container.sh
```

The deployment script (`deploy.sh`) performs multiple operations:
1. Generates cache-busting version (Unix timestamp)
2. Injects version into `index.html` (replaces `CACHE_VERSION` placeholder)
3. Applies `bucket-policy.json` to grant public read access to all objects
4. Syncs files by type with explicit MIME types:
   - `*.css` → `text/css`
   - `*.js` → `application/javascript`
   - `*.html` → `text/html`
   - `*.json` → `application/json`
   - `*.m3u8` → `application/vnd.apple.mpegurl` (HLS playlists)
   - `*.ts` → `video/mp2t` (HLS segments)
   - Other files → auto-detected via `--guess-mime-type`
5. Restores `CACHE_VERSION` placeholder in `index.html` (keeps git repo clean)
6. All syncs use `--delete-removed` to remove files from S3 that were deleted locally
7. Excludes `*.md` markdown files from deployment

**Cache Busting:** CSS and JS files are loaded with `?v=CACHE_VERSION` query strings in `index.html`. During deployment, the placeholder is replaced with the current Unix timestamp, forcing browsers to reload updated assets. The placeholder is restored after deployment to avoid git repository changes.

**Bucket Policy:** The `bucket-policy.json` defines a public read policy allowing anonymous access to all objects in the bucket (required for static website hosting).

**Initial Setup:**
The S3 bucket is configured for static website hosting using `s3cmd ws-create`:
```bash
s3cmd ws-create --ws-index=index.html --ws-error=nope.html s3://camden-wander/
```

## External Dependencies

- HLS.js (CDN): `//cdn.jsdelivr.net/npm/hls.js` - adaptive bitrate streaming
- Google Fonts: Orbitron (titles, section headers, player controls), Rubik (track titles, info panels, body text)

## Color Scheme

- **Dark Teal Background** `#1A4C4C` - Page background
- **Cyan/Teal** `#00D9D9` / `#00CCCC` - Title bar, section headers
- **Purple** `#8400C3` - Track items, timeline played, subtitle
- **Orange/Coral** `#FF6B4A` - Borders, active track accents, play button (playing state)
- **Cream/Beige** `#F5E6D3` - Info panels, timeline background
- **Yellow** `#FFFF00` - Hover states, active track borders
- **Light Gray** `#E6E6E6` - Track text, timeline played text

## UI Design

### Title Bar

Centered trapezoid with cyan/teal gradient background and orange border. Orbitron font, dark teal text.

### Subtitle

Purple trapezoid bar with light gray text. Rubik font. Placeholder for artist statement.

### Track Lists

Two sections ("WORK IN PROGRESS" and "LIVE PERFORMANCES") flexed horizontally on wide screens, stacked vertically on narrow screens (≤1080px).

**Section Headers:**
- Centered trapezoid SVG
- Cyan/teal background with orange border
- Dark teal text, Orbitron font, 24px bold
- Each section has centered header above track listing

**Track Items:**
- Purple background trapezoid with light gray border
- Left-aligned with 4px margin from container edge
- Info icon ("i") prepended - toggles info panel
- Play/Pause icon prepended - controls playback, syncs with master player
- Track title in Rubik bold 16px
- Hover: Yellow border
- Active: Yellow border, orange shadow, orange accent trapezoids on sides

**Active Track Indicators:**
- Orange/coral triangular accents on left and right sides of track trapezoid
- Yellow border glow
- Play icon becomes pause icon
- Synchronized with master play/pause button

### Info Panels

Toggleable dropdown panels below each track:

- Cream/beige background trapezoid with orange border
- Shows: date recorded, venue (for live performances), duration, style tags
- Close icon ("×") in top-right corner
- Rubik medium font, dark teal text
- Clicking info icon or close icon toggles visibility
- Other tracks shift down when info panel opens

### Play/Pause Button

SVG-based trapezoid button:

- **Default:** Purple fill, orange stroke, light gray play icon
- **Playing:** Orange fill, yellow stroke, dark teal pause icon
- **Hover:** Flashing animation
- **Disabled:** 50% opacity
- Orbitron font, 24px

### Timeline

Progress bar with trapezoid clip-path:

- **Background:** Cream/beige (#F5E6D3)
- **Played portion:** Purple (#8400C3)
- **Height:** 10px
- **Behavior:** Click to seek
- **Dynamic Text:**
  - Played section (right-justified): Time played + track title (when past 50%)
  - Unplayed section (left-justified): Track title + time remaining (when before 50%)
  - Text appears/disappears based on available space
  - Orbitron font, 10px

### Bitmap Background Animation

**Implementation:** 1-bit GIF bitmap from `/workspace/img/` rendered as full-screen background with trigonometric color cycling.

**Current Bitmap:** `pathological-defensive-pessimism.gif`

**Canvas Setup:**
- Absolute position canvas (`#bitmap-bg`) at z-index: -1 (scrolls with page)
- Canvas width matches viewport width
- Canvas height matches full document scroll height (expands to bottom of content)
- 30% opacity for subtle background effect
- `image-rendering: pixelated` to preserve bitmap aesthetic
- Image renders at fixed 2x scale (original pixel size × 2)
- Image centered with negative offsets, cropping edges for blockier aesthetic

**Color Cycling (background.js):**
- 20-second period (PERIOD = 20000ms)
- RGB range: 0x00 (minimum) to 0x88 (maximum)
- Starting color: Dark cherry red (#880000)

**Trigonometric Functions:**
- **Red channel:** Cosine wave `r = midpoint + amplitude * cos(phase)`
- **Green channel:** Arccosine transformation `g = midpoint + amplitude * (acos(cos(phase)) / π * 2 - 1)`
- **Blue channel:** Sine wave `b = midpoint + amplitude * sin(phase)`
- Phase = (elapsed time % PERIOD) / PERIOD * 2π

**Rendering:**
- Loads GIF, captures original image data
- Canvas resizes to match viewport width and full document height
- Image renders at fixed 2x scale (not responsive to canvas size)
- Per-frame: applies current color to pixel brightness values
- Uses OffscreenCanvas for color transformation
- requestAnimationFrame for smooth 60fps animation
- Window resize updates canvas dimensions but preserves image scale and aspect ratio

**Future Enhancement:**
- Multiple bitmap layers
- Web Audio API frequency bucket integration (similar to bass bins 4-6)
- Per-layer color and opacity modulation
- Audio-reactive visual experience

## No Build/Test/Lint

This is a static site with no build step, test framework, or linter configured. Changes to HTML/CSS/JS are immediately visible when the server is running.

## Code Style

- Minimal comments; code should be self-documenting
- Comment only for intent or readable explanation of abstract operations (regex, jq filters)
- Shell scripts output tool stdout only; no echo instrumentation unless tool provides no output (e.g., sed)

## Scope Creep

The `/workspace/scope-creep/` directory contains workflows and future portfolio sites that were removed from this focused live performance portfolio:

- `hls-audio-transcode/` - HLS transcoding workflow (see CLAUDE.md there)
- `hls-metadata/` - Timed ID3 metadata embedding for DJ mixes
- `image-metadata/` - Image EXIF/IPTC/XMP embedding
- `dj-portfolio-site/` - Future DJ mix portfolio
- `performances-portfolio-site/` - Reserved for potential future separation
- `webgl/` - Future web canvas art portfolio

Each subdirectory has its own CLAUDE.md with specific documentation.
