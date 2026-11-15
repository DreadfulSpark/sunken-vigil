// All content for The Sunken Vigil: heroes, skills, foes, loot, talents, rooms, events, narration.

export const HEROES = {
  warden: {
    name: 'Brannoc', cls: 'Tidewarden', title: 'Shield of the Drowned Gate', role: 'Front line · Shover',
    hp: 30, guard: 14, atk: 5, move: 4,
    stats: { STR: 3, DEX: 0, WIS: 1, CHA: 0 },
    skills: ['hammer', 'shove', 'brace', 'stand'],
    bio: 'Held the floodgate for nine days. The gate fell anyway. He did not, and he has not forgiven himself.',
  },
  scholar: {
    name: 'Ysolde', cls: 'Drowned Scholar', title: 'Reader of Wet Pages', role: 'Ranged · Lantern-bearer',
    hp: 18, guard: 11, atk: 5, move: 4,
    stats: { STR: -1, DEX: 2, WIS: 3, CHA: 1 },
    skills: ['bolt', 'mark', 'chain'],
    bio: 'Drowned once, on purpose, to read the books at the bottom of the lake. Came back knowing names.',
  },
  ringer: {
    name: 'Old Hesk', cls: 'Bell-Ringer', title: 'Keeper of the Hours', role: 'Support · Control',
    hp: 22, guard: 12, atk: 4, move: 4,
    stats: { STR: 1, DEX: 1, WIS: 2, CHA: 3 },
    skills: ['knell', 'toll', 'chime', 'hour'],
    bio: 'Rang the evening bell while the city went under. She has not missed an hour since.',
  },
};
export const heroLabel = (id) => `${HEROES[id].name} the ${HEROES[id].cls}`;

export const SKILLS = {
  hammer: { name: 'Tide Hammer', kind: 'attack', range: 1, dmg: '1d8+3', icon: 'hammer',
    desc: 'Melee strike. 1d8+3 damage.' },
  shove: { name: 'Undertow', kind: 'shove', range: 1, push: 2, icon: 'shove',
    desc: 'Melee. On a hit, shove 2 tiles (+1 if STR 3+). Walls and bodies hurt. Deep water drowns lesser foes.' },
  brace: { name: 'Brace', kind: 'self', icon: 'brace',
    desc: '+3 Guard until your next phase. Perfect parries riposte for 1d6+3.' },
  bolt: { name: 'Brine Bolt', kind: 'attack', range: 5, ranged: true, dmg: '1d10+2', icon: 'bolt',
    desc: 'Ranged 5, needs line of sight. 1d10+2. Advantage from the dais. A crit knocks the foe back.' },
  mark: { name: 'Read the Dark', kind: 'mark', range: 6, ranged: true, icon: 'mark',
    desc: 'Reveal and MARK a foe: attacks against it have Advantage until your next phase ends.' },
  knell: { name: 'Knell', kind: 'attack', range: 1, dmg: '1d6+2', knock: 1, icon: 'knell',
    desc: 'Melee. 1d6+2 and knock the foe back 1 tile.' },
  toll: { name: 'Toll the Hour', kind: 'toll', radius: 2, dc: 12, icon: 'toll',
    desc: 'Every foe within 2 is pushed back 1, then makes a WIS save (DC 12 + CHA) or is DAZED and loses its next turn.' },
  chime: { name: 'Steady Chime', kind: 'chime', radius: 3, icon: 'chime',
    desc: 'Heroes within 3 lose 15 Dread and heal 3 (+CHA).' },
  // signature abilities: strong, with a cooldown in rounds (cd), shown on the action bar
  stand: { name: 'Floodgate Stand', kind: 'stand', cd: 3, icon: 'stand',
    desc: 'Signature (every 3 rounds). Slam the shield: shove every adjacent foe 1 tile, gain +2 Guard, and TAUNT. Foes within 4 must come for Brannoc next phase.' },
  chain: { name: 'Chain of Names', kind: 'chain', range: 5, ranged: true, dmg: '1d8+2', jumps: 2, cd: 3, icon: 'chainbolt',
    desc: 'Signature (every 3 rounds). Ranged 5. Speak its true name: 1d8+2 lightning, then it arcs to up to 2 more foes within 2 tiles (1d6+1 each).' },
  hour: { name: 'The Ninth Hour', kind: 'hour', range: 3, cd: 99, icon: 'hour',
    desc: 'Signature (once per fight). Ring the hour for an ally within 3 who has already moved or acted: they get their move and action back.' },
  throw: { name: 'Throw Lantern', kind: 'throw', range: 4, icon: 'lantern',
    desc: 'Hurl the lantern up to 4 tiles. The light goes where it lands. Step on it to pick it up.' },
  kindle: { name: 'Kindle', kind: 'kindle', range: 1, icon: 'kindle',
    desc: 'Relight an adjacent brazier. Heroes nearby lose 8 Dread.' },
  open: { name: 'Open Chest', kind: 'open', range: 1, icon: 'chest',
    desc: 'Pry open an adjacent reliquary. Who knows what the drowned kept.' },
  item: { name: 'Use Item', kind: 'item', icon: 'item',
    desc: 'Use a consumable from the party satchel (right panel).' },
};

