import { chromium as playwright } from '/tmp/coreless-browser-runtime/node_modules/playwright-core/index.mjs';
import chromium from '/tmp/coreless-browser-runtime/node_modules/@sparticuz/chromium/build/index.js';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const targetPass = Number(process.env.CORELESS_VERIFY_PASS ?? 10);
const verifyPass11 = targetPass === 11;
const artifactPass = verifyPass11 ? 'pass11' : 'pass10';
const port = verifyPass11 ? 4181 : 4180;

const server = spawn('python3', ['-m', 'http.server', String(port)], {
  cwd: process.cwd(),
  stdio: 'ignore',
});
await new Promise(resolve => setTimeout(resolve, 800));

const executablePath = fs.existsSync('/tmp/coreless138/chromium') ? '/tmp/coreless138/chromium' : await chromium.executablePath();
const browser = await playwright.launch({ executablePath, args: chromium.args, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
const pageErrors = [];
page.on('console', message => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', error => pageErrors.push(String(error)));

await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await page.locator('#gameCanvas').focus();
fs.mkdirSync('browser-artifacts', { recursive: true });
await page.locator('#gameCanvas').screenshot({ path: `browser-artifacts/${artifactPass}-start.png` });
await page.evaluate(() => {
  const runtime = window.__corelessV2.runtime;
  runtime.__verificationDraw = runtime.draw.bind(runtime);
  runtime.draw = () => {};
});

const debug = () => page.evaluate(() => window.__corelessV2?.debug?.());
let heldDirection = null;
const setDirection = async direction => {
  if (heldDirection === direction) return;
  if (heldDirection) await page.keyboard.up(heldDirection);
  heldDirection = direction;
  if (heldDirection) await page.keyboard.down(heldDirection);
};

let firstClimbScreenshot = true;
let secondClimbScreenshot = true;
let zone03EntryScreenshot = true;
let lowerRiseScreenshot = true;
let atriumScreenshot = true;
let upperGalleryScreenshot = true;
let zone04EntryScreenshot = true;
let lowTunnelScreenshot = true;
let platformScreenshot = true;
let unevenTunnelScreenshot = true;
let zone05EntryScreenshot = true;
let firstGateScreenshot = true;
let secondGateScreenshot = true;
let highGalleryScreenshot = true;
let thirdGateScreenshot = true;
let curveEntryScreenshot = true;
let curveCommittedScreenshot = true;
let lowerLandingScreenshot = true;
let eastDashScreenshot = true;
let middleDashScreenshot = true;
let westDashScreenshot = true;
let chaseStartScreenshot = true;
let supportCollapseScreenshot = true;
let boulderCurveScreenshot = true;
let boulderApexScreenshot = true;
let lateChaseScreenshot = true;
let closeChaseScreenshot = true;
let internalEntryScreenshot = false;
let firstDropScreenshot = false;
let middleReturnScreenshot = false;
let secondDropScreenshot = false;
let lowerRunScreenshot = false;
let breachScreenshot = false;
let chaseShaftOneDropScreenshot = false;
let chaseShaftOneClearScreenshot = false;
let chaseShaftTwoDropScreenshot = false;
let chaseShaftTwoClearScreenshot = false;
let chaseLowerHallScreenshot = false;
let routeSamples = [];
let loop = 0;
let traversalFailure = null;
let firstLipDash = false;
let secondLipDash = false;
let lowerGapJumped = false;
let atriumGapJumped = false;
let upperDashUsed = false;
let shortTunnelGapJumped = false;
let longTunnelGapJumped = false;
let firstGateDash = false;
let secondGateDash = false;
let thirdGateDash = false;
let eastGapDash = false;
let middleGapDash = false;
let westGapDash = false;
let chaseFirstLipDash = false;
let chaseSecondLipDash = false;
const grappleAnchorData = verifyPass11
  ? await page.evaluate(() => window.__corelessV2.pass11.zone.anchors)
  : [];

while (loop < 30000) {
  loop += 1;
  const state = await debug();
  const p = state.player;
  if (loop % 20 === 0) {
    routeSamples.push({
      frame: state.frameCount,
      x: Math.round(p.x * 10) / 10,
      y: Math.round(p.y * 10) / 10,
      vx: Math.round(p.vx * 10) / 10,
      boulderX: Math.round((state.chase?.x ?? 0) * 10) / 10,
      boulderY: Math.round((state.chase?.y ?? 0) * 10) / 10,
      boulderProgress: Math.round((state.chase?.pathProgress ?? 0) * 1000) / 1000,
      cameraZoom: Math.round((state.camera?.zoom ?? 1) * 1000) / 1000,
      keys: state.keys,
      phase: state.progress.pass11Completed ? 'pass11_complete'
        : state.progress.grappleChainCompleted ? 'grapple_exit'
          : state.progress.zone09Entered ? 'triple_grapple'
      : state.progress.pass10Completed ? 'pass10_complete'
        : state.progress.zone08ShaftTwoCleared ? 'chase_lower_hall'
          : state.progress.zone08ShaftTwoDropped ? 'chase_climb_two'
            : state.progress.zone08ShaftOneCleared ? 'between_chase_climbs'
              : state.progress.zone08ShaftOneDropped ? 'chase_climb_one'
                : state.progress.pass09Completed ? 'pass09_boundary'
        : state.progress.zone07MiddleDrop ? 'internal_lower_run'
          : state.progress.zone07UpperDrop ? 'internal_middle_return'
            : state.progress.zone07Entered ? 'internal_upper_run'
      : state.progress.pass08Completed ? 'pass08_boundary'
        : state.progress.boulderRoundedApex ? 'boulder_lower_chase'
          : state.progress.boulderEnteredCurve ? 'boulder_curve'
            : state.progress.boulderStarted ? 'active_chase'
      : state.progress.pass07Completed ? 'pass07_exit_reached'
        : state.progress.zone06Dropped ? 'left_dash_run'
          : state.progress.curveCommitted ? 'curve_drop'
            : state.progress.zone06Entered ? 'curve_approach'
              : state.progress.pass06Completed ? 'pass06_complete'
        : state.progress.highGalleryReached ? 'destruction_maze_east'
          : state.progress.zone05Entered ? 'destruction_maze_west'
            : state.progress.pass05Completed ? 'pass05_complete'
        : state.progress.unevenTunnelReached ? 'uneven_tunnel'
          : state.progress.platformBoarded ? 'moving_platform'
            : state.progress.zone04Entered ? 'low_tunnel'
        : state.progress.longDescentReached ? 'long_descent'
          : state.progress.upperGalleryReached ? 'upper_gallery'
            : state.progress.atriumReached ? 'atrium'
              : state.progress.zone03Entered ? 'buried_rise'
                : state.progress.secondDropped ? 'climb_2'
          : state.progress.firstClimb ? 'between_climbs'
            : state.progress.firstDropped ? 'climb_1'
              : 'slope',
    });
  }

  if (state.resetCount > 0) {
    traversalFailure = `unexpected reset at x=${p.x.toFixed(1)} y=${p.y.toFixed(1)}`;
    break;
  }
  if (verifyPass11 ? state.progress.pass11Completed : state.progress.pass10Completed) break;

  const firstClimbActive = state.progress.firstDropped && !state.progress.firstClimb;
  const secondClimbActive = state.progress.secondDropped && !state.progress.secondClimb;
  const chaseFirstClimbActive = state.progress.zone08ShaftOneDropped && !state.progress.zone08ShaftOneCleared;
  const chaseSecondClimbActive = state.progress.zone08ShaftTwoDropped && !state.progress.zone08ShaftTwoCleared;

  if (firstClimbActive || secondClimbActive) {
    const chamberStart = firstClimbActive ? 3040 : 3800;
    const lipClearY = firstClimbActive ? 1930 : 2390;
    if (p.y <= lipClearY) {
      await setDirection('d');
      if (p.dashAvailable && ((firstClimbActive && !firstLipDash) || (secondClimbActive && !secondLipDash))) {
        await page.keyboard.press('Shift');
        if (firstClimbActive) firstLipDash = true;
        else secondLipDash = true;
      }
    } else if (p.x + 34 < chamberStart && p.grounded) {
      await setDirection('d');
      if (p.x > chamberStart - 85) await page.keyboard.press('Space');
    } else if (p.wallSide === 1 && p.vy >= -0.5) {
      await page.keyboard.press('Space');
      await setDirection('a');
    } else if (p.wallSide === -1 && p.vy >= -0.5) {
      await page.keyboard.press('Space');
      await setDirection('d');
    } else if (p.grounded) {
      await setDirection('d');
      await page.keyboard.press('Space');
    }
  } else if (chaseFirstClimbActive || chaseSecondClimbActive) {
    const lipTop = chaseFirstClimbActive ? 5840 : 6200;
    if (p.y + 48 <= lipTop + 50) {
      await setDirection('d');
      if (p.dashAvailable && ((chaseFirstClimbActive && !chaseFirstLipDash) || (chaseSecondClimbActive && !chaseSecondLipDash))) {
        await page.keyboard.press('Shift');
        if (chaseFirstClimbActive) chaseFirstLipDash = true;
        else chaseSecondLipDash = true;
      }
    } else if (p.wallSide === 1 && p.vy >= -0.5) {
      await page.keyboard.press('Space');
      await setDirection('a');
    } else if (p.wallSide === -1 && p.vy >= -0.5) {
      await page.keyboard.press('Space');
      await setDirection('d');
    } else if (p.grounded) {
      await setDirection('d');
      await page.keyboard.press('Space');
    }
  } else {
    const platform = state.movingPlatforms?.[0];
    const waitingForPlatform = state.progress.pass04Completed && !state.progress.platformBoarded && p.grounded && p.x >= 11380 && p.x < 11445;
    const ridingPlatform = state.progress.platformBoarded && !state.progress.movingPlatformCrossed && p.standingPlatformId === 'shaft_carriage';
    if (verifyPass11 && state.progress.pass10Completed) {
      const grapple = state.grapple;
      const used = grapple.usedAnchorIds.length;
      const expected = grappleAnchorData[used];
      const centerX = p.x + 17;
      const centerY = p.y + 24;
      const expectedDistance = expected
        ? Math.hypot(expected.x - centerX, expected.y - centerY)
        : Number.POSITIVE_INFINITY;
      const attachThreshold = expected?.order === 3 ? 0.98 : 0.92;
      if (!grapple.active && expected && grapple.cooldown === 0 && expectedDistance <= expected.attachRadius * attachThreshold) {
        await page.keyboard.press('e');
      }
      if (grapple.active) {
        const order = grappleAnchorData.find(item => item.id === grapple.anchorId)?.order ?? used;
        await setDirection(order === 1 ? 'd' : 'a');
        const readyToRelease = order === 1
          ? grapple.attachedFrames >= 34
          : order === 2
            ? grapple.attachedFrames >= 46
            : (p.x <= 22920 && p.y <= 6820) || grapple.attachedFrames >= 180;
        if (readyToRelease) await page.keyboard.press('e');
      } else if (used === 0 || used === 1) {
        await setDirection('d');
      } else if (used === 3 && !p.grounded && p.x <= 22780) {
        await setDirection('d');
      } else if (state.progress.zone09ExitReached) {
        await setDirection(null);
      } else {
        await setDirection('a');
      }
    } else if (state.progress.zone08ExitReached) await setDirection(null);
    else if (state.progress.pass09Completed) await setDirection('d');
    else if (state.progress.pass08Completed && !state.progress.zone07UpperDrop) await setDirection('d');
    else if (state.progress.zone07UpperDrop && !state.progress.zone07MiddleDrop) await setDirection('a');
    else if (state.progress.zone07MiddleDrop) await setDirection('d');
    else if (state.progress.zone06Dropped) await setDirection('a');
    else if (waitingForPlatform && (platform?.x > 11510 || platform?.direction !== 1)) await setDirection(null);
    else if (ridingPlatform && platform?.x < 11715) await setDirection(null);
    else await setDirection('d');
    if (p.x < 2450 && loop % 120 === 0) await page.keyboard.press('Shift');
    if (!lowerGapJumped && p.grounded && p.x >= 6060 && p.x < 6120) {
      lowerGapJumped = true;
      await page.keyboard.down('Space');
      await page.waitForTimeout(600);
      await page.keyboard.up('Space');
    }
    if (!atriumGapJumped && p.grounded && p.x >= 7160 && p.x < 7220) {
      atriumGapJumped = true;
      await page.keyboard.down('Space');
      await page.waitForTimeout(650);
      await page.keyboard.up('Space');
    }
    if (!upperDashUsed && state.progress.upperGalleryReached && p.dashAvailable) {
      upperDashUsed = true;
      await page.keyboard.press('Shift');
    }
    if (!shortTunnelGapJumped && p.grounded && p.x >= 12450 && p.x < 12495) {
      shortTunnelGapJumped = true;
      await page.keyboard.down('Space');
      await page.waitForTimeout(300);
      await page.keyboard.up('Space');
    }
    if (!longTunnelGapJumped && p.grounded && p.x >= 12750 && p.x < 12795) {
      longTunnelGapJumped = true;
      await page.keyboard.down('Space');
      await page.waitForTimeout(330);
      await page.keyboard.up('Space');
    }
    if (!firstGateDash && state.progress.pass05Completed && p.grounded && p.dashAvailable && p.x >= 14570 && p.x < 14680) {
      firstGateDash = true;
      await page.keyboard.press('Shift');
    }
    if (!secondGateDash && p.grounded && p.dashAvailable && p.x >= 19170 && p.x < 19280) {
      secondGateDash = true;
      await page.keyboard.press('Shift');
    }
    if (!thirdGateDash && p.grounded && p.dashAvailable && p.x >= 23620 && p.x < 23730) {
      thirdGateDash = true;
      await page.keyboard.press('Shift');
    }
    if (!eastGapDash && state.progress.zone06Dropped && p.grounded && p.dashAvailable && p.x <= 22715 && p.x > 22690) {
      eastGapDash = true;
      await page.keyboard.down('Space');
      await page.waitForTimeout(40);
      await page.keyboard.press('Shift');
      await page.waitForTimeout(500);
      await page.keyboard.up('Space');
    }
    if (!middleGapDash && state.progress.eastDashGapCleared && p.grounded && p.dashAvailable && p.x <= 19315 && p.x > 19290) {
      middleGapDash = true;
      await page.keyboard.down('Space');
      await page.waitForTimeout(40);
      await page.keyboard.press('Shift');
      await page.waitForTimeout(500);
      await page.keyboard.up('Space');
    }
    if (!westGapDash && state.progress.middleDashGapCleared && p.grounded && p.dashAvailable && p.x <= 15995 && p.x > 15970) {
      westGapDash = true;
      await page.keyboard.down('Space');
      await page.waitForTimeout(40);
      await page.keyboard.press('Shift');
      await page.waitForTimeout(500);
      await page.keyboard.up('Space');
    }
  }

  if (state.progress.firstClimb && !firstClimbScreenshot) {
    firstClimbScreenshot = true;
    await setDirection(null);
    await page.keyboard.up('a');
    await page.keyboard.up('d');
    heldDirection = null;
    await setDirection('d');
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass06-first-climb.png' });
  }
  if (state.progress.secondClimb && !secondClimbScreenshot) {
    secondClimbScreenshot = true;
    await setDirection(null);
    await page.keyboard.up('a');
    await page.keyboard.up('d');
    heldDirection = null;
    await setDirection('d');
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass06-second-climb.png' });
  }
  if (state.progress.zone03Entered && !zone03EntryScreenshot) {
    zone03EntryScreenshot = true;
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass06-zone03-entry.png' });
  }
  if (state.progress.lowerRiseReached && !lowerRiseScreenshot) {
    lowerRiseScreenshot = true;
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass06-lower-rise.png' });
  }
  if (state.progress.atriumReached && !atriumScreenshot) {
    atriumScreenshot = true;
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass06-atrium.png' });
  }
  if (state.progress.upperGalleryReached && !upperGalleryScreenshot) {
    upperGalleryScreenshot = true;
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass06-upper-gallery.png' });
  }
  if (state.progress.zone04Entered && !zone04EntryScreenshot) {
    zone04EntryScreenshot = true;
    await setDirection(null);
    await page.waitForTimeout(180);
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass06-zone04-entry.png' });
  }
  if (state.progress.lowTunnelReached && !lowTunnelScreenshot) {
    lowTunnelScreenshot = true;
    await setDirection(null);
    await page.waitForTimeout(180);
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass06-low-tunnel.png' });
  }
  if (state.progress.platformBoarded && !platformScreenshot) {
    platformScreenshot = true;
    await setDirection(null);
    await page.waitForTimeout(180);
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass06-moving-platform.png' });
  }
  if (state.progress.unevenTunnelReached && !unevenTunnelScreenshot) {
    unevenTunnelScreenshot = true;
    await setDirection(null);
    await page.waitForTimeout(180);
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass06-uneven-tunnel.png' });
  }
  if (state.progress.zone05Entered && !zone05EntryScreenshot) {
    zone05EntryScreenshot = true;
    await setDirection(null);
    await page.waitForTimeout(220);
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass06-zone05-entry.png' });
  }
  if (state.breakables?.[0]?.destroyed && !firstGateScreenshot) {
    firstGateScreenshot = true;
    await setDirection(null);
    await page.waitForTimeout(220);
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass06-gate-one.png' });
  }
  if (state.breakables?.[1]?.destroyed && !secondGateScreenshot) {
    secondGateScreenshot = true;
    await setDirection(null);
    await page.waitForTimeout(220);
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass06-gate-two.png' });
  }
  if (state.progress.highGalleryReached && !highGalleryScreenshot) {
    highGalleryScreenshot = true;
    await setDirection(null);
    await page.waitForTimeout(220);
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass06-high-gallery.png' });
  }
  if (state.breakables?.[2]?.destroyed && !thirdGateScreenshot) {
    thirdGateScreenshot = true;
    await setDirection(null);
    await page.waitForTimeout(220);
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass06-gate-three.png' });
  }
  if (state.progress.zone06Entered && !curveEntryScreenshot) {
    curveEntryScreenshot = true;
    await setDirection(null);
    await page.waitForTimeout(220);
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass07-curve-entry.png' });
  }
  if (state.progress.curveCommitted && !curveCommittedScreenshot) {
    curveCommittedScreenshot = true;
    await setDirection(null);
    await page.waitForTimeout(220);
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass07-curve-drop.png' });
  }
  if (state.progress.zone06Dropped && p.grounded && !lowerLandingScreenshot) {
    lowerLandingScreenshot = true;
    await setDirection(null);
    await page.waitForTimeout(220);
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass07-lower-landing.png' });
  }
  if (state.progress.eastDashGapCleared && p.grounded && !eastDashScreenshot) {
    eastDashScreenshot = true;
    await setDirection(null);
    await page.waitForTimeout(220);
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass07-dash-gap-one.png' });
  }
  if (state.progress.middleDashGapCleared && p.grounded && !middleDashScreenshot) {
    middleDashScreenshot = true;
    await setDirection(null);
    await page.waitForTimeout(220);
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass07-dash-gap-two.png' });
  }
  if (state.progress.westDashGapCleared && p.grounded && !westDashScreenshot) {
    westDashScreenshot = true;
    await setDirection(null);
    await page.waitForTimeout(220);
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass07-dash-gap-three.png' });
  }
  if (state.progress.boulderStarted && !chaseStartScreenshot) {
    chaseStartScreenshot = true;
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass08-chase-start.png' });
  }
  if (state.progress.supportsDestroyed >= 3 && !supportCollapseScreenshot) {
    supportCollapseScreenshot = true;
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass08-support-collapse.png' });
  }
  if (state.progress.boulderEnteredCurve && !boulderCurveScreenshot) {
    boulderCurveScreenshot = true;
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass08-boulder-curve.png' });
  }
  if (state.progress.boulderRoundedApex && !boulderApexScreenshot) {
    boulderApexScreenshot = true;
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass08-boulder-apex.png' });
  }
  if ((state.chase?.pathProgress ?? 0) >= 0.78 && !lateChaseScreenshot) {
    lateChaseScreenshot = true;
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass08-late-chase.png' });
  }
  const chaseSeparation = Math.hypot(p.x - (state.chase?.x ?? 0), p.y + 24 - (state.chase?.y ?? 0));
  if ((state.chase?.pathProgress ?? 0) >= 0.25 && chaseSeparation < 1000 && !closeChaseScreenshot) {
    closeChaseScreenshot = true;
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass08-close-chase.png' });
  }
  if (state.progress.zone07Entered && !internalEntryScreenshot) {
    internalEntryScreenshot = true;
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass09-internal-entry.png' });
  }
  if (state.progress.zone07UpperDrop && p.grounded && !firstDropScreenshot) {
    firstDropScreenshot = true;
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass09-first-drop.png' });
  }
  if (state.progress.zone07MiddleReturn && !middleReturnScreenshot) {
    middleReturnScreenshot = true;
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass09-middle-return.png' });
  }
  if (state.progress.zone07MiddleDrop && p.grounded && !secondDropScreenshot) {
    secondDropScreenshot = true;
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass09-second-drop.png' });
  }
  if (state.progress.zone07LowerRun && !lowerRunScreenshot) {
    lowerRunScreenshot = true;
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass09-lower-run.png' });
  }
  if (state.progress.internalStructureBreached && !breachScreenshot) {
    breachScreenshot = true;
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass09-structure-breach.png' });
  }
  if (state.progress.zone08ShaftOneDropped && !chaseShaftOneDropScreenshot) {
    chaseShaftOneDropScreenshot = true;
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass10-shaft-one-drop.png' });
  }
  if (state.progress.zone08ShaftOneCleared && !chaseShaftOneClearScreenshot) {
    chaseShaftOneClearScreenshot = true;
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass10-shaft-one-clear.png' });
  }
  if (state.progress.zone08ShaftTwoDropped && !chaseShaftTwoDropScreenshot) {
    chaseShaftTwoDropScreenshot = true;
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass10-shaft-two-drop.png' });
  }
  if (state.progress.zone08ShaftTwoCleared && !chaseShaftTwoClearScreenshot) {
    chaseShaftTwoClearScreenshot = true;
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass10-shaft-two-clear.png' });
  }
  if (state.progress.zone08LowerHallReached && !chaseLowerHallScreenshot) {
    chaseLowerHallScreenshot = true;
    await page.locator('#gameCanvas').screenshot({ path: 'browser-artifacts/pass10-lower-hall.png' });
  }
  await page.waitForTimeout(32);
}

await setDirection(null);
await page.waitForTimeout(250);
await page.evaluate(() => {
  const runtime = window.__corelessV2.runtime;
  if (runtime.__verificationDraw) {
    runtime.draw = runtime.__verificationDraw;
    runtime.draw();
  }
});
await page.locator('#gameCanvas').screenshot({ path: `browser-artifacts/${artifactPass}-exit.png` });

await page.keyboard.press('b');
await page.waitForTimeout(150);
const blueprintOpened = (await debug()).blueprintVisible === true;
await page.locator('#gameCanvas').screenshot({ path: `browser-artifacts/${artifactPass}-blueprint.png` });
await page.keyboard.press('b');
await page.waitForTimeout(150);
const blueprintClosed = (await debug()).blueprintVisible === false;

const state = await page.evaluate(() => ({
  title: document.title,
  activeElement: document.activeElement?.id ?? null,
  canvas: (() => {
    const canvas = document.getElementById('gameCanvas');
    return canvas ? { width: canvas.width, height: canvas.height } : null;
  })(),
  buildStatus: document.getElementById('buildStatus')?.textContent ?? null,
  auditStatus: document.getElementById('auditStatus')?.textContent ?? null,
  audit: window.__corelessV2?.audit?.() ?? null,
  debug: window.__corelessV2?.debug?.() ?? null,
  legacyGlobals: Object.keys(window).filter(key => /corelessPass0[89]|corelessRebuild/i.test(key)),
}));

const requiredCodes = verifyPass11
  ? ['KeyA', 'KeyB', 'KeyD', 'KeyE', 'ShiftLeft', 'Space']
  : ['KeyA', 'KeyB', 'KeyD', 'ShiftLeft', 'Space'];
const usedCodes = state.audit?.inputProbe?.usedCodes ?? [];
const deterministicChecks = {
  title: state.title === 'Coreless · Rebuild V2 · Pass 11',
  canvas: state.canvas?.width === 1200 && state.canvas?.height === 680,
  focused: state.activeElement === 'gameCanvas',
  runtimeAudit: state.audit?.passed === true && state.audit?.passedCount === 20,
  blueprintAudit: state.audit?.blueprint?.passed === true && state.audit?.blueprint?.passedCount === 18,
  pass03Audit: state.audit?.pass03?.passed === true && state.audit?.pass03?.passedCount === 20,
  pass04Audit: state.audit?.pass04?.passed === true && state.audit?.pass04?.passedCount === 22,
  pass05Audit: state.audit?.pass05?.passed === true && state.audit?.pass05?.passedCount === 25,
  pass06Audit: state.audit?.pass06?.passed === true && state.audit?.pass06?.passedCount === 28,
  pass07Audit: state.audit?.pass07?.passed === true && state.audit?.pass07?.passedCount === 28,
  pass08Audit: state.audit?.pass08?.passed === true && state.audit?.pass08?.passedCount === 24,
  pass09Audit: state.audit?.pass09?.passed === true && state.audit?.pass09?.passedCount === 28,
  pass10Audit: state.audit?.pass10?.passed === true && state.audit?.pass10?.passedCount === 30,
  pass11Audit: !verifyPass11 || (state.audit?.pass11?.passed === true && state.audit?.pass11?.passedCount === 31),
  firstDrop: state.debug?.progress?.firstDropped === true,
  firstClimb: state.debug?.progress?.firstClimb === true,
  secondDrop: state.debug?.progress?.secondDropped === true,
  secondClimb: state.debug?.progress?.secondClimb === true,
  completed: state.debug?.progress?.completed === true,
  zone03Entered: state.debug?.progress?.zone03Entered === true,
  lowerRiseReached: state.debug?.progress?.lowerRiseReached === true,
  atriumReached: state.debug?.progress?.atriumReached === true,
  upperGalleryReached: state.debug?.progress?.upperGalleryReached === true,
  longDescentReached: state.debug?.progress?.longDescentReached === true,
  pass04Completed: state.debug?.progress?.pass04Completed === true,
  zone04Entered: state.debug?.progress?.zone04Entered === true,
  lowTunnelReached: state.debug?.progress?.lowTunnelReached === true,
  platformBoarded: state.debug?.progress?.platformBoarded === true,
  movingPlatformCrossed: state.debug?.progress?.movingPlatformCrossed === true,
  unevenTunnelReached: state.debug?.progress?.unevenTunnelReached === true,
  pass05Completed: state.debug?.progress?.pass05Completed === true,
  zone05Entered: state.debug?.progress?.zone05Entered === true,
  lowerHallReached: state.debug?.progress?.lowerHallReached === true,
  highGalleryReached: state.debug?.progress?.highGalleryReached === true,
  pass06Completed: state.debug?.progress?.pass06Completed === true,
  zone06Entered: state.debug?.progress?.zone06Entered === true,
  curveCommitted: state.debug?.progress?.curveCommitted === true,
  zone06Dropped: state.debug?.progress?.zone06Dropped === true,
  threeDashGaps: eastGapDash && middleGapDash && westGapDash && state.debug?.progress?.dashGapClears === 3,
  onePhysicalDirectionChange: state.debug?.progress?.directionChanges === 1,
  pass07Completed: state.debug?.progress?.pass07Completed === true,
  activeBoulderStarted: state.debug?.progress?.boulderStarted === true,
  boulderEnteredCurve: state.debug?.progress?.boulderEnteredCurve === true,
  boulderRoundedApex: state.debug?.progress?.boulderRoundedApex === true,
  chaseEscaped: verifyPass11
    ? state.debug?.progress?.chaseEscaped === true
    : state.debug?.progress?.pass10Completed === true,
  pass08Completed: state.debug?.progress?.pass08Completed === true,
  zone07Entered: state.debug?.progress?.zone07Entered === true,
  firstInternalDrop: state.debug?.progress?.zone07UpperDrop === true,
  middleReturn: state.debug?.progress?.zone07MiddleReturn === true,
  secondInternalDrop: state.debug?.progress?.zone07MiddleDrop === true,
  lowerInternalRun: state.debug?.progress?.zone07LowerRun === true,
  zone07ExitReached: state.debug?.progress?.zone07ExitReached === true,
  structureBreached: state.debug?.progress?.boulderAtInternalEntry === true && state.debug?.progress?.internalStructureBreached === true,
  twoInternalDirectionChanges: state.debug?.progress?.internalDirectionChanges === 2,
  pass09Completed: state.debug?.progress?.pass09Completed === true,
  zone08Entered: state.debug?.progress?.zone08Entered === true,
  chaseShaftOneDrop: state.debug?.progress?.zone08ShaftOneDropped === true,
  chaseShaftOneClear: state.debug?.progress?.zone08ShaftOneCleared === true,
  chaseShaftTwoDrop: state.debug?.progress?.zone08ShaftTwoDropped === true,
  chaseShaftTwoClear: state.debug?.progress?.zone08ShaftTwoCleared === true,
  chaseLowerHall: state.debug?.progress?.zone08LowerHallReached === true,
  zone08Exit: state.debug?.progress?.zone08ExitReached === true,
  pass10Completed: state.debug?.progress?.pass10Completed === true,
  zone09Entered: !verifyPass11 || state.debug?.progress?.zone09Entered === true,
  tripleGrapple: !verifyPass11 || (
    state.debug?.progress?.grappleAnchorOneUsed === true
    && state.debug?.progress?.grappleAnchorTwoUsed === true
    && state.debug?.progress?.grappleAnchorThreeUsed === true
    && state.debug?.progress?.grappleUniqueAnchors === 3
    && state.debug?.progress?.grappleAttaches === 3
    && state.debug?.progress?.grappleReleases === 3
  ),
  zone09Exit: !verifyPass11 || state.debug?.progress?.zone09ExitReached === true,
  pass11Completed: !verifyPass11 || state.debug?.progress?.pass11Completed === true,
  repeatedChaseWallJumps: (state.debug?.progress?.chaseWallJumps ?? 0) >= 4,
  collapseBehindPlayer: (state.debug?.progress?.floorsCollapsed ?? 0) >= 44,
  supportsDestroyed: (state.debug?.progress?.supportsDestroyed ?? 0) >= 24,
  boulderCoveredRoute: verifyPass11
    ? (state.debug?.chase?.pathProgress ?? 0) >= 0.965
    : (state.debug?.chase?.pathDistance ?? 0) / (state.audit?.pass10?.totalDistance ?? Number.POSITIVE_INFINITY) >= 0.95,
  boulderSealed: verifyPass11
    ? state.debug?.chase?.sealed === true && state.debug?.chase?.active === false
    : state.debug?.chase?.sealed === false && state.debug?.chase?.active === true,
  noBoulderCatch: state.debug?.boulderCatchCount === 0,
  destructionByDash: firstGateDash && secondGateDash && thirdGateDash && state.debug?.progress?.breakablesDestroyed === 3,
  allGatesDestroyed: state.debug?.breakables?.length === 3 && state.debug.breakables.every(item => item.destroyed),
  movingPlatformRide: state.debug?.progress?.platformRides === 1,
  tunnelJumpGaps: shortTunnelGapJumped && longTunnelGapJumped,
  jumpGaps: lowerGapJumped && atriumGapJumped && (state.debug?.progress?.groundJumps ?? 0) >= 2,
  wallJumps: (state.debug?.progress?.wallJumps ?? 0) >= 6,
  noReset: state.debug?.resetCount === 0,
  keyboard: requiredCodes.every(code => usedCodes.includes(code)),
  blueprintToggle: blueprintOpened && blueprintClosed,
  legacyInactive: state.legacyGlobals.length === 0,
  console: consoleErrors.length === 0 && pageErrors.length === 0,
};

const passed = !traversalFailure && Object.values(deterministicChecks).every(Boolean);
const result = {
  version: `rebuild-v2-${artifactPass}`,
  testedWith: 'Chromium + Playwright actual keyboard events',
  actualKeyboardRoute: verifyPass11
    ? 'start slope -> zones 01-07 -> internal descent -> double wall climb -> grapple one -> grapple two -> grapple three -> pass 11 exit shelf'
    : 'start slope -> active chase -> giant curve -> pass 08 boundary -> first internal descent -> pass 09 boundary -> chase wall climb one -> connector -> chase wall climb two -> lower hall -> pass 10 exit',
  helperCoordinateMovement: false,
  traversalFailure,
  state,
  routeSamples,
  deterministicChecks,
  passed,
  consoleErrors,
  pageErrors,
  limitations: [
    verifyPass11 ? 'Only zones 01 through 09 have playable collision in pass 11.' : 'Only zones 01 through 08 have playable collision in pass 10.',
    verifyPass11 ? 'Zone 10 remains blueprint data.' : 'The remaining two zones are still blueprint data.',
    verifyPass11 ? 'The active chase currently seals at the Pass 11 exit; the bridge finale is not implemented.' : 'The active chase currently seals at the Pass 10 exit; the bridge finale is not implemented.',
    'Long support-break pauses are graybox chase pacing and still need later difficulty tuning.',
    'Destroyed supports and floors use graybox debris, not final destruction animation.',
    'Graybox shapes are collision prototypes, not final terrain art.',
  ],
};

fs.writeFileSync(`browser-artifacts/${artifactPass}-results.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
server.kill('SIGTERM');
if (!passed) process.exitCode = 1;
