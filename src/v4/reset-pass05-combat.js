import {
  RESET_AIR_MOVEMENT,
  createResetAirPlayer,
  stepResetAirPlayer,
} from "./reset-pass03-air-movement.js";
import {
  RESET_GROUND_MOVEMENT,
} from "./reset-pass02-ground-movement.js";
import {
  validateResetPass04Collision,
} from "./reset-pass04-collision.js";

export const RESET_PASS05_BUILD = Object.freeze({
  id: "rebuild-v4-reset-pass05-combat",
  pass: 5,
  branch: "rebuild/mega-room-v4-40pass",
  scope:
    "basic attack phases, hit reaction, recovery, invulnerability, and cancel rules",
  finalArtIncluded: false,
});

export const RESET_COMBAT_CONTRACT = Object.freeze({
  attackInput: "KeyB",
  startupSeconds: 0.07,
  activeSeconds: 0.09,
  recoverySeconds: 0.18,
  totalSeconds: 0.34,
  recoveryBufferSeconds: 0.12,
  movementSpeedFactor: 0.82,
  attackReach: 92,
  attackHeightInset: 6,
  attackDamage: 1,
  maximumBufferedAttacks: 1,
  hitstunSeconds: 0.22,
  invulnerabilitySeconds: 0.85,
  knockbackHorizontalSpeed: 310,
  knockbackVerticalSpeed: 360,
  maximumHealth: 4,
  startupJumpCancelAllowed: true,
  activeJumpCancelAllowed: false,
  recoveryJumpCancelAllowed: true,
  incomingHitCancelsAttack: true,
  heldAttackAutoRepeats: false,
});

export const RESET_PASS05_LAB = Object.freeze({
  width: 2700,
  height: 900,
  viewportWidth: 1400,
  viewportHeight: 900,
  floorY: 720,
  spawnX: 90,
  finishX: 2520,
  gateX: 1480,
  leftBoundary: 20,
  rightBoundary: 2670,
});

export const RESET_PASS05_SOLIDS = Object.freeze([
  Object.freeze({
    id: "combat-floor",
    x: -200,
    y: RESET_PASS05_LAB.floorY,
    width: RESET_PASS05_LAB.width + 400,
    height: 300,
  }),
]);

export const RESET_PASS05_TARGETS = Object.freeze([
  Object.freeze({
    id: "low-calibration-target",
    role: "low",
    x: 700,
    y: 656,
    width: 50,
    height: 64,
    maximumHealth: 2,
  }),
  Object.freeze({
    id: "high-calibration-target",
    role: "high",
    x: 1280,
    y: 545,
    width: 50,
    height: 52,
    maximumHealth: 1,
  }),
]);

export const RESET_PASS05_HAZARDS = Object.freeze([
  Object.freeze({
    id: "impact-pad",
    x: 1850,
    y: 704,
    width: 110,
    height: 16,
    sourceX: 1905,
    damage: 1,
  }),
]);

const clamp = (value, minimum, maximum) =>
  Math.max(minimum, Math.min(maximum, value));

const approach = (value, target, maximumDelta) => {
  if (value < target) return Math.min(value + maximumDelta, target);
  if (value > target) return Math.max(value - maximumDelta, target);
  return value;
};

const rectanglesOverlap = (one, two) =>
  one.x < two.x + two.width &&
  one.x + one.width > two.x &&
  one.y < two.y + two.height &&
  one.y + one.height > two.y;

const idleAttack = (serial = 0) => ({
  phase: "idle",
  phaseElapsed: 0,
  serial,
  facing: 1,
  buffered: false,
});

const phaseDuration = phase => {
  if (phase === "startup") {
    return RESET_COMBAT_CONTRACT.startupSeconds;
  }
  if (phase === "active") {
    return RESET_COMBAT_CONTRACT.activeSeconds;
  }
  if (phase === "recovery") {
    return RESET_COMBAT_CONTRACT.recoverySeconds;
  }
  return 0;
};

