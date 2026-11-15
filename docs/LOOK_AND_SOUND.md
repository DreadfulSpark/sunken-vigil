# Look and sound pass (v3)

Playtest verdict on v2: the sound effects were bad and sounded like every other generated game, the characters looked like emojis, and the background looked bad.

## What makes the comparison games look and sound good

| Game | What it does | What v3 takes from it |
|---|---|---|
| **Darkest Dungeon** | Heavy black outlines, desaturated colour and one torch setting the mood. Each hero reads from silhouette alone. Audio is recorded foley and a voiced narrator; the UI clicks are kept quiet so you hear the world. | A dark outline on every sprite. Light is the main source of colour. UI sounds are quiet, combat sounds loud. |
| **Hades** | Bright rim light on characters against dark rooms. Every hit layers an impact, a voice and a music sting. The music adds and drops layers as fights start and end. | Each hit layers a flesh impact with an armour clank. Recorded music changes by mode, with war drums added only during fights. |
| **Blasphemous** | Hand-drawn pixel art and heavy religious imagery in ochre and crimson. | Real pixel-art sprites in a gothic-church setting: angel statues, altars, pews, banners, wall torches. |
| **Dead Cells** | Low-resolution pixel art, crisp scaling and a strong palette grade. | Sprites scaled up with nearest-neighbour so pixels stay crisp, and one colour grade (teal shadows) over every sprite. |
| **Into the Breach** | Clarity first: every unit and intent is readable on one screen. | A coloured ground ring under each unit (gold for heroes, red for foes, silver for elites). Enemies face the party. |
| **Slay the Spire** | One short, punchy sound per action, with slight variations. | 163 recorded takes across 44 sound types. A random take each time, never the same one twice in a row, with small pitch and volume changes. |
| **Loop Hero** | A limited palette on a black void, so tiles pop. | A dark frame and vignette around the board, with lit tiles standing out. |

Sources: Game Developer interviews on Into the Breach's UI and Darkest Dungeon's audio, an 80.lv case study of Dead Cells' art pipeline, and MCV/UK on Hades' art. Links are in `CREDITS.md`.

## What changed

- **Characters:** the code-drawn emoji-like glyphs are gone.
  - The three heroes are assembled from paper-doll layers: Brannoc has plate, a hammer and a kite shield; Ysolde has a sea-green robe, a staff and a lantern; Old Hesk has a habit, a white beard and a gong.
  - The nine enemies use matching dark-fantasy sprites.
  - Units idle with a slight breathing motion and flash white when hit.
- **Battle rooms:**
  - Stone flagstones, or cobbles in the crypt and ossuary.
  - Two-frame animated water with foam at the shoreline and light glints.
  - Ornate crypt tiles on the raised dais.
  - Angel statues that stand up off the floor instead of flat pillars.
  - Lit braziers on stone plinths.
  - Pews, bones, columns and sarcophagi, plus candle clusters that flicker.
  - A cathedral-stone frame with burning wall torches.
- **Title, camp and run-end screens:** Caspar David Friedrich's *Abbey in the Oakwood* (1810, public domain), graded teal, with fog, falling ash and a slow push-in.
- **Events:** each of the 17 curio, shop, rest and treasure scenes is now a small lit pixel-art scene in the same style as the battles.
- **Map:** pixel-art room icons on stonework.
- **Sound:** recorded impacts, splashes, footsteps, dice, bells, gongs, chains, fire, coins and books replace the synth.
  - A recorded water ambience with echoing drips plays under every fight.
  - The synth now only fills gaps: musical stingers such as victory and the loot fanfare, and any sound whose file fails to load.
- **Music:** recorded loops for camp (*Cathedral in the Forest*), the map (*Dark Shrine Loop*) and fights (*Dark Cavern Ambient*), with slow war drums layered in during fights and the boss.

## Rebuilding the assets

The source packs are not committed. To regenerate `assets/`, download the packs listed in `CREDITS.md`, unzip them, then run:

```
python -I tools/build_sprites.py "<path>/Dungeon Crawl Stone Soup Full" assets/sprites
python -I tools/build_audio.py "<folder with the unzipped sound packs>" assets/sfx
```

## Combat animation pass (v3.2)

Built in `src/battleFx.js`, a presentation-only layer that `BattleScene` calls into.

