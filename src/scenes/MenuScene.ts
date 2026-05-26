import Phaser from 'phaser';
import { GameManager } from '../managers/GameManager';
import { STORY_INTRO_LINES } from '../utils/StoryData';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const W = this.cameras.main.width;   // 800
    const H = this.cameras.main.height;  // 600
    const gm = GameManager.getInstance();

    // ── Background ──
    this.add.graphics().fillStyle(0x000000).fillRect(0, 0, W, H);

    // Subtle scanlines
    const scan = this.add.graphics();
    scan.lineStyle(1, 0x001111, 0.14);
    for (let y = 0; y < H; y += 3) scan.lineBetween(0, y, W, y);

    // ── Title ──
    this.add.text(W / 2, 36, 'ECHO DUNGEON', {
      fontSize: '46px', color: '#00ffcc', fontFamily: 'Courier New',
      stroke: '#003333', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(W / 2, 82, '— Nhìn bằng âm thanh. Sống bằng tiếng vọng. —', {
      fontSize: '13px', color: '#336655', fontFamily: 'Courier New',
    }).setOrigin(0.5);

    // Horizontal rule
    this.add.graphics().lineStyle(1, 0x003333, 0.55)
      .lineBetween(30, 100, W - 30, 100);

    // ════════════════════════════════════════════════════
    // LEFT PANEL: Nhật ký Kai (story intro)
    // ════════════════════════════════════════════════════
    const LX = 18, LY = 110, LW = 370, LH = 310;
    const leftPanel = this.add.graphics();
    leftPanel.fillStyle(0x001122, 0.72);
    leftPanel.fillRect(LX, LY, LW, LH);
    leftPanel.lineStyle(1, 0x004466, 0.7);
    leftPanel.strokeRect(LX, LY, LW, LH);

    this.add.text(LX + 10, LY + 8, '◈ NHẬT KÝ KAI', {
      fontSize: '10px', color: '#00aacc', fontFamily: 'Courier New', fontStyle: 'bold',
    });
    this.add.graphics().lineStyle(1, 0x003355, 0.5)
      .lineBetween(LX + 8, LY + 22, LX + LW - 8, LY + 22);

    // Typewriter reveal of story lines
    STORY_INTRO_LINES.forEach((line, i) => {
      const t = this.add.text(LX + 12, LY + 30 + i * 19, line, {
        fontSize: '12px', color: line.startsWith('⚠') ? '#ff6633' : '#557788',
        fontFamily: 'Courier New', wordWrap: { width: LW - 24 },
      }).setAlpha(0);
      this.tweens.add({ targets: t, alpha: 1, duration: 180, delay: 300 + i * 250 });
    });

    // ════════════════════════════════════════════════════
    // RIGHT PANEL TOP: Controls
    // ════════════════════════════════════════════════════
    const RX = 406, RY = 110, RW = 378;
    const ctrlPanel = this.add.graphics();
    ctrlPanel.fillStyle(0x000d11, 0.75);
    ctrlPanel.fillRect(RX, RY, RW, 168);
    ctrlPanel.lineStyle(1, 0x003344, 0.65);
    ctrlPanel.strokeRect(RX, RY, RW, 168);

    this.add.text(RX + 10, RY + 8, '◈ ĐIỀU KHIỂN', {
      fontSize: '10px', color: '#00aacc', fontFamily: 'Courier New', fontStyle: 'bold',
    });
    this.add.graphics().lineStyle(1, 0x003355, 0.5)
      .lineBetween(RX + 8, RY + 22, RX + RW - 8, RY + 22);

    const controls: [string, string][] = [
      ['WASD',  'Di chuyển'],
      ['LMB',   'Bắn (phát sóng Echo)'],
      ['E',     'Chém cận chiến'],
      ['Q',     'Echo Blast  (tốn Mana)'],
      ['SHIFT', 'Dash'],
      ['1 – 4', 'Đổi vũ khí'],
    ];
    controls.forEach(([key, desc], i) => {
      this.add.text(RX + 12, RY + 30 + i * 21, key, {
        fontSize: '12px', color: '#00ddff', fontFamily: 'Courier New', fontStyle: 'bold',
      });
      this.add.text(RX + 62, RY + 30 + i * 21, `— ${desc}`, {
        fontSize: '12px', color: '#778899', fontFamily: 'Courier New',
      });
    });

    // ════════════════════════════════════════════════════
    // RIGHT PANEL BOTTOM: Objectives
    // ════════════════════════════════════════════════════
    const OY = RY + 178;
    const objPanel = this.add.graphics();
    objPanel.fillStyle(0x0d0800, 0.75);
    objPanel.fillRect(RX, OY, RW, 148);
    objPanel.lineStyle(1, 0x332200, 0.65);
    objPanel.strokeRect(RX, OY, RW, 148);

    this.add.text(RX + 10, OY + 8, '◈ MỤC TIÊU', {
      fontSize: '10px', color: '#ffaa00', fontFamily: 'Courier New', fontStyle: 'bold',
    });
    this.add.graphics().lineStyle(1, 0x332200, 0.5)
      .lineBetween(RX + 8, OY + 22, RX + RW - 8, OY + 22);

    const objectives = [
      '• Thu thập KEY trong mỗi tầng',
      '• Tiêu diệt BOSS để mở lối thoát',
      '• Đến EXIT để xuống tầng tiếp theo',
      '• Mana hồi phục theo thời gian',
      '• Vũ khí mới rơi ra từ quái vật',
    ];
    objectives.forEach((obj, i) => {
      this.add.text(RX + 12, OY + 30 + i * 22, obj, {
        fontSize: '11px', color: '#997744', fontFamily: 'Courier New',
      });
    });

    // ════════════════════════════════════════════════════
    // BOTTOM BAR
    // ════════════════════════════════════════════════════
    this.add.graphics().lineStyle(1, 0x003333, 0.5)
      .lineBetween(30, 434, W - 30, 434);

    this.add.text(W / 2, 450, `HIGH SCORE: ${gm.highScore}`, {
      fontSize: '18px', color: '#ffd700', fontFamily: 'Courier New',
    }).setOrigin(0.5);

    // Start button
    const startBtn = this.add.text(W / 2, 502, '[ NHẤN SPACE ĐỂ BẮT ĐẦU ]', {
      fontSize: '22px', color: '#ffffff', fontFamily: 'Courier New',
      backgroundColor: '#002233', padding: { x: 18, y: 9 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.tweens.add({ targets: startBtn, alpha: 0.22, duration: 700, yoyo: true, repeat: -1 });

    // Tiny lore tag at bottom-right
    this.add.text(W - 8, H - 6, 'ECHO DUNGEON  v1.0', {
      fontSize: '9px', color: '#1a2a2a', fontFamily: 'Courier New',
    }).setOrigin(1, 1);

    // Also show "TẦNG 1 — LỐI VÀO BÓNG TỐI" as a small tagline at bottom
    this.add.text(W / 2, H - 12, '5 tầng · Boss mỗi tầng · Lời nguyền mê cung Vĩnh Âm', {
      fontSize: '10px', color: '#223344', fontFamily: 'Courier New',
    }).setOrigin(0.5, 1);

    const startGame = () => {
      gm.reset();
      this.scene.start('GameScene');
      this.scene.start('UIScene');
    };
    startBtn.on('pointerdown', startGame);
    this.input.keyboard!.on('keydown-SPACE', startGame);
  }
}
