// GameManager Singleton - quản lý toàn bộ trạng thái game
export class GameManager {
  private static instance: GameManager;

  public score: number = 0;
  public highScore: number = 0;
  public health: number = 100;
  public maxHealth: number = 100;
  public currentLevel: number = 1;
  public keysCollected: number = 0;
  public keysRequired: number = 1;

  // Weapon system (persists across levels)
  public unlockedWeaponIds: string[] = ['pistol'];
  public currentWeaponId: string = 'pistol';

  private constructor() {
    this.highScore = parseInt(localStorage.getItem('echoDungeonHighScore') || '0');
  }

  static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  addScore(points: number): void {
    this.score += points;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('echoDungeonHighScore', String(this.highScore));
    }
  }

  takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
  }

  heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  collectKey(): void {
    this.keysCollected++;
    this.addScore(50);
  }

  isLevelComplete(): boolean {
    return this.keysCollected >= this.keysRequired;
  }

  isDead(): boolean {
    return this.health <= 0;
  }

  nextLevel(): void {
    this.currentLevel++;
    this.keysCollected = 0;
    this.keysRequired = Math.min(3, this.currentLevel);
    // Restore 30 HP on level-up (capped at maxHealth)
    this.heal(30);
  }

  reset(): void {
    this.score = 0;
    this.health = 100;
    this.maxHealth = 100;
    this.currentLevel = 1;
    this.keysCollected = 0;
    this.keysRequired = 1;
    this.unlockedWeaponIds = ['pistol'];
    this.currentWeaponId = 'pistol';
  }
}