const beginAttack = (attack, facing) => ({
  phase: "startup",
  phaseElapsed: 0,
  serial: attack.serial + 1,
  facing,
  buffered: false,
});

function advanceAttack(attack, dt, events) {
  let next = { ...attack };
  let remaining = dt;
  while (next.phase !== "idle" && remaining > 0) {
    const duration = phaseDuration(next.phase);
    const untilBoundary = duration - next.phaseElapsed;
    if (remaining + 1e-9 < untilBoundary) {
      next.phaseElapsed += remaining;
      remaining = 0;
      continue;
    }
    remaining = Math.max(0, remaining - untilBoundary);
    if (next.phase === "startup") {
      next.phase = "active";
      next.phaseElapsed = 0;
      events.attackActivated = true;
    } else if (next.phase === "active") {
      next.phase = "recovery";
      next.phaseElapsed = 0;
      events.attackRecoveryStarted = true;
    } else {
      const buffered = next.buffered;
      const serial = next.serial;
      next = idleAttack(serial);
      events.attackRecovered = true;
      if (buffered) {
        next = beginAttack(next, attack.facing);
        events.attackStarted = true;
        events.bufferedAttackStarted = true;
      }
    }
  }
  return next;
}

function stepAttack(current, input, canAct, dt) {
  const events = {
    attackStarted: false,
    attackActivated: false,
    attackRecoveryStarted: false,
    attackRecovered: false,
    bufferedAttackQueued: false,
    bufferedAttackStarted: false,
    attackCancelled: null,
    attackPressIgnored: false,
    jumpBlockedByActiveAttack: false,
  };
  let attack = { ...current.attack };
  let allowJump = Boolean(input.jumpPressed || input.jumpHeld);

  if (!canAct) {
    if (attack.phase !== "idle") {
      events.attackCancelled = "hit";
      attack = idleAttack(attack.serial);
    }
    return { attack, events, allowJump: false };
  }

  if (input.attackPressed) {
    if (attack.phase === "idle") {
      attack = beginAttack(attack, current.facing);
      events.attackStarted = true;
    } else {
      const remaining = phaseDuration(attack.phase) - attack.phaseElapsed;
      if (
        attack.phase === "recovery" &&
        remaining <= RESET_COMBAT_CONTRACT.recoveryBufferSeconds &&
        !attack.buffered
      ) {
        attack.buffered = true;
        events.bufferedAttackQueued = true;
      } else {
        events.attackPressIgnored = true;
      }
    }
  }

  if (input.jumpPressed && attack.phase !== "idle") {
    if (
      attack.phase === "startup" &&
      RESET_COMBAT_CONTRACT.startupJumpCancelAllowed
    ) {
      events.attackCancelled = "jump-from-startup";
      attack = idleAttack(attack.serial);
    } else if (
      attack.phase === "recovery" &&
      RESET_COMBAT_CONTRACT.recoveryJumpCancelAllowed
    ) {
      events.attackCancelled = "jump-from-recovery";
      attack = idleAttack(attack.serial);
    } else if (attack.phase === "active") {
      allowJump = false;
      events.jumpBlockedByActiveAttack = true;
    }
  }

  attack = advanceAttack(attack, dt, events);
  return { attack, events, allowJump };
}

export function createResetCombatPlayer({
  x = RESET_PASS05_LAB.spawnX,
  floorY = RESET_PASS05_LAB.floorY,
} = {}) {
  return {
    ...createResetAirPlayer({ x, floorY }),
    health: RESET_COMBAT_CONTRACT.maximumHealth,
    hitstunRemaining: 0,
    invulnerabilityRemaining: 0,
    attack: idleAttack(),
    damageTaken: 0,
    ignoredDamage: 0,
    attackCancels: 0,
    events: {
      attackStarted: false,
      attackActivated: false,
      attackRecoveryStarted: false,
      attackRecovered: false,
      bufferedAttackQueued: false,
      bufferedAttackStarted: false,
      attackCancelled: null,
      attackPressIgnored: false,
      jumpBlockedByActiveAttack: false,
      damageTaken: false,
      damageIgnored: false,
      defeated: false,
    },
  };
}

