import Phaser from 'phaser';
import { addText, coverBackground, metrics } from '../../game/config/layout';
import { coinsFor, getLevel, goalIcon, goalText, starsFor, type LevelConfig } from '../config/levels';
import { save } from '../config/save';
import { audio } from '../systems/AudioSystem';
import { Board, COLS, ROWS, type Frame, type Pos, type Special, type Tile } from '../systems/board';

const INK = '#4a2c20';

/** Candy-crush plate colors. Each piece sits on its own glossy candy. */
const PLATE: Record<string, number> = {
  salmon: 0xff6a45,
  tuna: 0xff3d62,
  tamago: 0xffc431,
  onigiri: 0x6ec0ff,
  maki: 0x3dcc6a,
  taro: 0xc45adf,
  sugar: 0xe0893d,
  mango: 0xffaa1a,
  berry: 0xff4d90,
  lychee: 0xff86c2,
};

interface PlayData {
  levelId?: number;
}

export class PlayScene extends Phaser.Scene {
  private level!: LevelConfig;
  private board!: Board;
  private cell = 48;
  private originX = 0;
  private originY = 0;
  private sprites = new Map<number, Phaser.GameObjects.Container | Phaser.GameObjects.Image>();
  private jellies = new Map<string, Phaser.GameObjects.Graphics>();
  private busy = false;
  private over = false;
  private selected: Pos | null = null;
  private pointerId = -1;
  private dragStart = { x: 0, y: 0 };
  private scoreText!: Phaser.GameObjects.Text;
  private movesText!: Phaser.GameObjects.Text;
  private goalRow!: Phaser.GameObjects.Container;
  private goalBg!: Phaser.GameObjects.Graphics;
  private goalText!: Phaser.GameObjects.Text;
  private goalIcon!: Phaser.GameObjects.Image;
  private shoutText!: Phaser.GameObjects.Text;
  private shoutBase = 0;
  private hint?: Phaser.Time.TimerEvent;

  constructor() {
    super('Play');
  }

  init(data: PlayData): void {
    this.level = getLevel(data?.levelId ?? 1);
    this.board = new Board(this.level);
    this.sprites.clear();
    this.jellies.clear();
    this.busy = false;
    this.over = false;
    this.selected = null;
    this.pointerId = -1;
  }

  create(): void {
    const { W, H, cx, s } = metrics(this);
    const world = this.level.world;
    coverBackground(this, world.bgKey);
    this.add.rectangle(cx, H / 2, W, H, 0xfff3e6, 0.18).setDepth(1);

    this.add
      .particles(0, 0, world.particle, {
        x: { min: 0, max: W },
        y: world.particle === 'fx_bubble' ? H + 8 : -16,
        lifespan: 11000,
        speedY: world.particle === 'fx_bubble' ? { min: -16 * s, max: -36 * s } : { min: 16 * s, max: 40 * s },
        scale: { min: 0.35 * s, max: 0.8 * s },
        alpha: { start: 0.45, end: 0 },
        frequency: 900,
        tint: world.tint,
      })
      .setDepth(2);

    const hud = Math.max(136 * s, 124);
    const availH = H - hud - 14 * s;
    const availW = W - 16 * s;
    this.cell = Math.floor(Math.min(availW / COLS, availH / ROWS));
    const boardW = this.cell * COLS;
    const boardH = this.cell * ROWS;
    this.originX = (W - boardW) / 2;
    this.originY = hud + 6 * s;

    const pad = Math.max(8, 8 * s);
    const frame = this.add.graphics().setDepth(3);
    const fx = this.originX - pad;
    const fy = this.originY - pad;
    const fw = boardW + pad * 2;
    const fh = boardH + pad * 2;
    frame.fillStyle(0xd98462, 1);
    frame.fillRoundedRect(fx - 7 * s, fy - 7 * s, fw + 14 * s, fh + 14 * s, 28);
    frame.fillStyle(0xfff1d4, 1);
    frame.fillRoundedRect(fx, fy, fw, fh, 22);
    frame.lineStyle(Math.max(4, 5 * s), 0xffd56a, 1);
    frame.strokeRoundedRect(fx, fy, fw, fh, 22);

    this.drawBlockers();
    this.drawTiles();

    const pause = this.add.container(28 * s, 28 * s).setDepth(40);
    const pauseBg = this.add.image(0, 0, 'ui_round').setDisplaySize(46 * s, 46 * s);
    const pauseLabel = addText(this, 0, -1, 'II', {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(16 * s)}px`,
      color: INK,
    }).setOrigin(0.5);
    pause.add([pauseBg, pauseLabel]);
    pauseBg.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.openPause());

    addText(this, cx, 20 * s, `${world.name}  ·  ${this.level.stage + 1}`, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: `${Math.round(13 * s)}px`,
      color: world.accent,
      stroke: '#fff7ef',
      strokeThickness: 4,
    })
      .setOrigin(0.5)
      .setDepth(40);

    this.scoreText = addText(this, cx, 42 * s, '0', {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(26 * s)}px`,
      color: INK,
      stroke: '#fff7ef',
      strokeThickness: 6,
    })
      .setOrigin(0.5)
      .setDepth(40);

