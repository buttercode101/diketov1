import { useState, useEffect, useCallback, useRef } from 'react';
import { STORAGE_KEYS, ACHIEVEMENTS, COSMETICS, BOARD_THEMES } from '../constants';
import { Achievement, StreakData, Cosmetic, BoardTheme, GameStats, DailyChallenge } from '../types';

// Audio Hook - Enhanced for Diketo
export function useAudio(enabled: boolean, musicEnabled: boolean = true) {
  const ctxRef = useRef<AudioContext | null>(null);

  const init = useCallback(() => {
    if (!ctxRef.current) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        ctxRef.current = new AudioCtx();
      } catch (e) {
        console.warn('WebAudio not supported');
      }
    }
  }, []);

  const resume = useCallback(() => {
    if (ctxRef.current?.state === 'suspended') {
      ctxRef.current.resume();
    }
  }, []);

  const playTone = useCallback((freq: number, type: OscillatorType, duration: number, volMult = 1, slideFreq?: number) => {
    if (!enabled) return;
    init();
    const ctx = ctxRef.current;
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (slideFreq) {
        osc.frequency.exponentialRampToValueAtTime(slideFreq, ctx.currentTime + duration);
      }
      gain.gain.setValueAtTime(0.1 * volMult, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Ignore audio errors
    }
  }, [enabled, init]);

  const playNoise = useCallback((duration: number, volMult = 1) => {
    if (!enabled) return;
    init();
    const ctx = ctxRef.current;
    if (!ctx) return;

    try {
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1000;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2 * volMult, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch (e) {
      // Ignore audio errors
    }
  }, [enabled, init]);

  return {
    resume,
    // Game SFX
    toss: () => { playTone(300, 'sine', 0.4, 0.6, 600); },
    scoop: () => { playTone(800, 'square', 0.05, 0.4); playNoise(0.08, 0.3); },
    putBack: () => { playTone(400, 'triangle', 0.05, 0.3); },
    catch: () => { playTone(1200, 'sine', 0.3, 0.6, 2000); },
    foul: () => { playTone(150, 'sawtooth', 0.5, 0.5, 50); },
    win: () => {
      playTone(400, 'sine', 0.2, 0.6);
      setTimeout(() => playTone(600, 'sine', 0.2, 0.6), 200);
      setTimeout(() => playTone(800, 'sine', 0.3, 0.6), 400);
      setTimeout(() => playTone(1000, 'sine', 0.4, 0.6), 600);
    },
    click: () => playTone(600, 'sine', 0.05, 0.2),
    achievement: () => {
      playTone(523, 'sine', 0.1, 0.5);
      setTimeout(() => playTone(659, 'sine', 0.1, 0.5), 100);
      setTimeout(() => playTone(784, 'sine', 0.2, 0.5), 200);
      setTimeout(() => playTone(1047, 'sine', 0.3, 0.5), 300);
    },
    purchase: () => {
      playTone(880, 'sine', 0.1, 0.5);
      setTimeout(() => playTone(1100, 'sine', 0.15, 0.5), 100);
      setTimeout(() => playTone(1320, 'sine', 0.2, 0.5), 200);
    },
  };
}

// Local Storage Hook
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

// Statistics Hook
export function useStatistics() {
  const [stats, setStats] = useLocalStorage<GameStats>(STORAGE_KEYS.STATS, {
    totalGames: 0,
    highScore: 0,
    totalDustEarned: 0,
    totalDustSpent: 0,
    levelsCompleted: 0,
    perfectCatches: 0,
    foulsCommitted: 0,
    bestCombo: 0,
    totalPlayTime: 0,
    averageCatchTime: 0,
    favoriteStone: 'default',
  });

  const recordGame = useCallback((score: number, level: number, dustEarned: number, perfect: boolean, foul: boolean, playTime: number) => {
    setStats(prev => ({
      ...prev,
      totalGames: prev.totalGames + 1,
      highScore: Math.max(prev.highScore, score),
      totalDustEarned: prev.totalDustEarned + dustEarned,
      levelsCompleted: prev.levelsCompleted + level,
      perfectCatches: prev.perfectCatches + (perfect ? 1 : 0),
      foulsCommitted: prev.foulsCommitted + (foul ? 1 : 0),
      totalPlayTime: prev.totalPlayTime + playTime,
    }));
  }, [setStats]);

  const updateCombo = useCallback((combo: number) => {
    setStats(prev => ({
      ...prev,
      bestCombo: Math.max(prev.bestCombo, combo),
    }));
  }, [setStats]);

  const setFavoriteStone = useCallback((stoneId: string) => {
    setStats(prev => ({
      ...prev,
      favoriteStone: stoneId,
    }));
  }, [setStats]);

  const resetStats = useCallback(() => {
    setStats({
      totalGames: 0,
      highScore: 0,
      totalDustEarned: 0,
      totalDustSpent: 0,
      levelsCompleted: 0,
      perfectCatches: 0,
      foulsCommitted: 0,
      bestCombo: 0,
      totalPlayTime: 0,
      averageCatchTime: 0,
      favoriteStone: 'default',
    });
  }, [setStats]);

  return { stats, recordGame, updateCombo, setFavoriteStone, resetStats };
}

