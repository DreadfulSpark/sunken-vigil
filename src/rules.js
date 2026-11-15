// Pure game rules for The Sunken Vigil. No Phaser in here: scenes read this state,
// draw it, and call these helpers to resolve actions.
import { HEROES, SKILLS, ENEMIES, ITEMS, RARITY, ROOMS, ENCOUNTERS, COMBAT_ROOMS, EVENTS, TALENTS, itemById, talentById } from './data.js';

export { SKILLS, HEROES, ENEMIES, itemById, talentById };

export const LIGHT = { DARK: 0, DIM: 1, BRIGHT: 2 };
export const BRAZIER_RADIUS = 3;
export const LANTERN_RADIUS = 2;
export const DREAD_SAVE_DC = 14;
export const HERO_ORDER = ['warden', 'scholar', 'ringer'];
export const PARRY_PERFECT = 120; // ms either side of the moment the rings meet
export const PARRY_GRAZE = 260;

// ---------- randomness ----------
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const die = (rng, sides) => 1 + Math.floor(rng() * sides);
export const pickOne = (rng, arr) => arr[Math.floor(rng() * arr.length)];
export function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export function rollD20(rng, mode = 0) {
  const a = die(rng, 20);
  if (mode === 0) return { rolls: [a], kept: a, mode };
  const b = die(rng, 20);
  return { rolls: [a, b], kept: mode > 0 ? Math.max(a, b) : Math.min(a, b), mode };
}
export function parseDice(spec) {
  const m = /^(\d+)d(\d+)([+-]\d+)?$/.exec(spec);
  return { n: +m[1], s: +m[2], b: m[3] ? +m[3] : 0 };
}
export function rollDice(rng, spec, critMul = 1, bonus = 0) {
  const p = parseDice(spec);
  const rolls = [];
  for (let i = 0; i < p.n * critMul; i++) rolls.push(die(rng, p.s));
  return { rolls, total: Math.max(1, rolls.reduce((s, v) => s + v, 0) + p.b + bonus) };
}
export function hitChance(bonus, dc, mode = 0, critOn = 20) {
  let p = 0;
  for (let r = 1; r <= 20; r++) if (r >= critOn || (r !== 1 && r + bonus >= dc)) p++;
  p /= 20;
  if (mode > 0) return 1 - (1 - p) * (1 - p);
  if (mode < 0) return p * p;
  return p;
}

// ---------- run ----------
export function heroMods(h) {
  const m = {};
  const add = (mods) => { for (const [k, v] of Object.entries(mods ?? {})) m[k] = (m[k] ?? 0) + v; };
  for (const id of [h.weapon, h.charm]) add(id && itemById(id)?.mods);
  for (const id of h.talents ?? []) add(talentById(id)?.mods);
  if (h.flaw === 'haunted') m.dreadMul = (m.dreadMul ?? 0) + 0.5;
  return m;
}
export const hasRelic = (run, id) => run.relics.includes(id);

// ---------- Resonances: gear that shares a theme strengthens the whole party ----------
export const RESONANCES = {
  drown: { name: 'Undertow', color: 0x6fc2b5, hex: '#6fc2b5', tiers: [
    { n: 2, mods: { slam: 2 }, text: 'Every hero: wall slams deal +2.' },
    { n: 3, mods: { shove: 1 }, text: 'Every hero: shoves go 1 tile further.' }] },
  mark: { name: 'Litany of Names', color: 0xffd27a, hex: '#ffd27a', tiers: [
    { n: 2, mods: { markDmg: 2 }, text: 'Every hero: +2 damage against Marked foes.' },
    { n: 3, mods: { atk: 1, markLong: 1 }, text: 'Every hero: +1 to hit, and Marks last a round longer.' }] },
  bell: { name: 'Carillon', color: 0xe0b070, hex: '#e0b070', tiers: [
    { n: 2, mods: { dazedVuln: 2 }, text: 'Dazed foes take +2 damage from every hero.' },
    { n: 3, mods: { saveBonus: 2, chimeBonus: 2, tollDc: 1 }, text: 'Every hero: +2 to Dread saves. Chime heals +2, Toll DC +1.' }] },
  dark: { name: 'Nightward', color: 0xb08ad0, hex: '#c8a0ff', tiers: [
    { n: 2, mods: { darkDmg: 2 }, text: 'Every hero: +2 damage to foes standing in darkness.' },
    { n: 3, mods: { darkSight: 1, dreadMul: -0.15 }, text: 'Every hero sees into darkness and gains 15% less Dread.' }] },
};
export function tagCounts(run) {
  const n = { drown: 0, mark: 0, bell: 0, dark: 0 };
  const ids = [...run.relics, ...run.heroes.filter((h) => !h.lost).flatMap((h) => [h.weapon, h.charm])];
  for (const id of ids) { const t = id && itemById(id)?.tag; if (t) n[t]++; }
  return n;
}
export function activeResonances(run) {
  const n = tagCounts(run), out = [];
  for (const [tag, r] of Object.entries(RESONANCES)) {
    const tiers = r.tiers.filter((t) => n[tag] >= t.n);
    if (tiers.length) out.push({ tag, name: r.name, hex: r.hex, count: n[tag], level: tiers.length, tiers });
  }
  return out;
}
export function resonanceMods(run) {
  const m = {};
  for (const a of activeResonances(run)) for (const t of a.tiers) for (const [k, v] of Object.entries(t.mods)) m[k] = (m[k] ?? 0) + v;
  return m;
}
export const maxHpOf = (h) => HEROES[h.id].hp + (heroMods(h).maxHp ?? 0) - (h.scars ?? 0) * 2;
export const satchelCap = (run) => 3 + (hasRelic(run, 'r_oilskin') ? 1 : 0) + ((run.meta?.reliquary ?? 0) >= 2 ? 1 : 0);
export const partyHeroes = (run) => run.heroes.filter((h) => !h.lost);

export function talentChoices(run, heroId, rng, count = 2) {
  const h = run.heroes.find((x) => x.id === heroId);
  const pool = TALENTS[heroId].filter((t) => !(h.talents ?? []).includes(t.id));
  return shuffle(rng, pool).slice(0, count);
}

