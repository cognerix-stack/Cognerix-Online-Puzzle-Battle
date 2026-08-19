import React, { useState, useEffect, useRef } from 'react';
import { PuzzleType } from '@puzzle-verse/shared';
import { RotateCcw } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { translate } from '../utils/translations';

let globalAudioContext: AudioContext | null = null;
const getAudioContext = () => {
  if (!globalAudioContext) {
    globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return globalAudioContext;
};

const playInstantSlingshotSound = () => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(200, ctx.currentTime);
  osc1.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.02);
  osc1.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
  gain1.gain.setValueAtTime(0.14, ctx.currentTime);
  gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start();
  osc1.stop(ctx.currentTime + 0.15);
};

interface PhysicsPuzzleProps {
  onGameWin: (puzzleType: PuzzleType, timeInSec: number, score: number) => void;
  onClose?: (isQuit?: boolean) => void;
  onProgress?: (progress: number) => void;
  seed?: string;
  room?: any;
  headerActions?: React.ReactNode;
  isOnline?: boolean;
  onPlaySound?: (type: 'click' | 'success' | 'fail' | 'slingshot') => void;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LevelConfig {
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
  targetRadius: number;
  obstacles: Obstacle[];
}

const LEVEL_CONFIGS: LevelConfig[] = [
  // Level 1: Classic Middle Pillar (The original)
  {
    originX: 80,
    originY: 160,
    targetX: 390,
    targetY: 160,
    targetRadius: 18,
    obstacles: [{ x: 220, y: 70, width: 40, height: 180 }]
  },
  // Level 2: Low Gap Corridor (S-curve solve)
  {
    originX: 80,
    originY: 100,
    targetX: 410,
    targetY: 220,
    targetRadius: 18,
    obstacles: [
      { x: 180, y: 0, width: 50, height: 140 },
      { x: 280, y: 175, width: 50, height: 145 }
    ]
  },
  // Level 3: Dual Pillars
  {
    originX: 80,
    originY: 160,
    targetX: 420,
    targetY: 160,
    targetRadius: 16,
    obstacles: [
      { x: 180, y: 20, width: 30, height: 120 },
      { x: 280, y: 180, width: 30, height: 140 }
    ]
  },
  // Level 4: Floating Shield
  {
    originX: 80,
    originY: 220,
    targetX: 400,
    targetY: 80,
    targetRadius: 18,
    obstacles: [
      { x: 220, y: 100, width: 70, height: 70 }
    ]
  },
  // Level 5: High Arch Blockade
  {
    originX: 80,
    originY: 160,
    targetX: 420,
    targetY: 160,
    targetRadius: 18,
    obstacles: [
      { x: 210, y: 0, width: 50, height: 90 },
      { x: 210, y: 230, width: 50, height: 90 }
    ]
  },
  // Level 6: The Zig-Zag Alley
  {
    originX: 80,
    originY: 60,
    targetX: 420,
    targetY: 260,
    targetRadius: 16,
    obstacles: [
      { x: 160, y: 0, width: 40, height: 140 },
      { x: 260, y: 170, width: 40, height: 150 },
      { x: 360, y: 0, width: 40, height: 140 }
    ]
  },
  // Level 7: Maze Gateways
  {
    originX: 80,
    originY: 250,
    targetX: 420,
    targetY: 50,
    targetRadius: 18,
    obstacles: [
      { x: 160, y: 80, width: 120, height: 35 },
      { x: 250, y: 190, width: 120, height: 35 }
    ]
  },
  // Level 8: Corner Pocket
  {
    originX: 80,
    originY: 160,
    targetX: 430,
    targetY: 50,
    targetRadius: 15,
    obstacles: [
      { x: 350, y: 0, width: 30, height: 170 },
      { x: 200, y: 150, width: 30, height: 170 }
    ]
  },
  // Level 9: Central Cross Block
  {
    originX: 80,
    originY: 160,
    targetX: 400,
    targetY: 160,
    targetRadius: 18,
    obstacles: [
      { x: 220, y: 120, width: 40, height: 80 },
      { x: 200, y: 140, width: 80, height: 40 }
    ]
  },
  // Level 10: Slit Gateway
  {
    originX: 80,
    originY: 160,
    targetX: 410,
    targetY: 160,
    targetRadius: 14,
    obstacles: [
      { x: 220, y: 0, width: 30, height: 120 },
      { x: 220, y: 200, width: 30, height: 120 }
    ]
  },
  // Level 11: Laser Grid (Double narrow offset gates)
  {
    originX: 80,
    originY: 80,
    targetX: 430,
    targetY: 240,
    targetRadius: 15,
    obstacles: [
      { x: 160, y: 0, width: 30, height: 130 },
      { x: 160, y: 200, width: 30, height: 120 },
      { x: 300, y: 0, width: 30, height: 190 },
      { x: 300, y: 260, width: 30, height: 60 }
    ]
  },
  // Level 12: Gravity Funnel (Tight drop requiring precise floor-bounce)
  {
    originX: 80,
    originY: 50,
    targetX: 425,
    targetY: 270,
    targetRadius: 18,
    obstacles: [
      { x: 180, y: 0, width: 40, height: 210 },
      { x: 180, y: 280, width: 40, height: 40 },
      { x: 300, y: 110, width: 40, height: 210 }
    ]
  },
  // Level 13: The Gauntlet (Floating ring shield with tiny entry gate)
  {
    originX: 80,
    originY: 160,
    targetX: 410,
    targetY: 160,
    targetRadius: 15,
    obstacles: [
      { x: 220, y: 0, width: 40, height: 135 },
      { x: 220, y: 185, width: 40, height: 135 },
      { x: 340, y: 90, width: 30, height: 140 }
    ]
  },
  // Level 14: Pinball Maze (Checkerboard barrier pattern)
  {
    originX: 80,
    originY: 160,
    targetX: 410,
    targetY: 160,
    targetRadius: 15,
    obstacles: [
      { x: 180, y: 40, width: 40, height: 60 },
      { x: 180, y: 220, width: 40, height: 60 },
      { x: 260, y: 120, width: 40, height: 80 },
      { x: 340, y: 40, width: 40, height: 60 },
      { x: 340, y: 220, width: 40, height: 60 }
    ]
  },
  // Level 15: Spike Gate (High curve launch through tiny horizontal window)
  {
    originX: 80,
    originY: 240,
    targetX: 420,
    targetY: 80,
    targetRadius: 14,
    obstacles: [
      { x: 380, y: 0, width: 20, height: 50 },
      { x: 380, y: 110, width: 20, height: 210 },
      { x: 220, y: 100, width: 40, height: 220 }
    ]
  }
];

export const PhysicsPuzzle: React.FC<PhysicsPuzzleProps> = ({ onGameWin, onClose, onProgress, seed, room: _room, headerActions, isOnline, onPlaySound }) => {
  const { language } = useGame();
  const t = (key: string) => translate(key, language);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(480);
  const canvasHeight = Math.round(canvasWidth * (320 / 480));
  const dimensionsRef = useRef({ width: 480, height: 320 });

  // Resize observer to track container size dynamically
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      if (width > 0) {
        const height = Math.round(width * (320 / 480));
        setCanvasWidth(width);
        dimensionsRef.current = { width, height };
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const [attempts, setAttempts] = useState<number>(0);
  const [hasWon, setHasWon] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0);

  // Seeded random number generator
  const seededRandom = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = Math.imul(31, h) + s.charCodeAt(i) | 0;
    }
    let t = h += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const getSeededLevelIndex = () => {
    if (seed) {
      const val = seededRandom(seed);
      return Math.floor(val * LEVEL_CONFIGS.length);
    }
    return null;
  };

