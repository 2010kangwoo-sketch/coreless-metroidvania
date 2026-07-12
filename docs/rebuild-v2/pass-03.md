# Rebuild V2 — Pass 03 Playable Zones 01–02

## Goal

Pass 03 converts the first two blueprint zones into playable graybox geometry.

- zone 01: irregular external descent
- zone 02: buried interior with two consecutive drop-and-climb structures
- active controls: A/D movement, variable Space jump, wall slide and wall jump, Shift dash, R reset, B blueprint view
- playable bounds: `0–4800 x 300–3500` inside the `26000 × 7800` blueprint world

## Previous-pass check

Pass 02 was opened in Chromium before implementation.

- actual browser keys: D, Space, Shift, A, R, B, B
- runtime audit: 10/10
- blueprint audit: 18/18
- detail toggle: passed
- console errors: 0
- page errors: 0

The first attempt could not start because the temporary browser package had been cleared between sessions. The same Playwright and Chromium versions were restored in `/tmp`; this was not a project-code regression.

## Implemented gameplay

### Player movement

- player body: `34 × 48 px`
- run speed: `5.35 px/frame`
- ground and air acceleration are separated
- variable jump through early Space release
- wall slide: maximum `3.15 px/frame`
- wall jump impulse: `8.4 / -12.8 px/frame`
- air dash: `12.4 px/frame` for 11 frames
- dash resets on ground
- camera follows both axes with damping and remains inside the Pass 03 bounds

### Zone 01

The starting garden is a continuous polygonal slope. It descends, briefly rises, and descends again before meeting the exact blueprint connection at `(2800, 1700)`.

### Zone 02

Each climb uses the same readable sequence:

1. descend from the current floor
2. pass under a buried baffle
3. enter a narrow vertical corridor
4. wall jump to gain height
5. use rightward input and air dash to clear the lip
6. descend toward the next, lower structure

The first climb rises 200 px and the second rises 240 px. Both exceed the normal-jump rise of approximately 114.9 px, so normal jumping alone cannot reach either exit.

The second exit then descends to the Pass 03 endpoint near `(4480, 3100)`, lower than the Zone 02 entry.

## Problems found and fixed during browser play

1. The first baffle occupied the whole entrance width, blocking the drop. Both baffles were corrected to 40 px structural walls.
2. Ground-following collision cancelled jumps on their first frame. Slope following now applies only while descending or moving along the ground.
3. A 260 px wall-jump corridor lost almost all vertical gain. Both corridors were changed to 210 px and wall-jump impulse was retuned.
4. Exit lips required excessively precise steering. Their rise was reduced while remaining higher than a normal jump, and a limited ledge assist was added.
5. Standing on a ledge was sometimes interpreted as side collision, sending the player back left. Ledges now use one-way top collision while walls and baffles retain side collision.
6. Canvas and HTML HUDs overlapped. Only the HTML status panel remains.

## Actual Chromium keyboard traversal

No helper-coordinate movement was used.

- route: start slope → Zone 02 drop → wall climb I → lower connector → wall climb II → Pass 03 exit
- keys used: A, D, Space, Shift, B
- first drop: reached
- first climb: reached
- second drop: reached
- second climb: reached
- exit: reached
- wall jumps: 3 in the final run
- dashes: 4 in the final run
- ledge assists: 2
- resets/deaths: 0
- final player position: approximately `(4565.33, 3052)`
- console errors: 0
- page errors: 0

The keyboard driver read gameplay state only to decide the next real key event. It did not set player coordinates or move the player through a helper API.

## Deterministic verification

- runtime audit: 12/12
- retained blueprint audit: 18/18
- Pass 03 level audit: 20/20

The Pass 03 audit checks world containment, blueprint coordinate matches, floor ordering, solid bounds, two baffles, two climb walls, underpass clearance, wall-jump-required heights, corridor widths, macro descent, movement constants, variable jump, and air dash.

These counts describe code conditions only. They do not measure final visual quality or the difficulty of later zones.

## Remaining limits

- Only Zones 01 and 02 have playable collision.
- The remaining eight zones are still blueprint data.
- Graybox terrain is not final organic artwork.
- There are no enemies, damage, checkpoints, audio, destruction, or active boulder physics yet.
- The current traversal proves the two-zone slice, not a 15–20 minute full-map completion.

## Evidence

- `pass-03-browser-results.json`
- `assets/pass03-start.png`
- `assets/pass03-first-climb.png`
- `assets/pass03-second-climb.png`
- `assets/pass03-exit.png`
- `assets/pass03-blueprint.png`
