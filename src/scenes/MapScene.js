import * as R from '../rules.js';
import { sfx, musicPlayer } from '../audio.js';
import { C, HEX, FONT_H, FONT_B, panel, makeButton } from '../ui.js';
import { partyStrip } from '../hud.js';

const Phaser = window.Phaser;
const NODE = {
  fight: { name: 'Battle', color: 0xd9cfb8, desc: 'A room full of the drowned. Pick 1 of 3 treasures afterwards.' },
  elite: { name: 'Elite Battle', color: 0xd0402c, desc: 'A Tide-Knight and its retinue. Hard. Always offers a Relic, and one hero learns a Talent.' },
  event: { name: 'Curio', color: 0x6fc2b5, desc: 'Something strange. Choices, skill checks, and a price.' },
  rest: { name: 'Sanctuary', color: 0xe8a33d, desc: 'A dry room with a working candle. Heal, calm your Dread, pray, or train a Talent.' },
  shop: { name: 'The Ferryman', color: 0xc9d4d2, desc: 'He trades in silver and does not ask where you found it.' },
  treasure: { name: 'Reliquary Vault', color: 0xffd27a, desc: 'Unguarded treasure. Probably. Silver and a Blessed-or-better item.' },
  boss: { name: 'The Drowned Bishop', color: 0xd0402c, desc: 'He has waited forty years under the water. End this.' },
};

export default class MapScene extends Phaser.Scene {
  constructor() { super('map'); }

