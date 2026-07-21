import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { addSoundToggle, addText, coverBackground, DESIGN_HEIGHT, metrics } from '../config/layout';
import { Chopsticks } from '../entities/Chopsticks';
import { SushiPiece } from '../entities/Sushi';
import { audio } from '../systems/AudioSystem';
import { ComboSystem } from '../systems/ComboSystem';
import { FeverSystem } from '../systems/FeverSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import { Spawner } from '../systems/Spawner';

interface TrailPoint {
  x: number;
  y: number;
  t: number;
}

const INK = '#4a2c20';
const CREAM = '#fff7ef';

export class PlayScene extends Phaser.Scene {
  private sushiGroup!: Phaser.Physics.Arcade.Group;
  private spawner!: Spawner;
  private chopsticks!: Chopsticks;
  private scoreSys = new ScoreSystem();
  private comboSys = new ComboSystem();
  private feverSys = new FeverSystem();

  private hearts: number = BALANCE.hearts;
  private timeLeft: number = BALANCE.shiftSeconds;
  private grabsTotal = 0;
  private ended = false;
  private swiping = false;
  private trail: TrailPoint[] = [];

  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private heartIcons: Phaser.GameObjects.Image[] = [];
  private feverBarFill!: Phaser.GameObjects.Rectangle;
  private feverBarWidth = 144;
  private feverOverlay!: Phaser.GameObjects.Rectangle;
  private sparkles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private goldBurst!: Phaser.GameObjects.Particles.ParticleEmitter;
  private trailGfx!: Phaser.GameObjects.Graphics;

  constructor() {
    super('Play');
  }

