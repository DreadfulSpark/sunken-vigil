// Party strip shared by the map, event and shop screens.
import { HEROES, RARITY, itemById } from './data.js';
import { maxHpOf, satchelCap } from './rules.js';
import { C, HEX, FONT_H, FONT_B, panel } from './ui.js';
import { unitKey } from './sprites.js';

export function partyStrip(scene, run, y = 16, { onHover } = {}) {
  const W = scene.scale.width;
  const root = scene.add.container(0, 0).setDepth(50);
  root.add(panel(scene, 20, y, W - 40, 96, { r: 12 }));
  run.heroes.forEach((h, i) => {
    const x = 36 + i * 300;
    const def = HEROES[h.id];
    const port = scene.add.graphics();
    port.fillStyle(0x16211f, 1); port.fillCircle(x + 30, y + 48, 26);
    port.lineStyle(2, h.id === 'warden' ? C.amber : h.id === 'scholar' ? C.dread : C.bone, 1); port.strokeCircle(x + 30, y + 48, 26);
    const gl = scene.add.image(x + 30, y + 72, unitKey(h.id)).setOrigin(0.5, 1).setScale(0.85);
    const mx = maxHpOf(h);
    const name = scene.add.text(x + 66, y + 10, `${def.name}`, { fontFamily: FONT_H, fontSize: '15px', color: HEX.bone, fontStyle: '700' });
    root.add(scene.add.text(x + 66 + name.width + 6, y + 13, def.cls, { fontFamily: FONT_B, fontSize: '12px', color: HEX.boneDim, fontStyle: 'italic' }));
    if (h.lost) {
      root.add([port, gl, name, scene.add.text(x + 66, y + 40, 'LOST TO THE LAKE', { fontFamily: FONT_H, fontSize: '14px', color: HEX.red, fontStyle: '700' })]);
      port.setAlpha(0.35); gl.setAlpha(0.35); name.setAlpha(0.5);
      return;
    }
    const hpBg = scene.add.rectangle(x + 66, y + 42, 150, 8, 0x050b0c).setOrigin(0, 0.5).setStrokeStyle(1, 0x2a3a3a);
    const hp = scene.add.rectangle(x + 67, y + 42, 148 * Math.max(0, h.hp) / mx, 6, h.hp / mx < 0.34 ? 0xd0402c : 0x6fbf73).setOrigin(0, 0.5);
    const hpT = scene.add.text(x + 222, y + 35, `${h.hp}/${mx}`, { fontFamily: FONT_B, fontSize: '12px', color: HEX.bone });
    const drBg = scene.add.rectangle(x + 66, y + 58, 150, 8, 0x050b0c).setOrigin(0, 0.5).setStrokeStyle(1, 0x2a3a3a);
    const dr = scene.add.rectangle(x + 67, y + 58, 148 * Math.min(100, h.dread) / 100, 6, C.dread).setOrigin(0, 0.5);
    const drT = scene.add.text(x + 222, y + 51, `${h.dread} dread`, { fontFamily: FONT_B, fontSize: '12px', color: HEX.dread });
    const w = h.weapon ? itemById(h.weapon) : null, c = h.charm ? itemById(h.charm) : null;
    const tal = (h.talents ?? []).length;
    const gear = scene.add.text(x + 66, y + 68, `${w ? w.name : 'no weapon'} · ${c ? c.name : 'no charm'}${tal ? ` · ${tal} talent${tal > 1 ? 's' : ''}` : ''}${h.scars ? ` · ${h.scars} scar${h.scars > 1 ? 's' : ''}` : ''}`, { fontFamily: FONT_B, fontSize: '12px', color: HEX.boneDim, fontStyle: 'italic', wordWrap: { width: 230 } });
    root.add([port, gl, name, hpBg, hp, hpT, drBg, dr, drT, gear]);
    if (h.flaw) root.add(scene.add.text(x + 286, y + 10, h.flaw.toUpperCase(), { fontFamily: FONT_H, fontSize: '11px', color: HEX.ink, backgroundColor: HEX.red, padding: { x: 4, y: 2 }, fontStyle: '700' }).setOrigin(1, 0));
    const z = scene.add.zone(x, y, 290, 96).setOrigin(0).setInteractive();
    z.on('pointerover', () => onHover?.(`${def.name} the ${def.cls}`, `${def.role}. ${def.bio}\nWeapon: ${w ? `${w.name} (${w.text})` : 'none'}\nCharm: ${c ? `${c.name} (${c.text})` : 'none'}`));
    root.add(z);
  });
  // right block: silver, fate, relics, satchel
  const rx = 930;
  root.add(scene.add.image(rx + 10, y + 22, 'silver'));
  root.add(scene.add.text(rx + 26, y + 12, `${run.silver}`, { fontFamily: FONT_H, fontSize: '17px', color: '#c9d4d2', fontStyle: '700' }));
  root.add(scene.add.image(rx + 96, y + 22, 'fate').setScale(0.7));
  root.add(scene.add.text(rx + 112, y + 12, `${run.fate} Fate`, { fontFamily: FONT_H, fontSize: '17px', color: HEX.amber, fontStyle: '700' }));
  root.add(scene.add.text(rx, y + 44, 'RELICS', { fontFamily: FONT_H, fontSize: '10px', color: HEX.amber, fontStyle: '700', letterSpacing: 2 }));
  run.relics.forEach((id, i) => {
    const it = itemById(id);
    const im = scene.add.image(rx + 70 + i * 26, y + 50, `it_${it.icon}`).setScale(0.48).setTint(RARITY[it.rarity].color).setInteractive();
    im.on('pointerover', () => onHover?.(it.name, it.text));
    root.add(im);
  });
  if (!run.relics.length) root.add(scene.add.text(rx + 62, y + 42, 'none yet', { fontFamily: FONT_B, fontSize: '12px', color: HEX.boneDim, fontStyle: 'italic' }));
  root.add(scene.add.text(rx, y + 70, `SATCHEL ${run.consumables.length}/${satchelCap(run)}`, { fontFamily: FONT_H, fontSize: '10px', color: HEX.amber, fontStyle: '700', letterSpacing: 2 }));
  run.consumables.forEach((id, i) => {
    const it = itemById(id);
    const im = scene.add.image(rx + 104 + i * 24, y + 76, `it_${it.icon}`).setScale(0.42).setTint(RARITY[it.rarity].color).setInteractive();
    im.on('pointerover', () => onHover?.(it.name, it.text));
    root.add(im);
  });
  return root;
}
