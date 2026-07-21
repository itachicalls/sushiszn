import Phaser from 'phaser';
import { generateFxTextures } from '../config/AssetFactory';
import { addText, metrics } from '../config/layout';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    const { cx, cy } = metrics(this);

    this.cameras.main.setBackgroundColor('#ffe9d6');
    addText(this, cx, cy - 44, 'sushi szn', {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: '30px',
      color: '#4a2c20',
    }).setOrigin(0.5);
    addText(this, cx, cy + 42, 'prepping the szn...', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '15px',
      color: '#8a5a48',
    }).setOrigin(0.5);

    const barBg = this.add.rectangle(cx, cy, 220, 18, 0x4a2c20, 0.15).setOrigin(0.5);
    barBg.setStrokeStyle(3, 0x4a2c20, 0.5);
    const bar = this.add.rectangle(cx - 106, cy, 4, 10, 0xff7a45).setOrigin(0, 0.5);
    this.load.on('progress', (v: number) => {
      bar.width = 4 + 208 * v;
    });

    this.load.image('bg', 'assets/ui/bg.png');
    this.load.image('bg_summer', 'assets/ui/bg_summer.png');
    this.load.image('bg_autumn', 'assets/ui/bg_autumn.png');
    this.load.image('bg_winter', 'assets/ui/bg_winter.png');
    this.load.image('logo', 'assets/ui/logo.png');
    this.load.image('chopsticks', 'assets/ui/chopsticks.png');
    this.load.image('heart', 'assets/ui/heart.png');
    this.load.image('coin', 'assets/ui/coin.png');
    this.load.image('sensei', 'assets/ui/sensei.png');
    this.load.image('salmon', 'assets/sushi/salmon.png');
    this.load.image('tuna', 'assets/sushi/tuna.png');
    this.load.image('tamago', 'assets/sushi/tamago.png');
    this.load.image('onigiri', 'assets/sushi/onigiri.png');
    this.load.image('maki', 'assets/sushi/maki.png');
    this.load.image('golden', 'assets/sushi/golden.png');
    this.load.image('wasabi', 'assets/sushi/wasabi.png');
    this.load.image('soysauce', 'assets/sushi/soysauce.png');
    this.load.image('chili', 'assets/sushi/chili.png');
    this.load.image('fugu', 'assets/sushi/fugu.png');
  }

  create(): void {
    generateFxTextures(this);
    this.scene.start('Title');
  }
}