    this.movesText = addText(this, W - 44 * s, 38 * s, String(this.board.movesLeft), {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(28 * s)}px`,
      color: '#ff5e6c',
      stroke: '#fff7ef',
      strokeThickness: 6,
    })
      .setOrigin(0.5)
      .setDepth(40);
    addText(this, W - 44 * s, 60 * s, 'moves', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: `${Math.round(11 * s)}px`,
      color: '#8a5a48',
      stroke: '#fff7ef',
      strokeThickness: 3,
    })
      .setOrigin(0.5)
      .setDepth(40);

    const goalY = 92 * s;
    this.goalRow = this.add.container(cx, goalY).setDepth(40);
    this.goalBg = this.add.graphics();
    this.goalIcon = this.add.image(0, 0, goalIcon(this.level));
    this.goalText = addText(this, 0, 0, '', {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(15 * s)}px`,
      color: INK,
      stroke: '#fff7ef',
      strokeThickness: 4,
    }).setOrigin(0, 0.5);
    this.goalRow.add([this.goalBg, this.goalIcon, this.goalText]);

    this.shoutText = addText(this, cx, this.originY + boardH * 0.42, '', {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(36 * s)}px`,
      color: '#ff5e6c',
      stroke: '#fff7ef',
      strokeThickness: 8,
    })
      .setOrigin(0.5)
      .setDepth(50)
      .setAlpha(0);
    this.shoutBase = this.shoutText.y;

    this.refreshHud();
    this.bindInput();
    audio.unlock();
    audio.startBgm();
    this.scheduleHint();

    const onHide = () => {
      if (document.hidden && !this.over && !this.scene.isPaused()) this.openPause();
    };
    document.addEventListener('visibilitychange', onHide);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      document.removeEventListener('visibilitychange', onHide);
      audio.stopBgm();
      this.hint?.remove(false);
    });
    this.input.keyboard?.on('keydown-ESC', () => this.openPause());
    this.cameras.main.fadeIn(180, 255, 232, 214);
  }

  private bindInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.busy || this.over || this.pointerId !== -1) return;
      const cell = this.posAt(pointer.x, pointer.y);
      if (!cell || !this.board.canSwap(cell)) {
        this.selected = null;
        return;
      }
      if (this.selected && this.adjacent(this.selected, cell)) {
        const from = this.selected;
        this.selected = null;
        void this.trySwap(from, cell);
        return;
      }
      this.selected = cell;
      this.pointerId = pointer.id;
      this.dragStart.x = pointer.x;
      this.dragStart.y = pointer.y;
      const sprite = this.tileSprite(cell);
      if (sprite) sprite.setScale(1.06);
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.busy || pointer.id !== this.pointerId || !this.selected) return;
      const dx = pointer.x - this.dragStart.x;
      const dy = pointer.y - this.dragStart.y;
      const thresh = Math.max(12, this.cell * 0.28);
      if (Math.abs(dx) < thresh && Math.abs(dy) < thresh) return;
      const from = this.selected;
      const to = Math.abs(dx) > Math.abs(dy)
        ? { c: from.c + Math.sign(dx), r: from.r }
        : { c: from.c, r: from.r + Math.sign(dy) };
      this.selected = null;
      this.pointerId = -1;
      const sprite = this.tileSprite(from);
      if (sprite) sprite.setScale(1);
      void this.trySwap(from, to);
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id !== this.pointerId) return;
      this.pointerId = -1;
      if (this.selected) {
        const sprite = this.tileSprite(this.selected);
        if (sprite) sprite.setScale(1);
      }
    });
  }

  private async trySwap(a: Pos, b: Pos): Promise<void> {
    if (this.busy || this.over) return;
    if (!this.board.canSwap(a) || !this.board.canSwap(b) || !this.adjacent(a, b)) return;
    this.busy = true;
    this.selected = null;
    this.hint?.remove(false);
    const spriteA = this.tileSprite(a);
    const spriteB = this.tileSprite(b);
    const posA = this.cellCenter(a.c, a.r);
    const posB = this.cellCenter(b.c, b.r);
    await this.slide(
      [
        { obj: spriteA, x: posB.x, y: posB.y },
        { obj: spriteB, x: posA.x, y: posA.y },
      ],
      90,
    );
    if (!this.scene.isActive()) return;
    const result = this.board.swap(a, b);
    if (!result || result.reverted) {
      audio.bad();
      await this.slide(
        [
          { obj: spriteA, x: posA.x, y: posA.y },
          { obj: spriteB, x: posB.x, y: posB.y },
        ],
        110,
      );
      this.busy = false;
      this.scheduleHint();
      return;
    }
    await this.playFrames(result.frames);
    if (!this.scene.isActive() || this.over) return;
    this.refreshHud();
    if (this.board.won()) {
      const rush = this.board.sugarRush();
      if (rush.length > 0) {
        this.shout('sweet!');
        await this.playFrames(rush);
      }
      this.finish(true);
      return;
    }
    const expired = this.board.tickFuses();
    this.refreshFuses();
    if (expired.length > 0) {
      audio.bad();
      this.shout(this.level.world.theme === 'sushi' ? 'FUGU?!' : 'TOO SPICY!');
      await this.wait(420);
      this.finish(false);
      return;
    }
    if (this.board.movesLeft <= 0) {
      this.finish(false);
      return;
    }
    if (!this.board.possibleMove()) {
      this.board.reshuffle();
      this.rebuild();
      this.shout('reshuffle!');
    }
    this.refreshHud();
    this.busy = false;
    this.scheduleHint();
  }

  private async playFrames(frames: Frame[]): Promise<void> {
    for (const frame of frames) {
      if (!this.scene.isActive()) return;
      await this.playFrame(frame);
      this.refreshHud();
      if (frame.pops.some((pop) => pop.fx !== 'pop')) audio.special();
      else if (frame.pops.length > 0) audio.pop(frame.combo);
      if (frame.combo >= 2) {
        this.shout(frame.combo >= 4 ? 'FEVER!' : frame.combo === 3 ? 'so fresh!' : 'yummy!');
      }
    }
  }

  private async playFrame(frame: Frame): Promise<void> {
    const popping = frame.pops
      .map((pop) => this.sprites.get(pop.id))
      .filter((sprite): sprite is Phaser.GameObjects.Container | Phaser.GameObjects.Image => !!sprite);
    this.flash(frame);
    if (popping.length > 0) {
      this.tweens.add({ targets: popping, scale: 0.2, alpha: 0, duration: 120, ease: 'Quad.easeIn' });
    }
    await this.wait(popping.length > 0 ? 120 : 20);
    for (const pop of frame.pops) {
      const sprite = this.sprites.get(pop.id);
      if (sprite) this.release(sprite);
      this.sprites.delete(pop.id);
      this.spark(pop.c, pop.r);
    }
    for (const hit of frame.crustHits) {
      const sprite = this.sprites.get(hit.id);
      if (!sprite) continue;
      if (hit.left <= 0) {
        this.release(sprite);
        this.sprites.delete(hit.id);
        this.spark(hit.c, hit.r);
      } else {
        this.tweens.add({ targets: sprite, scale: 1.15, yoyo: true, duration: 80 });
      }
    }
    for (const jelly of frame.jellyCleared) {
      const key = `${jelly.c},${jelly.r}`;
      this.jellies.get(key)?.destroy();
      this.jellies.delete(key);
    }
    for (const born of frame.born) {
      this.makeTile(born.tile, born.c, born.r);
    }
    let waitFor = 40;
    for (const fall of frame.falls) {
      let sprite = this.sprites.get(fall.id);
      if (!sprite && fall.spawn && fall.kind !== 'crust') {
        sprite = this.makeTile({ id: fall.id, kind: fall.kind, special: fall.special }, fall.fromC, fall.fromR);
      }
      if (!sprite) continue;
      const to = this.cellCenter(fall.toC, fall.toR);
      const dist = Math.abs(fall.toR - fall.fromR);
      const duration = 130 + dist * 24;
      waitFor = Math.max(waitFor, duration);
      this.tweens.add({ targets: sprite, x: to.x, y: to.y, duration, ease: 'Cubic.easeIn' });
    }
    await this.wait(waitFor);
    this.refreshFuses();
  }

  private flash(frame: Frame): void {
    const seen = new Set<string>();
    for (const pop of frame.pops) {
      if (pop.fx === 'pop' || pop.fx === 'color') continue;
      const token = pop.fx === 'row' ? `r${pop.r}` : pop.fx === 'col' ? `c${pop.c}` : `${pop.c},${pop.r}`;
      if (seen.has(token)) continue;
      seen.add(token);
      const g = this.add.graphics().setDepth(18);
      g.fillStyle(0xffffff, 0.45);
      if (pop.fx === 'row') {
        g.fillRoundedRect(this.originX, this.originY + pop.r * this.cell, this.cell * COLS, this.cell, 8);
      } else if (pop.fx === 'col') {
        g.fillRoundedRect(this.originX + pop.c * this.cell, this.originY, this.cell, this.cell * ROWS, 8);
      } else {
        const p = this.cellCenter(pop.c, pop.r);
        g.fillCircle(p.x, p.y, this.cell * 1.35);
      }
      this.tweens.add({ targets: g, alpha: 0, duration: 220, onComplete: () => g.destroy() });
    }
  }

  private spark(c: number, r: number): void {
    const p = this.cellCenter(c, r);
    const img = this.add.image(p.x, p.y, 'fx_sparkle').setDepth(22).setScale(0.6);
    this.tweens.add({
      targets: img,
      scale: 1.4,
      alpha: 0,
      duration: 260,
      onComplete: () => img.destroy(),
    });
  }

  private drawBlockers(): void {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = this.board.cells[r][c];
        if (cell.jelly) this.makeJelly(c, r);
        if (cell.crust > 0 && cell.crustId !== 0) this.makeCrust(cell.crustId, c, r);
      }
    }
  }

  private drawTiles(): void {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = this.board.cells[r][c].tile;
        if (tile) this.makeTile(tile, c, r);
      }
    }
    this.refreshFuses();
  }

  private release(sprite: Phaser.GameObjects.Container | Phaser.GameObjects.Image): void {
    this.tweens.killTweensOf(sprite);
    if (sprite instanceof Phaser.GameObjects.Container) {
      for (const child of sprite.list) this.tweens.killTweensOf(child);
    }
    sprite.destroy();
  }

  private rebuild(): void {
    for (const sprite of this.sprites.values()) this.release(sprite);
    this.sprites.clear();
    for (const jelly of this.jellies.values()) jelly.destroy();
    this.jellies.clear();
    this.drawBlockers();
    this.drawTiles();
  }

  private makeJelly(c: number, r: number): void {
    const p = this.cellCenter(c, r);
    const g = this.add.graphics().setDepth(5);
    g.fillStyle(this.level.world.theme === 'sushi' ? 0x6b3a22 : 0xe09060, 0.45);
    g.fillEllipse(p.x, p.y + this.cell * 0.16, this.cell * 0.72, this.cell * 0.28);
    this.jellies.set(`${c},${r}`, g);
  }

  private makeCrust(id: number, c: number, r: number): Phaser.GameObjects.Image {
    const p = this.cellCenter(c, r);
    const img = this.add.image(p.x, p.y, this.level.world.crustKey).setDepth(16);
    const size = this.cell * 0.82;
    img.setDisplaySize(size, size * (img.height / Math.max(1, img.width)));
    this.sprites.set(id, img);
    return img;
  }

  private makeTile(tile: Tile, c: number, r: number): Phaser.GameObjects.Container {
    const p = this.cellCenter(c, r);
    const root = this.add.container(p.x, p.y).setDepth(10);
    const size = this.cell * 0.9;
    const radius = size * 0.28;
    const color = tile.special === 'color' ? 0xffd24a : (PLATE[tile.kind] ?? 0xff8aa8);
    const plate = this.add.graphics();
    plate.fillStyle(0x000000, 0.16);
    plate.fillRoundedRect(-size / 2 + 1, -size / 2 + 4, size, size, radius);
    plate.fillStyle(color, 1);
    plate.fillRoundedRect(-size / 2, -size / 2, size, size, radius);
    plate.fillStyle(0xffffff, 0.45);
    plate.fillRoundedRect(-size / 2 + 5, -size / 2 + 4, size - 10, size * 0.38, radius * 0.65);
    plate.fillStyle(0x000000, 0.1);
    plate.fillRoundedRect(-size / 2 + 6, size * 0.08, size - 12, size * 0.26, 8);
    plate.lineStyle(Math.max(2, size * 0.045), 0xffffff, 0.7);
    plate.strokeRoundedRect(-size / 2 + 2, -size / 2 + 2, size - 4, size - 4, radius * 0.85);
    plate.lineStyle(Math.max(2, size * 0.035), 0x4a2c20, 0.28);
    plate.strokeRoundedRect(-size / 2, -size / 2, size, size, radius);
    const gloss = this.add.ellipse(-size * 0.08, -size * 0.2, size * 0.46, size * 0.16, 0xffffff, 0.7);
    const icon = this.add.image(0, 2, tile.kind);
    const iconSize = this.cell * 0.58;
    icon.setDisplaySize(iconSize, iconSize * (icon.height / Math.max(1, icon.width)));
    const spark = this.add.image(size * 0.28, -size * 0.28, 'fx_sparkle').setScale(Math.max(0.28, this.cell / 180));
    root.add([plate, gloss, icon, spark]);
    this.decorate(root, tile.special);
    const wobble = 1000 + (tile.id % 6) * 90;
    this.tweens.add({
      targets: icon,
      y: icon.y - this.cell * 0.04,
      duration: wobble,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: gloss,
      alpha: 0.22,
      x: size * 0.1,
      duration: wobble + 280,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: spark,
      alpha: 0.15,
      angle: 50,
      duration: 800,
      delay: (tile.id % 8) * 90,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    const fuse = this.fuseFor(tile.id);
    if (fuse > 0) {
      const badge = this.add.image(this.cell * 0.26, -this.cell * 0.26, this.level.world.fuseKey);
      badge.setDisplaySize(this.cell * 0.34, this.cell * 0.34);
      const label = addText(this, this.cell * 0.26, -this.cell * 0.26, '', {
        fontFamily: 'Fredoka, Nunito, sans-serif',
        fontSize: `${Math.max(10, Math.round(this.cell * 0.22))}px`,
        color: '#fff7ef',
        stroke: INK,
        strokeThickness: 3,
      }).setOrigin(0.5);
      root.add([badge, label]);
      root.setData('fuseIcon', badge);
      root.setData('fuseLabel', label);
    }
    this.sprites.set(tile.id, root);
    return root;
  }

  private decorate(root: Phaser.GameObjects.Container, special: Special): void {
    if (special === 'none') return;
    const g = this.add.graphics();
    const radius = this.cell * 0.3;
    if (special === 'row') {
      g.fillStyle(0xffffff, 0.9);
      g.fillRoundedRect(-radius, -3, radius * 2, 6, 3);
    } else if (special === 'col') {
      g.fillStyle(0xffffff, 0.9);
      g.fillRoundedRect(-3, -radius, 6, radius * 2, 3);
    } else if (special === 'bomb') {
      g.lineStyle(Math.max(3, this.cell * 0.06), 0xff5e6c, 1);
      g.strokeCircle(0, 0, radius * 0.85);
    } else {
      g.lineStyle(Math.max(3, this.cell * 0.06), 0xffb02e, 1);
      g.strokeCircle(0, 0, radius);
    }
    root.add(g);
  }

  private refreshFuses(): void {
    for (const [id, sprite] of this.sprites) {
      if (!(sprite instanceof Phaser.GameObjects.Container)) continue;
      const label = sprite.getData('fuseLabel') as Phaser.GameObjects.Text | undefined;
      const icon = sprite.getData('fuseIcon') as Phaser.GameObjects.Image | undefined;
      if (!label) continue;
      const fuse = this.fuseFor(id);
      label.setVisible(fuse > 0);
      icon?.setVisible(fuse > 0);
      if (fuse > 0) label.setText(String(fuse));
    }
  }

  private fuseFor(id: number): number {
    for (const row of this.board.cells) {
      for (const cell of row) {
        if (cell.tile?.id === id) return cell.fuse;
      }
    }
    return 0;
  }

  private refreshHud(): void {
    const progress = this.board.goalProgress();
    this.scoreText.setText(this.board.score.toLocaleString('en-US'));
    this.movesText.setText(String(this.board.movesLeft));
    const goal = this.level.goal;
    const count = `${progress.current.toLocaleString('en-US')} / ${progress.total.toLocaleString('en-US')}`;
    this.goalText.setText(goal.type === 'score' || goal.type === 'collect' ? count : `${goalText(this.level)}   ${count}`);
    const { s, W } = metrics(this);
    const maxText = W - 96 * s;
    let font = Math.round(15 * s);
    this.goalText.setFontSize(font);
    if (this.goalText.width > maxText) {
      font = Math.max(11, Math.floor((font * maxText) / this.goalText.width));
      this.goalText.setFontSize(font);
    }
    const iconBox = 26 * s;
    const gap = 14 * s;
    const padX = 16 * s;
    const h = 36 * s;
    const iconW = iconBox;
    const iconH = iconBox * (this.goalIcon.height / Math.max(1, this.goalIcon.width));
    this.goalIcon.setDisplaySize(iconW, iconH);
    const w = padX + iconW + gap + this.goalText.width + padX;
    this.goalBg.clear();
    this.goalBg.fillStyle(0xfff7ef, 0.96);
    this.goalBg.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    this.goalBg.lineStyle(Math.max(3, 3 * s), 0x4a2c20, 1);
    this.goalBg.strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    this.goalIcon.setPosition(-w / 2 + padX + iconW / 2, 0);
    this.goalText.setPosition(this.goalIcon.x + iconW / 2 + gap, 0);
  }

  private shout(text: string): void {
    this.tweens.killTweensOf(this.shoutText);
    this.shoutText.setText(text).setAlpha(1).setScale(0.7).setY(this.shoutBase);
    this.tweens.add({
      targets: this.shoutText,
      scale: 1,
      alpha: 0,
      y: this.shoutBase - 16,
      duration: 640,
      ease: 'Cubic.easeOut',
    });
  }

  private scheduleHint(): void {
    this.hint?.remove(false);
    this.hint = this.time.delayedCall(4500, () => {
      if (this.busy || this.over) return;
      const move = this.board.possibleMove();
      if (!move) return;
      for (const pos of move) {
        const sprite = this.tileSprite(pos);
        if (!sprite) continue;
        this.tweens.add({ targets: sprite, scale: 1.08, yoyo: true, repeat: 3, duration: 200 });
      }
    });
  }

  private finish(won: boolean): void {
    if (this.over) return;
    this.over = true;
    const stars = starsFor(this.level, this.board.score, won);
    const first = save.starsFor(this.level.id) < 2 && stars >= 2;
    const coins = coinsFor(this.board.score, stars, first);
    save.recordStars(this.level.id, stars);
    if (coins > 0) save.addCoins(coins);
    audio.stopBgm();
    if (won) audio.win();
    this.time.delayedCall(380, () => {
      if (!this.scene.isActive()) return;
      this.scene.start('Result', {
        levelId: this.level.id,
        score: this.board.score,
        stars,
        coins,
        won,
      });
    });
  }

  private openPause(): void {
    if (this.over || this.scene.isPaused()) return;
    audio.ui();
    this.scene.pause();
    this.scene.launch('Pause', { levelId: this.level.id });
  }

  private tileSprite(p: Pos): Phaser.GameObjects.Container | Phaser.GameObjects.Image | undefined {
    const id = this.board.cells[p.r]?.[p.c]?.tile?.id;
    if (!id) return undefined;
    return this.sprites.get(id);
  }

  private posAt(x: number, y: number): Pos | null {
    const c = Math.floor((x - this.originX) / this.cell);
    const r = Math.floor((y - this.originY) / this.cell);
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return null;
    return { c, r };
  }

  private cellCenter(c: number, r: number): { x: number; y: number } {
    return {
      x: this.originX + (c + 0.5) * this.cell,
      y: this.originY + (r + 0.5) * this.cell,
    };
  }

  private adjacent(a: Pos, b: Pos): boolean {
    return Math.abs(a.c - b.c) + Math.abs(a.r - b.r) === 1;
  }

  private slide(
    pairs: Array<{ obj?: Phaser.GameObjects.Container | Phaser.GameObjects.Image; x: number; y: number }>,
    duration: number,
  ): Promise<void> {
    const live = pairs.filter((pair) => pair.obj);
    if (live.length === 0) return Promise.resolve();
    return new Promise((resolve) => {
      let left = live.length;
      for (const pair of live) {
        this.tweens.add({
          targets: pair.obj,
          x: pair.x,
          y: pair.y,
          duration,
          ease: 'Quad.easeOut',
          onComplete: () => {
            left -= 1;
            if (left === 0) resolve();
          },
        });
      }
    });
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.time.delayedCall(ms, () => resolve());
    });
  }
}
