# Rebuild V2 — Pass 09 First Internal Descent

## Goal

Pass 09 extends the active chase from the Pass 08 exit through the first buried internal structure.

- structure ceiling: the external surface height, `y=5000`
- player flow: right upper gallery → physical drop → left middle return → physical drop → right lower run
- boulder flow: leftward entry curve → low U-turn → rightward broad destruction corridor
- structure exit: `(15200, 5500)`, 500 px below the entrance
- presentation: collision-first graybox; final terrain art remains deferred

The structure is not a tower placed above the ground. Its roof begins at the external floor height, and both player and boulder stay inside the same large descending structure.

## Previous-pass check

The remote branch and Draft PR were checked before implementation.

- previous branch head: `729dd38fe9ffaec1aeee0d4b6b8d37f3d90d1c56`
- PR #1 state: open, draft, unmerged
- retained Pass 08 Chromium completion: final position approximately `(9297.20, 4950.77)`, reset 0, catch 0, runtime audit 17/17, Pass 08 audit 24/24, console errors 0

No retained Pass 08 geometry or systems were replaced. Zone 07 collision is inactive until Pass 08 completion so overlapping world coordinates cannot interfere with the earlier route.

## Implemented structure

### Player route

- upper lane: three connected floors from `(9300, 5000)` to `(11650, 5450)`
- first drop: a wide landing apron reaches `x=12100` so ordinary running momentum cannot overshoot it
- middle lane: one continuous return floor from right to left, descending from `y=5900` to `y=6000`
- second drop: approximately 450 px into the lower landing
- lower lane: five connected uneven floors returning right to the exit
- required physical direction changes: two
- three ceiling solids and five architecture frames establish separate player passages inside the larger structure

The upper, middle, and lower lanes are vertically separated from the boulder corridor. No collision exception lets the player pass through the boulder.

### Boulder route

- Pass 08 path retained: 30 points
- Pass 09 extension: 10 new segments / 11 structure points
- combined active path: 40 points
- combined distance: approximately 37,613.12 px
- Pass 09 extension distance: approximately 6,833.75 px
- corridor width: 380 px
- entry direction change: a physical low U-turn at `(9000, 5200)` rather than teleportation
- exit: exact player-route exit `(15200, 5500)`

The boulder holds for 220 frames while breaching the entrance. Three later reinforcement impacts pause it for 160, 160, and 240 frames. These pauses occur on the same physical corridor and represent support destruction; they compensate for the player's longer three-level route without moving the boulder to a separate guide line.

### Rear collapse

- combined collapse panels: 40
- combined support targets: 19
- Zone 07 panels use explicit corridor-order triggers rather than nearest-coordinate selection
- collapse order: entry surface → upper ramp → upper gallery → middle return → lower landing → lower waves → exit rise
- floors behind the player lose collision and generate graybox debris
- support impacts generate debris and screen shake

## Problems found and fixed

1. Zone 07 collision initially existed during the earlier route because world x-coordinates overlap. Zone 07 floors and ceilings now activate only after Pass 08 completion.
2. The original shallow upper lane crossed the incoming Pass 08 boulder path. The player now descends immediately after the entrance, creating real vertical separation inside the same structure.
3. The first middle landing ended too close to the upper ledge. Running momentum could overshoot it and land on a ceiling. Its right landing apron now extends to `x=12100`.
4. Nearest-coordinate collapse mapping selected lower floors before the player used them. Zone 07 panels now follow explicit boulder corridor order.
5. The boulder corridor is shorter than the player's three-level route and could reach the exit first. Three visible reinforcement-break pauses keep it behind the player without teleporting or changing lanes.
6. An early full-run verifier attempt released jump too soon at the retained Pass 04 90 px gap. The test now begins the actual Space key event before the edge and holds it through the crossing; game collision was not widened.

Failed and diagnostic runs are retained as development evidence and are not reported as completions.

## Verification categories

### A. Actual Chromium keyboard traversal

The final run began at the game spawn and used no helper-coordinate movement.

- route: start slope → Zones 01–06 → active Pass 08 chase → Pass 08 boundary → Zone 07 upper lane → first drop → middle return → second drop → lower run → Pass 09 exit
- actual browser keys: A, D, Space, Shift, B
- completion trigger: player passed `x=15170` at the lower exit
- captured final debug position after the exit/blueprint checks: approximately `(15233.32, 5951.32)`
- boulder route progress at seal: approximately 98.10%
- floors collapsed behind player: 36/40
- supports destroyed: 18/19
- internal direction changes: 2
- retained dash gaps: 3/3
- retained destruction gates: 3/3
- boulder catches: 0
- resets/deaths: 0
- console errors: 0
- page errors: 0
- overall result: passed

The post-completion debug coordinate is sampled after opening and closing the blueprint. The exit screenshot records the player at the exit ledge before that extra wait.

### B. Deterministic verification

- runtime audit: 18/18
- blueprint audit: 18/18
- retained Pass 03 audit: 20/20
- retained Pass 04 audit: 22/22
- retained Pass 05 audit: 25/25
- retained Pass 06 audit: 28/28
- retained Pass 07 audit: 28/28
- retained Pass 08 audit: 24/24
- Pass 09 audit: 28/28

The Pass 09 audit checks exact blueprint joins, a lower exit, three upper floors, one middle return, five lower floors, two physical drops, three ceiling solids, five frames, a 380 px boulder corridor, an 11-point physical U-turn, six new supports, a 40-point combined chase path, strict cumulative distances, all collapse mappings, and the entrance breach delay.

These values verify explicit code conditions, not visual quality or full-map completion.

### C. Helper-coordinate focused check

One focused test placed the player at the Pass 08 exit `(9302, 4952)` and the boulder at the Pass 09 path start. All movement after placement used actual D → A → D keyboard events.

- final position: approximately `(15183.47, 5454.38)`
- boulder progress: approximately 98.38%
- internal direction changes: 2
- collapsed floors: 36
- destroyed supports: 18
- catches: 0
- resets: 0
- console/page errors: 0

This focused test is not reported as a full traversal.

## Remaining limits

- Only Zones 01–07 have playable collision; Zones 08–10 remain blueprint data.
- Pass 09 implements the first internal descent only. The Pass 10 double-wall structure and later chase mechanics are not present.
- The chase seals at the Zone 07 exit; the final collapsing bridge sequence is still deferred.
- Continuing beyond the temporary exit ledge has no next-zone floor yet.
- Destruction, dust, supports, and screen shake are graybox effects without final animation, sound, or structural art.
- Enemies, damage, checkpoints, audio, cinematic camera, and the final bridge are not implemented in this pass.
- This run proves the seven-zone graybox slice, not the complete 15–20 minute map.

## Evidence

- `pass-09-browser-results.json`
- `pass-09-focused-results.json`
- `assets/pass09-start.png`
- `assets/pass09-internal-entry.png`
- `assets/pass09-structure-breach.png`
- `assets/pass09-first-drop.png`
- `assets/pass09-middle-return.png`
- `assets/pass09-second-drop.png`
- `assets/pass09-lower-run.png`
- `assets/pass09-exit.png`
- `assets/pass09-blueprint.png`