export const ENEMIES = {
  cultist: { name: 'Lamp-Cultist', hp: 12, guard: 12, atk: 4, move: 4, dmg: '1d6+2', silver: 6,
    lore: 'Carries a lamp it never lights, until it does: every few rounds it marks an area and hurls the lamp there. Fire and burning, but also light.' },
  snuffer: { name: 'Wick-Snuffer', hp: 10, guard: 12, atk: 3, move: 5, dmg: '1d6+1', snuffs: true, silver: 6,
    lore: 'Hates light. Goes for your braziers, then for whoever holds the lantern, and knocks it loose.' },
  gutter: { name: 'Gutter-Wretch', hp: 8, guard: 13, atk: 5, move: 6, dmg: '1d6+3', silver: 6,
    lore: 'Fast, frail, and always going for whoever is alone. Strikes, then slips back into the dark.' },
  husk: { name: 'Drowned Husk', hp: 20, guard: 11, atk: 4, move: 3, dmg: '1d8+2', swims: true,
    dreadOnHit: 12, darkHunter: true, silver: 9,
    lore: 'Swims through deep water. Strikes with Advantage from the dark. Every hit costs Dread, and it drags you into deep water if it can.' },
  choir: { name: 'Choir Wretch', hp: 9, guard: 11, atk: 4, move: 3, dmg: '1d4', ranged: 4,
    dreadOnHit: 15, skittish: true, silver: 8,
    lore: 'Sings from the back. Every other turn it sings a Dirge: Dread to every hero it can see. Break its line of sight. Fragile up close.' },
  eel: { name: 'Eel-Priest', hp: 13, guard: 12, atk: 4, move: 4, dmg: '1d4+1', ranged: 4, pulls: 2, silver: 9,
    lore: 'Hooks a hero and drags them 2 tiles closer, into deep water if it can. A hooked hero is Snared: foes attack them with Advantage this phase.' },
  censer: { name: 'Censer-Monk', hp: 12, guard: 12, atk: 3, move: 3, dmg: '1d4+1', ranged: 4, healer: true, silver: 10,
    lore: 'Swings smoke over the wounded. Heals an ally 5 and gives it +2 Guard, or wards one so it ignores the next 6 damage. Kill it first.' },
  knight: { name: 'Tide-Knight', hp: 30, guard: 15, atk: 5, move: 3, dmg: '1d10+2', shoves: 1, elite: true, heavy: true,
    silver: 20, lore: 'Elite. Rusted plate, full of lake. Its blows are HEAVY: a perfect parry only halves them. Charges anyone standing in a straight open line.' },
  bishop: { name: 'The Drowned Bishop', hp: 80, guard: 13, atk: 6, move: 3, dmg: '1d10+4', boss: true, heavy: true,
    swims: true, silver: 60,
    lore: 'Preached until the water came, and preaches still. Cleaves, hooks, snuffs and raises the dead. Every few turns he preaches the Tide Sermon: a wave down a marked lane. Wounded, he floods the apse, acts twice, and dives to surface beside whoever stands alone.' },
};

// ---------- loot ----------
export const RARITY = {
  worn: { name: 'Worn', color: 0xd9cfb8, hex: '#d9cfb8', weight: 38 },
  blessed: { name: 'Blessed', color: 0x6fc2b5, hex: '#6fc2b5', weight: 36 },
  relic: { name: 'Relic', color: 0xe8a33d, hex: '#e8a33d', weight: 15 },
  cursed: { name: 'Cursed', color: 0xd0402c, hex: '#e0563f', weight: 11 },
};

