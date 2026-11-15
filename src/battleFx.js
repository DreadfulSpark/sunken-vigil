// Battle animation layer: slashes, impacts, hop-steps, arcing bolts, afterimages, deaths.
// Pure presentation. Every function takes the BattleScene and token objects; no rules here.

const ADD = 'ADD';

// weapon colour per attacker kind, so each fighter's swing reads differently
const SWING = {
  warden: 0xffd27a, scholar: 0x9fe8dc, ringer: 0xe0b070,
  cultist: 0xff6a4a, snuffer: 0xb0a8a0, gutter: 0xd0402c, husk: 0x8fbf7a, choir: 0xc8a0ff,
  eel: 0x7fe0ff, censer: 0xf0e0a0, knight: 0xe0f0f0, bishop: 0x9fd6cb,
};
export const swingColor = (u) => SWING[u.kind] ?? 0xffffff;

// turn a unit's sprite toward a screen x (sprites face right unflipped)
export function face(t, fromX, toX) {
  if (Math.abs(toX - fromX) < 2) return;
  const left = toX < fromX;
  t.glyph.setFlipX(left); t.flash.setFlipX(left);
}

// a crescent swing across the target, sweeping in the attack direction
export function slash(scene, x, y, ang, color, { crit = false, heavy = false } = {}) {
  const g = scene.add.graphics({ x, y }).setDepth(53).setBlendMode(ADD);
  const r = crit ? 34 : heavy ? 30 : 26;
  const draw = (w, c, a, rr) => { g.lineStyle(w, c, a); g.beginPath(); g.arc(0, 0, rr, -1.15, 1.15); g.strokePath(); };
  draw(crit ? 12 : 9, color, 0.55, r);
  draw(crit ? 5 : 4, 0xffffff, 0.95, r - 1);
  draw(2, color, 0.8, r + 7);
  g.setRotation(ang - 0.9).setScale(0.6).setAlpha(1);
  scene.tweens.add({ targets: g, rotation: ang + 0.5, scale: crit ? 1.35 : 1.15, duration: 150, ease: 'Quad.Out' });
  scene.tweens.add({ targets: g, alpha: 0, duration: 200, delay: 90, onComplete: () => g.destroy() });
  if (crit) {
    const g2 = scene.add.graphics({ x, y }).setDepth(53).setBlendMode(ADD);
    g2.lineStyle(6, 0xffffff, 0.9); g2.beginPath(); g2.arc(0, 0, r, -1.15, 1.15); g2.strokePath();
    g2.setRotation(ang + 2.2).setScale(0.5);
    scene.tweens.add({ targets: g2, rotation: ang + 3.4, scale: 1.3, alpha: 0, duration: 220, delay: 60, onComplete: () => g2.destroy() });
  }
}

// the moment of contact: a hot flash, an expanding shockwave and a spray of sparks
export function impact(scene, x, y, color, { crit = false, ang = 0 } = {}) {
  const flash = scene.add.image(x, y, 'glow').setDepth(54).setBlendMode(ADD).setTint(0xffffff).setScale(0.12).setAlpha(1);
  scene.tweens.add({ targets: flash, scale: crit ? 0.7 : 0.45, alpha: 0, duration: crit ? 240 : 160, ease: 'Quad.Out', onComplete: () => flash.destroy() });
  const ring = scene.add.circle(x, y, 6).setStrokeStyle(crit ? 4 : 3, color, 1).setDepth(54).setBlendMode(ADD);
  scene.tweens.add({ targets: ring, radius: crit ? 52 : 34, alpha: 0, duration: crit ? 360 : 260, ease: 'Quad.Out', onComplete: () => ring.destroy() });
  const sp = scene.add.particles(x, y, 'spark', {
    angle: { min: (ang * 180) / Math.PI - 55, max: (ang * 180) / Math.PI + 55 }, speed: { min: 140, max: crit ? 520 : 360 },
    lifespan: { min: 160, max: 380 }, scale: { start: crit ? 1.6 : 1.1, end: 0 }, alpha: { start: 1, end: 0 },
    tint: [color, 0xffffff], blendMode: ADD, emitting: false,
  }).setDepth(55);
  sp.explode(crit ? 26 : 14);
  scene.time.delayedCall(500, () => sp.destroy());
}

