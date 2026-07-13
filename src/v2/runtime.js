import { BUILD, PALETTE, STAGE_SEQUENCE, VIEWPORT } from "./config.js";
import { BOULDER_ROUTE, CHASE_FEATURES, PLAYER_ROUTE, WORLD, ZONES, validateBlueprint } from "./blueprint.js";
import { PASS03_LEVEL, PLAYER_PHYSICS, validatePass03Level } from "./pass03-level.js";
import { PASS04_ZONE, validatePass04Level } from "./pass04-level.js";
import { PASS05_ZONE, validatePass05Level } from "./pass05-level.js";
import { PASS06_ZONE, validatePass06Level } from "./pass06-level.js";
import { PASS07_ZONE, validatePass07Level } from "./pass07-level.js";
import { PASS08_CHASE, PASS08_LEVEL, validatePass08Level } from "./pass08-level.js";

const CONTROL_CODES = new Set(["KeyA", "KeyB", "KeyD", "Space", "ShiftLeft", "ShiftRight", "KeyR"]);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const approach = (value, target, amount) => value < target
  ? Math.min(value + amount, target)
  : Math.max(value - amount, target);

export class Pass08Runtime {
  constructor(canvas, statusElements) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.statusElements = statusElements;
    this.frameHandle = 0;
    this.frameCount = 0;
    this.running = false;
    this.keys = new Set();
    this.jumpQueued = false;
    this.dashQueued = false;
    this.blueprintVisible = false;
    this.resetCount = 0;
    this.boulderCatchCount = 0;
    this.inputProbe = { downs: 0, ups: 0, lastCode: null, usedCodes: new Set() };
    this.progress = this.createProgress();
    this.player = this.createPlayer();
    this.movingPlatforms = this.createMovingPlatforms();
    this.breakables = this.createBreakables();
    this.debris = [];
    this.chase = this.createChase();
    this.collapsedFloorIds = new Set();
    this.destroyedSupportIds = new Set();
    this.screenShake = 0;
    this.camera = { x: 0, y: 300, zoom: 1 };

    this.onKeyDown = event => {
      if (!CONTROL_CODES.has(event.code)) return;
      event.preventDefault();
      if (!event.repeat) {
        this.inputProbe.downs += 1;
        this.inputProbe.lastCode = event.code;
        this.inputProbe.usedCodes.add(event.code);
        if (event.code === "Space") this.jumpQueued = true;
        if (event.code === "ShiftLeft" || event.code === "ShiftRight") this.dashQueued = true;
        if (event.code === "KeyB") {
          this.blueprintVisible = !this.blueprintVisible;
          document.documentElement.classList.toggle("blueprint-open", this.blueprintVisible);
        }
        if (event.code === "KeyR") this.resetPlayer(true);
      }
      this.keys.add(event.code);
    };

    this.onKeyUp = event => {
      if (!CONTROL_CODES.has(event.code)) return;
      event.preventDefault();
      this.inputProbe.ups += 1;
      this.keys.delete(event.code);
      if (event.code === "Space" && this.player.vy < -5) {
        this.player.vy *= PLAYER_PHYSICS.jumpCutMultiplier;
      }
    };