// Item mods are summed per hero (weapon + charm + talents). Keys used by the rules:
// atk guard dmg maxHp move crit shove slam light dreadMul parry killHeal markDmg firstAdv chimeBonus
// chimeDread tollDc tollDmg tollPush regen darkSight darkDmg drownRefund dazedVuln riposteAlways
// firstParryMark boltPush saveBonus heavyParry markLong
export const ITEMS = [
  // Tidewarden weapons
  { id: 'maul_iron', name: 'Gate-Iron Maul', icon: 'maul', slot: 'weapon', hero: 'warden', rarity: 'worn', mods: { dmg: 1, slam: 2 }, text: '+1 damage. Wall slams deal +2.', tag: 'drown' },
  { id: 'tidebreaker', name: 'Tidebreaker', icon: 'maul', slot: 'weapon', hero: 'warden', rarity: 'blessed', mods: { dmg: 2, shove: 1 }, text: '+2 damage. Shoves go 1 tile further.', tag: 'drown' },
  { id: 'anchor', name: 'Anchor of St. Wend', icon: 'anchor', slot: 'weapon', hero: 'warden', rarity: 'relic', mods: { shove: 1, slam: 4, drownRefund: 1 }, text: 'Shoves +1 tile, slams +4. When a foe you shoved drowns, you may act again.', tag: 'drown' },
  { id: 'hungering', name: 'Hungering Maul', icon: 'maul', slot: 'weapon', hero: 'warden', rarity: 'cursed', mods: { dmg: 5, dreadMul: 0.25 }, text: '+5 damage. You gain 25% more Dread.' },
  // Scholar weapons
  { id: 'codex', name: 'Salt-Inked Codex', icon: 'book', slot: 'weapon', hero: 'scholar', rarity: 'worn', mods: { atk: 1, markLong: 1 }, text: '+1 to hit. Your Marks last one extra round.', tag: 'mark' },
  { id: 'psalter', name: "Lamplighter's Psalter", icon: 'book', slot: 'weapon', hero: 'scholar', rarity: 'blessed', mods: { light: 1, dmg: 1 }, text: 'Lantern radius +1 while you carry it. +1 damage.' },
  { id: 'gospel', name: 'The Wet Gospel', icon: 'book', slot: 'weapon', hero: 'scholar', rarity: 'relic', mods: { crit: 2, markDmg: 3 }, text: 'Crit on 18–20. +3 damage against Marked foes.', tag: 'mark' },
  { id: 'gills', name: 'Book of Gills', icon: 'book', slot: 'weapon', hero: 'scholar', rarity: 'cursed', mods: { dmg: 4, atk: 1, maxHp: -5, boltPush: 1 }, text: '+4 damage, +1 to hit, every Brine Bolt pushes 1. −5 max HP.', tag: 'drown' },
  // Bell-Ringer weapons
  { id: 'handbell', name: 'Cracked Handbell', icon: 'bell', slot: 'weapon', hero: 'ringer', rarity: 'worn', mods: { chimeBonus: 2, tollPush: 1 }, text: 'Chime heals +2. Toll pushes 1 tile further.', tag: 'bell' },
  { id: 'vespers', name: 'Vespers Bell', icon: 'bell', slot: 'weapon', hero: 'ringer', rarity: 'blessed', mods: { tollDc: 2, dmg: 1, dazedVuln: 2 }, text: 'Toll DC +2. Dazed foes take +2 damage from everyone.', tag: 'bell' },
  { id: 'lastbell', name: 'The Last Bell', icon: 'bell', slot: 'weapon', hero: 'ringer', rarity: 'relic', mods: { chimeBonus: 3, chimeDread: 10, tollDc: 1, dazedVuln: 3 }, text: 'Chime heals +3 and calms 10 more. Toll DC +1. Dazed foes take +3.', tag: 'bell' },
  { id: 'teethbell', name: 'Bell of Teeth', icon: 'bell', slot: 'weapon', hero: 'ringer', rarity: 'cursed', mods: { tollDmg: 1, dmg: 3, maxHp: -4 }, text: 'Toll also deals 1d6 to every foe it reaches. +3 damage. −4 max HP.', tag: 'bell' },
  // Charms
  { id: 'thimble', name: "Grandmother's Thimble", icon: 'thimble', slot: 'charm', rarity: 'worn', mods: { guard: 1, firstParryMark: 1 }, text: '+1 Guard. Your first perfect parry each fight Marks the attacker.', tag: 'mark' },
  { id: 'eelboots', name: 'Eel-Skin Wraps', icon: 'wraps', slot: 'charm', rarity: 'worn', mods: { move: 1, swimHero: 1 }, text: '+1 Move. You can wade through deep water (cost 2) and never drown.', tag: 'drown' },
  { id: 'candle', name: 'Saint-Wax Stub', icon: 'candle', slot: 'charm', rarity: 'worn', mods: { maxHp: 4, darkDreadImmune: 1 }, text: '+4 max HP. You gain no Dread from standing in darkness.' },
  { id: 'knuckle', name: "Saint's Knucklebone", icon: 'bone', slot: 'charm', rarity: 'blessed', mods: { dreadMul: -0.3, saveBonus: 2 }, text: 'You gain 30% less Dread. +2 to Dread saves.' },
  { id: 'gamblerdie', name: "Gambler's Bone Die", icon: 'die', slot: 'charm', rarity: 'blessed', mods: { crit: 1, atk: 1 }, text: 'Crit on 19–20. +1 to hit.' },
  { id: 'mirror', name: 'Mirror Shard', icon: 'shard', slot: 'charm', rarity: 'blessed', mods: { parry: 40, heavyParry: 1 }, text: 'Wider parry window, and your perfect parries stop HEAVY blows completely.' },
  { id: 'leech', name: 'Leech Locket', icon: 'locket', slot: 'charm', rarity: 'blessed', mods: { killHeal: 5 }, text: 'Killing a foe heals you 5.' },
  { id: 'pearl', name: 'Black Pearl', icon: 'pearl', slot: 'charm', rarity: 'relic', mods: { firstAdv: 1, atk: 1 }, text: 'Your first attack each fight has Advantage. +1 to hit.' },
  { id: 'heartstone', name: 'Drowned Heartstone', icon: 'heart', slot: 'charm', rarity: 'relic', mods: { regen: 2, maxHp: 4 }, text: 'Heal 2 at the start of each party phase. +4 max HP.' },
  { id: 'nightglass', name: 'Nightglass Lens', icon: 'eye', slot: 'charm', rarity: 'relic', mods: { darkDmg: 4, darkSight: 1 }, text: 'You see into darkness. Attacks on foes standing in darkness deal +4.', tag: 'dark' },
  { id: 'rope', name: 'Rope of the Hanged', icon: 'rope', slot: 'charm', rarity: 'cursed', mods: { atk: 2, dmg: 2, maxHp: -6 }, text: '+2 to hit, +2 damage. −6 max HP.' },
  { id: 'eyeofdeep', name: 'Eye of the Deep', icon: 'eye', slot: 'charm', rarity: 'cursed', mods: { darkSight: 1, darkDmg: 6, dreadMul: 0.35 }, text: 'See into darkness; +6 damage to foes in it. You gain 35% more Dread.', tag: 'dark' },
  // Party relics (rule changers)
  { id: 'r_bell', name: 'Bell of the Drowned Gate', icon: 'r_bell', slot: 'relic', rarity: 'relic', text: 'The strongest foe in every fight starts Marked.', tag: 'mark' },
  { id: 'r_wick', name: 'Everburning Wick', icon: 'r_wick', slot: 'relic', rarity: 'relic', text: 'Braziers cannot be snuffed.' },
  { id: 'r_coin', name: "Ferryman's Coin", icon: 'r_coin', slot: 'relic', rarity: 'blessed', text: '+50% Silver from every source.' },
  { id: 'r_charter', name: 'Tide Charter', icon: 'r_charter', slot: 'relic', rarity: 'blessed', text: 'Shoved foes take 1d4. Foes that drown drop 10 Silver.', tag: 'drown' },
  { id: 'r_ives', name: 'Lantern of St. Ives', icon: 'r_lantern', slot: 'relic', rarity: 'relic', text: 'The lantern lights 1 tile further.' },
  { id: 'r_prayer', name: "Sailor's Prayer", icon: 'r_prayer', slot: 'relic', rarity: 'blessed', text: 'Gain 1 Fate at the start of every fight.' },
  { id: 'r_tongue', name: 'Choir Tongue', icon: 'r_tongue', slot: 'relic', rarity: 'relic', text: 'Heroes gain no Dread from standing in the dark.' },
  { id: 'r_hourglass', name: 'Cracked Hourglass', icon: 'r_hourglass', slot: 'relic', rarity: 'relic', text: 'Once per fight, a hero who would fall survives at 1 HP.' },
  { id: 'r_oilskin', name: 'Oilskin Satchel', icon: 'r_satchel', slot: 'relic', rarity: 'worn', text: 'Carry 4 consumables instead of 3.' },
  { id: 'r_tithe', name: 'Tithe of Blood', icon: 'r_blood', slot: 'relic', rarity: 'cursed', text: 'Crits deal triple dice. Every fight starts with +15 Dread on all heroes.' },
  { id: 'r_undertow', name: 'Undertow Psalm', icon: 'r_charter', slot: 'relic', rarity: 'relic', text: 'Elites and bosses that end a turn in deep water take 2d6 more.', tag: 'drown' },
  { id: 'r_silence', name: 'Bell of Silence', icon: 'r_bell', slot: 'relic', rarity: 'relic', text: 'Dazed foes stay Dazed for 2 turns.', tag: 'bell' },
  { id: 'r_moth', name: 'Moth Reliquary', icon: 'r_wick', slot: 'relic', rarity: 'cursed', text: 'All heroes have +2 to hit in darkness, but braziers start cold.', tag: 'dark' },
  // Consumables
  { id: 'c_salts', name: 'Smelling Salts', icon: 'c_salts', slot: 'consumable', rarity: 'worn', use: 'salts', text: 'A hero loses 30 Dread.' },
  { id: 'c_bandage', name: 'Bandage Roll', icon: 'c_bandage', slot: 'consumable', rarity: 'worn', use: 'bandage', text: 'A hero heals 10.' },
  { id: 'c_oil', name: 'Oil Flask', icon: 'c_oil', slot: 'consumable', rarity: 'blessed', use: 'oil', range: 4, text: 'Throw 4 tiles: 2d6 fire to everything adjacent to where it lands, and they burn.' },
  { id: 'c_holy', name: 'Font Water', icon: 'c_holy', slot: 'consumable', rarity: 'blessed', use: 'holy', text: 'Cure a hero\'s Flaw and lose 20 Dread.' },
  { id: 'c_flare', name: 'Phosphor Flare', icon: 'c_flare', slot: 'consumable', rarity: 'worn', use: 'flare', text: 'The whole room is lit until the end of the round.' },
];
export const itemById = (id) => ITEMS.find((i) => i.id === id);

