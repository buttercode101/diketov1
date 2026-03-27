// Diketo Types
export type Phase = 'MENU' | 'TUTORIAL' | 'PLAYING' | 'FOUL' | 'LEVEL_COMPLETE' | 'GAME_OVER' | 'VICTORY' | 'SHOP' | 'ACHIEVEMENTS' | 'STATS';
export type Mode = 'SINGLE' | 'ENDLESS';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface Stone {
  id: number;
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  state: 'hole' | 'scooped' | 'out';
  rot: number;
  shape: string;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  type: 'dust' | 'spark';
}

export interface Level {
  level: number;
  scoop: number;
  speedMult: number;
  scatter: boolean;
  label: string;
}

export interface Cosmetic {
  id: string;
  name: string;
  cost: number;
  colors: string[];
  unlocked: boolean;
  equipped: boolean;
}

export interface BoardTheme {
  id: string;
  name: string;
  background: string;
  hole: string;
  holeRim: string;
  cost: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'progression' | 'skill' | 'collection' | 'dedication';
  requirement: number;
  progress: number;
  unlocked: boolean;
  reward?: {
    type: 'dust' | 'cosmetic' | 'title';
    value: number | string;
  };
}

export interface GameStats {
  totalGames: number;
  highScore: number;
  totalDustEarned: number;
  totalDustSpent: number;
  levelsCompleted: number;
  perfectCatches: number;
  foulsCommitted: number;
  bestCombo: number;
  totalPlayTime: number;
  averageCatchTime: number;
  favoriteStone: string;
}

export interface StreakData {
  currentStreak: number;
  lastLogin: string;
  totalLogins: number;
  bestStreak: number;
}

export interface DailyChallenge {
  id: string;
  description: string;
  target: number;
  progress: number;
  reward: number;
  completed: boolean;
  expiresAt: string;
}

export interface TutorialState {
  currentStep: number;
  completed: boolean;
  skipped: boolean;
}

export interface GameSettings {
  sound: boolean;
  music: boolean;
  haptics: boolean;
  difficulty: Difficulty;
  stoneTheme: string;
  boardTheme: string;
}
