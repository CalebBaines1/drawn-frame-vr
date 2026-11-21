// Character drawing, round 1 of the quality loop.
// Original adventurer, ~7 heads tall, tapered limbs, clumped hair with a
// highlight band, detailed eyes, three-tone cel shading and line colours that
// follow the area (warm brown on skin, deep brown on hair, ink on cloth).

const C = {
  skin: '#ffe6d6', skin2: '#f6c4ad', skin3: '#e7a48e', blush: '#f5a3a0',
  hairA: '#8a5236', hairB: '#5e3322', hairC: '#3f1f14', hairHi: '#c98d62',
  eyeTop: '#4a1f0b', eyeMid: '#b4621c', eyeLow: '#f2c066',
  coat: '#fbfbff', coat2: '#d6daee', coat3: '#aeb3d1',
  navy: '#2f3c70', navy2: '#212b55', gold: '#e8bf55', gold2: '#b88a2c',
  plate: '#c9d6ea', plate2: '#93a5c6', leather: '#7b4a2e', leather2: '#57311d',
  boot: '#4a3127', boot2: '#33211a', glove: '#3a3550',
};
const L = { out: '#2e1d1a', skin: '#a35b46', hair: '#3a1c12', cloth: '#2d2a48' };

function line(x, col, w) { x.lineWidth = w; x.strokeStyle = col; x.lineJoin = 'round'; x.lineCap = 'round'; x.stroke(); }
function fillP(x, col) { x.fillStyle = col; x.fill(); }
// shade = area of the shape not covered by itself shifted toward the light.
// Drawn on a scratch canvas so overlapping sub-shapes never punch holes.
// `x` is a proxy whose target can be swapped, so path functions written
// against `x` can also trace onto the scratch canvas.
let TARGET = null, scratch = null;
const x = new Proxy({}, {
  get: (_, k) => { const v = TARGET[k]; return typeof v === 'function' ? v.bind(TARGET) : v; },
  set: (_, k, v) => { TARGET[k] = v; return true; },
});
function shade(_x, pathFn, lit, dark, dx, dy) {
  const real = TARGET, W = real.canvas.width, H = real.canvas.height;
  if (!scratch || scratch.width !== W || scratch.height !== H) { scratch = document.createElement('canvas'); scratch.width = W; scratch.height = H; }
  const t = scratch.getContext('2d');
  t.setTransform(1, 0, 0, 1, 0, 0); t.globalCompositeOperation = 'source-over'; t.clearRect(0, 0, W, H);
  t.setTransform(real.getTransform());
  TARGET = t;
  t.beginPath(); pathFn(); t.fillStyle = dark; t.fill();
  t.globalCompositeOperation = 'destination-out'; t.translate(-dx, -dy); t.beginPath(); pathFn(); t.fillStyle = '#000'; t.fill();
  TARGET = real;
  real.save(); real.setTransform(1, 0, 0, 1, 0, 0); real.drawImage(scratch, 0, 0); real.restore();
}
function part(x, pathFn, lit, s1, s2, lc, lw, d = 1) {
  x.beginPath(); pathFn(); fillP(x, lit);
  if (s1) shade(x, pathFn, lit, s1, 14 * d, 6);
  if (s2) shade(x, pathFn, 'rgba(0,0,0,0)', s2, 30 * d, 14);
  x.beginPath(); pathFn(); line(x, lc, lw);
}
// tapered capsule from a to b
function limbPath(x, ax, ay, bx, by, wa, wb) {
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
  const ang = Math.atan2(dy, dx);
  x.moveTo(ax + nx * wa / 2, ay + ny * wa / 2);
  x.lineTo(bx + nx * wb / 2, by + ny * wb / 2);
  x.arc(bx, by, wb / 2, ang + Math.PI / 2, ang - Math.PI / 2, true);
  x.lineTo(ax - nx * wa / 2, ay - ny * wa / 2);
  x.arc(ax, ay, wa / 2, ang - Math.PI / 2, ang + Math.PI / 2, true);
  x.closePath();
}
function rot(px, py, cx, cy, a) { const c = Math.cos(a), s = Math.sin(a); return [cx + (px - cx) * c - (py - cy) * s, cy + (px - cx) * s + (py - cy) * c]; }

