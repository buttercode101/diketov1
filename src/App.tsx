import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Trophy, Play, RotateCcw, Home } from 'lucide-react';
import { useAudio, useLocalStorage, useArenaMeasurement } from './hooks';
import { LEVELS, COSMETICS, PALETTE, ORGANIC_SHAPES, GAME_TIMING, STORAGE_KEYS, VIBRATION } from './constants';
import { Phase, Mode, Stone, Particle } from './types';

export default function App() {
  const [phase, setPhase] = useState<Phase>('MENU');
  const [mode, setMode] = useState<Mode>('SINGLE');
  const [volume, setVolume] = useLocalStorage<number>(STORAGE_KEYS.HIGH_SCORE, 1);
  const [highScore, setHighScore] = useLocalStorage<number>(STORAGE_KEYS.HIGH_SCORE, 0);
  const [dust, setDust] = useLocalStorage<number>(STORAGE_KEYS.DUST, 0);
  const audio = useAudio(volume);

  const { arenaRef, holePos, ghoBasePos, trayPos, getTrayPos } = useArenaMeasurement();
  
  const [levelIdx, setLevelIdx] = useState(0);
  const [lives, setLives] = useState(3);
  const [stones, setStones] = useState<Stone[]>([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [turnTimer, setTurnTimer] = useState(GAME_TIMING.TURN_TIMER);
  
  const [ghoAirborne, setGhoAirborne] = useState(false);
  const [ghoY, setGhoY] = useState(0);
  const [ghoScale, setGhoScale] = useState(1);
  const [ghoRot, setGhoRot] = useState(0);
  
  const [msg, setMsg] = useState('');
  const [subMsg, setSubMsg] = useState('');
  
  const [particles, setParticles] = useState<Particle[]>([]);
  const ghoAnimRef = useRef<number | null>(null);

  const level = LEVELS[levelIdx] || LEVELS[0];
  const stonesInHole = stones.filter(s => s.state === 'hole').length;
  const stonesScooped = stones.filter(s => s.state === 'scooped').length;
  const requiredScoop = Math.min(level.scoop, stonesInHole);

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
    setPhase('PLAYING');
    setGhoAirborne(false);
    setGhoY(0);
    setGhoScale(1);
    setTurnTimer(GAME_TIMING.TURN_TIMER);
    setMsg(lvl.label);
    setSubMsg(`Scoop ${level.scoop}`);
    setTimeout(() => { setMsg(''); setSubMsg(''); }, 2000);
  }, [holePos.x, holePos.y, level.scoop]);

  const startGame = () => {
    audio.resume();
    audio.click();
    setMode('SINGLE');
    setLives(3);
    setPlayerScore(0);
    initLevel(0);
  };

  const quitToMenu = () => {
    audio.click();
    setPhase('MENU');
  };

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
    setGhoAirborne(false);
    setGhoY(0);
    setGhoScale(1);
    if (ghoAnimRef.current) cancelAnimationFrame(ghoAnimRef.current);
    setMsg('FOUL');
    setSubMsg(reason);
    setPhase('FOUL');
    setTimeout(() => {
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        setPhase('GAME_OVER');
        if (playerScore > highScore) {
          setHighScore(playerScore);
        }
      } else {
        initLevel(levelIdx);
      }
    }, GAME_TIMING.FOUL_DISPLAY);
  }, [audio, lives, levelIdx, playerScore, highScore, setHighScore, initLevel]);

  const handleCatch = useCallback((req: number) => {
    audio.catch();
    spawnParticles(ghoBasePos.x, ghoBasePos.y, 'spark', 15);
    setPlayerScore(s => s + req * 10);
    setDust(d => d + req * 2);
    setStones(prev => {
      const outStones = prev.map(s => s.state === 'scooped' ? { ...s, state: 'out' as const } : s);
      const remaining = outStones.filter(s => s.state === 'hole').length;
      if (remaining === 0) {
        if (levelIdx + 1 >= LEVELS.length) {
          setPhase('VICTORY');
          audio.win();
        } else {
          setMsg('LEVEL CLEARED');
          setPhase('LEVEL_COMPLETE');
          setTimeout(() => initLevel(levelIdx + 1), GAME_TIMING.LEVEL_TRANSITION);
        }
      }
      return outStones;
    });
  }, [audio, levelIdx, initLevel, spawnParticles, ghoBasePos.x, ghoBasePos.y, setDust]);

  const handleToss = useCallback(() => {
    if (phase !== 'PLAYING' || ghoAirborne) return;
    audio.resume();
    audio.toss();
    setGhoAirborne(true);
    setTurnTimer(GAME_TIMING.TURN_TIMER);
    setStones(prev => prev.map(s => s.state === 'scooped' ? { ...s, state: 'hole' as const } : s));
    const totalTime = GAME_TIMING.BASE_AIR_TIME / level.speedMult;
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
  }, [phase, ghoAirborne, level.speedMult, level.scoop, audio, handleFoul, handleCatch]);

  const handleStoneClick = useCallback((id: number) => {
    if (phase !== 'PLAYING' || !ghoAirborne) return;
    setStones(prev => {
      const stone = prev.find(s => s.id === id);
      if (!stone) return prev;
      if (stone.state === 'hole') {
        audio.scoop();
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
  }, [phase, ghoAirborne, audio, spawnParticles, getTrayPos]);

  // Turn timer
  useEffect(() => {
    if (phase === 'PLAYING' && !ghoAirborne) {
      const timer = setInterval(() => {
        setTurnTimer(t => {
          if (t <= 1) {
            clearInterval(timer);
            handleFoul("Time's up!");
            return 0;
          }
          if (t <= 3) audio.click();
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [phase, ghoAirborne, audio, handleFoul]);

  // Render Menu
  if (phase === 'MENU') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#1A0E05] text-[#D4B483] p-6">
        <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-16 text-center">
          <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#FFD700] to-[#C8782A] tracking-tighter">DIKETO</h1>
          <p className="text-xs font-medium tracking-widest text-[#D4B483]/60 mt-2 uppercase">The Stone Game</p>
        </motion.div>
        <div className="flex flex-col gap-4 w-full max-w-[240px]">
          <button onClick={startGame} className="rounded-full bg-white/5 border border-white/10 px-6 py-4 hover:bg-white/10 transition-all">
            <div className="flex items-center justify-center gap-3 text-sm font-bold tracking-widest text-white">
              <Play size={16} className="text-[#FFD700]" /> PLAY
            </div>
          </button>
          <button onClick={() => setVolume(v => v === 0 ? 1 : 0)} className="rounded-full bg-white/5 border border-white/10 px-6 py-4 hover:bg-white/10 transition-all">
            <div className="flex items-center justify-center gap-3 text-sm font-bold tracking-widest text-white">
              {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />} {volume === 0 ? 'MUTED' : 'SOUND ON'}
            </div>
          </button>
        </div>
        <div className="absolute bottom-8 flex items-center gap-4 text-xs font-medium tracking-widest">
          <div className="flex items-center gap-2"><Trophy size={14} className="text-[#FFD700]" /> {highScore}</div>
          <div className="flex items-center gap-2"><span className="text-[#D4B483]">✨</span> {dust}</div>
        </div>
      </div>
    );
  }

  // Render Game Over
  if (phase === 'GAME_OVER') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#1A0E05] text-[#D4B483] p-6 text-center">
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#E53935] to-[#8E0000] mb-2">GAME OVER</h1>
        <p className="text-lg font-medium tracking-widest text-white/70 mb-8">SCORE {playerScore}</p>
        <button onClick={quitToMenu} className="p-5 bg-white/5 rounded-full border border-white/10 hover:bg-white/10">
          <Home size={24} className="text-white" />
        </button>
      </div>
    );
  }

  // Render Victory
  if (phase === 'VICTORY') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#1A0E05] text-[#D4B483] p-6 text-center">
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#FFD700] to-[#C8782A] mb-2">VICTORY!</h1>
        <p className="text-sm font-medium tracking-widest text-white/70 mb-8">ALL LEVELS CLEARED</p>
        <p className="text-2xl font-bold text-white mb-12">SCORE {playerScore}</p>
        <button onClick={quitToMenu} className="px-8 py-4 bg-white/10 text-white rounded-full text-sm font-bold tracking-widest border border-white/20">
          <Home size={20} className="inline mr-2" /> MENU
        </button>
      </div>
    );
  }

  // Render Game
  return (
    <div className="max-w-md mx-auto h-full flex flex-col font-sans select-none relative bg-[#1A0E05] overflow-hidden">
      {/* HUD */}
      <div className="relative z-20 flex justify-between items-center p-6">
        <div className="flex flex-col gap-1">
          <div className="text-[10px] font-bold tracking-widest text-[#D4B483]/60 uppercase">{level.label}</div>
          <div className="text-xl font-black tracking-tighter text-white">{playerScore}</div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex gap-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full ${i < lives ? 'bg-[#FFD700]' : 'bg-white/10'}`} />
            ))}
          </div>
          <button onClick={quitToMenu} className="p-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10">
            <RotateCcw size={18} className="text-white" />
          </button>
        </div>
      </div>

      {/* Arena */}
      <div ref={arenaRef} className="flex-1 relative z-10 touch-none">
        {/* Hole */}
        <div className="absolute rounded-full" style={{
          left: holePos.x - 55, top: holePos.y - 55, width: 110, height: 110,
          background: PALETTE.hole,
          boxShadow: `inset 0 25px 40px rgba(0,0,0,0.95), 0 2px 4px rgba(255,255,255,0.03)`,
          border: `1px solid ${PALETTE.holeRim}`,
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
          const cosmetic = COSMETICS[0];
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
                background: `radial-gradient(circle at 30% 30%, ${cosmetic.colors[0]}, ${cosmetic.colors[1]}, ${cosmetic.colors[2]})`,
                boxShadow: isScooped ? `0 15px 25px rgba(0,0,0,0.9), 0 0 20px ${PALETTE.gold}50` : 'inset -2px -4px 6px rgba(0,0,0,0.7)',
                zIndex: isScooped ? 20 : 10,
                border: isScooped ? `2px solid ${PALETTE.gold}` : '1px solid rgba(0,0,0,0.5)',
              }}
            />
          );
        })}

        {/* Ghoen */}
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
      </div>
    </div>
  );
}
