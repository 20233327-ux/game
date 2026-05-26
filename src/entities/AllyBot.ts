import Phaser from 'phaser';
import { EchoSystem } from '../systems/EchoSystem';
import { Enemy } from './Enemy';
import { findPath, TILE_SIZE } from '../utils/MapGenerator';

export class AllyBot extends Phaser.Physics.Arcade.Sprite {
  private tiles: number[][];
  private echoSystem: EchoSystem;
  private playerRef: { x: number; y: number };
  private getEnemies: () => Enemy[];
  private allyBullets: Phaser.Physics.Arcade.Group;

  public isDead = false;
  public health = 50;
  public readonly maxHealth = 50;

  private readonly SPEED = 155;
  private readonly FOLLOW_DIST_MIN = 60;
  private readonly FOLLOW_DIST_MAX = 115;
  private readonly ATTACK_RANGE = 210;
  private readonly SHOOT_COOLDOWN = 600;
  private lastShootTime = 0;

  // Pathfinding
  private path: { x: number; y: number }[] = [];
  private pathIndex = 0;
  private pathTimer = 0;
  private readonly PATH_INTERVAL = 900;

  constructor(
    scene: Phaser.Scene,
    x: number, y: number,
    tiles: number[][],
    echoSystem: EchoSystem,
    allyBullets: Phaser.Physics.Arcade.Group,
    playerRef: { x: number; y: number },
    getEnemies: () => Enemy[]
  ) {
    super(scene, x, y, 'allybot');
    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    scene.physics.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    this.setDepth(5);
    this.setCollideWorldBounds(true);

    this.tiles = tiles;
    this.echoSystem = echoSystem;
    this.allyBullets = allyBullets;
    this.playerRef = playerRef;
    this.getEnemies = getEnemies;
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.isDead) return;

    // Visibility based on echo
    const tileX = Math.floor(this.x / TILE_SIZE);
    const tileY = Math.floor(this.y / TILE_SIZE);
    this.setVisible(this.echoSystem.isTileLit(tileX, tileY));

    // Find nearest living enemy in attack range
    const enemies = this.getEnemies();
    let nearestEnemy: Enemy | null = null;
    let nearestDist = this.ATTACK_RANGE;
    for (const e of enemies) {
      if (e.isDead || !e.active) continue;
      const d = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y);
      if (d < nearestDist) { nearestDist = d; nearestEnemy = e; }
    }

    // Shoot nearest enemy
    if (nearestEnemy && time - this.lastShootTime > this.SHOOT_COOLDOWN) {
      this.lastShootTime = time;
      this.fireAt(nearestEnemy.x, nearestEnemy.y);
      this.setFlipX(nearestEnemy.x < this.x);
    }

    // Movement logic
    const distToPlayer = Phaser.Math.Distance.Between(
      this.x, this.y, this.playerRef.x, this.playerRef.y
    );

    if (nearestEnemy && nearestDist < 100) {
      // Engage: move toward enemy
      this.moveToward(nearestEnemy.x, nearestEnemy.y, 0.55);
    } else if (distToPlayer > this.FOLLOW_DIST_MAX) {
      // Follow player via pathfinding
      if (time > this.pathTimer) {
        this.pathTimer = time + this.PATH_INTERVAL;
        const myTX = Math.floor(this.x / TILE_SIZE);
        const myTY = Math.floor(this.y / TILE_SIZE);
        const pTX = Math.floor(this.playerRef.x / TILE_SIZE);
        const pTY = Math.floor(this.playerRef.y / TILE_SIZE);
        this.path = findPath(this.tiles, myTX, myTY, pTX, pTY);
        this.pathIndex = 1;
      }
      this.followPath();
    } else if (distToPlayer < this.FOLLOW_DIST_MIN) {
      // Keep distance — nudge away from player
      const dx = this.x - this.playerRef.x;
      const dy = this.y - this.playerRef.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      this.setVelocity((dx / len) * 60, (dy / len) * 60);
    } else {
      this.setVelocity(0, 0);
    }
  }

  private moveToward(tx: number, ty: number, speedFrac: number): void {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    this.setVelocity((dx / len) * this.SPEED * speedFrac, (dy / len) * this.SPEED * speedFrac);
  }

  private followPath(): void {
    if (!this.path || this.pathIndex >= this.path.length) {
      this.setVelocity(0, 0);
      return;
    }
    const next = this.path[this.pathIndex];
    const wx = next.x * TILE_SIZE + TILE_SIZE / 2;
    const wy = next.y * TILE_SIZE + TILE_SIZE / 2;
    const dx = wx - this.x;
    const dy = wy - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 5) {
      this.pathIndex++;
    } else {
      const vx = (dx / dist) * this.SPEED;
      const vy = (dy / dist) * this.SPEED;
      this.setVelocity(vx, vy);
      if (vx < 0) this.setFlipX(true);
      else if (vx > 0) this.setFlipX(false);
    }
  }

  private fireAt(tx: number, ty: number): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty);
    const bullet = this.allyBullets.get(this.x, this.y, 'bullet') as Phaser.Physics.Arcade.Image;
    if (bullet) {
      bullet.setActive(true).setVisible(true).setDepth(4);
      bullet.setTint(0x44ffaa);
      bullet.setScale(0.9);
      bullet.setData('damage', 25);
      bullet.setVelocity(Math.cos(angle) * 380, Math.sin(angle) * 380);
      bullet.setRotation(angle);
      this.scene.time.delayedCall(1200, () => {
        if (bullet.active) { bullet.setActive(false).setVisible(false); }
      });
    }
    this.echoSystem.emitEcho(this.x, this.y, 2, 1200);
  }

  takeDamage(amount: number): void {
    if (this.isDead) return;
    this.health -= amount;
    this.scene.tweens.add({
      targets: this,
      tint: 0xffffff,
      duration: 100,
      yoyo: true,
      onComplete: () => { if (!this.isDead) this.clearTint(); }
    });
    if (this.health <= 0) this.die();
  }

  private die(): void {
    this.isDead = true;
    this.setVelocity(0, 0);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 500,
      onComplete: () => { if (this.scene) this.destroy(); }
    });
  }
}
