import { HEROES, UPGRADES } from '../data.js';
import { sfx, musicPlayer } from '../audio.js';
import { C, HEX, FONT_H, FONT_B, makeButton, panel } from '../ui.js';
import { unitKey } from '../sprites.js';
import { saveMeta } from '../save.js';
import { createRun } from '../rules.js';
import { shoreBackdrop } from './backdrop.js';

const Phaser = window.Phaser;

export default class CampScene extends Phaser.Scene {
  constructor() { super('camp'); }
  init(data) { this.fromTutorial = !!data?.fromTutorial; }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.meta = this.registry.get('meta');
    this.cameras.main.fadeIn(700, 5, 11, 12);
    musicPlayer.play('camp');
    shoreBackdrop(this, { fire: true, cityAlpha: 0.8 });
    this.add.rectangle(W / 2, H / 2, W, H, 0x020607, 0.25);
    this.add.text(W / 2, 36, 'THE SHORE CAMP', { fontFamily: FONT_H, fontSize: '34px', color: HEX.bone, fontStyle: '900', letterSpacing: 6, stroke: '#050b0c', strokeThickness: 6 }).setOrigin(0.5);
    this.add.text(W / 2, 72, 'The drowned cathedral waits across the water. Spend your Embers, then go down.', { fontFamily: FONT_B, fontSize: '16px', color: HEX.amber, fontStyle: 'italic', stroke: '#050b0c', strokeThickness: 4 }).setOrigin(0.5);
    this.add.image(W - 120, 40, 'glow').setScale(0.5).setTint(C.amber).setBlendMode('ADD').setAlpha(0.6);
    this.emberText = this.add.text(W - 40, 22, '', { fontFamily: FONT_H, fontSize: '26px', color: HEX.amberHot, fontStyle: '900', stroke: '#050b0c', strokeThickness: 5 }).setOrigin(1, 0);
    this.add.text(W - 40, 56, 'EMBERS', { fontFamily: FONT_H, fontSize: '11px', color: HEX.amber, fontStyle: '700', letterSpacing: 3 }).setOrigin(1, 0);
    this.add.text(40, 22, `Vigils ${this.meta.runs} · Victories ${this.meta.wins} · Deepest ${this.meta.bestDepth}/8`, { fontFamily: FONT_B, fontSize: '14px', color: HEX.boneDim, fontStyle: 'italic' });
    this.affordHint = this.add.text(W / 2, 96, '', { fontFamily: FONT_B, fontSize: '14px', color: HEX.amberHot, fontStyle: 'italic' }).setOrigin(0.5);

    this.upLayer = this.add.container(0, 0);
    this.drawUpgrades();

