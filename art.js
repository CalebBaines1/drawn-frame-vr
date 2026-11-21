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
// background lines are softer and thinner than character lines, as in TV anime backgrounds
function ink(x, w = 5) { x.lineWidth = w * 0.7; x.strokeStyle = 'rgba(58,38,34,0.72)'; x.lineJoin = 'round'; x.lineCap = 'round'; x.stroke(); }
export function tint(hex, k) { // k>0 lighter, k<0 darker
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = n >> 8 & 255, b = n & 255;
  const t = k > 0 ? 255 : 0, a = Math.abs(k);
  r = Math.round(r + (t - r) * a); g = Math.round(g + (t - g) * a); b = Math.round(b + (t - b) * a);
  return `rgb(${r},${g},${b})`;
}
// painterly texture: many soft dabs of nearby tones inside a shape, lit from the upper left
function paint(x, pathFn, base, seed, o = {}) {
  const { n = 400, size = 14, spread = 0.12, alpha = 0.22, bounds = [0, 0, x.canvas.width, x.canvas.height], stretch = 1.6 } = o;
  const r = rng(seed);
  x.save(); x.beginPath(); pathFn(); x.clip();
  const [bx, by, bw, bh] = bounds;
  for (let i = 0; i < n; i++) {
    const px = bx + r() * bw, py = by + r() * bh;
    const light = ((bw - (px - bx)) / bw * 0.5 + (bh - (py - by)) / bh * 0.5) - 0.5; // upper-left brighter
    x.globalAlpha = alpha * (0.5 + r());
    x.fillStyle = tint(base, (r() - 0.5) * spread * 2 + light * spread * 1.5);
    x.beginPath(); x.ellipse(px, py, size * (0.5 + r()) * stretch, size * (0.4 + r() * 0.6), -0.6 + (r() - 0.5) * 0.6, 0, Math.PI * 2); x.fill();
  }
  // soft top-left light and bottom-right shadow gradient
  x.globalAlpha = 1;
  const g = x.createLinearGradient(bx, by, bx + bw * 0.6, by + bh);
  g.addColorStop(0, 'rgba(255,246,220,0.18)'); g.addColorStop(0.6, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(60,50,110,0.16)');
  x.fillStyle = g; x.fillRect(bx, by, bw, bh);
  x.restore();
}
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
  // painted cumulus: soft-edged puffs, warm lit tops, cool flat undersides
  const r = rng(21);
  const cloud = (cx, cy, s) => {
    const puffs = [];
    const n = 7 + Math.floor(r() * 6);
    for (let k = 0; k < n; k++) { const u = k / (n - 1); puffs.push([cx + (u - 0.5) * s * 4.2 + (r() - 0.5) * s * 0.4, cy - Math.sin(u * Math.PI) * s * (0.7 + r() * 0.8) - r() * s * 0.3, s * (0.45 + r() * 0.45)]); }
    const path = () => { for (const [px, py, pr] of puffs) circ(x, px, py, pr); x.rect(cx - s * 2.3, cy - s * 0.25, s * 4.6, s * 0.5); };
    // underside shadow first, then lit body clipped above the flat base
    x.save(); x.beginPath(); path(); x.clip();
    const g = x.createLinearGradient(0, cy - s * 1.8, 0, cy + s * 0.3);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.55, '#f6f3fb'); g.addColorStop(0.8, '#c8d2f0'); g.addColorStop(1, '#aab8e4');
    x.fillStyle = g; x.fillRect(cx - s * 4, cy - s * 3, s * 8, s * 4);
    // inner puff shading: each puff gets a cool lower-right crescent
    for (const [px, py, pr] of puffs) { const pg = x.createRadialGradient(px - pr * 0.35, py - pr * 0.4, pr * 0.2, px, py, pr * 1.05); pg.addColorStop(0, 'rgba(255,255,255,0.75)'); pg.addColorStop(0.75, 'rgba(255,255,255,0)'); pg.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = pg; x.beginPath(); circ(x, px, py, pr); x.fill(); }
    // warm rim light on the upper edges
    x.restore();
  };
  for (let i = 0; i < 6; i++) cloud(i * 690 + r() * 300, 860 + r() * 60, 40 + r() * 30);
  for (let i = 0; i < 8; i++) cloud(i * 520 + 200 + r() * 200, 760 + r() * 60, 55 + r() * 35);
  for (let i = 0; i < 5; i++) cloud(i * 820 + 400 + r() * 300, 640 + r() * 60, 36 + r() * 24);
  // a few thin high streaks
  x.globalAlpha = 0.5; x.fillStyle = '#ffffff';
  for (let i = 0; i < 14; i++) { x.beginPath(); x.ellipse(r() * 4096, 430 + r() * 200, 160 + r() * 200, 4 + r() * 5, 0, 0, Math.PI * 2); x.fill(); }
  x.globalAlpha = 1;
  return c;
}