export function createRun(meta = {}, seed = Date.now()) {
  const rng = mulberry32(seed);
  const up = meta.upgrades ?? meta ?? {};
  const heroes = HERO_ORDER.map((id) => ({
    id, hp: HEROES[id].hp, dread: up.chapel ? 0 : 10, flaw: null, weapon: null, charm: null,
    talents: [], scars: 0, falls: 0, lost: false,
  }));
  if (up.forge) {
    const give = (h, tier) => { const w = ITEMS.find((i) => i.slot === 'weapon' && i.hero === h.id && i.rarity === tier); if (w) h.weapon = w.id; };
    if (up.forge >= 3) heroes.forEach((h) => give(h, 'blessed'));
    give(pickOne(rng, heroes), up.forge >= 2 ? 'relic' : 'blessed');
  }
  if (up.yard) {
    for (const h of heroes) {
      const n = up.yard >= 3 ? 2 : 1;
      shuffle(rng, TALENTS[h.id]).slice(0, n).forEach((t) => h.talents.push(t.id));
    }
  }
  heroes.forEach((h) => { h.hp = maxHpOf(h); });
  const run = {
    seed, heroes, relics: [], consumables: ['c_bandage', 'c_salts'], silver: (up.reliquary ?? 0) >= 3 ? 50 : 0,
    fate: 3 + Math.min(3, up.lantern ?? 0), map: generateMap(rng), at: null, depth: 0, visited: [],
    stats: { kills: 0, crits: 0, parries: 0, drowned: 0, rooms: 0, loot: 0, fumbles: 0, elites: 0, falls: 0, lost: 0 },
    firstLoot: true, meta: up, rngState: Math.floor(rng() * 1e9), seenEvents: [], flags: {}, chronicle: [], lineSeen: {},
  };
  if ((up.reliquary ?? 0) >= 1) run.consumables.push('c_oil');
  if ((up.ossuary ?? 0) >= 3) run.relics.push(pickOne(rng, ITEMS.filter((i) => i.slot === 'relic' && i.rarity === 'relic')).id);
  return run;
}
export function runRng(run) {
  const rng = mulberry32(run.rngState);
  run.rngState = Math.floor(rng() * 1e9) + 1;
  return rng;
}
export function chronicle(run, text) { run.chronicle.push({ depth: run.depth, text }); }

const COLUMN_TYPES = [
  ['fight'],
  ['fight', 'event', 'fight'],
  ['fight', 'event', 'treasure'],
  ['rest', 'shop', 'event'],
  ['elite', 'fight', 'event'],
  ['fight', 'event', 'elite'],
  ['rest', 'shop'],
  ['boss'],
];
export function generateMap(rng) {
  const cols = COLUMN_TYPES.map((types, c) => {
    const n = types.length === 1 ? 1 : types.length === 2 ? 2 : (rng() < 0.5 ? 2 : 3);
    const picked = shuffle(rng, types).slice(0, n);
    if ((c === 1 || c === 5) && !picked.includes('fight')) picked[0] = 'fight';
    return picked.map((type, i) => ({
      id: `${c}-${i}`, col: c, lane: n === 1 ? 1 : n === 2 ? (i === 0 ? 0.5 : 1.5) : i,
      type, tier: c <= 2 ? 1 : c <= 4 ? 2 : 3, next: [],
    }));
  });
  for (let c = 0; c < cols.length - 1; c++) {
    const a = cols[c], b = cols[c + 1];
    for (const n of a) {
      n.next = b.filter((m) => Math.abs(m.lane - n.lane) <= 1).map((m) => m.id);
      if (!n.next.length) n.next = [b.reduce((best, m) => (Math.abs(m.lane - n.lane) < Math.abs(best.lane - n.lane) ? m : best)).id];
    }
    for (const m of b) {
      if (!a.some((n) => n.next.includes(m.id))) {
        const near = a.reduce((best, n) => (Math.abs(m.lane - n.lane) < Math.abs(best.lane - n.lane) ? n : best));
        near.next.push(m.id);
      }
    }
  }
  return cols.flat();
}
export const nodeById = (run, id) => run.map.find((n) => n.id === id);
export function availableNodes(run) {
  if (!run.at) return run.map.filter((n) => n.col === 0);
  return nodeById(run, run.at).next.map((id) => nodeById(run, id));
}

const RARITY_ORDER = ['worn', 'blessed', 'relic', 'cursed'];
export function rollLoot(run, rng, { count = 3, kinds = ['weapon', 'charm', 'relic', 'consumable'], minRarity = null, only = null, guaranteeBlessed = true } = {}) {
  const owned = new Set([...run.relics, ...run.heroes.flatMap((h) => [h.weapon, h.charm])]);
  const lost = new Set(run.heroes.filter((h) => h.lost).map((h) => h.id));
  const pool = ITEMS.filter((it) => kinds.includes(it.slot) && !owned.has(it.id) && !(it.hero && lost.has(it.hero)));
  // gentle steering: the theme you carry most is twice as likely to turn up (like Slay the Spire's card bias)
  const counts = tagCounts(run);
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const lean = top && top[1] > 0 ? top[0] : null;
  const out = [];
  let guard = 0;
  while (out.length < count && guard++ < 200) {
    let rarity;
    if (only) rarity = only;
    else {
      const total = RARITY_ORDER.reduce((s, r) => s + RARITY[r].weight, 0);
      let roll = rng() * total;
      rarity = RARITY_ORDER.find((r) => (roll -= RARITY[r].weight) < 0) ?? 'worn';
      if (minRarity && RARITY_ORDER.indexOf(rarity) < RARITY_ORDER.indexOf(minRarity)) rarity = minRarity;
      // every pick-of-three contains at least one Blessed-or-better item
      if (guaranteeBlessed && out.length === count - 1 && out.every((id) => itemById(id).rarity === 'worn') && rarity === 'worn') rarity = 'blessed';
    }
    const cands = pool.filter((it) => it.rarity === rarity && !out.includes(it.id));
    const fallback = pool.filter((it) => !out.includes(it.id));
    const pick = cands.length ? leanPick(rng, cands, lean) : fallback.length ? leanPick(rng, fallback, lean) : null;
    if (!pick) break;
    out.push(pick.id);
  }
  return out;
}
function leanPick(rng, list, lean) {
  if (!lean) return pickOne(rng, list);
  const w = list.map((it) => (it.tag === lean ? 2 : 1));
  let r = rng() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < list.length; i++) if ((r -= w[i]) < 0) return list[i];
  return list[list.length - 1];
}
export function itemPrice(it) {
  return { worn: 22, blessed: 40, relic: 65, cursed: 46 }[it.rarity] + (it.slot === 'consumable' ? -10 : 0);
}
export function equipItem(run, itemId, heroId) {
  const it = itemById(itemId);
  run.stats.loot++;
  if (it.slot === 'relic') { run.relics.push(itemId); return null; }
  if (it.slot === 'consumable') {
    if (run.consumables.length >= satchelCap(run)) return { full: true };
    run.consumables.push(itemId); return null;
  }
  const h = run.heroes.find((x) => x.id === (it.hero ?? heroId));
  const before = maxHpOf(h);
  const old = h[it.slot];
  h[it.slot] = itemId;
  const after = maxHpOf(h);
  h.hp = Math.max(1, Math.min(after, h.hp + Math.max(0, after - before)));
  return old ? { replaced: old } : null;
}
export function learnTalent(run, heroId, talentId) {
  const h = run.heroes.find((x) => x.id === heroId);
  const before = maxHpOf(h);
  h.talents = [...(h.talents ?? []), talentId];
  h.hp = Math.min(maxHpOf(h), h.hp + Math.max(0, maxHpOf(h) - before));
}
export function computeEmbers(run, won) {
  const s = run.stats;
  const parts = [
    ['Depth reached', run.depth * 8],
    ['Foes slain', s.kills * 2],
    ['Elites felled', s.elites * 10],
    ['Perfect parries', Math.floor(s.parries / 2)],
    ['Victory over the Bishop', won ? 100 : 0],
  ].filter(([, v]) => v > 0);
  return { parts, total: parts.reduce((a, [, v]) => a + v, 0) };
}

