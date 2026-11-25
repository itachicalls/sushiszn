import Phaser from 'phaser';
import { metrics } from '../config/layout';

/** The straw follows the swipe. Its cream tip is the sip point. */
export class Straw extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Image;
  private following = false;
  private snapTween?: Phaser.Tweens.Tween;
  private baseScale: number;

  constructor(scene: Phaser.Scene) {
    super(scene, -400, -400);
    this.sprite = scene.add.image(0, 0, 'straw');
    this.sprite.setOrigin(0.5, 0.96);
    const targetH = 210 * metrics(scene).s;
    this.baseScale = targetH / this.sprite.height;
    this.sprite.setScale(this.baseScale);
    this.add(this.sprite);
    this.setDepth(40);
    this.setAlpha(0);
    scene.add.existing(this);
  }

  beginFollow(x: number, y: number): void {
    this.following = true;
    this.setPosition(x, y);
    this.setRotation(0);
    this.scene.tweens.add({ targets: this, alpha: 1, duration: 90 });
  }

  followPointer(x: number, y: number, angle: number): void {
    if (!this.following) return;
    this.x = Phaser.Math.Linear(this.x, x, 0.6);
    this.y = Phaser.Math.Linear(this.y, y, 0.6);
    const target = Phaser.Math.Clamp(Phaser.Math.Angle.Wrap(angle + Math.PI / 2) * 0.35, -0.7, 0.7);
    this.rotation = Phaser.Math.Linear(this.rotation, target, 0.25);
  }

  sip(): void {
    this.snapTween?.stop();
    this.sprite.setScale(this.baseScale);
    this.snapTween = this.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.baseScale * 1.12,
      scaleY: this.baseScale * 0.84,
      duration: 70,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  endFollow(): void {
    this.following = false;
    this.scene.tweens.add({ targets: this, alpha: 0, duration: 160 });
  }

  cheer(): void {
    this.scene.tweens.add({
      targets: this,
      angle: 12,
      duration: 70,
      yoyo: true,
      repeat: 3,
    });
  }
}
