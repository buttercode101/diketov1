import { Level, Cosmetic } from '../types';

export const PALETTE = {
  ochre: '#C8782A',
  terracotta: '#A0522D',
  sand: '#D4B483',
  earth: '#6B4226',
  gho: '#E8D5A0',
  stone: '#9A8870',
  stoneAlt: '#7A6850',
  hole: '#120804',
  holeRim: '#3A2010',
  success: '#4CAF50',
  foul: '#E53935',
  gold: '#FFD700',
  ink: '#0A0502',
};

export const ORGANIC_SHAPES = [
  '40% 60% 70% 30% / 40% 50% 60% 50%',
  '50% 50% 30% 70% / 60% 40% 60% 40%',
  '70% 30% 50% 50% / 30% 30% 70% 70%',
  '30% 70% 70% 30% / 30% 30% 70% 70%',
  '60% 40% 50% 50% / 50% 50% 40% 60%',
];

export const LEVELS: Level[] = Array.from({ length: 20 }, (_, i) => {
  const level = i + 1;
  const isTier2 = level > 10;
  return {
    level,
    scoop: isTier2 ? level - 10 : level,
    speedMult: isTier2 ? 1.3 : 1.0,
    scatter: isTier2,
    label: `LEVEL ${level}`,
  };
});

export const COSMETICS: Cosmetic[] = [
  { id: 'default', name: 'River Stone', cost: 0, colors: [PALETTE.stone, PALETTE.stoneAlt, '#1A1A1A'] },
  { id: 'obsidian', name: 'Obsidian', cost: 100, colors: ['#2A2A2A', '#111111', '#000000'] },
  { id: 'jade', name: 'Jade', cost: 250, colors: ['#4A7C59', '#2F4F4F', '#1A2F1A'] },
  { id: 'amethyst', name: 'Amethyst', cost: 500, colors: ['#9966CC', '#4B0082', '#2A004D'] },
  { id: 'gold', name: "Fool's Gold", cost: 1000, colors: [PALETTE.gold, '#DAA520', '#8B6508'] },
];

export const GAME_TIMING = {
  BASE_AIR_TIME: 1200,
  TURN_TIMER: 10,
  FOUL_DISPLAY: 2500,
  LEVEL_TRANSITION: 2000,
};

export const ARENA_LAYOUT = {
  HOLE_X: 0.45,
  HOLE_Y: 0.35,
  GHO_X: 0.75,
  GHO_Y: 0.82,
  TRAY_X: 0.25,
  TRAY_Y: 0.82,
  HOLE_SIZE: 110,
  GHO_SIZE: 76,
  STONE_SIZE: 30,
};

export const STORAGE_KEYS = {
  HIGH_SCORE: 'diketo_highscore',
  DUST: 'diketo_dust',
  UNLOCKED: 'diketo_unlocked',
  EQUIPPED: 'diketo_equipped',
};

export const VIBRATION = {
  TOSS: 15,
  SCOOP: 10,
  CATCH: [20, 30, 20],
  FOUL: [50, 50, 50],
  WIN: [100, 50, 100, 50, 100],
};
