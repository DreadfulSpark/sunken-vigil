// Dev-only playtest harness. Load in the console with: await import('/tests/harness.js')
// Drives the game on a deterministic fake clock so it can be tested while the page is hidden.
import * as R from '/src/rules.js';

const W = window;
W.errs = [];
W.addEventListener('error', (e) => W.errs.push(e.message));
W.addEventListener('unhandledrejection', (e) => W.errs.push(String(e.reason?.stack || e.reason)));
const origErr = console.error;
console.error = (...a) => { W.errs.push(a.map(String).join(' ')); origErr(...a); };

if (!W.__realNow) { W.__realNow = Date.now.bind(Date); W.__off = 0; Date.now = () => W.__realNow() + W.__off; }
game.loop.sleep();
W.__t = Math.max(W.__t || 0, performance.now());
W.adv = (ms) => { const n = Math.ceil(ms / 16.67); for (let i = 0; i < n; i++) { W.__t += 16.67; W.__off += 16.67; game.step(W.__t, 16.67); } };
W.tick = async (ms) => { for (let t = 0; t < ms; t += 50) { W.adv(50); await new Promise((r) => setTimeout(r, 0)); } };
W.key = (k, code, kc) => {
  for (const type of ['keydown', 'keyup']) {
    const e = new KeyboardEvent(type, { key: k, code: code || k, bubbles: true });
    const c = kc ?? ({ Enter: 13, ' ': 32, Escape: 27 }[k] || 0);
    Object.defineProperty(e, 'keyCode', { get: () => c });
    Object.defineProperty(e, 'which', { get: () => c });
    W.dispatchEvent(e);
  }
};
W.active = () => game.scene.getScenes(true).map((s) => s.sys.settings.key);
W.S = (k) => game.scene.getScene(k);
W.B = () => game.scene.getScene('battle');
W.st = () => { const b = W.B(); return { modal: b.modal, busy: b.busy, phase: b.s.phase, round: b.s.round, units: b.s.units.map((u) => `${u.id}@${u.x},${u.y} hp${u.hp}${u.dead ? ' DEAD' : ''}`) }; };

// Pick the first loot card (or skip) on any open loot overlay.
W.pickLoot = async (scene) => {
  const root = scene.children.list.find((o) => o.type === 'Container' && o.depth === 300);
  if (!root) return false;
  const cards = root.list.filter((o) => o.item);
  if (!cards.length) { // talent overlay: click the first talent button
    const btn = root.list.find((o) => o.type === 'Container' && o.zone && !o.list.some((x) => x.text === 'Skip'));
    btn?.zone.emit('pointerdown'); await W.tick(800); return true;
  }
  const card = cards.find((c) => c.item.slot !== 'consumable') || cards[0];
  if (card) { card.list.find((o) => o.type === 'Zone').emit('pointerdown'); await W.tick(200); }
  // charm → hero picker
  const picker = root.list.find((o) => o.type === 'Container' && o.list?.some((x) => x.type === 'Container' && x.list?.some((y) => y.type === 'Zone')) && !o.item);
  if (picker) { const btn = picker.list.find((x) => x.type === 'Container' && x.zone); btn?.zone.emit('pointerdown'); }
  await W.tick(1500);
  return true;
};

