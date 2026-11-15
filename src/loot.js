// Pick-one-of-N overlays: loot (battles, chests, events, vaults) and talents (elites, sanctuaries).
import { RARITY, HEROES, TALENTS, itemById } from './data.js';
import { equipItem, satchelCap, partyHeroes, talentChoices, learnTalent, runRng } from './rules.js';
import { makeItemCard, makeCardBack, makeButton, FONT_H, FONT_B, HEX, C } from './ui.js';
import { unitKey } from './sprites.js';
import { sfx } from './audio.js';

function compareText(run, it) {
  if (it.slot === 'relic') return 'Applies to the whole party.';
  if (it.slot === 'consumable') return `Satchel ${run.consumables.length}/${satchelCap(run)}`;
  if (it.slot === 'weapon') {
    const h = run.heroes.find((x) => x.id === it.hero);
    const cur = h.weapon && itemById(h.weapon);
    return `For ${HEROES[it.hero].name} · ${cur ? `replaces ${cur.name}` : 'empty slot'}`;
  }
  return 'Charm · you choose who wears it';
}

function overlay(scene, depth, title, subtitle) {
  const W = scene.scale.width, H = scene.scale.height;
  const root = scene.add.container(0, 0).setDepth(depth);
  const dim = scene.add.rectangle(W / 2, H / 2, W, H, 0x020607, 0.9).setInteractive();
  const t1 = scene.add.text(W / 2, 86, title, { fontFamily: FONT_H, fontSize: '40px', color: HEX.amber, fontStyle: '900' }).setOrigin(0.5);
  const t2 = scene.add.text(W / 2, 130, subtitle, { fontFamily: FONT_B, fontSize: '18px', color: HEX.boneDim, fontStyle: 'italic' }).setOrigin(0.5);
  root.add([dim, t1, t2]);
  dim.alpha = 0; t1.alpha = 0; t2.alpha = 0;
  scene.tweens.add({ targets: dim, alpha: 1, duration: 260 });
  scene.tweens.add({ targets: [t1, t2], alpha: 1, duration: 400, delay: 150 });
  return root;
}

export function showLootChoice(scene, run, ids, { title = 'Spoils', subtitle = 'Choose one.', skipSilver = 8, onDone, depth = 300 } = {}) {
  const W = scene.scale.width, H = scene.scale.height;
  const root = overlay(scene, depth, title, subtitle);
  const items = ids.map(itemById).filter(Boolean);
  const gap = 244;
  const x0 = W / 2 - ((items.length - 1) * gap) / 2;
  const cards = [];
  let done = false;

  const finish = (picked) => {
    if (done) return;
    done = true;
    cards.forEach((c) => { c.locked = true; });
    cards.forEach((c, i) => {
      if (c === picked) {
        scene.tweens.add({ targets: c, scale: 1.12, y: c.y - 20, duration: 260, ease: 'Back.Out' });
        scene.tweens.add({ targets: c, alpha: 0, duration: 300, delay: 700 });
      } else scene.tweens.add({ targets: c, y: c.y + 80, alpha: 0, duration: 300, delay: i * 40 });
    });
    scene.tweens.add({ targets: root, alpha: 0, duration: 300, delay: 950, onComplete: () => { root.destroy(); onDone?.(picked?.item ?? null); } });
  };
  const burst = (card) => {
    const col = RARITY[card.item.rarity].color;
    const em = scene.add.particles(card.x, card.y, 'spark', {
      speed: { min: 120, max: 420 }, lifespan: { min: 400, max: 900 }, scale: { start: 1.6, end: 0 },
      tint: [col, 0xffffff], blendMode: 'ADD', emitting: false,
    }).setDepth(depth + 5);
    em.explode(60);
    scene.time.delayedCall(1200, () => em.destroy());
    scene.cameras.main.shake(140, 0.004);
  };
  const flash = (msg) => {
    const t = scene.add.text(W / 2, H - 100, msg, { fontFamily: FONT_B, fontSize: '18px', color: HEX.red, fontStyle: 'italic' }).setOrigin(0.5).setDepth(depth + 10);
    scene.tweens.add({ targets: t, alpha: 0, delay: 1300, duration: 400, onComplete: () => t.destroy() });
  };
  let skip;
  const chooseHero = (it, card) => {
    cards.forEach((c) => { c.locked = true; });
    skip.setVisible(false);
    const pick = scene.add.container(W / 2, H - 76);
    const bg = scene.add.rectangle(0, 0, 940, 110, 0x0b1517, 0.98).setStrokeStyle(2, C.amber);
    const label = scene.add.text(0, -36, `Who wears the ${it.name}?`, { fontFamily: FONT_H, fontSize: '18px', color: HEX.bone }).setOrigin(0.5);
    pick.add([bg, label]);
    partyHeroes(run).forEach((h, i, arr) => {
      const cur = h.charm ? itemById(h.charm).name : 'nothing';
      const b = makeButton(scene, (i - (arr.length - 1) / 2) * 300, 16, 280, 52, HEROES[h.id].name, () => {
        equipItem(run, it.id, h.id);
        sfx.loot(it.rarity); sfx.equip();
        burst(card);
        pick.destroy();
        finish(card);
      }, { sub: `currently wears ${cur}` });
      pick.add(b);
    });
    pick.add(makeButton(scene, 430, -36, 70, 30, 'Back', () => { pick.destroy(); skip.setVisible(true); cards.forEach((c) => { c.locked = false; }); }, { size: 12 }));
    root.add(pick);
  };
  const take = (card) => {
    const it = card.item;
    if (it.slot === 'consumable' && run.consumables.length >= satchelCap(run)) { sfx.denied(); flash('Your satchel is full.'); return; }
    if (it.slot === 'charm') { chooseHero(it, card); return; }
    equipItem(run, it.id);
    sfx.loot(it.rarity);
    burst(card);
    finish(card);
  };
  items.forEach((it, i) => {
    const x = x0 + i * gap, y = H / 2 + 34;
    const card = makeItemCard(scene, x, y, it, RARITY[it.rarity], { foot: compareText(run, it), onPick: (c) => take(c) });
    card.item = it;
    card.locked = true; card.setVisible(false);
    // dealt face down, then each card turns over in turn with a flash in its rarity colour
    const back = makeCardBack(scene, x, y - 60, { color: RARITY[it.rarity].color });
    back.alpha = 0;
    root.add([back, card]);
    const t0 = 250 + i * 170;
    scene.tweens.add({ targets: back, y, alpha: 1, duration: 260, delay: t0, ease: 'Quad.Out', onStart: () => sfx.page() });
    scene.tweens.add({ targets: back, scaleX: 0, duration: 140, delay: t0 + 480 + i * 80, ease: 'Quad.In', onComplete: () => {
      back.destroy();
      card.setVisible(true); card.scaleX = 0;
      scene.tweens.add({ targets: card, scaleX: 1, duration: 180, ease: 'Back.Out', onComplete: () => { if (!done) card.locked = false; } });
      const fl = scene.add.rectangle(x, y, card.cardW, card.cardH, RARITY[it.rarity].color, 0.6).setBlendMode('ADD').setDepth(depth + 4);
      scene.tweens.add({ targets: fl, alpha: 0, duration: 380, onComplete: () => fl.destroy() });
      if (it.rarity === 'relic' || it.rarity === 'cursed') { sfx.loot(it.rarity); scene.cameras.main.shake(120, 0.003); } else sfx.coin();
    } });
    cards.push(card);
  });
  skip = makeButton(scene, W / 2, H - 46, 260, 44, skipSilver ? `Take nothing (+${skipSilver} Silver)` : 'Take nothing', () => {
    run.silver += skipSilver;
    if (skipSilver) sfx.coin();
    finish(null);
  }, { size: 14 });
  root.add(skip);
  return root;
}

