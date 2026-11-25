import Phaser from 'phaser';
import { addCoinPill, addText, coverBackground, metrics, restartOnResize } from '../config/layout';
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
    this.add.rectangle(cx, H / 2, W, H, 0xfff1e4, 0.22).setDepth(1);

    this.add
      .particles(0, 0, 'fx_bubble', {
        x: { min: 0, max: W },
        y: H + 10,
        lifespan: 10000,
        speedY: { min: -20 * s, max: -46 * s },
        speedX: { min: -14, max: 14 },
        scale: { min: 0.4 * s, max: 1 * s },
        alpha: { start: 0.5, end: 0 },
        frequency: Math.max(280, 760 / (W / 390)),
        tint: season.bubbleTint,
      })
      .setDepth(2);

    this.makeChip(24 * s + 26 * s, 34 * s, '<', () => {
      audio.ui();
      this.scene.start('Title');
    });
    addCoinPill(this, W - 24 * s - 55 * s, 34 * s, s * 0.95, () => save.coins);

    addText(this, cx, H * 0.115, season.name, {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(32 * s)}px`,
      color: season.accent,
      stroke: '#fff7ef',
      strokeThickness: 8,
    })
      .setOrigin(0.5)
      .setDepth(10);
    addText(this, cx, H * 0.162, season.subtitle, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: `${Math.round(15 * s)}px`,
      color: '#8a5a48',
      stroke: '#fff7ef',
      strokeThickness: 5,
    })
      .setOrigin(0.5)
      .setDepth(10);

    const seasonStars = Array.from({ length: LEVELS_PER_SEASON }, (_, i) =>
      save.starsFor(this.seasonId * LEVELS_PER_SEASON + i + 1),
    ).reduce((a, b) => a + b, 0);
    const starLine = this.add.container(cx, H * 0.21).setDepth(10);
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

    const cols = 5;
    const nodeSize = Math.min(64 * s, (W - 60 * s) / cols - 8 * s);
    const gapX = (W - 40 * s) / cols;
    const startX = 20 * s + gapX / 2;
    const rowYs = [H * 0.34, H * 0.5];
    for (let i = 0; i < LEVELS_PER_SEASON; i++) {
      const levelId = this.seasonId * LEVELS_PER_SEASON + i + 1;
      this.makeLevelNode(startX + (i % cols) * gapX, rowYs[Math.floor(i / cols)], nodeSize, levelId, i + 1);
    }

    const pagerY = H * 0.64;
    if (this.seasonId > 0) {
      this.makeChip(cx - 120 * s, pagerY, '<', () => {
        audio.ui();
        this.scene.restart({ seasonId: this.seasonId - 1 });
      });
    }
    if (this.seasonId < SEASONS.length - 1) {
      const nextUnlocked = save.isUnlocked((this.seasonId + 1) * LEVELS_PER_SEASON + 1);
      this.makeChip(
        cx + 120 * s,
        pagerY,
        '>',
        () => {
          audio.ui();
          this.scene.restart({ seasonId: this.seasonId + 1 });
        },
        !nextUnlocked,
      );
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

    const sensei = this.add.image(cx - 110 * s, H * 0.84, 'sensei').setDepth(10);
    sensei.setDisplaySize(92 * s, 92 * s * (sensei.height / sensei.width));
    this.tweens.add({
      targets: sensei,
      y: sensei.y - 8,
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    const bubble = this.add.container(cx + 36 * s, H * 0.835).setDepth(10);
    const bubbleBg = this.add.image(0, 0, 'ui_pill').setDisplaySize(210 * s, 58 * s);
    const bubbleText = addText(this, 0, 0, 'earn 2 stars to pass,\nthen the next cup unlocks!', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: `${Math.round(12.5 * s)}px`,
      color: INK,
      align: 'center',
    }).setOrigin(0.5);
    bubble.add([bubbleBg, bubbleText]);
    this.cameras.main.fadeIn(250, 246, 220, 200);
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
        this.cameras.main.fadeOut(220, 246, 220, 200);
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
      color: disabled ? '#b8a89d' : '#e07090',
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
