// Pixel-art sprites built by tools/build_sprites.py from the CC0 Dungeon Crawl Stone Soup tiles.
// Loaded once under a 'px_' prefix so they never collide with the procedural textures.
export const SPRITES = ['banner', 'brazier', 'candles', 'chest', 'chest_open', 'dais0', 'dais1', 'dais2', 'deep', 'deep2', 'ev_altar', 'ev_armour', 'ev_choirloft', 'ev_confession', 'ev_cradle', 'ev_dice', 'ev_eels', 'ev_ferrymanbrother', 'ev_floodgate', 'ev_font', 'ev_library', 'ev_mirror', 'ev_pilgrim', 'ev_rest', 'ev_saint', 'ev_shop', 'ev_treasure', 'floor0', 'floor1', 'floor2', 'floor3', 'floorb0', 'floorb1', 'floorb2', 'floorb3', 'nd_boss', 'nd_elite', 'nd_event', 'nd_fight', 'nd_rest', 'nd_shop', 'nd_treasure', 'pillar0', 'pillar1', 'pillar2', 'prop_bones0', 'prop_bones1', 'prop_bones2', 'prop_chains0', 'prop_chains1', 'prop_chains2', 'prop_pews0', 'prop_pews1', 'prop_pews2', 'prop_statues0', 'prop_statues1', 'prop_statues2', 'prop_tombs0', 'prop_tombs1', 'prop_tombs2', 'shallow', 'shallow2', 'torch0', 'torch1', 'torch2', 'torch3', 'torch4', 'u3_bishop', 'u3_censer', 'u3_choir', 'u3_cultist', 'u3_eel', 'u3_gutter', 'u3_husk', 'u3_knight', 'u3_ringer', 'u3_scholar', 'u3_snuffer', 'u3_warden', 'u_bishop', 'u_censer', 'u_choir', 'u_cultist', 'u_eel', 'u_gutter', 'u_husk', 'u_knight', 'u_ringer', 'u_scholar', 'u_snuffer', 'u_warden', 'wall0', 'wall1', 'wall2', 'walld0', 'walld1'];

export function preloadSprites(scene) {
  if (scene.textures.exists('px_floor0')) return;
  for (const n of SPRITES) scene.load.image(`px_${n}`, `assets/sprites/${n}.png`);
  scene.load.image('art_abbey', 'assets/art/abbey.jpg');
}

// a unit's sprite key: 'u_' is 64px for the board, 'u3_' is 96px for portraits and bosses
export const unitKey = (kind, big = false) => `px_${big ? 'u3' : 'u'}_${kind}`;