// a short hop for one step of movement, with dust (or a splash) where the foot lands
export function hop(scene, t, x, y, wet, dur) {
  const base = t.glyphY;
  scene.tweens.add({ targets: [t.glyph, t.flash], y: base - (wet ? 4 : 8), duration: dur / 2, yoyo: true, ease: 'Quad.Out' });
  scene.time.delayedCall(dur * 0.9, () => {
    if (wet) {
      const r = scene.add.ellipse(x, y + 18, 10, 4).setStrokeStyle(2, 0xbfe6dc, 0.8).setDepth(2);
      scene.tweens.add({ targets: r, scaleX: 4, scaleY: 3, alpha: 0, duration: 420, onComplete: () => r.destroy() });
      scene.fx.brine.explode(5, x, y + 16);
    } else {
      scene.fx.dust.explode(4, x, y + 20);
    }
  });
}

// a faded copy of the sprite left behind, for fast moves and shoves
export function afterimage(scene, t, tint = 0x9fd6cb) {
  const m = t.glyph.getWorldTransformMatrix();
  const img = scene.add.image(m.tx, m.ty, t.glyph.texture.key)
    .setOrigin(0.5, 1).setScale(t.glyph.scaleX, t.glyph.scaleY).setFlipX(t.glyph.flipX)
    .setTint(tint).setTintMode(window.Phaser.TintModes.FILL).setAlpha(0.28).setDepth(t.c.depth - 0.001).setBlendMode(ADD);
  scene.tweens.add({ targets: img, alpha: 0, duration: 200, onComplete: () => img.destroy() });
}

// an arcing orb with a hot core, a tail and a splash where it lands
export function bolt(scene, x0, y0, x1, y1, color, { lob = 26, dur = 260, size = 1 } = {}) {
  return new Promise((done) => {
    const core = scene.add.image(x0, y0, 'glow').setDepth(52).setBlendMode(ADD).setTint(color).setScale(0.22 * size);
    const hot = scene.add.image(x0, y0, 'spark').setDepth(53).setBlendMode(ADD).setTint(0xffffff).setScale(2 * size);
    const trail = scene.add.particles(0, 0, 'spark', {
      follow: core, lifespan: 300, scale: { start: 1.6 * size, end: 0 }, alpha: { start: 0.8, end: 0 },
      tint: [color, 0xffffff], blendMode: ADD, frequency: 10, speed: { min: 0, max: 20 },
    }).setDepth(51);
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const h = Math.min(lob, dist * 0.25);
    scene.tweens.add({
      targets: { v: 0 }, v: 1, duration: dur + dist * 0.25, ease: 'Sine.In',
      onUpdate: (tw) => {
        const v = tw.getValue();
        const x = x0 + (x1 - x0) * v, y = y0 + (y1 - y0) * v - Math.sin(v * Math.PI) * h;
        core.setPosition(x, y); hot.setPosition(x, y).setRotation(v * 12);
      },
      onComplete: () => {
        core.destroy(); hot.destroy();
        scene.time.delayedCall(320, () => trail.destroy());
        impact(scene, x1, y1, color, { ang: Math.atan2(y1 - y0, x1 - x0) });
        done();
      },
    });
  });
}

// a held shield: a pale dome that rises around the unit
export function shieldDome(scene, x, y, color) {
  const d = scene.add.ellipse(x, y + 4, 20, 26).setStrokeStyle(3, color, 1).setFillStyle(color, 0.12).setDepth(53).setBlendMode(ADD);
  scene.tweens.add({ targets: d, scaleX: 3.2, scaleY: 2.8, duration: 260, ease: 'Back.Out' });
  scene.tweens.add({ targets: d, alpha: 0, duration: 400, delay: 380, onComplete: () => d.destroy() });
}

