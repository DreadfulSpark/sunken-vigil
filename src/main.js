import TitleScene from './scenes/TitleScene.js';
import CampScene from './scenes/CampScene.js';
import MapScene from './scenes/MapScene.js';
import BattleScene from './scenes/BattleScene.js';
import EventScene from './scenes/EventScene.js';
import RunEndScene from './scenes/RunEndScene.js';
import { loadSamples, loadMusic } from './audio.js';

const Phaser = window.Phaser;

async function boot() {
  // recordings decode in the background; the synth covers anything not ready yet
  loadSamples().then(() => loadMusic());
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('900 40px Cinzel'), document.fonts.load('700 16px Cinzel'),
        document.fonts.load('400 16px Spectral'), document.fonts.load('italic 400 16px Spectral'),
      ]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch { /* fonts are optional */ }
  document.getElementById('loading')?.remove();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: 1280,
    height: 720,
    backgroundColor: '#050b0c',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true },
    scene: [TitleScene, CampScene, MapScene, BattleScene, EventScene, RunEndScene],
  });
  Object.assign(window, { game });
}
boot();