// ---------- talents (picked at Sanctuaries, after elites, and from camp training) ----------
export const TALENTS = {
  warden: [
    { id: 't_riptide', name: 'Riptide', mods: { shove: 1, slam: 3 }, text: 'Undertow shoves 1 further; slams deal +3.' },
    { id: 't_bulwark', name: 'Bulwark', mods: { guard: 2, riposteAlways: 1 }, text: '+2 Guard. Every perfect parry ripostes, braced or not.' },
    { id: 't_breaker', name: 'Breaker', mods: { dazedVuln: 3, markDmg: 2 }, text: '+3 damage to Dazed foes and +2 to Marked foes.' },
    { id: 't_unmoved', name: 'Unmoved', mods: { darkDreadImmune: 1, saveBonus: 3 }, text: 'No Dread from darkness. +3 to Dread saves.' },
  ],
  scholar: [
    { id: 't_piercing', name: 'Piercing Brine', mods: { boltPush: 1 }, text: 'Every Brine Bolt that hits pushes the foe 1 tile.' },
    { id: 't_longread', name: 'Long Reading', mods: { markLong: 1, markDmg: 2 }, text: 'Marks last 1 extra round; +2 damage to Marked foes.' },
    { id: 't_lamplight', name: 'Lamplight', mods: { light: 1, atk: 1 }, text: 'Lantern +1 radius while carried. +1 to hit.' },
    { id: 't_twice', name: 'Drowned Twice', mods: { maxHp: 6, swimHero: 1 }, text: '+6 max HP. You can wade deep water and never drown.' },
  ],
  ringer: [
    { id: 't_ironpeal', name: 'Iron Peal', mods: { tollDc: 2, tollPush: 1 }, text: 'Toll DC +2 and pushes 1 further.' },
    { id: 't_vespers', name: 'Vespers', mods: { chimeBonus: 4, chimeDread: 5 }, text: 'Chime heals +4 and calms +5.' },
    { id: 't_funeral', name: 'Funeral Bell', mods: { dmg: 2, dazedVuln: 3 }, text: 'Knell +2 damage. Dazed foes take +3 from everyone.' },
    { id: 't_calm', name: 'Calm Hands', mods: { saveBonus: 3, parry: 40 }, text: '+3 to Dread saves and a wider parry window.' },
  ],
};
export const talentById = (id) => Object.values(TALENTS).flat().find((t) => t.id === id);

// ---------- Dread outcomes ----------
export const FLAWS = {
  hopeless: { name: 'Hopeless', text: 'Disadvantage on every attack.' },
  paranoid: { name: 'Paranoid', text: 'Will not end a move next to an ally.' },
  reckless: { name: 'Reckless', text: '+2 Move, but −3 Guard.' },
  haunted: { name: 'Haunted', text: 'Gains 50% more Dread.' },
  tremulous: { name: 'Tremulous', text: 'Parry window is halved.' },
  frail: { name: 'Frail', text: 'Takes +2 damage from every hit.' },
};
export const VIRTUES = {
  resolve: { name: 'Resolute', text: 'Next attack is a guaranteed critical hit.' },
  stalwart: { name: 'Stalwart', text: '+3 Guard for the rest of the fight.' },
  inspiring: { name: 'Inspiring', text: 'Every other hero loses 20 Dread, and the party gains 1 Fate.' },
  focused: { name: 'Focused', text: 'Advantage on every attack for the rest of the fight.' },
};

// ---------- hero barks ----------
export const BARKS = {
  warden: {
    crit: ['For the gate!', 'Stay down.', 'That one was for Lowmarsh.'],
    hit: ['Hold.', 'Back to the water.', 'Again.'],
    shove: ['In you go.', 'The lake can have you.'],
    hurt: ['Not yet.', 'I held worse for nine days.'],
    allyDown: ['No. Not again. Not again.', 'Get behind me. All of you.'],
    flaw: ['The gate is open. The gate is OPEN.', 'I can hear the water coming.'],
    virtue: ['I am the floodgate.', 'Come, then.'],
    kill: ['One fewer.', 'Rest.'],
  },
  scholar: {
    crit: ['I know your name.', 'Chapter and verse.', 'Footnote: dead.'],
    hit: ['As written.', 'Predictable.', 'Brine to brine.'],
    shove: ['Out of my light.'],
    hurt: ['That will scar the margins.', 'Ink and blood. Same colour, down here.'],
    allyDown: ['Get up. That is not in the ending.', 'No, no, no, I read this page.'],
    flaw: ['The pages are wet. I cannot read them.', 'Everyone is whispering my name.'],
    virtue: ['I have read the last page. We live.', 'I know how this ends.'],
    kill: ['Closed.', 'Struck from the record.'],
  },
  ringer: {
    crit: ['The hour has come!', 'BONG.', 'Ring out!'],
    hit: ['Hush now.', 'On the hour.', 'Steady.'],
    shove: ['Off with you.'],
    hurt: ['Old bones. Still ringing.', 'I have rung through worse storms.'],
    allyDown: ['I will ring for you, child.', 'Up! The bell is not done with you.'],
    flaw: ['Which hour is it? Which hour?', 'The bell is ringing by itself.'],
    virtue: ['Every hour, on the hour. Even this one.', 'Listen to me. LISTEN.'],
    kill: ['Rest, poor thing.', 'Your hour is done.'],
  },
};

