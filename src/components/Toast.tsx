'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type, duration = 4500, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const config = {
    success: {
      icon: <CheckCircle size={18} style={{ color: '#1D9E75', flexShrink: 0 }} />,
      bg: 'var(--color-background-primary)',
      border: 'var(--color-border-secondary)',
    },
    error: {
      icon: <XCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />,
      bg: '#fef2f2',
      border: '#fecaca',
    },
    info: {
      icon: <AlertCircle size={18} style={{ color: '#378ADD', flexShrink: 0 }} />,
      bg: 'var(--color-background-info)',
      border: 'var(--color-border-secondary)',
    },
  };

  const current = config[type];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '14px 16px',
        borderRadius: '12px',
        border: `1px solid ${current.border}`,
        backgroundColor: current.bg,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        zIndex: 9999,
        maxWidth: '380px',
        minWidth: '260px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.25s, transform 0.25s',
      }}
    >
      <div style={{ marginTop: '1px' }}>{current.icon}</div>

      <p style={{
        flex: 1,
        fontSize: '13px',
        lineHeight: '1.5',
        color: 'var(--color-text-primary)',
        margin: 0,
      }}>
        {message}
      </p>

      <button
        onClick={() => { setVisible(false); setTimeout(onClose, 250); }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text-secondary)',
          padding: '1px',
          flexShrink: 0,
          marginTop: '1px',
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}