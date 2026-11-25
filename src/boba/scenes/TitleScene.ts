import Phaser from 'phaser';
import { CREATOR_HANDLE, CREATOR_URL } from '../config/balance';
import { openGame } from '../../switchGame';
import { addSoundBubble, addText, coverBackground, metrics, restartOnResize } from '../config/layout';
import { save } from '../config/save';
import { audio } from '../systems/AudioSystem';

const CAST = ['taro', 'sugar', 'mango', 'berry', 'lychee', 'golden'];
const INK = '#4a2c20';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    restartOnResize(this);
    const { W, H, cx, s } = metrics(this);
    coverBackground(this);

    this.add
      .particles(0, 0, 'fx_bubble', {
        x: { min: 0, max: W },
        y: H + 12,
        lifespan: 11000,
        speedY: { min: -18 * s, max: -42 * s },
        speedX: { min: -14, max: 14 },
        scale: { min: 0.45 * s, max: 1.1 * s },
        alpha: { start: 0.55, end: 0 },
        frequency: Math.max(520, 1400 / (W / 390)),
      })
      .setDepth(2);

    this.time.addEvent({
      delay: Math.max(500, 1400 / (W / 390)),
      loop: true,
      callback: () => this.dropBackgroundDrink(),
    });
    for (let i = 0; i < Math.min(8, Math.ceil(W / 220)); i++) {
      this.time.delayedCall(i * 320, () => this.dropBackgroundDrink(true));
    }

    const logo = this.add.image(cx, H * 0.16, 'logo').setDepth(10).setScale(0);
    const logoScale = Math.min((W * 0.86) / logo.width, (H * 0.22) / logo.height);
    this.tweens.add({ targets: logo, scale: logoScale, duration: 550, ease: 'Back.easeOut' });
    this.tweens.add({
      targets: logo,
      y: logo.y - 8,
      angle: { from: -1.2, to: 1.2 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 550,
    });

    const tagY = H * 0.16 + (logo.height * logoScale) / 2 + 18 * s;
    addText(this, cx, tagY, 'pearls with a little hug ~', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: `${Math.round(18 * s)}px`,
      color: '#c45c78',
    })
      .setOrigin(0.5)
      .setDepth(12);

    const hero = this.add.container(cx, H * 0.5).setDepth(10);
    const cup = this.add.image(0, 0, 'cup');
    const cupH = 196 * s;
    cup.setDisplaySize(cupH * (cup.width / cup.height), cupH);
    const strawH = cupH * 0.78;
    const straw = this.add.image(0, 0, 'straw').setAngle(10);
    straw.setOrigin(0.15, 0.92);
    straw.setDisplaySize(strawH * (straw.width / straw.height), strawH);
    straw.setPosition(cup.displayWidth * 0.34, cupH * 0.32);
    hero.add([cup, straw]);
    this.tweens.add({
      targets: hero,
      y: hero.y - 8 * s,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.glassStat(cx - 132 * s, H * 0.5, s, 'ui_star', `${save.totalStars()}`, 0xffc93c);
    this.glassStat(cx + 138 * s, H * 0.5, s, 'coin', String(save.coins));

    const btn = this.add.container(cx, H * 0.71).setDepth(12).setScale(s);
    const btnBg = this.add.image(0, 0, 'ui_btn').setTint(0xd7b0e6);
    const btnLabel = addText(this, 0, -1, 'sip', {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: '34px',
      color: '#fffaf6',
      shadow: { offsetX: 0, offsetY: 2, color: '#8a5a78', blur: 0, fill: true, stroke: false },
    }).setOrigin(0.5);
    btn.add([btnBg, btnLabel]);
    btnBg
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => btn.setScale(s * 1.05))
      .on('pointerout', () => btn.setScale(s))
      .on('pointerdown', () => {
        audio.unlock();
        audio.ui();
        this.cameras.main.fadeOut(220, 246, 232, 214);
        this.time.delayedCall(230, () => this.scene.start('LevelSelect'));
      });
    this.tweens.add({
      targets: btn,
      scale: { from: s, to: s * 1.035 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.buildBubbles(cx, H * 0.825, s);
    this.buildCredit(cx, H * 0.93, s);
    addSoundBubble(this, W - 36 * s, 36 * s, s, () => audio.isMuted(), () => {
      audio.toggleMute();
      if (!audio.isMuted()) audio.ui();
    });
  }

  private glassStat(x: number, y: number, s: number, iconKey: string, label: string, tint?: number): void {
    const bubble = this.add.container(x, y).setDepth(12);
    const bg = this.add.image(0, 0, 'ui_round').setDisplaySize(64 * s, 64 * s);
    const icon = this.add.image(0, -8 * s, iconKey);
    icon.setDisplaySize(22 * s, 22 * s);
    if (tint !== undefined) icon.setTint(tint);
    const text = addText(this, 0, 14 * s, label, {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(13 * s)}px`,
      color: INK,
    }).setOrigin(0.5);
    bubble.add([bg, icon, text]);
    this.tweens.add({
      targets: bubble,
      y: y - 5 * s,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private buildBubbles(x: number, y: number, s: number): void {
    const items: Array<{ icon: string; label: string; scene?: string; onTap?: () => void }> = [
      { icon: 'sensei', label: 'learn', scene: 'HowTo' },
      { icon: 'coin', label: 'bar', scene: 'Shop' },
      { icon: 'golden', label: 'forever', scene: 'Play' },
      { icon: 'sushi', label: 'sushi', onTap: () => this.openSushi() },
      { icon: 'mango', label: 'crush', onTap: () => this.openCrush() },
    ];
    const { W } = metrics(this);
    const gap = Math.min(78 * s, (W - 24 * s) / items.length);
    items.forEach((item, i) => {
      const bx = x + (i - (items.length - 1) / 2) * gap;
      const bubble = this.add.container(bx, y + 40 * s).setDepth(12).setAlpha(0);
      const bg = this.add.image(0, 0, 'ui_round').setDisplaySize(62 * s, 62 * s);
      const icon = this.add.image(0, -2 * s, item.icon);
      const iconSize = 32 * s;
      icon.setScale(Math.min(iconSize / icon.width, iconSize / icon.height));
      const label = addText(this, 0, 40 * s, item.label, {
        fontFamily: 'Fredoka, Nunito, sans-serif',
        fontSize: `${Math.round(13 * s)}px`,
        color: '#8d6248',
      }).setOrigin(0.5);
      bg.setInteractive({ useHandCursor: true })
        .on('pointerover', () => bubble.setScale(1.08))
        .on('pointerout', () => bubble.setScale(1))
        .on('pointerdown', () => {
          this.tweens.add({ targets: bubble, scaleX: 1.12, scaleY: 0.9, duration: 80, yoyo: true });
          if (item.onTap) item.onTap();
          else if (item.scene) this.go(item.scene);
        });
      bubble.add([bg, icon, label]);
      this.tweens.add({
        targets: bubble,
        y,
        alpha: 1,
        duration: 420,
        delay: 180 + i * 80,
        ease: 'Back.easeOut',
      });
    });
  }

  private go(scene: string): void {
    audio.unlock();
    audio.ui();
    this.cameras.main.fadeOut(200, 246, 220, 200);
    this.time.delayedCall(210, () => this.scene.start(scene));
  }

  private openSushi(): void {
    audio.unlock();
    audio.ui();
    window.setTimeout(() => openGame('sushi'), 0);
  }

  private openCrush(): void {
    audio.unlock();
    audio.ui();
    window.setTimeout(() => openGame('crush'), 0);
  }

  private buildCredit(x: number, y: number, s: number): void {
    const line = addText(this, x, y, `made with love  ·  ${CREATOR_HANDLE}`, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: `${Math.round(13 * s)}px`,
      color: '#a87868',
    })
      .setOrigin(0.5)
      .setDepth(12);
    line.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      audio.ui();
      window.open(CREATOR_URL, '_blank', 'noopener,noreferrer');
    });
  }

  private dropBackgroundDrink(randomY = false): void {
    const { W, H, s } = metrics(this);
    const key = Phaser.Utils.Array.GetRandom(CAST);
    const x = Math.random() < 0.5 ? Phaser.Math.Between(24, W * 0.2) : Phaser.Math.Between(W * 0.8, W - 24);
    const img = this.add
      .image(x, randomY ? Phaser.Math.Between(0, H * 0.35) : -60, key)
      .setDepth(3)
      .setAlpha(0.28)
      .setAngle(Phaser.Math.Between(-20, 20));
    img.setDisplaySize(58 * s, 58 * s * (img.height / img.width));
    this.tweens.add({
      targets: img,
      y: H + 80,
      angle: img.angle + Phaser.Math.Between(-40, 40),
      duration: Phaser.Math.Between(8000, 12000),
      onComplete: () => img.destroy(),
    });
  }
}
