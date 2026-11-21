// Drawn-Frame VR art set.
// Every drawing is made by code from the same palette and line rules, so the
// style stays identical across scenery, props and every character pose.
// Each function returns a <canvas>; the scene turns them into textures.

export const INK = '#2a1c18';
export const PAL = {
  skyTop: '#2f6fd0', skyMid: '#7ab8ee', skyLow: '#cfe6f7', horizon: '#fdf1dc',
  cloud: '#ffffff', cloudShade: '#c9d4f2', cloudWarm: '#fff4e6',
  mtnFar: '#a9b9e0', mtnMid: '#8ea6d6', mtnShade: '#7a8fc4', hillFar: '#86b48a',
  grass: '#7dc067', grassShade: '#5a9d4f', grassLight: '#a7da7c',
  leaf: '#4f9b4c', leafShade: '#367a3c', leafLight: '#7cc463', bark: '#8b5a3c', barkShade: '#6b412b',
  wall: '#f6ead2', wallShade: '#dcc9a6', timber: '#7a4e34', roof: '#d0624c', roofShade: '#a8473a', roofBlue: '#4d6fae', roofBlueShade: '#3a5590',
  window: '#a7dcf5', stone: '#c8c1b4', stoneShade: '#a39b8d', path: '#e3cc9a', pathShade: '#c9ae78',
  skin: '#ffe3cf', skinShade: '#f3bfa3', blush: '#f7a8a0',
  hair: '#6b3f2a', hairShade: '#4b2a1c', hairLight: '#9a6244',
  eye: '#c77a1e', eyeDark: '#5a2c0c',
  coat: '#f7f7fb', coatShade: '#c9cde0', navy: '#2d3a6b', navyShade: '#1f2a52', gold: '#e2b84a',
  belt: '#7a4a2c', boot: '#4a3226', blade: '#dfe8f2',
  flowerA: '#ffd84d', flowerB: '#ffffff', flowerC: '#f48fb1',
};

// ---------- helpers ----------
export function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
export function rng(seed) { let a = seed | 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function ink(x, w = 5) { x.lineWidth = w; x.strokeStyle = INK; x.lineJoin = 'round'; x.lineCap = 'round'; x.stroke(); }
function fill(x, c) { x.fillStyle = c; x.fill(); }
function shape(x, c, w = 5) { fill(x, c); if (w) ink(x, w); }
function circ(x, cx, cy, r) { x.moveTo(cx + r, cy); x.arc(cx, cy, r, 0, Math.PI * 2); }
function poly(x, pts) { x.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]); x.closePath(); }
// cel shadow: draw `c` only inside the current path's area, offset by (dx, dy)
function celShade(x, pathFn, c, dx, dy) {
  // Shade = the part of the shape NOT covered by a copy of itself shifted toward
  // the light. Uses the fill colour that was just applied as the lit colour.
  const lit = x.fillStyle;
  x.save(); x.beginPath(); pathFn(); x.clip();
  x.fillStyle = c; x.fillRect(-4000, -4000, 12000, 12000);
  x.translate(-dx, -dy); x.beginPath(); pathFn(); x.fillStyle = lit; x.fill();
  x.restore();
}