export function mountains() {
  const W = 8192, c = canvas(W, 768), x = c.getContext('2d');
  const ridge = (base, amp, k, col, shade, seed) => {
    // whole numbers of waves around the circle so the ring has no seam
    const pts = [];
    for (let px = -48; px <= W + 48; px += 24) { const th = px / W * Math.PI * 2; pts.push(px, base - amp * (0.55 + 0.45 * Math.sin(th * k + seed) * Math.cos(th * (k * 2 - 1) + seed * 2)) - 8 * Math.sin(th * k * 9)); }
    const path = () => { x.moveTo(-48, 768); for (let i = 0; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]); x.lineTo(W + 48, 768); x.closePath(); };
    x.beginPath(); path(); fill(x, col);
    if (shade) celShade(x, path, shade, 26, 18);
    paint(x, path, col, base, { n: 1600, size: 16, spread: 0.08, alpha: 0.18, stretch: 2.2 });
    // haze: lighter toward the base of each range
    x.save(); x.beginPath(); path(); x.clip(); const hz = x.createLinearGradient(0, base - amp, 0, 768); hz.addColorStop(0, 'rgba(230,238,255,0)'); hz.addColorStop(1, 'rgba(230,238,255,0.55)'); x.fillStyle = hz; x.fillRect(-48, 0, W + 96, 768); x.restore();
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
  // trunk with branches reaching into the crown
  const trunk = () => { poly(x, [290, 890, 298, 600, 250, 420, 268, 412, 312, 540, 330, 380, 350, 384, 340, 560, 392, 440, 410, 450, 352, 610, 348, 890]); };
  x.beginPath(); trunk(); fill(x, PAL.bark); celShade(x, trunk, PAL.barkShade, 16, 0);
  paint(x, trunk, PAL.bark, seed + 3, { n: 120, size: 5, stretch: 0.5, spread: 0.2 }); x.beginPath(); trunk(); ink(x, 5);
  // foliage masses, each a cluster of small leaf clumps
  const masses = [[320, 250, 150], [200, 360, 110], [440, 350, 115], [320, 380, 130], [250, 200, 95], [400, 190, 95]];
  const clumps = [];
  for (const [mx, my, mr] of masses) for (let i = 0; i < 26; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * mr; clumps.push([mx + Math.cos(a) * d, my + Math.sin(a) * d * 0.8, 22 + r() * 22]); }
  const path = () => { for (const [px, py, pr] of clumps) circ(x, px, py, pr); };
  x.beginPath(); path(); ink(x, 9); fill(x, PAL.leafShade);
  // lit side: same clumps shifted toward the light, clipped to the silhouette
  x.save(); x.beginPath(); path(); x.clip();
  x.translate(-26, -30); x.beginPath(); path(); fill(x, PAL.leaf);
  x.translate(-20, -22); x.beginPath(); for (const [px, py, pr] of clumps) if (r() < 0.45) circ(x, px, py, pr * 0.8); fill(x, PAL.leafLight);
  x.restore();
  paint(x, path, PAL.leaf, seed + 9, { n: 700, size: 7, spread: 0.22, alpha: 0.3, stretch: 1.2 });
  // leaf-tip flecks along the lit edge
  x.save(); x.beginPath(); path(); x.clip(); x.fillStyle = '#c4ec8c';
  for (let i = 0; i < 160; i++) { const [px, py, pr] = clumps[Math.floor(r() * clumps.length)]; const a = Math.PI * (1.1 + r() * 0.5); x.beginPath(); x.ellipse(px + Math.cos(a) * pr * 0.8, py + Math.sin(a) * pr * 0.8, 4, 2.5, a, 0, Math.PI * 2); x.fill(); }
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
  x.beginPath(); wall(); fill(x, PAL.wall); celShade(x, wall, PAL.wallShade, 120, 0); paint(x, wall, PAL.wall, 31 + variant, { n: 500, size: 9, spread: 0.08 }); x.beginPath(); wall(); ink(x, 6);
  // timber frame
  x.beginPath(); for (const tx of [150, 350, 550, 750]) { x.moveTo(tx, 380); x.lineTo(tx, 880); } x.moveTo(150, 600); x.lineTo(750, 600); x.moveTo(150, 380); x.lineTo(350, 600); x.moveTo(750, 380); x.lineTo(550, 600);
  x.lineWidth = 16; x.strokeStyle = PAL.timber; x.stroke(); x.lineWidth = 3; x.strokeStyle = INK; x.stroke();
  // roof
  const rf = () => poly(x, [90, 400, 450, 90, 810, 400]);
  x.beginPath(); rf(); fill(x, roof); celShade(x, rf, roofS, 90, 0);
  x.save(); x.beginPath(); rf(); x.clip(); x.strokeStyle = roofS; x.lineWidth = 3; for (let y = 130; y < 400; y += 30) { x.beginPath(); for (let tx = (y / 30 % 2) * 22; tx < 900; tx += 44) { x.moveTo(tx, y); x.quadraticCurveTo(tx + 22, y + 14, tx + 44, y); } x.stroke(); } x.restore();
  paint(x, rf, roof, 41 + variant, { n: 400, size: 8, spread: 0.14 });
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
  x.restore(); paint(x, body, PAL.stone, 51, { n: 500, size: 8, spread: 0.12 }); x.beginPath(); body(); ink(x, 6);
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
  const stoneRow = (y, h) => { x.beginPath(); x.rect(0, y, 1400, h); fill(x, PAL.stone); celShade(x, () => x.rect(0, y, 1400, h), PAL.stoneShade, 0, h * 0.55); paint(x, () => x.rect(0, y, 1400, h), PAL.stone, y, { n: 300, size: 6, spread: 0.14 }); x.beginPath(); x.rect(0, y, 1400, h); ink(x, 5); };
  for (let px = 40; px < 1400; px += 260) {
    const post = () => x.rect(px, 60, 70, 300);
    x.beginPath(); post(); fill(x, PAL.stone); celShade(x, post, PAL.stoneShade, 30, 0); paint(x, post, PAL.stone, 61 + px, { n: 60, size: 6, spread: 0.14 }); x.beginPath(); post(); ink(x, 6);
    x.beginPath(); x.rect(px - 10, 40, 90, 30); shape(x, '#ddd6c9', 5);
  }
  stoneRow(110, 44); stoneRow(210, 40);
  // ivy
  const r = rng(9); x.fillStyle = PAL.leaf;
  for (let i = 0; i < 26; i++) { const lx = r() * 1400, ly = 100 + r() * 160; x.beginPath(); x.ellipse(lx, ly, 14, 9, r() * 3, 0, Math.PI * 2); shape(x, i % 3 ? PAL.leaf : PAL.leafLight, 2.5); }
  return c;
}

