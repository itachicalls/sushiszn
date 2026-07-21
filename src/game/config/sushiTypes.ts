export type SushiKind =
  | 'salmon'
  | 'tuna'
  | 'tamago'
  | 'onigiri'
  | 'maki'
  | 'golden'
  | 'wasabi'
  | 'soysauce'
  | 'chili'
  | 'fugu';

export interface SushiDef {
  kind: SushiKind;
  texture: string;
  points: number;
  isBomb: boolean;
  isBonus: boolean;
  /** display width in px on the 390x780 canvas */
  size: number;
}

export const SUSHI_TYPES: Record<
  Exclude<SushiKind, 'wasabi' | 'golden' | 'soysauce' | 'chili' | 'fugu'>,
  SushiDef
> = {
  salmon: { kind: 'salmon', texture: 'salmon', points: 100, isBomb: false, isBonus: false, size: 108 },
  tuna: { kind: 'tuna', texture: 'tuna', points: 110, isBomb: false, isBonus: false, size: 106 },
  tamago: { kind: 'tamago', texture: 'tamago', points: 120, isBomb: false, isBonus: false, size: 106 },
  onigiri: { kind: 'onigiri', texture: 'onigiri', points: 130, isBomb: false, isBonus: false, size: 100 },
  maki: { kind: 'maki', texture: 'maki', points: 140, isBomb: false, isBonus: false, size: 96 },
};

export const GOLDEN_SUSHI: SushiDef = {
  kind: 'golden',
  texture: 'golden',
  points: 350,
  isBomb: false,
  isBonus: true,
  size: 112,
};

export const WASABI_BOMB: SushiDef = {
  kind: 'wasabi',
  texture: 'wasabi',
  points: 0,
  isBomb: true,
  isBonus: false,
  size: 92,
};

/** Seasonal hazards — all behave like wasabi (grab = lose heart + break combo). */
export const HAZARDS: Record<'wasabi' | 'soysauce' | 'chili' | 'fugu', SushiDef> = {
  wasabi: WASABI_BOMB,
  soysauce: { kind: 'soysauce', texture: 'soysauce', points: 0, isBomb: true, isBonus: false, size: 96 },
  chili: { kind: 'chili', texture: 'chili', points: 0, isBomb: true, isBonus: false, size: 98 },
  fugu: { kind: 'fugu', texture: 'fugu', points: 0, isBomb: true, isBonus: false, size: 100 },
};

export type HazardKind = keyof typeof HAZARDS;

export const NORMAL_KINDS = Object.keys(SUSHI_TYPES) as Array<keyof typeof SUSHI_TYPES>;
