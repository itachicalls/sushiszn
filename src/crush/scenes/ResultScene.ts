import Phaser from 'phaser';
import { addButton, addText, coverBackground, metrics, restartOnResize } from '../../game/config/layout';
import { TOTAL_LEVELS, getLevel } from '../config/levels';
import { save } from '../config/save';
import { audio } from '../systems/AudioSystem';

interface ResultData {
  levelId: number;
  score: number;
  stars: number;
  coins: number;
  won: boolean;
}

const INK = '#4a2c20';
const QUIPS = [
  'so close — the board believes in you',
  'one more star and the next board opens',
  'cleared! that was a tasty match ~',
  'perfect plate. absolute crush.',
];

export class ResultScene extends Phaser.Scene {
  private result!: ResultData;

  constructor() {
    super('Result');
  }

  init(data: ResultData): void {
    this.result = data;
  }

  create(): void {
    restartOnResize(this);
    const { W, H, cx, s } = metrics(this);
    const level = getLevel(this.result.levelId);
    const stars = this.result.stars;
    const passed = stars >= 2;

    coverBackground(this, level.world.bgKey);
    this.add.rectangle(cx, H / 2, W, H, 0xfff1dd, 0.42).setDepth(1);

    addText(this, cx, H * 0.1, level.world.name, {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(28 * s)}px`,
      color: level.world.accent,
      stroke: '#fff7ef',
      strokeThickness: 7,
    })
      .setOrigin(0.5)
      .setDepth(10);
    addText(this, cx, H * 0.16, `level ${level.stage + 1}`, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: `${Math.round(16 * s)}px`,
      color: '#8a5a48',
      stroke: '#fff7ef',
      strokeThickness: 4,
    })
      .setOrigin(0.5)
      .setDepth(10);

    for (let i = 0; i < 3; i++) {
      const star = this.add.image(cx + (i - 1) * 64 * s, H * 0.28, 'ui_star').setDepth(10);
      star.setDisplaySize(52 * s, 52 * s);
      star.setTint(i < stars ? 0xffc93c : 0xd8cabf);
      star.setScale(0);
      this.tweens.add({
        targets: star,
        scale: (52 * s) / 52,
        duration: 320,
        delay: 180 + i * 120,
        ease: 'Back.easeOut',
      });
    }

    addText(this, cx, H * 0.4, QUIPS[stars] ?? QUIPS[0], {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(18 * s)}px`,
      color: INK,
      stroke: '#fff7ef',
      strokeThickness: 5,
      align: 'center',
      wordWrap: { width: Math.min(320 * s, W - 40) },
    })
      .setOrigin(0.5)
      .setDepth(10);

    addText(this, cx, H * 0.5, this.result.score.toLocaleString('en-US'), {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(42 * s)}px`,
      color: '#ff5e6c',
      stroke: '#fff7ef',
      strokeThickness: 8,
    })
      .setOrigin(0.5)
      .setDepth(10);
    addText(this, cx, H * 0.56, `+${this.result.coins} coins`, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: `${Math.round(16 * s)}px`,
      color: '#8a5a48',
      stroke: '#fff7ef',
      strokeThickness: 4,
    })
      .setOrigin(0.5)
      .setDepth(10);

    const nextId = this.result.levelId + 1;
    const canNext = passed && nextId <= TOTAL_LEVELS && save.isUnlocked(nextId);
    if (canNext) {
      addButton(this, cx, H * 0.68, 'NEXT', 0xff5e6c, s * 0.85, () => {
        audio.ui();
        this.scene.start('Play', { levelId: nextId });
      });
    }
    addButton(this, cx, H * (canNext ? 0.78 : 0.7), 'RETRY', 0xfff7ef, s * 0.75, () => {
      audio.ui();
      this.scene.start('Play', { levelId: this.result.levelId });
    }, INK);
    addButton(this, cx, H * (canNext ? 0.87 : 0.8), 'MAP', 0xfff7ef, s * 0.75, () => {
      audio.ui();
      const worldId = canNext ? getLevel(nextId).world.id : level.world.id;
      this.scene.start('LevelSelect', { worldId });
    }, INK);

    if (stars >= 2) {
      this.add
        .particles(cx, H * 0.28, 'fx_confetti', {
          lifespan: 1400,
          speed: { min: 80, max: 220 },
          angle: { min: 200, max: 340 },
          scale: { start: 1, end: 0.3 },
          gravityY: 280,
          quantity: 14,
          tint: [0xff5e6c, 0xffc93c, 0x7ec8ff, 0xc47ad4],
          emitting: false,
        })
        .setDepth(20)
        .explode(18);
    }

    this.cameras.main.fadeIn(200, 255, 232, 214);
  }
}
