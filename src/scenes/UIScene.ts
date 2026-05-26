import Phaser from 'phaser';
import { GameManager } from '../managers/GameManager';

export class UIScene extends Phaser.Scene {
  private healthBar!: Phaser.GameObjects.Graphics;
  private dashBar!: Phaser.GameObjects.Graphics;
  private healthText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private keysText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private dashLabel!: Phaser.GameObjects.Text;
  private weaponSlotsGfx!: Phaser.GameObjects.Graphics;
  private weaponSlotTexts: Phaser.GameObjects.Text[] = [];
  private allyHudGfx!: Phaser.GameObjects.Graphics;
  private allyLabelTexts: Phaser.GameObjects.Text[] = [];
  private manaBar!: Phaser.GameObjects.Graphics;
  private skillE!: Phaser.GameObjects.Text;
  private skillQ!: Phaser.GameObjects.Text;
  private skillR!: Phaser.GameObjects.Text;
  private skillF!: Phaser.GameObjects.Text;
  private bossHpBg!: Phaser.GameObjects.Graphics;
  private bossHpFill!: Phaser.GameObjects.Graphics;
  private bossHpLabel!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    const gm = GameManager.getInstance();
    const W = this.cameras.main.width;

    // ── Top panel background ──
    const panel = this.add.graphics();
    panel.fillStyle(0x000000, 0.78);
    panel.fillRect(0, 0, W, 58);
    panel.lineStyle(1, 0x003344, 1);
    panel.lineBetween(0, 58, W, 58);

    // ── HP section ──
    this.add.text(10, 8, 'HP', {
      fontSize: '11px', color: '#88ffcc', fontFamily: 'Courier New', fontStyle: 'bold'
    });

    // HP bar bg
    this.add.graphics().fillStyle(0x330000).fillRect(30, 8, 164, 16);
    // HP bar fill (dynamic)
    this.healthBar = this.add.graphics();

    this.healthText = this.add.text(200, 8, '100', {
      fontSize: '13px', color: '#ffffff', fontFamily: 'Courier New'
    });

    // ── DASH section ──
    this.dashLabel = this.add.text(10, 30, 'DASH', {
      fontSize: '10px', color: '#00ddaa', fontFamily: 'Courier New', fontStyle: 'bold'
    });
    this.add.graphics().fillStyle(0x002222).fillRect(46, 32, 90, 10);
    this.dashBar = this.add.graphics();

    // ── Score ──
    this.scoreText = this.add.text(260, 8, 'SCORE  0', {
      fontSize: '14px', color: '#ffd700', fontFamily: 'Courier New'
    });

    // ── Level ──
    this.levelText = this.add.text(260, 28, 'LVL  1', {
      fontSize: '13px', color: '#00ffcc', fontFamily: 'Courier New'
    });

    // ── Keys ──
    this.keysText = this.add.text(440, 8, 'KEYS  0 / 1', {
      fontSize: '14px', color: '#ffaa00', fontFamily: 'Courier New'
    });

    // ── Hint bar at bottom ──
    this.hintText = this.add.text(W / 2, this.cameras.main.height - 8, '', {
      fontSize: '13px', color: '#aaffff', fontFamily: 'Courier New',
      backgroundColor: '#001122',
      padding: { x: 10, y: 4 }
    }).setOrigin(0.5, 1).setDepth(20);

    // ── Controls hint (fades out) ──
    const controlHint2 = this.add.text(W / 2, 10, 'WASD:Di ch.  LMB:Bắn  E:Chém(free)  Q:Nổ Âm(40)  R:Bùng Sóng(20)  F:Bước Tối(25)  SHIFT:Dash  1-4:Vũ khí', {
      fontSize: '10px', color: '#445566', fontFamily: 'Courier New'
    }).setOrigin(0.5, 0);
    this.tweens.add({ targets: controlHint2, alpha: 0, delay: 5000, duration: 1500 });

