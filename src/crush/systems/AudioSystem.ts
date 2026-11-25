import { save } from '../config/save';

/** Soft pentatonic loop plus match pops. No audio files. */
export class AudioSystem {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private muted = save.muted;
  private bgmTimer: number | null = null;
  private bgmStep = 0;

  constructor() {
    const resume = () => {
      if (this.ctx && this.ctx.state !== 'running') void this.ctx.resume();
    };
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) resume();
    });
    window.addEventListener('focus', resume);
    window.addEventListener('pointerdown', resume, { passive: true });
  }

  unlock(): void {
    const ctx = this.ensure();
    if (ctx.state === 'suspended') void ctx.resume();
  }

  private ensure(): AudioContext {
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
    this.ensure();
    this.bgmStep = 0;
    this.bgmTimer = window.setInterval(() => this.step(), 250);
  }

  stopBgm(): void {
    if (this.bgmTimer === null) return;
    clearInterval(this.bgmTimer);
    this.bgmTimer = null;
  }

  private step(): void {
    const ctx = this.ctx;
    const out = this.musicGain;
    if (!ctx || !out || document.hidden) {
      this.bgmStep += 1;
      return;
    }
    const t = ctx.currentTime;
    const melody = [523, 0, 659, 784, 659, 0, 587, 0, 698, 880, 0, 784, 659, 0, 523, 0];
    const bass = [196, 0, 0, 0, 175, 0, 0, 0, 165, 0, 0, 0, 196, 0, 0, 0];
    const s = this.bgmStep % 16;
    this.blip(melody[s], out, t, 0.04, 0.32);
    this.blip(bass[s], out, t, 0.05, 0.5);
    this.bgmStep += 1;
  }

  private blip(freq: number, out: GainNode, t: number, vol: number, dur: number): void {
    if (freq <= 0 || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = freq < 300 ? 'sine' : 'triangle';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private tone(freq: number, endFreq: number, dur: number, type: OscillatorType, vol: number, delay = 0): void {
    const ctx = this.ensure();
    if (!this.master) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (endFreq !== freq) osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur * 0.7);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  pop(combo: number): void {
    const base = 520 + Math.min(combo, 8) * 50;
    this.tone(base, base * 1.4, 0.12, 'triangle', 0.14);
  }

  special(): void {
    this.tone(660, 990, 0.12, 'triangle', 0.13);
    this.tone(880, 1320, 0.14, 'triangle', 0.1, 0.06);
  }

  bad(): void {
    this.tone(220, 90, 0.22, 'sine', 0.12);
  }

  win(): void {
    [523, 659, 784, 1047].forEach((n, i) => this.tone(n, n, 0.16, 'triangle', 0.12, i * 0.07));
  }

  ui(): void {
    this.tone(700, 880, 0.08, 'triangle', 0.1);
  }
}

export const audio = new AudioSystem();
