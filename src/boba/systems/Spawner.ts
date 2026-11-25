import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import {
  DRINK_TYPES,
  GOLDEN_PEARL,
  HOT_SPLASH,
  MELTED_ICE,
  NORMAL_KINDS,
  type DrinkDef,
} from '../config/drinkTypes';
import { DESIGN_HEIGHT, metrics } from '../config/layout';
import { DrinkPiece } from '../entities/Drink';

type Pattern = 'single' | 'fan' | 'volley' | 'crossfire';

export interface SpawnConfig {
  spawnIntervalStart: number;
  spawnIntervalEnd: number;
  hazardChance: number;
  hazardWarmupSeconds: number;
  goldenChance: number;
  hazards: DrinkDef[];
  windX: number;
  gravityFactor: number;
}

export function defaultSpawnConfig(): SpawnConfig {
  return {
    spawnIntervalStart: BALANCE.spawnIntervalStart,
    spawnIntervalEnd: BALANCE.spawnIntervalEnd,
    hazardChance: BALANCE.hazardChanceAfterWarmup,
    hazardWarmupSeconds: BALANCE.hazardWarmupSeconds,
    goldenChance: BALANCE.goldenChance,
    hazards: [HOT_SPLASH, MELTED_ICE],
    windX: 0,
    gravityFactor: 1,
  };
}

export class Spawner {
  private scene: Phaser.Scene;
  private group: Phaser.Physics.Arcade.Group;
  private cfg: SpawnConfig;
  private elapsed = 0;
  private nextSpawnAt = 500;
  private active = true;
  feverMode = false;

  constructor(scene: Phaser.Scene, group: Phaser.Physics.Arcade.Group, cfg: SpawnConfig) {
    this.scene = scene;
    this.group = group;
    this.cfg = cfg;
  }

  stop(): void {
    this.active = false;
  }

  update(delta: number, shiftProgress: number): void {
    if (!this.active) return;
    this.elapsed += delta;
    if (this.elapsed < this.nextSpawnAt) return;

    let interval =
      this.cfg.spawnIntervalStart -
      (this.cfg.spawnIntervalStart - this.cfg.spawnIntervalEnd) * shiftProgress;
    if (this.feverMode) interval *= BALANCE.feverSpawnFactor;
    const { W, s } = metrics(this.scene);
    const widthFactor = Phaser.Math.Clamp((W / s / 390) * 0.6 + 0.4, 1, 1.9);
    this.nextSpawnAt = this.elapsed + interval / widthFactor;
    this.throwPattern(this.pickPattern(shiftProgress), shiftProgress);
  }

  private pickPattern(progress: number): Pattern {
    const roll = Math.random();
    if (progress < 0.15) return roll < 0.7 ? 'single' : 'fan';
    if (roll < 0.35) return 'single';
    if (roll < 0.65) return 'fan';
    if (roll < 0.85) return 'volley';
    return 'crossfire';
  }

  private throwPattern(pattern: Pattern, progress: number): void {
    const { W, s } = metrics(this.scene);
    const margin = 60 * s;
    switch (pattern) {
      case 'single':
        this.throwOne(Phaser.Math.Between(margin, W - margin), progress, 0);
        break;
      case 'fan': {
        const cx = Phaser.Math.Between(margin + 50 * s, W - margin - 50 * s);
        const n = this.feverMode ? 4 : 3;
        for (let i = 0; i < n; i++) {
          this.throwOne(cx + (i - (n - 1) / 2) * 54 * s, progress, i * 70, (i - (n - 1) / 2) * 60 * s);
        }
        break;
      }
      case 'volley': {
        const n = this.feverMode ? 5 : 4;
        for (let i = 0; i < n; i++) {
          this.throwOne(Phaser.Math.Between(margin, W - margin), progress, i * 160);
        }
        break;
      }
      case 'crossfire':
        this.throwOne(margin, progress, 0, 170 * s);
        this.throwOne(W - margin, progress, 120, -170 * s);
        if (progress > 0.5) this.throwOne(W / 2, progress, 240);
        break;
    }
  }

  private pickDef(progress: number): DrinkDef {
    const seconds = this.elapsed / 1000;
    if (
      !this.feverMode &&
      seconds > this.cfg.hazardWarmupSeconds &&
      Math.random() < this.cfg.hazardChance + progress * 0.05
    ) {
      return Phaser.Utils.Array.GetRandom(this.cfg.hazards);
    }
    if (this.feverMode && Math.random() < 0.25) return GOLDEN_PEARL;
    if (Math.random() < this.cfg.goldenChance + progress * 0.03) return GOLDEN_PEARL;
    return DRINK_TYPES[Phaser.Utils.Array.GetRandom(NORMAL_KINDS)];
  }

  private throwOne(x: number, progress: number, delay: number, vxBias = 0): void {
    this.scene.time.delayedCall(delay, () => {
      if (!this.active) return;
      const { W, H, s } = metrics(this.scene);
      const def = this.pickDef(progress);
      const piece = new DrinkPiece(
        this.scene,
        Phaser.Math.Clamp(x, 46 * s, W - 46 * s),
        H + 60 * s,
        def,
      );
      this.group.add(piece);

      const gravity = BALANCE.gravity * this.cfg.gravityFactor * (H / DESIGN_HEIGHT);
      const peak = H * Phaser.Math.FloatBetween(0.55, 0.82) + 40 * s;
      const boost = 1 + progress * 0.12;
      const vy = -Math.sqrt(2 * gravity * peak) * boost;
      const centerPull = (W / 2 - x) * 0.55;
      const gust = this.cfg.windX > 0 ? Phaser.Math.Between(-this.cfg.windX, this.cfg.windX) * s : 0;
      const vx = Phaser.Math.Clamp(
        centerPull + vxBias + gust + Phaser.Math.Between(-60, 60) * s,
        -280 * s,
        280 * s,
      );
      piece.launch(vx, vy);
    });
  }
}
