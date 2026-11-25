export type DrinkKind =
  | 'taro'
  | 'sugar'
  | 'mango'
  | 'berry'
  | 'lychee'
  | 'golden'
  | 'splash'
  | 'ice'
  | 'chili';

export interface DrinkDef {
  kind: DrinkKind;
  texture: string;
  points: number;
  isBomb: boolean;
  isBonus: boolean;
  /** melted ice: no heart loss, the combo slows instead */
  isChill: boolean;
  /** display width in px on the 390x780 canvas */
  size: number;
  glow: number;
}

export const DRINK_TYPES: Record<
  Exclude<DrinkKind, 'golden' | 'splash' | 'ice' | 'chili'>,
  DrinkDef
> = {
  taro: { kind: 'taro', texture: 'taro', points: 100, isBomb: false, isBonus: false, isChill: false, size: 108, glow: 0 },
  sugar: { kind: 'sugar', texture: 'sugar', points: 110, isBomb: false, isBonus: false, isChill: false, size: 106, glow: 0 },
  mango: { kind: 'mango', texture: 'mango', points: 120, isBomb: false, isBonus: false, isChill: false, size: 106, glow: 0 },
  berry: { kind: 'berry', texture: 'berry', points: 130, isBomb: false, isBonus: false, isChill: false, size: 100, glow: 0 },
  lychee: { kind: 'lychee', texture: 'lychee', points: 140, isBomb: false, isBonus: false, isChill: false, size: 104, glow: 0 },
};

export const GOLDEN_PEARL: DrinkDef = {
  kind: 'golden',
  texture: 'golden',
  points: 350,
  isBomb: false,
  isBonus: true,
  isChill: false,
  size: 112,
  glow: 0xffd75e,
};

export const HOT_SPLASH: DrinkDef = {
  kind: 'splash',
  texture: 'splash',
  points: 0,
  isBomb: true,
  isBonus: false,
  isChill: false,
  size: 100,
  glow: 0xffb15a,
};

export const MELTED_ICE: DrinkDef = {
  kind: 'ice',
  texture: 'ice',
  points: 0,
  isBomb: false,
  isBonus: false,
  isChill: true,
  size: 104,
  glow: 0x9fd4ff,
};

export const CHILI_BOBA: DrinkDef = {
  kind: 'chili',
  texture: 'chili',
  points: 0,
  isBomb: true,
  isBonus: false,
  isChill: false,
  size: 98,
  glow: 0xff6a6a,
};

export const HAZARDS: Record<'splash' | 'ice' | 'chili', DrinkDef> = {
  splash: HOT_SPLASH,
  ice: MELTED_ICE,
  chili: CHILI_BOBA,
};

export type HazardKind = keyof typeof HAZARDS;

export const NORMAL_KINDS = Object.keys(DRINK_TYPES) as Array<keyof typeof DRINK_TYPES>;