// ---------- far layer ----------
export function sky() {
  const c = canvas(4096, 2048), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 1024);
  g.addColorStop(0, PAL.skyTop); g.addColorStop(0.55, PAL.skyMid); g.addColorStop(0.88, PAL.skyLow); g.addColorStop(1, PAL.horizon);
  x.fillStyle = g; x.fillRect(0, 0, 4096, 1024);
  x.fillStyle = PAL.horizon; x.fillRect(0, 1024, 4096, 1024);
  // big anime cumulus: white tops, cool flat shadow underneath, no outline
  const r = rng(21);
  const cloud = (cx, cy, s) => {
    const puffs = [];
    for (let k = 0; k < 9; k++) puffs.push([cx + (k - 4) * s * 0.55 + (r() - 0.5) * s * 0.3, cy - Math.sin(k / 8 * Math.PI) * s * (0.6 + r() * 0.5), s * (0.45 + r() * 0.35)]);
    const path = () => { for (const [px, py, pr] of puffs) circ(x, px, py, pr); x.rect(cx - s * 2.6, cy - 2, s * 5.2, s * 0.35); };
    x.beginPath(); path(); fill(x, PAL.cloud);
    celShade(x, path, PAL.cloudShade, -s * 0.12, -s * 0.28);
    x.save(); x.beginPath(); path(); x.clip(); x.fillStyle = PAL.cloudWarm; x.globalAlpha = 0.7; x.fillRect(cx - s * 3, cy - s * 2, s * 6, s * 0.9); x.restore();
  };
  for (let i = 0; i < 7; i++) cloud(i * 600 + 250 + r() * 200, 420 + r() * 120, 34 + r() * 20);
  for (let i = 0; i < 9; i++) cloud(i * 470 + r() * 200, 640 + r() * 120, 80 + r() * 50);
  // a few thin high streaks
  x.globalAlpha = 0.5; x.fillStyle = '#ffffff';
  for (let i = 0; i < 10; i++) { x.beginPath(); x.ellipse(r() * 4096, 260 + r() * 200, 140 + r() * 160, 6 + r() * 6, 0, 0, Math.PI * 2); x.fill(); }
  x.globalAlpha = 1;
  return c;
}

export function mountains() {
  const W = 8192, c = canvas(W, 768), x = c.getContext('2d');
  const ridge = (base, amp, k, col, shade, seed) => {
    // whole numbers of waves around the circle so the ring has no seam
    const pts = [];
    for (let px = 0; px <= W; px += 24) { const th = px / W * Math.PI * 2; pts.push(px, base - amp * (0.55 + 0.45 * Math.sin(th * k + seed) * Math.cos(th * (k * 2 - 1) + seed * 2)) - 8 * Math.sin(th * k * 9)); }
    const path = () => { x.moveTo(0, 768); for (let i = 0; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]); x.lineTo(W, 768); x.closePath(); };
    x.beginPath(); path(); fill(x, col);
    if (shade) celShade(x, path, shade, 26, 18);
    x.beginPath(); for (let i = 0; i < pts.length; i += 2) (i ? x.lineTo : x.moveTo).call(x, pts[i], pts[i + 1]); x.lineWidth = 3; x.strokeStyle = 'rgba(42,28,24,.35)'; x.stroke();
    return pts;
  };
  const far = ridge(420, 330, 5, PAL.mtnFar, null, 1);
  // snow caps on the far range
  x.fillStyle = '#f4f7ff';
  for (let i = 2; i < far.length - 2; i += 2) if (far[i + 1] < 170) { x.beginPath(); x.moveTo(far[i - 2], far[i - 1] + 22); x.lineTo(far[i], far[i + 1]); x.lineTo(far[i + 2], far[i + 3] + 22); x.closePath(); x.fill(); }
  ridge(560, 220, 7, PAL.mtnMid, PAL.mtnShade, 3);
  // distant castle on a hill (generic fantasy keep)
  const cx = 6000, base = 560;
  x.beginPath(); x.ellipse(cx, base + 40, 260, 90, 0, Math.PI, 0); fill(x, PAL.hillFar);
  const tower = (tx, w, h, roofH) => { x.beginPath(); x.rect(tx - w / 2, base - h, w, h); shape(x, '#e9e3f2', 2.5); x.beginPath(); poly(x, [tx - w / 2 - 4, base - h, tx, base - h - roofH, tx + w / 2 + 4, base - h]); shape(x, PAL.roofBlue, 2.5); };
  x.beginPath(); x.rect(cx - 120, base - 70, 240, 70); shape(x, '#e9e3f2', 2.5);
  tower(cx - 110, 34, 120, 50); tower(cx + 110, 34, 110, 46); tower(cx - 40, 40, 160, 70); tower(cx + 40, 30, 135, 56); tower(cx, 48, 200, 90);
  x.fillStyle = '#4b5a8a'; for (const wx of [cx - 40, cx, cx + 40]) { x.fillRect(wx - 4, base - 120, 8, 14); }
  ridge(700, 120, 9, PAL.hillFar, '#6f9f76', 5);
  return c;
}

