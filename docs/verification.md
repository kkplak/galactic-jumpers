# Verification record

## Executed

**61 Node checks pass** across simulation, level reachability, persistence, and input handling:

- Different full, short, and double-jump trajectories.
- Coyote time and landing jump buffer.
- Bounded jetpack fuel use and ground-only refueling.
- Swept one-way landing at maximum fall speed.
- Horizontal moving-platform carry, fragile-platform behavior, and reset.
- Vertical lift carry over a complete cycle, attached pickup motion, and one-way lift collisions.
- Immediate fuel-pad refills and a measurably higher low-gravity jump arc.
- Shield damage, checkpoint respawn, invulnerability, and one terminal result.
- No repeated crystal rewards after save restoration.
- Crystal-gated beacon and mission unlock.
- Pause freezes time; score attack ends at 120 seconds.
- Assist settings and active progress survive serialization.
- Malformed or denied local storage does not block play.
- All six campaign routes complete using public movement, jump, and boost inputs, with no fall damage. The controller waits for lift transfers and refuels for jetpack gaps.
- A two-minute run traverses the challenge’s different formations without falling; the generated course cannot run out before the timer.
- The layout revision preserves earned progression and restarts incompatible active checkpoints.
- Deterministic layouts, valid objectives, three relics per mission, bounded platforms and collectible coordinates.
- Simultaneous move, jump, and boost pointers.
- Pointer cancellation and lost capture clear actions.
- A held keyboard action survives release of a second touch source for the same action.
- No jump from keyboard repeat; focus loss clears input; pause fires once.

Six route checks isolate platform geometry by disabling enemies. A further check completes all 18 story chapters (36 runs) with creatures enabled in both normal and extra-help modes, using the same public-input controller. This verifies the authored encounter density as well as basic reachability; it does not establish the difficulty for every human play style or timing.

Static validation checks all JavaScript syntax, referenced public files, the offline cache list, all eleven sprite/scene atlases and their bounds, the static entrypoint, responsive/safe-area declarations, stylesheet brace balance, and a 4 MB public-payload ceiling. The story expansion includes all 18 scenes, 72 world objects, existing characters, and React.

Version 1.1 adds authored routes, lifts, fuel pads, low gravity, attached moving pickups, route markers, and layout-aware checkpoint migration. The updated start screen, illustrated guide, extra-help toggle, world activity labels, CSS, and service-worker file list were checked at source level. The original 28 gameplay and input checks continue to pass. Version 1.2 adds four checks for lifecycle disposal, audio closure, offline installation/activation, and cached fetch routing. The production payload is approximately 862 KiB before HTTP compression; original PNG art is included only in the source download.

All six generated raster originals were visually inspected before being optimized and integrated. The new sheets use custom crop rectangles and are repacked with transparent gutters so extended flames and the beacon spire are preserved. Transparent sprite bounds were recorded from the generated atlases.

## Version 1.2 build verification

- Dependency installation and a clean lockfile-based `npm ci` completed on Node 24.19.0.
- Vite 8.2.2 production build completed with React / React DOM 19.2.8 and the React plugin 6.1.1.
- The build validator checks the generated offline list against every emitted file, including hashed JavaScript and CSS, and verifies 192px/512px icons.
- Lifecycle tests check cancellation of frames/listeners during cleanup and remount; audio cleanup closes its context.
- Service-worker handlers are exercised in a Node VM with simulated cache storage. This is not a browser installation or offline-device test.

## Version 1.3 verification

Twelve new checks cover:

- Identical simulated movement, jump, fuel, and hitboxes across Nova, Pip, and Bop.
- Character changes preserving checkpoint, rewards, health, elapsed time, and assist settings through storage reload.
- Legacy-save defaults and invalid character ID fallback.
- Different creature combinations across worlds, with an enemy-free first world and no ground creatures on safe/fuel pads.
- Platform-bound crawler patrol and broken-platform hiding.
- Hopper crouch warning, bounded jump arc, and slower extra-help timing.
- Swooper approach warning, fixed flight lane, rest, and return warning.
- Downward bounce contact, four-second harmless recovery, and no repeat rewards.
- Side contact/invulnerability and flying enemies remaining unbounceable.
- Pause freezing creature warnings and recovery.
- Valid art references for every character/world/menu combination and correct next/retry choices.
- All six routes finishing with enemies enabled in normal and extra-help modes. Solar tide was reduced to one swooper plus one drone after the initial three-flyer mix exhausted the basic controller’s shields.

The React/Vite production build passes. Static validation confirms every emitted asset is listed in the generated offline cache. All optimized atlas dimensions match the source metadata; each frame contains visible alpha content inside its recorded bounds. The new artwork adds roughly 515 KiB of WebP files; originals remain in the downloadable source only. The dependency versions and installation commands are preserved.

