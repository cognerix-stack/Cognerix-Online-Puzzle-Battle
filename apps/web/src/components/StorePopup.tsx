import React, { useState, useEffect, useRef } from 'react';
import { Coins, Gem, X, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { translate } from '../utils/translations';

interface PackItem {
  id: string;
  price: string;
  oldAmount: number;
  newAmount: number;
  badge: string;
  secondaryBadge?: string;
}

const COIN_PACKS: PackItem[] = [
  { id: 'coins_pack_1', price: '$1', oldAmount: 1750, newAmount: 2500, badge: '+43% FREE' },
  { id: 'coins_pack_5', price: '$5', oldAmount: 10000, newAmount: 15000, badge: '+50% FREE' },
  { id: 'coins_pack_10', price: '$10', oldAmount: 25000, newAmount: 35000, badge: '+40% FREE' },
  { id: 'coins_pack_15', price: '$15', oldAmount: 45000, newAmount: 65000, badge: '+44% FREE' },
  { id: 'coins_pack_25', price: '$25', oldAmount: 90000, newAmount: 125000, badge: '⭐ BEST VALUE', secondaryBadge: '+39% FREE' }
];

const GEM_PACKS: PackItem[] = [
  { id: 'gems_pack_1', price: '$1', oldAmount: 75, newAmount: 100, badge: '+33% FREE' },
  { id: 'gems_pack_5', price: '$5', oldAmount: 350, newAmount: 500, badge: '+43% FREE' },
  { id: 'gems_pack_10', price: '$10', oldAmount: 800, newAmount: 1100, badge: '🔥 POPULAR', secondaryBadge: '+38% FREE' },
  { id: 'gems_pack_15', price: '$15', oldAmount: 1250, newAmount: 1700, badge: '+36% FREE' },
  { id: 'gems_pack_25', price: '$25', oldAmount: 2200, newAmount: 3000, badge: '⭐ BEST VALUE', secondaryBadge: '+36% FREE' }
];

interface StorePopupProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'coins' | 'gems';
  userProfile: any;
  onPurchaseSuccess: (type: 'coins' | 'gems', amount: number) => void;
  onPlaySound?: (type: 'click' | 'success' | 'fail') => void;
  isLightMode?: boolean;
}

const ConfettiCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const updateSize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#a855f7'];
    const particles = Array.from({ length: 80 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height - 20,
      r: Math.random() * 5 + 3,
      d: Math.random() * canvas.height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.05 + 0.02,
      tiltAngle: Math.random() * Math.PI
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, idx) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2.2;
        p.x += Math.sin(p.tiltAngle) * 0.8;
        p.tilt = Math.sin(p.tiltAngle - idx / 3) * 12;

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();

        if (p.y > canvas.height) {
          particles[idx] = {
            x: Math.random() * canvas.width,
            y: -20,
            r: p.r,
            d: p.d,
            color: p.color,
            tilt: p.tilt,
            tiltAngleIncremental: p.tiltAngleIncremental,
            tiltAngle: p.tiltAngle
          };
        }
      });
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10, borderRadius: '24px' }} />;
};

