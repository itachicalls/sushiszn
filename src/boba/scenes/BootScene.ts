import Phaser from 'phaser';
import { generateFxTextures } from '../config/AssetFactory';
import { addText, metrics } from '../config/layout';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    const { cx, cy } = metrics(this);
    this.cameras.main.setBackgroundColor('#f6dcc8');
    addText(this, cx, cy - 44, 'boba hour', {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: '30px',
      color: '#4a2c20',
    }).setOrigin(0.5);
    addText(this, cx, cy + 42, 'pouring the tea...', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '15px',
      color: '#8a5a48',
    }).setOrigin(0.5);

    const barBg = this.add.rectangle(cx, cy, 220, 18, 0x4a2c20, 0.15).setOrigin(0.5);
    barBg.setStrokeStyle(3, 0x4a2c20, 0.5);
    const bar = this.add.rectangle(cx - 106, cy, 4, 10, 0xe07a8a).setOrigin(0, 0.5);
    this.load.on('progress', (v: number) => {
      bar.width = 4 + 208 * v;
    });

    this.load.image('bg', 'assets/boba/ui/bg.png');
    this.load.image('bg_summer', 'assets/boba/ui/bg_summer.png');
    this.load.image('bg_autumn', 'assets/boba/ui/bg_autumn.png');
    this.load.image('bg_winter', 'assets/boba/ui/bg_winter.png');
    this.load.image('logo', 'assets/boba/ui/logo.png');
    this.load.image('straw', 'assets/boba/ui/straw.png');
    this.load.image('cup', 'assets/boba/ui/cup.png');
    this.load.image('cup_full', 'assets/boba/ui/cup_full.png');
    this.load.image('heart', 'assets/boba/ui/heart.png');
    this.load.image('coin', 'assets/boba/ui/coin.png');
    this.load.image('sensei', 'assets/boba/ui/sensei.png');
    this.load.image('sushi', 'assets/boba/ui/sushi.png');
    this.load.image('taro', 'assets/boba/drinks/taro.png');
    this.load.image('sugar', 'assets/boba/drinks/sugar.png');
    this.load.image('mango', 'assets/boba/drinks/mango.png');
    this.load.image('berry', 'assets/boba/drinks/berry.png');
    this.load.image('lychee', 'assets/boba/drinks/lychee.png');
    this.load.image('golden', 'assets/boba/drinks/golden.png');
    this.load.image('splash', 'assets/boba/drinks/splash.png');
    this.load.image('ice', 'assets/boba/drinks/ice.png');
    this.load.image('chili', 'assets/boba/drinks/chili.png');
  }

  create(): void {
    generateFxTextures(this);
    this.scene.start('Title');
  }
}
