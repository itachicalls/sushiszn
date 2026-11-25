export class ComboSystem {
  combo = 0;
  private lastGrabAt = 0;

  reset(): void {
    this.combo = 0;
    this.lastGrabAt = 0;
  }

  /**
   * @param slowed when chilled, a grab keeps the chain alive but does not climb
   */
  registerGrab(now: number, windowMs: number, slowed: boolean): number {
    const inWindow = this.lastGrabAt > 0 && now - this.lastGrabAt <= windowMs;
    if (!inWindow) this.combo = 1;
    else if (!slowed) this.combo += 1;
    this.lastGrabAt = now;
    return this.combo;
  }

  /** ice nudges the chain down one step instead of breaking it */
  slowDown(): void {
    if (this.combo > 1) this.combo -= 1;
    else {
      this.combo = 0;
      this.lastGrabAt = 0;
    }
  }

  breakCombo(): void {
    this.combo = 0;
    this.lastGrabAt = 0;
  }

  tick(now: number, windowMs: number): void {
    if (this.combo > 0 && this.lastGrabAt > 0 && now - this.lastGrabAt > windowMs) {
      this.combo = 0;
    }
  }
}
