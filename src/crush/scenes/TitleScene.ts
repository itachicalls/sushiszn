import Phaser from 'phaser';
import { CREATOR_HANDLE, CREATOR_URL } from '../../game/config/balance';
import { addSoundToggle, addText, coverBackground, metrics, restartOnResize } from '../../game/config/layout';
import { openGame } from '../../switchGame';
import { TOTAL_LEVELS } from '../config/levels';
import { save } from '../config/save';
import { audio } from '../systems/AudioSystem';

const INK = '#4a2c20';
const PINK = 0xff4f86;

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    restartOnResize(this);
    const { W, H, cx, s } = metrics(this);
    coverBackground(this, 'bg_casino');

    this.add
      .particles(0, 0, 'fx_sparkle', {
        x: { min: 0, max: W },
        y: -20,
        lifespan: 9000,
        speedY: { min: 18 * s, max: 40 * s },
        speedX: { min: -14, max: 14 },
        rotate: { start: 0, end: 180 },
        scale: { min: 0.4 * s, max: 0.9 * s },
        alpha: { start: 0.7, end: 0 },
        frequency: Math.max(420, 1100 / (W / 390)),
      })
      .setDepth(2);

    const menu = this.add.container(cx, H * 0.5).setDepth(10);
    const col = Math.min(300 * s, W - 36 * s);

    const eyebrow = this.plaque(0, -H * 0.4, s, 'lucky lounge', 0xfff1c9, '#e09020');
    const title = addText(this, 0, eyebrow.y + 52 * s, 'sushi crush', {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(46 * s)}px`,
      color: '#ff4f86',
      stroke: '#fff7ef',
      strokeThickness: 8,
    }).setOrigin(0.5);
    this.fitText(title, col - 12 * s, 30);

    const tag = addText(this, 0, title.y + 40 * s, 'match sushi. match boba. ~', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: `${Math.round(16 * s)}px`,
      color: '#8a5a48',
      stroke: '#fff7ef',
      strokeThickness: 4,
    }).setOrigin(0.5);

    const stageY = tag.y + 108 * s;
    const shadow = this.add.graphics();
    shadow.fillStyle(0xe07090, 0.18);
    shadow.fillEllipse(0, stageY + 42 * s, 210 * s, 28 * s);

    const salmon = this.add.image(-62 * s, stageY, 'salmon');
    salmon.setDisplaySize(118 * s, 118 * s * (salmon.height / Math.max(1, salmon.width)));
    const taro = this.add.image(68 * s, stageY + 6 * s, 'taro');
    taro.setDisplaySize(108 * s, 108 * s * (taro.height / Math.max(1, taro.width)));
    this.bob(salmon, 10 * s, 1400, 0);
    this.bob(taro, 12 * s, 1600, 180);

    const starChip = this.statChip(s, 'ui_star', `${save.totalStars()}/${TOTAL_LEVELS * 3}`, 0xffc93c);
    const coinChip = this.statChip(s, 'coin', String(save.coins));
    const chipGap = 12 * s;
    const chipsW = starChip.width + chipGap + coinChip.width;
    const chipY = stageY + 92 * s;
    starChip.container.setPosition(-chipsW / 2 + starChip.width / 2, chipY);
    coinChip.container.setPosition(chipsW / 2 - coinChip.width / 2, chipY);

    const play = this.candyButton(0, chipY + 78 * s, col, 62 * s, 'PLAY', PINK, '#fff7ef', () => this.go('LevelSelect'));
    const half = (col - 12 * s) / 2;
    const subY = play.y + 72 * s;
    const how = this.candyButton(-half / 2 - 6 * s, subY, half, 48 * s, 'how to', 0xfff7ef, INK, () => this.go('HowTo'));
    const arcade = this.candyButton(half / 2 + 6 * s, subY, half, 48 * s, 'arcade', 0xfff7ef, '#ff4f86', () => {
      audio.unlock();
      audio.ui();
      window.setTimeout(() => openGame('sushi'), 0);
    });

    const credit = addText(this, 0, subY + 52 * s, `built with love by ${CREATOR_HANDLE}`, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: `${Math.round(13 * s)}px`,
      color: '#ff4f86',
      stroke: '#fff7ef',
      strokeThickness: 4,
    }).setOrigin(0.5);
    credit.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      window.open(CREATOR_URL, '_blank', 'noopener,noreferrer');
    });

    const sound = addSoundToggle(this, 0, 0, s * 0.92, () => audio.isMuted(), () => {
      audio.toggleMute();
      if (!audio.isMuted()) audio.ui();
    });
    sound.setPosition(0, credit.y + 46 * s);

    menu.add([
      eyebrow,
      title,
      tag,
      shadow,
      salmon,
      taro,
      starChip.container,
      coinChip.container,
      play,
      how,
      arcade,
      credit,
      sound,
    ]);

    const contentH = sound.y - eyebrow.y + 80 * s;
    const fit = Math.min(1, (H - 16 * s) / contentH, (W - 12) / col);
    menu.setScale(fit);
    menu.y = H * 0.48;

    this.tweens.add({
      targets: title,
      y: title.y - 6 * s,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 400,
    });

    this.cameras.main.fadeIn(240, 255, 228, 236);
  }

  private plaque(x: number, y: number, s: number, label: string, fill: number, color: string): Phaser.GameObjects.Container {
    const text = addText(this, 0, 0, label, {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(14 * s)}px`,
      color,
    }).setOrigin(0.5);
    const w = text.width + 28 * s;
    const h = 30 * s;
    const bg = this.add.graphics();
    bg.fillStyle(fill, 0.96);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    bg.lineStyle(Math.max(2, 2.5 * s), 0x4a2c20, 0.85);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    const row = this.add.container(x, y);
    row.add([bg, text]);
    return row;
  }

  private statChip(
    s: number,
    iconKey: string,
    label: string,
    tint?: number,
  ): { container: Phaser.GameObjects.Container; width: number } {
    const text = addText(this, 0, -1, label, {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(16 * s)}px`,
      color: INK,
    }).setOrigin(0, 0.5);
    const iconSize = 22 * s;
    const gap = 8 * s;
    const pad = 12 * s;
    const w = pad + iconSize + gap + text.width + pad;
    const h = 38 * s;
    const bg = this.add.graphics();
    bg.fillStyle(0xfff7ef, 0.96);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    bg.lineStyle(Math.max(2, 2.5 * s), 0x4a2c20, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    const icon = this.add.image(-w / 2 + pad + iconSize / 2, 0, iconKey).setDisplaySize(iconSize, iconSize);
    if (tint !== undefined) icon.setTint(tint);
    text.setPosition(icon.x + iconSize / 2 + gap, -1);
    const container = this.add.container(0, 0);
    container.add([bg, icon, text]);
    return { container, width: w };
  }

  private candyButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    fill: number,
    color: string,
    onClick: () => void,
  ): Phaser.GameObjects.Container {
    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    const radius = h / 2;
    bg.fillStyle(0x4a2c20, 0.16);
    bg.fillRoundedRect(-w / 2, -h / 2 + 4, w, h, radius);
    bg.fillStyle(fill, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, radius);
    bg.fillStyle(0xffffff, fill === PINK ? 0.28 : 0.55);
    bg.fillRoundedRect(-w / 2 + 8, -h / 2 + 5, w - 16, h * 0.38, radius * 0.6);
    bg.lineStyle(Math.max(3, h * 0.06), 0x4a2c20, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, radius);
    const gloss = this.add.ellipse(0, -h * 0.16, w * 0.55, h * 0.18, 0xffffff, fill === PINK ? 0.45 : 0.7);
    const text = addText(this, 0, -1, label, {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(h * 0.42)}px`,
      color,
      stroke: color === '#fff7ef' ? INK : '#fff7ef',
      strokeThickness: color === '#fff7ef' ? 5 : 0,
    }).setOrigin(0.5);
    const hit = this.add.rectangle(0, 0, w, h, 0xffffff, 0.001);
    btn.add([bg, gloss, text, hit]);
    hit.setInteractive({ useHandCursor: true })
      .on('pointerover', () => btn.setScale(1.04))
      .on('pointerout', () => btn.setScale(1))
      .on('pointerdown', () => {
        this.tweens.add({
          targets: btn,
          scaleX: 1.06,
          scaleY: 0.94,
          duration: 80,
          yoyo: true,
          ease: 'Quad.easeOut',
        });
        onClick();
      });
    if (fill === PINK) {
      this.tweens.add({
        targets: gloss,
        alpha: 0.15,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
    return btn;
  }

  private fitText(text: Phaser.GameObjects.Text, maxWidth: number, min: number): void {
    let size = Number.parseFloat(String(text.style.fontSize));
    while (text.width > maxWidth && size > min) {
      size -= 2;
      text.setFontSize(size);
    }
  }

  private bob(target: Phaser.GameObjects.Image, distance: number, duration: number, delay: number): void {
    this.tweens.add({
      targets: target,
      y: target.y - distance,
      duration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay,
    });
  }

  private go(scene: string): void {
    audio.unlock();
    audio.ui();
    this.cameras.main.fadeOut(200, 255, 228, 236);
    this.time.delayedCall(210, () => this.scene.start(scene));
  }
}
