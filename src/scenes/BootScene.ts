import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Tạo texture procedurally (không cần file ảnh ngoài)
    this.createTextures();
  }

  private createTextures(): void {
    // ===== PLAYER: armored scout =====
    const playerGfx = this.make.graphics({ x: 0, y: 0 });
    // Drop shadow
    playerGfx.fillStyle(0x001a0d, 0.5);
    playerGfx.fillCircle(13, 13, 11);
    // Armor body
    playerGfx.fillStyle(0x1a7048);
    playerGfx.fillCircle(12, 12, 10);
    // Body highlight
    playerGfx.fillStyle(0x28aa6a);
    playerGfx.fillCircle(10, 10, 5);
    // Dark visor
    playerGfx.fillStyle(0x091a10);
    playerGfx.fillEllipse(12, 11, 14, 8);
    // Visor glow
    playerGfx.fillStyle(0x00ffaa);
    playerGfx.fillEllipse(12, 11, 10, 5);
    // Eyes
    playerGfx.fillStyle(0xffffff);
    playerGfx.fillCircle(9, 10, 2);
    playerGfx.fillCircle(15, 10, 2);
    playerGfx.fillStyle(0x00ffaa);
    playerGfx.fillCircle(9, 10, 1);
    playerGfx.fillCircle(15, 10, 1);
    playerGfx.generateTexture('player', 24, 24);
    playerGfx.destroy();

    // ===== ENEMY: skull demon =====
    const enemyGfx = this.make.graphics({ x: 0, y: 0 });
    // Drop shadow
    enemyGfx.fillStyle(0x220000, 0.5);
    enemyGfx.fillCircle(13, 13, 11);
    // Body
    enemyGfx.fillStyle(0xaa1800);
    enemyGfx.fillCircle(12, 12, 9);
    // Body shading
    enemyGfx.fillStyle(0x881000);
    enemyGfx.fillCircle(14, 14, 6);
    // Eye glow outer
    enemyGfx.fillStyle(0xff5500);
    enemyGfx.fillCircle(8, 10, 4);
    enemyGfx.fillCircle(16, 10, 4);
    // Eye inner
    enemyGfx.fillStyle(0xffcc00);
    enemyGfx.fillCircle(8, 10, 2.5);
    enemyGfx.fillCircle(16, 10, 2.5);
    // Pupils
    enemyGfx.fillStyle(0x1a0000);
    enemyGfx.fillCircle(9, 10, 1.5);
    enemyGfx.fillCircle(17, 10, 1.5);
    // Teeth
    enemyGfx.fillStyle(0xeeeeee);
    enemyGfx.fillRect(8, 17, 2, 4);
    enemyGfx.fillRect(12, 17, 2, 4);
    enemyGfx.fillRect(16, 17, 2, 4);
    enemyGfx.generateTexture('enemy', 24, 24);
    enemyGfx.destroy();

    // ===== BULLET: plasma bolt =====
    const bulletGfx = this.make.graphics({ x: 0, y: 0 });
    bulletGfx.fillStyle(0x00eeff, 0.3);
    bulletGfx.fillCircle(6, 6, 6);
    bulletGfx.fillStyle(0x00ccff, 0.75);
    bulletGfx.fillCircle(6, 6, 4);
    bulletGfx.fillStyle(0xffffff);
    bulletGfx.fillCircle(6, 6, 2);
    bulletGfx.generateTexture('bullet', 12, 12);
    bulletGfx.destroy();

    // ===== FLOOR: dark stone =====
    const floorGfx = this.make.graphics({ x: 0, y: 0 });
    floorGfx.fillStyle(0x1a1a2e);
    floorGfx.fillRect(0, 0, 32, 32);
    floorGfx.lineStyle(1, 0x24243c, 1);
    floorGfx.strokeRect(0, 0, 32, 32);
    // Stone patches
    floorGfx.fillStyle(0x22223c, 0.5);
    floorGfx.fillRect(1, 1, 14, 14);
    floorGfx.fillRect(17, 17, 14, 14);
    // Crack detail
    floorGfx.lineStyle(1, 0x2c2c48, 0.7);
    floorGfx.beginPath();
    floorGfx.moveTo(6, 18);
    floorGfx.lineTo(14, 22);
    floorGfx.lineTo(20, 14);
    floorGfx.strokePath();
    floorGfx.generateTexture('floor', 32, 32);
    floorGfx.destroy();

    // ===== WALL: 3D stone block =====
    const wallGfx = this.make.graphics({ x: 0, y: 0 });
    // Deep shadow base
    wallGfx.fillStyle(0x08080f);
    wallGfx.fillRect(0, 0, 32, 32);
    // Stone face
    wallGfx.fillStyle(0x131326);
    wallGfx.fillRect(1, 1, 30, 30);
    // Top-left highlight (3D)
    wallGfx.fillStyle(0x202044);
    wallGfx.fillRect(1, 1, 30, 4);
    wallGfx.fillRect(1, 1, 4, 30);
    // Bottom-right shadow
    wallGfx.fillStyle(0x06060c);
    wallGfx.fillRect(1, 27, 30, 4);
    wallGfx.fillRect(27, 1, 4, 30);
    // Brick mortar lines
    wallGfx.fillStyle(0x0c0c1c);
    wallGfx.fillRect(5, 11, 22, 2);
    wallGfx.fillRect(5, 21, 22, 2);
    wallGfx.fillRect(14, 5, 2, 6);
    wallGfx.fillRect(6, 13, 2, 8);
    wallGfx.fillRect(20, 23, 2, 4);
    wallGfx.generateTexture('wall', 32, 32);
    wallGfx.destroy();

    // ===== KEY: proper key shape =====
    const keyGfx = this.make.graphics({ x: 0, y: 0 });
    // Glow aura
    keyGfx.fillStyle(0xffcc00, 0.22);
    keyGfx.fillCircle(11, 13, 13);
    // Ring outer
    keyGfx.fillStyle(0xffd700);
    keyGfx.fillCircle(9, 13, 8);
    // Ring hole
    keyGfx.fillStyle(0x0d0d0d);
    keyGfx.fillCircle(9, 13, 4);
    // Shaft
    keyGfx.fillStyle(0xffd700);
    keyGfx.fillRect(15, 11, 14, 4);
    // Teeth
    keyGfx.fillRect(24, 15, 4, 4);
    keyGfx.fillRect(18, 15, 3, 3);
    // Shine
    keyGfx.fillStyle(0xffeeaa);
    keyGfx.fillCircle(7, 11, 2);
    keyGfx.generateTexture('key', 32, 26);
    keyGfx.destroy();

    // ===== EXIT DOOR: glowing portal =====
    const exitGfx = this.make.graphics({ x: 0, y: 0 });
    // Outer aura
    exitGfx.fillStyle(0x0022dd, 0.2);
    exitGfx.fillEllipse(14, 14, 32, 32);
    // Portal ring
    exitGfx.fillStyle(0x0044ff);
    exitGfx.fillEllipse(14, 14, 28, 28);
    // Mid glow
    exitGfx.fillStyle(0x1166ff);
    exitGfx.fillEllipse(14, 14, 20, 20);
    // Inner swirl
    exitGfx.fillStyle(0x55aaff);
    exitGfx.fillEllipse(14, 14, 12, 12);
    // Bright core
    exitGfx.fillStyle(0xaaddff);
    exitGfx.fillEllipse(14, 14, 5, 5);
    // Arrow indicator
    exitGfx.fillStyle(0xffffff);
    exitGfx.fillTriangle(10, 17, 18, 17, 14, 9);
    exitGfx.generateTexture('exit', 28, 28);
    exitGfx.destroy();

    // ===== HEALTH PACK =====
    const hpGfx = this.make.graphics({ x: 0, y: 0 });
    hpGfx.fillStyle(0x1a0000);
    hpGfx.fillRect(0, 0, 20, 20);
    hpGfx.lineStyle(2, 0xff2222, 1);
    hpGfx.strokeRect(1, 1, 18, 18);
    // Cross
    hpGfx.fillStyle(0xff2222);
    hpGfx.fillRect(8, 3, 4, 14);
    hpGfx.fillRect(3, 8, 14, 4);
    // Highlight
    hpGfx.fillStyle(0xff9999);
    hpGfx.fillRect(9, 4, 2, 3);
    hpGfx.generateTexture('healthpack', 20, 20);
    hpGfx.destroy();

    // ===== PARTICLES =====
    const particleGfx = this.make.graphics({ x: 0, y: 0 });
    particleGfx.fillStyle(0x00ffff, 0.9);
    particleGfx.fillCircle(5, 5, 5);
    particleGfx.generateTexture('echoParticle', 10, 10);
    particleGfx.destroy();

    const deathPGfx = this.make.graphics({ x: 0, y: 0 });
    deathPGfx.fillStyle(0xff4400);
    deathPGfx.fillRect(0, 0, 6, 6);
    deathPGfx.generateTexture('deathParticle', 6, 6);
    deathPGfx.destroy();

    const sparkGfx = this.make.graphics({ x: 0, y: 0 });
    sparkGfx.fillStyle(0xffff00);
    sparkGfx.fillRect(0, 0, 4, 4);
    sparkGfx.generateTexture('spark', 4, 4);
    sparkGfx.destroy();

    // ===== WEAPON PICKUP: SHOTGUN (brown/orange) =====
    const shotgunGfx = this.make.graphics({ x: 0, y: 0 });
    // Glow aura
    shotgunGfx.fillStyle(0xff8800, 0.15);
    shotgunGfx.fillRect(0, 2, 32, 18);
    // Stock
    shotgunGfx.fillStyle(0x7a4210);
    shotgunGfx.fillRoundedRect(0, 10, 12, 10, 2);
    // Body
    shotgunGfx.fillStyle(0x553320);
    shotgunGfx.fillRoundedRect(8, 5, 20, 10, 2);
    // Body highlight
    shotgunGfx.fillStyle(0x886644);
    shotgunGfx.fillRoundedRect(9, 6, 18, 4, 1);
    // Barrel
    shotgunGfx.fillStyle(0x331a00);
    shotgunGfx.fillRect(26, 7, 6, 6);
    // Guard
    shotgunGfx.fillStyle(0x442211);
    shotgunGfx.fillRect(12, 13, 10, 4);
    shotgunGfx.generateTexture('weapon_shotgun', 32, 22);
    shotgunGfx.destroy();

    // ===== WEAPON PICKUP: RIFLE (blue/chrome) =====
    const rifleGfx = this.make.graphics({ x: 0, y: 0 });
    // Glow aura
    rifleGfx.fillStyle(0x00eeff, 0.15);
    rifleGfx.fillRect(0, 3, 36, 14);
    // Stock
    rifleGfx.fillStyle(0x335577);
    rifleGfx.fillRoundedRect(0, 11, 10, 8, 2);
    // Body
    rifleGfx.fillStyle(0x223355);
    rifleGfx.fillRoundedRect(6, 5, 26, 10, 2);
    // Body chrome
    rifleGfx.fillStyle(0x4488bb);
    rifleGfx.fillRoundedRect(8, 6, 22, 4, 1);
    // Barrel
    rifleGfx.fillStyle(0x112233);
    rifleGfx.fillRect(30, 7, 6, 4);
    // Scope
    rifleGfx.fillStyle(0x224466);
    rifleGfx.fillCircle(22, 10, 5);
    rifleGfx.fillStyle(0x99ccff);
    rifleGfx.fillCircle(22, 10, 3);
    rifleGfx.fillStyle(0xeef8ff);
    rifleGfx.fillCircle(22, 10, 1);
    rifleGfx.generateTexture('weapon_rifle', 36, 20);
    rifleGfx.destroy();

    // ===== WEAPON PICKUP: SMG (purple/compact) =====
    const smgGfx = this.make.graphics({ x: 0, y: 0 });
    // Glow aura
    smgGfx.fillStyle(0xff66ff, 0.15);
    smgGfx.fillRect(0, 0, 32, 24);
    // Body
    smgGfx.fillStyle(0x441155);
    smgGfx.fillRoundedRect(0, 3, 24, 14, 3);
    // Body highlight
    smgGfx.fillStyle(0x8833aa);
    smgGfx.fillRoundedRect(2, 4, 18, 6, 2);
    // Barrel
    smgGfx.fillStyle(0x220033);
    smgGfx.fillRect(22, 5, 10, 6);
    // Magazine
    smgGfx.fillStyle(0x662288);
    smgGfx.fillRoundedRect(8, 15, 8, 9, 2);
    // Grip
    smgGfx.fillStyle(0x331144);
    smgGfx.fillRoundedRect(2, 14, 7, 10, 2);
    smgGfx.generateTexture('weapon_smg', 32, 24);
    smgGfx.destroy();

    // ===== ALLY BOT: blue armored unit =====
    const allybotGfx = this.make.graphics({ x: 0, y: 0 });
    // Drop shadow
    allybotGfx.fillStyle(0x001122, 0.5);
    allybotGfx.fillCircle(13, 13, 11);
    // Armor body
    allybotGfx.fillStyle(0x0055aa);
    allybotGfx.fillCircle(12, 12, 10);
    // Highlight
    allybotGfx.fillStyle(0x2288dd);
    allybotGfx.fillCircle(10, 10, 5);
    // Visor dark
    allybotGfx.fillStyle(0x002244);
    allybotGfx.fillEllipse(12, 11, 14, 8);
    // Visor glow (cyan to distinguish from player)
    allybotGfx.fillStyle(0x00ffee);
    allybotGfx.fillEllipse(12, 11, 10, 5);
    // Eyes
    allybotGfx.fillStyle(0xffffff);
    allybotGfx.fillCircle(9, 10, 2);
    allybotGfx.fillCircle(15, 10, 2);
    allybotGfx.fillStyle(0x00ffcc);
    allybotGfx.fillCircle(9, 10, 1);
    allybotGfx.fillCircle(15, 10, 1);
    // Friendly cross on chest
    allybotGfx.fillStyle(0x00ffcc, 0.8);
    allybotGfx.fillRect(11, 14, 2, 5);
    allybotGfx.fillRect(9, 16, 6, 2);
    allybotGfx.generateTexture('allybot', 24, 24);
    allybotGfx.destroy();

    // ===== ALLY PICKUP: recruit icon =====
    const allypickupGfx = this.make.graphics({ x: 0, y: 0 });
    // Background
    allypickupGfx.fillStyle(0x001833);
    allypickupGfx.fillRect(0, 0, 22, 22);
    // Border glow
    allypickupGfx.lineStyle(2, 0x00aaff, 1);
    allypickupGfx.strokeRect(1, 1, 20, 20);
    // Bot icon (circle head)
    allypickupGfx.fillStyle(0x0088cc);
    allypickupGfx.fillCircle(11, 9, 5);
    // Bot body
    allypickupGfx.fillRoundedRect(7, 14, 8, 6, 1);
    // Green + sign
    allypickupGfx.fillStyle(0x00ffaa);
    allypickupGfx.fillRect(4, 3, 2, 6);
    allypickupGfx.fillRect(2, 5, 6, 2);
    allypickupGfx.generateTexture('allypickup', 22, 22);
    allypickupGfx.destroy();

    // ── Boss (40×36) ── large skull-king with crown spikes & glowing red eyes ──
    const bossGfx = this.make.graphics({ x: 0, y: 0 });
    // Shadow
    bossGfx.fillStyle(0x110000, 0.55);
    bossGfx.fillCircle(22, 22, 20);
    // Body
    bossGfx.fillStyle(0x660022);
    bossGfx.fillCircle(20, 21, 17);
    // Body shade
    bossGfx.fillStyle(0x440011);
    bossGfx.fillCircle(22, 23, 11);
    // Crown spikes (dark red)
    bossGfx.fillStyle(0x880033);
    bossGfx.fillTriangle(5, 9, 9, 1, 13, 9);
    bossGfx.fillTriangle(15, 6, 20, 0, 25, 6);
    bossGfx.fillTriangle(27, 9, 31, 1, 35, 9);
    // Crown base band
    bossGfx.fillStyle(0xaa0044);
    bossGfx.fillRect(6, 9, 28, 5);
    // Glowing eyes — outer glow
    bossGfx.fillStyle(0x660000, 0.6);
    bossGfx.fillCircle(13, 18, 7);
    bossGfx.fillCircle(27, 18, 7);
    // Eyes mid
    bossGfx.fillStyle(0xff3300);
    bossGfx.fillCircle(13, 18, 4.5);
    bossGfx.fillCircle(27, 18, 4.5);
    // Eye core
    bossGfx.fillStyle(0xffcc00);
    bossGfx.fillCircle(13, 18, 2);
    bossGfx.fillCircle(27, 18, 2);
    // Teeth
    bossGfx.fillStyle(0xeeeebb);
    for (let t = 0; t < 4; t++) {
      bossGfx.fillRect(11 + t * 5, 28, 3, 5);
    }
    bossGfx.generateTexture('boss', 40, 36);
    bossGfx.destroy();

    // ── Boss bullet (14×14) ── red glow orb ──
    const bbGfx = this.make.graphics({ x: 0, y: 0 });
    bbGfx.fillStyle(0xff3300, 0.35);
    bbGfx.fillCircle(7, 7, 7);
    bbGfx.fillStyle(0xff5500, 0.75);
    bbGfx.fillCircle(7, 7, 4.5);
    bbGfx.fillStyle(0xffcc00, 1);
    bbGfx.fillCircle(7, 7, 2);
    bbGfx.generateTexture('bossBullet', 14, 14);
    bbGfx.destroy();
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}
