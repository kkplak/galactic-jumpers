# Galactic Jumpers

A mobile browser platform adventure by Konrad Plak, rebuilt from the uploaded Galactic Jumpers prototype. Double jumps, jetpack flight, and the movement feel are retained. Three friends now share one connected story across **18 illustrated chapters**, alongside a two-minute score challenge, original artwork, synthesized audio, and device-local progression.

## Play

Start as **Nova**, complete her six chapters, then follow the story to **Pip** and finally **Bop**. Each friend has their own ability and six illustrated chapters. **Continue** resumes a saved checkpoint. Earlier friends and chapters stay available for replay as the adventure moves forward.

## Version 1.5 — One adventure, three abilities

- **Nova → Pip → Bop:** Nova's star sends a wish seed to Pip; the Heart Tree gives Bop a glowing heart to wake Lantern City. Illustrated handoffs introduce the next friend. The final celebration brings all three together.
- **Nova's jetpack:** hold **FLY**, steer in the air, and land to refill.
- **Pip's tail jump:** tap **TAIL** on the ground for a much higher leap. It recharges on landing and cannot be repeated in midair.
- **Bop's hook:** hold **HOOK** near a glowing gear to reel toward it. Release to drop; landing resets the hook. Moving targets carry their anchors. A marker points toward reachable gears above a small phone's play area.
- **Routes need the new abilities:** every Pip and Bop chapter includes a tall crossing beyond ordinary double-jump height. Their action icons, guides, animations, and sounds match their abilities.
- **Shaking platforms:** fragile undersides rattle increasingly before their 0.7-second collapse. The painted landing edge stays aligned. An amber edge and **!** provide a warning with reduced motion enabled.
- **18 original chapter scores:** space bells, cave chimes, forest flutes, wood mallets, bubble waltzes, ticking gears, and a music-box finale. Each has its own melody, tempo, harmony, and 32-bar arrangement. All music works offline; pause, mute, and chapter changes cancel the previous music cleanly.
- **Save migration:** earned stars, scores, settings, and compatible Nova checkpoints remain. Previous Pip/Bop checkpoints restart on the updated routes while their earned records remain. New ability guides appear when each friend first joins.


## Version 1.4.1 — Clear landings and messages

Every platform skin now has its own painted landing anchors, including fragile and fuel variants. Both ends of the artwork's landing span match the actual collider, and the line marks its full walkable width. Movement and saved checkpoints are unchanged.

Checkpoint, refuel, and locked-gate feedback appears briefly in foreground speech bubbles. Direction symbols, gate counters, and the nearest route hint render above scenery and characters; text wraps and stays above touch controls. Duplicate checkpoint/fuel screen messages are removed, with accessible announcements retained.

## Version 1.4 — Three little stories

- **Nova / Starfall Islands:** bring a lost star home, from moon gardens and ring ruins through crystal caves to the Star Observatory.
- **Pip / Bloomwild Forest:** carry a tiny wish seed through mushrooms, roots, honey cliffs, and cloud flowers to wake the Heart Tree.
- **Bop / Clockwork Cove:** mend the city's missing heart, riding bubbles, gears, rockets, and magnets to light up Lantern City.
- **A new picture in every chapter:** 18 scene paintings and 18 terrain designs, plus individual chapter landmarks. Each world has its own token, relic, checkpoint, gate, four creatures, and final celebration. A small story companion follows you while playing.
- **Short story moments:** one sentence starts a chapter; one sentence and an illustration continue the story after a win. Version 1.5 links these endings with the next friend instead of offering an unrelated story. Scores remain tucked under **Score**.
- **Your progress stays safe:** the earlier shared campaign moves to Nova's journey, preserving compatible checkpoints and earned rewards. Pip and Bop start new adventures. Version 1.5 preserves ordinary jumps and hitboxes while giving each friend a different special ability.

The creature behaviors from version 1.3 remain: crawlers patrol platform edges, hoppers crouch before leaping, swoopers warn before crossing a fixed lane, and drones hover. Hop on crawlers and hoppers for a bounce and four harmless seconds; dodge flyers. Every journey begins peacefully, with ground creatures kept away from checkpoint and fuel pads.

## React + Vite project

