import type { UpgradeLevels } from './save';

export interface UpgradeDef {
  key: keyof UpgradeLevels;
  name: string;
  desc: string;
  icon: string;
  maxLevel: number;
  cost: (n: number) => number;
}

export const UPGRADES: UpgradeDef[] = [
  {
    key: 'reach',
    name: 'Long Straw',
    desc: 'bigger sip reach per level',
    icon: 'straw',
    maxLevel: 5,
    cost: (n) => 120 * n,
  },
  {
    key: 'lucky',
    name: 'Lucky Pearl',
    desc: 'more golden pearls appear',
    icon: 'golden',
    maxLevel: 5,
    cost: (n) => 150 * n,
  },
  {
    key: 'fever',
    name: 'Cup Boost',
    desc: 'the cup fills up faster',
    icon: 'fx_sparkle',
    maxLevel: 4,
    cost: (n) => 180 * n,
  },
  {
    key: 'heart',
    name: 'Extra Heart',
    desc: '+1 max heart per level',
    icon: 'heart',
    maxLevel: 2,
    cost: (n) => 400 * n,
  },
  {
    key: 'guard',
    name: 'Splash Guard',
    desc: 'first hot sips cost no heart',
    icon: 'splash',
    maxLevel: 3,
    cost: (n) => 250 * n,
  },
];

export interface AppliedUpgrades {
  reachMultiplier: number;
  extraGoldenChance: number;
  feverGrabsReduction: number;
  extraHearts: number;
  hazardGuards: number;
}

export function applyUpgrades(u: UpgradeLevels): AppliedUpgrades {
  return {
    reachMultiplier: 1 + u.reach * 0.09,
    extraGoldenChance: u.lucky * 0.012,
    feverGrabsReduction: u.fever,
    extraHearts: u.heart,
    hazardGuards: u.guard,
  };
}
