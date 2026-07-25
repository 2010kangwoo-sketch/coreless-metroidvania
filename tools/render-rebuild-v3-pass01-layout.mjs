import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { ROOMS, ROUTE_LINKS, OPTIONAL_ALCOVES, UNLOCKABLE_SHORTCUTS } from "../src/v3/mega-room-layout.js";
import { ROOM_GAMEPLAY_DETAIL, EXPECTED_PLAYTIME_SECONDS } from "../src/v3/mega-room-gameplay.js";

const outputDirectory = path.resolve("docs/rebuild-v3/assets");
const svgPath = path.join(outputDirectory, "pass01-mega-room-layout.svg");
const pngPath = path.join(outputDirectory, "pass01-mega-room-layout.png");
fs.mkdirSync(outputDirectory, { recursive: true });

const escape = value => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const width = 1800;
const height = 1490;
const cardWidth = 430;
const cardHeight = 158;
const startX = 105;
const startY = 180;
const gapX = 45;
const gapY = 55;

const position = room => ({
  x: startX + room.column * (cardWidth + gapX),
  y: startY + (4 - room.tier) * (cardHeight + gapY),
});

const roleColor = {
  safe_tutorial: "#8fd0b5",
  tutorial: "#88c5da",
  ability_room: "#e6c56c",
  traversal: "#7cb4c8",
  ability_test: "#d99374",
  vertical_traversal: "#9f9bd8",
  combat: "#d77f76",
  set_piece: "#c69bd8",
  hazard: "#dc9a65",
  mastery: "#ad88cf",
  recovery: "#90c8a1",
  chase: "#e17462",
  exit: "#efd282",
};

const roomMarkup = ROOMS.map(room => {
  const { x, y } = position(room);
  const detail = ROOM_GAMEPLAY_DETAIL[room.id];
  const color = roleColor[room.role] ?? "#8eb7c2";
  const structures = room.structures.slice(0, 3).map((name, index) =>
    `<text x="${x + 28}" y="${y + 93 + index * 18}" class="structure">• ${escape(name)}</text>`).join("");
  const enemies = room.enemies.length ? room.enemies.join(" · ") : "안전 구역";
  return `
    <g class="room-card">
      <rect x="${x}" y="${y}" width="${cardWidth}" height="${cardHeight}" rx="18" fill="#102932" stroke="${color}" stroke-width="3"/>
      <rect x="${x}" y="${y}" width="12" height="${cardHeight}" rx="6" fill="${color}"/>
      <circle cx="${x + 42}" cy="${y + 35}" r="20" fill="${color}"/>
      <text x="${x + 42}" y="${y + 42}" text-anchor="middle" class="number">${room.order}</text>
      <text x="${x + 74}" y="${y + 34}" class="room-name">${escape(room.name)}</text>
      <text x="${x + 74}" y="${y + 57}" class="mechanic">${escape(room.mechanic)} · ${detail.expectedSeconds}s</text>
      <rect x="${x + cardWidth - 97}" y="${y + 18}" width="72" height="28" rx="14" fill="${color}" opacity=".18"/>
      <text x="${x + cardWidth - 61}" y="${y + 37}" text-anchor="middle" class="tension">긴장 ${detail.tension}</text>
      ${structures}
      <text x="${x + 28}" y="${y + 148}" class="enemy">${escape(enemies)}</text>
      ${room.checkpoint ? `<path d="M ${x + cardWidth - 42} ${y + 120} l 10 10 20 -24" fill="none" stroke="#f2d789" stroke-width="5" stroke-linecap="round"/>` : ""}
    </g>`;
}).join("");

const linkMarkup = ROUTE_LINKS.map(link => {
  const from = ROOMS.find(room => room.id === link.from);
  const to = ROOMS.find(room => room.id === link.to);
  const a = position(from);
  const b = position(to);
  let x1;
  let y1;
  let x2;
  let y2;
  if (link.type === "ascent") {
    const sideX = link.side === "east" ? a.x + cardWidth + 18 : a.x - 18;
    x1 = sideX;
    x2 = sideX;
    y1 = a.y + cardHeight / 2;
    y2 = b.y + cardHeight / 2;
  } else if (from.direction === "east") {
    x1 = a.x + cardWidth;
    x2 = b.x;
    y1 = y2 = a.y + cardHeight / 2;
  } else {
    x1 = a.x;
    x2 = b.x + cardWidth;
    y1 = y2 = a.y + cardHeight / 2;
  }
  return `<path d="M ${x1} ${y1} L ${x2} ${y2}" class="${link.type === "ascent" ? "ascent" : "route"}" marker-end="url(#arrow)"/>`;
}).join("");

