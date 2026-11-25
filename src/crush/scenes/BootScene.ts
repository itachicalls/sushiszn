import Phaser from 'phaser';
import { generateFxTextures } from '../config/AssetFactory';
import { addText, metrics } from '../../game/config/layout';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    const { cx, cy } = metrics(this);
    this.cameras.main.setBackgroundColor('#ffe8d6');
    addText(this, cx, cy - 44, 'sushi crush', {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: '30px',
      color: '#4a2c20',
    }).setOrigin(0.5);
    addText(this, cx, cy + 42, 'setting the board...', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '15px',
      color: '#8a5a48',
    }).setOrigin(0.5);
    const barBg = this.add.rectangle(cx, cy, 220, 18, 0x4a2c20, 0.15).setOrigin(0.5);
    barBg.setStrokeStyle(3, 0x4a2c20, 0.5);
    const bar = this.add.rectangle(cx - 106, cy, 4, 10, 0xff5e6c).setOrigin(0, 0.5);
    this.load.on('progress', (v: number) => {
      bar.width = 4 + 208 * v;
    });

    this.load.image('bg_casino', 'assets/crush/bg_casino.png');
    this.load.image('bg_parlor', 'assets/crush/bg_parlor.png');
    this.load.image('bg_beach', 'assets/crush/bg_beach.png');
    this.load.image('bg_tide', 'assets/crush/bg_tide.png');
    this.load.image('bg_maple', 'assets/crush/bg_maple.png');
    this.load.image('bg_hojicha', 'assets/crush/bg_hojicha.png');

    this.load.image('salmon', 'assets/sushi/salmon.png');
    this.load.image('tuna', 'assets/sushi/tuna.png');
    this.load.image('tamago', 'assets/sushi/tamago.png');
    this.load.image('onigiri', 'assets/sushi/onigiri.png');
    this.load.image('maki', 'assets/sushi/maki.png');
    this.load.image('wasabi', 'assets/sushi/wasabi.png');
    this.load.image('fugu', 'assets/sushi/fugu.png');
    this.load.image('soysauce', 'assets/sushi/soysauce.png');

    this.load.image('taro', 'assets/boba/drinks/taro.png');
    this.load.image('sugar', 'assets/boba/drinks/sugar.png');
    this.load.image('mango', 'assets/boba/drinks/mango.png');
    this.load.image('berry', 'assets/boba/drinks/berry.png');
    this.load.image('lychee', 'assets/boba/drinks/lychee.png');
    this.load.image('ice', 'assets/boba/drinks/ice.png');
    this.load.image('chili', 'assets/boba/drinks/chili.png');
    this.load.image('splash', 'assets/boba/drinks/splash.png');

    this.load.image('heart', 'assets/ui/heart.png');
    this.load.image('coin', 'assets/ui/coin.png');
    this.load.image('sensei', 'assets/ui/sensei.png');
  }

  create(): void {
    generateFxTextures(this);
    this.scene.start('Title');
  }
}
