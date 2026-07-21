import Phaser from 'phaser';
import {
  addCoinPill,
  addText,
  coverBackground,
  metrics,
  restartOnResize,
} from '../config/layout';
import { save } from '../config/save';
import { UPGRADES, type UpgradeDef } from '../config/upgrades';
import { audio } from '../systems/AudioSystem';

const INK = '#4a2c20';

export class ShopScene extends Phaser.Scene {
  private coinRefresh: (() => void) | null = null;

  constructor() {
    super('Shop');
  }

  create(): void {
    restartOnResize(this);
    const { W, H, cx, s } = metrics(this);

    coverBackground(this);
    this.add.rectangle(cx, H / 2, W, H, 0xfff1dd, 0.45).setDepth(1);

    // header
    const back = this.add.container(24 * s + 26 * s, 34 * s).setDepth(20);
    const backBg = this.add.image(0, 0, 'ui_round').setDisplaySize(48 * s, 48 * s);
    const backT = addText(this, 0, -2 * s, '<', {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(22 * s)}px`,
      color: '#ff5e6c',
    }).setOrigin(0.5);
    back.add([backBg, backT]);
    backBg.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      audio.ui();
      this.scene.start('Title');
    });

    const pill = addCoinPill(this, W - 24 * s - 55 * s, 34 * s, s * 0.95, () => save.coins);
    this.coinRefresh = pill.refresh;

    addText(this, cx, H * 0.115, 'sushi shop', {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(34 * s)}px`,
      color: '#ff7a45',
      stroke: '#fff7ef',
      strokeThickness: 8,
    })
      .setOrigin(0.5)
      .setDepth(10);
    addText(this, cx, H * 0.163, 'spend coins from your runs ~', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: `${Math.round(14 * s)}px`,
      color: '#8a5a48',
      stroke: '#fff7ef',
      strokeThickness: 4,
    })
      .setOrigin(0.5)
      .setDepth(10);

    // upgrade cards
    const cardW = Math.min(350 * s, W - 20 * s);
    const cardH = 86 * s;
    const startY = H * 0.235;
    const gap = cardH + 12 * s;
    UPGRADES.forEach((def, i) => {
      this.makeCard(cx, startY + i * gap + cardH / 2, cardW, cardH, def);
    });

    this.cameras.main.fadeIn(250, 255, 233, 214);
  }

  private makeCard(x: number, y: number, w: number, h: number, def: UpgradeDef): void {
    const { s } = metrics(this);
    const level = save.upgrades[def.key];
    const maxed = level >= def.maxLevel;
    const cost = maxed ? 0 : def.cost(level + 1);

    const card = this.add.container(x, y).setDepth(10);
    const bg = this.add.image(0, 0, 'ui_panel').setDisplaySize(w, h);

    const icon = this.add.image(-w / 2 + 34 * s, 0, def.icon);
    const iconSize = 48 * s;
    icon.setScale(Math.min(iconSize / icon.width, iconSize / icon.height));
    if (def.icon === 'fx_sparkle') icon.setTint(0xffb02e);

    const name = addText(this, -w / 2 + 66 * s, -h / 2 + 16 * s, def.name, {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(16 * s)}px`,
      color: INK,
    }).setOrigin(0, 0.5);
    const desc = addText(this, -w / 2 + 66 * s, -h / 2 + 37 * s, def.desc, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: `${Math.round(11.5 * s)}px`,
      color: '#8a5a48',
    }).setOrigin(0, 0.5);

    card.add([bg, icon, name, desc]);

    // level pips
    for (let i = 0; i < def.maxLevel; i++) {
      const pip = this.add.circle(
        -w / 2 + 70 * s + i * 16 * s,
        h / 2 - 18 * s,
        5 * s,
        i < level ? 0xff7a45 : 0xe8dcd2,
      );
      pip.setStrokeStyle(2, 0x4a2c20, 0.6);
      card.add(pip);
    }

    // buy button
    const btnW = 92 * s;
    const btnH = 40 * s;
    const btn = this.add.container(w / 2 - btnW / 2 - 14 * s, 0);
    const btnBg = this.add.image(0, 0, 'ui_pill').setDisplaySize(btnW, btnH);
    let btnLabel: Phaser.GameObjects.GameObject;
    if (maxed) {
      btnBg.setTint(0xe8dcd2);
      btnLabel = addText(this, 0, -1, 'MAX ✧', {
        fontFamily: 'Fredoka, Nunito, sans-serif',
        fontSize: `${Math.round(14 * s)}px`,
        color: '#b39b8e',
      }).setOrigin(0.5);
      btn.add([btnBg, btnLabel]);
    } else {
      const affordable = save.coins >= cost;
      if (!affordable) btnBg.setTint(0xf0e4da);
      const coinIcon = this.add.image(-24 * s, 0, 'coin');
      coinIcon.setDisplaySize(20 * s, 20 * s);
      btnLabel = addText(this, 10 * s, -1, String(cost), {
        fontFamily: 'Fredoka, Nunito, sans-serif',
        fontSize: `${Math.round(15 * s)}px`,
        color: affordable ? INK : '#b39b8e',
      }).setOrigin(0.5);
      btn.add([btnBg, coinIcon, btnLabel]);
      btnBg.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        if (!save.spendCoins(cost)) {
          audio.miss();
          this.tweens.add({
            targets: btn,
            x: { from: btn.x - 4, to: btn.x },
            duration: 60,
            repeat: 3,
            yoyo: true,
          });
          return;
        }
        save.raiseUpgrade(def.key);
        audio.golden();
        this.coinRefresh?.();
        // sparkle + rebuild the card so pips/cost update
        const burst = this.add.particles(0, 0, 'fx_sparkle', {
          x: card.x,
          y: card.y,
          speed: { min: 80 * s, max: 200 * s },
          scale: { start: 1 * s, end: 0 },
          lifespan: 500,
          emitting: false,
        });
        burst.setDepth(30);
        burst.explode(14);
        this.time.delayedCall(80, () => {
          card.destroy();
          this.makeCard(x, y, w, h, def);
        });
      });
    }
    card.add(btn);
  }
}