export function attackHitboxFor(player) {
  if (player.attack.phase !== "active") return null;
  const inset = RESET_COMBAT_CONTRACT.attackHeightInset;
  return {
    x: player.attack.facing > 0
      ? player.x + RESET_GROUND_MOVEMENT.playerWidth
      : player.x - RESET_COMBAT_CONTRACT.attackReach,
    y: player.y + inset,
    width: RESET_COMBAT_CONTRACT.attackReach,
    height: RESET_GROUND_MOVEMENT.playerHeight - inset * 2,
  };
}

export function stepResetCombatPlayer(
  current,
  input = {},
  dt = RESET_GROUND_MOVEMENT.fixedStep,
  incomingHit = null,
  environment = {},
) {
  const damageAccepted = Boolean(
    incomingHit &&
    current.invulnerabilityRemaining <= 0 &&
    current.health > 0,
  );
  const combat = stepAttack(
    current,
    input,
    !damageAccepted && current.hitstunRemaining <= 0 && current.health > 0,
    dt,
  );
  let working = {
    ...current,
    attack: combat.attack,
  };
  let damageTaken = false;
  let damageIgnored = false;
  let defeated = false;

  if (incomingHit && !damageAccepted) {
    damageIgnored = current.invulnerabilityRemaining > 0;
  }

  if (damageAccepted) {
    const direction = incomingHit.sourceX >=
      current.x + RESET_GROUND_MOVEMENT.playerWidth / 2
      ? -1
      : 1;
    working.health = Math.max(
      0,
      current.health - (incomingHit.damage ?? 1),
    );
    working.damageTaken = current.damageTaken + 1;
    working.hitstunRemaining = RESET_COMBAT_CONTRACT.hitstunSeconds;
    working.invulnerabilityRemaining =
      RESET_COMBAT_CONTRACT.invulnerabilitySeconds;
    working.vx =
      direction * RESET_COMBAT_CONTRACT.knockbackHorizontalSpeed;
    working.vy = -RESET_COMBAT_CONTRACT.knockbackVerticalSpeed;
    working.grounded = false;
    working.attack = idleAttack(current.attack.serial);
    damageTaken = true;
    defeated = working.health <= 0;
  } else if (damageIgnored) {
    working.ignoredDamage = current.ignoredDamage + 1;
  }

  const inHitstun = working.hitstunRemaining > 0;
  const movementInput = inHitstun
    ? {
        left: false,
        right: false,
        jumpPressed: false,
        jumpHeld: false,
      }
    : {
        left: Boolean(input.left),
        right: Boolean(input.right),
        jumpPressed: combat.allowJump && Boolean(input.jumpPressed),
        jumpHeld: combat.allowJump && Boolean(input.jumpHeld),
      };
  const beforeX = working.x;
  const beforeY = working.y;
  let player = stepResetAirPlayer(
    working,
    movementInput,
    dt,
    environment.solids ?? RESET_PASS05_SOLIDS,
  );

  if (inHitstun) {
    player.vx = approach(
      player.vx,
      0,
      RESET_GROUND_MOVEMENT.groundStopDeceleration * 0.36 * dt,
    );
  } else if (player.attack.phase !== "idle") {
    const maximumAttackSpeed =
      RESET_GROUND_MOVEMENT.maximumRunSpeed *
      RESET_COMBAT_CONTRACT.movementSpeedFactor;
    const beforeVelocity = clamp(
      working.vx,
      -maximumAttackSpeed,
      maximumAttackSpeed,
    );
    player.vx = clamp(
      player.vx,
      -maximumAttackSpeed,
      maximumAttackSpeed,
    );
    player.x = beforeX + (beforeVelocity + player.vx) * 0.5 * dt;
  }

  player.x = clamp(
    player.x,
    environment.leftBoundary ?? RESET_PASS05_LAB.leftBoundary,
    (environment.rightBoundary ?? RESET_PASS05_LAB.rightBoundary) -
      RESET_GROUND_MOVEMENT.playerWidth,
  );
  player.hitstunRemaining = Math.max(
    0,
    working.hitstunRemaining - dt,
  );
  player.invulnerabilityRemaining = Math.max(
    0,
    working.invulnerabilityRemaining - dt,
  );
  player.attack = working.attack;
  player.health = working.health;
  player.damageTaken = working.damageTaken;
  player.ignoredDamage = working.ignoredDamage;
  player.attackCancels = current.attackCancels +
    (combat.events.attackCancelled ? 1 : 0);
  player.events = {
    ...player.events,
    ...combat.events,
    damageTaken,
    damageIgnored,
    defeated,
  };
  if (player.hitstunRemaining > 0) player.state = "hit";
  if (defeated) player.state = "defeated";
  player.lastPositionStep = Math.hypot(
    player.x - beforeX,
    player.y - beforeY,
  );
  return player;
}

