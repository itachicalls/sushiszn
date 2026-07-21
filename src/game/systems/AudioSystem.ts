/** Procedural SFX + a cozy pentatonic BGM loop via Web Audio — zero asset files. */
export class AudioSystem {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private muted = false;
  private bgmTimer: number | null = null;
  private bgmStep = 0;

  unlock(): void {
    const ctx = this.ensureCtx();
    if (ctx.state === 'suspended') void ctx.resume();
  }

  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.5;
      this.musicGain.connect(this.master);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 1, this.ctx.currentTime, 0.02);
    }
    return this.muted;
  }

  // ---- music ----

  startBgm(): void {
    if (this.bgmTimer !== null) return;
    this.ensureCtx();
    this.bgmStep = 0;
    const stepMs = 250;
    this.bgmTimer = window.setInterval(() => this.playBgmStep(), stepMs);
  }

  stopBgm(): void {
    if (this.bgmTimer !== null) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  private playBgmStep(): void {
    const ctx = this.ctx;
    const out = this.musicGain;
    if (!ctx || !out || document.hidden) {
      this.bgmStep++;
      return;
    }
    const t = ctx.currentTime;
    // C major pentatonic, gentle 16-step pattern
    const melody = [523, 0, 659, 587, 784, 0, 659, 0, 880, 784, 0, 659, 587, 0, 523, 0];
    const bass = [131, 0, 0, 0, 165, 0, 0, 0, 147, 0, 0, 0, 196, 0, 0, 0];
    const s = this.bgmStep % 16;

    const note = melody[s];
    if (note > 0) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = note;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.045, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
      osc.connect(g);
      g.connect(out);
      osc.start(t);
      osc.stop(t + 0.36);
    }
    const b = bass[s];
    if (b > 0) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = b;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.06, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      osc.connect(g);
      g.connect(out);
      osc.start(t);
      osc.stop(t + 0.6);
    }
    this.bgmStep++;
  }

  // ---- sfx ----

  private tone(
    freq: number,
    endFreq: number,
    dur: number,
    type: OscillatorType,
    vol: number,
    delay = 0,
  ): void {
    const ctx = this.ensureCtx();
    if (!this.master) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (endFreq !== freq) osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur * 0.7);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  grab(combo: number): void {
    const base = 480 + Math.min(combo, 10) * 45;
    this.tone(base, base * 1.5, 0.14, 'triangle', 0.16);
  }

  golden(): void {
    this.tone(660, 990, 0.12, 'triangle', 0.14);
    this.tone(880, 1320, 0.14, 'triangle', 0.12, 0.07);
    this.tone(1100, 1650, 0.18, 'triangle', 0.1, 0.14);
  }

  miss(): void {
    this.tone(240, 95, 0.24, 'sine', 0.13);
  }

  bomb(): void {
    this.tone(150, 40, 0.32, 'sawtooth', 0.11);
    this.tone(90, 35, 0.3, 'square', 0.06, 0.03);
  }

  combo(): void {
    this.tone(520, 520, 0.1, 'square', 0.06);
    this.tone(660, 660, 0.1, 'square', 0.06, 0.06);
    this.tone(780, 780, 0.12, 'square', 0.06, 0.12);
  }

  fever(): void {
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((n, i) => this.tone(n, n, 0.16, 'triangle', 0.11, i * 0.06));
  }

  heartLost(): void {
    this.tone(330, 165, 0.2, 'sine', 0.12);
    this.tone(220, 110, 0.24, 'sine', 0.1, 0.08);
  }

  ui(): void {
    this.tone(660, 660, 0.1, 'triangle', 0.1);
  }
}

export const audio = new AudioSystem();
