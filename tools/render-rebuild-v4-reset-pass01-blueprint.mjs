import fs from "node:fs";
import path from "node:path";
import {
  RESET_PASS01_ROOMS,
  RESET_PASS01_TIER_BUDGETS,
  ROOM_ROLE_COLORS,
} from "../src/v4/reset-pass01-room-plan.js";

const outputPath = process.env.CORELESS_V4_RESET_PASS01_BLUEPRINT ??
  "docs/rebuild-v4/assets/reset-pass01-room-plan.svg";
const koreanFontPath = "assets/fonts/noto-sans-kr-korean-700-normal.woff2";
const koreanFont = fs.readFileSync(koreanFontPath).toString("base64");
const width = 2200;
const height = 1500;
const left = 255;
const top = 180;
const cellWidth = 275;
const cellHeight = 150;
const gapX = 28;
const gapY = 52;
const rowY = tier => top + (6 - tier) * (cellHeight + gapY);
const cellX = column => left + (column - 1) * (cellWidth + gapX);
const escapeXml = value => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");
const roleLabels = {
  story: "이야기",
  tutorial: "학습",
  navigation: "이동",
  transition: "층 전환",
  combat: "전투",
  hazard: "위험",
  setpiece: "장관",
  choice: "선택",
  rest: "휴식",
  bossLesson: "보스 학습",
  boss: "보스",
  reward: "보상",
  exit: "출구",
};
const points = RESET_PASS01_ROOMS.map(item => ({
  id: item.id,
  x: cellX(item.column) + cellWidth / 2,
  y: rowY(item.tier) + cellHeight / 2,
}));
const routeLines = points.slice(1).map((point, index) => {
  const previous = points[index];
  const horizontal = previous.y === point.y;
  const inset = horizontal ? 142 : 80;
  const x1 = horizontal
    ? previous.x + Math.sign(point.x - previous.x) * inset
    : previous.x;
  const x2 = horizontal
    ? point.x - Math.sign(point.x - previous.x) * inset
    : point.x;
  const y1 = horizontal ? previous.y : previous.y - inset;
  const y2 = horizontal ? point.y : point.y + inset;
  return `<path d="M ${x1} ${y1} L ${x2} ${y2}" class="route" />`;
}).join("\n");
const roomCards = RESET_PASS01_ROOMS.map(item => {
  const x = cellX(item.column);
  const y = rowY(item.tier);
  const color = ROOM_ROLE_COLORS[item.role];
  const taskBadge = item.task
    ? `<g transform="translate(${x + 192} ${y + 112})">
        <rect width="30" height="24" rx="7" fill="#f0c96d" />
        <text x="15" y="17" class="badge dark" text-anchor="middle">T</text>
      </g>`
    : "";
  const radioBadge = item.radio
    ? `<g transform="translate(${x + 226} ${y + 112})">
        <rect width="30" height="24" rx="7" fill="#72c9d4" />
        <text x="15" y="17" class="badge dark" text-anchor="middle">R</text>
      </g>`
    : "";
  const checkpointBadge = item.checkpoint
    ? `<g transform="translate(${x + 158} ${y + 112})">
        <rect width="30" height="24" rx="7" fill="#7fd2a4" />
        <text x="15" y="17" class="badge dark" text-anchor="middle">C</text>
      </g>`
    : "";
  const intensity = Array.from({ length: 5 }, (_, index) =>
    `<rect x="${x + 20 + index * 19}" y="${y + 119}" width="13" height="7" rx="3.5"
      fill="${index < item.intensity ? "#f0c96d" : "#344653"}" />`).join("");
  return `<g class="room">
    <rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" rx="18"
      fill="#13232e" stroke="${color}" stroke-width="4" />
    <rect x="${x}" y="${y}" width="10" height="${cellHeight}" rx="5" fill="${color}" />
    <text x="${x + 22}" y="${y + 34}" class="id">${item.id}</text>
    <text x="${x + cellWidth - 18}" y="${y + 33}" class="seconds"
      text-anchor="end">${item.targetSeconds}s</text>
    <text x="${x + 22}" y="${y + 69}" class="name">${escapeXml(item.name)}</text>
    <text x="${x + 22}" y="${y + 96}" class="role">${roleLabels[item.role]}</text>
    ${intensity}
    ${checkpointBadge}${taskBadge}${radioBadge}
  </g>`;
}).join("\n");
const tierLabels = RESET_PASS01_TIER_BUDGETS.map(item => {
  const y = rowY(item.tier);
  const arrow = item.direction === "east" ? "→" : "←";
  return `<g>
    <text x="70" y="${y + 53}" class="tier">TIER ${item.tier}</text>
    <text x="70" y="${y + 83}" class="tier-sub">${item.zones} · ${item.targetSeconds}s</text>
    <text x="176" y="${y + 128}" class="tier-arrow">${arrow}</text>
  </g>`;
}).join("\n");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"
  viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#09131a" />
      <stop offset="0.55" stop-color="#0d1d27" />
      <stop offset="1" stop-color="#16232d" />
    </linearGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#29404b"
        stroke-width="1" opacity="0.28" />
    </pattern>
    <filter id="glow">
      <feGaussianBlur stdDeviation="5" result="blur" />
      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3"
      orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="#a7c4cf" />
    </marker>
    <style>
      @font-face {
        font-family: "Coreless Noto Sans KR";
        src: url("data:font/woff2;base64,${koreanFont}") format("woff2");
        font-style: normal;
        font-weight: 100 900;
      }
      text { font-family: "Coreless Noto Sans KR", "Malgun Gothic", sans-serif; }
      .title { fill: #edf4f2; font-size: 44px; font-weight: 800; letter-spacing: 1px; }
      .subtitle { fill: #8fb4bb; font-size: 23px; font-weight: 500; }
      .route { stroke: #a7c4cf; stroke-width: 6; fill: none; opacity: 0.85;
        marker-end: url(#arrow); }
      .id { fill: #d8e9ea; font-size: 22px; font-weight: 800; }
      .seconds { fill: #90aeb8; font-size: 19px; font-weight: 700; }
      .name { fill: #f1f3ed; font-size: 22px; font-weight: 700; }
      .role { fill: #98afb6; font-size: 17px; font-weight: 500; }
      .badge { fill: #eff7f5; font-size: 15px; font-weight: 900; }
      .badge.dark { fill: #10202a; }
      .tier { fill: #d9e8e7; font-size: 24px; font-weight: 800; }
      .tier-sub { fill: #7997a2; font-size: 16px; font-weight: 600; }
      .tier-arrow { fill: #d5bd70; font-size: 52px; font-weight: 800; }
      .legend { fill: #a7bec4; font-size: 18px; font-weight: 600; }
      .footer { fill: #68848e; font-size: 16px; }
    </style>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)" />
  <rect width="${width}" height="${height}" fill="url(#grid)" />
  <circle cx="1990" cy="100" r="130" fill="#29424a" opacity="0.18" />
  <circle cx="1990" cy="100" r="68" fill="#6fb1a7" opacity="0.08" filter="url(#glow)" />
  <text x="70" y="76" class="title">CORELESS · RESET PASS 01</text>
  <text x="70" y="116" class="subtitle">M01 빈 제련소 · 6층 36공간 · 720초 · 동서 교대 지그재그</text>
  ${routeLines}
  ${tierLabels}
  ${roomCards}
  <g transform="translate(260 1415)">
    <rect width="30" height="24" rx="7" fill="#7fd2a4" />
    <text x="15" y="17" class="badge dark" text-anchor="middle">C</text>
    <text x="42" y="18" class="legend">체크포인트</text>
    <rect x="185" width="30" height="24" rx="7" fill="#f0c96d" />
    <text x="200" y="17" class="badge dark" text-anchor="middle">T</text>
    <text x="227" y="18" class="legend">필수 과제</text>
    <rect x="355" width="30" height="24" rx="7" fill="#72c9d4" />
    <text x="370" y="17" class="badge dark" text-anchor="middle">R</text>
    <text x="397" y="18" class="legend">무전·획득·경고</text>
    <text x="660" y="18" class="footer">노란 막대: 긴장도 1~5 · 모든 출구는 진행 방향의 빛과 구조로 표시</text>
  </g>
</svg>`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
const cleanSvg = svg
  .split("\n")
  .map(line => line.trimEnd())
  .join("\n")
  .trimEnd();
fs.writeFileSync(outputPath, `${cleanSvg}\n`);
console.log(outputPath);
