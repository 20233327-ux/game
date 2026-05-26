export interface WeaponConfig {
  id: string;
  name: string;
  damage: number;
  cooldown: number;        // ms between shots
  bulletSpeed: number;
  bulletCount: number;     // bullets per shot
  spreadAngle: number;     // total spread in radians (0 = perfectly accurate)
  bulletLifetime: number;  // ms bullet lives
  echoRadius: number;
  echoDuration: number;
  bulletTint: number;
  bulletScale: number;
  description: string;
}

export const WEAPONS: WeaponConfig[] = [
  {
    id: 'pistol',
    name: 'PISTOL',
    damage: 35,        // 35 dmg × 1 / 0.28s ≈ 125 DPS  — reliable mid-range
    cooldown: 280,
    bulletSpeed: 440,
    bulletCount: 1,
    spreadAngle: 0,
    bulletLifetime: 1600,
    echoRadius: 3,
    echoDuration: 2000,
    bulletTint: 0xffffff,
    bulletScale: 1.1,
    description: 'Cân bằng, tin cậy'
  },
  {
    id: 'shotgun',
    name: 'SHOTGUN',
    damage: 26,        // 26 dmg × 5 / 0.72s ≈ 180 DPS full-spread — up-close destroyer
    cooldown: 720,
    bulletSpeed: 290,
    bulletCount: 5,
    spreadAngle: 0.44,
    bulletLifetime: 680,
    echoRadius: 5,
    echoDuration: 2600,
    bulletTint: 0xff8800,
    bulletScale: 0.9,
    description: '5 đạn, công phá cực gần'
  },
  {
    id: 'rifle',
    name: 'RIFLE',
    damage: 90,        // 90 dmg / 0.82s ≈ 110 DPS — highest single-shot burst
    cooldown: 820,
    bulletSpeed: 800,
    bulletCount: 1,
    spreadAngle: 0,
    bulletLifetime: 2400,
    echoRadius: 4,
    echoDuration: 2200,
    bulletTint: 0x00eeff,
    bulletScale: 1.6,
    description: 'Damage cao, tầm xa xuyên phòng'
  },
  {
    id: 'smg',
    name: 'SMG',
    damage: 19,        // 19 dmg / 0.10s ≈ 190 DPS — fastest DPS with spread
    cooldown: 100,
    bulletSpeed: 400,
    bulletCount: 1,
    spreadAngle: 0.07,
    bulletLifetime: 1100,
    echoRadius: 2,
    echoDuration: 1500,
    bulletTint: 0xff66ff,
    bulletScale: 0.8,
    description: 'Bắn nhanh, DPS cao nhất'
  }
];

export function getWeaponById(id: string): WeaponConfig | undefined {
  return WEAPONS.find(w => w.id === id);
}
