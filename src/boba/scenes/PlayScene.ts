import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { coinsForRun, getLevel, starsForScore, type LevelConfig } from '../config/levels';
import { addText, coverBackground, DESIGN_HEIGHT, metrics } from '../config/layout';
import { save } from '../config/save';
import { HAZARDS, HOT_SPLASH } from '../config/drinkTypes';
import { applyUpgrades, type AppliedUpgrades } from '../config/upgrades';
import { TeaCup } from '../entities/Cup';
import { DrinkPiece } from '../entities/Drink';
import { Straw } from '../entities/Straw';
import { audio } from '../systems/AudioSystem';
import { ComboSystem } from '../systems/ComboSystem';
import { FeverSystem } from '../systems/FeverSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import { defaultSpawnConfig, Spawner, type SpawnConfig } from '../systems/Spawner';

interface TrailPoint {
  x: number;
  y: number;
  t: number;
}

export interface PlayData {
  levelId?: number;
}

const INK = '#4a2c20';
const CREAM = '#fff7ef';
const ROSE = '#e07090';

const HAZARD_SHOUTS: Record<string, string> = {
  splash: 'TOO HOT!!',
  chili: 'CHILI!!',
};

export class PlayScene extends Phaser.Scene {
  private drinkGroup!: Phaser.Physics.Arcade.Group;
  private spawner!: Spawner;
  private straw!: Straw;
  private cup!: TeaCup;
  private scoreSys = new ScoreSystem();
  private comboSys = new ComboSystem();
  private feverSys = new FeverSystem();

  private level: LevelConfig | null = null;
  private perks!: AppliedUpgrades;
  private maxHearts: number = BALANCE.hearts;
  private guardsLeft = 0;
  private duration: number = BALANCE.shiftSeconds;

  private hearts: number = BALANCE.hearts;
  private timeLeft: number = BALANCE.shiftSeconds;
  private grabsTotal = 0;
  private ended = false;
  private paused = false;
  private swiping = false;
  private trail: TrailPoint[] = [];
  private chillUntil = 0;

  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private heartIcons: Phaser.GameObjects.Image[] = [];
  private starIcons: Phaser.GameObjects.Image[] = [];
  private starsLit = 0;
  private feverBarFill!: Phaser.GameObjects.Rectangle;
  private feverBarWidth = 144;
  private feverOverlay!: Phaser.GameObjects.Rectangle;
  private chillOverlay!: Phaser.GameObjects.Rectangle;
  private sparkles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private goldBurst!: Phaser.GameObjects.Particles.ParticleEmitter;
  private trailGfx!: Phaser.GameObjects.Graphics;

  constructor() {
    super('Play');
  }

  init(data: PlayData): void {
    this.level = data?.levelId ? getLevel(data.levelId) : null;
  }

