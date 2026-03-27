import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Trophy, Play, RotateCcw, Home, Settings, Sparkles, ShoppingCart, BookOpen, HelpCircle, Info } from 'lucide-react';
import { useAudio, useLocalStorage, useArenaMeasurement, useStatistics, useAchievements, useDailyRewards, useCosmetics, useHaptics } from './hooks';
import { LEVELS, COSMETICS, PALETTE, ORGANIC_SHAPES, GAME_TIMING, STORAGE_KEYS, VIBRATION, ACHIEVEMENTS, BOARD_THEMES, TUTORIAL_STEPS, CULTURAL_INFO, DIFFICULTY_SETTINGS } from './constants';
import { Phase, Mode, Stone, Particle, TutorialState, Achievement, Cosmetic, BoardTheme } from './types';
import { PremiumButton, GlassCard, Modal, StatCard, AchievementCard, Toggle, Badge } from './components/UIComponents';

export default function App() {
  const [phase, setPhase] = useState<Phase>('MENU');
  const [mode, setMode] = useState<Mode>('SINGLE');
  const [volume, setVolume] = useLocalStorage<number>(STORAGE_KEYS.SETTINGS + '_volume', 1);
  const [haptics, setHapticsEnabled] = useLocalStorage<boolean>(STORAGE_KEYS.SETTINGS + '_haptics', true);
  const [difficulty, setDifficulty] = useLocalStorage<'EASY' | 'MEDIUM' | 'HARD'>(STORAGE_KEYS.SETTINGS + '_difficulty', 'MEDIUM');
  const [equippedStone, setEquippedStone] = useLocalStorage<string>(STORAGE_KEYS.EQUIPPED, 'default');
  const [equippedTheme, setEquippedTheme] = useLocalStorage<string>(STORAGE_KEYS.BOARD_THEMES + '_equipped', 'classic');
  
  const audio = useAudio(volume === 1, true);
  const haptic = useHaptics(haptics);
  const { stats, recordGame, updateCombo } = useStatistics();
  const { achievements, checkAchievement, unlockAchievement, getUnlockedCount, getTotalProgress, unlockedThisSession } = useAchievements();
  const { streak, dailyChallenges, checkDailyReward, claimDailyReward, updateChallenge, getCompletedChallenges } = useDailyRewards();
  const { dust, cosmetics, boardThemes, unlockCosmetic, equipCosmetic, addDust, getEquippedCosmetic, getEquippedTheme } = useCosmetics();
  const { arenaRef, holePos, ghoBasePos, trayPos, getTrayPos } = useArenaMeasurement();

  const [levelIdx, setLevelIdx] = useState(0);
  const [lives, setLives] = useState(3);
  const [stones, setStones] = useState<Stone[]>([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [turnTimer, setTurnTimer] = useState(GAME_TIMING.TURN_TIMER);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);

  const [ghoAirborne, setGhoAirborne] = useState(false);
  const [ghoY, setGhoY] = useState(0);
  const [ghoScale, setGhoScale] = useState(1);
  const [ghoRot, setGhoRot] = useState(0);

  const [msg, setMsg] = useState('');
  const [subMsg, setSubMsg] = useState('');

  const [particles, setParticles] = useState<Particle[]>([]);
  const ghoAnimRef = useRef<number | null>(null);
  const comboTimerRef = useRef<number | null>(null);

  // Tutorial State
  const [tutorialState, setTutorialState] = useLocalStorage<TutorialState>(STORAGE_KEYS.TUTORIAL, {
    currentStep: 0,
    completed: false,
    skipped: false,
  });

  // UI States
  const [showSettings, setShowSettings] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [showCulturalInfo, setShowCulturalInfo] = useState(false);

  const level = LEVELS[levelIdx] || LEVELS[0];
  const stonesInHole = stones.filter(s => s.state === 'hole').length;
  const stonesScooped = stones.filter(s => s.state === 'scooped').length;
  const requiredScoop = Math.min(level.scoop, stonesInHole);

  const equippedCosmeticData = getEquippedCosmetic();
  const equippedThemeData = getEquippedTheme();

  // Check daily reward on mount
  useEffect(() => {
    const check = checkDailyReward();
    if (check.available && phase === 'MENU') {
      setShowDailyReward(true);
    }
  }, []);

  // Show achievement notifications
  useEffect(() => {
    if (unlockedThisSession.length > 0 && phase !== 'MENU') {
      const lastUnlocked = unlockedThisSession[unlockedThisSession.length - 1];
      const achievement = achievements.find(a => a.id === lastUnlocked);
      if (achievement) {
        setMsg(`🏆 ${achievement.name}!`);
        audio.achievement();
        haptic.success();
        setTimeout(() => setMsg(''), 3000);
      }
    }
  }, [unlockedThisSession, achievements, audio, haptic, phase]);

  // Combo timer
  useEffect(() => {
    if (combo > 0) {
      comboTimerRef.current = window.setTimeout(() => {
        if (combo > maxCombo) setMaxCombo(combo);
        setCombo(0);
      }, GAME_TIMING.COMBO_WINDOW);
    }
    return () => {
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    };
  }, [combo, maxCombo]);

  // Initialize level
  const initLevel = useCallback((idx: number) => {
    const lvl = LEVELS[idx];
    const newStones = Array.from({ length: 10 }, (_, i) => {
      const isScatter = lvl.scatter;
      const r = isScatter ? 90 : 35;
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * r;
      return {
        id: i,
        x: holePos.x + Math.cos(angle) * dist,
        y: holePos.y + Math.sin(angle) * dist,
        state: 'hole' as const,
        rot: Math.random() * 360,
        shape: ORGANIC_SHAPES[Math.floor(Math.random() * ORGANIC_SHAPES.length)],
      };
    });
    setStones(newStones);
    setLevelIdx(idx);
    setGhoAirborne(false);
    setGhoY(0);
    setGhoScale(1);
    setTurnTimer(GAME_TIMING.TURN_TIMER + (DIFFICULTY_SETTINGS[difficulty].timerBonus || 0));
    setMsg(lvl.label);
    setSubMsg(`Scoop ${level.scoop}`);
    setTimeout(() => { setMsg(''); setSubMsg(''); }, 2000);
  }, [holePos.x, holePos.y, level.scoop, difficulty]);

  const spawnParticles = useCallback((x: number, y: number, type: 'dust' | 'spark' = 'dust', count = 5) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (type === 'spark' ? 80 : 40) + 20;
      newParticles.push({
        id: `${Date.now()}-${i}`,
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (type === 'dust' ? 20 : 0),
        life: type === 'spark' ? 0.4 : 0.8,
        type,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 800);
  }, []);

  const handleFoul = useCallback((reason: string) => {
    audio.foul();
    haptic.error();
    setGhoAirborne(false);
    setGhoY(0);
    setGhoScale(1);
    if (ghoAnimRef.current) cancelAnimationFrame(ghoAnimRef.current);
    setMsg('FOUL');
    setSubMsg(reason);
    setPhase('FOUL');
    
    // Update achievement progress
    checkAchievement('perfect', 0);
    
    setTimeout(() => {
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        setPhase('GAME_OVER');
        if (playerScore > stats.highScore) {
          checkAchievement('century', stats.totalGames + 1);
        }
        recordGame(playerScore, levelIdx, 0, false, true, 0);
      } else {
        initLevel(levelIdx);
      }
    }, GAME_TIMING.FOUL_DISPLAY);
  }, [audio, haptic, lives, levelIdx, playerScore, stats.highScore, stats.totalGames, initLevel, recordGame, checkAchievement]);

  const handleCatch = useCallback((req: number) => {
    audio.catch();
    haptic.success();
    spawnParticles(ghoBasePos.x, ghoBasePos.y, 'spark', 15);
    
    const dustEarned = req * 2 * (combo + 1);
    const scoreEarned = req * 10 * (combo + 1);
    
    setPlayerScore(s => s + scoreEarned);
    addDust(dustEarned);
    
    // Update combo
    setCombo(prev => {
      const newCombo = prev + 1;
      updateCombo(newCombo);
      if (newCombo >= 10) checkAchievement('combo_master', newCombo);
      return newCombo;
    });
    
    // Update challenges
    dailyChallenges.forEach(challenge => {
      if (challenge.description.includes('catch') && !challenge.completed) {
        updateChallenge(challenge.id, challenge.progress + 1);
      }
    });
    
    // Check achievements
    if (req >= 5) checkAchievement('catch_5', req);
    if (req >= 8) checkAchievement('greedy', req);
    if (turnTimer <= 3) checkAchievement('speed_demon', 1);
    
    setStones(prev => {
      const outStones = prev.map(s => s.state === 'scooped' ? { ...s, state: 'out' as const } : s);
      const remaining = outStones.filter(s => s.state === 'hole').length;
      if (remaining === 0) {
        if (levelIdx + 1 >= LEVELS.length) {
          setPhase('VICTORY');
          audio.win();
          checkAchievement('master', 20);
          addDust(500);
        } else {
          setMsg('LEVEL CLEARED');
          setPhase('LEVEL_COMPLETE');
          checkAchievement('first_catch', levelIdx + 1);
          checkAchievement('halfway', levelIdx + 1);
          setTimeout(() => initLevel(levelIdx + 1), GAME_TIMING.LEVEL_TRANSITION);
        }
      }
      return outStones;
    });
  }, [audio, haptic, levelIdx, combo, turnTimer, dailyChallenges, spawnParticles, ghoBasePos.x, ghoBasePos.y, addDust, updateCombo, updateChallenge, checkAchievement, initLevel, recordGame]);

  const handleToss = useCallback(() => {
    if (phase !== 'PLAYING' || ghoAirborne) return;
    audio.resume();
    audio.toss();
    haptic.light();
    setGhoAirborne(true);
    setTurnTimer(GAME_TIMING.TURN_TIMER + (DIFFICULTY_SETTINGS[difficulty].timerBonus || 0));
    setStones(prev => prev.map(s => s.state === 'scooped' ? { ...s, state: 'hole' as const } : s));
    const totalTime = GAME_TIMING.BASE_AIR_TIME / (level.speedMult * DIFFICULTY_SETTINGS[difficulty].speedMult);
    const start = Date.now();
    const animate = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed, totalTime);
      const u = t / totalTime;
      const p = 4 * u * (1 - u);
      setGhoY(p * 80);
      setGhoScale(1 + p * 1.5);
      setGhoRot(u * 1080);
      if (elapsed < totalTime) {
        ghoAnimRef.current = requestAnimationFrame(animate);
      } else {
        setGhoY(0);
        setGhoScale(1);
        setGhoAirborne(false);
        setStones(current => {
          const scooped = current.filter(s => s.state === 'scooped').length;
          const inHole = current.filter(s => s.state === 'hole').length;
          const req = Math.min(level.scoop, inHole + scooped);
          if (scooped < req) {
            setTimeout(() => handleFoul(`Too slow! ${scooped}/${req}`), 10);
          } else if (scooped > req) {
            setTimeout(() => handleFoul(`Greedy! ${scooped}/${req}`), 10);
          } else {
            setTimeout(() => handleCatch(req), 10);
          }
          return current;
        });
      }
    };
    ghoAnimRef.current = requestAnimationFrame(animate);
  }, [phase, ghoAirborne, level.speedMult, level.scoop, difficulty, audio, haptic, handleFoul, handleCatch]);

  const handleStoneClick = useCallback((id: number) => {
    if (phase !== 'PLAYING' || !ghoAirborne) return;
    setStones(prev => {
      const stone = prev.find(s => s.id === id);
      if (!stone) return prev;
      if (stone.state === 'hole') {
        audio.scoop();
        haptic.light();
        spawnParticles(stone.x, stone.y, 'dust', 6);
        const scoopedCount = prev.filter(s => s.state === 'scooped').length;
        const pos = getTrayPos(scoopedCount);
        return prev.map(s => s.id === id ? { ...s, state: 'scooped' as const, targetX: pos.x, targetY: pos.y } : s);
      } else if (stone.state === 'scooped') {
        audio.putBack();
        return prev.map(s => s.id === id ? { ...s, state: 'hole' as const, targetX: undefined, targetY: undefined } : s);
      }
      return prev;
    });
  }, [phase, ghoAirborne, audio, haptic, spawnParticles, getTrayPos]);

  const startGame = () => {
    audio.resume();
    audio.click();
    haptic.light();
    setMode('SINGLE');
    setLives(3);
    setPlayerScore(0);
    setCombo(0);
    setMaxCombo(0);
    initLevel(0);
  };

  const startTutorial = () => {
    audio.click();
    haptic.light();
    setTutorialState({ currentStep: 0, completed: false, skipped: false });
    setPhase('TUTORIAL');
    setMsg(TUTORIAL_STEPS[0].title);
    setSubMsg(TUTORIAL_STEPS[0].description);
  };

  const quitToMenu = () => {
    audio.click();
    haptic.light();
    setPhase('MENU');
    setCombo(0);
  };

  const claimReward = () => {
    const reward = claimDailyReward();
    if (reward) {
      addDust(reward);
      setMsg(`🎁 Claimed ${reward} dust!`);
      audio.achievement();
      haptic.success();
      setTimeout(() => setMsg(''), 2000);
    }
    setShowDailyReward(false);
  };

  const buyCosmetic = (cosmetic: Cosmetic) => {
    if (unlockCosmetic(cosmetic.id)) {
      audio.purchase();
      haptic.success();
      setMsg(`✨ Unlocked ${cosmetic.name}!`);
      checkAchievement('rock_collector', cosmetics.filter(c => c.unlocked).length + 1);
      setTimeout(() => setMsg(''), 2000);
    } else {
      audio.foul();
      setMsg('❌ Not enough dust!');
      setTimeout(() => setMsg(''), 2000);
    }
  };

  // Render Daily Reward Modal
  if (showDailyReward) {
    const check = checkDailyReward();
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-b from-[#1A0E05] to-[#3A2010] rounded-2xl p-8 max-w-md w-full text-center border-2 border-[#FFD700]"
        >
          <div className="text-6xl mb-4">🎁</div>
          <h2 className="text-3xl font-bold text-white mb-2">Daily Reward!</h2>
          <p className="text-[#D4B483] mb-6">Day {check.streak} of your streak!</p>
          <div className="bg-white/10 rounded-xl p-4 mb-6">
            <div className="text-4xl font-bold text-[#FFD700]">+{check.reward} Dust</div>
          </div>
          <button 
            onClick={claimReward}
            className="w-full bg-[#FFD700] hover:bg-[#DAA520] text-[#1A0E05] px-8 py-4 rounded-xl font-bold text-xl transition-all hover:scale-105"
          >
            Claim Reward
          </button>
        </motion.div>
      </div>
    );
  }

  // Render Menu
  if (phase === 'MENU') {
    return (
      <div className="min-h-screen bg-[#1A0E05] text-[#D4B483] p-6 relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 rounded-full px-4 py-2 flex items-center gap-2">
              <span className="text-xl">💎</span>
              <span className="font-bold text-white">{dust}</span>
            </div>
            <div className="bg-white/10 rounded-full px-4 py-2 flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <span className="font-bold text-white">{streak.currentStreak}</span>
            </div>
          </div>
          <button onClick={() => setShowSettings(true)} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all">
            <Settings className="w-6 h-6" />
          </button>
        </div>

        {/* Title */}
        <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-16 text-center mt-8">
          <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#FFD700] to-[#C8782A] tracking-tighter">DIKETO</h1>
          <p className="text-xs font-medium tracking-widest text-[#D4B483]/60 mt-2 uppercase">The Stone Game</p>
        </motion.div>

        {/* Main Buttons */}
        <div className="flex flex-col gap-4 w-full max-w-[280px] mb-8">
          <button onClick={startGame} className="rounded-full bg-white/5 border border-white/10 px-6 py-4 hover:bg-white/10 transition-all">
            <div className="flex items-center justify-center gap-3 text-sm font-bold tracking-widest text-white">
              <Play size={16} className="text-[#FFD700]" /> PLAY
            </div>
          </button>
          <button onClick={startTutorial} className="rounded-full bg-white/5 border border-white/10 px-6 py-4 hover:bg-white/10 transition-all">
            <div className="flex items-center justify-center gap-3 text-sm font-bold tracking-widest text-white">
              <HelpCircle size={16} className="text-[#FFD700]" /> TUTORIAL
            </div>
          </button>
          <button onClick={() => setShowShop(true)} className="rounded-full bg-white/5 border border-white/10 px-6 py-4 hover:bg-white/10 transition-all">
            <div className="flex items-center justify-center gap-3 text-sm font-bold tracking-widest text-white">
              <ShoppingCart size={16} className="text-[#FFD700]" /> SHOP
            </div>
          </button>
        </div>

        {/* Bottom Stats */}
        <div className="flex gap-4 justify-center mb-8">
          <button onClick={() => setShowAchievements(true)} className="bg-white/10 hover:bg-white/20 p-4 rounded-full transition-all">
            <Trophy className="w-6 h-6" />
          </button>
          <button onClick={() => setShowStats(true)} className="bg-white/10 hover:bg-white/20 p-4 rounded-full transition-all">
            <span className="text-xl">📊</span>
          </button>
          <button onClick={() => setShowCulturalInfo(true)} className="bg-white/10 hover:bg-white/20 p-4 rounded-full transition-all">
            <BookOpen className="w-6 h-6" />
          </button>
          <button onClick={() => setVolume(v => v === 0 ? 1 : 0)} className="bg-white/10 hover:bg-white/20 p-4 rounded-full transition-all">
            {volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>
        </div>

        <div className="absolute bottom-8 flex items-center gap-4 text-xs font-medium tracking-widest">
          <div className="flex items-center gap-2"><Trophy size={14} className="text-[#FFD700]" /> {stats.highScore}</div>
          <div className="flex items-center gap-2"><span className="text-[#D4B483]">🔥</span> Best: {maxCombo}x</div>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gradient-to-b from-[#1A0E05] to-[#3A2010] rounded-2xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white">Sound</span>
                  <button onClick={() => setVolume(v => v === 0 ? 1 : 0)} className={`w-14 h-8 rounded-full transition-all ${volume === 1 ? 'bg-[#FFD700]' : 'bg-white/20'}`}>
                    <div className={`w-6 h-6 bg-white rounded-full transition-all ${volume === 1 ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white">Haptics</span>
                  <button onClick={() => setHapticsEnabled(!haptics)} className={`w-14 h-8 rounded-full transition-all ${haptics ? 'bg-[#FFD700]' : 'bg-white/20'}`}>
                    <div className={`w-6 h-6 bg-white rounded-full transition-all ${haptics ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white">Difficulty</span>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)} className="bg-white/10 rounded-lg px-4 py-2 text-white">
                    {Object.entries(DIFFICULTY_SETTINGS).map(([key, settings]) => (
                      <option key={key} value={key} className="bg-[#1A0E05]">{settings.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white">Stone</span>
                  <select value={equippedStone} onChange={(e) => { equipCosmetic(e.target.value); setEquippedStone(e.target.value); }} className="bg-white/10 rounded-lg px-4 py-2 text-white">
                    {cosmetics.filter(c => c.unlocked).map(c => (
                      <option key={c.id} value={c.id} className="bg-[#1A0E05]">{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full mt-8 bg-[#FFD700] hover:bg-[#DAA520] text-[#1A0E05] px-8 py-4 rounded-xl font-bold transition-all">Close</button>
            </motion.div>
          </div>
        )}

        {/* Shop Modal */}
        {showShop && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gradient-to-b from-[#1A0E05] to-[#3A2010] rounded-2xl p-8 max-w-2xl w-full my-8">
              <h2 className="text-2xl font-bold text-white mb-2">Stone Shop</h2>
              <p className="text-[#D4B483] mb-6">💎 {dust} dust available</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {cosmetics.map(cosmetic => (
                  <div key={cosmetic.id} className={`p-4 rounded-xl border-2 ${cosmetic.unlocked ? 'border-[#FFD700] bg-[#FFD700]/10' : 'border-white/20 bg-white/5'}`}>
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full" style={{ background: `radial-gradient(circle at 30% 30%, ${cosmetic.colors[0]}, ${cosmetic.colors[1]}, ${cosmetic.colors[2]})` }} />
                    <div className="text-white font-bold text-sm text-center">{cosmetic.name}</div>
                    {!cosmetic.unlocked ? (
                      <button onClick={() => buyCosmetic(cosmetic)} className="w-full mt-2 bg-[#FFD700] hover:bg-[#DAA520] text-[#1A0E05] py-2 rounded-lg font-bold text-sm transition-all">
                        {cosmetic.cost} 💎
                      </button>
                    ) : (
                      <button onClick={() => { equipCosmetic(cosmetic.id); setEquippedStone(cosmetic.id); }} className={`w-full mt-2 py-2 rounded-lg font-bold text-sm transition-all ${equippedStone === cosmetic.id ? 'bg-[#FFD700] text-[#1A0E05]' : 'bg-white/20 text-white'}`}>
                        {equippedStone === cosmetic.id ? 'Equipped' : 'Equip'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => setShowShop(false)} className="w-full bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-bold transition-all">Close</button>
            </motion.div>
          </div>
        )}

        {/* Achievements Modal */}
        {showAchievements && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gradient-to-b from-[#1A0E05] to-[#3A2010] rounded-2xl p-8 max-w-2xl w-full my-8">
              <h2 className="text-2xl font-bold text-white mb-6">Achievements ({getUnlockedCount()}/{ACHIEVEMENTS.length})</h2>
              <div className="mb-6 bg-white/10 rounded-lg p-3">
                <div className="text-sm text-[#D4B483]">Overall Progress</div>
                <div className="w-full bg-white/20 rounded-full h-4 mt-2">
                  <div className="bg-[#FFD700] h-4 rounded-full transition-all" style={{ width: `${getTotalProgress()}%` }} />
                </div>
                <div className="text-right text-xs text-[#D4B483] mt-1">{getTotalProgress().toFixed(1)}%</div>
              </div>
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {achievements.map(achievement => (
                  <div key={achievement.id} className={`p-4 rounded-xl border-2 transition-all ${achievement.unlocked ? 'border-[#FFD700] bg-[#FFD700]/20' : 'border-white/20 bg-white/5 opacity-60'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{achievement.icon}</span>
                      <div className="flex-1">
                        <div className="font-bold text-white">{achievement.name}</div>
                        <div className="text-sm text-[#D4B483]">{achievement.description}</div>
                        {!achievement.unlocked && (
                          <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                            <div className="bg-[#FFD700] h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (achievement.progress / achievement.requirement) * 100)}%` }} />
                          </div>
                        )}
                      </div>
                      {achievement.unlocked && <span className="text-2xl">✅</span>}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowAchievements(false)} className="w-full mt-6 bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-bold transition-all">Close</button>
            </motion.div>
          </div>
        )}

        {/* Stats Modal */}
        {showStats && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gradient-to-b from-[#1A0E05] to-[#3A2010] rounded-2xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-white mb-6">Statistics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-[#FFD700]">{stats.totalGames}</div>
                  <div className="text-sm text-[#D4B483]">Games Played</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-[#FFD700]">{stats.highScore}</div>
                  <div className="text-sm text-[#D4B483]">High Score</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-[#4CAF50]">{stats.totalDustEarned}</div>
                  <div className="text-sm text-[#D4B483]">Dust Earned</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-[#E53935]">{stats.foulsCommitted}</div>
                  <div className="text-sm text-[#D4B483]">Fouls</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-[#FFD700]">{stats.levelsCompleted}</div>
                  <div className="text-sm text-[#D4B483]">Levels Done</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-[#f27696]">{stats.bestCombo}x</div>
                  <div className="text-sm text-[#D4B483]">Best Combo</div>
                </div>
              </div>
              <button onClick={() => setShowStats(false)} className="w-full mt-6 bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-bold transition-all">Close</button>
            </motion.div>
          </div>
        )}

        {/* Cultural Info Modal */}
        {showCulturalInfo && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gradient-to-b from-[#1A0E05] to-[#3A2010] rounded-2xl p-8 max-w-2xl w-full my-8">
              <h2 className="text-2xl font-bold text-white mb-4">{CULTURAL_INFO.title}</h2>
              <div className="space-y-4 text-[#D4B483]">
                <div>
                  <h3 className="font-bold text-white mb-2">History</h3>
                  <p className="text-sm">{CULTURAL_INFO.history}</p>
                </div>
                <div>
                  <h3 className="font-bold text-white mb-2">Cultural Significance</h3>
                  <p className="text-sm">{CULTURAL_INFO.culturalSignificance}</p>
                </div>
                <div>
                  <h3 className="font-bold text-white mb-2">Traditional Materials</h3>
                  <ul className="text-sm list-disc list-inside">
                    {CULTURAL_INFO.traditionalMaterials.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              </div>
              <button onClick={() => setShowCulturalInfo(false)} className="w-full mt-6 bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-bold transition-all">Close</button>
            </motion.div>
          </div>
        )}
      </div>
    );
  }

  // Render Game Over
  if (phase === 'GAME_OVER') {
    return (
      <div className="min-h-screen bg-[#1A0E05] text-[#D4B483] p-6 text-center">
        <div className="mt-20 mb-8">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#E53935] to-[#8E0000] mb-2">GAME OVER</h1>
          <p className="text-lg font-medium tracking-widest text-white/70 mb-2">SCORE {playerScore}</p>
          <p className="text-sm text-[#D4B483]">Level {levelIdx + 1} | Combo: {maxCombo}x</p>
        </div>
        <div className="flex gap-4 justify-center">
          <button onClick={startGame} className="bg-[#FFD700] hover:bg-[#DAA520] text-[#1A0E05] px-8 py-4 rounded-full font-bold transition-all">
            <RotateCcw className="inline mr-2" /> RETRY
          </button>
          <button onClick={quitToMenu} className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-bold transition-all">
            <Home className="inline mr-2" /> MENU
          </button>
        </div>
      </div>
    );
  }

  // Render Victory
  if (phase === 'VICTORY') {
    return (
      <div className="min-h-screen bg-[#1A0E05] text-[#D4B483] p-6 text-center">
        <div className="mt-20 mb-8">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#FFD700] to-[#C8782A] mb-2">VICTORY!</h1>
          <p className="text-sm font-medium tracking-widest text-white/70 mb-2">ALL LEVELS CLEARED</p>
          <p className="text-2xl font-bold text-white mb-4">SCORE {playerScore}</p>
          <p className="text-[#D4B483]">Best Combo: {maxCombo}x</p>
        </div>
        <button onClick={quitToMenu} className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-bold transition-all">
          <Home className="inline mr-2" /> MENU
        </button>
      </div>
    );
  }

  // Render Tutorial
  if (phase === 'TUTORIAL') {
    const currentStep = TUTORIAL_STEPS[tutorialState.currentStep];
    return (
      <div className="min-h-screen bg-[#1A0E05] text-[#D4B483] p-6">
        <div className="mt-20 text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">{currentStep?.title}</h2>
          <p className="text-[#D4B483]">{currentStep?.description}</p>
        </div>
        <div className="flex gap-4 justify-center">
          {tutorialState.currentStep < TUTORIAL_STEPS.length - 1 && (
            <button 
              onClick={() => {
                if (tutorialState.currentStep < TUTORIAL_STEPS.length - 1) {
                  setTutorialState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
                  setMsg(TUTORIAL_STEPS[tutorialState.currentStep + 1].title);
                  setSubMsg(TUTORIAL_STEPS[tutorialState.currentStep + 1].description);
                }
              }}
              className="bg-[#FFD700] hover:bg-[#DAA520] text-[#1A0E05] px-8 py-4 rounded-full font-bold transition-all"
            >
              Next →
            </button>
          )}
          <button 
            onClick={() => {
              setTutorialState({ currentStep: 0, completed: true, skipped: false });
              startGame();
            }}
            className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-bold transition-all"
          >
            {tutorialState.currentStep < TUTORIAL_STEPS.length - 1 ? 'Skip' : 'Start Game'}
          </button>
        </div>
      </div>
    );
  }

  // Render Game
  return (
    <div className="fixed inset-0 max-w-md mx-auto h-full flex flex-col font-sans select-none relative bg-[#1A0E05] overflow-hidden safe-container">
      {/* HUD */}
      <div className="relative z-20 flex justify-between items-center p-4 md:p-6 safe-top">
        <div className="flex flex-col gap-1">
          <div className="text-[10px] font-bold tracking-widest text-[#D4B483]/60 uppercase">{level.label}</div>
          <div className="text-xl md:text-2xl font-black tracking-tighter text-white">{playerScore}</div>
          {combo > 1 && <div className="text-xs md:text-sm font-bold text-[#f27696] animate-pulse">{combo}x COMBO!</div>}
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex gap-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${i < lives ? 'bg-[#FFD700]' : 'bg-white/10'}`} />
            ))}
          </div>
          <button onClick={quitToMenu} className="p-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
            <RotateCcw size={18} className="text-white" />
          </button>
        </div>
      </div>

      {/* Arena */}
      <div ref={arenaRef} className="flex-1 relative z-10 touch-none w-full h-full min-h-0">
        {/* Hole */}
        <div className="absolute rounded-full" style={{
          left: holePos.x - 55, top: holePos.y - 55, width: 110, height: 110,
          background: equippedThemeData.hole,
          boxShadow: `inset 0 25px 40px rgba(0,0,0,0.95), 0 2px 4px rgba(255,255,255,0.03)`,
          border: `1px solid ${equippedThemeData.holeRim}`,
        }} />

        {/* Particles */}
        <AnimatePresence>
          {particles.map(p => (
            <motion.div key={p.id}
              initial={{ x: p.x, y: p.y, opacity: 1, scale: p.type === 'spark' ? 1 : 0.5 }}
              animate={{ x: p.x + p.vx * p.life, y: p.y + p.vy * p.life, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: p.life }}
              className={`absolute rounded-full pointer-events-none z-40 ${p.type === 'spark' ? 'w-1 h-1 bg-[#FFD700]' : 'w-3 h-3 bg-[#D4B483] blur-[1px]'}`}
            />
          ))}
        </AnimatePresence>

        {/* Stones */}
        {stones.map(s => {
          if (s.state === 'out') return null;
          const isScooped = s.state === 'scooped';
          return (
            <motion.div key={s.id}
              onClick={() => handleStoneClick(s.id)}
              animate={{
                left: isScooped && s.targetX ? s.targetX - 15 : s.x - 15,
                top: isScooped && s.targetY ? s.targetY - 15 : s.y - 15,
                scale: isScooped ? 1.15 : 1,
                rotate: isScooped ? 0 : s.rot,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="absolute cursor-pointer"
              style={{
                width: 30, height: 30,
                borderRadius: s.shape,
                background: `radial-gradient(circle at 30% 30%, ${equippedCosmeticData.colors[0]}, ${equippedCosmeticData.colors[1]}, ${equippedCosmeticData.colors[2]})`,
                boxShadow: isScooped ? `0 15px 25px rgba(0,0,0,0.9), 0 0 20px ${PALETTE.gold}50` : 'inset -2px -4px 6px rgba(0,0,0,0.7)',
                zIndex: isScooped ? 20 : 10,
                border: isScooped ? `2px solid ${PALETTE.gold}` : '1px solid rgba(0,0,0,0.5)',
              }}
            />
          );
        })}

        {/* Gho */}
        <div onClick={handleToss}
          className="absolute rounded-full flex items-center justify-center"
          style={{
            left: ghoBasePos.x - 38, top: ghoBasePos.y - ghoY - 38, width: 76, height: 76,
            background: `radial-gradient(circle at 35% 28%, ${PALETTE.gho}, #B8A070, #3A1A05)`,
            boxShadow: ghoAirborne ? `0 ${30 + ghoY/2}px ${50 + ghoY}px rgba(0,0,0,0.8)` : `inset -4px -8px 15px rgba(0,0,0,0.8)`,
            transform: `scale(${ghoScale}) rotate(${ghoRot}deg)`,
            border: '1px solid rgba(255,255,255,0.15)',
            cursor: !ghoAirborne && phase === 'PLAYING' ? 'pointer' : 'default',
            zIndex: ghoAirborne ? 100 : 30,
          }}
        >
          <div className="absolute top-2 left-3 w-5 h-2.5 bg-white/20 rounded-full rotate-[-25deg]" />
          {!ghoAirborne && phase === 'PLAYING' && (
            <div className="absolute inset-[-14px] rounded-full border border-white/10 border-t-white/40 animate-spin" style={{ animationDuration: '3s' }} />
          )}
        </div>

        {/* Messages */}
        <AnimatePresence>
          {(msg || subMsg) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50 bg-black/20 backdrop-blur-[2px]"
            >
              {msg && <div className="text-5xl font-black text-white tracking-tighter drop-shadow-lg text-center uppercase">{msg}</div>}
              {subMsg && <div className="text-sm font-bold tracking-widest text-[#FFD700] mt-4 drop-shadow-lg text-center">{subMsg}</div>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timer */}
        {!ghoAirborne && phase === 'PLAYING' && (
          <div className={`absolute top-20 left-1/2 -translate-x-1/2 text-xs font-bold tracking-widest ${turnTimer <= 3 ? 'text-[#E53935] animate-pulse' : 'text-white/40'}`}>
            ⏱️ {turnTimer}s
          </div>
        )}

        {/* Daily Challenges Progress */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {dailyChallenges.slice(0, 3).map((challenge, i) => (
            <div key={challenge.id} className={`px-3 py-1 rounded-full text-xs font-bold ${challenge.completed ? 'bg-[#4CAF50] text-white' : 'bg-white/10 text-[#D4B483]'}`}>
              {challenge.description.split(' ')[1]} {challenge.progress}/{challenge.target}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
