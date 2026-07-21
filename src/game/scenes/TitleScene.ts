import Phaser from 'phaser';
import { COIN_CA, COIN_PLATFORM, STORAGE_HIGH_SCORE } from '../config/balance';
import { addSoundToggle, addText, coverBackground, metrics, restartOnResize } from '../config/layout';
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
    const logo = this.add.image(cx, H * 0.22, 'logo').setDepth(10).setScale(0);
    const logoScale = Math.min((W * 0.86) / logo.width, (H * 0.3) / logo.height);
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

    addText(this, cx, H * 0.37, "it's sushi season ~", {
      fontFamily: 'Nunito, sans-serif',
      fontSize: `${Math.round(20 * s)}px`,
      color: '#8a5a48',
      stroke: '#fff7ef',
      strokeThickness: 6,
    })
      .setOrigin(0.5)
      .setDepth(10);

    // hero mascot: salmon + chopsticks duo
    const mascot = this.add
      .image(cx - 30 * s, H * 0.52, 'salmon')
      .setDepth(10);
    mascot.setDisplaySize(190 * s, 190 * s * (mascot.height / mascot.width));
    const sticks = this.add
      .image(cx + 92 * s, H * 0.505, 'chopsticks')
      .setDepth(10)
      .setScale(0.34 * s)
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
      .particles(cx, H * 0.52, 'fx_sparkle', {
        x: { min: -120 * s, max: 120 * s },
        y: { min: -90 * s, max: 90 * s },
        lifespan: 900,
        scale: { start: 0.9 * s, end: 0 },
        alpha: { start: 1, end: 0 },
        frequency: 260,
      })
      .setDepth(11);

    const high = Number(localStorage.getItem(STORAGE_HIGH_SCORE) ?? '0');
    addText(
      this,
      cx,
      H * 0.635,
      high > 0
        ? `best score  ${high}`
        : 'swipe to catch flying sushi!\nwatch out for angry wasabi...',
      {
        fontFamily: 'Nunito, sans-serif',
        fontSize: `${Math.round(15 * s)}px`,
        color: '#8a5a48',
        align: 'center',
        stroke: '#fff7ef',
        strokeThickness: 5,
      },
    )
      .setOrigin(0.5)
      .setDepth(10);

    // play button
    const btn = this.add.container(cx, H * 0.735).setDepth(12).setScale(s);
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
        this.time.delayedCall(230, () => this.scene.start('Play'));
      });
    this.tweens.add({
      targets: btn,
      scale: { from: s, to: s * 1.045 },
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // memecoin plaque: CA + platform
    this.buildCoinPlaque(cx, H * 0.845, s);

    addSoundToggle(this, cx, H * 0.94, s, () => audio.isMuted(), () => {
      audio.toggleMute();
      if (!audio.isMuted()) audio.ui();
    });
  }

  private buildCoinPlaque(x: number, y: number, s: number): void {
    const plaque = this.add.container(x, y).setDepth(12);
    const w = Math.min(346 * s, this.scale.width - 24);
    const h = 66 * s;

    // soft cream card with pink border + inner blush line
    const bg = this.add.graphics();
    bg.fillStyle(0xfff7ef, 0.96);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 20 * s);
    bg.lineStyle(4 * s, 0xff8aa8, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 20 * s);
    bg.lineStyle(2 * s, 0xffd2dd, 1);
    bg.strokeRoundedRect(-w / 2 + 5 * s, -h / 2 + 5 * s, w - 10 * s, h - 10 * s, 15 * s);

    // cute mascots hugging the card
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

    const short = `${COIN_CA.slice(0, 6)}...${COIN_CA.slice(-4)}`;
    const caText = addText(this, 0, -12 * s, `CA ${short}  ·  tap to copy!`, {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(14 * s)}px`,
      color: '#4a2c20',
    }).setOrigin(0.5);

    const platform = addText(this, 0, 13 * s, `built with love on ${COIN_PLATFORM} ~`, {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(14 * s)}px`,
      color: '#ff5e6c',
    }).setOrigin(0.5);

    plaque.add([bg, caText, platform, maki, heart]);
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
    hit.on('pointerdown', async () => {
      this.tweens.add({
        targets: plaque,
        scaleX: 1.06,
        scaleY: 0.92,
        duration: 90,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
      try {
        await navigator.clipboard.writeText(COIN_CA);
        caText.setText('copied! thank u ~').setColor('#ff5e6c');
        audio.ui();
        this.time.delayedCall(1400, () =>
          caText.setText(`CA ${short}  ·  tap to copy!`).setColor('#4a2c20'),
        );
      } catch {
        caText.setText(COIN_CA.slice(0, 21));
        platform.setText(COIN_CA.slice(21));
        this.time.delayedCall(4000, () => {
          caText.setText(`CA ${short}  ·  tap to copy!`);
          platform.setText(`built with love on ${COIN_PLATFORM} ~`);
        });
      }
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