// ---------- middle layer ----------
export function tree(seed = 1) {
  const c = canvas(640, 900), x = c.getContext('2d');
  const r = rng(seed);
  const trunk = () => poly(x, [292, 890, 300, 560, 268, 470, 290, 465, 318, 540, 352, 470, 372, 478, 334, 580, 344, 890]);
  x.beginPath(); trunk(); fill(x, PAL.bark); celShade(x, trunk, PAL.barkShade, 18, 0); x.beginPath(); trunk(); ink(x, 6);
  const clumps = [];
  for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2; clumps.push([320 + Math.cos(a) * 170 * (0.7 + r() * 0.4), 330 + Math.sin(a) * 140 * (0.7 + r() * 0.4), 90 + r() * 50]); }
  clumps.push([320, 300, 160], [320, 200, 120]);
  const path = () => { for (const [px, py, pr] of clumps) circ(x, px, py, pr); };
  x.beginPath(); path(); ink(x, 12); fill(x, PAL.leaf);
  celShade(x, path, PAL.leafShade, 34, 46);
  // highlight clumps top-left
  x.save(); x.beginPath(); path(); x.clip(); x.fillStyle = PAL.leafLight;
  for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse(220 + r() * 160, 150 + r() * 160, 40 + r() * 20, 26 + r() * 10, -0.5, 0, Math.PI * 2); x.fill(); }
  x.restore();
  return c;
}

export function house(variant = 0) {
  const c = canvas(900, 900), x = c.getContext('2d');
  const blue = variant % 2 === 1;
  const roof = blue ? PAL.roofBlue : PAL.roof, roofS = blue ? PAL.roofBlueShade : PAL.roofShade;
  // chimney
  x.beginPath(); x.rect(600, 140, 60, 150); shape(x, PAL.stone, 5);
  // walls
  const wall = () => x.rect(150, 380, 600, 500);
  x.beginPath(); wall(); fill(x, PAL.wall); celShade(x, wall, PAL.wallShade, 120, 0); x.beginPath(); wall(); ink(x, 6);
  // timber frame
  x.beginPath(); for (const tx of [150, 350, 550, 750]) { x.moveTo(tx, 380); x.lineTo(tx, 880); } x.moveTo(150, 600); x.lineTo(750, 600); x.moveTo(150, 380); x.lineTo(350, 600); x.moveTo(750, 380); x.lineTo(550, 600);
  x.lineWidth = 16; x.strokeStyle = PAL.timber; x.stroke(); x.lineWidth = 3; x.strokeStyle = INK; x.stroke();
  // roof
  const rf = () => poly(x, [90, 400, 450, 90, 810, 400]);
  x.beginPath(); rf(); fill(x, roof); celShade(x, rf, roofS, 90, 0);
  x.save(); x.beginPath(); rf(); x.clip(); x.strokeStyle = roofS; x.lineWidth = 4; for (let y = 150; y < 400; y += 40) { x.beginPath(); x.moveTo(0, y); x.lineTo(900, y); x.stroke(); } x.restore();
  x.beginPath(); rf(); ink(x, 6);
  // door + windows
  x.beginPath(); x.moveTo(400, 880); x.lineTo(400, 700); x.arc(450, 700, 50, Math.PI, 0); x.lineTo(500, 880); x.closePath(); shape(x, PAL.timber, 5);
  for (const [wx, wy] of [[205, 440], [605, 440], [205, 680], [605, 680]]) {
    x.beginPath(); x.rect(wx, wy, 90, 100); shape(x, PAL.window, 5);
    x.beginPath(); x.moveTo(wx + 45, wy); x.lineTo(wx + 45, wy + 100); x.moveTo(wx, wy + 50); x.lineTo(wx + 90, wy + 50); ink(x, 4);
    x.beginPath(); poly(x, [wx + 10, wy + 40, wx + 30, wy + 8, wx + 40, wy + 8, wx + 20, wy + 40]); fill(x, '#ffffff');
    x.beginPath(); x.rect(wx - 6, wy + 100, 102, 18); shape(x, '#d86a8a', 4); // flower box
  }
  return c;
}