// ---------- battle ----------
function makeHeroUnit(run, h) {
  const def = HEROES[h.id];
  const m = heroMods(h);
  for (const [k, v] of Object.entries(resonanceMods(run))) m[k] = (m[k] ?? 0) + v;
  const flaw = h.flaw;
  return {
    id: h.id, side: 'hero', kind: h.id, name: def.name, cls: def.cls, x: 0, y: 0,
    hp: Math.max(1, h.hp), maxHp: maxHpOf(h),
    guard: def.guard + (m.guard ?? 0) + (flaw === 'reckless' ? -3 : 0),
    atk: def.atk + (m.atk ?? 0), move: def.move + (m.move ?? 0) + (flaw === 'reckless' ? 2 : 0),
    stats: def.stats, wis: def.stats.WIS, skills: def.skills, mods: m, swims: !!m.swimHero,
    critOn: 20 - (m.crit ?? 0), dread: h.dread, flaw,
    moved: false, acted: false, reaction: true, marked: 0, braced: false, resolve: false, virtue: null,
    dead: false, inDeep: false, attackedYet: false, dazed: 0, burning: 0, firstParryDone: false,
    cd: {}, taunting: false, bonus: true,
  };
}
export const AFFIXES = {
  emberborn: { name: 'Ember-born', text: 'When it dies it bursts into lamp-fire: 1d6 and Burning to everything adjacent (DEX save 13 halves).' },
  warded: { name: 'Warded', text: 'Starts the fight Warded: the first 10 damage it takes is absorbed.' },
  tidebound: { name: 'Tidebound', text: 'Heals 4 at the start of each turn it begins in water. Drive it onto dry stone.' },
  choirbound: { name: 'Choirbound', text: 'Ends each of its turns with a hymn: +6 Dread to every hero within 2.' },
  swift: { name: 'Swift', text: '+2 Move. It reaches you sooner than you think.' },
};
export const AFFIX_IDS = Object.keys(AFFIXES);
export function applyAffix(e, id) {
  e.affix = id;
  e.name = `${AFFIXES[id].name} ${e.name}`;
  e.silver = Math.round(e.silver * 1.5);
  if (id === 'warded') e.ward = (e.ward ?? 0) + 10;
  if (id === 'swift') e.move += 2;
}
function makeEnemyUnit(id, kind, x, y, tier) {
  const def = ENEMIES[kind];
  const t = def.boss ? 1 : tier;
  const hpMul = t >= 3 ? 1.5 : t === 2 ? 1.25 : 1;
  const hp = Math.round(def.hp * hpMul);
  return {
    id, side: 'enemy', kind, name: def.name, x, y,
    hp, maxHp: hp, guard: def.guard + (t >= 3 ? 1 : 0), atk: def.atk + (t >= 3 ? 2 : t === 2 ? 1 : 0), move: def.move,
    dmg: def.dmg, swims: !!def.swims, snuffs: !!def.snuffs, darkHunter: !!def.darkHunter,
    dreadOnHit: def.dreadOnHit ?? 0, ranged: def.ranged ?? 0, skittish: !!def.skittish, healer: !!def.healer,
    pulls: def.pulls ?? 0, shoves: def.shoves ?? 0, elite: !!def.elite, boss: !!def.boss, heavy: !!def.heavy,
    silver: def.silver ?? 5, critOn: 20, mods: {}, guardBuff: 0,
    marked: 0, dead: false, drowning: false, dazed: 0, burning: 0, turn: 0, enraged: false, inDeep: false,
    lampCd: 1, lampAim: null, ward: 0, waveAim: null, diveCd: 0,
  };
}

export function createBattle(run, { roomId, enemies, tier = 1, seed = Date.now(), flip = false, tutorial = false }) {
  const room = ROOMS[roomId];
  let rows = room.rows.map((r) => r.split(''));
  if (flip) rows = rows.reverse();
  const heroSpawns = [], enemySpawns = [];
  const braziers = [], chests = [];
  const moth = hasRelic(run, 'r_moth');
  rows.forEach((row, y) => row.forEach((ch, x) => {
    if (ch === 'H') { heroSpawns.push({ x, y }); row[x] = '.'; }
    if (ch === 'E') { enemySpawns.push({ x, y }); row[x] = '.'; }
    if (ch === 'B' || ch === 'b') { braziers.push({ x, y, lit: ch === 'B' && !moth }); row[x] = 'B'; }
    if (ch === 'C') { chests.push({ x, y, open: false }); row[x] = 'C'; }
  }));
  const s = {
    w: rows[0].length, h: rows.length, tiles: rows, braziers, chests, units: [], roomId, roomName: room.name, props: room.props,
    lantern: { carrier: 'scholar', x: 0, y: 0 }, round: 1, phase: 'party', push: false, flare: false,
    rng: mulberry32(seed), run, tier, tutorial, hourglassUsed: false, summons: 0, flooded: false,
  };
  const heroes = partyHeroes(run).filter((h) => !(tutorial && h.id === 'ringer'));
  const order = tutorial ? ['scholar', 'warden'] : HERO_ORDER.filter((id) => heroes.some((h) => h.id === id));
  order.forEach((hid, i) => {
    const h = heroes.find((x) => x.id === hid);
    if (!h || !heroSpawns[i]) return;
    const u = makeHeroUnit(run, h);
    u.x = heroSpawns[i].x; u.y = heroSpawns[i].y;
    s.units.push(u);
  });
  if (!s.units.some((u) => u.id === 'scholar')) s.lantern = { carrier: s.units[0].id, x: 0, y: 0 };
  enemies.forEach((kind, i) => {
    const sp = enemySpawns[i % enemySpawns.length];
    let { x, y } = sp;
    if (unitAt(s, x, y)) {
      const alt = [...neighbors(s, sp), ...neighbors(s, { x: sp.x - 1, y: sp.y })].find((t) => !unitAt(s, t.x, t.y) && !isSolid(tileAt(s, t.x, t.y)) && tileAt(s, t.x, t.y) !== '~');
      if (alt) ({ x, y } = alt);
    }
    s.units.push(makeEnemyUnit(`${kind}${i}`, kind, x, y, tier));
  });
  // Elite affixes: every elite, and sometimes the toughest foe at depth 3, carries a curse of its own
  if (!tutorial) {
    const foes = alive(s, 'enemy').filter((e) => !e.boss);
    const champ = foes.find((e) => e.elite) ?? (tier >= 3 && s.rng() < 0.4 ? [...foes].sort((a, b) => b.maxHp - a.maxHp)[0] : null);
    if (champ) applyAffix(champ, AFFIX_IDS[Math.floor(s.rng() * AFFIX_IDS.length)]);
  }
  if (hasRelic(run, 'r_bell')) {
    const strongest = alive(s, 'enemy').sort((a, b) => b.maxHp - a.maxHp)[0];
    if (strongest) strongest.marked = 2;
  }
  if (hasRelic(run, 'r_tithe')) heroUnits(s).forEach((u) => (u.dread += 15));
  return s;
}