// ---------- encounters ----------
export const ENCOUNTERS = {
  1: [['cultist', 'cultist', 'snuffer'], ['cultist', 'husk', 'gutter'], ['snuffer', 'choir', 'cultist'], ['gutter', 'gutter', 'cultist']],
  2: [['cultist', 'eel', 'husk', 'gutter'], ['choir', 'husk', 'snuffer', 'cultist'], ['eel', 'cultist', 'censer', 'choir'], ['husk', 'gutter', 'gutter', 'censer']],
  3: [['husk', 'eel', 'choir', 'cultist', 'censer'], ['husk', 'husk', 'snuffer', 'choir', 'gutter'], ['eel', 'eel', 'cultist', 'snuffer', 'censer'], ['gutter', 'gutter', 'husk', 'censer', 'choir']],
  elite: [['knight', 'cultist', 'choir'], ['knight', 'husk', 'snuffer'], ['knight', 'censer', 'gutter']],
  boss: [['bishop', 'husk', 'cultist']],
};

// Legend: . floor , shallow ~ deep # pillar ^ dais B lit brazier b cold brazier
//         C reliquary chest  H hero spawn  E enemy spawn
// Every room keeps deep water within reach of the enemy spawns, so the shove is always on the table.
export const ROOMS = {
  nave: { name: 'The Flooded Nave', props: 'pews', rows: [
    '...,,~~,....E',
    '.B.,~~~,..#.b',
    'H..,~~~,..E..',
    '.#..,,,,..^^^',
    'H...,,,...^b^',
    '.#..,,,,..^^^',
    'H..,~~~,..E..',
    '.b.,~~~,..#.B',
    '...,,~~,...EC',
  ] },
  ossuary: { name: 'The Ossuary Steps', props: 'bones', rows: [
    'C..#....^^^^E',
    '...#..,,^^^^.',
    'H.....,,^^b^E',
    '..B...~~~.^^.',
    'H....~~~~~...',
    '..#...~~~.#..',
    'H....,,.....E',
    '...b.,,..#...',
    '.....#....E.C',
  ] },
  cloister: { name: 'The Drowned Cloister', props: 'statues', rows: [
    'H....,,,....C',
    '.b..~~~~~..#.',
    'H..~~,,,~~...',
    '...~,^^^,~.E.',
    'H..,,^B^,,...',
    '...~,^^^,~.E.',
    '.#.~~,,,~~...',
    '....~~~~~..bE',
    'C....,,,.....',
  ] },
  crypt: { name: 'The Bell-Tower Crypt', props: 'tombs', rows: [
    'H.#...#...#.C',
    '...........E.',
    'H.#.b.#.,.#..',
    '....,,,,,....',
    'H.~~~,B,~~~.E',
    '....,,,,,....',
    '..#...#.,.#..',
    '.b.........E.',
    'C.#...#...#..',
  ] },
  sluice: { name: 'The Sluice Gallery', props: 'chains', rows: [
    '....~~~~~...E',
    'H...~~~~~.b..',
    '....,,,,,..#.',
    'H.B.,^^^,...E',
    '....,^C^,....',
    'H...,^^^,...E',
    '.#..,,,,,..#.',
    '....~~~~~.B..',
    '....~~~~~....',
  ] },
  baptistry: { name: 'The Sunken Baptistry', props: 'statues', rows: [
    'H...#.....~~E',
    '..b.......~~.',
    'H...,,,,..~~.',
    '....,~~,..b.E',
    'H..#,~~,#....',
    '....,~~,.....',
    '..B.,,,,...^^',
    '.........#^^E',
    'C.........^^C',
  ] },
  apse: { name: "The Bishop's Apse", props: 'pews', rows: [
    'C.#.~~~~~.#.C',
    '....~~~~~....',
    '.B..,,,,,..b.',
    'H...,^^^,..E.',
    'H...,^E^,..E.',
    'H...,^^^,..E.',
    '.b..,,,,,..B.',
    '....~~~~~....',
    '..#.~~~~~.#..',
  ] },
  narthex: { name: 'The Flooded Narthex', props: 'pews', rows: [
    '.............',
    '..#......#...',
    '.B...,,......',
    'H....,,.~~~..',
    '.H....E.~~~..',
    '.....,,.~~~..',
    '..#.b........',
    '..........E..',
    '.............',
  ] },
};
export const COMBAT_ROOMS = ['nave', 'ossuary', 'cloister', 'crypt', 'sluice', 'baptistry'];

