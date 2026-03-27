// Game Types
export type Phase = 'MENU' | 'PLAYING' | 'FOUL' | 'LEVEL_COMPLETE' | 'GAME_OVER' | 'VICTORY';
export type Mode = 'SINGLE' | 'VS_AI';
export type Turn = 'PLAYER' | 'AI';
export type StoneState = 'hole' | 'scooped' | 'out';

export interface Stone {
  id: number;
  x: number;
  y: number;
  state: StoneState;
  rot: number;
  shape: string;
  targetX?: number;
  targetY?: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
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
}

export interface GameSettings {
  volume: number;
  haptics: boolean;
  colorblind: boolean;
}

export interface GameStats {
  highScore: number;
  dust: number;
  unlockedCosmetics: string[];
  equippedCosmetic: string;
}
