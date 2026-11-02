/* =========================================================
   engine.js — tile map, movement, collision, camera, and
   interaction prompts. Rendering lives here too; the DOM
   layer handles dialogue, menus, and the résumé content.
   ========================================================= */

window.Engine = (function () {

  const T = 16;
  const VIEW_W = 160;
  const VIEW_H = 144;
  const STEP_SECONDS = 0.15;
  const SIGN_TEXT =
    "PALLET TOWN — Trainer's hometown.\n" +
    "ARROWS / WASD: walk · ENTER: interact\n" +
    "ESC: back · M: sound";

  let canvas, ctx, data, hooks = {};
  let overworld = null;

  const state = {
    active: false,
    paused: false,
    locked: false,
    mode: "overworld",
    map: null,
    player: { x: 0, y: 0, dir: "down", moving: false, fromX: 0, fromY: 0, toX: 0, toY: 0, t: 0, duration: STEP_SECONDS },
    camera: { x: 0, y: 0 },
    currentBuilding: null,
    time: 0,
    waterFrame: 0,
    lastPrompt: null,
    lastLocation: null
  };

  const heldDirs = [];
  let actionQueued = false;
  let cancelQueued = false;
  let lastTs = 0;

  /* ───────────────────────── map building ───────────────────────── */

  function grid(w, h, fill) {
    return Array.from({ length: h }, function () { return Array(w).fill(fill); });
  }

  function rect(g, x, y, w, h, ch) {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) {
        if (g[yy] && g[yy][xx] !== undefined) g[yy][xx] = ch;
      }
    }
  }

  function hline(g, x1, x2, y, ch) {
    for (let x = x1; x <= x2; x++) if (g[y] && g[y][x] !== undefined) g[y][x] = ch;
  }

  function vline(g, x, y1, y2, ch) {
    for (let y = y1; y <= y2; y++) if (g[y] && g[y][x] !== undefined) g[y][x] = ch;
  }

  function makeOverworld() {
    const W = 24, H = 21;
    const g = grid(W, H, ".");

    // tree border (two rows at the bottom give the spawn view some breathing room)
    for (let x = 0; x < W; x++) { g[0][x] = "T"; g[1][x] = "T"; g[19][x] = "T"; g[H - 1][x] = "T"; }
    for (let y = 0; y < H; y++) { g[y][0] = "T"; g[y][1] = "T"; g[y][W - 2] = "T"; g[y][W - 1] = "T"; }

    // pond
    rect(g, 3, 2, 4, 4, "~");

    // paths
    hline(g, 2, 21, 12, "=");
    hline(g, 2, 21, 18, "=");
    vline(g, 10, 8, 18, "=");
    rect(g, 9, 15, 3, 4, "=");

    // flowers
    [[7, 3], [14, 3], [18, 3], [20, 4], [15, 6], [7, 9], [19, 9],
     [6, 13], [13, 13], [19, 13], [6, 16], [13, 16], [20, 16]]
      .forEach(function (p) { if (g[p[1]][p[0]] === ".") g[p[1]][p[0]] = ","; });

    // tree clusters
    [[18, 2], [19, 2], [20, 2], [18, 3], [20, 3], [19, 4],
     [12, 16], [13, 16], [14, 16], [12, 17], [14, 17],
     [7, 15], [8, 15], [7, 16]]
      .forEach(function (p) { if (g[p[1]][p[0]] === ".") g[p[1]][p[0]] = "T"; });

    // town sign
    g[11][11] = "S";

    return {
      kind: "overworld",
      w: W, h: H, tiles: g,
      buildings: data.world.buildings
    };
  }

  function makeInterior(building) {
    const W = 10, H = 9;
    const g = grid(W, H, "#");
    rect(g, 1, 2, 8, 6, ".");
    g[8][4] = "D";

    return {
      kind: "interior",
      w: W, h: H, tiles: g,
      building: building,
      door: { x: 4, y: 8 },
      spawn: { x: 4, y: 7 },
      guide: { x: 3, y: 5 },
      solids: [
        { x: 1, y: 2, w: 2, h: 2, type: "pc" },
        { x: 7, y: 2, w: 2, h: 2, type: "shelf" },
        { x: 4, y: 4, w: 2, h: 1, type: "table" },
        { x: 8, y: 6, w: 1, h: 1, type: "plant" }
      ]
    };
  }

  /* ───────────────────────── collision ───────────────────────── */

  function tileAt(x, y) {
    if (!state.map || y < 0 || y >= state.map.h || x < 0 || x >= state.map.w) return null;
    return state.map.tiles[y][x];
  }

  function buildingAt(x, y) {
    if (state.map.kind !== "overworld") return null;
    const list = state.map.buildings;
    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) return b;
    }
    return null;
  }

  function doorAt(x, y) {
    if (state.map.kind !== "overworld") return null;
    const list = state.map.buildings;
    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      if (b.door.x === x && b.door.y === y) return b;
    }
    return null;
  }

  function interiorSolidAt(x, y) {
    if (state.map.kind !== "interior") return null;
    const list = state.map.solids;
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      if (x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h) return s;
    }
    return null;
  }

  function isWalkable(x, y) {
    const ch = tileAt(x, y);
    if (ch === null) return false;

    if (state.map.kind === "interior") {
      if (ch === "#") return false;
      if (ch === "D") return true;
      if (interiorSolidAt(x, y)) return false;
      const g = state.map.guide;
      if (g && g.x === x && g.y === y) return false;
      return true;
    }

    if (ch === "T" || ch === "~" || ch === "f" || ch === "S") return false;

    const b = buildingAt(x, y);
    if (b) return b.door.x === x && b.door.y === y;

    return true;
  }

  /* ───────────────────────── player movement ───────────────────────── */

  function heldDir() {
    return heldDirs.length ? heldDirs[heldDirs.length - 1] : null;
  }

  function tryStep(dir) {
    const p = state.player;
    p.dir = dir;

    const tx = Math.round(p.x / T);
    const ty = Math.round(p.y / T);
    const dx = dir === "left" ? -1 : dir === "right" ? 1 : 0;
    const dy = dir === "up" ? -1 : dir === "down" ? 1 : 0;
    const nx = tx + dx;
    const ny = ty + dy;

    if (!isWalkable(nx, ny)) return;

    p.fromX = p.x;
    p.fromY = p.y;
    p.toX = nx * T;
    p.toY = ny * T;
    p.t = 0;
    p.moving = true;
    p.duration = STEP_SECONDS;
  }

  function onArrive() {
    const p = state.player;
    const tx = Math.round(p.x / T);
    const ty = Math.round(p.y / T);

    if (state.mode === "overworld") {
      const b = doorAt(tx, ty);
      if (b) {
        state.locked = true;
        if (hooks.onDoor) hooks.onDoor(b);
        return;
      }
    } else if (state.mode === "interior") {
      const d = state.map.door;
      if (d && tx === d.x && ty === d.y) {
        state.locked = true;
        if (hooks.onExit) hooks.onExit(state.currentBuilding);
        return;
      }
    }
    updatePrompt();
  }

  function updateCamera() {
    if (state.mode === "interior") {
      state.camera.x = 0;
      state.camera.y = 0;
      return;
    }
    const mapW = state.map.w * T;
    const mapH = state.map.h * T;
    let cx = state.player.x + 8 - VIEW_W / 2;
    let cy = state.player.y + 8 - VIEW_H / 2;
    cx = Math.max(0, Math.min(cx, mapW - VIEW_W));
    cy = Math.max(0, Math.min(cy, mapH - VIEW_H));
    state.camera.x = Math.round(cx);
    state.camera.y = Math.round(cy);
  }

  /* ───────────────────────── interaction ───────────────────────── */

  function frontTile() {
    const p = state.player;
    const dx = p.dir === "left" ? -1 : p.dir === "right" ? 1 : 0;
    const dy = p.dir === "up" ? -1 : p.dir === "down" ? 1 : 0;
    return {
      x: Math.round(p.x / T) + dx,
      y: Math.round(p.y / T) + dy
    };
  }

  function currentPrompt() {
    if (state.locked) return null;
    const f = frontTile();

    if (state.mode === "overworld") {
      const b = doorAt(f.x, f.y);
      if (b) return "ENTER · " + b.name;
      if (tileAt(f.x, f.y) === "S") return "READ";
      return null;
    }

    const d = state.map.door;
    if (d && f.x === d.x && f.y === d.y) return "EXIT";

    const g = state.map.guide;
    if (g && f.x === g.x && f.y === g.y) return "TALK";

    const s = interiorSolidAt(f.x, f.y);
    if (s && (s.type === "pc" || s.type === "shelf")) return "READ";
    return null;
  }

  function updatePrompt() {
    const text = currentPrompt();
    if (text !== state.lastPrompt) {
      state.lastPrompt = text;
      if (hooks.onPrompt) hooks.onPrompt(text);
    }
  }

  function setLocation(name) {
    if (name !== state.lastLocation) {
      state.lastLocation = name;
      if (hooks.onLocation) hooks.onLocation(name);
    }
  }

  function interact() {
    if (state.locked) return;

    if (state.mode === "overworld") {
      const f = frontTile();
      const b = doorAt(f.x, f.y);
      if (b) {
        state.locked = true;
        if (hooks.onDoor) hooks.onDoor(b);
        return;
      }
      if (tileAt(f.x, f.y) === "S") {
        state.locked = true;
        if (hooks.onInteract) hooks.onInteract({ type: "sign", text: SIGN_TEXT });
      }
      return;
    }

    // interior
    const p = state.player;
    const ptx = Math.round(p.x / T);
    const pty = Math.round(p.y / T);
    const b = state.currentBuilding;
    const d = state.map.door;

    if (d && ptx === d.x && pty === d.y) {
      state.locked = true;
      if (hooks.onExit) hooks.onExit(b);
      return;
    }

    const f = frontTile();
    const g = state.map.guide;
    if (g && f.x === g.x && f.y === g.y) {
      state.locked = true;
      if (hooks.onInteract) hooks.onInteract({ type: "npc", npc: g, section: b.section, building: b });
      return;
    }

    const s = interiorSolidAt(f.x, f.y);
    if (s && (s.type === "pc" || s.type === "shelf")) {
      state.locked = true;
      if (hooks.onInteract) hooks.onInteract({ type: s.type, section: b.section, building: b });
    }
  }

  function requestExit() {
    if (state.mode !== "interior" || state.locked) return;
    state.locked = true;
    if (hooks.onExit) hooks.onExit(state.currentBuilding);
  }

  /* ───────────────────────── update ───────────────────────── */

  function update(dt) {
    if (!state.active || state.paused || state.locked) return;

    state.time += dt;
    state.waterFrame = Math.floor(state.time / 480) % 2;

    const p = state.player;

    if (p.moving) {
      p.t += dt;
      const k = Math.min(1, p.t / p.duration);
      p.x = p.fromX + (p.toX - p.fromX) * k;
      p.y = p.fromY + (p.toY - p.fromY) * k;
      if (k >= 1) {
        p.x = p.toX;
        p.y = p.toY;
        p.moving = false;
        p.t = 0;
        onArrive();
        if (state.locked) return;
      }
    } else {
      const dir = heldDir();
      if (dir) tryStep(dir);
    }

    updateCamera();

    if (actionQueued) {
      actionQueued = false;
      if (!p.moving) interact();
    }
    if (cancelQueued) {
      cancelQueued = false;
      requestExit();
    }

    updatePrompt();
  }

  function playerFrame() {
    const p = state.player;
    if (!p.moving) return 0;
    return Math.floor((p.t / p.duration) * 2) % 2;
  }

  /* ───────────────────────── render ───────────────────────── */

  function visible(px, py, w, h, cam) {
    return px + w > cam.x && px < cam.x + VIEW_W && py + h > cam.y && py < cam.y + VIEW_H;
  }

  function renderOverworld() {
    const cam = state.camera;
    const map = state.map;
    const x0 = Math.max(0, Math.floor(cam.x / T));
    const y0 = Math.max(0, Math.floor(cam.y / T));
    const x1 = Math.min(map.w - 1, Math.ceil((cam.x + VIEW_W) / T));
    const y1 = Math.min(map.h - 1, Math.ceil((cam.y + VIEW_H) / T));

    // ground layer
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const ch = map.tiles[y][x];
        const px = x * T - cam.x;
        const py = y * T - cam.y;
        if (ch === "." || ch === "T" || ch === "f" || ch === "S") Art.drawGrass(ctx, px, py);
        else if (ch === ",") Art.drawFlower(ctx, px, py);
        else if (ch === "=") Art.drawPath(ctx, px, py);
        else if (ch === "~") Art.drawWater(ctx, px, py, state.waterFrame);
        else Art.drawGrass(ctx, px, py);
      }
    }

    // depth-sorted layer
    const items = [];
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const ch = map.tiles[y][x];
        if (ch !== "T" && ch !== "f" && ch !== "S") continue;
        const px = x * T - cam.x;
        const py = y * T - cam.y;
        items.push({
          baseY: (y + 1) * T,
          draw: function () {
            if (ch === "T") Art.drawTree(ctx, px, py);
            else if (ch === "f") Art.drawFence(ctx, px, py);
            else Art.drawSign(ctx, px, py);
          }
        });
      }
    }

    for (let i = 0; i < map.buildings.length; i++) {
      const b = map.buildings[i];
      const px = b.x * T - cam.x;
      const py = b.y * T - cam.y;
      const w = b.w * T;
      const h = b.h * T;
      if (!visible(px, py, w, h, { x: 0, y: 0 })) continue;
      items.push({
        baseY: (b.y + b.h) * T,
        draw: function () { Art.drawBuilding(ctx, b, px, py); }
      });
    }

    const p = state.player;
    items.push({
      baseY: p.y + T,
      draw: function () {
        Art.drawPlayer(ctx, Math.round(p.x - cam.x), Math.round(p.y - cam.y), p.dir, playerFrame());
      }
    });

    items.sort(function (a, b) { return a.baseY - b.baseY; });
    for (let i = 0; i < items.length; i++) items[i].draw();
  }

  function renderInterior() {
    const map = state.map;

    // floor
    for (let y = 0; y < map.h; y++) {
      for (let x = 0; x < map.w; x++) {
        if (map.tiles[y][x] !== "#" && map.tiles[y][x] !== "D") {
          Art.drawInteriorFloor(ctx, x * T, y * T);
        }
      }
    }

    // static walls
    for (let y = 0; y < map.h; y++) {
      for (let x = 0; x < map.w; x++) {
        if (map.tiles[y][x] === "#") Art.drawInteriorWall(ctx, x * T, y * T);
      }
    }

    // windows on the top wall
    Art.drawWindow(ctx, 2 * T, 8);
    Art.drawWindow(ctx, 6 * T, 8);

    // rug
    Art.drawRug(ctx, 3 * T, 5 * T, 4 * T, 2 * T);

    // depth-sorted furniture, guide, player, and door wall
    const items = [];

    items.push({ baseY: 2 * T + 24, draw: function () { Art.drawDesk(ctx, 1 * T, 2 * T); } });
    items.push({ baseY: 2 * T + 32, draw: function () { Art.drawBookshelf(ctx, 7 * T, 2 * T); } });
    items.push({ baseY: 4 * T + 16, draw: function () { Art.drawTable(ctx, 4 * T, 4 * T); } });
    items.push({ baseY: 6 * T + 16, draw: function () { Art.drawPlant(ctx, 8 * T, 6 * T); } });

    const g = map.guide;
    items.push({
      baseY: (g.y + 1) * T,
      draw: function () { Art.drawNpc(ctx, g.x * T, g.y * T, g.kind || "professor"); }
    });

    const p = state.player;
    items.push({
      baseY: p.y + T,
      draw: function () {
        Art.drawPlayer(ctx, Math.round(p.x), Math.round(p.y), p.dir, playerFrame());
      }
    });

    // bottom wall + door
    for (let x = 0; x < map.w; x++) {
      if (map.tiles[8][x] === "D") {
        items.push({ baseY: 9 * T, draw: function () { Art.drawInteriorDoor(ctx, 4 * T, 8 * T); } });
      } else {
        const xx = x;
        items.push({ baseY: 9 * T, draw: function () { Art.drawInteriorWall(ctx, xx * T, 8 * T); } });
      }
    }

    items.sort(function (a, b) { return a.baseY - b.baseY; });
    for (let i = 0; i < items.length; i++) items[i].draw();
  }

  function render() {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    if (!state.map) return;
    if (state.mode === "interior") renderInterior();
    else renderOverworld();
  }

  /* ───────────────────────── public state transitions ───────────────────────── */

  function clearHeld() {
    heldDirs.length = 0;
    actionQueued = false;
    cancelQueued = false;
  }

  function startOverworld() {
    state.mode = "overworld";
    state.map = overworld;
    state.currentBuilding = null;
    const sp = data.world.spawn;
    state.player.x = sp.x * T;
    state.player.y = sp.y * T;
    state.player.dir = sp.dir || "up";
    state.player.moving = false;
    state.player.t = 0;
    state.locked = false;
    state.paused = false;
    state.active = true;
    clearHeld();
    updateCamera();
    setLocation(data.world.townName);
    updatePrompt();
  }

  function enterInterior(building) {
    state.mode = "interior";
    state.map = makeInterior(building);

    const sectionGuide = data.sections[building.section] && data.sections[building.section].guide;
    if (sectionGuide) {
      state.map.guide.name = sectionGuide.name;
      state.map.guide.lines = sectionGuide.lines;
    }
    state.map.guide.kind = building.npcKind || "professor";
    state.currentBuilding = building;
    const sp = state.map.spawn;
    state.player.x = sp.x * T;
    state.player.y = sp.y * T;
    state.player.dir = "up";
    state.player.moving = false;
    state.player.t = 0;
    state.locked = false;
    clearHeld();
    updateCamera();
    setLocation(building.name);
    updatePrompt();
  }

  function exitInterior() {
    const b = state.currentBuilding;
    state.mode = "overworld";
    state.map = overworld;
    state.currentBuilding = null;
    if (b) {
      state.player.x = b.door.x * T;
      state.player.y = (b.door.y + 1) * T;
      state.player.dir = "down";
    }
    state.player.moving = false;
    state.player.t = 0;
    state.locked = false;
    clearHeld();
    updateCamera();
    setLocation(data.world.townName);
    updatePrompt();
  }

  function setActive(v) {
    state.active = !!v;
    if (!state.active) clearHeld();
  }

  function setPaused(v) {
    state.paused = !!v;
    if (!state.paused) {
      // An interaction sets `locked` so the player cannot walk away while
      // a dialogue or panel is opening. Closing that UI releases it.
      state.locked = false;
      clearHeld();
      updatePrompt();
    }
  }

  function unlock() {
    state.locked = false;
    clearHeld();
    updatePrompt();
  }

  /* ───────────────────────── input ───────────────────────── */

  const KEY_DIRS = {
    ArrowUp: "up", w: "up", W: "up",
    ArrowDown: "down", s: "down", S: "down",
    ArrowLeft: "left", a: "left", A: "left",
    ArrowRight: "right", d: "right", D: "right"
  };
  const ACTION_KEYS = { Enter: 1, " ": 1, z: 1, Z: 1 };
  const CANCEL_KEYS = { Escape: 1, x: 1, X: 1, Backspace: 1 };

  function onKeyDown(e) {
    if (!state.active) return;

    if (KEY_DIRS[e.key]) {
      if (!state.paused && !state.locked) {
        e.preventDefault();
        pressDir(KEY_DIRS[e.key]);
      }
      return;
    }

    if (ACTION_KEYS[e.key]) {
      if (!state.paused && !state.locked) {
        e.preventDefault();
        if (!e.repeat) actionQueued = true;
      }
      return;
    }

    if (CANCEL_KEYS[e.key]) {
      if (!state.paused && !state.locked) {
        e.preventDefault();
        if (!e.repeat) cancelQueued = true;
      }
    }
  }

  function onKeyUp(e) {
    if (KEY_DIRS[e.key]) releaseDir(KEY_DIRS[e.key]);
  }

  function pressDir(dir) {
    if (heldDirs.indexOf(dir) === -1) heldDirs.push(dir);
  }

  function releaseDir(dir) {
    const i = heldDirs.indexOf(dir);
    if (i !== -1) heldDirs.splice(i, 1);
  }

  function pressAction() {
    if (state.active && !state.paused && !state.locked) actionQueued = true;
  }

  function pressCancel() {
    if (state.active && !state.paused && !state.locked) cancelQueued = true;
  }

  function onBlur() {
    heldDirs.length = 0;
  }

  /* ───────────────────────── loop ───────────────────────── */

  function loop(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  function init(gameCanvas, resumeData, engineHooks) {
    canvas = gameCanvas;
    ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    data = resumeData;
    hooks = engineHooks || {};
    overworld = makeOverworld();
    state.map = overworld;

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    render();
    requestAnimationFrame(loop);
  }

  return {
    init, startOverworld, enterInterior, exitInterior,
    setActive, setPaused, unlock,
    pressDir, releaseDir, pressAction, pressCancel,
    state: state,
    SIGN_TEXT: SIGN_TEXT
  };
})();
