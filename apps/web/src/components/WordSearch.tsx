import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PuzzleType } from '@puzzle-verse/shared';
import { RefreshCcw, Award, Check, Search, Zap, Clock } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { translate } from '../utils/translations';

interface WordSearchProps {
  onGameWin: (puzzleType: PuzzleType, timeInSec: number, score: number) => void;
  onClose?: (isQuit?: boolean) => void;
  onProgress?: (progress: number) => void;
  room?: any;
  headerActions?: React.ReactNode;
  onPlaySound?: (type: 'click' | 'success' | 'fail' | 'correct' | 'search') => void;
}

const GRID_SIZE = 10;

const WORD_POOL = [
  // Core & Gaming
  'PUZZLE', 'MATRIX', 'CYBER', 'VECTOR', 'PIXEL', 'LOGIC', 'PYTHON', 'QUEST', 'SIGNAL', 'ARENA',
  'CODE', 'BLAST', 'SCORE', 'GAMING', 'NINJA', 'SHADOW', 'ORBIT', 'APEX', 'TITAN', 'HELIX',

  // Sci-Fi & Space
  'VORTEX', 'QUANTUM', 'GALAXY', 'COSMOS', 'BEAM', 'SHIELD', 'CAVERN', 'TEMPLE', 'DRAGON', 'KNIGHT',
  'PHOENIX', 'CIPHER', 'NEXUS', 'PRISM', 'CRYSTAL', 'PHANTOM', 'RADAR', 'SONAR', 'CIRCUIT', 'BINARY',

  // Science & Tech
  'ENGINE', 'ROCKET', 'METEOR', 'ASTEROID', 'NEBULA', 'STELLAR', 'SPECTRUM', 'DYNAMO', 'ENERGY', 'PLASMA',
  'FUSION', 'SPARK', 'BLITZ', 'CLASH', 'LEGEND', 'HEROIC', 'SHARD', 'GLITCH', 'HARMONY', 'ECLIPSE',

  // Fantasy & Adventure
  'MIRAGE', 'TROPHY', 'EMPIRE', 'KINGDOM', 'MYSTIC', 'ARTIFACT', 'RELIC', 'ANCIENT', 'FUTURE', 'SYNAPSE',
  'NEURAL', 'TENSOR', 'SYSTEM', 'KERNEL', 'BUFFER', 'SOCKET', 'PROTOCOL', 'COMPASS', 'BEACON', 'GRAVITY'
];

interface PlacedWord {
  word: string;
  cells: number[];
  color: string;
}

const HIGHLIGHT_COLORS = [
  '#10b981', '#38bdf8', '#a855f7', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#ef4444'
];

