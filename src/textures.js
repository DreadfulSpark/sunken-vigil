// Every texture is drawn here with Graphics, in one consistent flooded-gothic style.
import { mulberry32 } from './rules.js';
import { C } from './ui.js';

export const T = 60;

export function makeTextures(scene) {
  if (scene.textures.exists('floor0')) return;
  const g = scene.add.graphics();
  const rng = mulberry32(1337);
  const gen = (k, w, h) => { g.generateTexture(k, w, h); g.clear(); };

  const floorBase = (variant) => {
    g.fillStyle(0x323938, 1); g.fillRect(0, 0, T, T);
    const split = variant % 2 === 0;
    const cut = 18 + Math.floor(rng() * 24);
    const slabs = split ? [[0, 0, cut, T], [cut, 0, T - cut, T]] : [[0, 0, T, cut], [0, cut, T, T - cut]];
    for (const [x, y, w, h] of slabs) {
      const shade = 0x363e3c + Math.floor(rng() * 4) * 0x020202;
      g.fillStyle(shade, 1); g.fillRect(x + 1, y + 1, w - 2, h - 2);
      g.fillStyle(0xffffff, 0.035); g.fillRect(x + 1, y + 1, w - 2, 2);
      g.fillStyle(0x000000, 0.18); g.fillRect(x + 1, y + h - 3, w - 2, 2);
    }
    for (let i = 0; i < 26; i++) {
      g.fillStyle(rng() < 0.5 ? 0x000000 : 0xffffff, 0.05 + rng() * 0.05);
      g.fillRect(Math.floor(rng() * T), Math.floor(rng() * T), 1 + Math.floor(rng() * 2), 1);
    }
    if (variant === 3) {
      g.lineStyle(1, 0x1c2120, 0.8);
      g.beginPath(); g.moveTo(8, 10); g.lineTo(20, 22); g.lineTo(18, 34); g.lineTo(30, 44); g.strokePath();
    }
    if (variant === 2) { // moss
      for (let i = 0; i < 14; i++) { g.fillStyle(0x2f4a3a, 0.35); g.fillCircle(4 + rng() * 14, 40 + rng() * 16, 1 + rng() * 3); }
    }
  };
  for (let v = 0; v < 4; v++) { floorBase(v); gen(`floor${v}`, T, T); }

  // shallow water: floor seen through a teal film
  floorBase(0);
  g.fillStyle(0x1f5254, 0.55); g.fillRect(0, 0, T, T);
  g.lineStyle(1, 0x9fd6cf, 0.18);
  for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(10 + rng() * 40, 10 + rng() * 40, 6 + rng() * 6, 0.3, 2.4); g.strokePath(); }
  gen('shallow', T, T);

  g.fillStyle(0x071a1d, 1); g.fillRect(0, 0, T, T);
  for (let i = 0; i < 6; i++) { g.fillStyle(0x0e2a2e, 0.6); g.fillEllipse(rng() * T, rng() * T, 24 + rng() * 20, 8 + rng() * 6); }
  gen('deep', T, T);

  g.lineStyle(1.5, 0x7fb8ae, 0.5);
  for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(12 + i * 16 + rng() * 6, 16 + rng() * 28, 7 + rng() * 5, 3.5, 5.9); g.strokePath(); }
  gen('ripple', T, T);

  // dais: pale marble, bevelled
  g.fillStyle(0x5d6461, 1); g.fillRect(0, 0, T, T);
  g.fillStyle(0x6c7370, 1); g.fillRect(3, 3, T - 6, T - 6);
  g.fillStyle(0xffffff, 0.08); g.fillRect(3, 3, T - 6, 3); g.fillRect(3, 3, 3, T - 6);
  g.fillStyle(0x000000, 0.18); g.fillRect(3, T - 6, T - 6, 3); g.fillRect(T - 6, 3, 3, T - 6);
  g.lineStyle(1, 0x8b928e, 0.35);
  for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(rng() * T, rng() * T); g.lineTo(rng() * T, rng() * T); g.strokePath(); }
  g.lineStyle(1, 0x3b4140, 0.5); g.strokeCircle(T / 2, T / 2, 14);
  gen('dais', T, T);

  // pillar
  floorBase(1);
  g.fillStyle(0x000000, 0.45); g.fillEllipse(T / 2 + 5, T / 2 + 7, 50, 44);
  g.fillStyle(0x3d4442, 1); g.fillCircle(T / 2, T / 2, 25);
  g.fillStyle(0x515856, 1); g.fillCircle(T / 2, T / 2, 21);
  g.fillStyle(0x666e6b, 1); g.fillCircle(T / 2 - 4, T / 2 - 4, 14);
  g.fillStyle(0x7d8582, 1); g.fillCircle(T / 2 - 7, T / 2 - 7, 6);
  g.lineStyle(2, 0x2b302f, 1); g.strokeCircle(T / 2, T / 2, 25);
  gen('pillar', T, T);

  // brazier (cold); coals drawn on top when lit
  floorBase(0);
  g.fillStyle(0x000000, 0.4); g.fillEllipse(T / 2 + 4, T / 2 + 6, 44, 36);
  g.lineStyle(3, 0x4a3b2c, 1);
  g.lineBetween(T / 2, T / 2, 10, 50); g.lineBetween(T / 2, T / 2, 50, 50); g.lineBetween(T / 2, T / 2, T / 2, 8);
  g.fillStyle(0x221e1b, 1); g.fillCircle(T / 2, T / 2, 17);
  g.lineStyle(3, 0x7a6448, 1); g.strokeCircle(T / 2, T / 2, 17);
  g.fillStyle(0x120c0a, 1); g.fillCircle(T / 2, T / 2, 12);
  for (let i = 0; i < 6; i++) { g.fillStyle(0x2a2420, 1); g.fillCircle(T / 2 - 8 + rng() * 16, T / 2 - 8 + rng() * 16, 2 + rng() * 2); }
  gen('brazier', T, T);
  for (let i = 0; i < 9; i++) { g.fillStyle(rng() < 0.5 ? 0xe8a33d : 0xc0501c, 1); g.fillCircle(6 + rng() * 12, 6 + rng() * 12, 2 + rng() * 2.5); }
  g.fillStyle(0xffd27a, 1); g.fillCircle(12, 12, 3);
  gen('coals', 24, 24);

  // reliquary chest
  const chest = (open) => {
    floorBase(2);
    g.fillStyle(0x000000, 0.45); g.fillRoundedRect(12, 20, 42, 30, 4);
    g.fillStyle(0x3b2a1d, 1); g.fillRoundedRect(9, 16, 42, 30, 4);
    g.fillStyle(0x4f3826, 1); g.fillRoundedRect(11, 18, 38, 12, 3);
    g.lineStyle(2, 0xa38a5c, 1); g.strokeRoundedRect(9, 16, 42, 30, 4);
    g.lineBetween(9, 30, 51, 30);
    g.lineBetween(20, 16, 20, 46); g.lineBetween(40, 16, 40, 46);
    if (open) { g.fillStyle(0x0a0705, 1); g.fillRect(12, 19, 36, 9); g.fillStyle(0xe8a33d, 0.4); g.fillRect(14, 22, 32, 3); }
    else { g.fillStyle(0xe8a33d, 1); g.fillRect(27, 26, 6, 8); g.fillStyle(0x6b1818, 1); g.fillCircle(30, 38, 3); }
  };
  chest(false); gen('chest', T, T);
  chest(true); gen('chestOpen', T, T);

  // light & particles
  for (let r = 128; r > 2; r -= 2) { g.fillStyle(0xffffff, 0.011 + (128 - r) / 128 * 0.008); g.fillCircle(128, 128, r); }
  gen('glow', 256, 256);
  g.fillStyle(0xffffff, 0.45); g.fillCircle(4, 4, 4); g.fillStyle(0xffffff, 1); g.fillCircle(4, 4, 2.2);
  gen('spark', 8, 8);
  g.fillStyle(0xffffff, 1); g.fillCircle(3, 3, 3); gen('drop', 6, 6);
  for (let r = 8; r > 0; r--) { g.fillStyle(0xffffff, 0.08); g.fillCircle(8, 8, r); }
  gen('smoke', 16, 16);
  g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 3, 3); gen('mote', 3, 3);
  // eyes in the dark
  g.fillStyle(0xff5a3a, 0.25); g.fillCircle(8, 6, 6); g.fillCircle(24, 6, 6);
  g.fillStyle(0xff7a4a, 1); g.fillEllipse(8, 6, 6, 4); g.fillEllipse(24, 6, 6, 4);
  g.fillStyle(0xffe0b0, 1); g.fillCircle(8, 6, 1.2); g.fillCircle(24, 6, 1.2);
  gen('eyes', 32, 12);
  // lantern
  g.fillStyle(0x000000, 0.4); g.fillEllipse(13, 25, 18, 6);
  g.fillStyle(0x6b5a45, 1); g.fillRect(5, 6, 16, 18); g.fillRect(9, 1, 8, 5);
  g.fillStyle(0xffd27a, 1); g.fillRect(8, 9, 10, 12);
  g.fillStyle(0xfff3c9, 1); g.fillRect(11, 12, 4, 6);
  g.lineStyle(1.5, 0x2a2017, 1); g.lineBetween(13, 9, 13, 21); g.strokeRect(5, 6, 16, 18);
  gen('lantern', 26, 28);
  // fate token
  g.fillStyle(0x000000, 0.4); g.fillCircle(15, 17, 13);
  g.fillStyle(0x8a5a1c, 1); g.fillCircle(14, 14, 13);
  g.fillStyle(0xe8a33d, 1); g.fillCircle(14, 14, 11);
  g.fillStyle(0xffd27a, 1);
  g.fillPoints([{ x: 14, y: 5 }, { x: 16.5, y: 12 }, { x: 23, y: 14 }, { x: 16.5, y: 16 }, { x: 14, y: 23 }, { x: 11.5, y: 16 }, { x: 5, y: 14 }, { x: 11.5, y: 12 }], true);
  gen('fate', 30, 30);
  g.fillStyle(0x6e7a7a, 1); g.fillCircle(9, 9, 8); g.fillStyle(0xc9d4d2, 1); g.fillCircle(9, 9, 6.5);
  g.lineStyle(1, 0x6e7a7a, 1); g.strokeCircle(9, 9, 4);
  gen('silver', 18, 18);

  // board vignette
  const bw = 13 * T, bh = 9 * T;
  for (let i = 0; i < 40; i++) {
    g.fillStyle(0x000000, 0.022);
    const inset = i * 3;
    g.fillRect(0, 0, bw, 90 - inset > 0 ? 90 - inset : 0);
    g.fillRect(0, bh - Math.max(0, 90 - inset), bw, Math.max(0, 90 - inset));
    g.fillRect(0, 0, Math.max(0, 110 - inset), bh);
    g.fillRect(bw - Math.max(0, 110 - inset), 0, Math.max(0, 110 - inset), bh);
  }
  gen('vignette', bw, bh);

  // ---- skill icons (40x40, bone line art) ----
  const icon = (k, draw) => { draw(); gen(`ic_${k}`, 40, 40); };
  const L = (w = 2.5, c = C.bone, a = 1) => g.lineStyle(w, c, a);
  icon('hammer', () => { L(3); g.lineBetween(10, 32, 26, 16); g.fillStyle(C.bone, 1); g.fillRoundedRect(20, 6, 16, 12, 2); g.fillStyle(C.teal, 1); g.fillRect(23, 9, 10, 2); });
  icon('shove', () => { L(3); g.lineBetween(6, 20, 28, 20); g.fillStyle(C.bone, 1); g.fillTriangle(26, 12, 36, 20, 26, 28); L(2, C.teal); g.beginPath(); g.arc(10, 30, 6, 3.4, 6.0); g.strokePath(); });
  icon('brace', () => { g.fillStyle(C.bone, 1); g.fillPoints([{ x: 8, y: 6 }, { x: 32, y: 6 }, { x: 32, y: 20 }, { x: 20, y: 35 }, { x: 8, y: 20 }], true); g.fillStyle(C.teal, 1); g.fillRect(18, 9, 4, 20); });
  icon('bolt', () => { g.fillStyle(C.dread, 1); g.fillCircle(27, 13, 7); L(3, C.dread, 0.7); g.lineBetween(6, 34, 22, 18); L(2, C.bone, 0.6); g.lineBetween(10, 34, 23, 22); });
  icon('mark', () => { L(2.5); g.strokeEllipse(20, 20, 30, 16); g.fillStyle(C.amber, 1); g.fillCircle(20, 20, 5); g.fillStyle(C.bone, 1); g.fillCircle(20, 20, 2); });
  icon('knell', () => { g.fillStyle(C.bone, 1); g.fillPoints([{ x: 14, y: 8 }, { x: 26, y: 8 }, { x: 30, y: 26 }, { x: 10, y: 26 }], true); g.fillRect(8, 26, 24, 3); g.fillCircle(20, 32, 3); L(2, C.amber); g.lineBetween(33, 12, 37, 8); g.lineBetween(34, 20, 38, 20); });
  icon('toll', () => { g.fillStyle(C.amber, 1); g.fillPoints([{ x: 15, y: 10 }, { x: 25, y: 10 }, { x: 28, y: 25 }, { x: 12, y: 25 }], true); L(2, C.bone, 0.8); g.strokeCircle(20, 20, 16); L(1.5, C.bone, 0.4); g.strokeCircle(20, 20, 19); });
  icon('chime', () => { L(2, C.dread); for (let i = 0; i < 3; i++) g.lineBetween(10 + i * 9, 8, 10 + i * 9, 24 + i * 3); g.fillStyle(C.bone, 1); g.fillCircle(10, 26, 3); g.fillCircle(19, 29, 3); g.fillCircle(28, 32, 3); L(2, C.bone); g.lineBetween(6, 8, 34, 8); });
  icon('stand', () => { g.fillStyle(C.bone, 1); g.fillPoints([{ x: 12, y: 6 }, { x: 28, y: 6 }, { x: 28, y: 20 }, { x: 20, y: 32 }, { x: 12, y: 20 }], true); L(2.5, C.amber); g.beginPath(); g.arc(20, 20, 17, 2.6, 3.7); g.strokePath(); g.beginPath(); g.arc(20, 20, 17, -0.55, 0.55); g.strokePath(); g.fillStyle(C.teal, 1); g.fillRect(18, 9, 4, 17); });
  icon('chainbolt', () => { L(3, C.dread); g.beginPath(); g.moveTo(4, 30); g.lineTo(14, 18); g.lineTo(18, 24); g.lineTo(28, 10); g.lineTo(32, 16); g.lineTo(37, 6); g.strokePath(); g.fillStyle(C.bone, 1); g.fillCircle(14, 18, 3); g.fillCircle(28, 10, 3); g.fillCircle(37, 6, 2); });
  icon('hour', () => { L(2.5, C.amber); g.strokeCircle(20, 20, 15); L(3, C.bone); g.lineBetween(20, 20, 20, 9); g.lineBetween(20, 20, 13, 23); g.fillStyle(C.amberHot, 1); g.fillCircle(20, 20, 2.5); for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.fillStyle(C.bone, 0.8); g.fillCircle(20 + Math.cos(a) * 12, 20 + Math.sin(a) * 12, 1); } });
  icon('lantern', () => { g.fillStyle(0x6b5a45, 1); g.fillRect(13, 10, 14, 18); g.fillStyle(C.amberHot, 1); g.fillRect(16, 13, 8, 12); L(2, C.bone, 0.7); g.beginPath(); g.arc(20, 30, 16, 3.6, 5.8); g.strokePath(); });
  icon('kindle', () => { g.fillStyle(C.amber, 1); g.fillTriangle(20, 6, 30, 26, 10, 26); g.fillStyle(C.amberHot, 1); g.fillTriangle(20, 14, 25, 26, 15, 26); g.fillStyle(C.bone, 1); g.fillRect(9, 27, 22, 5); });
  icon('chest', () => { g.fillStyle(0x7a5a38, 1); g.fillRoundedRect(7, 13, 26, 18, 3); L(2, C.amber); g.strokeRoundedRect(7, 13, 26, 18, 3); g.lineBetween(7, 21, 33, 21); g.fillStyle(C.amber, 1); g.fillRect(18, 18, 4, 6); });
  icon('undo', () => { g.lineStyle(4, C.bone, 1); g.beginPath(); g.arc(22, 22, 11, Math.PI * 1.05, Math.PI * 2.4); g.strokePath(); g.fillStyle(C.bone, 1); g.fillTriangle(4, 20, 16, 14, 14, 27); });
  icon('help', () => { g.fillStyle(C.bone, 1); g.fillTriangle(20, 4, 31, 16, 9, 16); g.fillRect(16, 15, 8, 12); g.fillStyle(0x8fdf93, 1); g.fillRect(8, 29, 24, 5); g.fillRect(17, 25, 6, 13); });
  icon('item', () => { g.fillStyle(C.bone, 1); g.fillRoundedRect(14, 6, 12, 6, 2); g.fillStyle(C.teal, 1); g.fillCircle(20, 24, 11); g.fillStyle(C.dread, 1); g.fillCircle(17, 21, 4); });
  icon('move', () => { L(3); g.lineBetween(8, 30, 30, 10); g.fillStyle(C.bone, 1); g.fillTriangle(24, 6, 34, 6, 34, 16); g.fillCircle(9, 30, 3); });
  icon('end', () => { L(3, C.amber); g.beginPath(); g.arc(20, 20, 13, -1.2, 4.0); g.strokePath(); g.fillStyle(C.amber, 1); g.fillTriangle(30, 4, 34, 14, 24, 13); });

  // ---- item icons (white, tinted by rarity) ----
  const item = (k, draw) => { draw(); gen(`it_${k}`, 48, 48); };
  const W = 0xffffff;
  item('weapon', () => { g.lineStyle(4, W, 1); g.lineBetween(12, 38, 34, 14); g.fillStyle(W, 1); g.fillRoundedRect(28, 6, 14, 14, 3); g.lineStyle(3, W, 1); g.lineBetween(10, 30, 18, 38); });
  item('charm', () => { g.lineStyle(2, W, 0.8); g.beginPath(); g.arc(24, 14, 12, 3.4, 6.0); g.strokePath(); g.fillStyle(W, 1); g.fillCircle(24, 30, 10); g.fillStyle(0x000000, 0.35); g.fillCircle(24, 30, 5); });
  item('relic', () => { g.fillStyle(W, 1); g.fillPoints([{ x: 14, y: 8 }, { x: 34, y: 8 }, { x: 30, y: 24 }, { x: 18, y: 24 }], true); g.fillRect(22, 24, 4, 10); g.fillRoundedRect(14, 34, 20, 5, 2); });
  item('consumable', () => { g.fillStyle(W, 1); g.fillRoundedRect(19, 6, 10, 8, 2); g.fillCircle(24, 28, 13); g.fillStyle(0x000000, 0.3); g.fillCircle(20, 24, 4); });

  // ---- map node icons ----
  const node = (k, draw) => { draw(); gen(`nd_${k}`, 44, 44); };
  node('fight', () => { g.lineStyle(4, W, 1); g.lineBetween(10, 34, 34, 10); g.lineBetween(10, 10, 34, 34); g.fillStyle(W, 1); g.fillCircle(10, 34, 4); g.fillCircle(34, 34, 4); });
  node('elite', () => { g.fillStyle(W, 1); g.fillCircle(22, 18, 12); g.fillRect(14, 26, 16, 8); g.fillStyle(0x000000, 0.7); g.fillCircle(17, 17, 3.5); g.fillCircle(27, 17, 3.5); });
  node('event', () => { g.lineStyle(4, W, 1); g.beginPath(); g.arc(22, 16, 8, 3.3, 7.6); g.strokePath(); g.lineBetween(22, 24, 22, 29); g.fillStyle(W, 1); g.fillCircle(22, 36, 3); });
  node('rest', () => { g.fillStyle(W, 1); g.fillTriangle(22, 6, 32, 30, 12, 30); g.lineStyle(4, W, 1); g.lineBetween(8, 36, 36, 30); g.lineBetween(8, 30, 36, 36); });
  node('shop', () => { g.fillStyle(W, 1); g.fillCircle(22, 22, 14); g.fillStyle(0x000000, 0.5); g.fillCircle(22, 22, 9); g.fillStyle(W, 1); g.fillRect(20, 14, 4, 16); });
  node('treasure', () => { g.fillStyle(W, 1); g.fillRoundedRect(8, 14, 28, 20, 3); g.fillStyle(0x000000, 0.5); g.fillRect(8, 22, 28, 2); g.fillRect(20, 18, 4, 8); });
  node('boss', () => { g.fillStyle(W, 1); g.fillPoints([{ x: 8, y: 34 }, { x: 8, y: 14 }, { x: 15, y: 22 }, { x: 22, y: 8 }, { x: 29, y: 22 }, { x: 36, y: 14 }, { x: 36, y: 34 }], true); });

  // ---- per-item icons (white, tinted by rarity) ----
  const tri = (pts) => pts.map(([x, y]) => ({ x, y }));
  item('maul', () => { g.lineStyle(4, W, 1); g.lineBetween(10, 40, 30, 18); g.fillStyle(W, 1); g.fillRoundedRect(24, 6, 18, 16, 3); g.fillStyle(0x000000, 0.35); g.fillRect(27, 12, 12, 3); });
  item('anchor', () => { g.lineStyle(4, W, 1); g.lineBetween(24, 8, 24, 40); g.lineBetween(14, 16, 34, 16); g.beginPath(); g.arc(24, 28, 14, 0.2, Math.PI - 0.2); g.strokePath(); g.fillStyle(W, 1); g.fillCircle(24, 7, 4); });
  item('book', () => { g.fillStyle(W, 1); g.fillRoundedRect(10, 8, 28, 34, 3); g.fillStyle(0x000000, 0.35); g.fillRect(14, 12, 3, 26); g.fillRect(21, 16, 13, 2); g.fillRect(21, 22, 13, 2); g.fillStyle(W, 1); g.fillRect(36, 22, 6, 6); });
  item('bell', () => { g.fillStyle(W, 1); g.fillPoints(tri([[18, 10], [30, 10], [36, 32], [12, 32]]), true); g.fillRect(9, 32, 30, 4); g.fillCircle(24, 40, 4); g.fillRect(22, 4, 4, 7); });
  item('thimble', () => { g.fillStyle(W, 1); g.fillRoundedRect(14, 12, 20, 28, { tl: 10, tr: 10, bl: 2, br: 2 }); g.fillStyle(0x000000, 0.3); for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) g.fillCircle(18 + j * 6, 18 + i * 6, 1.4); });
  item('wraps', () => { g.lineStyle(5, W, 1); g.beginPath(); g.moveTo(8, 36); for (let i = 0; i <= 8; i++) g.lineTo(8 + i * 4, 36 - i * 3 + Math.sin(i * 1.4) * 6); g.strokePath(); g.fillStyle(W, 1); g.fillCircle(40, 10, 4); });
  item('candle', () => { g.fillStyle(W, 1); g.fillRect(18, 18, 12, 24); g.fillTriangle(24, 4, 29, 15, 19, 15); g.fillStyle(0x000000, 0.25); g.fillRect(25, 18, 3, 24); });
  item('bone', () => { g.fillStyle(W, 1); g.fillRect(14, 21, 20, 6); g.fillCircle(12, 19, 5); g.fillCircle(12, 29, 5); g.fillCircle(36, 19, 5); g.fillCircle(36, 29, 5); });
  item('die', () => { g.fillStyle(W, 1); g.fillPoints(tri([[24, 6], [40, 16], [40, 34], [24, 44], [8, 34], [8, 16]]), true); g.fillStyle(0x000000, 0.4); g.fillCircle(24, 24, 3); g.fillCircle(16, 18, 2.4); g.fillCircle(32, 32, 2.4); });
  item('shard', () => { g.fillStyle(W, 1); g.fillPoints(tri([[22, 4], [36, 18], [30, 44], [14, 38], [10, 16]]), true); g.fillStyle(0x000000, 0.25); g.fillPoints(tri([[22, 4], [30, 20], [14, 38]]), true); });
  item('locket', () => { g.lineStyle(2, W, 0.9); g.beginPath(); g.arc(24, 12, 9, 3.3, 6.1); g.strokePath(); g.fillStyle(W, 1); g.fillPoints(tri([[24, 18], [36, 28], [24, 44], [12, 28]]), true); g.fillStyle(0x000000, 0.35); g.fillCircle(24, 30, 4); });
  item('pearl', () => { g.fillStyle(W, 1); g.fillCircle(24, 26, 14); g.fillStyle(0x000000, 0.5); g.fillCircle(24, 26, 10); g.fillStyle(W, 0.9); g.fillCircle(20, 22, 3); });
  item('heart', () => { g.fillStyle(W, 1); g.fillCircle(17, 20, 9); g.fillCircle(31, 20, 9); g.fillTriangle(9, 23, 39, 23, 24, 42); g.fillStyle(0x000000, 0.25); g.fillCircle(31, 20, 4); });
  item('eye', () => { g.fillStyle(W, 1); g.fillEllipse(24, 24, 40, 22); g.fillStyle(0x000000, 0.6); g.fillCircle(24, 24, 8); g.fillStyle(W, 1); g.fillCircle(21, 21, 2.5); });
  item('rope', () => { g.lineStyle(4, W, 1); g.strokeCircle(24, 30, 11); g.lineBetween(24, 4, 24, 19); g.lineStyle(2, 0x000000, 0.3); g.lineBetween(15, 24, 33, 36); });
  item('r_bell', () => { g.fillStyle(W, 1); g.fillPoints(tri([[16, 8], [32, 8], [38, 34], [10, 34]]), true); g.fillRect(6, 34, 36, 4); g.lineStyle(2, W, 0.8); g.strokeCircle(24, 22, 20); });
  item('r_wick', () => { g.fillStyle(W, 1); g.fillRect(18, 22, 12, 20); g.fillStyle(W, 1); g.fillEllipse(24, 12, 12, 18); g.fillStyle(0x000000, 0.35); g.fillEllipse(24, 14, 5, 9); });
  item('r_coin', () => { g.fillStyle(W, 1); g.fillCircle(24, 24, 16); g.fillStyle(0x000000, 0.35); g.fillCircle(24, 24, 11); g.fillStyle(W, 1); g.fillTriangle(24, 15, 30, 31, 18, 31); });
  item('r_charter', () => { g.fillStyle(W, 1); g.fillRect(10, 10, 28, 30); g.fillCircle(10, 25, 5); g.fillCircle(38, 25, 5); g.fillStyle(0x000000, 0.35); for (let i = 0; i < 4; i++) g.fillRect(15, 15 + i * 6, 18, 2); });
  item('r_lantern', () => { g.fillStyle(W, 1); g.fillRect(14, 12, 20, 26); g.fillRect(19, 6, 10, 6); g.fillStyle(0x000000, 0.35); g.fillRect(18, 16, 12, 18); g.fillStyle(W, 1); g.fillRect(22, 20, 4, 10); });
  item('r_prayer', () => { g.fillStyle(W, 1); g.fillRect(21, 6, 6, 36); g.fillRect(12, 14, 24, 6); g.lineStyle(2, W, 0.6); g.strokeCircle(24, 17, 14); });
  item('r_tongue', () => { g.fillStyle(W, 1); g.fillEllipse(24, 22, 30, 22); g.fillStyle(0x000000, 0.55); g.fillEllipse(24, 24, 18, 10); g.fillStyle(W, 1); g.fillEllipse(24, 30, 10, 12); });
  item('r_hourglass', () => { g.fillStyle(W, 1); g.fillRect(12, 6, 24, 4); g.fillRect(12, 38, 24, 4); g.fillTriangle(14, 10, 34, 10, 24, 24); g.fillTriangle(14, 38, 34, 38, 24, 24); g.lineStyle(2, 0x000000, 0.5); g.lineBetween(18, 14, 30, 34); });
  item('r_satchel', () => { g.fillStyle(W, 1); g.fillRoundedRect(8, 16, 32, 24, 5); g.lineStyle(3, W, 1); g.beginPath(); g.arc(24, 16, 10, 3.3, 6.1); g.strokePath(); g.fillStyle(0x000000, 0.35); g.fillRect(8, 22, 32, 4); });
  item('r_blood', () => { g.fillStyle(W, 1); g.fillCircle(24, 30, 12); g.fillTriangle(13, 26, 35, 26, 24, 6); });
  item('c_salts', () => { g.fillStyle(W, 1); g.fillRoundedRect(16, 14, 16, 28, 4); g.fillRect(19, 8, 10, 6); g.fillStyle(0x000000, 0.3); g.fillCircle(24, 30, 4); });
  item('c_bandage', () => { g.fillStyle(W, 1); g.fillCircle(22, 26, 14); g.fillRect(22, 30, 20, 10); g.fillStyle(0x000000, 0.35); g.fillCircle(22, 26, 5); });
  item('c_oil', () => { g.fillStyle(W, 1); g.fillCircle(24, 30, 13); g.fillRect(20, 8, 8, 12); g.fillStyle(0x000000, 0.3); g.fillTriangle(24, 22, 30, 36, 18, 36); g.lineStyle(2, W, 1); g.lineBetween(28, 8, 34, 4); });
  item('c_holy', () => { g.fillStyle(W, 1); g.fillCircle(24, 30, 13); g.fillRect(20, 8, 8, 12); g.fillStyle(0x000000, 0.35); g.fillRect(22, 24, 4, 14); g.fillRect(18, 28, 12, 4); });
  item('c_flare', () => { g.fillStyle(W, 1); g.fillRect(20, 16, 8, 26); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.lineStyle(2, W, 1); g.lineBetween(24 + Math.cos(a) * 6, 10 + Math.sin(a) * 6, 24 + Math.cos(a) * 11, 10 + Math.sin(a) * 11); } });

  // ---- intent icons ----
  const intent = (k, draw) => { draw(); gen(`in_${k}`, 40, 40); };
  intent('attack', () => { g.lineStyle(4, W, 1); g.lineBetween(8, 32, 32, 8); g.lineBetween(14, 24, 20, 30); g.fillStyle(W, 1); g.fillTriangle(28, 4, 36, 4, 36, 12); });
  intent('shoot', () => { g.lineStyle(3, W, 1); g.lineBetween(6, 34, 30, 10); g.fillStyle(W, 1); g.fillTriangle(26, 4, 36, 4, 36, 14); g.lineBetween(6, 34, 10, 26); g.lineBetween(6, 34, 14, 32); });
  intent('pull', () => { g.lineStyle(4, W, 1); g.beginPath(); g.arc(20, 18, 10, -0.3, 3.0); g.strokePath(); g.lineBetween(30, 16, 30, 4); g.fillStyle(W, 1); g.fillTriangle(6, 20, 14, 18, 10, 28); });
  intent('snuff', () => { g.fillStyle(W, 1); g.fillTriangle(20, 6, 28, 22, 12, 22); g.fillRect(12, 24, 16, 10); g.lineStyle(4, 0xd0402c, 1); g.lineBetween(6, 6, 34, 34); });
  intent('cleave', () => { g.lineStyle(4, W, 1); g.beginPath(); g.arc(20, 22, 14, 3.4, 6.0); g.strokePath(); g.fillStyle(W, 1); g.fillTriangle(30, 8, 38, 14, 30, 18); });
  intent('raise', () => { g.lineStyle(4, W, 1); g.lineBetween(20, 34, 20, 8); g.fillStyle(W, 1); g.fillTriangle(10, 14, 30, 14, 20, 2); g.lineStyle(2, W, 0.6); g.lineBetween(6, 36, 34, 36); });
  intent('litany', () => { g.fillStyle(W, 1); g.fillRect(18, 4, 4, 32); g.fillRect(10, 26, 20, 4); g.lineStyle(2, W, 0.7); g.strokeCircle(20, 20, 16); });
  intent('move', () => { g.fillStyle(W, 1); g.fillCircle(10, 20, 3); g.fillCircle(20, 20, 3); g.fillCircle(30, 20, 3); });
  intent('dazed', () => { g.lineStyle(3, W, 1); for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(20, 20, 4 + i * 5, i, i + 4); g.strokePath(); } });
  intent('sink', () => { g.lineStyle(3, W, 1); for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(20, 14 + i * 8, 12, 0.3, 2.8); g.strokePath(); } });
  intent('lamp', () => { g.fillStyle(0xff8a3a, 1); g.fillTriangle(20, 2, 30, 22, 10, 22); g.fillStyle(0xffd27a, 1); g.fillTriangle(20, 10, 25, 22, 15, 22); g.fillStyle(W, 1); g.fillRect(12, 24, 16, 10); });
  intent('charge', () => { g.fillStyle(W, 1); g.fillTriangle(4, 6, 18, 20, 4, 34); g.fillTriangle(18, 6, 32, 20, 18, 34); g.fillRect(32, 8, 4, 24); });
  intent('dirge', () => { g.fillStyle(W, 1); g.fillCircle(12, 30, 5); g.fillRect(15, 6, 3, 25); g.fillRect(15, 6, 14, 4); g.lineStyle(2, W, 0.8); g.beginPath(); g.arc(28, 22, 6, -0.9, 0.9); g.strokePath(); g.beginPath(); g.arc(28, 22, 11, -0.9, 0.9); g.strokePath(); });
  intent('ward', () => { g.fillStyle(0x8fdf93, 1); g.fillPoints([{ x: 20, y: 4 }, { x: 34, y: 10 }, { x: 31, y: 26 }, { x: 20, y: 36 }, { x: 9, y: 26 }, { x: 6, y: 10 }], true); g.fillStyle(0x0d1719, 1); g.fillRect(18, 10, 4, 20); });
  const wavy = (y0, a = 1) => { g.lineStyle(4, W, a); g.beginPath(); for (let x = 4; x <= 36; x += 2) { const y = y0 + Math.sin(x / 4) * 3; if (x === 4) g.moveTo(x, y); else g.lineTo(x, y); } g.strokePath(); };
  intent('wave', () => { wavy(10); wavy(20); wavy(30, 0.7); });
  intent('dive', () => { g.fillStyle(W, 1); g.fillRect(17, 2, 6, 14); g.fillTriangle(9, 14, 31, 14, 20, 25); wavy(31, 0.85); });
  intent('heal', () => { g.fillStyle(0x8fdf93, 1); g.fillRect(16, 6, 8, 28); g.fillRect(6, 16, 28, 8); });

  // ---- UI icons ----
  g.fillStyle(W, 1); g.fillRect(8, 15, 8, 10); g.fillTriangle(14, 15, 24, 6, 24, 34); g.fillTriangle(14, 25, 24, 34, 24, 6);
  g.lineStyle(3, W, 1); g.beginPath(); g.arc(24, 20, 7, -0.9, 0.9); g.strokePath(); g.beginPath(); g.arc(24, 20, 13, -0.9, 0.9); g.strokePath();
  gen('ic_sound', 40, 40);
  g.fillStyle(W, 1); g.fillRect(8, 15, 8, 10); g.fillTriangle(14, 15, 24, 6, 24, 34); g.fillTriangle(14, 25, 24, 34, 24, 6);
  g.lineStyle(3, 0xd0402c, 1); g.lineBetween(28, 12, 38, 28); g.lineBetween(38, 12, 28, 28);
  gen('ic_mute', 40, 40);

  // ---- room props (floor decals) ----
  const prop = (k, draw) => { draw(); gen(`prop_${k}`, 48, 48); };
  prop('pews0', () => { g.fillStyle(0x2a1d14, 1); g.fillRect(4, 18, 40, 10); g.fillStyle(0x3b2a1d, 1); g.fillRect(4, 14, 40, 5); g.fillStyle(0x000000, 0.3); g.fillRect(4, 28, 40, 3); });
  prop('pews1', () => { g.fillStyle(0x2a1d14, 1); g.fillPoints(tri([[4, 24], [30, 10], [44, 20], [18, 34]]), true); g.fillStyle(0x3b2a1d, 1); g.fillPoints(tri([[4, 24], [30, 10], [32, 14], [6, 28]]), true); });
  prop('pews2', () => { g.fillStyle(0x6b5a45, 0.8); g.fillRect(10, 20, 26, 6); g.fillStyle(0xd9cfb8, 0.7); g.fillRect(14, 14, 6, 6); g.fillRect(24, 16, 8, 4); });
  prop('bones0', () => { g.fillStyle(0xb8ae98, 0.85); g.fillCircle(22, 22, 8); g.fillStyle(0x0a0a0a, 0.8); g.fillCircle(19, 21, 2); g.fillCircle(25, 21, 2); g.fillStyle(0xb8ae98, 0.8); g.fillRect(6, 34, 20, 3); g.fillRect(28, 30, 14, 3); });
  prop('bones1', () => { g.fillStyle(0xb8ae98, 0.8); for (let i = 0; i < 5; i++) { g.fillRect(8 + i * 6, 14 + (i % 2) * 10, 16, 3); } });
  prop('bones2', () => { g.fillStyle(0xb8ae98, 0.85); g.fillCircle(14, 30, 6); g.fillCircle(32, 26, 7); g.fillStyle(0x0a0a0a, 0.7); g.fillCircle(13, 29, 1.5); g.fillCircle(31, 25, 1.8); g.fillCircle(34, 25, 1.8); });
  prop('statues0', () => { g.fillStyle(0x5d6461, 1); g.fillCircle(18, 18, 9); g.fillStyle(0x4a5250, 1); g.fillRect(14, 26, 22, 12); g.fillStyle(0x000000, 0.3); g.fillCircle(16, 17, 2); });
  prop('statues1', () => { g.fillStyle(0x5d6461, 1); g.fillPoints(tri([[6, 30], [20, 12], [40, 18], [34, 36]]), true); g.fillStyle(0x6c7370, 1); g.fillCircle(30, 18, 6); });
  prop('statues2', () => { g.fillStyle(0x4a5250, 1); g.fillRect(8, 16, 10, 10); g.fillRect(24, 24, 14, 8); g.fillRect(16, 32, 8, 6); });
  prop('tombs0', () => { g.fillStyle(0x3d4442, 1); g.fillRoundedRect(6, 8, 36, 32, 4); g.lineStyle(2, 0x6c7370, 0.7); g.lineBetween(24, 12, 24, 36); g.lineBetween(14, 20, 34, 20); });
  prop('tombs1', () => { g.fillStyle(0x3d4442, 1); g.fillRoundedRect(8, 6, 32, 36, { tl: 16, tr: 16, bl: 2, br: 2 }); g.fillStyle(0x000000, 0.3); g.fillRect(14, 24, 20, 2); g.fillRect(14, 29, 16, 2); });
  prop('tombs2', () => { g.fillStyle(0xd9cfb8, 0.8); g.fillRect(22, 10, 4, 26); g.fillRect(16, 16, 16, 4); g.fillStyle(0x3d4442, 1); g.fillRect(14, 34, 20, 6); });
  prop('chains0', () => { g.lineStyle(3, 0x6e7774, 1); for (let i = 0; i < 5; i++) g.strokeEllipse(10 + i * 7, 14 + i * 5, 8, 5); });
  prop('chains1', () => { g.lineStyle(3, 0x6e7774, 1); g.strokeCircle(24, 24, 12); g.lineStyle(3, 0x4a5250, 1); g.lineBetween(10, 10, 38, 38); });
  prop('chains2', () => { g.fillStyle(0x4a3b2c, 1); g.fillRect(8, 20, 32, 8); g.lineStyle(2, 0x6e7774, 1); g.strokeRect(8, 20, 32, 8); });

  // fallen hero marker: a snuffed candle and a small cairn
  g.fillStyle(0x3d4442, 1); g.fillCircle(18, 34, 7); g.fillCircle(30, 35, 6); g.fillCircle(24, 28, 6);
  g.fillStyle(0xd9cfb8, 1); g.fillRect(22, 10, 5, 16);
  g.lineStyle(1, 0x8f887a, 0.8); g.lineBetween(24.5, 10, 26, 4); g.lineBetween(26, 4, 25, 0);
  gen('fallen', 48, 48);

  g.destroy();
}