export function tower() {
  const c = canvas(500, 1100), x = c.getContext('2d');
  const body = () => x.rect(120, 330, 260, 760);
  x.beginPath(); body(); fill(x, PAL.stone); celShade(x, body, PAL.stoneShade, 80, 0);
  x.save(); x.beginPath(); body(); x.clip(); x.strokeStyle = PAL.stoneShade; x.lineWidth = 3;
  for (let y = 360; y < 1090; y += 50) { x.beginPath(); x.moveTo(120, y); x.lineTo(380, y); x.stroke(); for (let bx = 120 + ((y / 50) % 2) * 40; bx < 380; bx += 80) { x.beginPath(); x.moveTo(bx, y); x.lineTo(bx, y + 50); x.stroke(); } }
  x.restore(); x.beginPath(); body(); ink(x, 6);
  x.beginPath(); poly(x, [90, 340, 250, 40, 410, 340]); fill(x, PAL.roofBlue); celShade(x, () => poly(x, [90, 340, 250, 40, 410, 340]), PAL.roofBlueShade, 70, 0); x.beginPath(); poly(x, [90, 340, 250, 40, 410, 340]); ink(x, 6);
  x.beginPath(); x.moveTo(250, 40); x.lineTo(250, 0); ink(x, 5); x.beginPath(); poly(x, [250, 2, 300, 14, 250, 26]); shape(x, PAL.gold, 3);
  x.beginPath(); circ(x, 250, 480, 56); shape(x, '#fbf6ea', 6); x.beginPath(); x.moveTo(250, 480); x.lineTo(250, 445); x.moveTo(250, 480); x.lineTo(276, 492); ink(x, 5);
  x.beginPath(); x.moveTo(215, 1090); x.lineTo(215, 900); x.arc(250, 900, 35, Math.PI, 0); x.lineTo(285, 1090); x.closePath(); shape(x, PAL.timber, 5);
  return c;
}

// ---------- near layer ----------
export function grass(seed = 11) {
  const c = canvas(640, 320), x = c.getContext('2d');
  const r = rng(seed);
  for (let i = 0; i < 34; i++) {
    const bx = 30 + r() * 580, h = 110 + r() * 170, lean = (r() - 0.5) * 90, w = 10 + r() * 6;
    const blade = () => { x.moveTo(bx - w, 320); x.quadraticCurveTo(bx + lean * 0.3, 320 - h * 0.6, bx + lean, 320 - h); x.quadraticCurveTo(bx + lean * 0.3 + w * 0.6, 320 - h * 0.5, bx + w, 320); x.closePath(); };
    x.beginPath(); blade(); fill(x, i % 4 ? PAL.grass : PAL.grassLight); celShade(x, blade, PAL.grassShade, w * 0.9, 0); x.beginPath(); blade(); ink(x, 3.5);
  }
  // wildflowers
  for (let i = 0; i < 5; i++) {
    const fx = 60 + r() * 520, fy = 120 + r() * 120, col = [PAL.flowerA, PAL.flowerB, PAL.flowerC][i % 3];
    x.beginPath(); x.moveTo(fx, fy); x.lineTo(fx + (r() - 0.5) * 20, 320); x.lineWidth = 4; x.strokeStyle = PAL.grassShade; x.stroke();
    x.beginPath(); for (let p = 0; p < 5; p++) { const a = p / 5 * Math.PI * 2; circ(x, fx + Math.cos(a) * 11, fy + Math.sin(a) * 11, 9); } shape(x, col, 3);
    x.beginPath(); circ(x, fx, fy, 6); shape(x, '#f2a03a', 2.5);
  }
  return c;
}

