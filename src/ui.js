import { sfx } from './audio.js';

// Palette: abyss teal, drowned stone, candle amber, bone, wound red (+ shades of each).
export const C = {
  void: 0x050b0c,
  abyss: 0x0e2a2e,
  abyssDeep: 0x081a1d,
  panel: 0x0b1517,
  panelEdge: 0x24393a,
  stone: 0x4a5250,
  stoneDark: 0x2c3332,
  amber: 0xe8a33d,
  amberHot: 0xffd27a,
  bone: 0xd9cfb8,
  boneDim: 0x8f887a,
  red: 0x8c1c1c,
  redHot: 0xd0402c,
  teal: 0x2d6b6b,
  dread: 0x7fb8ae,
};
export const HEX = {
  amber: '#e8a33d', amberHot: '#ffd27a', bone: '#d9cfb8', boneDim: '#8f887a',
  red: '#d0402c', teal: '#7fb8ae', dread: '#9fd6cb', ink: '#050b0c',
};
export const FONT_H = 'Cinzel, Georgia, serif';
export const FONT_B = 'Spectral, Georgia, serif';

export function makeButton(scene, x, y, w, h, label, onClick, opts = {}) {
  const c = scene.add.container(x, y);
  const bg = scene.add.graphics();
  const txt = scene.add.text(0, opts.sub ? -7 : 0, label, {
    fontFamily: FONT_H, fontSize: `${opts.size ?? 15}px`, color: opts.color ?? HEX.bone,
    fontStyle: '700', align: 'center',
  }).setOrigin(0.5);
  const sub = scene.add.text(0, 12, opts.sub ?? '', {
    fontFamily: FONT_B, fontSize: '12px', color: HEX.boneDim, fontStyle: 'italic',
  }).setOrigin(0.5);
  c.add([bg, txt, sub]);
  c.enabled = true;
  c.on_ = false;
  const fill = opts.fill ?? 0x12201f;
  const stroke = opts.stroke ?? 0x3a5250;
  const draw = (hover) => {
    bg.clear();
    bg.fillStyle(0x000000, 0.35);
    bg.fillRoundedRect(-w / 2 + 2, -h / 2 + 4, w, h, 9);
    bg.fillStyle(hover ? Phaserish(fill, 18) : fill, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 9);
    if (c.on_) {
      bg.fillStyle(C.amber, 0.16);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 9);
    }
    bg.lineStyle(2, hover || c.on_ ? C.amber : stroke, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 9);
    bg.lineStyle(1, 0xffffff, 0.06);
    bg.lineBetween(-w / 2 + 8, -h / 2 + 3, w / 2 - 8, -h / 2 + 3);
  };
  const zone = scene.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
  c.add(zone);
  zone.on('pointerover', () => {
    if (!c.enabled) return;
    draw(true);
    scene.tweens.add({ targets: c, scale: 1.04, duration: 90 });
    sfx.hover();
    opts.onHover?.(true);
  });
  zone.on('pointerout', () => {
    draw(false);
    scene.tweens.add({ targets: c, scale: 1, duration: 90 });
    opts.onHover?.(false);
  });
  zone.on('pointerdown', (p, lx, ly, ev) => {
    ev?.stopPropagation?.();
    if (!c.enabled) return;
    scene.tweens.add({ targets: c, scale: 0.94, duration: 60, yoyo: true });
    sfx.click();
    onClick();
  });
  c.isUi = true;
  c.zone = zone;
  c.setEnabled = (v) => { c.enabled = v; c.setAlpha(v ? 1 : 0.35); if (!v) draw(false); return c; };
  c.setOn = (v) => { c.on_ = v; draw(false); return c; };
  c.setLabel = (s, subText) => { txt.setText(s); if (subText !== undefined) sub.setText(subText); return c; };
  draw(false);
  return c;
}

function Phaserish(color, amt) {
  const r = Math.min(255, ((color >> 16) & 255) + amt);
  const g = Math.min(255, ((color >> 8) & 255) + amt);
  const b = Math.min(255, (color & 255) + amt);
  return (r << 16) | (g << 8) | b;
}

