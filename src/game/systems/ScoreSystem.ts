export class ScoreSystem {
  score = 0;
  bestCombo = 0;

  reset(): void {
    this.score = 0;
    this.bestCombo = 0;
  }

  addPoints(base: number, combo: number): number {
    const gained = Math.round(base * (1 + Math.max(0, combo - 1) * 0.25));
    this.score += gained;
    if (combo > this.bestCombo) this.bestCombo = combo;
    return gained;
  }
}