    this.onPointerDown = () => this.canvas.focus();
  }

  createProgress() {
    return {
      zone01Reached: false,
      firstDropped: false,
      firstClimb: false,
      secondDropped: false,
      secondClimb: false,
      completed: false,
      zone03Entered: false,
      lowerRiseReached: false,
      atriumReached: false,
      upperGalleryReached: false,
      longDescentReached: false,
      pass04Completed: false,
      zone04Entered: false,
      lowTunnelReached: false,
      platformBoarded: false,
      movingPlatformCrossed: false,
      unevenTunnelReached: false,
      pass05Completed: false,
      zone05Entered: false,
      lowerHallReached: false,
      highGalleryReached: false,
      pass06Completed: false,
      zone06Entered: false,
      curveCommitted: false,
      zone06Dropped: false,
      eastDashGapCleared: false,
      middleDashGapCleared: false,
      westDashGapCleared: false,
      pass07Completed: false,
      chaseTriggered: false,
      boulderStarted: false,
      boulderEnteredCurve: false,
      boulderRoundedApex: false,
      boulderFinished: false,
      chaseEscaped: false,
      pass08Completed: false,
      floorsCollapsed: 0,
      supportsDestroyed: 0,
      dashGapClears: 0,
      directionChanges: 0,
      breakablesDestroyed: 0,
      platformRides: 0,
      groundJumps: 0,
      wallJumps: 0,
      ledgeAssists: 0,
      dashes: 0,
    };
  }

  createPlayer() {
    return {
      x: PASS08_LEVEL.spawn.x,
      y: PASS08_LEVEL.spawn.y,
      previousX: PASS08_LEVEL.spawn.x,
      previousY: PASS08_LEVEL.spawn.y,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: false,
      wallSide: 0,
      dashAvailable: true,
      dashFrames: 0,
      dashCooldown: 0,
      standingPlatformId: null,
    };
  }

  createMovingPlatforms() {
    return PASS08_LEVEL.movingPlatforms.map(item => ({
      ...item,
      x: item.xMin,
      previousX: item.xMin,
      direction: 1,
    }));
  }

  createBreakables() {
    return PASS08_LEVEL.breakables.map(item => ({ ...item, destroyed: false }));
  }

  createChase() {
    const start = PASS08_CHASE.path.points[0];
    return {
      triggered: false,
      active: false,
      sealed: false,
      delayFrames: PASS08_CHASE.boulder.spawnDelayFrames,
      activeFrames: 0,
      pathDistance: 0,
      pathIndex: 0,
      x: start.x,
      y: start.y,
      speed: PASS08_CHASE.boulder.baseSpeed,
      rotation: 0,
    };
  }

  start() {
    if (this.running) return;
    this.running = true;
    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp, { passive: false });
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.focus();
    this.snapCamera();
    this.frameHandle = requestAnimationFrame(() => this.frame());
  }

  frame() {
    if (!this.running) return;
    this.frameCount += 1;
    if (!this.blueprintVisible) this.step();
    this.draw();
    this.frameHandle = requestAnimationFrame(() => this.frame());
  }

  step() {
    const p = this.player;
    const config = PLAYER_PHYSICS;
    this.updateMovingPlatforms();
    this.updateDebris();
    p.previousX = p.x;
    p.previousY = p.y;
    const wasGrounded = p.grounded;
    const previousWall = p.wallSide;
    p.grounded = false;
    p.wallSide = 0;
    p.standingPlatformId = null;

    const moveAxis = (this.keys.has("KeyD") ? 1 : 0) - (this.keys.has("KeyA") ? 1 : 0);
    if (moveAxis !== 0) p.facing = moveAxis;

    if (this.dashQueued && p.dashAvailable && p.dashCooldown === 0) {
      p.dashFrames = config.dashFrames;
      p.dashAvailable = false;
      p.dashCooldown = config.dashCooldownFrames;
      p.vx = (moveAxis || p.facing) * config.dashSpeed;
      p.vy = wasGrounded ? 0 : Math.min(p.vy, 0);
      this.progress.dashes += 1;
    }
    this.dashQueued = false;

    if (this.jumpQueued) {
      if (wasGrounded) {
        p.vy = -config.jumpSpeed;
        p.grounded = false;
        this.progress.groundJumps += 1;
      } else if (previousWall !== 0) {
        p.vx = -previousWall * config.wallJumpX;
        p.vy = -config.wallJumpY;
        p.facing = -previousWall;
        this.progress.wallJumps += 1;
      }
    }
    this.jumpQueued = false;

    if (p.dashFrames > 0) {
      p.dashFrames -= 1;
      p.vy = Math.min(p.vy + config.gravity * 0.2, config.maxFallSpeed);
    } else {
      const acceleration = wasGrounded ? config.groundAcceleration : config.airAcceleration;
      if (moveAxis !== 0) p.vx = approach(p.vx, moveAxis * config.runSpeed, acceleration);
      else p.vx *= wasGrounded ? config.groundFriction : config.airFriction;
      if (Math.abs(p.vx) < 0.04) p.vx = 0;
      p.vy = Math.min(p.vy + config.gravity, config.maxFallSpeed);
      if (previousWall !== 0 && p.vy > config.wallSlideSpeed && moveAxis === previousWall) {
        p.vy = config.wallSlideSpeed;
      }
    }

    if (p.dashCooldown > 0) p.dashCooldown -= 1;
    this.moveHorizontal();
    this.moveVertical(wasGrounded);
    if (p.grounded) p.dashAvailable = true;
    this.updateProgress();
    this.updateBoulder();
    this.updateChaseCompletion();
    this.updateCamera();
    this.screenShake = Math.max(0, this.screenShake - 0.7);

    if (p.y > PASS08_LEVEL.bounds.y + PASS08_LEVEL.bounds.height + 120 || p.x < -120) {
      this.resetPlayer(false);
    }
  }

  updateDebris() {
    for (const piece of this.debris) {
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.vy += 0.34;
      piece.rotation += piece.spin;
      piece.life -= 1;
    }
    this.debris = this.debris.filter(piece => piece.life > 0);
  }

  updateBoulder() {
    const chase = this.chase;
    const config = PASS08_CHASE.boulder;
    if (!chase.triggered && this.progress.zone05Entered) {
      chase.triggered = true;
      this.progress.chaseTriggered = true;
    }
    if (!chase.triggered || chase.sealed) return;
    if (!chase.active) {
      chase.delayFrames -= 1;
      if (chase.delayFrames > 0) return;
      chase.active = true;
      this.progress.boulderStarted = true;
    }

    chase.activeFrames += 1;
    chase.speed = Math.min(config.maximumSpeed, config.baseSpeed + chase.activeFrames * config.accelerationPerFrame);
    chase.pathDistance = Math.min(PASS08_CHASE.path.totalDistance, chase.pathDistance + chase.speed);
    this.updateBoulderPosition();
    chase.rotation += chase.speed / config.radius;

    if (chase.pathDistance >= PASS08_CHASE.path.zone05EndDistance) this.progress.boulderEnteredCurve = true;
    if (chase.pathDistance >= PASS08_CHASE.path.curveApexDistance) this.progress.boulderRoundedApex = true;

    const floorThreshold = chase.pathDistance - config.floorCollapseLag;
    for (const panel of PASS08_CHASE.collapsePanels) {
      if (panel.triggerDistance > floorThreshold) break;
      if (this.collapsedFloorIds.has(panel.floorId)) continue;
      this.collapsedFloorIds.add(panel.floorId);
      this.progress.floorsCollapsed += 1;
      this.spawnCollapseDebris(panel.floorId, false);
    }

    const supportThreshold = chase.pathDistance - config.supportBreakLag;
    for (const support of PASS08_CHASE.supportTargets) {
      if (support.triggerDistance > supportThreshold) break;
      if (this.destroyedSupportIds.has(support.id)) continue;
      this.destroyedSupportIds.add(support.id);
      this.progress.supportsDestroyed += 1;
      this.spawnSupportDebris(support);
      this.screenShake = Math.max(this.screenShake, 8);
    }

    if (chase.pathDistance >= PASS08_CHASE.path.totalDistance) {
      this.progress.boulderFinished = true;
    }
    this.checkBoulderContact();
  }

  updateBoulderPosition() {
    const chase = this.chase;
    const distances = PASS08_CHASE.path.cumulativeDistances;
    const points = PASS08_CHASE.path.points;
    while (chase.pathIndex < distances.length - 2 && chase.pathDistance > distances[chase.pathIndex + 1]) {
      chase.pathIndex += 1;
    }
    const start = points[chase.pathIndex];
    const end = points[chase.pathIndex + 1] ?? start;
    const segmentStart = distances[chase.pathIndex];
    const segmentLength = Math.max(1, (distances[chase.pathIndex + 1] ?? segmentStart) - segmentStart);
    const ratio = clamp((chase.pathDistance - segmentStart) / segmentLength, 0, 1);
    chase.x = start.x + (end.x - start.x) * ratio;
    chase.y = start.y + (end.y - start.y) * ratio;
  }

  checkBoulderContact() {
    if (!this.chase.active || this.chase.sealed) return;
    const p = this.player;
    const nearestX = clamp(this.chase.x, p.x, p.x + PLAYER_PHYSICS.width);
    const nearestY = clamp(this.chase.y, p.y, p.y + PLAYER_PHYSICS.height);
    const contactRadius = PASS08_CHASE.boulder.radius + PASS08_CHASE.boulder.contactPadding;
    if (Math.hypot(this.chase.x - nearestX, this.chase.y - nearestY) >= contactRadius) return;
    this.boulderCatchCount += 1;
    this.resetPlayer(false);
  }

  updateChaseCompletion() {
    if (this.progress.pass08Completed || !this.progress.pass07Completed || !this.chase.active) return;
    const boulderProgress = this.chase.pathDistance / PASS08_CHASE.path.totalDistance;
    if (boulderProgress < PASS08_CHASE.completion.minimumBoulderProgress) return;
    this.progress.chaseEscaped = true;
    this.progress.pass08Completed = true;
    this.chase.active = false;
    this.chase.sealed = true;
  }

  spawnCollapseDebris(floorId, major) {
    const item = PASS08_LEVEL.floors.find(floorItem => floorItem.id === floorId);
    if (!item) return;
    const centerX = (item.x1 + item.x2) * 0.5;
    const centerY = (item.y1 + item.y2) * 0.5;
    const pieces = major ? 16 : 7;
    for (let index = 0; index < pieces; index += 1) {
      this.debris.push({
        kind: "chase",
        x: centerX + (index - pieces * 0.5) * 13,
        y: centerY + (index % 3) * 5,
        width: 12 + (index % 3) * 5,
        height: 7 + (index % 2) * 4,
        vx: (index - pieces * 0.5) * 0.22,
        vy: -2.8 - (index % 4) * 0.35,
        rotation: index * 0.28,
        spin: (index % 2 ? 1 : -1) * 0.055,
        life: 86,
      });
    }
  }

  spawnSupportDebris(support) {
    for (let index = 0; index < 14; index += 1) {
      this.debris.push({
        kind: "support",
        x: support.x + support.width * (0.2 + (index % 4) * 0.2),
        y: support.y + support.height * (0.15 + Math.floor(index / 4) * 0.2),
        width: 10 + (index % 3) * 7,
        height: 12 + (index % 4) * 8,
        vx: (index % 4 - 1.5) * 1.4,
        vy: -4.2 + Math.floor(index / 4) * 0.55,
        rotation: index * 0.18,
        spin: (index % 2 ? 1 : -1) * 0.07,
        life: 105,
      });
    }
  }

  updateMovingPlatforms() {
    const p = this.player;
    for (const platform of this.movingPlatforms) {
      platform.previousX = platform.x;
      platform.x += platform.direction * platform.speed;
      if (platform.x >= platform.xMax) {
        platform.x = platform.xMax;
        platform.direction = -1;
      } else if (platform.x <= platform.xMin) {
        platform.x = platform.xMin;
        platform.direction = 1;
      }
      if (p.standingPlatformId === platform.id) {
        p.x += platform.x - platform.previousX;
      }
    }
  }

  moveHorizontal() {
    const p = this.player;
    p.x += p.vx;
    for (const solid of PASS08_LEVEL.solids) {
      if (solid.role === "ledge") continue;
      const bottom = p.y + PLAYER_PHYSICS.height;
      const previousBottom = p.previousY + PLAYER_PHYSICS.height;
      if (previousBottom <= solid.y + 4 && bottom <= solid.y + 12) continue;
      if (!this.overlaps(p, solid)) continue;
      if (p.vx > 0) {
        const canAssist = solid.role === "wall" &&
          this.keys.has("KeyD") &&
          bottom > solid.y && bottom <= solid.y + 72 &&
          p.vy <= 8;
        if (canAssist) {
          p.x = solid.x + solid.width + 2;
          p.y = solid.y - PLAYER_PHYSICS.height;
          p.vx = Math.max(2.4, p.vx * 0.5);
          p.vy = 0;
          this.progress.ledgeAssists += 1;
          continue;
        }
        p.x = solid.x - PLAYER_PHYSICS.width;
        p.wallSide = 1;
      } else if (p.vx < 0) {
        p.x = solid.x + solid.width;
        p.wallSide = -1;
      }
      p.vx = 0;
    }
    for (const gate of this.breakables) {
      if (gate.destroyed || !this.overlaps(p, gate)) continue;
      if (p.dashFrames > 0) {
        this.destroyBreakable(gate);
        continue;
      }
      if (p.vx > 0) {
        p.x = gate.x - PLAYER_PHYSICS.width;
        p.wallSide = 1;
      } else if (p.vx < 0) {
        p.x = gate.x + gate.width;
        p.wallSide = -1;
      }
      p.vx = 0;
    }
    p.x = clamp(p.x, PASS08_LEVEL.bounds.x, PASS08_LEVEL.bounds.x + PASS08_LEVEL.bounds.width - PLAYER_PHYSICS.width);
  }

  destroyBreakable(gate) {
    if (gate.destroyed) return;
    gate.destroyed = true;
    this.progress.breakablesDestroyed += 1;
    const columns = 3;
    const rows = 5;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        this.debris.push({
          x: gate.x + (column + 0.5) * gate.width / columns,
          y: gate.y + (row + 0.5) * gate.height / rows,
          width: gate.width / columns - 2,
          height: gate.height / rows - 3,
          vx: (column - 1) * 1.8 + this.player.facing * 2.4,
          vy: -4.6 + row * 0.55,
          rotation: 0,
          spin: (column - 1) * 0.045,
          life: 70,
        });
      }
    }
  }

  moveVertical(wasGrounded) {
    const p = this.player;
    const previousBottom = p.y + PLAYER_PHYSICS.height;
    p.y += p.vy;

    for (const solid of PASS08_LEVEL.solids) {
      if (!this.overlaps(p, solid)) continue;
      if (p.vy >= 0 && previousBottom <= solid.y + 8) {
        p.y = solid.y - PLAYER_PHYSICS.height;
        p.vy = 0;
        p.grounded = true;
      } else if (p.vy < 0 && p.previousY >= solid.y + solid.height - 8) {
        p.y = solid.y + solid.height;
        p.vy = 0;
      }
    }

    for (const gate of this.breakables) {
      if (gate.destroyed || !this.overlaps(p, gate)) continue;
      if (p.vy >= 0 && previousBottom <= gate.y + 8) {
        p.y = gate.y - PLAYER_PHYSICS.height;
        p.vy = 0;
        p.grounded = true;
      } else if (p.vy < 0 && p.previousY >= gate.y + gate.height - 8) {
        p.y = gate.y + gate.height;
        p.vy = 0;
      }
    }

    for (const platform of this.movingPlatforms) {
      const horizontalOverlap = p.x + PLAYER_PHYSICS.width > platform.x && p.x < platform.x + platform.width;
      const bottom = p.y + PLAYER_PHYSICS.height;
      if (horizontalOverlap && p.vy >= 0 && previousBottom <= platform.y + 7 && bottom >= platform.y) {
        p.y = platform.y - PLAYER_PHYSICS.height;
        p.vy = 0;
        p.grounded = true;
        p.standingPlatformId = platform.id;
        if (!this.progress.platformBoarded) {
          this.progress.platformBoarded = true;
          this.progress.platformRides += 1;
        }
      }
    }

    const centerX = p.x + PLAYER_PHYSICS.width / 2;
    let bestFloor = null;
    for (const item of PASS08_LEVEL.floors) {
      if (!this.isFloorActive(item)) continue;
      if (centerX < item.x1 || centerX > item.x2) continue;
      const ratio = (centerX - item.x1) / (item.x2 - item.x1);
      const floorY = item.y1 + (item.y2 - item.y1) * ratio;
      const bottom = p.y + PLAYER_PHYSICS.height;
      const crossed = p.vy >= 0 && previousBottom <= floorY + 6 && bottom >= floorY;
      const following = wasGrounded && p.vy >= 0 && bottom >= floorY - 18 && bottom <= floorY + 28;
      if ((crossed || following) && (bestFloor === null || floorY < bestFloor)) bestFloor = floorY;
    }
    if (bestFloor !== null) {
      p.y = bestFloor - PLAYER_PHYSICS.height;
      p.vy = 0;
      p.grounded = true;
    }

    if (!p.grounded && p.wallSide === 0) {
      for (const solid of PASS08_LEVEL.solids) {
        const verticalOverlap = p.y + PLAYER_PHYSICS.height > solid.y + 2 && p.y < solid.y + solid.height - 2;
        if (!verticalOverlap) continue;
        if (Math.abs(p.x + PLAYER_PHYSICS.width - solid.x) <= 1.5) p.wallSide = 1;
        if (Math.abs(p.x - (solid.x + solid.width)) <= 1.5) p.wallSide = -1;
      }
    }
  }

  isFloorActive(item) {
    if (this.collapsedFloorIds.has(item.id)) return false;
    if (item.zone === 6) {
      if (item.lane === "lower") return this.progress.curveCommitted;
      return !this.progress.zone06Dropped;
    }
    if (this.progress.zone06Dropped && item.zone <= 5) return false;
    return true;
  }

  overlaps(player, solid) {
    return player.x < solid.x + solid.width &&
      player.x + PLAYER_PHYSICS.width > solid.x &&
      player.y < solid.y + solid.height &&
      player.y + PLAYER_PHYSICS.height > solid.y;
  }

  updateProgress() {
    const p = this.player;
    const bottom = p.y + PLAYER_PHYSICS.height;
    const gates = PASS08_LEVEL.gates;
    if (p.x >= PASS08_LEVEL.zone01Exit.x - 30) this.progress.zone01Reached = true;
    if (bottom >= gates.firstDropY && p.x < gates.firstExitX) this.progress.firstDropped = true;
    if (this.progress.firstDropped && p.x >= gates.firstExitX && bottom <= gates.firstExitY) this.progress.firstClimb = true;
    if (this.progress.firstClimb && bottom >= gates.secondDropY && p.x < gates.secondExitX) this.progress.secondDropped = true;
    if (this.progress.secondDropped && p.x >= gates.secondExitX && bottom <= gates.secondExitY) this.progress.secondClimb = true;
    if (this.progress.secondClimb && p.x >= gates.completionX && bottom >= gates.completionY) this.progress.completed = true;
    const zone03 = PASS04_ZONE.milestones;
    if (this.progress.completed && p.x >= zone03.enteredX) this.progress.zone03Entered = true;
    if (this.progress.zone03Entered && p.x >= zone03.lowerRiseX && bottom <= 2600) this.progress.lowerRiseReached = true;
    if (this.progress.lowerRiseReached && p.x >= zone03.atriumX && bottom <= 2100) this.progress.atriumReached = true;
    if (this.progress.atriumReached && p.x >= zone03.upperGalleryX && bottom <= 1700) this.progress.upperGalleryReached = true;
    if (this.progress.upperGalleryReached && p.x >= zone03.descentX) this.progress.longDescentReached = true;
    if (this.progress.longDescentReached && p.x >= zone03.completionX && bottom >= zone03.completionY) this.progress.pass04Completed = true;
    const zone04 = PASS05_ZONE.milestones;
    if (this.progress.pass04Completed && p.x >= zone04.enteredX) this.progress.zone04Entered = true;
    if (this.progress.zone04Entered && p.x >= zone04.compressionX) this.progress.lowTunnelReached = true;
    if (this.progress.platformBoarded && p.x >= zone04.shaftExitX) this.progress.movingPlatformCrossed = true;
    if (this.progress.movingPlatformCrossed && p.x >= zone04.unevenX) this.progress.unevenTunnelReached = true;
    if (this.progress.unevenTunnelReached && p.x >= zone04.completionX && bottom >= zone04.completionY) this.progress.pass05Completed = true;
    const zone05 = PASS06_ZONE.milestones;
    if (this.progress.pass05Completed && p.x >= zone05.enteredX) this.progress.zone05Entered = true;
    if (this.progress.zone05Entered && p.x >= zone05.lowerHallX) this.progress.lowerHallReached = true;
    if (this.progress.lowerHallReached && p.x >= zone05.highGalleryX) this.progress.highGalleryReached = true;
    if (this.progress.highGalleryReached && this.progress.breakablesDestroyed === 3 && p.x >= zone05.completionX && bottom >= zone05.completionY) this.progress.pass06Completed = true;
    const zone06 = PASS07_ZONE.milestones;
    if (this.progress.pass06Completed && p.x >= zone06.enteredX) this.progress.zone06Entered = true;
    if (this.progress.zone06Entered && p.x >= zone06.curveCommittedX) this.progress.curveCommitted = true;
    if (this.progress.curveCommitted && !this.progress.zone06Dropped && bottom >= zone06.landingY) {
      this.progress.zone06Dropped = true;
      this.progress.directionChanges += 1;
    }
    if (this.progress.zone06Dropped && !this.progress.eastDashGapCleared && p.x <= zone06.eastGapX) {
      this.progress.eastDashGapCleared = true;
      this.progress.dashGapClears += 1;
    }
    if (this.progress.eastDashGapCleared && !this.progress.middleDashGapCleared && p.x <= zone06.middleGapX) {
      this.progress.middleDashGapCleared = true;
      this.progress.dashGapClears += 1;
    }
    if (this.progress.middleDashGapCleared && !this.progress.westDashGapCleared && p.x <= zone06.westGapX) {
      this.progress.westDashGapCleared = true;
      this.progress.dashGapClears += 1;
    }
    if (this.progress.westDashGapCleared && p.x <= zone06.completionX && bottom >= zone06.completionY) this.progress.pass07Completed = true;
  }

  resetPlayer(manual) {
    if (manual || this.frameCount > 0) this.resetCount += 1;
    this.player = this.createPlayer();
    this.movingPlatforms = this.createMovingPlatforms();
    this.breakables = this.createBreakables();
    this.debris = [];
    this.chase = this.createChase();
    this.collapsedFloorIds = new Set();
    this.destroyedSupportIds = new Set();
    this.screenShake = 0;
    this.progress = this.createProgress();
    this.jumpQueued = false;
    this.dashQueued = false;
    this.keys.clear();
    this.snapCamera();
  }

  snapCamera() {
    const p = this.player;
    this.camera.zoom = 1;
    this.camera.x = clamp(p.x - 310, PASS08_LEVEL.cameraBounds.x, PASS08_LEVEL.cameraBounds.x + PASS08_LEVEL.cameraBounds.width - VIEWPORT.width);
    this.camera.y = clamp(p.y - 260, PASS08_LEVEL.cameraBounds.y, PASS08_LEVEL.cameraBounds.y + PASS08_LEVEL.cameraBounds.height - VIEWPORT.height);
  }

  updateCamera() {
    const p = this.player;
    const chaseVisible = this.chase.active && !this.chase.sealed;
    const separation = chaseVisible ? Math.hypot(p.x - this.chase.x, (p.y + 24) - this.chase.y) : 0;
    const desiredZoom = chaseVisible ? clamp(1180 / Math.max(1180, separation + 420), 0.62, 1) : 1;
    this.camera.zoom += (desiredZoom - this.camera.zoom) * (chaseVisible ? 0.045 : 0.11);
    const viewWidth = VIEWPORT.width / this.camera.zoom;
    const viewHeight = VIEWPORT.height / this.camera.zoom;
    let centerX;
    let centerY;
    const canFrameTogether = chaseVisible &&
      Math.abs(p.x - this.chase.x) <= viewWidth - 320 &&
      Math.abs((p.y + 24) - this.chase.y) <= viewHeight - 200;
    if (canFrameTogether) {
      centerX = p.x * 0.56 + this.chase.x * 0.44;
      centerY = (p.y + 24) * 0.62 + this.chase.y * 0.38;
    } else {
      const lookAhead = p.facing > 0 ? viewWidth * 0.32 : viewWidth * 0.68;
      centerX = p.x + viewWidth * 0.5 - lookAhead;
      centerY = p.y + 24;
    }
    const targetX = clamp(centerX - viewWidth * 0.5, PASS08_LEVEL.cameraBounds.x, PASS08_LEVEL.cameraBounds.x + PASS08_LEVEL.cameraBounds.width - viewWidth);
    const targetY = clamp(centerY - viewHeight * 0.5, PASS08_LEVEL.cameraBounds.y, PASS08_LEVEL.cameraBounds.y + PASS08_LEVEL.cameraBounds.height - viewHeight);
    this.camera.x += (targetX - this.camera.x) * 0.075;
    this.camera.y += (targetY - this.camera.y) * 0.085;
  }

  draw() {
    if (this.blueprintVisible) {
      this.drawBlueprint();
      return;
    }
    const ctx = this.context;
    const gradient = ctx.createLinearGradient(0, 0, 0, VIEWPORT.height);
    gradient.addColorStop(0, "#0a1b22");
    gradient.addColorStop(1, "#02070a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEWPORT.width, VIEWPORT.height);
    this.drawParallax(ctx);
    ctx.save();
    const shakeX = this.screenShake > 0 ? Math.sin(this.frameCount * 1.7) * this.screenShake : 0;
    const shakeY = this.screenShake > 0 ? Math.cos(this.frameCount * 1.3) * this.screenShake * 0.55 : 0;
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.camera.x + shakeX, -this.camera.y + shakeY);
    this.drawBuriedStructure(ctx);
    this.drawUnevenTunnelStructure(ctx);
    this.drawDestructionMazeStructure(ctx);
    this.drawGiantCurveStructure(ctx);
    this.drawChaseSupports(ctx);
    this.drawLevel(ctx);
    this.drawMovingPlatforms(ctx);
    this.drawBreakables(ctx);
    this.drawDebris(ctx);
    this.drawBoulder(ctx);
    this.drawMarkers(ctx);
    this.drawPlayer(ctx);
    ctx.restore();
    this.drawChaseHud(ctx);
  }

  drawChaseHud(ctx) {
    if (!this.chase.triggered) return;
    const progress = this.chase.pathDistance / PASS08_CHASE.path.totalDistance;
    const separation = Math.hypot(this.player.x - this.chase.x, (this.player.y + 24) - this.chase.y);
    const x = 20;
    const y = VIEWPORT.height - 72;
    const width = 330;
    ctx.save();
    ctx.fillStyle = "rgba(3, 9, 13, 0.88)";
    ctx.strokeStyle = this.chase.sealed ? "rgba(140, 224, 186, 0.72)" : "rgba(224, 145, 87, 0.82)";
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, width, 50);
    ctx.strokeRect(x, y, width, 50);
    ctx.fillStyle = this.chase.sealed ? "#8ce0ba" : "#e7a06d";
    ctx.font = "800 11px Arial, sans-serif";
    ctx.fillText(this.chase.sealed ? "CHASE SEALED" : this.chase.active ? "BOULDER ACTIVE" : "STRUCTURE RUMBLING", x + 12, y + 17);
    ctx.fillStyle = "rgba(154, 183, 184, 0.32)";
    ctx.fillRect(x + 12, y + 27, width - 24, 9);
    ctx.fillStyle = this.chase.sealed ? "#8ce0ba" : "#d9825b";
    ctx.fillRect(x + 12, y + 27, (width - 24) * clamp(progress, 0, 1), 9);
    ctx.fillStyle = "#b7c7ca";
    ctx.font = "700 9px Arial, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${Math.round(progress * 100)}% · GAP ${Math.round(separation)} PX`, x + width - 12, y + 17);
    ctx.restore();
  }

  drawParallax(ctx) {
    const offsetX = -(this.camera.x * 0.16) % 260;
    ctx.save();
    ctx.fillStyle = "rgba(25, 54, 62, 0.42)";
    for (let x = offsetX - 260; x < VIEWPORT.width + 260; x += 260) {
      const height = 230 + ((Math.abs(Math.round(x / 260)) % 3) * 55);
      ctx.fillRect(x, VIEWPORT.height - height, 92, height);
      ctx.beginPath();
      ctx.moveTo(x - 12, VIEWPORT.height - height);
      ctx.lineTo(x + 46, VIEWPORT.height - height - 38);
      ctx.lineTo(x + 104, VIEWPORT.height - height);
      ctx.fill();
    }
    ctx.restore();
  }

  drawLevel(ctx) {
    ctx.save();
    for (const item of PASS08_LEVEL.floors) {
      if (this.collapsedFloorIds.has(item.id)) {
        ctx.strokeStyle = "rgba(185, 105, 73, 0.42)";
        ctx.lineWidth = 5;
        ctx.setLineDash([22, 24]);
        ctx.beginPath();
        ctx.moveTo(item.x1, item.y1 + 18);
        ctx.lineTo(item.x2, item.y2 + 72);
        ctx.stroke();
        ctx.setLineDash([]);
        continue;
      }
      ctx.fillStyle = item.zone === 1 ? "#263c40" : item.zone === 3 ? "#303a3c" : item.zone === 4 ? "#34393a" : item.zone === 5 ? "#383b39" : item.zone === 6 ? "#303b3d" : "#29383b";
      ctx.strokeStyle = item.zone === 1 ? "#9ab7ae" : item.zone === 3 ? "#c2b58f" : item.zone === 4 ? "#c7ad82" : item.zone === 5 ? "#d0a875" : item.zone === 6 ? "#8fc5c2" : "#b4aa91";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(item.x1, item.y1);
      ctx.lineTo(item.x2, item.y2);
      ctx.lineTo(item.x2, item.y2 + 260);
      ctx.lineTo(item.x1, item.y1 + 260);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(item.x1, item.y1);
      ctx.lineTo(item.x2, item.y2);
      ctx.stroke();
    }
    for (const solid of PASS08_LEVEL.solids) {
      ctx.fillStyle = solid.role === "baffle" ? "#26383b" : solid.role === "ceiling" ? "#394041" : "#304246";
      ctx.strokeStyle = solid.role === "baffle" ? "#b4aa91" : solid.role === "ceiling" ? "#c7ad82" : "#91b1b2";
      ctx.lineWidth = 4;
      ctx.fillRect(solid.x, solid.y, solid.width, solid.height);
      ctx.strokeRect(solid.x, solid.y, solid.width, solid.height);
      ctx.strokeStyle = "rgba(205, 220, 210, 0.2)";
      for (let y = solid.y + 34; y < solid.y + solid.height; y += 52) {
        ctx.beginPath();
        ctx.moveTo(solid.x + 5, y);
        ctx.lineTo(solid.x + solid.width - 5, y - 12);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawBuriedStructure(ctx) {
    const roof = PASS08_LEVEL.roof;
    ctx.save();
    ctx.fillStyle = "rgba(24, 42, 45, 0.96)";
    ctx.strokeStyle = "#718d8d";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(roof[0].x1, roof[0].y1);
    for (const item of roof) ctx.lineTo(item.x2, item.y2);
    ctx.lineTo(roof.at(-1).x2, 200);
    ctx.lineTo(roof[0].x1, 200);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(roof[0].x1, roof[0].y1);
    for (const item of roof) ctx.lineTo(item.x2, item.y2);
    ctx.stroke();

    for (const item of PASS08_LEVEL.frames) {
      ctx.fillStyle = "rgba(103, 126, 124, 0.055)";
      ctx.strokeStyle = "rgba(156, 181, 176, 0.30)";
      ctx.lineWidth = 3;
      ctx.fillRect(item.x, item.y, item.width, item.height);
      ctx.strokeRect(item.x, item.y, item.width, item.height);
      ctx.beginPath();
      ctx.moveTo(item.x + item.width * 0.33, item.y);
      ctx.lineTo(item.x + item.width * 0.33, item.y + item.height);
      ctx.moveTo(item.x + item.width * 0.67, item.y);
      ctx.lineTo(item.x + item.width * 0.67, item.y + item.height);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawUnevenTunnelStructure(ctx) {
    const roof = PASS08_LEVEL.zone04Roof;
    ctx.save();
    ctx.fillStyle = "rgba(33, 43, 43, 0.97)";
    ctx.strokeStyle = "#8a8f83";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(roof[0].x1, roof[0].y1);
    for (const item of roof) ctx.lineTo(item.x2, item.y2);
    ctx.lineTo(roof.at(-1).x2, 200);
    ctx.lineTo(roof[0].x1, 200);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(roof[0].x1, roof[0].y1);
    for (const item of roof) ctx.lineTo(item.x2, item.y2);
    ctx.stroke();

    for (const item of PASS08_LEVEL.zone04Frames) {
      ctx.fillStyle = "rgba(179, 151, 105, 0.055)";
      ctx.strokeStyle = "rgba(199, 173, 130, 0.32)";
      ctx.lineWidth = 3;
      ctx.fillRect(item.x, item.y, item.width, item.height);
      ctx.strokeRect(item.x, item.y, item.width, item.height);
      ctx.beginPath();
      ctx.moveTo(item.x, item.y + item.height);
      ctx.quadraticCurveTo(item.x + item.width * 0.5, item.y + 30, item.x + item.width, item.y + item.height);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawDestructionMazeStructure(ctx) {
    const roof = PASS08_LEVEL.zone05Roof;
    ctx.save();
    ctx.fillStyle = "rgba(42, 43, 39, 0.98)";
    ctx.strokeStyle = "#9a8e78";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(roof[0].x1, roof[0].y1);
    for (const item of roof) ctx.lineTo(item.x2, item.y2);
    ctx.lineTo(roof.at(-1).x2, 200);
    ctx.lineTo(roof[0].x1, 200);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(roof[0].x1, roof[0].y1);
    for (const item of roof) ctx.lineTo(item.x2, item.y2);
    ctx.stroke();

    const corridor = PASS08_LEVEL.collapseCorridor;
    ctx.strokeStyle = "rgba(202, 134, 89, 0.20)";
    ctx.lineWidth = corridor.width;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    corridor.points.forEach((item, index) => {
      if (index === 0) ctx.moveTo(item.x, item.y);
      else ctx.lineTo(item.x, item.y);
    });
    ctx.stroke();
    ctx.strokeStyle = "rgba(225, 158, 104, 0.62)";
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 16]);
    ctx.stroke();
    ctx.setLineDash([]);

    for (const support of PASS08_LEVEL.corridorSupports) {
      if (this.destroyedSupportIds.has(support.id)) continue;
      ctx.fillStyle = "rgba(113, 90, 67, 0.42)";
      ctx.strokeStyle = "rgba(211, 163, 111, 0.52)";
      ctx.lineWidth = 3;
      ctx.fillRect(support.x, support.y, support.width, support.height);
      ctx.strokeRect(support.x, support.y, support.width, support.height);
      ctx.beginPath();
      ctx.moveTo(support.x, support.y);
      ctx.lineTo(support.x + support.width, support.y + support.height);
      ctx.moveTo(support.x + support.width, support.y);
      ctx.lineTo(support.x, support.y + support.height);
      ctx.stroke();
    }

    for (const item of PASS08_LEVEL.zone05Frames) {
      ctx.fillStyle = "rgba(188, 150, 102, 0.045)";
      ctx.strokeStyle = "rgba(207, 170, 120, 0.28)";
      ctx.lineWidth = 3;
      ctx.fillRect(item.x, item.y, item.width, item.height);
      ctx.strokeRect(item.x, item.y, item.width, item.height);
      ctx.beginPath();
      ctx.moveTo(item.x, item.y + item.height);
      ctx.quadraticCurveTo(item.x + item.width * 0.5, item.y + 20, item.x + item.width, item.y + item.height);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawGiantCurveStructure(ctx) {
    const curve = PASS08_LEVEL.boulderCurve;
    ctx.save();
    ctx.strokeStyle = "rgba(80, 143, 145, 0.18)";
    ctx.lineWidth = curve.width;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    curve.points.forEach((item, index) => {
      if (index === 0) ctx.moveTo(item.x, item.y);
      else ctx.lineTo(item.x, item.y);
    });
    ctx.stroke();
    ctx.strokeStyle = "rgba(116, 199, 195, 0.55)";
    ctx.lineWidth = 4;
    ctx.setLineDash([24, 18]);
    ctx.stroke();
    ctx.setLineDash([]);

    for (const item of PASS08_LEVEL.zone06Frames) {
      ctx.fillStyle = "rgba(84, 154, 154, 0.04)";
      ctx.strokeStyle = "rgba(122, 195, 192, 0.25)";
      ctx.lineWidth = 3;
      ctx.fillRect(item.x, item.y, item.width, item.height);
      ctx.strokeRect(item.x, item.y, item.width, item.height);
      ctx.beginPath();
      ctx.moveTo(item.x, item.y + item.height);
      ctx.quadraticCurveTo(item.x + item.width * 0.5, item.y + 20, item.x + item.width, item.y + item.height);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawChaseSupports(ctx) {
    ctx.save();
    for (const support of PASS08_CHASE.supportTargets) {
      if (support.id.startsWith("support_") || this.destroyedSupportIds.has(support.id)) continue;
      ctx.fillStyle = "rgba(92, 82, 68, 0.72)";
      ctx.strokeStyle = "rgba(218, 153, 96, 0.68)";
      ctx.lineWidth = 4;
      ctx.fillRect(support.x, support.y, support.width, support.height);
      ctx.strokeRect(support.x, support.y, support.width, support.height);
      ctx.beginPath();
      ctx.moveTo(support.x, support.y);
      ctx.lineTo(support.x + support.width, support.y + support.height);
      ctx.moveTo(support.x + support.width, support.y);
      ctx.lineTo(support.x, support.y + support.height);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawBoulder(ctx) {
    const chase = this.chase;
    if (!chase.triggered || (!chase.active && !chase.sealed)) return;
    const radius = PASS08_CHASE.boulder.radius;
    ctx.save();
    ctx.translate(chase.x, chase.y);
    ctx.rotate(chase.rotation);
    ctx.fillStyle = "#57473b";
    ctx.strokeStyle = chase.sealed ? "#88745d" : "#e09157";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(241, 181, 112, 0.72)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-55, -54);
    ctx.lineTo(-18, -12);
    ctx.lineTo(-46, 31);
    ctx.moveTo(22, -72);
    ctx.lineTo(8, -25);
    ctx.lineTo(54, 5);
    ctx.moveTo(61, 34);
    ctx.lineTo(14, 28);
    ctx.lineTo(-4, 70);
    ctx.stroke();
    ctx.fillStyle = "rgba(224, 142, 82, 0.25)";
    ctx.beginPath();
    ctx.arc(-22, -18, radius * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (chase.active) {
      ctx.save();
      ctx.fillStyle = "rgba(201, 126, 77, 0.24)";
      for (let index = 0; index < 7; index += 1) {
        const angle = (this.frameCount * 0.08 + index * 1.7) % (Math.PI * 2);
        ctx.beginPath();
        ctx.arc(chase.x + Math.cos(angle) * (radius + 18), chase.y + radius * 0.55 + Math.sin(angle) * 18, 9 + (index % 3) * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  drawBreakables(ctx) {
    ctx.save();
    for (const gate of this.breakables) {
      if (gate.destroyed) continue;
      ctx.fillStyle = "#5b4b3e";
      ctx.strokeStyle = "#e0b26f";
      ctx.lineWidth = 4;
      ctx.fillRect(gate.x, gate.y, gate.width, gate.height);
      ctx.strokeRect(gate.x, gate.y, gate.width, gate.height);
      ctx.beginPath();
      ctx.moveTo(gate.x, gate.y);
      ctx.lineTo(gate.x + gate.width, gate.y + gate.height);
      ctx.moveTo(gate.x + gate.width, gate.y);
      ctx.lineTo(gate.x, gate.y + gate.height);
      if (gate.shape === "lattice") {
        ctx.moveTo(gate.x, gate.y + gate.height * 0.33);
        ctx.lineTo(gate.x + gate.width, gate.y + gate.height * 0.33);
        ctx.moveTo(gate.x, gate.y + gate.height * 0.67);
        ctx.lineTo(gate.x + gate.width, gate.y + gate.height * 0.67);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  drawDebris(ctx) {
    ctx.save();
    for (const piece of this.debris) {
      ctx.save();
      ctx.translate(piece.x, piece.y);
      ctx.rotate(piece.rotation);
      ctx.globalAlpha = Math.min(1, piece.life / 24);
      ctx.fillStyle = piece.kind === "support" ? "#bd704a" : piece.kind === "chase" ? "#8f5a43" : "#d4a361";
      ctx.fillRect(-piece.width * 0.5, -piece.height * 0.5, piece.width, piece.height);
      ctx.restore();
    }
    ctx.restore();
  }

  drawMovingPlatforms(ctx) {
    ctx.save();
    for (const platform of this.movingPlatforms) {
      ctx.fillStyle = "#51605f";
      ctx.strokeStyle = "#dfc487";
      ctx.lineWidth = 4;
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
      ctx.strokeStyle = "rgba(223, 196, 135, 0.44)";
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(platform.xMin, platform.y + platform.height * 0.5);
      ctx.lineTo(platform.xMax + platform.width, platform.y + platform.height * 0.5);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  drawMarkers(ctx) {
    const markers = [
      { x: 600, y: 900, label: "START", active: true },
      { x: 2800, y: 1700, label: "ZONE 02", active: this.progress.zone01Reached },
      { x: 3290, y: 1950, label: "CLIMB I", active: this.progress.firstClimb },
      { x: 4050, y: 2410, label: "CLIMB II", active: this.progress.secondClimb },
      { x: 4400, y: 3100, label: "ZONE 03 ENTRY", active: this.progress.completed },
      { x: 6240, y: 2500, label: "LOWER RISE", active: this.progress.lowerRiseReached },
      { x: 7360, y: 2000, label: "ATRIUM", active: this.progress.atriumReached },
      { x: 8000, y: 1600, label: "UPPER GALLERY", active: this.progress.upperGalleryReached },
      { x: 10400, y: 3300, label: "ZONE 04 ENTRY", active: this.progress.pass04Completed },
      { x: 11050, y: 3150, label: "LOW TUNNEL", active: this.progress.lowTunnelReached },
      { x: 11620, y: 3290, label: "SHAFT CARRIAGE", active: this.progress.platformBoarded },
      { x: 12220, y: 3600, label: "UNEVEN GALLERY", active: this.progress.unevenTunnelReached },
      { x: 13400, y: 3700, label: "ZONE 05 ENTRY", active: this.progress.pass05Completed },
      { x: 13950, y: 3950, label: "CHASE START", active: this.progress.boulderStarted },
      { x: 14700, y: 3500, label: "DASH GATE I", active: this.breakables[0]?.destroyed },
      { x: 19300, y: 3700, label: "DASH GATE II", active: this.breakables[1]?.destroyed },
      { x: 20400, y: 3100, label: "HIGH GALLERY", active: this.progress.highGalleryReached },
      { x: 23750, y: 3300, label: "DASH GATE III", active: this.breakables[2]?.destroyed },
      { x: 24800, y: 4400, label: "ZONE 06 ENTRY", active: this.progress.pass06Completed },
      { x: 25440, y: 4750, label: "GIANT CURVE", active: this.progress.curveCommitted },
      { x: 25200, y: 5220, label: "LOWER LANDING", active: this.progress.zone06Dropped },
      { x: 22400, y: 4800, label: "DASH GAP I", active: this.progress.eastDashGapCleared },
      { x: 19000, y: 4750, label: "DASH GAP II", active: this.progress.middleDashGapCleared },
      { x: 15720, y: 4850, label: "DASH GAP III", active: this.progress.westDashGapCleared },
      { x: 9300, y: 5000, label: "PASS 08 EXIT", active: this.progress.pass08Completed },
    ];
    ctx.save();
    ctx.font = "700 11px Arial, sans-serif";
    ctx.textAlign = "center";
    for (const marker of markers) {
      ctx.strokeStyle = marker.active ? "#e3c980" : "rgba(155, 199, 207, 0.45)";
      ctx.fillStyle = marker.active ? "#e3c980" : "#79979b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(marker.x, marker.y - 8);
      ctx.lineTo(marker.x, marker.y - 82);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(marker.x, marker.y - 92, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(marker.label, marker.x, marker.y - 112);
    }
    ctx.restore();
  }

  drawPlayer(ctx) {
    const p = this.player;
    ctx.save();
    if (p.dashFrames > 0) {
      ctx.fillStyle = "rgba(183, 229, 224, 0.18)";
      ctx.fillRect(p.x - p.facing * 45, p.y + 8, PLAYER_PHYSICS.width + 45, PLAYER_PHYSICS.height - 16);
    }
    ctx.fillStyle = PALETTE.player;
    ctx.beginPath();
    ctx.arc(p.x + 17, p.y + 10, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(p.x + 8, p.y + 18, 18, 22);
    ctx.fillRect(p.x + 5, p.y + 40, 8, 8);
    ctx.fillRect(p.x + 21, p.y + 40, 8, 8);
    ctx.strokeStyle = "#8ed1d0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.x + 17, p.y + 20);
    ctx.lineTo(p.x + 17 + p.facing * 18, p.y + 27);
    ctx.stroke();
    ctx.restore();
  }

  drawBlueprint() {
    const ctx = this.context;
    ctx.fillStyle = "#041016";
    ctx.fillRect(0, 0, VIEWPORT.width, VIEWPORT.height);
    const frame = { x: 42, y: 90, width: 1116, height: 510 };
    const mapPoint = point => ({
      x: frame.x + (point.x / WORLD.width) * frame.width,
      y: frame.y + (point.y / WORLD.height) * frame.height,
    });
    ctx.strokeStyle = "rgba(139, 190, 199, 0.34)";
    ctx.strokeRect(frame.x, frame.y, frame.width, frame.height);
    ZONES.forEach((zone, index) => {
      const topLeft = mapPoint(zone.bounds);
      const width = (zone.bounds.width / WORLD.width) * frame.width;
      const height = (zone.bounds.height / WORLD.height) * frame.height;
      ctx.fillStyle = index < 6 ? "rgba(216, 191, 120, 0.19)" : "rgba(69, 111, 119, 0.10)";
      ctx.strokeStyle = index < 6 ? "rgba(216, 191, 120, 0.75)" : "rgba(139, 190, 199, 0.32)";
      ctx.fillRect(topLeft.x, topLeft.y, width, height);
      ctx.strokeRect(topLeft.x, topLeft.y, width, height);
      ctx.fillStyle = index < 6 ? "#ead59b" : "#8cadb3";
      ctx.font = "700 9px Arial, sans-serif";
      ctx.fillText(`${String(index + 1).padStart(2, "0")} ${zone.name}`, topLeft.x + 6, topLeft.y + 15);
    });
    const drawRoute = (points, color, dash) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = dash ? 2 : 3;
      ctx.setLineDash(dash ? [7, 6] : []);
      ctx.beginPath();
      points.forEach((point, index) => {
        const mapped = mapPoint(point);
        if (index === 0) ctx.moveTo(mapped.x, mapped.y);
        else ctx.lineTo(mapped.x, mapped.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    };
    drawRoute(PLAYER_ROUTE, PALETTE.route, false);
    drawRoute(BOULDER_ROUTE, PALETTE.boulderRoute, true);
    ctx.fillStyle = "#eff5f3";
    ctx.font = "800 22px Arial, sans-serif";
    ctx.fillText("PASS 08 / ACTIVE BOULDER CHASE 01–06", 42, 52);
    ctx.fillStyle = "#a8bcc0";
    ctx.font = "700 10px Arial, sans-serif";
    ctx.fillText(`ACTIVE PATH 30 POINTS · COLLAPSE PANELS ${PASS08_CHASE.collapsePanels.length} · B RETURN`, 42, 72);
  }

  getDebugState() {
    const p = this.player;
    return {
      player: {
        x: p.x,
        y: p.y,
        vx: p.vx,
        vy: p.vy,
        grounded: p.grounded,
        wallSide: p.wallSide,
        dashAvailable: p.dashAvailable,
        standingPlatformId: p.standingPlatformId,
      },
      movingPlatforms: this.movingPlatforms.map(item => ({
        id: item.id,
        x: item.x,
        y: item.y,
        direction: item.direction,
      })),
      breakables: this.breakables.map(item => ({
        id: item.id,
        shape: item.shape,
        destroyed: item.destroyed,
      })),
      chase: {
        triggered: this.chase.triggered,
        active: this.chase.active,
        sealed: this.chase.sealed,
        delayFrames: this.chase.delayFrames,
        activeFrames: this.chase.activeFrames,
        pathDistance: this.chase.pathDistance,
        pathProgress: this.chase.pathDistance / PASS08_CHASE.path.totalDistance,
        pathIndex: this.chase.pathIndex,
        x: this.chase.x,
        y: this.chase.y,
        speed: this.chase.speed,
      },
      collapsedFloorIds: Array.from(this.collapsedFloorIds).sort(),
      destroyedSupportIds: Array.from(this.destroyedSupportIds).sort(),
      boulderCatchCount: this.boulderCatchCount,
      debrisCount: this.debris.length,
      camera: { ...this.camera },
      progress: { ...this.progress },
      keys: Array.from(this.keys).sort(),
      blueprintVisible: this.blueprintVisible,
      resetCount: this.resetCount,
      frameCount: this.frameCount,
    };
  }

  audit() {
    const blueprint = validateBlueprint();
    const pass03 = validatePass03Level();
    const pass04 = validatePass04Level();
    const pass05 = validatePass05Level();
    const pass06 = validatePass06Level();
    const pass07 = validatePass07Level();
    const pass08 = validatePass08Level();
    const scriptSources = Array.from(document.scripts).map(script => script.getAttribute("src") ?? "");
    const checks = [
      { id: "build_id", passed: BUILD.id === "rebuild-v2-pass08" },
      { id: "pass_number", passed: BUILD.pass === 8 },
      { id: "canvas", passed: this.canvas.width === VIEWPORT.width && this.canvas.height === VIEWPORT.height },
      { id: "canvas_context", passed: Boolean(this.context) },
      { id: "stage_sequence", passed: STAGE_SEQUENCE.length === 10 },
      { id: "single_runtime", passed: this.running && this.frameHandle !== 0 },
      { id: "module_entry", passed: scriptSources.some(source => source.includes("src/v2/main.js")) },
      { id: "legacy_inactive", passed: scriptSources.filter(Boolean).every(source => source.includes("src/v2/main.js")) },
      { id: "blueprint_validation", passed: blueprint.passed },
      { id: "pass03_level_validation", passed: pass03.passed },
      { id: "pass04_level_validation", passed: pass04.passed },
      { id: "pass05_level_validation", passed: pass05.passed },
      { id: "pass06_level_validation", passed: pass06.passed },
      { id: "pass07_level_validation", passed: pass07.passed },
      { id: "pass08_level_validation", passed: pass08.passed },
      { id: "player_dimensions", passed: PLAYER_PHYSICS.width === 34 && PLAYER_PHYSICS.height === 48 },
      { id: "debug_state", passed: Boolean(this.getDebugState().player) },
    ];
    return {
      build: BUILD,
      passed: checks.every(check => check.passed),
      passedCount: checks.filter(check => check.passed).length,
      total: checks.length,
      checks,
      blueprint,
      pass03,
      pass04,
      pass05,
      pass06,
      pass07,
      pass08,
      gameplay: this.getDebugState(),
      inputProbe: {
        downs: this.inputProbe.downs,
        ups: this.inputProbe.ups,
        lastCode: this.inputProbe.lastCode,
        usedCodes: Array.from(this.inputProbe.usedCodes).sort(),
      },
    };
  }

  updateStatus() {
    const audit = this.audit();
    this.statusElements.build.textContent = "PASS 08 · ACTIVE CHASE 01–06";
    this.statusElements.audit.textContent = `AUDIT ${audit.passedCount}/${audit.total} · P08 ${audit.pass08.passedCount}/${audit.pass08.total}`;
    this.statusElements.audit.dataset.state = audit.passed ? "pass" : "fail";
  }
}
