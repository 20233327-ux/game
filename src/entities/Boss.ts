import Phaser from 'phaser';
import { EchoSystem } from '../systems/EchoSystem';
import { Player } from './Player';
import { TILE_SIZE } from '../utils/MapGenerator';

export class Boss extends Phaser.Physics.Arcade.Sprite {
  public isDead = false;
  public health: number;
  public readonly maxHealth: number;

  private player: Player;
  private echoSystem: EchoSystem;
  private bossBullets: Phaser.Physics.Arcade.Group;

  private phase = 0; // 0=normal, 1=enraged (<60%), 2=berserk (<30%)
  private lastShootTime = 0;
  private lastChargeTime = 0;
  private lastSlamTime = 0;
  private isCharging = false;
  private chargeEndTime = 0;

  private readonly SHOOT_INTERVALS = [2200, 1500, 900];
  private readonly BULLET_COUNTS = [3, 5, 8];
  private readonly SPEEDS = [110, 155, 200];
  private readonly CHARGE_INTERVALS = [99999, 6000, 4000];
  private readonly SLAM_INTERVALS = [99999, 99999, 5500];
  private readonly CHARGE_SPEED = 380;
  private readonly CHARGE_DURATION = 700;

  constructor(
    scene: Phaser.Scene,
    x: number, y: number,
    player: Player,
    echoSystem: EchoSystem,
    level: number
  ) {
    super(scene, x, y, 'boss');
    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    scene.physics.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    this.setDepth(6);
    this.setCollideWorldBounds(true);

    this.player = player;
    this.echoSystem = echoSystem;
    this.maxHealth = 250 + (level - 1) * 100;
    this.health = this.maxHealth;

    this.bossBullets = scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 40,
      runChildUpdate: false
    });

    // Entrance effect
    scene.cameras.main.shake(350, 0.018);
    scene.tweens.add({
      targets: this,
      tint: 0xff0000,
      duration: 180,
      yoyo: true,
      repeat: 4,
      onComplete: () => this.clearTint()
    });
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.isDead) return;

    // Update phase
    const hpRatio = this.health / this.maxHealth;
    const prevPhase = this.phase;
    if (hpRatio < 0.3) this.phase = 2;
    else if (hpRatio < 0.6) this.phase = 1;
    else this.phase = 0;

    // Phase transition flash
    if (this.phase > prevPhase) {
      this.scene.cameras.main.shake(300, 0.015);
      this.setTint(0xff6600);
      this.scene.time.delayedCall(500, () => { if (!this.isDead) this.clearTint(); });
    }

    // Visibility
    const tx = Math.floor(this.x / TILE_SIZE);
    const ty = Math.floor(this.y / TILE_SIZE);
    this.setVisible(this.echoSystem.isTileLit(tx, ty));

    // Charging override
    if (this.isCharging) {
      if (time > this.chargeEndTime) {
        this.isCharging = false;
        this.setVelocity(0, 0);
      }
      return;
    }

    // Pursue player
    const dx = this.player.x - this.x;
    const dy = this.player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const spd = this.SPEEDS[this.phase];
    this.setVelocity((dx / dist) * spd, (dy / dist) * spd);
    this.setFlipX(dx < 0);

    // Shoot burst
    if (time - this.lastShootTime > this.SHOOT_INTERVALS[this.phase]) {
      this.lastShootTime = time;
      this.shootBurst();
    }

    // Charge attack (phase 1+)
    if (this.phase >= 1 && time - this.lastChargeTime > this.CHARGE_INTERVALS[this.phase]) {
      this.lastChargeTime = time;
      this.startCharge();
    }

    // Slam attack (phase 2)
    if (this.phase >= 2 && time - this.lastSlamTime > this.SLAM_INTERVALS[this.phase]) {
      this.lastSlamTime = time;
      this.performSlam();
    }

    // Suppress unused delta warning
    void delta;
  }

  private shootBurst(): void {
    const count = this.BULLET_COUNTS[this.phase];
    const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, this.player.x, this.player.y);
    const totalSpread = Math.PI / 3;
    for (let i = 0; i < count; i++) {
      const angle = count > 1
        ? baseAngle + Phaser.Math.Linear(-totalSpread / 2, totalSpread / 2, i / (count - 1))
        : baseAngle;
      const bullet = this.bossBullets.get(this.x, this.y, 'bossBullet') as Phaser.Physics.Arcade.Image;
      if (bullet) {
        bullet.setActive(true).setVisible(true).setDepth(4);
        bullet.setScale(1 + this.phase * 0.3);
        bullet.setVelocity(
          Math.cos(angle) * (260 + this.phase * 30),
          Math.sin(angle) * (260 + this.phase * 30)
        );
        bullet.setRotation(angle);
        this.scene.time.delayedCall(2500, () => {
          if (bullet.active) { bullet.setActive(false).setVisible(false); }
        });
      }
    }
    this.echoSystem.emitEcho(this.x, this.y, 4, 2500);
  }

  private startCharge(): void {
    const dx = this.player.x - this.x;
    const dy = this.player.y - this.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    this.isCharging = true;
    this.chargeEndTime = this.scene.time.now + this.CHARGE_DURATION;
    this.setVelocity((dx / len) * this.CHARGE_SPEED, (dy / len) * this.CHARGE_SPEED);
    this.setTint(0xff8800);
    this.scene.time.delayedCall(200, () => { if (!this.isDead) this.clearTint(); });
    // Warning sparks
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const shard = this.scene.add.image(this.x, this.y, 'spark').setDepth(9);
      shard.setTint(0xff6600).setScale(2);
      this.scene.tweens.add({
        targets: shard,
        x: this.x + Math.cos(a) * 50,
        y: this.y + Math.sin(a) * 50,
        alpha: 0, duration: 300, ease: 'Quad.easeOut',
        onComplete: () => shard.destroy()
      });
    }
  }

  private performSlam(): void {
    this.setVelocity(0, 0);
    this.scene.cameras.main.shake(250, 0.014);
    for (let ring = 0; ring < 2; ring++) {
      this.scene.time.delayedCall(ring * 160, () => {
        for (let i = 0; i < 16; i++) {
          const angle = (i / 16) * Math.PI * 2;
          const shard = this.scene.add.image(this.x, this.y, 'deathParticle').setDepth(8);
          shard.setTint(0xff2200).setScale(2.5 - ring * 0.5);
          this.scene.tweens.add({
            targets: shard,
            x: this.x + Math.cos(angle) * (100 + ring * 60),
            y: this.y + Math.sin(angle) * (100 + ring * 60),
            alpha: 0, scale: 0,
            duration: 450 + ring * 100,
            ease: 'Quad.easeOut',
            onComplete: () => shard.destroy()
          });
        }
      });
    }
    this.echoSystem.emitEcho(this.x, this.y, 7, 3500);
    this.scene.events.emit('bossSlam', this.x, this.y, 130);
  }

  takeDamage(amount: number): boolean {
    if (this.isDead) return false;
    this.health -= amount;
    this.scene.tweens.add({
      targets: this, tint: 0xffffff, duration: 80, yoyo: true,
      onComplete: () => { if (!this.isDead) this.clearTint(); }
    });
    if (this.health <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  private die(): void {
    this.isDead = true;
    this.setVelocity(0, 0);
    this.scene.cameras.main.shake(500, 0.022);
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const speed = 80 + Math.random() * 150;
      const shard = this.scene.add.image(this.x, this.y, 'deathParticle').setDepth(10);
      shard.setTint(i % 2 === 0 ? 0xff4400 : 0xff8800).setScale(2 + Math.random() * 2);
      this.scene.tweens.add({
        targets: shard,
        x: this.x + Math.cos(angle) * speed,
        y: this.y + Math.sin(angle) * speed,
        alpha: 0, scale: 0,
        duration: 700 + Math.random() * 400,
        ease: 'Quad.easeOut',
        onComplete: () => shard.destroy()
      });
    }
    this.scene.tweens.add({
      targets: this, alpha: 0, scale: 2.5, duration: 800,
      ease: 'Quad.easeIn',
      onComplete: () => { if (this.scene) this.destroy(); }
    });
  }

  getBossBullets(): Phaser.Physics.Arcade.Group {
    return this.bossBullets;
  }
}
