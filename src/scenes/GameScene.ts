import Phaser from 'phaser';
import { GameManager } from '../managers/GameManager';
import { EchoSystem } from '../systems/EchoSystem';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { AllyBot } from '../entities/AllyBot';
import { Boss } from '../entities/Boss';
import { WEAPONS } from '../entities/Weapon';
import {
  generateMap, MapData,
  TILE_SIZE, MAP_WIDTH, MAP_HEIGHT,
  TILE_WALL, TILE_FLOOR
} from '../utils/MapGenerator';
import { getLevelStory } from '../utils/StoryData';

export class GameScene extends Phaser.Scene {
  private mapData!: MapData;
  public player!: Player;
  private enemies: Enemy[] = [];
  private allies: AllyBot[] = [];
  private echoSystem!: EchoSystem;
  private bullets!: Phaser.Physics.Arcade.Group;
  private allyBullets!: Phaser.Physics.Arcade.Group;
  private wallGroup!: Phaser.Physics.Arcade.StaticGroup;
  private keys: Phaser.Physics.Arcade.StaticGroup[] = [];
  private keyItems!: Phaser.Physics.Arcade.StaticGroup;
  private exitDoor!: Phaser.Physics.Arcade.StaticGroup;
  private healthPacks!: Phaser.Physics.Arcade.StaticGroup;
  private weaponPickups!: Phaser.Physics.Arcade.StaticGroup;
  private allyPickups!: Phaser.Physics.Arcade.StaticGroup;
  private gameManager!: GameManager;
  private isTransitioning: boolean = false;
  public boss: Boss | null = null;
  private lastExitHintTime = 0;
  private bossDeathStoryShown = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.isTransitioning = false;
    this.gameManager = GameManager.getInstance();
    this.enemies = [];
    this.allies = [];

    // Sinh bản đồ
    this.mapData = generateMap(this.gameManager.keysRequired);

    // Thiết lập kích thước world
    const worldW = MAP_WIDTH * TILE_SIZE;
    const worldH = MAP_HEIGHT * TILE_SIZE;
    this.physics.world.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setBounds(0, 0, worldW, worldH);

    // Vẽ tilemap
    this.buildTilemap();

    // Hệ thống Echo
    this.echoSystem = new EchoSystem(this);