  create() {
    this.run = this.registry.get('run');
    this.selected = null;
    const W = this.scale.width, H = this.scale.height;
    this.cameras.main.fadeIn(500, 5, 11, 12);
    musicPlayer.play('explore');
    this.add.rectangle(W / 2, H / 2, W, H, C.void);
    this.add.tileSprite(W / 2, H / 2, W, H, 'px_walld0').setTint(0x34403d);
    const shade = this.add.graphics();
    shade.fillGradientStyle(0x050b0c, 0x050b0c, 0x050b0c, 0x050b0c, 0.95, 0.95, 0.35, 0.35); shade.fillRect(0, 0, W, H * 0.45);
    shade.fillGradientStyle(0x050b0c, 0x050b0c, 0x050b0c, 0x050b0c, 0.35, 0.35, 0.95, 0.95); shade.fillRect(0, H * 0.45, W, H * 0.55);
    // the cathedral in cross-section: faint arches stepping down
    const bg = this.add.graphics();
    for (let i = 0; i < 8; i++) {
      const x = 110 + i * 152, top = 200 + i * 12;
      bg.lineStyle(3, 0x2c3a38, 1);
      bg.beginPath(); bg.arc(x, top + 60, 62, Math.PI, 0); bg.strokePath();
      bg.lineBetween(x - 62, top + 60, x - 62, H - 120); bg.lineBetween(x + 62, top + 60, x + 62, H - 120);
    }
    bg.fillStyle(0x0b2224, 0.6); bg.fillRect(0, H - 150, W, 40);
    const glow = this.add.image(W / 2, H * 0.62, 'glow').setScale(6).setTint(C.abyss).setAlpha(0.8);
    this.tweens.add({ targets: glow, alpha: 0.5, duration: 5000, yoyo: true, repeat: -1 });
    this.add.particles(0, 0, 'mote', { x: { min: 0, max: W }, y: -10, lifespan: 5000, speedY: { min: 20, max: 60 }, scaleY: { min: 2, max: 6 }, alpha: { start: 0.25, end: 0 }, tint: 0x7fb8ae, frequency: 120 });
    partyStrip(this, this.run, 14, { onHover: (t, b) => this.tip(t, b) });

    this.add.text(W / 2, 134, 'THE DESCENT', { fontFamily: FONT_H, fontSize: '28px', color: HEX.bone, fontStyle: '900', letterSpacing: 6 }).setOrigin(0.5);
    this.add.text(W / 2, 166, 'Click a glowing room to see it, then click again (or press Travel) to go. There is no going back.', { fontFamily: FONT_B, fontSize: '15px', color: HEX.boneDim, fontStyle: 'italic' }).setOrigin(0.5);

    const map = this.run.map;
    const colX = (c) => 110 + c * 152;
    const laneY = (l) => 290 + l * 112;
    const pos = (n) => ({ x: colX(n.col), y: laneY(n.lane) });
    const avail = new Set(R.availableNodes(this.run).map((n) => n.id));
    const visited = new Set(this.run.visited ?? []);
    this.nodeViews = [];

    const lines = this.add.graphics();
    for (const n of map) for (const id of n.next) {
      const m = R.nodeById(this.run, id);
      const a = pos(n), b = pos(m);
      const onPath = visited.has(n.id) && (visited.has(m.id) || avail.has(m.id));
      const d = Math.hypot(b.x - a.x, b.y - a.y), steps = Math.floor(d / 10);
      lines.fillStyle(onPath ? C.amber : 0x3a4a4a, onPath ? 0.9 : 0.6);
      for (let i = 2; i < steps - 1; i++) lines.fillCircle(a.x + (b.x - a.x) * i / steps, a.y + (b.y - a.y) * i / steps, onPath ? 2.2 : 1.6);
    }
    for (let c = 0; c < 8; c++) this.add.text(colX(c), 222, c === 7 ? 'APSE' : `DEPTH ${c + 1}`, { fontFamily: FONT_H, fontSize: '11px', color: HEX.boneDim, fontStyle: '700', letterSpacing: 2 }).setOrigin(0.5);

    for (const n of map) {
      const p = pos(n);
      const info = NODE[n.type];
      const big = n.type === 'boss' ? 1.35 : 1;
      const isAvail = avail.has(n.id), isVisited = visited.has(n.id), isHere = this.run.at === n.id;
      const c = this.add.container(p.x, p.y);
      const ring = this.add.graphics();
      const drawRing = (sel) => {
        ring.clear();
        ring.fillStyle(0x000000, 0.5); ring.fillCircle(3, 5, 32 * big);
        ring.fillStyle(isVisited ? 0x1d1a12 : sel ? 0x23301f : 0x0d1719, 1); ring.fillCircle(0, 0, 32 * big);
        ring.lineStyle(sel ? 4 : isAvail ? 3 : 2, sel ? C.amberHot : isAvail ? info.color : isVisited ? C.amber : 0x2c3b3b, 1); ring.strokeCircle(0, 0, 32 * big);
      };
      drawRing(false);
      const icon = this.add.image(0, 2, `px_nd_${n.type}`).setScale(0.78 * big).setAlpha(isAvail || isVisited ? 1 : 0.4);
      if (!isAvail && !isVisited) icon.setTint(0x8a9a96);
      c.add([ring, icon]);
      // threat pips under fights
      if (['fight', 'elite', 'boss'].includes(n.type)) {
        const pips = n.type === 'boss' ? 5 : n.type === 'elite' ? n.tier + 2 : n.tier;
        for (let i = 0; i < pips; i++) c.add(this.add.circle((i - (pips - 1) / 2) * 9, 44 * big, 3, 0xd0402c, isAvail || isVisited ? 1 : 0.4));
      }
      if (isHere) {
        const you = this.add.image(0, -50, 'lantern');
        c.add(you);
        this.tweens.add({ targets: you, y: -56, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      }
      if (isAvail) {
        const halo = this.add.image(p.x, p.y, 'glow').setScale(0.6 * big).setTint(info.color).setBlendMode('ADD').setAlpha(0.35).setDepth(-1);
        this.tweens.add({ targets: halo, alpha: 0.1, scale: 0.75 * big, duration: 900, yoyo: true, repeat: -1 });
        this.tweens.add({ targets: c, scale: 1.06, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      }
      const z = this.add.zone(0, 0, 70 * big, 70 * big).setInteractive({ useHandCursor: isAvail });
      c.add(z);
      z.on('pointerover', () => { this.tip(info.name, info.desc + (isAvail ? '' : isVisited ? '\nAlready behind you.' : '\nNot reachable from here yet.')); if (isAvail) sfx.hover(); });
      z.on('pointerdown', () => {
        if (!isAvail) { sfx.denied(); return; }
        if (this.selected === n) { this.enter(n); return; }
        this.selected = n;
        this.nodeViews.forEach((v) => v.drawRing(v.n === n));
        sfx.select();
        this.tip(info.name, `${info.desc}\nClick again or press TRAVEL to go.`);
        this.travelBtn.setEnabled(true).setLabel(`Travel: ${info.name}`);
      });
      this.nodeViews.push({ n, drawRing });
    }

    // legend
    const SHORT = { fight: 'Battle', elite: 'Elite', event: 'Curio', rest: 'Sanctuary', shop: 'Ferryman', treasure: 'Vault', boss: 'Bishop' };
    const lg = this.add.container(28, H - 102);
    lg.add(panel(this, -10, -10, 300, 84, { r: 10, alpha: 0.85 }));
    Object.entries(NODE).forEach(([k, v], i) => {
      const x = (i % 3) * 96, y = Math.floor(i / 3) * 22;
      lg.add(this.add.image(x + 9, y + 8, `px_nd_${k}`).setScale(0.3));
      lg.add(this.add.text(x + 22, y, SHORT[k], { fontFamily: FONT_B, fontSize: '13px', color: HEX.bone }));
    });
    lg.add(this.add.circle(105, 52, 3.5, 0xd0402c));
    lg.add(this.add.text(118, 44, 'Threat', { fontFamily: FONT_B, fontSize: '13px', color: HEX.bone }));

    panel(this, W / 2 - 300, H - 104, 600, 84, { r: 12 });
    this.tipTitle = this.add.text(W / 2, H - 94, 'Point at a room to see what waits there.', { fontFamily: FONT_H, fontSize: '16px', color: HEX.bone, fontStyle: '700' }).setOrigin(0.5, 0);
    this.tipBody = this.add.text(W / 2, H - 70, '', { fontFamily: FONT_B, fontSize: '14px', color: HEX.boneDim, align: 'center', wordWrap: { width: 570 } }).setOrigin(0.5, 0);
    this.travelBtn = makeButton(this, W - 130, H - 86, 220, 46, 'Travel', () => { if (this.selected) this.enter(this.selected); }, { size: 14, fill: 0x2a1c0c, stroke: C.amber });
    this.travelBtn.setEnabled(false);
    makeButton(this, W - 130, H - 36, 220, 34, 'Abandon run', () => this.confirmAbandon(), { size: 12, onHover: (o) => o && this.tip('Abandon the run', 'Return to camp now. You still earn Embers for how deep you got.') });
  }

  tip(t, b) { this.tipTitle.setText(t); this.tipBody.setText(b); }

  confirmAbandon() {
    const W = this.scale.width, H = this.scale.height;
    const c = this.add.container(0, 0).setDepth(100);
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x020607, 0.75).setInteractive();
    const p = panel(this, W / 2 - 260, H / 2 - 90, 520, 180, { r: 14, stroke: C.red });
    const t = this.add.text(W / 2, H / 2 - 50, 'Abandon this Vigil?', { fontFamily: FONT_H, fontSize: '24px', color: HEX.bone, fontStyle: '900' }).setOrigin(0.5);
    const b = this.add.text(W / 2, H / 2 - 14, 'You return to camp and earn Embers for the depth you reached.', { fontFamily: FONT_B, fontSize: '15px', color: HEX.boneDim, fontStyle: 'italic' }).setOrigin(0.5);
    c.add([dim, p, t, b,
      makeButton(this, W / 2 - 90, H / 2 + 44, 160, 44, 'Abandon', () => this.abandon(), { size: 14, stroke: C.red }),
      makeButton(this, W / 2 + 90, H / 2 + 44, 160, 44, 'Stay', () => c.destroy(), { size: 14, fill: 0x2a1c0c, stroke: C.amber })]);
  }

  enter(n) {
    const run = this.run;
    sfx.select(); sfx.whoosh();
    run.at = n.id;
    run.depth = n.col + 1;
    run.visited = [...(run.visited ?? []), n.id];
    const rng = R.runRng(run);
    this.input.enabled = false;
    this.cameras.main.fadeOut(450, 5, 11, 12);
    this.time.delayedCall(470, () => {
      if (['fight', 'elite', 'boss'].includes(n.type)) this.scene.start('battle', { mode: 'run', node: n, encounter: R.encounterFor(run, n, rng) });
      else if (n.type === 'event') this.scene.start('event', { kind: 'event', event: R.eventFor(run, rng) });
      else this.scene.start('event', { kind: n.type });
    });
  }
  abandon() {
    this.cameras.main.fadeOut(400, 5, 11, 12);
    this.time.delayedCall(420, () => this.scene.start('runend', { won: false, abandoned: true }));
  }
}