// death: a white flash, a stagger, then the body tips over, darkens and gives up a wisp
export function topple(scene, t, awayAng, { hero = false, sink = false } = {}) {
  return new Promise((done) => {
    const dir = Math.cos(awayAng) >= 0 ? 1 : -1;
    scene.tweens.killTweensOf([t.glyph, t.flash]);
    t.flash.setAlpha(0.85);
    scene.tweens.add({ targets: t.flash, alpha: 0, duration: 220 });
    const tint = hero ? 0x7a8482 : 0x3a2a2a;
    scene.tweens.add({ targets: t.c, x: t.c.x + dir * 10, duration: 140, ease: 'Quad.Out' });
    scene.tweens.add({
      targets: [t.glyph, t.flash], angle: dir * 88, y: t.glyphY + 6, duration: 360, delay: 120, ease: 'Bounce.Out',
      onStart: () => t.glyph.setTint(tint),
    });
    const wisp = scene.add.particles(t.c.x, t.c.y - 10, 'mote', {
      lifespan: 1400, speedY: { min: -60, max: -30 }, speedX: { min: -12, max: 12 }, scale: { start: 2.2, end: 0 },
      alpha: { start: 0.9, end: 0 }, tint: hero ? 0xffd27a : sink ? 0x9fd6cb : 0xbfd8d2, blendMode: ADD, emitting: false,
    }).setDepth(55);
    scene.time.delayedCall(380, () => wisp.explode(hero ? 26 : 16));
    scene.time.delayedCall(1800, () => wisp.destroy());
    scene.tweens.add({ targets: t.c, alpha: hero ? 0.0 : 0, y: t.c.y + (sink ? 14 : 4), duration: 520, delay: 620, ease: 'Quad.In', onComplete: () => done() });
  });
}

// a hard punch-in on the camera for big moments, then back out
export function zoomPunch(scene, x, y, amt = 1.05) {
  const cam = scene.cameras.main;
  const cx = scene.scale.width / 2, cy = scene.scale.height / 2;
  // lean a little toward the blow rather than recentring on it
  x = cx + (x - cx) * 0.12; y = cy + (y - cy) * 0.12;
  cam.pan(x, y, 120, 'Quad.easeOut', true);
  cam.zoomTo(amt, 120, 'Quad.easeOut', true);
  scene.time.delayedCall(260, () => { cam.pan(scene.scale.width / 2, scene.scale.height / 2, 260, 'Quad.easeInOut', true); cam.zoomTo(1, 260, 'Quad.easeInOut', true); });
}

// ---------------- enemy signature attacks ----------------

// a red glint over the head: the tell before a heavy blow
export function glint(scene, x, y, color = 0xff4a3a) {
  const s = scene.add.image(x, y, 'spark').setDepth(56).setBlendMode(ADD).setTint(color).setScale(0.5);
  const g = scene.add.image(x, y, 'glow').setDepth(55).setBlendMode(ADD).setTint(color).setScale(0.05).setAlpha(0.9);
  scene.tweens.add({ targets: s, scale: 4, angle: 90, duration: 200, yoyo: true, ease: 'Quad.Out', onComplete: () => s.destroy() });
  scene.tweens.add({ targets: g, scale: 0.35, alpha: 0, duration: 380, onComplete: () => g.destroy() });
}

// three raking claw marks
export function clawMarks(scene, x, y, ang, color = 0x9fdf7a) {
  const g = scene.add.graphics({ x, y }).setDepth(53).setBlendMode(ADD).setRotation(ang + Math.PI / 2);
  for (let i = -1; i <= 1; i++) {
    g.lineStyle(5, color, 0.6); g.lineBetween(i * 9 - 4, -22, i * 9 + 4, 22);
    g.lineStyle(2, 0xffffff, 0.95); g.lineBetween(i * 9 - 4, -22, i * 9 + 4, 22);
  }
  g.setScale(0.4, 0.2);
  scene.tweens.add({ targets: g, scaleX: 1, scaleY: 1, duration: 110, ease: 'Quad.Out' });
  scene.tweens.add({ targets: g, alpha: 0, duration: 260, delay: 140, onComplete: () => g.destroy() });
}

// two slashes crossing in an X
export function xSlash(scene, x, y, color) {
  slash(scene, x, y, -0.8, color);
  scene.time.delayedCall(70, () => slash(scene, x, y, 0.8 + Math.PI, color));
}

