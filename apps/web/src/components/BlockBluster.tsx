import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PuzzleType } from '@puzzle-verse/shared';
import { RefreshCcw, Award, Zap, Grid } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { translate } from '../utils/translations';

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

interface BlockBlusterProps {
  onGameWin: (puzzleType: PuzzleType, timeInSec: number, score: number) => void;
  onClose?: (isQuit?: boolean) => void;
  onProgress?: (progress: number) => void;
  room?: any;
  headerActions?: React.ReactNode;
  onPlaySound?: (type: 'click' | 'success' | 'fail' | 'correct' | 'bluster' | 'block_place') => void;
}

// Shape definitions: 2D matrix layout & color theme
interface ShapeDef {
  id: string;
  matrix: number[][];
  color: string;
  glow: string;
}

const SHAPES: ShapeDef[] = [
  { id: '1x1', matrix: [[1]], color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.6)' },
  { id: '2x1', matrix: [[1, 1]], color: '#a855f7', glow: 'rgba(168, 85, 247, 0.6)' },
  { id: '1x2', matrix: [[1], [1]], color: '#a855f7', glow: 'rgba(168, 85, 247, 0.6)' },
  { id: '3x1', matrix: [[1, 1, 1]], color: '#ec4899', glow: 'rgba(236, 72, 153, 0.6)' },
  { id: '1x3', matrix: [[1], [1], [1]], color: '#ec4899', glow: 'rgba(236, 72, 153, 0.6)' },
  { id: '4x1', matrix: [[1, 1, 1, 1]], color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.6)' },
  { id: '1x4', matrix: [[1], [1], [1], [1]], color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.6)' },
  { id: '2x2', matrix: [[1, 1], [1, 1]], color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.6)' },
  { id: '3x3', matrix: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], color: '#ef4444', glow: 'rgba(239, 68, 68, 0.6)' },
  { id: 'L1', matrix: [[1, 0], [1, 0], [1, 1]], color: '#10b981', glow: 'rgba(16, 185, 129, 0.6)' },
  { id: 'L2', matrix: [[0, 1], [0, 1], [1, 1]], color: '#10b981', glow: 'rgba(16, 185, 129, 0.6)' },
  { id: 'T1', matrix: [[1, 1, 1], [0, 1, 0]], color: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.6)' },
  { id: 'CORNER', matrix: [[1, 1], [1, 0]], color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.6)' },
];

const GRID_SIZE = 8;

