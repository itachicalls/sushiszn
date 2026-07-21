import type { HazardKind } from './sushiTypes';

export interface SeasonDef {
  id: number;
  name: string;
  subtitle: string;
  bgKey: string;
  /** tint for the drifting petal particles */
  petalTint: number;
  /** accent color for UI in this season */
  accent: string;
  hazards: HazardKind[];
  /** extra horizontal wind applied to thrown sushi (px/s at design size) */
  windX: number;
  /** gravity multiplier — winter sushi falls faster (icy!) */
  gravityFactor: number;
}

export const SEASONS: SeasonDef[] = [
  {
    id: 0,
    name: 'Sakura Spring',
    subtitle: 'where the season begins ~',
    bgKey: 'bg',
    petalTint: 0xffc7dd,
    accent: '#ff5e6c',
    hazards: ['wasabi'],
    windX: 0,
    gravityFactor: 1,
  },
  {
    id: 1,
    name: 'Beach Summer',
    subtitle: 'sushi with a sea breeze ~',
    bgKey: 'bg_summer',
    petalTint: 0xfff3b0,
    accent: '#00a6c0',
    hazards: ['wasabi', 'soysauce'],
    windX: 60,
    gravityFactor: 1,
  },
  {
    id: 2,
    name: 'Maple Autumn',
    subtitle: 'spicy season, handle with care ~',
    bgKey: 'bg_autumn',
    petalTint: 0xffa14e,
    accent: '#e07a1f',
    hazards: ['wasabi', 'soysauce', 'chili'],
    windX: 90,
    gravityFactor: 1.05,
  },
  {
    id: 3,
    name: 'Snowy Winter',
    subtitle: 'the final, frosty course ~',
    bgKey: 'bg_winter',
    petalTint: 0xffffff,
    accent: '#5a7bd6',
    hazards: ['wasabi', 'soysauce', 'chili', 'fugu'],
    windX: 70,
    gravityFactor: 1.12,
  },
];

export const LEVELS_PER_SEASON = 10;
export const TOTAL_LEVELS = SEASONS.length * LEVELS_PER_SEASON;

export interface LevelConfig {
  id: number;
  season: SeasonDef;
  /** index within the season, 0-9 */
  stage: number;
  durationSeconds: number;
  spawnIntervalStart: number;
  spawnIntervalEnd: number;
  hazardChance: number;
  goldenChance: number;
  /** score needed for 1 / 2 / 3 stars */
  starThresholds: [number, number, number];
}

/** Deterministic difficulty curve across all 40 levels. */
export function getLevel(id: number): LevelConfig {
  const clamped = Math.min(Math.max(id, 1), TOTAL_LEVELS);
  const seasonIdx = Math.floor((clamped - 1) / LEVELS_PER_SEASON);
  const stage = (clamped - 1) % LEVELS_PER_SEASON;
  const t = (clamped - 1) / (TOTAL_LEVELS - 1); // 0..1 across the whole game

  const duration = 45 + seasonIdx * 5; // 45 / 50 / 55 / 60s
  const spawnStart = Math.round(1350 - 600 * t); // 1350 -> 750ms
  const spawnEnd = Math.round(750 - 320 * t); // 750 -> 430ms
  const hazardChance = 0.07 + 0.11 * t; // 7% -> 18%
  const goldenChance = 0.05;

  // Expected achievable score grows with pace; two stars should feel earned.
  const two = Math.round((1100 + 5200 * Math.pow(t, 1.12)) / 50) * 50;
  const one = Math.round((two * 0.55) / 50) * 50;
  const three = Math.round((two * 1.5) / 50) * 50;

  return {
    id: clamped,
    season: SEASONS[seasonIdx],
    stage,
    durationSeconds: duration,
    spawnIntervalStart: spawnStart,
    spawnIntervalEnd: spawnEnd,
    hazardChance,
    goldenChance,
    starThresholds: [one, two, three],
  };
}

export function starsForScore(cfg: LevelConfig, score: number): number {
  const [one, two, three] = cfg.starThresholds;
  if (score >= three) return 3;
  if (score >= two) return 2;
  if (score >= one) return 1;
  return 0;
}

/** Coins earned from a run. */
export function coinsForRun(score: number, stars: number, firstClear: boolean): number {
  let coins = Math.floor(score / 140) + stars * 12;
  if (firstClear && stars >= 2) coins += 30;
  return coins;
}
