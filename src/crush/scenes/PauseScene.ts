import Phaser from 'phaser';
import { addButton, addSoundToggle, addText, metrics } from '../../game/config/layout';
import { audio } from '../systems/AudioSystem';

const INK = '#4a2c20';

interface PauseData {
  levelId?: number;
}

export class PauseScene extends Phaser.Scene {
  private payload: PauseData = {};

  constructor() {
    super('Pause');
  }

  init(data: PauseData): void {
    this.payload = data ?? {};
  }

  create(): void {
    const { W, H, cx, cy, s } = metrics(this);
    const dim = this.add.rectangle(cx, cy, W, H, 0x4a2c20, 0).setDepth(0).setInteractive();
    this.tweens.add({ targets: dim, fillAlpha: 0.45, duration: 180 });

    const panelW = 320 * s;
    const panelH = 500 * s;
    const fit = Math.min(1, (W - 24) / panelW, (H - 24) / panelH);
    const panel = this.add.container(cx, cy).setDepth(10).setScale(fit * 0.86).setAlpha(0);

    const bg = this.add.graphics();
    bg.fillStyle(0xfff7ef, 0.98);
    bg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 32 * s);
    bg.lineStyle(Math.max(4, 6 * s), 0x4a2c20, 1);
    bg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 32 * s);
    bg.fillStyle(0xffd6de, 0.55);
    bg.fillRoundedRect(-panelW / 2 + 14 * s, -panelH / 2 + 14 * s, panelW - 28 * s, 78 * s, 22 * s);

    const top = -panelH / 2;
    const title = addText(this, 0, top + 52 * s, 'paused ~', {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(32 * s)}px`,
      color: '#ff5e6c',
      stroke: '#fff7ef',
      strokeThickness: 6,
    }).setOrigin(0.5);
    const sensei = this.add.image(0, top + 148 * s, 'sensei');
    sensei.setDisplaySize(108 * s, 108 * s * (sensei.height / Math.max(1, sensei.width)));
    const tip = addText(this, 0, top + 220 * s, 'the board will wait', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: `${Math.round(15 * s)}px`,
      color: '#8a5a48',
    }).setOrigin(0.5);

    const resume = addButton(this, 0, 0, 'RESUME', 0xff5e6c, s * 0.78, () => {
      audio.ui();
      this.scene.stop();
      this.scene.resume('Play');
    });
    const retry = addButton(this, 0, 0, 'RETRY', 0xfff7ef, s * 0.68, () => {
      audio.ui();
      this.scene.stop('Play');
      this.scene.start('Play', { levelId: this.payload.levelId });
    }, INK);
    const map = addButton(this, 0, 0, 'MAP', 0xfff7ef, s * 0.68, () => {
      audio.ui();
      audio.stopBgm();
      this.scene.stop('Play');
      this.scene.start('LevelSelect');
    }, INK);
    const sound = addSoundToggle(this, 0, 0, s * 0.85, () => audio.isMuted(), () => {
      audio.toggleMute();
      if (!audio.isMuted()) audio.ui();
    });

    resume.setPosition(0, top + 278 * s);
    retry.setPosition(0, top + 338 * s);
    map.setPosition(0, top + 392 * s);
    sound.setPosition(0, top + 450 * s);

    panel.add([bg, title, sensei, tip, resume, retry, map, sound]);
    this.tweens.add({
      targets: panel,
      scale: fit,
      alpha: 1,
      duration: 240,
      ease: 'Back.easeOut',
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.stop();
      this.scene.resume('Play');
    });
  }
}
