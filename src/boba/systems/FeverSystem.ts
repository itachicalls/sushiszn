import { BALANCE } from '../config/balance';

export class FeverSystem {
  charge = 0;
  active = false;
  grabsToFill: number = BALANCE.feverGrabsToFill;
  private remainingMs = 0;

  reset(): void {
    this.charge = 0;
    this.active = false;
    this.remainingMs = 0;
  }

  addGrab(): boolean {
    if (this.active) return false;
    this.charge = Math.min(1, this.charge + 1 / this.grabsToFill);
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
