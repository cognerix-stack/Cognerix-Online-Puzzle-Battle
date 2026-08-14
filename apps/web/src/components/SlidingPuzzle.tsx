import React, { useState, useEffect, useCallback } from 'react';
import { Play, RotateCcw, Award, Clock, Move, Image as ImageIcon, HelpCircle } from 'lucide-react';
import { PuzzleType } from '@puzzle-verse/shared';
import { useGame } from '../context/GameContext';
import { translate } from '../utils/translations';

interface SlidingPuzzleProps {
  onGameWin: (puzzleType: PuzzleType, timeInSec: number, score: number) => void;
  onClose?: (isQuit?: boolean) => void;
  onProgress?: (progress: number) => void;
  onGridSizeChange?: (size: number) => void;
  room?: any;
  username?: string;
  headerActions?: React.ReactNode;
  onPlaySound?: (type: 'click' | 'success' | 'fail' | 'slide') => void;
}

export const SlidingPuzzle: React.FC<SlidingPuzzleProps> = ({ onGameWin, onClose, onProgress, onGridSizeChange, room, username, headerActions, onPlaySound }) => {
  const { language } = useGame();
  const t = (key: string) => translate(key, language);

  const [gridSize, setGridSize] = useState<number>(3); // Default 3x3 (8-puzzle) for quicker games, options for 4x4
  const [board, setBoard] = useState<number[]>([]);
  const [blankIndex, setBlankIndex] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0);
  const [hasWon, setHasWon] = useState<boolean>(false);
  const [useImage, setUseImage] = useState<boolean>(false);

  const [matchElapsedTime, setMatchElapsedTime] = useState<number>(0);
  const [receivedProposal, setReceivedProposal] = useState<{ senderUsername: string; size: number } | null>(null);
  const [proposalSent, setProposalSent] = useState<boolean>(false);
  const [proposedSize, setProposedSize] = useState<number | null>(null);
  const [disableGridSelect, setDisableGridSelect] = useState<boolean>(false);
  const [proposalAccepted, setProposalAccepted] = useState<boolean>(false);
  const [proposalDeclined, setProposalDeclined] = useState<boolean>(false);

  useEffect(() => {
    onGridSizeChange?.(gridSize);
  }, [gridSize, onGridSizeChange]);

  // Generate a solved board
  const generateSolvedBoard = useCallback((size: number) => {
    const totalTiles = size * size;
    const initial = Array.from({ length: totalTiles }, (_, i) => i + 1);
    initial[totalTiles - 1] = 0; // 0 represents the blank tile
    return initial;
  }, []);

  // Check if board is solved
  const checkWin = useCallback((currentBoard: number[]) => {
    const solved = generateSolvedBoard(gridSize);
    for (let i = 0; i < currentBoard.length; i++) {
      if (currentBoard[i] !== solved[i]) return false;
    }
    return true;
  }, [gridSize, generateSolvedBoard]);

  // Make a move: Swap blank and targeted tile if valid
  const moveTile = useCallback((tileIndex: number) => {
    if (!isStarted || hasWon) return;

    const row = Math.floor(tileIndex / gridSize);
    const col = tileIndex % gridSize;
    const blankRow = Math.floor(blankIndex / gridSize);
    const blankCol = blankIndex % gridSize;

    // Check if adjacent (up, down, left, right)
    const isAdjacent = 
      (Math.abs(row - blankRow) === 1 && col === blankCol) ||
      (Math.abs(col - blankCol) === 1 && row === blankRow);

    if (isAdjacent) {
      onPlaySound?.('slide');
      setBoard(prev => {
        const next = [...prev];
        next[blankIndex] = next[tileIndex];
        next[tileIndex] = 0;
        
        // Check win conditions immediately on the updated board
        if (checkWin(next)) {
          setHasWon(true);
          setIsStarted(false);
          // Reward score is calculated based on moves and time
          const baseScore = gridSize === 3 ? 300 : gridSize === 4 ? 800 : 1500;
          const score = Math.max(50, baseScore - moves * 2 - timer);
          onGameWin(PuzzleType.SLIDING, timer, score);
        } else if (onProgress) {
          const solved = generateSolvedBoard(gridSize);
          let correct = 0;
          next.forEach((val, idx) => {
            if (val === solved[idx]) correct++;
          });
          onProgress(Math.floor((correct / (gridSize * gridSize)) * 100));
        }
        return next;
      });
      setBlankIndex(tileIndex);
      setMoves(prev => prev + 1);
    }
  }, [isStarted, hasWon, blankIndex, gridSize, checkWin, moves, timer, onGameWin, onProgress, generateSolvedBoard]);

  // Shuffle board using random legal moves to guarantee it remains solvable
  const shuffleBoard = useCallback((forcedSize?: number) => {
    const size = forcedSize !== undefined ? forcedSize : gridSize;
    let currentBoard = generateSolvedBoard(size);
    let currentBlank = size * size - 1;

    // Make 150 random legal moves
    for (let i = 0; i < 150; i++) {
      const row = Math.floor(currentBlank / size);
      const col = currentBlank % size;
      const validMoves: number[] = [];

      if (row > 0) validMoves.push(currentBlank - size); // Up
      if (row < size - 1) validMoves.push(currentBlank + size); // Down
      if (col > 0) validMoves.push(currentBlank - 1); // Left
      if (col < size - 1) validMoves.push(currentBlank + 1); // Right

      // Choose a random move from valid ones
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      currentBoard[currentBlank] = currentBoard[randomMove];
      currentBoard[randomMove] = 0;
      currentBlank = randomMove;
    }

    setBoard(currentBoard);
    setBlankIndex(currentBlank);
    setMoves(0);
    setTimer(0);
    setHasWon(false);
    setIsStarted(true);
  }, [gridSize, generateSolvedBoard]);

  // Initialize board
  useEffect(() => {
    const solved = generateSolvedBoard(gridSize);
    setBoard(solved);
    setBlankIndex(gridSize * gridSize - 1);
    setIsStarted(false);
    setHasWon(false);
    setMoves(0);
    setTimer(0);
  }, [gridSize, generateSolvedBoard]);

  const isWithin5Seconds = matchElapsedTime <= 5;

  // Track match elapsed time
  useEffect(() => {
    if (!room) return;
    const interval = setInterval(() => {
      setMatchElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [room]);

  // Colyseus listeners for proposals
  useEffect(() => {
    if (!room) return;

    const unregisterPropose = room.onMessage("propose_4x4_received", (data: { senderId: string, senderUsername: string }) => {
      if (data.senderId !== room.sessionId) {
        setReceivedProposal({ senderUsername: data.senderUsername, size: 4 });
      }
    });

    const unregisterApply = room.onMessage("apply_4x4_mode", () => {
      setGridSize(4);
      setDisableGridSelect(true);
      setProposalAccepted(true);
      setReceivedProposal(null);
      shuffleBoard(4);
    });

    const unregisterDecline = room.onMessage("decline_4x4_received", () => {
      setProposalSent(false);
      setProposedSize(null);
      setProposalDeclined(true);
      setTimeout(() => setProposalDeclined(false), 3000);
      setReceivedProposal(null);
    });

    const unregisterPropose6x6 = room.onMessage("propose_6x6_received", (data: { senderId: string, senderUsername: string }) => {
      if (data.senderId !== room.sessionId) {
        setReceivedProposal({ senderUsername: data.senderUsername, size: 6 });
      }
    });

    const unregisterApply6x6 = room.onMessage("apply_6x6_mode", () => {
      setGridSize(6);
      setDisableGridSelect(true);
      setProposalAccepted(true);
      setReceivedProposal(null);
      shuffleBoard(6);
    });

    const unregisterDecline6x6 = room.onMessage("decline_6x6_received", () => {
      setProposalSent(false);
      setProposedSize(null);
      setProposalDeclined(true);
      setTimeout(() => setProposalDeclined(false), 3000);
      setReceivedProposal(null);
    });

    return () => {
      unregisterPropose();
      unregisterApply();
      unregisterDecline();
      unregisterPropose6x6();
      unregisterApply6x6();
      unregisterDecline6x6();
    };
  }, [room, shuffleBoard]);

  const handlePropose4x4 = () => {
    if (room && isWithin5Seconds && !proposalSent) {
      room.send("propose_4x4", { username: username || 'Opponent' });
      setProposalSent(true);
      setProposedSize(4);
    }
  };

  const handlePropose6x6 = () => {
    if (room && isWithin5Seconds && !proposalSent) {
      room.send("propose_6x6", { username: username || 'Opponent' });
      setProposalSent(true);
      setProposedSize(6);
    }
  };

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isStarted && !hasWon) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStarted, hasWon]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isStarted || hasWon) return;

    const row = Math.floor(blankIndex / gridSize);
    const col = blankIndex % gridSize;
    let targetIndex = -1;

    switch (e.key) {
      case 'ArrowUp': // Move tile below blank UP, so swap blank with tile below
        if (row < gridSize - 1) targetIndex = blankIndex + gridSize;
        break;
      case 'ArrowDown': // Move tile above blank DOWN, so swap blank with tile above
        if (row > 0) targetIndex = blankIndex - gridSize;
        break;
      case 'ArrowLeft': // Move tile to the right of blank LEFT, so swap blank with right tile
        if (col < gridSize - 1) targetIndex = blankIndex + 1;
        break;
      case 'ArrowRight': // Move tile to the left of blank RIGHT, so swap blank with left tile
        if (col > 0) targetIndex = blankIndex - 1;
        break;
    }

    if (targetIndex !== -1) {
      e.preventDefault();
      moveTile(targetIndex);
    }
  }, [isStarted, hasWon, blankIndex, gridSize, moveTile]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const getButtonStyle = (buttonSize: number) => {
    const isActive = gridSize === buttonSize;
    if (room) {
      if (isActive) {
        return {
          borderColor: 'var(--color-primary)',
          background: 'rgba(139, 92, 246, 0.15)',
          color: 'var(--color-primary)',
          opacity: 1,
          cursor: 'default',
          boxShadow: '0 0 8px rgba(139, 92, 246, 0.3)'
        };
      } else {
        if (isWithin5Seconds && !disableGridSelect) {
          return {
            borderColor: 'rgba(255, 255, 255, 0.15)',
            background: 'transparent',
            color: 'var(--text-primary)',
            opacity: 1,
            cursor: buttonSize === 4 && !proposalSent ? 'pointer' : 'not-allowed'
          };
        } else {
          return {
            borderColor: 'rgba(156, 163, 175, 0.2)',
            background: 'transparent',
            color: '#9ca3af',
            opacity: 0.5,
            cursor: 'not-allowed'
          };
        }
      }
    } else {
      if (isActive) {
        return {
          borderColor: 'var(--color-primary)',
          background: 'rgba(139, 92, 246, 0.1)'
        };
      }
      return {};
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isLight = document.documentElement.classList.contains('light-theme');

  return (
    <div className="glass-panel animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
            {t('sliding_name')}
            {headerActions}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            {t('sliding_desc')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {room && (proposalSent || proposalAccepted || proposalDeclined) && (
            <span style={{ fontSize: '11px', color: proposalDeclined ? 'var(--color-danger)' : 'var(--color-secondary)', marginRight: '4px' }}>
              {proposalAccepted ? t('accept') : proposalDeclined ? t('declined') : 'Proposing...'}
            </span>
          )}
          <button 
            className={`btn btn-glass ${gridSize === 3 ? 'active' : ''}`} 
            style={getButtonStyle(3)}
            onClick={() => {
              if (!room) setGridSize(3);
            }}
            disabled={(isStarted && !hasWon) || !!room || disableGridSelect}
          >
            3x3
          </button>
          <button 
            className={`btn btn-glass ${gridSize === 4 ? 'active' : ''}`} 
            style={getButtonStyle(4)}
            onClick={() => {
              if (room) {
                if (isWithin5Seconds) {
                  handlePropose4x4();
                }
              } else {
                setGridSize(4);
              }
            }}
            disabled={(isStarted && !hasWon) || (room && (!isWithin5Seconds || proposalSent || proposalDeclined)) || disableGridSelect}
          >
            {proposalSent && proposedSize === 4 && !proposalAccepted ? t('asked') : proposalDeclined && proposedSize === 4 ? t('declined') : '4x4'}
          </button>
          <button 
            className={`btn btn-glass ${gridSize === 6 ? 'active' : ''}`} 
            style={getButtonStyle(6)}
            onClick={() => {
              if (room) {
                if (isWithin5Seconds) {
                  handlePropose6x6();
                }
              } else {
                setGridSize(6);
              }
            }}
            disabled={(isStarted && !hasWon) || (room && (!isWithin5Seconds || proposalSent || proposalDeclined)) || disableGridSelect}
          >
            {proposalSent && proposedSize === 6 && !proposalAccepted ? t('asked') : proposalDeclined && proposedSize === 6 ? t('declined') : '6x6'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.03)', padding: '12px 18px', borderRadius: '12px', border: '1px solid var(--border-glass)', fontSize: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={16} color="var(--color-secondary)" />
          <span style={{ color: 'var(--text-secondary)' }}>{t('time')}:</span>
          <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{formatTime(timer)}</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Move size={16} color="var(--color-primary)" />
          <span style={{ color: 'var(--text-secondary)' }}>{t('moves')}:</span>
          <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{moves}</strong>
        </div>
        <button 
          className="btn" 
          style={{ padding: '4px 8px', fontSize: '13px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}
          onClick={() => setUseImage(!useImage)}
        >
          <ImageIcon size={14} />
          {useImage ? t('number_mode') : t('image_mode')}
        </button>
      </div>

      {/* Sliding Puzzle Board Grid */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gap: '8px',
          width: '100%',
          aspectRatio: '1',
          background: isLight ? '#e2e8f0' : 'rgba(10, 6, 26, 0.6)',
          border: '1px solid var(--border-glass)',
          borderRadius: '16px',
          padding: '12px',
          position: 'relative'
        }}
      >
        {board.map((val, index) => {
          const isBlank = val === 0;
          
          // Calculate grid positions for Image Mode (using slice of background image)
          const rowPos = Math.floor((val - 1) / gridSize);
          const colPos = (val - 1) % gridSize;
          const bgX = (colPos / (gridSize - 1)) * 100;
          const bgY = (rowPos / (gridSize - 1)) * 100;

          return (
            <div
              key={index}
              onClick={() => moveTile(index)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                fontSize: gridSize === 3 ? '28px' : gridSize === 4 ? '22px' : '15px',
                fontWeight: 'bold',
                fontFamily: 'var(--font-display)',
                cursor: isBlank || !isStarted || hasWon ? 'default' : 'pointer',
                opacity: isBlank ? 0 : 1,
                transform: !isBlank && isStarted && !hasWon ? 'scale(1)' : 'scale(0.98)',
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                color: 'var(--text-primary)',
                
                // Styling depends on image mode vs text mode
                ...(isBlank ? {} : useImage ? {
                  backgroundImage: `url('https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=600&q=80')`,
                  backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
                  backgroundPosition: `${bgX}% ${bgY}%`,
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5), 0 4px 10px rgba(0,0,0,0.2)'
                } : {
                  background: isLight ? '#ffffff' : 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15))',
                  boxShadow: isLight ? '0 2px 6px rgba(0,0,0,0.05)' : 'inset 0 0 10px rgba(255,255,255,0.05), var(--shadow-card)',
                  borderLeft: isLight ? '1px solid rgba(0,0,0,0.05)' : '1px solid rgba(255,255,255,0.1)',
                  borderTop: isLight ? '1px solid rgba(0,0,0,0.05)' : '1px solid rgba(255,255,255,0.1)'
                })
              }}
              className={!isBlank && isStarted && !hasWon ? "tile-hover" : ""}
            >
              {!useImage && !isBlank && val}
              {useImage && !isBlank && (
                <span style={{ fontSize: '10px', position: 'absolute', bottom: '4px', right: '6px', background: 'rgba(0,0,0,0.6)', padding: '2px 4px', borderRadius: '4px', color: 'rgba(255,255,255,0.7)', fontWeight: 'normal' }}>
                  {val}
                </span>
              )}
            </div>
          );
        })}

        {/* Start Game Overlay */}
        {!isStarted && !hasWon && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(8, 5, 18, 0.85)', borderRadius: '16px', backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', zIndex: 10 }}>
            <div style={{ padding: '16px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', boxShadow: 'var(--glow-primary)' }}>
              <Play size={36} color="var(--color-primary)" />
            </div>
            <h3 style={{ fontSize: '20px', color: 'var(--text-primary)' }}>{t('ready_to_challenge')}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '300px', textAlign: 'center' }}>
              {t('sliding_help_desc')}
            </p>
            <button className="btn btn-primary" onClick={() => shuffleBoard()}>
              {t('shuffle_start')}
            </button>
          </div>
        )}

        {/* Win Modal Overlay */}
        {hasWon && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(8, 5, 18, 0.9)', borderRadius: '16px', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', zIndex: 10, animation: 'fadeIn 0.3s ease-in-out' }}>
            <div style={{ padding: '20px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)', animation: 'float 3s ease-in-out infinite' }}>
              <Award size={48} color="var(--color-success)" />
            </div>
            <h3 style={{ fontSize: '24px', color: 'var(--color-success)', fontFamily: 'var(--font-display)' }}>{t('puzzle_solved')}</h3>
            <div style={{ display: 'flex', gap: '20px', margin: '8px 0' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{t('moves')}</p>
                <h4 style={{ fontSize: '20px', fontFamily: 'var(--font-display)' }}>{moves}</h4>
              </div>
              <div style={{ width: '1px', background: 'var(--border-glass)' }}></div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{t('time')}</p>
                <h4 style={{ fontSize: '20px', fontFamily: 'var(--font-display)' }}>{formatTime(timer)}</h4>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              {t('earned_rewards_sliding')}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => shuffleBoard()}>
                {t('play_again')}
              </button>
              {onClose && (
                <button className="btn btn-glass" onClick={() => onClose(false)}>
                  {t('close')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '4px' }}>
        <button 
          className="btn btn-glass" 
          onClick={() => shuffleBoard()} 
          disabled={!isStarted || hasWon}
          style={{ opacity: !isStarted || hasWon ? 0.5 : 1 }}
        >
          <RotateCcw size={16} /> {t('reset_board')}
        </button>
        {(!room && onClose) && (
          <button className="btn btn-glass" onClick={() => onClose(true)}>
            {t('close_board')}
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '13px' }}>
          <HelpCircle size={14} /> {t('arrow_keys_enabled')}
        </div>
      </div>

      <style>{`
        .tile-hover:hover {
          border-color: rgba(139, 92, 246, 0.5) !important;
          box-shadow: 0 0 12px rgba(139, 92, 246, 0.3), inset 0 0 10px rgba(255,255,255,0.08) !important;
          transform: scale(1.02) !important;
        }
      `}</style>

      {receivedProposal && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(5, 3, 10, 0.95)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', zIndex: 100, padding: '24px', textAlign: 'center', backdropFilter: 'blur(8px)' }}>
          <div style={{ padding: '16px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', boxShadow: 'var(--glow-primary)' }}>
            <Move size={36} color="var(--color-primary)" />
          </div>
          <h3 style={{ fontSize: '20px', color: 'var(--text-primary)' }}>{receivedProposal.size}x{receivedProposal.size} {t('challenge_proposed')}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '320px' }}>
            {receivedProposal.senderUsername} wants to play in {receivedProposal.size}x{receivedProposal.size} mode instead of 3x3! Accepting will change the grid size and restart the board.
          </p>
          <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '240px', marginTop: '8px' }}>
            <button 
              className="btn btn-primary" 
              style={{ flex: 1 }} 
              onClick={() => {
                room.send(receivedProposal.size === 6 ? "accept_6x6" : "accept_4x4");
                setReceivedProposal(null);
              }}
            >
              {t('accept')}
            </button>
            <button 
              className="btn" 
              style={{ 
                flex: 1, 
                background: 'rgba(255, 255, 255, 0.1)', 
                border: '1px solid rgba(255, 255, 255, 0.2)', 
                color: '#ffffff' 
              }} 
              onClick={() => {
                if (room) room.send(receivedProposal.size === 6 ? "decline_6x6" : "decline_4x4");
                setReceivedProposal(null);
              }}
            >
              {t('decline')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default SlidingPuzzle;
