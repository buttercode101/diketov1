import { Level, Cosmetic, Achievement, BoardTheme, DailyChallenge, TutorialStep } from '../types';

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

// Extended Cosmetics with unlock status
export const COSMETICS: Cosmetic[] = [
  { id: 'default', name: 'River Stone', cost: 0, colors: [PALETTE.stone, PALETTE.stoneAlt, '#1A1A1A'], unlocked: true, equipped: true },
  { id: 'obsidian', name: 'Obsidian', cost: 100, colors: ['#2A2A2A', '#111111', '#000000'], unlocked: false, equipped: false },
  { id: 'jade', name: 'Jade', cost: 250, colors: ['#4A7C59', '#2F4F4F', '#1A2F1A'], unlocked: false, equipped: false },
  { id: 'amethyst', name: 'Amethyst', cost: 500, colors: ['#9966CC', '#4B0082', '#2A004D'], unlocked: false, equipped: false },
  { id: 'gold', name: "Fool's Gold", cost: 1000, colors: [PALETTE.gold, '#DAA520', '#8B6508'], unlocked: false, equipped: false },
  { id: 'ruby', name: 'Ruby', cost: 1500, colors: ['#E0115F', '#8B0000', '#4A0000'], unlocked: false, equipped: false },
  { id: 'sapphire', name: 'Sapphire', cost: 2000, colors: ['#0F52BA', '#00008B', '#00004A'], unlocked: false, equipped: false },
  { id: 'diamond', name: 'Diamond', cost: 5000, colors: ['#B9F2FF', '#E0FFFF', '#F0FFFF'], unlocked: false, equipped: false },
];

// Board Themes
export const BOARD_THEMES: BoardTheme[] = [
  { id: 'classic', name: 'Classic Dirt', background: '#1A0E05', hole: '#120804', holeRim: '#3A2010', cost: 0 },
  { id: 'sacred', name: 'Sacred Sand', background: '#2A1A0A', hole: '#1A0F05', holeRim: '#4A3015', cost: 300 },
  { id: 'royal', name: 'Royal Clay', background: '#3A1A1A', hole: '#2A0F0F', holeRim: '#5A2020', cost: 750 },
  { id: 'golden', name: 'Golden Arena', background: '#3A2A0A', hole: '#2A1F05', holeRim: '#5A4A15', cost: 2000 },
];

export const GAME_TIMING = {
  BASE_AIR_TIME: 1200,
  TURN_TIMER: 10,
  FOUL_DISPLAY: 2500,
  LEVEL_TRANSITION: 2000,
  COMBO_WINDOW: 3000, // Time between catches for combo
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
  STATS: 'diketo_stats',
  ACHIEVEMENTS: 'diketo_achievements',
  STREAK: 'diketo_streak',
  DAILY_REWARDS: 'diketo_daily_rewards',
  DAILY_CHALLENGES: 'diketo_daily_challenges',
  SETTINGS: 'diketo_settings',
  TUTORIAL: 'diketo_tutorial',
  COSMETICS: 'diketo_cosmetics',
  BOARD_THEMES: 'diketo_board_themes',
};

// Achievement Definitions
export const ACHIEVEMENTS: Achievement[] = [
  // Progression
  {
    id: 'first_catch',
    name: 'First Catch',
    description: 'Complete your first level',
    icon: '🎯',
    category: 'progression',
    requirement: 1,
    progress: 0,
    unlocked: false,
    reward: { type: 'dust', value: 50 },
  },
  {
    id: 'halfway',
    name: 'Halfway Hero',
    description: 'Reach level 10',
    icon: '🏔️',
    category: 'progression',
    requirement: 10,
    progress: 0,
    unlocked: false,
    reward: { type: 'dust', value: 200 },
  },
  {
    id: 'master',
    name: 'Diketo Master',
    description: 'Complete all 20 levels',
    icon: '👑',
    category: 'progression',
    requirement: 20,
    progress: 0,
    unlocked: false,
    reward: { type: 'cosmetic', value: 'gold' },
  },
  // Skill
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete a catch with 1 second remaining',
    icon: '⚡',
    category: 'skill',
    requirement: 1,
    progress: 0,
    unlocked: false,
    reward: { type: 'dust', value: 100 },
  },
  {
    id: 'greedy',
    name: 'Greedy Hands',
    description: 'Successfully catch 8 stones in one toss',
    icon: '🤲',
    category: 'skill',
    requirement: 8,
    progress: 0,
    unlocked: false,
    reward: { type: 'dust', value: 150 },
  },
  {
    id: 'perfect',
    name: 'Perfect Game',
    description: 'Complete a level without fouling',
    icon: '💎',
    category: 'skill',
    requirement: 1,
    progress: 0,
    unlocked: false,
    reward: { type: 'dust', value: 75 },
  },
  {
    id: 'combo_master',
    name: 'Combo Master',
    description: 'Achieve a 10x combo',
    icon: '🔥',
    category: 'skill',
    requirement: 10,
    progress: 0,
    unlocked: false,
    reward: { type: 'dust', value: 250 },
  },
  // Collection
  {
    id: 'rock_collector',
    name: 'Rock Collector',
    description: 'Unlock 5 stone types',
    icon: '💎',
    category: 'collection',
    requirement: 5,
    progress: 0,
    unlocked: false,
    reward: { type: 'dust', value: 200 },
  },
  {
    id: 'hoarder',
    name: 'Dust Hoarder',
    description: 'Earn 1000 dust total',
    icon: '💰',
    category: 'collection',
    requirement: 1000,
    progress: 0,
    unlocked: false,
    reward: { type: 'cosmetic', value: 'amethyst' },
  },
  {
    id: 'connoisseur',
    name: 'Stone Connoisseur',
    description: 'Own all stone types',
    icon: '🌟',
    category: 'collection',
    requirement: 8,
    progress: 0,
    unlocked: false,
    reward: { type: 'title', value: 'Stone Master' },
  },
  // Dedication
  {
    id: 'dedication',
    name: 'Dedication',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    category: 'dedication',
    requirement: 7,
    progress: 0,
    unlocked: false,
    reward: { type: 'dust', value: 300 },
  },
  {
    id: 'century',
    name: 'Century',
    description: 'Play 100 games',
    icon: '💯',
    category: 'dedication',
    requirement: 100,
    progress: 0,
    unlocked: false,
    reward: { type: 'dust', value: 500 },
  },
];