// Achievement System Hook
export function useAchievements() {
  const [achievements, setAchievements] = useLocalStorage<Achievement[]>(STORAGE_KEYS.ACHIEVEMENTS, ACHIEVEMENTS);
  const [unlockedThisSession, setUnlockedThisSession] = useState<string[]>([]);

  const checkAchievement = useCallback((id: string, progress: number) => {
    let unlocked = false;
    setAchievements(prev => prev.map(ach => {
      if (ach.id === id && !ach.unlocked) {
        const newProgress = Math.min(progress, ach.requirement);
        if (newProgress >= ach.requirement) {
          unlocked = true;
          return { ...ach, progress: newProgress, unlocked: true };
        }
        return { ...ach, progress: newProgress };
      }
      return ach;
    }));
    return unlocked;
  }, [setAchievements]);

  const unlockAchievement = useCallback((id: string) => {
    let wasUnlocked = false;
    setAchievements(prev => prev.map(ach => {
      if (ach.id === id && !ach.unlocked) {
        wasUnlocked = true;
        return { ...ach, unlocked: true };
      }
      return ach;
    }));
    if (wasUnlocked) {
      setUnlockedThisSession(prev => [...prev, id]);
    }
    return wasUnlocked;
  }, [setAchievements]);

  const getUnlockedCount = useCallback(() => {
    return achievements.filter(a => a.unlocked).length;
  }, [achievements]);

  const getTotalProgress = useCallback(() => {
    return achievements.reduce((sum, a) => sum + (a.unlocked ? 100 : Math.floor((a.progress / a.requirement) * 100)), 0) / achievements.length;
  }, [achievements]);

  return { achievements, checkAchievement, unlockAchievement, getUnlockedCount, getTotalProgress, unlockedThisSession };
}

// Cosmetics & Shop Hook
export function useCosmetics() {
  const [dust, setDust] = useLocalStorage<number>(STORAGE_KEYS.DUST, 0);
  const [cosmetics, setCosmetics] = useLocalStorage<Cosmetic[]>(STORAGE_KEYS.COSMETICS, COSMETICS);
  const [boardThemes, setBoardThemes] = useLocalStorage<BoardTheme[]>(STORAGE_KEYS.BOARD_THEMES, BOARD_THEMES);
  const [equippedCosmetic, setEquippedCosmetic] = useLocalStorage<string>(STORAGE_KEYS.EQUIPPED, 'default');
  const [equippedTheme, setEquippedTheme] = useLocalStorage<string>(STORAGE_KEYS.BOARD_THEMES + '_equipped', 'classic');

  const unlockCosmetic = useCallback((id: string) => {
    const cosmetic = cosmetics.find(c => c.id === id);
    if (!cosmetic) return false;
    if (dust < cosmetic.cost) return false;
    
    let success = false;
    setDust(prev => prev - cosmetic.cost);
    setCosmetics(prev => prev.map(c => 
      c.id === id ? { ...c, unlocked: true } : c
    ));
    success = true;
    return success;
  }, [cosmetics, dust, setDust, setCosmetics]);

  const equipCosmetic = useCallback((id: string) => {
    const cosmetic = cosmetics.find(c => c.id === id);
    if (!cosmetic || !cosmetic.unlocked) return false;
    setEquippedCosmetic(id);
    return true;
  }, [cosmetics, setEquippedCosmetic]);

  const equipTheme = useCallback((id: string) => {
    const theme = boardThemes.find(t => t.id === id);
    if (!theme) return false;
    setEquippedTheme(id);
    return true;
  }, [boardThemes, setEquippedTheme]);

  const addDust = useCallback((amount: number) => {
    setDust(prev => prev + amount);
  }, [setDust]);

  const getEquippedCosmetic = useCallback(() => {
    return cosmetics.find(c => c.id === equippedCosmetic) || cosmetics[0];
  }, [cosmetics, equippedCosmetic]);

  const getEquippedTheme = useCallback(() => {
    return boardThemes.find(t => t.id === equippedTheme) || boardThemes[0];
  }, [boardThemes, equippedTheme]);

  return {
    dust,
    cosmetics,
    boardThemes,
    equippedCosmetic,
    equippedTheme,
    unlockCosmetic,
    equipCosmetic,
    equipTheme,
    addDust,
    getEquippedCosmetic,
    getEquippedTheme,
  };
}

