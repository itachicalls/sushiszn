import Phaser from 'phaser';
import { addButton, addText, coverBackground, metrics, restartOnResize } from '../config/layout';
import { audio } from '../systems/AudioSystem';

const INK = '#4a2c20';

interface Lesson {
  icon: string;
  title: string;
  text: string;
}

const LESSONS: Lesson[] = [
  { icon: 'straw', title: 'swipe to sip!', text: 'swipe the straw across flying\npearls, jelly, and fruit' },
  { icon: 'splash', title: 'mind the heat!', text: 'hot splash and chili boba cost\na heart — let them fly by' },
  { icon: 'ice', title: 'ice slows the combo', text: 'a melted cube chills the chain.\nit does not take a heart' },
  { icon: 'golden', title: 'golden = jackpot!', text: 'a golden pearl is worth big\npoints. never let it escape' },
  { icon: 'ui_star', title: 'fill the seasons!', text: 'score high for up to 3 stars.\nearn 2+ to unlock the next cup' },
];

export class HowToScene extends Phaser.Scene {
  constructor() {
    super('HowTo');
  }

  create(): void {
    restartOnResize(this);
    const { W, H, cx, s } = metrics(this);
    coverBackground(this);
    this.add.rectangle(cx, H / 2, W, H, 0xfff1e4, 0.5).setDepth(1);

    const sensei = this.add.image(cx - 100 * s, H * 0.1, 'sensei').setDepth(10);
    sensei.setDisplaySize(96 * s, 96 * s * (sensei.height / sensei.width));
    this.tweens.add({
      targets: sensei,
      angle: { from: -3, to: 3 },
      y: sensei.y - 6,
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const bubble = this.add.container(cx + 48 * s, H * 0.098).setDepth(10);
    const bubbleBg = this.add.image(0, 0, 'ui_pill').setDisplaySize(210 * s, 62 * s);
    const bubbleText = addText(this, 0, 0, 'welcome to boba school!\nyour barista will teach you ~', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: `${Math.round(12.5 * s)}px`,
      color: INK,
      align: 'center',
    }).setOrigin(0.5);
    bubble.add([bubbleBg, bubbleText]);

    const cardW = Math.min(350 * s, W - 20 * s);
    const cardH = 78 * s;
    const startY = H * 0.185;
    const gap = cardH + 8 * s;
    LESSONS.forEach((lesson, i) => {
      const y = startY + i * gap + cardH / 2;
      const card = this.add.container(cx, y).setDepth(10).setAlpha(0);
      const bg = this.add.image(0, 0, 'ui_panel').setDisplaySize(cardW, cardH);
      const icon = this.add.image(-cardW / 2 + 36 * s, 0, lesson.icon);
      const iconSize = 44 * s;
      icon.setScale(Math.min(iconSize / icon.width, iconSize / icon.height));
      if (lesson.icon === 'ui_star') icon.setTint(0xffc93c);
      const title = addText(this, -cardW / 2 + 66 * s, -cardH / 2 + 16 * s, lesson.title, {
        fontFamily: 'Fredoka, Nunito, sans-serif',
        fontSize: `${Math.round(16 * s)}px`,
        color: '#e07090',
      }).setOrigin(0, 0.5);
      const text = addText(this, -cardW / 2 + 66 * s, 8 * s, lesson.text, {
        fontFamily: 'Nunito, sans-serif',
        fontSize: `${Math.round(12 * s)}px`,
        color: INK,
      }).setOrigin(0, 0.5);
      card.add([bg, icon, title, text]);
      this.tweens.add({
        targets: card,
        alpha: 1,
        y: { from: y + 20 * s, to: y },
        duration: 300,
        delay: 80 * i,
        ease: 'Back.easeOut',
      });
    });

    addButton(this, cx, H * 0.94, 'GOT IT!', 0xe07a8a, s * 0.8, () => {
      audio.ui();
      this.scene.start('Title');
    });
    this.cameras.main.fadeIn(250, 246, 220, 200);
  }
}
