import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PuzzleType } from '@puzzle-verse/shared';
import { Info, RotateCcw, LayoutGrid, Image as ImageIcon } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { translate } from '../utils/translations';

interface JigsawPuzzleProps {
  onGameWin: (puzzleType: PuzzleType, timeInSec: number, score: number) => void;
  onClose?: (isQuit?: boolean) => void;
  onProgress?: (progress: number) => void;
  room?: any;
  username?: string;
  headerActions?: React.ReactNode;
  isOnline?: boolean;
  onPlaySound?: (type: 'click' | 'success' | 'fail' | 'jigsaw') => void;
}

interface Piece {
  id: number;
  correctSlot: number;
}

const JIGSAW_IMAGES = [
  { id: 1, name: 'Cyber Neon City', url: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?q=80&w=400' },
  { id: 2, name: 'Retro Wave Grid', url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=400' },
  { id: 3, name: 'Cosmic Nebula', url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=400' },
  { id: 4, name: 'Geometric Neon', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=400' },
  { id: 5, name: 'Forest Path', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=400' },
  { id: 6, name: 'Golden Gate', url: 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=400' },
  { id: 7, name: 'Desert Dunes', url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=400' },
  { id: 8, name: 'Ocean Waves', url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=400' },
  { id: 9, name: 'Tokyo Street', url: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?q=80&w=400' },
  { id: 10, name: 'Futuristic Grid', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=400' },
  { id: 11, name: 'Aurora Borealis', url: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?q=80&w=400' },
  { id: 12, name: 'Lavender Fields', url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=400' },
  { id: 13, name: 'Retro Sunset', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=400' },
  { id: 14, name: 'Autumn Woods', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=400' },
  { id: 15, name: 'Mystic Castle', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=400' },
  { id: 16, name: 'Abstract Liquid', url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=400' },
  { id: 17, name: 'Cyberpunk Car', url: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=400' },
  { id: 18, name: 'Spooky Moon', url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?q=80&w=400' },
  { id: 19, name: 'Tropical Beach', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400' },
  { id: 20, name: 'Geometric Art', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400' },
  { id: 21, name: 'Cute Cat', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=400' },
  { id: 22, name: 'Cute Dog', url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=400' },
  { id: 23, name: 'Pink Sakura', url: 'https://images.unsplash.com/photo-1522441815192-d9f04eb0615c?q=80&w=400' },
  { id: 24, name: 'Vibrant Pattern', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400' }
];

export const JigsawPuzzle: React.FC<JigsawPuzzleProps> = ({ onGameWin, onClose, onProgress, room, username, headerActions, isOnline, onPlaySound }) => {
  const { language } = useGame();
  const t = (key: string) => translate(key, language);
  const [selectedImg, setSelectedImg] = useState<string>(JIGSAW_IMAGES[0].url);
  const [gridSize, setGridSize] = useState<number>(3); // 3 (3x3), 4 (4x4), 6 (6x6)

  const numPieces = gridSize * gridSize;
  const cellSize = gridSize === 6 ? 60 : 80;
  const boardWidth = gridSize * cellSize;

  const [boardSlots, setBoardSlots] = useState<{ [slotIndex: number]: Piece | null }>({});
  const [poolPieces, setPoolPieces] = useState<Piece[]>([]);
  const [draggedPiece, setDraggedPiece] = useState<{ piece: Piece; sourceSlot?: number } | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [timer, setTimer] = useState<number>(0);
  const [solvedCount, setSolvedCount] = useState<number>(0);

  const [matchElapsedTime, setMatchElapsedTime] = useState<number>(0);
  const [receivedProposal, setReceivedProposal] = useState<{ senderUsername: string } | null>(null);
  const [proposalSent, setProposalSent] = useState<boolean>(false);
  const [disableGridSelect, setDisableGridSelect] = useState<boolean>(false);
  const [proposalAccepted, setProposalAccepted] = useState<boolean>(false);
  const [proposalDeclined, setProposalDeclined] = useState<boolean>(false);

  const onProgressRef = useRef(onProgress);
  const timerRef = useRef(timer);
  const onGameWinRef = useRef(onGameWin);

  useEffect(() => {
    onProgressRef.current = onProgress;
    timerRef.current = timer;
    onGameWinRef.current = onGameWin;
  }, [onProgress, timer, onGameWin]);

  // Handle game initializations and resets
  const initPuzzle = useCallback(() => {
    // Reset timer
    setTimer(0);
    setSolvedCount(0);
    setDraggedPiece(null);

    // Initialize board slots empty
    const emptySlots: { [slotIndex: number]: Piece | null } = {};
    for (let i = 0; i < numPieces; i++) {
      emptySlots[i] = null;
    }
    setBoardSlots(emptySlots);

    // Initialize tray pieces
    const pieces: Piece[] = Array.from({ length: numPieces }, (_, i) => ({
      id: i,
      correctSlot: i,
    }));
    // Scramble order
    setPoolPieces([...pieces].sort(() => Math.random() - 0.5));

    if (onProgressRef.current) onProgressRef.current(0);
  }, [numPieces]);

  useEffect(() => {
    initPuzzle();
  }, [initPuzzle, selectedImg, gridSize]);

  const isWithin5Seconds = matchElapsedTime <= 5;

  // Track match elapsed time
  useEffect(() => {
    if (!room) return;
    const interval = setInterval(() => {
      setMatchElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [room]);

  // Colyseus listeners for 4x4 proposals
  useEffect(() => {
    if (!room) return;

    const unregisterPropose = room.onMessage("propose_4x4_received", (data: { senderId: string, senderUsername: string }) => {
      if (data.senderId !== room.sessionId) {
        setReceivedProposal({ senderUsername: data.senderUsername });
      }
    });

    const unregisterApply = room.onMessage("apply_4x4_mode", () => {
      setGridSize(4);
      setDisableGridSelect(true);
      setProposalAccepted(true);
      setReceivedProposal(null);
    });

    const unregisterDecline = room.onMessage("decline_4x4_received", () => {
      setProposalSent(false);
      setProposalDeclined(true);
      setTimeout(() => setProposalDeclined(false), 3000);
      setReceivedProposal(null);
    });

    return () => {
      unregisterPropose();
      unregisterApply();
      unregisterDecline();
    };
  }, [room]);

  const handlePropose4x4 = () => {
    if (room && isWithin5Seconds && !proposalSent) {
      room.send("propose_4x4", { username: username || 'Opponent' });
      setProposalSent(true);
    }
  };

  // Timer loop
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const startDrag = (e: React.MouseEvent | React.TouchEvent, piece: Piece, sourceSlot?: number) => {
    let clientX = 0;
    let clientY = 0;
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    setDraggedPiece({ piece, sourceSlot });
    setDragPos({ x: clientX, y: clientY });
  };

  // Manage mouse and touch dragging listeners on window
  useEffect(() => {
    if (!draggedPiece) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      let clientY = 0;
      if ('touches' in e) {
        if (e.touches.length === 0) return;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
        // Prevent scrolling while dragging
        if (e.cancelable) e.preventDefault();
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      setDragPos({ x: clientX, y: clientY });
    };

    const handlePointerUp = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      let clientY = 0;
      if ('changedTouches' in e) {
        if (e.changedTouches.length === 0) return;
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      } else {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }

      // Proximity-based slot detection
      const slots = document.querySelectorAll('[data-slot-idx]');
      let closestSlotIdx: number | null = null;
      let minDistance = 50; // Tolerance threshold in pixels

      slots.forEach(slotEl => {
        const rect = slotEl.getBoundingClientRect();
        const slotCenterX = rect.left + rect.width / 2;
        const slotCenterY = rect.top + rect.height / 2;
        const dist = Math.sqrt((clientX - slotCenterX) ** 2 + (clientY - slotCenterY) ** 2);
        if (dist < minDistance) {
          minDistance = dist;
          const idxAttr = slotEl.getAttribute('data-slot-idx');
          if (idxAttr) closestSlotIdx = parseInt(idxAttr);
        }
      });

      if (closestSlotIdx !== null) {
        handleDrop(closestSlotIdx);
      } else {
        // Drop failed, reset dragged state
        setDraggedPiece(null);
        setDragPos(null);
      }
    };

    // Bind event listeners with { passive: false } for preventDefault support
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchend', handlePointerUp);
    window.addEventListener('touchcancel', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchend', handlePointerUp);
      window.removeEventListener('touchcancel', handlePointerUp);
    };
  }, [draggedPiece]);

  const handleDrop = (slotIndex: number) => {
    if (!draggedPiece) return;

    // Check if slot is already occupied
    if (boardSlots[slotIndex] !== null) return;

    // Place piece in slot
    setBoardSlots(prev => {
      const next = { ...prev, [slotIndex]: draggedPiece.piece };

      // If the piece was dragged from another slot on the board, empty that original slot
      if (draggedPiece.sourceSlot !== undefined) {
        next[draggedPiece.sourceSlot] = null;
      }

      // Calculate correctly placed pieces
      let correct = 0;
      Object.keys(next).forEach(k => {
        const slotIdx = parseInt(k);
        const item = next[slotIdx];
        if (item && item.correctSlot === slotIdx) {
          correct++;
        }
      });
      setSolvedCount(correct);

      // Trigger progress update
      const progressPercent = Math.floor((correct / numPieces) * 100);
      if (onProgressRef.current) onProgressRef.current(progressPercent);

      // Check win trigger
      if (correct === numPieces) {
        // Adjust points scaling based on difficulty size
        const diffMultiplier = gridSize === 3 ? 1.8 : gridSize === 4 ? 1.4 : 1.0;
        const score = Math.max(50, (gridSize * 150) - Math.floor(timerRef.current / diffMultiplier));
        if (onGameWinRef.current) onGameWinRef.current(PuzzleType.JIGSAW, timerRef.current, score);
        onPlaySound?.('success');
      } else {
        onPlaySound?.('jigsaw');
      }

      return next;
    });

    // Remove from pool
    if (draggedPiece.sourceSlot === undefined) {
      setPoolPieces(prev => prev.filter(p => p.id !== draggedPiece.piece.id));
    }
    setDraggedPiece(null);
  };

  const handleReturnToPool = (piece: Piece, slotIdx: number) => {
    onPlaySound?.('click');
    setBoardSlots(prev => {
      const next = { ...prev, [slotIdx]: null };
      
      // Update correct solves count
      let correct = 0;
      Object.keys(next).forEach(k => {
        const idx = parseInt(k);
        const item = next[idx];
        if (item && item.correctSlot === idx) {
          correct++;
        }
      });
      setSolvedCount(correct);

      if (onProgressRef.current) onProgressRef.current(Math.floor((correct / numPieces) * 100));
      return next;
    });

    setPoolPieces(prev => [...prev, piece]);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Helper styles for sliced dynamic puzzle grids
  const getSliceStyle = (pieceId: number) => {
    const r = Math.floor(pieceId / gridSize);
    const c = pieceId % gridSize;
    return {
      backgroundImage: `url(${selectedImg})`,
      backgroundSize: `${boardWidth}px ${boardWidth}px`,
      backgroundPosition: `${-c * cellSize}px ${-r * cellSize}px`,
      width: `${cellSize}px`,
      height: `${cellSize}px`,
      borderRadius: '4px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      cursor: 'grab',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid rgba(255,255,255,0.08)'
    };
  };

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
        if (buttonSize !== 6 && isWithin5Seconds && !disableGridSelect) {
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

  const isLight = document.documentElement.classList.contains('light-theme');

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px', width: '100%' }}>
      {/* Title & Time */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center' }}>
            {t('jigsaw_name')}
            {headerActions}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('jigsaw_desc')}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('time_elapsed').toUpperCase()}</p>
          <h4 style={{ fontSize: '18px', color: 'var(--color-secondary)', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
            {formatTime(timer)}
          </h4>
        </div>
      </div>

      {/* Selectors Accordion */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
        {/* Grid Size selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <LayoutGrid size={15} /> {t('grid_dimensions')}
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {room && (proposalSent || proposalAccepted || proposalDeclined) && (
              <span style={{ fontSize: '10px', color: proposalDeclined ? 'var(--color-danger)' : 'var(--color-secondary)' }}>
                {proposalAccepted ? t('accepted') : proposalDeclined ? t('declined') : t('proposing')}
              </span>
            )}
            {[
              { val: 3, label: `3x3 (${t('easy')})` },
              { val: 4, label: `4x4 (${t('medium')})` },
              { val: 6, label: `6x6 (${t('hard')})` }
            ].map(pill => (
              <button
                key={pill.val}
                className={`btn ${gridSize === pill.val ? 'btn-primary' : 'btn-glass'}`}
                style={{ 
                  padding: '6px 12px', 
                  fontSize: '11px', 
                  borderRadius: '8px',
                  ...getButtonStyle(pill.val)
                }}
                onClick={() => {
                  if (room) {
                    if (pill.val === 4 && isWithin5Seconds) {
                      handlePropose4x4();
                    }
                  } else {
                    setGridSize(pill.val);
                  }
                }}
                disabled={
                  disableGridSelect || 
                  (room && (pill.val !== 4 || !isWithin5Seconds || proposalSent || proposalDeclined))
                }
              >
                {proposalSent && !proposalAccepted && pill.val === 4 ? t('asked') : (proposalDeclined && pill.val === 4) ? t('declined') : pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Image selector */}
        <div>
          <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <ImageIcon size={15} /> {t('select_puzzle_image_theme')}
          </span>
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            overflowX: 'auto', 
            paddingBottom: '8px',
            scrollbarWidth: 'thin'
          }}>
            {JIGSAW_IMAGES.map(img => (
              <button
                key={img.id}
                onClick={() => setSelectedImg(img.url)}
                style={{
                  flexShrink: 0,
                  width: '64px',
                  height: '64px',
                  borderRadius: '8px',
                  backgroundImage: `url(${img.url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: selectedImg === img.url ? '3px solid var(--color-primary)' : '2px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  padding: 0,
                  position: 'relative',
                  boxShadow: selectedImg === img.url ? 'var(--glow-primary)' : 'none'
                }}
                title={img.name}
              />
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center', alignItems: 'flex-start' }}>
        {/* Target Snapping Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            {t('target_slots_board').replace('{count}', String(solvedCount)).replace('{total}', String(numPieces))}
          </span>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`, 
            gridTemplateRows: `repeat(${gridSize}, ${cellSize}px)`,
            gap: '4px', 
            background: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.03)', 
            padding: '8px', 
            borderRadius: '12px', 
            border: isLight ? '2px solid #94a3b8' : '2px solid rgba(255,255,255,0.08)'
          }}>
            {Array.from({ length: numPieces }).map((_, slotIdx) => {
              const piece = boardSlots[slotIdx];
              return (
                <div
                  key={slotIdx}
                  data-slot-idx={slotIdx}
                  style={{
                    background: isLight ? '#ffffff' : 'rgba(0,0,0,0.25)',
                    border: isLight ? '1px dashed #94a3b8' : '1px dashed rgba(255,255,255,0.15)',
                    borderRadius: '4px',
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                >
                  {piece ? (
                    <div 
                      style={{
                        ...getSliceStyle(piece.id),
                        opacity: (draggedPiece && draggedPiece.piece.id === piece.id) ? 0.3 : 1,
                        cursor: 'grab'
                      }}
                      onMouseDown={(e) => startDrag(e, piece, slotIdx)}
                      onTouchStart={(e) => startDrag(e, piece, slotIdx)}
                      onClick={() => handleReturnToPool(piece, slotIdx)}
                      title="Click to return tray"
                    />
                  ) : (
                    <span style={{ fontSize: '8px', color: isLight ? '#64748b' : 'rgba(255,255,255,0.06)' }}>Slot {slotIdx + 1}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrambled Tray */}
        <div style={{ flex: 1, minWidth: '220px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            SCRAMBLED TRAY (Drag from here)
          </span>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '8px', 
            background: isLight ? '#f1f5f9' : 'rgba(0,0,0,0.2)', 
            padding: '16px', 
            borderRadius: '12px', 
            border: '1px solid var(--border-glass)',
            minHeight: '200px',
            maxHeight: '380px',
            overflowY: 'auto',
            alignContent: 'flex-start'
          }}>
            {poolPieces.map(piece => (
              <div
                key={piece.id}
                onMouseDown={(e) => startDrag(e, piece)}
                onTouchStart={(e) => startDrag(e, piece)}
                style={{
                  ...getSliceStyle(piece.id),
                  opacity: (draggedPiece && draggedPiece.piece.id === piece.id) ? 0.3 : 1,
                  cursor: 'grab'
                }}
              >
                <span style={{ fontSize: '9px', background: 'rgba(0,0,0,0.5)', padding: '1px 3px', borderRadius: '3px', color: '#fff', pointerEvents: 'none' }}>
                  🧩
                </span>
              </div>
            ))}
            {poolPieces.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', width: '100%', textAlign: 'center', margin: 'auto' }}>All pieces placed! Check slots.</p>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-glass)', fontSize: '12px', color: 'var(--text-muted)' }}>
        <Info size={16} />
        <span>Tip: Drag slices into target grid cells. Click placed cells to return them to the Scrambled Tray.</span>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button 
          className="btn btn-glass" 
          style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} 
          onClick={initPuzzle}
        >
          <RotateCcw size={16} /> Rescramble Board
        </button>
        {onClose && !isOnline && (
          <button className="btn btn-glass" style={{ flex: 1, padding: '12px' }} onClick={() => onClose(true)}>
            Close Board
          </button>
        )}
      </div>
      {receivedProposal && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(5, 3, 10, 0.95)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', zIndex: 100, padding: '24px', textAlign: 'center', backdropFilter: 'blur(8px)' }}>
          <div style={{ padding: '16px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', boxShadow: 'var(--glow-primary)' }}>
            <LayoutGrid size={36} color="var(--color-primary)" />
          </div>
          <h3 style={{ fontSize: '20px', color: 'var(--text-primary)' }}>4x4 Challenge Proposed!</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '320px' }}>
            {receivedProposal.senderUsername} wants to play Jigsaw in 4x4 mode instead of 3x3! Accepting will change the grid size and reset the board.
          </p>
          <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '240px', marginTop: '8px' }}>
            <button 
              className="btn btn-primary" 
              style={{ flex: 1 }} 
              onClick={() => {
                room.send("accept_4x4");
                setReceivedProposal(null);
              }}
            >
              Accept
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
                if (room) room.send("decline_4x4");
                setReceivedProposal(null);
              }}
            >
              Decline
            </button>
          </div>
        </div>
      )}
      {draggedPiece && dragPos && (
        <div style={{
          ...getSliceStyle(draggedPiece.piece.id),
          position: 'fixed',
          left: dragPos.x - cellSize / 2,
          top: dragPos.y - cellSize / 2,
          pointerEvents: 'none',
          zIndex: 10000,
          opacity: 0.85,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
        }} />
      )}
    </div>
  );
};

export default JigsawPuzzle;