export function ground() {
  const c = canvas(2048, 2048), x = c.getContext('2d');
  x.fillStyle = PAL.grass; x.fillRect(0, 0, 2048, 2048);
  const r = rng(5);
  // broad soft patches of lighter and darker grass
  for (let i = 0; i < 70; i++) { const px = r() * 2048, py = r() * 2048, rad = 120 + r() * 220; const g = x.createRadialGradient(px, py, 0, px, py, rad); const col = i % 2 ? '90,157,79' : '170,214,122'; g.addColorStop(0, `rgba(${col},0.35)`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.fillRect(px - rad, py - rad, rad * 2, rad * 2); }
  // thousands of short painted blades in varied greens
  const greens = ['#5f9e4f', '#6fb35a', '#8ccc6c', '#a9db84', '#4f8c45'];
  for (let i = 0; i < 9000; i++) { const px = r() * 2048, py = r() * 2048, h = 8 + r() * 14, lean = (r() - 0.5) * 8; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + lean * 0.4, py - h * 0.6, px + lean, py - h); x.lineWidth = 2 + r() * 2; x.strokeStyle = greens[Math.floor(r() * greens.length)]; x.globalAlpha = 0.55; x.stroke(); }
  x.globalAlpha = 1;
  for (let i = 0; i < 60; i++) { const px = r() * 2048, py = r() * 2048; x.beginPath(); circ(x, px, py, 3 + r() * 2); x.fillStyle = ['#ffffff', '#ffe07a', '#f7b3c8'][i % 3]; x.fill(); }
  return c;
}