// Write battle results back into the run. Fallen heroes carry a deathSave result: 'pass' | 'fail'.
export function endBattle(run, s, won) {
  for (const h of run.heroes) {
    const u = s.units.find((x) => x.id === h.id);
    if (!u) continue;
    h.dread = Math.max(0, Math.min(99, u.dread));
    h.flaw = u.flaw;
    if (u.dead) {
      if (!won) { h.hp = 0; continue; }
      h.falls = (h.falls ?? 0) + 1;
      if (u.deathSave === 'fail') { h.lost = true; h.hp = 0; run.stats.lost++; }
      else { h.scars = (h.scars ?? 0) + 1; h.hp = Math.max(1, Math.round(maxHpOf(h) * 0.3)); h.dread = Math.min(99, h.dread + 15); }
    } else h.hp = Math.max(1, u.hp);
  }
}
export const deathSaveDC = (h) => 10 + 3 * (h.falls ?? 0);

// ---------- queries ----------
export const key = (s, x, y) => y * s.w + x;
export const inBounds = (s, x, y) => x >= 0 && y >= 0 && x < s.w && y < s.h;
export const tileAt = (s, x, y) => (inBounds(s, x, y) ? s.tiles[y][x] : '#');
export const isSolid = (ch) => ch === '#' || ch === 'B' || ch === 'C';
export const onDais = (s, u) => tileAt(s, u.x, u.y) === '^';
export const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
export const alive = (s, side) => s.units.filter((u) => !u.dead && (!side || u.side === side));
export const heroUnits = (s) => s.units.filter((u) => u.side === 'hero');
export const unitAt = (s, x, y) => s.units.find((u) => !u.dead && u.x === x && u.y === y);
export const brazierAt = (s, x, y) => s.braziers.find((b) => b.x === x && b.y === y);
export const chestAt = (s, x, y) => s.chests.find((b) => b.x === x && b.y === y);
export const unitById = (s, id) => s.units.find((u) => u.id === id);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
export function neighbors(s, t) {
  return DIRS.map(([dx, dy]) => ({ x: t.x + dx, y: t.y + dy })).filter((p) => inBounds(s, p.x, p.y));
}
export function stepCost(s, u, fx, fy, tx, ty) {
  const ch = tileAt(s, tx, ty);
  if (isSolid(ch)) return Infinity;
  if (ch === '~') return u.swims ? 2 : Infinity;
  if (ch === ',') return u.swims ? 1 : 2;
  if (ch === '^' && tileAt(s, fx, fy) !== '^') return 2;
  return 1;
}
// D&D: standing up from Prone costs half your movement
export const moveOf = (u) => (u.prone ? Math.ceil(u.move / 2) : u.move);
export function reachable(s, u, budget = moveOf(u)) {
  const dist = new Map();
  const prev = new Map();
  const start = key(s, u.x, u.y);
  dist.set(start, 0);
  const open = [{ x: u.x, y: u.y, c: 0 }];
  if (u.inDeep) budget = Math.min(budget, 1);
  while (open.length) {
    open.sort((a, b) => a.c - b.c);
    const cur = open.shift();
    if (cur.c > dist.get(key(s, cur.x, cur.y))) continue;
    for (const [dx, dy] of DIRS) {
      const nx = cur.x + dx, ny = cur.y + dy;
      if (!inBounds(s, nx, ny)) continue;
      if (dx && dy && (isSolid(tileAt(s, cur.x + dx, cur.y)) || isSolid(tileAt(s, cur.x, cur.y + dy)))) continue;
      const other = unitAt(s, nx, ny);
      if (other && other.side !== u.side) continue;
      let sc = stepCost(s, u, cur.x, cur.y, nx, ny);
      if (u.inDeep && cur.c === 0 && sc !== Infinity) sc = 1;
      const c = cur.c + sc;
      if (c > budget) continue;
      const k = key(s, nx, ny);
      if (!dist.has(k) || c < dist.get(k)) {
        dist.set(k, c);
        prev.set(k, key(s, cur.x, cur.y));
        open.push({ x: nx, y: ny, c });
      }
    }
  }
  return { dist, prev, start };
}
export const downedAt = (s, x, y) => s.units.find((u) => u.downed && !u.slain && u.x === x && u.y === y);
export function canStop(s, u, x, y) {
  const other = unitAt(s, x, y);
  if (other && other !== u) return false;
  if (downedAt(s, x, y)) return false;
  if (u.flaw === 'paranoid') {
    if (alive(s, 'hero').some((h) => h !== u && Math.max(Math.abs(h.x - x), Math.abs(h.y - y)) <= 1)) return false;
  }
  return true;
}
export function pathFrom(s, reach, x, y) {
  const path = [];
  let k = key(s, x, y);
  if (!reach.dist.has(k)) return null;
  while (k !== reach.start) {
    path.unshift({ x: k % s.w, y: Math.floor(k / s.w) });
    k = reach.prev.get(k);
  }
  return path;
}
export function los(s, ax, ay, bx, by) {
  let x = ax, y = ay;
  const dx = Math.abs(bx - ax), dy = -Math.abs(by - ay);
  const sx = ax < bx ? 1 : -1, sy = ay < by ? 1 : -1;
  let err = dx + dy;
  while (!(x === bx && y === by)) {
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
    if (x === bx && y === by) break;
    if (tileAt(s, x, y) === '#') return false;
  }
  return true;
}

