import { sfx, musicPlayer } from '../audio.js';
import { HEROES } from '../data.js';
import { computeEmbers, createRun } from '../rules.js';
import { HEX, FONT_H, FONT_B, makeButton, panel, C } from '../ui.js';
import { saveMeta } from '../save.js';
import { shoreBackdrop } from './backdrop.js';

const Phaser = window.Phaser;

export default class RunEndScene extends Phaser.Scene {
  constructor() { super('runend'); }
  init(data) { this.won = !!data.won; this.abandoned = !!data.abandoned; }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.cameras.main.setZoom(1).setScroll(0, 0);
    const run = this.registry.get('run');
    const meta = this.registry.get('meta');
    this.cameras.main.fadeIn(900, 5, 11, 12);
    musicPlayer.play('camp');
    shoreBackdrop(this, { fire: this.won });
    this.add.rectangle(W / 2, H / 2, W, H, 0x020607, 0.6);
    const { parts, total } = computeEmbers(run, this.won);
    meta.embers += total;
    meta.bestDepth = Math.max(meta.bestDepth, run.depth);
    if (this.won) meta.wins++; else meta.deaths++;
    saveMeta(meta);
    (this.won ? sfx.victory : sfx.defeat)();

    const title = this.won ? 'THE BISHOP SLEEPS' : this.abandoned ? 'THE VIGIL WITHDRAWS' : 'THE WATER KEEPS THEM';
    const sub = this.won ? 'The bells of the drowned cathedral fall silent. For tonight, the lake is only a lake.'
      : this.abandoned ? 'You climb back to the shore. The bells keep ringing behind you.'
        : 'Another Vigil ends beneath the black water. Others will light the lantern again.';
    const t = this.add.text(W / 2, 64, title, { fontFamily: FONT_H, fontSize: '46px', color: this.won ? HEX.amberHot : HEX.bone, fontStyle: '900', letterSpacing: 4, stroke: '#050b0c', strokeThickness: 8 }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, y: 58, duration: 1200 });
    this.add.text(W / 2, 106, sub, { fontFamily: FONT_B, fontSize: '17px', color: HEX.amber, fontStyle: 'italic' }).setOrigin(0.5);
    // what ended it: the last blow, named
    const f = run.stats.fellTo;
    if (!this.won && !this.abandoned && f) {
      const what = f.by ? `felled by the ${f.by}` : f.source ? `taken by ${f.source}` : 'fell';
      this.add.text(W / 2, 128, `The last blood: ${f.hero}, ${what} in ${f.room} · Depth ${f.depth}`, { fontFamily: FONT_H, fontSize: '15px', color: HEX.red, fontStyle: '700' }).setOrigin(0.5);
    }

    // the chronicle of this Vigil
    panel(this, 60, 140, 700, 470, { r: 16 });
    this.add.text(84, 156, 'THE CHRONICLE OF THIS VIGIL', { fontFamily: FONT_H, fontSize: '14px', color: HEX.amber, fontStyle: '700', letterSpacing: 3 });
    const entries = run.chronicle.slice(-9);
    let y = 186;
    if (!entries.length) entries.push({ depth: run.depth, text: 'Nothing worth writing down happened. That is its own kind of story.' });
    entries.forEach((e, i) => {
      const l = this.add.text(84, y, `Depth ${e.depth} · ${e.text}`, { fontFamily: FONT_B, fontSize: '15px', color: HEX.bone, fontStyle: 'italic', wordWrap: { width: 650 } }).setAlpha(0);
      this.tweens.add({ targets: l, alpha: 1, duration: 400, delay: 600 + i * 220, onStart: () => sfx.page() });
      y += l.height + 8;
    });
    // epitaphs
    const dead = run.heroes.filter((h) => h.lost || (!this.won && h.hp <= 0));
    if (dead.length) {
      y += 6;
      this.add.text(84, y, 'IN MEMORY', { fontFamily: FONT_H, fontSize: '13px', color: HEX.red, fontStyle: '700', letterSpacing: 3 });
      y += 22;
      dead.forEach((h) => {
        const ep = { warden: 'He held the gate. In the end, the gate held him.', scholar: 'She went back down to finish the book.', ringer: 'Somewhere below, a bell keeps the hours.' }[h.id];
        this.add.text(84, y, `${HEROES[h.id].name}: ${ep}`, { fontFamily: FONT_B, fontSize: '14px', color: HEX.boneDim, fontStyle: 'italic', wordWrap: { width: 650 } });
        y += 22;
      });
    }

    // embers breakdown
    panel(this, 790, 140, 430, 470, { r: 16 });
    this.add.text(814, 156, 'EMBERS EARNED', { fontFamily: FONT_H, fontSize: '14px', color: HEX.amber, fontStyle: '700', letterSpacing: 3 });
    const stats = run.stats;
    const rows = [...parts, ['', null], ['Rooms cleared', stats.rooms], ['Critical hits', stats.crits], ['Foes drowned', stats.drowned], ['Treasures claimed', stats.loot]];
    rows.forEach(([k, v], i) => {
      if (v === null) return;
      const yy = 190 + i * 30;
      const isEmber = i < parts.length;
      const a = this.add.text(814, yy, k, { fontFamily: FONT_B, fontSize: '16px', color: isEmber ? HEX.bone : HEX.boneDim }).setAlpha(0);
      const b = this.add.text(1196, yy, isEmber ? `+${v}` : String(v), { fontFamily: FONT_H, fontSize: '17px', color: isEmber ? HEX.amberHot : HEX.bone, fontStyle: '700' }).setOrigin(1, 0).setAlpha(0);
      this.tweens.add({ targets: [a, b], alpha: 1, duration: 300, delay: 500 + i * 140 });
    });
    const e = this.add.text(1005, 560, '+0 EMBERS', { fontFamily: FONT_H, fontSize: '34px', color: HEX.amberHot, fontStyle: '900' }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: e, alpha: 1, duration: 300, delay: 1700 });
    this.tweens.addCounter({ from: 0, to: total, duration: 1200, delay: 1800, onUpdate: (tw) => e.setText(`+${Math.round(tw.getValue())} EMBERS`), onComplete: () => { sfx.loot('relic'); this.cameras.main.shake(150, 0.004); } });
    makeButton(this, W / 2 - 170, H - 56, 300, 58, 'Return to Camp', () => {
      this.cameras.main.fadeOut(600, 5, 11, 12);
      this.time.delayedCall(620, () => this.scene.start('camp', {}));
    }, { size: 18, fill: 0x2a1c0c, stroke: C.amber, sub: `${meta.embers} Embers to spend` });
    // straight back in, the Slay the Spire way
    makeButton(this, W / 2 + 170, H - 56, 300, 58, 'Descend Again', () => {
      sfx.bell();
      meta.runs++; saveMeta(meta);
      const next = createRun(meta, Date.now());
      next.meta = { ...meta.upgrades };
      this.registry.set('run', next);
      this.cameras.main.fadeOut(600, 5, 11, 12);
      this.time.delayedCall(620, () => this.scene.start('map'));
    }, { size: 18, sub: 'a new Vigil, right now' });
  }
}
