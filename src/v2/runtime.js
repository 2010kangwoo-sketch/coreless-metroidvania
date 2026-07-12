import { BUILD, PALETTE, STAGE_SEQUENCE, VIEWPORT } from "./config.js";
import {
  BOULDER_ROUTE,
  CHASE_FEATURES,
  PLAYER_ROUTE,
  WORLD,
  ZONES,
  validateBlueprint,
} from "./blueprint.js";

const CONTROL_CODES = new Set([
  "KeyA",
  "KeyB",
  "KeyD",
  "Space",
  "ShiftLeft",
  "ShiftRight",
  "KeyR",
]);

const MAP_FRAME = Object.freeze({ x: 42, y: 116, width: 1116, height: 492 });

export class BlueprintRuntime {
  constructor(canvas, statusElements) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.statusElements = statusElements;
    this.frameHandle = 0;
    this.frameCount = 0;
    this.running = false;
    this.detailsVisible = true;
    this.inputProbe = {
      downs: 0,
      ups: 0,
      lastCode: null,
      usedCodes: new Set(),
    };

    this.onKeyDown = event => {
      if (!CONTROL_CODES.has(event.code)) return;
      event.preventDefault();
      this.inputProbe.downs += 1;
      this.inputProbe.lastCode = event.code;
      this.inputProbe.usedCodes.add(event.code);
      if (event.code === "KeyB" && !event.repeat) {
        this.detailsVisible = !this.detailsVisible;
      }
    };

    this.onKeyUp = event => {
      if (!CONTROL_CODES.has(event.code)) return;
      event.preventDefault();
      this.inputProbe.ups += 1;
    };