export function createResetCombatScenario() {
  return {
    player: createResetCombatPlayer(),
    targets: RESET_PASS05_TARGETS.map(target => ({
      ...target,
      health: target.maximumHealth,
      lastHitSerial: 0,
      hitFlashRemaining: 0,
    })),
    gateOpen: false,
    gateBlocked: 0,
    hazardContacts: 0,
    targetHits: 0,
    targetsDestroyed: 0,
    completed: false,
    seconds: 0,
    events: {
      targetHits: [],
      gateOpened: false,
      gateBlocked: false,
      hazardContact: null,
      completed: false,
    },
  };
}

const hazardAtPlayer = player => RESET_PASS05_HAZARDS.find(hazard =>
  rectanglesOverlap(
    {
      x: player.x,
      y: player.y,
      width: RESET_GROUND_MOVEMENT.playerWidth,
      height: RESET_GROUND_MOVEMENT.playerHeight,
    },
    hazard,
  )) ?? null;

export function stepResetCombatScenario(
  current,
  input = {},
  dt = RESET_GROUND_MOVEMENT.fixedStep,
) {
  const hazard = hazardAtPlayer(current.player);
  let player = stepResetCombatPlayer(
    current.player,
    input,
    dt,
    hazard,
  );
  const targets = current.targets.map(target => ({
    ...target,
    hitFlashRemaining: Math.max(0, target.hitFlashRemaining - dt),
  }));
  const targetHitEvents = [];
  let targetHits = current.targetHits;
  let targetsDestroyed = current.targetsDestroyed;
  const hitbox = attackHitboxFor(player);
  if (hitbox) {
    for (const target of targets) {
      if (
        target.health > 0 &&
        target.lastHitSerial !== player.attack.serial &&
        rectanglesOverlap(hitbox, target)
      ) {
        target.health = Math.max(
          0,
          target.health - RESET_COMBAT_CONTRACT.attackDamage,
        );
        target.lastHitSerial = player.attack.serial;
        target.hitFlashRemaining = 0.12;
        targetHits += 1;
        if (target.health === 0) targetsDestroyed += 1;
        targetHitEvents.push({
          id: target.id,
          health: target.health,
          attackSerial: player.attack.serial,
        });
      }
    }
  }

  const gateOpen =
    targets.every(target => target.health <= 0);
  let gateBlocked = current.gateBlocked;
  let blockedThisFrame = false;
  if (
    !gateOpen &&
    player.x + RESET_GROUND_MOVEMENT.playerWidth >
      RESET_PASS05_LAB.gateX
  ) {
    player.x =
      RESET_PASS05_LAB.gateX - RESET_GROUND_MOVEMENT.playerWidth;
    player.vx = Math.min(0, player.vx);
    gateBlocked += 1;
    blockedThisFrame = true;
  }

  const completed =
    gateOpen && player.x >= RESET_PASS05_LAB.finishX;
  return {
    player,
    targets,
    gateOpen,
    gateBlocked,
    hazardContacts:
      current.hazardContacts +
      (player.events.damageTaken ? 1 : 0),
    targetHits,
    targetsDestroyed,
    completed,
    seconds: current.seconds + dt,
    events: {
      targetHits: targetHitEvents,
      gateOpened: gateOpen && !current.gateOpen,
      gateBlocked: blockedThisFrame,
      hazardContact: player.events.damageTaken
        ? hazard?.id ?? null
        : null,
      completed: completed && !current.completed,
    },
  };
}

