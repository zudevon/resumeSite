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
    "M: town map · Q: sound";

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
     [12, 16], [13, 16], [14, 16], [12, 17], [14, 17]]
      .forEach(function (p) { if (g[p[1]][p[0]] === ".") g[p[1]][p[0]] = "T"; });

    // memorial garden: a dirt patch beside the player's house
    rect(g, 6, 15, 3, 3, "d");
    g[16][7] = "M";
    if (g[14][6] === ".") g[14][6] = ",";
    if (g[14][8] === ".") g[14][8] = ",";

    // town sign
    g[11][11] = "S";

    return {
      kind: "overworld",
      w: W, h: H, tiles: g,
      buildings: data.world.buildings,
      npcs: (data.world.npcs || []).map(function (n) {
        return {
          id: n.id,
          name: n.name,
          lines: n.lines,
          variant: n.variant,
          minX: n.minX,
          maxX: n.maxX,
          speed: n.speed,
          x: n.x * T,
          y: n.y * T,
          fromX: n.x * T,
          fromY: n.y * T,
          toX: n.x * T,
          toY: n.y * T,
          dir: n.dir || "right",
          moving: false,
          paused: false,
          wait: 0,
          t: 0,
          duration: n.speed || 0.18
        };
      })
    };
  }

  const INTERIOR_THEMES = {
    about: "home",
    professional: "guild",
    collegiate: "study",
    ai: "lab",
    life: "lounge"
  };

  const INTERIOR_LAYOUTS = {
    home: {
      rug: { x: 3, y: 5, w: 4, h: 2 },
      props: [
        { type: "bed", x: 1, y: 2, w: 2, h: 2 },
        { type: "desk", x: 6, y: 2, w: 2, h: 2, read: true },
        { type: "table", x: 4, y: 4, w: 2, h: 1 },
        { type: "tv", x: 6, y: 6, w: 2, h: 2 },
        { type: "plant", x: 8, y: 6, w: 1, h: 1 }
      ]
    },
    guild: {
      rug: { x: 3, y: 5, w: 4, h: 2 },
      props: [
        { type: "desk", x: 1, y: 2, w: 2, h: 2, read: true },
        { type: "cabinet", x: 7, y: 2, w: 2, h: 2 },
        { type: "longtable", x: 4, y: 4, w: 3, h: 1 },
        { type: "plant", x: 8, y: 6, w: 1, h: 1 }
      ]
    },
    study: {
      rug: { x: 3, y: 5, w: 4, h: 2 },
      props: [
        { type: "shelf", x: 1, y: 2, w: 2, h: 2, read: true },
        { type: "shelf", x: 7, y: 2, w: 2, h: 2 },
        { type: "table", x: 4, y: 4, w: 2, h: 1 },
        { type: "globe", x: 8, y: 6, w: 1, h: 1 }
      ]
    },
    lab: {
      rug: { x: 3, y: 5, w: 4, h: 2 },
      props: [
        { type: "server", x: 1, y: 2, w: 2, h: 2, read: true },
        { type: "server", x: 7, y: 2, w: 2, h: 2, read: true },
        { type: "console", x: 4, y: 4, w: 2, h: 1, read: true },
        { type: "crate", x: 8, y: 6, w: 1, h: 1 }
      ]
    },
    lounge: {
      rug: { x: 3, y: 5, w: 4, h: 2 },
      props: [
        { type: "sofa", x: 1, y: 3, w: 3, h: 2 },
        { type: "tv", x: 7, y: 2, w: 2, h: 2 },
        { type: "table", x: 5, y: 4, w: 2, h: 1 },
        { type: "skateboard", x: 8, y: 6, w: 1, h: 2 },
        { type: "plant", x: 1, y: 6, w: 1, h: 1 }
      ]
    }
  };

  function makeInterior(building) {
    const W = 10, H = 9;
    const g = grid(W, H, "#");
    rect(g, 1, 2, 8, 6, ".");
    g[8][4] = "D";

    const theme = INTERIOR_THEMES[building.section] || "home";
    const layout = INTERIOR_LAYOUTS[theme];

    return {
      kind: "interior",
      w: W, h: H, tiles: g,
      building: building,
      theme: theme,
      rug: layout.rug,
      props: layout.props,
      door: { x: 4, y: 8 },
      spawn: { x: 4, y: 7 },
      guide: { x: 3, y: 5 },
      solids: layout.props.filter(function (p) { return p.solid !== false; })
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

  function npcAt(x, y) {
    if (state.map.kind !== "overworld" || !state.map.npcs) return null;
    const list = state.map.npcs;
    for (let i = 0; i < list.length; i++) {
      const n = list[i];
      if (Math.round(n.x / T) === x && Math.round(n.y / T) === y) return n;
    }
    return null;
  }

  function pauseNpc(n) {
    if (!n) return;
    n.paused = true;
    n.moving = false;
    n.t = 0;
    n.wait = 0;
    n.x = Math.round(n.x / T) * T;
    n.y = Math.round(n.y / T) * T;
    const p = state.player;
    if (p.x < n.x) n.dir = "left";
    else if (p.x > n.x) n.dir = "right";
  }

  function resumeNpc(n) {
    if (!n) return;
    n.paused = false;
    n.wait = 0.2;
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

    if (ch === "T" || ch === "~" || ch === "f" || ch === "S" || ch === "M") return false;

    const b = buildingAt(x, y);
    if (b) return b.door.x === x && b.door.y === y;

    if (npcAt(x, y)) return false;

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
      if (npcAt(f.x, f.y)) return "TALK";
      const b = doorAt(f.x, f.y);
      if (b) return "ENTER · " + b.name;
      const ch = tileAt(f.x, f.y);
      if (ch === "S" || ch === "M") return "READ";
      return null;
    }

    const d = state.map.door;
    if (d && f.x === d.x && f.y === d.y) return "EXIT";

    const g = state.map.guide;
    if (g && f.x === g.x && f.y === g.y) return "TALK";

    const s = interiorSolidAt(f.x, f.y);
    if (s && s.read) return "READ";
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

      const npc = npcAt(f.x, f.y);
      if (npc) {
        pauseNpc(npc);
        state.locked = true;
        if (hooks.onInteract) hooks.onInteract({ type: "npc", npc: npc, section: null });
        return;
      }

      const b = doorAt(f.x, f.y);
      if (b) {
        state.locked = true;
        if (hooks.onDoor) hooks.onDoor(b);
        return;
      }

      const ch = tileAt(f.x, f.y);
      if (ch === "S") {
        state.locked = true;
        if (hooks.onInteract) hooks.onInteract({ type: "sign", text: SIGN_TEXT });
      } else if (ch === "M") {
        state.locked = true;
        if (hooks.onInteract) hooks.onInteract({ type: "tombstone", text: data.world.memorial });
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
    if (s && s.read) {
      state.locked = true;
      if (hooks.onInteract) hooks.onInteract({ type: s.type, section: b.section, building: b });
    }
  }

  function requestExit() {
    if (state.mode !== "interior" || state.locked) return;
    state.locked = true;
    if (hooks.onExit) hooks.onExit(state.currentBuilding);
  }

  /* ───────────────────────── NPC patrol ───────────────────────── */

  function updateNpcs(dt) {
    if (state.mode !== "overworld") return;
    const npcs = state.map.npcs;
    if (!npcs) return;

    const p = state.player;
    const playerTile = {
      x: Math.round(p.x / T),
      y: Math.round(p.y / T)
    };
    const playerNext = p.moving
      ? { x: Math.round(p.toX / T), y: Math.round(p.toY / T) }
      : playerTile;

    for (let i = 0; i < npcs.length; i++) {
      const n = npcs[i];
      if (n.paused) continue;

      if (n.wait > 0) {
        n.wait -= dt;
        continue;
      }

      if (n.moving) {
        n.t += dt;
        const k = Math.min(1, n.t / n.duration);
        n.x = n.fromX + (n.toX - n.fromX) * k;
        n.y = n.fromY + (n.toY - n.fromY) * k;
        if (k >= 1) {
          n.x = n.toX;
          n.y = n.toY;
          n.moving = false;
          n.t = 0;
        }
        continue;
      }

      const tx = Math.round(n.x / T);
      const ty = Math.round(n.y / T);

      if (n.dir === "right" && tx >= n.maxX) {
        n.dir = "left";
        n.wait = 0.45;
        continue;
      }
      if (n.dir === "left" && tx <= n.minX) {
        n.dir = "right";
        n.wait = 0.45;
        continue;
      }

      const nx = tx + (n.dir === "right" ? 1 : -1);

      // Stand in a girl's path and she has to stop. Then you can talk.
      if ((nx === playerTile.x && ty === playerTile.y) ||
          (nx === playerNext.x && ty === playerNext.y)) {
        n.wait = 0.1;
        continue;
      }

      n.fromX = n.x;
      n.fromY = n.y;
      n.toX = nx * T;
      n.toY = n.y;
      n.t = 0;
      n.moving = true;
      n.duration = n.speed || 0.18;
    }
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

    updateNpcs(dt);
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
        else if (ch === "d" || ch === "M") Art.drawDirt(ctx, px, py);
        else Art.drawGrass(ctx, px, py);
      }
    }

    // depth-sorted layer
    const items = [];
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const ch = map.tiles[y][x];
        if (ch !== "T" && ch !== "f" && ch !== "S" && ch !== "M") continue;
        const px = x * T - cam.x;
        const py = y * T - cam.y;
        items.push({
          baseY: (y + 1) * T,
          draw: function () {
            if (ch === "T") Art.drawTree(ctx, px, py);
            else if (ch === "f") Art.drawFence(ctx, px, py);
            else if (ch === "S") Art.drawSign(ctx, px, py);
            else Art.drawTombstone(ctx, px, py);
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

    const npcs = map.npcs || [];
    npcs.forEach(function (n) {
      items.push({
        baseY: n.y + T,
        draw: function () {
          Art.drawScooterGirl(
            ctx,
            Math.round(n.x - cam.x),
            Math.round(n.y - cam.y),
            n.dir,
            n.moving ? Math.floor(state.time * 8) % 2 : 0,
            n.variant
          );
        }
      });
    });

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
          Art.drawInteriorFloor(ctx, x * T, y * T, map.theme);
        }
      }
    }

    // static walls
    for (let y = 0; y < map.h; y++) {
      for (let x = 0; x < map.w; x++) {
        if (map.tiles[y][x] === "#") Art.drawInteriorWall(ctx, x * T, y * T);
      }
    }

    // theme-specific wall art
    Art.drawInteriorWallArt(ctx, map.theme);

    // rug
    const rug = map.rug;
    Art.drawRug(ctx, rug.x * T, rug.y * T, rug.w * T, rug.h * T, map.theme);

    // depth-sorted props, guide, player, and door wall
    const items = [];

    map.props.forEach(function (p) {
      items.push({
        baseY: (p.y + p.h) * T,
        draw: function () {
          Art.drawInteriorProp(ctx, p.type, p.x * T, p.y * T, p.w * T, p.h * T, state.time);
        }
      });
    });

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
      if (state.overworld && state.overworld.npcs) {
        state.overworld.npcs.forEach(function (n) { n.paused = false; });
      }
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
    state.overworld = overworld;

    const spawn = data.world.spawn;
    state.player.x = spawn.x * T;
    state.player.y = spawn.y * T;
    state.player.dir = spawn.dir || "up";
    updateCamera();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    render();
    requestAnimationFrame(loop);
  }

  return {
    init, startOverworld, enterInterior, exitInterior,
    setActive, setPaused, unlock,
    resumeNpc,
    pressDir, releaseDir, pressAction, pressCancel,
    state: state,
    SIGN_TEXT: SIGN_TEXT
  };
})();
