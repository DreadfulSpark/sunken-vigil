// WebAudio synth: every sound and all music in the game is generated here, no files.
let ctx = null;
let master = null;
let sfxBus = null;
let musicBus = null;
let noiseBuf = null;
let verb = null;
let amb = null;
const settings = { sfx: 0.8, music: 0.55, muted: false };
try {
  const saved = JSON.parse(localStorage.getItem('vigil-audio') || 'null');
  if (saved) Object.assign(settings, saved);
} catch { /* storage unavailable */ }

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = settings.muted ? 0 : 0.7;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.2;
    master.connect(comp).connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = settings.sfx; sfxBus.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = settings.music; musicBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // Cheap cathedral reverb: a decaying noise impulse.
    verb = ctx.createConvolver();
    const len = ctx.sampleRate * 3.2;
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const ch = ir.getChannelData(c);
      for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    verb.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = 0.32;
    verb.connect(wet).connect(master);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
function saveSettings() { try { localStorage.setItem('vigil-audio', JSON.stringify(settings)); } catch { /* ignore */ } }

function env(g, t0, attack, dur, vol) {
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(attack + 0.01, dur));
}
function out(bus, wetAmt) {
  const g = ctx.createGain();
  g.connect(bus);
  if (wetAmt) { const w = ctx.createGain(); w.gain.value = wetAmt; g.connect(w).connect(verb); }
  return g;
}
function tone(freq, dur, { type = 'sine', vol = 0.3, slide = 0, delay = 0, attack = 0.005, bus, wet = 0.15, at } = {}) {
  const c = ac(); if (!c) return;
  const t0 = at ?? c.currentTime + delay;
  if (!bus) { freq *= 1 + (Math.random() - 0.5) * 0.07; vol *= 1 + (Math.random() - 0.5) * 0.25; }
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t0 + dur);
  env(g, t0, attack, dur, vol);
  o.connect(g).connect(out(bus ?? sfxBus, wet));
  o.start(t0); o.stop(t0 + dur + 0.05);
}
function noise(dur, { vol = 0.3, freq = 1000, q = 1, type = 'bandpass', delay = 0, to = 0, attack = 0.004, bus, wet = 0.1, at } = {}) {
  const c = ac(); if (!c) return;
  const t0 = at ?? c.currentTime + delay;
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  const f = c.createBiquadFilter();
  f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(freq, t0);
  if (to) f.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const g = c.createGain();
  env(g, t0, attack, dur, vol);
  src.connect(f).connect(g).connect(out(bus ?? sfxBus, wet));
  src.start(t0, Math.random()); src.stop(t0 + dur + 0.05);
}
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

