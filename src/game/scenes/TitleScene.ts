import Phaser from 'phaser';
import { CREATOR_HANDLE, CREATOR_URL } from '../config/balance';
import { openGame } from '../../switchGame';
import {
  addSoundToggle,
  addText,
  coverBackground,
  metrics,
  restartOnResize,
} from '../config/layout';
import { TOTAL_LEVELS } from '../config/levels';
import { save } from '../config/save';
import { audio } from '../systems/AudioSystem';

const CAST = ['salmon', 'tuna', 'tamago', 'onigiri', 'maki', 'golden'];
const INK = '#4a2c20';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    restartOnResize(this);
    const { W, H, cx, s } = metrics(this);

    coverBackground(this);

    // drifting petals
    this.add
      .particles(0, 0, 'fx_petal', {
        x: { min: 0, max: W },
        y: -20,
        lifespan: 10000,
        speedY: { min: 24 * s, max: 55 * s },
        speedX: { min: -20, max: 20 },
        rotate: { start: 0, end: 360 },
        scale: { min: 0.5 * s, max: 1 * s },
        alpha: { start: 0.9, end: 0.25 },
        frequency: Math.max(250, 700 / (W / 390)),
      })
      .setDepth(2);

    // slow sushi rain behind the logo
    this.time.addEvent({
      delay: Math.max(500, 1400 / (W / 390)),
      loop: true,
      callback: () => this.dropBackgroundSushi(),
    });
    for (let i = 0; i < Math.min(10, Math.ceil(W / 200)); i++) {
      this.time.delayedCall(i * 300, () => this.dropBackgroundSushi(true));
    }

    // logo
    const logo = this.add.image(cx, H * 0.2, 'logo').setDepth(10).setScale(0);
    const logoScale = Math.min((W * 0.86) / logo.width, (H * 0.28) / logo.height);
    this.tweens.add({ targets: logo, scale: logoScale, duration: 550, ease: 'Back.easeOut' });
    this.tweens.add({
      targets: logo,
      y: logo.y - 10,
      angle: { from: -1.5, to: 1.5 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 550,
    });

    addText(this, cx, H * 0.335, "it's sushi season ~", {
      fontFamily: 'Nunito, sans-serif',
      fontSize: `${Math.round(20 * s)}px`,
      color: '#8a5a48',
      stroke: '#fff7ef',
      strokeThickness: 6,
    })
      .setOrigin(0.5)
      .setDepth(10);

    // hero mascot: salmon + chopsticks duo
    const mascot = this.add.image(cx - 30 * s, H * 0.465, 'salmon').setDepth(10);
    mascot.setDisplaySize(165 * s, 165 * s * (mascot.height / mascot.width));
    const sticks = this.add
      .image(cx + 84 * s, H * 0.455, 'chopsticks')
      .setDepth(10)
      .setScale(0.3 * s)
      .setAngle(12);
    this.tweens.add({
      targets: mascot,
      y: mascot.y - 12,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: sticks,
      y: sticks.y - 16,
      angle: 6,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 350,
    });

    this.add
      .particles(cx, H * 0.465, 'fx_sparkle', {
        x: { min: -120 * s, max: 120 * s },
        y: { min: -80 * s, max: 80 * s },
        lifespan: 900,
        scale: { start: 0.9 * s, end: 0 },
        alpha: { start: 1, end: 0 },
        frequency: 260,
      })
      .setDepth(11);

    // progress row: stars + coins
    const totalStars = save.totalStars();
    const progress = this.add.container(cx, H * 0.585).setDepth(10);
    const starIcon = this.add.image(-74 * s, 0, 'ui_star').setTint(0xffc93c);
    starIcon.setDisplaySize(24 * s, 24 * s);
    const starText = addText(this, -38 * s, 0, `${totalStars}/${TOTAL_LEVELS * 3}`, {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(16 * s)}px`,
      color: INK,
      stroke: '#fff7ef',
      strokeThickness: 4,
    }).setOrigin(0.5);
    const coinIcon = this.add.image(30 * s, 0, 'coin');
    coinIcon.setDisplaySize(24 * s, 24 * s);
    const coinText = addText(this, 66 * s, 0, String(save.coins), {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(16 * s)}px`,
      color: INK,
      stroke: '#fff7ef',
      strokeThickness: 4,
    }).setOrigin(0.5);
    progress.add([starIcon, starText, coinIcon, coinText]);

    // play button -> level map
    const btn = this.add.container(cx, H * 0.665).setDepth(12).setScale(s);
    const btnBg = this.add.image(0, 0, 'ui_btn').setTint(0xff7a45);
    const btnLabel = addText(this, 0, -1, 'PLAY', {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: '34px',
      color: '#fff7ef',
      stroke: INK,
      strokeThickness: 6,
    }).setOrigin(0.5);
    btn.add([btnBg, btnLabel]);
    btnBg
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => btn.setScale(s * 1.06))
      .on('pointerout', () => btn.setScale(s))
      .on('pointerdown', () => {
        audio.unlock();
        audio.ui();
        this.cameras.main.fadeOut(220, 255, 233, 214);
        this.time.delayedCall(230, () => this.scene.start('LevelSelect'));
      });
    this.tweens.add({
      targets: btn,
      scale: { from: s, to: s * 1.045 },
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // sliding nav bar: how to play (sensei), shop, endless run
    this.buildNavBar(cx, H * 0.765, s);

    this.buildWelcomePlaque(cx, H * 0.87, s);

    addSoundToggle(this, cx, H * 0.945, s, () => audio.isMuted(), () => {
      audio.toggleMute();
      if (!audio.isMuted()) audio.ui();
    });
  }

  private buildNavBar(x: number, y: number, s: number): void {
    const { W } = metrics(this);
    const nav = this.add.container(x, y + 90 * s).setDepth(12).setAlpha(0);
    const w = Math.min(368 * s, W - 14 * s);
    const h = 64 * s;

    const bg = this.add.graphics();
    bg.fillStyle(0xfff7ef, 0.94);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 24 * s);
    bg.lineStyle(4 * s, 0x4a2c20, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 24 * s);
    nav.add(bg);

    const items: Array<{ icon: string; label: string; onTap: () => void }> = [
      {
        icon: 'sensei',
        label: 'how to',
        onTap: () => this.go('HowTo'),
      },
      {
        icon: 'coin',
        label: 'shop',
        onTap: () => this.go('Shop'),
      },
      {
        icon: 'golden',
        label: 'endless',
        onTap: () => this.go('Play'),
      },
      {
        icon: 'boba',
        label: 'boba',
        onTap: () => this.openBoba(),
      },
    ];

    const slot = w / items.length;
    items.forEach((item, i) => {
      const ix = -w / 2 + slot * i + slot / 2;
      const cell = this.add.container(ix, 0);
      const iconSize = 30 * s;
      const icon = this.add.image(0, 0, item.icon);
      icon.setScale(Math.min(iconSize / icon.width, iconSize / icon.height));
      const label = addText(this, 0, 0, item.label, {
        fontFamily: 'Fredoka, Nunito, sans-serif',
        fontSize: `${Math.round(13 * s)}px`,
        color: INK,
      }).setOrigin(0.5);
      const gap = 4 * s;
      const pair = icon.displayWidth + gap + label.width;
      icon.x = -pair / 2 + icon.displayWidth / 2;
      label.x = pair / 2 - label.width / 2;
      const hit = this.add
        .rectangle(0, 0, slot - 6 * s, h - 8 * s, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      hit
        .on('pointerover', () => cell.setScale(1.08))
        .on('pointerout', () => cell.setScale(1))
        .on('pointerdown', () => {
          this.tweens.add({
            targets: cell,
            scaleX: 1.15,
            scaleY: 0.9,
            duration: 80,
            yoyo: true,
          });
          item.onTap();
        });
      cell.add([icon, label, hit]);
      nav.add(cell);

      if (i < items.length - 1) {
        const divider = this.add.rectangle(-w / 2 + slot * (i + 1), 0, 2.5 * s, h * 0.5, 0xe8dcd2);
        nav.add(divider);
      }
    });

    // slide in from below shortly after the title appears
    this.tweens.add({
      targets: nav,
      y,
      alpha: 1,
      duration: 480,
      delay: 350,
      ease: 'Back.easeOut',
    });
  }

  private go(scene: string): void {
    audio.unlock();
    audio.ui();
    this.cameras.main.fadeOut(200, 255, 233, 214);
    this.time.delayedCall(210, () => this.scene.start(scene));
  }

  private openBoba(): void {
    audio.unlock();
    audio.ui();
    window.setTimeout(() => openGame('boba'), 0);
  }

  private buildWelcomePlaque(x: number, y: number, s: number): void {
    const plaque = this.add.container(x, y).setDepth(12);
    const w = Math.min(346 * s, this.scale.width - 24);
    const h = 68 * s;

    const bg = this.add.graphics();
    bg.fillStyle(0xfff7ef, 0.96);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 20 * s);
    bg.lineStyle(4 * s, 0xff8aa8, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 20 * s);
    bg.lineStyle(2 * s, 0xffd2dd, 1);
    bg.strokeRoundedRect(-w / 2 + 5 * s, -h / 2 + 5 * s, w - 10 * s, h - 10 * s, 15 * s);

    const maki = this.add.image(-w / 2 + 4 * s, -h / 2 + 4 * s, 'maki').setAngle(-14);
    maki.setDisplaySize(38 * s, 38 * s * (maki.height / maki.width));
    const heart = this.add.image(w / 2 - 5 * s, -h / 2 + 5 * s, 'heart').setAngle(14);
    heart.setDisplaySize(26 * s, 26 * s * (heart.height / heart.width));
    this.tweens.add({
      targets: [maki, heart],
      angle: '+=8',
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const greeting = addText(this, 0, -14 * s, 'every catch is a little hug ~', {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(15 * s)}px`,
      color: '#4a2c20',
    }).setOrigin(0.5);

    const credit = this.add.container(0, 14 * s);
    const avatarSize = 22 * s;
    const avatar = this.add.image(0, 0, 'creator').setDisplaySize(avatarSize, avatarSize);
    const by = addText(this, 0, 0, `built with love by ${CREATOR_HANDLE}`, {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(14 * s)}px`,
      color: '#ff5e6c',
    }).setOrigin(0.5);
    const gap = 7 * s;
    const total = avatarSize + gap + by.width;
    avatar.setX(-total / 2 + avatarSize / 2);
    by.setX(-total / 2 + avatarSize + gap + by.width / 2);
    credit.add([avatar, by]);

    plaque.add([bg, greeting, credit, maki, heart]);
    this.tweens.add({
      targets: plaque,
      y: y - 4 * s,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const hit = this.add
      .rectangle(x, y, w, h, 0xffffff, 0.001)
      .setDepth(13)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => {
      audio.ui();
      this.tweens.add({
        targets: plaque,
        scaleX: 1.06,
        scaleY: 0.92,
        duration: 90,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
      window.open(CREATOR_URL, '_blank', 'noopener,noreferrer');
    });
  }

  private dropBackgroundSushi(randomY = false): void {
    const { W, H, s } = metrics(this);
    const key = Phaser.Utils.Array.GetRandom(CAST);
    const img = this.add
      .image(
        Phaser.Math.Between(30, W - 30),
        randomY ? Phaser.Math.Between(0, H / 2) : -60,
        key,
      )
      .setDepth(3)
      .setAlpha(0.5)
      .setAngle(Phaser.Math.Between(-25, 25));
    img.setDisplaySize(64 * s, 64 * s * (img.height / img.width));
    this.tweens.add({
      targets: img,
      y: H + 80,
      angle: img.angle + Phaser.Math.Between(-50, 50),
      duration: Phaser.Math.Between(7000, 11000),
      onComplete: () => img.destroy(),
    });
  }
}
