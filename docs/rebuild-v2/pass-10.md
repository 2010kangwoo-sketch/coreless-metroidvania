# Rebuild V2 — Pass 10 Chase Double Wall

## Goal

Pass 10 extends the active chase from the Pass 09 exit through a second buried structure containing two consecutive required wall-climb successes.

- structure entry: `(15200, 5500)`
- structure exit: `(23600, 5900)`, 400 px below the entry
- player flow: entry descent → shaft one → wall-jump exit → descending connector → shaft two → wall-jump exit → uneven lower hall → exit shelf
- boulder flow: the same buried structure's 400 px destruction corridor, through both shaft basins and the lower hall
- presentation: collision-first graybox; terrain art remains deferred

The structure begins at the current external floor height. It is not a tower placed above the route. The two shaft pits have no lower bypass floor, and the second shaft cannot be entered until the first shaft has been cleared.

## Previous-pass check

The remote branch and Draft PR were checked before implementation.

- previous branch head: `3909e2c6505710d52af244b276b4ae7acac561c9`
- PR #1 state: open, draft, unmerged
- fresh Pass 09 Chromium baseline: start-to-exit actual-keyboard traversal passed
- baseline helper movement: none
- baseline resets: 0
- baseline boulder catches: 0
- baseline console/page errors: 0/0

No Pass 01–09 collision or movement system was removed. Zone 08 collision activates only after Pass 09 completion.

## Implemented structure

### Two required wall-climb successes

- shaft one floor: `y=6200`; exit lip: `y=5840`; required rise: 360 px
- shaft two floor: `y=6600`; exit lip: `y=6200`; required rise: 400 px
- normal ballistic jump rise: approximately 114.89 px
- effective wall corridor width: 220 px for both shafts
- solid walls: four, arranged as two complete pairs
- each success has an independent drop and clear milestone
- chase-only wall jumps are counted separately from the retained Pass 03 wall jumps

The two lip tops use the retained ledge-assist rule after the player wall-jumps into the final 72 px range. This prevents a successful climb from depending on an extra dash recharge while preserving the required wall-jump ascent.

### Player floor route

- 10 Zone 08 floor pieces
- entry slope, two shaft floors, two exit lips, descending connector, three uneven lower-hall pieces, and a 600 px temporary exit shelf
- the exit shelf starts at the exact blueprint exit and exists only to hold the player while the boulder reaches the completion threshold
- no floor bridges across either shaft

### Boulder and collapse route

- Pass 09 active route retained: 40 points
- Pass 10 combined route: 53 points
- combined distance: approximately 46,988.79 px
- Pass 10 extension: approximately 9,375.67 px
- corridor width: 400 px
- combined collapse panels: 50
- combined destructible support targets: 27
- four new support-break pauses: 1800, 260, 600, and 900 frames

The long entrance pause represents the boulder breaking the entry reinforcement behind the player. The boulder then follows the physical shaft basins and lower hall. It does not teleport, change lanes in the air, or follow a detached guide line.

## Problems found and fixed

1. The initial 460 px shaft width was too wide for reliable wall-to-wall transfer. Both shafts were reduced to a 220 px effective width while retaining rises more than three times the normal jump rise.
2. The first connector and second pit initially collapsed before the player used them. Their explicit collapse triggers were moved later in the boulder corridor order.
3. The boulder initially reached the exact exit before the player. Support-break pauses were moved to the structure entry and second-shaft approach so it remains behind in the same physical route.
4. The player initially ran past the exact exit while waiting for boulder progress. A 600 px temporary exit shelf was added after the blueprint exit.
5. A focused run exposed a lip-mass horizontal re-collision. Zone 08 lip masses now use the retained ledge horizontal treatment.
6. The first full start-to-exit Pass 10 run failed in shaft two. The player repeatedly reached within 21 px of the lip but could not regain an air dash. The retained 72 px ledge assist was extended to Zone 08 walls. The failed run is not reported as a completion.

## Verification categories

### A. Actual Chromium keyboard traversal

The final run began at the game spawn and used no helper-coordinate movement.

- route: start slope → Zones 01–07 → Pass 09 boundary → shaft one → connector → shaft two → lower hall → Pass 10 exit
- actual browser keys recorded: A, D, Space, Shift, B
- final player position: approximately `(23591.98, 5852)`
- chase wall jumps: 11
- total wall jumps including retained Pass 03: 13
- ledge assists including retained geometry: 3
- boulder route progress at seal: approximately 95.01%
- floors collapsed behind player: 44/50
- supports destroyed: 26/27
- retained internal direction changes: 2
- retained dash gaps: 3/3
- retained destruction gates: 3/3
- boulder catches: 0
- resets/deaths: 0
- console errors: 0
- page errors: 0
- overall result: passed

One earlier full run failed in shaft two and reset once. Only the later clean run is the successful A result.

### B. Deterministic verification

- runtime audit: 19/19
- blueprint audit: 18/18
- retained Pass 03 audit: 20/20
- retained Pass 04 audit: 22/22
- retained Pass 05 audit: 25/25
- retained Pass 06 audit: 28/28
- retained Pass 07 audit: 28/28
- retained Pass 08 audit: 24/24
- retained Pass 09 audit: 28/28
- Pass 10 audit: 30/30

The Pass 10 audit checks exact blueprint joins, the lower exit, buried ceiling height, ten player floors, two complete wall pairs, two forced shafts, jump-rise requirements, no bypass floors, six architecture frames, the 400 px boulder corridor, 14 corridor points, physical descent through both basins, segment length limits, eight new supports, the 53-point combined chase path, all collapse mappings, four new breakpoints, milestone ordering, and world bounds.

These values verify code conditions and do not claim final visual quality.

### C. Helper-coordinate focused check

The focused test placed the player and boulder near the Pass 09 exit. All movement after placement used actual A/D/Space/Shift events.

- route: Pass 09 exit → both wall-climb successes → lower hall → Pass 10 exit
- final position: approximately `(23590.88, 5852)`
- chase wall jumps: 15
- boulder progress: approximately 95.01%
- collapsed floors: 44
- destroyed supports: 26
- catches: 0
- resets: 0
- console/page errors: 0/0
- result: passed

This focused result is not reported as a full traversal.

## Remaining limits

- Only Zones 01–08 have playable collision. Zones 09–10 remain blueprint data.
- The long entrance support break is graybox chase pacing and requires later human difficulty tuning.
- The temporary exit shelf is a Pass 10 terminus, not the final next-zone transition.
- The chase seals at the Pass 10 exit; the giant later descent and collapsing bridge are not implemented.
- Collapse debris, supports, dust, and screen shake are placeholder graybox effects.
- Enemies, turret encounter logic, damage, audio, cinematic camera, and final art are not implemented in this pass.
- This run proves the eight-zone graybox slice, not the complete 15–20 minute map.

## Evidence

- `pass-10-browser-results.json`
- `pass-10-focused-results.json`
- `assets/pass10-start.png`
- `assets/pass10-shaft-one-drop.png`
- `assets/pass10-shaft-one-clear.png`
- `assets/pass10-shaft-two-drop.png`
- `assets/pass10-shaft-two-clear.png`
- `assets/pass10-lower-hall.png`
- `assets/pass10-exit.png`
- `assets/pass10-focused-exit.png`
- `assets/pass10-blueprint.png`