// ---------- light ----------
export function lanternPos(s) {
  if (s.lantern.carrier) {
    const c = unitById(s, s.lantern.carrier);
    if (c && !c.dead) return { x: c.x, y: c.y };
  }
  return { x: s.lantern.x, y: s.lantern.y };
}
export function lanternRadius(s) {
  let r = LANTERN_RADIUS + (hasRelic(s.run, 'r_ives') ? 1 : 0);
  const c = s.lantern.carrier && unitById(s, s.lantern.carrier);
  if (c && !c.dead) r += c.mods?.light ?? 0;
  return r;
}
export function lightSources(s) {
  const out = s.braziers.filter((b) => b.lit).map((b) => ({ x: b.x, y: b.y, r: BRAZIER_RADIUS, kind: 'brazier' }));
  const lp = lanternPos(s);
  out.push({ x: lp.x, y: lp.y, r: lanternRadius(s), kind: 'lantern' });
  if (s.fireAt) out.push({ x: s.fireAt.x, y: s.fireAt.y, r: 2, kind: 'fire' });
  return out;
}
export function computeLight(s) {
  const grid = Array.from({ length: s.h }, () => new Array(s.w).fill(s.flare ? LIGHT.BRIGHT : LIGHT.DARK));
  if (s.flare) return grid;
  for (const src of lightSources(s)) {
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
      const d = Math.hypot(x - src.x, y - src.y);
      const lvl = d <= src.r - 1 + 0.25 ? LIGHT.BRIGHT : d <= src.r + 0.25 ? LIGHT.DIM : LIGHT.DARK;
      if (lvl > grid[y][x]) grid[y][x] = lvl;
    }
  }
  return grid;
}
export const lightAt = (s, x, y) => computeLight(s)[y][x];
export function visibleToHeroes(s, u) {
  if (u.side === 'hero' || u.marked > 0) return true;
  if (lightAt(s, u.x, u.y) > LIGHT.DARK) return true;
  return alive(s, 'hero').some((h) => cheb(h, u) <= 1 || (h.mods?.darkSight && cheb(h, u) <= 5));
}
export function attackMode(s, attacker, target, ranged = false) {
  const adv = [], dis = [];
  if (target.marked > 0) adv.push('Marked');
  if (ranged && onDais(s, attacker) && !onDais(s, target)) adv.push('High ground');
  if (attacker.darkHunter && lightAt(s, attacker.x, attacker.y) === LIGHT.DARK) adv.push('From the dark');
  if (attacker.side === 'hero' && attacker.mods?.firstAdv && !attacker.attackedYet) adv.push('Black Pearl');
  if (attacker.virtue === 'focused') adv.push('Focused');
  if (target.inDeep) adv.push('Floundering target');
  if (attacker.side === 'enemy' && target.snared) adv.push('Snared');
  const darkSight = attacker.mods?.darkSight;
  if (target.side === 'enemy' && !darkSight) {
    if (!visibleToHeroes(s, target)) dis.push('Unseen');
    else if (lightAt(s, target.x, target.y) === LIGHT.DARK && target.marked <= 0) dis.push('In darkness');
  }
  if (attacker.flaw === 'hopeless') dis.push('Hopeless');
  if (attacker.inDeep) dis.push('Floundering');
  // D&D: flanking. An ally directly across the target gives melee Advantage (both sides use it).
  if (!ranged && flanker(s, attacker, target)) adv.push('Flanking');
  // D&D: Prone. Easy to hit up close, hard to hit from afar.
  if (target.prone) (ranged ? dis : adv).push(ranged ? 'Prone (at range)' : 'Prone');
  const mode = Math.sign(adv.length) - Math.sign(dis.length);
  return { mode, adv, dis, cover: ranged ? coverBonus(s, attacker, target) : 0 };
}
export function flanker(s, a, t) {
  if (cheb(a, t) > 1) return null;
  const x = 2 * t.x - a.x, y = 2 * t.y - a.y;
  const o = unitAt(s, x, y);
  return o && o !== a && !o.dead && o.side === a.side && !(o.dazed > 0) ? o : null;
}
// D&D: half cover. A pillar, brazier, statue or body on the target's side of the line adds +2 to the DC.
export function coverBonus(s, a, t) {
  if (cheb(a, t) <= 1) return 0;
  const cx = t.x - Math.sign(t.x - a.x), cy = t.y - Math.sign(t.y - a.y);
  if (cx === a.x && cy === a.y) return 0;
  const o = unitAt(s, cx, cy);
  return isSolid(tileAt(s, cx, cy)) || (o && !o.dead) ? 2 : 0;
}
// D&D: a saving throw. d20 + ability modifier against a DC.
export function savingThrow(rng, u, stat, dc) {
  const d = 1 + Math.floor(rng() * 20);
  const mod = u.stats?.[stat] ?? 0;
  return { d, mod, total: d + mod, ok: d === 20 || (d !== 1 && d + mod >= dc) };
}
export function attackBonus(s, u, target) {
  let b = u.atk;
  if (u.side === 'hero' && hasRelic(s.run, 'r_moth') && lightAt(s, target.x, target.y) === LIGHT.DARK) b += 2;
  return b;
}
export const guardOf = (u) => u.guard + (u.braced ? 3 : 0) + (u.virtue === 'stalwart' ? 3 : 0) + (u.guardBuff ?? 0);
export const parryWindow = (u) => {
  let w = PARRY_PERFECT + (u.mods?.parry ?? 0) + Math.max(0, (u.stats?.DEX ?? 0)) * 15;
  if (u.flaw === 'tremulous') w = Math.round(w / 2);
  return w;
};
export const shoveBonus = (u) => (u.mods?.shove ?? 0) + ((u.stats?.STR ?? 0) >= 3 ? 1 : 0);

