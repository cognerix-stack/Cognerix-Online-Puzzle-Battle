import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCcw, Award } from 'lucide-react';
import { PuzzleType } from '@puzzle-verse/shared';
import { useGame } from '../context/GameContext';
import { translate } from '../utils/translations';

let globalAudioContext: AudioContext | null = null;
const getAudioContext = () => {
  if (!globalAudioContext) {
    globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return globalAudioContext;
};

const playInstantKeySound = (isMuted?: boolean) => {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 400;
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.05);
};

interface WordPuzzleProps {
  isMuted?: boolean;
  onClose?: (isQuit?: boolean) => void;
  onProgress?: (progress: number) => void;
  onGameWin?: (puzzleType: PuzzleType, timeInSec: number, score: number) => void;
  room?: any;
  headerActions?: React.ReactNode;
  isBotMatch?: boolean;
  onPlaySound?: (type: 'click' | 'success' | 'fail' | 'correct') => void;
}

const WORDS = [
  'PIXEL', 'LOGIC', 'MATCH', 'BOARD', 'CYBER',
  'ROBOT', 'SHIFT', 'ENTER', 'TOKEN', 'GAMES',
  'INDEX', 'STACK', 'INPUT', 'MOUSE', 'LIGHT',
  'FOCUS', 'SMART', 'BRAIN', 'SOLVE', 'LEVEL'
];

type KeyStatus = 'correct' | 'present' | 'absent' | 'default';