  const seededLevelIdx = getSeededLevelIndex();
  const [levelIdx, setLevelIdx] = useState<number>(0);
  
  const currentLevelIdx = seededLevelIdx !== null ? seededLevelIdx : levelIdx;
  const currentLevel = LEVEL_CONFIGS[currentLevelIdx];

  const hasWonRef = useRef(hasWon);
  const attemptsRef = useRef(attempts);
  const timerRef = useRef(timer);
  const onGameWinRef = useRef(onGameWin);
  const onProgressRef = useRef(onProgress);
  const onPlaySoundRef = useRef(onPlaySound);

  const lastProgressSentTimeRef = useRef<number>(0);
  const lastProgressSentValueRef = useRef<number>(-1);

  useEffect(() => {
    hasWonRef.current = hasWon;
    attemptsRef.current = attempts;
    timerRef.current = timer;
    onGameWinRef.current = onGameWin;
    onProgressRef.current = onProgress;
    onPlaySoundRef.current = onPlaySound;
  }, [hasWon, attempts, timer, onGameWin, onProgress, onPlaySound]);

  const ballRef = useRef({
    x: currentLevel.originX,
    y: currentLevel.originY,
    vx: 0,
    vy: 0,
    radius: 10,
    isLaunched: false,
    isDragging: false,
    dragX: currentLevel.originX,
    dragY: currentLevel.originY
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync ball position when level changes
  useEffect(() => {
    const ball = ballRef.current;
    ball.x = currentLevel.originX;
    ball.y = currentLevel.originY;
    ball.vx = 0;
    ball.vy = 0;
    ball.isLaunched = false;
    ball.isDragging = false;
    setAttempts(0);
    setHasWon(false);
    if (onProgressRef.current) onProgressRef.current(0);
  }, [currentLevelIdx, currentLevel]);

  const handleReset = () => {
    const ball = ballRef.current;
    ball.x = currentLevel.originX;
    ball.y = currentLevel.originY;
    ball.vx = 0;
    ball.vy = 0;
    ball.isLaunched = false;
    ball.isDragging = false;
    setHasWon(false);
    if (onProgressRef.current) onProgressRef.current(0);
    onPlaySound?.('click');
  };

  // Main Canvas animation render loop
  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const loop = () => {
      const time = performance.now();
      let dt = (time - lastTime) / 16.666;
      if (dt > 4) dt = 4;
      lastTime = time;

      const isLight = document.documentElement.classList.contains('light-theme');
      
      const currentWidth = dimensionsRef.current.width;
      const currentHeight = dimensionsRef.current.height;
      ctx.clearRect(0, 0, currentWidth, currentHeight);

      ctx.save();
      const scale = currentWidth / 480;
      ctx.scale(scale, scale);

      // Draw Grid lines
      ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.02)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 480; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 320);
        ctx.stroke();
      }
      for (let j = 0; j < 320; j += 20) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(480, j);
        ctx.stroke();
      }

      const ball = ballRef.current;

      // Update Physics
      if (ball.isLaunched && !hasWonRef.current) {
        ball.vy += 0.15 * dt;
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;

        // Wall collisions (using virtual 480x320 boundaries)
        if (ball.x - ball.radius < 0) {
          ball.x = ball.radius;
          ball.vx = -ball.vx * 0.7;
        } else if (ball.x + ball.radius > 480) {
          ball.x = 480 - ball.radius;
          ball.vx = -ball.vx * 0.7;
        }

        if (ball.y - ball.radius < 0) {
          ball.y = ball.radius;
          ball.vy = -ball.vy * 0.7;
        } else if (ball.y + ball.radius > 320) {
          ball.y = 320 - ball.radius;
          ball.vy = -ball.vy * 0.7;
          ball.vx *= Math.pow(0.98, dt);
        }

        // Multiple Obstacle Collisions
        currentLevel.obstacles.forEach(obs => {
          const closestX = Math.max(obs.x, Math.min(ball.x, obs.x + obs.width));
          const closestY = Math.max(obs.y, Math.min(ball.y, obs.y + obs.height));
          const distX = ball.x - closestX;
          const distY = ball.y - closestY;
          const distance = Math.sqrt(distX * distX + distY * distY);

          if (distance < ball.radius) {
            const overlap = ball.radius - distance;
            if (distance > 0) {
              const nx = distX / distance;
              const ny = distY / distance;
              ball.x += nx * overlap;
              ball.y += ny * overlap;

              const dot = ball.vx * nx + ball.vy * ny;
              ball.vx = (ball.vx - 2 * dot * nx) * 0.7;
              ball.vy = (ball.vy - 2 * dot * ny) * 0.7;
            } else {
              ball.x -= ball.vx * dt;
              ball.vx = -ball.vx * 0.7;
            }
          }
        });

        // Target hits
        const targetDistX = ball.x - currentLevel.targetX;
        const targetDistY = ball.y - currentLevel.targetY;
        const targetDist = Math.sqrt(targetDistX * targetDistX + targetDistY * targetDistY);

        const initialDist = Math.sqrt((currentLevel.originX - currentLevel.targetX) ** 2 + (currentLevel.originY - currentLevel.targetY) ** 2);
        const progressPercent = Math.min(100, Math.max(0, Math.floor((1 - (targetDist / initialDist)) * 100)));
        
        const now = Date.now();
        if (progressPercent !== lastProgressSentValueRef.current && (now - lastProgressSentTimeRef.current > 200 || progressPercent === 100)) {
          lastProgressSentValueRef.current = progressPercent;
          lastProgressSentTimeRef.current = now;
          if (onProgressRef.current) onProgressRef.current(progressPercent);
        }

        if (targetDist < ball.radius + currentLevel.targetRadius) {
          setHasWon(true);
          ball.vx = 0;
          ball.vy = 0;
          const score = Math.max(50, 400 - attemptsRef.current * 30 - Math.floor(timerRef.current / 1.5));
          if (onGameWinRef.current) onGameWinRef.current(PuzzleType.PHYSICS, timerRef.current, score);
          if (onPlaySoundRef.current) onPlaySoundRef.current('success');
        }
      }

      // Draw Obstacles
      currentLevel.obstacles.forEach(obs => {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
      });

      // Draw Slingshot Bands
      if (ball.isDragging) {
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.6)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(currentLevel.originX, currentLevel.originY - 15);
        ctx.lineTo(ball.x, ball.y);
        ctx.lineTo(currentLevel.originX, currentLevel.originY + 15);
        ctx.stroke();
      }

      // Draw Slingshot stands
      ctx.fillStyle = isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)';
      ctx.fillRect(currentLevel.originX - 3, currentLevel.originY, 6, 320 - currentLevel.originY);

      // Draw Target Beacon (Glow green)
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 15;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(currentLevel.targetX, currentLevel.targetY, currentLevel.targetRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw Ball (Glow cyan/violet)
      ctx.shadowColor = ball.isDragging ? '#8b5cf6' : '#06b6d4';
      ctx.shadowBlur = ball.isDragging ? 20 : 10;
      ctx.fillStyle = ball.isDragging ? '#8b5cf6' : '#06b6d4';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Path preview
      if (ball.isDragging) {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.65)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        let px = ball.x;
        let py = ball.y;
        let pvx = (currentLevel.originX - ball.x) * 0.28;
        let pvy = (currentLevel.originY - ball.y) * 0.28;
        for (let t = 0; t < 30; t++) {
          pvy += 0.15;
          px += pvx;
          py += pvy;
          if (t === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationId);
  }, [currentLevel]);

  // Mouse listeners
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = 480 / rect.width;
    const scaleY = 320 / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hasWon) return;
    const { x, y } = getMousePos(e);
    const ball = ballRef.current;

    const dist = Math.sqrt((x - ball.x) ** 2 + (y - ball.y) ** 2);
    if (dist < ball.radius * 2 && !ball.isLaunched) {
      playInstantSlingshotSound();
      ball.isDragging = true;
      ball.x = x;
      ball.y = y;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const ball = ballRef.current;
    if (!ball.isDragging) return;
    const { x, y } = getMousePos(e);

    const maxDrag = 60;
    const distX = x - currentLevel.originX;
    const distY = y - currentLevel.originY;
    const dragDist = Math.sqrt(distX * distX + distY * distY);

    if (dragDist > maxDrag) {
      ball.x = currentLevel.originX + (distX / dragDist) * maxDrag;
      ball.y = currentLevel.originY + (distY / dragDist) * maxDrag;
    } else {
      ball.x = x;
      ball.y = y;
    }
  };

  const handleMouseUp = () => {
    const ball = ballRef.current;
    if (!ball.isDragging) return;

    ball.isDragging = false;
    ball.isLaunched = true;
    ball.vx = (currentLevel.originX - ball.x) * 0.28;
    ball.vy = (currentLevel.originY - ball.y) * 0.28;
    setAttempts(prev => prev + 1);
  };

  // Touch listeners
  const getTouchPos = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = 480 / rect.width;
    const scaleY = 320 / rect.height;
    return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top) * scaleY
    };
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (hasWon) return;
    const { x, y } = getTouchPos(e);
    const ball = ballRef.current;

    const dist = Math.sqrt((x - ball.x) ** 2 + (y - ball.y) ** 2);
    if (dist < ball.radius * 2 && !ball.isLaunched) {
      if (e.cancelable) e.preventDefault();
      playInstantSlingshotSound();
      ball.isDragging = true;
      ball.x = x;
      ball.y = y;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const ball = ballRef.current;
    if (!ball.isDragging) return;
    if (e.cancelable) e.preventDefault();
    const { x, y } = getTouchPos(e);

    const maxDrag = 60;
    const distX = x - currentLevel.originX;
    const distY = y - currentLevel.originY;
    const dragDist = Math.sqrt(distX * distX + distY * distY);

    if (dragDist > maxDrag) {
      ball.x = currentLevel.originX + (distX / dragDist) * maxDrag;
      ball.y = currentLevel.originY + (distY / dragDist) * maxDrag;
    } else {
      ball.x = x;
      ball.y = y;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const ball = ballRef.current;
    if (!ball.isDragging) return;
    if (e.cancelable) e.preventDefault();

    ball.isDragging = false;
    ball.isLaunched = true;
    ball.vx = (currentLevel.originX - ball.x) * 0.28;
    ball.vy = (currentLevel.originY - ball.y) * 0.28;
    setAttempts(prev => prev + 1);
  };

  const isLight = document.documentElement.classList.contains('light-theme');

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center' }}>
            {t('physics_name')}
            {headerActions}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('physics_desc')}</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {/* Level Selector */}
          {seed ? (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '12px', color: 'var(--color-success)', fontWeight: 'bold' }}>
              🏆 {t('level')} {currentLevelIdx + 1} ({t('seeded_duel')})
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              <button 
                disabled={levelIdx === 0} 
                onClick={() => setLevelIdx(prev => prev - 1)}
                className="btn-glass"
                style={{ border: 'none', background: 'transparent', color: levelIdx === 0 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: levelIdx === 0 ? 'not-allowed' : 'pointer', fontSize: '14px', padding: '2px 6px', fontWeight: 'bold' }}
              >
                ◀
              </button>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                {t('level')} {levelIdx + 1} / 15
              </span>
              <button 
                disabled={levelIdx === LEVEL_CONFIGS.length - 1} 
                onClick={() => setLevelIdx(prev => prev + 1)}
                className="btn-glass"
                style={{ border: 'none', background: 'transparent', color: levelIdx === LEVEL_CONFIGS.length - 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: levelIdx === LEVEL_CONFIGS.length - 1 ? 'not-allowed' : 'pointer', fontSize: '14px', padding: '2px 6px', fontWeight: 'bold' }}
              >
                ▶
              </button>
            </div>
          )}

          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('launch_retries')}</p>
            <h4 style={{ fontSize: '18px', color: 'var(--color-primary)', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
              {attempts} {t('attempts').toLowerCase()}
            </h4>
          </div>
        </div>
      </div>

      <div ref={containerRef} style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          style={{
            background: isLight ? '#f1f5f9' : '#0d091e',
            border: isLight ? '2px solid #cbd5e1' : '2px solid rgba(139, 92, 246, 0.25)',
            boxShadow: isLight ? 'none' : 'inset 0 0 20px rgba(0, 0, 0, 0.55), 0 0 15px rgba(139, 92, 246, 0.08)',
            borderRadius: '12px',
            cursor: hasWon ? 'default' : 'crosshair',
            width: '100%',
            maxWidth: '480px',
            touchAction: 'none'
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <button 
          className="btn btn-glass" 
          style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          onClick={handleReset}
        >
          <RotateCcw size={16} />
          Reload Ball
        </button>

        {onClose && !isOnline && (
          <button className="btn btn-glass" style={{ flex: 1, padding: '12px' }} onClick={() => onClose(true)}>
            Close Board
          </button>
        )}
      </div>
    </div>
  );
};

export default PhysicsPuzzle;