export const sfx = {
  unlock() { ac(); },
  click() { tone(720, 0.06, { type: 'triangle', vol: 0.1, wet: 0 }); },
  hover() { tone(1100, 0.03, { vol: 0.03, wet: 0 }); },
  select() { tone(440, 0.08, { type: 'triangle', vol: 0.1 }); tone(660, 0.12, { type: 'triangle', vol: 0.09, delay: 0.05 }); },
  denied() { tone(180, 0.12, { type: 'square', vol: 0.05, wet: 0 }); },
  step() { noise(0.05, { freq: 420, vol: 0.09, q: 2, wet: 0.05 }); },
  wade() { noise(0.14, { freq: 900, vol: 0.12, type: 'lowpass', to: 300 }); },
  dice() { for (let i = 0; i < 7; i++) noise(0.03, { freq: 1800 + Math.random() * 2500, vol: 0.16, q: 6, delay: i * 0.065 + Math.random() * 0.02, wet: 0.05 }); },
  land() { tone(180, 0.09, { type: 'triangle', vol: 0.22 }); noise(0.05, { freq: 2500, vol: 0.14, q: 3 }); },
  hit() { tone(140, 0.2, { slide: -90, vol: 0.5 }); noise(0.14, { freq: 700, vol: 0.32, q: 0.8 }); noise(0.05, { freq: 3000, vol: 0.25, q: 0.5, wet: 0 }); },
  ambience(on) {
    const c = ac(); if (!c) return;
    if (!on) {
      if (amb) {
        clearInterval(amb.timer); amb.g.gain.setTargetAtTime(0.0001, c.currentTime, 0.5);
        const a = amb; amb = null;
        setTimeout(() => { try { a.src.stop(); } catch { /* already stopped */ } }, 1500);
      }
      return;
    }
    if (amb) return;
    const loopBuf = (manifest.ambWater?.files ?? []).map((f) => buffers[f]).find(Boolean);
    const src = c.createBufferSource(); src.loop = true;
    const g = c.createGain(); g.gain.value = 0.0001;
    let timer;
    if (loopBuf) {
      // recorded water bed, a few drips echoing in the vault
      src.buffer = loopBuf;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
      g.gain.setTargetAtTime(manifest.ambWater.vol ?? 0.2, c.currentTime, 1.5);
      src.connect(lp).connect(g).connect(out(sfxBus, 0.25));
      timer = setInterval(() => { if (Math.random() < 0.35) playSample('ambDrip'); }, 1100);
    } else {
      src.buffer = noiseBuf;
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260;
      g.gain.setTargetAtTime(0.035, c.currentTime, 1.5);
      src.connect(f).connect(g).connect(sfxBus);
      timer = setInterval(() => {
        if (Math.random() < 0.55) tone(900 + Math.random() * 1400, 0.12, { vol: 0.025 + Math.random() * 0.03, slide: -300, wet: 0.7 });
      }, 700);
    }
    src.start();
    amb = { src, g, timer };
  },
  bigHit() { tone(90, 0.35, { slide: -50, vol: 0.6 }); noise(0.25, { freq: 400, vol: 0.45, q: 0.6, wet: 0.3 }); },
  slam() { tone(70, 0.3, { slide: -30, vol: 0.6 }); noise(0.2, { freq: 250, vol: 0.5, q: 0.7, wet: 0.3 }); },
  miss() { noise(0.18, { freq: 2600, to: 800, vol: 0.09, q: 1.5 }); },
  crit() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.6, { type: 'triangle', vol: 0.12, delay: i * 0.06, wet: 0.4 })); },
  fumble() { tone(320, 0.45, { type: 'sawtooth', slide: -220, vol: 0.08 }); },
  parry() { tone(1900, 0.3, { type: 'square', vol: 0.04 }); tone(2600, 0.5, { vol: 0.09, wet: 0.5 }); noise(0.07, { freq: 6000, vol: 0.25, q: 2 }); },
  dodge() { noise(0.16, { freq: 1200, to: 3200, vol: 0.12, q: 1 }); },
  splash() { noise(0.8, { freq: 1600, to: 160, vol: 0.45, type: 'lowpass', wet: 0.3 }); tone(90, 0.4, { slide: -40, vol: 0.2 }); },
  heartbeat() { tone(58, 0.14, { vol: 0.55, wet: 0 }); tone(52, 0.14, { vol: 0.42, delay: 0.2, wet: 0 }); },
  kindle() { noise(0.7, { freq: 400, to: 1800, vol: 0.25, type: 'lowpass', attack: 0.08 }); tone(160, 0.6, { vol: 0.07, attack: 0.1 }); },
  snuff() { noise(0.5, { freq: 3000, to: 600, vol: 0.16, type: 'highpass' }); },
  whoosh() { noise(0.35, { freq: 500, to: 2400, vol: 0.16, q: 1.2 }); },
  death() { tone(220, 0.9, { type: 'sawtooth', slide: -170, vol: 0.1 }); noise(0.5, { freq: 300, vol: 0.2, type: 'lowpass' }); },
  mark() { tone(880, 0.6, { vol: 0.07, wet: 0.5 }); tone(1320, 0.7, { vol: 0.05, delay: 0.08, wet: 0.5 }); },
  brace() { tone(110, 0.25, { type: 'square', vol: 0.07 }); noise(0.1, { freq: 1200, vol: 0.2 }); },
  dread() { tone(70, 1.1, { type: 'sawtooth', vol: 0.06, slide: -20, attack: 0.2, wet: 0.4 }); },
  resolve() { [392, 494, 587, 784].forEach((f, i) => tone(f, 1.0, { type: 'triangle', vol: 0.09, delay: i * 0.09, wet: 0.5 })); },
  bell() { [196, 392, 588, 785, 1180].forEach((f, i) => tone(f, 2.6 - i * 0.35, { vol: 0.15 / (i + 1), attack: 0.003, wet: 0.6 })); },
  chime() { [784, 1175, 1568].forEach((f, i) => tone(f, 1.4, { vol: 0.07, delay: i * 0.12, wet: 0.6 })); },
  toll() { [98, 196, 294, 392].forEach((f, i) => tone(f, 3.2 - i * 0.4, { vol: 0.22 / (i + 1), attack: 0.003, wet: 0.7 })); noise(0.3, { freq: 200, vol: 0.2, type: 'lowpass' }); },
  ring() { tone(600, 0.05, { type: 'triangle', vol: 0.05, wet: 0 }); },
  coin() { tone(1568, 0.12, { type: 'square', vol: 0.03, wet: 0.2 }); tone(2093, 0.25, { type: 'triangle', vol: 0.06, delay: 0.06, wet: 0.3 }); },
  chest() { noise(0.3, { freq: 300, vol: 0.25, type: 'lowpass' }); tone(110, 0.3, { type: 'square', vol: 0.05 }); setTimeout(() => sfx.coin(), 260); },
  loot(rarity) {
    const base = { worn: 392, blessed: 523, relic: 659, cursed: 311 }[rarity] ?? 440;
    [0, 4, 7, 12].forEach((s, i) => tone(base * Math.pow(2, s / 12), 0.7, { type: rarity === 'cursed' ? 'sawtooth' : 'triangle', vol: 0.07, delay: i * 0.07, wet: 0.5 }));
  },
  equip() { tone(330, 0.1, { type: 'square', vol: 0.05 }); tone(495, 0.18, { type: 'triangle', vol: 0.08, delay: 0.07 }); },
  fire() { noise(0.9, { freq: 800, to: 300, vol: 0.4, type: 'lowpass', wet: 0.3 }); tone(80, 0.5, { slide: -30, vol: 0.3 }); },
  hook() { noise(0.2, { freq: 3000, to: 900, vol: 0.15, q: 3 }); tone(300, 0.25, { type: 'sawtooth', slide: -150, vol: 0.06 }); },
  scream() { tone(700, 0.8, { type: 'sawtooth', slide: 300, vol: 0.05, wet: 0.5 }); tone(1050, 0.8, { type: 'sawtooth', slide: 420, vol: 0.03, wet: 0.5 }); },
  raise() { noise(1.2, { freq: 150, to: 600, vol: 0.35, type: 'lowpass', attack: 0.3, wet: 0.5 }); tone(55, 1.2, { type: 'sawtooth', vol: 0.08, attack: 0.3 }); },
  victory() { [262, 330, 392, 523, 659].forEach((f, i) => tone(f, 1.6, { type: 'triangle', vol: 0.09, delay: i * 0.12, wet: 0.6 })); },
  defeat() { [220, 207, 196, 147].forEach((f, i) => tone(f, 1.4, { type: 'sawtooth', vol: 0.045, delay: i * 0.32, wet: 0.6 })); },
  phase() { tone(147, 1.6, { vol: 0.14, wet: 0.6 }); tone(220, 1.6, { vol: 0.08, delay: 0.04, wet: 0.6 }); },
  enemyPhase() { tone(98, 1.4, { type: 'sawtooth', vol: 0.05, wet: 0.6 }); tone(104, 1.4, { type: 'sawtooth', vol: 0.04, wet: 0.6 }); },
  page() { noise(0.12, { freq: 3500, to: 1500, vol: 0.06, q: 0.8, wet: 0.1 }); },
};

