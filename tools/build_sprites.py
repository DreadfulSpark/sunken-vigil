"""Builds assets/sprites/ from the Dungeon Crawl Stone Soup 32x32 tiles (CC0).

usage: python -I tools/build_sprites.py <path to 'Dungeon Crawl Stone Soup Full'> <out dir>

Units are composited (heroes from paper-doll layers), outlined for silhouette
readability, colour-graded toward the game palette and upscaled with nearest
neighbour so pixels stay crisp. Tiles are graded the same way so every sprite
sits in one lighting world: drowned teal shadows, candle-amber highlights.
"""
import os, sys
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
T = 60  # board tile size in the game


def load(rel):
    return Image.open(os.path.join(SRC, rel)).convert('RGBA')


def layer(*rels):
    im = Image.new('RGBA', (32, 32))
    for r in rels:
        l = load(r)
        im.alpha_composite(l, (0, 0))
    return im


def grade(im, sat=0.82, tint=(16, 34, 38), amt=0.16, bright=1.0):
    """Pull everything toward the palette: slightly desaturated, teal in the shadows."""
    a = im.getchannel('A')
    rgb = ImageEnhance.Color(im.convert('RGB')).enhance(sat)
    if bright != 1.0:
        rgb = ImageEnhance.Brightness(rgb).enhance(bright)
    px = rgb.load()
    for y in range(rgb.height):
        for x in range(rgb.width):
            r, g, b = px[x, y]
            lum = (r * 0.3 + g * 0.59 + b * 0.11) / 255
            k = amt * (1 - lum)  # tint shadows more than highlights
            px[x, y] = (int(r * (1 - k) + tint[0] * k), int(g * (1 - k) + tint[1] * k), int(b * (1 - k) + tint[2] * k))
    out = rgb.convert('RGBA')
    out.putalpha(a)
    return out


def strip_shadow(im):
    """DCSS units carry a soft black ground shadow; the game draws its own."""
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a and r < 14 and g < 14 and b < 14 and y > 22:
                px[x, y] = (0, 0, 0, 0)
    return im


def outline(im, col=(6, 10, 12, 255)):
    a = im.getchannel('A').point(lambda v: 255 if v > 40 else 0)
    grown = a.filter(ImageFilter.MaxFilter(3))
    ol = Image.new('RGBA', im.size, col)
    ol.putalpha(grown)
    ol.alpha_composite(im)
    return ol


def up(im, n):
    return im.resize((im.width * n, im.height * n), Image.NEAREST)


def tile(im):
    """32px tile -> board tile: x2 nearest then a clean downsample to T."""
    return up(im, 2).resize((T, T), Image.LANCZOS)


def save(im, name):
    im.save(os.path.join(OUT, name + '.png'), optimize=True)


# ---------------- units ----------------
P = 'player/'
HEROES = {
    # Brannoc, Tidewarden: plate, teal cloak, war hammer and a kite shield
    'warden': layer(P + 'cloak/cyan.png', P + 'base/human_male.png', P + 'boots/middle_gray.png', P + 'legs/metal_gray.png',
                    P + 'body/plate_2.png', P + 'hair/short_black.png', P + 'beard/short_black.png', P + 'head/iron_1.png',
                    P + 'hand_right/hammer_2_new.png', P + 'hand_left/shield_knight_blue.png'),
    # Ysolde, Drowned Scholar: sea-green robe, hood, staff and a lantern
    'scholar': layer(P + 'cloak/blue.png', P + 'base/human_female.png', P + 'boots/short_brown.png', P + 'body/robe_blue_green.png',
                     P + 'hair/long_black.png', P + 'head/hood_cyan.png', P + 'hand_right/staff_mage.png', P + 'hand_left/misc/lantern.png'),
    # Old Hesk, Bell-Ringer: brown habit, white beard, flail and gong-bell
    'ringer': layer(P + 'cloak/brown.png', P + 'base/human_male.png', P + 'boots/middle_brown.png', P + 'body/robe_brown_2.png',
                    P + 'hair/short_white.png', P + 'beard/long_white.png', P + 'hand_right/flail_ball_new.png', P + 'hand_left/gong.png'),
}
M = 'monster/'
ENEMIES = {
    'cultist': M + 'vault/hell_wizard_100.png',
    'snuffer': M + 'necromancer_old.png',
    'gutter': M + 'undead/ghoul.png',
    'husk': M + 'undead/bog_body.png',
    'choir': M + 'undead/silent_spectre.png',
    'eel': M + 'aquatic/electric_eel.png',
    'censer': M + 'undead/mummy_priest.png',
    'knight': M + 'death_knight.png',
    'bishop': M + 'deep_elf_high_priest.png',
}
units = {k: v for k, v in HEROES.items()}
units.update({k: load(v) for k, v in ENEMIES.items()})
for k, im in units.items():
    im = strip_shadow(im)
    hero = k in HEROES
    im = grade(im, sat=0.95 if hero else 0.8, amt=0.08 if hero else 0.2, bright=1.08 if hero else 1.0)
    im = outline(im)
    save(up(im, 2), f'u_{k}')       # 64px, board token
    save(up(im, 3), f'u3_{k}')      # 96px, portraits and bosses

