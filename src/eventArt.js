// Pixel-art dioramas for curios, sanctuaries, the Ferryman and vaults, built from the same
// sprite set as the battles: a cathedral wall, a floor (or black water), one lit set piece,
// candles, fog. Each fills a 352x500 frame whose top-left is (x, y).

const FW = 352, FH = 500, FLOOR_Y = 372;
const LOOK = {
  altar: { light: 0xbfd8d2, candles: true },
  confession: { light: 0x6fc2b5, candles: true, eyes: true },
  eels: { light: 0x6fc2b5, water: true, inWater: true },
  pilgrim: { light: 0xffc861, lantern: true },
  mirror: { light: 0xbfd8d2, candles: true },
  font: { light: 0x7fd6ff, water: true },
  rest: { light: 0xffb050, candles: true, fire: true },
  shop: { light: 0x9fc4bc, water: true, lantern: true },
  treasure: { light: 0xffd27a, gold: true },
  floodgate: { light: 0x6fc2b5, water: true },
  choirloft: { light: 0x9fd6cb, candles: true, float: true },
  armour: { light: 0xbfd8d2, water: true },
  dice: { light: 0xffd27a, candles: true },
  library: { light: 0xffc861, candles: true },
  saint: { light: 0xbfd8d2, candles: true, tears: true },
  ferrymanbrother: { light: 0x9fc4bc, water: true, lantern: true },
  cradle: { light: 0xd0402c, candles: true },
};

