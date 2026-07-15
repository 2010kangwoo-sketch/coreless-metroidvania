import { BUILD, PALETTE, STAGE_SEQUENCE, VIEWPORT } from "./config.js";
import { CHASE_FEATURES, PLAYER_ROUTE, WORLD, ZONES, validateBlueprint } from "./blueprint.js";
import { PASS03_LEVEL, PLAYER_PHYSICS, validatePass03Level } from "./pass03-level.js";
import { PASS04_ZONE, validatePass04Level } from "./pass04-level.js";
import { PASS05_ZONE, validatePass05Level } from "./pass05-level.js";
import { PASS06_ZONE, validatePass06Level } from "./pass06-level.js";
import { PASS07_ZONE, validatePass07Level } from "./pass07-level.js";
import { PASS08_CHASE, PASS08_LEVEL, validatePass08Level } from "./pass08-level.js";
import { PASS09_CHASE, PASS09_LEVEL, PASS09_ZONE, validatePass09Level } from "./pass09-level.js";
import { PASS10_CHASE, PASS10_ZONE, validatePass10Level } from "./pass10-level.js";
import { PASS11_CHASE, PASS11_LEVEL, PASS11_ZONE, validatePass11Level } from "./pass11-level.js";
import { PASS12_CHASE, PASS12_LEVEL, PASS12_ZONE, validatePass12Level } from "./pass12-level.js";
import { PASS13_CHASE, PASS13_ZONE, validatePass13Level } from "./pass13-level.js";
import { PASS14_CHASE, PASS14_ZONE, validatePass14Level } from "./pass14-level.js";
import { PASS15_CHASE, PASS15_LEVEL, PASS15_ZONE, validatePass15Level } from "./pass15-level.js";
import { PASS16_LIGHTS, PASS16_THEMES, getPass16Theme, validatePass16Visuals } from "./pass16-visuals.js";
import { PASS17_MATERIALS, PASS17_REINFORCEMENTS, PASS17_SUPPORTS, PASS17_VEGETATION, getPass17Material, validatePass17Art } from "./pass17-art.js";

const CONTROL_CODES = new Set(["KeyA", "KeyB", "KeyD", "KeyE", "Space", "ShiftLeft", "ShiftRight", "KeyR"]);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const approach = (value, target, amount) => value < target
  ? Math.min(value + amount, target)
  : Math.max(value - amount, target);

