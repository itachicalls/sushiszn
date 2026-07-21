import Phaser from 'phaser';
import { STORAGE_HIGH_SCORE } from '../config/balance';
import { addSoundToggle, addText, coverBackground, metrics, restartOnResize } from '../config/layout';
import { audio } from '../systems/AudioSystem';

interface ResultData {
  score: number;
  bestCombo: number;
  grabs: number;
  reason: string;
}

const INK = '#4a2c20';

function gradeFor(score: number): { letter: string; color: string; quip: string } {
  if (score >= 7500) return { letter: 'S', color: '#ffb02e', quip: 'certified sushi master!!' };
  if (score >= 5000) return { letter: 'A', color: '#ff7a45', quip: 'absolutely szn-al!' };
  if (score >= 3000) return { letter: 'B', color: '#7ec8ff', quip: 'pretty fresh!' };
  if (score >= 1500) return { letter: 'C', color: '#8fd36a', quip: 'keep rollin!' };
  return { letter: 'D', color: '#b39b8e', quip: 'the sushi believes in you' };
}

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

    coverBackground(this);
    this.add.rectangle(cx, H / 2, W, H, 0xfff1dd, 0.35).setDepth(1);

    const prevBest = Number(localStorage.getItem(STORAGE_HIGH_SCORE) ?? '0');
    const isNew = this.result.score > prevBest;
    if (isNew) localStorage.setItem(STORAGE_HIGH_SCORE, String(this.result.score));
    const best = Math.max(prevBest, this.result.score);
    const grade = gradeFor(this.result.score);

    const logo = this.add.image(cx, H * 0.1, 'logo').setDepth(10);
    logo.setScale(Math.min((W * 0.5) / logo.width, (H * 0.14) / logo.height));

    addText(this, cx, H * 0.19, this.result.reason, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: `${Math.round(18 * s)}px`,
      color: '#8a5a48',
      stroke: '#fff7ef',
      strokeThickness: 5,
    })
      .setOrigin(0.5)
      .setDepth(10);

    // grade medal
    const medal = this.add.container(cx, H * 0.32).setDepth(10).setScale(0);
    const ring = this.add.circle(0, 0, 64 * s, 0xfff7ef).setStrokeStyle(6 * s, 0x4a2c20);
    const letter = addText(this, 0, -2, grade.letter, {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(72 * s)}px`,
      color: grade.color,
      stroke: INK,
      strokeThickness: 6,
    }).setOrigin(0.5);
    medal.add([ring, letter]);
    this.tweens.add({ targets: medal, scale: 1, duration: 480, ease: 'Back.easeOut', delay: 150 });
    this.tweens.add({
      targets: medal,
      angle: { from: -3, to: 3 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    addText(this, cx, H * 0.43, grade.quip, {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(20 * s)}px`,
      color: grade.color,
      stroke: INK,
      strokeThickness: 5,
    })
      .setOrigin(0.5)
      .setDepth(10);

    // stats panel
    this.add.image(cx, H * 0.575, 'ui_panel').setDepth(9).setDisplaySize(320 * s, 190 * s);
    const scoreText = addText(this, cx, H * 0.545, '0', {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(52 * s)}px`,
      color: '#ff7a45',
      stroke: INK,
      strokeThickness: 5,
    })
      .setOrigin(0.5)
      .setDepth(10);
    this.tweens.addCounter({
      from: 0,
      to: this.result.score,
      duration: 800,
      ease: 'Cubic.easeOut',
      onUpdate: (tw) => scoreText.setText(String(Math.round(tw.getValue()))),
    });

    addText(
      this,
      cx,
      H * 0.605,
      `${this.result.grabs} sushi grabbed   ·   best combo x${this.result.bestCombo}`,
      {
        fontFamily: 'Nunito, sans-serif',
        fontSize: `${Math.round(14 * s)}px`,
        color: INK,
      },
    )
      .setOrigin(0.5)
      .setDepth(10);

    addText(
      this,
      cx,
      H * 0.638,
      isNew && this.result.score > 0 ? 'NEW HIGH SCORE!' : `high score ${best}`,
      {
        fontFamily: 'Fredoka, Nunito, sans-serif',
        fontSize: `${Math.round((isNew ? 22 : 16) * s)}px`,
        color: isNew ? '#e6a800' : '#8a5a48',
        stroke: '#fff7ef',
        strokeThickness: 4,
      },
    )
      .setOrigin(0.5)
      .setDepth(10);

    if (isNew && this.result.score > 0) {
      audio.fever();
      const confetti = this.add.particles(0, 0, 'fx_confetti', {
        x: { min: 0, max: W },
        y: -20,
        lifespan: 2600,
        speedY: { min: 130 * s, max: 260 * s },
        speedX: { min: -60, max: 60 },
        rotate: { start: 0, end: 720 },
        scale: { min: 0.6 * s, max: 1.2 * s },
        tint: [0xffd75e, 0xff8aa8, 0x8fd36a, 0x7ec8ff, 0xff7a45],
        frequency: 24,
      });
      confetti.setDepth(20);
      this.time.delayedCall(1800, () => confetti.stop());
    }

    const mascotKey = grade.letter === 'S' || grade.letter === 'A' ? 'golden' : 'salmon';
    const mascot = this.add.image(cx, H * 0.755, mascotKey).setDepth(10);
    mascot.setDisplaySize(120 * s, 120 * s * (mascot.height / mascot.width));
    this.tweens.add({
      targets: mascot,
      y: mascot.y - 10,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.makeButton(cx, H * 0.875, 'PLAY AGAIN', 0xff7a45, s, () => {
      audio.ui();
      this.scene.start('Play');
    });
    this.makeButton(cx, H * 0.95, 'HOME', 0xfff7ef, s * 0.72, () => {
      audio.ui();
      this.scene.start('Title');
    }, INK);

    addSoundToggle(this, W - 78 * s, 34 * s, s * 0.8, () => audio.isMuted(), () => audio.toggleMute());
  }

  private makeButton(
    x: number,
    y: number,
    label: string,
    tint: number,
    scale: number,
    onClick: () => void,
    textColor = '#fff7ef',
  ): void {
    const c = this.add.container(x, y).setDepth(12).setScale(scale);
    const bg = this.add.image(0, 0, 'ui_btn').setTint(tint);
    const t = addText(this, 0, -1, label, {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: '28px',
      color: textColor,
      stroke: textColor === '#fff7ef' ? INK : '#fff7ef',
      strokeThickness: 5,
    }).setOrigin(0.5);
    c.add([bg, t]);
    bg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => c.setScale(scale * 1.05))
      .on('pointerout', () => c.setScale(scale))
      .on('pointerdown', onClick);
  }
}
