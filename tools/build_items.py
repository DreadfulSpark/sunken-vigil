"""Builds one pixel-art icon per item: assets/sprites/it_<item id>.png (96px).

usage: python -I tools/build_items.py <path to 'Dungeon Crawl Stone Soup Full'> <out dir>

Items the DCSS set covers use its sprites. Bells, the anchor, dice, hourglass and other
pieces it lacks are drawn here on the same 32px grid with the same shading and outline.
"""
import os, sys
from PIL import Image, ImageDraw, ImageFilter

SRC, OUT = sys.argv[1], sys.argv[2]
I = 'item/'


def load(rel):
    return Image.open(os.path.join(SRC, rel)).convert('RGBA')


def no_shadow(im):
    # DCSS item sprites carry a soft pure-black drop shadow; the card draws its own light
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a and r < 16 and g < 16 and b < 16:
                px[x, y] = (0, 0, 0, 0)
    return im


def outline(im, col=(6, 10, 12, 255)):
    a = im.getchannel('A').point(lambda v: 255 if v > 40 else 0)
    ol = Image.new('RGBA', im.size, col)
    ol.putalpha(a.filter(ImageFilter.MaxFilter(3)))
    ol.alpha_composite(im)
    return ol


def canvas():
    im = Image.new('RGBA', (32, 32))
    return im, ImageDraw.Draw(im)


def shade(c, k):
    return tuple(max(0, min(255, int(v * k))) for v in c[:3]) + (255,)


# ---------- hand-drawn pieces ----------
def bell(metal, crack=False, teeth=False, ember=False):
    im, d = canvas()
    hi, mid, lo = shade(metal, 1.35), metal, shade(metal, 0.6)
    d.rectangle([14, 4, 17, 7], fill=lo)                     # handle loop
    d.point([(15, 4), (16, 4)], fill=hi)
    # body: dome widening into a flared lip
    rows = [(11, 8, 20), (12, 7, 22), (13, 7, 22), (14, 6, 23), (15, 6, 23), (16, 6, 23), (17, 5, 24), (18, 5, 24),
            (19, 5, 24), (20, 4, 25), (21, 4, 25), (22, 3, 26), (23, 3, 27)]
    d.ellipse([9, 7, 22, 14], fill=mid)
    for y, x0, x1 in rows:
        d.line([x0, y, x1, y], fill=mid)
        d.point((x0, y), fill=lo); d.point((x1, y), fill=lo)
        d.point((x0 + 2, y), fill=hi)
    d.line([3, 24, 28, 24], fill=lo); d.line([4, 25, 27, 25], fill=shade(metal, 0.45))  # lip
    d.line([8, 18, 22, 18], fill=lo)                          # band
    d.line([10, 9, 10, 15], fill=hi)                          # highlight
    d.rectangle([14, 25, 17, 27], fill=(40, 34, 30, 255))     # clapper
    d.point((15, 25), fill=(90, 80, 70, 255))
    if crack:
        d.line([(19, 12), (18, 15), (20, 18), (18, 22)], fill=(20, 16, 14, 255))
    if teeth:
        for x in range(5, 27, 3):
            d.polygon([(x, 24), (x + 2, 24), (x + 1, 27)], fill=(236, 228, 204, 255))
    if ember:
        d.line([4, 24, 27, 24], fill=(208, 64, 44, 255))
        d.point([(9, 20), (21, 16)], fill=(208, 64, 44, 255))
    return outline(im)


def anchor():
    im, d = canvas()
    iron, hi, lo = (120, 128, 128, 255), (176, 186, 184, 255), (64, 70, 70, 255)
    d.ellipse([12, 2, 19, 9], outline=iron, width=2)
    d.rectangle([15, 9, 16, 26], fill=iron); d.line([15, 9, 15, 26], fill=hi)
    d.rectangle([9, 11, 22, 12], fill=iron); d.line([9, 11, 22, 11], fill=hi)
    d.arc([5, 14, 26, 29], 20, 160, fill=iron, width=2)
    d.polygon([(4, 18), (8, 21), (5, 23)], fill=iron); d.polygon([(27, 18), (23, 21), (26, 23)], fill=iron)
    d.point([(16, 27), (10, 27)], fill=lo)
    # weed and rust
    d.line([(17, 14), (19, 17), (18, 20)], fill=(70, 110, 80, 255))
    d.point([(14, 22), (21, 26)], fill=(140, 80, 40, 255))
    return outline(im)


def die():
    im, d = canvas()
    face, top, side = (226, 216, 190, 255), (244, 238, 220, 255), (170, 160, 136, 255)
    d.polygon([(6, 11), (16, 6), (26, 11), (16, 16)], fill=top)
    d.polygon([(6, 11), (16, 16), (16, 28), (6, 23)], fill=face)
    d.polygon([(16, 16), (26, 11), (26, 23), (16, 28)], fill=side)
    pip = (40, 26, 20, 255)
    d.point([(16, 11)], fill=pip)
    for p in [(9, 15), (13, 22), (11, 18)]: d.rectangle([p[0], p[1], p[0] + 1, p[1] + 1], fill=pip)
    for p in [(19, 17), (23, 15), (19, 23), (23, 21)]: d.rectangle([p[0], p[1], p[0] + 1, p[1] + 1], fill=pip)
    return outline(im)


