import React from 'react';
import { Capacitor } from '@capacitor/core';

interface SupportModalProps {
  isSupportOpen: boolean;
  isLightMode: boolean;
  onClose: () => void;
  supportName: string;
  setSupportName: (val: string) => void;
  supportEmail: string;
  setSupportEmail: (val: string) => void;
  userProfile: any;
  supportSubject: string;
  setSupportSubject: (val: string) => void;
  supportDescription: string;
  setSupportDescription: (val: string) => void;
  isSubmittingSupport: boolean;
  handleSupportSubmit: (e: React.FormEvent) => void;
  mathQuestion: { question: string; answer: number };
  setSupportCaptchaChecked: (val: boolean) => void;
  triggerSound: (name: any) => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  isSupportOpen,
  isLightMode,
  onClose,
  supportName,
  setSupportName,
  supportEmail,
  setSupportEmail,
  userProfile,
  supportSubject,
  setSupportSubject,
  supportDescription,
  setSupportDescription,
  isSubmittingSupport,
  handleSupportSubmit,
  mathQuestion,
  setSupportCaptchaChecked,
  triggerSound,
}) => {
  if (!isSupportOpen) return null;

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
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Close Button */}
        <button 
          onClick={() => { triggerSound('click'); onClose(); }}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: isLightMode ? '#f1f5f9' : 'rgba(255,255,255,0.08)',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-secondary)',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          âœ•
        </button>
        {/* Header */}
        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
            Get in Touch
          </h3>
        </div>
        {/* Form */}
        <form 
          onSubmit={handleSupportSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          {/* Your Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Your Name</label>
            <input 
              type="text" 
              value={supportName}
              onChange={(e) => setSupportName(e.target.value)}
              placeholder="Enter your name"
              required
              style={{
                background: isLightMode ? '#f1f5f9' : 'rgba(0, 0, 0, 0.25)',
                border: isLightMode ? '1px solid #cbd5e1' : '1px solid var(--border-glass)',
                color: 'var(--text-primary)',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>
          {/* Email Address */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Email Address</label>
            <input 
              type="email" 
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="Enter your email"
              required
              style={{
                background: isLightMode ? '#f1f5f9' : 'rgba(0, 0, 0, 0.25)',
                border: isLightMode ? '1px solid #cbd5e1' : '1px solid var(--border-glass)',
                color: 'var(--text-primary)',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>
          {/* Your ID */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Your ID</label>
            <input 
              type="text" 
              value={userProfile?.id || ''}
              readOnly
              style={{
                background: isLightMode ? '#e2e8f0' : 'rgba(255, 255, 255, 0.05)',
                border: isLightMode ? '1px solid #cbd5e1' : '1px solid var(--border-glass)',
                color: 'var(--text-muted)',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                outline: 'none',
                cursor: 'not-allowed'
              }}
            />
          </div>
          {/* Subject */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Subject</label>
            <input 
              type="text" 
              value={supportSubject}
              onChange={(e) => setSupportSubject(e.target.value)}
              placeholder="What is this regarding?"
              required
              style={{
                background: isLightMode ? '#f1f5f9' : 'rgba(0, 0, 0, 0.25)',
                border: isLightMode ? '1px solid #cbd5e1' : '1px solid var(--border-glass)',
                color: 'var(--text-primary)',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>
          {/* Describe the Issue */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Describe the Issue</label>
            <textarea 
              value={supportDescription}
              onChange={(e) => setSupportDescription(e.target.value)}
              placeholder="Tell us what's happening..."
              required
              rows={4}
              style={{
                background: isLightMode ? '#f1f5f9' : 'rgba(0, 0, 0, 0.25)',
                border: isLightMode ? '1px solid #cbd5e1' : '1px solid var(--border-glass)',
                color: 'var(--text-primary)',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>
          {Capacitor.isNativePlatform() ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                {mathQuestion.question} =
              </span>
              <input
                type="number"
                placeholder="?"
                onChange={(e) => {
                  if (parseInt(e.target.value) === mathQuestion.answer) {
                    setSupportCaptchaChecked(true);
                  } else {
                    setSupportCaptchaChecked(false);
                  }
                }}
                style={{ width: '60px', padding: '6px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-glass)', color: 'var(--text-primary)', textAlign: 'center', fontSize: '14px' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Verify you are human</span>
            </div>
          ) : (
            <div id="recaptcha-container" />
          )}
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmittingSupport}
            style={{
              background: 'var(--color-primary)',
              color: '#ffffff',
              padding: '12px',
              borderRadius: '12px',
              cursor: isSubmittingSupport ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              border: 'none',
              transition: 'all 0.2s',
              marginTop: '6px',
              opacity: isSubmittingSupport ? 0.7 : 1
            }}
            className="btn-hover-bright"
          >
            {isSubmittingSupport ? 'Sending...' : 'Send Message'}
          </button>
        </form>
        <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
          We'll get back to you as soon as possible!
        </div>
      </div>
    </div>
  );
};