// ---------- recorded samples ----------
// assets/sfx/manifest.json maps an sfx name to recorded files plus mix settings.
// Every sfx call plays a random variation (with pitch and volume jitter) when one is
// loaded, and only falls back to the synth above when no recording exists.
let manifest = {};
const buffers = {};
const lastPick = {};
export async function loadSamples(base = 'assets/sfx/') {
  try {
    manifest = await (await fetch(`${base}manifest.json`)).json();
  } catch { return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  if (!ctx) ac();
  const files = new Set(Object.values(manifest).flatMap((m) => m.files));
  await Promise.all([...files].map(async (f) => {
    try {
      const data = await (await fetch(base + f)).arrayBuffer();
      buffers[f] = await new Promise((res, rej) => ctx.decodeAudioData(data, res, rej));
    } catch { /* missing file: synth fallback */ }
  }));
}
function playSample(key, opts = {}) {
  const m = manifest[key];
  if (!m || !ctx) return false;
  const ready = m.files.filter((f) => buffers[f]);
  if (!ready.length) return false;
  if (ctx.state === 'suspended') ctx.resume();
  // never the same variation twice in a row
  let f = ready[Math.floor(Math.random() * ready.length)];
  if (ready.length > 1 && f === lastPick[key]) f = ready[(ready.indexOf(f) + 1) % ready.length];
  lastPick[key] = f;
  const [r0, r1] = m.rate ?? [0.94, 1.06];
  const src = ctx.createBufferSource();
  src.buffer = buffers[f];
  src.playbackRate.value = (opts.rate ?? 1) * (r0 + Math.random() * (r1 - r0));
  const g = ctx.createGain();
  g.gain.value = (m.vol ?? 0.8) * (opts.vol ?? 1) * (0.85 + Math.random() * 0.3);
  let node = src;
  if (m.lowpass) { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = m.lowpass; node = node.connect(lp); }
  node.connect(g).connect(out(sfxBus, m.wet ?? 0.18));
  src.start(ctx.currentTime + (m.delay ?? 0) + (opts.delay ?? 0));
  return true;
}
// wrap every sfx: recording first, synth fallback; `layer` keys also play the synth
for (const k of Object.keys(sfx)) {
  if (k === 'unlock' || k === 'ambience') continue;
  const synth = sfx[k];
  sfx[k] = (...a) => {
    const variant = a.length && typeof a[0] === 'string' ? `${k}_${a[0]}` : null;
    const played = (variant && playSample(variant)) || playSample(k);
    if (!played || manifest[k]?.layer) synth(...a);
    for (const extra of manifest[k]?.also ?? []) playSample(extra);
  };
}
export const sampleCount = () => Object.keys(buffers).length;

// ---------- generative music ----------
const CHORDS = {
  explore: [[50, 53, 57], [46, 50, 53], [43, 50, 55], [45, 49, 52]],
  battle: [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]],
  boss: [[50, 53, 56], [49, 52, 56], [46, 50, 53], [45, 49, 52]],
};
const MELODY = [69, 74, 77, 79, 81, 84, 86];
const MOTIFS = [[74, 77, 81, 79], [81, 79, 77, 74], [69, 74, 76, 77, 74]];
const TEMPO = { explore: 58, battle: 84, boss: 100, camp: 52 };
let music = null;