The project now includes React 19, Vite 8, the official React plugin, a lockfile, development/build/preview commands, editor configuration, and a Node version file. React mounts the game screen and owns runtime cleanup. The Canvas simulation and existing menus remain in a dedicated game module; unmounting or Fast Refresh stops its listeners, animation callbacks, timers, and audio.

## Worlds and chapters

The menu shows the selected chapter's actual scenery and landmark. Tap a numbered picture to choose an unlocked chapter, or an unlocked friend to replay their world. The question mark opens the illustrated guide, the clock starts a two-minute challenge, and the shield turns extra help on for new runs. A saved checkpoint changes **Play!** to **Continue** and the shield shortcut to a restart button.

| Chapter | Nova: Starfall Islands | Pip: Bloomwild Forest | Bop: Clockwork Cove | Traversal |
| --- | --- | --- | --- | --- |
| 1 | Moon Landing | Fern Hollow | Bolt Beach | Broad landings, curved climbs, vertical steps, double jumps |
| 2 | Ring Ruins | Mushroom Grove | Bubble Pipes | Vertical lifts and moving shuttles |
| 3 | Crystal Caves | Root Tunnels | Gearworks | Runs of crumbling stairs with safe resting places |
| 4 | Sunforge | Honey Cliffs | Rocket Orchard | Tall ability crossings, recharge pads, airborne pickup trails |
| 5 | Aurora Sea | Cloud Canopy | Magnet Sky | Lower gravity, longer airtime, sweeping jumps |
| 6 | Star Observatory | Heart Tree | Lantern City | A finale combining stairs, lifts, and flights |

The campaign uses six authored movement blueprints, with Pip's routes mirrored and Bop's orientation alternating by chapter. Nova retains her established distances; Pip and Bop add taller gates for their special abilities. The 18 chapters have distinct artwork and narrative; they are not 18 entirely separate movement systems. Fragile and refueling surfaces retain consistent visual cues in every world.

The two-minute challenge cycles through stairs, vertical columns, drifting rocks, and ability crossings. Its course extends beyond the maximum distance reachable before the timer expires.

The downloadable archive includes source, ready-to-serve `dist` files, tests, original PNG artwork in `art-source`, and the prototype review. It omits Git history and removes the account-specific Site ID from the hosting manifest, so it can be used as an independent project.

| Action | Touch | Keyboard |
| --- | --- | --- |
| Move | Left / right buttons | A / D or left / right arrows |
| Jump | Tap jump | Space, W, or up arrow |
| Double jump | Tap again while airborne | Release and press jump again |
| Higher jump | Hold the jump briefly | Hold the jump briefly |
| Nova: jetpack | Hold FLY | Hold Shift or X |
| Pip: tail jump | Tap TAIL from a platform | Press Shift or X on the ground |
| Bop: hook | Hold HOOK near a glowing gear | Hold Shift or X; release to drop |
| Pause | Pause button | Escape or P |

Land on the top of platforms. Collect stardrops, dewdrops, or sparks to open the gate; three optional world treasures reward exploration. Glowing world markers save a checkpoint and refill fuel. Jetpack fuel also recharges while on a platform. Golden recharge pads refill it immediately on landing. Pip and Bop recharge their ability on any landing. Dotted rails show a moving rock’s travel; up/down arrows identify lifts. Golden dotted trails mark tall ability crossings. Chapter 5 uses 680 units/s² gravity instead of the usual 1100, so the same controls produce longer jumps. Fragile platforms shake before crumbling after 0.7 seconds and return after three seconds. A shield pickup restores one health point. Falling too far or touching an enemy costs a shield and returns the explorer to the latest checkpoint. Losing all shields ends the run.

Each chapter awards one star for completion, one for collecting at least 85% of its tokens, and one for beating its target time. The timed climb records a separate personal best. There are no online rankings, accounts, purchases, ads, or analytics.

## Run and develop locally

Install **Node.js 24** (the project supports Node 22.12 or newer). Extract the ZIP, open a terminal in the `galactic-jumpers` folder containing `package.json`, and run:

```bash
npm ci
npm run dev
```

Open **http://localhost:5173**. These commands work in Windows PowerShell, macOS Terminal, and Linux. The included `package-lock.json` fixes dependency versions; `npm install` also works if you deliberately want to update dependencies. No API keys, backend, database, or environment variables are needed.