// ---------- curio events ----------
// option: { label, stat, dc, best (suggested hero), only (hero-gated), needItem, pass, fail }
// No stat = no roll (a choice). Outcomes: text, dread, dreadAll, hurt, hurtAll, healAll, silver,
// loot ('relic'|'item'|'consumable'), fate, give, take, talent, flag, cure
export const EVENTS = [
  {
    id: 'altar', title: 'The Drowned Altar',
    text: 'A silver chalice sits on an altar under a hand-span of black water. Words are carved around its rim, worn almost smooth.',
    options: [
      { label: 'Read the inscription', stat: 'WIS', dc: 13, best: 'scholar', stakes: 'Fail: something answers.',
        pass: { text: 'The words are a blessing. The chalice comes up warm in {hero}\'s hands.', loot: 'relic' },
        fail: { text: 'The words are a name, and something answers to it. {hero} hears it all night.', dread: 25 } },
      { label: 'Pry it loose', stat: 'STR', dc: 12, best: 'warden', stakes: 'Fail: rusted iron, sharp.',
        pass: { text: 'Stone cracks. Silver is silver.', silver: 35 },
        fail: { text: 'The altar bites back. Rusted iron through {hero}\'s palm.', hurt: 7 } },
      { label: 'Leave it to the lake', pass: { text: 'Some things belong to the lake. Walking away feels like a small victory.', dreadAll: -5 } },
    ],
  },
  {
    id: 'confession', title: 'The Confessional',
    text: 'A voice behind the lattice asks for a confession. It sounds like someone you lost.',
    options: [
      { label: 'Confess something true', stat: 'CHA', dc: 13, best: 'ringer', stakes: 'Fail: it laughs.',
        pass: { text: '{hero} says the thing they never said. The voice thanks them and goes quiet.', dreadAll: -25 },
        fail: { text: 'It laughs. It was never them.', dreadAll: 15 } },
      { label: 'Ring the hour at it', only: 'ringer', pass: { text: 'Old Hesk rings the hour. The voice stops mid-word, and a purse of tithes drops through the lattice.', silver: 30 } },
      { label: 'Walk past', pass: { text: 'You do not look back. You hear it say your name anyway.', dreadAll: 5 } },
    ],
  },
  {
    id: 'eels', title: 'The Eel Pit',
    text: 'Something glints at the bottom of a pit full of eels. A reliquary, half-open.',
    options: [
      { label: 'Reach in fast', stat: 'DEX', dc: 14, best: 'scholar', stakes: 'Fail: the eels get you, and you get nothing.',
        pass: { text: 'In and out. The eels get nothing but a sleeve.', loot: 'item' },
        fail: { text: 'In, and the eels get a great deal. {hero} comes out empty-handed and bleeding.', hurt: 8 } },
      { label: 'Stun them with the bell', only: 'ringer', pass: { text: 'One clean peal and the water goes still. Old Hesk fishes the reliquary out with her crook.', loot: 'item' } },
      { label: 'Pour in Oil and light it', needItem: 'c_oil', pass: { text: 'The pit boils. You wait, then take what is left.', loot: 'relic', take: 'c_oil' } },
      { label: 'Leave it', pass: { text: 'The eels watch you go. You choose not to want it.', dreadAll: -5 } },
    ],
  },
  {
    id: 'pilgrim', title: 'The Last Pilgrim',
    text: 'A pilgrim sits on the stairs, lantern dead, too tired to rise. He has a satchel and a cough.',
    options: [
      { label: 'Share your light and a bandage', needItem: 'c_bandage', pass: { text: 'He presses a small charm into your hand before he sleeps. "For the dark parts."', loot: 'item', take: 'c_bandage', flag: 'pilgrimHelped', dreadAll: -10 } },
      { label: 'Ask him the way down', stat: 'CHA', dc: 11, best: 'ringer', stakes: 'Fail: he is wrong.',
        pass: { text: '"Left at the weeping saint. Never right." He is correct.', fate: 1 },
        fail: { text: 'He tells you. He is wrong. You lose an hour and some skin.', hurtAll: 3 } },
      { label: 'Take the satchel', pass: { text: 'He does not resist. You will remember that, and so will the lake.', silver: 30, dreadAll: 12, flag: 'pilgrimRobbed' } },
    ],
  },
  {
    id: 'mirror', title: 'The Saint in the Mirror',
    text: 'A tall mirror stands in the water. In it, the chapel is dry and full of candles.',
    options: [
      { label: 'Step through', stat: 'WIS', dc: 14, best: 'scholar', stakes: 'Fail: not all of you comes back.',
        pass: { text: 'For one breath it is morning. Everyone comes back steadier.', dreadAll: -30, healAll: 5 },
        fail: { text: 'You come back. Not all of you.', dreadAll: 18, hurtAll: 2 } },
      { label: 'Smash it for the silver frame', stat: 'STR', dc: 10, best: 'warden', stakes: 'Pass costs a Fate. Fail: glass.',
        pass: { text: 'Seven years of bad luck, forty pieces of silver.', silver: 40, fate: -1 },
        fail: { text: 'Glass everywhere.', hurt: 5 } },
      { label: 'Leave it', pass: { text: 'The candles in the mirror go out one by one as you leave.' } },
    ],
  },
  {
    id: 'font', title: 'The Still Font',
    text: 'A baptismal font of perfectly still water, untouched by the flood. It smells of rain.',
    options: [
      { label: 'Drink', stat: 'WIS', dc: 10, best: 'ringer', stakes: 'Fail: it was lake water.',
        pass: { text: 'Clean. Cold. Healing.', healAll: 8 },
        fail: { text: 'It was lake water after all.', hurtAll: 2, dreadAll: 6 } },
      { label: 'Bottle it', pass: { text: 'You fill a flask. It may be holy. It may just be water.', give: 'c_holy' } },
      { label: 'Wash the wounded hero', pass: { text: 'The worst of the wounds closes. The water turns pink and then, impossibly, clear again.', healLowest: 15 } },
    ],
  },
  {
    id: 'choirloft', title: 'The Drowned Choir Loft',
    text: 'Above the water line, a choir of drowned children is still singing the evening hymn. They have not noticed you yet.',
    options: [
      { label: 'Join the hymn', stat: 'CHA', dc: 13, best: 'ringer', stakes: 'Fail: they notice you.',
        pass: { text: 'You find the harmony. They sing you a blessing as you pass, and it clings like warmth.', dreadAll: -20, fate: 1 },
        fail: { text: 'You are flat. Every small face turns toward you at once.', dreadAll: 20 } },
      { label: 'Cut the bell-rope above them', stat: 'STR', dc: 12, best: 'warden', stakes: 'Fail: the rope fights back.',
        pass: { text: 'The bell falls, and the hymn ends mid-note. A child\'s offering-box rolls to your feet.', silver: 25, loot: 'consumable' },
        fail: { text: 'The rope whips back across {hero}\'s face.', hurt: 6 } },
      { label: 'Listen from the stairs', stat: 'WIS', dc: 14, best: 'scholar', stakes: 'Fail: the song gets in.',
        pass: { text: 'Between the verses they sing the Bishop\'s name, and how he drowned. {hero} learns something.', talent: true },
        fail: { text: 'The song gets in. It will be in there for a while.', dread: 25 } },
    ],
  },
  {
    id: 'armour', title: 'The Knight in the Reeds',
    text: 'A drowned knight kneels in the shallows, still in full plate, sword across his knees. Barnacles have made him part of the floor.',
    options: [
      { label: 'Pry the sword from his hands', stat: 'STR', dc: 14, best: 'warden', stakes: 'Fail: he does not want to let go.',
        pass: { text: 'The fingers give, one by one. It is a good blade. It is a cursed blade.', loot: 'item', lootRarity: 'cursed' },
        fail: { text: 'His grip tightens. Something in the plate is still awake.', hurt: 8, dreadAll: 8 } },
      { label: 'Say the rite for the drowned', stat: 'WIS', dc: 12, best: 'ringer', stakes: 'Fail: he stays.',
        pass: { text: 'The plate sags, empty at last. A relic falls from the gauntlet.', loot: 'relic' },
        fail: { text: 'You stumble on the words. He stays.' } },
      { label: 'Salute him and move on', pass: { text: 'Brannoc salutes. He does not say why.', dreadAll: -8 } },
    ],
  },
  {
    id: 'dice', title: 'The Dice of Saint Wend',
    text: 'A grinning skeleton sits at a card table on a sunken bandstand, a bone die in each hand. "One roll," it rattles. "Highest wins. Twenty silver."',
    options: [
      { label: 'Roll against him (20 silver)', gamble: 20, pass: { text: 'You win. The skeleton laughs and pays double.', silver: 40 }, fail: { text: 'You lose. The skeleton rattles happily and pockets your silver.' } },
      { label: 'Cheat', stat: 'DEX', dc: 15, best: 'scholar', stakes: 'Fail: he notices.',
        pass: { text: 'The die lands on twenty. The skeleton pays, and gives you the die as well. "You earned it."', offer: 'gamblerdie', silver: 20 },
        fail: { text: 'The skeleton notices. Its jaw falls off laughing, then it bites.', hurt: 6, silver: -15 } },
      { label: 'Decline', pass: { text: '"Coward," it says, fondly.' } },
    ],
  },
  {
    id: 'library', title: 'The Flooded Library',
    text: 'Shelves of drowned books, swollen to twice their size. Some of them are breathing.',
    options: [
      { label: 'Ysolde reads the breathing book', only: 'scholar', pass: { text: 'She reads it to the end. Her eyes are different afterwards, and she is better for it.', talent: true, dread: 15 } },
      { label: 'Search for maps', stat: 'WIS', dc: 12, best: 'scholar', stakes: 'Fail: wasted hours in the dark.',
        pass: { text: 'A survey of the lower chapels. You know where the vault is.', silver: 20, fate: 1 },
        fail: { text: 'Hours, gone. The dark got closer while you read.', dreadAll: 10 } },
      { label: 'Burn it for warmth', pass: { text: 'The books scream as they burn, but the fire is warm.', healAll: 5, dreadAll: 6 } },
    ],
  },
  {
    id: 'saint', title: 'The Weeping Saint',
    text: 'A stone saint weeps real water into the flood. One tear has hardened into a blue gem on her cheek.',
    options: [
      { label: 'Pray beside her', stat: 'WIS', dc: 12, best: 'ringer', stakes: 'Fail: she does not answer.',
        pass: { text: 'The weeping stops for a moment, and the whole party feels it.', cure: true, dreadAll: -15 },
        fail: { text: 'She does not answer. The tears keep coming.' } },
      { label: 'Take the tear-gem', pass: { text: 'It comes away easily. It should not have.', loot: 'item', lootRarity: 'cursed', dreadAll: 8 } },
      { label: 'Leave her be', pass: { text: '"Left at the weeping saint," someone once said. You go left.', dreadAll: -5 } },
    ],
  },
  {
    id: 'floodgate', title: 'The Floodgate',
    text: 'A rusted gate-wheel juts from the wall, the twin of the one Brannoc held at Lowmarsh. He stops walking.',
    options: [
      { label: 'Let Brannoc turn the wheel', only: 'warden', pass: { text: 'He turns it until his hands bleed. Water drains from the corridor ahead. When he speaks, it is quiet: "That one stayed shut." He seems lighter.', dread: -40, talent: true } },
      { label: 'Talk him past it', stat: 'CHA', dc: 12, best: 'ringer', stakes: 'Fail: he will not move for an hour.',
        pass: { text: '"It was not your gate to hold alone." He nods, once.', dreadAll: -10 },
        fail: { text: 'He stands there for a long time. The dark does not wait.', dreadAll: 12 } },
      { label: 'Break the wheel off for scrap', stat: 'STR', dc: 11, best: 'warden', stakes: 'Fail: it does not break.',
        pass: { text: 'Good iron. Brannoc does not watch you do it.', silver: 30, dread: 10 },
        fail: { text: 'It does not break. It was built to hold.', hurt: 4 } },
    ],
  },
  {
    id: 'ferrymanbrother', title: 'The Ferryman\'s Brother',
    text: 'A second hooded figure poles a boat across the chamber, identical to the Ferryman except for the smile. "Trade?" he asks.',
    options: [
      { label: 'Trade 25 silver for a Relic', costSilver: 25, pass: { text: 'He hands it over with a wink. It is probably real.', loot: 'relic' } },
      { label: 'Trade a hero\'s blood (6 HP each)', pass: { text: 'He takes a little from each of you, in a small glass. He gives back a lot of silver.', hurtAll: 6, silver: 45 } },
      { label: 'Refuse', pass: { text: '"My brother is cheaper," he says. "But I am honest."' } },
    ],
  },
  {
    id: 'cradle', title: 'The Empty Cradle',
    text: 'A cradle floats in a flooded nursery, rocking by itself. Something small is humming inside it.',
    options: [
      { label: 'Look inside', stat: 'WIS', dc: 13, best: 'scholar', stakes: 'Fail: you should not have.',
        pass: { text: 'Only a music box, wound by the current. Inside the lid, someone hid their savings.', silver: 30 },
        fail: { text: 'It is not empty. You will not talk about what was inside.', dreadAll: 22 } },
      { label: 'Rock it to stillness', stat: 'CHA', dc: 11, best: 'ringer', stakes: 'Fail: it rocks harder.',
        pass: { text: 'Old Hesk hums along until the cradle stops. Everyone breathes easier.', dreadAll: -15 },
        fail: { text: 'It rocks harder. The humming turns into crying.', dreadAll: 12 } },
      { label: 'Close the door', pass: { text: 'You close the door. The humming follows you for a while.', dreadAll: 4 } },
    ],
  },
];

