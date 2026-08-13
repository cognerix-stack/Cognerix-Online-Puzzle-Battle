import React, { useState, useEffect, useRef, useMemo } from 'react';
import { HelpCircle, Clock, AlertTriangle, PlayCircle, Plus, Check, X } from 'lucide-react';
import { PuzzleType } from '@puzzle-verse/shared';
import { useGame } from '../context/GameContext';
import { translate } from '../utils/translations';

interface MentalMathChallengeProps {
  onClose?: (isQuit?: boolean) => void;
  onProgress?: (progress: number) => void;
  onGameWin?: (puzzleType: PuzzleType, timeInSec: number, score: number) => void;
  seed?: string;
  isOnline?: boolean;
  room?: any;
  headerActions?: React.ReactNode;
  onPlaySound?: (type: 'click' | 'success' | 'fail' | 'correct' | 'slide' | 'block_place') => void;
}

// PRNG helper
function seededRandom(seed: any) {
  const strSeed = String(seed || "PUZZLE_SEED");
  let h = 0;
  for (let i = 0; i < strSeed.length; i++) {
    h = Math.imul(31, h) + strSeed.charCodeAt(i) | 0;
  }
  return function() {
    let t = h += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const MentalMathChallenge: React.FC<MentalMathChallengeProps> = ({
  onClose,
  onProgress,
  onGameWin,
  seed,
  isOnline,
  room,
  headerActions,
  onPlaySound
}) => {
  const { language, userProfile, saveProfile } = useGame();
  const t = (key: string) => translate(key, language);

  const onPlaySoundRef = useRef(onPlaySound);
  onPlaySoundRef.current = onPlaySound;

  const isHost = useMemo(() => {
    if (!room || !room.state || !room.state.players) return true;
    const playerKeys: string[] = [];
    room.state.players.forEach((_val: any, key: string) => {
      playerKeys.push(key);
    });
    if (playerKeys.length === 0) return true;
    playerKeys.sort();
    return room.sessionId === playerKeys[0];
  }, [room]);

  // States
  const [gameState, setGameState] = useState<'SETUP' | 'MEMORIZE' | 'ANSWER' | 'RESULTS'>('SETUP');
  const [numberCount, setNumberCount] = useState<number>(5);
  const [digitsPerNumber, setDigitsPerNumber] = useState<number>(2);
  const [numbers, setNumbers] = useState<number[]>([]);
  const [correctSum, setCorrectSum] = useState<number>(0);
  const [currentNumberIndex, setCurrentNumberIndex] = useState<number>(0);

  // Input states
  const [playerAnswer, setPlayerAnswer] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<number>(10);
  const [timeTaken, setTimeTaken] = useState<number>(0);
  const [extraPurchases, setExtraPurchases] = useState<number>(0);
  const [purchaseStatus, setPurchaseStatus] = useState<string>('');

  // Results state
  const [gameScore, setGameScore] = useState<number>(0);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean>(false);
  const [multiplayerResults, setMultiplayerResults] = useState<any[] | null>(null);
  const [multiplayerWinnerName, setMultiplayerWinnerName] = useState<string | null>(null);
  const [revealResults, setRevealResults] = useState<boolean>(false);

  // Digit selection proposal states
  const [proposedDigits, setProposedDigits] = useState<number | null>(null);
  const [isWaitingForDigitsProposal, setIsWaitingForDigitsProposal] = useState<boolean>(false);
  const [incomingDigitsProposal, setIncomingDigitsProposal] = useState<{ digits: number; proposerName: string } | null>(null);

  // Refs
  const countdownIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Difficulty helper
  const getDifficulty = (cnt: number, dgts: number) => {
    if (cnt === 5 && dgts === 1) return { label: 'Very Easy', baseScore: 100 };
    if (cnt === 5 && dgts === 2) return { label: 'Easy', baseScore: 150 };
    if (cnt === 10 && dgts === 2) return { label: 'Medium', baseScore: 250 };
    if (cnt === 5 && dgts === 3) return { label: 'Medium', baseScore: 250 };
    if (cnt === 10 && dgts === 4) return { label: 'Hard', baseScore: 400 };
    if (cnt === 10 && dgts === 6) return { label: 'Expert', baseScore: 700 };
    // fallback
    return { label: 'Medium', baseScore: 200 };
  };

  // Generate numbers
  const generateNumbers = (cnt: number, dgts: number, matchSeed?: string) => {
    const prng = matchSeed ? seededRandom(matchSeed) : Math.random;
    const nums: number[] = [];
    const min = Math.pow(10, dgts - 1);
    const max = Math.pow(10, dgts) - 1;
    for (let i = 0; i < cnt; i++) {
      const num = Math.floor(prng() * (max - min + 1)) + min;
      nums.push(num);
    }
    return nums;
  };

  // Start the match
  const handleStartGame = (customCount?: number, customDigits?: number) => {
    if (onPlaySoundRef.current) onPlaySoundRef.current('click');
    try {
      const finalCount = customCount ?? numberCount;
      const finalDigits = customDigits ?? digitsPerNumber;

      const matchSeed = seed ? String(seed) : Math.random().toString(36).substring(2, 10);
      const generated = generateNumbers(finalCount, finalDigits, matchSeed);
      const sum = generated.reduce((a, b) => a + b, 0);

      setNumbers(generated);
      setCorrectSum(sum);
      setCurrentNumberIndex(0);
      setRevealResults(false);
      setGameState('MEMORIZE');
    } catch (err) {
      console.error("[MentalMath] Exception starting match:", err);
      setNumbers([12, 34, 56, 78, 90]);
      setCorrectSum(270);
      setCurrentNumberIndex(0);
      setRevealResults(false);
      setGameState('MEMORIZE');
    }
  };

  const handleStartMatch = () => {
    if (onPlaySoundRef.current) onPlaySoundRef.current('click');
    if (room) {
      room.send("player_ready_match", {
        startMatch: true,
        numberCount,
        digitsPerNumber
      });
    }
    handleStartGame();
  };

  // Rotation timer for showing each number for 3 seconds during MEMORIZE phase
  useEffect(() => {
    if (gameState !== 'MEMORIZE') return;

    const interval = setInterval(() => {
      setCurrentNumberIndex(prev => {
        if (prev + 1 >= numbers.length) {
          clearInterval(interval);
          setGameState('ANSWER');
          setTimeRemaining(10);
          startTimeRef.current = Date.now();
          return 0;
        }
        return prev + 1;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [gameState, numbers]);

  // Listen to multiplayer socket events if online
  useEffect(() => {
    if (!room) return;

    // Receive opponent readiness in case host changes setups
    const configListener = room.onMessage("opponent_ready_match", (data: any) => {
      if (data?.numberCount) setNumberCount(data.numberCount);
      if (data?.digitsPerNumber) setDigitsPerNumber(data.digitsPerNumber);
      if (data?.startMatch) {
        handleStartGame(data.numberCount, data.digitsPerNumber);
      }
    });

    const proposedListener = room.onMessage("digits_proposed", (data: { digits: number; proposerName: string }) => {
      setIncomingDigitsProposal({
        digits: data.digits,
        proposerName: data.proposerName
      });
    });

    const respondedListener = room.onMessage("digits_responded", (data: { accepted: boolean; digits: number }) => {
      setIncomingDigitsProposal(null);
      setIsWaitingForDigitsProposal(false);
      setProposedDigits(null);

      const finalDigits = data.accepted ? data.digits : 2;
      setDigitsPerNumber(finalDigits);

      if (isHost) {
        room.send("player_ready_match", {
          startMatch: true,
          numberCount,
          digitsPerNumber: finalDigits
        });
        handleStartGame(numberCount, finalDigits);
      }
    });

    const gameOverListener = room.onMessage("game_over", (data: any) => {
      if (data.scores) {
        setMultiplayerResults(data.scores);
        setMultiplayerWinnerName(data.bothDefeated ? 'BothDefeated' : (data.winnerName || 'Draw'));
        setGameState('RESULTS');
        
        const isWinner = !data.bothDefeated && data.winnerName === userProfile.username;
        if (onPlaySoundRef.current) {
          onPlaySoundRef.current(isWinner ? 'success' : 'fail');
        }
      }
    });

    return () => {
      if (configListener && typeof configListener.clear === 'function') configListener.clear();
      if (proposedListener && typeof proposedListener.clear === 'function') proposedListener.clear();
      if (respondedListener && typeof respondedListener.clear === 'function') respondedListener.clear();
      if (gameOverListener && typeof gameOverListener.clear === 'function') gameOverListener.clear();
    };
  }, [room, isHost, numberCount]);

  const handleAcceptDigits = () => {
    if (onPlaySoundRef.current) onPlaySoundRef.current('click');
    if (room && incomingDigitsProposal) {
      try {
        room.send("respond_digits", {
          accepted: true,
          digits: incomingDigitsProposal.digits
        });
      } catch (err) {
        console.error('[MentalMath] respond_digits accept error:', err);
      }
    }
    setIncomingDigitsProposal(null);
  };

  const handleDeclineDigits = () => {
    if (onPlaySoundRef.current) onPlaySoundRef.current('click');
    if (room && incomingDigitsProposal) {
      try {
        room.send("respond_digits", {
          accepted: false,
          digits: incomingDigitsProposal.digits
        });
      } catch (err) {
        console.error('[MentalMath] respond_digits decline error:', err);
      }
    }
    setIncomingDigitsProposal(null);
  };

  // Handle countdown tick in Answer Phase
  useEffect(() => {
    if (gameState !== 'ANSWER') return;

    countdownIntervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [gameState]);

  // Spend coins/gems to buy extra time
  const handleBuyExtraTime = () => {
    if (extraPurchases >= 2 || timeRemaining <= 0 || gameState !== 'ANSWER') return;
    if (userProfile.coins < 500 || userProfile.gems < 75) {
      if (onPlaySoundRef.current) onPlaySoundRef.current('fail');
      setPurchaseStatus('You need more coins and diamonds!');
      setTimeout(() => setPurchaseStatus(''), 4000);
      return;
    }

    if (onPlaySoundRef.current) onPlaySoundRef.current('correct');
    // Deduct coins & gems
    const updatedProfile = {
      ...userProfile,
      coins: userProfile.coins - 500,
      gems: userProfile.gems - 75
    };
    saveProfile(updatedProfile);

    // Apply +5s
    setTimeRemaining(prev => prev + 5);
    setExtraPurchases(prev => prev + 1);
    setPurchaseStatus('+5 Seconds Added!');
    setTimeout(() => setPurchaseStatus(''), 2000);
  };

  // Submit answer
  const handleSubmitAnswer = () => {
    if (gameState !== 'ANSWER') return;
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    setTimeTaken(elapsed);

    const ansNum = parseInt(playerAnswer.trim(), 10);
    const correct = ansNum === correctSum;
    setIsCorrectAnswer(correct);

    if (onPlaySoundRef.current) {
      onPlaySoundRef.current(correct ? 'correct' : 'fail');
    }

    // Calculate score
    const diff = getDifficulty(numberCount, digitsPerNumber);
    let finalScore = 0;
    
    if (correct) {
      // Speed bonus: start at baseScore, lose points for every second used
      const timePenalty = Math.floor(elapsed * 5);
      finalScore = Math.max(50, diff.baseScore + (numberCount * digitsPerNumber * 10) - timePenalty);
    } else {
      finalScore = 0;
    }

    setGameScore(finalScore);

    if (onProgress) {
      onProgress(correct ? 100 : 0);
    }

    // If multiplayer, wait for the other player to submit
    if (room) {
      const distance = isNaN(ansNum) ? 999999 : Math.abs(ansNum - correctSum);
      room.send("puzzle_solved", {
        score: finalScore,
        correctAnswers: correct ? 1 : 0,
        answer: isNaN(ansNum) ? 0 : ansNum,
        isCorrect: correct,
        distance,
        timeTaken: elapsed
      });
    } else {
      // Solo Mode Game win
      if (correct) {
        if (onPlaySoundRef.current) onPlaySoundRef.current('success');
        if (onGameWin) {
          onGameWin(PuzzleType.MENTAL_MATH, Math.floor(elapsed), finalScore);
        }
      }
      setGameState('RESULTS');
    }
  };

  const handleAutoSubmit = () => {
    handleSubmitAnswer();
  };

  // Trigger setup configuration sync to multiplayer room
  const handleConfigChange = (cnt: number, dgts: number) => {
    if (onPlaySoundRef.current) onPlaySoundRef.current('click');
    if (room && dgts !== 2) {
      setIsWaitingForDigitsProposal(true);
      setProposedDigits(dgts);
      try {
        room.send("propose_digits", {
          digits: dgts,
          proposerName: userProfile.username
        });
      } catch (err) {
        console.error('[MentalMath] propose_digits error:', err);
      }
      return;
    }

    setNumberCount(cnt);
    setDigitsPerNumber(dgts);
    if (room) {
      room.send("player_ready_match", {
        numberCount: cnt,
        digitsPerNumber: dgts
      });
    }
  };

  // Input numeric pad handlers
  const handleKeypadPress = (val: string) => {
    if (onPlaySoundRef.current) onPlaySoundRef.current('click');
    if (val === 'BACK') {
      setPlayerAnswer(prev => prev.slice(0, -1));
    } else if (val === 'CLEAR') {
      setPlayerAnswer('');
    } else {
      if (playerAnswer.length < 10) {
        setPlayerAnswer(prev => prev + val);
      }
    }
  };

  // Listen to physical keyboard events during Answer Phase
  useEffect(() => {
    if (gameState !== 'ANSWER') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        if (playerAnswer.length < 10) {
          setPlayerAnswer(prev => prev + e.key);
        }
      } else if (e.key === 'Backspace') {
        setPlayerAnswer(prev => prev.slice(0, -1));
      } else if (e.key === 'Enter') {
        handleSubmitAnswer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, playerAnswer, numberCount, digitsPerNumber]);

  return (
    <div className="glass-panel text-center" style={{
      width: '100%',
      maxWidth: '650px',
      margin: 'auto',
      padding: '28px',
      borderRadius: '24px',
      background: 'var(--bg-glass)',
      border: '1px solid var(--border-glass)',
      fontFamily: "'Outfit', sans-serif",
      color: 'var(--text-primary)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🧠 {t('mental_math_name')}
          {headerActions}
        </h3>

      </div>

      {/* SETUP PHASE SCREEN */}
      {gameState === 'SETUP' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            {t('mental_math_desc')}
          </p>

          {/* Number Count Selection */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)', textAlign: 'left' }}>
              🔢 NUMBER COUNT:
            </span>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[5, 10].map(cnt => (
                <button
                  key={cnt}
                  disabled={room && !isHost}
                  onClick={() => handleConfigChange(cnt, digitsPerNumber)}
                  className={`btn ${numberCount === cnt ? 'btn-primary' : 'btn-glass'}`}
                  style={{ flex: 1, padding: '12px', opacity: (room && !isHost && numberCount !== cnt) ? 0.5 : 1 }}
                >
                  {cnt} Numbers {cnt === 5 ? '(Default)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Digits selection */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)', textAlign: 'left' }}>
              🔢 DIGITS PER NUMBER:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
              {[1, 2, 3, 4, 6].map(dgts => (
                <button
                  key={dgts}
                  disabled={room && !isHost}
                  onClick={() => handleConfigChange(numberCount, dgts)}
                  className={`btn ${digitsPerNumber === dgts ? 'btn-primary' : 'btn-glass'}`}
                  style={{ padding: '12px 4px', fontSize: '14px', opacity: (room && !isHost && digitsPerNumber !== dgts) ? 0.5 : 1 }}
                >
                  {dgts} Digit{dgts > 1 ? 's' : ''} {dgts === 2 ? '★' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Display time */}
          <div style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>⏱️ Display Time:</span>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-primary)' }}>3 Seconds (Fixed)</span>
          </div>

          {/* Start Game Action / Multiplayer readiness status */}
          {room ? (
            isHost ? (
              <button
                onClick={handleStartMatch}
                className="btn btn-primary"
                style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(to right, #8b5cf6, #d946ef)' }}
              >
                <PlayCircle size={20} />
                Start Match
              </button>
            ) : (
              <div style={{
                width: '100%',
                padding: '16px',
                borderRadius: '16px',
                background: 'rgba(139, 92, 246, 0.05)',
                border: '1px solid rgba(139, 92, 246, 0.15)',
                fontSize: '14px',
                color: 'var(--color-primary)',
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                Waiting for host to select modes and start match...
              </div>
            )
          ) : (
            <button
              onClick={() => handleStartGame()}
              className="btn btn-primary"
              style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(to right, #8b5cf6, #d946ef)' }}
            >
              <PlayCircle size={20} />
              Start Challenge
            </button>
          )}
        </div>
      )}

      {/* MEMORIZE PHASE SCREEN */}
      {gameState === 'MEMORIZE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'center', padding: '20px 0' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: 'bold', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Memorize these numbers!
          </p>

          {/* Active number displayed */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '160px',
            width: '100%',
            maxWidth: '400px',
            padding: '24px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>
              Number {currentNumberIndex + 1} of {numbers.length}
            </span>
            <div
              key={currentNumberIndex}
              style={{
                fontSize: digitsPerNumber >= 6 ? '48px' : '64px',
                fontWeight: '900',
                color: 'var(--text-primary)',
                animation: 'pulseScale 0.3s ease'
              }}
            >
              {numbers[currentNumberIndex]}
            </div>
          </div>

          {/* Micro 3s progress loading countdown, keyed to reset every time index advances */}
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
            <div key={currentNumberIndex} style={{
              width: '100%',
              height: '100%',
              background: '#8B4513',
              animation: 'shrinkWidth 3s linear forwards'
            }} />
          </div>
        </div>
      )}

      {/* ANSWER PHASE SCREEN */}
      {gameState === 'ANSWER' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
          {/* Countdown & Title */}
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
              SUM THE NUMBERS:
            </span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: timeRemaining <= 3 ? 'var(--color-danger)' : 'var(--color-success)',
              fontWeight: 'bold',
              fontSize: '15px'
            }}>
              <Clock size={16} />
              <span>Time Remaining: <span style={{ fontSize: '20px', fontWeight: '900' }}>{timeRemaining}</span></span>
            </div>
          </div>

          {/* Big Input Screen */}
          <div style={{ width: '100%', position: 'relative' }}>
            <input
              type="text"
              readOnly
              value={playerAnswer}
              placeholder="Enter your sum..."
              style={{
                width: '100%',
                padding: '16px 20px',
                fontSize: '28px',
                fontWeight: '800',
                borderRadius: '16px',
                textAlign: 'center',
                background: 'rgba(0, 0, 0, 0.2)',
                border: '2px solid var(--border-glass)',
                color: '#ffffff',
                outline: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
              }}
            />
          </div>

          {/* Touch keypad layout (premium touch grid) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            width: '100%',
            maxWidth: '320px',
            marginTop: '8px'
          }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLEAR', '0', 'BACK'].map(btnVal => {
              const isSpecial = btnVal === 'CLEAR' || btnVal === 'BACK';
              return (
                <button
                  key={btnVal}
                  type="button"
                  onClick={() => handleKeypadPress(btnVal)}
                  className={`btn ${isSpecial ? 'btn-glass' : 'btn-primary'}`}
                  style={{
                    padding: '16px 4px',
                    fontSize: isSpecial ? '12px' : '18px',
                    fontWeight: 'bold',
                    background: isSpecial ? '#5c3a21' : '#8B4513',
                    borderColor: isSpecial ? '#3d2514' : '#70350d',
                    color: '#ffffff',
                    borderRadius: '12px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                  }}
                >
                  {btnVal}
                </button>
              );
            })}
          </div>

          {/* Action Submit */}
          <button
            onClick={handleSubmitAnswer}
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 'bold', marginTop: '4px' }}
          >
            Submit Answer
          </button>

          {/* Extra time buying section */}
          <div style={{
            width: '100%',
            padding: '16px',
            borderRadius: '16px',
            background: 'rgba(139, 92, 246, 0.05)',
            border: '1px solid rgba(139, 92, 246, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'center',
            marginTop: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                Need More Time?
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Purchases: {extraPurchases} / 2
              </span>
            </div>

            <button
              onClick={handleBuyExtraTime}
              disabled={extraPurchases >= 2}
              className="btn btn-glass"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                fontSize: '13px',
                color: extraPurchases >= 2 ? 'var(--text-muted)' : 'var(--color-primary)',
                borderColor: extraPurchases >= 2 ? 'rgba(255,255,255,0.05)' : 'rgba(139, 92, 246, 0.4)',
                background: extraPurchases >= 2 ? 'rgba(0,0,0,0.1)' : 'rgba(139, 92, 246, 0.1)'
              }}
            >
              <Plus size={14} />
              +5 Seconds (Costs: 500 🪙 + 75 💎)
            </button>

            {purchaseStatus && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
                color: purchaseStatus.includes('Added') ? 'var(--color-success)' : 'var(--color-danger)',
                marginTop: '4px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: purchaseStatus.includes('Added') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.15)',
                border: purchaseStatus.includes('Added') ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
              }}>
                {!purchaseStatus.includes('Added') && <AlertTriangle size={14} />}
                <span>{purchaseStatus}</span>
              </div>
            )}

            {extraPurchases >= 2 && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                Maximum Extra Time Reached
              </span>
            )}
          </div>
        </div>
      )}

      {/* RESULTS PHASE SCREEN */}
      {gameState === 'RESULTS' && (
        room && !revealResults ? (
          /* INTERMEDIATE COMPARISON SCREEN BEFORE VICTORY/DEFEAT */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', width: '100%' }}>
            <div style={{
              width: '100%',
              padding: '16px',
              borderRadius: '16px',
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              fontSize: '18px',
              fontWeight: '900',
              color: 'var(--color-primary)',
              textAlign: 'center'
            }}>
              ⚔️ ROUND COMPLETED! Compare your answers:
            </div>

            {/* Target Numbers & Correct Answer Card */}
            <div style={{
              width: '100%',
              background: 'rgba(0,0,0,0.15)',
              border: '1px solid var(--border-glass)',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Numbers Displayed:</span>
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{numbers.join(', ')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Correct Answer (Sum):</span>
                <span style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--color-success)' }}>{correctSum}</span>
              </div>
            </div>

            {/* Side-by-side or stacked answers comparison card */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {multiplayerResults?.map(entry => {
                const isMe = entry.userId === userProfile.id;
                return (
                  <div key={entry.userId} style={{
                    width: '100%',
                    background: isMe ? 'rgba(139, 92, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: isMe ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid var(--border-glass)',
                    borderRadius: '16px',
                    padding: '16px',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '14px', color: isMe ? 'var(--color-primary)' : '#ffffff' }}>
                        👤 {isMe ? 'You' : (entry.username || 'Opponent')}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 'bold',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: entry.isCorrect ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: entry.isCorrect ? 'var(--color-success)' : 'var(--color-danger)'
                      }}>
                        {entry.isCorrect ? 'CORRECT' : 'INCORRECT'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Submitted Answer:</span>
                      <span style={{ fontWeight: 'bold', color: entry.isCorrect ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {entry.submittedAnswer ?? 'None'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Time Taken:</span>
                      <span style={{ fontWeight: 'bold' }}>
                        {entry.timeTaken ? `${parseFloat(entry.timeTaken).toFixed(1)}s` : 'N/A'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action button to reveal winner */}
            <button
              onClick={() => {
                if (onPlaySoundRef.current) onPlaySoundRef.current('click');
                setRevealResults(true);
              }}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '16px',
                fontWeight: 'bold',
                marginTop: '10px',
                background: 'linear-gradient(to right, #8b5cf6, #d946ef)'
              }}
            >
              Reveal Match Result 🏆
            </button>
          </div>
        ) : (
          /* FINAL RESULTS WINNER/LOSER SCREEN */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', width: '100%' }}>
            {/* Winner Title or Status Banner */}
            {room ? (
              <div style={{
                width: '100%',
                padding: '16px',
                borderRadius: '16px',
                background: multiplayerWinnerName === userProfile.username ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: multiplayerWinnerName === userProfile.username ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                fontSize: '18px',
                fontWeight: '900',
                color: multiplayerWinnerName === userProfile.username ? 'var(--color-success)' : 'var(--color-danger)',
                textAlign: 'center'
              }}>
                {multiplayerWinnerName === userProfile.username
                  ? '🏆 YOU WIN THE MATH DUEL!'
                  : multiplayerWinnerName === 'BothDefeated'
                    ? '🤯 BOTH PLAYERS ANSWERED INCORRECTLY!'
                    : (multiplayerWinnerName === 'Draw' ? '🤝 MATCH ENDED IN A DRAW!' : `💀 OPPONENT WON THE MATCH!`)}
              </div>
            ) : (
              <div style={{
                width: '100%',
                padding: '16px',
                borderRadius: '16px',
                background: isCorrectAnswer ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: isCorrectAnswer ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                fontSize: '18px',
                fontWeight: '900',
                color: isCorrectAnswer ? 'var(--color-success)' : 'var(--color-danger)',
                textAlign: 'center'
              }}>
                {isCorrectAnswer ? '🎉 CORRECT SUM TOTAL!' : '❌ INCORRECT ANSWER'}
              </div>
            )}

            {/* Summary table */}
            <div style={{
              width: '100%',
              background: 'rgba(0,0,0,0.15)',
              border: '1px solid var(--border-glass)',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Numbers Displayed:</span>
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{numbers.join(', ')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Correct Answer:</span>
                <span style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--color-success)' }}>{correctSum}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Your Answer:</span>
                <span style={{ fontWeight: 'bold', fontSize: '15px', color: isCorrectAnswer ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  {playerAnswer || 'None'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Time Taken:</span>
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{timeTaken.toFixed(1)}s</span>
              </div>
              {!room && (
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Score Earned:</span>
                  <span style={{ fontWeight: 'black', fontSize: '16px', color: 'var(--color-secondary)' }}>
                    +{gameScore} PTS
                  </span>
                </div>
              )}
            </div>

            {/* Multiplayer details comparisons */}
            {room && multiplayerResults && (
              <div style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-glass)',
                borderRadius: '16px',
                padding: '16px',
                textAlign: 'left'
              }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  DUEL STATS COMPARISON:
                </span>
                {multiplayerResults.map(entry => {
                  const isMe = entry.userId === userProfile.id;
                  return (
                    <div key={entry.userId} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: isMe ? 'rgba(139,92,246,0.1)' : 'rgba(0,0,0,0.1)'
                    }}>
                      <div>
                        <span style={{ fontWeight: 'bold', fontSize: '13px', color: isMe ? 'var(--color-primary)' : 'var(--text-primary)' }}>
                          {isMe ? 'You' : (entry.username || 'Opponent')}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                          Answer: {entry.submittedAnswer ?? 'None'} ({entry.isCorrect ? 'Correct' : 'Incorrect'})
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '13px' }}>
                          {entry.score} PTS
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                          Time: {entry.timeTaken ? `${parseFloat(entry.timeTaken).toFixed(1)}s` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Continue button */}
            <button
              onClick={() => {
                if (onPlaySoundRef.current) onPlaySoundRef.current('click');
                if (onClose) onClose(false);
              }}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 'bold', marginTop: '10px' }}
            >
              Continue
            </button>
          </div>
        )
      )}

      {/* Styled animation keyframes injection */}
      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
        @keyframes pulseScale {
          0% { transform: scale(0.85); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* HOST WAITING OVERLAY FOR DIGIT SELECTION PROPOSAL */}
      {isWaitingForDigitsProposal && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(8, 5, 18, 0.94)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          zIndex: 80,
          padding: '24px',
          animation: 'fadeIn 0.25s ease-in-out'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              padding: '12px',
              borderRadius: '50%',
              background: 'rgba(139, 92, 246, 0.2)',
              border: '2px solid #8b5cf6',
              marginBottom: '8px',
              boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)'
            }}>
              <PlayCircle size={32} color="#a78bfa" className="animate-spin" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'var(--font-display)' }}>
              Digit Selection Proposed!
            </h3>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', marginTop: '4px' }}>
              Waiting for opponent to accept or decline playing with <strong>{proposedDigits} Digits</strong>...
            </p>
          </div>
        </div>
      )}

      {/* GUEST INCOMING PROPOSAL MODAL */}
      {incomingDigitsProposal && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(8, 5, 18, 0.96)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          zIndex: 80,
          padding: '24px',
          animation: 'fadeIn 0.25s ease-in-out'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              padding: '12px',
              borderRadius: '50%',
              background: 'rgba(236, 72, 153, 0.2)',
              border: '2px solid #ec4899',
              marginBottom: '8px',
              boxShadow: '0 0 20px rgba(236, 72, 153, 0.5)'
            }}>
              <HelpCircle size={32} color="#ec4899" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'var(--font-display)' }}>
              Digit Selection Proposal
            </h3>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', marginTop: '6px' }}>
              Opponent <strong>{incomingDigitsProposal.proposerName}</strong> wants to play <strong>{incomingDigitsProposal.digits} Digits</strong>.
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Declining will start the match immediately using the default 2 Digits ★.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '320px', marginTop: '8px' }}>
            <button
              className="btn btn-primary"
              onClick={handleAcceptDigits}
              style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Check size={16} /> ACCEPT
            </button>
            <button
              className="btn btn-glass"
              onClick={handleDeclineDigits}
              style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: 'bold', color: '#ef4444', borderColor: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <X size={16} /> DECLINE
            </button>
          </div>
        </div>
      )}

      {!(room || isOnline) && onClose && gameState !== 'RESULTS' && (
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