export const WordPuzzle: React.FC<WordPuzzleProps> = ({ onClose, onProgress, onGameWin, room: _room, headerActions, isBotMatch: _isBotMatch, onPlaySound }) => {
  const { recordGameWin, language } = useGame();
  const t = (key: string) => translate(key, language);
  const [targetWord, setTargetWord] = useState<string>('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [gameStatus, setGameStatus] = useState<'PLAYING' | 'WON' | 'LOST'>('PLAYING');
  const [shakeRow, setShakeRow] = useState<number | null>(null);
  const [letterStatuses, setLetterStatuses] = useState<Record<string, KeyStatus>>({});

  const soundPlayedRef = useRef<boolean>(false);

  const startNewGame = useCallback(() => {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    setTargetWord(word);
    setGuesses([]);
    setCurrentGuess('');
    setGameStatus('PLAYING');
    setLetterStatuses({});
  }, []);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const handleKeyPress = useCallback((key: string) => {
    if (gameStatus !== 'PLAYING') return;

    if (key === 'ENTER') {
      if (currentGuess.length !== 5) {
        setShakeRow(guesses.length);
        setTimeout(() => setShakeRow(null), 500);
        onPlaySound?.('fail');
        return;
      }

      const updatedGuesses = [...guesses, currentGuess];
      setGuesses(updatedGuesses);

      // Update keyboard letter colors
      const newStatuses = { ...letterStatuses };
      for (let i = 0; i < currentGuess.length; i++) {
        const letter = currentGuess[i];
        if (targetWord[i] === letter) {
          newStatuses[letter] = 'correct';
        } else if (targetWord.includes(letter)) {
          if (newStatuses[letter] !== 'correct') {
            newStatuses[letter] = 'present';
          }
        } else {
          if (!newStatuses[letter]) {
            newStatuses[letter] = 'absent';
          }
        }
      }
      setLetterStatuses(newStatuses);

      if (currentGuess === targetWord) {
        setGameStatus('WON');
        const attempts = updatedGuesses.length;
        const score = Math.max(50, 350 - attempts * 50);
        if (onGameWin) {
          onGameWin(PuzzleType.WORD, attempts * 10, score);
        } else {
          recordGameWin(PuzzleType.WORD, attempts * 10, score);
        }
        if (onProgress) onProgress(100);
        onPlaySound?.('success');
      } else if (updatedGuesses.length >= 6) {
        setGameStatus('LOST');
        if (onProgress) onProgress(100);
        onPlaySound?.('fail');
      } else {
        if (onProgress) onProgress(Math.floor((updatedGuesses.length / 6) * 100));
        onPlaySound?.('correct');
      }

      setCurrentGuess('');
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
      if (!soundPlayedRef.current) {
        playInstantKeySound();
      } else {
        soundPlayedRef.current = false;
      }
    } else if (/^[A-Z]$/.test(key)) {
      if (currentGuess.length < 5) {
        setCurrentGuess(prev => prev + key);
        if (!soundPlayedRef.current) {
          playInstantKeySound();
        } else {
          soundPlayedRef.current = false;
        }
      }
    }
  }, [currentGuess, guesses, gameStatus, targetWord, letterStatuses, recordGameWin, onProgress, onGameWin, onPlaySound]);

  // Listen to physical keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key === 'ENTER') {
        handleKeyPress('ENTER');
      } else if (key === 'BACKSPACE') {
        handleKeyPress('BACKSPACE');
      } else if (/^[A-Z]$/.test(key)) {
        handleKeyPress(key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress]);

  const getCellColor = (char: string, index: number, isSubmitted: boolean) => {
    if (!isSubmitted) return isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.05)';
    if (targetWord[index] === char) return 'rgba(16, 185, 129, 0.2)'; // Correct place (green glow/bg)
    if (targetWord.includes(char)) return 'rgba(245, 158, 11, 0.2)'; // Wrong place (amber)
    return isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)'; // Absent
  };

  const getCellBorder = (char: string, index: number, isSubmitted: boolean) => {
    if (!isSubmitted) return char ? 'rgba(139, 92, 246, 0.5)' : (isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.1)');
    if (targetWord[index] === char) return 'var(--color-success)';
    if (targetWord.includes(char)) return 'var(--color-warning)';
    return isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
  };

  const getCellTextColor = (char: string, index: number, isSubmitted: boolean) => {
    if (!isSubmitted) return isLight ? 'var(--text-primary)' : '#ffffff';
    if (targetWord[index] === char) {
      return isLight ? '#047857' : '#ffffff'; // Correct
    }
    if (targetWord.includes(char)) {
      return isLight ? '#b45309' : '#ffffff'; // Present
    }
    return isLight ? '#9ca3af' : 'rgba(255, 255, 255, 0.3)'; // Absent
  };

  const getKeyboardKeyColor = (key: string) => {
    const status = letterStatuses[key];
    if (status === 'correct') return 'var(--color-success)';
    if (status === 'present') return 'var(--color-warning)';
    if (status === 'absent') return 'var(--text-muted)';
    return isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)';
  };

  const rows = Array.from({ length: 6 });
  const keyboardRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
  ];

  const isLight = document.documentElement.classList.contains('light-theme');

  return (
    <div className="glass-panel animate-fade-in" style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
            {t('word_name')}
            {headerActions}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            {t('word_desc')}
          </p>
        </div>
        <button className="btn btn-glass" onClick={startNewGame} style={{ padding: '6px 10px' }}>
          <RefreshCcw size={14} /> {t('reset')}
        </button>
      </div>

      {/* Grid of attempts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '10px 0' }}>
        {rows.map((_, rowIndex) => {
          const isSubmitted = rowIndex < guesses.length;
          const guessWord = isSubmitted ? guesses[rowIndex] : (rowIndex === guesses.length ? currentGuess : '');
          const isShaking = shakeRow === rowIndex;

          return (
            <div 
              key={rowIndex} 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(5, 1fr)', 
                gap: '6px',
                animation: isShaking ? 'shake 0.5s ease-in-out' : undefined
              }}
            >
              {Array.from({ length: 5 }).map((_, charIndex) => {
                const char = guessWord[charIndex] || '';
                return (
                  <div
                    key={charIndex}
                    style={{
                      aspectRatio: '1',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      fontFamily: 'var(--font-display)',
                      background: getCellColor(char, charIndex, isSubmitted),
                      border: `1px solid ${getCellBorder(char, charIndex, isSubmitted)}`,
                      color: getCellTextColor(char, charIndex, isSubmitted),
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: isSubmitted ? 'rotateX(360deg)' : 'none',
                      animationDelay: `${charIndex * 100}ms`
                    }}
                  >
                    {char}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Virtual Keyboard */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
        {keyboardRows.map((row, rowIndex) => (
          <div key={rowIndex} style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
            {row.map(key => {
              const isSpecial = key === 'ENTER' || key === 'BACKSPACE';
              return (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  onTouchStart={() => {
                    playInstantKeySound();
                    soundPlayedRef.current = true;
                  }}
                  style={{
                    padding: isSpecial ? '12px 8px' : '12px 0',
                    flex: isSpecial ? '1.5' : '1',
                    fontSize: isSpecial ? '11px' : '15px',
                    fontWeight: 'bold',
                    background: getKeyboardKeyColor(key),
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-primary)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    minWidth: isSpecial ? '60px' : '30px',
                    transition: 'all 0.15s ease'
                  }}
                  className="keyboard-btn"
                >
                  {key === 'BACKSPACE' ? '⌫' : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {onClose && !_room && gameStatus === 'PLAYING' && (
        <button 
          className="btn btn-glass" 
          style={{ width: '100%', padding: '12px', marginTop: '16px' }} 
          onClick={() => onClose(true)}
        >
          Close Board
        </button>
      )}

      {/* End Game Modal Layer */}
      {gameStatus !== 'PLAYING' && (
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
          zIndex: 10,
          padding: '24px',
          textAlign: 'center'
        }}>
          {gameStatus === 'WON' ? (
            <>
              <div style={{ padding: '20px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)', animation: 'float 3s ease-in-out infinite' }}>
                <Award size={48} color="var(--color-success)" />
              </div>
              <h3 style={{ fontSize: '24px', color: 'var(--color-success)', fontFamily: 'var(--font-display)' }}>{t('correct_word')}</h3>
              <p style={{ color: 'var(--text-secondary)' }}>{t('word_solved_desc').replace('{word}', targetWord).replace('{attempts}', String(guesses.length))}</p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button className="btn btn-primary" onClick={startNewGame}>{t('play_again')}</button>
                {(!_room && onClose) && <button className="btn btn-glass" onClick={() => onClose(false)}>{t('close_board')}</button>}
              </div>
            </>
          ) : (
            <>
              <div style={{ padding: '20px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)' }}>
                <RefreshCcw size={48} color="var(--color-danger)" />
              </div>
              <h3 style={{ fontSize: '24px', color: 'var(--color-danger)', fontFamily: 'var(--font-display)' }}>{t('out_of_tries')}</h3>
              <p style={{ color: 'var(--text-secondary)' }}>{t('correct_word_was').replace('{word}', targetWord)}</p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button className="btn btn-primary" onClick={startNewGame}>{t('try_again')}</button>
                {onClose && <button className="btn btn-glass" onClick={() => onClose(false)}>{t('close_board')}</button>}
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .keyboard-btn:hover {
          background: rgba(255,255,255,0.15) !important;
          transform: translateY(-1px);
        }
        .keyboard-btn:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

export default WordPuzzle;
