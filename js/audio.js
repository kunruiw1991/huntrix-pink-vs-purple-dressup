// Procedural Web Audio ASMR synthesizer for paper-doll crafting & runway sparkle SFX
// Zero external audio files — works offline and unlocks cleanly on first iPad/desktop gesture

export class StudioAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.lastGrain = 0;
  }

  ensure() {
    if (!this.enabled) return null;
    if (typeof window === "undefined") return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) this.ctx = new AudioCtx();
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setEnabled(flag) {
    this.enabled = Boolean(flag);
  }

  _noiseBuffer(ctx, duration = 0.14) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.65));
    }
    return buf;
  }

  playPaperCrinkle() {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this._noiseBuffer(ctx, 0.14);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(2400 + Math.random() * 900, now);
    bp.Q.value = 1.6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.14, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    src.connect(bp).connect(g).connect(ctx.destination);
    src.start(now);
  }

  playUnlockChain() {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [880, 1175, 1568].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      g.gain.setValueAtTime(0.001, now + idx * 0.06);
      g.gain.exponentialRampToValueAtTime(0.16, now + idx * 0.06 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.24);
      osc.connect(g).connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.25);
    });
  }

  playWheelTick() {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(520 + Math.random() * 260, now);
    osc.frequency.exponentialRampToValueAtTime(190, now + 0.05);
    g.gain.setValueAtTime(0.13, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  playPenStroke() {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    if (now - this.lastGrain < 0.065) return;
    this.lastGrain = now;
    const src = ctx.createBufferSource();
    src.buffer = this._noiseBuffer(ctx, 0.07);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 3200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.06, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
    src.connect(hp).connect(g).connect(ctx.destination);
    src.start(now);
  }

  playBrushSwish() {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    if (now - this.lastGrain < 0.075) return;
    this.lastGrain = now;
    const src = ctx.createBufferSource();
    src.buffer = this._noiseBuffer(ctx, 0.11);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(1100 + Math.random() * 450, now);
    bp.Q.value = 1.1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.08, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    src.connect(bp).connect(g).connect(ctx.destination);
    src.start(now);
  }

  playScissorSnip() {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    if (now - this.lastGrain < 0.09) return;
    this.lastGrain = now;
    const src = ctx.createBufferSource();
    src.buffer = this._noiseBuffer(ctx, 0.06);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(4200, now);
    bp.frequency.exponentialRampToValueAtTime(1600, now + 0.055);
    bp.Q.value = 3.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.14, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    src.connect(bp).connect(g).connect(ctx.destination);
    src.start(now);
  }

  playGemPop() {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    const base = 980 + Math.random() * 440;
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 1.45, now + 0.09);
    g.gain.setValueAtTime(0.14, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playGlitterShake() {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    if (now - this.lastGrain < 0.07) return;
    this.lastGrain = now;
    [1760, 2349, 2793].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f + Math.random() * 240, now + i * 0.02);
      g.gain.setValueAtTime(0.05, now + i * 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.02 + 0.09);
      osc.connect(g).connect(ctx.destination);
      osc.start(now + i * 0.02);
      osc.stop(now + i * 0.02 + 0.1);
    });
  }

  playMiniFan() {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    if (now - this.lastGrain < 0.11) return;
    this.lastGrain = now;
    const src = ctx.createBufferSource();
    src.buffer = this._noiseBuffer(ctx, 0.18);
    const lp = ctx.createBiquadFilter();
    lp.type = "bandpass";
    lp.frequency.setValueAtTime(620, now);
    lp.Q.value = 0.9;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.11, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
    src.connect(lp).connect(g).connect(ctx.destination);
    src.start(now);
  }

  playCardFlip() {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.06);
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  playSparkleFanfare() {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + i * 0.065);
      g.gain.setValueAtTime(0.001, now + i * 0.065);
      g.gain.exponentialRampToValueAtTime(0.14, now + i * 0.065 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.065 + 0.32);
      osc.connect(g).connect(ctx.destination);
      osc.start(now + i * 0.065);
      osc.stop(now + i * 0.065 + 0.34);
    });
  }
}