## Version 1.4 story verification

Five additional checks cover the 18 unique chapter/story/art bindings, one-time migration of the old shared campaign to Nova, independent per-world rewards and checkpoint retention, invalid/cross-world checkpoint rejection, and the bounds and pickup IDs of mirrored routes. The character-switch regression now verifies independent adventures rather than moving the same checkpoint into a different world.

The existing route controller completed all **18 chapters in both normal and extra-help modes** with creatures enabled: 36 successful runs using public movement, jump, and boost inputs. It checks reachability, required tokens, and survival. The six base-course tests still isolate traversal and confirm that those routes require no sacrificial falls. No player-physics or collision-box tuning was introduced by the story expansion.

All six new original sheets were inspected, then packaged using their recorded custom crop rectangles. Every one of the 18 scene frames and 72 object frames was checked against the optimized dimensions. Object frames have visible alpha content and transparent surroundings; original PNG SHA-256 hashes match the source manifest. A composited atlas inspection confirmed transparent edges after WebP packing. Nova, Pip, and Bop share creature behaviors while using different artwork.

The expanded menu test renders every character/chapter combination as strings and verifies valid art references and next/retry choices. These are source and simulation checks, not browser interaction tests. Dependency versions and the Vite/PWA installation configuration are preserved.

## Version 1.4.1 alignment and foreground messages

- Calibrated 24 painted landing spans across the three world sheets, including fragile and refuel frames. An asset contact sheet was inspected with the anchor line over each original crop; artwork pixels were preserved.
- A geometry regression maps both painted span endpoints and the landing height onto the collider across four widths and three world positions. The collision surfaces and player physics are unchanged.
- A recorded Canvas command test confirms all message text renders after terrain, markers, creatures, the player, and damage flashes. Bubble bounds remain in the play area at portrait and landscape phone dimensions.
- Message lifecycle checks cover repeated-event replacement, expiry, pause timing, goal feedback, and clearing on a new run or respawn. These use a mocked drawing context, not a browser.
- Production validation requires valid landing anchors for every platform frame; source-pixel anchors are also recorded in the art provenance for reproducible re-packing.

## Version 1.5 connected story, abilities and music

- A complete public-input run finishes all 18 chapters in story order, reloading the save after every chapter. Nova unlocks Pip, Pip unlocks Bop, and all completed friends remain replayable.
- The 36 normal/Extra Help chapter runs use the actual jetpack, tail or hook inputs with creatures enabled. Every Pip/Bop chapter uses its special ability. All three friends also complete the two-minute challenge without sacrificial falls in the isolated traversal check.
- Tail-jump checks cover its higher arc, ground-only launch, no midair recharge, and landing reset. Hook checks cover reach, moving targets, release, pause, no repeated air attachment and landing reset. Each new character's chapter has a gate beyond normal double-jump height.
- Previous saves preserve earned records, compatible Nova checkpoints, and sound preferences. New friends receive their own ability guide. Old Pip/Bop checkpoints are discarded because their geometry changed.
- Fragile warning checks cover countdown-only shake, pause stability, reduced motion, and the persistent foreground warning symbol. Painted landing geometry and foreground text checks remain active.
- Each of the 18 original scores has distinct bounded note events and an evolving 32-bar arrangement. A mock AudioContext checks audio-clock scheduling, stalled-frame recovery, bounded live voices, pause/mute cancellation, chapter changes, separate effects, and cleanup. These are scheduling checks, not an audible device test.
- Production build, syntax, local asset references, offline cache completeness, and the 4 MB budget are checked. Existing React/Vite dependency versions and install configuration are retained.

## Not executed

No cloud-browser UI testing, screenshots of the running game, real-device testing, or frame-rate measurement was performed in this session. The title screen and game layout have responsive styles, but their appearance has not been verified in a live browser. This distinction matters for an actual mobile release.

Before public distribution, perform these device checks in iPhone Safari and Android Chrome:

1. Fresh online load, start, and audible effects after the first interaction.
2. Hold movement and boost together; tap jump with another finger; drag off controls and cancel a touch.
3. Turn the phone while playing, then explicitly resume.
4. Switch applications and return; confirm time and held controls are paused.
5. Reach a checkpoint, reload, and resume; ensure already-collected rewards stay collected.
6. Fail and retry, finish and continue, visit another story and return to its saved checkpoint, enter and leave score attack, and revisit unlocked missions. Verify every illustration and tap target at phone size.
7. Toggle music/effects, reduced motion, assist, and left-handed controls.
8. Install where supported, close all tabs, reopen, then test the cached game without a connection.
9. Check at 320 px portrait width and a short landscape viewport, including safe-area cutouts and text enlargement.

These are recorded release checks, not assertions that the behavior has been observed on physical devices.
