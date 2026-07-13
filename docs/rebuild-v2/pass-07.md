# Rebuild V2 — Pass 07 Giant Curve and Dash Run

## Goal

Pass 07 converts Zone 06 into the first physical direction-change section while retaining Zones 01–05.

- exact entry: `(24800, 4400)`
- exact exit: `(9300, 5000)`
- upper flow: rightward approach → progressively steeper curve → physical drop
- lower flow: landing → one direction change → leftward uneven run
- required movement: three jump-plus-air-dash gaps
- boulder route: a 420 px-wide curve corridor on the same macro descent
- active boulder: deliberately disabled until Pass 08

The route is still graybox geometry. Pass 07 establishes the physical floor, collision-lane transition, and chase corridor before chase logic or final terrain art is added.

## Previous-pass check

The remote branch and Draft PR were checked before implementation.

- previous branch head: `41a9475f5f997b17f5aec2df039b9c66789e1760`
- PR #1 state: open, draft, unmerged
- local Pass 06 source matched the remote branch

Pass 06 was then replayed in Chromium with actual keyboard events.

- route: start slope → double wall climb → buried rise → moving platform → uneven tunnel → three destruction gates → Pass 06 exit
- helper-coordinate movement: not used
- final position: approximately `(24823.76, 4352)`
- dash gates destroyed: 3/3
- resets: 0
- runtime audit: 15/15
- blueprint audit: 18/18
- retained audits: 20/20, 22/22, 25/25, 28/28
- console errors: 0
- page errors: 0

## Implemented structure

### Physical giant curve

- three connected upper floor segments continue right from the Pass 06 exit
- the approach becomes progressively steeper instead of turning at a right angle
- the route drops to a broad lower landing at the world edge
- the player then reverses once and traverses the lower lane from right to left
- the lower exit is 600 px below the entry
- six large structural frames establish the scale of the curve chamber

### Collision-lane transition

The upper and lower routes overlap horizontally, so collision is activated by traversal state.

- the lower lane becomes solid after the player commits to the curve
- the upper Zone 06 lane is disabled after the physical drop
- retained Zones 01–05 floors are also disabled after the drop
- this prevents old upper floors from catching the player during the lower leftward run
- no coordinate teleport is used by the runtime

### Three mandatory air-dash gaps

- east gap: 260 px
- middle gap: 260 px
- west gap: 250 px
- calculated run-only jump distance: approximately 196.69 px
- configured dash distance: approximately 136.4 px

Each gap is wider than the calculated run-only jump reach. The tested input sequence is a leftward jump followed by an in-air dash.

### Reserved boulder curve

- width: 420 px
- center path: 21 connected points
- shares the upper approach, curve, landing, and lower macro route
- no airborne lane change or teleport is encoded
- `activeBoulder` remains `false`

## Problems found and fixed during verification

1. The first curve landing ended too early. Rightward momentum carried the player beyond the landing and caused a reset. The landing and curve apex were extended to the world boundary.
2. A lower-landing screenshot paused movement while the player was still airborne. Evidence capture now waits until the player is grounded.
3. Air dash reset vertical velocity to zero both at activation and on every dash frame. This flattened the jump and made the first mandatory gap fail. Air dash now preserves upward velocity and applies reduced gravity during the dash; grounded dash behavior remains unchanged.
4. Initial gap widths were reduced from 280–290 px to 250–260 px. They remain wider than calculated run-only reach but provide a reproducible, non-frame-perfect jump-dash window.

The failed attempts are not counted as completions.

## Verification categories

### A. Actual Chromium keyboard traversal

The final completion run used no helper-coordinate movement.

- route: start slope → Zones 01–05 → giant curve → physical drop → lower leftward run → east, middle, and west jump-dash gaps → Pass 07 exit
- actual keys: A, D, Space, Shift, B
- final player position: approximately `(9297.27, 4950.76)`
- direction changes in Zone 06: 1
- Pass 07 dash gaps cleared: 3/3
- retained destruction gates: 3/3
- moving-platform rides: 1
- ground jumps: 13
- wall jumps: 2
- dashes: 10
- resets/deaths: 0
- console errors: 0
- page errors: 0

The driver read runtime state only to decide which real browser key event to send next. It did not assign player coordinates during the completion run.

### B. Deterministic verification

- runtime audit: 16/16
- retained blueprint audit: 18/18
- retained Pass 03 audit: 20/20
- retained Pass 04 audit: 22/22
- retained Pass 05 audit: 25/25
- retained Pass 06 audit: 28/28
- Pass 07 level audit: 28/28

The Pass 07 audit checks exact entry and exit coordinates, the lower exit, separate collision lanes, connected upper approach, lower-route endpoints, three floor-matched dash gaps, curve width and world bounds, one physical direction change, visible vertical drop, lower landing, six architecture frames, milestone coordinates, and retained Pass 06 geometry.

These values verify explicit code conditions only. They are not a visual-quality or game-completion score.

### C. Helper-coordinate focused checks

Helper coordinates were used only before the final run to isolate two faults.

- curve check: placed near the Zone 06 entry, then used actual D and A inputs to confirm the extended physical landing
- east-gap check: placed immediately before the gap, then used actual A, Space, and Shift inputs to confirm the air-dash fix

Neither focused check is reported as a route completion. The final A-category run started at the game spawn and used no helper movement.

## Remaining limits

- Only Zones 01–06 have playable collision; Zones 07–10 remain blueprint data.
- The boulder curve and earlier collapse corridor are reserved geometry, not an active chase.
- The broad curve shows the required macro motion but still needs terrain-shape refinement and final art.
- Enemies, damage, checkpoints, audio, destruction, camera shake, and bridge finale are not part of Pass 07.
- The final run proves the current six-zone slice, not the complete 15–20 minute map.

## Evidence

- `pass-07-browser-results.json`
- `assets/pass07-start.png`
- `assets/pass07-curve-entry.png`
- `assets/pass07-curve-drop.png`
- `assets/pass07-lower-landing.png`
- `assets/pass07-dash-gap-one.png`
- `assets/pass07-dash-gap-two.png`
- `assets/pass07-dash-gap-three.png`
- `assets/pass07-exit.png`
- `assets/pass07-blueprint.png`
