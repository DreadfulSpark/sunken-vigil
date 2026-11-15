import * as R from '../rules.js';
import { SKILLS, ENEMIES, HEROES, LINES, RARITY, BARKS, FLAWS, VIRTUES, itemById, talentById } from '../data.js';
import { sfx, musicPlayer } from '../audio.js';
import { C, HEX, FONT_H, FONT_B, makeButton, panel, floatText } from '../ui.js';
import { showLootChoice, showTalentChoice } from '../loot.js';
import { Tutorial } from '../tutorial.js';
import { saveMeta } from '../save.js';
import { unitKey } from '../sprites.js';
import * as FX from '../battleFx.js';

const Phaser = window.Phaser;
const T = 60, BX = 34, BY = 92, BW = 13 * T, BH = 9 * T;
const PX = 842, PW = 410;
const DARK_ALPHA = [0.64, 0.32, 0];
const rand = (a) => a[Math.floor(Math.random() * a.length)];
const INTENT_TEX = { attack: 'in_attack', shoot: 'in_shoot', pull: 'in_pull', snuff: 'in_snuff', snuffFar: 'in_snuff', cleave: 'in_cleave', raise: 'in_raise', litany: 'in_litany', move: 'in_move', dazed: 'in_dazed', sink: 'in_sink', heal: 'in_heal', psalm: 'in_pull', lamp: 'in_lamp', charge: 'in_charge', dirge: 'in_dirge', ward: 'in_ward' };
const DANGER = ['attack', 'shoot', 'pull', 'cleave', 'psalm', 'lamp', 'charge', 'dirge'];

export default class BattleScene extends Phaser.Scene {
  constructor() { super('battle'); }

  init(data) {
    this.mode = data.mode ?? 'run';
    this.node = data.node ?? null;
    this.run = this.registry.get('run');
    this.meta = this.registry.get('meta');
    const enc = data.encounter;
    this.s = R.createBattle(this.run, {
      roomId: enc.roomId, enemies: enc.enemies, tier: enc.tier, seed: Date.now(),
      flip: this.mode !== 'tutorial' && Math.random() < 0.5, tutorial: this.mode === 'tutorial',
    });
    if (R.hasRelic(this.run, 'r_prayer')) this.run.fate = Math.min(6, this.run.fate + 1);
    this.tut = null; this.lanternFlying = false;
    this.busy = false; this.modal = false; this.over = false;
    this.sel = null; this.ui = 'idle'; this.skill = null; this.pendingItem = null;
    this.tokens = new Map(); this.logLines = []; this.seen = new Set();
    this.actionButtons = []; this.tutRingRetry = false; this.controlsPanel = null; this.captionText = null;
  }

  create() {
    this.cameras.main.fadeIn(500, 5, 11, 12);
    this.drawBackdrop();
    this.drawBoard();
    this.makeOverlay();
    this.makeLights();
    this.makeTokens();
    this.makeHud();
    this.makeTray();
    this.bindInput();
    this.refreshLight(true);
    this.refreshVisibility(true);
    this.refreshHud();
    this.refreshBars();
    musicPlayer.play(this.s.units.some((u) => u.boss) ? 'boss' : 'battle');
    sfx.ambience(true);
    this.events.once('shutdown', () => sfx.ambience(false));
    if (this.mode === 'tutorial') this.tut = new Tutorial(this);
    this.time.delayedCall(350, () => this.beginBattle());
  }

  async beginBattle() {
    const boss = this.s.units.find((u) => u.boss);
    this.say(boss ? 'boss' : this.mode === 'tutorial' ? 'runStart' : 'roomStart', {}, boss ? HEX.red : HEX.bone, true);
    await this.banner(this.s.roomName, boss ? 'The Bishop awaits' : this.mode === 'tutorial' ? 'A first lesson' : `Depth ${this.run.depth}`);
    if (this.tut) await this.tut.start();
    this.startRound();
  }

  // ---------- helpers ----------
  tx(x) { return BX + x * T + T / 2; }
  ty(y) { return BY + y * T + T / 2; }
  wait(ms) { return new Promise((r) => this.time.delayedCall(ms, r)); }
  tween(cfg) { return new Promise((r) => this.tweens.add({ ...cfg, onComplete: () => r() })); }
  get rng() { return this.s.rng; }
  hname(u) { return u.side === 'hero' ? HEROES[u.id].name : u.name; }

