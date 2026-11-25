import Phaser from 'phaser';
import { addCoinPill, addText, coverBackground, metrics, restartOnResize } from '../../game/config/layout';
import { LEVELS_PER_WORLD, WORLDS, goalText, getLevel } from '../config/levels';
import { save } from '../config/save';
import { audio } from '../systems/AudioSystem';

const INK = '#4a2c20';

interface SelectData {
  worldId?: number;
}

export class LevelSelectScene extends Phaser.Scene {
  private worldId = 0;

  constructor() {
    super('LevelSelect');
  }

  init(data: SelectData): void {
    if (typeof data?.worldId === 'number') {
      this.worldId = data.worldId;
      return;
    }
    let furthest = 0;
    for (let i = 0; i < WORLDS.length; i++) {
      if (save.isUnlocked(i * LEVELS_PER_WORLD + 1)) furthest = i;
    }
    this.worldId = furthest;
  }

  create(): void {
    restartOnResize(this);
    const { W, H, cx, s } = metrics(this);
    const world = WORLDS[this.worldId];
    coverBackground(this, world.bgKey);
    this.add.rectangle(cx, H / 2, W, H, 0xfff1dd, 0.28).setDepth(1);

    this.add
      .particles(0, 0, world.particle, {
        x: { min: 0, max: W },
        y: world.particle === 'fx_bubble' ? H + 10 : -20,
        lifespan: 9000,
        speedY: world.particle === 'fx_bubble' ? { min: -18 * s, max: -40 * s } : { min: 20 * s, max: 46 * s },
        scale: { min: 0.4 * s, max: 0.9 * s },
        alpha: { start: 0.7, end: 0.15 },
        frequency: 700,
        tint: world.tint,
      })
      .setDepth(2);

    this.chip(28 * s + 22 * s, 36 * s, '<', () => this.scene.start('Title'));
    addCoinPill(this, W - 24 * s - 55 * s, 36 * s, s * 0.95, () => save.coins);

    addText(this, cx, H * 0.13, world.name, {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(32 * s)}px`,
      color: world.accent,
      stroke: '#fff7ef',
      strokeThickness: 8,
    })
      .setOrigin(0.5)
      .setDepth(10);
    addText(this, cx, H * 0.185, world.subtitle, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: `${Math.round(15 * s)}px`,
      color: '#8a5a48',
      stroke: '#fff7ef',
      strokeThickness: 5,
    })
      .setOrigin(0.5)
      .setDepth(10);

    const earned = Array.from({ length: LEVELS_PER_WORLD }, (_, i) =>
      save.starsFor(this.worldId * LEVELS_PER_WORLD + i + 1),
    ).reduce((sum, n) => sum + n, 0);
    const starLine = this.add.container(cx, H * 0.235).setDepth(10);
    const starIcon = this.add.image(-28 * s, 0, 'ui_star').setTint(0xffc93c).setDisplaySize(22 * s, 22 * s);
    const starText = addText(this, 10 * s, 0, `${earned} / ${LEVELS_PER_WORLD * 3}`, {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(16 * s)}px`,
      color: INK,
      stroke: '#fff7ef',
      strokeThickness: 4,
    }).setOrigin(0.5);
    starLine.add([starIcon, starText]);

    const cols = 3;
    const gapX = (W - 48 * s) / cols;
    const startX = 24 * s + gapX / 2;
    const rowYs = [H * 0.38, H * 0.56];
    const nodeSize = Math.min(86 * s, gapX - 16 * s);
    for (let i = 0; i < LEVELS_PER_WORLD; i++) {
      const levelId = this.worldId * LEVELS_PER_WORLD + i + 1;
      const x = startX + (i % cols) * gapX;
      const y = rowYs[Math.floor(i / cols)];
      this.levelNode(x, y, nodeSize, levelId, i + 1);
    }

    const pagerY = H * 0.72;
    if (this.worldId > 0) {
      this.chip(cx - 130 * s, pagerY, '<', () => this.scene.restart({ worldId: this.worldId - 1 }));
    }
    if (this.worldId < WORLDS.length - 1) {
      const nextOpen = save.isUnlocked((this.worldId + 1) * LEVELS_PER_WORLD + 1);
      this.chip(cx + 130 * s, pagerY, '>', () => this.scene.restart({ worldId: this.worldId + 1 }), !nextOpen);
    }
    addText(this, cx, pagerY, `${world.theme}  ·  ${this.worldId + 1} / ${WORLDS.length}`, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: `${Math.round(14 * s)}px`,
      color: '#8a5a48',
      stroke: '#fff7ef',
      strokeThickness: 4,
    })
      .setOrigin(0.5)
      .setDepth(10);

    let focusId = this.worldId * LEVELS_PER_WORLD + LEVELS_PER_WORLD;
    for (let i = 1; i <= LEVELS_PER_WORLD; i++) {
      const id = this.worldId * LEVELS_PER_WORLD + i;
      if (save.starsFor(id) < 2) {
        focusId = id;
        break;
      }
    }
    addText(this, cx, H * 0.82, goalText(getLevel(focusId)), {
      fontFamily: 'Nunito, sans-serif',
      fontSize: `${Math.round(14 * s)}px`,
      color: INK,
      stroke: '#fff7ef',
      strokeThickness: 4,
    })
      .setOrigin(0.5)
      .setDepth(10);
    addText(this, cx, H * 0.88, '2 stars unlocks the next board', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: `${Math.round(13 * s)}px`,
      color: '#8a5a48',
      stroke: '#fff7ef',
      strokeThickness: 4,
    })
      .setOrigin(0.5)
      .setDepth(10);

    this.cameras.main.fadeIn(220, 255, 232, 214);
  }

  private levelNode(x: number, y: number, size: number, levelId: number, label: number): void {
    const { s } = metrics(this);
    const unlocked = save.isUnlocked(levelId);
    const stars = save.starsFor(levelId);
    const node = this.add.container(x, y).setDepth(10);
    const bg = this.add.image(0, 0, 'ui_node').setDisplaySize(size, size);
    const num = addText(this, 0, -6 * s, String(label), {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(size * 0.38)}px`,
      color: unlocked ? INK : '#b8a89d',
    }).setOrigin(0.5);
    node.add([bg, num]);
    for (let i = 0; i < 3; i++) {
      const star = this.add.image((i - 1) * size * 0.28, size * 0.3, 'ui_star');
      star.setDisplaySize(size * 0.24, size * 0.24);
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
        scale: { from: 1, to: 1.06 },
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
    bg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => node.setScale(1.08))
      .on('pointerout', () => node.setScale(1))
      .on('pointerdown', () => {
        audio.unlock();
        audio.ui();
        this.cameras.main.fadeOut(180, 255, 232, 214);
        this.time.delayedCall(190, () => this.scene.start('Play', { levelId }));
      });
  }

  private chip(x: number, y: number, label: string, onClick: () => void, disabled = false): void {
    const { s } = metrics(this);
    const chip = this.add.container(x, y).setDepth(20);
    const bg = this.add.image(0, 0, 'ui_round').setDisplaySize(48 * s, 48 * s);
    const text = addText(this, 0, -2 * s, label, {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(22 * s)}px`,
      color: disabled ? '#b8a89d' : '#ff5e6c',
    }).setOrigin(0.5);
    chip.add([bg, text]);
    if (disabled) {
      bg.setTint(0xd8cabf);
      return;
    }
    bg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => chip.setScale(1.08))
      .on('pointerout', () => chip.setScale(1))
      .on('pointerdown', () => {
        audio.ui();
        onClick();
      });
  }
}