export const WordSearch: React.FC<WordSearchProps> = ({ onGameWin, onClose, onProgress, room: _room, headerActions, onPlaySound }) => {
  const { language } = useGame();
  const t = (key: string) => translate(key, language);
  
  const prevSelectedLengthRef = useRef<number>(0);

  const gridRef = useRef<HTMLDivElement>(null);

  const [grid, setGrid] = useState<string[]>([]);
  const [targetWords, setTargetWords] = useState<PlacedWord[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [foundCellMap, setFoundCellMap] = useState<Record<number, string>>({});

  // Selection state
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [startIdx, setStartIdx] = useState<number | null>(null);
  const [currentIdx, setCurrentIdx] = useState<number | null>(null);

  const [score, setScore] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const [toastText, setToastText] = useState<string | null>(null);
  const [hasWon, setHasWon] = useState<boolean>(false);

  // Generate Word Search Board
  const generateBoard = useCallback(() => {
    const matrix: string[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(''));
    const shufflePool = [...WORD_POOL].sort(() => Math.random() - 0.5);
    const selectedWords = shufflePool.slice(0, 6); // Pick 6 words

    const directions = [
      { r: 0, c: 1 },   // Horizontal right
      { r: 1, c: 0 },   // Vertical down
      { r: 1, c: 1 },   // Diagonal down-right
      { r: -1, c: 1 }   // Diagonal up-right
    ];

    const placedList: PlacedWord[] = [];

    selectedWords.forEach((word, wordIdx) => {
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 100) {
        attempts++;
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const startR = Math.floor(Math.random() * GRID_SIZE);
        const startC = Math.floor(Math.random() * GRID_SIZE);

        const endR = startR + dir.r * (word.length - 1);
        const endC = startC + dir.c * (word.length - 1);

        if (endR >= 0 && endR < GRID_SIZE && endC >= 0 && endC < GRID_SIZE) {
          let canPlace = true;
          for (let i = 0; i < word.length; i++) {
            const r = startR + dir.r * i;
            const c = startC + dir.c * i;
            if (matrix[r][c] !== '' && matrix[r][c] !== word[i]) {
              canPlace = false;
              break;
            }
          }

          if (canPlace) {
            const cells: number[] = [];
            for (let i = 0; i < word.length; i++) {
              const r = startR + dir.r * i;
              const c = startC + dir.c * i;
              matrix[r][c] = word[i];
              cells.push(r * GRID_SIZE + c);
            }
            placedList.push({
              word,
              cells,
              color: HIGHLIGHT_COLORS[wordIdx % HIGHLIGHT_COLORS.length]
            });
            placed = true;
          }
        }
      }
    });

    // Fill empty cells with random uppercase letters
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const flatGrid: string[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (matrix[r][c] === '') {
          matrix[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
        }
        flatGrid.push(matrix[r][c]);
      }
    }

    setGrid(flatGrid);
    setTargetWords(placedList);
    setFoundWords([]);
    setFoundCellMap({});
    setStartIdx(null);
    setCurrentIdx(null);
    setIsSelecting(false);
    setScore(0);
    setTimer(0);
    setHasWon(false);
    setToastText(null);
  }, []);

  useEffect(() => {
    generateBoard();
  }, [generateBoard]);

  // Timer tick
  useEffect(() => {
    if (hasWon) return;
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [hasWon]);

  // Helper to get selected cell indices between start and current cell
  const getLineCells = (start: number | null, end: number | null): number[] => {
    if (start === null || end === null) return [];
    const r1 = Math.floor(start / GRID_SIZE);
    const c1 = start % GRID_SIZE;
    const r2 = Math.floor(end / GRID_SIZE);
    const c2 = end % GRID_SIZE;

    const dr = r2 - r1;
    const dc = c2 - c1;

    // Must be straight horizontal, vertical, or 45-degree diagonal
    if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) {
      return [start];
    }

    const stepR = dr === 0 ? 0 : dr > 0 ? 1 : -1;
    const stepC = dc === 0 ? 0 : dc > 0 ? 1 : -1;
    const steps = Math.max(Math.abs(dr), Math.abs(dc));

    const cells: number[] = [];
    for (let i = 0; i <= steps; i++) {
      const r = r1 + stepR * i;
      const c = c1 + stepC * i;
      cells.push(r * GRID_SIZE + c);
    }
    return cells;
  };

  const selectedCells = getLineCells(startIdx, currentIdx);

  // Handle selection release / verification
  const handleSelectionEnd = () => {
    if (!isSelecting || startIdx === null || currentIdx === null) {
      setIsSelecting(false);
      setStartIdx(null);
      setCurrentIdx(null);
      return;
    }

    const cells = getLineCells(startIdx, currentIdx);
    const formedString = cells.map(idx => grid[idx]).join('');
    const reverseString = formedString.split('').reverse().join('');

    const match = targetWords.find(
      pw => !foundWords.includes(pw.word) && (pw.word === formedString || pw.word === reverseString)
    );

    if (match) {
      const updatedFound = [...foundWords, match.word];
      const newCellMap = { ...foundCellMap };
      match.cells.forEach(idx => {
        newCellMap[idx] = match.color;
      });

      setFoundWords(updatedFound);
      setFoundCellMap(newCellMap);

      const bonus = 100 + Math.max(0, 100 - timer * 2);
      const nextScore = score + bonus;
      setScore(nextScore);

      setToastText(`${match.word} FOUND!`);
      setTimeout(() => setToastText(null), 1200);

      const progress = Math.floor((updatedFound.length / targetWords.length) * 100);
      if (onProgress) onProgress(progress);

      // Check win
      if (updatedFound.length === targetWords.length) {
        setHasWon(true);
        if (onPlaySound) onPlaySound('success');
        if (onGameWin) {
          onGameWin(PuzzleType.WORD_SEARCH, timer, nextScore);
        }
      } else {
        if (onPlaySound) onPlaySound('correct');
      }
    } else {
      if (cells.length > 1) {
        if (onPlaySound) onPlaySound('fail');
      }
    }

    setIsSelecting(false);
    setStartIdx(null);
    setCurrentIdx(null);
  };

  // Pointer events for drag selection
  const handlePointerDown = (cellIdx: number, e: React.PointerEvent) => {
    e.preventDefault();
    if (hasWon) return;
    if (onPlaySound) onPlaySound('click');
    setIsSelecting(true);
    setStartIdx(cellIdx);
    setCurrentIdx(cellIdx);
    prevSelectedLengthRef.current = 1;
  };

  useEffect(() => {
    if (!isSelecting) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (gridRef.current) {
        const rect = gridRef.current.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          const col = Math.floor(((e.clientX - rect.left) / rect.width) * GRID_SIZE);
          const row = Math.floor(((e.clientY - rect.top) / rect.height) * GRID_SIZE);
          const cellIdx = Math.min(99, Math.max(0, row * GRID_SIZE + col));
          setCurrentIdx(cellIdx);

          // Play tick/search sound on size change
          const cells = getLineCells(startIdx, cellIdx);
          if (cells.length !== prevSelectedLengthRef.current) {
            if (onPlaySound && cells.length > 0) {
              onPlaySound('search');
            }
            prevSelectedLengthRef.current = cells.length;
          }
        }
      }
    };

    const handlePointerUp = () => {
      handleSelectionEnd();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isSelecting, startIdx, currentIdx, grid, targetWords, foundWords, foundCellMap, score, timer, hasWon]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isLight = document.documentElement.classList.contains('light-theme');

  return (
    <div className="glass-panel animate-fade-in" style={{ maxWidth: '540px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', padding: '20px', userSelect: 'none', touchAction: 'none' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '22px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search color="var(--color-primary)" size={24} />
            {t('word_search_name')}
            {headerActions}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
            {t('word_search_desc')}
          </p>
        </div>
        <button className="btn btn-glass" onClick={generateBoard} style={{ padding: '6px 10px', fontSize: '13px' }}>
          <RefreshCcw size={14} /> {t('reset')}
        </button>
      </div>

      {/* Counter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.03)', padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--border-glass)', fontSize: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Zap size={16} color="var(--color-warning)" />
          <span style={{ color: 'var(--text-secondary)' }}>{t('score')}:</span>
          <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '16px' }}>{score}</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Check size={16} color="var(--color-success)" />
          <span style={{ color: 'var(--text-secondary)' }}>{t('words_found')}:</span>
          <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{foundWords.length} / {targetWords.length}</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={16} color="var(--color-secondary)" />
          <span style={{ color: 'var(--text-secondary)' }}>{t('time')}:</span>
          <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--color-secondary)' }}>{formatTime(timer)}</strong>
        </div>
      </div>

      {/* Floating Toast Banner */}
      {toastText && (
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%) scale(1.1)',
          background: 'linear-gradient(135deg, #10b981, #06b6d4)',
          color: '#ffffff',
          fontWeight: 'bold',
          fontSize: '18px',
          padding: '8px 20px',
          borderRadius: '20px',
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.8)',
          zIndex: 30,
          animation: 'bounce 0.4s ease'
        }}>
          {toastText}
        </div>
      )}

      {/* 10x10 Word Search Grid */}
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
        {grid.map((char, idx) => {
          const isSelected = selectedCells.includes(idx);
          const permanentColor = foundCellMap[idx];

          return (
            <div
              key={idx}
              onPointerDown={(e) => handlePointerDown(idx, e)}
              onMouseEnter={() => {
                if (isSelecting) setCurrentIdx(idx);
              }}
              style={{
                borderRadius: '6px',
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 'bold',
                fontFamily: 'var(--font-display)',
                cursor: 'pointer',
                transition: 'all 0.12s ease',

                // Background & Styling
                background: isSelected
                  ? 'rgba(56, 189, 248, 0.6)'
                  : permanentColor
                  ? permanentColor
                  : isLight
                  ? '#ffffff'
                  : 'rgba(255, 255, 255, 0.04)',

                color: isSelected || permanentColor
                  ? '#ffffff'
                  : 'var(--text-primary)',

                border: isSelected
                  ? '2px solid #38bdf8'
                  : permanentColor
                  ? '1px solid rgba(255,255,255,0.4)'
                  : isLight
                  ? '1px solid rgba(0,0,0,0.05)'
                  : '1px solid rgba(255,255,255,0.06)',

                boxShadow: isSelected
                  ? '0 0 12px #38bdf8'
                  : permanentColor
                  ? `0 0 8px ${permanentColor}`
                  : 'none',

                transform: isSelected ? 'scale(1.08)' : 'scale(1)'
              }}
            >
              {char}
            </div>
          );
        })}
      </div>

      {/* Word Bank Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {t('word_bank')} ({targetWords.length - foundWords.length} {t('words_remaining')})
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {targetWords.map(pw => {
            const isFound = foundWords.includes(pw.word);
            return (
              <div
                key={pw.word}
                style={{
                  background: isFound ? 'rgba(16, 185, 129, 0.15)' : isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)',
                  border: isFound ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-glass)',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  fontFamily: 'var(--font-display)',
                  color: isFound ? 'var(--color-success)' : 'var(--text-secondary)',
                  textDecoration: isFound ? 'line-through' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>{pw.word}</span>
                {isFound && <Check size={14} color="var(--color-success)" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Close Button */}
      {(!_room && onClose) && (
        <button className="btn btn-glass" style={{ width: '100%', marginTop: '4px' }} onClick={() => onClose(true)}>
          {t('close_board')}
        </button>
      )}

      {/* Game Win Overlay */}
      {hasWon && (
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
          <div style={{ padding: '20px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)', animation: 'float 3s ease-in-out infinite' }}>
            <Award size={48} color="var(--color-success)" />
          </div>
          <h3 style={{ fontSize: '24px', color: 'var(--color-success)', fontFamily: 'var(--font-display)' }}>
            {t('word_search_solved')}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '320px' }}>
            {t('word_search_solved_desc')}
          </p>
          <div style={{ display: 'flex', gap: '20px', margin: '8px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{t('score')}</p>
              <h4 style={{ fontSize: '22px', fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>{score}</h4>
            </div>
            <div style={{ width: '1px', background: 'var(--border-glass)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{t('time')}</p>
              <h4 style={{ fontSize: '22px', fontFamily: 'var(--font-display)', color: 'var(--color-secondary)' }}>{formatTime(timer)}</h4>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            Earned: +50 Coins | +10 XP
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                if (onPlaySound) onPlaySound('click');
                generateBoard();
              }}
            >
              {t('play_again')}
            </button>
            {onClose && (
              <button 
                className="btn btn-glass" 
                onClick={() => {
                  if (onPlaySound) onPlaySound('click');
                  onClose();
                }}
              >
                {t('close')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WordSearch;
