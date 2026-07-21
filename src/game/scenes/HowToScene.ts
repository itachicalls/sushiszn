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
  { icon: 'chopsticks', title: 'swipe to grab!', text: 'swipe across flying sushi to\ncatch it with your chopsticks' },
  { icon: 'wasabi', title: 'dodge the meanies!', text: 'wasabi, soy sauce, chili & fugu\ncost you a heart — let them fly' },
  { icon: 'golden', title: 'golden = jackpot!', text: 'golden sushi is worth big points,\nnever let it escape' },
  { icon: 'heart', title: 'guard your hearts!', text: 'dropped sushi and grabbed hazards\nlose hearts. zero hearts = game over' },
  { icon: 'ui_star', title: 'star the seasons!', text: 'score high for up to 3 stars —\nearn 2+ to unlock the next level' },
];

export class HowToScene extends Phaser.Scene {
  constructor() {
    super('HowTo');
  }

  create(): void {
    restartOnResize(this);
    const { W, H, cx, s } = metrics(this);

    coverBackground(this);
    this.add.rectangle(cx, H / 2, W, H, 0xfff1dd, 0.5).setDepth(1);

    // sensei + speech bubble header
    const sensei = this.add.image(cx - 92 * s, H * 0.115, 'sensei').setDepth(10);
    sensei.setDisplaySize(104 * s, 104 * s * (sensei.height / sensei.width));
    this.tweens.add({
      targets: sensei,
      angle: { from: -3, to: 3 },
      y: sensei.y - 6,
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const bubble = this.add.container(cx + 55 * s, H * 0.11).setDepth(10);
    const bubbleBg = this.add.image(0, 0, 'ui_pill').setDisplaySize(200 * s, 62 * s);
    const bubbleText = addText(this, 0, 0, 'welcome to sushi school!\nsensei will teach you ~', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: `${Math.round(12.5 * s)}px`,
      color: INK,
      align: 'center',
    }).setOrigin(0.5);
    bubble.add([bubbleBg, bubbleText]);
    this.tweens.add({
      targets: bubble,
      y: bubble.y - 5,
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 250,
    });

    // lesson cards
    const cardW = Math.min(350 * s, W - 20 * s);
    const cardH = 82 * s;
    const startY = H * 0.215;
    const gap = cardH + 10 * s;
    LESSONS.forEach((lesson, i) => {
      const y = startY + i * gap + cardH / 2;
      const card = this.add.container(cx, y).setDepth(10).setAlpha(0);
      const bg = this.add.image(0, 0, 'ui_panel').setDisplaySize(cardW, cardH);

      const icon = this.add.image(-cardW / 2 + 36 * s, 0, lesson.icon);
      const iconSize = 46 * s;
      icon.setScale(Math.min(iconSize / icon.width, iconSize / icon.height));
      if (lesson.icon === 'ui_star') icon.setTint(0xffc93c);
      this.tweens.add({
        targets: icon,
        angle: { from: -6, to: 6 },
        duration: 1100 + i * 120,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      const title = addText(this, -cardW / 2 + 66 * s, -cardH / 2 + 16 * s, lesson.title, {
        fontFamily: 'Fredoka, Nunito, sans-serif',
        fontSize: `${Math.round(16 * s)}px`,
        color: '#ff5e6c',
      }).setOrigin(0, 0.5);
      const text = addText(this, -cardW / 2 + 66 * s, 8 * s, lesson.text, {
        fontFamily: 'Nunito, sans-serif',
        fontSize: `${Math.round(11.5 * s)}px`,
        color: INK,
      }).setOrigin(0, 0.5);

      card.add([bg, icon, title, text]);
      this.tweens.add({
        targets: card,
        alpha: 1,
        y: { from: y + 24 * s, to: y },
        duration: 320,
        delay: 90 * i,
        ease: 'Back.easeOut',
      });
    });

    addButton(this, cx, H * 0.935, 'GOT IT!', 0xff7a45, s * 0.8, () => {
      audio.ui();
      this.scene.start('Title');
    });

    this.cameras.main.fadeIn(250, 255, 233, 214);
  }
}