    // ── Weapon slots (right side of panel) ──
    this.weaponSlotsGfx = this.add.graphics();
    this.weaponSlotTexts = [];
    const SLOT_W = 50;
    const SLOT_START = W - (4 * SLOT_W + 3 * 4) - 6;
    const slotLabels = ['1\nPISTOL', '2\nSHOTGN', '3\nRIFLE', '4\nSMG'];
    for (let i = 0; i < 4; i++) {
      const sx = SLOT_START + i * (SLOT_W + 4);
      const t = this.add.text(sx + SLOT_W / 2, 29, slotLabels[i], {
        fontSize: '8px', color: '#1e1e2e', fontFamily: 'Courier New', align: 'center'
      }).setOrigin(0.5, 0.5).setLineSpacing(1);
      this.weaponSlotTexts.push(t);
    }

    // ── Ally HUD (below mana strip, at y=80+) ──
    this.allyHudGfx = this.add.graphics();
    this.allyLabelTexts = [];
    for (let i = 0; i < 2; i++) {
      const t = this.add.text(11, 82 + i * 21, `BOT${i + 1}`, {
        fontSize: '9px', color: '#0099dd', fontFamily: 'Courier New'
      }).setVisible(false);
      this.allyLabelTexts.push(t);
    }

    // ── Mana strip (y=58, height=20) ──
    const manaStripBg = this.add.graphics();
    manaStripBg.fillStyle(0x000d1a, 0.88);
    manaStripBg.fillRect(0, 58, W, 20);
    manaStripBg.lineStyle(1, 0x002244, 0.8);
    manaStripBg.lineBetween(0, 78, W, 78);
    this.add.text(8, 63, 'MANA', {
      fontSize: '9px', color: '#0088ff', fontFamily: 'Courier New', fontStyle: 'bold'
    });
    const manaBarBg = this.add.graphics();
    manaBarBg.fillStyle(0x001133, 1);
    manaBarBg.fillRect(44, 64, 90, 9);
    this.manaBar = this.add.graphics();
    // ── Skill slots: E / Q / R / F ──
    ([142, 187, 232, 277] as number[]).forEach(sx => {
      this.add.graphics().fillStyle(0x001111, 0.55).fillRect(sx, 60, 42, 14);
    });
    this.skillE = this.add.text(144, 62, 'E ✓', { fontSize: '9px', color: '#ff8833', fontFamily: 'Courier New' });
    this.skillQ = this.add.text(189, 62, 'Q ✓', { fontSize: '9px', color: '#00ddff', fontFamily: 'Courier New' });
    this.skillR = this.add.text(234, 62, 'R ✓', { fontSize: '9px', color: '#44bbff', fontFamily: 'Courier New' });
    this.skillF = this.add.text(279, 62, 'F ✓', { fontSize: '9px', color: '#aa66ff', fontFamily: 'Courier New' });

    // ── Boss HP bar (bottom of screen, hidden by default) ──
    const H = this.cameras.main.height;
    this.bossHpBg = this.add.graphics();
    this.bossHpBg.fillStyle(0x1a0000, 0.92);
    this.bossHpBg.fillRect(W / 2 - 180, H - 30, 360, 22);
    this.bossHpBg.lineStyle(2, 0xff2200, 0.9);
    this.bossHpBg.strokeRect(W / 2 - 180, H - 30, 360, 22);
    this.bossHpBg.setVisible(false);
    this.bossHpFill = this.add.graphics();
    this.bossHpFill.setVisible(false);
    this.bossHpLabel = this.add.text(W / 2, H - 37, '⚡ BOSS', {
      fontSize: '13px', color: '#ff4400', fontFamily: 'Courier New', fontStyle: 'bold'
    }).setOrigin(0.5, 1).setVisible(false);

