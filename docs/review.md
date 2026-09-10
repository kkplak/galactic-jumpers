# Prototype review and rebuild decisions

The uploaded archive was inspected before implementation. This review refers to the original files in that archive; the replacement source is in `src/game`.

| Finding in the prototype | Impact | Resolution |
| --- | --- | --- |
| No root dependency manifest, lockfile, or runnable build configuration was present in the upload. | The supplied React source was not independently reproducible as uploaded. | Ship a complete React + Vite project with a lockfile, documented run/build commands, and generated static output. The central Canvas architecture remains. |
| `App.js` schedules a recursive animation callback; `Game.js` also starts and recursively schedules its own loop. Both update and render the game. | Physics, collision, and rendering can advance twice per display frame. | One application animation loop, a 120 Hz fixed-step accumulator, bounded elapsed-frame input, and a pure simulation. |
| `cancelAnimationFrame(update)` passes a function instead of the request handle. The internal game loop schedules itself indefinitely. | Lifecycle cleanup does not stop all animation work. | A single page-owned loop has an explicit game-state gate; a new run replaces simulation state without adding loops. |
| `InputManager.start()` adds listeners every time a game starts. | Repeated starts can duplicate input subscriptions. | Construct one input manager with one abortable set of listeners. Runs clear state instead of adding listeners. |
| Separate mouse/touch handlers do not cover pointer capture and cancellation coherently. | Controls can stick or drop when a finger leaves a button, a tab backgrounds, or multiple fingers are used. | Unified pointer events, one action per input source, cancellation/lost-capture handling, and keyboard parity. |
| One enormous hard-coded map, no staged progression, and fixed 120-second ending. | Difficulty pacing and objectives are hard to teach or tune; no campaign completion arc. | Six authored missions have distinct curved climbs, lift transfers, crumbling stair runs, jetpack routes, and low-gravity jumps, ending in a final combined course. Preserve a separate two-minute score-attack mode. |
| An orb coordinate uses `y: 1589`, outside the approximately 400-row map. | Authored collectibles can silently be unreachable or absent. | Bounded authored level data with objective and reachability checks for all six missions. |
| The game adds powerups in `placeOrbs()` while resets do not consistently clear all spawned collections. NPCs are also spawned again on start. | Restart behavior can accumulate objects and drift away from a fresh run. | Each run gets a new isolated simulation; restore uses validated IDs from a deterministic layout. |
| Success is based on collecting at least 20 orbs when the timer expires. | Reaching a destination does not create a clear campaign win. | Explicit beacon gates, completion results, stars, unlocks, and final campaign ending. |
| Direct DOM lookups are mixed into game logic; UI/result state is split between React and game fields. | Difficult to reason about pauses, restarts, and game-over transitions. | Pure engine emits events; the UI owns presentation and focus. A completed run cannot complete twice. |
| Long music files and several multi-megabyte backdrop images are included. | Unnecessary network transfer and audio initialization work for a mobile game. | Optimized WebP atlases/backdrop and synthesized audio; the story expansion stays within a 4 MB payload budget, including all 18 scenes. |
| Tom and Jerry branding, a different character sprite sheet, multiple art styles, and no clear asset provenance accompany the source. | The prototype has no coherent independent game identity. | New Galactic Jumpers visual identity, original generated explorer/objects, cohesive scenery, and prompt provenance. |
| AudioContext is created during setup, ahead of guaranteed user interaction. | Mobile browser audio can remain suspended. | Create/resume audio after a start or settings gesture, with independent music/effect controls. |
| Only a generic high score is stored. | No mission progression, checkpoint continuity, preferences, or robust save validation. | Versioned local save with per-mission stars, scores, times, relics, unlocks, and checkpoint restoration. |

## Scope

This is a complete small single-player game edition, not a live-service backend. The request's broad transformation warranted rebuilding the incomplete runtime while retaining its gameplay idea. The upload remains unchanged as a reference; no attempt was made to push into the old repository embedded in its Git metadata.

The new Site contains the complete editable source. It does not include an unrelated marketing page, artificial online leaderboard, fake player counts, payment flow, or external account requirement.