// Draw a unit's emblem centred on (0,0) into a Graphics object.
export function drawGlyph(g, kind, s = 1) {
  const P = (pts) => pts.map(([x, y]) => ({ x: x * s, y: y * s }));
  switch (kind) {
    case 'warden':
      g.fillStyle(C.bone, 1);
      g.fillPoints(P([[-13, -14], [13, -14], [13, 1], [0, 16], [-13, 1]]), true);
      g.lineStyle(2.5 * s, C.teal, 1);
      g.lineBetween(0, -10 * s, 0, 11 * s);
      g.beginPath();
      g.moveTo(-9 * s, -2 * s);
      g.lineTo(-4 * s, -5 * s); g.lineTo(0, -2 * s); g.lineTo(4 * s, -5 * s); g.lineTo(9 * s, -2 * s);
      g.strokePath();
      break;
    case 'scholar':
      g.fillStyle(C.bone, 1);
      g.fillPoints(P([[-15, -6], [-1, -3], [-1, 13], [-15, 10]]), true);
      g.fillPoints(P([[15, -6], [1, -3], [1, 13], [15, 10]]), true);
      g.lineStyle(1.2 * s, C.stoneDark, 1);
      for (let i = 0; i < 3; i++) {
        g.lineBetween(-12 * s, (1 + i * 3.5) * s, -4 * s, (2.5 + i * 3.5) * s);
        g.lineBetween(12 * s, (1 + i * 3.5) * s, 4 * s, (2.5 + i * 3.5) * s);
      }
      g.fillStyle(C.amber, 1);
      g.fillCircle(0, -11 * s, 4 * s);
      g.fillStyle(C.amberHot, 1);
      g.fillCircle(0, -12 * s, 2 * s);
      break;
    case 'cultist':
      // hooded figure holding an unlit lamp on a staff
      g.lineStyle(2 * s, C.boneDim, 1);
      g.lineBetween(11 * s, 15 * s, 11 * s, -14 * s);
      g.fillStyle(C.red, 1);
      g.fillPoints(P([[-2, -16], [10, 12], [-14, 12]]), true);
      g.fillStyle(0x070505, 1);
      g.fillEllipse(-3 * s, 0, 10 * s, 12 * s);
      g.fillStyle(0x6b5a45, 1);
      g.fillRect(8 * s, -20 * s, 7 * s, 8 * s);
      g.fillStyle(0x2a1d14, 1);
      g.fillRect(9.5 * s, -18 * s, 4 * s, 4 * s);
      break;
    case 'snuffer':
      // tall, thin, carrying a bell-capped snuffing pole
      g.fillStyle(0x5e1414, 1);
      g.fillPoints(P([[-4, -18], [6, 14], [-12, 14]]), true);
      g.fillStyle(0x070505, 1);
      g.fillEllipse(-4 * s, -4 * s, 7 * s, 10 * s);
      g.lineStyle(2.5 * s, C.boneDim, 1);
      g.lineBetween(-10 * s, 16 * s, 12 * s, -14 * s);
      g.fillStyle(C.boneDim, 1);
      g.fillPoints(P([[8, -16], [18, -14], [14, -8], [9, -10]]), true);
      break;
    case 'gutter':
      // crouched, long-armed thing with claws
      g.fillStyle(0x7a3a2c, 1);
      g.fillEllipse(0, 4 * s, 22 * s, 16 * s);
      g.fillCircle(0, -7 * s, 7 * s);
      g.lineStyle(2.5 * s, 0x7a3a2c, 1);
      g.lineBetween(-9 * s, 4 * s, -16 * s, 14 * s);
      g.lineBetween(9 * s, 4 * s, 16 * s, 14 * s);
      g.lineStyle(1.5 * s, C.bone, 1);
      g.lineBetween(-16 * s, 14 * s, -19 * s, 12 * s); g.lineBetween(-16 * s, 14 * s, -17 * s, 17 * s);
      g.lineBetween(16 * s, 14 * s, 19 * s, 12 * s); g.lineBetween(16 * s, 14 * s, 17 * s, 17 * s);
      g.fillStyle(0xffd27a, 1);
      g.fillCircle(-3 * s, -8 * s, 1.6 * s); g.fillCircle(3 * s, -8 * s, 1.6 * s);
      break;
    case 'censer':
      // robed monk swinging a smoking censer
      g.fillStyle(0x4a3b2c, 1);
      g.fillPoints(P([[0, -16], [12, 14], [-12, 14]]), true);
      g.fillStyle(0x0a0705, 1);
      g.fillEllipse(0, -4 * s, 9 * s, 10 * s);
      g.lineStyle(1.5 * s, C.boneDim, 1);
      g.lineBetween(8 * s, 0, 15 * s, 10 * s);
      g.fillStyle(C.amber, 1);
      g.fillCircle(16 * s, 12 * s, 4 * s);
      g.fillStyle(0x8fdf93, 0.7);
      g.fillCircle(18 * s, 5 * s, 2.5 * s); g.fillCircle(20 * s, 0, 2 * s);
      break;
    case 'husk':
      g.fillStyle(0x8a9a8f, 1);
      g.fillCircle(0, -3 * s, 13 * s);
      g.fillRect(-7 * s, 6 * s, 14 * s, 7 * s);
      g.fillStyle(0x060909, 1);
      g.fillCircle(-5 * s, -4 * s, 3.8 * s);
      g.fillCircle(5 * s, -4 * s, 3.8 * s);
      g.fillRect(-1 * s, 1 * s, 2 * s, 4 * s);
      g.lineStyle(1.5 * s, C.teal, 1);
      g.lineBetween(-9 * s, 6 * s, -10 * s, 15 * s);
      g.lineBetween(9 * s, 4 * s, 10 * s, 13 * s);
      g.lineBetween(3 * s, 13 * s, 3 * s, 18 * s);
      break;
    case 'ringer':
      g.fillStyle(C.bone, 1);
      g.fillPoints(P([[-7, -12], [7, -12], [11, 8], [-11, 8]]), true);
      g.fillRect(-14 * s, 8 * s, 28 * s, 4 * s);
      g.fillRect(-2 * s, -17 * s, 4 * s, 6 * s);
      g.fillStyle(C.amber, 1);
      g.fillCircle(0, 15 * s, 3.5 * s);
      g.lineStyle(1.5 * s, C.teal, 1);
      g.lineBetween(-5 * s, -6 * s, -6 * s, 4 * s);
      break;
    case 'choir':
      g.fillStyle(0xb7b09a, 1);
      g.fillEllipse(0, -1 * s, 20 * s, 30 * s);
      g.fillStyle(0x060909, 1);
      g.fillEllipse(-4 * s, -6 * s, 4 * s, 6 * s);
      g.fillEllipse(4 * s, -6 * s, 4 * s, 6 * s);
      g.fillEllipse(0, 6 * s, 7 * s, 11 * s);
      g.lineStyle(1.5 * s, C.dread, 0.9);
      g.lineBetween(12 * s, -10 * s, 16 * s, -14 * s);
      g.lineBetween(13 * s, -4 * s, 18 * s, -6 * s);
      break;
    case 'eel':
      g.fillStyle(0x1f4a4a, 1);
      g.fillPoints(P([[0, -16], [13, 13], [-13, 13]]), true);
      g.fillStyle(0x050808, 1);
      g.fillEllipse(0, 1 * s, 10 * s, 12 * s);
      g.fillStyle(0x9fd6cb, 1);
      g.fillCircle(-2 * s, 0, 1.5 * s); g.fillCircle(2 * s, 0, 1.5 * s);
      g.lineStyle(2.2 * s, C.bone, 1);
      g.beginPath();
      g.arc(13 * s, 4 * s, 6 * s, -1.6, 1.9);
      g.strokePath();
      g.lineBetween(13 * s, -2 * s, 13 * s, -14 * s);
      break;
    case 'knight':
      g.fillStyle(0x6e7774, 1);
      g.fillRoundedRect(-13 * s, -15 * s, 26 * s, 28 * s, 9 * s);
      g.fillStyle(0x050707, 1);
      g.fillRect(-10 * s, -5 * s, 20 * s, 4 * s);
      g.fillRect(-1.5 * s, -1 * s, 3 * s, 10 * s);
      g.fillStyle(0x8c3a1c, 0.9);
      g.fillCircle(-7 * s, 7 * s, 2.5 * s); g.fillCircle(8 * s, -10 * s, 2 * s); g.fillCircle(6 * s, 9 * s, 1.5 * s);
      g.fillStyle(C.teal, 1);
      g.fillRect(-2 * s, -20 * s, 4 * s, 6 * s);
      break;
    case 'bishop':
      g.fillStyle(0xcfc5a8, 1);
      g.fillPoints(P([[0, -26], [14, -6], [12, 6], [-12, 6], [-14, -6]]), true);
      g.fillStyle(C.red, 1);
      g.fillRect(-2 * s, -20 * s, 4 * s, 22 * s);
      g.fillRect(-8 * s, -12 * s, 16 * s, 4 * s);
      g.fillStyle(0x050707, 1);
      g.fillEllipse(0, 14 * s, 22 * s, 16 * s);
      g.fillStyle(0xff6a3a, 1);
      g.fillCircle(-5 * s, 13 * s, 2 * s); g.fillCircle(5 * s, 13 * s, 2 * s);
      g.lineStyle(2 * s, C.teal, 1);
      g.lineBetween(-12 * s, 20 * s, -14 * s, 28 * s);
      g.lineBetween(10 * s, 21 * s, 12 * s, 28 * s);
      break;
    default:
      g.fillStyle(C.bone, 1);
      g.fillCircle(0, 0, 10 * s);
  }
}

