import type { HazardKind } from './drinkTypes';

export interface SeasonDef {
  id: number;
  name: string;
  subtitle: string;
  bgKey: string;
  /** tint for the drifting bubbles */
  bubbleTint: number;
  accent: string;
  hazards: HazardKind[];
  /** extra horizontal breeze applied to tossed toppings (px/s at design size) */
  windX: number;
  gravityFactor: number;
}

export const SEASONS: SeasonDef[] = [
  {
    id: 0,
    name: 'Cozy Kitchen',
    subtitle: 'where the hour begins ~',
    bgKey: 'bg',
    bubbleTint: 0xffe0c2,
    accent: '#e08a62',
    hazards: ['splash'],
    windX: 0,
    gravityFactor: 1,
  },
  {
    id: 1,
    name: 'Beach Fruit',
    subtitle: 'pearls on a sea breeze ~',
    bgKey: 'bg_summer',
    bubbleTint: 0xfff3b0,
    accent: '#00a6c0',
    hazards: ['splash', 'ice'],
    windX: 60,
    gravityFactor: 1,
  },
  {
    id: 2,
    name: 'Brown Sugar',
    subtitle: 'maple syrup season ~',
    bgKey: 'bg_autumn',
    bubbleTint: 0xffa14e,
    accent: '#e07a1f',
    hazards: ['splash', 'ice', 'chili'],
    windX: 90,
    gravityFactor: 1.05,
  },
  {
    id: 3,
    name: 'Hojicha Snow',
    subtitle: 'the last warm cup ~',
    bgKey: 'bg_winter',
    bubbleTint: 0xffffff,
    accent: '#5a7bd6',
    hazards: ['splash', 'ice', 'chili'],
    windX: 70,
    gravityFactor: 1.12,
  },
];

export const LEVELS_PER_SEASON = 10;
export const TOTAL_LEVELS = SEASONS.length * LEVELS_PER_SEASON;

export interface LevelConfig {
  id: number;
  season: SeasonDef;
  stage: number;
  durationSeconds: number;
  spawnIntervalStart: number;
  spawnIntervalEnd: number;
  hazardChance: number;
  goldenChance: number;
  starThresholds: [number, number, number];
}

export function getLevel(id: number): LevelConfig {
  const clamped = Math.min(Math.max(id, 1), TOTAL_LEVELS);
  const seasonIdx = Math.floor((clamped - 1) / LEVELS_PER_SEASON);
  const stage = (clamped - 1) % LEVELS_PER_SEASON;
  const t = (clamped - 1) / (TOTAL_LEVELS - 1);

  const duration = 45 + seasonIdx * 5;
  const spawnStart = Math.round(1350 - 600 * t);
  const spawnEnd = Math.round(750 - 320 * t);
  const hazardChance = 0.07 + 0.11 * t;
  const goldenChance = 0.05;

  const two = Math.round((750 + 5250 * Math.pow(t, 1.2)) / 50) * 50;
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

export function coinsForRun(score: number, stars: number, firstClear: boolean): number {
  let coins = Math.floor(score / 140) + stars * 12;
  if (firstClear && stars >= 2) coins += 30;
  return coins;
}