// Daily Challenges Templates
export const DAILY_CHALLENGES_TEMPLATES = [
  { id: 'catch_5', description: 'Catch 5 stones in a single toss', target: 5, reward: 100 },
  { id: 'perfect_3', description: 'Complete 3 perfect catches', target: 3, reward: 150 },
  { id: 'speed_2', description: 'Complete 2 catches with 3s remaining', target: 2, reward: 120 },
  { id: 'no_foul', description: 'Play 5 rounds without fouling', target: 5, reward: 200 },
  { id: 'combo_5', description: 'Achieve a 5x combo', target: 5, reward: 180 },
];

// Tutorial Steps
export const TUTORIAL_STEPS = [
  {
    id: 'intro',
    title: 'Welcome to Diketo!',
    description: 'Diketo is a traditional African game of skill. Toss the gho (throwing stone) and scoop stones from the hole before it lands!',
    action: 'watch',
    skipAllowed: false,
  },
  {
    id: 'toss',
    title: 'Toss the Gho',
    description: 'Tap the large golden stone (gho) to toss it in the air.',
    action: 'toss',
    skipAllowed: false,
  },
  {
    id: 'scoop',
    title: 'Scoop Stones',
    description: 'Quickly tap stones in the hole to scoop them into your tray. Watch the timer!',
    action: 'scoop',
    skipAllowed: false,
  },
  {
    id: 'catch',
    title: 'Catch the Gho',
    description: 'The gho will fall back down. Make sure you\'ve scooped exactly the right number of stones!',
    action: 'catch',
    skipAllowed: false,
  },
  {
    id: 'complete',
    title: 'Level Complete!',
    description: 'Great job! Each level requires more stones. Master your timing to progress!',
    action: 'complete',
    skipAllowed: true,
  },
];

// Cultural Information
export const CULTURAL_INFO = {
  title: 'About Diketo',
  history: `Diketo, also known as "Kgato" or "Upuca", is a traditional South African game of skill and dexterity 
    that has been played for generations. The game originated in the Limpopo and Gauteng provinces 
    and was traditionally played by children and adults alike.`,
  culturalSignificance: `Diketo was more than just a game - it was a way to develop hand-eye coordination, 
    timing, and concentration. The game was often played during community gatherings, 
    family events, and as a way to pass time while herding livestock.`,
  traditionalMaterials: [
    'The "gho" (throwing stone) was typically a larger, smooth river stone',
    'Playing stones were smaller, flat stones collected from riverbeds',
    'The hole was dug in soft earth or sand',
    'Sometimes calabash shells or clay pots were used as trays',
  ],
  howToPlay: [
    'Dig a small hole in the ground',
    'Place 10 stones in the hole',
    'Toss the gho into the air',
    'Quickly scoop stones from the hole',
    'Catch the gho before it hits the ground',
    'The number of stones to scoop increases each round',
  ],
  regionalNames: {
    'Sotho': 'Diketo / Kgato',
    'Tswana': 'Diketo',
    'Zulu': 'Ukuchacha / Intonga',
    'Xhosa': 'Ukuchacha',
  },
};

// Difficulty Settings
export const DIFFICULTY_SETTINGS = {
  EASY: {
    name: 'Relaxed',
    description: 'Slower gho, more time to scoop',
    speedMult: 0.8,
    timerBonus: 3,
  },
  MEDIUM: {
    name: 'Traditional',
    description: 'Standard speed and timing',
    speedMult: 1.0,
    timerBonus: 0,
  },
  HARD: {
    name: 'Master',
    description: 'Faster gho, less time',
    speedMult: 1.3,
    timerBonus: -2,
  },
};
