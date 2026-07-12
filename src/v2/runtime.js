import { BUILD, PALETTE, STAGE_SEQUENCE, VIEWPORT } from "./config.js";

const CONTROL_CODES = new Set([
  "KeyA",
  "KeyD",
  "Space",
  "ShiftLeft",
  "ShiftRight",
  "KeyR",
]);

export class FoundationRuntime {
  constructor(canvas, statusElements) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.statusElements = statusElements;
    this.frameHandle = 0;
    this.frameCount = 0;
    this.running = false;
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

  draw() {
    const ctx = this.context;
    const { width, height } = VIEWPORT;
    const background = ctx.createLinearGradient(0, 0, 0, height);
    background.addColorStop(0, PALETTE.skyTop);
    background.addColorStop(1, PALETTE.skyBottom);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    this.drawFarStructure(ctx);
    this.drawFoundationTerrain(ctx);
    this.drawPlayerMarker(ctx);
    this.drawStageRail(ctx);
  }

  drawFarStructure(ctx) {
    ctx.save();
    ctx.globalAlpha = 0.62;
    ctx.fillStyle = PALETTE.farStructure;
    const pillars = [
      [80, 170, 76, 315],
      [205, 115, 96, 370],
      [342, 205, 82, 280],
      [805, 135, 120, 350],
      [982, 190, 88, 295],
    ];
    for (const [x, y, w, h] of pillars) {
      ctx.fillRect(x, y, w, h);
      ctx.beginPath();
      ctx.moveTo(x - 14, y);
      ctx.lineTo(x + w / 2, y - 28);
      ctx.lineTo(x + w + 14, y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  drawFoundationTerrain(ctx) {
    ctx.fillStyle = PALETTE.terrain;
    ctx.strokeStyle = PALETTE.terrainEdge;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 480);
    ctx.lineTo(145, 454);
    ctx.lineTo(270, 478);
    ctx.lineTo(390, 430);
    ctx.lineTo(520, 462);
    ctx.lineTo(650, 410);
    ctx.lineTo(785, 455);
    ctx.lineTo(930, 402);
    ctx.lineTo(1065, 438);
    ctx.lineTo(1200, 390);
    ctx.lineTo(1200, 680);
    ctx.lineTo(0, 680);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "rgba(136, 170, 176, 0.24)";
    ctx.lineWidth = 1;
    for (let x = 65; x < 1180; x += 92) {
      ctx.beginPath();
      ctx.moveTo(x, 510 + (x % 3) * 13);
      ctx.lineTo(x + 34, 552 + (x % 5) * 8);
      ctx.stroke();
    }
  }

  drawPlayerMarker(ctx) {
    const x = 122;
    const y = 405;
    ctx.fillStyle = PALETTE.player;
    ctx.beginPath();
    ctx.arc(x + 10, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + 3, y + 10, 14, 26);
    ctx.fillRect(x - 2, y + 17, 5, 20);
    ctx.fillRect(x + 17, y + 17, 5, 20);
    ctx.fillRect(x + 3, y + 35, 5, 17);
    ctx.fillRect(x + 12, y + 35, 5, 17);
  }

  drawStageRail(ctx) {
    const startX = 305;
    const y = 615;
    const segmentWidth = 66;
    const gap = 8;
    ctx.font = "700 11px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    STAGE_SEQUENCE.forEach((zone, index) => {
      const x = startX + index * (segmentWidth + gap);
      ctx.fillStyle = index === 0
        ? "rgba(216, 191, 120, 0.28)"
        : "rgba(155, 199, 207, 0.10)";
      ctx.strokeStyle = index === 0
        ? PALETTE.checkpoint
        : "rgba(155, 199, 207, 0.28)";
      ctx.fillRect(x, y, segmentWidth, 26);
      ctx.strokeRect(x, y, segmentWidth, 26);
      ctx.fillStyle = index === 0 ? "#f0dca2" : PALETTE.guide;
      ctx.fillText(String(index + 1).padStart(2, "0"), x + segmentWidth / 2, y + 13);
    });

    ctx.fillStyle = "rgba(155, 199, 207, 0.74)";
    ctx.font = "700 10px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("10-ZONE FOUNDATION / GEOMETRY BEGINS IN PASS 02", 305, 660);
  }

  audit() {
    const scriptSources = Array.from(document.scripts)
      .map(script => script.getAttribute("src") ?? "");
    const checks = [
      { id: "build_id", passed: BUILD.id === "rebuild-v2-pass01" },
      { id: "pass_number", passed: BUILD.pass === 1 },
      { id: "canvas_width", passed: this.canvas.width === VIEWPORT.width },
      { id: "canvas_height", passed: this.canvas.height === VIEWPORT.height },
      { id: "canvas_context", passed: Boolean(this.context) },
      { id: "stage_sequence", passed: STAGE_SEQUENCE.length === 10 },
      { id: "single_runtime", passed: this.running && this.frameHandle !== 0 },
      { id: "readable_module_entry", passed: scriptSources.some(source => source.includes("src/v2/main.js")) },
      { id: "legacy_runtime_inactive", passed: !scriptSources.some(source => /pass08|payload-/i.test(source)) },
      { id: "baseline_recorded", passed: BUILD.previousBaselineSha.length === 40 },
    ];
    return {
      build: BUILD,
      passed: checks.every(check => check.passed),
      passedCount: checks.filter(check => check.passed).length,
      total: checks.length,
      checks,
      frameCount: this.frameCount,
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
    this.statusElements.build.textContent = "PASS 01 · ACTIVE";
    this.statusElements.audit.textContent = `AUDIT ${audit.passedCount}/${audit.total}`;
    this.statusElements.audit.dataset.state = audit.passed ? "pass" : "fail";
  }
}