// an overhead blow hitting the floor: flattened shockwave, cracks of light, debris
export function smash(scene, x, y, color, big = false) {
  const ring = scene.add.ellipse(x, y + 16, 16, 6).setStrokeStyle(big ? 5 : 3, color, 1).setDepth(33).setBlendMode(ADD);
  scene.tweens.add({ targets: ring, scaleX: big ? 7 : 4.5, scaleY: big ? 6 : 4, alpha: 0, duration: big ? 520 : 380, ease: 'Quad.Out', onComplete: () => ring.destroy() });
  const cracks = scene.add.graphics({ x, y: y + 14 }).setDepth(2).setBlendMode(ADD);
  for (let i = 0; i < (big ? 7 : 5); i++) {
    const a = Math.random() * Math.PI * 2, l = (big ? 30 : 20) + Math.random() * 14;
    const mx = Math.cos(a) * l * 0.5 + (Math.random() - 0.5) * 8, my = Math.sin(a) * l * 0.25;
    cracks.lineStyle(2, color, 0.9); cracks.beginPath(); cracks.moveTo(0, 0); cracks.lineTo(mx, my); cracks.lineTo(Math.cos(a) * l, Math.sin(a) * l * 0.45); cracks.strokePath();
  }
  scene.tweens.add({ targets: cracks, alpha: 0, duration: 700, delay: 200, onComplete: () => cracks.destroy() });
  scene.fx.dust.explode(big ? 18 : 10, x, y + 16);
  scene.fx.spark.explode(big ? 24 : 12, x, y);
  scene.cameras.main.shake(big ? 300 : 160, big ? 0.012 : 0.006);
}

// a clinging cloud of black smoke that swallows the target for a moment
export function smother(scene, x, y) {
  const p = scene.add.particles(x, y, 'smoke', {
    speed: { min: 10, max: 60 }, lifespan: 900, scale: { start: 1.4, end: 3.6 }, alpha: { start: 0.85, end: 0 },
    tint: [0x0a0c0c, 0x1c2222], emitting: false,
  }).setDepth(56);
  p.explode(22);
  const dark = scene.add.image(x, y, 'glow').setDepth(55).setTint(0x000000).setScale(0.6).setAlpha(0.7);
  scene.tweens.add({ targets: dark, alpha: 0, scale: 0.9, duration: 700, onComplete: () => dark.destroy() });
  scene.time.delayedCall(1000, () => p.destroy());
}

// a scream: rings of sound rolling from singer to target
export function soundWave(scene, x0, y0, x1, y1, color = 0xc8a0ff) {
  return new Promise((done) => {
    const ang = Math.atan2(y1 - y0, x1 - x0);
    const dist = Math.hypot(x1 - x0, y1 - y0);
    for (let i = 0; i < 4; i++) {
      const g = scene.add.graphics({ x: x0, y: y0 }).setDepth(53).setBlendMode(ADD).setRotation(ang);
      g.lineStyle(3, color, 0.9); g.beginPath(); g.arc(0, 0, 14, -0.7, 0.7); g.strokePath();
      g.lineStyle(1, 0xffffff, 0.8); g.beginPath(); g.arc(0, 0, 12, -0.6, 0.6); g.strokePath();
      scene.tweens.add({
        targets: g, x: x1 - Math.cos(ang) * 10, y: y1 - Math.sin(ang) * 10, scale: 2.2, duration: 200 + dist * 0.6, delay: i * 70, ease: 'Sine.In',
        onComplete: () => {
          scene.tweens.add({ targets: g, alpha: 0, scale: 3, duration: 140, onComplete: () => g.destroy() });
          if (i === 3) { impact(scene, x1, y1, color, { ang }); done(); }
        },
      });
    }
  });
}

// a chain hook: thrown out, it can drag something back
export function chainHook(scene, x0, y0) {
  const g = scene.add.graphics().setDepth(52);
  const hook = scene.add.image(x0, y0, 'spark').setDepth(53).setTint(0xd9cfb8).setScale(1.8);
  const st = { x: x0, y: y0, ox: x0, oy: y0 };
  const draw = () => {
    g.clear();
    const d = Math.hypot(st.x - st.ox, st.y - st.oy), n = Math.max(1, Math.floor(d / 7));
    for (let i = 0; i <= n; i++) {
      const v = i / n, x = st.ox + (st.x - st.ox) * v, y = st.oy + (st.y - st.oy) * v + Math.sin(v * Math.PI) * 6;
      g.fillStyle(i % 2 ? 0x8a9290 : 0xc9d4d2, 1); g.fillRect(x - 2, y - 2, 4, 4);
      g.fillStyle(0x050b0c, 1); g.fillRect(x - 1, y - 1, 2, 2);
    }
    hook.setPosition(st.x, st.y);
  };
  draw();
  return {
    throwTo: (x, y, dur = 220) => new Promise((r) => scene.tweens.add({ targets: st, x, y, duration: dur, ease: 'Quad.Out', onUpdate: draw, onComplete: () => r() })),
    set: (x, y) => { st.x = x; st.y = y; draw(); },
    retract: (dur = 200) => new Promise((r) => scene.tweens.add({ targets: st, x: st.ox, y: st.oy, duration: dur, ease: 'Quad.In', onUpdate: draw, onComplete: () => { g.destroy(); hook.destroy(); r(); } })),
    destroy: () => { g.destroy(); hook.destroy(); },
  };
}

