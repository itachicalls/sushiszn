import Phaser from 'phaser';
import { metrics } from '../config/layout';
import type { SushiDef } from '../config/sushiTypes';

export class SushiPiece extends Phaser.Physics.Arcade.Sprite {
  def: SushiDef;
  grabbed = false;
  private baseScale: number;
  private uiScale: number;
  private glow?: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number, def: SushiDef) {
    super(scene, x, y, def.texture);
    this.def = def;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.uiScale = metrics(scene).s;
    this.baseScale = (def.size * this.uiScale) / this.width;
    this.setScale(this.baseScale);
    this.setDepth(10);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    // generous circular hitbox in source-texture pixels
    const r = (this.width * 0.52) / 2 + 14;
    body.setCircle(r, this.width / 2 - r, this.height / 2 - r);

    if (def.isBonus) {
      this.glow = scene.add
        .image(x, y, 'fx_glow')
        .setDepth(9)
        .setScale((def.size * this.uiScale / 128) * 2.1)
        .setTint(0xffd75e)
        .setAlpha(0.9);
    } else if (def.isBomb) {
      this.glow = scene.add
        .image(x, y, 'fx_glow')
        .setDepth(9)
        .setScale((def.size * this.uiScale / 128) * 1.7)
        .setTint(0x9dff5e)
        .setAlpha(0.55);
    }
  }

  launch(vx: number, vy: number): void {
    this.setVelocity(vx, vy);
    this.setAngularVelocity(Phaser.Math.Between(-110, 110));
  }

  getHitRadius(): number {
    return this.def.size * this.uiScale * 0.62;
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.glow) {
      this.glow.setPosition(this.x, this.y);
      this.glow.setAlpha(0.55 + 0.35 * Math.sin(time / 120));
    }
  }

  markGrabbed(): void {
    this.grabbed = true;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    this.glow?.destroy();
    this.glow = undefined;
  }

  /** squash, pop and vanish */
  playCatchJuice(): void {
    this.scene.tweens.add({
      targets: this,
      scaleX: this.baseScale * 1.35,
      scaleY: this.baseScale * 0.6,
      duration: 70,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (!this.scene) return;
        this.scene.tweens.add({
          targets: this,
          alpha: 0,
          scale: this.baseScale * 0.25,
          y: this.y - 26,
          angle: this.angle + 40,
          duration: 190,
          ease: 'Back.easeIn',
          onComplete: () => this.destroy(),
        });
      },
    });
  }

  destroy(fromScene?: boolean): void {
    this.glow?.destroy();
    super.destroy(fromScene);
  }
}
