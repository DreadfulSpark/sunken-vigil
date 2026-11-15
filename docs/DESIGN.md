# The Sunken Vigil — Design Doc

A lantern-lit tactics roguelite set in a drowned cathedral-city. You lead three heroes down
through flooded chapels. Every attack is a d20 roll you can see, light decides what you
can see and hit, and the dark wears on your heroes' minds.

---

## 1. Research: why Dungeons & Dragons is still a hit

D&D is 50 years old and bigger than ever. Wizards of the Coast's segment booked about
$2.2B in 2025, and Baldur's Gate 3 has sold 20M+ copies. The feeling people chase:

| What players crave | Why it works | Games that deliver it |
|---|---|---|
| **"I can try anything"** | The world answers creative ideas (shove the guard into the well, kick over the brazier). | BG3 and Divinity: Original Sin 2 (environment interaction) |
| **Dice as a fair, dramatic referee** | A visible d20 makes uncertainty honest. You saw the 4, so you blame the dice, not the designer. Nat 20s and nat 1s become stories. | BG3 (visible rolls, inspiration rerolls), Disco Elysium (every check is drama) |
| **My character, my build** | Ability scores, classes and gear make a character feel like yours. | Pathfinder WotR, Solasta |
| **A narrator who reacts** | The DM makes every choice feel seen. | Disco Elysium, Inscryption, BG3's narrator |
| **Stories you retell** | Emergent moments ("the bard crit the dragon with a lute") beat scripted ones. | For the King, Wildermyth |
| **Treasure** | Loot is visible proof of progress and changes how you play. | Diablo, BG3 magic items |

**Takeaways for us:** show every roll, let the room be a weapon, let the narrator comment,
and make loot change how you play, not just your numbers.

## 2. Research: why Darkest Dungeon hit

Red Hook's stated goal was to capture "the human response to stress… people break in
different ways". They wanted character moments to come from **systems, not scripts**.

- **Systemic drama:** stress hits 100, then the check that turns a hero Afflicted or Virtuous. You remember it because the game didn't plan it.
- **Attrition and push-your-luck:** torch, food and stress fall together, and "one more room?" is the whole game.
- **Failure as content:** the narrator makes defeat feel grand instead of cheap.
- **A strong look:** ink-heavy gothic art you can recognize from a thumbnail.

**What critics and players complain about:** the grind between runs, 85%-to-hit misses
that feel unfair, long expeditions that drag, and the four-rank lineup's limited spatial
play, which can feel samey after 20 hours.

**Takeaways:** keep stress-as-story and push-your-luck. Fix the RNG feel with visible
d20 math, rerolls and pushes. Keep runs about 30 minutes. Replace the rank lineup with
real space (this was your call).

## 3. Similar roguelikes and what to borrow

| Game | Borrowed idea | How it shows up here |
|---|---|---|
| **Into the Breach** | Telegraphed enemy intents. Pushing enemies into hazards. Short fights where you know everything | Every enemy shows its next move (target line and icon) during your phase. Deep water drowns, walls slam |
| **Slay the Spire** | Branching route map. Relics that combo. Elites and a boss. Pick 1 of 3 | The Descent map (fights, curios, rests, Ferryman, elites, Bishop). Party relics change rules |
| **Hades** | A home base you return to after every death, with growth between runs and rarity-tiered rewards | Camp on the shore with permanent upgrades bought with Embers. The narrator reacts to death |
| **Clair Obscur: Expedition 33** | Timing reactions in turn-based combat | The parry/dodge ring when you're struck |
| **For the King / BG3** | Spending luck to bend dice | Fate tokens (reroll any die). Push a roll for +1d6 at the cost of Dread |
| **Diablo** | Rarity colors and affixes, with loot you're excited to read | Worn / Blessed / Relic / Cursed tiers |
| **Darkest Dungeon trinkets** | Items with a drawback | Cursed gear: huge upside with a real cost |
| **Wildermyth** | Systems that tell stories | Dread saves give lasting Flaws or Resolve |

