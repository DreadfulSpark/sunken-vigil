"""Copies the chosen CC0 recordings into assets/sfx and writes assets/sfx/manifest.json.

usage: python -I tools/build_audio.py <dir holding the unzipped packs> <out dir>

Each game sound maps to several recorded takes. audio.js picks one at random,
never the same take twice in a row, with small pitch and volume changes.
Keys match the sfx.* calls in src/audio.js.
"""
import glob, json, os, shutil, sys

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)


def find(pattern):
    hits = sorted(f for f in glob.glob(os.path.join(SRC, '**', pattern), recursive=True) if '._' not in os.path.basename(f))
    if not hits:
        raise SystemExit(f'missing: {pattern}')
    return hits


def take(prefix, *patterns):
    names = []
    for p in patterns:
        for i, f in enumerate(find(p)):
            ext = os.path.splitext(f)[1].lower()
            name = f'{prefix}_{len(names)}{ext}'
            shutil.copyfile(f, os.path.join(OUT, name))
            names.append(name)
    return names


S = {}
def snd(key, files, **mix):
    S[key] = {'files': files, **mix}

# UI
snd('click', take('click', 'click_00[1-3].ogg'), vol=0.45, wet=0)
snd('hover', take('hover', 'tick_00[12].ogg'), vol=0.18, wet=0, rate=[0.95, 1.1])
snd('select', take('select', 'select_00[1-3].ogg'), vol=0.45, wet=0.05)
snd('denied', take('denied', 'error_00[12].ogg'), vol=0.35, wet=0)
snd('ring', take('ring', 'tick_004.ogg'), vol=0.2, wet=0)
snd('page', take('page', 'bookFlip[123].ogg'), vol=0.55, wet=0.1)
snd('equip', take('equip', 'chainmail[12].wav', 'armor-light.wav', 'beltHandle[12].ogg'), vol=0.6, wet=0.08)
snd('coin', take('coin', 'item_coins_0[1-4].ogg', 'handleCoins*.ogg'), vol=0.6, wet=0.12)
snd('chest', take('chest', 'wooded_box_open.ogg', 'lock_open_01.ogg', 'metal_open_01.ogg'), vol=0.7, wet=0.2)
snd('loot', take('loot', 'item_gem_0[1-4].ogg'), vol=0.55, wet=0.3, layer=True)  # gem chime under the rarity fanfare

# movement and dice
snd('step', take('step', 'footstep_concrete_00[0-4].ogg'), vol=0.5, wet=0.12)
snd('wade', take('wade', 'splash_0[1-4].ogg'), vol=0.3, wet=0.12, rate=[1.1, 1.3])
snd('splash', take('splash', 'splash_1[0-5].ogg'), vol=0.85, wet=0.3, rate=[0.8, 0.95])
snd('dice', take('dice', 'dice-throw-[123].ogg', 'die-throw-[12].ogg'), vol=0.8, wet=0.05)
snd('land', take('land', 'impact_wood_light_00[0-4].ogg'), vol=0.45, wet=0.08)
snd('whoosh', take('whoosh', 'swing*.wav', 'cloth-heavy.wav'), vol=0.55, wet=0.1)
snd('dodge', take('dodge', 'cloth[1-4].ogg', 'swing2.wav'), vol=0.6, wet=0.1)

# combat
snd('hit', take('hit', 'impact_punch_medium_00[0-4].ogg'), vol=0.85, wet=0.18, also=['armour'])
snd('armour', take('armour', 'impact_plate_light_00[0-4].ogg'), vol=0.3, wet=0.2)
snd('bigHit', take('bighit', 'impact_punch_heavy_00[0-4].ogg'), vol=1.0, wet=0.25, rate=[0.85, 0.95], also=['armourHeavy'])
snd('armourHeavy', take('armourh', 'impact_plate_heavy_00[0-4].ogg'), vol=0.45, wet=0.3)
snd('slam', take('slam', 'metal_slam_01.ogg', 'impact_metal_heavy_00[0-4].ogg'), vol=0.9, wet=0.3, rate=[0.75, 0.9])
snd('miss', take('miss', 'swing*.wav'), vol=0.5, wet=0.1, rate=[1.0, 1.15])
snd('crit', take('crit', 'impact_plate_heavy_00[0-4].ogg'), vol=1.0, wet=0.35, layer=True, also=['ringOut'])
snd('ringOut', take('ringout', 'metal-ringing.wav'), vol=0.45, wet=0.4)
snd('fumble', take('fumble', 'metal_falling_0[12].ogg'), vol=0.6, wet=0.2)
snd('parry', take('parry', 'impact_metal_medium_00[0-4].ogg'), vol=1.0, wet=0.35, rate=[1.0, 1.12], also=['ringOut'])
snd('brace', take('brace', 'chainmail[12].wav', 'armor-light.wav'), vol=0.75, wet=0.15, rate=[0.85, 0.95])
snd('hook', take('hook', 'chain_0[1-3].ogg'), vol=0.75, wet=0.25)
snd('death', take('death', 'creature_die_01.ogg', 'hurt_0[1-3].ogg'), vol=0.6, wet=0.35, rate=[0.75, 0.9])
snd('scream', take('scream', 'scream_0[12].ogg'), vol=0.5, wet=0.5, rate=[0.8, 0.95])
snd('raise', take('raise', 'stones_0[1-4].ogg'), vol=0.7, wet=0.45, layer=True, rate=[0.7, 0.85])

# light, dread and the bells
snd('kindle', take('kindle', 'spell_fire_0[1-3].ogg'), vol=0.7, wet=0.2)
snd('fire', take('fire', 'spell_fire_0[4-7].ogg'), vol=0.85, wet=0.3)
snd('snuff', take('snuff', 'breath.ogg'), vol=0.6, wet=0.3, rate=[1.1, 1.3])
snd('mark', take('mark', 'spell_0[12].ogg', 'magic1.wav'), vol=0.5, wet=0.4)
snd('dread', take('dread', 'shade[147].wav'), vol=0.35, wet=0.5, layer=True, rate=[0.8, 0.9])
snd('bell', take('bell', 'impact_bell_heavy_00[0-4].ogg'), vol=0.75, wet=0.6, rate=[0.85, 0.95])
snd('chime', take('chime', 'bell_0[1-3].ogg'), vol=0.5, wet=0.5)
snd('toll', take('toll', 'impact_bell_heavy_00[0-4].ogg'), vol=1.0, wet=0.8, rate=[0.55, 0.62], also=['gong'])
snd('gong', take('gong', 'gong_0[12].ogg'), vol=0.45, wet=0.6, rate=[0.7, 0.8])
snd('enemyPhase', take('ephase', 'gong_0[12].ogg'), vol=0.35, wet=0.7, rate=[0.55, 0.6], layer=True)

# ambience loops (played by sfx.ambience)
snd('ambWater', take('amb_water', 'loop_water_0[1-3].ogg'), vol=0.22, wet=0.2, rate=[1, 1])
snd('ambDrip', take('amb_drip', 'bubble_0[1-3].ogg'), vol=0.12, wet=0.6, rate=[0.6, 0.9])

with open(os.path.join(OUT, 'manifest.json'), 'w') as f:
    json.dump(S, f, indent=1)
print(len(S), 'sounds,', len(os.listdir(OUT)) - 1, 'files')
