import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { DESIGN_HEIGHT, metrics } from '../config/layout';
import {
  GOLDEN_SUSHI,
  NORMAL_KINDS,
  SUSHI_TYPES,
  WASABI_BOMB,
  type SushiDef,
} from '../config/sushiTypes';
import { SushiPiece } from '../entities/Sushi';

type Pattern = 'single' | 'fan' | 'volley' | 'crossfire';

/** Wave-based spawner with readable throw patterns instead of pure randomness. */
export class Spawner {
  private scene: Phaser.Scene;
  private group: Phaser.Physics.Arcade.Group;
  private elapsed = 0;
  private nextSpawnAt = 500;
  private active = true;
  feverMode = false;

  constructor(scene: Phaser.Scene, group: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.group = group;
  }

  stop(): void {
    this.active = false;
  }

  update(delta: number, shiftProgress: number): void {
    if (!this.active) return;
    this.elapsed += delta;
    if (this.elapsed < this.nextSpawnAt) return;

    let interval =
      BALANCE.spawnIntervalStart -
      (BALANCE.spawnIntervalStart - BALANCE.spawnIntervalEnd) * shiftProgress;
    if (this.feverMode) interval *= BALANCE.feverSpawnFactor;
    // wider screens get denser waves so the field never feels empty
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
          this.throwOne(
            cx + (i - (n - 1) / 2) * 54 * s,
            progress,
            i * 70,
            (i - (n - 1) / 2) * 60 * s,
          );
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

  private pickDef(progress: number): SushiDef {
    const seconds = this.elapsed / 1000;
    if (
      !this.feverMode &&
      seconds > BALANCE.wasabiWarmupSeconds &&
      Math.random() < BALANCE.wasabiChanceAfterWarmup + progress * 0.05
    ) {
      return WASABI_BOMB;
    }
    if (this.feverMode && Math.random() < 0.25) return GOLDEN_SUSHI;
    if (Math.random() < BALANCE.goldenChance + progress * 0.03) return GOLDEN_SUSHI;
    return SUSHI_TYPES[Phaser.Utils.Array.GetRandom(NORMAL_KINDS)];
  }

  private throwOne(x: number, progress: number, delay: number, vxBias = 0): void {
    this.scene.time.delayedCall(delay, () => {
      if (!this.active) return;
      const { W, H, s } = metrics(this.scene);
      const def = this.pickDef(progress);
      const piece = new SushiPiece(
        this.scene,
        Phaser.Math.Clamp(x, 46 * s, W - 46 * s),
        H + 60 * s,
        def,
      );
      this.group.add(piece);

      // launch velocity chosen so the arc peaks at 55–85% of screen height
      const gravity = BALANCE.gravity * (H / DESIGN_HEIGHT);
      const peak = H * Phaser.Math.FloatBetween(0.55, 0.85) + 60 * s;
      const boost = 1 + progress * 0.12;
      const vy = -Math.sqrt(2 * gravity * peak) * boost;
      const centerPull = (W / 2 - x) * 0.55;
      const vx = Phaser.Math.Clamp(
        centerPull + vxBias + Phaser.Math.Between(-60, 60) * s,
        -240 * s,
        240 * s,
      );
      piece.launch(vx, vy);
    });
  }
}
