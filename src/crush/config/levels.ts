import type { Goal, LevelRecipe } from '../systems/board';

export interface WorldDef {
  id: number;
  name: string;
  subtitle: string;
  theme: 'sushi' | 'boba';
  bgKey: string;
  accent: string;
  particle: 'fx_petal' | 'fx_bubble' | 'fx_sparkle';
  tint: number;
  kinds: string[];
  crustKey: string;
  fuseKey: string;
  jellyKey: string;
  jellyLabel: string;
  crustLabel: string;
  fuseLabel: string;
}

export const WORLDS: WorldDef[] = [
  {
    id: 0,
    name: 'Lucky Lounge',
    subtitle: 'a cute night at the tables ~',
    theme: 'sushi',
    bgKey: 'bg_casino',
    accent: '#ff5e8a',
    particle: 'fx_sparkle',
    tint: 0xffd6ea,
    kinds: ['salmon', 'tuna', 'tamago', 'onigiri', 'maki'],
    crustKey: 'wasabi',
    fuseKey: 'fugu',
    jellyKey: 'soysauce',
    jellyLabel: 'clear the soy',
    crustLabel: 'melt the wasabi',
    fuseLabel: 'defuse the fugu',
  },
  {
    id: 1,
    name: 'Pearl Parlor',
    subtitle: 'line up the pearls ~',
    theme: 'boba',
    bgKey: 'bg_parlor',
    accent: '#c47ad4',
    particle: 'fx_bubble',
    tint: 0xffe0f0,
    kinds: ['taro', 'sugar', 'mango', 'berry', 'lychee'],
    crustKey: 'ice',
    fuseKey: 'chili',
    jellyKey: 'splash',
    jellyLabel: 'clear the syrup',
    crustLabel: 'melt the ice',
    fuseLabel: 'cool the chili',
  },
  {
    id: 2,
    name: 'Beach Picnic',
    subtitle: 'sushi with a sea breeze ~',
    theme: 'sushi',
    bgKey: 'bg_beach',
    accent: '#00a6c0',
    particle: 'fx_petal',
    tint: 0xb8ecff,
    kinds: ['salmon', 'tuna', 'tamago', 'onigiri', 'maki'],
    crustKey: 'wasabi',
    fuseKey: 'fugu',
    jellyKey: 'soysauce',
    jellyLabel: 'clear the soy',
    crustLabel: 'melt the wasabi',
    fuseLabel: 'defuse the fugu',
  },
  {
    id: 3,
    name: 'Fruit Tide',
    subtitle: 'mango, berry, sunshine ~',
    theme: 'boba',
    bgKey: 'bg_tide',
    accent: '#e09020',
    particle: 'fx_bubble',
    tint: 0xffe08a,
    kinds: ['taro', 'sugar', 'mango', 'berry', 'lychee'],
    crustKey: 'ice',
    fuseKey: 'chili',
    jellyKey: 'splash',
    jellyLabel: 'clear the syrup',
    crustLabel: 'melt the ice',
    fuseLabel: 'cool the chili',
  },
  {
    id: 4,
    name: 'Maple Heat',
    subtitle: 'spicy season, match with care ~',
    theme: 'sushi',
    bgKey: 'bg_maple',
    accent: '#e07a1f',
    particle: 'fx_petal',
    tint: 0xffa14e,
    kinds: ['salmon', 'tuna', 'tamago', 'onigiri', 'maki'],
    crustKey: 'wasabi',
    fuseKey: 'fugu',
    jellyKey: 'soysauce',
    jellyLabel: 'clear the soy',
    crustLabel: 'melt the wasabi',
    fuseLabel: 'defuse the fugu',
  },
  {
    id: 5,
    name: 'Hojicha Snow',
    subtitle: 'one last warm cup ~',
    theme: 'boba',
    bgKey: 'bg_hojicha',
    accent: '#5a7bd6',
    particle: 'fx_bubble',
    tint: 0xffffff,
    kinds: ['taro', 'sugar', 'mango', 'berry', 'lychee'],
    crustKey: 'ice',
    fuseKey: 'chili',
    jellyKey: 'splash',
    jellyLabel: 'clear the syrup',
    crustLabel: 'melt the ice',
    fuseLabel: 'cool the chili',
  },
];

export const LEVELS_PER_WORLD = 6;
export const TOTAL_LEVELS = WORLDS.length * LEVELS_PER_WORLD;

const SUSHI_KINDS = ['salmon', 'tuna', 'tamago', 'onigiri', 'maki'];
const BOBA_KINDS = ['taro', 'sugar', 'mango', 'berry', 'lychee'];