# ---------------- tiles ----------------
D = 'dungeon/'
floors = [D + f'floor/rect_gray_{i}_old.png' for i in range(4)]
for i, f in enumerate(floors):
    save(tile(grade(load(f), sat=0.6, amt=0.28, bright=0.62)), f'floor{i}')
for i in range(4):
    save(tile(grade(load(D + f'floor/tomb_{i}_old.png'), sat=0.5, amt=0.3, bright=0.55)), f'floorb{i}')
for i, n in enumerate(['crypt_domino_1a', 'crypt_domino_2a', 'crypt_domino_5a']):
    save(tile(grade(load(D + f'floor/{n}.png'), sat=0.9, amt=0.1, bright=1.25)), f'dais{i}')
save(tile(grade(load(D + 'water/deep_water.png'), sat=0.75, tint=(10, 60, 62), amt=0.35, bright=1.05)), 'deep')
save(tile(grade(load(D + 'water/deep_water_2.png'), sat=0.75, tint=(10, 60, 62), amt=0.35, bright=1.05)), 'deep2')
save(tile(grade(load(D + 'water/shallow_water.png'), sat=0.65, tint=(20, 70, 66), amt=0.35, bright=0.95)), 'shallow')
save(tile(grade(load(D + 'water/shallow_water_2.png'), sat=0.65, tint=(20, 70, 66), amt=0.35, bright=0.95)), 'shallow2')
for i, n in enumerate(['church_0', 'church_2', 'church_4']):
    save(tile(grade(load(D + f'wall/{n}.png'), sat=0.45, amt=0.35, bright=0.5)), f'wall{i}')
for i in range(2):
    save(tile(grade(load(D + f'wall/stone_2_dark{i}.png'), sat=0.5, amt=0.25, bright=0.9)), f'walld{i}')
save(up(grade(load(D + 'wall/banners/banner_1.png'), amt=0.15), 2), 'banner')
for i in range(5):
    save(up(load(D + f'wall/torches/torch_{i}.png'), 2), f'torch{i}')

# pillars (impassable '#') and other set pieces, kept at 64 so they overhang like real objects
def obj(rel, name, **g):
    save(up(outline(grade(load(rel), **g)), 2), name)

for i, n in enumerate(['statue_angel', 'statue_twins', 'statue_wraith']):
    obj(D + f'statues/{n}.png', f'pillar{i}', sat=0.5, amt=0.25, bright=0.85)
obj(D + 'altars/altar_base.png', 'brazier', sat=0.6, amt=0.2, bright=0.8)
obj(D + 'chest_2_closed.png', 'chest', sat=0.85, amt=0.1)
obj(D + 'chest_2_open.png', 'chest_open', sat=0.85, amt=0.1)

# room dressing, grouped by the room's prop kind in data.js
props = {
    'bones': [D + 'altars/altar_kikubaaqudgha.png', 'item/food/bone.png', D + 'sarcophagus_open.png'],
    'statues': [D + 'statues/crumbled_column_2.png', D + 'statues/crumbled_column_4.png', D + 'statues/statue_bases.png'],
    'tombs': [D + 'sarcophagus_open.png', D + 'altars/altar_base.png', D + 'statues/crumbled_column_5.png'],
    'chains': [D + 'statues/crumbled_column_1.png', 'item/food/bone.png', D + 'altars/altar_kikubaaqudgha.png'],
}
for kind, rels in props.items():
    for i, r in enumerate(rels):
        save(up(outline(grade(load(r), sat=0.55, amt=0.25, bright=0.85)), 2), f'prop_{kind}{i}')