// Daily Rewards & Streak Hook
export function useDailyRewards() {
  const [streak, setStreak] = useLocalStorage<StreakData>(STORAGE_KEYS.STREAK, {
    currentStreak: 0,
    lastLogin: '',
    totalLogins: 0,
    bestStreak: 0,
  });
  const [dailyChallenges, setDailyChallenges] = useLocalStorage<DailyChallenge[]>(STORAGE_KEYS.DAILY_CHALLENGES, []);

  const checkDailyReward = useCallback(() => {
    const today = new Date().toDateString();
    const lastLogin = new Date(streak.lastLogin);
    
    if (streak.lastLogin === today) {
      return { available: false, reason: 'already_claimed' };
    }

    const daysSinceLastLogin = Math.floor((new Date(today).getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
    
    let newStreak = streak.currentStreak;
    if (daysSinceLastLogin === 1) {
      newStreak += 1;
    } else if (daysSinceLastLogin > 1) {
      newStreak = 1;
    } else {
      newStreak = 1;
    }

    return {
      available: true,
      streak: newStreak,
      reward: Math.min(500, 50 * newStreak),
    };
  }, [streak]);

  const claimDailyReward = useCallback(() => {
    const check = checkDailyReward();
    if (!check.available) return null;

    const today = new Date().toDateString();
    const reward = check.reward || 50;

    setStreak(prev => ({
      currentStreak: check.streak,
      lastLogin: today,
      totalLogins: prev.totalLogins + 1,
      bestStreak: Math.max(prev.bestStreak, check.streak),
    }));

    return reward;
  }, [checkDailyReward, setStreak]);

  // Generate daily challenges if none exist or expired
  useEffect(() => {
    if (dailyChallenges.length === 0 || new Date(dailyChallenges[0]?.expiresAt) < new Date()) {
      const templates = [
        { id: 'catch_5', description: 'Catch 5 stones in a single toss', target: 5, reward: 100 },
        { id: 'perfect_3', description: 'Complete 3 perfect catches', target: 3, reward: 150 },
        { id: 'speed_2', description: 'Complete 2 catches with 3s remaining', target: 2, reward: 120 },
      ];
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const newChallenges: DailyChallenge[] = templates.map((t, i) => ({
        id: `${t.id}_${Date.now()}_${i}`,
        description: t.description,
        target: t.target,
        progress: 0,
        reward: t.reward,
        completed: false,
        expiresAt: tomorrow.toISOString(),
      }));
      
      setDailyChallenges(newChallenges);
    }
  }, [dailyChallenges.length, setDailyChallenges]);

  const updateChallenge = useCallback((id: string, progress: number) => {
    setDailyChallenges(prev => prev.map(c => {
      if (c.id === id && !c.completed) {
        const newProgress = Math.min(progress, c.target);
        const completed = newProgress >= c.target;
        return { ...c, progress: newProgress, completed };
      }
      return c;
    }));
  }, [setDailyChallenges]);

  const getCompletedChallenges = useCallback(() => {
    return dailyChallenges.filter(c => c.completed).reduce((sum, c) => sum + c.reward, 0);
  }, [dailyChallenges]);

  return {
    streak,
    dailyChallenges,
    checkDailyReward,
    claimDailyReward,
    updateChallenge,
    getCompletedChallenges,
  };
}

// Haptic Feedback Hook
export function useHaptics(enabled: boolean = true) {
  const vibrate = useCallback((pattern: number | number[]) => {
    if (!enabled) return;
    if (navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Vibration not supported
      }
    }
  }, [enabled]);

  return {
    light: () => vibrate(10),
    medium: () => vibrate(20),
    heavy: () => vibrate(40),
    success: () => vibrate([30, 50, 30]),
    error: () => vibrate([50, 50, 50]),
    pattern: (pattern: number[]) => vibrate(pattern),
  };
}

// Arena Measurement Hook
export function useArenaMeasurement() {
  const [arenaSize, setArenaSize] = useState({ w: 340, h: 440 });
  const arenaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const measure = () => {
      if (arenaRef.current) {
        const rect = arenaRef.current.getBoundingClientRect();
        setArenaSize({ w: rect.width || 340, h: rect.height || 440 });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const holePos = { x: arenaSize.w * 0.45, y: arenaSize.h * 0.35 };
  const ghoBasePos = { x: arenaSize.w * 0.75, y: arenaSize.h * 0.82 };
  const trayPos = { x: arenaSize.w * 0.25, y: arenaSize.h * 0.82 };

  const getTrayPos = useCallback((count: number) => ({
    x: trayPos.x + (count % 3) * 16 - 16,
    y: trayPos.y + Math.floor(count / 3) * 16 - 16,
  }), [trayPos.x, trayPos.y]);

  return { arenaSize, arenaRef, holePos, ghoBasePos, trayPos, getTrayPos };
}