// ---------- hero actions ----------
export function heroActions(s, u) {
  const list = [...u.skills];
  if (s.lantern.carrier === u.id) list.push('throw');
  if (s.braziers.some((b) => !b.lit && cheb(b, u) <= 1)) list.push('kindle');
  if (s.chests.some((c) => !c.open && cheb(c, u) <= 1)) list.push('open');
  if (s.run.consumables.length) list.push('item');
  if (s.units.some((o) => o.downed && !o.slain && cheb(o, u) <= 1)) list.unshift('help');
  return list;
}
export const cooldownOf = (u, skillId) => (u.cd?.[skillId] ?? 0);
// "1d10+4" -> [5, 14], plus any flat extra
export function diceRange(spec, extra = 0) {
  const m = /(\d+)d(\d+)([+-]\d+)?/.exec(spec ?? '');
  if (!m) return null;
  const n = +m[1], d = +m[2], k = +(m[3] ?? 0) + extra;
  return [n + k, n * d + k];
}
export function skillTargets(s, u, skillId) {
  const sk = SKILLS[skillId];
  if (sk.cd && cooldownOf(u, skillId) > 0) return [];
  if (sk.kind === 'self' || sk.kind === 'toll' || sk.kind === 'chime' || sk.kind === 'stand') return [{ x: u.x, y: u.y }];
  if (sk.kind === 'hour') return alive(s, 'hero').filter((h) => h !== u && cheb(h, u) <= sk.range && (h.acted || h.moved)).map((h) => ({ x: h.x, y: h.y, unit: h }));
  if (sk.kind === 'help') return s.units.filter((o) => o.downed && !o.slain && cheb(o, u) <= 1).map((o) => ({ x: o.x, y: o.y, unit: o }));
  if (sk.kind === 'kindle') return s.braziers.filter((b) => !b.lit && cheb(b, u) <= 1).map((b) => ({ x: b.x, y: b.y }));
  if (sk.kind === 'open') return s.chests.filter((c) => !c.open && cheb(c, u) <= 1).map((c) => ({ x: c.x, y: c.y }));
  if (sk.kind === 'throw') return throwTiles(s, u, sk.range);
  return alive(s, 'enemy')
    .filter((e) => cheb(e, u) <= sk.range)
    .filter((e) => !sk.ranged || los(s, u.x, u.y, e.x, e.y))
    .map((e) => ({ x: e.x, y: e.y, unit: e }));
}
export function throwTiles(s, u, range) {
  const out = [];
  for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
    const ch = tileAt(s, x, y);
    if (isSolid(ch) || ch === '~') continue;
    const d = Math.max(Math.abs(x - u.x), Math.abs(y - u.y));
    if (d >= 1 && d <= range) out.push({ x, y });
  }
  return out;
}
export function pushPath(s, target, dx, dy, dist) {
  const intoDeep = !target.swims;
  const path = [];
  let x = target.x, y = target.y;
  for (let i = 0; i < dist; i++) {
    const nx = x + dx, ny = y + dy;
    const ch = tileAt(s, nx, ny);
    if (!inBounds(s, nx, ny) || isSolid(ch)) return { path, result: 'wall' };
    const other = unitAt(s, nx, ny);
    if (other) return { path, result: 'unit', other };
    if (downedAt(s, nx, ny)) return { path, result: 'clear' };
    path.push({ x: nx, y: ny });
    x = nx; y = ny;
    if (ch === '~' && intoDeep) return { path, result: 'water' };
  }
  return { path, result: 'clear' };
}
export function shovePath(s, from, target, dist) {
  return pushPath(s, target, Math.sign(target.x - from.x) || 1, Math.sign(target.y - from.y), dist);
}
export function pullPath(s, puller, target, dist) {
  const path = [];
  let x = target.x, y = target.y;
  for (let i = 0; i < dist; i++) {
    const dx = Math.sign(puller.x - x), dy = Math.sign(puller.y - y);
    const nx = x + dx, ny = y + dy;
    if (nx === puller.x && ny === puller.y) break;
    const ch = tileAt(s, nx, ny);
    if (isSolid(ch) || unitAt(s, nx, ny) || downedAt(s, nx, ny)) break;
    path.push({ x: nx, y: ny });
    x = nx; y = ny;
    if (ch === '~' && !target.swims) return { path, result: 'water' };
  }
  return { path, result: 'clear' };
}

// ---------- enemy AI ----------
function adjacentOpen(s, t) {
  return neighbors(s, t).filter((p) => !isSolid(tileAt(s, p.x, p.y)));
}
function targetScore(s, e, h) {
  let score = h.hp * 2 + guardOf(h);
  const l = lightAt(s, h.x, h.y);
  if (e.darkHunter) score -= l === LIGHT.DARK ? 40 : l === LIGHT.DIM ? 15 : 0;
  if (h.inDeep) score -= 10;
  if (e.kind === 'gutter') score -= (3 - alive(s, 'hero').filter((o) => o !== h && cheb(o, h) <= 2).length) * 12;
  if (e.kind === 'snuffer' && s.lantern.carrier === h.id) score -= 30;
  if (h.taunting && cheb(e, h) <= 4) score -= 200;
  return score + cheb(e, h) * 3;
}
function bestTile(s, e, reach, test) {
  let best = null;
  for (const [k, c] of reach.dist) {
    const x = k % s.w, y = Math.floor(k / s.w);
    if (!canStop(s, e, x, y)) continue;
    const score = test(x, y, c);
    if (score === null) continue;
    if (!best || score < best.score) best = { x, y, score };
  }
  return best;
}
function walkToward(s, e, target) {
  const far = reachable(s, e, 99);
  let goal = null;
  for (const t of adjacentOpen(s, target)) {
    const k = key(s, t.x, t.y);
    if (far.dist.has(k) && (!goal || far.dist.get(k) < goal.c)) goal = { c: far.dist.get(k), t };
  }
  if (!goal) return [];
  const full = pathFrom(s, far, goal.t.x, goal.t.y);
  let spent = 0, px = e.x, py = e.y, cut = 0;
  for (let i = 0; i < full.length; i++) {
    spent += stepCost(s, e, px, py, full[i].x, full[i].y);
    if (spent > moveOf(e)) break;
    px = full[i].x; py = full[i].y;
    if (canStop(s, e, px, py)) cut = i + 1;
  }
  return full.slice(0, cut);
}

export function planEnemy(s, e) {
  if (e.drowning) return { type: 'sink' };
  if (e.dazed > 0) return { type: 'dazed' };
  const heroes = alive(s, 'hero');
  if (!heroes.length) return { type: 'wait' };
  if (e.boss) return planBishop(s, e, heroes);
  const ranked = [...heroes].sort((a, b) => targetScore(s, e, a) - targetScore(s, e, b));
  const reach = reachable(s, e);

  const sig = s.tutorial ? null : signatureMove(s, e, heroes);
  if (sig) return sig;

  if (e.healer) {
    const wounded = alive(s, 'enemy').filter((o) => o !== e && o.hp < o.maxHp - 3).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    if (wounded) {
      if (cheb(e, wounded) <= 4) return { type: 'heal', path: [], ally: wounded, target: null };
      const t = bestTile(s, e, reach, (x, y, c) => (cheb({ x, y }, wounded) <= 4 ? c + heroes.filter((h) => cheb(h, { x, y }) <= 1).length * 5 : null));
      if (t) return { type: 'heal', path: pathFrom(s, reach, t.x, t.y), ally: wounded, target: null };
    }
  }

  if (e.snuffs && !hasRelic(s.run, 'r_wick')) {
    const lit = s.braziers.filter((b) => b.lit && heroes.some((h) => cheb(h, b) <= 4));
    if (lit.length && !heroes.some((h) => cheb(h, e) <= 1)) {
      const t = bestTile(s, e, reach, (x, y, c) => (lit.some((b) => cheb(b, { x, y }) <= 1) ? c : null));
      if (t) {
        const b = lit.find((bz) => cheb(bz, t) <= 1);
        return { type: 'snuff', path: pathFrom(s, reach, t.x, t.y), brazier: b, target: null };
      }
    }
  }

  if (e.ranged) {
    const canShoot = (x, y, h) => cheb({ x, y }, h) <= e.ranged && cheb({ x, y }, h) >= 2 && los(s, x, y, h.x, h.y);
    for (const h of ranked) {
      if (canShoot(e.x, e.y, h) && !(e.skittish && heroes.some((o) => cheb(o, e) <= 1))) {
        return { type: e.pulls ? 'pull' : 'shoot', path: [], target: h };
      }
      const t = bestTile(s, e, reach, (x, y, c) => {
        if (!canShoot(x, y, h)) return null;
        const crowd = heroes.filter((o) => cheb(o, { x, y }) <= 1).length;
        return c + crowd * 6 - (lightAt(s, x, y) === LIGHT.DARK ? 2 : 0);
      });
      if (t) return { type: e.pulls ? 'pull' : 'shoot', path: pathFrom(s, reach, t.x, t.y), target: h };
    }
    return { type: 'move', path: walkToward(s, e, ranked[0]), target: ranked[0] };
  }

  const adjacent = heroes.filter((h) => cheb(h, e) <= 1);
  const taunter = heroes.find((h) => h.taunting && cheb(e, h) <= 4);
  if (adjacent.length && (!taunter || adjacent.includes(taunter))) {
    adjacent.sort((a, b) => targetScore(s, e, a) - targetScore(s, e, b));
    return { type: 'attack', path: [], target: adjacent[0] };
  }
  for (const h of ranked) {
    const t = bestTile(s, e, reach, (x, y, c) => (cheb({ x, y }, h) <= 1 ? c - (e.darkHunter && lightAt(s, x, y) === LIGHT.DARK ? 3 : 0) : null));
    if (t) return { type: 'attack', path: pathFrom(s, reach, t.x, t.y), target: h };
  }
  return { type: 'move', path: walkToward(s, e, ranked[0]), target: ranked[0] };
}

