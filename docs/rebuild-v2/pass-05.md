# Rebuild V2 — Pass 05 Uneven Tunnel and Moving Platform

## Goal

Pass 05 extends the first buried mega-structure through Zone 04 while retaining playable Zones 01–03.

- exact entry: `(10400, 3300)`
- exact exit: `(13400, 3700)`
- route: structure descent → low compression tunnel → moving-platform shaft → uneven gallery → short and long timing gaps → lower exit
- playable bounds: Zones 01–04 inside the retained `26000 × 7800` world blueprint

This remains collision-first graybox work. The new arches and structural frames establish scale and route silhouette but are not final environment art.

## Previous-pass check

The remote branch and Draft PR were checked before implementation. The branch head was `6ed0e7c83b8b056b1091d94cb70c019ad9851864` and the PR remained open, draft, and unmerged.

Pass 04 was then replayed in Chromium with actual keyboard events.

- route: start slope → double wall climb → buried rise → upper gallery → Pass 04 exit
- helper-coordinate movement: not used
- resets: 0
- runtime audit: 13/13
- blueprint audit: 18/18
- Pass 03 audit: 20/20
- Pass 04 audit: 22/22
- console errors: 0
- page errors: 0

## Implemented structure

### Low compression tunnel

- two collision ceiling beams
- clearances of 80 px and 70 px above a 48 px player
- full-height jumping is constrained, while ordinary running remains possible
- the ceiling stays below the exterior overburden and reads as part of the buried building

### Moving-platform shaft

- shaft width: 440 px
- moving carriage width: 180 px
- horizontal travel: 260 px
- speed: 2.15 px/frame
- normal jump plus dash distance is insufficient to bypass the full shaft
- player position is carried by the platform’s frame delta while standing on it

### Uneven gallery

- alternating descents and rises instead of a flat corridor
- 90 px short-timing gap
- 110 px long-timing gap
- short flat landing zones precede the next steep slope, preventing collision results from depending on a single landing frame
- Zone 04 exits at `(13400, 3700)`, below its entry

### Architectural silhouette

- seven connected roof segments
- four large interior frames
- curved arch lines around the shaft and uneven gallery
- a single forward route with no alternate lower floor

## Problems found and fixed during verification

1. HTML HUD text could be captured between Canvas and DOM composition frames. The game shell now uses an isolated stacking context, and evidence capture waits for a stable frame with movement input released.
2. The first precision-gap landing originally continued immediately into a steep descent. Depending on the exact landing frame, the player could cross below the surface before floor detection. Short flat landing segments were added after both gaps.
3. An evidence-capture delay initially left D held, causing the test player to run into the next gap before the next input decision. Screenshot capture now releases directional input first.
4. Early jump input could complete its arc before reaching the landing. The final keyboard route distinguishes short and long holds near each takeoff edge.

Failed verification attempts and their reset results were not counted as completions. Only the final uninterrupted run is reported below.

## Actual Chromium keyboard traversal

No helper-coordinate movement was used for the completion run.

- route: start slope → double wall climb → buried rise → low tunnel → moving-platform shaft → uneven gallery → short gap → long gap → Pass 05 exit
- keys used: A, D, Space, Shift, B
- final player position: approximately `(13420.02, 3652)`
- moving-platform rides: 1
- ground jumps: 12
- wall jumps: 2
- ledge assists: 2
- dashes: 5
- resets/deaths: 0
- console errors: 0
- page errors: 0

The driver read state only to choose subsequent real browser key events. It did not assign player coordinates during the completion run.

A separate helper-coordinate placement was used only once to isolate the HUD composition problem. It was not used to reach any gameplay milestone or exit.

## Deterministic verification

- runtime audit: 14/14
- retained blueprint audit: 18/18
- retained Pass 03 audit: 20/20
- retained Pass 04 audit: 22/22
- Pass 05 level audit: 25/25

The Pass 05 audit checks exact blueprint connections, lower exit, floor ordering, three distinct gap roles, mandatory moving-platform shaft width, carriage coverage and speed, low-ceiling clearance, roof continuity, architecture frames, milestone order, and retained Pass 04 geometry.

These counts describe explicit code conditions only and are not a visual-quality score.

## Remaining limits

- Only Zones 01–04 have playable collision; Zones 05–10 remain blueprint data.
- Environment geometry is still graybox-level.
- Enemies, damage, checkpoints, audio, destruction, and active boulder physics are not implemented in this pass.
- The final run proves the current four-zone slice, not the complete 15–20 minute map.

## Evidence

- `pass-05-browser-results.json`
- `assets/pass05-start.png`
- `assets/pass05-first-climb.png`
- `assets/pass05-second-climb.png`
- `assets/pass05-zone03-entry.png`
- `assets/pass05-lower-rise.png`
- `assets/pass05-atrium.png`
- `assets/pass05-upper-gallery.png`
- `assets/pass05-zone04-entry.png`
- `assets/pass05-low-tunnel.png`
- `assets/pass05-moving-platform.png`
- `assets/pass05-uneven-tunnel.png`
- `assets/pass05-exit.png`
- `assets/pass05-blueprint.png`