export function fence() {
  const c = canvas(1400, 360), x = c.getContext('2d');
  const stoneRow = (y, h) => { x.beginPath(); x.rect(0, y, 1400, h); fill(x, PAL.stone); celShade(x, () => x.rect(0, y, 1400, h), PAL.stoneShade, 0, h * 0.55); x.beginPath(); x.rect(0, y, 1400, h); ink(x, 5); };
  for (let px = 40; px < 1400; px += 260) {
    const post = () => x.rect(px, 60, 70, 300);
    x.beginPath(); post(); fill(x, PAL.stone); celShade(x, post, PAL.stoneShade, 30, 0); x.beginPath(); post(); ink(x, 6);
    x.beginPath(); x.rect(px - 10, 40, 90, 30); shape(x, '#ddd6c9', 5);
  }
  stoneRow(110, 44); stoneRow(210, 40);
  // ivy
  const r = rng(9); x.fillStyle = PAL.leaf;
  for (let i = 0; i < 26; i++) { const lx = r() * 1400, ly = 100 + r() * 160; x.beginPath(); x.ellipse(lx, ly, 14, 9, r() * 3, 0, Math.PI * 2); shape(x, i % 3 ? PAL.leaf : PAL.leafLight, 2.5); }
  return c;
}

export function ground() {
  const c = canvas(1024, 1024), x = c.getContext('2d');
  x.fillStyle = PAL.grass; x.fillRect(0, 0, 1024, 1024);
  const r = rng(5);
  for (let i = 0; i < 40; i++) { x.beginPath(); x.ellipse(r() * 1024, r() * 1024, 60 + r() * 90, 30 + r() * 40, r() * 3, 0, Math.PI * 2); x.fillStyle = i % 2 ? PAL.grassShade : PAL.grassLight; x.globalAlpha = 0.35; x.fill(); }
  x.globalAlpha = 1;
  for (let i = 0; i < 420; i++) { const px = r() * 1024, py = r() * 1024; x.beginPath(); x.moveTo(px, py); x.lineTo(px + 5, py - 13); x.moveTo(px + 8, py); x.lineTo(px + 13, py - 9); x.lineWidth = 3; x.strokeStyle = PAL.grassShade; x.stroke(); }
  return c;
}

export function pathTexture() {
  const c = canvas(256, 1024), x = c.getContext('2d');
  x.fillStyle = PAL.path; x.fillRect(0, 0, 256, 1024);
  const r = rng(13);
  for (let i = 0; i < 60; i++) { x.beginPath(); x.ellipse(r() * 256, r() * 1024, 10 + r() * 16, 7 + r() * 10, 0, 0, Math.PI * 2); shape(x, i % 2 ? PAL.pathShade : '#efdcb0', 2.5); }
  return c;
}

// ---------- character ----------
// An original adventurer. One drawing function with pose parameters, so every
// pose, expression and in-between frame is drawn with identical linework.
//   look:   {x, y} in -1..1, where the eyes point
//   mouth:  'smile' | 'open' | 'flat' | 'o'
//   brows:  'soft' | 'up' | 'worried'
//   arm:    0 (at side) .. 1 (raised in a wave), wave phase in armWave
//   flinch: 0..1 leans back with raised hands
//   blink:  0..1
export const DEFAULT_POSE = { look: { x: 0, y: 0 }, mouth: 'smile', brows: 'soft', arm: 0, armWave: 0, flinch: 0, blink: 0, blush: 0.4, hairSway: 0 };

