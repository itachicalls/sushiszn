import { BALANCE } from '../config/balance';

export class FeverSystem {
  /** 0..1 meter */
  charge = 0;
  active = false;
  private remainingMs = 0;

  reset(): void {
    this.charge = 0;
    this.active = false;
    this.remainingMs = 0;
  }

  /** returns true when fever just triggered */
  addGrab(): boolean {
    if (this.active) return false;
    this.charge = Math.min(1, this.charge + 1 / BALANCE.feverGrabsToFill);
    if (this.charge >= 1) {
      this.active = true;
      this.remainingMs = BALANCE.feverDurationMs;
      return true;
    }
    return false;
  }

  punish(): void {
    if (!this.active) this.charge = Math.max(0, this.charge - 0.25);
  }

  /** returns true when fever just ended */
  tick(delta: number): boolean {
    if (!this.active) return false;
    this.remainingMs -= delta;
    this.charge = Math.max(0, this.remainingMs / BALANCE.feverDurationMs);
    if (this.remainingMs <= 0) {
      this.active = false;
      this.charge = 0;
      return true;
    }
    return false;
  }
}
