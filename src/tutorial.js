// Guided first fight. Each step either shows a card (wait: 'continue') or a coach line
// that waits for a game event. The battle scene asks the tutorial what is allowed.
import { FONT_H, FONT_B, HEX, C, makeButton } from './ui.js';
import { sfx } from './audio.js';

const STEPS = [
  { card: { title: 'The Flooded Narthex', text: 'Your Vigil begins with two heroes, BRANNOC the Tidewarden and YSOLDE the Drowned Scholar, one lantern, and a chapel that drowned forty years ago.\n\nThis short fight teaches you everything. Follow the glowing marker. Press ? at any time to see the controls.' } },
  { text: 'Click BRANNOC (the shield) to select him.', point: { unit: 'warden' }, wait: 'select:warden', allow: { select: ['warden'], tiles: [] } },
  { text: 'The lit tiles show where he can walk. Click the marked tile beside the Lamp-Cultist.', point: { tile: [5, 4] }, wait: 'move:warden', allow: { select: ['warden'], tiles: [[5, 4]] } },
  { text: 'Now strike: press TIDE HAMMER, then click the cultist.', point: { button: 'hammer' }, wait: 'act:warden', allow: { select: ['warden'], skills: ['hammer'], tiles: [] }, force: { rolls: [4, 15], dmg: [8] }, fate: true },
  { card: { title: 'Every roll is shown', text: 'A d20 plus your attack bonus. Meet the target\'s GUARD and you hit.\n\nFATE tokens (right panel) let you reroll a roll that only just missed. You get a few per run.\n\nADVANTAGE: roll two dice, keep the higher. It comes from a Marked foe, high ground for ranged attacks, or a foe floundering in deep water. DISADVANTAGE keeps the lower, for example against a foe hidden in darkness. One of each cancels out.\n\nA natural 20 is a critical hit. A natural 1 fumbles.' } },
  { text: 'Select YSOLDE. She carries the lantern, so its light follows her. Move her to the marked tile.', point: { tile: [4, 5] }, wait: 'move:scholar', allow: { select: ['scholar'], tiles: [[4, 5]] } },
  { text: 'Those burning eyes are a foe hidden in darkness: attacks on it have DISADVANTAGE. Use READ THE DARK to reveal it and MARK it, so attacks on it gain ADVANTAGE.', point: { unit: 'husk' }, wait: 'act:scholar', allow: { select: ['scholar'], skills: ['mark'], tiles: [] } },
  { text: 'The icon over each foe is its NEXT MOVE, and the dashed line shows its target. Point at a foe to read it. Both heroes have acted, so press END PHASE.', point: { button: 'end' }, wait: 'endPhase', allow: { select: [], end: true } },
  { card: { title: 'React!', text: 'The Lamp-Cultist swings. When a blow is coming, a ring closes on your hero.\n\nPress SPACE (or click) when the closing ring touches the inner ring. Both flash WHITE in the window.\n\nPERFECT: no damage. Close: a GRAZE, half damage. HEAVY blows from elites are only blunted.\n\nEach hero gets one reaction per enemy phase.' }, trigger: 'beforeEnemyAttack', force: { rolls: [17] } },
  { text: 'Round two. The wounded cultist stands beside DEEP WATER, and it cannot swim. Brannoc: use UNDERTOW to shove it in.', point: { button: 'shove' }, wait: 'act:warden', allow: { select: ['warden'], skills: ['shove'], tiles: [] }, force: { rolls: [16] } },
  { text: 'Ysolde: KINDLE the cold brazier beside you. Light reveals foes and steadies your heroes.', point: { tile: [4, 6] }, wait: 'act:scholar', allow: { select: ['scholar'], skills: ['kindle'], tiles: [] } },
  { card: { title: 'Dread', text: 'The teal bar on each hero is DREAD. Ending a round in darkness adds 8. Horrors, wounds and fallen friends add more. Light, kills and the Bell-Ringer\'s chime take it away.\n\nAt 100 the hero is tested. Fail and they gain a FLAW such as Hopeless or Paranoid. Pass and they gain a VIRTUE, such as a guaranteed critical hit.' } },
  { card: { title: 'The Push', text: 'PUSH (right panel): arm it before an attack and that roll gets +1d6. It costs the hero 10 Dread, so save it for the blow that matters.\n\nThat is everything. The Husk is yours. Use the light, the parry ring and the water.' } },
  { text: 'Finish the Husk. End the phase when your heroes have acted.', wait: 'victory', allow: 'all' },
  { card: { title: 'Spoils', text: 'After every fight you choose one treasure out of three. WEAPONS and CHARMS change how a hero plays. RELICS bend the rules for the whole party. CURSED items are the strongest, and they bite.' }, trigger: 'beforeLoot' },
];

