import Phaser from 'phaser';
import { BootScene } from './game/scenes/BootScene';
import { HowToScene } from './game/scenes/HowToScene';
import { LevelSelectScene } from './game/scenes/LevelSelectScene';
import { PauseScene } from './game/scenes/PauseScene';
import { PlayScene } from './game/scenes/PlayScene';
import { ResultScene } from './game/scenes/ResultScene';
import { ShopScene } from './game/scenes/ShopScene';
import { TitleScene } from './game/scenes/TitleScene';
import './styles/global.css';

const parent = document.getElementById('app');
if (!parent) {
  throw new Error('Missing #app root');
}

// Render at device resolution (capped at 2x) so text/art stay crisp on phones.
const DPR = Math.min(window.devicePixelRatio || 1, 2);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent,
  backgroundColor: '#ffe3c4',
  scale: {
    mode: Phaser.Scale.NONE,
    width: window.innerWidth * DPR,
    height: window.innerHeight * DPR,
    zoom: 1 / DPR,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [
    BootScene,
    TitleScene,
    LevelSelectScene,
    HowToScene,
    ShopScene,
    PlayScene,
    PauseScene,
    ResultScene,
  ],
  input: {
    activePointers: 3,
  },
  render: {
    antialias: true,
    roundPixels: false,
  },
});

let resizeTimer: number | undefined;
window.addEventListener('resize', () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    game.scale.resize(window.innerWidth * DPR, window.innerHeight * DPR);
  }, 100);
});