function padChord(notes, t, dur, vol, formant) {
  for (const n of notes) {
    for (const det of [-7, 7]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = mtof(n);
      o.detune.value = det;
      const f = ctx.createBiquadFilter();
      f.type = formant ? 'bandpass' : 'lowpass';
      f.frequency.value = formant ? 900 : 700;
      f.Q.value = formant ? 4 : 0.7;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + Math.min(1.6, dur * 0.4));
      g.gain.setValueAtTime(vol, t + dur * 0.8);
      g.gain.linearRampToValueAtTime(0.0001, t + dur + 1.8);
      o.connect(f).connect(g).connect(out(musicBus, 0.5));
      o.start(t); o.stop(t + dur + 2);
    }
  }
}
function bellNote(m, t, vol = 0.05) {
  tone(mtof(m), 2.8, { vol, at: t, bus: musicBus, wet: 0.7, attack: 0.004 });
  tone(mtof(m) * 2.76, 1.2, { vol: vol * 0.35, at: t, bus: musicBus, wet: 0.7, attack: 0.004 });
}
function pluck(m, t, vol = 0.04) { tone(mtof(m), 0.35, { type: 'triangle', vol, at: t, bus: musicBus, wet: 0.25, attack: 0.003 }); }
function drum(t, vol = 0.25) { tone(110, 0.35, { vol, slide: -65, at: t, bus: musicBus, wet: 0.3 }); noise(0.08, { freq: 180, vol: vol * 0.5, type: 'lowpass', at: t, bus: musicBus, wet: 0.2 }); }

// recorded beds for each mode; the synth below only adds war drums in fights when they exist
const TRACK = { camp: 'camp', explore: 'explore', battle: 'battle', boss: 'battle' };
const tracks = {};
let bed = null;
export async function loadMusic(base = 'assets/music/') {
  if (!ctx) ac();
  if (!ctx) return;
  await Promise.all([...new Set(Object.values(TRACK))].map(async (n) => {
    try { tracks[n] = await new Promise(async (res, rej) => ctx.decodeAudioData(await (await fetch(`${base}${n}.ogg`)).arrayBuffer(), res, rej)); } catch { /* synth only */ }
  }));
  if (music && !bed) startBed(music.mode);
}
function startBed(mode) {
  const buf = tracks[TRACK[mode]];
  if (bed && bed.name === TRACK[mode]) return;
  const now = ctx.currentTime;
  if (bed) { const old = bed; old.g.gain.setTargetAtTime(0.0001, now, 0.8); setTimeout(() => { try { old.src.stop(); } catch { /* stopped */ } }, 4000); bed = null; }
  if (!buf) return;
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
  const g = ctx.createGain(); g.gain.value = 0.0001;
  g.gain.setTargetAtTime(mode === 'boss' ? 0.95 : 0.8, now + 0.3, 1.2);
  src.connect(g).connect(musicBus);
  src.start(now + 0.05, Math.random() * Math.min(20, buf.duration * 0.5));
  bed = { src, g, name: TRACK[mode] };
}

