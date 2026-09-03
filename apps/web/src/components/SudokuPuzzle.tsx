import React, { useState, useEffect, useCallback } from 'react';
import { PuzzleType } from '@puzzle-verse/shared';
import { Edit3, Trash2 } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { translate } from '../utils/translations';

let globalAudioContext: AudioContext | null = null;
const getAudioContext = () => {
  if (!globalAudioContext) {
    globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return globalAudioContext;
};

const playInstantCellSound = (isMuted?: boolean) => {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 1046;
  gain.gain.setValueAtTime(0.06, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.15);
};

interface SudokuPuzzleProps {
  isMuted?: boolean;
  onGameWin: (puzzleType: PuzzleType, timeInSec: number, score: number) => void;
  onClose?: (isQuit?: boolean) => void;
  onProgress?: (progress: number) => void;
  room?: any;
  headerActions?: React.ReactNode;
  onPlaySound?: (type: 'click' | 'success' | 'fail' | 'sudoku') => void;
}

const BASE_GRID = [
  [1, 2, 3, 4, 5, 6, 7, 8, 9],
  [4, 5, 6, 7, 8, 9, 1, 2, 3],
  [7, 8, 9, 1, 2, 3, 4, 5, 6],
  [2, 3, 4, 5, 6, 7, 8, 9, 1],
  [5, 6, 7, 8, 9, 1, 2, 3, 4],
  [8, 9, 1, 2, 3, 4, 5, 6, 7],
  [3, 4, 5, 6, 7, 8, 9, 1, 2],
  [6, 7, 8, 9, 1, 2, 3, 4, 5],
  [9, 1, 2, 3, 4, 5, 6, 7, 8]
];

const checkCellConflict = (board: number[], index: number, val: number): boolean => {
  if (!val) return false;
  const row = Math.floor(index / 9);
  const col = index % 9;
  
  // Row check
  for (let c = 0; c < 9; c++) {
    const idx = row * 9 + c;
    if (idx !== index && board[idx] === val) return true;
  }
  
  // Col check
  for (let r = 0; r < 9; r++) {
    const idx = r * 9 + col;
    if (idx !== index && board[idx] === val) return true;
  }
  
  // 3x3 Box check
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      const idx = r * 9 + c;
      if (idx !== index && board[idx] === val) return true;
    }
  }
  return false;
};

