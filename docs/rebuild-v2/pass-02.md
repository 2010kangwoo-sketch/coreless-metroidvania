# Rebuild V2 — Pass 02 World Blueprint

## Goal

Pass 02 converts the two approved references into one deterministic world-coordinate blueprint. It does not add playable collision geometry yet.

- panoramic reference: one giant, readable ten-zone structure
- chase sketch: buried structure, spike steps, jump-plus-dash gap, dual grapple, spike ramp, and a giant curved turnaround
- world size: `26000 × 7800`
- coordinate convention: positive Y points downward

## Previous-pass check

Pass 01 was opened in Chromium before this pass was implemented.

- actual browser keys: `D`, `Space`, `Shift`, `A`, `R`
- input probe: 5 keydown / 5 keyup
- runtime audit: 10/10
- console errors: 0
- page errors: 0

No Pass 01 regression was found, so no foundation fix was required before adding the blueprint.

## Implemented structure

The route is stored as ten connected zones. Every zone exit is lower than its entry, and every exit exactly equals the next zone's entry.

1. start slope
2. double wall climb
3. buried rise structure
4. uneven tunnel
5. destruction maze
6. giant curved turnaround and dash run
7. precision parkour
8. enemy and turret hall
9. long descent chase
10. collapsing bridge

The apparent local rises inside zones 2, 3, 5, 7, 8, and 9 are intentional. They add vertical rhythm without breaking the global descending structure.

The boulder corridor is represented separately from the player polyline, but both use the same macro structure and converge at zone connections. It is a design reference only; no boulder physics are active in this pass.

## Pass 08 reservations

Six chase features from the handwritten sketch are reserved in world space:

- buried structure
- spike steps
- jump plus air dash gap
- giant curved turnaround
- two consecutive grapples
- spike ramp

These boxes reserve topology, not final geometry. Pass 08 must replace them with continuous collision surfaces and destructive corridors after player movement has been implemented and measured.

## Browser verification

Chromium was controlled with real browser keyboard events.

- keys: `D`, `Space`, `Shift`, `A`, `R`, `B`, `B`
- checked scope: canvas focus, input delivery, detail-layer toggle, render loop
- traversal scope: none; there is no movable player in Pass 02
- runtime audit: 10/10
- blueprint audit: 18/18
- console errors: 0
- page errors: 0

The `B` key hides and restores zone labels and reserved-feature overlays. This verifies a real state-changing keyboard path without claiming playable route completion.

## Deterministic verification

The 18 blueprint conditions cover:

- world and camera bounds
- ten unique zones in the approved order
- all zone and feature bounds inside the world
- entries and exits inside their zones
- exact adjacent-zone connections
- lower exit for every macro zone
- route endpoints and world containment
- boulder corridor world containment
- six Pass 08 reservations

## Limits carried forward

- There is no player body, collision, camera tracking, checkpoint, or gameplay completion in Pass 02.
- Route lines are topology data, not final floor collision.
- The boulder corridor is not a physics simulation and does not yet prove that the boulder follows the floor.
- The 18/18 blueprint result proves data constraints only, not game quality or difficulty.
- A full uninterrupted keyboard completion is impossible at this stage and is not claimed.

## Evidence

- `pass-02-browser-results.json`
- `assets/pass02-world-blueprint.png`
- `assets/pass02-details-off.png`