# ---------------- hand-made pieces the pack lacks (same 32px pixel grid) ----------------
def pew(variant):
    im = Image.new('RGBA', (32, 32))
    d = ImageDraw.Draw(im)
    wood, dark, light = (92, 58, 34, 255), (48, 28, 18, 255), (138, 94, 56, 255)
    if variant == 2:  # toppled: seat on its side
        d.rectangle([4, 18, 27, 23], fill=wood); d.line([4, 18, 27, 18], fill=light); d.line([4, 23, 27, 23], fill=dark)
        d.rectangle([6, 13, 9, 17], fill=dark); d.rectangle([22, 24, 25, 27], fill=dark)
        return outline(im)
    d.rectangle([3, 8, 28, 12], fill=wood); d.line([3, 8, 28, 8], fill=light); d.line([3, 12, 28, 12], fill=dark)  # back
    for x in (7, 15, 23):
        d.line([x, 9, x, 11], fill=dark)
    d.rectangle([3, 15, 28, 19], fill=wood); d.line([3, 15, 28, 15], fill=light); d.line([3, 19, 28, 19], fill=dark)  # seat
    for x in (4, 26):
        d.rectangle([x, 12, x + 2, 24], fill=dark)
    if variant == 1:  # broken end
        d.polygon([(20, 8), (28, 8), (28, 19), (24, 19), (26, 13)], fill=(0, 0, 0, 0))
        d.line([20, 8, 24, 19], fill=dark)
    return outline(im)


for i in range(3):
    save(up(grade(pew(i), sat=0.9, amt=0.12), 2), f'prop_pews{i}')


def candles():
    im = Image.new('RGBA', (32, 32))
    d = ImageDraw.Draw(im)
    for x, h in ((9, 10), (14, 14), (20, 8), (24, 11)):
        d.rectangle([x, 26 - h, x + 2, 26], fill=(214, 202, 172, 255))
        d.line([x + 2, 26 - h, x + 2, 26], fill=(150, 138, 112, 255))
        d.point((x + 1, 25 - h), fill=(40, 30, 20, 255))
        d.rectangle([x, 26 - h + 2, x, 26 - h + 4], fill=(240, 232, 210, 255))  # wax drip
    d.rectangle([6, 26, 28, 28], fill=(70, 62, 52, 255))
    return outline(im)


save(up(candles(), 2), 'candles')
print('sprites written to', OUT, len(os.listdir(OUT)))


# ---------------- event set pieces (x4, 128px) and map icons ----------------
def pc(*rels):
    return layer(*rels)


EVENT = {
    'altar': load(D + 'altars/altar_elyvilon.png'),
    'confession': load(D + 'doors/runed_door.png'),
    'eels': load(M + 'aquatic/electric_eel.png'),
    'pilgrim': pc(P + 'cloak/gray.png', P + 'base/human_male.png', P + 'boots/short_brown.png', P + 'body/robe_gray_2.png',
                  P + 'beard/long_white.png', P + 'head/hood_gray.png', P + 'hand_right/staff_plain.png', P + 'hand_left/misc/lantern.png'),
    'mirror': load(D + 'statues/statue_princess.png'),
    'font': load(D + 'blue_fountain.png'),
    'rest': load(D + 'altars/altar_beogh.png'),
    'shop': load(M + 'necromancer_new.png'),
    'treasure': load(D + 'chest_2_open.png'),
    'floodgate': load(D + 'doors/vgate_runed_middle.png'),
    'choirloft': load(M + 'undead/ghost_new.png'),
    'armour': load(M + 'vault/vault_guard_old.png'),
    'dice': load(D + 'altars/altar_cheibriados_2.png'),
    'library': load(D + 'shops/shop_books.png'),
    'saint': load(D + 'statues/statue_angel.png'),
    'ferrymanbrother': load(M + 'necromancer_old.png'),
    'cradle': load(D + 'large_box.png'),
}
for k, im in EVENT.items():
    save(up(outline(grade(strip_shadow(im), sat=0.85, amt=0.15)), 4), f'ev_{k}')

ICONS = {
    'fight': M + 'undead/bog_body.png', 'elite': M + 'death_knight.png', 'boss': M + 'deep_elf_high_priest.png',
    'event': 'item/book/book_of_the_dead_new.png', 'shop': 'item/gold/gold_pile_16.png', 'treasure': D + 'chest_2_closed.png',
    'rest': D + 'altars/altar_beogh.png',
}
for k, rel in ICONS.items():
    save(up(outline(grade(strip_shadow(load(rel)), sat=0.9, amt=0.1)), 2), f'nd_{k}')
print('event + icon sprites written')
