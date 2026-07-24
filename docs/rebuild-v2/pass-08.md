# Rebuild V2 — Pass 08 Active Boulder Chase

## Goal

Pass 08 activates the boulder on the physical graybox route established in Passes 06 and 07.

- trigger: player entry into Zone 05
- player flow: destruction maze → giant curve → lower reverse run → three jump-dash gaps
- boulder flow: Zone 05 broad collapse corridor → physical curve → lower reverse run
- temporary chase exit: `(9300, 5000)`
- final bridge sequence: deliberately deferred to a later pass

The boulder does not use an airborne guide, teleport, or independent lane change. It follows one continuous path through the same two large structures as the player.

## Previous-pass check

The remote branch and Draft PR were checked before implementation.

- previous branch head: `d764a03f5204ac8217b92ec816a4abc1fb55e8ce`
- PR #1 state: open, draft, unmerged
- local config, runtime, Pass 07 level, and Pass 07 document blobs matched the remote branch

Pass 07 was then replayed from the game spawn in Chromium with actual keyboard events.

- helper-coordinate movement: not used
- final position: approximately `(9298.88, 4950.62)`
- dash gaps: 3/3
- destruction gates: 3/3
- resets: 0
- runtime audit: 16/16
- Pass 07 audit: 28/28
- console errors: 0
- page errors: 0

No new Pass 07 regression was found before Pass 08 implementation.

## Implemented chase

### One continuous boulder path

- 30 connected points
- total path distance: approximately 30,779.37 px
- first 10 points: the 360 px-wide Zone 05 collapse corridor
- remaining 20 segments: the 420 px-wide physical giant curve and lower run
- radius: 92 px, smaller than both corridor half-widths
- start delay: 220 frames after the player triggers the chase
- speed: 5.60 px/frame increasing to a maximum of 6.05 px/frame
- the path passes continuously across all three player dash gaps

The reserved `activeBoulder=false` flags in Passes 06 and 07 remain unchanged as historical graybox data. Pass 08 owns the new active chase state.

### Rear collapse

- 31 player-floor collapse panels mapped to the boulder path
- floor removal occurs 175 path-pixels after the boulder passes each trigger
- 13 structural support targets
- supports generate debris and screen shake when the boulder reaches them
- collapsed floors are removed from collision, preventing indefinite waiting behind the chase
- the boulder ignores the player gaps because its physical center route remains connected across them

### Contact and reset

- circle-to-player-rectangle contact uses the 92 px boulder radius plus 14 px contact padding
- contact resets the runtime to the start
- manual and fall resets continue to use the existing reset path
- boulder catches are recorded separately from generic resets

### Chase camera

The first implementation used the existing fixed zoom. The boulder could be active more than 1,000 px behind the player while remaining outside the screen.

- active chase zoom range: 1.0 down to 0.62
- when both objects fit, the camera frames the player and boulder together
- when they cannot both fit, the camera keeps the player visible
- a fixed HUD shows boulder route progress and spatial gap
- after the temporary chase exit is reached, the camera returns to zoom 1

## Problems found and fixed

1. The first complete chase run passed gameplay but runtime audit reported 16/17. The legacy-script check treated the legitimate `rebuild-v2-pass08` cache query as a legacy Pass 08 loader. The check now requires every active external script to be the single `src/v2/main.js` entry.
2. The first chase camera could hide the boulder entirely. Dynamic chase framing and a progress/gap HUD were added.
3. Mid-curve separation could exceed the minimum-zoom viewport and place the camera between the two actors, hiding the player. Framing now falls back to player priority when the pair does not fit.
4. The initial boulder speed ended the run at about 92.3% route progress with a 2,344 px gap. Speed was raised from 5.45–5.90 to 5.60–6.05, producing stronger but still escapable late pressure.

Failed or diagnostic runs are not reported as final completions.

## Verification categories

### A. Actual Chromium keyboard traversal

The final completion run began at the game spawn and used no helper-coordinate movement.

- route: start slope → Zones 01–04 → active chase through destruction maze → giant physical curve → lower reverse run → three jump-dash gaps → Pass 08 exit
- keys: A, D, Space, Shift, B
- final position: approximately `(9298.26, 4950.67)`
- boulder route progress at escape: approximately 94.74%
- remaining spatial gap: approximately 1,605 px
- floors collapsed behind player: 30/31
- supports destroyed behind player: 12/13
- Pass 07 dash gaps: 3/3
- retained destruction gates: 3/3
- direction changes: 1
- boulder catches: 0
- resets/deaths: 0
- console errors: 0
- page errors: 0

The player reaches a temporary seal before the boulder reaches the final path point. This is not the final bridge escape scene.

### B. Deterministic verification

- runtime audit: 17/17
- blueprint audit: 18/18
- retained Pass 03 audit: 20/20
- retained Pass 04 audit: 22/22
- retained Pass 05 audit: 25/25
- retained Pass 06 audit: 28/28
- retained Pass 07 audit: 28/28
- Pass 08 audit: 24/24

The Pass 08 audit checks the 30-point combined route, exact Zone 05–06 join, strict cumulative path distance, physical apex, one direction change, corridor-fit radius, bounded delay and speed, all 31 collapse panels, 13 supports, connected gap crossings, no teleport-length segment, and retained Pass 07 geometry.

A separate deterministic boulder-only run advanced the chase to its exact final point.

- path progress: 100%
- final boulder coordinate: `(9300, 5000)`
- floors collapsed: 31/31
- supports destroyed: 13/13
- resets: 0

These values verify explicit code conditions and are not a visual-quality score.

### C. Helper-coordinate focused checks

Helper coordinates were used only for isolated diagnostics.

- camera framing: placed the player near Zone 05, then used actual D input; camera zoom was approximately 0.844 and displayed both actors with a 1,037 px gap
- contact: placed the player in the boulder contact radius; one contact produced one catch and one reset to `(600, 852)`

Neither focused test is reported as a full traversal.

## Remaining limits

- Only Zones 01–06 have playable collision; Zones 07–10 remain blueprint data.
- The Pass 08 exit is a temporary chase seal, not the collapsing bridge finale.
- The final keyboard run seals the chase at 94.74%; full 100% boulder travel was verified separately as a deterministic function test.
- Destruction uses graybox fragments and simple screen shake rather than final animation, sound, dust, or structural art.
- Enemies, damage, checkpoints, audio, cinematic camera, and the final bridge are not implemented here.
- The current run proves the six-zone graybox slice, not the complete 15–20 minute map.

## Evidence

- `pass-08-browser-results.json`
- `pass-08-focused-results.json`
- `assets/pass08-start.png`
- `assets/pass08-support-collapse.png`
- `assets/pass08-close-chase.png`
- `assets/pass08-late-chase.png`
- `assets/pass08-exit.png`
- `assets/pass08-blueprint.png`