function schedule() {
  const now = ctx.currentTime;
  const recorded = !!bed;
  while (music.next < now + 0.25) {
    const t = music.next;
    const b = music.beat;
    const mode = music.mode;
    const chords = CHORDS[mode === 'camp' ? 'explore' : mode] ?? CHORDS.explore;
    const beatsPerChord = mode === 'boss' ? 4 : 8;
    const chord = chords[Math.floor(b / beatsPerChord) % chords.length];
    const spb = 60 / TEMPO[mode];
    if (recorded) {
      // under a recorded bed: only slow war drums in fights, nothing in camp or on the map
      if (mode === 'battle' || mode === 'boss') {
        if (b % 4 === 0) drum(t, mode === 'boss' ? 0.32 : 0.2);
        if (mode === 'boss' && b % 4 === 2) drum(t, 0.14);
        if (mode === 'boss' && b % 8 === 7) drum(t + spb / 2, 0.1);
      }
      music.next += spb; music.beat++;
      continue;
    }
    if (b % beatsPerChord === 0) {
      padChord(chord, t, spb * beatsPerChord, mode === 'camp' ? 0.012 : 0.016, false);
      if (mode === 'boss') padChord(chord.map((n) => n + 12), t, spb * beatsPerChord, 0.01, true);
      tone(mtof(chord[0] - 12), spb * beatsPerChord + 1, { type: 'sine', vol: 0.06, at: t, bus: musicBus, wet: 0.2, attack: 0.5 });
    }
    if (mode === 'explore' || mode === 'camp') {
      // a recurring bell motif every 16 beats, with sparse random bells between
      if (b % 16 === 8) MOTIFS[Math.floor(b / 16) % MOTIFS.length].forEach((m, i) => bellNote(m, t + i * spb * 0.75, 0.04));
      else if (b % 16 < 6 && Math.random() < 0.2) bellNote(MELODY[Math.floor(Math.random() * MELODY.length)], t, 0.03);
    } else {
      const arp = [chord[0] + 12, chord[1] + 12, chord[2] + 12, chord[1] + 12];
      pluck(arp[b % 4], t, mode === 'boss' ? 0.035 : 0.028);
      pluck(arp[(b + 2) % 4] + 12, t + spb / 2, 0.018);
      if (b % 4 === 0) drum(t, mode === 'boss' ? 0.3 : 0.22);
      if (b % 4 === 2) drum(t, 0.12);
      if (mode === 'boss') drum(t + spb / 2, 0.08);
      if (Math.random() < 0.12) bellNote(MELODY[Math.floor(Math.random() * MELODY.length)], t, 0.025);
    }
    music.next += spb;
    music.beat++;
  }
}

export const musicPlayer = {
  play(mode) {
    const c = ac(); if (!c) return;
    if (music && music.mode === mode) return;
    if (!music) {
      music = { mode, beat: 0, next: c.currentTime + 0.1, timer: setInterval(() => schedule(), 60) };
      startBed(mode);
    } else {
      // crossfade: dip the bus, switch the arrangement at the bottom, bring it back up
      const now = c.currentTime;
      musicBus.gain.cancelScheduledValues(now);
      musicBus.gain.setValueAtTime(musicBus.gain.value, now);
      musicBus.gain.linearRampToValueAtTime(0.0001, now + 0.9);
      musicBus.gain.linearRampToValueAtTime(settings.music, now + 2.6);
      setTimeout(() => { if (music) { music.mode = mode; music.beat = 0; startBed(mode); } }, 900);
    }
  },
  tension(t) { if (ctx && musicBus) musicBus.gain.setTargetAtTime(settings.music * (1 + t * 0.35), ctx.currentTime, 1.5); },
  toggleMute() {
    settings.muted = !settings.muted;
    saveSettings();
    if (master) master.gain.setTargetAtTime(settings.muted ? 0 : 0.7, ctx.currentTime, 0.05);
    return settings.muted;
  },
  get muted() { return settings.muted; },
};
