// Procedurally-generated SFX via the Web Audio API -- no audio files, so
// nothing to license. Every sound is synthesized from noise bursts and
// oscillators shaped with gain/filter envelopes.
//
// Browsers block audio until a user gesture, so the AudioContext is created
// lazily by calling unlock() from the first keydown/pointerdown (see main.js)
// rather than at construction time.
export class SoundManager {
  constructor() {
    this._ctx = null;
    this._noiseBuffers = new Map();
  }

  unlock() {
    if (this._ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this._ctx = new AudioContextClass();
  }

  _ensureContext() {
    if (!this._ctx) return null;
    if (this._ctx.state === 'suspended') this._ctx.resume();
    return this._ctx;
  }

  _getNoiseBuffer(duration) {
    const ctx = this._ctx;
    if (this._noiseBuffers.has(duration)) return this._noiseBuffers.get(duration);
    const length = Math.max(1, Math.ceil(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    this._noiseBuffers.set(duration, buffer);
    return buffer;
  }

  _playNoiseBurst({ duration, filterType = 'bandpass', filterFreq = 1000, filterQ = 1, gain = 0.3 }) {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const src = ctx.createBufferSource();
    src.buffer = this._getNoiseBuffer(duration);

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;
    filter.Q.value = filterQ;

    const env = ctx.createGain();
    const now = ctx.currentTime;
    env.gain.setValueAtTime(gain, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + duration);

    src.connect(filter).connect(env).connect(ctx.destination);
    src.start(now);
    src.stop(now + duration + 0.02);
  }

  _playTone({ freq, toFreq = freq, duration = 0.2, type = 'sine', gain = 0.25 }) {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = type;
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, toFreq), now + duration);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(gain, now + 0.01);
    env.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(env).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  // Low pitch-bent groan layered with muffled low-pass noise (gurgle).
  playZombieHit() {
    this._playTone({ freq: 190, toFreq: 85, duration: 0.32, type: 'sawtooth', gain: 0.16 });
    this._playNoiseBurst({ duration: 0.3, filterType: 'lowpass', filterFreq: 500, filterQ: 0.7, gain: 0.12 });
  }

  // Sharp, fast-decaying high-passed knock -- a hard, dull crack.
  playTombstoneHit() {
    this._playNoiseBurst({ duration: 0.09, filterType: 'highpass', filterFreq: 1800, filterQ: 1.2, gain: 0.32 });
    this._playNoiseBurst({ duration: 0.14, filterType: 'bandpass', filterFreq: 700, filterQ: 2, gain: 0.18 });
  }

  // Rougher, longer band-passed noise plus a quick downward tick -- a snap.
  playBarricadeHit() {
    this._playNoiseBurst({ duration: 0.22, filterType: 'bandpass', filterFreq: 1100, filterQ: 1.4, gain: 0.28 });
    this._playTone({ freq: 900, toFreq: 300, duration: 0.08, type: 'square', gain: 0.1 });
  }

  playHitFor(bumperType) {
    if (bumperType === 'zombieHead') this.playZombieHit();
    else if (bumperType === 'tombstone') this.playTombstoneHit();
    else if (bumperType === 'barricade') this.playBarricadeHit();
  }

  // Short ascending arpeggio for scoring milestones.
  playMilestoneStinger() {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, i) => {
      const t0 = ctx.currentTime + i * 0.07;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t0);
      env.gain.linearRampToValueAtTime(0.18, t0 + 0.01);
      env.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);

      osc.connect(env).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.2);
    });
  }
}
