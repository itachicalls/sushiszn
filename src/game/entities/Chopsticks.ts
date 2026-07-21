import Phaser from 'phaser';
import { metrics } from '../config/layout';

/** Player avatar: kawaii chopsticks that chase the swipe and pinch on grabs. */
export class Chopsticks extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Image;
  private following = false;
  private snapTween?: Phaser.Tweens.Tween;
  private baseScale: number;

  constructor(scene: Phaser.Scene) {
    super(scene, -300, -300);
    this.baseScale = 0.42 * metrics(scene).s;
    this.sprite = scene.add.image(0, 0, 'chopsticks');
    // tips (bottom of the art) sit at the pointer
    this.sprite.setOrigin(0.5, 0.92);
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
    // lean into the swipe direction, but stay mostly upright
    const target = Phaser.Math.Clamp(
      Phaser.Math.Angle.Wrap(angle + Math.PI / 2) * 0.35,
      -0.7,
      0.7,
    );
    this.rotation = Phaser.Math.Linear(this.rotation, target, 0.25);
  }

  /** pinch shut */
  snap(): void {
    this.snapTween?.stop();
    this.sprite.setScale(this.baseScale, this.baseScale);
    this.snapTween = this.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.baseScale * 0.62,
      duration: 60,
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
      angle: 14,
      duration: 70,
      yoyo: true,
      repeat: 3,
    });
  }
}
