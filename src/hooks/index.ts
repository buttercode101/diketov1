import { useCallback, useRef, useEffect } from 'react';
import { VIBRATION } from '../constants';

export function useAudio(volume: number) {
  const ctxRef = useRef<AudioContext | null>(null);

  const init = useCallback(() => {
    if (!ctxRef.current) {
      try {
        ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
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
    if (volume === 0) return;
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
      gain.gain.setValueAtTime(0.1 * volume * volMult, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Ignore audio errors
    }
  }, [volume, init]);

  const playNoise = useCallback((duration: number, volMult = 1) => {
    if (volume === 0) return;
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
      gain.gain.setValueAtTime(0.2 * volume * volMult, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch (e) {
      // Ignore audio errors
    }
  }, [volume, init]);

  const vibrate = useCallback((pattern: number | number[]) => {
    if (navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch (e) {}
    }
  }, []);

  return {
    resume,
    toss: () => { playTone(300, 'sine', 0.4, 1, 600); vibrate(VIBRATION.TOSS); },
    scoop: () => { playTone(800, 'square', 0.05, 0.5); playNoise(0.1, 0.5); vibrate(VIBRATION.SCOOP); },
    putBack: () => { playTone(400, 'triangle', 0.05, 0.5); vibrate(VIBRATION.SCOOP); },
    catch: () => { playTone(1200, 'sine', 0.3, 1, 2000); vibrate(VIBRATION.CATCH); },
    foul: () => { playTone(150, 'sawtooth', 0.6, 1, 50); vibrate(VIBRATION.FOUL); },
    win: () => {
      playTone(400, 'sine', 0.2);
      setTimeout(() => playTone(600, 'sine', 0.2), 200);
      setTimeout(() => playTone(800, 'sine', 0.4), 400);
      vibrate(VIBRATION.WIN);
    },
    click: () => { playTone(600, 'sine', 0.05, 0.2); vibrate(5); },
  };
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn('LocalStorage error:', error);
    }
  };

  return [storedValue, setValue] as const;
}

// Need to import useState at top level
import { useState } from 'react';

export function useArenaMeasurement() {
  const arenaRef = useRef<HTMLDivElement>(null);
  const [arenaSize, setArenaSize] = useState({ w: 340, h: 440 });

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
