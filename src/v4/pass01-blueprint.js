import {
  FIRST_MEGA_ROOM_PLACEMENT,
  FIRST_MEGA_ROOM_ZONES,
  MEGA_ROOM_CAMPAIGN,
  SCALE_CONTRACT,
} from "./pass01-scale-layout.js";

const CATEGORY_COLORS = Object.freeze({
  story: "#43686a",
  navigation: "#35637a",
  recovery: "#47736b",
  transition: "#665a8a",
  skill: "#aa7a39",
  combat: "#8a4949",
  hazard: "#8f623d",
  choice: "#3e7280",
  setpiece: "#76526f",
  rest: "#4c7468",
  boss: "#9b3e46",
  reward: "#8b783e",
  exit: "#4d7b63",
});

const CATEGORY_LABELS = Object.freeze({
  story: "이야기",
  navigation: "이동",
  recovery: "회수",
  transition: "층 전환",
  skill: "능력",
  combat: "전투",
  hazard: "장애물",
  choice: "분기",
  setpiece: "장면",
  rest: "회복",
  boss: "수호자",
  reward: "보상",
  exit: "출구",
});

function setupCanvas(canvas) {
  const context = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const width = Number(canvas.dataset.width);
  const height = Number(canvas.dataset.height);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  canvas.style.aspectRatio = `${width} / ${height}`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.imageSmoothingEnabled = true;
  return { context, width, height };
}

function drawRoundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
}

function drawArrow(context, from, to) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const head = 9;
  context.beginPath();
  context.moveTo(from.x, from.y);
  context.lineTo(to.x, to.y);
  context.stroke();
  context.beginPath();
  context.moveTo(to.x, to.y);
  context.lineTo(to.x - head * Math.cos(angle - Math.PI / 6), to.y - head * Math.sin(angle - Math.PI / 6));
  context.lineTo(to.x - head * Math.cos(angle + Math.PI / 6), to.y - head * Math.sin(angle + Math.PI / 6));
  context.closePath();
  context.fill();
}

function wrap(context, text, x, y, maxWidth, lineHeight, maxLines = 2) {
  const characters = [...text];
  const lines = [];
  let current = "";
  for (const character of characters) {
    const next = current + character;
    if (context.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = character;
      if (lines.length === maxLines - 1) break;
    } else {
      current = next;
    }
  }
  if (current && lines.length < maxLines) {
    const consumed = lines.join("").length + current.length;
    lines.push(consumed < characters.length ? `${current.slice(0, -1)}…` : current);
  }
  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
}

