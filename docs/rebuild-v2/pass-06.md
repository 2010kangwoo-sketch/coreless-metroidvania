# Rebuild V2 — Pass 06 Destruction Maze Foundation

## Goal

Pass 06 converts Zone 05 into a playable destruction-maze foundation while retaining Zones 01–04.

- exact entry: `(13400, 3700)`
- exact exit: `(24800, 4400)`
- player route: one continuous uneven corridor with three dash-break gates
- boulder route: a separate 360 px-wide collapse corridor inside the same structure
- active boulder: deliberately disabled until Pass 08

This is still graybox work. The broad corridor, supports, breakable gates, and roof frames establish physical relationships before chase logic and final artwork are added.

## Previous-pass check

The remote branch and Draft PR were checked before implementation.

- expected head: `8ea1ad0816af36d7c1aca07a8d974c7491011f25`
- PR state: open, draft, unmerged
- local Pass 05 blob matched the remote SHA

Pass 05 was then replayed in Chromium with actual keyboard events.

- route: start slope → double wall climb → buried rise → moving-platform shaft → uneven tunnel → Pass 05 exit
- helper-coordinate movement: not used
- final position: approximately `(13421.71, 3652)`
- resets: 0
- runtime audit: 14/14
- blueprint audit: 18/18
- retained audits: 20/20, 22/22, 25/25
- console errors: 0
- page errors: 0

## Implemented structure

### Player corridor

- sixteen connected floor segments across approximately 11,450 px
- repeated rises, sinks, ridges, and long descents
- a single forward route without an accessible lower bypass
- exit 700 px lower than the entry

### Dash-break gates

Three 52 × 180 px gates block the route.

- west gate: cross-brace silhouette
- middle gate: lattice silhouette
- east gate: split-pillar silhouette
- every gate is taller than normal jump rise plus player height
- touching a gate without dashing retains solid collision
- an active dash destroys the gate and removes its collision
- each destruction creates fifteen short-lived debris pieces

### Reserved collapse corridor

- width: 360 px
- center path: 10 connected points from the Zone 05 entry to exit
- seven differently framed support volumes
- located below and beside the player floor within the same large building
- drawn as a broad corridor rather than a separate airborne guide line
- `activeBoulder` remains `false`

### Structural silhouette

- ten connected roof segments
- eight large architecture frames
- curved arches and support crosses separate player and collapse volumes

## Problems found and fixed during verification

1. Capturing gate debris too early could save Canvas and HTML at different composition frames. New evidence capture releases movement and waits 220 ms.
2. Blueprint mode showed both the Canvas blueprint title and the HTML build panel. Blueprint mode now hides the HTML panel and restores it on return.
3. One high-gallery screenshot still omitted the HTML panel despite the stable gameplay state. That image was excluded from the evidence list; no completion or audit claim depends on it.

## Actual Chromium keyboard traversal

No helper-coordinate movement was used.

- route: start slope → double wall climb → buried rise → moving platform → uneven tunnel → west dash gate → lower hall → middle dash gate → high gallery → east dash gate → Pass 06 exit
- keys used: A, D, Space, Shift, B
- final player position: approximately `(24820.47, 4352)`
- dash gates destroyed: 3/3
- moving-platform rides: 1
- ground jumps: 8
- wall jumps: 2
- ledge assists: 2
- dashes: 7
- resets/deaths: 0
- console errors: 0
- page errors: 0

The keyboard driver only read state to decide subsequent real key events. It did not assign player coordinates or use a movement helper.

## Deterministic verification

- runtime audit: 15/15
- retained blueprint audit: 18/18
- retained Pass 03 audit: 20/20
- retained Pass 04 audit: 22/22
- retained Pass 05 audit: 25/25
- Pass 06 level audit: 28/28

The Pass 06 audit checks exact entry and exit coordinates, lower exit, sixteen connected player floors, three distinct dash gates, non-jumpable gate heights, inactive boulder state, corridor width and continuity, seven support volumes, roof continuity, eight architecture frames, milestone order, and retained Pass 05 geometry.

These values verify explicit code conditions only and are not a visual-quality score.

## Remaining limits

- Only Zones 01–05 have playable collision; Zones 06–10 remain blueprint data.
- The collapse corridor is reserved geometry, not an active chase.
- Corridor supports are visual reservations and are not yet destroyed by the boulder.
- Environment geometry is still graybox-level.
- Enemies, damage, checkpoints, audio, and final destruction effects are not implemented.
- The final run proves the current five-zone slice, not the complete 15–20 minute map.

## Evidence

- `pass-06-browser-results.json`
- `assets/pass06-start.png`
- `assets/pass06-moving-platform.png`
- `assets/pass06-zone05-entry.png`
- `assets/pass06-gate-one.png`
- `assets/pass06-gate-two.png`
- `assets/pass06-gate-three.png`
- `assets/pass06-exit.png`
- `assets/pass06-blueprint.png`