export const DEFAULT_POSE = { look: { x: 0, y: 0 }, mouth: 'smile', brows: 'soft', arm: 0, armWave: 0, flinch: 0, blink: 0, blush: 0.35, hairSway: 0 };

export function character(c, pose = {}) {
  const p = { ...DEFAULT_POSE, ...pose, look: { ...DEFAULT_POSE.look, ...(pose.look || {}) } };
  if (!c) { c = document.createElement('canvas'); c.width = 640; c.height = 1280; }
  TARGET = c.getContext('2d');
  x.clearRect(0, 0, c.width, c.height);
  x.save(); x.scale(c.width / 640, c.height / 1280);
  const sway = p.hairSway * 8;

  // ---------- back hair (behind everything) ----------
  const backHair = () => {
    x.moveTo(250, 70); x.bezierCurveTo(200, 160, 200, 330, 214 + sway, 470);
    const tips = [[214, 470], [240, 520], [262, 486], [290, 540], [320, 500], [350, 540], [378, 486], [400, 520], [426, 470]];
    for (const [tx, ty] of tips) x.lineTo(tx + sway * (ty - 400) / 140, ty);
    x.bezierCurveTo(440, 330, 440, 160, 390, 70); x.closePath();
  };
  x.beginPath(); backHair(); const hg = x.createLinearGradient(0, 60, 0, 540); hg.addColorStop(0, C.hairB); hg.addColorStop(1, C.hairC); fillP(x, hg);
  x.beginPath(); backHair(); line(x, L.hair, 3.5);

  // ---------- legs ----------
  const lean = p.flinch * 0.07;
  const legs = [[-1, 292], [1, 348]];
  for (const [s, hx] of legs) {
    const kx = hx - s * 4, ky = 880, ax = hx, ay = 1170;
    // thigh + calf (skin above boots)
    x.beginPath(); limbPath(x, hx, 560, kx, ky, 74, 46); fillP(x, C.skin);
    shade(x, () => limbPath(x, hx, 560, kx, ky, 74, 46), C.skin, C.skin2, 12 * s, 0);
    x.beginPath(); limbPath(x, hx, 560, kx, ky, 74, 46); line(x, L.skin, 3);
    // thigh-high boot from y 770
    const boot = () => { limbPath(x, kx, 790, ax, ay, 50, 32); };
    const bootTop = () => { x.moveTo(kx - 30, 770); x.quadraticCurveTo(kx, 750 + s * 6, kx + 30, 770); x.lineTo(kx + 26, 900); x.lineTo(kx - 26, 900); x.closePath(); };
    part(x, () => { boot(); bootTop(); }, C.boot, C.boot2, null, L.out, 3.5, s);
    x.beginPath(); x.moveTo(kx - 30, 772); x.quadraticCurveTo(kx, 752 + s * 6, kx + 30, 772); line(x, C.gold, 7); x.beginPath(); x.moveTo(kx - 30, 772); x.quadraticCurveTo(kx, 752 + s * 6, kx + 30, 772); line(x, L.out, 1.5);
    // knee guard
    part(x, () => x.ellipse(kx, 885, 24, 30, 0, 0, Math.PI * 2), C.plate, C.plate2, null, L.cloth, 3, s);
    // foot
    const foot = () => { x.moveTo(ax - 18, 1150); x.lineTo(ax + 18, 1150); x.quadraticCurveTo(ax + 22 + s * 18, 1238, ax + s * 30, 1262); x.lineTo(ax - 22, 1262); x.quadraticCurveTo(ax - 24, 1200, ax - 18, 1150); x.closePath(); };
    part(x, foot, C.boot, C.boot2, null, L.out, 3.5, s);
  }

  x.save(); x.translate(320, 560); x.rotate(-lean); x.translate(-320, -560);

  // ---------- coat skirt (open front) ----------
  const skirt = () => { x.moveTo(268, 450); x.bezierCurveTo(240, 560, 200, 680, 190, 790); x.quadraticCurveTo(250, 770, 300, 800); x.lineTo(310, 560); x.lineTo(330, 560); x.lineTo(340, 800); x.quadraticCurveTo(390, 770, 450, 790); x.bezierCurveTo(440, 680, 400, 560, 372, 450); x.closePath(); };
  part(x, skirt, C.coat, C.coat2, C.coat3, L.cloth, 3.5);
  // folds
  x.beginPath(); x.moveTo(250, 560); x.quadraticCurveTo(236, 680, 230, 780); x.moveTo(392, 560); x.quadraticCurveTo(404, 680, 410, 780); x.moveTo(282, 600); x.lineTo(270, 790); line(x, C.coat3, 2.5);
  // trim
  x.beginPath(); x.moveTo(190, 790); x.quadraticCurveTo(250, 770, 300, 800); x.moveTo(340, 800); x.quadraticCurveTo(390, 770, 450, 790); line(x, C.navy, 10);
  x.beginPath(); x.moveTo(190, 790); x.quadraticCurveTo(250, 770, 300, 800); x.moveTo(340, 800); x.quadraticCurveTo(390, 770, 450, 790); line(x, C.gold, 3);
  // shorts
  part(x, () => { x.moveTo(282, 520); x.lineTo(358, 520); x.lineTo(366, 600); x.lineTo(322, 610); x.lineTo(274, 600); x.closePath(); }, C.navy, C.navy2, null, L.cloth, 3);

  // ---------- sword at the hip ----------
  part(x, () => { x.moveTo(394, 520); x.lineTo(410, 516); x.lineTo(470, 820); x.lineTo(456, 826); x.closePath(); }, C.navy, C.navy2, null, L.out, 3);
  part(x, () => x.rect(380, 500, 44, 12), C.gold, C.gold2, null, L.out, 2.5);
  part(x, () => x.rect(394, 470, 14, 34), C.leather, C.leather2, null, L.out, 2.5);

  // ---------- torso ----------
  const torso = () => { x.moveTo(236, 246); x.quadraticCurveTo(320, 226, 404, 246); x.bezierCurveTo(400, 330, 372, 400, 368, 452); x.lineTo(380, 540); x.quadraticCurveTo(320, 556, 260, 540); x.lineTo(272, 452); x.bezierCurveTo(268, 400, 240, 330, 236, 246); x.closePath(); };
  part(x, torso, C.coat, C.coat2, C.coat3, L.cloth, 3.5);
  // under-bust shading line and waist folds
  x.beginPath(); x.moveTo(266, 372); x.quadraticCurveTo(290, 390, 316, 384); x.moveTo(330, 384); x.quadraticCurveTo(352, 392, 374, 372); line(x, C.coat3, 2.5);
  // navy front panel with gold trim
  part(x, () => { x.moveTo(300, 250); x.lineTo(340, 250); x.lineTo(334, 540); x.lineTo(306, 540); x.closePath(); }, C.navy, C.navy2, null, L.cloth, 3);
  x.beginPath(); x.moveTo(300, 250); x.lineTo(306, 540); x.moveTo(340, 250); x.lineTo(334, 540); line(x, C.gold, 4);
  for (let by = 290; by < 520; by += 46) { x.beginPath(); x.arc(320, by, 5, 0, Math.PI * 2); fillP(x, C.gold); line(x, L.out, 1.5); }
  // chest plate (light armour, one side)
  part(x, () => { x.moveTo(250, 262); x.quadraticCurveTo(290, 250, 304, 262); x.lineTo(304, 352); x.quadraticCurveTo(270, 372, 252, 340); x.closePath(); }, C.plate, C.plate2, null, L.cloth, 3);
  x.beginPath(); x.moveTo(262, 280); x.quadraticCurveTo(276, 300, 272, 340); line(x, '#eef3fb', 4);
  // belt
  part(x, () => { x.moveTo(262, 452); x.quadraticCurveTo(320, 470, 378, 452); x.lineTo(380, 482); x.quadraticCurveTo(320, 500, 260, 482); x.closePath(); }, C.leather, C.leather2, null, L.out, 3);
  part(x, () => x.rect(306, 458, 28, 30), C.gold, C.gold2, null, L.out, 2.5);
  // pauldrons / shoulder capes
  for (const s of [-1, 1]) {
    const sx = 320 + s * 88;
    part(x, () => { x.moveTo(sx - s * 40, 236); x.quadraticCurveTo(sx + s * 30, 226, sx + s * 40, 290); x.quadraticCurveTo(sx + s * 6, 306, sx - s * 28, 296); x.closePath(); }, C.coat, C.coat2, null, L.cloth, 3, s);
    x.beginPath(); x.moveTo(sx + s * 40, 290); x.quadraticCurveTo(sx + s * 6, 306, sx - s * 28, 296); line(x, C.gold, 4);
  }

  // ---------- arms ----------
  const arm = (s, raise, wave) => {
    const sx = 320 + s * 92, sy = 268;
    const a0 = s * 0.12 - s * raise * 2.5 + s * Math.sin(wave) * 0.22 * raise - s * p.flinch * 0.55;
    const ex = sx + Math.sin(-a0) * 168 * -1 * -1, ey = sy + Math.cos(a0) * 168;
    const [ex2, ey2] = [sx - Math.sin(a0) * 168, sy + Math.cos(a0) * 168];
    const bend = -s * raise * 0.55 + s * p.flinch * 2.1;
    const a1 = a0 + bend;
    const wx = ex2 - Math.sin(a1) * 150, wy = ey2 + Math.cos(a1) * 150;
    // sleeve upper arm
    part(x, () => limbPath(x, sx, sy, ex2, ey2, 46, 36), C.coat, C.coat2, null, L.cloth, 3, s);
    // forearm in glove
    part(x, () => limbPath(x, ex2, ey2, wx, wy, 34, 24), C.glove, '#27233a', null, L.out, 3, s);
    x.beginPath(); limbPath(x, ex2, ey2, ex2 - Math.sin(a1) * 26, ey2 + Math.cos(a1) * 26, 40, 38); fillP(x, C.navy); line(x, L.cloth, 2.5);
    x.beginPath(); x.moveTo(ex2 - 20, ey2 + 18); x.lineTo(ex2 + 20, ey2 + 18); // cuff trim (approx)
    // hand
    const hx = wx - Math.sin(a1) * 26, hy = wy + Math.cos(a1) * 26;
    part(x, () => x.ellipse(hx, hy, 17, 24, a1, 0, Math.PI * 2), C.glove, '#27233a', null, L.out, 3, s);
    part(x, () => x.ellipse(hx + s * 14 * Math.cos(a1), hy + s * 14 * Math.sin(a1) - 6, 6, 12, a1 + s * 0.6, 0, Math.PI * 2), C.glove, null, null, L.out, 2.5, s);
  };
  arm(-1, 0, 0);
  arm(1, p.arm, p.armWave);

  // ---------- neck + collar ----------
  part(x, () => { x.moveTo(304, 186); x.lineTo(336, 186); x.lineTo(340, 244); x.lineTo(300, 244); x.closePath(); }, C.skin, C.skin2, null, L.skin, 2.5);
  shade(x, () => { x.moveTo(304, 186); x.lineTo(336, 186); x.lineTo(340, 244); x.lineTo(300, 244); x.closePath(); }, 'rgba(0,0,0,0)', C.skin3, 0, -26);
  part(x, () => { x.moveTo(282, 232); x.lineTo(300, 222); x.lineTo(320, 258); x.lineTo(340, 222); x.lineTo(358, 232); x.lineTo(340, 272); x.lineTo(320, 262); x.lineTo(300, 272); x.closePath(); }, C.navy, C.navy2, null, L.cloth, 2.5);
  x.beginPath(); x.moveTo(300, 222); x.lineTo(320, 258); x.lineTo(340, 222); line(x, C.gold, 3);

  // ---------- head ----------
  x.save(); x.translate(320, 200); x.rotate(-p.flinch * 0.1 + p.look.x * 0.04); x.translate(-320, -200);
  const face = () => { x.moveTo(258, 96); x.bezierCurveTo(258, 150, 270, 172, 296, 192); x.quadraticCurveTo(320, 208, 344, 192); x.bezierCurveTo(370, 172, 382, 150, 382, 96); x.bezierCurveTo(380, 40, 260, 40, 258, 96); };
  x.beginPath(); face(); fillP(x, C.skin);
  // hair shadow on forehead and side of face
  x.save(); x.beginPath(); face(); x.clip(); x.fillStyle = C.skin2; x.beginPath(); x.ellipse(320, 76, 80, 46, 0, 0, Math.PI * 2); x.fill(); x.beginPath(); x.moveTo(382, 80); x.quadraticCurveTo(366, 160, 344, 200); x.lineTo(400, 200); x.closePath(); x.fill(); x.restore();
  x.beginPath(); face(); line(x, L.skin, 3);
  // ears
  for (const s of [-1, 1]) part(x, () => x.ellipse(320 + s * 63, 128, 9, 16, s * 0.15, 0, Math.PI * 2), C.skin, C.skin2, null, L.skin, 2.5, s);
  // blush hatching
  if (p.blush > 0) { x.save(); x.globalAlpha = p.blush; for (const s of [-1, 1]) { const g = x.createRadialGradient(320 + s * 38, 158, 0, 320 + s * 38, 158, 18); g.addColorStop(0, C.blush); g.addColorStop(1, 'rgba(245,163,160,0)'); x.fillStyle = g; x.fillRect(320 + s * 38 - 20, 140, 40, 36); } x.restore(); x.beginPath(); for (const s of [-1, 1]) for (let k = -1; k <= 1; k++) { x.moveTo(320 + s * 38 + k * 7 + 2, 152); x.lineTo(320 + s * 38 + k * 7 - 2, 162); } line(x, '#e98c86', 1.5); }

  // eyes
  const open = 1 - p.blink, ey = 126;
  for (const s of [-1, 1]) {
    const ex = 320 + s * 30;
    if (open < 0.2) { x.beginPath(); x.moveTo(ex - 17, ey + 4); x.quadraticCurveTo(ex, ey + 12, ex + 17, ey + 4); line(x, L.out, 4); continue; }
    const eh = 21 * open;
    const white = () => { x.moveTo(ex - 18, ey); x.quadraticCurveTo(ex - 4, ey - eh - 2, ex + 18 * s * 0 + 18, ey - eh * 0.6); x.quadraticCurveTo(ex + 20, ey + eh * 0.5, ex + 4, ey + eh * 0.9); x.quadraticCurveTo(ex - 14, ey + eh * 0.8, ex - 18, ey); };
    const wPath = () => x.ellipse(ex, ey, 19, eh, 0, 0, Math.PI * 2);
    x.beginPath(); wPath(); fillP(x, '#ffffff');
    x.save(); x.beginPath(); wPath(); x.clip();
    const ix = ex + p.look.x * 6, iy = ey + p.look.y * 6 + 2;
    const g = x.createLinearGradient(0, iy - 19, 0, iy + 19); g.addColorStop(0, C.eyeTop); g.addColorStop(0.5, C.eyeMid); g.addColorStop(1, C.eyeLow);
    x.beginPath(); x.ellipse(ix, iy, 13, 19, 0, 0, Math.PI * 2); fillP(x, g); line(x, C.eyeTop, 1.5);
    x.beginPath(); x.ellipse(ix, iy + 1, 5, 8, 0, 0, Math.PI * 2); fillP(x, '#2a1006');
    x.beginPath(); x.ellipse(ix, iy + 8, 7, 4, 0, 0, Math.PI * 2); fillP(x, 'rgba(255,220,150,.6)');
    x.beginPath(); x.arc(ix + 4, iy - 7, 4, 0, Math.PI * 2); x.arc(ix - 5, iy + 6, 1.8, 0, Math.PI * 2); fillP(x, '#ffffff');
    x.fillStyle = 'rgba(90,60,90,.28)'; x.fillRect(ex - 20, ey - eh - 2, 40, 7);
    x.restore();
    // upper lash: thick, flicks out at the outer corner
    x.beginPath(); x.moveTo(ex - s * 18, ey + 1); x.quadraticCurveTo(ex - s * 4, ey - eh - 5, ex + s * 17, ey - eh * 0.45); x.lineTo(ex + s * 24, ey - eh * 0.75); line(x, L.out, 5);
    // lower lash: thin, short
    x.beginPath(); x.moveTo(ex + s * 12, ey + eh * 0.85); x.quadraticCurveTo(ex + s * 2, ey + eh + 1, ex - s * 8, ey + eh * 0.85); line(x, L.skin, 1.5);
    // double-lid crease
    x.beginPath(); x.moveTo(ex - s * 10, ey - eh - 7); x.quadraticCurveTo(ex + s * 4, ey - eh - 10, ex + s * 16, ey - eh - 3); line(x, L.skin, 1.5);
  }
  // brows
  for (const s of [-1, 1]) {
    const bx = 320 + s * 29, up = p.brows === 'up' ? -6 : 0, tilt = p.brows === 'worried' ? 5 : 0;
    x.beginPath(); x.moveTo(bx - s * 14, 98 + up + tilt); x.quadraticCurveTo(bx + s * 2, 92 + up, bx + s * 18, 98 + up - tilt * 0.4); line(x, C.hairC, 3);
  }
  // nose + mouth
  x.beginPath(); x.moveTo(322, 150); x.lineTo(318, 158); line(x, L.skin, 2);
  x.beginPath();
  if (p.mouth === 'smile') { x.moveTo(310, 176); x.quadraticCurveTo(320, 182, 330, 176); line(x, L.skin, 2.5); }
  else if (p.mouth === 'flat') { x.moveTo(312, 178); x.lineTo(328, 178); line(x, L.skin, 2.5); }
  else if (p.mouth === 'open') { x.moveTo(308, 174); x.quadraticCurveTo(320, 194, 332, 174); x.closePath(); fillP(x, '#a5403c'); line(x, L.skin, 2.5); x.beginPath(); x.ellipse(320, 184, 6, 3, 0, 0, Math.PI * 2); fillP(x, '#ee8c87'); }
  else if (p.mouth === 'o') { x.ellipse(320, 179, 5, 7, 0, 0, Math.PI * 2); fillP(x, '#a5403c'); line(x, L.skin, 2.5); }

  // front hair: clumps of pointed strands, gradient, highlight band
  let OPEN = false;
  const clump = (rx, ry, tx, ty, w, bend) => { x.moveTo(rx + w, ry); x.quadraticCurveTo(rx + w + bend, (ry + ty) / 2, tx, ty); x.quadraticCurveTo(rx - w + bend, (ry + ty) / 2, rx - w, ry); if (!OPEN) x.closePath(); };
  const fringePath = () => {
    x.moveTo(250, 120); x.bezierCurveTo(236, 26, 300, 12, 320, 14); x.bezierCurveTo(340, 12, 404, 26, 390, 120); if (!OPEN) { x.bezierCurveTo(380, 70, 260, 70, 250, 120); x.closePath(); }
    clump(262, 60, 256 + sway, 196, 14, -10);
    clump(280, 50, 278 + sway, 140, 18, -6);
    clump(300, 48, 296 + sway, 122, 16, 4);
    clump(322, 44, 324 + sway, 132, 18, -4);
    clump(344, 48, 346 + sway, 118, 16, 6);
    clump(362, 52, 366 + sway, 142, 18, 8);
    clump(380, 60, 386 + sway, 210, 14, 10);
  };
  x.beginPath(); fringePath(); const fg = x.createLinearGradient(0, 16, 0, 210); fg.addColorStop(0, C.hairA); fg.addColorStop(1, C.hairB); fillP(x, fg);
  shade(x, fringePath, 'rgba(0,0,0,0)', C.hairC, 14, 4);
  // highlight band: a row of short lighter strokes following the head's curve
  x.save(); x.beginPath(); fringePath(); x.clip();
  // glossy 'angel ring' highlight following the curve of the head
  for (let k = 0; k < 7; k++) { const a0 = Math.PI * (1.12 + k * 0.11), a1 = a0 + 0.07; x.beginPath(); x.ellipse(320, 92, 64, 42, 0, a0, a1); line(x, C.hairHi, 7); }
  x.restore();
  OPEN = true; x.beginPath(); fringePath(); line(x, L.hair, 3); OPEN = false;
  // strand lines inside clumps
  x.beginPath(); for (const [ax, ay, bx, by] of [[290, 60, 286, 120], [334, 56, 330, 112], [356, 60, 360, 120], [270, 70, 264, 160]]) { x.moveTo(ax, ay); x.quadraticCurveTo(ax - 2, (ay + by) / 2, bx + sway, by); } line(x, C.hairC, 1.5);
  // hair clip
  part(x, () => { x.moveTo(362, 84); x.lineTo(384, 78); x.lineTo(386, 88); x.lineTo(364, 94); x.closePath(); }, C.gold, C.gold2, null, L.out, 2);
  x.restore(); // head

  x.restore(); // lean
  x.restore(); // scale
  return c;
}

export const POSES = {
  idle: {},
  look: { mouth: 'flat', blush: 0.2 },
  notice: { mouth: 'o', brows: 'up', blush: 0.3 },
  greet: { mouth: 'open', brows: 'up', arm: 1, armWave: 0.5, blush: 0.5 },
  flinch: { mouth: 'o', brows: 'worried', flinch: 1, blush: 0.6 },
  blink: { blink: 1 },
};