// ---------- enemy signature moves ----------
const passableLine = (s, x, y) => !isSolid(tileAt(s, x, y)) && tileAt(s, x, y) !== '~' && !unitAt(s, x, y);

// The Tide-Knight charges a hero standing in a straight, open line 2-5 tiles away.
export function chargeLine(s, e, heroes) {
  let best = null;
  for (const h of heroes) {
    const dx = h.x - e.x, dy = h.y - e.y, d = cheb(e, h);
    if (d < 2 || d > 5 || !(dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy))) continue;
    const sx = Math.sign(dx), sy = Math.sign(dy), path = [];
    let ok = true;
    for (let i = 1; i < d; i++) { const x = e.x + sx * i, y = e.y + sy * i; if (!passableLine(s, x, y)) { ok = false; break; } path.push({ x, y }); }
    if (ok && (!best || d < best.d)) best = { d, h, path };
  }
  return best;
}
// Where a Drowned Husk can drag its victim: an open deep-water tile beside them.
export function dragTile(s, h) {
  if (h.swims || h.inDeep) return null;
  return neighbors(s, h).find((p) => tileAt(s, p.x, p.y) === '~' && !unitAt(s, p.x, p.y)) ?? null;
}
// Where a Gutter-Wretch slips away to after striking: far from heroes, ideally in the dark.
export function retreatTile(s, e) {
  const reach = reachable(s, e, 2);
  const heroes = alive(s, 'hero');
  return bestTile(s, e, reach, (x, y, c) => -Math.min(...heroes.map((h) => cheb(h, { x, y }))) * 10 - (lightAt(s, x, y) === LIGHT.DARK ? 6 : 0) + c);
}
// Called at the start of each party phase: cultists ready to throw lock in their target area,
// so the danger zone shown to the player is exactly where the fire will land.
export function lockAims(s) {
  if (s.tutorial) return;
  const heroes = alive(s, 'hero');
  for (const e of alive(s, 'enemy')) {
    if (e.kind !== 'cultist' || e.lampCd > 0 || e.lampAim || e.dazed || e.drowning) continue;
    let best = null;
    for (const h of heroes) {
      if (cheb(e, h) > 4 || cheb(e, h) < 2 || !los(s, e.x, e.y, h.x, h.y)) continue;
      const caught = heroes.filter((o) => cheb(o, h) <= 1).length;
      if (!best || caught > best.caught) best = { caught, x: h.x, y: h.y };
    }
    if (best) e.lampAim = { x: best.x, y: best.y };
  }
  for (const e of alive(s, 'enemy')) {
    if (!e.boss || e.waveAim || e.dazed || e.drowning) continue;
    if (e.turn % 4 === 3 || (e.enraged && (e.turn + 1) % 4 === 3)) {
      const w = waveBand(s, e, heroes);
      if (w) e.waveAim = { axis: w.axis, c: w.c, dir: w.dir };
    }
  }
}
// ---------- the Bishop's signatures ----------
// The Tide Sermon: a 3-wide lane (rows or columns) that catches the most heroes. The wave runs away from him.
export function waveBand(s, e, heroes) {
  let best = null;
  for (const h of heroes) for (const axis of ['row', 'col']) {
    const c = axis === 'row' ? h.y : h.x;
    const caught = heroes.filter((o) => Math.abs((axis === 'row' ? o.y : o.x) - c) <= 1).length;
    if (!best || caught > best.caught || (caught === best.caught && axis === 'row' && best.axis === 'col')) {
      const dir = axis === 'row' ? { x: Math.sign(h.x - e.x) || 1, y: 0 } : { x: 0, y: Math.sign(h.y - e.y) || 1 };
      best = { caught, axis, c, dir };
    }
  }
  return best;
}
export const inWave = (aim, p) => Math.abs((aim.axis === 'row' ? p.y : p.x) - aim.c) <= 1;
// From the Deep: he hunts whoever stands most alone, and surfaces beside them (water first).
function surfaceTile(s, e, h) {
  const rank = (p) => (tileAt(s, p.x, p.y) === '~' ? 0 : tileAt(s, p.x, p.y) === ',' ? 1 : 2);
  return neighbors(s, h).filter((p) => !isSolid(tileAt(s, p.x, p.y)) && !unitAt(s, p.x, p.y))
    .sort((a, b) => rank(a) - rank(b) || cheb(a, e) - cheb(b, e) || a.y - b.y || a.x - b.x)[0] ?? null;
}
export function diveTarget(s, e, heroes) {
  const friends = (h) => heroes.filter((o) => o !== h && cheb(o, h) <= 2).length;
  const order = [...heroes].sort((a, b) => friends(a) - friends(b) || a.hp - b.hp);
  for (const h of order) { const tile = surfaceTile(s, e, h); if (tile) return { h, tile }; }
  return null;
}
export function dirgeTargets(s, e) {
  return alive(s, 'hero').filter((h) => cheb(h, e) <= 5 && los(s, e.x, e.y, h.x, h.y));
}
function signatureMove(s, e, heroes) {
  const adjacent = heroes.filter((h) => cheb(h, e) <= 1);
  if (e.kind === 'cultist' && e.lampAim) return { type: 'lamp', path: [], area: e.lampAim, target: null };
  if (e.kind === 'knight' && !adjacent.length) {
    const c = chargeLine(s, e, heroes);
    if (c) return { type: 'charge', path: c.path, target: c.h };
  }
  if (e.kind === 'choir' && e.turn % 2 === 1 && !adjacent.length) {
    const t = dirgeTargets(s, e);
    if (t.length) return { type: 'dirge', path: [], targets: t, target: null };
  }
  if (e.kind === 'censer' && e.turn % 2 === 0) {
    const wounded = alive(s, 'enemy').some((o) => o !== e && o.hp < o.maxHp - 3);
    const ally = alive(s, 'enemy').filter((o) => o !== e && !o.ward && cheb(o, e) <= 4)
      .sort((a, b) => Math.min(...heroes.map((h) => cheb(h, a))) - Math.min(...heroes.map((h) => cheb(h, b))))[0];
    if (!wounded && ally) return { type: 'ward', path: [], ally, target: null };
  }
  return null;
}

