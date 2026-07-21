import Phaser from 'phaser';
import {
  addCoinPill,
  addText,
  coverBackground,
  metrics,
  restartOnResize,
} from '../config/layout';
import { LEVELS_PER_SEASON, SEASONS } from '../config/levels';
import { save } from '../config/save';
import { audio } from '../systems/AudioSystem';

const INK = '#4a2c20';

interface SelectData {
  seasonId?: number;
}

export class LevelSelectScene extends Phaser.Scene {
  private seasonId = 0;

  constructor() {
    super('LevelSelect');
  }

  init(data: SelectData): void {
    if (typeof data?.seasonId === 'number') {
      this.seasonId = data.seasonId;
    } else {
      // open on the furthest season the player has reached
      let furthest = 0;
      for (let i = 0; i < SEASONS.length; i++) {
        if (save.isUnlocked(i * LEVELS_PER_SEASON + 1)) furthest = i;
      }
      this.seasonId = furthest;
    }
  }

  create(): void {
    restartOnResize(this);
    const { W, H, cx, s } = metrics(this);
    const season = SEASONS[this.seasonId];

    coverBackground(this, season.bgKey);
    this.add.rectangle(cx, H / 2, W, H, 0xfff1dd, 0.25).setDepth(1);

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
        tint: season.petalTint,
      })
      .setDepth(2);

    // header
    this.makeChip(24 * s + 26 * s, 34 * s, '<', () => {
      audio.ui();
      this.scene.start('Title');
    });
    addCoinPill(this, W - 24 * s - 55 * s, 34 * s, s * 0.95, () => save.coins);

    addText(this, cx, H * 0.115, season.name, {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(34 * s)}px`,
      color: season.accent,
      stroke: '#fff7ef',
      strokeThickness: 8,
    })
      .setOrigin(0.5)
      .setDepth(10);
    addText(this, cx, H * 0.165, season.subtitle, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: `${Math.round(15 * s)}px`,
      color: '#8a5a48',
      stroke: '#fff7ef',
      strokeThickness: 5,
    })
      .setOrigin(0.5)
      .setDepth(10);

    // total stars in this season
    const seasonStars = Array.from({ length: LEVELS_PER_SEASON }, (_, i) =>
      save.starsFor(this.seasonId * LEVELS_PER_SEASON + i + 1),
    ).reduce((a, b) => a + b, 0);
    const starLine = this.add.container(cx, H * 0.215).setDepth(10);
    const starIcon = this.add.image(-26 * s, 0, 'ui_star').setTint(0xffc93c);
    starIcon.setDisplaySize(22 * s, 22 * s);
    const starText = addText(this, 8 * s, 0, `${seasonStars} / ${LEVELS_PER_SEASON * 3}`, {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(16 * s)}px`,
      color: INK,
      stroke: '#fff7ef',
      strokeThickness: 4,
    }).setOrigin(0.5);
    starLine.add([starIcon, starText]);

    // level grid: 2 rows x 5 cols
    const cols = 5;
    const nodeSize = Math.min(64 * s, (W - 60 * s) / cols - 8 * s);
    const gapX = (W - 40 * s) / cols;
    const startX = 20 * s + gapX / 2;
    const rowYs = [H * 0.35, H * 0.52];

    for (let i = 0; i < LEVELS_PER_SEASON; i++) {
      const levelId = this.seasonId * LEVELS_PER_SEASON + i + 1;
      const x = startX + (i % cols) * gapX;
      const y = rowYs[Math.floor(i / cols)];
      this.makeLevelNode(x, y, nodeSize, levelId, i + 1);
    }

    // season pager arrows
    const pagerY = H * 0.66;
    if (this.seasonId > 0) {
      this.makeChip(cx - 120 * s, pagerY, '<', () => {
        audio.ui();
        this.scene.restart({ seasonId: this.seasonId - 1 });
      });
    }
    if (this.seasonId < SEASONS.length - 1) {
      const nextUnlocked = save.isUnlocked(SEASONS[this.seasonId + 1].id * LEVELS_PER_SEASON + 1);
      this.makeChip(cx + 120 * s, pagerY, '>', () => {
        audio.ui();
        this.scene.restart({ seasonId: this.seasonId + 1 });
      }, !nextUnlocked);
    }
    addText(this, cx, pagerY, `season ${this.seasonId + 1} / ${SEASONS.length}`, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: `${Math.round(14 * s)}px`,
      color: '#8a5a48',
      stroke: '#fff7ef',
      strokeThickness: 4,
    })
      .setOrigin(0.5)
      .setDepth(10);

    // sensei tip at the bottom
    const sensei = this.add.image(cx - 100 * s, H * 0.85, 'sensei').setDepth(10);
    sensei.setDisplaySize(96 * s, 96 * s * (sensei.height / sensei.width));
    this.tweens.add({
      targets: sensei,
      y: sensei.y - 8,
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    const bubble = this.add.container(cx + 40 * s, H * 0.845).setDepth(10);
    const bubbleBg = this.add.image(0, 0, 'ui_pill').setDisplaySize(210 * s, 58 * s);
    const bubbleText = addText(this, 0, 0, 'earn 2 stars to pass\na level, ok? ganbatte!', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: `${Math.round(12.5 * s)}px`,
      color: INK,
      align: 'center',
    }).setOrigin(0.5);
    bubble.add([bubbleBg, bubbleText]);
    this.tweens.add({
      targets: bubble,
      y: bubble.y - 5,
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 200,
    });

    this.cameras.main.fadeIn(250, 255, 233, 214);
  }

  private makeLevelNode(x: number, y: number, size: number, levelId: number, label: number): void {
    const { s } = metrics(this);
    const unlocked = save.isUnlocked(levelId);
    const stars = save.starsFor(levelId);

    const node = this.add.container(x, y).setDepth(10);
    const bg = this.add.image(0, 0, 'ui_node').setDisplaySize(size, size);
    const num = addText(this, 0, -4 * s, String(label), {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(size * 0.42)}px`,
      color: unlocked ? INK : '#b8a89d',
    }).setOrigin(0.5);
    node.add([bg, num]);

    // 3 mini stars along the bottom edge
    for (let i = 0; i < 3; i++) {
      const star = this.add.image((i - 1) * size * 0.28, size * 0.3, 'ui_star');
      star.setDisplaySize(size * 0.26, size * 0.26);
      star.setTint(unlocked && i < stars ? 0xffc93c : 0xd8cabf);
      node.add(star);
    }

    if (!unlocked) {
      bg.setTint(0xd8cabf);
      return;
    }

    // the next uncleared level gently pulses
    if (stars < 2) {
      this.tweens.add({
        targets: node,
        scale: { from: 1, to: 1.08 },
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    bg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => node.setScale(1.1))
      .on('pointerout', () => node.setScale(1))
      .on('pointerdown', () => {
        audio.unlock();
        audio.ui();
        this.cameras.main.fadeOut(220, 255, 233, 214);
        this.time.delayedCall(230, () => this.scene.start('Play', { levelId }));
      });
  }

  private makeChip(x: number, y: number, label: string, onClick: () => void, disabled = false): void {
    const { s } = metrics(this);
    const chip = this.add.container(x, y).setDepth(20);
    const bg = this.add.image(0, 0, 'ui_round').setDisplaySize(48 * s, 48 * s);
    const t = addText(this, 0, -2 * s, label, {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(22 * s)}px`,
      color: disabled ? '#b8a89d' : '#ff5e6c',
    }).setOrigin(0.5);
    chip.add([bg, t]);
    if (disabled) {
      bg.setTint(0xd8cabf);
      return;
    }
    bg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => chip.setScale(1.1))
      .on('pointerout', () => chip.setScale(1))
      .on('pointerdown', onClick);
  }
}