    this.onPointerDown = () => this.canvas.focus();
  }

  start() {
    if (this.running) return;
    this.running = true;
    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp, { passive: false });
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.focus();
    this.frameHandle = requestAnimationFrame(() => this.frame());
  }

  frame() {
    if (!this.running) return;
    this.frameCount += 1;
    this.draw();
    this.frameHandle = requestAnimationFrame(() => this.frame());
  }

  worldToCanvas(point) {
    return {
      x: MAP_FRAME.x + (point.x / WORLD.width) * MAP_FRAME.width,
      y: MAP_FRAME.y + (point.y / WORLD.height) * MAP_FRAME.height,
    };
  }

  boundsToCanvas(bounds) {
    const start = this.worldToCanvas(bounds);
    return {
      x: start.x,
      y: start.y,
      width: (bounds.width / WORLD.width) * MAP_FRAME.width,
      height: (bounds.height / WORLD.height) * MAP_FRAME.height,
    };
  }

  draw() {
    const ctx = this.context;
    const background = ctx.createLinearGradient(0, 0, 0, VIEWPORT.height);
    background.addColorStop(0, PALETTE.skyTop);
    background.addColorStop(1, PALETTE.skyBottom);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, VIEWPORT.width, VIEWPORT.height);

    this.drawWorldGrid(ctx);
    this.drawZones(ctx);
    this.drawRoute(ctx, PLAYER_ROUTE, PALETTE.route, false, 3.2);
    this.drawRoute(ctx, BOULDER_ROUTE, PALETTE.boulderRoute, true, 2.1);
    this.drawConnections(ctx);
    if (this.detailsVisible) this.drawChaseFeatures(ctx);
    this.drawLegend(ctx);
  }

  drawWorldGrid(ctx) {
    ctx.save();
    ctx.fillStyle = "rgba(4, 15, 20, 0.72)";
    ctx.fillRect(MAP_FRAME.x, MAP_FRAME.y, MAP_FRAME.width, MAP_FRAME.height);
    ctx.strokeStyle = "rgba(139, 190, 199, 0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= WORLD.width; x += 2000) {
      const point = this.worldToCanvas({ x, y: 0 });
      ctx.beginPath();
      ctx.moveTo(point.x, MAP_FRAME.y);
      ctx.lineTo(point.x, MAP_FRAME.y + MAP_FRAME.height);
      ctx.stroke();
    }
    for (let y = 0; y <= WORLD.height; y += 1000) {
      const point = this.worldToCanvas({ x: 0, y });
      ctx.beginPath();
      ctx.moveTo(MAP_FRAME.x, point.y);
      ctx.lineTo(MAP_FRAME.x + MAP_FRAME.width, point.y);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(139, 190, 199, 0.36)";
    ctx.strokeRect(MAP_FRAME.x, MAP_FRAME.y, MAP_FRAME.width, MAP_FRAME.height);
    ctx.restore();
  }

  drawZones(ctx) {
    ctx.save();
    ZONES.forEach((item, index) => {
      const bounds = this.boundsToCanvas(item.bounds);
      ctx.fillStyle = index % 2 === 0 ? PALETTE.zoneFill : "rgba(93, 84, 68, 0.12)";
      ctx.strokeStyle = PALETTE.zoneEdge;
      ctx.lineWidth = 1;
      ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
      ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

      if (!this.detailsVisible) return;
      ctx.fillStyle = "rgba(4, 12, 16, 0.82)";
      ctx.fillRect(bounds.x + 5, bounds.y + 5, Math.min(bounds.width - 10, 154), 26);
      ctx.fillStyle = index === 7 ? "#e2b98b" : PALETTE.guide;
      ctx.font = "700 9px Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`${String(index + 1).padStart(2, "0")}  ${item.name}`, bounds.x + 10, bounds.y + 18);
    });
    ctx.restore();
  }

  drawRoute(ctx, points, color, dashed, width) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.setLineDash(dashed ? [8, 7] : []);
    ctx.beginPath();
    points.forEach((point, index) => {
      const mapped = this.worldToCanvas(point);
      if (index === 0) ctx.moveTo(mapped.x, mapped.y);
      else ctx.lineTo(mapped.x, mapped.y);
    });
    ctx.stroke();
    ctx.restore();
  }

  drawConnections(ctx) {
    ctx.save();
    ZONES.forEach((item, index) => {
      const entry = this.worldToCanvas(item.entry);
      const exit = this.worldToCanvas(item.exit);
      ctx.fillStyle = "#83c8c4";
      ctx.beginPath();
      ctx.arc(entry.x, entry.y, 3.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = index === ZONES.length - 1 ? PALETTE.checkpoint : "#d8bf78";
      ctx.beginPath();
      ctx.arc(exit.x, exit.y, 4.2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  drawChaseFeatures(ctx) {
    ctx.save();
    ctx.setLineDash([4, 3]);
    CHASE_FEATURES.forEach(item => {
      const bounds = this.boundsToCanvas(item.bounds);
      ctx.fillStyle = "rgba(217, 169, 108, 0.12)";
      ctx.strokeStyle = "rgba(217, 169, 108, 0.72)";
      ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
      ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
      ctx.fillStyle = PALETTE.feature;
      ctx.font = "700 8px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`P08 · ${item.label}`, bounds.x + bounds.width / 2, bounds.y + bounds.height / 2 + 3);
    });
    ctx.restore();
  }

  drawLegend(ctx) {
    ctx.save();
    ctx.font = "700 10px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = PALETTE.route;
    ctx.fillRect(47, 628, 38, 3);
    ctx.fillText("PLAYER ROUTE", 94, 630);
    ctx.strokeStyle = PALETTE.boulderRoute;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(222, 630);
    ctx.lineTo(260, 630);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = PALETTE.boulderRoute;
    ctx.fillText("BOULDER CORRIDOR", 269, 630);
    ctx.fillStyle = PALETTE.feature;
    ctx.strokeStyle = PALETTE.feature;
    ctx.strokeRect(421, 624, 38, 12);
    ctx.fillText("PASS 08 RESERVED GEOMETRY", 468, 630);
    ctx.fillStyle = "rgba(155, 199, 207, 0.72)";
    ctx.textAlign = "right";
    ctx.fillText(`WORLD ${WORLD.width} × ${WORLD.height} · B TOGGLE DETAILS`, 1154, 630);
    ctx.restore();
  }

  audit() {
    const scriptSources = Array.from(document.scripts)
      .map(script => script.getAttribute("src") ?? "");
    const blueprint = validateBlueprint();
    const checks = [
      { id: "build_id", passed: BUILD.id === "rebuild-v2-pass02" },
      { id: "pass_number", passed: BUILD.pass === 2 },
      { id: "canvas_width", passed: this.canvas.width === VIEWPORT.width },
      { id: "canvas_height", passed: this.canvas.height === VIEWPORT.height },
      { id: "canvas_context", passed: Boolean(this.context) },
      { id: "stage_sequence", passed: STAGE_SEQUENCE.length === 10 },
      { id: "single_runtime", passed: this.running && this.frameHandle !== 0 },
      { id: "readable_module_entry", passed: scriptSources.some(source => source.includes("src/v2/main.js")) },
      { id: "legacy_runtime_inactive", passed: !scriptSources.some(source => /pass08|payload-/i.test(source)) },
      { id: "blueprint_validation", passed: blueprint.passed },
    ];
    return {
      build: BUILD,
      passed: checks.every(check => check.passed),
      passedCount: checks.filter(check => check.passed).length,
      total: checks.length,
      checks,
      blueprint,
      frameCount: this.frameCount,
      detailsVisible: this.detailsVisible,
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
    this.statusElements.build.textContent = "PASS 02 · BLUEPRINT";
    this.statusElements.audit.textContent = `AUDIT ${audit.passedCount}/${audit.total} · MAP ${audit.blueprint.passedCount}/${audit.blueprint.total}`;
    this.statusElements.audit.dataset.state = audit.passed ? "pass" : "fail";
  }
}
