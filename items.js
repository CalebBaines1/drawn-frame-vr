// Item generator: every call draws a brand-new item in the scene's style
// (soft coloured lines, two-tone cel shading, a highlight, warm rim light).
// The seed picks the kind, colours and details, so no two are the same.
import { canvas, rng, composite } from './art.js';

const LINE = '#3a2622';
const KINDS = ['potion', 'crystal', 'bouquet', 'lantern', 'apple', 'charm', 'scroll', 'shell'];

function hsl(h, s, l) { return `hsl(${h},${s}%,${l}%)`; }
function outline(x, w = 5) { x.lineWidth = w; x.strokeStyle = LINE; x.lineJoin = 'round'; x.lineCap = 'round'; x.stroke(); }
function shaded(x, pathFn, h, s, l, dx = 16, dy = 10) {
  x.beginPath(); pathFn(); x.fillStyle = hsl(h, s, l); x.fill();
  x.save(); x.beginPath(); pathFn(); x.clip();
  x.fillStyle = hsl(h, s + 5, l - 16); x.translate(dx, dy); x.beginPath(); x.rect(-1000, -1000, 3000, 3000); pathFn(); x.fill('evenodd');
  x.restore();
  x.beginPath(); pathFn(); outline(x);
}
function shine(x, px, py, w, h, a = -0.5) { x.beginPath(); x.ellipse(px, py, w, h, a, 0, Math.PI * 2); x.fillStyle = 'rgba(255,255,255,0.85)'; x.fill(); }