// Each hero is offered talents; the player picks ONE across the whole party.
export function showTalentChoice(scene, run, { title = 'A Lesson Learned', subtitle = 'Choose one Talent.', onDone, depth = 300, heroId = null } = {}) {
  const W = scene.scale.width, H = scene.scale.height;
  const root = overlay(scene, depth, title, subtitle);
  const rng = runRng(run);
  const per = (run.meta?.yard ?? 0) >= 2 ? 3 : 2;
  const heroes = partyHeroes(run).filter((h) => !heroId || h.id === heroId);
  const cols = heroes.map((h) => ({ h, options: talentChoices(run, h.id, rng, heroId ? 3 : per) })).filter((c) => c.options.length);
  if (!cols.length) { root.destroy(); onDone?.(null); return null; }
  const colW = 300;
  const x0 = W / 2 - ((cols.length - 1) * colW) / 2;
  let done = false;
  cols.forEach((col, i) => {
    const x = x0 + i * colW;
    const head = scene.add.container(x, 196);
    const g = scene.add.image(0, 26, unitKey(col.h.id)).setOrigin(0.5, 1).setScale(0.9);
    head.add([scene.add.circle(0, 0, 28, 0x16211f).setStrokeStyle(2, C.amber), g]);
    root.add(head);
    root.add(scene.add.text(x, 238, `${HEROES[col.h.id].name} the ${HEROES[col.h.id].cls}`, { fontFamily: FONT_H, fontSize: '16px', color: HEX.bone, fontStyle: '700' }).setOrigin(0.5));
    col.options.forEach((t, j) => {
      const b = makeButton(scene, x, 310 + j * 104, 270, 92, t.name, () => {
        if (done) return; done = true;
        learnTalent(run, col.h.id, t.id);
        sfx.resolve(); sfx.loot('relic');
        scene.cameras.main.flash(220, 232, 163, 61);
        scene.tweens.add({ targets: root, alpha: 0, duration: 300, delay: 300, onComplete: () => { root.destroy(); onDone?.(t); } });
      }, { size: 16, sub: '' });
      const desc = scene.add.text(0, 14, t.text, { fontFamily: FONT_B, fontSize: '13px', color: HEX.boneDim, align: 'center', wordWrap: { width: 240 } }).setOrigin(0.5, 0);
      b.list[1].y = -24;
      b.add(desc);
      b.alpha = 0;
      scene.tweens.add({ targets: b, alpha: 1, duration: 300, delay: 200 + i * 120 + j * 80 });
      root.add(b);
    });
  });
  root.add(makeButton(scene, W / 2, H - 46, 220, 42, 'Skip', () => { if (done) return; done = true; root.destroy(); onDone?.(null); }, { size: 14 }));
  return root;
}
void TALENTS;