def hourglass():
    im, d = canvas()
    wood, wlo = (120, 78, 44, 255), (70, 44, 24, 255)
    glass, sand = (170, 210, 206, 120), (232, 190, 110, 255)
    d.rectangle([7, 3, 24, 5], fill=wood); d.rectangle([7, 26, 24, 28], fill=wood)
    d.line([7, 5, 24, 5], fill=wlo); d.line([7, 28, 24, 28], fill=wlo)
    d.rectangle([8, 6, 9, 25], fill=wlo); d.rectangle([22, 6, 23, 25], fill=wlo)
    d.polygon([(11, 6), (20, 6), (16, 15), (15, 15)], fill=glass)
    d.polygon([(15, 16), (16, 16), (20, 25), (11, 25)], fill=glass)
    d.polygon([(13, 10), (18, 10), (16, 14), (15, 14)], fill=sand)
    d.polygon([(12, 22), (19, 22), (20, 25), (11, 25)], fill=sand)
    d.line([15, 15, 15, 21], fill=sand)
    d.line([(17, 7), (19, 12)], fill=(30, 26, 24, 255))      # the crack
    d.point([(12, 8), (12, 18)], fill=(255, 255, 255, 200))
    return outline(im)


def coin():
    im, d = canvas()
    g, hi, lo = (212, 170, 80, 255), (255, 226, 140, 255), (130, 96, 40, 255)
    d.ellipse([5, 5, 26, 26], fill=lo); d.ellipse([5, 4, 26, 25], fill=g)
    d.ellipse([8, 7, 23, 22], outline=lo)
    d.rectangle([14, 12, 17, 16], fill=(20, 16, 12, 255))    # square hole
    d.arc([6, 5, 25, 24], 200, 260, fill=hi, width=2)
    d.point([(11, 10), (20, 19), (11, 19)], fill=lo)
    return outline(im)


def rope():
    im, d = canvas()
    r, hi, lo = (176, 140, 92, 255), (216, 184, 132, 255), (110, 82, 50, 255)
    d.line([16, 1, 16, 9], fill=r, width=2)
    d.ellipse([8, 10, 23, 26], outline=r, width=3)
    for y in range(11, 26, 3): d.point((9, y), fill=lo); d.point((22, y), fill=hi)
    d.rectangle([13, 8, 18, 12], fill=lo); d.line([13, 9, 18, 9], fill=hi)  # knot
    return outline(im)


def thimble():
    im, d = canvas()
    m, hi, lo = (176, 184, 184, 255), (230, 236, 236, 255), (100, 106, 108, 255)
    d.polygon([(10, 26), (11, 10), (21, 10), (22, 26)], fill=m)
    d.ellipse([11, 6, 21, 13], fill=m)
    d.line([10, 26, 22, 26], fill=lo); d.line([10, 24, 22, 24], fill=hi)
    for y in range(10, 23, 3):
        for x in range(13, 21, 3): d.point((x, y), fill=lo)
    d.line([12, 9, 12, 22], fill=hi)
    return outline(im)


def satchel():
    im, d = canvas()
    l, hi, lo = (122, 84, 50, 255), (164, 118, 74, 255), (70, 46, 26, 255)
    d.arc([9, 3, 23, 17], 180, 360, fill=lo, width=2)
    d.rounded_rectangle([5, 10, 27, 27], 3, fill=l)
    d.polygon([(5, 10), (27, 10), (25, 18), (7, 18)], fill=hi)
    d.line([7, 18, 25, 18], fill=lo)
    d.rectangle([15, 16, 17, 20], fill=(200, 170, 90, 255))
    d.point([(8, 22), (24, 25)], fill=lo)
    return outline(im)


def bandage():
    im, d = canvas()
    c, hi, lo = (222, 214, 196, 255), (246, 242, 230, 255), (160, 150, 130, 255)
    d.ellipse([5, 8, 20, 23], fill=c)
    d.ellipse([9, 12, 16, 19], outline=lo)
    d.polygon([(16, 18), (28, 22), (27, 27), (14, 22)], fill=c)
    d.line([(16, 18), (28, 22)], fill=hi)
    d.point([(22, 23), (24, 24)], fill=(160, 40, 36, 255))   # a little blood
    return outline(im)


def candle_stub(flame=(255, 196, 80, 255), core=(255, 244, 200, 255)):
    im, d = canvas()
    w, hi, lo = (222, 210, 180, 255), (246, 238, 216, 255), (160, 148, 120, 255)
    d.rectangle([12, 14, 19, 27], fill=w); d.line([19, 14, 19, 27], fill=lo); d.line([12, 14, 12, 27], fill=hi)
    d.ellipse([9, 25, 22, 29], fill=lo)
    d.line([12, 17, 12, 21], fill=hi); d.point((19, 19), fill=hi)
    d.line([15, 11, 15, 13], fill=(40, 30, 20, 255))
    d.ellipse([13, 4, 18, 11], fill=flame); d.ellipse([14, 7, 17, 11], fill=core)
    return outline(im)