To build and preview the production game:

```bash
npm run build
npm run preview
```

Open **http://localhost:4173**. Edit files in `src/` and `public/`; `dist/` is generated by the build. The ZIP includes a ready-built `dist/` too. Deploy that folder to an HTTPS static host. Do not open `index.html` directly from the file browser.

| Command | Purpose |
| --- | --- |
| `npm run dev` / `npm start` | Development server with React Fast Refresh |
| `npm run dev:host` | Development server accessible from your local network |
| `npm run build` | Production build and automatic offline cache generation |
| `npm run preview` | Preview the production build on this computer |
| `npm run preview:host` | Preview the build from your local network |
| `npm test` | Simulation, input, lifecycle, and service-worker checks |
| `npm run check` | Validate the latest production build; run build first |

## Play and install on a phone

For local development, run `npm run dev:host` on your computer. Connect the phone to the same Wi-Fi and open the **Network** address printed by Vite, such as `http://192.168.1.20:5173`. Use your computer’s actual address; `localhost` on the phone refers to the phone itself. If the connection is blocked, allow Node through your computer’s firewall for your private network.

For installation and offline play, serve the production `dist/` over **HTTPS**. A normal HTTP local-network address can show the game but does not provide the secure context needed for the offline worker. Development mode intentionally disables service-worker registration so cached bundles cannot interfere with edits.

- **iPhone/iPad:** open the HTTPS game in Safari, choose Share → Add to Home Screen, and open the new icon.
- **Android:** open the HTTPS game in Chrome and use Install app / Add to Home screen, or the game’s Install button when offered.
- **Computer:** use a browser that supports installing web apps, such as Chrome or Edge, and choose its install option.

Let the first online load finish before trying offline play. The game is an installable web app, not an APK, IPA, or desktop executable. Installation availability depends on the browser. Your progress belongs to that browser and origin; changing host or port creates a separate save.

