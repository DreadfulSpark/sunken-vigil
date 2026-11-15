// Title, camp and run-end backdrop: Caspar David Friedrich's "Abbey in the Oakwood" (1810,
// public domain), graded into the game's drowned-teal palette, with drifting fog, falling ash,
// a slow push-in and an optional campfire glow at the bottom of the frame.
import { C } from '../ui.js';

export function shoreBackdrop(scene, { fire = true, cityAlpha = 1 } = {}) {
  const W = scene.scale.width, H = scene.scale.height;
  scene.add.rectangle(W / 2, H / 2, W, H, C.void);
  if (scene.textures.exists('art_abbey')) {
    const art = scene.add.image(W / 2, H / 2, 'art_abbey');
    const cover = Math.max(W / art.width, H / art.height) * 1.04;
    art.setScale(cover).setTint(0x9fc4bc).setAlpha(0.55 + 0.3 * cityAlpha);
    scene.tweens.add({ targets: art, scale: cover * 1.06, x: W / 2 - 18, duration: 40000, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }
  // grade: deep teal at the top and bottom, so text and UI always sit on dark
  const g = scene.add.graphics();
  const D = 0x03100f;
  g.fillStyle(D, 0.18); g.fillRect(0, 0, W, H);
  g.fillGradientStyle(D, D, D, D, 0.85, 0.85, 0, 0); g.fillRect(0, 0, W, H * 0.34);
  g.fillGradientStyle(D, D, D, D, 0, 0, 0.9, 0.9); g.fillRect(0, H * 0.62, W, H * 0.38 + 1);
  scene.add.image(W / 2, H / 2, 'vignette').setDisplaySize(W * 1.1, H * 1.1).setAlpha(0.9);
  // low fog rolling across the ruins
  scene.add.particles(0, 0, 'smoke', {
    x: { min: -100, max: W }, y: { min: H * 0.55, max: H * 0.95 }, lifespan: 14000,
    speedX: { min: 8, max: 22 }, speedY: { min: -3, max: 3 }, scale: { start: 6, end: 10 },
    alpha: { onEmit: () => 0, onUpdate: (p, k, t) => Math.sin(t * Math.PI) * 0.18 }, tint: 0x9cc2b8, frequency: 420,
  }).setAlpha(0.9);
  // ash and cold motes
  scene.add.particles(0, 0, 'mote', {
    x: { min: 0, max: W }, y: -10, lifespan: 9000, speedY: { min: 14, max: 34 }, speedX: { min: -8, max: 8 },
    alpha: { start: 0.55, end: 0 }, tint: 0xd9cfb8, frequency: 140, scale: { min: 0.6, max: 1.4 },
  });
  if (fire) {
    const glow = scene.add.image(W / 2, H + 40, 'glow').setScale(5, 2.2).setTint(0xff8a30).setBlendMode('ADD').setAlpha(0.32);
    scene.tweens.add({ targets: glow, alpha: 0.22, duration: 160, yoyo: true, repeat: -1, repeatDelay: 80 });
    scene.add.particles(W / 2, H + 6, 'spark', {
      x: { min: -160, max: 160 }, lifespan: { min: 1600, max: 3200 }, speedY: { min: -90, max: -40 }, speedX: { min: -20, max: 20 },
      scale: { start: 0.9, end: 0 }, alpha: { start: 0.9, end: 0 }, tint: [0xffd27a, 0xe8a33d, 0xc0501c], blendMode: 'ADD', frequency: 90,
    });
  }
}
