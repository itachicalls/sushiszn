export interface UpgradeLevels {
  reach: number;
  lucky: number;
  fever: number;
  heart: number;
  guard: number;
}

interface SaveData {
  coins: number;
  upgrades: UpgradeLevels;
  /** stars earned per level id (1-based) */
  stars: Record<number, number>;
  muted: boolean;
  highScore: number;
}

const KEY = 'sushi-szn-save';

const DEFAULTS: SaveData = {
  coins: 0,
  upgrades: { reach: 0, lucky: 0, fever: 0, heart: 0, guard: 0 },
  stars: {},
  muted: false,
  highScore: 0,
};

class SaveSystem {
  private data: SaveData;

  constructor() {
    this.data = { ...DEFAULTS, upgrades: { ...DEFAULTS.upgrades }, stars: {} };
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SaveData>;
        this.data = {
          ...this.data,
          ...parsed,
          upgrades: { ...this.data.upgrades, ...(parsed.upgrades ?? {}) },
          stars: { ...(parsed.stars ?? {}) },
        };
      }
      // migrate old high score
      const legacy = Number(localStorage.getItem('sushi-szn-highscore') ?? '0');
      if (legacy > this.data.highScore) this.data.highScore = legacy;
    } catch {
      // corrupted save — start fresh
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      // storage unavailable (private mode) — play session-only
    }
  }

  get coins(): number {
    return this.data.coins;
  }

  addCoins(n: number): void {
    this.data.coins += n;
    this.persist();
  }

  spendCoins(n: number): boolean {
    if (this.data.coins < n) return false;
    this.data.coins -= n;
    this.persist();
    return true;
  }

  get upgrades(): UpgradeLevels {
    return this.data.upgrades;
  }

  raiseUpgrade(key: keyof UpgradeLevels): void {
    this.data.upgrades[key] += 1;
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
    return Object.values(this.data.stars).reduce((a, b) => a + b, 0);
  }

  get muted(): boolean {
    return this.data.muted;
  }

  setMuted(m: boolean): void {
    this.data.muted = m;
    this.persist();
  }

  get highScore(): number {
    return this.data.highScore;
  }

  recordScore(score: number): boolean {
    if (score > this.data.highScore) {
      this.data.highScore = score;
      this.persist();
      return true;
    }
    return false;
  }
}

export const save = new SaveSystem();
