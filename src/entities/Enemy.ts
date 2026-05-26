import Phaser from 'phaser';
import { EchoSystem } from '../systems/EchoSystem';
import { findPath, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../utils/MapGenerator';

export enum EnemyState {
  PATROL = 'PATROL',
  INVESTIGATE = 'INVESTIGATE',
  CHASE = 'CHASE'
}

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private echoSystem: EchoSystem;
  private tiles: number[][];
  private fsmState: EnemyState = EnemyState.PATROL;

  private spawnTileX: number;
  private spawnTileY: number;
  private targetTileX: number = 0;
  private targetTileY: number = 0;

  private path: { x: number; y: number }[] = [];
  private pathIndex: number = 0;
  private moveTimer: number = 0;
  private MOVE_INTERVAL = 600;
  private SPEED = 100;
  private readonly ECHO_RADIUS = 1.5;
  private readonly ECHO_DURATION = 1000;
  private lastEchoTime: number = 0;
  private readonly ECHO_COOLDOWN = 800;

  private playerRef: { x: number; y: number } | null = null;
  private investigateTarget: { x: number; y: number } | null = null;
  private CHASE_RANGE_TILES = 4;
  private readonly PATROL_RANGE_TILES = 5;

  public health: number = 30;
  public maxHealth: number = 30;
  public isDead: boolean = false;

  constructor(
    scene: Phaser.Scene,
    x: number, y: number,
    tiles: number[][],
    echoSystem: EchoSystem,
    level: number = 1
  ) {
    super(scene, x, y, 'enemy');
    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    scene.physics.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    this.setDepth(5);
    this.setCollideWorldBounds(true);

    this.tiles = tiles;
    this.echoSystem = echoSystem;
    this.spawnTileX = Math.floor(x / TILE_SIZE);
    this.spawnTileY = Math.floor(y / TILE_SIZE);
    this.targetTileX = this.spawnTileX;
    this.targetTileY = this.spawnTileY;

    // Scale stats by level
    const lvl = Math.max(1, level);
    this.health = 30 + (lvl - 1) * 15;
    this.maxHealth = this.health;
    this.SPEED = 85 + (lvl - 1) * 12;
    this.MOVE_INTERVAL = Math.max(300, 600 - (lvl - 1) * 50);
    this.CHASE_RANGE_TILES = 4 + Math.min(3, lvl - 1);

    // Visual tint: orange tint on higher levels
    if (lvl === 2) this.setTint(0xff8844);
    else if (lvl >= 3) this.setTint(0xff4422);
  }

  setPlayerReference(player: { x: number; y: number }): void {
    this.playerRef = player;
  }

  // Gọi khi player phát sóng echo – enemy nghe thấy
  onEchoHeard(srcX: number, srcY: number): void {
    if (this.fsmState === EnemyState.PATROL || this.fsmState === EnemyState.INVESTIGATE) {
      this.investigateTarget = { x: Math.floor(srcX / TILE_SIZE), y: Math.floor(srcY / TILE_SIZE) };
      this.fsmState = EnemyState.INVESTIGATE;
    }
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.isDead) return;

    // Ẩn nếu tile không sáng
    const tileX = Math.floor(this.x / TILE_SIZE);
    const tileY = Math.floor(this.y / TILE_SIZE);
    const lit = this.echoSystem.isTileLit(tileX, tileY);
    this.setVisible(lit);

    // FSM
    this.updateFSM(time);

    // Di chuyển theo path
    this.followPath();

    // Phát echo khi di chuyển
    const moving = (this.body as Phaser.Physics.Arcade.Body).speed > 10;
    if (moving && time - this.lastEchoTime > this.ECHO_COOLDOWN) {
      this.echoSystem.emitEcho(this.x, this.y, this.ECHO_RADIUS, this.ECHO_DURATION);
      this.lastEchoTime = time;
    }
  }

  private updateFSM(time: number): void {
    if (!this.playerRef) return;

    const myTileX = Math.floor(this.x / TILE_SIZE);
    const myTileY = Math.floor(this.y / TILE_SIZE);
    const playerTileX = Math.floor(this.playerRef.x / TILE_SIZE);
    const playerTileY = Math.floor(this.playerRef.y / TILE_SIZE);
    const distToPlayer = Math.abs(myTileX - playerTileX) + Math.abs(myTileY - playerTileY);

    // Kiểm tra xem player có trong tầm thấy (tile được sáng) không
    const playerLit = this.echoSystem.isTileLit(playerTileX, playerTileY);

    switch (this.fsmState) {
      case EnemyState.PATROL:
        if (playerLit && distToPlayer <= this.CHASE_RANGE_TILES) {
          this.fsmState = EnemyState.CHASE;
        }
        if (time > this.moveTimer) {
          this.moveTimer = time + this.MOVE_INTERVAL * 2;
          this.pickPatrolTarget(myTileX, myTileY);
        }
        break;

      case EnemyState.INVESTIGATE:
        if (playerLit && distToPlayer <= this.CHASE_RANGE_TILES) {
          this.fsmState = EnemyState.CHASE;
          break;
        }
        if (this.investigateTarget) {
          const dx = Math.abs(myTileX - this.investigateTarget.x);
          const dy = Math.abs(myTileY - this.investigateTarget.y);
          if (dx + dy <= 1) {
            this.fsmState = EnemyState.PATROL;
            this.investigateTarget = null;
          } else if (time > this.moveTimer) {
            this.moveTimer = time + this.MOVE_INTERVAL;
            this.computePath(myTileX, myTileY, this.investigateTarget.x, this.investigateTarget.y);
          }
        }
        break;

      case EnemyState.CHASE:
        if (!playerLit || distToPlayer > this.CHASE_RANGE_TILES + 2) {
          if (this.playerRef) {
            this.investigateTarget = { x: playerTileX, y: playerTileY };
          }
          this.fsmState = EnemyState.INVESTIGATE;
          break;
        }
        if (time > this.moveTimer) {
          this.moveTimer = time + this.MOVE_INTERVAL;
          this.computePath(myTileX, myTileY, playerTileX, playerTileY);
        }
        break;
    }
  }

  private pickPatrolTarget(myTileX: number, myTileY: number): void {
    const range = this.PATROL_RANGE_TILES;
    let attempts = 0;
    while (attempts < 10) {
      const dx = Math.floor(Math.random() * (range * 2 + 1)) - range;
      const dy = Math.floor(Math.random() * (range * 2 + 1)) - range;
      const tx = Phaser.Math.Clamp(this.spawnTileX + dx, 1, MAP_WIDTH - 2);
      const ty = Phaser.Math.Clamp(this.spawnTileY + dy, 1, MAP_HEIGHT - 2);
      if (this.tiles[ty] && this.tiles[ty][tx] === 0) {
        this.computePath(myTileX, myTileY, tx, ty);
        break;
      }
      attempts++;
    }
  }

  private computePath(fx: number, fy: number, tx: number, ty: number): void {
    this.path = findPath(this.tiles, fx, fy, tx, ty);
    this.pathIndex = 1; // Bỏ qua node hiện tại
  }

  private followPath(): void {
    if (!this.path || this.pathIndex >= this.path.length) {
      this.setVelocity(0, 0);
      return;
    }

    const nextNode = this.path[this.pathIndex];
    const targetWorldX = nextNode.x * TILE_SIZE + TILE_SIZE / 2;
    const targetWorldY = nextNode.y * TILE_SIZE + TILE_SIZE / 2;

    const dx = targetWorldX - this.x;
    const dy = targetWorldY - this.y;
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

  takeDamage(amount: number): boolean {
    this.health -= amount;
    // Flash đỏ
    this.scene.tweens.add({
      targets: this,
      tint: 0xff0000,
      duration: 100,
      yoyo: true,
      onComplete: () => { this.clearTint(); }
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
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 400,
      onComplete: () => { this.destroy(); }
    });
  }

  getState(): EnemyState {
    return this.fsmState;
  }
}
