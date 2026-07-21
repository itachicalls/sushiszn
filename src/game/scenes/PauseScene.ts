import Phaser from 'phaser';
import { addButton, addSoundToggle, addText, metrics } from '../config/layout';
import { audio } from '../systems/AudioSystem';

interface PauseData {
  levelId?: number;
}

const INK = '#4a2c20';

/** Transparent overlay launched on top of a paused PlayScene. */
export class PauseScene extends Phaser.Scene {
  private data2: PauseData = {};

  constructor() {
    super('Pause');
  }

  init(data: PauseData): void {
    this.data2 = data ?? {};
  }

  create(): void {
    const { W, H, cx, cy, s } = metrics(this);

    const dim = this.add.rectangle(cx, cy, W, H, 0x4a2c20, 0).setDepth(0).setInteractive();
    this.tweens.add({ targets: dim, fillAlpha: 0.45, duration: 220 });

    const panel = this.add.container(cx, cy).setDepth(10).setScale(0.6).setAlpha(0);
    const panelBg = this.add.image(0, 0, 'ui_panel').setDisplaySize(300 * s, 400 * s);

    const title = addText(this, 0, -160 * s, 'paused ~', {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(32 * s)}px`,
      color: '#ff7a45',
      stroke: '#fff7ef',
      strokeThickness: 6,
    }).setOrigin(0.5);

    const sensei = this.add.image(0, -78 * s, 'sensei');
    sensei.setDisplaySize(110 * s, 110 * s * (sensei.height / sensei.width));
    this.tweens.add({
      targets: sensei,
      angle: { from: -4, to: 4 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const tip = addText(this, 0, -8 * s, 'take a lil tea break!', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: `${Math.round(14 * s)}px`,
      color: '#8a5a48',
    }).setOrigin(0.5);

    panel.add([panelBg, title, sensei, tip]);
    this.tweens.add({
      targets: panel,
      scale: 1,
      alpha: 1,
      duration: 280,
      ease: 'Back.easeOut',
    });

    addButton(this, cx, cy + 40 * s, 'RESUME', 0xff7a45, s * 0.85, () => {
      audio.ui();
      this.resumePlay();
    });
    addButton(this, cx, cy + 104 * s, 'RETRY', 0xfff7ef, s * 0.7, () => {
      audio.ui();
      this.scene.stop('Play');
      this.scene.start('Play', { levelId: this.data2.levelId });
    }, INK);
    addButton(this, cx, cy + 158 * s, 'HOME', 0xfff7ef, s * 0.7, () => {
      audio.ui();
      audio.stopBgm();
      this.scene.stop('Play');
      this.scene.start(this.data2.levelId ? 'LevelSelect' : 'Title');
    }, INK);

    addSoundToggle(this, cx, cy + 218 * s, s * 0.85, () => audio.isMuted(), () => {
      audio.toggleMute();
      if (!audio.isMuted()) audio.ui();
    });

    this.input.keyboard?.on('keydown-ESC', () => this.resumePlay());
    this.input.keyboard?.on('keydown-P', () => this.resumePlay());
  }

  private resumePlay(): void {
    this.scene.stop();
    this.scene.resume('Play');
  }
}