    // Bullets group (60 slots: covers shotgun bursts + SMG rapid fire)
    this.bullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 60,
      runChildUpdate: false
    });

    // Ally bullets group
    this.allyBullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 30,
      runChildUpdate: false
    });

    // Spawn player
    const spawnWorldX = this.mapData.spawnPoint.x * TILE_SIZE + TILE_SIZE / 2;
    const spawnWorldY = this.mapData.spawnPoint.y * TILE_SIZE + TILE_SIZE / 2;
    this.player = new Player(this, spawnWorldX, spawnWorldY, this.echoSystem, this.bullets);

    // Camera theo player
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // Screen shake khi player bị thương
    this.events.on('playerDamaged', () => {
      this.cameras.main.shake(180, 0.007);
    });

    // Key items
    this.keyItems = this.physics.add.staticGroup();
    this.mapData.keyPoints.forEach(kp => {
      const kx = kp.x * TILE_SIZE + TILE_SIZE / 2;
      const ky = kp.y * TILE_SIZE + TILE_SIZE / 2;
      const keySprite = this.keyItems.create(kx, ky, 'key') as Phaser.Physics.Arcade.Image;
      this.tweens.add({
        targets: keySprite,
        y: ky - 5,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    // Exit door
    this.exitDoor = this.physics.add.staticGroup();
    const ex = this.mapData.exitPoint.x * TILE_SIZE + TILE_SIZE / 2;
    const ey = this.mapData.exitPoint.y * TILE_SIZE + TILE_SIZE / 2;
    this.exitDoor.create(ex, ey, 'exit');

    // Health packs (3 on map)
    this.healthPacks = this.physics.add.staticGroup();
    const hpFloorPool = [...this.mapData.floorTiles]
      .sort(() => Math.random() - 0.5)
      .filter(t => {
        const d = Math.abs(t.x - this.mapData.spawnPoint.x) + Math.abs(t.y - this.mapData.spawnPoint.y);
        return d > 4;
      })
      .slice(0, 3);
    hpFloorPool.forEach(tile => {
      const hx = tile.x * TILE_SIZE + TILE_SIZE / 2;
      const hy = tile.y * TILE_SIZE + TILE_SIZE / 2;
      const pack = this.healthPacks.create(hx, hy, 'healthpack') as Phaser.Physics.Arcade.Image;
      pack.setDepth(3);
      this.tweens.add({ targets: pack, scaleX: 1.15, scaleY: 1.15, duration: 650, yoyo: true, repeat: -1 });
    });

    // Weapon pickup pool (tiles far from spawn, distinct from HP packs)
    this.weaponPickups = this.physics.add.staticGroup();
    const nonPistolWeapons = WEAPONS.filter(w => w.id !== 'pistol');
    const pickupFloorPool = [...this.mapData.floorTiles]
      .filter(t => {
        const d = Math.abs(t.x - this.mapData.spawnPoint.x) + Math.abs(t.y - this.mapData.spawnPoint.y);
        return d > 7;
      })
      .sort(() => Math.random() - 0.5);

    const numWeaponPickups = this.gameManager.currentLevel >= 3 ? 2 : 1;
    for (let i = 0; i < numWeaponPickups; i++) {
      const tile = pickupFloorPool[i + 10];
      if (!tile) break;
      const wpx = tile.x * TILE_SIZE + TILE_SIZE / 2;
      const wpy = tile.y * TILE_SIZE + TILE_SIZE / 2;
      // Level 1: only shotgun or smg; higher levels: any
      const candidates = this.gameManager.currentLevel === 1
        ? nonPistolWeapons.filter(w => w.id === 'shotgun' || w.id === 'smg')
        : nonPistolWeapons;
      const weapon = candidates[Math.floor(Math.random() * candidates.length)];
      const wSprite = this.weaponPickups.create(wpx, wpy, `weapon_${weapon.id}`) as Phaser.Physics.Arcade.Image;
      wSprite.setDepth(3);
      wSprite.setData('weaponId', weapon.id);
      this.tweens.add({ targets: wSprite, angle: 360, duration: 2800, repeat: -1 });
    }

    // Ally pickup (1 per map)
    this.allyPickups = this.physics.add.staticGroup();
    const allyTile = pickupFloorPool[25];
    if (allyTile) {
      const apx = allyTile.x * TILE_SIZE + TILE_SIZE / 2;
      const apy = allyTile.y * TILE_SIZE + TILE_SIZE / 2;
      const aSprite = this.allyPickups.create(apx, apy, 'allypickup') as Phaser.Physics.Arcade.Image;
      aSprite.setDepth(3);
      this.tweens.add({ targets: aSprite, y: apy - 6, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // Spawn enemies
    this.mapData.enemySpawns.forEach(sp => {
      const wx = sp.x * TILE_SIZE + TILE_SIZE / 2;
      const wy = sp.y * TILE_SIZE + TILE_SIZE / 2;
      const enemy = new Enemy(this, wx, wy, this.mapData.tiles, this.echoSystem, this.gameManager.currentLevel);
      enemy.setPlayerReference(this.player);
      this.enemies.push(enemy);
    });

    // Spawn boss on a floor tile 3-7 tiles from the exit
    this.boss = null;
    const exitTX = this.mapData.exitPoint.x;
    const exitTY = this.mapData.exitPoint.y;
    const bossSpawnTile = this.mapData.floorTiles
      .filter(t => {
        const d = Math.sqrt((t.x - exitTX) ** 2 + (t.y - exitTY) ** 2);
        return d >= 3 && d <= 7;
      })
      .sort((a, b) =>
        (Math.abs(a.x - exitTX) + Math.abs(a.y - exitTY)) -
        (Math.abs(b.x - exitTX) + Math.abs(b.y - exitTY))
      )[0] ?? this.mapData.exitPoint;
    const bossX = bossSpawnTile.x * TILE_SIZE + TILE_SIZE / 2;
    const bossY = bossSpawnTile.y * TILE_SIZE + TILE_SIZE / 2;
    this.boss = new Boss(this, bossX, bossY, this.player, this.echoSystem, this.gameManager.currentLevel);
    // Boss bullets vs wall (permanent collider)
    this.physics.add.collider(this.boss.getBossBullets(), this.wallGroup, (bb) => {
      (bb as Phaser.Physics.Arcade.Image).setActive(false).setVisible(false);
    });

    // Colliders
    this.setupColliders();

    // Combat event handlers
    this.events.on('playerMelee', (x: number, y: number, radius: number) => {
      for (const enemy of this.enemies) {
        if (enemy.isDead || !enemy.active) continue;
        const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
        if (dist <= radius) {
          const killed = enemy.takeDamage(45);
          const dx = enemy.x - x;
          const dy = enemy.y - y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          (enemy.body as Phaser.Physics.Arcade.Body).setVelocity((dx / len) * 240, (dy / len) * 240);
          if (killed) {
            this.gameManager.addScore(10);
            this.showPopup('+10', enemy.x, enemy.y - 20, '#ff8800');
            this.spawnDeathSparks(enemy.x, enemy.y);
            if (Math.random() < 0.3) this.spawnDroppedHealthPack(enemy.x, enemy.y);
          }
        }
      }
      if (this.boss && !this.boss.isDead) {
        const dist = Phaser.Math.Distance.Between(x, y, this.boss.x, this.boss.y);
        if (dist <= radius + 24) {
          const killed = this.boss.takeDamage(45);
          this.showPopup('-45', this.boss.x, this.boss.y - 25, '#ffee00');
          if (killed) {
            this.gameManager.addScore(100);
            this.showPopup('BOSS TIÊU DIỆT! +100', x, y - 50, '#ffaa00');
            this.showBossDeathStory();
          }
        }
      }
    });

    this.events.on('playerEchoBlast', (x: number, y: number, radius: number) => {
      let hitCount = 0;
      for (const enemy of this.enemies) {
        if (enemy.isDead || !enemy.active) continue;
        const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
        if (dist <= radius) {
          const killed = enemy.takeDamage(60);
          hitCount++;
          if (killed) {
            this.gameManager.addScore(10);
            this.showPopup('+10', enemy.x, enemy.y - 20, '#ff8800');
            this.spawnDeathSparks(enemy.x, enemy.y);
            if (Math.random() < 0.3) this.spawnDroppedHealthPack(enemy.x, enemy.y);
          }
        }
      }
      if (this.boss && !this.boss.isDead) {
        const dist = Phaser.Math.Distance.Between(x, y, this.boss.x, this.boss.y);
        if (dist <= radius + 24) {
          const killed = this.boss.takeDamage(60);
          this.showPopup('-60 BOSS', this.boss.x, this.boss.y - 25, '#00ffee');
          if (killed) {
            this.gameManager.addScore(100);
            this.showPopup('BOSS TIÊU DIỆT! +100', x, y - 50, '#ffaa00');
            this.showBossDeathStory();
          }
        }
      }
      if (hitCount > 0) this.showPopup(`×${hitCount} HIT!`, x, y - 35, '#00ffee');
    });

    this.events.on('playerLowMana', () => {
      this.showPopup('THIẾU MANA!', this.player.x, this.player.y - 20, '#4488ff');
    });

    this.events.on('bossSlam', (bx: number, by: number, radius: number) => {
      const dist = Phaser.Math.Distance.Between(bx, by, this.player.x, this.player.y);
      if (dist <= radius) this.player.takeDamage(25);
    });

    // ── Sonic Burst (R) — cone damage ──
    this.events.on('playerSonicBurst', (x: number, y: number, angle: number, halfSpread: number, range: number) => {
      const cosHS = Math.cos(halfSpread);
      const cx = Math.cos(angle), cy = Math.sin(angle);
      let hitCount = 0;
      for (const enemy of this.enemies) {
        if (enemy.isDead || !enemy.active) continue;
        const ex = enemy.x - x, ey = enemy.y - y;
        const dist = Math.sqrt(ex * ex + ey * ey);
        if (dist > range || dist < 0.1) continue;
        if ((ex / dist) * cx + (ey / dist) * cy < cosHS) continue; // outside cone
        const killed = enemy.takeDamage(55);
        hitCount++;
        (enemy.body as Phaser.Physics.Arcade.Body).setVelocity((ex / dist) * 230, (ey / dist) * 230);
        if (killed) {
          this.gameManager.addScore(10);
          this.showPopup('+10', enemy.x, enemy.y - 20, '#44bbff');
          this.spawnDeathSparks(enemy.x, enemy.y);
          if (Math.random() < 0.3) this.spawnDroppedHealthPack(enemy.x, enemy.y);
        }
      }
      if (this.boss && !this.boss.isDead) {
        const bx2 = this.boss.x - x, by2 = this.boss.y - y;
        const bd = Math.sqrt(bx2 * bx2 + by2 * by2);
        if (bd <= range + 20 && bd > 0.1 &&
            (bx2 / bd) * cx + (by2 / bd) * cy >= cosHS - 0.15) {
          const killed = this.boss.takeDamage(55);
          this.showPopup('-55', this.boss.x, this.boss.y - 25, '#44bbff');
          if (killed) {
            this.gameManager.addScore(100);
            this.showPopup('BOSS TIÊU DIỆT! +100', x, y - 50, '#ffaa00');
            this.showBossDeathStory();
          }
        }
      }
      if (hitCount > 1) this.showPopup(`×${hitCount}`, x, y - 35, '#44bbff');
    });

    // ── Shadow Step (F) — knockback nearby enemies ──
    this.events.on('playerShadowStep', (nx: number, ny: number, radius: number) => {
      for (const enemy of this.enemies) {
        if (enemy.isDead || !enemy.active) continue;
        const dist = Phaser.Math.Distance.Between(nx, ny, enemy.x, enemy.y);
        if (dist > radius) continue;
        const dx = enemy.x - nx, dy = enemy.y - ny;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        (enemy.body as Phaser.Physics.Arcade.Body).setVelocity((dx / len) * 330, (dy / len) * 330);
      }
      if (this.boss && !this.boss.isDead) {
        const dist = Phaser.Math.Distance.Between(nx, ny, this.boss.x, this.boss.y);
        if (dist <= radius + 20) {
          const bx2 = this.boss.x - nx, by2 = this.boss.y - ny;
          const len = Math.sqrt(bx2 * bx2 + by2 * by2) || 1;
          (this.boss.body as Phaser.Physics.Arcade.Body).setVelocity((bx2 / len) * 220, (by2 / len) * 220);
        }
      }
    });

    // Render order
    this.keyItems.setDepth(3);
    this.exitDoor.setDepth(3);
    this.healthPacks.setDepth(3);

    // Story level intro
    this.showLevelIntro();
  }

  private buildTilemap(): void {
    this.wallGroup = this.physics.add.staticGroup();

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const wx = x * TILE_SIZE + TILE_SIZE / 2;
        const wy = y * TILE_SIZE + TILE_SIZE / 2;
        const tileType = this.mapData.tiles[y][x];

        // Vẽ sàn trước
        this.add.image(wx, wy, tileType === TILE_FLOOR ? 'floor' : 'wall').setDepth(0);

        // Chỉ thêm vật lý cho tường
        if (tileType === TILE_WALL) {
          const wallImg = this.wallGroup.create(wx, wy, 'wall') as Phaser.Physics.Arcade.Image;
          wallImg.setVisible(false); // Ẩn vì đã vẽ image tĩnh ở trên
          wallImg.refreshBody();
        }
      }
    }
  }

  private setupColliders(): void {
    // Player vs Tường
    this.physics.add.collider(this.player, this.wallGroup);

    // Enemies vs Tường
    // (sẽ loop qua enemies trong update)

    // Bullet vs Tường -> destroy bullet
    this.physics.add.collider(this.bullets, this.wallGroup, (bullet) => {
      (bullet as Phaser.Physics.Arcade.Image).setActive(false).setVisible(false);
    });

    // Player vs Key
    this.physics.add.overlap(this.player, this.keyItems, (_player, key) => {
      (key as Phaser.Physics.Arcade.Image).destroy();
      this.gameManager.collectKey();
      this.showPopup('+50 KEY!', this.player.x, this.player.y - 20, '#ffd700');
      this.echoSystem.emitEcho(this.player.x, this.player.y, 4, 3000);
    });

    // Player vs Health Pack
    this.physics.add.overlap(this.player, this.healthPacks, (_p, pack) => {
      const hp = pack as Phaser.Physics.Arcade.Image;
      if (!hp.active) return;
      hp.destroy();
      this.gameManager.heal(25);
      this.showPopup('+25 HP', this.player.x, this.player.y - 20, '#ff6666');
    });

    // Player vs Exit
    this.physics.add.overlap(this.player, this.exitDoor, () => {
      if (this.boss && !this.boss.isDead) {
        if (this.time.now - this.lastExitHintTime > 2500) {
          this.lastExitHintTime = this.time.now;
          this.showPopup('ĐÁNH BẠI BOSS TRƯỚC!', this.player.x, this.player.y - 20, '#ff4400');
        }
        return;
      }
      if (this.gameManager.isLevelComplete() && !this.isTransitioning) {
        this.nextLevel();
      }
    });

    // Ally bullets vs wall
    this.physics.add.collider(this.allyBullets, this.wallGroup, (ab) => {
      (ab as Phaser.Physics.Arcade.Image).setActive(false).setVisible(false);
    });

    // Player vs Weapon pickup
    this.physics.add.overlap(this.player, this.weaponPickups, (_p, pickup) => {
      const p = pickup as Phaser.Physics.Arcade.Image;
      if (!p.active) return;
      const weaponId = p.getData('weaponId') as string;
      p.destroy();
      this.player.unlockWeapon(weaponId);
      const wName = WEAPONS.find(w => w.id === weaponId)?.name ?? weaponId;
      this.showPopup(`${wName}!`, this.player.x, this.player.y - 20, '#ffcc00');
      this.echoSystem.emitEcho(this.player.x, this.player.y, 4, 2200);
    });

    // Player vs Ally pickup
    this.physics.add.overlap(this.player, this.allyPickups, (_p, pickup) => {
      const p = pickup as Phaser.Physics.Arcade.Image;
      if (!p.active) return;
      if (this.allies.length >= 2) {
        this.showPopup('MAX 2 ALLIES', this.player.x, this.player.y - 20, '#aaaaaa');
        return;
      }
      p.destroy();
      this.spawnAllyBot(this.player.x + 32, this.player.y + 32);
      this.showPopup('ALLY +1!', this.player.x, this.player.y - 20, '#44ffaa');
    });
  }

  update(): void {
    if (this.isTransitioning) return;

    const gm = this.gameManager;

    // Kiểm tra game over
    if (gm.isDead()) {
      this.triggerGameOver(false);
      return;
    }

    // Cập nhật echo system
    this.echoSystem.update();

    // Cập nhật enemies + kiểm tra collider dynamically
    this.enemies = this.enemies.filter(e => !e.isDead && e.active);
    for (const enemy of this.enemies) {
      // Enemy vs tường
      this.physics.collide(enemy as unknown as Phaser.Types.Physics.Arcade.ArcadeColliderType, this.wallGroup);

      // Bullet vs enemy (damage from getData, fallback 30)
      this.physics.overlap(this.bullets, enemy as unknown as Phaser.Types.Physics.Arcade.ArcadeColliderType, (en, bullet) => {
        const b = bullet as Phaser.Physics.Arcade.Image;
        const e = en as unknown as Enemy;
        if (!b.active || e.isDead) return;
        b.setActive(false).setVisible(false);
        const dmg = (b.getData('damage') as number | undefined) ?? 30;
        const killed = e.takeDamage(dmg);
        if (killed) {
          gm.addScore(10);
          this.showPopup('+10', e.x, e.y - 20, '#ff8800');
          this.echoSystem.emitEcho(e.x, e.y, 2, 1500);
          this.spawnDeathSparks(e.x, e.y);
          if (Math.random() < 0.3) this.spawnDroppedHealthPack(e.x, e.y);
        }
      });

      // Player vs enemy overlap -> damage
      this.physics.overlap(this.player as unknown as Phaser.Types.Physics.Arcade.ArcadeColliderType, enemy as unknown as Phaser.Types.Physics.Arcade.ArcadeColliderType, () => {
        if (!enemy.isDead) {
          this.player.takeDamage(20);
          // Knock back enemy
          const dx = enemy.x - this.player.x;
          const dy = enemy.y - this.player.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          (enemy.body as Phaser.Physics.Arcade.Body).setVelocity(
            (dx / len) * 150,
            (dy / len) * 150
          );
        }
      });

      // Enemy nghe sóng âm của player: kiểm tra echo broadcast
      // (Thực hiện ở EchoSystem – enemy đã nghe qua event hoặc proximity)
    }

    // ===== ALLY MANAGEMENT =====
    this.allies = this.allies.filter(a => !a.isDead && a.active);
    for (const ally of this.allies) {
      this.physics.collide(
        ally as unknown as Phaser.Types.Physics.Arcade.ArcadeColliderType,
        this.wallGroup
      );
      for (const enemy of this.enemies) {
        // Ally bullets hit enemy
        this.physics.overlap(
          this.allyBullets,
          enemy as unknown as Phaser.Types.Physics.Arcade.ArcadeColliderType,
          (en, allyBullet) => {
            const b = allyBullet as Phaser.Physics.Arcade.Image;
            const e = en as unknown as Enemy;
            if (!b.active || e.isDead) return;
            b.setActive(false).setVisible(false);
            const dmg = (b.getData('damage') as number | undefined) ?? 25;
            const killed = e.takeDamage(dmg);
            if (killed) {
              gm.addScore(5);
              this.showPopup('+5', e.x, e.y - 20, '#44ffaa');
              this.echoSystem.emitEcho(e.x, e.y, 2, 1200);
              this.spawnDeathSparks(e.x, e.y);
              if (Math.random() < 0.2) this.spawnDroppedHealthPack(e.x, e.y);
            }
          }
        );
        // Enemy contact damages ally
        this.physics.overlap(
          ally as unknown as Phaser.Types.Physics.Arcade.ArcadeColliderType,
          enemy as unknown as Phaser.Types.Physics.Arcade.ArcadeColliderType,
          () => {
            if (!enemy.isDead && !ally.isDead) ally.takeDamage(8);
          }
        );
      }
    }

    // Boss physics & combat
    this.updateBoss();
  }
  private updateBoss(): void {
    if (!this.boss || this.boss.isDead) return;
    const boss = this.boss;
    const gm = this.gameManager;

    this.physics.collide(
      boss as unknown as Phaser.Types.Physics.Arcade.ArcadeColliderType,
      this.wallGroup
    );
    // Player bullets vs boss
    this.physics.overlap(
      this.bullets,
      boss as unknown as Phaser.Types.Physics.Arcade.ArcadeColliderType,
      (_b, bullet) => {
        const b = bullet as Phaser.Physics.Arcade.Image;
        if (!b.active || boss.isDead) return;
        b.setActive(false).setVisible(false);
        const dmg = (b.getData('damage') as number | undefined) ?? 30;
        const killed = boss.takeDamage(dmg);
        if (killed) {
          gm.addScore(100);
          this.showPopup('BOSS TIÊU DIỆT! +100', boss.x, boss.y - 35, '#ffaa00');
          this.showBossDeathStory();
        }
      }
    );
    // Ally bullets vs boss
    this.physics.overlap(
      this.allyBullets,
      boss as unknown as Phaser.Types.Physics.Arcade.ArcadeColliderType,
      (_b, bullet) => {
        const b = bullet as Phaser.Physics.Arcade.Image;
        if (!b.active || boss.isDead) return;
        b.setActive(false).setVisible(false);
        const dmg = (b.getData('damage') as number | undefined) ?? 25;
        boss.takeDamage(dmg);
      }
    );
    // Boss bullets vs player (Group first → callback: (player, bullet))
    this.physics.overlap(
      boss.getBossBullets(),
      this.player as unknown as Phaser.Types.Physics.Arcade.ArcadeColliderType,
      (pl, bossBullet) => {
        const b = bossBullet as Phaser.Physics.Arcade.Image;
        if (!b.active) return;
        b.setActive(false).setVisible(false);
        (pl as unknown as Player).takeDamage(20);
      }
    );
    // Boss contact damages player
    this.physics.overlap(
      this.player as unknown as Phaser.Types.Physics.Arcade.ArcadeColliderType,
      boss as unknown as Phaser.Types.Physics.Arcade.ArcadeColliderType,
      () => { if (!boss.isDead) this.player.takeDamage(25); }
    );
  }

  // ── Story overlay helpers ──────────────────────────────────────────────

  private showLevelIntro(): void {
    const story = getLevelStory(this.gameManager.currentLevel);
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Dark strip at top of play area (below UI bar)
    const panel = this.add.graphics().setScrollFactor(0).setDepth(50);
    panel.fillStyle(0x000000, 0.80);
    panel.fillRect(0, 78, W, 82);
    panel.lineStyle(1, 0x003344, 0.6);
    panel.lineBetween(0, 160, W, 160);
    panel.setAlpha(0);

    const titleTxt = this.add.text(W / 2, 90, `${story.title}  —  ${story.subtitle}`, {
      fontSize: '18px', color: '#00ffcc', fontFamily: 'Courier New',
      stroke: '#002233', strokeThickness: 2,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(51).setAlpha(0);

    const loreTxt = this.add.text(W / 2, 122, story.lore, {
      fontSize: '12px', color: '#7799aa', fontFamily: 'Courier New', align: 'center',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(51).setAlpha(0);

    this.tweens.add({ targets: panel, alpha: 1, duration: 500 });
    this.tweens.add({ targets: [titleTxt, loreTxt], alpha: 1, duration: 600, delay: 200 });

    this.time.delayedCall(3500, () => {
      this.tweens.add({
        targets: [panel, titleTxt, loreTxt], alpha: 0, duration: 700,
        onComplete: () => { panel.destroy(); titleTxt.destroy(); loreTxt.destroy(); },
      });
    });

    // Boss appearance text — shown after 4.5s
    this.time.delayedCall(4500, () => {
      if (!this.boss || this.boss.isDead) return;
      const bx = W / 2, by = H / 2 - 20;
      const bossBanner = this.add.text(bx, by, `⚡ ${story.bossName}`, {
        fontSize: '22px', color: '#ff4400', fontFamily: 'Courier New',
        stroke: '#1a0000', strokeThickness: 3,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(51).setAlpha(0);
      const bossLore = this.add.text(bx, by + 34, story.bossIntro, {
        fontSize: '12px', color: '#cc7755', fontFamily: 'Courier New', align: 'center',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(51).setAlpha(0);
      this.tweens.add({ targets: [bossBanner, bossLore], alpha: 1, duration: 400 });
      this.cameras.main.shake(220, 0.010);
      this.time.delayedCall(2800, () => {
        this.tweens.add({
          targets: [bossBanner, bossLore], alpha: 0, duration: 600,
          onComplete: () => { bossBanner.destroy(); bossLore.destroy(); },
        });
      });
    });
  }

  private showBossDeathStory(): void {
    if (this.bossDeathStoryShown) return;
    this.bossDeathStoryShown = true;

    const story = getLevelStory(this.gameManager.currentLevel);
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    const defeatBg = this.add.graphics().setScrollFactor(0).setDepth(52);
    defeatBg.fillStyle(0x000000, 0.72);
    defeatBg.fillRect(W / 2 - 260, H / 2 - 50, 520, 90);
    defeatBg.lineStyle(2, 0xffcc44, 0.6);
    defeatBg.strokeRect(W / 2 - 260, H / 2 - 50, 520, 90);
    defeatBg.setAlpha(0);

    const defeatTxt = this.add.text(W / 2, H / 2 - 20, story.bossDefeat, {
      fontSize: '15px', color: '#ffcc44', fontFamily: 'Courier New',
      stroke: '#000000', strokeThickness: 2, align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(53).setAlpha(0);

    this.tweens.add({ targets: [defeatBg, defeatTxt], alpha: 1, duration: 600 });
    this.time.delayedCall(3200, () => {
      this.tweens.add({
        targets: [defeatBg, defeatTxt], alpha: 0, duration: 700,
        onComplete: () => { defeatBg.destroy(); defeatTxt.destroy(); },
      });
    });
  }

  private showPopup(text: string, x: number, y: number, color: string): void {
    const popup = this.add.text(x, y, text, {
      fontSize: '16px',
      color,
      fontFamily: 'Courier New',
      stroke: '#000000',
      strokeThickness: 2
    }).setDepth(15).setOrigin(0.5);

    this.tweens.add({
      targets: popup,
      y: y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => popup.destroy()
    });
  }

  private spawnDeathSparks(px: number, py: number): void {
    const count = 10;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 70 + Math.random() * 130;
      const spark = this.add.image(px, py, 'deathParticle').setDepth(8);
      this.tweens.add({
        targets: spark,
        x: px + Math.cos(angle) * speed * 0.7,
        y: py + Math.sin(angle) * speed * 0.7,
        alpha: 0,
        scale: 0,
        duration: 350 + Math.random() * 200,
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy()
      });
    }
  }

  private spawnDroppedHealthPack(px: number, py: number): void {
    const drop = this.physics.add.staticGroup();
    const packSprite = drop.create(px, py, 'healthpack') as Phaser.Physics.Arcade.Image;
    packSprite.setDepth(3);
    this.tweens.add({ targets: packSprite, scaleX: 1.15, scaleY: 1.15, duration: 650, yoyo: true, repeat: -1 });
    this.physics.add.overlap(
      this.player as unknown as Phaser.Types.Physics.Arcade.ArcadeColliderType,
      drop,
      () => {
        if (packSprite.active) {
          packSprite.destroy();
          this.gameManager.heal(20);
          this.showPopup('+20 HP', this.player.x, this.player.y - 20, '#ff6666');
        }
      }
    );
  }

  private nextLevel(): void {
    this.isTransitioning = true;

    // Flash trắng
    const flash = this.add.graphics();
    flash.fillStyle(0xffffff);
    flash.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
    flash.setScrollFactor(0).setDepth(100).setAlpha(0);

    this.tweens.add({
      targets: flash,
      alpha: 1,
      duration: 300,
      onComplete: () => {
        this.gameManager.nextLevel();
        this.scene.restart();
      }
    });
  }

  private spawnAllyBot(x: number, y: number): void {
    const ally = new AllyBot(
      this, x, y,
      this.mapData.tiles,
      this.echoSystem,
      this.allyBullets,
      this.player,
      () => this.enemies
    );
    this.allies.push(ally);
  }

  private triggerGameOver(win: boolean): void {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    this.time.delayedCall(800, () => {
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene', { win });
    });
  }
}
