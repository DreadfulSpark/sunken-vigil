# Critic Panel: what they said and what changed

Four critics reviewed v1. Each gave a score, a ranked list of problems and the things to keep.

| Critic | Lens | v1 score |
|---|---|---|
| Roguelike/tactics | Into the Breach, Slay the Spire, Darkest Dungeon, Hades | 5/10 |
| D&D / CRPG | BG3, DOS2, Disco Elysium | 6/10 |
| Presentation & game feel | Art, UI, juice, audio | 6/10 |
| First-time player | Onboarding, clarity, friction | 6/10 |

## Everything they agreed must stay

- The dice tray: visible d20 math with the reasons for advantage/disadvantage
- Light as a real radius
- On-board intents
- Shoving into deep water
- The ink-and-candle palette
- The writing voice
- The synthesized bells

## Roguelike/tactics critic

| Problem | Fix shipped |
|---|---|
| Far too easy: a naive bot won its first run | Enemy HP +25% at tier 2 and +50% at tier 3, with +1/+2 attack and +1 Guard at tier 3. Encounters are bigger (4–5 foes from depth 3). Two new foes: the Gutter-Wretch (fast flanker that hunts isolated heroes) and the Censer-Monk (heals and shields allies). The same bot now dies mid-run. |
| Parry cancels too much | Heavy blows from elites and the boss are only halved by a perfect parry. Mirror Shard now negates heavy blows instead of just widening the window. |
| The room isn't a weapon | Toll now shoves every nearby foe without a roll. Brine Bolt crits knock back. Every room has deep water near enemy spawns. Elites and bosses no longer die instantly in water: they take 2d6 and lose a turn. |
| The boss can be kited | Move 3, harder hits, and a ranged Drowning Psalm that hooks heroes. At half HP he floods every shallow tile and acts twice. |
| Death is free | Fallen heroes roll a death save at the end of the fight (DC 10, +3 per earlier fall). Pass: they come back scarred (−2 max HP). Fail: they are lost for the rest of the run. |
| Loot is mostly +1s | Worn drops are rarer. Every worn item gained a rule-bending clause. Build lines: Drown, Mark, Bell/Daze, Darkness. Seven new rule-changing items. Every pick of three has at least one Blessed-or-better item. |
| No build choices | 12 Talents (4 per hero). Elites award one, Sanctuaries can train one, and some curios teach one. |
| Dread has no teeth | Save DC raised to 14. Six Flaws (Hopeless, Paranoid, Reckless, Haunted, Tremulous, Frail) and four Virtues. |
| Ember economy maxes out in 2 runs | Silver no longer converts to Embers. Six upgrade lines with 3 tiers each (about 1,900 Embers to finish), including Training Yard and Quartermaster. |
| The map gives little to decide | Threat pips on fights, a second elite column, a legend, and tooltips that say what each room offers. |

## D&D / CRPG critic

| Problem | Fix shipped |
|---|---|
| The narrator doesn't react | Every line is a template naming the hero, foe or room, with no repeats within a run. New triggers: crit kills, low-HP survival, a Fate reroll turning a miss into a hit, solo victory, elite drownings, the boss flood. Key moments show as a large caption on the board. |
| Heroes are tokens | They have names (Brannoc, Ysolde, Old Hesk), backstories, and speech-bubble barks on crits, kills, wounds, allies falling, Flaws and Virtues. |
| Ability scores barely matter | STR 3+ adds a shove tile, DEX widens the parry window, WIS powers Dread and death saves, and CHA strengthens Toll's DC and Chime's healing. |
| Checks lock in who rolls | You choose which hero attempts each check and see everyone's odds. Some options are class-only, item-only, cost silver, or are a dice gamble. |
| Too few curios | Six grew to fourteen, including a personal floodgate scene for Brannoc, a breathing book only Ysolde can read, and a skeleton who plays dice. |
| Morality was a die roll | Moral choices (robbing the pilgrim, for example) have no roll and set story flags. |
| Death and the run end tell no story | The run-end screen shows a chronicle of the run's notable moments and epitaphs for the fallen. |
| Thin lore hook | Camp now opens with the Lowmarsh mystery: the bells nobody should be able to ring. |
| Placeholder event art | Each curio, sanctuary, Ferryman and vault has a hand-drawn vignette. |

## Presentation critic

| Problem | Fix shipped |
|---|---|
| Swing and impact are disconnected | Attacks wind up before the roll, then the strike lunge lands exactly on the damage. Hits get a real hit-stop freeze, longer on crits. |
| The dice tray covers the action | It moved to the bottom of the board and shrank. |
| One icon per item slot | About 30 item icons, each drawn for its item. |
| Text is too small | 11–12px minimum, larger action labels, and ✓/✗/★ markers on every result. |
| Enemies look alike | Each foe has a distinct silhouette and stands on a hexagonal base, while heroes stand on round bases. |
| Hazards vanish in the dark | Darkness is tinted and lighter. Deep water has glints drawn above the darkness. |
| Unicode glyphs break | Intents and the mute button are drawn icons, and badges are plain text. |
| Rooms have no identity | Each room style has its own props (pews, ossuary bones, statues, tombs, chains), plus a stained-glass light pool. Fallen heroes leave a cairn. |
| Audio is repetitive | A compressor, pitch and volume variation on every effect, music crossfades, recurring bell motifs, and a dripping-water ambience in battle. |
| Thin surrounding screens | The map has a cathedral cross-section backdrop. Camp build buttons stay readable when you can't afford them. Loot screens dim the background more. |

## First-time player critic

| Problem | Fix shipped |
|---|---|
| Fate prompt spam | It only appears when an enemy blow would fell a hero, on misses within 5, and on failed saves. The tutorial teaches it with a scripted miss. |
| The parry ring is too strict | Perfect window ±120 ms (wider with DEX), graze ±260 ms. The rings flash white and tick when the window opens. Feedback says TOO EARLY or TOO LATE. The tutorial gives a retry. |
| Intents are taught too late | Taught before the first End Phase. Pointing at a foe shows its next move in the inspector. |
| Info-dump card | Split into one card per concept, with exact numbers. |
| The Bell-Ringer is never taught | A coach caption the first time she's selected, plus the camp intro. |
| Light is half-explained | Every tile says exactly what Darkness, Dim and Bright do. |
| Hover-only map | Click to inspect, click again (or press Travel) to go, plus a permanent legend. |
| No confirmations | Abandon asks first. Skipping the tutorial still grants the 40 Embers. |
| Meta progression is opaque | An itemized Ember breakdown, an "you can afford…" hint at camp, and on-screen captions for death saves. |
| Controls are undocumented | A ? button and key open the controls panel. |
