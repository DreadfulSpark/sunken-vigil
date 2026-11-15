import { makeTextures } from '../textures.js';
import { sfx, musicPlayer } from '../audio.js';
import { HEX, FONT_H, FONT_B, makeButton, C } from '../ui.js';
import { loadMeta, saveMeta, resetMeta } from '../save.js';
import { createRun } from '../rules.js';
import { shoreBackdrop } from './backdrop.js';
import { preloadSprites } from '../sprites.js';

const Phaser = window.Phaser;

export default class TitleScene extends Phaser.Scene {
  constructor() { super('title'); }

  preload() {
    preloadSprites(this);
    const W = this.scale.width, H = this.scale.height;
    const bar = this.add.rectangle(W / 2 - 150, H / 2, 0, 3, 0xe8a33d).setOrigin(0, 0.5);
    this.load.on('progress', (v) => bar.setSize(300 * v, 3));
    this.load.once('complete', () => bar.destroy());
  }

  create() {
    makeTextures(this);
    const W = this.scale.width, H = this.scale.height;
    if (!this.registry.get('meta')) this.registry.set('meta', loadMeta());
    const meta = this.registry.get('meta');
    shoreBackdrop(this, { fire: true });
    this.add.rectangle(W / 2, H / 2, W, H, 0x020607, 0.35);

    const title = this.add.text(W / 2, 150, 'THE SUNKEN VIGIL', { fontFamily: FONT_H, fontSize: '76px', color: HEX.bone, fontStyle: '900', letterSpacing: 6, stroke: '#050b0c', strokeThickness: 8 }).setOrigin(0.5).setAlpha(0);
    const glow = this.add.image(W / 2, 150, 'glow').setScale(4, 1.2).setTint(C.amber).setBlendMode('ADD').setAlpha(0);
    const sub = this.add.text(W / 2, 214, 'A lantern-lit tactics roguelite beneath a drowned cathedral', { fontFamily: FONT_B, fontSize: '20px', color: HEX.amber, fontStyle: 'italic' }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, y: 140, duration: 1400, ease: 'Quad.Out' });
    this.tweens.add({ targets: glow, alpha: 0.25, duration: 2000, delay: 400 });
    this.tweens.add({ targets: sub, alpha: 1, duration: 1200, delay: 700 });

    const startLabel = meta.tutorialDone ? 'Return to Camp' : 'Begin the Vigil';
    const b1 = makeButton(this, W / 2, 330, 300, 60, startLabel, () => this.begin(), { size: 20, fill: 0x2a1c0c, stroke: C.amber, sub: meta.tutorialDone ? `${meta.embers} Embers · ${meta.runs} run${meta.runs === 1 ? '' : 's'}` : 'starts with a short guided fight' });
    const b2 = makeButton(this, W / 2, 404, 300, 46, meta.tutorialDone ? 'Replay the Tutorial' : 'Skip the tutorial', () => {
      if (meta.tutorialDone) this.tutorial();
      else { meta.tutorialDone = true; meta.embers += 40; saveMeta(meta); this.go('camp', { fromTutorial: true }); }
    }, { size: 15 });
    const b3 = makeButton(this, W / 2, 462, 300, 40, musicPlayer.muted ? 'Sound: Off' : 'Sound: On', () => {
      const m = musicPlayer.toggleMute(); b3.setLabel(m ? 'Sound: Off' : 'Sound: On');
    }, { size: 14 });
    [b1, b2, b3].forEach((b, i) => { b.alpha = 0; this.tweens.add({ targets: b, alpha: 1, duration: 600, delay: 1100 + i * 150 }); });
    if (meta.runs > 0) {
      makeButton(this, W - 90, H - 30, 150, 30, 'Reset progress', () => {
        if (this.confirmReset) { resetMeta(); this.registry.set('meta', loadMeta()); this.scene.restart(); return; }
        this.confirmReset = true; this.hint.setText('Click again to erase all progress.');
      }, { size: 11 });
    }
    this.hint = this.add.text(W / 2, H - 28, 'Mouse to play · SPACE to parry · E ends the phase · Esc cancels · M mutes', { fontFamily: FONT_B, fontSize: '14px', color: HEX.boneDim, fontStyle: 'italic' }).setOrigin(0.5);
    this.input.once('pointerdown', () => { sfx.unlock(); musicPlayer.play('camp'); });
    this.input.keyboard.once('keydown', () => { sfx.unlock(); musicPlayer.play('camp'); });
  }

  begin() {
    sfx.unlock(); sfx.bell();
    const meta = this.registry.get('meta');
    if (meta.tutorialDone) this.go('camp', {});
    else this.tutorial();
  }
  tutorial() {
    sfx.unlock();
    const run = createRun({}, 7);
    this.registry.set('run', run);
    this.go('battle', { mode: 'tutorial', encounter: { roomId: 'narthex', enemies: ['cultist', 'husk'], tier: 1 } });
  }
  go(key, data) {
    this.input.enabled = false;
    this.cameras.main.fadeOut(700, 5, 11, 12);
    this.time.delayedCall(720, () => this.scene.start(key, data));
  }
}