    Object.entries(HEROES).forEach(([id, def], i) => {
      const x = 230 + i * 410, y = 494;
      const c = this.add.container(x, y);
      c.add(panel(this, -190, -48, 380, 96, { r: 12, alpha: 0.9 }));
      const port = this.add.graphics();
      port.fillStyle(0x16211f, 1); port.fillCircle(-142, 0, 32);
      port.lineStyle(3, id === 'warden' ? C.amber : id === 'scholar' ? C.dread : C.bone, 1); port.strokeCircle(-142, 0, 32);
      const gl = this.add.image(-142, 30, unitKey(id, true)).setOrigin(0.5, 1).setScale(0.72);
      c.add([port, gl,
        this.add.text(-98, -38, `${def.name}`, { fontFamily: FONT_H, fontSize: '17px', color: HEX.bone, fontStyle: '700' }),
        this.add.text(-98, -16, `${def.cls} · ${def.role}`, { fontFamily: FONT_B, fontSize: '13px', color: HEX.amber, fontStyle: 'italic' }),
        this.add.text(-98, 3, def.bio, { fontFamily: FONT_B, fontSize: '12px', color: HEX.boneDim, wordWrap: { width: 280 } }),
      ]);
      this.tweens.add({ targets: gl, y: -3, duration: 1200 + i * 200, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    });

    const go = makeButton(this, W / 2, H - 52, 360, 66, 'Begin the Descent', () => this.embark(), { size: 22, fill: 0x2a1c0c, stroke: C.amber, sub: 'a new Vigil: 8 depths, then the Bishop' });
    this.tweens.add({ targets: go, scale: 1.04, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    makeButton(this, 110, H - 40, 170, 40, 'Title Screen', () => this.go('title'), { size: 13 });
    makeButton(this, W - 110, H - 40, 170, 40, 'Replay Tutorial', () => {
      this.registry.set('run', createRun({}, 7));
      this.go('battle', { mode: 'tutorial', encounter: { roomId: 'narthex', enemies: ['cultist', 'husk'], tier: 1 } });
    }, { size: 13 });

    if (this.fromTutorial || !this.meta.loreSeen) this.time.delayedCall(800, () => this.welcome());
  }

  drawUpgrades() {
    this.upLayer.removeAll(true);
    this.emberText.setText(`${this.meta.embers}`);
    let canAfford = null;
    UPGRADES.forEach((u, i) => {
      const lvl = this.meta.upgrades[u.id] ?? 0;
      const x = 230 + (i % 3) * 410, y = 186 + Math.floor(i / 3) * 142;
      const c = this.add.container(x, y);
      c.add(panel(this, -190, -62, 380, 128, { r: 12, alpha: 0.9, stroke: lvl ? C.amber : 0x24393a }));
      c.add(this.add.text(-174, -52, u.name, { fontFamily: FONT_H, fontSize: '17px', color: HEX.amber, fontStyle: '700' }));
      c.add(this.add.text(174, -50, '◆'.repeat(lvl) + '◇'.repeat(3 - lvl), { fontFamily: 'Georgia, serif', fontSize: '15px', color: HEX.amberHot }).setOrigin(1, 0));
      const owned = u.desc.slice(0, lvl).map((d) => `✓ ${d}`).join('\n');
      c.add(this.add.text(-174, -26, owned || 'Not built yet.', { fontFamily: FONT_B, fontSize: '12px', color: owned ? HEX.bone : HEX.boneDim, wordWrap: { width: 230 }, lineSpacing: 1 }));
      if (lvl < 3) {
        const cost = u.cost[lvl];
        const can = this.meta.embers >= cost;
        if (can && !canAfford) canAfford = u.name;
        c.add(this.add.text(-174, 18, `Next: ${u.desc[lvl]}`, { fontFamily: FONT_B, fontSize: '13px', color: HEX.bone, fontStyle: 'italic', wordWrap: { width: 196 } }));
        const b = makeButton(this, 112, 28, 136, 46, `${cost} Embers`, () => {
          if (this.meta.embers < cost) { sfx.denied(); return; }
          this.meta.embers -= cost;
          this.meta.upgrades[u.id] = lvl + 1;
          saveMeta(this.meta);
          sfx.equip(); sfx.loot('relic');
          this.cameras.main.flash(200, 232, 163, 61);
          this.drawUpgrades();
        }, { size: 14, fill: can ? 0x2a1c0c : 0x12201f, stroke: can ? C.amber : 0x5a2a22, color: can ? HEX.amberHot : '#b0645a', sub: can ? 'build' : 'not enough' });
        c.add(b);
        if (can) this.tweens.add({ targets: b, scale: 1.06, duration: 700, yoyo: true, repeat: -1 });
      } else c.add(this.add.text(112, 28, 'Complete', { fontFamily: FONT_H, fontSize: '14px', color: HEX.amberHot, fontStyle: '700' }).setOrigin(0.5));
      this.upLayer.add(c);
    });
    this.affordHint.setText(canAfford ? `You can afford an upgrade: ${canAfford}.` : '');
  }

  welcome() {
    const W = this.scale.width, H = this.scale.height;
    const c = this.add.container(0, 0).setDepth(200);
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x020607, 0.75).setInteractive();
    const p = panel(this, W / 2 - 350, H / 2 - 210, 700, 420, { r: 16, stroke: C.amber });
    const t = this.add.text(W / 2, H / 2 - 172, 'The Vigil Gathers', { fontFamily: FONT_H, fontSize: '30px', color: HEX.amber, fontStyle: '900' }).setOrigin(0.5);
    const text = [
      'Forty years ago the lake swallowed the city of Lowmarsh. This spring it gave the cathedral back, and every night since, its bells have rung. Nobody down there should be able to ring them.',
      '',
      'OLD HESK the Bell-Ringer joins Brannoc and Ysolde at the fire. She controls the battlefield: TOLL pushes foes back and dazes them, and CHIME heals and calms.',
      '',
      'A Vigil is a descent through 8 depths to the Drowned Bishop. Pick your route, fight, find curios and treasure, and build your heroes with loot and Talents. Fallen heroes may not rise again.',
      '',
      'Win or lose, you earn EMBERS. Spend them here on permanent upgrades. You have 40 to start.',
    ].join('\n');
    const b = this.add.text(W / 2, H / 2 - 132, text, { fontFamily: FONT_B, fontSize: '16px', color: HEX.bone, wordWrap: { width: 620 }, lineSpacing: 4 }).setOrigin(0.5, 0);
    const btn = makeButton(this, W / 2, H / 2 + 172, 220, 48, 'To the fire', () => { sfx.click(); this.meta.loreSeen = true; saveMeta(this.meta); c.destroy(); }, { size: 16 });
    c.add([dim, p, t, b, btn]);
    sfx.chime();
  }

  embark() {
    sfx.bell();
    this.meta.runs++;
    saveMeta(this.meta);
    const run = createRun(this.meta, Date.now());
    run.meta = { ...this.meta.upgrades };
    this.registry.set('run', run);
    this.go('map');
  }
  go(key, data) {
    this.input.enabled = false;
    this.cameras.main.fadeOut(700, 5, 11, 12);
    this.time.delayedCall(720, () => this.scene.start(key, data));
  }
}