function simulateAttackTimeline() {
  let player = createResetCombatPlayer();
  const phases = [];
  const durations = {
    startup: 0,
    active: 0,
    recovery: 0,
  };
  let elapsed = 0;
  let pressed = false;
  while ((player.attack.serial < 1 || player.attack.phase !== "idle") &&
    elapsed < 2) {
    player = stepResetCombatPlayer(
      player,
      { attackPressed: !pressed },
    );
    pressed = true;
    if (
      player.attack.phase !== "idle" &&
      !phases.includes(player.attack.phase)
    ) {
      phases.push(player.attack.phase);
    }
    if (player.attack.phase !== "idle") {
      durations[player.attack.phase] += RESET_GROUND_MOVEMENT.fixedStep;
    }
    elapsed += RESET_GROUND_MOVEMENT.fixedStep;
  }
  return { phases, durations, totalSeconds: elapsed, serial: player.attack.serial };
}

function simulateMovementDuringAttack() {
  let player = createResetCombatPlayer();
  player.vx = RESET_GROUND_MOVEMENT.maximumRunSpeed;
  player.state = "run-loop";
  const startX = player.x;
  let maximumSpeed = 0;
  let minimumMovingSpeed = Infinity;
  let frames = 0;
  while (frames < 50) {
    player = stepResetCombatPlayer(
      player,
      {
        right: true,
        attackPressed: frames === 0,
      },
    );
    if (player.attack.phase !== "idle") {
      maximumSpeed = Math.max(maximumSpeed, Math.abs(player.vx));
      if (Math.abs(player.vx) > 0) {
        minimumMovingSpeed = Math.min(
          minimumMovingSpeed,
          Math.abs(player.vx),
        );
      }
    }
    frames += 1;
  }
  return {
    distance: player.x - startX,
    maximumSpeed,
    minimumMovingSpeed,
    endX: player.x,
  };
}

function simulateCancelRules() {
  const startup = stepResetCombatPlayer(
    createResetCombatPlayer(),
    { attackPressed: true },
  );
  const startupCancelled = stepResetCombatPlayer(
    startup,
    { jumpPressed: true, jumpHeld: true },
  );

  let active = createResetCombatPlayer();
  active = stepResetCombatPlayer(active, { attackPressed: true });
  while (active.attack.phase !== "active") {
    active = stepResetCombatPlayer(active);
  }
  const activeJump = stepResetCombatPlayer(
    active,
    { jumpPressed: true, jumpHeld: true },
  );

  let recovery = createResetCombatPlayer();
  recovery = stepResetCombatPlayer(recovery, { attackPressed: true });
  while (recovery.attack.phase !== "recovery") {
    recovery = stepResetCombatPlayer(recovery);
  }
  const recoveryCancelled = stepResetCombatPlayer(
    recovery,
    { jumpPressed: true, jumpHeld: true },
  );
  return {
    startup: {
      phase: startupCancelled.attack.phase,
      jumped: startupCancelled.events.jumped,
      cancel: startupCancelled.events.attackCancelled,
    },
    active: {
      phase: activeJump.attack.phase,
      jumped: activeJump.events.jumped,
      blocked: activeJump.events.jumpBlockedByActiveAttack,
    },
    recovery: {
      phase: recoveryCancelled.attack.phase,
      jumped: recoveryCancelled.events.jumped,
      cancel: recoveryCancelled.events.attackCancelled,
    },
  };
}

