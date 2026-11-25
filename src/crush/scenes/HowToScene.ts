import Phaser from 'phaser';
import { addButton, addText, coverBackground, metrics, restartOnResize } from '../../game/config/layout';
import { audio } from '../systems/AudioSystem';

const INK = '#4a2c20';

const TIPS = [
  { icon: 'salmon', title: 'swap to match', text: 'drag a piece onto a neighbor.\nline up 3 of the same.' },
  { icon: 'maki', title: 'bigger is sweeter', text: '4 in a row makes a stripe.\n5 makes a golden color bomb.\nan L or T makes a wrapper.' },
  { icon: 'taro', title: 'sushi and boba', text: 'both are on every board.\nclear the goal before\nyour moves run out.' },
  { icon: 'wasabi', title: 'watch the board', text: 'wasabi and ice block a square.\nsoy and syrup sit underneath.\nfugu and chili tick down each move.' },
];

export class HowToScene extends Phaser.Scene {
  constructor() {
    super('HowTo');
  }

  create(): void {
    restartOnResize(this);
    const { W, H, cx, s } = metrics(this);
    coverBackground(this, 'bg_parlor');
    this.add.rectangle(cx, H / 2, W, H, 0xfff6ee, 0.4).setDepth(1);

    const back = this.add.container(36 * s, 36 * s).setDepth(20);
    const backBg = this.add.image(0, 0, 'ui_round').setDisplaySize(48 * s, 48 * s);
    const backLabel = addText(this, 0, -2, '<', {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(22 * s)}px`,
      color: '#ff5e6c',
    }).setOrigin(0.5);
    back.add([backBg, backLabel]);
    backBg.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      audio.ui();
      this.scene.start('Title');
    });

    addText(this, cx, H * 0.1, 'how to match', {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(32 * s)}px`,
      color: '#c47ad4',
      stroke: '#fff7ef',
      strokeThickness: 8,
    })
      .setOrigin(0.5)
      .setDepth(10);

    TIPS.forEach((tip, i) => {
      const y = H * (0.22 + i * 0.15);
      const card = this.add.container(cx, y).setDepth(10);
      const w = Math.min(340 * s, W - 28 * s);
      const h = H * 0.13;
      const bg = this.add.graphics();
      bg.fillStyle(0xfff7ef, 0.94);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 18 * s);
      bg.lineStyle(4 * s, 0x4a2c20, 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 18 * s);
      const icon = this.add.image(-w / 2 + 42 * s, 0, tip.icon);
      icon.setDisplaySize(52 * s, 52 * s * (icon.height / icon.width));
      const title = addText(this, -w / 2 + 78 * s, -h * 0.22, tip.title, {
        fontFamily: 'Fredoka, Nunito, sans-serif',
        fontSize: `${Math.round(16 * s)}px`,
        color: '#ff5e6c',
      }).setOrigin(0, 0.5);
      const body = addText(this, -w / 2 + 78 * s, h * 0.16, tip.text, {
        fontFamily: 'Nunito, sans-serif',
        fontSize: `${Math.round(13 * s)}px`,
        color: INK,
        lineSpacing: 2,
      }).setOrigin(0, 0.5);
      card.add([bg, icon, title, body]);
    });

    addButton(this, cx, H * 0.9, 'LET\'S MATCH', 0xff5e6c, s * 0.85, () => {
      audio.unlock();
      audio.ui();
      this.scene.start('LevelSelect');
    });
  }
}
