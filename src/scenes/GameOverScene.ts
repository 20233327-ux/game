import Phaser from 'phaser';
import { GameManager } from '../managers/GameManager';
import { WIN_ENDING_LINES, LOSE_QUOTES } from '../utils/StoryData';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: { win?: boolean }): void {
    const W = this.cameras.main.width;   // 800
    const H = this.cameras.main.height;  // 600
    const gm = GameManager.getInstance();
    const win = !!data.win;

    // ── Background ──
    this.add.graphics().fillStyle(0x000000, 0.92).fillRect(0, 0, W, H);

    // Scanlines
    const scan = this.add.graphics();
    scan.lineStyle(1, win ? 0x001111 : 0x110000, 0.12);
    for (let y = 0; y < H; y += 3) scan.lineBetween(0, y, W, y);

    if (win) {
      // ════════════════════════════════════════════════════
      // WIN SCREEN — Ending story typewriter
      // ════════════════════════════════════════════════════
      this.add.text(W / 2, 34, 'THOÁT KHỎI!', {
        fontSize: '42px', color: '#00ffcc', fontFamily: 'Courier New',
        stroke: '#003333', strokeThickness: 4,
      }).setOrigin(0.5);

      this.add.text(W / 2, 78, '— Mê Cung Vĩnh Âm đã bị phá vỡ —', {
        fontSize: '13px', color: '#336655', fontFamily: 'Courier New',
      }).setOrigin(0.5);

      this.add.graphics().lineStyle(1, 0x003333, 0.5)
        .lineBetween(40, 98, W - 40, 98);

      // Story ending text with typewriter
      const storyBg = this.add.graphics();
      storyBg.fillStyle(0x001122, 0.75);
      storyBg.fillRect(80, 108, W - 160, 260);
      storyBg.lineStyle(1, 0x004455, 0.6);
      storyBg.strokeRect(80, 108, W - 160, 260);

      this.add.text(94, 118, '◈ KẾT THÚC', {
        fontSize: '10px', color: '#00aacc', fontFamily: 'Courier New', fontStyle: 'bold',
      });

      WIN_ENDING_LINES.forEach((line, i) => {
        const color = line.startsWith('★') ? '#ffd700' : line === '' ? '#000000' : '#aaccdd';
        const t = this.add.text(W / 2, 138 + i * 22, line, {
          fontSize: '14px', color, fontFamily: 'Courier New', align: 'center',
        }).setOrigin(0.5, 0).setAlpha(0);
        this.tweens.add({ targets: t, alpha: 1, duration: 250, delay: 300 + i * 280 });
      });

      // Stars particle effect (simple)
      for (let s = 0; s < 12; s++) {
        const sx = Phaser.Math.Between(60, W - 60);
        const sy = Phaser.Math.Between(110, 360);
        const star = this.add.text(sx, sy, '★', {
          fontSize: `${Phaser.Math.Between(10, 20)}px`, color: '#ffd700',
        }).setAlpha(0);
        this.tweens.add({
          targets: star, alpha: 0.6, y: sy - 20,
          duration: 800 + s * 200, delay: 1000 + s * 300,
          ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
        });
      }

      this.add.graphics().lineStyle(1, 0x003333, 0.5)
        .lineBetween(40, 382, W - 40, 382);

      this.add.text(W / 2, 396, `Điểm số: ${gm.score}`, {
        fontSize: '22px', color: '#ffd700', fontFamily: 'Courier New',
      }).setOrigin(0.5);

      this.add.text(W / 2, 424, `Kỷ lục: ${gm.highScore}`, {
        fontSize: '16px', color: '#aa8800', fontFamily: 'Courier New',
      }).setOrigin(0.5);

      if (gm.score >= gm.highScore && gm.score > 0) {
        const newRecord = this.add.text(W / 2, 450, '★  KỶ LỤC MỚI!  ★', {
          fontSize: '18px', color: '#ffffff', fontFamily: 'Courier New',
        }).setOrigin(0.5);
        this.tweens.add({ targets: newRecord, alpha: 0.3, duration: 550, yoyo: true, repeat: -1 });
      }

    } else {
      // ════════════════════════════════════════════════════
      // LOSE SCREEN
      // ════════════════════════════════════════════════════
      this.add.text(W / 2, 80, 'GAME OVER', {
        fontSize: '52px', color: '#ff3333', fontFamily: 'Courier New',
        stroke: '#330000', strokeThickness: 4,
      }).setOrigin(0.5);

      this.add.text(W / 2, 134, `— Tầng ${gm.currentLevel} · Điểm: ${gm.score} —`, {
        fontSize: '14px', color: '#554444', fontFamily: 'Courier New',
      }).setOrigin(0.5);

      this.add.graphics().lineStyle(1, 0x330000, 0.5)
        .lineBetween(40, 155, W - 40, 155);

      // Random flavour quote
      const quote = LOSE_QUOTES[Math.floor(Math.random() * LOSE_QUOTES.length)];
      const quoteBg = this.add.graphics();
      quoteBg.fillStyle(0x1a0000, 0.70);
      quoteBg.fillRect(80, 168, W - 160, 56);
      quoteBg.lineStyle(1, 0x440000, 0.6);
      quoteBg.strokeRect(80, 168, W - 160, 56);

      this.add.text(W / 2, 196, quote, {
        fontSize: '13px', color: '#aa5555', fontFamily: 'Courier New',
        align: 'center', wordWrap: { width: W - 200 },
      }).setOrigin(0.5);

      // Hint text per level
      const hint = gm.currentLevel <= 1
        ? 'Kai chưa kịp rời khỏi lối vào...'
        : gm.currentLevel <= 2
          ? 'Mê cung tầng 2 đã quá sức...'
          : `Kai đã đến được tầng ${gm.currentLevel} — không phải ai cũng làm được.`;
      this.add.text(W / 2, 250, hint, {
        fontSize: '13px', color: '#554433', fontFamily: 'Courier New', align: 'center',
      }).setOrigin(0.5);

      this.add.graphics().lineStyle(1, 0x330000, 0.5)
        .lineBetween(40, 290, W - 40, 290);

      this.add.text(W / 2, 308, `Điểm số: ${gm.score}`, {
        fontSize: '24px', color: '#cc4444', fontFamily: 'Courier New',
      }).setOrigin(0.5);

      this.add.text(W / 2, 340, `Kỷ lục: ${gm.highScore}`, {
        fontSize: '16px', color: '#884444', fontFamily: 'Courier New',
      }).setOrigin(0.5);

      if (gm.score >= gm.highScore && gm.score > 0) {
        const newRecord = this.add.text(W / 2, 368, '★  KỶ LỤC MỚI!  ★', {
          fontSize: '16px', color: '#ffaaaa', fontFamily: 'Courier New',
        }).setOrigin(0.5);
        this.tweens.add({ targets: newRecord, alpha: 0.3, duration: 550, yoyo: true, repeat: -1 });
      }
    }

    // ── Shared restart button ──
    const btnY = win ? 510 : 450;
    const restartBtn = this.add.text(W / 2, btnY, '[ CHƠI LẠI ]', {
      fontSize: '24px', color: '#ffffff', fontFamily: 'Courier New',
      backgroundColor: '#1a1a1a', padding: { x: 18, y: 9 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.tweens.add({ targets: restartBtn, alpha: 0.25, duration: 650, yoyo: true, repeat: -1 });

    const goMenu = () => {
      this.scene.stop('UIScene');
      this.scene.stop('GameOverScene');
      this.scene.start('MenuScene');
    };
    restartBtn.on('pointerdown', goMenu);
    this.input.keyboard!.on('keydown-SPACE', goMenu);
  }
}