    // ── Controls hint (fades out) ──
    this.cameras.main.setScroll(0, 0);
  }

  update(): void {
    const gm = GameManager.getInstance();

    // ── Health bar ──
    const hp = gm.health;
    const maxHp = gm.maxHealth;
    const barW = Math.max(0, (hp / maxHp) * 160);
    const hpColor = hp > 60 ? 0x00dd44 : hp > 30 ? 0xffaa00 : 0xff2200;
    this.healthBar.clear();
    this.healthBar.fillStyle(hpColor);
    this.healthBar.fillRect(32, 10, barW, 12);
    // Segmented ticks
    this.healthBar.lineStyle(1, 0x000000, 0.4);
    for (let i = 20; i < 160; i += 20) {
      this.healthBar.lineBetween(32 + i, 10, 32 + i, 22);
    }

    this.healthText.setText(String(hp));

    // ── Dash cooldown bar ──
    const gameScene = this.scene.get('GameScene') as any;
    const player = gameScene?.player;
    const dashRatio = player?.getDashCooldownRatio?.() ?? 1;
    this.dashBar.clear();
    const dashColor = dashRatio >= 1 ? 0x00ffaa : 0x005533;
    this.dashBar.fillStyle(dashColor);
    this.dashBar.fillRect(48, 34, Math.floor(dashRatio * 86), 6);
    this.dashLabel.setColor(dashRatio >= 1 ? '#00ffaa' : '#336655');

    // ── Texts ──
    this.scoreText.setText(`SCORE  ${gm.score}`);
    this.levelText.setText(`LVL  ${gm.currentLevel}`);
    this.keysText.setText(`KEYS  ${gm.keysCollected} / ${gm.keysRequired}`);

    // ── Bottom hint ──
    if (gm.isLevelComplete()) {
      this.hintText.setText('>> Tới EXIT (cổng xanh) để qua màn! <<')
        .setColor('#00ffcc');
    } else {
      const remaining = gm.keysRequired - gm.keysCollected;
      this.hintText.setText(`Tìm ${remaining} KEY còn lại`).setColor('#aaffff');
    }

    // ── Weapon slots ──
    const W = this.cameras.main.width;
    const ALL_WPN_IDS = ['pistol', 'shotgun', 'rifle', 'smg'];
    const SLW = 50;
    const SL_START = W - (4 * SLW + 3 * 4) - 6;
    this.weaponSlotsGfx.clear();
    const unlockedWeapons = (player?.getUnlockedWeapons?.() as any[]) ?? [];
    const currentWeapon = player?.getCurrentWeapon?.() as any;
    for (let i = 0; i < 4; i++) {
      const sx = SL_START + i * (SLW + 4);
      const wid = ALL_WPN_IDS[i];
      const isUnlocked = unlockedWeapons.some((w: any) => w.id === wid);
      const isCurrent = currentWeapon?.id === wid;
      if (isCurrent) {
        this.weaponSlotsGfx.fillStyle(0x003366, 1);
        this.weaponSlotsGfx.fillRect(sx, 5, SLW, 48);
        this.weaponSlotsGfx.lineStyle(2, 0x00ddff, 1);
        this.weaponSlotsGfx.strokeRect(sx, 5, SLW, 48);
        this.weaponSlotTexts[i]?.setColor('#00ddff');
      } else if (isUnlocked) {
        this.weaponSlotsGfx.fillStyle(0x001122, 1);
        this.weaponSlotsGfx.fillRect(sx, 5, SLW, 48);
        this.weaponSlotsGfx.lineStyle(1, 0x336688, 0.9);
        this.weaponSlotsGfx.strokeRect(sx, 5, SLW, 48);
        this.weaponSlotTexts[i]?.setColor('#5599bb');
      } else {
        this.weaponSlotsGfx.fillStyle(0x050508, 1);
        this.weaponSlotsGfx.fillRect(sx, 5, SLW, 48);
        this.weaponSlotsGfx.lineStyle(1, 0x181820, 0.6);
        this.weaponSlotsGfx.strokeRect(sx, 5, SLW, 48);
        this.weaponSlotTexts[i]?.setColor('#1e1e2e');
      }
    }

    // ── Ally HP bars ──
    this.allyHudGfx.clear();
    const alliesList = (gameScene?.allies as any[]) ?? [];
    const aliveAllies = alliesList.filter((a: any) => a && !a.isDead);
    for (let i = 0; i < 2; i++) {
      if (i < aliveAllies.length) {
        const ally = aliveAllies[i];
        const ay = 82 + i * 21;
        this.allyHudGfx.fillStyle(0x001833, 0.85);
        this.allyHudGfx.fillRect(6, ay, 148, 16);
        this.allyHudGfx.lineStyle(1, 0x0066aa, 0.9);
        this.allyHudGfx.strokeRect(6, ay, 148, 16);
        const hpRatio = Math.max(0, ally.health / ally.maxHealth);
        this.allyHudGfx.fillStyle(hpRatio > 0.5 ? 0x00bb77 : 0xff8800, 1);
        this.allyHudGfx.fillRect(42, ay + 3, Math.floor(hpRatio * 106), 10);
        this.allyLabelTexts[i]?.setVisible(true).setY(ay + 8);
      } else {
        this.allyLabelTexts[i]?.setVisible(false);
      }
    }

    // ── Mana bar ──
    const mana = player?.getMana?.() ?? 0;
    const maxMana = player?.getMaxMana?.() ?? 100;
    const manaRatio = Math.max(0, mana / maxMana);
    this.manaBar.clear();
    this.manaBar.fillStyle(manaRatio > 0.5 ? 0x0066ff : manaRatio > 0.25 ? 0x0044cc : 0x002288);
    this.manaBar.fillRect(46, 66, Math.floor(manaRatio * 86), 5);

    // ── Skill cooldown indicators (E / Q / R / F) ──
    const meleeRatio  = player?.getMeleeReadyRatio?.()       ?? 1;
    const blastRatio  = player?.getEchoBlastReadyRatio?.()   ?? 1;
    const sonicRatio  = player?.getSonicBurstReadyRatio?.()  ?? 1;
    const shadowRatio = player?.getShadowStepReadyRatio?.()  ?? 1;

    // E: Chém (free, 0.6s CD)
    if (meleeRatio >= 1) {
      this.skillE.setText('E ✓').setColor('#ff8833');
    } else {
      this.skillE.setText('E ·').setColor('#554422');
    }
    // Q: Nổ Âm (40 mana, 4s CD)
    if (blastRatio < 1) {
      this.skillQ.setText(`Q:${Math.ceil((1 - blastRatio) * 4)}s`).setColor('#225566');
    } else if (mana >= 40) {
      this.skillQ.setText('Q ✓').setColor('#00ddff');
    } else {
      this.skillQ.setText('Q ∅').setColor('#4466aa');
    }
    // R: Bùng Sóng (20 mana, 2s CD)
    if (sonicRatio < 1) {
      this.skillR.setText(`R:${Math.ceil((1 - sonicRatio) * 2)}s`).setColor('#224466');
    } else if (mana >= 20) {
      this.skillR.setText('R ✓').setColor('#44bbff');
    } else {
      this.skillR.setText('R ∅').setColor('#335577');
    }
    // F: Bước Tối (25 mana, 3s CD)
    if (shadowRatio < 1) {
      this.skillF.setText(`F:${Math.ceil((1 - shadowRatio) * 3)}s`).setColor('#442266');
    } else if (mana >= 25) {
      this.skillF.setText('F ✓').setColor('#aa66ff');
    } else {
      this.skillF.setText('F ∅').setColor('#553388');
    }

    // ── Boss HP bar ──
    const H = this.cameras.main.height;
    const boss = gameScene?.boss;
    if (boss && !boss.isDead && boss.health > 0) {
      const bossHpRatio = Math.max(0, boss.health / boss.maxHealth);
      this.bossHpBg.setVisible(true);
      this.bossHpFill.setVisible(true);
      this.bossHpLabel.setVisible(true).setText(`⚡ BOSS  ${boss.health} / ${boss.maxHealth}`);
      this.bossHpFill.clear();
      const bossColor = bossHpRatio > 0.6 ? 0xdd2200 : bossHpRatio > 0.3 ? 0xff6600 : 0xff0000;
      this.bossHpFill.fillStyle(bossColor);
      this.bossHpFill.fillRect(W / 2 - 178, H - 28, Math.floor(bossHpRatio * 356), 18);
    } else {
      this.bossHpBg.setVisible(false);
      this.bossHpFill.setVisible(false);
      this.bossHpLabel.setVisible(false);
    }
  }
}
