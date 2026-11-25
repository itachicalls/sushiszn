interface SaveData {
  coins: number;
  stars: Record<number, number>;
  muted: boolean;
}

const KEY = 'sushi-crush-save';

class SaveSystem {
  private data: SaveData = { coins: 0, stars: {}, muted: false };

  constructor() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      this.data = {
        coins: parsed.coins ?? 0,
        stars: { ...(parsed.stars ?? {}) },
        muted: parsed.muted ?? false,
      };
    } catch {
      // corrupted save — start fresh
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      // storage unavailable — play session-only
    }
  }

  get coins(): number {
    return this.data.coins;
  }

  addCoins(n: number): void {
    this.data.coins += n;
    this.persist();
  }

  starsFor(level: number): number {
    return this.data.stars[level] ?? 0;
  }

  recordStars(level: number, stars: number): void {
    if (stars > this.starsFor(level)) {
      this.data.stars[level] = stars;
      this.persist();
    }
  }

  isUnlocked(level: number): boolean {
    if (level <= 1) return true;
    return this.starsFor(level - 1) >= 2;
  }

  totalStars(): number {
    return Object.values(this.data.stars).reduce((sum, n) => sum + n, 0);
  }

  get muted(): boolean {
    return this.data.muted;
  }

  setMuted(muted: boolean): void {
    this.data.muted = muted;
    this.persist();
  }
}

export const save = new SaveSystem();
