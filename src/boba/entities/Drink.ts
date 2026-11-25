import Phaser from 'phaser';
import { metrics } from '../config/layout';
import type { DrinkDef } from '../config/drinkTypes';

export class DrinkPiece extends Phaser.Physics.Arcade.Sprite {
  def: DrinkDef;
  grabbed = false;
  private baseScale: number;
  private uiScale: number;
  private glow?: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number, def: DrinkDef) {
    super(scene, x, y, def.texture);
    this.def = def;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.uiScale = metrics(scene).s;
    this.baseScale = (def.size * this.uiScale) / this.width;
    this.setScale(this.baseScale);
    this.setDepth(12);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    const r = (this.width * 0.52) / 2 + 14;
    body.setCircle(r, this.width / 2 - r, this.height / 2 - r);

    if (def.isBonus || def.isBomb || def.isChill) {
      this.glow = scene.add
        .image(x, y, 'fx_glow')
        .setDepth(11)
        .setScale((def.size * this.uiScale / 128) * (def.isBonus ? 2.1 : 1.7))
        .setTint(def.glow)
        .setAlpha(0.7);
    }
  }

  launch(vx: number, vy: number): void {
    this.setVelocity(vx, vy);
    this.setAngularVelocity(Phaser.Math.Between(-90, 90));
  }

  getHitRadius(): number {
    return this.def.size * this.uiScale * 0.62;
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.glow) {
      this.glow.setPosition(this.x, this.y);
      this.glow.setAlpha(0.45 + 0.3 * Math.sin(time / 120));
    }
  }

  markGrabbed(): void {
    this.grabbed = true;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    this.glow?.destroy();
    this.glow = undefined;
  }

  /** drop into the cup */
  playSip(x: number, y: number): void {
    this.setDepth(20);
    this.scene.tweens.add({
      targets: this,
      x,
      y,
      scale: this.baseScale * 0.18,
      alpha: 0,
      angle: this.angle + Phaser.Math.Between(-30, 30),
      duration: 230,
      ease: 'Quad.easeIn',
      onComplete: () => this.destroy(),
    });
  }

  /** pop in place — hazards and ice */
  playPop(): void {
    this.scene.tweens.add({
      targets: this,
      scaleX: this.baseScale * 1.3,
      scaleY: this.baseScale * 0.62,
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
          duration: 180,
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
