/* =========================================================
   art.js — original pixel art, drawn in code.
   Four-shade blue palette. No ripped sprites, no image files.
   ========================================================= */

window.Art = (function () {

  const P = {
    "0": "#061426", // ink
    "1": "#0d3358", // dark
    "2": "#2b6fa8", // mid
    "3": "#7fc4ea", // light
    "4": "#d9f2ff"  // white
  };

  const T = 16;

  function px(ctx, x, y, color, w, h) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), w || 1, h || 1);
  }

  function hash(x, y) {
    let h = (x | 0) * 374761393 + (y | 0) * 668265263;
    h = (h ^ (h >> 13)) * 1274126177;
    return (h ^ (h >> 16)) >>> 0;
  }

  function drawSprite(ctx, rows, x, y, flip, palette) {
    const pal = palette || P;
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch === ".") continue;
        const col = pal[ch];
        if (!col) continue;
        const cx = flip ? (row.length - 1 - c) : c;
        px(ctx, x + cx, y + r, col);
      }
    }
  }

  /* ───────────────────────── ground ───────────────────────── */

  function drawGrass(ctx, x, y) {
    px(ctx, x, y, P["2"], T, T);
    const h = hash(x, y);
    for (let i = 0; i < 2; i++) {
      const gx = x + 3 + ((h >> (i * 5)) % 10);
      const gy = y + 3 + ((h >> (i * 4 + 2)) % 10);
      px(ctx, gx, gy, P["3"]);
      if ((h >> (i + 1)) & 1) px(ctx, gx + 1, gy, P["3"]);
    }
    if (h % 13 === 0) px(ctx, x + 4 + (h % 7), y + 4 + (h % 5), P["1"]);
  }

  function drawPath(ctx, x, y) {
    px(ctx, x, y, P["3"], T, T);
    const h = hash(x + 999, y + 77);
    px(ctx, x + (h % T), y + ((h >> 5) % T), P["2"]);
    if (h % 7 === 0) px(ctx, x + 2, y + 6, P["2"], 3, 1);
  }

  function drawFlower(ctx, x, y) {
    drawGrass(ctx, x, y);
    const h = hash(x, y);
    const ox = x + 4 + (h % 6);
    const oy = y + 5 + ((h >> 3) % 4);
    px(ctx, ox + 1, oy + 2, P["1"]);
    px(ctx, ox, oy + 1, P["4"], 3, 1);
    px(ctx, ox + 1, oy, P["4"], 1, 3);
    px(ctx, ox + 1, oy + 1, P["2"]);
  }

  function drawWater(ctx, x, y, frame) {
    px(ctx, x, y, P["1"], T, T);
    const off = frame ? 3 : 0;
    px(ctx, x + 1 + off, y + 4, P["2"], 4, 1);
    px(ctx, x + 9 - off, y + 7, P["3"], 3, 1);
    px(ctx, x + 3 + off, y + 11, P["2"], 5, 1);
    px(ctx, x + 12 - off, y + 13, P["3"], 2, 1);
    px(ctx, x, y, P["2"], T, 1);
  }

  function drawDirt(ctx, x, y) {
    px(ctx, x, y, P["1"], T, T);
    const h = hash(x + 31, y + 17);
    px(ctx, x + 2 + (h % 10), y + 3 + ((h >> 3) % 9), P["2"], 2, 1);
    px(ctx, x + 5 + ((h >> 4) % 8), y + 9 + ((h >> 5) % 5), P["3"]);
    px(ctx, x + 3 + ((h >> 6) % 9), y + 12 + ((h >> 7) % 3), P["2"]);
    if (h % 3 === 0) px(ctx, x + 1, y + 1, P["2"], 2, 2);
  }

  /* ───────────────────────── tall props ───────────────────────── */

  function drawTree(ctx, x, y) {
    px(ctx, x + 7, y + 11, P["1"], 2, 4);
    px(ctx, x + 7, y + 15, P["0"], 2, 1);

    const rows = [
      [4, 1], [8, 2], [10, 3], [12, 4], [12, 5], [12, 6],
      [12, 7], [10, 8], [8, 9], [6, 10], [4, 11]
    ];
    for (let i = 0; i < rows.length; i++) {
      const w = rows[i][0];
      const dy = rows[i][1];
      const ox = x + (T - w) / 2;
      px(ctx, ox - 1, y + dy, P["0"], w + 2, 1);
      px(ctx, ox, y + dy, P["1"], w, 1);
    }

    px(ctx, x + 4, y + 3, P["2"], 3, 1);
    px(ctx, x + 3, y + 5, P["2"], 2, 1);
    px(ctx, x + 5, y + 2, P["3"]);
    px(ctx, x + 10, y + 7, P["2"], 2, 1);
    px(ctx, x + 8, y + 9, P["2"]);
  }

  function drawFence(ctx, x, y) {
    px(ctx, x + 2, y + 2, P["0"], 3, 13);
    px(ctx, x + 2, y + 2, P["1"], 2, 12);
    px(ctx, x + 11, y + 2, P["0"], 3, 13);
    px(ctx, x + 11, y + 2, P["1"], 2, 12);
    px(ctx, x + 1, y + 5, P["0"], 14, 3);
    px(ctx, x + 1, y + 5, P["2"], 14, 1);
    px(ctx, x + 1, y + 9, P["0"], 14, 3);
    px(ctx, x + 1, y + 9, P["2"], 14, 1);
  }

  function drawSign(ctx, x, y) {
    px(ctx, x + 7, y + 10, P["0"], 2, 5);
    px(ctx, x + 7, y + 10, P["1"], 1, 5);
    px(ctx, x + 1, y + 2, P["0"], 14, 9);
    px(ctx, x + 2, y + 3, P["3"], 12, 7);
    px(ctx, x + 3, y + 5, P["0"], 10, 1);
    px(ctx, x + 3, y + 7, P["0"], 7, 1);
  }

  function drawTombstone(ctx, x, y) {
    px(ctx, x + 4, y + 2, P["0"], 8, 12);
    px(ctx, x + 5, y + 3, P["4"], 6, 10);
    px(ctx, x + 5, y + 1, P["0"], 6, 2);
    px(ctx, x + 6, y + 1, P["4"], 4, 1);
    px(ctx, x + 7, y + 5, P["1"], 2, 1);
    px(ctx, x + 7, y + 7, P["1"], 2, 1);
    px(ctx, x + 6, y + 9, P["1"], 4, 1);
    px(ctx, x + 3, y + 13, P["0"], 10, 2);
    px(ctx, x + 4, y + 13, P["2"], 8, 1);
    px(ctx, x + 2, y + 14, P["3"]);
    px(ctx, x + 13, y + 14, P["3"]);
  }

  /* ───────────────────────── buildings ───────────────────────── */

  function drawWindow(ctx, x, y) {
    px(ctx, x, y, P["0"], 12, 12);
    px(ctx, x + 1, y + 1, P["4"], 10, 10);
    px(ctx, x + 1, y + 5, P["1"], 10, 2);
    px(ctx, x + 5, y + 1, P["1"], 2, 10);
    px(ctx, x - 1, y + 12, P["2"], 14, 1);
  }

  function drawWallBase(ctx, x, y, wallTop) {
    const wx = x + 4, wy = y + wallTop, ww = 56, wh = 64 - wallTop;
    px(ctx, wx, wy, P["0"], ww, wh);
    px(ctx, wx + 1, wy + 1, P["3"], ww - 2, wh - 2);
    px(ctx, wx + 1, y + 59, P["2"], ww - 2, 2);
  }

  function drawDoor(ctx, x, y, style) {
    if (style === "double" || style === "glass") {
      const glass = style === "glass";
      px(ctx, x + 22, y + 46, P["0"], 20, 18);
      px(ctx, x + 23, y + 47, glass ? P["4"] : P["1"], 18, 17);
      px(ctx, x + 24, y + 49, glass ? P["3"] : P["2"], 7, 15);
      px(ctx, x + 33, y + 49, glass ? P["3"] : P["2"], 7, 15);
      px(ctx, x + 28, y + 55, P["4"]);
      px(ctx, x + 35, y + 55, P["4"]);
      if (glass) {
        px(ctx, x + 31, y + 47, P["0"], 2, 17);
        px(ctx, x + 23, y + 51, P["2"], 18, 1);
      }
      px(ctx, x + 22, y + 62, P["2"], 20, 2);
      return;
    }

    px(ctx, x + 24, y + 46, P["0"], 16, 18);
    px(ctx, x + 25, y + 47, P["1"], 14, 17);
    px(ctx, x + 27, y + 49, P["2"], 10, 15);
    px(ctx, x + 35, y + 55, P["4"]);
    px(ctx, x + 22, y + 62, P["2"], 20, 2);
  }

  function drawTallWindow(ctx, x, y) {
    px(ctx, x, y, P["0"], 8, 16);
    px(ctx, x + 1, y + 1, P["4"], 6, 14);
    px(ctx, x + 1, y + 6, P["1"], 6, 1);
    px(ctx, x + 4, y + 1, P["1"], 1, 14);
    px(ctx, x - 1, y + 16, P["2"], 10, 1);
  }

  function drawPictureWindow(ctx, x, y, w, h) {
    px(ctx, x, y, P["0"], w, h);
    px(ctx, x + 1, y + 1, P["4"], w - 2, h - 2);
    px(ctx, x + 1, y + Math.floor(h / 2), P["1"], w - 2, 1);
    px(ctx, x + Math.floor(w / 2), y + 1, P["1"], 1, h - 2);
    px(ctx, x - 1, y + h, P["2"], w + 2, 1);
  }

  function drawHomeHouse(ctx, x, y) {
    const w = 64;

    // steep stepped roof
    for (let r = 0; r < 28; r++) {
      const inset = Math.max(0, 12 - Math.floor(r / 7) * 4);
      px(ctx, x + inset, y + r, P["1"], w - inset * 2, 1);
      px(ctx, x + inset, y + r, P["0"], 1, 1);
      px(ctx, x + w - inset - 1, y + r, P["0"], 1, 1);
      if (r === 0) px(ctx, x + inset + 2, y, P["3"], w - inset * 2 - 4, 1);
      else if (r % 6 === 0) px(ctx, x + inset + 1, y + r, P["2"], w - inset * 2 - 2, 1);
    }
    px(ctx, x, y + 27, P["0"], w, 2);
    px(ctx, x + 2, y + 28, P["2"], w - 4, 1);

    // chimney
    px(ctx, x + 9, y + 4, P["0"], 8, 14);
    px(ctx, x + 10, y + 5, P["1"], 6, 12);
    px(ctx, x + 9, y + 4, P["3"], 8, 2);

    drawWallBase(ctx, x, y, 29);
    drawWindow(ctx, x + 10, y + 36);
    drawWindow(ctx, x + 42, y + 36);
    drawDoor(ctx, x, y, "single");

    // flower boxes
    px(ctx, x + 10, y + 48, P["2"], 12, 3);
    px(ctx, x + 12, y + 48, P["4"]);
    px(ctx, x + 17, y + 48, P["4"]);
    px(ctx, x + 42, y + 48, P["2"], 12, 3);
    px(ctx, x + 44, y + 48, P["4"]);
    px(ctx, x + 49, y + 48, P["4"]);

    // doormat
    px(ctx, x + 26, y + 60, P["2"], 12, 2);
  }

  function drawGuildHouse(ctx, x, y) {
    const w = 64;

    // tall gable roof
    for (let r = 0; r < 28; r++) {
      const inset = Math.max(0, 24 - Math.floor(r * 0.9));
      px(ctx, x + inset, y + r, P["1"], w - inset * 2, 1);
      px(ctx, x + inset, y + r, P["0"], 1, 1);
      px(ctx, x + w - inset - 1, y + r, P["0"], 1, 1);
      if (r % 5 === 0) px(ctx, x + inset + 1, y + r, P["2"], w - inset * 2 - 2, 1);
    }
    px(ctx, x, y + 27, P["0"], w, 2);
    px(ctx, x + 2, y + 28, P["2"], w - 4, 1);

    // pennant at the peak
    px(ctx, x + 31, y + 1, P["0"], 2, 12);
    px(ctx, x + 33, y + 2, P["2"], 7, 5);
    px(ctx, x + 34, y + 3, P["4"], 4, 3);

    drawWallBase(ctx, x, y, 29);

    // stone base
    px(ctx, x + 5, y + 60, P["2"], 54, 3);

    // columns
    for (let i = 0; i < 2; i++) {
      const cx = i === 0 ? x + 4 : x + 56;
      px(ctx, cx, y + 29, P["0"], 4, 31);
      px(ctx, cx + 1, y + 30, P["4"], 2, 29);
      px(ctx, cx, y + 29, P["2"], 4, 2);
    }

    drawTallWindow(ctx, x + 9, y + 34);
    drawTallWindow(ctx, x + 47, y + 34);
    drawDoor(ctx, x, y, "double");

    // banner above the door
    px(ctx, x + 26, y + 32, P["0"], 12, 9);
    px(ctx, x + 27, y + 33, P["2"], 10, 7);
    px(ctx, x + 29, y + 35, P["4"], 2, 1);
    px(ctx, x + 31, y + 36, P["4"], 2, 1);
    px(ctx, x + 33, y + 35, P["4"], 2, 1);
  }

  function drawRivalHouse(ctx, x, y) {
    // flat roof + parapet
    px(ctx, x + 2, y + 8, P["0"], 60, 16);
    px(ctx, x + 3, y + 9, P["1"], 58, 14);
    px(ctx, x + 2, y + 22, P["0"], 60, 4);
    px(ctx, x + 4, y + 23, P["2"], 56, 2);

    // satellite dish
    px(ctx, x + 46, y + 1, P["0"], 2, 10);
    px(ctx, x + 42, y + 1, P["2"], 9, 7);
    px(ctx, x + 43, y + 2, P["4"], 7, 2);
    px(ctx, x + 45, y + 8, P["1"], 2, 2);

    drawWallBase(ctx, x, y, 26);

    drawPictureWindow(ctx, x + 7, y + 33, 22, 12);
    drawWindow(ctx, x + 44, y + 34);

    // cat silhouette in the picture window
    px(ctx, x + 14, y + 40, P["1"], 6, 4);
    px(ctx, x + 13, y + 38, P["1"], 2, 2);
    px(ctx, x + 19, y + 38, P["1"], 2, 2);

    drawDoor(ctx, x, y, "single");

    // cat flap
    px(ctx, x + 29, y + 59, P["0"], 6, 4);
  }

  function drawCenterHouse(ctx, x, y) {
    const w = 64;

    // wide low roof
    for (let r = 0; r < 26; r++) {
      const inset = Math.max(0, 12 - Math.floor(r / 9) * 6);
      px(ctx, x + inset, y + r, P["1"], w - inset * 2, 1);
      px(ctx, x + inset, y + r, P["0"], 1, 1);
      px(ctx, x + w - inset - 1, y + r, P["0"], 1, 1);
      if (r === 0) px(ctx, x + inset + 2, y, P["3"], w - inset * 2 - 4, 1);
      else if (r % 7 === 0) px(ctx, x + inset + 1, y + r, P["2"], w - inset * 2 - 2, 1);
    }
    px(ctx, x, y + 25, P["0"], w, 2);
    px(ctx, x + 2, y + 26, P["2"], w - 4, 1);

    // cross on the roof peak
    px(ctx, x + 31, y + 2, P["4"], 2, 7);
    px(ctx, x + 29, y + 4, P["4"], 6, 2);

    drawWallBase(ctx, x, y, 27);

    // windows with awnings
    drawWindow(ctx, x + 10, y + 36);
    drawWindow(ctx, x + 42, y + 36);
    for (let i = 0; i < 6; i++) {
      px(ctx, x + 9 + i * 2, y + 33, i % 2 ? P["4"] : P["2"], 2, 3);
      px(ctx, x + 41 + i * 2, y + 33, i % 2 ? P["4"] : P["2"], 2, 3);
    }

    // cross plate above the door
    px(ctx, x + 23, y + 31, P["0"], 18, 10);
    px(ctx, x + 24, y + 32, P["4"], 16, 8);
    px(ctx, x + 31, y + 33, P["2"], 2, 6);
    px(ctx, x + 29, y + 35, P["2"], 6, 2);

    // glass double door + awning
    drawDoor(ctx, x, y, "glass");
    for (let i = 0; i < 12; i++) {
      px(ctx, x + 20 + i * 2, y + 43, i % 2 ? P["4"] : P["2"], 2, 4);
    }
  }

  function drawHouse(ctx, x, y, accent) {
    if (accent === "guild") drawGuildHouse(ctx, x, y);
    else if (accent === "rival") drawRivalHouse(ctx, x, y);
    else if (accent === "center") drawCenterHouse(ctx, x, y);
    else drawHomeHouse(ctx, x, y);
  }

  function drawLab(ctx, x, y) {
    const w = 96, h = 80;

    // flat roof
    px(ctx, x, y, P["0"], w, 20);
    px(ctx, x + 1, y + 1, P["1"], w - 2, 18);
    for (let i = 6; i < w - 6; i += 12) px(ctx, x + i, y + 2, P["2"], 1, 16);
    px(ctx, x, y + 18, P["2"], w, 1);

    // antenna / dish
    px(ctx, x + 70, y + 2, P["0"], 1, 18);
    px(ctx, x + 66, y + 4, P["2"], 8, 2);
    px(ctx, x + 68, y + 6, P["2"], 4, 2);
    px(ctx, x + 69, y + 8, P["2"], 2, 2);

    // vents
    px(ctx, x + 10, y + 8, P["0"], 10, 4);
    px(ctx, x + 11, y + 9, P["2"], 8, 2);
    px(ctx, x + 28, y + 8, P["0"], 10, 4);
    px(ctx, x + 29, y + 9, P["2"], 8, 2);

    // walls
    px(ctx, x + 4, y + 20, P["0"], w - 8, h - 20);
    px(ctx, x + 5, y + 21, P["3"], w - 10, h - 22);
    px(ctx, x + 5, y + h - 5, P["2"], w - 10, 2);

    // windows
    drawWindow(ctx, x + 10, y + 28);
    drawWindow(ctx, x + 41, y + 28);
    drawWindow(ctx, x + 72, y + 28);

    // double door
    px(ctx, x + 36, y + 58, P["0"], 24, 22);
    px(ctx, x + 37, y + 59, P["1"], 22, 21);
    px(ctx, x + 39, y + 61, P["2"], 8, 17);
    px(ctx, x + 49, y + 61, P["2"], 8, 17);
    px(ctx, x + 43, y + 69, P["4"]);
    px(ctx, x + 52, y + 69, P["4"]);
    px(ctx, x + 34, y + 78, P["2"], 28, 2);

    // sign with lightning bolt
    px(ctx, x + 34, y + 43, P["0"], 28, 10);
    px(ctx, x + 35, y + 44, P["4"], 26, 8);
    px(ctx, x + 47, y + 45, P["2"], 3, 3);
    px(ctx, x + 45, y + 47, P["2"], 5, 2);
    px(ctx, x + 43, y + 49, P["2"], 4, 1);
    px(ctx, x + 46, y + 49, P["2"], 3, 2);

    // side pipe
    px(ctx, x + 88, y + 21, P["0"], 2, 38);
    px(ctx, x + 89, y + 21, P["2"], 1, 38);
  }

  function drawCenter(ctx, x, y) {
    drawCenterHouse(ctx, x, y);
  }

  function drawBuilding(ctx, building, x, y) {
    if (building.kind === "lab") drawLab(ctx, x, y);
    else if (building.kind === "center") drawCenter(ctx, x, y);
    else drawHouse(ctx, x, y, building.accent);
  }

  /* ───────────────────────── characters ───────────────────────── */

  const PLAYER = {
    down: [
      [
        "................",
        ".....000000.....",
        "....01111110....",
        "...0112222110...",
        "...0122222210...",
        "...0123333210...",
        "...0134334310...",
        "...0133333310...",
        "....01333310....",
        "....00111100....",
        "...0112222110...",
        "..011222222110..",
        "..011222222110..",
        "..011222222110..",
        "....01100110....",
        "....01100110...."
      ],
      [
        "................",
        ".....000000.....",
        "....01111110....",
        "...0112222110...",
        "...0122222210...",
        "...0123333210...",
        "...0134334310...",
        "...0133333310...",
        "....01333310....",
        "....00111100....",
        "...0112222110...",
        "..011222222110..",
        "..011222222110..",
        "..011222222110..",
        "...0110011000...",
        "....01100110...."
      ]
    ],
    up: [
      [
        "................",
        ".....000000.....",
        "....01111110....",
        "...0113222110...",
        "...0122222210...",
        "...0111111110...",
        "...0111111110...",
        "...0123333210...",
        "....01222210....",
        "....00111100....",
        "...0112222110...",
        "..011222222110..",
        "..011222222110..",
        "..011222222110..",
        "....01100110....",
        "....01100110...."
      ],
      [
        "................",
        ".....000000.....",
        "....01111110....",
        "...0113222110...",
        "...0122222210...",
        "...0111111110...",
        "...0111111110...",
        "...0123333210...",
        "....01222210....",
        "....00111100....",
        "...0112222110...",
        "..011222222110..",
        "..011222222110..",
        "..011222222110..",
        "...0110011000...",
        "....01100110...."
      ]
    ],
    side: [
      [
        "................",
        "......000000....",
        ".....0111110....",
        "....011222110...",
        "....012222210...",
        "....012333210...",
        "....013433210...",
        "....013333210...",
        ".....0133310....",
        ".....0011100....",
        "....011222110...",
        "...01122222110..",
        "...01122222110..",
        "...01122222110..",
        "....01100110....",
        "....01100110...."
      ],
      [
        "................",
        "......000000....",
        ".....0111110....",
        "....011222110...",
        "....012222210...",
        "....012333210...",
        "....013433210...",
        "....013333210...",
        ".....0133310....",
        ".....0011100....",
        "....011222110...",
        "...01122222110..",
        "...01122222110..",
        "...01122222110..",
        "....01100110....",
        "...011001100...."
      ]
    ]
  };

  const NPC_PALETTES = {
    mom:       { "2": "#d9f2ff", "1": "#0d3358", "4": "#2b6fa8" },
    professor: { "2": "#d9f2ff", "1": "#0d3358", "4": "#061426" },
    guild:     { "2": "#2b6fa8", "1": "#061426", "4": "#d9f2ff" },
    rival:     { "2": "#0d3358", "1": "#061426", "4": "#d9f2ff" },
    friend:    { "2": "#7fc4ea", "1": "#0d3358", "4": "#d9f2ff" }
  };

  function drawPlayer(ctx, x, y, dir, frame) {
    let rows, flip = false;
    if (dir === "up") rows = PLAYER.up[frame ? 1 : 0];
    else if (dir === "left") rows = PLAYER.side[frame ? 1 : 0];
    else if (dir === "right") { rows = PLAYER.side[frame ? 1 : 0]; flip = true; }
    else rows = PLAYER.down[frame ? 1 : 0];
    drawSprite(ctx, rows, x, y, flip);
  }

  function drawNpc(ctx, x, y, kind) {
    const pal = Object.assign({}, P, NPC_PALETTES[kind] || {});
    drawSprite(ctx, PLAYER.down[0], x, y, false, pal);
  }

  function drawScooterGirl(ctx, x, y, dir, frame, variant) {
    const flip = dir === "left";
    const shirt = variant === "b" ? P["2"] : P["4"];
    const helmet = variant === "b" ? P["4"] : P["2"];

    function put(dx, dy, color, w, h) {
      const ww = w || 1;
      const hh = h || 1;
      px(ctx, x + (flip ? 16 - dx - ww : dx), y + dy, color, ww, hh);
    }

    // wheels
    put(1, 12, P["0"], 4, 4);
    put(2, 13, P["3"], 2, 2);
    put(11, 12, P["0"], 4, 4);
    put(12, 13, P["3"], 2, 2);

    // deck, stem, handlebar
    put(3, 11, P["1"], 11, 2);
    put(4, 11, P["2"], 9, 1);
    put(13, 5, P["0"], 2, 7);
    put(14, 6, P["2"], 1, 5);
    put(11, 3, P["0"], 5, 2);
    put(12, 3, P["3"], 3, 1);

    // legs
    put(7, 9, P["1"], 3, 2);
    put(7, 10, P["0"], 3, 1);

    // body
    put(5, 5, shirt, 5, 4);
    put(4, 5, P["0"], 1, 4);
    put(10, 5, P["0"], 1, 4);
    put(5, 4, P["0"], 5, 1);
    put(5, 9, P["0"], 5, 1);

    // arm reaching to the handlebar
    put(9, 6, P["3"], 3, 1);
    put(11, 5, P["3"], 2, 2);

    // head and helmet
    put(5, 1, helmet, 5, 2);
    put(5, 3, P["3"], 5, 2);
    put(8, 3, P["0"], 1, 1);
    put(6, 1, P["4"], 2, 1);

    // ponytail and a little motion streak
    if (frame) {
      put(2, 1, P["1"], 3, 4);
      put(0, 11, P["2"], 2, 1);
    } else {
      put(3, 2, P["1"], 2, 3);
    }

    // cat ears for the cat girl
    if (variant === "b") {
      put(6, 0, P["4"], 2, 1);
      put(9, 0, P["4"], 2, 1);
    }
  }

  /* ───────────────────────── interior ───────────────────────── */

  function drawInteriorFloor(ctx, x, y, theme) {
    px(ctx, x, y, P["3"], T, T);
    px(ctx, x, y, P["2"], T, 1);
    px(ctx, x, y, P["2"], 1, T);

    if (theme === "study") {
      px(ctx, x + 8, y, P["2"], 1, T);
      px(ctx, x, y + 8, P["2"], T, 1);
    } else if (theme === "lab") {
      px(ctx, x + 4, y + 4, P["2"], 8, 1);
      px(ctx, x + 12, y + 4, P["2"], 1, 8);
      px(ctx, x + 4, y + 12, P["2"], 1, 4);
    } else if (theme === "lounge") {
      px(ctx, x + 8, y + 8, P["2"], 4, 4);
    } else if (theme === "guild") {
      px(ctx, x + 4, y + 4, P["2"], 2, 1);
      px(ctx, x + 10, y + 10, P["2"], 2, 1);
    } else {
      const h = hash(x, y);
      if (h % 5 === 0) px(ctx, x + 8, y + 8, P["2"], 2, 2);
    }
  }

  function drawInteriorWall(ctx, x, y) {
    px(ctx, x, y, P["1"], T, T);
    px(ctx, x + 3, y, P["0"], 1, T);
    px(ctx, x + 12, y, P["0"], 1, T);
    px(ctx, x, y + 14, P["2"], T, 2);
  }

  function drawInteriorDoor(ctx, x, y) {
    px(ctx, x, y, P["0"], T, T);
    px(ctx, x + 1, y, P["1"], T - 2, T);
    px(ctx, x + 2, y + 2, P["2"], T - 4, T - 4);
    px(ctx, x + 7, y + 8, P["4"], 2, 2);
  }

  function drawRug(ctx, x, y, w, h, theme) {
    px(ctx, x, y, P["0"], w, h);
    px(ctx, x + 1, y + 1, P["2"], w - 2, h - 2);
    px(ctx, x + 2, y + 2, P["3"], w - 4, 1);
    px(ctx, x + 2, y + h - 3, P["3"], w - 4, 1);

    const cx = x + Math.floor(w / 2);
    const cy = y + Math.floor(h / 2);

    if (theme === "guild") {
      for (let yy = y + 6; yy < y + h - 3; yy += 6) px(ctx, x + 4, yy, P["3"], w - 8, 1);
    } else if (theme === "study") {
      for (let xx = x + 10; xx < x + w - 4; xx += 10) px(ctx, xx, y + 3, P["3"], 1, h - 6);
      for (let yy = y + 7; yy < y + h - 3; yy += 7) px(ctx, x + 3, yy, P["3"], w - 6, 1);
    } else if (theme === "lab") {
      px(ctx, cx - 12, cy, P["3"], 24, 1);
      px(ctx, cx, cy - 8, P["3"], 1, 16);
      px(ctx, cx - 8, cy - 4, P["3"], 1, 8);
      px(ctx, cx + 8, cy - 4, P["3"], 1, 8);
      px(ctx, cx - 12, cy - 4, P["3"], 4, 1);
      px(ctx, cx + 8, cy + 4, P["3"], 4, 1);
    } else if (theme === "lounge") {
      for (let xx = x + 8; xx < x + w - 4; xx += 10) {
        for (let yy = y + 5; yy < y + h - 3; yy += 7) {
          px(ctx, xx, yy, P["3"], 2, 2);
        }
      }
    } else {
      for (let i = 0; i < 3; i++) {
        px(ctx, cx - 8 + i * 2, cy + 4 - i * 4, P["3"], 16 - i * 4, 1);
        px(ctx, cx - 8 + i * 2, cy - 4 + i * 4, P["3"], 16 - i * 4, 1);
      }
    }
  }

  function drawDesk(ctx, x, y) {
    px(ctx, x + 8, y, P["0"], 16, 12);
    px(ctx, x + 9, y + 1, P["3"], 14, 10);
    px(ctx, x + 11, y + 3, P["2"], 10, 6);
    px(ctx, x + 15, y + 12, P["1"], 2, 4);
    px(ctx, x, y + 16, P["0"], 32, 8);
    px(ctx, x + 1, y + 17, P["3"], 30, 5);
    px(ctx, x + 2, y + 23, P["1"], 3, 1);
    px(ctx, x + 27, y + 23, P["1"], 3, 1);
    px(ctx, x + 10, y + 18, P["0"], 12, 3);
    px(ctx, x + 11, y + 19, P["2"], 10, 1);
  }

  function drawBookshelf(ctx, x, y) {
    px(ctx, x, y, P["0"], 32, 32);
    px(ctx, x + 1, y + 1, P["1"], 30, 30);
    for (let r = 0; r < 3; r++) px(ctx, x + 2, y + 7 + r * 9, P["3"], 28, 1);
    const book = [P["3"], P["4"], P["2"]];
    for (let i = 0; i < 8; i++) {
      px(ctx, x + 3 + i * 3, y + 2 + (i % 3) * 9, book[i % 3], 2, 5);
    }
  }

  function drawTable(ctx, x, y) {
    px(ctx, x, y + 4, P["0"], 32, 6);
    px(ctx, x + 1, y + 5, P["3"], 30, 4);
    px(ctx, x + 3, y + 10, P["0"], 3, 6);
    px(ctx, x + 26, y + 10, P["0"], 3, 6);
  }

  function drawPlant(ctx, x, y) {
    px(ctx, x + 5, y + 9, P["0"], 6, 6);
    px(ctx, x + 6, y + 10, P["1"], 4, 4);
    px(ctx, x + 7, y + 2, P["2"], 2, 8);
    px(ctx, x + 4, y + 3, P["1"], 8, 4);
    px(ctx, x + 5, y + 4, P["2"], 6, 2);
  }

  /* ───────────────────────── themed interior props ───────────────────────── */

  function drawBed(ctx, x, y) {
    px(ctx, x, y, P["0"], 32, 32);
    px(ctx, x + 1, y + 1, P["1"], 30, 30);
    px(ctx, x + 3, y + 3, P["3"], 26, 12);
    px(ctx, x + 4, y + 4, P["4"], 10, 8);
    px(ctx, x + 3, y + 16, P["2"], 26, 12);
    px(ctx, x + 4, y + 17, P["3"], 24, 1);
    px(ctx, x + 4, y + 26, P["3"], 24, 1);
    px(ctx, x + 1, y + 30, P["1"], 30, 1);
  }

  function drawCabinet(ctx, x, y) {
    px(ctx, x, y, P["0"], 32, 32);
    px(ctx, x + 1, y + 1, P["1"], 30, 30);
    px(ctx, x + 3, y + 3, P["3"], 12, 26);
    px(ctx, x + 17, y + 3, P["3"], 12, 26);
    px(ctx, x + 3, y + 16, P["2"], 12, 1);
    px(ctx, x + 17, y + 16, P["2"], 12, 1);
    px(ctx, x + 8, y + 14, P["2"], 2, 2);
    px(ctx, x + 22, y + 14, P["2"], 2, 2);
  }

  function drawTV(ctx, x, y) {
    px(ctx, x, y + 6, P["0"], 32, 26);
    px(ctx, x + 2, y + 8, P["1"], 28, 22);
    px(ctx, x + 4, y + 10, P["2"], 24, 14);
    px(ctx, x + 6, y + 12, P["3"], 20, 1);
    px(ctx, x + 6, y + 16, P["3"], 14, 1);
    px(ctx, x + 12, y + 28, P["1"], 8, 4);
  }

  function drawServer(ctx, x, y, time) {
    px(ctx, x, y, P["0"], 32, 32);
    px(ctx, x + 1, y + 1, P["1"], 30, 30);

    for (let r = 0; r < 4; r++) {
      const yy = y + 4 + r * 7;
      px(ctx, x + 4, yy, P["3"], 18, 4);
      px(ctx, x + 6, yy + 1, P["2"], 14, 1);
      px(ctx, x + 23, yy, P["2"], 3, 2);
      px(ctx, x + 23, yy + 2, P["4"], 3, 2);
    }

    const on = Math.floor((time || 0) * 2) % 2;
    px(ctx, x + 24, y + 5, P[on ? "4" : "2"], 2, 2);
    px(ctx, x + 24, y + 19, P[on ? "2" : "4"], 2, 2);
    px(ctx, x + 24, y + 26, P["3"], 2, 2);
  }

  function drawConsole(ctx, x, y) {
    px(ctx, x, y, P["0"], 32, 24);
    px(ctx, x + 1, y + 1, P["3"], 30, 22);
    px(ctx, x + 3, y + 3, P["1"], 14, 10);
    px(ctx, x + 4, y + 4, P["2"], 12, 8);
    px(ctx, x + 5, y + 5, P["4"], 10, 1);
    px(ctx, x + 5, y + 7, P["4"], 7, 1);
    px(ctx, x + 19, y + 6, P["2"], 8, 8);
    px(ctx, x + 20, y + 8, P["4"], 6, 1);
    px(ctx, x + 20, y + 10, P["4"], 4, 1);
    px(ctx, x + 3, y + 16, P["0"], 26, 4);
    px(ctx, x + 4, y + 17, P["2"], 24, 2);
  }

  function drawCrate(ctx, x, y) {
    px(ctx, x, y, P["0"], 16, 16);
    px(ctx, x + 1, y + 1, P["1"], 14, 14);
    px(ctx, x + 3, y + 3, P["3"], 10, 1);
    px(ctx, x + 3, y + 12, P["3"], 10, 1);
    px(ctx, x + 3, y + 3, P["3"], 1, 10);
    px(ctx, x + 12, y + 3, P["3"], 1, 10);
    px(ctx, x + 6, y + 6, P["2"], 4, 4);
  }

  function drawSofa(ctx, x, y) {
    px(ctx, x, y + 6, P["0"], 48, 26);
    px(ctx, x + 1, y + 7, P["1"], 46, 24);
    px(ctx, x + 3, y + 3, P["2"], 42, 14);
    px(ctx, x + 4, y + 4, P["3"], 40, 2);
    px(ctx, x + 3, y + 18, P["2"], 20, 10);
    px(ctx, x + 25, y + 18, P["2"], 20, 10);
    px(ctx, x + 4, y + 19, P["3"], 18, 1);
    px(ctx, x + 26, y + 19, P["3"], 18, 1);
    px(ctx, x + 1, y + 10, P["1"], 4, 18);
    px(ctx, x + 43, y + 10, P["1"], 4, 18);
    px(ctx, x + 1, y + 28, P["0"], 46, 2);
  }

  function drawSkateboard(ctx, x, y) {
    px(ctx, x + 6, y + 2, P["0"], 4, 26);
    px(ctx, x + 7, y + 3, P["2"], 2, 24);
    px(ctx, x + 4, y + 1, P["0"], 8, 3);
    px(ctx, x + 4, y + 27, P["0"], 8, 3);
    px(ctx, x + 5, y + 6, P["1"], 6, 3);
    px(ctx, x + 5, y + 23, P["1"], 6, 3);
    px(ctx, x + 3, y + 8, P["3"], 3, 3);
    px(ctx, x + 10, y + 8, P["3"], 3, 3);
    px(ctx, x + 3, y + 21, P["3"], 3, 3);
    px(ctx, x + 10, y + 21, P["3"], 3, 3);
  }

  function drawGlobe(ctx, x, y) {
    px(ctx, x + 3, y + 2, P["0"], 10, 9);
    px(ctx, x + 4, y + 3, P["2"], 8, 7);
    px(ctx, x + 5, y + 4, P["3"], 2, 5);
    px(ctx, x + 7, y + 3, P["3"], 1, 7);
    px(ctx, x + 9, y + 5, P["3"], 2, 3);
    px(ctx, x + 7, y + 11, P["0"], 2, 3);
    px(ctx, x + 5, y + 14, P["0"], 6, 2);
  }

  function drawLongTable(ctx, x, y, w) {
    px(ctx, x, y + 4, P["0"], w, 6);
    px(ctx, x + 1, y + 5, P["3"], w - 2, 4);
    px(ctx, x + 3, y + 10, P["0"], 3, 6);
    px(ctx, x + w - 6, y + 10, P["0"], 3, 6);
  }

  function drawBanner(ctx, x, y) {
    px(ctx, x, y, P["0"], 24, 24);
    px(ctx, x + 1, y + 1, P["2"], 22, 22);
    px(ctx, x + 3, y + 3, P["4"], 18, 1);
    px(ctx, x + 6, y + 9, P["4"], 2, 2);
    px(ctx, x + 8, y + 11, P["4"], 6, 2);
    px(ctx, x + 14, y + 9, P["4"], 2, 2);
    px(ctx, x + 2, y + 21, P["3"], 4, 2);
    px(ctx, x + 10, y + 21, P["3"], 4, 2);
  }

  function drawChalkboard(ctx, x, y, w, h) {
    px(ctx, x, y, P["0"], w, h);
    px(ctx, x + 2, y + 2, P["1"], w - 4, h - 4);
    px(ctx, x + 6, y + 6, P["3"], w - 24, 1);
    px(ctx, x + 6, y + 10, P["3"], w - 34, 1);
    px(ctx, x + 6, y + 14, P["3"], w - 18, 1);
    px(ctx, x + w - 18, y + 6, P["3"], 2, 2);
    px(ctx, x + w - 14, y + 10, P["3"], 6, 1);
  }

  function drawWhiteboard(ctx, x, y, w, h) {
    px(ctx, x, y, P["0"], w, h);
    px(ctx, x + 2, y + 2, P["4"], w - 4, h - 4);
    px(ctx, x + 6, y + 6, P["2"], w - 20, 1);
    px(ctx, x + 6, y + 10, P["2"], w - 32, 1);
    px(ctx, x + w - 18, y + 6, P["2"], 2, 2);
    px(ctx, x + w - 14, y + 10, P["2"], 6, 1);
  }

  function drawPoster(ctx, x, y) {
    px(ctx, x, y, P["0"], 32, 24);
    px(ctx, x + 1, y + 1, P["3"], 30, 22);
    px(ctx, x + 4, y + 4, P["2"], 24, 2);
    px(ctx, x + 4, y + 8, P["2"], 16, 2);
    px(ctx, x + 10, y + 13, P["1"], 12, 7);
    px(ctx, x + 13, y + 15, P["4"], 2, 2);
    px(ctx, x + 18, y + 15, P["4"], 2, 2);
  }

  function drawInteriorWallArt(ctx, theme) {
    if (theme === "home") {
      drawWindow(ctx, 2 * T, 8);
      drawWindow(ctx, 6 * T, 8);
    } else if (theme === "guild") {
      drawBanner(ctx, 2 * T, 4);
      drawBanner(ctx, 104, 4);
    } else if (theme === "study") {
      drawChalkboard(ctx, 2 * T, 6, 96, 20);
    } else if (theme === "lab") {
      drawWhiteboard(ctx, 2 * T, 6, 96, 20);
    } else if (theme === "lounge") {
      drawPoster(ctx, 40, 6);
      drawWindow(ctx, 6 * T, 8);
    }
  }

  function drawInteriorProp(ctx, type, x, y, w, h, time) {
    if (type === "desk") drawDesk(ctx, x, y);
    else if (type === "shelf") drawBookshelf(ctx, x, y);
    else if (type === "table") drawTable(ctx, x, y);
    else if (type === "longtable") drawLongTable(ctx, x, y, w);
    else if (type === "plant") drawPlant(ctx, x, y);
    else if (type === "bed") drawBed(ctx, x, y);
    else if (type === "cabinet") drawCabinet(ctx, x, y);
    else if (type === "tv") drawTV(ctx, x, y);
    else if (type === "server") drawServer(ctx, x, y, time);
    else if (type === "console") drawConsole(ctx, x, y);
    else if (type === "crate") drawCrate(ctx, x, y);
    else if (type === "sofa") drawSofa(ctx, x, y);
    else if (type === "skateboard") drawSkateboard(ctx, x, y);
    else if (type === "globe") drawGlobe(ctx, x, y);
  }

  function drawAvatar(canvas, kind) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 16, 16);
    const pal = kind ? Object.assign({}, P, NPC_PALETTES[kind] || {}) : P;
    drawSprite(ctx, PLAYER.down[0], 0, 0, false, pal);
  }

  return {
    P, T, PLAYER,
    drawGrass, drawPath, drawFlower, drawWater, drawDirt,
    drawTree, drawFence, drawSign, drawTombstone,
    drawBuilding, drawPlayer, drawNpc, drawScooterGirl,
    drawInteriorFloor, drawInteriorWall, drawInteriorDoor,
    drawInteriorWallArt, drawInteriorProp,
    drawRug, drawDesk, drawBookshelf, drawTable, drawPlant,
    drawWindow, drawAvatar
  };
})();
