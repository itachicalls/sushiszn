import Phaser from 'phaser';

/** Small procedural FX/UI textures; all character art is loaded from PNGs. */
export function generateFxTextures(scene: Phaser.Scene): void {
  const gfx = () => new Phaser.GameObjects.Graphics(scene);

  // soft radial glow
  {
    const g = gfx();
    for (let i = 8; i >= 1; i--) {
      g.fillStyle(0xffffff, 0.04 + (8 - i) * 0.012);
      g.fillCircle(64, 64, i * 8);
    }
    g.generateTexture('fx_glow', 128, 128);
    g.destroy();
  }

  // sparkle: 4-point star
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

  // trail dot
  {
    const g = gfx();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(12, 12, 10);
    g.generateTexture('fx_dot', 24, 24);
    g.destroy();
  }

  // sakura petal
  {
    const g = gfx();
    g.fillStyle(0xffc2d1, 0.9);
    g.fillEllipse(10, 8, 16, 11);
    g.fillStyle(0xffdde6, 0.9);
    g.fillEllipse(8, 6, 8, 5);
    g.generateTexture('fx_petal', 20, 16);
    g.destroy();
  }

  // confetti squares (tinted at emit time)
  {
    const g = gfx();
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 10, 10);
    g.generateTexture('fx_confetti', 10, 10);
    g.destroy();
  }

  // heart
  {
    const g = gfx();
    g.fillStyle(0xff5e6c, 1);
    g.fillCircle(15, 14, 10);
    g.fillCircle(29, 14, 10);
    g.fillTriangle(5.5, 19, 38.5, 19, 22, 40);
    g.lineStyle(3.5, 0x5a2430, 1);
    g.strokeCircle(15, 14, 10);
    g.strokeCircle(29, 14, 10);
    g.fillStyle(0xffb3bb, 0.9);
    g.fillEllipse(13, 11, 7, 5);
    g.generateTexture('ui_heart', 44, 44);
    g.destroy();
  }

  // 5-point star (white + outline; tint gold for earned, gray for empty)
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
    g.lineStyle(3.5, 0x4a2c20, 1);
    g.strokePath();
    g.generateTexture('ui_star', 52, 52);
    g.destroy();
  }

  // round chip (pause button base / level node)
  {
    const g = gfx();
    g.fillStyle(0xfff7ef, 0.95);
    g.fillCircle(30, 30, 26);
    g.lineStyle(4.5, 0x4a2c20, 1);
    g.strokeCircle(30, 30, 26);
    g.generateTexture('ui_round', 60, 60);
    g.destroy();
  }

  // rounded square node (level select)
  {
    const g = gfx();
    g.fillStyle(0xfff7ef, 0.96);
    g.fillRoundedRect(3, 3, 90, 90, 24);
    g.lineStyle(5, 0x4a2c20, 1);
    g.strokeRoundedRect(3, 3, 90, 90, 24);
    g.generateTexture('ui_node', 96, 96);
    g.destroy();
  }

  // rounded button (cream + dark outline), tint for variants
  {
    const g = gfx();
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(3, 3, 234, 66, 26);
    g.lineStyle(5, 0x4a2c20, 1);
    g.strokeRoundedRect(3, 3, 234, 66, 26);
    g.generateTexture('ui_btn', 240, 72);
    g.destroy();
  }

  // HUD pill
  {
    const g = gfx();
    g.fillStyle(0xfff7ef, 0.92);
    g.fillRoundedRect(2, 2, 156, 44, 22);
    g.lineStyle(4, 0x4a2c20, 1);
    g.strokeRoundedRect(2, 2, 156, 44, 22);
    g.generateTexture('ui_pill', 160, 48);
    g.destroy();
  }

  // panel
  {
    const g = gfx();
    g.fillStyle(0xfff7ef, 0.96);
    g.fillRoundedRect(3, 3, 314, 234, 30);
    g.lineStyle(6, 0x4a2c20, 1);
    g.strokeRoundedRect(3, 3, 314, 234, 30);
    g.generateTexture('ui_panel', 320, 240);
    g.destroy();
  }
}
