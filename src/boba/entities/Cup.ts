import Phaser from 'phaser';
import { metrics } from '../config/layout';

/** The cup you sip into. Fever swaps it for the overflowing cup. */
export class TeaCup extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Image;
  private targetH: number;
  private full = false;

  constructor(scene: Phaser.Scene) {
    const { cx, H, s } = metrics(scene);
    super(scene, cx, H + 8 * s);
    this.targetH = 196 * s;
    this.sprite = scene.add.image(0, 0, 'cup');
    this.sprite.setOrigin(0.5, 1);
    this.fit();
    this.add(this.sprite);
    this.setDepth(8);
    scene.add.existing(this);
    scene.tweens.add({
      targets: this,
      y: this.y - 7 * s,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private fit(): void {
    const h = this.targetH;
    this.sprite.setDisplaySize(h * (this.sprite.width / this.sprite.height), h);
  }

  mouth(): { x: number; y: number } {
    return { x: this.x, y: this.y - this.sprite.displayHeight * 0.72 };
  }

  sip(): void {
    const sx = this.sprite.scaleX;
    const sy = this.sprite.scaleY;
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: sx * 1.06,
      scaleY: sy * 0.94,
      duration: 80,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (this.sprite.active) this.sprite.setScale(sx, sy);
      },
    });
  }

  shiver(): void {
    this.scene.tweens.add({
      targets: this,
      angle: { from: -4, to: 4 },
      duration: 55,
      yoyo: true,
      repeat: 5,
      onComplete: () => this.setAngle(0),
    });
  }

  setFull(full: boolean): void {
    if (this.full === full) return;
    this.full = full;
    this.scene.tweens.killTweensOf(this.sprite);
    this.sprite.setTexture(full ? 'cup_full' : 'cup');
    this.sprite.setOrigin(0.5, 1);
    this.fit();
  }
}