function planBishop(s, e, heroes) {
  if (e.waveAim) return { type: 'wave', path: [], area: e.waveAim, targets: heroes.filter((h) => inWave(e.waveAim, h)), target: null };
  const adjacent = heroes.filter((h) => cheb(h, e) <= 1);
  if (e.enraged && !adjacent.length && (e.diveCd ?? 0) <= 0) {
    const d = diveTarget(s, e, heroes);
    if (d) return { type: 'dive', path: [], target: d.h, tile: d.tile };
  }
  if (adjacent.length) return { type: 'cleave', path: [], target: adjacent[0] };
  const cycle = e.turn % 4;
  const inPsalm = heroes.filter((h) => cheb(h, e) <= 4 && los(s, e.x, e.y, h.x, h.y));
  if (cycle === 0 && inPsalm.length) return { type: 'psalm', path: [], target: inPsalm.sort((a, b) => b.hp - a.hp)[0] };
  if (cycle === 1 && s.summons < 2 && alive(s, 'enemy').length < 4) return { type: 'raise', path: [], target: null };
  if (cycle === 2 && s.braziers.some((b) => b.lit) && !hasRelic(s.run, 'r_wick')) {
    const b = s.braziers.filter((x) => x.lit).sort((a, b2) => Math.min(...heroes.map((h) => cheb(h, a))) - Math.min(...heroes.map((h) => cheb(h, b2))))[0];
    return { type: 'snuffFar', path: [], brazier: b, target: null };
  }
  const reach = reachable(s, e);
  const ranked = [...heroes].sort((a, b) => cheb(a, e) - cheb(b, e));
  const t = bestTile(s, e, reach, (x, y, c) => (cheb({ x, y }, ranked[0]) <= 1 ? c : null));
  if (t) return { type: 'cleave', path: pathFrom(s, reach, t.x, t.y), target: ranked[0] };
  if (inPsalm.length) return { type: 'psalm', path: [], target: inPsalm[0] };
  return { type: 'litany', path: walkToward(s, e, ranked[0]), target: null };
}

export function deepTiles(s) {
  const out = [];
  for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) if (tileAt(s, x, y) === '~' && !unitAt(s, x, y)) out.push({ x, y });
  return out;
}
export function intentText(s, e) {
  const p = planEnemy(s, e);
  const who = p.target ? HEROES[p.target.id]?.name ?? p.target.name : '';
  switch (p.type) {
    case 'attack': {
      let rider = '';
      if (!s.tutorial && e.kind === 'gutter') rider = ' · then slips back into the dark';
      if (!s.tutorial && e.kind === 'husk' && dragTile(s, p.target)) rider = ' · drags them into deep water';
      if (!s.tutorial && e.kind === 'snuffer' && s.lantern.carrier === p.target.id) rider = ' · knocks the lantern loose';
      return `Next: attacks ${who} · ${e.dmg}${e.heavy ? ' · HEAVY' : ''}${rider}`;
    }
    case 'lamp': return 'Next: hurls its burning lamp at the marked area · 1d6 fire, sets alight · DEX save 13 halves it';
    case 'charge': return `Next: CHARGES ${who} in a line · ${e.dmg} +2 damage · shoves 2 · step out of the line`;
    case 'dirge': return `Next: sings a Dirge · +8 Dread to every hero it can see (${p.targets.length})`;
    case 'ward': return `Next: wards the ${p.ally.name} · absorbs the next 6 damage`;
    case 'wave': return `Next: THE TIDE SERMON · a wave sweeps the marked ${p.area.axis === 'row' ? 'rows' : 'columns'} · 1d6 (DEX save 13 halves), shoves 2 · get out of the lane (${p.targets.length} caught)`;
    case 'dive': return `Next: FROM THE DEEP · sinks and surfaces beside ${who} · HEAVY ${e.dmg}, +3 damage · Snares · ends his turn · he hunts whoever stands alone`;
    case 'shoot': return `Next: shoots ${who} · ${e.dmg}${e.dreadOnHit ? ` · +${e.dreadOnHit} Dread` : ''}`;
    case 'pull': return `Next: hooks ${who}, drags them ${e.pulls} tiles and Snares them (foes get Advantage)`;
    case 'snuff': case 'snuffFar': return 'Next: snuffs a brazier';
    case 'heal': return `Next: heals the ${p.ally.name}`;
    case 'cleave': return `Next: cleaves everyone adjacent · ${e.dmg} · HEAVY`;
    case 'psalm': return `Next: Drowning Psalm on ${who} (1d8, pull 2)`;
    case 'raise': return 'Next: raises a Husk from the water';
    case 'litany': return 'Next: Backwards Litany (Dread to heroes outside bright light)';
    case 'dazed': return 'Dazed: loses its next turn';
    case 'sink': return 'Sinking: will drown on its turn';
    default: return 'Next: moves closer';
  }
}

// ---------- encounters ----------
export function encounterFor(run, node, rng) {
  if (node.type === 'boss') return { roomId: 'apse', enemies: ENCOUNTERS.boss[0], tier: 3 };
  if (node.type === 'elite') return { roomId: pickOne(rng, COMBAT_ROOMS), enemies: pickOne(rng, ENCOUNTERS.elite), tier: node.tier };
  return { roomId: pickOne(rng, COMBAT_ROOMS), enemies: pickOne(rng, ENCOUNTERS[node.tier]), tier: node.tier };
}
export function eventFor(run, rng) {
  const fresh = EVENTS.filter((e) => !run.seenEvents.includes(e.id));
  const ev = pickOne(rng, fresh.length ? fresh : EVENTS);
  run.seenEvents.push(ev.id);
  return ev;
}