function glow(scene, x, y, scale, tint, alpha = 0.5) {
  const g = scene.add.image(x, y, 'glow').setScale(scale).setTint(tint).setBlendMode('ADD').setAlpha(alpha);
  scene.tweens.add({ targets: g, alpha: alpha * 0.6, scale: scale * 1.08, duration: 1600 + Math.random() * 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  return g;
}

export function drawEventArt(scene, id, x, y) {
  const look = LOOK[id] ?? { light: 0xbfd8d2 };
  const cx = x + FW / 2;
  const wet = !!look.water;
  // back wall and floor, both tiled from the battle set
  scene.add.tileSprite(x + FW / 2, y + FLOOR_Y / 2, FW, FLOOR_Y, 'px_walld1').setTint(0x8f9d99);
  const arch = scene.add.graphics();
  arch.fillStyle(0x020607, 0.8);
  arch.fillRect(cx - 84, y + 150, 168, FLOOR_Y - 150);
  arch.fillCircle(cx, y + 150, 84);
  arch.lineStyle(6, 0x3b4644, 1); arch.beginPath(); arch.arc(cx, y + 150, 87, Math.PI, 0); arch.strokePath();
  arch.lineBetween(cx - 87, y + 150, cx - 87, y + FLOOR_Y); arch.lineBetween(cx + 87, y + 150, cx + 87, y + FLOOR_Y);
  scene.add.tileSprite(x + FW / 2, y + FLOOR_Y + (FH - FLOOR_Y) / 2, FW, FH - FLOOR_Y, 'px_floor1').setTint(0x9aa6a2);
  glow(scene, cx, y + FLOOR_Y - 90, 1.5, look.light, 0.32);
  let waterTop = null;
  if (wet) {
    waterTop = y + FLOOR_Y + 28;
    const wtr = scene.add.tileSprite(x + FW / 2, waterTop + (FH - (waterTop - y)) / 2, FW, FH - (waterTop - y), 'px_deep').setAlpha(0.95);
    scene.tweens.add({ targets: wtr, tilePositionX: 60, duration: 9000, repeat: -1 });
    const foam = scene.add.graphics(); foam.fillStyle(0xbfe6dc, 0.4); foam.fillRect(x, waterTop - 1, FW, 3);
  }
  // the set piece
  const baseY = look.inWater ? y + FH - 30 : y + FLOOR_Y + 40;
  scene.add.ellipse(cx, baseY - 6, 120, 22, 0x000000, wet ? 0.25 : 0.5);
  const piece = scene.add.image(cx, baseY, `px_ev_${id}`).setOrigin(0.5, 1);
  if (look.float || look.inWater) scene.tweens.add({ targets: piece, y: baseY - 8, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  if (look.candles) {
    for (const dx of [-128, 128]) {
      scene.add.image(cx + dx, y + FLOOR_Y + 46, 'px_candles').setOrigin(0.5, 1).setScale(1.25);
      const cg = glow(scene, cx + dx, y + FLOOR_Y + 14, 0.5, 0xffb050, 0.45);
      scene.tweens.add({ targets: cg, alpha: 0.25, duration: 140 + Math.random() * 120, yoyo: true, repeat: -1 });
    }
  }
  if (look.fire) {
    scene.add.particles(cx, baseY - 92, 'spark', {
      lifespan: { min: 400, max: 800 }, speedY: { min: -80, max: -30 }, speedX: { min: -14, max: 14 }, scale: { start: 1.6, end: 0 },
      alpha: { start: 1, end: 0 }, tint: [0xfff0b0, 0xffc861, 0xe8a33d, 0xc0501c], blendMode: 'ADD', frequency: 30,
    });
    glow(scene, cx, baseY - 92, 0.9, 0xff9a40, 0.5);
  }
  if (look.lantern) glow(scene, cx + 26, baseY - 40, 0.55, 0xffc861, 0.55);
  if (look.gold) {
    scene.add.particles(cx, baseY - 50, 'spark', {
      lifespan: 1400, speedY: { min: -60, max: -20 }, speedX: { min: -30, max: 30 }, scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 }, tint: [0xffd27a, 0xfff3c9], blendMode: 'ADD', frequency: 120,
    });
    glow(scene, cx, baseY - 40, 0.9, 0xffd27a, 0.5);
  }
  if (look.eyes) {
    const eyes = scene.add.image(cx, y + FLOOR_Y - 60, 'eyes').setTint(0x9fd6cb).setScale(0.8);
    scene.tweens.add({ targets: eyes, scaleY: 0.08, duration: 120, yoyo: true, repeat: -1, repeatDelay: 2600 });
  }
  if (look.tears) {
    scene.add.particles(cx - 6, baseY - 92, 'drop', { lifespan: 900, speedY: { min: 40, max: 70 }, scale: 0.6, alpha: { start: 0.8, end: 0 }, tint: 0x9fd6cb, frequency: 700 });
  }
  // drifting fog and dust in the light
  scene.add.particles(0, 0, 'smoke', {
    x: { min: x, max: x + FW - 40 }, y: { min: y + FLOOR_Y - 40, max: y + FH - 40 }, lifespan: 7000,
    speedX: { min: 4, max: 12 }, scale: { start: 3, end: 6 }, alpha: { onEmit: () => 0, onUpdate: (p, k, t) => Math.sin(t * Math.PI) * 0.16 },
    tint: 0x9cc2b8, frequency: 500,
  });
  scene.add.particles(0, 0, 'mote', {
    x: { min: cx - 90, max: cx + 90 }, y: { min: y + 120, max: y + FLOOR_Y }, lifespan: 4000, speedY: { min: -8, max: 8 }, speedX: { min: -6, max: 6 },
    alpha: { start: 0.6, end: 0 }, tint: look.light, blendMode: 'ADD', frequency: 260,
  });
  // frame shading so the edges fall into darkness
  const sh = scene.add.graphics();
  const D = 0x020607;
  sh.fillGradientStyle(D, D, D, D, 0.9, 0.9, 0, 0); sh.fillRect(x, y, FW, 120);
  sh.fillGradientStyle(D, 0x000000, D, 0x000000, 0.75, 0, 0.75, 0); sh.fillRect(x, y, 70, FH);
  sh.fillGradientStyle(0x000000, D, 0x000000, D, 0, 0.75, 0, 0.75); sh.fillRect(x + FW - 70, y, 70, FH);
  sh.fillGradientStyle(D, D, D, D, 0, 0, 0.7, 0.7); sh.fillRect(x, y + FH - 60, FW, 60);
}