// a wide sweeping arc of water around a big attacker
export function cleaveArc(scene, x, y, color = 0x9fd6cb) {
  const g = scene.add.graphics({ x, y }).setDepth(53).setBlendMode(ADD);
  g.lineStyle(14, color, 0.35); g.beginPath(); g.arc(0, 0, 70, -2.4, 2.4); g.strokePath();
  g.lineStyle(5, 0xffffff, 0.9); g.beginPath(); g.arc(0, 0, 68, -2.4, 2.4); g.strokePath();
  g.setRotation(-1.2).setScale(0.5);
  scene.tweens.add({ targets: g, rotation: 1.4, scale: 1.1, duration: 320, ease: 'Quad.Out' });
  scene.tweens.add({ targets: g, alpha: 0, duration: 260, delay: 220, onComplete: () => g.destroy() });
  scene.fx.brine.explode(30, x, y);
}

// a column of black water erupting from a pool
export function geyser(scene, x, y) {
  const col = scene.add.particles(x, y + 10, 'drop', {
    speedY: { min: -420, max: -240 }, speedX: { min: -40, max: 40 }, gravityY: 700, lifespan: 900,
    scale: { start: 1.6, end: 0.4 }, alpha: { start: 0.9, end: 0 }, tint: [0x9fd6cb, 0x2d6b6b, 0xd9cfb8], frequency: 8, quantity: 3,
  }).setDepth(54);
  scene.time.delayedCall(500, () => col.stop());
  scene.time.delayedCall(1500, () => col.destroy());
  for (let i = 0; i < 3; i++) {
    const r = scene.add.ellipse(x, y + 16, 12, 5).setStrokeStyle(3, 0xbfe6dc, 0.9).setDepth(33);
    scene.tweens.add({ targets: r, scaleX: 6, scaleY: 5, alpha: 0, duration: 700, delay: i * 140, onComplete: () => r.destroy() });
  }
}

// a ring of turning runes and a pulse of darkness over the whole room
export function darkLitany(scene, x, y) {
  const g = scene.add.graphics({ x, y }).setDepth(53).setBlendMode(ADD);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.lineStyle(3, 0xd0402c, 0.9);
    g.strokeRect(Math.cos(a) * 46 - 4, Math.sin(a) * 46 - 6, 8, 12);
    g.lineBetween(Math.cos(a) * 46, Math.sin(a) * 46 - 6, Math.cos(a) * 46, Math.sin(a) * 46 + 6);
  }
  g.lineStyle(2, 0xd0402c, 0.7); g.strokeCircle(0, 0, 58); g.strokeCircle(0, 0, 34);
  g.setScale(0.3).setAlpha(0);
  scene.tweens.add({ targets: g, scale: 1.2, alpha: 1, angle: -60, duration: 500, ease: 'Quad.Out' });
  scene.tweens.add({ targets: g, alpha: 0, angle: -140, scale: 1.6, duration: 600, delay: 600, onComplete: () => g.destroy() });
  const W = scene.scale.width, H = scene.scale.height;
  const veil = scene.add.rectangle(W / 2, H / 2, W, H, 0x100000, 1).setDepth(45).setAlpha(0);
  scene.tweens.add({ targets: veil, alpha: 0.45, duration: 300, yoyo: true, hold: 300, onComplete: () => veil.destroy() });
}

// green incense curling up from a healed ally
export function incense(scene, x, y) {
  const p = scene.add.particles(x, y + 10, 'mote', {
    x: { min: -18, max: 18 }, speedY: { min: -70, max: -30 }, lifespan: 1000, scale: { start: 2, end: 0 },
    alpha: { start: 0.9, end: 0 }, tint: [0x8fdf93, 0xd9f5c9], blendMode: ADD, frequency: 25,
  }).setDepth(55);
  const r = scene.add.circle(x, y + 14, 8).setStrokeStyle(3, 0x8fdf93, 0.9).setDepth(33).setBlendMode(ADD);
  scene.tweens.add({ targets: r, radius: 34, alpha: 0, duration: 600, onComplete: () => r.destroy() });
  scene.time.delayedCall(600, () => p.stop());
  scene.time.delayedCall(1700, () => p.destroy());
}
