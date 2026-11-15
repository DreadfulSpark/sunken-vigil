# The Sunken Vigil

A lantern-lit tactics roguelite set beneath a drowned cathedral. It runs in the browser and combines D&D dice and skill checks with a Darkest Dungeon-style descent.

## Play
- **In your browser:** open the GitHub Pages link in the repository's About panel.
- **Locally:** run `python serve.py`, then open http://localhost:8642. You need Python 3; no build step.

The first time you play, a short guided fight teaches everything.

## What it is
- **Tactical grid fights in the room itself.** Your party acts in any order, then the enemies act.
  - Every attack is a visible d20 roll against a target's Guard, with advantage and disadvantage.
  - Fate tokens reroll near-misses. Pushing a roll adds 1d6 at the cost of Dread.
  - Each enemy shows what it will do next.
- **Light matters.** Foes in the dark are hidden and raise your Dread. Kindle braziers and throw the lantern to push the dark back.
- **The water is a weapon.** Shove foes into deep water to drown them.
- **Timed parries.** Press Space as the ring closes.
- **Dread and death saves.** At 100 Dread a hero gains a Flaw or a Virtue. A hero who falls makes a death save, and failing it means they're lost for the run.
- **Loot that changes how you play.** About 45 items in four tiers: worn, blessed, relic and cursed. Elite fights also teach Talents.
- **A run.** A branching 8-depth descent to the Drowned Bishop. Embers you earn buy permanent camp upgrades.

## Layout
| Path | What's there |
|---|---|
| `src/rules.js` | All game rules, kept separate from drawing |
| `src/data.js` | Heroes, enemies, items, events and lines |
| `src/scenes/` | Phaser scenes |
| `src/audio.js` | Plays recorded samples, with a synth fallback and music beds |
| `assets/` | Built sprites, sound effects, music and title art |
| `tools/` | Scripts that rebuild `assets/` from the source packs |
| `docs/` | Design research, critic responses and the look and sound pass |

Asset credits and licences are in [CREDITS.md](CREDITS.md).