  create(): void {
    const { W, H, cx, s } = metrics(this);

    this.perks = applyUpgrades(save.upgrades);
    this.maxHearts = BALANCE.hearts + this.perks.extraHearts;
    this.guardsLeft = this.perks.hazardGuards;
    this.duration = this.level ? this.level.durationSeconds : BALANCE.shiftSeconds;

    this.ended = false;
    this.paused = false;
    this.hearts = this.maxHearts;
    this.timeLeft = this.duration;
    this.grabsTotal = 0;
    this.starsLit = 0;
    this.chillUntil = 0;
    this.scoreSys.reset();
    this.comboSys.reset();
    this.feverSys.reset();
    this.feverSys.grabsToFill = Math.max(6, BALANCE.feverGrabsToFill - this.perks.feverGrabsReduction);
    this.trail = [];
    this.swiping = false;
    this.time.timeScale = 1;
    this.tweens.timeScale = 1;
    this.physics.world.timeScale = 1;

    const season = this.level?.season;
    coverBackground(this, season?.bgKey ?? 'bg');

    this.add
      .particles(0, 0, 'fx_bubble', {
        x: { min: 0, max: W },
        y: H + 10,
        lifespan: 9000,
        speedY: { min: -22 * s, max: -48 * s },
        speedX: { min: -12, max: 12 },
        scale: { min: 0.45 * s, max: 1.05 * s },
        alpha: { start: 0.55, end: 0 },
        frequency: Math.max(380, 980 / (W / 390)),
        tint: season?.bubbleTint ?? 0xffffff,
      })
      .setDepth(2);

    const gravityFactor = season?.gravityFactor ?? 1;
    this.physics.world.gravity.y = BALANCE.gravity * gravityFactor * (H / DESIGN_HEIGHT);

    this.drinkGroup = this.physics.add.group();
    this.spawner = new Spawner(this, this.drinkGroup, this.buildSpawnConfig());
    this.cup = new TeaCup(this);
    this.straw = new Straw(this);
    this.trailGfx = this.add.graphics().setDepth(35);

    this.sparkles = this.add.particles(0, 0, 'fx_sparkle', {
      speed: { min: 60 * s, max: 220 * s },
      scale: { start: 1.1 * s, end: 0 },
      rotate: { start: 0, end: 180 },
      lifespan: 500,
      gravityY: 140 * s,
      emitting: false,
    });
    this.sparkles.setDepth(30);

    this.goldBurst = this.add.particles(0, 0, 'fx_confetti', {
      speed: { min: 120 * s, max: 320 * s },
      scale: { start: 1.1 * s, end: 0.2 * s },
      rotate: { start: 0, end: 360 },
      lifespan: 700,
      gravityY: 320 * s,
      tint: [0xffd75e, 0xff8aa8, 0xc9a0e8, 0x7ec8ff],
      emitting: false,
    });
    this.goldBurst.setDepth(30);

    this.feverOverlay = this.add.rectangle(cx, H / 2, W, H, 0xffd75e, 0).setDepth(3);
    this.chillOverlay = this.add.rectangle(cx, H / 2, W, H, 0xb7dcff, 0).setDepth(4);

    this.buildHud();
    this.bindInput();

    const onHidden = () => this.openPause();
    this.game.events.on(Phaser.Core.Events.HIDDEN, onHidden);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Phaser.Core.Events.HIDDEN, onHidden);
    });
    this.events.on(Phaser.Scenes.Events.RESUME, () => {
      this.paused = false;
      audio.startBgm();
    });

    audio.startBgm();
    this.cameras.main.fadeIn(300, 246, 220, 200);

    const readyMsg = this.level
      ? `CUP ${this.level.id}  ·  ${this.level.season.name.toUpperCase()}`
      : "IT'S BOBA HOUR!";
    const ready = addText(this, cx, H * 0.4, readyMsg, {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round((this.level ? 26 : 38) * s)}px`,
      color: ROSE,
      stroke: CREAM,
      strokeThickness: 10,
    })
      .setOrigin(0.5)
      .setDepth(60)
      .setScale(0);
    this.tweens.add({
      targets: ready,
      scale: 1,
      duration: 380,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: ready,
          alpha: 0,
          y: ready.y - 40,
          delay: 550,
          duration: 300,
          onComplete: () => ready.destroy(),
        });
      },
    });
  }

  private buildSpawnConfig(): SpawnConfig {
    const cfg = defaultSpawnConfig();
    if (this.level) {
      cfg.spawnIntervalStart = this.level.spawnIntervalStart;
      cfg.spawnIntervalEnd = this.level.spawnIntervalEnd;
      cfg.hazardChance = this.level.hazardChance;
      cfg.goldenChance = this.level.goldenChance;
      cfg.hazards = this.level.season.hazards.map((k) => HAZARDS[k]);
      cfg.windX = this.level.season.windX;
      cfg.gravityFactor = this.level.season.gravityFactor;
    } else {
      cfg.hazards = [HOT_SPLASH, HAZARDS.ice];
    }
    cfg.goldenChance += this.perks.extraGoldenChance;
    return cfg;
  }

  private isChilled(): boolean {
    return this.time.now < this.chillUntil;
  }

  update(_time: number, delta: number): void {
    if (this.ended || this.paused) return;
    // A hitch or a backgrounded tab must not skip the whole cup.
    const step = Math.min(delta, 48);

    this.timeLeft -= step / 1000;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.endRound('what a cozy hour!');
      return;
    }

    const progress = 1 - this.timeLeft / this.duration;
    this.spawner.update(step, progress);
    this.comboSys.tick(this.time.now, BALANCE.comboWindowMs);
    if (this.feverSys.tick(step)) this.endFever();
    this.chillOverlay.setFillStyle(0xb7dcff, this.isChilled() ? 0.12 : 0);
    this.refreshHud();
    this.cullMissed();
    this.drawTrail();
  }

  private openPause(): void {
    if (this.ended || this.paused || !this.scene.isActive()) return;
    this.paused = true;
    this.endSwipe();
    audio.stopBgm();
    this.scene.launch('Pause', { levelId: this.level?.id });
    this.scene.pause();
  }

  private buildHud(): void {
    const { W, cx, s } = metrics(this);
    const topY = 34 * s;
    const pauseR = 24 * s;
    const edge = 14 * s;
    const gap = 10 * s;
    const sideMax = cx - pauseR - edge - gap;
    const scoreW = Math.min(150 * s, sideMax);
    const timerW = Math.min(96 * s, sideMax);
    const fontPx = Math.round(Math.min(26 * s, scoreW * 0.3));

    this.add.image(edge + scoreW / 2, topY, 'ui_pill').setDepth(50).setDisplaySize(scoreW, 46 * s);
    this.scoreText = addText(this, edge + scoreW / 2, topY - 1, '0', {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${fontPx}px`,
      color: INK,
    })
      .setOrigin(0.5)
      .setDepth(51);

    this.add.image(W - edge - timerW / 2, topY, 'ui_pill').setDepth(50).setDisplaySize(timerW, 46 * s);
    this.timerText = addText(this, W - edge - timerW / 2, topY - 1, `${this.duration}`, {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${fontPx}px`,
      color: INK,
    })
      .setOrigin(0.5)
      .setDepth(51);

    const pauseBtn = this.add.container(cx, topY).setDepth(60);
    const pauseBg = this.add.image(0, 0, 'ui_round').setDisplaySize(pauseR * 2, pauseR * 2);
    const barW = 5 * s;
    const barH = 16 * s;
    const bar1 = this.add.rectangle(-5 * s, 0, barW, barH, 0xe07090).setOrigin(0.5);
    const bar2 = this.add.rectangle(5 * s, 0, barW, barH, 0xe07090).setOrigin(0.5);
    pauseBtn.add([pauseBg, bar1, bar2]);
    pauseBg
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => pauseBtn.setScale(1.08))
      .on('pointerout', () => pauseBtn.setScale(1))
      .on('pointerdown', () => {
        audio.ui();
        this.openPause();
      });

    this.starIcons = [];
    if (this.level) {
      const starSize = 20 * s;
      for (let i = 0; i < 3; i++) {
        const star = this.add
          .image(cx + (i - 1) * (starSize + 6 * s), topY + 34 * s, 'ui_star')
          .setDepth(51)
          .setTint(0xd8cabf);
        star.setDisplaySize(starSize, starSize);
        this.starIcons.push(star);
      }
    }

    this.heartIcons = [];
    for (let i = 0; i < this.maxHearts; i++) {
      const heart = this.add.image(28 * s + i * 34 * s, 78 * s, 'heart').setDepth(50);
      heart.setDisplaySize(28 * s, 28 * s * (heart.height / heart.width));
      this.heartIcons.push(heart);
    }

    this.feverBarWidth = 144 * s;
    this.add
      .rectangle(W - 24 * s - this.feverBarWidth / 2, 78 * s, this.feverBarWidth + 6 * s, 16 * s, 0x4a2c20, 0.25)
      .setDepth(50)
      .setStrokeStyle(3, 0x4a2c20, 0.9);
    this.feverBarFill = this.add
      .rectangle(W - 24 * s - this.feverBarWidth, 78 * s, 0, 10 * s, 0xffb02e)
      .setOrigin(0, 0.5)
      .setDepth(51);
    addText(this, W - 24 * s - this.feverBarWidth / 2, 78 * s, 'CUP', {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(11 * s)}px`,
      color: CREAM,
      stroke: INK,
      strokeThickness: 3,
    })
      .setOrigin(0.5)
      .setDepth(52);

    this.comboText = addText(this, cx, 124 * s, '', {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(30 * s)}px`,
      color: ROSE,
      stroke: CREAM,
      strokeThickness: 8,
    })
      .setOrigin(0.5)
      .setDepth(52);
  }

  private refreshHud(): void {
    this.scoreText.setText(String(this.scoreSys.score));
    this.timerText.setText(String(Math.ceil(this.timeLeft)));
    this.timerText.setColor(this.timeLeft <= 10 ? ROSE : INK);
    this.heartIcons.forEach((h, i) => h.setAlpha(i < this.hearts ? 1 : 0.2));
    this.feverBarFill.width = this.feverBarWidth * this.feverSys.charge;
    this.feverBarFill.setFillStyle(this.feverSys.active ? 0xffd75e : 0xffb02e);

    if (this.level) {
      const stars = starsForScore(this.level, this.scoreSys.score);
      while (this.starsLit < stars) {
        const icon = this.starIcons[this.starsLit];
        icon.setTint(0xffc93c);
        this.tweens.add({
          targets: icon,
          scale: icon.scale * 1.6,
          angle: 360,
          duration: 380,
          yoyo: true,
          ease: 'Back.easeOut',
        });
        this.starsLit += 1;
      }
    }

    const combo = this.comboSys.combo;
    const chilled = this.isChilled();
    const label = combo >= 2 ? (chilled ? `x${combo}  brr` : `x${combo}`) : chilled ? 'brr...' : '';
    if (label !== this.comboText.text) {
      this.comboText.setText(label);
      this.comboText.setColor(chilled ? '#6eb7e8' : ROSE);
      if (label) {
        this.comboText.setScale(1.4);
        this.tweens.add({ targets: this.comboText, scale: 1, duration: 180, ease: 'Back.easeOut' });
      }
    }
  }

  private bindInput(): void {
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.ended) return;
      this.swiping = true;
      this.trail = [{ x: p.x, y: p.y, t: this.time.now }];
      this.straw.beginFollow(p.x, p.y);
      audio.unlock();
    });

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.swiping || this.ended) return;
      const prev = this.trail[this.trail.length - 1];
      this.trail.push({ x: p.x, y: p.y, t: this.time.now });
      if (this.trail.length > 14) this.trail.shift();
      const angle = prev ? Phaser.Math.Angle.Between(prev.x, prev.y, p.x, p.y) : 0;
      this.straw.followPointer(p.x, p.y, angle);
      if (prev) this.tryGrab(prev.x, prev.y, p.x, p.y, prev.t);
    });

    this.input.on('pointerup', () => this.endSwipe());
    this.input.on('pointerupoutside', () => this.endSwipe());
    this.input.keyboard?.on('keydown-ESC', () => this.openPause());
    this.input.keyboard?.on('keydown-P', () => this.openPause());
  }

  private endSwipe(): void {
    if (!this.swiping) return;
    this.swiping = false;
    this.straw.endFollow();
    this.trail = [];
    this.trailGfx.clear();
  }

  private drawTrail(): void {
    const { s } = metrics(this);
    this.trailGfx.clear();
    if (this.trail.length < 2) return;
    const chilled = this.isChilled();
    for (let i = 1; i < this.trail.length; i++) {
      const a = this.trail[i - 1];
      const b = this.trail[i];
      const p = i / this.trail.length;
      const color = this.feverSys.active
        ? Phaser.Display.Color.HSLToColor((this.time.now / 600 + p) % 1, 0.85, 0.66).color
        : chilled
          ? 0x9fd4ff
          : 0xf0b7c8;
      this.trailGfx.lineStyle(10 * p * s, color, 0.28 + 0.5 * p);
      this.trailGfx.lineBetween(a.x, a.y, b.x, b.y);
    }
  }

  private tryGrab(x1: number, y1: number, x2: number, y2: number, t0: number): void {
    const { s } = metrics(this);
    const dt = Math.max(16, this.time.now - t0);
    const speed = (Phaser.Math.Distance.Between(x1, y1, x2, y2) / dt) * 1000;
    if (speed < BALANCE.minSwipeSpeed * s) return;

    for (const piece of this.drinkGroup.getChildren() as DrinkPiece[]) {
      if (!piece.active || piece.grabbed) continue;
      const radius = piece.getHitRadius() * this.perks.reachMultiplier;
      if (distanceToSegment(piece.x, piece.y, x1, y1, x2, y2) <= radius) {
        this.resolveGrab(piece);
      }
    }
  }

  private resolveGrab(piece: DrinkPiece): void {
    piece.markGrabbed();
    this.straw.sip();

    if (piece.def.isChill) {
      audio.chill();
      this.chillUntil = this.time.now + BALANCE.chillMs;
      this.comboSys.slowDown();
      this.cup.shiver();
      this.cameras.main.flash(140, 190, 225, 255);
      this.floatText(piece.x, piece.y - 20, 'brr... slowed', '#6eb7e8', 26);
      piece.setTint(0xd7eeff);
      this.sparkles.emitParticleAt(piece.x, piece.y, 8);
      piece.playPop();
      return;
    }

    if (piece.def.isBomb) {
      audio.bomb();
      this.comboSys.breakCombo();
      this.feverSys.punish();
      const guarded = this.guardsLeft > 0;
      if (guarded) {
        this.guardsLeft -= 1;
        this.cameras.main.shake(110, 0.006);
        this.floatText(piece.x, piece.y - 24, 'guarded! ✧', '#5a7bd6', 26);
      } else {
        this.loseHeart();
        this.cameras.main.shake(180, 0.012);
        this.floatText(piece.x, piece.y, HAZARD_SHOUTS[piece.def.kind] ?? 'OOPS!!', '#e07a3a', 30);
      }
      this.hitStop(120);
      piece.setTint(piece.def.kind === 'chili' ? 0xff8a8a : 0xffc27a);
      this.sparkles.emitParticleAt(piece.x, piece.y, 8);
      piece.playPop();
      return;
    }

    this.grabsTotal += 1;
    const chilled = this.isChilled();
    const combo = this.comboSys.registerGrab(this.time.now, BALANCE.comboWindowMs, chilled);
    const mult = this.feverSys.active ? BALANCE.feverScoreMultiplier : 1;
    const gained = this.scoreSys.addPoints(
      piece.def.points * mult,
      combo,
      chilled ? BALANCE.chillScoreDamp : 1,
    );

    const mouth = this.cup.mouth();
    this.cup.sip();
    if (piece.def.isBonus) {
      audio.golden();
      this.goldBurst.emitParticleAt(piece.x, piece.y, 18);
      this.hitStop(100);
      this.cameras.main.flash(140, 255, 215, 94);
    } else {
      audio.grab(combo);
      this.sparkles.emitParticleAt(mouth.x, mouth.y, combo >= 4 ? 10 : 6);
    }

    if (combo >= 4 && combo % 4 === 0) {
      audio.combo();
      this.straw.cheer();
      this.cameras.main.shake(80, 0.004);
    }

    piece.playSip(mouth.x, mouth.y);
    this.floatText(
      piece.x,
      piece.y - 24,
      `+${gained}`,
      piece.def.isBonus ? '#e6a800' : this.feverSys.active ? ROSE : INK,
      piece.def.isBonus ? 30 : 24,
    );

    if (this.feverSys.addGrab()) this.startFever();
  }

  private startFever(): void {
    const { cx, H, s } = metrics(this);
    this.spawner.feverMode = true;
    this.cup.setFull(true);
    audio.fever();
    this.cameras.main.flash(240, 255, 214, 120);
    this.cameras.main.shake(120, 0.007);
    this.feverOverlay.setFillStyle(0xffd75e, 0.12);
    this.tweens.add({
      targets: this.feverOverlay,
      fillAlpha: { from: 0.16, to: 0.05 },
      duration: 420,
      yoyo: true,
      repeat: -1,
    });

    const banner = addText(this, cx, H * 0.34, 'FULL CUP!', {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(48 * s)}px`,
      color: '#ffb02e',
      stroke: INK,
      strokeThickness: 10,
    })
      .setOrigin(0.5)
      .setDepth(60)
      .setScale(0);
    this.tweens.add({
      targets: banner,
      scale: 1,
      duration: 320,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: banner,
          alpha: 0,
          y: banner.y - 44,
          delay: 700,
          duration: 320,
          onComplete: () => banner.destroy(),
        });
      },
    });
    this.goldBurst.emitParticleAt(cx, H * 0.34, 28);
  }

  private endFever(): void {
    this.spawner.feverMode = false;
    this.cup.setFull(false);
    this.tweens.killTweensOf(this.feverOverlay);
    this.feverOverlay.setFillStyle(0xffd75e, 0);
  }

  private hitStop(ms: number): void {
    this.physics.world.timeScale = 3;
    this.time.delayedCall(ms, () => {
      this.physics.world.timeScale = 1;
    });
  }

  private cullMissed(): void {
    const { W, H, s } = metrics(this);
    for (const piece of this.drinkGroup.getChildren() as DrinkPiece[]) {
      if (!piece.active || piece.grabbed) continue;
      const body = piece.body as Phaser.Physics.Arcade.Body;
      const falling = body.velocity.y > 40;
      if ((falling && piece.y > H + 70 * s) || piece.x < -110 * s || piece.x > W + 110 * s) {
        const harmless = piece.def.isBomb || piece.def.isChill || this.feverSys.active;
        if (!harmless) {
          audio.miss();
          this.loseHeart();
          this.comboSys.breakCombo();
          this.floatText(Phaser.Math.Clamp(piece.x, 40, W - 40), H - 150 * s, 'miss...', '#8a5a48', 20);
        }
        piece.destroy();
      }
    }
  }

  private loseHeart(): void {
    if (this.ended) return;
    this.hearts -= 1;
    audio.heartLost();
    const icon = this.heartIcons[this.hearts];
    if (icon) {
      this.tweens.add({
        targets: icon,
        scale: icon.scale * 1.3,
        angle: 20,
        duration: 110,
        yoyo: true,
        onComplete: () => icon.setAlpha(0.2),
      });
    }
    this.cameras.main.flash(120, 255, 180, 180);
    if (this.hearts <= 0) {
      this.hearts = 0;
      this.endRound('the tea went cold...');
    }
  }

  private floatText(x: number, y: number, msg: string, color: string, size = 24): void {
    const { s } = metrics(this);
    const t = addText(this, x, y, msg, {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(size * s)}px`,
      color,
      stroke: CREAM,
      strokeThickness: 7,
    })
      .setOrigin(0.5)
      .setDepth(45)
      .setScale(0.4);
    this.tweens.add({ targets: t, scale: 1, duration: 130, ease: 'Back.easeOut' });
    this.tweens.add({
      targets: t,
      y: y - 56 * s,
      alpha: 0,
      delay: 160,
      duration: 560,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  private endRound(reason: string): void {
    if (this.ended) return;
    this.ended = true;
    this.spawner.stop();
    this.endSwipe();
    this.endFever();

    const score = this.scoreSys.score;
    let stars = 0;
    let coins = 0;
    if (this.level) {
      stars = starsForScore(this.level, score);
      const firstClear = save.starsFor(this.level.id) < 2;
      coins = coinsForRun(score, stars, firstClear);
      save.recordStars(this.level.id, stars);
      save.addCoins(coins);
    } else {
      coins = coinsForRun(score, 0, false);
      save.addCoins(coins);
      save.recordScore(score);
    }

    this.time.delayedCall(480, () => {
      this.scene.start('Result', {
        score,
        bestCombo: this.scoreSys.bestCombo,
        grabs: this.grabsTotal,
        reason,
        levelId: this.level?.id,
        stars,
        coins,
      });
    });
  }
}

function distanceToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Phaser.Math.Distance.Between(px, py, x1, y1);
  const t = Phaser.Math.Clamp(((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy), 0, 1);
  return Phaser.Math.Distance.Between(px, py, x1 + t * dx, y1 + t * dy);
}