def black_pearl():
    im, d = canvas()
    d.ellipse([7, 9, 25, 27], fill=(26, 30, 38, 255))
    d.ellipse([9, 11, 23, 25], fill=(44, 50, 62, 255))
    d.ellipse([11, 12, 17, 18], fill=(110, 128, 150, 255)); d.point((12, 13), fill=(220, 236, 255, 255))
    d.arc([8, 10, 24, 26], 20, 80, fill=(120, 90, 140, 255))
    d.ellipse([12, 4, 19, 10], outline=(200, 170, 90, 255))  # gold loop
    return outline(im)


def tongue():
    im, d = canvas()
    f, hi, lo = (190, 90, 96, 255), (230, 140, 140, 255), (120, 50, 56, 255)
    d.polygon([(10, 4), (22, 4), (24, 14), (21, 25), (16, 28), (11, 25), (8, 14)], fill=f)
    d.line([16, 6, 16, 24], fill=lo)
    d.line([11, 7, 10, 16], fill=hi)
    for p in [(13, 10), (19, 12), (14, 18), (19, 20)]: d.point(p, fill=lo)
    # a silver ring through it, like a reliquary tag
    d.ellipse([18, 22, 25, 29], outline=(200, 206, 206, 255))
    return outline(im)


DRAWN = {
    'anchor': anchor(),
    'handbell': bell((176, 120, 64), crack=True), 'vespers': bell((190, 196, 196)),
    'lastbell': bell((80, 84, 88), ember=True), 'teethbell': bell((200, 188, 160), teeth=True),
    'r_bell': bell((222, 170, 70)), 'r_silence': bell((110, 120, 124), crack=True),
    'thimble': thimble(), 'pearl': black_pearl(), 'r_wick': candle_stub((110, 190, 255, 255), (230, 245, 255, 255)), 'gamblerdie': die(), 'rope': rope(), 'candle': candle_stub(),
    'b_sanctus': bell((214, 206, 180)), 'b_deepbell': bell((52, 64, 84), teeth=True),
    'r_hourglass': hourglass(), 'r_coin': coin(), 'r_oilskin': satchel(), 'c_bandage': bandage(), 'r_tongue': tongue(),
}

# ---------- from the DCSS set ----------
PICK = {
    'maul_iron': I + 'weapon/hammer_2_new.png', 'tidebreaker': I + 'weapon/mace_large_2_new.png',
    'hungering': I + 'weapon/morningstar_3.png',
    'codex': I + 'book/dark_blue_new.png', 'psalter': I + 'book/gold.png', 'gospel': I + 'book/book_of_the_dead_new.png',
    'gills': I + 'book/cyan_new.png',
    'eelboots': I + 'armor/feet/boots_4_green.png', 'knuckle': I + 'amulet/bone_gray.png', 'mirror': I + 'misc/mirror.png',
    'leech': I + 'amulet/cameo_orange.png', 'heartstone': I + 'amulet/stone_2_red.png',
    'nightglass': I + 'amulet/eye_magenta.png', 'eyeofdeep': I + 'amulet/eye_cyan.png',
    'r_charter': I + 'scroll/scroll-blue.png', 'r_ives': I + 'misc/misc_lamp_new.png',
    'r_prayer': I + 'scroll/scroll-yellow.png', 'r_tithe': I + 'potion/ruby_new.png', 'r_undertow': I + 'scroll/scroll-cyan.png',
    'r_moth': I + 'misc/misc_phial.png',
    'c_salts': I + 'potion/cloudy.png', 'c_oil': I + 'potion/brown_new.png', 'c_holy': I + 'potion/brilliant_blue_new.png',
    'c_flare': I + 'potion/golden.png',
    # v3.7
    'w_lockhammer': I + 'weapon/lucern_hammer.png', 'w_gatechain': I + 'weapon/dire_flail_1.png',
    's_index': I + 'book/dark_gray_new.png', 's_atlas': I + 'book/metal_cyan_new.png',
    'ch_key': I + 'misc/key.png', 'ch_signet': I + 'ring/plain_black.png', 'ch_clapper': I + 'amulet/cylinder_gray.png',
    'ch_mask': I + 'armor/headgear/green_mask.png', 'ch_scale': I + 'amulet/stone_1_cyan.png', 'ch_coral': I + 'ring/coral.png',
    'r_magpie': I + 'misc/misc_box.png', 'r_reliquary': I + 'misc/misc_crystal_new.png', 'r_salvage': I + 'scroll/scroll-brown.png',
    'c_ash': I + 'potion/silver.png', 'c_whet': I + 'misc/misc_stone_inert.png',
}
n = 0
for k, im in DRAWN.items():
    im.resize((96, 96), Image.NEAREST).save(os.path.join(OUT, f'it_{k}.png'), optimize=True); n += 1
for k, rel in PICK.items():
    outline(no_shadow(load(rel))).resize((96, 96), Image.NEAREST).save(os.path.join(OUT, f'it_{k}.png'), optimize=True); n += 1
print(n, 'item icons')
