# Chapter music

All 18 scores are original compositions stored in src/game/music.js and synthesized with Web Audio. No recordings, streaming services, downloads, or third-party samples are needed. Each score has a melody, reply phrases, an eight-bar chord progression, a quieter passage, and a fuller return across a 32-bar loop.

| Friend | Chapter | Score | BPM | Meter | Sound |
| --- | --- | --- | --- | --- | --- |
| Nova | Moon Landing | Small Steps | 68 | 4/4 | bell / space |
| Nova | Ring Ruins | Orbit Waltz | 82 | 3/4 | glass / waltz |
| Nova | Crystal Caves | Under the Amethyst | 62 | 4/4 | glass / cave |
| Nova | Sunforge | Sunbeam Engine | 102 | 4/4 | reed / pulse |
| Nova | Aurora Sea | Ribbon Lights | 72 | 3/4 | flute / air |
| Nova | Star Observatory | A Star Comes Home | 88 | 4/4 | celesta / finale |
| Pip | Fern Hollow | Fern Footsteps | 86 | 4/4 | flute / forest |
| Pip | Mushroom Grove | Mushroom Hop | 104 | 3/4 | wood / bounce |
| Pip | Root Tunnels | Root Lullaby | 64 | 4/4 | wood / cave |
| Pip | Honey Cliffs | Honeybee Dance | 100 | 4/4 | mallet / bounce |
| Pip | Cloud Canopy | Cloud Flowers | 76 | 3/4 | flute / air |
| Pip | Heart Tree | The Heart Tree Wakes | 92 | 4/4 | bell / forest |
| Bop | Bolt Beach | Pebbles and Bolts | 94 | 4/4 | mallet / beach |
| Bop | Bubble Pipes | Bubble Waltz | 90 | 3/4 | bubble / bubble |
| Bop | Gearworks | Little Clockmaker | 112 | 4/4 | pluck / clock |
| Bop | Rocket Orchard | Pocket Rockets | 116 | 4/4 | reed / pulse |
| Bop | Magnet Sky | Magnetic Moon | 78 | 4/4 | glass / space |
| Bop | Lantern City | Every Window Glows | 96 | 3/4 | celesta / finale |

Sine and triangle partials create soft bells, glass, flute, wood, plucks, pads, bass, bubbles, and little percussion. A short echoed melody gives caves and skies more space. The audio-clock scheduler looks ahead by 140 ms, limits catch-up after a stalled frame, and releases finished voices. Pause, mute, home, and a character handoff cancel the previous music; sound effects use a separate bus. A resumed checkpoint begins at the approximate musical position of its saved elapsed time.

Novel abilities have their own effects: Pip gets a rising spring sound, Bop a quick hook latch, while Nova retains her jetpack hum. Phone-speaker balance and device-specific audio unlocking still need a physical-device listening test.