  create(): void {
    const { W, H, cx, s } = metrics(this);

    this.ended = false;
    this.hearts = BALANCE.hearts;
    this.timeLeft = BALANCE.shiftSeconds;
    this.grabsTotal = 0;
    this.scoreSys.reset();
    this.comboSys.reset();
    this.feverSys.reset();
    this.trail = [];
    this.swiping = false;
    this.time.timeScale = 1;
    this.tweens.timeScale = 1;
    this.physics.world.timeScale = 1;

    coverBackground(this);

    this.add
      .particles(0, 0, 'fx_petal', {
        x: { min: 0, max: W },
        y: -20,
        lifespan: 9000,
        speedY: { min: 28 * s, max: 60 * s },
        speedX: { min: -18, max: 18 },
        rotate: { start: 0, end: 360 },
        scale: { min: 0.5 * s, max: 0.9 * s },
        alpha: { start: 0.85, end: 0.3 },
        frequency: Math.max(350, 900 / (W / 390)),
      })
      .setDepth(2);

    this.physics.world.gravity.y = BALANCE.gravity * (H / DESIGN_HEIGHT);

    this.sushiGroup = this.physics.add.group();
    this.spawner = new Spawner(this, this.sushiGroup);
    this.chopsticks = new Chopsticks(this);
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
      tint: [0xffd75e, 0xff8aa8, 0x8fd36a, 0x7ec8ff],
      emitting: false,
    });
    this.goldBurst.setDepth(30);

    this.feverOverlay = this.add.rectangle(cx, H / 2, W, H, 0xffd75e, 0).setDepth(3);

    this.buildHud();
    this.bindInput();

    audio.startBgm();
    this.cameras.main.fadeIn(300, 255, 233, 214);

    const ready = addText(this, cx, H * 0.42, "IT'S SUSHI SEASON!", {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(38 * s)}px`,
      color: '#ff7a45',
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

  update(_time: number, delta: number): void {
    if (this.ended) return;

    this.timeLeft -= delta / 1000;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.endRound('what a delicious season!');
      return;
    }

    const progress = 1 - this.timeLeft / BALANCE.shiftSeconds;
    this.spawner.update(delta, progress);
    this.comboSys.tick(this.time.now);
    if (this.feverSys.tick(delta)) this.endFever();
    this.refreshHud();
    this.cullMissed();
    this.drawTrail();
  }

  // ---------- HUD ----------

  private buildHud(): void {
    const { W, cx, s } = metrics(this);
    const topY = 34 * s;

    this.add.image(24 * s + 75 * s, topY, 'ui_pill').setDepth(50).setDisplaySize(150 * s, 46 * s);
    this.scoreText = addText(this, 24 * s + 75 * s, topY - 1, '0', {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(26 * s)}px`,
      color: INK,
    })
      .setOrigin(0.5)
      .setDepth(51);

    this.add
      .image(W - 24 * s - 48 * s, topY, 'ui_pill')
      .setDepth(50)
      .setDisplaySize(96 * s, 46 * s);
    this.timerText = addText(this, W - 24 * s - 48 * s, topY - 1, `${BALANCE.shiftSeconds}`, {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(26 * s)}px`,
      color: INK,
    })
      .setOrigin(0.5)
      .setDepth(51);

    this.heartIcons = [];
    for (let i = 0; i < BALANCE.hearts; i++) {
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
    addText(this, W - 24 * s - this.feverBarWidth / 2, 78 * s, 'FEVER', {
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
      color: '#ff5e6c',
      stroke: CREAM,
      strokeThickness: 8,
    })
      .setOrigin(0.5)
      .setDepth(52);

    addSoundToggle(this, cx, topY, s * 0.82, () => audio.isMuted(), () => audio.toggleMute());
  }

  private refreshHud(): void {
    this.scoreText.setText(String(this.scoreSys.score));
    this.timerText.setText(String(Math.ceil(this.timeLeft)));
    this.timerText.setColor(this.timeLeft <= 10 ? '#ff5e6c' : INK);
    this.heartIcons.forEach((h, i) => h.setAlpha(i < this.hearts ? 1 : 0.2));
    this.feverBarFill.width = this.feverBarWidth * this.feverSys.charge;
    this.feverBarFill.setFillStyle(this.feverSys.active ? 0xff5e6c : 0xffb02e);

    const combo = this.comboSys.combo;
    if (combo >= 2) {
      if (this.comboText.text !== `x${combo}`) {
        this.comboText.setText(`x${combo}`);
        this.comboText.setScale(1.5);
        this.tweens.add({ targets: this.comboText, scale: 1, duration: 180, ease: 'Back.easeOut' });
      }
    } else if (this.comboText.text !== '') {
      this.comboText.setText('');
    }
  }

  // ---------- input & grabbing ----------

  private bindInput(): void {
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.ended) return;
      this.swiping = true;
      this.trail = [{ x: p.x, y: p.y, t: this.time.now }];
      this.chopsticks.beginFollow(p.x, p.y);
      audio.unlock();
    });

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.swiping || this.ended) return;
      const prev = this.trail[this.trail.length - 1];
      this.trail.push({ x: p.x, y: p.y, t: this.time.now });
      if (this.trail.length > 14) this.trail.shift();

      const angle = prev ? Phaser.Math.Angle.Between(prev.x, prev.y, p.x, p.y) : 0;
      this.chopsticks.followPointer(p.x, p.y, angle);
      if (prev) this.tryGrab(prev.x, prev.y, p.x, p.y, prev.t);
    });

    this.input.on('pointerup', () => this.endSwipe());
    this.input.on('pointerupoutside', () => this.endSwipe());
  }

  private endSwipe(): void {
    if (!this.swiping) return;
    this.swiping = false;
    this.chopsticks.endFollow();
    this.trail = [];
    this.trailGfx.clear();
  }

  private drawTrail(): void {
    const { s } = metrics(this);
    this.trailGfx.clear();
    if (this.trail.length < 2) return;
    const feverTint = this.feverSys.active;
    for (let i = 1; i < this.trail.length; i++) {
      const a = this.trail[i - 1];
      const b = this.trail[i];
      const p = i / this.trail.length;
      const color = feverTint
        ? Phaser.Display.Color.HSLToColor((this.time.now / 600 + p) % 1, 0.9, 0.65).color
        : 0xffb089;
      this.trailGfx.lineStyle(10 * p * s, color, 0.28 + 0.5 * p);
      this.trailGfx.lineBetween(a.x, a.y, b.x, b.y);
    }
  }

  private tryGrab(x1: number, y1: number, x2: number, y2: number, t0: number): void {
    const { s } = metrics(this);
    const dt = Math.max(16, this.time.now - t0);
    const speed = (Phaser.Math.Distance.Between(x1, y1, x2, y2) / dt) * 1000;
    if (speed < BALANCE.minSwipeSpeed * s) return;

    for (const piece of this.sushiGroup.getChildren() as SushiPiece[]) {
      if (!piece.active || piece.grabbed) continue;
      if (distanceToSegment(piece.x, piece.y, x1, y1, x2, y2) <= piece.getHitRadius()) {
        this.resolveGrab(piece);
      }
    }
  }

  private resolveGrab(piece: SushiPiece): void {
    piece.markGrabbed();
    this.chopsticks.snap();

    if (piece.def.isBomb) {
      audio.bomb();
      this.comboSys.breakCombo();
      this.feverSys.punish();
      this.loseHeart();
      this.cameras.main.shake(200, 0.014);
      this.hitStop(140);
      piece.setTint(0x9dff5e);
      this.sparkles.emitParticleAt(piece.x, piece.y, 8);
      piece.playCatchJuice();
      this.floatText(piece.x, piece.y, 'WASABI!!', '#5aa832', 30);
      return;
    }

    this.grabsTotal += 1;
    const combo = this.comboSys.registerGrab(this.time.now);
    const mult = this.feverSys.active ? BALANCE.feverScoreMultiplier : 1;
    const gained = this.scoreSys.addPoints(piece.def.points * mult, combo);

    if (piece.def.isBonus) {
      audio.golden();
      this.goldBurst.emitParticleAt(piece.x, piece.y, 22);
      this.hitStop(110);
      this.cameras.main.flash(150, 255, 215, 94);
    } else {
      audio.grab(combo);
      this.sparkles.emitParticleAt(piece.x, piece.y, combo >= 4 ? 14 : 8);
    }

    if (combo >= 4 && combo % 4 === 0) {
      audio.combo();
      this.chopsticks.cheer();
      this.cameras.main.shake(90, 0.005);
    }

    piece.playCatchJuice();
    this.floatText(
      piece.x,
      piece.y - 24,
      `+${gained}`,
      piece.def.isBonus ? '#e6a800' : this.feverSys.active ? '#ff5e6c' : INK,
      piece.def.isBonus ? 30 : 24,
    );

    if (this.feverSys.addGrab()) this.startFever();
  }

  // ---------- fever ----------

  private startFever(): void {
    const { cx, H } = metrics(this);
    this.spawner.feverMode = true;
    audio.fever();
    this.cameras.main.flash(240, 255, 180, 90);
    this.cameras.main.shake(140, 0.008);
    this.feverOverlay.setFillStyle(0xffd75e, 0.1);
    this.tweens.add({
      targets: this.feverOverlay,
      fillAlpha: { from: 0.16, to: 0.06 },
      duration: 420,
      yoyo: true,
      repeat: -1,
    });

    const banner = addText(this, cx, H * 0.36, 'FEVER TIME!', {
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: `${Math.round(46 * metrics(this).s)}px`,
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
    this.goldBurst.emitParticleAt(cx, H * 0.36, 30);
  }

  private endFever(): void {
    this.spawner.feverMode = false;
    this.tweens.killTweensOf(this.feverOverlay);
    this.feverOverlay.setFillStyle(0xffd75e, 0);
  }

  // ---------- feel ----------

  private hitStop(ms: number): void {
    this.physics.world.timeScale = 3;
    this.time.delayedCall(ms, () => {
      this.physics.world.timeScale = 1;
    });
  }

  private cullMissed(): void {
    const { W, H, s } = metrics(this);
    for (const piece of this.sushiGroup.getChildren() as SushiPiece[]) {
      if (!piece.active || piece.grabbed) continue;
      const body = piece.body as Phaser.Physics.Arcade.Body;
      const falling = body.velocity.y > 40;
      if ((falling && piece.y > H + 70 * s) || piece.x < -110 * s || piece.x > W + 110 * s) {
        if (!piece.def.isBomb && !this.feverSys.active) {
          audio.miss();
          this.loseHeart();
          this.comboSys.breakCombo();
          this.floatText(
            Phaser.Math.Clamp(piece.x, 40, W - 40),
            H - 90 * s,
            'miss...',
            '#8a5a48',
            20,
          );
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
    this.cameras.main.flash(130, 255, 120, 120);
    if (this.hearts <= 0) {
      this.hearts = 0;
      this.endRound('sushi season is over...');
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

    this.time.delayedCall(500, () => {
      this.scene.start('Result', {
        score: this.scoreSys.score,
        bestCombo: this.scoreSys.bestCombo,
        grabs: this.grabsTotal,
        reason,
      });
    });
  }
}

function distanceToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Phaser.Math.Distance.Between(px, py, x1, y1);
  const t = Phaser.Math.Clamp(((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy), 0, 1);
  return Phaser.Math.Distance.Between(px, py, x1 + t * dx, y1 + t * dy);
}