W.autoRing = async () => {
  const b = W.B();
  const r = b.children.list.find((o) => o.type === 'Text' && o.text === 'REACT!' && !o.__seen);
  if (!r) return;
  r.__seen = true;
  await W.tick(Math.round(1200 + (Math.random() * 300 - 150)));
  W.key(' ', 'Space', 32);
};
W.battleIdle = async (max = 60000) => {
  for (let t = 0; t < max; t += 50) {
    await W.tick(50);
    if (!game.scene.isActive('battle')) return 'left';
    const b = W.B();
    await W.autoRing();
    if (b.over) { if (await W.pickLoot(b)) continue; continue; }
    // fate prompt: accept half the time
    const fate = b.children.list.find((o) => o.type === 'Container' && o.depth === 82);
    if (fate) { W.key(Math.random() < 0.5 ? 'F' : 'Enter', Math.random() < 0.5 ? 'KeyF' : 'Enter', Math.random() < 0.5 ? 70 : 13); }
    if (!b.busy && !b.modal && b.s.phase === 'party') return 'idle';
  }
  return 'timeout';
};
W.heroTurn = async (u) => {
  const b = W.B();
  if (u.dead || b.over) return;
  b.trySelect(u); await W.tick(100);
  const s = b.s;
  const atk = u.skills.find((id) => ['attack', 'shove'].includes(R.SKILLS[id].kind));
  const support = u.skills.find((id) => ['toll', 'chime', 'mark'].includes(R.SKILLS[id].kind));
  const tryAct = async (id) => {
    if (!id || u.acted) return false;
    const ts = R.skillTargets(s, u, id);
    if (!ts.length) return false;
    b.chooseAction(id); await W.tick(60);
    if (u.acted) { await W.battleIdle(); return true; }
    b.onTile(ts[0].x, ts[0].y); await W.battleIdle();
    return true;
  };
  // use signature abilities when they would matter
  const ready = (id) => u.skills.includes(id) && R.skillTargets(s, u, id).length;
  if (ready('chain') && await tryAct('chain')) return;
  if (ready('stand') && R.alive(s, 'enemy').filter((e) => R.cheb(e, u) <= 1).length >= 2 && await tryAct('stand')) return;
  if (ready('hour') && await tryAct('hour')) return;
  if (await tryAct(atk)) return;
  if (!u.moved) {
    b.chooseAction('move'); await W.tick(40);
    const reach = R.reachable(s, u);
    const foes = R.alive(s, 'enemy');
    let best = null;
    for (const [k] of reach.dist) {
      const x = k % s.w, y = Math.floor(k / s.w);
      if (!R.canStop(s, u, x, y) || (x === u.x && y === u.y)) continue;
      const d = Math.min(...foes.map((e) => Math.max(Math.abs(e.x - x), Math.abs(e.y - y))));
      if (!best || d < best.d) best = { x, y, d };
    }
    if (best) { b.onTile(best.x, best.y); await W.battleIdle(); }
  }
  if (await tryAct(atk)) return;
  if (Math.random() < 0.6) await tryAct(support);
};
W.playBattle = async (maxRounds = 25) => {
  await W.battleIdle();
  for (let r = 0; r < maxRounds; r++) {
    if (!game.scene.isActive('battle') || W.B().over) break;
    for (const u of W.B().s.units.filter((x) => x.side === 'hero' && !x.dead)) { await W.heroTurn(u); if (!game.scene.isActive('battle') || W.B().over) break; }
    if (!game.scene.isActive('battle') || W.B().over) break;
    W.B().endPartyPhase();
    const res = await W.battleIdle(90000);
    if (res !== 'idle') break;
  }
  for (let i = 0; i < 200 && game.scene.isActive('battle'); i++) { await W.tick(100); if (W.B().over) await W.pickLoot(W.B()); }
  return W.active();
};
W.playEvent = async () => {
  const e = W.S('event');
  await W.tick(800);
  if (e.kind === 'event') {
    const op = e.ev.options.find((o) => !o.needItem && !o.costSilver && !o.gamble && (!o.only || e.run.heroes.some((h) => h.id === o.only && !h.lost))) ?? e.ev.options[e.ev.options.length - 1];
    e.choose(op); await W.tick(300);
    const picker = e.children.list.find((o) => o.type === 'Container' && o.depth === 80);
    if (picker) { picker.list.find((x) => x.zone)?.zone.emit('pointerdown'); }
    for (let i = 0; i < 80; i++) { await W.tick(50); const a = e.children.list.find((o) => o.type === 'Container' && o.depth === 70); if (a) { a.list.filter((o) => o.zone).pop().zone.emit('pointerdown'); } if (e.right.list.some((o) => o.zone && o.list.some((x) => ['Continue', 'Claim it', 'Reflect'].includes(x.text)))) break; }
  }
  if (e.kind === 'rest') { const b = e.right.list.find((o) => o.zone); b.zone.emit('pointerdown'); await W.tick(500); }
  if (e.kind === 'shop') { const st = e.stock.find((x) => { const it = R.itemById(x.id); return it.slot !== 'charm' && R.itemPrice(it) <= e.run.silver; }); if (st) { const it = R.itemById(st.id); e.buy(st, it, R.itemPrice(it)); } await W.tick(500); e.leave(); }
  if (e.kind === 'treasure') { const b = e.right.list.find((o) => o.zone); b.zone.emit('pointerdown'); await W.tick(1500); await W.pickLoot(e); }
  if (e.kind === 'event' || e.kind === 'rest') {
    const loot = e.right.list.filter((o) => o.zone).pop();
    loot?.zone.emit('pointerdown'); await W.tick(800);
    await W.pickLoot(e); await W.tick(400); await W.pickLoot(e);
  }
  for (let i = 0; i < 40 && game.scene.isActive('event'); i++) await W.tick(100);
  return W.active();
};
W.stepRun = async () => {
  const a = W.active();
  if (a.includes('map')) { const m = W.S('map'); const run = game.registry.get('run'); const n = R.availableNodes(run)[0]; m.enter(n); await W.tick(1200); return `enter ${n.type}`; }
  if (a.includes('battle')) { await W.playBattle(); return 'battle done'; }
  if (a.includes('event')) { await W.playEvent(); return 'event done'; }
  return `stuck in ${a}`;
};
export default true;
