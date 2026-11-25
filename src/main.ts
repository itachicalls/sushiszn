import Phaser from 'phaser';
import { BootScene as BobaBootScene } from './boba/scenes/BootScene';
import { HowToScene as BobaHowToScene } from './boba/scenes/HowToScene';
import { LevelSelectScene as BobaLevelSelectScene } from './boba/scenes/LevelSelectScene';
import { PauseScene as BobaPauseScene } from './boba/scenes/PauseScene';
import { PlayScene as BobaPlayScene } from './boba/scenes/PlayScene';
import { ResultScene as BobaResultScene } from './boba/scenes/ResultScene';
import { ShopScene as BobaShopScene } from './boba/scenes/ShopScene';
import { TitleScene as BobaTitleScene } from './boba/scenes/TitleScene';
import { BootScene } from './game/scenes/BootScene';
import { HowToScene } from './game/scenes/HowToScene';
import { LevelSelectScene } from './game/scenes/LevelSelectScene';
import { PauseScene } from './game/scenes/PauseScene';
import { PlayScene } from './game/scenes/PlayScene';
import { ResultScene } from './game/scenes/ResultScene';
import { ShopScene } from './game/scenes/ShopScene';
import { TitleScene } from './game/scenes/TitleScene';
import { registerLauncher, type GameId } from './switchGame';
import './styles/global.css';

const root = document.getElementById('app');
if (!root) {
  throw new Error('Missing #app root');
}
const parent: HTMLElement = root;

const DPR = Math.min(window.devicePixelRatio || 1, 2);

const SUSHI_SCENES = [
  BootScene,
  TitleScene,
  LevelSelectScene,
  HowToScene,
  ShopScene,
  PlayScene,
  PauseScene,
  ResultScene,
];

const BOBA_SCENES = [
  BobaBootScene,
  BobaTitleScene,
  BobaLevelSelectScene,
  BobaHowToScene,
  BobaShopScene,
  BobaPlayScene,
  BobaPauseScene,
  BobaResultScene,
];

let game: Phaser.Game | null = null;

function canvasSize(): { width: number; height: number } {
  return {
    width: window.innerWidth * DPR,
    height: window.innerHeight * DPR,
  };
}

function start(id: GameId): void {
  if (game) {
    game.destroy(true);
    game = null;
  }
  parent.replaceChildren();

  const boba = id === 'boba';
  document.body.style.background = boba ? '#f6dcc8' : '#ffe3c4';
  document.title = boba ? 'Boba Hour' : 'Sushi Szn';

  const size = canvasSize();
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: boba ? '#f6dcc8' : '#ffe3c4',
    scale: {
      mode: Phaser.Scale.NONE,
      width: size.width,
      height: size.height,
      zoom: 1 / DPR,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: boba ? BOBA_SCENES : SUSHI_SCENES,
    input: {
      activePointers: 3,
    },
    render: {
      antialias: true,
      roundPixels: false,
    },
  });
}

registerLauncher(start);
start('sushi');

let resizeTimer: number | undefined;
window.addEventListener('resize', () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    const size = canvasSize();
    game?.scale.resize(size.width, size.height);
  }, 100);
});
