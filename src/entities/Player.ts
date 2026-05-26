import Phaser from 'phaser';
import { GameManager } from '../managers/GameManager';
import { EchoSystem } from '../systems/EchoSystem';
import { TILE_SIZE } from '../utils/MapGenerator';
import { WEAPONS, WeaponConfig } from './Weapon';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private bullets!: Phaser.Physics.Arcade.Group;
  private echoSystem: EchoSystem;
  private lastEchoTime: number = 0;
  private lastShootTime: number = 0;
  private readonly ECHO_COOLDOWN = 200;
  private readonly MOVE_ECHO_RADIUS = 3;
  private readonly SHOOT_ECHO_RADIUS = 3;
  private readonly ECHO_DURATION = 2000;
  private readonly SPEED = 200;
  private invincible: boolean = false;
  private invincibleTimer: number = 0;
  private readonly INVINCIBLE_DURATION = 1000;

  // Dash
  private shiftKey!: Phaser.Input.Keyboard.Key;
  private isDashing: boolean = false;
  private dashEndTime: number = 0;
  private dashCooldownEnd: number = 0;
  private readonly DASH_DURATION = 160;
  private readonly DASH_COOLDOWN = 1800;
  private readonly DASH_SPEED_MULT = 3.5;

  // Weapon system
  private unlockedWeapons: WeaponConfig[] = [];
  private currentWeaponIdx: number = 0;
  private key1!: Phaser.Input.Keyboard.Key;
  private key2!: Phaser.Input.Keyboard.Key;
  private key3!: Phaser.Input.Keyboard.Key;
  private key4!: Phaser.Input.Keyboard.Key;

  // Mana + combat skills
  private mana: number = 100;
  private readonly maxMana: number = 100;
  private lastMeleeTime: number = 0;
  private readonly MELEE_COOLDOWN = 600;
  private lastEchoBlastTime: number = 0;
  private readonly ECHO_BLAST_COOLDOWN = 4000;
  private readonly ECHO_BLAST_MANA_COST = 40;
  private eKey!: Phaser.Input.Keyboard.Key;
  private qKey!: Phaser.Input.Keyboard.Key;
  private rKey!: Phaser.Input.Keyboard.Key;  // Sonic Burst
  private fKey!: Phaser.Input.Keyboard.Key;  // Shadow Step

  private lastSonicBurstTime = 0;
  private readonly SONIC_BURST_COOLDOWN = 2000;
  private readonly SONIC_BURST_MANA = 20;

  private lastShadowStepTime = 0;
  private readonly SHADOW_STEP_COOLDOWN = 3000;
  private readonly SHADOW_STEP_MANA = 25;

  constructor(
    scene: Phaser.Scene,
    x: number, y: number,
    echoSystem: EchoSystem,
    bullets: Phaser.Physics.Arcade.Group
  ) {
    super(scene, x, y, 'player');
    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    scene.physics.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    this.setDepth(5);
    this.setCollideWorldBounds(true);

    this.echoSystem = echoSystem;
    this.bullets = bullets;

    const kb = scene.input.keyboard!;
    this.wasd = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
    this.shiftKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.key1 = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.key2 = kb.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.key3 = kb.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    this.key4 = kb.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);
    // Combat skill keys
    this.eKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.qKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.rKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.fKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.F);

    // Restore weapon loadout from GameManager (persists across levels)
    const gm = GameManager.getInstance();
    this.unlockedWeapons = WEAPONS.filter(w => gm.unlockedWeaponIds.includes(w.id));
    if (this.unlockedWeapons.length === 0) this.unlockedWeapons = [WEAPONS[0]];
    const savedIdx = this.unlockedWeapons.findIndex(w => w.id === gm.currentWeaponId);
    this.currentWeaponIdx = savedIdx >= 0 ? savedIdx : 0;

    // Bắn bằng chuột trái
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.shoot(pointer);
      }
    });

    // Phát echo ban đầu để reveal vùng xung quanh
    this.echoSystem.emitEcho(x, y, this.MOVE_ECHO_RADIUS, this.ECHO_DURATION);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    const gm = GameManager.getInstance();
    if (gm.isDead()) {
      this.setVelocity(0, 0);
      return;
    }

    // Invincibility frames
    if (this.invincible && time > this.invincibleTimer) {
      this.invincible = false;
      this.setAlpha(1);
    }

    // Weapon switch (keys 1-4)
    if (Phaser.Input.Keyboard.JustDown(this.key1)) this.switchWeapon(0);
    else if (Phaser.Input.Keyboard.JustDown(this.key2)) this.switchWeapon(1);
    else if (Phaser.Input.Keyboard.JustDown(this.key3)) this.switchWeapon(2);
    else if (Phaser.Input.Keyboard.JustDown(this.key4)) this.switchWeapon(3);

    // Mana regeneration (10 per second)
    this.mana = Math.min(this.maxMana, this.mana + (10 * delta / 1000));

    // Combat skills
    if (Phaser.Input.Keyboard.JustDown(this.eKey)) this.performMelee(time);
    if (Phaser.Input.Keyboard.JustDown(this.qKey)) this.performEchoBlast(time);
    if (Phaser.Input.Keyboard.JustDown(this.rKey)) this.performSonicBurst(time);
    if (Phaser.Input.Keyboard.JustDown(this.fKey)) this.performShadowStep(time);

    let vx = 0;
    let vy = 0;
    let moved = false;

    if (this.wasd.left.isDown) { vx = -this.SPEED; moved = true; }
    else if (this.wasd.right.isDown) { vx = this.SPEED; moved = true; }
    if (this.wasd.up.isDown) { vy = -this.SPEED; moved = true; }
    else if (this.wasd.down.isDown) { vy = this.SPEED; moved = true; }

    // Normalize diagonal
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    // Dash (Shift)
    if (!this.isDashing && Phaser.Input.Keyboard.JustDown(this.shiftKey)
        && time > this.dashCooldownEnd && (vx !== 0 || vy !== 0)) {
      this.isDashing = true;
      this.dashEndTime = time + this.DASH_DURATION;
      this.dashCooldownEnd = time + this.DASH_COOLDOWN;
      const len = Math.sqrt(vx * vx + vy * vy) || 1;
      vx = (vx / len) * this.SPEED * this.DASH_SPEED_MULT;
      vy = (vy / len) * this.SPEED * this.DASH_SPEED_MULT;
      this.setTint(0x00ffcc);
      this.echoSystem.emitEcho(this.x, this.y, 5, 2500);
      this.scene.time.delayedCall(this.DASH_DURATION + 60, () => { this.clearTint(); });
    }

    if (this.isDashing) {
      if (time >= this.dashEndTime) {
        this.isDashing = false;
      } else {
        return; // hold dash velocity
      }
    }

    this.setVelocity(vx, vy);

    // Phát echo khi di chuyển
    if (moved && time - this.lastEchoTime > this.ECHO_COOLDOWN) {
      this.echoSystem.emitEcho(this.x, this.y, this.MOVE_ECHO_RADIUS, this.ECHO_DURATION);
      this.lastEchoTime = time;
    }

    // Flip sprite
    if (vx < 0) this.setFlipX(true);
    else if (vx > 0) this.setFlipX(false);

    // Blink khi invincible
    if (this.invincible) {
      this.setAlpha(Math.sin(time / 80) > 0 ? 0.5 : 1);
    }
  }

  private shoot(pointer: Phaser.Input.Pointer): void {
    const time = this.scene.time.now;
    const weapon = this.unlockedWeapons[this.currentWeaponIdx];
    if (time - this.lastShootTime < weapon.cooldown) return;
    this.lastShootTime = time;

    const worldX = this.scene.cameras.main.scrollX + pointer.x;
    const worldY = this.scene.cameras.main.scrollY + pointer.y;
    const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, worldX, worldY);

    for (let i = 0; i < weapon.bulletCount; i++) {
      let angle = baseAngle;
      if (weapon.bulletCount > 1 && weapon.spreadAngle > 0) {
        // Even spread across arc
        const half = weapon.spreadAngle / 2;
        angle = baseAngle + Phaser.Math.Linear(-half, half, i / (weapon.bulletCount - 1));
      } else if (weapon.spreadAngle > 0) {
        // Random inaccuracy (SMG)
        angle = baseAngle + (Math.random() - 0.5) * weapon.spreadAngle;
      }

      const bullet = this.bullets.get(this.x, this.y, 'bullet') as Phaser.Physics.Arcade.Image;
      if (bullet) {
        bullet.setActive(true).setVisible(true).setDepth(4);
        bullet.setTint(weapon.bulletTint);
        bullet.setScale(weapon.bulletScale);
        bullet.setData('damage', weapon.damage);
        bullet.setVelocity(Math.cos(angle) * weapon.bulletSpeed, Math.sin(angle) * weapon.bulletSpeed);
        bullet.setRotation(angle);
        bullet.setBlendMode(Phaser.BlendModes.ADD);
        this.scene.time.delayedCall(weapon.bulletLifetime, () => {
          if (bullet.active) { bullet.setActive(false).setVisible(false); }
        });
      }
    }

    // Muzzle flash
    const flashX = this.x + Math.cos(baseAngle) * 18;
    const flashY = this.y + Math.sin(baseAngle) * 18;
    const flash = this.scene.add.graphics().setDepth(11);
    flash.setBlendMode(Phaser.BlendModes.ADD);
    flash.fillStyle(weapon.bulletTint, 0.9);
    flash.fillCircle(flashX, flashY, 5 + weapon.bulletCount);
    flash.lineStyle(1.5, weapon.bulletTint, 0.75);
    for (let r = 0; r < 5; r++) {
      const ra = baseAngle + (r - 2) * 0.45;
      flash.lineBetween(flashX, flashY,
        flashX + Math.cos(ra) * (8 + weapon.bulletCount * 2),
        flashY + Math.sin(ra) * (8 + weapon.bulletCount * 2));
    }
    this.scene.tweens.add({ targets: flash, alpha: 0, duration: 70, onComplete: () => flash.destroy() });

    this.echoSystem.emitEcho(this.x, this.y, weapon.echoRadius, weapon.echoDuration);
  }

  private switchWeapon(idx: number): void {
    if (idx >= this.unlockedWeapons.length) return;
    if (this.currentWeaponIdx === idx) return;   // already active
    this.currentWeaponIdx = idx;
    this.lastShootTime = 0;                       // allow immediate shot after switch
    GameManager.getInstance().currentWeaponId = this.unlockedWeapons[idx].id;
    // Smooth scale pulse — no tint stutter
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this, scaleX: 1.3, scaleY: 0.75, duration: 55, ease: 'Quad.easeOut',
      yoyo: true, onComplete: () => this.setScale(1),
    });
  }

  unlockWeapon(id: string): void {
    if (this.unlockedWeapons.some(w => w.id === id)) return;
    const weapon = WEAPONS.find(w => w.id === id);
    if (!weapon) return;
    this.unlockedWeapons.push(weapon);
    GameManager.getInstance().unlockedWeaponIds.push(id);
    // Auto-switch to new weapon
    this.currentWeaponIdx = this.unlockedWeapons.length - 1;
    GameManager.getInstance().currentWeaponId = id;
  }

  getCurrentWeapon(): WeaponConfig {
    return this.unlockedWeapons[this.currentWeaponIdx];
  }

  getUnlockedWeapons(): WeaponConfig[] {
    return this.unlockedWeapons;
  }

  getCurrentWeaponIdx(): number {
    return this.currentWeaponIdx;
  }

  private performMelee(time: number): void {
    if (time - this.lastMeleeTime < this.MELEE_COOLDOWN) return;
    this.lastMeleeTime = time;
    const ptr = this.scene.input.activePointer;
    const ptrWorldX = this.scene.cameras.main.scrollX + ptr.x;
    const ptrWorldY = this.scene.cameras.main.scrollY + ptr.y;
    const aimAngle = Phaser.Math.Angle.Between(this.x, this.y, ptrWorldX, ptrWorldY);
    // Slash visual
    const gfx = this.scene.add.graphics();
    gfx.setDepth(10);
    gfx.fillStyle(0xffee00, 0.28);
    gfx.fillCircle(this.x, this.y, 82);
    gfx.lineStyle(3, 0xffffff, 0.9);
    for (let i = -2; i <= 2; i++) {
      const a = aimAngle + i * 0.28;
      gfx.beginPath();
      gfx.moveTo(this.x + Math.cos(a) * 14, this.y + Math.sin(a) * 14);
      gfx.lineTo(this.x + Math.cos(a) * 82, this.y + Math.sin(a) * 82);
      gfx.strokePath();
    }
    gfx.lineStyle(2, 0xffee00, 0.6);
    gfx.strokeCircle(this.x, this.y, 82);
    this.scene.tweens.add({ targets: gfx, alpha: 0, duration: 220, onComplete: () => gfx.destroy() });
    this.scene.events.emit('playerMelee', this.x, this.y, 82);
    this.echoSystem.emitEcho(this.x, this.y, 2, 1000);
  }

  private performEchoBlast(time: number): void {
    if (time - this.lastEchoBlastTime < this.ECHO_BLAST_COOLDOWN) return;
    if (this.mana < this.ECHO_BLAST_MANA_COST) {
      this.scene.events.emit('playerLowMana');
      return;
    }
    this.lastEchoBlastTime = time;
    this.mana -= this.ECHO_BLAST_MANA_COST;
    // Blast visual
    const gfx = this.scene.add.graphics();
    gfx.setDepth(10);
    gfx.fillStyle(0x00ffee, 0.18);
    gfx.fillCircle(this.x, this.y, 220);
    gfx.lineStyle(5, 0x00ffee, 0.95);
    gfx.strokeCircle(this.x, this.y, 220);
    gfx.lineStyle(2, 0x44ffee, 0.5);
    gfx.strokeCircle(this.x, this.y, 145);
    gfx.strokeCircle(this.x, this.y, 75);
    this.scene.tweens.add({
      targets: gfx, alpha: 0, scaleX: 1.28, scaleY: 1.28, duration: 520,
      ease: 'Quad.easeOut', onComplete: () => gfx.destroy()
    });
    this.echoSystem.emitEcho(this.x, this.y, 9, 4500);
    this.scene.events.emit('playerEchoBlast', this.x, this.y, 220);
    this.scene.cameras.main.shake(220, 0.012);
  }

  private performSonicBurst(time: number): void {
    if (time - this.lastSonicBurstTime < this.SONIC_BURST_COOLDOWN) return;
    if (this.mana < this.SONIC_BURST_MANA) { this.scene.events.emit('playerLowMana'); return; }
    this.lastSonicBurstTime = time;
    this.mana -= this.SONIC_BURST_MANA;

    const ptr = this.scene.input.activePointer;
    const aimAngle = Phaser.Math.Angle.Between(
      this.x, this.y,
      this.scene.cameras.main.scrollX + ptr.x,
      this.scene.cameras.main.scrollY + ptr.y
    );
    const range = 165;
    const halfSpread = Math.PI / 4.5; // ±40°

    // Cone fill
    const steps = 14;
    const pts: Phaser.Types.Math.Vector2Like[] = [{ x: this.x, y: this.y }];
    for (let i = 0; i <= steps; i++) {
      const a = aimAngle - halfSpread + (i / steps) * halfSpread * 2;
      pts.push({ x: this.x + Math.cos(a) * range, y: this.y + Math.sin(a) * range });
    }
    const gfx = this.scene.add.graphics().setDepth(10);
    gfx.setBlendMode(Phaser.BlendModes.ADD);
    gfx.fillStyle(0x44bbff, 0.30);
    gfx.fillPoints(pts, true);
    gfx.lineStyle(3, 0x00ddff, 0.9);
    gfx.beginPath();
    gfx.moveTo(this.x, this.y);
    for (let i = 1; i <= steps + 1; i++) gfx.lineTo(pts[i].x!, pts[i].y!);
    gfx.lineTo(this.x, this.y);
    gfx.strokePath();
    // Inner rays
    gfx.lineStyle(1, 0x88eeff, 0.45);
    for (let i = 2; i < steps; i += 3) gfx.lineBetween(this.x, this.y, pts[i].x!, pts[i].y!);
    this.scene.tweens.add({
      targets: gfx, alpha: 0, duration: 300, ease: 'Quad.easeOut',
      onComplete: () => gfx.destroy()
    });

    this.echoSystem.emitEcho(this.x, this.y, 5, 2500);
    this.scene.events.emit('playerSonicBurst', this.x, this.y, aimAngle, halfSpread, range);
    this.scene.cameras.main.shake(120, 0.008);
  }

  private performShadowStep(time: number): void {
    if (time - this.lastShadowStepTime < this.SHADOW_STEP_COOLDOWN) return;
    if (this.mana < this.SHADOW_STEP_MANA) { this.scene.events.emit('playerLowMana'); return; }
    this.lastShadowStepTime = time;
    this.mana -= this.SHADOW_STEP_MANA;

    const ptr = this.scene.input.activePointer;
    const angle = Phaser.Math.Angle.Between(
      this.x, this.y,
      this.scene.cameras.main.scrollX + ptr.x,
      this.scene.cameras.main.scrollY + ptr.y
    );
    const dist = 140;
    const oldX = this.x, oldY = this.y;
    const newX = this.x + Math.cos(angle) * dist;
    const newY = this.y + Math.sin(angle) * dist;

    // Ghost afterimage at origin
    const ghost = this.scene.add.image(oldX, oldY, 'player').setDepth(4)
      .setAlpha(0.65).setTint(0x8888ff).setFlipX(this.flipX);
    this.scene.tweens.add({ targets: ghost, alpha: 0, x: oldX + Math.cos(angle) * 30, duration: 380, onComplete: () => ghost.destroy() });

    // Trail along path
    for (let i = 1; i <= 5; i++) {
      const t = i / 5;
      const trail = this.scene.add.image(
        oldX + (newX - oldX) * t, oldY + (newY - oldY) * t, 'player'
      ).setDepth(4).setAlpha(0.25 * (1 - t)).setTint(0x6666ff).setScale(0.7);
      this.scene.tweens.add({ targets: trail, alpha: 0, duration: 220 + i * 40, onComplete: () => trail.destroy() });
    }

    // Teleport
    this.setPosition(newX, newY);

    // Arrival burst ring
    const burst = this.scene.add.graphics().setDepth(10);
    burst.setBlendMode(Phaser.BlendModes.ADD);
    burst.lineStyle(3, 0xaaaaff, 0.95);
    burst.strokeCircle(newX, newY, 28);
    this.scene.tweens.add({
      targets: burst, alpha: 0, scaleX: 2.8, scaleY: 2.8, duration: 320,
      ease: 'Quad.easeOut', onComplete: () => burst.destroy()
    });

    this.setTint(0xaaaaff);
    this.scene.time.delayedCall(140, () => this.clearTint());
    this.echoSystem.emitEcho(newX, newY, 4, 2000);
    this.scene.events.emit('playerShadowStep', newX, newY, 80);
  }

  getMana(): number { return Math.floor(this.mana); }
  getMaxMana(): number { return this.maxMana; }
  getMeleeReadyRatio(): number {
    return Math.min(1, (this.scene.time.now - this.lastMeleeTime) / this.MELEE_COOLDOWN);
  }
  getEchoBlastReadyRatio(): number {
    return Math.min(1, (this.scene.time.now - this.lastEchoBlastTime) / this.ECHO_BLAST_COOLDOWN);
  }

  getSonicBurstReadyRatio(): number {
    return Math.min(1, (this.scene.time.now - this.lastSonicBurstTime) / this.SONIC_BURST_COOLDOWN);
  }

  getShadowStepReadyRatio(): number {
    return Math.min(1, (this.scene.time.now - this.lastShadowStepTime) / this.SHADOW_STEP_COOLDOWN);
  }

  takeDamage(amount: number): void {
    if (this.invincible) return;
    GameManager.getInstance().takeDamage(amount);
    this.invincible = true;
    this.invincibleTimer = this.scene.time.now + this.INVINCIBLE_DURATION;
    this.scene.events.emit('playerDamaged');
  }

  getDashCooldownRatio(): number {
    const now = this.scene.time.now;
    if (now >= this.dashCooldownEnd) return 1;
    const elapsed = this.DASH_COOLDOWN - (this.dashCooldownEnd - now);
    return elapsed / this.DASH_COOLDOWN;
  }

  getBullets(): Phaser.Physics.Arcade.Group {
    return this.bullets;
  }
}