export function panel(scene, x, y, w, h, { fill = C.panel, alpha = 0.94, stroke = C.panelEdge, r = 12 } = {}) {
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.4);
  g.fillRoundedRect(x + 3, y + 5, w, h, r);
  g.fillStyle(fill, alpha);
  g.fillRoundedRect(x, y, w, h, r);
  g.lineStyle(2, stroke, 1);
  g.strokeRoundedRect(x, y, w, h, r);
  g.lineStyle(1, 0xffffff, 0.05);
  g.strokeRoundedRect(x + 4, y + 4, w - 8, h - 8, Math.max(2, r - 4));
  return g;
}

export const SLOT_LABEL = { weapon: 'Weapon', charm: 'Charm', relic: 'Party Relic', consumable: 'Consumable' };

// A loot / shop card. opts: { w, h, sub (string under rarity), foot (string at bottom), onPick, disabled }
export function makeItemCard(scene, x, y, item, rarityDef, opts = {}) {
  const w = opts.w ?? 220, h = opts.h ?? 270;
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const col = rarityDef.color;
  const draw = (hover) => {
    g.clear();
    g.fillStyle(0x000000, 0.5); g.fillRoundedRect(-w / 2 + 4, -h / 2 + 8, w, h, 14);
    g.fillStyle(0x0d1819, 1); g.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    g.fillStyle(col, hover ? 0.2 : 0.11); g.fillRoundedRect(-w / 2, -h / 2, w, 92, { tl: 14, tr: 14, bl: 0, br: 0 });
    g.lineStyle(hover ? 3 : 2, col, 1); g.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
    g.lineStyle(1, col, 0.35); g.strokeRoundedRect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 10);
  };
  draw(false);
  const glow = scene.add.image(0, -h / 2 + 50, 'glow').setScale(0.42).setTint(col).setAlpha(0.5).setBlendMode('ADD');
  const icon = scene.add.image(0, -h / 2 + 48, `it_${item.icon ?? item.slot}`).setTint(col).setScale(1.1);
  const name = scene.add.text(0, -h / 2 + 100, item.name, {
    fontFamily: FONT_H, fontSize: '17px', color: rarityDef.hex, fontStyle: '700', align: 'center', wordWrap: { width: w - 24 },
  }).setOrigin(0.5, 0);
  const sub = scene.add.text(0, name.y + name.height + 4, opts.sub ?? (item.slot === 'relic' && item.rarity === 'relic' ? 'Party Relic' : `${rarityDef.name} ${SLOT_LABEL[item.slot]}`), {
    fontFamily: FONT_B, fontSize: '13px', color: HEX.boneDim, fontStyle: 'italic', align: 'center',
  }).setOrigin(0.5, 0);
  const body = scene.add.text(0, sub.y + sub.height + 10, item.text, {
    fontFamily: FONT_B, fontSize: '15px', color: HEX.bone, align: 'center', wordWrap: { width: w - 30 }, lineSpacing: 2,
  }).setOrigin(0.5, 0);
  const foot = scene.add.text(0, h / 2 - 16, opts.foot ?? '', {
    fontFamily: FONT_B, fontSize: '12px', color: HEX.boneDim, align: 'center', wordWrap: { width: w - 24 },
  }).setOrigin(0.5, 1);
  c.add([g, glow, icon, name, sub, body, foot]);
  if (opts.onPick) {
    const z = scene.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
    c.add(z);
    z.on('pointerover', () => { if (c.locked) return; draw(true); scene.tweens.add({ targets: c, y: y - 10, scale: 1.03, duration: 140, ease: 'Quad.Out' }); sfx.hover(); });
    z.on('pointerout', () => { if (c.locked) return; draw(false); scene.tweens.add({ targets: c, y, scale: 1, duration: 140, ease: 'Quad.Out' }); });
    z.on('pointerdown', () => { if (c.locked || opts.disabled?.()) { sfx.denied(); return; } sfx.click(); opts.onPick(c); });
  }
  scene.tweens.add({ targets: glow, alpha: 0.25, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  c.cardW = w; c.cardH = h;
  return c;
}

export function floatText(scene, x, y, str, color, { size = 22, rise = 46, dur = 1000, delay = 0, depth = 60 } = {}) {
  const t = scene.add.text(x, y, str, {
    fontFamily: FONT_H, fontSize: `${size}px`, color, fontStyle: '900', stroke: '#050b0c', strokeThickness: 5,
  }).setOrigin(0.5).setDepth(depth).setScale(0.4).setAlpha(0);
  scene.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 160, delay, ease: 'Back.Out' });
  scene.tweens.add({ targets: t, y: y - rise, alpha: 0, duration: dur, delay: delay + 260, ease: 'Quad.In', onComplete: () => t.destroy() });
  return t;
}
