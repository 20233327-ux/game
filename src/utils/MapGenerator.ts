// Sinh bản đồ bằng Random Walk Algorithm
export const TILE_SIZE = 32;
export const MAP_WIDTH = 25;
export const MAP_HEIGHT = 25;

export const TILE_WALL = 1;
export const TILE_FLOOR = 0;

export interface MapData {
  tiles: number[][];
  floorTiles: { x: number; y: number }[];
  spawnPoint: { x: number; y: number };
  exitPoint: { x: number; y: number };
  keyPoints: { x: number; y: number }[];
  enemySpawns: { x: number; y: number }[];
}

export function generateMap(numKeys: number = 1): MapData {
  // Khởi tạo tất cả là tường
  const tiles: number[][] = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    tiles[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      tiles[y][x] = TILE_WALL;
    }
  }

  // Random Walk để tạo sàn
  let cx = Math.floor(MAP_WIDTH / 2);
  let cy = Math.floor(MAP_HEIGHT / 2);
  const steps = 300;
  const dirs = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 }
  ];

  tiles[cy][cx] = TILE_FLOOR;

  for (let i = 0; i < steps; i++) {
    const dir = dirs[Math.floor(Math.random() * dirs.length)];
    const nx = Phaser.Math.Clamp(cx + dir.dx, 1, MAP_WIDTH - 2);
    const ny = Phaser.Math.Clamp(cy + dir.dy, 1, MAP_HEIGHT - 2);
    cx = nx;
    cy = ny;
    tiles[cy][cx] = TILE_FLOOR;

    // Mở rộng thêm 1 ô để phòng rộng hơn
    if (Math.random() < 0.4) {
      const dir2 = dirs[Math.floor(Math.random() * dirs.length)];
      const nx2 = Phaser.Math.Clamp(cx + dir2.dx, 1, MAP_WIDTH - 2);
      const ny2 = Phaser.Math.Clamp(cy + dir2.dy, 1, MAP_HEIGHT - 2);
      tiles[ny2][nx2] = TILE_FLOOR;
    }
  }

  // Thu thập danh sách tile sàn
  const floorTiles: { x: number; y: number }[] = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (tiles[y][x] === TILE_FLOOR) {
        floorTiles.push({ x, y });
      }
    }
  }

  // Shuffle floor tiles để lấy random
  const shuffled = [...floorTiles].sort(() => Math.random() - 0.5);

  const spawnPoint = shuffled[0];
  const exitPoint = shuffled[Math.floor(shuffled.length * 0.8)];

  const keyPoints: { x: number; y: number }[] = [];
  for (let i = 0; i < numKeys; i++) {
    const idx = Math.floor(shuffled.length * 0.3) + i * 10;
    keyPoints.push(shuffled[Math.min(idx, shuffled.length - 1)]);
  }

  // Spawn enemy ở xa spawn player
  const enemySpawns: { x: number; y: number }[] = [];
  for (let i = 0; i < 5 + numKeys * 2; i++) {
    const idx = Math.floor(shuffled.length * 0.4) + i * 5;
    const ep = shuffled[Math.min(idx, shuffled.length - 1)];
    // Đảm bảo cách xa spawn
    const dist = Math.abs(ep.x - spawnPoint.x) + Math.abs(ep.y - spawnPoint.y);
    if (dist > 5) {
      enemySpawns.push(ep);
    }
  }

  return { tiles, floorTiles, spawnPoint, exitPoint, keyPoints, enemySpawns };
}

// A* Pathfinding
export interface PathNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

export function findPath(
  tiles: number[][],
  startX: number,
  startY: number,
  endX: number,
  endY: number
): { x: number; y: number }[] {
  const openList: PathNode[] = [];
  const closedSet = new Set<string>();

  const heuristic = (x: number, y: number) =>
    Math.abs(x - endX) + Math.abs(y - endY);

  const startNode: PathNode = {
    x: startX, y: startY,
    g: 0, h: heuristic(startX, startY),
    f: heuristic(startX, startY),
    parent: null
  };
  openList.push(startNode);

  const dirs = [
    { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
    { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
  ];

  while (openList.length > 0) {
    // Tìm node có f nhỏ nhất
    let lowestIdx = 0;
    for (let i = 1; i < openList.length; i++) {
      if (openList[i].f < openList[lowestIdx].f) lowestIdx = i;
    }
    const current = openList[lowestIdx];

    if (current.x === endX && current.y === endY) {
      // Truy vết đường đi
      const path: { x: number; y: number }[] = [];
      let node: PathNode | null = current;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path;
    }

    openList.splice(lowestIdx, 1);
    closedSet.add(`${current.x},${current.y}`);

    for (const dir of dirs) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      if (nx < 0 || ny < 0 || nx >= MAP_WIDTH || ny >= MAP_HEIGHT) continue;
      if (tiles[ny][nx] === TILE_WALL) continue;
      if (closedSet.has(`${nx},${ny}`)) continue;

      const g = current.g + 1;
      const h = heuristic(nx, ny);
      const existing = openList.find(n => n.x === nx && n.y === ny);
      if (existing) {
        if (g < existing.g) {
          existing.g = g;
          existing.f = g + existing.h;
          existing.parent = current;
        }
      } else {
        openList.push({ x: nx, y: ny, g, h, f: g + h, parent: current });
      }
    }

    // Giới hạn để tránh lag
    if (openList.length > 500) break;
  }

  return [];
}