export class Tutorial {
  constructor(scene) {
    this.scene = scene;
    this.i = 0;
    this.layer = scene.add.container(0, 0).setDepth(250);
    this.coach = null;
    this.pointer = null;
    this.waitingCard = null;
  }
  get step() { return STEPS[this.i]; }
  get done() { return this.i >= STEPS.length; }

  async start() { await this.run(); }

  // Show cards / coach lines for the current step. Cards with a trigger wait for that trigger.
  async run() {
    while (!this.done) {
      const st = this.step;
      if (st.trigger) return;
      if (st.card) { await this.showCard(st.card); this.i++; continue; }
      this.showCoach(st);
      return;
    }
    this.clearCoach();
  }

  allowSelect(id) { const a = this.step?.allow; if (!a || a === 'all') return true; return a.select?.includes(id) ?? false; }
  allowTile(x, y) { const a = this.step?.allow; if (!a || a === 'all' || !a.tiles) return true; return a.tiles.some(([tx, ty]) => tx === x && ty === y); }
  allowSkill(id) { const a = this.step?.allow; if (!a || a === 'all') return true; return a.skills?.includes(id) ?? false; }
  allowEnd() { const a = this.step?.allow; if (!a || a === 'all') return true; return !!a.end; }
  isFree() { return this.step?.allow === 'all' || this.done; }

  takeForced(kind) {
    const f = this.step?.force?.[kind];
    if (!f || !f.length) return null;
    return f.shift();
  }

  async event(name) {
    const st = this.step;
    if (!st) return;
    if (st.wait === name) { this.i++; sfx.page(); await this.run(); }
  }
  async trigger(name) {
    const st = this.step;
    if (st?.trigger === name) {
      await this.showCard(st.card);
      // Keep forced values of the trigger step alive until the action that uses them.
      this.pendingForce = st.force;
      this.i++;
      if (!this.step?.trigger) this.showCoachDeferred = true;
      return true;
    }
    return false;
  }
  forcedFromTrigger(kind) {
    const f = this.pendingForce?.[kind];
    if (!f || !f.length) return null;
    return f.shift();
  }
  resumeAfterTrigger() {
    if (this.showCoachDeferred) { this.showCoachDeferred = false; this.run(); }
  }

