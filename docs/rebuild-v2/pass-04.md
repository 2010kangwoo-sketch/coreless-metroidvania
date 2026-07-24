# Rebuild V2 — Pass 04 Buried Rise Structure

## Goal

Pass 04 converts Zone 03 into the first giant buried interior graybox while retaining the playable Zones 01–02.

- exact entry: `(4400, 3100)`
- highest traversable floor: `y = 1600`
- exact exit: `(10400, 3300)`
- route shape: buried entry → long interior rise → two jump gaps → upper gallery → long descent → lower exit
- playable bounds: Zones 01–03 within the retained `26000 × 7800` world blueprint

This is collision-first graybox work. It establishes scale, route readability, and the structure’s roof/floor relationship; it is not final terrain art.

## Previous-pass check

The Pass 03 branch state was checked and opened in Chromium before implementation.

- actual keyboard route: start slope → first wall climb → second wall climb → Pass 03 exit
- runtime audit: 12/12
- blueprint audit: 18/18
- Pass 03 audit: 20/20
- resets: 0
- console errors: 0
- page errors: 0

## Problems found and fixed

1. The Pass 03 collision exit ended at `x = 4480`, while the world blueprint’s Zone 02→03 connection is `x = 4400`. The final descent and completion gate now meet the exact blueprint coordinate.
2. The first Zone 03 gap initially placed its landing 50 px above the takeoff floor, reducing the usable jump arc more than intended. Both gap landings now begin level with their takeoff floors while the 90 px and 110 px empty spans remain and still require jumps.
3. Large foreground graybox polygons could overlap the HTML status panel in screenshots. Explicit stacking keeps the HUD and control hint readable.

## Implemented structure

Zone 03 is one buried building rather than a tower placed on top of the exterior floor.

- the entry continues directly from the Zone 02 floor at `(4400, 3100)`
- seven connected roof segments define an overburden contour above the traversable route
- thirteen connected floor segments form the single forward path
- six large frame volumes establish rooms, columns, galleries, and interior scale
- the path rises approximately 1500 px to the upper gallery, then descends approximately 1700 px to an exit lower than the entry
- two gaps of 90 px and 110 px interrupt the climb without creating alternate floors or safe branches

The structure currently has no chase boulder. Pass 08 remains the reserved chase graybox stage.

## Actual Chromium keyboard traversal

No helper-coordinate movement was used.

- route: start slope → double wall climb → buried entry → lower rise → first gap → atrium gap → upper gallery → long interior descent → Pass 04 exit
- keys used: A, D, Space, Shift, B
- final player position: approximately `(10421.03, 3252)`
- ground jumps: 8
- wall jumps: 2
- ledge assists: 2
- dashes: 5
- resets/deaths: 0
- console errors: 0
- page errors: 0

The keyboard driver only read state to choose subsequent real browser key events. It did not assign player coordinates or use a movement helper.

## Deterministic verification

- runtime audit: 13/13
- retained blueprint audit: 18/18
- retained Pass 03 audit: 20/20
- Pass 04 structure audit: 22/22

The Pass 04 audit checks world and camera containment, exact blueprint entry/exit coordinates, lower exit, floor ordering and bounds, a single forward route, both jump gaps and their widths, rise height, buried roof continuity and span, six architecture frames, milestone order, retained spawn, and retained Pass 03 geometry.

These counts prove specific code conditions only. They do not describe final visual quality.

## Remaining limits

- Only Zones 01–03 have playable collision; Zones 04–10 remain blueprint data.
- This pass is deliberately sparse graybox geometry, not the illustrated high-quality environment target.
- Enemies, damage, checkpoints, audio, destruction, and active boulder physics are not implemented in this pass.
- The final run proves the current three-zone slice, not the full 15–20 minute map.

## Evidence

- `pass-04-browser-results.json`
- `assets/pass04-start.png`
- `assets/pass04-first-climb.png`
- `assets/pass04-second-climb.png`
- `assets/pass04-zone03-entry.png`
- `assets/pass04-lower-rise.png`
- `assets/pass04-atrium.png`
- `assets/pass04-upper-gallery.png`
- `assets/pass04-exit.png`
- `assets/pass04-blueprint.png`
