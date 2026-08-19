import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PuzzleType } from '@puzzle-verse/shared';
import { RefreshCcw, Award, Zap, Building2, Heart, Sparkles, Wind } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { translate } from '../utils/translations';
import { MultiplayerService } from '../services/multiplayer';

const playMobileSound = (frequency: number, duration: number, volume: number = 0.3) => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
    osc.onended = () => ctx.close();
  } catch (e) {}
};

interface TowerBloxxProps {
  onGameWin: (puzzleType: PuzzleType, timeInSec: number, score: number) => void;
  onClose?: (isQuit?: boolean) => void;
  onProgress?: (progress: number) => void;
  room?: any;
  headerActions?: React.ReactNode;
  onPlaySound?: (type: 'click' | 'success' | 'fail' | 'correct' | 'slide' | 'slingshot' | 'wind' | 'wind_alert') => void;
}

interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  isPerfect: boolean;
  animal: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

const TARGET_FLOORS = 15;
const BLOCK_WIDTH = 118;
const BLOCK_HEIGHT = 56;
const CANVAS_WIDTH = 420;
const CANVAS_HEIGHT = 560;

const CUTE_ANIMALS = ['🐶', '🐱', '🐰', '🐻', '🦊', '🐼', '🐨', '🐸'];

export const TowerBloxx: React.FC<TowerBloxxProps> = ({ onGameWin, onClose, onProgress, room: _room, headerActions, onPlaySound }) => {
  const { language, userProfile, saveProfile } = useGame();
  const t = (key: string) => translate(key, language);

  const onPlaySoundRef = useRef(onPlaySound);
  onPlaySoundRef.current = onPlaySound;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropSoundPlayedRef = useRef<boolean>(false);
  const [canvasWidth, setCanvasWidth] = useState(420);
  const canvasHeight = Math.round(canvasWidth * (560 / 420));
  const dimensionsRef = useRef({ width: 420, height: 560 });

  // Resize observer to scale canvas dimensions based on container width
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      if (width > 0) {
        const height = Math.round(width * (560 / 420));
        setCanvasWidth(width);
        dimensionsRef.current = { width, height };
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Game state
  const [score, setScore] = useState<number>(0);
  const [floors, setFloors] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [combo, setCombo] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [comboText, setComboText] = useState<{ text: string; color: string } | null>(null);

  // Store callbacks in refs to avoid restarting canvas loop on re-render
  const onGameWinRef = useRef(onGameWin);
  onGameWinRef.current = onGameWin;

  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  const scoreRef = useRef(score);
  scoreRef.current = score;

  const timerRef = useRef(timer);
  timerRef.current = timer;

  // Animation & Physics refs
  const stateRef = useRef({
    craneAngle: 0,
    craneSpeed: 0.028,
    craneAmplitude: 140,
    
    currentBlock: null as { x: number; y: number; vy: number; isFalling: boolean; color: string; animal: string } | null,
    stackedBlocks: [] as Block[],
    particles: [] as Particle[],
    cameraY: 0,
    targetCameraY: 0,
    towerWobble: 0,
    windGustEndTime: 0,
    isProcessingWin: false,
    isGameOver: false,
    lastTime: Date.now()
  });

  // Spawn next house block hanging on swinging crane
  const spawnNextBlock = useCallback(() => {
    const floorIdx = stateRef.current.stackedBlocks.length;
    const nextAnimal = CUTE_ANIMALS[floorIdx % CUTE_ANIMALS.length];
    const hookY = -stateRef.current.cameraY + 95;

    stateRef.current.currentBlock = {
      x: CANVAS_WIDTH / 2 - BLOCK_WIDTH / 2,
      y: hookY + 15,
      vy: 0,
      isFalling: false,
      color: '',
      animal: nextAnimal
    };
  }, []);

  // Initialize fresh game state
  const startNewGame = useCallback(() => {
    stateRef.current.stackedBlocks = [];
    stateRef.current.particles = [];
    stateRef.current.cameraY = 0;
    stateRef.current.targetCameraY = 0;
    stateRef.current.craneAngle = 0;
    stateRef.current.towerWobble = 0;
    stateRef.current.windGustEndTime = 0;
    stateRef.current.isProcessingWin = false;
    stateRef.current.isGameOver = false;
    stateRef.current.lastTime = Date.now();

    setScore(0);
    setFloors(0);
    setLives(3);
    setCombo(0);
    setTimer(0);
    setIsGameOver(false);
    setComboText(null);

    playMobileSound(450, 0.05, 0.06);
    spawnNextBlock();
    if (onProgressRef.current) onProgressRef.current(0);
  }, [spawnNextBlock]);

  // Timer loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (!stateRef.current.isGameOver) setTimer(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Particle generator helper
  const createParticleExplosion = (x: number, y: number, color: string) => {
    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 1.5;
      stateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 5 + 2,
        color,
        alpha: 1
      });
    }
  };

  // Drop current block from crane
  const handleDropBlock = useCallback(() => {
    if (stateRef.current.isGameOver || !stateRef.current.currentBlock || stateRef.current.currentBlock.isFalling) return;

    // if (onPlaySoundRef.current) onPlaySoundRef.current('slide');
    stateRef.current.currentBlock.isFalling = true;
    stateRef.current.currentBlock.vy = 8; // Initial drop velocity
  }, []);

  // Handle Wind Gust Special Ability Attack (Costs 750 Coins and 150 Gems, wobbles for 3 sec left-to-right)
  const handleWindGustAttack = useCallback(() => {
    const costCoins = 750;
    const costGems = 150;

    if (userProfile.coins < costCoins || userProfile.gems < costGems) {
      setComboText({ 
        text: `NEED 750 🪙 & 150 💎 FOR WIND GUST!`, 
        color: '#ef4444' 
      });
      playMobileSound(370, 0.08, 0.15);
      setTimeout(() => playMobileSound(370, 0.08, 0.15), 100);
      setTimeout(() => setComboText(null), 2200);
      return;
    }

    playMobileSound(180, 0.8, 0.08);

    // Deduct coins & gems
    saveProfile({
      ...userProfile,
      coins: userProfile.coins - costCoins,
      gems: userProfile.gems - costGems
    });

    // Spawn outward wind gust particle effect (Attacker stays stable!)
    for (let i = 0; i < 45; i++) {
      stateRef.current.particles.push({
        x: -20 - Math.random() * 100,
        y: Math.random() * CANVAS_HEIGHT - stateRef.current.cameraY,
        vx: Math.random() * 18 + 10,
        vy: (Math.random() - 0.5) * 3,
        size: Math.random() * 14 + 6,
        color: 'rgba(255, 255, 255, 0.85)',
        alpha: 1
      });
    }

    // Send wind gust attack signal to opponent if in 1v1 Arena
    if (_room) {
      MultiplayerService.sendWindGust(_room, userProfile.username);
      setComboText({ text: '💨 WIND GUST UNLEASHED ON OPPONENT! (THEIR TOWER IS SWAYING!)', color: '#38bdf8' });
    } else {
      setComboText({ text: '💨 WIND GUST UNLEASHED! (OPPONENT TARGETED)', color: '#38bdf8' });
    }
    setTimeout(() => setComboText(null), 3000);
  }, [userProfile, saveProfile, _room]);

  // Listen for incoming Wind Gust attack from opponent in 1v1 Arena
  useEffect(() => {
    if (_room) {
      const listener = _room.onMessage('wind_gust_received', (data: { attackerName?: string }) => {
        const attacker = data?.attackerName || 'Opponent';

        // Play incoming wind gust alert sound
        playMobileSound(659, 0.25, 0.1);
        playMobileSound(987, 0.25, 0.08);

        // Set 3-second wind gust wobble
        stateRef.current.windGustEndTime = Date.now() + 3000;

        // Spawn incoming wind gust cloud particles storm
        for (let i = 0; i < 60; i++) {
          stateRef.current.particles.push({
            x: CANVAS_WIDTH + Math.random() * 100,
            y: Math.random() * CANVAS_HEIGHT - stateRef.current.cameraY,
            vx: -(Math.random() * 14 + 8),
            vy: (Math.random() - 0.5) * 4,
            size: Math.random() * 16 + 8,
            color: 'rgba(255, 255, 255, 0.9)',
            alpha: 1
          });
        }

        setComboText({ text: `⚠️ ${attacker.toUpperCase()} UNLEASHED WIND GUST! TOWER SWAYING (3s)!`, color: '#ef4444' });
        setTimeout(() => setComboText(null), 3000);
      });

      return () => {
        if (listener && typeof listener.clear === 'function') listener.clear();
      };
    }
  }, [_room]);

  // Keyboard controls (Spacebar or Enter to drop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        playMobileSound(350, 0.06);
        handleDropBlock();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDropBlock]);

  // Helper: Draw detailed Animal Cottage House with Ears, Windows, Door, and Peeking Waving Resident
  const renderAnimalHouse = (
    ctx: CanvasRenderingContext2D,
    b: { x: number; y: number; width?: number; height?: number; color: string; isPerfect?: boolean; animal: string },
    idx: number,
    now: number,
    isFalling: boolean
  ) => {
    const width = b.width || BLOCK_WIDTH;
    const height = b.height || BLOCK_HEIGHT;
    const isPerfect = b.isPerfect || false;
    const { x, y, animal } = b;

    const themes = [
      { type: 'PUPPY', earType: 'FLOPPY', wall: '#fbbf24', roof: '#b45309', earColor: '#92400e', door: '#78350f' },
      { type: 'KITTY', earType: 'CAT', wall: '#38bdf8', roof: '#f43f5e', earColor: '#38bdf8', door: '#0284c7' },
      { type: 'BUNNY', earType: 'BUNNY', wall: '#f472b6', roof: '#a855f7', earColor: '#f472b6', door: '#db2777' },
      { type: 'BEAR', earType: 'BEAR', wall: '#f97316', roof: '#78350f', earColor: '#ea580c', door: '#451a03' },
      { type: 'FOX', earType: 'FOX', wall: '#fb923c', roof: '#dc2626', earColor: '#f97316', door: '#9a3412' },
      { type: 'PANDA', earType: 'PANDA', wall: '#34d399', roof: '#1e293b', earColor: '#0f172a', door: '#047857' },
      { type: 'KOALA', earType: 'KOALA', wall: '#94a3b8', roof: '#475569', earColor: '#64748b', door: '#334155' },
      { type: 'FROG', earType: 'FROG', wall: '#4ade80', roof: '#059669', earColor: '#22c55e', door: '#15803d' }
    ];

    const theme = themes[idx % themes.length];
    const wallColor = b.color || theme.wall;

    // 1. Draw Animal Ears on Roof
    ctx.save();
    if (theme.earType === 'CAT') {
      ctx.fillStyle = theme.earColor;
      ctx.beginPath();
      ctx.moveTo(x + 10, y);
      ctx.lineTo(x + 22, y - 16);
      ctx.lineTo(x + 30, y);
      ctx.fill();
      ctx.fillStyle = '#fda4af';
      ctx.beginPath();
      ctx.moveTo(x + 14, y);
      ctx.lineTo(x + 22, y - 10);
      ctx.lineTo(x + 27, y);
      ctx.fill();

      ctx.fillStyle = theme.earColor;
      ctx.beginPath();
      ctx.moveTo(x + width - 30, y);
      ctx.lineTo(x + width - 22, y - 16);
      ctx.lineTo(x + width - 10, y);
      ctx.fill();
      ctx.fillStyle = '#fda4af';
      ctx.beginPath();
      ctx.moveTo(x + width - 27, y);
      ctx.lineTo(x + width - 22, y - 10);
      ctx.lineTo(x + width - 14, y);
      ctx.fill();
    } else if (theme.earType === 'BUNNY') {
      ctx.fillStyle = theme.earColor;
      ctx.beginPath();
      ctx.ellipse(x + 26, y - 12, 6, 16, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fda4af';
      ctx.beginPath();
      ctx.ellipse(x + 26, y - 12, 3, 10, -0.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = theme.earColor;
      ctx.beginPath();
      ctx.ellipse(x + width - 26, y - 12, 6, 16, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fda4af';
      ctx.beginPath();
      ctx.ellipse(x + width - 26, y - 12, 3, 10, 0.1, 0, Math.PI * 2);
      ctx.fill();
    } else if (theme.earType === 'BEAR' || theme.earType === 'PANDA') {
      ctx.fillStyle = theme.earColor;
      ctx.beginPath();
      ctx.arc(x + 16, y - 4, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(x + 16, y - 4, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = theme.earColor;
      ctx.beginPath();
      ctx.arc(x + width - 16, y - 4, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(x + width - 16, y - 4, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (theme.earType === 'FLOPPY') {
      ctx.fillStyle = theme.earColor;
      ctx.beginPath();
      ctx.ellipse(x - 4, y + 18, 7, 16, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + width + 4, y + 18, 7, 16, -0.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (theme.earType === 'FOX') {
      ctx.fillStyle = theme.earColor;
      ctx.beginPath();
      ctx.moveTo(x + 10, y);
      ctx.lineTo(x + 22, y - 18);
      ctx.lineTo(x + 32, y);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x + 15, y);
      ctx.lineTo(x + 22, y - 10);
      ctx.lineTo(x + 28, y);
      ctx.fill();

      ctx.fillStyle = theme.earColor;
      ctx.beginPath();
      ctx.moveTo(x + width - 32, y);
      ctx.lineTo(x + width - 22, y - 18);
      ctx.lineTo(x + width - 10, y);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x + width - 28, y);
      ctx.lineTo(x + width - 22, y - 10);
      ctx.lineTo(x + width - 15, y);
      ctx.fill();
    } else if (theme.earType === 'FROG') {
      ctx.fillStyle = theme.earColor;
      ctx.beginPath();
      ctx.arc(x + 22, y - 6, 8, 0, Math.PI * 2);
      ctx.arc(x + width - 22, y - 6, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x + 22, y - 6, 4, 0, Math.PI * 2);
      ctx.arc(x + width - 22, y - 6, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 2. House Facade Wall
    ctx.fillStyle = wallColor;
    ctx.shadowColor = wallColor;
    ctx.shadowBlur = isPerfect ? 14 : 4;
    ctx.fillRect(x, y, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x, y, width, height);
    ctx.shadowBlur = 0;

    // 3. Roof Eaves / Tile Scalloping
    ctx.fillStyle = theme.roof;
    ctx.fillRect(x - 4, y - 2, width + 8, 8);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - 4, y - 2, width + 8, 8);

    // 4. Arched Wooden Front Door
    const doorX = x + width - 34;
    const doorY = y + height - 32;
    const doorW = 22;
    const doorH = 32;
    ctx.fillStyle = theme.door;
    ctx.beginPath();
    ctx.arc(doorX + doorW / 2, doorY + 10, doorW / 2, Math.PI, 0, false);
    ctx.rect(doorX, doorY + 10, doorW, doorH - 10);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Brass Doorknob
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(doorX + 5, doorY + 20, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 5. Cozy Window with Peeking & Waving Animal
    const winX = x + 12;
    const winY = y + 12;
    const winW = 44;
    const winH = 34;

    // Window Frame & Interior Glow
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(winX, winY, winW, winH);
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2;
    ctx.strokeRect(winX, winY, winW, winH);

    // Window Sill
    ctx.fillStyle = '#b45309';
    ctx.fillRect(winX - 2, winY + winH, winW + 4, 4);

    // Peeking Animal Head (Bobbing up & down)
    const bobY = Math.sin(now * 0.005 + idx) * 2;
    ctx.save();
    // Clip inside window frame
    ctx.beginPath();
    ctx.rect(winX + 1, winY + 1, winW - 2, winH - 2);
    ctx.clip();

    ctx.font = '22px sans-serif';
    ctx.fillText(animal, winX + 4, winY + 24 + bobY);

    // Waving Paw 👋
    const waveAngle = Math.sin(now * 0.008 + idx * 2) * 16;
    ctx.save();
    ctx.translate(winX + 32, winY + 16 + bobY);
    ctx.rotate((waveAngle * Math.PI) / 180);
    ctx.font = '14px sans-serif';
    ctx.fillText('👋', 0, 0);
    ctx.restore();

    ctx.restore();

    // Floor Badge (Cute wooden sign on side)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(x + 4, y + 4, 22, 14);
    ctx.strokeStyle = theme.roof;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 4, y + 4, 22, 14);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(`F${idx + 1}`, x + 7, y + 15);

    // Top Hook Attachment Ring (if hanging on crane)
    if (!isFalling && y < 150) {
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x + width / 2, y - 2, 5, Math.PI, 0, false);
      ctx.stroke();
    }
  };

  // Canvas loop running ONCE on mount
  useEffect(() => {
    startNewGame();

    let animationFrameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const state = stateRef.current;
      const now = Date.now();
      const deltaTime = Math.min(100, now - state.lastTime);
      state.lastTime = now;
      const frameFactor = deltaTime / 16.666;

      // Smooth camera interpolation
      state.cameraY += (state.targetCameraY - state.cameraY) * 0.08 * frameFactor;

      // Calculate dynamic swinging speed (progressive difficulty increase for floors 10 to 15)
      const floorsCount = state.stackedBlocks.length;
      const currentSpeed = floorsCount >= 10
        ? state.craneSpeed * (1 + (floorsCount - 10) * 0.15)
        : state.craneSpeed;

      // Update swinging crane angle
      state.craneAngle += currentSpeed * frameFactor;
      const swingX = CANVAS_WIDTH / 2 + Math.sin(state.craneAngle) * state.craneAmplitude;

      // Crane Hook World Coordinates (Locked relative to viewport top)
      const hookY = -state.cameraY + 95;

      // Update hanging / falling house block
      if (state.currentBlock) {
        if (!state.currentBlock.isFalling) {
          state.currentBlock.x = swingX - BLOCK_WIDTH / 2;
          state.currentBlock.y = hookY + 15;
        } else {
          // Accelerate downwards under gravity
          state.currentBlock.vy += 0.5 * frameFactor;
          state.currentBlock.y += state.currentBlock.vy * frameFactor;

          // Target resting Y level
          const targetY = state.stackedBlocks.length === 0
            ? CANVAS_HEIGHT - 60 - BLOCK_HEIGHT
            : state.stackedBlocks[state.stackedBlocks.length - 1].y - BLOCK_HEIGHT;

          // Check if landed at target Y
          if (state.currentBlock.y >= targetY) {
            state.currentBlock.y = targetY;

            // Target X alignment
            const targetX = state.stackedBlocks.length === 0
              ? CANVAS_WIDTH / 2 - BLOCK_WIDTH / 2
              : state.stackedBlocks[state.stackedBlocks.length - 1].x;

            const offset = Math.abs(state.currentBlock.x - targetX);
            const maxAllowedOffset = BLOCK_WIDTH * 0.55; // Landing tolerance

            if (offset <= maxAllowedOffset) {
              // Successfully landed!
              const isPerfect = offset <= 8;
              const isGreat = offset <= 24;

              let points = 100;

              if (isPerfect) {
                points = 250;
                setCombo(c => {
                  const mult = c + 1;
                  setComboText({ text: `PERFECT STACK! ✨ ${mult}x`, color: '#10b981' });
                  return mult;
                });
                createParticleExplosion(state.currentBlock.x + BLOCK_WIDTH / 2, state.currentBlock.y, '#10b981');
              } else if (isGreat) {
                points = 150;
                setComboText({ text: 'GREAT LANDING! 🏡', color: '#38bdf8' });
                createParticleExplosion(state.currentBlock.x + BLOCK_WIDTH / 2, state.currentBlock.y, '#38bdf8');
              } else {
                setCombo(0);
                setComboText({ text: 'WOBBLY HOME! ⚠️', color: '#f59e0b' });
                state.towerWobble = (Math.random() > 0.5 ? 1 : -1) * (offset * 0.4);
              }

              setTimeout(() => setComboText(null), 1000);

              const newBlock: Block = {
                x: state.currentBlock.x,
                y: state.currentBlock.y,
                width: BLOCK_WIDTH,
                height: BLOCK_HEIGHT,
                color: state.currentBlock.color,
                isPerfect,
                animal: state.currentBlock.animal
              };

              state.stackedBlocks.push(newBlock);

              // Update stats
              const newFloors = state.stackedBlocks.length;
              setFloors(newFloors);
              setScore(s => s + points);

              const newProgress = Math.min(100, Math.floor((newFloors / TARGET_FLOORS) * 100));
              if (onProgressRef.current) onProgressRef.current(newProgress);

              // Scroll camera up as house tower grows
              if (newFloors > 3) {
                state.targetCameraY = (newFloors - 3) * BLOCK_HEIGHT;
              }

              // Check win
              if (newFloors >= TARGET_FLOORS && !state.isProcessingWin) {
                state.isProcessingWin = true;
                playMobileSound(523, 0.25, 0.15);
                setTimeout(() => playMobileSound(659, 0.25, 0.15), 60);
                setTimeout(() => playMobileSound(784, 0.25, 0.15), 120);
                const finalScore = scoreRef.current + points;
                onGameWinRef.current(PuzzleType.TOWER_BLOXX, timerRef.current, finalScore);
              } else {
                if (isPerfect || isGreat) {
                  playMobileSound(784, 0.15, 0.15);
                  setTimeout(() => playMobileSound(1046, 0.15, 0.15), 50);
                } else {
                  playMobileSound(450, 0.05, 0.06);
                }
                spawnNextBlock();
              }
            } else {
              // Missed / Fell into abyss!
              createParticleExplosion(state.currentBlock.x + BLOCK_WIDTH / 2, state.currentBlock.y, '#ef4444');
              setCombo(0);
              setComboText({ text: 'MISSED! ❌', color: '#ef4444' });
              setTimeout(() => setComboText(null), 1000);

              setLives(l => {
                const nextLives = l - 1;
                playMobileSound(370, 0.08, 0.15);
                setTimeout(() => playMobileSound(370, 0.08, 0.15), 100);
                if (nextLives <= 0) {
                  state.isGameOver = true;
                  setIsGameOver(true);
                } else {
                  spawnNextBlock();
                }
                return nextLives;
              });
            }
          }
        }
      }

      // Calculate 3-second Sinusoidal Left-to-Right Violent Wind Gust Sway
      const windRemaining = state.windGustEndTime - now;
      if (windRemaining > 0) {
        const progress = 1 - (windRemaining / 3000); // 0 to 1 over 3 sec
        const envelope = Math.sin(progress * Math.PI); // smooth 0 -> 1 -> 0 bell curve
        const swayAngle = Math.sin(now * 0.022) * 68 * envelope; // Violent left-to-right wobble (68px amplitude)
        state.towerWobble = swayAngle;

        // Continuously spawn fast flying wind cloud particles during 3 seconds
        if (Math.random() < 0.7) {
          state.particles.push({
            x: -40,
            y: Math.random() * CANVAS_HEIGHT - state.cameraY,
            vx: Math.random() * 18 + 12,
            vy: (Math.random() - 0.5) * 4,
            size: Math.random() * 16 + 6,
            color: 'rgba(255, 255, 255, 0.9)',
            alpha: 1
          });
        }
      } else {
        // Normal wobble decay
        state.towerWobble *= Math.pow(0.90, frameFactor);
      }

      // --- RENDER CANVAS GRAPHICS ---
      const currentWidth = dimensionsRef.current.width;
      const currentHeight = dimensionsRef.current.height;
      ctx.clearRect(0, 0, currentWidth, currentHeight);

      ctx.save();
      // Apply responsive scale factor based on container width
      const scale = currentWidth / 420;
      ctx.scale(scale, scale);

      // Apply camera pan & violent wobbly physics (Full 100% scale)
      ctx.translate(state.towerWobble, state.cameraY);

      // 1. Cozy Sky & Ground
      const isLightMode = document.documentElement.classList.contains('light-theme');
      const skyGradient = ctx.createLinearGradient(0, -state.cameraY, 0, CANVAS_HEIGHT - state.cameraY);
      skyGradient.addColorStop(0, isLightMode ? '#f0f9ff' : '#0a061a');
      skyGradient.addColorStop(1, isLightMode ? '#e0f2fe' : '#1e1b4b');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, -state.cameraY, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Cute Grass & Platform Base
      const groundY = CANVAS_HEIGHT - 60;
      ctx.fillStyle = isLightMode ? '#4ade80' : '#15803d';
      ctx.fillRect(20, groundY, CANVAS_WIDTH - 40, 60);
      ctx.fillStyle = isLightMode ? '#22c55e' : '#166534';
      ctx.fillRect(20, groundY, CANVAS_WIDTH - 40, 8);

      // 2. Draw Stacked Cozy Animal Houses
      state.stackedBlocks.forEach((b, idx) => {
        renderAnimalHouse(ctx, b, idx, now, false);
      });

      // 3. Draw Burst Particles
      state.particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.025;

        if (p.alpha <= 0) {
          state.particles.splice(i, 1);
        } else {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;

      // 4. Draw Authentic Construction Crane & Metallic J-Hook
      const topPivotY = -state.cameraY;
      
      // Steel Braided Cable
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2, topPivotY);
      ctx.lineTo(swingX, hookY);
      ctx.stroke();

      // Cable Inner Steel Core Line
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2, topPivotY);
      ctx.lineTo(swingX, hookY);
      ctx.stroke();

      // Crane Pulley / Hoist Box (Yellow/Black Industrial Pulley)
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(swingX - 9, hookY - 12, 18, 12);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(swingX - 9, hookY - 12, 18, 12);

      // Shackle Ring
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(swingX, hookY, 4, 0, Math.PI * 2);
      ctx.stroke();

      // Metallic Curved J-Hook Path
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(swingX, hookY + 2);
      ctx.lineTo(swingX, hookY + 12);
      ctx.arc(swingX - 5, hookY + 12, 5, 0, Math.PI, false);
      ctx.stroke();

      // Hook Tip Specular Highlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(swingX - 5, hookY + 17, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // 5. Draw Hanging / Falling House Block
      if (state.currentBlock) {
        renderAnimalHouse(ctx, state.currentBlock, state.stackedBlocks.length, now, state.currentBlock.isFalling);
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [startNewGame, spawnNextBlock]);

  const isLight = document.documentElement.classList.contains('light-theme');

  return (
    <div className="glass-panel animate-fade-in" style={{ maxWidth: '460px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', padding: '20px', userSelect: 'none', touchAction: 'none' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '22px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 color="var(--color-primary)" size={24} />
            {t('tower_bloxx_name')}
            {headerActions}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
            {t('tower_bloxx_desc')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            className="btn btn-glass" 
            onClick={() => {
              playMobileSound(450, 0.05, 0.06);
              startNewGame();
            }} 
            style={{ padding: '6px 10px', fontSize: '13px' }}
          >
            <RefreshCcw size={14} /> {t('reset')}
          </button>
        </div>
      </div>

      {/* Stats Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.03)', padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--border-glass)', fontSize: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Zap size={16} color="var(--color-warning)" />
          <span style={{ color: 'var(--text-secondary)' }}>{t('score')}:</span>
          <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '16px' }}>{score}</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Building2 size={16} color="var(--color-primary)" />
          <span style={{ color: 'var(--text-secondary)' }}>{t('floors_stacked')}:</span>
          <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>{floors}/{TARGET_FLOORS}</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <Heart 
              key={idx} 
              size={16} 
              color={idx < lives ? '#ef4444' : 'var(--text-muted)'} 
              fill={idx < lives ? '#ef4444' : 'none'} 
            />
          ))}
        </div>
      </div>

      {/* Interactive 60FPS Physics Canvas Container */}
      <div ref={containerRef} style={{ position: 'relative', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '2px solid var(--border-glass)' }}>
        
        {/* Floating Combo Banner Overlay */}
        {comboText && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: comboText.color,
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '6px 16px',
            borderRadius: '20px',
            boxShadow: `0 0 20px ${comboText.color}`,
            zIndex: 20,
            textAlign: 'center',
            maxWidth: '90%',
            animation: 'bounce 0.3s ease'
          }}>
            {comboText.text}
          </div>
        )}

        {combo > 1 && (
          <div style={{
            position: 'absolute',
            top: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#f59e0b',
            fontWeight: 'bold',
            fontSize: '12px',
            background: 'rgba(0,0,0,0.6)',
            padding: '3px 10px',
            borderRadius: '12px',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Sparkles size={12} /> {combo}x COMBO MULTIPLIER
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onClick={() => {
            if (!dropSoundPlayedRef.current) {
              playMobileSound(350, 0.06);
            } else {
              dropSoundPlayedRef.current = false;
            }
            handleDropBlock();
          }}
          onTouchStart={() => {
            playMobileSound(350, 0.06);
            dropSoundPlayedRef.current = true;
          }}
          style={{ width: '100%', height: 'auto', display: 'block', cursor: 'pointer' }}
        />
      </div>

      {/* Main Action Buttons Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', width: '100%' }}>
        <button 
          className="btn btn-primary" 
          style={{ padding: '14px', fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          onClick={() => {
            if (!dropSoundPlayedRef.current) {
              playMobileSound(350, 0.06);
            } else {
              dropSoundPlayedRef.current = false;
            }
            handleDropBlock();
          }}
          onTouchStart={() => {
            playMobileSound(350, 0.06);
            dropSoundPlayedRef.current = true;
          }}
          disabled={isGameOver}
        >
          <Building2 size={18} />
          DROP ANIMAL HOUSE (SPACEBAR)
        </button>

        <button 
          className="btn btn-glass" 
          style={{
            padding: '12px 8px',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            borderColor: 'var(--color-secondary)',
            background: 'rgba(56, 189, 248, 0.12)'
          }}
          onClick={handleWindGustAttack}
          disabled={isGameOver}
          title="Unleash a Wind Gust on opponent structure! Costs 750 Coins & 150 Gems"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#38bdf8', fontSize: '13px' }}>
            <Wind size={16} /> WIND GUST
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>750🪙 | 150💎</span>
        </button>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(8, 5, 18, 0.93)',
          borderRadius: '16px',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          zIndex: 40,
          padding: '24px',
          textAlign: 'center',
          animation: 'fadeIn 0.3s ease-in-out'
        }}>
          <div style={{ padding: '20px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)' }}>
            <Award size={48} color="var(--color-danger)" />
          </div>
          <h3 style={{ fontSize: '24px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            {t('tower_collapsed')}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '300px' }}>
            {t('tower_collapsed_desc')}
          </p>
          <div style={{ display: 'flex', gap: '20px', margin: '8px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{t('score')}</p>
              <h4 style={{ fontSize: '22px', fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>{score}</h4>
            </div>
            <div style={{ width: '1px', background: 'var(--border-glass)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{t('floors_stacked')}</p>
              <h4 style={{ fontSize: '22px', fontFamily: 'var(--font-display)', color: 'var(--color-warning)' }}>{floors}</h4>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '280px' }}>
            <button 
              className="btn btn-primary" 
              style={{ flex: 1 }} 
              onClick={() => {
                playMobileSound(450, 0.05, 0.06);
                startNewGame();
              }}
            >
              {t('play_again')}
            </button>
            <button 
              className="btn btn-glass" 
              style={{ flex: 1 }} 
              onClick={() => {
                playMobileSound(450, 0.05, 0.06);
                if (onClose) {
                  onClose();
                } else {
                  startNewGame();
                }
              }}
            >
              {t('forfeit')}
            </button>
          </div>
        </div>
      )}
      {!_room && onClose && !isGameOver && (
        <button 
          className="btn btn-glass" 
          style={{ width: '100%', marginTop: '16px' }} 
          onClick={() => onClose(true)}
        >
          Close Board
        </button>
      )}
    </div>
  );
};

export default TowerBloxx;
