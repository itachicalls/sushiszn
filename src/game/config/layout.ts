import Phaser from 'phaser';

/** Design reference size; `s` scales gameplay/UI relative to it. */
export const DESIGN_WIDTH = 390;
export const DESIGN_HEIGHT = 780;

export interface Metrics {
  W: number;
  H: number;
  cx: number;
  cy: number;
  /** ui/gameplay scale factor */
  s: number;
}

export function metrics(scene: Phaser.Scene): Metrics {
  const W = scene.scale.width;
  const H = scene.scale.height;
  const s = Phaser.Math.Clamp(
    Math.min(W / DESIGN_WIDTH, H / DESIGN_HEIGHT) * 1.05,
    0.7,
    2.2,
  );
  return { W, H, cx: W / 2, cy: H / 2, s };
}

// canvas is already sized at device resolution (see main.ts)
const TEXT_RESOLUTION = 1;

/** Crisp text helper. */
export function addText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  str: string,
  style: Phaser.Types.GameObjects.Text.TextStyle,
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, str, { resolution: TEXT_RESOLUTION, ...style });
}

/** Cover-fit the background image to the current viewport. */
export function coverBackground(scene: Phaser.Scene, key = 'bg'): Phaser.GameObjects.Image {
  const { W, H, cx, cy } = metrics(scene);
  const img = scene.add.image(cx, cy, key);
  const scale = Math.max(W / img.width, H / img.height);
  img.setScale(scale);
  return img;
}

/** Kawaii pill sound toggle used on every screen. */
export function addSoundToggle(
  scene: Phaser.Scene,
  x: number,
  y: number,
  s: number,
  isMuted: () => boolean,
  onToggle: () => void,
): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y).setDepth(60);
  const bg = scene.add.image(0, 0, 'ui_pill').setDisplaySize(128 * s, 40 * s);
  const label = addText(scene, 0, -1, '', {
    fontFamily: 'Fredoka, Nunito, sans-serif',
    fontSize: `${Math.round(15 * s)}px`,
    color: '#4a2c20',
  }).setOrigin(0.5);
  const refresh = () => {
    const muted = isMuted();
    label.setText(muted ? 'sound  zZ' : 'sound  ON');
    label.setColor(muted ? '#b39b8e' : '#ff5e6c');
    bg.setTint(muted ? 0xe8dcd2 : 0xffffff);
  };
  refresh();
  c.add([bg, label]);
  bg.setInteractive({ useHandCursor: true })
    .on('pointerover', () => c.setScale(1.07))
    .on('pointerout', () => c.setScale(1))
    .on('pointerdown', () => {
      onToggle();
      refresh();
      scene.tweens.add({
        targets: c,
        scaleX: 1.18,
        scaleY: 0.85,
        duration: 80,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
    });
  return c;
}

/** Kawaii rounded button shared across scenes. Returns the container. */
export function addButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  tint: number,
  scale: number,
  onClick: () => void,
  textColor = '#fff7ef',
): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y).setDepth(12).setScale(scale);
  const bg = scene.add.image(0, 0, 'ui_btn').setTint(tint);
  const t = addText(scene, 0, -1, label, {
    fontFamily: 'Fredoka, Nunito, sans-serif',
    fontSize: '28px',
    color: textColor,
    stroke: textColor === '#fff7ef' ? '#4a2c20' : '#fff7ef',
    strokeThickness: 5,
  }).setOrigin(0.5);
  c.add([bg, t]);
  bg.setInteractive({ useHandCursor: true })
    .on('pointerover', () => c.setScale(scale * 1.05))
    .on('pointerout', () => c.setScale(scale))
    .on('pointerdown', () => {
      scene.tweens.add({
        targets: c,
        scaleX: scale * 1.1,
        scaleY: scale * 0.9,
        duration: 80,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
      onClick();
    });
  return c;
}

/** Coin count pill (icon + amount). Call `refresh` after coin changes. */
export function addCoinPill(
  scene: Phaser.Scene,
  x: number,
  y: number,
  s: number,
  getCoins: () => number,
): { container: Phaser.GameObjects.Container; refresh: () => void } {
  const c = scene.add.container(x, y).setDepth(60);
  const bg = scene.add.image(0, 0, 'ui_pill').setDisplaySize(110 * s, 40 * s);
  const icon = scene.add.image(-34 * s, 0, 'coin');
  icon.setDisplaySize(26 * s, 26 * s);
  const label = addText(scene, 10 * s, -1, '', {
    fontFamily: 'Fredoka, Nunito, sans-serif',
    fontSize: `${Math.round(17 * s)}px`,
    color: '#4a2c20',
  }).setOrigin(0.5);
  const refresh = () => label.setText(String(getCoins()));
  refresh();
  c.add([bg, icon, label]);
  return { container: c, refresh };
}

/** Debounced scene restart on viewport resize (for static screens). */
export function restartOnResize(scene: Phaser.Scene): void {
  let timer: number | null = null;
  const onResize = () => {
    if (timer !== null) window.clearTimeout(timer);
    timer = window.setTimeout(() => scene.scene.restart(), 200);
  };
  scene.scale.on('resize', onResize);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.scale.off('resize', onResize);
    if (timer !== null) window.clearTimeout(timer);
  });
}