export function drawMegaRoomBlueprint(canvas) {
  const { context, width, height } = setupCanvas(canvas);
  const marginX = 74;
  const top = 146;
  const gapX = 14;
  const gapY = 18;
  const cardWidth = (width - marginX * 2 - gapX * 5) / 6;
  const cardHeight = 105;
  const placementById = new Map(FIRST_MEGA_ROOM_PLACEMENT.map(item => [item.id, item]));

  context.fillStyle = "#071015";
  context.fillRect(0, 0, width, height);
  const gradient = context.createRadialGradient(width * 0.5, 250, 20, width * 0.5, 250, width * 0.7);
  gradient.addColorStop(0, "rgba(59, 111, 119, 0.24)");
  gradient.addColorStop(1, "rgba(7, 16, 21, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#e9f0eb";
  context.font = "700 30px Arial, sans-serif";
  context.fillText("V4 · 첫 초대형 방 36공간 청사진", marginX, 54);
  context.fillStyle = "#91b8bc";
  context.font = "400 15px Arial, sans-serif";
  context.fillText("6층 × 층당 6공간 · 평균 20초 · 총 12분 · 각 공간 약 2화면", marginX, 82);
  context.fillStyle = "#d5c47c";
  context.font = "700 13px Arial, sans-serif";
  context.textAlign = "right";
  context.fillText("동쪽 → 상승 → 서쪽 → 상승 반복", width - marginX, 54);
  context.fillStyle = "#78999d";
  context.font = "400 12px Arial, sans-serif";
  context.fillText(`${SCALE_CONTRACT.nominalWorld.width.toLocaleString()} × ${SCALE_CONTRACT.nominalWorld.height.toLocaleString()}px 기준 월드`, width - marginX, 79);
  context.textAlign = "left";

  const centers = FIRST_MEGA_ROOM_ZONES.map(item => {
    const placement = placementById.get(item.id);
    return {
      id: item.id,
      x: marginX + (placement.column - 1) * (cardWidth + gapX) + cardWidth / 2,
      y: top + (placement.tier - 1) * (cardHeight + gapY) + cardHeight / 2,
    };
  });

  context.strokeStyle = "rgba(213, 196, 124, 0.55)";
  context.fillStyle = "rgba(213, 196, 124, 0.75)";
  context.lineWidth = 4;
  centers.slice(0, -1).forEach((center, index) => drawArrow(context, center, centers[index + 1]));

  FIRST_MEGA_ROOM_ZONES.forEach(item => {
    const placement = placementById.get(item.id);
    const x = marginX + (placement.column - 1) * (cardWidth + gapX);
    const y = top + (placement.tier - 1) * (cardHeight + gapY);
    const color = CATEGORY_COLORS[item.category] ?? "#46545b";
    context.fillStyle = "rgba(5, 12, 17, 0.96)";
    drawRoundedRect(context, x - 2, y - 2, cardWidth + 4, cardHeight + 4, 10);
    context.fillStyle = color;
    drawRoundedRect(context, x, y, cardWidth, cardHeight, 8);
    context.fillStyle = "rgba(4, 11, 15, 0.55)";
    context.fillRect(x, y + 32, cardWidth, cardHeight - 32);

    context.fillStyle = "#f1f5f0";
    context.font = "700 13px Arial, sans-serif";
    context.fillText(item.id, x + 12, y + 21);
    context.textAlign = "right";
    context.fillStyle = "#f0dc92";
    context.fillText(`${item.targetSeconds}초`, x + cardWidth - 12, y + 21);
    context.textAlign = "left";
    context.fillStyle = "#eef3ef";
    context.font = "700 14px Arial, sans-serif";
    wrap(context, item.name, x + 12, y + 52, cardWidth - 24, 17, 2);
    context.fillStyle = "#b5c8c9";
    context.font = "400 11px Arial, sans-serif";
    context.fillText(`${CATEGORY_LABELS[item.category]} · 강도 ${item.intensity}`, x + 12, y + 91);

    if (item.checkpoint) {
      context.fillStyle = "#d5c47c";
      context.beginPath();
      context.arc(x + cardWidth - 12, y + cardHeight - 13, 4, 0, Math.PI * 2);
      context.fill();
    }
  });

  const legendY = 895;
  context.fillStyle = "#9bb4b7";
  context.font = "400 12px Arial, sans-serif";
  context.fillText("색상:", marginX, legendY);
  const legend = ["story", "navigation", "skill", "combat", "hazard", "transition", "boss", "reward"];
  legend.forEach((category, index) => {
    const x = marginX + 48 + index * 142;
    context.fillStyle = CATEGORY_COLORS[category];
    context.fillRect(x, legendY - 12, 18, 12);
    context.fillStyle = "#c8d5d5";
    context.fillText(CATEGORY_LABELS[category], x + 25, legendY);
  });
  context.fillStyle = "#d5c47c";
  context.beginPath();
  context.arc(width - 222, legendY - 6, 4, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#c8d5d5";
  context.fillText("체크포인트", width - 210, legendY);
  context.fillStyle = "#758f94";
  context.font = "400 11px Arial, sans-serif";
  context.fillText("청사진은 실제 충돌 제작 전 구조 계약이며, 공간별 역할·선택·실패 회수 규칙을 데이터로 고정합니다.", marginX, 946);
}

export function drawCampaignBlueprint(canvas) {
  const { context, width, height } = setupCanvas(canvas);
  const marginX = 70;
  const top = 118;
  const gapX = 18;
  const gapY = 22;
  const cardWidth = (width - marginX * 2 - gapX * 3) / 4;
  const cardHeight = 75;
  const actColors = ["#3d6f73", "#49677f", "#675d83", "#7e584e", "#873f49"];

  context.fillStyle = "#071015";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#edf3ef";
  context.font = "700 28px Arial, sans-serif";
  context.fillText("20개 초대형 방 · 4시간 캠페인", marginX, 50);
  context.fillStyle = "#91b0b4";
  context.font = "400 14px Arial, sans-serif";
  context.fillText("방마다 36공간·12분 · 총 720공간 · 스킬 회수와 적 단계가 근원까지 이어짐", marginX, 78);

  MEGA_ROOM_CAMPAIGN.forEach((room, index) => {
    const row = room.act - 1;
    const column = index % 4;
    const x = marginX + column * (cardWidth + gapX);
    const y = top + row * (cardHeight + gapY);
    context.fillStyle = actColors[row];
    drawRoundedRect(context, x, y, cardWidth, cardHeight, 8);
    context.fillStyle = "rgba(4, 10, 14, 0.52)";
    context.fillRect(x, y + 27, cardWidth, cardHeight - 27);
    context.fillStyle = "#f4f6f1";
    context.font = "700 13px Arial, sans-serif";
    context.fillText(room.id, x + 12, y + 19);
    context.textAlign = "right";
    context.fillStyle = "#ead790";
    context.fillText(`12분 · 적 ${room.enemyTier}`, x + cardWidth - 12, y + 19);
    context.textAlign = "left";
    context.fillStyle = "#eef3ef";
    context.font = "700 15px Arial, sans-serif";
    context.fillText(room.name, x + 12, y + 50);
    context.fillStyle = "#b9c9ca";
    context.font = "400 11px Arial, sans-serif";
    const reward = room.skillRewards.length ? room.skillRewards.join(" · ") : room.climax;
    wrap(context, reward, x + 12, y + 67, cardWidth - 24, 13, 1);
  });

  context.fillStyle = "#819b9f";
  context.font = "400 12px Arial, sans-serif";
  context.fillText("1막 각성", marginX, 618);
  context.fillText("2막 폐쇄망", marginX + 250, 618);
  context.fillText("3막 분리의 진실", marginX + 520, 618);
  context.fillText("4막 원점 방어", marginX + 830, 618);
  context.fillStyle = "#d5c47c";
  context.fillText("5막 근원 귀환", marginX + 1120, 618);
}