export const BlockBluster: React.FC<BlockBlusterProps> = ({ onGameWin, onClose, onProgress, room: _room, headerActions, onPlaySound }) => {
  const { language } = useGame();
  const t = (key: string) => translate(key, language);

  const gridRef = useRef<HTMLDivElement>(null);

  const [grid, setGrid] = useState<(string | null)[]>(Array(GRID_SIZE * GRID_SIZE).fill(null));
  const [tray, setTray] = useState<(ShapeDef | null)[]>([]);
  const [selectedTrayIdx, setSelectedTrayIdx] = useState<number | null>(null);
  const [hoverCell, setHoverCell] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [linesCleared, setLinesCleared] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const [comboText, setComboText] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [blastingCells, setBlastingCells] = useState<number[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const blockSoundPlayedRef = useRef<boolean>(false);

  // Drag and drop state
  const [draggingTrayIdx, setDraggingTrayIdx] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number; isTouch?: boolean } | null>(null);

  // Generate 3 random shapes for tray
  const generateTray = useCallback(() => {
    const newTray: ShapeDef[] = [];
    for (let i = 0; i < 3; i++) {
      const rand = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      newTray.push(rand);
    }
    return newTray;
  }, []);

  // Initialize board and timer
  const startNewGame = useCallback(() => {
    setGrid(Array(GRID_SIZE * GRID_SIZE).fill(null));
    setTray(generateTray());
    setSelectedTrayIdx(null);
    setDraggingTrayIdx(null);
    setDragPos(null);
    setHoverCell(null);
    setScore(0);
    setLinesCleared(0);
    setTimer(0);
    setIsGameOver(false);
    setComboText(null);
    setBlastingCells([]);
  }, [generateTray]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  // Timer tick
  useEffect(() => {
    if (isGameOver) return;
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isGameOver]);

  // Check if shape can fit at (r, c) on current grid
  const canFit = (board: (string | null)[], shape: ShapeDef, r: number, c: number): boolean => {
    const sRows = shape.matrix.length;
    const sCols = shape.matrix[0].length;

    if (r + sRows > GRID_SIZE || c + sCols > GRID_SIZE) return false;

    for (let i = 0; i < sRows; i++) {
      for (let j = 0; j < sCols; j++) {
        if (shape.matrix[i][j] === 1) {
          const boardIdx = (r + i) * GRID_SIZE + (c + j);
          if (board[boardIdx] !== null) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const clearCompletedLines = (board: (string | null)[]): (string | null)[] => {
    const nextBoard = [...board];
    const fullRows: number[] = [];
    const fullCols: number[] = [];

    for (let row = 0; row < GRID_SIZE; row++) {
      let isFull = true;
      for (let col = 0; col < GRID_SIZE; col++) {
        if (nextBoard[row * GRID_SIZE + col] === null) {
          isFull = false;
          break;
        }
      }
      if (isFull) fullRows.push(row);
    }

    for (let col = 0; col < GRID_SIZE; col++) {
      let isFull = true;
      for (let row = 0; row < GRID_SIZE; row++) {
        if (nextBoard[row * GRID_SIZE + col] === null) {
          isFull = false;
          break;
        }
      }
      if (isFull) fullCols.push(col);
    }

    fullRows.forEach(row => {
      for (let col = 0; col < GRID_SIZE; col++) {
        nextBoard[row * GRID_SIZE + col] = null;
      }
    });
    fullCols.forEach(col => {
      for (let row = 0; row < GRID_SIZE; row++) {
        nextBoard[row * GRID_SIZE + col] = null;
      }
    });

    return nextBoard;
  };

  const hasValidSequence = (board: (string | null)[], shapes: ShapeDef[]): boolean => {
    if (shapes.length === 0) return true;

    for (let i = 0; i < shapes.length; i++) {
      const shape = shapes[i];
      const remaining = shapes.filter((_, idx) => idx !== i);

      for (let r = 0; r <= GRID_SIZE - shape.matrix.length; r++) {
        for (let c = 0; c <= GRID_SIZE - shape.matrix[0].length; c++) {
          if (canFit(board, shape, r, c)) {
            const nextBoard = [...board];
            const sRows = shape.matrix.length;
            const sCols = shape.matrix[0].length;
            for (let sr = 0; sr < sRows; sr++) {
              for (let sc = 0; sc < sCols; sc++) {
                if (shape.matrix[sr][sc] === 1) {
                  nextBoard[(r + sr) * GRID_SIZE + (c + sc)] = shape.color;
                }
              }
            }

            const clearedBoard = clearCompletedLines(nextBoard);
            if (hasValidSequence(clearedBoard, remaining)) {
              return true;
            }
          }
        }
      }
    }

    return false;
  };

  // Check if any shape in tray fits anywhere on the board
  const checkHasMoves = (board: (string | null)[], currentTray: (ShapeDef | null)[]): boolean => {
    const activeShapes = currentTray.filter((s): s is ShapeDef => s !== null);
    return hasValidSequence(board, activeShapes);
  };

  // Execute shape placement logic onto target cell index
  const placeShapeAtCell = (trayIdx: number, targetCellIdx: number): boolean => {
    if (isGameOver) return false;
    const shape = tray[trayIdx];
    if (!shape) return false;

    const r = Math.floor(targetCellIdx / GRID_SIZE);
    const c = targetCellIdx % GRID_SIZE;

    if (!canFit(grid, shape, r, c)) return false;

    // Place shape
    const newGrid = [...grid];
    const sRows = shape.matrix.length;
    const sCols = shape.matrix[0].length;
    let placedCount = 0;

    for (let i = 0; i < sRows; i++) {
      for (let j = 0; j < sCols; j++) {
        if (shape.matrix[i][j] === 1) {
          const boardIdx = (r + i) * GRID_SIZE + (c + j);
          newGrid[boardIdx] = shape.color;
          placedCount++;
        }
      }
    }

    // Check completed rows & columns
    const fullRows: number[] = [];
    const fullCols: number[] = [];

    for (let row = 0; row < GRID_SIZE; row++) {
      let isFull = true;
      for (let col = 0; col < GRID_SIZE; col++) {
        if (newGrid[row * GRID_SIZE + col] === null) {
          isFull = false;
          break;
        }
      }
      if (isFull) fullRows.push(row);
    }

    for (let col = 0; col < GRID_SIZE; col++) {
      let isFull = true;
      for (let row = 0; row < GRID_SIZE; row++) {
        if (newGrid[row * GRID_SIZE + col] === null) {
          isFull = false;
          break;
        }
      }
      if (isFull) fullCols.push(col);
    }

    const totalLines = fullRows.length + fullCols.length;
    const blastIdxs = new Set<number>();

    fullRows.forEach(row => {
      for (let col = 0; col < GRID_SIZE; col++) {
        blastIdxs.add(row * GRID_SIZE + col);
      }
    });
    fullCols.forEach(col => {
      for (let row = 0; row < GRID_SIZE; row++) {
        blastIdxs.add(row * GRID_SIZE + col);
      }
    });

    // Calculate score (only increase when lines are blasted/cleared)
    let pts = 0;
    if (totalLines > 0) {
      pts += totalLines * 100;
      if (totalLines === 2) pts += 100; // Double Blast bonus (300 points total)
      else if (totalLines >= 3) pts += 300; // Triple Blast bonus (600 points total)
    }

    const nextScore = score + pts;
    const nextLines = linesCleared + totalLines;

    setScore(nextScore);
    setLinesCleared(nextLines);

    if (onProgress) {
      onProgress(Math.min(100, Math.floor((nextLines / 10) * 100)));
    }

    if (nextLines >= 10) {
      if (onPlaySound) onPlaySound('success');
      if (onGameWin) {
        onGameWin(PuzzleType.BLOCK_BLUSTER, timer, nextScore);
      }
    } else {
      if (totalLines > 0) {
        if (onPlaySound) onPlaySound('bluster');
      } else {
        if (onPlaySound) onPlaySound('block_place');
      }
    }

    // Combo banner
    if (totalLines === 2) {
      setComboText(t('double_blast'));
      setTimeout(() => setComboText(null), 1500);
    } else if (totalLines >= 3) {
      setComboText(t('triple_blast'));
      setTimeout(() => setComboText(null), 1500);
    } else if (totalLines === 1) {
      setComboText(t('combo_blast'));
      setTimeout(() => setComboText(null), 1000);
    }

    // Trigger cell blast animation
    if (blastIdxs.size > 0) {
      setBlastingCells(Array.from(blastIdxs));
      setTimeout(() => {
        const clearedGrid = [...newGrid];
        blastIdxs.forEach(idx => {
          clearedGrid[idx] = null;
        });
        setGrid(clearedGrid);
        setBlastingCells([]);

        // Update tray & test game over
        updateTrayAndCheckMoves(clearedGrid, trayIdx);
      }, 300);
    } else {
      setGrid(newGrid);
      updateTrayAndCheckMoves(newGrid, trayIdx);
    }

    return true;
  };

  const updateTrayAndCheckMoves = (currentBoard: (string | null)[], usedTrayIdx: number) => {
    const nextTray = [...tray];
    nextTray[usedTrayIdx] = null;
    setSelectedTrayIdx(null);
    setDraggingTrayIdx(null);

    // Refill tray if empty
    if (nextTray.every(s => s === null)) {
      const freshTray = generateTray();
      setTray(freshTray);
      if (!checkHasMoves(currentBoard, freshTray)) {
        handleGameOver();
      }
    } else {
      setTray(nextTray);
      if (!checkHasMoves(currentBoard, nextTray)) {
        handleGameOver();
      }
    }
  };

  const handleGameOver = () => {
    setIsGameOver(true);
    if (onPlaySound) onPlaySound('fail');
  };

  // Handle pointer down on tray item to start drag
  const handleTrayPointerDown = (e: React.PointerEvent, trayIdx: number) => {
    if (isGameOver || !tray[trayIdx]) return;
    e.preventDefault();
    setDraggingTrayIdx(trayIdx);
    setSelectedTrayIdx(trayIdx);
    const rect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    setDragPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      isTouch: e.pointerType === 'touch'
    });
  };

  // Global pointer move & up listeners for drag and release
  useEffect(() => {
    if (draggingTrayIdx === null) return;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const isTouch = e.pointerType === 'touch';

      // GPU Accelerated DOM position updates via requestAnimationFrame bypassing React re-renders
      requestAnimationFrame(() => {
        if (ghostRef.current) {
          const offset = isTouch ? 0 : 40;
          ghostRef.current.style.transform = `translate3d(${x}px, ${y - offset}px, 0) translate(-50%, -50%) scale(1.15)`;
        }
      });

      // Check hover over grid
      if (gridRef.current) {
        const rectGrid = gridRef.current.getBoundingClientRect();
        if (
          e.clientX >= rectGrid.left &&
          e.clientX <= rectGrid.right &&
          e.clientY >= rectGrid.top &&
          e.clientY <= rectGrid.bottom
        ) {
          const col = Math.floor(((e.clientX - rectGrid.left) / rectGrid.width) * GRID_SIZE);
          const row = Math.floor(((e.clientY - rectGrid.top) / rectGrid.height) * GRID_SIZE);
          const cellIdx = Math.min(63, Math.max(0, row * GRID_SIZE + col));
          setHoverCell(cellIdx);
        } else {
          setHoverCell(null);
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Stop browser default scrolling behaviors during active drag
      e.preventDefault();
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (gridRef.current) {
        const rectGrid = gridRef.current.getBoundingClientRect();
        if (
          e.clientX >= rectGrid.left &&
          e.clientX <= rectGrid.right &&
          e.clientY >= rectGrid.top &&
          e.clientY <= rectGrid.bottom
        ) {
          const col = Math.floor(((e.clientX - rectGrid.left) / rectGrid.width) * GRID_SIZE);
          const row = Math.floor(((e.clientY - rectGrid.top) / rectGrid.height) * GRID_SIZE);
          const cellIdx = Math.min(63, Math.max(0, row * GRID_SIZE + col));
          placeShapeAtCell(draggingTrayIdx, cellIdx);
        }
      }

      setDraggingTrayIdx(null);
      setDragPos(null);
      setHoverCell(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [draggingTrayIdx, grid, tray, score, linesCleared, isGameOver]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Placement preview cells calculation
  const activeTrayIdx = draggingTrayIdx !== null ? draggingTrayIdx : selectedTrayIdx;
  const getPreviewCells = (): { valid: boolean; cells: Set<number> } | null => {
    if (hoverCell === null || activeTrayIdx === null) return null;
    const shape = tray[activeTrayIdx];
    if (!shape) return null;

    const r = Math.floor(hoverCell / GRID_SIZE);
    const c = hoverCell % GRID_SIZE;
    const valid = canFit(grid, shape, r, c);

    const previewSet = new Set<number>();
    const sRows = shape.matrix.length;
    const sCols = shape.matrix[0].length;

    for (let i = 0; i < sRows; i++) {
      for (let j = 0; j < sCols; j++) {
        if (shape.matrix[i][j] === 1) {
          const targetR = r + i;
          const targetC = c + j;
          if (targetR < GRID_SIZE && targetC < GRID_SIZE) {
            previewSet.add(targetR * GRID_SIZE + targetC);
          }
        }
      }
    }

    return { valid, cells: previewSet };
  };

  const preview = getPreviewCells();
  const isLight = document.documentElement.classList.contains('light-theme');
  const draggedShape = activeTrayIdx !== null ? tray[activeTrayIdx] : null;

  return (
    <div ref={containerRef} className="glass-panel animate-fade-in" style={{ maxWidth: '540px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', padding: '20px', userSelect: 'none', touchAction: 'none' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '22px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Grid color="var(--color-primary)" size={24} />
            {t('block_bluster_name')}
            {headerActions}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
            {t('block_bluster_desc')}
          </p>
        </div>
        <button className="btn btn-glass" onClick={startNewGame} style={{ padding: '6px 10px', fontSize: '13px' }}>
          <RefreshCcw size={14} /> {t('reset')}
        </button>
      </div>

      {/* Stats Counter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.03)', padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--border-glass)', fontSize: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Zap size={16} color="var(--color-warning)" />
          <span style={{ color: 'var(--text-secondary)' }}>{t('score')}:</span>
          <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '16px' }}>{score}</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Grid size={16} color="var(--color-primary)" />
          <span style={{ color: 'var(--text-secondary)' }}>{t('lines_cleared')}:</span>
          <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{linesCleared}</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>{t('time')}:</span>
          <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--color-secondary)' }}>{formatTime(timer)}</strong>
        </div>
      </div>

      {/* Floating Combo Toast */}
      {comboText && (
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%) scale(1.1)',
          background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
          color: '#ffffff',
          fontWeight: 'bold',
          fontSize: '18px',
          padding: '8px 20px',
          borderRadius: '20px',
          boxShadow: '0 0 20px rgba(245, 158, 11, 0.8)',
          zIndex: 30,
          animation: 'bounce 0.4s ease'
        }}>
          {comboText}
        </div>
      )}

      {/* 8x8 Main Grid */}
      <div 
        ref={gridRef}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gap: '4px',
          width: '100%',
          aspectRatio: '1',
          background: isLight ? '#cbd5e1' : 'rgba(10, 6, 26, 0.7)',
          border: '2px solid var(--border-glass)',
          borderRadius: '16px',
          padding: '10px',
          position: 'relative'
        }}
      >
        {grid.map((cellColor, idx) => {
          const isBlasting = blastingCells.includes(idx);
          const isHovered = preview?.cells.has(idx);
          const isValidPreview = isHovered && preview?.valid;
          const isInvalidPreview = isHovered && !preview?.valid;

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoverCell(idx)}
              onTouchStart={() => setHoverCell(idx)}
              onClick={() => {
                if (activeTrayIdx !== null) {
                  placeShapeAtCell(activeTrayIdx, idx);
                }
              }}
              style={{
                borderRadius: '6px',
                aspectRatio: '1',
                cursor: activeTrayIdx !== null ? 'pointer' : 'default',
                transition: 'all 0.12s ease',
                position: 'relative',

                // Styling logic
                background: cellColor
                  ? cellColor
                  : isValidPreview
                  ? 'rgba(16, 185, 129, 0.55)'
                  : isInvalidPreview
                  ? 'rgba(239, 68, 68, 0.45)'
                  : isLight
                  ? '#ffffff'
                  : 'rgba(255, 255, 255, 0.04)',

                border: isValidPreview
                  ? '2px solid #10b981'
                  : isInvalidPreview
                  ? '2px solid #ef4444'
                  : cellColor
                  ? '1px solid rgba(255,255,255,0.25)'
                  : isLight
                  ? '1px solid rgba(0,0,0,0.05)'
                  : '1px solid rgba(255,255,255,0.06)',

                boxShadow: isBlasting
                  ? '0 0 25px #38bdf8, inset 0 0 15px #ffffff'
                  : cellColor
                  ? 'inset 0 0 8px rgba(255,255,255,0.3), 0 2px 6px rgba(0,0,0,0.2)'
                  : 'none',

                transform: isBlasting ? 'scale(1.15)' : 'scale(1)',
                opacity: isBlasting ? 0.3 : 1
              }}
            />
          );
        })}
      </div>

      {/* Shapes Tray (Drag & Release or Select) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
          Drag shape & release onto the grid (or click to select & place):
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', width: '100%', minHeight: '90px' }}>
          {tray.map((shape, trayIdx) => {
            const isSelected = activeTrayIdx === trayIdx;
            const isBeingDragged = draggingTrayIdx === trayIdx;

            if (!shape) {
              return (
                <div key={trayIdx} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--border-glass)' }} />
              );
            }

            return (
              <div
                key={trayIdx}
                onPointerDown={(e) => { if (onPlaySound) onPlaySound('click'); handleTrayPointerDown(e, trayIdx); }}
                onClick={() => {
                  if (onPlaySound) onPlaySound('click');
                  setSelectedTrayIdx(isSelected ? null : trayIdx);
                }}
                onTouchStart={() => {
                  playMobileSound(450, 0.06);
                  blockSoundPlayedRef.current = true;
                }}
                onMouseDown={() => {
                  if (!blockSoundPlayedRef.current) {
                    playMobileSound(450, 0.06);
                  } else {
                    blockSoundPlayedRef.current = false;
                  }
                }}
                style={{
                  background: isSelected ? 'rgba(139, 92, 246, 0.2)' : isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)',
                  border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-glass)',
                  borderRadius: '12px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'grab',
                  opacity: isBeingDragged ? 0.3 : 1,
                  boxShadow: isSelected ? 'var(--glow-primary)' : 'none',
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                  touchAction: 'none'
                }}
              >
                {/* Render Shape Matrix Preview */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${shape.matrix[0].length}, 1fr)`,
                  gap: '3px',
                  pointerEvents: 'none'
                }}>
                  {shape.matrix.map((row, rIdx) =>
                    row.map((val, cIdx) => (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '3px',
                          background: val === 1 ? shape.color : 'transparent',
                          boxShadow: val === 1 ? `0 0 6px ${shape.glow}` : 'none',
                          opacity: val === 1 ? 1 : 0
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Ghost Overlay Following Mouse/Finger During Drag */}
      {draggingTrayIdx !== null && dragPos && draggedShape && (
        <div
          ref={ghostRef}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            transform: `translate3d(${dragPos.x}px, ${dragPos.isTouch ? dragPos.y : dragPos.y - 40}px, 0) translate(-50%, -50%) scale(1.15)`,
            willChange: 'transform',
            touchAction: 'none',
            pointerEvents: 'none',
            zIndex: 9999,
            display: 'grid',
            gridTemplateColumns: `repeat(${draggedShape.matrix[0].length}, 1fr)`,
            gap: '4px',
            filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))'
          }}
        >
          {draggedShape.matrix.map((row, rIdx) =>
            row.map((val, cIdx) => (
              <div
                key={`${rIdx}-${cIdx}`}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: val === 1 ? draggedShape.color : 'transparent',
                  border: val === 1 ? '1px solid rgba(255,255,255,0.4)' : 'none',
                  boxShadow: val === 1 ? `0 0 12px ${draggedShape.glow}` : 'none',
                  opacity: val === 1 ? 0.95 : 0
                }}
              />
            ))
          )}
        </div>
      )}



      {/* Game Over / Win Overlay */}
      {isGameOver && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(8, 5, 18, 0.92)',
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
          <div style={{ padding: '20px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)' }}>
            <Award size={48} color="var(--color-warning)" />
          </div>
          <h3 style={{ fontSize: '24px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            {t('no_more_moves')}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '300px' }}>
            {t('no_more_moves_desc')}
          </p>
          <div style={{ display: 'flex', gap: '20px', margin: '8px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{t('score')}</p>
              <h4 style={{ fontSize: '22px', fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>{score}</h4>
            </div>
            <div style={{ width: '1px', background: 'var(--border-glass)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{t('lines_cleared')}</p>
              <h4 style={{ fontSize: '22px', fontFamily: 'var(--font-display)', color: 'var(--color-warning)' }}>{linesCleared}</h4>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            Earned: +50 Coins | +10 XP
          </p>
          <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '280px' }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { if (onPlaySound) onPlaySound('click'); startNewGame(); }}>
              {t('play_again')}
            </button>
            <button 
              className="btn btn-glass" 
              style={{ flex: 1 }} 
              onClick={() => {
                if (onPlaySound) onPlaySound('click');
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

export default BlockBluster;