## 4. Pillars

1. **Light is life.** Light is a physical radius. Foes in darkness are unseen and hard to hit. Braziers get snuffed and relit, and the lantern can be thrown.
2. **Every roll is a scene.** A visible d20 with advantage/disadvantage, crits and fumbles. Fate rerolls and pushes give the player a say.
3. **The room is a weapon.** Shoves, deep water, walls, high ground and chests in dark corners.
4. **Loot changes how you play.** An item should change *how* you play, not only your numbers.
5. **Always playing.** Heroes act in any order in the party phase, and parry rings keep you busy on the enemy's turn.

## 5. The party

| Hero | Role | Skills |
|---|---|---|
| **Tidewarden** | Front line, shover | Tide Hammer, Undertow (shove 2), Brace (+3 Guard, stronger counters) |
| **Drowned Scholar** | Ranged, revealer | Brine Bolt (range 5), Read the Dark (Mark + reveal), carries the Lantern |
| **Bell-Ringer** | Support, control | Knell (melee + knockback), Toll the Hour (Daze save), Steady Chime (−Dread, heal) |

Ability scores (STR/DEX/WIS/CHA) drive event checks. WIS drives Dread saves.

## 6. Loot (core system)

- **Tiers:** Worn (bone), Blessed (teal), Relic (amber), Cursed (red: strongest, with a drawback).
- **Slots:** each hero has a **Weapon** (class-specific) and a **Charm** (any hero). The party shares **Relics** (rule-changers) and up to 3 **Consumables**.
- **Sources:**
  - Pick 1 of 3 after every fight
  - Chests in rooms, usually in dark corners
  - Curio events
  - Elites always offer a Relic
  - The Ferryman sells items for Silver
- **Examples:**
  - *Anchor of St. Wend*: shoves go 1 further, wall slams deal double
  - *Everburning Wick*: braziers can't be snuffed
  - *Hungering Maul* (Cursed): +5 damage, Dread gains +25%

## 7. Run structure

Camp (meta upgrades) → the Descent map (8 columns, 2–3 branches) → the Drowned Bishop.
A run takes about 30 minutes. Leftover Silver plus depth reached become **Embers**, which
buy permanent camp upgrades: Lantern-maker, Chapel, Forge and Ossuary.

## 8. Tutorial

The first launch plays *The Flooded Narthex*, a guided fight with a coach card and
pointer for each step: select, move, attack, parry, reveal, shove into water, kindle,
end the phase, then pick loot. It can be skipped and replayed from the title screen.

## 9. Art, sound and music

- **Palette:** abyss teal `#0E2A2E`, drowned stone `#4A5250`, candle amber `#E8A33D`, bone `#D9CFB8`, wound red `#8C1C1C`.
- **Art:** vector sprites drawn in code, all in one style. The game is 2D top-down, so 3D models made in Blender would clash with it.
- **Sound:** fully synthesized SFX, with a sound on every action.
- **Music:** generated by the game in D minor, in layers: explore (pads + bells), battle (adds a pulse and an ostinato), boss (faster, heavier). The drone gets louder as Dread rises.

## Sources

- [Baldur's Gate 3 sells 20M+ (GamingBolt)](https://gamingbolt.com/?p=633652)
- [D&D / TTRPG statistics 2026](https://voxbooster.com/blog/dnd-ttrpg-statistics-2026)
- [Darkest Dungeon's Affliction System deep dive (Game Developer)](https://gamedeveloper.com/design/game-design-deep-dive-i-darkest-dungeon-s-i-affliction-system)
- [Darkest Dungeon (Wikipedia)](https://en.wikipedia.org/wiki/Darkest_Dungeon)
- [Designing for despair (Game Developer)](https://gamedeveloper.com/business/-i-darkest-dungeon-i-designing-for-despair-and-kicking-you-when-you-re-down)
- [Games like Darkest Dungeon (Dot Esports)](https://dotesports.com/best-of/news/games-like-darkest-dungeon)
