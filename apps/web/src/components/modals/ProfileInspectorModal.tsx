import React from 'react';
import { Copy, Check } from 'lucide-react';

interface ProfileInspectorModalProps {
  isUserViewBoxOpen: boolean;
  selectedAdminUser: any;
  isLightMode: boolean;
  onClose: () => void;
  triggerSound: (name: any) => void;
  copiedProfileId: boolean;
  copiedIpAddress: boolean;
  copyToClipboard: (text: string, type: 'id' | 'ip') => void;
  fetchAdminFriends: (userId: string) => void;
  setIsAdminFriendsModalOpen: (open: boolean) => void;
  leaderboard: any[];
  onDeleteProfile: () => void;
}

export const ProfileInspectorModal: React.FC<ProfileInspectorModalProps> = ({
  isUserViewBoxOpen,
  selectedAdminUser,
  isLightMode,
  onClose,
  triggerSound,
  copiedProfileId,
  copiedIpAddress,
  copyToClipboard,
  fetchAdminFriends,
  setIsAdminFriendsModalOpen,
  leaderboard,
  onDeleteProfile,
}) => {
  if (!isUserViewBoxOpen || !selectedAdminUser) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(15, 23, 42, 0.8)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(10px)',
      fontFamily: "'Outfit', sans-serif",
      animation: 'fadeIn 0.25s ease-out'
    }}>
      <div className="glass-panel animate-scale-up" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '24px',
        borderRadius: '24px',
        border: isLightMode ? '1px solid #e5e7eb' : '1px solid rgba(139, 92, 246, 0.3)',
        background: isLightMode ? 'linear-gradient(135deg, #ffffff, #f9fafb)' : 'linear-gradient(135deg, rgba(30, 27, 75, 0.95), rgba(15, 12, 40, 0.95))',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: isLightMode ? '0 20px 40px rgba(0, 0, 0, 0.06)' : '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 50px rgba(139, 92, 246, 0.15)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isLightMode ? '1px solid #e5e7eb' : '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            ðŸ‘¤ Profile Inspector
          </h3>
          <button 
            onClick={() => { triggerSound('click'); onClose(); }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1,
              transition: 'color 0.2s'
            }}
            className="close-hover"
          >
            âœ•
          </button>
        </div>
        {/* Profile Avatar and Frame Display */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px 0' }}>
          <div 
            className={`avatar-frame-showcase ${selectedAdminUser.frame || 'none'}`}
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              background: isLightMode ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.05)',
              border: isLightMode ? '2px solid rgba(0, 0, 0, 0.08)' : '2px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            {selectedAdminUser.avatar || 'ðŸ‘¤'}
          </div>
          <span style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: selectedAdminUser.nameColor || 'var(--text-primary)',
            textShadow: selectedAdminUser.nameColor ? '0 0 10px rgba(255,255,255,0.1)' : 'none'
          }}>
            {selectedAdminUser.username}
          </span>
        </div>
        {/* Detailed Properties Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Profile ID</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', maxWidth: '60%' }}>
              <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '11px', wordBreak: 'break-all', textAlign: 'right' }}>
                {selectedAdminUser.id}
              </span>
              <button
                onClick={() => copyToClipboard(selectedAdminUser.id, 'id')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: copiedProfileId ? '#10b981' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.2s'
                }}
                title="Copy Profile ID"
              >
                {copiedProfileId ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Login Method</span>
            <span style={{ 
              color: selectedAdminUser.email ? '#3b82f6' : '#10b981', 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {selectedAdminUser.email ? 'ðŸŒ Google Account' : 'ðŸ‘¤ Guest Player'}
            </span>
          </div>
          {/* IP Address */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>IP Address</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#f59e0b', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '11px' }}>
                {selectedAdminUser.ipAddress || 'N/A'}
              </span>
              {selectedAdminUser.ipAddress && (
                <button
                  onClick={() => copyToClipboard(selectedAdminUser.ipAddress, 'ip')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: copiedIpAddress ? '#10b981' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'color 0.2s'
                  }}
                  title="Copy IP Address"
                >
                  {copiedIpAddress ? <Check size={12} /> : <Copy size={12} />}
                </button>
              )}
            </div>
          </div>
          {/* Region & Country */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Region / Country</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
              ðŸ“ {selectedAdminUser.region ? `${selectedAdminUser.region}, ${selectedAdminUser.country}` : 'India'}
            </span>
          </div>
          {/* Games Played / Won */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Games Played / Won</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
              {selectedAdminUser.statistics?.gamesPlayed || 0} / {selectedAdminUser.statistics?.gamesWon || 0} (Winrate: {selectedAdminUser.statistics?.gamesPlayed ? Math.round(((selectedAdminUser.statistics.gamesWon || 0) / selectedAdminUser.statistics.gamesPlayed) * 100) : 0}%)
            </span>
          </div>
          {/* Total Solving Time */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Solve Time</span>
            <span style={{ color: '#06b6d4', fontWeight: 'bold' }}>
              â±ï¸ {(() => {
                const totalSecs = Math.round(selectedAdminUser.statistics?.totalSolveTime || 0);
                if (totalSecs >= 3600) {
                  const hrs = Math.floor(totalSecs / 3600);
                  const mins = Math.floor((totalSecs % 3600) / 60);
                  return `${hrs} hr ${mins} min`;
                } else if (totalSecs >= 60) {
                  const mins = Math.floor(totalSecs / 60);
                  const secs = totalSecs % 60;
                  return `${mins} min ${secs} sec`;
                } else {
                  return `${totalSecs} sec${totalSecs !== 1 ? 's' : ''}`;
                }
              })()}
            </span>
          </div>
          {/* Friends Count (clickable to view list of friends) */}
          <div 
            onClick={() => {
              triggerSound('click');
              fetchAdminFriends(selectedAdminUser.id);
              setIsAdminFriendsModalOpen(true);
            }}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              background: isLightMode ? 'rgba(139, 92, 246, 0.05)' : 'rgba(139, 92, 246, 0.1)',
              border: '1px dashed rgba(139, 92, 246, 0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            className="badge-hover"
            title="Click to view all friends"
          >
            <span style={{ color: 'var(--text-muted)' }}>Friends</span>
            <span style={{ color: 'var(--color-primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ðŸ‘¥ {selectedAdminUser.friendsCount !== undefined ? selectedAdminUser.friendsCount : 0} (Click to View)
            </span>
          </div>
          {/* Level & XP Progress */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 12px', background: isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Level</span>
              <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>
                Level {selectedAdminUser.level || 1}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
              <span>XP Progress</span>
              <span>{selectedAdminUser.xp || 0} / {(selectedAdminUser.level || 1) * 100} XP ({Math.floor(((selectedAdminUser.xp || 0) / ((selectedAdminUser.level || 1) * 100)) * 100)}%)</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: isLightMode ? '#e2e8f0' : 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${Math.max(0, Math.min(100, ((selectedAdminUser.xp || 0) / ((selectedAdminUser.level || 1) * 100)) * 100))}%`, 
                height: '100%', 
                background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' 
              }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Rank Tier</span>
            <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>
              ðŸ† {selectedAdminUser.rank || 'BRONZE'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Points (pts)</span>
            <span style={{ color: '#10b981', fontWeight: 'bold' }}>
              â­ {selectedAdminUser.score || 0} pts
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Leaderboard Rank</span>
            <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>
              {(() => {
                const idx = leaderboard.findIndex(e => e.userId === selectedAdminUser.id);
                return idx >= 0 ? `#${idx + 1}` : 'Unranked';
              })()}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: isLightMode ? 'rgba(234, 179, 8, 0.04)' : 'rgba(234, 179, 8, 0.08)', border: isLightMode ? '1px solid rgba(234, 179, 8, 0.15)' : '1px solid rgba(234, 179, 8, 0.2)', borderRadius: '8px' }}>
              <span style={{ color: isLightMode ? 'rgba(150, 100, 0, 0.85)' : 'rgba(234, 179, 8, 0.8)' }}>Coins</span>
              <span style={{ color: '#eab308', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}>
                ðŸª™ {selectedAdminUser.coins || 0}
              </span>
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: isLightMode ? 'rgba(168, 85, 247, 0.04)' : 'rgba(168, 85, 247, 0.08)', border: isLightMode ? '1px solid rgba(168, 85, 247, 0.15)' : '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '8px' }}>
              <span style={{ color: isLightMode ? 'rgba(110, 30, 180, 0.85)' : 'rgba(168, 85, 247, 0.8)' }}>Gems</span>
              <span style={{ color: '#a855f7', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}>
                ðŸ’Ž {selectedAdminUser.gems || 0}
              </span>
            </div>
          </div>
          {/* ðŸŽ® GAME STATISTICS: Best Times & Time Spent */}
          {selectedAdminUser.statistics?.puzzleSpecificStats && (
            <div style={{ marginTop: '6px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ðŸŽ® Game Statistics
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {Object.entries(selectedAdminUser.statistics.puzzleSpecificStats as Record<string, any>).map(([gameKey, stats]: [string, any]) => {
                  const gameName = gameKey.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
                  const played = stats?.played || 0;
                  if (played === 0) return null;
                  const bestTime = stats?.bestTime;
                  const timeSpent = stats?.timeSpent;
                  return (
                    <div key={gameKey} style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto auto',
                      gap: '8px',
                      padding: '6px 10px',
                      background: isLightMode ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
                      borderRadius: '6px',
                      alignItems: 'center',
                      fontSize: '11px'
                    }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{gameName}</span>
                      <span style={{ color: '#10b981', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                        ðŸ† {bestTime != null ? `${bestTime.toFixed(1)}s` : 'â€”'}
                      </span>
                      <span style={{ color: '#8b5cf6', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                        â±ï¸ {timeSpent != null ? (timeSpent >= 60 ? `${Math.floor(timeSpent / 60)}m ${Math.round(timeSpent % 60)}s` : `${Math.round(timeSpent)}s`) : 'â€”'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {/* Footer Actions */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <button
            onClick={() => { triggerSound('click'); onClose(); }}
            style={{
              flex: 1,
              background: isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
              border: isLightMode ? '1px solid #d1d5db' : '1px solid var(--border-glass)',
              color: isLightMode ? '#1f2937' : 'var(--text-primary)',
              padding: '10px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
            className="btn-hover-bright"
          >
            Close Inspector
          </button>
          <button
            onClick={onDeleteProfile}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              padding: '10px 16px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ðŸ—‘ï¸ Delete
          </button>
        </div>
      </div>
    </div>
  );
};
