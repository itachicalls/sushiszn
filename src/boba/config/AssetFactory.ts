import Phaser from 'phaser';

/** Small procedural FX/UI textures. Character art is loaded from PNGs. */
export function generateFxTextures(scene: Phaser.Scene): void {
  const gfx = () => new Phaser.GameObjects.Graphics(scene);

  {
    const g = gfx();
    for (let i = 8; i >= 1; i--) {
      g.fillStyle(0xffffff, 0.04 + (8 - i) * 0.012);
      g.fillCircle(64, 64, i * 8);
    }
    g.generateTexture('fx_glow', 128, 128);
    g.destroy();
  }

  {
    const g = gfx();
    g.fillStyle(0xfff1a8, 1);
    g.beginPath();
    g.moveTo(12, 0);
    g.lineTo(15, 9);
    g.lineTo(24, 12);
    g.lineTo(15, 15);
    g.lineTo(12, 24);
    g.lineTo(9, 15);
    g.lineTo(0, 12);
    g.lineTo(9, 9);
    g.closePath();
    g.fillPath();
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(12, 12, 3);
    g.generateTexture('fx_sparkle', 24, 24);
    g.destroy();
  }

  {
    const g = gfx();
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(10, 10, 8);
    g.lineStyle(2, 0xffffff, 0.95);
    g.strokeCircle(10, 10, 7);
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(7, 7, 1.6);
    g.generateTexture('fx_bubble', 20, 20);
    g.destroy();
  }

  {
    const g = gfx();
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 10, 10);
    g.generateTexture('fx_confetti', 10, 10);
    g.destroy();
  }

  {
    const g = gfx();
    const cx = 26;
    const cy = 26;
    const spikes = 5;
    const outer = 22;
    const inner = 9.5;
    const pts: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (Math.PI / spikes) * i - Math.PI / 2;
      pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
    g.fillStyle(0xffffff, 1);
    g.beginPath();
    g.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
    g.closePath();
    g.fillPath();
    g.lineStyle(2.5, 0xd4926a, 1);
    g.strokePath();
    g.generateTexture('ui_star', 52, 52);
    g.destroy();
  }

  {
    const g = gfx();
    g.fillStyle(0xd7b4a4, 0.35);
    g.fillCircle(32, 34, 24);
    g.fillStyle(0xfffbf7, 0.96);
    g.fillCircle(30, 28, 24);
    g.lineStyle(2.5, 0xe7b8a4, 1);
    g.strokeCircle(30, 28, 24);
    g.fillStyle(0xffffff, 0.7);
    g.fillEllipse(24, 20, 12, 6);
    g.generateTexture('ui_round', 60, 60);
    g.destroy();
  }

  {
    const g = gfx();
    g.fillStyle(0xd7b4a4, 0.28);
    g.fillRoundedRect(8, 10, 84, 82, 26);
    g.fillStyle(0xfffbf7, 0.97);
    g.fillRoundedRect(4, 4, 86, 84, 26);
    g.lineStyle(2.5, 0xe7b8a4, 1);
    g.strokeRoundedRect(4, 4, 86, 84, 26);
    g.generateTexture('ui_node', 96, 96);
    g.destroy();
  }

  {
    const g = gfx();
    g.fillStyle(0xd7b4a4, 0.32);
    g.fillRoundedRect(10, 12, 222, 56, 28);
    g.fillStyle(0xfffbf7, 1);
    g.fillRoundedRect(4, 3, 228, 60, 28);
    g.lineStyle(2.5, 0xe7b8a4, 1);
    g.strokeRoundedRect(4, 3, 228, 60, 28);
    g.fillStyle(0xffffff, 0.65);
    g.fillRoundedRect(28, 12, 72, 8, 4);
    g.generateTexture('ui_btn', 240, 72);
    g.destroy();
  }

  {
    const g = gfx();
    g.fillStyle(0xd7b4a4, 0.3);
    g.fillRoundedRect(6, 8, 150, 36, 18);
    g.fillStyle(0xfffbf7, 0.96);
    g.fillRoundedRect(3, 2, 152, 38, 18);
    g.lineStyle(2.5, 0xe7b8a4, 1);
    g.strokeRoundedRect(3, 2, 152, 38, 18);
    g.generateTexture('ui_pill', 160, 48);
    g.destroy();
  }

  {
    const g = gfx();
    g.fillStyle(0xd7b4a4, 0.22);
    g.fillRoundedRect(10, 12, 304, 220, 32);
    g.fillStyle(0xfffbf7, 0.97);
    g.fillRoundedRect(4, 4, 308, 224, 32);
    g.lineStyle(2.5, 0xe7b8a4, 1);
    g.strokeRoundedRect(4, 4, 308, 224, 32);
    g.generateTexture('ui_panel', 320, 240);
    g.destroy();
  }
}