Setup references: [Vite guide](https://vite.dev/guide/), [React with a build tool](https://react.dev/learn/build-a-react-app-from-scratch), and [installable web apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).

## Source layout

| File | Responsibility |
| --- | --- |
| `src/game/engine.js` | Pure fixed-step physics, collisions, health, checkpoints, inventory, win/loss |
| `src/game/levels.js` | Authored campaign courses, deterministic timed formations, and tuning |
| `src/game/enemies.js` | Creature patrols, hop warnings, swoop timing, and bounce/contact rules |
| `src/game/characters.js` | Character IDs, names, sprite sheets, ability labels and guides |
| `src/game/abilities.js` | Jetpack, tail-jump and grappling-hook mechanics |
| `src/game/story.js` | Three worlds, chapter stories, palettes, art references, and route variants |
| `src/game/menu.js` | Illustrated home, help, pause, and results markup |
| `src/game/renderer.js` | Canvas, camera, sprite rendering, foreground callouts, culling, particles |
| `src/game/platform-art.js` | Map painted platform landing spans to physics surfaces |
| `src/game/input.js` | Pointer capture, simultaneous touch, keyboard, cancellation cleanup |
| `src/game/runtime.js` | Menus, focus, state transitions, one animation loop, integration |
| `src/game/storage.js` | Separate world progress, versioned migration, validation, graceful storage failure |
| `src/game/audio.js` | Audio-clock scheduling, soft instrument synthesis, effects, voice cleanup |
| `src/game/music.js` | 18 original chapter scores, melodies, arrangements, and instrument definitions |
| `src/styles/style.css` | Responsive game UI, portrait/landscape layout, safe areas |
| `src/styles/menu.css` | Kid-friendly start screen, illustrated tutorial, settings |
| `src/App.jsx`, `src/main.jsx` | React screen, entry point, and lifecycle |
| `vite.config.js`, `jsconfig.json` | Vite build, React plugin, and editor alias configuration |
| `public/` | Original served assets, app icons, and web app manifest |
| `src/service-worker.js`, `scripts/offline-build.mjs` | Automatic production offline cache |
| `dist/` | Generated production output; rebuilt by Vite |
| `tests/` | Gameplay, character, creature, menu asset, input, lifecycle, and offline regression checks |
| `docs/` | Prototype review, asset provenance, release notes |
| `art-source/` | Original full-resolution PNG background and sprite sheets |
| `scripts/pack-story-art.py` | Optional reproducible story-art packaging with Python and Pillow |

## Mobile behavior

The game supports portrait and landscape layouts. Touch actions are tracked by pointer identity, so releasing one finger does not release other controls. Pointer cancellation, loss of capture, focus loss, and orientation changes clear held controls. Switching tabs or applications pauses the game. Audio starts only after a user gesture.

Preferences include music, sound effects, haptics where supported, left-handed controls, reduced effects, and assist mode. Assist mode adds two shields, slows enemies, and widens pickup detection. It applies to new runs; a restored checkpoint retains the run's original assist setting.

The save is local to this origin and browser. Save format 3 stores chapter unlocks, six results, an active run, and an ability-guide flag for each character. Story access is derived from the completed chapters: Nova, then Pip, then Bop. Format-1 shared progression migrates into Nova; format-2 per-world records remain attached to their friends. The earliest unfinished story becomes the selected world. Nova’s revision-2 checkpoints remain compatible; old Pip/Bop checkpoints restart because their routes now have taller gates. A checkpoint from the original prototype's incompatible layout restarts its chapter while preserving earned stars and scores. Shared sound/control settings, the tutorial flag, and the timed personal best survive migration.

Campaign progress is recorded every five seconds, at checkpoints, and on pause/background transitions. **Continue** restores the last checkpoint, keeping collected items, health, and elapsed time. Visiting another world preserves the first world's active run. Best results and unlocks survive failed runs. Clearing browser data removes the save. Storage denial or quota failure does not prevent gameplay.

## Assets

All shipped artwork was created for this build using image generation. Twelve optimized WebP files contain the original landscape, three eight-pose character atlases, the original object atlas, the shared sticker atlas, and six new story sheets. The story sheets provide **18 chapter scenes and 72 world objects**: six terrain designs, six landmarks, a token, relic, checkpoint, gate, fragile/refuel platforms, four creatures, a story companion, and an ending illustration per world. App icons are packaging crops of the explorer. Music and effects are synthesized locally with Web Audio. See `docs/music.md` for the 18 original score titles and instrumentation.

Original bounds and prompts are in `docs/asset-provenance.json` and `docs/new-art-prompts.md`. The story expansion adds exact prompts in `docs/story-art-prompts.md` and per-frame crop, alpha, hash, and packing metadata in `docs/story-art-provenance.json`. Full-resolution originals are preserved in `art-source/` and do not download during play. `python3 scripts/pack-story-art.py` reproduces the six optimized story sheets when Pillow is installed; Python is not required to run or build the game.

The complete served game stays within a **4 MB** budget before HTTP compression, including React and every world. Sprite crops have transparent gutters to prevent neighboring art bleeding into the game. Background paintings use an opaque six-panel atlas. The generated platforms have deep undersides; frame-specific landing anchors align each painted surface with the full highlighted collision edge. Anchor metadata survives art re-packing. Small leaf sprouts are decoration, without extra collision surfaces.

The original uploaded attachment remains intact. Its mixed branding, older sprite pack, MP3s, and oversized prototype backdrops are not shipped.

## Release notes and limits

See `docs/review.md` for findings and decisions, and `docs/verification.md` for what was checked. Device-local, offline-capable single-player play is implemented. Cross-device saves and multiplayer are outside this edition.

The offline cache is populated after a successful online load. Each Vite build fingerprints its complete output and generates `dist/sw.js` with the actual hashed JavaScript/CSS filenames and artwork. No manual cache-version edits are needed. The manifest and runtime assets also support an absolute subdirectory base such as `/jumpers/` configured in `vite.config.js`. An update waits for existing game tabs to close before taking over, avoiding a mixture of old and new modules mid-run.

Automated simulation and input checks pass. No browser automation or physical-device playtest was performed in this session. Real iPhone Safari and Android Chrome checks for audio unlocking, multitouch, rotation, background/resume, installation, and cached offline play are still required before a wider public release. Menus have semantic buttons, native dialogs, visible focus, labels, and announcements; the platforming itself is visual and is not a nonvisual screen-reader game.