- **Movement:** units hop with each step and turn to face where they're going. Stone floors kick up dust; water leaves a splash and a ripple.
- **Melee:** a deeper wind-up crouch, then a lunge that leaves an afterimage. A crescent slash sweeps across the target in the attacker's colour (gold for Brannoc, sea-green for Ysolde, bronze for Old Hesk, red for cultists and so on). On contact there's an impact flash, a shockwave ring and a cone of sparks.
- **Crits:** a double slash, a bigger shockwave and a small camera zoom toward the blow.
- **Getting hit:** a white hit-flash, a stagger away from the attacker, and a tilt. A short freeze-frame (hit-stop) makes the blow land.
- **Ranged:** the caster recoils and a muzzle glow appears. The bolt travels in an arc with a hot core and a particle tail, then bursts on impact.
- **Shoves:** a trail of afterimages and dust. Slamming into a wall gives a heavy impact and debris.
- **Brace:** a golden shield dome rises around the hero.
- **Deaths:** a flash, then the body staggers, tips over with a bounce, darkens and gives up a rising wisp of light. Drowning foes sink with expanding ripples.

## Enemy signature attacks (v3.3)

Each enemy type now winds up and lands its blow in its own way:

| Enemy | Tell | Attack |
|---|---|---|
| Lamp-Cultist | Raises its lamp overhead | Smashes it down: ember burst, ground shockwave and floor cracks |
| Gutter-Wretch | Coils low | Darts in leaving a red afterimage trail, then an X-slash |
| Drowned Husk | Sways | Lurching rake: three green claw marks and a brine spray |
| Wick-Snuffer | Leans in | Smothers its target in a black smoke cloud. It also leans over braziers, choking the flame and dropping embers. |
| Choir Wretch | Rises and screams | Rings of sound roll across the room |
| Censer-Monk | Swings the censer | Lobs green incense. Heals rise in a ring of green motes. |
| Eel-Priest | Coils back | Throws a chain hook. On a hit, the hero is dragged along the retracting chain. |
| Tide-Knight | A red glint and a "HEAVY" warning | Overhead slam with a huge shockwave and screen shake |
| Drowned Bishop | A red glint and a "HEAVY" warning | Water-shockwave slam. Cleave sweeps a wide arc of water. Raising the dead erupts a geyser and the husk climbs out of the pool. The litany spins a ring of red runes, darkens the room and makes every brazier gutter. |

## Enemy mechanics (v3.4)

Every regular enemy gained one new move. Each move is shown in advance in the enemy's intent icon, its "next move" text and on the board, so you can always play around it. None of them appear in the tutorial fight.

| Enemy | New move | How to answer it |
|---|---|---|
| Lamp-Cultist | **Lamp Throw.** Every third round it locks a 3×3 area at the start of your turn, shown in orange. On its turn it hurls its lamp there: 1d6 fire and 2 turns of Burning to everyone inside. The fire lights the area until the end of the next round. | Leave the orange squares. The fire also lights foes, which you can use. |
| Wick-Snuffer | **Lantern Thief.** It goes after whoever carries the lantern. A hit knocks the lantern a tile away, onto the ground. | Guard the bearer. Walk over the lantern to pick it back up. |
| Gutter-Wretch | **Hit and Run.** After it attacks, it slips up to 2 tiles back toward the dark. | Mark it, light it up, or catch it with a parry riposte. |
| Drowned Husk | **Drag Under.** If its victim is next to open deep water, a hit drags them in. They're Floundering, so foes get Advantage and the water deals drowning damage. | Don't fight a husk with your back to deep water. |
| Choir Wretch | **Dirge.** Every other turn, if no hero is next to it, it sings: +8 Dread to every hero it can see. | Break its line of sight, or close in, since it's fragile up close. |
| Eel-Priest | **Snare.** A hooked hero is Snared, so every foe that acts after the eel this phase attacks them with Advantage. | Parry the hook, or kill the eel first. |
| Censer-Monk | **Ward.** On alternate turns, if no ally needs healing, it wards the ally nearest your heroes. The ward absorbs the next 6 damage. | Break the ward with small hits, or kill the monk. |
| Tide-Knight | **Charge.** If a hero stands in a straight open line 2–5 tiles away, it charges along it and strikes for +2 damage and a 2-tile shove. The charge lane is shown in red. | Step out of the line. A charge into a hero with a wall behind them also causes a wall slam. |

**Fix:** an enemy's plan used to be counted one turn later than the preview, so the Bishop's cycle could do something other than his intent showed. Now the intent you see is the move that happens.