  // Narrator: templated lines, no repeats within a run until a category is exhausted.
  line(cat, ctx = {}) {
    const pool = LINES[cat];
    if (!pool) return '';
    const seen = (this.run.lineSeen[cat] ??= []);
    let opts = pool.map((_, i) => i).filter((i) => !seen.includes(i));
    if (!opts.length) { seen.length = 0; opts = pool.map((_, i) => i); }
    const i = rand(opts);
    seen.push(i);
    return pool[i]
      .replaceAll('{hero}', ctx.hero ? this.hname(ctx.hero) : 'the Vigil')
      .replaceAll('{foe}', ctx.foe ? ctx.foe.name.replace(/^The /, '') : 'thing')
      .replaceAll('{room}', this.s.roomName)
      .replaceAll('{hp}', ctx.hp ?? '');
  }
  say(cat, ctx = {}, color = HEX.bone, caption = false) {
    const text = this.line(cat, ctx);
    if (!text) return;
    this.log(text, color);
    if (caption) this.caption(text, color);
  }
  log(text, color = HEX.bone) {
    this.logLines.unshift({ text, color });
    this.logLines = this.logLines.slice(0, 7);
    this.drawLog();
  }
  caption(text, color = HEX.bone) {
    this.captionText?.destroy();
    const t = this.add.text(BX + BW / 2, BY + BH - 22, text, {
      fontFamily: FONT_B, fontSize: '19px', color, fontStyle: 'italic', stroke: '#050b0c', strokeThickness: 6,
      align: 'center', wordWrap: { width: BW - 80 },
    }).setOrigin(0.5, 1).setDepth(70).setAlpha(0);
    this.captionText = t;
    this.tweens.add({ targets: t, alpha: 1, duration: 260 });
    this.tweens.add({ targets: t, alpha: 0, delay: 2600, duration: 500, onComplete: () => { if (this.captionText === t) this.captionText = null; t.destroy(); } });
  }
  bark(u, kind, chance = 1) {
    if (!u || u.side !== 'hero' || u.dead || Math.random() > chance) return;
    const lines = BARKS[u.id]?.[kind];
    if (!lines) return;
    const t = this.tokens.get(u.id);
    const txt = rand(lines);
    const c = this.add.container(t.c.x, t.c.y - 62).setDepth(66);
    const label = this.add.text(0, 0, txt, { fontFamily: FONT_B, fontSize: '14px', color: '#0a0f10', fontStyle: 'italic', align: 'center', wordWrap: { width: 190 } }).setOrigin(0.5);
    const w = label.width + 18, h = label.height + 10;
    const bg = this.add.graphics();
    bg.fillStyle(C.bone, 0.96); bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    bg.fillTriangle(-6, h / 2 - 1, 6, h / 2 - 1, 0, h / 2 + 8);
    c.add([bg, label]);
    c.x = Phaser.Math.Clamp(c.x, BX + w / 2, BX + BW - w / 2);
    c.setScale(0.6).setAlpha(0);
    this.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 180, ease: 'Back.Out' });
    this.tweens.add({ targets: c, alpha: 0, y: c.y - 10, delay: 1900, duration: 300, onComplete: () => c.destroy() });
  }
  hitStop(ms) {
    this.tweens.pauseAll();
    return new Promise((r) => setTimeout(() => { this.tweens.resumeAll(); r(); }, ms));
  }

  // ---------- drawing: board ----------
  drawBackdrop() {
    const W = this.scale.width, H = this.scale.height;
    this.add.rectangle(W / 2, H / 2, W, H, C.void);
    const bgGlow = this.add.image(BX + BW / 2, BY + BH / 2, 'glow').setScale(5).setTint(C.abyss).setAlpha(0.7);
    this.tweens.add({ targets: bgGlow, alpha: 0.45, duration: 4000, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    const wall = this.add.tileSprite(BX + BW / 2, BY + BH / 2, BW + 44, BH + 44, 'px_walld0').setTint(0x8a9894);
    const g = this.add.graphics();
    g.lineStyle(3, 0x050b0c, 1); g.strokeRect(BX - 2, BY - 2, BW + 4, BH + 4);
    g.lineStyle(1, 0x5b6a66, 0.5); g.strokeRect(BX - 22, BY - 22, BW + 44, BH + 44);
    // torches burn in sconces on the side walls, spilling light onto the edge of the floor
    const sconces = [];
    for (const row of [1.5, 6.5]) { sconces.push([BX - 11, BY + row * T]); sconces.push([BX + BW + 11, BY + row * T]); }
    this.wallTorches = sconces.map(([x, y]) => {
      const tImg = this.add.image(x, y, 'px_torch0').setScale(0.7).setDepth(3);
      const tGlow = this.add.image(x, y, 'glow').setScale(1.2).setTint(0xffa040).setBlendMode('ADD').setAlpha(0.3).setDepth(31);
      return { tImg, tGlow, f: Math.floor(Math.random() * 5) };
    });
    this.time.addEvent({ delay: 110, loop: true, callback: () => {
      for (const w of this.wallTorches) { w.f = (w.f + 1) % 5; w.tImg.setTexture(`px_torch${w.f}`); w.tGlow.setAlpha(0.28 + Math.random() * 0.12); }
    } });
    this.add.text(BX - 12, 16, 'THE SUNKEN VIGIL', { fontFamily: FONT_H, fontSize: '12px', color: HEX.amber, fontStyle: '700', letterSpacing: 3 });
    this.add.text(BX - 12, 32, this.s.roomName, { fontFamily: FONT_H, fontSize: '22px', color: HEX.bone, fontStyle: '700' });
    this.phaseText = this.add.text(BX + BW + 14, 18, '', { fontFamily: FONT_H, fontSize: '17px', color: HEX.bone, fontStyle: '700' }).setOrigin(1, 0);
    this.hintText = this.add.text(BX + BW + 14, 44, '', { fontFamily: FONT_B, fontSize: '14px', color: HEX.boneDim, fontStyle: 'italic', align: 'right', wordWrap: { width: 440 } }).setOrigin(1, 0);
  }

  drawBoard() {
    const s = this.s;
    this.tileImgs = [];
    const edges = this.add.graphics().setDepth(2);
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) this.drawTile(x, y, edges);
    const grid = this.add.graphics().setDepth(2);
    grid.lineStyle(1, 0x000000, 0.2);
    for (let x = 0; x <= s.w; x++) grid.lineBetween(BX + x * T, BY, BX + x * T, BY + BH);
    for (let y = 0; y <= s.h; y++) grid.lineBetween(BX, BY + y * T, BX + BW, BY + y * T);
    this.drawProps();
    // light glints drifting on the deep water
    if (this.deepTiles?.length) {
      const dt = this.deepTiles;
      this.add.particles(0, 0, 'mote', {
        emitCallback: (p) => { const d = dt[Math.floor(Math.random() * dt.length)]; p.x = d.x + (Math.random() - 0.5) * T; p.y = d.y + (Math.random() - 0.5) * T; },
        lifespan: 1400, speedX: { min: -6, max: 6 }, scale: { start: 1.4, end: 0.2 }, alpha: { onEmit: () => 0, onUpdate: (p, k, t) => Math.sin(t * Math.PI) * 0.8 },
        tint: 0xbfe6dc, blendMode: 'ADD', frequency: 90,
      }).setDepth(2);
    }
    // water breathes: each pool tile swaps between its two frames out of step with its neighbours
    this.time.addEvent({ delay: 420, loop: true, callback: () => {
      for (const img of this.tileImgs) {
        if (!img || Math.random() > 0.3) continue;
        const k = img.texture.key;
        if (k.startsWith('px_deep')) img.setTexture(k === 'px_deep' ? 'px_deep2' : 'px_deep');
        else if (k.startsWith('px_shallow')) img.setTexture(k === 'px_shallow' ? 'px_shallow2' : 'px_shallow');
      }
    } });
    this.add.image(BX + BW / 2, BY + BH / 2, 'vignette').setDepth(33).setAlpha(0.75);
    this.add.particles(0, 0, 'mote', {
      x: { min: BX, max: BX + BW }, y: { min: BY, max: BY + BH }, lifespan: 6000, speedX: { min: -6, max: 6 }, speedY: { min: -10, max: -3 },
      alpha: { start: 0.7, end: 0 }, scale: { min: 0.4, max: 1 }, quantity: 1, frequency: 260, blendMode: 'ADD', tint: 0xd9cfb8,
    }).setDepth(34).setAlpha(0.5);
    this.add.particles(0, 0, 'drop', {
      x: { min: BX, max: BX + BW }, y: BY, lifespan: 900, speedY: { min: 260, max: 380 }, scale: { start: 0.5, end: 0.3 },
      alpha: { start: 0.5, end: 0 }, tint: 0x7fb8ae, frequency: 700,
    }).setDepth(34);
    this.highlight = this.add.graphics().setDepth(35);
    this.hoverG = this.add.graphics().setDepth(36);
    this.intentG = this.add.graphics().setDepth(37);
    this.intentLayer = this.add.container(0, 0).setDepth(42);
  }
  drawTile(x, y, edges) {
    const s = this.s;
    const ch = R.tileAt(s, x, y);
    const cx = this.tx(x), cy = this.ty(y);
    const r4 = () => Math.floor(Math.random() * 4);
    const floorKey = `px_${['ossuary', 'crypt'].includes(s.roomId) ? 'floorb' : 'floor'}${r4()}`;
    let key = floorKey;
    if (ch === ',') key = Math.random() < 0.5 ? 'px_shallow' : 'px_shallow2';
    else if (ch === '~') key = Math.random() < 0.5 ? 'px_deep' : 'px_deep2';
    else if (ch === '^') key = `px_dais${Math.floor(Math.random() * 3)}`;
    const img = this.add.image(cx, cy, key).setDepth(0);
    if (key === floorKey) img.setFlipX(Math.random() < 0.5).setFlipY(Math.random() < 0.5);
    this.tileImgs[y * s.w + x] = img;
    // statues, braziers and chests stand on the tile and overhang the one behind it
    const objKey = ch === '#' ? `px_pillar${(x * 7 + y * 3) % 3}` : ch === 'B' ? 'px_brazier' : ch === 'C' ? 'px_chest' : null;
    let obj = null;
    if (objKey) {
      this.add.ellipse(cx + 2, cy + T / 2 - 8, T * 0.8, 14, 0x000000, 0.45).setDepth(1);
      obj = this.add.image(cx, cy + T / 2 - 2, objKey).setOrigin(0.5, 1).setDepth(29 + y * 0.01);
      if (ch === '#' && x % 2) obj.setFlipX(true);
    }
    if (ch === '~' || ch === ',') {
      const rip = this.add.image(cx, cy, 'ripple').setDepth(1).setAlpha(0).setAngle(Math.random() < 0.5 ? 0 : 180);
      this.tweens.add({ targets: rip, alpha: ch === '~' ? 0.55 : 0.3, x: cx + 4, duration: 1600 + Math.random() * 1400, yoyo: true, repeat: -1, delay: Math.random() * 2000, ease: 'Sine.InOut' });
      if (ch === '~') {
        const gl = this.add.image(cx, cy, 'ripple').setDepth(31).setAlpha(0.2).setTint(0x9fd6cb).setBlendMode('ADD');
        this.tweens.add({ targets: gl, alpha: 0.32, x: cx - 3, duration: 2000 + Math.random() * 1500, yoyo: true, repeat: -1, delay: Math.random() * 2000 });
      }
    }
    if (ch === 'C') { const ch2 = R.chestAt(s, x, y); if (ch2) ch2.img = obj; }
    if (edges && ch === '^') {
      if (R.tileAt(s, x, y + 1) !== '^') { edges.fillStyle(0x000000, 0.35); edges.fillRect(cx - T / 2, cy + T / 2, T, 7); }
      if (R.tileAt(s, x + 1, y) !== '^') { edges.fillStyle(0x000000, 0.25); edges.fillRect(cx + T / 2, cy - T / 2, 6, T); }
    }
    if (edges && (ch === '~' || ch === ',')) {
      // foam where the water meets stone, a dark lip where the deep drops off
      const wet = (c) => c === '~' || c === ',';
      const L = cx - T / 2, Tp = cy - T / 2;
      edges.fillStyle(0xbfe6dc, ch === '~' ? 0.32 : 0.22);
      if (!wet(R.tileAt(s, x, y - 1))) edges.fillRect(L, Tp, T, 3);
      if (!wet(R.tileAt(s, x, y + 1))) edges.fillRect(L, Tp + T - 2, T, 2);
      if (!wet(R.tileAt(s, x - 1, y))) edges.fillRect(L, Tp, 2, T);
      if (!wet(R.tileAt(s, x + 1, y))) edges.fillRect(L + T - 2, Tp, 2, T);
      if (ch === '~' && R.tileAt(s, x, y - 1) === ',') { edges.fillStyle(0x000000, 0.3); edges.fillRect(L, Tp, T, 6); }
      if (ch === '~') (this.deepTiles ??= []).push({ x: cx, y: cy });
    }
  }
  drawProps() {
    const s = this.s;
    const free = [];
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) if (R.tileAt(s, x, y) === '.' && !R.unitAt(s, x, y)) free.push({ x, y });
    const kind = s.props ?? 'pews';
    for (let i = 0; i < 7 && free.length; i++) {
      const p = free.splice(Math.floor(Math.random() * free.length), 1)[0];
      this.add.image(this.tx(p.x) + (Math.random() * 10 - 5), this.ty(p.y) + T / 2 - 4, `px_prop_${kind}${i % 3}`).setOrigin(0.5, 1).setDepth(1).setFlipX(Math.random() < 0.5);
    }
    for (let i = 0; i < 3 && free.length; i++) {
      const p = free.splice(Math.floor(Math.random() * free.length), 1)[0];
      const cx = this.tx(p.x) + (Math.random() * 16 - 8), cy = this.ty(p.y) + 8;
      this.add.image(cx, cy + 12, 'px_candles').setOrigin(0.5, 1).setDepth(1).setScale(0.7);
      const cg = this.add.image(cx, cy - 6, 'glow').setScale(0.45).setTint(0xffb050).setBlendMode('ADD').setAlpha(0.3).setDepth(31);
      this.tweens.add({ targets: cg, alpha: 0.18, scale: 0.4, duration: 180 + Math.random() * 200, yoyo: true, repeat: -1 });
    }
    const pool = free[Math.floor(Math.random() * free.length)];
    if (pool) {
      const sg = this.add.image(this.tx(pool.x), this.ty(pool.y), 'glow').setScale(0.9, 0.6).setTint(Math.random() < 0.5 ? 0x7fb8ae : 0xc0402c).setAlpha(0.22).setBlendMode('ADD').setDepth(31);
      this.tweens.add({ targets: sg, alpha: 0.12, duration: 3000, yoyo: true, repeat: -1 });
    }
  }
  floodShallows() {
    const s = this.s;
    s.flooded = true;
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
      if (s.tiles[y][x] !== ',') continue;
      s.tiles[y][x] = '~';
      this.tileImgs[y * s.w + x].setTexture('px_deep');
      this.fx.brine.explode(6, this.tx(x), this.ty(y));
      const gl = this.add.image(this.tx(x), this.ty(y), 'ripple').setDepth(31).setAlpha(0.25).setTint(0x9fd6cb).setBlendMode('ADD');
      this.tweens.add({ targets: gl, alpha: 0.35, x: this.tx(x) - 3, duration: 1800, yoyo: true, repeat: -1 });
      const u = R.unitAt(s, x, y);
      if (u?.side === 'hero' && !u.swims) { u.inDeep = true; floatText(this, this.tx(x), this.ty(y) - 30, 'IN DEEP WATER', HEX.red, { size: 15 }); }
    }
    sfx.splash(); this.cameras.main.shake(700, 0.008);
  }

  makeOverlay() {
    const s = this.s;
    this.darkTiles = [];
    for (let y = 0; y < s.h; y++) {
      const row = [];
      for (let x = 0; x < s.w; x++) row.push(this.add.rectangle(this.tx(x), this.ty(y), T, T, 0x020a0e, 1).setDepth(30).setAlpha(DARK_ALPHA[0]));
      this.darkTiles.push(row);
    }
  }
  makeLights() {
    const s = this.s;
    for (const b of s.braziers) {
      b.glow = this.add.image(this.tx(b.x), this.ty(b.y), 'glow').setDepth(31).setBlendMode('ADD').setTint(C.amber).setScale(1.6).setAlpha(0);
      b.coals = this.add.image(this.tx(b.x), this.ty(b.y), 'coals').setDepth(31).setAlpha(0);
      b.flame = this.add.particles(this.tx(b.x), this.ty(b.y) - 2, 'spark', {
        lifespan: { min: 380, max: 760 }, speedY: { min: -70, max: -28 }, speedX: { min: -14, max: 14 },
        scale: { start: 1.3, end: 0 }, alpha: { start: 1, end: 0 }, tint: [0xfff0b0, 0xffc861, 0xe8a33d, 0xc0501c],
        blendMode: 'ADD', frequency: 34, quantity: 1, emitting: false,
      }).setDepth(32);
      if (b.lit) { b.flame.start(); b.coals.setAlpha(1); b.glow.setAlpha(0.42); }
    }
    this.lanternGlow = this.add.image(0, 0, 'glow').setDepth(31).setBlendMode('ADD').setTint(0xffc861).setScale(1.2).setAlpha(0.38);
    this.lanternImg = this.add.image(0, 0, 'lantern').setDepth(41);
    this.fireGlow = this.add.image(0, 0, 'glow').setDepth(31).setBlendMode('ADD').setTint(0xff7a2a).setScale(1.1).setAlpha(0);
    this.time.addEvent({ delay: 90, loop: true, callback: () => {
      for (const b of s.braziers) if (b.lit) b.glow.setAlpha(0.36 + Math.random() * 0.1).setScale(1.55 + Math.random() * 0.08);
      this.lanternGlow.setAlpha(0.32 + Math.random() * 0.08);
    } });
    const mk = (tint, add = true, extra = {}) => this.add.particles(0, 0, 'spark', {
      speed: { min: 60, max: 240 }, lifespan: { min: 300, max: 700 }, scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 }, tint, blendMode: add ? 'ADD' : 'NORMAL', emitting: false, ...extra,
    }).setDepth(50);
    this.fx = {
      spark: mk([0xffd27a, 0xe8a33d, 0xffffff]),
      blood: mk([0x8c1c1c, 0x5a0f0f], false, { gravityY: 300 }),
      brine: mk([0x7fb8ae, 0x2d6b6b, 0xd9cfb8], false, { gravityY: 260 }),
      gold: mk([0xffd27a, 0xfff3c9, 0xe8a33d], true, { speed: { min: 120, max: 420 }, lifespan: { min: 500, max: 1100 }, scale: { start: 1.8, end: 0 } }),
      dread: mk([0x7fb8ae, 0x3a6b66], true, { speed: { min: 20, max: 80 }, lifespan: 1000, gravityY: -60 }),
      dust: this.add.particles(0, 0, 'smoke', { speed: { min: 8, max: 34 }, angle: { min: 180, max: 360 }, lifespan: 420, scale: { start: 0.5, end: 1.3 }, alpha: { start: 0.35, end: 0 }, tint: 0x8a8272, emitting: false }).setDepth(33),
      smoke: this.add.particles(0, 0, 'smoke', { speed: { min: 10, max: 50 }, lifespan: 1200, scale: { start: 1.5, end: 4 }, alpha: { start: 0.5, end: 0 }, tint: 0x3b4241, emitting: false, gravityY: -30 }).setDepth(49),
      fire: mk([0xff7a2a, 0xffd27a, 0xc0501c], true, { speed: { min: 40, max: 200 }, lifespan: { min: 500, max: 1000 }, gravityY: -120, scale: { start: 2, end: 0 } }),
    };
  }

  // ---------- tokens ----------
  makeTokens() { for (const u of this.s.units) this.makeToken(u); }
  makeToken(u) {
    const big = u.boss ? 1.4 : u.elite ? 1.15 : 1;
    const c = this.add.container(this.tx(u.x), this.ty(u.y)).setDepth(32 + u.y * 0.01);
    const shadow = this.add.ellipse(2, 22 * big, 40 * big, 12 * big, 0x000000, 0.55);
    const base = this.add.graphics();
    const hero = u.side === 'hero';
    const rim = hero ? (u.id === 'warden' ? C.amber : u.id === 'scholar' ? C.dread : C.bone) : u.boss ? C.amber : u.elite ? 0xb0b8b4 : 0xd0402c;
    base.fillStyle(rim, 0.14); base.fillEllipse(0, 21 * big, 52 * big, 20 * big);
    base.lineStyle(2, rim, 0.95); base.strokeEllipse(0, 21 * big, 52 * big, 20 * big);
    const key = unitKey(u.kind, big > 1);
    const scale = big > 1 ? (64 * big) / 96 : 1;
    const glyph = this.add.image(0, 27 * big, key).setOrigin(0.5, 1).setScale(scale).setFlipX(!hero);
    const flash = this.add.image(0, 27 * big, key).setOrigin(0.5, 1).setScale(scale).setFlipX(!hero)
      .setTint(0xffffff).setTintMode(Phaser.TintModes.FILL).setAlpha(0);
    c.add([shadow, base, glyph, flash]);
    this.tweens.add({ targets: [glyph, flash], scaleY: scale * 1.035, duration: 1100 + Math.random() * 500, yoyo: true, repeat: -1, ease: 'Sine.InOut', delay: Math.random() * 800 });
    const bar = this.add.container(c.x, c.y - 44 * big).setDepth(40);
    const bw = 46 * big;
    const bbg = this.add.rectangle(0, 0, bw + 4, 8, 0x050b0c, 0.9).setStrokeStyle(1, 0x000000);
    const bfill = this.add.rectangle(-bw / 2, 0, bw, 5, hero ? 0x6fbf73 : 0xc0402c).setOrigin(0, 0.5);
    const badge = this.add.text(0, 62 * big, '', { fontFamily: FONT_H, fontSize: '12px', color: HEX.amber, fontStyle: '700', stroke: '#050b0c', strokeThickness: 4 }).setOrigin(0.5);
    bar.add([bbg, bfill, badge]);
    const eyes = this.add.image(c.x, c.y - 4, 'eyes').setDepth(41).setAlpha(0);
    this.tweens.add({ targets: eyes, scaleY: 0.1, duration: 120, yoyo: true, repeat: -1, repeatDelay: 2400 + Math.random() * 2000 });
    this.tokens.set(u.id, { c, bar, bfill, bw, badge, flash, glyph, eyes, big, glyphY: 27 * big });
  }
  setTokenPos(u) {
    const t = this.tokens.get(u.id);
    t.c.setPosition(this.tx(u.x), this.ty(u.y));
    t.c.setDepth(32 + u.y * 0.01);
  }
  update() {
    for (const u of this.s.units) {
      const t = this.tokens.get(u.id); if (!t) continue;
      t.bar.setPosition(t.c.x, t.c.y - 44 * t.big);
      t.eyes.setPosition(t.c.x, t.c.y - 4);
    }
    const s = this.s;
    if (s.lantern.carrier) {
      const t = this.tokens.get(s.lantern.carrier);
      if (t) { this.lanternImg.setPosition(t.c.x + 20, t.c.y + 12); this.lanternGlow.setPosition(t.c.x, t.c.y); }
    } else if (!this.lanternFlying) {
      this.lanternImg.setPosition(this.tx(s.lantern.x), this.ty(s.lantern.y));
      this.lanternGlow.setPosition(this.tx(s.lantern.x), this.ty(s.lantern.y));
    }
    this.lanternGlow.setScale(0.6 + R.lanternRadius(s) * 0.3);
  }
  refreshBars() {
    for (const u of this.s.units) {
      const t = this.tokens.get(u.id); if (!t) continue;
      const w = Math.max(0, (u.hp / u.maxHp) * t.bw);
      this.tweens.add({ targets: t.bfill, width: w, duration: 260, ease: 'Quad.Out' });
      if (u.side === 'hero') t.bfill.setFillStyle(u.hp / u.maxHp < 0.34 ? 0xd0402c : 0x6fbf73);
      const b = [];
      if (u.marked > 0) b.push('MARKED');
      if (u.dazed > 0) b.push('DAZED');
      if (u.braced) b.push('BRACED');
      if (u.drowning) b.push('SINKING');
      if (u.inDeep) b.push(u.side === 'hero' ? 'DROWNING' : 'IN DEEP');
      if (u.burning > 0) b.push('BURNING');
      if (u.guardBuff) b.push('+2 GUARD');
      if (u.ward > 0) b.push(`WARD ${u.ward}`);
      if (u.snared) b.push('SNARED');
      if (u.resolve) b.push('RESOLUTE');
      if (u.virtue) b.push(VIRTUES[u.virtue].name.toUpperCase());
      if (u.flaw) b.push(FLAWS[u.flaw].name.toUpperCase());
      t.badge.setText(b.join(' · '));
      t.badge.setColor(u.flaw || u.inDeep ? HEX.red : u.resolve || u.virtue ? HEX.amberHot : HEX.amber);
    }
  }

  // ---------- light & visibility ----------
  refreshLight(instant = false) {
    const s = this.s;
    const grid = R.computeLight(s);
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
      const a = DARK_ALPHA[grid[y][x]];
      const r = this.darkTiles[y][x];
      if (instant) r.setAlpha(a);
      else if (Math.abs(r.alpha - a) > 0.01) this.tweens.add({ targets: r, alpha: a, duration: 320 });
    }
    for (const b of s.braziers) {
      if (b.lit && !b.flame.emitting) { b.flame.start(); this.tweens.add({ targets: [b.coals], alpha: 1, duration: 300 }); }
      if (!b.lit && b.flame.emitting) { b.flame.stop(); this.tweens.add({ targets: [b.coals, b.glow], alpha: 0, duration: 400 }); }
    }
    if (s.fireAt) this.fireGlow.setPosition(this.tx(s.fireAt.x), this.ty(s.fireAt.y)).setAlpha(0.5);
    else this.fireGlow.setAlpha(0);
  }
  refreshVisibility(instant = false) {
    for (const u of this.s.units) {
      if (u.side !== 'enemy' || u.dead) continue;
      const t = this.tokens.get(u.id);
      const vis = R.visibleToHeroes(this.s, u);
      const dur = instant ? 0 : 300;
      this.tweens.add({ targets: [t.c, t.bar], alpha: vis ? 1 : 0, duration: dur });
      this.tweens.add({ targets: t.eyes, alpha: vis ? 0 : 0.95, duration: dur });
      if (vis && !this.seen.has(u.id)) {
        this.seen.add(u.id);
        if (!instant && (u.kind === 'husk' || u.boss)) { this.say(u.boss ? 'boss' : 'husk', {}, HEX.red, true); sfx.scream(); }
      }
    }
  }
  refreshAll() {
    this.refreshLight();
    this.refreshVisibility();
    this.refreshBars();
    this.refreshHud();
    this.drawIntents();
  }

  // ---------- intents ----------
  drawIntents() {
    this.intentG.clear();
    this.intentLayer.removeAll(true);
    if (this.s.phase !== 'party' || this.over) return;
    for (const e of R.alive(this.s, 'enemy')) {
      if (!R.visibleToHeroes(this.s, e)) continue;
      let plan;
      try { plan = R.planEnemy(this.s, e); } catch { continue; }
      const t = this.tokens.get(e.id);
      const danger = DANGER.includes(plan.type);
      const ex = this.tx(e.x), ey = this.ty(e.y);
      if (plan.target && danger) this.dashed(ex, ey, this.tx(plan.target.x), this.ty(plan.target.y), 0xd0402c, 0.6);
      if ((plan.type === 'snuff' || plan.type === 'snuffFar') && plan.brazier) this.dashed(ex, ey, this.tx(plan.brazier.x), this.ty(plan.brazier.y), C.amber, 0.6);
      if ((plan.type === 'heal' || plan.type === 'ward') && plan.ally) this.dashed(ex, ey, this.tx(plan.ally.x), this.ty(plan.ally.y), 0x8fdf93, 0.6);
      if (plan.type === 'lamp' && plan.area) {
        // the exact 3x3 the fire will land on: step out of it
        const { x: ax, y: ay } = plan.area;
        this.dashed(ex, ey, this.tx(ax), this.ty(ay), 0xff8a3a, 0.7);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const tx = ax + dx, ty = ay + dy;
          if (tx < 0 || ty < 0 || tx >= this.s.w || ty >= this.s.h) continue;
          this.intentG.fillStyle(0xff6a2a, 0.18); this.intentG.fillRect(this.tx(tx) - T / 2 + 2, this.ty(ty) - T / 2 + 2, T - 4, T - 4);
          this.intentG.lineStyle(2, 0xff8a3a, 0.75); this.intentG.strokeRect(this.tx(tx) - T / 2 + 2, this.ty(ty) - T / 2 + 2, T - 4, T - 4);
        }
      }
      if (plan.type === 'charge' && plan.path?.length) {
        for (const st of plan.path) { this.intentG.fillStyle(0xd0402c, 0.16); this.intentG.fillRect(this.tx(st.x) - T / 2 + 4, this.ty(st.y) - T / 2 + 4, T - 8, T - 8); }
      }
      if (plan.type === 'dirge') for (const h of plan.targets) this.dashed(ex, ey, this.tx(h.x), this.ty(h.y), 0xc8a0ff, 0.5);
      const bx = ex + 22 * t.big, by = ey - 26 * t.big;
      const bg = this.add.circle(bx, by, 13, danger ? 0x5a1010 : 0x1b2a2a, 1).setStrokeStyle(2, danger ? (e.heavy ? 0xffd27a : 0xd0402c) : C.amber);
      const ic = this.add.image(bx, by, INTENT_TEX[plan.type] ?? 'in_move').setScale(0.55);
      this.intentLayer.add([bg, ic]);
    }
  }
  dashed(x1, y1, x2, y2, col, a) {
    const d = Math.hypot(x2 - x1, y2 - y1); const n = Math.floor(d / 12);
    this.intentG.lineStyle(2, col, a);
    for (let i = 0; i < n; i += 2) {
      const t1 = i / n, t2 = Math.min(1, (i + 1) / n);
      this.intentG.lineBetween(x1 + (x2 - x1) * t1, y1 + (y2 - y1) * t1, x1 + (x2 - x1) * t2, y1 + (y2 - y1) * t2);
    }
    this.intentG.fillStyle(col, a); this.intentG.fillCircle(x2, y2, 4);
  }

  // ---------- HUD ----------
  makeHud() {
    panel(this, PX, 72, PW, 640, { r: 14 });
    this.add.text(PX + 18, 84, 'THE COMPANY', { fontFamily: FONT_H, fontSize: '13px', color: HEX.amber, fontStyle: '700', letterSpacing: 3 });
    this.muteBtn = makeButton(this, PX + PW - 30, 92, 40, 26, '', () => this.toggleMute(), { size: 13 });
    this.muteIcon = this.add.image(0, 0, musicPlayer.muted ? 'ic_mute' : 'ic_sound').setScale(0.5);
    this.muteBtn.add(this.muteIcon);
    this.helpBtn = makeButton(this, PX + PW - 76, 92, 40, 26, '?', () => this.showControls(), { size: 14 });
    this.cards = [];
    const heroes = R.heroUnits(this.s);
    heroes.forEach((u, i) => this.cards.push(this.makeHeroCard(u, PX + 12, 106 + i * 94)));
    let y = 106 + heroes.length * 94 + 4;
    this.add.text(PX + 18, y + 6, 'FATE', { fontFamily: FONT_H, fontSize: '13px', color: HEX.amber, fontStyle: '700', letterSpacing: 2 });
    this.fateIcons = this.add.container(PX + 80, y + 16);
    this.pushBtn = makeButton(this, PX + PW - 92, y + 16, 160, 34, 'PUSH +1d6', () => this.togglePush(), {
      size: 13, onHover: (o) => this.hint(o ? 'Arm a PUSH: your next hero roll gets +1d6, and that hero gains 10 Dread.' : ''),
    });
    y += 44;
    this.add.text(PX + 18, y + 6, 'SATCHEL', { fontFamily: FONT_H, fontSize: '13px', color: HEX.amber, fontStyle: '700', letterSpacing: 2 });
    this.satchel = this.add.container(PX + 116, y + 16);
    this.silverText = this.add.text(PX + PW - 18, y + 6, '', { fontFamily: FONT_H, fontSize: '15px', color: '#c9d4d2', fontStyle: '700' }).setOrigin(1, 0);
    y += 40;
    panel(this, PX + 12, y, PW - 24, 86, { fill: 0x081012, r: 10 });
    this.inspectTitle = this.add.text(PX + 26, y + 8, 'Point at anything to study it.', { fontFamily: FONT_H, fontSize: '14px', color: HEX.bone, fontStyle: '700', wordWrap: { width: PW - 56 } });
    this.inspectBody = this.add.text(PX + 26, y + 28, '', { fontFamily: FONT_B, fontSize: '13px', color: HEX.boneDim, wordWrap: { width: PW - 56 }, lineSpacing: 1 });
    y += 96;
    this.add.text(PX + 18, y, 'THE CHRONICLE', { fontFamily: FONT_H, fontSize: '13px', color: HEX.amber, fontStyle: '700', letterSpacing: 3 });
    this.logY = y + 22;
    this.logTexts = [];
    this.actionBar = this.add.container(0, 0).setDepth(90);
    this.endBtn = makeButton(this, BX + BW - 72, BY + BH + 46, 144, 52, 'END PHASE', () => this.endPartyPhase(), {
      size: 15, fill: 0x2a1c0c, stroke: C.amber, sub: 'press E', onHover: (o) => this.hint(o ? 'Let the enemies act. Unused moves and actions are lost.' : ''),
    }).setDepth(90);
  }
  toggleMute() { const m = musicPlayer.toggleMute(); this.muteIcon.setTexture(m ? 'ic_mute' : 'ic_sound'); }

  makeHeroCard(u, x, y) {
    const c = this.add.container(x, y);
    const bg = this.add.graphics();
    const port = this.add.graphics();
    port.fillStyle(0x16211f, 1); port.fillCircle(30, 40, 24);
    port.lineStyle(2, u.id === 'warden' ? C.amber : u.id === 'scholar' ? C.dread : C.bone, 1); port.strokeCircle(30, 40, 24);
    const gl = this.add.image(30, 64, unitKey(u.kind)).setOrigin(0.5, 1).setScale(0.82);
    const name = this.add.text(64, 6, `${HEROES[u.id].name}`, { fontFamily: FONT_H, fontSize: '15px', color: HEX.bone, fontStyle: '700' });
    const cls = this.add.text(64 + name.width + 8, 9, HEROES[u.id].cls, { fontFamily: FONT_B, fontSize: '12px', color: HEX.boneDim, fontStyle: 'italic' });
    const hpBg = this.add.rectangle(64, 34, 190, 9, 0x050b0c).setOrigin(0, 0.5).setStrokeStyle(1, 0x2a3a3a);
    const hp = this.add.rectangle(65, 34, 188, 7, 0x6fbf73).setOrigin(0, 0.5);
    const hpT = this.add.text(262, 27, '', { fontFamily: FONT_B, fontSize: '12px', color: HEX.bone });
    const drBg = this.add.rectangle(64, 49, 190, 9, 0x050b0c).setOrigin(0, 0.5).setStrokeStyle(1, 0x2a3a3a);
    const dr = this.add.rectangle(65, 49, 188, 7, C.dread).setOrigin(0, 0.5);
    const drT = this.add.text(262, 42, '', { fontFamily: FONT_B, fontSize: '12px', color: HEX.dread });
    const chips = this.add.text(64, 58, '', { fontFamily: FONT_H, fontSize: '11px', color: HEX.boneDim, fontStyle: '700', letterSpacing: 1 });
    const gear = this.add.text(64, 72, '', { fontFamily: FONT_B, fontSize: '12px', color: HEX.boneDim, fontStyle: 'italic' });
    const tag = this.add.text(PW - 36, 6, '', { fontFamily: FONT_H, fontSize: '11px', color: HEX.ink, fontStyle: '700', backgroundColor: HEX.red, padding: { x: 4, y: 2 } }).setOrigin(1, 0);
    const zone = this.add.zone(0, 0, PW - 24, 88).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => { if (!u.dead) this.trySelect(u); });
    zone.on('pointerover', () => this.inspectUnit(u));
    c.add([bg, port, gl, name, cls, hpBg, hp, hpT, drBg, dr, drT, chips, gear, tag, zone]);
    return { u, c, bg, hp, hpT, dr, drT, chips, gear, tag, name };
  }

  refreshHud() {
    const s = this.s;
    this.phaseText.setText(`ROUND ${s.round} · ${s.phase === 'party' ? 'PARTY PHASE' : 'ENEMY PHASE'}`);
    this.phaseText.setColor(s.phase === 'party' ? HEX.amber : HEX.red);
    this.endBtn.setVisible(s.phase === 'party' && !this.over);
    for (const card of this.cards) {
      const u = card.u;
      card.bg.clear();
      const selected = this.sel === u;
      card.bg.fillStyle(selected ? 0x1d2a1f : 0x0d1719, 1); card.bg.fillRoundedRect(0, 0, PW - 24, 88, 10);
      card.bg.lineStyle(2, selected ? C.amber : 0x1e2e2e, 1); card.bg.strokeRoundedRect(0, 0, PW - 24, 88, 10);
      this.tweens.add({ targets: card.hp, width: Math.max(0, 188 * u.hp / u.maxHp), duration: 250 });
      card.hp.setFillStyle(u.hp / u.maxHp < 0.34 ? 0xd0402c : 0x6fbf73);
      card.hpT.setText(`HP ${u.hp}/${u.maxHp}`);
      this.tweens.add({ targets: card.dr, width: Math.max(0, 188 * Math.min(100, u.dread) / 100), duration: 250 });
      card.dr.setFillStyle(u.dread >= 75 ? 0xb7e6dc : C.dread);
      card.drT.setText(`DREAD ${Math.round(u.dread)}`);
      const chip = (on, label) => `${on ? '■' : '□'} ${label}`;
      card.chips.setText(u.dead ? 'FALLEN' : `${chip(!u.moved, 'MOVE')}  ${chip(!u.acted, 'ACT')}  ${chip(u.reaction, 'REACT')}  · GUARD ${R.guardOf(u)}`);
      const h = this.run.heroes.find((x) => x.id === u.id);
      const w = h?.weapon ? itemById(h.weapon).name : 'no weapon', ch = h?.charm ? itemById(h.charm).name : 'no charm';
      card.gear.setText(`${w} · ${ch}${h?.talents?.length ? ` · ${h.talents.length} talent${h.talents.length > 1 ? 's' : ''}` : ''}`);
      card.tag.setText(u.dead ? 'FALLEN' : u.flaw ? FLAWS[u.flaw].name.toUpperCase() : u.resolve ? 'RESOLUTE' : u.virtue ? VIRTUES[u.virtue].name.toUpperCase() : '');
      card.tag.setBackgroundColor((u.resolve || u.virtue) && !u.flaw ? HEX.amber : HEX.red);
      card.tag.setVisible(!!card.tag.text);
      card.c.setAlpha(u.dead ? 0.45 : 1);
    }
    this.fateIcons.removeAll(true);
    for (let i = 0; i < Math.max(this.run.fate, 0); i++) this.fateIcons.add(this.add.image(i * 30, 0, 'fate').setScale(0.9));
    if (this.run.fate === 0) this.fateIcons.add(this.add.text(0, -8, 'none left', { fontFamily: FONT_B, fontSize: '13px', color: HEX.boneDim, fontStyle: 'italic' }));
    this.pushBtn.setOn(this.s.push);
    this.satchel.removeAll(true);
    this.run.consumables.forEach((id, i) => {
      const it = itemById(id);
      const im = this.add.image(i * 40, 0, `it_${it.icon}`).setScale(0.62).setTint(RARITY[it.rarity].color).setInteractive({ useHandCursor: true });
      im.on('pointerover', () => { this.inspect(it.name, `${it.text}\nUses the selected hero's action. Click to use.`); im.setScale(0.72); });
      im.on('pointerout', () => im.setScale(0.62));
      im.on('pointerdown', () => this.beginItem(i));
      this.satchel.add(im);
    });
    if (!this.run.consumables.length) this.satchel.add(this.add.text(0, -8, 'empty', { fontFamily: FONT_B, fontSize: '13px', color: HEX.boneDim, fontStyle: 'italic' }));
    this.silverText.setText(`${this.run.silver} silver`);
    musicPlayer.tension(Math.max(...R.heroUnits(s).map((u) => u.dread)) / 100);
  }
  drawLog() {
    if (!this.logTexts) return;
    this.logTexts.forEach((t) => t.destroy());
    this.logTexts = [];
    let y = this.logY;
    this.logLines.forEach((l, i) => {
      if (y > 700) return;
      const t = this.add.text(PX + 22, y, l.text, { fontFamily: FONT_B, fontSize: '14px', color: l.color, fontStyle: 'italic', wordWrap: { width: PW - 44 } }).setAlpha(Math.max(0.3, 1 - i * 0.15));
      if (i === 0) { t.setAlpha(0); this.tweens.add({ targets: t, alpha: 1, duration: 400 }); }
      y += t.height + 4;
      this.logTexts.push(t);
    });
  }
  hint(text) { this.hintText.setText(text); }
  inspect(title, body) { this.inspectTitle.setText(title); this.inspectBody.setText(body); }
  inspectUnit(u) {
    if (u.side === 'enemy' && !R.visibleToHeroes(this.s, u)) { this.inspect('Something in the dark', 'You can hear it breathing water. Light it, Mark it, or get next to it to see it.'); return; }
    if (u.side === 'hero') {
      const def = HEROES[u.id];
      const h = this.run.heroes.find((x) => x.id === u.id);
      const tal = (h?.talents ?? []).map((id) => talentById(id)?.name).join(', ');
      this.inspect(`${def.name} the ${def.cls}`, `HP ${u.hp}/${u.maxHp} · Guard ${R.guardOf(u)} · Attack +${u.atk} · Move ${u.move} · STR ${def.stats.STR} DEX ${def.stats.DEX} WIS ${def.stats.WIS} CHA ${def.stats.CHA}${u.flaw ? `\n${FLAWS[u.flaw].name}: ${FLAWS[u.flaw].text}` : ''}${u.virtue ? `\n${VIRTUES[u.virtue].name}: ${VIRTUES[u.virtue].text}` : ''}${tal ? `\nTalents: ${tal}` : ''}`);
      return;
    }
    const def = ENEMIES[u.kind];
    const next = this.s.phase === 'party' ? `\n${R.intentText(this.s, u)}` : '';
    this.inspect(`${u.name}${u.elite ? ' (Elite)' : ''}${u.boss ? ' (Boss)' : ''} · HP ${u.hp}/${u.maxHp} · Guard ${R.guardOf(u)}`, `${def.lore}${next}`);
  }
  inspectTile(x, y) {
    const ch = R.tileAt(this.s, x, y);
    const L = R.lightAt(this.s, x, y);
    const light = ['Darkness', 'Dim light', 'Bright light'][L];
    const desc = {
      '.': ['Flagstones', 'Solid footing.'],
      ',': ['Shallow water', 'Costs 2 movement to wade.'],
      '~': ['Deep water', 'Lesser foes shoved here drown. Elites take 2d6 and lose a turn. Heroes dragged in flounder and take 1d6 each round.'],
      '^': ['Raised dais', 'Costs 2 to climb. Ranged attacks from the dais have Advantage.'],
      '#': ['Pillar', 'Blocks movement and line of sight. Shove foes into it for a SLAM.'],
      'B': ['Brazier', R.brazierAt(this.s, x, y)?.lit ? 'Lit. Lights 3 tiles around it.' : 'Cold. Stand next to it and Kindle it.'],
      'C': ['Reliquary', R.chestAt(this.s, x, y)?.open ? 'Already opened.' : 'Sealed. Stand next to it and open it for treasure.'],
    }[ch] ?? ['', ''];
    const lightRule = L === 0 ? 'Darkness: foes here are unseen and attacks on them have Disadvantage. Heroes ending the round here gain 8 Dread.'
      : L === 1 ? 'Dim light: foes are visible, no penalty.' : 'Bright light: safe from the dark.';
    this.inspect(`${desc[0]} · ${light}`, `${desc[1]}\n${lightRule}`);
  }
  showControls() {
    if (this.controlsPanel) { this.controlsPanel.destroy(); this.controlsPanel = null; return; }
    const c = this.add.container(BX + BW / 2, BY + BH / 2).setDepth(260);
    const bg = this.add.rectangle(0, 0, 560, 330, 0x0b1517, 0.98).setStrokeStyle(2, C.amber).setInteractive();
    const t = this.add.text(0, -140, 'CONTROLS', { fontFamily: FONT_H, fontSize: '20px', color: HEX.amber, fontStyle: '900' }).setOrigin(0.5);
    const body = this.add.text(-250, -110, [
      'Click a hero (or press 1 / 2 / 3) to select them.',
      'Click a lit tile to move. Pick an action, then click a target.',
      'Right-click or Esc: cancel.   E: end the party phase.',
      'SPACE or click when the rings meet: parry / dodge.',
      'F: burn Fate when asked.   Enter: accept / continue.',
      'Hover anything for details. The hint line shows hit chances.',
      'M: mute.   ?: this panel.',
    ].join('\n'), { fontFamily: FONT_B, fontSize: '16px', color: HEX.bone, lineSpacing: 10 });
    const close = makeButton(this, 0, 130, 140, 40, 'Close', () => { c.destroy(); this.controlsPanel = null; }, { size: 14 });
    c.add([bg, t, body, close]);
    this.controlsPanel = c;
  }

  // ---------- action bar ----------
  buildActionBar() {
    this.actionBar.removeAll(true);
    this.actionButtons = [];
    const u = this.sel;
    if (!u || u.dead || this.s.phase !== 'party') return;
    const acts = ['move', ...R.heroActions(this.s, u)];
    acts.slice(0, 7).forEach((id, i) => {
      const sk = id === 'move' ? { name: 'Move', desc: `Walk up to ${u.move} tiles. Shallow water and climbing cost 2.` } : SKILLS[id];
      const x = BX + 46 + i * 90, y = BY + BH + 46;
      const enabled = id === 'move' ? !u.moved : !u.acted && (id === 'item' || R.skillTargets(this.s, u, id).length > 0);
      const b = makeButton(this, x, y, 86, 56, '', () => this.chooseAction(id), {
        onHover: (o) => this.hint(o ? `${sk.name}: ${sk.desc}` : ''),
      });
      const icon = this.add.image(0, -9, `ic_${id === 'move' ? 'move' : sk.icon}`).setScale(0.75);
      const lbl = this.add.text(0, 17, sk.name.toUpperCase(), { fontFamily: FONT_H, fontSize: '11px', color: HEX.bone, fontStyle: '700', align: 'center' }).setOrigin(0.5);
      if (lbl.width > 80) lbl.setScale(80 / lbl.width);
      b.add([icon, lbl]);
      b.setEnabled(enabled && (!this.tut || this.tut.isFree() || id === 'move' ? true : this.tut.allowSkill(id)));
      if (this.ui === 'move' && id === 'move') b.setOn(true);
      if (this.ui === 'target' && this.skill === id) b.setOn(true);
      b.actionId = id;
      this.actionBar.add(b);
      this.actionButtons.push(b);
    });
  }
  buttonFor(id) {
    if (id === 'end') return this.endBtn;
    return this.actionButtons.find((b) => b.actionId === id);
  }

  // ---------- input ----------
  bindInput() {
    this.input.on('pointermove', (p) => this.onHover(p));
    this.input.on('pointerdown', (p) => {
      if (p.rightButtonDown()) { this.cancel(); return; }
      const x = Math.floor((p.x - BX) / T), y = Math.floor((p.y - BY) / T);
      if (p.x < BX || p.y < BY || x < 0 || y < 0 || x >= this.s.w || y >= this.s.h) return;
      this.onTile(x, y);
    });
    this.input.mouse?.disableContextMenu();
    const kb = this.input.keyboard;
    kb.on('keydown-ESC', () => this.cancel());
    kb.on('keydown-E', () => this.endPartyPhase());
    kb.on('keydown-ONE', () => this.selectIndex(0));
    kb.on('keydown-TWO', () => this.selectIndex(1));
    kb.on('keydown-THREE', () => this.selectIndex(2));
    kb.on('keydown-M', () => this.toggleMute());
    kb.on('keydown-FORWARD_SLASH', () => this.showControls());
  }
  selectIndex(i) { const u = R.heroUnits(this.s)[i]; if (u && !u.dead) this.trySelect(u); }
  canInteract() { return !this.busy && !this.modal && !this.over && this.s.phase === 'party'; }

  trySelect(u) {
    if (!this.canInteract()) return;
    if (this.tut && !this.tut.allowSelect(u.id)) { sfx.denied(); return; }
    this.sel = u;
    sfx.select();
    this.ui = !u.moved ? 'move' : 'idle';
    this.skill = null;
    this.tween({ targets: this.tokens.get(u.id).c, scale: 1.12, duration: 90, yoyo: true });
    this.refreshHud();
    this.buildActionBar();
    this.drawHighlights();
    this.tut?.event(`select:${u.id}`);
    if (u.id === 'ringer' && !this.tut && !this.meta.ringerTaught) {
      this.meta.ringerTaught = true; saveMeta(this.meta);
      this.caption('Old Hesk: TOLL pushes nearby foes back and may DAZE them. CHIME heals and calms heroes within 3.', HEX.amberHot);
    }
  }
  cancel() {
    if (!this.canInteract()) return;
    this.pendingItem = null;
    if (this.ui === 'target') { this.ui = this.sel && !this.sel.moved ? 'move' : 'idle'; this.skill = null; }
    else this.ui = 'idle';
    this.buildActionBar();
    this.drawHighlights();
  }
  chooseAction(id) {
    if (!this.canInteract() || !this.sel) return;
    const u = this.sel;
    if (id === 'move') { if (u.moved) return; this.ui = 'move'; this.skill = null; }
    else if (id === 'item') { this.flashSatchel(); return; }
    else {
      if (u.acted) return;
      if (this.tut && !this.tut.allowSkill(id)) { sfx.denied(); return; }
      const sk = SKILLS[id];
      if (['self', 'toll', 'chime'].includes(sk.kind)) { this.doSkill(u, id, { x: u.x, y: u.y }); return; }
      this.ui = 'target'; this.skill = id;
      this.hint(`${sk.name}: choose a target. Right-click or Esc to cancel.`);
    }
    this.buildActionBar();
    this.drawHighlights();
  }
  flashSatchel() {
    this.hint('Click an item in the SATCHEL (right panel) to use it.');
    this.tweens.add({ targets: this.satchel, scale: 1.25, duration: 160, yoyo: true, repeat: 1 });
  }
  beginItem(index) {
    if (!this.canInteract()) return;
    const u = this.sel;
    if (!u || u.dead) { this.hint('Select a hero first: they will use the item.'); sfx.denied(); return; }
    if (u.acted) { this.hint(`${this.hname(u)} has already acted this phase.`); sfx.denied(); return; }
    if (this.tut && !this.tut.isFree()) { sfx.denied(); return; }
    const it = itemById(this.run.consumables[index]);
    this.pendingItem = { index, it };
    if (it.use === 'flare') { this.useItem(u, null); return; }
    this.ui = 'target'; this.skill = '__item';
    this.hint(it.use === 'oil' ? 'Oil Flask: choose where to throw it (range 4).' : `${it.name}: choose ${this.hname(u)} or a hero next to them.`);
    this.drawHighlights();
  }
  itemTargets(u) {
    const it = this.pendingItem.it;
    if (it.use === 'oil') return R.throwTiles(this.s, u, 4);
    return R.alive(this.s, 'hero').filter((h) => R.cheb(h, u) <= 1).map((h) => ({ x: h.x, y: h.y, unit: h }));
  }
  currentTargets() {
    const u = this.sel;
    if (!u) return [];
    if (this.skill === '__item') return this.itemTargets(u);
    return R.skillTargets(this.s, u, this.skill);
  }
  onTile(x, y) {
    if (!this.canInteract()) return;
    const s = this.s;
    const unit = R.unitAt(s, x, y);
    if (this.ui === 'target' && this.sel) {
      const tg = this.currentTargets().find((t) => t.x === x && t.y === y);
      if (tg) {
        if (this.skill === '__item') this.useItem(this.sel, tg);
        else this.doSkill(this.sel, this.skill, tg);
        return;
      }
      if (unit?.side === 'hero') { this.trySelect(unit); return; }
      sfx.denied();
      return;
    }
    if (this.ui === 'move' && this.sel && !this.sel.moved) {
      const reach = R.reachable(s, this.sel);
      const k = R.key(s, x, y);
      if (!(unit && unit === this.sel) && reach.dist.has(k) && R.canStop(s, this.sel, x, y)) {
        if (this.tut && !this.tut.allowTile(x, y)) { sfx.denied(); return; }
        this.moveHero(this.sel, R.pathFrom(s, reach, x, y));
        return;
      }
    }
    if (unit?.side === 'hero') { this.trySelect(unit); return; }
    if (unit?.side === 'enemy' && this.sel && !this.sel.acted) {
      const def = this.sel.skills[0];
      if (R.skillTargets(s, this.sel, def).some((t) => t.x === x && t.y === y) && (!this.tut || this.tut.allowSkill(def))) {
        this.doSkill(this.sel, def, { x, y, unit });
      }
    }
  }
  onHover(p) {
    this.hoverG.clear();
    const x = Math.floor((p.x - BX) / T), y = Math.floor((p.y - BY) / T);
    if (p.x < BX || p.y < BY || x < 0 || y < 0 || x >= this.s.w || y >= this.s.h) return;
    const s = this.s;
    const unit = R.unitAt(s, x, y);
    if (unit) this.inspectUnit(unit); else this.inspectTile(x, y);
    this.hoverG.lineStyle(2, 0xffffff, 0.25);
    this.hoverG.strokeRect(BX + x * T + 2, BY + y * T + 2, T - 4, T - 4);
    if (!this.canInteract() || !this.sel) return;
    const u = this.sel;
    if (this.ui === 'move' && !u.moved) {
      const reach = R.reachable(s, u);
      const k = R.key(s, x, y);
      if (reach.dist.has(k) && R.canStop(s, u, x, y)) {
        const path = R.pathFrom(s, reach, x, y);
        let px = this.tx(u.x), py = this.ty(u.y);
        this.hoverG.lineStyle(3, C.amber, 0.8);
        for (const st of path) { const nx = this.tx(st.x), ny = this.ty(st.y); this.hoverG.lineBetween(px, py, nx, ny); px = nx; py = ny; }
        this.hoverG.fillStyle(C.amber, 1); this.hoverG.fillCircle(px, py, 6);
        const L = R.lightAt(s, x, y);
        this.hint(`Move here (${reach.dist.get(k)} of ${u.move} movement)${L === 0 ? ' · Darkness: +8 Dread at the end of the round' : ''}`);
      }
    }
    if (this.ui === 'target' && this.skill && this.skill !== '__item') {
      const sk = SKILLS[this.skill];
      if (sk.kind === 'throw') { this.hoverG.lineStyle(2, C.amberHot, 0.5); this.hoverG.strokeCircle(this.tx(x), this.ty(y), (R.lanternRadius(s) + 0.4) * T); }
      if (unit?.side === 'enemy' && (sk.kind === 'attack' || sk.kind === 'shove')) {
        const am = R.attackMode(s, u, unit, sk.ranged);
        const pct = Math.round(R.hitChance(R.attackBonus(s, u, unit), R.guardOf(unit), am.mode, u.critOn) * 100);
        const why = [...am.adv.map((a) => `+${a}`), ...am.dis.map((d) => `−${d}`)].join(', ');
        this.hint(`${sk.name}: ${pct}% to hit${am.mode > 0 ? ' (Advantage)' : am.mode < 0 ? ' (Disadvantage)' : ''}${why ? ` · ${why}` : ''}`);
      }
    }
    if (this.ui === 'target' && this.skill === '__item' && this.pendingItem?.it.use === 'oil') {
      this.hoverG.lineStyle(2, 0xff7a2a, 0.7);
      this.hoverG.strokeRect(BX + (x - 1) * T, BY + (y - 1) * T, T * 3, T * 3);
    }
  }
  drawHighlights() {
    const g = this.highlight;
    g.clear();
    this.tweens.killTweensOf(g);
    g.setAlpha(1);
    const s = this.s;
    const u = this.sel;
    if (u && !u.dead) {
      const t = this.tokens.get(u.id);
      g.lineStyle(3, C.amber, 0.95);
      g.strokeCircle(t.c.x, t.c.y, 30);
    }
    if (!u || !this.canInteract()) { this.drawIntents(); return; }
    if (this.ui === 'move' && !u.moved) {
      const reach = R.reachable(s, u);
      for (const [k] of reach.dist) {
        const x = k % s.w, y = Math.floor(k / s.w);
        if (!R.canStop(s, u, x, y) || (x === u.x && y === u.y)) continue;
        if (this.tut && !this.tut.allowTile(x, y)) continue;
        g.fillStyle(C.amber, 0.16); g.fillRect(BX + x * T + 3, BY + y * T + 3, T - 6, T - 6);
        g.lineStyle(1, C.amber, 0.5); g.strokeRect(BX + x * T + 3, BY + y * T + 3, T - 6, T - 6);
      }
    }
    if (this.ui === 'target') {
      const sk = this.skill === '__item' ? null : SKILLS[this.skill];
      const hostile = sk && ['attack', 'shove', 'mark'].includes(sk.kind);
      const col = hostile ? 0xd0402c : C.amberHot;
      for (const tg of this.currentTargets()) {
        g.fillStyle(col, hostile ? 0.16 : 0.1); g.fillRect(BX + tg.x * T + 3, BY + tg.y * T + 3, T - 6, T - 6);
        g.lineStyle(2, col, 0.85); g.strokeRect(BX + tg.x * T + 3, BY + tg.y * T + 3, T - 6, T - 6);
      }
      this.tweens.add({ targets: g, alpha: 0.6, duration: 500, yoyo: true, repeat: -1 });
    }
    this.drawIntents();
  }

  // ---------- party phase ----------
  async startRound() {
    if (this.over) return;
    const s = this.s;
    s.phase = 'party';
    for (const u of R.heroUnits(s)) {
      if (u.dead) continue;
      u.moved = false; u.acted = false; u.reaction = true; u.braced = false;
      if (u.mods.regen && u.hp < u.maxHp) { u.hp = Math.min(u.maxHp, u.hp + u.mods.regen); floatText(this, this.tx(u.x), this.ty(u.y) - 20, `+${u.mods.regen}`, '#8fdf93', { size: 18 }); }
    }
    for (const e of R.alive(s, 'enemy')) if (e.guardBuff) e.guardBuff = 0;
    R.lockAims(s);
    await this.tickBurning('hero');
    sfx.phase();
    await this.banner(`Round ${s.round}`, 'Party Phase');
    this.tut?.resumeAfterTrigger();
    let first = R.alive(s, 'hero')[0];
    if (this.tut && !this.tut.isFree()) {
      const only = this.tut.step?.allow?.select;
      first = only?.length === 1 && !String(this.tut.step.wait).startsWith('select') ? R.unitById(s, only[0]) : null;
    }
    this.sel = null;
    this.ui = 'idle';
    this.refreshAll();
    if (first) this.trySelect(first);
    else { this.buildActionBar(); this.drawHighlights(); }
    if (s.round === 1 && !this.tut) this.hint('Move and act with each hero, in any order. Icons show each foe\'s next move.');
  }
  afterHeroAction(u) {
    this.refreshAll();
    if (this.over) return;
    const heroes = R.alive(this.s, 'hero');
    if (u.moved && u.acted) {
      const next = heroes.find((h) => !(h.moved && h.acted) && (!this.tut || this.tut.allowSelect(h.id) || this.tut.isFree()));
      if (next) { this.trySelect(next); return; }
    }
    if (heroes.every((h) => h.moved && h.acted)) {
      this.hint('Every hero has acted. Press END PHASE (E).');
      this.tweens.add({ targets: this.endBtn, scale: 1.08, duration: 260, yoyo: true, repeat: 2 });
    }
    this.ui = u.acted ? (u.moved ? 'idle' : 'move') : 'idle';
    this.skill = null;
    this.buildActionBar();
    this.drawHighlights();
  }
  async endPartyPhase() {
    if (!this.canInteract()) return;
    if (this.tut && !this.tut.allowEnd()) { sfx.denied(); return; }
    this.sel = null; this.ui = 'idle';
    this.highlight.clear(); this.hoverG.clear();
    this.actionBar.removeAll(true);
    this.tut?.event('endPhase');
    await this.enemyPhase();
  }

  // ---------- hero actions ----------
  async moveHero(u, path) {
    this.busy = true;
    this.highlight.clear(); this.hoverG.clear(); this.intentG.clear(); this.intentLayer.removeAll(true);
    await this.walk(u, path);
    u.moved = true;
    this.busy = false;
    this.tut?.event(`move:${u.id}`);
    this.afterHeroAction(u);
  }
  async walk(u, path) {
    const t = this.tokens.get(u.id);
    for (const st of path) {
      const ch = R.tileAt(this.s, st.x, st.y);
      u.x = st.x; u.y = st.y;
      if (u.side === 'hero') {
        if (ch !== '~') u.inDeep = false;
        if (!this.s.lantern.carrier && this.s.lantern.x === st.x && this.s.lantern.y === st.y) {
          this.s.lantern.carrier = u.id; sfx.coin(); floatText(this, this.tx(st.x), this.ty(st.y) - 20, 'Lantern taken', HEX.amberHot, { size: 15 });
        }
      } else if (ch !== '~') u.inDeep = false;
      const slow = ch === ',' || ch === '~';
      (slow ? sfx.wade : sfx.step)();
      t.c.setDepth(32 + st.y * 0.01);
      FX.face(t, t.c.x, this.tx(st.x));
      const dur = slow ? 210 : 150;
      FX.hop(this, t, this.tx(st.x), this.ty(st.y), slow, dur);
      await this.tween({ targets: t.c, x: this.tx(st.x), y: this.ty(st.y), duration: dur, ease: 'Sine.InOut' });
      this.refreshLight();
      this.refreshVisibility();
    }
  }
  async doSkill(u, id, tg) {
    if (u.acted) return;
    const sk = SKILLS[id];
    this.busy = true;
    u.acted = true;
    this.highlight.clear(); this.hoverG.clear(); this.intentG.clear(); this.intentLayer.removeAll(true);
    this.tweens.killTweensOf(this.highlight); this.highlight.setAlpha(1);
    this.hint('');
    const target = tg.unit ?? R.unitAt(this.s, tg.x, tg.y);
    try {
      switch (sk.kind) {
        case 'attack': await this.heroAttack(u, target, sk); break;
        case 'shove': await this.heroShove(u, target, sk); break;
        case 'self': await this.brace(u); break;
        case 'mark': await this.markFoe(u, target); break;
        case 'throw': await this.throwLantern(u, tg); break;
        case 'kindle': await this.kindle(u, R.brazierAt(this.s, tg.x, tg.y)); break;
        case 'open': await this.openChest(u, R.chestAt(this.s, tg.x, tg.y)); break;
        case 'toll': await this.toll(u, sk); break;
        case 'chime': await this.chime(u, sk); break;
        default: break;
      }
    } catch (err) { console.error(err); }
    await this.checkDread();
    this.busy = false;
    if (await this.checkEnd()) return;
    this.tut?.event(`act:${u.id}`);
    this.afterHeroAction(u);
  }

  // Wind-up before the roll; the strike itself lands with the damage.
  async windUp(a, b) {
    const t = this.tokens.get(a.id);
    const ang = Math.atan2(this.ty(b.y) - this.ty(a.y), this.tx(b.x) - this.tx(a.x));
    const hx = this.tx(a.x), hy = this.ty(a.y);
    FX.face(t, hx, this.tx(b.x));
    await this.tween({ targets: t.c, x: hx - Math.cos(ang) * 10, y: hy - Math.sin(ang) * 10, scaleX: 0.9, scaleY: 1.1, duration: 180, ease: 'Quad.Out' });
  }
  async strike(a, b, dist = 18, { crit = false } = {}) {
    const t = this.tokens.get(a.id);
    const hx = this.tx(a.x), hy = this.ty(a.y);
    const bx = this.tx(b.x), by = this.ty(b.y);
    const ang = Math.atan2(by - hy, bx - hx);
    FX.afterimage(this, t, FX.swingColor(a));
    await this.tween({ targets: t.c, x: hx + Math.cos(ang) * (dist + 6), y: hy + Math.sin(ang) * (dist + 6), scaleX: 1.1, scaleY: 0.92, duration: 75, ease: 'Quad.In' });
    const col = FX.swingColor(a);
    FX.slash(this, bx - Math.cos(ang) * 6, by - 8 - Math.sin(ang) * 6, ang, col, { crit, heavy: !!a.heavy || a.id === 'warden' });
    FX.impact(this, bx - Math.cos(ang) * 10, by - 10 - Math.sin(ang) * 10, col, { crit, ang });
    if (crit) FX.zoomPunch(this, bx, by);
    this.tweens.add({ targets: t.c, x: hx, y: hy, scaleX: 1, scaleY: 1, duration: 220, delay: 70, ease: 'Quad.Out' });
  }
  async settle(a) {
    const t = this.tokens.get(a.id);
    await this.tween({ targets: t.c, x: this.tx(a.x), y: this.ty(a.y), scaleX: 1, scaleY: 1, duration: 140 });
  }
  async projectile(a, b, tint = C.dread, tex = 'spark', scale = 2.4) {
    sfx.whoosh();
    const at = this.tokens.get(a.id);
    if (at) {
      FX.face(at, this.tx(a.x), this.tx(b.x));
      this.tweens.add({ targets: at.c, scaleX: 1.12, scaleY: 0.9, duration: 80, yoyo: true });
      const m = this.add.image(this.tx(a.x), this.ty(a.y) - 14, 'glow').setDepth(52).setBlendMode('ADD').setTint(tint).setScale(0.1);
      this.tweens.add({ targets: m, scale: 0.4, alpha: 0, duration: 200, onComplete: () => m.destroy() });
    }
    await FX.bolt(this, this.tx(a.x), this.ty(a.y) - 14, this.tx(b.x), this.ty(b.y) - 10, tint, { size: Math.max(0.7, scale / 2.4), lob: tex === 'smoke' ? 10 : 30 });
  }
  dmgBonusVs(u, e) {
    let b = u.mods.dmg ?? 0;
    if (e.marked > 0) b += u.mods.markDmg ?? 0;
    if (R.lightAt(this.s, e.x, e.y) === R.LIGHT.DARK) b += u.mods.darkDmg ?? 0;
    if (e.dazed > 0) b += Math.max(0, ...R.alive(this.s, 'hero').map((h) => h.mods.dazedVuln ?? 0));
    return b;
  }

  async heroAttack(u, e, sk) {
    await this.windUp(u, e);
    const am = R.attackMode(this.s, u, e, sk.ranged);
    u.attackedYet = true;
    const res = await this.roll({ label: `${this.hname(u)} · ${sk.name}`, bonus: R.attackBonus(this.s, u, e), dc: R.guardOf(e), mode: am.mode, reasons: am, roller: u, allowPush: true, fate: 'hero', critOn: u.critOn, autoCrit: u.resolve });
    if (u.resolve) u.resolve = false;
    if (sk.ranged) { await this.settle(u); await this.projectile(u, e, u.id === 'scholar' ? C.dread : C.amber); }
    if (!res.hit) {
      if (!sk.ranged) await this.settle(u);
      this.missFx(e, res.fumble ? 'FUMBLE' : 'MISS');
      this.say(res.fumble ? 'fumble' : 'heroMiss', { hero: u, foe: e }, HEX.boneDim, res.fumble);
      if (res.fumble) { this.run.stats.fumbles++; this.addDread(u, 10); }
      return;
    }
    if (!sk.ranged) await this.strike(u, e, 18, { crit: res.crit });
    const critMul = res.crit ? (R.hasRelic(this.run, 'r_tithe') ? 3 : 2) : 1;
    const forced = this.tut?.takeForced('dmg');
    const dmg = forced ?? R.rollDice(this.rng, sk.dmg, critMul, this.dmgBonusVs(u, e)).total;
    const willKill = dmg >= e.hp;
    if (res.crit) {
      this.run.stats.crits++;
      this.say(willKill ? 'critKill' : 'crit', { hero: u, foe: e }, HEX.amberHot, true);
      this.bark(u, 'crit');
      R.alive(this.s, 'hero').filter((h) => R.cheb(h, u) <= 3).forEach((h) => this.addDread(h, -10));
      if (willKill && (e.elite || e.boss)) R.chronicle(this.run, `${this.hname(u)} rolled a natural twenty and felled the ${e.name}.`);
    } else { this.say('heroHit', { hero: u, foe: e }); this.bark(u, 'hit', 0.25); }
    await this.damage(e, dmg, { crit: res.crit, by: u });
    if (e.dead) return;
    if (sk.knock) await this.push(u, e, sk.knock, { by: u });
    else if (sk.ranged && (res.crit || u.mods.boltPush)) await this.push(u, e, 1, { by: u });
  }

  async heroShove(u, e, sk) {
    await this.windUp(u, e);
    const am = R.attackMode(this.s, u, e, false);
    u.attackedYet = true;
    const res = await this.roll({ label: `${this.hname(u)} · ${sk.name}`, bonus: R.attackBonus(this.s, u, e), dc: R.guardOf(e), mode: am.mode, reasons: am, roller: u, allowPush: true, fate: 'hero', critOn: u.critOn, autoCrit: u.resolve });
    if (u.resolve) u.resolve = false;
    if (!res.hit) { await this.settle(u); this.missFx(e, res.fumble ? 'FUMBLE' : 'RESISTED'); if (res.fumble) { this.run.stats.fumbles++; this.addDread(u, 10); } return; }
    await this.strike(u, e, 22);
    if (res.crit) { this.run.stats.crits++; this.say('crit', { hero: u, foe: e }, HEX.amberHot, true); }
    this.bark(u, 'shove', 0.5);
    await this.push(u, e, sk.push + R.shoveBonus(u) + (res.crit ? 1 : 0), { slamBonus: u.mods.slam ?? 0, by: u });
  }

  async push(from, e, dist, { slamBonus = 0, by = null } = {}) {
    const pp = R.shovePath(this.s, from, e, dist);
    const t = this.tokens.get(e.id);
    sfx.whoosh();
    for (const st of pp.path) {
      e.x = st.x; e.y = st.y;
      t.c.setDepth(32 + st.y * 0.01);
      FX.afterimage(this, t, 0xbfe6dc);
      this.fx.dust.explode(3, t.c.x, t.c.y + 18);
      await this.tween({ targets: t.c, x: this.tx(st.x), y: this.ty(st.y), duration: 95, ease: 'Quad.Out' });
      FX.afterimage(this, t, 0xbfe6dc);
    }
    if (pp.path.length && R.hasRelic(this.run, 'r_charter') && e.side === 'enemy') await this.damage(e, R.die(this.rng, 4), { quiet: true });
    if (e.dead) return;
    if (pp.result === 'wall') {
      sfx.slam(); this.cameras.main.shake(160, 0.007);
      FX.impact(this, t.c.x, t.c.y - 6, 0xd9cfb8, { crit: true });
      this.fx.dust.explode(14, t.c.x, t.c.y);
      floatText(this, this.tx(e.x), this.ty(e.y) - 30, 'SLAM', HEX.amber, { size: 18 });
      await this.damage(e, R.die(this.rng, 4) + 1 + slamBonus, { quiet: true, by });
    } else if (pp.result === 'unit') {
      sfx.slam(); this.cameras.main.shake(140, 0.006);
      floatText(this, this.tx(e.x), this.ty(e.y) - 30, 'CRASH', HEX.amber, { size: 18 });
      await this.damage(e, R.die(this.rng, 4) + Math.floor(slamBonus / 2), { quiet: true, by });
      if (!pp.other.dead) await this.damage(pp.other, R.die(this.rng, 4), { quiet: true });
    } else if (pp.result === 'water' && !e.dead) await this.fallInWater(e, by);
    this.refreshAll();
  }
  async fallInWater(e, by) {
    const t = this.tokens.get(e.id);
    sfx.splash();
    this.fx.brine.explode(30, this.tx(e.x), this.ty(e.y));
    this.cameras.main.shake(180, 0.006);
    if (e.side === 'enemy' && !e.elite && !e.boss) {
      e.drowning = true;
      this.tweens.add({ targets: t.c, scale: 0.8, alpha: 0.75, duration: 300 });
      floatText(this, this.tx(e.x), this.ty(e.y) - 30, 'DROWNING', HEX.teal, { size: 18 });
      this.say('drown', { foe: e }, HEX.teal, true);
      if (by?.mods?.drownRefund && by.acted) { by.acted = false; floatText(this, this.tx(by.x), this.ty(by.y) - 40, 'ACT AGAIN', HEX.amberHot, { size: 16 }); }
    } else if (e.side === 'enemy') {
      e.inDeep = true; e.dazed = Math.max(e.dazed, 1);
      floatText(this, this.tx(e.x), this.ty(e.y) - 30, 'GOES UNDER', HEX.teal, { size: 18 });
      this.say('drownElite', { foe: e }, HEX.teal, true);
      await this.damage(e, R.rollDice(this.rng, '2d6').total, { quiet: true, by });
    } else if (!e.swims) {
      e.inDeep = true;
      floatText(this, this.tx(e.x), this.ty(e.y) - 30, 'IN DEEP WATER', HEX.red, { size: 16 });
    }
  }
  async brace(u) {
    u.braced = true; sfx.brace();
    const t = this.tokens.get(u.id);
    FX.shieldDome(this, t.c.x, t.c.y, C.amber);
    await this.tween({ targets: t.c, scale: 1.15, duration: 120, yoyo: true });
    this.fx.spark.explode(16, t.c.x, t.c.y);
    floatText(this, t.c.x, t.c.y - 30, '+3 GUARD', HEX.amber, { size: 18 });
    this.say('brace', { hero: u });
  }
  async markFoe(u, e) {
    await this.projectile(u, e, C.amberHot, 'spark', 1.6);
    e.marked = 2 + (u.mods.markLong ?? 0); sfx.mark();
    const ring = this.add.circle(this.tx(e.x), this.ty(e.y), 10).setStrokeStyle(3, C.amberHot).setDepth(52);
    this.tween({ targets: ring, radius: 40, alpha: 0, duration: 600, onComplete: () => ring.destroy() });
    floatText(this, this.tx(e.x), this.ty(e.y) - 30, 'MARKED', HEX.amberHot, { size: 18 });
    this.say('mark', { hero: u, foe: e }, HEX.amberHot);
    this.refreshAll();
  }
  async throwLantern(u, tg) {
    const s = this.s;
    s.lantern = { carrier: null, x: tg.x, y: tg.y };
    this.lanternFlying = true;
    sfx.whoosh();
    const sx = this.lanternImg.x, sy = this.lanternImg.y, ex = this.tx(tg.x), ey = this.ty(tg.y);
    await this.tween({ targets: { v: 0 }, v: 1, duration: 420, onUpdate: (tw) => {
      const v = tw.getValue();
      const x = sx + (ex - sx) * v, y = sy + (ey - sy) * v - Math.sin(v * Math.PI) * 70;
      this.lanternImg.setPosition(x, y).setAngle(v * 360);
      this.lanternGlow.setPosition(x, y);
    } });
    this.lanternImg.setAngle(0);
    this.lanternFlying = false;
    const catcher = R.unitAt(s, tg.x, tg.y);
    if (catcher?.side === 'hero') s.lantern.carrier = catcher.id;
    sfx.land(); this.fx.spark.explode(24, ex, ey);
    this.say('lantern', { hero: u }, HEX.amberHot);
    this.refreshAll();
  }
  async kindle(u, b) {
    b.lit = true; sfx.kindle();
    b.glow.setAlpha(0).setScale(0.4);
    this.tweens.add({ targets: b.glow, alpha: 0.42, scale: 1.6, duration: 500, ease: 'Quad.Out' });
    this.fx.fire.explode(30, this.tx(b.x), this.ty(b.y));
    R.alive(this.s, 'hero').filter((h) => R.cheb(h, b) <= 3).forEach((h) => this.addDread(h, -8));
    this.say('kindle', { hero: u }, HEX.amberHot);
    this.refreshAll();
    await this.wait(300);
  }
  async openChest(u, ch) {
    ch.open = true;
    sfx.chest();
    ch.img.setTexture('px_chest_open');
    this.fx.gold.explode(40, this.tx(ch.x), this.ty(ch.y));
    this.cameras.main.shake(120, 0.003);
    this.say('chest', { hero: u }, HEX.amberHot);
    const silver = this.silver(8 + R.die(this.rng, 10));
    floatText(this, this.tx(ch.x), this.ty(ch.y) - 30, `+${silver} silver`, '#c9d4d2', { size: 16 });
    await this.wait(300);
    const ids = R.rollLoot(this.run, R.runRng(this.run), { count: 3, minRarity: 'blessed' });
    await this.lootModal(ids, 'A Reliquary', 'The drowned kept this for someone. Choose one.');
  }
  lootModal(ids, title, subtitle) {
    this.modal = true;
    return new Promise((res) => showLootChoice(this, this.run, ids, { title, subtitle, onDone: () => { this.modal = false; this.refreshHud(); res(); } }));
  }
  async toll(u, sk) {
    sfx.toll();
    const t = this.tokens.get(u.id);
    for (let i = 0; i < 3; i++) {
      const ring = this.add.circle(t.c.x, t.c.y, 20).setStrokeStyle(4, C.amber, 0.9).setDepth(52);
      this.tweens.add({ targets: ring, radius: (sk.radius + 0.5) * T, alpha: 0, duration: 700, delay: i * 160, onComplete: () => ring.destroy() });
    }
    this.cameras.main.shake(260, 0.005);
    this.say('toll', { hero: u }, HEX.amber, true);
    await this.wait(400);
    const dc = sk.dc + (u.mods.tollDc ?? 0) + Math.max(0, u.stats.CHA - 2);
    const foes = R.alive(this.s, 'enemy').filter((x) => R.cheb(x, u) <= sk.radius).sort((a, b) => R.cheb(b, u) - R.cheb(a, u));
    for (const e of foes) {
      if (e.dead) continue;
      await this.push(u, e, 1 + (u.mods.tollPush ?? 0), { by: u });
      if (e.dead) continue;
      if (u.mods.tollDmg) await this.damage(e, R.die(this.rng, 6), { quiet: true, by: u });
      if (e.dead || e.drowning) continue;
      const bonus = e.boss ? 4 : e.elite ? 2 : 0;
      const r = R.rollD20(this.rng, 0);
      const ok = r.kept === 20 || (r.kept !== 1 && r.kept + bonus >= dc);
      floatText(this, this.tx(e.x), this.ty(e.y) - 30, ok ? `${r.kept + bonus} vs ${dc} · RESISTS` : `${r.kept + bonus} vs ${dc} · DAZED`, ok ? HEX.boneDim : HEX.amberHot, { size: 15 });
      if (!ok) e.dazed = R.hasRelic(this.run, 'r_silence') ? 2 : 1;
      await this.wait(200);
    }
    this.refreshAll();
  }
  async chime(u, sk) {
    sfx.chime();
    const t = this.tokens.get(u.id);
    const ring = this.add.circle(t.c.x, t.c.y, 20).setStrokeStyle(3, C.dread, 0.9).setDepth(52);
    this.tweens.add({ targets: ring, radius: (sk.radius + 0.5) * T, alpha: 0, duration: 800, onComplete: () => ring.destroy() });
    this.say('chime', { hero: u }, HEX.dread);
    await this.wait(300);
    for (const h of R.alive(this.s, 'hero').filter((x) => R.cheb(x, u) <= sk.radius)) {
      const heal = 3 + Math.max(0, u.stats.CHA) + (u.mods.chimeBonus ?? 0);
      h.hp = Math.min(h.maxHp, h.hp + heal);
      floatText(this, this.tx(h.x), this.ty(h.y) - 20, `+${heal}`, '#8fdf93', { size: 18 });
      this.addDread(h, -(15 + (u.mods.chimeDread ?? 0)));
      this.fx.dread.explode(14, this.tx(h.x), this.ty(h.y));
    }
    this.refreshAll();
  }
  async useItem(u, tg) {
    const { index, it } = this.pendingItem;
    this.pendingItem = null;
    this.busy = true; u.acted = true;
    this.highlight.clear(); this.hoverG.clear();
    this.run.consumables.splice(index, 1);
    const target = tg?.unit;
    switch (it.use) {
      case 'salts': this.addDread(target, -30); sfx.chime(); this.fx.dread.explode(20, this.tx(target.x), this.ty(target.y)); break;
      case 'bandage': target.hp = Math.min(target.maxHp, target.hp + 10); sfx.equip(); floatText(this, this.tx(target.x), this.ty(target.y) - 20, '+10', '#8fdf93', { size: 20 }); break;
      case 'holy': target.flaw = null; this.addDread(target, -20); sfx.resolve(); this.fx.gold.explode(20, this.tx(target.x), this.ty(target.y)); break;
      case 'flare': this.s.flare = true; sfx.kindle(); this.cameras.main.flash(300, 255, 230, 180); this.refreshAll(); this.log('Phosphor light floods the chapel. Nothing can hide.', HEX.amberHot); break;
      case 'oil': {
        await this.projectile(u, tg, 0xff7a2a, 'spark', 2);
        sfx.fire(); this.cameras.main.shake(220, 0.008);
        this.fx.fire.explode(60, this.tx(tg.x), this.ty(tg.y));
        this.s.fireAt = { x: tg.x, y: tg.y };
        this.refreshLight();
        for (const v of R.alive(this.s).filter((x) => R.cheb(x, tg) <= 1)) { await this.damage(v, R.rollDice(this.rng, '2d6').total, { quiet: true, by: u }); v.burning = v.dead ? 0 : 2; }
        this.log('Oil and fire. The drowned remember what it was to burn.', HEX.amberHot);
        break;
      }
      default: break;
    }
    await this.checkDread();
    this.busy = false;
    if (await this.checkEnd()) return;
    this.afterHeroAction(u);
  }

  // ---------- damage, death, dread ----------
  silver(n) {
    const amt = Math.round(n * (R.hasRelic(this.run, 'r_coin') ? 1.5 : 1));
    this.run.silver += amt;
    sfx.coin();
    return amt;
  }
  missFx(e, label) {
    sfx.miss();
    floatText(this, this.tx(e.x), this.ty(e.y) - 30, `✗ ${label}`, HEX.boneDim, { size: 20 });
    const t = this.tokens.get(e.id);
    this.tweens.add({ targets: t.c, x: t.c.x + 8, duration: 70, yoyo: true });
  }
  async damage(u, amount, { crit = false, by = null, quiet = false, source = '' } = {}) {
    if (u.dead) return;
    const t = this.tokens.get(u.id);
    if (u.flaw === 'frail') amount += 2;
    if (u.ward > 0 && amount > 0) {
      const soak = Math.min(u.ward, amount);
      u.ward -= soak; amount -= soak;
      FX.shieldDome(this, t.c.x, t.c.y, 0x8fdf93);
      floatText(this, t.c.x, t.c.y - 44, u.ward > 0 ? `WARD -${soak}` : 'WARD BROKEN', '#8fdf93', { size: 15 });
      sfx.parry();
      if (amount <= 0) { this.refreshBars(); await this.wait(quiet ? 120 : 220); return; }
    }
    u.hp = Math.max(0, u.hp - amount);
    (crit || amount >= 10 ? sfx.bigHit : sfx.hit)();
    t.flash.setAlpha(0.8);
    this.tweens.add({ targets: t.flash, alpha: 0, duration: 170, ease: 'Quad.Out' });
    this.tweens.add({ targets: t.c, scaleX: 1.18, scaleY: 0.86, duration: 70, yoyo: true });
    if (by && !by.dead && by !== u) {
      const ka = Math.atan2(this.ty(u.y) - this.ty(by.y), this.tx(u.x) - this.tx(by.x));
      const kd = crit ? 16 : 9;
      FX.face(t, this.tx(u.x), this.tx(by.x));
      this.tweens.add({ targets: [t.glyph, t.flash], angle: (Math.cos(ka) >= 0 ? 1 : -1) * (crit ? 14 : 8), duration: 80, yoyo: true });
      this.tweens.add({ targets: t.c, x: this.tx(u.x) + Math.cos(ka) * kd, y: this.ty(u.y) + Math.sin(ka) * kd, duration: 80, ease: 'Quad.Out', yoyo: true, hold: 60 });
    }
    (u.side === 'enemy' && ['husk', 'bishop', 'eel'].includes(u.kind) ? this.fx.brine : this.fx.blood).explode(crit ? 30 : 16, t.c.x, t.c.y);
    if (crit) this.fx.gold.explode(36, t.c.x, t.c.y);
    floatText(this, t.c.x, t.c.y - 28, `-${amount}${crit ? '!' : ''}`, crit ? HEX.amberHot : u.side === 'hero' ? '#ff6b57' : HEX.bone, { size: crit ? 34 : 24 });
    if (source) floatText(this, t.c.x, t.c.y - 54, source, HEX.boneDim, { size: 13, delay: 100 });
    this.cameras.main.shake(crit ? 260 : 120, crit ? 0.012 : 0.005);
    if (!quiet) await this.hitStop(crit ? 120 : 55);
    this.refreshBars(); this.refreshHud();
    if (u.side === 'enemy' && u.boss && !u.enraged && u.hp <= u.maxHp / 2 && u.hp > 0) {
      u.enraged = true; this.say('bossHalf', {}, HEX.red, true); sfx.scream();
      floatText(this, t.c.x, t.c.y - 60, 'ENRAGED: ACTS TWICE', HEX.red, { size: 16, dur: 1600 });
      this.floodShallows();
      R.chronicle(this.run, 'The Bishop flooded his own apse rather than lose it.');
    }
    if (u.hp <= 0) {
      if (u.side === 'hero' && R.hasRelic(this.run, 'r_hourglass') && !this.s.hourglassUsed) {
        this.s.hourglassUsed = true; u.hp = 1; sfx.resolve();
        floatText(this, t.c.x, t.c.y - 54, 'THE HOURGLASS TURNS', HEX.amberHot, { size: 15, dur: 1400 });
        this.refreshBars(); return;
      }
      await this.kill(u, by);
    } else if (u.side === 'hero' && u.hp <= u.maxHp * 0.25 && !u.lowHpSaid) {
      u.lowHpSaid = true; this.say('lowHp', { hero: u, hp: u.hp }, HEX.red); this.bark(u, 'hurt');
    }
    await this.wait(quiet ? 120 : 220);
  }
  async kill(u, by) {
    u.dead = true;
    const t = this.tokens.get(u.id);
    sfx.death();
    this.fx.smoke.explode(12, t.c.x, t.c.y);
    if (this.s.lantern.carrier === u.id) this.s.lantern = { carrier: null, x: u.x, y: u.y };
    const away = by ? Math.atan2(this.ty(u.y) - this.ty(by.y), this.tx(u.x) - this.tx(by.x)) : 0;
    FX.topple(this, t, away, { hero: u.side === 'hero' });
    this.tweens.add({ targets: [t.bar, t.eyes], alpha: 0, duration: 300 });
    if (u.side === 'enemy') {
      this.run.stats.kills++;
      if (u.elite || u.boss) { this.run.stats.elites++; if (!u.boss) R.chronicle(this.run, `${by ? this.hname(by) : 'The Vigil'} brought down a ${u.name} in ${this.s.roomName}.`); }
      const amt = this.silver(u.silver);
      floatText(this, t.c.x, t.c.y - 10, `+${amt} silver`, '#c9d4d2', { size: 15, delay: 300 });
      this.say('kill', { hero: by, foe: u });
      if (by) this.bark(by, 'kill', 0.35);
      R.alive(this.s, 'hero').filter((h) => R.cheb(h, u) <= 3).forEach((h) => this.addDread(h, -6));
      if (by?.mods?.killHeal) { by.hp = Math.min(by.maxHp, by.hp + by.mods.killHeal); floatText(this, this.tx(by.x), this.ty(by.y) - 20, `+${by.mods.killHeal}`, '#8fdf93', { size: 17 }); }
    } else {
      const m = this.add.image(this.tx(u.x), this.ty(u.y), 'fallen').setDepth(3).setAlpha(0);
      this.tweens.add({ targets: m, alpha: 0.95, duration: 600 });
      this.say('heroDown', { hero: u }, HEX.red, true);
      this.run.stats.falls++;
      R.chronicle(this.run, `${this.hname(u)} fell in ${this.s.roomName}.`);
      R.alive(this.s, 'hero').forEach((h) => { this.addDread(h, 20); this.bark(h, 'allyDown', 0.5); });
      if (this.sel === u) this.sel = null;
    }
    this.refreshAll();
    await this.wait(300);
  }
  async sinkUnit(e) {
    const t = this.tokens.get(e.id);
    sfx.splash();
    this.fx.brine.explode(40, t.c.x, t.c.y);
    for (let i = 0; i < 3; i++) {
      const r = this.add.ellipse(t.c.x, t.c.y + 16, 14, 6).setStrokeStyle(2, 0xbfe6dc, 0.9).setDepth(33);
      this.tweens.add({ targets: r, scaleX: 5, scaleY: 4, alpha: 0, duration: 700, delay: i * 180, onComplete: () => r.destroy() });
    }
    this.tweens.add({ targets: [t.glyph, t.flash], angle: 20, duration: 600 });
    await this.tween({ targets: [t.c], y: t.c.y + 26, scaleY: 0.5, alpha: 0, duration: 800, ease: 'Quad.In' });
    this.run.stats.drowned++;
    if (R.hasRelic(this.run, 'r_charter')) floatText(this, t.c.x, t.c.y - 20, `+${this.silver(10)} silver`, '#c9d4d2', { size: 15 });
    this.log(`The ${e.name} sinks into the black water.`, HEX.teal);
    await this.kill(e, null);
  }
  addDread(u, amt) {
    if (!u || u.dead || !amt) return;
    let a = amt;
    if (a > 0) a = Math.round(a * (1 + (u.mods.dreadMul ?? 0)));
    u.dread = Math.max(0, u.dread + a);
    const t = this.tokens.get(u.id);
    floatText(this, t.c.x + 18, t.c.y + 6, `${a > 0 ? '+' : ''}${a} dread`, a > 0 ? HEX.dread : HEX.bone, { size: 14, rise: 30, delay: 120 });
    if (a >= 10) { sfx.heartbeat(); this.fx.dread.explode(10, t.c.x, t.c.y); }
    this.refreshHud();
  }
  async checkDread() {
    for (const u of R.alive(this.s, 'hero')) {
      if (u.dread < 100) continue;
      sfx.dread();
      this.cameras.main.flash(260, 60, 120, 110);
      await this.banner(`${this.hname(u)}`, 'is tested by the Dread', 900);
      const bonus = u.wis + (u.mods.saveBonus ?? 0) + ((this.run.meta?.chapel ?? 0) >= 3 ? 2 : 0);
      const res = await this.roll({ label: `${this.hname(u)} · Dread Save`, bonus, dc: R.DREAD_SAVE_DC, dcLabel: 'DC', mode: 0, roller: u, fate: 'hero', kind: 'save' });
      const t = this.tokens.get(u.id);
      if (res.hit) {
        const v = rand(Object.keys(VIRTUES));
        u.dread = 40;
        if (v === 'resolve') u.resolve = true; else u.virtue = v;
        if (v === 'inspiring') { R.alive(this.s, 'hero').filter((h) => h !== u).forEach((h) => this.addDread(h, -20)); this.run.fate++; }
        sfx.resolve(); this.fx.gold.explode(50, t.c.x, t.c.y);
        this.say('dreadPass', { hero: u }, HEX.amberHot, true);
        this.bark(u, 'virtue');
        floatText(this, t.c.x, t.c.y - 40, VIRTUES[v].name.toUpperCase(), HEX.amberHot, { size: 26, dur: 1500 });
        this.log(`${VIRTUES[v].name}: ${VIRTUES[v].text}`, HEX.amberHot);
      } else {
        const options = Object.keys(FLAWS).filter((f) => f !== u.flaw);
        const flaw = rand(options);
        if (u.flaw) await this.damage(u, R.die(this.rng, 6), { quiet: true, source: 'heart stutters' });
        u.flaw = flaw; u.dread = 60;
        if (flaw === 'reckless') { u.move += 2; u.guard -= 3; }
        if (flaw === 'haunted') u.mods.dreadMul = (u.mods.dreadMul ?? 0) + 0.5;
        this.say('dreadFail', { hero: u }, HEX.red, true);
        this.bark(u, 'flaw');
        floatText(this, t.c.x, t.c.y - 40, FLAWS[flaw].name.toUpperCase(), HEX.red, { size: 26, dur: 1500 });
        this.log(`${FLAWS[flaw].name}: ${FLAWS[flaw].text}`, HEX.red);
        R.chronicle(this.run, `${this.hname(u)} broke under the Dread and became ${FLAWS[flaw].name}.`);
      }
      this.refreshAll();
    }
  }
  async tickBurning(side) {
    for (const u of R.alive(this.s, side)) {
      if (u.burning > 0) { u.burning--; this.fx.fire.explode(14, this.tx(u.x), this.ty(u.y)); await this.damage(u, R.die(this.rng, 4), { quiet: true, source: 'burning' }); }
    }
  }

  // ---------- enemy phase ----------
  async enemyPhase() {
    const s = this.s;
    s.phase = 'enemy';
    this.busy = true;
    this.refreshHud(); this.drawIntents();
    sfx.enemyPhase();
    await this.banner(`Round ${s.round}`, 'Enemy Phase', 700);
    for (const e of R.alive(s, 'enemy')) if (e.marked > 0) e.marked--;
    await this.tickBurning('enemy');
    const order = R.alive(s, 'enemy').sort((a, b) => (b.snuffs ? 1 : 0) - (a.snuffs ? 1 : 0) || (b.healer ? 1 : 0) - (a.healer ? 1 : 0));
    for (const e of order) {
      if (e.dead || this.over) continue;
      await this.enemyTurn(e);
      if (e.boss && e.enraged && !e.dead && !this.over) await this.enemyTurn(e);
      if (!e.dead && e.inDeep && (e.elite || e.boss) && R.hasRelic(this.run, 'r_undertow')) await this.damage(e, R.rollDice(this.rng, '2d6').total, { quiet: true, source: 'undertow' });
      if (await this.checkEnd()) return;
      await this.wait(140);
    }
    for (const h of R.alive(s, 'hero')) {
      if (h.inDeep && !h.swims) await this.damage(h, R.die(this.rng, 6), { quiet: true, source: 'drowning' });
      if (!h.dead && R.lightAt(s, h.x, h.y) === R.LIGHT.DARK && !R.hasRelic(this.run, 'r_tongue') && !h.mods.darkDreadImmune) this.addDread(h, 8);
    }
    s.flare = false;
    if (s.fireTurns > 0) s.fireTurns--; else s.fireAt = null;
    for (const h of R.heroUnits(s)) h.snared = false;
    for (const e of R.alive(s, 'enemy')) e.lampAim = null;
    this.refreshAll();
    await this.checkDread();
    if (await this.checkEnd()) return;
    s.round++;
    this.busy = false;
    this.startRound();
  }
  async enemyTurn(e) {
    const plan = R.planEnemy(this.s, e);
    e.turn++;
    if (e.kind === 'cultist' && plan.type !== 'lamp' && e.lampCd > 0) e.lampCd--;
    const t = this.tokens.get(e.id);
    if (plan.type === 'sink') { await this.sinkUnit(e); return; }
    if (plan.type === 'dazed') { e.dazed--; floatText(this, t.c.x, t.c.y - 30, 'DAZED', HEX.amber, { size: 18 }); this.refreshBars(); await this.wait(450); return; }
    if (plan.type === 'wait') return;
    if (R.visibleToHeroes(this.s, e)) await this.tween({ targets: t.c, scale: 1.12, duration: 110, yoyo: true });
    if (plan.path?.length && plan.type !== 'charge') await this.walk(e, plan.path);
    switch (plan.type) {
      case 'attack':
        if (R.cheb(e, plan.target) <= 1) await this.enemyStrike(e, plan.target, false);
        if (e.kind === 'gutter' && !this.s.tutorial && !e.dead && !this.over) await this.gutterRetreat(e);
        break;
      case 'lamp': await this.hurlLamp(e, plan.area); break;
      case 'charge': await this.knightCharge(e, plan); break;
      case 'dirge': await this.singDirge(e); break;
      case 'ward': await this.censerWard(e, plan.ally); break;
      case 'shoot': await this.enemyStrike(e, plan.target, true); break;
      case 'pull': await this.enemyPull(e, plan.target, e.dmg, e.pulls); break;
      case 'psalm': floatText(this, t.c.x, t.c.y - 50, 'DROWNING PSALM', HEX.red, { size: 16 }); await this.enemyPull(e, plan.target, '1d8', 2); break;
      case 'snuff': case 'snuffFar': await this.snuff(e, plan.brazier); break;
      case 'heal': await this.censerHeal(e, plan.ally); break;
      case 'cleave': {
        const targets = R.alive(this.s, 'hero').filter((h) => R.cheb(h, e) <= 1);
        if (targets.length > 1) { floatText(this, t.c.x, t.c.y - 50, 'CENSER CLEAVE', HEX.red, { size: 16 }); FX.glint(this, t.c.x, t.c.y - 50); await this.wait(250); FX.cleaveArc(this, t.c.x, t.c.y); sfx.whoosh(); }
        for (const h of targets) { if (this.over) break; await this.enemyStrike(e, h, false); }
        break;
      }
      case 'raise': await this.raiseDead(e); break;
      case 'litany': await this.litany(e); break;
      default: break;
    }
  }
  // ---------- enemy signatures: each kind telegraphs and lands its blow its own way ----------
  async enemyWindUp(e, h, ranged) {
    const t = this.tokens.get(e.id);
    const ex = this.tx(e.x), ey = this.ty(e.y);
    FX.face(t, ex, this.tx(h.x));
    const lift = (dy, sy, dur) => this.tween({ targets: [t.glyph, t.flash], y: t.glyphY + dy, scaleY: (t.glyph.scaleX) * sy, duration: dur, ease: 'Quad.Out' });
    switch (e.kind) {
      case 'cultist': await this.windUp(e, h); await lift(-12, 1.12, 160); break;            // lamp raised high
      case 'gutter': await this.tween({ targets: t.c, scaleX: 1.12, scaleY: 0.84, duration: 120 }); break; // coils low
      case 'husk': await this.tween({ targets: [t.glyph, t.flash], angle: -10, duration: 220, ease: 'Sine.InOut', yoyo: true }); await this.windUp(e, h); break;
      case 'choir': await lift(-10, 1.06, 240); sfx.scream(); break;                         // rises to sing
      case 'knight': case 'bishop':
        await this.windUp(e, h); await lift(-8, 1.1, 180);
        FX.glint(this, ex + 10, ey - 44 * t.big);
        if (!ranged) floatText(this, ex, ey - 62 * t.big, 'HEAVY', HEX.red, { size: 15 });
        await this.wait(280); break;
      default: await this.windUp(e, h);
    }
  }
  resetPose(e) {
    const t = this.tokens.get(e.id); if (!t) return;
    this.tweens.add({ targets: [t.glyph, t.flash], y: t.glyphY, angle: 0, scaleY: t.glyph.scaleX, duration: 180, ease: 'Quad.Out' });
  }
  async enemyShot(e, h) {
    const ex = this.tx(e.x), ey = this.ty(e.y) - 14, hx = this.tx(h.x), hy = this.ty(h.y) - 10;
    switch (e.kind) {
      case 'choir': await FX.soundWave(this, ex, ey, hx, hy, 0xc8a0ff); break;
      case 'censer': this.fx.smoke.explode(6, ex, ey); await FX.bolt(this, ex, ey, hx, hy, 0x8fdf93, { lob: 50, size: 1.1 }); FX.smother(this, hx, hy + 6); break;
      case 'eel': await FX.bolt(this, ex, ey, hx, hy, 0x7fe0ff, { lob: 10, size: 0.9 }); break;
      default: await this.projectile(e, h, C.red, 'spark', 2);
    }
    this.resetPose(e);
  }
  async enemyMelee(e, h, crit) {
    const t = this.tokens.get(e.id);
    const hx = this.tx(h.x), hy = this.ty(h.y);
    const ang = Math.atan2(hy - this.ty(e.y), hx - this.tx(e.x));
    switch (e.kind) {
      case 'cultist':
        this.tweens.add({ targets: [t.glyph, t.flash], y: t.glyphY + 4, scaleY: t.glyph.scaleX * 0.9, duration: 70, ease: 'Quad.In' });
        await this.strike(e, h, 16, { crit });
        FX.smash(this, hx, hy, 0xff8a3a);
        this.fx.fire.explode(14, hx, hy - 6);
        break;
      case 'gutter':
        for (let i = 0; i < 3; i++) this.time.delayedCall(i * 25, () => FX.afterimage(this, t, 0xd0402c));
        await this.strike(e, h, 28, { crit });
        FX.xSlash(this, hx, hy - 8, 0xff5a4a);
        break;
      case 'husk':
        await this.strike(e, h, 14, { crit });
        FX.clawMarks(this, hx, hy - 10, ang, 0x9fdf7a);
        this.fx.brine.explode(16, hx, hy);
        break;
      case 'snuffer':
        await this.strike(e, h, 18, { crit });
        FX.smother(this, hx, hy - 6);
        break;
      case 'knight':
        this.tweens.add({ targets: [t.glyph, t.flash], y: t.glyphY + 6, scaleY: t.glyph.scaleX * 0.88, duration: 80, ease: 'Quad.In' });
        await this.strike(e, h, 24, { crit: true });
        FX.smash(this, hx, hy, 0xe0f0f0, true);
        break;
      case 'bishop':
        await this.strike(e, h, 22, { crit: true });
        FX.smash(this, hx, hy, 0x9fd6cb, true);
        this.fx.brine.explode(24, hx, hy);
        break;
      default: await this.strike(e, h, 18, { crit });
    }
    this.resetPose(e);
  }

  async enemyStrike(e, h, ranged, opts = {}) {
    if (h.dead) return;
    if (this.tut) await this.tut.trigger('beforeEnemyAttack');
    await this.enemyWindUp(e, h, ranged);
    const am = R.attackMode(this.s, e, h, ranged);
    let res = await this.roll({ label: `${e.name} attacks ${this.hname(h)}`, bonus: e.atk, dc: R.guardOf(h), mode: am.mode, reasons: am, roller: e, enemy: true });
    if (!res.hit) { await this.settle(e); this.resetPose(e); this.missFx(h, res.fumble ? 'FUMBLE' : 'MISS'); return; }
    if (ranged) { await this.settle(e); await this.enemyShot(e, h); }
    else await this.enemyMelee(e, h, res.crit);
    let dmg = R.rollDice(this.rng, e.dmg, res.crit ? 2 : 1).total + (opts.bonus ?? 0);
    let mult = 1;
    let reacted = 'none';
    if (h.reaction) {
      h.reaction = false;
      reacted = await this.reactRing(h, e);
      if (this.tut && reacted !== 'perfect' && !this.tutRingRetry) {
        this.tutRingRetry = true;
        this.caption('Again. Wait until the closing ring touches the inner ring, then press.', HEX.amberHot);
        await this.wait(900);
        reacted = await this.reactRing(h, e);
      }
      if (reacted === 'perfect') mult = e.heavy && !h.mods.heavyParry ? 0.5 : 0;
      if (reacted === 'good') mult = e.heavy ? 0.75 : 0.5;
    }
    if (reacted === 'perfect') {
      this.run.stats.parries++;
      if (h.mods.firstParryMark && !h.firstParryDone) { h.firstParryDone = true; e.marked = 2; floatText(this, this.tx(e.x), this.ty(e.y) - 30, 'MARKED', HEX.amberHot, { size: 16 }); }
      if ((h.braced || h.mods.riposteAlways) && !e.dead && !ranged) {
        await this.strike(h, e, 16);
        await this.damage(e, R.rollDice(this.rng, '1d6+3').total, { quiet: true, source: 'riposte', by: h });
      }
      if (mult === 0) { this.say(h.id === 'warden' ? 'parry' : 'dodge', { hero: h, foe: e }, HEX.amberHot); return; }
    }
    dmg = Math.max(mult < 1 ? 1 : 0, Math.ceil(dmg * mult));
    const lethal = dmg + (h.flaw === 'frail' ? 2 : 0) >= h.hp;
    if (lethal && this.run.fate > 0 && !this.tut) {
      const burn = await this.fatePrompt(`This blow will fell ${this.hname(h)}. Burn a Fate to make the ${e.name} reroll its attack?`);
      if (burn) {
        this.run.fate--; this.refreshHud(); sfx.resolve();
        res = await this.roll({ label: `${e.name} · FATE REROLL`, bonus: e.atk, dc: R.guardOf(h), mode: am.mode, reasons: am, roller: e, enemy: true });
        if (!res.hit) { this.missFx(h, 'FATE TURNS IT'); this.say('fateTurn', {}, HEX.amberHot, true); return; }
      }
    }
    this.say('enemyHit', { hero: h, foe: e }, HEX.red);
    await this.damage(h, dmg, { crit: res.crit, quiet: false, by: e });
    if (h.dead) return;
    if (res.crit) this.addDread(h, 10);
    if (e.dreadOnHit) this.addDread(h, Math.round(e.dreadOnHit * (mult < 1 ? 0.5 : 1)));
    if (!this.s.tutorial && !h.dead && e.kind === 'snuffer' && this.s.lantern.carrier === h.id) this.knockLantern(h, e);
    if (!this.s.tutorial && !h.dead && e.kind === 'husk') {
      const dt = R.dragTile(this.s, h);
      if (dt) await this.dragUnder(e, h, dt);
    }
    if ((opts.shove ?? e.shoves) && !h.dead) await this.push(e, h, opts.shove ?? e.shoves);
  }

  // ---------- enemy signature moves ----------
  async hurlLamp(e, area) {
    const s = this.s;
    e.lampAim = null; e.lampCd = 2;
    const t = this.tokens.get(e.id);
    const ax = this.tx(area.x), ay = this.ty(area.y);
    FX.face(t, this.tx(e.x), ax);
    floatText(this, t.c.x, t.c.y - 50, 'THE LAMP IS LIT', HEX.amberHot, { size: 16 });
    this.tweens.add({ targets: [t.glyph, t.flash], y: t.glyphY - 12, duration: 200, yoyo: true, hold: 120 });
    sfx.kindle();
    await this.wait(260);
    sfx.whoosh();
    await FX.bolt(this, t.c.x, t.c.y - 20, ax, ay - 6, 0xff8a3a, { lob: 70, dur: 380, size: 1.3 });
    this.resetPose(e);
    sfx.fire(); this.cameras.main.shake(260, 0.01);
    this.fx.fire.explode(70, ax, ay);
    FX.smash(this, ax, ay, 0xff8a3a, true);
    s.fireAt = { x: area.x, y: area.y }; s.fireTurns = 1;
    this.refreshLight();
    this.log('The cultist lights its lamp at last, and throws it.', HEX.amberHot);
    for (const v of R.alive(s).filter((u) => R.cheb(u, area) <= 1 && u !== e)) {
      await this.damage(v, R.die(this.rng, 6), { quiet: true, source: 'lamp-fire' });
      if (!v.dead) v.burning = Math.max(v.burning, 2);
    }
    this.refreshAll();
  }
  async knightCharge(e, plan) {
    const h = plan.target;
    const t = this.tokens.get(e.id);
    FX.face(t, this.tx(e.x), this.tx(h.x));
    FX.glint(this, t.c.x + 10, t.c.y - 50);
    floatText(this, t.c.x, t.c.y - 62, 'CHARGE', HEX.red, { size: 18 });
    await this.tween({ targets: t.c, scaleX: 0.86, scaleY: 1.12, duration: 220, ease: 'Quad.Out' });
    sfx.whoosh();
    for (const st of plan.path) {
      e.x = st.x; e.y = st.y;
      t.c.setDepth(32 + st.y * 0.01);
      FX.afterimage(this, t, 0xd0402c);
      this.fx.dust.explode(5, t.c.x, t.c.y + 18);
      sfx.step();
      await this.tween({ targets: t.c, x: this.tx(st.x), y: this.ty(st.y), scaleX: 1.1, scaleY: 0.94, duration: 70, ease: 'Linear' });
    }
    this.refreshLight(); this.refreshVisibility();
    await this.enemyStrike(e, h, false, { bonus: 2, shove: 2 });
  }
  async singDirge(e) {
    const t = this.tokens.get(e.id);
    floatText(this, t.c.x, t.c.y - 50, 'DIRGE', HEX.dread, { size: 18 });
    this.tweens.add({ targets: [t.glyph, t.flash], y: t.glyphY - 12, duration: 300, yoyo: true, hold: 500 });
    sfx.scream();
    await this.wait(200);
    const targets = R.dirgeTargets(this.s, e);
    await Promise.all(targets.map((h, i) => new Promise((r) => this.time.delayedCall(i * 120, () => FX.soundWave(this, t.c.x, t.c.y - 14, this.tx(h.x), this.ty(h.y) - 10, 0xc8a0ff).then(r)))));
    for (const h of targets) { this.addDread(h, 8); this.fx.dread.explode(10, this.tx(h.x), this.ty(h.y)); }
    this.log('The choir sings a dirge. Every hero who hears it remembers someone drowned.', HEX.dread);
    this.resetPose(e);
    this.refreshAll();
    await this.wait(300);
  }
  async censerWard(e, ally) {
    if (!ally || ally.dead) return;
    const et = this.tokens.get(e.id);
    sfx.chime();
    this.tweens.add({ targets: [et.glyph, et.flash], angle: { from: -14, to: 14 }, duration: 160, yoyo: true, repeat: 1 });
    await FX.bolt(this, this.tx(e.x), this.ty(e.y) - 14, this.tx(ally.x), this.ty(ally.y) - 10, 0x8fdf93, { lob: 50, size: 1 });
    this.resetPose(e);
    ally.ward = 6;
    FX.shieldDome(this, this.tx(ally.x), this.ty(ally.y), 0x8fdf93);
    FX.incense(this, this.tx(ally.x), this.ty(ally.y));
    floatText(this, this.tx(ally.x), this.ty(ally.y) - 30, 'WARD 6', '#8fdf93', { size: 17 });
    this.refreshAll();
    await this.wait(300);
  }
  async gutterRetreat(e) {
    const tile = R.retreatTile(this.s, e);
    if (!tile || (tile.x === e.x && tile.y === e.y)) return;
    const reach = R.reachable(this.s, e, 2);
    const path = R.pathFrom(this.s, reach, tile.x, tile.y);
    if (!path.length) return;
    const t = this.tokens.get(e.id);
    floatText(this, t.c.x, t.c.y - 40, 'SLIPS AWAY', HEX.boneDim, { size: 14 });
    for (const st of path) {
      e.x = st.x; e.y = st.y;
      t.c.setDepth(32 + st.y * 0.01);
      FX.afterimage(this, t, 0x3a2a2a);
      await this.tween({ targets: t.c, x: this.tx(st.x), y: this.ty(st.y), duration: 90, ease: 'Quad.Out' });
    }
    this.refreshVisibility();
  }
  knockLantern(h, e) {
    const s = this.s;
    const away = R.neighbors(s, h).filter((p) => !R.isSolid(R.tileAt(s, p.x, p.y)) && R.tileAt(s, p.x, p.y) !== '~' && !R.unitAt(s, p.x, p.y))
      .sort((a, b) => R.cheb(b, e) - R.cheb(a, e))[0] ?? { x: h.x, y: h.y };
    s.lantern = { carrier: null, x: away.x, y: away.y };
    const sx = this.lanternImg.x, sy = this.lanternImg.y, ex = this.tx(away.x), ey = this.ty(away.y);
    this.lanternFlying = true;
    this.tweens.add({ targets: { v: 0 }, v: 1, duration: 320, onUpdate: (tw) => {
      const v = tw.getValue();
      const x = sx + (ex - sx) * v, y = sy + (ey - sy) * v - Math.sin(v * Math.PI) * 40;
      this.lanternImg.setPosition(x, y).setAngle(v * 300); this.lanternGlow.setPosition(x, y);
    }, onComplete: () => { this.lanternImg.setAngle(0); this.lanternFlying = false; sfx.land(); this.fx.spark.explode(14, ex, ey); this.refreshAll(); } });
    floatText(this, this.tx(h.x), this.ty(h.y) - 50, 'LANTERN KNOCKED LOOSE', HEX.red, { size: 15 });
    this.log('The snuffer slaps the lantern from your hand. Pick it up again by walking over it.', HEX.red);
  }
  async dragUnder(e, h, tile) {
    const t = this.tokens.get(h.id);
    floatText(this, this.tx(h.x), this.ty(h.y) - 50, 'DRAGGED UNDER', HEX.red, { size: 16 });
    h.x = tile.x; h.y = tile.y;
    t.c.setDepth(32 + tile.y * 0.01);
    FX.afterimage(this, t, 0x7fe0ff);
    await this.tween({ targets: t.c, x: this.tx(tile.x), y: this.ty(tile.y), duration: 180, ease: 'Quad.In' });
    this.refreshLight();
    await this.fallInWater(h, e);
    this.refreshAll();
  }
  async enemyPull(e, h, dmgSpec, dist) {
    if (h.dead) return;
    const et = this.tokens.get(e.id);
    FX.face(et, this.tx(e.x), this.tx(h.x));
    await this.tween({ targets: et.c, scaleX: 0.9, scaleY: 1.1, duration: 150 });
    this.tweens.add({ targets: et.c, scaleX: 1.1, scaleY: 0.92, duration: 90, yoyo: true });
    sfx.hook();
    const chain = FX.chainHook(this, this.tx(e.x), this.ty(e.y) - 14);
    await chain.throwTo(this.tx(h.x), this.ty(h.y) - 10);
    const res = await this.roll({ label: `${e.name} hooks ${this.hname(h)}`, bonus: e.atk, dc: R.guardOf(h), mode: 0, roller: e, enemy: true });
    if (!res.hit) { await chain.retract(); this.missFx(h, 'MISS'); return; }
    if (h.reaction) {
      h.reaction = false;
      const r = await this.reactRing(h, e);
      if (r === 'perfect') { this.run.stats.parries++; FX.impact(this, this.tx(h.x), this.ty(h.y) - 10, 0xd9cfb8); await chain.retract(140); this.log('The hook bites nothing but air.', HEX.amberHot); return; }
    }
    FX.impact(this, this.tx(h.x), this.ty(h.y) - 10, 0x7fe0ff);
    const pp = R.pullPath(this.s, e, h, dist);
    const t = this.tokens.get(h.id);
    this.say('pull', { hero: h, foe: e }, HEX.red, true);
    for (const st of pp.path) {
      h.x = st.x; h.y = st.y;
      t.c.setDepth(32 + st.y * 0.01);
      FX.afterimage(this, t, 0x7fe0ff);
      this.fx.dust.explode(3, t.c.x, t.c.y + 18);
      await this.tween({ targets: t.c, x: this.tx(st.x), y: this.ty(st.y), duration: 130, ease: 'Quad.In', onUpdate: () => chain.set(t.c.x, t.c.y - 10) });
      this.refreshLight();
    }
    chain.retract(160);
    if (!this.s.tutorial && !h.dead) { h.snared = true; floatText(this, this.tx(h.x), this.ty(h.y) - 50, 'SNARED', HEX.red, { size: 15 }); }
    if (pp.result === 'water') await this.fallInWater(h, null);
    await this.damage(h, R.rollDice(this.rng, dmgSpec).total, { quiet: true });
    this.refreshAll();
  }
  async censerHeal(e, ally) {
    if (!ally || ally.dead) return;
    sfx.chime();
    const et = this.tokens.get(e.id);
    this.tweens.add({ targets: [et.glyph, et.flash], angle: { from: -14, to: 14 }, duration: 160, yoyo: true, repeat: 1 });
    this.fx.smoke.explode(6, this.tx(e.x), this.ty(e.y) - 10);
    await FX.bolt(this, this.tx(e.x), this.ty(e.y) - 14, this.tx(ally.x), this.ty(ally.y) - 10, 0x8fdf93, { lob: 50, size: 1 });
    FX.incense(this, this.tx(ally.x), this.ty(ally.y));
    this.resetPose(e);
    const amt = Math.min(5, ally.maxHp - ally.hp);
    ally.hp += amt; ally.guardBuff = 2;
    floatText(this, this.tx(ally.x), this.ty(ally.y) - 30, `+${amt} · +2 GUARD`, '#8fdf93', { size: 16 });
    this.say('heal', { foe: ally }, '#8fdf93');
    this.refreshBars();
    await this.wait(300);
  }
  async snuff(e, b) {
    if (!b || !b.lit) return;
    if (R.hasRelic(this.run, 'r_wick')) { floatText(this, this.tx(b.x), this.ty(b.y) - 30, 'IT WILL NOT GO OUT', HEX.amberHot, { size: 14 }); return; }
    if (e.boss) await this.projectile(e, b, 0x203a3a, 'smoke', 2);
    const et = this.tokens.get(e.id);
    if (!e.boss && et) { FX.face(et, this.tx(e.x), this.tx(b.x)); await this.tween({ targets: et.c, x: (this.tx(e.x) * 2 + this.tx(b.x)) / 3, y: (this.ty(e.y) * 2 + this.ty(b.y)) / 3, duration: 160, yoyo: true }); }
    b.lit = false; sfx.snuff();
    FX.smother(this, this.tx(b.x), this.ty(b.y) - 10);
    this.tweens.add({ targets: b.glow, alpha: 0, scale: 0.3, duration: 500 });
    this.fx.smoke.explode(20, this.tx(b.x), this.ty(b.y));
    this.fx.fire.explode(8, this.tx(b.x), this.ty(b.y) - 6);
    this.say('snuff', {}, HEX.boneDim);
    this.refreshAll();
    for (const h of R.alive(this.s, 'hero')) if (R.lightAt(this.s, h.x, h.y) === R.LIGHT.DARK) this.addDread(h, 5);
    await this.wait(400);
  }
  async raiseDead(e) {
    const tiles = R.deepTiles(this.s);
    if (!tiles.length) return;
    sfx.raise();
    const tile = tiles.sort((a, b) => R.cheb(a, e) - R.cheb(b, e))[0];
    const bt = this.tokens.get(e.id);
    if (bt) this.tweens.add({ targets: [bt.glyph, bt.flash], y: bt.glyphY - 12, duration: 300, yoyo: true, hold: 300 });
    FX.geyser(this, this.tx(tile.x), this.ty(tile.y));
    this.fx.brine.explode(50, this.tx(tile.x), this.ty(tile.y));
    this.cameras.main.shake(400, 0.006);
    const id = `raised${this.s.summons++}`;
    const def = ENEMIES.husk;
    const base = { id, side: 'enemy', kind: 'husk', name: def.name, x: tile.x, y: tile.y, hp: 16, maxHp: 16, guard: def.guard, atk: def.atk + 1, move: def.move, dmg: def.dmg, swims: true, darkHunter: true, dreadOnHit: def.dreadOnHit, ranged: 0, silver: 4, critOn: 20, mods: {}, marked: 0, dead: false, drowning: false, dazed: 0, burning: 0, turn: 0, guardBuff: 0 };
    this.s.units.push(base);
    this.makeToken(base);
    const t = this.tokens.get(id);
    // it climbs up out of the pool
    t.glyph.y = t.glyphY + 40; t.flash.y = t.glyphY + 40; t.glyph.setAlpha(0);
    this.tweens.add({ targets: t.glyph, y: t.glyphY, alpha: 1, duration: 800, delay: 250, ease: 'Back.Out' });
    this.tweens.add({ targets: t.flash, y: t.glyphY, duration: 800, delay: 250, ease: 'Back.Out' });
    this.log('The Bishop lifts his hands, and the water gives up one of its dead.', HEX.red);
    this.refreshAll();
    await this.wait(600);
  }
  async litany(e) {
    sfx.bell();
    const t = this.tokens.get(e.id);
    const ring = this.add.circle(t.c.x, t.c.y, 30).setStrokeStyle(4, C.red, 0.8).setDepth(52);
    this.tweens.add({ targets: ring, radius: 500, alpha: 0, duration: 1200, onComplete: () => ring.destroy() });
    FX.darkLitany(this, t.c.x, t.c.y);
    for (const b of this.s.braziers) if (b.lit) this.tweens.add({ targets: b.glow, alpha: 0.08, duration: 120, yoyo: true, repeat: 3 });
    floatText(this, t.c.x, t.c.y - 50, 'BACKWARDS LITANY', HEX.red, { size: 16 });
    this.log('The Bishop chants a psalm backwards. Every candle shivers.', HEX.red);
    for (const h of R.alive(this.s, 'hero')) {
      const L = R.lightAt(this.s, h.x, h.y);
      if (L < R.LIGHT.BRIGHT) this.addDread(h, L === 0 ? 18 : 10);
    }
    await this.wait(700);
  }

  // ---------- reaction ring ----------
  reactRing(h, e) {
    return new Promise((resolve) => {
      const t = this.tokens.get(h.id);
      const x = t.c.x, y = t.c.y;
      const heavy = !!e?.heavy && !h.mods.heavyParry;
      const g = this.add.graphics().setDepth(85);
      const label = this.add.text(x, y - 68, heavy ? 'HEAVY: REACT!' : 'REACT!', { fontFamily: FONT_H, fontSize: '20px', color: heavy ? '#ff8a6a' : HEX.amberHot, fontStyle: '900', stroke: '#050b0c', strokeThickness: 5 }).setOrigin(0.5).setDepth(86);
      const help = this.add.text(x, y + 64, 'SPACE / CLICK when the rings meet', { fontFamily: FONT_H, fontSize: '12px', color: HEX.bone, fontStyle: '700', stroke: '#050b0c', strokeThickness: 4 }).setOrigin(0.5).setDepth(86);
      const lead = 450, close = 800;
      const win = R.parryWindow(h);
      const start = this.time.now + lead;
      const hitAt = start + close;
      let done = false, pressedAt = null, ticked = false;
      const ringCol = heavy ? 0xff6a4a : C.amber;
      const draw = () => {
        const now = this.time.now;
        g.clear();
        const inWin = Math.abs(now - hitAt) <= win;
        g.lineStyle(inWin ? 6 : 4, inWin ? 0xffffff : C.bone, 0.95); g.strokeCircle(x, y, 28);
        g.lineStyle(12, ringCol, inWin ? 0.3 : 0.1); g.strokeCircle(x, y, 28);
        if (inWin && !ticked) { ticked = true; sfx.ring(); }
        if (now < start) return;
        const p = (now - start) / close;
        const r = Math.max(6, 28 + (1 - p) * 92);
        g.lineStyle(inWin ? 5 : 3, inWin ? 0xffffff : ringCol, 1); g.strokeCircle(x, y, r);
      };
      const ev = this.time.addEvent({ delay: 16, loop: true, callback: () => { draw(); if (this.time.now > hitAt + R.PARRY_GRAZE + 40 && !done) finish(); } });
      const onPress = () => { if (pressedAt === null && this.time.now >= start - 50) { pressedAt = this.time.now; finish(); } };
      const key = this.input.keyboard.addKey('SPACE');
      key.on('down', onPress);
      this.input.on('pointerdown', onPress);
      const finish = () => {
        if (done) return; done = true;
        ev.remove(); key.off('down', onPress); this.input.off('pointerdown', onPress);
        const dt = pressedAt === null ? Infinity : Math.abs(pressedAt - hitAt);
        const result = dt <= win ? 'perfect' : dt <= R.PARRY_GRAZE ? 'good' : 'miss';
        const txt = result === 'perfect' ? (heavy ? 'BLUNTED!' : h.id === 'warden' ? 'PARRY!' : 'DODGE!') : result === 'good' ? 'GRAZE' : pressedAt ? (pressedAt < hitAt ? 'TOO EARLY' : 'TOO LATE') : 'TOO SLOW';
        label.setText(txt).setColor(result === 'perfect' ? HEX.amberHot : result === 'good' ? HEX.bone : HEX.red);
        if (result === 'perfect') { sfx.parry(); this.fx.spark.explode(40, x, y); this.cameras.main.shake(120, 0.004); }
        else if (result === 'good') sfx.dodge();
        this.tweens.add({ targets: label, scale: 1.4, duration: 120, yoyo: true });
        this.tweens.add({ targets: [g, label, help], alpha: 0, delay: 450, duration: 250, onComplete: () => { g.destroy(); label.destroy(); help.destroy(); } });
        this.time.delayedCall(300, () => resolve(result));
      };
    });
  }

  // ---------- dice tray ----------
  makeTray() {
    const c = this.add.container(BX + BW / 2, BY + BH - 92).setDepth(80).setVisible(false);
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.5); bg.fillRoundedRect(-196, -76, 400, 162, 16);
    bg.fillStyle(0x0a1416, 0.97); bg.fillRoundedRect(-200, -80, 400, 162, 16);
    bg.lineStyle(2, C.amber, 0.9); bg.strokeRoundedRect(-200, -80, 400, 162, 16);
    this.trayLabel = this.add.text(0, -66, '', { fontFamily: FONT_H, fontSize: '15px', color: HEX.bone, fontStyle: '700' }).setOrigin(0.5);
    this.trayTag = this.add.text(0, -46, '', { fontFamily: FONT_B, fontSize: '13px', color: HEX.amber, fontStyle: 'italic' }).setOrigin(0.5);
    this.dice = [0, 1].map(() => {
      const d = this.add.container(0, 0);
      const g = this.add.graphics();
      const num = this.add.text(0, 2, '', { fontFamily: FONT_H, fontSize: '30px', color: HEX.bone, fontStyle: '900' }).setOrigin(0.5);
      d.add([g, num]); d.g = g; d.num = num;
      return d;
    });
    this.pushDie = this.add.container(130, -2);
    const pg = this.add.graphics();
    pg.fillStyle(0x2a1c0c, 1); pg.fillRoundedRect(-20, -20, 40, 40, 8); pg.lineStyle(2, C.amber, 1); pg.strokeRoundedRect(-20, -20, 40, 40, 8);
    this.pushNum = this.add.text(0, 0, '', { fontFamily: FONT_H, fontSize: '20px', color: HEX.amberHot, fontStyle: '900' }).setOrigin(0.5);
    this.pushDie.add([pg, this.pushNum]);
    this.trayFormula = this.add.text(0, 44, '', { fontFamily: FONT_B, fontSize: '16px', color: HEX.bone }).setOrigin(0.5);
    this.trayResult = this.add.text(0, 66, '', { fontFamily: FONT_H, fontSize: '20px', color: HEX.amber, fontStyle: '900' }).setOrigin(0.5);
    c.add([bg, this.trayLabel, this.trayTag, ...this.dice, this.pushDie, this.trayFormula, this.trayResult]);
    this.tray = c;
  }
  drawDie(d, enemy, kept) {
    const g = d.g; g.clear();
    const pts = [];
    for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; pts.push({ x: Math.cos(a) * 34, y: Math.sin(a) * 34 }); }
    g.fillStyle(enemy ? 0x2a1212 : 0x14282a, 1); g.fillPoints(pts, true);
    g.lineStyle(3, enemy ? 0xd0402c : C.amber, kept ? 1 : 0.4); g.strokePoints(pts, true);
    g.lineStyle(1, 0xffffff, 0.12);
    g.strokeTriangle(pts[1].x, pts[1].y, pts[3].x, pts[3].y, pts[5].x, pts[5].y);
  }
  async roll(o) {
    const s = this.s;
    let pushVal = 0;
    if (o.allowPush && s.push && o.roller?.side === 'hero') {
      pushVal = R.die(this.rng, 6);
      s.push = false;
      this.addDread(o.roller, 10);
    }
    const forced = this.tut ? (o.enemy ? this.tut.forcedFromTrigger('rolls') : this.tut.takeForced('rolls')) : null;
    let res = this.rawRoll(o, pushVal, forced);
    this.modal = true;
    await this.showRoll(o, res, pushVal, false);
    const closeMiss = !res.hit && !res.fumble && o.dc - res.total <= 5;
    const tutFate = this.tut?.step?.fate;
    const canHero = o.fate === 'hero' && !res.hit && this.run.fate > 0 && (this.tut ? !!tutFate : (o.kind === 'save' || closeMiss));
    if (canHero) {
      const q = tutFate ? 'A miss! Spend a FATE token to roll again? Press BURN (or F).' : o.kind === 'save' ? 'The save failed. Burn a Fate to reroll it?' : `Missed by ${o.dc - res.total}. Burn a Fate to reroll?`;
      const burn = await this.fatePrompt(q);
      if (burn) {
        this.run.fate--;
        sfx.resolve();
        this.refreshHud();
        const forced2 = this.tut ? this.tut.takeForced('rolls') : null;
        res = this.rawRoll(o, pushVal, forced2);
        await this.showRoll(o, res, pushVal, true);
        if (res.hit && o.kind !== 'save') this.say('fateTurn', {}, HEX.amberHot);
        this.tut?.event('fate');
      }
    }
    await this.wait(res.crit || res.fumble ? 700 : 480);
    await this.tween({ targets: this.tray, alpha: 0, scale: 0.92, duration: 150 });
    this.tray.setVisible(false);
    this.modal = false;
    return res;
  }
  rawRoll(o, pushVal, forced) {
    const r = R.rollD20(this.rng, o.mode);
    if (forced) { r.kept = forced; r.rolls = r.mode ? [forced, Math.max(1, forced - 6)] : [forced]; }
    const nat = r.kept;
    const crit = !!o.autoCrit || (o.kind !== 'save' && nat >= (o.critOn ?? 20));
    const fumble = !o.autoCrit && nat === 1;
    const total = nat + o.bonus + pushVal;
    const hit = crit || nat === 20 || (!fumble && total >= o.dc);
    return { ...r, nat, total, hit, crit, fumble };
  }
  async showRoll(o, res, pushVal, reroll) {
    const tray = this.tray;
    tray.setVisible(true).setAlpha(0).setScale(0.9);
    this.tweens.add({ targets: tray, alpha: 1, scale: 1, duration: 140, ease: 'Back.Out' });
    this.trayLabel.setText(reroll ? `${o.label} · FATE REROLL` : o.label);
    const tag = res.mode > 0 ? `ADVANTAGE · ${o.reasons?.adv.join(', ')}` : res.mode < 0 ? `DISADVANTAGE · ${o.reasons?.dis.join(', ')}` : o.autoCrit ? 'RESOLUTE · guaranteed critical' : '';
    this.trayTag.setText(tag).setColor(res.mode < 0 ? HEX.red : HEX.amber);
    const two = res.rolls.length === 2;
    const offset = pushVal ? -36 : 0;
    this.dice[0].setPosition(two ? -52 + offset : offset, -4).setVisible(true).setAlpha(1).setScale(1);
    this.dice[1].setPosition(52 + offset, -4).setVisible(two).setAlpha(1).setScale(1);
    this.pushDie.setVisible(false);
    this.trayFormula.setText(''); this.trayResult.setText('');
    this.dice.forEach((d) => this.drawDie(d, o.enemy, true));
    sfx.dice();
    for (let i = 0; i < 8; i++) {
      this.dice.forEach((d) => { d.num.setText(String(1 + Math.floor(Math.random() * 20))); d.angle = (Math.random() - 0.5) * 50; });
      await this.wait(46);
    }
    sfx.land();
    const keptIdx = two ? (res.rolls[0] === res.kept ? 0 : 1) : 0;
    res.rolls.forEach((v, i) => {
      const d = this.dice[i];
      d.angle = 0; d.num.setText(String(v));
      const kept = i === keptIdx;
      this.drawDie(d, o.enemy, kept);
      d.num.setColor(v === 20 ? HEX.amberHot : v === 1 ? HEX.red : HEX.bone);
      if (kept) this.tweens.add({ targets: d, scale: 1.25, duration: 100, yoyo: true });
      else this.tweens.add({ targets: d, alpha: 0.35, scale: 0.85, duration: 200 });
    });
    if (pushVal) {
      await this.wait(140);
      this.pushDie.setVisible(true).setScale(0.3);
      this.pushNum.setText(`+${pushVal}`);
      this.tweens.add({ targets: this.pushDie, scale: 1, duration: 200, ease: 'Back.Out' });
      sfx.land();
    }
    await this.wait(140);
    const dcLabel = o.dcLabel ?? 'Guard';
    this.trayFormula.setText(`${res.nat} ${o.bonus >= 0 ? '+' : '−'} ${Math.abs(o.bonus)}${pushVal ? ` + ${pushVal}` : ''} = ${res.total}   vs ${dcLabel} ${o.dc}`);
    const save = o.kind === 'save';
    const word = res.crit ? '★ CRITICAL!' : res.fumble ? (save ? '✗ BROKEN' : '✗ FUMBLE') : res.hit ? (save ? '✓ STEADFAST' : '✓ HIT') : (save ? '✗ FAILED' : '✗ MISS');
    const good = o.enemy ? !res.hit : res.hit;
    this.trayResult.setText(word).setColor(res.crit ? HEX.amberHot : good ? '#8fdf93' : HEX.red).setScale(0.4);
    this.tweens.add({ targets: this.trayResult, scale: 1, duration: 220, ease: 'Back.Out' });
    if (res.crit) { sfx.crit(); this.fx.gold.explode(40, tray.x, tray.y); }
    else if (res.fumble) { sfx.fumble(); this.tweens.add({ targets: this.dice[keptIdx], x: this.dice[keptIdx].x + 6, duration: 50, yoyo: true, repeat: 3 }); }
  }
  fatePrompt(question) {
    return new Promise((resolve) => {
      const c = this.add.container(this.tray.x, this.tray.y - 128).setDepth(82);
      const bg = this.add.rectangle(0, 0, 520, 72, 0x0a1416, 0.98).setStrokeStyle(2, C.amber);
      const q = this.add.text(-246, 0, question, { fontFamily: FONT_B, fontSize: '15px', color: HEX.bone, fontStyle: 'italic', wordWrap: { width: 250 } }).setOrigin(0, 0.5);
      const done = (v) => { kf.off('down', yes); kn.off('down', no); c.destroy(); resolve(v); };
      const yes = () => done(true), no = () => done(false);
      const b1 = makeButton(this, 92, 0, 130, 46, `BURN FATE (${this.run.fate})`, yes, { size: 12, fill: 0x2a1c0c, stroke: C.amber, sub: 'F' });
      const b2 = makeButton(this, 206, 0, 86, 46, 'ACCEPT', no, { size: 12, sub: 'Enter' });
      c.add([bg, q, b1, b2]);
      c.setScale(0.9).setAlpha(0);
      this.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 160, ease: 'Back.Out' });
      const kf = this.input.keyboard.addKey('F'), kn = this.input.keyboard.addKey('ENTER');
      kf.on('down', yes); kn.on('down', no);
    });
  }
  togglePush() {
    if (this.s.phase !== 'party' || this.busy) return;
    this.s.push = !this.s.push;
    this.refreshHud();
    this.hint(this.s.push ? 'PUSH armed: your next hero roll gets +1d6, and that hero gains 10 Dread.' : 'Push disarmed.');
  }

  // ---------- banners ----------
  async banner(title, sub, hold = 650) {
    const c = this.add.container(BX + BW / 2, BY + BH / 2).setDepth(95);
    const band = this.add.rectangle(0, 0, BW + 40, 110, 0x020607, 0.78);
    const line1 = this.add.rectangle(0, -55, BW + 40, 2, C.amber, 0.7);
    const line2 = this.add.rectangle(0, 55, BW + 40, 2, C.amber, 0.7);
    const t = this.add.text(0, -14, title.toUpperCase(), { fontFamily: FONT_H, fontSize: '38px', color: HEX.bone, fontStyle: '900', letterSpacing: 4 }).setOrigin(0.5);
    const st = this.add.text(0, 28, sub, { fontFamily: FONT_B, fontSize: '18px', color: HEX.amber, fontStyle: 'italic', align: 'center', wordWrap: { width: BW - 60 } }).setOrigin(0.5);
    c.add([band, line1, line2, t, st]);
    c.alpha = 0; band.scaleY = 0;
    this.tweens.add({ targets: band, scaleY: 1, duration: 220, ease: 'Quad.Out' });
    await this.tween({ targets: c, alpha: 1, duration: 200 });
    await this.wait(hold);
    await this.tween({ targets: c, alpha: 0, duration: 240 });
    c.destroy();
  }

  // ---------- end ----------
  async checkEnd() {
    if (this.over) return true;
    const s = this.s;
    if (!R.alive(s, 'enemy').length) { await this.victory(); return true; }
    if (!R.alive(s, 'hero').length) { await this.defeat(); return true; }
    return false;
  }
  async victory() {
    this.over = true; this.busy = true;
    this.highlight.clear(); this.intentG.clear(); this.intentLayer.removeAll(true); this.actionBar.removeAll(true); this.endBtn.setVisible(false);
    sfx.victory();
    const standing = R.alive(this.s, 'hero');
    const all = standing.length === R.heroUnits(this.s).length;
    const cat = all ? 'victory' : standing.length === 1 ? 'victorySolo' : 'victoryHurt';
    const text = this.line(cat, { hero: standing[0] });
    this.log(text, HEX.amberHot);
    await this.banner('Victory', text, 1100);
    this.tut?.event('victory');
    const run = this.run;
    for (const u of R.heroUnits(this.s).filter((x) => x.dead)) {
      if (this.tut) { u.deathSave = 'pass'; continue; }
      const h = run.heroes.find((x) => x.id === u.id);
      const dc = R.deathSaveDC(h);
      await this.banner(this.hname(u), 'Death save: will they rise?', 700);
      const res = await this.roll({ label: `${this.hname(u)} · Death Save`, bonus: u.wis, dc, dcLabel: 'DC', mode: 0, roller: u, fate: 'hero', kind: 'save' });
      u.deathSave = res.hit ? 'pass' : 'fail';
      if (res.hit) {
        sfx.resolve();
        this.caption(`${this.hname(u)} rises, scarred (−2 max HP), at 30% health.`, HEX.amberHot);
        R.chronicle(run, `${this.hname(u)} came back from the brink in ${this.s.roomName}, and carries the scar.`);
      } else {
        sfx.defeat();
        this.caption(`${this.hname(u)} does not rise. They are lost for the rest of this Vigil.`, HEX.red);
        R.chronicle(run, `${this.hname(u)} did not rise again in ${this.s.roomName}. The lake kept them.`);
        await this.wait(1200);
      }
      await this.wait(1400);
    }
    R.endBattle(run, this.s, true);
    run.stats.rooms++;
    const boss = this.s.units.some((u) => u.boss);
    if (boss) { R.chronicle(run, 'The Drowned Bishop fell, and the bells went quiet.'); this.cameras.main.fadeOut(800, 5, 11, 12); await this.wait(820); this.scene.start('runend', { won: true }); return; }
    if (this.tut) await this.tut.trigger('beforeLoot');
    const elite = this.node?.type === 'elite';
    const up = run.meta ?? {};
    let ids;
    if (run.firstLoot && up.ossuary) ids = R.rollLoot(run, R.runRng(run), { count: 3, only: 'relic' });
    else if (elite) ids = [...R.rollLoot(run, R.runRng(run), { count: 1, kinds: ['relic'], only: 'relic' }), ...R.rollLoot(run, R.runRng(run), { count: (up.ossuary ?? 0) >= 2 ? 3 : 2, minRarity: 'blessed' })];
    else ids = R.rollLoot(run, R.runRng(run), { count: 3 });
    run.firstLoot = false;
    await this.lootModal([...new Set(ids)], elite ? 'Elite Spoils' : 'Spoils', elite ? 'A Relic, and more. Choose one.' : 'Choose one.');
    if (elite && !this.tut) {
      this.modal = true;
      await new Promise((res) => showTalentChoice(this, run, { title: 'Hard-won Lessons', subtitle: 'The fight taught one of you something. Choose a Talent.', onDone: res }));
      this.modal = false;
    }
    this.cameras.main.fadeOut(500, 5, 11, 12);
    await this.wait(520);
    if (this.mode === 'tutorial') {
      if (!this.meta.tutorialDone) this.meta.embers += 40;
      this.meta.tutorialDone = true; saveMeta(this.meta);
      this.scene.start('camp', { fromTutorial: true });
    } else this.scene.start('map');
  }
  async defeat() {
    this.over = true; this.busy = true;
    sfx.defeat();
    this.say('defeat', {}, HEX.red, true);
    await this.banner('The Vigil Fails', this.line('defeat'), 1600);
    R.endBattle(this.run, this.s, false);
    R.chronicle(this.run, `The Vigil ended in ${this.s.roomName}.`);
    this.cameras.main.fadeOut(800, 5, 11, 12);
    await this.wait(820);
    if (this.mode === 'tutorial') { this.scene.restart(); return; }
    this.scene.start('runend', { won: false });
  }
  skipTutorial() {
    if (!this.meta.tutorialDone) this.meta.embers += 40;
    this.meta.tutorialDone = true; saveMeta(this.meta);
    this.tut?.destroy();
    this.tut = null;
    this.over = true;
    this.cameras.main.fadeOut(400, 5, 11, 12);
    this.time.delayedCall(420, () => this.scene.start('camp', { fromTutorial: true }));
  }
}