const curvePoints = ROOMS.map((room, index) => {
  const x = 170 + index * 88;
  const y = 1410 - ROOM_GAMEPLAY_DETAIL[room.id].tension * 25;
  return `${x},${y}`;
}).join(" ");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#06151c"/>
      <stop offset="1" stop-color="#02080c"/>
    </linearGradient>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#8dc2cc" stroke-opacity=".055" stroke-width="1"/>
    </pattern>
    <filter id="glow"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="#f0c974"/>
    </marker>
    <style>
      text { font-family: "Noto Sans KR", "Malgun Gothic", sans-serif; }
      .title { font-size: 38px; font-weight: 800; fill: #edf5f2; letter-spacing: .5px; }
      .subtitle { font-size: 17px; fill: #9dbac0; }
      .tier { font-size: 14px; font-weight: 700; fill: #7099a3; letter-spacing: 2px; }
      .room-name { font-size: 21px; font-weight: 750; fill: #edf5f2; }
      .mechanic { font-size: 13px; fill: #8eb2ba; }
      .structure { font-size: 13px; fill: #c3d4d5; }
      .enemy { font-size: 11px; fill: #7fa0a8; }
      .number { font-size: 16px; font-weight: 900; fill: #071318; }
      .tension { font-size: 11px; font-weight: 700; fill: #dfe9e6; }
      .route, .ascent { fill: none; stroke: #f0c974; stroke-width: 5; stroke-linecap: round; filter: url(#glow); }
      .ascent { stroke-dasharray: 9 8; }
      .legend { font-size: 14px; fill: #b8cccf; }
      .legend-title { font-size: 18px; font-weight: 750; fill: #e7efed; }
      .curve-label { font-size: 11px; fill: #8caab0; }
    </style>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" fill="url(#grid)"/>
  <text x="92" y="75" class="title">CORELESS · 초대형 방 V3 상세 1차</text>
  <text x="94" y="108" class="subtitle">그래픽 제작 전 플레이 구조 청사진 · 5층 × 3방 · 지그재그 상승 · 예상 ${Math.floor(EXPECTED_PLAYTIME_SECONDS / 60)}분 ${EXPECTED_PLAYTIME_SECONDS % 60}초</text>
  ${[4, 3, 2, 1, 0].map((tier, index) => `<text x="26" y="${startY + index * (cardHeight + gapY) + 85}" class="tier">T${tier + 1}</text>`).join("")}
  <g>${linkMarkup}</g>
  <g>${roomMarkup}</g>
  <g transform="translate(1530 182)">
    <rect width="220" height="530" rx="20" fill="#0d2028" stroke="#315561"/>
    <text x="24" y="42" class="legend-title">설계 규칙</text>
    <text x="24" y="76" class="legend">15개 본방</text>
    <text x="24" y="103" class="legend">14개 필수 연결</text>
    <text x="24" y="130" class="legend">4개 교대 상승축</text>
    <text x="24" y="157" class="legend">${OPTIONAL_ALCOVES.length}개 선택 옆방</text>
    <text x="24" y="184" class="legend">${UNLOCKABLE_SHORTCUTS.length}개 해금 지름길</text>
    <text x="24" y="211" class="legend">7개 체크포인트</text>
    <line x1="24" y1="238" x2="196" y2="238" stroke="#315561"/>
    <text x="24" y="274" class="legend-title">공정성 기준</text>
    <text x="24" y="310" class="legend">첫 시도는 안전하게</text>
    <text x="24" y="337" class="legend">화면 밖 공격 금지</text>
    <text x="24" y="364" class="legend">맹목 착지 적 배치 금지</text>
    <text x="24" y="391" class="legend">실패 즉시 회수</text>
    <text x="24" y="418" class="legend">고긴장 최대 2방 연속</text>
    <text x="24" y="445" class="legend">방마다 선택 또는 변주</text>
    <text x="24" y="482" class="legend">✓ 체크포인트</text>
  </g>
  <g>
    <text x="94" y="1260" class="legend-title">긴장도 곡선 — 학습 → 보상 → 압박 → 회복 → 추격 → 결전</text>
    <line x1="150" y1="1412" x2="1435" y2="1412" stroke="#315561"/>
    <polyline points="${curvePoints}" fill="none" stroke="#e6a466" stroke-width="4" stroke-linejoin="round"/>
    ${ROOMS.map((room, index) => {
      const x = 170 + index * 88;
      const y = 1410 - ROOM_GAMEPLAY_DETAIL[room.id].tension * 25;
      return `<circle cx="${x}" cy="${y}" r="5" fill="#f0c974"/><text x="${x}" y="1440" text-anchor="middle" class="curve-label">${room.id}</text>`;
    }).join("")}
  </g>
  <text x="1530" y="760" class="legend-title">경로 읽기</text>
  <text x="1530" y="792" class="legend">아래 왼쪽에서 시작</text>
  <text x="1530" y="819" class="legend">동 → 상승 → 서</text>
  <text x="1530" y="846" class="legend">한 층마다 방향 전환</text>
  <text x="1530" y="873" class="legend">위 오른쪽에서 종료</text>
  <text x="1530" y="925" class="legend-title">1차 범위</text>
  <text x="1530" y="957" class="legend">구조·동선·리듬 확정</text>
  <text x="1530" y="984" class="legend">최종 그래픽은 미포함</text>
  <text x="1530" y="1011" class="legend">다음 차수부터 회색박스</text>
</svg>`;

fs.writeFileSync(svgPath, svg);

const convert = spawnSync("convert", [
  "-background", "none",
  "-density", "144",
  svgPath,
  "-resize", `${width}x${height}`,
  pngPath,
], { encoding: "utf8" });

if (convert.status !== 0) {
  const ffmpeg = spawnSync("ffmpeg", [
    "-y", "-loglevel", "error", "-f", "svg_pipe", "-i", svgPath,
    "-frames:v", "1", pngPath,
  ], { encoding: "utf8" });
  if (ffmpeg.status !== 0) {
    console.warn("PNG rendering unavailable; SVG was generated successfully.");
    console.warn((convert.stderr || ffmpeg.stderr || "").trim());
  }
}

console.log(JSON.stringify({ svgPath, pngPath, pngExists: fs.existsSync(pngPath) }, null, 2));