export function character(c, pose = {}) {
  const p = { ...DEFAULT_POSE, ...pose, look: { ...DEFAULT_POSE.look, ...(pose.look || {}) } };
  if (!c) c = canvas(640, 1280);
  const x = c.getContext('2d');
  x.clearRect(0, 0, c.width, c.height);
  x.save(); x.scale(c.width / 640, c.height / 1280);
  const lean = p.flinch * 0.08;
  // lean whole upper body around the hips
  const hipX = 320, hipY = 760;

  // legs + boots
  for (const s of [-1, 1]) {
    const lx = 320 + s * 42;
    const leg = () => poly(x, [lx - 30, 760, lx + 28, 760, lx + 22, 1080, lx - 22, 1080]);
    x.beginPath(); leg(); fill(x, PAL.navy); celShade(x, leg, PAL.navyShade, s * 14, 0); x.beginPath(); leg(); ink(x);
    const boot = () => { x.moveTo(lx - 30, 1040); x.lineTo(lx + 28, 1040); x.lineTo(lx + 30, 1220); x.quadraticCurveTo(lx + 30 + s * 40, 1230, lx + s * 50, 1262); x.lineTo(lx - 36, 1262); x.closePath(); };
    x.beginPath(); boot(); fill(x, PAL.boot); celShade(x, boot, '#33221a', s * 12, 0); x.beginPath(); boot(); ink(x);
    x.beginPath(); x.rect(lx - 32, 1040, 62, 22); shape(x, PAL.gold, 4);
  }

  x.save(); x.translate(hipX, hipY); x.rotate(-lean); x.translate(-hipX, -hipY);

  // coat tails (behind)
  const tails = () => { x.moveTo(230, 640); x.lineTo(190, 960); x.quadraticCurveTo(320, 930, 450, 960); x.lineTo(410, 640); x.closePath(); };
  x.beginPath(); tails(); fill(x, PAL.coat); celShade(x, tails, PAL.coatShade, 0, -60); x.beginPath(); tails(); ink(x);
  x.beginPath(); x.moveTo(195, 945); x.quadraticCurveTo(320, 915, 445, 945); x.lineWidth = 14; x.strokeStyle = PAL.navy; x.stroke();

  // back arm (left side of image = character's right) and sword
  const sword = () => poly(x, [430, 700, 448, 700, 470, 940, 452, 944]);
  x.beginPath(); sword(); shape(x, '#5b4636', 4);
  x.beginPath(); x.rect(416, 690, 46, 14); shape(x, PAL.gold, 4);

  // torso
  const torso = () => { x.moveTo(236, 470); x.quadraticCurveTo(320, 440, 404, 470); x.lineTo(416, 770); x.quadraticCurveTo(320, 790, 224, 770); x.closePath(); };
  x.beginPath(); torso(); fill(x, PAL.coat); celShade(x, torso, PAL.coatShade, 56, 0); x.beginPath(); torso(); ink(x);
  // inner shirt + trim
  x.beginPath(); poly(x, [290, 470, 350, 470, 336, 760, 304, 760]); shape(x, PAL.navy, 4);
  x.beginPath(); x.moveTo(290, 470); x.lineTo(304, 760); x.moveTo(350, 470); x.lineTo(336, 760); x.lineWidth = 8; x.strokeStyle = PAL.gold; x.stroke();
  // belt
  x.beginPath(); x.rect(224, 700, 192, 34); shape(x, PAL.belt, 5);
  x.beginPath(); x.rect(302, 696, 36, 42); shape(x, PAL.gold, 4);

  // arms
  const drawArm = (side, raise, wave) => {
    const sx = side < 0 ? 242 : 398, sy = 490;
    // raise rotates the arm up and out; flinch pulls hands up in front
    const base = side < 0 ? 0.12 : -0.12;
    const ang = base - side * (raise * 2.6) + side * Math.sin(wave) * 0.25 * raise - side * p.flinch * 0.5;
    const elbowBend = -side * raise * 0.5 + side * p.flinch * 2.0;
    x.save(); x.translate(sx, sy); x.rotate(ang);
    const upper = () => { x.moveTo(-28, 0); x.lineTo(28, 0); x.lineTo(24, 150); x.lineTo(-24, 150); x.closePath(); };
    x.beginPath(); upper(); fill(x, PAL.coat); celShade(x, upper, PAL.coatShade, side * 12, 0); x.beginPath(); upper(); ink(x);
    x.translate(0, 150); x.rotate(elbowBend);
    const fore = () => { x.moveTo(-24, 0); x.lineTo(24, 0); x.lineTo(20, 130); x.lineTo(-20, 130); x.closePath(); };
    x.beginPath(); fore(); fill(x, PAL.coat); celShade(x, fore, PAL.coatShade, side * 10, 0); x.beginPath(); fore(); ink(x);
    x.beginPath(); x.rect(-24, 112, 48, 20); shape(x, PAL.navy, 4);
    x.beginPath(); x.ellipse(0, 158, 24, 30, 0, 0, Math.PI * 2); shape(x, PAL.skin);
    x.beginPath(); x.ellipse(-side * 22, 148, 9, 16, side * 0.5, 0, Math.PI * 2); shape(x, PAL.skin, 4); // thumb
    x.restore();
  };
  drawArm(-1, 0, 0);
  drawArm(1, p.arm, p.armWave);

  // neck
  x.beginPath(); x.rect(296, 400, 48, 80); fill(x, PAL.skin); celShade(x, () => x.rect(296, 400, 48, 80), PAL.skinShade, 0, -50); x.beginPath(); x.rect(296, 400, 48, 80); ink(x);
  // collar
  x.beginPath(); poly(x, [250, 470, 296, 440, 320, 500, 344, 440, 390, 470, 360, 520, 320, 500, 280, 520]); shape(x, PAL.navy, 5);

  // head (tilts with flinch and slightly with look)
  const hx = 320, hy = 300;
  x.save(); x.translate(hx, hy + 80); x.rotate(-p.flinch * 0.12 + p.look.x * 0.05); x.translate(-hx, -(hy + 80));
  const sway = p.hairSway * 10;
  // back hair
  const backHair = () => { x.moveTo(190, 260); x.quadraticCurveTo(170, 430, 200 + sway, 470); x.lineTo(440 + sway, 470); x.quadraticCurveTo(470, 430, 450, 260); x.closePath(); };
  x.beginPath(); backHair(); fill(x, PAL.hairShade); x.beginPath(); backHair(); ink(x);
  // face
  const face = () => { x.moveTo(214, 250); x.quadraticCurveTo(212, 360, 262, 410); x.quadraticCurveTo(320, 455, 378, 410); x.quadraticCurveTo(428, 360, 426, 250); x.quadraticCurveTo(320, 150, 214, 250); };
  x.beginPath(); face(); fill(x, PAL.skin); x.beginPath(); face(); ink(x);
  // ears
  for (const s of [-1, 1]) { x.beginPath(); x.ellipse(320 + s * 108, 320, 16, 26, 0, 0, Math.PI * 2); shape(x, PAL.skin, 4); }
  // blush
  if (p.blush > 0) { x.globalAlpha = p.blush; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(320 + s * 68, 362, 26, 11, 0, 0, Math.PI * 2); fill(x, PAL.blush); } x.globalAlpha = 1; x.beginPath(); for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { x.moveTo(320 + s * 58 + k * 10, 356); x.lineTo(320 + s * 52 + k * 10, 368); } x.lineWidth = 2; x.strokeStyle = '#e07a74'; x.stroke(); }

  // eyes (big anime eyes; irises slide with look)
  const eyeY = 315, open = 1 - p.blink;
  for (const s of [-1, 1]) {
    const ex = 320 + s * 52;
    if (open < 0.15) { x.beginPath(); x.moveTo(ex - 30, eyeY + 8); x.quadraticCurveTo(ex, eyeY + 20, ex + 30, eyeY + 8); ink(x, 6); continue; }
    const eh = 46 * open;
    const white = () => x.ellipse(ex, eyeY, 30, eh, 0, 0, Math.PI * 2);
    x.beginPath(); white(); fill(x, '#ffffff');
    x.save(); x.beginPath(); white(); x.clip();
    const ix = ex + p.look.x * 12, iy = eyeY + p.look.y * 12 + 4;
    const g = x.createLinearGradient(0, iy - 34, 0, iy + 34); g.addColorStop(0, PAL.eyeDark); g.addColorStop(0.55, PAL.eye); g.addColorStop(1, '#f3c25a');
    x.beginPath(); x.ellipse(ix, iy, 22, 34, 0, 0, Math.PI * 2); x.fillStyle = g; x.fill(); ink(x, 3);
    x.beginPath(); x.ellipse(ix, iy + 2, 10, 17, 0, 0, Math.PI * 2); fill(x, '#2a1208');
    x.beginPath(); circ(x, ix + 8, iy - 14, 8); circ(x, ix - 9, iy + 14, 4); fill(x, '#ffffff');
    // upper-lid shadow
    x.fillStyle = 'rgba(120,80,90,.25)'; x.fillRect(ex - 40, eyeY - eh - 4, 80, 14);
    x.restore();
    // thick upper lash line
    x.beginPath(); x.ellipse(ex, eyeY, 32, eh + 2, 0, Math.PI * 1.08, Math.PI * 1.92); ink(x, 9);
    x.beginPath(); x.moveTo(ex + s * 30, eyeY - eh * 0.55); x.lineTo(ex + s * 42, eyeY - eh * 0.85); ink(x, 6);
  }
  // brows
  const browTilt = p.brows === 'up' ? -10 : p.brows === 'worried' ? 10 : 0;
  for (const s of [-1, 1]) { const bx = 320 + s * 52; x.beginPath(); x.moveTo(bx - 26 * s, 250 + (p.brows === 'up' ? -10 : 0) - browTilt * 0.5); x.quadraticCurveTo(bx, 240 + (p.brows === 'up' ? -14 : 0), bx + 26 * s, 252 + browTilt); ink(x, 6); }
  // nose
  x.beginPath(); x.moveTo(324, 360); x.lineTo(318, 372); ink(x, 3);
  // mouth
  x.beginPath();
  if (p.mouth === 'smile') { x.moveTo(296, 392); x.quadraticCurveTo(320, 410, 344, 392); ink(x, 4.5); }
  else if (p.mouth === 'flat') { x.moveTo(302, 396); x.lineTo(338, 396); ink(x, 4.5); }
  else if (p.mouth === 'open') { x.moveTo(294, 388); x.quadraticCurveTo(320, 428, 346, 388); x.closePath(); shape(x, '#b3443f', 4.5); x.beginPath(); x.ellipse(320, 406, 12, 6, 0, 0, Math.PI * 2); fill(x, '#f08b86'); }
  else if (p.mouth === 'o') { x.ellipse(320, 398, 11, 15, 0, 0, Math.PI * 2); shape(x, '#b3443f', 4.5); }

  // front hair: spiky anime fringe, cel-shaded
  const fringe = () => {
    x.moveTo(196, 300); x.quadraticCurveTo(180, 150, 320, 128); x.quadraticCurveTo(462, 150, 444, 300);
    x.lineTo(430 + sway, 330); x.lineTo(408, 236); x.lineTo(384 + sway, 300); x.lineTo(360, 214); x.lineTo(338 + sway, 286); x.lineTo(316, 208);
    x.lineTo(290 + sway, 290); x.lineTo(272, 216); x.lineTo(246 + sway, 300); x.lineTo(232, 236); x.lineTo(212 + sway, 340); x.closePath();
  };
  x.beginPath(); fringe(); fill(x, PAL.hair); celShade(x, fringe, PAL.hairShade, 30, 30);
  // shine band
  x.save(); x.beginPath(); fringe(); x.clip(); x.beginPath(); x.ellipse(300, 172, 90, 16, -0.15, 0, Math.PI * 2); fill(x, PAL.hairLight);
  x.beginPath(); for (let k = 0; k < 5; k++) { x.rect(232 + k * 34, 162, 12, 22); } fill(x, PAL.hair); x.restore();
  x.beginPath(); fringe(); ink(x, 6);
  // side lock with a gold clip
  x.beginPath(); x.moveTo(432, 270); x.quadraticCurveTo(452 + sway, 380, 430 + sway, 470); x.lineTo(410 + sway, 440); x.quadraticCurveTo(424, 360, 414, 290); x.closePath(); shape(x, PAL.hair, 5);
  x.beginPath(); x.rect(418, 300, 30, 12); shape(x, PAL.gold, 3);
  x.restore(); // head
  x.restore(); // lean
  x.restore(); // scale
  return c;
}

// named key poses the scene blends between
export const POSES = {
  idle: {},
  look: { mouth: 'flat', blush: 0.2 },
  notice: { mouth: 'o', brows: 'up', blush: 0.3 },
  greet: { mouth: 'open', brows: 'up', arm: 1, armWave: 0.5, blush: 0.5 },
  flinch: { mouth: 'o', brows: 'worried', flinch: 1, blush: 0.6 },
  blink: { blink: 1 },
};
