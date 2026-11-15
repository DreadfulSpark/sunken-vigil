import * as R from '../rules.js';
import { HEROES, RARITY, itemById } from '../data.js';
import { sfx, musicPlayer } from '../audio.js';
import { C, HEX, FONT_H, FONT_B, panel, makeButton, makeItemCard } from '../ui.js';
import { partyStrip } from '../hud.js';
import { showLootChoice, showTalentChoice } from '../loot.js';
import { drawEventArt } from '../eventArt.js';

const Phaser = window.Phaser;
const RX = 470, RW = 720;

export default class EventScene extends Phaser.Scene {
  constructor() { super('event'); }
  init(data) { this.kind = data.kind; this.ev = data.event; this.run = this.registry.get('run'); this.stock = null; this.choosing = false; }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.cameras.main.fadeIn(450, 5, 11, 12);
    musicPlayer.play('explore');
    this.add.rectangle(W / 2, H / 2, W, H, C.void);
    this.drawStrip();
    panel(this, 60, 128, W - 120, H - 150, { r: 16 });
    this.artX = 260; this.artY = 400;
    drawEventArt(this, this.ev?.id ?? this.kind, 84, 152);
    const frame = this.add.graphics();
    frame.lineStyle(2, 0x24393a, 1); frame.strokeRoundedRect(84, 152, 352, 500, 12);
    this.right = this.add.container(0, 0);
    if (this.kind === 'event') this.showEvent();
    else if (this.kind === 'rest') this.showRest();
    else if (this.kind === 'shop') this.showShop();
    else if (this.kind === 'treasure') this.showTreasure();
  }

  drawStrip() { this.strip?.destroy(); this.strip = partyStrip(this, this.run, 14, { onHover: () => {} }); }
  clearRight() { this.right.removeAll(true); }
  title(text, sub) {
    this.right.add(this.add.text(RX, 152, text, { fontFamily: FONT_H, fontSize: '30px', color: HEX.amber, fontStyle: '900' }));
    if (sub) this.right.add(this.add.text(RX, 192, sub, { fontFamily: FONT_B, fontSize: '15px', color: HEX.boneDim, fontStyle: 'italic' }));
  }
  body(text, y = 226, type = true) {
    const style = { fontFamily: FONT_B, fontSize: '19px', color: HEX.bone, wordWrap: { width: RW }, lineSpacing: 6 };
    const t = this.add.text(RX, y, type ? '' : text, style);
    this.right.add(t);
    if (type) {
      let i = 0;
      this.time.addEvent({ delay: 12, repeat: text.length - 1, callback: () => { i++; t.setText(text.slice(0, i)); } });
    }
    const probe = this.add.text(-2000, -2000, text, style);
    t.fullHeight = probe.height; probe.destroy();
    return t;
  }
  fill(text, heroId) { return text.replaceAll('{hero}', heroId ? HEROES[heroId].name : 'one of you'); }

  // ---------- curio ----------
  showEvent() {
    const ev = this.ev;
    this.clearRight();
    this.title(ev.title, 'A curio in the dark');
    const t = this.body(ev.text);
    let y = 226 + t.fullHeight + 28;
    const party = R.partyHeroes(this.run);
    ev.options.forEach((op, idx) => {
      let sub = 'No roll: a choice';
      let enabled = true;
      if (op.stat) {
        const best = party.reduce((a, h) => (HEROES[h.id].stats[op.stat] > HEROES[a.id].stats[op.stat] ? h : a), party[0]);
        const mod = HEROES[best.id].stats[op.stat];
        sub = `${op.stat} check · DC ${op.dc} · best: ${HEROES[best.id].name} ${mod >= 0 ? '+' : ''}${mod} (${Math.round(R.hitChance(mod, op.dc) * 100)}%) · ${op.stakes ?? ''}`;
      }
      if (op.only) {
        const h = party.find((x) => x.id === op.only);
        sub = h ? `${HEROES[op.only].name} only · no roll` : `${HEROES[op.only].name} is lost`;
        enabled = !!h;
      }
      if (op.needItem) { const has = this.run.consumables.includes(op.needItem); sub = `Uses your ${itemById(op.needItem).name}${has ? '' : ' (you have none)'}`; enabled = has; }
      if (op.costSilver) { sub = `Costs ${op.costSilver} silver${this.run.silver < op.costSilver ? ' (not enough)' : ''}`; enabled = this.run.silver >= op.costSilver; }
      if (op.gamble) { sub = `Bet ${op.gamble} silver on a d20 against his d20${this.run.silver < op.gamble ? ' (not enough)' : ''}`; enabled = this.run.silver >= op.gamble; }
      const b = makeButton(this, RX + RW / 2, y + 28, RW, 60, op.label, () => this.choose(op), { size: 17, sub });
      b.setEnabled(enabled);
      b.alpha = 0;
      this.tweens.add({ targets: b, alpha: enabled ? 1 : 0.35, duration: 300, delay: 300 + idx * 120 });
      this.right.add(b);
      y += 72;
    });
  }

  choose(op) {
    if (this.choosing) return;
    if (op.stat) { this.pickHero(op); return; }
    this.choosing = true;
    if (op.gamble) { this.gamble(op); return; }
    const heroId = op.only ?? op.best ?? null;
    this.resolveOutcome(op, op.pass, heroId);
  }

  pickHero(op) {
    const W = this.scale.width, H = this.scale.height;
    const c = this.add.container(W / 2, H - 92).setDepth(80);
    const bg = this.add.rectangle(0, 0, 1040, 120, 0x0b1517, 0.98).setStrokeStyle(2, C.amber);
    const t = this.add.text(0, -40, `Who attempts it? (${op.stat} check, DC ${op.dc})`, { fontFamily: FONT_H, fontSize: '17px', color: HEX.bone, fontStyle: '700' }).setOrigin(0.5);
    c.add([bg, t]);
    const party = R.partyHeroes(this.run);
    party.forEach((h, i) => {
      const mod = HEROES[h.id].stats[op.stat];
      const mode = h.flaw === 'hopeless' ? -1 : 0;
      const pct = Math.round(R.hitChance(mod, op.dc, mode) * 100);
      const b = makeButton(this, (i - (party.length - 1) / 2) * 300, 18, 280, 56, `${HEROES[h.id].name}  ${mod >= 0 ? '+' : ''}${mod}`, () => {
        c.destroy();
        this.choosing = true;
        this.rollCheck(op, h.id);
      }, { size: 16, sub: `${pct}% to succeed${h.flaw === 'hopeless' ? ' · Hopeless (Disadvantage)' : ''}${h.id === op.best ? ' · suited to this' : ''}`, fill: h.id === op.best ? 0x1d2a1f : undefined });
      c.add(b);
    });
    c.add(makeButton(this, 470, -40, 80, 30, 'Back', () => c.destroy(), { size: 12 }));
  }

  async rollCheck(op, heroId) {
    const h = this.run.heroes.find((x) => x.id === heroId);
    const mod = HEROES[heroId].stats[op.stat];
    const mode = h.flaw === 'hopeless' ? -1 : 0;
    this.right.list.forEach((o) => { if (o.setEnabled) o.setEnabled(false); });
    let res = await this.rollDie(`${HEROES[heroId].name} · ${op.stat} check`, mod, op.dc, mode);
    if (!res.ok && this.run.fate > 0) {
      const burn = await this.ask(`Failed by ${op.dc - res.total}. Burn a Fate token to reroll? (${this.run.fate} left)`);
      if (burn) { this.run.fate--; sfx.resolve(); this.drawStrip(); res = await this.rollDie(`${HEROES[heroId].name} · ${op.stat} · FATE REROLL`, mod, op.dc, mode); }
    }
    this.resolveOutcome(op, res.ok ? op.pass : op.fail, heroId);
  }

  async gamble(op) {
    const run = this.run;
    run.silver -= op.gamble; this.drawStrip();
    const mine = await this.rollDie('Your roll', 0, 0, 0, true);
    const his = R.die(Math.random, 20);
    await this.rollDie('The skeleton rolls', 0, 0, 0, true, his);
    const win = mine.nat > his;
    if (win) { sfx.coin(); sfx.loot('relic'); }
    this.resolveOutcome(op, win ? op.pass : op.fail, null, win ? `You rolled ${mine.nat}. He rolled ${his}. ` : `You rolled ${mine.nat}. He rolled ${his}. `);
  }

  resolveOutcome(op, o, heroId, prefix = '') {
    const run = this.run;
    const lines = [];
    const h = heroId ? run.heroes.find((x) => x.id === heroId && !x.lost) : null;
    const dreadMul = (hh) => 1 + (R.heroMods(hh).dreadMul ?? 0);
    const party = R.partyHeroes(run);
    if (op.costSilver) { run.silver -= op.costSilver; lines.push([`−${op.costSilver} Silver`, HEX.boneDim]); }
    if (o.dread && h) { const a = o.dread > 0 ? Math.round(o.dread * dreadMul(h)) : o.dread; h.dread = Math.max(0, Math.min(99, h.dread + a)); lines.push([`${HEROES[h.id].name} ${a > 0 ? '+' : ''}${a} Dread`, a > 0 ? HEX.dread : HEX.bone]); }
    if (o.dreadAll) {
      party.forEach((x) => { const a = o.dreadAll > 0 ? Math.round(o.dreadAll * dreadMul(x)) : o.dreadAll; x.dread = Math.max(0, Math.min(99, x.dread + a)); });
      lines.push([`All heroes ${o.dreadAll > 0 ? '+' : ''}${o.dreadAll} Dread`, o.dreadAll > 0 ? HEX.dread : HEX.bone]);
    }
    if (o.hurt && h) { h.hp = Math.max(1, h.hp - o.hurt); lines.push([`${HEROES[h.id].name} takes ${o.hurt} damage`, HEX.red]); sfx.hit(); this.cameras.main.shake(160, 0.006); }
    if (o.hurtAll) { party.forEach((x) => { x.hp = Math.max(1, x.hp - o.hurtAll); }); lines.push([`All heroes take ${o.hurtAll} damage`, HEX.red]); sfx.hit(); }
    if (o.healAll) { party.forEach((x) => { x.hp = Math.min(R.maxHpOf(x), x.hp + o.healAll); }); lines.push([`All heroes heal ${o.healAll}`, '#8fdf93']); sfx.chime(); }
    if (o.healLowest) { const low = party.reduce((a, b) => (a.hp / R.maxHpOf(a) < b.hp / R.maxHpOf(b) ? a : b)); low.hp = Math.min(R.maxHpOf(low), low.hp + o.healLowest); lines.push([`${HEROES[low.id].name} heals ${o.healLowest}`, '#8fdf93']); sfx.chime(); }
    if (o.silver) { const amt = o.silver > 0 ? Math.round(o.silver * (R.hasRelic(run, 'r_coin') ? 1.5 : 1)) : o.silver; run.silver = Math.max(0, run.silver + amt); lines.push([`${amt > 0 ? '+' : ''}${amt} Silver`, '#c9d4d2']); sfx.coin(); }
    if (o.fate) { run.fate = Math.max(0, run.fate + o.fate); lines.push([`${o.fate > 0 ? '+' : ''}${o.fate} Fate`, HEX.amber]); }
    if (o.cure) { party.forEach((x) => { x.flaw = null; }); lines.push(['Every Flaw is cured', HEX.amberHot]); }
    if (o.take) { const i = run.consumables.indexOf(o.take); if (i >= 0) { run.consumables.splice(i, 1); lines.push([`Used your ${itemById(o.take).name}`, HEX.boneDim]); } }
    if (o.give) { if (run.consumables.length < R.satchelCap(run)) { run.consumables.push(o.give); lines.push([`Gained ${itemById(o.give).name}`, HEX.amber]); } else lines.push(['Your satchel is full.', HEX.boneDim]); }
    if (o.flag) run.flags[o.flag] = true;
    R.chronicle(run, `${this.ev?.title ?? 'A curio'}: ${op.label.toLowerCase()}${heroId ? ` (${HEROES[heroId].name})` : ''}.`);
    this.drawStrip();
    this.clearRight();
    this.title(this.ev.title);
    const t = this.body(prefix + this.fill(o.text, heroId));
    let y = 226 + t.fullHeight + 26;
    lines.forEach(([txt, col], i) => {
      const l = this.add.text(RX, y, `◆ ${txt}`, { fontFamily: FONT_H, fontSize: '17px', color: col, fontStyle: '700' }).setAlpha(0);
      this.tweens.add({ targets: l, alpha: 1, x: RX + 6, duration: 300, delay: 500 + i * 160 });
      this.right.add(l);
      y += 32;
    });
    const go = () => {
      const after = () => {
        if (o.talent) showTalentChoice(this, run, { heroId: heroId && o.talent === true && this.ev.options.some((x) => x.only === heroId) ? heroId : null, title: 'Insight', subtitle: 'Something learned in the dark. Choose a Talent.', onDone: () => this.leave() });
        else this.leave();
      };
      if (o.loot) {
        const kinds = o.loot === 'consumable' ? ['consumable'] : o.loot === 'relic' ? ['relic'] : ['weapon', 'charm', 'relic', 'consumable'];
        const ids = R.rollLoot(run, R.runRng(run), { count: 3, kinds, minRarity: o.loot === 'relic' ? 'relic' : null, only: o.lootRarity ?? null });
        showLootChoice(this, run, ids, { title: 'Found', onDone: after });
      } else if (o.offer) {
        showLootChoice(this, run, [o.offer], { title: 'A Gift', subtitle: 'Take it?', skipSilver: 0, onDone: after });
      } else after();
    };
    this.right.add(makeButton(this, RX + 130, Math.max(y + 46, 560), 260, 52, o.loot || o.offer ? 'Claim it' : o.talent ? 'Reflect' : 'Continue', go, { size: 16 }));
  }

  // ---------- dice ----------
  rollDie(label, mod, dc, mode = 0, raw = false, forced = null) {
    return new Promise(async (resolve) => {
      const c = this.add.container(this.artX, this.artY).setDepth(60);
      const bg = this.add.rectangle(0, 0, 330, 270, 0x050b0c, 0.94).setStrokeStyle(2, C.amber);
      const lab = this.add.text(0, -112, label, { fontFamily: FONT_H, fontSize: '15px', color: HEX.bone, fontStyle: '700' }).setOrigin(0.5);
      const g = this.add.graphics();
      const pts = [];
      for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; pts.push({ x: Math.cos(a) * 54, y: Math.sin(a) * 54 }); }
      g.fillStyle(0x14282a, 1); g.fillPoints(pts, true); g.lineStyle(3, C.amber, 1); g.strokePoints(pts, true);
      const die = this.add.container(0, -12, [g]);
      const num = this.add.text(0, -10, '', { fontFamily: FONT_H, fontSize: '44px', color: HEX.bone, fontStyle: '900' }).setOrigin(0.5);
      const f = this.add.text(0, 68, '', { fontFamily: FONT_B, fontSize: '17px', color: HEX.bone }).setOrigin(0.5);
      const r = this.add.text(0, 100, '', { fontFamily: FONT_H, fontSize: '24px', color: HEX.amber, fontStyle: '900' }).setOrigin(0.5);
      c.add([bg, lab, die, num, f, r]);
      sfx.dice();
      for (let i = 0; i < 12; i++) { num.setText(String(1 + Math.floor(Math.random() * 20))); die.angle = (Math.random() - 0.5) * 60; await new Promise((ok) => this.time.delayedCall(48, ok)); }
      die.angle = 0;
      const roll = R.rollD20(Math.random, mode);
      if (forced) { roll.kept = forced; roll.rolls = [forced]; }
      const nat = roll.kept;
      const total = nat + mod;
      const ok = raw ? true : nat === 20 || (nat !== 1 && total >= dc);
      num.setText(String(nat)).setColor(nat === 20 ? HEX.amberHot : nat === 1 ? HEX.red : HEX.bone);
      sfx.land();
      this.tweens.add({ targets: [die, num], scale: 1.25, duration: 110, yoyo: true });
      if (!raw) {
        f.setText(`${roll.rolls.length > 1 ? `(${roll.rolls.join(' / ')}) ` : ''}${nat} ${mod >= 0 ? '+' : '−'} ${Math.abs(mod)} = ${total}   vs DC ${dc}`);
        r.setText(nat === 20 ? '★ TRIUMPH!' : nat === 1 ? '✗ DISASTER' : ok ? '✓ SUCCESS' : '✗ FAILURE').setColor(ok ? '#8fdf93' : HEX.red);
        if (ok) sfx.resolve(); else sfx.fumble();
      }
      await new Promise((ok2) => this.time.delayedCall(raw ? 900 : 1300, ok2));
      this.tweens.add({ targets: c, alpha: 0, duration: 250, onComplete: () => c.destroy() });
      resolve({ ok, nat, total });
    });
  }
  ask(q) {
    return new Promise((resolve) => {
      const c = this.add.container(this.artX, this.artY + 196).setDepth(70);
      const bg = this.add.rectangle(0, 0, 330, 100, 0x0a1416, 0.98).setStrokeStyle(2, C.amber);
      const t = this.add.text(0, -26, q, { fontFamily: FONT_B, fontSize: '14px', color: HEX.bone, fontStyle: 'italic', align: 'center', wordWrap: { width: 300 } }).setOrigin(0.5);
      const done = (v) => { c.destroy(); resolve(v); };
      c.add([bg, t, makeButton(this, -72, 24, 130, 40, 'Burn Fate', () => done(true), { size: 13, fill: 0x2a1c0c, stroke: C.amber }), makeButton(this, 72, 24, 130, 40, 'Accept', () => done(false), { size: 13 })]);
    });
  }

  // ---------- sanctuary ----------
  showRest() {
    const run = this.run;
    this.clearRight();
    this.title('Sanctuary', 'A dry room. One working candle. Choose how to spend the night.');
    this.body('The door holds. For a few hours the only water is the sound of it, somewhere far away, and the candle does not flicker once.');
    const cureAll = (run.meta?.chapel ?? 0) >= 2;
    const party = R.partyHeroes(run);
    const opts = [
      { label: 'Tend wounds', sub: 'All heroes heal 40% of max HP', fx: () => { party.forEach((h) => { h.hp = Math.min(R.maxHpOf(h), h.hp + Math.ceil(R.maxHpOf(h) * 0.4)); }); return 'Bandages, needle, the last of the clean water. You will live.'; } },
      { label: 'Keep vigil', sub: 'All heroes lose 40 Dread', fx: () => { party.forEach((h) => { h.dread = Math.max(0, h.dread - 40); }); return 'You take turns watching the candle. Nothing comes. That is its own kind of mercy.'; } },
      { label: 'Pray at the shrine', sub: '+1 Fate and cure every Flaw', fx: () => { run.fate++; party.forEach((h) => { h.flaw = null; }); return 'Whatever is listening, it is not the lake.'; } },
      { label: 'Train by candlelight', sub: 'One hero learns a Talent', train: true },
    ];
    opts.forEach((o, i) => {
      const b = makeButton(this, RX + RW / 2, 372 + i * 72, RW, 60, o.label, () => {
        if (this.choosing) return; this.choosing = true;
        sfx.resolve();
        if (cureAll) party.forEach((h) => { h.flaw = null; });
        if (o.train) { showTalentChoice(this, run, { title: 'Training', subtitle: 'An hour of practice by the candle. Choose a Talent.', onDone: () => this.leave() }); return; }
        const msg = o.fx();
        this.drawStrip();
        this.clearRight();
        this.title('Sanctuary');
        this.body(msg);
        this.right.add(makeButton(this, RX + 130, 420, 260, 52, 'Continue', () => this.leave(), { size: 16 }));
      }, { size: 17, sub: o.sub + (cureAll && !o.train && i < 2 ? ' · also cures Flaws' : '') });
      this.right.add(b);
    });
  }

  // ---------- ferryman ----------
  showShop() {
    const run = this.run;
    if (!this.stock) {
      const rng = R.runRng(run);
      this.stock = [
        ...R.rollLoot(run, rng, { count: 2, kinds: ['weapon', 'charm'], guaranteeBlessed: false }),
        ...R.rollLoot(run, rng, { count: 1, kinds: ['relic'], minRarity: 'blessed' }),
        ...R.rollLoot(run, rng, { count: 2, kinds: ['consumable'] }),
      ].map((id) => ({ id, sold: false }));
    }
    this.clearRight();
    this.title('The Ferryman', '"Silver for the crossing. Silver for the things I fished out of it."');
    this.stock.forEach((st, i) => {
      const it = itemById(st.id);
      const price = R.itemPrice(it);
      const x = 560 + (i % 3) * 230, y = i < 3 ? 354 : 594;
      const card = makeItemCard(this, x, y, it, RARITY[it.rarity], {
        w: 210, h: i < 3 ? 226 : 206,
        foot: st.sold ? 'SOLD' : `${price} silver${run.silver < price ? ' (not enough)' : ''}`,
        disabled: () => st.sold || run.silver < price,
        onPick: () => this.buy(st, it, price),
      });
      if (st.sold) card.setAlpha(0.35);
      this.right.add(card);
    });
    const sx = 1020;
    const party = R.partyHeroes(run);
    const services = [
      { label: 'Burn incense', sub: 'All heroes −25 Dread · 15 silver', cost: 15, fx: () => party.forEach((h) => { h.dread = Math.max(0, h.dread - 25); }) },
      { label: 'Stitch wounds', sub: 'All heroes heal 10 · 15 silver', cost: 15, fx: () => party.forEach((h) => { h.hp = Math.min(R.maxHpOf(h), h.hp + 10); }) },
    ];
    services.forEach((sv, i) => {
      const b = makeButton(this, sx, 540 + i * 62, 260, 52, sv.label, () => {
        if (run.silver < sv.cost) { sfx.denied(); return; }
        run.silver -= sv.cost; sv.fx(); sfx.coin(); sfx.chime(); this.drawStrip(); this.showShop();
      }, { size: 14, sub: sv.sub });
      this.right.add(b);
    });
    this.right.add(makeButton(this, sx, 666, 260, 44, 'Leave the Ferryman', () => this.leave(), { size: 14 }));
  }
  buy(st, it, price) {
    const run = this.run;
    if (st.sold || run.silver < price) { sfx.denied(); return; }
    if (it.slot === 'consumable' && run.consumables.length >= R.satchelCap(run)) { sfx.denied(); return; }
    if (it.slot === 'charm') {
      run.silver -= price; st.sold = true; sfx.coin();
      showLootChoice(this, run, [it.id], { title: 'Purchased', subtitle: 'Click it, then choose who wears it.', skipSilver: 0, onDone: (got) => { if (!got) { run.silver += price; st.sold = false; } this.drawStrip(); this.showShop(); } });
      return;
    }
    run.silver -= price; st.sold = true;
    R.equipItem(run, it.id);
    sfx.coin(); sfx.loot(it.rarity);
    this.drawStrip();
    this.showShop();
  }

  // ---------- treasure ----------
  showTreasure() {
    const run = this.run;
    this.clearRight();
    this.title('Reliquary Vault', 'Unguarded. Probably.');
    this.body('Rows of drowned reliquaries, seals still intact. Whoever filled this vault expected to come back for it.');
    const amt = Math.round(20 * (R.hasRelic(run, 'r_coin') ? 1.5 : 1));
    this.right.add(makeButton(this, RX + 180, 430, 360, 60, 'Break the seals', () => {
      if (this.choosing) return; this.choosing = true;
      run.silver += amt; sfx.chest(); this.drawStrip();
      const ids = R.rollLoot(run, R.runRng(run), { count: 3, minRarity: 'blessed' });
      showLootChoice(this, run, ids, { title: 'The Vault', subtitle: `+${amt} silver. Choose one treasure.`, onDone: () => this.leave() });
    }, { size: 17, sub: `+${amt} silver and a Blessed-or-better treasure` }));
  }

  leave() {
    this.cameras.main.fadeOut(400, 5, 11, 12);
    this.time.delayedCall(420, () => this.scene.start('map'));
  }
}