function rotate(list: string[], by: number): string[] {
  const shift = ((by % list.length) + list.length) % list.length;
  return [...list.slice(shift), ...list.slice(0, shift)];
}

/** Every board is one menu: sushi and boba together, a few more kinds as the stage gets harder. */
function mixKinds(worldId: number, stage: number): string[] {
  const count = stage < 2 ? 4 : stage < 4 ? 5 : 6;
  const sushiCount = Math.ceil(count / 2);
  const bobaCount = count - sushiCount;
  const sushi = rotate(SUSHI_KINDS, worldId).slice(0, sushiCount);
  const boba = rotate(BOBA_KINDS, worldId + stage).slice(0, bobaCount);
  return [...sushi, ...boba];
}

const NAMES: Record<string, string> = {
  salmon: 'salmon',
  tuna: 'tuna',
  tamago: 'tamago',
  onigiri: 'onigiri',
  maki: 'maki',
  taro: 'taro',
  sugar: 'sugar',
  mango: 'mango',
  berry: 'berry',
  lychee: 'lychee',
};

export interface LevelConfig extends LevelRecipe {
  id: number;
  world: WorldDef;
  stage: number;
  starScores: [number, number, number];
}

export function getLevel(id: number): LevelConfig {
  const clamped = Math.min(Math.max(id, 1), TOTAL_LEVELS);
  const world = WORLDS[Math.floor((clamped - 1) / LEVELS_PER_WORLD)];
  const stage = (clamped - 1) % LEVELS_PER_WORLD;
  const kinds = mixKinds(world.id, stage);
  const goalType: Goal['type'] = (['score', 'score', 'collect', 'jelly', 'crust', 'fuse'] as const)[stage];
  const moves = Math.max(18, 30 - stage * 2 - world.id);

  let goal: Goal;
  let one = 1;
  let two = 2800 + world.id * 350 + stage * 150;
  let three = Math.round(two * 1.55);
  if (goalType === 'score') {
    const target = 1400 + stage * 450 + world.id * 350;
    goal = { type: 'score', target };
    one = target;
    two = Math.round(target * 1.35);
    three = Math.round(target * 1.8);
  } else if (goalType === 'collect') {
    const kind = kinds[stage % kinds.length];
    goal = { type: 'collect', kind, target: 10 + stage * 2 + world.id };
  } else {
    goal = { type: goalType };
  }

  let crust = 0;
  let jelly = 0;
  let fuses = 0;
  const crustHp = world.id >= 4 ? 2 : 1;
  const fuseTimer = Math.max(5, 8 - Math.floor(world.id / 2));
  if (goal.type === 'crust') crust = Math.min(12, 5 + world.id + Math.floor(stage / 2));
  else if (world.id >= 2 && stage >= 4) crust = 2 + Math.floor(world.id / 2);
  if (goal.type === 'jelly') jelly = Math.min(16, 8 + world.id * 2 + stage);
  else if (world.id >= 3 && stage >= 3) jelly = 4;
  if (goal.type === 'fuse') fuses = Math.min(4, 2 + Math.floor(world.id / 2));
  else if (world.id >= 4 && stage === 5) fuses = 1;

  return {
    id: clamped,
    world,
    stage,
    kinds,
    moves,
    goal,
    crust,
    crustHp,
    jelly,
    fuses,
    fuseTimer,
    seed: clamped * 9973 + 42,
    starScores: [one, two, three],
  };
}

export function goalText(level: LevelConfig): string {
  const goal = level.goal;
  if (goal.type === 'score') return `score ${goal.target.toLocaleString('en-US')}`;
  if (goal.type === 'collect') return `collect ${goal.target} ${NAMES[goal.kind] ?? goal.kind}`;
  if (goal.type === 'jelly') return level.world.jellyLabel;
  if (goal.type === 'crust') return level.world.crustLabel;
  return level.world.fuseLabel;
}

export function goalIcon(level: LevelConfig): string {
  const goal = level.goal;
  if (goal.type === 'collect') return goal.kind;
  if (goal.type === 'jelly') return level.world.jellyKey;
  if (goal.type === 'crust') return level.world.crustKey;
  if (goal.type === 'fuse') return level.world.fuseKey;
  return 'ui_star';
}

export function starsFor(level: LevelConfig, score: number, won: boolean): number {
  if (!won) return 0;
  const [one, two, three] = level.starScores;
  if (score >= three) return 3;
  if (score >= two) return 2;
  if (score >= one) return 1;
  return 1;
}

export function coinsFor(score: number, stars: number, firstClear: boolean): number {
  let coins = Math.floor(score / 180) + stars * 8;
  if (firstClear) coins += 20;
  return coins;
}