export function pathTexture() {
  const c = canvas(256, 1024), x = c.getContext('2d');
  x.fillStyle = PAL.path; x.fillRect(0, 0, 256, 1024);
  const r = rng(13);
  paint(x, () => x.rect(0, 0, 256, 1024), PAL.path, 13, { n: 700, size: 8, spread: 0.12, alpha: 0.3 });
  for (let i = 0; i < 40; i++) { const px = r() * 256, py = r() * 1024, w = 8 + r() * 12; x.beginPath(); x.ellipse(px, py, w, w * 0.6, 0, 0, Math.PI * 2); x.fillStyle = 'rgba(170,140,95,0.45)'; x.fill(); x.beginPath(); x.ellipse(px - 2, py - 2, w * 0.7, w * 0.4, 0, 0, Math.PI * 2); x.fillStyle = 'rgba(255,240,210,0.5)'; x.fill(); }
  // soft grassy edges
  const eg = x.createLinearGradient(0, 0, 256, 0); eg.addColorStop(0, 'rgba(125,192,103,1)'); eg.addColorStop(0.15, 'rgba(125,192,103,0)'); eg.addColorStop(0.85, 'rgba(125,192,103,0)'); eg.addColorStop(1, 'rgba(125,192,103,1)'); x.fillStyle = eg; x.fillRect(0, 0, 256, 1024);
  return c;
}

// ---------- character ----------
export { character, POSES, DEFAULT_POSE } from './character.js';

// ---------- compositing ("photography" pass, as anime studios call it) ----------
// Applied on top of any finished drawing: warm light wrapping around the
// sun-facing edges, a soft diffusion glow, and a top-to-bottom light gradient.
// Works the same on code-drawn art and on painted art added later.
const SUN = { x: -0.7, y: -0.7 }; // light comes from the upper left
export function composite(src, o = {}) {
  const { rim = 1, glow = 1, grade = 1, rimColor = '#fff1c9', rimWidth = 10 } = o;
  const w = src.width, h = src.height;
  const out = canvas(w, h), x = out.getContext('2d');
  x.drawImage(src, 0, 0);
  if (rim) {
    const r = canvas(w, h), rx = r.getContext('2d');
    rx.drawImage(src, 0, 0);
    rx.globalCompositeOperation = 'source-in'; rx.fillStyle = rimColor; rx.fillRect(0, 0, w, h);
    rx.globalCompositeOperation = 'destination-out'; rx.drawImage(src, -SUN.x * rimWidth, -SUN.y * rimWidth);
    x.save(); x.globalCompositeOperation = 'source-atop'; x.globalAlpha = 0.85 * rim; x.filter = 'blur(' + Math.max(1, rimWidth * 0.25) + 'px)'; x.drawImage(r, 0, 0); x.restore();
  }
  if (grade) {
    x.save(); x.globalCompositeOperation = 'source-atop';
    const g = x.createLinearGradient(0, 0, w * 0.35, h);
    g.addColorStop(0, 'rgba(255,236,200,0.22)'); g.addColorStop(0.55, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(70,60,140,0.20)');
    x.globalAlpha = grade; x.fillStyle = g; x.fillRect(0, 0, w, h); x.restore();
  }
  if (glow) {
    const b = canvas(w, h), bx = b.getContext('2d');
    bx.filter = 'blur(' + Math.round(Math.max(w, h) / 90) + 'px) brightness(1.15)'; bx.drawImage(x.canvas, 0, 0);
    x.save(); x.globalCompositeOperation = 'screen'; x.globalAlpha = 0.28 * glow; x.drawImage(b, 0, 0); x.restore();
    // keep the soft halo just outside the shape too (diffusion filter look)
    x.save(); x.globalCompositeOperation = 'destination-over'; x.globalAlpha = 0.15 * glow; x.drawImage(b, 0, 0); x.restore();
  }
  return out;
}

// soft round sun glow for the sky (additive sprite)
export function sunGlow() {
  const c = canvas(512, 512), x = c.getContext('2d');
  const g = x.createRadialGradient(256, 256, 0, 256, 256, 256);
  g.addColorStop(0, 'rgba(255,255,245,1)'); g.addColorStop(0.08, 'rgba(255,250,225,0.95)'); g.addColorStop(0.25, 'rgba(255,236,190,0.35)'); g.addColorStop(1, 'rgba(255,230,180,0)');
  x.fillStyle = g; x.fillRect(0, 0, 512, 512);
  return c;
}

// one soft light shaft (additive)
export function lightShaft() {
  const c = canvas(128, 1024), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 1024); g.addColorStop(0, 'rgba(255,245,215,0.55)'); g.addColorStop(1, 'rgba(255,245,215,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 1024);
  const s = x.createLinearGradient(0, 0, 128, 0); s.addColorStop(0, 'rgba(0,0,0,1)'); s.addColorStop(0.5, 'rgba(0,0,0,0)'); s.addColorStop(1, 'rgba(0,0,0,1)');
  x.globalCompositeOperation = 'destination-out'; x.fillStyle = s; x.fillRect(0, 0, 128, 1024);
  return c;
}
