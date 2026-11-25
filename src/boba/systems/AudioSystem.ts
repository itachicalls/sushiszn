import { save } from '../config/save';

/** Procedural SFX and a soft pentatonic tea-shop loop. */
export class AudioSystem {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private muted = save.muted;
  private bgmTimer: number | null = null;
  private bgmStep = 0;

  constructor() {
    const resume = () => this.resumeIfSuspended();
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) resume();
    });
    window.addEventListener('focus', resume);
    window.addEventListener('pageshow', resume);
    window.addEventListener('touchend', resume, { passive: true });
    window.addEventListener('pointerdown', resume, { passive: true });
  }

  private resumeIfSuspended(): void {
    if (this.ctx && this.ctx.state !== 'running') void this.ctx.resume();
  }

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
      this.musicGain.gain.value = 0.45;
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
    save.setMuted(this.muted);
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 1, this.ctx.currentTime, 0.02);
    }
    return this.muted;
  }

  startBgm(): void {
    if (this.bgmTimer !== null) return;
    this.ensureCtx();
    this.bgmStep = 0;
    this.bgmTimer = window.setInterval(() => this.playBgmStep(), 280);
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
    // F major pentatonic, unhurried
    const melody = [349, 0, 440, 392, 523, 0, 440, 0, 587, 523, 0, 440, 392, 0, 349, 0];
    const bass = [87, 0, 0, 0, 110, 0, 0, 0, 98, 0, 0, 0, 131, 0, 0, 0];
    const s = this.bgmStep % 16;
    const note = melody[s];
    if (note > 0) this.bell(note, 0.04, 0.38, t, out);
    const b = bass[s];
    if (b > 0) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = b;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.05, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      osc.connect(g);
      g.connect(out);
      osc.start(t);
      osc.stop(t + 0.64);
    }
    this.bgmStep++;
  }

  private bell(freq: number, vol: number, dur: number, t: number, out: GainNode): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

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
    if (endFreq !== freq) osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), t + dur * 0.7);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  grab(combo: number): void {
    const base = 460 + Math.min(combo, 10) * 40;
    this.tone(base, base * 1.4, 0.13, 'triangle', 0.14);
  }

  golden(): void {
    this.tone(660, 990, 0.12, 'triangle', 0.13);
    this.tone(880, 1320, 0.14, 'triangle', 0.11, 0.07);
    this.tone(1100, 1650, 0.18, 'triangle', 0.09, 0.14);
  }

  miss(): void {
    this.tone(240, 110, 0.22, 'sine', 0.1);
  }

  bomb(): void {
    this.tone(180, 70, 0.26, 'sine', 0.1);
    this.tone(120, 60, 0.22, 'triangle', 0.05, 0.04);
  }

  chill(): void {
    this.tone(620, 310, 0.24, 'sine', 0.09);
    this.tone(440, 240, 0.28, 'triangle', 0.05, 0.06);
  }

  combo(): void {
    this.tone(523, 523, 0.1, 'triangle', 0.07);
    this.tone(659, 659, 0.1, 'triangle', 0.07, 0.06);
    this.tone(784, 784, 0.12, 'triangle', 0.07, 0.12);
  }

  fever(): void {
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((n, i) => this.tone(n, n, 0.16, 'triangle', 0.1, i * 0.06));
  }

  heartLost(): void {
    this.tone(330, 180, 0.2, 'sine', 0.1);
    this.tone(220, 120, 0.24, 'sine', 0.08, 0.08);
  }

  ui(): void {
    this.tone(620, 740, 0.09, 'triangle', 0.09);
  }
}

export const audio = new AudioSystem();
