import Phaser from 'phaser';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../utils/MapGenerator';

export class EchoSystem {
  private scene: Phaser.Scene;
  private fogLayer: Phaser.GameObjects.Graphics;
  private echoRings: Phaser.GameObjects.Graphics[] = [];

  // Lưu trạng thái sáng của mỗi tile
  private litTiles: boolean[][] = [];
  private litTimer: number[][] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    // Fog layer ở trên tilemap nhưng dưới UI
    this.fogLayer = scene.add.graphics();
    this.fogLayer.setDepth(10);

    // Khởi tạo mảng
    for (let y = 0; y < MAP_HEIGHT; y++) {
      this.litTiles[y] = [];
      this.litTimer[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        this.litTiles[y][x] = false;
        this.litTimer[y][x] = 0;
      }
    }
  }

  // Phát sóng âm từ vị trí (worldX, worldY) với bán kính R ô, tồn tại duration ms
  emitEcho(worldX: number, worldY: number, radiusTiles: number, duration: number): void {
    const tileX = Math.floor(worldX / TILE_SIZE);
    const tileY = Math.floor(worldY / TILE_SIZE);
    const now = this.scene.time.now;
    const expireAt = now + duration;

    // Làm sáng các tile trong vùng
    for (let dy = -Math.ceil(radiusTiles); dy <= Math.ceil(radiusTiles); dy++) {
      for (let dx = -Math.ceil(radiusTiles); dx <= Math.ceil(radiusTiles); dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radiusTiles) {
          const tx = tileX + dx;
          const ty = tileY + dy;
          if (tx >= 0 && ty >= 0 && tx < MAP_WIDTH && ty < MAP_HEIGHT) {
            this.litTiles[ty][tx] = true;
            this.litTimer[ty][tx] = Math.max(this.litTimer[ty][tx], expireAt);
          }
        }
      }
    }

    // Hiệu ứng vòng tròn lan tỏa
    this.spawnEchoRingEffect(worldX, worldY, radiusTiles);
  }

  private spawnEchoRingEffect(worldX: number, worldY: number, radiusTiles: number): void {
    const maxRadius = radiusTiles * TILE_SIZE;
    // Outer ring
    this.spawnSingleRing(worldX, worldY, maxRadius, 0x00ffff, 650, 0);
    // Inner ring with slight delay
    this.spawnSingleRing(worldX, worldY, maxRadius * 0.6, 0x33ffcc, 420, 80);
  }

  private spawnSingleRing(
    worldX: number, worldY: number,
    maxRadius: number, color: number,
    duration: number, delayMs: number
  ): void {
    this.scene.time.delayedCall(delayMs, () => {
      const ring = this.scene.add.graphics();
      ring.setDepth(9);
      this.scene.tweens.add({
        targets: { r: 0, alpha: 0.85 },
        r: maxRadius,
        alpha: 0,
        duration,
        ease: 'Sine.easeOut',
        onUpdate: (_tween: Phaser.Tweens.Tween, target: { r: number; alpha: number }) => {
          ring.clear();
          ring.lineStyle(2, color, target.alpha);
          ring.strokeCircle(worldX, worldY, target.r);
          ring.fillStyle(color, target.alpha * 0.07);
          ring.fillCircle(worldX, worldY, target.r);
        },
        onComplete: () => ring.destroy()
      });
    });
  }

  update(): void {
    const now = this.scene.time.now;

    // Cập nhật trạng thái lit
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (this.litTiles[y][x] && this.litTimer[y][x] < now) {
          this.litTiles[y][x] = false;
        }
      }
    }

    // Vẽ lại fog
    this.redrawFog();
  }

  private redrawFog(): void {
    this.fogLayer.clear();

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (!this.litTiles[y][x]) {
          // Dark navy-black fog
          this.fogLayer.fillStyle(0x00001a, 0.96);
          this.fogLayer.fillRect(
            x * TILE_SIZE, y * TILE_SIZE,
            TILE_SIZE, TILE_SIZE
          );
        }
      }
    }
  }

  isTileLit(tileX: number, tileY: number): boolean {
    if (tileX < 0 || tileY < 0 || tileX >= MAP_WIDTH || tileY >= MAP_HEIGHT) return false;
    return this.litTiles[tileY][tileX];
  }

  destroy(): void {
    this.fogLayer.destroy();
    this.echoRings.forEach(r => r.destroy());
  }
}