// ---------- narrator ----------
// {hero} {foe} {room} {hp} {nat} are filled in from context.
export const LINES = {
  runStart: [
    'The lake gave the city back. It did not give back the people.',
    'Down, then. The bells are ringing, and nobody down there is ringing them.',
    'Three lights go down into the cathedral. The lake keeps count.',
  ],
  roomStart: [
    'The water in {room} is very still. Stillness is a lie the lake tells.',
    'Candles gutter in {room}. Something in the dark changes its mind about sleeping.',
    'Another chapel, another congregation that never left.',
    'Stone, water and old incense. Under it, rot.',
    '{room}. The air tastes of pennies and prayer.',
  ],
  heroHit: [
    '{hero} hits the {foe}, and stone remembers that blow.', 'A clean strike from {hero}. The dead approve.', 'Bone gives way under {hero}\'s blow, as bone does.',
    '{hero} finds the soft place in the {foe}.', 'The {foe} staggers. {hero} does not.', 'Wet, heavy, final enough: {hero} lands it.',
    'The {foe} learns what {hero} is for.', '{hero} strikes true.',
  ],
  heroMiss: [
    '{hero}\'s blow finds only water.', 'Close, and close counts for nothing.', 'The dark leans out of {hero}\'s way.',
    'The {foe} is not where {hero} thought it was.', 'A miss. The lake is patient.', '{hero} swings at a shadow.',
  ],
  crit: [
    'A natural twenty! {hero} strikes, and the chapel holds its breath.', 'Twenty! The kind of blow that becomes a hymn about {hero}.',
    'Fate leans toward {hero}, just once.', 'The {foe} will not forget that. It will not have long to remember it.',
  ],
  critKill: ['A natural twenty, and the {foe} simply stops existing.', '{hero} rolls high, and the {foe} drops in two pieces.'],
  fumble: ['A one. Even the drowned laugh at {hero}.', 'A fumble. The lake is entertained.', 'Steel slips on wet stone. Embarrassing, and loud.'],
  enemyHit: ['The {foe} finds {hero}.', 'A wet, ugly blow lands on {hero}.', 'Pain, sharp and real. {hero} grits their teeth.', 'The {foe} draws blood from {hero}.'],
  parry: ['Parried! Iron sings in the dark.', '{hero} turns the blow aside, perfectly.', 'Not today, {foe}.'],
  dodge: ['A step, a twist. The {foe} finds only air.', '{hero} is gone before the blow lands.'],
  drown: ['The {foe} thrashes once. The black water closes like a door.', 'Under it goes. The lake keeps what it takes.', 'Bubbles, then nothing. Then not even bubbles.'],
  drownElite: ['The {foe} sinks in full armour, and comes up raging. The lake will not take something that big all at once.'],
  snuff: ['A brazier dies. The dark comes forward to fill the space.', 'Pinched out like a prayer. The shadows grow bolder.'],
  kindle: ['Fire returns. For a moment {room} remembers being holy.', 'Flame catches. The dark backs away, sulking.'],
  kill: ['The {foe} falls, and stays fallen. Good.', 'One fewer voice in the choir.', 'Back to the silt with you, {foe}.', '{hero} ends it.'],
  heroDown: ['{hero} falls. The water does not care who they were.', 'Down goes {hero}, and the light dims with them.'],
  lowHp: ['{hero} sways at {hp} HP and does not fall.', 'Blood in the water. {hero}\'s blood. Still standing.'],
  dreadFail: ['Something breaks behind {hero}\'s eyes.', 'The dark gets into {hero}. It always does, eventually.'],
  dreadPass: ['The dark pressed in on {hero}, and {hero} pressed back.', 'Fear, then defiance. {hero} burns brighter.'],
  victory: ['{room} falls silent. The good kind of silent.', 'The last of them sinks. You are all still standing.'],
  victoryHurt: ['The last of them sinks. Not everyone is standing, but enough are.'],
  victorySolo: ['{hero} stands alone in {room}. The lake lets them leave, this time.'],
  defeat: ['The water keeps them. The water keeps everyone, eventually.', 'The Vigil ends here. The bells keep ringing without you.'],
  mark: ['Seen. Named. Lessened.', 'Ysolde reads the {foe}\'s name in the dark.'],
  brace: ['Feet planted. Let it come.', 'Brannoc sets his shield like a floodgate.'],
  toll: ['The hour tolls. Lesser things forget what they were doing.', 'BONG. Even the dead must stop for the hour.'],
  chime: ['A clear note. Hearts slow.', 'The chime says: not yet. Not yet.'],
  lantern: ['The lantern arcs through the dark, a small falling sun.', 'Thrown light. Bold.'],
  husk: ['Something rises from the water, and it was waiting for you.'],
  pull: ['A hook in the dark, and {hero} is dragged screaming.', 'Barbed line, wet rope, a terrible pull. {hero} goes with it.'],
  chest: ['A reliquary, sealed with wax and older things.', 'Treasure. The drowned kept it for someone. Now it is you.'],
  fateTurn: ['Fate bends, and the miss becomes a hit.', 'You spend a little luck. It buys a lot.'],
  heal: ['The Censer-Monk swings smoke over the {foe}. Its wounds close.'],
  boss: ['The Bishop rises. He has preached to the fish for forty years, and now he has a congregation.'],
  bossHalf: ['The Bishop roars a psalm backwards. The water answers, and the apse begins to flood.'],
};

