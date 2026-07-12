export const BUILD = Object.freeze({
  id: "rebuild-v2-pass01",
  pass: 1,
  branch: "rebuild/mega-room-40pass",
  draftPullRequest: 1,
  previousBaselineSha: "f57ea9eeb878c03a61aadf0801be53be3afa562e",
});

export const VIEWPORT = Object.freeze({
  width: 1200,
  height: 680,
});

export const STAGE_SEQUENCE = Object.freeze([
  "start_slope",
  "double_wall_climb",
  "buried_rise_structure",
  "uneven_tunnel",
  "destruction_maze",
  "dash_run",
  "precision_parkour",
  "enemy_turret_hall",
  "long_descent_chase",
  "collapsing_bridge",
]);

export const PALETTE = Object.freeze({
  skyTop: "#07141b",
  skyBottom: "#02070a",
  farStructure: "#10232a",
  midStructure: "#173139",
  terrain: "#1f343a",
  terrainEdge: "#88aab0",
  guide: "#9bc7cf",
  player: "#e8f2e7",
  checkpoint: "#d8bf78",
});