const draw = {
  potion(x, r, h) {
    const neck = () => x.rect(108, 40, 40, 50);
    shaded(x, neck, 200, 30, 88);
    x.beginPath(); x.rect(102, 22, 52, 26); x.fillStyle = '#9a6a42'; x.fill(); outline(x);
    const body = () => { x.moveTo(108, 88); x.bezierCurveTo(30, 120, 40, 236, 128, 236); x.bezierCurveTo(216, 236, 226, 120, 148, 88); x.closePath(); };
    x.beginPath(); body(); x.fillStyle = 'rgba(220,240,255,0.9)'; x.fill();
    const level = 130 + r() * 40;
    x.save(); x.beginPath(); body(); x.clip(); x.fillStyle = hsl(h, 80, 55); x.fillRect(0, level, 256, 256); x.fillStyle = hsl(h, 85, 38); x.beginPath(); x.ellipse(160, 230, 90, 60, 0, 0, Math.PI * 2); x.fill();
    for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(70 + r() * 110, level + 10 + r() * 70, 3 + r() * 6, 0, Math.PI * 2); x.fillStyle = hsl(h, 90, 80); x.fill(); }
    x.restore();
    x.beginPath(); body(); outline(x);
    shine(x, 84, 140, 10, 26, 0.3);
  },
  crystal(x, r, h) {
    const pts = [128, 18, 196, 92, 170, 236, 86, 236, 60, 92];
    const p = () => { x.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]); x.closePath(); };
    shaded(x, p, h, 70, 66, 30, 0);
    x.beginPath(); x.moveTo(128, 18); x.lineTo(128, 236); x.moveTo(60, 92); x.lineTo(128, 120); x.lineTo(196, 92); x.lineWidth = 3; x.strokeStyle = hsl(h, 60, 40); x.stroke();
    x.beginPath(); x.moveTo(78, 96); x.lineTo(124, 30); x.lineTo(120, 110); x.closePath(); x.fillStyle = 'rgba(255,255,255,0.55)'; x.fill();
    x.beginPath(); p(); outline(x);
  },
  bouquet(x, r, h) {
    x.beginPath(); for (let i = 0; i < 5; i++) { x.moveTo(128, 236); x.quadraticCurveTo(128 + (i - 2) * 10, 170, 100 + i * 14, 120); } x.lineWidth = 6; x.strokeStyle = '#4f9a4a'; x.stroke();
    const wrap = () => { x.moveTo(80, 150); x.lineTo(176, 150); x.lineTo(140, 240); x.lineTo(116, 240); x.closePath(); };
    shaded(x, wrap, 40, 50, 88);
    for (let i = 0; i < 6; i++) {
      const fx = 70 + r() * 116, fy = 50 + r() * 80, rr = 18 + r() * 10, hh = (h + (i % 3) * 40) % 360;
      const petals = () => { for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; x.moveTo(fx + Math.cos(a) * rr + rr * 0.5, fy + Math.sin(a) * rr); x.arc(fx + Math.cos(a) * rr, fy + Math.sin(a) * rr, rr * 0.5, 0, Math.PI * 2); } };
      shaded(x, petals, hh, 75, 75, 6, 6);
      x.beginPath(); x.arc(fx, fy, rr * 0.4, 0, Math.PI * 2); x.fillStyle = '#ffd25a'; x.fill(); outline(x, 3);
    }
    x.beginPath(); x.moveTo(100, 170); x.quadraticCurveTo(128, 190, 156, 170); x.lineWidth = 8; x.strokeStyle = hsl(h, 70, 60); x.stroke();
  },
  lantern(x, r, h) {
    x.beginPath(); x.arc(128, 36, 18, Math.PI, 0); outline(x, 6);
    const glow = x.createRadialGradient(128, 140, 10, 128, 140, 120); glow.addColorStop(0, hsl(h, 100, 85)); glow.addColorStop(1, 'rgba(255,220,150,0)');
    x.fillStyle = glow; x.fillRect(0, 0, 256, 256);
    shaded(x, () => x.rect(86, 50, 84, 24), 30, 40, 40);
    const glass = () => x.rect(92, 74, 72, 120);
    x.beginPath(); glass(); x.fillStyle = hsl(h, 100, 80); x.fill(); outline(x);
    x.beginPath(); x.ellipse(128, 150, 12, 22, 0, 0, Math.PI * 2); x.fillStyle = '#fffbe8'; x.fill();
    x.beginPath(); x.moveTo(128, 74); x.lineTo(128, 194); x.lineWidth = 4; x.strokeStyle = LINE; x.stroke();
    shaded(x, () => x.rect(80, 194, 96, 26), 30, 40, 40);
  },
  apple(x, r, h) {
    const hue = r() < 0.5 ? 2 : 95;
    const body = () => { x.moveTo(128, 80); x.bezierCurveTo(60, 40, 20, 150, 80, 220); x.quadraticCurveTo(128, 250, 176, 220); x.bezierCurveTo(236, 150, 196, 40, 128, 80); x.closePath(); };
    shaded(x, body, hue, 70, 55, 24, 14);
    x.beginPath(); x.moveTo(128, 82); x.quadraticCurveTo(124, 50, 138, 30); outline(x, 7);
    const leaf = () => { x.moveTo(136, 46); x.quadraticCurveTo(170, 20, 196, 44); x.quadraticCurveTo(166, 66, 136, 46); };
    shaded(x, leaf, 110, 55, 50, 4, 6);
    shine(x, 88, 120, 12, 22, 0.4);
  },
  charm(x, r, h) {
    x.beginPath(); x.moveTo(128, 10); x.lineTo(128, 60); outline(x, 4);
    const n = 5 + Math.floor(r() * 3), R = 90, ri = 42;
    const star = () => { for (let k = 0; k < n * 2; k++) { const a = -Math.PI / 2 + k * Math.PI / n, d = k % 2 ? ri : R; const px = 128 + Math.cos(a) * d, py = 150 + Math.sin(a) * d; k ? x.lineTo(px, py) : x.moveTo(px, py); } x.closePath(); };
    shaded(x, star, 45, 85, 62, 20, 12);
    x.beginPath(); x.arc(128, 150, 26, 0, Math.PI * 2); x.fillStyle = hsl(h, 80, 60); x.fill(); outline(x, 4);
    shine(x, 118, 140, 7, 11);
  },
  scroll(x, r, h) {
    const paper = () => x.rect(60, 70, 136, 120);
    shaded(x, paper, 42, 60, 88, 0, 18);
    for (const y of [70, 190]) { x.beginPath(); x.ellipse(128, y, 80, 16, 0, 0, Math.PI * 2); x.fillStyle = '#e9d5a6'; x.fill(); outline(x, 4); }
    x.beginPath(); for (let i = 0; i < 4; i++) { x.moveTo(80, 100 + i * 20); x.lineTo(80 + 60 + r() * 40, 100 + i * 20); } x.lineWidth = 4; x.strokeStyle = hsl(h, 40, 45); x.stroke();
    x.beginPath(); x.rect(118, 120, 20, 80); x.fillStyle = hsl(h, 70, 50); x.fill(); outline(x, 3);
  },
  shell(x, r, h) {
    const body = () => { x.moveTo(128, 210); for (let k = 0; k <= 12; k++) { const a = Math.PI + k / 12 * Math.PI; x.lineTo(128 + Math.cos(a) * 100, 190 + Math.sin(a) * 140 * (k % 2 ? 0.92 : 1)); } x.closePath(); };
    shaded(x, body, (h + 330) % 360, 60, 82, 18, 10);
    x.beginPath(); for (let k = 1; k < 12; k++) { const a = Math.PI + k / 12 * Math.PI; x.moveTo(128, 205); x.lineTo(128 + Math.cos(a) * 92, 190 + Math.sin(a) * 128); } x.lineWidth = 3; x.strokeStyle = hsl(h, 40, 60); x.stroke();
  },
};

export function generateItem(seed, kind) {
  const r = rng(seed * 7919 + 13);
  kind = kind || KINDS[Math.floor(r() * KINDS.length)];
  const h = Math.floor(r() * 360);
  const c = canvas(256, 256), x = c.getContext('2d');
  draw[kind](x, r, h);
  return { kind, canvas: composite(c, { rimWidth: 5, glow: 0.8 }) };
}
export const ITEM_KINDS = KINDS;