export const StorePopup: React.FC<StorePopupProps> = ({
  isOpen, onClose, initialTab = 'coins', userProfile, onPurchaseSuccess, onPlaySound, isLightMode = false
}) => {
  const { language } = useGame();
  const t = (key: string) => translate(key, language);
  const [activeTab, setActiveTab] = useState<'coins' | 'gems'>(initialTab);
  const [billingState, setBillingState] = useState<'idle' | 'play_sheet' | 'processing' | 'success' | 'failed' | 'pending'>('idle');
  const [selectedPack, setSelectedPack] = useState<{ pack: PackItem; type: 'coins' | 'gems' } | null>(null);
  const [mockOutcome, setMockOutcome] = useState<'success' | 'failed' | 'pending'>('success');
  const [isClosing, setIsClosing] = useState<boolean>(false);

  // Sound triggers
  const playClick = () => onPlaySound?.('click');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setBillingState('idle');
      setSelectedPack(null);
      setIsClosing(false);
    }
  }, [isOpen, initialTab]);

  const handleClose = () => {
    playClick();
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 250);
  };

  const startPurchase = (pack: PackItem, type: 'coins' | 'gems') => {
    playClick();
    setSelectedPack({ pack, type });
    setBillingState('play_sheet');
  };

  const confirmBillingPurchase = () => {
    playClick();
    setBillingState('processing');
    
    // Simulate API communication delay
    setTimeout(() => {
      if (mockOutcome === 'success') {
        setBillingState('success');
        onPlaySound?.('success');
        if (selectedPack) {
          onPurchaseSuccess(selectedPack.type, selectedPack.pack.newAmount);
        }
      } else if (mockOutcome === 'failed') {
        setBillingState('failed');
        onPlaySound?.('fail');
      } else {
        setBillingState('pending');
      }
    }, 2000);
  };

  if (!isOpen) return null;

  const packs = activeTab === 'coins' ? COIN_PACKS : GEM_PACKS;

  // Theme variable configurations
  const themeBg = isLightMode 
    ? 'linear-gradient(145deg, #ffffff 0%, #f9fafb 100%)' 
    : 'linear-gradient(145deg, rgba(23, 14, 45, 0.95) 0%, rgba(8, 4, 20, 0.98) 100%)';
    
  const themeBorder = isLightMode 
    ? '1px solid rgba(0, 0, 0, 0.08)' 
    : '1px solid rgba(139, 92, 246, 0.3)';
    
  const themeBoxShadow = isLightMode
    ? '0 20px 50px rgba(0, 0, 0, 0.08), 0 0 20px rgba(0, 0, 0, 0.02)'
    : '0 20px 50px rgba(139, 92, 246, 0.15), 0 0 40px rgba(6, 182, 212, 0.05)';

  const themeTextColor = isLightMode ? '#1f2937' : '#ffffff';
  const themeSubColor = isLightMode ? 'rgba(0, 0, 0, 0.65)' : 'rgba(255, 255, 255, 0.7)';
  
  const cardBg = isLightMode ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)';
  const cardBorder = isLightMode ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.06)';
  const cardText = isLightMode ? '#111827' : '#ffffff';
  const cardTextMuted = isLightMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.4)';
  
  const footerColor = isLightMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.4)';
  
  // Close Button Explicit Theme Styling
  const closeButtonBg = isLightMode ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.1)';
  const closeButtonHoverBg = isLightMode ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.2)';
  const closeIconColor = isLightMode ? '#1f2937' : '#ffffff';
  
  const toggleTabsBg = isLightMode ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.03)';
  const toggleTabsBorder = isLightMode ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: 'calc(var(--safe-top, 0px) + 4px)',
      paddingBottom: '12px',
      overflowY: 'auto',
      zIndex: 2000,
      opacity: isClosing ? 0 : 1,
      transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* 🏬 MAIN WINDOW */}
      <div style={{
        position: 'relative',
        width: '90%',
        maxWidth: '750px',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: themeBg,
        border: themeBorder,
        boxShadow: themeBoxShadow,
        borderRadius: '24px',
        padding: '16px',
        color: themeTextColor,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transform: isClosing ? 'scale(0.92)' : 'scale(1)',
        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Glow Spheres */}
        {!isLightMode && (
          <>
            <div style={{ position: 'absolute', top: '-150px', left: '-150px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.15)', filter: 'blur(80px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-150px', right: '-150px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.15)', filter: 'blur(80px)', pointerEvents: 'none' }} />
          </>
        )}

        {/* Close Button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: closeButtonBg,
            border: `1px solid ${isLightMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)'}`,
            borderRadius: '50%',
            color: closeIconColor,
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 100,
            transition: 'all 0.2s',
            outline: 'none',
            padding: 0
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = closeButtonHoverBg; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = closeButtonBg; }}
        >
          <X size={18} color={closeIconColor} style={{ display: 'block' }} />
        </button>

        {/* Header Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 10 }}>
          <div style={{ display: 'flex', background: toggleTabsBg, border: toggleTabsBorder, borderRadius: '14px', padding: '4px' }}>
            <button
              onClick={() => { playClick(); setActiveTab('coins'); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '11px',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                background: activeTab === 'coins' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
                color: activeTab === 'coins' ? '#fff' : (isLightMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)'),
                boxShadow: activeTab === 'coins' ? '0 4px 15px rgba(245, 158, 11, 0.4)' : 'none',
                transition: 'all 0.3s'
              }}
            >
              <Coins size={16} /> {t('buy_coins')}
            </button>
            <button
              onClick={() => { playClick(); setActiveTab('gems'); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '11px',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                background: activeTab === 'gems' ? 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' : 'transparent',
                color: activeTab === 'gems' ? '#fff' : (isLightMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)'),
                boxShadow: activeTab === 'gems' ? '0 4px 15px rgba(6, 182, 212, 0.4)' : 'none',
                transition: 'all 0.3s'
              }}
            >
              <Gem size={16} /> {t('buy_gems')}
            </button>
          </div>
        </div>

        {/* Promo Title Banner */}
        <div style={{
          background: activeTab === 'coins' ? 'rgba(245,158,11,0.06)' : 'rgba(6,182,212,0.06)',
          border: `1px solid ${activeTab === 'coins' ? 'rgba(245,158,11,0.2)' : 'rgba(6,182,212,0.2)'}`,
          padding: '10px 14px',
          borderRadius: '14px',
          zIndex: 10
        }}>
          <h4 style={{ color: activeTab === 'coins' ? '#f59e0b' : '#06b6d4', fontWeight: 'bold', fontSize: '15px' }}>
            {activeTab === 'coins' ? t('launch_bonus_title') : t('launch_offer_title')}
          </h4>
          <p style={{ fontSize: '12px', color: themeSubColor, marginTop: '4px' }}>
            {activeTab === 'coins' ? t('launch_bonus_desc') : t('launch_offer_desc')}
          </p>
        </div>

        {/* Grid List */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
          gap: '8px',
          padding: '16px 8px 12px 8px',
          zIndex: 10
        }}>
          {packs.map(pack => (
            <div
              key={pack.id}
              className="store-card"
              style={{
                position: 'relative',
                background: cardBg,
                border: cardBorder,
                borderRadius: '16px',
                padding: '12px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                textAlign: 'center',
                transition: 'all 0.25s ease'
              }}
            >
              {/* Badges */}
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '4px',
                background: pack.badge.includes('BEST') ? 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)' : (activeTab === 'coins' ? '#f59e0b' : '#06b6d4'),
                color: '#fff',
                fontSize: '9px',
                fontWeight: 'bold',
                padding: '3px 8px',
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                whiteSpace: 'nowrap'
              }}>
                {pack.badge.includes('BEST') 
                  ? `⭐ ${t('best_value')}` 
                  : pack.badge.includes('POPULAR')
                    ? `🔥 ${t('popular')}`
                    : pack.badge.replace('FREE', t('free_suffix'))}
              </div>

              {pack.secondaryBadge && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '-6px',
                  background: '#10b981',
                  color: '#fff',
                  fontSize: '8px',
                  fontWeight: 'bold',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                  transform: 'rotate(-5deg)'
                }}>
                  {pack.secondaryBadge.replace('FREE', t('free_suffix'))}
                </div>
              )}

              {/* Graphic Icon */}
              <div style={{ marginTop: '10px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {activeTab === 'coins' ? (
                  <Coins size={38} color="#f59e0b" style={{ filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.3))' }} />
                ) : (
                  <Gem size={38} color="#06b6d4" style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.3))' }} />
                )}
              </div>

              {/* Quantities */}
              <div>
                <span style={{ fontSize: '11px', color: cardTextMuted, textDecoration: 'line-through' }}>
                  {pack.oldAmount.toLocaleString()}
                </span>
                <h4 style={{ fontSize: '16px', fontWeight: '900', color: cardText, marginTop: '2px' }}>
                  {pack.newAmount.toLocaleString()}
                </h4>
                <p style={{ fontSize: '10px', color: cardTextMuted }}>
                  {activeTab === 'coins' ? t('coins_label') : t('gems_label')}
                </p>
              </div>

              {/* Purchase Button */}
              <button
                onClick={() => startPurchase(pack, activeTab)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'coins' ? 'rgba(245,158,11,0.08)' : 'rgba(6,182,212,0.08)',
                  color: activeTab === 'coins' ? '#f59e0b' : '#06b6d4',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: activeTab === 'coins' ? 'rgba(245,158,11,0.2)' : 'rgba(6,182,212,0.2)',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = activeTab === 'coins' ? '#f59e0b' : '#06b6d4';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.boxShadow = `0 4px 10px ${activeTab === 'coins' ? 'rgba(245,158,11,0.3)' : 'rgba(6,182,212,0.3)'}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = activeTab === 'coins' ? 'rgba(245,158,11,0.08)' : 'rgba(6,182,212,0.08)';
                  e.currentTarget.style.color = activeTab === 'coins' ? '#f59e0b' : '#06b6d4';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {pack.price}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderTop: isLightMode ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)',
          paddingTop: '16px',
          marginTop: '10px',
          fontSize: '11px',
          color: footerColor,
          zIndex: 10
        }}>
          <span>{t('secure_payment_desc')}</span>
        </div>

        {/* Custom CSS classes for glow effects */}
        <style dangerouslySetInnerHTML={{ __html: `
          .store-card:hover {
            transform: translateY(-5px);
            background: ${isLightMode ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)'} !important;
            border-color: ${activeTab === 'coins' ? 'rgba(245,158,11,0.4)' : 'rgba(6,182,212,0.4)'} !important;
            box-shadow: 0 10px 20px ${activeTab === 'coins' ? 'rgba(245,158,11,0.1)' : 'rgba(6,182,212,0.1)'} !important;
          }
        ` }} />
      </div>

      {/* 🚀 MOCK GOOGLE PLAY BILLING BOTTOM SHEET PANEL */}
      {billingState === 'play_sheet' && selectedPack && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          zIndex: 2100,
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '550px',
            background: '#ffffff',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            padding: '24px',
            color: '#1f1f1f',
            boxShadow: '0 -10px 30px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'slideUp 0.3s cubic-bezier(0.1, 0.9, 0.2, 1)'
          }}>
            {/* Mock outcomes tester bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f1f3f4',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '11px',
              color: '#5f6368',
              border: '1px dashed #dadce0'
            }}>
              <span>🧪 Reviewer Test Outcome:</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setMockOutcome('success')}
                  style={{
                    padding: '3px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                    background: mockOutcome === 'success' ? '#10b981' : '#e0e0e0',
                    color: mockOutcome === 'success' ? '#fff' : '#1f1f1f'
                  }}
                >
                  Success
                </button>
                <button
                  onClick={() => setMockOutcome('failed')}
                  style={{
                    padding: '3px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                    background: mockOutcome === 'failed' ? '#ef4444' : '#e0e0e0',
                    color: mockOutcome === 'failed' ? '#fff' : '#1f1f1f'
                  }}
                >
                  Failed
                </button>
                <button
                  onClick={() => setMockOutcome('pending')}
                  style={{
                    padding: '3px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                    background: mockOutcome === 'pending' ? '#f59e0b' : '#e0e0e0',
                    color: mockOutcome === 'pending' ? '#fff' : '#1f1f1f'
                  }}
                >
                  Pending
                </button>
              </div>
            </div>

            {/* Google Play header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <svg viewBox="0 0 48 48" width="28" height="28" style={{ marginRight: '8px' }}>
                  <path d="M10 5.17A3.33 3.33 0 0 0 8.33 8v32A3.33 3.33 0 0 0 10 42.83L27.67 24Z" fill="#00E676" />
                  <path d="M36.14 19.14 27.67 24l8.47 4.86a3.3 3.3 0 0 0 1.63-2.86 3.3 3.3 0 0 0-1.63-2.86Z" fill="#FF1744" />
                  <path d="M10 5.17 27.67 24l8.47-4.86-25-14.4A3.33 3.33 0 0 0 10 5.17Z" fill="#FFEA00" />
                  <path d="M10 42.83A3.33 3.33 0 0 0 11.14 43.1a3.33 3.33 0 0 0 2-1.27l25-14.4-10.47-3.43Z" fill="#00B0FF" />
                </svg>
                <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#5f6368' }}>Google Play</span>
              </div>
              <button
                onClick={() => { playClick(); setBillingState('idle'); }}
                style={{ background: 'transparent', border: 'none', color: '#5f6368', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Item detail */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #dadce0', paddingBottom: '16px' }}>
              <div>
                <h4 style={{ fontWeight: 'bold', fontSize: '16px', color: '#202124' }}>
                  {selectedPack.pack.newAmount.toLocaleString()} {selectedPack.type === 'coins' ? t('coins_label') : t('gems_label')} Launch Pack
                </h4>
                <p style={{ fontSize: '12px', color: '#5f6368', marginTop: '2px' }}>Cognerix • Puzzle Battle</p>
                <p style={{ fontSize: '11px', color: '#80868b', marginTop: '6px' }}>👤 {userProfile.username} ({userProfile.id})</p>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#202124' }}>
                {selectedPack.pack.price}.00
              </h3>
            </div>

            {/* Payment method */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#e8f0fe', color: '#1a73e8', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' }}>VISA</span>
                <span style={{ color: '#202124' }}>{t('google_play')} {t('balance') || 'Balance'} (•••• 4646)</span>
              </div>
              <span style={{ color: '#80868b' }}>➔</span>
            </div>

            {/* Play info text */}
            <p style={{ fontSize: '11px', color: '#5f6368', lineHeight: '1.4' }}>
              {t('google_play_terms_info')}
            </p>

            {/* Green Action Button */}
            <button
              onClick={confirmBillingPurchase}
              style={{
                background: '#00875a',
                color: '#ffffff',
                border: 'none',
                padding: '14px',
                borderRadius: '100px',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'center',
                boxShadow: '0 2px 4px rgba(0, 135, 90, 0.2)',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#00704a'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#00875a'}
            >
              {t('tap_to_buy')}
            </button>
          </div>
        </div>
      )}

      {/* ⏳ SPINNER OVERLAY FOR PROCESSING STATE */}
      {billingState === 'processing' && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: isLightMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          zIndex: 2200,
          borderRadius: '24px',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div className="processing-spinner" style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(139, 92, 246, 0.2)',
            borderTopColor: '#8b5cf6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <h4 style={{ fontWeight: 'bold', color: themeTextColor, fontSize: '16px' }}>{t('processing_payment')}</h4>
          <p style={{ fontSize: '12px', color: themeSubColor }}>{t('google_play_connecting')}</p>
        </div>
      )}

      {/* ✅ SUCCESS DIALOG OVERLAY */}
      {billingState === 'success' && selectedPack && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: isLightMode ? 'rgba(255, 255, 255, 0.98)' : 'rgba(10, 5, 25, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          zIndex: 2300,
          borderRadius: '24px',
          padding: '24px',
          textAlign: 'center',
          animation: 'fadeIn 0.2s ease'
        }}>
          <ConfettiCanvas />
          <CheckCircle size={64} color="#10b981" style={{ filter: 'drop-shadow(0 0 15px rgba(16,185,129,0.4))', zIndex: 20 }} />
          <h2 style={{ fontSize: '24px', fontWeight: '900', color: themeTextColor, zIndex: 20 }}>{t('purchase_success')}!</h2>
          <p style={{ fontSize: '14px', color: themeSubColor, zIndex: 20 }}>{t('received_label')}</p>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
            border: isLightMode ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)',
            padding: '14px 30px',
            borderRadius: '20px',
            zIndex: 20
          }}>
            {selectedPack.type === 'coins' ? (
              <Coins size={36} color="#f59e0b" />
            ) : (
              <Gem size={36} color="#06b6d4" />
            )}
            <span style={{ fontSize: '28px', fontWeight: '950', fontFamily: 'var(--font-display)', color: themeTextColor }}>
              +{selectedPack.pack.newAmount.toLocaleString()}
            </span>
          </div>

          <button
            onClick={() => { playClick(); setBillingState('idle'); setSelectedPack(null); }}
            style={{
              padding: '12px 40px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(139,92,246,0.4)',
              zIndex: 20,
              transition: 'all 0.2s'
            }}
          >
            {t('continue_label')}
          </button>
        </div>
      )}

      {/* ❌ FAILED DIALOG OVERLAY */}
      {billingState === 'failed' && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: isLightMode ? 'rgba(255, 255, 255, 0.98)' : 'rgba(10, 5, 25, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          zIndex: 2300,
          borderRadius: '24px',
          padding: '24px',
          textAlign: 'center',
          animation: 'fadeIn 0.2s ease'
        }}>
          <AlertTriangle size={64} color="#ef4444" style={{ filter: 'drop-shadow(0 0 15px rgba(239,68,68,0.4))' }} />
          <h2 style={{ fontSize: '22px', fontWeight: '900', color: themeTextColor }}>{t('purchase_failed')}</h2>
          <p style={{ fontSize: '14px', color: themeSubColor, maxWidth: '300px' }}>
            {t('purchase_failed_desc')}
          </p>

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button
              onClick={() => { playClick(); setBillingState('play_sheet'); }}
              style={{
                padding: '12px 30px',
                borderRadius: '12px',
                border: 'none',
                background: '#ef4444',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(239,68,68,0.3)',
                transition: 'all 0.2s'
              }}
            >
              {t('try_again')}
            </button>
            <button
              onClick={() => { playClick(); setBillingState('idle'); setSelectedPack(null); }}
              style={{
                padding: '12px 30px',
                borderRadius: '12px',
                border: isLightMode ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
                background: isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                color: themeTextColor,
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {t('cancel_label')}
            </button>
          </div>
        </div>
      )}

      {/* ⏳ PENDING DIALOG OVERLAY */}
      {billingState === 'pending' && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: isLightMode ? 'rgba(255, 255, 255, 0.98)' : 'rgba(10, 5, 25, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          zIndex: 2300,
          borderRadius: '24px',
          padding: '24px',
          textAlign: 'center',
          animation: 'fadeIn 0.2s ease'
        }}>
          <Clock size={64} color="#f59e0b" style={{ filter: 'drop-shadow(0 0 15px rgba(245,158,11,0.4))' }} />
          <h2 style={{ fontSize: '22px', fontWeight: '900', color: themeTextColor }}>{t('purchase_pending')}</h2>
          <p style={{ fontSize: '14px', color: themeSubColor, maxWidth: '340px' }}>
            {t('purchase_pending_desc')}
          </p>

          <button
            onClick={() => { playClick(); setBillingState('idle'); setSelectedPack(null); }}
            style={{
              padding: '12px 40px',
              borderRadius: '12px',
              border: 'none',
              background: '#f59e0b',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(245,158,11,0.3)',
              transition: 'all 0.2s'
            }}
          >
            {t('got_it')}
          </button>
        </div>
      )}

      {/* Animations styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      ` }} />
    </div>
  );
};