  showCoach(st) {
    this.clearCoach();
    const s = this.scene;
    const c = s.add.container(424, 116);
    const bg = s.add.graphics();
    const txt = s.add.text(0, 0, st.text, {
      fontFamily: FONT_B, fontSize: '17px', color: HEX.bone, wordWrap: { width: 620 }, align: 'center', lineSpacing: 3,
    }).setOrigin(0.5);
    const w = 680, h = txt.height + 34;
    bg.fillStyle(0x07110f, 0.94); bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    bg.lineStyle(2, C.amber, 0.9); bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
    const tag = s.add.text(-w / 2 + 14, -h / 2 - 10, 'GUIDE', { fontFamily: FONT_H, fontSize: '12px', color: HEX.ink, backgroundColor: HEX.amber, padding: { x: 6, y: 2 }, fontStyle: '700' });
    c.add([bg, txt, tag]);
    c.alpha = 0; c.y -= 10;
    s.tweens.add({ targets: c, alpha: 1, y: c.y + 10, duration: 260, ease: 'Quad.Out' });
    this.layer.add(c);
    this.coach = c;
    if (st.point) s.time.delayedCall(80, () => { if (this.coach === c) this.pointAt(st.point); });
  }
  pointAt(p) {
    const s = this.scene;
    let x, y;
    if (p.unit) { const u = s.s.units.find((v) => v.id === p.unit || v.kind === p.unit); if (!u) return; x = s.tx(u.x); y = s.ty(u.y) - 44; }
    else if (p.tile) { x = s.tx(p.tile[0]); y = s.ty(p.tile[1]) - 40; }
    else if (p.button) { const b = s.buttonFor(p.button); if (!b) return; x = b.x; y = b.y - 52; }
    const g = s.add.graphics();
    g.fillStyle(C.amber, 1);
    g.fillTriangle(-14, -10, 14, -10, 0, 12);
    g.lineStyle(3, 0x050b0c, 1);
    g.strokeTriangle(-14, -10, 14, -10, 0, 12);
    g.setPosition(x, y);
    this.layer.add(g);
    s.tweens.add({ targets: g, y: y - 12, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.pointer = g;
    if (p.tile) {
      const ring = s.add.rectangle(s.tx(p.tile[0]), s.ty(p.tile[1]), 56, 56).setStrokeStyle(3, C.amber, 1);
      s.tweens.add({ targets: ring, alpha: 0.25, duration: 500, yoyo: true, repeat: -1 });
      this.layer.add(ring);
      this.ring = ring;
    }
  }
  clearCoach() {
    this.coach?.destroy(); this.coach = null;
    this.pointer?.destroy(); this.pointer = null;
    this.ring?.destroy(); this.ring = null;
  }

  showCard(card) {
    this.clearCoach();
    const s = this.scene;
    s.modal = true;
    return new Promise((resolve) => {
      const W = s.scale.width, H = s.scale.height;
      const c = s.add.container(0, 0).setDepth(400);
      const dim = s.add.rectangle(W / 2, H / 2, W, H, 0x020607, 0.66).setInteractive();
      const bg = s.add.graphics();
      const title = s.add.text(W / 2, 0, card.title, { fontFamily: FONT_H, fontSize: '30px', color: HEX.amber, fontStyle: '900' }).setOrigin(0.5);
      const body = s.add.text(W / 2, 0, card.text, { fontFamily: FONT_B, fontSize: '18px', color: HEX.bone, wordWrap: { width: 560 }, lineSpacing: 5 }).setOrigin(0.5, 0);
      const h = body.height + 160;
      const top = H / 2 - h / 2;
      bg.fillStyle(0x000000, 0.5); bg.fillRoundedRect(W / 2 - 320 + 4, top + 8, 640, h, 16);
      bg.fillStyle(0x0b1517, 1); bg.fillRoundedRect(W / 2 - 320, top, 640, h, 16);
      bg.lineStyle(2, C.amber, 1); bg.strokeRoundedRect(W / 2 - 320, top, 640, h, 16);
      bg.lineStyle(1, C.amber, 0.3); bg.strokeRoundedRect(W / 2 - 312, top + 8, 624, h - 16, 12);
      title.y = top + 42;
      body.y = top + 76;
      const btn = makeButton(s, W / 2, top + h - 40, 200, 46, 'Continue', () => close(), { size: 16 });
      const skip = makeButton(s, W / 2 + 236, top + h - 40, 124, 34, 'Skip tutorial', () => { s.skipTutorial(); close(); }, { size: 12, sub: 'still get 40 Embers' });
      c.add([dim, bg, title, body, btn, skip]);
      c.alpha = 0;
      s.tweens.add({ targets: c, alpha: 1, duration: 220 });
      sfx.page();
      const key = s.input.keyboard.addKey('ENTER');
      const close = () => {
        key.off('down', close);
        s.tweens.add({ targets: c, alpha: 0, duration: 160, onComplete: () => { c.destroy(); s.modal = false; resolve(); } });
      };
      key.on('down', close);
    });
  }
  destroy() { this.clearCoach(); this.layer.destroy(); this.i = STEPS.length; }
}