// ---------- camp upgrades (meta progression) ----------
export const UPGRADES = [
  { id: 'lantern', name: 'Lantern-Maker', desc: ['+1 Fate at the start of each run', '+1 more Fate', '+1 more Fate (6 total)'], cost: [40, 90, 160] },
  { id: 'chapel', name: 'Shore Chapel', desc: ['Heroes start runs with 0 Dread', 'Sanctuaries also cure every Flaw', '+2 to all Dread saves'], cost: [35, 80, 150] },
  { id: 'forge', name: 'Salt Forge', desc: ['Start with a Blessed weapon', 'Start with a Relic weapon instead', 'Every hero starts with a Blessed weapon'], cost: [50, 110, 190] },
  { id: 'ossuary', name: 'Ossuary of Saints', desc: ['First loot pick of each run is all Relics', 'Elites offer 4 choices', 'Start each run with a random Relic'], cost: [45, 100, 180] },
  { id: 'yard', name: 'Training Yard', desc: ['Each hero starts with 1 Talent', 'Talent picks offer 3 choices', 'Each hero starts with 2 Talents'], cost: [50, 110, 200] },
  { id: 'reliquary', name: 'Quartermaster', desc: ['Start with an Oil Flask', '+1 satchel slot', 'Start with 50 Silver'], cost: [30, 70, 130] },
];
