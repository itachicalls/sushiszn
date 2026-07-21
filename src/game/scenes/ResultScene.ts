import Phaser from 'phaser';
import {
  addButton,
  addSoundToggle,
  addText,
  coverBackground,
  metrics,
  restartOnResize,
} from '../config/layout';
import { getLevel, TOTAL_LEVELS } from '../config/levels';
import { save } from '../config/save';
import { audio } from '../systems/AudioSystem';

interface ResultData {
  score: number;
  bestCombo: number;
  grabs: number;
  reason: string;
  levelId?: number;
  stars: number;
  coins: number;
}

const INK = '#4a2c20';

function gradeFor(score: number): { letter: string; color: string; quip: string } {
  if (score >= 7500) return { letter: 'S', color: '#ffb02e', quip: 'certified sushi master!!' };
  if (score >= 5000) return { letter: 'A', color: '#ff7a45', quip: 'absolutely szn-al!' };
  if (score >= 3000) return { letter: 'B', color: '#7ec8ff', quip: 'pretty fresh!' };
  if (score >= 1500) return { letter: 'C', color: '#8fd36a', quip: 'keep rollin!' };
  return { letter: 'D', color: '#b39b8e', quip: 'the sushi believes in you' };
}

const STAR_QUIPS = [
  'the sushi believes in you...',
  'so close! one more star to pass',
  'level cleared! nicely done ~',
  'PERFECT! a true sushi master!!',
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
    if (this.result.levelId) {
      this.createLevelResult();
    } else {
      this.createEndlessResult();
    }
  }

  // ---------- level mode ----------

  private createLevelResult(): void {
    const { W, H, cx, s } = metrics(this);
    const levelId = this.result.levelId!;
    const cfg = getLevel(levelId);
    const stars = this.result.stars;
    const passed = stars >= 2;

    coverBackground(this, cfg.season.bgKey);
    this.add.rectangle(cx, H / 2, W, H, 0xfff1dd, 0.4).setDepth(1);

    addText(this, cx, H * 0.09, `LEVEL ${levelId}`, {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(30 * s)}px`,
      color: cfg.season.accent,
      stroke: '#fff7ef',
      strokeThickness: 8,
    })
      .setOrigin(0.5)
      .setDepth(10);
    addText(this, cx, H * 0.14, cfg.season.name, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: `${Math.round(16 * s)}px`,
      color: '#8a5a48',
      stroke: '#fff7ef',
      strokeThickness: 5,
    })
      .setOrigin(0.5)
      .setDepth(10);

    // big star trio
    const starY = H * 0.26;
    const starSize = 74 * s;
    for (let i = 0; i < 3; i++) {
      const star = this.add
        .image(cx + (i - 1) * (starSize + 14 * s), starY + (i === 1 ? -10 * s : 6 * s), 'ui_star')
        .setDepth(10)
        .setScale(0)
        .setTint(0xd8cabf);
      const target = starSize / star.width;
      const earned = i < stars;
      this.tweens.add({
        targets: star,
        scale: target,
        angle: earned ? 360 : 0,
        duration: 420,
        delay: 250 + i * 300,
        ease: 'Back.easeOut',
        onStart: () => {
          if (earned) {
            star.setTint(0xffc93c);
            audio.combo();
          }
        },
      });
    }

    addText(this, cx, H * 0.375, STAR_QUIPS[stars], {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(19 * s)}px`,
      color: passed ? '#ff7a45' : '#8a5a48',
      stroke: '#fff7ef',
      strokeThickness: 5,
    })
      .setOrigin(0.5)
      .setDepth(10);

    // stats panel
    this.add.image(cx, H * 0.51, 'ui_panel').setDepth(9).setDisplaySize(320 * s, 180 * s);
    const scoreText = addText(this, cx, H * 0.478, '0', {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(46 * s)}px`,
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
      H * 0.53,
      `2 stars at ${cfg.starThresholds[1]}  ·  3 stars at ${cfg.starThresholds[2]}`,
      {
        fontFamily: 'Nunito, sans-serif',
        fontSize: `${Math.round(12 * s)}px`,
        color: '#8a5a48',
      },
    )
      .setOrigin(0.5)
      .setDepth(10);

    // coin reward row
    const coinRow = this.add.container(cx, H * 0.565).setDepth(10);
    const coinIcon = this.add.image(-34 * s, 0, 'coin');
    coinIcon.setDisplaySize(24 * s, 24 * s);
    const coinText = addText(this, 6 * s, 0, `+${this.result.coins} coins!`, {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(16 * s)}px`,
      color: '#e6a800',
    }).setOrigin(0.5);
    coinRow.add([coinIcon, coinText]);
    this.tweens.add({
      targets: coinRow,
      scale: { from: 0, to: 1 },
      duration: 350,
      delay: 900,
      ease: 'Back.easeOut',
    });

    if (passed) {
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

    // mascot
    const mascot = this.add.image(cx, H * 0.675, passed ? 'golden' : 'sensei').setDepth(10);
    mascot.setDisplaySize(100 * s, 100 * s * (mascot.height / mascot.width));
    this.tweens.add({
      targets: mascot,
      y: mascot.y - 10,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // buttons
    const hasNext = passed && levelId < TOTAL_LEVELS;
    if (hasNext) {
      addButton(this, cx, H * 0.79, 'NEXT LEVEL', 0xff7a45, s * 0.9, () => {
        audio.ui();
        this.scene.start('Play', { levelId: levelId + 1 });
      });
    } else {
      addButton(this, cx, H * 0.79, 'RETRY', 0xff7a45, s * 0.9, () => {
        audio.ui();
        this.scene.start('Play', { levelId });
      });
    }
    addButton(this, cx - (hasNext ? 80 * s : 0), H * 0.865, hasNext ? 'RETRY' : 'MAP', 0xfff7ef, s * 0.62, () => {
      audio.ui();
      this.scene.start(hasNext ? 'Play' : 'LevelSelect', hasNext ? { levelId } : { seasonId: cfg.season.id });
    }, INK);
    if (hasNext) {
      addButton(this, cx + 80 * s, H * 0.865, 'MAP', 0xfff7ef, s * 0.62, () => {
        audio.ui();
        this.scene.start('LevelSelect', { seasonId: cfg.season.id });
      }, INK);
    }

    addSoundToggle(this, cx, H * 0.94, s * 0.8, () => audio.isMuted(), () => audio.toggleMute());
  }

  // ---------- endless mode ----------

  private createEndlessResult(): void {
    const { W, H, cx, s } = metrics(this);

    coverBackground(this);
    this.add.rectangle(cx, H / 2, W, H, 0xfff1dd, 0.35).setDepth(1);

    const isNew = save.highScore === this.result.score && this.result.score > 0;
    const best = save.highScore;
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
      `${this.result.grabs} sushi grabbed  ·  best combo x${this.result.bestCombo}  ·  +${this.result.coins} coins`,
      {
        fontFamily: 'Nunito, sans-serif',
        fontSize: `${Math.round(12.5 * s)}px`,
        color: INK,
      },
    )
      .setOrigin(0.5)
      .setDepth(10);

    addText(
      this,
      cx,
      H * 0.638,
      isNew ? 'NEW HIGH SCORE!' : `high score ${best}`,
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

    if (isNew) {
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

    addButton(this, cx, H * 0.875, 'PLAY AGAIN', 0xff7a45, s, () => {
      audio.ui();
      this.scene.start('Play');
    });
    addButton(this, cx, H * 0.95, 'HOME', 0xfff7ef, s * 0.72, () => {
      audio.ui();
      this.scene.start('Title');
    }, INK);

    addSoundToggle(this, W - 78 * s, 34 * s, s * 0.8, () => audio.isMuted(), () => audio.toggleMute());
  }
}
