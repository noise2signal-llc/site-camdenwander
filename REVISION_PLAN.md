# Portfolio Site Refactoring Plan

**Goal:** Transform the current multi-category portfolio site into a focused audio production work-in-progress portfolio.

**Context:** The current site combines three audio categories (production, live performances, DJ mixes) plus plans for web canvas art and traditional media. This dilutes the narrative. Separating into five distinct portfolio sites (separate git repositories) will provide focused demonstrations of different skill sets.

**Priority:** Audio production WIP portfolio (this refactor) 

**[EDIT]:** Portfolio scope is electronic music created with hardware instruments featuring Eurorack modular synthesizers that can be played live. 
- As such the "tracks" (we'll call them "Movements") and "live performances" are both in scope. 
- DJ mixes, as they are derivative work and not my own composition, and as individual DJ'd tracks may or may not be produced with hardware synths, DJ mixes are out of scope.
- Music production and my efforts to grow and improve in audio production are not in scope, they are instead to be considered related and tangential.
- The specific purpose of the site is to demonstrate my ability to provide a live performance of electronic music with hardware synhesizers as entertainment.
  - this is separate and distinct from both DJ mixing with vinyl and producing music for sale and distribution
  - "
- All "tracks" will represent ~5:00 "movements" of electronic music that I can perform live without a computer

---

## Phase 1: Archive Existing Multi-Category Content

### Create Archive Structure

**[EDIT]:** user has named the archive folder /scope-creep

```
archive/
├── hls/
│   ├── live-performances/    # Move from site-root/hls/
│   └── mixes/                # Move from site-root/hls/
└── transcode/
    └── staged/
        ├── live-performances/  # Move from transcode/staged/
        └── mixes/              # Move from transcode/staged/
```

**[EDIT]:** All TS segments under site-root/hls/ will be re-transcoded pending further development to the transcoding and metadata embedding mechanisms; transcode/staged has only subdirectories; user has removed all these directories manually

### Archive HLS Metadata Tooling

```
archive/
└── md-embed/
    └── hls_metadata/         # Move from md-embed/hls_metadata/
```

**Rationale:** Preserves transcoded HLS content, staged source files, and metadata tooling for future use when building the live-performances and DJ mixes portfolio sites. Keeps the transcoding investment without cluttering the audio production WIP site.

**[EDIT]:** user has moved /workspace/md-embed/hls_metadata to /workspace/scope-creep/hls-metadata

---

## Phase 2: Simplify Site Structure

### site-root/ Changes

**KEEP:**
- `index.html`
- `nope.html` (404 page)
- `css/camden-wander.css`
- `js/bitmap-background.js` **[EDIT]:** please rename to js/background.js
- `js/camden-wander.js` (will be modified)
- `img/` (bitmap backgrounds and artwork)
- `hls/production/` (only production tracks remain) **[EDIT]:** all tracks will be re-trancoded and have been removed

**REMOVE:**
- `hls/live-performances/` → `archive/hls/` **[EDIT]:** no-op, user has removed
- `hls/mixes/` → `archive/hls/` **[EDIT]:** no-op, user has removed

### transcode/ Changes

**KEEP:**
- `Dockerfile`
- `launch-transcode.sh`
- `generate-hls.sh`
- `staged/production/` **[EDIT]:** user has removed

**REMOVE:**
- `staged/live-performances/` → `archive/transcode/staged/` **[EDIT]:** user has removed
- `staged/mixes/` → `archive/transcode/staged/` **[EDIT]:** user has removed

**[EDIT]:** /workspace/transcode has been moved to /scope-creep/hls-audio-transcode

### md-embed/ Changes

**KEEP:**
- `image_metadata/` (for artwork images)

**REMOVE:**
- `hls_metadata/` → `archive/md-embed/hls_metadata/` **[EDIT]:** user has moved to /workspace/scope-creep/hls-metadata
  - Will be used in future DJ mixes portfolio site

**Rationale:** Eliminates unused infrastructure and content while preserving them in archive/ for future portfolio sites.

**[EDIT]:** /workspace/md-embed/image_metadata has been moved to /workspace/scope-creep/image-metadata

---

## Phase 3: Code Refactoring

### js/camden-wander.js

**REMOVE entirely:**
- `livePerformances` array
- `djMixes` array
- Logic for handling multiple track categories
- Left/right track group alignment logic

**SIMPLIFY:**
- Rename `producedTracks` to `tracks` (or keep as `producedTracks`)
- Simplify `buildTrackList()` to handle single category
- Remove track-group-left and track-group-right complexity
- Consider single centered track list layout

**[EDIT]:** 
- as I have decided the performances are in scope, there 2 types of "tracks" (movements and performances)
- js can be simplified to create tracks and info panels from JSON content to be defined
- tracks have been deleted, please use existing track names for creating markup

### css/camden-wander.css

**SIMPLIFY:**
- Remove left/right track group asymmetric layout
- Single category allows simpler flex layout
- Consider centered track list instead of left/right alignment 
- Simplify responsive breakpoints (no need for complex side-by-side layouts)

**[EDIT]:** 
- please see revision PNG /workspace/REVISION_2025-01-01.png for changes to color scheme and alignment
- title bar and section headings are center justified
- tracks, info bars, and the subtitle are to be left justified to same left margin, which is 4 pixels from the rightmost vertex of the containing trapezoid
- tracks are to have the play/pause control prepended
- the track level play symbol will synchronize with the master player control visually and functionally
- only the play symbol will trigger queuing to the audio player and subsequent pause/play of the track, the track name is not responsive
- if another track is selected and queued, any previously playing track is reset to show the play symbol
- a "Info" "i"  icon is preprepended to the track, clicking will activate an info trapezoid which will drop down from the track trapezoid with the track details. The info icon can be used to toggle the show/hide of the info trapezoid, or a "close" "X" in the corner of the dropped down trapezoid. The rest of the tracks will move downward when an info panel above is activated

### index.html

**SIMPLIFY:**
- Remove multi-section structure (Releases / Performances / DJ Mixes)
- Single section header: "Works in Progress" or "Production Tracks"
- Optional: Add brief artist statement about skill development journey

**Rationale:** Removes unnecessary complexity introduced by supporting three distinct audio categories. Single category allows simpler, more focused UI.

**[EDIT]:** user chooses "Musical Movements" as the section header, in addition to keeping "Live Performances"; user does plan to add add more prose context including overall creative journey, production process and instruments, and thoughts and context around individual tracks.

---

## Phase 4: Documentation Updates

### CLAUDE.md Changes

**SIMPLIFY:**
- Remove references to live-performances and mixes categories
- Update transcode workflow documentation (single category)
- Remove HLS metadata embedding section (moved to archive)
- Update "Adding New Tracks" workflow (single category only)
- Simplify "Architecture" section (no category-based HLS structure)

**[EDIT]:** Please create new CLAUDE.md contexts for all subfolders in /workspace/scope-creep. As the audio production site context is edited, please transfers details demoted from scope and currently detailed in /workspace/CLAUDE.md to the scoped CLAUDE.md contexts under /workspace/scope-creep.

**ADD:**
- Note about archived content in `archive/` **[EDIT]:** NO-OP, DO NOT EXECUTE
- Note that this site is specifically for audio production WIP **[EDIT]:** NO-OP, DO NOT EXECUTE
- Reference to future separate portfolio sites (brief mention) **[EDIT]:** NO-OP, DO NOT EXECUTE
- Clarify that live-performances and mixes content moved to archive for future sites **[EDIT]:** NO-OP, DO NOT EXECUTE

**[EDIT]:** [NO-OP,DO NOT EXECUTE] this is user's context, not machine's

### publish/deploy.sh

**NO CHANGES NEEDED:**
- Already syncs `site-root/` only
- Will naturally exclude archived content (outside `site-root/`)

**Rationale:** Documentation should reflect the focused scope and guide future work.

---

## Phase 5: UI/UX Simplification Opportunities

With a single category, consider these simplifications:

### Simplified Track List Layout

**Current complexity (multi-category):**
- Left-aligned trapezoids (track-group-left)
- Right-aligned trapezoids (track-group-right)
- Different polygon points and text anchors
- Complex responsive flex layout with asymmetric groups

**Proposed simplification (single-category):**
- Center-aligned track list (simpler trapezoid SVG logic)
- Single consistent text-anchor (middle)
- Uniform trapezoid orientation
- Simpler responsive behavior (just vertical stacking)

**[EDIT]:**
- please refer to /workspace/REVISION_2025-01-01.png for desired layout details
- allow for 2 sections to "flex" horizontally to 2 columns when the browser width permits
  - section headers are to remain centered above the respective track listing
  - track listings and toggle-able info panels are to remain left justified to 4px indent from the innermost trapezoid vertex
  - please note where trapezoid angles are identical, even when "flipped" and where they differ

### Section Header

**Options:**
- "Works in Progress"
- "Production Tracks"
- "Audio Production"
- Custom artist statement emphasizing learning/development narrative

**[EDIT]:** "Musical Movements" and "Live Performances"

### Visual Consistency

**Simplify:**
- Single consistent color treatment (no category-based variations)
- Simpler hover/active states
- Remove need for left/right alignment visual distinctions

**[EDIT]:**
- please refer to /workspace/REVISION_2025-01-01.png for color scheme changes
- please keep Orbitron as the Title, Section Header, and player controls and timelne data font
- please use Rubik bold for track titles, Rubik medium for info panels and subtitle

### Optional Enhancements

Consider adding (if relevant to WIP narrative):
- Track metadata (date added, last updated)
- Genre/style tags ("ambient", "techno", "experimental")
- Progress indicators ("in progress", "mixing", "mastering", "complete")
- Release readiness status
- Brief track notes or production learnings

**Rationale:** Simplification reduces cognitive load and allows focus on the production work itself. Single category removes need for complex responsive asymmetric layouts.

**[EDIT]:**
- toggleable info panels will be implemented for these narrative pieces
- track name and time played versus time remaining will be rendered on the timeline, as space permits
  - at first, time remaining and track name are rendered in the "unplayed" section of the timeline
  - when space is sufficient, time played is available in the "played" section
  - when half the track has played, track title moves to the "played" section
  - when space no longer allows for time remaining it disappears
- Orange\yellow SVG trapezoids are added to eash side of the trapezoid representing the currently playing track

---

## Phase 6: Future Portfolio Site Considerations

When building the other four portfolio sites, you can:

### Live Performances Portfolio

**Content source:**
- Use `archive/hls/live-performances/` content
- Use `archive/transcode/staged/live-performances/` sources

**Presentation differences:**
- Emphasize performance context (venue, date, equipment used)
- Possibly different UI aesthetic (more energetic/dynamic)
- Setlist or track progression visualization
- Equipment/setup details

**[EDIT]:** will not be separated, and venue, equipment and setup data are planned for inclusion

### DJ Mixes Portfolio

**Content source:**
- Use `archive/hls/mixes/` content
- Use `archive/transcode/staged/mixes/` sources
- Use `archive/md-embed/hls_metadata/` tooling for attribution

**Presentation differences:**
- Timed ID3 metadata for track attribution (required for copyright)
- Real-time display of currently playing track in mix
- Discogs links for source material
- Blend indicators (when mixing between tracks)
- Focus on curation and mixing skill demonstration
- Playlist/tracklist view

### Web Canvas Art Portfolio

**Content source:**
- Start fresh (no existing content to port)
- Could reuse bitmap-background.js concepts as starting point

**Technical considerations:**
- Interactive 2D/3D experiences
- Different tech stack (potentially Three.js, WebGL, Canvas API)
- Separate containerized development workflow
- Different presentation paradigm (interactive art vs. audio playback)

### Traditional Media Portfolio

**Content source:**
- Use `img/` artwork images (if applicable)
- Use `md-embed/image_metadata/` tooling

**Presentation differences:**
- Gallery-focused layout (not audio player)
- Image metadata display (medium, date, description, dimensions)
- Lightbox or modal for full-size viewing
- EXIF/IPTC metadata visibility
- Chronological or thematic organization

### Shared Infrastructure Patterns

**Reusable across repos:**
- Container-based workflows (copy patterns to new repos)
- Transcoding workflow (copy `transcode/` to new repos as needed)
- Metadata embedding patterns (copy `md-embed/` tooling)
- Deployment scripts (same s3cmd pattern, different S3 buckets)
- Launch script conventions (force-rebuild, state management)

**[EDIT]:** transcoder and each metadata embedder will have its own repo as well

**Per-site customization:**
- Different S3 bucket names in deployment scripts
- Different domain names / URL structures
- Site-specific color schemes and typography
- Different UI layouts based on content type

---

## Refactoring Execution Order

When ready to proceed:

1. **Create archive/ structure and move content** (reversible)
   - `mkdir -p archive/hls archive/transcode/staged archive/md-embed`
   - Move directories to archive
   - Verify files are in correct locations

2. **Update JavaScript** (`js/camden-wander.js`)
   - Remove `livePerformances` and `djMixes` arrays
   - Simplify `buildTrackList()` function
   - Remove category-specific logic

3. **Update CSS** (`css/camden-wander.css`)
   - Simplify track list layout (if desired)
   - Remove left/right track group styles (if switching to centered layout)
   - Simplify responsive breakpoints

4. **Update HTML** (`index.html`)
   - Simplify section headers (single category)
   - Add artist statement (optional)

5. **Update CLAUDE.md**
   - Document changes and archive structure
   - Simplify workflow documentation

6. **Test locally**
   - Start dev server: `python3 -m http.server 8080`
   - Verify player works with production tracks only
   - Test responsive behavior
   - Verify no broken references to removed content

7. **Deploy**
   - Run `./publish/launch-deploy-container.sh`
   - Verify published site works correctly

---

## Risks and Considerations

### Git History

**Issue:** Moving files to `archive/` creates new paths in git history. Git will track this as "delete + add" rather than "move" unless explicitly handled.

**Options:**
- Accept new paths (simpler, works fine)
- Use `git mv` to preserve history (more complex, may not be necessary)

**Recommendation:** Accept new paths. The archive is for future reference, not active development.

### Broken URLs

**Issue:** Existing HLS URLs for live-performances and mixes categories will break:
- `https://camdenwander.com/hls/live-performances/*/master.m3u8`
- `https://camdenwander.com/hls/mixes/*/master.m3u8`

**Impact:** Minimal - this is a WIP portfolio being refactored. If anyone has these URLs bookmarked, they'll get 404s.

**Mitigation:** Not needed. The site is being refocused; broken URLs are acceptable.

**[EDIT]:** preserve existing track list for markup and style work, transcoding alterations will happen in parallel and newly transcoded tracks will be available for testing javascript

### Reversibility

**Strength:** Archive structure makes it easy to reverse changes if needed:
- Move content back from `archive/` to original locations
- Restore arrays and logic in JavaScript
- Revert CLAUDE.md documentation

**Timeline:** Easy to reverse before creating new repos for other portfolio sites.

### Deployment Timing

**Consideration:** Once deployed, the live site will no longer have live-performances or mixes content.

**Recommendation:** Ensure you're ready to commit to this focused scope before deploying. Test thoroughly locally first.

---

## Open Questions / Decisions Needed

<!-- Add your notes, questions, or required decisions here -->

**Section Names:**
- What should the single track section be called? "Works in Progress", "Production Tracks", "Audio Production", or something else?

**Layout:**
- Keep left-aligned trapezoids or switch to centered layout?
- Keep current color scheme or simplify?

**Artist Statement:**
- Do you want to add a brief artist statement about your audio production learning journey?

**Track Metadata:**
- Should individual tracks show additional metadata (date, genre tags, production status)?

**Timeline:**
- When do you want to execute this refactor?
- Should this be done before starting work on other portfolio sites?

---

## Notes

<!-- Add your comments, thoughts, or revisions here -->
