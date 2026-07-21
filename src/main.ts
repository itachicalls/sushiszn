import Phaser from 'phaser';
import { BootScene } from './game/scenes/BootScene';
import { PlayScene } from './game/scenes/PlayScene';
import { ResultScene } from './game/scenes/ResultScene';
import { TitleScene } from './game/scenes/TitleScene';
import './styles/global.css';

const parent = document.getElementById('app');
if (!parent) {
  throw new Error('Missing #app root');
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent,
  backgroundColor: '#ffe3c4',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, TitleScene, PlayScene, ResultScene],
  input: {
    activePointers: 3,
  },
  render: {
    antialias: true,
    roundPixels: false,
  },
});