function simulateBufferedChain() {
  let player = createResetCombatPlayer();
  let frames = 0;
  let queued = 0;
  let started = 0;
  let pressedAgain = false;
  while (player.attack.serial < 2 || player.attack.phase !== "idle") {
    const remaining = phaseDuration(player.attack.phase) -
      player.attack.phaseElapsed;
    const attackPressed = frames === 0 ||
      (
        !pressedAgain &&
        player.attack.phase === "recovery" &&
        remaining <= RESET_COMBAT_CONTRACT.recoveryBufferSeconds
      );
    if (attackPressed && frames > 0) pressedAgain = true;
    player = stepResetCombatPlayer(player, { attackPressed });
    if (player.events.bufferedAttackQueued) queued += 1;
    if (player.events.attackStarted) started += 1;
    frames += 1;
    if (frames > 180) break;
  }
  return {
    attackSerial: player.attack.serial,
    queued,
    started,
    frames,
  };
}

function simulateHitRecovery() {
  let player = createResetCombatPlayer({ x: 1000 });
  player = stepResetCombatPlayer(player, { attackPressed: true });
  while (player.attack.phase !== "active") {
    player = stepResetCombatPlayer(player);
  }
  const beforeHealth = player.health;
  player = stepResetCombatPlayer(
    player,
    {},
    RESET_GROUND_MOVEMENT.fixedStep,
    { sourceX: 1100, damage: 1 },
  );
  const afterFirst = {
    health: player.health,
    vx: player.vx,
    vy: player.vy,
    attackPhase: player.attack.phase,
    hitstunRemaining: player.hitstunRemaining,
    invulnerabilityRemaining: player.invulnerabilityRemaining,
  };
  let ignored = 0;
  let regainedControlAt = null;
  let elapsed = RESET_GROUND_MOVEMENT.fixedStep;
  const recoveryStartX = player.x;
  while (elapsed < 0.55) {
    player = stepResetCombatPlayer(
      player,
      { right: true },
      RESET_GROUND_MOVEMENT.fixedStep,
      { sourceX: 1100, damage: 1 },
    );
    if (player.events.damageIgnored) ignored += 1;
    if (
      regainedControlAt === null &&
      player.hitstunRemaining <= 0 &&
      player.vx > 0
    ) {
      regainedControlAt = elapsed;
    }
    elapsed += RESET_GROUND_MOVEMENT.fixedStep;
  }
  return {
    beforeHealth,
    afterFirst,
    finalHealth: player.health,
    ignored,
    regainedControlAt,
    recoveryDisplacement: player.x - recoveryStartX,
    invulnerabilityStillActive: player.invulnerabilityRemaining > 0,
  };
}

function simulateOneHitPerAttack() {
  let scenario = createResetCombatScenario();
  scenario.player.x = 620;
  let frames = 0;
  while (frames < 80) {
    scenario = stepResetCombatScenario(
      scenario,
      { attackPressed: frames === 0 },
    );
    frames += 1;
  }
  return {
    targetHealth: scenario.targets[0].health,
    targetHits: scenario.targetHits,
    attackSerial: scenario.player.attack.serial,
  };
}

export function measureResetPass05Combat() {
  return Object.freeze({
    attackTimeline: Object.freeze(simulateAttackTimeline()),
    movementDuringAttack: Object.freeze(
      simulateMovementDuringAttack(),
    ),
    cancelRules: Object.freeze(simulateCancelRules()),
    bufferedChain: Object.freeze(simulateBufferedChain()),
    hitRecovery: Object.freeze(simulateHitRecovery()),
    oneHitPerAttack: Object.freeze(simulateOneHitPerAttack()),
  });
}