export class Pass17Runtime {
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
    this.grappleQueued = false;
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
    this.grapple = this.createGrapple();
    this.precisionJump = this.createPrecisionJump();
    this.collapsedFloorIds = new Set();
    this.destroyedSupportIds = new Set();
    this.usedGrappleAnchorIds = new Set();
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
        if (event.code === "KeyE") this.grappleQueued = true;
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
        if (this.precisionJump.kind) this.precisionJump.cut = true;
        if (this.precisionJump.kind === "short") this.progress.precisionShortJumpCut = true;
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
      zone07Entered: false,
      zone07UpperDrop: false,
      zone07MiddleReturn: false,
      zone07MiddleDrop: false,
      zone07LowerRun: false,
      zone07ExitReached: false,
      boulderAtInternalEntry: false,
      internalStructureBreached: false,
      pass09Completed: false,
      zone08Entered: false,
      zone08ShaftOneDropped: false,
      zone08ShaftOneCleared: false,
      zone08ShaftTwoDropped: false,
      zone08ShaftTwoCleared: false,
      zone08LowerHallReached: false,
      zone08ExitReached: false,
      pass10Completed: false,
      zone09Entered: false,
      grappleAnchorOneUsed: false,
      grappleAnchorTwoUsed: false,
      grappleAnchorThreeUsed: false,
      grappleChainCompleted: false,
      zone09ExitReached: false,
      pass11Completed: false,
      dashSpikeEntered: false,
      dashSpikeTakeoff: false,
      dashSpikeAirDashUsed: false,
      dashSpikeCleared: false,
      zone09DashExitReached: false,
      pass12Completed: false,
      precisionEntered: false,
      precisionShortTakeoff: false,
      precisionShortJumpCut: false,
      precisionShortGapCleared: false,
      precisionLowCeilingCleared: false,
      precisionTurnReached: false,
      precisionDirectionReversed: false,
      precisionLongTakeoff: false,
      precisionLongGapCleared: false,
      precisionExitReached: false,
      pass13Completed: false,
      giantCurveEntered: false,
      giantCurveUpperTakeoff: false,
      giantCurveUpperGapCleared: false,
      giantCurveSteepCommitted: false,
      giantCurveDropStarted: false,
      giantCurveLowerLanded: false,
      giantCurveDirectionReversed: false,
      giantCurveExitReached: false,
      pass14Completed: false,
      bridgeEntered: false,
      bridgeGapOneCleared: false,
      bridgeGapTwoCleared: false,
      bridgeGapThreeCleared: false,
      bridgeFinalAirDash: false,
      bridgeExitReached: false,
      bridgeBoulderPlunged: false,
      pass15Completed: false,
      chaseWallJumps: 0,
      floorsCollapsed: 0,
      supportsDestroyed: 0,
      internalDirectionChanges: 0,
      dashGapClears: 0,
      directionChanges: 0,
      breakablesDestroyed: 0,
      platformRides: 0,
      groundJumps: 0,
      wallJumps: 0,
      ledgeAssists: 0,
      dashes: 0,
      grappleAttaches: 0,
      grappleReleases: 0,
      grappleUniqueAnchors: 0,
      chaseAirDashes: 0,
      precisionShortJumps: 0,
      precisionLongJumps: 0,
      precisionDirectionChanges: 0,
      precisionCeilingBumps: 0,
      giantCurveUpperJumps: 0,
      giantCurveNaturalDrops: 0,
      giantCurveDirectionChanges: 0,
      bridgeJumps: 0,
      bridgeAirDashes: 0,
    };
  }

  createPlayer() {
    return {
      x: PASS15_LEVEL.spawn.x,
      y: PASS15_LEVEL.spawn.y,
      previousX: PASS15_LEVEL.spawn.x,
      previousY: PASS15_LEVEL.spawn.y,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: false,
      wallSide: 0,
      dashAvailable: true,
      dashFrames: 0,
      dashCooldown: 0,
      grappleLaunchFrames: 0,
      standingPlatformId: null,
    };
  }

  createMovingPlatforms() {
    return PASS15_LEVEL.movingPlatforms.map(item => ({
      ...item,
      x: item.xMin,
      previousX: item.xMin,
      direction: 1,
    }));
  }

  createBreakables() {
    return PASS15_LEVEL.breakables.map(item => ({ ...item, destroyed: false }));
  }

  createGrapple() {
    return {
      active: false,
      anchorId: null,
      ropeLength: 0,
      attachedFrames: 0,
      cooldown: 0,
      lastAnchorId: null,
    };
  }

  createPrecisionJump() {
    return {
      kind: null,
      holdFrames: 0,
      cut: false,
    };
  }

  createChase() {
    const start = PASS15_CHASE.path.points[0];
    return {
      triggered: false,
      active: false,
      sealed: false,
      delayFrames: PASS15_CHASE.boulder.spawnDelayFrames,
      breachDelayFrames: PASS15_CHASE.boulder.breachDelayFrames,
      breachComplete: false,
      internalBreakpointIndex: 0,
      internalPauseFrames: 0,
      pass14HeadStartFrames: 0,
      pass15HeadStartFrames: 0,
      activeFrames: 0,
      pathDistance: 0,
      pathIndex: 0,
      x: start.x,
      y: start.y,
      speed: PASS15_CHASE.boulder.baseSpeed,
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
    if (this.precisionJump.kind && this.keys.has("Space") && !wasGrounded) this.precisionJump.holdFrames += 1;

    if (this.grappleQueued) {
      if (this.grapple.active) this.releaseGrapple(moveAxis);
      else this.tryAttachGrapple();
    }
    this.grappleQueued = false;

    if (this.dashQueued && !this.grapple.active && p.dashAvailable && p.dashCooldown === 0) {
      p.dashFrames = config.dashFrames;
      p.dashAvailable = false;
      p.dashCooldown = config.dashCooldownFrames;
      p.vx = (moveAxis || p.facing) * config.dashSpeed;
      p.vy = wasGrounded ? 0 : Math.min(p.vy, 0);
      this.progress.dashes += 1;
      const centerX = p.x + PLAYER_PHYSICS.width * 0.5;
      const spike = PASS12_ZONE.spikeBed;
      if (this.progress.dashSpikeEntered && !wasGrounded && centerX >= spike.x1 - 70 && centerX <= spike.x2 + 70) {
        this.progress.dashSpikeAirDashUsed = true;
        this.progress.chaseAirDashes += 1;
      }
      if (this.progress.pass14Completed && !this.progress.bridgeGapThreeCleared && !wasGrounded && centerX >= 23340 && centerX <= 23620) {
        this.progress.bridgeFinalAirDash = true;
        this.progress.bridgeAirDashes += 1;
      }
    }
    this.dashQueued = false;

    if (this.jumpQueued && !this.grapple.active) {
      if (wasGrounded) {
        p.vy = -config.jumpSpeed;
        p.grounded = false;
        this.progress.groundJumps += 1;
        const centerX = p.x + PLAYER_PHYSICS.width * 0.5;
        if (this.progress.pass12Completed && !this.progress.precisionShortGapCleared && centerX >= 19820 && centerX <= 19935) {
          this.precisionJump = { kind: "short", holdFrames: 0, cut: false };
          this.progress.precisionShortTakeoff = true;
          this.progress.precisionShortJumps += 1;
        } else if (this.progress.precisionTurnReached && !this.progress.precisionLongGapCleared && centerX >= 18710 && centerX <= 19025 && p.facing > 0) {
          this.precisionJump = { kind: "long", holdFrames: 0, cut: false };
          this.progress.precisionLongTakeoff = true;
          this.progress.precisionLongJumps += 1;
        } else if (this.progress.pass13Completed && !this.progress.giantCurveUpperGapCleared && centerX >= 18920 && centerX <= 19020 && p.facing < 0) {
          this.progress.giantCurveUpperTakeoff = true;
          this.progress.giantCurveUpperJumps += 1;
        } else if (this.progress.pass14Completed && !this.progress.pass15Completed && p.facing > 0 &&
          PASS15_ZONE.gaps.some(gap => centerX >= gap.x1 - 90 && centerX <= gap.x1 + 30)) {
          this.progress.bridgeJumps += 1;
        }
      } else if (previousWall !== 0) {
        p.vx = -previousWall * config.wallJumpX;
        p.vy = -config.wallJumpY;
        p.facing = -previousWall;
        this.progress.wallJumps += 1;
        if (this.progress.pass09Completed && !this.progress.pass10Completed) this.progress.chaseWallJumps += 1;
      }
    }
    this.jumpQueued = false;

    if (this.grapple.active) {
      p.dashFrames = 0;
      p.vy = Math.min(p.vy + config.gravity * 0.28, config.maxFallSpeed);
      this.applyGrapplePhysics(moveAxis);
    } else if (p.grappleLaunchFrames > 0) {
      p.grappleLaunchFrames -= 1;
      p.vx = clamp(p.vx + moveAxis * 0.08, -13.5, 13.5) * 0.995;
      p.vy = Math.min(p.vy + config.gravity * 0.72, config.maxFallSpeed);
    } else if (p.dashFrames > 0) {
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
    if (this.grapple.cooldown > 0) this.grapple.cooldown -= 1;
    this.moveHorizontal();
    this.moveVertical(wasGrounded);
    if (this.grapple.active) this.constrainGrapple();
    if (p.grounded) p.dashAvailable = true;
    if (this.checkDashSpikeContact() || this.checkPrecisionHazardContact()) return;
    this.updateProgress();
    this.updateBoulder();
    this.updateChaseCompletion();
    this.updateCamera();
    this.screenShake = Math.max(0, this.screenShake - 0.7);

    if (p.y > PASS15_LEVEL.bounds.y + PASS15_LEVEL.bounds.height + 120 || p.x < -120) {
      this.resetPlayer(false);
    }
  }

  tryAttachGrapple() {
    if (!this.progress.pass10Completed || this.grapple.cooldown > 0) return false;
    const nextOrder = this.usedGrappleAnchorIds.size + 1;
    const anchor = PASS11_ZONE.anchors.find(item => item.order === nextOrder);
    if (!anchor) return false;
    const centerX = this.player.x + PLAYER_PHYSICS.width * 0.5;
    const centerY = this.player.y + PLAYER_PHYSICS.height * 0.5;
    const distance = Math.hypot(anchor.x - centerX, anchor.y - centerY);
    if (distance > anchor.attachRadius) return false;
    this.grapple.active = true;
    this.grapple.anchorId = anchor.id;
    this.grapple.ropeLength = Math.max(anchor.ropeLength, distance);
    this.grapple.attachedFrames = 0;
    this.grapple.lastAnchorId = anchor.id;
    this.usedGrappleAnchorIds.add(anchor.id);
    this.progress.grappleAttaches += 1;
    this.progress.grappleUniqueAnchors = this.usedGrappleAnchorIds.size;
    if (anchor.order === 1) this.progress.grappleAnchorOneUsed = true;
    if (anchor.order === 2) this.progress.grappleAnchorTwoUsed = true;
    if (anchor.order === 3) this.progress.grappleAnchorThreeUsed = true;
    if (this.usedGrappleAnchorIds.size === PASS11_ZONE.milestones.minimumUniqueAnchors) {
      this.progress.grappleChainCompleted = true;
    }
    this.player.grounded = false;
    this.player.dashFrames = 0;
    return true;
  }

  releaseGrapple(moveAxis = 0) {
    if (!this.grapple.active) return false;
    const direction = moveAxis || this.player.facing || -1;
    this.player.vx = clamp(this.player.vx + direction * 5.2, -13.5, 13.5);
    this.player.vy = Math.min(this.player.vy - 2.4, -1.2);
    this.player.grappleLaunchFrames = 24;
    this.grapple.active = false;
    this.grapple.anchorId = null;
    this.grapple.attachedFrames = 0;
    this.grapple.cooldown = 8;
    this.progress.grappleReleases += 1;
    return true;
  }

  applyGrapplePhysics(moveAxis) {
    const anchor = PASS11_ZONE.anchors.find(item => item.id === this.grapple.anchorId);
    if (!anchor) {
      this.releaseGrapple(moveAxis);
      return;
    }
    const p = this.player;
    const centerX = p.x + PLAYER_PHYSICS.width * 0.5;
    const centerY = p.y + PLAYER_PHYSICS.height * 0.5;
    const dx = anchor.x - centerX;
    const dy = anchor.y - centerY;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const tangentX = -dy / distance;
    const tangentY = dx / distance;
    const tangentDirection = moveAxis === 0 ? 0 : Math.sign(tangentX * moveAxis || moveAxis);
    p.vx += tangentX * tangentDirection * 0.52;
    p.vy += tangentY * tangentDirection * 0.52;
    const stretch = Math.max(0, distance - this.grapple.ropeLength);
    const pull = Math.min(1.6, stretch * 0.026);
    p.vx += (dx / distance) * pull;
    p.vy += (dy / distance) * pull;
    p.vx = clamp(p.vx, -11.5, 11.5);
    p.vy = clamp(p.vy, -11.5, PLAYER_PHYSICS.maxFallSpeed);
    this.grapple.attachedFrames += 1;
  }

  constrainGrapple() {
    const anchor = PASS11_ZONE.anchors.find(item => item.id === this.grapple.anchorId);
    if (!anchor) return;
    const p = this.player;
    const centerX = p.x + PLAYER_PHYSICS.width * 0.5;
    const centerY = p.y + PLAYER_PHYSICS.height * 0.5;
    const fromAnchorX = centerX - anchor.x;
    const fromAnchorY = centerY - anchor.y;
    const distance = Math.max(1, Math.hypot(fromAnchorX, fromAnchorY));
    if (distance <= this.grapple.ropeLength) return;
    const nx = fromAnchorX / distance;
    const ny = fromAnchorY / distance;
    const excess = distance - this.grapple.ropeLength;
    p.x -= nx * excess;
    p.y -= ny * excess;
    const outwardVelocity = p.vx * nx + p.vy * ny;
    if (outwardVelocity > 0) {
      p.vx -= outwardVelocity * nx;
      p.vy -= outwardVelocity * ny;
    }
  }

  checkDashSpikeContact() {
    if (!this.progress.pass11Completed) return false;
    const spike = PASS12_ZONE.spikeBed;
    const p = this.player;
    const horizontalOverlap = p.x + PLAYER_PHYSICS.width > spike.x1 && p.x < spike.x2;
    const verticalOverlap = p.y + PLAYER_PHYSICS.height > spike.tipY && p.y < spike.baseY;
    if (!horizontalOverlap || !verticalOverlap) return false;
    this.resetPlayer(false);
    return true;
  }

  checkPrecisionHazardContact() {
    if (!this.progress.pass12Completed || this.progress.pass13Completed) return false;
    const p = this.player;
    for (const hazard of PASS13_ZONE.hazards) {
      const horizontalOverlap = p.x + PLAYER_PHYSICS.width > hazard.x1 && p.x < hazard.x2;
      const verticalOverlap = p.y + PLAYER_PHYSICS.height > hazard.tipY && p.y < hazard.baseY;
      if (!horizontalOverlap || !verticalOverlap) continue;
      this.resetPlayer(false);
      return true;
    }
    return false;
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
    const config = PASS15_CHASE.boulder;
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

    if (chase.pass14HeadStartFrames > 0) {
      chase.pass14HeadStartFrames -= 1;
      return;
    }
    if (chase.pass15HeadStartFrames > 0) {
      chase.pass15HeadStartFrames -= 1;
      return;
    }

    if (chase.pathDistance >= PASS15_CHASE.path.pass08EndDistance && !chase.breachComplete) {
      this.progress.boulderAtInternalEntry = true;
      if (chase.breachDelayFrames > 0) {
        chase.breachDelayFrames -= 1;
        if (chase.breachDelayFrames % 36 === 0) this.screenShake = Math.max(this.screenShake, 5);
        return;
      }
      chase.breachComplete = true;
      this.progress.internalStructureBreached = true;
      this.screenShake = Math.max(this.screenShake, 12);
    }

    const internalBreakpoint = config.internalBreakpoints?.[chase.internalBreakpointIndex];
    if (internalBreakpoint && chase.pathDistance >= internalBreakpoint.distance) {
      if (chase.internalPauseFrames === 0) chase.internalPauseFrames = internalBreakpoint.delayFrames;
      chase.internalPauseFrames -= 1;
      if (chase.internalPauseFrames % 24 === 0) this.screenShake = Math.max(this.screenShake, 7);
      if (chase.internalPauseFrames === 0) chase.internalBreakpointIndex += 1;
      return;
    }

    chase.activeFrames += 1;
    chase.speed = Math.min(config.maximumSpeed, config.baseSpeed + chase.activeFrames * config.accelerationPerFrame);
    chase.pathDistance = Math.min(PASS15_CHASE.path.totalDistance, chase.pathDistance + chase.speed);
    this.updateBoulderPosition();
    chase.rotation += chase.speed / config.radius;

    if (chase.pathDistance >= PASS15_CHASE.path.zone05EndDistance) this.progress.boulderEnteredCurve = true;
    if (chase.pathDistance >= PASS15_CHASE.path.curveApexDistance) this.progress.boulderRoundedApex = true;

    const floorThreshold = chase.pathDistance - config.floorCollapseLag;
    for (const panel of PASS15_CHASE.collapsePanels) {
      if (panel.triggerDistance > floorThreshold) break;
      if (this.collapsedFloorIds.has(panel.floorId)) continue;
      this.collapsedFloorIds.add(panel.floorId);
      this.progress.floorsCollapsed += 1;
      this.spawnCollapseDebris(panel.floorId, false);
    }

    const supportThreshold = chase.pathDistance - config.supportBreakLag;
    for (const support of PASS15_CHASE.supportTargets) {
      if (support.triggerDistance > supportThreshold) break;
      if (this.destroyedSupportIds.has(support.id)) continue;
      this.destroyedSupportIds.add(support.id);
      this.progress.supportsDestroyed += 1;
      this.spawnSupportDebris(support);
      this.screenShake = Math.max(this.screenShake, 8);
    }

    if (chase.pathDistance >= PASS15_CHASE.path.totalDistance) {
      this.progress.boulderFinished = true;
    }
    this.checkBoulderContact();
  }

  updateBoulderPosition() {
    const chase = this.chase;
    const distances = PASS15_CHASE.path.cumulativeDistances;
    const points = PASS15_CHASE.path.points;
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
    const contactRadius = PASS15_CHASE.boulder.radius + PASS15_CHASE.boulder.contactPadding;
    if (Math.hypot(this.chase.x - nearestX, this.chase.y - nearestY) >= contactRadius) return;
    this.boulderCatchCount += 1;
    this.resetPlayer(false);
  }

  updateChaseCompletion() {
    if (!this.chase.active) return;
    if (!this.progress.pass08Completed && this.progress.pass07Completed) {
      const pass08Progress = this.chase.pathDistance / PASS08_CHASE.path.totalDistance;
      if (pass08Progress >= PASS08_CHASE.completion.minimumBoulderProgress) this.progress.pass08Completed = true;
    }
    if (!this.progress.pass09Completed && this.progress.zone07ExitReached) {
      const pass09Progress = this.chase.pathDistance / PASS09_CHASE.path.totalDistance;
      if (pass09Progress >= PASS09_CHASE.completion.minimumBoulderProgress) this.progress.pass09Completed = true;
    }
    if (!this.progress.pass10Completed && this.progress.zone08ExitReached) {
      const pass10Progress = this.chase.pathDistance / PASS10_CHASE.path.totalDistance;
      if (pass10Progress >= PASS10_CHASE.completion.minimumBoulderProgress) this.progress.pass10Completed = true;
    }
    if (!this.progress.pass11Completed && this.progress.zone09ExitReached && this.progress.grappleChainCompleted) {
      const pass11Progress = this.chase.pathDistance / PASS11_CHASE.path.totalDistance;
      if (pass11Progress >= PASS11_CHASE.completion.minimumBoulderProgress) this.progress.pass11Completed = true;
    }
    if (!this.progress.pass12Completed && this.progress.zone09DashExitReached && this.progress.dashSpikeCleared) {
      const pass12Progress = this.chase.pathDistance / PASS12_CHASE.path.totalDistance;
      if (pass12Progress >= PASS12_CHASE.completion.minimumBoulderProgress) this.progress.pass12Completed = true;
    }
    if (!this.progress.pass13Completed && this.progress.precisionExitReached && this.progress.precisionShortGapCleared &&
      this.progress.precisionLowCeilingCleared && this.progress.precisionDirectionReversed && this.progress.precisionLongGapCleared) {
      const pass13Progress = this.chase.pathDistance / PASS13_CHASE.path.totalDistance;
      if (pass13Progress >= PASS13_CHASE.completion.minimumBoulderProgress &&
        this.progress.precisionCeilingBumps <= PASS13_ZONE.milestones.maximumCeilingBumps) {
        this.progress.pass13Completed = true;
        this.chase.pass14HeadStartFrames = 180;
      }
    }
    if (!this.progress.pass14Completed && this.progress.pass13Completed && this.progress.giantCurveUpperGapCleared &&
      this.progress.giantCurveSteepCommitted && this.progress.giantCurveDropStarted && this.progress.giantCurveLowerLanded &&
      this.progress.giantCurveDirectionReversed && this.progress.giantCurveExitReached) {
      const pass14Progress = this.chase.pathDistance / PASS14_CHASE.path.totalDistance;
      if (pass14Progress >= PASS14_CHASE.completion.minimumBoulderProgress) {
        this.progress.pass14Completed = true;
        this.chase.pass15HeadStartFrames = PASS15_ZONE.headStartFrames;
      }
    }
    if (this.progress.pass15Completed || !this.progress.pass14Completed || !this.progress.bridgeGapOneCleared ||
      !this.progress.bridgeGapTwoCleared || !this.progress.bridgeGapThreeCleared || !this.progress.bridgeFinalAirDash ||
      !this.progress.bridgeExitReached) return;
    const pass15Progress = this.chase.pathDistance / PASS15_CHASE.path.totalDistance;
    if (pass15Progress < PASS15_CHASE.completion.minimumBoulderProgress) return;
    this.progress.bridgeBoulderPlunged = this.chase.pathDistance >= PASS15_CHASE.path.bridgePlungeDistance;
    if (!this.progress.bridgeBoulderPlunged) return;
    this.progress.chaseEscaped = true;
    this.progress.pass15Completed = true;
    this.chase.active = false;
    this.chase.sealed = true;
  }

  spawnCollapseDebris(floorId, major) {
    const item = PASS15_LEVEL.floors.find(floorItem => floorItem.id === floorId);
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
    for (const solid of PASS15_LEVEL.solids) {
      if (!this.isSolidActive(solid)) continue;
      if (solid.role === "ledge" || solid.role.endsWith("_ledge")) continue;
      const bottom = p.y + PLAYER_PHYSICS.height;
      const previousBottom = p.previousY + PLAYER_PHYSICS.height;
      if (previousBottom <= solid.y + 4 && bottom <= solid.y + 12) continue;
      if (!this.overlaps(p, solid)) continue;
      if (p.vx > 0) {
        const canAssist = (solid.role === "wall" || solid.role.endsWith("_wall")) &&
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
    p.x = clamp(p.x, PASS15_LEVEL.bounds.x, PASS15_LEVEL.bounds.x + PASS15_LEVEL.bounds.width - PLAYER_PHYSICS.width);
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

    for (const solid of PASS15_LEVEL.solids) {
      if (!this.isSolidActive(solid)) continue;
      if (!this.overlaps(p, solid)) continue;
      if (p.vy >= 0 && previousBottom <= solid.y + 8) {
        p.y = solid.y - PLAYER_PHYSICS.height;
        p.vy = 0;
        p.grounded = true;
      } else if (p.vy < 0 && p.previousY >= solid.y + solid.height - 8) {
        p.y = solid.y + solid.height;
        p.vy = 0;
        if (solid.role === "zone09_precision_ceiling") {
          this.progress.precisionCeilingBumps += 1;
          this.screenShake = Math.max(this.screenShake, 3);
        }
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
    for (const item of PASS15_LEVEL.floors) {
      if (!this.isFloorActive(item)) continue;
      const bodyOverlap = p.x + PLAYER_PHYSICS.width >= item.x1 && p.x <= item.x2;
      if (item.phase >= 13 ? !bodyOverlap : centerX < item.x1 || centerX > item.x2) continue;
      const sampleX = item.phase >= 13 ? clamp(centerX, item.x1, item.x2) : centerX;
      const ratio = (sampleX - item.x1) / (item.x2 - item.x1);
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
      for (const solid of PASS15_LEVEL.solids) {
        if (!this.isSolidActive(solid)) continue;
        const verticalOverlap = p.y + PLAYER_PHYSICS.height > solid.y + 2 && p.y < solid.y + solid.height - 2;
        if (!verticalOverlap) continue;
        if (Math.abs(p.x + PLAYER_PHYSICS.width - solid.x) <= 1.5) p.wallSide = 1;
        if (Math.abs(p.x - (solid.x + solid.width)) <= 1.5) p.wallSide = -1;
      }
    }
  }

  isFloorActive(item) {
    if (this.collapsedFloorIds.has(item.id)) return false;
    if (item.phase === 15) return this.progress.pass14Completed;
    if (item.phase === 14) {
      if (item.lane === "lower_return" || item.lane === "bridge_handoff") return this.progress.pass13Completed && this.progress.giantCurveDropStarted;
      return this.progress.pass13Completed;
    }
    if (item.phase === 13) return this.progress.pass12Completed;
    if (item.phase === 12) return this.progress.pass11Completed;
    if (item.zone === 9) return this.progress.pass10Completed;
    if (item.zone === 8) return this.progress.pass09Completed;
    if (item.zone === 7) {
      if (!this.progress.pass08Completed) return false;
      if (item.lane === "upper") return !this.progress.zone07UpperDrop;
      if (item.lane === "middle") return this.progress.zone07Entered && !this.progress.zone07MiddleDrop;
      return this.progress.zone07UpperDrop;
    }
    if (item.zone === 6) {
      if (this.progress.pass08Completed) return false;
      if (item.lane === "lower") return this.progress.curveCommitted;
      return !this.progress.zone06Dropped;
    }
    if (this.progress.zone06Dropped && item.zone <= 5) return false;
    return true;
  }

  isSolidActive(solid) {
    if (solid.phase === 15) return this.progress.pass14Completed;
    if (solid.phase === 14) return this.progress.pass13Completed;
    if (solid.phase === 13) return this.progress.pass12Completed;
    if (solid.phase === 12) return this.progress.pass11Completed;
    if (solid.role === "zone07_ceiling") return this.progress.pass08Completed;
    if (solid.role.startsWith("zone08_")) return this.progress.pass09Completed;
    if (solid.role.startsWith("zone09_")) return this.progress.pass10Completed;
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
    const gates = PASS15_LEVEL.gates;
    if (p.x >= PASS15_LEVEL.zone01Exit.x - 30) this.progress.zone01Reached = true;
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
    const zone07 = PASS09_ZONE.milestones;
    if (this.progress.pass08Completed && p.x >= zone07.enteredX) this.progress.zone07Entered = true;
    if (this.progress.zone07Entered && !this.progress.zone07UpperDrop && p.x >= zone07.upperTurnX && bottom >= zone07.firstLandingY) {
      this.progress.zone07UpperDrop = true;
      this.progress.internalDirectionChanges += 1;
    }
    if (this.progress.zone07UpperDrop && p.x <= zone07.upperTurnX - 240) this.progress.zone07MiddleReturn = true;
    if (this.progress.zone07MiddleReturn && !this.progress.zone07MiddleDrop && p.x <= zone07.middleTurnX && bottom >= zone07.secondLandingY) {
      this.progress.zone07MiddleDrop = true;
      this.progress.internalDirectionChanges += 1;
    }
    if (this.progress.zone07MiddleDrop && p.x >= zone07.lowerRunX) this.progress.zone07LowerRun = true;
    if (this.progress.zone07LowerRun && p.x >= zone07.completionX && bottom >= zone07.completionY) this.progress.zone07ExitReached = true;
    const zone08 = PASS10_ZONE.milestones;
    if (this.progress.pass09Completed && p.x >= zone08.enteredX) this.progress.zone08Entered = true;
    if (this.progress.zone08Entered && !this.progress.zone08ShaftOneDropped && bottom >= zone08.shaftOneDropY && p.x < zone08.shaftOneExitX) {
      this.progress.zone08ShaftOneDropped = true;
    }
    if (this.progress.zone08ShaftOneDropped && !this.progress.zone08ShaftOneCleared && p.x >= zone08.shaftOneExitX && bottom <= zone08.shaftOneExitY) {
      this.progress.zone08ShaftOneCleared = true;
    }
    if (this.progress.zone08ShaftOneCleared && !this.progress.zone08ShaftTwoDropped && bottom >= zone08.shaftTwoDropY && p.x < zone08.shaftTwoExitX) {
      this.progress.zone08ShaftTwoDropped = true;
    }
    if (this.progress.zone08ShaftTwoDropped && !this.progress.zone08ShaftTwoCleared && p.x >= zone08.shaftTwoExitX && bottom <= zone08.shaftTwoExitY) {
      this.progress.zone08ShaftTwoCleared = true;
    }
    if (this.progress.zone08ShaftTwoCleared && p.x >= zone08.lowerHallX) this.progress.zone08LowerHallReached = true;
    if (this.progress.zone08LowerHallReached && p.x >= zone08.completionX && bottom >= zone08.completionY) this.progress.zone08ExitReached = true;
    const zone09 = PASS11_ZONE.milestones;
    if (this.progress.pass10Completed && p.x >= zone09.enteredX) this.progress.zone09Entered = true;
    if (this.progress.zone09Entered && this.progress.grappleChainCompleted && p.grounded && p.x <= zone09.completionX && bottom >= zone09.completionY) {
      this.progress.zone09ExitReached = true;
    }
    const dashSpikes = PASS12_ZONE.milestones;
    if (this.progress.pass11Completed && p.x <= dashSpikes.enteredX) this.progress.dashSpikeEntered = true;
    if (this.progress.dashSpikeEntered && !p.grounded && p.x <= dashSpikes.takeoffX) this.progress.dashSpikeTakeoff = true;
    if (this.progress.dashSpikeTakeoff && this.progress.dashSpikeAirDashUsed && p.grounded && p.x <= dashSpikes.landingX) {
      this.progress.dashSpikeCleared = true;
    }
    if (this.progress.dashSpikeCleared && p.grounded && p.x <= dashSpikes.completionX && bottom >= dashSpikes.completionY) {
      this.progress.zone09DashExitReached = true;
    }
    const precision = PASS13_ZONE.milestones;
    if (this.progress.pass12Completed && p.x <= precision.enteredX) this.progress.precisionEntered = true;
    if (this.precisionJump.kind === "short" && p.grounded) {
      const landedOnShortFloor = p.x <= precision.shortLandingX && p.x + PLAYER_PHYSICS.width >= 19460 && Math.abs(bottom - 7310) <= 8;
      if (landedOnShortFloor && this.precisionJump.cut && this.progress.precisionCeilingBumps === 0) {
        this.progress.precisionShortGapCleared = true;
        this.progress.precisionLowCeilingCleared = true;
      }
      this.precisionJump = this.createPrecisionJump();
    }
    if (this.progress.precisionShortGapCleared && !this.progress.precisionTurnReached && p.grounded && p.x <= precision.turnX && bottom >= 7420) {
      this.progress.precisionTurnReached = true;
      const collapseId = "precision_turn_descent";
      if (!this.collapsedFloorIds.has(collapseId)) {
        this.collapsedFloorIds.add(collapseId);
        this.progress.floorsCollapsed += 1;
        this.spawnCollapseDebris(collapseId, true);
        this.screenShake = Math.max(this.screenShake, 8);
      }
    }
    if (this.progress.precisionTurnReached && !this.progress.precisionDirectionReversed && p.facing > 0 && p.vx > 1) {
      this.progress.precisionDirectionReversed = true;
      this.progress.precisionDirectionChanges += 1;
    }
    if (this.precisionJump.kind === "long" && p.grounded) {
      const landedOnLongFloor = p.x + PLAYER_PHYSICS.width >= precision.longLandingX && p.x <= 19590 && Math.abs(bottom - 7500) <= 8;
      if (landedOnLongFloor && !this.precisionJump.cut && this.precisionJump.holdFrames >= 8 && this.progress.precisionDirectionReversed) {
        this.progress.precisionLongGapCleared = true;
      }
      this.precisionJump = this.createPrecisionJump();
    }
    if (this.progress.precisionLongGapCleared && p.grounded && p.x >= precision.completionX && bottom >= precision.completionY) {
      this.progress.precisionExitReached = true;
    }
    const giantCurve = PASS14_ZONE.milestones;
    if (this.progress.pass13Completed && p.x <= giantCurve.enteredX) this.progress.giantCurveEntered = true;
    if (this.progress.giantCurveUpperTakeoff && !this.progress.giantCurveUpperGapCleared && p.grounded &&
      p.x <= giantCurve.upperGapLandingX && p.x + PLAYER_PHYSICS.width >= 18000 && bottom >= 7790 && bottom <= 8150) {
      this.progress.giantCurveUpperGapCleared = true;
    }
    if (this.progress.giantCurveUpperGapCleared && p.grounded && p.x <= giantCurve.steepCommitX && bottom >= 8370) {
      this.progress.giantCurveSteepCommitted = true;
    }
    if (this.progress.giantCurveSteepCommitted && !this.progress.giantCurveDropStarted && !p.grounded &&
      p.x <= giantCurve.dropLipX && bottom >= 8550) {
      this.progress.giantCurveDropStarted = true;
      this.progress.giantCurveNaturalDrops += 1;
    }
    if (this.progress.giantCurveDropStarted && !this.progress.giantCurveLowerLanded && p.grounded &&
      p.x <= giantCurve.lowerLandingX && bottom >= giantCurve.lowerLandingY) {
      this.progress.giantCurveLowerLanded = true;
    }
    if (this.progress.giantCurveLowerLanded && !this.progress.giantCurveDirectionReversed && p.facing > 0 && p.vx > 1) {
      this.progress.giantCurveDirectionReversed = true;
      this.progress.giantCurveDirectionChanges += 1;
    }
    if (this.progress.giantCurveDirectionReversed && p.grounded && p.x >= giantCurve.completionX && bottom >= giantCurve.completionY) {
      this.progress.giantCurveExitReached = true;
    }
    const bridge = PASS15_ZONE.milestones;
    if (this.progress.pass14Completed && p.x >= bridge.enteredX) this.progress.bridgeEntered = true;
    if (this.progress.bridgeEntered && p.grounded && p.x + PLAYER_PHYSICS.width >= bridge.gapLandings[0]) this.progress.bridgeGapOneCleared = true;
    if (this.progress.bridgeGapOneCleared && p.grounded && p.x + PLAYER_PHYSICS.width >= bridge.gapLandings[1]) this.progress.bridgeGapTwoCleared = true;
    if (this.progress.bridgeGapTwoCleared && p.grounded && p.x + PLAYER_PHYSICS.width >= bridge.gapLandings[2]) this.progress.bridgeGapThreeCleared = true;
    if (this.progress.bridgeGapThreeCleared && p.grounded && p.x >= bridge.completionX && bottom >= bridge.completionY) {
      this.progress.bridgeExitReached = true;
    }
  }

  resetPlayer(manual) {
    if (manual || this.frameCount > 0) this.resetCount += 1;
    this.player = this.createPlayer();
    this.movingPlatforms = this.createMovingPlatforms();
    this.breakables = this.createBreakables();
    this.debris = [];
    this.chase = this.createChase();
    this.grapple = this.createGrapple();
    this.precisionJump = this.createPrecisionJump();
    this.collapsedFloorIds = new Set();
    this.destroyedSupportIds = new Set();
    this.usedGrappleAnchorIds = new Set();
    this.screenShake = 0;
    this.progress = this.createProgress();
    this.jumpQueued = false;
    this.dashQueued = false;
    this.grappleQueued = false;
    this.keys.clear();
    this.snapCamera();
  }

  snapCamera() {
    const p = this.player;
    this.camera.zoom = 1;
    this.camera.x = clamp(p.x - 310, PASS15_LEVEL.cameraBounds.x, PASS15_LEVEL.cameraBounds.x + PASS15_LEVEL.cameraBounds.width - VIEWPORT.width);
    this.camera.y = clamp(p.y - 260, PASS15_LEVEL.cameraBounds.y, PASS15_LEVEL.cameraBounds.y + PASS15_LEVEL.cameraBounds.height - VIEWPORT.height);
  }

  updateCamera() {
    const p = this.player;
    const chaseVisible = this.chase.active && !this.chase.sealed;
    const separation = chaseVisible ? Math.hypot(p.x - this.chase.x, (p.y + 24) - this.chase.y) : 0;
    const curveOverviewActive = this.progress.pass13Completed && !this.progress.pass14Completed;
    const bridgeFinaleActive = this.progress.pass14Completed && !this.progress.pass15Completed;
    const desiredZoom = curveOverviewActive
      ? PASS14_ZONE.cameraOverview.zoom
      : bridgeFinaleActive ? PASS15_ZONE.cameraFinale.zoom
      : chaseVisible ? clamp(1180 / Math.max(1180, separation + 420), 0.62, 1) : 1;
    this.camera.zoom += (desiredZoom - this.camera.zoom) * (chaseVisible ? 0.045 : 0.11);
    const viewWidth = VIEWPORT.width / this.camera.zoom;
    const viewHeight = VIEWPORT.height / this.camera.zoom;
    let centerX;
    let centerY;
    const canFrameTogether = chaseVisible && !curveOverviewActive && !bridgeFinaleActive &&
      Math.abs(p.x - this.chase.x) <= viewWidth - 320 &&
      Math.abs((p.y + 24) - this.chase.y) <= viewHeight - 200;
    if (curveOverviewActive) {
      centerX = PASS14_ZONE.cameraOverview.x;
      centerY = PASS14_ZONE.cameraOverview.y;
    } else if (bridgeFinaleActive) {
      centerX = p.x + viewWidth * 0.16;
      centerY = (p.y + 24) * 0.7 + this.chase.y * 0.3;
    } else if (canFrameTogether) {
      centerX = p.x * 0.56 + this.chase.x * 0.44;
      centerY = (p.y + 24) * 0.62 + this.chase.y * 0.38;
    } else {
      const lookAhead = p.facing > 0 ? viewWidth * 0.32 : viewWidth * 0.68;
      centerX = p.x + viewWidth * 0.5 - lookAhead;
      centerY = p.y + 24;
    }
    const targetX = clamp(centerX - viewWidth * 0.5, PASS15_LEVEL.cameraBounds.x, PASS15_LEVEL.cameraBounds.x + PASS15_LEVEL.cameraBounds.width - viewWidth);
    const targetY = clamp(centerY - viewHeight * 0.5, PASS15_LEVEL.cameraBounds.y, PASS15_LEVEL.cameraBounds.y + PASS15_LEVEL.cameraBounds.height - viewHeight);
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
    this.drawVisualWorld(ctx);
    this.drawAtmosphericDepth(ctx);
    this.drawBuriedStructure(ctx);
    this.drawUnevenTunnelStructure(ctx);
    this.drawDestructionMazeStructure(ctx);
    this.drawGiantCurveStructure(ctx);
    this.drawFirstInternalDescent(ctx);
    this.drawDoubleWallChase(ctx);
    this.drawGrappleChamber(ctx);
    this.drawDashSpikeChamber(ctx);
    this.drawPrecisionParkourChamber(ctx);
    this.drawGiantDirectionTurn(ctx);
    this.drawCollapsingBridge(ctx);
    this.drawChaseSupports(ctx);
    this.drawLevel(ctx);
    this.drawAuthoredTerrainDetails(ctx);
    this.drawDashSpikes(ctx);
    this.drawPrecisionHazards(ctx);
    this.drawMovingPlatforms(ctx);
    this.drawBreakables(ctx);
    this.drawDebris(ctx);
    this.drawBoulder(ctx);
    this.drawMarkers(ctx);
    this.drawGrappleAnchors(ctx);
    this.drawPlayer(ctx);
    ctx.restore();
    this.drawChaseHud(ctx);
  }

  drawChaseHud(ctx) {
    if (!this.chase.triggered) return;
    const progress = this.chase.pathDistance / PASS15_CHASE.path.totalDistance;
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

  drawVisualWorld(ctx) {
    ctx.save();
    for (const [index, zone] of ZONES.entries()) {
      const theme = PASS16_THEMES[index];
      const bounds = zone.bounds;
      ctx.fillStyle = `${theme.background}b8`;
      ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

      ctx.fillStyle = `${theme.midground}88`;
      const columnWidth = 150 + (index % 3) * 35;
      const spacing = 520 + (index % 2) * 110;
      for (let x = bounds.x + 120; x < bounds.x + bounds.width; x += spacing) {
        const height = Math.min(bounds.height * 0.72, 420 + ((Math.round(x / spacing) + index) % 4) * 130);
        ctx.fillRect(x, bounds.y + bounds.height - height, columnWidth, height);
        ctx.beginPath();
        ctx.arc(x + columnWidth * 0.5, bounds.y + bounds.height - height, columnWidth * 0.5, Math.PI, 0);
        ctx.fill();
      }

      ctx.strokeStyle = `${theme.edge}38`;
      ctx.lineWidth = 12;
      ctx.strokeRect(bounds.x + 18, bounds.y + 18, bounds.width - 36, bounds.height - 36);
    }

    ctx.globalCompositeOperation = "screen";
    for (const light of PASS16_LIGHTS) {
      const gradient = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, light.radius);
      gradient.addColorStop(0, `${light.color}52`);
      gradient.addColorStop(0.35, `${light.color}1f`);
      gradient.addColorStop(1, `${light.color}00`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawAtmosphericDepth(ctx) {
    ctx.save();
    for (const [index, zone] of ZONES.entries()) {
      const theme = PASS16_THEMES[index];
      const bounds = zone.bounds;
      const fog = ctx.createLinearGradient(bounds.x, bounds.y, bounds.x, bounds.y + bounds.height);
      fog.addColorStop(0, `${theme.background}00`);
      fog.addColorStop(0.58, `${theme.background}18`);
      fog.addColorStop(1, `${theme.midground}46`);
      ctx.fillStyle = fog;
      ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }
    ctx.restore();
  }

  drawAuthoredTerrainDetails(ctx) {
    ctx.save();
    for (const support of PASS17_SUPPORTS) {
      ctx.fillStyle = `${support.color}b0`;
      ctx.fillRect(support.x, support.y, support.width, support.height);
      ctx.strokeStyle = "rgba(210, 220, 207, 0.16)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(support.x, support.y);
      ctx.lineTo(support.x + support.width, support.y + support.height);
      ctx.moveTo(support.x + support.width, support.y);
      ctx.lineTo(support.x, support.y + support.height);
      ctx.stroke();
    }

    for (const frame of PASS17_REINFORCEMENTS) {
      ctx.strokeStyle = `${frame.color}72`;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(frame.x, frame.y + frame.height);
      ctx.lineTo(frame.x, frame.y + 28);
      ctx.quadraticCurveTo(frame.x + frame.width * 0.5, frame.y - 18, frame.x + frame.width, frame.y + 28);
      ctx.lineTo(frame.x + frame.width, frame.y + frame.height);
      ctx.stroke();
      ctx.fillStyle = `${frame.color}33`;
      ctx.beginPath();
      ctx.arc(frame.x, frame.y + frame.height, 10, 0, Math.PI * 2);
      ctx.arc(frame.x + frame.width, frame.y + frame.height, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const plant of PASS17_VEGETATION) {
      ctx.fillStyle = `${plant.color}c8`;
      const leaves = 7;
      for (let index = 0; index < leaves; index += 1) {
        const ratio = index / (leaves - 1);
        const x = plant.x + plant.width * ratio;
        const height = plant.height * (0.45 + ((index * 7) % 5) * 0.12);
        ctx.beginPath();
        ctx.moveTo(x - 8, plant.y);
        ctx.quadraticCurveTo(x, plant.y - height, x + 8, plant.y);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawLevel(ctx) {
    ctx.save();
    for (const item of PASS15_LEVEL.floors) {
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
      if (item.phase === 15) {
        ctx.strokeStyle = item.lane === "final_landing" ? "#9cb2ae" : "#d0a46b";
        ctx.lineWidth = item.lane === "final_landing" ? 34 : 22;
        ctx.beginPath();
        ctx.moveTo(item.x1, item.y1 + 11);
        ctx.lineTo(item.x2, item.y2 + 11);
        ctx.stroke();
        ctx.strokeStyle = item.lane === "final_landing" ? "#d6ddd7" : "#f0c985";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(item.x1, item.y1);
        ctx.lineTo(item.x2, item.y2);
        ctx.stroke();
        continue;
      }
      const zoneIndex = item.phase === 15 ? 10 : item.zone ?? 1;
      const floorTheme = getPass16Theme(zoneIndex);
      const material = getPass17Material(zoneIndex);
      ctx.fillStyle = material.base;
      ctx.beginPath();
      ctx.moveTo(item.x1, item.y1);
      ctx.lineTo(item.x2, item.y2);
      ctx.lineTo(item.x2, item.y2 + 260);
      ctx.lineTo(item.x1, item.y1 + 260);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = material.cap;
      ctx.lineWidth = material.capWidth;
      ctx.beginPath();
      ctx.moveTo(item.x1, item.y1);
      ctx.lineTo(item.x2, item.y2);
      ctx.stroke();
      const length = Math.hypot(item.x2 - item.x1, item.y2 - item.y1);
      const seams = Math.floor(length / material.seamSpacing);
      ctx.strokeStyle = `${material.seam}88`;
      ctx.lineWidth = 3;
      for (let index = 1; index <= seams; index += 1) {
        const ratio = index / (seams + 1);
        const x = item.x1 + (item.x2 - item.x1) * ratio;
        const y = item.y1 + (item.y2 - item.y1) * ratio;
        ctx.beginPath();
        ctx.moveTo(x - 8, y + 12);
        ctx.lineTo(x + 9, y + 42);
        ctx.stroke();
      }
    }
    for (const solid of PASS15_LEVEL.solids) {
      const zone08Solid = solid.role.startsWith("zone08_");
      const zone09Solid = solid.role.startsWith("zone09_");
      ctx.fillStyle = solid.role === "baffle" ? "#26383b" : solid.role === "ceiling" ? "#394041" : solid.role === "zone07_ceiling" ? "#3b3833" : zone08Solid ? "#3d3937" : zone09Solid ? "#344147" : "#304246";
      ctx.fillRect(solid.x, solid.y, solid.width, solid.height);
      const solidMaterial = getPass17Material(zone09Solid ? 9 : zone08Solid ? 8 : solid.role === "zone07_ceiling" ? 7 : solid.role === "ceiling" ? 4 : 2);
      ctx.strokeStyle = solidMaterial.cap;
      ctx.lineWidth = solidMaterial.capWidth;
      ctx.beginPath();
      ctx.moveTo(solid.x, solid.y);
      ctx.lineTo(solid.x + solid.width, solid.y);
      ctx.stroke();
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
    const roof = PASS12_LEVEL.roof;
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

    for (const item of PASS12_LEVEL.frames) {
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
    const roof = PASS12_LEVEL.zone04Roof;
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

    for (const item of PASS12_LEVEL.zone04Frames) {
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
    const roof = PASS12_LEVEL.zone05Roof;
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

    const corridor = PASS12_LEVEL.collapseCorridor;
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

    for (const support of PASS12_LEVEL.corridorSupports) {
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

    for (const item of PASS12_LEVEL.zone05Frames) {
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
    const curve = PASS12_LEVEL.boulderCurve;
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

    for (const item of PASS12_LEVEL.zone06Frames) {
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

  drawFirstInternalDescent(ctx) {
    ctx.save();
    ctx.fillStyle = "rgba(20, 31, 33, 0.95)";
    ctx.strokeStyle = "rgba(156, 129, 92, 0.72)";
    ctx.lineWidth = 5;
    ctx.fillRect(9000, PASS09_ZONE.surfaceCeilingY, 6500, 1900);
    ctx.beginPath();
    ctx.moveTo(9000, PASS09_ZONE.surfaceCeilingY);
    ctx.lineTo(15500, PASS09_ZONE.surfaceCeilingY);
    ctx.stroke();

    const corridor = PASS12_LEVEL.zone07BoulderCorridor;
    ctx.strokeStyle = "rgba(160, 92, 61, 0.20)";
    ctx.lineWidth = corridor.width;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    corridor.points.forEach((item, index) => {
      if (index === 0) ctx.moveTo(item.x, item.y);
      else ctx.lineTo(item.x, item.y);
    });
    ctx.stroke();
    ctx.strokeStyle = "rgba(222, 139, 88, 0.62)";
    ctx.lineWidth = 4;
    ctx.setLineDash([22, 16]);
    ctx.stroke();
    ctx.setLineDash([]);

    for (const item of PASS12_LEVEL.zone07Frames) {
      ctx.fillStyle = "rgba(160, 130, 92, 0.055)";
      ctx.strokeStyle = "rgba(196, 162, 113, 0.34)";
      ctx.lineWidth = 3;
      ctx.fillRect(item.x, item.y, item.width, item.height);
      ctx.strokeRect(item.x, item.y, item.width, item.height);
      ctx.beginPath();
      ctx.moveTo(item.x, item.y + item.height);
      ctx.quadraticCurveTo(item.x + item.width * 0.5, item.y + 40, item.x + item.width, item.y + item.height);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawDoubleWallChase(ctx) {
    ctx.save();
    ctx.fillStyle = "rgba(23, 29, 32, 0.96)";
    ctx.strokeStyle = "rgba(170, 139, 99, 0.76)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(15200, PASS10_ZONE.surfaceCeilingY);
    ctx.lineTo(16400, 5520);
    ctx.lineTo(17400, 5720);
    ctx.lineTo(18700, 5800);
    ctx.lineTo(20500, 5850);
    ctx.lineTo(23600, 5750);
    ctx.lineTo(23600, 7100);
    ctx.lineTo(15200, 7100);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(15200, PASS10_ZONE.surfaceCeilingY);
    ctx.lineTo(16400, 5520);
    ctx.lineTo(17400, 5720);
    ctx.lineTo(18700, 5800);
    ctx.lineTo(20500, 5850);
    ctx.lineTo(23600, 5750);
    ctx.stroke();

    const corridor = PASS12_LEVEL.zone08BoulderCorridor;
    ctx.strokeStyle = "rgba(165, 88, 59, 0.20)";
    ctx.lineWidth = corridor.width;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    corridor.points.forEach((item, index) => {
      if (index === 0) ctx.moveTo(item.x, item.y);
      else ctx.lineTo(item.x, item.y);
    });
    ctx.stroke();
    ctx.strokeStyle = "rgba(226, 142, 88, 0.64)";
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 15]);
    ctx.stroke();
    ctx.setLineDash([]);

    for (const item of PASS12_LEVEL.zone08Frames) {
      ctx.fillStyle = "rgba(168, 139, 98, 0.05)";
      ctx.strokeStyle = "rgba(205, 169, 117, 0.34)";
      ctx.lineWidth = 3;
      ctx.fillRect(item.x, item.y, item.width, item.height);
      ctx.strokeRect(item.x, item.y, item.width, item.height);
      ctx.beginPath();
      ctx.moveTo(item.x, item.y + item.height);
      ctx.quadraticCurveTo(item.x + item.width * 0.5, item.y + 26, item.x + item.width, item.y + item.height);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawGrappleChamber(ctx) {
    ctx.save();
    ctx.fillStyle = "rgba(18, 30, 35, 0.97)";
    ctx.strokeStyle = "rgba(111, 178, 184, 0.72)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(23600, PASS11_ZONE.surfaceCeilingY);
    ctx.quadraticCurveTo(24400, 5400, 25100, 5850);
    ctx.quadraticCurveTo(25800, 6350, 25300, 7200);
    ctx.lineTo(22000, 7540);
    ctx.lineTo(21850, 6600);
    ctx.quadraticCurveTo(22600, 6100, 23600, PASS11_ZONE.surfaceCeilingY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const corridor = PASS12_LEVEL.zone09BoulderCorridor;
    ctx.strokeStyle = "rgba(69, 118, 125, 0.23)";
    ctx.lineWidth = corridor.width;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    corridor.points.forEach((item, index) => {
      if (index === 0) ctx.moveTo(item.x, item.y);
      else ctx.lineTo(item.x, item.y);
    });
    ctx.stroke();
    ctx.strokeStyle = "rgba(224, 145, 87, 0.66)";
    ctx.lineWidth = 4;
    ctx.setLineDash([22, 18]);
    ctx.stroke();
    ctx.setLineDash([]);

    for (const item of PASS12_LEVEL.zone09BoulderFloors) {
      ctx.strokeStyle = "rgba(126, 171, 173, 0.58)";
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(item.x1, item.y1);
      ctx.lineTo(item.x2, item.y2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(39, 65, 69, 0.9)";
      ctx.lineWidth = 30;
      ctx.beginPath();
      ctx.moveTo(item.x1, item.y1 + 18);
      ctx.lineTo(item.x2, item.y2 + 18);
      ctx.stroke();
    }

    for (const item of PASS12_LEVEL.zone09Frames) {
      ctx.fillStyle = "rgba(91, 151, 158, 0.045)";
      ctx.strokeStyle = "rgba(139, 199, 202, 0.31)";
      ctx.lineWidth = 3;
      ctx.fillRect(item.x, item.y, item.width, item.height);
      ctx.strokeRect(item.x, item.y, item.width, item.height);
      ctx.beginPath();
      ctx.moveTo(item.x, item.y + item.height);
      ctx.quadraticCurveTo(item.x + item.width * 0.45, item.y + 30, item.x + item.width, item.y + item.height * 0.74);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawDashSpikeChamber(ctx) {
    ctx.save();
    ctx.fillStyle = "rgba(17, 27, 31, 0.97)";
    ctx.strokeStyle = "rgba(117, 174, 178, 0.66)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(PASS12_ZONE.entry.x, PASS12_ZONE.surfaceCeilingY);
    ctx.quadraticCurveTo(21700, 6750, 21200, 6860);
    ctx.quadraticCurveTo(20700, 6920, PASS12_ZONE.exit.x, 7200);
    ctx.lineTo(19900, 7600);
    ctx.lineTo(22550, 7600);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const corridor = PASS12_LEVEL.zone09DashBoulderCorridor;
    ctx.strokeStyle = "rgba(82, 123, 127, 0.23)";
    ctx.lineWidth = corridor.width;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    corridor.points.forEach((item, index) => {
      if (index === 0) ctx.moveTo(item.x, item.y);
      else ctx.lineTo(item.x, item.y);
    });
    ctx.stroke();
    ctx.strokeStyle = "rgba(222, 142, 83, 0.63)";
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 16]);
    ctx.stroke();
    ctx.setLineDash([]);

    for (const item of PASS12_LEVEL.zone09DashBoulderFloors) {
      ctx.strokeStyle = "rgba(110, 155, 158, 0.58)";
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(item.x1, item.y1);
      ctx.lineTo(item.x2, item.y2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(34, 57, 61, 0.92)";
      ctx.lineWidth = 30;
      ctx.beginPath();
      ctx.moveTo(item.x1, item.y1 + 18);
      ctx.lineTo(item.x2, item.y2 + 18);
      ctx.stroke();
    }

    for (const item of PASS12_LEVEL.zone09DashFrames) {
      ctx.fillStyle = "rgba(94, 144, 148, 0.04)";
      ctx.strokeStyle = "rgba(130, 184, 187, 0.28)";
      ctx.lineWidth = 3;
      ctx.fillRect(item.x, item.y, item.width, item.height);
      ctx.strokeRect(item.x, item.y, item.width, item.height);
      ctx.beginPath();
      ctx.moveTo(item.x, item.y + item.height);
      ctx.quadraticCurveTo(item.x + item.width * 0.5, item.y + 28, item.x + item.width, item.y + item.height * 0.8);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawPrecisionParkourChamber(ctx) {
    ctx.save();
    ctx.fillStyle = "rgba(14, 24, 28, 0.97)";
    ctx.strokeStyle = "rgba(117, 174, 178, 0.66)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(20360, 7040);
    ctx.quadraticCurveTo(19900, 6900, 19420, 7000);
    ctx.quadraticCurveTo(18900, 7080, 18590, 7370);
    ctx.quadraticCurveTo(18480, 7600, 18820, 7830);
    ctx.quadraticCurveTo(19320, 7940, 19960, 7800);
    ctx.lineTo(20360, 7480);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const corridor = PASS15_LEVEL.zone09PrecisionBoulderCorridor;
    ctx.strokeStyle = "rgba(82, 123, 127, 0.23)";
    ctx.lineWidth = corridor.width;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    corridor.points.forEach((item, index) => {
      if (index === 0) ctx.moveTo(item.x, item.y);
      else ctx.lineTo(item.x, item.y);
    });
    ctx.stroke();
    ctx.strokeStyle = "rgba(222, 142, 83, 0.63)";
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 16]);
    ctx.stroke();
    ctx.setLineDash([]);

    for (const item of PASS15_LEVEL.zone09PrecisionBoulderFloors) {
      ctx.strokeStyle = "rgba(110, 155, 158, 0.58)";
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(item.x1, item.y1);
      ctx.lineTo(item.x2, item.y2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(34, 57, 61, 0.92)";
      ctx.lineWidth = 30;
      ctx.beginPath();
      ctx.moveTo(item.x1, item.y1 + 18);
      ctx.lineTo(item.x2, item.y2 + 18);
      ctx.stroke();
    }

    for (const item of PASS15_LEVEL.zone09PrecisionFrames) {
      ctx.fillStyle = "rgba(94, 144, 148, 0.04)";
      ctx.strokeStyle = "rgba(130, 184, 187, 0.28)";
      ctx.lineWidth = 3;
      ctx.fillRect(item.x, item.y, item.width, item.height);
      ctx.strokeRect(item.x, item.y, item.width, item.height);
      ctx.beginPath();
      ctx.moveTo(item.x, item.y + item.height);
      ctx.quadraticCurveTo(item.x + item.width * 0.45, item.y + 36, item.x + item.width, item.y + item.height * 0.72);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawGiantDirectionTurn(ctx) {
    ctx.save();
    ctx.fillStyle = "rgba(11, 20, 24, 0.98)";
    ctx.strokeStyle = "rgba(109, 169, 175, 0.72)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(19920, 7300);
    ctx.quadraticCurveTo(18500, 7350, 17500, 7900);
    ctx.quadraticCurveTo(16300, 8500, 16350, 9100);
    ctx.quadraticCurveTo(17500, 9500, 19300, 9300);
    ctx.lineTo(19880, 9000);
    ctx.quadraticCurveTo(18100, 9160, 16950, 8840);
    ctx.quadraticCurveTo(17400, 8000, 19920, 7700);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const corridor = PASS15_LEVEL.zone09GiantCurveCorridor;
    ctx.strokeStyle = "rgba(68, 113, 120, 0.27)";
    ctx.lineWidth = corridor.width;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    corridor.points.forEach((item, index) => {
      if (index === 0) ctx.moveTo(item.x, item.y);
      else ctx.lineTo(item.x, item.y);
    });
    ctx.stroke();

    for (const item of PASS15_LEVEL.zone09GiantCurveBoulderFloors) {
      ctx.strokeStyle = "rgba(126, 183, 184, 0.82)";
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(item.x1, item.y1);
      ctx.lineTo(item.x2, item.y2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(35, 61, 66, 0.96)";
      ctx.lineWidth = 34;
      ctx.beginPath();
      ctx.moveTo(item.x1, item.y1 + 20);
      ctx.lineTo(item.x2, item.y2 + 20);
      ctx.stroke();
    }

    for (const item of PASS15_LEVEL.zone09GiantCurveFrames) {
      ctx.fillStyle = "rgba(87, 143, 149, 0.035)";
      ctx.strokeStyle = "rgba(134, 194, 197, 0.27)";
      ctx.lineWidth = 3;
      ctx.fillRect(item.x, item.y, item.width, item.height);
      ctx.strokeRect(item.x, item.y, item.width, item.height);
      ctx.beginPath();
      ctx.moveTo(item.x, item.y + item.height);
      ctx.quadraticCurveTo(item.x + item.width * 0.5, item.y + 40, item.x + item.width, item.y + item.height * 0.78);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(232, 183, 109, 0.78)";
    ctx.lineWidth = 4;
    ctx.setLineDash([16, 14]);
    ctx.beginPath();
    ctx.moveTo(PASS14_ZONE.naturalDrop.lip.x, PASS14_ZONE.naturalDrop.lip.y + 16);
    ctx.lineTo(PASS14_ZONE.naturalDrop.landing.x, PASS14_ZONE.naturalDrop.landing.y - 24);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  drawCollapsingBridge(ctx) {
    ctx.save();
    const corridor = PASS15_ZONE.boulderCorridor;
    ctx.strokeStyle = "rgba(121, 77, 51, 0.20)";
    ctx.lineWidth = corridor.width;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    corridor.points.forEach((item, index) => index === 0 ? ctx.moveTo(item.x, item.y) : ctx.lineTo(item.x, item.y));
    ctx.stroke();
    ctx.strokeStyle = "rgba(225, 151, 91, 0.62)";
    ctx.lineWidth = 4;
    ctx.setLineDash([24, 18]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = "rgba(176, 118, 69, 0.38)";
    ctx.lineWidth = 5;
    for (const item of PASS15_ZONE.floors.filter(floorItem => floorItem.lane === "wood_deck")) {
      if (this.collapsedFloorIds.has(item.id)) continue;
      const length = Math.hypot(item.x2 - item.x1, item.y2 - item.y1);
      const pieces = Math.max(1, Math.round(length / 85));
      for (let index = 1; index < pieces; index += 1) {
        const ratio = index / pieces;
        const x = item.x1 + (item.x2 - item.x1) * ratio;
        const y = item.y1 + (item.y2 - item.y1) * ratio;
        ctx.beginPath();
        ctx.moveTo(x - 6, y - 5);
        ctx.lineTo(x + 8, y + 22);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawDashSpikes(ctx) {
    const spike = PASS12_LEVEL.zone09DashSpikeBed;
    const width = (spike.x2 - spike.x1) / spike.teeth;
    ctx.save();
    ctx.fillStyle = "rgba(164, 79, 69, 0.88)";
    ctx.strokeStyle = "rgba(238, 151, 111, 0.92)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(spike.x1, spike.baseY);
    for (let index = 0; index < spike.teeth; index += 1) {
      const left = spike.x1 + width * index;
      ctx.lineTo(left + width * 0.5, spike.tipY + (index % 2) * 9);
      ctx.lineTo(left + width, spike.baseY);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  drawPrecisionHazards(ctx) {
    ctx.save();
    for (const hazard of PASS15_LEVEL.zone09PrecisionHazards) {
      const width = (hazard.x2 - hazard.x1) / hazard.teeth;
      ctx.fillStyle = "rgba(164, 79, 69, 0.88)";
      ctx.strokeStyle = "rgba(238, 151, 111, 0.92)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(hazard.x1, hazard.baseY);
      for (let index = 0; index < hazard.teeth; index += 1) {
        const left = hazard.x1 + width * index;
        ctx.lineTo(left + width * 0.5, hazard.tipY + (index % 2) * 8);
        ctx.lineTo(left + width, hazard.baseY);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  drawGrappleAnchors(ctx) {
    ctx.save();
    for (const item of PASS11_ZONE.anchors) {
      const used = this.usedGrappleAnchorIds.has(item.id);
      ctx.strokeStyle = used ? "rgba(126, 224, 202, 0.95)" : "rgba(177, 220, 218, 0.82)";
      ctx.fillStyle = used ? "rgba(57, 117, 111, 0.78)" : "rgba(52, 83, 88, 0.88)";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(item.x, item.y - 210);
      ctx.lineTo(item.x, item.y - 30);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(item.x, item.y, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(item.x - 26, item.y + 12);
      ctx.quadraticCurveTo(item.x, item.y + 58, item.x + 26, item.y + 12);
      ctx.stroke();
    }
    if (this.grapple.active) {
      const item = PASS11_ZONE.anchors.find(anchorItem => anchorItem.id === this.grapple.anchorId);
      if (item) {
        ctx.strokeStyle = "rgba(172, 239, 223, 0.95)";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(item.x, item.y);
        ctx.lineTo(this.player.x + PLAYER_PHYSICS.width * 0.5, this.player.y + PLAYER_PHYSICS.height * 0.45);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawChaseSupports(ctx) {
    ctx.save();
    for (const support of PASS15_CHASE.supportTargets) {
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
    const radius = PASS15_CHASE.boulder.radius;
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
      { x: 9700, y: 5000, label: "INTERNAL ENTRY", active: this.progress.zone07Entered },
      { x: 11650, y: 5450, label: "DROP I", active: this.progress.zone07UpperDrop },
      { x: 10200, y: 6000, label: "DROP II", active: this.progress.zone07MiddleDrop },
      { x: 15200, y: 5500, label: "PASS 09 EXIT", active: this.progress.pass09Completed },
      { x: 15950, y: 6300, label: "CHASE CLIMB I", active: this.progress.zone08ShaftOneCleared },
      { x: 17650, y: 6750, label: "CHASE CLIMB II", active: this.progress.zone08ShaftTwoCleared },
      { x: 23600, y: 5900, label: "PASS 10 EXIT", active: this.progress.pass10Completed },
      { x: 22400, y: 6900, label: "PASS 11 EXIT", active: this.progress.pass11Completed },
      { x: 21450, y: 7065, label: "AIR DASH SPIKES", active: this.progress.dashSpikeCleared },
      { x: 20300, y: 7200, label: "PASS 12 EXIT", active: this.progress.pass12Completed },
      { x: 19740, y: 7310, label: "SHORT CUT", active: this.progress.precisionShortGapCleared },
      { x: 18740, y: 7430, label: "TURN", active: this.progress.precisionDirectionReversed },
      { x: 19210, y: 7500, label: "LONG HOLD", active: this.progress.precisionLongGapCleared },
      { x: 19800, y: 7520, label: "PASS 13 EXIT", active: this.progress.pass13Completed },
      { x: 18780, y: 7800, label: "UPPER GAP", active: this.progress.giantCurveUpperGapCleared },
      { x: 16900, y: 8550, label: "NATURAL DROP", active: this.progress.giantCurveDropStarted },
      { x: 16700, y: 8800, label: "LOWER TURN", active: this.progress.giantCurveDirectionReversed },
      { x: 19000, y: 9000, label: "PASS 14 / BRIDGE", active: this.progress.pass14Completed },
      { x: 20240, y: 9115, label: "BRIDGE GAP I", active: this.progress.bridgeGapOneCleared },
      { x: 21960, y: 9275, label: "BRIDGE GAP II", active: this.progress.bridgeGapTwoCleared },
      { x: 23580, y: 9420, label: "BRIDGE GAP III", active: this.progress.bridgeGapThreeCleared },
      { x: 25200, y: 9600, label: "FINAL ESCAPE", active: this.progress.pass15Completed },
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
      ctx.fillStyle = index < 10 ? "rgba(216, 191, 120, 0.19)" : "rgba(69, 111, 119, 0.10)";
      ctx.strokeStyle = index < 10 ? "rgba(216, 191, 120, 0.75)" : "rgba(139, 190, 199, 0.32)";
      ctx.fillRect(topLeft.x, topLeft.y, width, height);
      ctx.strokeRect(topLeft.x, topLeft.y, width, height);
      ctx.fillStyle = index < 10 ? "#ead59b" : "#8cadb3";
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
    drawRoute(PASS13_ZONE.playerRoute, PALETTE.route, false);
    drawRoute(PASS14_ZONE.playerRoute, PALETTE.route, false);
    drawRoute(PASS15_ZONE.playerRoute, PALETTE.route, false);
    drawRoute(PASS15_CHASE.path.points, PALETTE.boulderRoute, true);
    ctx.fillStyle = "#eff5f3";
    ctx.font = "800 22px Arial, sans-serif";
    ctx.fillText("PASS 15 / COLLAPSING BRIDGE 01–10", 42, 52);
    ctx.fillStyle = "#a8bcc0";
    ctx.font = "700 10px Arial, sans-serif";
    ctx.fillText(`ACTIVE PATH ${PASS15_CHASE.path.points.length} POINTS · COLLAPSE PANELS ${PASS15_CHASE.collapsePanels.length} · THREE BROKEN GAPS / FINAL BOULDER PLUNGE`, 42, 72);
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
        grappleLaunchFrames: p.grappleLaunchFrames,
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
        breachDelayFrames: this.chase.breachDelayFrames,
        breachComplete: this.chase.breachComplete,
        internalBreakpointIndex: this.chase.internalBreakpointIndex,
        internalPauseFrames: this.chase.internalPauseFrames,
        pass14HeadStartFrames: this.chase.pass14HeadStartFrames,
        pass15HeadStartFrames: this.chase.pass15HeadStartFrames,
        activeFrames: this.chase.activeFrames,
        pathDistance: this.chase.pathDistance,
        pathProgress: this.chase.pathDistance / PASS15_CHASE.path.totalDistance,
        pathIndex: this.chase.pathIndex,
        x: this.chase.x,
        y: this.chase.y,
        speed: this.chase.speed,
      },
      collapsedFloorIds: Array.from(this.collapsedFloorIds).sort(),
      destroyedSupportIds: Array.from(this.destroyedSupportIds).sort(),
      grapple: {
        active: this.grapple.active,
        anchorId: this.grapple.anchorId,
        ropeLength: this.grapple.ropeLength,
        attachedFrames: this.grapple.attachedFrames,
        cooldown: this.grapple.cooldown,
        lastAnchorId: this.grapple.lastAnchorId,
        usedAnchorIds: Array.from(this.usedGrappleAnchorIds),
      },
      precisionJump: { ...this.precisionJump },
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
    const pass09 = validatePass09Level();
    const pass10 = validatePass10Level();
    const pass11 = validatePass11Level();
    const pass12 = validatePass12Level();
    const pass13 = validatePass13Level();
    const pass14 = validatePass14Level();
    const pass15 = validatePass15Level();
    const pass16 = validatePass16Visuals();
    const pass17 = validatePass17Art();
    const scriptSources = Array.from(document.scripts).map(script => script.getAttribute("src") ?? "");
    const checks = [
      { id: "build_id", passed: BUILD.id === "rebuild-v2-pass17" },
      { id: "pass_number", passed: BUILD.pass === 17 },
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
      { id: "pass09_level_validation", passed: pass09.passed },
      { id: "pass10_level_validation", passed: pass10.passed },
      { id: "pass11_level_validation", passed: pass11.passed },
      { id: "pass12_level_validation", passed: pass12.passed },
      { id: "pass13_level_validation", passed: pass13.passed },
      { id: "pass14_level_validation", passed: pass14.passed },
      { id: "pass15_level_validation", passed: pass15.passed },
      { id: "pass16_visual_validation", passed: pass16.passed },
      { id: "pass17_art_validation", passed: pass17.passed },
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
      pass09,
      pass10,
      pass11,
      pass12,
      pass13,
      pass14,
      pass15,
      pass16,
      pass17,
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
    this.statusElements.build.textContent = "PASS 17 · AUTHORED TERRAIN 01–10";
    this.statusElements.audit.textContent = `AUDIT ${audit.passedCount}/${audit.total} · P17 ${audit.pass17.passedCount}/${audit.pass17.total}`;
    this.statusElements.audit.dataset.state = audit.passed ? "pass" : "fail";
  }
}
