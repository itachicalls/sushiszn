import { BALANCE } from '../config/balance';

export class ComboSystem {
  combo = 0;
  private lastGrabAt = 0;

  reset(): void {
    this.combo = 0;
    this.lastGrabAt = 0;
  }

  registerGrab(now: number): number {
    if (this.lastGrabAt > 0 && now - this.lastGrabAt <= BALANCE.comboWindowMs) {
      this.combo += 1;
    } else {
      this.combo = 1;
    }
    this.lastGrabAt = now;
    return this.combo;
  }

  breakCombo(): void {
    this.combo = 0;
    this.lastGrabAt = 0;
  }

  tick(now: number): void {
    if (this.combo > 0 && this.lastGrabAt > 0 && now - this.lastGrabAt > BALANCE.comboWindowMs) {
      this.combo = 0;
    }
  }
}