export function validateResetPass05Combat() {
  const previous = validateResetPass04Collision();
  const measurements = measureResetPass05Combat();
  const timeline = measurements.attackTimeline;
  const movement = measurements.movementDuringAttack;
  const cancels = measurements.cancelRules;
  const chain = measurements.bufferedChain;
  const hit = measurements.hitRecovery;
  const once = measurements.oneHitPerAttack;
  const checks = [
    ["previousCollisionContractPasses", previous.passed],
    ["attackUsesExistingBInput",
      RESET_COMBAT_CONTRACT.attackInput === "KeyB"],
    ["attackHasThreeReadablePhases",
      timeline.phases.join(",") === "startup,active,recovery"],
    ["attackTotalIsResponsive",
      RESET_COMBAT_CONTRACT.totalSeconds <= 0.36],
    ["attackTimingSumsExactly",
      Math.abs(
        RESET_COMBAT_CONTRACT.startupSeconds +
        RESET_COMBAT_CONTRACT.activeSeconds +
        RESET_COMBAT_CONTRACT.recoverySeconds -
        RESET_COMBAT_CONTRACT.totalSeconds,
      ) < 1e-9],
    ["activeWindowIsReadable",
      RESET_COMBAT_CONTRACT.activeSeconds >= 0.08],
    ["movementIsNotStoppedDuringAttack",
      movement.distance > 100 && movement.minimumMovingSpeed > 0],
    ["attackMovementSpeedIsBounded",
      movement.maximumSpeed <=
        RESET_GROUND_MOVEMENT.maximumRunSpeed *
        RESET_COMBAT_CONTRACT.movementSpeedFactor + 0.01],
    ["startupCancelsIntoJump",
      cancels.startup.phase === "idle" &&
      cancels.startup.jumped &&
      cancels.startup.cancel === "jump-from-startup"],
    ["activeCannotGhostCancelIntoJump",
      cancels.active.phase === "active" &&
      !cancels.active.jumped &&
      cancels.active.blocked],
    ["recoveryCancelsIntoJump",
      cancels.recovery.phase === "idle" &&
      cancels.recovery.jumped &&
      cancels.recovery.cancel === "jump-from-recovery"],
    ["onlyOneBufferedAttackAllowed",
      RESET_COMBAT_CONTRACT.maximumBufferedAttacks === 1 &&
      chain.queued === 1],
    ["bufferedAttackStartsExactlyOnce",
      chain.attackSerial === 2 && chain.started === 2],
    ["heldAttackDoesNotAutoRepeat",
      !RESET_COMBAT_CONTRACT.heldAttackAutoRepeats],
    ["attackHitsTargetOnlyOncePerSerial",
      once.targetHits === 1 &&
      once.targetHealth ===
        RESET_PASS05_TARGETS[0].maximumHealth - 1],
    ["incomingHitCancelsAttack",
      hit.afterFirst.attackPhase === "idle"],
    ["hitDealsExactlyOneDamage",
      hit.beforeHealth - hit.afterFirst.health === 1],
    ["knockbackPointsAwayFromSource",
      hit.afterFirst.vx < 0 && hit.afterFirst.vy < 0],
    ["hitstunIsShorterThanInvulnerability",
      RESET_COMBAT_CONTRACT.hitstunSeconds <
        RESET_COMBAT_CONTRACT.invulnerabilitySeconds],
    ["repeatedContactIgnoredDuringInvulnerability",
      hit.ignored > 0 && hit.finalHealth === hit.afterFirst.health],
    ["controlReturnsBeforeInvulnerabilityEnds",
      hit.regainedControlAt !== null &&
      hit.invulnerabilityStillActive],
    ["playerHasRecoveryMovement",
      Math.abs(hit.recoveryDisplacement) > 1],
    ["gateRequiresBothCalibrationTargets",
      RESET_PASS05_TARGETS.length === 2],
    ["maximumHealthSupportsReadableMistakes",
      RESET_COMBAT_CONTRACT.maximumHealth >= 4],
  ].map(([name, passed]) => ({ name, passed: Boolean(passed) }));
  return Object.freeze({
    passed: checks.every(item => item.passed),
    passedCount: checks.filter(item => item.passed).length,
    totalCount: checks.length,
    checks: Object.freeze(checks),
    measurements,
    previousAudit: Object.freeze({
      id: "reset-pass04",
      passed: previous.passed,
      passedCount: previous.passedCount,
      totalCount: previous.totalCount,
    }),
  });
}