export const SudokuPuzzle: React.FC<SudokuPuzzleProps> = ({ onGameWin, onClose, onProgress, room: _room, headerActions, onPlaySound }) => {
  const { language } = useGame();
  const t = (key: string) => translate(key, language);
  const [board, setBoard] = useState<number[]>([]); // 1D array of 81 cells (0 for empty)
  const [initialCells, setInitialCells] = useState<boolean[]>([]); // true if cell is initial clue
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [notes, setNotes] = useState<{ [key: number]: number[] }>({}); // index -> list of noted numbers
  const [isNoteMode, setIsNoteMode] = useState<boolean>(false);
  const [errors, setErrors] = useState<boolean[]>(Array(81).fill(false));
  const [timer, setTimer] = useState<number>(0);

  // Generate Sudoku board on mount
  useEffect(() => {
    // Permute base grid numbers to create a unique board
    const mapping = Array.from({ length: 9 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    const solved = Array(81).fill(0);
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        solved[r * 9 + c] = mapping[BASE_GRID[r][c] - 1];
      }
    }

    // Mask cell clues based on difficulty (remove ~40 cells)
    const initial = Array(81).fill(true);
    const current = [...solved];
    const maskCount = 42; // Medium difficulty mask
    let masked = 0;
    while (masked < maskCount) {
      const idx = Math.floor(Math.random() * 81);
      if (current[idx] !== 0) {
        current[idx] = 0;
        initial[idx] = false;
        masked++;
      }
    }

    setBoard(current);
    setInitialCells(initial);
  }, []);

  // Timer increment loop
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const calculateProgress = useCallback((currentBoard: number[]) => {
    let filledCorrect = 0;
    let totalNeeded = 0;
    for (let i = 0; i < 81; i++) {
      if (!initialCells[i]) {
        totalNeeded++;
        if (currentBoard[i] !== 0 && !checkCellConflict(currentBoard, i, currentBoard[i])) {
          filledCorrect++;
        }
      }
    }
    const percent = Math.floor((filledCorrect / totalNeeded) * 100);
    if (onProgress) onProgress(percent);
  }, [initialCells, onProgress]);

  const handleCellSelect = (index: number) => {
    setSelectedIndex(index);
    onPlaySound?.('click');
  };

  const handleInputNumber = useCallback((num: number) => {
    if (selectedIndex === null || initialCells[selectedIndex]) return;

    if (isNoteMode) {
      if (num === 0) return;
      onPlaySound?.('click');
      setNotes(prev => {
        const list = prev[selectedIndex] || [];
        const nextList = list.includes(num) ? list.filter(n => n !== num) : [...list, num].sort();
        return { ...prev, [selectedIndex]: nextList };
      });
    } else {
      setBoard(prev => {
        const next = [...prev];
        next[selectedIndex] = num;
        
        // Remove notes for this cell and check errors
        setNotes(n => {
          const nextNotes = { ...n };
          delete nextNotes[selectedIndex];
          return nextNotes;
        });

        // Dynamic error checking for the entire board
        const nextErrs = Array(81).fill(false);
        for (let i = 0; i < 81; i++) {
          if (!initialCells[i] && next[i] !== 0) {
            nextErrs[i] = checkCellConflict(next, i, next[i]);
          }
        }
        setErrors(nextErrs);

        // Check if board solved correctly (all cells filled and no errors/conflicts)
        const isSolved = next.every((val) => val !== 0) && next.every((val, idx) => !checkCellConflict(next, idx, val));
        if (isSolved) {
          const score = Math.max(50, 400 - Math.floor(timer / 2));
          onGameWin(PuzzleType.SUDOKU, timer, score);
          onPlaySound?.('success');
        } else {
          const isConflict = checkCellConflict(next, selectedIndex, num);
          if (isConflict) {
            onPlaySound?.('fail');
          } else {
            onPlaySound?.('sudoku');
          }
        }

        calculateProgress(next);
        return next;
      });
    }
  }, [selectedIndex, initialCells, isNoteMode, timer, onGameWin, calculateProgress, onPlaySound]);

  const handleClearCell = () => {
    if (selectedIndex === null || initialCells[selectedIndex]) return;
    onPlaySound?.('click');
    setBoard(prev => {
      const next = [...prev];
      next[selectedIndex] = 0;

      // Dynamic error checking for the entire board after clearing
      const nextErrs = Array(81).fill(false);
      for (let i = 0; i < 81; i++) {
        if (!initialCells[i] && next[i] !== 0) {
          nextErrs[i] = checkCellConflict(next, i, next[i]);
        }
      }
      setErrors(nextErrs);

      calculateProgress(next);
      return next;
    });
    setNotes(n => {
      const nextNotes = { ...n };
      delete nextNotes[selectedIndex];
      return nextNotes;
    });
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        if (selectedIndex !== null) {
          handleInputNumber(parseInt(e.key));
        }
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        if (selectedIndex !== null) {
          handleClearCell();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => {
          if (prev === null) return 0;
          return prev - 9 >= 0 ? prev - 9 : prev;
        });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => {
          if (prev === null) return 0;
          return prev + 9 < 81 ? prev + 9 : prev;
        });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedIndex(prev => {
          if (prev === null) return 0;
          return prev % 9 > 0 ? prev - 1 : prev;
        });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedIndex(prev => {
          if (prev === null) return 0;
          return prev % 9 < 8 ? prev + 1 : prev;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, handleInputNumber]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isLight = document.documentElement.classList.contains('light-theme');

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center' }}>
            {t('sudoku_name')}
            {headerActions}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('sudoku_desc')}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('time_elapsed').toUpperCase()}</p>
          <h4 style={{ fontSize: '18px', color: 'var(--color-primary)', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
            {formatTime(timer)}
          </h4>
        </div>
      </div>

      {/* 9x9 Sudoku Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(9, 1fr)', 
        gap: '2px', 
        background: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.08)', 
        padding: '4px', 
        borderRadius: '12px', 
        border: isLight ? '2px solid #94a3b8' : '2px solid rgba(255,255,255,0.12)',
        maxWidth: '380px',
        margin: '0 auto',
        aspectRatio: '1'
      }}>
        {board.map((cell, idx) => {
          const row = Math.floor(idx / 9);
          const col = idx % 9;
          const isInitial = initialCells[idx];
          const isSelected = selectedIndex === idx;
          const isError = errors[idx];
          
          // Heavy borders for 3x3 sectors
          const borderRight = (col === 2 || col === 5) ? (isLight ? '2px solid #475569' : '2px solid rgba(255,255,255,0.4)') : 'none';
          const borderBottom = (row === 2 || row === 5) ? (isLight ? '2px solid #475569' : '2px solid rgba(255,255,255,0.4)') : 'none';

          return (
            <div
              key={idx}
              onClick={() => handleCellSelect(idx)}
              onTouchStart={() => playInstantCellSound()}
              style={{
                background: isSelected 
                  ? 'rgba(139, 92, 246, 0.25)' 
                  : isInitial 
                    ? (isLight ? '#f1f5f9' : 'rgba(255,255,255,0.04)') 
                    : (isLight ? '#ffffff' : 'rgba(0,0,0,0.15)'),
                color: isError 
                  ? 'var(--color-danger)' 
                  : isInitial 
                    ? 'var(--text-muted)' 
                    : 'var(--color-primary)',
                fontSize: '18px',
                fontWeight: isInitial ? 'bold' : 'normal',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isInitial ? 'default' : 'pointer',
                borderRight,
                borderBottom,
                borderRadius: '4px',
                aspectRatio: '1',
                position: 'relative',
                userSelect: 'none'
              }}
            >
              {cell !== 0 ? (
                cell
              ) : (
                /* Note Marks */
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '1px',
                  position: 'absolute',
                  top: '2px',
                  left: '2px',
                  right: '2px',
                  bottom: '2px',
                  fontSize: '8px',
                  color: 'var(--text-muted)'
                }}>
                  {notes[idx]?.map(n => (
                    <span key={n} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{n}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Control Buttons */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center' }}>
        <button 
          className={`btn ${isNoteMode ? 'btn-primary' : 'btn-glass'}`} 
          style={{ padding: '10px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={() => setIsNoteMode(!isNoteMode)}
          onTouchStart={() => playInstantCellSound()}
        >
          <Edit3 size={16} />
          {isNoteMode ? t('notes_on') : t('pencil_notes')}
        </button>

        <button 
          className="btn btn-glass" 
          style={{ padding: '10px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={handleClearCell}
          onTouchStart={() => playInstantCellSound()}
          disabled={selectedIndex === null || initialCells[selectedIndex]}
        >
          <Trash2 size={16} />
          {t('clear')}
        </button>
      </div>

      {/* On-screen Directional Navigation Pad */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        margin: '0 auto',
        maxWidth: '180px',
        background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.02)',
        padding: '12px',
        borderRadius: '16px',
        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {t('navigate_board')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
          {/* Row 1: Up Arrow */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            <div></div>
            <button 
              className="btn btn-glass" 
              style={{ 
                padding: '8px 0', 
                fontSize: '16px', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              onClick={() => {
                setSelectedIndex(prev => {
                  if (prev === null) return 40;
                  return prev - 9 >= 0 ? prev - 9 : prev;
                });
              }}
              title="Move Up"
            >
              ^
            </button>
            <div></div>
          </div>

          {/* Row 2: Left, Down, Right Arrows */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            <button 
              className="btn btn-glass" 
              style={{ 
                padding: '8px 0', 
                fontSize: '16px', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              onClick={() => {
                setSelectedIndex(prev => {
                  if (prev === null) return 40;
                  return prev % 9 > 0 ? prev - 1 : prev;
                });
              }}
              title="Move Left"
            >
              &lt;
            </button>
            <button 
              className="btn btn-glass" 
              style={{ 
                padding: '8px 0', 
                fontSize: '16px', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              onClick={() => {
                setSelectedIndex(prev => {
                  if (prev === null) return 40;
                  return prev + 9 < 81 ? prev + 9 : prev;
                });
              }}
              title="Move Down"
            >
              v
            </button>
            <button 
              className="btn btn-glass" 
              style={{ 
                padding: '8px 0', 
                fontSize: '16px', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              onClick={() => {
                setSelectedIndex(prev => {
                  if (prev === null) return 40;
                  return prev % 9 < 8 ? prev + 1 : prev;
                });
              }}
              title="Move Right"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Virtual Keypad */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(9, 1fr)', 
        gap: '8px', 
        maxWidth: '380px', 
        margin: '0 auto', 
        width: '100%' 
      }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            className="btn btn-glass"
            style={{ padding: '12px 0', fontSize: '16px', borderRadius: '8px' }}
            onClick={() => handleInputNumber(num)}
            onTouchStart={() => playInstantCellSound()}
            disabled={selectedIndex === null || initialCells[selectedIndex]}
          >
            {num}
          </button>
        ))}
      </div>

      {(!_room && onClose) && (
        <button className="btn btn-glass" style={{ width: '100%', marginTop: '8px' }} onClick={() => onClose(true)}>
          {t('close_board')}
        </button>
      )}
    </div>
  );
};

export default SudokuPuzzle;
