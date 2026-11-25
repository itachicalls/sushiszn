import Phaser from 'phaser';
import { BootScene as BobaBootScene } from './boba/scenes/BootScene';
import { HowToScene as BobaHowToScene } from './boba/scenes/HowToScene';
import { LevelSelectScene as BobaLevelSelectScene } from './boba/scenes/LevelSelectScene';
import { PauseScene as BobaPauseScene } from './boba/scenes/PauseScene';
import { PlayScene as BobaPlayScene } from './boba/scenes/PlayScene';
import { ResultScene as BobaResultScene } from './boba/scenes/ResultScene';
import { ShopScene as BobaShopScene } from './boba/scenes/ShopScene';
import { TitleScene as BobaTitleScene } from './boba/scenes/TitleScene';
import { BootScene as CrushBootScene } from './crush/scenes/BootScene';
import { HowToScene as CrushHowToScene } from './crush/scenes/HowToScene';
import { LevelSelectScene as CrushLevelSelectScene } from './crush/scenes/LevelSelectScene';
import { PauseScene as CrushPauseScene } from './crush/scenes/PauseScene';
import { PlayScene as CrushPlayScene } from './crush/scenes/PlayScene';
import { ResultScene as CrushResultScene } from './crush/scenes/ResultScene';
import { TitleScene as CrushTitleScene } from './crush/scenes/TitleScene';
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

const CRUSH_SCENES = [
  CrushBootScene,
  CrushTitleScene,
  CrushLevelSelectScene,
  CrushHowToScene,
  CrushPlayScene,
  CrushPauseScene,
  CrushResultScene,
];

const BACKGROUNDS: Record<GameId, string> = {
  sushi: '#ffe3c4',
  boba: '#f6dcc8',
  crush: '#ffe4d2',
};

const TITLES: Record<GameId, string> = {
  sushi: 'Sushi Szn',
  boba: 'Boba Hour',
  crush: 'Sushi Crush',
};

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

  document.body.style.background = BACKGROUNDS[id];
  document.title = TITLES[id];
  if (location.hash !== `#${id}`) history.replaceState(null, '', `#${id}`);

  const size = canvasSize();
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: BACKGROUNDS[id],
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
    scene: id === 'boba' ? BOBA_SCENES : id === 'crush' ? CRUSH_SCENES : SUSHI_SCENES,
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

function initialGame(): GameId {
  const hash = location.hash.replace('#', '');
  if (hash === 'boba' || hash === 'crush' || hash === 'sushi') return hash;
  return 'sushi';
}

start(initialGame());

let resizeTimer: number | undefined;
window.addEventListener('resize', () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    const size = canvasSize();
    game?.scale.resize(size.width, size.height);
  }, 100);
});
