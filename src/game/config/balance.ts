export const BALANCE = {
  hearts: 5,
  shiftSeconds: 60,
  comboWindowMs: 1400,
  minSwipeSpeed: 160,
  spawnIntervalStart: 1250,
  spawnIntervalEnd: 620,
  wasabiChanceAfterWarmup: 0.12,
  wasabiWarmupSeconds: 8,
  /** gravity at design height (scaled to viewport at runtime) */
  gravity: 540,
  goldenChance: 0.05,

  feverGrabsToFill: 11,
  feverDurationMs: 6500,
  feverSpawnFactor: 0.5,
  feverScoreMultiplier: 2,
} as const;

export const CREATOR_HANDLE = '@IShortBTC';
export const CREATOR_URL = 'https://x.com/IShortBTC';
